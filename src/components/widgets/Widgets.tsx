import React, { useState } from 'react';
import './widgets.scss';
import { event } from 'jquery';
import { int } from '../../joiner/types';
import { windoww } from '../../joiner/types';
import { SetRootFieldAction } from '../../joiner';
import { MapStateToProps } from 'react-redux';
import { InputMapStateToProps } from '../forEndUser/Input';
import { DState } from '../../joiner';
import { VertexOwnProps, VertexStateProps } from '../../graph/graphElement/sharedTypes/sharedTypes';



type InToggleValues = {
    true: string | boolean;
    false: string | boolean;
}

type InToggleProps = {
    name: string;
    values?: InToggleValues;
    labels?: InToggleValues;
    size?: string;
    style?: React.CSSProperties;
};

export const InternalToggle = (props: InToggleProps) => {
    const [value, setValue] = useState<boolean>(false);
    
    const labels = props.labels ? props.labels : {true: props.name+' on', false: props.name+' off'};
    
    const toggleValue = () => {
        setValue(!value); 
        SetRootFieldAction.new(props.name, !value);
    };

    return (
        <div className={'toggle'} onClick={() => {toggleValue()}} style={props.style}>
            
            <input className={'toggle-input'} id={props.name} type="checkbox" value="true" checked={value}  />
            <label className={'toggle-label'}></label>
            
            <div className={"toggle-labels"}>
                {value ? 
                    <span className={"toggle-on"}>{labels['true']}</span>
                    :
                    <span className={"toggle-off"}>{labels['false']}</span>
                }
            </div>
            
        </div>
    );
}

type HRuleProps = {
    theme?:  'normal' | 'light' | 'dark';
    style?: React.CSSProperties;
}
export const HRule = (props: HRuleProps) => {

    const theme = (!props.theme ? 'normal' : props.theme);
    return (<>
        {props.style ? 
            <hr className={`hrule ${theme}`} style={props.style}></hr>
        :
            <hr className={`hrule ${theme}`} ></hr>
        }
    </>);
}
