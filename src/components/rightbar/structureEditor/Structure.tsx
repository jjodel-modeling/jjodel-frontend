import React, {ReactNode} from "react";
import {LModelElement} from "../../../model/logicWrapper";
import {Input, LModel, LPackage} from "../../../joiner";
export default class Structure {
    private static BaseEditor(lModelElement: LModelElement) : ReactNode {
        return(<>
            <Input obj={lModelElement} field={"name"} label={"Name:"} type={"text"} />
        </>);
    }
    public static ModelEditor(lModel: LModelElement): ReactNode {
        return(<>
            {Structure.BaseEditor(lModel)}
        </>);
    }
    public static PackageEditor(lPackage: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lPackage)}
            <Input obj={lPackage} field={"uri"} label={"NsURI:"} type={"text"} />
            <Input obj={lPackage} field={"prefix"} label={"NsPrefix:"} type={"text"} />
        </div>);
    }
    public static ClassEditor(lClass: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lClass)}
            <Input obj={lClass} field={"abstract"} label={"IsAbstract"} type={"checkbox"} />
            <Input obj={lClass} field={"interface"} label={"IsInterface"} type={"checkbox"} />
        </div>);
    }
    private static DataTypeEditor(lDataType: LModelElement): ReactNode {
        return(<>
            <Input obj={lDataType} field={"serializable"} label={"IsSerializable"} type={"checkbox"} />
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
            <Input obj={lTypedElement} field={"lowerBound"} label={"Lower Bound"} type={"number"} />
            <Input obj={lTypedElement} field={"upperBound"} label={"Upper Bound"} type={"number"} />
            <Input obj={lTypedElement} field={"ordered"} label={"IsOrdered"} type={"checkbox"} />
            <Input obj={lTypedElement} field={"unique"} label={"IsUnique"} type={"checkbox"} />
        </>);
    }
    private static StructuralFeatureEditor(lStructuralFeature: LModelElement): ReactNode {
        return(<>
            <Input obj={lStructuralFeature} field={"defaultValueLiteral"} label={"Default Value Literal"} type={"text"} />
            <Input obj={lStructuralFeature} field={"changeable"} label={"IsChangeable"} type={"checkbox"} />
            <Input obj={lStructuralFeature} field={"volatile"} label={"IsVolatile"} type={"checkbox"} />
            <Input obj={lStructuralFeature} field={"transient"} label={"IsTransient"} type={"checkbox"} />
            <Input obj={lStructuralFeature} field={"unsettable"} label={"IsUnsettable"} type={"checkbox"} />
            <Input obj={lStructuralFeature} field={"derived"} label={"IsDerived"} type={"checkbox"} />
        </>);
    }
    public static AttributeEditor(lAttribute: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lAttribute)}
            {Structure.TypedElementEditor(lAttribute)}
            {Structure.StructuralFeatureEditor(lAttribute)}
            <Input obj={lAttribute} field={"isID"} label={"IsID"} type={"checkbox"} />
        </div>);
    }
    public static ReferenceEditor(lReference: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lReference)}
            {Structure.TypedElementEditor(lReference)}
            {Structure.StructuralFeatureEditor(lReference)}
            <Input obj={lReference} field={"containment"} label={"IsContainment"} type={"checkbox"} />
            <Input obj={lReference} field={"container"} label={"IsContainer"} type={"checkbox"} />
            <Input obj={lReference} field={"resolveProxies"} label={"IsResolveProxies"} type={"checkbox"} />
        </div>);
    }
    public static EnumLiteralEditor(lEnumLiteral: LModelElement): ReactNode {
        return(<div>
            {Structure.BaseEditor(lEnumLiteral)}
            <Input obj={lEnumLiteral} field={"value"} label={"Value"} type={"number"} />
        </div>);
    }
    public static Editor(lModelElement:LModelElement|undefined) : ReactNode {
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
            }
        }
        return <div>Empty selection.</div>
    }
}

