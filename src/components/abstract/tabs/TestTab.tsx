import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {DUser, GObject, LModelElement, Selectors, U} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";

function TestTabComponent(props: AllProps) {

    const selected = props.selected;

    const click = () => {
    }

    return(<div>
        <button onClick={click}>click</button>
        {selected?.id}
    </div>);
}
interface OwnProps {}
interface StateProps {selected: LModelElement|null}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.selected = LModelElement.fromPointer(state.selected[DUser.current] as any);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


const TestTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TestTabComponent);

const TestTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TestTabConnected {...{...props, children}} />;
}
export default TestTab;
