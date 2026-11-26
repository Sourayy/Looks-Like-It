import React from "react";

export const AirCam = React.forwardRef(({ status }, ref) => {
  return(
    <div className="lli-aircam mt-3">
      <div className="lli-cam-frame">
        <canvas ref={ ref } width={ 320 } height={ 240 } className="reflect-h" />
        { status === "loading" && <div className="lli-cam-overlay">Iniciando a câmera...</div> }
        { status === "error" && <div className="lli-cam-overlay">Sem câmera: desenhe com o mouse</div> }
      </div>
      <ul>
        <li><b>1 dedo:</b> desenhar</li>
        <li><b>2 dedos:</b> mover sem desenhar</li>
        <li><b>Palma aberta (1s):</b> limpar</li>
      </ul>
    </div>
  );
});
