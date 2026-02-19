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

import { useCallback } from 'react';
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

/** Select one element and deselect all others in the same graph. */
function selectElement(elementId: string, modelid: string): void {
    try {
        const lElement: any = LPointerTargetable.fromPointer(elementId);
        if (!lElement) return;

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

            try { lElement.select(DUser.current); } catch { /* ignore */ }

            const modelElement = lElement.model;
            SetRootFieldAction.new('_lastSelected' as any, {
                node: elementId,
                view: '',
                modelElement: modelElement?.id ?? modelElement?.__raw?.id ?? '',
            });
        });
    } catch (err) {
        console.warn('[useJjomSelection] Failed to select element:', err);
    }
}

/** Deselect all elements and clear _lastSelected. */
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
            SetRootFieldAction.new('_lastSelected' as any, undefined as any);
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
    onPaneClick: () => void;
}

/**
 * Returns React Flow event handlers for selection sync.
 * When `isJjomMode` is false, handlers are no-ops.
 */
export function useJjomSelection(
    modelid: string | undefined,
    isJjomMode: boolean,
): UseJjomSelectionResult {
    const onNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (isJjomMode && modelid) selectElement(node.id, modelid);
        },
        [isJjomMode, modelid],
    );

    const onEdgeClick = useCallback(
        (_event: React.MouseEvent, edge: Edge) => {
            if (isJjomMode && modelid) selectElement(edge.id, modelid);
        },
        [isJjomMode, modelid],
    );

    const onPaneClick = useCallback(() => {
        if (isJjomMode && modelid) deselectAll(modelid);
    }, [isJjomMode, modelid]);

    return { onNodeClick, onEdgeClick, onPaneClick };
}
