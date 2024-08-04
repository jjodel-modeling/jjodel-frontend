import React, { useState } from 'react';
import './widgets.scss';
import { event } from 'jquery';

type ToggleValues = {
    true: string;
    false: string;
}



type ToggleProps = {
    name: string;
    values: ToggleValues;
    labels: ToggleValues;
    width?: "small" | "medium" | "large";
};

export const Toggle = (props: ToggleProps) => {
    const [value, setValue] = useState<boolean>(false);
    
    const toggleValue = (e: MouseEvent, value: boolean) => {
        setValue(value);

    };

    return (
        <div className={'toggle'}  onClick={(e)=>setValue(!value)} >
            <span>{value ? props.labels['true'] : props.labels['false']}</span>
            <input id={props.name} type="checkbox" value="true"  checked={value}/> 
            <label></label>
        </div>
    );
}

