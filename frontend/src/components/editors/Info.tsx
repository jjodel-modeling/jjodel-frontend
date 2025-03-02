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
    Selectors, SetFieldAction, store, TRANSACTION, U, ValueDetail
} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './editors.scss';
import './info.scss';
import './style.scss';
import {Empty} from "./Empty";
import { CommandBar, Btn } from '../commandbar/CommandBar';
import { Tooltip } from '../forEndUser/Tooltip';

class builder {
    static named(data: LModelElement, advanced: boolean): ReactNode {
        return (<><h1>{data.name}</h1>
            <label className={'input-container'}>
                <b className={'me-2'}>Name:</b>
                <Input data={data} field={'name'} type={'text'}/>
            </label>

            <label className={'input-container'}>
                <b className={'me-2'}>Readonly:</b>
                <Input data={data} field={'__readonly'} type={'checkbox'}/>
            </label>
        </>);
    }

    static model(data: LModelElement, advanced: boolean): JSX.Element {
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

        return (<section className={'properties-tab'}>
            {this.named(data, advanced)}

            <label className={'input-container'}>
                <b className={'me-2'}>Dependends from models:</b>
                <MultiSelect isMulti={true} options={multiselectOptions as any} value={multiselectValue} onChange={(v) => {
                    console.log('setting model dependencies', v);
                    l.dependencies = v.map(e => e.value) as Any<string[]>;
                }} />
            </label>
        </section>);
    }

