import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    CreateElementAction,
    DClass,
    DNamedElement,
    IStore,
    LGraph,
    LModel,
    MyProxyHandler,
} from "../../joiner";
import {DefaultNode} from "../../graph/defaultNode/DefaultNode";

import {DockLayout, DockMode, TabData} from "rc-dock";
import "rc-dock/dist/rc-dock.css";
import Draggable2 from "../../graph/draggable/Draggable2";
import ViewsEditor from "../rightbar/ViewsEditor/ViewsEditor";


interface ThisState {}
class DockComponent extends PureComponent<AllProps, ThisState> {
    model= this.props.model;
    graph = this.props.graph;

    constructor(props: AllProps, context: any) {
        super(props, context);
    }
    tab: TabData = { title: "Tab", group: "2", closable: true, content: <h5>Content</h5> };
    metamodel: TabData = { title: "Metamodel", group: "1", closable: false, content:
            <DefaultNode data={this.model.id} nodeid={this.graph.id} graphid={this.graph.id} />
    }
    box: any = {
        dockbox: {
            mode: "horizontal", children: [
                {
                    children: [{tabs: [{ ...this.metamodel, id: "1" }]}]
                },
                {
                    children: [{tabs: [{ ...this.tab, id: "2" }, { ...this.tab, id: "3" }]}]
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
