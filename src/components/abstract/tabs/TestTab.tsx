import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState} from "../../../joiner";
import {FakeStateProps, Selected} from "../../../joiner/types";

function TestTabComponent(props: AllProps) {

    const selected = props.selected;

    return(<div className={'p-2 border border-dark'}>
        {JSON.stringify(selected)}
    </div>);
}
interface OwnProps {}
interface StateProps {selected: Selected}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.selected = state.selected;
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
