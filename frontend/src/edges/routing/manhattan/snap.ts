import {
    EdgeBendingMode,
    EdgeGapMode,
    Geom,
    GraphPoint,
    GraphSize,
    LViewElement,
    Log,
} from '../../../joiner';
import type { EdgeSegment } from '../../../model/dataStructure/GraphDataElements';

export function snapSegmentsToBorders(
    v: LViewElement,
    ret: EdgeSegment[],
    fillSegments: EdgeSegment[],
): void {
    // snap segment start and end to a node border
    let canCutStart: boolean = v.edgeStartStopAtBoundaries,
        canCutEnd: boolean = v.edgeEndStopAtBoundaries;
    let grid: GraphPoint | undefined = undefined;
    // let fillSegments: EdgeSegment[] = [];
    let gapMode: EdgeGapMode = v.edgeGapMode;
    let bm: EdgeBendingMode = v.bendingMode;


    let ci: GraphPoint | undefined;
    // cut i === 0 is cut regardless of gapmode.
    if (canCutStart) {
        ci = GraphSize.closestIntersection(ret[0].start.size, ret[0].start.pt, (ret[0].bezier[0] || ret[0].end).pt, grid);
        if (ci) ret[0].start.pt = ci;
        /*
        ret[0].start.pt =
            GraphSize.closestIntersection(ret[0].start.size, ret[0].start.pt, (ret[0].bezier[0] || ret[0].end).pt, grid) as any
            || Geom.closestPoint(ret[0].start.size, ret[0].start.pt);*/
    }

    // cut middle segments maybe
    let prev: EdgeSegment;
    let curr: EdgeSegment = ret[0];

    // if (gapMode === EdgeGapMode.gap) return;
    if (canCutStart || canCutEnd) // do the for below
        for (let i = 1; i < ret.length; i++){
            prev = ret[i-1];
            curr = ret[i];
            let doStartCut: boolean, doEndCut: boolean;
            switch(gapMode){/*
                case EdgeGapMode.arcFill:
                case EdgeGapMode.lineFill:
                case EdgeGapMode.autoFill:
                    // same as gap, but will insert 1 more segment to fill the hole
                    doStartCut = true;
                    doEndCut = true;
                    if (prev.end.pt.equals(curr.start.pt)) break;
                    fillSegments.push(new EdgeFillSegment(
                        prev.end,
                        [
                            {...prev.end, pt: EdgeSegment.invertLastBezierPt(prev.end.pt, (prev.bezier[prev.bezier.length-1] || prev.start).pt)},
                            {...curr.start, pt: EdgeSegment.invertLastBezierPt(curr.start.pt, (curr.bezier[0] || curr.end).pt)}
                        ],
                        curr.start,
                        bm, gapMode, 0, undefined));
                        / *
                        fillSegments.push(new FillEdgeSegment( // M <start_gap> C <bez1> <bez2> <end_gap>
                           // <start_gap> = end of last seg (start of gap) <end_gap> = first of curr seg (end of gap)
                        prev.end.pt,
                        EdgeSegment.invertLastBezierPt(prev.end.pt, prev.bezier[prev.bezier.length-1].pt || prev.start.pt),
                        EdgeSegment.invertLastBezierPt(curr.start.pt, curr.bezier[0].pt || curr.end.pt),
                        curr.start.pt)* /

                    break;*/
                case EdgeGapMode.gap:
                    // just snap to vertex edge         prevSegment.endp and ret.startp
                    doEndCut = true; doStartCut = true;
                    break;
                // average: todo: maybe rename in join (merges start-end at closest pt to both (avg), then snap on edge)
                case "closest" as any: //EdgeGapMode.closest:
                    // does not work properly, i think i need to get next.end instead of curr.end, just disabled for now
                    let nextpt: GraphPoint = (curr.bezier[0] || curr.end).pt;
                    let prevpt: GraphPoint = (prev.bezier[prev.bezier.length-1] || prev.start).pt;
                    let midexternalpt = prevpt.add(nextpt, true);
                    let midedgepoint = curr.start.size.tl().add(curr.start.size.br(), false).divide(2, false);
                    // od average between the 2 points before and after that are not part of this edgepoint, then raw a line from there to center of ep, find that intersection.
                    ci = GraphSize.closestIntersection(curr.start.size, midedgepoint, midexternalpt, grid);
                    doEndCut = doStartCut = false;
                    if (canCutEnd && ci) prev.end.pt = ci;
                    if (canCutStart && ci) curr.start.pt = ci;
                    break;
                case EdgeGapMode.average:
                    // first move to average of the 2 points in the gap, then snap to edge
                    doEndCut = true; doStartCut = true;
                    // indipendent from cutStart, cutEnd.
                    // they merge if just 1 of cutting sides are true. (and if they are both false we don't even enter the for loop)
                    curr.start.pt = curr.start.pt.add(prev.end.pt, false).divide(2, false);
                    prev.end.pt = curr.start.pt.duplicate(); // intentionally not the same pt because during snap to edge they can diverge again.
                    prev.start.uncutPt = prev.start.pt;
                    prev.end.uncutPt = prev.end.pt;
                    break;
                // center: first move it to center of edgePoint/node, then snap to edge.
                // this mode might be as well deleted, it can be specified with anchor points
                case EdgeGapMode.center:
                    doEndCut = false; doStartCut = false;
                    curr.start.pt = curr.start.size.tl().add(curr.start.size.br(), false).divide(2, false);
                    prev.end.pt = curr.start.pt.duplicate(); // intentionally not the same pt because during snap to edge they can diverge again.
                    prev.start.uncutPt = prev.start.pt; // only update them when point moves without being cut (average and center)
                    prev.end.uncutPt = prev.end.pt;
                    break;
                default:
                    return Log.exDevv("unexpected EdgeGapMode:" + gapMode);
            }
            if (canCutStart && doStartCut){
                let nextpt: GraphPoint = (curr.bezier[0] || curr.end).pt;
                ci = GraphSize.closestIntersection(curr.start.size, curr.start.pt, nextpt, grid);
                if (ci) curr.start.pt = ci;// || Geom.closestPoint(curr.start.size, curr.start.pt);
                //if (gapMode === EdgeGapMode.average && prev) { prev.end.pt = curr.start.pt.add(prev.end.pt, false).divide(2, false); }
            }
            if (canCutEnd && doEndCut && prev){
                let prevpt: GraphPoint = (prev.bezier[prev.bezier.length-1] || prev.start).pt;
                ci = GraphSize.closestIntersection(prev.end.size, prev.end.pt, prevpt, grid);
                if (ci) prev.end.pt = ci;// || Geom.closestPoint(prev.end.size, prev.end.pt);
                // if average: first do average between start anchor points non-snapped. then i snap both,
                // then i do average again, and since it might snap out, i get closestPoint to EdgePoint size
                if (gapMode === EdgeGapMode.average) prev.end.pt = curr.start.pt =
                    Geom.closestPoint(curr.start.size, curr.start.pt.add(prev.end.pt, false).divide(2, false));
            }
        }
    // cut end of last segment regardless of gapMode
    if (canCutEnd) {
        let prevendpt = curr.end.pt;
        ci = GraphSize.closestIntersection(curr.end.size, curr.end.pt, (curr.bezier[curr.bezier.length-1] || curr.start).pt, grid);
        if (ci) curr.end.pt = ci; //|| Geom.closestPoint(prev.end.size, prev.end.pt);
    }

}
