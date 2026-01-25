import React, {CSSProperties, Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import Editor, {useMonaco} from '@monaco-editor/react';

import {
    DState,
    DViewElement,
    LViewElement,
    Pointer,
    Defaults,
    LPointerTargetable,
    Pack1,
    Overlap, GObject, Log, Info
} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import { mediumMonacoOptions, withReadOnly } from '../monacoConfig';
import EditorToolbar from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';

function JavascriptEditorComponent(props: AllProps) {
    let {placeHolder, height, title, jsxLabel, data, field} = props;
    let getter = props.getter || ((): string => data as any && field as any && (data as any)[field as string]);
    let setter = props.setter || ((val: string) => {
        if (data && field) (data as any)[field] = val;
        return;
    });
    const [js, setJs] = useStateIfMounted(getter());
    const [show, setShow] = useStateIfMounted(props.hide === false ? false : true);
    const [expand, setExpand] = useStateIfMounted(false);
    const [wrap, setWrap] = useStateIfMounted(false);
    const [fullscreen, setFullscreen] = useStateIfMounted(false);
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);
    const readOnly = props.readonly !== undefined ? props.readonly : data && Defaults.check(data.id);
    const change = (value: string|undefined) => {
        /* save in local state for frequent changes */
        setJs(value || '');
    }
    const blur = () => {
        /* confirm in redux state for final state */
        setter(js);
    }
    const monaco = useMonaco();
    (window as any).monaco = monaco;

    useEffect(() => {
        if (!monaco) return;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']//, 'src/static/'], // doubt those can be accesed at runtime but trying
        });
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(`declare var data: 'datatype';`);
    }, [monaco]);

    let value = js || placeHolder;
    let gata = data as GObject;
    const info: Info | undefined = data && field && gata['__info_of__' + field];
    let tooltip: ReactNode = ((props.tooltip === true) ? (info ? info.txt: '') : props.tooltip) || '';

    if (jsxLabel === undefined && info) jsxLabel = typeof info.label === "string" ? <label className={'editor-label'}>{info.label}</label> : info.label || undefined;

    if (typeof value === 'function') { value = (value as any).toString(); }
    if (typeof value !== 'string') {
        try { value = JSON.stringify(value); }
        catch (e){
            let msg = 'found invalid value for JsEditor. a string is required, found instead:' + typeof value;
            Log.ee(msg, {e, value, field:props.field, data:props.data});
            value = msg;
        }
    }
    console.log('jsEditor', {value, p: props.field, t:props.title, l:props.jsxLabel});
    return <>
        <EditorToolbar
            title={typeof title === 'string' ? title : (typeof jsxLabel === 'string' ? jsxLabel : 'JavaScript Editor')}
            icon="bi-filetype-js"
            content={js || ''}
            collapsed={!show}
            onCollapseToggle={() => setShow(!show)}
            onWrapChange={(newWrap) => setWrap(newWrap)}
            onExpandChange={(newExpanded) => setExpand(newExpanded)}
            onFullscreenOpen={() => setFullscreen(true)}
            disableFullscreen={true}
            initialExpanded={expand}
            readOnly={readOnly || false}
        />

        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}

        {show && <div className={'monaco-editor-wrapper'}
                      style={{padding: '5px', minHeight: '20px', height:`${expand ? '10lvh' : '5lvh'}`, transition: 'height 0.3s', resize: 'vertical', overflow:'hidden'}}
                      tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change}
                    options={{
                        ...withReadOnly(mediumMonacoOptions, readOnly),
                        wordWrap: wrap ? 'on' : 'off'
                    }}
                    defaultLanguage={'typescript'} value={value||""}
                    loading={<div style={{padding: '20px'}}>Loading JS Editor...</div>}
            />
        </div>}

        <EditorFullscreenModal
            isOpen={fullscreen}
            onClose={() => { blur(); setFullscreen(false); }}
            title="JavaScript Editor"
            icon="bi-filetype-js"
            value={js || ''}
            onChange={change}
            onSave={(newValue) => {
                setter(newValue);
                setFullscreen(false);
            }}
            language="typescript"
            readOnly={readOnly || false}
        />
    </>;
}
interface OwnProps {
    data?: Pack1<LPointerTargetable>;
    field?: string;
    getter?: () => string;
    setter?: (js: string) => void;
    readonly?: boolean;
    placeHolder?: string;
    hide: boolean | undefined; // undefined = show and disable autohiding. boolean, set initial state and allow hiding button.
    title?: ReactNode;
    jsxLabel?: ReactNode;
    tooltip?: ReactNode;
    style?: CSSProperties;
    height?: number;
}
interface StateProps { data?: LPointerTargetable; }
interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, DispatchProps>, StateProps>;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.data = LViewElement.wrap(ownProps.data);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JavascriptEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(JavascriptEditorComponent);

export const JavascriptEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <JavascriptEditorConnected {...{...props, children}} />;
}

JavascriptEditorComponent.cname = 'JavascriptEditorComponent';
JavascriptEditorConnected.cname = 'JavascriptEditorConnected';
JavascriptEditor.cname = 'JavascriptEditor';
