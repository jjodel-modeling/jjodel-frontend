import {Action, CompositeAction, CreateElementAction, ParsedAction, SetFieldAction, SetRootFieldAction, Log, U, MyError, IStore} from "../../joiner";



function deepCopyButOnlyFollowingPath(state: IStore, action: ParsedAction, prevAction: ParsedAction, newVal: any) {
    let newRoot: IStore = {...state} as IStore;
    let current: any = newRoot;
    if (!action.path.length) throw new Error("path array length must be at least 1");
    let gotChanged: boolean = false; // dovrebbe cambiare sempre, se non cambia non lancio neanche l'azione e non faccio la shallow copy, ma non si sa mai, così posso evitare un render se succede l' "insuccedibile"
    let alreadyPastDivergencePoint = false; // true dal momento in cui il path dell'azione attuale e della azione precedente divergono, false fino al sotto-segmento in cui combaciano
    console.log('deepCopyButOnlyFollowingPath', arguments);
    for (let i = 0; i < action.pathArray.length; i++) {
        let key = action.pathArray[i];
        let prevActionPathKey = prevAction?.pathArray[i];
        // middle execution: not on final loop
        console.log('deepCopyButOnlyFollowingPath', {current, i, imax:action.pathArray.length, key, gotChanged, alreadyPastDivergencePoint});
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
            console.log('deepCopyButOnlyFollowingPath final', {current, i, imax:action.pathArray.length, key, gotChanged, alreadyPastDivergencePoint});
            let isArrayAppend = false;
            if (U.endsWith(key, '+=' || '[]' || '-1')) {
                key = key.substr(0, key.length - 2);
                isArrayAppend = true; }
            // perform final assignment
            if (isArrayAppend) {
                if (!Array.isArray(current[key])) throw new MyError('indexing of type "+=", "[]", or "-1" is only valid on terminal arrays, found instead:', {foundInstead: current[key], action});
                gotChanged = true;
                current.push(newVal);
            } else {
                gotChanged = current[key] !== newVal;
                current[key] = newVal;
            }
            break;
        }
        Log.exDevv('should not reach here: reducer');
    }
    return gotChanged ? newRoot : state;
}


function CompositeActionReducer(oldState: IStore, actionBatch: CompositeAction): IStore {
    // per via di thunk se arrivo qui lo stato cambia sicuro in mono-client non synchro (non ri-assegno valori equivalenti)
    // todo: ma se arrivano in ordine sbagliato da altri client? posso permetterlo?
    let actions: ParsedAction[] = actionBatch.actions as ParsedAction[];
    if (!actions) actions = [actionBatch] as any[]; // if it's simple action

    // prima normalizzo tutti i path
    for (let i = 0; i < actions.length; i++) {
        const action: ParsedAction = actions[i];
        action.path = action.field; // normalize the path
        console.log({action});
        action.pathArray = action.path.split('.');
    }
    // ordino i path con segmenti comuni
    actions = actions.sort( (a1, a2) => U.stringCompare(a1.path, a2.path))
    // destrutturo solo i nodi intermedi e solo la prima volta che li incontro (serve path ordinato)
    let newState = oldState;
    for (let i = 0; i < actions.length; i++) {
        const prevAction: ParsedAction = actions[i-1];
        const action: ParsedAction = actions[i];
        const actiontype = action.type.indexOf('@@') === 0 ? 'redux' : action.type;
        switch (action.type) {
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
            case SetFieldAction.type:
                newState = deepCopyButOnlyFollowingPath(newState, action, prevAction, action.value);
                break;
        }
        // and that's all, the reducer is really simple as actions are really simple.
    }
    return newState;
}

let initialState: IStore = null as any;

export function reducer/*<S extends StateNoFunc, A extends Action>*/(oldState: IStore = initialState, action: Action): IStore{
    if (!oldState) { oldState = initialState = new IStore(); }
    switch (action.type) {
        case CompositeAction.type:
            const ca: CompositeAction = action as CompositeAction;
            return CompositeActionReducer(oldState, ca);
        default:
            if (action.type.indexOf('@@redux/') === 0) return oldState;
            return CompositeActionReducer(oldState, new CompositeAction([action], false));
    }

}

