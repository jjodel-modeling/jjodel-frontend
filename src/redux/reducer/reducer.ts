import type {U as UType} from '../../joiner';
import {
    Action,
    CompositeAction,
    CreateElementAction,
    DeleteElementAction,
    Dictionary,
    DocString,
    DPointerTargetable,
    IStore,
    Log,
    MyError,
    ParsedAction,
    Pointer,
    RuntimeAccessibleClass,
    SetFieldAction,
    SetRootFieldAction,
    LPointerTargetable,
    store,
    getPath,
    Selectors,
    PointedBy,
    PendingPointedByPaths,
    statehistory, DUser, GObject
} from "../../joiner";
import React from "react";
import {CombineHistoryAction, LoadAction, RedoAction, UndoAction} from "../action/action";
import {Firebase} from "../../firebase";

let windoww = window as any;
let U: typeof UType = windoww.U;

function deepCopyButOnlyFollowingPath(oldStateDoNotModify: IStore, action: ParsedAction, prevAction: ParsedAction, newVal: any): IStore {
    let newRoot: IStore = {...oldStateDoNotModify} as IStore;
    let current: any = newRoot;
    if (!action.path?.length) throw new MyError("path length must be at least 1", {action});
    let gotChanged: boolean = false; // dovrebbe cambiare sempre, se non cambia non lancio neanche l'azione e non faccio la shallow copy, ma non si sa mai, così posso evitare un render se succede l' "insuccedibile"
    let alreadyPastDivergencePoint = false; // true dal momento in cui il path dell'azione attuale e della azione precedente divergono, false fino al sotto-segmento in cui combaciano
    // console.log('deepCopyButOnlyFollowingPath', arguments);
    for (let i = 0; i < action.pathArray.length; i++) {
        let key = action.pathArray[i].trim();
        let prevActionPathKey = prevAction?.pathArray[i];
        // middle execution: not on final loop
        // console.log('deepCopyButOnlyFollowingPath', {current, i, imax:action.pathArray.length, key, gotChanged, alreadyPastDivergencePoint});
        if (i !== action.pathArray.length - 1) {
            if (alreadyPastDivergencePoint || key !== prevActionPathKey) {
                // se l'oggetto è stato già duplicato in una azione composita, non lo duplico 2 volte.
                alreadyPastDivergencePoint = true;
                current[key] = Array.isArray(current[key]) ? [...current[key]] : {...current[key]};
                current[key].clonedCounter = 1 + (current[key].clonedCounter || 0);
            }
            current = current[key];
            continue; }

        // perform final assignment
        if (i >= action.pathArray.length - 1) {
            let isArrayAppend = false;
            let isArrayRemove = false;
            // console.log('isarrayappend?', {endswith: U.endsWith(key, ['+=', '[]', '-1']), key, action, i});
            // console.log('isarraydelete?', {endswith: U.endsWith(key, ['-='])});
            if (U.endsWith(key, ['+=', '[]'])) {
                key = key.substr(0, key.length - 2).trim();
                isArrayAppend = true; }
            if (U.endsWith(key, ['-='])) {
                key = key.substr(0, key.length - 2).trim();
                isArrayRemove = true; }

            let oldValue: any;
            let unpointedElement: DPointerTargetable | undefined;
            // perform final assignment
            if (isArrayAppend) {
                gotChanged = true;
                if (!Array.isArray(current[key])) { current[key] = []; }
                oldValue = [...current[key]];
                current[key] = [...current[key]];
                current[key].push(newVal);
                unpointedElement = undefined;
                if (action.isPointer) { newRoot = PointedBy.add(newVal as Pointer, action, newRoot, "+="); }
            } else
            if (isArrayRemove){
                if (!Array.isArray(current[key])) { current[key] = []; }
                oldValue = [...current[key]];
                let index = U.isNumber(newVal) ? +newVal : -1;
                if (index === -1) index = current[key].length - 1;
                gotChanged = index >=0 && index < current[key].length;
                if (gotChanged){
                    current[key] = [...current[key]];
                    let removedval = current[key].splice(index, 1); // in-place edit
                    if (action.isPointer) { newRoot = PointedBy.remove(removedval as Pointer, action, newRoot, '-='); }

                    /// a.pointsto = [x, y, z]; a.pointsto = [x, z]       --->    remove a from y.pointedby
                    /*
                    const elementsThatChangedIndex: DPointerTargetable[] = current[key].slice(index);
                    todo: problema: se ho [dobj1, dobj2]... e li swappo, cambia un indice nel percorso "pointedby" e non me ne accorgo mai e un oggetto risulta "pointedby" da oggetti che non lo puntano o non esistono più a quell'indice
                    for (let j = 0; j < elementsThatChangedIndex.length; j++) {
                        let newindex = index + j - 1;
                        let oldFullpathTrimmed = action.pathArray.join('.');
                        se realizzi "pointedby" qui è to do: remove old paths and re-add them with updated index
                    }*/
                    //unpointedElement = newRoot.idlookup[oldValue];
                }
            }
            else if (current[key] !== newVal) {
                // todo: caso in cui setto manualmente classes.1 = pointer; // the latest element is array and not DPointerTargetable, so might need to buffer upper level in the tree? or instead of "current" keep an array of sub-objects encountered navigating the path in state.
                oldValue = current[key];
                gotChanged = true;
                unpointedElement = newRoot.idlookup[oldValue];
                // NB: se elimino un oggetto che contiene array di puntatori, o resetto l'array di puntatori kinda like store.arr= [ptr1, ptr2, ...]; store.arr = [];
                // i puntati dall'array hanno i loro pointedBY non aggiornati, non voglio fare un deep check di tutto l'oggetto a cercare puntatori per efficienza.
                if (newVal === undefined) delete current[key];
                else current[key] = newVal;

                if (action.isPointer) {
                    if (Array.isArray(action.value)) {
                        let oldpointerdestinations: Pointer[] = oldValue;
                        let difference = U.arrayDifference(oldpointerdestinations, current[key]); // : {added: Pointer[], removed: Pointer[], starting: Pointer[], final: Pointer[]}
                        for (let rem of difference.removed) { newRoot = PointedBy.remove(rem as Pointer, action, newRoot); }
                        for (let add of difference.added) { newRoot = PointedBy.add(add as Pointer, action, newRoot); }
                        // a.pointsto = [a, b, c];  a.pointsto = [a, b, x];    ------>     c.pointedby.remove(a) & x.pointedby.add(a)
                        // idlookup.somelongid.pointsto = [...b];
                    }
                    else {
                        // a.pointsto = b;  a.pointsto = c;    ------>     b.pointedby.remove(a)
                        newRoot = PointedBy.remove(oldValue as Pointer, action, newRoot);
                        newRoot = PointedBy.add(current[key] as Pointer, action, newRoot);
                    }
                }
            } else {
                gotChanged = false;
                // value not changed
            }

            let fullpathTrimmed = action.pathArray.join('.');
            /*if (unpointedElement) {
                if (isArrayAppend || isArrayAppend) fullpathTrimmed.substr(0, fullpathTrimmed.length - 2);
                U.arrayRemoveAll(unpointedElement.pointedBy, fullpathTrimmed); // todo: se faccio una insert in mezzo ad un array devo aggiustare tutti i path di pointedby...
            }
            let newlyPointedElement = newRoot.idlookup[newVal];
            if (newlyPointedElement) {
                U.ArrayAdd(newlyPointedElement.pointedBy, fullpathTrimmed);
            }*/
            // console.log('deepCopyButOnlyFollowingPath final', {current, i, imax:action.pathArray.length, key, isArrayAppend, gotChanged, alreadyPastDivergencePoint});
            break;
        }
        Log.exDevv('should not reach here: reducer');
    }
    return gotChanged ? newRoot : oldStateDoNotModify;
}


