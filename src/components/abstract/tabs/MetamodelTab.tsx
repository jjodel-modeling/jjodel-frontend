import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import type {DModel, Pointer} from "../../../joiner";
import {DState, CreateElementAction, DGraph, LGraph, LModel, Edge} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ToolBar from "../../toolbar/ToolBar";
import ContextMenu from "../../contextMenu/ContextMenu";
import EdgesManager from "../../../graph/edges/EdgesManager";

function PendingEdge(props: any){ return <>{/* todo: <DamEdge start={store.getState().pendingEdge.start} end={} />*/}</>}

function MetamodelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;

    if (!model) return(<>closed tab</>);
    if (!graph) {
        CreateElementAction.new(DGraph.new(0, model.id));
        return(<div style={{width: "100%", height: "100%", display: "flex"}}>
            <span style={{margin: "auto"}}>Building the Graph...</span>
        </div>);
    }

    return(<div className={'w-100 h-100'}>
        <ContextMenu />
        <PendingEdge />
        <div className={'d-flex h-100'}>
            <ToolBar model={model.id} isMetamodel={model.isMetamodel} />
            <div className={"GraphContainer h-100 w-100"} style={{position:"relative"}}>
                {graph && <DefaultNode data={model} nodeid={graph.id} graphid={graph.id}/> || <div>Error: missing DGraph prop</div> }
            </div>
        </div>
    </div>);

}
interface OwnProps { modelid: Pointer<DModel, 1, 1, LModel> }
interface StateProps { model: LModel, graph: LGraph }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs);
    const pointers = graphs.filter((graph) => { return graph.model === ret.model?.id });
    if(pointers.length > 0) ret.graph = LGraph.fromPointer(pointers[0].id);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const MetamodelTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MetamodelTabComponent);

export const MetamodelTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <MetamodelTabConnected {...{...props, children}} />;
}
export default MetamodelTab;
