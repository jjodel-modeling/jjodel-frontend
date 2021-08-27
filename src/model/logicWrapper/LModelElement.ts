import { Mixin } from 'ts-mixer';
import {Log, U} from "../../common/U";
import {
    DModelElement,
    NotFound,
    nstring,
    NotFoundv,
    Pointer,
    JsType,
    GObject,
    MyError,
    bool,
    Dictionary,
    RuntimeAccessibleClass,
    PointerTargetable,
    DAnnotation, DAttribute,
    DClass,
    DClassifier, DDataType, DEnumerator, DEnumLiteral,
    DModel,
    DNamedElement, DOBject, DOperation,
    DPackage, DParameter, DReference, DStructuralFeature,
    DTypedElement, DValue,
    SetFieldAction, store
} from "../../joiner";
import {IsActually, windoww} from "../../joiner/types";

type NotAConcatenation = null;

abstract class MyProxyHandler<T extends GObject> extends RuntimeAccessibleClass implements ProxyHandler<T>{
    s: string = 'set_';
    g: string = 'get_';
    get(target: T, p: string | symbol, receiver: any): boolean { throw new Error('must be overridden'); }
    set(target: T, p: string | symbol, value: any, receiver: any): boolean { throw new Error('must be overridden'); }

    ownKeys(target: T): ArrayLike<string | symbol>{ return Object.keys(target); }
}

// todo: questo è l'unico proxyhandler, NON farne altri per sottoclassi di ModellingElement
export class LModelElementProxyHandler<ME extends DModelElement = DModelElement, LE extends LModelElement = LModelElement> extends MyProxyHandler<ME> {
// permette di fare cose tipo: user.name_surname che ritorna la concatenazione di nome e cognome anche se il campo name_surname non esiste.
    lg: LModelElement & GObject; // to disable type check easily and access 'set_' + varname dynamically
    l: LModelElement;
    d: DModelElement;
    constructor(d: DModelElement, l?: LModelElement) {
        super();
        this.d = d;
        if (!l) { l = windoww[d.className].logic.singleton; }
        this.l = l as LModelElement;
        this.lg = this.l;
    }

    private concatenableHandler(targetObj: ME, propKey: keyof DModelElement | string | symbol, receiverThis: any): NotAConcatenation | any {
        if (propKey in targetObj)  return null as NotAConcatenation;
        const propKeyStr: null | string = U.asString(propKey, null);
        let _index: number = propKeyStr ? propKeyStr.indexOf('_') : -1;
        if (_index < 0) return null as NotAConcatenation;

        let isConcatenable = true;
        let ret: any = (propKey as string).split('_').map( (subKey: string) => {
            // se trovo multipli ___ li tratto come spazi aggiuntivi invece che come proprietà '' che ritornano undefined, così posso fare name___surname --> "damiano   di vincenzo"
            let val: any = subKey === '' ? ' ' : this.get(targetObj, subKey, receiverThis);
            isConcatenable = isConcatenable && JsType.isPrimitive(val);
            return val;
        });
        return isConcatenable ? ret.join(' ') : ret; }

