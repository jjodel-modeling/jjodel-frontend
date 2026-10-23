/**
 * The centre of the canvas in client coordinates (P-2026-10-21-1950, F3).
 *
 * A palette click creates at this point: the same space as a drop's `clientX/Y`, so the drop path converts it with
 * `screenToFlowPosition` and centres the new node on it.
 */
export interface ClientRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * `rightInset` is the part of the canvas the floating Properties+Tree overlay covers on the right
 * (`--jj-canvas-right-inset`, P-2026-10-22-1325): the centre is the one of the uncovered part.
 */
export function clientCentre(rect: ClientRect, rightInset = 0): { x: number; y: number } {
    const inset = Math.min(Math.max(rightInset, 0), rect.width);
    return { x: rect.left + (rect.width - inset) / 2, y: rect.top + rect.height / 2 };
}
