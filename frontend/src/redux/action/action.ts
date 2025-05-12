import {
    Constructors,
    Dictionary,
    DocString,
    DPointerTargetable,
    DState,
    DUser,
    GObject,
    Json,
    Log,
    LPointerTargetable,
    orArr,
    Pack1,
    Pointer,
    Pointers,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    store,
    U,
    unArr,
    windoww
} from "../../joiner";

// transactional-like start of storage modification
// todo: nested transaction che conti quanti begin hai effettuato e crei una matrice di pendingActions una per ogni livello nested?

/*
// let nestedlevel: number = 0;
class NestedLevel{
    level: number;
    actions: Action[] = [];
    up:NestedLevel[] = [];
    down?:NestedLevel;

    constructor(prevLevel?: NestedLevel, actions: Action[] = []) {
        // this.prev = prev;
        this.down = prevLevel;
        this.actions = actions;
        this.level = prevLevel ? prevLevel.level + 1 : 0;
    }

    add1(a:Action){ this.actions.push(a); }
    add(a:Action[]){ this.actions.push(...a); }
    push(actions:Action[]=[]){
        this.up.push(new NestedLevel(this, actions));
    }
}
// @Singleton
class NestedTransactionManager{
    // private levels: NestedLevel[] = [];
    public currentLevel?: NestedLevel;
    // simple array is not good i can have spikes as russian mountains going up and down in deepness it's kinda a matrix or a pile of dishes like below'


    /*
    todo: to debug missing END paired with a begin, seve stack trace of begins and ends
    * every level must have his own array?
    * Begin0, Begin1, Begin2, End2, End1, Begin1.1 Begin 1.2....
    it's a tree!
    *
    *
    * ______begin lv2                              _______Begin1.2
    * _________________________begin lv1           ___________________Begin1.1
    * ____________________________________________________________________________________________________ a begin lv0
    * * /
    constructor() {}
    begin(actions: Action[]=[]): void { this.pushLevel(actions); }
    pushLevel(actions: Action[]=[]): void {
        if (!this.currentLevel) { this.currentLevel = new NestedLevel(undefined, actions); return; }
        this.currentLevel.push(actions); }
    end(){
        if (!this.currentLevel) return this.finalEnd();
        this.currentLevel = this.currentLevel?.down; }
    finalEnd(){

    }
    // current(): NestedLevel { return this.currentLevel; }
    addActions(a:Action[]): void { this.currentLevel!.add(a); }
    addAction(a:Action): void { this.currentLevel!.add1(a); }
}
let transactionmanager = new NestedTransactionManager();
function BEGIN2(){
    transactionmanager.pushLevel();
}
function ABORT2(){
    transactionmanager.end();
}
function END2(){

}*/

class TransactionStatus{
    pendingActions: Action[] = [];
    hasBegun: boolean = false;
    hasAborted: boolean = false;
    transactionDepthLevel: number = 0;
}
let t = new TransactionStatus();
windoww.transactionStatus = t;

export function BEGIN() {
    if (t.transactionDepthLevel === 0) t.hasAborted = false;
    t.hasBegun = true; // redundant but actions are reading this, minimize changes
    t.transactionDepthLevel++;
    if (!inCommit) windoww.updateDebuggerComponent();
    // console.warn('TRANSACTION BEGIN', {depth: t.transactionDepthLevel});

}
export function ABORT(): boolean {
    let ret: boolean = t.transactionDepthLevel > 0;
    t.hasAborted = true; // at any depth level since i have only a flat TRANSACTION array
    //END(); // abort cannot call end, otherwise if i do a TRANSACTION (() => if(x) ABORT()) it risks calling END() twice.
    return ret;
}
let inCommit = false;
// if without parameter: commits the current pending stuff, with parameter: fires the action ignoring transaction block while keeping te transaction active
export function COMMIT(action?:Action, deep: boolean = true): boolean {
    let olddepth = t.transactionDepthLevel;
    if (deep && olddepth<=0) { // not deep, but must not be triggered during setInterval buffer aggregator
        END(); //just safety to restore has begun state.
        action?.fire();
        return false;
    }
    inCommit = true;
    if (deep) t.transactionDepthLevel = 1;
    END(); // triggers FINAL_END
    action?.fire();
    if (deep) t.transactionDepthLevel = olddepth-1;
    BEGIN();
    inCommit = false;
    return true;
}

