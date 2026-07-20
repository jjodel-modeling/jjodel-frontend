import {
    DVoidEdge,
    LGraphElement,
    Log,
    Pointer,
    PrimitiveType,
} from '../../../joiner';
import type {
    EdgeSegment,
    LVoidEdge,
    labelfunc,
    labeltype,
} from '../../../model/dataStructure/GraphDataElements';

function computeLabel(
    segment: EdgeSegment,
    allNodes: LGraphElement[],
    allSegments: EdgeSegment[],
    longestLabel: labeltype,
    labels: labeltype,
    edgeProxy: LVoidEdge,
    edgeId: Pointer<DVoidEdge>,
): PrimitiveType | undefined {
    let key: "longestLabel" | "labels" = segment.isLongest ? "longestLabel" : "labels"; // : keyof this
    // if (isLongestSegment) return this.get_longestLabel_impl(d, l, nodes, index):
    const l = edgeProxy;
    let labelmaker: any = key === "longestLabel" ? longestLabel : labels;
    let labelmakerfunc: labelfunc = labelmaker as any;
    // let lastSeg = segments[i-1];
    switch (typeof labelmaker) {//nb{}[]<>
        case "number":
        case "undefined":
        case "boolean":
        case "string": return labelmaker;
        // case "function": return nodes.map( (o, i) => d.labels(l, nodes, i)).slice(0, nodes.length-1);
        // (e:LVoidEdge, segment: EdgeSegment, allNodes: LEdge["allNodes"], allSegments: EdgeSegment[]) => PrimitiveType
        case "function": return labelmakerfunc(l, segment, allNodes as any, allSegments);
        default: break;
        case "object":
            if (labelmaker === null) return null as any;
            if (!Array.isArray(labelmaker)) break;
            let elem = (labelmaker as PrimitiveType[])[segment.index % labelmaker.length];
            if (typeof elem === "function") return (elem as labelfunc)(l, segment, allNodes as any, allSegments);
            return elem;
    }
    Log.exx("edge labels invalid type, must be a primitive value, a function or an array of such.", {labelmaker, key, edgeId});
    return undefined;
}

export function setLabels(
    segments: EdgeSegment[],
    allNodes: LGraphElement[],
    longestLabel: labeltype,
    labels: labeltype,
    edgeProxy: LVoidEdge,
    edgeId: Pointer<DVoidEdge>,
): void {
    // find longest segment
    let longestindex = -1;
    let longest = 0;
    for (let i = 0; i < segments.length; i++) {
        let s = segments[i];
        s.calcLength();
        if (longest < s.length) { longest = s.length; longestindex = i; }
        s.isLongest = false;
    }
    if (longestindex >= 0) segments[longestindex].isLongest = true;
    // apply labels
    for (let s of segments) s.label = computeLabel(s, allNodes, segments, longestLabel, labels, edgeProxy, edgeId) as any;
}
