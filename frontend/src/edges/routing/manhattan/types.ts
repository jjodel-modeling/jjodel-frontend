import type {
    DVoidEdge,
    EdgeFillSegment,
    EdgeSegment,
    GraphPoint,
    GraphSize,
    LGraph,
    LGraphElement,
    LViewElement,
    LVoidEdge,
    Pointer,
} from '../../../joiner';
import type {
    LEdgePoint,
    labeltype,
    segmentmaker,
} from '../../../model/dataStructure/GraphDataElements';

export type SegmentMaker = segmentmaker;

export type HeadPosition = GraphSize & { rad: number };

export interface RoutingOutput {
    all: EdgeSegment[];
    segments: EdgeSegment[];
    fillers: EdgeSegment[];
    head: HeadPosition;
    tail: HeadPosition;
}

export interface RoutingInput {
    allNodes: LGraphElement[];
    edge: LVoidEdge;
    edgeId: Pointer<DVoidEdge>;
    view: LViewElement;
    innermostGraph: LGraph;
    rootGraph: LGraph;
    anchorStart: string | { x: number; y: number } | undefined;
    anchorEnd: string | { x: number; y: number } | undefined;
    longestLabel: labeltype;
    labels: labeltype;
    isFollowingCoords: GraphPoint | undefined;
    startFollow: Pointer<DVoidEdge> | undefined;
    endFollow: Pointer<DVoidEdge> | undefined;
    outer: boolean;
}

export type {
    EdgeFillSegment,
    EdgeSegment,
    GraphPoint,
    GraphSize,
    LEdgePoint,
    LGraph,
    LGraphElement,
    LViewElement,
    LVoidEdge,
    labeltype,
    segmentmaker,
};
