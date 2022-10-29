import {Mixin} from "ts-mixer";
import type {
    DExtEdge, DRefEdge, DVoidEdge, LGraphVertex, LRefEdge,
    LEdgePoint, DVoidVertex, DGraphVertex, DEdgePoint, DVertex, DEdge,
    LVertex, LGraph, DGraph, LVoidVertex, LVoidEdge, LEdge, LGraphElement, LExtEdge, DGraphElement,
    WEdge,
    WEdgePoint,
    WExtEdge, WGraph, WGraphElement,
    WGraphVertex,
    WRefEdge,
    WVertex,
    WVoidEdge, WVoidVertex
} from "../model/dataStructure";
import type {Class, Longest} from "ts-mixer/dist/types/types";
import type {
    DModelElement,
    LModelElement,
    DModel, LModel,
    DValue, LValue,
    DNamedElement, LNamedElement,
    DObject, LObject,
    DEnumerator, LEnumerator,
    DEnumLiteral, LEnumLiteral,
    DAttribute, LAttribute,
    DReference, LReference,
    DStructuralFeature, LStructuralFeature,
    DClassifier, LClassifier,
    DDataType, LDataType,
    DClass, LClass,
    DParameter, LParameter,
    DOperation, LOperation,
    DPackage, LPackage,
    DTypedElement, LTypedElement,
    DAnnotation, LAnnotation, DMap, LMap,
    EJavaObject,
    DFactory_useless_, LFactory_useless_,

    WAnnotation,
    WAttribute,
    WClass, WClassifier,
    WDataType,
    WEnumerator, WEnumLiteral, WMap, WModel, WModelElement, WNamedElement, WObject, WOperation, WPackage,
    WParameter,
    WReference,
    WStructuralFeature, WTypedElement, WValue} from "../model/logicWrapper";
