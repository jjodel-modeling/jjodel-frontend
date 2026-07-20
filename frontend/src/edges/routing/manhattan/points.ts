import {
    DVoidEdge,
    GraphPoint,
    GraphSize,
    LGraph,
    LGraphElement,
    Log,
    Pointer,
} from '../../../joiner';
import type { segmentmaker } from '../../../model/dataStructure/GraphDataElements';

type AnchorSpec = DVoidEdge['anchorStart'];

function getAnchorOffset(size: GraphSize, offset: GraphPoint, isPercentage: boolean, $factor: number = 100) {
    if (!size) size = new GraphSize(0, 0, 0, 0);
    // else if (!size.tl) size = new GraphSize(size.x, size.y, size.w, size.h);
    if (isPercentage) offset = new GraphPoint(offset.x/$factor*(size.w), offset.y/$factor*(size.h));
    return size.tl().add(offset, false);
}

export function computePoints(
    allNodes: LGraphElement[],
    outer: boolean,
    edgeId: Pointer<DVoidEdge>,
    innermost: LGraph,
    root: LGraph,
    anchorStart: AnchorSpec,
    anchorEnd: AnchorSpec,
    isFollowingCoords: GraphPoint | undefined,
    startFollow: Pointer<DVoidEdge> | undefined,
    endFollow: Pointer<DVoidEdge> | undefined,
): segmentmaker[] {
    const all: segmentmaker[] = allNodes.flatMap((ge, i) => {
        let dge = ge.__raw;
        let size = outer ? ge.outerSize : ge.innerSize;

        if (outer && root && innermost && innermost.id !== root.id) {
            size = innermost.translateSize(size, root);
        }
        let base: segmentmaker = {view: ge.view, size, ge, pt: null as any, uncutPt: null as any};

        Log.exDev(typeof base.size !== "object", "could not get node size:", {base, outer})
        let rets: segmentmaker | undefined;// = base as any;
        let rete: segmentmaker | undefined;// = {...base} as any;
        let debug = true;
        if (debug) {
            (base as any).anchor_e = typeof anchorEnd === 'object'? anchorEnd
                : (dge.anchors[anchorEnd || 0] || dge.anchors[Object.keys(dge.anchors)[0]]);
            (base as any).anchor_s = typeof anchorStart === 'object'? anchorStart
                : (dge.anchors[anchorStart || 0] || dge.anchors[Object.keys(dge.anchors)[0]]);
        }

        // get endpoint, then startpoint (land on midnode, then depart from it)
        if (i !== 0){
            rete = {rete:true, ...base} as any as segmentmaker;
            if (i === allNodes.length - 1) {
                // get end anchor from node
                let anchor: GraphPoint | undefined;
                if (!anchorEnd || typeof anchorEnd === 'string') {
                    anchor = dge.anchors[anchorEnd || 0];
                    Log.w(!anchor, 'Specified anchorEnd name does not exist on target: '+anchorEnd, {anchor: anchorEnd||0, node: dge});
                }
                else if (typeof anchorEnd === 'object') {
                    if ('x' in anchorEnd && 'y' in anchorEnd) anchor = anchorEnd as any as GraphPoint;
                    Log.w(!anchor, 'Specified anchorEnd object is invalid: '+anchorEnd, {anchor: anchorEnd, node: dge});
                }
                if (!anchor) anchor = dge.anchors[0] || dge.anchors[Object.keys(dge.anchors)[0]];
                if (anchor) rete.pt = getAnchorOffset(rete.size, anchor, true, 1);
            }
            // if no anchor, treat the node as a midpoint
            if (!rete.pt) {
                // get ending point from midpoint
                //rete.pt = (LEdgePoint.singleton as LEdgePoint).get_endPoint(undefined as any, rete.size, rete.view);
                rete.pt = getAnchorOffset(rete.size, rete.view.edgeStartOffset, rete.view.edgeStartOffset_isPercentage);
            }
            rete.uncutPt = rete.pt;
        }
        if (i !== allNodes.length - 1){
            rets = {rets: true, ...base} as any as segmentmaker;
            if (i === 0) {
                // get start anchor from node
                let anchor: GraphPoint | undefined;
                if (!anchorStart || typeof anchorStart === 'string') {
                    anchor = dge.anchors[anchorStart || 0];
                    Log.w(!anchor, 'Specified anchorStart name does not exist on target: '+anchorStart, {anchor: anchorStart||0, node: dge});
                }
                else if (typeof anchorStart === 'object') {
                    if ('x' in anchorStart && 'y' in anchorStart) anchor = anchorStart as any as GraphPoint;
                    Log.w(!anchor, 'Specified anchorStart object is invalid: '+anchorStart, {anchor: anchorStart, node: dge});
                }
                if (!anchor) anchor = dge.anchors[Object.keys(dge.anchors)[0]];
                if (anchor) rets.pt = getAnchorOffset(rets.size, anchor, true, 1);
            }
            if (!rets.pt) {
                // rets starting point from midpoint
                // rets.pt = (LEdgePoint.singleton as LEdgePoint).get_startPoint(undefined as any, rets.size, rets.view);
                rets.pt = getAnchorOffset(rets.size, rets.view.edgeStartOffset, rets.view.edgeStartOffset_isPercentage);
            }
            rets.uncutPt = rets.pt;
        }

        // ret.pt = ge.startPoint
        return rets && rete ? [rete, rets] : (rets ? [rets] : [rete as segmentmaker]); }
    );

    if (isFollowingCoords){
        if (edgeId === endFollow) {
            let seg = all[all.length - 1];
            seg.pt = isFollowingCoords;
            seg.size = new GraphSize(seg.pt.x, seg.pt.y, 0.01, 0.01);
        }
        if (edgeId === startFollow) {
            let seg = all[0];
            seg.pt = isFollowingCoords;
            seg.size = new GraphSize(seg.pt.x, seg.pt.y, 0.01, 0.01);
        }
    }
    return all;
}

