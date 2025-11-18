import React, {Dispatch, KeyboardEvent, LegacyRef, ReactElement, ReactNode, useRef} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Any,
    Defaults,
    DObject,
    DPointerTargetable,
    GObject,
    Keystrokes, L, LAttribute,
    LClass, LEnumerator, LEnumLiteral, LModel, LModelElement, LObject, Log,
    LPointerTargetable, LReference, LStructuralFeature, LValue, MultiSelect, MultiSelectOptGroup,
    MultiSelectOption,
    Overlap,
    Pointer, PrimitiveType, Selectors,
    store, transientProperties,
    U,
    UX,
    windoww
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';
import { Tooltip } from './Tooltip';
import Editor from "@monaco-editor/react";
import {on} from "events";
import {Nearley} from "../../DSL/nearley/nearley";
import {LanguageCache, ParserData} from "../../joiner/classes";
import Handlebars from "handlebars";


export function parseT2M(language: string, text0: string, canThrow: boolean = false): GObject | null{
    let text: string = text0 = text0?.trim();
    let LOG = canThrow ? Log.exx : Log.ee;
    if (!text) { LOG('doT2M: missing text'); return null; }
    if (!language) language = 'eCore/JSON';
    // text = U.jsonSanitize_dangerous(text);
    let ret: GObject = null as any;

    let s = store.getState();
    if (!(language in s.languages)) {
        let msg = 'M2T error, language "'+language+'" does not exist.';
        LOG(msg);
        return null;
    }
    let languageObj = s.languages[language].t2m;
    if (!languageObj) {
        let msg = 'M2T error, language "'+language+'" does not have a T2M transformation.';
        LOG(msg);
        return null;
    }
    let engine = languageObj.engine || 'javascript';

    let func_str = languageObj[engine]?.str;
    if (!func_str) {
        LOG("T2M transformation is missing on language \""+language+"\" for the engine \""+engine+"\".", {languageObj});
        return null;
    }

    switch (engine) {
        default:
            LOG('T2M transformation failed, unsupported parser: ' + languageObj.engine, {language, parser:languageObj.engine, languageObj});
            return null;
        case 'nearley':
            let tl = transientProperties.language[language];
            if (!tl) transientProperties.language[language] = tl = {};
            let te = transientProperties.language[language][engine];
            if (!te) transientProperties.language[language][engine] = te = new LanguageCache();
            let grammar = te.grammar;
            if (!grammar) { te.grammar = grammar = Nearley.compileGrammar(languageObj[engine].str) as any; }
            if (!grammar) return null;
            ret = Nearley.parse(grammar, text0);
            if (ret) ret = ret[0];
            break;
        case undefined:
        case 'javascript':
            let t2m = "("+func_str+")";  // because "function(text){return "a"}" is invalid without a function name unless i wrap it in parenthesis and turn into expression.
            let func = eval(t2m);
            if (typeof func !== 'function') {
                LOG('The T2M transformation of "'+language+'" must be a parser function, please change the language definition. found instead:'+(typeof func), {ret:func});
                return null;
            }
            ret = func(text);

            if (typeof ret !== 'object') {
                LOG('The T2M transformation of "'+language+'" must be a parser function returning a plain object.' +
                    '\nPlease change the language definition.', {ret, language, languageObj, func_str, func, text, text0});
                return null;
            }
            break;
    }

    let type: string = typeof ret;
    if (!ret && type === 'object') type = 'null';
    if (type !== 'object') {
        LOG('The T2M transformation of "'+language+'" must be a parser function returning a plain object, but returned "'+(type)+'" instead.' +
            '\nPlease change the language definition.', {ret, type, language, languageObj, func_str});
        return null;
    }
    if (!ret) {
        try { ret = JSON.parse(text); }
        catch (e) { LOG('The default T2M transformation can only be applied to text in JSON format.', {e, text}); return null; }
    }
    return ret;
}
windoww.parseT2M = parseT2M;
let notFragments: ParserData = null as any;