// const pendingPointedByPaths: {from: DocString<"Path in store">, field: DocString<"keyof object found in from path">, to: Pointer}[] = [];
function CompositeActionReducer(oldState: IStore, actionBatch: CompositeAction): IStore {
    // per via di thunk se arrivo qui lo stato cambia sicuro in mono-client non synchro (non ri-assegno valori equivalenti)
    // todo: ma se arrivano in ordine sbagliato da altri client? posso permetterlo?
    let actions: ParsedAction[];
    if (actionBatch.actions) actions = Action.parse(actionBatch.actions);
    else actions = [Action.parse(actionBatch)]; // else-case is if it's a single action and not an actual compositeaction
    if (PendingPointedByPaths.all.length) actions.push(...PendingPointedByPaths.getSolveableActions(oldState)); //.all.map( p=> p.resolve() ) );

    Action.possibleInconsistencies = {};

    // estraggo le azioni derivate
    let derivedActions: ParsedAction[] = [];
    for (let action of actions) {
        switch (action.type){
            default: break;
            case LoadAction.type: return action.value;
            case CreateElementAction.type:
                const elem: DPointerTargetable = action.value;
                elem.className = elem.className || elem.constructor.name;
                let statefoldername = elem.className.substring(1).toLowerCase() + 's';
                derivedActions.push(
                    Action.parse(SetRootFieldAction.create(statefoldername, elem.id,'[]', true)));
                if (!Array.isArray(elem.pointedBy)) elem.pointedBy = [];
                elem.pointedBy.push(PointedBy.new(statefoldername));
                /*if (false && action.isPointer) {
                    if (Array.isArray(action.value)) {
                        const ptr: Pointer[] = action.value;
                        // todo but replaced by side actions in execution of the main action instead of triggering derived actions
                    }
                    else {
                        const ptr: Pointer = action.value;
                        const target: DPointerTargetable | null = oldState.idlookup[ptr];
                        let pendingPointedBy = PendingPointedByPaths.new(action, oldState);
                        if (!target) PendingPointedByPaths.new(action, oldState).saveForLater(); // {from: action.path, field: action.field, to: target});
                        // @ts-ignore
                        else derivedActions.push(pendingPointedBy.resolve());
                        // a -> x
                        // a -> y     unset x.pointedby(a)
                    }
                }*/
                break;
        }
    }
    // console.error({U, Umip:U.arrayMergeInPlace, WU: windoww.U, WUmip: windoww.U.arrayMergeInPlace});
    actions = U.arrayMergeInPlace<ParsedAction>(actions, derivedActions);

    // ordino i path con segmenti comuni
    actions = actions.sort( (a1, a2) => U.stringCompare(a1.path, a2.path));

    // destrutturo solo i nodi intermedi e solo la prima volta che li incontro (richiede le azioni ordinate in base al path)
    let newState = oldState;
    for (let i = 0; i < actions.length; i++) {
        const prevAction: ParsedAction = actions[i-1];
        const action: ParsedAction = actions[i];
        const actiontype = action.type.indexOf('@@') === 0 ? 'redux' : action.type;
        console.log('executing action:', {action, actiontype, count: ++action.executionCount});

        switch (actiontype) {
            /*
            case '@@redux/INIT6.x.f.d.r.e':
            case '@@redux/INITm.f.1.s.o.g':
            case '@@redux/INIT5.t.4.v.d.o':
            case '@@redux/INITy.a.d.r.l.a':
            case '@@redux/INIT4.2.q.u.z.k':
            case '@@redux/INITj.8.e.g.y.p':
            case '@@redux/INITp.k.q.g.z.w':
            case '@@redux/INITq.c.u.w.f.e': ... etc*/
            default:
                if (action.type.indexOf('@@redux/') === 0) break;
                return Log.exDevv('unexpected action type:', action.type);
            case CreateElementAction.type:
            case SetRootFieldAction.type:
            case DeleteElementAction.type:
            case SetFieldAction.type:
                newState = deepCopyButOnlyFollowingPath(newState, action, prevAction, action.value);
                break;
        }

        // and that's all, the reducer is really simple as actions are really simple.
    }

    // effetti collaterali, aggiornamento di ridondanze
    newState = updateRedundancies_OBSOLETE(newState, oldState, Action.possibleInconsistencies);
    return newState;
}

