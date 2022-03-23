import {Mixin} from "ts-mixer";
import type {Class, Longest} from "ts-mixer/dist/types/types";
import type {Dictionary, GObject, Pointer, Proxyfied, DocString, CClass} from "./types";
import type {DViewElement} from "../view/viewElement/view";
import type {LogicContext} from "./proxy";
var windoww = window as any;
// qui dichiarazioni di tipi che non sono importabili con "import type", ma che devono essere davvero importate a run-time (eg. per fare un "extend", chiamare un costruttore o usare un metodo statico)


console.warn('ts loading classes');


// annotation @RuntimeAccessible
// import {store} from "../redux/createStore";

abstract class AbstractMixedClass {
    // superclass!: Dictionary<DocString<'parent class name', Class>>;
    static logic: typeof LPointerTargetable;
    static structure: typeof DPointerTargetable;
    static singleton: RuntimeAccessibleClass;
    static [key: string]: any;
    static init_constructor(...constructorArguments: any): void{}
}

export abstract class RuntimeAccessibleClass extends AbstractMixedClass {
    static fixStatics() {
        // problem: se lo statico è un valore primitivo ne genera una copia.
        for (let classs of Object.values(RuntimeAccessibleClass.annotatedClasses)) {
            let gclass = classs as GObject;
            console.log('fix statics', {gclass, s: gclass.s});
            for (let statickey in gclass.s) { gclass[statickey] = gclass.s[statickey]; }
        }
    }
    // static allRuntimeClasses: string[] = [];
    static classes: Dictionary<string, typeof RuntimeAccessibleClass> = {};
    static annotatedClasses: Dictionary<string, typeof RuntimeAccessibleClass> = {};

    static getAllNames(annotated = false): string[] {
        return Object.keys(annotated ? RuntimeAccessibleClass.annotatedClasses : RuntimeAccessibleClass.classes); }
    static getAllClasses(annotated = false): typeof RuntimeAccessibleClass[] {
        return Object.values(annotated ? RuntimeAccessibleClass.annotatedClasses : RuntimeAccessibleClass.classes); }
    static getAllClassesDictionary(annotated = false): Dictionary<string, typeof RuntimeAccessibleClass> {
        return annotated ? RuntimeAccessibleClass.annotatedClasses : RuntimeAccessibleClass.classes; }

    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable = LPointerTargetable, CAN_THROW extends boolean = false,
        RET extends CAN_THROW extends true ? L : L | undefined  = CAN_THROW extends true ? L : L | undefined>
    (data: D | Pointer<DViewElement>, baseObjInLookup?: DPointerTargetable, path: string = '', canThrow: CAN_THROW = false as CAN_THROW): CAN_THROW extends true ? L : L | undefined{
        if (!data || (data as any).__isProxy) return data as any;
        if (typeof data === 'string') {
            data = windoww.store.getState().idlookup[data] as unknown as D;
            if (!data) {
                if (canThrow) return windoww.Log.exx('Cannot wrap:', {data, baseObjInLookup, path});
                else return undefined as RET;
            }
        }
        if (!data) return data;
        // console.log('ProxyWrapping:', {data, baseObjInLookup, path});
        return new Proxy(data, new windoww.TargetableProxyHandler(data, baseObjInLookup, path)) as L;
    }
    /*
        static mapWrap2<D extends DPointerTargetable, L extends LPointerTargetable>(map: RuntimeAccessibleClass, container: D, baseObjInLookup?: DPointerTargetable, path: string = ''): L{
            if (!map || (map as any).__isProxy) return map as any;
            if (typeof container === 'string') {
                container = store.getState().idlookup[container] as unknown as D;
                if (!container) { return Log.exx('Cannot wrap map:', {map, container, baseObjInLookup, path}); }
            }
            // console.log('ProxyWrapping:', {data, baseObjInLookup, path});
            return new Proxy(map, new MapProxyHandler(map, baseObjInLookup, path));
        }

    */

    static mapWrap(data: Dictionary, baseObjInLookup: DPointerTargetable, path: string, subMapKeys: string[] = []): Proxyfied<Dictionary> {
        if (!data || (data as any).__isProxy) return data as any;
        // console.error('GETMAP', {data, logicContext, path});
        return new Proxy(data, new windoww.MapProxyHandler(data, baseObjInLookup, path));
    }

