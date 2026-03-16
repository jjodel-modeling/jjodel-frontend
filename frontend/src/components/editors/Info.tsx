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
// import { UpgradePrompt } from '../ModeSystem'; // TODO: reintroduce as toast or first-visit hint
import { Button, EmptyState } from '../ui';
import { M2AnalyticsModal, M2AnalyticsData } from '../M2AnalyticsModal';

// Collapsible section for properties panel grouping
function CollapsibleSection(props: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const { title, defaultOpen = true, children } = props;
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={`props-section ${open ? 'props-section--open' : 'props-section--closed'}`}>
            <button
                type="button"
                className="props-section__header"
                onClick={() => setOpen(!open)}
            >
                <span className="props-section__title">{title}</span>
                <i className={`bi bi-chevron-right props-section__chevron ${open ? 'props-section__chevron--open' : ''}`} />
            </button>
            {open && (
                <div className="props-section__body">
                    {children}
                </div>
            )}
        </div>
    );
}

// Custom checkbox component for boolean properties (14×14px, shadcn/ui style)
function PropertiesCheckbox(props: { data: LModelElement; field: string }) {
    const { data, field } = props;
    const value = !!(data as any)[field];

    const handleChange = () => {
        (data as any)[field] = !value;
    };

    return (
        <span className="props-custom-checkbox">
            <input
                type="checkbox"
                checked={value}
                onChange={handleChange}
            />
            <span className="props-custom-checkbox__indicator">
                <svg viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L5 9L9.5 3.5" />
                </svg>
            </span>
        </span>
    );
}

class builder {
    static named(data: LModelElement, advanced: boolean, skipTitle: boolean = false): ReactNode {
        return (<>
            {!skipTitle && <h1>{data.name}</h1>}
            {!skipTitle && data.state.description && <><h2>{data.state.description}</h2></>}
            <label className={'input-container'}>
                <b className={'me-2'}>Name</b>
                <Input data={data} field={'name'} type={'text'} />
            </label>
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

        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
            </CollapsibleSection>

            <CollapsibleSection title="DEPENDENCIES">
                <label className={'input-container'}>
                    <b className={'me-2'}>Depends from models</b>
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
                </label>
            </CollapsibleSection>
        </>);
    }

