// import {Mixin} from "ts-mixer";
import {isDeepStrictEqual} from "util";
import type {
    IsActually, getWParams,
    DMap, LMap, Dictionary,
    GObject,
    Pointer,
    DocString} from "../../joiner";

import {
    Action,
    bool,
    GraphPoint,
    GraphSize,
    LogicContext,
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
    DUser,
    MyProxyHandler,
    MixOnlyFuncs,
    windoww, DModelElement, LModelElement,
} from "../../joiner";


console.warn('ts loading graphDataElement');

let lgraph: LGraphElement = null /* this.node */ as any;



@RuntimeAccessible
export class DGraphElement extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    graph!: Pointer<DGraph, 1, 1, LGraph>; // todo: cerca graphID e rimpiazza / adatta
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;

    static init_constructor(thiss: DGraphElement, isUser: boolean = false, nodeID: string | undefined, graphID: string, a?: any): void {
        // console.log({dpt:DPointerTargetable.init_constructor, wdpt:(window as any).DPointerTargetable.init_constructor});
        windoww.DPointerTargetable.init_constructor(thiss, false, nodeID);
        thiss.graph = graphID;
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
export class LGraphElement extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    __raw!: DGraphElement;
    id!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    graph!: LGraph; //???
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;

    get_graph(context: LogicContext<DGraphElement>): LGraph {
        return TargetableProxyHandler.wrap(context.data.graph); }

    set_containedIn(val: Pointer<DGraphElement, 0, 1, LGraphElement>[], context: LogicContext<DGraphElement>): boolean {
        new SetFieldAction(context.data, 'containedIn', val);
        if (val) SetFieldAction.new(val as any, 'subElements+=', context.data.id, Action.SubType.vertexSubElements);
        return true;
    }

    set_subElements(val: Pointer<DGraphElement, 0, 'N', LGraphElement>, context: LogicContext<DGraphElement>): boolean {
        if (isDeepStrictEqual(context.data.subElements, val)) return true;
        SetFieldAction.new(context.data, 'subElements', val, Action.SubType.vertexSubElements);
        const idlookup = store.getState().idlookup;
        // new subelements
        for (let newsubelementid of val) {
            let subelement: DGraphElement = (newsubelementid && idlookup[newsubelementid]) as DGraphElement;
            if (subelement.containedIn === context.data.id) continue;
            LPointerTargetable.from(subelement).containedIn = context.data.id as any; // trigger side-action
        }
        // old subelements
        for (let oldsubelementid of context.data.subElements) {
            let subelement: DGraphElement = (oldsubelementid && idlookup[oldsubelementid]) as DGraphElement;
            if (subelement.containedIn !== context.data.id) continue;
            LPointerTargetable.from(subelement).containedIn = null as any; // todo: can this happen? è transitorio o causa vertici senza parent permanenti?
        }
        return true;
    }

}
DPointerTargetable.subclasses.push(DGraphElement);
LPointerTargetable.subclasses.push(LGraphElement);












