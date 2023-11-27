import type {DClass, DModel, GObject, LClass, LModel} from "../joiner";
import {LPointerTargetable, RuntimeAccessible, SetRootFieldAction} from "../joiner";
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

    // 16s 50 classi vuote
    static benchmarkCreateElement(times: number = 100, disableConsole: boolean = true): BenchmarkOptions{
        let state = windoww.s();

        let checkDelayMax = 300;
        let checkDelayMin = 50;
        let diff = checkDelayMax - checkDelayMin;
        let callbacks: any = {checkCompletionFunction, checkDelayMin, additionalDelayMax: diff, times, disableConsole};
        callbacks.startTime = new Date();
        if(disableConsole) windoww.Log.disableConsole();
        let lmodel = (LPointerTargetable.wrap(state.idlookup[ state.models[0] ]) as LModel);
        for (let i = 0; i < times; i++){
            lmodel.addChild("Class");
        }
        function checkCompletionFunction() { return $(".DClass").length; }

        Debug.timeMeasurer(callbacks);
        return callbacks;
    }
    // 4s 10 istanze con 5 attributi
    static benchmarkCreateInstance(metaclassName: string="Concept 1", times: number = 100, disableConsole: boolean = true): BenchmarkOptions{
        let checkDelayMax = 300;
        let checkDelayMin = 50;
        let diff = checkDelayMax - checkDelayMin;
        let callbacks: any = {checkCompletionFunction, checkDelayMin, additionalDelayMax: diff, times, disableConsole};
        callbacks.startTime = new Date();
        if(disableConsole) windoww.Log.disableConsole();

        let state = windoww.s();
        let lmodel = (LPointerTargetable.wrap(state.idlookup[ state.models[1] ]) as LModel);
        let lclass = LPointerTargetable.wrap(state.classs.map((cid: string)=>state.idlookup[cid]).filter((c:DClass) => c.name === metaclassName)[0]) as LClass;
        for (let i = 0; i < times; i++) {
            lmodel.addObject(lclass?.id);
        }
        function checkCompletionFunction() { return $("[data-modelname=\"DObject\"]").length; }

        Debug.timeMeasurer(callbacks);
        return callbacks;
    }


    static timeMeasurer(callbacks0:Partial<BenchmarkOptions> | undefined): BenchmarkOptions {
        let callbacks: BenchmarkOptions = callbacks0 as any;
        if (!callbacks) callbacks = {} as any;
        // if (!callbacks.startTime) callbacks.startTime = new Date();
        if (!callbacks.maxStuckTime) callbacks.maxStuckTime = 10000;
        if (!callbacks.checkDelayMin) callbacks.checkDelayMin = 300;
        if (!callbacks.additionalDelayMax) callbacks.additionalDelayMax = 2000;
        if (!callbacks.onStuck) callbacks.onStuck = (time:number, start: Date, end:Date, $complete: number) => {
            console.log("Benchmarked operation stuck at same completion% for: " + callbacks.maxStuckTime/1000+" s. \n" +
                "After " + time/100 + "s total time passed and " + $complete*100 + "% of the task was completed. \nBenchmark aborted."); }
        if (!callbacks.onFinish) callbacks.onFinish = (time:number, start: Date, end:Date) => {
            console.log("Benchmarked operation completed after: " + time/1000 + " s."); }

        windoww.Log.exDev(!callbacks.times, ".times is a mandatory option");
        windoww.Log.exDev(!callbacks.checkCompletionFunction, ".checkCompletionFunction is a mandatory option");
        windoww.Log.exDev(!callbacks.checkCompletionFunction, ".startTime is a mandatory option. set it **before** doing the main task, then call the benchmark.");
        (callbacks as any).completionHistory = [];

        if(callbacks.disableConsole) windoww.Log.disableConsole();
        Debug.timeMeasurer_inner(callbacks);
        return callbacks;
    }

    private static timeMeasurer_inner(callbacks:BenchmarkOptions): void {
        let completedTimes = callbacks.checkCompletionFunction();
        (callbacks as any).completionHistory.push(completedTimes);
        if (completedTimes === callbacks.times) {
            callbacks.endTime = new Date();
            callbacks.totTime = callbacks.endTime.getTime() - callbacks.startTime.getTime();
            if(callbacks.disableConsole) windoww.Log.enableConsole();
            callbacks.onFinish(callbacks.totTime, callbacks.startTime, callbacks.endTime);
            callbacks.endStatus = "FINISH";
            return;
        }
        let $complete = completedTimes / callbacks.times;
        if (callbacks.completedTimes !== completedTimes) {
            callbacks.stuckSince = new Date().getTime();
            callbacks.completedTimes = completedTimes;
        } else
        if (callbacks.stuckSince > callbacks.maxStuckTime) {
            callbacks.endTime = new Date();
            let $complete = completedTimes / callbacks.times;
            callbacks.totTime = callbacks.endTime.getTime() - callbacks.startTime.getTime();
            if(callbacks.disableConsole) windoww.Log.enableConsole();
            callbacks.onStuck(callbacks.totTime, callbacks.startTime, callbacks.endTime, $complete);
            callbacks.endStatus = "STUCK";
            return;
        }
        let delay = callbacks.checkDelayMin;
        if ($complete !== 0) delay += callbacks.additionalDelayMax * (1-$complete);
        setTimeout(()=>Debug.timeMeasurer_inner(callbacks), delay );

    }
}
type BenchmarkOptions = {
    onFinish:(time:number, start: Date, end:Date)=>void,
    onStuck:(time:number, start: Date, end:Date, $complete: number)=>void,
    disableConsole: boolean, endStatus: string,
    // completionFunction returns how many steps are completed.
    // times how many steps need to be completed to mark the test as finished.
    checkCompletionFunction: () => number, times: number, completedTimes: number,
    // those are automatically set
    startTime:Date, endTime:Date, stuckSince: number, totTime: number,
    // check how often completion or abortion is checked
    checkDelayMin: number, additionalDelayMax: number, maxStuckTime:number
};

setTimeout(Debug.timeoutTasks, 500);
setTimeout(Debug.largeTimeoutTasks, 5000);
windoww.Debug = Debug;
