import React from "react";
import { Canvas } from "../Canvas";

export const AnswerCard = React.forwardRef(({ cursorRef }, ref) => {
  return(
    <div className="lli-canvas-card mb-3">
      <Canvas ref={ ref } />
      <div ref={ cursorRef } className="air-cursor" />
    </div>
  );
});
