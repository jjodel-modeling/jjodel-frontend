// import {Mixin} from "ts-mixer";
import {isDeepStrictEqual} from "util";
import {
    BEGIN,
    Constructors,
    CoordinateMode,
    Debug,
    Dictionary,
    DModelElement,
    DocString,
    DPointerTargetable,
    DState,
    DUser,
    DViewElement,
    EdgeBendingMode,
    END,
    EPSize,
    getWParams,
    GObject,
    GraphElementComponent,
    GraphPoint,
    GraphSize,
    Info, IPoint, Keystrokes,
    Leaf,
    LModelElement,
    Log,
    LogicContext,
    LPointerTargetable,
    LViewElement,
    MixOnlyFuncs,
    Node, orArr,
    Pack1,
    PackArr,
    Point,
    Pointer,
    Pointers,
    PrimitiveType,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction, SetRootFieldAction,
    ShortAttribETypes,
    Size,
    store,
    TargetableProxyHandler, TRANSACTION,
    transientProperties,
    U,
    Uarr,
    windoww
} from "../../joiner";
import type {Tooltip} from "../../components/forEndUser/Tooltip";
import type {RefObject} from "react";
import type {SVGPathElementt, SVGPathSegment} from '../../common/libraries/pathdata';
import {EdgeGapMode, InitialVertexSize} from "../../joiner/types";
import {Geom, ISize} from "../../common/Geom";


console.warn('ts loading graphDataElement');

@Node
@RuntimeAccessible('DGraphElement')
export class DGraphElement extends DPointerTargetable {
    // static _super = DPointerTargetable;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model?: Pointer<DModelElement, 0, 1, LModelElement>;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state!: GObject; // DMap
    father!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    x!: number;
    y!: number;
    zIndex: number = 100;
    w!: number;
    h!: number;
    // width: number = 300;
    // height: number = 400;
    view!: Pointer<DViewElement, 1, 1, LViewElement>;
    favoriteNode!: boolean;
    edgesIn!: Pointer<DEdge>[];
    edgesOut!: Pointer<DEdge>[];
    anchors!: Dictionary<string, GraphPoint/* as % of node size.*/>;


