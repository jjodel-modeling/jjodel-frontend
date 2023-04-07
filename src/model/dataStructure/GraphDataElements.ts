// import {Mixin} from "ts-mixer";
import {isDeepStrictEqual} from "util";
import {
    BEGIN,
    Constructors,
    Dictionary,
    DMap,
    DModelElement,
    DocString,
    DPointerTargetable,
    DUser, END,
    getWParams,
    GObject,
    GraphPoint,
    GraphSize,
    IStore,
    Leaf,
    LMap,
    LModelElement,
    LogicContext,
    LPointerTargetable,
    MixOnlyFuncs,
    Node, Pack1, PackArr, Point,
    Pointer,
    Pointers,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction, Size,
    store,
    TargetableProxyHandler,
    U
} from "../../joiner";


console.warn('ts loading graphDataElement');

let lgraph: LGraphElement = null /* this.node */ as any;


@Node
@RuntimeAccessible
export class DGraphElement extends DPointerTargetable {
    // static _super = DPointerTargetable;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    graph!: Pointer<DGraph, 1, 1, LGraph>; // todo: cerca graphID e rimpiazza / adatta
    model?: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    father!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    x: number = 0;
    y: number = 0;
    zIndex:number = 100;
    width: number = 300;
    height: number = 400;

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"]): DGraphElement {
        return new Constructors(new DGraphElement('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID).end();
    }

}
@RuntimeAccessible
export class LGraphElement <Context extends LogicContext<DGraphElement> = any, C extends Context = Context> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    __raw!: DGraphElement;
    id!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    father!: LGraphElement;
    graph!: LGraph; //???
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn?: LGraphElement;
    subElements!: LGraphElement[]; // shallow, direct subelements
    state!: LMap;
    allSubNodes!: LGraphElement[]; // deep, nested subelements
    x!: number;
    y!: number;
    width!: number;
    height!: number
    zIndex!: number;
    zoom!: GraphPoint;
    html!: Element;

    // fittizi
    w!:number;
    h!:number;
    size!: GraphSize;
    position!: GraphPoint;
    htmlSize!: Size; // size and position in global document coordinates.
    htmlPosition!: Point;

    get_graph(context: Context): LGraph {
        return TargetableProxyHandler.wrap(context.data.graph); }

    get_x(context: Context): this["x"] { return context.data.x; }
    set_x(val: this["x"], context: Context): boolean {
        SetFieldAction.new(context.data.id, "x", val, undefined, false);
        return true; }
    get_y(context: Context): this["y"] { return context.data.y; }
    set_y(val: this["y"], context: Context): boolean {
        SetFieldAction.new(context.data.id, "y", val, undefined, false);
        return true; }

    get_w(context: Context): this["w"] { return context.data.width; }
    set_w(val: this["w"], context: Context): boolean {
        SetFieldAction.new(context.data.id, "width", val, undefined, false);
        return true; }
    get_h(context: Context): this["h"] { return context.data.height; }
    set_h(val: this["h"], context: Context): boolean {
        SetFieldAction.new(context.data.id, "height", val, undefined, false);
        return true; }

    get_width(context: Context): this["w"] { return this.get_w(context); }
    set_width(val: this["w"], context: Context): boolean { return this.set_w(val, context); }
    get_height(context: Context): this["h"] { return this.get_h(context); }
    set_height(val: this["h"], context: Context): boolean { return this.set_h(val, context); }

    get_position(context: Context): this["position"] { return new GraphPoint(context.data.x, context.data.y); }
    set_position(val: this["position"], context: Context): boolean {
        BEGIN()
        SetFieldAction.new(context.data.id, "x", val.x, undefined, false);
        SetFieldAction.new(context.data.id, "y", val.y, undefined, false);
        END()
        return true; }

    get_size(context: Context): this["size"] { return new GraphSize(context.data.x, context.data.y, context.data.width, context.data.height); }
    set_size(val: this["size"], context: Context): boolean {
        BEGIN()
        SetFieldAction.new(context.data.id, "x", val.x, undefined, false);
        SetFieldAction.new(context.data.id, "y", val.y, undefined, false);
        SetFieldAction.new(context.data.id, "width", val.w, undefined, false);
        SetFieldAction.new(context.data.id, "height", val.h, undefined, false);
        END()
        return true; }

