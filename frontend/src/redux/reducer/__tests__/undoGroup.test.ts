/**
 * The undo group of a script Apply (R-JJD-6, P-2026-10-24-0256): `beginUndoGroup` marks the user's undo
 * history, `endUndoGroup` folds every delta pushed since the mark into one entry, so one Cmd+Z undoes the
 * whole Apply and one redo reapplies it.
 *
 * HERE the real `_reducer` (with the real `Uobj`) runs in `environment: node`, with the harness of
 * `reducerCopyOnWrite.test.ts` (the `joiner` barrel does not load in the bench).
 *
 * THE LOAD-BEARING ASSERTIONS ARE ON THE STATE AFTER ONE UNDO: a group whose entries were merged shallowly
 * (`U.objectMergeInPlace`, first key kept) keeps the first delta's `idlookup` only and leaves the later
 * elements in place, so counting entries alone would stay green on that defect.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    const g = globalThis as any;
    g.window = g.window ?? {};
    // reducer.ts:1422 reads `HTMLElement.prototype.focus` at module load.
    g.HTMLElement = g.HTMLElement ?? class {};

    // The helpers of `U` the reducer paths call, with the bodies of `common/U.tsx`.
    const U: any = {
        UpdatingTimer: 300,
        userHasInteracted: true,
        debug: false,
        stringCompare: (s1: string, s2: string) => ((s1 < s2) ? -1 : (s1 > s2) ? 1 : 0),
        arrayMergeInPlace: (arr1: any[], ...others: any[][]) => { for (const a of others) arr1.push.apply(arr1, a || []); return arr1; },
        arrayRemoveAll: (arr: any[], elem: any) => { if (!arr) return; let i; while ((i = arr.indexOf(elem)) !== -1) arr.splice(i, 1); },
        objectMergeInPlace: (out: any, ...objs: any[]) => { for (const o of objs) if (o && typeof o === 'object') for (const k in o) out[k] ?? (out[k] = o[k]); },
        ArrayMerge: (arr1: any[], ...others: any[][]) => { for (const a of others) Array.prototype.push.apply(arr1, a); return arr1; },
        // Fed only the pointer destinations of a write (`reducer.ts:397-410`); no value here is a pointer, so both
        // sides are empty and the set difference is all this needs.
        arrayDifference: (starting: any[], final: any[]) => ({
            added: final.filter((x) => !starting.includes(x)), removed: starting.filter((x) => !final.includes(x)), starting, final,
        }),
    };
    g.window.U = U;

    class UserHistory { undoable: any[] = []; redoable: any[] = []; }
    const statehistory: any = {};
    const holder: any = {};
    const Log: any = new Proxy({}, { get: () => () => undefined });
    return { U, UserHistory, statehistory, holder, Log };
});

vi.mock('../../../joiner', () => ({
    U: h.U,
    Log: h.Log,
    statehistory: h.statehistory,
    UserHistory: h.UserHistory,
    RuntimeAccessible: () => (c: any) => c,
    Uarr: {
        arrayShallowCopy: (arr: any) => {
            if (!arr || !Array.isArray(arr)) return arr;
            const ret: any = [];
            for (const k in arr) if (Object.prototype.hasOwnProperty.call(arr, k)) ret[k] = arr[k];
            ret.length = arr.length;
            return ret;
        },
    },
    Uobj: {
        objectDelta: (...a: any[]) => h.holder.Uobj.objectDelta(...a),
        applyObjectDelta: (...a: any[]) => h.holder.Uobj.applyObjectDelta(...a),
    },
    Action: {
        possibleInconsistencies: {},
        SubType: { vertexSubElements: 'vertexSubElements', vertexSize: 'vertexSize' },
        // action.ts Action.parse1, in place as there.
        parse: (actions: any) => {
            const one = (a: any) => { a.path = a.field; a.pathArray = a.path.split('.'); a.executionCount = 0; return a; };
            return Array.isArray(actions) ? actions.map(one) : one(actions);
        },
    },
    CompositeAction: { cname: 'CompositeAction', type: 'COMPOSITE_ACTION' },
    SetFieldAction: { cname: 'SetFieldAction', type: 'SET_ME_FIELD' },
    SetRootFieldAction: { cname: 'SetRootFieldAction', type: 'SET_ROOT_FIELD' },
    CreateElementAction: { cname: 'CreateElementAction', type: 'CREATE_ELEMENT' },
    DeleteElementAction: { cname: 'DeleteElementAction', type: 'DELETE_ELEMENT' },
    PendingPointedByPaths: { all: [] },
    Pointers: { isPointer: (v: any) => typeof v === 'string' && v.startsWith('Pointer') },
    PointedBy: {},
    DUser: { current: 'U1' },
    MyError: class extends Error {},
    transientProperties: {},
    Selectors: {},
}));
vi.mock('../../action/action', () => ({
    BEGIN: () => {}, COMMIT: () => {}, END: () => {}, AT_TRANSACTION: () => {}, AFTER_TRANSACTION: () => {},
    DO_AFTER_TRANSACTION_NOT_FOR_USERS: () => {},
    CollabClearHistoryAction: { type: 'COLLAB_CLEAR' },
    CollabRefreshAction: { type: 'COLLAB_REFRESH' },
    LoadAction: { type: 'LOAD' },
    RedoAction: { type: 'RedoAction' },
    UndoAction: { type: 'UndoAction' },
}));
vi.mock('../../../components/collaborative/Collaborative', () => ({ default: { online: false } }));
vi.mock('../../../common/SimpleTree', () => ({ SimpleTree: class {} }));
vi.mock('@stekoe/ocl.js', () => ({ OclEngine: class {} }));
vi.mock('../../../common/sharedTypes', () => ({ contextFixedKeys: [] }));
vi.mock('../../../common/jsxErrorView', () => ({ displayError: () => null }));
vi.mock('../../../data/storage', () => ({ default: {} }));
vi.mock('../../../api/persistance', () => ({ AuthApi: {}, ProjectsApi: {} }));
vi.mock('../../../DSL/DSL', () => ({ default: {} }));
vi.mock('../../../components/topbar/SaveManager', () => ({ SaveManager: {} }));
vi.mock('../../../api/api', () => ({ default: {} }));
vi.mock('../../../components/forEndUser/MTM', () => ({ doM2T: () => {}, parseT2M: () => {} }));
vi.mock('../../../events/registry', () => ({ JjodelEvents: {} }));

const { Uobj } = await vi.importActual<any>('../../../common/UObj');
h.holder.Uobj = Uobj;
const { _reducer, beginUndoGroup, endUndoGroup } = await import("../reducer");


const USER = 'U1';
let clock = 1_000_000;

const set = (id: string, field: string, value: unknown) =>
    ({ type: 'SET_ME_FIELD', className: 'SetFieldAction', field: `idlookup.${id}.${field}`, value, accessModifier: '', isPointer: false, sender: USER });
const setRoot = (field: string, value: unknown) =>
    ({ type: 'SET_ROOT_FIELD', className: 'SetRootFieldAction', field, value, accessModifier: '', isPointer: false, sender: USER });
const batch = (title: string, actions: any[]) =>
    ({ type: 'COMPOSITE_ACTION', className: 'CompositeAction', sender: USER, actions, descriptor: { path: title } });
/** A script line that creates an object, as one flushed batch. */
const create = (id: string, name: string) => batch(`create ${name}`, [setRoot(`idlookup.${id}`, { id, className: 'DObject', name })]);
const rename = (id: string, name: string) => batch(`${id}.name`, [set(id, 'name', name)]);
const undoAction = () => ({ type: 'UndoAction', className: 'UndoAction', value: 1, forUser: USER, sender: USER });
const redoAction = () => ({ type: 'RedoAction', className: 'RedoAction', value: 1, forUser: USER, sender: USER });

