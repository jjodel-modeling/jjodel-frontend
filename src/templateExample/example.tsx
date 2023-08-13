import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {DState} from "../joiner";
import './example.scss';

// private
interface ThisState {
    listAllStateVariables: boolean,
}

class ExampleComponent extends PureComponent<AllProps, ThisState>{
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


export default connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ExampleComponent);
