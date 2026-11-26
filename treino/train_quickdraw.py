#!/usr/bin/env python3
"""
Treina o modelo do jogo "Looks Like It" com categorias do Quick, Draw!
e exporta no formato que o jogo (TensorFlow.js 1.5.2) consegue carregar.

Uso:
    pip install -r requirements.txt
    python train_quickdraw.py                # baixa os dados, treina e exporta para ./saida/
    python train_quickdraw.py --samples 20000 --epochs 15

Saída (pasta ./saida/):
    model.json, group1-shard1of1  -> copiar para  public/assets/models/
    labels.json                   -> copiar para  src/labels.json

Por que este script desenha os traços em vez de usar os bitmaps prontos (.npy)?
O jogo NÃO entrega ao modelo um bitmap do Quick, Draw!. Ele pega o canvas 300x300
(fundo branco, traço preto de 12px), reduz para 28x28 por vizinho mais próximo,
tira a média dos canais RGB e divide por 255 (ver src/utils/utils.js). Para o
modelo aprender exatamente o que vai ver no jogo, os desenhos do Quick, Draw!
são renderizados aqui do mesmo jeito.
"""
import argparse
import json
import os
import sys
import urllib.request

import cv2
import numpy as np

# ---------------------------------------------------------------------------
# CATEGORIAS: (nome no Quick, Draw!, texto que aparece no jogo)
# A ORDEM daqui = ordem das classes do modelo = ordem do labels.json.
# Para trocar/adicionar categorias, edite só esta lista e treine de novo.
# Nomes válidos: https://github.com/googlecreativelab/quickdraw-dataset/blob/master/categories.txt
# ---------------------------------------------------------------------------
CATEGORIES = [
    ("circle",   "um círculo"),
    ("square",   "um quadrado"),
    ("triangle", "um triângulo"),
    ("star",     "uma estrela"),
    ("diamond",  "um losango"),
    ("cloud",    "uma nuvem"),
    ("flower",   "uma flor"),
]

CANVAS = 300      # tamanho do <canvas> do jogo
PEN = 12          # lineWidth do jogo
SIZE = 28         # entrada do modelo
URL = "https://storage.googleapis.com/quickdraw_dataset/full/simplified/{}.ndjson"

# Índices que o tf.image.resizeNearestNeighbor (tfjs 1.x, sem alignCorners) usa:
# floor(i * 300 / 28)
SRC_IDX = np.floor(np.arange(SIZE) * (CANVAS / SIZE)).astype(int)


# ------------------------------- dados -------------------------------------
def load_drawings(name, n, data_dir):
    """Lê os n primeiros desenhos 'recognized' de uma categoria.
    Usa <data_dir>/<name>.ndjson se existir; senão faz streaming da URL oficial
    (para de baixar assim que junta n desenhos, não baixa o arquivo inteiro)."""
    local = os.path.join(data_dir, name + ".ndjson") if data_dir else None
    if local and os.path.exists(local):
        stream = open(local, "rb")
        print(f"  [{name}] lendo {local}")
    else:
        print(f"  [{name}] baixando (streaming) ...")
        stream = urllib.request.urlopen(URL.format(name), timeout=60)

    drawings = []
    with stream:
        for line in stream:
            item = json.loads(line)
            if item.get("recognized", True):
                drawings.append(item["drawing"])
                if len(drawings) >= n:
                    break
    if len(drawings) < n:
        print(f"  [{name}] aviso: só {len(drawings)} desenhos disponíveis")
    return drawings


