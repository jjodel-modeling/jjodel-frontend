import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {IStore} from "../../joiner";
import './toolbox.scss';

// private
interface ThisState {
    listAllStateVariables: boolean,
}

class ExampleComponent extends PureComponent<AllProps, ThisState>{
    render(): ReactNode {
        return (<>
            <div>toolbox to do</div>
        </>); }
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    classList: "IClass"[];
}

// private
interface DispatchProps {
    addInstance: (supertype: "IClass[]") => void;
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
)(ExampleComponent);