    className!: string;
    constructor(...a:any) {
        super();
        RuntimeAccessibleClass.init_constructor(this, ...a);
        // this.className = this.constructor.name;
        // nb: per i mixin questo settaggio viene sovrascritto. perchè il mixin crea le 2 classi ereditate separatamente con i loro costruttori e le incrocia. quindi devo settarlo dall'annotazione @ tramite prototype
        // RuntimeAccessibleClass.allRuntimeClasses.push(this.className);
    }

    static init_constructor(thiss: any, ...args: any): void {

        // this.className = this.constructor.name;
        // let finalObject = this;
        // if (finalObject.constructor.name === "DVoidVertex" || finalObject.constructor.name === "DGraphElement") { let breakp = true; }
        // this.init0(...arguments);
        thiss.className = this.name;
    }

    public static get<T extends typeof RuntimeAccessibleClass = typeof RuntimeAccessibleClass>(dclassname: string, annotated = false)
        : T & {logic?: typeof LPointerTargetable} { return (annotated ? RuntimeAccessibleClass.annotatedClasses : this.classes)[dclassname] as any; }

    public static extends(className: string, superClassName: string, returnIfEqual: boolean = true): boolean {
        let superclass = RuntimeAccessibleClass.get(superClassName);
        const thisclass = RuntimeAccessibleClass.get(className);
        if (superclass === thisclass) return returnIfEqual;
        if (!superclass || !thisclass) return false;
        return (thisclass instanceof superclass); // todo: check if works with constructors
    }

    getAllPrototypeSuperClasses(): GObject[] {
        let currentlevel = this;
        let ret: GObject[] = [];
        while (true) {
            if (!currentlevel) break;
            ret.push(currentlevel);
            // @ts-ignore
            currentlevel = currentlevel.__proto__;
        }
        console.log('constructor chain:', ret);
        return ret;
    }
    /*initBase(){
        let superclasses = this.getAllPrototypeSuperClasses();
        for (let sc of superclasses) {
            if (!sc.hasOwnProperty('init0')) continue;
            console.log('initbase calling ', {thiss: this, sc, init0: sc.init0, args:sc.constructorArguments});
            sc.init0.apply(this, ...(sc.constructorArguments || []));
        }
    }*/
    // protected abstract init(...constructorParameters: any): void;
    // NB: per colpa della limitazione #3 di ts-mixer,
    // DEVO chiamare init su ogni oggetto per settargli il corretto this.className, altrimenti prende quello dell'ultima superclasse
    /*protected init0(...constructorParameters: any): void {
        let a = this;
        let finalObject = this;
        console.log('creation of___ ', {thiss: this, finalObject});
        if (finalObject.constructor.name === "DVoidVertex" || finalObject.constructor.name === "DGraphElement") {
            let breakp = true; }

        (window as any)[finalObject.constructor.name] =
            RuntimeAccessibleClass.classes[finalObject.constructor.name] = finalObject.constructor as any;
        // @ts-ignore
        // delete this.className;
        this.className = (finalObject as any).__proto__.className;
    }*/

}

export function RuntimeAccessible<T extends any>(constructor: T & GObject): T {
    // console.log('DecoratorTest', {constructor, arguments});
    // @ts-ignore
    RuntimeAccessibleClass.classes[constructor.name] = constructor as any as typeof RuntimeAccessibleClass;
    if (!window[constructor.name]) (window[constructor.name] as any) = constructor;
    constructor.prototype.className = constructor.name;
    //constructor.prototype.$$typeof = constructor.name;
    //constructor.prototype.typeName = constructor.name;
    (constructor as any).staticClassName = constructor.name;
    // @ts-ignore
    console.log('runtimeaccessible annotation:', {thiss:this, constructor});
//    const classnameFixedConstructor = constructor; //  function (...args) { let obj = new constructor(...args); obj.init?.(); obj.init0?.(); return obj; }

    // @ts-ignore
    let outerthis = this;
    // @ts-ignore
    const classnameFixedConstructorDoNotRenameWithoutSearchStrings = function (...args) {
        // @ts-ignore
        console.log('runtimeaccessible annotation inner:', {thiss:this, outerthis, constructor});
        // @ts-ignore
        let obj = new constructor(...args);
        obj.classNameFromAnnotation = constructor.name;
        obj.className = constructor.name;
        //obj.prototype.$$typeof = constructor.name;
        // obj.prototype.typeName = constructor.name;
        // obj.init?.();
        // obj.init0?.();
        obj.initBase?.();
        // @ts-ignore
        console.log('runtimeaccessible annotation inner end:', {thiss:this, outerthis, constructor, obj});
        return obj; }
    RuntimeAccessibleClass.annotatedClasses[constructor.name] = classnameFixedConstructorDoNotRenameWithoutSearchStrings as any as typeof RuntimeAccessibleClass;

    for (let key in constructor) (classnameFixedConstructorDoNotRenameWithoutSearchStrings as GObject)[key] = constructor[key];
    // constructor.constructor = classnameFixedConstructorDoNotRenameWithoutSearchStrings; return constructor;

    // @ts-ignore
    // for (let staticKey of constructor as GObject) { classnameFixedConstructorDoNotRenameWithoutSearchStrings[staticKey] = constructor[staticKey]; }
    classnameFixedConstructorDoNotRenameWithoutSearchStrings.prototype = constructor.prototype;
    classnameFixedConstructorDoNotRenameWithoutSearchStrings.prototype.constructor = constructor.prototype.constructor;

    // required for inheriting static methods
    classnameFixedConstructorDoNotRenameWithoutSearchStrings.__proto__ = constructor.__proto__;
    classnameFixedConstructorDoNotRenameWithoutSearchStrings.s = constructor;
    // return classnameFixedConstructorDoNotRenameWithoutSearchStrings as any;
    return constructor;
}


