import React, {ReactNode} from "react";
import type {GObject, LModelElement} from "../../../joiner";
import {
    DObject,
    DValue,
    Input,
    LModel,
    LObject,
    LOperation,
    LPointerTargetable,
    LValue,
    Select, Selectors,
    SetFieldAction,
    store
} from "../../../joiner";
import Value from "./editors/Value";

export default class Structure {
    private static BaseEditor(lModelElement: LModelElement) : ReactNode {
        if(!lModelElement) return(<></>);
        return(<>
            {/*<Input obj={lModelElement} field={"id"} label={"ID"} type={"text"} readonly={true} />*/}
            <Input obj={lModelElement} field={"name"} label={"Name"} type={"text"} tooltip={"Element name"} />
        </>);
    }
    public static ModelEditor(lModel: LModelElement): ReactNode {
        if(!lModel) return(<></>);
        return(<>{Structure.BaseEditor(lModel)}</>);
    }
    public static PackageEditor(lPackage: LModelElement): ReactNode {
        if(!lPackage) return(<></>);
        return(<>
            {Structure.BaseEditor(lPackage)}
            <Input obj={lPackage} field={"uri"} label={"NsURI"} type={"text"} tooltip={"Namespace URI of the package, i.e. the URI that is displayed in the xmlns tag to identify this package in an XMI document"} />
            <Input obj={lPackage} field={"prefix"} label={"NsPrefix"} type={"text"} tooltip={"Namespace prefix that is used when references to instances of the classes in this package are serialized"} />
        </>);
    }
    public static ClassEditor(lClass: LModelElement): ReactNode {
        if(!lClass) return(<></>);
        return(<>
            {Structure.BaseEditor(lClass)}
            <Input obj={lClass} field={"abstract"} label={"IsAbstract"} type={"checkbox"} tooltip={"If set to True, the generated implementation class will have the abstract keyword"} />
            <Input obj={lClass} field={"interface"} label={"IsInterface"} type={"checkbox"} tooltip={"If set to True, only the java interface will be generated. There will be no corresponding implementation class and no create method in the factory"} />
        </>);
    }
    private static DataTypeEditor(lDataType: LModelElement): ReactNode {
        if(!lDataType) return(<></>);
        return(<Input obj={lDataType} field={"serializable"} label={"IsSerializable"} type={"checkbox"} tooltip={"It represents whether values of this type will be serialized"} />);
    }
    public static EnumEditor(lEnum: LModelElement): ReactNode {
        if(!lEnum) return(<></>);
        return(<>
            {Structure.BaseEditor(lEnum)}
            {Structure.DataTypeEditor(lEnum)}
        </>);
    }
    private static TypedElementEditor(lTypedElement: LModelElement): ReactNode {
        if(!lTypedElement) return(<></>);
        return(<>
            <Select obj={lTypedElement} field={"type"} label={"Type"} tooltip={"Element Type"} />
            <Input obj={lTypedElement} field={"lowerBound"} label={"Lower Bound"} type={"number"} tooltip={"Determines the setting of the required property. If lowerBound is 0, the required property will be set to False. Otherwise, the required property will be set to True"} />
            <Input obj={lTypedElement} field={"upperBound"} label={"Upper Bound"} type={"number"} tooltip={"Determines the setting of the many property. If upperBound is 1, the many property will be set to False. Otherwise, the many property will be set to True"} />
            <Input obj={lTypedElement} field={"ordered"} label={"IsOrdered"} type={"checkbox"} tooltip={"It represents whether order is meaningful"} />
            <Input obj={lTypedElement} field={"unique"} label={"IsUnique"} type={"checkbox"} tooltip={"Indicates whether a many-valued attribute is allowed to have duplicates"} />
        </>);
    }
    private static StructuralFeatureEditor(lStructuralFeature: LModelElement): ReactNode {
        if(!lStructuralFeature) return(<></>);
        return(<>
            <Input obj={lStructuralFeature} field={"defaultValueLiteral"} label={"Default Value Literal"} type={"text"} tooltip={"Determines the value returned by the get method if the feature has never been set"} />
            <Input obj={lStructuralFeature} field={"changeable"} label={"IsChangeable"} type={"checkbox"} tooltip={"Indicates whether the reference may be modified. If changeable is set to False, no set() method is generated for the reference"} />
            <Input obj={lStructuralFeature} field={"volatile"} label={"IsVolatile"} type={"checkbox"} tooltip={"Indicates whether the reference cannot be cached. If volatile is set to True, the generated class does not contain a field to hold the reference and the generated get() and set() methods for the reference are empty"} />
            <Input obj={lStructuralFeature} field={"transient"} label={"IsTransient"} type={"checkbox"} tooltip={"Indicates whether the reference should not be stored"} />
            <Input obj={lStructuralFeature} field={"unsettable"} label={"IsUnsettable"} type={"checkbox"} tooltip={"Indicates that the feature may be unset"} />
            <Input obj={lStructuralFeature} field={"derived"} label={"IsDerived"} type={"checkbox"} tooltip={"A derived feature typically computes its value from those of other features. It will typically be transient and will often be volatile and not changeable. The default copier won't copy it"} />
        </>);
    }
    public static AttributeEditor(lAttribute: LModelElement): ReactNode {
        if(!lAttribute) return(<></>);
        return(<>
            {Structure.BaseEditor(lAttribute)}
            {Structure.TypedElementEditor(lAttribute)}
            {Structure.StructuralFeatureEditor(lAttribute)}
            <Input obj={lAttribute} field={"isID"} label={"IsID"} type={"checkbox"} tooltip={"An ID attribute explicitly models the one unique ID of an object"} />
        </>);
    }
    public static ReferenceEditor(lReference: LModelElement): ReactNode {
        if(!lReference) return(<></>);
        return(<>
            {Structure.BaseEditor(lReference)}
            {Structure.TypedElementEditor(lReference)}
            {Structure.StructuralFeatureEditor(lReference)}
            <Input obj={lReference} field={"containment"} label={"IsContainment"} type={"checkbox"} tooltip={"Indicates whether the reference is a containment"} />
            <Input obj={lReference} field={"container"} label={"IsContainer"} type={"checkbox"} tooltip={"Indicates whether the reference is a container. This is the opposite of a containment EReference. If container is true, the generated accessor methods will have container semantics"} />
            <Input obj={lReference} field={"resolveProxies"} label={"IsResolveProxies"} type={"checkbox"} tooltip={"Indicates whether proxy references should be resolved automatically"} />
        </>);
    }
    public static EnumLiteralEditor(lEnumLiteral: LModelElement): ReactNode {
        if(!lEnumLiteral) return(<></>);
        return(<>
            {Structure.BaseEditor(lEnumLiteral)}
            <Input obj={lEnumLiteral} field={"value"} label={"Value"} type={"number"} tooltip={"Determines the integer value that is associated with this literal"} />
        </>);
    }

