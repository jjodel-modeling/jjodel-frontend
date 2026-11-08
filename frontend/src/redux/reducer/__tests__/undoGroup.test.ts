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
    // A class, not a literal: `doreducer` wraps a single dispatched action in one (reducer.ts:1437), the way a
    // write fired outside a TRANSACTION reaches the store.
    CompositeAction: class {
        static cname = 'CompositeAction'; static type = 'COMPOSITE_ACTION';
        type = 'COMPOSITE_ACTION'; className = 'CompositeAction'; actions: any[];
        constructor(actions: any[]) { this.actions = actions; }
    },
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

/**
 * R-MT-20 (P-2026-11-07-0935): the viewpoint write a model tab makes when it gains focus carries `noUndo`, and
 * the reducer skips the history bookkeeping for it: no entry of its own, no merge into the entry below. The
 * toolbar picker writes the same fields without the flag and keeps its entry.
 */
describe('a write flagged noUndo adds no undo entry (R-MT-20)', () => {
    const noUndo = (a: any) => ({ ...a, noUndo: true });
    /** The two actions `activateViewpoint` fires: the project field, then the root, back to back. */
    const viewpointWrite = (s: any, vp: string, flag: boolean, dt: number) => {
        const mark = (a: any) => (flag ? noUndo(a) : a);
        s = dispatch(s, mark(set('O1', 'activeViewpoint', vp)), dt);
        return dispatch(s, mark(setRoot('viewpoint', vp)), 0);
    };
    const withOneEdit = () => {
        const s = dispatch({ ...freshState(), viewpoint: 'vpA' }, rename('O1', 'door'));
        expect(history().length).toBe(1);
        return s;
    };

    for (const dt of [1000, 20]) {
        it(`a focus write ${dt} ms after an edit leaves the stack as it was, and the entry below unmerged`, () => {
            let s = withOneEdit();
            const below = history()[0];
            const belowBefore = JSON.stringify(below);
            s = viewpointWrite(s, 'vpB', true, dt);
            expect(s.viewpoint).toBe('vpB');
            expect(s.idlookup.O1.activeViewpoint).toBe('vpB');
            expect(history().length).toBe(1);
            expect(h.statehistory.all.undoable.length).toBe(1);
            expect(history()[0]).toBe(below);
            expect(JSON.stringify(below)).toBe(belowBefore);
        });
    }

    it('one undo after a focus write reverts the edit below it and leaves the focused viewpoint (R-MT-15)', () => {
        let s = withOneEdit();
        s = viewpointWrite(s, 'vpB', true, 1000);
        s = dispatch(s, undoAction());
        expect(s.idlookup.O1.name).toBe('lock');
        expect(s.viewpoint).toBe('vpB');
    });

    // Measured in the app (P-2026-11-07-0935 (4)): the focus write lands while the 300 ms batch is open, so
    // it reaches the reducer as one CompositeAction whose actions carry the flag and which does not.
    it('a batch made only of flagged writes adds no entry and leaves the entry below unmerged', () => {
        let s = withOneEdit();
        const belowBefore = JSON.stringify(history()[0]);
        s = dispatch(s, batch('focus', [noUndo(set('O1', 'activeViewpoint', 'vpB')), noUndo(setRoot('viewpoint', 'vpB'))]));
        expect(s.viewpoint).toBe('vpB');
        expect(history().length).toBe(1);
        expect(JSON.stringify(history()[0])).toBe(belowBefore);
    });

    it('a batch that mixes a flagged write with a user edit keeps its entry', () => {
        let s = withOneEdit();
        s = dispatch(s, batch('mixed', [noUndo(setRoot('viewpoint', 'vpB')), set('O1', 'name', 'gate')]));
        expect(history().length).toBe(2);
        s = dispatch(s, undoAction());
        expect(s.idlookup.O1.name).toBe('door');
    });

    it('a picker write without the flag still adds exactly one entry, and its undo restores the viewpoint', () => {
        let s = withOneEdit();
        s = viewpointWrite(s, 'vpB', false, 1000);
        expect(history().length).toBe(2);
        s = dispatch(s, undoAction());
        expect(s.viewpoint).toBe('vpA');
        expect(s.idlookup.O1.name).toBe('door');
    });
});