(window as any).RuntimeAccessibleClass = RuntimeAccessibleClass;
// todo: problema: per creare un PointerTargetable ho bisogno dell'userid, e devo generarlo prima che venga generato l'initialState... dovrebbe venir servito con la pagina dal server. o passato come navigation props dalla pagina di login

@RuntimeAccessible
export class DPointerTargetable extends RuntimeAccessibleClass {
    public static maxID: number = 0;
    public static logic: typeof LPointerTargetable;
    _storePath?: string[];
    _subMaps?: Dictionary<string, boolean>;

    id!: string;
    pointedBy: DocString<'path in store'>[] = []; // NB: potrebbe contenere puntatori invalidi.
    // se viene cancellato un intero oggetto A che contiene una lista di puntatori, gli oggetti che puntano ad A rimuovono A dai loro "poitnedBy",
    // ma gli oggetti puntati da A tramite sotto-oggetti o attributi (subviews...) non vengono aggiornati in "pointedby"
    constructor(isUser: any = false, id?: any, a?: any, b?:any, c?:any) {
        super();
        DPointerTargetable.init_constructor(this, ...arguments);
    }

    static init_constructor(thiss: DPointerTargetable, isUser: any = false, id?: any, a?: any, b?:any, c?:any): void {
        const userid = DUser.current;
        thiss.id = id || (isUser ? '' : userid + "_") + DPointerTargetable.maxID++ + "_" + new Date().getTime();
        thiss.className = this.name;
        // todo store.dispatch(new IdLinkAction(this));
    }

}

@RuntimeAccessible
export class LPointerTargetable extends DPointerTargetable {
    public static structure: typeof DPointerTargetable;
    public static singleton: LPointerTargetable;
    // @ts-ignore
    public pointedBy: LPointerTargetable[];
    public __raw!: this;

    public get__extends(superClassName: string, context: LogicContext<this>): boolean {
        return RuntimeAccessibleClass.extends(context.data.className, superClassName);
    }

    public get_pointedBy(superClassName: string, context: LogicContext<DPointerTargetable>): LPointerTargetable[] {
        let state: GObject = windoww.store.getState();
        function getForemostObjectInPath(path: DocString<'storePath'>): undefined | LPointerTargetable {
            let lastPointableObject: undefined | DPointerTargetable;
            let pathArray = path.split('.');
            for (let key of pathArray) {
                let currentObj: GObject = state[key];
                if (!currentObj) break;
                if (currentObj && currentObj.id && state.idlookup[currentObj.id]) lastPointableObject = state.idlookup[currentObj.id];
            }
            return lastPointableObject && DPointerTargetable.wrap(lastPointableObject);
        }
        return (context.data.pointedBy || []).map(getForemostObjectInPath).filter( lobj => !!lobj) as LPointerTargetable[];
    }

    public set_pointedBy(val: never, context: LogicContext<DPointerTargetable>): boolean {
        windoww.Log.exx('pointedBy field should never be directly edited.', {context, val});
        return false;
    }
}

@RuntimeAccessible
export class DUser extends DPointerTargetable{
    static current: DocString<Pointer<DUser, 1, 1>> = "currentUserPointerToDo";
}

@RuntimeAccessible
export class LUser extends MixOnlyFuncs(DUser, LPointerTargetable) {

}

