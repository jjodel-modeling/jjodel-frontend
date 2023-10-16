import type {
    DAttribute,
    DClass,
    DGraph,
    DClassifier,
    DEnumerator,
    DGraphElement,
    DRefEdge,
    DVoidVertex,
    GObject,
    DState,
    LClass,
    LEnumerator,
    LGraphElement,
    LOperation,
    LPackage,
    LRefEdge,
    LViewElement,
    LVoidVertex,
    Pointer,
} from "../../joiner";
import {
    AbstractConstructor,
    Constructor,
    LModelElement,
    DModel, LModel,
    DModelElement, DNamedElement, DObject,
    DPointerTargetable, DValue,
    DViewElement, LNamedElement, LObject,
    Log,
    LPointerTargetable, LValue,
    MyProxyHandler, OCL,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    store,
    U, windoww, Pointers, DViewPoint, LViewPoint, Dictionary, DUser, AttribETypes, ShortAttribETypes, toShortEType
} from "../../joiner";
import {EdgeOptions} from "../store";
import {DefaultEClasses, ShortDefaultEClasses, toShortEClass} from "../../common/U";

enum ViewEClassMatch { // this acts as a multiplier for explicit priority
    MISMATCH = 0,
    IMPLICIT_MATCH = 1,
    INHERITANCE_MATCH = 2,
    EXACT_MATCH = 3,
}

@RuntimeAccessible
export class Selectors{
    public static cname: string = "Selectors";

    static getSelectedOLD(): Pointer<DModelElement, 0, 1, LModelElement> {
        const state = store.getState();
        return state.selected;
    }

    static getRoom(): string {
        const state = store.getState();
        return state.room;
    }

    static getActiveModel(): null|LModel {
        let metamodel: null|LModel;
        let state: DState & GObject = store.getState();
        const selected = state._lastSelected?.modelElement;
        if(selected) {
            const me = LModelElement.fromPointer(selected)
            metamodel = (me) ? me.model : null;
        } else metamodel = null;
        return metamodel;
    }

    public static getLastSelectedModel<RET extends {m1?:LModel, m2?:LModel, model?:LModel, element?:LModelElement}>(state?: DState): RET {
        state = state || store.getState();
        let me = state._lastSelected?.modelElement;
        if (!me) return {} as RET;
        let ret: RET = {element: LPointerTargetable.fromPointer(me, state)} as RET;
        ret.model = ret.element!.model
        if (ret.model.isMetamodel) ret.m2 = ret.model;
        else {
            ret.m1 = ret.model;
            ret.m2 = ret.m1.instanceof;
        }
        return ret;
    }

    static getAllViewElements(): DViewElement[] {
        // return Object.values(store.getState().idlookup).filter(v => v.className === DViewElement.name) as DViewElement[];
        let state: DState & GObject = store.getState();
        const ptrs: Pointer<DViewElement, 0, 'N'> = Object.values((state).viewelements);
        let views: DViewElement[] = ptrs.map<DViewElement>( (ptr) => state.idlookup[ptr] as DViewElement);
        return views;
    }
    //Giordano: start

    public static getViewpoints() : LViewPoint[] {
        const state: DState & GObject = store.getState();
        return LViewPoint.fromPointer(state.viewpoints);
    }
    public static getViewpoint() : LViewPoint  {
        const state: DState & GObject = store.getState();
        return LViewPoint.fromPointer(state.viewpoint);
    }

    public static getObjects(): LObject[] {
        let state: DState & GObject = store.getState();
        const ptrs: Pointer<DObject, 0, 'N'> = Object.values((state).objects);
        const dObjects: DObject[] = ptrs.map<DObject>( (ptr) => state.idlookup[ptr] as DObject);
        const lObjects: LObject[] = [];
        for(let dObject of dObjects) {
            lObjects.push(LObject.fromPointer(dObject.id));
        }
        return lObjects;
    }
    public static getValues(): LValue[] {
        let state: DState & GObject = store.getState();
        const ptrs: Pointer<DValue, 0, 'N'> = Object.values((state).values);
        const dValues: DValue[] = ptrs.map<DValue>( (ptr) => state.idlookup[ptr] as DValue);
        const lValues: LValue[] = [];
        for(let dValue of dValues) {
            if(dValue?.id) {
                lValues.push(LValue.fromPointer(dValue.id));
            }
        }
        return lValues;
    }