    public static new(htmlindex: number, model: DGraphElement["model"]|null|undefined, parentNodeID: DGraphElement["father"],
                      graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"]|undefined, a?: any, b?:any, ...c:any): DGraphElement {
        return new Constructors(new DGraphElement('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID, htmlindex).end();
    }

    static nodeLFromHtml(target?: Element | null): LGraphElement | undefined { return LPointerTargetable.fromPointer(DGraphElement.nodePtrFromHtml(target) as Pointer); }
    static nodeDFromHtml(target?: Element | null): DGraphElement | undefined { return DPointerTargetable.fromPointer(DGraphElement.nodePtrFromHtml(target) as Pointer); }
    static nodePtrFromHtml(target?: Element | null): Pointer<DGraphElement> | undefined {
        while (target) {
            if ((target.attributes as any).nodeid) return (target.attributes as any).nodeid.value;
            target = target.parentElement;
        }
        return undefined;
    }
    static graphLFromHtml(target?: Element | null): LGraph | undefined { return LPointerTargetable.fromPointer(DGraphElement.graphPtrFromHtml(target) as Pointer); }
    static graphDFromHtml(target?: Element | null): DGraph | undefined { return DPointerTargetable.fromPointer(DGraphElement.graphPtrFromHtml(target) as Pointer); }
    static graphPtrFromHtml(target?: Element | null): Pointer<DGraph> | undefined {
        while (target) {
            if ((target.attributes as any).graphid) return (target.attributes as any).graphid.value;
            target = target.parentElement;
        }
        return undefined;
    }
}
@RuntimeAccessible('LGraphElement')
export class LGraphElement<Context extends LogicContext<DGraphElement> = any, C extends Context = Context> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    static getNodeId<L extends LGraphElement, D extends DGraphElement>(o?:L | D | Pointer<D> | LModelElement | DModelElement | Pointer<DModelElement>): Pointer<D> {
        if (!o) return undefined as any;
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
    model?: LModelElement;
    // protected isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>; //  & ((forUser?: Pointer<DUser>) => boolean);

    // containedIn?: LGraphElement;
    _state!: GObject<"proxified">; // LMap;
    x!: number;
    y!: number;
    width!: number;
    height!: number

    z!:number;
    zIndex!: number;
    __info_of__z__: Info = {type:ShortAttribETypes.EInt, txt: "alias for zIndex"};
    __info_of__zIndex__: Info = {type:ShortAttribETypes.EInt,
        txt: "Determine the z-axis priority of the element.<br/>Higher value tende to overlap other elements.<br/>Lower value tends to be on background."};
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
    __info_of__vertex: Info = {type: "LVoidVertex", txt: "the foremost vertex containing this graphElement, or undefiened."}
    __info_of__favoriteNode: Info = {type: ShortAttribETypes.EBoolean,
        txt: "<span>Indicates this is the primarly used (by default) node to refer to a modelling element that might have multiple representations." +
            "<br> Can be used as favorite target for edges or other."}

    startPoint!: GraphPoint;
    endPoint!: GraphPoint;
    __info_of__startPoint: Info = {type: "GraphPoint", txt:<span>Where the outgoing edges should start their paths.
            <br/>Obtained by combining anchoring point offset specified in view, before snapping to a Vertex border.
            <br/>Defaults in outer coordinates.</span>};
    __info_of__endPoint: Info = {type: "GraphPoint", txt:<span>Where the incoming edges should end their paths.
            <br/>Obtained by combining anchoring point offset specified in view, before snapping to a Vertex border.
            <br/>Defaults in outer coordinates.</span>};

    graph!: LGraph | LGraphVertex;
    __info_of__graph: Info = {type:"LGraph | LGraphVertex", txt:"Alias for innerGraph"};
    get_graph(context: Context): LGraph | LGraphVertex { return this.get_innerGraph(context); }
    innerGraph!: LGraph|LGraphVertex;
    __info_of__innnerGraph: Info = {type:"LGraph | LGraphVertex", txt:"Gets the nearest-level graph (it might be a Sub-graph like a package usually is)"};
    outerGraph!: LGraph;
    __info_of__outerGraphGraph: Info = {type:"LGraph", txt:"Gets the root-level graph"};
    root!: LGraph;

    __info_of__root: Info = {type:"LGraph", txt:"Alias for outerGraph"};
    get_root(context: Context): LGraph { return this.get_outerGraph(context); }

    __info_of__graphAncestors: Info = {type:"LGraph[]",
        txt:"<span>collection of the stack of Graphs containing the current element where [0] is the most nested graph, and last is root graph.</span>"};
    graphAncestors!: LGraph[];

    anchors!: Dictionary<string, GraphPoint/* as % of node size.*/>;
    __info_of__anchors: Info = {type:"Dictionary<string, point>", txt: <div>A named list of all anchor points where edges are allowed to land or depart from.<br/>
            {/*When reading it is in absolute sizes.<br/>*/}
            When writing it must be done in percentages, with the same rules as node.state.</div>}
    get_anchors(c: Context): this["anchors"]{ return c.data.anchors; }
    set_anchors(v: this["anchors"], c: Context):boolean{
        if (v !== undefined && (typeof v !== "object" || Array.isArray(v))){
            Log.ee('cannot set anchors: invalid value provided');
            return true;
        }
        if (v){ // if !v it means clear all anchors?
            for (let ka in v){//for each anchor
                if (!v[ka]) continue;

                if (c.data.anchors[ka]) {
                    for (let kk in v[ka]) { //for each key within an anchor (x, y, w, h)
                        // if i was attempting to set a partial size, complete it with the old size values.
                        if ((v[ka][kk] === undefined) && (c.data.anchors[ka][kk] !== undefined)) v[ka][kk] = c.data.anchors[ka][kk];
                    }
                }
                if (v[ka].x === undefined || isNaN(v[ka].x)) v[ka].x = 0.5;
                if (v[ka].y === undefined || isNaN(v[ka].y)) v[ka].y = 0.5;
                // if (v[ka].w === undefined || isNaN(v[ka].w)) v[ka].w = 5;
                // if (v[ka].h === undefined || isNaN(v[ka].h)) v[ka].h = 5;
            }
        }
        SetFieldAction.new(c.data, "anchors", v, '+=', false);
        return true; }

    edgesIn!: LVoidEdge[];
    edgesOut!: LVoidEdge[];
    __info_of__edgesIn: Info = {type:"LEdge[]", txt:<div>Edges incoming into this element. <code>this.edgesOut[i].end</code> always equals to <code>this</code>.</div>}
    __info_of__edgesOut: Info = {type:"LEdge[]", txt:<div>Edges outgoing from this element. <code>this.edgesIn[i].start</code> always equals to <code>this</code>.</div>}
    __info_of__edgesStart: Info = {type:"LEdge[]", txt:<div>Alias for this.edgesOut</div>}
    __info_of__edgesEnd: Info = {type:"LEdge[]", txt:<div>Alias for this.edgesIn</div>}
    public get_edgesIn(context: Context): this["edgesIn"] { return LPointerTargetable.fromArr(context.data.edgesIn); }
    public get_edgesOut(context: Context): this["edgesOut"]  { return LPointerTargetable.fromArr(context.data.edgesOut); }
    public set_edgesIn(val: PackArr<LVoidEdge>, c: Context): boolean { return SetFieldAction.new(c.data.id, "edgesIn", Pointers.fromArr(val), '', true); }
    public set_edgesOut(val: PackArr<LVoidEdge>, c: Context): boolean { return SetFieldAction.new(c.data.id, "edgesOut", Pointers.fromArr(val), '', true); }
    public get_edgesStart(context: Context): this["edgesIn"]  { return this.get_edgesIn(context); }
    public get_edgesEnd(context: Context): this["edgesOut"]  { return this.get_edgesOut(context); }
    public set_edgesStart(val: PackArr<LVoidEdge>, context: Context): boolean { return this.set_edgesIn(val, context); }
    public set_edgesEnd(val: PackArr<LVoidEdge>, context: Context): boolean { return this.set_edgesOut(val, context); }


    protected _defaultGetter(c: Context, k: keyof Context["data"]): any {
        if (k in c.data) return this.__defaultGetter(c, k);
        // if value not found in node, check in view.
        return (this.get_view(c) as any)[k];
        /*let ret: any;
        let view = this.get_view(c);
        try { ret = (view as any)[k] } catch (e) { Log.ee("Could not find get_ property \"" + k + "\" in node or view.", {c, view, k}); return undefined; }
        return ret;*/
    }

    protected _defaultSetter(v: any, c: Context, k: keyof Context["data"]): true {
        this.__defaultSetter(v, c, k);
        return true;
    }

    get_graphAncestors(c: Context): LGraph[] {
        let current = c.proxyObject;
        let next = current.father;
        let ret: LGraph[] = [];
        while(next) {
            if (RuntimeAccessibleClass.extends(next.className, DGraph.cname)) ret.push(next as LGraph);
            if (current.id === next.id) break;
            current = next;
            next = next.father;
        }
        return ret;
    }
    get_outerGraph(context: Context): LGraph {
        // todo: this relies on the fact that GraphVertex are not passing their own id to their childrens, but the parent graph id
        return TargetableProxyHandler.wrap(context.data.graph);
    }
    get_vertex(context: Context): this["vertex"] {
        let lcurrent: LGraphElement = LPointerTargetable.fromPointer(context.data.id);
        let dcurrent = lcurrent.__raw;
        // iterate parents.
        while(dcurrent){
            switch(dcurrent.className){
                case DVertex.cname:
                case DVoidVertex.cname:
                case DGraphVertex.cname: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LVoidVertex;
                default:
                    if (!dcurrent.father || dcurrent.id === dcurrent.father) return undefined;
                    Log.exDev(!dcurrent.father || dcurrent.id === dcurrent.father, "node failed to get containing vertex", context.data, dcurrent, lcurrent);
                    lcurrent = LPointerTargetable.fromPointer(dcurrent.father);
                    dcurrent = lcurrent.__raw;
            }
        }
        return undefined;
    }

    get_innerGraph(context: Context): LGraph {
        let dcurrent = DPointerTargetable.fromPointer(context.data.father);

        // if no parent, but it's a graph, return itself.
        if (!dcurrent) {
            dcurrent = context.data;
            switch(dcurrent.className){
                case DGraph.cname:
                case DGraphVertex.cname: return (LPointerTargetable.fromD(dcurrent)) as LGraph;
                default: return Log.exDevv("root node failed to get containing graph", {cdata:context.data, dcurrent});
            }
        }

        // if it have a parent, iterate parents.
        while(true){
            switch(dcurrent?.className){
                case DGraph.cname:
                case DGraphVertex.cname: return (LPointerTargetable.fromD(dcurrent)) as LGraph;
                default:
                    Log.exDev(!dcurrent.father, "node failed to get containing graph", {cdata:context.data, dcurrent});
                    Log.exDev(dcurrent.id === dcurrent.father, "node failed to get containing graph, found loop",
                        {cdata:context.data, dcurrent, father: LPointerTargetable.from(dcurrent)?.father});
                    dcurrent = DPointerTargetable.fromPointer(dcurrent.father);
            }
        }
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
        return transientProperties.node[context.data.id]?.mainView?.r || LPointerTargetable.fromPointer(context.data.view) || this.get_component(context)?.props.view?.r;
    }
    set_view(val: Pack1<this["view"]>, context: Context){
        Log.eDevv("node.view is readonly, change it through props or the model");
        // let ptr: DGraphElement["view"] = Pointers.from(val as this["view"]);
        // return SetFieldAction.new(context.data.id, "view", ptr, '', true);
    }

    outerSize!: LGraphElement["size"];
    __info_of__outerSize: Info = {type:"GraphSize", txt:"the size of the current element relative to the first (root) graph level."};
    innerSize!: LGraphElement["size"];
    __info_of__innerSize: Info = {type:"GraphSize", txt:"the size of the current element relative to the last (most nested) graph level."};
    __info_of__size: Info = {type:"GraphSize", txt: "same as innerSize."};


    getSize(outer: boolean = false, canTriggerSet: boolean = true): Readonly<GraphSize> { return this.wrongAccessMessage("getSize()"); }
    get_getSize(c: Context): ((outer?: boolean, canTriggerSet?: boolean) => Readonly<GraphSize>) {
        return (outer: boolean = true, canTriggerSet: boolean = true) => this.get_innerSize(c, canTriggerSet, outer); }

    get_outerSize(context: Context, canTriggerSet: boolean = true): Readonly<GraphSize> {
        return this.get_innerSize(context, canTriggerSet, true);
    }
    get_size(context: Context, canTriggerSet: boolean = true): Readonly<GraphSize> { return this.get_innerSize(context, canTriggerSet, false); }
    get_innerSize(context: Context, canTriggerSet: boolean = true, outerSize: boolean = false): Readonly<GraphSize> {
        let r = this.get_innerSize_impl(context, canTriggerSet, outerSize);
        return new GraphSize(r.x, r.y, r.w, r.h);
    }
    protected get_innerSize_impl(context: Context, canTriggerSet: boolean = true, outerSize: boolean = false): Readonly<GraphSize> {
        canTriggerSet = canTriggerSet && !Debug.lightMode;
        let cname = context.data.className;
        // cname = DGraphElement.cname;
        switch (cname){
            default: return Log.exDevv("unexpected classname in get_size switch: " + context.data.className);
            case DEdge.cname:
            case DVoidEdge.cname:
            case DGraph.cname: return nosize as any;
            // case DField.cname:
            case DGraphElement.cname:
                let graph = outerSize ? this.get_outerGraph(context) : this.get_innerGraph(context);
                return graph.coord(this.get_htmlSize(context));
            case DVoidVertex.cname:
            case DVertex.cname:
            case DEdgePoint.cname:
            case DGraphVertex.cname: break;
        }

        // low prio todo: memoization in proxy, as long state does not change keep a collection Dictionary[object][key] = returnval. it gets emptied when state is updated.

        // when loading a save, edge segements and edgepoints/nodes are computed before creating the edgepoint component
        let view: LViewElement = this.get_view(context);
        // (window as any).retry = ()=>view.getSize(context.data.id);
        let ret: EPSize = view.getSize(context.data.id) as any; // (this.props.dataid || this.props.nodeid as string)

        console.log("getSize() from view", {ret: ret ? {...ret} : ret});
        if (!ret) {
            ret = new GraphSize() as EPSize;
            ret.x = context.data.x;
            ret.y = context.data.y;
            ret.w = context.data.w;
            ret.h = context.data.h;
            let def: GraphSize | undefined;
            if (undefined===(ret.x)) { if (!def) def = view.defaultVSize; ret.x = def.x || 0;}
            if (undefined===(ret.y)) { if (!def) def = view.defaultVSize; ret.y = def.y || 0;}
            if (undefined===(ret.w)) { if (!def) def = view.defaultVSize; ret.w = def.w || 10;}
            if (undefined===(ret.h)) { if (!def) def = view.defaultVSize; ret.h = def.h | 10;}
            ret.currentCoordType = (context.data as DEdgePoint).currentCoordType as any;
            console.log("getSize() from node merged with defaultVSize", {ret: ret ? {...ret} : ret});
        }
        if (context.data.className === DEdgePoint.cname) {
            ret = (this as any as LEdgePoint).decodePosCoords(context, ret, view);
        }

        /*
                if ((context.data as DVoidVertex).isResized) {
                    return ret;
                }*/
        if (!canTriggerSet) {
            if (outerSize) ret = this.get_outerGraph(context).translateSize(ret, this.get_innerGraph(context));
            return ret;
        }
        let html: HTMLElement | undefined | null = this.get_component(context)?.html?.current;
        let actualSize: Partial<Size> & {w:number, h:number} = html ? Size.of(html) : {w:0, h:0};
        let isOldElement = (context.data.clonedCounter as number) > 3;
        // if w = 0 i don't auto-set it as in first render it has w:0 because is not reredered and not resized.
        // if (canTriggerSet) this.set_size({w:actualSize.w}, context);
        console.log("getSize() cantriggerset html size", {ret: ret ? {...ret} : ret, html, actualSize, hcc:html?.dataset?.clonedcounter, ncc: context.data.clonedCounter});
        if (!html || +(html.dataset.clonedcounter as string) !== context.data.clonedCounter) canTriggerSet = false;
        let updateSize: boolean = false;
        if (view.adaptWidth && ret.w !== actualSize.w) {
            if (canTriggerSet && (isOldElement || actualSize.w !== 0)) {
                ret.w = actualSize.w;
                updateSize = true;
            }
        }
        if (view.adaptHeight && ret.h !== actualSize.h) {
            if (canTriggerSet && (isOldElement || actualSize.h !== 0)) {
                ret.h = actualSize.h;
                updateSize = true;
            }
        }
        // console.log("getSize() from node merged with actualSize", {ret: {...ret}});

        if (updateSize) this.set_size(ret, context);
        if (outerSize) ret = this.get_outerGraph(context).translateSize(ret, this.get_innerGraph(context));
        return ret;
    }
    // set_size(size: Partial<this["size"]>, context: Context): boolean {
    set_size(size0: Partial<GraphSize>, c: Context): boolean {
        // console.log("setSize("+(this.props?.data as any).name+") thisss", this);
        if (!size0) return false;
        let size = size0 as Partial<EPSize>;
        let view = this.get_view(c);
        let testmode: boolean = false;
        if (c.data.className === DEdgePoint.cname && size.currentCoordType !== CoordinateMode.absolute) size = (this as any as LEdgePoint).encodePosCoords(c as any, size, view);

        if (view.updateSize(c.data.id, size)) return true;
        BEGIN()
        if (size.x !== c.data.x && size.x !== undefined) SetFieldAction.new(c.data.id, "x", size.x, undefined, false);
        if (size.y !== c.data.y && size.y !== undefined) SetFieldAction.new(c.data.id, "y", size.y, undefined, false);
        if (size.w !== c.data.w && size.w !== undefined) SetFieldAction.new(c.data.id, "w", size.w, undefined, false);
        if (size.h !== c.data.h && size.h !== undefined) SetFieldAction.new(c.data.id, "h", size.h, undefined, false);
        let epdata: DEdgePoint = c.data as DEdgePoint;
        if (size.currentCoordType !== epdata.currentCoordType && size.currentCoordType !== undefined) SetFieldAction.new(epdata.id, "currentCoordType", size.currentCoordType, undefined, false);
        END()
        return true; }

    get_html(c: Context): this["html"] {
        let component = this.get_component(c);
        let html = component.html.current;
        if (html) return html;
        html = $('[nodeid="' + c.data.id + '"]')[0];
        if (!html) return undefined;
        (component.html as any).current = html;
        return html;
    }
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


    /* how z-index work, it's really messy.
    * cannot move html position. node id depends on it, and a node moving position would need to change id.
    * so i use css order.
    * first order is assigned through node constructor called by parent component injectProps, according to his last index in html.
    * now z-index is set in node and updated properly.
    * z-index is passed to a prop, rendered as html attribute.
    * css takes the attribute value and uses it in "order" css rule.
    * problem: updating node.z doesn't trigger the parent injectprops, so he inject html index and
    * the outernmost html root cannot update his attribute without refreshing the parent and recalling injectprops
    * fixed: by updating it directly in GraphElement.render()
    * */
    get_zIndex(context: Context): this["zIndex"] { return (+context.data.zIndex || 0); }
    set_zIndex(val: this["zIndex"], context: Context): boolean {
        SetFieldAction.new(context.data.id, "zIndex", +val ?? 0, undefined, false);
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

    nodes!:LVoidVertex[];
    __type_of__nodes:Info = {type:'LVertex[]', txt: "all direct sub-nodes. not including deep subelements (subelements of subelements)"};
    get_nodes(c: Context): this['nodes'] { return this.get_subElements(c).filter(c => c && c.className.indexOf('Vertex') >= 0) as any; }
    set_nodes(val: never, c: Context): boolean { return this.cannotSet('nodes'); }
    edges!:LVoidVertex[];
    __type_of__edges:Info = {type:'LEdge[]', txt: "all direct sub-edges. not including deep subelements (subelements of subelements)"};
    get_edges(c: Context): this['edges'] { return this.get_subElements(c).filter(c => c && c.className.indexOf('Edge') >= 0) as any; }
    set_edges(val: never, c: Context): boolean { return this.cannotSet('edges'); }
    graphs!:LVoidVertex[];
    __type_of__graphs:Info = {type:'LGraph[]', txt: "all direct sub-graphs. not including deep subelements (subelements of subelements)"};
    get_graphs(c: Context): this['graphs'] { return this.get_subElements(c).filter(c => c && c.className.indexOf('Graph') >= 0) as any; }
    set_graphs(val: never, c: Context): boolean { return this.cannotSet('graphs'); }

    allSubNodes!: LVoidVertex[];
    __type_of__allSubNodes:Info = {type:'LVertex[]', txt: "all deep sub-nodes. including subelements of subelements."};
    get_allSubNodes(c: Context): this['allSubNodes'] { return this.get_allSubElements(c).filter(c => c && c.className.indexOf('Vertex') >= 0) as any; }
    set_allSubNodes(val: never, c: Context): boolean { return this.cannotSet('allSubNodes'); }
    allSubEdges!: LVoidEdge[];
    __type_of__allSubEdges:Info = {type:'LEdge[]', txt: "all deep sub-edges. including subelements of subelements."};
    get_allSubEdges(c: Context): this['allSubEdges'] { return this.get_allSubElements(c).filter(c => c && c.className.indexOf('Edge') >= 0) as any; }
    set_allSubEdges(val: never, c: Context): boolean { return this.cannotSet('allSubEdges'); }
    allSubGraphs!: (LGraph | LGraphVertex)[];
    __type_of__allSubGraphs:Info = {type:'LGraph[]', txt: "all deep sub-graphs. including subelements of subelements."};
    get_allSubGraphs(c: Context): this['allSubGraphs'] { return this.get_allSubElements(c).filter(c => c && c.className.indexOf('Graph') >= 0) as any; }
    set_allSubGraphs(val: never, c: Context): boolean { return this.cannotSet('allSubGraphs'); }

    subElements!: LGraphElement[]; // shallow, direct subelements
    __info_of__subElements: Info = {type: 'LGraphElement[]',
        txt: "all direct subelements (nodes, edges, edgepoints, subgraphs...). not including deep subelements (subelements of subelements)"}
    get_subElements(context: Context): this["subElements"] {
        return LPointerTargetable.fromArr([...new Set(context.data.subElements)]);
    }
    set_subElements(val: PackArr<this["subElements"]>, context: LogicContext<DGraphElement>): boolean {
        console.log("isDeepStrictEqual", {isDeepStrictEqual});
        Log.eDev([...new Set(val)].length !== val.length, "subelemnts setter have duplicates", {val, context});
        // if (isDeepStrictEqual(context.data.subElements, val)) return true;
        let pointers: Pointer<DGraphElement, 0, 'N', LGraphElement> = Pointers.from(val) || [];
        if (Uarr.equals(pointers, context.data.subElements, false)) return true;
        SetFieldAction.new(context.data, 'subElements', pointers, '', true);
        const idlookup = store.getState().idlookup;
        let arrdiff = U.arrayDifference(context.data.subElements, pointers);
        // old subelements
        for (let oldsubelementid of arrdiff.removed) {
            let subelement: DGraphElement = (oldsubelementid && idlookup[oldsubelementid]) as DGraphElement;
            if (subelement.father !== context.data.id) continue;
            LPointerTargetable.from(subelement).father = null as any; // todo: can this happen? è transitorio o causa vertici senza parent permanenti?
        }
        // new subelements
        for (let newsubelementid of arrdiff.added) {
            let subelement: DGraphElement = (newsubelementid && idlookup[newsubelementid]) as DGraphElement;
            if (subelement.father === context.data.id) continue;
            LPointerTargetable.from(subelement).father = context.data.id as any; // trigger side-action
        }
        return true;
    }

    allSubElements!: LGraphElement[]; // deep, nested subelements
    __info_of__allSubElements: Info = {type: 'LGraphElement[]',
        txt: "all deep subelements (nodes, edges, edgepoints, subgraphs...). including subelements of subelements."}
    private get_allSubElements(context: Context, state?: DState): this["allSubElements"] {
        // return context.data.packages.map(p => LPointerTargetable.from(p));
        state = state || store.getState();
        let tocheck: Pointer<DGraphElement>[] = context.data.subElements || [];
        let checked: Dictionary<Pointer, true> = {};
        let dblcheck: Dictionary<Pointer, Pointer> = {}; // <child, parent>  // debug only
        for (let e of tocheck) dblcheck[e] = context.data.id; // debug only
        checked[context.data.id] = true;//nb6[]{}&
        while (tocheck.length) {
            let newtocheck: Pointer<DGraphElement>[] = [];
            for (let ptr of tocheck) {
                Log.eDev(checked[ptr], "loop in GraphElements containing themselves", {dblcheck, context, ptr, checked, fistContainer:dblcheck[ptr]});
                if (checked[ptr]) continue;
                checked[ptr] = true;
                let subnode: DGraphElement = DPointerTargetable.from(ptr, state);
                let se = subnode?.subElements;
                //for (let e of se) dblcheck[e] = ptr; // debug only
                U.arrayMergeInPlace(newtocheck, se);
            }
            tocheck = newtocheck;
        }
        delete checked[context.data.id];
        return LPointerTargetable.from(Object.keys(checked), state);
    }
    set_allSubElements(val: never, c: Context): boolean { return this.cannotSet('allSubElements'); }

    get_isResized(context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] { return context.data.isResized; }
    set_isResized(val: DVoidVertex["isResized"], context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] {
        return SetFieldAction.new(context.data.id, "isResized", val);
    }

    get_model(context: Context): this["model"] {
        const modelElementId = context.data.model; //$('[id="' + context.data.id + '"]')[0].dataset.dataid;
        const lModelElement: LModelElement = LPointerTargetable.from(modelElementId as string);
        return lModelElement;
    }

    assignEdgeAnchor!: ((anchorName?: string)=>void);
    __info_of__assignEdgeAnchor!: {hidden:true, type:"(anchorName?: string)=>void", txt: "Assign a specific anchor of this node to the edge currently following the cursor, if any."};
    get_assignEdgeAnchor(c: Context): ((anchorName?: string)=>void) {
        return (anchorName?: string)=>{
            if (anchorName && !c.data.anchors[anchorName]) anchorName = undefined;
            if (LVoidEdge.startFollow) {
                let de: DEdge = DPointerTargetable.fromPointer(LVoidEdge.startFollow);
                if (de.start !== c.data.id) return; // cannot change edge targets, only an anchor within the current targets
                let le: LVoidEdge = LPointerTargetable.fromD(de);
                le.anchorStart = anchorName;
                le.startFollow = false;

            }
            if (LVoidEdge.endFollow) {
                let de = DPointerTargetable.fromPointer(LVoidEdge.endFollow);
                if (de.end !== c.data.id) return; // cannot change edge targets, only an anchor within the current targets
                let le = LPointerTargetable.fromD(de);
                le.anchorEnd = anchorName;
                le.endFollow = false;
            }
        }
    }
    get_events(c: Context): LViewElement["events"] {
        const tn = transientProperties.node[c.data.id];
        let mainview: DViewElement = tn.mainView.__raw;
        let otherViews: DViewElement[] = tn.stackViews.map(v=>v.__raw);
        let allviews: DViewElement[] = [mainview, ...otherViews].reverse();
        const keep_for_closure_original_funcs: LViewElement["events"] = {};
        const ret: LViewElement["events"] = {};
        for (let dv of allviews) U.objectMergeInPlace(keep_for_closure_original_funcs, transientProperties.view[dv.id].events);

        const lastContext: GObject = tn.viewScores[mainview.id].evalContext;
        const keys = Object.keys(keep_for_closure_original_funcs);
        // for (let k of keys) ret['_raw_'+k] = keep_for_closure_original_funcs[k];
        for (let k of keys) {
            if (!keep_for_closure_original_funcs[k]) continue;
            ret[k] = (..._params: any) => keep_for_closure_original_funcs[k](lastContext, ..._params);
        }

        return ret; }


    get_father(context: Context): this["father"] { return LPointerTargetable.fromPointer(context.data.father); }
    set_father(val: Pack1<this["father"]>, context: Context): boolean {
        let ptr: DGraphElement["father"] = Pointers.from(val) as any;
        SetFieldAction.new(context.data, 'father', ptr, undefined, true);
        if (ptr) SetFieldAction.new(ptr as any, 'subElements+=', context.data.id);
        return true; }

    __info_of__isselected: Info = {type: "Dictionary<Pointer<User>, true>",
        txt:<div>A map that contains all the users selecting this element as keys, and always true as a value (if present).
            <br/>Edit it through node.select() and node.deselect()</div>}
    __info_of__select: Info = {type:"function(forUser?:Pointer<User>):void", txt:"Marks this node as selected by argument user."};
    __info_of__deselect: Info = {type:"function(forUser?:Pointer<User>):void", txt:"Un-marks this node as selected by argument user."};
    __info_of__toggleSelect: Info = {type:"function(usr?:Pointer<User>):void", txt:"Calls this.select(usr) if the node is selected by argument user, this.deselect(usr) otherwise. If omitted, argument \"usr\" is the current user id.<br>Returns the result of this.isSelected() after the toggle."};
    __info_of__isSelected: Info = {type:"function(forUser?:Pointer<User>):void", txt:"Tells if this node is selected by argument user."};
    select(forUser?: Pointer<DUser>): void { return this.wrongAccessMessage("node.select()"); }
    deselect(forUser?: Pointer<DUser>): void { return this.wrongAccessMessage("node.deselect()"); }
    toggleSelected(forUser?: Pointer<DUser>): void { return this.wrongAccessMessage("node.toggleSelected()"); }
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    get_select(c: Context): (forUser?: Pointer<DUser>)=>void {
        return (forUser?: Pointer<DUser>)=> {
            if (!forUser) forUser = DUser.current;
            if (c.data.isSelected[forUser]) return; // no-op
            let map = {...c.data.isSelected};
            map[forUser] = true;
            SetFieldAction.new(c.data.id, "isSelected", map, undefined, false);
            // todo: actually they are pointer to users, but i'm assuming users are not erased at runtime. on deselect too
        }
    }
    get_deselect(c: Context): (forUser?: Pointer<DUser>)=>void {
        return (forUser?: Pointer<DUser>)=> {
            if (!forUser) forUser = DUser.current;
            if (!c.data.isSelected[forUser]) return; // no-op
            let map = {...c.data.isSelected};
            delete map[forUser];
            SetFieldAction.new(c.data.id, "isSelected", map, undefined, false);
            // todo: actually they are pointer to users, but i'm assuming users are not erased at runtime. on deselect too
        }
    }
    get_toggleSelected(context: Context): ((forUser?: Pointer<DUser>) => boolean) {
        return (forUser?: Pointer<DUser>): boolean => {
            if (!forUser) forUser = DUser.current;
            if (this.get_isSelected(context)(forUser)) {
                this.get_deselect(context)(forUser);
                return false;
            } else {
                this.get_select(context)(forUser);
                return true;
            }
        }
    }
    get_isSelected(context: Context): ((forUser?: Pointer<DUser>) => boolean) {
        return (forUser?: Pointer<DUser>): boolean => {
            if (!forUser) forUser = DUser.current;
            return !!context.data.isSelected[forUser]; }
    }
    set_isSelected(val: this["isSelected"], context: Context): boolean {
        return this.cannotSet("graphElement.isSelected(): use this.select() or this.deselect() instead.");
    }
    /*
    get_isSelected(context: LogicContext<DVoidVertex>): GObject {
        return DPointerTargetable.mapWrap(context.data.isSelected, context.data, 'idlookup.' + context.data.id + '.isSelected', []);
    }*/



    // for edges
    public get_startPoint(c: Context|undefined, size?: GraphSize, view?: LViewElement): GraphPoint { return this.get_startEndPoint(c, size, view, true); }
    public get_endPoint(c: Context|undefined, size?: GraphSize, view?: LViewElement): GraphPoint { return this.get_startEndPoint(c, size, view, false); }
    private get_startEndPoint(c: Context|undefined, size?: GraphSize, view?: LViewElement, isStart:boolean=true): GraphPoint {
        if (!size) {
            if (c) size = this.get_size(c) as any; else size = Log.exDevv("invalid arguments in get_startEndPoint", {arguments});
        }
        if (!view) {
            // if (c) view = this.get_view(c); else view = Log.exDevv("invalid arguments in get_startPoint", {arguments});
            view = c && this.get_view(c) || Log.exDevv("invalid arguments in get_startEndPoint", {arguments});
        }
        let offset: GraphPoint = (view as LViewElement)[isStart ? "edgeStartOffset" : "edgeEndOffset"];
        let isPercentage: boolean = (view as LViewElement)[isStart ? "edgeStartOffset_isPercentage" : "edgeEndOffset_isPercentage"];
        if (!size) size = new GraphSize(0, 0, 0, 0);
        if (isPercentage) offset = new GraphPoint(offset.x/100*(size.w), offset.y/100*(size.h));
        return size.tl().add(offset, false);
    }

}
RuntimeAccessibleClass.set_extend(DPointerTargetable, DGraphElement);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LGraphElement)


@RuntimeAccessible('DGraph')
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
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;

    state!: GObject;
    // personal attributes
    zoom!: GraphPoint;
    offset!: GraphPoint; // in-graph scrolling offset

    public static new(htmlindex: number, model: DGraph["model"],
                      parentNodeID?: DGraphElement["father"], // immediate parent
                      parentgraphID?: DGraphElement["graph"], // graph containing this subgraph (redudant? could get it from father chain)
                      nodeID?: DGraphElement["id"] // this id
    ): DGraph {
        return new Constructors(new DGraph('dwc'), parentNodeID, true, undefined, nodeID || Constructors.DGraph_makeID(model))
            .DPointerTargetable()
            .DGraphElement(model, parentgraphID, htmlindex).DGraph().end();
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
        return out.$matched;
        // throw new Error("Method not implemented.");
    }

}
var nosize: GraphSize = {x:0, y:0, w:0, h:0, nosize:true} as any;
var defaultEdgePointSize: GraphSize = undefined as any; // = {x:0, y:0, w:5, h:5};
var defaultVertexSize: GraphSize = undefined as any; // {x:0, y:0, w:140.6818084716797, h:32.52840805053711};


@RuntimeAccessible('LGraph')
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
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    // containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    _state!: GObject<"proxified">; // LMap;
    // personal attributes
    zoom!: GraphPoint;
    graphSize!: GraphSize; // derived attribute: bounding rect containing all subnodes, while "size" is instead external size of the vertex holding the graph in GraphVertexes
    offset!: GraphPoint; // Scrolling position inside the graph

