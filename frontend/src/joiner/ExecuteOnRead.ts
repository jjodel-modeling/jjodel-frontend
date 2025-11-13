import Handlebars from "handlebars";
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
    EdgeGapMode, GObject
} from "../joiner";
import * as Componentss from '../joiner/components';
import React from "react";
import any = jasmine.any;


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
let wComponents: GObject = {...Components}
// set fallback keys without "Component" string, only if this does not make a naming conflict.
for (let key in wComponents) {
    let index = key.indexOf("Component")
    if (index === -1) continue;
    let newkey = key.substring(0, index);
    if ((Components as any)[newkey]) continue;
    (wComponents as any)[newkey] = (Components as any)[key];
}
windoww.React = React;
// (Components as any)["input"] = Components["InputComponent"];
windoww.Components = wComponents;
for (let k in wComponents) {
    if (windoww[k] && windoww[k] !== wComponents[k]) {
        let str = "Component naming conflict with a preexisting variable \"" + k + "\"";
        console.error(str, {inWindow:windoww[k], inComponents:wComponents[k]});
        throw new Error(str);
    }
    windoww[k] = wComponents[k];
}

windoww.enumerators = {};
// @ts-ignore
function handlebarsIfCond_original(v1, operator, v2, options) {
    // @ts-ignore
    console.log('handlebars helper ifCond', {thiss:this as any, arguments, v1, operator, v2, options});
    switch (operator) {
        case '==': // @ts-ignore
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': // @ts-ignore
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=': // @ts-ignore
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==': // @ts-ignore
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<': // @ts-ignore
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=': // @ts-ignore
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>': // @ts-ignore
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=': // @ts-ignore
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&': // @ts-ignore
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||': // @ts-ignore
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default: // @ts-ignore
            return options.inverse(this);
    }
}

// @ts-ignore
function handlebarsIfCond(useless: any) {
    let rawArguments = [...arguments].slice(0, arguments.length-1);
    // @ts-ignore
    console.log('handlebars helper ifCond', {thiss:this as any, arguments, rawArguments});
    let arr = rawArguments.map((a, i) => {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        switch (typeof a) {
            default: case 'symbol': case 'object': case 'function':
                (window as any).Log.exx("M2T/Handlebars #ifCond helper error, "+(typeof a)+" cannot be compared in an expression", {
                    expressionRaw: [...rawArguments].join(''), wrongParameterIndex: i
                });
                return NaN; // because nan always fails every comparison
            case 'string': return '"'+(window as any).U.replaceAll(a, '"', '\\"')+'"';
            case 'number': case 'boolean': return a;
        }
    });
    let str = arr.join('');
    try { return eval('('+str+')'); }
    catch (e: any) {
        (window as any).Log.exx("M2T/Handlebars #ifCond evaluation error, "+e?.message+" cannot be compared in an expression", {str, rawArguments, e});
    }
    return false;
}

function handlebarsJs(useless: any) {
    let rawArguments = [...arguments].slice(0, arguments.length-2);
    let str = rawArguments[rawArguments.length - 2];
    // @ts-ignore
    console.log('handlebars helper js', {thiss:this as any, arguments, rawArguments, str});
    let msg: string = '';
    if (rawArguments.length < 3) {
        msg = "Error in {{#js}} tag, at least 2 parameters are required. an argument list followed by a string containing a js function to be applied to the arguments";
        Log.ee(msg, rawArguments);
        return msg;
    }
    let f = (...a:any)=>any = null as any;
    try {
        f = eval('('+str+')');
        if (typeof f !== 'function') {
            msg = "Error in {{#js}} tag, the last argument must be a string containing a js function";
            Log.ee(msg, {rawArguments, js:str});
            return msg;
        }
    } catch (e) {
        msg = "Syntax Error in {{#js}} tag: " + e.message;
        Log.ee(msg, {e, rawArguments, js:str});
        return msg;
    }
    let a: any;
    try {
        a = f(...rawArguments);
    } catch (e) {
        msg = "Runtime Error in {{#js}} tag: " + e.message;
        Log.ee(msg, {e, rawArguments, js:str});
        return msg;
    }
    return a;
    /*if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    switch (typeof a) {
        default: case 'symbol': case 'object': case 'function':
            (window as any).Log.exx("M2T/Handlebars #ifCond helper error, "+(typeof a)+" cannot be compared in an expression", {
                expressionRaw: [...rawArguments].join(''), wrongParameterIndex: i
            });
            return NaN; // because nan always fails every comparison
        case 'string': return '"'+(window as any).U.replaceAll(a, '"', '\\"')+'"';
        case 'number': case 'boolean': return a;
    }
    */
}

Handlebars.registerHelper('js', handlebarsJs);
Handlebars.registerHelper('JS', handlebarsJs);
Handlebars.registerHelper('Js', handlebarsJs);
Handlebars.registerHelper('ifCond', handlebarsIfCond);
Handlebars.registerHelper('ifcond', handlebarsIfCond);
Handlebars.registerHelper('ifc', handlebarsIfCond);
Handlebars.registerHelper('ifC', handlebarsIfCond);
Handlebars.registerHelper('iff', handlebarsIfCond);


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
/*
function afterStoreLoad() {
    stateInitializer();
}

// afterStoreLoad();
setTimeout( afterStoreLoad, 0);
*/