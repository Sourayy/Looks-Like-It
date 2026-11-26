import React, { useEffect, useReducer, useState } from "react";

import { Logo } from "./components/Logo";

import { GameProvider } from "./providers";
import { pointReducer } from "./reducers";
import { useRounds } from "./hooks";
import { handTracker } from "./utils/handTracker";

// styles
import "./SketchGame.css";

export const SketchGame = ({ config }) => {

  const [ score, dispatch ] = useReducer(pointReducer, 0);
  const [ currentRound, setCurrentRound ] = useState(0);

  // histórico de cada rodada: { index, label, guess, hit } (acerto ou erro)
  const [ history, setHistory ] = useState([]);
  const addResult = (result) => setHistory(prev =>
    prev.some(r => r.index === result.index) ? prev : [ ...prev, result ]
  );
    
  // release the camera when leaving the game (results screen / quit)
  useEffect(() => () => handTracker.stop(), []);

  // this is used to determine the nature of the speech bubble in the next round,
  // ie, to taunt or congratulate!
  const [ wonLastRound, setWonLastRound ] = useState(false); 

  const state = {
    score,
    dispatch,
    currentRound,
    setCurrentRound,
    wonLastRound,
    setWonLastRound,
    history,
    addResult
  }

  // Note: can't pass these by context (useRounds isn't mounted and GameProvider context n/a yet):
  const { rounds } = useRounds({ ...config, currentRound });

  return(  
    <>
      <Logo />      
      <div className="lli-panel">

        <GameProvider value={{ ...config, ...state }}>
          { rounds }
        </GameProvider>

      </div>
    </>
  );
}