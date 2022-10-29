import {
    Dictionary, Pointer, IsActually, GObject, getWParams, Log, SetFieldAction, U
} from "../../joiner";

import {
    RuntimeAccessible,
    DPointerTargetable,
    LPointerTargetable,
    DEdge,
    LEdge, RuntimeAccessibleClass, DRefEdge, LRefEdge, LGraphElement, GraphSize, LogicContext, DVoidVertex,
} from "../../joiner";
import {Mixin} from "ts-mixer";
/*
function resolvePointersFunction<T extends DPointerTargetable = DPointerTargetable, LB=number, UB=string, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>[]): (RET | null)[] {
    return (ptr && ptr.map( p => LModelElement.ResolvePointer<T, LB, UB, RET>(p)) as RET[]) || []; }

function resolvePointerFunction<T extends DPointerTargetable = DModelElement, LB=number, UB=number, RET extends LPointerTargetable = LModelElement>(ptr: Pointer<T, LB, UB, RET>): RET | null {
    if (!ptr) return null;
    let obj: DPointerTargetable | LPointerTargetable | undefined = store.getState().idlookup[ptr as string];
    if (!obj) return null;
    if (obj instanceof DModelElement) obj = MyProxyHandler.wrap(obj);
    return obj as RET; }
*/


@RuntimeAccessible
export class DModelElement extends DPointerTargetable{
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DModelElement, 1, 1, LModelElement>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    constructor() {
        super(false);
        this.className = this.constructor.name;
    }
}

function LarrayToPointers<D extends DPointerTargetable, L extends LPointerTargetable, P extends Pointer> (val: (P | D | L)[] |  (P | D | L)): P[] {
    if (!val) val = [];
    if (!Array.isArray(val)) { val = [val]; }
    if (!val.length) { return []; }
    if ((val[0] as any).id) { val = (val as any as (LModelElement | DModelElement)[]).map( (v) => v.id) as any[]; }
    return val as any[]; }

function toPointer<D extends DPointerTargetable, L extends LPointerTargetable, P extends Pointer> (val: (P | D | L)): P | null { return !val ? null : (val as any).id; }
// todo: add field "childrens" to all L classes

@RuntimeAccessible
export class LModelElement<Context extends LogicContext<DModelElement> = any> extends LPointerTargetable { // extends Mixin(DModelElement0, LPointerTargetable)
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    /*static ResolvePointer = resolvePointerFunction;
    private static ResolvePointers? = resolvePointersFunction;
    private resolvePointer<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, UB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>): RET | null {
        return LModelElement.ResolvePointer(ptr); }
    private resolvePointers<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, 'N', RET>)
        : (RET | null)[] { return resolvePointersFunction(ptr); }
    */
    public __raw!: DModelElement;
    id!: Pointer<DModelElement, 1, 1, LModelElement>;

    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    childrens!: (LPackage | LClassifier | LTypedElement | LAnnotation)[];


    // not necessary: there is a default getter get_id(context: LogicContext<this>): string { return context.data.id; }
    set_id(): boolean { return Log.exx('id is read-only', this); }

    get_childrens_idlist(context: LogicContext<DModelElement>): Pointer<DModelElement, 0, 'N', LModelElement> { // LPackage | LClassifier | LTypedElement | LAnnotation
        return [...context.data.annotations];
    }
    get_childrens(context: Context): LModelElement[] {
        // return this.get_childrens_idlist(context).map(e => LPointerTargetable.from(e));
        return LPointerTargetable.from(this.get_childrens_idlist(context));
    }
    set_childrens(a: never): boolean { return Log.exx('childrens is a derived read-only collection', this); }


    add_parent(val: Pointer<DAnnotation> | LModelElement, logicContext: Context): boolean {
        return SetFieldAction.new(logicContext.data, 'parent[]', val); // todo: need to update childrens of the old and new parents
    }

    remove_parent(logicContext: LogicContext<DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent', []).fire();
    }
    get_parent(context: LogicContext<DModelElement>): LModelElement[] {
        return U.arrayFilterNull(this.resolvePointers(context.data.parent)) as LModelElement[];
    }

    set_parent(val: (LModelElement | DModelElement | Pointer<DModelElement>)[], context: LogicContext<DModelElement, LModelElement>): boolean {
        val = toPointers(val) as Pointer<DModelElement>[];
        return new SetFieldAction(context.data, 'parent', val).fire();
    }


