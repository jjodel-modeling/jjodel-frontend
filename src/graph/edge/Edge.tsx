import React, {ReactNode} from "react";
import Xarrow from "react-xarrows";
import {ReactComponent as DefaultSvg} from "./assets/default.svg";
import {LRefEdge} from "../../model/dataStructure/GraphDataElements";
import {LReference} from "../../model/logicWrapper/LModelElement";
import {svgCustomEdgeType, svgEdgeShapeType} from "react-xarrows/lib/types";

export default class Edge {
    private static Arrow(start: string, end: string, head?: any, tail?: any): ReactNode {
        const headShape: svgEdgeShapeType | svgCustomEdgeType = (head) ? head : {svgElem: <DefaultSvg />, offsetForward: 1};
        const tailShape: svgEdgeShapeType | svgCustomEdgeType = (tail) ? tail : {svgElem: <DefaultSvg />, offsetForward: 1};
        return(<Xarrow showXarrow={true} zIndex={0} start={start} end={end} color={"black"}
                       showHead={head !== undefined} headShape={headShape} showTail={tail !== undefined} tailShape={tailShape}
                       startAnchor={["left", "right"]} endAnchor={"auto"} strokeWidth={2} path={"grid"} gridBreak={"20%50"} />);
    }
    public static ReferenceEdge(lRefEdge: LRefEdge, lReference: LReference): ReactNode {
        if(lReference.containment) { return Edge.ReferenceContainmentEdge(lRefEdge, lReference); }
        else { return Edge.ReferenceNotContainmentEdge(lRefEdge, lReference); }
    }
    private static ReferenceContainmentEdge(lRefEdge: LRefEdge, lReference: LReference): ReactNode {
        const head = {svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0.25 0.5 z"/>, offsetForward: 1};
        const tail = {svgElem: <rect style={{rotate: "45deg", fill: "white", strokeWidth: "0.1", stroke: "black"}} width=".6pt" height=".6pt" />, offsetForward: 1};
        return Edge.Arrow(lRefEdge.start, lRefEdge.end, head, tail);
    }
    private static ReferenceNotContainmentEdge(lRefEdge: LRefEdge, lReference: LReference): ReactNode {
        const head = {svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0.25 0.5 z"/>, offsetForward: 1};
        return Edge.Arrow(lRefEdge.start, lRefEdge.end, head, undefined);
    }
}
