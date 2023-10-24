import {GObject, RuntimeAccessible, SetRootFieldAction} from "../joiner";
let windoww = window as any;

@RuntimeAccessible
export class Debug {
    public static cname: string = "Debug";
    public static lightMode: boolean = false; // performance ligher mode for potato pc, huge models or complex simulations / measurables
    private static lightModeInput: HTMLInputElement;

    // manually activated: counts how many times each node is rendered in a component.
    static getComponentMap(){
        let nodes = Object.values(windoww.GraphElementComponent.all).map((a:any)=>a.props.node).filter(a=>!!a);
        let nodeids = [...new Set(nodes.map(a=>a.id).filter(a=>!!a))];
        let allids: GObject = {};
        for (let o of nodeids) allids[o] = 0;
        for (let n of nodes) allids[n?.id]++;
        allids.nodes = nodeids;
        allids.components = Object.values(windoww.GraphElementComponent.all);
        return allids; }

    static timeoutTasks(){}
    static largeTimeoutTasks(){
        windoww.model = windoww.LPointerTargetable.wrap(windoww.s().model?.[0]);
    }

    static remakeEdges(): void{
        // warning: might break undo/redo for direct state editing
        let eids = windoww.LPointerTargetable.wrapAll(windoww.LState.get().edges).map((e: any)=>e.id)
        let epids = windoww.LPointerTargetable.wrapAll(windoww.LState.get().edgepoints).map((e: any)=>e.id)
        let ss = windoww.store.getState();
        ss.edges = [];
        ss.edgepoints = [];
        for (let e of eids) delete ss.idlookup[e];
        for (let e of epids) delete ss.idlookup[e];
        windoww.SetRootFieldAction.new("clonedCounter" , ss.clonedCounter + 1, '', false);
    }

    static setLightMode(b: boolean): void {
        // i don't want to use react or actions here because they cause a re-render and are heavy. this is a performance emergency mode.
        if (this.lightMode === b) return;
        this.lightMode = b;
        if (!Debug.lightModeInput) {
            Debug.lightModeInput = ($("#lightmode") as any as HTMLInputElement[])[0];
            if (!Debug.lightModeInput) return;
        }
        Debug.lightModeInput.checked = b;
    }
    public static refresh(): void {
        for (let key in windoww.GraphElementComponent.all) {
            windoww.GraphElementComponent.all[key].forceUpdate();
        }
        console.log(windoww.GraphElementComponent.all);
    }
}

setTimeout(Debug.timeoutTasks, 500);
setTimeout(Debug.largeTimeoutTasks, 5000);
windoww.Debug = Debug;