export function END(actionstoPrepend: Action[] = [], path?: string, oldval?: any, newval?: any, desc?:string): boolean {
    t.transactionDepthLevel--;
    if (!inCommit) windoww.updateDebuggerComponent();
    // console.warn('TRANSACTION END', {depth: t.transactionDepthLevel});
    if (actionstoPrepend.length) t.pendingActions = [...actionstoPrepend, ...t.pendingActions];

    if (t.transactionDepthLevel < 0) { console.error("mismatching END()"); t.transactionDepthLevel = 0; }
    if (t.transactionDepthLevel === 0) return FINAL_END(path, oldval, newval, desc);
    return false;
}
function FINAL_END(path?: string, oldval?: any, newval?: any, desc?:string): boolean{
    t.hasBegun = false;
    // pendingActions.sort( (a, b) => a.timestamp - b.timestamp)
    if (t.hasAborted) {
        t.pendingActions = [];
        t.hasAborted = false;
        return false;
    }
    const ca: CompositeAction = new CompositeAction(t.pendingActions, false);
    if (lastDescription) {
        path = lastDescription.name;
        oldval = lastDescription.oldval;
        newval = lastDescription.newval;
        desc = lastDescription.desc;
        lastDescription = undefined;
    }
    if (path) ca.descriptor = new ActionDescriptor(path, oldval, newval, desc);
    t.pendingActions = [];
    return ca.fire();
}
export class ActionDescriptor{
    path?: string;
    desc?: string;
    oldval: any;
    newval: any;
    public constructor (path?: string, oldval?: any, newval?: any, desc?:string){
        this.path = path;
        this.oldval = oldval;
        this.newval = newval;
        this.desc = desc;
    }
}
type NotPromise<T> = T extends Promise<any> ? never : T;

type NoAsyncFn<
    T extends (...args: any)=>any,
    ReturnsPromise extends (...args: any)=>any = ReturnType<T> extends Promise<any> ? never:T
    >=ReturnsPromise;

let lastDescription: {name: string, oldval: any, newval: any, desc?: string} | undefined = undefined;
(window as any).getLastDesc = () => lastDescription;
// make class isinstorage e mettici il path studia annotazioni per annotare gli oggett in modo che vengano rwappati prima di farli ritornare se sono annotati
// minor todo: type as (...args: infer P) => any) ?
// NB: cannot be async, it changes execution order and break many codes where return value is determined in a transaction.
// also because BEGIN() becomes stuck and actions cannot fire until the server replies or times out.
// export function TRANSACTION<F extends (...args: any)=>any>(func: NoAsyncFn<F>, ...params: Parameters<F>): boolean | DState {
export async function TRANSACTION(name:string, func: ()=> void, oldval?: any, newval?: any, desc?:string): Promise<boolean> {
//export function TRANSACTION<F extends NoAsyncFn)>(func: F, ...params: Parameters<F>): boolean | DState {
    BEGIN();
    if (!lastDescription) lastDescription = {name, oldval, newval, desc};
    let e: Error = null as any;
    try {
        let lenient = false as boolean;
        if (lenient || !t.hasAborted) await func();
    } catch (err: any) { e = err; ABORT(); }
    if (t.hasAborted) {
        if (e) Log.ee('Transaction failed:', e, {depth:t.transactionDepthLevel});
        else {
            Log.ee('Transaction aborted.', {depth: t.transactionDepthLevel});
        }
    }
    return END([]);
}
(window as any).TRANSACTION = TRANSACTION;
(window as any).BEGIN = BEGIN;
(window as any).ABORT = ABORT;
(window as any).COMMIT = COMMIT;
(window as any).END = END;
(window as any).FINAL_END = FINAL_END;
(window as any).maxActionFiring = 0;

// todo: ma non so come, fare in modo che [], +=, -=, siano disponibili solo se la chiave è il nome di un attributo di tipo array
type arrayFieldNameTypes<D> = keyof D | `${string & keyof D}[]` | `${string & keyof D}+=` | `${string & keyof D}-=` | `${string & keyof D}.${number}` | `${string & keyof D}[${number}]`;
type AccessModifier = '' | '[]' | '+=' | '-=' | `.${number}` | `[${number}]` | undefined;
type StrictExclude<T, U> = T extends U ? U extends T ? never : T : T;

