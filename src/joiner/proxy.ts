import type {GObject, Proxyfied} from "../joiner";
import {
    DModelElement,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    LPointerTargetable,
    DPointerTargetable,
    Log,
    U,
    JsType,
    SetFieldAction,
    Dictionary,
    SetRootFieldAction,
    LModelElement, Pointer, DViewElement
} from "../joiner";

type NotAConcatenation = null;

@RuntimeAccessible
export class LogicContext<D extends GObject = DModelElement, P extends MyProxyHandler<D> = MyProxyHandler<D>> extends RuntimeAccessibleClass{
    public proxy: P;
    public data: D;
    constructor(proxy: P, data: D) {
        super();
        this.proxy = proxy;
        this.data = data;
    }
    /*
        saveToRedux(propkey: "keyof data" | string, val: "typeof data[path]" | any): void { // todo: ask non stackoverflow
            // todo, put data in redux store, path is "obj1.obj2.obj3..." might replace it with a path funciton that return the foremost nested object container
            if (!propkey) {
                // todo: set whole object instead of a property
            }
        }*/
}

@RuntimeAccessible
export class MapLogicContext extends LogicContext<GObject, MapProxyHandler> {
    data: GObject;
    path: string;
    subMaps: string[];
    constructor(proxy: MapProxyHandler, data: GObject, path: string, subMaps: string[] = []) {
        super(proxy, data);
        this.proxy = proxy;
        this.data = data;
        this.path = path;
        this.subMaps = subMaps;
    }
}

@RuntimeAccessible
export abstract class MyProxyHandler<T extends GObject> extends RuntimeAccessibleClass implements ProxyHandler<T>{
    s: string = 'set_';
    g: string = 'get_';
    get(target: T, p: string | number | symbol, proxyitself: Proxyfied<T>): boolean { throw new Error('proxy get must be overridden'); }
    set(target: T, p: string | number | symbol, value: any, proxyitself: Proxyfied<T>): boolean { throw new Error('proxy set must be overridden'); }
    deleteProperty(target: T, p: string | symbol): boolean { throw new Error('proxy delete must be overridden'); }

    ownKeys(target: T): ArrayLike<string | symbol>{ return Object.keys(target); }

    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable>
        (data: D | Pointer<DViewElement>, baseObjInLookup?: DPointerTargetable, path: string = ''): L{
        return DPointerTargetable.wrap(data, baseObjInLookup, path); }

    static isProxy(data: GObject): boolean { return data?.__isProxy || false; }
}

export type GetPath<T = GObject> = T;

@RuntimeAccessible
class GetPathHandler<T extends GObject> extends MyProxyHandler<T>{
    strbuilder: string = '';
    get(targetObj: T, propKey: keyof T | string, proxyitself: Proxyfied<T>): any {
        // console.log('GetPathHandler', {targetObj, propKey, proxyitself});
        if (propKey === "start") this.strbuilder = '';
        if (propKey === '$') { const ret = this.strbuilder; this.strbuilder = ''; return ret; }
        this.strbuilder += (this.strbuilder ? '.' : '') + propKey;
        return proxyitself;
    }
}


@RuntimeAccessible
export class TargetableProxyHandler<ME extends GObject = DModelElement, LE extends LPointerTargetable = LModelElement> extends MyProxyHandler<ME> {
// permette di fare cose tipo: user.name_surname che ritorna la concatenazione di nome e cognome anche se il campo name_surname non esiste.
    lg: LE & GObject; // to disable type check easily and access 'set_' + varname dynamically
    l: LE;
    d: ME;

    constructor(d: ME, public baseObjInLookup?: DPointerTargetable, public additionalPath: string = '', l?: LE) {
        super();
        this.d = d;
        if (!l) {
            l = RuntimeAccessibleClass.get(d.className)?.logic?.singleton as LE;
            Log.exDev(!l, 'Trying to wrap class without singleton or logic mapped', { object: d })
        }
        this.l = l as LE;
        this.lg = this.l;
    }

    private concatenableHandler(targetObj: ME, propKey: number | string | symbol, proxyitself: Proxyfied<ME>): NotAConcatenation | any {
        if (propKey in targetObj)  return null as NotAConcatenation;
        const propKeyStr: null | string = U.asString(propKey, null);
        let _index: number = propKeyStr ? propKeyStr.indexOf('_') : -1;
        if (_index < 0) return null as NotAConcatenation;

        let isConcatenable = true;
        let ret: any = (propKey as string).split('_').map( (subKey: string) => {
            // se trovo multipli ___ li tratto come spazi aggiuntivi invece che come proprietà '' che ritornano undefined, così posso fare name___surname --> "damiano   di vincenzo"
            let val: any = subKey === '' ? ' ' : this.get(targetObj, subKey, proxyitself);
            isConcatenable = isConcatenable && JsType.isPrimitive(val);
            return val;
        });
        return isConcatenable ? ret.join(' ') : ret; }

    public get(targetObj: ME, propKey: string | symbol, proxyitself: Proxyfied<ME>): any {
        let ret;
        let isError = false;
        // console.error('_proxy get PRE:', {targetObj, propKey, proxyitself});
        try { ret = this.get0(targetObj, propKey, proxyitself); } catch(e) { ret = e; isError = true;}

        // if (isError) throw ret;
        // console.error('_proxy get POST:', {targetObj, propKey, ret});
        return ret;
    }

