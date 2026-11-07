/**
 * selectionSync — the pure half of the selection synced between the Text tab and the model's canvas (lane E2a,
 * P-2026-11-07-0746; R-TXT-54, docs/discovery/discovery_2026-11-06_textual_e_sync.md §4.3, §6).
 *
 * Text to canvas: a caret moved by the user selects, on the canvas, the innermost object whose carried span holds it
 * (E4; a reference token is its owner's, E5), once per object, and only when the canvas draws it as a node (E6).
 *
 * Pure: no React, no Monaco, no store.
 */

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