@RuntimeAccessible('Action')
export class Action extends RuntimeAccessibleClass {
    public static cname: string = "Action";
    public static maxCounter: number = 1;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    static type = 'ACTION';
    static SubType: {
        vertexSubElements: 'vertexSubElements',
        vertexSize: 'vertexSize'
    };
    field: string;
    value: any;
    id: Pointer;
    timestamp: number;
    sender: Pointer<DUser>;
    hasFired: number = 0;
    // targetID: string | undefined;
    // target: IClass = null as any;
    consoleTargetSelector: string = '';
    // field: string = ''; // es: ID_58
    // value: any; // es: lowerbound, name, namespace, values (for attrib-ref)...
    type: string;
    // private src?: string[];
    subType?: string; //?
    private stack?: string[];
    protected constructor(field: string, value: any, subType?: string) {
        super();
        this.id = 'Action_' + Date.now() + "_" + Action.maxCounter++; // NB: the prefix must be the same for all actions because it must not affect order
        this.timestamp = Date.now();
        this.sender = DUser.current;
        this.field = field;
        this.value = value;
        this.type = (this.constructor as any).type;
        this.stack = new Error().stack?.split('\n').splice( 4);
        this.subType = subType;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }

    // forces the action to fire alone ignoring a TRANSACTION or BEGIN/END blocks
    commit(): boolean{
        return COMMIT(this);
    }
    fire(forceRelaunch: boolean = false): boolean {
        if (this.hasFired && !forceRelaunch) return false;
        if (this.value && this.value.__isProxy) {
            Log.ee("Attempted to set a proxy object inside the store.", {action:this, value: this.value});
            return false;
        }
        this.hasFired++;
        if (t.hasBegun) {
            t.pendingActions.push(this);
        } else {
            // if ((window as any).maxActionFiring++ >= 400) return false;
            let storee = store || windoww.store;
            let printobj: GObject = {};
            if (this.className === CompositeAction.cname) {
                let ca: CompositeAction = this as any;
                printobj.title = ca.descriptor?.path;
                printobj.desc = ca.descriptor;
                printobj.n = ca.actions?.length || 1;
            }
            else {
                printobj.field = this.field;
                printobj.val = this.value
            }
            printobj['this'] = this;
            printobj['stack'] = this.stack;
            console.log('firing action:', printobj);
            storee.dispatch({...this});
        }
        return true;
    }

    public static possibleInconsistencies: Dictionary<DocString<'subtype'>, Pointer[]> = {};
    private static parse1(action: Action): ParsedAction {
        const ret: ParsedAction = action as any;
        ret.path = action.field; // normalize the path
        ret.pathArray = ret.path.split('.');
        ret.executionCount = 0;
        if (!action.subType) return ret;
        if (!Action.possibleInconsistencies[action.subType]) Action.possibleInconsistencies[action.subType] = [ action.value ];
        else Action.possibleInconsistencies[action.subType].push(action.value);
        return ret;
    }

    static parse<T extends Action | Action[], RET extends T extends any[] ? ParsedAction[] : ParsedAction>(actions: T): RET {
        if ((actions as Action).className === CompositeAction.cname) throw new Error("Composite action cannot be parsed directly, parse composite.actions instead");
        if (!Array.isArray(actions)) return Action.parse1(actions) as RET;
        return actions.map( Action.parse1 ) as RET;
    }

    static fromJson(json: Json): Action{
        let action = new Action('dummy', 'dummy');
        for(let key in action) delete (action as GObject)[key]; // resetting the action
        for(let key in json) (action as any)[key] = json[key];
        return action;
    }
}

@RuntimeAccessible('LoadAction')
export class LoadAction extends Action {
    public static cname: string = "LoadAction";
    static type = 'LOAD';
    static new(state: DState | GObject): boolean { return state && new LoadAction(state).fire(); }
    static create(state: DState | GObject): LoadAction { return state && new LoadAction(state); }

    constructor(state: DState | GObject, fire: boolean = true) {
        super('', state, '');
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        if (fire) this.fire();
    }
}

@RuntimeAccessible('SetRootFieldAction')
export class SetRootFieldAction extends Action {
    public static cname: string = "SetRootFieldAction";
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    static type = 'SET_ROOT_FIELD';
    isPointer: boolean;