    add_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<DNamedElement>): boolean {
        return true;
    }
    remove_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<DNamedElement>): boolean {
        return true;
    }
    get_annotations(context: LogicContext<DModelElement>): (LAnnotation | null)[] {
        return this.resolvePointers<DAnnotation, 1, LAnnotation>(context.data.annotations);
    }

    set_annotations(val: Pointer<DAnnotation>[] | LAnnotation[] | DAnnotation[], logicContext: LogicContext<DNamedElement>): boolean {
        if (!Array.isArray(val)) val = [val];
        val = val.map( v => (v instanceof LAnnotation ? v.id : ( isValidPointer(v, DAnnotation) ? v : null ))) as Pointer<DAnnotation>[];
        new SetFieldAction(logicContext.data, 'annotations', val);
        return true;
    }

    remove(context: LogicContext): void {
        new DeleteElementAction(context.data);
    }

    get_addChild(context: LogicContext<any>): (type:string) => void {
        return (type) => {
            switch ((type || '').toLowerCase()){
                default: Log.ee('cannot find children type requested to add:', {type: (type || '').toLowerCase(), context}); break;
                case "attribute": return this.get_addAttribute(context);
                case "class": return this.get_addClass(context);
                case "package": return this.get_addPackage(context);
                case "reference": return this.get_addReference(context);
                case "enumerator": return this.get_addEnumerator(context);
                case "literal": return this.get_addEnumLiteral(context);
            }
        }
    }

    get_addPackage(context: LogicContext<any>): (() => void) {
        let ret = () => {};
        switch (context.data?.className) {
            default: break;
            case "DModel": ret = () => LModelElement.addPackage(context.data); break;
            case "DPackage": ret = () => LModelElement.addSubPackage(context.data); break;
        }
        ret();
        return ret;
    }

    private static addPackage(dModel: DModel): void {
        const lModel: LModel = MyProxyHandler.wrap(dModel);
        let name = 'package_' + 0;
        let childrenNames: (string)[] = lModel.childrens.map( p => (p as LPackage).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
        const dPackage = new DPackage(name);
        dPackage.parent = [dModel.id];
        dPackage.father = dModel.id;
        LModelElement.addPackage_(dModel, dPackage);
    }

    private static addSubPackage(dPackage: DPackage): void {
        const lPackage: LPackage = MyProxyHandler.wrap(dPackage);
        let name = 'subpackage_' + 0;
        let childrenNames: (string)[] = lPackage.childrens.map( p => (p as LPackage).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
        const dSubPackage = new DPackage(name);
        dSubPackage.parent = [dPackage.id];
        dSubPackage.father = dPackage.id;
        LModelElement.addSubPackage_(dPackage, dSubPackage);
    }

    get_addClass(context: LogicContext<DPackage>): () => void {
        const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data as DPackage : null;
        let ret = () => {};
        if (dPackage) {
            const lPackage: LPackage = MyProxyHandler.wrap(dPackage);
            let name = 'class_' + 0;
            let childrenNames: (string)[] = lPackage.childrens.map( c => (c as LClassifier).name);
            name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
            const dClass = new DClass(name);
            dClass.parent = [dPackage.id];
            dClass.father = dPackage.id;
            ret = () => LModelElement.addClass_(dPackage, dClass);
        }
        ret();
        return ret;
    }

    get_addAttribute(context: LogicContext<DClass>): () => void {
        let ret = () => {};
        const  dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
        if (dClass) {
            const lClass: LClass = MyProxyHandler.wrap(dClass);
            let name = 'attribute_' + 0;
            let childrenNames: (string)[] = lClass.childrens.map( c => (c as LStructuralFeature).name);
            name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0);
            const dAttribute = new DAttribute(name);
            dAttribute.parent = [dClass.id];
            dAttribute.father = dClass.id;
            const lString: LPointerTargetable = MyProxyHandler.wrap(Selectors.getFirstPrimitiveTypes());
            dAttribute.type = lString.id;
            U.addPointerBy(lString, dAttribute);
            ret = () => LModelElement.addAttribute_(dClass, dAttribute);
        }
        ret();
        return ret;
    }

    get_addReference(context: LogicContext<DClass>): (() => void) {
        let ret = () => {};
        const dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
        if(dClass) {
            const lClass: LClass = MyProxyHandler.wrap(dClass);
            let name = 'reference_' + 0;
            const childrenNames: (string)[] = lClass.childrens.map( c => (c as LNamedElement).name);
            name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
            const dReference = new DReference(name);
            dReference.parent = [dClass.id];
            dReference.father = dClass.id;
            dReference.type = dClass.id;

            //todo: fix constructor with properly graphid and nodeid(?)
            const dRefEdge: DRefEdge = new DRefEdge(false, undefined, "");
            dRefEdge.start = dReference.id;
            dRefEdge.end = dClass.id;

            U.addPointerBy(lClass, dReference);
            ret = () => LModelElement.addReference_(dClass, dReference, dRefEdge);
        }
        ret();
        return ret;
    }

    get_addEnumerator(context: LogicContext<DPackage>): () => void {
        let ret = () => {};
        const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data : null;
        if(dPackage) {
            const lPackage: LPackage = MyProxyHandler.wrap(dPackage);
            let name = 'enum_' + 0;
            const childrenNames: (string)[] = lPackage.childrens.map( c => (c as LNamedElement).name);
            name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
            const dEnumerator = new DEnumerator(name);
            dEnumerator.parent = [dPackage.id];
            dEnumerator.father = dPackage.id;
            ret = () => LModelElement.addEnumerator_(dPackage, dEnumerator);
        }
        ret();
        return ret;
    }

    get_addEnumLiteral(context: LogicContext<DEnumerator>): () => void {
        let ret = () => {};
        const dEnum: DEnumerator | null = (context.data?.className === "DEnumerator") ? context.data : null;
        if(dEnum) {
            const lEnum: LEnumerator = MyProxyHandler.wrap(dEnum);
            let name = 'literal_' + 0;
            const childrenNames: (string)[] = lEnum.childrens.map(c => (c as LNamedElement).name);
            name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
            const dLiteral = new DEnumLiteral(name);
            dLiteral.parent = [dEnum.id];
            dLiteral.father = dEnum.id;
            ret = () => LModelElement.addEnumLiteral_(dEnum, dLiteral);
        }
        ret();
        return ret;
    }

    // activated by user in JSX
    addClass(): void { Log.exDevv('addClass should never be called directly, but should trigger get_addClass(), this is only a signature for type checking.'); }
    addPackage(): void { Log.exDevv('addPackage should never be called directly, but should trigger get_addClass(), this is only a signature for type checking.'); }
    addAttribute(): void { Log.exDevv('addAttribute should never be called directly, but should trigger get_addAttribute(), this is only a signature for type checking.'); }
    addReference(): void { Log.exDevv('addReference should never be called directly, but should trigger get_addReference(), this is only a signature for type checking.'); }
    addEnumerator(): void { Log.exDevv('addEnumerator should never be called directly, but should trigger get_Enumerator(), this is only a signature for type checking.'); }
    addEnumLiteral(): void { Log.exDevv('addLiteral should never be called directly, but should trigger get_Literal(), this is only a signature for type checking.'); }
    addChild(type: string): void { Log.exDevv('addAttribute("'+type+'") should never be called directly, but should trigger get_addAttribute(), this is only a signature for type checking.'); }

    private static addReference_(dClass: DClass, dReference: DReference, dRefEdge: DRefEdge): void {
        new CreateElementAction(dReference);
        new SetFieldAction(dClass, "references+=", dReference.id);
        new CreateElementAction(dRefEdge);
        new SetRootFieldAction("refEdges+=", dRefEdge.id);
    }
    private static addAttribute_(dClass: DClass, dAttribute: DAttribute): void {
        new CreateElementAction(dAttribute);
        new SetFieldAction(dClass, 'attributes+=', dAttribute.id);
    }
    private static addClass_(dPackage: DPackage, dClass: DClass): void {
        new CreateElementAction(dClass);
        new SetFieldAction(dPackage, 'classifiers+=', dClass.id);
    }
    private static addPackage_(dModel: DModel, dPackage: DPackage): void {
        new CreateElementAction(dPackage);
        new SetFieldAction(dModel, 'packages+=', dPackage.id);
    }
    private static addSubPackage_(dPackage: DPackage, dSubPackage: DPackage): void {
        new CreateElementAction(dSubPackage);
        new SetFieldAction(dPackage, 'subpackages+=', dSubPackage.id);
    }
    private static addEnumerator_(dPackage: DPackage, dEnumerator: DEnumerator): void {
        new CreateElementAction(dEnumerator);
        new SetFieldAction(dPackage, 'classifiers+=', dEnumerator.id);
    }
    private static addEnumLiteral_(dEnum: DEnumerator, dLiteral: DEnumLiteral): void {
        new CreateElementAction(dLiteral);
        new SetFieldAction(dEnum, "literals+=", dLiteral.id);
    }

    changeAttributeType(newType: string): void {}
    changeReferenceType(newType: string): void {}
    changeType(newType: string): void {}

    get_changeType(context: LogicContext<any>): (newType: string) => void {
        const classname = context.data.className;
        return (newType) => {
            switch (classname){
                default: alert(`You can't call changeType on ${classname}`); break;
                case "DAttribute": return this.get_changeAttributeType(context, newType);
                case "DReference": return this.get_changeReferenceType(context, newType);
            }
        }
    }
    get_changeAttributeType(context: LogicContext<DAttribute>, newType: string): () => void {
        let ret = () => {};
        const dAttribute: DAttribute = context.data;
        const dOldClassifier: DClassifier = Selectors.getDElement<DClassifier>(dAttribute.type as string);
        const dNewClassifier: DClassifier = Selectors.getDElement<DClassifier>(newType);
        //const index: number = dOldClassifier.pointedBy.indexOf(dAttribute.id);
        ret = () => {
            new SetFieldAction(dAttribute, "type", newType);
            new SetFieldAction(dOldClassifier, "pointedBy", U.removeFromList(dOldClassifier.pointedBy, dAttribute.id));
            //new SetFieldAction(dOldClassifier, `pointedBy.${index}-=`, undefined);
            new SetFieldAction(dNewClassifier, "pointedBy+=", dAttribute.id);
        };
        ret();
        return ret;
    }
    //move to LRef? yes
    get_changeReferenceType(context: LogicContext<DReference>, newType: string): () => void {
        let ret = () => {};
        const dReference: DReference = context.data;
        const dOldClass: DClass = Selectors.getDElement<DClass>(dReference.type as string);
        const dNewClass: DClass = Selectors.getDElement<DClass>(newType);
        const dRefEdge: DRefEdge | undefined = U.getReferenceEdge(dReference);
        ret = () => {
            new SetFieldAction(dReference, "type", newType);
            new SetFieldAction(dOldClass, "pointedBy", U.removeFromList(dOldClass.pointedBy, dReference.id));
            //new SetFieldAction(dOldClass, "pointedBy-=", dOldClass.pointedBy.indexOf(dReference.id))
            new SetFieldAction(dNewClass, "pointedBy+=", dReference.id);
            if(dRefEdge) {
                new SetFieldAction(dRefEdge, "end", newType);
            }
        };
        ret();
        return ret;
    }


    //delete
    delete(): void {}
}

