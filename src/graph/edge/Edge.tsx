import React from "react";
import {DClass, DReference, LGraphElement} from "../../joiner";
import Xarrow from "react-xarrows";
import {xarrowPropsType} from "react-xarrows/lib/types";

interface OwnProps { source: LGraphElement; target: LGraphElement; }

export default function Edge(props: OwnProps) {

    const source: DClass|DReference|undefined = props.source.model as any;
    const target: DClass|DReference|undefined = props.target.model as any;
    const options: xarrowPropsType = {
        start: props.source.id, end: props.target.id,
        path: "grid", color: "black", strokeWidth: 2
    };
    if(source?.className == "DReference") {

    }
    if(source?.className == "DClass") {
        options.headSize = 15;
    }

    return(<Xarrow {...options}  />);
}
