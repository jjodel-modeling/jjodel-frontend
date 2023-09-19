import {
    Constructors,
    CoordinateMode,
    DGraphElement,
    Dictionary,
    DModelElement,
    DocString,
    DPointerTargetable,
    DViewPoint,
    EdgeBendingMode,
    getWParams,
    GObject,
    GraphPoint,
    GraphSize,
    Info,
    LogicContext,
    LPointerTargetable,
    LViewPoint,
    MyProxyHandler,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    ShortAttribETypes
} from "../../joiner";
import {EdgeGapMode} from "../../joiner/types";

@RuntimeAccessible
export class DViewElement extends DPointerTargetable {
    public static cname: string = "DViewElement";
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LViewElement;
    // static logic: typeof LViewDViewElementElement;
    // static structure: typeof DViewElement;

    // inherited redefine
    // public __raw!: DViewElement;
    id!: Pointer<DViewElement, 1, 1, LViewElement>;


    // own properties
    bindVertexSizeToView: boolean = true;
    name!: string;
    constants?: string; // evalutate 1 sola volta all'applicazione della vista o alla creazione dell'elemento.
    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    jsxString!: string; // l'html template
    usageDeclarations?: string;
    forceNodeType?: DocString<'component name (Vertex, Field, GraphVertex, Graph)'>;
    scalezoomx: boolean = false; // whether to resize the element normally using width-height or resize it using zoom-scale css
    scalezoomy: boolean = false;
    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    // __transient: DViewTransientProperties;
    storeTemporaryPositions: boolean = false; // if true updates vertex position every X millisecond while dragging, if false updates it once when the vertex is released.
    appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
    subViews!: Pointer<DViewElement, 0, 'N', LViewElement>;
    oclApplyCondition!: string; // ocl selector
    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    defaultVSize!: GraphSize;
    adaptHeight!: boolean;// | 'fit-content' | '-webkit-fill-available';
    adaptWidth!: boolean;
    width!: number;
    height!: number;
    draggable!: boolean;
    resizable!: boolean;
    query!: string;
    viewpoint: Pointer<DViewPoint, 0, 1, LViewElement> = '';
    display!: 'block'|'contents'|'flex'|string;
    constraints!: GObject<"todo, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    onDragStart: string = '';
    onDragEnd: string = '';
    onResizeStart: string = '';
    onResizeEnd: string = '';
    bendingMode!: EdgeBendingMode;
    edgeGapMode!: EdgeGapMode;
    //useSizeFrom!: EuseSizeFrom;
    storeSize!: boolean;
    size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>;
    lazySizeUpdate!: boolean;
    __info_of__lazySizeUpdate: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: <div>If true updates the node position only when the drag action is finished.</div>}
    edgeStartOffset!: GraphPoint;
    edgeEndOffset!: GraphPoint;
    edgeStartOffset_isPercentage!: boolean;
    edgeEndOffset_isPercentage!: boolean;
    edgeStartStopAtBoundaries!: boolean;
    edgeEndStopAtBoundaries!: boolean;
    edgePointCoordMode!: CoordinateMode;
    edgeHeadSize!: GraphPoint;
    edgeTailSize!: GraphPoint;

    public static new(name: string, jsxString: string, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclApplyCondition: string = '',
                      priority: number = 1 , persist: boolean = false): DViewElement {
        return new Constructors(new DViewElement('dwc'), undefined, persist, undefined).DPointerTargetable().DViewElement(name, jsxString, defaultVSize, usageDeclarations, constants,
            preRenderFunc, appliableToClasses, oclApplyCondition, priority).end();
    }
    public static new2(name: string, jsxString: string, callback?: (d:DViewElement)=>void, persist: boolean = true): DViewElement {
        return new Constructors(new DViewElement('dwc'), undefined, persist, undefined)
            .DPointerTargetable().DViewElement(name, jsxString).end(callback);
    }
}

