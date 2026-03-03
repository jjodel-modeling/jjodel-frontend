import type * as monaco from "monaco-editor";
import {LanguageCache, notLanguageFragments, ParserData} from "../../joiner/classes";
import {
    DataOutputComponent,
    DState, GObject,
    Input, L,
    Language, Log,
    LPointerTargetable,
    Overlap,
    Pointer,
    SetRootFieldAction,
    store,
    TRANSACTION, transientProperties, U, Uarr
} from "../../joiner";
import {Dictionary, FakeStateProps, windoww} from "../../joiner/types";
import React, {Dispatch, JSX, useState} from "react";
import {connect} from "react-redux";
import {DModelElement, LModelElement} from "../../model/logicWrapper";
import './mtm.scss';
import {JsEditor} from "./languages";
import Editor, {EditorProps} from "@monaco-editor/react";
import {AFTER_TRANSACTION, AT_TRANSACTION} from "../../redux/action/action";
import {doM2T, doT2M, parseT2M} from "../forEndUser/MTM";
import {Btn, CommandBar} from "../commandbar/CommandBar";
import {hideMetrics} from "../metrics/Metrics";
import {Nearley} from "../../DSL/nearley/nearley";
import {Tooltip} from "../forEndUser/Tooltip";
import { baseMonacoOptions, withReadOnly } from './monacoConfig';
import EditorToolbar from './EditorToolbar';
import EditorFullscreenModal from './EditorFullscreenModal';

// Use centralized Monaco configuration
const monacooptions = baseMonacoOptions;

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
    let [showEditor, setShowEditor] = useState(true);
    let [expand, setExpand] = useState(false);
    let [wrap, setWrap] = useState(false);
    let [fullscreen, setFullscreen] = useState(false);
    let [localValue, setLocalValue] = useState('');
    if (editor) return <MTMEditor {...{...props, language, setEditor, setLanguage}}/>;
    let languageObj = languages[language];
    if (!languageObj) {
        language = 'JSON';
        languageObj = languages[language];
    }
    let data: LModelElement | undefined = props.data;

    let dataid: Pointer<DModelElement> | undefined;
    let t2mobj = languageObj.t2m[languageObj.t2m.engine];
    let m2tobj = languageObj.m2t[languageObj.m2t.engine];
    console.log('check global transform', {data, cn:data?.className, t2mobj, m2tobj, t2:t2mobj?.allowPartials, m2:m2tobj?.allowPartials})

    if (data && data.className !== 'DModel' && (!t2mobj?.allowPartials || !m2tobj?.allowPartials)) {
        console.log('check global transform --> GLOBAL');
        data = data.model;
        dataid = data.id;
    }
    else {
        console.log('check global transform --> LOCAL');
        dataid = props.dataid || undefined;
    }

    //let m2t = languageObj.m2t;
    //let t2m = languageObj.t2m;
    let m2t_result: string;
    if (data) try {
        m2t_result = doM2T(data, language);
    } catch (e) {
        console.error(e);
        m2t_result = "M2T transformation failed, check the language definition.";
    } else m2t_result = /*'Cannot perform a language transformation on the current selection.\n*/'Please select a Modelling Element.'

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
        <label className={'d-flex'}>
            <span className={'my-auto'}>Language&nbsp;</span>
            <select className={'my-auto'} onChange={(e) => setLanguage(e.target.value)} value={language}>
                <optgroup label={"languages"}>{
                    Object.keys(languages).reverse().map(k=> k === 'clonedCounter' ? null : <option value={k}>{k}</option>)
                }</optgroup>
            </select>
            <label onClick={() => setEditor(true)} className='my-auto d-flex ms-3' style={{cursor: 'pointer'}}>
                <i className="bi bi-pencil-square my-auto"/><span className={'my-auto'}>Edit</span>
            </label>
            <label onClick={New} className='my-auto d-flex ms-3' style={{cursor: 'pointer'}}>
                <i className="bi bi-plus my-auto"/><span className={'my-auto'}>New</span>
            </label>
        </label>

        <EditorToolbar
            className={"my-2"}
            style={{minHeight: '2ic', maxHeight: '2ic', padding: 0}}
            title={`${language} Output`}
            icon="bi-arrow-left-right"
            content={m2t_result}
            collapsed={!showEditor}
            onCollapseToggle={() => setShowEditor(!showEditor)}
            onWrapChange={(newWrap) => setWrap(newWrap)}
            onExpandChange={(newExpanded) => setExpand(newExpanded)}
            onFullscreenOpen={() => { setLocalValue(m2t_result); setFullscreen(true); }}
            disableFullscreen={false}
            initialExpanded={expand}
        />
        {showEditor && (
            <div
                className="monaco-editor-wrapper"
                style={{
                    height: expand ? '60%' : '40%',
                    maxHeight: expand ? '800px' : '500px',
                    transition: 'height 0.3s',
                    resize: 'vertical',
                    overflow: 'hidden'
                }}
            >
                <T2MEditor className={'mx-1'} value={m2t_result} defaultLanguage={language}
                    options={{ wordWrap: wrap ? 'on' : 'off' }}
                    onBlur={(value) => {
                        console.warn('monaco onchange', {d: data, value, did:dataid});
                        if (!data || !value) return;
                        TRANSACTION('T2M transformation of "'+data.name+'" through "'+language+'"', ()=>{
                            doT2M(L.wrap(data) as LModelElement, language, value);
                        })
                    }}/>
            </div>
        )}

        <EditorFullscreenModal
            isOpen={fullscreen}
            onClose={() => setFullscreen(false)}
            title={`${language} Output`}
            icon="bi-arrow-left-right"
            value={localValue || m2t_result}
            onChange={(value) => setLocalValue(value || '')}
            onSave={(newValue) => {
                if (data) {
                    TRANSACTION('T2M transformation of "'+data.name+'" through "'+language+'"', ()=>{
                        doT2M(L.wrap(data) as LModelElement, language, newValue);
                    })
                }
                setFullscreen(false);
            }}
            language={language.toLowerCase()}
        />
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
    'nearley': true,
    'monarch': false,
};
export const serializers = {
    'javascript': true,
    'handlebars': true,
    'xtext': false,
    'acceleo': false,
};
const parsersArr = Object.keys(parsers);
const serializersArr = Object.keys(serializers);