    static package(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'properties-tab'}>
            <h1>{data.name}</h1>
            {this.named(data, advanced)}
            <label className={'input-container'}>
                <b className={'me-2'}>Uri:</b>
                <Input data={data} field={'uri'} type={'text'}/>
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Prefix:</b>
                <Input data={data} field={'prefix'} type={'text'}/>
            </label>
        </section>);
    }

    static class(data: LModelElement, advanced: boolean): JSX.Element {
        let lclass: LClass = data as any;
        // let extendOptions: {value: string, label: string}[] lclass.extends.map(lsubclass=> ({value: lsubclass.id, label: lsubclass.name}));
        let m2: LModel = lclass.model;
        let pkgs = m2.allSubPackages;
        let dclass = lclass.__raw;
        let extendsarr = dclass.extends;
        let extendValue: {value: string, label: string}[] = [];
        let extendOptions: {label: string, options: {value: string, label: string}[]}[] = pkgs.map(p => (
            {label: p.fullname, options: p.classes.map(c=> {
                let opt = {value:c.id, label: c.name};
                if (opt.value === dclass.id) return undefined;
                if (!extendsarr.includes(opt.value)) return opt;
                extendValue.push(opt);
                return undefined;
            }).filter(e=>!!e) as {value: string, label: string}[]}));
        //let extendOptions = pkgs.map(p => ({label: p.fullname, options: p.classes.map(c=> ({value:c.id as string, label:c.name}))}));


        return (<section className={'properties-tab'}>
            {this.named(data, advanced)}
            <label className={'input-container'}>
                <b className={'me-2'}>Abstract:</b>
                <Input data={data} field={'abstract'} type={'checkbox'}/>
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Interface:</b>
                <Input data={data} field={'interface'} type={'checkbox'}/>
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Extends:</b>
                <MultiSelect isMulti={true} options={extendOptions as any} value={extendValue} onChange={(v) => {
                    console.log('setting extend', v);
                    lclass.extends = v.map(e => e.value) as Any<string[]>;
                }} />
            </label>
            <label className={'input-container'}>
                <b className={'me-2'}>Final:</b>
                <Tooltip tooltip={"Defines if the class can be extended."}>
                    <Input data={data} field={'final'} type={'checkbox'}/>
                </Tooltip>
            </label>
            {false &&
                <label className={'input-container'}>
                    <b className={'me-2'}>Rootable:</b>
                    <Tooltip tooltip={"Whether the element can be a m1 root (present in toolbar)."}>
                        <Input data={data} field={'rootable'} type={'checkbox3' }/>
                    </Tooltip>
                </label>}
            <label className={'input-container'}>
                <b className={'me-2'}>Singleton:</b>
                <Tooltip tooltip={'A singleton element is always present exactly 1 time in every model.' +
                    '\nA single instance is created dynamically and cannot be created by the user.'}>
                    <Input data={data} field={'singleton'} type={'checkbox'}/>
                </Tooltip>
            </label>
            {advanced && <label className={'input-container'}>
                <b className={'me-2'}>Partial:</b>
                <Input data={data} field={'partial'} type={'checkbox'}/>
            </label>}
            <label className={'input-container'}>
                <b className={'me-2'}>Rootable:</b>
                <Tooltip tooltip={"Whether the element can be a m1 root (present in toolbar)."}>
                    <Input data={data} field={'rootable'} type={'checkbox'} getter={()=>dclass.rootable} setter={(val)=>{
                        lclass.rootable = val as any;
                        console.log('setter', val);
                    }}/>
                </Tooltip>
            </label>
        </section>);
    }

    static enum(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'properties-tab'}>
            {this.named(data, advanced)}
            {advanced && <label className={'input-container'}>
                <b className={'me-2'}>Serializable:</b>
                <Input data={data} field={'serializable'} type={'checkbox'}/>
            </label>}
        </section>);
    }

    static feature(data: LModelElement, advanced: boolean): JSX.Element {
        return (<>
            {this.named(data, advanced)}
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

    static attribute(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'properties-tab'}>
            {this.feature(data, advanced)}
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
        </section>);
    }
    static reference(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'properties-tab'}>
            {this.feature(data, advanced)}
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
        </section>);
    }
    static operation(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'properties-tab'}>
            {this.named(data, advanced)}
            <label className={'input-container'}>
                <b className={'me-2'}>Return:</b>
                <Select data={data} field={'type'} />
            </label>
        </section>);
    }
    static literal(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'properties-tab'}>
            {this.named(data, advanced)}
            <label className={'input-container'}>
                <b className={'me-2'}>Ordinal:</b>
                <Input data={data} field={'ordinal'} type={'number'} />
            </label>
        </section>);
    }
    static object(data: LModelElement, topics: Dictionary<string, unknown>, advanced: boolean): JSX.Element {
        const object: LObject = LObject.fromPointer(data.id);
        let conform = true;
        for(const feature of object.features) {
            let upperBound =  feature.instanceof ? feature.instanceof.upperBound : -1;
            upperBound = (upperBound === -1) ? 999 : upperBound;
            const lowerBound =  feature.instanceof ? feature.instanceof.lowerBound : -1;
            const value = feature.values;
            conform = (value.length >= lowerBound && value.length <= upperBound);
        }
        return(<section className={'properties-tab'}>
            <h1>{data.name}</h1>
            {object.instanceof && conform && <label className={'d-block text-center'}>
                The instance <b className={'text-success'}>CONFORMS</b> to {object.instanceof.name}
            </label>}
            {object.instanceof && !conform && <label className={'d-block text-center'}>
                The instance <b className={'text-danger'}>NOT CONFORMS</b> to {object.instanceof.name}
            </label>}
            {!object.instanceof && <label className={'d-block text-center'}>
                The instance is <b className={'text-warning'}>SHAPELESS</b>
            </label>}
            {!object.partial ? null :
                <label className={'input-container'}>
                    <b className={'me-2'}>Features:</b>
                    <button className={'btn btn-primary ms-auto'} onClick={e => object.addValue()}>
                        <i className={'p-1 bi bi-plus'} />
                    </button>
                </label>
            }
            {this.forceConform(object)}
            {object.features.map(f => <div id={`Object-${f.id}`}>
                {this.value(f, topics, advanced)}
            </div>)}
        </section>);
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
    static value(data: LModelElement, topics: Dictionary<string, unknown>, advanced: boolean): JSX.Element {
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
        function changeDValue(event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean | undefined) {
            TRANSACTION('change value (sidebar)', ()=>{
                value = value.r;
                let inputValue: string | boolean = field === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
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
                console.log('setting DValue', {inputValue, result, value, index, oldvi});
            })
        }
        const featureType: LClassifier = feature?.type;
        let isAttribute = false, isEnumerator = false, isReference = false, isShapeless = false;
        switch(feature?.className){
            case DAttribute.cname:
                if (featureType.className === DClass.cname) isAttribute = true; else
                if (featureType.className === DEnumerator.cname) isEnumerator = true;
                break;
            case DReference.cname: isReference = true; break;
            default: isShapeless = true; break;
        }
        let selectOptions: JSX.Element | JSX.Element[] | null = value.validTargetsJSX;

        let isPtr = isAttribute ? false : (isEnumerator || isReference ? true : undefined);
        const valueslist = (filteredValues).map((val, index) =>
            val.hidden ? null :
                <label className={'mt-1 d-flex ms-4'} key={index}>
                    <div className={'border border-dark'}></div>
                    {isAttribute && <Input key={'a'+index} setter={(val: any) => { changeDValue({target:{value:val}} as any, index, false) }}
                                           className={'input m-auto ms-1' /*@ts-ignore*/}
                                           getter={()=>val.value as any} min={min} max={max} type={field as any} step={stepSize}
                                           maxLength={maxLength} placeholder={'empty'}/> }
                    {isEnumerator && <select key={'e'+index} onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                        {<option key='undefined' value={'undefined'}>-----</option>}
                        {selectOptions}
                    </select>}
                    {isReference && <select key={'r'+index} onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                        <option value={'undefined'}>-----</option>
                        {selectOptions}
                    </select>}
                    {isShapeless && <>
                        {<Input key={'raw' + index} setter={(val: any) => {changeDValue({target:{value:val}} as any, index, false)}}
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
                    {/*<button className={'btn btn-danger m-auto ms-2'} onClick={(evt) => {remove(index, isPtr)}}>
                        <i className={'p-1 bi bi-trash3'}></i>
                    </button>*/}
                </label>);

        return(<section className={'properties-tab'}>
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
        </section>)
    }
}

function InfoComponent(props: AllProps) {
    const {data, node, view, topics, advanced} = props;

    switch (data?.className) {
        case 'DModel':
            return builder.model(data, advanced);
        case 'DPackage':
            return builder.package(data, advanced);
        case 'DClass':
            return builder.class(data, advanced);
        case 'DEnumerator':
            return builder.enum(data, advanced);
        case 'DAttribute':
            return builder.attribute(data, advanced);
        case 'DReference':
            return builder.reference(data, advanced);
        case 'DOperation':
            return builder.operation(data, advanced);
        case 'DParameter':
            return builder.operation(data.father, advanced);
        case 'DEnumLiteral':
            return builder.literal(data, advanced);
        case 'DObject':
            return builder.object(data, topics, advanced);
        case 'DValue':
            return builder.value(data, topics, advanced);
    }
    return <Empty />;

}

interface OwnProps {}
interface StateProps {
    node?: LGraphElement
    view?: LViewElement
    data?: LModelElement
    topics: Dictionary<string, unknown>
    advanced: boolean
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeID = state._lastSelected?.node;
    const viewID = state._lastSelected?.view;
    const dataID = state._lastSelected?.modelElement;
    if(nodeID) ret.node = LGraphElement.fromPointer(nodeID);
    if(viewID) ret.view = LViewElement.fromPointer(viewID);
    if(dataID) ret.data = LModelElement.fromPointer(dataID);
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

export const Info = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <InfoConnected {...{...props, children}} />;
}
export default Info;
