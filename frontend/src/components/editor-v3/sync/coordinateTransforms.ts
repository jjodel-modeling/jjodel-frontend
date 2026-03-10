/**
 * Editor V3 — Coordinate transformations.
 *
 * Converts between JjOM GraphPoint/GraphSize (which can be in 5 different
 * coordinate modes) and React Flow absolute pixel coordinates.
 *
 * DEdgePoint.CoordinateMode:
 * - 'absolute': absolute canvas coordinates (default)
 * - 'relative%': percentage relative to bounding box of start→end
 * - 'relativeOffset': offset in pixels from midpoint of start→end
 * - 'relativeOffsetStart': offset from start vertex center
 * - 'relativeOffsetEnd': offset from end vertex center
 */

export type CoordinateMode =
    | 'absolute'
    | 'relative%'
    | 'relativeOffset'
    | 'relativeOffsetStart'
    | 'relativeOffsetEnd';

export interface AbsolutePoint {
    x: number;
    y: number;
}

export interface VertexRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Convert a JjOM edge bend point to absolute canvas coordinates.
 */
export function toAbsolute(
    point: { x: number; y: number },
    mode: CoordinateMode,
    sourceRect: VertexRect,
    targetRect: VertexRect,
): AbsolutePoint {
    const scx = sourceRect.x + sourceRect.w / 2;
    const scy = sourceRect.y + sourceRect.h / 2;
    const tcx = targetRect.x + targetRect.w / 2;
    const tcy = targetRect.y + targetRect.h / 2;

    switch (mode) {
        case 'absolute':
            return { x: point.x, y: point.y };

        case 'relative%': {
            const minX = Math.min(scx, tcx);
            const minY = Math.min(scy, tcy);
            const rangeX = Math.abs(tcx - scx) || 1;
            const rangeY = Math.abs(tcy - scy) || 1;
            return {
                x: minX + point.x * rangeX,
                y: minY + point.y * rangeY,
            };
        }

        case 'relativeOffset': {
            const midX = (scx + tcx) / 2;
            const midY = (scy + tcy) / 2;
            return { x: midX + point.x, y: midY + point.y };
        }

        case 'relativeOffsetStart':
            return { x: scx + point.x, y: scy + point.y };

        case 'relativeOffsetEnd':
            return { x: tcx + point.x, y: tcy + point.y };

        default:
            return { x: point.x, y: point.y };
    }
}

/**
 * Convert an absolute canvas coordinate back to the specified coordinate mode.
 */
export function fromAbsolute(
    absPoint: AbsolutePoint,
    mode: CoordinateMode,
    sourceRect: VertexRect,
    targetRect: VertexRect,
): { x: number; y: number } {
    const scx = sourceRect.x + sourceRect.w / 2;
    const scy = sourceRect.y + sourceRect.h / 2;
    const tcx = targetRect.x + targetRect.w / 2;
    const tcy = targetRect.y + targetRect.h / 2;

    switch (mode) {
        case 'absolute':
            return { x: absPoint.x, y: absPoint.y };

        case 'relative%': {
            const minX = Math.min(scx, tcx);
            const minY = Math.min(scy, tcy);
            const rangeX = Math.abs(tcx - scx) || 1;
            const rangeY = Math.abs(tcy - scy) || 1;
            return {
                x: (absPoint.x - minX) / rangeX,
                y: (absPoint.y - minY) / rangeY,
            };
        }

        case 'relativeOffset': {
            const midX = (scx + tcx) / 2;
            const midY = (scy + tcy) / 2;
            return { x: absPoint.x - midX, y: absPoint.y - midY };
        }

        case 'relativeOffsetStart':
            return { x: absPoint.x - scx, y: absPoint.y - scy };

        case 'relativeOffsetEnd':
            return { x: absPoint.x - tcx, y: absPoint.y - tcy };

        default:
            return { x: absPoint.x, y: absPoint.y };
    }
}

/**
 * Convert DVertex anchor percentages (0-1) to pixel offsets relative to node bounds.
 */
export function anchorToPixels(
    anchor: { x: number; y: number },
    nodeWidth: number,
    nodeHeight: number,
): { x: number; y: number } {
    return {
        x: anchor.x * nodeWidth,
        y: anchor.y * nodeHeight,
    };
}

/**
 * Convert pixel offset to anchor percentage (0-1).
 */
export function pixelsToAnchor(
    px: { x: number; y: number },
    nodeWidth: number,
    nodeHeight: number,
): { x: number; y: number } {
    return {
        x: nodeWidth > 0 ? px.x / nodeWidth : 0.5,
        y: nodeHeight > 0 ? px.y / nodeHeight : 0.5,
    };
}