// ── The instance-of cases of oi-s2u (P-2026-10-21-1016, P-2026-10-21-1121), ported to the trunk API, and the group
// tail of option (c) (P-2026-11-06-2150). A create is emulated by root writes of the new record into `idlookup` and,
// for a graph create, of its id into `vertexs`, the key `reducer.ts` merges into the top entry at any age; the
// timings are the ones the S2u discovery measured (a graph create at +789 ms, the seeding at +1629 ms).

const T0 = 2_000_000;
/** `action` dispatched at `ms` after T0. */
function at(ms: number, state: any, action: any): any {
    clock = T0 + ms;
    return _reducer(state, action as any);
}
function instanceState(): any {
    return {
        timestamp: T0 - 5000, action_title: '', action_description: '', _lastSelected: { node: '' }, vertexs: [],
        idlookup: { O1: { id: 'O1', className: 'DObject', name: 'lock' } },
    };
}
/** An object create, as its record reaches `idlookup`. */
const createInstance = (id: string) => batch(`create ${id}`, [setRoot(`idlookup.${id}`, { id, className: 'DObject', name: '' })]);
/** A vertex create: the record and the `vertexs` key that the legacy rule merges into the top entry at any age. */
const graphCreate = (id: string, vertexs: string[]) =>
    batch(`vertex ${id}`, [setRoot(`idlookup.${id}`, { id, className: 'DVertex', model: 'I1' }), setRoot('vertexs', vertexs)]);
/** The deferred seeding of a created object (`addObject`, +600 ms after its create). */
const seed = (id: string, name: string) => batch(`seed ${id}`, [set(id, 'name', name)]);
/** The node layout write of `instantiate` (its scalar form), up to 300 ms after its TRANSACTION. */
const layout = (id: string) => batch('Instantiate: node layout', [set(id, 'w', 280), set(id, 'h', 102)]);
const top = () => history()[history().length - 1];
/** The keys of a record without the copy counter the reducer hangs on its copies (`clonedCounter`). */
const keysOf = (o: any) => Object.keys(o ?? {}).filter((k) => k !== 'clonedCounter').sort();

