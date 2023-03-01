import React, {Dispatch, ReactElement} from "react";
import {IStore} from "../../../redux/store";
import {connect} from "react-redux";
import {LViewElement} from "../../../view/viewElement/view";
import {useStateIfMounted} from "use-state-if-mounted";
import ViewsData from "./Views";
import ViewData from "./View";


function ViewsEditorComponent(props: AllProps) {

    const views = props.views;
    const stackViews = props.stackViews;

    return(<div>
        {(stackViews.length > 0) ? <ViewData view={stackViews[stackViews.length - 1]} /> : <ViewsData views={views} />}
    </div>);
}
interface OwnProps { }
interface StateProps { views: LViewElement[]; stackViews: LViewElement[]; }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.views = LViewElement.fromPointer(state.viewelements.slice(0)); //10
    ret.stackViews = LViewElement.fromPointer(state.stackViews);
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
