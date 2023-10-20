import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import Editor from "@monaco-editor/react";
import {DState, DViewElement, LViewElement, Pointer, U} from "../../../joiner";


function OclEditorComponent(props: AllProps) {
    const view = props.view;
    if(!view) return(<></>);
    const readOnly = props.readonly !== undefined ? props.readonly : U.getDefaultViewsID().includes(view.id);

    const change = (value: string|undefined) => {
        if (value !== undefined) view.query = value;
    }

    return <div style={{height: '5em'}}>
        <label className={'ms-1 mb-1'}>OCL Editor</label>
        <Editor className={'mx-1'} onChange={change}
                options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                defaultLanguage={'js'} value={view.query}/>
    </div>;
}
interface OwnProps {
    readonly?: boolean;
    viewid: Pointer<DViewElement, 1, 1, LViewElement>; }
interface StateProps { view: LViewElement }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.view = LViewElement.fromPointer(ownProps.viewid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const OclEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(OclEditorComponent);

export const OclEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <OclEditorConnected {...{...props, children}} />;
}

OclEditorComponent.cname = "OclEditorComponent";
OclEditorConnected.cname = "OclEditorConnected";
OclEditor.cname = "OclEditor";
export default OclEditor;
