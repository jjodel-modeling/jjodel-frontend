import React, {ReactNode} from "react";
import type {DClassifier, GObject, LModelElement, LParameter} from "../../../joiner";
import {Input, LClassifier, LPointerTargetable, Select, SetRootFieldAction, UX} from "../../../joiner";

export default class Structure {
    private static BaseEditor(lModelElement: LModelElement) : ReactNode {
        return(<div className={"structure-input-wrapper row"}>
            <Input obj={lModelElement} field={"name"} label={"Name"} type={"text"} tooltip={"Tooltip"} />
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
                    <Input obj={lPackage} field={"uri"} label={"NsURI"} type={"text"} tooltip={"Tooltip"} />
                </div>
                <div className={"structure-input-wrapper row"}>
                    <Input obj={lPackage} field={"prefix"} label={"NsPrefix"} type={"text"} tooltip={"Tooltip"} />
                </div>
            </div>);
    }
    public static ClassEditor(lClass: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lClass)}
            <div className={"structure-input-wrapper row"}>
                <Input obj={lClass} field={"abstract"} label={"IsAbstract"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lClass} field={"interface"} label={"IsInterface"} type={"checkbox"} tooltip={"Tooltip"} />
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
                <Input obj={lDataType} field={"serializable"} label={"IsSerializable"} type={"checkbox"} tooltip={"Tooltip"} />
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
                <Input obj={lTypedElement} field={"lowerBound"} label={"Lower Bound"} type={"number"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"upperBound"} label={"Upper Bound"} type={"number"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"ordered"} label={"IsOrdered"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lTypedElement} field={"unique"} label={"IsUnique"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
        </>);
    }
    private static StructuralFeatureEditor(lStructuralFeature: LModelElement): ReactNode {
        return(<>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"defaultValueLiteral"} label={"Default Value Literal"} type={"text"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"changeable"} label={"IsChangeable"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"volatile"} label={"IsVolatile"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"transient"} label={"IsTransient"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"unsettable"} label={"IsUnsettable"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lStructuralFeature} field={"derived"} label={"IsDerived"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
        </>);
    }
    public static AttributeEditor(lAttribute: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lAttribute)}
            {Structure.TypedElementEditor(lAttribute)}
            {Structure.StructuralFeatureEditor(lAttribute)}
            <div className={"structure-input-wrapper row"}>
                <Input obj={lAttribute} field={"isID"} label={"IsID"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
        </div>);
    }
    public static ReferenceEditor(lReference: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lReference)}
            {Structure.TypedElementEditor(lReference)}
            {Structure.StructuralFeatureEditor(lReference)}
            <div className={"structure-input-wrapper row"}>
                <Input obj={lReference} field={"containment"} label={"IsContainment"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lReference} field={"container"} label={"IsContainer"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
            <div className={"structure-input-wrapper row"}>
                <Input obj={lReference} field={"resolveProxies"} label={"IsResolveProxies"} type={"checkbox"} tooltip={"Tooltip"} />
            </div>
        </div>);
    }
    public static EnumLiteralEditor(lEnumLiteral: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lEnumLiteral)}<div className={"structure-input-wrapper row"}>
            <Input obj={lEnumLiteral} field={"value"} label={"Value"} type={"number"} tooltip={"Tooltip"} />
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
                            <Input obj={parameter.id} field={"name"} label={"Parameter"} type={"text"} tooltip={"Tooltip"} />
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
                    <Input obj={exception} field={"name"} label={"Exception"} type={"text"} tooltip={"Tooltip"} />
                    <div className={"child-delete"} onClick={async() => {await UX.deleteWithAlarm(lException)}}>
                        <i className={"bi bi-trash3-fill"}></i>
                    </div>
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
                case "DValue" : return Structure.BaseEditor(lModelElement);
            }
        }
        return <div className={"row"}><div className={"col-lg"}>No model selected.</div></div>;
    }
}

