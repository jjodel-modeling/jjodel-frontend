/**
 * The undo groups of the history reducer (P-2026-10-21-1016, docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md
 * Q2 and Q4): `beginUndoGroup` / `endUndoGroup` keep a span of dispatches as one undo entry with exact contents.
 *
 * HERE the real `_reducer` (with the real `Uobj`) runs in `environment: node`, its imports doubled as in
 * `reducerCopyOnWrite.test.ts`: the `joiner` barrel does not load in the bench. A create is emulated by root writes of
 * the new record into `idlookup` and, for a graph create, of its id into `vertexs`, the key `reducer.ts` merges at any
 * age; the timings are the ones the discovery measured (T1, T1b: a graph create at +789 ms, the seeding at +1629 ms).
 *
 * THE LOAD-BEARING ASSERTIONS ARE ON `idlookup` AFTER THE UNDO: an entry that holds the instance but not the records
 * created after it still removes the instance, so a test that read only `model.objects` would stay green on the
 * shallow merge (measured T2: the slots and the vertex stayed in `idlookup`).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    const g = globalThis as any;
    g.window = g.window ?? {};
    // reducer.ts reads `HTMLElement.prototype.focus` at module load.
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
const { _reducer, beginUndoGroup, endUndoGroup, undoGroupState, UNDO_GROUP_MAX_MS } = await import('../reducer');

const USER = 'U1';
const T0 = 2_000_000;
let clock = T0;

const set = (id: string, field: string, value: unknown) =>
    ({ type: 'SET_ME_FIELD', className: 'SetFieldAction', field: `idlookup.${id}.${field}`, value, accessModifier: '', isPointer: false, sender: USER });
const setRoot = (field: string, value: unknown) =>
    ({ type: 'SET_ROOT_FIELD', className: 'SetRootFieldAction', field, value, accessModifier: '', isPointer: false, sender: USER });
const batch = (title: string, actions: any[]) =>
    ({ type: 'COMPOSITE_ACTION', className: 'CompositeAction', sender: USER, actions, descriptor: { path: title } });
const undoAction = () => ({ type: 'UndoAction', className: 'UndoAction', value: 1, forUser: USER, sender: USER });
const redoAction = () => ({ type: 'RedoAction', className: 'RedoAction', value: 1, forUser: USER, sender: USER });

/** A model write: a rename of O1. */
const rename = (name: string) => batch('rename', [set('O1', 'name', name)]);
/** An object create, as its record reaches `idlookup`. */
const create = (id: string) => batch(`create ${id}`, [setRoot(`idlookup.${id}`, { id, className: 'DObject', name: '' })]);
/** A vertex create: the record and the `vertexs` key that the legacy rule merges into the top entry at any age. */
const graphCreate = (id: string, vertexs: string[]) =>
    batch(`vertex ${id}`, [setRoot(`idlookup.${id}`, { id, className: 'DVertex', model: 'I1' }), setRoot('vertexs', vertexs)]);
/** The deferred seeding of a created object (`addObject`, +600 ms after its create). */
const seed = (id: string, name: string) => batch(`seed ${id}`, [set(id, 'name', name)]);

/** `action` dispatched at `ms` after T0. */
function at(ms: number, state: any, action: any): any {
    clock = T0 + ms;
    return _reducer(state, action as any);
}

function freshState(): any {
    return {
        timestamp: T0 - 5000, action_title: '', action_description: '', _lastSelected: { node: '' }, vertexs: [],
        idlookup: { O1: { id: 'O1', className: 'DObject', name: 'lock' } },
    };
}

const entries = () => h.statehistory[USER]?.undoable ?? [];
const top = () => entries()[entries().length - 1];
/** The keys of a record without the copy counter the reducer hangs on its copies (`clonedCounter`). */
const keysOf = (o: any) => Object.keys(o ?? {}).filter(k => k !== 'clonedCounter').sort();
const ids = (s: any) => keysOf(s.idlookup);

beforeEach(() => {
    for (const k of Object.keys(h.statehistory)) delete h.statehistory[k];
    h.statehistory.globalcanundostate = true;
    h.statehistory.all = new h.UserHistory();
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
    // No group open and no group entry left by the previous test (module state of reducer.ts).
    clock = T0;
    endUndoGroup(beginUndoGroup());
});

describe('no group: the legacy history, unchanged', () => {
    it('a write within 450 ms merges, a later one pushes, a graph create merges at any age, shallowly', () => {
        let s = freshState();
        s = at(0, s, rename('a'));
        s = at(200, s, create('I1'));
        expect(entries()).toHaveLength(1);
        // The shallow merge keeps the entry's first idlookup patch and drops the create's.
        expect(keysOf(top().idlookup)).toEqual(['O1']);
        s = at(1600, s, rename('b'));
        expect(entries()).toHaveLength(2);
        s = at(2400, s, graphCreate('V1', ['V1']));
        expect(entries()).toHaveLength(2);
        expect(keysOf(top().idlookup)).toEqual(['O1']);
        s = at(3400, s, undoAction());
        expect(s.idlookup.O1.name).toBe('a');
        expect(s.vertexs).toEqual([]);
        // The defect the group exists for, pinned here as today's behaviour: the vertex record survives the undo.
        expect(s.idlookup.V1).toBeDefined();
    });
});

