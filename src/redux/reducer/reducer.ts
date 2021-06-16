import {initialState, IStore} from "../store";
import {Action} from "../action/action";

function modelPieceSelector(modelPieecID: string): string[] { return ["packages", "5", "classes", "3", " path example inside the current state"]; }


function deepCopyButOnlyFollowingPath(state: IStore, path: string[], newVal: any) {
    let newRoot: IStore = {...state};
    let current: any = newRoot;
    if (!path.length) throw new Error("path array length must be at least 1");
    let gotChanged: boolean = false; // dovrebbe cambiare sempre, se non cambia non lancio neanche l'azione e non faccio la shallow copy, ma non si sa mai, così posso evitare un render se succede l' "insuccedibile"
    for (let i = 0; true; i++) {
        let key = path[i];
        if (i !== path.length - 1) {
            current[key] = {...current[key]};
            current = current[key];
            continue; }
        gotChanged = current[key] === newVal;
        current[key] = newVal;
        break;
    }
    return gotChanged ? newRoot : state;
}

function reducerExample(oldState: IStore, action: Action): IStore {
    // per via di thunk se arrivo qui lo stato cambia sicuro in mono-client non synchro (non ri-assegno valori equivalenti)
    // todo: ma se arrivano in ordine sbagliato da altri client? posso permetterlo?

    // and that's all, the reducer is really simple as actions are really simple.
    return deepCopyButOnlyFollowingPath(oldState, modelPieceSelector(action.consoleTargetSelector + "." + action.field), action.value);
}

export function reducer/*<S extends StateNoFunc, A extends Action>*/(oldState: IStore = initialState, action: Action): IStore{
    return reducerExample(oldState, action);
}

