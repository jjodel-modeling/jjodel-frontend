// @ts-nocheck
import { RuntimeAccessible } from "../joiner";

@RuntimeAccessible
export class Debug {
    public static cname: string = "Debug";
    // counts how many times each node is rendered in a component.
    static getComponentMap(){
        let nodes = Object.values(window.GraphElementComponent.all).map(a=>a.props.node).filter(a=>!!a);
        let nodeids = [...new Set(nodes.map(a=>a.id).filter(a=>!!a))]
        let allids = {};
        for (let o of nodeids) allids[o] = 0;
        for (let n of nodes) allids[n?.id]++;
        allids.nodes = nodeids;
        allids.components = Object.values(window.GraphElementComponent.all);
        return allids; }
    static timeoutTasks(){}
    static largeTimeoutTasks(){
        window.model = window.LPointerTargetable.wrap(s().model?.[0]);
    }

}

setTimeout(Debug.timeoutTasks, 500);
setTimeout(Debug.largeTimeoutTasks, 5000);
window.Debug = Debug;
