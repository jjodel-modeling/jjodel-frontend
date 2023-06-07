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
    GObject, GraphElementComponent,
    GraphPoint,
    GraphSize,
    IStore,
    Leaf,
    LMap,
    LModelElement, Log,
    LogicContext,
    LPointerTargetable, LViewElement,
    MixOnlyFuncs,
    Node, Pack1, PackArr, Point,
    Pointer,
    Pointers,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction, Size,
    store,
    TargetableProxyHandler,
    U, windoww
} from "../../joiner";
import {MixOnlyFuncs2, MixOnlyFuncs3} from "../../joiner/classes";


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
    w: number=300;
    h: number=500;
    // width: number = 300;
    // height: number = 400;

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
    html?: Element;

    // fittizi
    w!:number;
    h!:number;
    size!: GraphSize;
    position!: GraphPoint;
    htmlSize!: Size; // size and position in global document coordinates.
    htmlPosition!: Point;
    view!: LViewElement;
    component!: GraphElementComponent;

    get_graph(context: Context): LGraph {
        return TargetableProxyHandler.wrap(context.data.graph); }

    // set_x(val: this["x"], context: Context): boolean { SetFieldAction.new(context.data.id, "x", val, undefined, false); return true; }
    // get_x(context: Context): this["x"] { return context.data.x; }
    get_x(context: Context): this["x"] { return this.get_size(context).x; }
    set_x(val: this["x"], context: Context): boolean { return this.set_size({x:val}, context); }
    get_y(context: Context): this["y"] { return this.get_size(context).y; }
    set_y(val: this["y"], context: Context): boolean { return this.set_size({y:val}, context); }

    get_w(context: Context): this["w"] { return this.get_size(context).w; }
    set_w(val: this["w"], context: Context): boolean { return this.set_size({w:val}, context); }
    get_h(context: Context): this["h"] { return this.get_size(context).h; }
    set_h(val: this["h"], context: Context): boolean { return this.set_size({h:val}, context); }

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

    get_sizeold(context: Context): this["size"] { return new GraphSize(context.data.x, context.data.y, context.data.w, context.data.h); }
    get_component(context: Context): this["component"] {
        // switch(context.data.className) { case DEdgePoint.name: return GraphElementComponent.map[context.data.father]; }
        return GraphElementComponent.map[context.data.id]; }
    get_view(context: Context): this["view"] { return this.get_component(context).props.view; }
    get_size(context: Context, canTriggerSet: boolean = true): Readonly<GraphSize> {
        switch(context.data.className){
            default: return Log.exDevv("unexpected classname in get_size switch: " + context.data.className);
            case DGraph.name: return nosize as any;
            // case DField.name:
            case DGraphElement.name:
                let graph = this.get_graph(context);
                return graph.coord(this.get_htmlSize(context));
            case DVoidVertex.name:
            case DVertex.name:
            case DEdgePoint.name:
            case DGraphVertex.name: break;
        }
        // low prio todo: memoization in proxy, as long state does not change keep a collection Dictionary[object][key] = returnval. it gets emptied when state is updated.
        /*console.log("get_size("+(this.props?.data as any).name+")", {
            view:this.props.view.getSize(this.props.dataid || this.props.nodeid as string),
            node:this.props.node?.size,
            default: this.props.view.defaultVSize});*/
        let component = this.get_component(context);
        windoww.debugg = context;
        console.log("edgee getsize", {component, view:component?.props?.view});
        let view = component.props.view;
        (window as any).retry = ()=>view.getSize(context.data.id);
        let ret = view.getSize(context.data.id); // (this.props.dataid || this.props.nodeid as string)
        // console.log("getSize() from view", {ret: ret ? {...ret} : ret});
        if (!ret) {
            ret = {x:context.data.x, y:context.data.y, w:context.data.w, h:context.data.h} as any as GraphSize;
            let def: GraphSize | undefined;
            if (undefined===(ret.x)) { if (!def) def = view.defaultVSize; ret.x = def.x;}
            if (undefined===(ret.y)) { if (!def) def = view.defaultVSize; ret.y = def.y;}
            if (undefined===(ret.w)) { if (!def) def = view.defaultVSize; ret.w = def.w;}
            if (undefined===(ret.h)) { if (!def) def = view.defaultVSize; ret.h = def.h;}
            // console.log("getSize() from node merged with defaultVSize", {ret: ret ? {...ret} : ret});
        }

        if ((context.data as DVoidVertex).isResized) return ret;
        let html = component.html;
        let actualSize: Partial<Size> & {w:number, h:number} = html.current ? Size.of(html.current) : {w:0, h:0};
        let updateSize: boolean = false;
        if (view.adaptWidth && ret.w !== actualSize.w) {
            ret.w = actualSize.w;
            if (canTriggerSet) updateSize = true;
            // if (canTriggerSet) this.set_size({w:actualSize.w}, context);
        }
        if (view.adaptHeight && ret.h !== actualSize.h) {
            ret.h = actualSize.h;
            if (canTriggerSet && !updateSize) updateSize = true;
        }
        // console.log("getSize() from node merged with actualSize", {ret: {...ret}});

        if (updateSize) this.set_size(ret, context);
        return ret;
    }
    // set_size(size: Partial<this["size"]>, context: Context): boolean {
    set_size(size: {x?:number, y?:number, w?:number, h?:number}, context: Context): boolean {
        // console.log("setSize("+(this.props?.data as any).name+") thisss", this);
        if (!size) return false;
        let view = this.get_view(context)
        if (view.updateSize(context.data.id, size)) return true;
        BEGIN()
        if (size.x !== undefined) SetFieldAction.new(context.data.id, "x", size.x, undefined, false);
        if (size.y !== undefined) SetFieldAction.new(context.data.id, "y", size.y, undefined, false);
        if (size.w !== undefined) SetFieldAction.new(context.data.id, "w", size.w, undefined, false);
        if (size.h !== undefined) SetFieldAction.new(context.data.id, "h", size.h, undefined, false);
        END()
        return true; }

    get_html(context: Context): this["html"] { return this.get_component(context).html.current || undefined; }
    // get_html(context: Context): this["html"] { return $("[node-id='" + context.data.id + "']")[0]; }
    set_html(val: this["htmlSize"], context: Context): boolean { return this.cannotSet("set_html(). html is generated through jsx. edit the view instead."); }

    get_htmlSize(context: Context): this["htmlSize"] {
        let html = this.get_html(context);
        return html ? Size.of(html) : new Size(0, 0, 0, 0);
        /*
        let graph = this.get_graph(context);
        if (!html) return nosize as any;
        let size = Size.of(html);
        let zoom = graph.zoom;
        size.x /= zoom.x;
        size.y /= zoom.y;
        return size;*/}
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

    get_isResized(context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] { return context.data.isResized; }
    set_isResized(val: DVoidVertex["isResized"], context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] {
        return SetFieldAction.new(context.data.id, "isResized", val);
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
    sizes!: Dictionary<Pointer<DModelElement>, GraphSize>;

    public static new(model: DGraph["model"],
                      parentNodeID?: DGraphElement["father"], // immediate parent
                      parentgraphID?: DGraphElement["graph"], // graph containing this subgraph (redudant? could get it from father chain)
                      nodeID?: DGraphElement["id"] // this id
    ): DGraph {
        return new Constructors(new DGraph('dwc'), parentNodeID, true, DGraphElement).DPointerTargetable()
            .DGraphElement(model, parentNodeID, parentgraphID, nodeID).DGraph(model, nodeID).end();
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
var nosize = {x:0, y:0, w:0, h:0, nosize:true};
@RuntimeAccessible
export class LGraph<Context extends LogicContext<DGraph> = any, D extends DGraph = any> extends LGraphElement {
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
    // protected sizes!: Dictionary<Pointer<DModelElement>, GraphSize>;


    // get_sizes(context: Context): D["sizes"] { return context.data.sizes; }
    //set_sizes(val: D["sizes"], context: Context): boolean { return SetFieldAction.new(context.data.id, "sizes", val); } // todo: se cancello ModelElement, la chiave qui resta? i pointedby non vengono segnati credo.

    get_graphSize(context: LogicContext<DGraph>):  Readonly<GraphSize> { return context.data.graphSize; }
    get_zoom(context: Context): GraphPoint {
        const zoom: GraphPoint = context.data.zoom;
        (zoom as any).debug = {rawgraph: context.data, zoomx: context.data.zoom.x, zoomy: context.data.zoom.y}
        return context.data.zoom; }

    toGraphSize(...a:Parameters<this["coord"]>): ReturnType<this["coord"]>{ return this.wrongAccessMessage("toGraphSize"); }
    coord(htmlSize: Size): GraphSize { return this.wrongAccessMessage("toGraphSize"); }
    get_coord(context: Context): (htmlSize: Size) => GraphSize {
        return (htmlSize: Size)=> {
            let size: Size = this.get_htmlSize(context);
            let zoom: GraphPoint = this.get_zoom(context);
            return new GraphSize((htmlSize.x - size.x) / zoom.x, (htmlSize.y - size.y) / zoom.y);
        }
    }
    // get_htmlSize(context: Context): Size { }
}
DGraphElement.subclasses.push(DGraph);
LGraphElement.subclasses.push(LGraph);

// export const defaultVSize: GraphSize = new GraphSize(0, 0, 300, 160); // useless, now it's in view.DefaultVSize
// export const defaultEPSize: GraphSize = new GraphSize(0, 0, 15, 15); // useless, now it's in view.DefaultVSize

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
    isResized!: boolean;
    // size?: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"],
                      size?: GraphSize): DVoidVertex {
        return new Constructors(new DVoidVertex('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidVertex(size).end();
    }

}

@RuntimeAccessible
export class LVoidVertex extends LGraphElement {// <D extends DVoidVertex = any>
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
    isResized!: boolean;

    // personal attributes
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    __info_of__size = {type: "?GraphSize", txt: "Size of the vertex, if null it means is utilizing the defaultSize from view. recommended to read component.getSize() instead of this."};

    get_isResized(context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] { return context.data.isResized; }
    set_isResized(val: DVoidVertex["isResized"], context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] {
        return SetFieldAction.new(context.data.id, "isResized", val);
    }
/*
    // todo: devo settare che il primo parametro delle funzioni che iniziano con set_ non può essere un logicContext
    set_size(val: GraphSize, context: LogicContext<DVoidVertex>): boolean {
        // todo: graphvertex should use this, but  calls graphelement.set_size instead
        // SetFieldAction.new(context.data, 'size', val, Action.SubType.vertexSize);
        if (!val) { return true; } //  val = defaultVSize; }
        //console.trace('setsize:', {context, val});
        if (context.data.x !== val.x) SetFieldAction.new(context.data, 'x', val.x);
        if (context.data.y !== val.y) SetFieldAction.new(context.data, 'y', val.y);
        if (context.data.w !== val.w) SetFieldAction.new(context.data, 'w', val.w);
        if (context.data.h !== val.h) SetFieldAction.new(context.data, 'h', val.h);
        val = new GraphSize(val.x, val.y, val.w, val.h);
        // (context.proxy as unknown as LGraphElement).graph.graphSize
        // update graph boundary too
        const graph: LGraph = this.get_graph(context); // (context.proxyObject as this).get_graph(context);
        const gsize = graph.graphSize;
        //console.log('setsize2, graph:', {context, val, gsize, graph});
        val.boundary(gsize);
        if (val.equals(gsize)) return true;
        graph.graphSize = val;
        return true;
    }*/

    get_isSelected(context: LogicContext<DVoidVertex>): GObject {
        return DPointerTargetable.mapWrap(context.data.isSelected, context.data, 'idlookup.' + context.data.id + '.isSelected', []);
    }
}
DGraphElement.subclasses.push(DVoidVertex);
LGraphElement.subclasses.push(LVoidVertex);

@RuntimeAccessible
export class DEdgePoint extends DVoidVertex { // DVoidVertex
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LEdgePoint;
    // static logic: typeof LEdgePoint;
    // static structure: typeof DEdgePoint;

    // inherit redefine
    id!: Pointer<DEdgePoint, 1, 1, LEdgePoint>;
    father!: Pointer<DVoidEdge, 1, 1, LVoidEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    // model!: Pointer<DModelElement, 0, 1, LModelElement>; gets model from this.father (edge)
    isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size?: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDEdgePoint!: true;

    public static new(model: undefined, parentNodeID: DEdgePoint["father"], graphID?: DEdgePoint["graph"], nodeID?: DGraphElement["id"],
                      size?: GraphSize): DEdgePoint {
        return new Constructors(new DEdgePoint('dwc'), parentNodeID, true).DPointerTargetable().DGraphElement(undefined, parentNodeID, graphID, nodeID)
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
    // __raw!: DEdgePoint;
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
    isResized!: boolean;
    // size!: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDVertex!: true;

    public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DVertex {
        return new Constructors(new DVertex('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidVertex(size).DVertex().end();
    }
}

@RuntimeAccessible
export class LVertex<Context extends LogicContext<any> = any, D = DVertex> extends LVoidVertex {
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
    isResized!: boolean;
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
    id!: Pointer<DGraphVertex, 1, 1>;
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
    isResized!: boolean;
    // size!: GraphSize; // virtual
    // from graph
    sizes!: Dictionary<Pointer<DModelElement>, GraphSize>;

    // personal attributes
    __isDVertex!: true;
    __isDGraph!: true;
    __isDGraphVertex!: true;

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DGraphVertex {
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
class LG extends LGraph{}
class LV extends LVertex{}
@RuntimeAccessible
export class LGraphVertex<Context extends LogicContext<any> = any, D extends DGraphVertex = any> extends MixOnlyFuncs(LG, LV) { // MixOnlyFuncs(LGraph, LVertex)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphVertex;
    // static logic: typeof LGraphVertex;
    // static structure: typeof DGraphVertex;

    // inherit redefine
    __raw!: DGraphVertex;
    id!: Pointer<DGraphVertex, 1, 1>;
    graph!: LGraph;
    model?: LModelElement;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn?: LGraphElement;
    ///////////////////////////////////////// subElements!: LGraphElement[];
    // from graph
    zoom!: GraphPoint;
    graphSize!: GraphSize; // internal size of the graph. can be huge even if the sub-graph is in a small window (scroll)

    // from VoidVertex
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    isResized!: boolean;
    size!: GraphSize; // virtual
    protected sizes!: Dictionary<Pointer<DModelElement>, GraphSize>;


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
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDVoidEdge!: true;
    midnodes!: Pointer<DEdgePoint, 1, 1, LEdgePoint>[];

    public static new(model?: DGraphElement["model"], parentNodeID?: DGraphElement["father"], graphID?: DGraphElement["graph"], nodeID?: DGraphElement["id"],): DVoidEdge {
        return new Constructors(new DVoidEdge('dwc'), graphID, true).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge().end();
    }
}

@RuntimeAccessible
export class LVoidEdge<Context extends LogicContext<DEdge> = any, D extends DEdge = DEdge> extends LGraphElement {
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
    start!: LGraphElement;
    end!: LGraphElement;
    __isLVoidEdge!: true;
    midnodes!: LEdgePoint[];


    protected get_midnodes(context: Context): this["midnodes"] {
        // return LPointerTargetable.wrapAll(context.data.midnodes);
        return LPointerTargetable.wrapAll(context.data.subElements);
    }
    protected set_midnodes(val: D["midnodes"], context: Context): boolean {
        return SetFieldAction.new(context.data.id, "midnodes", val, '', true);
    }
    protected get_start(context: Context): this["start"] { return LPointerTargetable.from(context.data.start); }
    protected get_end(context: Context): this["end"] { return LPointerTargetable.from(context.data.end); }
}
DGraphElement.subclasses.push(DVoidEdge);
LGraphElement.subclasses.push(LVoidEdge);




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
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDEdge!: true;
    __isDVoidEdge!: true;
    midnodes!: Pointer<DEdgePoint, 1, 1, LEdgePoint>[];

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DEdge {
        return new Constructors(new DEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge().DEdge().end();
    }
}

@RuntimeAccessible
export class LEdge<Context extends LogicContext<DEdge> = any, D extends DEdge = DEdge> extends LVoidEdge {
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
    start!: LGraphElement;
    end!: LGraphElement;
    midnodes!: LEdgePoint[];
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
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDExtEdge!: true;
    __isDEdge!: true;
    __isDVoidEdge!: true;

    public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DExtEdge {
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
    start!: LGraphElement;
    end!: LGraphElement;
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
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
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
    // __raw!: DRefEdge;
    start!: LGraphElement;
    end!: LGraphElement;
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
export type WGraphVertex = any; // getWParams<LGraphVertex, DGraphVertex>;
export type WEdgePoint = getWParams<LEdgePoint, DEdgePoint>;
export type WVoidVertex = getWParams<LVoidVertex, DVoidVertex>;
export type WVertex = getWParams<LVertex, DVertex>;
export type WEdge = getWParams<LEdge, DEdge>;
export type WGraph = getWParams<LGraph, DGraph>;
export type WGraphElement = getWParams<LGraphElement, DGraphElement>;

console.warn('ts loading graphDataElement');
