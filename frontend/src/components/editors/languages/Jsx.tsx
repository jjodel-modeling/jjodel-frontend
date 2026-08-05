import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import type {FakeStateProps} from "../../../joiner/types";
import {DState, DViewElement, LViewElement, Pointer, Defaults} from "../../../joiner";
import Editor, { useMonaco } from "@monaco-editor/react";

// import monacoTypes2 from '!raw-loader!../../../static/monacotypes';
import monacoTypes from '../../../static/monacotypes';
import { typescriptMonacoOptions, withReadOnly } from '../monacoConfig';
import EditorToolbar from "../EditorToolbar";
import EditorFullscreenModal from "../EditorFullscreenModal";

function JsxEditorComponent(props: AllProps) {
    const monaco = useMonaco();
    const view = props.view;
    const dview = view.__raw;
    const readOnly = props.readOnly !== undefined ? props.readOnly : !props.debugmode && Defaults.check(dview.id);
    const [jsx, setJsx] = useStateIfMounted(dview.jsxString || '');
    const [show, setShow] = useStateIfMounted(true);
    const [expand, setExpand] = useStateIfMounted(false);
    const [wrap, setWrap] = useStateIfMounted(false);
    const [fullscreen, setFullscreen] = useStateIfMounted(false);

    // Sync jsx state with dview.jsxString when it changes externally
    useEffect(() => {
        if (!fullscreen) {  // Only when modal is not open
            setJsx(dview.jsxString || '');
        }
    }, [dview.jsxString, fullscreen]);

    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if (value !== undefined) setJsx(value);
    }


    const blur = (evt?: React.FocusEvent) => { // confirm in redux state for final state
        // A read-only editor must not reach the write path at all. Monaco's `readOnly`
        // stops the keystrokes, not this handler: the wrapper's onBlur fires regardless,
        // and `view.jsxString = jsx` goes through set_jsxString (view.tsx), which schedules
        // VIEWS_RECOMPILE_jsxString even when the value is unchanged. The gate is on
        // `readOnly`, not on any caller-specific condition, so it covers every read-only
        // consumer: the default views (Defaults.check) as well as the legacy views the
        // Template tab now opens read-only.
        if (readOnly) return;
        view.jsxString = jsx;
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
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: "React",
            allowJs: true,
            typeRoots: ["node_modules/@types"]//, 'src/static/'], // doubt those can be accesed at runtime but trying
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        monaco.languages.typescript.typescriptDefaults.addExtraLib("declare var data: 'datatype';");
        /*
        // doubt those files can be accesed at runtime but trying
        monaco.languages.typescript.javascriptDefaults.addExtraLib('declare var data: LModelElement; declare var node: LGraphElement;', 'src/static/monacotypes.d.ts');

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            '<<react-definition-file>>',
            `file:///node_modules/@react/types/index.d.ts`
        );*/



    }, [monaco]);

    //const lines = (Math.round(dview.jsxString.split(/\r|\r\n|\n/).length*1.8) < 5 ? 5 : Math.round(dview.jsxString.split(/\r|\r\n|\n/).length*1.8));

    let lines: number;
    if (expand) {
        lines = 1;
        for (let i = 0; i < dview.jsxString.length; i++) if (dview.jsxString[i] === '\n') lines++;
        lines += 2; // "margin"
    } else {
        lines = 5;
    }
    if (lines < 5) lines = 5;
    return(<>
        <EditorToolbar
            title="JSX Editor"
            icon="bi-code-slash"
            content={jsx}
            collapsed={!show}
            onCollapseToggle={() => setShow(!show)}
            onWrapChange={(newWrap) => setWrap(newWrap)}
            onExpandChange={(newExpanded) => setExpand(newExpanded)}
            onFullscreenOpen={() => setFullscreen(true)}
            initialExpanded={expand}
        />
        {show && <div className={'mt-2'}>
            {/*
            Seems like this issue was fixed?
            jsx.match(/{\s*\(.+\?.+\:.+\)\s*}/gm) && <label>
                <b className={'text-warning'}>Warning:</b>
                Please remove the round parenthesis, concatenate it with an empty string as in &#123; (a ? b : c) + '' &#125;
                or replace the ternary operator as in (a && b || c).
            </label>*/}
            {(jsx).indexOf('<>') >= 0 && <label>
                <b className={'text-warning'}>Warning:</b>
                JSX.Fragment {'<>'} is valid JSX but is not supported by our compiler.
                Please replace it with an array [] instead.
            </label>}
            {(jsx).indexOf('?.') >= 0 && <label>
                <b className={'text-warning'}>Warning:</b>
                Optional chaining {'.?'} is valid JS but is not supported by our compiler.
                Please replace it with && instead. Eg: from (a?.b) to (a && a.b).
            </label>}
            {(jsx).indexOf('??') >= 0 && <label>
                <b className={'text-warning'}>Warning:</b>
                Nullish coalescing {'??'} is valid JS but is not supported by our compiler.
                Please replace it with explicit null and undefined checks, or a ||.
            </label>}
        </div>}
        {show && (
            <div
                className="monaco-editor-wrapper"
                style={{
                    padding: '5px',
                    transition: 'height 0.3s',
                    height: expand ? '60vh' : '40vh',
                    minHeight: '200px',
                    maxHeight: expand ? '800px' : '500px',
                    resize: 'vertical',
                    overflow: 'hidden'
                }}
                onBlur={(e) => blur(e)}
                tabIndex={-1}
            >
                <Editor
                    className="mx-1"
                    onChange={change}
                    language="typescript"
                    options={{
                        ...withReadOnly(typescriptMonacoOptions, readOnly),
                        wordWrap: wrap ? 'on' : 'off'
                    }}
                    defaultLanguage="typescript"
                    value={jsx}
                    loading={<div style={{padding: '20px'}}>Loading JSX Editor...</div>}
                />
            </div>
        )}

        {/* Fullscreen Modal */}
        <EditorFullscreenModal
            isOpen={fullscreen}
            onClose={() => { blur(); setFullscreen(false); }}
            title="JSX Editor"
            icon="bi-code-slash"
            value={jsx}
            onChange={change}
            // Read-only: no save handler at all. The modal already hides the Save button
            // when readOnly, but its Ctrl+S shortcut calls `onSave?.(value)` without
            // checking the flag; passing undefined makes that optional call a no-op
            // without touching the shared modal, which other editors also use.
            onSave={readOnly ? undefined : (newValue) => {
                setJsx(newValue);  // Update local state
                view.jsxString = newValue;  // Save to redux/model
                setFullscreen(false);
            }}
            language="typescript"
            languageLabel="jsx"
            readOnly={readOnly}
        />
    </>);
}
interface OwnProps {
    viewid: Pointer<DViewElement, 1, 1, LViewElement>;
    readOnly?: boolean;
}

interface StateProps {
    view: LViewElement;
    debugmode: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debugmode = state.debug;
    ret.view = LViewElement.fromPointer(ownProps.viewid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JsxEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(JsxEditorComponent);

export const JsxEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <JsxEditorConnected {...{...props, children}} />;
}

JsxEditorComponent.cname = "JsxEditorComponent";
JsxEditorConnected.cname = "JsxEditorConnected";
JsxEditor.cname = "JsxEditor";
export default JsxEditor;
