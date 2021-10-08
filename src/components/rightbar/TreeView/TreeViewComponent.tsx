import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {IStore} from "../../../joiner";
import '../rightbar.scss';
import './treeview.scss';

// private
interface ThisState {
    listAllStateVariables: boolean,
}

class TreeViewComponent extends PureComponent<AllProps, ThisState>{
    render(): ReactNode {
        return (<>
            <div>tree view todo</div>
        </>); }
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


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
)(TreeViewComponent);
