import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {IStore} from "../../redux/store";
import PanelContainerComponent, {PanelData} from "../abstract/PanelContainerComponent";
import PanelComponent from "../abstract/panelComponent";

// private
interface ThisState {
    listAllStateVariables: boolean,
}

class MainComponent extends PureComponent<AllProps, ThisState>{
    panelContainer?: PanelContainerComponent;
    render(): ReactNode {
        return (<>
            <PanelContainerComponent ref={(el => this.panelContainer = el ? el : undefined)}>
                <PanelComponent parentComponent={this.panelContainer} panelData={new PanelData( "top", 1, 1)}><h1>content of topbar</h1></PanelComponent>
                <PanelComponent parentComponent={this.panelContainer} panelData={new PanelData("bottom", 1, 1)}><h1>content of bottom bar</h1></PanelComponent>
            </PanelContainerComponent>
            <div
            />
        </>); }
}

// private
interface StateProps {
    propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

function funzioneTriggeraAzioneDaImportare(putCorrectRequiredParams?: boolean): void {}

// private
interface DispatchProps {
    propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}

// private
type AllProps = StateProps & DispatchProps & OwnProps;

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
)(MainComponent);
