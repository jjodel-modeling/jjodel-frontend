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
    LClass, LEnumerator, LEnumLiteral, LModel, LModelElement, LObject,
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


function doT2M(data: LPointerTargetable | Pointer, language: string, text: string): void{
    let ldata = LPointerTargetable.from(data);
    if (!ldata) return;
    let json = JSON.parse(text);
    console.log('doT2M json', {ldata, text, json});
    (ldata as LObject).t2m(json);
}
function doM2T(data: LPointerTargetable | Pointer, language: string): string{
    let ldata = LPointerTargetable.from(data);
    if (!ldata) return '';
    return 'M2T todo';
}

export function T2M(props: T2M_AllProps, child?: any) {
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

export function M2T(props: M2T_AllProps){
    // @ts-ignore
    if (typeof data === 'object' && !(data as any).__isProxy) return M2T_Component(...arguments as any);

    return 'M2T todo'
}
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