import {
    DAttribute, DClass, DEnumerator, Dictionary, DocString, DReference,
    DState,
    Input, LAttribute, LClass, LClassifier, LEnumerator,
    LGraphElement,
    LModel,
    LModelElement,
    LObject, LPointerTargetable, LReference, LStructuralFeature, LValue,
    LViewElement, Pointer,
    Select,
    Selectors, SetFieldAction, U, ValueDetail
} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';

class builder {
    static named(data: LModelElement, advanced: boolean): ReactNode {
        return (<div className={'input-container'}>
            <b className={'me-2'}>Name:</b>
            <Input data={data} field={'name'} type={'text'}/>
        </div>);
    }

    static model(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.named(data, advanced)}
        </section>);
    }

    static package(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.named(data, advanced)}
            <div className={'input-container'}>
                <b className={'me-2'}>Uri:</b>
                <Input data={data} field={'uri'} type={'text'}/>
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Prefix:</b>
                <Input data={data} field={'prefix'} type={'text'}/>
            </div>
        </section>);
    }

    static class(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.named(data, advanced)}
            <div className={'input-container'}>
                <b className={'me-2'}>Abstract:</b>
                <Input data={data} field={'abstract'} type={'checkbox'}/>
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Interface:</b>
                <Input data={data} field={'interface'} type={'checkbox'}/>
            </div>
            {advanced && <div className={'input-container'}>
                <b className={'me-2'}>Partial:</b>
                <Input data={data} field={'partial'} type={'checkbox'}/>
            </div>}
        </section>);
    }

    static enum(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.named(data, advanced)}
            {advanced && <div className={'input-container'}>
                <b className={'me-2'}>Serializable:</b>
                <Input data={data} field={'serializable'} type={'checkbox'}/>
            </div>}
        </section>);
    }

    static feature(data: LModelElement, advanced: boolean): JSX.Element {
        return (<>
            {this.named(data, advanced)}
            <div className={'input-container'}>
                <b className={'me-2'}>Type:</b>
                <Select data={data} field={'type'} />
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Lower Bound:</b>
                <Input data={data} field={'lowerBound'} type={'number'} />
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Upper Bound:</b>
                <Input data={data} field={'upperBound'} type={'number'} />
            </div>
            {advanced && <>
                <div className={'input-container'}>
                    <b className={'me-2'}>Unique:</b>
                    <Input data={data} field={'unique'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Ordered:</b>
                    <Input data={data} field={'ordered'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Changeable:</b>
                    <Input data={data} field={'changeable'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Volatile:</b>
                    <Input data={data} field={'volatile'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Transient:</b>
                    <Input data={data} field={'transient'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Unsettable:</b>
                    <Input data={data} field={'unsettable'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Derived:</b>
                    <Input data={data} field={'derived'} type={'checkbox'} />
                </div>
            </>}
        </>);
    }
    static attribute(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.feature(data, advanced)}
            {advanced && <>
                <div className={'input-container'}>
                    <b className={'me-2'}>ID:</b>
                    <Input data={data} field={'isID'} type={'checkbox'} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>IoT:</b>
                    <Input data={data} field={'isIoT'} type={'checkbox'} />
                </div>
            </>}
        </section>);
    }
    static reference(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.feature(data, advanced)}
            <div className={'input-container'}>
                <b className={'me-2'}>Containment:</b>
                <Input data={data} field={'containment'} type={'checkbox'} />
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Container:</b>
                <Input data={data} field={'container'} type={'checkbox'} />
            </div>
            {advanced && <div className={'input-container'}>
                <b className={'me-2'}>Resolve Proxies:</b>
                <Input data={data} field={'resolveProxies'} type={'checkbox'} />
            </div>}
        </section>);
    }
    static operation(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.named(data, advanced)}
            <div className={'input-container'}>
                <b className={'me-2'}>Return:</b>
                <Select data={data} field={'type'} />
            </div>
        </section>);
    }
    static literal(data: LModelElement, advanced: boolean): JSX.Element {
        return (<section className={'p-2'}>
            {this.named(data, advanced)}
            <div className={'input-container'}>
                <b className={'me-2'}>Ordinal:</b>
                <Input data={data} field={'ordinal'} type={'number'} />
            </div>
        </section>);
    }
    static object(data: LModelElement, advanced: boolean): JSX.Element {
        const object: LObject = LObject.fromPointer(data.id);
        let conform = true;
        for(const feature of object.features) {
            let upperBound =  feature.instanceof ? feature.instanceof.upperBound : -1;
            upperBound = (upperBound === -1) ? 999 : upperBound;
            const lowerBound =  feature.instanceof ? feature.instanceof.lowerBound : -1;
            const value = feature.values;
            conform = (value.length >= lowerBound && value.length <= upperBound);
        }
        return(<section className={'p-2'}>
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
                <div className={'input-container'}>
                    <b className={'me-2'}>Features:</b>
                    <button className={'btn btn-primary ms-auto'} onClick={e => object.addValue()}>
                        <i className={'p-1 bi bi-plus'} />
                    </button>
                </div>
            }
            {this.forceConform(object)}
        </section>);
    }
    static forceConform(me: LObject) {
        let mm: LModel = Selectors.getLastSelectedModel().m2 as LModel;
        if (!mm) return <></>
        return(<div className={'input-container'}>
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
        </div>);
    }
    static value(data: LModelElement, topics: Dictionary<string, unknown>, advanced: boolean): JSX.Element {
        const value: LValue = LValue.fromPointer(data.id);
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
            SetFieldAction.new(value.id, 'values', U.initializeValue(feature?.type), '+=', false);
        }
        const remove = (index: number, isPointer: boolean | undefined) => {
            if (isPointer === undefined) isPointer = !!(filteredValues[index].value as any)?.__isProxy; // Pointers.isPointer
            SetFieldAction.new(value.id, 'values', index, '-=', isPointer);
        }
        function changeDValue(event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean | undefined) {
            let inputValue: string | boolean = field === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
            if (inputValue === 'undefined') inputValue = undefined as any;
            let result = value.setValueAtPosition(index, inputValue, {isPtr: isPointer});
            console.log('setting DValue', {inputValue, result, value});
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
        let selectOptions: JSX.Element | JSX.Element[] | null;
        if (isReference) {
            let isContainment: boolean = value.containment;
            let containerObjectsID: Pointer[] = value.fatherList.map(lm => lm.id);
            let validObjects = Selectors.getObjects().filter((obj) => (featureType as LClass).isSuperClassOf(obj.instanceof, true));
            validObjects =  validObjects.filter( obj => !containerObjectsID.includes(obj.id)); // avoiding containment loops damiano todo: put this filter in set_value too
            let freeObjects = [];
            let boundObjects = [];
            for (let o of validObjects) {
                // todo: this check of self contain is too simple does not detect loops, would need to use fatherChain
                if (isContainment && o.id === value.father.id) continue; // no self contain
                if (o.isRoot) freeObjects.push(o); else boundObjects.push(o);
            }
            let map = (object: LObject) => <option key={object.id} value={object.id}>{object.name/*.feature('name')*/}</option>;
            selectOptions = <><optgroup label={'Free     Objects'}>{freeObjects.map(map)}</optgroup><optgroup label={'Bound Objects'}>{boundObjects.map(map)}</optgroup></>; }
        else if (isEnumerator) {
            selectOptions = <optgroup label={'Literals of ' + featureType.name}>{(featureType as LEnumerator).literals.map((literal, i) => <option key={literal.id} value={literal.id}>{literal.name}</option>)}</optgroup>;
        }
        else if (isShapeless) {
            // damiano todo: rewrite entirely this section to separate bound and free objects, copying from if(isref)
            // pointables = {objects: Selectors.getObjects(), literals: LPointerTargetable.fromArr(Selectors.getAllEnumLiterals())};
            let isContainment: boolean = value.containment;
            let enums: LEnumerator[] = LPointerTargetable.fromArr(Selectors.getAllEnumerators())
            let classes: LClass[] = LPointerTargetable.fromArr(Selectors.getAllClasses())
            let shapelessObjects: LObject[] = Selectors.getObjects().filter((o) => !o.instanceof);
            // console.log('select_options', {enums, classes, shapelessObjects});
            let classmap: Dictionary<DocString<'classname'>, {free:LObject[], bound:LObject[], all: LObject[]}> = {};
            let shapeless: {free:LObject[], bound:LObject[], all: LObject[]} = {free:[], bound:[], all: shapelessObjects};
            for (let c of classes) {
                let row: {free:LObject[], bound:LObject[], all: LObject[]} = {free: [], bound:[], all: c.instances};
                classmap[c.name] = row;
                for (let o of row.all) {
                    // todo: this check of self contain is too simple does not detect loops, would need to use fatherChain
                    if (isContainment && o.id === value.father.id) continue; // no self contain
                    if (o.isRoot) row.free.push(o); else row.bound.push(o);
                }
            }
            for (let o of shapelessObjects) { if (o.isRoot) shapeless.free.push(o); else shapeless.bound.push(o); }

            selectOptions = <>
                <option value={''} key={0}>--- Not a Reference ---</option>
                {Object.keys(classmap).map((cname) => !classmap[cname].all.length ? null :
                    <>
                        {!classmap[cname].free.length ? null :
                            <optgroup label={'Free    instances of ' + cname} key={'f-' + cname}>
                                {classmap[cname].free.map((o) => <option value={o.id} key={o.id}>{o.name}</option>)}
                            </optgroup>
                        }
                        {!classmap[cname].bound.length ? null :
                            <optgroup label={'Bound instances of ' + cname} key={'b-' + cname}>
                                {classmap[cname].bound.map((o) => <option value={o.id} key={o.id}>{o.name}</option>)}
                            </optgroup>
                        }
                    </>) }
                {!shapeless.free.length ? null : <optgroup label={'Free    shapeless objects'}>{shapeless.free.map( (o) => <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup>}
                {!shapeless.bound.length ? null : <optgroup label={'Bound shapeless objects'}>{shapeless.bound.map( (o) => <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup>}
                {enums.map((c) => !c.literals.length ? null : <optgroup label={'Literals of ' + c.name}>{ c.literals.map((o)=> <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup>)}
            </>
            // console.log('select_options post', {select_options, enums, classes, shapelessObjects});
        }
        else selectOptions = null;

        let isPtr = isAttribute ? false : (isEnumerator || isReference ? true : undefined);
        const valueslist = (filteredValues).map((val, index) =>
            val.hidden ? null :
                <div className={'mt-1 d-flex ms-4'} key={index}>
                    <div className={'border border-dark'}></div>
                    {isAttribute && <input onChange={(evt) => { changeDValue(evt, index, false) }} className={'input m-auto ms-1'} value={val.value + ''}
                                       checked={!!val.value} min={min} max={max} type={field} step={stepSize} maxLength={maxLength} placeholder={'empty'}/> }
                    {isEnumerator && <select onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                        {<option key='undefined' value={'undefined'}>-----</option>}
                        {selectOptions}
                    </select>}
                    {isReference && <select onChange={(evt) => {changeDValue(evt, index, true)}} className={'m-auto ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                        <option value={'undefined'}>-----</option>
                        {selectOptions}
                    </select>}
                    {isShapeless && <>
                        {<input key={'raw' + index} onChange={(evt) => {changeDValue(evt, index, false)}} className={'input m-auto ms-1'} value={val.rawValue+''} list={'objectdatalist'} type={'text'} placeholder={'empty'}/>}
                        <span className={'ms-1 my-auto'}>→</span>
                        {<select key={index} onChange={(evt) => {changeDValue(evt, index, undefined)}} className={'select m-auto ms-1'} value={val.rawValue+''}>
                            {selectOptions}
                        </select>}
                    </>}
                    <button className={'btn btn-danger m-auto ms-2'} onClick={(evt) => {remove(index, isPtr)}}>
                        <i className={'p-1 bi bi-trash3-fill'}></i>
                    </button>
                </div>);

        console.log('topics', topics)
        return(<section className={'p-2'}>
            <div className={'d-flex'}>
                <label className={'ms-1 my-auto'}>Values</label>
                <button className={'btn btn-primary ms-auto me-1'} disabled={filteredValues.length >= upperBound} onClick={add}>
                    <i className={'p-1 bi bi-plus'}></i>
                </button>
            </div>
            {valueslist}
            {value.instanceof?.className === 'DAttribute' && (value.instanceof as LAttribute).isIoT && <div className={'input-container'}>
                <b className={'me-2'}>Topic:</b>
                <Select data={value} field={'topic'} label={'Topic'} options={<optgroup label={'Topics'}>
                    <option value={''}>------</option>
                    {U.extractKeys(topics).map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>} />
            </div>}
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
        case 'DEnumLiteral':
            return builder.literal(data, advanced);
        case 'DObject':
            return builder.object(data, advanced);
        case 'DValue':
            return builder.value(data, topics, advanced);
    }
    return(<section className={'p-2'}>
        <label className={'d-block text-center'}>
            No Data to display!
        </label>
    </section>);

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
