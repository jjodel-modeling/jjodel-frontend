/**
 * The Refactoring tab beside the target's own tab (P-2026-10-25-0020): pure decisions, no dock and
 * no store, so the bench imports them.
 *
 * The tab shows only the editor; the target's own canvas tab (the metamodel's, or the model's for an
 * M1 target) is shown in a dock panel to its right, and the ghost preview is drawn there. Below
 * `BESIDE_MIN_WINDOW` px of window, or when the dock cannot place the two tabs side by side, the
 * tab keeps its own class-box pane (the fallback of R-JJD-15).
 */

/** Below this window width the tab keeps its own preview pane. */
export const BESIDE_MIN_WINDOW = 1100;

export type BesideMode = 'beside' | 'fallback';

export function besideMode(windowWidth: number, placeable: boolean): BesideMode {
    return placeable && windowWidth >= BESIDE_MIN_WINDOW ? 'beside' : 'fallback';
}

/** A panel of the dock's top-level box, left to right, with the ids of its tabs. */
export interface BesidePanel {
    id: string;
    tabIds: readonly string[];
}

/**
 * What the dock does so that `targetTabId` shows right of `scriptTabId`:
 * - `unavailable`: the script tab is not in a top-level panel (floating, maximized, nested);
 * - `activate`: the target tab is already in the panel right of the script's: raise it there;
 * - `move-into` / `open-into`: a panel right of the script's exists: move the open target tab
 *   into it, or open the target tab there;
 * - `split-move` / `split-open`: no panel to the right: split the script's panel to the right with
 *   the open target tab, or with a new one.
 * Never a second instance: an open target tab is always moved, never opened again.
 */
export type BesideAction =
    | { kind: 'unavailable' }
    | { kind: 'activate' | 'move-into' | 'open-into'; panelId: string }
    | { kind: 'split-move' | 'split-open'; panelId: string };

export function besideAction(panels: readonly BesidePanel[], scriptTabId: string, targetTabId: string): BesideAction {
    const at = panels.findIndex((p) => p.tabIds.includes(scriptTabId));
    if (at < 0 || !targetTabId || targetTabId === scriptTabId) return { kind: 'unavailable' };
    const open = panels.some((p) => p.tabIds.includes(targetTabId));
    const right = panels[at + 1];
    if (right) {
        if (right.tabIds.includes(targetTabId)) return { kind: 'activate', panelId: right.id };
        return { kind: open ? 'move-into' : 'open-into', panelId: right.id };
    }
    return { kind: open ? 'split-move' : 'split-open', panelId: panels[at].id };
}

/** The editor's share of the split, kept per browser profile. */
export const SPLIT_RATIO_KEY = 'jjodel.refactoring.splitRatio';
export const SPLIT_RATIO_DEFAULT = 0.4;
export const SPLIT_RATIO_MIN = 0.25;
export const SPLIT_RATIO_MAX = 0.75;

export function clampSplitRatio(r: number): number {
    if (!Number.isFinite(r) || r <= 0) return SPLIT_RATIO_DEFAULT;
    return Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, r));
}

/** The two panel sizes for `ratio`, keeping their sum. */
export function splitSizes(left: number, right: number, ratio: number): [number, number] {
    const total = (left > 0 ? left : 0) + (right > 0 ? right : 0) || 1;
    const r = clampSplitRatio(ratio);
    return [total * r, total * (1 - r)];
}
