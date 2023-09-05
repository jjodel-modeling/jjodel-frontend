import React from "react";
import type {Dictionary, DocString, LReference, Pointer, ValueDetail} from "../../../../joiner";
import {
    DAttribute,
    DClass,
    DEnumerator,
    DReference,
    LAttribute,
    LClass,
    LEnumerator,
    LObject,
    LPointerTargetable,
    LStructuralFeature,
    LValue,
    Selectors,
    SetFieldAction
} from "../../../../joiner";
import MqttEditor from "./MqttEditor";


interface Props {value: LValue}
function Value(props: Props) {
    const lValue = props.value;
    const dValue = lValue.__raw;
    const feature: LStructuralFeature = LStructuralFeature.fromPointer(lValue.instanceof?.id);
    let field = 'text'; let stepSize = 1; let maxLength = 524288;
    let min = -9223372036854775808;
    let max = 9223372036854775807; // for long, todo: aggiusta per tutti gli altri. in switch
    switch(feature?.type.name) {
        default: field="text"; break;
        case 'EChar': maxLength = 1; break;
        case 'EInt':
        case 'ELong':
        case 'EShort':
        case 'Byte': field = 'number'; break;
        case 'EFloat': field = 'number'; stepSize = 0.1; break;
        case 'EDouble': field = 'number'; stepSize = 0.01; break;
        case 'EBoolean': field = 'checkbox'; break;
        case 'EDate': field = 'date'; break;
    }
    let upperBound = feature ? (feature as LReference | LAttribute).__raw.upperBound : -1;
    if (upperBound < 0) upperBound = 999;
    let filteredvalues: ValueDetail[] = lValue.getValues(true, false, false, false, true, true) as any;

    const add = (event: React.MouseEvent<HTMLButtonElement>) => {
        // SetFieldAction.new(dValue, 'value', U.initializeValue(feature?.type), '+=', false);
        SetFieldAction.new(dValue, 'values', undefined, '+=', false);
    }
    const remove = (index: number, isPointer: boolean | undefined) => {
        if (isPointer === undefined) isPointer = !!(filteredvalues[index].value as any)?.__isProxy; // Pointers.isPointer
        SetFieldAction.new(dValue, 'values', index, '-=', isPointer);
        /*
        let oldValues = filteredvalues.map( v => v.rawValue);
        let newValues = [...oldValues];
        newValues.splice(index, 1); // removes in place
        console.log("removing:", {oldValues, newValues, index});
        SetFieldAction.new(dValue, 'value', newValues, '=', false);*/
    }
    function changeDValue(event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean | undefined) {
        let inputvalue: string | boolean = field === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
        if (inputvalue === "undefined") inputvalue = undefined as any;
        let result = lValue.setValueAtPosition(index, inputvalue, {isPtr: isPointer});
        console.log("setting DValue", {inputvalue, result, lValue});
    }


    let isattr = false, isenum = false, isref = false, isshapeless = false;
    switch(feature?.className){
        default: isshapeless = true; break;
        case DAttribute.name:
            if (feature.type.className === DClass.name) isattr = true; else
            if (feature.type.className === DEnumerator.name) isenum = true;
            break;
        case DReference.name: isref = true; break;
    }

    // let pointables: {objects:LObject[], literals: LEnumLiteral[]};
    let select_options: JSX.Element | JSX.Element[] | null;


    if (isref) {
        let isContainment: boolean = lValue.containment;
        // todo: move this utility in LClass.instances
        let containerObjectsID: Pointer[] = lValue.fatherList.map( lm => lm.id);
        let validObjects = Selectors.getObjects().filter((obj) => obj.instanceof?.id === feature.type?.id);
        validObjects =  validObjects.filter( obj => !containerObjectsID.includes(obj.id)); // avoiding containment loops damiano todo: put this filter in set_value too
        let freeObjects = [];
        let boundObjects = [];
        for (let o of validObjects) {
            // todo: this check of self contain is too simple does not detect loops, would need to use fatherChain
            if (isContainment && o.id === lValue.father.id) continue; // no self contain
            if (o.isRoot) freeObjects.push(o); else boundObjects.push(o);
        }
        let map = (object: LObject) => <option key={object.id} value={object.id}>{object.name/*.feature('name')*/}</option>;
        select_options = <><optgroup label={"Free Objects"}>{freeObjects.map(map)}</optgroup><optgroup label={"Bound Objects"}>{boundObjects.map(map)}</optgroup></>; }
    else if (isenum) {
        select_options = <optgroup label={"Literals of " + feature.type.name}>{(feature.type as LEnumerator).literals.map((literal, i) => <option key={literal.id} value={literal.id}>{literal.name}</option>)}</optgroup>;
    }
    else if (isshapeless) {
        // damiano todo: rewrite entirely this section to separate bound and free objects, copying from if(isref)
        // pointables = {objects: Selectors.getObjects(), literals: LPointerTargetable.fromArr(Selectors.getAllEnumLiterals())};
        let isContainment: boolean = lValue.containment;
        let enums: LEnumerator[] = LPointerTargetable.fromArr(Selectors.getAllEnumerators())
        let classes: LClass[] = LPointerTargetable.fromArr(Selectors.getAllClasses())
        let shapelessObjects: LObject[] = Selectors.getObjects().filter((o) => !o.instanceof);
        // console.log("select_options", {enums, classes, shapelessObjects});
        let classmap: Dictionary<DocString<"classname">, {free:LObject[], bound:LObject[], all: LObject[]}> = {};
        let shapeless: {free:LObject[], bound:LObject[], all: LObject[]} = {free:[], bound:[], all: shapelessObjects};
        for (let c of classes) {
            let row: {free:LObject[], bound:LObject[], all: LObject[]} = {free: [], bound:[], all: c.instances};
            classmap[c.name] = row;
            for (let o of row.all) {
                // todo: this check of self contain is too simple does not detect loops, would need to use fatherChain
                if (isContainment && o.id === lValue.father.id) continue; // no self contain
                if (o.isRoot) row.free.push(o); else row.bound.push(o);
            }
        }
        for (let o of shapelessObjects) { if (o.isRoot) shapeless.free.push(o); else shapeless.bound.push(o); }

        select_options = <>
            <option value={''} key={0}>--- Not a Reference ---</option>
            { Object.keys(classmap).map((cname) => !classmap[cname].all.length ? null :
                <>
                    {!classmap[cname].free.length ? null :
                        <optgroup label={"Free    instances of " + cname} key={"f-" + cname}>
                            {classmap[cname].free.map((o) => <option value={o.id} key={o.id}>{o.name}</option>)}
                        </optgroup>
                    }
                    {!classmap[cname].bound.length ? null :
                        <optgroup label={"Bound instances of " + cname} key={"b-" + cname}>
                            {classmap[cname].bound.map((o) => <option value={o.id} key={o.id}>{o.name}</option>)}
                        </optgroup>
                    }
                </>) }
            { !shapeless.free.length ? null : <optgroup label={"Free    shapeless objects"}>{shapeless.free.map( (o) => <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup> }
            { !shapeless.bound.length ? null : <optgroup label={"Bound shapeless objects"}>{shapeless.bound.map( (o) => <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup> }
            { enums.map((c) => !c.literals.length ? null : <optgroup label={"Literals of " + c.name}>{ c.literals.map((o)=> <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup>) }
        </>
        // console.log("select_options post", {select_options, enums, classes, shapelessObjects});
    }
    else select_options = null;

    // let rawvalues: any[] = lValue.__raw.value || [];
    console.log("filtered values", {filteredvalues});
    let isPtr = isattr ? false : (isenum || isref ? true : undefined/*for shapeless*/);
    const valueslist = (filteredvalues).map( (val, index) =>
            val.hidden ? null :
            <div className={'mt-1 d-flex ms-4'} key={index}>
                <div className={'border border-dark'}></div>
                { isattr && <input onChange={(evt) => { changeDValue(evt, index, false) }} className={'input ms-1'} value={val.value + ''}
                                   checked={!!val.value} min={min} max={max} type={field} step={stepSize} maxLength={maxLength} placeholder={"empty"}/> }
                { isenum && <select onChange={(evt) => {changeDValue(evt, index, true)}} className={'ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                    {<option key="undefined" value={'undefined'}>-----</option>}
                    { select_options }
                </select>}
                { isref && <select onChange={(evt) => {changeDValue(evt, index, true)}} className={'ms-1 select'} value={val.rawValue+''} data-valuedebug={val.rawValue}>
                    <option value={'undefined'}>-----</option>
                    {select_options}
                </select>}
                { isshapeless && <>
                    { <select key={index} onChange={(evt) => {changeDValue(evt, index, undefined)}} className={'select ms-1'} value={val.rawValue+''}>{select_options}</select> }
                    →
                    { <input key={"raw"+index} onChange={(evt) => {changeDValue(evt, index, false)}} className={'input ms-1'} value={val.rawValue+''} list={"objectdatalist"} type={"text"} placeholder={"empty"}/> }
                    { /*(val as LObject)?.id && <span>points to {val}</span> */}
                </>
                }
                <button className={'btn btn-danger ms-2'} onClick={(evt) => {remove(index, isPtr)}}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
        </div>);

    return(<div>
        <div className={'d-flex'}>
            <label className={'ms-1 my-auto'}>Values</label>
            <button className={'btn btn-primary ms-auto me-1'} disabled={filteredvalues.length >= upperBound} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        { valueslist }
        <hr className={"my-3"} />
        <MqttEditor valueId={dValue.id} />
    </div>)
}

export default Value;
