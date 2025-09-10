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
    Defaults,
    LProject,
    ViewScore,
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
    toShortEType,
    NodeTransientProperties,
    transientProperties,
    ViewEClassMatch,
    ViewTransientProperties,
    DProject,
    DViewPoint,
    DNamedElement, DReference, DEnumLiteral
} from "../../joiner";
import {DefaultEClasses, ShortDefaultEClasses, toShortEClass} from "../../common/U";


@RuntimeAccessible('Selectors')
export class Selectors{

    static getActiveModel(): null|LModel {
        let metamodel: null|LModel;
        let state: DState & GObject = store.getState();
        const selected = state._lastSelected?.modelElement;
        if(selected) {
            const me = LPointerTargetable.fromPointer(selected) as LModelElement
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
    static getAllEnumLiterals(): Pointer<DEnumLiteral>[] {
        const state: DState = store.getState();
        return Object.values((state).enumliterals);
    }
    static getAllReferences(): Pointer<DReference>[] {
        const state: DState = store.getState();
        return Object.values((state).references);
    }
    // static getAllReferenceEdges(): string[] { const state: DState = store.getState(); return Object.values((state).refEdges); }
    static getAllClasses(): Pointer<DClass>[] {
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

    static getModels(condition?: (m: DModel) => boolean): DModel[] { return Selectors.getAll(DModel, undefined, undefined, true, false); }

    static getModel(name: string, caseSensitive: boolean = false, wrap: boolean = false): DModel | LModel | null {
        if (!caseSensitive) name = name.toLowerCase();
        let ret = Selectors.getAll<DModel, LModel>(DModel, (d) => (caseSensitive ? d.name : d.name.toLowerCase()) === name, undefined, true, wrap as any)[0];
        return ret;
    }

    static getName(d: DPointerTargetable | LPointerTargetable | string, s: DState): string {
        if (!d) return d;
        if (typeof d === 'string') return d;
        d = (d as LPointerTargetable).__raw || d;
        if (d.className !== DObject.cname) return (d as DNamedElement).name;
        let dobject: DObject = d as DObject;
        for (let feat_id of dobject.features) {
            let feat: DNamedElement | undefined = s.idlookup[feat_id] as any;
            if (feat && feat.name.toLowerCase() === 'name') return feat.name;
        }
        return dobject.name;
    }
    static getByName2(name?: string | DPointerTargetable | LPointerTargetable, dtype?: typeof DPointerTargetable | undefined | string, caseSensitive: boolean = false, s?:DState): DPointerTargetable | null {
        if (!name) { return null; }
        if (typeof name === 'object') { return name as DPointerTargetable; }
        if (!s) s = store.getState();
        //let ret: DPointerTargetable[];
        let classname: string | undefined = (dtype as typeof DClass)?.cname || dtype as string; // Selectors.getName(dtype, s); this was if dtype was allowed to be a class (filter Humans instead of filter DObjects)
        if (!caseSensitive) {
            name = name.toLowerCase();
            classname = classname?.toLowerCase();
        }
        for (let id in s.idlookup) {
            let d = s.idlookup[id];
            if (!d || typeof d !== 'object') continue;
            if (classname !== (caseSensitive ? d.className : d.className.toLowerCase())) continue;
            let dname = Selectors.getName(d, s);
            if (!caseSensitive) dname = dname?.toLowerCase();
            if (dname === name) return d;
        }
        return null;
    }
    static getByName(classe: typeof DPointerTargetable, name: string, caseSensitive: boolean = false, wrap: boolean = false): DPointerTargetable | LPointerTargetable | null {
        return Selectors.getByField(classe, 'name', name, caseSensitive, wrap); }

    static getByField(classe: typeof DPointerTargetable | undefined, field: string, value: string, caseSensitive: boolean = false, wrap: boolean = false): DPointerTargetable | LPointerTargetable | null {
        if (!caseSensitive) value = value.toLowerCase();
        let condition = (d: any) => {
            let ret = (caseSensitive ? d[field] : d[field]?.toLowerCase()) === value;
            console.log('filtering getall by field:', {d, dfield:d[field], value, ret});
            return ret;
        }
        let ret = Selectors.getAll(classe, condition, undefined, true, wrap as any)[0];
        return ret; }

    static getViewIDs(condition?: (m: DModel) => boolean): Pointer<DViewElement>[] { return Selectors.getAll(DViewElement); }


    /*static getCurrentView(data: LModelElement): DViewElement {
        Log.exDevv('todo');
        return undefined as any;
    }*/

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
            eligibleContainers = eligibleContainers.flatMap(v => Object.keys(((state as DState).idlookup[v] as DViewElement).subViews));
        }
        return undefined;
    }

    static getAllGraphElementPointers(): Pointer<DGraphElement>[] {
        // graphelements = fields;
        let state: DState = store.getState();
        return [...state.graphs, ...state.graphvertexs, ...state.graphelements, ...state.vertexs, ...state.edgepoints, ...state.edges];
    }

    static getFinalScore(entry: ViewScore, vid: Pointer<DViewElement>, parentView: DViewElement | undefined, dview: DViewElement): number {
        if (entry.metaclassScore === ViewEClassMatch.MISMATCH_PRECONDITIONS) return ViewEClassMatch.MISMATCH;
        if (entry.viewPointMatch === ViewEClassMatch.VP_MISMATCH) return ViewEClassMatch.MISMATCH;
        if (entry.jsScore === ViewEClassMatch.MISMATCH_JS || entry.OCLScore === ViewEClassMatch.MISMATCH_JS) return ViewEClassMatch.MISMATCH;
        let pvMatch: boolean = parentView ? vid in parentView.subViews : false;
        let pvScore: number = pvMatch ? (parentView as DViewElement).subViews[vid] : 1;
        let explicitprio: number;
        if (typeof entry.jsScore === 'number') {
            explicitprio = entry.jsScore;
        } else if (dview.explicitApplicationPriority === undefined) {
            // in editor put placeholder with computed expression
            explicitprio = (dview.jsCondition?.length || 1) + (dview.oclCondition?.length || 1);
        } else explicitprio = dview.explicitApplicationPriority;

        //console.log("getFinalScore", {entry, vid, dview, explicitprio, ep:dview.explicitApplicationPriority})

        let defualtViewMalus = dview.id.indexOf('View') >= 0 ? 0 : 0.1;
        return entry.viewPointMatch * entry.metaclassScore * pvScore * explicitprio + defualtViewMalus;
        //score = precoditiom * paremtview(comfiguravle) * (explicitprio = jsValid*jslemgth + oclvalid*ocllemgth)
        // or if jscomditiom returmed mumver --> * jsscore
    }





/*
    //this function handles: what i do when view changes? do i recompute the score?
    static updateViewMatchings(dview: DViewElement, updatePreconditions: boolean, updateOCLScore: boolean, store: DState, updateManualViews: boolean = false, forcedUpdateViews: boolean = false): void {

        //  event           observed change         ignore change
        //  ocl             data                    node, view (except view.ocl)
        //  jsCondition     all                     none
        //  appliableTo     view.appliableto
        // if (!forcedUpdateViews && (dview.oclUpdateCondition === 'manual') !== updateManualViews) return;
        // modularize getscoresnew split in setpreconditionscore, setoclscorem, setjscscore, and call those only if observed stuff changed

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
                if (!transientProperties.node[dg.id]) { transientProperties.node[dg.id] = {viewScores: {}} as any; firstEvaluationForNodeView = true; }
                if (!transientProperties.node[dg.id].viewScores[vid]) { transientProperties.node[dg.id].viewScores[vid] = {score: undefined} as any; firstEvaluationForNodeView = true; }

                if (firstEvaluationForNodeView || updatePreconditions) {
                    const oldScore = transientProperties.node[dg.id].viewScores[vid].score;
                    const newScore = transientProperties.node[dg.id].viewScores[vid].score = this.matchesMetaClassTarget(dview, d);
                    if (oldScore !== newScore) transientProperties.node[dg.id].stackViews = undefined as any; // force re-sorting
                    // 67{}[]'?^&&||nb>
                } /* else {
                    if (!transientProperties.view[dview.id].oclUpdateCondition_PARSED( transientProperties.node[dg.id].viewScores[vid].)) return;
                }* /
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
    }*/




    static updateScores(data0: LModelElement | undefined, node: LGraphElement | undefined, nid: Pointer<DGraphElement>, pv: DViewElement | undefined, state: DState){
        let needsorting: boolean = false;
        let firstEvaluationForNode: boolean = false;
        let firstEvaluationForNodeView: boolean = false;
        let tn = transientProperties.node[nid];
        //console.log('2302 0, getviews evaluating view ', {tn:(tn ? {...tn} : tn), nid});
        if (!tn) { transientProperties.node[nid] = tn = new NodeTransientProperties(); firstEvaluationForNode = true; }
        //console.log('2302 1, getviews evaluating view ' , {tn:(tn ? {...tn} : tn), nid});
        let olddata = tn.viewSorted_modelused as LModelElement;
        //let oldnode = transientProperties.node[nid]?.viewSorted_nodeused as LGraphElement;
        const data: LModelElement = data0 as LModelElement;
        // console.error('changed', {data, olddata, node, oldnode, cdata:data?.clonedCounter, colddata:olddata?.clonedCounter})
        const pvid: Pointer<DViewElement> | undefined = pv?.id;
        const oldpv: DViewElement | undefined = tn.viewSorted_pvid_used;
        let datachanged: boolean = (!!data !== !!olddata) || !!(data && olddata) && (data.clonedCounter !== olddata.clonedCounter);
        //let nodechanged: boolean = (!!node !== !!oldnode) || !!(node && oldnode) && (node.clonedCounter !== oldnode.clonedCounter);
        let parentViewChanged: boolean = (pvid !== oldpv?.id || (!!(pv && oldpv) && oldpv.subViews !== pv.subViews)); // shallow comparison is fine.
        if (parentViewChanged) tn.viewSorted_pvid_used = pv;
        //if (nodechanged) transientProperties.node[nid].viewSorted_nodeused = node;
        if (datachanged) tn.viewSorted_modelused = data;

        // let nodechanged: boolean
        // important to remember: how i'm using parentView in score and storage.
        // i'm calculating and storing every score without parentView, then i apply it right before sorting the array,
        // the enhanced value is not sored anyway but affects array sorting.
        // so if parentView changes, or if his subviews changed, need to resort array without recomputing any score value.

        //console.log('2302, getviews 2', {datachanged, nodechanged, olddata, oldnode, data, node, allViews: Selectors.getAllViewElements()});

        if (!state) state = store.getState();
        const allViews: DViewElement[] = Selectors.getAllViewElements(state);

        const user = LUser.fromPointer(DUser.current) as LUser;
        const project = user.project as LProject;
        let activevpid: Pointer<DViewElement> = project.activeViewpoint.id;
        // check if scores needs to be updated
        for (const dview of allViews) {
            let vid = dview.id;
            let tv = transientProperties.view[vid];
            if (!tv) transientProperties.view[vid] = tv = {} as any;
            //console.log('2302 2, getviews evaluating view ' + vid, {vid, dview, tn});
            if (!tn?.viewScores) console.error('2302 3, getviews evaluating view ' + vid, {vid, dview, tn});
            let tnv: ViewScore = tn.viewScores[vid];

            // check initialization

            if (!tnv) {
                tn.viewScores[vid] = tnv = new ViewScore();
                /*{
                    score: ViewEClassMatch.NOT_EVALUATED_YET,
                    metaclassScore: ViewEClassMatch.NOT_EVALUATED_YET,
                    //jsScore:ViewEClassMatch.NOT_EVALUATED_YET,
                    //OCLScore: ViewEClassMatch.NOT_EVALUATED_YET
                } as any;*/
                firstEvaluationForNodeView = true;
            } else firstEvaluationForNodeView = tnv.metaclassScore === ViewEClassMatch.NOT_EVALUATED_YET; // todo: when changing view.appliableTo, delete all tnv using that view.

            // don't match exclusive views from other vp
            let dvp: DViewPoint = DPointerTargetable.fromPointer(dview.viewpoint, state);
            let oldVpMatch: number = tnv.viewPointMatch;
            // console.log("vp matching " +vid, {vid, dvp, activevpid });
            if (dvp.id === activevpid) tnv.viewPointMatch = ViewEClassMatch.VP_Explicit;
            else if (dvp.id === 'Pointer_ViewPointDefault') tnv.viewPointMatch = ViewEClassMatch.VP_Default;
            else if (!dvp.isExclusiveView) tnv.viewPointMatch = ViewEClassMatch.VP_Decorative;
            else tnv.viewPointMatch = ViewEClassMatch.VP_MISMATCH;

            if (!needsorting && (oldVpMatch !== tnv.viewPointMatch)) needsorting = true;
            if (tnv.viewPointMatch === ViewEClassMatch.VP_MISMATCH) {
                tnv.finalScore = ViewEClassMatch.VP_MISMATCH;
                continue;
            }


            // check preconditions
            if (firstEvaluationForNodeView) {
                const oldScore = tnv.metaclassScore;
                tnv.metaclassScore = this.matchesMetaClassTarget(dview, data?.__raw);
                needsorting = true; // sorting is mandatory here because it's the first evaluation of node-vie
                // if mismatch i stop computing the score.
                if (tnv.metaclassScore === ViewEClassMatch.MISMATCH_PRECONDITIONS) {
                    tnv.finalScore = ViewEClassMatch.MISMATCH;
                    continue;
                }
            } else if (tnv.metaclassScore === ViewEClassMatch.MISMATCH_PRECONDITIONS) continue;

            if (true) {
                // this needs to be called not only if datachanged || nodechanged, but everytime in case it is a reference like data.$value.name.length
                // also his performances are so fast that it might be more costly to check if it's supposed to be reevaluated than just calling it.
                let jsScoreChanged: boolean = Selectors.updateJSScore(node, data, dview, tv, tnv);
                if (!needsorting && jsScoreChanged) needsorting = true;
                // if mismatch i stop computing the score.
                if (tnv.jsScore === ViewEClassMatch.MISMATCH_JS) { tnv.finalScore = ViewEClassMatch.MISMATCH; continue; }
            }

            // check pre-ocl guard
            // if (!tv.oclUpdateCondition_PARSED(data, olddata)) continue;

            if (datachanged || tnv.OCLScore === ViewEClassMatch.NOT_EVALUATED_YET) {
                // check ocl: this can lead to mis-updating if ocl queries a reference.
                // but OCL is computationally heavy, so i decided it is now a requirement to update the model to reevaluate ocl.
                let oldScore = tnv.OCLScore;
                tnv.OCLScore = OCL.test(data, dview, node)//Selectors.calculateOCLScore({data, node, dview});
                // if (vid === 'Pointer_fallback') console.warn('fallback ocl', {oldScore, newScore:tnv.OCLScore, data, node, dview});
                tv.oclChanged = false;
                if (!needsorting && tnv.OCLScore !== oldScore) needsorting = true;
                if (tnv.OCLScore === ViewEClassMatch.MISMATCH_OCL) { tnv.finalScore = ViewEClassMatch.MISMATCH; continue; }
            }
        }

        if (parentViewChanged) needsorting = true; // scores saved in dictionaries are the same, but score in final sorted array changed.
        return needsorting;
    }

    // get final viewstack for a node, also updates OCL scores if needed because of a change in model or parentView (NOT from a change in view)
    static getAppliedViewsNew({data:data0, node, pv, nid}:{ node: LGraphElement | undefined; data: LModelElement | undefined; pv: DViewElement | undefined; nid: Pointer<DGraphElement>}): NodeTransientProperties {
        // console.trace('2302, getviews', {tnode: transientProperties.node[nid], nid, pv})
        let state = store.getState();
        let needsorting: boolean = Selectors.updateScores(data0, node, nid, pv, state);

        let tn: NodeTransientProperties = transientProperties.node[nid]; // needs to be placed after updateScores() which will initialize it.
        if (!needsorting && tn.needSorting) needsorting = tn.needSorting;




        if (needsorting || !tn.stackViews) {
            NodeTransientProperties.sort(tn, pv, state)
        }
        // chamges to view or ocl comditiom are mot hamdled here, ut om multple mp/modes a omce
        //nb{}[]

        // if data or view changed update the score dict, them re-sort the view arr first, fimally update Sorted_modelused, Sorted_modelused
        // console.log('2302 getviews ret', {dn: data?.name, data, stack: transientProperties.node[nid].stackViews, stackn: transientProperties.node[nid].stackViews.map(v => v.name), scores: transientProperties.node[nid]});

        // throw new Error("stop debug");
        return tn;

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

    private static updateJSScore(node: LGraphElement | undefined, data: LModelElement | undefined, dview: DViewElement, tv: ViewTransientProperties, tnv: ViewScore) {
        let oldjsScore = tnv.jsScore;
        let jsConditionChanged: boolean = tv.jsConditionChanged;
        tv.jsConditionChanged = false;

        // tnv.jsScore = ViewEClassMatch.NOT_EVALUATED_YET as any as number;
        let printstuff = {name: data?.name, jsc:tv.jsCondition, tv:{...tv}, data:data&&data.__raw, node:node&&{...node.__raw}, nerr: (node as any)?.errors}
        if (tv.jsCondition) {
            try {
                tnv.jsScore = tv.jsCondition({data, node, view: LPointerTargetable.fromD(dview), constants: tv.constants});
                // if (tnv.jsScore === true) tnv.jsScore = dview.jsCondition.length;
                switch (typeof tnv.jsScore) {
                    case "boolean": // bool is fine if true
                        if (!tnv.jsScore) tnv.jsScore = ViewEClassMatch.MISMATCH_JS;
                        break;
                    case "number": // number is fine if not NaN and > 0
                        if (isNaN(tnv.jsScore) || tnv.jsScore < 0) tnv.jsScore = ViewEClassMatch.MISMATCH_JS;
                        break;
                    default:
                        tnv.jsScore = ViewEClassMatch.MISMATCH_JS;
                        break;
                }
            }
            catch (e:any) { // crash = mismatch
                Log.ee("failed to evaluate jsCondition: " + e.message?.split("\n")[0], {e, data, node, tnv, jsc:tv.jsCondition+''});
                tnv.jsScore = ViewEClassMatch.MISMATCH_JS;
            }
        } else tnv.jsScore = true; // missing condition = match

        // jsConditionChanged: because even if score didn't change, if jsc.length changed the final computed score is affected
        return jsConditionChanged || tnv.jsScore !== oldjsScore;
    }
}

(window as any).Selectors = Selectors;

class Scored<T extends GObject> {
    constructor(public score: number, public element: T) {}
}