function updateRedundancies_OBSOLETE(state: IStore, oldState:IStore, possibleInconsistencies: Dictionary<DocString<'subtype'>, (Pointer | DPointerTargetable)[]>): IStore {
    for (let subType in possibleInconsistencies)
    switch (subType) {
        default: break;
        case Action.SubType.vertexSubElements:/*
            risolto triggrerando più azioni da LGraphElement setter
            let dvertexid: Pointer, newdvertex: DGraphElement, olddvertex: DGraphElement;
            for (newdvertex of possibleInconsistencies[subType] as DGraphElement[]){
                const olddvertex: DGraphElement = oldState.idlookup[newdvertex.id] as DGraphElement;
                const notContainedAnymoreOut: Pointer<DGraphElement> = [];
                const newlyInsertedOut: Pointer<DGraphElement>[] = [];
                U.arraySymmetricDifference(olddvertex.subElements, newdvertex.subElements, notContainedAnymoreOut, newlyInsertedOut);
                for (let geid of notContainedAnymoreOut) {
                    const oldge = oldState.idlookup[geid] as DGraphElement;
                    const newge = state.idlookup[geid] as DGraphElement;
                    if (oldge.containedIn === newge.containedIn) continue;
                }
                for (let geid of notContainedAnymoreOut) {
                    const ge = idlookup[geid] as DGraphElement;
                    if (ge.containedIn === context.data.id) set container = context.data.id
                    meglio se sti 2 cicli li fai nel reducer perchè  potrebbe esserci una azione pending che setta il parent = someotherid e qui faccio partire una azione che setta il parent a null, "annullando" una azione pending non ancora eseguita
                }
            }
            break;*/
    }
    // if state is updated shallow copy state before returning it
    return state;
}

