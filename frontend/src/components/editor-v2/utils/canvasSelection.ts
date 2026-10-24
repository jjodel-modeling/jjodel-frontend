/**
 * Pure helpers for publishing the canvas multi-selection (R-JJD-3, P-2026-10-24-0155).
 *
 * EditorV2 reads React Flow's selected nodes and emits `JjodelEvents.CANVAS_SELECTION_CHANGED`
 * with the list built here. Kept out of EditorV2.tsx so the bench can import it (EditorV2 pulls
 * in `window` through the joiner barrel).
 */

/** Payload of `JjodelEvents.CANVAS_SELECTION_CHANGED`. `nodeIds` are the canvas node ids (the
 *  vertices, as `_lastSelected.node`), in selection order; `elementIds` are the model elements
 *  behind them (as `_lastSelected.modelElement`), same order, unresolved nodes left out. */
export interface CanvasSelectionDetail {
    modelId: string;
    nodeIds: string[];
    elementIds: string[];
}

/** The selection in the order it was made: ids still selected keep their previous position,
 *  newly selected ids follow in the order `selectedNow` lists them. */
export function orderSelection(prev: readonly string[], selectedNow: readonly string[]): string[] {
    const now = new Set(selectedNow);
    const kept = prev.filter((id) => now.has(id));
    const keptSet = new Set(kept);
    const added = selectedNow.filter((id, i) => !keptSet.has(id) && selectedNow.indexOf(id) === i);
    return [...kept, ...added];
}

/** Same ids in the same order. */
export function sameIdList(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

/** The model element behind each node, as `notifyElementSelected` resolves it (vertex `.model`,
 *  else the node's own id when it is a D-object). Nodes with no D-object are left out. */
export function resolveElementIds(nodeIds: readonly string[], idlookup: Record<string, any> | undefined): string[] {
    const out: string[] = [];
    for (const id of nodeIds) {
        const raw = idlookup?.[id];
        if (!raw) continue;
        const el = typeof raw.model === 'string' && raw.model ? raw.model : id;
        if (!out.includes(el)) out.push(el);
    }
    return out;
}