    static package(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
                <label className={'input-container'}>
                    <b className={'me-2'}>Uri</b>
                    <Input data={data} field={'uri'} type={'text'}/>
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Prefix</b>
                    <Input data={data} field={'prefix'} type={'text'}/>
                </label>
            </CollapsibleSection>
        </>);
    }
    

    static class(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        let lclass: LClass = data as any;

        let extendValue: {value: string, label: string}[] = lclass.extends.map(c=>({value:c.id, label:c.name}));
        let extendOptions = lclass.validTargetOptions;

        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
            </CollapsibleSection>

            <CollapsibleSection title="INHERITANCE">
                <label className={'input-container'}>
                    <PropertiesCheckbox data={lclass} field={'abstract'} />
                    <b className={'me-2'}>Abstract</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={lclass} field={'interface'} />
                    <b className={'me-2'}>Interface</b>
                </label>
                {/* TODO: mostrare in Advanced mode
                <label className={'input-container'}>
                    <b className={'me-2'}>Extends</b>
                    <MultiSelect isMulti={true} options={extendOptions as any} value={extendValue} onChange={(v) => {
                        console.log('setting extend', v);
                        lclass.extends = v.map(e => e.value) as Any<string[]>;
                    }} />
                </label>
                */}
                <label className={'input-container'}>
                    <PropertiesCheckbox data={lclass} field={'allowCrossReference'} />
                    <b className={'me-2'}>Allow cross-extend</b>
                </label>
            </CollapsibleSection>

            <CollapsibleSection title="FLAGS">
                <label className={'input-container'}>
                    <PropertiesCheckbox data={lclass} field={'final'} />
                    <b className={'me-2'}>Final</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'singleton'} />
                    <b className={'me-2'}>Singleton</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'rootable'} />
                    <b className={'me-2'}>Rootable</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'partial'} />
                    <b className={'me-2'}>Partial</b>
                </label>
            </CollapsibleSection>
        </>);
    }

    static enum(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
                {advanced && <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'serializable'} />
                    <b className={'me-2'}>Serializable</b>
                </label>}
            </CollapsibleSection>
        </>);
    }

    static feature(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
            </CollapsibleSection>

            <CollapsibleSection title="TYPE &amp; BOUNDS">
                <label className={'input-container'}>
                    <b className={'me-2'}>Type</b>
                    <Select data={data} field={'type'} />
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Lower bound</b>
                    <Input data={data} field={'lowerBound'} type={'number'} />
                </label>
                <label className={'input-container'}>
                    <b className={'me-2'}>Upper bound</b>
                    <Input data={data} field={'upperBound'} type={'number'} />
                </label>
            </CollapsibleSection>

            {advanced && <CollapsibleSection title="ADVANCED" defaultOpen={false}>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'unique'} />
                    <b className={'me-2'}>Unique</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'ordered'} />
                    <b className={'me-2'}>Ordered</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'changeable'} />
                    <b className={'me-2'}>Changeable</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'volatile'} />
                    <b className={'me-2'}>Volatile</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'transient'} />
                    <b className={'me-2'}>Transient</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'unsettable'} />
                    <b className={'me-2'}>Unsettable</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'derived'} />
                    <b className={'me-2'}>Derived</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'allowCrossReference'} />
                    <b className={'me-2'}>Cross Reference</b>
                </label>
            </CollapsibleSection>}
        </>);
    }

    static attribute(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.feature(data, advanced, true)}
            {advanced && <CollapsibleSection title="FLAGS" defaultOpen={false}>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'isID'} />
                    <b className={'me-2'}>ID</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'isIoT'} />
                    <b className={'me-2'}>IoT</b>
                </label>
            </CollapsibleSection>}
        </>);
    }
    static reference(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            {this.feature(data, advanced, true)}

            <CollapsibleSection title="FLAGS">
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'composition'} />
                    <b className={'me-2'}>Composition</b>
                </label>
                <label className={'input-container'}>
                    <PropertiesCheckbox data={data} field={'aggregation'} />
                    <b className={'me-2'}>Aggregation</b>
                </label>
            </CollapsibleSection>
        </>);
    }
    static operation(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
            </CollapsibleSection>

            <CollapsibleSection title="RETURN">
                <label className={'input-container'}>
                    <b className={'me-2'}>Return type</b>
                    <Select data={data} field={'type'} />
                </label>
            </CollapsibleSection>
        </>);
    }
    static literal(data: LModelElement, advanced: boolean, skipTitle: boolean = false): JSX.Element {
        return (<>
            <CollapsibleSection title="GENERAL">
                {this.named(data, advanced, true)}
            </CollapsibleSection>

            <CollapsibleSection title="VALUE">
                <label className={'input-container'}>
                    <b className={'me-2'}>Ordinal</b>
                    <Input data={data} field={'ordinal'} type={'number'} />
                </label>
            </CollapsibleSection>
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
            <b className={'me-2'}>Force Type</b>
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
                <b className={'me-2'}>Topic</b>
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
            return { badge: 'Attribute', badgeClass: 'attribute', icon: 'bi-list-ul' };
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

// Header component with icon, name, and badge
function PropertiesHeader(props: { data: LModelElement; className: string }) {
    const { data, className } = props;
    const typeInfo = getElementTypeInfo(className);

    return (
        <div className="props-header">
            <div className="props-header__icon">
                <i className={`bi ${typeInfo.icon}`} />
            </div>
            <span className="props-header__name">{data.name || 'Unnamed'}</span>
            <span className={`props-header__badge ${typeInfo.badgeClass}`}>
                {typeInfo.badge.toUpperCase()}
            </span>
        </div>
    );
}

// Overview stats for Model/Metamodel
function PropertiesOverview(props: { data: LModel; onViewAnalytics?: () => void }) {
    const { data, onViewAnalytics } = props;
    const packages = data.packages?.length || 0;
    const classes = data.classes?.length || 0;
    const enumerators = data.enumerators?.length || 0;

    return (
        <div className="properties-section">
            <div className="properties-section-header">
                <h3 className="properties-section-title">Overview</h3>
            </div>
            <div className="properties-section-content">
                {/* Horizontal 1x3 Grid */}
                <div className="overview-grid-horizontal">
                    <div className="overview-cell">
                        <i className="bi bi-folder" />
                        <span className="cell-value">{packages}</span>
                        <span className="cell-label">Packages</span>
                    </div>

                    <div className="overview-cell">
                        <i className="bi bi-diagram-3" />
                        <span className="cell-value">{classes}</span>
                        <span className="cell-label">Classes</span>
                    </div>

                    <div className="overview-cell">
                        <i className="bi bi-list-ul" />
                        <span className="cell-value">{enumerators}</span>
                        <span className="cell-label">Enumerators</span>
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
                    onClick={onViewAnalytics}>
                        <span>View Analytics</span>
                        <i className="bi bi-arrow-right" style={{ fontSize: '12px', color: 'white' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Actions section - simplified without section wrapper
function PropertiesActions(props: {
    data: LModelElement;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void
}) {
    const { data, onEdit, onDuplicate, onDelete } = props;

    return (
        <div className="properties-actions-bar">
            {onEdit && (
                <button className="properties-btn primary" onClick={onEdit}>
                    Edit
                </button>
            )}
            {onDuplicate && (
                <button className="properties-btn secondary" onClick={onDuplicate}>
                    Duplicate
                </button>
            )}
            {onDelete && (
                <button className="properties-btn danger" onClick={onDelete}>
                    Delete
                </button>
            )}
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

    // State for M2 Analytics Modal
    const [showM2Analytics, setShowM2Analytics] = useState(false);
    const [m2AnalyticsData, setM2AnalyticsData] = useState<M2AnalyticsData>({
        metamodelName: 'metamodel_1',
        classification: { score: 0, category: 'small' },
        metrics: { PKG: 0, MC: 0, AMC: 0, CMC: 0, IFLMC: 0, MCWS: 0, LMC: null, SF: 0, ASF: null, EN: 0, LIT: 0 }
    });

    // Function to calculate M2 Analytics for a metamodel
    const calculateM2Analytics = (metamodel: LModel): M2AnalyticsData => {
        const classes = metamodel.classes || [];
        const dclasses = classes.map((c: any) => c.__raw);

        // PKG: # Packages (including nested)
        const PKG = metamodel.allSubPackages?.length || 0;

        // MC: # Metaclasses
        const MC = classes.length;

        // AMC: # Abstract Metaclasses
        const AMC = dclasses.filter((c: any) => c?.abstract === true).length;

        // CMC: # Concrete Metaclasses
        const CMC = MC - AMC;

        // IFLMC: # Concrete Featureless Metaclasses
        const IFLMC = dclasses.filter((c: any) => {
            if (c?.abstract === true) return false;
            const attrLen = Array.isArray(c?.attributes) ? c.attributes.length : 0;
            const refLen = Array.isArray(c?.references) ? c.references.length : 0;
            return attrLen + refLen === 0;
        }).length;

        // MCWS: # Metaclasses with Superclass
        const MCWS = dclasses.filter((c: any) => {
            const extendsArr = c?.extends;
            return Array.isArray(extendsArr) && extendsArr.length > 0;
        }).length;

        // LMC: % Isolated Metaclasses (no superclass and no subclasses)
        const isolated = classes.filter((c: any) => {
            const extendsArr = c.extends;
            const extendedByArr = c.extendedBy;
            const hasSuper = Array.isArray(extendsArr) && extendsArr.length > 0;
            const hasSub = Array.isArray(extendedByArr) && extendedByArr.length > 0;
            return !hasSuper && !hasSub;
        }).length;
        const LMC = MC > 0 ? (isolated / MC) * 100 : null;

        // SF: # Structural Features (all attributes + references, including inherited)
        let allAttrCount = 0;
        let allRefCount = 0;
        classes.forEach((c: any) => {
            const attrs = c.allAttributes;
            const refs = c.allReferences;
            allAttrCount += Array.isArray(attrs) ? attrs.length : 0;
            allRefCount += Array.isArray(refs) ? refs.length : 0;
        });
        const SF = allAttrCount + allRefCount;

        // ASF: Avg # Structural Features per concrete metaclass
        const ASF = CMC > 0 ? SF / CMC : null;

        // EN: # Enumerations
        const EN = metamodel.enumerators?.length || 0;

        // LIT: # Literals
        const LIT = metamodel.literals?.length || 0;

        // Calculate EMF classification score (based on # metaclasses)
        let score = Math.min(MC * 2.5, 100);
        if (SF > 0) score = Math.min(score + SF * 0.5, 100);
        score = Math.round(score);

        const category: 'small' | 'medium' | 'large' =
            score < 30 ? 'small' : score < 80 ? 'medium' : 'large';

        return {
            metamodelName: metamodel.name || 'Unnamed Metamodel',
            classification: { score, category },
            metrics: {
                PKG,
                MC,
                AMC,
                CMC,
                IFLMC,
                MCWS,
                LMC: LMC !== null ? Math.round(LMC * 100) / 100 : null,
                SF,
                ASF: ASF !== null ? Math.round(ASF * 100) / 100 : null,
                EN,
                LIT
            }
        };
    };

    // Function to open M2 Analytics modal
    const openM2Analytics = () => {
        const rawData = data?.__raw || data;
        if (data && rawData?.className === 'DModel') {
            const analyticsData = calculateM2Analytics(data as LModel);
            setM2AnalyticsData(analyticsData);
            setShowM2Analytics(true);
        }
    };

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
        // const showActions = ['DModel', 'DClass', 'DEnumerator', 'DAttribute', 'DReference', 'DOperation', 'DEnumLiteral', 'DPackage'].includes(ddata.className);

        return (
            <>
                <section className="properties-tab properties-panel">
                    {/* Header */}
                    <PropertiesHeader data={data} className={ddata.className} />

                    {/* Overview - only for Models */}
                    {showOverview && <PropertiesOverview data={data as LModel} onViewAnalytics={openM2Analytics} />}

                    {/* Fields (builder methods now include their own CollapsibleSections) */}
                    <div className="properties-fields">
                        {jsx}
                    </div>

                    {/* Advanced State — collapsed by default, advanced mode only */}
                    {advanced && (
                        <CollapsibleSection title="ADVANCED STATE" defaultOpen={false}>
                            {!ddata || Object.keys(ddata._state).length === 0 ? (
                                <div className="props-empty-state">No custom state defined</div>
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
                        </CollapsibleSection>
                    )}

                    {/* TODO: Duplicate/Delete available via toolbar and context menu.
                         UpgradePrompt can return as toast or first-visit hint. */}
                </section>

                {/* M2 Analytics Modal */}
                <M2AnalyticsModal
                    isOpen={showM2Analytics}
                    onClose={() => setShowM2Analytics(false)}
                    data={m2AnalyticsData}
                />
            </>
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
