import React, { useState } from 'react';
import './widgets.scss';
import { event } from 'jquery';
import { int } from '../../joiner/types';
import { windoww } from '../../joiner/types';
import { SetRootFieldAction } from '../../joiner';
import { MapStateToProps } from 'react-redux';
import { InputMapStateToProps } from '../forEndUser/Input';

type ToggleValues = {
    true: string;
    false: string;
}



type ToggleProps = {
    name: string;
    values: ToggleValues;
    labels: ToggleValues;
    width?: "small" | "medium" | "large";
    style?: React.CSSProperties;
};



export const Toggle = (props: ToggleProps) => {
    const [value, setValue] = useState<boolean>(false);

    const toggleValue = (e: MouseEvent, value: boolean) => {
        setValue(value);
    };

    return (
        <div className={'toggle'}  onClick={(e)=>setValue(!value)} style={props.style}>
            <input id={props.name} type="checkbox" value="true"  checked={value}/>
            <div className={"labels"}>
                <span className={"on"}>{props.labels['true']}</span>
                <span className={"off"}>{props.labels['false']}</span>
            </div>
            <label></label>
        </div>
    );
}

type RangeProps = {
    name: string;
    min: int;
    max: int;
    step?: int;
    label?: string;

}

export const Range = (props: RangeProps) => {

    return (<div className={'range'}>
        /* <div className={'level'}>{level}</div> */
        <input 
            name={props.name} 
            id={props.name} 
            min={props.min} 
            max={props.max} 
            type="range" 
            step={props.step} 
            /* value={level} */
            onChange={(e)=>{SetRootFieldAction.new(props.name, e.target.value)}} />
        
        <div className={'tip'}>Abstraction1</div>
    </div>);

}