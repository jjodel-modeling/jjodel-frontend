import {
    ClickEvent,
    ControlPanel,
    DGraphElement, GraphPoint,
    LGraphElement,
    LModelElement,
    Select,
    SetFieldAction,
    SetRootFieldAction,
    TRANSACTION,
    U
} from "../../joiner";
import { JSXElementConstructor, MouseEventHandler, ReactElement, ReactNode, ReactPortal, useEffect, useRef, useState } from "react";

import "./control.scss";
import { useStateIfMounted } from "use-state-if-mounted";
import { Tooltip } from "./Tooltip";
import { VertexOwnProps } from "../../common/sharedTypes";
import { VscDebugRestart, VscDebugStepInto, VscDebugStop } from "react-icons/vsc";



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


/* ************************************************************************************ */
/* PANEL.                                                                               */
/* ************************************************************************************ */


/*  Panel */

type PanellProps = {
    children: any;
    title?: string;
    data: any;
}


  
const PanellComponent = (props: PanellProps, children?:ReactNode) => {

    const [panellOpen, setPanellOpen] = useStateIfMounted(false);
    const toggleValue = () => setPanellOpen(!panellOpen);


   
    return (<>
       {/* ts-ignore */}
        {!props.data.isMetamodel &&

                <div className={`jjodel-panel-root`} >
                
                    <div className={`jjodel-panel normal ${panellOpen ? 'opened' : 'closed'}`}>
                        {panellOpen ? <>
                            <div className={'panel-header'}>
                                <div>
                                    <h1>{props.title ? props.title : 'Control'}</h1>

                                </div> 
                                <i onClick={toggleValue}className="bi bi-chevron-right"></i>
                                
                            </div>
                            <div className={'panel-content'}>
                                    {props.children || children}
                                </div>
                        </>
                            
                        :

                        <div className={'panel-header'}>
                            <Tooltip tooltip={props.title || 'Control'} inline position={'left'} offsetX={20}>
                                <i onClick={toggleValue}className="bi bi-chevron-left"></i>
                            </Tooltip>
                        </div>
                        }
                    
                    </div>
                </div>
        }
    </>);
}

const Panell = (props: VertexOwnProps, children: ReactNode = []): ReactElement => {
    return <PanellComponent {...props} data={props.data}>{children || props.children}</PanellComponent>;
}


/* ************************************************************************************ */
/* SIMULATOR                                                                            */
/* ************************************************************************************ */


/*  Panel */