@RuntimeAccessible
export class MyError extends Error {
    constructor(message?: string, ...otherMsg: any[]) {
        // 'Error' breaks prototype chain here
        super(message);
        const proto = (this as any).__proto__;

        console.error(proto.constructor.name, message, ...otherMsg);
        // restore prototype chain
        const actualProto = new.target.prototype;

        if (Object.setPrototypeOf) { Object.setPrototypeOf(this, actualProto); }
        else { (this as any).__proto__ = actualProto; }
        (this as any).className = this.constructor.name;
    }
}

// @RuntimeAccessible
export class JsType{
    public static all: JsType[] = [];
    public static object: JsType = new JsType("object", JsType.isObject, false);
    public static function: JsType = new JsType("function", JsType.isFunction, false);
    public static array: JsType = new JsType("array", JsType.isArray, false);
    public static date: JsType = new JsType("Date", JsType.isDate, false);

    public static lambdaFunction: JsType = new JsType("lambda-function", JsType.isLambdaFunction, true);
    public static nonLambdaFunction: JsType = new JsType("non-lambda-function", JsType.isNonLambdaFunction, true);
    public static symbol: JsType = new JsType("symbol", JsType.isSymbol, true);
    public static undefined: JsType = new JsType("undefined", JsType.isUndefined, true);
    public static null: JsType = new JsType("null", JsType.isNull, true);
    public static boolean: JsType = new JsType("boolean", JsType.isBoolean, true);
    public static number: JsType = new JsType("number", JsType.isNumber, true);
    public static bigint: JsType = new JsType("bigint", JsType.isBigint, true);
    public static string: JsType = new JsType("string", JsType.isString, true);

    private constructor(public printableTypeName: string, public check: (data: any) => boolean, public isExclusiveType: boolean){
        JsType.all.push(this);
    }
    public toString(): string { return this.printableTypeName; }
    /*
    * example: isObject but not Date, not function...
    * */
    public static isOnlyType(data: any, type: JsType): boolean { return !JsType.getTypes(data, type).length; }
    public static isAnyOfTypes(data: any, ...acceptables: JsType[]): boolean { return !!windoww.Uarr.arrayIntersection(JsType.getTypes(data), acceptables).length; }
    public static getTypes(data: any, stopIfTypeIsNot?: JsType): JsType[]{
        const ret: JsType[] = [];
        for (const type of JsType.all) {
            if (type.check(data)) {
                ret.push(data);
                if (stopIfTypeIsNot !== type) { return []; }
                if (type.isExclusiveType) return ret;
            }
        }
        return ret;
    }

    /// is...
    public static isObject(data: GObject | any): boolean { return typeof data === "object"; }
    public static isFunction(data: Function | any): boolean { return typeof data === "function"; }
    public static isLambdaFunction(data: Function | any): boolean {
        if (!JsType.isFunction(data)) return false;
        return windoww.U.getFunctionSignatureFromComments(data).isLambda; }
    public static isNonLambdaFunction(data: Function | any): boolean { return JsType.isFunction(data) && !JsType.isNonLambdaFunction(data); }
    public static isArray(data: Array<any> | any): boolean { return Array.isArray(data); }
    public static isSymbol(data: symbol | any): boolean { return typeof data === "symbol"; }
    public static isBoolean(data: symbol | any): boolean { return !!data === data; }
    public static isNumber(data: number | any): boolean { return typeof data === "number"; }
    public static isBigint(data: bigint | any): boolean { return typeof data === "bigint"; }
    public static isString(data: string | any): boolean { return typeof data === "string"; }
    public static isNull(data: null | any): boolean { return data === null; }
    public static isUndefined(data: undefined | any): boolean { return data === undefined; }
    public static isDate(data: Date | any): boolean { return data instanceof Date; }

