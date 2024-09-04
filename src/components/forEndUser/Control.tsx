import { ControlPanel, LGraphElement, SetRootFieldAction } from "../../joiner";
import { ReactElement, ReactNode, useState } from "react";

import "./control.scss";
import { useStateIfMounted } from "use-state-if-mounted";
import { Tooltip } from "./Tooltip";
import { VertexOwnProps } from "../../graph/graphElement/sharedTypes/sharedTypes";
import { useEffectOnce } from "usehooks-ts";


/* Control */

type ControlProps = {
    children: any;
    title?: string;
    payoff?: string;
    icon?: boolean;
}

const ControlComponent = (props: ControlProps, children?:ReactNode) => {
    
    const [controlOpen, setControlOpen] = useStateIfMounted(false);
  
    const toggleValue = () => {
        setControlOpen(!controlOpen);

    }

    return (<>
        
            <div className={`jjodel-control d-flex flex-row ${controlOpen ? 'opened' : 'closed'}`}>
                <div className={'control-header'}>
                    <h1>{props.title}</h1>
                    <h2>{props.payoff}</h2>
                </div>
                {props.children || children} 
            </div>

            {controlOpen ?
                <div className={'jjodel-control-icon'}>
                    <i onClick={(e) => {toggleValue()}} className="bi bi-toggles"></i>
                </div>
                :
                <div className={'jjodel-control-icon'}>
                    <i onClick={(e) => {toggleValue()}} className="bi bi-toggles"></i>
                </div>
            }  
    </>);
}

const Control = (props: VertexOwnProps, children: ReactNode = []): ReactElement => {
    return <ControlComponent {...props}>{children || props.children}</ControlComponent>;
}


/* Slider */

type SliderProps = {
    node: LGraphElement;
    name: string;
    defaultValue?:number;
    title?:string;
    min?: number;
    max?: number;
    step?: number;
}
 
const SliderComponent = (props: SliderProps) => {

    const min = props.min ? props.min : 0;
    const max = props.max ? props.max : 10;
    const step = props.step ? props.step : 1;
    const defaultValue = props.defaultValue ? props.defaultValue : max;
    const name = props.name;


    useEffectOnce(
        () => {
            {/* @ts-ignore */}
            props.node.state = {[name] : defaultValue};
        }
    );

    function updateValue(value: number) {
        {/* @ts-ignore */}
        props.node.state = {[name]: value};
    }


    return (<div className={'control-widget control-slider'}>
        <input 
            type={'range'} 
            min={0} 
            max={3} 
            step={1} 
            onChange={(e)=>{updateValue(+e.target.value)}} />
        
        {/* @ts-ignore */}
      {props.title && <div className={'tip'}>{props.title} ({props.node.state[name]})</div>}
    </div>);
}

const Slider = (props: SliderProps, children: ReactNode = []): ReactElement => {
    return <SliderComponent {...props} />;
}


export {Control, Slider};