export function doM2T(data0: LPointerTargetable | Pointer | null | undefined, language: string): string{
    let data: LModelElement = LPointerTargetable.from(data0 as any);
    if (!data) return "M2T transformation to "+language+" is missing the model (data) parameter.";
    // text = U.jsonSanitize_dangerous(text);
    let ret: string = '';
    if (!language) { language = 'eCore/JSON'; }
    let s = store.getState();
    if (!(language in s.languages)) {
        let msg = 'M2T error, language "'+language+'" does not exist.';
        Log.ee(msg);
        return msg;
    }
    let languageObj = s.languages[language].m2t;
    if (!languageObj) {
        let msg = 'M2T error, language "'+language+'" does not have a m2t transformation.';
        Log.ee(msg);
        return msg;
    }

    let engine = languageObj.engine || 'javascript';

    let m2tobj = languageObj[engine];
    let allowPartials = m2tobj.allowPartials;
    let func_str: string = m2tobj[allowPartials ? data.className.substring(1) : '__str'];

    if (!func_str) {
        let msg = "M2T transformation"+(allowPartials ? ' for ' + data.className.substring(1) : '')+" is missing on language \""+language+"\" for the engine \""+engine+"\".";
        Log.ee(msg);
        return msg;
    }

    if (data.className !== 'DModel') {
        let langObj = s.languages[language];
        let allowPartial = langObj.m2t[engine].allowPartials;
        if (!allowPartial) {
            let msg = 'The language ' + language+' with engine ' + engine + ' does not allow partial serializations.\n' +
                'Call the serialization from the root model.';
            Log.ee(msg);
            return msg;
        }
    }

    let func: (model: LModelElement)=>string = ()=> '';

    console.log('dom2t', {data0, language, languageObj});
    switch (engine) {
        default:
            let msg = 'M2T transformation failed, unsupported parser: ' + engine;
            Log.ee(msg, {language, engine, languageObj, data0});
            return msg;
        case undefined:
        case 'handlebars':
            for (let name in m2tobj) {
                if (!notFragments) notFragments = {...new ParserData(), 'clonedCounter':0};
                if (name in notFragments) continue;
                Handlebars.registerPartial(name, m2tobj[name]);
            }
            let template: (obj: GObject, options?: RuntimeOptions) => string = ()=>'missing handlebars template';
            try { template = Handlebars.compile(func_str); }
            catch (e: any) {
                console.error(e);
                let msg = e?.message+'';
                if (msg.includes('doesn\'t match ')) msg+='\ntip: did you forget a # sign before commands such as {{#if}}?'
                template = () => msg;
            }
            console.log('handlebars 2', {func_str, template});
            try { ret = template(data, {allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true, allowedProtoProperties: {__proto__:true}}); }
            catch (e: any) {
                let msg = (e?.message||'')+'';
                if (msg.indexOf('Error: Parse error')<=2) {
                    if (msg.includes('ifcond')) msg+='\ntip: ifcond usage example: {{#ifCond var1 \'==\' var2}}...{{/ifcond}}'
                }
                ret = msg;
            }
            // cleanup
            for (let name in m2tobj) {
                if (name in notFragments) continue;
                Handlebars.unregisterPartial(name);
            }
            // Handlebars.partials = {}; // unofficial fallback to make sure i erase all partials
            console.log('handlebars 3', {func_str, template, ret});
            return ret;

        case 'javascript':
            let m2t = "("+func_str+")"; // because "function(text){return "a"}" is invalid without a function name unless i wrap it in parenthesis and turn into expression.
            try { func = eval(m2t); } catch (e) { Log.ee("M2T error", {e, m2t, language, engine, func_str, languageObj}); return "M2T transformation failed, check the logger for more info."; }
            if (typeof func !== 'function') {
                let msg = 'The M2T transformation of "'+language+'" must be a serializer function, please change the language definition.';
                Log.ee(msg);
                return msg;
            }
            ret = func(data);
            break;
    }

    let type: string = typeof ret;
    if (type !== 'string') {
        let msg = 'The M2T transformation of "'+language+'" must be a serializer function returning a plain object, but returned "'+(type)+'" instead.' +
            '\nPlease change the language definition.';
        Log.ee(msg, {ret, func});
        return msg;
    }
    if (!ret) ret = (data as any).__serialize;
    return ret;
}

