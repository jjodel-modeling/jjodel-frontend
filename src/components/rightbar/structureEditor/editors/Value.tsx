import React from "react";
import type {
    PrimitiveType,
    Pointer,
} from "../../../../joiner";
import {
    DAttribute, DClass, DEnumerator,
    DObject, DReference, LClass,
    LEnumerator, LEnumLiteral, LModelElement,
    LObject,
    LPointerTargetable,
    LStructuralFeature,
    LValue,
    Selectors, SetFieldAction,
    U
} from "../../../../joiner";

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
    let upperBound = lValue.instanceof ? lValue.instanceof.upperBound : -1;
    if (upperBound < 0) upperBound = 999;

    const add = (event: React.MouseEvent<HTMLButtonElement>) => {
        SetFieldAction.new(dValue, 'value', U.initializeValue(feature?.type), '+=', false);
    }
    const remove = (index: number) => {
        // damiano todo: non va bene perchè alcuni elementi sono nascosti e l'indice è sbagliato
        SetFieldAction.new(dValue, 'value', index, '-=', false);
    }
    const change = (event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean | undefined) => {
        // damiano todo: non va bene perchè alcuni elementi sono nascosti e l'indice è sbagliato
        const target = event.target.value;
        const newValues = [...dValue.value];
        if (field === 'checkbox') { newValues[index] = (newValues[index] === 'false') ? 'true': 'false'; }
        else { newValues[index] = target; }
        lValue.value = newValues;
        // SetFieldAction.new(dValue, 'value', newValues, '', target !== 'null' && isPointer);
    }

    (window as any).test = dValue;
    console.log("editor value", {dValue, })

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
    if (isref) { select_options = Selectors.getObjects().filter((obj) => {
        return obj.instanceof?.id === feature.type?.id; // todo: move this utility in LClass.instances
    }).map((object, i) => {
        return <option key={object.id} value={object.id}>{object.name/*.feature('name')*/}</option>;
    })}
    else if (isenum) {
        select_options = <optgroup label={"Literals of " + feature.type.name}>{(feature.type as LEnumerator).literals.map((literal, i) => <option key={literal.id} value={literal.id}>{literal.name}</option>)}</optgroup>;
    }
    else if (isshapeless) {
        // pointables = {objects: Selectors.getObjects(), literals: LPointerTargetable.fromArr(Selectors.getAllEnumLiterals())};
        let enums: LEnumerator[] = LPointerTargetable.fromArr(Selectors.getAllEnumerators())
        let classes: LClass[] = LPointerTargetable.fromArr(Selectors.getAllClasses())
        let shapelessObjects: LObject[] = Selectors.getObjects().filter((o) => !o.instanceof);
        console.log("select_options", {enums, classes, shapelessObjects});
        select_options = <>
            <option value={''} key={''}>--- Not a Reference ---</option>
            { classes.map((c) => !c.instances.length ? null : <optgroup label={"Instances of " + c.name}>{ c.instances.map((o)=> <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup>) }
            { !shapelessObjects.length ? null : <optgroup label={"Shapeless objects"}>{shapelessObjects.map( (o) => <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup> }
            { enums.map((c) => !c.literals.length ? null : <optgroup label={"Literals of " + c.name}>{ c.literals.map((o)=> <option value={o.id} key={o.id}>{o.name}</option>)}</optgroup>) }
        </>
        console.log("select_options post", {select_options, enums, classes, shapelessObjects});

    }
    else select_options = null;

    let rawvalues: any[] = lValue.__raw.value || [];
    let filteredvalues = lValue.getValue(true, false, false, false, true);
    const valueslist = (filteredvalues as PrimitiveType[]).map( (val: PrimitiveType | string | LObject, index) =>
            <div className={'mt-1 d-flex ms-4'} key={index}>
                <div className={'border border-dark'}></div>
                { isattr && <input onChange={(evt) => { change(evt, index, false) }} className={'input ms-1'} value={val + ''}
                                   checked={!!val} min={min} max={max} type={field} step={stepSize} maxLength={maxLength} placeholder={"empty"}/> }
                { isenum && <select onChange={(evt) => {change(evt, index, false)}} className={'ms-1 select'} value={rawvalues[index]} data-valuedebug={rawvalues[index]}>
                    {<option key="undefined" value={'undefined'}>-----</option>}
                    { select_options }
                </select>}
                { isref && <select onChange={(evt) => {change(evt, index, true)}} className={'ms-1 select'} value={rawvalues[index]} data-valuedebug={rawvalues[index]}>
                    <option value={'undefined'}>-----</option>
                    {select_options}
                </select>}
                { isshapeless && <>
                    { <select key={index} onChange={(evt) => {change(evt, index, undefined)}} className={'select ms-1'} value={rawvalues[index]}>{select_options}</select> }
                    →
                    { <input key={index} onChange={(evt) => {change(evt, index, false)}} className={'input ms-1'} value={rawvalues[index]} list={"objectdatalist"} type={"text"} placeholder={"empty"}/> }
                    { /*(val as LObject)?.id && <span>points to {val}</span> */}
                </>
                }
                <button className={'btn btn-danger ms-2'} onClick={(evt) => {remove(index)}}>
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
    </div>)
}

export default Value;
