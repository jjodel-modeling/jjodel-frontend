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
    DUser,
    DViewElement,
    EdgeBendingMode,
    END,
    getWParams,
    GObject,
    GraphElementComponent,
    GraphPoint,
    GraphSize,
    Info,
    IStore,
    Leaf,
    LMap,
    LModelElement,
    Log,
    LogicContext,
    LPointerTargetable,
    LViewElement,
    MixOnlyFuncs,
    Node,
    Pack1,
    PackArr,
    Point,
    Pointer,
    Pointers,
    PrimitiveType,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    ShortAttribETypes,
    Size,
    store,
    TargetableProxyHandler,
    U,
    windoww
} from "../../joiner";
import type {RefObject} from "react";
import {Geom} from "../../common/Geom";
import {EdgeGapMode} from "../../joiner/types";


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
    view!: Pointer<DViewElement, 1, 1, LViewElement>;
    favoriteNode!: boolean;
    /*public static new(model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], a?: any, b?:any, c?:any): DGraphElement {
        return new Constructors(new DGraphElement('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID).end();
    }*/

}
@RuntimeAccessible
export class LGraphElement <Context extends LogicContext<DGraphElement> = any, C extends Context = Context> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    static getNodeId<L extends LGraphElement, D extends DGraphElement>(o:L | D | Pointer<D> | LModelElement | DModelElement | Pointer<DModelElement>): Pointer<D> {
        // Log.ex(!o, "cannot get node from undefined", {o});
        let node: any = o;
        // from L to D
        // let cname = (node.__raw || node).className;
        // from DModelE to LGraphE
        if (RuntimeAccessibleClass.extends((o as any).className, "DModelElement")) node = LPointerTargetable.from(o as DModelElement).node as LGraphElement;
        return (typeof node === "string") ? node : node?.id;
    }
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    __raw!: DGraphElement;
    id!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    father!: LGraphElement;
    graph!: LGraph; // todo: can be removed and accessed by navigating .father
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
    favoriteNode!: boolean;
    vertex?: LVoidVertex;
    __info__of__vertex: Info = {type: "LVoidVertex", txt: "the foremost vertex containing this graphElement, or undefiened."}
    __info__of__favoriteNode: Info = {type: ShortAttribETypes.EBoolean, txt: "indicates this is the primarly used (by default) node to refer to a modelling element that might have multiple representations. Can be used as favorite target for edges or other."}

    // edgeStart!: GraphPoint; in view
    // __info__of__edgeStart!: Info = {type:"GraphPoint", txt:"where the outgoing edges should start their paths."};

    get_outerGraph(context: Context): LGraph {
        // todo: this relies on the fact that GraphVertex are not passing their own id to their childrens, but the parent graph id
        return TargetableProxyHandler.wrap(context.data.graph);
    }
    __info_of__graph: Info = {type:"", txt:""};
    innerGraph!: LGraph;
    __info_of__innnerGraph: Info = {type:"", txt:""};
    outerGraph!: LGraph;
    __info_of__outerGraphGraph: Info = {type:"", txt:""};
    get_graph(context: Context): LGraph { return this.get_innerGraph(context); }

    __info_of__graphAncestors: Info = {type:"LGraph[]", txt:"collection of the stack of Graphs containing the current element where [0] is the most nested graph, and last is root graph."};
    graphAncestors!: LGraph[];
    get_graphAncestors(c: Context): LGraph[] {
        let current = c.proxyObject;
        let next = current.father;
        let ret: LGraph[] = [];
        while(next) {
            if (RuntimeAccessibleClass.extends(next.className, DGraph.name)) ret.push(next as LGraph);
            if (current.id === next.id) break;
            current = next;
            next = next.father;
        }
        return ret;
    }
    get_innerGraph(context: Context): LGraph {
        let lcurrent: LGraphElement = LPointerTargetable.fromPointer(context.data.father);
        let dcurrent = lcurrent.__raw;

        // if no parent, but it's a graph, return itself.
        if (!dcurrent) {
            dcurrent = context.data;
            switch(dcurrent.className){
                case DGraph.name:
                case DGraphVertex.name: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LGraph;
                default: return Log.exDevv("node failed to get containing graph", context.data, dcurrent, lcurrent);
            }
        }

        // if it have a parent, iterate parents.
        while(true){
            switch(dcurrent?.className){
                case DGraph.name:
                case DGraphVertex.name: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LGraph;
                default:
                    if (!dcurrent.father || dcurrent.id === dcurrent.father) {
                        switch(dcurrent.className){
                            case DGraph.name:
                            case DGraphVertex.name: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LGraph;
                            default: return Log.exDevv("node failed to get containing graph", context.data, dcurrent, lcurrent);
                        }
                    }
                    lcurrent = LPointerTargetable.fromPointer(dcurrent.father);
                    dcurrent = lcurrent.__raw;
            }
        }
    }
    get_vertex(context: Context): this["vertex"] {
        return this.wrongAccessMessage("get_vertex not implemented yet"); // todo
    }

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
    // get_view(context: Context): this["view"] { return this.get_component(context).props.view; }
    get_view(context: Context): this["view"] {
        let c = this.get_component(context);
        if (c) return c.props.view;
        return LPointerTargetable.fromPointer(context.data.view); }
    set_view(val: Pack1<this["view"]>, context: Context){
        let ptr: DGraphElement["view"] = Pointers.from(val as this["view"]);
        return SetFieldAction.new(context.data.id, "view", ptr, '', true);
    }

    outerSize!: LGraphElement["size"];
    __info_of__outerSize: Info = {type:"GraphSize", txt:"the size of the current element relative to the first (root) graph level."};
    innerSize!: LGraphElement["size"];
    __info_of__innerSize: Info = {type:"GraphSize", txt:"the size of the current element relative to the last (most nested) graph level."};
    __info_of__size: Info = {type:"GraphSize", txt: "same as innerSize."};

    get_outerSize(context: Context, canTriggerSet: boolean = true): Readonly<GraphSize> {
        return this.get_innerSize(context, canTriggerSet, true);
    }
    get_size(context: Context, canTriggerSet: boolean = true): Readonly<GraphSize> { return this.get_innerSize(context, canTriggerSet, false); }
    get_innerSize(context: Context, canTriggerSet: boolean = true, outerSize: boolean = false): Readonly<GraphSize> {
        let r = this.get_innerSize_impl(context, canTriggerSet, outerSize);
        return new GraphSize(r.x, r.y, r.w, r.h);
    }
    protected get_innerSize_impl(context: Context, canTriggerSet: boolean = true, outerSize: boolean = false): Readonly<GraphSize> {
        switch(context.data.className){
            default: return Log.exDevv("unexpected classname in get_size switch: " + context.data.className);
            case DVoidEdge.name:
            case DGraph.name: return nosize as any;
            // case DField.name:
            case DGraphElement.name:
                let graph = outerSize ? this.get_outerGraph(context) : this.get_innerGraph(context);
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
        let view = component?.props?.view || this.get_view(context);
        (window as any).retry = ()=>view.getSize(context.data.id);
        let ret = view.getSize(context.data.id); // (this.props.dataid || this.props.nodeid as string)
        // console.log("getSize() from view", {ret: ret ? {...ret} : ret});
        if (!ret) {
            ret = new GraphSize();
            ret.x = context.data.x;
            ret.y = context.data.y;
            ret.w = context.data.w;
            ret.h = context.data.h;
            let def: GraphSize | undefined;
            if (undefined===(ret.x)) { if (!def) def = view.defaultVSize; ret.x = def.x;}
            if (undefined===(ret.y)) { if (!def) def = view.defaultVSize; ret.y = def.y;}
            if (undefined===(ret.w)) { if (!def) def = view.defaultVSize; ret.w = def.w;}
            if (undefined===(ret.h)) { if (!def) def = view.defaultVSize; ret.h = def.h;}
            // console.log("getSize() from node merged with defaultVSize", {ret: ret ? {...ret} : ret});
        }

        if ((context.data as DVoidVertex).isResized) return ret;
        let html: RefObject<HTMLElement | undefined> | undefined = component?.html;
        let actualSize: Partial<Size> & {w:number, h:number} = html?.current ? Size.of(html.current) : {w:0, h:0};
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
        if (outerSize) ret = this.get_outerGraph(context).translateSize(ret, this.get_innerGraph(context));
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
        delete checked[context.data.id];
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
RuntimeAccessibleClass.set_extend(DPointerTargetable, DGraphElement);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LGraphElement)


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
            return new GraphSize((htmlSize.x - size.x) / zoom.x, (htmlSize.y - size.y) / zoom.y, htmlSize.w/zoom.x, htmlSize.h/zoom.y);
        }
    }
    // get_htmlSize(context: Context): Size { }
    __info_of__translateSize: Info = {type:"function(GraphSize, Graph) --> GraphSize",
        txt:"Translate the position of an element from his coordinates to the coordinate system of another graph.\n" +
            "The other graph must be an ancestor containing the current Graph calling this function."}
    translateSize<T extends GraphSize|GraphPoint>(ret: T, innerGraph: LGraph): T { return this.wrongAccessMessage("translateSize()"); }
    get_translateSize<T extends GraphSize|GraphPoint>(c: Context): ((size: T, innerGraph: LGraph) => T) {
        return (size: T, innerGraph: LGraph): T => {
            innerGraph = LPointerTargetable.wrap(innerGraph) as LGraph;
            let ret: T = (size.hasOwnProperty("w") ? new GraphSize(size.x, size.y, (size as GraphSize).w, (size as GraphSize).h) : new GraphPoint(size.x, size.y)) as T;
            Log.ex(!innerGraph, "translateSize() graph parameter is invalid: "+innerGraph, innerGraph, c);
            let ancestors: LGraph[] = [innerGraph, ...innerGraph.graphAncestors]
            Log.ex(ancestors.indexOf(c.proxyObject) !== -1, "translateSize() graph parameter is invalid: it must be a graph containing the current one.", innerGraph, c);
            for (let g of ancestors) ret.add(g.size.tl(), false);
            console.log("translateSize", {c, thiss:c.proxyObject, ancestors, ancestorSizes: ancestors.map(a=> a.size.tl()), size, ret});
            return ret; }
    }
    contains(elem: LGraphElement): boolean{ return this.wrongAccessMessage("contains()"); }
    get_contains(c: Context): ((elem: LGraphElement)=> boolean) {
        return (elem: LGraphElement): boolean => {
            let current = elem;
            let next = elem.father;
            let targetid = c.proxyObject.id;
            if (current.id !== targetid) return true;
            while(next && current.id !== next.id) {
                current = next;
                next = next.father;
                if (current.id !== targetid) return true;
            }
            return false;
        }}
}
RuntimeAccessibleClass.set_extend(DGraphElement, DGraph);
RuntimeAccessibleClass.set_extend(LGraphElement, LGraph);
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
RuntimeAccessibleClass.set_extend(DGraphElement, DVoidVertex);
RuntimeAccessibleClass.set_extend(LGraphElement, LVoidVertex);
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
RuntimeAccessibleClass.set_extend(DVoidVertex, DEdgePoint);
RuntimeAccessibleClass.set_extend(LVoidVertex, LEdgePoint);
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

