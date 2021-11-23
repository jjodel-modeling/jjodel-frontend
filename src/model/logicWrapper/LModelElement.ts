import {
    DModelElement,
    Pointer,
    RuntimeAccessibleClass,
    DPointerTargetable,
    DAnnotation,
    DAttribute,
    DClass,
    DClassifier,
    DDataType,
    DEnumerator,
    DEnumLiteral,
    DModel,
    DNamedElement,
    DObject,
    DOperation,
    DPackage,
    DParameter,
    DReference,
    DStructuralFeature,
    DTypedElement,
    DValue,
    SetFieldAction,
    store,
    MyProxyHandler,
    IsActually,
    windoww,
    LViewElement,
    LogicContext,
    SetRootFieldAction,
    LPointerTargetable, MapLogicContext, Log, U, RuntimeAccessible, getPath, DocString, MixOnlyFuncs
} from "../../joiner";
/*
@RuntimeAccessible
export class DMap extends RuntimeAccessibleClass { // useless now
    static logic: typeof RuntimeAccessibleClass;
}* /

@RuntimeAccessible
export class LMap extends DMap { // useless now
    static structure: typeof DMap;
    static singleton: LMap;

    get(context: MapLogicContext, key: string): any { return (context.data)[key]; }

    set(context: MapLogicContext, key: string, val: any): boolean {
        new SetRootFieldAction(context.path + '.' + key, val);
        return true;
    }

}
*/

/*
@RuntimeAccessible
export class LNamedElementProxyHandler extends MyProxyHandler<DNamedElement> {
    // nb: If the set() method returns false, and the assignment happened in strict-mode code, a TypeError will be thrown. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set
    set(targetObj: DModelElement, propKey: string | symbol, value: any, receiver: any): boolean {
        if (propKey in LModelElement.singleton) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.s + propKey in this.lg) return this.lg[this.s + propKey](value, new LogicContext(this, targetObj));
            // se esiste la proprietà ma non esiste il setter, che fare? do errore.

            Log.eDevv("dev error: property exist but setter does not: ", propKey, this);
        }
        return true
    }
    apply(target: DModelElement, thisArg: any, argArray: any[]): any {
        // will i ever use it? dovrei pasare una funzione invece di una classe, quindi in questo caso credo wrappi solo il costruttore
    }
}
*/


/*
@RuntimeAccessible
export class LModelElementTransientProperties extends RuntimeAccessibleClass {
    static structure: typeof DModelElementTransientProperties;
    static singleton: LModelElementTransientProperties;
    // currentView!: LViewElement;

    /*get_currentView(context: LogicContext<MyProxyHandler<DModelElementTransientProperties>, DModelElementTransientProperties>): LViewElement {
        console.error('getCurrentView', context.data);
        return LViewElement.wrap(context.data.currentView);
    }* /
}
*/

function resolvePointersfn <T extends DPointerTargetable = DPointerTargetable, LB=number, UB=string, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>[]): (RET | null)[] {
    return (ptr && ptr.map( p => LModelElement.ResolvePointer<T, LB, UB, RET>(p)) as RET[]) || []; }

function resolvePointerfn<T extends DPointerTargetable = DModelElement, LB=number, UB=number, RET extends LPointerTargetable = LModelElement>(ptr: Pointer<T, LB, UB, RET>): RET | null {
    if (!ptr) return null;
    let obj: DPointerTargetable | LPointerTargetable | undefined = store.getState().idlookup[ptr as string];
    if (!obj) return null;
    if (obj instanceof DModelElement) obj = MyProxyHandler.wrap(obj);
    return obj as RET; }

