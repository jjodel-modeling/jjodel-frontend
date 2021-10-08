import {
    Log,
    DModelElement,
    IStore,
    Pointer,
    DPointerTargetable,
    reducer,
    store,
    windoww,
    RuntimeAccessible
} from "../../joiner";

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
export function END(): boolean | IStore {
    hasBegun = false;
    // for (let action of pendingActions) { }
    const ca: CompositeAction = new CompositeAction(pendingActions, false);
    pendingActions = [];
    return ca.fire();
}

// make class isinstorage e mettici il path studia annotazioni per annotare gli oggett in modo che vengano rwappati prima di farli ritornare se sono annotati
// minor todo: type as (...args: infer P) => any) ?
export function TRANSACTION<F extends ((...args: any) => any)>(func: F, ...params: Parameters<F>): boolean | IStore {
    BEGIN();
    // minor todo: potrei fare l'override di Error() per fare in modo che gli errori vengano presi anche se non uso TRANSACTION o try-catch ?
    try { func(...params); } catch(e) { Log.ee('Transaction failed:', e); ABORT(); return false; }
    return END();
}

export abstract class Action {
    static type = 'ACTION';
    static SubType: {
        vertexSubElements: 'vertexSubElements',
        vertexSize: 'vertexSize'
    };
    hasFired: number = 0;
    // targetID: string | undefined;
    // target: IClass = null as any;
    consoleTargetSelector: string = '';
    // field: string = ''; // es: ID_58
    // value: any; // es: lowerbound, name, namespace, values (for attrib-ref)...
    type: string;
    public field: string;
    public value: any;
    private src?: string[];
    subType?: string;
    constructor(field: string, value: any, subType?: string){
        this.field = field;
        this.value = value;
        this.type = (this.constructor as any).type;
        this.src = new Error().stack?.split('\n').splice( 2);
        this.subType = subType;
    }

    fire(forceRelaunch: boolean = false): boolean {
        if (this.hasFired && !forceRelaunch) return false;
        this.hasFired++;
        if (hasBegun) {
            pendingActions.push(this);
        } else {
            let storee = store || windoww.store;
            console.log('firing action:', this, 'store:', storee);
            storee.dispatch({...this});
        }
        return true;
    }

}
@RuntimeAccessible
export class SetRootFieldAction extends Action {
    static type = 'SET_ROOT_FIELD';
    constructor(field: string, value: any, fire: boolean = true, subType?: string) {
        super(field, value, subType);
        if (fire) this.fire();
    }
}

@RuntimeAccessible
export class SetFieldAction extends Action {
    static type = 'SET_ME_FIELD';
    constructor(me: DPointerTargetable | Pointer<DPointerTargetable>, field: string, val: any, subtype?: string) {
        super('idlookup.' + ((me as DPointerTargetable).id || me) + ( field ? '.' + field : ''), val, subtype);
        this.fire();
    }
}

@RuntimeAccessible
export class CreateElementAction extends Action {
    static type = 'CREATE_ELEMENT';
    value!: DPointerTargetable;
    constructor(me: DPointerTargetable) {
        super('idlookup.' + me.id, me);
        this.value = me;
        this.fire();
    }
}

@RuntimeAccessible
export class DeleteElementAction extends SetFieldAction {
    static type = 'DELETE_ELEMENT';
    constructor(me: DPointerTargetable | Pointer<DPointerTargetable>, subType?: string) {
        super((me as DPointerTargetable).id || me, '', subType);
    }
}
/*

@RuntimeAccessible
export class IDLinkAction extends Action{
    constructor() {
        super(IDLinkAction.name,
    }
    nope, uso un proxy
}*/

@RuntimeAccessible
export class CompositeAction extends Action {
    static type: string = 'COMPOSITE_ACTION';
    actions: Action[] = [];
    constructor(actions: Action[], launch: boolean = false) {
        super('', '');
        this.actions = actions;
        if (launch) this.fire();
    }
}

@RuntimeAccessible
export class ParsedAction extends Action {
    path!: string; // path to a property in the store "something.like.this"
    pathArray!: string[]; // path splitted "like.1.this"
    executionCount!: number;
}
