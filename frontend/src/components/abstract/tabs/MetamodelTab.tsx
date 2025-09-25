import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {DModel, Pointer, Try, U} from "../../../joiner";
import {
    DState,
    CreateElementAction,
    DGraph,
    LGraph,
    LModel,
    Edge,
    DUser,
    DClass,
    SetRootFieldAction
} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ToolBar from "../../toolbar/ToolBar";
import ContextMenu from "../../contextMenu/ContextMenu";
import { MetricsPanel } from "../../metrics/Metrics";


function MetamodelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;
    const isEdgePending = props.isEdgePending;

    if (!model) return(<>closed tab</>);
    if (!graph) {
        DGraph.new(0, model.id);
        return(<div style={{width: "100%", height: "100%", display: "flex"}}>
            <span style={{margin: "auto"}}>Building the Graph...</span>
        </div>);
    }
    let graphid = graph.id;
    return(<div className={'w-100 h-100'} style={{overflow: 'hidden'}}>
        <MetricsPanel data={model}/>
        <ContextMenu graph={graphid}/>
        {/*<PendingEdge />*/}
        {/* Temporary Edge Pending Manager */}
        {isEdgePending.source && <div key={'extend-msg-outer'} style={{position: 'absolute', top: 15, right: 15, zIndex: 999}}
             className={'w-fit bg-white rounded border p-2'}>
            <label id="pending-extend-message" key={'extend-msg-inner'} className={'d-block text-center'}>Pending Edge...</label>
            <label tabIndex={-1} onClick={e => SetRootFieldAction.new('isEdgePending', {user: '', source: ''})}
               className={'cursor-pointer text-decoration-none d-block text-danger text-center'}>close</label>
        </div>}


        <div className={'d-flex h-100'} style={{overflow:'hidden'}} onClick={e => { if (!U.isProjectModified) U.isProjectModified = U.userHasInteracted = true; }}>
            <ToolBar model={model.id} isMetamodel={model.isMetamodel}/>
            <Try>
                <div className={"GraphContainer h-100 w-100"} style={{position: "relative"}}>
                    {graph && <DefaultNode data={model} nodeid={graphid} graphid={graphid}/> ||
                        <div>Error: missing DGraph prop</div>}
                </div>
            </Try>
        </div>
    </div>);

}

interface OwnProps {
    modelid: Pointer<DModel, 1, 1, LModel>
}

interface StateProps {
    model: LModel,
    graph: LGraph,
    isEdgePending: {user: Pointer<DUser>, source: Pointer<DClass>}
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs);
    const pointers = graphs.filter((graph) => { return graph.model === ret.model?.id });
    if (pointers.length > 0) ret.graph = LGraph.fromPointer(pointers[0].id);
    ret.isEdgePending = state.isEdgePending
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

export const MetamodelTab = (props: OwnProps, children: ReactNode[] = []): ReactElement => {
    // @ts-ignore children
    return <MetamodelTabConnected {...{...props, children}} />;
}
export default MetamodelTab;
