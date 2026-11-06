/**
 * The viewport at model open when the fit frames no node (ticket #419, P-2026-11-02-1856).
 *
 * `fitView` frames the bounding box of every node, and the zoom stops at `minZoom`. On a model whose box is far
 * larger than the pane (the harness with no viewpoint: 6134 x 40664 flow px against a 1238 x 776 pane) the box
 * centre falls between the nodes and the canvas opens on an empty area. The same happens to a stored viewport that
 * frames no node any more. After the fit, `openViewportFallback` keeps the zoom and pans so that the node nearest
 * the box centre sits at the centre of the padded pane, the point the fit itself aims at. Pure: the caller reads
 * React Flow's store and the overlay inset.
 */
import type { FlowViewport } from './utils/revealNode';

/** A node in flow coordinates: positionAbsolute and measured size (0 when unmeasured). */
export interface NodeRect {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

/** React Flow's pane (the store's width/height) and the part on its right the overlay covers. */
export interface OpenPane {
    width: number;
    height: number;
    rightInset: number;
}

type PaddingValue = number | string;
export type FitPaddingInput =
    | PaddingValue
    | { top?: PaddingValue; right?: PaddingValue; bottom?: PaddingValue; left?: PaddingValue; x?: PaddingValue; y?: PaddingValue };

export interface ResolvedPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/** One padding value in px, as `parsePadding` of @xyflow/system 12.10.2 resolves it (an invalid value is 0). */
function resolveOne(padding: PaddingValue, span: number): number {
    if (typeof padding === 'number') return Math.floor((span - span / (1 + padding)) * 0.5);
    const n = parseFloat(padding);
    if (Number.isNaN(n)) return 0;
    if (padding.endsWith('px')) return Math.floor(n);
    if (padding.endsWith('%')) return Math.floor(span * n * 0.01);
    return 0;
}

/** The px paddings a `fitView` padding (`fitPadding()`) resolves to on a pane of `width` x `height`. */
export function resolvePadding(padding: FitPaddingInput, width: number, height: number): ResolvedPadding {
    if (typeof padding !== 'object') {
        const y = resolveOne(padding, height);
        const x = resolveOne(padding, width);
        return { top: y, right: x, bottom: y, left: x };
    }
    return {
        top: resolveOne(padding.top ?? padding.y ?? 0, height),
        right: resolveOne(padding.right ?? padding.x ?? 0, width),
        bottom: resolveOne(padding.bottom ?? padding.y ?? 0, height),
        left: resolveOne(padding.left ?? padding.x ?? 0, width),
    };
}

/**
 * `null` when a node is in view under `current`, when there is no node, or when the pane has no size. In view means
 * on the visible part of the pane: x in [0, width - rightInset], y in [0, height]; the overlay covers the inset, the
 * fit's own margins are visible. Otherwise the viewport, same zoom, that puts the centre of the node nearest the
 * centre of the nodes' bounding box (distance to the node rect, 0 inside it, ties by id) at the padded pane centre.
 */
export function openViewportFallback(
    rects: readonly NodeRect[],
    current: FlowViewport,
    pane: OpenPane,
    padding: FitPaddingInput,
): FlowViewport | null {
    const { width, height } = pane;
    const visibleRight = width - Math.min(Math.max(pane.rightInset, 0), width);
    if (rects.length === 0 || !(visibleRight > 0) || !(height > 0)) return null;
    const { x: tx, y: ty, zoom } = current;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rects) {
        const left = r.x * zoom + tx;
        const top = r.y * zoom + ty;
        if (left + r.w * zoom > 0 && left < visibleRight && top + r.h * zoom > 0 && top < height) return null;
        x0 = Math.min(x0, r.x);
        y0 = Math.min(y0, r.y);
        x1 = Math.max(x1, r.x + r.w);
        y1 = Math.max(y1, r.y + r.h);
    }
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    let anchor = rects[0];
    let best = Infinity;
    for (const r of rects) {
        const dx = Math.max(r.x - cx, 0, cx - (r.x + r.w));
        const dy = Math.max(r.y - cy, 0, cy - (r.y + r.h));
        const d = dx * dx + dy * dy;
        if (d < best || (d === best && r.id < anchor.id)) {
            best = d;
            anchor = r;
        }
    }
    const pad = resolvePadding(padding, width, height);
    const sx = (pad.left + width - pad.right) / 2;
    const sy = (pad.top + height - pad.bottom) / 2;
    return { x: sx - (anchor.x + anchor.w / 2) * zoom, y: sy - (anchor.y + anchor.h / 2) * zoom, zoom };
}
