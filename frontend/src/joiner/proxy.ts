import {
    DocString,
    DtoL, DtoW,
    GObject,
    Proxyfied,
    DPointerTargetable,
    LModelElement,
    Pointer,
    Dictionary,
    DModelElement,
} from "../joiner";
import {
    windoww,
    L,
    Pointers,
    ABORT,
    JsType,
    Log,
    LPointerTargetable,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    SetRootFieldAction,
    U
} from "../joiner";

type NotAConcatenation = null;
type ERROR = "_Type_Error_";

// (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (ERROR))
// (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (           WViewElement
//
// (IN extends WViewElement ? LViewElement : (IN extends WViewTransientProperties ? LWiewTransientProperties : (ERROR)))
// ))
// type WtoL<WX extends WPointerTargetable> ='';

@RuntimeAccessible('LogicContext')
export class LogicContext<
    DX extends GObject = DModelElement,
    LX = DtoL<DX>,
    // PF extends MyProxyHandler<DX> = MyProxyHandler<DX>,
    WX = DtoW<DX>
    > extends RuntimeAccessibleClass{
    public proxyObject: LX;
    public data: DX;// & GObject;
    public write: WX;
    constructor(proxyObject: LX, data: DX) {
        super();
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        this.data = data;
        this.proxyObject = proxyObject;
        this.write = proxyObject as any;
    }
    /*
        saveToRedux(propkey: "keyof data" | string, val: "typeof data[path]" | any): void { // todo: ask non stackoverflow
            // todo, put data in redux store, path is "obj1.obj2.obj3..." might replace it with a path funciton that return the foremost nested object container
            if (!propkey) {
                // todo: set whole object instead of a property
            }
        }*/
}

@RuntimeAccessible('LogicContext')
export class LogicContext2<D extends GObject = GObject, L extends any = any, W extends any = any> extends LogicContext<D, L, W>{
    path!: string;
    base!: DPointerTargetable;
    data!: D;


    constructor(proxyObject: L, data: D, base: DPointerTargetable, path: string) {
        super(proxyObject, data);
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        this.base = base;
        this.path = path;

    }
}
RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, LogicContext);

/*@RuntimeAccessible('MapLogicContext')
export class MapLogicContext extends LogicContext<GObject, LPointerTargetable, WPointerTargetable> {
    data: GObject;
    path: string;
    subMaps: string[];
    constructor(proxy: LPointerTargetable, data: GObject, path: string, subMaps: string[] = []) {
        super(proxy, data);
        // this.proxyfyFunction = proxyfyFunction;
        this.proxyObject = proxy;
        this.data = data;
        this.path = path;
        this.subMaps = subMaps;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }
}
RuntimeAccessibleClass.set_extend(LogicContext, MapLogicContext);
*/

@RuntimeAccessible('MyProxyHandler')
export abstract class MyProxyHandler<T extends GObject> extends RuntimeAccessibleClass implements ProxyHandler<T>{
    s: string = 'set_';
    g: string = 'get_';
    /*get(target: T, p: string | number | symbol, proxyitself: Proxyfied<T>): boolean {
        switch (p) {
            case '_isProxy': return true;
            case 'init': return (this as any).init;
            case 'init0': return (this as any).init0;
            default: throw new Error('proxy get must be overridden, called for key: ' + (p as string));
        }}*/
    set(target: T, p: string | number | symbol, value: any, proxyitself: Proxyfied<T>): boolean { throw new Error('proxy set must be overridden'); }
    deleteProperty(target: T, p: string | symbol): boolean { throw new Error('proxy delete must be overridden'); }