    get_html(context: Context): this["html"] { return $("[node-id='" + context.data.id + "']")[0]; }
    set_html(val: this["htmlSize"], context: Context): boolean { return this.cannotSet("set_html(). html is generated through jsx. edit the view instead."); }

    get_htmlSize(context: Context): this["htmlSize"] { let html = this.get_html(context); return Size.of(html); }
    set_htmlSize(val: this["htmlSize"], context: Context): boolean {
        // might be useful for fixed display size/location elements that stay in place even if you move tab or change zoom. debatable if needed
        this.cannotSet("set_htmlSize(): todo extra low priority. set GraphSize through set_size instead.");
        return true; }
    get_htmlPosition(context: Context): this["htmlPosition"] { return this.get_htmlSize(context).tl(); }
    set_htmlPosition(val: this["htmlPosition"], context: Context): boolean {
        // might be useful for fixed display size/location elements that stay in place even if you move tab or change zoom. debatable if needed
        this.cannotSet("set_htmlPosition(): todo extra low priority. set graph position through set_position instead.");
        return true; }

    get_zIndex(context: Context): this["zIndex"] { return context.data.zIndex; }
    set_zIndex(val: this["zIndex"], context: Context): boolean {
        SetFieldAction.new(context.data.id, "zIndex", val, undefined, false);
        return true; }
    get_z(context: Context): this["zIndex"] { return context.data.zIndex; }
    set_z(val: this["zIndex"], context: Context): boolean { return this.set_zIndex(val, context); }
/*
    get_containedIn(context: Context): this["containedIn"] {
        return context.data.containedIn ? LPointerTargetable.fromPointer(context.data.containedIn) : undefined; }
    set_containedIn(val: Pack1<this["containedIn"]>, context: LogicContext<DGraphElement>): boolean {
        let ptr: DGraphElement["containedIn"] = Pointers.from(val) as any;
        SetFieldAction.new(context.data, 'containedIn', ptr, undefined, true);
        if (ptr) SetFieldAction.new(ptr as any, 'subElements+=', context.data.id);
        return true; }*/

    get_subElements(context: Context): this["subElements"] { return LPointerTargetable.fromArr(context.data.subElements); }
    set_subElements(val: PackArr<this["subElements"]>, context: LogicContext<DGraphElement>): boolean {
        if (isDeepStrictEqual(context.data.subElements, val)) return true;
        let pointers: Pointer<DGraphElement, 0, 'N', LGraphElement> = Pointers.from(val) || [];
        SetFieldAction.new(context.data, 'subElements', pointers, '', true);
        const idlookup = store.getState().idlookup;
        // new subelements
        for (let newsubelementid of pointers) {
            let subelement: DGraphElement = (newsubelementid && idlookup[newsubelementid]) as DGraphElement;
            if (subelement.father === context.data.id) continue;
            LPointerTargetable.from(subelement).father = context.data.id as any; // trigger side-action
        }
        // old subelements
        for (let oldsubelementid of context.data.subElements) {
            let subelement: DGraphElement = (oldsubelementid && idlookup[oldsubelementid]) as DGraphElement;
            if (subelement.father !== context.data.id) continue;
            LPointerTargetable.from(subelement).father = null as any; // todo: can this happen? è transitorio o causa vertici senza parent permanenti?
        }
        return true;
    }

    get_model(context: Context): this["model"] {
        const modelElementId = $('[id="' + context.data.id + '"]')[0].dataset.dataid;
        const lModelElement: LModelElement = LPointerTargetable.from(modelElementId as string);
        return lModelElement;
    }

