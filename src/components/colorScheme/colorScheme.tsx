import React, {Dispatch, PureComponent, ReactNode} from "react";
import {connect} from "react-redux";
import type {DGraph, Dictionary, DocString, DState, Pointer} from "../../joiner";
import './defaultColorScheme.scss';

// private
interface ThisState {
}

class ColorSchemeComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        let userColorSchemeCss = '';
        for (let graphid in this.props.userMadeColorScheme) {
            userColorSchemeCss += "\n\n #graph_" + graphid + "{ \n" + this.props.userMadeColorScheme[graphid] + "\n}";
        }
        // NB: default styles are in scss file and are not editable.
        return <style>{userColorSchemeCss}</style>; }
}

// private
interface OwnProps {
    // propsRequestedFromJSX_AsAttributes: string;
}
// private
interface StateProps {
    userMadeColorScheme: Dictionary<Pointer<DGraph>, DocString<'CSS variables'>>;
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
    ret.userMadeColorScheme = {};
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }

export const ColorScheme = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ColorSchemeComponent);
export default ColorScheme;
