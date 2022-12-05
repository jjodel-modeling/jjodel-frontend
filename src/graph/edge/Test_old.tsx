import React, {useEffect, useState} from "react";
import LeaderLine from "leader-line-new";
import {Dictionary, LGraphElement, LModelElement, LReference, Pointer, U} from "../../joiner";
import Xarrow from "react-xarrows";

interface OwnProps { source: LGraphElement; target: LGraphElement; }
const bySource: Dictionary<string, LeaderLine[]> = {};
const byTarget: Dictionary<string, LeaderLine[]> = {};

(window as any).leaderline = {bySource, byTarget};

function addleaderline(props: OwnProps, options: LeaderLine.Options): LeaderLine{
    const line = new LeaderLine(options);
    let startid: string = line.start === "string" ? line.start as any : (line.start as any as HTMLElement)?.id;
    let endid: string = line.end === "string" ? line.end as any : (line.end as any as HTMLElement)?.id;
    if (startid) {
        if (!bySource[startid]) bySource[startid] = [line];
        else bySource[startid].push(line);
    }
    if (endid) {
        if (!byTarget[endid]) byTarget[endid] = [line];
        else byTarget[endid].push(line);
    }
    return line;
}

function removeleaderline(line: LeaderLine){
    let startid: string = line.start === "string" ? line.start as any : (line.start as any as HTMLElement)?.id;
    let endid: string = line.end === "string" ? line.end as any : (line.end as any as HTMLElement)?.id;
    if (startid) {
        if (!bySource[startid]) return;
        U.arrayRemoveAll( bySource[startid], line);
    }
    if (endid) {
        if (!byTarget[endid]) return;
        U.arrayRemoveAll( byTarget[endid], line);
    }
}

function EdgeTest(props: OwnProps) {
    const [edge, setEdge] = useState<LeaderLine | undefined>();

    useEffect(() => {
        const source = document.getElementById(props.source.id);
        const target = document.getElementById(props.target.id);
        if((source && target) && source !== target) {
            console.log("debug:", edge)
            const options: LeaderLine.Options = {start: source, end: target};
            const me: LModelElement | undefined = props.source.model;
            if(me) {
                if(me.className == "DReference") {
                    options.startPlug = ((me as any as LReference).containment) ? "square" : "behind";
                    options.startSocket = "right"; options.endSocket = "top";
                }
                if(me.className == "DClass") {
                    options.startSocket = "top"; options.endSocket = "bottom";
                    options.endPlugSize = 3; options.endPlug = "arrow3";
                }
            }
            options.size = 2; options.color = "black";
            options.path = "grid";
            if(!edge) {
                setEdge(addleaderline(props, options));
            } else {
                if (edge.start !== source || edge.end !== target
                    // @ts-ignore
                    || !edge.start || !edge.end || !edge.start.parentElement || !edge.end.parentElement) {
                    removeleaderline(edge);
                    edge.remove();
                    setEdge(addleaderline(props, options));
                } else {
                    edge.setOptions(options);
                    edge.position();
                }
            }
        }

    })

    return(<></>);
}
let et = EdgeTest;
export default et;
