import {
    DAnnotation,
    DAttribute,
    DClass,
    DClassifier,
    DEnumerator,
    DEnumLiteral,
    DModel,
    DModelElement,
    DObject,
    DOperation,
    DPackage,
    DParameter,
    DReference,
    DStructuralFeature,
    DValue,
    LAnnotation,
    LAttribute,
    LClass,
    LClassifier,
    LEnumerator,
    LEnumLiteral,
    LModel,
    LModelElement,
    LObject,
    LOperation,
    LPackage,
    LParameter,
    LReference,
    LStructuralFeature,
    LValue,
    windoww,
    LModelElementTransientProperties,
    DModelElementTransientProperties,
    DViewTransientProperties,
    LViewTransientProperties,
    DViewPrivateTransientProperties,
    LViewPrivateTransientProperties,
    LViewElement,
    ViewElement,
} from "../joiner";


let pairs = [
    [DAnnotation, LAnnotation],
    [DModelElement, LModelElement],
    [DAttribute, LAttribute],
    [DClass, LClass],
    [DClassifier, LClassifier],
    [DEnumerator, LEnumerator],
    [DEnumLiteral, LEnumLiteral],
    [DModel, LModel],
    [DObject, LObject],
    [DOperation, LOperation],
    [DPackage, LPackage],
    [DParameter, LParameter],
    [DReference, LReference],
    [DStructuralFeature, LStructuralFeature],
    [DValue, LValue],
    [DModelElementTransientProperties, LModelElementTransientProperties],
    [DViewTransientProperties, LViewTransientProperties],
    [DViewPrivateTransientProperties, LViewPrivateTransientProperties],
    [ViewElement, LViewElement],
    // [DMap, LMap],
];

for (let pair of pairs as any[]) {
    pair[0].logic = pair[1];
    pair[1].singleton = new pair[1]();
    pair[1].structure = pair[0];
    windoww[pair[0].name] = pair[0];
    windoww[pair[1].name] = pair[1];
}

/*
DAnnotation.logic = LAnnotation;
LAnnotation.singleton = new LAnnotation();

DModelElement.logic = LModelElement;
LModelElement.singleton = new LModelElement();
DAttribute.logic = LAttribute;
LAttribute.singleton = new LAttribute();
DClass.logic = LClass;
DClassifier.logic = LClassifier;
DEnumerator.logic = LEnumerator;
DEnumLiteral.logic = LEnumLiteral;
DModel.logic = LModel;
DOBject.logic = LObject;
DOperation.logic = LOperation;
DPackage.logic = LPackage;
DParameter.logic = LParameter;
DReference.logic = LReference;
DStructuralFeature.logic = LStructuralFeature;
DValue.logic = LValue;
DModelElementTransientProperties.logic = LModelElementTransientProperties;

LClass.singleton = new LClass();
LClassifier.singleton = new LClassifier();
LEnumerator.singleton = new LEnumerator();
LEnumLiteral.singleton = new LEnumLiteral();
LOperation.singleton = new LOperation();
LPackage.singleton = new LPackage();
LParameter.singleton = new LParameter();
LReference.singleton = new LReference();
LStructuralFeature.singleton = new LStructuralFeature();
LValue.singleton = new LValue();
LModel.singleton = new LModel();
LObject.singleton = new LObject();
LModelElementTransientProperties.singleton = new LModelElementTransientProperties();
*/
export const fakeExport = {}; // just to import-execute this file
export {store} from "../redux/createStore";
// Symbol.prototype.toString = function(): string { alert('symbol to string'); return String(this); }