const MANHATTAN_STUB = 16; // px perpendicular exit stub out of the node side; tune on screen

type ManhattanSide = 'L' | 'R' | 'T' | 'B';

/** True when the attachment sits ~center, i.e. has no inherent side. */
function manhattanIsCenter(pt: GraphPoint, size: GraphSize): boolean {
    const rx = size.w ? (pt.x - size.x) / size.w : 0.5;
    const ry = size.h ? (pt.y - size.y) / size.h : 0.5;
    return Math.abs(rx - 0.5) < 0.15 && Math.abs(ry - 0.5) < 0.15;
}

/**
 * Exact side (L/R/T/B) an edge endpoint attaches to, from where its anchor-resolved
 * attachment point sits inside the node bbox. A ~center attachment has no inherent side, so
 * it faces the other endpoint (towardX/towardY = the other attachment minus this one) — this
 * preserves the default-center look.
 */
function manhattanSideOf(pt: GraphPoint, size: GraphSize, towardX: number, towardY: number): ManhattanSide {
    if (manhattanIsCenter(pt, size)) {                  // ~center → face the other endpoint
        return Math.abs(towardX) >= Math.abs(towardY)
            ? (towardX >= 0 ? 'R' : 'L')
            : (towardY >= 0 ? 'B' : 'T');
    }
    const rx = size.w ? (pt.x - size.x) / size.w : 0.5; // 0 = left border, 1 = right border
    const ry = size.h ? (pt.y - size.y) / size.h : 0.5; // 0 = top border, 1 = bottom border
    return Math.abs(rx - 0.5) >= Math.abs(ry - 0.5) ? (rx >= 0.5 ? 'R' : 'L') : (ry >= 0.5 ? 'B' : 'T');
}

/**
 * Project an attachment point onto the chosen side of its node bbox: keep the along-side
 * coordinate, snap the perpendicular one to that border (left = size.x, right = size.x+w,
 * top = size.y, bottom = size.y+h). The stub then starts at the border and points outward.
 */
function manhattanBorderPoint(a: GraphPoint, size: GraphSize, side: ManhattanSide): GraphPoint {
    switch (side) {
        case 'R': return new GraphPoint(size.x + size.w, a.y);
        case 'L': return new GraphPoint(size.x, a.y);
        case 'B': return new GraphPoint(a.x, size.y + size.h);
        case 'T': return new GraphPoint(a.x, size.y);
        default:  return new GraphPoint(a.x, a.y);
    }
}

