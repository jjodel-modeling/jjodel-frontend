import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore, LGraph, LModel, LPointerTargetable, StyleEditor,} from "../../joiner";
import {DefaultNode} from "../../graph/defaultNode/DefaultNode";

import {DockLayout, TabData} from "rc-dock";
import "rc-dock/dist/rc-dock.css";
import ViewsEditor from "../rightbar/ViewsEditor/ViewsEditor";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import ToolBar from "../toolbar/ToolBar";
import PendingEdge from "../../graph/edge/PendingEdge";
import ContextMenu from "../toolbar/ContextMenu";
import EdgesManager from "../../graph/edge/EdgesManager";
import M1 from "../../graph/model/M1";
import {Xwrapper} from "react-xarrows";


let windoww = window as any;
interface ThisState {}
class DockComponent extends PureComponent<AllProps, ThisState> {
    model!: LModel;
    graph!: LGraph;
    metamodel!: TabData;
    m1!: TabData;
    structureEditor!: TabData;
    viewsEditor!: TabData;
    styleEditor!: TabData;
    logger!: TabData;
    box: any;
    initialized: boolean = false;

    constructor(props: AllProps, context: any) {
        super(props, context);
        windoww.dockComponent = this;
    }
    init() {
        this.initialized = true;
        this.model = this.props.model;
        this.graph = this.props.graph;
        this.metamodel = { title: "Metamodel", group: "1", closable: false, content:
                <div>
                    <ContextMenu />
                    {/*<EdgesManager />*/}
                    {/*Perche mi chiede source e user come OwnProps se li ho definiti come StateProps ? */}
                    <PendingEdge  source={undefined} user={undefined} />
                    <ToolBar model={this.model.id} />
                    <DefaultNode data={this.model.id} nodeid={this.graph.id} graphid={this.graph.id} />
                </div>
        };
        this.m1 = { title: "Model", group: "1", closable: false, content:
                <div className={"h-100 w-100"}>
                    <M1 modelid={this.model.id} />
                </div>
        };
        this.structureEditor = { title: "Structure", group: "2", closable: false, content: <StructureEditor /> };
        this.viewsEditor = { title: "Views", group: "2", closable: false, content: <ViewsEditor /> };
        this.styleEditor = { title: "Node", group: "2", closable: false, content: <StyleEditor /> };
        this.box = {
            dockbox: {
                mode: "horizontal", children: [
                    {
                        children: [{tabs: [{...this.metamodel, id: '1'}, {...this.m1, id: '2'}]}]
                    },
                    {
                        children: [{tabs: [{ ...this.structureEditor, id: "2" }, { ...this.viewsEditor, id: "3" }, { ...this.styleEditor, id: "4" }]}]
                    }
                ]
            }
        }
    }

    render(): ReactNode {
        if (!this.initialized && this.props.model) this.init();
        if (!this.box) this.box = {dockbox: {mode: "horizontal", children: [{children: [{tabs: [{id: "1", title: "loading", group: "2", closable: false, content: <div> loading model... </div> }]}]}]}};
        return (<>
            <DockLayout defaultLayout={this.box} style={{position: "absolute", left: 5, top: 5, right: 5, bottom: 5}} />
        </>);
    }
}

interface OwnProps {}
interface StateProps {graph: LGraph, model: LModel}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const modelPointer = state.models[0];
    const model: LModel = LPointerTargetable.from(modelPointer);
    const graphPointer = state.graphs[0];
    const graph: LGraph = LPointerTargetable.from(graphPointer);
    const ret: StateProps = {graph, model};
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