type PanelProps = {
    children: any;
    title?: string;
    payoff?: string;
    icon?: boolean;

    data: any;
}


  
const PanelComponent = (props: PanelProps, children?:ReactNode) => {

    const [panelOpen, setPanelOpen] = useStateIfMounted(false);
    const toggleValue = () => setPanelOpen(!panelOpen);

    /* laguage fragment metadata */

    const meta = {
        initial : props.data.instanceof && props.data.instanceof.state['initial']?.name || false,
        terminal : props.data.instanceof && props.data.instanceof.state['terminal']?.name || false,
        node : props.data.instanceof && props.data.instanceof.state['node']?.name || false,
        ownedTransition : props.data.instanceof && props.data.instanceof.state['ownedTransitions']?.name || false,
        nextState : props.data.instanceof && props.data.instanceof.state['nextState']?.name || false
    }
    const {initial, terminal, node, ownedTransition, nextState} = meta;

    const activeFieldName = 'active';

    function onClick(e: any){
        U.clickedOutside(e, ()=> setPanelOpen(false));
    }


    function resetSimulation() {

        props.data.model.allSubObjects
            .filter((o: any) => o.instanceof.name === node 
                || o.instanceof.name === initial 
                || o.instanceof.name === terminal)
            .forEach((o: any) => {o.state = {[activeFieldName]: false}})
        
        
        props.data.model.allSubObjects
            .filter((o: any) => o.instanceof.name === initial)
            .forEach((o: any) => {o.state = {[activeFieldName]: true}})
        
        U.alert('i', 'Resetting simulation...');
    }

    function stop() {
        props.data.model.allSubObjects
            .filter((o: any) => o.instanceof.name === node 
                || o.instanceof.name === initial 
                || o.instanceof.name === terminal)
            .forEach((o: any) => {o.state = {[activeFieldName]: false}})
        
        U.alert('i', 'Simulation stopped.');
    }

    function step() {

        if (props.data.model.allSubObjects.filter((o: any) => o.instanceof.name === terminal && o.state[activeFieldName]).length === 0) {
            props.data.model.allSubObjects.filter((o: any) => o.state[activeFieldName]).forEach((o: any) => {
                o['$' + ownedTransition] && o['$' + ownedTransition].values.forEach((t: any) => {
                    if (t['$' + nextState] && t['$' + nextState].value) {
                        t['$' + nextState].value.state = {[activeFieldName]: true};
                    }
                    o.state = {[activeFieldName]: false};
                })
            })
        } else {
            U.alert('i', 'Execution terminated.');
        }
    }

   
    return (<>
       {/* ts-ignore */}
        {!props.data.isMetamodel ?
            !Object.values(meta).some(v => !v) &&
                <div className={`jjodel-panel-root`} >
                
                    <div className={`jjodel-panel debug model ${panelOpen ? 'opened' : 'closed'}`}>
                        {panelOpen ? <>
                            <div className={'panel-header'}>
                                {/* <div>
                                    <h1>{props.title ? props.title : 'Control'}</h1>
                                    {props.payoff && <h2>{props.payoff}</h2>}
                                </div> */}
                                <div className={'panel-content debug'}>
                                    {props.children || children}
                                    <Tooltip inline offsetY={10} position={'bottom'} tooltip={'Restart'}><div><button onClick={resetSimulation}><VscDebugRestart className={'restart'}/></button></div></Tooltip>
                                    <Tooltip inline offsetY={10} position={'bottom'} tooltip={'Step into'}><div><button onClick={step}><VscDebugStepInto className={'step'}/></button></div></Tooltip>
                                    <Tooltip inline offsetY={10} position={'bottom'} tooltip={'Stop'}><div><button onClick={stop}><VscDebugStop className={'stop'}/></button></div></Tooltip>
                                </div>
                                <i onClick={toggleValue}className="bi bi-chevron-right"></i>
                            </div>
                            
                        </>
                            
                        :
                        <div className={'panel-header'}>
                            <Tooltip tooltip={props.title || 'Control'} inline position={'left'} offsetX={20}>
                                <i onClick={toggleValue}className="bi bi-chevron-left"></i>
                            </Tooltip>
                        </div>
                        }
                    
                    </div>
                </div>
        :
        <div className={`jjodel-panel-root`} >
        
            <div className={`jjodel-panel metamodel ${panelOpen ? 'opened' : 'closed'}`}>
                {panelOpen ? <>
                    <div className={'panel-header'}>
                        <div>
                            <h1>Control Flow Aspect</h1>
                        </div>
                        <i onClick={toggleValue}className="bi bi-chevron-right"></i>
                    </div>
                    <div className={'panel-content'}>
                        <p>Configure the metamodel parameters.</p>
                        <Section name={'Control Flow Node Types'}/>
                        <p>Select the metaclasses that define the nodes of the control-flow structure.</p>
                        <MetaElementPicker name={'node'} meta={'class'} label={'Control Flow Node'} data={props.data} />
                        <MetaElementPicker name={'initial'} meta={'class'} label={'Initial Class'} data={props.data} />
                        <MetaElementPicker name={'terminal'} meta={'class'} label={'Terminal Class'} data={props.data} />
                        <Section name={'Transition Configuration'}/>
                        <p>Configure how transitions connect nodes within the control-flow.</p>
                        <MetaElementPicker name={'transition'} meta={'class'} label={'Transition Class'} data={props.data} />
                        <MetaElementPicker name={'ownedTransitions'} meta={'containment'} label={'Transition Containment'} data={props.data} />
                        <MetaElementPicker name={'nextState'} meta={'reference'} label={'Next Node Reference'} data={props.data} />
                    </div>
                </>
                    
                :
                <div className={'panel-header'}>
                    <Tooltip tooltip={props.title || 'Control'} inline position={'left'} offsetX={20}>
                        <i onClick={toggleValue}className="bi bi-chevron-left"></i>
                    </Tooltip>
                </div>
                }
            
            </div>
        </div>}
    </>);
}