// ── orthogonal port routing — connect two stubs without entering either node interior ──

interface ManhattanBox { L: number; R: number; T: number; B: number; }
function manhattanBox(size: GraphSize): ManhattanBox {
    return { L: size.x, R: size.x + size.w, T: size.y, B: size.y + size.h };
}

/** Does the axis-aligned segment a→b pass through the STRICT interior of box? */
function manhattanSegHitsBox(a: GraphPoint, b: GraphPoint, box: ManhattanBox): boolean {
    const eps = 0.5;
    if (a.y === b.y) {                                  // horizontal
        if (a.y <= box.T + eps || a.y >= box.B - eps) return false;
        return Math.max(a.x, b.x) > box.L + eps && Math.min(a.x, b.x) < box.R - eps;
    }
    if (a.x === b.x) {                                  // vertical
        if (a.x <= box.L + eps || a.x >= box.R - eps) return false;
        return Math.max(a.y, b.y) > box.T + eps && Math.min(a.y, b.y) < box.B - eps;
    }
    return false;                                       // non-axis-aligned: not produced here
}
function manhattanPathHitsBoxes(pts: GraphPoint[], a: ManhattanBox, b: ManhattanBox): boolean {
    for (let i = 0; i + 1 < pts.length; i++) {
        if (manhattanSegHitsBox(pts[i], pts[i + 1], a)) return true;
        if (manhattanSegHitsBox(pts[i], pts[i + 1], b)) return true;
    }
    return false;
}
function manhattanPathLen(pts: GraphPoint[]): number {
    let len = 0;
    for (let i = 0; i + 1 < pts.length; i++) len += Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
    return len;
}

/**
 * Compact facing connector (Z when the two stubs share an axis, L when perpendicular)
 * between two stubs — the confirmed center-anchor baseline. Returns [p, …corners…, q].
 */
function manhattanCompactConnector(p: GraphPoint, sideP: ManhattanSide, q: GraphPoint, sideQ: ManhattanSide): GraphPoint[] {
    const axisP = (sideP === 'L' || sideP === 'R') ? 'H' : 'V';
    const axisQ = (sideQ === 'L' || sideQ === 'R') ? 'H' : 'V';
    if (axisP === axisQ) {
        if (axisP === 'H') { const midX = (p.x + q.x) / 2; return [p, new GraphPoint(midX, p.y), new GraphPoint(midX, q.y), q]; }
        const midY = (p.y + q.y) / 2; return [p, new GraphPoint(p.x, midY), new GraphPoint(q.x, midY), q];
    }
    return axisP === 'H' ? [p, new GraphPoint(q.x, p.y), q] : [p, new GraphPoint(p.x, q.y), q];
}

/**
 * Port router: connect the two stubs with the shortest orthogonal polyline that does NOT
 * enter either node interior. Enumerates L-shapes and Z-shapes through vertical/horizontal
 * channels (the midpoint, each box edge ± clearance, and the outer wrap edges), keeps the
 * box-clear ones, and returns the shortest. When the target lies behind the exit direction,
 * the clean candidate is necessarily a wrap channel past the node's edge — exactly the
 * "route around" detour. Falls back to the shortest candidate if a pathological config
 * admits none (never crashes). Returns [p, …corners…, q].
 */