let initialState: IStore = null as any;
let storeLoaded: boolean = false;

export function reducer(oldState: IStore = initialState, action: Action): IStore {
    const ret = _reducer(oldState, action);
    if(ret === oldState) return oldState;
    if(!oldState?.room) return ret;
    // action.sender === DUser.current
    if(action.token === DUser.token) {
        const parsedAction: JSON = JSON.parse(JSON.stringify(action));
        Firebase.addAction(ret.room, parsedAction).then();
    }
    return ret;

}

export function _reducer/*<S extends StateNoFunc, A extends Action>*/(oldState: IStore = initialState, action: Action): IStore{
    let times: number;
    let state: IStore;
    switch(action.type) {
        case UndoAction.type:
            times = action.value;
            state = oldState;
            Log.exDev(times<=0, "undo must be positive", action);
            while (times--) {
                state = undo(state, statehistory[DUser.current].undoable.pop());
            }
            return state;

        case RedoAction.type:
            times = action.value;
            state = oldState;
            Log.exDev(times<=0, "redo must be positive", action);
            while (times--) {
                state = undo(state, statehistory[DUser.current].redoable.pop(), false);
            }
            return state;
        // case CombineHistoryAction.type: return combineHistory(oldState); break;
        // todo: se al posto di "annullare l'undo" memorizzo l'azione e la rieseguo, posso ripetere l'ultimo passo N volte e questa azione diventa utile per combinare passi e ripetere blocchi di azioni assieme
        default:
            let ret = doreducer(oldState, action);
            if (ret === oldState) return ret;
            statehistory[DUser.current].redoable = [];
            let delta =  U.objectDelta(ret, oldState);
            if (!filterundoableactions(delta)) return ret;
            // console.log("setting undoable action:", {ret, oldState0:{...oldState}, oldState, delta});
            if (oldState !== null) statehistory[DUser.current].undoable.push(delta);
            return ret;
    }
}

function filterundoableactions(delta: Partial<IStore>): boolean {
    if (!statehistory.globalcanundostate) return false;
    if (Object.keys(delta).length === 1 && "dragging" in delta) return false;
    if (Object.keys(delta).length === 1 && "_lastSelected" in delta) return false;
    if (Object.keys(delta).length === 1 && "contextMenu" in delta) return false;
    return true;
}
function undo(state: IStore, delta: GObject | undefined, isundo = true): IStore {
    if (!delta) return state;
    let undonestate = {...state};
    //   controlla se vengono shallow-copied solo e tutti gli oggetti nested lungo la catena del percorso delle modifiche
    //   es: root.a.b.c=3 + root.a.b.d=3 = 4+1 modifiche, 5 shallow copies including the root
    undorecursive(delta, undonestate);
    if (isundo) statehistory[DUser.current].redoable.push( U.objectDelta(undonestate, state) ); // reverses from undo to redo and viceversa swapping arguments, so the target result after appliying the delta changes
    else statehistory[DUser.current].undoable.push( U.objectDelta(undonestate, state) ); // redo is "undoing an undo", reversing his changes just like an undo reverses an ordinary action changes.
    return undonestate;
}

