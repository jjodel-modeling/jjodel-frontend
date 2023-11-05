import {
    AttribETypes,
    CoordinateMode,
    EdgeBendingMode,
    EdgeHead,
    EGraphElements,
    EModelElements,
    stateInitializer,
    ShortAttribETypes,
    windoww,
    AccessModifier,
    EdgeGapMode
} from "../joiner";
import * as Componentss from '../joiner/components';


/*
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
    [DViewElement, LViewElement],
    [DVoidVertex, LVoidVertex]
    // [DMap, LMap],
];
*/

/*for (let pair of pairs as any[]) {
    pair[0].logic = pair[1];
    pair[1].singleton = new pair[1]();
    pair[1].structure = pair[0];
    windoww[pair[0].name] = pair[0];
    windoww[pair[1].name] = pair[1];
}*/

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
// DState.fakeinit();
// Symbol.prototype.toString = function(): string { alert('symbol to string'); return String(this); }

let Components = Componentss;
/*
Components.map(C=> {
    if (typeof C === 'object') return
})
for (let Comp of Components) {

}*/
let wComponents = {...Components}
for (let key in wComponents) {
    let index = key.indexOf("Component")
    if (index === -1) continue;
    let newkey = key.substring(0, index);
    if ((Components as any)[newkey]) continue;
    (wComponents as any)[newkey] = (Components as any)[key];
}

// (Components as any)["input"] = Components["InputComponent"];
windoww.Components = wComponents;
windoww.enumerators = {};


(window as any).ShortAttribETypes = ShortAttribETypes;
(window as any).enumerators.ShortAttribETypes = ShortAttribETypes;
(window as any).AccessModifier = AccessModifier;
(window as any).enumerators.AccessModifier = AccessModifier;
(window as any).AttribETypes = AttribETypes;
(window as any).enumerators.AttribETypes = AttribETypes;
(window as any).CoordinateMode = CoordinateMode;
(window as any).enumerators.CoordinateMode = CoordinateMode;
(window as any).EdgeHead = EdgeHead;
(window as any).enumerators.EdgeHead = EdgeHead;
(window as any).EGraphElements = EGraphElements;
(window as any).enumerators.EGraphElements = EGraphElements;
(window as any).EModelElements = EModelElements;
(window as any).enumerators.EModelElements = EModelElements;
(window as any).EdgeGapMode = EdgeGapMode;
(window as any).enumerators.EdgeGapMode = EdgeGapMode;
(window as any).EdgeBendingMode = EdgeBendingMode;
(window as any).enumerators.EdgeBendingMode = EdgeBendingMode;

function afterStoreLoad() {
    stateInitializer();
}

// afterStoreLoad();
// setTimeout( afterStoreLoad, 0);