    static create(fullpath: string, val: string | string[], accessModifier: AccessModifier | undefined, isPointer: boolean): SetRootFieldAction;
    static create<
        VAL extends any,
        PATH extends VAL extends string | string[] ? 'must specify "isPointer" parameter' : string,
        // VAL extends (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        /*VAL extends (AM extends undefined | '' ? (D[T] extends any[] ? StrictExclude<D[T], string[]> : StrictExclude<D[T], string>) :
            (AM extends '-=' ?
                number[] :
                (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<StrictExclude<D[T], string>> | StrictExclude<D[T], string> | (StrictExclude<D[T], string>)[] : '_error_'))),
        */
        ISPOINTER extends boolean,
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(fullpath: PATH, val: VAL, accessModifier?: AM | undefined, isPointer?: ISPOINTER): SetRootFieldAction;
    static create<
        T extends string,
        VAL extends any,
        ISPOINTER extends boolean,
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(fullpath: T, val: VAL, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): SetRootFieldAction {
        if (accessModifier) (fullpath as any) += accessModifier;
        return new SetRootFieldAction(fullpath, val, false, isPointer);
    }
    static new(...a:Parameters<(typeof SetRootFieldAction)["create"]>): boolean{ return SetRootFieldAction.create(...a).fire();}

    protected constructor(fullpath: string, value: any = undefined, fire: boolean = true, isPointer: boolean = false) {
        super(fullpath, value, undefined);
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        this.isPointer = isPointer;
        if (fire) this.fire();
    }

    static create_old<
        T extends string,
        VAL extends any,
        ISPOINTER extends boolean,
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(tocheck:never, fullpath: T, val: VAL, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): SetRootFieldAction {
        return new SetRootFieldAction(fullpath + (accessModifier || ''), val, false, isPointer);
    }
    fire(forceRelaunch: boolean = false, doChecks: boolean = true): boolean {
        /* no need, the reducer should return old state in this case. verify it!
        if (doChecks) {
            // if action would not change the value, i don't fire it at all
            let s: GObject<DState> = store.getState();
            let field = (this.field||'');
            let accessOperator: string = field.substring(field.length-2);
            let fieldpath: string[] = field.split(".");
            switch(accessOperator){
                default:
                case "-=":
                case "+=":
            }
            // path can end with -=, +=, [] etc, but it's fine if i check it as if it was part of the name like object["fieldname+="]
            // because in all those cases
            if (s[this.field] === this.value) return false;
        }*/
        return super.fire(forceRelaunch);
    }
}

@RuntimeAccessible('SetFieldAction')
export class SetFieldAction extends SetRootFieldAction {
    static type = 'SET_ME_FIELD';

