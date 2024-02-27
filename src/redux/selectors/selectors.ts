import {
    AbstractConstructor,
    AttribETypes,
    Constructor,
    DAttribute,
    DClass,
    DClassifier,
    DEnumerator,
    DGraph,
    DGraphElement,
    DObject,
    DRefEdge,
    DState,
    DValue,
    DVoidVertex,
    GObject,
    LClass,
    LEnumerator,
    LGraphElement,
    LModel,
    LModelElement,
    LObject,
    LOperation,
    LPackage,
    LRefEdge,
    LValue,
    LViewElement,
    LViewPoint,
    LVoidVertex,
    Pointer,
    ShortAttribETypes,
    Dictionary,
    LUser,
    DUser,
    Defaults, LProject,
} from "../../joiner";
import {
    DViewElement,
    DPointerTargetable,
    DModel,
    DModelElement,
    OCL,
    Log,
    LPointerTargetable,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    store,
    U,
    toShortEType
} from "../../joiner";
import {DefaultEClasses, ShortDefaultEClasses, toShortEClass} from "../../common/U";
import { Selected } from "../../joiner/types";
import {NodeTransientProperties, transientProperties, ViewEClassMatch} from "../../joiner/classes";
import view from "../../components/rightbar/viewsEditor/View";
import {OclEngine} from "@stekoe/ocl.js";


@RuntimeAccessible('Selectors')
export class Selectors{