describe('an instantiation is one undo entry with exact contents', () => {
    beforeEach(() => {
        clock = T0;
        // No group entry left as the tail by the previous test (module state of reducer.ts).
        beginUndoGroup(USER);
        endUndoGroup();
    });

    function instantiation(): { before: any, after: any } {
        let s = instanceState();
        s = at(0, s, rename('O1', 'a'));
        const before = s;
        beginUndoGroup();
        s = at(150, s, createInstance('I1'));
        s = at(939, s, graphCreate('V1', ['V1']));
        s = at(1779, s, seed('I1', 'book1'));
        endUndoGroup();
        return { before, after: s };
    }

    it('its first write pushes an entry of its own, even 150 ms after an unrelated one', () => {
        let s = at(0, instanceState(), rename('O1', 'a'));
        beginUndoGroup();
        s = at(150, s, createInstance('I1'));
        expect(history()).toHaveLength(2);
        expect(top().idlookup).toHaveProperty('I1');
        endUndoGroup();
    });

    it('a create, a graph create at +789 ms and a seeding at +1629 ms are one entry', () => {
        instantiation();
        expect(history()).toHaveLength(2);
        expect(h.statehistory.all.undoable).toHaveLength(2);
        expect(h.statehistory.all.undoable[1]).toBe(top());
        expect(keysOf(top().idlookup)).toEqual(['I1', 'V1']);
    });

    it('one undo restores idlookup exactly (every created id absent) and redo reapplies the whole group', () => {
        const { before, after } = instantiation();
        const undone = at(3000, after, undoAction());
        expect(ids(undone)).toEqual(ids(before));
        expect(undone.vertexs).toEqual([]);
        expect(undone.idlookup.O1.name).toBe('a');
        expect(history()).toHaveLength(1);
        const redone = at(3500, undone, redoAction());
        expect(ids(redone)).toEqual(['I1', 'O1', 'V1']);
        expect(redone.idlookup.I1.name).toBe('book1');
        expect(redone.vertexs).toEqual(['V1']);
    });

    it('a graph create after endUndoGroup merges into the group entry exactly', () => {
        const { before, after } = instantiation();
        const s = at(2600, after, graphCreate('V2', ['V1', 'V2']));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(ids(undone)).toEqual(ids(before));
        expect(undone.vertexs).toEqual([]);
    });

    it('a late write inside the open group, 700 ms after its last write (past the legacy 450 ms window), joins the group entry', () => {
        let s = at(0, instanceState(), rename('O1', 'a'));
        beginUndoGroup();
        s = at(150, s, createInstance('I1'));
        s = at(939, s, graphCreate('V1', ['V1']));
        s = at(1639, s, layout('V1'));
        endUndoGroup();
        expect(history()).toHaveLength(2);
        expect(keysOf(top().idlookup)).toEqual(['I1', 'V1']);
        expect(s.idlookup.V1.h).toBe(102);
        const undone = at(3000, s, undoAction());
        expect(ids(undone)).toEqual(['O1']);
        // The redo reapplies the whole group, the late write included.
        expect(at(3500, undone, redoAction()).idlookup.V1.h).toBe(102);
    });

    it('nested groups: a graph create after the outermost end composes into the entry, one undo removes it from idlookup', () => {
        let s = at(0, instanceState(), rename('O1', 'a'));
        const before = s;
        beginUndoGroup();
        s = at(100, s, createInstance('I0'));
        beginUndoGroup();
        s = at(150, s, createInstance('I1'));
        s = at(939, s, graphCreate('V1', ['V1']));
        endUndoGroup();
        s = at(1200, s, seed('I1', 'book1'));
        endUndoGroup();
        expect(history()).toHaveLength(2);
        s = at(2600, s, graphCreate('V2', ['V1', 'V2']));
        expect(history()).toHaveLength(2);
        expect(keysOf(top().idlookup)).toEqual(['I0', 'I1', 'V1', 'V2']);
        const undone = at(3000, s, undoAction());
        expect(ids(undone)).toEqual(ids(before));
        expect(undone.vertexs).toEqual([]);
        expect(undone.idlookup.O1.name).toBe('a');
    });
});

// A canvas create opens its own undo entry (#682, P-2026-11-08-1202). The delta of a create carries a model root array
// and, on the canvas, `vertexs` too (one batch, discovery §4.5); the sync's vertex in another graph lands later.
// Mutation bench of the commit: dropping the root guard of the graph rule, the compose branch or the window override
// each kills a test below.

function canvasState(): any {
    return {
        timestamp: T0 - 5000, action_title: '', action_description: '', _lastSelected: { node: '' },
        objects: [], classs: [], enumerators: [], packages: [], vertexs: [], graphs: [],
        idlookup: { O1: { id: 'O1', className: 'DObject', name: 'lock' }, BOX: { id: 'BOX', className: 'DValue', values: [] } },
    };
}
/** A model element and its vertex in one batch, the shape of `syncCreateObject` and of `syncCreateClass`. */
const canvasCreate = (root: string, s: any, id: string, vid: string) => batch(`create ${id}`, [
    setRoot(`idlookup.${id}`, { id, className: 'DObject', name: '' }),
    setRoot(`idlookup.${vid}`, { id: vid, className: 'DVertex', model: id }),
    setRoot(root, [...s[root], id]),
    setRoot('vertexs', [...s.vertexs, vid]),
]);
/** A create with no vertex in it (`DObject.new`, the JjScript console). */
const bareCreate = (s: any, id: string) => batch(`create ${id}`, [
    setRoot(`idlookup.${id}`, { id, className: 'DObject', name: '' }),
    setRoot('objects', [...s.objects, id]),
]);
/** The sync's vertex, in the same graph or another one: only graph roots. */
const syncVertex = (s: any, vid: string, model: string) => batch(`vertex ${vid}`, [
    setRoot(`idlookup.${vid}`, { id: vid, className: 'DVertex', model }),
    setRoot('vertexs', [...s.vertexs, vid]),
]);
/** A settled move: the vertex's coordinates, no root array. */
const move = (vid: string, x: number) => batch('move', [set(vid, 'x', x)]);
/** The append of `EditorV2.tsx:2568`: a SetField-only batch on the slots. */
const append = (slot: string, value: string) => batch('graphVertex create in container', [set(slot, 'values', [value])]);