    /// as...
    public static asObject<T>(data: GObject | any, fallbackReturn: T): T | GObject { return JsType.isObject(data) ? data : fallbackReturn; }
    public static asFunction<T>(data: Function | any, fallbackReturn: T): T | Function { return JsType.isFunction(data) ? data : fallbackReturn; }
    public static asLambdaFunction<T>(data: Function | any, fallbackReturn: T): T | Function { return JsType.isLambdaFunction(data) ? data : fallbackReturn; }
    public static asNonLambdaFunction<T>(data: Function | any, fallbackReturn: T): T | Function { return JsType.isNonLambdaFunction(data) ? data : fallbackReturn; }
    public static asArray<T, A>(data: Array<A> | any, fallbackReturn: T): T | Array<A> { return JsType.isArray(data) ? data : fallbackReturn; }
    public static asSymbol<T>(data: symbol | any, fallbackReturn: T): T | symbol { return JsType.isSymbol(data) ? data : fallbackReturn; }
    public static asBoolean<T>(data: boolean | any, fallbackReturn: T): T | boolean { return JsType.isBoolean(data) ? data : fallbackReturn; }
    public static asNumber<T>(data: number | any, fallbackReturn: T): T | number { return JsType.isNumber(data) ? data : fallbackReturn; }
    public static asBigint<T>(data: bigint | any, fallbackReturn: T): T | bigint { return JsType.isBigint(data) ? data : fallbackReturn; }
    public static asString<T>(data: string | any, fallbackReturn: T): T | string { return JsType.isString(data) ? data : fallbackReturn; }
    public static asNull<T>(data: null | any, fallbackReturn: T): T | null { return JsType.isNull(data) ? data : fallbackReturn; }
    public static asUndefined<T>(data: undefined | any, fallbackReturn: T): T | undefined { return JsType.isUndefined(data) ? data : fallbackReturn; }
    public static asDate<T>(data: Date | any, fallbackReturn: T): T | Date { return JsType.isDate(data) ? data : fallbackReturn; }
    public static isPrimitive(data: any) { return !JsType.isAnyOfTypes(data, JsType.object, JsType.function, JsType.array); }
}


function invalidSuperClassError(/*callee: Class,*/ scname: string, superclass: Class): (() => never) {
    return () => { windoww.Log.exDevv('parent super class "' + scname + '" is not implementing init_constructor', {scname, superclass, }); throw new Error(); }
}
// @ts-ignore
function MixinFakeConstructor() { this.isMixinFakeConstructor = true; }
export function MixOnlyFuncs<A1 extends any[], I1, S1, A2 extends any[], I2, S2>(c1: Class<A1, I1, S1> & typeof RuntimeAccessibleClass, c2: Class<A2, I2, S2> & typeof RuntimeAccessibleClass):
    CClass<Longest<A1, A2>, I1 & I2
        & {
            // superclass: Dictionary<string, (/*thiss: I1 & I2,* / ...superConstructorParams:ConstructorParameters<Class<A1, I1, S1>> | ConstructorParameters<Class<A2, I2, S2>>) => void>,
            superclass1: Dictionary<DocString<'constructor name to make sure the user knows what superclass constructor is calling'>,  (...superConstructor1Params:ConstructorParameters<Class<A1, I1, S1>>) => void>,
            superclass2: Dictionary<DocString<'constructor name to make sure the user knows what superclass constructor is calling'>,  (...superConstructor2Params:ConstructorParameters<Class<A2, I2, S2>>) => void>,
            // initt: Class<A1, I1, S1>
        } & AbstractMixedClass
        // , Omit<Omit<Omit<S1 & S2, 'init_constructor'>, 'logic'>, 'maxID'> & typeof AbstractMixedClass> {
        , S1 & S2 & GObject & typeof AbstractMixedClass> {
    // strategia: passo dei finti valori che copiano i prototipi delle classi sovrascrivendo i costruttori per evitare che chiami i costruttori delle superclassi
    // ma che comunque erediti campi e funzioni
    // @ts-ignore
    let c1noconstructor: any = MixinFakeConstructor;
    let c2noconstructor: any = MixinFakeConstructor;
    c1noconstructor.prototype = c1.prototype;
    c2noconstructor.prototype = c2.prototype;

    let disableconstructor = false;
    if (!disableconstructor) {
        c1noconstructor = c1;
        c2noconstructor = c2; }


    let ret = Mixin(c1noconstructor, c2noconstructor);
    let c1name = c1.name === 'classnameFixedConstructorDoNotRenameWithoutSearchStrings' ? c1.prototype.className : c1.name;
    let c2name = c2.name === 'classnameFixedConstructorDoNotRenameWithoutSearchStrings' ? c2.prototype.className : c2.name;
    //ret.prototype['superclass'] = {};
    // ret.prototype['superclass'][c1name] = c1.prototype.init_constructor || invalidSuperClassError(c1name, c1);
    // ret.prototype['superclass'][c2name] = c2.init_constructor || invalidSuperClassError(c2name, c2);
    ret.prototype['superclass1'] = {};
    ret.prototype['superclass2'] = {};
    ret.prototype['superclass1'][c1name] = c1.init_constructor || invalidSuperClassError(c1name, c1);
    ret.prototype['superclass2'][c2name] = c2.init_constructor || invalidSuperClassError(c2name, c2);
    return ret;
}
console.warn('ts loaded classes');
