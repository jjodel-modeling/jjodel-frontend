import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import type {DModel, Pointer} from "../../../joiner";
import {LGraph, DGraph, LModel} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ToolBar from "../../toolbar/ToolBar";
import PendingEdge from "../../../graph/edge/PendingEdge";
import ContextMenu from "../../toolbar/ContextMenu";
import EdgesManager from "../../../graph/edges/EdgesManager";


function MetamodelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;

    return(<div className={'w-100 h-100'}>
        <ContextMenu />
        <PendingEdge />
        <div className={'d-flex'}>
            <ToolBar model={model.id} isMetamodel={model.isMetamodel} />
            <div style={{marginLeft: '6.55em'}}>
                {graph && <DefaultNode data={model.id} nodeid={graph.id} graphid={graph.id} />}
                <EdgesManager modelid={model.id} />
            </div>
        </div>
    </div>);

}
interface OwnProps { modelid: Pointer<DModel, 1, 1, LModel> }
interface StateProps { model: LModel, graph: LGraph }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs);
    const pointers = graphs.filter((graph) => { return graph.model === ownProps.modelid });
    if(pointers.length > 0) ret.graph = LGraph.fromPointer(pointers[0].id);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const MetamodelTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(MetamodelTabComponent);

export const MetamodelTab = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <MetamodelTabConnected {...{...props, childrens}} />;
}
export default MetamodelTab;
