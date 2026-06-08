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

/**
 * Manhattan (orthogonal) corner waypoints between two node boxes, chosen by dominant axis.
 *
 * Turns the single diagonal leg source-center → target-center into an orthogonal HVH / VHV
 * path:
 *   - horizontal dominant (|dx| >= |dy|): exit/enter on left|right; corners on the vertical
 *     midline → [(midX, srcY), (midX, tgtY)];
 *   - vertical dominant: exit/enter on top|bottom; corners on the horizontal midline
 *     → [(srcX, midY), (tgtX, midY)].
 * Each corner is aligned to one node's center axis, so the existing border ray-cast in
 * snapSegmentsToBorders lands on the side-midpoint with no snap change.
 *
 * Returns [] when the boxes are already axis-aligned (dx === 0 || dy === 0): a single
 * straight orthogonal leg already suffices and inserting corners would create a zero-length
 * segment. Pure — reads only the two sizes, no store/proxy access.
 */
export function chooseManhattanSidesAndWaypoints(srcSize: GraphSize, tgtSize: GraphSize): GraphPoint[] {
    const sx = srcSize.x + srcSize.w / 2;
    const sy = srcSize.y + srcSize.h / 2;
    const tx = tgtSize.x + tgtSize.w / 2;
    const ty = tgtSize.y + tgtSize.h / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    if (dx === 0 || dy === 0) return []; // already orthogonal: no bend needed
    if (Math.abs(dx) >= Math.abs(dy)) {
        const midX = (sx + tx) / 2;
        return [new GraphPoint(midX, sy), new GraphPoint(midX, ty)];
    }
    const midY = (sy + ty) / 2;
    return [new GraphPoint(sx, midY), new GraphPoint(tx, midY)];
}
