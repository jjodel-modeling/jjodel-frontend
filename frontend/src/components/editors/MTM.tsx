import type * as monaco from "monaco-editor";
import {
    DataOutputComponent,
    DState,
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
import Editor from "@monaco-editor/react";
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
    try {
        m2t_result = doM2T(props.data, language);
    } catch (e) {
        console.error(e);
        m2t_result = "M2T transformation failed, check the language definition.";
    }

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
        <h1 className={"rightbar-title"}>Model → Text → Model</h1>
        <label className={'d-flex'}>
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
        <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={m2t_result}
                onChange={(value) => {
                    if (!props.data || !value) return;
                    TRANSACTION('T2M transformation of "'+props.data.name+'" through "'+language+'"', ()=>{
                        // this is an output text of a m2t transformation, either readonly or edit triggers t2m transform on selected element.
                        // SetRootFieldAction.new('languages.'+language+".m2t", value, '', false)
                        doT2M(L.wrap(props.data) as LModelElement, language, value);
                    })
                }}/>
        <div className={'d-flex'} style={{flexFlow: 'column'}}>
            <button>Export</button>
            <button>Import</button>
        </div>
    </section>
        ;
}

function MTMComponent_oldPlaceholder(props: AllProps): JSX.Element{
    // let groups={'Metamodelers':{}, 'Modelers':{}, 'Language designer':{}, 'Concrete Syntax designer':{}};
    // let groupsarr = Object.keys(groups);
    let languages = props.languages;
    let [editor, setEditor] = useState<string | false>(false);
    let [language, setLanguage] = useState('JSON');

    let m2t: string = 'not implemented, this is a placeholder';
    switch (language) {
        case 'MyCustomLanguage':
            m2t = 'Dog: kirk // ID is either here after class name (optional) or in [*] if it coincides with an attribute pointers are *\n' +
                '\tname: kirk\n' + // '\tname: kirk[*]\n' +
                '\towner: Damiano\n' + // '\towner: Damiano*\n' +
                '\tage: 15\n' +
                '\tweight: 13\n' +
                '\tnode.initialX: 200\n' +
                '\tnode.x: 200\n';
            break;
        case 'JSON':
            m2t = `{
    id: 'kirk',
    name: 'kirk',
    owner: 'Damiano',
    age: 15,
    weight: 13,
    node: {
        initialX: 200,
        x: 200
    }
}`;
            break;
        case 'Emfatic (m2 only)':
            m2t = `@namespace(uri="psl", prefix="")
package psl;
class Dog{
    attr String id;
    attr String name;
    attr Integer age;
}
`; break;
        case 'flexmi/YAML':
            m2t = `?nsuri: psl
dog:
- id: kirk
- name: kirk
- owner: Damiano
- age: 15
- weight: 13
- node:
  - initialX: 200
  - x: 20
`; break;
        case 'flexmi/XMI':
            m2t = `<?nsuri psl?>
<dog name="kirk" id="kirk">
    <owner>Damiano</owner>
    <age>15</age>
    <weight>13</weight>
    <node>
        <initialX>200</initialX>
        <x>200</x>
    </node>
<dog>
    `; break;
        case 'eCore/JSON': break;
        case 'eCore/XMI': break;
        default: break;
    }
    if (editor) return M2TEditor(props, language, setEditor as any, setLanguage);

    return <section className={'w-100 h-100 p-2 MTM-tab'}>
        <h1 className={"rightbar-title"}>Model → Text → Model</h1>
        <label className={'d-flex'}>
            <span className={'my-auto'}>Language&nbsp;</span>
            <select className={'my-auto'} onChange={(e) => setLanguage(e.target.value)}>
                <option value={'JSON'}>JSON</option>
                <option value={'MyCustomLanguage'}>MyCustomLanguage</option>
                <option value={'Emfatic (m2 only)'}>Emfatic (m2 only)</option>
                <option value={'flexmi/YAML'}>flexmi/YAML</option>
                <option value={'flexmi/XMI'}>flexmi/YAML</option>
                <option value={'eCore/XMI'}>flexmi/YAML</option>
                <option value={'eCore/JSON'}>eCore/JSON</option>
                <option value={'eCore/XMI'}>eCore/XMI</option>
            </select>
            <label onClick={() => setEditor(true as any)} className='my-auto d-flex ms-3' style={{cursor: 'pointer'}}>
                <i className="bi bi-pencil-square my-auto"/><span className={'my-auto'}>Edit</span>
            </label>
            <label onClick={() => setEditor(true as any)} className='my-auto d-flex ms-3' style={{cursor: 'pointer'}}>
                <i className="bi bi-plus my-auto"/><span className={'my-auto'}>New</span>
            </label>
        </label>
        <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={m2t}
                onChange={() => {}}/>
        <div className={'d-flex'} style={{flexFlow: 'column'}}>
            <button>Export</button>
            <button>Import</button>
        </div>
    </section>
        ;
}

function M2TEditor(props: AllProps, language: string, setEditor: (v:boolean)=>void, setLanguage: (v:string)=>any): JSX.Element{
    let langObj = props.languages[language];
    if (!langObj) return <div className="w-100 h-100 d-flex" style={{cursor: "pointer"}} onClick={()=>setEditor(false)}>
        <div className={"m-auto"}>Language "{language}" not found.</div>
    </div>;
    let m2t_func = langObj.m2t;
    let t2m_func = langObj.t2m;
    let t2m_placeholder: string = 'function (text) {\t/*Not implemented */\n\treturn {};\n}';
    let m2t_placeholder: string = "function (text) {\n\t return \"Not implemented"+(m2t_func ? ", the m2t transformation will be unidirectional." : ".")+"\"\n}";
    if (!m2t_func) m2t_func = m2t_placeholder;
    if (!t2m_func) t2m_func = t2m_placeholder;

    let output_tmp = {};
    let default_text = "[Optional] Write here a DLS snippet to test the parser.";
    let test_text = langObj.test_text?.trim() || default_text;
    if (test_text !== default_text) {
        try { output_tmp = eval("("+t2m_func+")")(test_text); windoww.dd = output_tmp; } catch (e: any) { output_tmp = {msg: e.message, stack: e.stack, e}; }
    }

    return <section className={'M2T-tab p-1'}>
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
                <h3 className={'w-100'}>M2T</h3>
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
/*
export function T2M(props: AllProps): JSX.Element{

    return <section className={'T2M-tab'}>
        <h2>T2M</h2>
    </section>;
}*/

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
