import {
    Any,
    DAttribute, DClass, DEnumerator, Dictionary, DModel, DocString, DReference,
    DState,
    Input, LAttribute, LClass, LClassifier, LEnumerator,
    LGraphElement,
    LModel,
    LModelElement,
    LObject, LPointerTargetable, LReference, LStructuralFeature, LValue,
    LViewElement, MultiSelect, Pointer, Pointers,
    Select,
    Selectors, SetFieldAction, SetRootFieldAction, store, TRANSACTION, U, ValueDetail
} from '../../joiner';
import {FakeStateProps, int, windoww} from '../../joiner/types';

import ReactJson from 'react-json-view' // npm i react-json-view --force
import React, {Component, Dispatch, JSX, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import './editors.scss';
import './info.scss';
import './info-improvements.scss';
import './style.scss';
import {Empty} from "./Empty";
import { CommandBar, Btn } from '../commandbar/CommandBar';
import { Tooltip } from '../forEndUser/Tooltip';
import { icon } from '../../pages/components/icons/Icons';
import { Toggle } from '../../joiner/components';
import { UpgradePrompt } from '../ModeSystem';
import { Button } from '../ui';

// Custom toggle switch component (div-based to avoid global checkbox styles)
function PropertiesToggle(props: { data: LModelElement; field: string }) {
    const { data, field } = props;
    const value = !!(data as any)[field];

    const handleToggle = () => {
        (data as any)[field] = !value;
    };

    return (
        <label className="toggle-switch">
            <input
                type="checkbox"
                checked={value}
                onChange={handleToggle}
                aria-label={field}
            />
            <span className="toggle-slider" />
        </label>
    );
}

class builder {
    static named(data: LModelElement, advanced: boolean, skipTitle: boolean = false): ReactNode {
        return (<>
            {!skipTitle && <h1>{data.name}</h1>}
            {!skipTitle && data.state.description && <><h2>{data.state.description}</h2></>}
            <div className={'form-field'}>
                <label className={'form-label'}>
                    Name
                    <span className="form-label-required">*</span>
                </label>
                <Input data={data} field={'name'} type={'text'} />
                <div className="form-hint">
                    <i className="bi bi-info-circle" />
                    Must be unique. Used as identifier in code generation.
                </div>
            </div>

            <div className="form-toggle-container">
                <div className="form-toggle-header">
                    <div className="form-toggle-content">
                        <h4 className="form-toggle-title">Read-only</h4>
                        <p className="form-toggle-description">Prevent modifications to this element</p>
                    </div>
                    <PropertiesToggle data={data} field={'__readonly'} />
                </div>
            </div>
        </>);
    }

    static model(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        let l = data as LModel;
        let d = l.__raw;
        let multiselectArr = d.dependencies;
        let multiselectValue: {value: string, label: string}[] = [];
        let state = store.getState();
        let validoptionsarr = Selectors.getAll(DModel, undefined, state, true, false) as DModel[];
        let multiselectOptions: {value: string, label: string}[] = validoptionsarr.map(c => {
            let opt = {value:c.id, label: c.name};
            if (opt.value === d.id) return undefined;
            if (!multiselectArr.includes(opt.value)) return opt;
            multiselectValue.push(opt);
            return undefined;
        }).filter(e=>!!e) as {value: string, label: string}[];
        // <Select data={data} isMulti={true} field={'dependencies'}/>

        return (<>
            {this.named(data, advanced, skipTitle)}

            <div className={'form-field'}>
                <label className={'form-label'}>
                    Model Dependencies
                    <span className="form-label-badge">Optional</span>
                </label>
                <MultiSelect
                    isMulti={true}
                    options={multiselectOptions as any}
                    value={multiselectValue}
                    placeholder="Select dependent models..."
                    onChange={(v) => {
                        console.log('setting model dependencies', v);
                        l.dependencies = v.map(e => e.value) as Any<string[]>;
                    }}
                />
                <div className="form-hint">
                    <i className="bi bi-info-circle" />
                    This model will import types from selected models
                </div>
            </div>
        </>);
    }

    static package(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {!skipTitle && <h1>{data.name}</h1>}
            {this.named(data, advanced, skipTitle)}
            <label className={'input-container'}>
                <b className={'me-2'}>Uri:</b>
                <Input data={data} field={'uri'} type={'text'}/>
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Prefix:</b>
                <Input data={data} field={'prefix'} type={'text'}/>
            </label>
        </>);
    }
    

    static class(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        let lclass: LClass = data as any;
        let dclass = lclass.__raw;
        /*
        let extendOptions: {value: string, label: string}[] lclass.extends.map(lsubclass=> ({value: lsubclass.id, label: lsubclass.name}));
        let m2: LModel = lclass.model;
        // let pkgs = lclass.allowCrossReference ? m2.allCrossSubPackages : m2.allSubPackages;
        let pkgs = lclass.validTargets;
        let extendsarr = dclass.extends;
        let extendValue: {value: string, label: string}[] = [];
        let extendOptions: {label: string, options: {value: string, label: string}[]}[] = pkgs.map(p => (
            {label: p.fullname, options: p.classes.map(c=> {
                let opt = {value:c.id, label: c.name};
                if (opt.value === dclass.id) return undefined;
                if (!extendsarr.includes(opt.value)) return opt;
                extendValue.push(opt);
                return undefined;
            }).filter(e=>!!e) as {value: string, label: string}[]}));*/
        //let extendOptions = pkgs.map(p => ({label: p.fullname, options: p.classes.map(c=> ({value:c.id as string, label:c.name}))}));

        let extendValue: {value: string, label: string}[] = lclass.extends.map(c=>({value:c.id, label:c.name}));
        let extendOptions = lclass.validTargetOptions;

        type WikidataSearchItem = {
            [x: string]: any;
            id: string;
            label: string;
            description?: string;
        };

        type WikidataSearchResponse = {
            search?: WikidataSearchItem[];
        };
        

        async function lookupWikidataTerm(term: string, language: string = "en"): Promise<WikidataSearchItem | null> {
            const params = new URLSearchParams({
                action: "wbsearchentities",
                search: term,
                language,
                format: "json",
                origin: "*" // <<< THIS IS CRITICAL FOR BROWSER CALLS
            });  

            lclass.state = {count: lclass.state.count||0};

            const incrementCount = (length: int) => {
                if (lclass.state.count||0 + 1 === length) {
                    lclass.state = {count: 0}      
                } else {
                    lclass.state = {count: lclass.state.count||0+1}
                }
            }

            const url = "https://www.wikidata.org/w/api.php?" + params.toString();

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: { Accept: "application/json" }
                    // no need to set mode explicitly; default is fine
                });

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }

                const data: WikidataSearchResponse = await response.json();

                if (!data.search || data.search.length === 0) {
                    return null;
                }

                const results = data.search.filter(
                    r => r.label.toLowerCase() === term.toLowerCase() && r.description !== 'family name'
                ).sort();

                if (!results || results.length === 0) {
                    return null;
                }

                const best = results[lclass.state.count||0];
                lclass.state = {description: best.description};
                // lclass.state = {label: best.label};
                lclass.state = {wikidataId: best.id};
                incrementCount(results.length);

                return best;
            } catch (error) {
                console.error("Error calling Wikidata:", error);
                return null;
            }
        }

      

        return (<>
            {this.named(data, advanced, skipTitle)}
            <label className={'input-container'}>
                <b className={'me-2'}>Class Description:</b>


                <Input
	                type="text"
                    getter={() => lclass.state.description||''}
                    setter={(value) => (lclass.state = { description: value })}
                />

            </label>
            <label className={'input-container'}>
                <b className={'me-2'}></b>

                <button className="btn-generate-ai" onClick={() => lookupWikidataTerm(lclass.name)}>
                    <i className="bi bi-magic" />
                    Generate with AI
                </button>
            </label>

            <div className={'input-container'}>
                <b className={'me-2'}>Abstract:
                    <Tooltip tooltip="Prevents direct instantiation. This class can only be inherited by other classes.">
                        <i className="bi bi-info-circle" style={{marginLeft: '6px', fontSize: '14px', color: '#94a3b8', cursor: 'help'}} />
                    </Tooltip>
                </b>
                <PropertiesToggle data={lclass} field={'abstract'} />
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Interface:
                    <Tooltip tooltip="Defines a contract that other classes must implement. Cannot contain method implementations.">
                        <i className="bi bi-info-circle" style={{marginLeft: '6px', fontSize: '14px', color: '#94a3b8', cursor: 'help'}} />
                    </Tooltip>
                </b>
                <PropertiesToggle data={lclass} field={'interface'} />
            </div>

            <label className={'input-container'}>
                <b className={'me-2'}>Extends:</b>
                <MultiSelect isMulti={true} options={extendOptions as any} value={extendValue} onChange={(v) => {
                    console.log('setting extend', v);
                    lclass.extends = v.map(e => e.value) as Any<string[]>;
                }} />
            </label>

            {advanced && (
                <>
                    <div className={'input-container'}>
                        <b className={'me-2'}>Allow extension from other packages:
                            <Tooltip tooltip="Classes in other packages can extend this class.">
                                <i className="bi bi-info-circle" style={{marginLeft: '6px', fontSize: '14px', color: '#94a3b8', cursor: 'help'}} />
                            </Tooltip>
                        </b>
                        <PropertiesToggle data={lclass} field={'allowCrossReference'} />
                    </div>

                    <div className={'input-container'}>
                        <b className={'me-2'}>Final:
                            <Tooltip tooltip="Prevents this class from being extended by other classes (opposite of Abstract).">
                                <i className="bi bi-info-circle" style={{marginLeft: '6px', fontSize: '14px', color: '#94a3b8', cursor: 'help'}} />
                            </Tooltip>
                        </b>
                        <PropertiesToggle data={lclass} field={'final'} />
                    </div>

                    <div className={'input-container'}>
                        <b className={'me-2'}>Singleton:
                            <Tooltip tooltip="Only one instance of this class can exist at runtime (Singleton pattern).">
                                <i className="bi bi-info-circle" style={{marginLeft: '6px', fontSize: '14px', color: '#94a3b8', cursor: 'help'}} />
                            </Tooltip>
                        </b>
                        <PropertiesToggle data={data} field={'singleton'} />
                    </div>

                    <div className={'input-container'}>
                        <b className={'me-2'}>Rootable:
                            <Tooltip tooltip="This element can be used as the root element in models (appears in toolbar).">
                                <i className="bi bi-info-circle" style={{marginLeft: '6px', fontSize: '14px', color: '#94a3b8', cursor: 'help'}} />
                            </Tooltip>
                        </b>
                        <PropertiesToggle data={data} field={'rootable'} />
                    </div>

                    <div className={'input-container'}>
                        <b className={'me-2'}>Partial:</b>
                        <PropertiesToggle data={data} field={'partial'} />
                    </div>
                </>
            )}
        </>);
    }

    static enum(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.named(data, advanced, skipTitle)}
            {advanced && <label className={'input-container'}>
                <b className={'me-2'}>Serializable:</b>
                <Input data={data} field={'serializable'} type={'checkbox'}/>
            </label>}
        </>);
    }

    static feature(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.named(data, advanced, skipTitle)}
            <label className={'input-container'}>
                <b className={'me-2'}>Type:</b>
                <Select data={data} field={'type'} />
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Lower Bound:</b>
                <Input data={data} field={'lowerBound'} type={'number'} />
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Upper Bound:</b>
                <Input data={data} field={'upperBound'} type={'number'} />
            </label>
            {advanced && <>
                <label className={'input-container'}>
                    <b className={'me-2'}>Unique:</b>
                    <Input data={data} field={'unique'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Ordered:</b>
                    <Input data={data} field={'ordered'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Changeable:</b>
                    <Input data={data} field={'changeable'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Volatile:</b>
                    <Input data={data} field={'volatile'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Transient:</b>
                    <Input data={data} field={'transient'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Unsettable:</b>
                    <Input data={data} field={'unsettable'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Derived:</b>
                    <Input data={data} field={'derived'} type={'checkbox'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Cross Reference:</b>
                    <Input data={data} field={'allowCrossReference'} type={'checkbox'}/>
                </label>
            </>}
        </>);
    }

    static attribute(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.feature(data, advanced, skipTitle)}
            {advanced && <>
                <label className={'input-container'}>
                    <b className={'me-2'}>ID:</b>
                    <Input data={data} field={'isID'} type={'checkbox'} />
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>IoT:</b>
                    <Input data={data} field={'isIoT'} type={'checkbox'} />
                </label>
            </>}
        </>);
    }
    static reference(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.feature(data, advanced, skipTitle)}
            <label className={'input-container'}>
                <b className={'me-2'}>Composition:</b>
                <Input data={data} field={'composition'} type={'checkbox'} />
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Aggregation:</b>
                <Input data={data} field={'aggregation'} type={'checkbox'} />
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Container:</b>
                <Input data={data} field={'container'} type={'checkbox'} />
            </label>
        </>);
    }
    static operation(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.named(data, advanced, skipTitle)}
            <label className={'input-container'}>
                <b className={'me-2'}>Return:</b>
                <Select data={data} field={'type'} />
            </label>
        </>);
    }
    static literal(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.named(data, advanced, skipTitle)}
            <label className={'input-container'}>
                <b className={'me-2'}>Ordinal:</b>
                <Input data={data} field={'ordinal'} type={'number'} />
            </label>
        </>);
    }
    static object(data: LModelElement, topics: Dictionary<string, unknown>, advanced: boolean, mode: 'popup'|'tab'|'inline'): JSX.Element {

        const popup = mode === 'popup';
        const inline = mode === 'inline';
        const tab = mode === 'tab';

        const object: LObject = LObject.fromPointer(data.id);
        let conform = true;
        for(const feature of object.features) {
            let upperBound =  feature.instanceof ? feature.instanceof.upperBound : -1;
            upperBound = (upperBound === -1) ? 999 : upperBound;
            const lowerBound =  feature.instanceof ? feature.instanceof.lowerBound : -1;
            const value = feature.values;
            conform = (value.length >= lowerBound && value.length <= upperBound);
        }
        let instanceoff = object.instanceof;
        return(<>
            {tab && 
                <h1>{data.name}: {instanceoff && conform && instanceoff.name}</h1>
            }
            {popup && <>
                    <h1>Edit {data.name}: {instanceoff && conform && instanceoff.name}</h1>
                    <b>Properties</b>
                </>
            }
           
            {tab && instanceoff && conform && <label className={'d-block text-center'}>
                The instance <b className={'text-success'}>CONFORMS</b> to {instanceoff.name}
            </label>}

            {tab && instanceoff && !conform && <label className={'d-block text-center'}>
                The instance <b className={'text-danger'}>NOT CONFORMS</b> to {instanceoff.name}
            </label>}
            {tab && !instanceoff && <label className={'d-block text-center'}>
                The instance is <b className={'text-warning'}>SHAPELESS</b>
            </label>}

            {instanceoff && !object.partial ? null :
                tab && <label className={'input-container'}>

                    <CommandBar style={{marginLeft: 'auto', marginTop: '6px'}}>
                        <Btn icon={'add'} action={()=> object.addValue()} tip={`Add a feature`} className={'add-feature'} />
                    </CommandBar>

                </label>
            }

            {tab && this.forceConform(object)}

            {object.features.map(f => <div id={`Object-${f.id}`}>
                {this.value(f, topics, advanced, mode)}
            </div>)}
        </>);
    }

    static forceConform(me: LObject) {
        let mm: LModel = Selectors.getLastSelectedModel().m2 as LModel;
        if (!mm) return <></>
        return(<label className={'input-container'}>
            <b className={'me-2'}>Force Type:</b>
            <select className={'my-auto ms-auto select'} onChange={ (event)=>{
                (window as any).debugmm = mm;
                (window as any).debugm = me;
                me.instanceof = event.target.value === 'undefined' ? undefined : event.target.value as any;
            } } value={me.instanceof?.id || 'undefined'}>
                <optgroup label={mm.name}>
                    {(mm.classes || []).map( c =>
                            <option value={c.id}>{c?.name || c.id}</option>
                    )}
                    <option value={'undefined'}>Object</option>
                </optgroup>
            </select>
        </label>);
    }

    static value(data: LModelElement, topics: Dictionary<string, unknown>, advanced: boolean, mode: 'popup'|'tab'|'inline'): JSX.Element {
        const popup = mode === 'popup';
        const inline = mode === 'inline';
        const tab = mode === 'tab';

        let value: LValue = LValue.fromPointer(data.id);
        const feature: LStructuralFeature = LStructuralFeature.fromPointer(value.instanceof?.id);
        let field = 'text'; let stepSize = 1; let maxLength = 524288;
        const min = -9223372036854775808;
        const max = 9223372036854775807;
        switch (feature?.type.name) {
            case 'EChar': maxLength = 1; break;
            case 'EInt':
            case 'ELong':
            case 'EShort':
            case 'Byte': field = 'number'; break;
            case 'EFloat': field = 'number'; stepSize = 0.1; break;
            case 'EDouble': field = 'number'; stepSize = 0.01; break;
            case 'EBoolean': field = 'checkbox'; break;
            case 'EDate': field = 'date'; break;
            default: field = 'text'; break;
        }
        let upperBound = feature ? (feature as LReference | LAttribute).__raw.upperBound : -1;
        if (upperBound < 0) upperBound = 999;
        let filteredValues: ValueDetail[] = value.getValues(true, false, false, false, true, true) as any;

        const add = () => {
            value = value.r;
            SetFieldAction.new(value.id, 'values', U.initializeValue(feature?.type), '+=', false);
        }
        const remove = (index: number, isPointer: boolean | undefined) => {
            console.log('remove clicked');
            value = value.r;
            if (isPointer === undefined) isPointer = Pointers.isPointer(filteredValues[index].rawValue); // !!(filteredValues[index].value as any)?.__isProxy ||
            // SetFieldAction.new(value.id, 'values', index, '-=', isPointer);

            let result = value.setValueAtPosition(index, undefined, {isPtr: isPointer});
            console.log('clearing containment DValue', {result, index, value});
        }
        function changeDValue(evt: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean | undefined) {
            TRANSACTION('change value (sidebar)', ()=>{
                value = value.r;
                let target = evt.target as HTMLInputElement;
                let inputValue: string | boolean = field === 'checkbox' ? target.checked : target.value;
                if (inputValue === 'undefined') inputValue = undefined as any;
                let raw_values = value.__raw.values;
                isPointer = isPointer || Pointers.isPointer(raw_values[index]) || Pointers.isPointer(inputValue);

                let oldvi = raw_values[index];
                if (isPointer && value.containment){
                    let indexDuplicate = raw_values.indexOf(inputValue as any);
                    if (indexDuplicate === index) return;
                    if (indexDuplicate >= 0) {
                        let result = value.setValueAtPosition(indexDuplicate, undefined, {isPtr: true});
                        console.log('clearing containment DValue', {inputValue, result, indexDuplicate, raw_values, index, oldvi});
                    }
                }
                let result = value.setValueAtPosition(index, inputValue, {isPtr: isPointer});
                console.log('setting DValue', {inputValue, result, value, index, oldvi, evt, target, field});
            })
        }
        const featureType: LClassifier = feature?.type;
        let isAttribute = false, isEnumerator = false, isReference = false, isShapeless = false, isComposition = false;
        
        // Detect if a reference is also a composition
        switch (feature?.className){
            case DReference.cname:
                isReference = true;
                // Check if the reference is a composition
                isComposition = (feature as LReference)?.composition === true;
                if (isComposition) {
                    isReference = false; // 
                }
            break;
            case DAttribute.cname:
                if (featureType.className === DClass.cname) isAttribute = true; else
                if (featureType.className === DEnumerator.cname) isEnumerator = true;
                break;
            case DReference.cname: isReference = true; 
                break;
            default: isShapeless = true; 
                break;
        }

        let selectOptions: JSX.Element | JSX.Element[] | null = value.validTargetsJSX;

        let isPtr = isAttribute ? false : (isEnumerator || isReference ? true : undefined);
        const valueslist = (filteredValues).map((val, index) =>
            val.hidden ? null :
                <label className={'mt-1 d-flex ms-4'} key={index}>
                    {/* <div className={'border border-dark'}></div>*/}

                    {/* Attribute */}
                    
                    {isAttribute && <Input key={'a'+index} setter={(val: any) => { changeDValue({target:{value:val, checked:!!val}} as any, index, false) }}
                                           className={'input m-auto ms-1' /*@ts-ignore*/}
                                           getter={()=>val.value as any} min={min} max={max} type={field as any} step={stepSize}
                                           maxLength={maxLength} placeholder={'empty'}/> }
                   
                    {/* Enumerator */}
                    
                    {isEnumerator && <select key={'e'+index} onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                            {<option key='undefined' value={'undefined'}>-----</option>}
                            {selectOptions}
                    </select>}
                    
                    {/* Reference */}
                    
                    {isReference && <select key={'r'+index} onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                            <option value={'undefined'}>-----</option>
                            {selectOptions}
                        </select>
                    }
                    
                    {/* Composition - to finalize */}
                    
                    {isComposition && (() => {
                        const element = LModelElement.fromPointer(val.rawValue+'');
                        if (!inline) {
                            return <div className={`item ${inline && 'inline'}`}>
                                {/*@ts-ignore*/}
                                {popup && element && <b>{element.instanceof.name}</b>}
                                {!popup && <select key={'r'+index} onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                                    <option value={'undefined'}>-----</option>
                                    {selectOptions}
                                </select>}
                                {popup && 
                                    <div className={'inline'}>
                                        <Info mode={'inline'} localData={element} />
                                    </div>}
                            </div>;
                        } 
                    })()}

                    {/* Shapeless */}

                    {isShapeless && <>
                        {<Input key={'raw' + index} setter={(val: any) => {changeDValue({target:{value:val, checked:!!val}} as any, index, false)}}
                                className={'input m-auto ms-1' /*@ts-ignore*/}
                                getter={()=>val.rawValue} list={'objectdatalist'} type={'text'} placeholder={'empty'}/>}
                        <span className={'ms-1 my-auto'}>→</span>
                        {<select key={index} onChange={(evt) => {changeDValue(evt, index, undefined)}} className={'select m-auto ms-1'} value={val.rawValue+''}>
                            {selectOptions}
                        </select>}
                    </>}

                    <CommandBar>
                        <Btn icon={'delete'} tip={'Remove value'} action={(evt) => {remove(index, isPtr)}} />
                    </CommandBar>
                    {/* <button className={'btn m-auto ms-2'} onClick={(evt) => {remove(index, isPtr)}}>
                        <i className={'p-1 bi bi-trash3'} style={{color: 'var(--color)'}}></i>
                    </button>*/}
                </label>);

        return(<>
            {tab ? 
                <>
                    <h1>{data.name}</h1> 
                    <label className={'d-flex'}>
                    <label className={'ms-1 my-auto'}>Values</label>
                    <CommandBar style={{marginLeft: 'auto', marginTop: '6px'}}>
                        <Btn icon={'add'} action={add} tip={`Add a ${data.name} value`} disabled={filteredValues.length >= upperBound}/>
                    </CommandBar>
                    {/* <button className={'btn btn-primary ms-auto me-1'} disabled={filteredValues.length >= upperBound} onClick={add}>
                        <i className={'p-1 bi bi-plus'}></i>
                    </button>*/}
                    </label>
                </>
            : 
                <>
                    <label className={'d-flex'}>
                    <label className={'ms-1 my-auto'}>{data.name}</label>
                    <CommandBar style={{marginLeft: 'auto', marginTop: '0px'}}>
                        {!isComposition && <Btn icon={'add'} 
                            action={add} 
                            tip={`Add a ${data.name} value`} 
                            disabled={filteredValues.length >= upperBound} 
                            style={{color: 'black'}}
                        />}
                    </CommandBar>
                    {/* <button className={'btn ms-auto me-1'} disabled={filteredValues.length >= upperBound} onClick={add}>
                        <i className={'p-1 bi bi-plus'}></i>
                    </button>*/}
                    </label>
                </>
            }
           
            {valueslist}
            {value.instanceof?.className === 'DAttribute' && (value.instanceof as LAttribute).isIoT && <label className={'mt-2 input-container'}>
                <b className={'me-2'}>Topic:</b>
                <select className={'my-auto ms-auto select'} defaultValue={value.topic} onChange={e => value.topic = e.target.value}>
                    <optgroup label={'topics'}>
                        <option value={''}>------</option>
                        {U.extractTopics(topics).map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                </select>
            </label>}
        </>)
    }
}

