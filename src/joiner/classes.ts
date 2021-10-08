import {
    U,
    Uarr,
    GObject,
    Proxyfied,
    Pointer,
    store,
    TargetableProxyHandler,
    DViewElement,
    Log,
    DUser,
    Dictionary,
    LogicContext,
    MyProxyHandler,
    LViewElement,
    MapProxyHandler
} from "../joiner";
// qui dichiarazioni di tipi che non sono importabili con "import type", ma che devono essere davvero importate a run-time (eg. per fare un "extend", chiamare un costruttore o usare un metodo statico)



export class RuntimeAccessibleClass {
    // static allRuntimeClasses: string[] = [];
    static classes: Dictionary<string, typeof RuntimeAccessibleClass> = {};
    static getAllNames(): string[] { return Object.keys(RuntimeAccessibleClass.classes); }
    static getAllClasses(): typeof RuntimeAccessibleClass[] { return Object.values(RuntimeAccessibleClass.classes); }
    static getAllClassesDictionary(): Dictionary<string, typeof RuntimeAccessibleClass> { return RuntimeAccessibleClass.classes; }

    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable>(data: D | Pointer<DViewElement>, baseObjInLookup?: DPointerTargetable, path: string = ''): L{
        if (!data || (data as any).__isProxy) return data as any;
        if (typeof data === 'string') {
            data = store.getState().idlookup[data] as unknown as D;
            if (!data) { return Log.exx('Cannot wrap:', {data, baseObjInLookup, path}); }
        }
        if (!data) return data;
        // console.log('ProxyWrapping:', {data, baseObjInLookup, path});
        return new Proxy(data, new TargetableProxyHandler(data, baseObjInLookup, path));
    }

    static mapWrap2<D extends DPointerTargetable, L extends LPointerTargetable>(map: RuntimeAccessibleClass, container: D, baseObjInLookup?: DPointerTargetable, path: string = ''): L{
        if (!map || (map as any).__isProxy) return map as any;
        if (typeof container === 'string') {
            container = store.getState().idlookup[container] as unknown as D;
            if (!container) { return Log.exx('Cannot wrap map:', {map, container, baseObjInLookup, path}); }
        }
        // console.log('ProxyWrapping:', {data, baseObjInLookup, path});
        return new Proxy(map, new MapProxyHandler(map, baseObjInLookup, path));
    }


    static mapWrap(data: Dictionary, baseObjInLookup: DPointerTargetable, path: string, subMapKeys: string[]): Proxyfied<Dictionary> {
        if (!data || (data as any).__isProxy) return data as any;
        // console.error('GETMAP', {data, logicContext, path});
        return new Proxy(data, new MapProxyHandler(data, baseObjInLookup, path, subMapKeys));
    }

    className: string;
    constructor() {
        this.className = this.constructor.name;
        // todo: remove the direct link in window and all references?
        (window as any)[this.className] =
        RuntimeAccessibleClass.classes[this.className] = this.constructor as any;
        // RuntimeAccessibleClass.allRuntimeClasses.push(this.className);
    }

    public static get<T extends typeof RuntimeAccessibleClass = typeof RuntimeAccessibleClass>(dclassname: string) : T & {logic?: typeof LPointerTargetable} { return this.classes[dclassname] as any; }

    public static extends(className: string, superClassName: string, returnIfEqual: boolean = true): boolean {
        let superclass = RuntimeAccessibleClass.get(superClassName);
        const thisclass = RuntimeAccessibleClass.get(className);
        if (superclass === thisclass) return returnIfEqual;
        if (!superclass || !thisclass) return false;
        return (thisclass instanceof superclass); // todo: check if works with constructors
    }
}



// annotation
export function RuntimeAccessible<T extends any>(constructor: T): T {
    // console.log('DecoratorTest', {constructor, arguments});
    // @ts-ignore
    RuntimeAccessibleClass.classes[constructor.name] = constructor as any as typeof RuntimeAccessibleClass;
    // @ts-ignore
    constructor.prototype.className = constructor.name;
    return constructor;
}

(window as any).RuntimeAccessibleClass = RuntimeAccessibleClass;
// todo: problema: per creare un PointerTargetable ho bisogno dell'userid, e devo generarlo prima che venga generato l'initialState... dovrebbe venir servito con la pagina dal server. o passato come navigation props dalla pagina di login

@RuntimeAccessible
export class DPointerTargetable extends RuntimeAccessibleClass {
    private static maxID: number = 0;
    public static logic: typeof LPointerTargetable;
    _storePath?: string[];

    id: string;
    constructor(isUser: any = false, id?: any, a?: any, b?:any, c?:any) {
        super();
        const userid = DUser.current;
        this.id = id || (isUser ? '' : userid + "_") + DPointerTargetable.maxID++ + "_" + new Date().getTime();
        // todo store.dispatch(new IdLinkAction(this));
    }

}

@RuntimeAccessible
export class LPointerTargetable extends DPointerTargetable {
    public static structure: typeof DPointerTargetable;
    public static singleton: LPointerTargetable;

    public __raw!: this;

    public get__extends(superClassName: string, context: LogicContext<this>): boolean {
        return RuntimeAccessibleClass.extends(context.data.className, superClassName);
    }
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
    public static isAnyOfTypes(data: any, ...acceptables: JsType[]): boolean { return !!Uarr.arrayIntersection(JsType.getTypes(data), acceptables).length; }
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
        return U.getFunctionSignatureFromComments(data).isLambda; }
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