//dam: questa cosa non va bene. instanceof non te lo prende sempre corretto, quando serializzi e deserializzi perde il prototype.
function isValidPointer<T extends DPointerTargetable = DModelElement, LB extends number = 0, UB extends number = 1, RET extends LPointerTargetable = LModelElement>
(p: Pointer<T, LB, UB, RET>, constraintType?: typeof DPointerTargetable): boolean {
    const pointerval: RET | null = LModelElement.ResolvePointer(p);
    if (!pointerval) return false;
    if (!constraintType) return true;
    return (pointerval instanceof constraintType); }

/* todo:
nel proxy aggiungi regola di default, se prendi qualcosa che inizia con "set_X" esplicitamente (dovrebbe farlo solo il dev)
richiama _set_X(context, ...params)     <---- nuova funzione set di default, anche this.x = x richiama _set_x

il dev specifica set_x come public di sola firma senza implementazione (throw exception) e senza context
il dev specifica _set_x come implementazione private

per la get esiste solo _get_x, non "get_x"

 todo2: aggiungi readonly a tutti i campi L per non sbagliarsi e fare in modo che il dev usi sempre i "set_" che sono correttamente tipizzati
*
* */

/*todo:
* for every feature X: typed L, in CLASS_L0 with a side effects when they are edited (like need to update other data for consistency)
*
* dev will use this
* public set_X(val: D | L | Pointer<D> ) { throw new Error("set_X should never be executed, the proxy should redirect to get_set_X."); }
* public get_set_X( val: D | L | Pointer<D>, otherparams, LogicContext<D>) { throw new Error("set_X should never be executed, the proxy should redirect to get_set_X."); }
*
*
* */
// @RuntimeAccessible export class _WModelElement extends LModelElement { }
// export type WModelElement = DModelElement | LModelElement | _WModelElement;
DPointerTargetable.subclasses.push(DModelElement);
DPointerTargetable.subclasses.push(LModelElement);






@RuntimeAccessible
export class DAnnotation extends DPointerTargetable { // extends Mixin(DAnnotation0, DModelElement)
    // static singleton: LAnnotation;
    // static logic: typeof LAnnotation;
    // static structure: typeof DAnnotation;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // inherit redefine
    id!: Pointer<DAnnotation, 1, 1, LAnnotation>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    source!: string;
    details: Dictionary<string, string> = {};
}

