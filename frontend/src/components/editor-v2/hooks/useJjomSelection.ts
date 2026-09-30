/**
 * useJjomSelection — Standalone hook for syncing React Flow selection
 * to JjOM so the platform Properties panel updates.
 *
 * This hook is intentionally self-contained: it has its OWN imports and
 * does NOT touch any Phase 3 sync file (canvasToJjom.ts, syncState.ts,
 * useJjomSync.ts). This isolation prevents selection logic from
 * interfering with the bidirectional position/size sync.
 *
 * Anti-bounce strategy: Before firing a TRANSACTION that changes
 * `isSelected` on many D-objects, we mark ALL graph sub-element IDs
 * via markCanvasUpdatedBatch(). This tells useJjomSync to skip
 * re-transformation for those elements (their only change is isSelected,
 * not position/size).
 */

import { useCallback, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
    SetRootFieldAction,
    TRANSACTION,
    LPointerTargetable,
    DUser,
    DGraph,
    DState,
    LGraph,
    store,
} from '../../../joiner';
import { markCanvasUpdatedBatch } from '../sync/syncState';
import { resolveEdgeSelectionTarget } from '../utils/edgeSelectionTarget';
import { JjodelEvents } from '../../../events/registry';

/**
 * The element `_lastSelected.modelElement` points to when the editor has no
 * selection (tab open, pane click, deselectAll): the model itself, so the
 * Properties rail shows the metamodel or model and not its root package or
 * first class. DModel extends DModelElement and `.model` resolves a DModel
 * to itself, so `Selectors.getActiveModel()` still finds this model.
 */
function findModelElement(modelid: string): string {
    return modelid;
}

// ---------------------------------------------------------------------------
// Internal helpers (not exported — selection-only)
// ---------------------------------------------------------------------------

/** Collect all subElement IDs for the graph matching modelid. */
function getGraphSubElementIds(modelid: string): string[] {
    try {
        const state: DState = store.getState();
        const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
        const dGraph = dGraphs.find(g => g?.model === modelid);
        if (!dGraph) return [];
        const freshGraph = state.idlookup[dGraph.id] as any;
        return (freshGraph?.subElements ?? []) as string[];
    } catch {
        return [];
    }
}

/** Dispatch canvas element selected event for viewpoint editor auto-navigate. */
function notifyElementSelected(elementId: string): void {
    try {
        const state: DState = store.getState();
        const raw = state.idlookup?.[elementId] as any;
        // Resolve the model element (vertex → model element)
        const modelElementId = raw?.model ?? elementId;
        const modelElement = state.idlookup?.[modelElementId] as any;
        const className = modelElement?.className ?? raw?.className ?? '';
        if (className) {
            window.dispatchEvent(new CustomEvent(JjodelEvents.CANVAS_ELEMENT_SELECTED, {
                detail: { elementId, className },
            }));
        }
    } catch { /* ignore */ }
}

/** Select one element and deselect all others in the same graph. `modelElementId`, when given, is
 *  what the Properties panel shows instead of the element's own `.model` (an edge that represents a
 *  slot or an object, R-ESEL-2); with no D-object behind `elementId` (object-as-edge) nothing is
 *  selected and `node` is empty (R-ESEL-3). */
function selectElement(elementId: string, modelid: string, modelElementId?: string): void {
    try {
        const lElement: any = LPointerTargetable.fromPointer(elementId);
        if (!lElement && !modelElementId) return;

        // Anti-bounce: mark ALL graph elements BEFORE the TRANSACTION.
        // The TRANSACTION changes isSelected on every D-object, creating
        // new references in state.idlookup. Without this, useJjomSync
        // would detect those changes and re-transform everything.
        const allIds = getGraphSubElementIds(modelid);
        if (allIds.length > 0) markCanvasUpdatedBatch(allIds);

        TRANSACTION('EditorV2 select', () => {
            const state: DState = store.getState();
            const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
            const dGraph = dGraphs.find(g => g?.model === modelid);
            if (dGraph) {
                const lGraph: any = LGraph.fromPointer(dGraph.id);
                const allSubs: any[] = lGraph?.allSubElements ?? lGraph?.subElements ?? [];
                for (const sub of allSubs) {
                    if (sub.id !== elementId) {
                        try { sub.deselect(DUser.current); } catch { /* ignore */ }
                    }
                }
            }

            if (lElement) { try { lElement.select(DUser.current); } catch { /* ignore */ } }

            const modelElement = modelElementId ? null : lElement.model;
            SetRootFieldAction.new('_lastSelected' as any, {
                node: lElement ? elementId : '',
                view: '',
                modelElement: modelElementId || (modelElement?.id ?? modelElement?.__raw?.id ?? ''),
            });
        });

        // Notify viewpoint editor panel about the selected element
        notifyElementSelected(elementId);
    } catch (err) {
        console.warn('[useJjomSelection] Failed to select element:', err);
    }
}

/** Select a canvas edge: the edge keeps the canvas selection, the Properties panel shows the
 *  element it represents (resolveEdgeSelectionTarget). An edge the resolver does not know goes
 *  through selectElement exactly as before (R-ESEL-1). */
