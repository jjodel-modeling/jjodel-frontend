import {Mixin} from "ts-mixer";
import type {
    DEdge,
    DEdgePoint,
    DExtEdge,
    DGraph,
    DGraphElement,
    DGraphVertex,
    DRefEdge,
    DVertex,
    DVoidEdge,
    DVoidVertex,
    LEdge,
    LEdgePoint,
    LExtEdge,
    LGraphElement,
    LGraphVertex,
    LRefEdge,
    LVertex,
    LVoidEdge,
    LVoidVertex,
    WEdge,
    WEdgePoint,
    WExtEdge,
    WGraph,
    WGraphElement,
    WGraphVertex,
    WRefEdge,
    WVertex,
    WVoidEdge,
    WVoidVertex
} from "../model/dataStructure";
import type {Class, Longest} from "ts-mixer/dist/types/types";
import type {
    DAnnotation,
    DAttribute,
    DClass,
    DClassifier,
    DDataType,
    DEnumerator,
    DEnumLiteral,
    DMap,
    DModel,
    DModelElement,
    DNamedElement,
    DObject,
    DOperation,
    DPackage,
    DParameter,
    DReference,
    DStructuralFeature,
    DTypedElement,
    DValue,
    LAnnotation,
    LAttribute,
    LClass,
    LClassifier,
    LDataType,
    LEnumerator,
    LEnumLiteral,
    LMap,
    LModelElement,
    LNamedElement,
    LObject,
    LOperation,
    LPackage,
    LParameter,
    LReference,
    LStructuralFeature,
    LTypedElement,
    LValue,
    WAnnotation,
    WAttribute,
    WClass,
    WClassifier,
    WDataType,
    WEnumerator,
    WEnumLiteral,
    WMap,
    WModel,
    WModelElement,
    WNamedElement,
    WObject,
    WOperation,
    WPackage,
    WParameter,
    WReference,
    WStructuralFeature,
    WTypedElement,
    WValue
} from "../model/logicWrapper";
import {
    CClass,
    Constructor, Dependency,
    Dictionary,
    DocString,
    GObject, type Info,
    InitialVertexSize,
    InitialVertexSizeFunc,
    InitialVertexSizeObj,
    orArr,
    Proxyfied,
    unArr
} from "./types";
import {EdgeBendingMode, EdgeGapMode, NodeTypes, PrimitiveType} from "./types";
import type {
    DViewElement,
    LViewElement,
    WViewElement,
} from "../view/viewElement/view";
import {LogicContext, LogicContext2, type TargetableProxyHandler as TypeTargetableProxyHandler} from "./proxy";
import {
    Action,
    CreateElementAction,
    Defaults,
    DeleteElementAction,
    DLog,
    DState,
    DViewPoint,
    EdgeSegment,
    GraphPoint,
    GraphSize, IPoint, ISize,
    LGraph,
    LLog,
    LModel,
    Log,
    LViewPoint, ModelPointers,
    ParsedAction, Selectors,
    SetFieldAction,
    SetRootFieldAction,
    ShortAttribETypes,
    statehistory,
    store,
    TRANSACTION,
    U
} from "./index";
import {LayoutData} from "rc-dock";
import {OclEngine} from "@stekoe/ocl.js";
import React, {ReactNode} from "react";
import {labelfunc} from "../model/dataStructure/GraphDataElements";
import {Dummy} from "../common/Dummy";
import Storage from "../data/storage";
import {PinnableDock} from "../components/dock/MyRcDock";
import type {VersionFixer as TypeVersionFixer} from "../redux/VersionFixer";
import type {ProjectsApi as TypeProjectsAPI, UsersApi} from "../api/persistance";
import type {Collaborative as CollaborativeT} from "../components/collaborative/Collaborative";
var windoww = window as any;

// qui dichiarazioni di tipi che non sono importabili con "import type", ma che devono essere davvero importate a run-time (eg. per fare un "extend", chiamare un costruttore o usare un metodo statico)


//console.warn('ts loading classes');


// annotation @RuntimeAccessible
// import {store} from "../redux/createStore";

abstract class AbstractMixedClass {
    // superclass!: Dictionary<DocString<'parent class name', Class>>;
    static logic: typeof LPointerTargetable;
    static structure: typeof DPointerTargetable;
    static singleton: LPointerTargetable;
    // static [key: string]: any;
    static init_constructor(...constructorArguments: any): void{}
}

export abstract class RuntimeAccessibleClass extends AbstractMixedClass {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    //static extendTree: TreeModel.Node<typeof RuntimeAccessibleClass>// Tree<string, typeof RuntimeAccessibleClass>;
    static extendMatrix: Dictionary<string, Dictionary<string, boolean>>;
    // static name: never; // it breaks with minification, don't use it
    static cname: string;
    private static OCL_Constructors: Dictionary<Pointer<DModel>, Dictionary<DocString<"DClass name">, GObject<"Fake constructors for ocl \"Context\"">>> = {};

    static set_extend(superclass: typeof RuntimeAccessibleClass, subclass: typeof RuntimeAccessibleClass): void{
        if (!superclass.hasOwnProperty("subclasses")) superclass.subclasses = [subclass];
        else if (superclass.subclasses.indexOf(subclass) === -1) superclass.subclasses.push(subclass);
        if (!subclass.hasOwnProperty("_extends")) subclass._extends = [superclass];
        else if (subclass._extends.indexOf(superclass) === -1) subclass._extends.push(superclass);
    }

