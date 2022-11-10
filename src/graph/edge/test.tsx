import React, {useEffect, useState} from "react";
import LeaderLine from "leader-line-new";
import {LGraphElement, LReference, Pointer} from "../../joiner";
import Xarrow from "react-xarrows";

interface OwnProps { source: LGraphElement; target: LGraphElement }
export default function EdgeTest(props: OwnProps) {
    const [edge, setEdge] = useState<LeaderLine | undefined>();

    useEffect(() => {
        console.clear()
        console.log("debug: " + props.source.id + "-->" + props.target.id)

        const source = document.getElementById(props.source.id);
        const target = document.getElementById(props.target.id);
        if((source && target) && source !== target) {
            console.log("debug:", edge)
            const options: LeaderLine.Options = {start: source, end: target};
            options.startPlug = ((props.source.model as any as LReference).containment) ? "square" : "behind";
            options.size = 2; options.color = "black";
            options.path = "grid";
            options.startSocket = "right"; options.endSocket = "top";
            if(!edge) {
                setEdge(new LeaderLine(options));
            } else {
                if(edge.start !== source || edge.end !== target) {
                    edge.remove();
                    setEdge(new LeaderLine(options));
                } else {
                    edge.setOptions(options);
                    edge.position();
                }
            }
        }

    })

    return(<></>);
}
