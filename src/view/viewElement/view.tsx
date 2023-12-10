import {
    BEGIN,
    Constructors,
    CoordinateMode, CreateElementAction,
    Debug,
    DGraphElement,
    Dictionary,
    DModelElement,
    DocString,
    DPointerTargetable,
    DViewPoint,
    EdgeBendingMode,
    EGraphElements,
    EModelElements,
    END,
    getWParams,
    GObject,
    GraphPoint,
    GraphSize,
    Info,
    Log,
    LogicContext,
    LPointerTargetable,
    LViewPoint,
    MyProxyHandler,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction, SetRootFieldAction,
    ShortAttribETypes, TRANSACTION, U, windoww
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
    name!: string;

    // evaluate 1 sola volta all'applicazione della vista o all'editing del campo
    constants?: string;
    _parsedConstants?: GObject; // should be protected but LView is not subclass

    // evaluate tutte le volte che l'elemento viene aggiornato (il model o la view cambia).
    preRenderFunc!: string;

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
    appliableTo!: 'node'|'edge'|'edgePoint';
    subViews!: Pointer<DViewElement, 0, 'N', LViewElement>;
    oclCondition!: string; // ocl selector
    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    defaultVSize!: GraphSize;
    adaptHeight!: boolean;// | 'fit-content' | '-webkit-fill-available';
    adaptWidth!: boolean;
    width!: number;
    height!: number;
    draggable!: boolean;
    resizable!: boolean;
    viewpoint: Pointer<DViewPoint, 0, 1, LViewElement> = '';
    display!: 'block'|'contents'|'flex'|string;
    constraints!: GObject<"todo, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    onDataUpdate!: string;
    onDragStart!: string;
    onDragEnd!: string;
    whileDragging!: string;
    onResizeStart!: string;
    onResizeEnd!: string;
    whileResizing!: string;
    onRotationStart!: string;
    onRotationEnd!: string;
    whileRotating!: string;
    bendingMode!: EdgeBendingMode;
    edgeGapMode!: EdgeGapMode;
    //useSizeFrom!: EuseSizeFrom;
    storeSize!: boolean;
    size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>;
    lazySizeUpdate!: boolean;
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
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclCondition: string = '',
                      priority: number = 1 , persist: boolean = true): DViewElement {
        return new Constructors(new DViewElement('dwc'), undefined, persist, undefined).DPointerTargetable().DViewElement(name, jsxString, defaultVSize, usageDeclarations, constants,
            preRenderFunc, appliableToClasses, oclCondition, priority).end();
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

    name!: string;
    __info_of__name: Info = {isGlobal: true, type: ShortAttribETypes.EString, txt:<div>Name of the view</div>}

    constants?: string;
    __info_of__constants: Info = {todo:true, isGlobal: true, type: "Function():Object", label:"constants declaration",
        txt:<div>Data used in the visual representation, meant to be static values evaluated only once when the view is first applied.<br/>
        Check default value view for an example.<br/>
    </div>}
    // Example 1: <code>{'{color:"red", background: "gray"}'}</code><br/>
    // Example 2: <code>{'function(){\n    let fib = [1,1]; for (let i = 2; i < 100) { fib[i] = fib[i-2]+fib[i-1]; }\n    return fib; }'}</code><br/>

    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    __info_of__preRenderFunc: Info = {isGlobal: true, obsolete: true, type: "Function():Object", label:"pre-render function",
        txt:<div>Data used in the visual representation, meant to be dynamic values evaluated every time the visual representation is updated.<br/>Replaced by usageDeclarations.</div>}

    jsxString!: string;
    __info_of__jsxString: Info = {isGlobal: true, type: "text", label:"JSX template",
        txt:<div>The main ingredient, a <a href={"https://react.dev/learn/writing-markup-with-jsx"}>JSX template</a> that will be visualized in the graph.</div>}

    usageDeclarations?: string;
    __info_of__usageDeclarations: Info = {todo: false, isGlobal: true, type: "Function():Object", label:"usage declarations",
        txt: <div>Subset of the global or elements's data state that is graphically used.
            <br/>If specified the element will only update when one of those has changed.
            <br/>Can optimize performance and ensure the node is updated even when navigating remote properties that
            <br/>    don\'t belong to this element, like visualizing the name of an object pointed by a reference.
            <br/>Context: it has the usual variables present in a JSX template (data, view, node...)
            <br/>    plus a special variable "ret" where dependencies are registered.{/*and a "state" variable containing the entire application state.*/}
            <br/>Usage Example: see the default view for value.
    </div>}
    get_usageDeclarations(c: Context): this["usageDeclarations"]{
        return c.data.usageDeclarations || "(ret)=>{ // scope contains: data, node, view, constants, state\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "console.log('inside ud default func pre', {ret:{...ret}, data, node, view})\n" +
            "ret.data = data\n" +
            "ret.node = node\n" +
            "ret.view = view\n" +
            "console.log('inside ud default func post', {ret:{...ret}, data, node, view})\n" +
            "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
            // if you want your node re-rendered every time, add a dependency to ret.state = state; or ret.update = Math.random();
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "}";
    }

    forceNodeType?: DocString<'component name'>;
    __info_of__forceNodeType: Info = {isGlobal:true, type: "EGraphElements", enum: EGraphElements, label:"force node type",
        txt:<div>Forces this element to be rendered with your component of choice instead of automatic selection when generated by a &lt;DefaultNode&gt; tag.</div>}

    zoom!: GraphPoint;
    __info_of__zoom: Info = {todo: true, isNode: true, type: GraphPoint.cname, txt:<div>Zooms in or out the element using css scale.</div>}
    /*
    scalezoomx!: boolean; // whether to resize the element normally using width-height or resize it using zoom-scale css
    __info_of__scalezoomx: Info = {isNode: true, isEdge: false, isEdgePoint: false, txt:<div></div>}

    scalezoomy!: boolean;
    __info_of__scalezoomy: Info = {isNode: true, isEdge: false, isEdgePoint: false, txt:<div></div>}*/

    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    // __transient: DViewTransientProperties;

    appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
    __info_of__appliableToClasses: Info = {isGlobal: true, type: "EModelElements | EGraphElements",
        enum: {...EModelElements, ...EGraphElements, cname:"EModelElements | EGraphElements"}, label:"applicable to",
        txt: <div>Do a low priority match with elements of this type.
            <br/>This is just a shortcut with a lower priority than a OCL match.
            <br/>The same result can be obtained through OCL.</div>}

    appliableTo!: 'node'|'edge'|'edgePoint';

    subViews!: LViewElement[];
    __info_of__subViews: Info = {isGlobal: true, hidden: true, type: "DViewElement[]", label:"sub-views",
        txt:<div>Views that are suggested to render elements contained in the current one with a higher match priority.
            <br/>Like a package view giving priority to a specific Class or Enum view to render his contained Classifiers in a common theme.</div>}


    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    __info_of__explicitApplicationPriority: Info = {isGlobal: true, type: ShortAttribETypes.EByte, label:"explicit priority",
        txt: 'Application priority of view. If multiple views match an element, the highest priority will render the main jsx,' +
            'lowest priorities will only inject css and secondary jsx decorators (this part is still to do)'}

    defaultVSize!: GraphSize;
    __info_of__defaultVSize: Info = {isNode:true, type: "GraphSize", label:"default size", txt: 'starting size of the node'}

    adaptWidth!: boolean;
    __info_of__adaptWidth: Info = {isNode:true, type: ShortAttribETypes.EBoolean, label:"adapt width",
        txt: 'Whether the element should expand his width to accomodate his own contents.'}

    adaptHeight!: boolean;
    __info_of__adaptHeight: Info = {isNode:true, type: ShortAttribETypes.EBoolean, label:"adapt height",
        txt: 'Whether the element should expand his height to accomodate his own contents.'}

    draggable!: boolean;
    __info_of__draggable: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: 'if the element can be dragged'}

    resizable!: boolean;
    __info_of__resizable: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: 'if the element can be resized'}

    oclCondition!: string; // ocl selector
    __info_of__oclCondition: Info = {isGlobal: true, hidden:true, label:"OCL apply condition", type: "text", // TODO: what's the difference with this.query?
        txt: 'OCL Query selector to determine which nodes or model elements should apply this view'}

    // todo: how about allowing a view to be part in multiple vp's? so this reference would be an array or removed, and you navigate only from vp to v.
    viewpoint!: LViewPoint | undefined;
    __info_of__viewpoint: Info = {hidden: true, type: LViewPoint.cname, txt: <div>The collection of views containing this one, useful to activate multiple views at once.</div>}

    display!: 'block'|'contents';
    __info_of__display: Info = {obsolete: true, isNode: true, type: ShortAttribETypes.EString,
        txt: 'complete css injection instead'}

    onDragStart!: string;
    __info_of__onDragStart: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node begins being dragged.'}

    onDragEnd!: string;
    __info_of__onDragEnd: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node finishes being dragged.'}

    whileDragging!: string;
    __info_of__whileDragging: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated multiple times when mouse is moved while a node is being dragged.'}

    onResizeStart!: string;
    __info_of__onResizeStart: Info = {isNode: true, type: "Function():void",
    txt: 'Custom event activated when a node begins being resized.'}

    onResizeEnd!: string;
    __info_of__onResizeEnd: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node finishes being resized.'}

    whileResizing!: string;
    __info_of__whileResizing: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated multiple times when mouse is moved while a node is being resized.'}

    onRotationStart!: string;
    __info_of__onRotationStart: Info = {isNode: true, type: "Function():void",
    txt: 'Custom event activated when a node begins being rotated.'}

    onRotationEnd!: string;
    __info_of__onRotationEnd: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node finishes being rotated.'}

    whileRotating!: string;
    __info_of__whileRotating: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated multiple times when mouse is moved while a node is being rotated.'}

    onDataUpdate!: string;
    __info_of__onDataUpdate: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated every time a property of his model, node or view is changed while the element is visibly rendered in a graph.\n<br>Caution! this might cause loops.'}

    constraints!: GObject<"todo, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    __info_of__constraints: Info = {todo: true, isNode: true, type: "Function():void",
        txt: 'not supported yet'}


    bendingMode!: EdgeBendingMode;
    __info_of__bendingMode: Info = {isEdge: true, enum: EdgeBendingMode, type: '"L" | "Q" | "C" | "T" | "S" | "A" | "QT" | "CS"',
        label:"path mode",
        txt: <><div>How Svg path should use the EdgePoints to bend his shape{/*<a href={"https://css-tricks.com/svg-path-syntax-illustrated-guide/"}>to bend his shape</a>*/}</div></>}

    edgeGapMode!: EdgeGapMode;
    __info_of__edgeGapMode: Info = {isEdge: true, enum: EdgeGapMode, type: '"gap" | "average" | "autoFill" | "lineFill" | "arcFill"',
        label:"gap mode",
        txt: <><div>How the segment should treat the EdgePoint interruptions.<br/>"gap" leaves an empty space to not overlap the EdgePoint,
            <br/>"linefill" makes the edge stop at the EdgePoint borders, but then connects the gap with a line.</div></>}

    /*
    bindVertexSizeToView!: boolean;
    __info_of__bindVertexSizeToView: Info = {isNode:true, type:ShortAttribETypes.EBoolean, label:"bind sizes to view",
        txt: <div>Store the vertex size inside the view instead of inside the vertex.
            <br/>This causes the vertex to have different positions according to the view currently appied to it.</div>}*/
    storeSize!: boolean;
    __info_of__storeSize: Info = {isNode: true, type: ShortAttribETypes.EBoolean, label:"bind sizes to view",
        txt: "Active: the node position depends from the view currently displayed.Inactive: it depends from the graph."}

    lazySizeUpdate!: boolean;
    __info_of__lazySizeUpdate: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: <div>If true updates the node position only when the drag action is finished. (best performance)</div>}

    edgeStartOffset!: GraphPoint;
    __info_of__edgeStartOffset: Info = {isEdge: true, type: GraphPoint.cname, label:"start offset",
        txt: "Location where outgoing edges should start their path, relative to top-upper corner of the element."}

    edgeEndOffset!: GraphPoint;
    __info_of__edgeEndOffset: Info = {isEdge: true,  type: GraphPoint.cname, label:"end offset",
        txt: 'Same as this.edgeStartOffset'}


    edgeStartOffset_isPercentage!: boolean;
    __info_of__edgeStartOffset_isPercentage: Info = {isEdge: true, type:ShortAttribETypes.EBoolean, label:"start offset is a %",
        txt: <div>Whether edgeStartOffset is an absolute value or a percentage.<br/>(eg: 50% of element width, vs 50 pixels flat).</div>}

    edgeEndOffset_isPercentage!: boolean;
    __info_of__edgeEndOffset_isPercentage: Info = {isEdge: true, type:ShortAttribETypes.EBoolean, label:"end offset is a %",
        txt: <div>Whether edgeStartOffset is an absolute value or a percentage.<br/>(eg: 50% of element width, vs 50 pixels flat).</div>}


    edgeStartStopAtBoundaries!: boolean;
    __info_of__edgeStartStopAtBoundaries: Info = {isEdge: true, type:ShortAttribETypes.EBoolean, label:"start cannot cross boundaries",
        txt: <div>Whether outgoing edges should cross the node boundaries overlapping the node\'s html or stop at them.<br/>Edge arrows might enter the node if this is on.</div>}

    edgeEndStopAtBoundaries!: boolean;
    __info_of__edgeEndStopAtBoundaries: Info = {isEdge: true, type: ShortAttribETypes.EBoolean, label:"end cannot cross boundaries",
        txt: <div>Whether incoming edges should cross the node boundaries overlapping the node\'s html or stop at them.<br/>Edge arrows might enter the node if this is on.</div>}


    edgePointCoordMode!: CoordinateMode;
    __info_of__edgePointCoordMode: Info = {isEdgePoint: true, type: "CoordinateMode", enum: CoordinateMode, label:"coordinate mode",
        txt:<div>Store coordinates as absolute coordinates or relative to start/end nodes.</div>}

    edgeHeadSize!: GraphPoint;
    __info_of__edgeHeadSize: Info = {isEdge: true, type:GraphPoint.cname, label:"head decorator size", txt:<div>Size of the edge head decorator if present.</div>}

    edgeTailSize!: GraphPoint;
    __info_of__edgeTailSize: Info = {isEdge: true, type:GraphPoint.cname, label:"tail decorator size", txt:<div>Size of the tail head decorator if present.</div>}

    protected size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>; // use getSize, updateSize;
    __info_of__size: Info = {isNode: true, hidden:true, type: ShortAttribETypes.EInt,
        txt:<div>Do not use directly, contains all the sizes stored in this view. use getSize, updateSize instead.</div>}


    __info_of__updateSize: Info = {isNode:true, hidden:true, type:"Function(Pointer<GraphElement | ModelElement>, GraphSize) => GraphSize",
        txt:<div>Updates the size stored in this view for target element.<br/>@returns: the delta of the change between old value and new value.</div>}
    __info_of__getSize: Info = {isNode:true, hidden:true, type:"Function(Pointer<GraphElement | ModelElement>) => GraphSize",
        txt:<div>Gets the size stored in this view for target element.</div>}

    public _parsedConstants!: GObject;
    public get__parsedConstants(c: Context): this['_parsedConstants'] { return c.data._parsedConstants || {}; }

    public get_constants(c: Context): this['constants'] {
        return c.data.constants;
    }


    public static parseConstants(funcCode?: string): GObject | undefined {
        if (!funcCode) return {};
        let parsedConstants: GObject = {};
        let context: GObject = {__param: parsedConstants};
        context.__proto__ = windoww.defaultContext;
        try{
            U.evalInContextAndScopeNew( "("+funcCode+")(this.__param)", context, true, false, false);
        } catch (e: any) {
            Log.w("Attempted to save an invalid view.constant setup. Cause:\n" + e.message.split("\n")[0], e)
            return undefined;
        }
        return parsedConstants;
    }

    public set_constants(value: this['constants'], c: Context): boolean {
        if (value === c.data.constants) return true;
        let parsedConstants: GObject | undefined = LViewElement.parseConstants(value) || {};
        BEGIN();
        SetFieldAction.new(c.data.id, 'constants', value, '', false);
        SetFieldAction.new(c.data.id, '_parsedConstants', parsedConstants, '', false);
        END()
        return true;
    }

    public get_preRenderFunc(c: Context): this['preRenderFunc'] {
        return c.data.preRenderFunc;
    }
    public set_preRenderFunc(value: this['preRenderFunc'], c: Context): boolean {
        const _value = value ? value : '() => {}';
        return SetFieldAction.new(c.data.id, 'preRenderFunc', _value, '', false);
    }

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
            if (typeof id === "object") id = (id as any).id;
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


    get_lazySizeUpdate(context: Context): D["lazySizeUpdate"] { return Debug.lightMode || context.data.lazySizeUpdate; }
    set_lazySizeUpdate(val: D["lazySizeUpdate"], context: Context): boolean {
        return Debug.lightMode || this.set_generic_entry(context, 'lazySizeUpdate', val);
    }

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

    public duplicate(deep: boolean = true): this {
        return this.wrongAccessMessage( (this.constructor as typeof RuntimeAccessibleClass).cname + "duplicate()"); }
    protected get_duplicate(c: Context): ((deep?: boolean) => LViewElement) {
        return (deep: boolean = false) => {
            let lview: LViewElement = undefined as any;
            TRANSACTION( () => {
                const dview: DViewElement = DViewElement.new(`${c.data.name} Copy`, '');
                lview = LPointerTargetable.fromD(dview);
                for (let key in c.data) {
                    if (key !== 'id' && key !== 'name' && key !== "pointedBy") {
                        // @ts-ignore
                        lview[key] = c.data[key];
                    }
                }
                SetRootFieldAction.new('stackViews', dview.id, '+=', true);
            })
            return lview;
        }
    }
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

