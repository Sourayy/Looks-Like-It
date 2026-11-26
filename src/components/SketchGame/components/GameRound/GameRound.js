import React, { useEffect, useRef, useState } from "react";
import { Redirect } from "react-router-dom";

import { RoundProvider } from "../../providers";

import { useGameContext } from  "../../hooks";
import { useRoundDecider } from "../../hooks";
import { useTimer } from  "../../hooks";
import { useAirDrawing } from "../../hooks";

import { StatusCard } from  "../StatusCard";
import { AnswerCard } from "../AnswerCard";
import { QuestionCard } from "../QuestionCard";
import { AirCam } from "../AirCam";
import { Controls }  from "../Controls";


let canvasRef = React.createRef();

export const GameRound = ({ index, currentLabel, timeLimit }) => {
 
  const { score, noRounds, msgs, history } = useGameContext();

  // hand tracking: fingertip draws on the canvas; cursor + camera preview are drawn imperatively
  const cursorRef = useRef(null);
  const previewRef = useRef(null);
  const { status: camStatus } = useAirDrawing({ canvasRef, cursorRef, previewRef });

  // this is set to true when typing animation is complete:
  // reset upon each round, as previous round sets it to `true`
  const [ startTiming, setStartTiming ] = useState(false);  

  // set-up timer:
  const { timeLeft, startTimer, stopTimer } = useTimer( 
    timeLimit, 
    // callback for when timer is done – does all the HEAVY lifting
    // NB: caroundDecider can be invoked prematurely with 'next' button
    () => {
      roundDecider()
    }
  );
  const { roundDecider, isGameOver } = useRoundDecider({ currentLabel, canvasRef, stopTimer });

  // if game rounds are over, go to the next round
  const renderRedirect = () => {
    if (isGameOver) 
      return (
        <Redirect to={{
          pathname: "/result",
          state: {
            score: score,
            noRounds: noRounds,
            msgs: msgs,
            history: history
          }
        }} />
      );
  }
  
  useEffect(() => {
    // wait for the camera to be ready (or to fail) so loading time isn't charged to the player
    if (startTiming && camStatus !== "loading") {
      startTimer();
      console.log("GR: startTiming!");
    }
    return () => { stopTimer() };
  }, [startTiming, camStatus, startTimer, stopTimer]);

  return (
    <RoundProvider value={{ index, currentLabel, timeLeft, canvasRef }}>
      { renderRedirect() }
      <div className="row">
        <div className="col">
          <StatusCard />
        </div>
      </div>
      <div className="row align-items-end">  
        <div className="col-12 col-md">          
          <AnswerCard ref={ canvasRef } cursorRef={ cursorRef } />
        </div>
        <div className="col-12 col-md mr-md-3 mb-2">
          {/* this component's class-based, so can't use 2 contexts - so forced to supply these props w/refactoring */}
          <QuestionCard 
            label={ currentLabel } 
            timeLeft={ timeLeft } 
            callBack={ ()=> setStartTiming(true) }
          />
          <AirCam ref={ previewRef } status={ camStatus } />
        </div>
      </div>
      <Controls canvasRef={ canvasRef } NextBtnCallBack={ roundDecider }/>
    </RoundProvider>      
  );
};