@RuntimeAccessible
export class LViewElement<Context extends LogicContext<DViewElement, LViewElement> = any, D extends DViewElement = any>
    extends LPointerTargetable { // MixOnlyFuncs(DViewElement, LPointerTargetable)
    public static cname: string = "LViewElement";

    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LViewElement;
    // static logic: typeof LViewElement;
    // static structure: typeof DViewElement;

    // inherited redefine
    public __raw!: DViewElement;
    id!: Pointer<DViewElement, 1, 1, LViewElement>;


    // own properties
    bindVertexSizeToView!: boolean;
    __info_of__bindVertexSizeToView: Info = {txt: 'empty', isNode: false, isEdge: false, isEdgePoint: false}

    name!: string;
    __info_of__name: Info = {txt: 'empty', isNode: true, isEdge: true, isEdgePoint: true}

    constants?: string; // evalutate 1 sola volta all'applicazione della vista o alla creazione dell'elemento.
    __info_of__constants: Info = {txt: 'empty', isNode: true, isEdge: true, isEdgePoint: true}

    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    __info_of__preRenderFunc: Info = {txt: 'empty', isNode: true, isEdge: true, isEdgePoint: true}

    jsxString!: string; // l'html template
    __info_of__jsxString: Info = {txt: 'empty', isNode: true, isEdge: true, isEdgePoint: true}

    usageDeclarations?: string; // example: state
    __info_of__usageDeclarations: Info = {txt: 'empty', isNode: true, isEdge: true, isEdgePoint: true}

    forceNodeType?: DocString<'component name'>;
    __info_of__forceNodeType: Info = {txt: 'empty', isNode: true, isEdge: false, isEdgePoint: false}

    scalezoomx!: boolean; // whether to resize the element normally using width-height or resize it using zoom-scale css
    __info_of__scalezoomx: Info = {txt: 'empty', isNode: true, isEdge: false, isEdgePoint: false}

    scalezoomy!: boolean;
    __info_of__scalezoomy: Info = {txt: 'empty', isNode: true, isEdge: false, isEdgePoint: false}

    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    // __transient: DViewTransientProperties;
    storeTemporaryPositions!: boolean; // if true updates vertex position every X millisecond while dragging, if false updates it once when the vertex is released.

    appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
    __info_of__appliableToClasses: Info = {txt: 'empty', isNode: true, isEdge: false, isEdgePoint: false}

    subViews!: LViewElement[];
    __info_of__subViews: Info = {txt: 'empty', isNode: true, isEdge: false, isEdgePoint: false}


    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    __info_of__explicitApplicationPriority: Info = {isGlobal: true, type: ShortAttribETypes.EByte,
        txt: 'Application priority of view. If multiple views match an element, the highest priority will render the main jsx,' +
            'lowest priorities will only inject css and secondary jsx decorators (this part is still to do)'}

    defaultVSize!: GraphSize;
    __info_of__defaultVSize: Info = {isNode:true, type: GraphSize, txt: 'Starting size of the node'}

    adaptWidth!: boolean;
    __info_of__adaptWidth: Info = {isNode:true, type: ShortAttribETypes.EBoolean, txt: 'Whether the element should expand his width to accomodate his own contents.'}

    adaptHeight!: boolean;
    __info_of__adaptHeight: Info = {isNode:true, type: ShortAttribETypes.EBoolean, txt: 'Whether the element should expand his height to accomodate his own contents.'}

    draggable!: boolean;
    __info_of__draggable: Info = {type: ShortAttribETypes.EBoolean, isNode: true, txt: 'if the element can be dragged'}

    resizable!: boolean;
    __info_of__resizable: Info = {type: ShortAttribETypes.EBoolean, isNode: true, txt: 'if the element can be resized'}

    oclApplyCondition!: string; // ocl selector
    __info_of__oclApplyCondition: Info = {hidden:true, type: ShortAttribETypes.EString, isGlobal: true, // TODO: what's the difference with this.query?
        txt: 'OCL Query selector to determine which nodes or model elements should apply this view'}

    query!: string;
    __info_of__query: Info = {hidden:true, type: ShortAttribETypes.EString, isGlobal: true, txt: 'OCL Query selector to determine which nodes or model elements should apply this view'}

    viewpoint!: LViewPoint | undefined;
    __info_of__viewpoint: Info = {hidden: true, type: LViewPoint, txt: 'empty'}

    display!: 'block'|'contents';
    __info_of__display: Info = {obsolete: true, isNode: true,
        txt: 'complete css injection instead'}

    onDragStart!: string;
    __info_of__onDragStart: Info = {todo: true, isNode: true,
        txt: 'not supported yet'}

    onDragEnd!: string;
    __info_of__onDragEnd: Info = {todo: true, isNode: true,
        txt: 'not supported yet'}

    onResizeStart!: string;
    __info_of__onResizeStart: Info = {todo: true, isNode: true,
        txt: 'not supported yet'}

    onResizeEnd!: string;
    __info_of__onResizeEnd: Info = {todo: true, isNode: true,
        txt: 'not supported yet'}

    constraints!: GObject<"todo, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    __info_of__constraints: Info = {todo: true, isNode: true,
        txt: 'not supported yet'}


    bendingMode!: EdgeBendingMode;
    __info_of__bendingMode: Info = {isEdge: true, enum: EdgeBendingMode, type: '"L" | "Q" | "C" | "T" | "S" | "A" | "QT" | "CS"',
        txt: <><div>How Svg path should use the EdgePoints <a href={"https://css-tricks.com/svg-path-syntax-illustrated-guide/"}>to bend his shape</a></div></>}

    edgeGapMode!: EdgeGapMode;
    __info_of__edgeGapMode: Info = {isEdge: true, enum: EdgeGapMode, type: '"gap" | "average" | "autoFill" | "lineFill" | "arcFill"',
        txt: <><div>How the segment should treat the EdgePoint interruptions.\n<br/>"gap" leaves an empty space to not overlap the EdgePoint,
            \n<br/>"linefill" makes the edge stop at the EdgePoint borders, but then connects the gap with a line...</div></>}

    storeSize!: boolean;
    __info_of__storeSize: Info = {isNode: true, type: ShortAttribETypes.EBoolean,
        txt: "Active: the node position depends from the view currently displayed.\nInactive: it depends from the graph."}

    lazySizeUpdate!: boolean;
    __info_of__lazySizeUpdate: Info = { isGlobal: true, type: ShortAttribETypes.EBoolean,
        txt: "When activated, the layout position will only be updated once when the drag or resize operation is completed. (best performance)"}

    edgeStartOffset!: GraphPoint;
    __info_of__edgeStartOffset: Info = {isEdge: true, type: GraphPoint, txt: "location where outgoing edges should start their path, relative to top-upper corner of the element."}

    edgeEndOffset!: GraphPoint;
    __info_of__edgeEndOffset: Info = {isEdge: true,  type: GraphPoint, txt: 'same as this.edgeStartOffset'}


    edgeStartOffset_isPercentage!: boolean;
    __info_of__edgeStartOffset_isPercentage: Info = { isEdge: true,
        type:ShortAttribETypes.EBoolean, txt: "Whether edgeStartOffset is an absolute value or a percentage (eg: 50% of top edge, vs 50 pixels on the right)."}

    edgeEndOffset_isPercentage!: boolean;
    __info_of__edgeEndOffset_isPercentage: Info = {isEdge: true,
        type:ShortAttribETypes.EBoolean, txt: "Whether edgeStartOffset is an absolute value or a percentage (eg: 50% of top edge, vs 50 pixels on the right)."}


    edgeStartStopAtBoundaries!: boolean;
    __info_of__edgeStartStopAtBoundaries: Info = {isNode: false, isEdge: true, isEdgePoint: false, type:"GraphPoint", txt: "Whether outgoing edges should cross the node boundaries overlapping the node or stop at them (edge arrows might enter the node if this is on)."}

    edgeEndStopAtBoundaries!: boolean;
    __info_of__edgeEndStopAtBoundaries: Info = {txt: 'empty', isNode: false, isEdge: true, isEdgePoint: false}


    edgePointCoordMode!: CoordinateMode;
    __info_of__edgePointCoordMode: Info = {txt: 'empty', isNode: false, isEdge: true, isEdgePoint: false}


    // edge
    edgeHeadSize!: GraphPoint;
    __info_of__edgeHeadSize: Info = {txt: 'empty', isNode: false, isEdge: true, isEdgePoint: false}

    edgeTailSize!: GraphPoint;
    __info_of__edgeTailSize: Info = {txt: 'empty', isNode: false, isEdge: true, isEdgePoint: false}

    edgeStrokeWidth!: number;
    __info_of__edgeStrokeWidth: Info = {txt: 'empty', isNode: false, isEdge: true, isEdgePoint: false}

    protected size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>; // use getSize, updateSize;


    public get_edgeHeadSize(c: Context): this["edgeHeadSize"] { return new GraphPoint(c.data.edgeHeadSize.x, c.data.edgeHeadSize.y); }
    public get_edgeTailSize(c: Context): this["edgeTailSize"] { return new GraphPoint(c.data.edgeTailSize.x, c.data.edgeTailSize.y); }
    public set_edgeHeadSize(v: Partial<this["edgeHeadSize"]>, c: Context): boolean {
        let s = c.data.edgeHeadSize || new GraphPoint(0, 0);
        if (!("x" in v)) v.x = s.x;
        if (!("y" in v)) v.y = s.y;
        return SetFieldAction.new(c.data.id, "edgeHeadSize", v as GraphPoint, '', false); }
    public set_edgeTailSize(v: Partial<this["edgeTailSize"]>, c: Context): boolean {
        let s = c.data.edgeTailSize || new GraphPoint(0, 0);
        if (!("x" in v)) v.x = s.x;
        if (!("y" in v)) v.y = s.y;
        return SetFieldAction.new(c.data.id, "edgeTailSize", v as GraphPoint, '', false); }

    public get_viewpoint(context: Context): this["viewpoint"] {
        return (context.data.viewpoint || undefined) && (LViewPoint.fromPointer(context.data.viewpoint as Pointer<DViewPoint>));
    }


    public get_subViews(context: Context, key: string): LViewElement[]{
        let subViewsPointers = context.data.subViews;
        let subViews: LViewElement[] = [];
        for(let pointer of subViewsPointers){
            let item: LViewElement = MyProxyHandler.wrap(pointer);
            if(item !== undefined) subViews.push(item);
        }
        return subViews;
    }
    /*
    get_useSizeFrom(context: Context): D["useSizeFrom"] { return context.data.useSizeFrom; }
    set_useSizeFrom(val: D["useSizeFrom"], context: Context): boolean {
        let r: boolean = true;
        BEGIN()
        if (val === EuseSizeFrom.view && !context.data.size) r = SetFieldAction.new(context.data.id, "size", {});
        // NB: se setti val == "both", va letto da Graph[viewid][nodeid] e non da view.
        r = r && SetFieldAction.new(context.data.id,  "useSizeFrom", val, undefined, false);
        END()
        return r; }*/

    // protected get_size(context: Context): D["size"] { return context.data.useSizeFrom === EuseSizeFrom.node ? undefined as any : context.data.size; }
    /* protected set_size(val: D["size"], context: Context): boolean {
        return SetFieldAction.new(context.data.id,  "size", val); }*/

    // returns the delta of change
    public updateSize(id: Pointer<DModelElement> | Pointer<DGraphElement>, size: Partial<GraphSize>): boolean { return this.wrongAccessMessage("updateSize"); }
    public get_updateSize(context: Context): this["updateSize"] {
        return (id: Pointer<DModelElement> | Pointer<DGraphElement>, size: Partial<GraphSize>) => {
            let vp = context.proxyObject.viewpoint;
            if (!context.data.storeSize) {
                if (vp?.storeSize) return vp.updateSize(id, size);
                return false;
            }
            let vsize = context.data.size[id] || vp?.__raw.size[id] || context.data.defaultVSize || vp?.__raw.defaultVSize;
            let newSize: GraphSize = new GraphSize();
            newSize.x = size?.x !== undefined ? size.x : vsize.x;
            newSize.y = size?.y !== undefined ? size.y : vsize.y;
            newSize.w = size?.w !== undefined ? size.w : vsize.w;
            newSize.h = size?.h !== undefined ? size.h : vsize.h;
            if (!newSize.equals(vsize)) SetFieldAction.new(context.data.id, "size." + id as any, newSize);
            return true;
        }
    }

    public get_defaultVSize(context: Context): this["defaultVSize"]{ return context.data.defaultVSize; }
    public getSize(id: Pointer<DModelElement> | Pointer<DGraphElement>): GraphSize | undefined{ return this.wrongAccessMessage("getSize"); }
    public get_getSize(context: Context): ((...a:Parameters<this["getSize"]>)=>ReturnType<LViewElement["getSize"]>) {
        function impl_getSize(id: Pointer<DModelElement> | Pointer<DGraphElement>): ReturnType<LViewElement["getSize"]> {
            let view = context.data;
            let ret: GraphSize;
            if (view.storeSize){
                ret = view.size[id];
                if(ret) return ret; }
            let vp = context.proxyObject.viewpoint;
            if (vp && view.id !== vp.id && vp.storeSize){
                ret = vp.size[id];
                if(ret) return ret; }
            return undefined;
        }

        return impl_getSize; }

    set_generic_entry(context: Context, key: keyof DViewElement, val: any): boolean {
        console.log('set_generic_entry', {context, key, val});
        SetFieldAction.new(context.data, key, val);
        return true;
    }

    get_children(context: Context): never[] { return []; }
    get_bendingMode(context: Context): D["bendingMode"] { return context.data.bendingMode; }
    set_bendingMode(val: D["bendingMode"], context: Context): boolean {
        return this.set_generic_entry(context, 'bendingMode', val);
    }

    get_appliableToClasses(context: Context): this["appliableToClasses"] { return context.data.appliableToClasses || []; }
    set_appliableToClasses(val: this["appliableToClasses"], context: Context): boolean {
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        return this.set_generic_entry(context, "appliableToClasses", val); }

    set_defaultVSize(val: GraphSize, context: Context): boolean {
        console.log('set_defaultVSize', {context, val});
        return this.set_generic_entry(context, 'defaultVSize', val); }
    /*
        get___transient(context: LogicContext<this>): LViewTransientProperties {
            return DPointerTargetable.wrap<DViewTransientProperties, LViewTransientProperties>(context.data.__transient, context.data,
                // @ts-ignore for $ at end of getpath
                'idlookup.' + context.data.id + '.' + (getPath as LViewElement).__transient.$); }*/
}
RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewElement);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewElement);
export type WViewElement = getWParams<LViewElement, DPointerTargetable>;