    ownKeys(target: T): ArrayLike<string | symbol>{
        // return Object.getOwnPropertyNames(target);
        console.log("ownkeys trap 1", {thiss:this, target})
        console.log("ownkeys trap 2", {thiss:this, target, ret:Reflect.ownKeys(target)});
        return Reflect.ownKeys(target);
    }
    /// proxy methods not used
    /* setPrototypeOf(target: T, v: object | null): boolean { ?? }
    apply(target: T, thisArg: any, argArray: any[]): any { }
    defineProperty(target: T, p: string | symbol, attributes: PropertyDescriptor): boolean { }
    construct(target: T, argArray: any[], newTarget: Function): object { }
    getOwnPropertyDescriptor(target: T, p: string | symbol): PropertyDescriptor | undefined { }
    has(target: T, p: string | symbol): boolean { return p in target; }
    getPrototypeOf(target: T): object | null { }
    isExtensible(target: T): boolean { }
    preventExtensions(target: T): boolean { }*/

    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable = LPointerTargetable, CAN_THROW extends boolean = false,
        RET extends CAN_THROW extends true ? L : L | undefined  = CAN_THROW extends true ? L : L>
    (data: D | Pointer | undefined | null, baseObjInLookup?: undefined, path: '' = '', canThrow: CAN_THROW = false as CAN_THROW): RET{

//    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable, RET extends boolean = false>
//        (data: D | Pointer<DViewElement>, baseObjInLookup?: DPointerTargetable, path: string = '', canthrow: RET = false as RET): RET {
        return (windoww.DPointerTargetable as typeof DPointerTargetable).wrap(data, baseObjInLookup, path) as RET; }

    static isProxy(data: GObject): boolean { return data?.__isProxy || false; }
}
RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, MyProxyHandler);
export type GetPath<T = GObject> = T;
/*
* handling proxy += and proxy -=
*
* will become var = var + add; which will call Symbol.getPrimitive
console.log(+obj2);     // 10        — hint is "number"         NaN with +array with multiple vals, +array[0] with array of size 1, NaN with functions & objects
console.log(`${obj2}`); // "hello"   — hint is "string"         array => array.join(','), object => "[object Object]", function => function.toString() whole func definition with body code
console.log(obj2 + ""); // "true"    — hint is "default"        array, object, function => same as with hint "string"
*
* */

// NB: lclass.extends += somepointer will become: lclass.extends = lclass.extends + somepointer;
// array + string will cause getPrimitive("default") to array, then .join(',') on it, and finally and toString() to be called on all array members.
// so pointers cannot include "," char and toString() must return a pointer to keep lclass.extends += somepointer as a valid expression;
// -= will call getPrimitive("number") which will result in array -> NaN, so NaN = NaN - pointer and cannot be done.
// or maybe it can because if getPrimitive fails it calls toString as fallback, and viceversa

@RuntimeAccessible('GetPathHandler')
class GetPathHandler<T extends GObject> extends MyProxyHandler<T>{
    public static __asCalls: boolean = false;
    public static __asArray: boolean = false;
    public static __nested: boolean = true;
    private strbuilder: string = '';
    private array: (string | number | symbol)[] = [];
    private calls: (GObject<'parameters of get calls'>)[] = [];

    public constructor() { super(); }

    get(targetObj: T, propKey: keyof T | string, proxyitself: Proxyfied<T>): any {
        // console.log('GetPathHandler', {targetObj, propKey, proxyitself});
        if (propKey === "start") { this.strbuilder = ''; this.array = []; }
        if (propKey === '$') {
            const ret = GetPathHandler.__asCalls ? this.calls : (GetPathHandler.__asArray ? this.array : this.strbuilder);
            this.array = [];
            this.strbuilder = '';
            return ret; }
        this.array.push(propKey);
        this.calls.push(arguments);
        if (propKey === Symbol.toPrimitive) {
            console.log("toprimitive");
            return (...a: any)=> {console.log("toprimitive called with parameters", a); }
        }
        if (!GetPathHandler.__asArray && !GetPathHandler.__asCalls) {
            if (typeof propKey === "symbol") { this.strbuilder += propKey.toString(); }
            else {
                // Giordano: add ignore for webpack
                //@ts-ignore
                this.strbuilder += (this.strbuilder ? '.' : '') + propKey;
            }
        }
        return GetPathHandler.__nested ? proxyitself : {};
    }

    set(target: T, p: string | number | symbol, value: any, proxyitself: Proxyfied<T>): boolean {
        switch(p){
            case '__asArray':
            case '__asCalls':
            case '__nested':
                (GetPathHandler as any)[p] = value;
                return true;
            default:
                throw new Error('getPath proxy cannot be written');
        }
    }
}
RuntimeAccessibleClass.set_extend(MyProxyHandler, GetPathHandler);



export let hiddenkeys = [
    "jsxString", "pointedBy", "referencedBy",
    "clonedCounter", "parent", "_subMaps",
    "partialdefaultname", "isMirage",
    "inspect", "__random", '__serialize'];

