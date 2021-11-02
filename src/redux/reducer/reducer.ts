import {
    Action,
    CompositeAction,
    CreateElementAction,
    ParsedAction,
    SetFieldAction,
    SetRootFieldAction,
    Log,
    U,
    MyError,
    IStore,
    DPointerTargetable,
    DeleteElementAction,
    Pointer,
    DocString,
    Dictionary,
    RuntimeAccessibleClass,
    LPointerTargetable, store, windoww, getPath, Selectors, GraphDragHandler, createOrOpenModelTab
} from "../../joiner";
import React from "react";





function deepCopyButOnlyFollowingPath(state: IStore, action: ParsedAction, prevAction: ParsedAction, newVal: any) {
    let newRoot: IStore = {...state} as IStore;
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
                if (!Array.isArray(current[key])) {
                    // throw new MyError('indexing of type "+=", "[]", or "-1" is only valid on terminal arrays, found instead:', {foundInstead: current[key], action});
                    current[key] = [];
                }
                current[key].push(newVal);
                oldValue = undefined;
                unpointedElement = state.idlookup[oldValue];
            } else
            if (isArrayRemove){
                if (!Array.isArray(current[key])) { current[key] = []; }
                let index = U.isNumber(newVal) ? +newVal : -1;
                if (index === -1) index = current[key].length - 1;
                gotChanged = index >=0 && index < current[key].length;
                if (gotChanged){
                    current[key] = [...current[key]];
                    /*
                    const elementsThatChangedIndex: DPointerTargetable[] = current[key].slice(index);
                    // todo: problema: se ho [dobj1, dobj2]... e li swappo, cambia un indice nel percorso "pointedby" e non me ne accorgo mai e un oggetto risulta "pointedby" da oggetti che non lo puntano o non esistono più a quell'indice
                    for (let j = 0; j < elementsThatChangedIndex.length; j++) {
                        let newindex = index + j - 1;
                        let oldFullpathTrimmed = action.pathArray.join('.');
                        se realizzi "pointedby" qui è to do: remove old paths and re-add them with updated index
                    }*/
                    oldValue = current[key].splice(index, 1);
                    unpointedElement = state.idlookup[oldValue];
                }
            }
            else if (current[key] !== newVal) {
                oldValue = current[key];
                gotChanged = true;
                unpointedElement = state.idlookup[oldValue];
                // NB: se elimino un oggetto che contiene array di puntatori, o resetto l'array di puntatori kinda like store.arr= [ptr1, ptr2, ...]; store.arr = [];
                // i puntati dall'array hanno i loro pointedBY non aggiornati, non voglio fare un deep check di tutto l'oggetto a cercare puntatori per efficienza.
                if (newVal === undefined) delete current[key];
                else current[key] = newVal;
            } else {
                gotChanged = false;
                // value not changed
            }

            let fullpathTrimmed = action.pathArray.join('.');
            /*if (unpointedElement) {
                if (isArrayAppend || isArrayAppend) fullpathTrimmed.substr(0, fullpathTrimmed.length - 2);
                U.arrayRemoveAll(unpointedElement.pointedBy, fullpathTrimmed); // todo: se faccio una insert in mezzo ad un array devo aggiustare tutti i path di pointedby...
            }
            let newlyPointedElement = state.idlookup[newVal];
            if (newlyPointedElement) {
                U.ArrayAdd(newlyPointedElement.pointedBy, fullpathTrimmed);
            }*/
            // console.log('deepCopyButOnlyFollowingPath final', {current, i, imax:action.pathArray.length, key, isArrayAppend, gotChanged, alreadyPastDivergencePoint});
            break;
        }
        Log.exDevv('should not reach here: reducer');
    }
    return gotChanged ? newRoot : state;
}


function CompositeActionReducer(oldState: IStore, actionBatch: CompositeAction): IStore {
    // per via di thunk se arrivo qui lo stato cambia sicuro in mono-client non synchro (non ri-assegno valori equivalenti)
    // todo: ma se arrivano in ordine sbagliato da altri client? posso permetterlo?
    let actions: (ParsedAction)[] = actionBatch.actions as ParsedAction[];
    if (!actions) actions = [actionBatch] as any[]; // if it's simple action

    // estraggo le azioni derivate
    let derivedActions: ParsedAction[] = [];
    for (let action of actions) {
        switch (action.type){
            default: break;
            case CreateElementAction.type:
                const elem: DPointerTargetable = action.value;
                derivedActions.push(new SetRootFieldAction(elem.className.substr(1).toLowerCase() + 's[]', elem.id, false) as ParsedAction);
                break;
        }
    }
    actions = U.arrayMergeInPlace<ParsedAction>(actions, derivedActions);
    const possibleInconsistencies: Dictionary<DocString<'subtype'>, Pointer[]> = {};
    // normalizzo tutti i path
    for (let i = 0; i < actions.length; i++) {
        const action: ParsedAction = actions[i];
        action.path = action.field; // normalize the path
        console.log({action});
        action.pathArray = action.path.split('.');
        action.executionCount = 0;
        if (!action.subType) continue;

        if (!possibleInconsistencies[action.subType]) possibleInconsistencies[action.subType] = [ action.value ];
        else possibleInconsistencies[action.subType].push(action.value);
    }
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
    newState = updateRedundancies(newState, oldState, possibleInconsistencies);
    return newState;
}
function updateRedundancies(state: IStore, oldState:IStore, possibleInconsistencies: Dictionary<DocString<'subtype'>, (Pointer | DPointerTargetable)[]>): IStore {
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

export function reducer/*<S extends StateNoFunc, A extends Action>*/(oldState: IStore = initialState, action: Action): IStore{
    if (!oldState) { oldState = initialState = new IStore(); }
    let ca: CompositeAction;
    console.log('external REDUCER', {action, CEtype:CreateElementAction.type});
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
        default:
            if (action.type.indexOf('@@redux/') === 0) {
                //storeLoaded = true;
                return oldState;
            }
            ca = new CompositeAction([action], false);
            break;
    }
    return CompositeActionReducer(oldState, ca);
}

export function jodelInit() {
    let dClasses: string[] = RuntimeAccessibleClass.getAllNames().filter( rc => rc[0] === 'D');

    windoww.defaultContext = {$: windoww.$, getPath, React: React, Selectors, ...RuntimeAccessibleClass.getAllClassesDictionary(), ...windoww.Components};

    console.log('EXecute on read RuntimeClasses:', {dClasses, allClasses: {...RuntimeAccessibleClass.classes}});
    for (let dclassname of dClasses) {
        const dclass = RuntimeAccessibleClass.get(dclassname) as typeof DPointerTargetable;
        const lclass = RuntimeAccessibleClass.get('L' + dclassname.substr(1)) as typeof LPointerTargetable;
        dclass.logic = lclass;
        console.log('EXecute on read set singletons:', {dclass, lclass});
        if (!lclass) continue;
        lclass.singleton = new lclass();
        lclass.structure = dclass;
    }

    setTimeout( () =>createOrOpenModelTab('m3'), 1);
    // GraphDragHandler.init();

}

// ideally launched before component render, verify it. maybe move the callback to <App> component mounting
function afterStoreLoad() {
    console.error('aaaafter store load');
    jodelInit();
    IStore.fakeinit();
}
