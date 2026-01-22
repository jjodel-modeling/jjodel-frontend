import React, {Dispatch, ReactElement, ReactNode, useCallback} from "react";
import {connect} from "react-redux";
import {DModel, Pointer, Try, U} from "../../../joiner";
import {
    DState,
    DGraph,
    LGraph,
    LModel,
    DUser,
    DClass,
    SetRootFieldAction
} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ContextMenu from "../../contextMenu/ContextMenu";
import { FeaturesPalette, getFeatureByDragType } from "../../FeaturesPalette";


function MetamodelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;
    const isEdgePending = props.isEdgePending;

    // Handle drag over on canvas - allow drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    // Handle drop on canvas - create element from Features Palette
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();

        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;

            const data = JSON.parse(dataStr);
            const feature = getFeatureByDragType(data.type);

            if (!feature || !model) return;

            // Create the element using model.addChild() - same API as ToolBar
            // The feature.id is lowercase (package, class, enumerator)
            const createdElement = model.addChild(feature.id);

            // Execute the returned function if it exists (some addChild returns a function)
            try {
                if (typeof createdElement === 'function') {
                    (createdElement as any)();
                }
            } catch (e) {
                // Element already created directly
            }

            // Mark project as modified
            if (!U.isProjectModified) {
                U.isProjectModified = U.userHasInteracted = true;
            }
        } catch (err) {
            console.error('Failed to handle drop:', err);
        }
    }, [model]);

    if (!model) return(<>closed tab</>);
    if (!graph) {
        DGraph.new(0, model.id);
        return(<div style={{width: "100%", height: "100%", display: "flex"}}>
            <span style={{margin: "auto"}}>Building the Graph...</span>
        </div>);
    }
    let graphid = graph.id;
    return(<div className={'w-100 h-100'} style={{overflow: 'hidden'}}>
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
            {/* Fixed Features Palette - always visible */}
            <FeaturesPalette />
            <Try>
                <div
                    className={"GraphContainer h-100 w-100"}
                    style={{position: "relative"}}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
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
