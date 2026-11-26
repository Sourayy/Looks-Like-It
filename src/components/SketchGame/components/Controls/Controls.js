import React from "react";
import { withRouter } from 'react-router-dom' 

import { Button } from "../Button";
import { clearCanvas } from "../Canvas";
import { GameSFX } from "../../utils/sounds.js";

import { useLocalStorage } from "../../hooks";

 export const Controls = withRouter((props) => {

  const [ soundOn ] = useLocalStorage("soundOn");

  return(
    <div className="row">
      <div className="col">
      <Button 
          label="Limpar" 
          click={() => { 
            clearCanvas(props.canvasRef);
            GameSFX.play("clear", soundOn);
          }} 
          className="is-warning"
        /> 
        <Button 
          label="Próxima →" 
          click={() => props.NextBtnCallBack() } 
          className="is-success"
          id="btn-next"
        /> 
      </div>
      <div className="col"> 
        <Button 
          label="Sair" 
          click={() => {
            GameSFX.play("click", soundOn);
            var dialog = document.getElementById('dialog-rounded');
            if (dialog.showModal !== undefined)
              dialog.showModal()
            else 
              props.history.push('/');
          }}
          className="float-right"
          id="btn-quit"
        />  
        <dialog className="lli-dialog" id="dialog-rounded">
          <form method="dialog">
            <p>Tem certeza de que quer sair?</p>
            <menu className="dialog-menu">
              <Button 
                label="Sair"
                route="/home"
                buttonClassName="is-primary"
                click={() => { 
                  GameSFX.silence();
                  GameSFX.play("quit", soundOn);
                }}                
                id="btn-quit-final"
                />
              <button className="lli-btn">Cancelar</button>
            </menu>
          </form>
        </dialog>        
      </div>
    </div>
  );
});