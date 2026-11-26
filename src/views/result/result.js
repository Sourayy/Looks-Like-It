import React, { useEffect } from "react";

import { Button } from "components/SketchGame/components/Button";
import { Logo } from "components/SketchGame/components/Logo";

import { useLocalStorage } from "components/SketchGame/hooks";
import { GameSFX } from "components/SketchGame/utils/sounds.js";

import Typed from 'typed.js';
const typedConfig = {
  typeSpeed: 20,
  startDelay: 500
};

export const Result = (props) => {

  const { score, noRounds, msgs, history = [] } = props.location.state;
  const [ soundOn ] = useLocalStorage("soundOn");

  // Set all the scores
  const scoreFactored = Math.round(score / noRounds * 10);
  
  let wonPerfect = false;
  let wonHigh = false;
  let wonLow = false;
  let loseLow = false;
  // let loseHigh = false;

  if (scoreFactored === 10) wonPerfect = true
  else if (scoreFactored >= 8) wonHigh = true
  else if (scoreFactored >= 6) wonLow = true
  // else if (scoreFactored >= 4) loseHigh = true
  else loseLow = true;

  const msg = (() => {
    if (wonPerfect) return msgs.win.perfect
    else if (wonHigh) return msgs.win.high
    else if (wonLow) return msgs.win.low
    else if (loseLow) return msgs.lose.low.replace("{{score}}", scoreFactored)
    else return msgs.lose.high; // Loseerrrrrr with big L
  })();

  useEffect(() => {
    let soundFX = "";
    if (wonHigh || wonLow || wonPerfect)
      soundFX = msgs.win.sound
    else 
      soundFX = msgs.lose.sound;
      
    setTimeout(() =>
      GameSFX.play(soundFX, soundOn)
    , 1000);

    // mount:
    let typed = new Typed(
      '.typed-msg', {
        ...typedConfig, 
        strings: [msg]
      },
    );

    // cleanup:
    return () => {
      typed.destroy();
    }
  }, [msg, msgs.lose.sound, msgs.win.sound, soundOn, wonHigh, wonLow, wonPerfect]);  
  
  return (
    <div className="h-100 d-flex align-items-center py-4">
      <div className="container-sm">
        <Logo />
        <div className="lli-panel">
          <div className="lli-card is-accent mb-3">
            <div className="d-flex align-items-center justify-content-around flex-wrap">
              <Icon {...{ wonHigh, wonLow, wonPerfect }}/>
              <div className="text-center">
                <div className="eyebrow">Avaliação</div>
                <Rating {...{ scoreFactored }}/>
              </div>
              <div className="text-center">
                <div className="eyebrow">Pontuação</div>
                <div className="lli-score">{ score } / { noRounds }</div>
              </div>
            </div>
          </div>

          <div className="lli-message">
            <div className="eyebrow">Resultado</div>
            <span className="typed-msg"></span>
          </div>

          { history.length > 0 && (
            <div className="lli-card is-soft mt-3">
              <div className="eyebrow">Rodada a rodada</div>
              <ul className="lli-rounds">
                { history.map(r => (
                  <li key={ r.index } className={ r.hit ? "is-hit" : "is-miss" }>
                    <b>{ r.hit ? "✓ Acerto" : "✗ Erro" }</b> — Rodada { r.index + 1 }: { r.label }
                    { !r.hit && <span className="text-muted-lli"> (o jogo viu { r.guess })</span> }
                  </li>
                )) }
              </ul>
            </div>
          ) }

          <div className="pt-4">
            <Button 
              route="/game"
              label="Jogar de novo"
              buttonClassName="is-primary"
            />
            <Button 
              route="/home"
              label="Início" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// too minor to be in it's own file
// estrelas: 10 pontos = 5 estrelas (meia estrela a cada ponto)
const Rating = ({ scoreFactored }) => {
  return [0, 1, 2, 3, 4].map(i => {
    const fill = Math.min(1, Math.max(0, (scoreFactored - i * 2) / 2));
    return (
      <span key={ i } className="lli-star" aria-hidden="true">
        ★<span className="fg" style={{ width: fill * 100 + "%" }}>★</span>
      </span>
    );
  });
}

// too minor to be in it's own file
const Icon = ({ wonPerfect, wonHigh, wonLow }) => {
  if (wonPerfect || wonHigh) return <div className="lli-medal" aria-hidden="true">🏆</div>;
  if (wonLow) return <div className="lli-medal" aria-hidden="true">🎯</div>;
  return null;
};