@RuntimeAccessible
export class DGraph extends DGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraph;
    // static logic: typeof LGraph;
    // static structure: typeof DGraph;

    // inherit redefine
    id!: Pointer<DGraph, 1, 1, LGraph>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    // personal attributes
    zoom!: GraphPoint;
    graphSize!: GraphSize; // internal size of the graph. can be huge even if the sub-graph is in a small window (scroll)



    static getNodes(dmp: import("../logicWrapper/LModelElement").DModelElement[], out: {$matched: JQuery<HTMLElement>; $notMatched: JQuery<HTMLElement>; }): JQuery<HTMLElement> {

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
        thiss.graph = thiss.id;
        thiss.zoom = new GraphPoint(1, 1);
        thiss.graphSize = new GraphSize(0, 0, 0, 0);  // GraphSize.apply(this, [0, 0, 0 ,0]);
        thiss._subMaps = {zoom: true, graphSize: true}
        thiss.model = model;
        thiss.className = this.name;
    }

    static makeID(modelid:Pointer<DModel, 1, 1, LModel>): Pointer<DGraph, 1, 1, LGraph> {
        if (!modelid) return modelid as any;
        return modelid + '^graph';
    }
}
@RuntimeAccessible
export class LGraph extends LGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraph;
    // static logic: typeof LGraph;
    // static structure: typeof DGraph;

    // inherit redefine
    __raw!: DGraph;
    id!: Pointer<DGraph, 1, 1, LGraph>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    // personal attributes
    zoom!: GraphPoint;
    graphSize!: GraphSize;

    get_size(context: LogicContext<DGraph>): GraphSize { return context.data.graphSize; }
    get_graphSize(context: LogicContext<DGraph>): GraphSize { return context.data.graphSize; }
    get_zoom(context: LogicContext<DGraph>): GraphPoint {
        const zoom: GraphPoint = context.data.zoom;
        (zoom as any).debug = {rawgraph: context.data, zoomx: context.data.zoom.x, zoomy: context.data.zoom.y}
        return context.data.zoom; }
}
DGraphElement.subclasses.push(DGraph);
LGraphElement.subclasses.push(LGraph);

export const defaultVSize: GraphSize = new GraphSize(0, 0, 300, 160); // useless?

@RuntimeAccessible
export class DVoidVertex extends DGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVoidVertex;
    // static logic: typeof LVoidVertex;
    // static structure: typeof DVoidVertex;

    // inherit redefine
    id!: Pointer<DVoidVertex, 1, 1, LVoidVertex>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    zoom!: GraphPoint;
    // personal attributes
    x!: number;
    y!: number;
    w!: number;
    h!: number;
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
        // this.size = defaultVSize.duplicate();
        // GraphSize.prototype.clone.call(this, defaultVSize);
        /*this.x = defaultVSize.x;
        this.y = defaultVSize.y;
        this.w = defaultVSize.w;
        this.h = defaultVSize.h;*/
    }
}

@RuntimeAccessible
export class LVoidVertex extends LGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVoidVertex;
    // static logic: typeof LVoidVertex;
    // static structure: typeof DVoidVertex;

    // inherit redefine
    __raw!: DVoidVertex;
    id!: Pointer<DVoidVertex, 1, 1, LVoidVertex>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    zoom!: GraphPoint;

    // personal attributes
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize

    get_size(context: LogicContext<DVoidVertex>): GraphSize {
        return context.proxyObject as any; // new GraphSize(context.data.x, context.data.y, context.data.w, context.data.h);
    }

    // todo: devo settare che il primo parametro delle funzioni che iniziano con set_ non può essere un logicContext
    set_size(val: GraphSize, context: LogicContext<DVoidVertex>): boolean {
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

    get_isSelected(context: LogicContext<DVoidVertex>): GObject {
        return DPointerTargetable.mapWrap(context.data.isSelected, context.data, 'idlookup.' + context.data.id + '.isSelected', []);
    }
}
DGraphElement.subclasses.push(DVoidVertex);
LGraphElement.subclasses.push(LVoidVertex);

@RuntimeAccessible
export class DEdgePoint extends DGraphElement { // DVoidVertex
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LEdgePoint;
    // static logic: typeof LEdgePoint;
    // static structure: typeof DEdgePoint;

    // inherit redefine
    id!: Pointer<DEdgePoint, 1, 1, LEdgePoint>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDEdgePoint!: true;
}

@RuntimeAccessible
export class LEdgePoint extends LVoidVertex {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LEdgePoint;
    // static logic: typeof LEdgePoint;
    // static structure: typeof DEdgePoint;

    // inherit redefine
    __raw!: DEdgePoint;
    id!: Pointer<DEdgePoint, 1, 1, LEdgePoint>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isLEdgePoint!: true;
}
DVoidVertex.subclasses.push(DEdgePoint);
LVoidVertex.subclasses.push(LEdgePoint);







@RuntimeAccessible
export class DVoidEdge extends DGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVoidEdge;
    // static logic: typeof LVoidEdge;
    // static structure: typeof DVoidEdge;
    id!: Pointer<DVoidEdge, 1, 1, LVoidEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;

    // personal attributes
    __isDVoidEdge!: true;
}

