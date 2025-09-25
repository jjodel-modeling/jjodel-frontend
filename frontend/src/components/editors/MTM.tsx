import type * as monaco from "monaco-editor";
import {
    DataOutputComponent,
    DState, GObject,
    Input, L,
    Language,
    LPointerTargetable,
    Overlap,
    Pointer,
    SetRootFieldAction,
    store,
    TRANSACTION, U
} from "../../joiner";
import {Dictionary, FakeStateProps, windoww} from "../../joiner/types";
import React, {Dispatch, JSX, useState} from "react";
import {connect} from "react-redux";
import {DModelElement, LModelElement} from "../../model/logicWrapper";
import './mtm.scss';
import {JsEditor} from "./languages";
import Editor, {EditorProps} from "@monaco-editor/react";
import {AT_TRANSACTION} from "../../redux/action/action";
import {doM2T, doT2M} from "../forEndUser/MTM";
import {Btn, CommandBar} from "../commandbar/CommandBar";
import {hideMetrics} from "../metrics/Metrics";

const monacooptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 12,
    scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5},
    minimap: {enabled: false},
    readOnly: false
};

let lastID: Pointer | undefined = undefined;
export function T2MEditor(props: EditorProps & {onBlur?: (value: string|undefined, evt: Event) => void}){
    let [value, setValue] = useState(props.value);
    let [oldValue, setOldValue] = useState(value);
    function onBlur(evt: any){
        if (oldValue === value) return;
        props.onChange?.(value, evt);
        props.onBlur?.(value, evt);
        setOldValue(value);
    }
    return (
        <div tabIndex={-1} className={'monaco-editor-wrapper'} style={{overflow:'hidden'}} onBlur={onBlur}>
            <Editor {...props} className={props.className} options={{...monacooptions, ...(props.options||{})}} value={props.value}
                defaultLanguage={undefined /*'javascript'*/}
                beforeMount={(editor)=>{
                    /*editor.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                        noSemanticValidation: true,
                        noSyntaxValidation: true,
                    });*/
                }}
                onChange={(value)=>{setValue(value)}} />
        </div>)
}

export function MTMComponent(props: AllProps): JSX.Element{
    // let groups={'Metamodelers':{}, 'Modelers':{}, 'Language designer':{}, 'Concrete Syntax designer':{}};
    // let groupsarr = Object.keys(groups);
    let languages = props.languages;
    let [editor, setEditor] = useState<boolean>(false);
    let [language, setLanguage] = useState('JSON');

    if (editor) return M2TEditor(props, language, setEditor, setLanguage);
    let languageObj = languages[language];
    if (!languageObj) {
        language = 'JSON';
        languageObj = languages[language];
    }
    //let m2t = languageObj.m2t;
    //let t2m = languageObj.t2m;
    let m2t_result: string;
    if (props.data) try {
        m2t_result = doM2T(props.data, language);
    } catch (e) {
        console.error(e);
        m2t_result = "M2T transformation failed, check the language definition.";
    } else m2t_result = 'Cannot perform a language transformation on the current selection.\nPlease select a Model Element.'

    function New(){
        let name = U.increaseEndingNumber('My Language', false, false, (n)=> !!languages[n]);
        TRANSACTION('new language "'+name+'"', ()=> {
            SetRootFieldAction.new('languages.'+name, new Language(), '', false)
            AT_TRANSACTION( ()=> {
                setLanguage(name);
                setEditor(true);
            });

        })
    }
    return <section className={'w-100 h-100 p-2 MTM-tab'}>
        {/*<h1 className={"rightbar-title"}>Model → Text → Model</h1>*/}
        <h1 className={"rightbar-title"}>Languages (T2M, M2M, M2T)</h1>
        <label className={'d-flex'} style={{flexWrap: 'wrap'}}>
            <span className={'my-auto'}>Language&nbsp;</span>
            <select className={'my-auto'} onChange={(e) => setLanguage(e.target.value)} value={language}>
                <optgroup label={"languages"}>{
                    Object.keys(languages).map(k=><option value={k}>{k}</option>)
                }</optgroup>
            </select>
            <label onClick={() => setEditor(true)} className='my-auto d-flex ms-3' style={{cursor: 'pointer'}}>
                <i className="bi bi-pencil-square my-auto"/><span className={'my-auto'}>Edit</span>
            </label>
            <label onClick={New} className='my-auto d-flex ms-3' style={{cursor: 'pointer'}}>
                <i className="bi bi-plus my-auto"/><span className={'my-auto'}>New</span>
            </label>
        </label>

        <T2MEditor className={'mx-1'} value={m2t_result} defaultLanguage={language/* === 'JSON' ? 'JSON' : undefined*/} onBlur={(value) => {
            console.warn('monaco onchange', {d: props.data, value, did:props.dataid});
            if (!props.data || !value) return;
            // if (props.dataid !== lastID) return; // change triggered because element changed -> it's not a user-made edit -> no t2m transform.
            TRANSACTION('T2M transformation of "'+props.data.name+'" through "'+language+'"', ()=>{
                // this is an output text of a m2t transformation, either readonly or edit triggers t2m transform on selected element.
                // SetRootFieldAction.new('languages.'+language+".m2t", value, '', false)
                doT2M(L.wrap(props.data) as LModelElement, language, value);
            })
        }}/>
        <div className={'export-row'}>
            <button>Export</button>
            <button>Import</button>
        </div>
    </section>;
}