/** A dispatch `dt` ms after the previous one; 1 s by default, outside the 450 ms merge window. */
function dispatch(state: any, action: any, dt = 1000): any {
    clock += dt;
    return _reducer(state, action as any);
}

function freshState(): any {
    return {
        timestamp: clock, action_title: '', action_description: '', _lastSelected: { node: '' },
        idlookup: {
            O1: { id: 'O1', className: 'DObject', name: 'lock' },
            S1: { id: 'S1', className: 'DValue', isMirage: false, values: ['a'] },
        },
    };
}

const history = () => h.statehistory[USER]?.undoable ?? [];
const plain = (a: any) => (Array.isArray(a) ? [...a] : a);
const ids = (s: any) => Object.keys(s.idlookup).filter((k) => k !== 'clonedCounter').sort();

/** One ordinary edit before the group, so the history is not empty and the mark is not 0. */
function stateWithOneEntry(): any {
    const s = dispatch(freshState(), rename('O1', 'door'));
    expect(history().length).toBe(1);
    return s;
}

/** Three created objects and two renames of O1 inside the group, each `dt` ms after the previous. */
function runGroup(s: any, dt: number): any {
    beginUndoGroup(USER);
    s = dispatch(s, create('X1', 'a'), dt);
    s = dispatch(s, rename('O1', 'gate'), dt);
    s = dispatch(s, create('X2', 'b'), dt);
    s = dispatch(s, rename('O1', 'hatch'), dt);
    s = dispatch(s, create('X3', 'c'), dt);
    endUndoGroup();
    return s;
}

