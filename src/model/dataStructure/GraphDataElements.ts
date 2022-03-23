// import {Mixin} from "ts-mixer";
import {isDeepStrictEqual} from "util";

import {
    Action,
    bool,
    GraphPoint,
    GraphSize,
    LogicContext,
    Pointer,
    DPointerTargetable,
    SetFieldAction,
    TargetableProxyHandler,
    LPointerTargetable,
    U,
    store,
    LModel,
    DModel,
    RuntimeAccessibleClass,
    RuntimeAccessible,
    Dictionary,
    DocString,
    DUser,
    GObject,
    MyProxyHandler,
    MixOnlyFuncs,
    windoww,
} from "../../joiner";

console.warn('ts loading graphDataElement');
@RuntimeAccessible
export class DGraphElement extends DPointerTargetable {
    static logic: typeof LPointerTargetable;
    graphID!: Pointer<DGraph, 1, 1, LGraph>;
    graph!: LGraph;
    // size: GraphSize;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};


    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;

    static init_constructor(thiss: DGraphElement, isUser: boolean = false, nodeID: string | undefined, graphID: string, a?: any): void {
        // console.log({dpt:DPointerTargetable.init_constructor, wdpt:(window as any).DPointerTargetable.init_constructor});
        windoww.DPointerTargetable.init_constructor(thiss, false, nodeID);
        thiss.graphID = graphID;
        thiss.subElements = [];
        thiss.className = this.name;
    }

    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string, a?: any) {
        super(false, nodeID);
        DGraphElement.init_constructor(this, isUser, nodeID, graphID, a);
        // this.size = new GraphSize(0, 0, 0, 0);
    }


}

@RuntimeAccessible
export class DGraph extends DGraphElement {
    static getNodes(dmp: import("./modelElement").DModelElement[], out: {$matched: JQuery<HTMLElement>; $notMatched: JQuery<HTMLElement>; }): JQuery<HTMLElement> {

        let $allnodes = $('[data-dataid]');
        let matchedids: Pointer[] = (dmp || []).map(d => d.id);
        let matchedidmap:Dictionary<string, boolean> = U.objectFromArrayValues(matchedids);
        if (!out) out = {} as any;

        let allnodesarr = [...$allnodes];
        let filternode = (d: HTMLElement) => {
            if (!d?.dataset?.dataid) return false;
            let id: string = ''+d?.dataset?.dataid;
            return matchedidmap[id]; };
        out.$matched = $(allnodesarr.filter(filternode));
        out.$notMatched = $(allnodesarr.filter((n) => !filternode(n)));
        console.error("getnodes", {dmp, out, matchedidmap, matchedids, allnodesarr});
        return out.$matched;
        // throw new Error("Method not implemented.");
    }
    static logic: typeof LGraphElement;
    zoom!: GraphPoint;
    model!: Pointer<DModel, 1, 1, LModel>;
    graphSize!: GraphSize;

    static create(model: Pointer<DModel>): DGraph {
        let ret = new DGraph(false, undefined, undefined, model);
        ret.id = DGraph.makeID(model);
        return ret;
    }

    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string | undefined, model: Pointer<DModel>) {
        super(false, nodeID, undefined as any);
        DGraph.init_constructor(this, isUser, nodeID, graphID, model);
    }

    static init_constructor(thiss: DGraph, isUser: boolean = false, nodeID: string | undefined, graphID: string | undefined, model: Pointer<DModel>): void {
        windoww.DGraphElement.init_constructor(thiss, false, nodeID, undefined as any, model);
        if (!thiss.id) thiss.id = DGraph.makeID(model);
        thiss.graphID = thiss.id;
        thiss.zoom = new GraphPoint(1, 1);
        thiss.graphSize = new GraphSize(0, 0, 0, 0); // GraphSize.apply(this, [0, 0, 0 ,0]);
        thiss._subMaps = {zoom: true, graphSize: true}
        thiss.model = model;
        thiss.className = this.name;
    }

    static makeID(modelid:Pointer<DModel, 1, 1>): Pointer<DGraph, 1, 1, LGraph> {
        if (!modelid) return modelid;
        return modelid + '^graph';
    }
}

export const defaultVSize: GraphSize = new GraphSize(0, 0, 300, 160); // useless?