    public static getDeleted(): string [] {
        const state: DState & GObject = store.getState();
        return state.deleted;
    }

    public static getState(): any {
        const state: DState & GObject = store.getState();
        return state;
    }

    static removeEdge(id: number): EdgeOptions[] {
        const state: DState & GObject = store.getState();
        const edges: EdgeOptions[] = [];
        for(let edge of state.edges) {
            if(edge.id !== id) {
                edges.push(edge);
            }
        }
        return edges;
    }

    static getDefaultEcoreClass(type: DefaultEClasses | ShortDefaultEClasses, state?: DState): DClassifier {
        let shorttype: string = (toShortEClass(type as any) || type).toUpperCase();
        if (!state) state = store.getState();
        // todo: make other m3 classes and make this generic like getPrimitiveType
        return state.idlookup["Pointer_"+ShortDefaultEClasses.EObject.toUpperCase()] as DClassifier;
    }
    static getPrimitiveType(type: AttribETypes | ShortAttribETypes, state?: DState): DClassifier {
        let shorttype: string = (toShortEType(type as any) || type).toUpperCase();
        if (!state) state = store.getState();
        return state.idlookup["Pointer_"+shorttype] as DClassifier;
    }
    static getAllPrimitiveTypes(): DClassifier[] {
        let state: DState & GObject = store.getState();
        const ptrs: Pointer<DClassifier, 0, 'N'> = Object.values((state).primitiveTypes);
        const classifiers: DClassifier[] = ptrs.map<DClassifier>( (ptr) => state.idlookup[ptr] as DClassifier);
        return classifiers;
    }
    static getFirstPrimitiveTypes(): DClassifier {
        return Selectors.getAllPrimitiveTypes()[0];
    }
    static getRefEdges(): DRefEdge[] {
        const state: DState & GObject = store.getState();
        const pointers: Pointer<DRefEdge, 0, 'N', LRefEdge> = Object.values((state).refEdges);
        const dRefEdges: DRefEdge[] = pointers.map<DRefEdge>( (ptr) => state.idlookup[ptr] as DRefEdge);
        return dRefEdges;
    }
    static getField(field: string): string[] {
        let state: DState & GObject = store.getState();
        const pointers: Pointer<DModelElement, 0, 'N'> = Object.values((state)[field]);
        return pointers;
    }

    static getAllAttributes(): string[] {
        const state: DState = store.getState();
        return Object.values((state).attributes);
    }
    static getAllEnumLiterals(): string[] {
        const state: DState = store.getState();
        return Object.values((state).enumliterals);
    }
    static getAllReferences(): string[] {
        const state: DState = store.getState();
        return Object.values((state).references);
    }
    static getAllReferenceEdges(): string[] {
        const state: DState = store.getState();
        return Object.values((state).refEdges);
    }
    static getAllClasses(): string[] {
        const state: DState = store.getState();
        return Object.values((state).classs);
    }
    static getReturnTypes(): LClass[] {
        const state: DState = store.getState();
        return LPointerTargetable.from(Object.values((state).returnTypes));
    }

    static getAllClassesWithoutPrimitive(): string[] {
        // this solution does not look good. what if a primitive type is inserted at runtime in between?
        // coould reach the same goal by taking all Classes of a model (m2), excluding classes from other models (types are classes from m3 model)
        const state: DState = store.getState();
        const classList: string[] = Object.values((state).classs);
        classList.splice(0, Selectors.getAllPrimitiveTypes().length);
        /* todo: need to change it in something like this once cross-references between models and instances are implemented
        const m2: LModel;
        m2.isInstanceOf = m3 as LModel;
        m2.isInstanceOf.classes;*/

        return classList;
    }

    static getAllEnumerators(flag = false): string[] {
        const state: DState = store.getState();
        return Object.values((state).enumerators);
    }
    static getAllPackages(): string[] {
        const state: DState = store.getState();
        return Object.values((state).packages);
    }