@RuntimeAccessible
export class LAnnotation extends LModelElement { // Mixin(DAnnotation0, LModelElement)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DAnnotation;
    id!: Pointer<DAnnotation, 1, 1, LAnnotation>;
    // static singleton: LAnnotation;
    // static logic: typeof LAnnotation;
    // static structure: typeof DAnnotation;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    source!: string;
    details: Dictionary<string, string> = {};

    get_source(context: LogicContext<this>): string {
        return context.data.source; }
    set_source(val: string, logicContext: LogicContext<DAnnotation>): boolean {
        SetFieldAction.new(logicContext.data, 'source', !!(val as unknown));
        return true; }
}

@RuntimeAccessible class _WAnnotation extends LModelElement{ //extends _WModelElement {
    source!: Parameters<LAnnotation["set_source"]>[0];
}

// export type WAnnotation = DAnnotation | LAnnotation | _WAnnotation;
DModelElement.subclasses.push(DAnnotation);
LModelElement.subclasses.push(LAnnotation);
// todo no: Proxyclass con i get/set che viene istanziata once come singleton senza structure static. copia L con tutto ma non può esistere. quindi unica soluzione de-tipizza singleton e structure

// search typescript typing proxy












@RuntimeAccessible
export class DNamedElement extends DPointerTargetable { // Mixin(DNamedElement0, DAnnotation)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LNamedElement;
    // static logic: typeof LNamedElement;
    // static structure: typeof DNamedElement;

