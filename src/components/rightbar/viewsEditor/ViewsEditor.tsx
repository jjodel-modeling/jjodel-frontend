import React, {Dispatch, ReactElement} from "react";
import {DState} from "../../../redux/store";
import {connect} from "react-redux";
import {LViewElement, LViewPoint} from "../../../joiner";
import ViewsData from "./Views";
import ViewData from "./View";

function ViewsEditorComponent(props: AllProps) {

    const views = props.views;
    const stackViews = props.stackViews;
    const viewpoints = props.viewpoints;
    const debug = props.debug;

    return(<div>
        {(stackViews.length > 0) ?
            <ViewData view={stackViews[stackViews.length - 1]} viewpoints={viewpoints} debug={debug} /> :
            <ViewsData views={views} />}
    </div>);
}
interface OwnProps { }
interface StateProps {
    views: LViewElement[];
    stackViews: LViewElement[];
    viewpoints: LViewPoint[];
    debug: boolean;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.views = LViewElement.fromPointer(state.viewelements);
    ret.stackViews = LViewElement.fromPointer(state.stackViews);
    ret.viewpoints = LViewPoint.fromPointer(state.viewpoints);
    ret.views = ret.views.filter(view => !(view.viewpoint) || view.viewpoint?.id === state.viewpoint);
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
