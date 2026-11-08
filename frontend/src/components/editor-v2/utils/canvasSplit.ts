/**
 * The canvases of a split and which of them is active (multi-tab L6c, P-2026-11-08-1855).
 * Plain rules, generic over the pane so they run with no DOM; DockManager holds the state.
 * Every rule returns the same object when nothing changes, so a subscriber does not re-render.
 */

export interface CanvasSplit<P = HTMLElement> {
    /** The canvases side by side, left to right; empty when there is no split. */
    readonly panes: readonly P[];
    /** The pane that last received a pointerdown or focus; null when there is no split. */
    readonly active: P | null;
}

export const NO_CANVAS_SPLIT: CanvasSplit<any> = Object.freeze({ panes: Object.freeze([]), active: null });

/** The split after the dock changed: the active pane survives while it is still shown, else the first takes over. */
export function reconcileCanvasSplit<P>(split: CanvasSplit<P>, panes: readonly P[]): CanvasSplit<P> {
    if (panes.length < 2) return NO_CANVAS_SPLIT;
    const active = split.active !== null && panes.includes(split.active) ? split.active : panes[0];
    const same = active === split.active && panes.length === split.panes.length && panes.every((p, i) => p === split.panes[i]);
    return same ? split : { panes, active };
}

/** A pointerdown or a focus inside a pane of the split makes it active; any other pane changes nothing. */
export function activateCanvasPane<P>(split: CanvasSplit<P>, pane: P): CanvasSplit<P> {
    if (split.active === pane || !split.panes.includes(pane)) return split;
    return { panes: split.panes, active: pane };
}

/** A palette drop lands only on the active pane; a canvas outside a split takes it as ever. */
export function paneAcceptsPaletteDrop<P>(split: CanvasSplit<P>, pane: P): boolean {
    return !split.panes.includes(pane) || split.active === pane;
}