@RuntimeAccessible
export class LVoidEdge extends LGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVoidEdge;
    // static logic: typeof LVoidEdge;
    // static structure: typeof DVoidEdge;
    __raw!: DVoidEdge;
    id!: Pointer<DVoidEdge, 1, 1, LVoidEdge>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    __isLVoidEdge!: true;

    // personal attributes
}
DGraphElement.subclasses.push(DVoidEdge);
LGraphElement.subclasses.push(LVoidEdge);






@RuntimeAccessible
export class DVertex extends DGraphElement { // DVoidVertex
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVertex;
    // static logic: typeof LVertex;
    // static structure: typeof DVertex;

    // inherit redefine
    id!: Pointer<DVertex, 1, 1, LVertex>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    // size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDVertex!: true;

    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string) {
        super(false, nodeID, graphID);
        DVoidVertex.init_constructor(this, isUser, nodeID, graphID);
    }

    static init_constructor(thiss: DVoidVertex, isUser: boolean = false, nodeID: string | undefined, graphID: string, model?: Pointer<DModel>): void {
        // this.superclass1.DGraphElement(isUser, nodeID, graphID);
        // this.superclass2.GraphSize(0, 0);
        DGraphElement.init_constructor(thiss, isUser, nodeID, graphID);
        GraphSize.init_constructor(thiss, defaultVSize.x, defaultVSize.y, defaultVSize.w, defaultVSize.h);
        console.log('dvertex constructor,', {thiss: thiss, GraphSize, gsproto: GraphSize.prototype});
        thiss.className = this.name;
        // this.size = defaultVSize.duplicate();
        // GraphSize.prototype.clone.call(this, defaultVSize);
        /*this.x = defaultVSize.x;
        this.y = defaultVSize.y;
        this.w = defaultVSize.w;
        this.h = defaultVSize.h;*/
    }
}

@RuntimeAccessible
export class LVertex extends LVoidVertex {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVertex;
    // static logic: typeof LVertex;
    // static structure: typeof DVertex;

    // inherit redefine
    __raw!: DVertex;
    id!: Pointer<DVertex, 1, 1, LVertex>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isLVertex!: true;

}

DGraphElement.subclasses.push(DVertex);
LGraphElement.subclasses.push(LVertex);



@RuntimeAccessible
export class DGraphVertex extends DGraphElement { // MixOnlyFuncs(DGraph, DVertex)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphVertex;
    // static logic: typeof LGraphVertex;
    // static structure: typeof DGraphVertex;

    // inherit redefine
    id!: Pointer<DGraphVertex, 1, 1, LGraphVertex>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    // from graph
    zoom!: GraphPoint;
    graphSize!: GraphSize; // internal size of the graph. can be huge even if the sub-graph is in a small window (scroll)

    // from VoidVertex
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    // size!: GraphSize; // virtual

    // personal attributes
    __isDVertex!: true;
    __isDGraph!: true;
    __isDGraphVertex!: true;

    constructor(isUser: boolean = false, nodeID: string | undefined, graphID: string, model: Pointer<DModel>) {
        super(isUser, nodeID, graphID, model);
        DGraphVertex.init_constructor(this, isUser, nodeID, graphID || this.id, model); // graphID è il parent di questo sottografo, se stesso se radice.
    }


    static init_constructor(thiss: DGraphVertex, isUser: boolean = false, nodeID: string | undefined, graphID: string | undefined, model: Pointer<DModel>): void {
        DGraph.init_constructor(thiss, isUser, nodeID, graphID, model);
//isUser: boolean = false, nodeID: string | undefined, graphID: string, model?: Pointer<DModel>
        DVertex.init_constructor(thiss, isUser, nodeID, graphID as string, model);
        thiss.className = this.name;
    }
}
@RuntimeAccessible
export class LGraphVertex extends MixOnlyFuncs(LGraph, LVertex) { // MixOnlyFuncs(LGraph, LVertex)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphVertex;
    // static logic: typeof LGraphVertex;
    // static structure: typeof DGraphVertex;

