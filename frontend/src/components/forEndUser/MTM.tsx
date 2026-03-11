import React, {Dispatch, KeyboardEvent, LegacyRef, ReactElement, ReactNode, useRef} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Any,
    Defaults, Dictionary,
    DObject,
    DPointerTargetable,
    GObject,
    Keystrokes, L, LAttribute,
    LClass, LEnumerator, LEnumLiteral, LModel, LModelElement, LObject, Log,
    LPointerTargetable, LReference, LStructuralFeature, LValue, MultiSelect, MultiSelectOptGroup,
    MultiSelectOption,
    Overlap,
    PrimitiveType, Selectors,
    store, transientProperties,
    U,
    UX,
    windoww,
    Pointer
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';
import { Tooltip } from './Tooltip';
import Editor from "@monaco-editor/react";
import {on} from "events";
import {Nearley} from "../../DSL/nearley/nearley";
import {LanguageCache, notLanguageFragments, ParserData, GenericProps} from "../../joiner";
import Handlebars from "handlebars";
import {getLanguageCache} from "../editors/MTM";
import {Ohm} from "../../DSL/ohm";
import {Eta, EtaConfig} from "eta";


export function parseT2M(language: string, text0: string, canThrow: boolean = false,
                         errOutput?: {msg?:string, e?: GObject},
                         s?: DState, className: string = ''): GObject | null {
    let LOG = canThrow ? Log.exx : Log.ee;
    let text: string = text0 = text0?.trim();
    if (!text) { LOG('doT2M: missing text'); return null; }
    if (className && className[0] === 'D') className = className.substring(1);
    if (!language) language = 'eCore/JSON';
    if (!s) s = store.getState();
    // text = U.jsonSanitize_dangerous(text);
    let ret: GObject = null as any;
    let msg: string; // error message
    if (!(language in s.languages)) {
        LOG(msg = 'M2T error, language "'+language+'" does not exist.');
        if (errOutput) errOutput.msg = msg;
        return null;
    }
    let languageObj = s.languages[language].t2m;
    if (!languageObj) {
        LOG(msg = 'M2T error, language "'+language+'" does not have a T2M transformation.');
        if (errOutput) errOutput.msg = msg;
        return null;
    }
    let engine = languageObj.engine || 'javascript';
    let allowPartials =  languageObj[engine].allowPartials;
    let func_str: string;
    if (!allowPartials){
        func_str = languageObj[engine]?.__str;
        if (!func_str) {
            LOG(msg = "T2M transformation is missing on language \""+language+"\" for the engine \""+engine+"\".", {languageObj});
            if (errOutput) errOutput.msg = msg;
            return null;
        }
    }
    function getMonoliticGlobalFunc(): string | null {
        func_str = languageObj[engine]?.__str;
        if (func_str) return func_str;
        if (func_str) LOG(msg = "T2M transformation is missing on language \""+language+"\" for the engine \""+engine+"\".", {languageObj});
        if (errOutput) errOutput.msg = msg;
        return null;
    }

    let getPartials = ()=> {
        let fragments: Dictionary<string, string> = {};
        for (let k in languageObj[engine]) {
            if (k in notLanguageFragments || k === '+' || k === '__str') continue;
            let v = languageObj[engine][k]?.trim();
            if (v) fragments[k] = v;
        }
        return fragments;
    }
    switch (engine) {
        default:
            LOG(msg = 'T2M transformation failed, unsupported parser: ' + languageObj.engine, {language, parser:languageObj.engine, languageObj});
            if (errOutput) errOutput.msg = msg;
            return null;
        case 'ohm':
            let cache = getLanguageCache(language, engine);
            let [def, sem] = (getMonoliticGlobalFunc() || '').split('╗').map(e=>e?.trim());
            let semObj: GObject = {};
            sem = '('+sem+')';
            let ohm = new Ohm(def);
            if (sem) try {
                semObj = eval(sem);
                if (typeof semObj === 'function') semObj = semObj();
            } catch (e) {
                Log.ee('Invalid semantic in ohm "'+ language +'" transformation.', {e, sem});
                // return null;
            }
            if (typeof semObj !== 'object') {
                Log.ee('Invalid semantic "' + typeof semObj + '" in ohm, semantic must be an object or a function returning an object.', {semObj, sem});
                // return null;
            }
            else ohm.addSemantics(semObj);
            try { ret = ohm.parse(text0); }
            catch (e) {
                console.error('T2M ohm error: ', {ret, text0, e});
                return null;
            }
            // ret = ret?.ast?.() || ret;
            console.log('ohm ret', {ret})
            break;
        case 'nearley':
            let te = getLanguageCache(language, engine);
            let grammar = te.negrammar;
            if (!grammar) {
                if (allowPartials) {
                    let fragments = getPartials();
                    te.negrammar = grammar = Nearley.compileGrammar(fragments) as any;
                }
                else {
                    func_str = getMonoliticGlobalFunc() as any;
                    if (!func_str) return null;
                    te.negrammar = grammar = Nearley.compileGrammar(func_str) as any;
                }
            }
            if (!grammar) return null;
            ret = Nearley.parse(grammar, text0);
            Log.w(ret.length > 1, "Nearley grammar for "+language+" is ambiguous, it returned "+ret.length+" distinct valid parsings.", {ret, text0});
            if (ret) ret = ret[0];
            break;
        case undefined:
        case 'javascript':
            if (allowPartials) {
                // Log.eDevv(language+' T2M with partials is not supported yet, please disable the checkbox.');
                let fragments = getPartials();
                let str = '';
                let mapnames: Dictionary<string, string> = {};
                for (let name0 in fragments) {
                    let code = fragments[name0];
                    if (!code) continue;
                    // filter name to be a valid identifier.
                    // 1) whitespaces become "_".
                    // 2) invalid characters are removed.
                    // 3) multiple "___" are condensed into a single "_".
                    // 4) if the transformations are causing 2 names to collide or become empty, "_1" is appended.
                    // 5) if the conflict persists, the final number is increased as much as necessary.
                    let name = name0.replace(/\s/gmi, '_').replace(/[^a-z0-9_$]/gmi, "").replace(/_+/gmi, '_');
                    while (U.isNumericString(name[0], false)) name = name.substring(1);
                    if (!name) {
                        name += '_1'
                    }
                    if (name in mapnames) name = U.increaseEndingNumber(name, false, false, (s)=> (s in mapnames));
                    mapnames[name] = name0;
                    code =  '(' + code + ')';
                    try { new Function(code); }
                    catch (e: any) {
                        LOG('Invalid t2m fragment syntax "'+name0+" for " + language + " transformations.\n" + e.message, e);
                        code = "function (txt) { Log.ee(`"+e.message+"`); return null; }";
                    }
                    str += 'let ' + name + ' = ' + code + ';\n';
                }
                let funcname = className in fragments ? className : 'Default';
                func_str = "function (txt) {\n" + str + "\n return "+funcname+"(txt); }";
            } else {
                func_str = getMonoliticGlobalFunc() as any;
            }
            if (!func_str) return null;
            let t2m = "("+func_str+")";  // because "function(text){return "a"}" is invalid without a function name unless i wrap it in parenthesis and turn into expression.
            try {
                let func = eval(t2m);
                if (typeof func !== 'function') {
                    LOG(msg = 'The T2M transformation of "'+language+'" must be a parser function, please change the language definition. found instead:'+(typeof func), {ret:func});
                    if (errOutput) errOutput.msg = msg;
                    return null;
                }
                try {
                    ret = func(text);
                } catch (e: any) {
                    LOG(msg = 'T2M transformation of "'+language+'" failed:\n'+e.message, {e, func_str});
                    return null;
                }
            } catch (e: any) {
                LOG('Invalid t2m syntax for ' + language + " transformations.\n" + e.message, e);

                return null;
            }

            if (typeof ret !== 'object') {
                LOG(msg = 'The T2M transformation of "'+language+'" must be a parser function returning a plain object.' +
                    '\nPlease change the language definition.', {ret, language, languageObj, func_str, text, text0});
                if (errOutput) errOutput.msg = msg;
                return null;
            }
            break;
    }

    let type: string = typeof ret;
    if (!ret && type === 'object') type = 'null';
    if (type !== 'object') {
        LOG(msg = 'The T2M transformation of "'+language+'" must be a parser function returning a plain object, but returned "'+(type)+'" instead.' +
            '\nPlease change the language definition.', {ret, type, language, languageObj});
        if (errOutput) errOutput.msg = msg;
        return null;
    }
    if (!ret) {
        try { ret = JSON.parse(text); }
        catch (e: any) {
            LOG( msg = 'The default T2M transformation can only be applied to text in JSON format.', {e, text});
            if (errOutput) { errOutput.msg = msg; errOutput.e = e; }
            return null; }
    }
    return ret;
}
windoww.parseT2M = parseT2M;

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
    let langObj = s.languages[language];
    let allowPartial = langObj.m2t[engine].allowPartials;

    if (data.className !== 'DModel' && !allowPartial) {
        let msg = 'The language ' + language+' with engine ' + engine + ' does not allow partial serializations.\n' +
            'Call the serialization from the root model.';
        Log.ee(msg);
        return msg;
    }

    let func_str: string;
    let fragmentName: string = '';
    if (allowPartials) {
        func_str = m2tobj[fragmentName = data.className.substring(1)];
        if (!func_str) {
            func_str = m2tobj[fragmentName = fragmentName.toLowerCase()];
        }
        if (!func_str) {
            func_str = m2tobj[fragmentName = 'Default'];
        }
        if (!func_str) {
            func_str = m2tobj[fragmentName = 'default'];
        }
    } else {
        func_str = m2tobj.__str;
    }

    if (!func_str) {
        let msg = "M2T transformation"+(allowPartials ? ' for ' + data.className.substring(1) : '')+" is missing on language \""+language+"\" for the engine \""+engine+"\".";
        Log.ee(msg);
        return msg;
    }
    let func: (model: LModelElement)=>string = ()=> '';

    console.log('dom2t', {data0, language, languageObj});
    switch (engine) {
        default:
            let msg = 'M2T transformation failed, unsupported parser: ' + engine;
            Log.ee(msg, {language, engine, languageObj, data0});
            return msg;
        case undefined:
        case 'eta':
            let eta_str: string = '';
            if (allowPartials) for (let name in m2tobj) {
                if (name in notLanguageFragments) continue;
                let v = m2tobj[name]?.trim();
                // if (v) ETA.registerPartial(name, v);
                eta_str += v;
            }
            let eta_template = (obj: GObject, config?: Partial<EtaConfig>)=> new Eta(config).renderString(eta_str, obj);
            console.log('handlebars 2', {func_str, eta_template});
            try { ret = eta_template(data); }
            catch (e: any) {
                ret = e.message;
            }
            // cleanup
            /*for (let name in m2tobj) {
                if (name in notFragments) continue;
                Handlebars.unregisterPartial(name);
            }*/
            // Handlebars.partials = {}; // unofficial fallback to make sure i erase all partials
            console.log('eta m2t', {func_str, eta_template, ret});
            return ret;
        case 'handlebars':
            if (allowPartials) for (let name in m2tobj) {
                if (name in notLanguageFragments) continue;
                let v = m2tobj[name]?.trim();
                if (v) Handlebars.registerPartial(name, v);
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
                let errorFragment: string = e.stack.split('\n')
                    .map((e: string) => (e.indexOf('[as ') < 0 ? '' : e.match(/\[as (.*)\]/)?.[1]))
                    .filter((e: string)=>!!e)[0]; // topmost result is deepest stack entry (most recent call), other are ancestors of errored fragment calling it.
                console.error('m2t error', {e, fragmentName, errorFragment});
                let msg = (e?.message||'')+'';
                if (msg.indexOf('Error: Parse error')<=2) {
                    if (msg.includes('ifcond')) msg+='\ntip: ifcond usage example: {{#ifCond var1 \'==\' var2}}...{{/ifcond}}';
                    msg = 'Fragment "'+errorFragment+'" ' + msg;
                }
                ret = msg;
            }
            // cleanup
            /*for (let name in m2tobj) {
                if (name in notFragments) continue;
                Handlebars.unregisterPartial(name);
            }*/
            // Handlebars.partials = {}; // unofficial fallback to make sure i erase all partials
            console.log('handlebars 3', {func_str, template, ret});
            return ret;

        case 'javascript':
            console.error('eval m2t js', func_str);
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
    let s: DState = store.getState();
    let langObj = s.languages[language];
    if (className !== 'DModel') {
        let allowPartial = langObj.t2m[langObj.t2m.engine].allowPartials;
        if (!allowPartial) {
            Log.ee('The language ' + language+' with engine ' + langObj.t2m.engine + ' does not allow partial transformations.\n' +
                'Apply the transformation at the root model instead.');
            return;
        }
    }
    let ret: GObject = parseT2M(language, text, false, undefined, s, className) as any;
    if (!ret) return;
    if (Array.isArray(ret)) {
        if (ret.length === 1) ret = ret[0];
        else Log.ee('T2M returned an array instead of an object', {ret, data, language});
    }
    console.log('doT2M json pre', {data, text, ret:JSON.parse(JSON.stringify(ret))});
    if (!(data as LObject).t2m) {
        Log.ee("The T2M transformation cannot be applied yet to " + className + " elements.", {className, ret, data, language});
        return;
    }
    (data as LObject).t2m(ret);
}