    static create<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends
            D[T] extends string | string[] ? 'must specify "isPointer" parameter' :
                (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        // VAL extends (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        /*VAL extends (AM extends undefined | '' ? (D[T] extends any[] ? StrictExclude<D[T], string[]> : StrictExclude<D[T], string>) :
            (AM extends '-=' ?
                number[] :
                (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<StrictExclude<D[T], string>> | StrictExclude<D[T], string> | (StrictExclude<D[T], string>)[] : '_error_'))),
        */
        ISPOINTER extends boolean | "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override",
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>,
          field: T,
          val: VAL,
          accessModifier?: AM | undefined,
          isPointer?: ISPOINTER): SetFieldAction;
    static create<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends AM extends '' | undefined ? orArr<string | null | undefined> :
            (AM extends '-=' ? orArr<number> :
                (AM extends '+=' ? orArr<string | null | undefined> : '_am_typeerror_')),
        AM extends AccessModifier | undefined = undefined,
        >(me: D | Pointer<D>, field: T,
          val: VAL,
          accessModifier: AM,
          isPointer: boolean): SetFieldAction;
    static create<
        D extends DPointerTargetable,
        T extends string & (keyof D),
        VAL extends (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        ISPOINTER extends boolean | "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override",
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: VAL, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): SetFieldAction {
        if (accessModifier) (field as any) += accessModifier;
        return new SetFieldAction(me, field, val, false, isPointer as boolean);
    }


    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends
            D[T] extends string | string[] ? 'must specify "isPointer" parameter' :
                (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        // VAL extends (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        /*VAL extends (AM extends undefined | '' ? (D[T] extends any[] ? StrictExclude<D[T], string[]> : StrictExclude<D[T], string>) :
            (AM extends '-=' ?
                number[] :
                (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<StrictExclude<D[T], string>> | StrictExclude<D[T], string> | (StrictExclude<D[T], string>)[] : '_error_'))),
        */
        ISPOINTER extends boolean | "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override",
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>,
          field: T,
          val: VAL,
          accessModifier?: AM | undefined,
          isPointer?: ISPOINTER): boolean;
    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends AM extends '' | undefined ? orArr<string | null | undefined> :
            (AM extends '-=' ? orArr<number> :
                (AM extends '+=' ? orArr<string | null | undefined> : '_am_typeerror_')),
        AM extends AccessModifier | undefined = undefined,
        >(me: D | Pointer<D>, field: T,
          val: VAL,
          accessModifier: AM,
          isPointer: boolean): boolean;
    static new<
        D extends DPointerTargetable,
        T extends string & (keyof D),
        VAL extends (AM extends undefined | '' ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        ISPOINTER extends boolean | "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override",
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: VAL, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): boolean {
        if (accessModifier) (field as any) += accessModifier;
        return new SetFieldAction(me, field, val, false, isPointer as boolean).fire();
    }



    me: Pointer | DPointerTargetable;
    me_field: string;
    // field can end with "+=", "[]", or "-1" if it's array
    protected constructor(me: DPointerTargetable | Pointer, field: string, val: any, fire: boolean = true, isPointer: boolean = false) {
        Log.exDev(!me, 'BaseObject missing in SetFieldAction', {me, field, val});
        super('idlookup.' + ((me as DPointerTargetable).id || me) + ( field ? '.' + field : ''), val, false, isPointer);
        this.me = me;
        this.me_field = field;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        if (fire) this.fire();
    }

    fire(forceRelaunch: boolean = false): boolean {
        let fire = this.fire0(forceRelaunch);
        return fire;

    }
    fire0(forceRelaunch: boolean = false): boolean {
        return super.fire(forceRelaunch, false);
        // IMPORTANT system discarded!
        // if in a composite action there are 2 editos on the same value, like like a.v = 1; a.v = 0; if v initial value was 0 this would accept a.v=1 and refuse a.v=0;
        // this is making an issue in containment lvalue.values = lvalue.values
        // because the values are first disconnected to model, then reconnected to .father=lvalue. but the second command is not firing.


    /*
        // if action would not change the value, i don't fire it at all
        // by id because if item was updated, this.me as DElement might be an old version, different from the one in store.
        let d: GObject<any> = DPointerTargetable.from((this.me as DPointerTargetable)?.id || this.me as any);
        // console.warn("me fire", {thiss:this, d, typeofd:typeof d, field:this.me_field, dfield:d[this.me_field], val:this.value});
        if (d && typeof d === "object") {
            let oldv = U.followPath(d, this.me_field);
            console.log('set value index firing 0', {ov:d[this.me_field], me_field:this.me_field, oldv, d, newv:this.value});
            if (oldv === this.value) return false;
        }
        return super.fire(forceRelaunch, false);*/
    }
}




/*
could put in documentation
let dclass: DClass = null as any;
SetFieldAction.new(dclass, 'namek', '') // non è un attributo di "DCLass"
SetFieldAction.new(dclass, 'parent', '') // val (stringa) non è assegnabile a parent (array di puntatori)
SetFieldAction.new(dclass, 'name.5k', '') // non è un indice array valido
SetFieldAction.new(dclass, 'name[4k]', '') // non è un indice array valido
SetFieldAction.new(dclass, 'name[4]', '') // ok, anche se non dovrebbe accettare la dicitura array per name che è un primitivo (check non implementato, troppo difficile)
SetFieldAction.new(dclass, 'name.5', '') // ok, equivale a dicitura array
*/

@RuntimeAccessible('RedoAction')
export class RedoAction extends Action {
    public static cname: string = "RedoAction";
    static type = 'RedoAction';
    forUser: Pointer<DUser>

    public static new<F extends boolean = true>(amount: number = 1, forUser:Pointer<DUser>, fire: F = true as F):
        (F extends true ? boolean : (F extends undefined ? UndoAction : UndoAction)) {
        let act = new RedoAction(amount, forUser);
        if (fire) return act.fire() as any;
        return act as any;

    }
    private constructor(amount: number = 1, forUser:Pointer<DUser>) {
        super('', amount);
        this.forUser = forUser;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }
}

@RuntimeAccessible('UndoAction')
export class UndoAction extends Action {
    public static cname: string = "UndoAction";
    static type = 'UndoAction';
    forUser: Pointer<DUser>;
    public static new<F extends boolean = false>(amount: number = 1, forUser:Pointer<DUser>, fire: F = true as F):
        (F extends true ? boolean : (F extends undefined ? UndoAction : UndoAction)) {
        let act = new UndoAction(amount, forUser);
        if (fire) return act.fire() as any;
        return act as any;
    }
    private constructor(amount: number = 1, forUser:Pointer<DUser>) {
        super('', amount);
        this.forUser = forUser;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }
}

