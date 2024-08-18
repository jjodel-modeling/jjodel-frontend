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


export const MetricsPanel = (props: MetricsProps) => {
    
    return (<>
        {windoww.MetricsPanelVisible && 
            <div className={'metrics-panel'}>
                <h1>Metamodel Metrics
                    <CommandBar style={{float: 'right', height: '20px'}}>
                        <Btn icon={'close'} action={(e) => {hideMetrics(); return false;}} theme={'dark'} tip={'Close metrics panel'}/>
                    </CommandBar>
                </h1>
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
                    
                    <div>SF</div>
                    <div># Structural Features</div>
                    <Metrics type={'sf'} data={props.data}/>
                    
                    <div>ASF</div>
                    <div>Avg # Structural Features</div>
                    <Metrics type={'asf'} data={props.data}/>
                </div>
                <p><a target="_blank" href="https://dl.acm.org/doi/abs/10.1145/2593770.2593774">https://dl.acm.org/doi/abs/10.1145/2593770.2593774</a></p>
            </div>
                    
                    /*
                    <div className={'metrics-row'}>
                        <label className={'name'}>Attributes/Inherited:</label>
                        <Metrics type={'attr'} data={props.data}/>
                    </div>
                    <div className={'metrics-row'}>
                        <label className={'name'}>References/Inherited:</label>
                        <Metrics type={'ref'} data={props.data}/> 
                    </div>
                    <div className={'metrics-row'}>
                        <label className={'name'}>Enumerators/Literals:</label>
                        <Metrics type={'ref'} data={props.data}/> 
                    </div>
                    <div className={'metrics-row'}>
                        <label className={'name'}>Extend relations:</label>
                        <Metrics type={'ext'} data={props.data}/> 
                    </div>
                </div>
        </div>*/}
    </>);
}

export const Metrics = (props: MetricsProps) => {

    

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
    function getAllAttributes(): number {
        let sum = 0;
        props.data?.model.classes.map(c => sum += getAttributes(c));
        return sum;
    }
    function getAllReferences(): number {
        let sum = 0;
        props.data?.model.classes.map(d => sum += getReferences(d));
        return sum;
    }

    return (<div className={"value"}>
        {props.type === "package" && <>{props.data?.model.packages.length}</>}
        {props.type === "metaclass" && <>{props.data?.model.classes.length}</>}
        {props.type === "abstract" && <>{props.data?.model.classes.filter(c => c.abstract).length}</>}
        {props.type === "concrete" && <>{props.data?.model.classes.length - props.data?.model.classes.filter(c => c.abstract).length}</>}
        {props.type === "iflmc" && <>{props.data?.model.classes.filter(c => c.attributes.length == 0 && c.references.length == 0).length}</>}
        {props.type === "mcws" && <>{props.data?.model.classes.filter(c => c.extends.length > 0).length}</>}
        {props.type === "sf" && <>{getAllAttributes() + getAllReferences()}</>}
        {props.type === "asf" && <>{((getAllAttributes() + getAllReferences())/(props.data?.model.classes.filter(c => !c.abstract).length)).toFixed(2)}</>}

        {props.type === "attr" && <>{props.data?.model.attributes.length}/{getAllAttributes()}</>}
        {props.type === "ref" && <>{props.data?.model.references.length}/{getAllReferences()}</>}
        {props.type === "enum" && <>{props.data?.model.enumerators.length}/{props.data?.model.literals.length}</>}    
        {props.type === "ext" && <>{props.data?.model.subNodes.filter(c => c.name === "EdgeInheritance").length}</>}
        </div>);

}