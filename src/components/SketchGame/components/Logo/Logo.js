import React from 'react';

// eyebrow / subtitle são opcionais (usados na tela inicial)
export const Logo = ({ eyebrow, subtitle }) => {
  return(
    <div className={ "lli-logo" + (subtitle ? " is-large" : "") }>
      { eyebrow && <div className="eyebrow">{ eyebrow }</div> }
      <h1>LOOKS LIKE IT<span>!</span></h1>
      <div className="lli-rule" />
      { subtitle && <p className="lli-subtitle">{ subtitle }</p> }
    </div>
  );
}