function manhattanPortRoute(
    p: GraphPoint, q: GraphPoint, boxS: ManhattanBox, boxT: ManhattanBox, bSrc: GraphPoint, bTgt: GraphPoint,
): GraphPoint[] {
    const S = MANHATTAN_STUB;
    const candXs = [(p.x + q.x) / 2,
        boxS.L - S, boxS.R + S, boxT.L - S, boxT.R + S,
        Math.min(boxS.L, boxT.L) - S, Math.max(boxS.R, boxT.R) + S];
    const candYs = [(p.y + q.y) / 2,
        boxS.T - S, boxS.B + S, boxT.T - S, boxT.B + S,
        Math.min(boxS.T, boxT.T) - S, Math.max(boxS.B, boxT.B) + S];
    const candidates: GraphPoint[][] = [
        [p, new GraphPoint(q.x, p.y), q],   // L-shape (H then V)
        [p, new GraphPoint(p.x, q.y), q],   // L-shape (V then H)
    ];
    for (const vx of candXs) candidates.push([p, new GraphPoint(vx, p.y), new GraphPoint(vx, q.y), q]); // Z via vertical channel
    for (const vy of candYs) candidates.push([p, new GraphPoint(p.x, vy), new GraphPoint(q.x, vy), q]); // Z via horizontal channel

    const cost = (c: GraphPoint[]) => manhattanPathLen([bSrc, ...c, bTgt]);
    const clear = candidates.filter(c => !manhattanPathHitsBoxes([bSrc, ...c, bTgt], boxS, boxT));
    const pool = clear.length ? clear : candidates;
    return pool.reduce((best, c) => (cost(c) < cost(best) ? c : best));
}

/**
 * Manhattan (orthogonal) corner waypoints between two edge endpoints. Each endpoint exits
 * perpendicular to the side its anchor sits on, via a short stub OUTSIDE the node border
 * (manhattanBorderPoint + MANHATTAN_STUB). The two stubs are joined by manhattanPortRoute,
 * which guarantees no segment enters the source or target interior — when the target lies
 * behind the exit direction it routes AROUND the node instead of crossing it. Pure center
 * anchors keep the compact facing connector (the confirmed baseline): no side constraint,
 * leave toward the other node.
 *
 * Returns the ordered interior corner points between the two attachments (stub ends + the
 * connector bends), spliced as doubled pairs in computeRouting. snapSegmentsToBorders then
 * cuts each attachment to its border along the stub axis with no snap change. Pure — reads
 * only the two points and sizes, no store/proxy access.
 */
export function chooseManhattanSidesAndWaypoints(
    aSrc: GraphPoint, sizeSrc: GraphSize, aTgt: GraphPoint, sizeTgt: GraphSize,
): GraphPoint[] {
    const sideS = manhattanSideOf(aSrc, sizeSrc, aTgt.x - aSrc.x, aTgt.y - aSrc.y);
    const sideT = manhattanSideOf(aTgt, sizeTgt, aSrc.x - aTgt.x, aSrc.y - aTgt.y);
    const dirX = (s: ManhattanSide) => (s === 'L' ? -1 : s === 'R' ? 1 : 0);
    const dirY = (s: ManhattanSide) => (s === 'T' ? -1 : s === 'B' ? 1 : 0);
    // Start the stub at the node BORDER (project the attachment onto its side), then push it
    // STUB px outside. The ray aSrc→sStub thus crosses the border, so snapSegmentsToBorders
    // cuts the attachment exactly there and no segment dips into the box interior.
    const bSrc = manhattanBorderPoint(aSrc, sizeSrc, sideS);
    const bTgt = manhattanBorderPoint(aTgt, sizeTgt, sideT);
    const sStub = new GraphPoint(bSrc.x + dirX(sideS) * MANHATTAN_STUB, bSrc.y + dirY(sideS) * MANHATTAN_STUB);
    const tStub = new GraphPoint(bTgt.x + dirX(sideT) * MANHATTAN_STUB, bTgt.y + dirY(sideT) * MANHATTAN_STUB);

    // Center anchors: keep the compact facing connector (confirmed baseline). Otherwise route
    // with the port router that guarantees no segment enters either node interior.
    const corners = (manhattanIsCenter(aSrc, sizeSrc) && manhattanIsCenter(aTgt, sizeTgt))
        ? manhattanCompactConnector(sStub, sideS, tStub, sideT)
        : manhattanPortRoute(sStub, tStub, manhattanBox(sizeSrc), manhattanBox(sizeTgt), bSrc, bTgt);

    // drop consecutive coincident points (zero-length legs) for clean snapping
    const out: GraphPoint[] = [];
    for (const c of corners) {
        const last = out[out.length - 1];
        if (!last || last.x !== c.x || last.y !== c.y) out.push(c);
    }
    return out;
}