beforeEach(() => {
    for (const k of Object.keys(h.statehistory)) delete h.statehistory[k];
    h.statehistory.globalcanundostate = true;
    h.statehistory.all = new h.UserHistory();
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
    // A test that failed between begin and end leaves no group open for the next one.
    for (let i = 0; i < 5; i++) endUndoGroup();
});

describe('an undo group folds the deltas between begin and end into one entry', () => {
    for (const dt of [1000, 20]) {
        it(`five deltas ${dt} ms apart: one entry, one undo restores the state before begin, one redo reapplies all`, () => {
            const s0 = stateWithOneEntry();
            const s1 = runGroup(s0, dt);
            expect(ids(s1)).toEqual(['O1', 'S1', 'X1', 'X2', 'X3']);
            expect(history().length).toBe(2);
            expect(h.statehistory.all.undoable.length).toBe(2);

            const s2 = dispatch(s1, undoAction());
            expect(ids(s2)).toEqual(['O1', 'S1']);
            expect(s2.idlookup.O1.name).toBe('door');
            expect(history().length).toBe(1);
            expect(h.statehistory[USER].redoable.length).toBe(1);

            const s3 = dispatch(s2, redoAction());
            expect(ids(s3)).toEqual(['O1', 'S1', 'X1', 'X2', 'X3']);
            expect(s3.idlookup.O1.name).toBe('hatch');
            expect(s3.idlookup.X2.name).toBe('b');

            // The entry before the group is untouched: a second undo restores the original name.
            const s4 = dispatch(dispatch(s3, undoAction()), undoAction());
            expect(s4.idlookup.O1.name).toBe('lock');
            expect(ids(s4)).toEqual(['O1', 'S1']);
        });
    }

    it('array writes inside the group: one undo restores the values and the length before begin', () => {
        let s = stateWithOneEntry();
        beginUndoGroup(USER);
        s = dispatch(s, batch('push b', [set('S1', 'values.1', 'b')]));
        s = dispatch(s, batch('push c', [set('S1', 'values.2', 'c')]));
        s = dispatch(s, batch('edit a', [set('S1', 'values.0', 'z')]));
        endUndoGroup();
        expect(plain(s.idlookup.S1.values)).toEqual(['z', 'b', 'c']);
        const s2 = dispatch(s, undoAction());
        expect(plain(s2.idlookup.S1.values)).toEqual(['a']);
        expect(plain(dispatch(s2, redoAction()).idlookup.S1.values)).toEqual(['z', 'b', 'c']);
    });

    it('a write then the deletion of the same element: the entry carries the array length, undo restores it whole', () => {
        // The deletion's delta holds the element as a full value, its `values` a real array whose `length` is
        // not an own enumerable key: the entry gets it from the older delta or from the array.
        let s = stateWithOneEntry();
        beginUndoGroup(USER);
        s = dispatch(s, batch('edit a', [set('S1', 'values.0', 'z')]));
        s = dispatch(s, batch('delete S1', [setRoot('idlookup.S1', undefined)]));
        endUndoGroup();
        expect(s.idlookup.S1).toBeUndefined();
        const entry = history()[history().length - 1];
        expect(entry.idlookup.S1.values.length).toBe(1);
        expect(entry.idlookup.S1.values.__jjObjDiffIsArr).toBe(true);
        const s2 = dispatch(s, undoAction());
        expect(plain(s2.idlookup.S1.values)).toEqual(['a']);
        expect(s2.idlookup.S1.isMirage).toBe(false);
    });

    it('a group that starts with an empty history still folds into one entry', () => {
        let s = runGroup(freshState(), 1000);
        expect(history().length).toBe(1);
        s = dispatch(s, undoAction());
        expect(ids(s)).toEqual(['O1', 'S1']);
        expect(s.idlookup.O1.name).toBe('lock');
    });

    it('the group keeps its deltas when the history is at its cap', () => {
        let s = freshState();
        for (let i = 0; i < 100; i++) s = dispatch(s, rename('O1', `n${i}`));
        expect(history().length).toBe(100);
        s = runGroup(s, 1000);
        expect(history().length).toBe(100);
        expect(h.statehistory.all.undoable.length).toBe(100);
        s = dispatch(s, undoAction());
        expect(ids(s)).toEqual(['O1', 'S1']);
        expect(s.idlookup.O1.name).toBe('n99');
    });
});

