import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import type {FakeStateProps} from "../../../joiner/types";
import {DState, DViewElement, LViewElement, Pointer, Defaults} from "../../../joiner";
import Editor, { useMonaco } from "@monaco-editor/react";

// import monacoTypes2 from '!raw-loader!../../../static/monacotypes';
import monacoTypes from '../../../static/monacotypes';

function JsxEditorComponent(props: AllProps) {
    const monaco = useMonaco();
    const view = props.view;
    const dview = view.__raw;
    const readOnly = props.readonly !== undefined ? props.readonly : !props.debugmode && Defaults.check(dview.id);
    const [jsx, setJsx] = useStateIfMounted(dview.jsxString||'');

    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if (value !== undefined) setJsx(value);
    }


    const blur = (evt: React.FocusEvent) => { // confirm in redux state for final state
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

    const unsupported = "is valid JS but is not supported by our compiler.";
    function warn(condition: any, txt: ReactNode){ return condition ? <b><span style={{color:'red'}}>Warning:</span>: {txt}</b> : undefined}
    return <>
        <label className={"ms-1 mb-1 d-block jj-editor-title"}>JSX Editor</label>
        {warn(jsx.match(/{\s*\(.+\?.+\:.+\)\s*}/gm),
            <b>prop=&#123;( expression ? exp_b : exp_c )&#125; syntax{unsupported}<br/>
            Please remove the round parenthesis, concatenate it with an empty string as in &#123;(a ? b : c)+''&#125;<br/>or replace the ternary operator as in (a && b || c).</b>)}
        {warn(jsx.indexOf('<>') >= 0,
            <b>JSX.Fragment {"<>"}{unsupported}<br/>
                Please replace it with an array [] instead.</b>)}
        {warn(jsx.indexOf('?.') >= 0,
            <b>Optional chaining {"?."} <br/>
                Please replace it with && instead. Eg: from (a?.b) to (a && a.b)</b>)}
        {warn(jsx.indexOf('??') >= 0,
            <b>Nullish coalescing {"??"}{unsupported}<br/>
                Please replace it with explicit null and undefined checks, or a ||.</b>)}
        <div className={"monaco-editor-wrapper"} style={{
            minHeight: '20ùpx', height:'200px'/*there is a bug of height 100% on childrens not working if parent have only minHeight*/,
            resize: 'vertical', overflow:'hidden'}} tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change} language={"typescript"}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'typescript'} value={dview.jsxString} />
        </div>
    </>;
}
interface OwnProps {
    viewid: Pointer<DViewElement, 1, 1, LViewElement>;
    readonly?: boolean;
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
