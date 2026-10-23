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

export function clientCentre(rect: ClientRect): { x: number; y: number } {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