    public static OperationEditor(me: LModelElement): ReactNode {
        const operation: LOperation = LOperation.fromPointer(me.id);
        if(!operation) return(<></>);
        return(<>
            {Structure.BaseEditor(operation)}
            <Select obj={operation.parameters[0].id} field={'type'} label={'Return'} tooltip={"Method return type"} />
            {operation.parameters.map((parameter, index) => {
                if (index > 0) {
                    return <div key={index}>
                        <label className={'ms-1'}>Parameter</label>
                        <div className={'ms-3'}>
                            <Input obj={parameter.id} field={"name"} label={'• Name'} type={"text"} tooltip={"Name of the generated argument"} />
                            <Select obj={parameter.id} field={"type"} label={'• Type'} tooltip={"Argument type"} />
                        </div>
                    </div>
                }
            })}
            {operation.exceptions.map((exception, index) => {
                return <div key={index}>
                    <Input obj={exception.id} field={"name"} label={"Exception"} type={"text"} tooltip={"Exception name"} />
                </div>
            })}
        </>);
    }
    public static ObjectEditor(me: LModelElement): ReactNode {
        const object: LObject = LObject.fromPointer(me.id);
        if(!object) return(<></>);
        let conform = true;
        for(let feature of object.features) {
            let upperBound =  feature.instanceof ? feature.instanceof.upperBound : -1;
            upperBound = (upperBound === -1) ? 999 : upperBound;
            const lowerBound =  feature.instanceof ? feature.instanceof.lowerBound : -1;
            const value = feature.value;
            // const length = (Array.isArray(value)) ? value.length : (value === '') ? 0 : 1;
            conform = (value.length >= lowerBound && value.length <= upperBound);
        }

        return(<div>

            {object.instanceof && conform && <label>This instance is <b className={'text-success'}>CONFORM</b> to {object.instanceof.name}</label>}
            {object.instanceof && !conform && <label>This instance is <b className={'text-danger'}>NOT CONFORM</b> to {object.instanceof.name}</label>}
            {!object.instanceof && <label>This instance is <b className={'text-warning'}>SHAPELESS</b></label>}
            {/*this.forceConform(object)*/}
        </div>);
    }
    public static forceConform(me: LObject) {
        let mm: LModel = Selectors.getLastSelectedModel().m2 as LModel; // LPointerTargetable.fromPointer(store.getState().metamodel as any);

        return <div>
            <select onChange={ (event)=>{
                (window as any).debugmm = mm;
                (window as any).debugm = me;
                me.instanceof = event.target.value === "undefined" ? undefined : event.target.value as any;
            } } value={me.instanceof?.id || "undefined"}>
                <optgroup label={mm.name}>
                    {
                        (mm.classes || []).map( c =>
                            <option value={c.id}>{c.name}</option>
                        )
                    }
                    <option value={"undefined"}>Object</option>
                </optgroup>
            </select>
        </div>
    }
    public static ValueEditor(me: LModelElement): ReactNode {
        const lValue: LValue = LValue.fromPointer(me.id);
        if(!lValue) return(<></>);
        return(<div>
            <Value value={lValue} />
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
                case "DObject" : return Structure.ObjectEditor(lModelElement);
                case "DValue" : return Structure.ValueEditor(lModelElement);
            }
        }
        return <div></div>;
    }
}

