import React, {Dispatch, ReactElement} from "react";
import {DState} from "../../../redux/store";
import {connect} from "react-redux";
import {DUser, LProject, LUser, LViewElement, LViewPoint} from "../../../joiner";
import ViewsData from "./Views";
import ViewData from "./View";
import {FakeStateProps} from "../../../joiner/types";
import {useStateIfMounted} from "use-state-if-mounted";

function ViewsEditorComponent(props: AllProps) {
    const stackViews = props.stackViews;
    const [selectedView, setView] = useStateIfMounted(undefined as (LViewElement | undefined));

    return(<div>
        {selectedView ?
            <ViewData view={selectedView} setSelectedView={setView} /> :
            <ViewsData setSelectedView={setView} />}
    </div>);
}
interface OwnProps { }
interface StateProps {
    stackViews: LViewElement[];
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
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