# ----------------------------- renderização --------------------------------
def render(drawing, rng):
    """Desenha um exemplo do Quick, Draw! como o jogador desenharia no canvas
    e devolve o array 28x28 float32 em [0,1] (branco=1, traço=0)."""
    pts = [np.stack([np.asarray(s[0], float), np.asarray(s[1], float)], 1) for s in drawing]
    allp = np.concatenate(pts)

    # leve rotação + espelhamento horizontal (o jogador não desenha igualzinho)
    ang = np.deg2rad(rng.uniform(-12, 12))
    rot = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]])
    center = (allp.min(0) + allp.max(0)) / 2
    flip = -1.0 if rng.random() < 0.5 else 1.0
    pts = [((p - center) * [flip, 1.0]) @ rot.T for p in pts]
    allp = np.concatenate(pts)

    # encaixa o desenho numa caixa de tamanho aleatório (jogador desenha grande ou pequeno)
    w, h = np.ptp(allp[:, 0]) + 1e-6, np.ptp(allp[:, 1]) + 1e-6
    box = rng.uniform(0.45, 0.95) * CANVAS
    scale = box / max(w, h)
    margin = PEN / 2 + 2
    cx = np.clip(CANVAS / 2 + rng.uniform(-0.08, 0.08) * CANVAS, margin + w * scale / 2, CANVAS - margin - w * scale / 2)
    cy = np.clip(CANVAS / 2 + rng.uniform(-0.08, 0.08) * CANVAS, margin + h * scale / 2, CANVAS - margin - h * scale / 2)
    mid = (allp.min(0) + allp.max(0)) / 2
    pts = [(p - mid) * scale + [cx, cy] for p in pts]

    img = np.full((CANVAS, CANVAS), 255, np.uint8)       # fundo branco
    pen = int(rng.choice([11, 12, 12, 12, 13]))          # pequena variação de espessura
    for p in pts:
        q = np.round(p).astype(np.int32)
        for a, b in zip(q[:-1], q[1:]):
            cv2.line(img, tuple(int(v) for v in a), tuple(int(v) for v in b), 0, pen, cv2.LINE_AA)
        for v in q:  # pontas/juntas arredondadas (lineJoin = "round")
            cv2.circle(img, (int(v[0]), int(v[1])), pen // 2, 0, -1, cv2.LINE_AA)

    small = img[np.ix_(SRC_IDX, SRC_IDX)]                # vizinho mais próximo, igual ao tfjs
    return small.astype(np.float32) / 255.0


def build_dataset(data_dir, per_class, seed):
    rng = np.random.default_rng(seed)
    xs, ys = [], []
    for idx, (name, _) in enumerate(CATEGORIES):
        drawings = load_drawings(name, per_class, data_dir)
        print(f"  [{name}] renderizando {len(drawings)} desenhos ...")
        xs.extend(render(d, rng) for d in drawings)
        ys.extend([idx] * len(drawings))
    x = np.stack(xs)[..., None]
    y = np.array(ys, np.int32)
    perm = rng.permutation(len(x))
    return x[perm], y[perm]


# ------------------------------- modelo ------------------------------------
F1, F2 = 32, 32  # filtros das duas camadas convolucionais


def build_keras_model(n_classes):
    import tensorflow as tf
    L = tf.keras.layers
    # Dropout só existe no treino: não tem pesos e não entra no model.json exportado.
    return tf.keras.Sequential([
        L.Input((SIZE, SIZE, 1)),
        L.Conv2D(F1, 5, strides=2, padding="same", activation="relu"),   # 14x14
        L.MaxPooling2D(2),                                               # 7x7
        L.Conv2D(F2, 3, padding="same", activation="relu"),              # 7x7
        L.MaxPooling2D(2),                                               # 3x3
        L.Flatten(),                                                     # 3*3*F2
        L.Dropout(0.3),
        L.Dense(n_classes, activation="softmax"),
    ])


# ------------------------------ exportação ---------------------------------
def _conv(name, filters, k, strides, first=False):
    cfg = {"name": name, "trainable": True}
    if first:
        cfg["batch_input_shape"] = [None, SIZE, SIZE, 1]
    cfg.update({
        "dtype": "float32", "filters": filters, "kernel_size": [k, k], "strides": [strides, strides],
        "padding": "same", "data_format": "channels_last", "dilation_rate": [1, 1],
        "activation": "relu", "use_bias": True,
        "kernel_initializer": {"class_name": "GlorotUniform", "config": {"seed": None, "dtype": "float32"}},
        "bias_initializer": {"class_name": "Zeros", "config": {"dtype": "float32"}},
        "kernel_regularizer": None, "bias_regularizer": None, "activity_regularizer": None,
        "kernel_constraint": None, "bias_constraint": None,
    })
    return {"class_name": "Conv2D", "config": cfg}


def _pool(name):
    return {"class_name": "MaxPooling2D", "config": {
        "name": name, "trainable": True, "dtype": "float32", "pool_size": [2, 2],
        "padding": "valid", "strides": [2, 2], "data_format": "channels_last"}}


def export_tfjs(model, out_dir):
    """Escreve model.json + group1-shard1of1 no MESMO formato (Keras 2.1.6-tf) do modelo
    que já vem no projeto. Isso evita incompatibilidade: o jogo usa tfjs 1.5.2, e o
    tensorflowjs_converter de versões recentes gera um model.json (Keras 3) que o
    tfjs 1.5.2 não lê."""
    n = model.output_shape[-1]
    flat = 3 * 3 * F2
    kc1, bc1, kc2, bc2, kd, bd = [w for w in model.get_weights()]
    assert kd.shape == (flat, n), kd.shape

    layers = [
        _conv("conv2d", F1, 5, 2, first=True),
        _pool("max_pooling2d"),
        _conv("conv2d_1", F2, 3, 1),
        _pool("max_pooling2d_1"),
        {"class_name": "Flatten", "config": {"name": "flatten", "trainable": True,
                                             "dtype": "float32", "data_format": "channels_last"}},
        {"class_name": "Dense", "config": {
            "name": "dense", "trainable": True, "dtype": "float32", "units": n,
            "activation": "softmax", "use_bias": True,
            "kernel_initializer": {"class_name": "GlorotUniform", "config": {"seed": None, "dtype": "float32"}},
            "bias_initializer": {"class_name": "Zeros", "config": {"dtype": "float32"}},
            "kernel_regularizer": None, "bias_regularizer": None, "activity_regularizer": None,
            "kernel_constraint": None, "bias_constraint": None}},
    ]
    named = [("conv2d/kernel", kc1), ("conv2d/bias", bc1), ("conv2d_1/kernel", kc2),
             ("conv2d_1/bias", bc2), ("dense/kernel", kd), ("dense/bias", bd)]

    model_json = {
        "modelTopology": {
            "keras_version": "2.1.6-tf", "backend": "tensorflow",
            "model_config": {"class_name": "Sequential", "config": {"name": "sequential", "layers": layers}},
            "training_config": {
                "optimizer_config": {"class_name": "Adam", "config": {
                    "lr": 0.001, "beta_1": 0.9, "beta_2": 0.999, "decay": 0.0, "epsilon": 1e-07, "amsgrad": False}},
                "loss": "categorical_crossentropy", "metrics": ["acc"],
                "weighted_metrics": None, "sample_weight_mode": None, "loss_weights": None},
        },
        "weightsManifest": [{
            "paths": ["group1-shard1of1"],
            "weights": [{"name": k, "shape": list(w.shape), "dtype": "float32"} for k, w in named],
        }],
    }
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "model.json"), "w") as f:
        json.dump(model_json, f)
    with open(os.path.join(out_dir, "group1-shard1of1"), "wb") as f:
        for _, w in named:
            f.write(np.ascontiguousarray(w, dtype="<f4").tobytes())
    with open(os.path.join(out_dir, "labels.json"), "w", encoding="utf-8") as f:
        json.dump([label for _, label in CATEGORIES], f, ensure_ascii=False, indent=2)
    print(f"\nExportado em {os.path.abspath(out_dir)}/ : model.json, group1-shard1of1, labels.json")


