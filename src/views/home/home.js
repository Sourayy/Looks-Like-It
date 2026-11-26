import React from "react";

import { Logo } from "components/SketchGame/components/Logo";
import { Button } from "components/SketchGame/components/Button";
import { Checkbox } from "components/SketchGame/components/Checkbox/Checkbox";

import { useLocalStorage } from "components/SketchGame/hooks";

import { GameSFX } from "components/SketchGame/utils/sounds.js";

export const Home = () => {

  // save to local storage so that components that use SFX can respect the app setting:
  const [ soundOn, setSoundOn ] = useLocalStorage("soundOn");
  if (soundOn === undefined) setSoundOn(true);

  return (
    <div className="h-100 d-flex align-items-center py-4">
      <div className="container-sm">
        <Logo
          eyebrow="PUC Minas • Campus Poços de Caldas"
          subtitle="Jogo interativo de desenho no ar com visão computacional e inteligência artificial"
        />

        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="lli-card is-accent h-100">
              <div className="eyebrow">Como jogar</div>
              <ol className="lli-list">
                <li>O jogo sorteia o objeto que você deve desenhar.</li>
                <li>Desenhe no ar com o dedo indicador, na frente da webcam.</li>
                <li>A IA analisa o seu traço e confere se parece com o objeto.</li>
                <li>Acertou? Ganha ponto. Depois vem uma nova rodada.</li>
              </ol>
              <p className="text-muted-lli mt-2 mb-0">
                1 dedo desenha • 2 dedos movem • palma aberta limpa
              </p>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="lli-card h-100">
              <div className="eyebrow">Equipe de desenvolvimento</div>
              <ul className="lli-team">
                <li>Davi Freire Zanatta</li>
                <li>Gabriela Batista Ribeiro</li>
                <li>Gabrielle do Carmo Assunção</li>
                <li>Rayara Sousa Carvalho</li>
              </ul>
              <p className="text-muted-lli mt-2 mb-0">
                Visão Computacional e Realidade Misturada • Ciência da Computação<br />
                Orientador: Prof. Will Ricardo dos Santos Machado
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center mt-2">
          <Checkbox 
            isChecked={ soundOn } 
            onChange={ setSoundOn }
            id="option-sound"
          />
          <Button 
            route="/game"
            click={() => {
              GameSFX.play("click", soundOn);
              GameSFX.play("theme", soundOn);
            }}
            id="btn-play"
            label="Jogar →" 
            buttonClassName="is-primary"
          />
        </div>

        <p className="text-muted-lli text-center mt-4 mb-0">
          Inspirado em Quick, Draw! (Google), react-sketchgame e AirSketch.
        </p>
      </div>
    </div>
  );
}