RuntimeAccessibleClass.set_extend(DGraphElement, DVertex);
RuntimeAccessibleClass.set_extend(LGraphElement, LVertex);
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

RuntimeAccessibleClass.set_extend(DGraph, DGraphVertex);
RuntimeAccessibleClass.set_extend(DVertex, DGraphVertex);
RuntimeAccessibleClass.set_extend(LGraph, LGraphVertex);
RuntimeAccessibleClass.set_extend(LVertex, LGraphVertex);
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

    longestLabel!: PrimitiveType | labelfunc;
    labels!: PrimitiveType[] | labelfunc[];

    public static new(model: DGraph["model"]|null|undefined, parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"],
                      nodeID: DGraphElement["id"]|undefined, start: DGraphElement["id"], end: DGraphElement["id"],
                      longestLabel: DEdge["longestLabel"], labels: DEdge["labels"]): DEdge {
        return new Constructors(new DEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
            .DVoidEdge(start, end, longestLabel, labels).end();
    }
}
export enum MidNodeHandling {
    Pointlike = "PointLike", // as if their size is 0
    Gap = "Gap", // the arc connects to the node EndPoint, and exit from his StartPoint, with a gap between them
    Fill = "Fill" // like Gap mode, but a small arc or line is automatically inserted to fill the gap.
}
@RuntimeAccessible
class EdgeSegment{
    index: number;
    prev: EdgeSegment | undefined;
    start: segmentmaker;
    bezier: segmentmaker[];
    end: segmentmaker;
    length!: number;
    d!: string;
    dpart!: string; //  a segment of the whole path