@RuntimeAccessible
export class LModelElement extends MixOnlyFuncs(DModelElement, LPointerTargetable) {
    static singleton: IsActually<LModelElement>;
    // @ts-ignore
    parent!: LModelElement[];
    // @ts-ignore
    annotations!: LAnnotation[];
    childrens!: LModelElement[]; //LAnnotation[];
    // static proxyHandler: LModelElementProxyHandler = new LModelElementProxyHandler(LModelElement.singleton);
    // [key: string]: any; // uncomment to allow custom properties typed with any while keeping typed existing ones
    /*
        public static init(): void {
            DAnnotation.logic = LAnnotation;
            DModelElement.logic = LModelElement;
            DAttribute.logic = LAttribute;
            DClass.logic = LClass;
            DClassifier.logic = LClassifier;
            DEnumerator.logic = LEnumerator;
            DEnumLiteral.logic = LEnumLiteral;
            DModel.logic = LModel;
            DObject.logic = LObject;
            DOperation.logic = LOperation;
            DPackage.logic = LPackage;
            DParameter.logic = LParameter;
            DReference.logic = LReference;
            DStructuralFeature.logic = LStructuralFeature;
            DValue.logic = LValue;

            LAnnotation.singleton = new LAnnotation();
            LModelElement.singleton = new LModelElement();
            LAttribute.singleton = new LAttribute();
            LClass.singleton = new LClass();
            LClassifier.singleton = new LClassifier();
            LEnumerator.singleton = new LEnumerator();
            LEnumLiteral.singleton = new LEnumLiteral();
            LOperation.singleton = new LOperation();
            LPackage.singleton = new LPackage();
            LParameter.singleton = new LParameter();
            LReference.singleton = new LReference();
            LStructuralFeature.singleton = new LStructuralFeature();
            LValue.singleton = new LValue();
            LModel.singleton = new LModel();
            LObject.singleton = new LObject();
        }*/
    /*static getLclass<D extends DModelElement, L extends typeof LModelElement>(data: DModelElement): typeof LModelElement {
        const l: typeof LModelElement = LModelElement;
        return (data.constructor as typeof DModelElement).logic.singleton
    }*/

    static ResolvePointer = resolvePointerfn;

    private static ResolvePointers? = resolvePointersfn;

    private resolvePointer<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, UB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>): RET | null {
        return LModelElement.ResolvePointer(ptr); }

    private resolvePointers<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, 'N', RET>)
        : (RET | null)[] {
        return resolvePointersfn(ptr); }


/*    _transient!: LModelElementTransientProperties;

    get__transient(context: LogicContext<DModelElement>): LModelElementTransientProperties {
        // @ts-ignore for $ at end of getpath
        return RuntimeAccessibleClass.wrap(context.data._transient, context.data, (getPath as LModelElement)._transient.$);
    }*/


    // todo: per ogni field creo getter e setter che vengono chiamati dal proxy
    get_id(context: LogicContext<this>): string { return context.data.id; }
    set_id(): boolean { return Log.exx('id is read-only', this); }

    get_childrens_idlist(context: LogicContext<DModelElement>): Pointer<DAnnotation, 1, 'N'> {  return context.data.annotations; }
    get_childrens(context: LogicContext<DModelElement>): LModelElement[] { return this.get_childrens_idlist(context).map(e => MyProxyHandler.wrap(e)); }
    set_childrens(): boolean { return Log.exx('childrens is a derived read-only collection', this); }

    add_parent(val: Pointer<DAnnotation> | LModelElement, logicContext: LogicContext<DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent[]', val).fire(); }

    remove_parent(logicContext: LogicContext<DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent', []).fire(); }

    get_parent(context: LogicContext<DModelElement>): LModelElement[] {
        return U.arrayFilterNull(this.resolvePointers(context.data.parent)) as LModelElement[]; }

    set_parent(val: Pointer<DAnnotation> | LModelElement[], logicContext: LogicContext<DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent', val).fire(); }

    // todo: cerca se puoi fare override del += e -=, altrimenti posso chiamarlo con add_annotation = val e remove_annotation = val
    add_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<DNamedElement>): boolean {
        return true;
    }
    remove_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<DNamedElement>): boolean {
        return true;
    }
    get_annotations(context: LogicContext<DModelElement>): (LAnnotation | null)[] {
        return this.resolvePointers<DAnnotation, 1, LAnnotation>(context.data.annotations);
    }

    set_annotations(val: Pointer<DAnnotation>[] | LAnnotation[], logicContext: LogicContext<DNamedElement>): boolean {
        if (!Array.isArray(val)) val = [val];
        // for (const v of val) { if ()}
        // todo: un oggetto proxy DAnnotation che si comporta come LAnnotation come faccio a far ritornare instanceof = true? devo cambiare il getter del __proto__?

        // cambio da LAnnotation a pointer, se erano già pointer verifico l'esistenza
        val = val.map( v => (v instanceof LAnnotation ? v.id : ( isValidPointer(v, DAnnotation) ? v : null ))) as Pointer<DAnnotation>[];
        new SetFieldAction(logicContext.data, 'annotations', val);
        return true;
    }
}