@RuntimeAccessible('TargetableProxyHandler')
export class TargetableProxyHandler<ME extends GObject = DModelElement, LE extends LPointerTargetable = LModelElement> extends MyProxyHandler<ME> {
    lg: LE & GObject; // to disable type check easily and access 'set_' + varname dynamically
    l: LE;
    d: ME;
    additionalPath: string;

    public baseObjInLookup: DPointerTargetable;
    static childKeys: Dictionary<string, true> = {'$': true, '@': true};

    constructor(d: ME, baseObjInLookup?: DPointerTargetable, additionalPath: string = '', l?: LE) {
        super();
        this.d = d;
        if (!l) {
            l = RuntimeAccessibleClass.get(d.className)?.logic?.singleton as LE;
            Log.exDev(!l, 'Trying to wrap class without singleton or logic mapped: ' + d.className, { object: d, className: d.className })
        }
        this.baseObjInLookup = baseObjInLookup || d as any;
        this.additionalPath = additionalPath;
        this.l = l as LE;
        this.lg = this.l;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }


    // permette di fare cose tipo: user.name_surname che ritorna la concatenazione di nome e cognome anche se il campo name_surname non esiste.
    private concatenableHandler(targetObj: ME, propKey: number | string | symbol, proxyitself: Proxyfied<ME>): NotAConcatenation | any[] | string {
        //console.log("concatenableHandler 1", {targetObj, propKey, proxyitself});
        if (propKey in targetObj)  return null as NotAConcatenation;
        const propKeyStr: null | string = U.asString(propKey, null);
        let _index: number = propKeyStr ? propKeyStr.indexOf('_') : -1;
        //console.log("concatenableHandler 2", {targetObj, propKey, propKeyStr, proxyitself, _index});
        if (_index < 0) return null as NotAConcatenation;

        let isConcatenable = true;
        let ret: any[] = (propKey as string).split('_').map( (subKey: string) => {
            //console.log("concatenableHandler 3.0", {targetObj, subKey, propKeyStr, proxyitself});
            // se trovo multipli ___ li tratto come spazi aggiuntivi invece che come proprietà '' che ritornano undefined, così posso fare name___surname --> "damiano   di vincenzo"
            let val: any = subKey === '' ? ' ' : this.get(targetObj, subKey, proxyitself);
            isConcatenable = isConcatenable && JsType.isPrimitive(val);
            return val;
        });
        //console.log("concatenableHandler 4", {targetObj, propKey, propKeyStr, proxyitself, ret, isConcatenable});
        return isConcatenable ? ret.join(' ') : ret; }

    public get(targetObj: ME, propKey: string | symbol, proxyitself: Proxyfied<ME>): any {
        let ret;
        let isError = false;
        // console.error('_proxy get PRE:', {targetObj, propKey, proxyitself, arguments});
        try { ret = this.get0(targetObj, propKey, proxyitself); } catch(e) {
            Log.eDevv('failed to get property', {targetObj, propKey, e});
            ret = e;
            isError = true;
        }

        // if (isError) throw ret;
        // console.error('_proxy get POST:', {targetObj, propKey, ret, isError});
        return ret;
    }

    public get0(targetObj: ME, propKey: string | symbol, proxyitself: Proxyfied<ME>): any {
        // console.log('proxy keysearch', {propKey, targetObj, l: this.l, proxyitself, d: this.d});
        let canThrowErrors = true;

        switch (typeof propKey) {
            case "symbol":
                propKey = String(propKey);
                // console.log('get symbol', {propKey});
                switch (propKey) {
                    default: Log.exDevv('unexpected symbol in proxy getter:', propKey); break;
                    case 'Symbol(Symbol.toStringTag)': propKey = 'toString'; break; //return (()=>"[Proxy]");
                    case "Symbol(Symbol.toPrimitive)": propKey = 'toPrimitive'; break;
                }
                break;
            // case "number": return null;
        }

        switch (propKey) {
            case '__l': return this.l;
            case '__d': return this.d;
            case '__t': return this;
            case 'inspect': // node.js util
            case "r":
            case "_refresh":
            case "_reload": return LPointerTargetable.wrap(targetObj.id);
            case '__Raw':
            case '__raw': return targetObj;
            case 'json':
            case '__json':
                let ret: GObject = {...targetObj};
                if (ret._state) ret.state = ret._state;
                for (let k of hiddenkeys) { delete ret[k]; }
                for (let k of Object.keys(ret)) {
                    let v = ret[k];
                    if ((Array.isArray(v) && v.length === 0) || U.isEmptyObject(v)) delete ret[k];
                    if (v === '') delete ret[k];
                }
                return ret;
            case '__serialize': return JSON.stringify(targetObj, null, 4);
            case '__isproxy':
            case '__isProxy': return true;
            case '__random': return Math.random();
            case 'editCount':
            case 'clonedcounter':
            case 'clonedCounter':
                return targetObj.clonedCounter || 0;
            case '$$typeof':
            case "typeName":
                return this.d.className;
            case 'parent': propKey = 'father'; break;
        }
        if (propKey[0] === "_" && propKey.indexOf("__info_of__")===0) {
            return (this.l as GObject)[propKey];
        }

        let logicContext = this.additionalPath
            ? new LogicContext2(proxyitself, targetObj, this.baseObjInLookup, this.additionalPath)
            : new LogicContext(proxyitself as any, targetObj);
        // check if exist directly in D.key, L.key or through a get_key
        if (propKey in this.l || propKey in this.d || (this.l as GObject)[this.g + (propKey as string)]) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.g + propKey in this.lg) return this.lg[this.g + propKey](logicContext);



