import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {IStore} from "../../redux/store";
import './topbar.scss';

// private
interface ThisState {
    listAllStateVariables: boolean,
}

class ExampleComponent extends PureComponent<AllProps, ThisState>{
    render(): ReactNode {
        return (<>
            <div>topbar to do</div>
        </>); }
}

// private
interface OwnProps { }
// private
interface StateProps { }

// private
interface DispatchProps { }


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export default connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ExampleComponent);