    public get0(targetObj: ME, propKey: string | symbol, proxyitself: Proxyfied<ME>): any {
        if (propKey === "__raw") return targetObj;
        switch(propKey){
            case '__raw': return targetObj;
            case 'toJSON': return () => targetObj;
            case '__isProxy': return true;
        }
        if (propKey in this.l) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.g + propKey in this.lg) return this.lg[this.g + propKey](new LogicContext(this, targetObj,));
            // se esiste la proprietà ma non esiste il setter, che fare? do errore.
            // Log.eDevv("dev error: property exist but getter does not: ", propKey, this);
            // console.error('proxy GET direct match', {targetObj, propKey, ret: this.d[propKey as keyof ME]});
            // console.error('proxy GET direct match', {l:this.l});
            return this.d[propKey as keyof ME];
        }
        if (typeof propKey === "symbol") {
            switch(String(propKey)){
                default: Log.exDevv('unexpected symbol:', propKey); break;
                case "Symbol(Symbol.toPrimitive)": return this.lg[propKey as any] || (targetObj as any)[propKey] || typeof targetObj;
            }
        }
        // if property do not exist
        const concatenationTentative = this.concatenableHandler(targetObj, propKey, proxyitself);
        if (concatenationTentative !== null) return concatenationTentative;
        Log.exx('GET property "', (propKey as any), '" do not exist in object of type "' + U.getType(this.l), {logic: this.l, data: targetObj});
        return undefined;
        // todo: credo che con espressioni sui tipi siano tipizzabili tutti i return di proprietà note eccetto quelle ottenute per concatenazione.
    }

    public set(targetObj: ME, propKey: string | symbol, value: any, proxyitself?: Proxyfied<ME>): boolean {
        let enableFallbackSetter = true;
        if (propKey in this.l) {
            // todo: il LogicContext passato come parametro risulta nell'autocompletion editor automaticamente generato, come passo un parametro senza passargli il parametro? uso arguments senza dichiararlo?
            if (typeof propKey !== 'symbol' && this.s + propKey in this.lg) return this.lg[this.s + propKey](value, new LogicContext(this, targetObj));


            if (enableFallbackSetter) {
                new SetFieldAction(new LogicContext(this, targetObj).data as any, propKey as string, value);
                return true;
            }
            // se esiste la proprietà ma non esiste il setter, che fare? do errore.
            Log.eDevv("dev error: property exist but setter does not: ", propKey, this);
        }
        // if property do not exist
        Log.exx('SET property "' + (propKey as any) + '" do not exist in object of type "' + U.getType(this.l));
        return false; }
    /*      problema: ogni oggetto deve avere multipli puntatori, quando ne modifico uno devo modificarli tutti, come tengo traccia?
            ipotesi 1: lo memorizzo in un solo posto (store.idlookup) e uso Pointer<type, lb, ub> che è una stringa che simula un puntatore
            problema 1: se fornisco l'intero store ai componenti si aggiornano ad ogni singola modifica, se estraggo i campi interesasti le stringhe puntatore sono invariate ma il contenuto puntato è cambiato e il componente non lo sa...
            problemone 2: non so a quali proprietà dello store devo abbonarmi, devo leggere sempre tutto lo store?
            !!!!! soluzione 2?: dovrei dichiarare le variabili a cui mi abbono, salvarle nello stato e precaricarle tramite mapStateToProps*/

    public deleteProperty(target: ME, p: string | symbol): boolean {
        if (typeof p === "symbol") return false;
        this.set(target, p, undefined, undefined);
        delete target[p];
        return true;
    }

    ownKeys(target: ME): ArrayLike<string | symbol>{
        return U.arrayMergeInPlace(Object.keys(target), Object.keys(this.l).filter(k => k.indexOf('set_') !== 0 || k.indexOf('get_') !== 0));
    }

    /*
    apply(target: DModelElement, thisArg: any, argArray: any[]): any {
        // will i ever use it? dovrei pasare una funzione invece di una classe, quindi in questo caso credo wrappi solo il costruttore
    }*/
}

@RuntimeAccessible
export class MapProxyHandler extends MyProxyHandler<Dictionary> {
    public subMapKeys: string[];
    constructor(public d: Dictionary, public baseObjInLookup?: DPointerTargetable, public additionalPath: string = '', subMapKeys: string[] = []) { super(); this.subMapKeys = subMapKeys; }

    get(target: Dictionary, key: string | number | symbol, proxyitself: Proxyfied<Dictionary>): any {
        //if (!(key in target)) { // Log.exx('property not found in dictionary', {target, key, thiss:this, proxyitself}); return undefined; }
        if (key in this.subMapKeys){
            // todo: wrap sub-map
            Log.exDevv('todo: wrap sub-map', {thiss: this});
        }
        return target[key as string]; }

    set(target: Dictionary, key: string | number | symbol, value: any, proxyitself: Proxyfied<Dictionary>): boolean {
        if (typeof key === "symbol") { Log.exx('cannot set a symbol in dictionary', {target, key, value, proxyitself}); return false; }
        new SetRootFieldAction(this.additionalPath + '.' + key, value).fire();
        return true;
    }
}



// 15-20 min + 5 di domande entro il 1° ottobre, discussione 10-12 ottobre
export const getPath: GetPath = new Proxy( {}, new GetPathHandler());
(window as any).getPath = getPath;
// usage: pathstring = ((getPath as DType).some.path.to.follow as any).$; // = "some.path.to.follow" with compilation-time validation