# --------------------------------- main -------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--samples", type=int, default=15000, help="desenhos por categoria (padrão 15000)")
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--data-dir", default=None,
                    help="pasta com <categoria>.ndjson já baixados (opcional; senão baixa em streaming)")
    ap.add_argument("--out", default="saida")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    import tensorflow as tf
    tf.keras.utils.set_random_seed(args.seed)

    print("1/3 Preparando dados ...")
    x, y = build_dataset(args.data_dir, args.samples, args.seed)
    cut = int(len(x) * 0.9)
    xtr, ytr, xva, yva = x[:cut], y[:cut], x[cut:], y[cut:]
    print(f"    treino: {len(xtr)}  validação: {len(xva)}  classes: {len(CATEGORIES)}")

    print("2/3 Treinando ...")
    model = build_keras_model(len(CATEGORIES))
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(xtr, ytr, validation_data=(xva, yva), epochs=args.epochs, batch_size=256, verbose=2)

    pred = model.predict(xva, verbose=0).argmax(1)
    print("\nAcerto por categoria (validação):")
    for i, (name, label) in enumerate(CATEGORIES):
        m = yva == i
        print(f"  {label:<14} {100 * (pred[m] == i).mean():5.1f}%")

    print("3/3 Exportando ...")
    export_tfjs(model, args.out)
    # amostras + probabilidades do Keras, só para conferir depois que o tfjs dá o mesmo resultado
    np.save(os.path.join(args.out, "amostras_validacao.npy"), xva[:64])
    np.save(os.path.join(args.out, "amostras_validacao_probs.npy"), model.predict(xva[:64], verbose=0))


if __name__ == "__main__":
    sys.exit(main())