describe('an open group is one undo entry with exact contents', () => {
    function instantiation(): { before: any, after: any } {
        let s = freshState();
        s = at(0, s, rename('a'));
        const before = s;
        const g = beginUndoGroup();
        s = at(150, s, create('I1'));
        s = at(939, s, graphCreate('V1', ['V1']));
        s = at(1779, s, seed('I1', 'book1'));
        endUndoGroup(g);
        return { before, after: s };
    }

    it('its first write pushes an entry of its own, even 150 ms after an unrelated one', () => {
        let s = at(0, freshState(), rename('a'));
        beginUndoGroup();
        s = at(150, s, create('I1'));
        expect(entries()).toHaveLength(2);
        expect(top().idlookup).toHaveProperty('I1');
    });

    it('a create, a graph create at +789 ms and a seeding at +1629 ms are one entry', () => {
        instantiation();
        expect(entries()).toHaveLength(2);
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
        expect(entries()).toHaveLength(1);
        const redone = at(3500, undone, redoAction());
        expect(ids(redone)).toEqual(['I1', 'O1', 'V1']);
        expect(redone.idlookup.I1.name).toBe('book1');
        expect(redone.vertexs).toEqual(['V1']);
    });

    it('a graph create after endUndoGroup merges into the group entry exactly', () => {
        const { before, after } = instantiation();
        const s = at(2600, after, graphCreate('V2', ['V1', 'V2']));
        expect(entries()).toHaveLength(2);
        const undone = at(3000, s, undoAction());
        expect(ids(undone)).toEqual(ids(before));
        expect(undone.vertexs).toEqual([]);
    });
});

describe('a group closes', () => {
    it(`${UNDO_GROUP_MAX_MS} ms after it opened: a later write takes the legacy path`, () => {
        let s = freshState();
        beginUndoGroup();
        s = at(100, s, create('I1'));
        s = at(UNDO_GROUP_MAX_MS - 1000, s, rename('inside'));
        expect(entries()).toHaveLength(1);
        s = at(UNDO_GROUP_MAX_MS + 1000, s, rename('after'));
        expect(entries()).toHaveLength(2);
    });

    it('on undo: the writes after it are not joined', () => {
        let s = freshState();
        beginUndoGroup();
        s = at(100, s, create('I1'));
        s = at(1000, s, undoAction());
        expect(s.idlookup.I1).toBeUndefined();
        s = at(2000, s, rename('a'));
        s = at(3000, s, rename('b'));
        expect(entries()).toHaveLength(2);
    });

    it('on endUndoGroup of its own id only: a stale id leaves the newer group open', () => {
        let s = freshState();
        const g1 = beginUndoGroup();
        const g2 = beginUndoGroup();
        endUndoGroup(g1);
        s = at(100, s, create('I1'));
        s = at(1500, s, rename('a'));
        expect(entries()).toHaveLength(1);
        endUndoGroup(g2);
        s = at(3000, s, rename('b'));
        expect(entries()).toHaveLength(2);
    });
});

describe('a late write of an instantiation (S2-4u, P-2026-10-21-1121)', () => {
    /** The node layout write of `instantiate` (its scalar form), as the store's update timer sends it, up to 300 ms after its TRANSACTION. */
    const layout = (id: string) => batch('Instantiate: node layout', [set(id, 'w', 280), set(id, 'h', 102)]);
    function upToTheLayout(): { s: any, g: number } {
        let s = at(0, freshState(), rename('a'));
        const g = beginUndoGroup();
        s = at(150, s, create('I1'));
        s = at(939, s, graphCreate('V1', ['V1']));
        return { s, g };
    }

    it('inside the open group, 700 ms after its last write (past the legacy 450 ms window), joins the group entry', () => {
        let { s, g } = upToTheLayout();
        s = at(1639, s, layout('V1'));
        endUndoGroup(g);
        expect(entries()).toHaveLength(2);
        expect(keysOf(top().idlookup)).toEqual(['I1', 'V1']);
        expect(s.idlookup.V1.h).toBe(102);
        const undone = at(3000, s, undoAction());
        expect(ids(undone)).toEqual(['O1']);
        // The redo reapplies the whole group, the late write included.
        expect(at(3500, undone, redoAction()).idlookup.V1.h).toBe(102);
    });

    it('after endUndoGroup it pushes an entry of its own (the defect): the group state shows the close, then the push', () => {
        let { s, g } = upToTheLayout();
        endUndoGroup(g);
        s = at(1639, s, layout('V1'));
        expect(entries()).toHaveLength(3);
        expect(undoGroupState()).toMatchObject({
            open: null, tail: null, closed: { group: g, by: 'end' }, tailCleared: { group: null, by: 'push', at: T0 + 1639 },
        });
    });
});