export const parsers = {
    'javascript': true,
    'xtext': false,
    'acceleo': false,
    'langium': false,
    'nearley': false,
    'monarch': false,
};
const parsersArr = Object.keys(parsers);

function M2TEditor(props: AllProps, language: string, setEditor: (v:boolean)=>void, setLanguage: (v:string)=>any): JSX.Element{
    let langObj = props.languages[language];
    if (!langObj) return <div className="w-100 h-100 d-flex" style={{cursor: "pointer"}} onClick={()=>setEditor(false)}>
        <div className={"m-auto"}>Language "{language}" not found.</div>
    </div>;
    let m2tobj = langObj.m2t[langObj.m2t.engine||'javascript'];
    let t2mobj = langObj.t2m[langObj.t2m.engine||'javascript'];

    let m2t_func = m2tobj.str;
    let t2m_func = t2mobj.str;
    let t2m_placeholder: string = 'function (text) {\t/*Not implemented */\n\treturn {};\n}';
    let m2t_placeholder: string = "function (text) {\n\t return \"Not implemented"+(m2t_func ? ", the m2t transformation will be unidirectional." : ".")+"\"\n}";
    if (!m2t_func) m2t_func = m2t_placeholder;
    if (!t2m_func) t2m_func = t2m_placeholder;

    let output_tmp = {};
    let default_text = "[Optional] Write here a DLS snippet to test the parser.";
    let test_text = t2mobj.test_text?.trim() || default_text;
    if (test_text !== default_text) {
        try { output_tmp = eval("("+t2m_func+")")(test_text); windoww.dd = output_tmp; } catch (e: any) { output_tmp = {msg: e.message, stack: e.stack, e}; }
    }

    return <section className={'M2T-Editor p-1'}>
        <div className={'d-flex'} style={{flexFlow: 'column'}}>
            <h2 className={'d-flex w-100'} style={{flexGrow: 1, margin: 'auto', flexWrap:'nowrap'}}>
                <CommandBar className="my-auto ms-0 me-auto h-100">
                    <Btn icon={'back'} action={() => setEditor(false)} tip={'Back'}/>
                </CommandBar>
                <label className="m-auto me-0" onClick={()=>setEditor(Date.now() as any)}>Editing:</label>
                <Input className="m-auto ms-0 h-100" hidden={true} getter={() => language} setter={(v0) => {
                    let value = v0 as string;
                    TRANSACTION('rename language "'+language+'"', ()=> {
                        SetRootFieldAction.new('languages.'+value, langObj, '', false);
                        SetRootFieldAction.new('languages', {language:undefined}, '-=', false);
                        AT_TRANSACTION(()=>setLanguage(value));
                    }, language, value)
                }} style={{overflow: 'visible'}}/>
            </h2>
            <CommandBar style={{float: 'right', height: '20px'}}>
                <Btn icon={'close'} action={() => setEditor(false)} theme={'light'} tip={'Close'}/>
            </CommandBar>
        </div>
        <pre className={"w-100 autosize"} contentEditable={true} onBlur={(e)=>{
            TRANSACTION('update DSL test snipped for language "'+language+'"', ()=>{
                let value = e.target.innerText;
                SetRootFieldAction.new('languages.'+language+'.test_text', value, '', false);
            })
        }}>{test_text}</pre>
        {test_text && test_text !== default_text ? <>
            <h5>Result</h5>
            <DataOutputComponent data={output_tmp} />
        </> : null}
        <div className={'d-flex'} style={{flexFlow: 'row'}}>
            <div className={'d-flex'} style={{flexGrow: 1, flexWrap:'wrap'}}>
                <h3 className={'w-100'}>M2T
                <select value={langObj.m2t.engine}> {parsersArr.map(p=><option value={p}>{p}</option>)}</select></h3>
                <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'javascript'} value={m2t_func}
                        onChange={(value) => {
                            TRANSACTION('edit m2t language "'+language+'"', ()=> {
                                if (value === m2t_placeholder) value = '';
                                SetRootFieldAction.new('languages.'+language+".m2t", value, '', false)
                            })
                        }} />
            </div>
            <div className={'d-flex'} style={{flexGrow: 1, flexWrap:'wrap'}}>
                <h3 className={'w-100'}>T2M</h3>
                <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'javascript'} value={t2m_func}
                        onChange={(value) => {
                            TRANSACTION('edit t2m language "'+language+'"', ()=> {
                                if (value === t2m_placeholder) value = '';
                                SetRootFieldAction.new('languages.'+language+".t2m", value, '', false)
                            })
                        }} />
            </div>
        </div>
    </section>;
}