    // get_graphSize(context: LogicContext<DGraph>):  Readonly<GraphSize> { return todo: get bounding rect containing all subnodes.; }
    get_offset(context: LogicContext<DGraph>):  Readonly<GraphSize> {
        let offset: Partial<GraphSize> = (context.data.offset || new GraphSize()) as any;
        return new GraphSize(offset.x, offset.y, offset.w, offset.h);
    }
    set_offset(val: Partial<GraphSize>, context: Context): boolean {
        if (!val) val = {x:0, y:0, w:0, h:0};
        //if (val.x === undefined && val.y === undefined && val.w === undefined && val.h === undefined) return true;
        let offset: Partial<GraphSize> = (context.data.offset || new GraphSize()) as any
        if (val.x === undefined && offset.x !== val.x) val.x = offset.x;
        if (val.y === undefined && offset.y !== val.y) val.y = offset.y;
        if (val.w === undefined && offset.w !== val.w) val.w = offset.w;
        if (val.h === undefined && offset.h !== val.h) val.h = offset.h;
        if (offset.x === val.x && offset.y === val.y && offset.w === val.w && offset.h == val.h) return true;
        SetFieldAction.new(context.data, "offset", val as any);
        return true;
    }

    public cumulativeZoom!: GraphPoint;
    public __info_of__cumulativeZoom: Info = {type: GraphPoint.cname, txt: "the product of all the ownZoom of containing ancestor graphs."};
    private get_cumulativeZoom(c:Context): this['cumulativeZoom']{
        let ancestors = [c.proxyObject, ...this.get_graphAncestors(c)];
        let zoom: GraphPoint = new GraphPoint(1,1);
        for (let g of ancestors) zoom.multiply(g.ownZoom, false);
        return zoom;
    }

    get_zoom(c: Context): GraphPoint {
        return this.get_cumulativeZoom(c);
    }
    public ownZoom!: GraphPoint;
    __info_of__ownZoom: Info = {type:GraphPoint.cname, label:"zoom", txt:"The individual zoom applied to this graph."};
    __info_of__zoom: Info = {type:GraphPoint.cname, label:"zoom", txt:"Scales the graph and all subelements by a factor."};
    get_ownZoom(context: Context): GraphPoint {
        const zoom: GraphPoint = context.data.zoom;
        let ret = new GraphPoint(zoom.x||1, zoom.y||1); // NB: do not use (??1), zero is not a valid value for zoom.
        // (zoom as any).debug = {rawgraph: context.data.__raw, zoomx: context.data.zoom.x, zoomy: context.data.zoom.y}
        return ret; }
    set_zoom(val: Partial<GraphPoint>, c: Context): boolean{
        if (!val) val = {x:1, y:1};
        //if (val.x === undefined && val.y === undefined) return true;
        let zoom: Partial<GraphSize> = (c.data.zoom || new GraphSize()) as any;
        if (!val.x) val.x = zoom.x; // remember zero is not allowed value
        if (!val.y) val.y = zoom.y;
        if (zoom.x === val.x && zoom.y === val.y) return true;
        SetFieldAction.new(c.data, 'zoom', val as any, '+=', false);
        return true;
    }

    toGraphSize(...a:Parameters<this["coord"]>): ReturnType<this["coord"]>{ return this.wrongAccessMessage("toGraphSize"); }
    coord(htmlSize: Size): GraphSize { return this.wrongAccessMessage("toGraphSize"); }
    get_coord(context: Context): (htmlSize: Size) => GraphSize {
        return (htmlSize: Size)=> {
            let graphHtmlSize: Size = this.get_htmlSize(context);
            let zoom: GraphPoint = this.get_zoom(context);
            return new GraphSize(
                (htmlSize.x - graphHtmlSize.x) / zoom.x,
                (htmlSize.y - graphHtmlSize.y) / zoom.y,
                htmlSize.w/zoom.x,
                htmlSize.h/zoom.y);
        }
    }
    // get_htmlSize(context: Context): Size { }
    translateSize<T extends GraphSize|GraphPoint>(ret: T, innerGraph: LGraph): T { return this.wrongAccessMessage("translateSize()"); }
    translateHtmlSize<T extends Size|Point, G = T extends Size ? GraphSize : GraphPoint>(size: T): G { return this.wrongAccessMessage("translateHtmlSize()"); }

    __info_of__offset: Info = {type:GraphPoint.cname, label:"offset", txt:"In-graph scrolling position."};
    __info_of__graphSize: Info = {type:GraphSize.cname, label:"graphSize", txt:"size internal to the graph, including internal scroll and panning."};
    __info_of__translateSize: Info = {type:"(T, Graph)=>T where T is GraphSize | GraphPoint", txt:"Translates a coordinate set from the local coordinates of a SubGraph to this Graph containing it."};
    __info_of__translateHtmlSize: Info = {type:"(Size|Point) => GraphSize|GraphPoint", txt:'Translate page\'s viewport coordinate set to this graph coordinate set.'};
    get_translateHtmlSize<T extends Size|Point, G = T extends Size ? GraphSize : GraphPoint>(c: Context): ((size: T) => G) {
        return (size: T): G => {
            let rootGraph: LGraph = this.get_root(c);
            if (rootGraph.id === c.data.id) return this.get_translateHtmlSize_fromRoot<T, G>(c)(size);
            let fakeRootSize = rootGraph.translateHtmlSize_fromRoot<T, G>(size) as any as ISize;
            let screenOffset = this.get_screenOffset(c);//cumulative (g.size.tl()-offset.tl()*cumulativezoom)

            // distance from the origin of the subgraph in rendered pixels
            let ret = new GraphSize(fakeRootSize.x - screenOffset.x, fakeRootSize.y - screenOffset.y, fakeRootSize.w, fakeRootSize.h);
            return ret.divide(this.get_cumulativeZoom(c) as any, false) as any;

            /*
            // fake because it assumes all subgraphs have the same zoom level of current graph.
            let ancestors = this.get_graphAncestors(c).reverse().slice(1);
            let cumulativeZoom: GraphPoint = new GraphPoint(1, 1); // = this.get_ownZoom(c);
            for (let g of ancestors){
                let offset = g.offset;
                let ownZoom = g.ownZoom;
                cumulativeZoom.multiply(ownZoom);
                // let a, b, c be graphs
                // size is =  a.zoom + a.offset

            }
            */
        }
    }
    screenOffset!: GraphPoint;
    __info_of__screenOffset: Info = {type: GraphPoint.cname, txt:"Distance of the subgraph origin in rendered pixels. to the top-left of graph container."}
    private get_screenOffset(c: Context): GraphPoint{
        let ancestors = [c.proxyObject, ...this.get_graphAncestors(c)].reverse();
        let ret = new GraphPoint(0, 0);
        let cumulativeZoom: GraphPoint = new GraphPoint(1, 1); // = this.get_ownZoom(c);
        for (let g of ancestors){
            let offset = g.offset;
            let ownZoom = g.ownZoom;
            let size = g.size;
            ret
                .add(size.tl().multiply(cumulativeZoom, false), false)
                .subtract(offset, false);
            cumulativeZoom.multiply(ownZoom);
            ret
                .multiply(cumulativeZoom, false);
        }
        return ret;
    }

    private translateHtmlSize_fromRoot<T extends Size|Point, G = T extends Size ? GraphSize : GraphPoint>(size: T):G {
        return this.wrongAccessMessage('translateHtmlSize_fromRoot');
    }

    /**
     *  IMPORTANT!
     *  this is a wrong partial result, do not call this function directly outside translateHtmlSize.
     *  this is outercoord without zoom, needs ti be translated to container graph coords & de-apply zoom
     */
    private get_translateHtmlSize_fromRoot<T extends Size|Point, G = T extends Size ? GraphSize : GraphPoint>(c: Context): ((size: T) => G) {
        return (size: T): G => {
            let graphHtmlSize = this.get_htmlSize(c);
            let a = size.subtract(graphHtmlSize.tl(), true);
            let offset = {x:c.data.offset.x, y:c.data.offset.y};
            let b = a.subtract(offset, true);
            let r = b.divide(c.data.zoom as any, false) as any as G;
            return r;
        }
    }

