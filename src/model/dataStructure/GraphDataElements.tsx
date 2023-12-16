// import {Mixin} from "ts-mixer";
import {isDeepStrictEqual} from "util";
import {
    BEGIN,
    Constructors,
    CoordinateMode, Debug,
    Dictionary,
    DMap,
    DModelElement,
    DocString,
    DPointerTargetable,
    DState,
    DUser,
    DViewElement,
    EdgeBendingMode,
    END,
    getWParams,
    GObject,
    GraphElementComponent,
    GraphPoint,
    GraphSize,
    Info, IPoint,
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
    TargetableProxyHandler, TRANSACTION,
    U, Uarr,
    windoww
} from "../../joiner";
import type {RefObject} from "react";
import {EdgeGapMode, InitialVertexSize, InitialVertexSizeObj} from "../../joiner/types";
import {labelfunc} from "../../joiner/classes";
import {Geom} from "../../common/Geom";


console.warn('ts loading graphDataElement');

export const packageDefaultSize = new GraphSize(0, 0, 400, 500);

@Node
@RuntimeAccessible
export class DGraphElement extends DPointerTargetable {
    public static cname: string = "DGraphElement";
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
    state: DMap = {} as any;
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


    public static new(htmlindex: number, model: DGraphElement["model"]|null|undefined, parentNodeID: DGraphElement["father"],
                      graphID: DGraphElement["graph"], nodeID?: DGraphElement["id"]|undefined, a?: any, b?:any, ...c:any): DGraphElement {
        return new Constructors(new DGraphElement('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID, htmlindex).end();
    }

}
@RuntimeAccessible
export class LGraphElement<Context extends LogicContext<DGraphElement> = any, C extends Context = Context> extends LPointerTargetable {
    public static cname: string = "LGraphElement";
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
    graph!: LGraph; // todo: can be removed and accessed by navigating .father
    model?: LModelElement;
    // protected isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>; //  & ((forUser?: Pointer<DUser>) => boolean);

    // containedIn?: LGraphElement;
    subElements!: LGraphElement[]; // shallow, direct subelements
    state!: LMap;
    allSubNodes!: LGraphElement[]; // deep, nested subelements
    x!: number;
    y!: number;
    width!: number;
    height!: number

    z!:number;
    zIndex!: number;
    __info_of_z__: Info = {type:ShortAttribETypes.EInt, txt: "alias for zIndex"};
    __info_of_zIndex__: Info = {type:ShortAttribETypes.EInt,
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
    __info__of__vertex: Info = {type: "LVoidVertex", txt: "the foremost vertex containing this graphElement, or undefiened."}
    __info__of__favoriteNode: Info = {type: ShortAttribETypes.EBoolean,
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

    __info_of__graph: Info = {type:"", txt:""};
    innerGraph!: LGraph;
    __info_of__innnerGraph: Info = {type:"", txt:""};
    outerGraph!: LGraph;
    __info_of__outerGraphGraph: Info = {type:"", txt:""};
    get_graph(context: Context): LGraph { return this.get_innerGraph(context); }

    __info_of__graphAncestors: Info = {type:"LGraph[]",
        txt:"<span>collection of the stack of Graphs containing the current element where [0] is the most nested graph, and last is root graph.</span>"};
    graphAncestors!: LGraph[];

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


    protected _defaultCollectionGetter(c: Context, k: keyof Context["data"]): LPointerTargetable[] { return LPointerTargetable.fromPointer((c.data as any)[k]); }
    protected _defaultGetter(c: Context, k: keyof Context["data"]): any {
        //console.log("default Getter");
        if (k in c.data) {
            let v = (c.data as any)[k];
            if (Array.isArray(v)) {
                if (v.length === 0) return [];
                else if (Pointers.isPointer(v[0] as any)) return this._defaultCollectionGetter(c, k);
                return v;
            } else return v;
        }
        let ret: any;
        let view = this.get_view(c);
        try { ret = (view as any)[k] } catch (e) { Log.ee("Could not find get_ property \"" + k + "\" in node or view.", {c, view, k}); return undefined; }
        return ret;
    }

    protected _defaultSetter(v: any, c: Context, k: keyof Context["data"]): any {
        console.log("default Setter");
        if (k in c.data) {
            let isPointer: boolean;
            if (Array.isArray(v)) {
                if (v.length === 0) isPointer = true; // assumed, should not cause harm if it is not.
                // it will delete remove an entry in pointedBy from all oldValue entries in the array that should not be present anyway.
                // like oldVal.map( id => U.arrayRemove(LData.wrap(id).pointedBy, c.data.this_id)
                else isPointer = Pointers.isPointer(v[0] as any);
            } else isPointer = false;
            return SetFieldAction.new(c.data.id, k as any, v, '', isPointer);
        }
        let view = this.get_view(c);
        try { (view as any)[k] = v; } catch (e) { Log.ee("Could not find set_ property \"" + k + "\" in node or view.", {c, v, k, view}); return false; }
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
        let lcurrent: LGraphElement = LPointerTargetable.fromPointer(context.data.father);
        let dcurrent = lcurrent?.__raw;

        // if no parent, but it's a graph, return itself.
        if (!dcurrent) {
            dcurrent = context.data;
            switch(dcurrent.className){
                case DGraph.cname:
                case DGraphVertex.cname: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LGraph;
                default: return Log.exDevv("node failed to get containing graph", context.data, dcurrent, lcurrent);
            }
        }

        // if it have a parent, iterate parents.
        while(true){
            switch(dcurrent?.className){
                case DGraph.cname:
                case DGraphVertex.cname: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LGraph;
                default:
                    if (!dcurrent.father || dcurrent.id === dcurrent.father) {
                        /*switch(dcurrent.className){
                            case DGraph.name:
                            case DGraphVertex.name: return (lcurrent || LPointerTargetable.fromD(dcurrent)) as LGraph;
                            default: */return Log.exDevv("node failed to get containing graph", context.data, dcurrent, lcurrent);
                        //}
                    }
                    lcurrent = LPointerTargetable.fromPointer(dcurrent.father);
                    dcurrent = lcurrent.__raw;
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
        return (this.get_component(context)?.props.view as this["view"]);
        // return LPointerTargetable.fromPointer(context.data.view);
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
        switch (context.data.className){
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
        /*console.log("get_size("+(this.props?.data as any).name+")", {
            view:this.props.view.getSize(this.props.dataid || this.props.nodeid as string),
            node:this.props.node?.size,
            default: this.props.view.defaultVSize});*/
        let component = this.get_component(context);
        // windoww.debugg = context;
        // console.log("edgee getsize", {component, view:component?.props?.view, data:{...context.data}});
        let view = component?.props?.view || this.get_view(context);
        // (window as any).retry = ()=>view.getSize(context.data.id);
        let ret: GraphSize = view.getSize(context.data.id) as any; // (this.props.dataid || this.props.nodeid as string)
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
        if (context.data.className === DEdgePoint.cname) { ret = (this as any as LEdgePoint).decodePosCoords(context, ret, view); }
/*
        if ((context.data as DVoidVertex).isResized) {
            return ret;
        }*/
        if (!canTriggerSet) {
            if (outerSize) ret = this.get_outerGraph(context).translateSize(ret, this.get_innerGraph(context));
            return ret;
        }
        let html: RefObject<HTMLElement | undefined> | undefined = component?.html;
        let actualSize: Partial<Size> & {w:number, h:number} = html?.current ? Size.of(html.current) : {w:0, h:0};
        let updateSize: boolean = false;
        let isOldElement = (context.data.clonedCounter as number) > 3;
        // if w = 0 i don't auto-set it as in first render it has w:0 because is not reredered and not resized.
        // if (canTriggerSet) this.set_size({w:actualSize.w}, context);
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
    set_size(size: Partial<GraphSize>, c: Context): boolean {
        // console.log("setSize("+(this.props?.data as any).name+") thisss", this);
        if (!size) return false;
        let view = this.get_view(c);
        if (c.data.className === DEdgePoint.cname) size = (this as any as LEdgePoint).encodePosCoords(c as any, size, view);
        if (view.updateSize(c.data.id, size)) return true;
        BEGIN()
        if (size.x !== c.data.x && size.x !== undefined) SetFieldAction.new(c.data.id, "x", size.x, undefined, false);
        if (size.y !== c.data.y && size.y !== undefined) SetFieldAction.new(c.data.id, "y", size.y, undefined, false);
        if (size.w !== c.data.w && size.w !== undefined) SetFieldAction.new(c.data.id, "w", size.w, undefined, false);
        if (size.h !== c.data.h && size.h !== undefined) SetFieldAction.new(c.data.id, "h", size.h, undefined, false);
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
        console.log("isDeepStrictEqual", {isDeepStrictEqual});
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

    get_isResized(context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] { return context.data.isResized; }
    set_isResized(val: DVoidVertex["isResized"], context: LogicContext<DVoidVertex>): DVoidVertex["isResized"] {
        return SetFieldAction.new(context.data.id, "isResized", val);
    }

    get_model(context: Context): this["model"] {
        const modelElementId = $('[id="' + context.data.id + '"]')[0].dataset.dataid;
        const lModelElement: LModelElement = LPointerTargetable.from(modelElementId as string);
        return lModelElement;
    }

    private get_allSubNodes(context: Context, state?: DState): this["allSubNodes"] {
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

    __info_of__isselected: Info = {type: "Dictionary<Pointer<User>, true>",
        txt:<div>A map that contains all the users selecting this element as keys, and always true as a value (if present).
            <br/>Edit it through node.select() and node.deselect()</div>}
    __info_of_select: Info = {type:"function(forUser?:Pointer<User>):void", txt:"Marks this node as selected by argument user."};
    __info_of_deselect: Info = {type:"function(forUser?:Pointer<User>):void", txt:"Un-marks this node as selected by argument user."};
    __info_of_toggleSelect: Info = {type:"function(usr?:Pointer<User>):void", txt:"Calls this.select(usr) if the node is selected by argument user, this.deselect(usr) otherwise. If omitted, argument \"usr\" is the current user id.<br>Returns the result of this.isSelected() after the toggle."};
    __info_of_isSelected: Info = {type:"function(forUser?:Pointer<User>):void", txt:"Tells if this node is selected by argument user."};
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
        return this.cannotSet("graphElement.setstate(): todo"); }



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


@RuntimeAccessible
export class DGraph extends DGraphElement {
    public static cname: string = "DGraph";
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
    subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;
    state: DMap = {} as any;
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
        console.error("getnodes", {dmp, out, matchedidmap, matchedids, allnodesarr});
        return out.$matched;
        // throw new Error("Method not implemented.");
    }

}
var nosize = {x:0, y:0, w:0, h:0, nosize:true};
var defaultEdgePointSize = {x:0, y:0, w:5, h:5};
var defaultVertexSize = {x:0, y:0, w:140.6818084716797, h:32.52840805053711};
@RuntimeAccessible
export class LGraph<Context extends LogicContext<DGraph> = any, D extends DGraph = any> extends LGraphElement {
    public static cname: string = "LGraph";
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
    state!: LMap;
    // personal attributes
    zoom!: GraphPoint;
    graphSize!: GraphSize; // derived attribute: bounding rect containing all subnodes, while "size" is instead external size of the vertex holding the graph in GraphVertexes
    offset!: GraphPoint; // Scrolling position inside the graph

    // get_graphSize(context: LogicContext<DGraph>):  Readonly<GraphSize> { return todo: get bounding rect containing all subnodes.; }
    get_offset(context: LogicContext<DGraph>):  Readonly<GraphSize> {
        return new GraphSize(context.data.offset.x, context.data.offset.y);
    }
    set_offset(val: Partial<GraphPoint>, context: Context): boolean {
        if (!val) val = {x:0, y:0};
        if (context.data.offset.x === val.x && context.data.offset.y === val.y) return true;
        if (val.x === undefined && context.data.offset.x !== val.x) val.x = context.data.offset.x;
        if (val.y === undefined && context.data.offset.y !== val.y) val.y = context.data.offset.y;
        SetFieldAction.new(context.data, "offset", val as GraphPoint);
        return true;
    }
    get_zoom(context: Context): GraphPoint {
        const zoom: GraphPoint = context.data.zoom;
        // (zoom as any).debug = {rawgraph: context.data.__raw, zoomx: context.data.zoom.x, zoomy: context.data.zoom.y}
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
    translateSize<T extends GraphSize|GraphPoint>(ret: T, innerGraph: LGraph): T { return this.wrongAccessMessage("translateSize()"); }
    translateHtmlSize<T extends Size|Point, G = T extends Size ? GraphSize : GraphPoint>(size: T): G { return this.wrongAccessMessage("translateHtmlSize()"); }

    __info_of__zoom: Info = {type:GraphPoint.cname, label:"zoom", txt:"Scales the graph and all subelements by a factor."};
    __info_of__offset: Info = {type:GraphPoint.cname, label:"offset", txt:"In-graph scrolling position."};
    __info_of__graphSize: Info = {type:GraphSize.cname, label:"graphSize", txt:"size internal to the graph, including internal scroll and panning."};
    __info_of__translateSize: Info = {type:"(T, Graph)=>T where T is GraphSize | GraphPoint", txt:"Translates a coordinate set from the local coordinates of a SubGraph to this Graph containing it."};
    __info_of__translateHtmlSize: Info = {type:"(Size|Point) => GraphSize|GraphPoint", txt:"Translate page\'s viewport coordinate set to this graph coordinate set."};
    get_translateHtmlSize<T extends Size|Point, G = T extends Size ? GraphSize : GraphPoint>(c: Context): ((size: T) => G) {
        return (size: T): G => {
            let graphHtmlSize = this.get_htmlSize(c);
            let a = size.subtract(graphHtmlSize.tl(), true);
            let b = a.add({x:c.data.offset.x, y:c.data.offset.y}, false);
            return b.multiply(c.data.zoom, false) as any as G;
        }
    }

    get_translateSize<T extends GraphSize|GraphPoint>(c: Context): ((size: T, innerGraph: LGraph) => T) {
        return (size: T, innerGraph: LGraph): T => {
            innerGraph = LPointerTargetable.wrap(innerGraph) as LGraph;
            let ret: T = (size.hasOwnProperty("w") ? new GraphSize(size.x, size.y, (size as GraphSize).w, (size as GraphSize).h) : new GraphPoint(size.x, size.y)) as T;
            Log.ex(!innerGraph, "translateSize() graph parameter is invalid: "+innerGraph, innerGraph, c);
            let ancestors: LGraph[] = [innerGraph, ...innerGraph.graphAncestors]
            Log.ex(ancestors.indexOf(c.proxyObject) !== -1, "translateSize() graph parameter is invalid: it must be a graph containing the current one.", innerGraph, c);
            for (let g of ancestors) ret.add(g.size.tl(), false);
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


@RuntimeAccessible
export class DVoidVertex extends DGraphElement {
    public static cname: string = "DVoidVertex";
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
    state: DMap = {} as any;
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

@RuntimeAccessible
export class LVoidVertex<Context extends LogicContext<DVoidVertex> = any, C extends Context = Context> extends LGraphElement {// <D extends DVoidVertex = any>
    public static cname: string = "LVoidVertex";
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



}

RuntimeAccessibleClass.set_extend(DGraphElement, DVoidVertex);
RuntimeAccessibleClass.set_extend(LGraphElement, LVoidVertex);
@RuntimeAccessible
export class DEdgePoint extends DVoidVertex { // DVoidVertex
    public static cname: string = "DEdgePoint";
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

    public static new(htmlindex: number, model: DEdgePoint["model"] | undefined, parentNodeID: DEdgePoint["father"], graphID?: DEdgePoint["graph"], nodeID?: DGraphElement["id"],
                      size?: InitialVertexSize): DEdgePoint {
        return new Constructors(new DEdgePoint('dwc'), parentNodeID, true, undefined, nodeID)
            .DGraphElement(undefined, graphID, htmlindex)
            .DVoidVertex(size || defaultEdgePointSize).DEdgePoint().end();
    }

}

@RuntimeAccessible
export class LEdgePoint<Context extends LogicContext<DEdgePoint> = any, C extends Context = Context> extends LVoidVertex {
    public static cname: string = "LEdgePoint";
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

    // from x,y as coords, to x%,y% as % of ((1-val)%*startpt) + ((val)%*endpt)
    public decodePosCoords<T extends Partial<GraphSize> | Partial<GraphPoint>>(c: Context, size: T&any, view: LViewElement, sp0?: GraphPoint, ep0?: GraphPoint): T {
        if (!view) view = this.get_view(c);
        let edgePointCoordMode = view.edgePointCoordMode;
        if (edgePointCoordMode === CoordinateMode.absolute) return size;
        let le: LVoidEdge = c&&c.proxyObject.father;
        // console.log("decodepos:", {le, sp0, lesp:le?.startPoint});
        let sp: GraphPoint = sp0||le.startPoint;
        let ep: GraphPoint = ep0||le.endPoint;
        let ret: any = (("w" in size || "h" in size) ? new GraphSize() : new GraphPoint()); // GObject<Partial<GraphSize>>;
        switch (edgePointCoordMode) {
            default: return Log.exDevv("translatePosCoords() invalid coordinate mode", {mode:edgePointCoordMode, view});
            // case CoordinateMode.absolute: return size;
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
                switch (edgePointCoordMode) {
                    default:
                    case CoordinateMode.relativeOffset: useStart = true; useEnd = true; break;
                    case CoordinateMode.relativeOffsetStart: useStart = true; useEnd = false; break;
                    case CoordinateMode.relativeOffsetEnd: useStart = false; useEnd = true; break;
                }
                // offset = sp - size
                // size = offset - sp
                // in reverse: actualsize = offset, size=offset
                Log.exDev(size.x&&!Array.isArray(size.x) || size.y&&!Array.isArray(size.y),
                    "decoding relative offset require an array size coordinate system. x=[x1, x2] --> x", {size});
                let offsetsp = useStart ? new GraphPoint(size.x[0] + sp.x, size.y[0] + sp.y) : new GraphPoint();
                let offsetep = useEnd ? new GraphPoint(size.x[1] + ep.x, size.y[1] + ep.y) : new GraphPoint();
                // if the start and endpoint of the edge didn't move, offsetsp = offsetep.
                // if they moved, those 2 are discordant --> i pick middle
                offsetsp.add(offsetep, false);
                if (useStart && useEnd) offsetsp.divide(2, false);
                if (size.x !== undefined) ret.x = offsetsp.x;
                if (size.y !== undefined) ret.y = offsetsp.y;
                break;
        }
        if (size.x === undefined) delete ret.x;
        if (size.y === undefined) delete ret.y;
        if ((size as any).w === undefined) delete ret.w; else ret.w = size.w;
        if ((size as any).h === undefined) delete ret.h; else ret.h = size.h;
        // console.log("decode coords", {size, sp, ep, ret});

        return ret;
    }

    public encodePosCoords<T extends Partial<GraphSize> | Partial<GraphPoint>>(c: Context, size: T, view: LViewElement, sp0?: GraphPoint, ep0?: GraphPoint): T {
        if (!view) view = this.get_view(c);
        let edgePointCoordMode = view.edgePointCoordMode;
        if (edgePointCoordMode === CoordinateMode.absolute) return size;
        let le: LVoidEdge = c&&c.proxyObject.father;
        let sp: GraphPoint = sp0 || le.startPoint;//todo: delete sp0, ep0 parameters after testing
        let ep: GraphPoint = ep0 || le.endPoint;
        let ret: any = (("w" in size || "h" in size) ? new GraphSize() : new GraphPoint()); // GObject<Partial<GraphSize>>;
        switch (edgePointCoordMode) {
            default: return Log.exDevv("translatePosCoords() invalid coordinate mode", {mode:edgePointCoordMode, view});
            // case CoordinateMode.absolute: return size;
            case CoordinateMode.relativePercent:
                // let s = this.getBasicSize(c);
                // MATH:
                // size.x = sp.x*x% + ep.x*(1-x%)
                // size.x = sp.x*x% + ep.x - ep.x*x%
                // size.x - ep.x= (sp.x - ep.x)*x%
                // (size.x - ep.x) / (sp.x - ep.x) = x% // actually i inverted <sp, ep> in first equation, so reverse them in result too.
                if (size.x !== undefined) ret.x = (size.x - sp.x) / (ep.x - sp.x);
                if (size.y !== undefined) ret.y = (size.y - sp.y) / (ep.y - sp.y);
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
        return ret;
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

@RuntimeAccessible
export class DVertex extends DGraphElement { // DVoidVertex
    public static cname: string = "DVertex";
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

@RuntimeAccessible
export class LVertex<Context extends LogicContext<any> = any, D = DVertex> extends LVoidVertex {
    public static cname: string = "LVertex";
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
@RuntimeAccessible
export class DGraphVertex extends DGraphElement { // MixOnlyFuncs(DGraph, DVertex)
    public static cname: string = "DGraphVertex";
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
@RuntimeAccessible
export class LGraphVertex<Context extends LogicContext<any> = any, D extends DGraphVertex = any> extends MixOnlyFuncs(LG, LV) { // MixOnlyFuncs(LGraph, LVertex)
    public static cname: string = "LGraphVertex";
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


@RuntimeAccessible
export class DVoidEdge extends DGraphElement {
    public static cname: string = "DVoidEdge";
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

    longestLabel!: PrimitiveType | labelfunc;
    labels!: PrimitiveType[] | labelfunc[];

    public static new(htmlindex: number, model: DGraph["model"]|null|undefined, parentNodeID: DGraphElement["father"], graphID: DGraphElement["graph"],
                      nodeID: DGraphElement["id"]|undefined, start: DGraphElement["id"], end: DGraphElement["id"],
                      longestLabel: DEdge["longestLabel"], labels: DEdge["labels"]): DEdge {
        return new Constructors(new DEdge('dwc'), parentNodeID, true, undefined, nodeID)
            .DPointerTargetable()
            .DGraphElement(model, graphID, htmlindex)
            .DVoidEdge(start, end, longestLabel, labels).end();
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
@RuntimeAccessible
export class EdgeSegment{
    public static cname: string = "EdgeSegment";
    index: number;
    prev: EdgeSegment | undefined;
    start: segmentmaker;
    bezier: segmentmaker[];
    end: segmentmaker;
    length!: number;
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
        if (svgLetter[1]) svgLetter = (svgLetter[0]) as any;
        if (svgLetter === EdgeBendingMode.Bezier_quadratic_mirrored) {
            this.addBezierPoint();
            this.svgLetter = EdgeBendingMode.Bezier_quadratic;
        } else
        if (svgLetter === EdgeBendingMode.Bezier_cubic_mirrored) {
            this.addBezierPoint();
            this.svgLetter = EdgeBendingMode.Bezier_cubic;
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
            case EdgeBendingMode.Bezier_quadratic_mirrored as string:
            case EdgeBendingMode.Bezier_cubic_mirrored as string: // translated to Q or C by adding mirrored bezier points explicitly
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
                if (this.prev && this.prev.end.pt.equals(this.start.pt)) gapMode = EdgeGapMode.average; // if the 2 points coincide, i use any 1 of the gapmodes that are continuous
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
        if (gapMode === EdgeGapMode.autoFill) { gapMode = this.svgLetter === EdgeBendingMode.Line ? EdgeGapMode.lineFill : EdgeGapMode.arcFill; }
        switch (gapMode) {
            case EdgeGapMode.center:
            case EdgeGapMode.average:
            case EdgeGapMode.gap:
                return ""; // should not have filler arcs
            default:
            case EdgeGapMode.autoFill as any:
            case EdgeGapMode.lineFill:
                this.bezier = [];
                this.svgLetter = EdgeBendingMode.Line;
                return super.makeD(index, gapMode);
            case EdgeGapMode.arcFill:
                this.svgLetter = this.svgLetter[0] as EdgeBendingMode;
                if (this.svgLetter === "Q") this.bezier = this.bezier.length ? [this.bezier[0]] : [];
                return super.makeD(index, gapMode);
        }
    }
}


type segmentmaker = {size: GraphSize, view: LViewElement, ge: LGraphElement, pt: GraphPoint, uncutPt: GraphPoint};
@RuntimeAccessible
export class LVoidEdge<Context extends LogicContext<DVoidEdge> = any, D extends DEdge = DEdge> extends LGraphElement {
    public static cname: string = "LVoidEdge";
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
    // containedIn?: LGraphElement;
    subElements!: LGraphElement[];
    start!: LGraphElement;
    end!: LGraphElement;
    __isLVoidEdge!: true;
    midPoints!: InitialVertexSize[]; // the logic part which instructs to generate the midnodes
    midnodes!: LEdgePoint[];
    edge!: LVoidEdge; // returns self. useful to get edge from edgePoints without triggering error if you are already on edge.
    __info_of__edge: Info = {type:"?LEdge", txt:"returns this if called on an edge, the containing edge if called on an EdgePoint, undefined otherwise."}


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


    label!: PrimitiveType;  // should never be read change their documentation in write only. their values is "read" in this.segments
    longestLabel!: PrimitiveType;
    labels!: PrimitiveType[];
    allNodes!: [LGraphElement, ...Array<LEdgePoint>, LGraphElement];
    __info_of__longestLabel: Info = {label:"longest label", type:"text", readType: "PrimitiveType",
        writeType:"PrimitiveType | (e:this, curr: LGraphElement, next: LGraphElement, curr_index: number, allNodes: LGraphElement[]) => PrimitiveType)",
        txt: <span>Label assigned to the longest path segment.</span>}
    __info_of__label: Info = {type: "", txt: <span>Alias for longestLabel</span>};
    __info_of__labels: Info = {label:"multple labels", type: "text",
        writeType: "type of label or Array<type of label>",
        txt: <span>Instructions to label to multiple or all path segments in an edge</span>};
    __info_of__allNodes: Info = {type: "[LGraphElement, ...Array<LEdgePoint>, LGraphElement]", txt: <span>first element is this.start. then all this.midnodes. this.end as last element</span>};


    get_label(c: Context): this["longestLabel"] { return this.get_longestLabel(c); }
    get_longestLabel(c: Context): this["longestLabel"] { return c.data.longestLabel as any; }
    set_longestLabel(val: this["longestLabel"], c: Context): boolean { return SetFieldAction.new(c.data, "longestLabel", val); }
    get_labels(c: Context): this["labels"] { return c.data.labels as any; }
    set_labels(val: this["labels"], c: Context): boolean { return SetFieldAction.new(c.data, "labels", val); }
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
        let zoom: GraphPoint = zoom0 || this.get_graph(c).zoom;
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
        if (!secondIntersection) return Log.exx("failed to intersect edge head", {x4headsize, segment, headPos, c, start, end, useBezierPoints});
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
            case EdgeBendingMode.Bezier_quadratic_mirrored: ret = {first:1, others:1}; break;
            case EdgeBendingMode.Bezier_quadratic:
            case EdgeBendingMode.Bezier_cubic_mirrored: ret = {first:2, others:2}; break;
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

    private get_points_impl(allNodes: LGraphElement[], outer: boolean): segmentmaker[] {
        function getAnchorOffset(size: GraphSize, offset: GraphPoint, isPercentage: boolean) {
            if (!size) size = new GraphSize(0, 0, 0, 0);
            if (isPercentage) offset = new GraphPoint(offset.x/100*(size.w), offset.y/100*(size.h));
            return size.tl().add(offset, false);
        }
        const all: segmentmaker[] = allNodes.flatMap((ge, i) => {
            let base: segmentmaker = {view: ge.view, size: outer ? ge.outerSize : ge.innerSize, ge, pt: null as any, uncutPt: null as any};
            let rets: segmentmaker | undefined;// = base as any;
            let rete: segmentmaker | undefined;// = {...base} as any;
            if (i !== 0){
                rete = {...base};
                rete.pt = (LEdgePoint.singleton as LEdgePoint).get_endPoint(undefined as any, rete.size, rete.view);
                rete.pt = getAnchorOffset(rete.size, rete.view.edgeStartOffset, rete.view.edgeStartOffset_isPercentage);
                rete.uncutPt = rete.pt;
            }
            if (i !== allNodes.length - 1){
                rets = {...base};
                rets.pt = (LEdgePoint.singleton as LEdgePoint).get_startPoint(undefined as any, rets.size, rets.view);
                rets.pt = getAnchorOffset(rets.size, rets.view.edgeStartOffset, rets.view.edgeStartOffset_isPercentage);
                rets.uncutPt = rets.pt;
            }
            // ret.pt = ge.startPoint
            return rets && rete ? [rete, rets] : (rets ? [rets] : [rete as segmentmaker]); }
        );
        return all;
    }
    private get_points(allNodes: LGraphElement[], outer: boolean = false): segmentmaker[]{ return this.get_points_impl(allNodes, outer); }
    private get_points_outer(allNodes: LGraphElement[]): segmentmaker[]{ return this.get_points_impl(allNodes, true); }
    private get_points_inner(allNodes: LGraphElement[]): segmentmaker[]{ return this.get_points_impl(allNodes, false); }
    public d!: string;
    public __info_of__d: Info = {type: ShortAttribETypes.EString, txt:"the full suggested path of SVG path \"d\" attribute, merging all segments."}
    public get_d(c: Context) {
        return this.get_segments(c).all.map(s => s.d).join(" ");
    }/*
    private get_fillingSegments(c: Context): Partial<this["segments"]> {
        return this.get_segments(c).fillers;
    }*/


    public get_segments(c:Context): this["segments"] { return this.get_segments_outer(c); }
    public get_segments_outer(c:Context): this["segments"] { return this.get_segments_impl(c, true); }
    public get_segments_inner(c: Context): this["segments"] { return this.get_segments_impl(c, false); }
    private get_segments_impl(c: Context, outer: boolean): this["segments"] {
        let l = c.proxyObject;
        let v = this.get_view(c);
        let allNodes = l.allNodes;
        windoww.edge = l;
        let all: segmentmaker[] = this.get_points(allNodes, outer);
        //const all: {size: GraphSize, view: LViewElement, ge: LGraphElement}[] = allNodes.map((ge) => { return { view: ge.view, size: ge.size, ge}});
        let ret: EdgeSegment[] = [];
        let bm: EdgeBendingMode = v.bendingMode;
        let gapMode: EdgeGapMode = v.edgeGapMode;
        let segmentSize = this.svgLetterSize(bm, false, true);
        let increase: number = segmentSize.first;
        let segment: EdgeSegment | undefined;
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
        let fillSegments: EdgeSegment[] = [];
        this.snapSegmentsToNodeBorders(c, v, ret, fillSegments);
        let longestLabel = c.data.longestLabel;
        this.setLabels(c, ret, allNodes);
        // console.log("getSegments() labeled:", {main:ret, fillSegments});
        let rett: this["segments"] = {all: [...ret, ...fillSegments], segments: ret, fillers: fillSegments} as any;
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
        if (canCutStart || canCutEnd) // do the for below
            for (let i = 1; i < ret.length; i++){
                prev = ret[i-1];
                curr = ret[i];
                let doStartCut: boolean, doEndCut: boolean;
                switch(gapMode){
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
                            /*
                            fillSegments.push(new FillEdgeSegment( // M <start_gap> C <bez1> <bez2> <end_gap>
                               // <start_gap> = end of last seg (start of gap) <end_gap> = first of curr seg (end of gap)
                            prev.end.pt,
                            EdgeSegment.invertLastBezierPt(prev.end.pt, prev.bezier[prev.bezier.length-1].pt || prev.start.pt),
                            EdgeSegment.invertLastBezierPt(curr.start.pt, curr.bezier[0].pt || curr.end.pt),
                            curr.start.pt)
                            */
                        break;
                    case EdgeGapMode.gap:
                        // just snap to vertex edge         prevSegment.endp and ret.startp
                        doStartCut = true;
                        doEndCut = true;
                        break;
                    // average: todo: maybe rename in join (merges start-end at closest pt to both (avg), then snap on edge)
                    case EdgeGapMode.average:
                        // first move to average of the 2 points in the gap, then snap to edge
                        doEndCut = true; doStartCut = true;
                        // indipendent from cutStart, cutEnd.
                        // they merge if just 1 of cutting sides are true. (and if they are both false we don't even enter the for loop)
                        curr.start.pt.add(prev.end.pt, false).divide(2, false);
                        prev.end.pt = curr.start.pt.duplicate() // intentionally not the same pt because during snap to edge they can temporarly diverge.again,
                        prev.start.uncutPt = prev.start.pt;
                        prev.end.uncutPt = prev.end.pt;
                        break;
                    // center: first move it to center of edgePoint/node, then snap to edge.
                    // this mode might be as well deleted, it can be specified with anchor points
                    case EdgeGapMode.center:
                        doEndCut = false; doStartCut = false;
                        curr.start.pt = curr.start.size.tl().add(curr.start.size.br(), false).divide(2, false);
                        prev.end.pt = curr.start.pt.duplicate(); // intentionally not the same pt because during snap to edge they can diverge.again,
                        prev.start.uncutPt = prev.start.pt; // only update them when point moves without being cut (average and center)
                        prev.end.uncutPt = prev.end.pt;
                        break;
                    default:
                        return Log.exDevv("unexpected EdgeGapMode:" + gapMode);
                }
                if (canCutStart && doStartCut){
                    let extpt: GraphPoint = (curr.bezier[0] || curr.end).pt;
                    ci = GraphSize.closestIntersection(curr.start.size, curr.start.pt, extpt, grid);
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
    protected get_start(context: Context): this["start"] { return LPointerTargetable.from(context.data.start); }
    protected get_end(context: Context): this["end"] { return LPointerTargetable.from(context.data.end); }

}
RuntimeAccessibleClass.set_extend(DGraphElement, DVoidEdge);
RuntimeAccessibleClass.set_extend(LGraphElement, LVoidEdge);
@RuntimeAccessible
export class DEdge extends DVoidEdge { // DVoidEdge
    public static cname: string = "DEdge";
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
    state: DMap = {} as any;
    start!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    end!: Pointer<DGraphElement, 1, 1, LGraphElement>;
    __isDEdge!: true;
    __isDVoidEdge!: true;
    midnodes!: Pointer<DEdgePoint, 1, 1, LEdgePoint>[];

}

@RuntimeAccessible
export class LEdge<Context extends LogicContext<DEdge> = any, D extends DEdge = DEdge> extends LVoidEdge {
    public static cname: string = "LEdge";
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
    public static cname: string = "DExtEdge";
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
    public static cname: string = "LExtEdge";
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
    public static cname: string = "DRefEdge";
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
@RuntimeAccessible
export class LRefEdge extends LEdge {
    public static cname: string = "LRefEdge";
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