    static getActiveModel(): null|LModel {
        let metamodel: null|LModel;
        let state: DState & GObject = store.getState();
        const selected = state._lastSelected?.modelElement;
        if(selected) {
            const me = LPointerTargetable.fromPointer(selected)
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

    static getAllViewElements(state0?: DState): DViewElement[] {
        // return Object.values(store.getState().idlookup).filter(v => v.className === DViewElement.name) as DViewElement[];
        const state: GObject<DState> = state0 || store.getState();
        const ptrs: Pointer<DViewElement>[] = Object.values((state).viewelements);
        let views: DViewElement[] = ptrs.map<DViewElement>( (ptr) => DPointerTargetable.fromPointer(ptr, state) as DViewElement);
        return views;
    }
    //Giordano: start

    public static getViewpoints() : LViewPoint[] {
        const state: DState & GObject = store.getState();
        return LPointerTargetable.fromPointer(state.viewpoints);
    }
    public static getViewpoint() : LViewPoint {
        const state: DState & GObject = store.getState();
        return LPointerTargetable.fromPointer(state.viewpoint);
    }

    public static getObjects(): LObject[] {
        let state: DState & GObject = store.getState();
        const ptrs: Pointer<DObject, 0, 'N'> = Object.values((state).objects);
        const dObjects: DObject[] = ptrs.map<DObject>( (ptr) => state.idlookup[ptr] as DObject);
        const lObjects: LObject[] = [];
        for(let dObject of dObjects) {
            lObjects.push(LPointerTargetable.fromPointer(dObject.id));
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
                lValues.push(LPointerTargetable.fromPointer(dValue.id));
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
    // static getAllReferenceEdges(): string[] { const state: DState = store.getState(); return Object.values((state).refEdges); }
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
        return LPointerTargetable.fromPointer(dModels);
    }

    static getAllModels(): LModel[] {
        const state: DState = store.getState();
        const dModels = Object.values((state).m1models);
        return LPointerTargetable.fromPointer(dModels);
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

    static getViewIDs(condition?: (m: DModel) => boolean): Pointer<DViewElement>[] { return Selectors.getAll(DViewElement); }



    private static queryJS(model: LModel, query: string): LPointerTargetable[] {
        try {
            return eval(query);
        } catch (e) { return []; }
    }
    /*static getCurrentView(data: LModelElement): DViewElement {
        Log.exDevv('todo');
        return undefined as any;
    }*/

/*
    // 2 = explicit exact match (===), 1 = matches a subclass, 0 = implicit match (any *), -1 = not matches
    private static matchesOclCondition(v: DViewElement, data: DModelElement | LModelElement): ViewEClassMatch.MISMATCH | ViewEClassMatch.IMPLICIT_MATCH | ViewEClassMatch.EXACT_MATCH {
        if (!v.oclCondition) return ViewEClassMatch.MISMATCH;
        const oclCondition = v.oclCondition;
        const user: LUser = LUser.fromPointer(DUser.current); // todo: just avoid presenting invalid views to this function instead of wrapping and filtering inside.
        const project: LProject = user.project as LProject;
        const viewpoint = project.activeViewpoint;
        const isDefault = Defaults.check(v.id);
        const isActiveViewpoint = v.viewpoint === viewpoint.id;
        // console.log('allviews matcher ocl@@', {isDefault, data, dn:(data as any).name, oclCondition});
        if(!isActiveViewpoint && !isDefault) return ViewEClassMatch.MISMATCH;
        let constructors: Constructor[] = RuntimeAccessibleClass.getAllClasses() as (Constructor|AbstractConstructor)[] as Constructor[];
        try {
            const matches = OCL.filter(false, 'src', [data], oclCondition, constructors);
            //console.log('allviews matcher ocl##', {flag, data, dn:(data as any).name, oclCondition});
            if (matches.length > 0 && isActiveViewpoint) return ViewEClassMatch.EXACT_MATCH;
            if (matches.length > 0 && !isActiveViewpoint) return ViewEClassMatch.IMPLICIT_MATCH;
            return ViewEClassMatch.MISMATCH;
        } catch (e) { console.error('invalid ocl query'); }
        return ViewEClassMatch.MISMATCH;
    }

*/
    private static matchesMetaClassTarget(v: DViewElement, data?: DModelElement | DGraphElement | undefined): number {
        if (!v) return ViewEClassMatch.MISMATCH_PRECONDITIONS;
        if (!v.appliableToClasses || !v.appliableToClasses.length) return ViewEClassMatch.IMPLICIT_MATCH;
        if (!data) return ViewEClassMatch.MISMATCH_PRECONDITIONS;
        let ThisClass: typeof DPointerTargetable = RuntimeAccessibleClass.get(data.className);
        Log.exDev(!ThisClass, 'unable to find class type:', {v, data}); // todo: v = view appliable to DModel, data = proxy<LModel>
        let gotSubclassMatch: boolean = false;
        for (let classtarget of v.appliableToClasses) {
            const ClassTarget: typeof DPointerTargetable = RuntimeAccessibleClass.get(classtarget);
            if (ThisClass === ClassTarget) return ViewEClassMatch.EXACT_MATCH; // explicit exact match
            if (!gotSubclassMatch && U.classIsExtending(ThisClass, ClassTarget)) gotSubclassMatch = true; // explicit subclass match
            if (gotSubclassMatch) return ViewEClassMatch.INHERITANCE_MATCH;
        }
        return ViewEClassMatch.MISMATCH_PRECONDITIONS;
 }

    private static isOfSubclass(data: DPointerTargetable, classTarget: string | typeof DPointerTargetable, acceptEquality: boolean = false): boolean {
        let ThisClass: typeof DPointerTargetable = RuntimeAccessibleClass.get(data.className);
        Log.exDev(!ThisClass, 'isOfSubclass() unable to find class type:', {data});
        const ClassTarget: typeof DPointerTargetable = typeof classTarget === "string"? RuntimeAccessibleClass.get(classTarget) : classTarget;
        if (ThisClass === ClassTarget) return acceptEquality;
        return U.classIsExtending(ThisClass, ClassTarget);
    }


/*
    private static scoreView(v1: DViewElement, data: LModelElement | undefined, sameViewPointViews: Pointer<DViewElement, 1, 1>[] = []): number {
        let datascore: number = 1;
        let nodescore: number = 1;
        if (data) {// 1° priority: matching by EClass type
            let v1MatchingEClassScore: ViewEClassMatch = this.matchesMetaClassTarget(v1, data?.__raw);
            //console.log('allviews matcher meta', {v1MatchingEClassScore, d:data?.name, n:v1.name, v1});
            // Log.l('score view:', {v1, data, v1MatchingEClassScore});
            if (v1MatchingEClassScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // 2° priority: by ocl condition matching
            let v1OclScore = Selectors.matchesOclCondition(v1, data); // todo: not a fixed priority but acording to the "complexity" of the query
            //console.log('allviews matcher ocl_', {v1OclScore, d:data?.name, n:v1.name, v1});
            if (v1OclScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // 3° priority by sub-view
            let v1SubViewScore: ViewEClassMatch = ViewEClassMatch.EXACT_MATCH as ViewEClassMatch; // todo
            // if (v1SubViewScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH; probably better permanently off, subviews should be a priority and not a requirement
            // second priority: matching by viewpoint / subViews
            datascore = (v1MatchingEClassScore * v1OclScore * v1SubViewScore);
        }/*
        don't use node, check comment at getAppliedViews()
        if (node){
            // 1° priority: matching by DGraphElement type
            let v1MatchingEClassScore: ViewEClassMatch = this.matchesMetaClassTarget(v1, node?.__raw);
            nodescore = 1;
        }* /
        return datascore * nodescore * v1.explicitApplicationPriority;
    }
*/
    static getViewByIDOrNameD(name: string | DViewElement | LViewElement, state?: DState): undefined | DViewElement {
        if (!state) state = store.getState();
        if (typeof name === "object") { return (name as any).__raw || name as any; }
        if (state.idlookup[name]?.className === DViewElement.cname) return state.idlookup[name] as DViewElement;
        let id = Selectors.getViewIdFromName(name, state);
        if (id && state.idlookup[id]?.className === DViewElement.cname) return state.idlookup[id] as DViewElement;
        return undefined;
    }


    // input: "subview.subview2.targetview"
    // output: returns pointer to targetview
    // path is not required to start with a root, it's also possible to start navigating from a subview (notviewpoint/model view)
    // in case multiple matches are given due to incomplete path not starting from a viewpoint, the oldest matching view is returned.
    static getViewIdFromName(namepath: string, state?: DState): undefined | Pointer<DViewElement> {
        if (!state) state = store.getState();
        let names: string[] = namepath.split(".");
        let eligibleContainers: Pointer<DViewElement>[] = state.viewelements;
        for (let i = 0; i < names.length; i++) {
            let name = names[i];
            eligibleContainers = eligibleContainers.filter(v => ((state as DState).idlookup[v] as DViewElement).name === name);
            if (i === names.length-1 || eligibleContainers.length === 0) return eligibleContainers[0];
            eligibleContainers = eligibleContainers.flatMap(v => ((state as DState).idlookup[v] as DViewElement).subViews);
        }
        return undefined;
    }


    // todo: idea, set query complexity = explicitpriority amd autoset explicit priority to query lemgth
    private static getQueryComplexity = (query: string) => query.length; // todo: the more "or" and navigations there are, the more a query is "complex", the more the query match is a priority.


    static getAllGraphElementPointers(): Pointer<DGraphElement>[] {
        // graphelements = fields;
        let state: DState = store.getState();
        return [...state.graphs, ...state.graphvertexs, ...state.graphelements, ...state.vertexs, ...state.edgepoints, ...state.edges];
    }
    // updateManualViews = when you want to update ONLY views set on manual update
    // forcedUpdateViews = when you want to force a view condition to be reapplied.
    static updateViewMatchings2(dview: DViewElement, updatePreconditions: boolean, updateOCLScore: boolean, store: DState, updateManualViews: boolean = false, forcedUpdateViews: boolean = false): void {
        /*
        function toScore_old(data: DModelElement): ViewEClassMatch {
            // 1° priority: matching by EClass type
            let v1MatchingEClassScore: ViewEClassMatch = this.matchesMetaClassTarget(v1, data?.__raw);
            //console.log('allviews matcher meta', {v1MatchingEClassScore, d:data?.name, n:v1.name, v1});
            // Log.l('score view:', {v1, data, v1MatchingEClassScore});
            if (v1MatchingEClassScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // 2° priority: by ocl condition matching
            let v1OclScore = Selectors.matchesOclCondition(v1, data); // todo: not a fixed priority but acording to the "complexity" of the query
            //console.log('allviews matcher ocl_', {v1OclScore, d:data?.name, n:v1.name, v1});
            if (v1OclScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH;
            // 3° priority by sub-view
            let v1SubViewScore: ViewEClassMatch = ViewEClassMatch.EXACT_MATCH as ViewEClassMatch; // todo
            // if (v1SubViewScore === ViewEClassMatch.MISMATCH) return ViewEClassMatch.MISMATCH; probably better permanently off, subviews should be a priority and not a requirement
            // second priority: matching by viewpoint / subViews
            return (v1MatchingEClassScore * v1OclScore * v1SubViewScore);
        }*/
        if (!forcedUpdateViews) {
            if ((dview.oclUpdateCondition === 'manual') !== updateManualViews) return;
            // todo: transform jsx variables predeclarationfrom "()=>{const data = ...; const node=...; then actualjsx()}" to: "({data, node, ...})=>actualjsx(()}; so i can compile it ONCE!
            //  parameter destructuring

        }

        const allNodes: DGraphElement[] = DPointerTargetable.fromPointer(Selectors.getAllGraphElementPointers());
        //let dview = view.__raw;
        let vid = dview.id; // optimize searching multiple usages and replacing

        // filter alldata to exclude modelpieces that didn't pass the view.appyto check
        // let oclData: (LModelElement)[] = allData.filter(l => {
        let oclnodes: (DGraphElement)[] = allNodes.filter((dg: DGraphElement) => {
            if (!dg) return false;
            if (true) {
                let d: DModelElement | undefined = dg.model ? DPointerTargetable.fromPointer(dg.model) : undefined;
                let firstEvaluationForNodeView: boolean = false;
                if (!transientProperties.node[dg.id]) { transientProperties.node[dg.id] = {viewScores: {}, stackViews: [], force1Update: false}; firstEvaluationForNodeView = true; }
                if (!transientProperties.node[dg.id].viewScores[vid]) { transientProperties.node[dg.id].viewScores[vid] = {score: undefined as any}; firstEvaluationForNodeView = true; }

                if (firstEvaluationForNodeView || updatePreconditions) {
                    const oldScore = transientProperties.node[dg.id].viewScores[vid].score;
                    const newScore = transientProperties.node[dg.id].viewScores[vid].score = this.matchesMetaClassTarget(dview, d);
                    if (oldScore !== newScore) transientProperties.node[dg.id].stackViews = undefined as any; // force re-sorting
                    // 67{}[]'?^&&||nb>
                } /* else {
                    if (!transientProperties.view[dview.id].oclUpdateCondition_PARSED( transientProperties.node[dg.id].viewScores[vid].)) return;
                }*/
                // no need to check if parentview changed as well. i optimized by not having parentview affect the numeric scores, but only the view queue array sorting

                // transient.node[dg.id].viewScores[vid].score = MISSING (hasOwnProperty);    if the view or model is new and they are not yet evaluated.
                // transient.node[dg.id].viewScores[vid].score = Number.NEGATIVE_INFINITY;    if pre-ocl conditions failed (view.appliableTo)
                // transient.node[dg.id].viewScores[vid].score = 0;                           if preconditions are met, but ocl failed
                // transient.node[dg.id].viewScores[vid].score = number ocl score;            if preconditions are met and ocl matched
                // transient.node[dg.id].viewScores[vid].score = number precondition score;   if preconditions are met, and there is no ocl condition
                // changed: matching score and ocl score are summed.
                return transientProperties.node[dg.id].viewScores[vid].score !== undefined;
            }

            // if (model_viewstack[vid]) { filledElementsInOclData++; return l; } return undefined;
        });
        function mergeViewScores(preconditionScore: number, oclScore: number): number{ return preconditionScore + oclScore; }

        if (dview.oclCondition && updateOCLScore) for (let node of oclnodes) {
            let oclScore: number = OCL.test(DPointerTargetable.from(node.model as Pointer), dview, node);
            const oldScore = transientProperties.node[node.id].viewScores[vid].score;
            const newScore = transientProperties.node[node.id].viewScores[vid].score = mergeViewScores(transientProperties.node[node.id].viewScores[vid].score, oclScore);
            if (oldScore === newScore) continue;
            transientProperties.node[node.id].stackViews = undefined as any; // force re-sort
        }
    }


    // get final viewstack for a node, also updates OCL scores if needed because of a change in model or parentView (NOT from a change in view)
    static getAppliedViewsNew({data:data0, node, pv, nid}:{ node: LGraphElement | undefined; data: LModelElement | undefined; pv: DViewElement | undefined; nid: Pointer<DGraphElement>}): LViewElement[] {
        // console.trace('2302, getviews', {tnode: transientProperties.node[nid], nid, pv})
        let olddata = transientProperties.node[nid]?.viewSorted_modelused as LModelElement;
        let oldnode = transientProperties.node[nid]?.viewSorted_nodeused as LGraphElement;
        const data: LModelElement = data0 as LModelElement;
        let datachanged: boolean = (!!data !== !!olddata) || !!(data && olddata) && (data?.clonedCounter !== olddata.clonedCounter);
        let nodechanged: boolean = (!!node !== !!oldnode) || !!(node && oldnode) && (node?.clonedCounter !== oldnode.clonedCounter);

        const pvid: Pointer<DViewElement> | undefined = pv?.id;
        const oldpv: DViewElement | undefined = transientProperties.node[nid]?.viewSorted_pvid_used;
        let parentViewChanged: boolean = (pvid !== oldpv?.id || (!!(pv && oldpv) && oldpv.subViews !== pv.subViews)); // shallow comparison is fine.
        // let nodechanged: boolean
        let needsorting: boolean = false;
        // important to remember: how i'm using parentView in score and storage.
        // i'm calculating and storing every score without parentView, then i apply it right before sorting the array,
        // the enhanced value is not sored anyway but affects array sorting.
        // so if parentView changes, or if his subviews changed, need to resort array without recomputing any score value.
        let firstEvaluationForNode: boolean = false;
        let firstEvaluationForNodeView: boolean = false;
        if (!transientProperties.node[nid]) { transientProperties.node[nid] = {viewScores: {}, stackViews: [], force1Update: false}; firstEvaluationForNode = true; }

        transientProperties.node[nid].viewSorted_pvid_used = pv;
        transientProperties.node[nid].viewSorted_nodeused = node;
        transientProperties.node[nid].viewSorted_modelused = data;
        //console.log('2302, getviews 2', {datachanged, nodechanged, olddata, oldnode, data, node, allViews: Selectors.getAllViewElements()});

            // if data changed, reapply views on it only
        if ((datachanged || nodechanged)) {
            const allViews: DViewElement[] = Selectors.getAllViewElements();
            for (const dview of allViews) {
                let vid = dview.id;
                //console.log('2302, getviews evaluating view ' + vid, {vid, dview});
                // check initialization
                if (!transientProperties.node[nid].viewScores[vid]) {
                    transientProperties.node[nid].viewScores[vid] = {score: ViewEClassMatch.NOT_EVALUATED_YET as any};
                    firstEvaluationForNodeView = true;
                } else firstEvaluationForNodeView =
                    transientProperties.node[nid].viewScores[vid].score === ViewEClassMatch.NOT_EVALUATED_YET;

                // check preconditions
                if (firstEvaluationForNodeView) {
                    const oldScore = transientProperties.node[nid].viewScores[vid].score;
                    const newScore = transientProperties.node[nid].viewScores[vid].score = this.matchesMetaClassTarget(dview, data?.__raw);
                    // console.log('2302, getviews evaluating viewwwwww ' + data?.name +"_"+ vid, {newScore, oldScore, vid});
                    if (newScore === ViewEClassMatch.MISMATCH_PRECONDITIONS) {
                        if (newScore === oldScore) needsorting = true;
                        continue;
                    }
                    //console.log('2302, getviews setting preconditions!', {newScore, oldScore, vid});

                    // 67{}[]'?^&&||nb
                } else {
                    const oldScore = transientProperties.node[nid].viewScores[vid].score;
                    if (oldScore === ViewEClassMatch.MISMATCH_PRECONDITIONS) { continue; }
                }

                // check pre-ocl guard
                if (false && !transientProperties.view[vid].oclUpdateCondition_PARSED(data, olddata)) continue;

                // check ocl
                let score = OCL.test(data, dview, node)//Selectors.calculateOCLScore({data, node, dview});
                if (score === transientProperties.node[nid].viewScores[vid].score/*?.[pvid as Pointer<DViewElement>]*/) continue;
                // todo: currently ocl score replaces precondition score. eventually might be better to store precondition score separately,
                //  and add a merged score between ocl and preconditions as in ocl*preconditions
                transientProperties.node[nid].viewScores[vid].score/*[pvid as Pointer<DViewElement>]*/ = score;
                needsorting = true;
            }
        }

        function applyParentViewBonus(baseScore: number, vid: Pointer<DViewElement>, parentView: DViewElement | undefined): number {
            if (!parentView || !baseScore) return baseScore;
            if (parentView.subViews.includes(vid)) return (baseScore + 100);
            return baseScore; }

        if (parentViewChanged) needsorting = true; // scores saved in dictionaries are the same, but score in final sorted array changed.
        if (needsorting || !transientProperties.node[nid].stackViews) {
            transientProperties.node[nid].stackViews/*.[pvid as Pointer<DViewElement>]*/ = Object.keys(transientProperties.node[nid].viewScores)
                .filter(vid => transientProperties.node[nid].viewScores[vid].score > 0)
                .map( (vid)=> ({element:vid, score: applyParentViewBonus(transientProperties.node[nid].viewScores[vid].score || -1, vid, pv)} as Scored<Pointer<DViewElement>>))
                .sort((s1, s2)=> s2.score - s1.score) // sorted from biggest to smallest
                .map((s)=> LPointerTargetable.fromPointer(s.element));
        }
        // chamges to view or ocl comditiom are mot hamdled here, ut om multple mp/modes a omce
        //nb{}[]

        // if data or view changed update the score dict, them re-sort the view arr first, fimally update Sorted_modelused, Sorted_modelused
        // console.log('2302 getviews ret', {dn: data?.name, data, stack: transientProperties.node[nid].stackViews, stackn: transientProperties.node[nid].stackViews.map(v => v.name), scores: transientProperties.node[nid]});

        // throw new Error("stop debug");
        return transientProperties.node[nid].stackViews;

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
        if (wrap) return subelements.map<LGraphElement>( (ge) => LPointerTargetable.from(ge));
        return subelements; }




    //// giordano part



    public static getAllPackageClasses(id: string): LClass[] {
        const data = LPointerTargetable.from(id) as GObject;
        let lPackage : LPackage | undefined;
        const classes: LClass[] = [];
        if (data.className === "DReference") {
            const lClass: LClass = LPointerTargetable.from(data.father);
            lPackage = LPointerTargetable.from(lClass.father);
        }
        if (data.className === "DParameter") {
            const lOperation: LOperation = LPointerTargetable.from(data.father);
            const lClass: LClass = LPointerTargetable.from(lOperation.father);
            lPackage = LPointerTargetable.wrap(lClass.father);
        }
        if (data.className === "DOperation") {
            const lClass: LClass = LPointerTargetable.from(data.father);
            lPackage = LPointerTargetable.wrap(lClass.father);
        }
        if (lPackage) {
            for(let classifier of lPackage.classifiers) {
                const lClassifier: LClass | LEnumerator = LPointerTargetable.from(classifier);
                if(lClassifier.className === "DClass") classes.push(lClassifier as LClass);
            }
        }
        return classes;
    }
    public static getAllPackageEnumerators(id: string): LEnumerator[] {
        const data = LPointerTargetable.from(id) as GObject;
        let lPackage : LPackage | undefined;
        const enumerators: LEnumerator[] = [];
        if(data.className === "DAttribute") {
            const lClass: LClass = LPointerTargetable.from(data.father);
            lPackage = LPointerTargetable.from(lClass.father);
        }
        if(data.className === "DParameter") {
            const lOperation: LOperation = LPointerTargetable.from(data.father);
            const lClass: LClass = LPointerTargetable.from(lOperation.father);
            lPackage = LPointerTargetable.from(lClass.father);
        }
        if(data.className === "DOperation") {
            const lClass: LClass = LPointerTargetable.from(data.father);
            lPackage = LPointerTargetable.from(lClass.father);
        }
        if(lPackage) {
            for(let classifier of lPackage.classifiers) {
                const lClassifier: LClass | LEnumerator = LPointerTargetable.from(classifier);
                if(lClassifier.className === "DEnumerator") enumerators.push(lClassifier as LEnumerator);
            }
        }
        return enumerators;
    }

}
(window as any).Selectors = Selectors;

class Scored<T extends GObject> {
    constructor(public score: number, public element: T) {}
}