    // inherit redefine
    __raw!: DGraphVertex;
    id!: Pointer<DGraphVertex, 1, 1, LGraphVertex>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    // from graph
    zoom!: GraphPoint;
    graphSize!: GraphSize; // internal size of the graph. can be huge even if the sub-graph is in a small window (scroll)

    // from VoidVertex
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual


    // personal attributes
    __isLVertex!: true;
    __isLGraph!: true;
    __isLGraphVertex!: true;
}

DGraph.subclasses.push(DGraphVertex);
DVertex.subclasses.push(DGraphVertex);
LGraph.subclasses.push(LGraphVertex);
LVertex.subclasses.push(LGraphVertex);






@RuntimeAccessible
export class DEdge extends DGraphElement { // DVoidEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DEdge, 1, 1, LEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    __isDEdge!: true;
    __isDVoidEdge!: true;
}

@RuntimeAccessible
export class LEdge extends LVoidEdge {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    __raw!: DEdge;
    id!: Pointer<DEdge, 1, 1, LEdge>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    containedIn!: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    __isLEdge!: true;
    __isLVoidEdge!: true;
}
DVoidEdge.subclasses.push(DEdge);
LVoidEdge.subclasses.push(LEdge);




@RuntimeAccessible
export class DExtEdge extends DGraphElement{
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DExtEdge, 1, 1, LExtEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    containedIn: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    __isDExtEdge!: true;
    __isDEdge!: true;
    __isDVoidEdge!: true;
}
@RuntimeAccessible
export class LExtEdge extends LEdge{
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    __raw!: DExtEdge;
    id!: Pointer<DExtEdge, 1, 1, LExtEdge>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    containedIn!: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    __isLExtEdge!: true;
    __isLEdge!: true;
    __isLVoidEdge!: true;
}
DEdge.subclasses.push(DExtEdge);
LEdge.subclasses.push(LExtEdge);




@RuntimeAccessible
export class DRefEdge extends DEdge {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __isDRefEdge!: true;
}
@RuntimeAccessible
export class LRefEdge extends LEdge {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __raw!: DRefEdge;
    __isLRefEdge!: true;
}
DEdge.subclasses.push(DRefEdge);
LEdge.subclasses.push(LRefEdge);


// for edges without a modelling element


/*

let a = `DExtEdge, DRefEdge, DVoidEdge, LGraphVertex, LRefEdge, LEdgePoint, DVoidVertex, DGraphVertex, DEdgePoint, DVertex, DEdge, LVertex, LGraph, DGraph, LVoidVertex, LVoidEdge, LEdge, LGraphElement, LExtEdge, DGraphElement`; // // ... get from export in index.ts
a = a.replaceAll(',,', ",")
let aa = a.split(",").map(a => a.trim().substring(1));

function onlyUnique(value, index, self) { return self.indexOf(value) === index; }

aa = aa.filter(onlyUnique).filter( a=> !!a)
let r = aa.filter(onlyUnique).filter( a=> !!a).map( a=> `export type W${a} = getWParams<L${a}, D${a}>;`).join('\n')
document.body.innerText = r;
*/
export type WExtEdge = getWParams<LExtEdge, DExtEdge>;
export type WRefEdge = getWParams<LRefEdge, DRefEdge>;
export type WVoidEdge = getWParams<LVoidEdge, DVoidEdge>;
export type WGraphVertex = getWParams<LGraphVertex, DGraphVertex>;
export type WEdgePoint = getWParams<LEdgePoint, DEdgePoint>;
export type WVoidVertex = getWParams<LVoidVertex, DVoidVertex>;
export type WVertex = getWParams<LVertex, DVertex>;
export type WEdge = getWParams<LEdge, DEdge>;
export type WGraph = getWParams<LGraph, DGraph>;
export type WGraphElement = getWParams<LGraphElement, DGraphElement>;

console.warn('ts loading graphDataElement');
