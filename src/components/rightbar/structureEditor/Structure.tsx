import React, {ReactNode} from "react";
import type {DClassifier, GObject, LModelElement, LParameter} from "../../../joiner";
import {
    Input,
    LClassifier,
    LEnumerator,
    LObject,
    LPointerTargetable,
    LStructuralFeature,
    LValue,
    Select,
    Selectors,
    SetFieldAction,
    SetRootFieldAction,
    UX
} from "../../../joiner";

export default class Structure {
    private static BaseEditor(lModelElement: LModelElement) : ReactNode {
        return(<div className={"structure-input-wrapper row"}>
            <Input obj={lModelElement} field={"name"} label={"Name"} type={"text"} tooltip={"name"} />
        </div>);
    }
    public static ModelEditor(lModel: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lModel)}
        </>);
    }
    public static PackageEditor(lPackage: LModelElement): ReactNode {
        return(
            <div>
                {Structure.BaseEditor(lPackage)}
                <div className={"structure-input-wrapper row"}>
                    <Input obj={lPackage} field={"uri"} label={"NsURI"} type={"text"} tooltip={"uri"} />
                </div>
                <div className={"structure-input-wrapper row"}>
                    <Input obj={lPackage} field={"prefix"} label={"NsPrefix"} type={"text"} tooltip={"prefix"} />
                </div>
            </div>);
    }
    public static ClassEditor(lClass: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lClass)}
            <div className={"structure-input-wrapper row"}>
                <Input obj={lClass} field={"abstract"} label={"IsAbstract"} type={"checkbox"} tooltip={"abstract"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lClass} field={"interface"} label={"IsInterface"} type={"checkbox"} tooltip={"interface"} />
            </div>
            <div className={"d-none structure-input-wrapper row"}>
                <p className={"generic-text"}>Set Extend</p>
                <div className={"generic-button"} onClick={() => {
                    SetRootFieldAction.new('isEdgePending', {
                        user: '',
                        source: lClass.id
                    });
                }}>
                    <i className={"bi bi-caret-up-fill"}></i>
                </div>
            </div>
        </div>);
    }
    private static DataTypeEditor(lDataType: LModelElement): ReactNode {
        return(<>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lDataType} field={"serializable"} label={"IsSerializable"} type={"checkbox"} tooltip={"serializable"} />
            </div>
        </>);
    }
    public static EnumEditor(lEnum: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lEnum)}
            {Structure.DataTypeEditor(lEnum)}
        </div>);
    }
    private static TypedElementEditor(lTypedElement: LModelElement): ReactNode {
        return(<>
            <div className={"structure-input-wrapper row"}>
                <Select obj={lTypedElement} field={"type"} label={"Type"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"lowerBound"} label={"Lower Bound"} type={"number"} tooltip={"lowerBound"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"upperBound"} label={"Upper Bound"} type={"number"} tooltip={"upperBound"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"ordered"} label={"IsOrdered"} type={"checkbox"} tooltip={"ordered"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"unique"} label={"IsUnique"} type={"checkbox"} tooltip={"unique"} />
            </div>
        </>);
    }
    private static StructuralFeatureEditor(lStructuralFeature: LModelElement): ReactNode {
        return(<>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"defaultValueLiteral"} label={"Default Value Literal"} type={"text"} tooltip={"defaultValueLiteral"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"changeable"} label={"IsChangeable"} type={"checkbox"} tooltip={"changeable"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"volatile"} label={"IsVolatile"} type={"checkbox"} tooltip={"volatile"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"transient"} label={"IsTransient"} type={"checkbox"} tooltip={"transient"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"unsettable"} label={"IsUnsettable"} type={"checkbox"} tooltip={"unsettable"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"derived"} label={"IsDerived"} type={"checkbox"} tooltip={"derived"} />
            </div>
        </>);
    }
    public static AttributeEditor(lAttribute: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lAttribute)}
            {Structure.TypedElementEditor(lAttribute)}
            {Structure.StructuralFeatureEditor(lAttribute)}
            <div className={"structure-input-wrapper row"}>
                <Input obj={lAttribute} field={"isID"} label={"IsID"} type={"checkbox"} tooltip={"isID"} />
            </div>
        </div>);
    }
    public static ReferenceEditor(lReference: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lReference)}
            {Structure.TypedElementEditor(lReference)}
            {Structure.StructuralFeatureEditor(lReference)}
            <div className={"structure-input-wrapper row"}>
                <Input obj={lReference} field={"containment"} label={"IsContainment"} type={"checkbox"} tooltip={"containment"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lReference} field={"container"} label={"IsContainer"} type={"checkbox"} tooltip={"container"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lReference} field={"resolveProxies"} label={"IsResolveProxies"} type={"checkbox"} tooltip={"resolveProxies"} />
            </div>
        </div>);
    }
    public static EnumLiteralEditor(lEnumLiteral: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lEnumLiteral)}<div className={"structure-input-wrapper row"}>
            <Input obj={lEnumLiteral} field={"value"} label={"Value"} type={"number"} tooltip={"Value"} />
        </div>
        </div>);
    }

    public static OperationEditor(lOperation: LModelElement & GObject): ReactNode {
        return(<div>
            {Structure.BaseEditor(lOperation)}
            {lOperation.parameters.map((parameter: LParameter, index: number) => {
                const lParameter: LParameter = parameter;
                if (index > 0) {
                    return <div>
                        <div className={"structure-children-input-wrapper row"}>
                            <Input obj={parameter.id} field={"name"} label={"Parameter"} type={"text"} tooltip={"parameter"} />
                            <Select obj={parameter.id} field={"type"} />
                            <div className={"child-delete"} onClick={() => { UX.deleteWithAlarm(lParameter)}}>
                                <i className={"bi bi-trash3-fill"}></i>
                            </div>
                        </div>
                    </div>
                }
            })}
            {lOperation.exceptions.map((exception: DClassifier) => {
                const lException: LClassifier = LPointerTargetable.from(exception);
                return <div className={"structure-children-input-wrapper row"}>
                    <Input obj={exception} field={"name"} label={"Exception"} type={"text"} tooltip={"exception"} />
                    <div className={"child-delete"} onClick={async() => {await UX.deleteWithAlarm(lException)}}>
                        <i className={"bi bi-trash3-fill"}></i>
                    </div>
                </div>
            })}
        </div>);
    }
    public static ValueEditor(lValue: LModelElement & GObject): ReactNode {
        const value: LValue = LValue.fromPointer(lValue.id);
        const feature: LStructuralFeature = LStructuralFeature.from(value.instanceof[0]);
        const lowerBound = value.instanceof[0].lowerBound;
        let upperBound = value.instanceof[0].upperBound;
        if (upperBound < 0) upperBound = 999;

        const addValue = (event: React.MouseEvent<HTMLButtonElement>) => {
            SetFieldAction.new(value.__raw, 'value', 'null', '+=', false);
        }
        const deleteValue = (index: number) => {
            SetFieldAction.new(value.__raw, 'value', index, '-=', false);
        }

        const change = (event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, index: number, isPointer: boolean) => {
            const target = event.target.value;
            if(value.instanceof[0].name === 'name') value.father.name = target;
            const newValues = [...value.__raw.value];
            newValues[index] = target;
            SetFieldAction.new(value.__raw, 'value', newValues, '', target !== 'null' && isPointer);
        }

        return(<div>
            {Structure.BaseEditor(value)}
            <hr />
            <div className={"d-flex"}>
                <label>Values</label>
                <button className={"btn btn-success py-0 px-2 ms-2"} disabled={value.value.length >= upperBound}
                        onClick={addValue}><i className={"bi bi-plus"}></i></button>
            </div>
            {value.value.map((val, index) => {
                return <div key={index} className={"d-block mt-1"}>
                    {feature.className === "DAttribute" &&  feature.type.className === "DClass" &&
                        <input className={"my-input"} defaultValue={String(val)} type={'text'} onChange={(evt) => change(evt, index, false)} />
                    }
                    {feature.className === "DAttribute" &&  feature.type.className === "DEnumerator" &&
                        <select className={"my-input"}  defaultValue={val as string} onChange={(evt) => {change(evt, index, true)}}>
                            <option value={'null'}>NULL</option>
                            {(feature.type as LEnumerator).literals.map((literal, i) => {
                                return <option key={i} value={literal.id}>{literal.name}</option>
                            })}
                        </select>
                    }
                    {feature.className === "DReference" &&
                        <select className={"my-input"}  defaultValue={(val as LObject).id} onChange={(evt) => {change(evt, index, true)}}>
                            <option value={'null'}>NULL</option>
                            {Selectors.getObjects().filter((obj) => {return obj.instanceof[0].id === value.instanceof[0].type.id}).map((obj, i) => {
                                return <option key={i} value={obj.id}>{obj.name}</option>
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