    // inherit redefine
    id!: Pointer<DNamedElement, 1, 1, LNamedElement>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    name: string = '';
    constructor(name: string = ''){
        super();
        this.name = name;
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export class LNamedElement extends LModelElement { // Mixin(DNamedElement0, DAnnotation)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DNamedElement;
    id!: Pointer<DNamedElement, 1, 1, LNamedElement>;
    // static singleton: LNamedElement;
    // static logic: typeof LNamedElement;
    // static structure: typeof DNamedElement;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    name!: string;

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
// @RuntimeAccessible export class _WNamedElement extends _WModelElement { }
// export type WNamedElement = DNamedElement | LNamedElement | _WNamedElement;
DModelElement.subclasses.push(DNamedElement);
LModelElement.subclasses.push(LNamedElement);














@RuntimeAccessible
export class DTypedElement extends DPointerTargetable { // Mixin(DTypedElement0, DNamedElement)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LTypedElement;
    // static logic: typeof LTypedElement;
    // static structure: typeof DTypedElement;

    // inherit redefine
    id!: Pointer<DTypedElement, 1, 1, LTypedElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    name: string = '';
    // personal
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean; // ?
    required!: boolean; // ?
}

@RuntimeAccessible
export class LTypedElement extends LNamedElement { // extends Mixin(DTypedElement0, LNamedElement)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DTypedElement;
    id!: Pointer<DTypedElement, 1, 1, LTypedElement>;
    // static singleton: LTypedElement;
    // static logic: typeof LTypedElement;
    // static structure: typeof DTypedElement;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    type!: LClassifier;
    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;



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
// @RuntimeAccessible export class _WTypedElement extends _WNamedElement { }
// export type WTypedElement = DTypedElement | LTypedElement | _WTypedElement;
DNamedElement.subclasses.push(DTypedElement);
LNamedElement.subclasses.push(LTypedElement);





@RuntimeAccessible
export /*abstract*/ class DClassifier extends DPointerTargetable { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LClassifier;
    // static logic: typeof LClassifier;
    // static structure: typeof DClassifier;

    // inherit redefine
    id!: Pointer<DClassifier, 1, 1, LClassifier>;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    // personal
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
}

@RuntimeAccessible
export class LClassifier extends LNamedElement { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DClassifier;
    id!: Pointer<DClassifier, 1, 1, LClassifier>;
    // static singleton: LClassifier;
    // static logic: typeof LClassifier;
    // static structure: typeof DClassifier;

    // inherit redefine
    parent!: LPackage[];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue!: LObject;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;

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
// @RuntimeAccessible export class _WClassifier extends _WNamedElement { }
// export type WClassifier = DClassifier | LClassifier | _WClassifier;
DNamedElement.subclasses.push(DClassifier);
LNamedElement.subclasses.push(LClassifier);






@RuntimeAccessible
export class DPackage extends DPointerTargetable { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LPackage;
    // static logic: typeof LPackage;
    // static structure: typeof DPackage;

    // inherit redefine
    id!: Pointer<DPackage, 1, 1, LPackage>;
    parent: Pointer<DPackage | DModel, 0, 'N', LPackage | LModel> = [];
    father!: Pointer<DPackage | DModel, 1, 1, LPackage | LModel>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    // personal
    classifiers: Pointer<DClass, 0, 'N', LClass> = [];
    subpackages: Pointer<DPackage, 0, 'N', LPackage> = [];
    uri: string;
    constructor(name: string = '', uri: string = '') {
        super(name);
        this.uri = uri;
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export class LPackage extends LNamedElement { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DPackage;
    id!: Pointer<DPackage, 1, 1, LPackage>;
    // static singleton: LPackage;
    // static logic: typeof LPackage; todo: fixa questo con una funzione statica fuori dalle classi con tipo condizionale incasinato che gli dai costruttore e ti ridà istanza  getSingleton(LPackage)
    // static structure: typeof DPackage;
    // inherit redefine
    parent!: LPackage[];  // ype 'LPackage' is missing the following properties from type 'LModelElement': get_set_parent, set_parent
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    classifiers!: LClass[];
    subpackages!: LPackage[];
    uri: string;
    constructor(name: string = '', uri: string = '') {
        super(name);
        this.uri = uri;
        this.className = this.constructor.name;
    }

    get_childrens_idlist(context: LogicContext<DPackage>): Pointer<DAnnotation | DPackage | DClassifier |DEnumerator, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.subpackages, ...context.data.classifiers]; }

    get_delete(context: LogicContext<DPackage>): () => void {
        let ret = () => {};
        const dPackage: DPackage = context.data;
        const dFather: (DModel | DPackage) & GObject = Selectors.getDElement<DModel>(dPackage.father);
        const children = new Set([...dPackage.classifiers, ...dPackage.subpackages]);
        for(let dChild of children) {
            const lChild: LClass | LEnumerator | LPackage = MyProxyHandler.wrap(dChild);
            lChild.delete();
        }
        if(dFather.className === "DModel") {
            ret = () => {
                new SetFieldAction(dFather, "packages", U.removeFromList(dFather.packages, dPackage.id));
                //new SetRootFieldAction("packages", U.removeFromList(Selectors.getAllPackages(), dPackage.id));
                new DeleteElementAction(dPackage);
            }
        }
        if(dFather.className === "DPackage") {
            ret = () => {
                new SetFieldAction(dFather, "subpackages", U.removeFromList(dFather.subpackages, dPackage.id));
                //new SetRootFieldAction("packages", U.removeFromList(Selectors.getAllPackages(), dPackage.id));
                new DeleteElementAction(dPackage);
            }
        }
        ret();
        return ret;
    }
}
// @RuntimeAccessible export class _WPackage extends _WNamedElement { }
// export type WPackage = DPackage | LPackage | _WPackage;
DNamedElement.subclasses.push(DPackage);
LNamedElement.subclasses.push(LPackage);



@RuntimeAccessible
export class DOperation extends DPointerTargetable { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LOperation;
    // static logic: typeof LOperation;
    // static structure: typeof DOperation;

    // inherit redefine
    id!: Pointer<DOperation, 1, 1, LObject>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    name: string = '';
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    exceptions: Pointer<DClassifier, 0, 'N', LClassifier> = [];
    parameters: Pointer<DParameter, 0, 'N', LParameter> = [];
}

@RuntimeAccessible
export class LOperation extends LTypedElement { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DOperation;
    id!: Pointer<DOperation, 1, 1, LOperation>;
    // static singleton: LOperation;
    // static logic: typeof LOperation;
    // static structure: typeof DOperation;

    // inherit redefine
    annotations!: LAnnotation[];
    parent!: LClass[];
    father!: LClass;
    name: string = '';
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    exceptions!: LClassifier[];
    parameters!: LParameter[];


    get_childrens_idlist(context: LogicContext<DOperation>): Pointer<DAnnotation | DClassifier | DParameter, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.exceptions, ...context.data.parameters]; }


}
DTypedElement.subclasses.push(DOperation);
LTypedElement.subclasses.push(LOperation);





@RuntimeAccessible
export class DParameter extends DPointerTargetable { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LParameter;
    // static logic: typeof LParameter;
    // static structure: typeof DParameter;

    // inherit redefine
    id!: Pointer<DParameter, 1, 1, LParameter>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DOperation, 0, 'N', LOperation> = [];
    father!: Pointer<DOperation, 1, 1, LOperation>;
    name: string = '';
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
}
@RuntimeAccessible
export class LParameter extends LTypedElement { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DParameter;
    id!: Pointer<DParameter, 1, 1, LParameter>;
    // static singleton: LParameter;
    // static logic: typeof LParameter;
    // static structure: typeof DParameter;

    // inherit redefine
    annotations!: LAnnotation[];
    parent!: LOperation[];
    father!: LOperation;
    name!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
}
DTypedElement.subclasses.push(DParameter);
LTypedElement.subclasses.push(LParameter);





var todoret: any;

@RuntimeAccessible
export class DClass extends DPointerTargetable{ // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LClass;
    // static logic: typeof LClass;
    // static structure: typeof DClass;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    id!: Pointer<DClass, 1, 1, LClass>;
    instanceClassName!: string;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // personal
    isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract: boolean = false;
    interface: boolean = false;
    instances: Pointer<DObject, 0, 'N', LObject> = [];
    operations: Pointer<DOperation, 0, 'N', LOperation> = [];
    features: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
    references: Pointer<DReference, 0, 'N', LReference> = [];
    attributes: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    referencedBy: Pointer<DReference, 0, 'N', LReference> = [];
    extends: Pointer<DClass, 0, 'N', LClass> = [];
    extendedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // mia aggiunta:
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    constructor(name: string = '', isInterface: boolean = false, isAbstract: boolean = false) {
        super(name);
        this.abstract = isAbstract;
        this.interface = isInterface
        this.className = this.constructor.name;
    }

}
@RuntimeAccessible
export class LClass extends LClassifier{ // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DClass;
    id!: Pointer<DClass, 1, 1, LClass>;
    // static singleton: LClass;
    // static logic: typeof LClass;
    // static structure: typeof DClass;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    instanceClassName!: string;
    parent!: LPackage[];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    defaultValue!: LObject;
    // personal
    isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract!: boolean;
    interface!: boolean;
    instances!: LObject[];
    operations!: LOperation[];
    features!: LStructuralFeature[];
    references!: LReference[];
    attributes!: LAttribute[];
    referencedBy!: LReference[];
    extends!: LClass[];
    extendedBy!: LClass[];
    nodes!: LGraphElement[]; // ipotesi, non so se tenerlo

    // mia aggiunta:
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    constructor(name: string = '', isInterface: boolean = false, isAbstract: boolean = false) {
        super(name);
        this.abstract = isAbstract;
        this.interface = isInterface
        this.className = this.constructor.name;
    }


    get_childrens_idlist(context: LogicContext<DClass>): Pointer<DAnnotation | DAttribute | DReference | DOperation, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.attributes, ...context.data.references, ...context.data.operations]; }

    get_delete(context: LogicContext<DClass>): () => void {
        const dClass: DClass = context.data;
        const dPackage: DPackage = Selectors.getDElement<DPackage>(dClass.father);
        const children = new Set([...dClass.attributes, ...dClass.references, ...dClass.pointedBy]);
        for(let dChild of children) {
            const lChild: LAttribute | LReference = MyProxyHandler.wrap(dChild);
            lChild.delete();
        }
        const ret = () => {
            new SetFieldAction(dPackage, "classifiers", U.removeFromList(dPackage.classifiers, dClass.id));
            //new SetRootFieldAction("classs", U.removeFromList(Selectors.getAllClasses(), dClass.id));
            new DeleteElementAction(dClass);
        }
        ret();
        return ret;
    }
    /*
        setImplement(interfaceIds: string[]): DClass {
            // todo: tutta sta roba andrebbe fatta da redux e dovrei aggiornare ImplementedBy, . e neanche andrebbe fatto qui ma dentro la parte logica proxy
            this.implements = [...this.implements, ...interfaceIds];
            return this;
        }
        setExtend(classIds: string[]): DClass {
            this.extends = [...this.extends, ...classIds];
            return this;
        }*/
}
DClassifier.subclasses.push(DClass);
LClassifier.subclasses.push(LClass);




@RuntimeAccessible
export class DDataType extends DPointerTargetable { // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LDataType;
    // static logic: typeof LDataType;
    // static structure: typeof DDataType;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    id!: Pointer<DDataType, 1, 1, LDataType>;
    instanceClassName!: string;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // personal
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];
}