export function T2M(data: LModelElement, language: string, text: string) {
    if (!data) return null;
    // @ts-ignore
    if (typeof data === 'object' && !(data as any).__isProxy) return T2M_Component(...arguments as any);
    else return T2M_API(data, language, text);

}
export function T2M_API(data: LModelElement, language: string, text: string): void{ return doT2M(data, language, text); }

export function doT2M(data0: LPointerTargetable | Pointer | null | undefined, language: string, text: string): void {
    console.log('doT2M', {data0, language, text});
    if (!text) return;
    if (typeof (text as unknown) !== 'string') { Log.ee('T2M transformation called with an object instead of text', {text, data:data0, language}); return; }
    if (!DPointerTargetable.isD(data0)) { Log.ee('T2M transformation must be called on a modelling element, found instead: ' + typeof data0, {element:data0, text, language}); return; }
    let data: LModelElement = LPointerTargetable.from(data0 as any);
    let className = data.className;
    if (className !== 'DModel') {
        let langObj = store.getState().languages[language];
        let allowPartial = langObj.t2m[langObj.t2m.engine].allowPartials;
        if (!allowPartial) {
            Log.ee('The language ' + language+' with engine ' + langObj.t2m.engine + ' does not allow partial transformations.\n' +
                'Apply the transformation at the root model instead.');
            return;
        }
    }
    let ret: GObject = parseT2M(language, text) as any;
    if (!ret) return;
    console.log('doT2M json', {data, text, ret});
    if (!(data as LObject).t2m) {
        Log.ee("The T2M transformation cannot be applied yet to " + className + " elements.", {className, ret, data, language});
        return;
    }
    (data as LObject).t2m(ret);
}


