import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    CreateElementAction,
    DClass,
    DNamedElement,
    IStore,
    LGraph,
    LModel,
    MyProxyHandler, StyleEditor,
} from "../../joiner";
import {DefaultNode} from "../../graph/defaultNode/DefaultNode";

import {DockLayout, DockMode, TabData} from "rc-dock";
import "rc-dock/dist/rc-dock.css";
import Draggable2 from "../../graph/draggable/Draggable2";
import ViewsEditor from "../rightbar/ViewsEditor/ViewsEditor";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import Logger from "../rightbar/logger/Logger";
import {Xwrapper} from "react-xarrows";
import Edges from "../../graph/edge/Edges";
import ToolBar from "../toolbar/ToolBar";


interface ThisState {}
class DockComponent extends PureComponent<AllProps, ThisState> {
    model= this.props.model;
    graph = this.props.graph;

    constructor(props: AllProps, context: any) {
        super(props, context);
    }
    metamodel: TabData = { title: "Metamodel", group: "1", closable: false, content:
            <Xwrapper>
                <ToolBar model={this.model.id} />
                <DefaultNode data={this.model.id} nodeid={this.graph.id} graphid={this.graph.id} />
                <Edges graphID={this.graph.id} nodeID={this.graph.id} />
            </Xwrapper>
    }
    structureEditor: TabData = { title: "Structure", group: "2", closable: false, content:
            <StructureEditor />
    }
    viewsEditor: TabData = { title: "Views", group: "2", closable: false, content:
            <ViewsEditor />
    }
    logger: TabData = { title: "Logger", group: "2", closable: true, content: <Logger /> };
    box: any = {
        dockbox: {
            mode: "horizontal", children: [
                {
                    children: [{tabs: [{ ...this.metamodel, id: "1" }]}]
                },
                {
                    children: [{tabs: [{ ...this.structureEditor, id: "2" }, { ...this.viewsEditor, id: "3" }]}]
                }
            ]
        }
    };

    render(): ReactNode {
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
    const model: LModel = MyProxyHandler.wrap(modelPointer);
    const graphPointer = state.graphs[0];
    const graph: LGraph = MyProxyHandler.wrap(graphPointer);
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
