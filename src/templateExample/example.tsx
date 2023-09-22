import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {DState, Input} from "../joiner";
import './example.scss';
import {InputConnected} from "../components/forEndUser/Input";

// private
interface ThisState {
    listAllStateVariables: boolean,
}

class ExampleComponent_disconnected extends PureComponent<AllProps, ThisState>{
    static cname: string;
    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        return (<>
                <div/>
            </>); }
    }

// private
interface OwnProps {
    // propsRequestedFromJSX_AsAttributes: string;
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

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const ExampleComponent = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ExampleComponent_disconnected);


ExampleComponent_disconnected.cname = "ExampleComponent_disconnected";
ExampleComponent.cname = "ExampleComponent";
