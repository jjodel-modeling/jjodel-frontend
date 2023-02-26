import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {DPointerTargetable, DViewElement, GObject, LPointerTargetable, LViewElement, Pointer} from "../../../joiner";
import Editor from "@monaco-editor/react";


function OclEditorComponent(props: AllProps) {
    const view = props.view;

    const change = (value: string|undefined) => {
        if(value !== undefined) view.query = value;
    }

    return <div style={{height: '5em'}}>
        <label className={'ms-1'}>OCL Editor</label>
        <Editor className={'h-auto mx-1'} onChange={change}
                defaultLanguage={'js'} value={view.query} />
    </div>;
}
interface OwnProps { viewid: Pointer<DViewElement, 1, 1, LViewElement>; }
interface StateProps { view: LViewElement }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.view = LViewElement.fromPointer(ownProps.viewid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const OclEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(OclEditorComponent);

export const OclEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <OclEditorConnected {...{...props, childrens}} />;
}
export default OclEditor;