    isLongest!: boolean;
    label!: PrimitiveType | JSX.Element | undefined;
    /*constructor(label: PrimitiveType|undefined, length: number, startp: GraphPoint, endp: GraphPoint, start: LGraphElement, end: LGraphElement,
                bezierpts: GraphPoint[], mid: LGraphElement[],
                svgLetter: EdgeBendingMode, index: number, fillMode: MidNodeHandling) {
        this.label = label;
        this.length = length;
        this.length = length;
        this.startp = startp;
        this.bezierp = bezierpts;
        this.endp = endp;
        this.start = start;
        this.end = end;
        this.mid = mid;
    }*/
    constructor(start: segmentmaker, mid: segmentmaker[], end: segmentmaker,
                svgLetter: EdgeBendingMode, gapMode: EdgeGapMode,
                index: number, prevSegment: EdgeSegment | undefined){

        this.start = start;
        this.bezier = mid;
        this.end = end;
        this.index = index;
        this.prev = prevSegment;
        //this.segments = segments;
        // the idea: forbid all T and S or transform them in C, Q by calculating and manually adding their mirrored bezier pts
        if (index > 0 &&(svgLetter[1] || svgLetter === "T" || svgLetter === "S")) {
            this.addBezierPoints();
            if (svgLetter === "T") svgLetter = EdgeBendingMode.Bezier_quadratic;
            if (svgLetter === "S") svgLetter = EdgeBendingMode.Bezier_cubic;
        }
        this.makeD(svgLetter, index, gapMode);
    }
    addBezierPoints(): void {
        let prev: EdgeSegment | undefined = this.prev;
        if (!prev) return;
        let prevedgemakerbezier: segmentmaker = (prev.bezier[prev.bezier.length-1] || prev.start);
        this.bezier = [{...prevedgemakerbezier, pt: EdgeSegment.invertLastBezierPt(prevedgemakerbezier.pt, prev.end.pt)}, ...this.bezier];
        // always only 1 assumed pt both in cubic and quadratic.
        // let next: this | undefined = this.segments[this.index+1];
        // EdgeSegment.invertLastBezierPt((next.mid[1] || next.end).pt, next.start.pt);
    }