    private get_allSubNodes(context: Context, state?: IStore): this["allSubNodes"] {
        // return context.data.packages.map(p => LPointerTargetable.from(p));
        state = state || store.getState();
        let tocheck: Pointer<DGraphElement>[] = context.data.subElements || [];
        let checked: Dictionary<Pointer, true> = {};
        checked[context.data.id] = true;
        while (tocheck.length) {
            let newtocheck: Pointer<DGraphElement>[] = [];
            for (let ptr of tocheck) {
                if (checked[ptr]) throw new Error("loop in GraphElements containing themselves");
                checked[ptr] = true;
                let subnode: DGraphElement = DPointerTargetable.from(ptr, state);
                U.arrayMergeInPlace(newtocheck, subnode?.subElements);
            }
            tocheck = newtocheck;
        }
        return LPointerTargetable.from(Object.keys(checked), state);
    }


    get_father(context: Context): this["father"] { return LPointerTargetable.fromPointer(context.data.father); }
    set_father(val: Pack1<this["father"]>, context: Context): boolean {
        let ptr: DGraphElement["father"] = Pointers.from(val) as any;
        SetFieldAction.new(context.data, 'father', ptr, undefined, true);
        if (ptr) SetFieldAction.new(ptr as any, 'subElements+=', context.data.id);
        return true; }

    get_isSelected(context: LogicContext<DGraphElement>): this["isSelected"] { return context.data.isSelected; }
    set_isSelected(val: this["isSelected"], context: LogicContext<DGraphElement>): boolean {
        return this.cannotSet("graphElement.isSelected(): todo"); }

    get_state(context: LogicContext<DGraphElement>): this["state"] {
        let state: GObject = context.data.state;
        for (let key in state) {
            switch(key) {
                case "id": break;
                default: state[key] = LPointerTargetable.wrap(state[key]); break;
            }
        }
        return state as any;
    }
    set_state(val: this["state"], context: LogicContext<DGraphElement>): boolean {
        return this.cannotSet("graphElement.isSelected(): todo"); }

}
DPointerTargetable.subclasses.push(DGraphElement);
LPointerTargetable.subclasses.push(LGraphElement);












@RuntimeAccessible
export class DGraph extends DGraphElement {
    // static _super = DGraphElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraph;
    // static logic: typeof LGraph;
    // static structure: typeof DGraph;

    // inherit redefine
    father!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    id!: Pointer<DGraph, 1, 1, LGraph>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 1, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    // personal attributes
    zoom!: GraphPoint;
    graphSize!: GraphSize; // internal size of the graph. can be huge even if the sub-graph is in a small window (scroll)