            // if specific custom getter exist
            if (typeof propKey !== 'symbol' && this.g + propKey in this.lg) {
                let getterMethod: Function = this.lg[this.g + propKey]; // || this.defaultGetter;
                // console.log("gets method", {getterMethod, lg:this.lg, thiss: this});
                if (getterMethod) return getterMethod(logicContext);
            }

        }
        // @ts-ignore
        //console.trace("proxy $getter 2", {targetObj, n:targetObj.name, propKey, l:this.lg, dg:this.lg._defaultGetter});


        // if custom generic getter exist
        // @ts-ignore
        if (this.lg._defaultGetter) return this.lg._defaultGetter(logicContext, propKey);

        // if property do not exist, try a concatenation
        /*let concatenationTentative = null;
        try {concatenationTentative = this.concatenableHandler(targetObj, propKey, proxyitself); } catch(e) {}
        if (concatenationTentative !== null) return concatenationTentative;
        */
        Log.e(canThrowErrors, 'GET property "'+ (propKey as any)+ '" do not exist in object of type "' + U.getType(this.l) + " DType:" +  U.getType(this.d), {data: targetObj});
        return undefined;
        // todo: credo che con espressioni sui tipi siano tipizzabili tutti i return di proprietà note eccetto quelle ottenute per concatenazione.
    }

    public defaultGetter(targetObj: ME, key: string, proxyitself: Proxyfied<ME>): any {
        if (!targetObj) return targetObj;
        let autoWrapObjects = false;
        let v = (targetObj as GObject)[key];
        if (!autoWrapObjects || typeof v !== 'object') return v;

        if (v.className) return L.from(v);
        return LGObject.wrapObject(targetObj as any, key, v);
        /*if (!targetObj._subMaps || !targetObj._subMaps[key]) return (targetObj as Dictionary)[key];
        // if is a nexted subobject
        let context: MapLogicContext = new MapLogicContext(proxyitself as any, targetObj, key, []);
        let retRaw: Dictionary = this.lg[this.s + key]
        return MapProxyHandler.mapWrap((targetObj as Dictionary)[key], targetObj as any, this.additionalPath + '.' + key)*/
    }

    public defaultSetter(targetObj: DPointerTargetable, propKey: string, value: any, proxyitself?: Proxyfied<ME>): boolean {
        SetFieldAction.new(targetObj, propKey as any, value);
        return true;
    }

    public set(targetObj: ME, propKey: string | symbol, value: any, proxyitself?: Proxyfied<ME>): boolean {
        // console.error('_proxy set PRE:', {targetObj, propKey, value, proxyitself, arguments});
        // if (propKey in this.l || propKey in this.d || (this.l as GObject)[this.s + (propKey as string)] || (this.l as GObject)[(propKey as string)]) {

        if ((this.d as GObject).__readonly && propKey !== '__readonly') {
            //todo if there is a transaction open i should throw exception?
            if (ABORT()){
                Log.ee('Transaction aborted because an object is readonly:', this.d);
            }
            return true;
        }
        switch (typeof propKey) {
            case "symbol":
                propKey = String(propKey);
                Log.exDevv('unexpected symbol in proxy setter:', propKey);
                break;
            default: break;
        }

        switch (propKey) {
            case 'parent': propKey = 'father'; break;
        }

        let logicContext = this.additionalPath
            ? new LogicContext2(proxyitself, targetObj, this.baseObjInLookup, this.additionalPath)
            : new LogicContext(proxyitself as any, targetObj);

        if (propKey in this.l || propKey in this.d || (this.l as GObject)[this.s + (propKey as string)]) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.s + propKey in this.lg) {
                try {
                    this.lg[this.s + propKey](value, logicContext);
                } catch (e) {
                    Log.eDevv('failed to set property', {targetObj, propKey, e});
                }
                return true;
            }


            // se esiste la proprietà ma non esiste il setter?
            // Log.eDevv("dev error: property exist but setter does not: ", propKey, this);
            // return false;
        }
        // if property do not exist

        // if custom generic setter exist
        // @ts-ignore private property
        if (this.lg._defaultSetter) { // @ts-ignore private property
            this.lg._defaultSetter(value, logicContext, propKey);
            return true;
        }
        /*if (enableFallbackSetter && typeof (propKey === "string") && ((propKey as string)[0] === '_' || (propKey as string).indexOf('tmp') > 0)) {
            return this.defaultSetter(targetObj as any as DPointerTargetable, propKey as string, value, proxyitself);
            // new SetFieldAction(new LogicContext(proxyitself as any, targetObj).data as any, propKey as string, value); return true;
        }*/
        let canThrowErrors = true;
        Log.ex(canThrowErrors,'SET property "set_' + (propKey as any) + '" do not exist in object of type "' + U.getType(this.l) + " DType:" +  U.getType(this.l), {'this': this, targetObj});
        return false; }
    /*      problema: ogni oggetto deve avere multipli puntatori, quando ne modifico uno devo modificarli tutti, come tengo traccia?
            ipotesi 1: lo memorizzo in un solo posto (store.idlookup) e uso Pointer<type, lb, ub> che è una stringa che simula un puntatore
            problema 1: se fornisco l'intero store ai componenti si aggiornano ad ogni singola modifica, se estraggo i campi interesasti le stringhe puntatore sono invariate ma il contenuto puntato è cambiato e il componente non lo sa...
            problemone 2: non so a quali proprietà dello store devo abbonarmi, devo leggere sempre tutto lo store?
            !!!!! soluzione 2?: dovrei dichiarare le variabili a cui mi abbono, salvarle nello stato e precaricarle tramite mapStateToProps*/

    public deleteProperty(target: ME, key: string | symbol, proxyItself?: Proxyfied<any>): boolean {
        if (typeof key === "symbol") return false;
        this.set(target, key, undefined, proxyItself);
        delete target[key];
        return true; }

    private mergedObject(target: ME): GObject{
        let ret: GObject = {...target}; // U.arrayMergeInPlace(Object.keys(target), Object.keys(this.l).filter(k => k.indexOf('set_') !== 0 && k.indexOf('get_') !== 0));
        for (let k in this.l) {
            if (!(k in ret) && k.lastIndexOf('get_', 4) !== 0 && k.lastIndexOf('set_', 4) !== 0) ret[k] = true;
        }
        return ret;
    }
    ownKeys(target: ME): ArrayLike<string | symbol>{
        const ret: GObject = this.mergedObject(target);
        // ret = Reflect.ownKeys(ret);
        return Reflect.ownKeys(ret);
    }

    // has(target: ME, p: string | symbol): boolean { return p in this.mergedObject(target); }
    has(target: ME, p: string | symbol): boolean { return (p in target) || (p in this.l); }

    /*
    apply(target: DModelElement, thisArg: any, argArray: any[]): any {
        // will i ever use it? dovrei pasare una funzione invece di una classe, quindi in questo caso credo wrappi solo il costruttore
    }*/
}
RuntimeAccessibleClass.set_extend(MyProxyHandler, TargetableProxyHandler);