export function T2M_Component(props: T2M_AllProps, child?: any): ReactNode {
    const data: LPointerTargetable = L.from(props.data as any) || L.fromPointer(props.dataid);
    const language = props.language || 'JSON';
    console.log('T2M render called', {data, language, arguments});
    let debug = true;
    function onBlur(e: any){
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

export interface T2M_OwnProps extends GenericProps{
    data?: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    language: string;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    getter?: (data: any/*LPointerTargetable*/, language: string) => string | boolean | undefined;
    setter?: (text: string|boolean, data: any, language: string) => void;
    readOnly?: boolean;
    placeholder?: string;
}
export interface M2T_OwnProps extends T2M_OwnProps{

}


interface T2M_StateProps { }
interface M2T_StateProps { }
interface InjectProps {
    dataid: Pointer<LModelElement>;
}

interface DispatchProps { }
type T2M_AllProps = Overlap<InjectProps, Overlap<T2M_OwnProps, Overlap<T2M_StateProps, DispatchProps>>>;
type M2T_AllProps = Overlap<InjectProps, Overlap<M2T_OwnProps, Overlap<M2T_StateProps, DispatchProps>>>;

// @ts-ignore
T2M.cname = 'T2M';
// @ts-ignore
M2T.cname = 'M2T';
T2M_Component.cname = 'T2M_Component';
M2T_Component.cname = 'M2T_Component';