    public get(targetObj: ME, propKey: keyof DModelElement | string | symbol, receiverThis: any): any {
        if (propKey === "__raw") return targetObj;
        if (propKey in this.l) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.s + propKey in this.lg) return this.lg[this.g + propKey](new LogicContext(this, targetObj));
            // se esiste la proprietà ma non esiste il setter, che fare? do errore.
            // Log.eDevv("dev error: property exist but getter does not: ", propKey, this);
            // @ts-ignore
            return this.lg[propKey];
        }
        if (typeof propKey === "symbol") {
            switch(String(propKey)){
                default: Log.exDevv('unexpected symbol:', propKey); break;
                case "Symbol(Symbol.toPrimitive)": return this.lg[propKey as any] || (targetObj as any)[propKey] || typeof targetObj;
            }

        }
        // if property do not exist
        const concatenationTentative = this.concatenableHandler(targetObj, propKey, receiverThis);
        if (concatenationTentative !== null) return concatenationTentative;
        Log.exx('property "', (propKey as any), '" do not exist in object of type "' + U.getType(this.l), {logic: this.l, data: targetObj});
        return undefined;
        // todo: credo che con espressioni sui tipi siano tipizzabili tutti i return di proprietà note eccetto quelle ottenute per concatenazione.
    }
    public set(targetObj: DModelElement, propKey: string | symbol, value: any, receiver: any): boolean {
        if (propKey in this.l) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.s + propKey in this.lg) return this.lg[this.s + propKey](value, new LogicContext(this, targetObj));
            // se esiste la proprietà ma non esiste il setter, che fare? do errore.
            Log.eDevv("dev error: property exist but setter does not: ", propKey, this);
        }
        // if property do not exist
        Log.exx('property "' + (propKey as any) + '" do not exist in object of type "' + U.getType(this.l));
        return false; }
        /*      problema: ogni oggetto deve avere multipli puntatori, quando ne modifico uno devo modificarli tutti, come tengo traccia?
                ipotesi 1: lo memorizzo in un solo posto (store.idlookup) e uso Pointer<type, lb, ub> che è una stringa che simula un puntatore
                problema 1: se fornisco l'intero store ai componenti si aggiornano ad ogni singola modifica, se estraggo i campi interesasti le stringhe puntatore sono invariate ma il contenuto puntato è cambiato e il componente non lo sa...
                problemone 2: non so a quali proprietà dello store devo abbonarmi, devo leggere sempre tutto lo store?
                !!!!! soluzione 2?: dovrei dichiarare le variabili a cui mi abbono, salvarle nello stato e precaricarle tramite mapStateToProps*/

    ownKeys(target: ME): ArrayLike<string | symbol>{
        return U.arrayMergeInPlace(Object.keys(target), Object.keys(this.l).filter(k => k.indexOf('set_') !== 0 || k.indexOf('get_') !== 0));
    }

    /*
    apply(target: DModelElement, thisArg: any, argArray: any[]): any {
        // will i ever use it? dovrei pasare una funzione invece di una classe, quindi in questo caso credo wrappi solo il costruttore
    }*/
}