@RuntimeAccessible
export class LDataType extends LClassifier { // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DDataType;
    id!: Pointer<DDataType, 1, 1, LDataType>;
    // static singleton: LDataType;
    // static logic: typeof LDataType;
    // static structure: typeof DDataType;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    instanceClassName!: string;
    parent!: LPackage[];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    defaultValue!: LObject
    // personal
    serializable!: boolean;
    usedBy!: LAttribute[];
}

DClassifier.subclasses.push(DDataType);
LClassifier.subclasses.push(LDataType);





@RuntimeAccessible
export class DStructuralFeature extends DPointerTargetable { // DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LStructuralFeature;
    // static logic: typeof LStructuralFeature;
    // static structure: typeof DStructuralFeature;

    // inherit redefine
    id!: Pointer<DStructuralFeature, 1, 1, LStructuralFeature>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    name: string = '';
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    instances: Pointer<DValue, 0, 'N', LValue> = [];
    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;
    derived: boolean = false;
    defaultValueLiteral!: string;

    // defaultValue!: GObject; //EJavaObject
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass
}
@RuntimeAccessible
export class LStructuralFeature extends LTypedElement { // DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DStructuralFeature;
    id!: Pointer<DStructuralFeature, 1, 1, LStructuralFeature>;
    // static singleton: LStructuralFeature;
    // static logic: typeof LStructuralFeature;
    // static structure: typeof DStructuralFeature;

    // inherit redefine
    annotations!: LAnnotation[];
    parent!: LClass[];
    father!: LClass;
    name!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    instances!: LValue[];
    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    derived!: boolean;
    defaultValueLiteral!: string;

    // defaultValue!: GObject; //EJavaObject
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass
}
DTypedElement.subclasses.push(DStructuralFeature);
LTypedElement.subclasses.push(LStructuralFeature);


@RuntimeAccessible
export class DReference extends DPointerTargetable { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LReference;
    // static logic: typeof LReference;
    // static structure: typeof DReference;


    // inherit redefine
    id!: Pointer<DReference, 1, 1, LReference>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;
    derived: boolean = false;
    defaultValueLiteral!: string;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    instances: Pointer<DValue, 0, 'N', LValue> = [];

    // personal
    containment: boolean = true;
    container: boolean = false; // ?
    resolveProxies: boolean = true; // ?
    opposite: Pointer<DReference, 0, 1, LReference> = null;
    target: Pointer<DClass, 0, 'N', LClass> = [];
    edges: Pointer<DEdge, 0, 'N', LEdge> = [];
}

@RuntimeAccessible
export class LReference extends LStructuralFeature {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DReference;
    id!: Pointer<DReference, 1, 1, LReference>;
    // static singleton: LReference;
    // static logic: typeof LReference;
    // static structure: typeof DReference;

    // inherit redefine
    annotations!: LAnnotation[];
    name!: string;
    type!: LClassifier;
    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;
    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    derived!: boolean;
    defaultValueLiteral!: string;
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];

    // personal
    containment!: boolean;
    container!: boolean;
    resolveProxies!: boolean;
    opposite?: LReference;
    target!: LClass[];
    edges!: LEdge[];


    get_delete(context: LogicContext<DReference>): () => void {
        const dReference: DReference = context.data;
        const dClass: DClass = Selectors.getDElement<DClass>(dReference.father);
        const dType: DClass = Selectors.getDElement<DClass>(dReference.type as string);
        const dEdge: DRefEdge | undefined = U.getReferenceEdge(dReference);
        const ret = () => {
            new SetFieldAction(dClass, "references", U.removeFromList(dClass.references, dReference.id));
            new SetFieldAction(dType, "pointedBy", U.removeFromList(dType.pointedBy, dReference.id));
            //new SetRootFieldAction("references", U.removeFromList(Selectors.getAllReferences(), dReference.id));
            if(dEdge) {
                new SetRootFieldAction("refEdges", U.removeFromList(Selectors.getAllReferenceEdges(), dEdge.id));
            }
            new DeleteElementAction(dReference);
        }
        ret();
        return ret;
    }
}
DStructuralFeature.subclasses.push(DReference);
LStructuralFeature.subclasses.push(LReference);




@RuntimeAccessible
export class DAttribute extends DPointerTargetable { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    id!: Pointer<DAttribute, 1, 1, LAttribute>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;
    derived: boolean = false;
    defaultValueLiteral!: string;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    instances: Pointer<DValue, 0, 'N', LValue> = [];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?
}
@RuntimeAccessible
export class LAttribute extends LStructuralFeature { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DAttribute;
    id!: Pointer<DAttribute, 1, 1, LAttribute>;
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    annotations!: LAnnotation[];
    name!: string;
    type!: LClassifier;
    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;
    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    derived!: boolean;
    defaultValueLiteral!: string;
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?

