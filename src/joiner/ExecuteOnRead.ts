import {
    DAnnotation,
    DAttribute,
    DClass,
    DClassifier,
    DEnumerator,
    DEnumLiteral, DModel,
    DModelElement, DOBject, DOperation, DPackage, DParameter, DReference, DStructuralFeature, DValue,
    LAnnotation,
    LAttribute,
    LClass,
    LClassifier,
    LEnumerator, LEnumLiteral, LModel,
    LModelElement, LObject, LOperation, LPackage, LParameter, LReference, LStructuralFeature, LValue
} from "../joiner";


DAnnotation.logic = LAnnotation;
DModelElement.logic = LModelElement;
DAttribute.logic = LAttribute;
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

LAnnotation.singleton = new LAnnotation();
LModelElement.singleton = new LModelElement();
LAttribute.singleton = new LAttribute();
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

export const fakeExport = {}; // just to import-execute this file
export {store} from "../redux/createStore";
// Symbol.prototype.toString = function(): string { alert('symbol to string'); return String(this); }