class LogicContext<P extends MyProxyHandler<D>, D extends DModelElement> extends RuntimeAccessibleClass{
    constructor(public proxy: P, public data: D) { super(); }
/*
    saveToRedux(propkey: "keyof data" | string, val: "typeof data[path]" | any): void { // todo: ask non stackoverflow
        // todo, put data in redux store, path is "obj1.obj2.obj3..." might replace it with a path funciton that return the foremost nested object container
        if (!propkey) {
            // todo: set whole object instead of a property
        }
    }*/
}
/*
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


type typeOfClassComeLofaccio = any; // typeof Class non funziona come return type
export class LModelElement extends DModelElement {
    static singleton: IsActually<LModelElement>;
    // static proxyHandler: LModelElementProxyHandler = new LModelElementProxyHandler(LModelElement.singleton);
    // [key: string]: any; // uncomment to allow custom properties typed with any while keeping typed existing ones

    public static init(): void {
        DAnnotation.logic = LAnnotation;
        DModelElement.logic = LModelElement;
        DAttribute.logic = LAttribute;
        DClass.logic = LClass;
        DClassifier.logic = LClassifier;
        DEnumerator.logic = LEnumerator;
        DEnumLiteral.logic = LEnumLiteral;
        DModel.logic = LModel;
        DOBject.logic = LObject;
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
    }
    static getLclass<D extends DModelElement, L extends typeof LModelElement>(data: DModelElement): typeof LModelElement {
        const l: typeof LModelElement = LModelElement;
        return (data.constructor as typeof DModelElement).logic.singleton
    }
    public static wrap<T extends LModelElement>(data: DModelElement): T{
        if (!data) return data;
        return new Proxy(data, new LModelElementProxyHandler(data)) as T;
    }

    static ResolvePointer<T extends GObject = DModelElement, LB=number, UB=number, RET extends GObject = LModelElement>(ptr: Pointer<T, LB, UB, RET>): RET | null {
        if (!ptr) return null;
        let obj: GObject = store.getState().idlookup[ptr];
        if (!obj) return null;
        if (obj instanceof DModelElement) obj = LModelElement.wrap(obj);
        return obj as RET; }
    private static ResolvePointers<T extends GObject = DModelElement, LB=number, UB=string, RET extends GObject = LModelElement>(ptr: Pointer<T, LB, UB, RET>[]): (RET | null)[] {
        return (ptr && ptr.map( p => LModelElement.ResolvePointer<T, LB, UB, RET>(p)) as RET[]) || []; }


    private resolvePointer<T extends GObject = DModelElement, LB=number, UB=number, RET extends GObject = LModelElement>(ptr: Pointer<T, LB, UB, RET>): RET | null { return LModelElement.ResolvePointer(ptr); }
    private resolvePointers<T extends GObject = DModelElement, LB=number, UB=number, RET extends GObject = LModelElement>(ptr: Pointer<T, LB, UB, RET>[]): (RET | null)[] { return LModelElement.ResolvePointers(ptr); }

    // todo: per ogni field creo getter e setter che vengono chiamati dal proxy
    get_id(context: LogicContext<MyProxyHandler<this>, this>): string { return context.data.id; }
    set_id(): boolean { return Log.exx('id is read-only', this); }

    add_parent(val: Pointer<DAnnotation> | LModelElement, logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent[]', val).fire();
    }
    remove_parent(logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent', []).fire();}
    get_parent(context: LogicContext<MyProxyHandler<LModelElement>, LModelElement>): LModelElement[] {
        return U.arrayFilterNull(this.resolvePointers<DModelElement>(context.data.parent));
    }
    set_parent(val: Pointer<DAnnotation> | LModelElement[], logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        return new SetFieldAction(logicContext.data, 'parent', val).fire();
    }

    // todo: cerca se puoi fare override del += e -=, altrimenti posso chiamarlo con add_annotation = val e remove_annotation = val
    add_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        return true;
    }
    remove_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        return true;
    }
    get_annotations(context: LogicContext<MyProxyHandler<this>, this>): (LAnnotation | null)[] {
        return this.resolvePointers(context.data.annotations);
    }
    set_annotations(val: Pointer<DAnnotation>[] | LAnnotation[], logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        if (!Array.isArray(val)) val = [val];
        // for (const v of val) { if ()}
        // todo: un oggetto proxy DAnnotation che si comporta come LAnnotation come faccio a far ritornare instanceof = true? devo cambiare il getter del __proto__?

        // cambio da LAnnotation a pointer, se erano già pointer verifico l'esistenza
        val = val.map( v => (v instanceof LAnnotation ? v.id : ( isValidPointer(v, DAnnotation) ? v : null )));
        new SetFieldAction(logicContext.data, 'annotations', val);
        return true;
    }
}
type UserDefinedClassTODO = Function;
function isValidPointer<P extends PointerTargetable, PStartType, PEndType>(p: Pointer<PStartType, any, any, PEndType>, constraintType?: UserDefinedClassTODO): boolean {
    const pointerval: PEndType | null = LModelElement.ResolvePointer(p);
    if (!pointerval) return false;
    if (!constraintType) return true;
    return (pointerval instanceof constraintType); }

export class LAnnotation extends Mixin(DAnnotation, LModelElement) {
    static singleton: IsActually<LAnnotation>;
    get_source(context: LogicContext<MyProxyHandler<this>, this>): string {
        return context.data.source; }
    set_source(val: string, logicContext: LogicContext<MyProxyHandler<this>, this>): boolean {
        new SetFieldAction(logicContext.data, 'source', !!(val as unknown));
        return true; }
}

export class LNamedElement extends Mixin(DNamedElement, LModelElement) {
    static singleton: IsActually<LNamedElement>;
    // private static proxyHandler: DNamedElementProxyHandler = new DNamedElementProxyHandler();
    // [key: string]: any; // uncomment to allow custom properties typed with any while keeping typed existing ones
    // todo: per ogni field creo getter e setter che vengono chiamati dal proxy
    get_name(context: LogicContext<MyProxyHandler<this>, this>): string { return context.data.name; }
    set_name(val: string,  logicContext: LogicContext<MyProxyHandler<this>, this>): boolean {
        if (val.match(/\s/)) val = this.autofix_name(val, logicContext);
        // todo: validate if operation can be completed or need autocorrection, then either return false (invalid parameter cannot complete) or send newVal at redux
        const fixedVal: string = val;
        new SetFieldAction(logicContext.data, 'name', fixedVal);
        return true;
    }
    autofix_name(val: string, logicContext: LogicContext<MyProxyHandler<this>, this>): string {
        // NB: NON fare autofix di univocità nome tra i childrens o qualsiasi cosa dipendente dal contesto, questo potrebbe essere valido in alcuni modelli e invalido in altri e modificare un oggetto condiviso.
        return val.replaceAll(/\s/g, '_');
    }
}

export class LTypedElement extends Mixin(DTypedElement, LNamedElement) {
    static singleton: IsActually<LTypedElement>;
    get_ordered(context: LogicContext<MyProxyHandler<this>, this>): boolean {
        return context.data.ordered; }
    set_ordered(val: boolean, logicContext: LogicContext<LModelElementProxyHandler, this>): boolean {
        new SetFieldAction(logicContext.data, 'ordered', !!(val as unknown));
        return true; }
    get_unique(context: LogicContext<MyProxyHandler<this>, this>): boolean {
        return context.data.unique; }
    set_unique(val: boolean, logicContext: LogicContext<LModelElementProxyHandler, this>): boolean {
        new SetFieldAction(logicContext.data, 'unique', !!(val as unknown));
        return true; }
}


export class LClassifier extends Mixin(DClassifier, LNamedElement) {
    static singleton: IsActually<LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean; // ?
    required!: boolean; // ?

    get_ordered(context: LogicContext<MyProxyHandler<LModelElement>, LModelElement>): boolean {
        return this.ordered; }
    set_ordered(val: boolean, logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        new SetFieldAction(logicContext.data, 'ordered', !!(val as unknown));
        return true; }
    get_unique(context: LogicContext<MyProxyHandler<LModelElement>, LModelElement>): boolean {
        return this.unique; }
    set_unique(val: boolean, logicContext: LogicContext<LModelElementProxyHandler, DNamedElement>): boolean {
        new SetFieldAction(logicContext.data, 'unique', !!(val as unknown));
        return true; }
}



export class LPackage extends Mixin(DPackage, LNamedElement) {
    static singleton: IsActually<LPackage>;
}

export class LOperation extends Mixin(DOperation, LTypedElement) {
    static singleton: IsActually<LOperation>;
}
export class LParameter extends Mixin(DParameter, LTypedElement) {
    static singleton: IsActually<LParameter>;
}
export class LClass extends Mixin(DClass, LClassifier) {
    static singleton: IsActually<LClass>;
}
export class LDataType extends Mixin(DDataType, LClassifier) {
    static singleton: IsActually<LDataType>;
}
export class LStructuralFeature extends Mixin(DStructuralFeature, LTypedElement) {
    static singleton: IsActually<LStructuralFeature>;
}
export class LReference extends Mixin(DReference, LStructuralFeature) {
    static singleton: IsActually<LReference>;
}
export class LAttribute extends Mixin(DAttribute, LStructuralFeature) {
    static singleton: IsActually<LAttribute>;
}
export class LEnumLiteral extends Mixin(DEnumLiteral, LNamedElement) {
    static singleton: IsActually<LEnumLiteral>;
}
export class LEnumerator extends Mixin(DEnumerator, LDataType) {
    static singleton: IsActually<LEnumerator>;
}
export class LObject extends Mixin(DOBject, LNamedElement) {
    static singleton: IsActually<LObject>;
}
export class LValue extends Mixin(DValue, LModelElement) {
    static singleton: IsActually<LValue>;
}
export class LModel extends Mixin(DModel, LNamedElement) {
    static singleton: IsActually<LModel>;
}
