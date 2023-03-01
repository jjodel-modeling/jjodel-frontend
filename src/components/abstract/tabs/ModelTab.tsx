import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import type {Pointer, DModel, DGraph} from "../../../joiner";
import {LGraph, LModel} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ToolBar from "../../toolbar/ToolBar";
import PendingEdge from "../../../graph/edge/PendingEdge";
import ContextMenu from "../../toolbar/ContextMenu";


function ModelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;

    return(<div className={'w-100 h-100'}>
        <ContextMenu />
        <PendingEdge />
        <div className={'d-flex'}>
            <ToolBar model={model.id} isMetamodel={model.isMetamodel} metamodelId={props.metamodelid} />
            <div style={{marginLeft: '6.55em'}}>
                <DefaultNode data={model.id} nodeid={graph.id} graphid={graph.id} />
            </div>
        </div>
    </div>);
}
interface OwnProps {
    modelid: Pointer<DModel, 1, 1, LModel>,
    graphid: Pointer<DGraph, 1, 1, LGraph>,
    metamodelid?: Pointer<DModel, 1, 1, LModel>,
}
interface StateProps { model: LModel, graph: LGraph }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    ret.graph = LGraph.fromPointer(ownProps.graphid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ModelTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ModelTabComponent);

export const ModelTab = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ModelTabConnected {...{...props, childrens}} />;
}
export default ModelTab;