// type UserDefinedClassTODO = Function;
function isValidPointer<T extends DPointerTargetable = DModelElement, LB extends number = 0, UB extends number = 1, RET extends LPointerTargetable = LModelElement>
(p: Pointer<T, LB, UB, RET>, constraintType?: typeof DPointerTargetable): boolean {
    const pointerval: RET | null = LModelElement.ResolvePointer(p);
    if (!pointerval) return false;
    if (!constraintType) return true;
    return (pointerval instanceof constraintType); }

@RuntimeAccessible
export class LAnnotation extends MixOnlyFuncs(DAnnotation, LModelElement) {
    static singleton: IsActually<LAnnotation>;
    get_source(context: LogicContext<this>): string {
        return context.data.source; }
    set_source(val: string, logicContext: LogicContext<this>): boolean {
        new SetFieldAction(logicContext.data, 'source', !!(val as unknown));
        return true; }
}

@RuntimeAccessible
export class LNamedElement extends MixOnlyFuncs(DNamedElement, LModelElement) {
    static structure: typeof DNamedElement;
    static singleton: LNamedElement;
    // private static proxyHandler: DNamedElementProxyHandler = new DNamedElementProxyHandler();
    // [key: string]: any; // uncomment to allow custom properties typed with any while keeping typed existing ones
    // todo: per ogni field creo getter e setter che vengono chiamati dal proxy
    get_name(context: LogicContext<this>): string { return context.data.name; }
    set_name(val: string,  logicContext: LogicContext<this>): boolean {
        if (val.match(/\s/)) val = this.autofix_name(val, logicContext);
        // todo: validate if operation can be completed or need autocorrection, then either return false (invalid parameter cannot complete) or send newVal at redux
        const fixedVal: string = val;
        new SetFieldAction(logicContext.data, 'name', fixedVal);
        return true;
    }
    autofix_name(val: string, logicContext: LogicContext<this>): string {
        // NB: NON fare autofix di univocità nome tra i childrens o qualsiasi cosa dipendente dal contesto, questo potrebbe essere valido in alcuni modelli e invalido in altri e modificare un oggetto condiviso.
        return val.replaceAll(/\s/g, '_');
    }
}

@RuntimeAccessible
export class LTypedElement extends MixOnlyFuncs(DTypedElement, LNamedElement) {
    static structure: typeof DTypedElement;
    static singleton: LTypedElement;

    get_ordered(context: LogicContext<this>): boolean {
        return context.data.ordered; }
    set_ordered(val: boolean, logicContext: LogicContext<this>): boolean {
        new SetFieldAction(logicContext.data, 'ordered', !!(val as unknown));
        return true; }
    get_unique(context: LogicContext<this>): boolean {
        return context.data.unique; }
    set_unique(val: boolean, logicContext: LogicContext<this>): boolean {
        new SetFieldAction(logicContext.data, 'unique', !!(val as unknown));
        return true; }
}

@RuntimeAccessible
export class LClassifier extends MixOnlyFuncs(DClassifier, LNamedElement) {
    static structure: typeof DClassifier;
    static singleton: LClassifier;

    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean; // ?
    required!: boolean; // ?

    get_ordered(context: LogicContext<LModelElement>): boolean {
        return this.ordered; }
    set_ordered(val: boolean, logicContext: LogicContext<DNamedElement>): boolean {
        new SetFieldAction(logicContext.data, 'ordered', !!(val as unknown));
        return true; }
    get_unique(context: LogicContext<LModelElement>): boolean {
        return this.unique; }
    set_unique(val: boolean, logicContext: LogicContext<DNamedElement>): boolean {
        new SetFieldAction(logicContext.data, 'unique', !!(val as unknown));
        return true; }
}

@RuntimeAccessible
export class LPackage extends MixOnlyFuncs(DPackage, LNamedElement) {
    static structure: typeof DPackage;
    static singleton: LPackage;
    // @ts-ignore
    childrens!: (LPackage | LAnnotation)[];
    // @ts-ignore
    subpackages!: LPackage[];
    // @ts-ignore
    classifiers!: LClassifier[];
    // @ts-ignore
    parent!: LModel;

