import React, {Dispatch, ReactElement} from "react";
import {DState} from "../../../redux/store";
import {connect} from "react-redux";
import {DUser, LProject, LUser, LViewElement, LViewPoint} from "../../../joiner";
import ViewsData from "./Views";
import ViewData from "./View";
import {FakeStateProps} from "../../../joiner/types";

function ViewsEditorComponent(props: AllProps) {
    const project = props.project;
    const stackViews = props.stackViews;
    const viewpoints = props.viewpoints;
    const debug = props.debug;

    return(<div>
        {(stackViews.length > 0) ?
            <ViewData view={stackViews[stackViews.length - 1]} viewpoints={viewpoints} debug={debug} /> :
            <ViewsData project={project} />}
    </div>);
}
interface OwnProps { }
interface StateProps {
    project: LProject;
    stackViews: LViewElement[];
    viewpoints: LViewPoint[];
    debug: boolean;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user = LUser.fromPointer(DUser.current);
    ret.project = user.project as LProject;
    ret.stackViews = LViewElement.fromPointer(state.stackViews);
    ret.viewpoints = LViewPoint.fromPointer(state.viewpoints);
    ret.debug = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewsEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewsEditorComponent);

export const ViewsEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ViewsEditorConnected {...{...props, children}} />;
}
export default ViewsEditor;