    static getAllParameters(): string[] {
        const state: DState = store.getState();
        return Object.values((state).parameters);
    }
    static getAllOperations(): string[] {
        const state: DState = store.getState();
        return Object.values((state).operations);
    }

    static getDElement<T extends DModelElement>(pointer: string): T {
        const state: DState & GObject = store.getState();
        const dElement: T = state.idlookup[pointer] as T;
        return dElement;
    }

    static getAllMetamodels(): LModel[] {
        const state: DState = store.getState();
        const dModels = Object.values((state).m2models);
        return LModel.fromPointer(dModels);
    }

    static getAllModels(): LModel[] {
        const state: DState = store.getState();
        const dModels = Object.values((state).m1models);
        return LModel.fromPointer(dModels);
    }

    //Giordano: end

    static getVertex<W extends boolean = true, RP extends boolean = true>(wrap?: W /* = true */, resolvePointers?: RP /**/):
        W extends false ? (RP extends false ? Pointer<DVoidVertex, 1, 1, LVoidVertex>[] : DVoidVertex[]) : LVoidVertex[] {
        const state: DState = store.getState();
        let ptrs: Pointer<DVoidVertex>[] = [];

        U.ArrayMerge0(false, ptrs,
            // Object.values(state.graphs || {}),
            Object.values(state.voidvertexs || {}),
            Object.values(state.vertexs || {}),
            Object.values(state.graphvertexs || {}),
            Object.values(state.edgepoints || {}));

        console.log('selector getvertex: ', {ptrs, g: Object.values(state.graphs || {}), vv:Object.values(state.voidvertexs || {}), v:Object.values(state.vertexs || {}), gv:Object.values(state.graphvertexs || {}), ep:Object.values(state.edgepoints || {})});
        if (wrap === undefined || wrap === true) return ptrs.map( p => DPointerTargetable.wrap(p)) as any[];
        if (resolvePointers === undefined || resolvePointers === true) return ptrs.map( r => state.idlookup[r]) as any[];
        return ptrs as any[];
    }

    static getAll<D extends DPointerTargetable, L extends LPointerTargetable, DT extends typeof DPointerTargetable = typeof DPointerTargetable,
        W extends undefined | true | false = false, RP extends undefined | true | false = true, RET = W extends false ? (RP extends false ? Pointer<D, 1, 1, L> : D) : L>
        (Classe?: DT, condition?: (e:RET) => boolean, state?: DState, resolvePointers?: RP /**/, wrap?: W /* = true */): RET[] {
        if (!state) state = store.getState();
        let GClass = (Classe as GObject) || {name:"idlookup", cname:"idlookup"};
        const className: string = (GClass?.staticClassName || GClass.cname).toLowerCase();
        const allIdByClassName: Pointer<D, 1, 1, L>[]
            = (state as GObject)[className]
            || (state as GObject)[className.substr(1)]
            || (state as GObject)[className + 's']
            || (state as GObject)[className.substr(1) + 's'];
        Log.exDev(!allIdByClassName, 'cannot find store key:', {state, className, Classe});
        let allDByClassName: D[] | null = null;
        let allLByClassName: L[] | null = null;
        if (resolvePointers || wrap) {
            allDByClassName = allIdByClassName.map( (e) => (state as DState).idlookup[e] ) as D[];
            if (wrap) {
                allLByClassName = allDByClassName.map( e => DPointerTargetable.wrap(e)) as any as L[];
            }
        }
        let ret: RET[] = (resolvePointers || wrap ? (wrap ? allLByClassName : allDByClassName) : allIdByClassName) as any[] as RET[];
        if (!Array.isArray(ret)) ret = Object.values(ret).filter(e => e instanceof Object) as RET[];
        if (condition) return ret.filter( e => condition(e));
        return ret;
    }
/*
    static getModels(condition?: (m: DModel) => boolean): DModel[] {
        /*
        const className: Pointer<DPointerTargetable, 1, 1> = DViewElement.name.substr(1).toLowerCase() + 's';
        const allByClassName: DPointerTargetable[] = state[className as string];
        let models: DModel[] = state[className as string].map((mid) => state.idlookup[mid as string]) as DModel[];
        if (condition) models = models.filter(condition);
        return models; * /
        return Selectors.getAll(DModel, undefined, undefined, resolvePointers, wrap); }*/