// Helper to get element type info
function getElementTypeInfo(className: string): { badge: string; badgeClass: string; icon: string } {
    switch (className) {
        case 'DModel':
            return { badge: 'Metamodel', badgeClass: 'metamodel', icon: 'bi-diagram-3' };
        case 'DPackage':
            return { badge: 'Package', badgeClass: 'model', icon: 'bi-folder' };
        case 'DClass':
            return { badge: 'Class', badgeClass: 'class', icon: 'bi-box' };
        case 'DEnumerator':
            return { badge: 'Enum', badgeClass: 'class', icon: 'bi-list-ol' };
        case 'DAttribute':
            return { badge: 'Attribute', badgeClass: 'attribute', icon: 'bi-type' };
        case 'DReference':
            return { badge: 'Reference', badgeClass: 'reference', icon: 'bi-link-45deg' };
        case 'DOperation':
            return { badge: 'Operation', badgeClass: 'attribute', icon: 'bi-gear' };
        case 'DParameter':
            return { badge: 'Parameter', badgeClass: 'attribute', icon: 'bi-three-dots' };
        case 'DEnumLiteral':
            return { badge: 'Literal', badgeClass: 'attribute', icon: 'bi-hash' };
        case 'DObject':
            return { badge: 'Object', badgeClass: 'model', icon: 'bi-circle' };
        case 'DValue':
            return { badge: 'Value', badgeClass: 'attribute', icon: 'bi-pencil' };
        default:
            return { badge: 'Element', badgeClass: 'model', icon: 'bi-square' };
    }
}

