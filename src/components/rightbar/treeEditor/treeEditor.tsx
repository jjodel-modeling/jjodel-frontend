import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState, DUser, LGraphElement} from "../../../joiner";
import {FakeStateProps} from "../../../joiner/types";
import Tree from "../../forEndUser/Tree";

function TreeEditorComponent(props: AllProps) {
    const node = props.node;
    const data = node?.model;
    if(!data) return(<></>);
    return(<div className={'p-2'}>
        <Tree data={data} />
    </div>)
}
interface OwnProps { }
interface StateProps {
    node: LGraphElement|null;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeid = state.selected[DUser.current];
    if(nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    else ret.node = null;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TreeEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TreeEditorComponent);

export const TreeEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TreeEditorConnected {...{...props, children}} />;
}
export default TreeEditor;