type LGObjectContext<D extends GObject = GObject> = LogicContext2<D, LGObject, LGObject>;
@RuntimeAccessible('DGObject')
export class DGObject extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
}
@RuntimeAccessible('DArray')
export class DArray extends DGObject {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
}


@RuntimeAccessible('LGObject')
export class LGObject<D extends GObject = GObject, Context extends LGObjectContext<D> = LogicContext2<D, any, any>> extends LPointerTargetable{
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DGObject & GObject;
    // use wrapObject instead, or L.wrap for D-objects & pointers
    static wrap(val: never): any { return null as any; }
    static from(val: never): any { return null as any; }

    static wrapObject(base: DPointerTargetable, path: string, val: GObject): LGObject {
        if (!val || typeof val !== 'object') return val as any;
        let singleton: LGObject|LArray = (Array.isArray(val) ? LArray : LGObject).singleton as LGObject;

        //let c = new LogicContext2<GObject, LGObject, LGObject>(singleton, val, base, path);
        return new Proxy(val, new TargetableProxyHandler(val, base, path, singleton)) as LGObject;
    }

    protected _defaultGetter(c: Context, k: keyof D): any {
        let val = c.data[k];
        if (typeof k === 'symbol') { return val; }
        let path = (c.path ? c.path+'.' : '') + (k as string);
        LGObject.wrapObject(c.base, path, val);
        return val;
    }
}

