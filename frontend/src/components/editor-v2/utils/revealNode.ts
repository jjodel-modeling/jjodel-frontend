/**
 * The viewport that brings a selected node into view (P-2026-10-25-1441).
 *
 * `SELECT_NODE` used to centre on the window, from the React Flow container's left: on a canvas narrowed beside a
 * generator tab the node landed past its right edge, and every select moved the canvas. The pane here is React Flow's
 * own (the store's width/height), the zoom never changes, and a node already fully inside leaves the viewport alone.
 */
export interface FlowViewport {
    x: number;
    y: number;
    zoom: number;
}

/** The node's box in flow coordinates. */
export interface FlowBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Where a node of `size` px starts along a pane of `span` px: centre at one third, then shifted to fit when it can. */
function placeAlong(span: number, size: number): number {
    return Math.max(0, Math.min(span / 3 - size / 2, span - size));
}

/**
 * `null` when the node is fully inside the part of the pane the right inset (`--jj-canvas-right-inset`) leaves
 * uncovered, or when the pane has no size yet. Otherwise the viewport, same zoom, that puts the node's centre one
 * third from the left and from the top of that part (F3), shifted so the whole node fits when it is small enough.
 */
export function revealViewport(node: FlowBox, viewport: FlowViewport, pane: { width: number; height: number }, rightInset = 0): FlowViewport | null {
    const width = pane.width - Math.min(Math.max(rightInset, 0), pane.width);
    const height = pane.height;
    if (!(width > 0) || !(height > 0)) return null;
    const zoom = viewport.zoom;
    const left = node.x * zoom + viewport.x;
    const top = node.y * zoom + viewport.y;
    const w = node.width * zoom;
    const h = node.height * zoom;
    if (left >= 0 && top >= 0 && left + w <= width && top + h <= height) return null;
    return { x: placeAlong(width, w) - node.x * zoom, y: placeAlong(height, h) - node.y * zoom, zoom };
}