@RuntimeAccessible
export class DViewTransientProperties extends RuntimeAccessibleClass{
    public static cname: string = "DViewTransientProperties";
    static logic: typeof LPointerTargetable;
    _isDViewTransientProperties!: true;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // private: DViewPrivateTransientProperties;
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, DViewTransientProperties);
@RuntimeAccessible
export class LViewTransientProperties extends LPointerTargetable{
    public static cname: string = "LViewTransientProperties";
    static structure: typeof DPointerTargetable;
    static singleton: LViewTransientProperties;
    _isLViewTransientProperties!: true;

    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // private!: LViewPrivateTransientProperties;
    /*
        get_private(context: LogicContext<DViewTransientProperties>): LViewPrivateTransientProperties {
            return LViewTransientProperties.wrap(context.data.private, context.proxy.baseObjInLookup, context.proxy.additionalPath + '.private'); }*/
    /*
        get_isSelected(logicContext: LogicContext<TargetableProxyHandler<DViewTransientProperties>, DViewTransientProperties>): Proxyfied<Dictionary> {
            // @ts-ignore for $ at end of getpath
            console.log('GET_ISSELECTED handler func');
            return TargetableProxyHandler.getMap(logicContext.data.isSelected, logicContext, logicContext.proxy.additionalPath + '.' + (getPath as this).isSelected.$);
        }*/
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewTransientProperties);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewTransientProperties);
export type WViewTransientProperties = getWParams<LViewTransientProperties, DViewTransientProperties>;

/*

@RuntimeAccessible
export class DViewPrivateTransientProperties extends DPointerTargetable{
    static logic: typeof LViewPrivateTransientProperties;

    public size: GraphSize
    constructor(size?: GraphSize) {
        super();
        this.size = size || defaultVSize;
    }
}

@RuntimeAccessible
export class LViewPrivateTransientProperties extends DViewPrivateTransientProperties{
    static structure: typeof DViewPrivateTransientProperties;
    static singleton: LViewPrivateTransientProperties;

}*/
// shapeless component, receive jsx from redux
// can access any of the redux state, but will usually access 1-2 var among many,
// how can i dynamically mapStateToProps to map only the required ones?