    makeD(bendingMode: EdgeBendingMode, index: number, gapMode: EdgeGapMode): string {
        let svgLetter = bendingMode; // caller makes sure to pass right letter and resolve "CS" mixed letters. // this.bendingModeToLetter(bendingMode, index);
        // caller sends inverted pts as normal coords // let invertedBezPt = lastSegment && EdgeSegment.invertLastBezierPt(lastSegment.midp[lastSegment.mid.length-1] || lastSegment.startp, lastSegment.endp);
        switch (bendingMode.length) {
            case 2:
                return Log.exDevv("mixed letters are not allowed and should have been resolved to single svg letters before here, found:" + svgLetter);
            /*return Log.exDevv("dev problem to fix:\n" +
            "the mirrored mode requires the first one to have explicit non-mirrored mode?? like M, C a1 a2 a3, S a1, S a1, S a1\n" +
            "So all segments with mixed modes needs to extract the last bezier point (penultimate coordinate) from previous segments, mirror it and insert in midp[0]");*/
            case 1:
                let bezierpts = [...this.bezier.map( b=> b.pt), this.end.pt];
                let finalpart = svgLetter + " " + bezierpts.map((p)=> p.x + " " + p.y).join(", ");
                this.dpart = "M " + this.start.pt.x + " " + this.start.pt.y + ", " + finalpart;
                //midp = [this.startp, ...this.midp];
                // d = M sp X mp2 ep // X = custom letter
                // dpart = T sp X mp2 ep // S = S if X = C,
                // sp is the startingpoint from the prev node, which might be != from endpoint of last node if last node have w>0 && h>0
                // so i'm "filling" the gap with a T, or L arc wich can use only 1 parameter (they are the only 1-parameter arcs)
                let startletter: string;
                if (this.prev && this.prev.end.pt.equals(this.start.pt)) gapMode = EdgeGapMode.average; // if the 2 points coincide, i use any 1 of the gapmodes that are continuous
                switch (gapMode){
                    case EdgeGapMode.center:
                    case EdgeGapMode.average:
                        // continuous gap modes. they only differ in how the "joining" point is found, but not in how they behave after that.
                        /*
                        if (index === 0) {
                             startletter = "M ";
                         }
                         else {
                             switch (svgLetter) {
                                 case SvgLetter.A: case SvgLetter.C: case SvgLetter.S: case SvgLetter.Q: case SvgLetter.T: default:
                                     startletter = SvgLetter.T + " "; break;
                                 case SvgLetter.L: case SvgLetter.M:
                                     startletter = SvgLetter.L + " "; break;
                             }
                         }*/
                        if (index) {
                            this.d = finalpart;
                        }
                        else { this.d = this.dpart; }
                        break;
                    case EdgeGapMode.gap:
                    case EdgeGapMode.autoFill:
                    case EdgeGapMode.lineFill:
                    case EdgeGapMode.arcFill:
                        // the filling itself is done by another segment (solving svg letter and simulating i=0), so i treat it as a gap.
                        this.d = this.dpart;
                        break;
                    default:
                        Log.exDevv("unexpected EdgeGapMode:" + gapMode, {gapMode});
                }
                break;
            default: return Log.exDevv("unexpected bending mode length:" + bendingMode + " or fillMode: " + gapMode, {bendingMode, index, gapMode});
        }

        //using
        /*
        88

        // d should not have M set (except for segments[0]
        // dpart have M abd beed to add explicit points for "mirroring" and transforming bezier quadratic mirrored in bezier quadratic normal etc.
        //88 problem: the mirrored mode requires the first one to have explicit nonmirrored mode?? like M, C a1 a2 a3, S a1, S a1, S a1 .... ?
        in any case the % letter part is wrong because it needs to subtract first element used for M*/
        return this.d;
    }

    static invertLastBezierPt(bezier: GraphPoint, end: GraphPoint): GraphPoint{
        // vector = bezier - end
        // end + vector = bezier
        // end - vector = inverted bezier? = 2*end-bezier
        let vector = bezier.subtract(end, true);
        return end.subtract(vector, true);
    }

    calcLength(): void {
        this.length = this.start.pt.distanceFromPoint(this.end.pt);
    }
}
export enum SvgLetter{ "L"="L" , "M"="M", "S"="S", "C"="C", "Q"="Q", "A"="A", "T"="T"}
class EdgeFillSegment extends EdgeSegment{
    makeD(bendingMode: EdgeBendingMode, index: number, gapMode: EdgeGapMode): string {
        if (gapMode === EdgeGapMode.autoFill) { gapMode = bendingMode === EdgeBendingMode.Line ? EdgeGapMode.lineFill : EdgeGapMode.arcFill; }
        switch (gapMode) {
            case EdgeGapMode.center:
            case EdgeGapMode.average:
            case EdgeGapMode.gap:
                return ""; // should not have filer arcs
            default:
            case EdgeGapMode.autoFill as any:
            case EdgeGapMode.lineFill:
                this.bezier = [];
                return super.makeD(EdgeBendingMode.Line, index, gapMode);
            case EdgeGapMode.arcFill:
                bendingMode = bendingMode[0] as EdgeBendingMode;
                if (bendingMode === "Q") this.bezier = [this.bezier[0]];
                return super.makeD(bendingMode, index, gapMode);
        }
    }
}

export type labelfunc = (e:LVoidEdge, segment: EdgeSegment, allNodes: LEdge["allNodes"], allSegments: EdgeSegment[]) => PrimitiveType;

type segmentmaker = {size: GraphSize, view: LViewElement, ge: LGraphElement, pt: GraphPoint};
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

    edgeStart!: GraphPoint;
    edgeStart_inner!: GraphPoint;
    edgeStart_outer!: GraphPoint;
    __info_of__edgeStart: Info = {type: "GraphPoint", txt: "Same as edgeStart_outer."}
    __info_of__edgeStart_outer: Info = {type: "GraphPoint", txt: "Where the edge should start his path, in coordinates relative at the root Graph.<br>Computed by combining different options stored in View and the layout of the starting node."}
    __info_of__edgeStart_inner: Info = {type: "GraphPoint", txt: "Where the edge should start his path, in coordinates relative at the most nested Graph.<br>Computed by combining different options stored in View and the layout of the starting node."}
    edgeEnd!: GraphPoint;
    edgeEnd_inner!: GraphPoint;
    edgeEnd_outer!: GraphPoint;
    __info_of__edgeEnd: Info = {type: "GraphPoint", txt: "Same as edgeEnd_outer."}
    __info_of__edgeEnd_outer: Info = {type: "GraphPoint", txt: "Where the edge should end his path, in coordinates relative at the root Graph.<br>Computed by combining different options stored in View and the layout of the ending node."}
    __info_of__edgeEnd_inner: Info = {type: "GraphPoint", txt: "Where the edge should end his path, in coordinates relative at the most nested Graph.<br>Computed by combining different options stored in View and the layout of the ending node."}



