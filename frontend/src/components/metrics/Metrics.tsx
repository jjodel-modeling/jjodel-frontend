import React, {useState} from "react";
import {
    DModel, LModel,
    DClass, DNamedElement,
    DState,
    DUser,
    DValue,
    DViewElement,
    DViewPoint,
    GObject,
    LClass,
    LGraphElement,
    LNamedElement, LObject,
    LPackage,
    LProject,
    LUser,
    LValue, Pointer, U,
    windoww,
    LModelElement,
    DModelElement
} from '../../joiner';
import { CommandBar, Btn } from "../commandbar/CommandBar";
import { SetRootFieldAction } from "../../joiner";
import './metrics.scss';
import { int } from "../../joiner/types";
import {createRoot} from "react-dom/client";

type MetricsProps = {
    data: LModelElement;
    type?: string;
    tip?: string;
}

function getAttributes(c: LClass): number {
    let sum = 0;
    if (c.extends.length === 0) {
        return c.attributes.length;
    } else {
        c.extends.map(s => sum += getAttributes(s));
        return c.attributes.length + sum;
    }
}
function getReferences(c: LClass): number {
    let sum = 0;
    if (c.extends.length === 0) {
        return c.references.length;
    } else {
        c.extends.map(s => sum += getAttributes(s));
        return c.references.length + sum;
    }
}

export const showMetrics = () => {
    windoww.MetricsPanelVisible = true;
}
export const hideMetrics = () => {
    windoww.MetricsPanelVisible = false;
    SetRootFieldAction.new('metrics-panel', {display: false});
}
export const toggleMetrics = () => {
    if (!windoww.MetricsPanelVisible) {
        windoww.MetricsPanelVisible = true;
    } else {
        windoww.MetricsPanelVisible = !windoww.MetricsPanelVisible;
    }
}

class MetricsPanelManager {
    static open(model: any) {
        if (!document) return;
        
        const metricsElement = document.createElement('div');
        createRoot(metricsElement).render(React.createElement(MetricsPanel, {data: model}));
        document.body.append(metricsElement);
    }
}

export const MetricsPanel = (props: MetricsProps) => {

    const [mode,setMode] = useState<string>('EMF');

    const getWidth = (value:int, scale: int) => {
        return 100/scale * value + '%';
    }

    return (<>
        {windoww.MetricsPanelVisible &&
            <div className={'metrics-panel'}>
                <h1>Metamodel Analytics
                    <CommandBar style={{float: 'right', height: '20px'}}>
                        <Btn icon={'close'} action={(e) => {hideMetrics(); return false;}} theme={'dark'} tip={'Close panel'}/>
                    </CommandBar>
                </h1>

                <div className={'analytics-panel'}>

                <div className={'category'}>
                    <label>
                        <CommandBar style={{float: 'left'}}>
                            <Btn icon={"info"} action={(e) => {alert('information page')}} theme={'dark'}/>
                        </CommandBar>
                        Metamodel classification as
                    </label>
                    <select id={'category'} onChange={(e) => {setMode(e.target.value)}}>
                        <option value={'EMF'}>EMF-based</option>
                        <option value={'DSML'}>DSML</option>
                        <option value={'GPML'}>GPML</option>
                    </select>

                </div>


                {mode === 'GPML' && <>
                    <div className={'chart GPML'}>
                        <div className={'legenda small'} >small</div>
                        <div className={'legenda medium'}>medium</div>
                        <div className={'legenda large'}>large</div>
                    </div>
                    <div className={'chart GPML'}>
                        <div className={'small section'}>50</div>
                        <div className={'medium section'}>150</div>
                        <div className={'large section'}>250</div>
                    </div>
                    <div className={'chart current'}
                        style={{gridTemplateColumns: `${getWidth(props.data.model.classes.length, 250)} auto`}}>
                        <div></div>
                        <div>
                            <div>{props.data.model.classes.length}</div>
                            <div>{props.data.model.name}</div>
                        </div>
                    </div>
                </>}
                {mode === 'EMF' && <>
                    <div className={'chart EMF'}>
                        <div className={'legenda small'} >small</div>
                        <div className={'legenda medium'}>medium</div>
                        <div className={'legenda large'}>large</div>
                    </div>
                    <div className={'chart EMF'}>
                        <div className={'small section'}>30</div>
                        <div className={'medium section'}>50</div>
                        <div className={'large section'}>80</div>
                    </div>
                    <div className={'chart current'}
                        style={{gridTemplateColumns: `${getWidth(props.data.model.classes.length, 80)} auto`}}>
                        <div></div>
                        <div>
                            <div>{props.data.model.classes.length}</div>
                            <div>{props.data.model.name}</div>
                        </div>
                    </div>
                </>}
                {mode === 'DSML' && <>
                    <div className={'chart DSML'}>
                        <div className={'legenda small'} >small</div>
                        <div className={'legenda medium'}>medium</div>
                        <div className={'legenda large'}>large</div>
                    </div>
                    <div className={'chart DSML'}>
                        <div className={'small section'}>10</div>
                        <div className={'medium section'}>30</div>
                        <div className={'large section'}>50</div>
                    </div>
                    <div className={'chart current'}
                        style={{gridTemplateColumns: `${getWidth(props.data.model.classes.length, 50)} auto`}}>
                        <div></div>
                        <div>
                            <div>{props.data.model.classes.length}</div>
                            <div>{props.data.model.name}</div>
                        </div>
                    </div>
                </>}
                </div>


                <hr style={{display: 'block', marginBottom: '5px'}}/>

                <div className={'container'}>
                    <div className={'hd'}>Acronym</div>
                    <div className={'hd'}>Name</div>
                    <div className={'hd value'}>Value</div>

                    <div>PKG</div>
                    <div># Packages</div>
                    <Metrics type={'package'} data={props.data}/>

                    <div>MC</div>
                    <div># Metaclasses</div>
                    <Metrics type={'metaclass'} data={props.data}/>

                    <div>AMC</div>
                    <div># Abstract Metaclasses</div>
                    <Metrics type={'abstract'} data={props.data}/>

                    <div>CMC</div>
                    <div># Concrete Metaclasses</div>
                    <Metrics type={'concrete'} data={props.data}/>

                    <div>IFLMC</div>
                    <div># Concrete Featureless Metaclasses</div>
                    <Metrics type={'iflmc'} data={props.data}/>

                    <div>MCWS</div>
                    <div># Metaclasses with Superclass</div>
                    <Metrics type={'mcws'} data={props.data}/>

                    <div>LMC</div>
                    <div>% Isolated Metaclasses</div>
                    <Metrics type={'lmc'} data={props.data}/>

                    <div>SF</div>
                    <div># Structural Features</div>
                    <Metrics type={'sf'} data={props.data}/>

                    <div>ASF</div>
                    <div>Avg # Structural Features</div>
                    <Metrics type={'asf'} data={props.data}/>

                    <div>EN/LIT</div>
                    <div># Enumeration/Literals</div>
                    <Metrics type={'enum'} data={props.data}/>
                </div>
                {/* <p><a target="_blank" href="https://dl.acm.org/doi/abs/10.1145/2593770.2593774">https://dl.acm.org/doi/abs/10.1145/2593770.2593774</a></p>*/}
            </div>
            }
    </>);
}