describe('a canvas create opens its own undo entry (#682)', () => {
    beforeEach(() => {
        clock = T0;
        beginUndoGroup(USER);
        endUndoGroup();
    });

    function afterEdit(): any { return at(0, canvasState(), rename('O1', 'a')); }

    it('a delta with objects and vertexs at +1000 ms is an entry and one undo restores idlookup and the root arrays', () => {
        let s = afterEdit();
        const before = s;
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(ids(undone)).toEqual(ids(before));
        expect(undone.objects).toEqual([]);
        expect(undone.vertexs).toEqual([]);
        expect(undone.idlookup.O1.name).toBe('a');
        expect(history()).toHaveLength(1);
        const redone = at(3500, undone, redoAction());
        expect(ids(redone)).toContain('I1');
        expect(ids(redone)).toContain('V1');
        expect(redone.objects).toEqual(['I1']);
    });

    it('the same delta at +300 ms, inside the 450 ms window, is also an entry and leaves the older edit in place', () => {
        let s = afterEdit();
        s = at(300, s, canvasCreate('objects', s, 'I1', 'V1'));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(undone.idlookup.I1).toBeUndefined();
        expect(undone.idlookup.V1).toBeUndefined();
        expect(undone.idlookup.O1.name).toBe('a');
    });

    it('two creates 300 ms apart are two entries', () => {
        let s = afterEdit();
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(1300, s, canvasCreate('objects', s, 'I2', 'V2'));
        expect(history()).toHaveLength(3);
        const undone = at(3000, s, undoAction());
        expect(undone.idlookup.I2).toBeUndefined();
        expect(undone.idlookup.I1).toBeDefined();
    });

    it('a create before the first interaction opens no entry: the window override leaves the other guards alone', () => {
        h.U.userHasInteracted = false;
        try {
            let s = at(0, canvasState(), rename('O1', 'a'));
            s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
            expect(history()).toHaveLength(0);
        } finally { h.U.userHasInteracted = true; }
    });

    it('a vertexs-only delta right after a create merges into it and one undo leaves no DVertex', () => {
        let s = afterEdit();
        s = at(1000, s, bareCreate(s, 'I1'));
        expect(history()).toHaveLength(2);
        s = at(1300, s, syncVertex(s, 'V1', 'I1'));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(undone.idlookup.I1).toBeUndefined();
        expect(undone.idlookup.V1).toBeUndefined();
        expect(undone.vertexs).toEqual([]);
        expect(undone.idlookup.O1.name).toBe('a');
    });

    it('the sync vertex of another graph, past the window, still merges into the create and undoes with it', () => {
        let s = afterEdit();
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(2000, s, syncVertex(s, 'V2', 'I1'));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(undone.idlookup.V1).toBeUndefined();
        expect(undone.idlookup.V2).toBeUndefined();
        expect(undone.vertexs).toEqual([]);
    });

    it('a move is an entry', () => {
        let s = afterEdit();
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(3000, s, move('V1', 700));
        expect(history()).toHaveLength(3);
        const undone = at(4000, s, undoAction());
        expect(undone.idlookup.V1.x).toBeUndefined();
        expect(undone.idlookup.I1).toBeDefined();
    });

    it('a container create is one step: the SetField-only append composes into the create and one undo clears the slot', () => {
        let s = afterEdit();
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(1025, s, append('BOX', 'I1'));
        expect(history()).toHaveLength(2);
        s = at(1300, s, syncVertex(s, 'V2', 'I1'));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(undone.idlookup.I1).toBeUndefined();
        expect(undone.idlookup.V1).toBeUndefined();
        expect(undone.idlookup.V2).toBeUndefined();
        expect([...undone.idlookup.BOX.values]).toEqual([]);
        expect(undone.idlookup.O1.name).toBe('a');
    });

    for (const root of ['classs', 'enumerators', 'packages']) {
        it(`M2: a delta adding to root ${root} is an entry, even inside the window, and one undo removes element and vertex`, () => {
            let s = afterEdit();
            s = at(300, s, canvasCreate(root, s, 'C1', 'V1'));
            expect(history()).toHaveLength(2);
            const undone = at(3000, s, undoAction());
            expect(undone.idlookup.C1).toBeUndefined();
            expect(undone.idlookup.V1).toBeUndefined();
            expect(undone[root]).toEqual([]);
            expect(undone.idlookup.O1.name).toBe('a');
        });
    }

    it('a delete inside the window does not open an entry: only a lengthening of a root does', () => {
        let s = afterEdit();
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(3000, s, rename('O1', 'b'));
        expect(history()).toHaveLength(3);
        s = at(3100, s, batch('delete', [setRoot('objects', [])]));
        expect(history()).toHaveLength(3);
    });

    it('R-UNDO-5: two non-graph writes in the window keep the first-wins merge of objectMergeInPlace', () => {
        let s = at(0, canvasState(), rename('O1', 'a'));
        s = at(1000, s, rename('O1', 'b'));
        expect(history()).toHaveLength(2);
        s = at(1200, s, batch('other', [set('BOX', 'values', ['x'])]));
        expect(history()).toHaveLength(2);
        expect(keysOf(top().idlookup)).toEqual(['O1']);
    });

    it('a new graph after a create does not compose into it: the undo of the create leaves the open tab its graph', () => {
        let s = afterEdit();
        s = at(1000, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(2000, s, batch('open a tab', [setRoot('idlookup.G1', { id: 'G1', className: 'DGraph' }), setRoot('graphs', ['G1'])]));
        expect(history()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(undone.idlookup.I1).toBeUndefined();
        expect(undone.idlookup.G1).toBeDefined();
    });

    it('a graph delta on an entry no create opened keeps the legacy merge: the compose belongs to a create only', () => {
        let s = afterEdit();
        s = at(1000, s, syncVertex(s, 'V1', 'O1'));
        expect(history()).toHaveLength(1);
        expect(keysOf(top().idlookup)).toEqual(['O1']);
    });

    it('group path unchanged: a create inside a group folds into the group entry', () => {
        let s = afterEdit();
        beginUndoGroup();
        s = at(300, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(600, s, canvasCreate('objects', s, 'I2', 'V2'));
        endUndoGroup();
        expect(history()).toHaveLength(2);
    });

    it('tail branch unchanged: a late create on a group entry still folds into it, in the window and past it', () => {
        let s = afterEdit();
        beginUndoGroup();
        s = at(300, s, canvasCreate('objects', s, 'I1', 'V1'));
        s = at(600, s, canvasCreate('objects', s, 'I2', 'V2'));
        endUndoGroup();
        s = at(800, s, bareCreate(s, 'I3'));
        expect(history()).toHaveLength(2);
        s = at(3000, s, canvasCreate('objects', s, 'I4', 'V4'));
        expect(history()).toHaveLength(2);
        const undone = at(4000, s, undoAction());
        for (const id of ['I1', 'I2', 'I3', 'I4', 'V1', 'V2', 'V4']) expect(undone.idlookup[id]).toBeUndefined();
        expect(undone.objects).toEqual([]);
    });
});
