import {
    Dictionary,
    DocString,
    DPointerTargetable, DUser,
    IStore, Json,
    Log,
    LPointerTargetable,
    orArr,
    Pack1,
    Pointer,
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

export function BEGIN_OLD() {
    pendingActions = [];
    hasBegun = true;
}
export function ABORT_OLD() {
    hasBegun = false;
    pendingActions = [];
}
export function END_OLD(actionstoPrepend: Action[] = []): boolean | IStore {
    hasBegun = false;
    // for (let action of pendingActions) { }
    const ca: CompositeAction = new CompositeAction( actionstoPrepend?.length ? [...actionstoPrepend, ...pendingActions] : pendingActions, false);
    pendingActions = [];
    return ca.fire();
}

let pendingActions: Action[] = [];
let hasBegun = false;
let deepnessLevel = 0;

export function BEGIN() {
    hasBegun = true; // redundant but actions are reading this, minimize changes
    deepnessLevel++;
}
export function ABORT() {
    deepnessLevel--;
    pendingActions = [];
}
export function END(actionstoPrepend: Action[] = []): boolean {
    deepnessLevel--;
    if (actionstoPrepend.length) pendingActions = [...actionstoPrepend, ...pendingActions];

    if (deepnessLevel < 0) { console.error("mismatching END()"); deepnessLevel = 0; }
    if (deepnessLevel === 0) return FINAL_END();
    return false;
}
export function FINAL_END(): boolean{
    hasBegun = false;
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
export class Action extends RuntimeAccessibleClass {
    static type = 'ACTION';
    static SubType: {
        vertexSubElements: 'vertexSubElements',
        vertexSize: 'vertexSize'
    };
    id: Pointer;
    sender: Pointer<DUser>;
    token: Pointer<DUser>;
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
    private stack?: string[];
    subType?: string; //?
    protected constructor(field: string, value: any, subType?: string){
        super();
        this.id = 'Pointer_' + Date.now();
        this.sender = DUser.current;
        this.token = DUser.token;
        this.field = field;
        this.value = value;
        this.type = (this.constructor as any).type;
        this.src = new Error().stack?.split('\n').splice( 4);
        this.subType = subType;
        this.className = this.constructor.name;
    }

    fire(forceRelaunch: boolean = false): boolean {
        if (this.hasFired && !forceRelaunch) return false;
        if (hasBegun) {
            pendingActions.push(this);
        } else {
            this.hasFired++;
            let storee = store || windoww.store;
            console.log('firing action:', {field: this.field, val: this.value, stack:this.src, thiss:this});
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
        if ((actions as Action).className === CompositeAction.name) throw new Error("Composite action cannot be parsed directly, parse composite.actions instead");
        if (!Array.isArray(actions)) return Action.parse1(actions) as RET;
        return actions.map( Action.parse1 ) as RET;
    }

    static fromJson(json: Json): Action{
        let action = new Action('dummy', 'dummy');
        for(let key in json) (action as any)[key] = json[key];
        return action;
    }
}
@RuntimeAccessible
export class LoadAction extends Action {
    static type = 'LOAD';
    static new(state: IStore): boolean {  return state && new LoadAction(state).fire(); }
    constructor(state: IStore, fire: boolean = true) {
        super('', state, '');
        this.className = this.constructor.name;
        if (fire) this.fire();
    }
}

@RuntimeAccessible
export class SetRootFieldAction extends Action {
    static type = 'SET_ROOT_FIELD';
    isPointer: boolean;



    static new(fullpath: string, val: string | string[], accessModifier: AccessModifier | undefined, isPointer: boolean): boolean;
    static new<
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
        >(fullpath: PATH, val: VAL, accessModifier?: AM | undefined, isPointer?: ISPOINTER): boolean;
    static new<
        T extends string,
        VAL extends any,
        ISPOINTER extends boolean,
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(fullpath: T, val: VAL, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): boolean {
        if (accessModifier) (fullpath as any) += accessModifier;
        return new SetRootFieldAction(fullpath, val, false, isPointer).fire();
    }

    protected constructor(fullpath: string, value: any = undefined, fire: boolean = true, isPointer: boolean = false) {
        super(fullpath, value, undefined);
        this.className = this.constructor.name;
        this.isPointer = isPointer;
        if (fire) this.fire();
    }

    static create<
        T extends string,
        VAL extends any,
        ISPOINTER extends boolean,
        AM extends AccessModifier | undefined = undefined,
        // T extends arrayFieldNameTypes<D> = any
        >(fullpath: T, val: VAL, accessModifier: AM | undefined = undefined, isPointer?: ISPOINTER): SetRootFieldAction {
        return new SetRootFieldAction(fullpath + (accessModifier || ''), val, false, isPointer);
    }
}

// todo: ma non so come, fare in modo che [], +=, -=, siano disponibili solo se la chiave è il nome di un attributo di tipo array
type arrayFieldNameTypes<D> = keyof D | `${string & keyof D}[]` | `${string & keyof D}+=` | `${string & keyof D}-=` | `${string & keyof D}.${number}` | `${string & keyof D}[${number}]`;
type AccessModifier = '' | '[]' | '+=' | '-=' | `.${number}` | `[${number}]` | undefined;


type StrictExclude<T, U> = T extends U ? U extends T ? never : T : T;

@RuntimeAccessible
export class SetFieldAction extends SetRootFieldAction {
    static type = 'SET_ME_FIELD';
/*
    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        AM extends AccessModifier | undefined = ''
        >(me: D | Pointer<D>,
          field: T,
          val: string | string[],
          accessModifier: AM | undefined,
          isPointer: boolean): boolean;*/
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


    // field can end with "+=", "[]", or "-1" if it's array
    protected constructor(me: DPointerTargetable | Pointer, field: string, val: any, fire: boolean = true, isPointer: boolean = false) {
        Log.exDev(!me, 'BaseObject missing in SetFieldAction', {me, field, val});
        super('idlookup.' + ((me as DPointerTargetable).id || me) + ( field ? '.' + field : ''), val, false, isPointer);
        this.className = this.constructor.name;
        if (fire) this.fire();
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
export class RedoAction extends Action {
    static type = 'RedoAction';
    public static new<F extends boolean = true>(amount: number = 1, notfire?: F): (F extends false ? boolean : RedoAction) {
        let act = new RedoAction(amount);
        if (!notfire) return act.fire() as any;
        return act as any;
    }
    private constructor(amount: number = 1) {
        super('', amount);
        this.className = this.constructor.name;
    }
}
@RuntimeAccessible
export class UndoAction extends Action {
    static type = 'UndoAction';
    public static new<F extends boolean = true>(amount: number = 1, notfire?: F): (F extends false ? boolean : UndoAction) {
        let act = new UndoAction(amount);
        if (!notfire) return act.fire() as any;
        return act as any;
    }
    private constructor(amount: number = 1) {
        super('', amount);
        this.className = this.constructor.name;
    }
}
@RuntimeAccessible
export class CombineHistoryAction extends Action {
    static type = 'CombineHistoryAction';
    public static new<F extends boolean = true>(notfire?: F): (F extends false ? boolean : CombineHistoryAction) {
        let act = new CombineHistoryAction();
        if (!notfire) return act.fire() as any;
        return act as any;
    }
    private constructor() {
        super('', '');
        this.className = this.constructor.name;
    }
}
@RuntimeAccessible
export class CreateElementAction extends Action {
    static type = 'CREATE_ELEMENT';
    value!: DPointerTargetable;
    public static newBatch<F extends boolean = true>(me: DPointerTargetable[], notfire?: F): (F extends false ? boolean : CreateElementAction)[]{
        return me.map( (e) => CreateElementAction.new(e, notfire));
    }

    public static new<F extends boolean = true>(me: DPointerTargetable , notfire?: F): (F extends false ? boolean : CreateElementAction) {
        if ((me as LPointerTargetable).__raw) me = (me as LPointerTargetable).__raw;
        let act = new CreateElementAction(me, !notfire);
        if (!notfire) return act.fire() as any;
        return act as any;
    }
    private constructor(me: DPointerTargetable, fire: boolean = true) {
        super('idlookup.' + me.id, me);
        this.className = this.constructor.name;
        this.value = me;
        if (fire) this.fire();
    }
}

@RuntimeAccessible
export class DeleteElementAction extends SetFieldAction {
    static type = 'DELETE_ELEMENT';
    public static new(me: Pack1<LPointerTargetable>): boolean {
        return new DeleteElementAction(me as any).fire(); }
    constructor(me: DPointerTargetable | Pointer) {
        super((me as DPointerTargetable).id || me, '', undefined);
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
        this.className = this.constructor.name;
        if (launch) this.fire();
    }
}

@RuntimeAccessible
export class ParsedAction extends SetRootFieldAction {
    path!: string; // path to a property in the store "something.like.this"
    pathArray!: string[]; // path splitted "like.1.this"
    executionCount!: number;

}
