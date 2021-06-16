import React, {DetailedReactHTMLElement, Dispatch, PureComponent, ReactChild, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import {Dictionary, GObject} from "../../joiner/types";
import PanelComponent, {PanelOwnProps} from "./panelComponent";
import {IStore} from "../../redux/store";
import './panelContainerComponent.css';
// private
interface ThisState {
    // listAllStateVariables: boolean,
    // panels: PanelData[];
    panelSummary: PanelSummary;
    panelCreatedCountForReRender: number;
}

// condiviso solo tra panelContainer e panelComponent

// condiviso solo tra panelContainer e panelComponent
export class PanelData{
    constructor(
                public panelDockSide: "top"|"bottom"|"left"|"right",
                public panelDockLevel: number = 1,
                public panelDockSubPosition: number = 1,
                public canMove: boolean = true){

    }

    static fromComponent(panelComponent: PanelComponent): PanelData { return {...panelComponent.props.panelData}; }
}
type PanelDockDirection = 'top' | 'left' | 'center' | 'right' | 'bottom';
type PanelSummary2 = Dictionary<PanelDockDirection, PanelDirectionSummary>;
class PanelSummary{
    top: PanelDirectionSummary = new PanelDirectionSummary();
    left: PanelDirectionSummary = new PanelDirectionSummary();
    center: PanelDirectionSummary = new PanelDirectionSummary();
    right: PanelDirectionSummary = new PanelDirectionSummary();
    bottom: PanelDirectionSummary = new PanelDirectionSummary();
}
class PanelDirectionSummary{
    maxLevels: number = 0;
    subElementPerLevel: PanelData[][] = [];//Map<number, PanelData[]> = new Map();
    // elements: PanelData[] = [];
}

class PanelContainerComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
        this.state = {panelSummary: new PanelSummary(), panelCreatedCountForReRender: 0};
        this.dockContainers = {left:{}, top: {}, right:{}, bottom: {}};
    }

    public dockContainers: Dictionary<string, Dictionary<number, Element | null>> = {};
    public countDocks(): GObject{
        return {
            top: Object.keys(this.dockContainers["top"] as any),
            bottom: Object.keys(this.dockContainers["bottom"] as any),
            left: Object.keys(this.dockContainers["left"] as any),
            right: Object.keys(this.dockContainers["right"] as any),
        };
    }
    public onCreatePanel(children: PanelComponent): void{
        // problema: quando aggiorno lo stato interno al genitore (Creando docks e cose varie, lui vede le prop by reference immutate, ma è mutato il deep-content. soluzioni: passare fake props che triggerano re-render or manual re-render)
        console.trace('xxx pre oncreatepanel', this.countDocks());
        // const panels: PanelData[] = [...this.state.panels];
        const panelSummary: PanelSummary = {...this.state.panelSummary};
        const newPanelData: PanelData = PanelData.fromComponent(children);
        const direction: PanelDirectionSummary = panelSummary[newPanelData.panelDockSide];
        direction.maxLevels = Math.max(direction.maxLevels, newPanelData.panelDockLevel);
        direction.subElementPerLevel[newPanelData.panelDockLevel] = [ ...(direction.subElementPerLevel[newPanelData.panelDockLevel] || []), newPanelData];
        // direction.elements.push(newPanelData);
        // panels.push(new PanelData(children));
        let dockSide: Dictionary<string, Element> = {};
        // const onSummaryUpdate = () => {};
        const onSummaryUpdate = () => this.forceUpdate();
        this.setState( {panelSummary, /*panelCreatedCountForReRender: this.state.panelCreatedCountForReRender + 1*/}, onSummaryUpdate); // force sub-components to re-update (by passing new prop when changing deep state
    }
    public onRemovePanel(children: PanelComponent): void{
        // todo
    }
    render(): ReactNode {
        const dockSides: PanelDockDirection[] = ['top', 'left', 'center', 'right', 'bottom']; // Object.keys(this.state.panelSummary); //
        const topDockLevels = [];

        // todo: credo sia sbagliato sicuramente nei tipi, forse a runtime
        const childrenPanels = this.props.children ? (this.props.children as any).map(
            (child: any) => { return React.cloneElement(child as any, { parentComponent: this, fakeProps: "fakeProps", forceReRender: {/*always new object shallowly different from old one*/} })}) : [];
        return (<>
            <div className="panelContainer">
                { /*todo: sta parte non funziona e poi dovrei assegnare l'elemento DOM al portale (Tramite document.getelementbyid? la ref di react punta ai componenti non ai nodi DOM*/

                dockSides.map( side =>
                    <div className={"panelDockSide " + side}>{
                            this.state.panelSummary[side].subElementPerLevel.map(
                                (level: PanelData[], i) => <div className={"panelDockLevel"} data-level={i} ref={ el => this.dockContainers[side][i] = el} />
                            )}
                    </div>)
                }
                <div className="pendingPanelHome" style={{display:'none'}}>
                    { /* this.props.children */ }
                    {childrenPanels}
                </div>
            </div>
        </>); }
}

// private
// interface StateProps {}

// private
// interface DispatchProps { }

// private
interface OwnProps {
    children: ReactNode;// ReactElement<PanelOwnProps, PanelContainerComponent>[];

}

// private
type AllProps = OwnProps; //StateProps & DispatchProps & OwnProps;

////// mapper func
/*
function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }
*/
/*
export default connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(PanelContainerComponent);*/
export default PanelContainerComponent;
