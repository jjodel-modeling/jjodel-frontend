import React, {Component, Dispatch, PureComponent, ReactNode} from "react";
// import { Portal } from 'react-portal';
import * as ReactDOM from "react-dom";
import PanelContainerComponent, {PanelData} from "./PanelContainerComponent";
import {Dictionary} from "../../joiner/types";
// enum dockMode {none, left, right, top, bottom}
/*todo: voglio una griglia come photoshop dove posso mettere N strati di left-bar e un elemento può mettersi in seconda fila o condividere orizzontalmente la prima fila verticale (o verticalmente la prima fila orizzontale di topbar)
e devce essere persistente e ricordato in user preference (non in viewpoint)*/


////////////////////// start
// import { connect } from "react-redux";
// import {IStore} from "../../redux/store";


// private
interface ThisState {
    listAllStateVariables: boolean,
}

class PanelComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
        this.props.parentComponent?.onCreatePanel(this);
    }

    componentDidMount(): void { }
    componentWillUnmount(): void { this.props.parentComponent?.onRemovePanel(this); }

    render(): ReactNode {
        const content = <div className="panelButtonsContainer">
            <span>panelDataDock: {this.props.panelData.panelDockSide} fakeProps: { this.props.parentComponent ? "parented" : "___"}</span>
            {this.props.children}
        </div>;
        console.trace("xxx: panel render", this.props.parentComponent?.countDocks());
        console.log('render subpanel, parent:', this.props.parentComponent, 'parent.dock', this.props?.parentComponent?.dockContainers['bottom'][1], 'parent.dock[?bottom?]:', this.props?.parentComponent?.dockContainers?.[this.props.panelData.panelDockSide]?.[this.props.panelData.panelDockLevel],
            'bottom['+this.props.panelData.panelDockSide+']['+this.props.panelData.panelDockLevel+']', this.props?.parentComponent?.dockContainers?.[this.props.panelData.panelDockSide][this.props.panelData.panelDockLevel]);
        const container: Element | null = this.props.parentComponent?.dockContainers ? this.props.parentComponent.dockContainers[this.props.panelData.panelDockSide][this.props.panelData.panelDockLevel] : null;
        console.log('createPortal?', {container, parent:  this.props.parentComponent, panelData: this.props.panelData});
        return container ? ReactDOM.createPortal(content, container) : content;
    }
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
    // containers?: Dictionary<string, Dictionary<number, Element | null>>;
    panelData: PanelData;
    parentComponent?: PanelContainerComponent;
}
export type PanelOwnProps = OwnProps;
// private
// interface StateProps {}

// private
// interface DispatchProps {}


// private
type AllProps = OwnProps;// & StateProps & DispatchProps;

/*
function mapStateToProps(state: IStore, ownProps: AllProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }*/


export default PanelComponent;
/*
export default connect<StateProps, DispatchProps, AllProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(PanelComponent);
*/
