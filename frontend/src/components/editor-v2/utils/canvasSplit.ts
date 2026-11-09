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

/** Only the active pane of a split runs commands (P-2026-11-08-2045); a canvas outside a split runs them as ever. */
export function paneIsInactive<P>(split: CanvasSplit<P>, pane: P): boolean {
    return split.panes.includes(pane) && split.active !== pane;
}

/** How far the click that activated a pane has gone: its pointerdown seen, then its mousedown too. */
export type PaneActivation = 'none' | 'press' | 'click';

export interface PaneEventVerdict {
    /** The event stops here: nothing in the pane sees it. */
    readonly consume: boolean;
    /** The event makes the pane active. */
    readonly activate: boolean;
    readonly activation: PaneActivation;
}

/**
 * What one event does on a pane. The pointerdown that activates a pane is consumed, with the rest of its click, and with
 * a double-click it opens: a mousedown with detail > 1 is the browser's own count of it. Wheel events are not passed here.
 */
export function paneEventVerdict<P>(split: CanvasSplit<P>, pane: P, activation: PaneActivation, event: { type: string; detail?: number }): PaneEventVerdict {
    const inactive = paneIsInactive(split, pane);
    switch (event.type) {
        case 'pointerdown':
            // Still 'press' here means its mousedown never came (the browser sends none on a disabled control).
            return inactive ? { consume: true, activate: true, activation: 'press' } : { consume: false, activate: false, activation: activation === 'press' ? 'none' : activation };
        case 'mousedown':
            if (activation === 'press') return { consume: true, activate: false, activation: 'click' };
            if (activation === 'click' && (event.detail ?? 0) > 1) return { consume: true, activate: false, activation };
            return { consume: inactive, activate: false, activation: 'none' };
        case 'keydown':
            return { consume: inactive, activate: false, activation };
        default:
            return { consume: inactive || activation !== 'none', activate: false, activation };
    }
}