@RuntimeAccessible
export class DVoidVertex extends MixOnlyFuncs(DGraphElement, GraphPoint) {
// export class DVoidVertex extends MixOnlyFuncs(DGraphElement, GraphPoint) {
    static logic: typeof LGraphElement;
    dvvattrib!: string;
    // size: GraphSize;
    // selected: boolean = false;
    // size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize

    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string) {
        super(false, nodeID, graphID);
        DVoidVertex.init_constructor(this, isUser, nodeID, graphID);
    }

    static init_constructor(thiss: DVoidVertex, isUser: boolean = false, nodeID: string | undefined, graphID: string, model?: Pointer<DModel>): void {
        // this.superclass1.DGraphElement(isUser, nodeID, graphID);
        // this.superclass2.GraphSize(0, 0);
        DGraphElement.init_constructor(thiss, isUser, nodeID, graphID);
        GraphSize.init_constructor(thiss, defaultVSize.x, defaultVSize.y, defaultVSize.w, defaultVSize.h);
        console.log('dvoidvertex constructor,', {thiss: thiss, GraphSize, gsproto: GraphSize.prototype});
        thiss.className = this.name;
        let uselessJustForNavigation: LVoidVertex;
        // this.size = defaultVSize.duplicate();
        // GraphSize.prototype.clone.call(this, defaultVSize);
        /*this.x = defaultVSize.x;
        this.y = defaultVSize.y;
        this.w = defaultVSize.w;
        this.h = defaultVSize.h;*/
    }

}

@RuntimeAccessible
export class DEdgePoint extends DVoidVertex {
    static logic: typeof LVoidVertex;// typeof LEdgePoint;
}

@RuntimeAccessible
export class DVoidEdge extends DGraphElement {
    static logic: typeof LGraphElement; //typeof LVoidEdge;
}

@RuntimeAccessible
export class DVertex extends DVoidVertex {
    static logic: typeof LVoidVertex; // typeof LVertex;
}

@RuntimeAccessible
export class DGraphVertex extends MixOnlyFuncs(DGraph, DVertex) {
    static logic: typeof LGraphVertex; // typeof LGraphVertex;
    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string | undefined, model: Pointer<DModel>) {
        super(isUser, nodeID, graphID, model);
        DGraphVertex.init_constructor(this, isUser, nodeID, graphID, model);
    }


    static init_constructor(thiss: DGraphVertex, isUser: boolean = false, nodeID: string | undefined, graphID: string | undefined, model: Pointer<DModel>): void {
        DGraph.init_constructor(thiss, isUser, nodeID, graphID, model);
//isUser: boolean = false, nodeID: string | undefined, graphID: string, model?: Pointer<DModel>
        DVertex.init_constructor(thiss, isUser, nodeID, graphID as string, model);
        thiss.className = this.name;
    }
}

@RuntimeAccessible
export class DEdge extends DVoidEdge{
    static logic: typeof LVoidEdge; //typeof LEdge;
}

@RuntimeAccessible
export class DExtEdge extends DEdge {
    static logic: typeof LEdge; // typeof LExtEdge;
}

@RuntimeAccessible
export class DRefEdge extends DEdge {
    static logic: typeof LEdge; // typeof LRefEdge;
}

// for edges without a modelling element

@RuntimeAccessible
export class LGraphElement extends MixOnlyFuncs(LPointerTargetable, DGraphElement) {
    static structure: typeof DGraphElement;
    static singleton: LGraphElement;
    /* NOT REQUIRED ON LPointerTargetable subclasses
    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string, a?: any) {
        super();
        LGraphElement.init_constructor()
    }
    static init_constructor(thiss: DGraphElement, isUser: boolean = false, nodeID: string | undefined, graphID: string, a?: any): void {
        super.init_constructor(isUser, id, a, b, c);
    }*/

    get_graph(context: LogicContext<this>): LGraph {
        return TargetableProxyHandler.wrap(context.data.graphID); }

    set_containedIn(val: Pointer<DGraphElement, 0, 'N', LGraphElement>[], context: LogicContext<this>): boolean {
        new SetFieldAction(context.data, 'containedIn', val);
        return true;
    }

    set_subElements(val: Pointer<DGraphElement, 0, 'N', LGraphElement>, context: LogicContext<this>): boolean {
        if (isDeepStrictEqual(context.data.subElements, val)) return true;
        new SetFieldAction(context.data, 'subElements', val, Action.SubType.vertexSubElements);
        const idlookup = store.getState().idlookup;
        // new subelements
        for (let newsubelementid of val) {
            let subelement: DGraphElement = (newsubelementid && idlookup[newsubelementid]) as DGraphElement;
            if (subelement.containedIn === context.data.id) continue;
            MyProxyHandler.wrap<DGraphElement, LGraphElement>(subelement).containedIn = context.data.id; // trigger side-action
        }
        // old subelements
        for (let oldsubelementid of context.data.subElements) {
            let subelement: DGraphElement = (oldsubelementid && idlookup[oldsubelementid]) as DGraphElement;
            if (subelement.containedIn !== context.data.id) continue;
            MyProxyHandler.wrap<DGraphElement, LGraphElement>(subelement).containedIn = null; // todo: can this happen? è transitorio o causa vertici senza parent permanenti?
        }
        return true;
    }
}