// Header component for the new design
function PropertiesHeader(props: { data: LModelElement; className: string }) {
    const { data, className } = props;
    const typeInfo = getElementTypeInfo(className);
    const description = data.state?.description || '';

    return (
        <div className="properties-header">
            <div className="properties-header-icon">
                <i className={`bi ${typeInfo.icon}`} />
            </div>
            <div className="properties-header-content">
                <div className="properties-header-top">
                    <h1 className="properties-header-name">{data.name || 'Unnamed'}</h1>
                    <span className={`properties-header-badge ${typeInfo.badgeClass}`}>
                        {typeInfo.badge}
                    </span>
                </div>
                {description && (
                    <p className="properties-header-description">{description}</p>
                )}
            </div>
        </div>
    );
}

// Overview stats for Model/Metamodel
function PropertiesOverview(props: { data: LModel }) {
    const { data } = props;
    const packages = data.packages?.length || 0;
    const classes = data.classes?.length || 0;
    const enumerators = data.enumerators?.length || 0;

    return (
        <div className="properties-section">
            <div className="properties-section-header">
                <h3 className="properties-section-title">Overview</h3>
            </div>
            <div className="properties-section-content">
                <div className="overview-grid" style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    {/* Packages Card */}
                    <div className="stat-card" title="View packages" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        width: '220px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px'
                        }}>
                            <i className="bi bi-folder" style={{
                                fontSize: '18px',
                                color: '#64748b'
                            }} />
                        </div>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '2px'
                        }}>{packages}</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#6b7280',
                            textAlign: 'center'
                        }}>Packages</div>
                    </div>

                    {/* Classes Card */}
                    <div className="stat-card" title="View classes" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        width: '220px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px'
                        }}>
                            <i className="bi bi-grid-3x3" style={{
                                fontSize: '18px',
                                color: '#64748b'
                            }} />
                        </div>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '2px'
                        }}>{classes}</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#6b7280',
                            textAlign: 'center'
                        }}>Classes</div>
                    </div>

                    {/* Enumerators Card */}
                    <div className="stat-card" title="View enumerators" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        width: '220px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px'
                        }}>
                            <i className="bi bi-list-ol" style={{
                                fontSize: '18px',
                                color: '#64748b'
                            }} />
                        </div>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '2px'
                        }}>{enumerators}</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#6b7280',
                            textAlign: 'center'
                        }}>Enumerators</div>
                    </div>
                </div>

                {/* Analytics Box with Link */}
                <div className="overview-analytics-box" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginTop: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="bi bi-bar-chart-line" style={{
                            fontSize: '16px',
                            color: '#475569'
                        }} />
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#334155'
                        }}>Additional metrics and insights available in Metamodel Analytics</span>
                    </div>
                    <button style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        background: '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#475569'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#334155'}
                    onClick={() => console.log('Navigate to Metamodel Analytics')}>
                        <span>View Analytics</span>
                        <i className="bi bi-arrow-right" style={{ fontSize: '12px', color: 'white' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Actions section
function PropertiesActions(props: {
    data: LModelElement;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void
}) {
    const { data, onEdit, onDuplicate, onDelete } = props;

    return (
        <div className="properties-section">
            <div className="properties-section-header">
                <h3 className="properties-section-title">Actions</h3>
            </div>
            <div className="properties-section-content">
                <div className="properties-actions" style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    marginBottom: '12px'
                }}>
                    {onEdit && (
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<i className="bi bi-pencil" />}
                            onClick={onEdit}
                        >
                            Edit
                        </Button>
                    )}
                    {onDuplicate && (
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<i className="bi bi-copy" />}
                            onClick={onDuplicate}
                        >
                            Duplicate
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="danger"
                            size="sm"
                            icon={<i className="bi bi-trash" />}
                            onClick={onDelete}
                        >
                            Delete
                        </Button>
                    )}
                </div>
                <div className="action-hint" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#6b7280'
                }}>
                    <i className="bi bi-info-circle" style={{ fontSize: '14px', color: '#9ca3af' }} />
                    <span>These actions affect the selected element. Changes can be undone with Ctrl+Z.</span>
                </div>
            </div>
        </div>
    );
}

