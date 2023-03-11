import {
    Constructors,
    DocString,
    DPointerTargetable,
    getWParams,
    GraphSize,
    LogicContext,
    LPointerTargetable,
    MyProxyHandler,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction
} from "../../joiner";
import {DViewPoint, LViewPoint} from "../viewPoint/viewpoint";


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
    usageDeclarations?: string; // example: state
    forceNodeType?: DocString<'component name'>;
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
    adaptHeight!: boolean;
    adaptWidth!: boolean;
    width!: number;
    height!: number;
    draggable: boolean = true;
    resizable: boolean = true;
    query: string = '';
    viewpoint: Pointer<DViewPoint, 0, 1, LViewElement> = '';
    display: 'block'|'contents' = 'block';
    onDragStart: string = '';
    onDragEnd: string = '';
    onResizeStart: string = '';
    onResizeEnd: string = '';

    public static new(name: string, jsxString: string, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclApplyCondition: string = '', priority: number = 1): DViewElement {
        return new Constructors(new DViewElement('dwc')).DPointerTargetable().DViewElement(name, jsxString, defaultVSize, usageDeclarations, constants,
            preRenderFunc, appliableToClasses, oclApplyCondition, priority).end();
    }
}

@RuntimeAccessible
export class LViewElement extends LPointerTargetable { // MixOnlyFuncs(DViewElement, LPointerTargetable)
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
    adaptHeight!: boolean;
    adaptWidth!: boolean;
    width!: number;
    height!: number;
    draggable!: boolean;
    resizable!: boolean;
    query!: string;
    viewpoint!: LViewPoint;
    display!: 'block'|'contents';
    onDragStart!: string;
    onDragEnd!: string;
    onResizeStart!: string;
    onResizeEnd!: string;

    get_viewpoint(context: LogicContext<DViewElement>): LViewPoint|undefined {
        const viewpoint = context.data.viewpoint;
        if(viewpoint) { return LViewPoint.fromPointer(viewpoint); }
        else { return undefined; }
    }

    get_subViews(context: LogicContext<DViewElement>, key: string): LViewElement[]{
        let subViewsPointers = context.data.subViews;
        let subViews: LViewElement[] = [];
        for(let pointer of subViewsPointers){
            let item: LViewElement = MyProxyHandler.wrap(pointer);
            if(item !== undefined) subViews.push(item);
        }
        return subViews;
    }
    set_generic_entry(context: LogicContext<DViewElement>, key: string, val: any): boolean {
        console.log('set_generic_entry', {context, key, val});
        SetFieldAction.new(context.data, key as any, val);
        return true;
    }

    set_defaultVSize(val: GraphSize, context: LogicContext<DViewElement>): boolean {
        console.log('set_defaultVSize', {context, val});
        return this.set_generic_entry(context, 'defaultVSize', val);
    }
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

