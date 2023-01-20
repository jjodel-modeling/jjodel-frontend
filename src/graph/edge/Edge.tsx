import React from "react";
import {DClass, DReference, LGraphElement} from "../../joiner";
import Xarrow from "react-xarrows";
import {xarrowPropsType} from "react-xarrows/lib/types";

interface OwnProps { source: LGraphElement; target: LGraphElement; }

export default function Edge(props: OwnProps) {

    let source: DClass|DReference|undefined = props.source.model as any;
    let target: DClass|DReference|undefined = props.target.model as any;
    const options: xarrowPropsType = {
        start: props.source.id, end: props.target.id,
        path: "grid", color: "black", strokeWidth: 2
    };
    if(source?.className == "DReference") {
        source = source as DReference;
        if(source.containment) {
            options.showTail = true;
            options.tailShape = {svgElem: <rect style={{
                rotate: "45deg", fill: "white", strokeWidth: "0.1", stroke: "black",
            }} width=".525pt" height=".525pt" />, offsetForward: 1};
        }
    }
    if(source?.className == "DClass") {
        source = source as DClass;
        options.headShape = {svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0.25 0.5 z"/>, offsetForward: 0.5};
    }

    return(<Xarrow {...options}  />);
}
