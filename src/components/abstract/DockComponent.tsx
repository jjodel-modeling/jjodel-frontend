import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore, LGraph, LModel, LPointerTargetable,} from "../../joiner";
import {DefaultNode} from "../../graph/defaultNode/DefaultNode";

import {DockLayout, TabData} from "rc-dock";
import "rc-dock/dist/rc-dock.css";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import ToolBar from "../toolbar/ToolBar";
import PendingEdge from "../../graph/edge/PendingEdge";
import ContextMenu from "../toolbar/ContextMenu";
import EdgeEditor from "../rightbar/edgeEditor/EdgeEditor";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";
import ViewsEditor from "../rightbar/viewsEditor/ViewsEditor";
import TreeEditor from "../rightbar/treeEditor/treeEditor";
import ViewpointEditor from "../rightbar/viewpointsEditor/ViewpointsEditor";


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
    logger!: TabData;
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
                <div className={"h-100 w-100"}>
                    <ContextMenu />
                    <PendingEdge  source={undefined} user={undefined} />
                    <ToolBar model={this.metamodel.id} isMetamodel={true} />
                    <DefaultNode data={this.metamodel.id} nodeid={this.graphs[0].id} graphid={this.graphs[0].id} />
                </div>
        };
        this.modelTab = { title: "Model", group: "1", closable: false, content:
                <div className={"h-100 w-100"}>
                    <ContextMenu />
                    <ToolBar model={this.models[0].id} isMetamodel={false} metamodelId={this.props.metamodel.id} />
                    <DefaultNode data={this.models[0].id} nodeid={this.graphs[1].id} graphid={this.graphs[1].id} />
                </div>
        };
        this.structureEditor = { title: "Structure", group: "2", closable: false, content: <StructureEditor /> };
        this.treeEditor = { title: "Tree Editor", group: "2", closable: false, content: <TreeEditor /> };
        this.viewsEditor = { title: "Views", group: "2", closable: false, content: <ViewsEditor /> };
        this.styleEditor = { title: "Node", group: "2", closable: false, content: <StyleEditor /> };
        this.edgeEditor = { title: "Edge Editor", group: "2", closable: false, content: <EdgeEditor /> };
        this.viewpointEditor = { title: "Viewpoints", group: "2", closable: false, content: <ViewpointEditor /> };
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
                            //{ ...this.styleEditor, id: '5' },
                            //{ ...this.edgeEditor, id: '6' },
                        ]}]
                    }
                ]
            }
        }
    }

    render(): ReactNode {
        if(!this.initialized) this.init();
        // if (!this.initialized && this.props.model) this.init();
        // if (!this.box) this.box = {dockbox: {mode: "horizontal", children: [{children: [{tabs: [{id: "1", title: "loading", group: "2", closable: false, content: <div> loading model... </div> }]}]}]}};
        return (<>
            <DockLayout defaultLayout={this.box} style={{position: "absolute", left: 5, top: 5, right: 5, bottom: 5}} />
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
