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


let windoww = window as any;
interface ThisState {}
class DockComponent extends PureComponent<AllProps, ThisState> {
    metamodel!: LModel;
    models!: LModel[];
    graphs!: LGraph[];

    metamodelTab!: TabData;
    modelTab!: TabData;

    structureEditor!: TabData;
    treeEditor!: TabData;
    viewsEditor!: TabData;
    styleEditor!: TabData;
    edgeEditor!: TabData;
    viewpointEditor!: TabData;
    console!: TabData;
    box: any;
    initialized: boolean = false;

    constructor(props: AllProps, context: any) {
        super(props, context);
        windoww.dockComponent = this;
    }
    init() {
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
        this.structureEditor = { title: "Structure", group: "2", closable: false, content: <StructureEditor /> };
        this.treeEditor = { title: "Tree View", group: "2", closable: false, content: <TreeEditor /> };
        this.viewsEditor = { title: "Views", group: "2", closable: false, content: <ViewsEditor /> };
        this.styleEditor = { title: "Node", group: "2", closable: false, content: <StyleEditor /> };
        this.edgeEditor = { title: "Edges", group: "2", closable: false, content: <EdgeEditor /> };
        this.viewpointEditor = { title: "Viewpoints", group: "2", closable: false, content: <ViewpointEditor /> };
        this.console = { title: "Console", group: "2", closable: false, content: <Console /> };
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
        if(!this.initialized) this.init();
        return (<DockLayout defaultLayout={this.box} />);
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