// todo: delete or find original idea back
@RuntimeAccessible('CombineHistoryAction')
export class CombineHistoryAction extends Action {
    public static cname: string = "CombineHistoryAction";
    static type = 'CombineHistoryAcCombineHistoryActiontion';
    public static new<F extends boolean = true>(notfire?: F): (F extends false ? boolean : CombineHistoryAction) {
        let act = new CombineHistoryAction();
        if (!notfire) return act.fire() as any;
        return act as any;
    }
    private constructor() {
        super('', '');
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }
}

@RuntimeAccessible('CreateElementAction')
export class CreateElementAction extends Action {
    public static cname: string = "CreateElementAction";
    static type = 'CREATE_ELEMENT';
    value!: DPointerTargetable;
    public static newBatch<F extends boolean = true>(me: DPointerTargetable[], notfire?: F): (F extends false ? boolean : CreateElementAction)[]{
        let ret: any[] = [];
        if (!me.length) return [] as any;
        let types = [...new Set(me.map(e=>e?.className))];
        let typedesc = types.length > 1 ? ' objects of mixed types.' : me[0].className + 'objects.';
        TRANSACTION('Created '+me.length+' '+typedesc, ()=>(ret = me.map( (e) => CreateElementAction.new(e, notfire))));
        return ret;
    }

    public static create<F extends boolean = true>(me: DPointerTargetable): CreateElementAction {
        if ((me as LPointerTargetable).__raw) me = (me as LPointerTargetable).__raw;
        return new CreateElementAction(me, true);
    }
    public static new<F extends boolean = true>(me: DPointerTargetable, notfire?: F): (F extends false ? boolean : CreateElementAction) {
        let act = CreateElementAction.create(me);
        if (!notfire) return act.fire() as any;
        return act as any;
    }
    private constructor(me: DPointerTargetable, fire: boolean = true) {
        super('idlookup.' + me.id, me);
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        this.value = me;
        if (fire) this.fire();
    }
    public fire(forceRelaunch: boolean = false): boolean {
        let ret = false;
        TRANSACTION('Create ' + this.value?.className, () => {
            ret = super.fire(forceRelaunch);
            if (this.value._derivedSubElements || this.value._persistCallbacks) { Constructors.persist(this.value, true); }
        });
        return ret;
    }
}

@RuntimeAccessible('DeleteElementAction')
export class DeleteElementAction extends SetFieldAction {
    static type = 'DELETE_ELEMENT';
    public static create(me: Pack1<LPointerTargetable>): DeleteElementAction { return new DeleteElementAction(me as any); }
    public static new(me: Pack1<LPointerTargetable>): boolean { return new DeleteElementAction(me as any).fire(); }

    constructor(me: Pack1<LPointerTargetable>) {
        super(Pointers.from(me), '', undefined);
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
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

@RuntimeAccessible('CompositeAction')
export class CompositeAction extends Action {
    static type: string = 'COMPOSITE_ACTION';
    actions: Action[] = [];
    descriptor?: ActionDescriptor;

    public static new(actions: Action[], launch: boolean = true): CompositeAction { return new CompositeAction(actions, launch); }
    constructor(actions: Action[], launch: boolean = false) {
        super('', '');
        this.actions = actions;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
        if (launch) this.fire();
    }
    fire(forceRelanch?: boolean): boolean{
        if (!this.actions.length) return false;
        return super.fire(forceRelanch);
    }
}

@RuntimeAccessible('ParsedAction')
export class ParsedAction extends SetRootFieldAction {
    // NB: actually this is never created but "converted" from other actions by adding fields
    path!: string; // path to a property in the store "something.like.this"
    pathArray!: string[]; // path splitted "like.1.this"
    executionCount!: number;
}


RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, Action);
RuntimeAccessibleClass.set_extend(Action, LoadAction);
RuntimeAccessibleClass.set_extend(Action, SetRootFieldAction);
RuntimeAccessibleClass.set_extend(SetRootFieldAction, SetFieldAction);
RuntimeAccessibleClass.set_extend(SetFieldAction, DeleteElementAction);
RuntimeAccessibleClass.set_extend(Action, RedoAction as any);
RuntimeAccessibleClass.set_extend(Action, UndoAction as any);
RuntimeAccessibleClass.set_extend(Action, CreateElementAction as any);
RuntimeAccessibleClass.set_extend(Action, CombineHistoryAction as any);
RuntimeAccessibleClass.set_extend(Action, CompositeAction as any);
RuntimeAccessibleClass.set_extend(SetRootFieldAction, ParsedAction as any);
