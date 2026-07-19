import {
    ClickEvent,
    ControlPanel,
    DGraphElement, GraphPoint,
    LGraphElement,
    SetFieldAction,
    SetRootFieldAction,
    TRANSACTION,
    U
} from "../../joiner";
import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";

import "./control.scss";
import { useStateIfMounted } from "use-state-if-mounted";
import { Tooltip } from "./Tooltip";
import { VertexOwnProps } from "../../common/sharedTypes";



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
    const toggleValue = () => setControlOpen(!controlOpen);


    function onClick(e: any){
        U.clickedOutside(e, ()=> setControlOpen(false));
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
            <i onClick={toggleValue} className="bi bi-toggles"/>
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
    const min = props.min ?? 0;
    const max = props.max ?? 10;
    const step = props.step || 1;
    const defaultValue = props.defaultValue ? props.defaultValue : max;
    const name = props.name || '';

    useEffect(
        () => {
            if (props.node) props.node.state = {[name] : defaultValue};
        }, [props.node?.id, name]
    );

    function updateValue(value: number) {
        if (props.node) props.node.state = {[name]: value};
    }


    return (
        <>
            {CheckProps('slider', props) || <div className={'control-widget control-slider'}>

                <div className={'track'}
                    style={{transition: 'width 0.3s', position: 'relative', left: '10px',
                        width: `calc(((100%/${max} - 8px) * ${props.node?.state[name] || 0}))`}}
                />

                <input
                    type={'range'}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e)=>{updateValue(+e.target.value)}} />

                {/* @ts-ignore */}
                {props.title && <div className={'tip'}>{props.title} <label>{props.node?.state[name]}</label></div>}
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
    node?: LGraphElement;
};

const ToggleComponent_Obsolete = (props: ToggleProps) => {
    const [value, setValue] = useState<boolean>(false);
    const defaultValue = false;

    const labels = props.labels ? props.labels : {true: 'On', false: 'Off'};

    useEffect(
        () => {
            if (!props.node) return;
            if (!(props.name in props.node.state)) props.node.state = {[props.name] : defaultValue};
        }, [props.node?.id, props.name]
    );

    function updateValue(value: boolean) {
        if (props.node) props.node.state = {[props.name]: value};
    }

    function toggleValue() {
        const newValue = !value;
        setValue(newValue);
        if (props.node) props.node.state = {[props.name]: newValue};
    }
    // // updateValue(+e.target.value) 

    return (<>
        
        <div className={'toggle'} onClick={(e) => {toggleValue()}} style={{paddingLeft: '0px!important'}}>
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

const Toggle_Obsolete = (props: ToggleProps, children: ReactNode = []): ReactElement => {
    return <ToggleComponent_Obsolete {...props} />;
}


/* Zoom */

type ZoomProps = {
    node?: DGraphElement;
    children?: ReactNode;
}

const ZoomComponent = (props: ZoomProps) => {

    const zoomIn = () => {
        if (!props.node) return;
        TRANSACTION('Zoom in', () => {
            if (!props.node) return;
            SetFieldAction.new(props.node, 'zoom.x' as any, 1.1, '*=');
            SetFieldAction.new(props.node, 'zoom.y' as any, 1.1, '*=');
        })
        // @ts-ignore
        // props.node.zoom = {x: props.node.zoom.x + 0.1, y: props.node.zoom.y + 0.1}
    }
    const zoomOut = () => {
        if (!props.node) return;
        TRANSACTION('Zoom out', () => {
            if (!props.node) return;
            SetFieldAction.new(props.node, 'zoom.x' as any, 1.1, '/=');
            SetFieldAction.new(props.node, 'zoom.y' as any, 1.1, '/=');
        })
    };
    const zoomReset = () => {
        if (!props.node) return;
        TRANSACTION('Zoom reset', () => {
            if (!props.node) return;
            props.node.zoom = new GraphPoint(1, 1);
        })
    };

    return (
        <div className={'zoom'}>
            <Tooltip tooltip={'Zoom in'} inline position={'left'} offsetX={10}>
                <div className={'zoom-in'} onClick={() => zoomIn()}></div>
            </Tooltip>
            
            <Tooltip tooltip={'Zoom out'} inline position={'left'} offsetX={10}>
                <div className={'zoom-out'} onClick={() => zoomOut()}></div>
            </Tooltip>

            {
                props.node?.zoom.x !== 1 && <Tooltip tooltip={'Zoom reset'} inline position={'left'} offsetX={10}>
                    <div className={'zoom-reset'} onClick={() => zoomReset()}></div>
                </Tooltip>
            }
        </div>
    );
}

const Zoom = (props: ZoomProps): ReactElement => {
    return ZoomComponent(props);
}
Toggle_Obsolete.cname = 'Toggle_Obsolete';
Control.cname = 'Control';
Slider.cname = 'Slider';
Zoom.cname = 'Zoom';
ZoomComponent.cname = 'ZoomComponent';
ToggleComponent_Obsolete.cname = 'ToggleComponent_Obsolete';
ControlComponent.cname = 'ControlComponent';
SliderComponent.cname = 'SliderComponent';


export {Control, Slider, Toggle_Obsolete, Zoom};