interface OwnProps {
}
interface M2TOwnProps {
    language: string;
    data: LModelElement|Pointer<DModelElement>|DModelElement;
}
interface T2MOwnProps {
    language: string;
    data: LModelElement|Pointer<DModelElement>|DModelElement;
}


interface StateProps {
    dataid?: Pointer<DModelElement> | null;
    data?: LModelElement;
    languages: Dictionary<string, Language>;
}
interface M2TStateProps {
    data?: LModelElement;
    languages: Dictionary<string, Language>;
}
interface T2MStateProps {
    data?: LModelElement;
    languages: Dictionary<string, Language>;
}




interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;
type M2TAllProps = Overlap<Overlap<M2TOwnProps, M2TStateProps>, DispatchProps>;
type T2MAllProps = Overlap<Overlap<T2MOwnProps, T2MStateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as StateProps;
    const dataid = state._lastSelected?.modelElement;
    ret.dataid = dataid;
    if (dataid) ret.data = LModelElement.fromPointer(dataid);
    ret.languages = state.languages;
    return ret;
}
function T2MmapStateToProps(state: DState, ownProps: T2MOwnProps): T2MStateProps {
    const ret: T2MStateProps = {} as StateProps;
    if (typeof ownProps.data === 'string') ret.data = LModelElement.fromPointer(ownProps.data);
    else if (!(ownProps.data as LModelElement)?.__isProxy) ret.data = LModelElement.wrap(ownProps.data);
    else ret.data = ownProps.data as LModelElement;

    ret.languages = state.languages;
    return ret;
}
function M2TmapStateToProps(state: DState, ownProps: M2TOwnProps): M2TStateProps {
    const ret: M2TStateProps = {} as M2TStateProps;
    if (typeof ownProps.data === 'string') ret.data = LModelElement.fromPointer(ownProps.data);
    else if (!(ownProps.data as LModelElement)?.__isProxy) ret.data = LModelElement.wrap(ownProps.data);
    else ret.data = ownProps.data as LModelElement;

    ret.languages = state.languages;
    return ret;
}

function dispatch(dispatch: Dispatch<any>): DispatchProps { const ret: DispatchProps = {}; return ret; }

export const MTM = connect<StateProps, DispatchProps, OwnProps, DState>(mapStateToProps, dispatch)(MTMComponent);
//export const T2M = connect<StateProps, DispatchProps, OwnProps, DState>(T2MmapStateToProps, mapDispatchToProps )(T2MComponent);
// export const M2T = connect<StateProps, DispatchProps, OwnProps, DState>(M2TmapStateToProps, dispatch)(M2TComponent);

(MTM as any).cname = 'MTM';
// (M2T as any).cname = 'M2T';
// (T2M as any).cname = 'T2M';
MTMComponent.cname = 'MTMComponent';
// M2TComponent.cname = 'M2TComponent';
// T2MComponent.cname = 'T2MComponent';
