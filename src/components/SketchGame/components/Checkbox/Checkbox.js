import React, { useState } from "react";

export const Checkbox = ({ isChecked, onChange, id }) => {

  const [ checked, setChecked ] = useState(isChecked);
  
  return (
    <label className="mr-4">
      <input 
        type="checkbox" 
        className="lli-check"
        checked={ checked }
        onChange={ (e) => {
          setChecked(e.target.checked);
          onChange(e.target.checked);
        }}
        id={ id }
      />
      <span>Som</span>
    </label>  
  );
}