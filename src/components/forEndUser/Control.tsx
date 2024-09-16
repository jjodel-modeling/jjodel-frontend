import { ControlPanel, LGraphElement, SetRootFieldAction } from "../../joiner";
import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";

import "./control.scss";
import { useStateIfMounted } from "use-state-if-mounted";
import { Tooltip } from "./Tooltip";
import { VertexOwnProps } from "../../graph/graphElement/sharedTypes/sharedTypes";
import { useEffectOnce } from "usehooks-ts";


/* Notification */

type Widget = 'control'|'slider'|null;
type Field = 'node'|'name'|'children'|null;
type ErrorType = 'missing'|null;

type NotificationProps = {
    widget: Widget,
    field: Field,
    type: ErrorType,
    suggestion?: string
}
const Notification = (props: NotificationProps) => {

    return (
        <div className="control-widget control-notification">
            <div className="control-header">
                <h1>You forgot something...</h1>
                {props.type && <h2>Missing '{props.field}'' in '{props.widget}' in template definition.</h2>}
            </div>

            {props.suggestion && <p>{props.suggestion}</p>}
        </div>
    );

}

type CheckReturnTYpe = {
    error: boolean;
    notification: any;
}

const CheckProps = (widget: Widget, props: any): any => {

    let result:any = false;
    let notification: any|null = null;
    let field: Field = null;
    let type: ErrorType = null;
    let suggestion = '';

    switch(widget) {
        case 'control':
            if (!props.children) {
                alert('You did not specify any children in <Control ...> </Control>');
                // field = 'children';
                // type = 'missing';
                // suggestion = 'You did not specify any children in <Control ...> </Control>';
                // notification = <Notification widget={widget} field={field} type={type} suggestion={suggestion}/>;
                result = true;
            }
        break;
        case 'slider':
            if (!props.node) {
                alert('You did not specify node in <Slider .../>');
                // field = 'node';
                // type = 'missing';
                // suggestion = '';
                // notification = <Notification widget={widget} field={field} type={type} suggestion={suggestion}/>;
                result = true;

            }
            if (!props.name) {
                alert('You did not specify name in <Slider .../>');
                field = 'name';
                type = 'missing';
                suggestion = 'You did not specify name in <Slider .../>';
                notification = <Notification widget={widget} field={field} type={type} suggestion={suggestion}/>;
                result = true;
            }
        break;
    }

    return result;
}


type ControlProps = {
    children: any;
    title?: string;
    payoff?: string;
    icon?: boolean;
}

function useClickOutside(ref: any, onClickOutside: any) {
    useEffect(() => {

        function handleClickOutside(event: Event) {
            if (ref.current && !ref.current.contains(event.target)) {
                onClickOutside();
            }
        }

      // Bind
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // dispose
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, onClickOutside]);
  }


/*  Control */

const ControlComponent = (props: ControlProps, children?:ReactNode) => {
    
    const [controlOpen, setControlOpen] = useStateIfMounted(false);
    const controlRef = useRef(null);

    const toggleValue = () => {
        setControlOpen(!controlOpen);

    }

    useClickOutside(controlRef, () => {
        setControlOpen(false);
    });

    return (<>
        <div className={`jjodel-control d-flex flex-row ${controlOpen ? 'opened' : 'closed'}`} ref={controlRef}>
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
        // @ts-ignore
        props.node.state = {[name]: value};
    }


    return (
        <>
            {CheckProps('slider', props) || <div className={'control-widget control-slider'}>
                {/* <div className={'track'} style={{transition: 'width 0.3s', width: `calc((100% - var(--knob) * 2 - 14px) / ${max} * ${props.node.state[name]})`}}></div>*/}

                <div className={'track'}
                    style={{transition: 'width 0.3s', width: `calc((((100% - var(--knob) * 2 - 14px) / (${max})) * (${props.node.state[name as string]}))`}}>
                </div>

                <input
                    type={'range'}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e)=>{updateValue(+e.target.value)}} />

                {/* @ts-ignore */}
                {props.title && <div className={'tip'}>{props.title} <label>{props.node.state[name]}</label></div>}
                </div>
            }
        </>);
}

const Slider = (props: SliderProps, children: ReactNode = []): ReactElement => {
    return <SliderComponent {...props} />;
}


/* Toggle */

// type ToggleValues = {
//     true: string;
//     false: string;
// }

// type ToggleProps = {
//     name: string;
//     values?: ToggleValues;
//     labels?: ToggleValues;
//     size?: string;
//     style?: React.CSSProperties;
// };

// export const Toggle = (props: ToggleProps) => {
//     const [value, setValue] = useState<boolean>(false);

//     const labels = props.labels ? props.labels : {true: props.name+' on', false: props.name+' off'};
//     const toggleValue = () => {
//         setValue(!value);
//         SetRootFieldAction.new(props.name, !value);
//     };



//     return (
//         <div className={'toggle'} onClick={() => {toggleValue()}} style={props.style}>

//             <input className={'toggle-input'} id={props.name} type="checkbox" value="true" checked={value}  />
//             <label className={'toggle-label'}></label>

//             <div className={"toggle-labels"}>
//                 {value ?
//                     <span className={"toggle-on"}>{labels['true']}</span>
//                     :
//                     <span className={"toggle-off"}>{labels['false']}</span>
//                 }
//             </div>

//         </div>
//     );
// }

/* Checkbox */



export {Control, Slider};

