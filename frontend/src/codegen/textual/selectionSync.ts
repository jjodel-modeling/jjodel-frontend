/**
 * selectionSync — the pure half of the selection synced between the Text tab and the model's canvas (lane E2a,
 * P-2026-11-07-0746; R-TXT-54, docs/discovery/discovery_2026-11-06_textual_e_sync.md §4.3, §6).
 *
 * Text to canvas: a caret moved by the user selects, on the canvas, the innermost object whose carried span holds it
 * (E4; a reference token is its owner's, E5), once per object, and only when the canvas draws it as a node (E6).
 *
 * Canvas to text (lane E2b, P-2026-11-07-1635; §5.2, §6.3): the elements selected on the canvas are highlighted on
 * their carried spans; an element without one is silent (E8).
 *
 * Pure: no React, no Monaco, no store.
 */

import type { CanvasPick } from '../ui/codeOrigins';
import type { ObjectSpan } from './printer';

/** Monaco's `CursorChangeReason.Explicit`: a move the user made with the mouse or a cursor key, not the cursor shift of an edit. */
export const CARET_EXPLICIT = 3;

/** The wait after a caret move before the canvas follows (the outline's delay): a held arrow key does not animate the canvas per line. */
export const CARET_SELECT_DELAY_MS = 150;

/** What a Monaco cursor event says of its move (`ICursorSelectionChangedEvent`). */
export interface CaretMove {
    readonly source: string;
    readonly reason: number;
}

/**
 * True for a caret the user moved (a click or a cursor key); false for typing, a paste, an undo or a redo (whose reason
 * is not explicit), and for any move made by code: `setPosition`, `setValue`, a reprint's view state, an edit's selection
 * (§6.1, §6.2).
 */
export function isUserCaretMove(e: CaretMove): boolean {
    return (e.source === 'mouse' || e.source === 'keyboard') && e.reason === CARET_EXPLICIT;
}

/**
 * The innermost span holding `offset`, null when none does. A span `[start, end)` holds a caret at its end too (right
 * after the object's last character); of the spans holding it, the one that starts last, then the shortest, is the
 * innermost, so between two adjacent objects the caret is the second's. A collapsed span holds nothing.
 */
export function innermostSpanAt(spans: readonly ObjectSpan[], offset: number): ObjectSpan | null {
    let best: ObjectSpan | null = null;
    for (const s of spans) {
        if (s.end <= s.start || offset < s.start || offset > s.end) continue;
        if (!best || s.start > best.start || (s.start === best.start && s.end < best.end)) best = s;
    }
    return best;
}

/** The id to send after `last`: `id` when it is an object other than the last one sent, else null (no repeat, §6.1). */
export function nextSelected(last: string | null, id: string | null): string | null {
    return id !== null && id !== last ? id : null;
}

/**
 * The node to select for a pick on the canvas: the element's vertex; null for an element the canvas draws as an edge,
 * whose source vertex the generator tab selects but the text does not (nodes only, E6), and for one it does not draw.
 */
export function canvasNodeOf(pick: CanvasPick | null): string | null {
    return pick?.kind === 'node' ? pick.nodeId : null;
}

/**
 * The vertex ids a model's canvas draws, from the ids of its mounted nodes (`.react-flow__node[data-id]`): the canvas
 * unmounts a node out of view (`onlyRenderVisibleElements`, editor-v2/onlyRenderVisible.ts), so the DOM alone misses the
 * nodes a selection has to bring into view. The mounted nodes name their graphs; every vertex under those graphs
 * (`subElements`, nested ones too) is on the canvas, the mounted ones first. A vertex of another graph (another
 * viewpoint) is never given: `SELECT_NODE` with it would clear the canvas's selection and select nothing.
 */
export function canvasVertexIds(lookup: Readonly<Record<string, any>>, mounted: readonly string[]): string[] {
    const out = [...mounted];
    const listed = new Set<string>(mounted);
    const seen = new Set<string>();
    const walk = (ids: unknown): void => {
        if (!Array.isArray(ids)) return;
        for (const id of ids) {
            if (typeof id !== 'string' || seen.has(id) || !lookup[id]) continue;
            seen.add(id);
            if (/Vertex$/.test(lookup[id].className ?? '') && !listed.has(id)) { listed.add(id); out.push(id); }
            walk(lookup[id].subElements);
        }
    };
    const graphs = new Set(mounted.map(id => lookup[id]?.graph).filter((g): g is string => typeof g === 'string'));
    for (const g of graphs) walk(lookup[g]?.subElements);
    return out;
}

/**
 * The carried spans of the elements selected on the canvas, in selection order (the last is the one just clicked), each
 * element once. An element with no span (a stale tab, an unprinted object, E8) or with a collapsed one gives nothing.
 */
export function selectedSpans(spans: readonly ObjectSpan[], elementIds: readonly string[]): ObjectSpan[] {
    const byId = new Map<string, ObjectSpan>();
    for (const s of spans) if (s.end > s.start && !byId.has(s.id)) byId.set(s.id, s);
    const out: ObjectSpan[] = [];
    const seen = new Set<string>();
    for (const id of elementIds) {
        const s = byId.get(id);
        if (s && !seen.has(id)) { seen.add(id); out.push(s); }
    }
    return out;
}

/**
 * The last id the text path holds as sent, after the canvas published `elementIds`: the one element selected, so a caret
 * in it does not select it again (§6.1); null for none or several, so a caret in any of them selects it alone.
 */
export function lastSelectedOf(elementIds: readonly string[]): string | null {
    return elementIds.length === 1 ? elementIds[0] : null;
}