    get_childrens_idlist(context: LogicContext<DPackage>): Pointer<DAnnotation | DPackage | DClassifier, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.subpackages, ...context.data.classifiers]; }
}

@RuntimeAccessible
export class LOperation extends MixOnlyFuncs(DOperation, LTypedElement) {
    static structure: typeof DOperation;
    static singleton: LOperation;

    // @ts-ignore
    // childrens!: (LPackage | LAnnotation)[];
    // @ts-ignore
    parent!: LModel;
    // @ts-ignore
    parameters!: LParameter[];
    // @ts-ignore
    exceptions!: LClassifier[];

    get_childrens_idlist(context: LogicContext<DOperation>): Pointer<DAnnotation | DClassifier | DParameter, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.exceptions, ...context.data.parameters]; }
}

@RuntimeAccessible
export class LParameter extends MixOnlyFuncs(DParameter, LTypedElement) {
    static structure: typeof DParameter;
    static singleton: LParameter;
}

@RuntimeAccessible
export class LClass extends MixOnlyFuncs(DClass, LClassifier) {
    static structure: typeof DClass;
    static singleton: LClass;

    // @ts-ignore
    childrens!: (LAnnotation | LAttribute | LReference | LOperation)[];
    // @ts-ignore
    parent!: LPackage;
    // @ts-ignore
    attributes!: LAttribute[];
    // @ts-ignore
    References!: LReference[];
    // @ts-ignore
    operations!: LOperation[];


    get_childrens_idlist(context: LogicContext<DClass>): Pointer<DAnnotation | DAttribute | DReference | DOperation, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.attributes, ... context.data.references, ...context.data.operations]; }
}

@RuntimeAccessible
export class LDataType extends MixOnlyFuncs(DDataType, LClassifier) {
    static structure: typeof DDataType;
    static singleton: LDataType;
}

@RuntimeAccessible
export class LStructuralFeature extends MixOnlyFuncs(DStructuralFeature, LTypedElement) {
    static structure: typeof DStructuralFeature;
    static singleton: LStructuralFeature;
}

@RuntimeAccessible
export class LReference extends MixOnlyFuncs(DReference, LStructuralFeature) {
    static structure: typeof DReference;
    static singleton: LReference;
}

@RuntimeAccessible
export class LAttribute extends MixOnlyFuncs(DAttribute, LStructuralFeature) {
    static structure: typeof DAttribute;
    static singleton: LAttribute;
}

@RuntimeAccessible
export class LEnumLiteral extends MixOnlyFuncs(DEnumLiteral, LNamedElement) {
    static structure: typeof DEnumLiteral;
    static singleton: LEnumLiteral;
}

@RuntimeAccessible
export class LEnumerator extends MixOnlyFuncs(DEnumerator, LDataType) {
    static structure: typeof DEnumerator
    static singleton: LEnumerator;

    // @ts-ignore
    parent!: LPackage;
    // @ts-ignore
    childrens!: (LAnnotation | LEnumLiteral)[];
    // @ts-ignore
    literals!: LEnumLiteral[];

    get_childrens_idlist(context: LogicContext<DEnumerator>): Pointer<DAnnotation | DEnumLiteral, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.literals]; }
}

@RuntimeAccessible
export class LObject extends MixOnlyFuncs(DObject, LNamedElement) {
    static structure: typeof DObject;
    static singleton: LObject;
}

@RuntimeAccessible
export class LValue extends MixOnlyFuncs(DValue, LModelElement) {
    static structure: typeof DValue;
    static singleton: LValue;
}

@RuntimeAccessible
export class LModel extends MixOnlyFuncs(DModel, LNamedElement) {
    static structure: typeof DModel;
    static singleton: LModel;

    // @ts-ignore
    parent!: never;
    // @ts-ignore
    packages!: LPackage[];
    // @ts-ignore
    // childrens!: (LAnnotation | LPackage)[];

