///<reference path='../../joiner/index.ts' />

import type {LGraph} from "../../joiner";
//import type {RuntimeAccessible, RuntimeAccessibleClass, Point as PointType} from "../../joiner";
import type {Point as PointType} from "../../joiner";
import {RuntimeAccessible, RuntimeAccessibleClass} from "../../joiner";
import React from "react";

// @static
let windoww: any = window as any;
let Point: any = windoww.Point;

@RuntimeAccessible('GraphDragManager')
export class GraphDragManager extends RuntimeAccessibleClass{
    static initialClickPos?: PointType;
    static draggingGraph?: LGraph;

    static startPanning(e: React.MouseEvent, graph: LGraph) {
        // console.log("start panning", !GraphDragManager.draggingGraph, graph, graph.id);
        if (GraphDragManager.draggingGraph) return;
        GraphDragManager.draggingGraph = graph as LGraph;
        GraphDragManager.initialClickPos = Point.fromEvent(e);
    }
    static stopPanning(e: JQuery.MouseUpEvent | React.MouseEvent) {
        // damiano: why was disabled?
        // console.log("stop panning", GraphDragManager.draggingGraph);
        if (!GraphDragManager.draggingGraph) return;
        let g: LGraph = GraphDragManager.draggingGraph;
        let initial: PointType = GraphDragManager.initialClickPos as PointType;
        GraphDragManager.draggingGraph = undefined;
        GraphDragManager.initialClickPos = undefined;
        console.log(initial, Point.fromEvent(e), g.zoom, g.offset)
        g.offset = initial.subtract(Point.fromEvent(e), false).multiply(g.zoom).add(g.offset, false) as any; // actual type is Partial<Size>
    }
}