@RuntimeAccessible
export class LGraph extends MixOnlyFuncs(LGraphElement, DGraph) {
    zoom!: GraphPoint;
    // @ts-ignore
    model?: LModel;
    get_size(context: LogicContext<this>): GraphSize { return context.data.graphSize; }
    get_graphSize(context: LogicContext<this>): GraphSize { return context.data.graphSize; }
    get_zoom(context: LogicContext<this>): GraphPoint {
        const zoom: GraphPoint = context.data.zoom;
        (zoom as any).debug = {rawgraph: context.data, zoomx: context.data.zoom.x, zoomy: context.data.zoom.y}
        return context.data.zoom; }
}

@RuntimeAccessible
export class LVoidVertex extends MixOnlyFuncs(LGraphElement, DVoidVertex) {
    static structure: typeof DVoidVertex;
    static singleton: LVoidVertex;
    size: GraphSize = undefined as any; // fittizio, la size è memorizzata nell'oggetto stesso (estende ISize)

    get_size(context: LogicContext<this>): GraphSize {
        return context.proxyObject as any; // new GraphSize(context.data.x, context.data.y, context.data.w, context.data.h);
    }

    // todo: devo settare che il primo parametro delle funzioni che iniziano con set_ non può essere un logicContext
    set_size(val: GraphSize, context: LogicContext<this>): boolean {
        // new SetFieldAction(context.data, 'size', val, Action.SubType.vertexSize);
        if (!val) { val = defaultVSize; }
        console.trace('setsize:', {context, val});
        if (context.data.x !== val.x) new SetFieldAction(context.data, 'x', val.x);
        if (context.data.y !== val.y) new SetFieldAction(context.data, 'y', val.y);
        if (context.data.w !== val.w) new SetFieldAction(context.data, 'w', val.w);
        if (context.data.h !== val.h) new SetFieldAction(context.data, 'h', val.h);
        // (context.proxy as unknown as LGraphElement).graph.graphSize
        // update graph boundary too
        console.log('setsize2, graph:', {context, val});
        const graph: LGraph = this.get_graph(context); // (context.proxyObject as this).get_graph(context);
        const gsize = graph.graphSize;
        val.boundary(gsize);
        if (val.equals(gsize)) return true;
        graph.graphSize = val;
        return true;
    }

    get_isSelected(context: LogicContext<this>): GObject {
        return DPointerTargetable.mapWrap(context.data.isSelected, context.data, 'idlookup.' + context.data.id + '.isSelected', []);
    }
}

@RuntimeAccessible
export class LVoidEdge extends MixOnlyFuncs(LGraphElement, DVoidEdge) {
    static structure: typeof DVoidEdge;
    static singleton: LVoidEdge;
}

@RuntimeAccessible
export class LVertex extends MixOnlyFuncs(LVoidVertex, DVertex) {
    static structure: typeof DVertex;
    static singleton: LVertex;
}

@RuntimeAccessible
export class LGraphVertex extends MixOnlyFuncs(LVertex, LGraph) {
    static structure: typeof LGraphVertex;
    static singleton: LGraphVertex;
}

@RuntimeAccessible
export class LEdge extends MixOnlyFuncs(LVoidEdge, DEdge) {
    static structure: typeof DEdge;
    static singleton: LEdge;
}

@RuntimeAccessible
export class LExtEdge extends MixOnlyFuncs(LEdge, DExtEdge) {
    static structure: typeof DExtEdge;
    static singleton: LExtEdge;
}

@RuntimeAccessible
export class LRefEdge extends MixOnlyFuncs(LEdge, DRefEdge) {
    static structure: typeof DRefEdge;
    static singleton: LRefEdge;
}

@RuntimeAccessible
export class LEdgePoint extends MixOnlyFuncs(LVoidEdge, DEdgePoint) {
    static structure: typeof DEdgePoint;
    static singleton: LEdgePoint;
}
console.warn('ts loading graphDataElement');
