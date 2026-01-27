import React, {CSSProperties, Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import Editor, {useMonaco} from '@monaco-editor/react';
import {
    Defaults,
    DPointerTargetable,
    DState,
    DViewElement,
    LPointerTargetable,
    LViewElement, Overlap,
    Pointer
} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';
import { mediumMonacoOptions, withReadOnly } from '../monacoConfig';
import EditorToolbar from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';

function JsEditorComponent(props: AllProps) {
    const {placeHolder, height, title, getter, setter, jsxLabel, field} = props;
    let data: LPointerTargetable = LPointerTargetable.wrap(props.data) as any;
    let value = getter ? getter(data, field) : ((data|| {}) as any)[field as any];
    const [js, setJs] = useStateIfMounted(value);
    const [oldJs, setOldJs] = useStateIfMounted(js);
    const [show, setShow] = useStateIfMounted(props.initialExpand ? props.initialExpand(data, field) : false);
    const [expand, setExpand] = useStateIfMounted(false);
    const [wrap, setWrap] = useStateIfMounted(false);
    const [fullscreen, setFullscreen] = useStateIfMounted(false);
    const monaco = useMonaco();
    (window as any).monaco = monaco;

    const readOnly = props.readOnly !== undefined ? props.readOnly : !props.debugmode && Defaults.check(data.id);
    const change = (value: string|undefined) => {
        /* save in local state for frequent changes */
        if (value !== undefined) setJs(value);
    }
    const blur = () => {
        /* confirm in redux state for final state */
        if (oldJs === js) return;
        if (js && setter) setter(js, data, field);
        else if(field) (data as any)[field] = js;
        setOldJs(value);
    }

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
    if (!((data && field) || (getter && setter))) return(<>Either props.data & field or both getter & setter are required.</>);

    if (placeHolder && !js) value = placeHolder;
    if (!value) value = '';
    const lines = (Math.round(value.split(/\r|\r\n|\n/).length*1.8) < 5 ? 10 : Math.round(value.split(/\r|\r\n|\n/).length*1.8));

    return <>
        <EditorToolbar
            title={title || 'JS Editor'}
            icon="bi-filetype-js"
            content={js || ''}
            collapsed={!show}
            onCollapseToggle={() => setShow(!show)}
            onWrapChange={(newWrap) => setWrap(newWrap)}
            onExpandChange={(newExpanded) => setExpand(newExpanded)}
            onFullscreenOpen={() => setFullscreen(true)}
            disableFullscreen={true}
            initialExpanded={expand}
            readOnly={readOnly}
        />
        {show && <div className={'monaco-editor-wrapper'}
                style={{padding: '5px', height:`${lines+'lvh'}`, transition: 'height 0.3s', resize: 'vertical', overflow:'hidden'}}
                tabIndex={-1}
                onFocus={() => setExpand(true)}
                onBlur={() => {setExpand(false);blur()}}>
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
            title={typeof title === 'string' ? title : 'JS Editor'}
            icon="bi-filetype-js"
            value={js || ''}
            onChange={change}
            onSave={(newValue) => {
                if (setter) setter(newValue, data, field);
                else if(field) (data as any)[field] = newValue;
                setFullscreen(false);
            }}
            language="typescript"
            readOnly={readOnly}
        />
    </>;
}
interface OwnProps {
    readOnly?: boolean;
    data?: Pointer | DPointerTargetable | LPointerTargetable;
    field?: string;
    placeHolder?: string;
    title?: ReactNode;
    height?: number;
    style?: CSSProperties;
    jsxLabel?: ReactNode;
    getter?: (data?:LPointerTargetable, field?: string) => string;
    setter?: (js: string, data?:LPointerTargetable, field?: string) => void;
    initialExpand?: (data: LPointerTargetable, field?: string) => boolean;
}
interface StateProps {
    data?: LPointerTargetable;
    debugmode: boolean;
}

interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.data = LViewElement.wrap(ownProps.data);
    ret.debugmode = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JsEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(JsEditorComponent);

export const JsEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <JsEditorConnected {...{...props, children}} />;
}

JsEditorComponent.cname = 'JsEditorComponent';
JsEditorConnected.cname = 'JsEditorConnected';
JsEditor.cname = 'JsEditor';
