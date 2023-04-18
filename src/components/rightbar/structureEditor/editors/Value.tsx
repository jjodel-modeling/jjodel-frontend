import React from "react";
import {SetFieldAction} from "../../../../redux/action/action";
import {
    DObject,
    LEnumerator,
    LObject,
    LPointerTargetable,
    LStructuralFeature,
    Pointer,
    Selectors,
    U
} from "../../../../joiner";
import type {LValue} from "../../../../joiner";
import { PrimitiveType } from "../../../../joiner/types";

interface Props {value: LValue}
function Value(props: Props) {
    const lValue = props.value;
    const dValue = lValue.__raw;
    const feature: LStructuralFeature = LStructuralFeature.fromPointer(lValue.instanceof.id);
    let field = 'text'; let stepSize = 1; let maxLength = 524288;
    let min = -9223372036854775808;
    let max = 9223372036854775807; // for long, todo: aggiusta per tutti gli altri. in switch
    switch(feature.type.name) {
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
    let upperBound = lValue.instanceof.upperBound;
    if (upperBound < 0) upperBound = 999;

    const add = (event: React.MouseEvent<HTMLButtonElement>) => {
        SetFieldAction.new(dValue, 'value', U.initializeValue(feature.type), '+=', false);
    }
    const remove = (index: number) => {
        SetFieldAction.new(dValue, 'value', index, '-=', false);
    }
    const change = (event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean) => {
        const target = event.target.value;

        const newValues = [...dValue.value];
        if(field === 'checkbox') { newValues[index] = (newValues[index] === 'false') ? 'true': 'false'; }
        else { newValues[index] = target; }

        lValue.value = newValues;
        // SetFieldAction.new(dValue, 'value', newValues, '', target !== 'null' && isPointer);
    }

    (window as any).test = dValue;
    console.log("editor value", {dValue, })
    return(<div>
        <div className={'d-flex'}>
            <label className={'ms-1 my-auto'}>Values</label>
            <button className={'btn btn-primary ms-auto me-1'} disabled={dValue.value.length >= upperBound} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {
            feature.className === "DAttribute" && feature.type.className === "DClass" && (lValue.value as PrimitiveType[]).map( (val: PrimitiveType, index) =>
                <div className={'mt-1 d-flex ms-4'} key={index}>
                    <div className={'border border-dark'}></div>
                    <input onChange={(evt) => { change(evt, index, false)} } className={'input ms-1'}
                           value={val + ''} checked={val === true} min={min} max={max} type={field} step={stepSize} maxLength={maxLength} placeholder={"empty"} />
                    <button className={'btn btn-danger ms-2'} onClick={(evt) => { remove(index) }}>
                        <i className={'p-1 bi bi-trash3-fill'}></i>
                    </button>
                </div>)
        }
        {
            feature.className === "DAttribute" && feature.type.className === "DEnumerator" && (lValue.value as string[]).map( (val: string, index) => {
                    const enumerator = feature.type as LEnumerator;
                    return <div className={'mt-1 d-flex ms-4'} key={index}>
                        <div className={'border border-dark'}></div>
                        <select onChange={(evt) => {change(evt, index, false)}}
                                className={'ms-1 select'} value={val+''}>
                            <option value={'null'}>-----</option>
                            {enumerator.literals.map((literal, i) => {
                                return <option key={i} value={i}>{literal.name}</option>
                            })}
                        </select>
                        <button className={'btn btn-danger ms-2'} onClick={(evt) => {remove(index)}}>
                            <i className={'p-1 bi bi-trash3-fill'}></i>
                        </button>
                    </div>;
                })
        }
        {
            feature.className === "DReference" && (lValue.value as LObject[]).map( (target: LObject, index) => {
                const objects = Selectors.getObjects().filter((obj) => {
                    return obj.instanceof?.id === feature.type?.id; // todo: move this utility in LClass.instances
                });
                return(<div className={'mt-1 d-flex ms-4'} key={index}>
                    <div className={'border border-dark'}></div>
                    <select onChange={(evt) => {change(evt, index, true)}}
                            className={'ms-1 select'} value={target?.id + ''}>
                        <option value={'null'}>-----</option>
                        {objects.map((object, i) => {
                            return <option key={i} value={object.id}>{object.name/*.feature('name')*/}</option>
                        })}
                    </select>
                    <button className={'btn btn-danger ms-2'} onClick={(evt) => {remove(index)}}>
                        <i className={'p-1 bi bi-trash3-fill'}></i>
                    </button>
                </div>)
            })

        }
    </div>)
}

export default Value;