    // graph_of_size, the size parameter have coordinates based on this graph.
    get_translateSize<T extends GraphSize|GraphPoint>(c: Context): ((size: T, graph_of_size: LGraph) => T) {
        return (size: T, graph_of_size: LGraph): T => {
            let targetGraph: LGraph = c.proxyObject;
            let currGraph: LGraph = graph_of_size;
            if (currGraph.id === c.data.id) return size;
            let currAncestors: LGraph[] = [currGraph, ...currGraph.graphAncestors];
            let targetAncestors: LGraph[] = [targetGraph, ...targetGraph.graphAncestors];
            let currAncestorsPtr: Pointer<DGraph>[] = currAncestors.map(l=>l.id).reverse();
            let targetAncestorsPtr: Pointer<DGraph>[] = targetAncestors.map(l=>l.id).reverse();
            Log.ex(targetAncestorsPtr[0] !== currAncestorsPtr[0],
                'translateSize() The root graph of 2 elements should always be the same, are you comparing nodes from different graphs?',
                {currGraph, targetGraph});
            let i: number = 1;
            while (currAncestorsPtr[i] === targetAncestorsPtr[i]) { i++; }
            let commonAncestor: Pointer<DGraph> = targetAncestorsPtr[i-1];
            currAncestors = currAncestors.slice(0, currAncestors.length - i).filter(e=>!!e);
            targetAncestors = targetAncestors.slice(0, currAncestors.length - i).filter(e=>!!e);
            // d, c, b, a           currAncestors
            // d, c, x, y           targetAncestors
            // undo a,b, redo x,y        i = [2]

            Log.exDev(!currAncestors.length && !targetAncestors.length, "translateSize() found invalid intersection in container graphs",
                {currGraph, targetGraph, currAncestors, targetAncestors});
            // @ts-ignore
            let ret: T = 'w' in size ? new GraphSize(size.x, size.y, size.w, size.h) : new GraphPoint(size.x, size.y, size.w, size.h);
            console.log("translateSizee pre", (this.get_model(c) as any).name, size.x, size.y, {size, ret, currAncestors, targetAncestors} )
            for (let g of currAncestors){
                ret.subtract(g.offset, false);
                ret.divide(g.cumulativeZoom, false);
                ret.add(g.size.tl(), false);
            }
            for (let g of targetAncestors){
                ret.subtract(g.size.tl(), false);
                ret.multiply(g.cumulativeZoom, false);
                ret.add(g.offset, false);
            }
            console.log("translateSizee ret", (this.get_model(c) as any).name, size.x, size.y, {size, ret, currAncestors, targetAncestors} )

            return ret; }
        //todo: check how many passes you need to go down or up, and make the up version too

    }
    get_translateSize_down_old<T extends GraphSize|GraphPoint>(c: Context): ((size: T, innerGraph: LGraph) => T) {
        return (size: T, graph_of_size: LGraph): T => {
            graph_of_size = LPointerTargetable.wrap(graph_of_size) as LGraph;
            let ret: T = (size.hasOwnProperty("w") ? new GraphSize(size.x, size.y, (size as GraphSize).w, (size as GraphSize).h) : new GraphPoint(size.x, size.y)) as T;
            Log.ex(!graph_of_size, "translateSize() graph parameter is invalid: "+graph_of_size, graph_of_size, c);
            let ancestors: LGraph[] = [graph_of_size, ...graph_of_size.graphAncestors];
            console.log("translateSize", {innerGraph: graph_of_size, ret, ancestors, c});
            Log.ex(ancestors.indexOf(c.proxyObject) !== -1, "translateSize() graph parameter is invalid: it must be a graph containing the current one.", graph_of_size, c);
            for (let g of ancestors) ret.add(g.size.tl(), false);
            // for (let g of ancestors) ret.subtract(g.offset, false);
            // console.log("translateSize", {c, thiss:c.proxyObject, ancestors, ancestorSizes: ancestors.map(a=> a.size.tl()), size, ret});
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


@RuntimeAccessible('DVoidVertex')
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
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state!: GObject;
    zoom!: GraphPoint;
    // personal attributes
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    isResized!: boolean;
    // size?: GraphSize; // virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize

    public static new(htmlindex: number, model: DGraphElement["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"],
                      size?: InitialVertexSize): DVoidVertex {
        return new Constructors(new DVoidVertex('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID, htmlindex)
            .DVoidVertex(size || defaultVertexSize).end();
    }

}

@RuntimeAccessible('LVoidVertex')
export class LVoidVertex<Context extends LogicContext<DVoidVertex> = any, C extends Context = Context> extends LGraphElement {// <D extends DVoidVertex = any>
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
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    // containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    _state!: GObject<"proxified">; // LMap;
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



}

RuntimeAccessibleClass.set_extend(DGraphElement, DVoidVertex);
RuntimeAccessibleClass.set_extend(LGraphElement, LVoidVertex);
@RuntimeAccessible('DEdgePoint')
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
    model!: Pointer<DModelElement, 0, 1, LModelElement>; // todo: if null gets model from this.father (edge)?
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    zoom!: GraphPoint;
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    size?: GraphSize; //／／ virtual, gets extracted from this. x and y are stored directly here as it extends GraphSize
    // personal attributes
    __isDEdgePoint!: true;
    currentCoordType?: CoordinateMode;

    public static new(htmlindex: number, model: DEdgePoint["model"] | undefined, parentNodeID: DEdgePoint["father"], graphID?: DEdgePoint["graph"], nodeID?: DGraphElement["id"],
                      size?: InitialVertexSize): DEdgePoint {
        return new Constructors(new DEdgePoint('dwc'), parentNodeID, true, undefined, nodeID)
            .DGraphElement(undefined, graphID, htmlindex)
            .DVoidVertex(size || defaultEdgePointSize).DEdgePoint().end();
    }

}

@RuntimeAccessible('LEdgePoint')
export class LEdgePoint<Context extends LogicContext<DEdgePoint> = any, C extends Context = Context> extends LVoidVertex {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LEdgePoint;
    // static logic: typeof LEdgePoint;
    // static structure: typeof DEdgePoint;

    // inherit redefine
    father!: LVoidEdge;
    // __raw!: DEdgePoint;
    id!: Pointer<DEdgePoint, 1, 1, LEdgePoint>;
    graph!: LGraph;
    model?: LModelElement;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
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
    edge!: LVoidEdge; // returns container edge
    __info_of__edge: Info = {type:"?LEdge", txt:"returns the containing edge if called on an EdgePoint, \"this\" if called on an edge, undefined otherwise."}

    public get_edge(c: Context): LVoidEdge { return c.proxyObject.father; }
    public set_edge(v: Pack1<LVoidEdge>, c: Context): boolean { return this.set_father(v as any, c); }




    static decodeCoords<T extends Partial<EPSize>>(size0: T, sp:GraphPoint, ep: GraphPoint): T/*absolute*/{
        let size: any = size0;
        let ret: any = (("w" in size || "h" in size) ? new GraphSize() : new GraphPoint()); // GObject<Partial<GraphSize>>;
        switch (size.currentCoordType) {
            default: return Log.exDevv("translatePosCoords() invalid coordinate mode", {mode:size.currentCoordType});
            // case CoordinateMode.absolute: return size;
            case CoordinateMode.absolute: case undefined: case null:
                if (size.x !== undefined) ret.x = size.x;
                if (size.y !== undefined) ret.y = size.y;
                break;
            case CoordinateMode.relativePercent:
                //maybe do: dampening factor on relative % offset? is it possible?
                // let s = this.getBasicSize(c);
                // MATH:
                // size.x = sp.x*x% + ep.x*(1-x%)
                // size.x = sp.x*x% + ep.x - ep.x*x%
                // size.x - ep.x= (sp.x - ep.x)*x%
                // (size.x - ep.x) / (sp.x - ep.x) = x% // actually i inverted <sp, ep> in first equation, so reverse them in result too.
                if (size.x !== undefined) ret.x = (1 - size.x) * sp.x + (size.x) * ep.x;
                if (size.y !== undefined) ret.y = (1 - size.y) * sp.y + (size.y) * ep.y;
                break;
            case CoordinateMode.relativeOffset:
            case CoordinateMode.relativeOffsetStart:
            case CoordinateMode.relativeOffsetEnd:
                let useStart: boolean;
                let useEnd: boolean;
                switch (size.currentCoordType) {
                    default:
                    case CoordinateMode.relativeOffset: useStart = true; useEnd = true; break;
                    case CoordinateMode.relativeOffsetStart: useStart = true; useEnd = false; break;
                    case CoordinateMode.relativeOffsetEnd: useStart = false; useEnd = true; break;
                }
                // offset = sp - size
                // size = offset - sp
                // in reverse: actualsize = offset, size=offset

                // if coords are already in absolute mode.
                let xIsAbsolute: number | undefined = (size.x&&!Array.isArray(size.x)) ? size.x : undefined;
                let yIsAbsolute: number | undefined = (size.x&&!Array.isArray(size.x)) ? size.x : undefined;
                Log.w(!!(xIsAbsolute || yIsAbsolute), "decoding relative offset require an array size coordinate system. x=[x1, x2] --> x", {size});

                let offsetsp = useStart ? new GraphPoint(xIsAbsolute || size.x[0] + sp.x, yIsAbsolute || size.y[0] + sp.y) : new GraphPoint();
                let offsetep = useEnd ? new GraphPoint(xIsAbsolute || size.x[1] + ep.x, yIsAbsolute || size.y[1] + ep.y) : new GraphPoint();
                // if the start and endpoint of the edge didn't move, offsetsp = offsetep.
                // if they moved, those 2 are discordant --> i pick middle
                offsetsp.add(offsetep, false);
                if (useStart && useEnd) offsetsp.divide(2, false);
                if (!xIsAbsolute && size.x !== undefined) ret.x = offsetsp.x;
                if (!yIsAbsolute && size.y !== undefined) ret.y = offsetsp.y;
                if (xIsAbsolute) {
                    ret.x = size.x;
                }
                if (yIsAbsolute) {
                    ret.y = size.y;
                }
                break;
        }
        if (size.x === undefined) delete ret.x;
        if (size.y === undefined) delete ret.y;
        if ((size as any).w === undefined) delete ret.w; else ret.w = size.w;
        if ((size as any).h === undefined) delete ret.h; else ret.h = size.h;
        ret.currentCoordType = CoordinateMode.absolute;
        // console.log("decode coords", {size, sp, ep, ret});
        return ret;
    }
    // from x,y as coords, to x%,y% as % of ((1-val)%*startpt) + ((val)%*endpt)
    public decodePosCoords<T extends Partial<GraphSize> | Partial<GraphPoint>>(c: Context, size: T&any, view: LViewElement, sp0?: GraphPoint, ep0?: GraphPoint): T {
        let le: LVoidEdge = c&&c.proxyObject.father;
        // console.log("decodepos:", {le, sp0, lesp:le?.startPoint});
        let sp: GraphPoint = sp0||le.startPoint;
        let ep: GraphPoint = ep0||le.endPoint;
        return LEdgePoint.decodeCoords(size, sp, ep);
    }

    static testCoords(range: number = 30){
        outer: for (let mode of ["absolute", "relative%", "relativeOffset", "relativeOffsetStart", "relativeOffsetEnd"])
            for (let i = -range; i < range; i++)
                for (let j = -range; j < range; j++){
                    var s0 = {x:i, y:j};
                    var sp = {x:10, y:10};
                    var ep = {x:10, y:-10};
                    // @ts-ignore
                    var s1 = LEdgePoint.encodeCoords(s0, mode, sp, ep)
                    // @ts-ignore
                    var s00 = LEdgePoint.decodeCoords(s1, sp, ep);
                    // @ts-ignore
                    var error = Object.keys(s0).map( k=> s0[k].toFixed(3) === s00[k].toFixed(3) ? '' : k).join('');
                    (mode != "relative%" && error ? console.error : console.log)({diff:[s00.x-s0.x, s00.y-s0.y].join(), i, j, mode, s1:[s1.x, s1.y].join(), s0, s00, error});
                    if (mode != "relative%" && error ) break outer;
                }
    }
    // @ts-ignore a

    static encodeCoords<T extends Partial<EPSize>>(size0: T, edgePointCoordMode: CoordinateMode, sp:GraphPoint, ep: GraphPoint): T/*absolute*/{
        let size: T = size0 as any;
        if (edgePointCoordMode === size.currentCoordType ||
            !size.currentCoordType && edgePointCoordMode === CoordinateMode.absolute) return size;
        if (size.currentCoordType && size.currentCoordType !== CoordinateMode.absolute) size = LEdgePoint.decodeCoords(size, sp, ep);

        let ret: any = (("w" in size || "h" in size) ? new GraphSize() : new GraphPoint()); // GObject<Partial<GraphSize>>;
        switch (edgePointCoordMode) {
            default: return Log.exDevv("translatePosCoords() invalid coordinate mode", {mode:edgePointCoordMode});
            // case CoordinateMode.absolute: return size;
            case CoordinateMode.relativePercent:
                // let s = this.getBasicSize(c);
                // MATH:
                // size.x = sp.x*x% + ep.x*(1-x%)
                // size.x = sp.x*x% + ep.x - ep.x*x%
                // size.x - ep.x= (sp.x - ep.x)*x%
                // (size.x - ep.x) / (sp.x - ep.x) = x% // actually i inverted <sp, ep> in first equation, so reverse them in result too.

                if (sp.x === ep.x) ret.x = 0.5; // because otherwise it is infinity. so i force him to return in line.
                else if (size.x !== undefined) ret.x = (size.x - sp.x) / (ep.x - sp.x);
                if (sp.y === ep.y) ret.y = 0.5;
                else if (size.y !== undefined) ret.y = (size.y - sp.y) / (ep.y - sp.y);
                break;
            case CoordinateMode.relativeOffset:
            case CoordinateMode.relativeOffsetStart:
            case CoordinateMode.relativeOffsetEnd:
                let useStart: boolean;
                let useEnd: boolean;
                switch (edgePointCoordMode) {
                    default:
                    case CoordinateMode.relativeOffset: useStart = true; useEnd = true; break;
                    case CoordinateMode.relativeOffsetStart: useStart = true; useEnd = false; break;
                    case CoordinateMode.relativeOffsetEnd: useStart = false; useEnd = true; break;
                }
                if (size.x) ret.x = [useStart ? size.x - sp.x : -1, useEnd ? size.x - ep.x : -1];
                if (size.y) ret.y = [useStart ? size.y - sp.y : -1, useEnd ? size.y - ep.y : -1];
                /*
                if (size.x) ret.x = [sp.x - size.x, ep.x - size.x];
                if (size.y) ret.y = [sp.y - size.y, ep.y - size.y];*/
                break;
        }
        if (size.x === undefined) delete ret.x;
        if (size.y === undefined) delete ret.y;
        if ((size as any).w === undefined) delete ret.w; else ret.w = (size as any).w;
        if ((size as any).h === undefined) delete ret.h; else ret.h = (size as any).h;
        // console.log("encode coorde", {size, sp, ep, ret});
        ret.currentCoordType = edgePointCoordMode;
        return ret;
    }
    public encodePosCoords(c: Context, size0: Partial<EPSize>, view: LViewElement, sp0?: GraphPoint, ep0?: GraphPoint, mode?: CoordinateMode): Partial<EPSize> {
        if (!view) view = this.get_view(c);
        let size: Partial<EPSize> = size0 as any;
        let edgePointCoordMode = mode || (view.__raw || view).edgePointCoordMode;
        let le: LVoidEdge = c&&c.proxyObject.father;
        let sp: GraphPoint = sp0 || le.startPoint;
        let ep: GraphPoint = ep0 || le.endPoint;
        return LEdgePoint.encodeCoords(size, edgePointCoordMode, sp, ep);
    }

    /* 13/10/2023 Giordano comment (defined in LPointerTargetable
    public get_delete(context: Context): () => void {
        // careful: pointedBy might be broken due to comment x984 (search it)
        return super.get_delete(context);
    }
    */
}
RuntimeAccessibleClass.set_extend(DVoidVertex, DEdgePoint);
RuntimeAccessibleClass.set_extend(LVoidVertex, LEdgePoint);

@RuntimeAccessible('DVertex')
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
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
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

    public static new(htmlindex: number, model: DGraphElement["model"], parentNodeID: DGraphElement["father"],
                      graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DVertex {
        return new Constructors(new DVertex('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID, htmlindex)
            .DVoidVertex(size || defaultVertexSize).DVertex().end();
    }
}

@RuntimeAccessible('LVertex')
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
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
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
@RuntimeAccessible('DGraphVertex')
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
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    // from graph
    zoom!: GraphPoint;
    offset!: GraphPoint; // in-graph scrolling position

    // from VoidVertex
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    isResized!: boolean;
    // size!: GraphSize; // virtual
    // from graph

    // personal attributes
    __isDVertex!: true;
    __isDGraph!: true;
    __isDGraphVertex!: true;

    public static new(htmlindex: number, model: DGraph["model"], parentNodeID: DGraphElement["father"],
                      graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"], size?: GraphSize): DGraphVertex {
        return new Constructors(new DGraphVertex('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable().DGraphElement(model, graphID, htmlindex)
            .DVoidVertex(size || defaultVertexSize).DVertex().DGraph().end();
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

const Mixed = MixOnlyFuncs(LG, LV) as (typeof LG & typeof LV & typeof RuntimeAccessibleClass);
@RuntimeAccessible('LGraphVertex')
//@ts-ignore TS2510
export class LGraphVertex<Context extends LogicContext<any> = any, D extends DGraphVertex = any> extends Mixed { // MixOnlyFuncs(LGraph, LVertex)
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
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    // containedIn?: LGraphElement;
    ///////////////////////////////////////// subElements!: LGraphElement[];
    // from graph
    zoom!: GraphPoint;
    offset!: GraphPoint; // in-graph scrolling position
    graphSize!: GraphSize; // internal size of the graph. can be huge even if the sub-graph is in a small window (scroll)

    // from VoidVertex
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    isResized!: boolean;
    size!: GraphSize; // virtual


    // personal attributes
    __isLVertex!: true;
    __isLGraph!: true;
    __isLGraphVertex!: true;
}

RuntimeAccessibleClass.set_extend(DGraph, DGraphVertex);
RuntimeAccessibleClass.set_extend(DVertex, DGraphVertex);
RuntimeAccessibleClass.set_extend(LGraph, LGraphVertex);
RuntimeAccessibleClass.set_extend(LVertex, LGraphVertex);


@RuntimeAccessible('DVoidEdge')
export class DVoidEdge extends DGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVoidEdge;
    // static logic: typeof LVoidEdge;
    // static structure: typeof DVoidEdge;
    id!: Pointer<DVoidEdge, 1, 1, LVoidEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;

    // personal attributes
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDVoidEdge!: true;

    midPoints!: InitialVertexSize[]; // the logic part which instructs to generate the midnodes
    midnodes!: Pointer<DEdgePoint, 1, 1, LEdgePoint>[]; // using subelements instead most of times

    longestLabel?: DocString<"function">;
    labels?: DocString<"function">;
    anchorStart?: string;
    anchorEnd?: string;

    isExtend!: boolean;
    isReference!: boolean;
    isValue!: boolean;
    isDependency!: boolean;
    // endFollow!: boolean; they became derived attributes from static properties
    // startFollow!: boolean;

    static isFollowingCoords: GraphPoint;

    public static new(htmlindex: number, model: DGraph["model"]|null|undefined, parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"],
                      nodeID: DGraphElement["id"]|undefined, start: DGraphElement["id"], end: DGraphElement["id"],
                      longestLabel?: DEdge["longestLabel"], labels?: DEdge["labels"]): DEdge {
        return new Constructors(new DEdge('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID, htmlindex)
            .DVoidEdge(start, end, longestLabel, labels).end();
    }
    public static new2(model: DGraph["model"]|null|undefined, parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"],
                       nodeID: DGraphElement["id"]|undefined, start: DGraphElement["id"], end: DGraphElement["id"], setter:((d: DEdge) => any)): DEdge {
        return new Constructors(new DEdge('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID)
            .DVoidEdge(start, end).end(setter);
    }
}
/*
@RuntimeAccessible
export class MidPoint{
    readonly id: string; // not really a pointer, it's not on store.
    x?: number; y?: number;
    readonly w?: number; // if it's modified it's not ever here (initial size) but on DEdgePoint that is a Node.
    readonly h?: number;/*
    constructor2(x: number=5, y: number=5, w: number=5, h: number=5) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }* /
constructor(id: string, w: number=5, h: number=5) {
    this.id = id;
    this.w = w;
    this.h = h;
}
}*/
@RuntimeAccessible('EdgeSegment')
export class EdgeSegment{
    index: number;
    prev: EdgeSegment | undefined;
    start: segmentmaker;
    bezier: segmentmaker[];
    end: segmentmaker;
    length!: number;
    // if EdgeSegment is changed, shouldcomponentupdate needs update too: search in IDE for "5khi2"
    d!: string;
    dpart!: string; //  a segment of the whole path
    m!: number; // m coefficient of the line between start and end.
    rad!: number; // for head and tails: radian angle of the segment.
    radLabels!: number; // for labels: it flips the angle when it's < PI/2 so the text is never upside down

    isLongest!: boolean;
    label!: PrimitiveType | JSX.Element | undefined;
    svgLetter: EdgeBendingMode;
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
        // console.log("segmentmaker:", arguments, ((start.ge?.model as any)?.name)+" ---> " + ((end.ge?.model as any)?.name));
        this.start = start;
        this.bezier = mid;
        this.end = end;
        this.index = index;
        this.prev = prevSegment;
        //this.segments = segments;
        // the idea: forbid all T and S or transform them in C, Q by calculating and manually adding their mirrored bezier pts
        // if (svgLetter[1]) svgLetter = (svgLetter[0]) as any;
        if (svgLetter === EdgeBendingMode.Bezier_QT) {
            this.svgLetter = EdgeBendingMode.Bezier_QT[0] as any as EdgeBendingMode;
            // this.svgLetter = (index === 0 ? EdgeBendingMode.Bezier_QT[0] : EdgeBendingMode.Bezier_QT[1]) as any as EdgeBendingMode;
            this.addBezierPoint();
        } else
        if (svgLetter === EdgeBendingMode.Bezier_CS) {
            this.svgLetter = EdgeBendingMode.Bezier_CS[0] as any as EdgeBendingMode;
            // this.svgLetter = (index === 0 ? EdgeBendingMode.Bezier_CS[0] : EdgeBendingMode.Bezier_CS[1]) as any as EdgeBendingMode;
            this.addBezierPoint();
        }
        else this.svgLetter = svgLetter;

        // fix if amount of bezier pts is invalid for current letter
        switch (this.svgLetter) {
            case EdgeBendingMode.Line:
            case EdgeBendingMode.Bezier_quadratic:
                if (this.bezier.length >= 1) break;
                else this.svgLetter = EdgeBendingMode.Line;
                break;
            case EdgeBendingMode.Bezier_cubic:
                if (this.bezier.length >= 2) break;
                else if (this.bezier.length >= 1) this.svgLetter = EdgeBendingMode.Bezier_quadratic;
                else this.svgLetter = EdgeBendingMode.Line;
                break;
            case EdgeBendingMode.Elliptical_arc:
                if (this.bezier.length >= 3) break;
                else this.svgLetter = EdgeBendingMode.Line; // straight to end ignoring midpoints that are NOT coordinates when using elliptical arc.
                break;
            default:
            //case EdgeBendingMode.Bezier_quadratic_mirrored as string:
            //case EdgeBendingMode.Bezier_cubic_mirrored as string: // translated to Q or C by adding mirrored bezier points explicitly
            case EdgeBendingMode.Bezier_QT:
            case EdgeBendingMode.Bezier_CS: // translated to Q or C by sending the right letter to each segment
                Log.exDevv("this svg letter should not appear here", this.svgLetter);
                break;
        }
    }
    addBezierPoint(): void {
        let prev: EdgeSegment | undefined = this.prev;
        if (!prev) return;
        let prevedgemakerbezier: segmentmaker = (prev.bezier[prev.bezier.length-1] || prev.start);
        let mirroredBezier: segmentmaker = {...prevedgemakerbezier,
            pt: EdgeSegment.invertLastBezierPt(prevedgemakerbezier.pt, prev.end.pt),
            uncutPt: EdgeSegment.invertLastBezierPt(prevedgemakerbezier.uncutPt, prev.end.uncutPt),
        };
        this.bezier = [mirroredBezier, ...this.bezier];
        // always only 1 assumed pt both in cubic and quadratic.
        // let next: this | undefined = this.segments[this.index+1];
        // EdgeSegment.invertLastBezierPt((next.mid[1] || next.end).pt, next.start.pt);
    }

    makeD(index: number, gapMode: EdgeGapMode): string {
        this.m = GraphPoint.getM(this.start.pt, this.end.pt);
        this.rad = Geom.mToRad(this.m, this.start.pt, this.end.pt);
        this.radLabels = Math.atan(this.m);

        let svgLetter = this.svgLetter; // caller makes sure to pass right letter and resolve "CS" mixed letters. // this.bendingModeToLetter(bendingMode, index);
        // caller sends inverted pts as normal coords
        // let invertedBezPt = lastSegment && EdgeSegment.invertLastBezierPt(lastSegment.midp[lastSegment.mid.length-1] || lastSegment.startp, lastSegment.endp);
        switch (this.svgLetter.length) {
            case 2:
                return Log.exDevv("mixed letters are not allowed and should have been resolved to single svg letters before here, found:" + svgLetter);
            /*return Log.exDevv("dev problem to fix:\n" +
            "the mirrored mode requires the first one to have explicit non-mirrored mode?? like M, C a1 a2 a3, S a1, S a1, S a1\n" +
            "So all segments with mixed modes needs to extract the last bezier point (penultimate coordinate) from previous segments, mirror it and insert in midp[0]");*/
            case 1:
                let bezierpts = [...this.bezier.map( b => b.pt), this.end.pt];
                let finalpart = svgLetter + " " + bezierpts.map((p)=> p.x + " " + p.y).join(", ");
                this.dpart = "M " + this.start.pt.x + " " + this.start.pt.y + ", " + finalpart;
                let bezierptsUncut = [...this.bezier.map( b => b.uncutPt), this.end.pt]; // uncutPt exist for start and end too, but i want to use the cut one for those. or edgehead is off
                let finalpartUncut = svgLetter + " " + bezierptsUncut.map((p)=> p.x + " " + p.y).join(", ");
                this.d = (index === 0 ? "M" + this.start.pt.x + " " + this.start.pt.y + ", " : "") + finalpartUncut;

                //midp = [this.startp, ...this.midp];
                // d = M sp X mp2 ep // X = custom letter
                // dpart = T sp X mp2 ep // S = S if X = C,
                // sp is the startingpoint from the prev node, which might be != from endpoint of last node if last node have w>0 && h>0
                // so i'm "filling" the gap with a T, or L arc wich can use only 1 parameter (they are the only 1-parameter arcs)
                // if (this.prev && this.prev.end.pt.equals(this.start.pt)) gapMode = EdgeGapMode.average; // if the 2 points coincide, i use any 1 of the gapmodes that are continuous
                /*switch (gapMode){
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
                         }* /
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
                }*/
                break;
            default: return Log.exDevv("unexpected bending mode length:" + this.svgLetter + " or fillMode: " + gapMode, {bendingMode: this.svgLetter, index, gapMode});
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

export class EdgeFillSegment extends EdgeSegment{
    public static cname: string = "EdgeFillSegment";
    makeD(index: number, gapMode: EdgeGapMode): string {
        // if (gapMode === EdgeGapMode.autoFill) { gapMode = this.svgLetter === EdgeBendingMode.Line ? EdgeGapMode.lineFill : EdgeGapMode.arcFill; }
        switch (gapMode) {
            case "closest" as any:// EdgeGapMode.closest:
            case EdgeGapMode.center:
            case EdgeGapMode.average:
            case EdgeGapMode.gap:
                return ""; // should not have filler arcs
            default:
                /*
            case EdgeGapMode.autoFill as any:
            case EdgeGapMode.lineFill:
                this.bezier = [];
                this.svgLetter = EdgeBendingMode.Line;
                return super.makeD(index, gapMode);
            case EdgeGapMode.arcFill:*/
                this.svgLetter = this.svgLetter[0] as EdgeBendingMode;
                if (this.svgLetter === "Q") this.bezier = this.bezier.length ? [this.bezier[0]] : [];
                return super.makeD(index, gapMode);
        }
    }
}
export type labelfunc = (e:LVoidEdge, segment: EdgeSegment, allNodes: LEdge["allNodes"], allSegments: EdgeSegment[]) => PrimitiveType;
export type labeltype = orArr<labelfunc | PrimitiveType>;

type segmentmaker = {size: GraphSize, view: LViewElement, ge: LGraphElement, pt: GraphPoint, uncutPt: GraphPoint};
@RuntimeAccessible('LVoidEdge')
export class LVoidEdge<Context extends LogicContext<DVoidEdge> = any, D extends DEdge = DEdge> extends LGraphElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LVoidEdge;
    // static logic: typeof LVoidEdge;
    // static structure: typeof DVoidEdge;
    __raw!: DVoidEdge;
    id!: Pointer<DVoidEdge, 1, 1, LVoidEdge>;
    graph!: LGraph;
    model?: LModelElement;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    // containedIn?: LGraphElemnt;
    subElements!: LGraphElement[];
    __isLVoidEdge!: true;
    midPoints!: InitialVertexSize[]; // the logic part which instructs to generate the midnodes
    midnodes!: LEdgePoint[];
    edge!: LVoidEdge; // returns self. useful to get edge from edgePoints without triggering error if you are already on edge.
    __info_of__edge: Info = {type:"?LEdge", txt:"returns this if called on an edge, the containing edge if called on an EdgePoint, undefined otherwise."}

    isExtend!: boolean;
    isReference!: boolean;
    isValue!: boolean;
    isDependency!: boolean;

/*
replaced by startPoint
    edgeStart!: GraphPoint;
    edgeStart_inner!: GraphPoint;
    edgeStart_outer!: GraphPoint;
    __info_of__edgeStart: Info = {type: "GraphPoint", txt: "Same as edgeStart_outer."}
    __info_of__edgeStart_outer: Info = {type: "GraphPoint",
     txt: "Where the edge should start his path, in coordinates relative at the root Graph.
     <br>Computed by combining the anchor offset option in View and the size of the starting node."}
    __info_of__edgeStart_inner: Info = {type: "GraphPoint",
     txt: "Where the edge should start his path, in coordinates relative at the most nested Graph.
     <br>Computed by combining the anchor offset option in View and the size of the starting node."}
    edgeEnd!: GraphPoint;
    edgeEnd_inner!: GraphPoint;
    edgeEnd_outer!: GraphPoint;
    __info_of__edgeEnd: Info = {type: "GraphPoint", txt: "Same as edgeEnd_outer."}
    __info_of__edgeEnd_outer: Info = {type: "GraphPoint",
     txt: "Where the edge should end his path, in coordinates relative at the root Graph.
     <br>Computed by combining the anchor offset option in View and the size of the starting node."}
    __info_of__edgeEnd_inner: Info = {type: "GraphPoint",
     txt: "Where the edge should end his path, in coordinates relative at the most nested Graph.
     <br>Computed by combining the anchor offset option in View and the size of the starting node."}
*/

    allNodes!: [LGraphElement, ...Array<LEdgePoint>, LGraphElement];
    __info_of__allNodes: Info = {type: "[LGraphElement, ...Array<LEdgePoint>, LGraphElement]", txt: <span>first element is this.start. then all this.midnodes. this.end as last element</span>};


    label!: this["longestLabel"];  // should never be read change their documentation in write only. their values is "read" in this.segments
    longestLabel!: labeltype;
    labels!: labeltype;
    __info_of__longestLabel: Info = {label:"Longest label", type:"function(edge)=>string",
        readType: "(edge:LEdge, segment: EdgeSegment, allNodes: DGraphElement[], allSegments: EdgeSegment[]) => PrimitiveType",
        writeType:"string",
        txt: <span>Label assigned to the longest path segment.</span>}
    __info_of__label: Info = {type: "", txt: <span>Alias for longestLabel</span>};
    __info_of__labels: Info = {label:"Multiple labels", type: "same type as longestLabel | longestLabel[]",
        writeType: "string",
        txt: <span>Instructions to label to multiple or all path segments in an edge</span>
    };


    start!: LGraphElement;
    __info_of__start: Info = {type: "LVertex", txt:"the source point of the edge."}
    get_start(c: Context): this['start'] { return LPointerTargetable.fromPointer(c.data.start); }
    set_start(val: Pack1<LGraphElement>, c: Context): boolean {
        let ptr = Pointers.from(val);
        if (!ptr) { Log.exx("attempting to set an invalid LEdge.start: " + ptr, {ptr, data: c.data}); return true; }
        if (ptr !== c.data.start) SetFieldAction.new(c.data.id, 'start', ptr, '', true);
        return true;
    }
    end!: LGraphElement;
    __info_of__end: Info = {type: "LVertex", txt:"the terminal point of the edge."}
    get_end(c: Context): this['end'] { return LPointerTargetable.fromPointer(c.data.end); }
    set_end(val: Pack1<LGraphElement>, c: Context): boolean {
        let ptr = Pointers.from(val);
        if (!ptr) { Log.exx("attempting to set an invalid LEdge.end: " + ptr, {ptr, data: c.data}); return true; }
        if (ptr !== c.data.end) SetFieldAction.new(c.data.id, 'end', ptr, '', true);
        return true;
    }


    get_label(c: Context): this["longestLabel"] { return this.get_longestLabel(c); }
    set_label(val: DVoidEdge["longestLabel"], c: Context): boolean { return this.set_longestLabel(val, c); }
    get_longestLabel(c: Context): this["longestLabel"] {
        return transientProperties.node[c.data.id].longestLabel;
        /*if (transientProperties.node[c.data.id].longestLabel !== undefined) return transientProperties.node[c.data.id].longestLabel;
        else return transientProperties.view[c.data.view].longestLabel;*/
    }
    get_labels(c: Context): this["labels"] {
        return transientProperties.node[c.data.id].labels;
        /*if (transientProperties.node[c.data.id].labels !== undefined) return transientProperties.node[c.data.id].labels;
        else return transientProperties.view[c.data.view].labels;*/
    }
    set_longestLabel(val: DVoidEdge["longestLabel"], c: Context): boolean {
        Log.exDevv('Edge.labels are disabled, pass it through props instead');
        if (val === c.data.longestLabel) return true;
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "longestLabel", val);
            SetRootFieldAction.new("NODES_RECOMPILE_longestLabel+=", c.data.id);
        });
        return true;
    }
    set_labels(val: DVoidEdge["labels"], c: Context): boolean {
        Log.exDevv('Edge.labels are disabled, pass it through props instead');
        if (val === c.data.labels) return true;
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "labels", val);
            SetRootFieldAction.new("NODES_RECOMPILE_labels+=", c.data.id);
        });
        return true; }

    public headPos_impl(c: Context, isHead: boolean, headSize0?: GraphPoint, segment0?: EdgeSegment, zoom0?: GraphPoint): GraphSize & {rad: number} {
        let segment: EdgeSegment = segment0 || this.get_segments(c).segments[0];
        // let v: LViewElement = this.get_view(c);
        let tmp: any = headSize0 || (isHead ? this.get_view(c).edgeHeadSize : this.get_view(c).edgeTailSize);
        if (!tmp || tmp.x === 0 || tmp.y === 0) {
            // head or tail missing
            tmp = new GraphSize(0, 0, 0, 0);
            tmp.rad = 0;
            return tmp;
        }
        let zoom: GraphPoint = zoom0 || this.get_graph(c).zoom;// ownZoom or cumulativeZoom?
        let headPos: GraphSize & {rad: number} = (new GraphSize(0, 0, tmp.x, tmp.y) as any); //.multiply({w:zoom.x, h:zoom.y});
        let useBezierPoints = true;
        let start: GraphPoint, end: GraphPoint;
        let m: number;
        if (useBezierPoints) {
            if (isHead) {
                start = segment.end.pt;
                end = (segment.bezier[segment.bezier.length - 1] || segment.start).pt;
            } else {
                start = segment.start.pt;
                end = (segment.bezier[0] || segment.end).pt;
            }
            m = GraphPoint.getM(start, end);
        } else {
            if (isHead) { start = segment.end.pt; end = segment.start.pt; }
            else { start = segment.start.pt; end = segment.end.pt; }
            m = segment.m;
        }
        // first find the center of where it should be positioned
        // let center: GraphPoint;
        // let distance: number = Math.sqrt(headPos.w*headPos.w + headPos.h*headPos.h);
        // let isVertical = m >=1 ;
        let x4headsize = new GraphSize(start.x - headPos.w, start.y - headPos.h, headPos.w*2, headPos.h*2);
        // first intersection is segment origin. second is found with the box containing all possible edgeHead positions that touch the startPoint
        // (doing x4 his shape and placing 4 "rectangles" all around startPoint) to cover all possible segment directions.
        // or finding first direction (vertical if m >1, horizontal if m<0) and vector direction and intersecting with only the "correct" placed edgeHead rectangle.
        // then the intersection will likely not fall on the extreme angle of EdgeHead and i can re-center edgeHead
        // so that first and second intersections are equal spaced with the center segment
        let secondIntersection: GraphPoint | undefined;
        let segmentDistance = start.distanceFromPoint(end);
        if (segmentDistance <= Math.sqrt(headPos.w**2 + headPos.h**2)){
            let safeDistance = Math.max(headPos.w, headPos.h)*5;
            end = new GraphPoint( end.y + safeDistance, end.y + m * safeDistance); // move the point away so it doesn't intersect anymore. i just need direction
            // too small to fit edgeHead, i simply put it centered on the whole segment
            // secondIntersection = end;
        }
        secondIntersection = GraphSize.closestIntersection(x4headsize, start, end, undefined);
        if (!secondIntersection) {
           return Log.exDevv("failed to intersect edge head", {x4headsize, segment, headPos, c, start, end, useBezierPoints});
        }
        tmp = secondIntersection.add(start, false).divide(2); // center of edgehead
        headPos.x = tmp.x - headPos.w / 2; // tl corner
        headPos.y = tmp.y - headPos.h / 2; // tl corner
        headPos.rad = Geom.mToRad(m, start, end);
        /*
        devo trovare la distanza tra il centro dell'egeHead e il punto di inizio in termini assoluti, così tramite M trovo distanza in x e y. o trovarla in altro modo
        if (segment.m === Number.POSITIVE_INFINITY || segment.m === Number.NEGATIVE_INFINITY) {
            center = segment.start.pt.add({x:0, y: distance}, true); }
        else { center = segment.start.pt.add({x:segment.m*headPos.w/2, y:segment.m*headPos.h/2
         this is wrong, cannot be the same for x and y, i should invert the line equation for x?}, true); }
        headPos.x = center.x - headPos.w / 2;
        headPos.y = center.y - headPos.h / 2;*/
        // console.log("head intersected", {headPos, secondIntersection, x4headsize, segment, c, start, end, useBezierPoints});

        return headPos;
    }

    public headPos(headSize0?: GraphPoint, segment0?: EdgeSegment, zoom0?: GraphPoint): GraphSize & {rad: number} {
        return this.wrongAccessMessage("This is not headPos() implementation. it is just for typings. use the getter"); }
    public tailPos(headSize0?: GraphPoint, segment0?: EdgeSegment, zoom0?: GraphPoint): GraphSize & {rad: number} {
        return this.wrongAccessMessage("This is not tailPos() implementation. it is just for typings. use the getter"); }
    protected get_headPos(c: Context): this["headPos"] {
        return (headSize?: GraphPoint, segment?: EdgeSegment, zoom?: GraphPoint) => this.headPos_impl(c, true, headSize, segment, zoom); }
    protected get_tailPos(c: Context): this["tailPos"] {
        return (headSize?: GraphPoint, segment?: EdgeSegment, zoom?: GraphPoint) => this.headPos_impl(c, false, headSize, segment, zoom); }
    protected get_allNodes(c: Context): this["allNodes"] { return [this.get_start(c), ...this.get_midnodes(c), this.get_end(c)]; }

    protected get_edge(c: Context): this{ return c.proxyObject as this; }
    protected set_edge(v: any, c: Context): false { return this.cannotSet("edge field, on an edge element"); }
    protected get_midPoints(c: Context):this["midPoints"] { return c.data.midPoints; }
    public addMidPoint(v: this["midPoints"][0]): boolean { return this.wrongAccessMessage("addMidPoint"); }
    protected get_addMidPoint(c: Context): (v: this["midPoints"][0]) => boolean { return (v:this["midPoints"][0]) => this.impl_addMidPoints(v, c); }
    protected set_midPoints(val: this["midPoints"], c: Context): boolean {
        return SetFieldAction.new(c.data.id, "midPoints", val, undefined, false);
    }
    protected impl_addMidPoints(val: this["midPoints"][0], c: Context): boolean {
        return SetFieldAction.new(c.data.id, "midPoints", val, '+=', false);
    }
    protected get_label_impl(c: Context, segment: EdgeSegment, nodes: this["allNodes"], segments: EdgeSegment[]): PrimitiveType | undefined {
        let key: "longestLabel" | "labels" = segment.isLongest ? "longestLabel" : "labels"; // : keyof this
        // if (isLongestSegment) return this.get_longestLabel_impl(d, l, nodes, index):
        const d = c.data;
        const l = c.proxyObject;
        let labelmaker: any = (this as any)['get_'+key](c);
        let labelmakerfunc: labelfunc = labelmaker as any;
        // let lastSeg = segments[i-1];
        switch (typeof labelmaker) {//nb{}[]<>
            case "number":
            case "undefined":
            case "boolean":
            case "string": return labelmaker;
            // case "function": return nodes.map( (o, i) => d.labels(l, nodes, i)).slice(0, nodes.length-1);
            // (e:LVoidEdge, segment: EdgeSegment, allNodes: LEdge["allNodes"], allSegments: EdgeSegment[]) => PrimitiveType
            case "function": return labelmakerfunc(l, segment, nodes, segments);
            default: break;
            case "object":
                if (labelmaker === null) return null;
                if (!Array.isArray(labelmaker)) break;
                let elem = (labelmaker as PrimitiveType[])[segment.index % labelmaker.length];
                if (typeof elem === "function") return (elem as labelfunc)(l, segment, nodes, segments);
                return elem;
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

    __info_of__startPoint: Info = {type: "GraphPoint", txt:<span>startPoint of this.start (element originating the edge). Defaults in outer coordinates.</span>};
    __info_of__endPoint: Info = {type: "GraphPoint", txt:<span>endPoint of this.end (element originating the edge). Defaults in outer coordinates.</span>};
    public get_startPoint(context: Context): GraphPoint{ return this.get_startPoint_Outer(context); }
    public get_endPoint(context: Context): GraphPoint{ return this.get_endPoint_Outer(context); }
    public get_startPoint_Outer(c: Context): GraphPoint{
        // console.log("get_edgeStart_Outer", {out:this.get_outerGraph(c), pos:this.get_startPoint_inner(c), inner:this.get_start(c).innerGraph});
        return this.get_outerGraph(c).translateSize(this.get_startPoint_inner(c), this.get_start(c).innerGraph);
    }
    public get_endPoint_Outer(c: Context): GraphPoint{
        // console.log("get_edgeEnd_Outer", {out:this.get_outerGraph(c), pos:this.get_endPoint_inner(c), inner:this.get_end(c).innerGraph});
        return this.get_outerGraph(c).translateSize(this.get_endPoint_inner(c), this.get_end(c).innerGraph);
    }

    public get_startPoint_inner(c: Context): GraphPoint{ return this.get_edgeStartEnd_inner(c, true); }
    public get_endPoint_inner(c: Context): GraphPoint{ return this.get_edgeStartEnd_inner(c, false); }
    private get_edgeStartEnd_inner(c: Context, isStart: boolean): GraphPoint{ return isStart ? this.get_start(c).startPoint : this.get_end(c).endPoint; }
    segments!: {all: EdgeSegment[], segments: EdgeSegment[], fillers: EdgeSegment[], head: GraphSize&{rad:number}, tail: GraphSize&{rad:number}};
    segments_inner!: {all: EdgeSegment[], segments: EdgeSegment[], fillers: EdgeSegment[], head: GraphSize&{rad:number}, tail: GraphSize&{rad:number}};
    segments_outer!: {all: EdgeSegment[], segments: EdgeSegment[], fillers: EdgeSegment[], head: GraphSize&{rad:number}, tail: GraphSize&{rad:number}};
    __info_of__segments: Info = {type: "{all:T, segments:T, fillers:T, head: GraphSize&{rad:number}, tail: as head} where T is EdgeSegment",
        txt:<span>Collection of segments connecting in order vertex and EdgePoint without intersecting their area, aimed to be rendered in svg path.
            <br/>fillers are arcs generated by view.edgeGapMode being autofill, arcfill or linefill.
            <br/>length of this.segments array is Math.ceil(allNodes.length / svg_letter_size) specified on view.
            <br/>"head" and "tail" are the position and angle of eventual edge decorators. Refer to this.headPos documentation.</span>}

    private svgLetterSize(s: string, addM: boolean = true, doublingMidPoints: boolean = true): {first:number, others: number} {
        let ret: {first:number, others: number};
        switch (s) {
            default: ret = Log.exDevv("unexpected svg path letter: \"" + s + "\"", s); break;
            case EdgeBendingMode.Line:
            //case EdgeBendingMode.Bezier_quadratic_mirrored:
                ret = {first:1, others:1}; break;
            case EdgeBendingMode.Bezier_quadratic:
            //case EdgeBendingMode.Bezier_cubic_mirrored:
                ret = {first:2, others:2}; break;
            case EdgeBendingMode.Bezier_cubic: ret = {first:3, others:3}; break;
            case EdgeBendingMode.Elliptical_arc: ret = {first:4, others:4}; break;

            case EdgeBendingMode.Bezier_QT: ret = {first:2, others:1}; break;
            case EdgeBendingMode.Bezier_CS: ret = {first:3, others:2}; break;
        }

        // account for the fact that every midpoint is listed twice: at anchor start and anchor end.
        if (doublingMidPoints) {
            // removing last point (first is already excluded because addM didn't trigger yet)
            // , the remaining are midpoints to double. then i add it back
            ret.first = (ret.first - 1) * 2 + 1;
            ret.others = (ret.others - 1) * 2 + 1;
        }

        // account for the first M letter
        //    (if the segment is not mode.gap or first, M coord still exist in segment but are ignored)
        if (addM) {
            ret.first += 1;
            ret.others += 1;
        }
        return ret;
    }

    // outer should be a redundant param and always == true
    private get_points_impl(allNodes: LGraphElement[], outer: boolean, c:Context): segmentmaker[] {
        function getAnchorOffset(size: GraphSize, offset: GraphPoint, isPercentage: boolean, $factor: number = 100) {
            if (!size) size = new GraphSize(0, 0, 0, 0);
            // else if (!size.tl) size = new GraphSize(size.x, size.y, size.w, size.h);
            if (isPercentage) offset = new GraphPoint(offset.x/$factor*(size.w), offset.y/$factor*(size.h));
            return size.tl().add(offset, false);
        }
        let innermost: LGraph = this.get_graph(c);
        let root: LGraph = this.get_root(c);
        const all: segmentmaker[] = allNodes.flatMap((ge, i) => {
            let dge = ge.__raw;
            let size = outer ? ge.outerSize : ge.innerSize;
            console.log("ttsize0", {root, innermost, rm:root?.model?.name, im:innermost?.model?.name})

            if (outer && root && innermost && innermost.id !== root.id) {
                console.log("ttsize", {size0:{...size}, ri: root.translateSize(size, innermost), ir: innermost.translateSize(size, root)})
                size = innermost.translateSize(size, root);
            }
            let base: segmentmaker = {view: ge.view, size, ge, pt: null as any, uncutPt: null as any};

            Log.exDev(typeof base.size !== "object", "could not get node size:", {base, c, outer})
            let rets: segmentmaker | undefined;// = base as any;
            let rete: segmentmaker | undefined;// = {...base} as any;
            let debug = true;
            if (debug) {
                (base as any).anchor_e = dge.anchors[c.data.anchorEnd || 0] || dge.anchors[Object.keys(dge.anchors)[0]];
                (base as any).anchor_s = dge.anchors[c.data.anchorStart || 0] || dge.anchors[Object.keys(dge.anchors)[0]];
            }

            // get endpoint, then startpoint (land on midnode, then depart from it)
            if (i !== 0){
                rete = {rete:true, ...base} as any as segmentmaker;
                if (i === allNodes.length - 1) {
                    // get end anchor from node
                    let anchor = dge.anchors[c.data.anchorEnd || 0];
                    if (!anchor) anchor = dge.anchors[Object.keys(dge.anchors)[0]];
                    if (anchor) rete.pt = getAnchorOffset(rete.size, anchor, true, 1);
                }
                // if no anchor, treat the node as a midpoint
                if (!rete.pt) {
                    // get ending point from midpoint
                    //rete.pt = (LEdgePoint.singleton as LEdgePoint).get_endPoint(undefined as any, rete.size, rete.view);
                    rete.pt = getAnchorOffset(rete.size, rete.view.edgeStartOffset, rete.view.edgeStartOffset_isPercentage);
                }
                rete.uncutPt = rete.pt;
            }
            if (i !== allNodes.length - 1){
                rets = {rets: true, ...base} as any as segmentmaker;
                if (i === 0) {
                    // get start anchor from node
                    let anchor = dge.anchors[c.data.anchorStart || 0];
                    if (!anchor) anchor = dge.anchors[Object.keys(dge.anchors)[0]];
                    if (anchor) rets.pt = getAnchorOffset(rets.size, anchor, true, 1);
                }
                if (!rets.pt) {
                    // rets starting point from midpoint
                    // rets.pt = (LEdgePoint.singleton as LEdgePoint).get_startPoint(undefined as any, rets.size, rets.view);
                    rets.pt = getAnchorOffset(rets.size, rets.view.edgeStartOffset, rets.view.edgeStartOffset_isPercentage);
                }
                rets.uncutPt = rets.pt;
            }

            // ret.pt = ge.startPoint
            return rets && rete ? [rete, rets] : (rets ? [rets] : [rete as segmentmaker]); }
        );

        if (DVoidEdge.isFollowingCoords){
            if (c.data.id === LVoidEdge.endFollow) {
                let seg = all[all.length - 1];
                seg.pt = DVoidEdge.isFollowingCoords;
                seg.size = new GraphSize(seg.pt.x, seg.pt.y, 0.01, 0.01);
            }
            if (c.data.id === LVoidEdge.startFollow) {
                let seg = all[0];
                seg.pt = DVoidEdge.isFollowingCoords;
                seg.size = new GraphSize(seg.pt.x, seg.pt.y, 0.01, 0.01);
            }
        }
        return all;
    }
    private get_pointsDebug(c: Context): segmentmaker[]{ return this.get_points_impl(this.get_allNodes(c), true, c); }
    private get_points(allNodes: LGraphElement[], outer: boolean = false, c: Context): segmentmaker[]{
        return this.get_points_impl(allNodes, outer, c);
    }
    private get_points_outer(allNodes: LGraphElement[], c: Context): segmentmaker[]{ return this.get_points_impl(allNodes, true, c); }
    // private get_points_inner(allNodes: LGraphElement[], c: Context): segmentmaker[]{ return this.get_points_impl(allNodes, false, c); }
    public d!: string;
    public __info_of__d: Info = {type: ShortAttribETypes.EString, txt:"the full suggested path of SVG path \"d\" attribute, merging all segments."}
    public get_d(c: Context) {
        return this.get_segments(c).all.map(s => s.d).join(" ");
    }/*
    private get_fillingSegments(c: Context): Partial<this["segments"]> {
        return this.get_segments(c).fillers;
    }*/


    public get_segments(c:Context): this["segments"] {
        return this.get_segments_outer(c);
    }
    public get_segments_outer(c:Context): this["segments"] { return this.get_segments_impl(c, true); }
    // public get_segments_inner(c: Context): this["segments"] { return this.get_segments_impl(c, false); }
    private get_segments_impl(c: Context, outer: boolean): this["segments"] {
        let l = c.proxyObject;
        let v = this.get_view(c);
        let allNodes = l.allNodes;
        windoww.edge = l;
        let all: segmentmaker[] = this.get_points(allNodes, outer, c);
        //const all: {size: GraphSize, view: LViewElement, ge: LGraphElement}[] = allNodes.map((ge) => { return { view: ge.view, size: ge.size, ge}});
        let ret: EdgeSegment[] = [];
        let bm: EdgeBendingMode = v.bendingMode;
        let gapMode: EdgeGapMode = v.edgeGapMode;
        let segmentSize = this.svgLetterSize(bm, false, true);
        let increase: number = segmentSize.first;
        let segment: EdgeSegment | undefined = undefined;
        /// grouping points according to SvgLetter
        for (let i = 0; i < all.length - 1; ) {
            // let start = all[i], end = all[i+increase];
            let start: segmentmaker = all[i];
            let endindex = (i+increase < all.length - 1) ? i+increase : all.length - 1;
            let mid: segmentmaker[] = all.slice(i+1, endindex).filter( (e, i)=> i % 2 === 0);
            let end: segmentmaker = all[endindex];
            // makes sure the edge actually reaches his target even if there is an invalid amount of midnodes fot the current EdgeBendingMode
            if (i === endindex && segment) start = segment.end;
            // segment = this.get_segmentv3(start, mid, end, getSvgLetter(i), i, segment, all);
            segment = new EdgeSegment(start, mid, end, bm, gapMode, i, segment);
            // segment = this.get_segment(start.ge, start.size, start.view, end.ge, end.size, end.view, cut, v.bendingMode, mid, ret[ret.length -1], fillMode, segment);
            ret.push(segment);
            i+= increase+1; // because increase index is already inserted at the end of prev segment
            if (increase !== segmentSize.others) increase = segmentSize.others;
            // if (longestLabel !== undefined && longest < s.length) { longest = s.length; longestindex = i; } todo: move to after snapping to borders
        }
        function printablesegment(s:GObject) {
            let r: GObject = {};
            for (let k in s) {
                let v = s[k];
                v = v?.__raw || v;
                if (typeof v === "object") r[k] = JSON.parse(JSON.stringify(v));
                else r[k] = v;
            }
            return r;
        }

        let fillSegments: EdgeSegment[] = [];
        this.snapSegmentsToNodeBorders(c, v, ret, fillSegments);
        let longestLabel = c.data.longestLabel;
        this.setLabels(c, ret, allNodes);
        // console.log("getSegments() labeled:", {main:ret, fillSegments});
        let rett: this["segments"] = {all: [...ret, ...fillSegments], segments: ret, fillers: fillSegments} as any;
        /*switch(bm){
            default: break;
            case EdgeBendingMode.Bezier_QT:
            case EdgeBendingMode.Bezier_CS:
                rett.
        }*/
        for (let i = 0; i < rett.all.length; i++) {
            let s = rett.all[i];
            s.makeD(i, gapMode);
        }
        let zoom = new GraphPoint(1, 1);
        rett.head = this.headPos_impl(c, true, v.edgeHeadSize, rett.segments[rett.segments.length - 1], zoom);
        rett.tail = this.headPos_impl(c, false, v.edgeTailSize, rett.segments[0], zoom);
        return rett;
    }
    private setLabels(c: Context, segments: EdgeSegment[], allNodes: this["allNodes"]): void {
        // find longest segment
        let longestindex = -1;
        let longest = 0;
        for (let i = 0; i < segments.length; i++) {
            let s = segments[i];
            s.calcLength();
            if (longest < s.length) { longest = s.length; longestindex = i; }
            s.isLongest = false;
        }
        if (longestindex >= 0) segments[longestindex].isLongest = true;
        // apply labels
        for (let s of segments) s.label = this.get_label_impl(c, s, allNodes, segments);
    }

    private snapSegmentsToNodeBorders(c: Context, v: LViewElement, ret: EdgeSegment[], fillSegments: EdgeSegment[]){
        // snap segment start and end to a node border
        let canCutStart: boolean = v.edgeStartStopAtBoundaries,
            canCutEnd: boolean = v.edgeEndStopAtBoundaries;
        let grid: GraphPoint | undefined = undefined;
        // let fillSegments: EdgeSegment[] = [];
        let gapMode: EdgeGapMode = v.edgeGapMode;
        let bm: EdgeBendingMode = v.bendingMode;


        let ci: GraphPoint | undefined;
        // cut i === 0 is cut regardless of gapmode.
        if (canCutStart) {
            ci = GraphSize.closestIntersection(ret[0].start.size, ret[0].start.pt, (ret[0].bezier[0] || ret[0].end).pt, grid);
            if (ci) ret[0].start.pt = ci;
            /*
            ret[0].start.pt =
                GraphSize.closestIntersection(ret[0].start.size, ret[0].start.pt, (ret[0].bezier[0] || ret[0].end).pt, grid) as any
                || Geom.closestPoint(ret[0].start.size, ret[0].start.pt);*/
        }

        // cut middle segments maybe
        let prev: EdgeSegment;
        let curr: EdgeSegment = ret[0];

        // if (gapMode === EdgeGapMode.gap) return;
        if (canCutStart || canCutEnd) // do the for below
            for (let i = 1; i < ret.length; i++){
                prev = ret[i-1];
                curr = ret[i];
                let doStartCut: boolean, doEndCut: boolean;
                switch(gapMode){/*
                    case EdgeGapMode.arcFill:
                    case EdgeGapMode.lineFill:
                    case EdgeGapMode.autoFill:
                        // same as gap, but will insert 1 more segment to fill the hole
                        doStartCut = true;
                        doEndCut = true;
                        if (prev.end.pt.equals(curr.start.pt)) break;
                        fillSegments.push(new EdgeFillSegment(
                            prev.end,
                            [
                                {...prev.end, pt: EdgeSegment.invertLastBezierPt(prev.end.pt, (prev.bezier[prev.bezier.length-1] || prev.start).pt)},
                                {...curr.start, pt: EdgeSegment.invertLastBezierPt(curr.start.pt, (curr.bezier[0] || curr.end).pt)}
                            ],
                            curr.start,
                            bm, gapMode, 0, undefined));
                            / *
                            fillSegments.push(new FillEdgeSegment( // M <start_gap> C <bez1> <bez2> <end_gap>
                               // <start_gap> = end of last seg (start of gap) <end_gap> = first of curr seg (end of gap)
                            prev.end.pt,
                            EdgeSegment.invertLastBezierPt(prev.end.pt, prev.bezier[prev.bezier.length-1].pt || prev.start.pt),
                            EdgeSegment.invertLastBezierPt(curr.start.pt, curr.bezier[0].pt || curr.end.pt),
                            curr.start.pt)* /

                        break;*/
                    case EdgeGapMode.gap:
                        // just snap to vertex edge         prevSegment.endp and ret.startp
                        doEndCut = true; doStartCut = true;
                        break;
                    // average: todo: maybe rename in join (merges start-end at closest pt to both (avg), then snap on edge)
                    case "closest" as any: //EdgeGapMode.closest:
                        // does not work properly, i think i need to get next.end instead of curr.end, just disabled for now
                        let nextpt: GraphPoint = (curr.bezier[0] || curr.end).pt;
                        let prevpt: GraphPoint = (prev.bezier[prev.bezier.length-1] || prev.start).pt;
                        let midexternalpt = prevpt.add(nextpt, true);
                        let midedgepoint = curr.start.size.tl().add(curr.start.size.br(), false).divide(2, false);
                        // od average between the 2 points before and after that are not part of this edgepoint, then raw a line from there to center of ep, find that intersection.
                        ci = GraphSize.closestIntersection(curr.start.size, midedgepoint, midexternalpt, grid);
                        doEndCut = doStartCut = false;
                        if (canCutEnd && ci) prev.end.pt = ci;
                        if (canCutStart && ci) curr.start.pt = ci;
                        break;
                    case EdgeGapMode.average:
                        // first move to average of the 2 points in the gap, then snap to edge
                        doEndCut = true; doStartCut = true;
                        // indipendent from cutStart, cutEnd.
                        // they merge if just 1 of cutting sides are true. (and if they are both false we don't even enter the for loop)
                        curr.start.pt = curr.start.pt.add(prev.end.pt, false).divide(2, false);
                        prev.end.pt = curr.start.pt.duplicate(); // intentionally not the same pt because during snap to edge they can diverge again.
                        prev.start.uncutPt = prev.start.pt;
                        prev.end.uncutPt = prev.end.pt;
                        break;
                    // center: first move it to center of edgePoint/node, then snap to edge.
                    // this mode might be as well deleted, it can be specified with anchor points
                    case EdgeGapMode.center:
                        doEndCut = false; doStartCut = false;
                        curr.start.pt = curr.start.size.tl().add(curr.start.size.br(), false).divide(2, false);
                        prev.end.pt = curr.start.pt.duplicate(); // intentionally not the same pt because during snap to edge they can diverge again.
                        prev.start.uncutPt = prev.start.pt; // only update them when point moves without being cut (average and center)
                        prev.end.uncutPt = prev.end.pt;
                        break;
                    default:
                        return Log.exDevv("unexpected EdgeGapMode:" + gapMode);
                }
                if (canCutStart && doStartCut){
                    let nextpt: GraphPoint = (curr.bezier[0] || curr.end).pt;
                    ci = GraphSize.closestIntersection(curr.start.size, curr.start.pt, nextpt, grid);
                    if (ci) curr.start.pt = ci;// || Geom.closestPoint(curr.start.size, curr.start.pt);
                    //if (gapMode === EdgeGapMode.average && prev) { prev.end.pt = curr.start.pt.add(prev.end.pt, false).divide(2, false); }
                }
                if (canCutEnd && doEndCut && prev){
                    let prevpt: GraphPoint = (prev.bezier[prev.bezier.length-1] || prev.start).pt;
                    ci = GraphSize.closestIntersection(prev.end.size, prev.end.pt, prevpt, grid);
                    if (ci) prev.end.pt = ci;// || Geom.closestPoint(prev.end.size, prev.end.pt);
                    // if average: first do average between start anchor points non-snapped. then i snap both,
                    // then i do average again, and since it might snap out, i get closestPoint to EdgePoint size
                    if (gapMode === EdgeGapMode.average) prev.end.pt = curr.start.pt =
                        Geom.closestPoint(curr.start.size, curr.start.pt.add(prev.end.pt, false).divide(2, false));
                }
            }
        // cut end of last segment regardless of gapMode
        if (canCutEnd) {
            let prevendpt = curr.end.pt;
            ci = GraphSize.closestIntersection(curr.end.size, curr.end.pt, (curr.bezier[curr.bezier.length-1] || curr.start).pt, grid);
            if (ci) curr.end.pt = ci; //|| Geom.closestPoint(prev.end.size, prev.end.pt);
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


    anchorStart?: string;
    anchorEnd?: string;
    __info_of__anchorStart: Info = {writeType:"string | undefined", type:"string", isEdge: true,
        txt:"The name of a node anchor where the edge should originate from."};
    __info_of__anchorEnd: Info = {writeType:"string | undefined", type:"string", isEdge: true,
        txt:"The name of a node anchor where the edge should point to."};
    endFollow!: boolean;
    startFollow!: boolean;
    __info_of__endFollow: Info = {writeType:"boolean", readType:"boolean", type:"boolean", isEdge: true,// type:"read:(()=>void), write:boolean", readType:"(()=>void))",
        txt:"makes the ending point of an edge follow the cursor, so it can be assigned to a new anchor or target."};
    __info_of__startFollow: Info = {writeType:"boolean", readType:"boolean", type:"boolean", isEdge: true,// type:"read:(()=>void), write:boolean", readType:"(()=>void))",
        txt:"makes the starting point of an edge follow the cursor, so it can be assigned to a new anchor or source."};
    get_endFollow(c: Context): boolean { return (c.data.id === LVoidEdge.endFollow); }
    get_startFollow(c: Context): boolean { return (c.data.id === LVoidEdge.startFollow); }
    // // what in multieditor? needs to be moved in transientstuff?
    set_endFollow(val: boolean, c: Context): boolean { return this._set_start_endFollow(val, c, false); }
    set_startFollow(val: boolean, c: Context): boolean { return this._set_start_endFollow(val, c, true); }
    _set_start_endFollow(val: boolean, c: Context, isStart: boolean): boolean {
        val = !!val;
        console.log("_set_start_endFollow", {val, c, isStart});
        if (val) {
            if (isStart) LVoidEdge.startFollow = c.data.id;
            else LVoidEdge.endFollow = c.data.id;
            if (!LVoidEdge.following) {
                console.log("_set_start_endFollow event attached");
                document.body.addEventListener("mousemove", LVoidEdge.mousemove_pendingEdge, false);
                document.body.addEventListener("keydown", LVoidEdge.onKeyDown_pendingEdge, false);
                LVoidEdge.following = true;
                LVoidEdge.followingContext = c;
                LVoidEdge.showAnchors();
                (windoww.Tooltip as (typeof Tooltip)).show(<div>Changing anchor, press <b>Esc</b> to undo.</div>);

                //let selector = ".Edge[nodeid='" + (LVoidEdge.endFollow || LVoidEdge.startFollow as any)+"']";
                // [...document.querySelectorAll(selector)].map(e=>e.classList.add("no-transition-following")); gets refreshed by react
                document.body.classList.add("no-transition-following");
            }
        }
        else {
            if (LVoidEdge.following && ((isStart ? LVoidEdge.startFollow : LVoidEdge.endFollow) === c.data.id)) {
                document.body.removeEventListener("mousemove", LVoidEdge.mousemove_pendingEdge, false);
                document.body.removeEventListener("keydown", LVoidEdge.onKeyDown_pendingEdge, false);
                let selector = ".Edge[nodeid='" + (LVoidEdge.endFollow || LVoidEdge.startFollow as any)+"']";
                //[...document.querySelectorAll(selector)].map(e=>e.classList.remove("no-transition-following"));
                document.body.classList.remove("no-transition-following");
                if (isStart) LVoidEdge.startFollow = undefined;
                else LVoidEdge.endFollow = undefined;
                LVoidEdge.following = false;
                const $base = $(document.getElementById(isStart ? c.data.start : c.data.end) || []);
                if (!$base.length) return true;
                //const $deepAnchors = $base.find("[nodeid] .anchor");
                const $anchors = $base.find(".anchor")//.not($deepAnchors);
                $anchors.removeClass(["valid-anchor", "active-anchor"]);
                $base[0].style.overflow = '';
                (windoww.Tooltip as (typeof Tooltip)).hide();
            }
        }
        //SetFieldAction.new(c.data, "startFollow", !!val, '', false);
        return true; }
    public static startFollow: Pointer<DVoidEdge> | undefined = undefined;
    public static endFollow: Pointer<DVoidEdge> | undefined = undefined;
    public static following: boolean = false;
    public static followingContext: LogicContext<DVoidEdge, LVoidEdge>;
    public static tmp: number = 1;
    public static canForceUpdate: boolean = true;
    public static getCursorPos(e0: Event): Point { return new Point((e0 as any as MouseEvent).pageX, (e0 as any as MouseEvent).pageY); }
    /*public static getGCursorPos(e0: Event): GraphPoint {
        return LVLoidEdge.getCursorPos(e0).subtract(svgsize.tl(), true).multiply(svgzoom) as any as GraphPoint;
    }*/
    public static onKeyDown_pendingEdge(e: KeyboardEvent): void{
        if (e.key === Keystrokes.escape) {
            const c = LVoidEdge.followingContext;
            if (!c || (!LVoidEdge.startFollow && !LVoidEdge.endFollow)) return;
            let isStart = LVoidEdge.startFollow ? true : false;
            let l = (c.proxyObject as any as LVoidEdge);
            if (isStart) l.startFollow = false;
            else l.endFollow = false;
            // l.component?.forceUpdate(); does not work?
            l.clonedCounter = (l.clonedCounter || 0) + 2;
        }
    }
    public static showAnchors(): void{
        const c = LVoidEdge.followingContext;
        if (!c || (!LVoidEdge.startFollow && !LVoidEdge.endFollow)) return;
        let isStart = LVoidEdge.startFollow ? true : false;
        let nodeid: Pointer<DGraphElement> = isStart ? c.data.start : c.data.end;
        let activeAnchor: string | number = (isStart ? c.data.anchorStart : c.data.anchorEnd) || 0;

        const $base = $(document.getElementById(nodeid) || []);
        if (!$base.length) return;
        const $deepAnchors = $base.find("[nodeid] .anchor");
        const $anchors = $base.find(".anchor").not($deepAnchors);
        $anchors.addClass("valid-anchor");
        $anchors.filter('[data-anchorname="'+activeAnchor+'"]').addClass("active-anchor");
        $base[0].style.overflow = "visible";

    }
    private static mousemovei: number = 0;
    public static mousemove_pendingEdge(e0: Event): void {
        let forcererendermode = true;
        if (forcererendermode) {
            if (!LVoidEdge.following) return;
            if (!LVoidEdge.canForceUpdate) return;
            if (LVoidEdge.mousemovei++%30 === 0) LVoidEdge.showAnchors();


            let c = LVoidEdge.followingContext;
            let g: LGraph = c.proxyObject.graph;
            let cursorPos = LVoidEdge.getCursorPos(e0);
            let gcursorpos = g.translateHtmlSize(cursorPos);
            // console.log("gcursorpos", {cursorPos:cursorPos.toString(), gcursorpos:gcursorpos.toString(), g});
            DVoidEdge.isFollowingCoords = gcursorpos;

            let component: GraphElementComponent = GraphElementComponent.map[(LVoidEdge.startFollow || LVoidEdge.endFollow) as string];
            LVoidEdge.canForceUpdate = false;
            let timer = setTimeout(()=>{LVoidEdge.canForceUpdate = true; }, 5000);
            let tn = transientProperties.node[c.data.id];
            for (let vid in tn.viewScores) { // required to truly force an update
                let tnv = tn.viewScores[vid];
                tnv.jsxOutput = undefined;
                tnv.usageDeclarations = undefined as any;
                tnv.shouldUpdate = true;
            }
            component.setState({forceupdate:new Date().getDate()} as any, ()=>{LVoidEdge.canForceUpdate = true; clearTimeout(timer)});
            // component.forceUpdate(()=>{LVoidEdge.canForceUpdate = true; clearTimeout(timer)});
            return;
        }

        LVoidEdge.tmp++;
        let selector = ".Edge[nodeid='" + (LVoidEdge.endFollow || LVoidEdge.startFollow as any)+"']";
        let root = document.querySelector(selector);
        if (!root) return;
        let paths: SVGPathElementt[] = [...root.querySelectorAll("path.full")] as SVGPathElementt[];
        let pathSegments = root.querySelectorAll("path.segment.preview") as any as SVGPathElementt[];
        // if (!paths.length) paths = pathSegments;
        let pathSegmentContainers: Element[] = [...new Set([...pathSegments].map(e=>e.parentElement))] as Element[];
        for (let container of pathSegmentContainers){
            let se: SVGPathElementt[] = [...container.querySelectorAll("path.segment.preview")] as SVGPathElementt[];
            paths.push(se[LVoidEdge.endFollow ? se.length-1 : 0]);
        }
        let headTail = [...root.querySelectorAll(LVoidEdge.endFollow ? '.edgeHead' : '.edgeTail')] as HTMLElement[];
        let cursorPos = LVoidEdge.getCursorPos(e0)

        let segList: SVGPathSegment[] | undefined;
        for (let p of paths) {
            let svg: SVGElement = U.parentUntil("svg", p) as SVGElement;
            let svgsize: Size = Size.of(svg);
            let svgzoom: Point = new Point(1,1); // todo: check viewbox and css zoom
            let gcursorPos = cursorPos.subtract(svgsize.tl(), true).multiply(svgzoom) as any as GraphPoint;
            segList = [...p.getPathData()];
            let lastSeg = {...segList[LVoidEdge.endFollow ? segList.length-1 : 0]};
            switch (lastSeg.type){
                case 'a': case 'A':
                    segList.push('fake new segment to get replaced instead of actual last segment which is A' as any);
                    lastSeg.type="L"; lastSeg.values = [gcursorPos.x, gcursorPos.y];
                    break;
                case "C": case "c": // bezier curves, keep type just change last point
                case "Q": case "q":
                case "S": case "s":
                case "T": case "t":
                    lastSeg.values[lastSeg.values.length-2] = gcursorPos.x;
                    lastSeg.values[lastSeg.values.length-1] = gcursorPos.y; break;
                case "M": case "m":
                    lastSeg.type = LVoidEdge.endFollow ? "L" : "M";
                    lastSeg.values = [gcursorPos.x, gcursorPos.y]; break;
                case "V": case "v": // stuff forced to become a line
                case "H": case "h":
                case "L": case "l":
                case "Z": case "z":
                    lastSeg.type="L"; lastSeg.values = [gcursorPos.x, gcursorPos.y];
                    break;
            }
            segList[LVoidEdge.endFollow ? segList.length-1 : 0] = lastSeg;
            if (LVoidEdge.tmp%20===0) console.log("svg set path data,", {segList, oldSeglist:p.getPathData(), p});
            p.setPathData(segList);
        }

        for (let ht of headTail){
            let svg: SVGElement = U.parentUntil("svg", ht) as SVGElement;
            let svgsize: Size = Size.of(svg);
            let svgzoom: Point = new Point(1,1); // todo: check viewbox and css zoom
            let gcursorPos = cursorPos.subtract(svgsize.tl(), true).multiply(svgzoom) as any as GraphPoint;
            let rotation: number;
            let lastPt = segList && segList[LVoidEdge.endFollow ? segList.length-2 : 1].values;

            if (lastPt) {
                let m = gcursorPos.getM(new Point(lastPt[LVoidEdge.endFollow ? lastPt.length-2 : 1], lastPt[LVoidEdge.endFollow ? lastPt.length-1 : 0]));
                if (Number.POSITIVE_INFINITY === m) rotation = Geom.degToRad(90); else
                if (Number.NEGATIVE_INFINITY === m) rotation = Geom.degToRad(270); else
                    rotation = Math.atan(m);
                if (lastPt[LVoidEdge.endFollow ? lastPt.length-2 : 1] > gcursorPos.x) rotation -= Geom.degToRad(180);
            } else { rotation = 0;}
            let headSize = Size.of(ht);

            let headPos = gcursorPos.subtract({x:headSize.w/2, y:headSize.h/2}, true);//.subtract({x:Math.cos(rotation)*headSize.w/2, y: -Math.sin(rotation)*headSize.h/2}, true);

            if (LVoidEdge.tmp%20===0) console.log("_set_start_endFollow move head", {selector:LVoidEdge.endFollow ? '.edgeHead' : '.edgeTail', headTail, root});
            ht.style.transform = 'translate('+headPos.x+"px, "+headPos.y+"px) rotate("+rotation+"rad)";
        }
    }
}
RuntimeAccessibleClass.set_extend(DGraphElement, DVoidEdge);
RuntimeAccessibleClass.set_extend(LGraphElement, LVoidEdge);

@RuntimeAccessible('DEdge')
export class DEdge extends DVoidEdge { // DVoidEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DEdge, 1, 1, LEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state!: GObject;
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDEdge!: true;
    __isDVoidEdge!: true;
    midnodes!: Pointer<DEdgePoint, 1, 1, LEdgePoint>[];
}

@RuntimeAccessible('LEdge')
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
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    // containedIn!: LGraphElement;
    subElements!: LGraphElement[];
    _state!: GObject<"proxified">; // LMap;
    midnodes!: LEdgePoint[];
    __isLEdge!: true;
    __isLVoidEdge!: true;

}
RuntimeAccessibleClass.set_extend(DVoidEdge, DEdge);
RuntimeAccessibleClass.set_extend(LVoidEdge, LEdge);
@Leaf
@RuntimeAccessible('DExtEdge')
export class DExtEdge extends DEdge { // etends DEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LGraphElement;
    // static logic: typeof LGraphElement;
    // static structure: typeof DGraphElement;
    id!: Pointer<DExtEdge, 1, 1, LExtEdge>;
    graph!: Pointer<DGraph, 1, 1, LGraph>;
    model!: Pointer<DModelElement, 0, 1, LModelElement>;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    // containedIn!: Pointer<DGraphElement, 0, 1, LGraphElement>;
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state!: GObject;
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

@RuntimeAccessible('LExtEdge')
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
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    isSelected(forUser?: Pointer<DUser>): boolean { return this.wrongAccessMessage("node.isSelected()"); }
    // containedIn!: LGraphElement;
    subElements!: LGraphElement[];
    _state!: GObject<"proxified">; // LMap;
    start!: LGraphElement;
    end!: LGraphElement;
    __isLExtEdge!: true;
    __isLEdge!: true;
    __isLVoidEdge!: true;
}
RuntimeAccessibleClass.set_extend(DEdge, DExtEdge);
RuntimeAccessibleClass.set_extend(LEdge, LExtEdge);
@Leaf
@RuntimeAccessible('DRefEdge')
export class DRefEdge extends DEdge { // extends DEdge
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
    __isDRefEdge!: true;
    /*
        public static new(model: DGraph["model"], parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"]): DRefEdge {
            return new Constructors(new DRefEdge('dwc')).DPointerTargetable().DGraphElement(model, parentNodeID, graphID, nodeID)
                .DVoidEdge().DEdge().DRefEdge().end();
        }*/

}
@RuntimeAccessible('LRefEdge')
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

let a = `DExtEdge, DRefEdge, DVoidEdge, LGraphVertex, LRefEdge, LEdgePoint, DVoidVertex, DGraphVertex, DEdgePoint,
 DVertex, DEdge, LVertex, LGraph, DGraph, LVoidVertex, LVoidEdge, LEdge, LGraphElement, LExtEdge, DGraphElement`;
  // // ... get from export in index.ts
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

