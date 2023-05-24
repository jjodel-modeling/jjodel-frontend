import React, {Dispatch, ReactElement} from "react";
import {IStore} from "../../../redux/store";
import {connect} from "react-redux";
import {LViewElement} from "../../../view/viewElement/view";
import ViewsData from "./Views";
import ViewData from "./View";
import {LViewPoint} from "../../../view/viewPoint/viewpoint";


function ViewsEditorComponent(props: AllProps) {

    const views = props.views;
    const stackViews = props.stackViews;
    const viewpoints = props.viewpoints;

    return(<div>
        {(stackViews.length > 0) ?
            <ViewData view={stackViews[stackViews.length - 1]} viewpoints={viewpoints} /> :
            <ViewsData views={views} />}
    </div>);
}
interface OwnProps { }
interface StateProps {
    views: LViewElement[];
    stackViews: LViewElement[];
    viewpoints: LViewPoint[];
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.views = LViewElement.fromPointer(state.viewelements.slice(10));
    ret.stackViews = LViewElement.fromPointer(state.stackViews);
    ret.viewpoints = LViewPoint.fromPointer(state.viewpoints);
    ret.views = ret.views.filter(view => !(view.viewpoint) || view.viewpoint?.id === state.viewpoint);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewsEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ViewsEditorComponent);

export const ViewsEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ViewsEditorConnected {...{...props, childrens}} />;
}
export default ViewsEditor;