    get_childrens_idlist(context: LogicContext<DModel>): Pointer<DAnnotation | DModel, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.packages]; }

    get_packages(context: LogicContext<DModel>): LPackage[] {
        return context.data.packages.map(p => MyProxyHandler.wrap(p)); }

}
/*
@RuntimeAccessible
export class DTestParent1 extends RuntimeAccessibleClass{
    a1: string;
    constructor(a1: string, arg2auto='arg2autoo') {
        super();
        this.a1 = a1;
        console.log('creation of DTestParent1', {className: this.className, a1, prototype: (this as any).prototype, __proto2__: (this as any).__proto__});
        this.className = (this as any).__proto__.className;
        this.init_constructor(...arguments);

    }
    init_constructor(b0val: string = 'b0val') {
        console.trace('creation of DTestParent1 init', {b0val, thiss: this, className: this.className, prototype: (this as any).prototype, __proto2__: (this as any).__proto__});

        // this.initBase();
        console.log('creation of DTestParent2 init', {className: this.className, arguments, prototype: (this as any).prototype, __proto2__: (this as any).__proto__});
        //@ts-ignore
        this.classNamep1 = (this as any).__proto__.className;
        // @ts-ignore
        this.parent1Initialized = this;
    }
}
/*
@RuntimeAccessible
export class DTestParent2 extends RuntimeAccessibleClass{
    a2: string;
    constructor(a2: string) {
        super();
        this.a2 = a2
        console.log('creation of DTestParent2', {className: this.className, a2, prototype: (this as any).prototype, __proto2__: (this as any).__proto__});
        this.className = (this as any).__proto__.className;
        this.init_constructor(...arguments);
    }
    init_constructor(b0val: string = 'b0val') {
        console.trace('creation of DTestParent2 init', {b0val, thiss: this, className: this.className, prototype: (this as any).prototype, __proto2__: (this as any).__proto__});
        //@ts-ignore
        this.classNamep2 = (this as any).__proto__.className;
        // @ts-ignore
        this.parent2Initialized = this;
    }

}

/*
function MyMixin<A1 extends any[], I1, S1, A2 extends any[], I2, S2>(c1: Class<A1, I1, S1>, c2: Class<A2, I2, S2>): Class<Longest<A1, A2>, I1 & I2, S1 & S2> {
    // @ts-ignore
    console.log('calling mymixin', {c1, c2, thiss:this});
    // @ts-ignore
    let outerthis = this;
    let ret = function (...a:any) {
        // @ts-ignore
        console.log('calling mymixin inner constructor', {c1, c2, outerthis, thiss:this, arguments});
        let ret: any = Mixin(c1, c2);
        ret.init?.();
        ret.init1?.();
        // @ts-ignore
        this.classNameic = {ret, thiss: this} ;// this.__proto__.constructor.name + "_" + ret.constructor.name;
        return new ret(a); }
    ret.prototype.mixinclassname = 'mcn';
    // @ts-ignore
    ret.mixinclassname = 'mcn00';

    // @ts-ignore
    ret.init?.();
    // @ts-ignore
    let rett = new ret(arguments) as any;

    // @ts-ignore
    rett.init?.();
    // @ts-ignore
    this?.init?.();

    // return rett as any;
    let initconstructor = function (...a: any){
        // @ts-ignore
        let ret2=new ret(a);
        ret2.init?.();
        return ret2;
    };
    // @ts-ignore
    let r2: any = initconstructor;
    r2.__proto__ = ret;
    // @ts-ignore
    // r2.prototype = this as any;
    // r2.constructor = initconstructor;
    return r2 as any;
}
function FakeMixin<A1 extends any[], I1, S1, A2 extends any[], I2, S2>(c1: Class<A1, I1, S1>, c2: Class<A2, I2, S2>): Class<Longest<A1, A2>, I1 & I2, S1 & S2> {
    return c1 as any; // function(...args) {}; // la prima classe viene davvero estesa, le altre gli copio i valori
}
* /
// @ts-ignore
@RuntimeAccessible export class DTestChild extends MixOnlyFuncs(DTestParent1, DTestParent2){
    bchild!: string
    constructor(b0val: string = 'b0val') {
        super(b0val);
        this.init_constructor(...arguments);
    }

    init_constructor(b0val: string = 'b0val'): void {
        console.log('children init0', this);
        windoww.temp1 = this;
        this.superclass.DTestParent1.call(this, '111');
        this.superclass.DTestParent2.call(this, '222');
        this.bchild = b0val;
        // @ts-ignore
        this.classNameFromChildren = this.__proto__.className;
        console.log('creation of DTestChild', {className: this.className, prototype: (this as any).prototype, __proto2__: (this as any).__proto__});
    }
}
windoww.dtt = DTestChild;
*/
