import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import type {FakeStateProps} from "../../../joiner/types";
import {DState, DViewElement, LViewElement, Pointer, Defaults} from "../../../joiner";
import Editor, { useMonaco } from "@monaco-editor/react";

// import monacoTypes2 from '!raw-loader!../../../static/monacotypes';
import monacoTypes from '../../../static/monacotypes';
import { CommandBar, Btn } from "../../commandbar/CommandBar";
import { uniqueId } from "lodash";

function JsxEditorComponent(props: AllProps) {
    const monaco = useMonaco();
    const view = props.view;
    const dview = view.__raw;
    const readOnly = props.readOnly !== undefined ? props.readOnly : !props.debugmode && Defaults.check(dview.id);
    const [jsx, setJsx] = useStateIfMounted(dview.jsxString || '');
    const [show, setShow] = useStateIfMounted(true);

    const [expand, setExpand] = useStateIfMounted(false);

    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if (value !== undefined) setJsx(value);
    }


    const blur = (evt?: React.FocusEvent) => { // confirm in redux state for final state
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
        <div className={'cursor-pointer d-flex'} onClick={e => setShow(!show)}>
            <span className={'my-auto'} tabIndex={-1} >
                <i className={'bi bi-chevron-' + (show ? 'down' : 'right')} />
                {/*show ? <i className={'bi bi-eye-fill'} /> : <i className={'bi bi-eye-slash-fill'} /> */}
            </span>
            <label className={'editor-label'}>
                JSX Editor
            </label>

            {/* show && <CommandBar style={{paddingTop: '10px'}}>
                {expand ?
                    <Btn icon={'shrink'} action={(e) => {setExpand(false); setShow(true)}} tip={'Minimize editor'}/>
                    :
                    <Btn icon={'expand'} action={(e) => {setExpand(true); setShow(true)}} tip={'Enlarge editor'}/>
                }
            </CommandBar>*/}
        </div>
        {show && <div className={'mt-1'}>
            {jsx.match(/{\s*\(.+\?.+\:.+\)\s*}/gm) && <label>
                <b className={'text-warning'}>Warning:</b>
                Please remove the round parenthesis, concatenate it with an empty string as in &#123; (a ? b : c) + '' &#125;
                or replace the ternary operator as in (a && b || c).
            </label>}
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
        {show && <div className={'monaco-editor-wrapper'}
                    style={{padding: '5px', minHeight: '20px', transition: 'height 0.3s', height:`${expand ? 'calc('+(lines-1)+' * 16px)' : (5*16)+'px'}`, resize: 'vertical', overflow:'hidden'}}
                    onFocus={() => setExpand(true)}
                    onBlur={(e) => {setExpand(false); blur(e);}}
                    tabIndex={-1} >
            <Editor className={'mx-1'} onChange={change} language={"typescript"}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'typescript'} value={dview.jsxString} />
        </div>}
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

export const JsxEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <JsxEditorConnected {...{...props, children}} />;
}

JsxEditorComponent.cname = "JsxEditorComponent";
JsxEditorConnected.cname = "JsxEditorConnected";
JsxEditor.cname = "JsxEditor";
export default JsxEditor;