    static getModel(name: string, caseSensitive: boolean = false, wrap: boolean = false): DModel | LModel | null {
        if (!caseSensitive) name = name.toLowerCase();
        let ret = Selectors.getAll<DModel, LModel>(DModel, (d) => (caseSensitive ? d.name : d.name.toLowerCase()) === name, undefined, true, wrap as any)[0];
        return ret;
    }

    static getByName(classe: typeof DPointerTargetable, name: string, caseSensitive: boolean = false, wrap: boolean = false): DPointerTargetable | LPointerTargetable | null {
        return Selectors.getByField(classe, 'name', name, caseSensitive, wrap); }

    static getByField(classe: typeof DPointerTargetable, field: string, value: string, caseSensitive: boolean = false, wrap: boolean = false): DPointerTargetable | LPointerTargetable | null {
        if (!caseSensitive) value = value.toLowerCase();
        let condition = (d: any) => {
            let ret = (caseSensitive ? d[field] : d[field]?.toLowerCase()) === value;
            console.log('filtering getall by field:', {d, dfield:d[field], value, ret});
            return ret;
        }
        let ret = Selectors.getAll(classe, condition, undefined, true, wrap as any)[0];
        return ret; }

    static getViews(condition?: (m: DModel) => boolean): DViewElement[] { return Selectors.getAll(DViewElement); }



    private static queryJS(model: LModel, query: string): LPointerTargetable[] {
        try {
            return eval(query);
        } catch (e) { return []; }
    }
    /*static getCurrentView(data: LModelElement): DViewElement {
        Log.exDevv('todo');
        return undefined as any;
    }*/


    // 2 = explicit exact match (===), 1 = matches a subclass, 0 = implicit match (any *), -1 = not matches
    private static matchesOclCondition(v: DViewElement, data: DModelElement | LModelElement): ViewEClassMatch.MISMATCH | ViewEClassMatch.IMPLICIT_MATCH | ViewEClassMatch.EXACT_MATCH {
        if (!v.query) return ViewEClassMatch.MISMATCH;
        const query = v.query;
        const viewpoint = Selectors.getViewpoint();
        const isDefault = v.viewpoint === 'Pointer_DefaultViewPoint';
        const isActiveViewpoint = v.viewpoint === viewpoint.id;
        if(!isActiveViewpoint && !isDefault) return ViewEClassMatch.MISMATCH;
        let constructors: Constructor[] = RuntimeAccessibleClass.getAllClasses() as (Constructor|AbstractConstructor)[] as Constructor[];
        try {
            const flag = OCL.filter(false, "src", [data], query, constructors);
            if(flag.length > 0 && isActiveViewpoint) return ViewEClassMatch.EXACT_MATCH;
            if(flag.length > 0 && !isActiveViewpoint) return ViewEClassMatch.IMPLICIT_MATCH;
            return ViewEClassMatch.MISMATCH;
        } catch (e) { console.error('invalid ocl query'); }
        return ViewEClassMatch.MISMATCH;
    }


    private static matchesMetaClassTarget(v: DViewElement, data: DModelElement | DGraphElement): ViewEClassMatch {
        if (!v.appliableToClasses || !v.appliableToClasses.length) return ViewEClassMatch.IMPLICIT_MATCH;
        if (!data) return ViewEClassMatch.MISMATCH;
        let ThisClass: typeof DPointerTargetable = RuntimeAccessibleClass.get(data?.className);
        Log.exDev(!ThisClass, 'unable to find class type:', {v, data}); // todo: v = view appliable to DModel, data = proxy<LModel>
        let gotSubclassMatch: boolean = false;
        for (let classtarget of v.appliableToClasses) {
            const ClassTarget: typeof DPointerTargetable = RuntimeAccessibleClass.get(classtarget);
            if (ThisClass === ClassTarget) return ViewEClassMatch.EXACT_MATCH; // explicit exact match
            if (!gotSubclassMatch && U.classIsExtending(ThisClass, ClassTarget)) gotSubclassMatch = true; // explicit subclass match
            if (gotSubclassMatch) return ViewEClassMatch.INHERITANCE_MATCH;
        }
        return ViewEClassMatch.MISMATCH;
 }