    public static new(model: DGraph["model"], parentNodeID?: DGraphElement["father"], graphID?: DGraphElement["graph"], nodeID?: DGraphElement["id"] ): DGraph {
        return new Constructors(new DGraph('dwc')).DPointerTargetable()
            .DGraphElement(model, parentNodeID, graphID, nodeID).DGraph(model, nodeID).end();
    }


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
    // containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    // personal attributes
    zoom!: GraphPoint;
    graphSize!: GraphSize; // size internal to the graph, while "size" is instead external size of the vertex holding the graph in GraphVertexes

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
export const defaultEPSize: GraphSize = new GraphSize(0, 0, 15, 15); // useless?

@RuntimeAccessible
export class DVoidVertex extends DGraphElement {
    // static _super = DGraphElement;
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
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    zoom!: GraphPoint;
    // personal attributes
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    // size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"],
                      size: GraphSize = defaultVSize): DVoidVertex {
        return new Constructors(new DVoidVertex('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidVertex(size).end();
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
    // containedIn?: LGraphElement;
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
        // SetFieldAction.new(context.data, 'size', val, Action.SubType.vertexSize);
        if (!val) { val = defaultVSize; }
        console.trace('setsize:', {context, val});
        if (context.data.x !== val.x) SetFieldAction.new(context.data, 'x', val.x);
        if (context.data.y !== val.y) SetFieldAction.new(context.data, 'y', val.y);
        if (context.data.w !== val.w) SetFieldAction.new(context.data, 'w', val.w);
        if (context.data.h !== val.h) SetFieldAction.new(context.data, 'h', val.h);
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
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDEdgePoint!: true;

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"],
                      size: GraphSize = defaultEPSize): DEdgePoint {
        return new Constructors(new DEdgePoint('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidVertex(size).DEdgePoint().end();
    }

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
    // containedIn?: LGraphElement;
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
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;

    // personal attributes
    start!: Pointer<DModelElement, 1, 1, LModelElement>;
    end!: Pointer<DModelElement, 1, 1, LModelElement>;
    __isDVoidEdge!: true;

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"],): DVoidEdge {
        return new Constructors(new DVoidEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge().end();
    }
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
    // containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    start!: LModelElement;
    end!: LModelElement
    __isLVoidEdge!: true;

    // personal attributes
}
DGraphElement.subclasses.push(DVoidEdge);
LGraphElement.subclasses.push(LVoidEdge);






@RuntimeAccessible
export class DVertex extends DGraphElement { // DVoidVertex
    // static _super = DVoidVertex;
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
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    // size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDVertex!: true;

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size: GraphSize = defaultVSize): DVertex {
        return new Constructors(new DVertex('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidVertex(size).DVertex().end();
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
    // containedIn?: LGraphElement;
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


@Leaf
@RuntimeAccessible
export class DGraphVertex extends DGraphElement { // MixOnlyFuncs(DGraph, DVertex)
    // static _super1 = DGraph;
    // static _super2 = DVertex;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphVertex;
    // static logic: typeof LGraphVertex;
    // static structure: typeof DGraphVertex;

    // inherit redefine
    id!: Pointer<DGraphVertex, 1, 1, LGraphVertex>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 1, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
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

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size: GraphSize = defaultVSize): DGraphVertex {
        return new Constructors(new DGraphVertex('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidVertex(size).DVertex().DGraph(model, nodeID).end();
    }


/*
    static init_constructor(thiss: DGraphVertex, isUser: boolean = false, nodeID: string | undefined, graphID: string | undefined, model: Pointer<DModel>): void {
        DGraph.init_constructor(thiss, isUser, nodeID, graphID, model);
//isUser: boolean = false, nodeID: string | undefined, graphID: string, model?: Pointer<DModel>
        DVertex.init_constructor(thiss, isUser, nodeID, graphID as string, model);
        thiss.className = this.name;
    }*/
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
    // containedIn?: LGraphElement;
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
export class DEdge extends DVoidEdge { // DVoidEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DEdge, 1, 1, LEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    start!: Pointer<DModelElement, 1, 1, LModelElement>;
    end!: Pointer<DModelElement, 1, 1, LModelElement>;
    __isDEdge!: true;
    __isDVoidEdge!: true;

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size: GraphSize = defaultVSize): DEdge {
        return new Constructors(new DEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge().DEdge().end();
    }
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
    // containedIn!: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    start!: LModelElement;
    end!: LModelElement;
    __isLEdge!: true;
    __isLVoidEdge!: true;
}
DVoidEdge.subclasses.push(DEdge);
LVoidEdge.subclasses.push(LEdge);



@Leaf
@RuntimeAccessible
export class DExtEdge extends DEdge { // etends DEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DExtEdge, 1, 1, LExtEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
    start!: Pointer<DModelElement, 1, 1, LModelElement>;
    end!: Pointer<DModelElement, 1, 1, LModelElement>;
    __isDExtEdge!: true;
    __isDEdge!: true;
    __isDVoidEdge!: true;

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size: GraphSize = defaultVSize): DExtEdge {
        return new Constructors(new DExtEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge().DEdge().DExtEdge().end();
    }
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
    // containedIn!: LGraphElement;
    subElements!: LGraphElement[];
    state!: LMap;
    start!: LModelElement;
    end!: LModelElement;
    __isLExtEdge!: true;
    __isLEdge!: true;
    __isLVoidEdge!: true;
}
DEdge.subclasses.push(DExtEdge);
LEdge.subclasses.push(LExtEdge);



@Leaf
@RuntimeAccessible
export class DRefEdge extends DEdge { // extends DEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    start!: Pointer<DModelElement, 1, 1, LModelElement>;
    end!: Pointer<DModelElement, 1, 1, LModelElement>;
    __isDRefEdge!: true;

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"]): DRefEdge {
        return new Constructors(new DRefEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge().DEdge().DRefEdge().end();
    }

}
@RuntimeAccessible
export class LRefEdge extends LEdge {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __raw!: DRefEdge;
    start!: LModelElement;
    end!: LModelElement;
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
