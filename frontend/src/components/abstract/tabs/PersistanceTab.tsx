import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {DState, DModel} from "../../../joiner";
//import {Firebase} from "../../../firebase";


function PersistanceTabComponent(props: AllProps) {

    return(<div>
    </div>);
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
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

export const PersistanceTab = (props: OwnProps, childrens: ReactNode[] = []): ReactElement => {
    // @ts-ignore children
    return <PersistanceTabConnected {...{...props, childrens}} />;
}
export default PersistanceTab;
