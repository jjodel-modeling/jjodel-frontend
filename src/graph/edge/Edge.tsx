import React from "react";
import {DClass, DReference, LGraphElement, LReference, LClass} from "../../joiner";
import Xarrow from "react-xarrows";
import {xarrowPropsType} from "react-xarrows/lib/types";
import {useStateIfMounted} from "use-state-if-mounted";

interface OwnProps { source: LGraphElement; target: LGraphElement; }

export default function Edge(props: OwnProps) {

    let source: LClass|LReference|undefined = props.source.model as any;
    let target: LClass|LReference|undefined = props.target.model as any;
    let show = true;
    const options: xarrowPropsType = {
        start: props.source.id, end: props.target.id,
        path: "grid", color: "black", strokeWidth: 2
    };
    if(source?.className == "DReference") {
        source = source as LReference;
        if(source.containment) {
            options.showTail = true;
            options.tailShape = {svgElem: <rect style={{
                rotate: "45deg", fill: "white", strokeWidth: "0.1", stroke: "black",
            }} width=".525pt" height=".525pt" />, offsetForward: 1};
        }
        if(source.type.id === source.father.id) {
            show = false;
        }
    }
    if(source?.className == "DClass") {
        source = source as LClass;
        options.headShape = {svgElem: <path d="M 0 0 L 1 0.5 L 0 1 L 0.25 0.5 z"/>, offsetForward: 0.5};
    }

    if(show) {
        return(<Xarrow {...options}  />);
    } else { return(<></>); }
}
