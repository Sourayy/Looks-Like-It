# Looks Like It ✏️🤖

Jogo de desenho em várias rodadas: o jogo pede um objeto, você desenha em 20 segundos e uma rede neural tenta reconhecer o que você desenhou. Dá para desenhar com o **mouse** ou **no ar, com a webcam**, usando rastreamento de mão.

Esta versão é uma adaptação do projeto [react-sketchgame](https://github.com/jv-k/react-sketchgame), de John Valai. As categorias foram trocadas por **formas geométricas, nuvem e flor** (desenhos fáceis), e o modelo de IA foi treinado de novo para elas.

> 🎬 **Vídeo demonstrativo:** [▶️ Assistir (video/demonstracao.mp4)](video/demonstracao.mp4)

![Tela do jogo](imgs/tela-jogo.png)
<!-- Troque pelos seus prints/GIF. Veja a seção "Imagens" no fim deste arquivo. -->

## Sumário

- [Como o jogo funciona](#como-o-jogo-funciona)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Desenhar no ar com a webcam](#desenhar-no-ar-com-a-webcam)
- [Como o modelo foi treinado](#como-o-modelo-foi-treinado)
- [Treinar de novo ou trocar as categorias](#treinar-de-novo-ou-trocar-as-categorias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Problemas comuns](#problemas-comuns)
- [Equipe](#equipe)
- [Créditos e licença](#créditos-e-licença)

## Como o jogo funciona

1. Na tela inicial, clique em **Play Game**.
2. A cada rodada o jogo pede um desenho, por exemplo "uma estrela", e você tem **20 segundos** para desenhar.
3. Quando o tempo acaba (ou você avança), o modelo analisa o desenho. Se ele reconhecer o objeto pedido, você ganha um ponto.
4. Cada categoria aparece uma vez, em ordem aleatória. Com 7 categorias, o jogo tem **7 rodadas**.
5. No fim, a tela de resultado mostra a pontuação e se você ganhou ou perdeu.

**Categorias:** círculo, quadrado, triângulo, estrela, losango, nuvem e flor.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Interface | React 16, React Router 5, Bootstrap 4, Sass |
| Reconhecimento do desenho | TensorFlow.js 4.22 (rede neural convolucional rodando no navegador) |
| Desenho no ar | MediaPipe Hands (arquivos locais em `public/mediapipe`) |
| Animações e sons | Typed.js, Tone.js |
| Treino do modelo | Python, TensorFlow/Keras, OpenCV, dados do Quick, Draw! |

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) **18 ou superior** e npm. O projeto foi compilado com o Node 24.
- Um navegador atual (Chrome recomendado).
- Webcam, só se quiser desenhar no ar. Com o mouse ela não é necessária.

Não precisa de Python para **jogar**. O Python só é usado para treinar o modelo de novo.

### Passo a passo

```bash
# 1. Baixe o projeto
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO

# 2. Instale as dependências
npm install

# 3. Rode o jogo
npm start
```

O navegador abre sozinho em `http://localhost:3000`.

Se o `npm install` acusar conflito de versões (`ERESOLVE`), use:

```bash
npm install --legacy-peer-deps
```

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm start` | Roda o jogo em modo de desenvolvimento |
| `npm run build` | Gera a versão final na pasta `build/` |
| `npm test` | Roda os testes de interface |
| `npm run deploy` | Publica a pasta `build/` no GitHub Pages (precisa do repositório configurado) |

## Desenhar no ar com a webcam

O jogo pode ser jogado com a webcam no lugar do mouse. Permita o acesso à câmera quando o navegador pedir (funciona em `localhost` ou `https`). Sem câmera, o mouse continua funcionando.

| Gesto | Ação |
|---|---|
| Só o dedo indicador levantado | Desenhar |
| Indicador e médio levantados | Mover sem desenhar |
| Mão aberta por 1 segundo | Limpar o quadro |

O quadrado verde na imagem da câmera mostra a área que corresponde ao quadro de desenho. O tempo da rodada só começa a contar depois que a câmera está pronta.

Os arquivos do MediaPipe ficam em `public/mediapipe/`, então o rastreamento de mão não depende de um CDN externo. **Não apague essa pasta.**

## Como o modelo foi treinado

O jogo não envia o desenho completo ao modelo. A cada rodada ele pega o quadro de desenho (300×300 pixels, traço preto de 12 px em fundo branco), reduz para **28×28** pixels em tons de cinza e normaliza os valores para o intervalo de 0 a 1.

**Rede neural** (saída com uma probabilidade por categoria):

```
Entrada 28×28×1
→ Conv2D 32 filtros 5×5 (passo 2) → MaxPooling 2×2
→ Conv2D 32 filtros 3×3           → MaxPooling 2×2
→ Flatten → Dense (7, softmax)
```

**Dados:** desenhos do [Quick, Draw!](https://github.com/googlecreativelab/quickdraw-dataset) (versão `simplified`, em traços). Em vez de usar os bitmaps prontos, o script de treino **redesenha cada exemplo do mesmo jeito que o jogo**: mesmo tamanho de quadro, mesma espessura de traço e mesma redução para 28×28. Assim o modelo treina com imagens iguais às que vai receber de quem joga. Também há pequenas variações de tamanho, posição, rotação e espelhamento.

**Resultado:** acerto de validação de **[PREENCHA COM O VALOR QUE O TREINO MOSTROU NO TERMINAL]**.

**Exportação:** o script grava `model.json` e `group1-shard1of1`, o formato que o TensorFlow.js carrega.

## Treinar de novo ou trocar as categorias

Tudo fica na pasta `treino/`. Este passo é opcional: o modelo já treinado está em `public/assets/models/`.

1. Instale o **Python 3.12** (versões muito novas do Python ainda não têm TensorFlow disponível).
2. Crie um ambiente virtual e instale as dependências:

   ```bash
   cd treino
   py -3.12 -m venv .venv          # Windows
   .venv\Scripts\Activate.ps1      # Windows (PowerShell)
   # Linux/macOS: python3.12 -m venv .venv && source .venv/bin/activate

   pip install -r requirements.txt
   ```

3. (Opcional) Para mudar as categorias, edite a lista `CATEGORIES` no início de `train_quickdraw.py`. Cada item tem o nome no Quick, Draw! e o texto que aparece no jogo. Os nomes válidos estão na [lista oficial de categorias](https://github.com/googlecreativelab/quickdraw-dataset/blob/master/categories.txt).
4. Treine:

   ```bash
   python train_quickdraw.py
   ```

   Opções úteis: `--samples 20000` (desenhos por categoria) e `--epochs 15`.
5. O treino cria a pasta `treino/saida/`. Copie os arquivos para o jogo:

   | De `treino/saida/` | Para |
   |---|---|
   | `model.json` | `public/assets/models/model.json` |
   | `group1-shard1of1` | `public/assets/models/group1-shard1of1` |
   | `labels.json` | `src/labels.json` |

6. Rode `npm start` de novo. O número de rodadas acompanha a quantidade de categorias.

A **ordem** das categorias em `labels.json` precisa ser a mesma do treino. O script já gera o arquivo na ordem certa, então não edite à mão.

## Estrutura do projeto

```
.
├── public/
│   ├── assets/
│   │   ├── models/          # modelo treinado (model.json + pesos)
│   │   └── sounds/          # efeitos sonoros
│   ├── mediapipe/           # rastreamento de mão (arquivos locais)
│   └── index.html
├── src/
│   ├── components/SketchGame/
│   │   ├── components/      # canvas, câmera, cartões de pergunta e resposta
│   │   ├── hooks/           # rodadas, timer, desenho no ar, decisão da rodada
│   │   ├── providers/       # contexto do jogo
│   │   ├── utils/           # pré-processamento do desenho, rastreador de mão
│   │   └── SketchGame.config.js   # tempo, mensagens e categorias
│   ├── views/               # telas: início, jogo e resultado
│   └── labels.json          # nomes das categorias (mesma ordem do modelo)
├── treino/
│   ├── train_quickdraw.py   # treina e exporta o modelo
│   └── requirements.txt
├── imgs/                    # prints e GIF usados neste README
├── video/                   # vídeo demonstrativo (demonstracao.mp4)
├── package.json
└── README.md
```

## Problemas comuns

| Problema | O que fazer |
|---|---|
| `'cross-env' não é reconhecido` | Falta instalar as dependências. Rode `npm install`. |
| `npm install` falha com `ERESOLVE` | Use `npm install --legacy-peer-deps`. |
| Erro estranho de módulo ausente (por exemplo `isexe`) | Apague a pasta `node_modules` e rode `npm install` de novo. |
| Fica em "Iniciando a câmera..." | Permita a câmera no navegador. Sem câmera, use o mouse. |
| Mostra categorias antigas ou não carrega o modelo | Atualize com **Ctrl+Shift+R** para limpar o cache. |
| `pip install` não acha o TensorFlow | Use o Python 3.12 no ambiente virtual do treino. |

## Equipe

- Davi Freire Zanatta
- Gabriela Ribeiro Batista
- Gabrielle do Carmo Assunção
- Rayara Sousa Carvalho

## Créditos e licença

- Jogo original: [react-sketchgame](https://github.com/jv-k/react-sketchgame), de **John Valai**, licença MIT. Esta versão altera as categorias, o modelo de IA, o desenho no ar com a webcam e as mensagens em português.
- Dados de treino: [Quick, Draw!](https://github.com/googlecreativelab/quickdraw-dataset), do Google, licença CC BY 4.0.
- Rastreamento de mão: [MediaPipe Hands](https://developers.google.com/mediapipe), do Google, licença Apache 2.0.

Este projeto é distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).

## Imagens

Para as imagens deste README, salve prints (ou um GIF) do seu jogo na pasta `imgs/` e ajuste os nomes no topo deste arquivo. Sugestão: tela inicial, uma rodada com o desenho e a tela de resultado.