function undorecursive(deltalevel: GObject, statelevel: GObject): void {
    // statelevel = {...statelevel}; not working if i do it here, just a new var. first time copy id done in caller func undo(). recursive copies are done before recursive step
    for (let key in deltalevel) {
        let delta = deltalevel[key];
        console.log("undoing", {delta, key, deltalevel, statelevel})
        if (key.indexOf("_-") === 0) { delete statelevel[key.substring(2)]; continue; }
        if (typeof delta === "object") {
        // if (U.isObject(delta, false, false, true)) {
            statelevel[key] = {...statelevel[key]};
            undorecursive(deltalevel[key], statelevel[key]); }
        else { statelevel[key] = delta; }
    }
}

function doreducer/*<S extends StateNoFunc, A extends Action>*/(oldState: IStore = initialState, action: Action): IStore{
    if (!oldState) { oldState = initialState = new IStore(); }
    let ca: CompositeAction;
    // console.log('external REDUCER', {action, CEtype:CreateElementAction.type});
    if (!storeLoaded) {
        // new SetRootFieldAction('forceinit', true);
        storeLoaded = true;
    }
    if (!(oldState as any).forceinit) {
        // afterStoreLoad();
        // new SetRootFieldAction('forceinit', true);
    } //  setTimeout(afterStoreLoad, 1);
    switch (action.type) {
        case CompositeAction.type: ca = action as CompositeAction; break;
        case LoadAction.type:
        default:
            if (action.type.indexOf('@@redux/') === 0) {
                //storeLoaded = true;
                return oldState;
            }
            ca = new CompositeAction([action], false);
            break;
    }
    let ret = CompositeActionReducer(oldState, ca);
    /*if (state.current !== ret) {
        state.current = ret;
        state.past.push(ret);
    }*/
    return ret;
}

function buildLSingletons(alld: Dictionary<string, typeof DPointerTargetable>, alll: Dictionary<string, typeof LPointerTargetable>) {
    for (let dname in alld) {
        switch (dname) {
            case "DeleteElementAction": continue;
            case "DV": continue;
            default: break;
        }
        let tagless = dname.substring(1);
        let d = alld[dname];
        let l = alll['L'+tagless];
        d.logic = l;
        if (!l) console.error('lllllllll', l, d);
        // @ts-ignore
        d.singleton = new l('dwc');
        d.structure = d;

        l.logic = d.logic;
        l.singleton = d.singleton;
        l.structure = d.structure;

        if (!d.subclasses) d.subclasses = [];
        // @ts-ignore
        for (let sc of d.subclasses) { if (!sc["_extends"]) sc["_extends"] = [];  sc["_extends"].push(d); }
    }
}

export function jodelInit() {
    RuntimeAccessibleClass.fixStatics();

    let dClasses: string[] = RuntimeAccessibleClass.getAllNames().filter( rc => rc[0] === 'D');
    let lClasses: string[] = RuntimeAccessibleClass.getAllNames().filter( rc => rc[0] === 'L');
    let dClassesmap: Dictionary<string, typeof DPointerTargetable> = dClasses.reduce((acc: any,curr)=> (acc[curr] = RuntimeAccessibleClass.get(curr), acc),{});
    let lClassesmap: Dictionary<string, typeof LPointerTargetable> = lClasses.reduce((acc: any,curr)=> (acc[curr] = RuntimeAccessibleClass.get(curr), acc),{});
    buildLSingletons(dClassesmap, lClassesmap);


    windoww.defaultContext = {$: windoww.$, getPath, React: React, Selectors, ...RuntimeAccessibleClass.getAllClassesDictionary(), ...windoww.Components};

    console.log('EXecute on read RuntimeClasses:', {dClasses, allClasses: {...RuntimeAccessibleClass.classes}});
    /*for (let dclassname of dClasses) {
        const dclass = RuntimeAccessibleClass.get(dclassname) as typeof DPointerTargetable;
        const lclass = RuntimeAccessibleClass.get('L' + dclassname.substr(1)) as typeof LPointerTargetable;
        dclass.logic = lclass;
        console.log('EXecute on read set singletons:', {dclass, lclass});
        if (!lclass) continue;
        lclass.singleton = new lclass();
        lclass.structure = dclass;
    }*/

    IStore.fakeinit();
//    setTimeout( () => createOrOpenModelTab('m3'), 1);
    // GraphDragHandler.init();

}

// ideally launched before component render, verify it. maybe move the callback to <App> component mounting
function afterStoreLoad() {
    jodelInit();
}
