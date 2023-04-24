import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore, LGraph, LModel, LPointerTargetable,} from "../../joiner";

import {DockLayout, TabData} from "rc-dock";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import EdgeEditor from "../rightbar/edgeEditor/EdgeEditor";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";
import ViewsEditor from "../rightbar/viewsEditor/ViewsEditor";
import TreeEditor from "../rightbar/treeEditor/treeEditor";
import ViewpointEditor from "../rightbar/viewpointsEditor/ViewpointsEditor";
import MetamodelTab from "./tabs/MetamodelTab";
import ModelTab from "./tabs/ModelTab";
import './style.scss';
import Console from "../rightbar/console/Console";
import PersistanceTab from "./tabs/PersistanceTab";


let windoww = window as any;
interface ThisState {}
class DockComponent extends PureComponent<AllProps, ThisState> {
    metamodel!: LModel;
    models!: LModel[];
    graphs!: LGraph[];

    metamodelTab!: TabData;
    modelTab!: TabData;

    persistance!: TabData;
    structureEditor!: TabData;
    treeEditor!: TabData;
    viewsEditor!: TabData;
    styleEditor!: TabData;
    edgeEditor!: TabData;
    viewpointEditor!: TabData;
    console!: TabData;
    // logger!: TabData;
    box: any;
    initialized: boolean = false;
    forcerebuildingdockstmp: number = 0;

    constructor(props: AllProps, context: any) {
        super(props, context);
        windoww.dockComponent = this;
    }


    init() {
        // if (this.model?.id === this.props.model.id) return; damiano: this was fixing load
        this.forcerebuildingdockstmp++;
        windoww.reloadDock = () => { this.forcerebuildingdockstmp++; this.forceUpdate(); } // for debugging
        // console.log("for load - fixed model id:", this.model?.id + "-->" + this.props.model?.id);
        this.initialized = true;
        this.metamodel = this.props.metamodel;
        this.models = this.props.models;
        this.graphs = this.props.graphs;

        this.metamodelTab = { title: "Metamodel", group: "1", closable: false, content:
            <MetamodelTab modelid={this.metamodel.id}  /> //graphid={this.graphs[0].id}

        };
        this.modelTab = { title: "Model", group: "1", closable: false, content:
            <ModelTab modelid={this.models[0].id} metamodelid={this.metamodel.id} /> //graphid={this.graphs[1].id}
        };
        this.persistance = { title: "Persistance", group: "2", closable: false, content: <PersistanceTab /> };
        this.structureEditor = { title: "Structure", group: "2", closable: false, content: <StructureEditor /> };
        this.treeEditor = { title: "Tree View", group: "2", closable: false, content: <TreeEditor /> };
        this.viewsEditor = { title: "Views", group: "2", closable: false, content: <ViewsEditor /> };
        this.styleEditor = { title: "Node", group: "2", closable: false, content: <StyleEditor /> };
        this.edgeEditor = { title: "Edges", group: "2", closable: false, content: <EdgeEditor /> };
        this.viewpointEditor = { title: "Viewpoints", group: "2", closable: false, content: <ViewpointEditor /> };
        this.console = { title: "Console", group: "2", closable: false, content: <Console /> };
        // this.logger = { title: "Logger", group: "2", closable: true, content: <Logger /> };
        this.box = {
            dockbox: {
                mode: "horizontal", children: [
                    {
                        children: [{tabs: [
                            {...this.metamodelTab, id: '1'},
                            {...this.modelTab, id: '2'}
                        ]}]
                    },
                    {
                        children: [{tabs: [
                            { ...this.persistance, id: '0' },
                            { ...this.structureEditor, id: '1' },
                            { ...this.treeEditor, id: '2' },
                            { ...this.viewsEditor, id: '3' },
                            { ...this.viewpointEditor, id: '4' },
                            { ...this.styleEditor, id: '5' },
                            { ...this.edgeEditor, id: '6' },
                            { ...this.console, id: '7' },
                        ]}]
                    }
                ]
            }
        }
    }

    render(): ReactNode {
        // if (!this.initialized && this.props.model) this.init(); damiano: this was fixing load
        if (!this.initialized) this.init();
        else {
            this.init(); // fix load crash
        }
        // if (!this.box) this.box = {dockbox: {mode: "horizontal", children: [{children: [{tabs: [{id: "1", title: "loading", group: "2", closable: false, content: <div> loading model... </div> }]}]}]}};


        return (<>
            {/* todo: key forces reupdate and re-read this.box. find a better way*/}
            <DockLayout defaultLayout={this.box} style={{position: "absolute", left: 5, top: 5, right: 5, bottom: 5}} key={this.forcerebuildingdockstmp}/>
        </>);
    }
}

interface OwnProps {}
interface StateProps {graphs: LGraph[], metamodel: LModel, models: LModel[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const metamodel: LModel = LPointerTargetable.from(state.models[0]);
    const model: LModel = LPointerTargetable.from(state.models[1]);
    const graphs: LGraph[] = [];
    for(let pointer of state.graphs) {
        graphs.push(LGraph.fromPointer(pointer));
    }
    const ret: StateProps = {graphs, metamodel, models: [model]};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const DockConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(DockComponent);

export const Dock = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <DockConnected {...{...props, childrens}} />;
}
export default Dock;
