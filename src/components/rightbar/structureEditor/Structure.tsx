import React, {ReactNode} from "react";
import type {DClassifier, GObject, LModelElement, LParameter} from "../../../joiner";
import {
    DValue,
    Input,
    LClassifier,
    LEnumerator,
    LPointerTargetable,
    LStructuralFeature,
    LValue,
    Select,
    Selectors,
    SetFieldAction,
    U,
    UX
} from "../../../joiner";

export default class Structure {
    private static BaseEditor(lModelElement: LModelElement) : ReactNode {
        return(<Input obj={lModelElement} field={"name"} label={"Name"} type={"text"} tooltip={"name"} />);
    }
    public static ModelEditor(lModel: LModelElement): ReactNode {
        return(<>{Structure.BaseEditor(lModel)}</>);
    }
    public static PackageEditor(lPackage: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lPackage)}
            <Input obj={lPackage} field={"uri"} label={"NsURI"} type={"text"} tooltip={"uri"} />
            <Input obj={lPackage} field={"prefix"} label={"NsPrefix"} type={"text"} tooltip={"prefix"} />
        </>);
    }
    public static ClassEditor(lClass: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lClass)}
            <Input obj={lClass} field={"abstract"} label={"IsAbstract"} type={"checkbox"} tooltip={"abstract"} />
            <Input obj={lClass} field={"interface"} label={"IsInterface"} type={"checkbox"} tooltip={"interface"} />
        </>);
    }
    private static DataTypeEditor(lDataType: LModelElement): ReactNode {
        return(<Input obj={lDataType} field={"serializable"} label={"IsSerializable"} type={"checkbox"} tooltip={"serializable"} />);
    }
    public static EnumEditor(lEnum: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lEnum)}
            {Structure.DataTypeEditor(lEnum)}
        </>);
    }
    private static TypedElementEditor(lTypedElement: LModelElement): ReactNode {
        return(<>
            <Select obj={lTypedElement} field={"type"} label={"Type"} />
            <Input obj={lTypedElement} field={"lowerBound"} label={"Lower Bound"} type={"number"} tooltip={"lowerBound"} />
            <Input obj={lTypedElement} field={"upperBound"} label={"Upper Bound"} type={"number"} tooltip={"upperBound"} />
            <Input obj={lTypedElement} field={"ordered"} label={"IsOrdered"} type={"checkbox"} tooltip={"ordered"} />
            <Input obj={lTypedElement} field={"unique"} label={"IsUnique"} type={"checkbox"} tooltip={"unique"} />
        </>);
    }
    private static StructuralFeatureEditor(lStructuralFeature: LModelElement): ReactNode {
        return(<>
            <Input obj={lStructuralFeature} field={"defaultValueLiteral"} label={"Default Value Literal"} type={"text"} tooltip={"defaultValueLiteral"} />
            <Input obj={lStructuralFeature} field={"changeable"} label={"IsChangeable"} type={"checkbox"} tooltip={"changeable"} />
            <Input obj={lStructuralFeature} field={"volatile"} label={"IsVolatile"} type={"checkbox"} tooltip={"volatile"} />
            <Input obj={lStructuralFeature} field={"transient"} label={"IsTransient"} type={"checkbox"} tooltip={"transient"} />
            <Input obj={lStructuralFeature} field={"unsettable"} label={"IsUnsettable"} type={"checkbox"} tooltip={"unsettable"} />
            <Input obj={lStructuralFeature} field={"derived"} label={"IsDerived"} type={"checkbox"} tooltip={"derived"} />
        </>);
    }
    public static AttributeEditor(lAttribute: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lAttribute)}
            {Structure.TypedElementEditor(lAttribute)}
            {Structure.StructuralFeatureEditor(lAttribute)}
            <Input obj={lAttribute} field={"isID"} label={"IsID"} type={"checkbox"} tooltip={"isID"} />
        </>);
    }
    public static ReferenceEditor(lReference: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lReference)}
            {Structure.TypedElementEditor(lReference)}
            {Structure.StructuralFeatureEditor(lReference)}
            <Input obj={lReference} field={"containment"} label={"IsContainment"} type={"checkbox"} tooltip={"containment"} />
            <Input obj={lReference} field={"container"} label={"IsContainer"} type={"checkbox"} tooltip={"container"} />
            <Input obj={lReference} field={"resolveProxies"} label={"IsResolveProxies"} type={"checkbox"} tooltip={"resolveProxies"} />
        </>);
    }
    public static EnumLiteralEditor(lEnumLiteral: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lEnumLiteral)}
            <Input obj={lEnumLiteral} field={"value"} label={"Value"} type={"number"} tooltip={"Value"} />
        </>);
    }

    public static OperationEditor(lOperation: LModelElement & GObject): ReactNode {
        return(<>
            {Structure.BaseEditor(lOperation)}
            {lOperation.parameters.map((parameter: LParameter, index: number) => {
                const lParameter: LParameter = parameter;
                if (index > 0) {
                    return <>
                        <Input obj={parameter.id} field={"name"} label={"Parameter"} type={"text"} tooltip={"parameter"} />
                        <Select obj={parameter.id} field={"type"} />
                        <div className={"child-delete"} onClick={() => { UX.deleteWithAlarm(lParameter)}}>
                            <i className={"bi bi-trash3-fill"}></i>
                        </div>
                    </>
                }
            })}
            {lOperation.exceptions.map((exception: DClassifier) => {
                const lException: LClassifier = LPointerTargetable.from(exception);
                return <>
                    <Input obj={exception} field={"name"} label={"Exception"} type={"text"} tooltip={"exception"} />
                    <div className={"child-delete"} onClick={async() => {await UX.deleteWithAlarm(lException)}}>
                        <i className={"bi bi-trash3-fill"}></i>
                    </div>
                </>
            })}
        </>);
    }
    public static ValueEditor(me: LModelElement & GObject): ReactNode {
        const dValue: DValue = DValue.fromPointer(me.id);
        const lValue: LValue = LValue.fromPointer(me.id);

        const feature: LStructuralFeature = LStructuralFeature.fromPointer(lValue.instanceof[0].id);
        const lowerBound = lValue.instanceof[0].lowerBound;
        let upperBound = lValue.instanceof[0].upperBound;
        if (upperBound < 0) upperBound = 999;

        const addValue = (event: React.MouseEvent<HTMLButtonElement>) => {
            SetFieldAction.new(dValue, 'value', U.initializeValue(feature.type), '+=', false);
        }
        const deleteValue = (index: number) => {
            SetFieldAction.new(dValue, 'value', index, '-=', false);
        }

        const change = (event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean) => {
            const target = event.target.value;
            const newValues = [...dValue.value];
            newValues[index] = target;
            SetFieldAction.new(dValue, 'value', newValues, '', target !== 'null' && isPointer);
        }

        return(<div>
            {Structure.BaseEditor(lValue)}
            <hr />
            <div className={"d-flex"}>
                <label>Values</label>
                <button className={"btn btn-success py-0 px-2 ms-2"} disabled={dValue.value.length >= upperBound}
                        onClick={addValue}><i className={"bi bi-plus"}></i></button>
            </div>
            {dValue.value.map((val, index) => {
                return <div key={index} className={"d-block mt-1"}>
                    {feature.className === "DAttribute" &&  feature.type.className === "DClass" &&
                        <input className={"my-input"} defaultValue={String(val)} type={'text'} onChange={(evt) => change(evt, index, false)} />
                    }
                    {feature.className === "DAttribute" &&  feature.type.className === "DEnumerator" &&
                        <select className={"my-input"}  value={val} onChange={(evt) => {change(evt, index, true)}}>
                            <option value={'null'}>NULL</option>
                            {(feature.type as LEnumerator).literals.map((literal, i) => {
                                return <option key={i} value={literal.id}>{literal.name}</option>
                            })}
                        </select>
                    }
                    {feature.className === "DReference" &&
                        <select className={"my-input"}  value={val} onChange={(evt) => {change(evt, index, true)}}>
                            <option value={'null'}>NULL</option>
                            {Selectors.getObjects().filter((obj) => {
                                return obj.instanceof[0].id === feature.type.id
                            }).map((obj, i) => {
                                return <option key={i} value={obj.id}>{obj.feature('name')}</option>
                            })}
                        </select>                    }
                    <button className={"btn btn-danger py-0 px-2 ms-2"} onClick={() => deleteValue(index)}>
                        <i className={"bi bi-trash3-fill"}></i>
                    </button>
                </div>
            })}
        </div>);
    }
    public static Editor(lModelElement: LModelElement|undefined) : ReactNode {
        if(lModelElement){
            switch (lModelElement.className){
                default: break;
                case "DModel": return Structure.ModelEditor(lModelElement);
                case "DPackage": return Structure.PackageEditor(lModelElement);
                case "DClass": return Structure.ClassEditor(lModelElement);
                case "DAttribute": return Structure.AttributeEditor(lModelElement);
                case "DReference": return Structure.ReferenceEditor(lModelElement);
                case "DEnumerator": return Structure.EnumEditor(lModelElement);
                case "DEnumLiteral": return Structure.EnumLiteralEditor(lModelElement);
                case "DOperation": return Structure.OperationEditor(lModelElement);
                case "DObject" : return Structure.BaseEditor(lModelElement);
                case "DValue" : return Structure.ValueEditor(lModelElement);
            }
        }
        return <div className={"row"}><div className={"col-lg"}>No model selected.</div></div>;
    }
}

