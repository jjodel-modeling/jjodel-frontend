import {Log} from "../../common/U";
import {DModelElement, store} from "../../joiner";

let pendingActions: Action[] = [];
let hasBegun = false;
// transactional-like start of storage modification
// todo: nested transaction che conti quanti begin hai effettuato e crei una matrice di pendingActions una per ogni livello nested?
export function BEGIN() {
    pendingActions = [];
    hasBegun = true;
}
export function ABORT() {
    hasBegun = false;
    pendingActions = [];
}
export function END() {
    hasBegun = false;
    // for (let action of pendingActions) { }
    store.dispatch({...new CompositeAction(pendingActions, true)} as CompositeAction);
    pendingActions = [];
}
make class isinstorage e mettici il path studia annotazioni per annotare gli oggett in modo che vengano rwappati prima di farli ritornare se sono annotati
// minor todo: type as (...args: infer P) => any) ?
export function TRANSACTION<F extends ((...args: any) => any)>(func: F, ...params: Parameters<F>): boolean {
    BEGIN();
    // minor todo: potrei fare l'override di Error() per fare in modo che gli errori vengano presi anche se non uso TRANSACTION o try-catch ?
    try { func(...params); } catch(e) { Log.ee('Transaction failed:', e); ABORT(); return false; }
    END();
    return true;
}

export abstract class Action {
    static type = 'ACTION';
    hasFired: number = 0;
    // targetID: string | undefined;
    // target: IClass = null as any;
    consoleTargetSelector: string = '';
    // field: string = ''; // es: ID_58
    // value: any; // es: lowerbound, name, namespace, values (for attrib-ref)...
    type: string
    constructor(public field: string, public value: any){
        this.type = (this.constructor as any).type;
    }

    fire(forceRelaunch: boolean = false): boolean {
        if (this.hasFired && !forceRelaunch) return false;
        this.hasFired++;
        if (hasBegun) {
            pendingActions.push(this);
        } else {
            console.log('firing action:', this);
            store.dispatch({...this});
        }
        return true;
    }

}
export class SetRootFieldAction extends Action {
    static type = 'SET_ROOT_FIELD';
    constructor(public field: string, public value: any) {
        super(field, value);
        this.fire();
    }
}
export class SetFieldAction extends Action {
    static type = 'SET_ME_FIELD';
    constructor(me: DModelElement, field: string, value: any) {
        super('idlookup.' + me.id + ( field ? '.' + field : ''), value);
        this.fire();
    }
}
export class CreateElementAction extends Action {
    static type = 'CREATE_ELEMENT';
    value!: DModelElement;
    constructor(me: DModelElement) {
        super('idlookup.' + me.id, me);
        this.fire();
    }
}
/*
export class IDLinkAction extends Action{
    constructor() {
        super(IDLinkAction.name,
    }
    nope, uso un proxy
}*/

export class CompositeAction extends Action {
    actions: Action[] = [];
    static type: string = 'COMPOSITE_ACTION';
    constructor(actions: Action[], launch: boolean = false) {
        super('', '');
        this.actions = actions;
        if (launch) this.fire();
    }
}

export class ParsedAction extends Action {
    path!: string; // path to a property in the store "something.like.this"
    pathArray!: string[]; // path splitted "like.1.this"
}