describe('nesting, empty groups and unmatched ends', () => {
    it('a nested begin is counted: the inner end closes nothing, the outer end folds everything', () => {
        let s = stateWithOneEntry();
        beginUndoGroup(USER);
        s = dispatch(s, create('X1', 'a'));
        beginUndoGroup(USER);
        s = dispatch(s, create('X2', 'b'));
        endUndoGroup();
        expect(history().length).toBe(3);
        s = dispatch(s, create('X3', 'c'));
        endUndoGroup();
        expect(history().length).toBe(2);
        s = dispatch(s, undoAction());
        expect(ids(s)).toEqual(['O1', 'S1']);
        expect(s.idlookup.O1.name).toBe('door');
    });

    it('an empty group leaves the history as it was, entry objects included', () => {
        const s = stateWithOneEntry();
        const before = [...history()];
        const beforeAll = [...h.statehistory.all.undoable];
        beginUndoGroup(USER);
        endUndoGroup();
        expect(history()).toEqual(before);
        expect(history()[0]).toBe(before[0]);
        expect(h.statehistory.all.undoable[0]).toBe(beforeAll[0]);
        expect(dispatch(s, undoAction()).idlookup.O1.name).toBe('lock');
    });

    it('a group with one delta keeps that delta as its entry', () => {
        let s = stateWithOneEntry();
        beginUndoGroup(USER);
        s = dispatch(s, create('X1', 'a'));
        const only = history()[1];
        endUndoGroup();
        expect(history().length).toBe(2);
        expect(history()[1]).toBe(only);
        expect(ids(dispatch(s, undoAction()))).toEqual(['O1', 'S1']);
    });

    it('an end without a begin does nothing, and does not swallow the begin that follows', () => {
        let s = stateWithOneEntry();
        endUndoGroup();
        endUndoGroup();
        expect(history().length).toBe(1);
        s = runGroup(s, 1000);
        expect(history().length).toBe(2);
        s = dispatch(s, create('X4', 'd'));
        expect(history().length).toBe(3);
        expect(ids(dispatch(s, undoAction()))).toEqual(['O1', 'S1', 'X1', 'X2', 'X3']);
    });

    it('outside a group the deltas stay one entry each', () => {
        let s = stateWithOneEntry();
        s = dispatch(s, create('X1', 'a'));
        s = dispatch(s, create('X2', 'b'));
        expect(history().length).toBe(3);
        expect(ids(dispatch(s, undoAction()))).toEqual(['O1', 'S1', 'X1']);
    });
});
