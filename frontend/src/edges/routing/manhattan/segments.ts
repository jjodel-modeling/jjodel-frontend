import {
    EdgeBendingMode,
    EdgeGapMode,
    GObject,
    GraphPoint,
    GraphSize,
    windoww,
} from '../../../joiner';
import {
    EdgeSegment,
    segmentmaker,
} from '../../../model/dataStructure/GraphDataElements';
import { computePoints, chooseManhattanSidesAndWaypoints } from './points';
import { computeHeadPosition } from './markers';
import { setLabels } from './labels';
import { snapSegmentsToBorders } from './snap';
import { svgLetterSize } from './stride';
import type { RoutingInput, RoutingOutput } from './types';

export function computeRouting(input: RoutingInput): RoutingOutput {
    const {
        allNodes,
        edge,
        edgeId,
        view,
        innermostGraph,
        rootGraph,
        anchorStart,
        anchorEnd,
        longestLabel,
        labels,
        isFollowingCoords,
        startFollow,
        endFollow,
        outer,
    } = input;

    const l = edge;
    const v = view;
    // TODO REMOVE: debug side-effect, kept for parity (was: windoww.edge = l in get_segments_impl)
    windoww.edge = l;
    let all: segmentmaker[] = computePoints(
        allNodes,
        outer,
        edgeId,
        innermostGraph,
        rootGraph,
        anchorStart,
        anchorEnd,
        isFollowingCoords,
        startFollow,
        endFollow,
    );
    //const all: {size: GraphSize, view: LViewElement, ge: LGraphElement}[] = allNodes.map((ge) => { return { view: ge.view, size: ge.size, ge}});
    let ret: EdgeSegment[] = [];
    let bm: EdgeBendingMode = v.bendingMode;
    let gapMode: EdgeGapMode = v.edgeGapMode;

    // Manhattan routing (orthogonal): insert axis-aligned corner waypoints between
    // consecutive node attachments so every leg stays a straight `L`. Corners are pushed as
    // DOUBLED pairs (arrival + departure at the same point), mirroring the midnode convention
    // the stride-1 grouping loop below relies on (it advances i += 2; a single corner would
    // be skipped and its outgoing leg dropped). effectiveBm = Line makes svgLetterSize and
    // EdgeSegment treat each leg as a straight segment, so no GraphDataElements/stride change
    // is needed. The non-Manhattan path is untouched.
    let effectiveBm: EdgeBendingMode = bm;
    if (bm === EdgeBendingMode.Manhattan) {
        effectiveBm = EdgeBendingMode.Line;
        let rebuilt: segmentmaker[] = [];
        for (let i = 0; i < all.length; i++) {
            rebuilt.push(all[i]);
            // real legs run from an even index (a departure) to the next (an arrival);
            // odd→even transitions are zero-length midnode pass-throughs and are skipped.
            if (i % 2 === 0 && i + 1 < all.length) {
                let corners = chooseManhattanSidesAndWaypoints(all[i].pt, all[i].size, all[i + 1].pt, all[i + 1].size);
                for (let cpt of corners) {
                    let arrival: segmentmaker = {
                        size: new GraphSize(cpt.x, cpt.y, 0.01, 0.01),
                        view: all[i].view, ge: all[i].ge, pt: cpt, uncutPt: cpt,
                    };
                    rebuilt.push(arrival);        // arrival at corner
                    rebuilt.push({ ...arrival });  // departure (doubled, mirrors midnode pair)
                }
            }
        }
        all = rebuilt;
    }

    let segmentSize = svgLetterSize(effectiveBm, false, true);
    let increase: number = segmentSize.first;
    let segment: EdgeSegment | undefined = undefined;
    /// grouping points according to SvgLetter
    for (let i = 0; i < all.length - 1; ) {
        // let start = all[i], end = all[i+increase];
        let start: segmentmaker = all[i];
        let endindex = (i+increase < all.length - 1) ? i+increase : all.length - 1;
        let mid: segmentmaker[] = all.slice(i+1, endindex).filter( (e, i)=> i % 2 === 0);
        let end: segmentmaker = all[endindex];
        // makes sure the edge actually reaches his target even if there is an invalid amount of midnodes fot the current EdgeBendingMode
        if (i === endindex && segment) start = segment.end;
        // segment = this.get_segmentv3(start, mid, end, getSvgLetter(i), i, segment, all);
        segment = new EdgeSegment(start, mid, end, effectiveBm, gapMode, i, segment);
        // segment = this.get_segment(start.ge, start.size, start.view, end.ge, end.size, end.view, cut, v.bendingMode, mid, ret[ret.length -1], fillMode, segment);
        ret.push(segment);
        i+= increase+1; // because increase index is already inserted at the end of prev segment
        if (increase !== segmentSize.others) increase = segmentSize.others;
        // if (longestLabel !== undefined && longest < s.length) { longest = s.length; longestindex = i; } todo: move to after snapping to borders
    }
    function printablesegment(s:GObject) {
        let r: GObject = {};
        for (let k in s) {
            let v = s[k];
            v = v?.__raw || v;
            if (typeof v === "object") r[k] = JSON.parse(JSON.stringify(v));
            else r[k] = v;
        }
        return r;
    }

    let fillSegments: EdgeSegment[] = [];
    snapSegmentsToBorders(v, ret, fillSegments);
    let _longestLabelData = (l as any).__raw?.longestLabel; // preserve assignment-without-use from original (was: c.data.longestLabel)
    void _longestLabelData;
    setLabels(ret, allNodes, longestLabel, labels, l, edgeId);
    // console.log("getSegments() labeled:", {main:ret, fillSegments});
    let rett: RoutingOutput = {all: [...ret, ...fillSegments], segments: ret, fillers: fillSegments} as any;
    /*switch(bm){
        default: break;
        case EdgeBendingMode.Bezier_QT:
        case EdgeBendingMode.Bezier_CS:
            rett.
    }*/
    for (let i = 0; i < rett.all.length; i++) {
        let s = rett.all[i];
        s.makeD(i, gapMode);
    }
    let zoom = new GraphPoint(1, 1);
    rett.head = computeHeadPosition(true, v, zoom, rett.segments[rett.segments.length - 1], v.edgeHeadSize);
    rett.tail = computeHeadPosition(false, v, zoom, rett.segments[0], v.edgeTailSize);
    return rett;
}