    private static isOfSubclass(data: DPointerTargetable, classTarget: string | typeof DPointerTargetable, acceptEquality: boolean = false): boolean {
        let ThisClass: typeof DPointerTargetable = RuntimeAccessibleClass.get(data.className);
        Log.exDev(!ThisClass, 'isOfSubclass() unable to find class type:', {data});
        const ClassTarget: typeof DPointerTargetable = typeof classTarget === "string"? RuntimeAccessibleClass.get(classTarget) : classTarget;
        if (ThisClass === ClassTarget) return acceptEquality;
        return U.classIsExtending(ThisClass, ClassTarget);
    }



    private static scoreView(v1: DViewElement, data: LModelElement | undefined, node: LGraphElement | undefined, sameViewPointViews: Pointer<DViewElement, 1, 1>[] = []): number {
        let datascore: number = 1;
        let nodescore: number = 1;
        if (data) {// 1° priority: matching by EClass type
            let v1MatchingEClassScore: ViewEClassMatch = this.matchesMetaClassTarget(v1, data?.__raw);
            // Log.l('score view:', {v1, data, v1MatchingEClassScore});
            if (v1MatchingEClassScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // 2° priority: by ocl condition matching
            let v1OclScore = Selectors.matchesOclCondition(v1, data);
            if (v1OclScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // 3° priority by sub-view
            let v1SubViewScore = Selectors.matchesOclCondition(v1, data);
            if (v1SubViewScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // second priority: matching by viewpoint / subViews
            datascore = (v1MatchingEClassScore * v1OclScore * v1SubViewScore);
        }
        if (node){
            // 1° priority: matching by DGraphElement type
            let v1MatchingEClassScore: ViewEClassMatch = this.matchesMetaClassTarget(v1, node?.__raw);
            nodescore = 1; // todo: ocl by node position or other node info
        }
        return datascore * nodescore * v1.explicitApplicationPriority;
    }


    static getAppliedViews(data: LModelElement|undefined, hisnode: LGraphElement | undefined,
                           selectedViewId: Pointer<DViewElement, 0, 1, LViewElement>, parentViewId: Pointer<DViewElement, 0, 1, LViewElement>): Scored<DViewElement>[] {
        const state : DState = store.getState();
        const allViews: DViewElement[] = [...Selectors.getAllViewElements()];
        const selectedView: DViewElement | null = null; // selectedViewId ? state.idlookup[selectedViewId] as DViewElement : null;
        const parentView: DViewElement | null = parentViewId ? state.idlookup[parentViewId] as DViewElement : null;
        const sameViewPointSubViews: Pointer<DViewElement, 1, 1>[] = parentView ? parentView.subViews : []; // a viewpoint is a simple view that is targeting a model
        if (selectedView) U.arrayRemoveAll(allViews, selectedView);
        let sortedPriority: Scored<DViewElement>[] = allViews.map(
            // v => new Scored<DViewElement>(Selectors.scoreView(v, data as any as DModelElement, hisnode, graph, sameViewPointSubViews), v)) as Scored<DViewElement>[];
            (v) => {
                return new Scored<DViewElement>(Selectors.scoreView(v, data, hisnode, sameViewPointSubViews), v);}
        ) as Scored<DViewElement>[];
        sortedPriority.sort( (e1, e2) => e2.score - e1.score);
        // todo: prioritize views "children" of the view of the graph, so they will display differnet views for the same element in different graphs
        // then sort by  view selector matching: on classtype (eattribute, eoperation, eclass...), on values, upperbound...
        if (selectedView) sortedPriority = [new Scored<DViewElement>('manually assigned' as any, selectedView), ...sortedPriority];
        // sortedPriority = sortedPriority.map( s=> s.element) as any] : sortedPriority.map( s=> s.element) as any;

        // Log.exDevv('viewscores', {data, sp:sortedPriority});
        return sortedPriority;
    }

    static getAllMP(state?: DState): DModelElement[] {
        if (!state) state = store.getState();
        let allD: DPointerTargetable[] = Object.values(state.idlookup);
        return allD.filter( (d: DPointerTargetable) => U.isObject(d) && Selectors.isOfSubclass(d, DModelElement)) as DModelElement[]; }

    static toObject<D extends DPointerTargetable>(ptrs: Pointer<D>[], state?: DState):D[] {
        if (!state) state = store.getState();
        return ptrs.map(p => (state as DState).idlookup[p]) as D[]; }

    static wrap<D extends DPointerTargetable, L extends LPointerTargetable>(arr: (Pointer<D, 1, 1, L> | D)[], state?: DState): L[] {
        if (!arr.length) return [];
        if (!state) state = store.getState();
        let objarr: D[];
        if (typeof arr[0] === "string") { objarr = Selectors.toObject(arr as string[], state); }
        else objarr = arr as D[];
        return objarr.map(p => RuntimeAccessibleClass.wrap(p)) as L[]; }

    static unwrap<D extends DPointerTargetable, L extends LPointerTargetable>(arr:L[]): D[] { return arr.map( (a)=> a.__raw) as any[]; }
    static getSubNodeElements(forGraph: Pointer<DGraph, 1, 1>, asPointers: boolean = false, wrap: boolean = false): Pointer<DGraphElement>[] | DGraphElement[] | LGraphElement[] {
        const state : DState = store.getState();
        const g: DGraph = state.idlookup[forGraph] as DGraph;
        if (asPointers) return g.subElements;
        const subelements: DGraphElement[] = g.subElements.map( geid => state.idlookup[geid]) as DGraphElement[];
        if (wrap) return subelements.map<LGraphElement>( (ge) => MyProxyHandler.wrap(ge));
        return subelements; }




    //// giordano part



    public static getAllPackageClasses(id: string): LClass[] {
        const data = MyProxyHandler.wrap(id) as GObject;
        let lPackage : LPackage | undefined;
        const classes: LClass[] = [];
        if (data.className === "DReference") {
            const lClass: LClass = MyProxyHandler.wrap(data.father);
            lPackage = MyProxyHandler.wrap(lClass.father);
        }
        if (data.className === "DParameter") {
            const lOperation: LOperation = MyProxyHandler.wrap(data.father);
            const lClass: LClass = MyProxyHandler.wrap(lOperation.father);
            lPackage = MyProxyHandler.wrap(lClass.father);
        }
        if (data.className === "DOperation") {
            const lClass: LClass = MyProxyHandler.wrap(data.father);
            lPackage = MyProxyHandler.wrap(lClass.father);
        }
        if (lPackage) {
            for(let classifier of lPackage.classifiers) {
                const lClassifier: LClass | LEnumerator = MyProxyHandler.wrap(classifier);
                if(lClassifier.className === "DClass") classes.push(lClassifier as LClass);
            }
        }
        return classes;
    }
    public static getAllPackageEnumerators(id: string): LEnumerator[] {
        const data = MyProxyHandler.wrap(id) as GObject;
        let lPackage : LPackage | undefined;
        const enumerators: LEnumerator[] = [];
        if(data.className === "DAttribute") {
            const lClass: LClass = MyProxyHandler.wrap(data.father);
            lPackage = MyProxyHandler.wrap(lClass.father);
        }
        if(data.className === "DParameter") {
            const lOperation: LOperation = MyProxyHandler.wrap(data.father);
            const lClass: LClass = MyProxyHandler.wrap(lOperation.father);
            lPackage = MyProxyHandler.wrap(lClass.father);
        }
        if(data.className === "DOperation") {
            const lClass: LClass = MyProxyHandler.wrap(data.father);
            lPackage = MyProxyHandler.wrap(lClass.father);
        }
        if(lPackage) {
            for(let classifier of lPackage.classifiers) {
                const lClassifier: LClass | LEnumerator = MyProxyHandler.wrap(classifier);
                if(lClassifier.className === "DEnumerator") enumerators.push(lClassifier as LEnumerator);
            }
        }
        return enumerators;
    }
}

class Scored<T extends GObject> {
    constructor(public score: number, public element: T) {}
}
