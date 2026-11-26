import React from "react";
import { useGameContext, useRoundContext } from "../../hooks";

export const StatusCard = () => {

  const gameState = useGameContext();
  const roundState = useRoundContext();

  const { history, noRounds } = gameState;
  const hits = history.filter(r => r.hit).length;
  const misses = history.length - hits;
  const lastResult = history.find(r => r.index === roundState.index - 1);

  const timeSize = 100 - Math.round((gameState.timeLimit - roundState.timeLeft) / gameState.timeLimit * 100);

  return(
    <div className="lli-card mb-3">
      <div className="d-flex justify-content-between">
        <span className="eyebrow">Rodada { roundState.index + 1 } de { noRounds }</span>
        <span className="eyebrow">{ roundState.timeLeft }s</span>
      </div>
      <div className="lli-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={ timeSize }>
        {/* a barra fica terracota quando restam menos de 20% do tempo */}
        <div className={ "fill" + (timeSize < 20 ? " is-low" : "") } style={{ width: timeSize + "%" }} />
      </div>

      {/* placar: acertos, erros e uma bolinha por rodada */}
      <div className="lli-scoreboard d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <span className="lli-chip is-hit">✓ { hits } { hits === 1 ? "acerto" : "acertos" }</span>
          <span className="lli-chip is-miss">✗ { misses } { misses === 1 ? "erro" : "erros" }</span>
        </div>
        <div className="lli-dots" aria-label="Resultado de cada rodada">
          { Array.from({ length: noRounds }, (_, i) => {
            const r = history.find(h => h.index === i);
            const cls = r ? (r.hit ? "is-hit" : "is-miss") : (i === roundState.index ? "is-current" : "");
            return <span key={ i } className={ "lli-dot " + cls } title={ r ? (r.hit ? "Acerto" : "Erro") : "" } />;
          }) }
        </div>
      </div>

      {/* resultado da rodada anterior */}
      { lastResult && (
        <div className={ "lli-feedback " + (lastResult.hit ? "is-hit" : "is-miss") } role="status">
          { lastResult.hit
            ? <><b>✓ Acertou!</b> Rodada { lastResult.index + 1 }: o jogo reconheceu { lastResult.label }.</>
            : <><b>✗ Errou.</b> Rodada { lastResult.index + 1 }: você devia desenhar { lastResult.label }, mas o jogo viu { lastResult.guess }.</> }
        </div>
      ) }
    </div>
  );
}
