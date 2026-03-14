/**
 * MegamodelEdge — Types and Manhattan edge routing for the Megamodel diagram.
 *
 * Edges are orthogonal polylines with rounded corners (quadratic bezier, r=4).
 * Anchor points are spread when multiple edges share the same side of a node.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const NODE_W = 220;
export const NODE_H = 130;
const CORNER_R = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Side = 'top' | 'bottom' | 'left' | 'right';

export interface Point {
    x: number;
    y: number;
}

export type MmNodeKind = 'metamodel' | 'model' | 'transformation' | 'viewpoint';

export interface MmNodeStats {
    classCount?: number;
    referenceCount?: number;
    attributeCount?: number;
    objectCount?: number;
    linkCount?: number;
    ruleCount?: number;
    mappingCount?: number;
    completionPercent?: number;
}

export interface MmNodeStatus {
    type: 'valid' | 'warning' | 'info';
    label: string;
}

export interface MmNode {
    id: string;
    kind: MmNodeKind;
    name: string;
    badgeLabel: string;
    typeLabel: string;
    x: number;
    y: number;
    stats: MmNodeStats;
    status: MmNodeStatus;
}

export type MmEdgeType = 'conformsTo' | 'inputOf' | 'outputOf' | 'definedOn' | 'renderedBy';

export interface MmEdgeStyle {
    color: string;
    dasharray?: string;
    strokeWidth: number;
    opacity?: number;
}

export interface MmEdge {
    id: string;
    from: string;
    to: string;
    type: MmEdgeType;
    label: string;
    style: MmEdgeStyle;
    fromSide: Side;
    toSide: Side;
}

// ─── Style map ────────────────────────────────────────────────────────────────

export const EDGE_STYLES: Record<MmEdgeType, MmEdgeStyle & { label: string }> = {
    conformsTo:  { color: '#888780', dasharray: '5,3',  strokeWidth: 1,   opacity: 0.6, label: 'conformsTo' },
    inputOf:     { color: '#1D9E75',                     strokeWidth: 1.2, opacity: 1.0, label: 'inputOf' },
    outputOf:    { color: '#D85A30',                     strokeWidth: 1.2, opacity: 1.0, label: 'outputOf' },
    definedOn:   { color: '#7F77DD', dasharray: '3,3',   strokeWidth: 1,   opacity: 0.7, label: 'definedOn' },
    renderedBy:  { color: '#888780', dasharray: '2,4',   strokeWidth: 1,   opacity: 0.5, label: 'renderedBy' },
};

// ─── Port / anchor helpers ────────────────────────────────────────────────────

export function getPort(node: MmNode, side: Side, t = 0.5): Point {
    switch (side) {
        case 'top':    return { x: node.x + NODE_W * t,  y: node.y };
        case 'bottom': return { x: node.x + NODE_W * t,  y: node.y + NODE_H };
        case 'left':   return { x: node.x,               y: node.y + NODE_H * t };
        case 'right':  return { x: node.x + NODE_W,      y: node.y + NODE_H * t };
    }
}

/**
 * Compute spread `t` values for N edges sharing the same side of a node.
 * Returns an array of length N, each value in (0, 1).
 */
export function spreadAnchors(count: number): number[] {
    const result: number[] = [];
    for (let k = 1; k <= count; k++) {
        result.push(k / (count + 1));
    }
    return result;
}

// ─── Manhattan routing ────────────────────────────────────────────────────────

/**
 * Compute waypoints for a Manhattan (orthogonal) route between two ports.
 * Always exits/enters perpendicular to the port side.
 */
export function routePoints(p1: Point, exitSide: Side, p2: Point, entrySide: Side): Point[] {
    const exitV  = exitSide === 'top' || exitSide === 'bottom';
    const entryV = entrySide === 'top' || entrySide === 'bottom';

    if (exitV && entryV) {
        const mid = (p1.y + p2.y) / 2;
        return [p1, { x: p1.x, y: mid }, { x: p2.x, y: mid }, p2];
    }
    if (!exitV && !entryV) {
        const mid = (p1.x + p2.x) / 2;
        return [p1, { x: mid, y: p1.y }, { x: mid, y: p2.y }, p2];
    }
    if (exitV && !entryV) {
        return [p1, { x: p1.x, y: p2.y }, p2];
    }
    // !exitV && entryV
    return [p1, { x: p2.x, y: p1.y }, p2];
}

// ─── SVG path with rounded corners ────────────────────────────────────────────

/**
 * Build an SVG path string from waypoints with rounded corners (r = CORNER_R).
 * Uses quadratic bezier arcs at each bend.
 */
export function buildRoundedPath(pts: Point[]): string {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

    const r = CORNER_R;
    const parts: string[] = [`M${pts[0].x},${pts[0].y}`];

    for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[i + 1];

        // Vector from curr to prev / next
        const dxPrev = prev.x - curr.x;
        const dyPrev = prev.y - curr.y;
        const dxNext = next.x - curr.x;
        const dyNext = next.y - curr.y;

        const lenPrev = Math.sqrt(dxPrev * dxPrev + dyPrev * dyPrev);
        const lenNext = Math.sqrt(dxNext * dxNext + dyNext * dyNext);

        // Clamp radius so it doesn't exceed half the segment length
        const rr = Math.min(r, lenPrev / 2, lenNext / 2);

        // Points just before/after the corner
        const beforeX = curr.x + (dxPrev / lenPrev) * rr;
        const beforeY = curr.y + (dyPrev / lenPrev) * rr;
        const afterX  = curr.x + (dxNext / lenNext) * rr;
        const afterY  = curr.y + (dyNext / lenNext) * rr;

        parts.push(`L${beforeX},${beforeY}`);
        parts.push(`Q${curr.x},${curr.y} ${afterX},${afterY}`);
    }

    const last = pts[pts.length - 1];
    parts.push(`L${last.x},${last.y}`);

    return parts.join(' ');
}

// ─── Label positioning ────────────────────────────────────────────────────────

/**
 * Find the midpoint of the longest segment in a polyline — used for label placement.
 */
export function labelMidpoint(pts: Point[]): Point {
    if (pts.length < 2) return pts[0] ?? { x: 0, y: 0 };

    let bestLen = 0;
    let bestMid: Point = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

    for (let i = 0; i < pts.length - 1; i++) {
        const dx = pts[i + 1].x - pts[i].x;
        const dy = pts[i + 1].y - pts[i].y;
        const len = Math.abs(dx) + Math.abs(dy); // Manhattan length
        if (len > bestLen) {
            bestLen = len;
            bestMid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
        }
    }
    return bestMid;
}
