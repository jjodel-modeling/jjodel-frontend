import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import Editor from "@monaco-editor/react";
import {DState, DViewElement, LViewElement, Pointer, U} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {FakeStateProps} from "../../../joiner/types";

function OclEditorComponent(props: AllProps) {
    const view = props.view;
    const readOnly = U.getDefaultViewsID().includes(view.id);
    const [ocl, setOcl] = useStateIfMounted(view.oclCondition);

    const change = (value: string|undefined) => {
        if(value !== undefined) setOcl(value);
    }

    return <div style={{height: '5em'}} tabIndex={-1} onBlur={e => view.oclCondition = ocl}>
        <label className={'ms-1 mb-1'}>OCL Editor</label>
        <Editor className={'mx-1'} onChange={change}
                options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                defaultLanguage={'js'} value={view.oclCondition} />
    </div>;
}
interface OwnProps { viewid: Pointer<DViewElement, 1, 1, LViewElement>; }
interface StateProps { view: LViewElement }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
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
