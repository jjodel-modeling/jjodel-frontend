import {
    Log,
    DModelElement,
    IStore,
    Pointer,
    DPointerTargetable,
    reducer,
    store,
    windoww,
    RuntimeAccessible, RuntimeAccessibleClass, DClass, unArr, Pack1, LPointerTargetable
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

@RuntimeAccessible
export abstract class Action extends RuntimeAccessibleClass{
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
        super();
        this.field = field;
        this.value = value;
        this.type = (this.constructor as any).type;
        this.src = new Error().stack?.split('\n').splice( 2);
        this.subType = subType;
        this.className = this.constructor.name;
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
    public static new(field: string, value: any = undefined, fire: boolean = true, subType?: string): boolean { return new SetRootFieldAction(field, value, fire, subType).fire(); }
    constructor(field: string, value: any = undefined, fire: boolean = true, subType?: string) {
        super(field, value, subType);
        this.className = this.constructor.name;
        if (fire) this.fire();
    }
}

// todo: ma non so come, fare in modo che [], +=, -=, siano disponibili solo se la chiave è il nome di un attributo di tipo array
type arrayFieldNameTypes<D> = keyof D | `${string & keyof D}[]` | `${string & keyof D}+=` | `${string & keyof D}-=` | `${string & keyof D}.${number}` | `${string & keyof D}[${number}]`;
type AccessModifier = '[]' | '+=' | '-=' | `.${number}` | `[${number}]` | undefined;
@RuntimeAccessible
export class SetFieldAction extends Action {
    static type = 'SET_ME_FIELD';

    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends (AM extends undefined ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        AM extends AccessModifier = AccessModifier,
        ISPOINTER = "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override"
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: VAL, subtype?: string | undefined, accessModifier?: AM | undefined, isPointer?: ISPOINTER): boolean;
    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        AM extends AccessModifier = AccessModifier,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: string | string[], subtype: string | undefined, accessModifier: AM | undefined, isPointer: boolean): boolean;
    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        AM extends AccessModifier = AccessModifier,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: string | null | undefined | (string | null | undefined)[], subtype: string | undefined, accessModifier: AM | undefined, isPointer: boolean): boolean;
    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends (AM extends undefined ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        AM extends AccessModifier = AccessModifier,
        ISPOINTER = "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override"
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: VAL, subtype: string | undefined = undefined, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): boolean {
        return new SetFieldAction(me, field as string + accessModifier, val, subtype).fire();
    }


    // field can end with "+=", "[]", or "-1" if it's array
    protected constructor(me: DPointerTargetable | Pointer, field: string, val: any, subtype?: string) {
        Log.exDev(!me, 'BaseObject missing in SetFieldAction', {me, field, val, subtype});
        super('idlookup.' + ((me as DPointerTargetable).id || me) + ( field ? '.' + field : ''), val, subtype);
        this.className = this.constructor.name;
        // this.fire();
    }
}

/*
todo: showcase this
let dclass: DClass = null as any;
SetFieldAction.new(dclass, 'namek', '') // non è un attributo di "DCLass"
SetFieldAction.new(dclass, 'parent', '') // val (stringa) non è assegnabile a parent (array di puntatori)
SetFieldAction.new(dclass, 'name.5k', '') // non è un indice array valido
SetFieldAction.new(dclass, 'name[4k]', '') // non è un indice array valido
SetFieldAction.new(dclass, 'name[4]', '') // ok, anche se non dovrebbe accettare la dicitura array per name che è un primitivo (check non implementato, troppo difficile)
SetFieldAction.new(dclass, 'name.5', '') // ok, equivale a dicitura array
*/

@RuntimeAccessible
export class CreateElementAction extends Action {
    static type = 'CREATE_ELEMENT';
    value!: DPointerTargetable;
    public static new(me: DPointerTargetable): boolean { return new CreateElementAction(me).fire(); }
    public constructor(me: DPointerTargetable, fire: boolean = true) {
        super('idlookup.' + me.id, me);
        this.className = this.constructor.name;
        this.value = me;
        if (fire) this.fire();
    }
}

@RuntimeAccessible
export class DeleteElementAction extends SetFieldAction {
    static type = 'DELETE_ELEMENT';
    public static new(me: Pack1<LPointerTargetable>): boolean { return new DeleteElementAction(me as any).fire(); }
    constructor(me: DPointerTargetable | Pointer<DPointerTargetable>, subType?: string) {
        super((me as DPointerTargetable).id || me, '', subType);
        this.className = this.constructor.name;
        this.fire();
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

    public static new(actions: Action[], launch: boolean = true): CompositeAction { return new CompositeAction(actions, launch); }
    constructor(actions: Action[], launch: boolean = false) {
        super('', '');
        this.actions = actions;
        if (launch) this.fire();
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export class ParsedAction extends Action {
    path!: string; // path to a property in the store "something.like.this"
    pathArray!: string[]; // path splitted "like.1.this"
    executionCount!: number;
}