    get_delete(context: LogicContext<DAttribute>): () => void {
        const dAttribute: DAttribute = context.data;
        const dClass: DClass = Selectors.getDElement<DClass>(dAttribute.father);
        const dClassifier: DClassifier = Selectors.getDElement<DClass>(dAttribute.type as string);
        const ret = () => {
            new SetFieldAction(dClass, "attributes", U.removeFromList(dClass.attributes, dAttribute.id));
            new SetFieldAction(dClassifier, "pointedBy", U.removeFromList(dClassifier.pointedBy, dAttribute.id));
            //new SetRootFieldAction("attributes", U.removeFromList(Selectors.getAllAttributes(), dAttribute.id));
            new DeleteElementAction(dAttribute);
        }
        ret();
        return ret;
    }
}
DStructuralFeature.subclasses.push(DAttribute);
LStructuralFeature.subclasses.push(LAttribute);

todo: tutti devno avere: get_delete, get_set dei PERSONAL attributes.
+ getchildrenidlist or something se aggiungi una classe di children nei personal attributes

@RuntimeAccessible
export class DEnumLiteral extends DPointerTargetable { // DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    id!: Pointer<DEnumLiteral, 1, 1, LEnumLiteral>;
    parent: Pointer<DEnumerator, 0, 'N', LEnumerator> = [];
    father!: Pointer<DEnumerator, 1, 1, LEnumerator>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    // personal
    value: number = 0;
}
@RuntimeAccessible
export class LEnumLiteral extends LNamedElement { // DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DEnumLiteral;
    id!: Pointer<DEnumLiteral, 1, 1, LEnumLiteral>;
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    parent!: LEnumerator[];
    father!: LEnumerator;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    value!: number;

    get_delete(context: LogicContext<DEnumLiteral>): () => void {
        const dEnumLiteral: DEnumLiteral = context.data;
        const dEnumerator: DEnumerator = Selectors.getDElement<DEnumerator>(dEnumLiteral.father);
        const ret = () => {
            new SetFieldAction(dEnumerator, "literals", U.removeFromList(dEnumerator.literals, dEnumLiteral.id));
            //new SetRootFieldAction("enumliterals", U.removeFromList(Selectors.getAllEnumLiterals(), dEnumLiteral.id));
            new DeleteElementAction(dEnumLiteral);
        }
        ret();
        return ret;
    }
}
DNamedElement.subclasses.push(DEnumLiteral);
LNamedElement.subclasses.push(LEnumLiteral);


@RuntimeAccessible
export class DEnumerator extends DPointerTargetable { // DDataType
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LEnumerator;
    // static logic: typeof LEnumerator;
    // static structure: typeof DEnumerator;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    id!: Pointer<DEnumerator, 1, 1, LEnumerator>;
    instanceClassName!: string;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    // personal
    literals: Pointer<DEnumLiteral, 0, 'N', LEnumLiteral> = [];
}
@RuntimeAccessible
export class LEnumerator extends LDataType { // DDataType
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DEnumerator;
    id!: Pointer<DEnumerator, 1, 1, LEnumerator>;
    // static singleton: LEnumerator;
    // static logic: typeof LEnumerator;
    // static structure: typeof DEnumerator;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    instanceClassName!: string;
    parent!: LPackage [];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    defaultValue!: LObject;
    serializable!: boolean;
    usedBy!: LAttribute[];
    // personal
    literals!: LEnumLiteral[];



    get_childrens_idlist(context: LogicContext<DEnumerator>): Pointer<DAnnotation | DEnumLiteral, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.literals]; }

    get_delete(context: LogicContext<DEnumerator>): () => void {
        const dEnumerator: DEnumerator = context.data;
        const dPackage: DPackage = Selectors.getDElement<DPackage>(dEnumerator.father);
        const children = new Set([...dEnumerator.literals, ...dEnumerator.pointedBy]);

        for(let dChild of children) {
            const lChild: LEnumLiteral | LAttribute = MyProxyHandler.wrap(dChild);
            lChild.delete();
        }

        /*
        const pointedBy = new Set([...dEnumerator.pointedBy]);
        for(let dPointer of pointedBy) {
            const lPointer: LAttribute = MyProxyHandler.wrap(dPointer);
            lPointer.changeAttributeType(Selectors.getFirstPrimitiveTypes().id);
        }
        */


        const ret = () => {
            new SetFieldAction(dPackage, "classifiers", U.removeFromList(dPackage.classifiers, dEnumerator.id));
            //new SetRootFieldAction("enumerators", U.removeFromList(Selectors.getAllEnumerators(), dEnumerator.id));
            new DeleteElementAction(dEnumerator);
        }
        ret();

        return ret;
    }
}
DDataType.subclasses.push(DEnumerator);
LDataType.subclasses.push(LEnumerator);



@RuntimeAccessible
export class DObject extends DPointerTargetable { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LObject;
    // static logic: typeof LObject;
    // static structure: typeof DObject;

    // inherit redefine
    id!: Pointer<DObject, 1, 1, LObject>;
    parent: Pointer<DModel, 0, 'N', LModel> = []; // todo: problema m1 model can contain objects without package, it's only a web of objects with a object root actually.
    father!: Pointer<DModel, 1, 1, LModel>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    // personal
    instanceof: Pointer<DClass, 0, 'N'> = [];
}
@RuntimeAccessible
export class LObject extends LNamedElement { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DObject;
    id!: Pointer<DObject, 1, 1, LObject>;
    // static singleton: LObject;
    // static logic: typeof LObject;
    // static structure: typeof DObject;

    // inherit redefine
    parent!: LModel[]; // todo: problema m1 model can contain objects without package, it's only a web of objects with a object root actually.
    father!: LModel;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    instanceof!: LClass[];
}
DNamedElement.subclasses.push(DObject);
LNamedElement.subclasses.push(LObject);


@RuntimeAccessible
export class DValue extends DPointerTargetable { // extends DModelElement, m1 value (attribute | reference)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LValue;
    // static logic: typeof LValue;
    // static structure: typeof DValue;

    // inherit redefine
    id!: Pointer<DValue, 1, 1, LValue>;
    parent: Pointer<DObject, 0, 'N', LObject> = [];
    father!: Pointer<DObject, 1, 1, LObject>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    instanceof: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
}
@RuntimeAccessible
export class LValue extends LModelElement { // extends DModelElement, m1 value (attribute | reference)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DValue;
    id!: Pointer<DValue, 1, 1, LValue>;
    // static singleton: LValue;
    // static logic: typeof LValue;
    // static structure: typeof DValue;

