import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DModel,
    DPointerTargetable,
    Pointer,
    Try,
    U,
    CreateElementAction,
    DGraph,
    DModelElement,
    DState,
    LGraph,
    LModel,
    LModelElement,
    Constructors,
    SetRootFieldAction,
} from "../../../joiner";
import {DefaultNode} from "../../../joiner";
import ContextMenu from "../../contextMenu/ContextMenu";
import { EditorSwitch } from "./EditorSwitch";
import { EdgeOverlay } from "../../edgeOverlay/EdgeOverlay";


function ModelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;

    if (!model) return(<>closed tab</>);
    if (!graph) {
        const graphid = Constructors.DGraph_makeID(model.id);
        if (!DPointerTargetable.pendingCreation[graphid]) {
            const dGraph = DGraph.new(0, model.id);
            // console.log('create m1 graph', {model, graphId: dGraph.id});
        }
        return(<div style={{width: "100%", height: "100%", display: "flex"}}>
            <span style={{margin: "auto"}}>Building the Graph...</span>
        </div>);
    }
    let graphid = graph.id;
    return(<div className={'w-100 h-100'} style={{overflow: 'hidden'}}>
        <ContextMenu graph={graphid}/>
        <EditorSwitch modelid={model.id}>
            <div className={'d-flex h-100'} style={{overflow:'hidden'}} onClick={e => { if (!U.isProjectModified) U.isProjectModified = U.userHasInteracted = true; }}>
                <Try>
                    <div className={"GraphContainer h-100 w-100"} style={{position:"relative"}}>
                        <EdgeOverlay graphid={graphid} />
                        {graph && <DefaultNode data={model} nodeid={graphid} graphid={graphid} />}
                    </div>
                </Try>
            </div>
        </EditorSwitch>
    </div>);
}
interface OwnProps {
    modelid: Pointer<DModel, 1, 1, LModel>,
    metamodelid?: Pointer<DModelElement, 1, 1, LModelElement>,
}
interface StateProps { model: LModel, graph?: LGraph }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs);
    const pointers = graphs.filter((graph) => { return graph.model === ownProps.modelid && (graph as any).graphStyle !== 'v2-flow' });
    if (pointers.length > 0) ret.graph = LGraph.fromPointer(pointers[0].id);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ModelTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ModelTabComponent);

export const ModelTab = (props: OwnProps, children: ReactNode[] = []): ReactElement => {
    // @ts-ignore children
    return <ModelTabConnected {...{...props, children}} />;
}
export default ModelTab;
