import {
    DViewElement,
    DVoidVertex,
    IStore,
    LVoidVertex,
    Pointer,
    DPointerTargetable,
    store,
    U,
    DModel,
    RuntimeAccessible,
    GObject,
    LPointerTargetable,
    LModelElement,
    Log,
    LGraphElement,
    LViewElement,
    DModelElement, RuntimeAccessibleClass, DGraphElement, LModel, DGraph, MyProxyHandler, Selectorss
} from "../../joiner";

enum ViewEClassMatch { // this acts as a multiplier for explicit priority
    MISMATCH = 0,
    IMPLICIT_MATCH = 1,
    INHERITANCE_MATCH = 2,
    EXACT_MATCH = 3,
}

@RuntimeAccessible
export class Selectors{
    static getAllViewElements(): DViewElement[] {
        // return Object.values(store.getState().idlookup).filter(v => v.className === DViewElement.name) as DViewElement[];
        let state: IStore & GObject = store.getState();
        const ptrs: Pointer<DViewElement, 0, 'N'> = Object.values((state).viewelements);
        let views: DViewElement[] = ptrs.map<DViewElement>( (ptr) => state.idlookup[ptr] as DViewElement);
        return views;
    }

    static getVertex<W extends boolean = true, RP extends boolean = true>(wrap?: W /* = true */, resolvePointers?: RP /**/):
        W extends false ? (RP extends false ? Pointer<DVoidVertex, 1, 1, LVoidVertex>[] : DVoidVertex[]) : LVoidVertex[] {
        const state: IStore = store.getState();
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
        (Classe?: DT, condition?: (e:RET) => boolean, state?: IStore, resolvePointers?: RP /**/, wrap?: W /* = true */): RET[] {
        if (!state) state = store.getState();
        let GClass = (Classe as GObject) || {name:"idlookup"};
        console.warn('gclass:', GClass);
        const className: string = (GClass?.staticClassName || GClass.name).toLowerCase();
        const allIdByClassName: Pointer<D, 1, 1, L>[]
            = (state as GObject)[className]
            || (state as GObject)[className.substr(1)]
            || (state as GObject)[className + 's']
            || (state as GObject)[className.substr(1) + 's']
        Log.exDev(!allIdByClassName, 'cannot find store key:', {state, className, Classe});
        let allDByClassName: D[] | null = null;
        let allLByClassName: L[] | null = null;
        if (resolvePointers || wrap) {
            allDByClassName = allIdByClassName.map( (e) => (state as IStore).idlookup[e] ) as D[];
            if (wrap) {
                allLByClassName = allDByClassName.map( e => DPointerTargetable.wrap(e)) as any as L[];
            }
        }
        let ret: RET[] = (resolvePointers || wrap ? (wrap ? allLByClassName : allDByClassName) : allIdByClassName) as any[] as RET[];
        console.log('GetAll pre filter', ret);
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

    /*static getCurrentView(data: LModelElement): DViewElement {
        Log.exDevv('todo');
        return undefined as any;
    }*/
    // 2 = explicit exact match (===), 1 = matches a subclass, 0 = implicit match (any *), -1 = not matches
    private static matchesOclCondition(v: DViewElement, data: DModelElement): ViewEClassMatch.MISMATCH | ViewEClassMatch.IMPLICIT_MATCH | ViewEClassMatch.EXACT_MATCH {
      if (!v.oclApplyCondition) return ViewEClassMatch.IMPLICIT_MATCH;
      Log.exDevv('todo view ocl matching');
      return ViewEClassMatch.EXACT_MATCH;
    }

    private static matchesMetaClassTarget(v: DViewElement, data: DModelElement): ViewEClassMatch {
        if (!v.appliableToClasses || !v.appliableToClasses.length) return ViewEClassMatch.IMPLICIT_MATCH;
        let ThisClass: typeof DPointerTargetable = RuntimeAccessibleClass.get(data.className);
        Log.exDev(!ThisClass, 'unable to find class type:', {v, data});
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



    private static scoreView(v1: DViewElement, data: DModelElement, hisnode: DGraphElement, graph: LGraphElement, sameViewPointViews: Pointer<DViewElement, 1, 1>[] = []): number {
        // 1° priority: matching by EClass type
        let v1MatchingEClassScore: ViewEClassMatch = this.matchesMetaClassTarget(v1, data);
        Log.l('score view:', {v1, data, v1MatchingEClassScore});
        if (v1MatchingEClassScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
        // 2° priority: by ocl condition matching
        let v1OclScore = Selectors.matchesOclCondition(v1, data);
        if (v1OclScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
        // 3° priority by sub-view
        let v1SubViewScore = Selectors.matchesOclCondition(v1, data);
        if (v1SubViewScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
        // second priority: matching by viewpoint / subViews
        return (v1MatchingEClassScore * v1OclScore * v1SubViewScore) * v1.explicitApplicationPriority; }


    static getAppliedViews(data: LModelElement, hisnode: DGraphElement, graph: LGraphElement,
                           selectedViewId: Pointer<DViewElement, 0, 1, LViewElement>, parentViewId: Pointer<DViewElement, 0, 1, LViewElement>): Scored<DViewElement>[] {
        const state : IStore = store.getState();
        const allViews: DViewElement[] = [...Selectors.getAllViewElements()];
        const selectedView: DViewElement | null = null; // selectedViewId ? state.idlookup[selectedViewId] as DViewElement : null;
        const parentView: DViewElement | null = parentViewId ? state.idlookup[parentViewId] as DViewElement : null;
        const sameViewPointSubViews: Pointer<DViewElement, 1, 1>[] = parentView ? parentView.subViews : []; // a viewpoint is a simple view that is targeting a model
        if (selectedView) U.arrayRemoveAll(allViews, selectedView);
        let sortedPriority: Scored<DViewElement>[] = allViews.map(
            v => new Scored<DViewElement>(Selectors.scoreView(v, data as any as DModelElement, hisnode, graph, sameViewPointSubViews), v)) as Scored<DViewElement>[];
        sortedPriority.sort( (e1, e2) => e2.score - e1.score);
        // todo: prioritize views "childrens" of the view of the graph, so they will display differnet views for the same element in different graphs
        // then sort by  view selector matching: on classtype (eattribute, eoperation, eclass...), on values, upperbound...
        if (selectedView) sortedPriority = [new Scored<DViewElement>('manually assigned' as any, selectedView), ...sortedPriority];
        // sortedPriority = sortedPriority.map( s=> s.element) as any] : sortedPriority.map( s=> s.element) as any;

        // Log.exDevv('viewscores', {data, sp:sortedPriority});
        return sortedPriority;
    }

    static getAllMP(state?: IStore): DModelElement[] {
        if (!state) state = store.getState();
        let allD: DPointerTargetable[] = Object.values(state.idlookup);
        return allD.filter( (d: DPointerTargetable) => U.isObject(d) && Selectors.isOfSubclass(d, DModelElement)) as DModelElement[]; }

    static toObject<D extends DPointerTargetable>(ptrs: Pointer<D>[], state?: IStore):D[] {
        if (!state) state = store.getState();
        return ptrs.map(p => (state as IStore).idlookup[p]) as D[]; }

    static wrap<D extends DPointerTargetable, L extends LPointerTargetable>(arr: (Pointer<D, 1, 1, L> | D)[], state?: IStore): L[] {
        if (!arr.length) return [];
        if (!state) state = store.getState();
        let objarr: D[];
        if (typeof arr[0] === "string") { objarr = Selectors.toObject(arr as string[], state); }
        else objarr = arr as D[];
        return objarr.map(p => RuntimeAccessibleClass.wrap(p)) as L[]; }

    static unwrap<D extends DPointerTargetable, L extends LPointerTargetable>(arr:L[]): D[] { return arr.map( (a)=> a.__raw) as any[]; }
    static getSubNodeElements(forGraph: Pointer<DGraph, 1, 1>, asPointers: boolean = false, wrap: boolean = false): Pointer<DGraphElement>[] | DGraphElement[] | LGraphElement[] {
        const state : IStore = store.getState();
        const g: DGraph = state.idlookup[forGraph] as DGraph;
        if (asPointers) return g.subElements;
        const subelements: DGraphElement[] = g.subElements.map( geid => state.idlookup[geid]) as DGraphElement[];
        if (wrap) return subelements.map<LGraphElement>( (ge) => MyProxyHandler.wrap(ge));
        return subelements; }
}

class Scored<T extends GObject> {
    constructor(public score: number, public element: T) {}
}