    // inherit redefine
    parent!: LObject[]; // todo: problema m1 model can contain objects without package, it's only a web of objects with a object root actually.
    father!: LObject;
    annotations!: LAnnotation[];
    // personal
    instanceof!: LStructuralFeature [];
}
DNamedElement.subclasses.push(DValue);
LNamedElement.subclasses.push(LValue);



@RuntimeAccessible
export class DModel extends DNamedElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LModel;
    // static logic: typeof LModel;
    // static structure: typeof DModel;

    // inherit redefine
    id!: Pointer<DModel, 1, 1, LModel>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name: string = '';
    // personal
    packages:  Pointer<DPackage, 0, 'N', LPackage> = [];
    // modellingElements: Pointer<DModelElement, 0, 'N', LModelElement> = [];
}

@RuntimeAccessible
export class LModel extends LNamedElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DModel;
    id!: Pointer<DModel, 1, 1, LModel>;
    // static singleton: LModel;
    // static logic: typeof LModel;
    // static structure: typeof DModel;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    packages!: LPackage[];
    // modellingElements!: LModelElement[];


    get_childrens_idlist(context: LogicContext<DModel>): Pointer<DAnnotation | DModel, 1, 'N'> {
        return [...super.get_childrens_idlist(context), ...context.data.packages]; }

    get_packages(context: LogicContext<DModel>): LPackage[] {
        return context.data.packages.map(p => MyProxyHandler.wrap(p)); }

    get_delete(context: LogicContext<DModelElement>): () => void {
        const ret = () => { alert("todo delete LModel"); }
        return ret;
    }
}
DNamedElement.subclasses.push(DModel);
LNamedElement.subclasses.push(LModel);




@RuntimeAccessible
export abstract class DFactory_useless_ extends DPointerTargetable { // DModelElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LFactory_useless_;
    // static logic: typeof LFactory_useless_;
    // static structure: typeof DFactory_useless_;

    // inherit redefine
    id!: Pointer<DFactory_useless_, 1, 1, LFactory_useless_>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    ePackage: Pointer<DPackage, 1, 1, LPackage> = '';
    abstract create(DClass: DClass): DObject;
    abstract createFromString(eDataType: DDataType, literalValue: string): EJavaObject;
    abstract convertFromString(eDataType: DDataType, instanceValue: EJavaObject): string;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}
@RuntimeAccessible
export abstract class LFactory_useless_ extends LModelElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DFactory_useless_;
    id!: Pointer<DFactory_useless_, 1, 1, LFactory_useless_>;
    // static singleton: LFactory_useless_;
    // static logic: typeof LFactory_useless_;
    // static structure: typeof DFactory_useless_;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    ePackage!: LPackage;
    abstract create(DClass: DClass): DObject;
    abstract createFromString(eDataType: DDataType, literalValue: string): EJavaObject;
    abstract convertFromString(eDataType: DDataType, instanceValue: EJavaObject): string;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

// DModelElement.subclasses.push('DFactory_useless_'); // because it's abstract and cannot be used as a value, it's pure type definition
// DModelElement.subclasses.push('LFactory_useless_'); // because it's abstract and cannot be used as a value, it's pure type definition

@RuntimeAccessible
export class EJavaObject{

}// ??? EDataType instance?


@RuntimeAccessible
export class DMap extends Object { // DPointerTargetable
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __isDMap!: true;
    constructor() {
        super();
    }

    // id!: Pointer<DModelElement, 1, 1, LModelElement>;
}

@RuntimeAccessible
export class LMap extends LPointerTargetable {
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __isLMap!: true;
    // id!: Pointer<DModelElement, 1, 1, LModelElement>;
}
DPointerTargetable.subclasses.push(DMap as any);
LPointerTargetable.subclasses.push(LMap);




/*
function makeKeyf<NS extends string, N extends string>(n1: NS, n2: N) {
    return n1 + '' + n2 as `${NS}${N}`
}
type makeKey<NS extends string, N extends string> =`${NS}${N}`;
type filter_set_keys<T> = { [K in keyof T]: K extends `set_${string}` ? T[K] : never };
*/









/*

let a = ``  // ... get from export in index.ts
a = a.replaceAll(',,', ",")
let aa = a.split(",").map(a => a.trim().substring(1));

function onlyUnique(value, index, self) { return self.indexOf(value) === index; }

aa = aa.filter(onlyUnique).filter( a=> !!a)
let r = aa.filter(onlyUnique).filter( a=> !!a).map( a=> `export type W${a} = getWParams<L${a}, D${a}>;`).join('\n')
document.body.innerText = r;
*/



export type WModelElement = getWParams<LModelElement, DModelElement>;
export type WModel = getWParams<LModel, DModel>;
export type WValue = getWParams<LValue, DValue>;
export type WNamedElement = getWParams<LNamedElement, DNamedElement>;
export type WObject = getWParams<LObject, DObject>;
export type WEnumerator = getWParams<LEnumerator, DEnumerator>;
export type WEnumLiteral = getWParams<LEnumLiteral, DEnumLiteral>;
export type WAttribute = getWParams<LAttribute, DAttribute>;
export type WReference = getWParams<LReference, DReference>;
export type WStructuralFeature = getWParams<LStructuralFeature, DStructuralFeature>;
export type WClassifier = getWParams<LClassifier, DClassifier>;
export type WDataType = getWParams<LDataType, DDataType>;
export type WClass = getWParams<LClass, DClass>;
export type WParameter = getWParams<LParameter, DParameter>;
export type WOperation = getWParams<LOperation, DOperation>;
export type WPackage = getWParams<LPackage, DPackage>;
export type WTypedElement = getWParams<LTypedElement, DTypedElement>;
export type WAnnotation = getWParams<LAnnotation, DAnnotation>;
// export type WJavaObject = getWParams<LJavaObject, DJavaObject>;
export type WMap = getWParams<LMap, DMap>;
export type WFactory_useless_ = getWParams<LFactory_useless_, DFactory_useless_>;
