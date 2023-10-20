import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import {DState, DViewElement, LViewElement, Pointer, U} from "../../../joiner";
import Editor from "@monaco-editor/react";


function JsxEditorComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly !== undefined ? props.readonly : !props.debugMode && U.getDefaultViewsID().includes(view.id);
    const [jsx, setJsx] = useStateIfMounted(view.jsxString);

    const change = (value: string|undefined) => {
        if(value !== undefined) setJsx(value);
    }


    const blur = (evt: React.FocusEvent<HTMLDivElement>) => {
        view.jsxString = jsx;
    }

    return <div style={{height: '20em'}} tabIndex={-1} onBlur={blur}>
        <label className={'ms-1 mb-1'}>JSX Editor</label>
        <Editor className={'mx-1'} onChange={change}
                options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                defaultLanguage={'html'}  value={view.jsxString} />
    </div>;
}
interface OwnProps {
    viewid: Pointer<DViewElement, 1, 1, LViewElement>;
    readonly?: boolean;
}

interface StateProps {
    view: LViewElement;
    debugMode: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.debugMode = state.debug;
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
