import {
    Constructors,
    DGraphElement,
    Dictionary,
    DModelElement,
    DocString,
    DPointerTargetable,
    DViewPoint,
    EdgeBendingMode,
    getWParams,
    GObject,
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

@RuntimeAccessible
export class DViewElement extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LViewElement;
    // static logic: typeof LViewElement;
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
    //useSizeFrom!: EuseSizeFrom;
    storeSize!: boolean;
    size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>;
    lazySizeUpdate!: boolean;

    public static new(name: string, jsxString: string, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclApplyCondition: string = '', priority: number = 1 , persist: boolean = false): DViewElement {
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
    name!: string;
    constants?: string; // evalutate 1 sola volta all'applicazione della vista o alla creazione dell'elemento.
    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)

    jsxString!: string; // l'html template
    usageDeclarations?: string; // example: state
    forceNodeType?: DocString<'component name'>;
    scalezoomx!: boolean; // whether to resize the element normally using width-height or resize it using zoom-scale css
    scalezoomy!: boolean;
    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    // __transient: DViewTransientProperties;
    storeTemporaryPositions!: boolean; // if true updates vertex position every X millisecond while dragging, if false updates it once when the vertex is released.
    appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
    subViews!: LViewElement[];
    oclApplyCondition!: string; // ocl selector
    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    defaultVSize!: GraphSize;
    adaptWidth!: boolean;
    adaptHeight!: boolean;
    __info_of__adaptWidth = {type: "boolean", txt: "Whether the element should expand his width to accomodate his own contents."};
    __info_of__adaptHeight = {type: "boolean", txt: "Whether the element should expand his height to accomodate his own contents."};
    draggable!: boolean;
    resizable!: boolean;
    query!: string;
    viewpoint!: LViewPoint | undefined;
    display!: 'block'|'contents';
    onDragStart!: string;
    onDragEnd!: string;
    onResizeStart!: string;
    onResizeEnd!: string;
    constraints!: GObject<"todo, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    bendingMode!: EdgeBendingMode;
    storeSize!: boolean;
    // __info_of__storeSize: Info = {type: ShortAttribETypes.EBoolean, txt:<><div>Whether the node position should depend from the View or the Graph.</div><div>Enabled = share positions on different graphs but changes it if view is changed.</div></>}
    __info_of__storeSize: Info = {type: ShortAttribETypes.EBoolean, txt: "Active: the node position depends from the view currently displayed.\nInactive: it depends from the graph."}
    lazySizeUpdate!: boolean;
    __info_of__lazySizeUpdate: Info = {type: ShortAttribETypes.EBoolean,txt: "When activated, the layout position will only be updated once when the drag or resize operation is completed. (best performance)"}

    protected size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>; // use getSize, updateSize

    get_viewpoint(context: Context): this["viewpoint"] {
        return (context.data.viewpoint || undefined) && (LViewPoint.fromPointer(context.data.viewpoint as Pointer<DViewPoint>));
    }

    get_subViews(context: Context, key: string): LViewElement[]{
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
            SetFieldAction.new(context.data.id, "size." + id as any, newSize);
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
DPointerTargetable.subclasses.push(DViewElement);
LPointerTargetable.subclasses.push(LViewElement);

export type WViewElement = getWParams<LViewElement, DPointerTargetable>;

@RuntimeAccessible
export class DViewTransientProperties extends RuntimeAccessibleClass{
    static logic: typeof LPointerTargetable;
    _isDViewTransientProperties!: true;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // private: DViewPrivateTransientProperties;
}

@RuntimeAccessible
export class LViewTransientProperties extends LPointerTargetable{
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

DPointerTargetable.subclasses.push(DViewTransientProperties);
LPointerTargetable.subclasses.push(LViewTransientProperties);

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

