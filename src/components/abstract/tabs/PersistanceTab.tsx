import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState, DModel} from "../../../joiner";
import {Firebase} from "../../../firebase";


function PersistanceTabComponent(props: AllProps) {
    const room = props.room;

    return(<div>
    </div>);
}
interface OwnProps {}
interface StateProps {room: string}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.room = state.room;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PersistanceTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PersistanceTabComponent);

export const PersistanceTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <PersistanceTabConnected {...{...props, children}} />;
}
export default PersistanceTab;