//    label!: PrimitiveType; should never be read change their documentation in write only. their values is "read" in this.segments
//    longestLabel!: PrimitiveType;
//    labels!: PrimitiveType[];
    allNodes!: [LGraphElement, ...Array<LEdgePoint>, LGraphElement]


    /*    ___info_of__longestLabel: Info = {readType: "PrimitiveType", writeType:"PrimitiveType | " +
                "(e:this, curr: LGraphElement, next: LGraphElement, curr_index: number, allNodes: LGraphElement[]) => PrimitiveType)", txt: <span>Label assigned to the longest path segment.</span>}
        ___info_of__label: Info = {type: "", txt: <span>Alias for longestLabel</span>};
        ___info_of__labels: Info = {type: "type of label or Array<type of label>", txt: <span>Instructions to label to multiple or all path segments in an edge</span>};
    */
    ___info_of__allNodes: Info = {type: "[LGraphElement, ...Array<LEdgePoint>, LGraphElement]", txt: <span>first element is this.start. then all this.midnodes. this.end as last element</span>};


    // get_label(c: Context): this["label"] { return this.get_longestLabel(c); }
    // get_longestLabel(c: Context): this["label"] { return this.get_label_impl(c.data, c.proxyObject); }
    get_allNodes(c: Context): this["allNodes"] { return [this.get_start(c), ...this.get_midnodes(c), this.get_end(c)]; }
    /*get_labels(c: Context, allnodes?:this["allNodes"]): this["labels"] { //nb{}[]<>
        allnodes = allnodes || c.proxyObject.allNodes;
        let longestlabelindex: number | undefined = (c.data.longestLabel === undefined) ? undefined : todo: i need something like segments, for each segmented line a start and end. because start and end depends on target position and size and angle of incidence of edge and i cannot calculate it here multiple times.
        return allnodes.slice(0, allnodes.length-1).map( (n, index) => this.get_label_impl(c.data, c.proxyObject, allnodes as this["allNodes"] , index));
    }*/
    /*
        private get_longestLabel_impl(d: DVoidEdge, l: LVoidEdge, nodes:this["allNodes"], segments: this["segments"], index: number): PrimitiveType {
            let a: {nodes: LGraphElement[], segments: {label: string, length: number, start: GraphSize, end: GraphSize}}
            switch (typeof d.longestLabel) {//nb{}[]<>
                case "number":
                case "undefined":
                case "boolean":
                case "string": return d.longestLabel;
                // case "function": return nodes.map( (o, i) => d.labels(l, nodes, i)).slice(0, nodes.length-1);
                case "function": return (d.longestLabel as labelfunc)(l, nodes[index], nodes[index+1], index, nodes, segments);
                default: break;
                case "object": if (!Array.isArray(d.longestLabel)) break;
                    if (typeof d.longestLabel[0] === "function") return (d.longestLabel as any)[index % d.longestLabel.length](l, nodes[index], nodes[index+1], index, nodes);
                    return (d.longestLabel as PrimitiveType[])[index % d.longestLabel.length];
            }
            Log.exx("edge longestLabel invalid type, must be a primitive value, a function or an array of such.", d.longestLabel);
        }
    */
    private get_label_impl(c: Context, segment: EdgeSegment, nodes: this["allNodes"], segments: EdgeSegment[]): PrimitiveType | undefined {
        let key: "longestLabel" | "labels" = segment.isLongest ? "longestLabel" : "labels"; // : keyof this
        // if (isLongestSegment) return this.get_longestLabel_impl(d, l, nodes, index):
        const d = c.data;
        const l = c.proxyObject;
        let labelmaker: any = d[key]; // orArr<PrimitiveType | JSX | function>
        let labelmakerfunc: labelfunc = labelmaker as any;
        // let lastSeg = segments[i-1];
        switch (typeof labelmaker) {//nb{}[]<>
            case "number":
            case "undefined":
            case "boolean":
            case "string": return labelmaker;
            // case "function": return nodes.map( (o, i) => d.labels(l, nodes, i)).slice(0, nodes.length-1);
            case "function": return labelmakerfunc(l, segment, nodes, segments);
            default: break;
            case "object":
                if (labelmaker === null) return null;
                if (!Array.isArray(labelmaker)) break;
                if (typeof labelmaker[0] === "function") return (labelmaker[segment.index % labelmaker.length] as labelfunc)(l, segment, nodes, segments);
                return (labelmaker as PrimitiveType[])[segment.index % labelmaker.length];
        }
        Log.exx("edge labels invalid type, must be a primitive value, a function or an array of such.", {labelmaker, key, d});
        return undefined;
    }/*
    private get_label_impl_old(d: DVoidEdge, l: LVoidEdge, nodes:this["allNodes"], index: number, longestlabelindex?: number): PrimitiveType {
        if (d.longestLabel !== undefined && index === longestlabelindex) return this.get_longestLabel_impl(d, l, nodes, index);
        switch (typeof d.labels) {//nb{}[]<>
            case "number":
            case "undefined":
            case "boolean":
            case "string": return d.labels;
            // case "function": return nodes.map( (o, i) => d.labels(l, nodes, i)).slice(0, nodes.length-1);
            case "function": return d.labels(l, nodes[index], nodes[index+1], index, nodes);
            default: break;
            case "object": if (!Array.isArray(d.labels)) break;
            if (typeof d.labels[0] === "function") return (d.labels as any)[index % d.labels.length](l, nodes[index], nodes[index+1], index, nodes);
            return (d.labels as PrimitiveType[])[index % d.labels.length];
        }
        Log.exx("edge labels invalid type, must be a primitive value, a function or an array of such.", d.labels);
    }*/
    get_edgeStart(context: Context): GraphPoint{ return this.get_edgeStart_Outer(context); }
    get_edgeStart_Outer(c: Context): GraphPoint{
        console.log("get_edgeStart_Outer", {out:this.get_outerGraph(c), pos:this.get_edgeStart_inner(c), inner:this.get_innerGraph(c)});
        // problema: inner graph qua è di edge che è sempre situato nella root. dovrebbe essere innergraph del target?
        return this.get_outerGraph(c).translateSize(this.get_edgeStart_inner(c), this.get_start(c).innerGraph);
    }
    get_edgeStart_inner(c: Context): GraphPoint{ return this.get_edgeStartEnd_inner(c, true); }
    private get_edgeStartEnd_inner(c: Context, isStart: boolean): GraphPoint{
        // todo: obsolete, use get segment instead
        /*let view: LViewElement = this.get_view(c);
        let midNodes: LEdgePoint[] = this.get_midnodes(c);
        let startSize: GraphSize = (isStart ? this.get_start(c) : this.get_end(c))?.size || new GraphSize(0, 0, 0, 0);
        let cutAtBoundaries = view.edgeStartStopAtBoundaries;
        let startoffset: GraphPoint = view.edgeStartOffset;
        let firstMidNode: LEdgePoint = isStart ? midNodes[0] : midNodes[midNodes.length-1];
        let offset: GraphPoint = view.edgeStartOffset_isPercentage ? new GraphPoint(startoffset.x/100*(0+startSize.w), startoffset.y/100*(0+startSize.h)) : startoffset;
        let tentativeStart: GraphPoint = startSize.tl().add(offset, false);
        console.log("edgestart", {offset, startSize, startoffset, is$: view.edgeStartOffset_isPercentage, tentativeStart});
        function calculateStartingPoint(a:any, ...b:any) { return a;}*/
        // todo
        // this.get_segment(c, start, end, c.proxyObject.allNodes, start.view, end.view, cutAtBoundaries)
        //return calculateStartingPoint(tentativeStart, firstMidNode, cutAtBoundaries);
        return null as any;
    }
    segments!: EdgeSegment[];
    __info_of__segments: Info = {type: EdgeSegment.name, txt:<span>Collection of segments connecting in order vertex and EdgePoint without intersecting their area.</span>}
    /*    pathSegments!: EdgePathSegment[];
        __info_of__pathSegments: Info = {type: EdgePathSegment.name, txt:<span>Collection of segments aimed to be rendered in svg path, length of this array is allNodes.length % svg letter sise specified on view.</span>}

        public get_pathSegments(c: Context): this["segments"] {
            let ret = [];
            ret.length = c.proxyObject.allNodes% this.svgLetterSize(c.proxyObject.view.bendingMode);
        }*/
    private svgLetterSize( s: string ): {first:number, others: number} {
        switch (s) {
            default: return Log.exDevv("unexpected svg path letter: \"" + s + "\"", s);
            case EdgeBendingMode.Line:
            case EdgeBendingMode.Bezier_quadratic_mirrored: return {first: 1, others:1};
            case EdgeBendingMode.Bezier_quadratic:
            case EdgeBendingMode.Bezier_cubic_mirrored: return {first: 2, others:2};
            case EdgeBendingMode.Bezier_cubic: return {first: 3, others:3};
            case EdgeBendingMode.Elliptical_arc: return {first: 4, others:4};

            case EdgeBendingMode.Bezier_QT: return {first: 2, others:1};
            case EdgeBendingMode.Bezier_CS: return {first: 3, others:2};
        }

    }

    public get_points(allNodes: LGraphElement[]): segmentmaker[] {
        function getAnchorOffset(size: GraphSize, offset: GraphPoint, isPercentage: boolean) {
            if (!size) size = new GraphSize(0, 0, 0, 0);
            if (isPercentage) offset = new GraphPoint(offset.x/100*(size.w), offset.y/100*(size.h));
            return size.tl().add(offset, false);
        }
        const all: segmentmaker[] = allNodes.map((ge) => {
            let ret: segmentmaker = { view: ge.view, size: ge.size, ge} as any;
            ret.pt = getAnchorOffset(ge.size, ret.view.edgeStartOffset, ret.view.edgeStartOffset_isPercentage);
            return ret; }
        );
        return all;
    }
    /*
        public get_segments_v1(c: Context): this["segments"] {
            const allNodes = this.get_allNodes(c); // n{} []
            const all: {size: GraphSize, view: LViewElement, ge: LGraphElement}[] = allNodes.map(function(ge){ return { view: ge.view, size: ge.size, ge}}); // n{} []
            let ret: EdgeSegment[] = [];
            let cut = this.get_view(c).edgeStartStopAtBoundaries;
            let longestindex = -1;
            let longest = 0;
            let v: LViewElement = c.proxyObject.view;
            let longestLabel = c.data.longestLabel;

            let letterSize = this.svgLetterSize(c.proxyObject.view.bendingMode);
            let s: EdgeSegment | undefined = undefined;
            let fillMode: MidNodeHandling = v.edgeGapFill;
            for (let i = 0; i < all.length - letterSize; i+= letterSize){
                let start = all[i];
                let end = all[i+letterSize];
                let mid = all.slice(i+1, i+letterSize)
                s = this.get_segment(start.ge, start.size, start.view, end.ge, end.size, end.view, cut, v.bendingMode, mid, ret[ret.length -1], fillMode, s);
                ret.push(s);
                if (longestLabel !== undefined && longest < s.length) { longest = s.length; longestindex = i; }
            }

            for (let i = 1; i < ret.length - 1; i++){
                ret[i].label = this.get_label_impl(c, ret[i], i, i===longestindex, allNodes, ret);
            }
            return ret;
        }
    */
    public d!: string;
    public __info_of__d: Info = {type: ShortAttribETypes.EString, txt:"the full suggested path of SVG path \"d\" attribute, merging all segments."}
    public get_d(c: Context) {
        this.get_segments(c).all.map(s => s.d).join(" ");
    }
    private get_fillingSegments(c: Context): Partial<this["segments"]> {
        return this.get_segments(c).fillers;
    }
    public get_segments(c: Context): {all: EdgeSegment[], segments: EdgeSegment[], fillers: EdgeSegment[]} {
        let l = c.proxyObject;
        let v = this.get_view(c);
        let allNodes = l.allNodes;
        let all: segmentmaker[] = this.get_points(allNodes);
        //const all: {size: GraphSize, view: LViewElement, ge: LGraphElement}[] = allNodes.map((ge) => { return { view: ge.view, size: ge.size, ge}});
        let ret: EdgeSegment[] = [];
        let bm: EdgeBendingMode = v.bendingMode;
        let gapMode: EdgeGapMode = v.edgeGapMode;
        let segmentSize = this.svgLetterSize(bm);
        let increase: number = segmentSize.first; // + 1; // for first M
        let segment: EdgeSegment | undefined;

        let firstSvgLetter: SvgLetter = bm[0] as SvgLetter;
        let secondSvgLetter: SvgLetter = (bm[1] || bm[0]) as SvgLetter;

        function getSvgLetter(index: number): SvgLetter{
            // if (index === 0) return SvgLetter.M;
            // if (index === 1) return bm[0] as SvgLetter;
            if (index === 0) return firstSvgLetter;
            return secondSvgLetter; }

        /// grouping points according to SvgLetter
        for (let i = 0; i < all.length; i+= increase) {
            // let start = all[i], end = all[i+increase];
            let start: segmentmaker = all[i];
            let mid: segmentmaker[] = all.slice(i+1, i+increase);
            let end: segmentmaker = all[i+increase];
            // segment = this.get_segmentv3(start, mid, end, getSvgLetter(i), i, segment, all);
            segment = new EdgeSegment(start, mid, end, bm, gapMode, i, segment);
            // segment = this.get_segment(start.ge, start.size, start.view, end.ge, end.size, end.view, cut, v.bendingMode, mid, ret[ret.length -1], fillMode, segment);
            ret.push(segment);
            if (increase !== segmentSize.others) increase = segmentSize.others;
            // if (longestLabel !== undefined && longest < s.length) { longest = s.length; longestindex = i; } todo: move to after snapping to borders
        }
        let fillSegments: EdgeSegment[] = [];
        this.snapSegmentsToNodeBorders(c, v, ret, fillSegments);
        let longestLabel = c.data.longestLabel;
        this.setLabels(c, ret, allNodes, longestLabel);
        return {all: [...ret, ...fillSegments], segments: ret, fillers: fillSegments};
    }
    private setLabels(c: Context, segments: EdgeSegment[], allNodes: this["allNodes"], longestLabel: D["longestLabel"]): void {
        // find longest segment
        let longestindex = -1;
        let longest = 0;
        for (let i = 0; i < segments.length; i++) {
            let s = segments[i];
            s.calcLength();
            if (longestLabel !== undefined && longest < s.length) { longest = s.length; longestindex = i; }
        }
        if (longestindex>=0) segments[longestindex].isLongest = true;
        // apply labels
        for (let s of segments) s.label = this.get_label_impl(c, s, allNodes, segments);
    }

    private snapSegmentsToNodeBorders(c: Context, v: LViewElement, ret: EdgeSegment[], fillSegments: EdgeSegment[]){
        // snap segment start and end to a node border
        let cutStart: boolean = v.edgeStartStopAtBoundaries, cutEnd: boolean = v.edgeEndStopAtBoundaries;
        let grid: GraphPoint | undefined = undefined;
        // let fillSegments: EdgeSegment[] = [];
        let gapMode: EdgeGapMode = v.edgeGapMode;
        let bm: EdgeBendingMode = v.bendingMode;


        // cut i === 0 is cut regardless of gapmode.
        if (cutStart) {
            ret[0].start.pt = GraphSize.closestIntersection(ret[0].start.size, ret[0].start.pt, ret[0].bezier[0].pt || ret[0].end.pt, grid) as any
                || Geom.closestPoint(ret[0].start.size, ret[0].start.pt);
        }

        // cut middle segments maybe
        let prev: EdgeSegment = ret[0];
        if (cutStart || cutEnd) // do the for below
            for (let i = 1; i < ret.length; i++){
                prev = ret[i-1];
                let curr: EdgeSegment = ret[i];
                let doStartCut: boolean, doEndCut: boolean;
                switch(gapMode){
                    case EdgeGapMode.arcFill:
                    case EdgeGapMode.lineFill:
                    case EdgeGapMode.autoFill:
                        // same as gap, but will insert 1 more segment to fill the hole
                        doStartCut = cutStart;
                        doEndCut = cutEnd;
                        if (prev.end.pt.equals(curr.start.pt)) break;
                        fillSegments.push(new EdgeFillSegment(
                            prev.end,
                            [
                                {...prev.end, pt: EdgeSegment.invertLastBezierPt(prev.end.pt, prev.bezier[prev.bezier.length-1].pt || prev.start.pt)},
                                {...curr.start, pt: EdgeSegment.invertLastBezierPt(curr.start.pt, curr.bezier[0].pt || curr.end.pt)}
                            ],
                            curr.start,
                            bm, gapMode, 0, undefined));
                            /*
                            fillSegments.push(new FillEdgeSegment( // M <start_gap> C <bez1> <bez2> <end_gap>   // <start_gap> = end of last seg (start of gap) <end_gap> = first of curr seg (end of gap)
                            prev.end.pt,
                            EdgeSegment.invertLastBezierPt(prev.end.pt, prev.bezier[prev.bezier.length-1].pt || prev.start.pt),
                            EdgeSegment.invertLastBezierPt(curr.start.pt, curr.bezier[0].pt || curr.end.pt),
                            curr.start.pt)
                            */
                        break;
                    case EdgeGapMode.gap:
                        // just snap to vertex edge         prevSegment.endp and ret.startp
                        doStartCut = cutStart;
                        doEndCut = cutEnd;
                        break;
                    case EdgeGapMode.average:// todo: maybe rename in join (merges start-end at closest pt to both (avg), then snap on edge)
                        // first move to average of the 2 points in the gap, then snap to edge
                        doEndCut = false; doStartCut = true; // indipendent from cutStart, cutEnd. they merge if just 1 of cutting sides are true. (and if they are both false we don't even enter the for loop)
                        curr.start.pt.add(prev.end.pt, false).divide(2, false);
                        prev.end.pt = curr.start.pt;
                        break;
                    case EdgeGapMode.center:
                    // first move it to center of edgePoint/node, then snap to edge. THIS IGNORES VERTEXPOINT OFFSET, does it have any meaning to keep?
                    default:
                        return Log.exDevv("unexpected EdgeGapMode:" + gapMode);
                }
                if (doStartCut){
                    let extpt: GraphPoint = curr.bezier[0].pt || curr.end.pt;
                    curr.start.pt = GraphSize.closestIntersection(curr.start.size, curr.start.pt, extpt, grid) as any || Geom.closestPoint(curr.start.size, curr.start.pt);
                    if (gapMode === EdgeGapMode.average && prev) { prev.end.pt = curr.start.pt; }
                }
                if (doEndCut){
                    let prevpt: GraphPoint = prev.bezier[prev.bezier.length-1].pt || prev.start.pt;
                    prev.end.pt = GraphSize.closestIntersection(prev.end.size, prev.end.pt, prevpt, grid) as any || Geom.closestPoint(prev.end.size, prev.end.pt);
                }
            }
        // cut end of last segment regardless of gapMode
        if (cutEnd) {
            prev.end.pt = GraphSize.closestIntersection(prev.end.size, prev.end.pt, prev.bezier[prev.bezier.length-1].pt || prev.start.pt, grid) as any
                || Geom.closestPoint(prev.end.size, prev.end.pt);
        }

    }



    get_edgeEnd(context: Context){ return this.get_edgeEnd_outer(context); }
    get_edgeEnd_outer(c: Context){
        // return this.get_outerGraph(c).translateSize(this.get_edgeEnd_inner(c), this.get_innerGraph(c));
        return this.get_outerGraph(c).translateSize(this.get_edgeEnd_inner(c), this.get_end(c).innerGraph);
    }
    get_edgeEnd_inner(c: Context){
        return this.get_edgeStartEnd_inner(c, false);
        // return context.proxyObject.end?.size || new GraphPoint(0, 0);
    }


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
RuntimeAccessibleClass.set_extend(DGraphElement, DVoidEdge);
RuntimeAccessibleClass.set_extend(LGraphElement, LVoidEdge);
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
RuntimeAccessibleClass.set_extend(DVoidEdge, DEdge);
RuntimeAccessibleClass.set_extend(LVoidEdge, LEdge);
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
    /*
        public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DExtEdge {
            return new Constructors(new DExtEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
                .DVoidEdge().DEdge().DExtEdge().end();
        }*/
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
RuntimeAccessibleClass.set_extend(DEdge, DExtEdge);
RuntimeAccessibleClass.set_extend(LEdge, LExtEdge);
@Leaf
@RuntimeAccessible
export class DRefEdge extends DEdge { // extends DEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDRefEdge!: true;
    /*
        public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"]): DRefEdge {
            return new Constructors(new DRefEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
                .DVoidEdge().DEdge().DRefEdge().end();
        }*/

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
RuntimeAccessibleClass.set_extend(DEdge, DRefEdge);
RuntimeAccessibleClass.set_extend(LEdge, LRefEdge);
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