    static extendPrototypes(){
        (Array.prototype as any).contains = function (o:any): boolean{
            return this.indexOf(o) !== -1;
        };
        // (Array.prototype as any).joinOriginal = Array.prototype.join;
        // @ts-ignore
        Array.prototype.first = function(){ return this[0]; }
        // @ts-ignore
        eval("Array.prototype.last = function(){ return this[this.length-1]; }");// without eval it still gives typescript error even with tsignore

        /* parameter can be element, array or function(index)=>element.
        *  if the function returns an array it is flattened.
        *  if you don't want it flattened, make the function return a nested array like ()=>[[1,2,3]]
        *  @ts-ignore */
        (Array.prototype as any).separator = function(...separators: any[]/*: orArr<(PrimitiveType | null | undefined | JSX.Element)[]>*/): (string|JSX.Element)[]{
            if (Array.isArray(separators[0])) separators = separators[0]; // case .join([1,2,3])  --> .join(1, 2, 3)
            // console.log("separators debug", this, separators, this[0], typeof this[0]);
            // if (typeof this[0] !== "object") return (this as any).joinOriginal(separators);
            // if JSX
            // it handles empty cells like it handles '', but this is how native .join() handles them too: [emptyx5, "a", emptyx1, "b"].join(",") ->  ,,,,,a,,b
            let func: ((i: number)=>any)|null = typeof separators === 'function' ? separators : (typeof separators[0] === 'function' ? separators[0] : null);
            let ret: any[] = [];
            for (let i = 0; i < this.length; i++){
                if (i === 0) { ret.push(this[i]); continue; }
                if (func) {
                    let funcret = func(i);
                    if (Array.isArray(funcret)) ret.push(...funcret);
                    else ret.push(funcret);
                } else ret.push(...separators);
                ret.push(this[i]);
            }
            return ret;
        }
    }
    static fixStatics() {
        this.extendPrototypes();
        for (let classs of Object.values(RuntimeAccessibleClass.annotatedClasses)) {
            let gclass = classs as GObject;
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
    (data: D[] | Pointer<DPointerTargetable, 0, 'N'>, baseObjInLookup?: undefined, path: '' = '', canThrow: CAN_THROW = false as CAN_THROW, state?: DState, filter:boolean=true): CAN_THROW extends true ? L[] : L[] {
        if (!Array.isArray(data)) return [];
        if (!data.length) return [];
        if (!state) state = windoww.store.getState() as DState;
        if (!filter) return data.map( d => DPointerTargetable.wrap(d, baseObjInLookup, path, canThrow, state)) as L[];
        let ret = [];
        for (let o of data) { if (o) ret.push( DPointerTargetable.wrap(o, baseObjInLookup, path, canThrow, state))}
        return ret;
    }

    static wrap<D extends RuntimeAccessibleClass, L extends LPointerTargetable = LPointerTargetable, CAN_THROW extends boolean = false,
        RET extends CAN_THROW extends true ? L : L | undefined = CAN_THROW extends true ? L : L | undefined>
    (data: D | Pointer | undefined | null, baseObjInLookup?: undefined, path: '' = '', canThrow: CAN_THROW = false as CAN_THROW, state?: DState): CAN_THROW extends true ? L : L | undefined{
        if (!data || (data as any).__isProxy) return data as any;
        if (typeof data === 'string') {
            data = DPointerTargetable.from(data, state) as D;
            if (!data) {
                windoww.Log.e(canThrow, 'Cannot wrap:', {data, baseObjInLookup, path});
                return undefined as RET;
            }
        }
        if (Array.isArray(data)) {
            console.error('use WrapAll instead for arrays', {data, baseObjInLookup, path, canThrow});
            if (canThrow) throw new Error("use WrapAll instead for arrays");
            else return undefined as any;
        }
        if (!data) return data;
        // @ts-ignore
        if (!data.className) return undefined;
        // console.log('ProxyWrapping:', {data, baseObjInLookup, path});
        let TargetableProxyHandler = windoww.TargetableProxyHandler as typeof TypeTargetableProxyHandler;
        return new Proxy(data, new TargetableProxyHandler(data, baseObjInLookup, path)) as L;
    }

    // if v can be wrapped, wrap it. otherwise return the parameter v.
    public static attemptWrap(v: any, s?: DState): any{
        let ret: any = undefined;
        switch (typeof v){
            case "string": s = store.getState(); ret = LPointerTargetable.fromPointer(v, s); break
            case "object":
                if (!v) return v; // null
                if (v.__isProxy) return v;
                if (v.className) {
                    if (!RuntimeAccessibleClass.get(v?.className)?.logic?.singleton) break;
                    ret = LPointerTargetable.fromD(v);
                }
                break;
            default: break;
        }
        return ret || v;
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
    protected constructor(...a:any) {
        super();
        // RuntimeAccessibleClass.init_constructor(this, ...a);
        // this.className = this.constructor.name;
        // nb: per i mixin questo settaggio viene sovrascritto. perchè il mixin crea le 2 classi ereditate separatamente con i loro costruttori e le incrocia. quindi devo settarlo dall'annotazione @ tramite prototype
        // RuntimeAccessibleClass.allRuntimeClasses.push(this.className);
    }

    static init_constructor(thiss: any, ...args: any): void {

        // this.className = this.constructor.name;
        // let finalObject = this;
        // if (finalObject.constructor.name === "DVoidVertex" || finalObject.constructor.name === "DGraphElement") { let breakp = true; }
        // this.init0(...arguments);
        // thiss.className = this.name;
    }

    public static get<T extends typeof RuntimeAccessibleClass = typeof RuntimeAccessibleClass>(dclassname: string, mode?: string )
        : T & {logic?: typeof LPointerTargetable} {

        // believe it or not there are actually 3 different versions generated, with different static method contexts, it's a mess.
        return this.classes[dclassname] as any;
        /*
        switch(mode) {
            case "annotated version":
                /* it is like this in console
                () {
                    var _obj$initBase;
                    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                ...* /
                return RuntimeAccessibleClass.annotatedClasses[dclassname] as any;
            case "local definition version":
            default: // same as window.classname
            case "module export version":
                /* it was like this in console, it is not anymore after reworking cname
                // don't know how to get it now, but default version should be always the correct one,
                    class DClassifier extends _joiner__WEBPACK_IMPORTED_MODULE_0__["DPointerTargetable"]
                which is even wrong as i asked for DPointerTargetable and not DClassifier. * /
            return null as any;
        }*/
    }

    public static extends(className?: string | typeof RuntimeAccessibleClass, superClassName?: string| typeof RuntimeAccessibleClass, returnIfEqual: boolean = true): boolean {
        if (!className || !superClassName) return false;
        const superclass = typeof superClassName === "string" ? RuntimeAccessibleClass.get(superClassName) : superClassName;
        const thisclass = typeof className === "string" ? RuntimeAccessibleClass.get(className) : className;
        if (!superclass || !thisclass) return false;
        //console.trace("extends.1:", {thisclass, superclass});
        // console.log("extends.2:", {iof:(thisclass instanceof superclass),
        //     tree: !!(RuntimeAccessibleClass.extendTree.first((node) => node.model === superclass)?.first((node) => node.model === thisclass))});
        if (superclass === thisclass) return returnIfEqual;
        // for (let aaa in RuntimeAccessibleClass.extendTree.find(superClassName)) { }

        return (thisclass instanceof superclass)
            || RuntimeAccessibleClass.extendMatrix[superclass.cname]?.[thisclass.cname]
        // !!(RuntimeAccessibleClass.extendTree.first((node) => node.model === superclass)?.first((node) => node.model === thisclass))
        // || true;
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

    static makeOCLConstructor(data: DClass, state: DState, oldState: DState): GObject<"fake constructor of m2-class for ocl's Context"> {
        let rootModel: DModel = data as any;
        while (rootModel && rootModel.className !== "DModel") rootModel = DPointerTargetable.fromPointer(rootModel.father, state);
        let mid: Pointer<DModel> = rootModel?.id; // NB: for EBoolean etc, primitive type meteclasses don't have a model;
        if (!RuntimeAccessibleClass.OCL_Constructors[mid]) {
            RuntimeAccessibleClass.OCL_Constructors[mid] = {...RuntimeAccessibleClass.classes};
        }
        const OclConstructor: GObject = data;
        let namefixed: string;

        if (oldState && oldState.idlookup[data.id]) {
            let oldname = (oldState.idlookup[data.id] as DClass).name;
            namefixed = U.replaceAll(U.replaceAll(oldname, '-', '_'), ' ', '_');
            delete RuntimeAccessibleClass.OCL_Constructors[mid][oldname];
            delete RuntimeAccessibleClass.OCL_Constructors[mid][namefixed];

        }
        namefixed = U.replaceAll(U.replaceAll(data.name, '-', '_'), ' ', '_');
        RuntimeAccessibleClass.OCL_Constructors[mid][data.name] = OclConstructor;
        RuntimeAccessibleClass.OCL_Constructors[mid][namefixed] = OclConstructor;

        return data;
    }

    static getOCLClasses(model_id: Pointer<DModel>): GObject {
        // return { ...(RuntimeAccessibleClass.OCL_Constructors[model_id] || {}), ...RuntimeAccessibleClass.classes}
        return RuntimeAccessibleClass.OCL_Constructors[model_id] || RuntimeAccessibleClass.classes;
    }
}
export function Obsolete<T extends any>( constructor: T & GObject): T { return constructor; }
export function Leaf<T extends any>( constructor: T & GObject): T { return constructor; }
export function Node<T extends any>( constructor: T & GObject): T { return constructor; }
export function Abstract<T extends any>( constructor: T & GObject): T { return constructor; }
export function Instantiable<T extends any>(constructor: T & GObject, instanceConstructor?: Constructor): T { return constructor; } // for m2 cklasses that have m1 instances
// export function RuntimeAccessible<T extends any>(cname: string): ((constructor: T & GObject) => T) {
export function RuntimeAccessible(cname: string) {
    return (ctor: any) => RuntimeAccessible_inner(ctor, cname);
}

function RuntimeAccessible_inner<T extends any>(constructor: T & GObject, cname: string): T {
    // console.log('DecoratorTest', {constructor, arguments});
    (constructor as GObject).cname = cname;
    if (!constructor.hasOwnProperty("subclasses")) (constructor as GObject).subclasses = [];
    // @ts-ignore
    RuntimeAccessibleClass.classes[constructor.cname] = constructor as any as typeof RuntimeAccessibleClass;
    // console.log("setting runtime accessible", {key: constructor.cname, constructor, pre: predebug, post: {...RuntimeAccessibleClass.classes}});
    if (!windoww[constructor.cname]) (windoww[constructor.cname] as any) = constructor;
    constructor.prototype.className = constructor.cname;
    //constructor.prototype.$$typeof = constructor.cname;
    //constructor.prototype.typeName = constructor.cname;
    (constructor as any).staticClassName = constructor.cname;
    // @ts-ignore
    // console.log('runtimeaccessible annotation:', {thiss:this, constructor});
    //    const classnameFixedConstructor = constructor; //  function (...args) { let obj = new constructor(...args); obj.init?.(); obj.init0?.(); return obj; }

    // @ts-ignore
    let outerthis = this;
    // @ts-ignore
    const classnameFixedConstructorDoNotRenameWithoutSearchStrings = function (...args) {
        // @ts-ignore
        // console.log('runtimeaccessible annotation inner:', {thiss:this, outerthis, constructor});
        // @ts-ignore
        let obj = new constructor(...args);
        obj.classNameFromAnnotation = constructor.cname;
        obj.className = constructor.cname;
        //obj.prototype.$$typeof = constructor.name;
        // obj.prototype.typeName = constructor.name;
        // obj.init?.();
        // obj.init0?.();
        obj.initBase?.();
        // @ts-ignore
        // console.log('runtimeaccessible annotation inner end:', {thiss:this, outerthis, constructor, obj});
        return obj; }
    RuntimeAccessibleClass.annotatedClasses[constructor.cname] = classnameFixedConstructorDoNotRenameWithoutSearchStrings as any as typeof RuntimeAccessibleClass;

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



export type DtoL<DX extends GObject, LX =
    DX extends DEnumerator ? LEnumerator : (DX extends DAttribute ? LAttribute : (DX extends DReference ? LReference : (DX extends DRefEdge ? LRefEdge : (DX extends DExtEdge ? LExtEdge : (DX extends DDataType ? LDataType : (DX extends DClass ? LClass : (DX extends DStructuralFeature ? LStructuralFeature : (DX extends DParameter ? LParameter : (DX extends DOperation ? LOperation : (DX extends DEdge ? LEdge : (DX extends DEdgePoint ? LEdgePoint : (DX extends DGraphVertex ? LGraphVertex : (DX extends DModel ? LModel : (DX extends DValue ? LValue : (DX extends DObject ? LObject : (DX extends DEnumLiteral ? LEnumLiteral : (DX extends DPackage ? LPackage : (DX extends DClassifier ? LClassifier : (DX extends DTypedElement ? LTypedElement : (DX extends DVertex ? LVertex : (DX extends DVoidEdge ? LVoidEdge : (DX extends DVoidVertex ? LVoidVertex : (DX extends DGraph ? LGraph : (DX extends DNamedElement ? LNamedElement : (DX extends DAnnotation ? LAnnotation : (DX extends DGraphElement ? LGraphElement : (DX extends DMap ? LMap : (DX extends DModelElement ? LModelElement : (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable :
        (DX extends DUser ? LUser : (DX extends DLog ? LLog : (ERROR)))
        ))))))))))))))))))))))))))))))> = LX;
export type DtoW<DX extends GObject, WX = DX extends DEnumerator ? WEnumerator : (DX extends DAttribute ? WAttribute : (DX extends DReference ? WReference : (DX extends DRefEdge ? WRefEdge : (DX extends DExtEdge ? WExtEdge : (DX extends DDataType ? WDataType : (DX extends DClass ? WClass : (DX extends DStructuralFeature ? WStructuralFeature : (DX extends DParameter ? WParameter : (DX extends DOperation ? WOperation : (DX extends DEdge ? WEdge : (DX extends DEdgePoint ? WEdgePoint : (DX extends DGraphVertex ? WGraphVertex : (DX extends DModel ? WModel : (DX extends DValue ? WValue : (DX extends DObject ? WObject : (DX extends DEnumLiteral ? WEnumLiteral : (DX extends DPackage ? WPackage : (DX extends DClassifier ? WClassifier : (DX extends DTypedElement ? WTypedElement : (DX extends DVertex ? WVertex : (DX extends DVoidEdge ? WVoidEdge : (DX extends DVoidVertex ? WVoidVertex : (DX extends DGraph ? WGraph : (DX extends DNamedElement ? WNamedElement : (DX extends DAnnotation ? WAnnotation : (DX extends DGraphElement ? WGraphElement : (DX extends DPointerTargetable ? WMap : (DX extends DModelElement ? WModelElement : (DX extends DUser ? WUser : (DX extends DPointerTargetable ? WPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = WX;
// export type DtoW<DX extends GObject, WX = Omit<DtoW0<DX>, 'id'>> = WX;
export type LtoD<LX extends LPointerTargetable, DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LRefEdge ? DRefEdge : (LX extends LExtEdge ? DExtEdge : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LEdge ? DEdge : (LX extends LEdgePoint ? DEdgePoint : (LX extends LGraphVertex ? DGraphVertex : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LVertex ? DVertex : (LX extends LVoidEdge ? DVoidEdge : (LX extends LVoidVertex ? DVoidVertex : (LX extends LGraph ? DGraph : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : (LX extends LGraphElement ? DGraphElement : (LX extends LMap ? DPointerTargetable : (LX extends LModelElement ? DModelElement : (LX extends LUser ? DUser : (LX extends LPointerTargetable ? DPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = DX;
export type LtoW<LX extends LPointerTargetable, WX = LX extends LEnumerator ? WEnumerator : (LX extends LAttribute ? WAttribute : (LX extends LReference ? WReference : (LX extends LRefEdge ? WRefEdge : (LX extends LExtEdge ? WExtEdge : (LX extends LDataType ? WDataType : (LX extends LClass ? WClass : (LX extends LStructuralFeature ? WStructuralFeature : (LX extends LParameter ? WParameter : (LX extends LOperation ? WOperation : (LX extends LEdge ? WEdge : (LX extends LEdgePoint ? WEdgePoint : (LX extends LGraphVertex ? WGraphVertex : (LX extends LModel ? WModel : (LX extends LValue ? WValue : (LX extends LObject ? WObject : (LX extends LEnumLiteral ? WEnumLiteral : (LX extends LPackage ? WPackage : (LX extends LClassifier ? WClassifier : (LX extends LTypedElement ? WTypedElement : (LX extends LVertex ? WVertex : (LX extends LVoidEdge ? WVoidEdge : (LX extends LVoidVertex ? WVoidVertex : (LX extends LGraph ? WGraph : (LX extends LNamedElement ? WNamedElement : (LX extends LAnnotation ? WAnnotation : (LX extends LGraphElement ? WGraphElement : (LX extends LMap ? WPointerTargetable : (LX extends LModelElement ? WModelElement : (LX extends LUser ? WUser : (LX extends LPointerTargetable ? WPointerTargetable : (ERROR)))))))))))))))))))))))))))))))> = WX;
export type WtoD<IN extends WPointerTargetable, OUT = IN extends WEnumerator ? DEnumerator : (IN extends WAttribute ? DAttribute : (IN extends WReference ? DReference : (IN extends WRefEdge ? DRefEdge : (IN extends WExtEdge ? DExtEdge : (IN extends WDataType ? DDataType : (IN extends WClass ? DClass : (IN extends WStructuralFeature ? DStructuralFeature : (IN extends WParameter ? DParameter : (IN extends WOperation ? DOperation : (IN extends WEdge ? DEdge : (IN extends WEdgePoint ? DEdgePoint : (IN extends WGraphVertex ? DGraphVertex : (IN extends WModel ? DModel : (IN extends WValue ? DValue : (IN extends WObject ? DObject : (IN extends WEnumLiteral ? DEnumLiteral : (IN extends WPackage ? DPackage : (IN extends WClassifier ? DClassifier : (IN extends WTypedElement ? DTypedElement : (IN extends WVertex ? DVertex : (IN extends WVoidEdge ? DVoidEdge : (IN extends WVoidVertex ? DVoidVertex : (IN extends WGraph ? DGraph : (IN extends WNamedElement ? DNamedElement : (IN extends WAnnotation ? DAnnotation : (IN extends WGraphElement ? DGraphElement : (IN extends WMap ? DPointerTargetable : (IN extends WModelElement ? DModelElement : (IN extends WUser ? DUser : (IN extends WPointerTargetable ? DPointerTargetable : (IN extends WViewElement ? DViewElement : (ERROR))))))))))))))))))))))))))))))))> = OUT;
export type WtoL<IN extends WPointerTargetable, OUT = IN extends WEnumerator ? LEnumerator : (IN extends WAttribute ? LAttribute : (IN extends WReference ? LReference : (IN extends WRefEdge ? LRefEdge : (IN extends WExtEdge ? LExtEdge : (IN extends WDataType ? LDataType : (IN extends WClass ? LClass : (IN extends WStructuralFeature ? LStructuralFeature : (IN extends WParameter ? LParameter : (IN extends WOperation ? LOperation : (IN extends WEdge ? LEdge : (IN extends WEdgePoint ? LEdgePoint : (IN extends WGraphVertex ? LGraphVertex : (IN extends WModel ? LModel : (IN extends WValue ? LValue : (IN extends WObject ? LObject : (IN extends WEnumLiteral ? LEnumLiteral : (IN extends WPackage ? LPackage : (IN extends WClassifier ? LClassifier : (IN extends WTypedElement ? LTypedElement : (IN extends WVertex ? LVertex : (IN extends WVoidEdge ? LVoidEdge : (IN extends WVoidVertex ? LVoidVertex : (IN extends WGraph ? LGraph : (IN extends WNamedElement ? LNamedElement : (IN extends WAnnotation ? LAnnotation : (IN extends WGraphElement ? LGraphElement : (IN extends WMap ? LPointerTargetable : (IN extends WModelElement ? LModelElement : (IN extends WUser ? LUser : (IN extends WPointerTargetable ? LPointerTargetable : (IN extends WViewElement ? LViewElement : (ERROR))))))))))))))))))))))))))))))))> = OUT;
export enum CoordinateMode {
    "absolute"              = "absolute",
    "relativePercent"       = "relative%",
    "relativeOffset"        = "relativeOffset",
    "relativeOffsetStart"   = "relativeOffsetStart",
    "relativeOffsetEnd"     = "relativeOffsetEnd",
}

export type EPSize = GraphSize & {currentCoordType: CoordinateMode};
export enum EdgeHead {
    composition = "Composition",
    aggregation = "Aggregation",
    reference   = "Association",
    extend      = "Extension",
    zero = "exactly zero / not present",
    one = "exactly one, required",
    many = "zero or many, optional, unbounded",
    zeroOrOne = "zero or one, optional",
    zeroOrMany = "zero or many, optional, unbounded",
    oneOrMany = "one or many, at least one"
}


@RuntimeAccessible('UserHistory')
export class UserHistory{
    static cnamne: string = 'UserHistory';
    public undoable: GObject<"delta">[] = [];
    public redoable: GObject<"delta">[] = [];
    constructor(undoable:GObject<"delta">[] = [], redoable: GObject<"delta">[] = []) {
        this.undoable = undoable;
        this.redoable = redoable;
    }
}

let canFireActions: boolean = true;
@RuntimeAccessible('Constructors')
export class Constructors<T extends DPointerTargetable = DPointerTargetable>{
    public static paused: boolean = false;
    private thiss: T;
    private persist: boolean;
    // private callbacks: Function[];
    private nonPersistentCallbacks: Function[];
    fatherType?: typeof RuntimeAccessibleClass;
    private fatherPtr?: Pointer // T['father'];
    private state?: DState; // set only if requested by setWithSideEffect
    private parentgraphID?: Pointer<DGraph>; // only present for DGraphElements
    /*
    problem: if isPersistent is set to false, but the object is later made persistent with an action, you lose all the callback effects afecting other elements (as setting opposite relations like instances-typeof or losing pointedBy's)
    solution 1: store in the D-object a function executing the callbacks called by CreateNewElement action, then delete that field before persisting.
    continued: instead of setting the pointedBy's this way (and increasing clonedcounter for nothing) erase all PointedBy mentionings here, and make all pointer values assigned separately with a SetAction,' +
    '         if new2 is used that set manually a d-field, set it to undefined in the in the .end() part, then trigger the setaction with correct value.
    continued: sort actions by path, but always make sure CreateElement are first in the sort regardless of path. make also sure 2 actions with the same path keep the order they are launched/created (oldest first)
    */
    constructor(t:T, father?: Pointer, persist: boolean = true, fatherType?: Constructor, id?: string, isUser:boolean = false) {
        persist = persist && canFireActions;
        this.thiss = t;
        this.setID(id, isUser);
        // the same thing is done in reducer/createelementaction, but if the object is destructured before then, it will lose the constructor and reducer will fail to assign classname
        t.className = t.className || (t.constructor as typeof RuntimeAccessibleClass).cname || t.constructor.name;
        DPointerTargetable.pendingCreation[t.id] = t;
        this.persist = persist;
        t._persistCallbacks = [];
        t._derivedSubElements = [];
        this.nonPersistentCallbacks = [];
        this.fatherPtr = father;

        if (this.thiss.hasOwnProperty("father")) {
            this.fatherType = fatherType as any;
            // console.log('x6 addchild() set ptr father', {father, thiss:this.thiss});
            this.setPtr("father", father);
        }
    }

    static makeID(isUser:boolean=false): Pointer<any> {
        return "Pointer" + new Date().getTime() + "_" + (isUser ? DUser.current : 'USER') + "_" + (DPointerTargetable.maxID++);
    }
    private setID(id?: string, isUser:boolean = false){
        this.thiss.id = id || Constructors.makeID(isUser);
    }

    // cannot use Lobjects as they will set PointedBy in persistent state, also might access an incomplete version of the object crashing
    private setPtr(property: string, value: any, checkPointerValidity?: DState) {
        (this.thiss as GObject)[property] = value;
        if (!value) return;
        if (Array.isArray(value)) for (let v of value) {
            if (!value) continue;
            if (typeof v === "object") v = v.id;
            if (!v || checkPointerValidity && !Pointers.isPointer(v, checkPointerValidity)) continue;
            this.thiss._persistCallbacks.push(SetFieldAction.create(v, "pointedBy", PointedBy.fromID(this.thiss.id, property as any), '+='));
        }
        else {
            if (typeof value === "object") value = value.id;
            value && this.thiss._persistCallbacks.push(SetFieldAction.create(value, "pointedBy", PointedBy.fromID(this.thiss.id, property as any), '+='));
        }
        // todo: in delete if the element was not persistent, just do nothing.
    }

    private setExternalRootProperty<D extends DPointerTargetable>(path: string, val: any, accessModifier: "[]" | "+=" | "", isPointer: boolean): this {
        this.thiss._persistCallbacks.push(SetRootFieldAction.create(path, val, accessModifier, isPointer));
        return this;
    }

    private setExternalPtr<D extends DPointerTargetable>(target: D | Pointer<any>, property: string, accessModifier: "[]" | "+=" | "" = "", val?: any): this {
        if (!target) return this;
        if (typeof target === "object") target = target.id;
        if (!val) val = this.thiss.id;
        this.thiss._persistCallbacks.push(SetFieldAction.create(target, property, val, accessModifier, true));
        return this;
        // PointedBy is set by reducer directly in this case.
        // this.thiss._persistCallbacks.push(SetFieldAction.create(this.thiss.id, "pointedBy", PointedBy.fromID(target, property as any), '+='));
    }

    private setWithSideEffect<D extends DPointerTargetable>(property: string, val: any): this {
        if (!val) return this;
        if (!this.state) this.state = store.getState();
        if (typeof val === "object") val = val.id;
        this.thiss._persistCallbacks.push( () => {
            (LPointerTargetable.from(this.thiss, this.state) as GObject<"L">)[property] = val;
        });
        return this;
    }

    static pending: Dictionary<Pointer, DPointerTargetable> = {};
    //static pause(): void { canFireActions = false; }
    //static resume(): void { canFireActions = true; }
    static persist(d: DPointerTargetable, fromCreateAction?: boolean): void;
    static persist(d: DPointerTargetable[]): void;
    static persist(d: orArr<DPointerTargetable>, fromCreateAction?: boolean): void {
        if (Constructors.paused) return;
        TRANSACTION('Create element', ()=> {
            if (!Array.isArray(d)) d = [d];
            // first create "this"
            for (let e of d) {
                console.log('check pending', {e, p:Constructors.pending[e.id], dict:{...Constructors.pending}});
                if (Constructors.pending[e.id]) {
                    let LOG: typeof Log['ee'] = Log.ee;
                    let inCollabNode = (windoww.Collaborative as typeof CollaborativeT).online; // && e.className.toLowerCase().includes('graph');
                    if (inCollabNode) LOG = Log.ii;
                    LOG('Element attempted to be created twice with same id', {new:d, old: Constructors.pending[e.id]});
                    return;
                }
                let subElements = e._derivedSubElements;
                let callbacks = e._persistCallbacks;
                delete (e as Partial<DPointerTargetable>)._derivedSubElements;
                delete (e as Partial<DPointerTargetable>)._persistCallbacks;
                // then create subelements (object -> values) and fire their actions.
                if (!fromCreateAction) CreateElementAction.new(e, false);
                for (let c of subElements) Constructors.persist([c]);
                // finally fire the actions for "this"

                // console.log('x6 addchild pre firing act()', {callbacks, d:e});
                for (let c of callbacks) (c as Action).fire ? (c as Action).fire() : (c as () => void)();
                SetRootFieldAction.new('ELEMENT_CREATED', e.id, '+=', false); // here no need to IsPointer because it only affects Transient stuff
            }
        })
    }
    // start(thiss: any): this { this.thiss = thiss; return this; }
    end(simpledatacallback?: (d:T, c: this) => void): T {
        const deleteDState = false; // don't save DState in idlookup
        if (this.thiss.className === 'DState' && deleteDState) return this.thiss;
        if (simpledatacallback) simpledatacallback(this.thiss, this); // callback for setting primitive types, not pointers not context-dependant values (name being potentially invalid / chosen according to parent)
        if (this.nonPersistentCallbacks.length) {
            for (let cb of this.nonPersistentCallbacks) cb();
        }
        if (!this.persist) return this.thiss;
        Constructors.persist(this.thiss);
        /// todo: warning: there is a transaction at .persist method, do not use BEGIN+END/TRANSACTION inside

        return this.thiss; }


    DState(): this {
        let thiss: DState = this.thiss as any;
        thiss.debug = !!localStorage.getItem('debug');
        thiss.languages = windoww.DV.defaultLanguages();
        return this;
    }

    DModelElement(): this {
        let thiss: GObject<DModelElement> = this.thiss as any;
        if ('instances' in thiss) thiss.instances = [];
        return this; }
    DClassifier(): this { return this; }
    DParameter(defaultValue?: any): this {
        let thiss: DParameter = this.thiss as any;
        thiss.defaultValue = defaultValue;
        this.setExternalPtr(thiss.father, "parameters", "+=");
        return this; }
    DStructuralFeature(): this {
        if (this.thiss.className === 'DOperation') return this;
        // if (!this.persist) return this;
        let thiss = this.thiss as any;
        const _DClass: typeof DClass = windoww.DClass;
        const _DValue: typeof DValue = windoww.DValue;


        let targets: DClass[] = [(_DClass as typeof DPointerTargetable).from(thiss.father, this.state)];
        let alreadyParsed: Dictionary<Pointer, DClass> = {};
        /*
        todo: build a Tree<DClass> of all superclasses tree nested by level.
            only then instantiate DValues by depth level, if same level from right to left (last extend on right takes priority) and erase this stuff below.*/
        // let superClassesByLevel: Dictionary<Pointer, DClass> = ;
        while (targets.length) { // gather superclasses in map "alreadyParsed"
            let nextTargets: DClass[] = [];
            for (let target of targets) {
                if (!target) { Log.ww("Invalid father pointer in DStructuralFeature", {feature: thiss, father:target, superclasses: alreadyParsed}); continue; }
                if (alreadyParsed[target.id]) continue;
                alreadyParsed[target.id] = target;
                let ltarget = L.from(target) as LClass;
                for (let ext of ltarget.extendedBy) nextTargets.push(D.from(ext));
            }
            targets = nextTargets;
        }
        //(thiss as DPointerTargetable)._persistCallbacks.push(()=>{
        // When a feature is added in m2, i loop instanced m1 objects to add that feature as a DValue.
        console.log('adding feature to existing objects 0 ', {alreadyParsed})
        let state = store.getState();
        for (let pointer in alreadyParsed) {
            for (let instanceObjPtr of alreadyParsed[pointer].instances) {
                console.log('adding feature to existing objects 1 ', {alreadyParsed, instanceObjPtr, idl:state.idlookup[instanceObjPtr]})

                // this._derivedSubElements.push(_DValue.new(thiss.name, thiss.id, undefined, instanceObjPtr));
                thiss._derivedSubElements.push(_DValue.new3({name: undefined, instanceof: thiss.id, father: instanceObjPtr}, undefined, false));
            }
            //}
        }


        return this;
    }
    DReference(): this {
        let thiss: DReference = this.thiss as any;
        thiss.aggregation = false;
        thiss.composition = false;
        thiss.rootable = undefined;
        this.setExternalPtr(thiss.father, "references", "+=");
        return this; }

    DAttribute(): this {
        let thiss: DAttribute = this.thiss as any;
        this.setExternalPtr(thiss.father, "attributes", "+=");
        return this; }

    DDataType(): this { return this; }

    DObject(instanceoff?: DObject["instanceof"]): this {
        let thiss: DObject = this.thiss as any;
        if (thiss.father) {
            if (this.fatherType!.cname === "DModel") {
                this.setExternalPtr(thiss.father, "objects", "+=");
            }
            else {
                // object containing object is not in any direct child collection. access through values
                this.setExternalPtr(thiss.father, "values", "+=");
            }
        }
        instanceoff && this.setWithSideEffect( "instanceof", instanceoff);
        return this; }

    DValue(instanceoff?: DValue["instanceof"], val?: DValue["values"], isMirage?: DValue["isMirage"]): this {
        let thiss: DValue = this.thiss as any; thiss.edges = [];
        // thiss.values = val || [];
        thiss.instanceof = instanceoff;
        thiss.isMirage = isMirage || false;
        if (val === undefined) val = [];
        else if(!Array.isArray(val)) val = [val];
        thiss.values = [];// because reducer calculating newly added pointedby must find something to start comparison
        thiss.allowCrossReference = false;
        this.setPtr("values", val, this.state);

        // update father's collections (pointedby's here are set automatically)
        if (instanceoff) {
            this.setPtr("instanceof", instanceoff);
            this.setExternalPtr(instanceoff, "instances", "+=");
        }
        this.setExternalPtr(thiss.father, "features", "+=");
        return this; }

    DAnnotation(source?: DAnnotation["source"], details?: DAnnotation["details"]): this {
        const thiss: DAnnotation = this.thiss as any;
        thiss.source = source || '';
        thiss.details = details || [];
        this.setExternalPtr(thiss.father, "annotations", "+=");

        if (details) for (let det of details)
            thiss._persistCallbacks.push(SetFieldAction.create(det, "pointedBy", PointedBy.fromID(thiss.id, "details"), '+='));

        return this; }

    DPointerTargetable(): this {
        const thiss: DPointerTargetable = this.thiss as any;
        thiss.className = (thiss.constructor as typeof RuntimeAccessibleClass).cname;

        // this.className = thiss.className;
        return this; }

    DUser(name?: string, surname?: string, nickname?: string, affiliation?: string, country?: string, newsletter?: boolean,
          email?: string, token?: string, autoReport?:boolean, guid?:string): this {
        const _this: DUser = this.thiss as unknown as DUser;
        _this.name = name || '';
        _this._Id = guid;
        _this.surname = surname || '';
        _this.nickname = nickname || '';
        _this.affiliation = affiliation || '';
        _this.country = country || '';
        _this.newsletter = !!newsletter;
        _this.email = email || '';
        _this.token = token || '';
        _this.autoReport = !!autoReport;
        _this.layout = {}; // {'1': PinnableDock.defaultLayout};
        _this.autosaveLayout = true;
        _this.activeLayout = '1';
        // statehistory[_this.id] = new UserHistory();
        // todo: make it able to combine last 2 changes with a keystroke.
        //  reapeat N times to combine N actions.
        //  let it "redo" multiple times, it's like recording a macro.

        if (this.persist) {
            // no pointedBy
        }
        return this;
    }

    DNamedElement(name?: DNamedElement["name"]): this {
        const thiss: DNamedElement = this.thiss as any;
        thiss.name = (name !== undefined) ? name || '' : thiss.constructor.name.substring(1) + " 1";
        return this; }

    DTypedElement(type?: DTypedElement["type"]): this {
        const thiss: DTypedElement = this.thiss as any;
        thiss.allowCrossReference = false;

        let dtype = Selectors.getByName2(type) as DClassifier | null;
        switch (dtype?.className){
            default: type = undefined; break;
            case 'DClass':
                switch (thiss.className) {
                    case 'DReference':
                    case 'DOperation':
                    case 'DParameter':
                        type = dtype.id;
                        break;
                    case 'DAttribute':
                    default: type = dtype.id; break;
                }
                break;
            case 'DEnumerator':
                switch (thiss.className) {
                    case 'DAttribute':
                    case 'DOperation':
                    case 'DParameter':
                        type = dtype.id;
                        break;
                    case 'DReference':
                    default: type = undefined; break;
                }
                break;
        }

        if (!type) {
            switch (thiss.className) {
                default:
                case 'DReference':
                    type = this.fatherPtr as Pointer<DClass> || undefined;
                    break;
                case 'DOperation':
                case 'DParameter':
                    type = this.fatherPtr as Pointer<DClass> || Pointers.ESTRING;
                    break;
                case 'DAttribute':
                type = Pointers.ESTRING; break;
            }
        }
        this.setPtr("type", type);
        return this; }

    DPackage(uri?: DPackage["uri"], prefix?: DPackage["prefix"]): this {
        const thiss: DPackage = this.thiss as any;
        thiss.uri = uri || '';// || 'org.jodel-react.username';
        thiss.prefix = prefix || '';
        if (thiss.father) {
            if (this.fatherType!.cname === "DModel") {
                this.setExternalPtr(thiss.father, "packages", "+=");
            }
            else {
                this.setExternalPtr(thiss.father, "subpackages", "+=");
            }
        }
        return this; }

    DModel(instanceoff?: DModel["instanceof"], isMetamodel?: DModel["isMetamodel"]): this {
        const thiss: DModel = this.thiss as any;
        thiss.packages = []; // packages;
        thiss.isMetamodel = isMetamodel || false;
        thiss.dependencies = [];
        this.setPtr("instanceof", instanceoff || null);
        let lmodel: LModel | undefined = instanceoff ? LPointerTargetable.fromPointer(instanceoff) : undefined;
        this.thiss._persistCallbacks.push(()=>{
            if (lmodel){
                let lthis: LModel = LPointerTargetable.fromD(this.thiss);
                for (let c of lmodel.classes) {
                    let d: DClass = c.__raw;
                    if (d.isSingleton) lthis.addObject({name: d.name}, c, true);
                }
            }
        });
        instanceoff && this.setExternalPtr(instanceoff, "instances", "+=");
        // todo: check all D.new calls to make sure there are not actions in callbacks in new2() versions that will go outside the Transaction of persist(),, better move ptrs as .new() parameters
        // or make it so new2 splits pointer and non-pointer declarations (or just allow non-ptrs and ptrs must be DSomething.new() explicit parameters)
        thiss._persistCallbacks.push(SetRootFieldAction.create(isMetamodel ? "m2models" : "m1models", thiss.id, "+=", true));
        return this;
    }

    DOperation(exceptions: DOperation["exceptions"] = [], implementation?: string/*, parameters: DOperation["parameters"] = []*/): this {
        const thiss: DOperation = this.thiss as any;
        // thiss.parameters = parameters;
        thiss.implementation = implementation || 'return "default placeholder function called";'
        this.setPtr("exceptions", exceptions);
        this.setExternalPtr(thiss.father, "operations", "+=");
        return this; }

    DClass(isInterface: DClass["interface"] = false, isAbstract: DClass["abstract"] = false, isPrimitive: LClassifier["isPrimitive"] = false,
           partial: DClass["partial"] = false, partialdefaultname: DClass["partialdefaultname"] = ''): this {
        const thiss: DClass = this.thiss as any;
        thiss.interface = isInterface;
        thiss.abstract = isAbstract;
        thiss.isPrimitive = isPrimitive;
        thiss.partial = partial;
        thiss.partialdefaultname = partialdefaultname;
        thiss.isSingleton = false;
        thiss.rootable = undefined;
        thiss.sealed = [];
        thiss.final = false;
        thiss.allowCrossReference = false;
        this.setExternalPtr(thiss.father, "classes", "+=");
        this.setExternalRootProperty('ClassNameChanged.'+thiss.id, thiss.name, '', false);

        // thiss.isClass = !isPrimitive;
        // thiss.isEnum = false;
        return this; }

    DEnumLiteral(value?: DEnumLiteral["value"]): this { // vv4
        const thiss: DEnumLiteral = this.thiss as any;
        thiss.value = value as any; // undef is ok, handled in getter as automatic ordinal index
        thiss.literal = thiss.name;
        this.setExternalPtr(thiss.father, "literals", "+=");
        return this; }

    DEnumerator(literals: DEnumerator["literals"] = []): this {
        const thiss: DEnumerator = this.thiss as any;
        this.setExternalPtr(thiss.father, "enumerators", "+=");
        this.setPtr("literals", literals);
        // thiss.literals = literals;
        // thiss.isClass = false;
        // thiss.isEnum = true;
        return this; }
    DEdgePoint(): this { return this; }
    DEdge(): this {
        let thiss: DVoidEdge = this.thiss as any;
        return this; }
    DVertex(): this { return this; }
    DVoidEdge(start: DGraphElement["id"] | DGraphElement | LGraphElement | DModelElement["id"] | DModelElement | LModelElement,
              end: DGraphElement["id"] | DGraphElement | LGraphElement | DModelElement["id"] | DModelElement | LModelElement,
              longestLabel?: DEdge["longestLabel"], labels?: DEdge["labels"]): this {
        const thiss: DVoidEdge = this.thiss as any;
        let startid: DGraphElement["id"] = (windoww.LGraphElement as typeof LGraphElement).getNodeId(start);
        let endid: DGraphElement["id"] = (windoww.LGraphElement as typeof LGraphElement).getNodeId(end);
        Log.ex(!startid || !endid, "cannot create an edge without start or ending nodes", {start, end, startid, endid});
        thiss.anchorStart = '0';
        thiss.anchorEnd = '0';
        // thiss.startFollow = false;
        // thiss.endFollow = false;
        thiss.midnodes = [];
        thiss.midPoints = []; // the logic part which instructs to generate the midnodes
        // if (!thiss.model && isDModelElementPointer(startid)) thiss.model = startid;
        // thiss.labels = undefined;
        let ll: labelfunc = (e: LVoidEdge, s: EdgeSegment, allNodes: LGraphElement[], allSegments: EdgeSegment[]
        ) => /*defining the edge label (e.start.model as any)?.name + " ~ " + (e.end.model as any)?.name */" (" + s.length.toFixed(1) + ")";
        // complex edge label func example: (thiss.longestLabel = ll) but assign to transientnodeproperties or in jsx props instead on this.longestLabel
        thiss.longestLabel = longestLabel;
        this.setPtr("start", startid);
        this.setPtr("end", endid);
        this.setExternalPtr(startid, "edgesOut", "+=");
        this.setExternalPtr(endid, "edgesIn", "+=");

        let gthis: Partial<DVoidEdge> = thiss;
        delete gthis.x;
        delete gthis.y;
        delete gthis.w;
        delete gthis.h;
        delete gthis.edgesIn;
        delete gthis.edgesOut;
        delete gthis.anchors;
        delete gthis.__isDVoidEdge;
        delete (gthis as Partial<DEdge>).__isDEdge;
        return this; }

    DExtEdge(): this { return this; }
    DRefEdge(): this { return this; }

    DGraphElement(model: DGraphElement["model"]|null|undefined, parentgraphID: DGraphElement["graph"]|undefined,
                  htmlindex: number = 1): this {
        const thiss: DGraphElement = this.thiss as any;
        thiss.subElements = [];
        thiss.favoriteNode = false;
        thiss.zIndex = htmlindex;
        thiss.isSelected = {};
        thiss.edgesIn = [];
        thiss.edgesOut = [];
        thiss.subElements = [];
        thiss.zoom = {x:1, y:1} as any;
        // thiss.state = {id: thiss.id+".state", className: thiss.className};
        // 5-way anchors thiss.anchors = {'0':{x:0.5, y:0.5}, '1':{x:0.5, y:0}, '2':{x:1, y:0.5}, '3':{x:0.5, y:1}, '4':{x:0, y:0.5}} as any;

        thiss.anchors = {'0':{x:0.5, y:0.5},
            'tl':{x:0, y:0}, 't':{x:0.5, y:0}, 'tr':{x:1, y:0},
            'r':{x:1, y:0.5},
            'br':{x:1, y:1}, 'b':{x:0.5, y:1}, 'bl':{x:0, y:1},
            'l':{x:0, y:0.5},
            'ttl':{x:1/4, y:0}, 'ttr':{x:3/4, y:0},
            'bbl':{x:1/4, y:1}, 'bbr':{x:3/4, y:1},
            'tll':{x:0, y:1/4}, 'bll':{x:0, y:3/4},
            'trr':{x:1, y:1/4}, 'brr':{x:1, y:3/4},
        } as any;
        for (let k in (thiss.anchors as GObject)) {
            let a: GObject = thiss.anchors[k];
            if (!a.name) a.name = k;
            if (!a.w) a.w = 15;
            if (!a.h) a.h = 15;
        }

        this.parentgraphID = parentgraphID;
        this.setPtr("model", model);
        this.setPtr("graph", parentgraphID);
        this.setExternalPtr(thiss.father, "subElements", "+=");

        Log.eDev(thiss.father&&DPointerTargetable.fromPointer(thiss.father as Pointer<DGraphElement>)?.subElements.indexOf(thiss.id)!==-1, "subelemnts+= addition have duplicates",
            {adding:thiss, d:thiss.father&&DPointerTargetable.fromPointer(thiss.father as Pointer<DGraphElement>)?.subElements.indexOf(thiss.id)});

        return this;
    }

    DViewElement(name: string, jsxString: string, vp?: Pointer<DViewPoint>,
                 defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                 preRenderFunc: string = '', appliableToClasses: string[] = [], oclCondition: string = '', priority?: number): this {
        const thiss: DViewElement = this.thiss as any;
        const vid = thiss.id;
        let tv = transientProperties.view[vid];
        if (!tv) transientProperties.view[vid] = tv = new ViewTransientProperties();
        let VersionFixer: typeof TypeVersionFixer = windoww.VersionFixer;

        thiss.version = VersionFixer.get_highestversion();
        thiss.name = name;
        thiss.appliableToClasses = appliableToClasses;
        thiss.appliableTo = 'Any';
        thiss.jsxString = jsxString;
        thiss.usageDeclarations = usageDeclarations;
        thiss.constants = undefined; // '{}';
        thiss.preRenderFunc = ''; // '() => {return{}}';
        thiss.onDragEnd = thiss.onDragStart = thiss.whileDragging =
        thiss.onResizeEnd = thiss.onResizeStart = thiss.whileResizing = '';
        thiss.onRotationEnd = thiss.onRotationStart = thiss.whileRotating = '';
        thiss.onDataUpdate = '';
        thiss.events = {};
        thiss.subViews = {};
        thiss.oclCondition = oclCondition || '';
        thiss.jsCondition = '';
        thiss.oclUpdateCondition = '';
        thiss.OCL_NEEDS_RECALCULATION = true;
        thiss.explicitApplicationPriority = undefined as any; //priority as any as number;
        thiss.isExclusiveView = true;
        thiss.size = {};
        thiss.storeSize = false;
        thiss.lazySizeUpdate = true;
        thiss.isValidation = false;
        //thiss.constraints = [];
        thiss.palette = {
            'color-': U.hexToPalette(), //['#ffffff', '#ff0000', '#00ff00', '#0000ff','#aaaaaa', '#ffaaaa', '#aaffaa', '#aaaaff'],
            'background-': U.hexToPalette() // ['#000000', '#33333', '#777777']};
        };
        thiss.css = "\n/* placeholder justification, add .center, .left, .start, .right, or .end in the <Input /> container */\n\n";

        thiss.css += "input:placeholder-shown {\n" +
        "  width: 120px !important;\n" +
        "  font-style: italic !important;\n" +
        "  text-align: right;\n" +
        "  left: -120px !important;\n" +
        "}\n\n";

        thiss.css += ".center {\n" +
        "  & input:placeholder-shown {\n" +
        "    width: 120px !important;\n" +
        "    font-style: italic !important;\n" +
        "    text-align: center;\n" +
        "    left: -60px !important;\n" +
        "  }\n" +
        "}\n\n";

        thiss.css += ".left, .start {\n" +
        "  & input:placeholder-shown {\n" +
        "    width: 120px !important;\n" +
        "    font-style: italic !important;\n" +
        "    text-align: left;\n" +
        "    left: 0 !important;\n" +
        "  }\n" +
        "}\n\n";

        thiss.css += ".right, .end {\n" +
        "  & input:placeholder-shown {\n" +
        "    width: 120px !important;\n" +
        "    font-style: italic !important;\n" +
        "    text-align: right;\n" +
        "    left: -120px !important;\n" +
        "  }\n" +
        "}\n\n";

        thiss.css += ".input-container {\n" +
        "   & select {\n" +
        "        border: none;\n" +
        "        text-align: right;\n" +  
        "     }\n" +
        "}";


        thiss.compiled_css = '';
        thiss.css_MUST_RECOMPILE = true;
        thiss.cssIsGlobal = false;
        // thiss.palette = {};

        // thiss.useSizeFrom = EuseSizeFrom.node;
        // thiss.adaptHeight = false;
        // thiss.adaptWidth = false;


        thiss.draggable = true;
        thiss.resizable = true;
        //thiss.display = 'flex' as any;
        thiss.defaultVSize = defaultVSize || new GraphSize(0, 0, 140.6818084716797, 32.52840805053711);
        thiss.adaptWidth = false;
        thiss.adaptHeight = true; //'fit-content';

        thiss.edgeStartOffset = new GraphPoint(50, 50);
        thiss.edgeEndOffset = new GraphPoint(50, 50);
        thiss.edgeStartOffset_isPercentage = true;
        thiss.edgeEndOffset_isPercentage = true;
        thiss.edgeStartStopAtBoundaries = true;
        thiss.edgeEndStopAtBoundaries = true;
        thiss.bendingMode = EdgeBendingMode.Bezier_quadratic;
        thiss.edgeGapMode = EdgeGapMode.center;
        thiss.edgePointCoordMode = CoordinateMode.relativeOffset;
        thiss.usageDeclarations = undefined;

        /// edge only

        thiss.edgeHeadSize = new GraphPoint(20, 20);
        thiss.edgeTailSize = new GraphPoint(20, 20);
        if (thiss.className !== 'DViewElement') return this;
        const user: LUser = LUser.fromPointer(DUser.current);
        // const project = user?.project; if(!project) return this;
        if (!vp) vp = user?.project?.activeViewpoint.id || Defaults.viewpoints[0];
        if (vp !== 'skip') {
            // let dvp = DPointerTargetable.fromPointer(vp);
            // let subviews = {...dvp.subViews}; subviews[thiss.id] = 1.5;
            // this.setExternalPtr(vp, 'subViews', '', subviews);
            this.setPtr('viewpoint', vp);
        }

        this.setExternalPtr(this.fatherPtr as Pointer<DViewElement>, 'subViews', '+=', {[thiss.id]: 1.5});
        transientProperties.view[thiss.id] = {} as any;

        // let trview = transientProperties.view[thiss.id];
        // trview.?? = ???

        TRANSACTION('recompile jsx & more', () => {
            // add relation to vp
            for(let key of (windoww.DViewElement as typeof DViewElement).RecompileKeys)
                this.setExternalRootProperty('VIEWS_RECOMPILE_'+key, thiss.id, '+=', false) // is pointer, but no need to set pointedby
        })

        // this.setExternalPtr(project.id, 'views', '+=');
        // this.setExternalPtr(project.id, 'stackViews', '+=');
        return this;
    }

    DViewPoint(): this {
        const thiss: DViewPoint = (this.thiss) as any;
        const user: LUser = LUser.fromPointer(DUser.current);
        const project = user?.project;
        if (!project) return this;
        this.setExternalPtr(project.id, 'viewpoints', '+=');
        // thiss.cssIsGlobal = true;
        // thiss._persistCallbacks.push( SetFieldAction.create(project.id, 'stackViews', [], '', false) );
        return this;
    }

    DProject(type: DProject['type'], name: string, state: DProject['state'], m2: DProject['metamodels'], m1: DProject['models'], id?: DProject['id']): this {
        const _this: DProject = U.wrapper<DProject>(this.thiss);
        let VersionFixer: typeof TypeVersionFixer = windoww.VersionFixer;
        _this.metamodels = m2;
        _this.models = m1;
        _this.type = type;
        _this.name = name;
        _this.state = state || '';
        _this.version = state ? -1 : VersionFixer.get_highestversion();
        if(id) _this.id = id;
        _this.favorite = {};
        let user: DUser = (DPointerTargetable.from(DUser.current) as DUser)
        /*if (!user as any) {
            let str = localStorage.getItem('user');
            let state = store.getState();
            let idlookup = state.idlookup;
            if (str) user = JSON.parse(str) as any as DUser;
            else user = idlookup[DUser.current || state.users[0]] as DUser;
            DUser.current = user.id;
            if (!(DUser.current in idlookup)) idlookup[DUser.current] = user;
            console.error('user not loaded', {user, DUser, curr: DUser.current});
        }*/
        _this.description = 'A new Project. Created by ' + user.nickname + ' @' + new Date().toLocaleString();
        _this.layout = {};
        _this.autosaveLayout = true;
        _this.activeLayout = undefined;

        this.setExternalPtr(DUser.current, 'projects', '+=');
        return this;
    }

    static DGraph_maxID: number = 0;
    public static DGraph_makeID(modelid: DGraph["model"]): Pointer<DGraph, 1, 1, LGraph> {
        if (!modelid) modelid = "shapeless";
        return modelid + '_graph' + Constructors.DGraph_maxID++;
    }
    DGraph(): this {
        const thiss: DGraph = this.thiss as any;
        thiss.graph = thiss.id; // no setPtr because i want to avoid circular pointedby reference
        thiss.zoom = new GraphPoint(1, 1);
        thiss.offset = new GraphSize(0, 0);  // GraphSize.apply(this, [0, 0, 0 ,0]);
        thiss._subMaps = {zoom: true, graphSize: true}

        const user: LUser = LUser.fromPointer(DUser.current);
        if (thiss.className === 'DGraph') { // to exclude GraphVertex
            user.project && this.setExternalPtr(user.project.id, 'graphs', "+=");
            thiss.x = 0;
            thiss.y = 0;
            thiss.w = 0;
            thiss.h = 0;
        }
        return this; }

    DVoidVertex(defaultVSize?: InitialVertexSize): this {
        const thiss: DVoidVertex = this.thiss as any;
        /*[]{}<>
?'^~
&&||\+
6nb*/

        if (!defaultVSize) {
            let graph = this.parentgraphID ? D.from(this.parentgraphID) as DGraph : undefined;
            if (graph) switch (thiss.className) {
                case 'DGraphVertex':
                case 'DVertex':
                    thiss.x = -graph.offset.x + graph.offset.w/2;
                    thiss.y = -graph.offset.y + graph.offset.h/2;
                    break;
            }
        }
        let defaultVSizeObj: InitialVertexSizeObj | undefined;
        let defaultVSizeFunc: InitialVertexSizeFunc;
        thiss.isResized = false;

        let lvertex: LVoidVertex = LPointerTargetable.fromD(thiss);
        if (typeof defaultVSize !== "function") { defaultVSizeObj = defaultVSize; }
        else {
            defaultVSizeFunc = defaultVSize;
            try { defaultVSizeObj = defaultVSizeFunc(lvertex.father); }
            catch (e) { Log.exx("Error in user DefaultVSize function:", {e, defaultVSizeFunc, txt:defaultVSizeFunc.toString()}); }
        }
        if (defaultVSizeObj) {
            if (defaultVSizeObj.x !== undefined) thiss.x = defaultVSizeObj.x;
            if (defaultVSizeObj.y !== undefined) thiss.y = defaultVSizeObj.y;
            if (defaultVSizeObj.w !== undefined) thiss.w = defaultVSizeObj.w;
            if (defaultVSizeObj.h !== undefined) thiss.h = defaultVSizeObj.h;

            if ((defaultVSizeObj as any).index >= 0 && thiss.className === "DEdgePoint") {
                let updateEPindex = () => {
                    let lep = lvertex as LEdgePoint;
                    let le: LVoidEdge = lep.father;
                    let de: DVoidEdge = le.__raw;
                    let subelements = [...de.subElements];
                    U.arrayRemoveAll(subelements, thiss.id);
                    subelements.splice(defaultVSizeObj?.index as number, 0, thiss.id);
                    // console.log("setting subelements", {oldsubelements, subelements, de, le, thiss});
                    le.subElements = subelements as any;
                    // todo: this might break "pointedBy" x984
                }
                // updateEPindex();
                // it's already wrapped in a callback
                // but needs a second one because after node is created, id is auto-appended to this collection
                // and i need to rewrite that append by inserting my own customized index position
                console.log("setting subelements 0", {updateEPindex});
                setTimeout(updateEPindex, 0);
                // NB: do not use this.callbacks.push because the body of this func is executed after Constructors.end() so end() can never find and execute it.
            }
        }

        return this; }


}
// export const Constructors = new _Constructors();

@RuntimeAccessible("DPointerTargetable")
export class DPointerTargetable extends RuntimeAccessibleClass {
    static defaultComponent: (ownProps: GObject, children?: ReactNode) => React.ReactElement; //
    public static maxID: number = 0;
    public static logic: typeof LPointerTargetable;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    static pendingCreation: Record<Pointer<DPointerTargetable, 1, 1>, DPointerTargetable> = {};
    clonedCounter?: number;
    _storePath?: string[];
    _subMaps?: Dictionary<string, boolean>;
    id!: Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    // pointedBy: DocString<'path in store'>[] = []; // NB: potrebbe contenere puntatori invalidi.
    // se viene cancellato un intero oggetto A che contiene una lista di puntatori, gli oggetti che puntano ad A rimuovono A dai loro "poitnedBy",
    // ma gli oggetti puntati da A tramite sotto-oggetti o attributi (subviews...) non vengono aggiornati in "pointedby"
    pointedBy: PointedBy[] = [];
    public className!: string;
    public __readonly!: boolean;
    _state: GObject = {};
    name?:string;
    parent?: any;
    zoom!: GraphPoint;

    static defaultname<L extends LModelElement = LModelElement>(startingPrefix: string | ((meta:L)=>string), father?: Pointer | DPointerTargetable | ((a:string)=>boolean), metaptr?: Pointer | null): string {
        let lfather: LModelElement;
        // startingPrefix = "model_", father = ((name: string) => !dmodelnames.includes(name))
        if (father) {
            if (typeof father === "string" || (father as any).className) { // Pointer or D
                lfather = LPointerTargetable.wrap(father as DModelElement) as LModelElement;
                if (!lfather) return (typeof startingPrefix === "string" ? startingPrefix : "unnamed_elem");
                if (typeof startingPrefix !== "string") {
                    let meta = LPointerTargetable.from(metaptr as Pointer);
                    startingPrefix = startingPrefix(meta as L);
                }
                const childrenNames: (string)[] = lfather.childNames; // lfather.children.map(c => (c as LNamedElement)?.name);
                return U.increaseEndingNumber(startingPrefix + '0', false, false, (newname) => childrenNames.indexOf(newname) >= 0);
            }
            else if (typeof father === 'function') {
                let condition = father as any as ((a:string)=>boolean);
                return U.increaseEndingNumber(startingPrefix + '0', false, false, condition);
            }
        }
        return startingPrefix + "1"; }

    public static new(...a:any): DPointerTargetable { //father?: Pointer, persist: boolean = false, fatherType?: Constructor, ...a:any): DPointerTargetable {
        Log.exx("cannot instantiate abstract class DPointerTargetable");
        return null as any;
        // return new Constructors(new DPointerTargetable('dwc'), father, persist, fatherType).DPointerTargetable().end();
    }
    constructor(fakearg_detectwrongcalls:'dwc') {
        super();
        if (!fakearg_detectwrongcalls) throw new Error( "cannot build D-objects using new keyword, use the static D-Class.new method instead");
    }

    static fromL<LX extends LPointerTargetable,
        DX = LX extends LEnumerator ? LEnumerator : (LX extends LAttribute ? LAttribute : (LX extends LReference ? LReference : (LX extends LRefEdge ? LRefEdge : (LX extends LExtEdge ? LExtEdge : (LX extends LDataType ? LDataType : (LX extends LClass ? LClass : (LX extends LStructuralFeature ? LStructuralFeature : (LX extends LParameter ? LParameter : (LX extends LOperation ? LOperation : (LX extends LEdge ? LEdge : (LX extends LEdgePoint ? LEdgePoint : (LX extends LGraphVertex ? LGraphVertex : (LX extends LModel ? LModel : (LX extends LValue ? LValue : (LX extends LObject ? LObject : (LX extends LEnumLiteral ? LEnumLiteral : (LX extends LPackage ? LPackage : (LX extends LClassifier ? LClassifier : (LX extends LTypedElement ? LTypedElement : (LX extends LVertex ? LVertex : (LX extends LVoidEdge ? LVoidEdge : (LX extends LVoidVertex ? LVoidVertex : (LX extends LGraph ? LGraph : (LX extends LNamedElement ? LNamedElement : (LX extends LAnnotation ? LAnnotation : (LX extends LGraphElement ? LGraphElement : (LX extends LMap ? LMap : (LX extends LModelElement ? LModelElement : (LX extends LUser ? LUser : (LX extends LPointerTargetable ? LPointerTargetable : (ERROR)))))))))))))))))))))))))))))))
        >(data: LX): DX {
        return data.__raw as any;
    }


    static fromPointer<// LOW extends number, UPP extends number | 'N',
        T extends Pointer | Pointer[], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        DDD extends (T extends Pointer<infer D> ? D : 'undefined D'),
        LOW extends (T extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (T extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),

        DDDARR extends (T extends Pointer<infer D>[] ? D : 'undefined_DARR'),
        LOWARR extends (T extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (T extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),

        RET = UPPARR extends 'UP_is_N' ?
            (DDDARR[]) : // 0...N
            (UPP extends 1 ? (LOW extends 0 ? DDD /*| null*/ : DDD) : // 0...1 && 1...1
                (LOW extends 1 ? DDD : /*undefined*/DDD)  //1...1
                ),
        INFERRED = {ret: RET, upp: UPP, low:LOW, ddd: DDD, dddARR: DDDARR, lowARR: LOWARR, uppARR: UPPARR},>(ptr: T, s?: DState)
        : RET {
        s = s || store.getState();
        if (!ptr) { return ptr as any; }
        if (Array.isArray(ptr)) {
            return ptr.map( (p: Pointer) => DPointerTargetable.fromPointer(p, s)) as any;
        }
        if (typeof ptr !== "string") {
            console.error("wrong parameter in DPointerTargetable.fromPointers()", ptr);
            throw new Error("wrong parameter in DPointerTargetable.fromPointers()");
        }
        if (s && s.idlookup[ptr as string]) return s.idlookup[ptr as string] as any;
        return (DPointerTargetable.pendingCreation[ptr as string] || s.idlookup[ptr as string]) as any;
        // return ((s || store.getState()).idlookup[ptr as string] || DPointerTargetable.pendingCreation[ptr as string]) as any;
    }

    static from<// LOW extends number, UPP extends number | 'N',
        PTR extends Pointer | Pointer[], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        DDD extends (PTR extends Pointer<infer D> ? D : 'undefined D'),
        LOW extends (PTR extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (PTR extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),

        DDDARR extends (PTR extends Pointer<infer D>[] ? D : 'undefined_DARR'),
        LOWARR extends (PTR extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (PTR extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),

        LX extends LPointerTargetable,

        RETPTR = UPPARR extends 'UP_is_N' ?
            (DDDARR[]) : // 0...N
            (UPP extends 1 ? (LOW extends 0 ? DDD | null : DDD) : // 0...1 && 1...1
                (LOW extends 1 ? DDD : undefined)  //1...1
                ),
        // DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : ('ERROR'))))))))))))))))),
        DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LRefEdge ? DRefEdge : (LX extends LExtEdge ? DExtEdge : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LEdge ? DEdge : (LX extends LEdgePoint ? DEdgePoint : (LX extends LGraphVertex ? DGraphVertex : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LVertex ? DVertex : (LX extends LVoidEdge ? DVoidEdge : (LX extends LVoidVertex ? DVoidVertex : (LX extends LGraph ? DGraph : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : (LX extends LGraphElement ? DGraphElement : (LX extends LMap ? DMap : (LX extends LModelElement ? DModelElement : (LX extends LUser ? DUser : (LX extends LPointerTargetable ? DPointerTargetable : (ERROR))))))))))))))))))))))))))))))),
        RET = DX extends 'ERROR' ? RETPTR : (RETPTR extends DX ? RETPTR : DX),
        INFERRED = {ret: RET, RETPTR:RETPTR, upp: UPP, low:LOW, ddd: DDD, dddARR: DDDARR, lowARR: LOWARR, uppARR: UPPARR, LX:LX, DX:DX}>(ptr: PTR | LX, s?: DState)
        : RET {
        if (!ptr) return ptr as any;
        if (Array.isArray(ptr)) return DPointerTargetable.fromArr(ptr, true, s) as any;
        if ((ptr as LX).__isProxy) return (ptr as LX).__raw as any;
        if (typeof ptr === "string") {
            if (s && s.idlookup[ptr as string]) return s.idlookup[ptr as string] as any;
            return (DPointerTargetable.pendingCreation[ptr as string] || store.getState().idlookup[ptr as string]) as any;
        }
        else if ((ptr as any as GObject<DX>).className) return ptr as any;
        else return undefined as any;
    }
    public static fromArr(arr:any[], filter: boolean = true, s?: DState): DPointerTargetable[]{
        let ret: (DPointerTargetable)[] = [];
        s = s || store.getState();
        for (let a of arr) {
            let d = DPointerTargetable.from(a, s);
            if (!filter || d) ret.push(d as DPointerTargetable);
        }
        return ret;
    }
    //static from0(a: any, ...aa: any): any { return null; }
    static writeable<LX extends LPointerTargetable, WX = LtoW<LX>>(l: LX): WX { return l as any; }

    _persistCallbacks!: ((() => void) | Action)[]; // deleted when it becomes persistent
    _derivedSubElements!: DModelElement[]; // deleted when it becomes persistent
    // persist(): void { Constructors.persist(this); }// deleted when it becomes persistent


    /*protected */derivedMap!: Dictionary<string, DerivedD>;
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, DPointerTargetable);
/*
let d0: LClassifier = null as any;
let ptrr: Pointer<DPackage, 1, 'N', LPackage> = null as any;
let ptr1: Pointer<DPackage, 1, 1, LPackage> = null as any;
let dd = DPointerTargetable.from(d0.id);
*/


/*
type Pack1<D extends DPointerTargetable, L extends LPointerTargetable = DtoL<D>, P extends Pointer<D, 0, 1, L> = Pointer<D, 0, 1, L>, R = {D:D, L:L, P:P} > = P|D|L
type PackArr<D extends DPointerTargetable, L extends LPointerTargetable = DtoL<D>, P extends Pointer<D, 0, 1, L> = Pointer<D, 0, 1, L> , ARR = Pack1<D>> = (ARR)[];
type Pack<D extends DPointerTargetable, L extends LPointerTargetable = DtoL<D>, P extends Pointer<D, 0, 1, L> = Pointer<D, 0, 1, L> , ARR = Pack1<D>> = ARR | (ARR)[];*/



@RuntimeAccessible('Pointers')
export class Pointers{
    public static prefix = 'Pointer_';
    public static ESTRING = 'Pointer_ESTRING';

    static filterValid<P extends (Pointer | Pointer[]) = any, RET = P extends Pointer[] ? P : P | null>
    (p: P): P | null {
        const pointerval: DPointerTargetable | DPointerTargetable[] = DPointerTargetable.from(p);
        if (Array.isArray(pointerval)) return pointerval.filter( p => !!p).map( p => p.id) as P;
        if (!pointerval) return null;
        return pointerval.id as P; }

    static fromArr<D extends DPointerTargetable, L extends LPointerTargetable, P extends Pointer> (val: (P | D | L | null | undefined)[] |  (P | D | L | null | undefined)): P[] {
        if (!val) val = [];
        if (!Array.isArray(val)) { val = [val]; }
        if (!val.length) { return []; }
        if ((val[0] as any).id) { val = (val as any as (LModelElement | DModelElement)[]).filter(v => !!v).map( (v) => v.id) as any[]; }
        return val.filter( v => !!v) as any[]; }

    fromm<D extends DPointerTargetable, L extends LPointerTargetable, P extends Pointer> (val: (P | D | L)): P | null { return !val ? null : (val as any).id; }

    from0<// LOW extends number, UPP extends number | 'N',
        PTR extends Pointer | Pointer[], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        // DDD extends (PTR extends Pointer<infer D> ? D : 'undefined_D'),
        LOW extends (PTR extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (PTR extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),
        DDD extends (PTR extends Pointer<any, number, any, infer LL> ? LL : 'undefined_L'),

        LOWARR extends (PTR extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (PTR extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),
        DDDARR extends (PTR extends Pointer<any, any, any, infer LL>[] ? LL : 'undefined_LARR'),

        DX extends DPointerTargetable,
        LX extends LPointerTargetable,
        WX extends WPointerTargetable,
        RETPTR = UPPARR extends 'UP_is_N' ?
            (DDDARR[]) : // 0...N
            (UPP extends 1 ? (LOW extends 0 ? DDD | null : DDD) : // 0...1 && 1...1
                (LOW extends 1 ? DDD : undefined)  //1...1
                ),


        // DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : ('ERROR'))))))))))))))))),
        LXX = DtoL<DX>,
        DXX = LtoD<LX>,
        LXFinal = LXX extends 'ERROR' ? LX : LXX,
        DXFinal = DXX extends 'ERROR' ? DX : DXX,
        RET = {d: DXFinal, l:LXFinal}, // Pointer<DX, 0 | 1, 1 | 'N', LX>
        INFERRED = {ret: RET, RETPTR: RETPTR, LXX: LXX, DXX: DXX, upp: UPP, low:LOW, ddd: DDD, dddARR: DDDARR, lowARR: LOWARR, uppARR: UPPARR, LX:LX, DX:DX}>(data: LX | DX | WX)
        : INFERRED {
        return null as any;
    }


    static from00<
        // LOW extends number, UPP extends number | 'N',
        // DDD extends (PTR extends Pointer<infer D> ? D : 'undefined_D'),
        DWL extends {id: any},
        // PCK extends (T extends Pack<infer PPP> ? PPP : never),
        //ISARR extends (T extends any[] ? true : false),
        // PCK1 extends (T extends any[] ? null : T extends Pack1<infer PPP> ? PPP : never), //         PCK1 extends (T extends any[] ? true : false),
        // PCKA extends (T extends PackArr<infer PPP> ? PPP : 'undefined_arrpack'),
        // PTR extends DWL["id"], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        // T extends DWL | DWL[] | null | undefined,
        /*DX extends (PTR extends Pointer<infer D0> ? D0 : 'undefined_D'),
        LOW extends (PTR extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (PTR extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),
        LX extends (PTR extends Pointer<any, number, any, infer LL> ? LL : 'undefined_L'),

        LOWARR extends (PTR extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (PTR extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),
        DDDARR extends (PTR extends Pointer<any, any, any, infer LL>[] ? LL : 'undefined_LARR'),
        RET = DX extends DPointerTargetable ? ( LOW extends number ? ( UPP extends number ? ( LX extends LPointerTargetable ? Pointer<DX, LOW, UPP, LX> : '_notret_L_') : '_notret_UPP_') : '_notret_LOW_') : '_notret_D_'
        */
        PTRPARAM = Pointer | Pointer[],
        T = Exclude<DWL | DWL[] | PTRPARAM, unknown[]>,
        // @ts-ignore
        PTR = T extends null ? null : T extends undefined ? null : (T extends PTRPARAM ? T : (T extends any[] ? T[number]['id'][] : T['id'])),
        // RET extends Pointer<DPointerTargetable, any, any, LPointerTargetable> = T extends DWL ? DWL["id"] : (T extends DWL[] ? DWL["id"] : null),
        // INF = { PCK:PCK, ISARR: ISARR,  PTR: PTR, DWL: DWL, RET: RET}, // {DD:DD, LL: LL}//
        >(data: T | T[] ): PTR { // RET | RET[] {
        if (Array.isArray(data)) return data.filter(d => !!d).map(d => (typeof d === "string" ? d : (d as any as DWL).id)) as any;
        else return (data ? (data as any).id : null as any);
    } // stavolta fai infer so D|l.id


    public static from<DX extends DPointerTargetable>(data:DX): DX["id"]; // | {D:any};
    public static from<DX extends DPointerTargetable>(data:DX[]): DX["id"][]; // | {DD:any};
    public static from<LX extends LPointerTargetable>(data:LX): LX["id"]; // | {L:any};
    public static from<LX extends LPointerTargetable>(data:LX[]): LX["id"][]; // | {LL:any};
    public static from<WX extends WPointerTargetable>(data:WX): WX["id"]; // | {W:any};
    public static from<WX extends WPointerTargetable>(data:WX[]): WX["id"][]; // | {WW:any};
    public static from<PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable>>(data:PTR): PTR; // | {P:any};
    public static from<PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable>>(data:PTR[]): PTR[]; // | {PP:any};
    public static from<T extends LPointerTargetable>(data:Pack1<T>): Pointer<LtoD<T>, 1, 1, T>; //{TEST1:any};
    public static from<T extends LPointerTargetable>(data:Pack1<T>[]): Pointer<LtoD<T>, 1, 1, T>[]; //{TEST111:any};
    public static from<T extends LPointerTargetable>(data:Pack<T>): Pointer<LtoD<T>, 1, 1, T>[]; //{TEST0:any};
    public static from<P extends Pack<T> | undefined, T extends LPointerTargetable>(data: P): Pointer<LtoD<T>, 1, 1, T>[]; //{TEST0:any};
    public static from<T extends LPointerTargetable>(data:PackArr<T>): Pointer<LtoD<T>, 1, 1, T>[]; //{TESTARR:any};
    public static from<T extends LPointerTargetable>(data:Pack1<T[]>): Pointer<LtoD<T>, 1, 1, T>; //{TEST1:any};
    public static from<T extends LPointerTargetable>(data:Pack1<T[]>[]): Pointer<LtoD<T>, 1, 1, T>[]; //{TEST111:any};
    public static from<T extends LPointerTargetable>(data:Pack<T[]>): Pointer<LtoD<T>, 1, 1, T>[]; //{TEST0:any};
    public static from<T extends LPointerTargetable>(data:PackArr<T[]>): Pointer<LtoD<T>, 1, 1, T>[]; //{TESTARR:any};

    /*
        public static from(data:undefined): undefined; // | {D:any};
        public static from<DX extends DPointerTargetable | undefined | null>(data:DX): DX extends DPointerTargetable ? DX["id"] : DX; // | {D:any};
        public static from<DX extends DPointerTargetable | undefined | null>(data:DX[]): DX extends DPointerTargetable ? DX["id"][] : DX; // | {DD:any};
        public static from<LX extends LPointerTargetable | undefined | null>(data:LX): LX extends LPointerTargetable ? LX["id"] : LX; // | {L:any};
        public static from<LX extends LPointerTargetable | undefined | null>(data:LX[]): LX extends LPointerTargetable ? LX["id"][] : LX; // | {LL:any};
        public static from<WX extends WPointerTargetable | undefined | null>(data:WX): WX extends WPointerTargetable ? WX["id"] : WX; // | {W:any};
        public static from<WX extends WPointerTargetable | undefined | null>(data:WX[]): WX extends WPointerTargetable ? WX["id"][] : WX; // | {WW:any};
        public static from<PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable> | undefined | null>(data:PTR): PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable> ? PTR : PTR; // | {P:any};
        public static from<PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable> | undefined | null>(data:PTR[]): PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable> ? PTR[] : PTR; // | {PP:any};
        public static from<T extends LPointerTargetable | undefined | null>(data:Pack1<T>): T extends LPointerTargetable ? Pointer<LtoD<T>, 1, 1, T> : T; //{TEST1:any};
        public static from<T extends LPointerTargetable | undefined | null>(data:Pack1<T>[]): T extends LPointerTargetable ? Pointer<LtoD<T>, 1, 1, T>[] : T; //{TEST111:any};
        public static from<T extends LPointerTargetable | undefined | null>(data:Pack<T>): T extends LPointerTargetable ? Pointer<LtoD<T>, 1, 1, T>[] : T; //{TEST0:any};
        public static from<T extends LPointerTargetable | undefined | null>(data:PackArr<T>): T extends LPointerTargetable ? Pointer<LtoD<T>, 1, 1, T>[] : T; //{TESTARR:any};
        // public static from<T extends LPointerTargetable | undefined | null>(data:Pack1<T[]>): T extends LPointerTargetable ? Pointer<LtoD<T>, 1, 1, T> : T; //{TEST1:any};
        // public static from<T extends LPointerTargetable | undefined | null>(data:Pack1<T[]>[]): T extends LPointerTargetable ? Pointer<LtoD<T>, 1, 1, T>[] : T; //{TEST111:any};
        // DDD extends (T extends Pointer<infer D> ? D : 'undefined D'),*/
    // returns:
    // if ptr is unvalid = undefined;
    // if [ptr] is unvalid = []
    public static from<TT extends Pack<LPointerTargetable[]> | undefined | null,
        // @ts-ignore
        T extends (TT extends Pack<infer PTYPE> ? PTYPE : undefined)>(data:T): T extends null | undefined ? T : Pointer<LtoD<T>, 1, 1, T>[]; //{TEST0:any};
    // @ts-ignore
    public static from<T extends LPointerTargetable | undefined | null>(data: PackArr<T[]>): T extends null | undefined ? T : Pointer<LtoD<T>, 1, 1, T>[]; //{TESTARR:any};
    public static from(data:null | undefined): null; // | {Dn:any};
    public static from(data:(null | undefined)[]): []; // | {Dnn:any};
    public static from(data:(null | undefined) | (null | undefined)[]): []; // | {Dn0:any};

    // function from<PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable>>(data:unknown | unknown[]): PTR | PTR[] | GObject {
    public static from<T extends LClass, PTR extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable>>(data:unknown | unknown[]): null | PTR | PTR[]{
        if (!data) return null;
        if (Array.isArray(data)) return data.filter(d => !!d).map(d => (typeof d === "string" ? d : (d as any)?.id)) as any;
        return typeof data === "string" ? data as PTR : (data as any)?.id;
    }

    static isPointer(val: any, state?: DState, doArrayCheck: boolean = false): val is Pointer {
        // might cause endless loop if there are subarrays in a containment loop.
        if (doArrayCheck && Array.isArray(val)) return (val as any[]).some((v) => Pointers.isPointer(val, state, true));
        if (state) return DPointerTargetable.from(val, state);
        return typeof val === "string" ? val.indexOf("Pointer") === 0 : false;
    }

}

/*
export type Pack1<L extends LPointerTargetable | undefined | null,
    // L extends LPointerTargetable | undefined | null = LL extends LPointerTargetable[] ? LPointerTargetable : null | undefined,
    D extends (L extends LPointerTargetable ? LtoD<L> : undefined | null) = (L extends LPointerTargetable ? LtoD<L> : undefined | null)> =
    L extends LPointerTargetable ? ( D extends DPointerTargetable ? D | L /*| LtoW<L>* / | Pointer<D, 1, 1, L> : L) : undefined;
export type PackArr<LL extends orArr<LPointerTargetable> | undefined | null,
    L extends LPointerTargetable | undefined | null = LL extends undefined | null ? undefined : unArr<LL>> = Pack1<L>[];
export type Pack<
    LL extends orArr<LPointerTargetable> | undefined | null,
    L extends unArr<LL> = unArr<LL>,
    // L extends (LL extends orArr<LPointerTargetable> ? LPointerTargetable : undefined | null) = (LL extends orArr<LPointerTargetable> ? unArr<LL> : undefined)
    >
    = LL extends undefined ? undefined : Pack1<L> | PackArr<L>;
*/
export type Pack1<LL extends orArr<LPointerTargetable> | undefined, L extends LPointerTargetable | undefined = unArr<LL>,
    D extends (L extends LPointerTargetable ? LtoD<L> : undefined) = (L extends LPointerTargetable ? LtoD<L> : undefined)> =
    L extends LPointerTargetable ? ( D extends DPointerTargetable ? D | L | Pointer<D, 1, 1, L> : undefined) : undefined;
export type PackArr<LL extends orArr<LPointerTargetable> | undefined, L extends LPointerTargetable | undefined = unArr<LL>> = Pack1<L>[];
export type Pack<LL extends orArr<LPointerTargetable> | undefined, L extends LPointerTargetable | undefined = unArr<LL>> = L extends undefined ? undefined : Pack1<L> | PackArr<L>;
/*
let n: any = null;
let aa: DClass = n;
let ptrr = Pointers.from(aa.parent);
aa.parent = ptrr;*/

@RuntimeAccessible('PendingPointedByPaths')
export class PendingPointedByPaths{
    static all: PendingPointedByPaths[] = [];
    // static pendingMoreThanTwice: ParsedAction[] = [];
    static maxSolveAttempts: number = 2099999;
    public solveAttempts: number = 1;
    private stackTrace: string[];

    // tmp fields, not sure what i need
    public action!: ParsedAction; // todo: remove
    // the mistake was: i was getting the val from action, and the val was an array.
    // i can either: manually pass it (better?)
    // or: calculate array difference but risk duplicate entries (for 2 difference gets called 2 times and add both twice)
    static new(action: ParsedAction, oldState: DState, ptr: Pointer, casee: "+=" | "-=" | undefined = undefined): PendingPointedByPaths {
        //const ptr: Pointer = action.value;
        // const target: DPointerTargetable | null = oldState.idlookup[ptr as string];
        let pendingPointedBy = new PendingPointedByPaths(action.path, ptr, casee);
        pendingPointedBy.action = action;
        return pendingPointedBy;
    }

    private constructor(
        public from: DocString<"full Path in store including field key">,
        public holder: Pointer,
        public casee: "+=" | "-=" | undefined = undefined) {
            this.stackTrace = U.getStackTrace();
    }
    static attemptimplementationdelete(pb: PointedBy) {
        let state: DState = store.getState();
        let objectChain = U.followPath(state, pb.source);
    }

    public attemptResolve(state: DState): ParsedAction | null {
        if (this.canBeResolved(state)) return this.resolve();
        return null;
    }
    public attemptResolveDirectly(state: DState, oldState: DState): DState {
        if (this.canBeResolved(state)) state = this.resolveDirectly(state, oldState);
        return state;
    }

    private resolve(state?: DState, oldState?: DState): ParsedAction{
        U.arrayRemoveAll(PendingPointedByPaths.all, this);
        return Action.parse(SetRootFieldAction.create("idlookup." + this.holder + '.pointedBy', PointedBy.new(this.action.path, this.casee), '+=', false));
    }

    private resolveDirectly(state: DState, oldState: DState): DState {
        U.arrayRemoveAll(PendingPointedByPaths.all, this);
        if (state === oldState) state = {...state} as any;
        let dobj = state.idlookup[this.holder];
        let oldobj = oldState.idlookup[this.holder];
        if (state.idlookup === oldState.idlookup) state.idlookup = {...state.idlookup};
        if (oldobj && dobj === oldobj) state.idlookup[this.holder] = dobj = {...dobj} as any;
        if (oldobj && dobj.pointedBy === oldobj.pointedBy) dobj.pointedBy = [...dobj.pointedBy]

        dobj.pointedBy.push(PointedBy.new(this.action.path, this.casee));

        //Action.parse(SetRootFieldAction.create("idlookup." + this.holder + '.pointedBy', '+=', false));
        return state;
    }

    public saveForLater(): void { PendingPointedByPaths.all.push(this); }
    private canBeResolved(state: DState): boolean {
        this.solveAttempts++;
        Log.w(this.solveAttempts >= 3 /*PendingPointedByPaths.maxSolveAttempts*/,
            "pending PointedBy action is not revolved for too long, some pointer was wrongly set up.", this.stackTrace, this, state);
        return !!state.idlookup[this.holder];
    }

    static getSolveableActions(oldState: DState): ParsedAction[] {
        let allClone = [...this.all]; // necessary because the array will remove some elements during iteration as they are solved.
        return allClone.map( p => p.attemptResolve(oldState)).filter(p => (!!p)) as ParsedAction[];
    }
    static getSolveableActions2(state: DState, oldState: DState): DState {
        let allClone = [...this.all]; // necessary because the array will remove some elements during iteration as they are solved.
        for (let p of allClone) state = p.attemptResolveDirectly(state, oldState); //.filter(p => (!!p));
        return state;
    }
}

@RuntimeAccessible('PointedBy')
export class PointedBy {
    static list: string[] = ["father", "parent", "annotations", "packages", "type", "subpackages",
        "classes", "enumerators", // "classifiers",
        "exceptions", "parameters", "defaultValue", "instances", "operations", "features", "attributes", "references", "extends",
        "implements", "implementedBy", "instanceof", "edges", "target", "opposite", "parameters", "exceptions", "literals", "values"];
    source: string; // elemento da cui parte il puntatore
    // field: keyof DPointerTargetable;
    // il bersaglio non c'è qui, perchè è l'oggetto che contiene questo dentro l'array pointedBy

    /*private constructor(source: DPointerTargetable, field: any) {
        this.source = source;
        this.field = field;
    }*/

    static merge(d1: DPointerTargetable, d2: DPointerTargetable,): PointedBy[] {
        let deduplicator: Dictionary<string, PointedBy> = {};
        for (let p of d2.pointedBy) deduplicator[p.source] = p;
        for (let p of d1.pointedBy) deduplicator[p.source] = p;
        return Object.values(deduplicator);
    }

    static getPath(p: PointedBy) : string { return p.source.substring(0, p.source.lastIndexOf(".")); }
    static getLastKey(p: PointedBy) : string { return p.source.substring(p.source.lastIndexOf(".")); }
    static getPathArr(p: PointedBy) : string[] { return p.source.split('.'); }
    private constructor(source: string) {
        this.source = source;
    }
    // don't use modifiers here,
    static fromID<D extends DPointerTargetable>(ptr: Pointer<D>, field: keyof D & string, NoAccessModifiersHere?: never & ("-=" | "+=")) {
        return PointedBy.new("idlookup." + ptr + "." + field);
    }
    static new(source: DocString<"full path in store including key. like \'idlookup.id.extends+=\'">, modifier: "-=" | "+=" | undefined = undefined, action?: ParsedAction): PointedBy {
        // let source: DocString<"full path in store including key"> = action.path;
        // if (source.includes("true")) { console.error(this, action); throw new Error("mixed a bool"); }
        if (modifier && U.endsWith(source, modifier)) source = source.substring(0, source.length - (modifier?.length || 0));
        return new PointedBy(source);
    }
    // static new0<D extends DPointerTargetable> (source: D, field: keyof D): PointedBy { return new PointedBy(source, field); }



    public static remove(oldValue: Pointer | undefined, action: ParsedAction, state: DState, casee: "+=" | "-=" | undefined = undefined, oldState?:DState): DState {
        if (!oldValue) return state;
        let oldtarget: DPointerTargetable = state.idlookup[oldValue];
        if (!oldtarget) return state;
        let index = -1;
        let actionpath: string = action.path.substring(0, action.path.length -(casee?.length || 0))
        for (let i = 0; i < oldtarget.pointedBy.length; i++) { if (oldtarget.pointedBy[i].source === actionpath) { index = i; break; } }
        if (index < 0) return state;

        if (oldState === state) state = {...state} as DState;
        if (oldState?.idlookup === state.idlookup) state.idlookup = {...state.idlookup};
        if (oldState?.idlookup[oldValue] === state.idlookup[oldValue]) {
            state.idlookup[oldValue] = {...oldtarget} as any;
        }
        else {
            // no need
        }
        state.idlookup[oldValue].pointedBy.splice(index, 1) // in-place edit

        // console.warn('pointedby remove:', {from: oldtarget.pointedBy, to: state.idlookup[oldValue].pointedBy, obj: state.idlookup[oldValue], index, oldValue, actionpath});
        return state;
    }

    // important! must be called only in reducer
    public static add(pointed_val: Pointer | undefined, action: ParsedAction, state: DState, casee: "+=" | "-=" | undefined = undefined, oldState?:DState): DState {

        if (!Pointers.isPointer(pointed_val)) {
            // this is the case when the pointed element is not in the value, but in the key of a terminal part of the path,
            // like idlookup.viewid.subviews.subviewid = 5 (score);
            let newtargetptrarr: Pointer[] = (action.pathArray.filter(e => Pointers.isPointer(e)) as any);
            // Log.eDev(!newtargetptr, 'cannot find pointer in pointedby', {newtargetptr, action});
            if (newtargetptrarr.length < 2) return state;
            let pval: string = (newtargetptrarr as any).last();

            let len = pval.length;
            if (pval[len-1] === ']' &&  pval[len-2] === '[' ||
                pval[len-1] === '=' && (pval[len-2] === '-' || pval[len-2] === '+')) {
                pval = pval.substring(0, len-2);
            }
            pointed_val = pval;
        }
        if (!pointed_val) return state;

        // todo: if can't be done because newtarget doesn't exist, build an action from this and set it pending.
        let newtarget: DPointerTargetable = state.idlookup[pointed_val];
        if (!newtarget) {
            PendingPointedByPaths.new(action,state,pointed_val, casee).saveForLater(); // {from: action.path, field: action.field, to: target});
            return state;
        }
        /* simpler version but does unnecessary shallow copies
        state = {...state} as DState;
        state.idlookup = {...state.idlookup};
        state.idlookup[newtargetptr] = {...newtarget, pointedBy:  [...newtarget.pointedBy, PointedBy.new(action.path, casee)]} as any;*/
        if (oldState === state) state = {...state} as DState;
        if (oldState?.idlookup === state.idlookup) state.idlookup = {...state.idlookup};
        if (oldState?.idlookup[pointed_val] === newtarget) { state.idlookup[pointed_val] = {...newtarget} as any; }
        let newpb = PointedBy.new(action.path, casee);
        state.idlookup[pointed_val].pointedBy = [...newtarget.pointedBy, newpb];

        // console.warn('pointedby add:', {to: newtarget, from: state.idlookup[pointed_val], newpb, pby: state.idlookup[pointed_val].pointedBy});
        return state;
    }
}

class DerivedD{
    read: string;
    write: string;
    target: string[];
    constructor() {
        this.read = '';
        this.write = '';
        this.target = [];
    }
}
class DerivedL{
    read!: Function;
    write!: Function;
    target!: string[];
    constructor(target: string[], read: Function, write: Function) {
        this.target = target;
        this.read = read;
        this.write = write;
    }
}

type AnyPointer = Pointer<any>;

@RuntimeAccessible('LPointerTargetable')
export class LPointerTargetable<Context extends LogicContext<DPointerTargetable> = any, D extends DPointerTargetable = DPointerTargetable> extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public static structure: typeof DPointerTargetable;
    public static singleton: LPointerTargetable;
    public __raw!: D;
    public clonedCounter?: number;

    public __isProxy!: boolean;
    public __serialize!: DocString<"json">;
    private inspect!: D;
    private __random!: number;
    public __readonly!: boolean;
    public state!: any;
    public r!:any;

    private test(){
        let a: LPointerTargetable = null as any as LEnumLiteral;
        let c: LPointerTargetable = null as any as LParameter;
        let b: LPointerTargetable = null as any as LVertex;
    }
    // public r!: this;

    private __info_of__id = {type:"Pointer&lt;this&gt;",
        txt:"<a href=\"https://github.com/DamianoNaraku/jodel-react/wiki/identifiers\">" +
            "<span>Unique identifier, and value used to point this object.</span></a>"};

    private __info_of____readonly = {type:"boolean", txt:"prevent any change to the current object."};
    project!: LProject|null;
    protected get_project(c: GObject<Context>): LProject | null {
        return (LPointerTargetable.fromPointer(DUser.current) as LUser)?.project || null;
    }


    __info_of__getByFullPath: Info = {type:  'L | null', txt: 'follows a path until a target element starting from the root element (model, graph or viewpoint)'}
    __info_of__getByPath: Info = {type:  'L | null', txt: 'follows a path until a target element starting from the current element. check also: getByFullPath'}
    getByFullPath(path: string | string[]): L | null { return this.wrongAccessMessage('getByFullPath()'); }
    getByPath(path: string | string[]): L | null { return this.wrongAccessMessage('getByPath()'); }
    /*abstract*/ get_getByFullPath(c: Context): this['getByFullPath']{ return this.wrongAccessMessage('LPointer.getByFullPath')}
    get_getByPath(c: Context): this['getByFullPath'] {
        return (path: string | string[]) => {
            let arr: string[] = typeof path === 'string' ? path.split('.') : (Array.isArray(path) ? path : []);
            let curr: GObject<L> = c.proxyObject;
            if (!arr.length) return curr;
            curr = curr[arr[0]];
            if (!curr || arr.length === 1) return curr;
            arr.splice(0, 1);
            return curr.getByFullPath(arr);
        }
    }

    protected set___readonly(val: any, c: Context): boolean {
        val = !!val;
        let thiss: GObject = this;
        let childrens = (thiss.get_children && thiss.get_children(c)) || [];
        let annotations = (thiss.get_annotations && thiss.get_annotations(c)) || [];
        if (val === c.data.__readonly) return true;
        TRANSACTION('readonly ' + + this.get_name(c), ()=>{
            for (let c of childrens) { c.__readonly = val; }
            for (let c of annotations) { c.__readonly = val; }
            SetFieldAction.new(c.data, '__readonly', val);
        }, val, !val);
        return true;
    }

    /*protected derivedMap!: Dictionary<DocString<"propertyName">, DerivedL>;*/
    /*protected*/ __info_of__derivedMap: Info = {type: 'Dictionary<propertyName, {read: function, write: function}>', txt:'todo'}

    get_derivedMap(c: Context): LPointerTargetable["derivedMap"] {
        let map: Dictionary<DocString<"propertyName">, DerivedL> = (c.data.derivedMap ? {...c.data.derivedMap} : {}) as GObject;
        for (let k in map) {
            if (!map[k] || !map[k].target?.length) { delete map[k]; continue; }
            map[k] = new DerivedL(map[k].target, ()=>'Derived attributes todo', ()=>'Derived attributes todo');
        }
        return map as GObject;
    }

    protected setderivedMap(val0: this["derivedMap"] & GObject, c: Context): boolean {
        let val: GObject = val0 || {};
        if (!Object.keys(val).length) return true;
        TRANSACTION('update derived expressions on ' + this.get_name(c), ()=>{
            SetFieldAction.new(c.data.id, 'derivedMap', val, '+=');
        })
        return true;
    }


    public pointedBy!: PointedBy[];
    // pointedBy!: LPointerTargetable[];
    get_pointedBy(context: Context): LPointerTargetable["pointedBy"] {
        let state: DState = store.getState();
        let targeting: LPointerTargetable[] = LPointerTargetable.fromArr(context.data.pointedBy.map( p => {
            let s: GObject = state;
            for (let key of PointedBy.getPathArr(p)) {
                s = s[key];
                if (!s) return null;
                if (s.className) return s.id;
            }
        }));
        return targeting as any;
    }

    private _jjdependencies!: Dependency[]; // used in delete to find all objects referencing this, not meant to be used by users.
    public get__jjdependencies(context: any): Dependency[] {
        const data = context.data;
        const dependencies: Dependency[] = [];
        let s = store.getState();
        for (let pointedBy of data.pointedBy) {
            let pbyString = pointedBy.source;
            const pathArr: string[] = pbyString.split('.');
            let lastKey = pathArr[pathArr.length-1];
            switch (pbyString.substring(pbyString.length - 2)){
                default: break;
                case '-=':
                case '+=':
                case '[]': pbyString = pbyString.substring(0, pbyString.length - 2); break;
            }
            let firstKey = pathArr[0];
            let ptr = pathArr.find(e=>Pointers.isPointer(e));
            let followPath = U.followPath(s, pathArr); // it should be either: a Pointer, array of pointers, object with Pointers as keys
            let lastVal = followPath.lastval;
            let isArr = Array.isArray(lastVal);
            let arrIndex: number = Number.NaN;
            if (U.isNumber(+lastKey)) {
                arrIndex = (+lastKey as number);
                lastKey = pathArr[pathArr.length-2];
                // Log.eDev(U.isNumber(arrIndex), 'unexpected index in pointedBy: ', {arrIndex, pointedBy, context});
            }
            let lastValArr: Pointer[];
            if (!lastVal) {
                // was deleted?
                continue;
            }
            else if (isArr) {
                lastValArr = lastVal;
            }
            else if (typeof lastVal === 'object') {
                Log.eDevv('unexpected pointedBy case ending with an object, still not supported', {lastVal, pointedBy, context});
                continue;
            }
            else {
                lastValArr = [lastVal];
            }
            for (let v of lastValArr){
                // if (!v || Pointer.isPointer(v)) continue;
                if (v !== context.data.id) continue;
                const dependency: Dependency = {firstKey: firstKey as keyof DState, lastKey: lastKey as keyof DPointerTargetable,
                    lastVal, isArr, arrIndex: +(arrIndex as any), obj: ptr, pathArr, pointedBy, path: pbyString};
                dependencies.push(dependency);
            }
        }
        return dependencies;
    }

    name!:string;
    protected get_name(c: Context): this["name"] {
        let nameattribute = (c.proxyObject as any).$name;
        let ret: string = undefined as any;
        if (nameattribute && nameattribute.className === 'LValue') {
            ret = nameattribute.value;
        }
        if (ret === undefined) ret = c.data.name || c.data.className;
        return ret;
    }

    protected set_name(val: this["name"], c: Context): boolean {
        let name = val;
        const father: LPointerTargetable = (c.proxyObject as LModelElement).father;
        if (father) {
            const check = (father as LModelElement).children?.filter((child) => {
                return (D.fromPointer(child.id) as DNamedElement).name === name;
            });
            if (check.length > 0) {
                U.alert('e', 'Cannot rename the selected element since this name is already taken.');
                return true;
            }
        }

        TRANSACTION(this.get_name(c)+'.name', ()=>{
            let nameattribute = (c.proxyObject as any).$name;
            if (nameattribute && nameattribute.className === 'LValue') {
                nameattribute.value = val;
            }
            SetFieldAction.new(c.data, 'name', name, '', false);
        }, undefined, val)
        return true;
    }


    fullname!:string;
    protected get_fullname(c: Context): this["name"] { return this.get_name(c); } // fallback

    protected wrongAccessMessage(str: string): any {
        let msg = "Method "+str+" should not be called directly, attempting to do so should trigger get_"+str+"(). This is only a signature for type checking.";
        Log.ex(true, msg);
        throw new Error(msg); }

    public toString(): string { throw this.wrongAccessMessage("toString"); }
    protected get_toString(context: Context): () => string {
        const data = context.data as DNamedElement;
        return () => ( data.name || data.className.substring(0));
        // return () => data.id;
    }
    public toPrimitive(): string { throw this.wrongAccessMessage("toPrimitive"); }
    protected get_toPrimitive(c: Context): ((hint?: "number" | "string" | "default" ) => (number | string)) {
        return (hint?: "number" | "string" | "default") => {
            switch (hint){
                default:
                case "number":
                    return c.data.clonedCounter || -1;
                case "string":
                case "default":
                    return this.get_toString(c)();
            }
        }
    }


    protected cannotSet(field: string, msg?:string): any { return Log.exx('"' + field + '" field is read-only.' + (msg ? '\n'+msg : '')); }
    protected get_id(context: Context): this["id"] { return context.data.id; }
    protected set_id(): boolean { return this.cannotSet('id'); }

    protected _get_default< DD extends DPointerTargetable, T extends string & keyof (DD) & keyof (L), L extends LModelElement = LModelElement>(data: DD, key: T): L[T]{
        // @ts-ignore
        return LPointerTargetable.from(data[key]);
    }

    __info_of___clearState = {type:"()=>void", txt: `<div>Clears the whole content of this.state</div>`}
    clearState(): void { return this.wrongAccessMessage('clearState'); }
    get_clearState(c: Context): ()=>void {
        return () => {
            TRANSACTION(this.get_name(c) + '.clearState()', ()=>{
                SetFieldAction.new(c.data, "_state", {}, undefined, false);
            }, Object.keys(c.data._state)+ 'keys removed');
        }
    }

    _state!: GObject;
    __info_of___state = {type:"GObject", txt: `<div>A space where the user can store informations for their operations/views.<br/>
Example: The Validation viewpoint uses it to store validation messages through onDataUpdate events, check them for live examples.<br/>
values are set in a http patch approach, <code>this.state = {varname: "value"}<br/>
will set this.state.varname without changing other pre-existing values.<br/>
as such <code>this.state = {}</code> does nothing. to remove a single entry use<br/>
To remove a single entry, use <code>this.state = {varname: undefined}</code>.<br/>
To empty the whole state, use <code>this.clearState()</code>.<br/>
WARNING! do not set proxies in the state, set pointers instead.<br/>
<a href='https://github.com/MDEGroup/jjodel/wiki/L%E2%80%90Object-state'>Learn more on the wiki</a></div>`};

    // get__state(c: Context): any { return this.wrongAccessMessage('_state',', use obj.state instead.'); }
    // set__state(val: this["_state"], c: Context): boolean { return this.cannotSet('_state', 'use obj.state instead.'); }
    get_state(context: any): any /*this['_state']*/ {
        if (!context.data._state) return {};
        return this.__shallowSolver(context.data._state, true, true); // to solve pointers in state
        // return LPointerTargetable.wrap(context.data._state); // this should work, because data._state have id = this.id+"._state"
    }
    set_state(val: any, c: Context): boolean {
        // todo: put those lobjects -> pointer checks into defaultsetter to improve it

        // 3 options:
        // 1) if state === node, then setting whole state is invalid
        // 2) if state is a proxified obj with id = node.id+".state" so actions and proxy getters/setters will act on the subobject properties still invalid setting whole obj.
        // 3) forbid to set the whole state, merge old state with new one, if val === undefined, state is reset.

        // i choose 3)
        let newState: GObject;
        let removedState: GObject = {};
        let oldState = c.data._state ? {...c.data._state} : {};
        let changed: boolean = false;
        if (val === undefined) {
            if (!oldState || !Object.keys(oldState).length) return true;
            newState = {};
            changed = false;
        }
        else if (typeof val !== "object") { Log.ee("state can only be assigned with an object or undefined"); return true; }
        else {
            val = this.__sanitizeValue(val || {}); // ||{} to handle null which is typed as object in js
            newState = {}; // {...oldState};
            for (let k in val) {
                if (val[k] === undefined) {
                    if (!(k in oldState)) {
                        // newState[k] = undefined; reducer is ignoring undefined anyway, so i would need to set the whole obj instead of a delta or changing reducer.
                        continue;
                    }
                    // delete newState[k];
                    removedState[k] = true; // will be deleted by reducer
                    changed = true;
                    continue;
                }

                if (oldState[k] === val[k]) continue;
                newState[k] = val[k];
                changed = true;
            }
        }

        if (!changed) return true;

        TRANSACTION(this.get_name(c)+'.state', ()=>{
            if (Object.keys(newState)) SetFieldAction.new(c.data, "_state", newState, '+=', false);
            if (Object.keys(removedState)) SetFieldAction.new(c.data, "_state", removedState as any, '-=', false);
        })
        return true;
    }
    protected __sanitizeValue(val: any, canEditVal: boolean = true, canEditValDeep:boolean = false): any{
        if (!val) { return val; }
        let className = val.className;
        if ((val.__isProxy || val.id && className)
            && !RuntimeAccessibleClass.extends(className, IPoint.cname)
            && !RuntimeAccessibleClass.extends(className, ISize.cname)) {
            return val.id;
        }
        // if (typeof val === "string") { return val; } else
        if (typeof val !== "object") { return val; }
        else if (Array.isArray(val)) { return val.map(v => this.__sanitizeValue(v, canEditValDeep, canEditValDeep)); }
        // case val is object not array, not proxy, not D. just a POJO
        let ret = canEditVal ? val : {...val};
        for (let k in val) {
            if (Array.isArray(val[k])) ret[k] = val[k].map((v: any)=> v && (v.__isProxy || v.id && v.className) ? v.id : v);
            else if (val[k] && (val[k].__isProxy || val[k].id && val[k].className)) ret[k] = val[k].id;
        }
        return ret;
    }

    // protected _defaultCollectionGetter(c: Context, k: keyof Context["data"]): LPointerTargetable[] { return LPointerTargetable.fromPointer((c.data as any)[k]); }
    protected _defaultGetter(c: Context, k: keyof Context["data"]): any {
        return this.__defaultGetter(c, k);
    }
    protected _defaultSetter(v0: any, c: Context, k: keyof Context["data"]): boolean {
        this.__defaultSetter(v0, c, k);
        return true;
    }
    protected __defaultGetter(c: Context, k: keyof Context["data"]): any {
        // console.log("default Getter");
        let v = (c.data as any)[k];
        return this.__shallowSolver(v, true, false);
    }
    protected __shallowSolver<T>(val: any, solveArrayValues: boolean, solveObjectKeys: boolean): any {
        if (!val) return val;
        let state: DState = store.getState();
        if (solveArrayValues && Array.isArray(val)) {
            if (val.length === 0) return [];
            return val.map(v => LPointerTargetable.attemptWrap(v));
            // else if (Pointers.isPointer(val[0] as any)) return LPointerTargetable.fromArr(val, state);
            // return val;
        }
        if (solveObjectKeys && typeof val === "object"){
            let ret = {...val};
            for (let key in val){
                ret[key] = LPointerTargetable.attemptWrap(val[key]);
            }
            return ret;
        }
        return val && Pointers.isPointer(val as any, undefined) ? LPointerTargetable.fromPointer(val, state) : val;
    }

    protected __defaultSetter(v0: any, c: Context, k: keyof Context["data"]): boolean {
        // todo: get the those lobjects -> pointer checks from set_state
        let v: any = this.__sanitizeValue(v0, false, false);
        if (!k) return Log.exx('a key is mandatory for default setter', {v0, k, c});
        let isSymbol = typeof k === 'symbol';
        // if (isSymbol) return Log.exx('__defaultSetter, symbols are unsupported.', {v0, k, c});
        if (true || k in c.data) {
            // check if is pointer
            let isPointer: boolean;
            if (Array.isArray(v)) {
                if (v.length === 0) isPointer = true; // assumed, should not cause harm if it is not.
                    // it will delete remove an entry in pointedBy from all oldValue entries in the array that should not be present anyway.
                // like oldVal.map( id => U.arrayRemove(LData.wrap(id).pointedBy, c.data.this_id)
                else isPointer = v.some(p=>Pointers.isPointer(p)); //Pointers.isPointer(v[0] as any);
            } else isPointer = Pointers.isPointer(v);

            // autofix value
            let bytes = 0;
            let type: string = isSymbol ? '' : (this as any)["__info_of__"+(k as string)]?.type;
            if (type) type = U.multiReplaceAll(type, ["array", "Array", "<", ">", "[]"], []);
            switch(type){
                case ShortAttribETypes.EDate: break;
                default: break;
                case ShortAttribETypes.EBoolean: v = !!v; break;
                case ShortAttribETypes.EByte: bytes = 8; break;
                case ShortAttribETypes.EShort: bytes = 16; break;
                case ShortAttribETypes.EInt: bytes = 32; break;
                case ShortAttribETypes.ELong: bytes = 64; break;
                case ShortAttribETypes.EString: v = ""+v; break;
                case ShortAttribETypes.EChar: v = (""+v)[0]; break;
                case ShortAttribETypes.EVoid: Log.exx("cannot set a void-typed value", {c, d:c.data, k, v}); return true;
                case ShortAttribETypes.EDouble:
                case ShortAttribETypes.EFloat: v = +v; break;
            }
            if (bytes) {
                v = Math.round(+v);
                let max = v << bytes; // left shift is the same as multiplying by a power of 2, but binary and more efficient.
                let min = -max + 1
                if (v > max) v = max;
                else if (v < min) v = min;
            }
            console.log("default Setter["+k.toString()+"] = " + v , {type, v, v0, oldv:(c.data as any)[k], isPointer, c});

            let oldv = c.data[k as keyof DPointerTargetable];
            let newv = v;
            if (!U.isPrimitive(oldv)) oldv = undefined;
            if (!U.isPrimitive(newv)) newv = undefined;
            TRANSACTION(this.get_name(c)+'.'+(k.toString()), ()=>{
                let c2 = c as unknown as LogicContext2;
                if (c2.base) return SetFieldAction.new(c2.base, (c2.path ? c2.path+'.' : '') + (k as string) as any, v, '', isPointer);
                else SetFieldAction.new(c.data, k as any, v, '', isPointer);
            }, oldv, newv)
            return true;
        }
        return true;
    }

    public get__extends(superClassName: string, context: LogicContext<DPointerTargetable>): boolean {
        return RuntimeAccessibleClass.extends(context.data.className, superClassName);
    }

    /*
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
    }*/

    public set_pointedBy(val: never, context: LogicContext<DPointerTargetable>): boolean {
        windoww.Log.exx('pointedBy field should never be directly edited.', {context, val});
        return false;
    }




    static fromD<DX extends DPointerTargetable,
        LX = DX extends DEnumerator ? LEnumerator : (DX extends DAttribute ? LAttribute : (DX extends DReference ? LReference : (DX extends DRefEdge ? LRefEdge : (DX extends DExtEdge ? LExtEdge : (DX extends DDataType ? LDataType : (DX extends DClass ? LClass : (DX extends DStructuralFeature ? LStructuralFeature : (DX extends DParameter ? LParameter : (DX extends DOperation ? LOperation : (DX extends DEdge ? LEdge : (DX extends DEdgePoint ? LEdgePoint : (DX extends DGraphVertex ? LGraphVertex : (DX extends DModel ? LModel : (DX extends DValue ? LValue : (DX extends DObject ? LObject : (DX extends DEnumLiteral ? LEnumLiteral : (DX extends DPackage ? LPackage : (DX extends DClassifier ? LClassifier : (DX extends DTypedElement ? LTypedElement : (DX extends DVertex ? LVertex : (DX extends DVoidEdge ? LVoidEdge : (DX extends DVoidVertex ? LVoidVertex : (DX extends DGraph ? LGraph : (DX extends DNamedElement ? LNamedElement : (DX extends DAnnotation ? LAnnotation : (DX extends DGraphElement ? LGraphElement : (DX extends DMap ? LMap : (DX extends DModelElement ? LModelElement : (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (ERROR))))))))))))))))))))))))))))))),
        >(data: DX): LX;
    static fromD<DX extends DPointerTargetable,
        LX = DX extends DEnumerator ? LEnumerator : (DX extends DAttribute ? LAttribute : (DX extends DReference ? LReference : (DX extends DRefEdge ? LRefEdge : (DX extends DExtEdge ? LExtEdge : (DX extends DDataType ? LDataType : (DX extends DClass ? LClass : (DX extends DStructuralFeature ? LStructuralFeature : (DX extends DParameter ? LParameter : (DX extends DOperation ? LOperation : (DX extends DEdge ? LEdge : (DX extends DEdgePoint ? LEdgePoint : (DX extends DGraphVertex ? LGraphVertex : (DX extends DModel ? LModel : (DX extends DValue ? LValue : (DX extends DObject ? LObject : (DX extends DEnumLiteral ? LEnumLiteral : (DX extends DPackage ? LPackage : (DX extends DClassifier ? LClassifier : (DX extends DTypedElement ? LTypedElement : (DX extends DVertex ? LVertex : (DX extends DVoidEdge ? LVoidEdge : (DX extends DVoidVertex ? LVoidVertex : (DX extends DGraph ? LGraph : (DX extends DNamedElement ? LNamedElement : (DX extends DAnnotation ? LAnnotation : (DX extends DGraphElement ? LGraphElement : (DX extends DMap ? LMap : (DX extends DModelElement ? LModelElement : (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (ERROR))))))))))))))))))))))))))))))),
        >(data: DX[]): LX[];
    static fromD(data: any): any {
        // return null as any;
        if (Array.isArray(data)) return LPointerTargetable.wrapAll(data) as any;
        return LPointerTargetable.wrap(data) as any;
    }


    static fromPointer<
        T extends AnyPointer | AnyPointer[], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        DDD extends (T extends Pointer<any, any, any, infer D> ? D : 'undefined L'),
        LOW extends (T extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (T extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),

        DDDARR extends (T extends Pointer<any, any, any, infer D>[] ? D : 'undefined_DARR'),
        LOWARR extends (T extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (T extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),

        RET = UPPARR extends 'UP_is_N' ?
            (DDDARR[]) : // 0...N
            (UPP extends 1 ? (LOW extends 0 ? DDD | null : DDD) : // 0...1 && 1...1
                (LOW extends 1 ? DDD : undefined)  //1...1
                ),
        INFERRED = {ret: RET, upp: UPP, low:LOW, ddd: DDD, dddARR: DDDARR, lowARR: LOWARR, uppARR: UPPARR},>(ptr: T | T[] | undefined, state?: DState)
        : RET {
        // return null as any;
        if (Array.isArray(ptr)) return LPointerTargetable.wrapAll(ptr as any, undefined, '', false, state) as any;
        return LPointerTargetable.wrap(ptr) as any;
    }
    static fromArr(...a:any): any; // because otherwise it complains about inheriting from DPointerTargetable.fromArr
    static fromArr<
        PTR extends Pointer | Pointer[], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        // DDD extends (PTR extends Pointer<infer D> ? D : 'undefined_D'),
        LOW extends (PTR extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (PTR extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),
        DDD extends (PTR extends Pointer<any, number, any, infer LL> ? LL : 'undefined_L'),

        LOWARR extends (PTR extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (PTR extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),
        DDDARR extends (PTR extends Pointer<any, any, any, infer LL>[] ? LL : 'undefined_LARR'),

        DX extends DPointerTargetable,

        RETPTR = UPPARR extends 'UP_is_N' ?
            (DDDARR[]) : // 0...N
            (UPP extends 1 ? (LOW extends 0 ? DDD | null : DDD) : // 0...1 && 1...1
                (LOW extends 1 ? DDD : undefined)  //1...1
                ),

        // DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : ('ERROR'))))))))))))))))),
        LX = DX extends DEnumerator ? LEnumerator : (DX extends DAttribute ? LAttribute : (DX extends DReference ? LReference : (DX extends DRefEdge ? LRefEdge : (DX extends DExtEdge ? LExtEdge : (DX extends DDataType ? LDataType : (DX extends DClass ? LClass : (DX extends DStructuralFeature ? LStructuralFeature : (DX extends DParameter ? LParameter : (DX extends DOperation ? LOperation : (DX extends DEdge ? LEdge : (DX extends DEdgePoint ? LEdgePoint : (DX extends DGraphVertex ? LGraphVertex : (DX extends DModel ? LModel : (DX extends DValue ? LValue : (DX extends DObject ? LObject : (DX extends DEnumLiteral ? LEnumLiteral : (DX extends DPackage ? LPackage : (DX extends DClassifier ? LClassifier : (DX extends DTypedElement ? LTypedElement : (DX extends DVertex ? LVertex : (DX extends DVoidEdge ? LVoidEdge : (DX extends DVoidVertex ? LVoidVertex : (DX extends DGraph ? LGraph : (DX extends DNamedElement ? LNamedElement : (DX extends DAnnotation ? LAnnotation : (DX extends DGraphElement ? LGraphElement : (DX extends DMap ? LMap : (DX extends DModelElement ? LModelElement : (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (ERROR))))))))))))))))))))))))))))))),
        RET = LX extends 'ERROR' ? RETPTR : (RETPTR extends LX ? RETPTR : LX),
        INFERRED = {ret: RET, RETPTR: RETPTR, upp: UPP, low:LOW, ddd: DDD, dddARR: DDDARR, lowARR: LOWARR, uppARR: UPPARR, LX:LX, DX:DX}>(ptr: PTR[] | DX[], state?: DState)
        : RET[] {
        return LPointerTargetable.from(ptr as any, state); }

    static from<// LOW extends number, UPP extends number | 'N',
        PTR extends Pointer<DPointerTargetable, 0|1, 1|'N', LPointerTargetable> | Pointer[], // <DPointerTargetable, 1, 'N', LPointerTargetable>,
        // DDD extends (PTR extends Pointer<infer D> ? D : 'undefined_D'),
        LOW extends (PTR extends Pointer<any, infer LO> ? LO : 'undefined_upp'),
        UPP extends (PTR extends Pointer<any, number, infer UP> ? UP : 'undefined_low'),
        DDD extends (PTR extends Pointer<any, number, any, infer LL> ? LL : 'undefined_L'),

        LOWARR extends (PTR extends Pointer<any, infer LO>[] ? LO : 'undefined_uppARR'),
        UPPARR extends (PTR extends Pointer<any, number, infer UP>[] ? 'UP_is_N' : 'undefined_lowARR'),
        DDDARR extends (PTR extends Pointer<any, any, any, infer LL>[] ? LL : 'undefined_LARR'),

        DX extends DPointerTargetable,

        RETPTR = UPPARR extends 'UP_is_N' ?
            (DDDARR[]) : // 0...N
            (UPP extends 1 ? (LOW extends 0 ? DDD | null : DDD) : // 0...1 && 1...1
                (LOW extends 1 ? DDD : undefined)  //1...1
                ),


        // DX = LX extends LEnumerator ? DEnumerator : (LX extends LAttribute ? DAttribute : (LX extends LReference ? DReference : (LX extends LDataType ? DDataType : (LX extends LClass ? DClass : (LX extends LStructuralFeature ? DStructuralFeature : (LX extends LParameter ? DParameter : (LX extends LOperation ? DOperation : (LX extends LModel ? DModel : (LX extends LValue ? DValue : (LX extends LObject ? DObject : (LX extends LEnumLiteral ? DEnumLiteral : (LX extends LPackage ? DPackage : (LX extends LClassifier ? DClassifier : (LX extends LTypedElement ? DTypedElement : (LX extends LNamedElement ? DNamedElement : (LX extends LAnnotation ? DAnnotation : ('ERROR'))))))))))))))))),
        LX = DX extends DEnumerator ? LEnumerator : (DX extends DAttribute ? LAttribute : (DX extends DReference ? LReference : (DX extends DRefEdge ? LRefEdge : (DX extends DExtEdge ? LExtEdge : (DX extends DDataType ? LDataType : (DX extends DClass ? LClass : (DX extends DStructuralFeature ? LStructuralFeature : (DX extends DParameter ? LParameter : (DX extends DOperation ? LOperation : (DX extends DEdge ? LEdge : (DX extends DEdgePoint ? LEdgePoint : (DX extends DGraphVertex ? LGraphVertex : (DX extends DModel ? LModel : (DX extends DValue ? LValue : (DX extends DObject ? LObject : (DX extends DEnumLiteral ? LEnumLiteral : (DX extends DPackage ? LPackage : (DX extends DClassifier ? LClassifier : (DX extends DTypedElement ? LTypedElement : (DX extends DVertex ? LVertex : (DX extends DVoidEdge ? LVoidEdge : (DX extends DVoidVertex ? LVoidVertex : (DX extends DGraph ? LGraph : (DX extends DNamedElement ? LNamedElement : (DX extends DAnnotation ? LAnnotation : (DX extends DGraphElement ? LGraphElement : (DX extends DMap ? LMap : (DX extends DModelElement ? LModelElement : (DX extends DUser ? LUser : (DX extends DPointerTargetable ? LPointerTargetable : (ERROR))))))))))))))))))))))))))))))),
        RET = LX extends 'ERROR' ? RETPTR : (RETPTR extends LX ? RETPTR : LX),
        INFERRED = {ret: RET, RETPTR: RETPTR, upp: UPP, low:LOW, ddd: DDD, dddARR: DDDARR, lowARR: LOWARR, uppARR: UPPARR, LX:LX, DX:DX}>(ptr: PTR | DX, s?: DState)
        : RET {
        // return null as any;
        if (Array.isArray(ptr)) return LPointerTargetable.wrapAll(ptr) as any;
        return LPointerTargetable.wrap(ptr as any) as any;
    }

    // static from0(a: any, ...aa: any): any { return null; }

    /* OLD DELETE
    public delete(): void { throw this.wrongAccessMessage("delete"); }
    public _delete(context: Context): void { new DeleteElementAction(context.data); }
    protected get_delete(context: Context): () => void {
        return () => {
            alert("Delete in LPOINTER")
            this._delete(context);
        }
    }
    */
    /*
*/
    public delete(): void {}
    protected get_delete(c: Context): () => void {
        return ()=>TRANSACTION('delete '+this.get_name(c), Dummy.get_delete(this, c));
    }
}
RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, LPointerTargetable);

@RuntimeAccessible('D') export class D extends DPointerTargetable{}
@RuntimeAccessible('L') export class L extends LPointerTargetable{
    get_getByFullPath(c: any): this['getByFullPath'] { return this.wrongAccessMessage('L.getByFullPath'); }
}
@RuntimeAccessible('P') export class P extends Pointers{}

/*
let pttr: Pointer<DClassifier, 0, 1, LClassifier> = null as any;
let ptrany: Pointer<DClassifier, 0|1, 1|'N'>[] = null as any;
let ptrarr: Pointer<DClassifier>[] = null as any;
let ptrarr2: Pointer<DClassifier, 1, 'N'> = null as any;
let d: DClassifier = null as any;
let darr: DClassifier[] = null as any;

type VoidPtr = null | undefined | '';
function dfrom<
    PARAM extends orArr<AnyPointer | VoidPtr>,//orArr<WPointerTargetable | LPointerTargetable | DPointerTargetable | AnyPointer>,


    DDD extends (PARAM extends Pointer<infer DD> ? DD : 'undefined_D'),
    LOW extends (PARAM extends Pointer<any, infer LO> ? LO : 'undefined_low'),
    LOW0 extends (PARAM extends Pointer<any, 0, any, any> ? 0 : never),
    LOW1 extends (PARAM extends Pointer<any, 1, any, any> ? 1 : never),
    LOW2 extends (VoidPtr extends PARAM ? 0 | 'first' : (PARAM extends VoidPtr ? 0 | 1 | 'second': 1|'third')),
    UPP extends (PARAM extends Pointer<any, number, infer UP> ? UP : 'undefined_upp'),
    LLL extends (PARAM extends Pointer<any, number, any, infer LL> ? LL : 'undefined_L'),



    ISVOID extends PARAM extends VoidPtr  ? 'isvoid' : never,
    ISARR extends PARAM extends [] ? true : false,
    ISPTR extends (PARAM extends AnyPointer | VoidPtr ? 'ptr' : never),
    ISPTRARR extends (PARAM extends (AnyPointer | VoidPtr)[] | Pointer<DPointerTargetable, 1|0, 'N', LPointerTargetable> ? 'ptr_arr' : never),
    ISD extends (PARAM extends DPointerTargetable ? 'd' : never),
    ISDARR extends (PARAM extends DPointerTargetable[] ? 'd_arr' : never),
    ISL extends (PARAM extends LPointerTargetable ? 'l' : never),
    ISLARR extends (PARAM extends LPointerTargetable[] ? 'l_arr' : never),
    ISW extends (PARAM extends WPointerTargetable ? 'w' : never),
    ISWARR extends (PARAM extends WPointerTargetable[] ? 'w_arr' : never),
    // INFER = {LOW:LOW, UPP:UPP, DDD:DDD, LLL:LLL, LOW2:LOW2},
    INFER = { LOW2:LOW2},
    RET = ISVOID | ISPTR | ISPTRARR | ISD | ISDARR | ISL | ISLARR | ISW | ISWARR | INFER
    >
(ptr: PARAM): RET { return null as any; }
let Lptr = dfrom(pttr as Pointer<DClassifier, 0, 1, LClassifier> );
let Lptrany = dfrom(ptrany);
let Lptrarr = dfrom(ptrarr);
let Lptrarr2 = dfrom(ptrarr2);
let Ld = dfrom(d);
let Ldarr = dfrom(darr);*/







@RuntimeAccessible('WPointerTargetable')
export class WPointerTargetable extends DPointerTargetable{
    id!: never;
    _storePath!: never;
    _subMaps!: never;
    pointedBy!: never;
    // todo: WfromD, WfromL, WfromPointer, Wfrom

    static fromD<DX extends DPointerTargetable, WX extends DtoW<DX>>(data: DX): WX { return LPointerTargetable.fromD(data) as any; }
}
RuntimeAccessibleClass.set_extend(DPointerTargetable, LPointerTargetable);
RuntimeAccessibleClass.set_extend(DPointerTargetable, WPointerTargetable);
function fffff<DX, LX = DX extends DRefEdge ? LRefEdge : 'not'>( t: DX): LX { return null as any; }
let a: DGraphElement = null as any;
let bbb = LPointerTargetable.from(a);
let bb2 = fffff(a);

export class UserPointers {
    id!: Pointer<DUser>;
    projects!: Pointer<DProject, 0, 'N', LProject>;
    project!: Pointer<DProject, 0, 1, LProject>;
}

@Leaf
@RuntimeAccessible('DUser')
export class DUser extends DPointerTargetable {
    //public static offlineMode: boolean = !!localStorage.getItem("offlineMode");
    public static isStateMachine = false;
    // static current: Pointer<DUser> = 'Pointer_AnonymousUser';
    static current: Pointer<DUser> = undefined as any;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    id!: Pointer<DUser>;
    _Id?: string // db GUID
    name!: string;
    surname!: string;
    nickname!: string;
    country!: string;
    affiliation!: string;
    newsletter!: boolean;
    email!: string;
    token!: string;
    projects: Pointer<DProject, 0, 'N', LProject> = [];
    project: Pointer<DProject, 0, 1, LProject> = '';
    autoReport!: boolean;
    layout!: Dictionary<string, LayoutData>;
    autosaveLayout!: boolean;
    activeLayout!: string;
    __isDUser: true = true; // necessary to trick duck typing to think this is NOT the superclass of anything that extends PointerTargetable.


    /*public static new(id?: DUser["id"], triggerActions: boolean = true): DUser {
        return new Constructors(new DUser('dwc'), undefined, false, undefined, id, true).DPointerTargetable().DUser().end(); }*/
    public static new(name: string, surname: string, nickname: string, affiliation: string, country: string, newsletter: boolean, email: string,
                      token: string, id: DUser['id'], guid: string|undefined, persist: boolean = true, autoReport?:boolean): DUser {
        return new Constructors(new DUser('dwc'), undefined, persist, undefined, id).DPointerTargetable()
            .DUser(name, surname, nickname, affiliation, country, newsletter, email, token, autoReport, guid).end();
    }

    static new2(pointers: Partial<UserPointers>, callback: undefined | ((d: DUser, c: Constructors) => void), persist: boolean = true): DUser {
        return new Constructors(new DUser('dwc'), undefined, persist, undefined, pointers.id).DPointerTargetable()
            .DUser().end(callback);
    }
    /*
    static async loadOffline(): Promise<void> {
        if (DUser.current) return;
        const user = Storage.read<DUser>('user');
        if (user) {
            DUser.new(user.name, user.surname, user.nickname, user.affiliation, user.country, user.newsletter, user.email, user.token, user.id);
            DUser.current = user.id;
            statehistory[user.id] = new UserHistory();
        } else DUser.current = '';
    }*/

    static offline(allowOffline:boolean=true, allowOnline: boolean = false): DUser | null {
        let ptr: Pointer<DUser> = 'Pointer_OfflineUser';
        let isOffline = U.isOffline();
        if (!isOffline) allowOffline = false;
        let isValid = (d: DUser)=>{
            if (!d) return false;
            let savedUserIsOffline = d.id === ptr;
            if (savedUserIsOffline){
                if (!allowOffline) return false;
            } else if (!allowOnline) return false;
            return true;
        }

        let d: DUser = D.from(DUser.current);
        if (d && isValid(d)) return d;
        let state = store.getState();
        let timer: any = -1;
        let saveToState = ()=>{
            state = store.getState();
            if (!state) return;
            state.idlookup[d.id] = d;
            clearInterval(timer);
        }

        if (state){
            d = state.idlookup[ptr] as DUser;
            if (d && isValid(d)) return d;
        }

        d = Storage.read<DUser>('user') as DUser;
        if (d && isValid(d)) {
            if (state?.idlookup) saveToState(); //state.idlookup[d.id] = d;
            else {
                timer = setInterval(saveToState, 1);
            }
            return d;
        }

        if (!allowOffline) return null; // load offline user only if in offline mode
        d = DUser.new('Offline', 'User', 'Unknown', 'Unknown', 'Unknown', false, 'Unknown', 'Unknown', ptr, undefined);//`Pointer${Date.now()}_OfflineUser`);

        if (d && isValid(d)){
            Storage.write('user', d);
            return d as DUser;
        }

        return null;
    }

    static load(): DUser | null {
        return DUser.offline(true, true);
    }

    // public static fromPointer(ptr: any): DUser { return L.fromPointer(ptr) as DUser; }
}

@RuntimeAccessible('LUser')
export class LUser<Context extends LogicContext<DUser> = any, D extends DUser = DUser> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DUser;
    id!: Pointer<DUser>;
    _Id?: string // db GUID
    name!: string;
    surname!: string;
    nickname!: string;
    country!: string;
    affiliation!: string;
    newsletter!: boolean;
    email!: string;
    token!: string;
    projects!: LProject[];
    project!: LProject|null;
    autoReport!: boolean;
    __isLUser!: true;

    // public static fromPointer(ptr: Pointer<any>): LUser { return L.fromPointer(ptr) as LUser; }
    layout!: Dictionary<string, LayoutData>;
    autosaveLayout!: boolean;
    activeLayout!: string;

    public static getUser(): LUser{ return LUser.wrap(DUser.current) as LUSer; }

    get_activeLayout(c: Context): this['activeLayout'] { return c.data.activeLayout; }
    set_activeLayout(val: this['activeLayout'], c: Context): true {
        TRANSACTION('save user layout', ()=> {
            SetFieldAction.new(c.data.id, 'activeLayout', val, '', false);
            (windoww.UsersApi as typeof UsersApi).setActiveLayout(val);
        })
        return true;
    }
    get_layout(c: Context): this['layout'] { return c.data.layout; }
    set_layout(val: this['layout'], c: Context): true {
        if (!val) val = {};
        // else val = {...val};
        TRANSACTION('save user layout', ()=> {
            let removeKeys: Dictionary<string, any> = {};
            let persistance_val = {...c.data.layout};
            for (let k in val) {
                persistance_val[k] = val[k];
                if (!val[k] || typeof val[k] !== 'object') {
                    delete val[k];
                    delete persistance_val[k];
                    removeKeys[k] = true;
                }
            }
            SetFieldAction.new(c.data.id, 'layout', val, '+=', false);
            SetFieldAction.new(c.data.id, 'layout', removeKeys as any, '-=', false);
            (windoww.UsersApi as typeof UsersApi).setUserLayout(persistance_val);
        })
        return true;
    }
    get_autosaveLayout(c: Context): this['autosaveLayout'] {
        return c.data.autosaveLayout;
    }
    set_autosaveLayout(val: this['autosaveLayout'], c: Context): true {
        val = !!val;
        TRANSACTION('autosave user layout', ()=> {
            SetFieldAction.new(c.data.id, 'autosaveLayout', val, '', false);
            (windoww.UsersApi as typeof UsersApi).setUserAutosaveLayout(val);
        })
        return true;
    }

    protected get_name(context: Context): this['name'] {
        return context.data.name;
    }
    protected set_name(val: this['name'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.name', ()=>{
            SetFieldAction.new(c.data.id, 'name', val, '', false);
        }, undefined, val)
        return true;
    }

    protected get_surname(context: Context): this['surname'] {
        return context.data.surname;
    }
    protected set_surname(val: this['surname'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.surname', ()=>{
            SetFieldAction.new(c.data.id, 'surname', val, '', false);
        }, c.data.surname, val)
        return true;
    }

    protected get_nickname(context: Context): this['nickname'] {
        return context.data.nickname;
    }
    protected set_nickname(val: this['nickname'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.nickname', ()=>{
            SetFieldAction.new(c.data.id, 'nickname', val, '', false);
        }, c.data.nickname, val)
        return true;
    }

    protected get_affiliation(context: Context): this['affiliation'] {
        return context.data.affiliation;
    }
    protected set_affiliation(val: this['affiliation'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.affiliation', ()=>{
            SetFieldAction.new(c.data.id, 'affiliation', val, '', false);
        }, c.data.affiliation, val)
        return true;
    }

    protected get_country(context: Context): this['country'] {
        return context.data.country;
    }
    protected set_country(val: this['country'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.country', ()=>{
            SetFieldAction.new(c.data.id, 'country', val, '', false);
        }, c.data.country, val)
        return true;
    }

    protected get_newsletter(context: Context): this['newsletter'] {
        return context.data.newsletter;
    }
    protected set_newsletter(val: this['newsletter'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.newsletter', ()=>{
            SetFieldAction.new(c.data.id, 'newsletter', val, '', false);
        }, c.data.newsletter, val)
        return true;
    }

    protected get_email(context: Context): this['email'] {
        return context.data.email;
    }
    protected set_email(val: this['email'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.email', ()=>{
            SetFieldAction.new(c.data.id, 'email', val, '', false);
        }, c.data.email, val)
        return true;
    }

    protected get_token(context: Context): this['token'] {
        return context.data.token;
    }
    protected set_token(val: this['token'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.token', ()=>{
            SetFieldAction.new(c.data.id, 'token', val, '', false);
        }, c.data.token, val)
        return true;
    }

    protected get_projects(context: Context): this['projects'] {
        return (LProject.fromPointer(context.data.projects) as this['projects']).filter(p=>!!p);
    }
    protected set_projects(val: PackArr<this['projects']>, c: Context): boolean {
        let ptrs = Pointers.from(val)||[];
        TRANSACTION(this.get_name(c)+'.projects', ()=>{
            SetFieldAction.new(c.data.id, 'projects', ptrs, '', true);
        })
        return true;
    }

    protected get_project(context: Context): this['project'] {
        const project = context.data.project;
        return project && LProject.fromPointer(project) || null;
    }
    protected set_project(val: Pack<Exclude<this['project'], null>>|null, c: Context): boolean {
        let ptr: Pointer<DProject> = Pointers.from(val as any);
        if (!ptr) ptr = '';
        if (ptr === c.data.project) return true;

        TRANSACTION(this.get_name(c)+'.project', ()=>{
            SetFieldAction.new(c.data.id, 'project', ptr, '', true);
        })
        return true;
    }
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DUser);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LUser);
export type WUser = getWParams<LUser, DUser>;

export class ProjectPointers{
    id!: Pointer<DProject, 1, 1, LProject>;
    metamodels: Pointer<DModel, 0, 'N'> = [];
    models: Pointer<DModel, 0, 'N'> = [];
    graphs: Pointer<DGraph, 0, 'N'> = [];
    viewpoints: Pointer<DViewPoint, 0, 'N'> = [];
    activeViewpoint: Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0];
    favorite!: Dictionary<Pointer<DUser>, true | undefined>;
    author!: Pointer<DUser>;
}
@Leaf
@RuntimeAccessible('DProject')
export class DProject extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DProject, 1, 1, LProject>;
    _Id?: string // db GUID
    type: 'public'|'private'|'collaborative' = 'public';
    name!: string;
    author: Pointer<DUser> = DUser.current;
    collaborators: Pointer<DUser, 0, 'N'> = [];
    onlineUsers : number = 0;
    metamodels: Pointer<DModel, 0, 'N'> = [];
    models: Pointer<DModel, 0, 'N'> = [];
    graphs: Pointer<DGraph, 0, 'N'> = [];
    viewpoints: Pointer<DViewPoint, 0, 'N'> = [];
    activeViewpoint: Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0];
    /* come collaborators */favorite!: Dictionary<Pointer<DUser>, true | undefined>;


    description!: string;
    /* no */creation: number = Date.now();
    /* no */lastModified: number = Date.now();
    viewpointsNumber: number = 0;
    metamodelsNumber: number = 0;
    modelsNumber: number = 0;
    isFavorite: boolean = false; // o questo o favorite è obsoleto, todo
    layout!: Dictionary<string, LayoutData>;
    autosaveLayout!: boolean;
    activeLayout?: string;
    state!: string;
    version!: number;

    public static new(type: DProject['type'], name?: string, state?: DProject['state'],
                      m2?: DProject['metamodels'], m1?: DProject['models'], id?: DProject['id'], otherProjects?:LProject[]): DProject {

        // fix name
        if (!otherProjects) otherProjects = (LUser.fromPointer(DUser.current) as LUser).projects;
        if (!name) {
            // autofix default name
            let regexp = /Project (\d+)/;
            const matches = otherProjects.map(p=>(+(regexp.exec(p.name)?.[1] as any) || 0));
            let maxnum = Math.max(...matches, 0);
            name = 'Project ' + (1 + maxnum);
        }
        else {
            // autofix manually inputted name
            let allProjectNames: Dictionary<string, LProject> = U.objectFromArray(otherProjects, (p)=>p.name);
            name = U.increaseEndingNumber(name, false, false, (s)=>!!allProjectNames[s]);
        }

        return new Constructors(new DProject('dwc'), undefined, true, undefined)
            .DPointerTargetable().DProject(type, name, state || '', m2 || [], m1 || [], id).end(); }

    static new2(pointers: Partial<ProjectPointers>, callback: undefined | ((d: DProject, c: Constructors) => void), otherProjects?:LProject[], persist: boolean = true): DProject {
        let name = '';
        // fix name
        if (!otherProjects) otherProjects = (LUser.fromPointer(DUser.current) as LUser).projects;
        if (!name) {
            // autofix default name
            let regexp = /Project (\d+)/;
            const matches = otherProjects.map(p=>(+(regexp.exec(p.name)?.[1] as any) || 0));
            let maxnum = Math.max(...matches, 0);
            name = 'Project ' + (1 + maxnum);
        }

        return new Constructors(new DProject('dwc'), undefined, true, undefined)
            .DPointerTargetable().DProject('private', name, '', [], [], pointers.id).end(callback); }
}

@RuntimeAccessible('LProject')
export class LProject<Context extends LogicContext<DProject> = any, D extends DProject = DProject> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    readonly id!: Pointer<DProject>;
    _Id?: string // db GUID
    type!: 'public'|'private'|'collaborative';
    author!: LUser;
    collaborators!: LUser[];
    onlineUsers!: number;
    name!: string;
    metamodels!: LModel[];
    models!: LModel[];
    graphs!: LGraph[];
    // stackViews!: LViewElement[];
    viewpoints!: LViewPoint[];
    activeViewpoint!: LViewPoint;
    favorite!: boolean;

    description!: string;
    creation!: number;
    lastModified!: number;
    viewpointsNumber!: number;
    metamodelsNumber!: number;
    modelsNumber!: number;
    isFavorite!: boolean;

    // stringify state
    state!: string;
    version!: number;

    /* DATA */
    readonly packages!: LPackage[];
    readonly classes!: LClass[];
    readonly attributes!: LAttribute[];
    readonly references!: LReference[];
    readonly operations!: LOperation[];
    readonly parameters!: LParameter[];
    readonly enumerators!: LEnumerator[];
    readonly literals!: LEnumLiteral[];
    readonly objects!: LObject[];
    readonly values!: LValue[];

    /* NODES */
    readonly allNodes!: NodeTypes[];
    readonly graphVertexes!: LGraphVertex[];
    readonly voidVertexes!: LVoidVertex[];
    readonly vertexes!: LVertex[];
    readonly fields!: LGraphElement[];
    readonly edges!: LEdge[];
    readonly edgePoints!: LEdgePoint[];

    /* UTILS */
    readonly children!: LPointerTargetable[];
    readonly views!: LViewElement[]; // derived from viewpoints.subView


    layout!: Dictionary<string, LayoutData>;
    autosaveLayout!: boolean;
    activeLayout?: string;

    get_activeLayout(c: Context): this['activeLayout'] { return c.data.activeLayout; }
    set_activeLayout(val: this['activeLayout'], c: Context): true {
        TRANSACTION('save user layout', ()=> {
            SetFieldAction.new(c.data.id, 'activeLayout', val, '', false);
        })
        return true;
    }

    get_layout(c: Context): this['layout'] { return c.data.layout; }
    set_layout(val: this['layout'], c: Context): true {
        if (!val) val = {};
        // else val = {...val};
        TRANSACTION('save user layout', ()=> {
            let removeKeys: Dictionary<string, any> = {};
            let persistance_val = {...c.data.layout};
            for (let k in val) {
                persistance_val[k] = val[k];
                if (!val[k] || typeof val[k] !== 'object') {
                    delete val[k];
                    delete persistance_val[k];
                    removeKeys[k] = true;
                }
            }
            SetFieldAction.new(c.data.id, 'layout', val, '+=', false);
            SetFieldAction.new(c.data.id, 'layout', removeKeys as any, '-=', false);
        })
        return true;
    }
    get_autosaveLayout(c: Context): this['autosaveLayout'] { return c.data.autosaveLayout; }
    set_autosaveLayout(val: this['autosaveLayout'], c: Context): true {
        val = !!val;
        TRANSACTION('autosave user layout', ()=> {
            SetFieldAction.new(c.data.id, 'autosaveLayout', val, '', false);
            (windoww.UsersApi as typeof UsersApi).setUserAutosaveLayout(val);
        })
        return true;
    }
    /* Functions */

    protected get_description(context: Context): this['description'] {
        return context.data.description;
    }
    protected set_description(val: this['description'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.description', ()=>{
            SetFieldAction.new(c.data.id, 'description', val, '', false);
        }, c.data.description, val)
        return true;
    }

    protected get_creation(context: Context): this['creation'] {
        return context.data.creation;
    }
    protected set_creation(val: this['creation'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.creation', ()=>{
            SetFieldAction.new(c.data.id, 'creation', val, '', false);
        }, c.data.creation, val)
        return true;
    }

    protected get_lastModified(context: Context): this['lastModified'] {
        return context.data.lastModified;
    }
    protected set_lastModified(val: this['lastModified'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.lastModified', ()=>{
            SetFieldAction.new(c.data.id, 'lastModified', val, '', false);
        }, c.data.lastModified, val)
        return true;
    }

    protected get_viewpointsNumber(c: Context): this['viewpointsNumber'] {
        return c.data.viewpointsNumber;
    }
    protected set_viewpointsNumber(val: this['viewpointsNumber'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.viewpointsNumber', ()=>{
            SetFieldAction.new(c.data.id, 'viewpointsNumber', val, '', false);
        }, c.data.viewpointsNumber, val)
        return true;
    }

    protected get_metamodelsNumber(c: Context): this['metamodelsNumber'] {
        return c.data.metamodelsNumber;
    }
    protected set_metamodelsNumber(val: this['metamodelsNumber'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.metamodelsNumber', ()=>{
            SetFieldAction.new(c.data.id, 'metamodelsNumber', val, '', false);
        }, c.data.metamodelsNumber, val)
        return true;
    }

    protected get_modelsNumber(context: Context): this['modelsNumber'] {
        return context.data.modelsNumber;
    }
    protected set_modelsNumber(val: this['modelsNumber'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.modelsNumber', ()=>{
            SetFieldAction.new(c.data.id, 'modelsNumber', val, '', false);
        }, c.data.modelsNumber, val)
        return true;
    }

    protected get_isFavorite(context: Context): this['isFavorite'] {
        return context.data.isFavorite;
    }
    protected set_isFavorite(val: this['isFavorite'], context: Context): boolean {
        const data = context.data;
        return SetFieldAction.new(data.id, 'isFavorite', val, '', false);
    }

    protected get_favorite(c: Context): this['favorite'] {
        const uid = DUser.current;
        if (!c.data.favorite) return false;
        return !!c.data.favorite[uid];
    }
    protected set_favorite(v: boolean, c: Context): true {
        let favMap = c.data.favorite;
        const uid = DUser.current;
        v = !!v;
        if (!v && !favMap || v === favMap[uid]) return true;
        TRANSACTION(this.get_name(c)+'.favorite', ()=>{
            SetFieldAction.new(c.data.id, 'favorite', {[uid]: v ? true : undefined}, v ? '+=' : '-='); //!favMap ? '' : (v ? '+=' : '-=');
        }, !!favMap?.[uid], v)
        return true;
    }
    protected get_name(context: Context): this['name'] {
        return context.data.name;
    }
    protected set_name(val: this['name'], c: Context): boolean {
        if (c.data.name === val) return true;
        TRANSACTION(this.get_name(c)+'.name', ()=>{
            SetFieldAction.new(c.data.id, 'name', val, '', false);
        }, undefined, val)
        return true;
    }

    protected get_author(context: Context): this['author'] {
        return LUser.fromPointer(context.data.author);
    }
    protected set_author(val0: Pack<this['author']>, c: Context): boolean {
        let val: Pointer<LUser> = Pointers.from(val0) as any;
        TRANSACTION(this.get_name(c)+'.author', ()=> {
            SetFieldAction.new(c.data.id, 'author', val, '', true);
        })
        return true;
    }

    public get_state(context: Context): this['state'] {
        return context.data.state;
    }
    public set_state(val: this['state'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.state', ()=>{
            SetFieldAction.new(c.data.id, 'state', val, '', false);
        })
        return true;
    }

    protected get_collaborators(context: Context): this['collaborators'] {
        return LUser.fromPointer(context.data.collaborators) || [];
    }
    protected set_collaborators(val0: PackArr<this['collaborators']>, c: Context): boolean {
        let val: Pointer<LUser> = Pointers.from(val0) as any;
        TRANSACTION(this.get_name(c)+'.collaborators', ()=>{
            SetFieldAction.new(c.data.id, 'collaborators', val, '', true);
        })
        return true;
    }

    protected get_onlineUsers(context: Context): this['onlineUsers'] {
        return context.data.onlineUsers;
    }
    protected set_onlineUsers(val: this['onlineUsers'], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.onlineUsers', ()=>{
            SetFieldAction.new(c.data.id, 'onlineUsers', val, '', false);
        }, c.data.onlineUsers, val)
        return true;
    }

    protected get_metamodels(context: Context): this['metamodels'] {
        return LModel.fromPointer(context.data.metamodels) || [];
    }
    protected set_metamodels(val0: PackArr<this['metamodels']>, c: Context): boolean {
        let val = Pointers.from(val0);
        TRANSACTION(this.get_name(c)+'.metamodels', () => {
            SetFieldAction.new(c.data.id, 'metamodels', val, '', true);
        })
        return true;
    }

    protected get_models(c: Context): this['models'] {
        let ret = (L.fromPointer(c.data.models) || []).filter(e=>!!e) as LModel[];
        if (ret.length !== c.data.models.length) this.set_models(ret.map(e=>e.id) as any, c); // fix for older projects
        return ret;
    }
    protected set_models(val0: PackArr<this['models']>, c: Context): boolean {
        let val = Pointers.from(val0);
        TRANSACTION(this.get_name(c)+'.models', () => {
            SetFieldAction.new(c.data.id, 'models', val, '', true);
        })
        return true;
    }

    protected get_graphs(context: Context): this['graphs'] {
        return LGraph.fromPointer(context.data.graphs) || [];
    }
    protected set_graphs(val0: PackArr<this['graphs']>, c: Context): boolean {
        let val = Pointers.from(val0);
        TRANSACTION(this.get_name(c)+'.graphs', () => {
            SetFieldAction.new(c.data.id, 'graphs', val, '', true);
        })
        return true;
    }

    protected get_views(c: Context): this['views'] {
        // return LViewElement.fromPointer([...c.data.views, ...Defaults.views]);
        let duplicateRemover: Dictionary<Pointer, LViewElement> = {};
        let varr = this.get_viewpoints(c).flatMap(vp => vp.allSubViews);
        for (let v of varr) duplicateRemover[v.id] = v;
        return Object.values(duplicateRemover);
    }

    protected set_views(val: PackArr<this['views']>, context: Context): boolean {
        return Log.exx("cannot set project.views, set them as subviews of a project viewpoint.");
        /*
        const data = context.data;
        let ptrs = Pointers.from(val);
        let defaultViewsMap: Dictionary<Pointer, boolean> = U.objectFromArrayValues(Defaults.views);
        ptrs = ptrs.filter(ptr => !defaultViewsMap[ptr]);
        SetFieldAction.new(data.id, 'views', ptrs, '', true);
        return true;*/
    }
    /*
        protected get_stackViews(context: Context): this['stackViews'] {
            return LViewElement.fromPointer(context.data.stackViews || []);
        }
        protected set_stackViews(val: PackArr<this['stackViews']>, context: Context): boolean {
            const data = context.data;
            SetFieldAction.new(data.id, 'stackViews', Pointers.from(val), '', true);
            return true;
        }*/

    protected get_viewpoints(context: Context): this['viewpoints'] {
        return LViewPoint.fromPointer([...Defaults.viewpoints, ...(context.data.viewpoints || [])]);
    }
    protected set_viewpoints(val0: PackArr<this['viewpoints']>, c: Context): boolean {
        let val = Pointers.from(val0);
        TRANSACTION(this.get_name(c)+'.viewpoints', ()=>{
            SetFieldAction.new(c.data.id, 'viewpoints', val, '', true);
        })
        return true;
    }

    protected get_activeViewpoint(context: Context): this['activeViewpoint'] {
        return LViewPoint.fromPointer(context.data.activeViewpoint || Defaults.viewpoints[0]);
    }
    protected set_activeViewpoint(val0: Pack1<this['activeViewpoint']>, c: Context): boolean {
        let val = Pointers.from(val0);
        TRANSACTION(this.get_name(c)+'.activeViewpoint', ()=>{
            SetFieldAction.new(c.data.id, 'activeViewpoint', val, '', true);
        })
        return true;
    }

    /* DATA Getter */
    protected get_packages(c: Context): this['packages'] {
        const data = c.proxyObject as LProject;
        return data.metamodels.flatMap(m => m.allSubPackages);
    }
    protected get_classes(context: Context): this['classes'] {
        const data = context.proxyObject as LProject;
        return data.packages.flatMap(p => p.classes);
    }
    protected get_attributes(context: Context): this['attributes'] {
        const data = context.proxyObject as LProject;
        return data.classes.flatMap(c => c.attributes);
    }
    protected get_references(context: Context): this['references'] {
        const data = context.proxyObject as LProject;
        return data.classes.flatMap(c => c.references);
    }
    protected get_operations(context: Context): this['operations'] {
        const data = context.proxyObject as LProject;
        return data.classes.flatMap(c => c.operations);
    }
    protected get_parameters(context: Context): this['parameters'] {
        const data = context.proxyObject as LProject;
        return data.operations.flatMap(o => o.parameters);
    }
    protected get_enumerators(context: Context): this['enumerators'] {
        const data = context.proxyObject as LProject;
        return data.packages.flatMap(p => p.enumerators);
    }
    protected get_literals(context: Context): this['literals'] {
        const data = context.proxyObject as LProject;
        return data.enumerators.flatMap(e => e.literals);
    }
    protected get_objects(context: Context): this['objects'] {
        const data = context.proxyObject as LProject;
        return data.models.flatMap(m => m.allSubObjects);
    }
    protected get_values(context: Context): this['values'] {
        const data = context.proxyObject as LProject;
        return data.models.flatMap(m => m.allSubValues);
    }

    /* NODES Getter */
    protected get_allNodes(context: Context): this['allNodes'] {
        const data = context.proxyObject as LProject;
        const nodes: NodeTypes[] = [];
        // nodes.push(...(data.metamodels.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.packages.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.classes.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.attributes.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.references.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.operations.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.parameters.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.enumerators.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.literals.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        // nodes.push(...(data.models.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.objects.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        nodes.push(...(data.values.flatMap(m => m.node).filter(n => n !== undefined) as NodeTypes[]));
        return nodes;
    }
    protected get_graphVertexes(context: Context): this['graphVertexes'] {
        const data = context.proxyObject as LProject;
        return data.allNodes.filter(n => n.className === 'DGraphVertex') as LGraphVertex[];
    }
    protected get_voidVertexes(context: Context): this['voidVertexes'] {
        const data = context.proxyObject as LProject;
        return data.allNodes.filter(n => n.className === 'DVoidVertex') as LVoidVertex[];
    }
    protected get_vertexes(context: Context): this['vertexes'] {
        const data = context.proxyObject as LProject;
        return data.allNodes.filter(n => n.className === 'DVertex') as LVertex[];
    }
    protected get_fields(context: Context): this['fields'] {
        const data = context.proxyObject as LProject;
        return data.allNodes.filter(n => n.className === 'DGraphElement') as LGraphElement[];
    }
    protected get_edges(context: Context): this['edges'] {
        const data = context.proxyObject as LProject;
        return data.graphs.flatMap(g => g.subElements.filter(e => e.className === 'DEdge')) as LEdge[];
    }
    protected get_edgePoints(context: Context): this['edgePoints'] {
        const data = context.proxyObject as LProject;
        return data.edges.flatMap(e => e.subElements) as LEdgePoint[];
    }

    /* CUSTOM Functions */
    protected get_children(context: Context): this['children'] {
        const data = context.proxyObject as LProject;
        return [
            /* Data */
            ...data.metamodels,
            ...data.packages,
            ...data.classes,
            ...data.attributes,
            ...data.references,
            ...data.operations,
            ...data.parameters,
            ...data.enumerators,
            ...data.literals,
            ...data.models,
            ...data.objects,
            ...data.values,
            /* Views & Viewpoints */
            ...data.views.filter(v => v && !Defaults.views.includes(v.id)),
            ...data.viewpoints.filter(vp => vp && !Defaults.viewpoints.includes(vp.id)),
            /* Nodes */
            ...data.allNodes
        ];
    }

    /*
        public pushToStackViews(view: Pack<LViewElement>): void {
            throw new Error('cannot be called directly, should trigger getter. this is only for correct signature');
        }
        protected get_pushToStackViews(context: Context): (view: Pack<LViewElement>) => void {
            return (view) => {
                const data = context.data;
                SetFieldAction.new(data.id, 'stackViews', Pointers.from(view), ', true);
            }
        }
    /*
        public popFromStackViews(): void {
            throw new Error('cannot be called directly, should trigger getter. this is only for correct signature');
        }
        protected get_popFromStackViews(context: Context): () => void {
            return () => {
                const data = context.data;
                const view = data.stackViews?.at(-1);
                if(!view) return;
                SetFieldAction.new(data.id, 'stackViews', view as any, '-=', true);
            }
        }
    */
    public delete(): void {
        throw new Error('cannot be called directly, should trigger getter. this is only for correct signature');
    }
    protected get_delete(c: Context): () => void {
        const data = c.proxyObject as LProject;
        return () => {
            TRANSACTION('delete ' + this.get_name(c), ()=> {
                SetFieldAction.new(DUser.current, 'projects', c.data.id as any, '-=', true);
                DeleteElementAction.new(data.id);
                SetRootFieldAction.new('projects', c.data.id, '-=', true);

                // project can only be deleted in homepage, project list is not even present in editor state.
                // if (windoww.location.hasg.includes('project') windoww.location.href = windoww.location.origin; use R.navigate
            });
            let ProjectsApi: typeof TypeProjectsAPI = windoww.ProjectsApi;
            /* await */ProjectsApi.delete(data);
        }
    }

    duplicate(): LProject{ return this.wrongAccessMessage('LProject.duplicate()')};
    get_duplicate(c: Context): ()=>LProject{
        return () => {
            let clone: DProject = DProject.new(c.data.type, c.data.name + ' Copy');
            for (let key in c.data){
                switch (key){
                    case 'id':
                    case 'pointedBy':
                    case 'name':
                        continue;
                    default:
                        // @ts-ignore
                        clone[key] = c.data[key];
                        break;
            }
        }
        clone.author = DUser.current;
        clone.onlineUsers = 0;// i think this should not be a presistent data, but a fake attribute available only on LProject
        // todo per giordano: assign project to user & set persistent stuff with ProjectsAPI ?
        return LPointerTargetable.fromD(clone); }
    }
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DProject);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LProject);
export type WProject = getWParams<LProject, DProject>;


@RuntimeAccessible('MyError')
export class MyError extends Error {
    constructor(message?: string, ...otherMsg: any[]) {
        // 'Error' breaks prototype chain here
        super(message);
        const proto = (this as any).__proto__;

        console.error(proto.constructor.cname || proto.constructor.name, message, ...otherMsg);
        // restore prototype chain
        const actualProto = new.target.prototype;

        if (Object.setPrototypeOf) { Object.setPrototypeOf(this, actualProto); }
        else { (this as any).__proto__ = actualProto; }
        (this as any).className = (this.constructor as typeof RuntimeAccessibleClass).cname;
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
    public static isObject(data: GObject | any, returnIfNull: boolean = false): boolean { return data === null ? returnIfNull : typeof data === "object"; }
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
export function MixOnlyFuncs2<A1 extends any[], I1, S1, A2 extends any[], I2, S2>(c1: Class<A1, I1, S1> & typeof RuntimeAccessibleClass, c2: Class<A2, I2, S2> & typeof RuntimeAccessibleClass):
    Class<A1, I1, S1> & Class<A2, I2, S2>{
    return MixOnlyFuncs(c1, c2) as any;
}
export function MixOnlyFuncs3<A1 extends any[], I1, S1, A2 extends any[], I2, S2>(c1: Class<A1, I1, S1> & typeof RuntimeAccessibleClass, c2: Class<A2, I2, S2> & typeof RuntimeAccessibleClass):
    Class<A1&A2, I1&I2, S1&S2>{
    return MixOnlyFuncs(c1, c2) as any;
}
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
    let c1name = (c1.cname || c1.name) === 'classnameFixedConstructorDoNotRenameWithoutSearchStrings' ? c1.prototype.className : c1.cname || c1.name;
    let c2name = (c2.cname || c2.name) === 'classnameFixedConstructorDoNotRenameWithoutSearchStrings' ? c2.prototype.className : c2.cname || c2.name;
    // ret.prototype['superclass'] = {};
    // ret.prototype['superclass'][c1name] = c1.prototype.init_constructor || invalidSuperClassError(c1name, c1);
    // ret.prototype['superclass'][c2name] = c2.init_constructor || invalidSuperClassError(c2name, c2);
    ret.prototype['superclass1'] = {};
    ret.prototype['superclass2'] = {};
    ret.prototype['superclass1'][c1name] = c1.init_constructor || invalidSuperClassError(c1name, c1);
    ret.prototype['superclass2'][c2name] = c2.init_constructor || invalidSuperClassError(c2name, c2);
    return ret;
}
// console.info('ts loaded classes');











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
export type Pointer<T extends DPointerTargetable = DPointerTargetable, lowerbound extends number = 1, upperbound extends number|'N' = 1,
    RET extends LPointerTargetable = DtoL<T>> =
    upperbound extends 'N' ? NotAString<T, lowerbound, upperbound, RET>[] : (
        upperbound extends 0 ? never : (
            lowerbound extends 0 ? (NotAString<T, lowerbound, upperbound, RET> | null) : NotAString<T, upperbound, lowerbound, RET>));


export type PtrString = any; // to convert Pointers to strings more explicitly then using as any
// let ptr: Pointer<Object> = null as any;
/*
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
}*/

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

type subtractDL = subtract<D, L>;
* */



type subtract<P, C> = { [F in keyof P]: keyof C extends undefined ? undefined : P[F] };
type Exclude3<T, U> = T & {[T in keyof U]: never};
type Override<A, B> = Omit<A, keyof B> & B; //////////////////////////////////////////// best solution so far

type Exclude2<Type, field> = {
    [Property in keyof Type as Exclude<Property, keyof field>]: Type[Property]      /////////////////////////equally best solution
};


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



export type getWParams<L extends LPointerTargetable, D extends Object> ={
    // [Property in keyof ValidObj<L>]: L[Property] extends never ? never : L[Property]
    [Property in keyof L]:/*
            Property extends "opposite" ? LReference | DReference | Pointer<DReference> :
            Property extends "parent" ? LModelElement | DModelElement | Pointer<DModelElement> :
            Property extends "annotations" ? LAnnotation | DAnnotation | Pointer<DAnnotation> :*/
    (Property extends string ? (
        Property extends "id" ? 'id is read-only' :
            //@ts-ignore
            (L[`set_${Property}`] extends (a:any, b: any, ...b:any)=> any ? // at least 2 params: 1 for val and 1 for Context
                // if a set_ first parameter is Context it means the set_ is ill-defined, need to change actual method signature.
                //@ts-ignore
                Parameters<L[`set_${Property}`]>[0] // if set_X function is defined, get first param
                //@ts-ignore
                : never ///D[Property] | `todo: should define set_${Property}` // default type if it's not assigned = type in the D version
                )): never)
} // & L


export enum EGraphElements {
    "GraphElement"=  "GraphElement",
    "Field" ="GraphElement", // just an alias for now.
    "Vertex"= "Vertex",
    "todo" = "todo"
}
export enum EModelElements{
    // concrete m2
    "(m2) Model" = "DModel",
    "(m2) Package" = "DPackage",
    "(m2) Class" = "DClass",
    "(m2) Enum" = "DEnumerator",
    "(m2) Literal" = "DEnumLiteral",
    "(m2) Operation" = "DOperation",
    "(m2) Parameter" = "DParameter",
    "(m2) Attribute" = "DAttribute",
    "(m2) Reference" = "DReference",
    "(m2) Annotation" = "DAnnotation",
    // abstract m2
    "(abstract m2) Feature" = "DStructuralFeature",
    "(abstract m2) Classifier" = "DClassifier",
    // concrete m1
    "(m1) Object" = "DObject",
    "(m1) Value" = "DValue",
}

type ParserName = string;
export type LanguageObject = Dictionary<ParserName, {str:DocString<'parser code'>, test_text?: string}> & {engine: ParserName};

export class Language {
    m2t: LanguageObject;
    t2m: LanguageObject;
    edited: boolean;
    v: number;
    constructor(m2t: Partial<Language['m2t']> = {}, t2m: Partial<Language['t2m']> = {}) {
        this.t2m = t2m as any || {};// || m2t ? 'Not implemented, the m2t transformation will be unidirectional' : "Not implemented";
        this.m2t = m2t as any || {};
        if (!this.t2m.engine) this.t2m.engine = Object.keys(this.t2m)[0] || undefined as any;
        if (!this.m2t.engine) this.m2t.engine = Object.keys(this.m2t)[0] || undefined as any;
        this.edited = false;
        this.v = windoww.VersionFixer.get_highestversion();
    }
}


export class ViewEClassMatch {
    static NOT_EVALUATED_YET = undefined;
    static MISMATCH = Number.NEGATIVE_INFINITY;
    static MISMATCH_PRECONDITIONS = Number.NEGATIVE_INFINITY;
    static MISMATCH_JS = false;
    static MISMATCH_OCL = false;
    static IMPLICIT_MATCH = 1;
    static INHERITANCE_MATCH = 1.5;
    static EXACT_MATCH = 2;
    static VP_MISMATCH: number = Number.NEGATIVE_INFINITY;
    static VP_Default = 1;
    static VP_Decorative = 1;
    static VP_Explicit = 2;
}

export class ViewScore {
    viewPointMatch!: number;
    jsxOutput?: React.ReactNode | React.ReactElement | undefined;
    metaclassScore!: number;
    jsScore!: number | boolean;
    OCLScore!: boolean;
    finalScore!: number;
    usageDeclarations!: GObject;
    evalContext!: GObject; // with added usageDeclarations for the current view
    shouldUpdate!: boolean; // computed along usageDeclarations in shouldComponentUpdate
    shouldUpdate_reason!: GObject;
    nodeidcounter: Dictionary<number/*jsx char index*/, number/*counter:how many nodes generated by that jsx string line until now*/>
    jsxChanged!: boolean;
    constructor() {
        this.nodeidcounter = {};
    }

    // usageDeclarations!: DefaultUsageDeclarations;
    // oldNode: DGraphElement; moved to viewSorted_nodeused // ref to the actual node, not pointer. so even if it's modified through redux,
    // it is still possible to compare old version and new version to check if view.oclUpdateCondition should trigger
}
export type ViewScoreEntry = {element: Pointer<DViewElement>, score: number, view: LViewElement};

export class NodeTransientProperties{
    viewSorted_modelused?: LModelElement; // L-version because it is used in oclUpdate function
    viewSorted_pvid_used?: DViewElement;
    viewSorted_nodeused?: LGraphElement;
    stackViews!: LViewElement[]; // for each parentview, an array of Decorative Views[] sorted by score (including parent view influence).
    validMainViews!: LViewElement[]; // an array of Main Views[] sorted by score (including parent view influence).
    mainView!: LViewElement;
    viewScores: Dictionary<Pointer<DViewElement>, ViewScore> = {} as any;
    evalContext!: GObject; // global for this node (without view-specific usageDeclaration)
    needSorting!: boolean;
    longestLabel!: LVoidEdge['longestLabel'];
    labels!: LVoidEdge['labels'];
    src: any;
    //force1Update!: boolean;
    onDelete?: (node: LGraphElement)=>boolean; // return false to prevent deletion
    explicitView?: LViewElement;
    sizeHistory: { size: Partial<GraphSize>, time: number }[];
    constructor(){
        // this.stackViews = []; this.validMainViews = [];
        this.viewScores = {};
        this.src = U.getStackTrace();
        this.sizeHistory = [];
    }

    static sort(tn: NodeTransientProperties, pv: DViewElement | undefined, state0?: DState) {
        let state: DState = state0 || store.getState();
        let mainViews: ViewScoreEntry[] = [];
        let decorativeViews: ViewScoreEntry[] = [];
        for (let vid of Object.keys(tn.viewScores)) {
            let tnv = tn.viewScores[vid];
            const dview: DViewElement = DPointerTargetable.fromPointer(vid, state);
            if (!dview) console.error('missing view, is it an old save with less default views?', {dview, vid, state});
            if (!dview) continue;

            const score = tnv.finalScore = Selectors.getFinalScore(tnv, vid, pv, dview);
            if (!(score > 0)) continue; // do not flip to <=, because undefined and NEGATIVE_INFINITY always compute to false.
            (dview.isExclusiveView ? mainViews : decorativeViews).push( {element:vid, score, view: LPointerTargetable.fromD(dview)} );
        }
        decorativeViews.sort((s1, s2)=> s2.score - s1.score); // sorted from biggest to smallest
        mainViews.sort((s1, s2)=> s2.score - s1.score); // sorted from biggest to smallest

        // Log.exDev(!mainViews[0], 'cannot find a matching main view', {mainViews, decorativeViews, data0, scores: tn.viewScores})
        tn.mainView = mainViews[0]?.view;
        tn.validMainViews = mainViews.map((s)=> s.view); // this have duplicates of newly created elements
        tn.stackViews = decorativeViews.map((s)=> s.view);
        tn.needSorting = false;
    }
}
export class ViewTransientProperties {
    // css_MUST_RECOMPILE: boolean;
    // compiled_css: string; maye those are better shared in sessions
    events!: Dictionary<DocString<"functionName">, ((...a:any)=>any)>;
    oclChanged!: boolean;
    jsConditionChanged!: boolean;
    oclUpdateCondition_PARSED!: (oldData: LModelElement, newData:LModelElement) => boolean;// not used anymore? was like UD+shouldcompoupdate for jsx, a pre-ocl check
    oclEngine!: OclEngine;
    jsCondition!: undefined | ((context:GObject) => boolean);
    JSXFunction!: (scope: GObject)=>ReactNode;
    UDFunction!: (scope: GObject, ret: GObject)=>void;
    constantsList!: string[];
    UDList!: string[];
    constants!: GObject;
    onDataUpdate!: undefined | ((context:GObject)=>void);
    onDragStart!: undefined | ((context:GObject)=>void);
    onDragEnd!: undefined | ((context:GObject)=>void);
    whileDragging!: undefined | ((context:GObject)=>void);
    onResizeStart!: undefined | ((context:GObject)=>void);
    onResizeEnd!: undefined | ((context:GObject)=>void);
    whileResizing!: undefined | ((context:GObject)=>void);
    onRotationStart!: undefined | ((context:GObject)=>void);
    onRotationEnd!: undefined | ((context:GObject)=>void);
    whileRotating!: undefined | ((context:GObject)=>void);

    longestLabel!: LVoidEdge['longestLabel'];
    labels!: LVoidEdge['labels'];

    constructor(){
        this.events = {};
    }


}
export class DataTransientProperties {
    nodes!: Dictionary<Pointer<DGraphElement>, LGraphElement>;
    node?: LGraphElement;
    derived_read?: (data: LModelElement, originalValues: any[]) => any; // derived attributes and references
    derived_write?: (value:any, data:LModelElement, oldValue:any[]) => any; // derived attributes and references
    constructor(){
        this.nodes = {};
    }
}

// score for all view ocl + sorted views by best match
type TransientPropertiesByGraphTab = Dictionary<Pointer<DViewElement, number>> & {
    /*
    need_sorting: boolean;
    sorted: Pointer<DViewElement>[];
    // viewMatchings: Scored<DViewElement>[];
    when to update?
    1) data.parent.view.id: when "suviews" in place are changed by a view on a container element has changed (if pkg view changed, class view might change as well)
    2) data.any --> when a direct value of the doject changed, amd that value was declared in ocl
    3) view.appliableto --> when d-type changes (never, a class cannot become a enum or reference
    4) node stuff never? or maybe entire nodes?
    other data or view properties?*/
};
export const transientProperties = {
    node: {} as Dictionary<Pointer<DGraphElement>, NodeTransientProperties>,
    view: {} as Dictionary<Pointer<DViewElement>, ViewTransientProperties>,
    modelElement: {} as Dictionary<Pointer<DModelElement>, DataTransientProperties>,
};
(window as any).transient = (window as any).transientProperties = transientProperties;
// transientProperties.nodes[nid].viewScores[vid]?.[pvid as string];
/*
export const transientPropertiesByGraphTab: {viewMatchings: Dictionary<Pointer<DGraph>, Dictionary<Pointer<DModelElement>, TransientPropertiesByGraphTab>>} = {
 viewMatchings: {}
};*/
