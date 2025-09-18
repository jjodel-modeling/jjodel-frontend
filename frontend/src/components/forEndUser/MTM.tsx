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
    store,
    U,
    UX
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';
import { Tooltip } from './Tooltip';
import Editor from "@monaco-editor/react";
import {on} from "events";


export function doT2M(data0: LPointerTargetable | Pointer | null | undefined, language: string, text0: string): void{
    let data: LModelElement = LPointerTargetable.from(data0 as any);
    let text: string = text0 = text0.trim();
    if (!data || !text0) return;
    // text = U.jsonSanitize_dangerous(text);
    let json: GObject = null as any;
    if (language) {
        let languageObj = store.getState().languages[language];
        if (languageObj) {
            if (!languageObj.t2m) {
                Log.ee("T2M transformation is missing on language \"" + language + "\".");
                return;
            }

            let t2m = "("+languageObj.t2m+")"; // because "function(text){return "a"}" is invalid without a function name unless i wrap it in parenthesis and turn into expression.
            let func = eval(t2m);
            if (typeof func !== 'function') {
                Log.ee('The T2M transformation of "'+language+'" must be a parser function, please change the language definition.');
                return;
            }
            json = func(text);
            let type: string = typeof json;
            if (!json && type === 'object') type = 'null';
            if (type !== 'object') {
                Log.ee('The T2M transformation of "'+language+'" must be a parser function returning a plain object, but returned "'+(type)+'" instead.' +
                    '\nPlease change the language definition.');
                return;
            }
        }
    }
    if (!json) {
        try { json = JSON.parse(text); } catch (e) {
            Log.ee('The default T2M transformation can only be applied to text in JSON format.', {e, text, data});
        }
    }
    console.log('doT2M json', {data, text, json});
    let className = data.className;
    if (!(data as LObject).t2m) {
        Log.ee("The T2M transformation cannot be applied yet to " + className + " elements.", {className, json, data, language});
        return;
    }
    (data as LObject).t2m(json);
}


export function doM2T(data0: LPointerTargetable | Pointer | null | undefined, language: string): string{
    let data = LPointerTargetable.from(data0 as any);
    if (!data) return "M2T transformation to "+language+" is missing the model (data) parameter.";
    // text = U.jsonSanitize_dangerous(text);
    let ret: string = '';
    if (language) {
        let languageObj = store.getState().languages[language];
        if (languageObj) {
            if (!languageObj.m2t) return "M2T transformation is missing on language \""+language+"\".";
            let m2t = "("+languageObj.m2t+")"; // because "function(text){return "a"}" is invalid without a function name unless i wrap it in parenthesis and turn into expression.
            try { let func = eval(m2t);} catch(e) { console.error("m2t error", {e, m2t, languageObj}); }
            let func = eval(m2t);
            if (typeof func !== 'function') {
                let msg = 'The M2T transformation of "'+language+'" must be a parser function, please change the language definition.';
                Log.ee(msg);
                return msg;
            }
            ret = func(data);
            let type: string = typeof ret;
            if (type !== 'string') {
                let msg = 'The M2T transformation of "'+language+'" must be a parser function returning a plain object, but returned "'+(type)+'" instead.' +
                    '\nPlease change the language definition.';
                Log.ee(msg);
                return msg;
            }
        }
    }
    if (!ret) ret = (data as any).__serialize;
    return ret;
}

export function T2M(data: LModelElement, language: string, text: string) {
    if (!data) return null;
    // @ts-ignore
    if (typeof data === 'object' && !(data as any).__isProxy) return T2M_Component(...arguments as any);
    // @ts-ignore
    else return T2M_API(...arguments as any);

}
export function T2M_API(data: LModelElement, language: string, text: string): void{
    console.error('T2M_API todo');
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
    return 'M2T_API todo'
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