function InfoComponent(props: AllProps) {

    const {node, view, topics, advanced, mode} = props;

    const popup = mode === 'popup';
    const inline = mode === 'inline';
    const tab = mode === 'tab';

    // State for collapsible sections
    const [advancedStateOpen, setAdvancedStateOpen] = useState(false);

    var data = props.data;

    if (inline) {
        // If inline mode, use localData
        if (!props.localData) return <Empty />;
        else {
            // @ts-ignore
            data = props.localData;
        }
    }

    let ddata = data?.__raw || data;
    let jsx: ReactNode = null;

    // Check if we should use the new panel design (tab mode with valid className)
    const useNewDesign = !!(tab && data && ddata?.className && !['DObject', 'DValue'].includes(ddata.className));

    // Build jsx with skipTitle for new design
    if (data) switch (ddata?.className) {
        case 'DModel':
            jsx = builder.model(data, advanced, useNewDesign); break;
        case 'DPackage':
            jsx = builder.package(data, advanced, useNewDesign); break;
        case 'DClass':
            jsx = builder.class(data, advanced, useNewDesign); break;
        case 'DEnumerator':
            jsx = builder.enum(data, advanced, useNewDesign); break;
        case 'DAttribute':
            jsx = builder.attribute(data, advanced, useNewDesign); break;
        case 'DReference':
            jsx = builder.reference(data, advanced, useNewDesign); break;
        case 'DOperation':
            jsx = builder.operation(data, advanced, useNewDesign); break;
        case 'DParameter':
            jsx = builder.operation(data.father, advanced, useNewDesign); break;
        case 'DEnumLiteral':
            jsx = builder.literal(data, advanced, useNewDesign); break;
        case 'DObject':
            jsx = builder.object(data, topics, advanced, mode); break;
        case 'DValue':
            jsx = builder.value(data, topics, advanced, mode); break;
        default: jsx = <Empty />; break;
    } else jsx = <Empty />;

    // Tab mode: Always show the Properties panel structure
    if (tab) {
        // No element selected - show empty state
        if (!data || !ddata?.className) {
            return (
                <section className="properties-tab properties-panel properties-panel--empty">
                    <Empty />
                </section>
            );
        }

        // Element selected - show full properties panel
        const showOverview = ddata.className === 'DModel';
        const showActions = ['DModel', 'DClass', 'DEnumerator', 'DAttribute', 'DReference', 'DOperation'].includes(ddata.className);

        return (
            <section className="properties-tab properties-panel">
                {/* Header */}
                <PropertiesHeader data={data} className={ddata.className} />

                {/* Overview - only for Models */}
                {showOverview && <PropertiesOverview data={data as LModel} />}

                {/* Details Section */}
                <div className="properties-section">
                    <div className="properties-section-header">
                        <h3 className="properties-section-title">Details</h3>
                    </div>
                    <div className="properties-section-content">
                        {jsx}
                    </div>
                </div>

                {/* State Section - Advanced Mode Only (Collapsible) */}
                {advanced && (
                    <div className="properties-section properties-section--collapsible">
                        <button
                            className="properties-section-header"
                            onClick={() => setAdvancedStateOpen(!advancedStateOpen)}
                        >
                            <div className="properties-section-title">
                                <i className={`bi ${advancedStateOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                                <i className="bi bi-braces" />
                                Advanced State
                            </div>
                            <span className="properties-section-badge advanced">Optional</span>
                        </button>

                        {advancedStateOpen && (
                            <div className="properties-section-content">
                                {!ddata || Object.keys(ddata._state).length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <i className="bi bi-code-slash" />
                                        </div>
                                        <div className="empty-state-title">No custom state defined</div>
                                        <div className="empty-state-description">
                                            Advanced state properties are empty. This is normal for most elements.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="object-state" style={{ margin: 0, border: 'none' }}>
                                        <ReactJson
                                            src={ddata._state}
                                            collapsed={1}
                                            collapseStringsAfterLength={20}
                                            displayDataTypes={true}
                                            displayObjectSize={true}
                                            enableClipboard={true}
                                            groupArraysAfterLength={100}
                                            indentWidth={4}
                                            name={"state"}
                                            iconStyle={"triangle"}
                                            quotesOnKeys={true}
                                            shouldCollapse={false}
                                            sortKeys={false}
                                            theme={"rjv-default"}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                {showActions && (
                    <PropertiesActions
                        data={data}
                        onEdit={node?.select ? () => node?.select() : undefined}
                        onDuplicate={data?.duplicate ? () => data?.duplicate?.() : undefined}
                        onDelete={data?.delete ? () => data?.delete?.() : undefined}
                    />
                )}

                {/* Upgrade Prompt - Basic Mode Only */}
                {!advanced && (
                    <UpgradePrompt
                        features={[
                            'View and edit element state',
                            'Access advanced class options',
                            'Configure OCL constraints'
                        ]}
                    />
                )}
            </section>
        );
    }

    // Fallback to original design for popup/inline modes
    return <section className={'properties-tab'}>

        {jsx}

        {tab && <><hr/>
            <h6>State</h6>
            <div className={'object-state'}>
                {!ddata || Object.keys(ddata._state).length === 0 ? <pre> Empty</pre> :
                    <ReactJson src={ddata._state}
                            collapsed={1}
                            collapseStringsAfterLength={20}
                            displayDataTypes={true}
                            displayObjectSize={true}
                            enableClipboard={true}
                            groupArraysAfterLength={100}
                            indentWidth={4}
                            name={"state"}
                            iconStyle={"triangle"}
                            quotesOnKeys={true}
                            shouldCollapse={false /*((field: CollapsedFieldProps) => { return Object.keys(field.src).length > 3;*/}
                            sortKeys={false}
                            theme={"rjv-default"}
                    />}
                {/*<pre>{Object.keys(dnode._state).length ? JSON.stringify(dnode._state, null, '\t') : undefined}</pre>*/}
            </div> </>}
        </section>

        }

interface OwnProps {
    mode: 'popup' | 'tab' | 'inline'; // popup: used in context menu, tab: used in sidebar
    style?: React.CSSProperties;
    localData?: LModelElement; // used in inline mode
}

interface StateProps {
    node?: LGraphElement
    view?: LViewElement
    data?: LModelElement
    topics: Dictionary<string, unknown>
    advanced: boolean
}

interface DispatchProps {
}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeID = state._lastSelected?.node;
    const viewID = state._lastSelected?.view;
    const dataID = state._lastSelected?.modelElement;
    if (nodeID) ret.node = LGraphElement.fromPointer(nodeID);
    if (viewID) ret.view = LViewElement.fromPointer(viewID);
    if (dataID) ret.data = LModelElement.fromPointer(dataID);
    ret.topics = state.topics;
    ret.advanced = state.advanced;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const InfoConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(InfoComponent);

export const Info = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <InfoConnected {...{...props, children}} />;
}
export default Info;
