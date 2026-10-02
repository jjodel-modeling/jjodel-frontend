import React, {Dispatch, ReactElement, ReactNode, useCallback, useRef} from "react";
import {connect} from "react-redux";
import {
    DModel,
    Pointer,
    Try,
    U,
    GraphSize,
    transientProperties,
    SetFieldAction,
    TRANSACTION,
    Size,
    DState,
    DGraph,
    LGraph,
    LModel,
    DUser,
    DClass,
    SetRootFieldAction,
    Constructors,
    DPointerTargetable
} from "../../../joiner";
import ContextMenu from "../../contextMenu/ContextMenu";
import { FeaturesPalette, getFeatureByDragType } from "../../FeaturesPalette";
import { installCanvasExportListener, findActiveCanvas } from "../../../services/CanvasExportService";
import { EditorSwitch } from "./EditorSwitch";
import { resolveVertexLayoutWrite, type VertexLayoutSource } from "../../editor-v2/viewpoint/layout/vertexLayout";
import { getActiveLayoutKey } from "../../editor-v2/viewpoint/layout/vertexLayoutAdapter";

// File > Export Canvas: one listener for the whole app and for the canvas of every tab, metamodel and model,
// installed when this module loads (TabDataMaker imports it at startup). It replaces a per-tab listener that read a
// ref no element carried after the classic shutdown, and that a model tab never had
// (docs/discovery/discovery_2026-09-30_canvas_export_broken.md).
installCanvasExportListener(window, {
    resolveCanvas: () => {
        const canvas = findActiveCanvas(document);
        if (!canvas) return null;
        let name: string | undefined;
        try {
            name = canvas.modelId ? (LModel.fromPointer(canvas.modelId as Pointer<DModel, 1, 1, LModel>) as LModel | undefined)?.name : undefined;
        } catch { /* the tab id is not a model id: keep the default name */ }
        return { element: canvas.element, filename: name || 'metamodel' };
    },
    notify: (type, title, message) => U.alert(type, title, message),
});

function MetamodelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;
    const isEdgePending = props.isEdgePending;
    const canvasRef = useRef<HTMLDivElement>(null);

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

            // Sub-features must be dropped on a Class, not canvas
            const subFeatureTypes = ['FEATURE_ATTRIBUTE', 'FEATURE_REFERENCE', 'FEATURE_OPERATION', 'FEATURE_LITERAL'];
            if (subFeatureTypes.includes(data.type)) {
                // Don't create sub-features on canvas - they need a parent Class
                return;
            }

            const feature = getFeatureByDragType(data.type);

            if (!feature || !model || !graph) return;

            // Calculate drop position in graph coordinates
            let dropX = 100; // default position
            let dropY = 100;

            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const clientX = e.clientX - rect.left;
                const clientY = e.clientY - rect.top;

                // Convert screen coords to graph coords using graph.translateHtmlSize
                const graphCoords = graph.translateHtmlSize(new Size(clientX, clientY, 0, 0));
                dropX = graphCoords.x;
                dropY = graphCoords.y;
            }

            let createdElement = model.addChild(feature.id);

            // Execute the returned function if it exists (some addChild returns a function)
            let elementId: string | undefined;
            try {
                if (typeof createdElement === 'function') {
                    createdElement = (createdElement as any)();
                }
                // Get the element ID for position setting
                if (createdElement && typeof createdElement === 'object' && 'id' in createdElement) {
                    elementId = (createdElement as any).id;
                }
            } catch (e) {
                // Element already created directly
            }

            // Set position on the node after it's created (with delay for React render)
            if (elementId) {
                const setPositionWithRetry = (retries: number = 0) => {
                    const tm = transientProperties.modelElement[elementId!];
                    if (tm?.node?.__raw) {
                        // Governed, not exempt (R-LAY-9): the classic drop goes through the same
                        // resolver as editor-v2. On a metamodel the viewpoint selector is not
                        // rendered by design (EditorSwitch/Toolbar gate on isMetamodel), so the
                        // key here is always ABSTRACT_SYNTAX_LAYOUT_KEY — a metamodel is a model
                        // that only ever has abstract syntax (ratified 2026-08-24).
                        const raw: any = tm.node!.__raw;
                        const write = resolveVertexLayoutWrite(raw as VertexLayoutSource, { x: dropX, y: dropY }, getActiveLayoutKey());
                        TRANSACTION('Set drop position', () => {
                            if (write.target === 'dictionary') {
                                SetFieldAction.new(raw, 'layoutByViewpoint', { [write.vpId]: write.record }, '+=', false);
                                return;
                            }
                            SetFieldAction.new(tm.node!.__raw, 'x', dropX, '', false);
                            SetFieldAction.new(tm.node!.__raw, 'y', dropY, '', false);
                        });
                    } else if (retries < 10) {
                        // Node not created yet, retry after a short delay
                        setTimeout(() => setPositionWithRetry(retries + 1), 50);
                    }
                };
                setTimeout(() => setPositionWithRetry(), 50);
            }

            // Mark project as modified
            if (!U.isProjectModified) {
                U.isProjectModified = U.userHasInteracted = true;
            }
        } catch (err) {
            console.error('Failed to handle drop:', err);
        }
    }, [model, graph]);

    if (!model) return(<>closed tab</>);
    if (!graph) {
        const graphid = Constructors.DGraph_makeID(model.id);
        if (!DPointerTargetable.pendingCreation[graphid]) {
            const dGraph = DGraph.new(0, model.id);
            // console.log('create m2 graph', {model, graphId: dGraph.id});
        }
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


        {/* Classic shutdown (Fase 5a): the M2 classicSlot was already dead
            (hasViewpoint is always false for metamodels — children were
            discarded); the dead subtree is now removed explicitly. */}
        <EditorSwitch modelid={model.id} isMetamodel />
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
    const pointers = graphs.filter((graph) => { return graph.model === ret.model?.id && (graph as any).graphStyle !== 'v2-flow' });
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
