import {
    Dictionary,
    DModelElement,
    DNamedElement,
    DocString,
    Pointer,
    DPointerTargetable,
    Size,
    U,
    DUser,
    TargetableProxyHandler,
    store,
    RuntimeAccessibleClass,
    MyProxyHandler,
    LogicContext,
    DAnnotation, Selectors,
    SetFieldAction, LModelElement, getPath, Proxyfied, GraphSize, defaultVSize, LPointerTargetable, RuntimeAccessible
} from "../../joiner";
import {Mixin} from "ts-mixer";


@RuntimeAccessible
export class DViewElement extends DPointerTargetable {
    static logic: typeof LPointerTargetable;
    bindVertexSizeToView: boolean = true;
    name: string;
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
    appliableToClasses: string[]; // class names: DModel, DPackage, DAttribute...
    subViews: Pointer<DViewElement, 1, 1>[];
    oclApplyCondition: string; // ocl selector
    explicitApplicationPriority: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    defaultVSize: GraphSize;

    constructor(name: string, jsxString: string, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '', preRenderFunc: string = '', appliableToClasses: string[] = [], oclApplyCondition: string = '', priority: number = 1) {
        super();
        this.name = name;
        this.appliableToClasses = appliableToClasses;
        this.jsxString = jsxString;
        this.usageDeclarations = usageDeclarations;
        this.constants = constants;
        this.preRenderFunc = preRenderFunc;
        // this.__transient = new DViewTransientProperties();
        this.subViews = [];
        this.oclApplyCondition = '';
        this.explicitApplicationPriority = priority;
        this.defaultVSize = defaultVSize || new GraphSize(0, 0, 350, 200);
    }
}

@RuntimeAccessible
export class DViewTransientProperties extends RuntimeAccessibleClass{
    static logic: typeof LPointerTargetable;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // private: DViewPrivateTransientProperties;
    constructor() {
        super();
        // this.private = new DViewPrivateTransientProperties();
    }
}


@RuntimeAccessible
export class LViewElement extends Mixin(DViewElement, LPointerTargetable) {
    static structure: typeof DViewElement;
    static singleton: LViewElement;

    set_generic_entry(context: LogicContext<this>, key: string, val: any): boolean {
        console.log('set_generic_entry', {context, key, val});
        new SetFieldAction(context.data, key, val);
        return true;
    }

    set_defaultVSize(val: GraphSize, context: LogicContext<this>): boolean {
        console.log('set_defaultVSize', {context, val});
        return this.set_generic_entry(context, 'defaultVSize', val);
    }
/*
    get___transient(context: LogicContext<this>): LViewTransientProperties {
        return DPointerTargetable.wrap<DViewTransientProperties, LViewTransientProperties>(context.data.__transient, context.data,
            // @ts-ignore for $ at end of getpath
            'idlookup.' + context.data.id + '.' + (getPath as LViewElement).__transient.$); }*/

}

@RuntimeAccessible
export class LViewTransientProperties extends Mixin(DViewTransientProperties, LPointerTargetable) {
    static structure: typeof DPointerTargetable;
    static singleton: LViewTransientProperties;

    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    private!: LViewPrivateTransientProperties;
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

@RuntimeAccessible
export class DViewPrivateTransientProperties extends RuntimeAccessibleClass{
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

}
// shapeless component, receive jsx from redux
// can access any of the redux state, but will usually access 1-2 var among many,
// how can i dynamically mapStateToProps to map only the required ones?

