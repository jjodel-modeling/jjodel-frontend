import {ClickEvent, ControlPanel, LGraphElement, SetRootFieldAction, U} from "../../joiner";
import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";

import "./control.scss";
import { useStateIfMounted } from "use-state-if-mounted";
import { Tooltip } from "./Tooltip";
import { VertexOwnProps } from "../../graph/graphElement/sharedTypes/sharedTypes";



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

    const toggleValue = () => {
        setControlOpen(!controlOpen);

    }


    function onClick(e: any){
        console.log('setup hide control');
        U.clickedOutside(e, ()=> {
            console.log('hide control');
            setControlOpen(false)
        });
    }
    return (<div className={`jjodel-control-root`} onClick={onClick}>
        <div className={`jjodel-control d-flex flex-row ${controlOpen ? 'opened' : 'closed'}`}>
            <div className={'control-header'}>
                <h1>{props.title}</h1>
                <h2>{props.payoff}</h2>
            </div>
            {props.children || children}
        </div>
        <div className={'jjodel-control-icon'}>
            <i onClick={(e) => {toggleValue()}} className="bi bi-toggles"/>
        </div>
    </div>);
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

    useEffect(
        () => {
            // @ts-ignore
            props.node.state = {[name] : defaultValue};
        }, [/*name, defaultValue*/]
    );

    function updateValue(value: number) {
        // @ts-ignore
        props.node.state = {[name]: value};
    }


    return (
        <>
            {CheckProps('slider', props) || <div className={'control-widget control-slider'}>

                <div className={'track'}
                    style={{transition: 'width 0.3s', position: 'relative', left: '10px',
                        width: `calc(((100%/${max} - 8px) * ${props.node.state[name as string]}))`}}
                >

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

type ToggleValues = {
    true: string;
    false: string;
}

type ToggleProps = {
    name: string;
    values?: ToggleValues;
    labels?: ToggleValues;
    size?: string;
    style?: React.CSSProperties;
    title?: string;
};

const ToggleComponent = (props: ToggleProps) => {
    const [value, setValue] = useState<boolean>(false);
    const defaultValue = false;

    const labels = props.labels ? props.labels : {true: 'On', false: 'Off'};

    useEffect(
        () => {
            // @ts-ignore
            props.node.state = {[props.name] : defaultValue};
        }, [/*props.name, defaultValue*/]
    );

    function updateValue(value: boolean) {
        // @ts-ignore
        props.node.state = {[props.name]: value};
    }

    function toggleValue() {
        const newValue = !value;
        setValue(newValue);

        // @ts-ignore
        props.node.state = {[props.name]: newValue};
    }
    // // updateValue(+e.target.value) 

    return (<>
        
        <div className={'toggle'} onClick={(e) => {toggleValue()}}>
            <input type={'checkbox'} className={'toggle-input'} id={props.name} checked={value} onChange={(e)=>{alert(e.target.value)}}  onClick={(e) => alert('input, click')} /> 

            <label onClick={() => alert()} className={'toggle-label'}></label>

            <div className={"toggle-labels"}>
                {value ?
                    <span className={"toggle-on"}>{labels['true']}</span>
                    :
                    <span className={"toggle-off"}>{labels['false']}</span>
                }
            </div>
            <div className={"tip"}>{props.title}</div>

        </div></>
    );
}

const Toggle = (props: ToggleProps, children: ReactNode = []): ReactElement => {
    return <ToggleComponent {...props} />;
}

export {Control, Slider, Toggle};