export function T2M_Component(props: T2M_AllProps, child?: any): ReactNode {
    const data: LPointerTargetable = L.from(props.data as any);
    const language = props.language || 'JSON';
    console.log('T2M render called', {data, language, arguments});
    let debug = true;
    function onBlur(e: Event){
        props.onChange?.(e);
        props.onBlur?.(e);
        let value = (e.target as HTMLElement).innerText;
        doT2M(data, props.language, value);
    }
    let rootProps: GObject = {...props};
    delete rootProps.setter;
    delete rootProps.getter;
    rootProps.tabIndex = rootProps.tabIndex || 0;
    rootProps.onBlur = onBlur;

    if (debug) {
        let children = props.children || child;
        return <div className={'t2m' + (props.className||'')} contentEditable={true} {...rootProps}>{children}</div>;
    }
    return 'todo'
}
export function T2M_WithEditor(props: T2M_AllProps, child?: any) {
    const [oldValue, setOldValue] = useStateIfMounted<string>('');
    let [value, setValue] = useStateIfMounted<string>(oldValue);
    const [isTouched, setIsTouched] = useStateIfMounted(false);

    // @ts-ignore
    if (!(typeof props === 'object' && !(props as any).__isProxy)) return T2M_Direct(...arguments as any);

    const data: LPointerTargetable = L.from(props.data as any);
    const getter = props.getter;
    const setter = props.setter;
    const language = props.language || 'JSON';

    let debug = true;
    if (debug) {
        let children = props.children || child;
        return children;
    }
    if (!((data) || (getter && setter))) return(<>Either props.data or both getter & setter are required in T2M.</>);

    function valueDidChange(v1: any, v2: any): boolean {
        // return serializeValue(v1) !== serializeValue(v2);
        return v1 !== v2;
        // todo: maybe instead of comparing the strings, which might differ from comments or whitespaces,
        //  confront the JSON result of applying the language parser to the text.
    }


    let readOnly: boolean;
    if (props.readOnly !== undefined) readOnly = props.readOnly;
    // else if (props.disabled !== undefined) readOnly = props.disabled;
    else readOnly = Defaults.check((data)?.id)

    const onDoubleClick = (evt: React.MouseEvent<HTMLInputElement>) => { // fully select the text
        evt.preventDefault();
        evt.stopPropagation();
        console.warn('input dblclick', {t:evt.target, evt}); //, ets:(evt.target as HTMLInputElement).select()};
        (evt.target as HTMLInputElement).select();
    }

    const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        (props as any).onChange?.(evt);
        if (readOnly) return;

        console.log("setValue", {value, nv: getValueFromEvent(evt), evt, ev: evt.target.value});
        setValue(getValueFromEvent(evt));
        setIsTouched(true);     // I'm editing the element in my local state.
        // the actual set is done in onBlur
    }
    const getValueFromEvent = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) => {
         return value; // evt.target.innerText;
    }


    const onBlur = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) => {
        (props as any).onBlur?.(evt);
        confirmValue(evt, getValueFromEvent(evt));
    }
    const confirmValue = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }|undefined, val: string) => {
        if (readOnly) return;
        const newValue = val;
        const _oldValue: any = getter ? getter(data, language) : oldValue;
        console.log("onChange confirm", {evt, newValue, _oldValue, data, changed: valueDidChange(newValue, oldValue), readOnly, language, setter});
        if (valueDidChange(newValue, _oldValue)){
            if (setter) setter(newValue as any, data, language);
            else {
                doT2M(data, language, newValue);
            }
        }
        // I terminate my editing, so I communicate it to other <Input /> that render the same field.
        setIsTouched(false);
    }

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.children;

    let cursor: string | undefined;
    if (readOnly) cursor = 'not-allowed';

    let style: GObject = props.style || {};
    if (cursor && !style.cursor) { style.cursor = cursor; }

    /*let rootkeys = new Set(...Object.keys(rootprops));
    //  merge events: might want to distinguish which events are merged between root and input and which not.
    //  onChange surely needs merge. onMouseHover might not to let it trigger on label too.
    for (let k of rootkeys) {
        if (!(k[0] === 'o' && k[1] === 'n' && k[2] && k[2].toUpperCase() === k[2])) continue;
        if (inputProps[k]) inputProps[k] = function(...a:any) { inputProps[k](arguments); rootprops[k](arguments); }
        else inputProps[k] = rootprops[k];
        delete rootprops[k];
    }*/


    return <label className={'input-container t2m ' + (props.className || '')} {...otherprops} style={style}>
        <Editor options={{readOnly:!!props.readOnly}} value={value} />
    </label>;
}

export function M2T(data: LModelElement, language: string){
    if (!data) return null;
    // @ts-ignore
    if (typeof data === 'object' && !(data as any).__isProxy) return M2T_Component(...arguments as any);
    // @ts-ignore
    else return M2T_API(...arguments as any);
}

export function M2T_Component(props: M2T_AllProps): ReactNode{
    return 'M2T_Component todo'
}
export function M2T_API(data: LModelElement, language: string): string{
    return doM2T(data, language);
}

(window as any).M2T = M2T;
(window as any).T2M = T2M;

export interface T2M_OwnProps {
    data?: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    language: string;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    getter?: (data: any/*LPointerTargetable*/, language: string) => string | boolean | undefined;
    setter?: (text: string|boolean, data: any, language: string) => void;
    className?: string;
    style?: GObject;
    readOnly?: boolean;
    key?: React.Key | null;
    placeholder?: string;
    onChange?: (e: Event)=>void;
    onBlur?: (e: Event)=>void;
    onKeyPress?: (e: Event)=>void;
    children?: ReactNode;
}
export interface M2T_OwnProps extends T2M_OwnProps{

}


interface T2M_StateProps { }
interface M2T_StateProps { }

interface DispatchProps { }
type T2M_AllProps = Overlap<T2M_OwnProps, Overlap<T2M_StateProps, DispatchProps>>;
type M2T_AllProps = Overlap<M2T_OwnProps, Overlap<M2T_StateProps, DispatchProps>>;

// @ts-ignore
T2M.cname = 'T2M';
// @ts-ignore
M2T.cname = 'M2T';