// import type {Pointer} from "./typeconverter";
import type {Dictionary, GObject, Proxyfied, DocString, CClass} from "./types";
import type {DViewElement, LViewElement, WViewElement, WViewTransientProperties, LViewTransientProperties, DViewTransientProperties} from "../view/viewElement/view";
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

    static wrapAll<D extends RuntimeAccessibleClass, L extends LPointerTargetable = LPointerTargetable, CAN_THROW extends boolean = false,
        RET extends CAN_THROW extends true ? L[] : L[] = CAN_THROW extends true ? L[] : L[] >
    (data: D[] | Pointer<DPointerTargetable, 0, 'N'>, baseObjInLookup?: DPointerTargetable, path: string = '', canThrow: CAN_THROW = false as CAN_THROW): CAN_THROW extends true ? L[] : L[] {
        if (!Array.isArray(data)) return [];
        return data.map( d => DPointerTargetable.wrap(d, baseObjInLookup, path, canThrow)) as L[];
    }

    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable = LPointerTargetable, CAN_THROW extends boolean = false,
        RET extends CAN_THROW extends true ? L : L | undefined = CAN_THROW extends true ? L : L | undefined>
    (data: D | Pointer, baseObjInLookup?: DPointerTargetable, path: string = '', canThrow: CAN_THROW = false as CAN_THROW): CAN_THROW extends true ? L : L | undefined{
        if (!data || (data as any).__isProxy) return data as any;
        if (typeof data === 'string') {
            data = windoww.store.getState().idlookup[data] as unknown as D;
            if (!data) {
                if (canThrow) return windoww.Log.exx('Cannot wrap:', {data, baseObjInLookup, path});
                else return undefined as RET;
            }
        }
        if (Array.isArray(data)) { console.error('use WrapAll instead for arrays', {data, baseObjInLookup, path, canThrow}); throw new Error("use WrapAll instead for arrays"); }
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



export type DtoL<DX extends GObject, LX = DX extends DEnumerator ? LEnumerator : (DX extends DAttribute ? LAttribute : (DX extends DReference ? LReference : (DX extends DRefEdge ? LRefEdge : (DX extends DExtEdge ? LExtEdge : (DX extends DDataType ? LDataType : (DX extends DClass ? LClass : (DX extends DStructuralFeature ? LStructuralFeature : (DX extends DParameter ? LParameter : (DX extends DOperation ? LOperation : (DX extends DEdge ? LEdge : (DX extends DEdgePoint ? LEdgePoint : (DX extends DGraphVertex ? LGraphVertex : (DX extends DModel ? LModel : (DX extends DValue ? LValue : (DX extends DObject ? LObject : (DX extends DEnumLiteral ? LEnumLiteral : (DX extends DPackage ? LPackage : (DX extends DClassifier ? LClassifier : (DX extends DTypedElement ? LTypedElement : (DX extends DVertex ? LVertex : (DX extends DVoidEdge ? LVoidEdge : (DX extends DVoidVertex ? LVoidVertex : (DX extends DGraph ? LGraph : (DX extends DNamedElement ? LNamedElement : (DX extends DAnnotation ? LAnnotation : (DX extends DGraphElement ? LGraphElement : (DX extends DMap ? LMap : (DX extends DModelElement ? LModelElement : (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = LX;
export type DtoW<DX extends GObject, WX = DX extends DEnumerator ? WEnumerator : (DX extends DAttribute ? WAttribute : (DX extends DReference ? WReference : (DX extends DRefEdge ? WRefEdge : (DX extends DExtEdge ? WExtEdge : (DX extends DDataType ? WDataType : (DX extends DClass ? WClass : (DX extends DStructuralFeature ? WStructuralFeature : (DX extends DParameter ? WParameter : (DX extends DOperation ? WOperation : (DX extends DEdge ? WEdge : (DX extends DEdgePoint ? WEdgePoint : (DX extends DGraphVertex ? WGraphVertex : (DX extends DModel ? WModel : (DX extends DValue ? WValue : (DX extends DObject ? WObject : (DX extends DEnumLiteral ? WEnumLiteral : (DX extends DPackage ? WPackage : (DX extends DClassifier ? WClassifier : (DX extends DTypedElement ? WTypedElement : (DX extends DVertex ? WVertex : (DX extends DVoidEdge ? WVoidEdge : (DX extends DVoidVertex ? WVoidVertex : (DX extends DGraph ? WGraph : (DX extends DNamedElement ? WNamedElement : (DX extends DAnnotation ? WAnnotation : (DX extends DGraphElement ? WGraphElement : (DX extends DMap ? WMap : (DX extends DModelElement ? WModelElement : (DX extends DUser ? WUser : (DX extends DPointerTargetable ? WPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = WX;
export type LtoD<LX extends LPointerTargetable, DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LRefEdge ? DRefEdge : (LX extends LExtEdge ? DExtEdge : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LEdge ? DEdge : (LX extends LEdgePoint ? DEdgePoint : (LX extends LGraphVertex ? DGraphVertex : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LVertex ? DVertex : (LX extends LVoidEdge ? DVoidEdge : (LX extends LVoidVertex ? DVoidVertex : (LX extends LGraph ? DGraph : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : (LX extends LGraphElement ? DGraphElement : (LX extends LMap ? DMap : (LX extends LModelElement ? DModelElement : (LX extends LUser ? DUser : (LX extends LPointerTargetable ? DPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = DX;
export type LtoW<LX extends LPointerTargetable, WX = LX extends LEnumerator ? WEnumerator : (LX extends LAttribute ? WAttribute : (LX extends LReference ? WReference : (LX extends LRefEdge ? WRefEdge : (LX extends LExtEdge ? WExtEdge : (LX extends LDataType ? WDataType : (LX extends LClass ? WClass : (LX extends LStructuralFeature ? WStructuralFeature : (LX extends LParameter ? WParameter : (LX extends LOperation ? WOperation : (LX extends LEdge ? WEdge : (LX extends LEdgePoint ? WEdgePoint : (LX extends LGraphVertex ? WGraphVertex : (LX extends LModel ? WModel : (LX extends LValue ? WValue : (LX extends LObject ? WObject : (LX extends LEnumLiteral ? WEnumLiteral : (LX extends LPackage ? WPackage : (LX extends LClassifier ? WClassifier : (LX extends LTypedElement ? WTypedElement : (LX extends LVertex ? WVertex : (LX extends LVoidEdge ? WVoidEdge : (LX extends LVoidVertex ? WVoidVertex : (LX extends LGraph ? WGraph : (LX extends LNamedElement ? WNamedElement : (LX extends LAnnotation ? WAnnotation : (LX extends LGraphElement ? WGraphElement : (LX extends LMap ? WMap : (LX extends LModelElement ? WModelElement : (LX extends LUser ? WUser : (LX extends LPointerTargetable ? WPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = WX;
export type WtoD<IN extends WPointerTargetable, OUT = IN extends WEnumerator ? DEnumerator : (IN extends WAttribute ? DAttribute : (IN extends WReference ? DReference : (IN extends WRefEdge ? DRefEdge : (IN extends WExtEdge ? DExtEdge : (IN extends WDataType ? DDataType : (IN extends WClass ? DClass : (IN extends WStructuralFeature ? DStructuralFeature : (IN extends WParameter ? DParameter : (IN extends WOperation ? DOperation : (IN extends WEdge ? DEdge : (IN extends WEdgePoint ? DEdgePoint : (IN extends WGraphVertex ? DGraphVertex : (IN extends WModel ? DModel : (IN extends WValue ? DValue : (IN extends WObject ? DObject : (IN extends WEnumLiteral ? DEnumLiteral : (IN extends WPackage ? DPackage : (IN extends WClassifier ? DClassifier : (IN extends WTypedElement ? DTypedElement : (IN extends WVertex ? DVertex : (IN extends WVoidEdge ? DVoidEdge : (IN extends WVoidVertex ? DVoidVertex : (IN extends WGraph ? DGraph : (IN extends WNamedElement ? DNamedElement : (IN extends WAnnotation ? DAnnotation : (IN extends WGraphElement ? DGraphElement : (IN extends WMap ? DMap : (IN extends WModelElement ? DModelElement : (IN extends WUser ? DUser : (IN extends WPointerTargetable ? DPointerTargetable : (IN extends WViewElement ? DViewElement : (IN extends WViewTransientProperties ? DViewTransientProperties : (ERROR)))))))))))))))))))))))))))))))))> = OUT;
export type WtoL<IN extends WPointerTargetable, OUT = IN extends WEnumerator ? LEnumerator : (IN extends WAttribute ? LAttribute : (IN extends WReference ? LReference : (IN extends WRefEdge ? LRefEdge : (IN extends WExtEdge ? LExtEdge : (IN extends WDataType ? LDataType : (IN extends WClass ? LClass : (IN extends WStructuralFeature ? LStructuralFeature : (IN extends WParameter ? LParameter : (IN extends WOperation ? LOperation : (IN extends WEdge ? LEdge : (IN extends WEdgePoint ? LEdgePoint : (IN extends WGraphVertex ? LGraphVertex : (IN extends WModel ? LModel : (IN extends WValue ? LValue : (IN extends WObject ? LObject : (IN extends WEnumLiteral ? LEnumLiteral : (IN extends WPackage ? LPackage : (IN extends WClassifier ? LClassifier : (IN extends WTypedElement ? LTypedElement : (IN extends WVertex ? LVertex : (IN extends WVoidEdge ? LVoidEdge : (IN extends WVoidVertex ? LVoidVertex : (IN extends WGraph ? LGraph : (IN extends WNamedElement ? LNamedElement : (IN extends WAnnotation ? LAnnotation : (IN extends WGraphElement ? LGraphElement : (IN extends WMap ? LMap : (IN extends WModelElement ? LModelElement : (IN extends WUser ? LUser : (IN extends WPointerTargetable ? LPointerTargetable : (IN extends WViewElement ? LViewElement : (IN extends WViewTransientProperties ? LViewTransientProperties : (ERROR)))))))))))))))))))))))))))))))))> = OUT;

@RuntimeAccessible
export class DPointerTargetable extends RuntimeAccessibleClass {
    static defaultComponent: (ownProps: GObject, childrens?: (string | React.Component)[]) => React.ReactElement;
    public static maxID: number = 0;
    public static logic: typeof LPointerTargetable;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    _storePath?: string[];
    _subMaps?: Dictionary<string, boolean>;
    id!: Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    // pointedBy: DocString<'path in store'>[] = []; // NB: potrebbe contenere puntatori invalidi.
    // se viene cancellato un intero oggetto A che contiene una lista di puntatori, gli oggetti che puntano ad A rimuovono A dai loro "poitnedBy",
    // ma gli oggetti puntati da A tramite sotto-oggetti o attributi (subviews...) non vengono aggiornati in "pointedby"

    pointedBy: Pointer<DPointerTargetable, 0, 'N'> = [];
    father: Pointer<DPointerTargetable, 1, 1> = "";

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
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public static structure: typeof DPointerTargetable;
    public static singleton: LPointerTargetable;
    // @ts-ignore
    public pointedBy: LPointerTargetable[];
    public __raw!: DPointerTargetable;

    public get__extends(superClassName: string, context: LogicContext<DPointerTargetable>): boolean {
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
export class WPointerTargetable extends DPointerTargetable{
    id!: never;
    _storePath!: never;
    _subMaps!: never;
    pointedBy!: never;
}
DPointerTargetable.subclasses.push(LPointerTargetable);
DPointerTargetable.subclasses.push(WPointerTargetable);

function fffff<DX, LX = DX extends DRefEdge ? LRefEdge : 'not'>( t: DX): LX { return null as any; }
let a: DGraphElement = null as any;
let bbb = LPointerTargetable.from(a);
let bb2 = fffff(a);












@RuntimeAccessible
export class DUser extends DPointerTargetable{
    static current: DocString<Pointer<DUser, 1, 1>> = "currentUserPointerToDo";
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // public static structure: typeof DPointerTargetable;
    // public static singleton: LPointerTargetable;
    id!: Pointer<DUser, 1, 1, LUser>;
    __isUser: true = true; // necessary to trick duck typing to think this is NOT the superclass of anything that extends PointerTargetable.
    constructor() {
        super(true);
    }
}
@RuntimeAccessible
export class LUser extends LPointerTargetable { // MixOnlyFuncs(DUser, LPointerTargetable)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // public static structure: typeof DPointerTargetable;
    // public static singleton: LPointerTargetable;
    public __raw!: DUser;
    id!: Pointer<DUser, 1, 1, LUser>;
    __isUser!: true;
}
DPointerTargetable.subclasses.push(DUser);
LPointerTargetable.subclasses.push(LUser);

export type WUser = getWParams<LUser, DUser>;

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











//*********************************************************************************************
//*********************************************************************************************
///////                              type juggling starts here                          ///////
//*********************************************************************************************
//*********************************************************************************************

// export type NotAString<T extends any = 'uselessval'> = Omit<string, 'bold'> & {big: T};
// export type NotAString<T extends any = 'uselessval'> = Omit<string, 'bold'>;
// export type NotAString<T extends any = 'uselessval', T2 extends any = any, T3 extends any = any, T4 extends any = any> = string & Omit<string, 'bold'> & {bold: ()=>string};
export type NotAString<T extends any = 'uselessval', T2 extends any = any, T3 extends any = any, T4 extends any = any> = string & Omit<string, 'bold'> & {bolda?: T};
// export type NotAString<T> = string;
// type Pointer<T> = NotAString<T>;
export type Pointer<T extends DPointerTargetable = DPointerTargetable, lowerbound extends number = 1, upperbound extends number | string = 1, RET = LPointerTargetable> =
    upperbound extends 'N' ? NotAString<T>[] : (
        upperbound extends 0 ? never : (
            lowerbound extends 0 ? (NotAString<T> | undefined | null) : NotAString<T, upperbound, lowerbound, RET>));


export type PtrString = any; // to convert Pointers to strings more explicitly then using as any
// let ptr: Pointer<Object> = null as any;

class D extends DPointerTargetable{
    parent!: Pointer<D>;
    dattrib!: boolean;
    juststring!: string;
    nattrib!: number;
    ddattrib!: Date
}

class D2 extends D{
    d2!: string;
}
class D3 extends D{
    d3!: string;
}



type OverrideTypes<M, N> = { [P in keyof M]: P extends keyof N ? N[P] : M[P] }; // usage:  OverrideTypes<A, { x: number }>;

interface LFix {
    parent: L;
}
interface L { // no instances ever
    parent: L;
    lattrib: boolean;
}
interface L2 extends L { // no instances ever
    l2: string;
}
interface L3 extends L{ // no instances ever
    l3: string;
}

class P { // singleton
    get_parent(){}
    set_parent(){}
}
class P2 extends P { // singleton
    get_d2() {}
}
class P3 extends P { // singleton
    get_d3() {}
}

type ERROR = "_TYPE_ERROR_";
// RegExp extends Animal ? number : string


function buildWrapSignature(maxdepth = 100) {
    let arr = windoww["DPointerTargetable"].subclasses;
    /*
    let dict0 = arr.reduce((a, v) => ({ ...a, [v.name]: v}), {});
    let dict = {}
    for (let name in dict0) { let n = name.substring(1); dict[n] = {"D":dict0["D"+n], "L":dict0["L"+n]}; dict["D"+n] = dict0["L"+n]; dict["L"+n] = dict0["D"+n]; }
    console.log("dict", dict);
    console.table(dict);
    */
    function onlyUnique(value: any, index: number, self: any) { return self.indexOf(value) === index; }

    let dep = arr; // .map( (me) => { return {"name": me.name, "me": me, "Derror": (dict[me.name] || me).name, "Lerror": (dict[me.name] || me).name, "subclasses": [...me.subclasses]}});
    let depsorted = [];

    let byLevels = [];
    let loopdetecter: any[] = [arr];
    while (dep.length && maxdepth--) {
        let namelist = dep.map((e: any) => e.name).filter(onlyUnique);
        depsorted.push(...namelist);
        byLevels.push([...namelist]);
        let olddep = dep;
        dep = dep.flatMap((d: any) => d.subclasses).filter(onlyUnique);
        for (let d of dep) {
            windoww.loopdetecter = loopdetecter;
            windoww.dep = dep;
            windoww.olddep = olddep;
            windoww.byLevels = byLevels;
            windoww.d = d;
            if ( loopdetecter.includes(d.subclasses) ) throw new Error("class is not redefining subclasses static array: " + d.name);
            loopdetecter.push(d.subclasses);
        }
    }
    console.log("byLevels");
    console.table(byLevels);

    console.log("depsorted", depsorted);

// console.log("map");
// console.table(depsorted.map(dn => {let d = window[dn]; return !d ? "" :{name:d.name, scount: d.subclasses.length, subclasses:d.subclasses}}));


    let goalSignature = "function wrap<DX extends D, LX = DX extends D2 ? L2: (DX extends D3 ? L3: (DX extends D ? L : ERROR))>(data: DX): LX {";
    let lparam = "ERROR";
    let epsorted = depsorted.map( e => e.substring(1)).filter(onlyUnique);
    console.table(epsorted)
    for (let e of epsorted) {
        let D = "D" + e;
        let L = "L" + e;
        lparam = "DX extends " + D + " ? "  + L + " : (" + (lparam) + ")";
    }
    let signature = "function wrap<DX extends DPointerTargetable, LX = " + lparam + ">(data: DX): LX {";
    return signature;
}
windoww.buildWrapSignature = buildWrapSignature;
// function wrap<DX extends D, LX = DX extends D2 ? L2: (DX extends D3 ? L3: (DX extends D ? L : ERROR))>(data: DX): LX {

/*
* NO    L -> D    /// l.__raw
* NO    L -> Ptr  /// l.id
*
* NO    D -> Ptr   // d.id
* YES   D -> L     // wrap
*
* NO    Ptr -> D
* NO    Ptr -> L
*
*
*
*
* DpointerTargetable.from( L or pointer )
* LpointerTargetable.from( D or pointer )
*
* MyProxyHandler.wrap = LpointerTargetable.from;
*
* DpointerTargetable.toPointer( d );
*
* */



// they must be ordered from subclass to superclass
function wrapptr<DX extends D, LX = DX extends D2 ? L2: (DX extends D3 ? L3: (DX extends D ? L : ERROR))>(ptr: Pointer<DX>): LX {
    return null as any;
}

// can i make generic types generics?
function ptrtest<PDX extends Pointer<DX>, DX extends DPointerTargetable>(ptr:PDX):DX {
    return '' as any;
}

function ptrmanual<DX extends D>(ptr: Pointer<DX>): DX { return '' as any; }


type LFixed = D & LFix;
let lf = (null as any as D) as LFixed;
//// NB: l'And di tipi con un fix non va bene perchè poi il tipo dell'attributo ridefinito è entrambi -> non effettua controllo corretteza del tipo.

let pp1 = wrapptr('ptr' as any as Pointer<D3>);
let pp2 = ptrtest('ptr' as any as Pointer<D2>);
let pp3 = ptrmanual<D2>('ptr' as any as Pointer<D2>);
let c = pp1 || pp2 || pp3;



type Dclean = Exclude<D, {parent: string}>;
// let dclean: Dclean = null as any;


type subtract<P, C> = { [F in keyof P]: keyof C extends undefined ? undefined : P[F] };
type subtractDL = subtract<D, L>;
let as: subtractDL = null as any;




type Exclude3<T, U> = T & {[T in keyof U]: never};

type Override<A, B> = Omit<A, keyof B> & B; //////////////////////////////////////////// best solution so far
type OL = Override<D, L>;

type Exclude2<Type, field> = {
    [Property in keyof Type as Exclude<Property, keyof field>]: Type[Property]      /////////////////////////equally best solution
};

type noD = Exclude2<D, {parent: any, dattrib: number}> & L
let anod: noD;

let aov: OL = null as any;


type OnlyKeysOfTypeTmp<T, IncludeType> = ({[P in keyof T]: T[P] extends IncludeType ? P : never })[keyof T];
type OnlyKeysOfType<T, IncludeType> = Pick<T, OnlyKeysOfTypeTmp<T, IncludeType>>;
type RemoveKeysOfType<T, ExcludeType> = Exclude2<T, OnlyKeysOfType<T, ExcludeType>>;

// todo: can't automatically convert D to L (generating the type instead of manual defining L) rules are: LClass <--- Pointer<LClass>, LClass[] <-- Pointer<LClass, 0, 'N'>, subobject = ? should not be there

/**
 i have a documentation type that is actually a string, but it\'s have a different purpose from the others, and i made a type to keep documentally separated.
 let's say it's
 type StringOf<P> = string; // regardless of P

 and i use it to define objects

 class C {
   str: StringOf<Date>;
   str2: StringOf<number>;
   purestring: string;
   num: number
 }
 now i want to crete a derivate type that excludes all properties of type StringOf from C



 type OnlyKeysOfTypeTmp<T, IncludeType> = ({[P in keyof T]: T[P] extends IncludeType ? P : never })[keyof T];
 type OnlyKeysOfType<T, IncludeType> = Pick<T, OnlyKeysOfTypeTmp<T, IncludeType>>;
 type RemoveKeysOfType<T, ExcludeType> = Exclude2<T, OnlyKeysOfType<T, string>>;

 type D = RemoveKeysOfType<C, StringOf<any>>
 due to duck typing, this removes all StringOf attributes, but also "purestring" attribute.
 how can i remove only StringOf attributes?


 */

let str: string = null as any;
let ptr: Pointer = null as any;



export type getWParams<L extends LPointerTargetable, D extends Object> = {
    // [Property in keyof ValidObj<L>]: L[Property] extends never ? never : L[Property]
    [Property in keyof L]: Property extends string ? (
        //@ts-ignore
        L[`set_${Property}`] extends (...a:any)=> any ?
            Parameters<L[`set_${Property}`]>[0] // if set_X function is defined, get first param
            //@ts-ignore
            : D[Property] | `todo: should define set_${Property}` // default type if it's not assigned = type in the D version
        ) : never
}