export function clearCache(language: string, engine: string): void{
    if (!transientProperties.language[language]?.[engine]) return;
    delete transientProperties.language[language][engine];
}

export function getLanguageCache(language: string, engine: string): LanguageCache{
    let tl = transientProperties.language[language];
    if (!tl) transientProperties.language[language] = tl = {};
    let te = tl[engine];
    if (!te) tl[engine] = te = new windoww.LanguageCache();
    return te;
}

const defaultpartials: Dictionary<string, boolean> = {
    'Model': true,
    'Package': true,
    'Enumerator': true,
    'Literal': true,
    'Class': true,
    'Attribute': true,
    'Reference': true,
    'Operation': true,
    'Parameter': true,
    'Annotation': true,
    'Object': true,
    'Value': true,
};

function MTMEditor(props: EditorAllProps): JSX.Element{
    let {language, setLanguage, setEditor} = props;
    let langObj = props.languages[language];
    let [t2mfragment, sett2mFragment] = useState('Default' as keyof ParserData);
    let [m2tfragment, setm2tFragment] = useState('Default' as keyof ParserData);

    let defaultEnginet2m = 'nearley';
    let defaultEnginem2t = 'handlebars';
    let m2tengine = langObj?.m2t?.engine || defaultEnginem2t;
    let t2mengine = langObj?.t2m?.engine || defaultEnginet2m;
    let m2tobj: ParserData = langObj?.m2t?.[m2tengine];
    let t2mobj: ParserData = langObj?.t2m?.[t2mengine];

    let t2m_placeholder: string;
    let m2t_placeholder: string;
    let m2tpartials: boolean = m2tobj.allowPartials;
    let t2mpartials: boolean = t2mobj.allowPartials;
    let notLanguageFragments = windoww.notLanguageFragments;
    const fragmentsm2t = Object.keys(m2tobj).filter(k => !(k in notLanguageFragments));
    const fragmentst2m = Object.keys(t2mobj).filter(k => !(k in notLanguageFragments));

    if (t2mpartials) t2m_placeholder = 'Partial transformation '+t2mfragment+' missing.' +
        (t2mfragment !== 'Default' ? '\n"Default" transformation will be used.' : '') +
        '\nTo delete this partial,\nrename it and give an empty name.' as any;
    else switch (t2mengine) {
        default:
        case 'javascript':
            t2m_placeholder = 'function (text) {\t/*Not implemented */\n\treturn {};\n}';
            break;
        case 'nearley':
            t2m_placeholder = 'main -> foo | bar\nfoo -> "f" "o":*\nbar -> "bar"';
            break;
    }
    if (m2tpartials) m2t_placeholder = 'Partial transformation '+m2tfragment+' missing.' +
        (m2tfragment !== 'Default' ? '\n"Default" transformation will be used.' : '') +
        '\nTo delete this partial,\nrename it and give an empty name.' as any;
    else switch (m2tengine) {
        default:
        case 'javascript':
            m2t_placeholder = "function (text) {\n\t return \"Not implemented"+(t2mobj?.__str ? ", the t2m transformation will be unidirectional." : ".")+"\"\n}";
            break;
    }


    let [oldm2tEngine, set_oldm2tEngine] = useState(m2tengine);
    let [oldt2mEngine, set_oldt2mEngine] = useState(t2mengine);
    let [m2t_func, set_m2tfunc] = useState((!m2tpartials ? m2tobj?.__str : m2tobj[m2tfragment] as string) || m2t_placeholder);
    let [t2m_func, set_t2mfunc] = useState((!t2mpartials ? t2mobj?.__str : t2mobj[t2mfragment] as string) || t2m_placeholder);
    let className = props.data?.className;
    // __jj_needs_reset__: if engine changed, the old m2tfunc is cached in react state,
    //      but the engine object changed, so i need to reinitialize at default val.
    if (oldm2tEngine !== m2tengine || oldm2tEngine === '__jj_needs_reset__') {
        set_oldm2tEngine(m2tengine);
        set_m2tfunc((!m2tpartials ? m2tobj?.__str : m2tobj[m2tfragment] as string) || m2t_placeholder);
    }
    if (oldt2mEngine !== t2mengine || oldt2mEngine === '__jj_needs_reset__') {
        set_oldt2mEngine(t2mengine);
        set_t2mfunc((!t2mpartials ? t2mobj?.__str : t2mobj[t2mfragment] as string) || t2m_placeholder);
    }
    // if (m2t_func === '__jj_needs_reset__') set_m2tfunc(m2tobj?.__str || m2t_placeholder);
    // if (t2m_func === '__jj_needs_reset__') set_t2mfunc(t2mobj?.__str || t2m_placeholder);
    console.log('mtm render', {m2tengine, t2mengine, langObj, m2tobj, t2mobj, m2t_func, t2m_func});

    if (!langObj) return <div className="w-100 h-100 d-flex" style={{cursor: "pointer"}} onClick={()=>setEditor(false)}>
        <div className={"m-auto"}>Language "{language}" not found.</div>
    </div>;
    if (!m2tobj || !t2mobj) {
        TRANSACTION('setup DSL languages', ()=>{
            if (!m2tobj) SetRootFieldAction.new('languages.'+language+'.m2t.'+(langObj.m2t.engine||defaultEnginem2t), {}, '')
            if (!t2mobj) SetRootFieldAction.new('languages.'+language+'.t2m.'+(langObj.t2m.engine||defaultEnginet2m), {}, '')
        })
        return <>Loading...</>;
    }
    let output_tmp: GObject = {};
    let default_text = "[Optional] Write here a DLS snippet to test the parser.";
    let test_text = t2mobj.test_text?.trim() || default_text;
    if (test_text !== default_text) {
        try {
            let errOutput: {msg: string, e: GObject} = {} as any;
            output_tmp = parseT2M(language, test_text, true, errOutput, undefined, className) || errOutput;
            // output_tmp = eval("("+t2m_func+")")(test_text);
        } catch (e: any) { output_tmp = {msg: e.message, stack: e.stack, e}; }
        console.log('t2m', {output_tmp, t2m_func, test_text});
    }
    let m2t = {
        label: 'm2t',
        LABEL: 'M2T',
        //partials: m2tpartials,
        func: m2t_func,
        obj: m2tobj,
        fragment: m2tfragment,
        engine: m2tengine,
        placeholder: m2t_placeholder,
        setfunc: set_m2tfunc,
        fragments: fragmentsm2t,
        allowPartials: m2tpartials,
        setFragment: setm2tFragment,
        set_oldEngine: set_oldm2tEngine,
        enginesArr: serializersArr,
        engines: serializers,
        operation: 'serialization',
        tooltip: <div>Partial serializations can represent localized elements (a sub-tree).<br/>Global serializations involve the entire model.</div>
    };
    let t2m = {
        label: 't2m',
        LABEL: 'T2M',
        //partials: t2mpartials,
        func: t2m_func,
        obj: t2mobj,
        fragment: t2mfragment,
        engine: t2mengine,
        placeholder: t2m_placeholder,
        setfunc: set_t2mfunc,
        fragments: fragmentst2m,
        allowPartials: t2mpartials,
        setFragment: sett2mFragment,
        set_oldEngine: set_oldt2mEngine,
        enginesArr: parsersArr,
        engines: parsers,
        operation:'transformation',
        tooltip: <div>Partial transformations can edit localized elements.<br/>Global transformations involve the entire model.</div>
    };

    let arr = [m2t, t2m];
    return <section className={'MTM-tab p-1'}>
        <section data-comment={'just to make it scrollable'}>
            <div className={'d-flex'} style={{flexFlow: 'column'}}>
                <h2 className={'d-flex w-100 my-2'} style={{flexGrow: 1, margin: 'auto', flexWrap:'nowrap'}}>
                    <CommandBar className="my-auto ms-0 me-auto back-button">
                        <Btn icon={'back'} action={() => setEditor(false)} tip={'Back'}/>
                    </CommandBar>
                    <label className="m-auto me-0" onClick={()=>setEditor(Date.now() as any)}>Editing</label>
                    <Input className="m-auto ms-1 h-100 italic" hidden={true} getter={() => language} setter={(v0) => {
                        let value = v0 as string;
                        TRANSACTION('rename language "'+language+'"', ()=> {
                            SetRootFieldAction.new('languages.'+value, langObj, '', false);
                            SetRootFieldAction.new('languages', {[language]:undefined}, '-=', false);
                            AT_TRANSACTION(()=>{
                                transientProperties.language[value] = transientProperties.language[language];
                                delete transientProperties.language[language];
                                setLanguage(value);
                            })
                        }, language, value)
                    }} style={{overflow: 'visible'}}/>
                    <label className="m-auto me-0">{Math.random().toFixed(2)}</label>
                </h2>
            </div>
            <div className={'d-flex editors'} style={{flexFlow: 'row'}}>
                <div className={'separator'}/>
                {arr.map(a=><div className={'d-flex '+a.label} style={{flexGrow: 1, flexWrap: 'wrap'}}>
                    <h3 className={'w-100'}>{a.LABEL}&nbsp;
                        <select value={a.engine} onChange={(e) => {//ok
                            let v = e.target.value.toLowerCase();
                            if (v === a.engine) return;
                            TRANSACTION('Change '+a.LABEL+' engine "' + language + '"', () => {
                                if (!langObj[a.label as "m2t" | "t2m"][v]) SetRootFieldAction.new('languages.' + language + "."+a.label+"." + v, new ParserData(), '', false);
                                SetRootFieldAction.new('languages.' + language + "."+a.label+".engine", v, '', false);
                            }, a.engine, v)
                        }}> {a.enginesArr.map(p => (
                            <option value={p} disabled={!(a.engines as GObject)[p]}>{p}</option>))}
                        </select>
                    </h3>
                    <Tooltip tooltip={a.tooltip} inline={true}>
                        <label className={'d-flex ms-3'}><Input
                            className={'my-auto'}
                            type={"checkbox"}
                            getter={() => a.allowPartials}
                            setter={(val) => TRANSACTION('language "' + language + '/' + a.engine + '" allow partials',
                                () => {
                                    SetRootFieldAction.new('languages.' + language + '.'+a.label+'.' + a.engine + '.allowPartials', val, '', false);
                                    // create empty entries for class, package...
                                    if (val && fragmentsm2t.length === 0) for (let k in defaultpartials) {
                                        if (a.func === a.placeholder) return;
                                        if (!(k in a.obj)) SetRootFieldAction.new('languages.' + language + '.'+a.label+'.' + a.engine + '.'+k, '', '', false);
                                    }
                                    if (val && !a.obj.Default && a.obj.__str && a.func !== a.placeholder) {
                                        SetRootFieldAction.new('languages.' + language + '.'+a.label+'.' + a.engine + '.Default', a.obj.__str, '', false);
                                    }
                                    if (val) a.setFragment('Default');
                                    a.set_oldEngine('__jj_needs_reset__');
                                    AT_TRANSACTION(()=>{ clearCache(language, a.engine); })
                                },
                                a.allowPartials, val)}
                        /><span className={'my-auto ms-1'}> Allow partial {a.operation}s</span></label>
                    </Tooltip>
                    {a.allowPartials ? <div className={'fragments d-flex ms-1'}><div className={'fill'}>{
                        ['+', ...a.fragments].reverse().map(f=><div className={'fragment-btn '/* +(f === a.fragment ? 'selected btn-secondary' : 'btn-outline-secondary')*/}
                                              onClick={() => {a.setFragment(f); a.set_oldEngine('__jj_needs_reset__')}}>
                            {f === 'Default'? <span>Default</span> : <Input placeholder={'Confirm to delete'} key={f} getter={()=>f} tooltip={'double click to '+(f==='+'?'add':'rename')+' fragment'} setter={(v)=>{
                                if (!v) {
                                    TRANSACTION('language "' + language + '/' + a.engine + '" remove partial', ()=>{
                                        if (f !== '+') SetRootFieldAction.new('languages.' + language + '.'+a.label+'.' + a.engine + '.'+f, undefined, '', false);
                                    }, f, v);
                                    a.setFragment('Default');
                                    a.set_oldEngine('__jj_needs_reset__');
                                    AT_TRANSACTION(()=>clearCache(language, a.engine));
                                    return;
                                }
                                if ((v as string) in a.obj || v === '+' || ((v as string) in notLanguageFragments)) { Log.ww(a.LABEL+' partial name already taken'); return; }
                                TRANSACTION('language "' + language + '/' + a.engine + '" '+(f === '+'?'add':'rename')+' partial', ()=>{
                                    SetRootFieldAction.new('languages.' + language + '.'+a.label+'.' + a.engine + '.'+v, ' ', '', false);
                                    a.setFragment(v as string);
                                    if (f !== '+') SetRootFieldAction.new('languages.' + language + '.'+a.label+'.' + a.engine + '.'+f, undefined, '', false);
                                    AT_TRANSACTION(()=>clearCache(language, a.engine));
                                }, f, v)
                                }} clickHidden={true}/>
                            }</div>
                        )}</div></div> : <div></div>}
                    <div className={'editor-wrapper w-100 h-100 '+a.label} tabIndex={-1} onBlur={() => {
                        let value = (a.func === a.placeholder) ? '' : a.func;
                        let old = (a.allowPartials ? a.obj.__str : a.obj[a.fragment]) || '';
                        console.log('onBlur '+a.label, {value, old});
                        if (old === value) return;
                        console.log('onBlur '+a.label+' pass');

                        TRANSACTION('Edit '+a.label+' language "'+language+'"', ()=> {
                            SetRootFieldAction.new('languages.'+language+"."+a.label+"."+a.engine+'.' + (a.allowPartials ? a.fragment : '__str'), value, '', false);
                            // SetRootFieldAction.new('RECOMPILE_LANGUAGE', {engine: a.engine, language}, '+=', false);
                            AT_TRANSACTION(()=>clearCache(language, a.engine));
                        })
                    }}>
                        <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'plaintext'} value={a.func}
                                key={a.engine} onChange={(value) => a.setfunc(value || '') } />
                    </div>
                </div>)}
            </div>
            <h5>Test Sample</h5>
            <pre className={"w-100 autosize"} contentEditable={true} tabIndex={-1} onBlur={(e) => {
                console.log('text onblur', {e, target: e.target, txt: e.target.innerText});
                TRANSACTION('update DSL test snipped for language "' + language + '"', () => {
                    let value = e.target.innerText;
                    SetRootFieldAction.new('languages.' + language + '.t2m.' + t2mengine + '.test_text', value, '', false);
                })
            }}>{test_text}</pre>
            {test_text && test_text !== default_text ? <>
                <h5>Result</h5>
                <DataOutputComponent data={output_tmp}/>
            </> : null}
        </section>
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
type EditorAllProps = AllProps & {
    language: string,
    setEditor: (v:boolean)=>void,
    setLanguage: (v:string)=>any,
    onBlur?: (value: string|undefined, evt: Event) => void
}
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
