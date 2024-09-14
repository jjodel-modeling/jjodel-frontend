import { ControlPanel, LGraphElement, SetRootFieldAction } from "../../joiner";
import { ReactElement, ReactNode, useState } from "react";

import "./control.scss";
import { useStateIfMounted } from "use-state-if-mounted";
import { Tooltip } from "./Tooltip";
import { VertexOwnProps } from "../../graph/graphElement/sharedTypes/sharedTypes";


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

            // <div className={'jjodel-control d-flex flex-row'}>
            //     <div className={'control-title'}>
            //         {props.title && <i className="bi bi-dpad"></i>}
            //         {props.title && <h1>{props.title}</h1>}
            //         {props.payoff && <h2>{props.payoff}</h2>}
            //     </div>
            //     <div className={'control-children'}>
            //         {children || props.children} 
            //     </div>
            // </div>
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
    name?: string;
    defaultValue?:number;
    title?:string;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
}

const Slider = (props: SliderProps) => {

    // const min = props.min ? props.min : 0;
    // const max = props.max ? props.max : 10;
    // const step = props.step ? props.step : 1;
    // const defaultValue = props.defaultValue ? props.defaultValue : max;

    //const [value, setValue] = useState(defaultValue);


    function updateValue(value: number) {
        // @ts-ignore
        props.node.state = {level: value};
    }
    return (<div className={'control-widget control-slider'}>
        
        <input 
            type={'range'} 
            min={0} 
            max={3} 
            step={1} 
            onChange={(e)=>{updateValue(+e.target.value)}} />
        {/* @ts-ignore */}
      {props.title && <div className={'tip'}>{props.title} ({props.node.state.level})</div>}
    </div>);
}





export {Control, Slider};