import {
    Dictionary,
    DModelElement,
    DNamedElement,
    DocString,
    LModelElementTransientProperties,
    Pointer,
    PointerTargetable,
    Size,
    U,
    User,
    TargetableProxyHandler,
    store,
    RuntimeAccessibleClass,
    MyProxyHandler,
    LogicContext,
    DAnnotation,
    SetFieldAction, LModelElement, getPath, Proxyfied
} from "../../joiner";

const defaultSize = new Size(0, 0, 200, 200);

export class ViewElement extends PointerTargetable {
    static logic: typeof LViewElement;

    constants?: string; // evalutate 1 sola volta all'applicazione della vista o alla creazione dell'elemento.
    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    jsxString!: string; // l'html template
    usageDeclarations?: string; // example: state
    scalezoomx: boolean = false; // whether to resize the element normally using width-height or resize it using zoom-scale css
    scalezoomy: boolean = false;
    size: Size = defaultSize;
    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    __transient: DViewTransientProperties;

    constructor(jsxString: string, usageDeclarations: string = '', constants: string = '', preRenderFunc: string = '') {
        super();
        this.jsxString = jsxString;
        this.usageDeclarations = usageDeclarations;
        this.constants = constants;
        this.preRenderFunc = preRenderFunc;
        this.__transient = new DViewTransientProperties();
    }
}

export class DViewTransientProperties extends RuntimeAccessibleClass{
    static logic: typeof LViewTransientProperties;
    isSelected: Dictionary<DocString<Pointer<User>>, boolean> = {};
    private: DViewPrivateTransientProperties;
    constructor() {
        super();
        this.private = new DViewPrivateTransientProperties();
    }
}


export class LViewElement extends ViewElement {
    static structure: typeof ViewElement;
    static singleton: LViewElement;

    get___transient(context: LogicContext<MyProxyHandler<this>, this>): LViewTransientProperties {
        return PointerTargetable.wrap<DViewTransientProperties, LViewTransientProperties>(context.data.__transient, context.data,
            // @ts-ignore for $ at end of getpath
            'idlookup.' + context.data.id + '.' + (getPath as LViewElement).__transient.$); }
}

export class LViewTransientProperties extends DViewTransientProperties {
    static structure: typeof DViewTransientProperties;
    static singleton: LViewTransientProperties;

    isSelected: Dictionary<DocString<Pointer<User>>, boolean> = {};
    private!: LViewPrivateTransientProperties;

    get_private(context: LogicContext<TargetableProxyHandler<DViewTransientProperties, this>, this>): LViewPrivateTransientProperties {
        return LViewTransientProperties.wrap(context.data.private, context.proxy.baseObjInLookup, context.proxy.additionalPath + '.private'); }

    get_isSelected(logicContext: LogicContext<TargetableProxyHandler<DViewTransientProperties>, DViewTransientProperties>): Proxyfied<Dictionary> {
        // @ts-ignore for $ at end of getpath
        console.log('GET_ISSELECTED handler func');
        return TargetableProxyHandler.getMap(logicContext.data.isSelected, logicContext, logicContext.proxy.additionalPath + '.' + (getPath as this).isSelected.$);
    }
}

export class DViewPrivateTransientProperties extends RuntimeAccessibleClass{
    static logic: typeof LViewPrivateTransientProperties;

    public size: Size
    constructor(size?: Size) {
        super();
        this.size = size || defaultSize;
    }
}
export class LViewPrivateTransientProperties extends DViewPrivateTransientProperties{
    static structure: typeof DViewPrivateTransientProperties;
    static singleton: LViewPrivateTransientProperties;

}
// shapeless component, receive jsx from redux
// can access any of the redux state, but will usually access 1-2 var among many,
// how can i dynamically mapStateToProps to map only the required ones?

