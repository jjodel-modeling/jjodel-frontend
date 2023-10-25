import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DProject, DState, DUser} from "../../../joiner";
import {FakeStateProps} from "../../../joiner/types";
import DockManager from "../DockManager";
import TreeEditor from "../../rightbar/treeEditor/treeEditor";

function TestTabComponent(props: AllProps) {
    const click = () => {
    }

    return(<div className={'p-2 border border-dark'}>
        <button onClick={click}>click</button>
    </div>);
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


const TestTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TestTabComponent);

const TestTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TestTabConnected {...{...props, children}} />;
}
export default TestTab;