export const Metrics = (props: MetricsProps) => {



/*
    function getAttributes(c: LClass): number {
        let sum = 0;
        if (c.extends.length === 0) {
            return c.attributes.length;
        } else {
            c.extends.map(s => sum += getAttributes(s));
            return c.attributes.length + sum;
        }
    }
    function getReferences(c: LClass): number {
        let sum = 0;
        if (c.extends.length === 0) {
            return c.references.length;
        } else {
            c.extends.map(s => sum += getAttributes(s));
            return c.references.length + sum;
        }
    }*/
    let model: LModel = props.data.model;
    let classes: LClass[] = model.classes;
    let dclasses: DClass[] = classes.map(c=>c.__raw);
    function getAllAttributes(): number {
        let sum = 0;
        //props.data?.model.classes.map(c => sum += getAttributes(c));
        classes.forEach(c => sum += c.allAttributes.length); // includes attributes from inheritance at any level
        return sum;
    }
    function getAllReferences(): number {
        let sum = 0;
        //props.data?.model.classes.map(d => sum += getReferences(d));
        classes.forEach(c => sum += c.allReferences.length);
        return sum;
    }

    let allRefsCount = getAllReferences();
    let allAttrCount = getAllAttributes();
    return (<div className={"value"}>
        {props.type === "package" && <>{model.allSubPackages.length}</>}
        {props.type === "metaclass" && <>{classes.length}</>}
        {props.type === "abstract" && <>{dclasses.filter(c => c.abstract).length}</>}
        {props.type === "concrete" && <>{classes.length - dclasses.filter(c => c.abstract).length}</>}
        {props.type === "iflmc" && <>{dclasses.filter(c => (c.attributes.length + c.references.length) === 0).length}</>}
        {props.type === "mcws" && <>{dclasses.filter(c => c.extends.length > 0).length}</>}
        {props.type === "sf" && <>{allAttrCount + allRefsCount}</>}
        {props.type === "asf" && <>{((allAttrCount + allRefsCount)/(dclasses.filter(c => !c.abstract).length)).toFixed(2)}</>}
        {props.type === "enum" && <>{model.enumerators.length}/{model.literals.length}</>}
        {props.type === "attr" && <>{model.attributes.length}/{allAttrCount}</>}
        {props.type === "ref" && <>{model.references.length}/{allRefsCount}</>}
        {props.type === "lmc" && <>{((model.classes.filter(c => c.extends.length === 0 && c.extendedBy.length === 0).length/model.classes.length)*100).toFixed(2)}%</>}
        {props.type === "ext" && <>{dclasses.reduce((acc, c) => acc+c.extends.length, 0)}</>}
        </div>);
    // {props.type === "ext" && <>{model?.subNodes.filter(c => c.name === "EdgeInheritance").length}</>}
    // contare gli archi per gli extend non è corretto, uno potrebbe nasconderli.

}

export {MetricsPanelManager};