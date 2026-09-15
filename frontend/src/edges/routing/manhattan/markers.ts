import {
    Geom,
    GraphPoint,
    GraphSize,
    LViewElement,
    Log,
} from '../../../joiner';
import type { EdgeSegment } from '../../../model/dataStructure/GraphDataElements';
import type { HeadPosition } from './types';

export function computeHeadPosition(
    isHead: boolean,
    view: LViewElement,
    zoom: GraphPoint,
    segment: EdgeSegment,
    headSize0?: GraphPoint,
): HeadPosition {
    // let v: LViewElement = this.get_view(c);
    let tmp: any = headSize0 || (isHead ? view.edgeHeadSize : view.edgeTailSize);
    if (!tmp || tmp.x === 0 || tmp.y === 0) {
        // head or tail missing
        tmp = new GraphSize(0, 0, 0, 0);
        tmp.rad = 0;
        return tmp;
    }
    // zoom intentionally unused (kept for parity); was: .multiply({w:zoom.x, h:zoom.y})
    let _zoom: GraphPoint = zoom;// ownZoom or cumulativeZoom?
    void _zoom;
    let headPos: GraphSize & {rad: number} = (new GraphSize(0, 0, tmp.x, tmp.y) as any); //.multiply({w:zoom.x, h:zoom.y});
    let useBezierPoints = true;
    let start: GraphPoint, end: GraphPoint;
    let m: number;
    if (useBezierPoints) {
        if (isHead) {
            start = segment.end.pt;
            end = (segment.bezier[segment.bezier.length - 1] || segment.start).pt;
        } else {
            start = segment.start.pt;
            end = (segment.bezier[0] || segment.end).pt;
        }
        m = GraphPoint.getM(start, end);
    } else {
        if (isHead) { start = segment.end.pt; end = segment.start.pt; }
        else { start = segment.start.pt; end = segment.end.pt; }
        m = segment.m;
    }
    // first find the center of where it should be positioned
    // let center: GraphPoint;
    // let distance: number = Math.sqrt(headPos.w*headPos.w + headPos.h*headPos.h);
    // let isVertical = m >=1 ;
    let x4headsize = new GraphSize(start.x - headPos.w, start.y - headPos.h, headPos.w*2, headPos.h*2);
    // first intersection is segment origin. second is found with the box containing all possible edgeHead positions that touch the startPoint
    // (doing x4 his shape and placing 4 "rectangles" all around startPoint forming a 2x2 square) to cover all possible segment directions.
    // or finding first direction (vertical if m >1, horizontal if m<0) and vector direction and intersecting with only the "correct" placed edgeHead rectangle.
    // then the intersection will likely not fall on the extreme angle of EdgeHead and i can re-center edgeHead
    // so that first and second intersections are equal spaced with the center segment
    // later comment: i think original head is placed with .tl() equal to edge.endPoint (target anchor pos),
    // then you build a 2x2 square around it (center of 2x2 square is edge.endPoint) to move it where the edge is coming, intersecting it.
    let secondIntersection: GraphPoint | undefined;
    let segmentDistance = start.distanceFromPoint(end);
    if (segmentDistance <= Math.sqrt(headPos.w**2 + headPos.h**2)){ // todo: if pts are too close and m is infinite, this crashes?
        let safeDistance = Math.max(headPos.w, headPos.h)*5;
        // Push `end` away from `start` ALONG the segment's actual direction so the box
        // intersection below has room. Normalising by (dx,dy) keeps this correct for
        // horizontal, vertical (m = Infinity) and diagonal short segments alike — the old
        // form placed end.y on the X axis and routed through m, which blew up for vertical
        // stubs (frequent with top/bottom anchors in Manhattan routing).
        const dx = end.x - start.x, dy = end.y - start.y;
        const len = Math.hypot(dx, dy) || 1;
        end = new GraphPoint(end.x + (dx / len) * safeDistance, end.y + (dy / len) * safeDistance);
        // too small to fit edgeHead; we only need the direction — the box-intersection re-centers it
    }
    secondIntersection = GraphSize.closestIntersection(x4headsize, start, end, undefined, m, undefined);
    if (!secondIntersection) {
       return Log.exDevv("failed to intersect edge head", {x4headsize, segment, headPos, start, end, useBezierPoints, m});
    }
    tmp = secondIntersection.add(start, false).divide(2); // center of edgehead
    headPos.x = tmp.x - headPos.w / 2; // tl corner
    headPos.y = tmp.y - headPos.h / 2; // tl corner
    headPos.rad = Geom.mToRad(m, start, end);
    /*
    devo trovare la distanza tra il centro dell'egeHead e il punto di inizio in termini assoluti, così tramite M trovo distanza in x e y. o trovarla in altro modo
    if (segment.m === Number.POSITIVE_INFINITY || segment.m === Number.NEGATIVE_INFINITY) {
        center = segment.start.pt.add({x:0, y: distance}, true); }
    else { center = segment.start.pt.add({x:segment.m*headPos.w/2, y:segment.m*headPos.h/2
     this is wrong, cannot be the same for x and y, i should invert the line equation for x?}, true); }
    headPos.x = center.x - headPos.w / 2;
    headPos.y = center.y - headPos.h / 2;*/
    // console.log("head intersected", {headPos, secondIntersection, x4headsize, segment, c, start, end, useBezierPoints});

    return headPos;
}