function selectEdgeTarget(edgeId: string, modelid: string): void {
    let modelElementId: string | undefined;
    try {
        modelElementId = resolveEdgeSelectionTarget(edgeId, store.getState().idlookup as any)?.modelElementId;
    } catch { /* unresolved: the edge's own .model, as before */ }
    selectElement(edgeId, modelid, modelElementId);
}

/** Deselect all elements but keep _lastSelected.modelElement pointing to the
 *  current model so that Jjodie and other context-dependent UI stays in sync. */
function deselectAll(modelid: string): void {
    try {
        const allIds = getGraphSubElementIds(modelid);
        if (allIds.length > 0) markCanvasUpdatedBatch(allIds);

        TRANSACTION('EditorV2 deselect', () => {
            const state: DState = store.getState();
            const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
            const dGraph = dGraphs.find(g => g?.model === modelid);
            if (dGraph) {
                const lGraph: any = LGraph.fromPointer(dGraph.id);
                const allSubs: any[] = lGraph?.allSubElements ?? lGraph?.subElements ?? [];
                for (const sub of allSubs) {
                    try { sub.deselect(DUser.current); } catch { /* ignore */ }
                }
            }

            // Keep modelElement pointing to a classifier inside the model
            // so Selectors.getActiveModel() still resolves to this model.
            const modelElement = findModelElement(modelid);
            if (modelElement) {
                SetRootFieldAction.new('_lastSelected' as any, {
                    node: '',
                    view: '',
                    modelElement,
                });
            } else {
                SetRootFieldAction.new('_lastSelected' as any, {
                    node: '',
                    view: '',
                    modelElement: modelid,  // punta al model stesso invece di undefined
                });
            }
        });
    } catch (err) {
        console.warn('[useJjomSelection] Failed to deselect all:', err);
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseJjomSelectionResult {
    onNodeClick: (_event: React.MouseEvent, node: Node) => void;
    onEdgeClick: (_event: React.MouseEvent, edge: Edge) => void;
    /** Object-as-edge (`irobj_*`): the Properties panel shows the object (R-ESEL-2). */
    onObjectAsEdgeClick: (edgeId: string) => void;
    onPaneClick: () => void;
}

/**
 * Returns React Flow event handlers for selection sync.
 * When `isJjomMode` is false, handlers are no-ops.
 */
export function useJjomSelection(
    modelid: string | undefined,
    isJjomMode: boolean,
    highlightActive?: boolean,
    onAssign?: (id: string) => void,
): UseJjomSelectionResult {
    // When the editor opens a different model (tab switch), update
    // _lastSelected.modelElement so Jjodie and other context-dependent
    // UI immediately knows which model is active — without requiring
    // the user to click on a specific node first.
    // NOTE: This must NOT depend on isJjomMode because for a new/empty
    // model the v2-flow graph doesn't exist yet (isJjomMode = false),
    // but we still need Jjodie to point to the correct model.
    useEffect(() => {
        if (!modelid) return;
        const modelElement = findModelElement(modelid);
        SetRootFieldAction.new('_lastSelected' as any, {
            node: '',
            view: '',
            modelElement: modelElement ?? modelid,  // fallback al model stesso
        });
    }, [modelid]);

    const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
        _event.stopPropagation();  // ← aggiungi questo
        // Highlight mode ON: il click assegna il colore attivo al nodo e salta
        // la selezione (niente ring `.selected` nella figura).
        if (highlightActive && onAssign) { onAssign(node.id); return; }
        if (isJjomMode && modelid) selectElement(node.id, modelid);
    },
    [isJjomMode, modelid, highlightActive, onAssign],
);

const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
        _event.stopPropagation();  // prevent pane click deselect race
        // Highlight mode ON: il click assegna il colore attivo all'edge.
        if (highlightActive && onAssign) { onAssign(edge.id); return; }
        if (isJjomMode && modelid) selectEdgeTarget(edge.id, modelid);
    },
    [isJjomMode, modelid, highlightActive, onAssign],
);

    // Object-as-edge: the canvas selection is EditorV2's (IR interaction store); this only points the
    // Properties panel at the object. Highlight mode ON: no colour and no selection, as before this
    // handler existed (R-ESEL-5).
    const onObjectAsEdgeClick = useCallback(
        (edgeId: string) => {
            if (highlightActive && onAssign) return;
            if (isJjomMode && modelid) selectEdgeTarget(edgeId, modelid);
        },
        [isJjomMode, modelid, highlightActive, onAssign],
    );

    const onPaneClick = useCallback(() => {
        if (!modelid) return;
        if (isJjomMode) {
            // Full deselect: deselect graph elements + keep _lastSelected on model
            deselectAll(modelid);
        } else {
            // No graph yet — just update _lastSelected so Jjodie targets this model
            const modelElement = findModelElement(modelid);
            if (modelElement) {
                SetRootFieldAction.new('_lastSelected' as any, {
                    node: '',
                    view: '',
                    modelElement,
                });
            }
        }
    }, [isJjomMode, modelid]);

    return { onNodeClick, onEdgeClick, onObjectAsEdgeClick, onPaneClick };
}