export class LArrayMock extends Array<any>{
    pop(): any {
    }
}

@RuntimeAccessible('LArray')
export class LArray<D extends Array<any> & GObject = Array<any> & GObject, Context extends LogicContext2<D, LArray, LArray> = LogicContext2<D, any, any>> extends LGObject{
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DArray & Array<any>;

    static wrap(val: never): any { return null as any; }
    static from(val: never): any { return null as any; }

    get_push(c: Context): this['push']{ return (...i: D[])=>{
        for (let e of i) {
            e = Pointers.from(e) as any || e;
            SetFieldAction.new(c.path, '' as any, e, '+=', Pointers.isPointer(e));
        }
        return c.data.length + i.length;
    }}

    push(...items: D[]): number { return this.wrongAccessMessage('push'); }
}

@RuntimeAccessible('MapProxyHandler')
export class MapProxyHandler extends TargetableProxyHandler<Dictionary, LPointerTargetable> {
    // todo: sposta alcune funzioni da TargetableProxy a MyProxy e fai estendere direttamente MyProxy a questa classe
    public subMapKeys: Dictionary<string, any | Dictionary<DocString<'nested map keys'>>>;

    constructor(d: Dictionary, baseObjInLookup: DPointerTargetable, additionalPath: string = '', subMapKeys: Dictionary<string, any | Dictionary<DocString<'nested map keys'>>> = {}) {
        super(d, baseObjInLookup, additionalPath, LPointerTargetable.singleton);
        this.subMapKeys = subMapKeys;
    }

    get(target: Dictionary, key: string | number | symbol, proxyitself: Proxyfied<Dictionary>): any {
        if (typeof key === "symbol") return this.d[key as any];
        let val: any = this.d[key];
        if (key in this.subMapKeys && !(key in target)) { Log.exx('property not found in dictionary', {target, key, thiss:this, proxyitself, submapkeys: this.subMapKeys}); return undefined; }
        if (key in this.subMapKeys) {
            this.additionalPath += '.';
            return MapProxyHandler.mapWrap( this.d, this.baseObjInLookup, this.additionalPath, this.subMapKeys[key]);
            Log.exDevv('todo: wrap sub-map', {thiss: this});
        }
        return target[key as string]; }

    set(target: Dictionary, key: string | number | symbol, value: any, proxyitself: Proxyfied<Dictionary>): boolean {
        if (typeof key === "symbol") { Log.exx('cannot set a symbol in dictionary', {target, key, value, proxyitself}); return false; }
        SetRootFieldAction.new(this.additionalPath + '.' + key, value, '',false)
        return true;
    }

    public deleteProperty(target: Dictionary, key: string | symbol, proxyItself?: Proxyfied<any>): boolean {
        if (typeof key === "symbol") return false;
        this.set(target, key, undefined, proxyItself);
        delete target[key];
        return true; }
}
RuntimeAccessibleClass.set_extend(MyProxyHandler, MapProxyHandler);
// 15-20 min + 5 di domande entro il 1° ottobre, discussione 10-12 ottobre
export const getPath: GetPath = new Proxy( {}, new GetPathHandler());
(window as any).getPath = getPath;
// usage: pathstring = ((getPath as DType).some.path.to.follow as any).$; // = "some.path.to.follow" with compilation-time validation