const Panel = (props: VertexOwnProps, children: ReactNode = []): ReactElement => {
    return <PanelComponent {...props} data={props.data}>{children || props.children}</PanelComponent>;
}

type PickerProps = {
    name: string;
    meta: 'class'|'reference'|'containment'|'composition'|'aggregation';
    label?: string;
    data: LModelElement;
    indent?: number;
}

const MetaElementPicker = (props: PickerProps) => {

    {/* @ts-ignore */}
    var options: JSX.Element[] | null = null;
    var placeholder = ""    
    
    switch (props.meta) {
        case 'class':
            options = props.data.model.classes.filter((c: any) => !c.abstract).map((c: any) => <option value={c.id}>{c.name}</option>);
            placeholder = "Select a metaclass";
        break;
        case 'reference':
            options = props.data.model.references.filter((r: any) => !r.composition && !r.aggregation).map((r: any) => <option value={r.id}>{r.name}</option>);
            placeholder = "Select a reference";

        break;
        case 'containment':
        case 'composition':
            options = props.data.model.references.filter((r: any) => r.composition).map((r: any) => <option value={r.id}>{r.name}</option>);   
            placeholder = "Select a composition";

        break;
        case 'aggregation':
            options = props.data.model.references.filter((r: any) => r.aggregation).map((r: any) => <option value={r.id}>{r.name}</option>);
            placeholder = "Select an aggregation";
        break;
    } 

    return (<label className={'input-container'}>
        <label style={{marginLeft: props.indent ? props.indent*20 + 'px' : '0px' }}>{props.label || 'Select a ' + props.meta}</label>
       
        <Select
            getter={()=>props.data.state[props.name]}
            setter={(value) => props.data.state={[props.name]: value}}
            placeholder={placeholder}
            options={<>{options}</>}>
        </Select>
    </label>
    );
}


/* Section */

type SectionProps = {
    name: string;
}

const Section = (props: SectionProps) => {
    return (<h2>{props.name}</h2>
    );
}



/* ContextualEntry * /

type ContextualProps = {
    title: string;
    action: MouseEventHandler | undefined;
    node: LGraphElement;
    icon?: string;
}

const ContextualEntry = (props: ContextualProps) => {

    if (!props.node.view.state.contextualEntries) {
        props.node.view.state = {contextualEntries : {}};
    } 
    
    props.node.view.state.contextualEntries[props.title] = {title: props.title, action: props.action, icon: props.icon ? props.icon : ''};

    return (<></>);
}*/




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

// required for some engine stuff, try to put a cname on all components that can be inside a view.
Control.cname = 'Control';
Slider.cname = 'Slider';
Toggle_Obsolete.cname = 'Toggle';
Zoom.cname = 'Zoom';
Panel.cname = 'Panel';
Panell.cname = 'Panell';
MetaElementPicker.cname = 'MetaElementPicker';
// ContextualEntry.cname = 'ContextualEntry';
Slider.cname = 'Slider';
ControlComponent.cname = 'ControlComponent';
SliderComponent.cname = 'SliderComponent';
ToggleComponent_Obsolete.cname = 'ToggleComponent_Obsolete';
ZoomComponent.cname = 'ZoomComponent';
PanelComponent.cname = 'PanelComponent';
PanellComponent.cname = 'PanellComponent';
//MetaElementPickerComponent.cname = 'MetaElementPickerComponent';
//ContextualEntryComponent.cname = 'ContextualEntryComponent';
SliderComponent.cname = 'SliderComponent';

export {Control, Slider, Toggle_Obsolete, Zoom, Panel, Panell, MetaElementPicker, /*ContextualEntry*/};

