/**
 * The copy-on-write of `CompositeActionReducer` never writes into the state before the batch
 * (P-2026-10-03-1632, docs/discovery/discovery_2026-10-03_undo_inline_edit.md).
 *
 * THE DEFECT, measured in the app (probe `frontend/scripts/probe/undo-inline-edit.ts`): a slot write emits
 * `isMirage = false` beside `values.N` (`LValue.setValueAtPosition`), and on a slot that already holds a value the
 * first is a no-op. Sorted by path it comes first, `deepCopyButOnlyFollowingPath` throws its copies away, and the
 * next action, handed it as `prevAction`, skipped copying the segments they share: it assigned into the live
 * `idlookup` and slot of the previous state. `Uobj.objectDelta(ret, oldState)` then saw no change, the undo entry
 * held `action_title` only, and Cmd+Z restored nothing. Every inline write on the canvas (IR row, path label,
 * ObjectNode cell) and every `.value =` elsewhere had that batch.
 *
 * HERE the real `_reducer` (with the real `Uobj`) runs in `environment: node`, its imports doubled as in
 * `src/api/__tests__/projectsSaveVersionStore.test.ts`: the `joiner` barrel does not load in the bench. The batches
 * are the shapes the probe recorded from the app, action for action (`window.jjactions`).
 *
 * THE LOAD-BEARING ASSERTIONS ARE ON THE PREVIOUS STATE AND ON IDENTITY: the written value lands either way, by the
 * wrong road included, so a test that read only the new state would stay green on the defect.
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
const { _reducer } = await import('../reducer');

const USER = 'U1';
let clock = 1_000_000;

/** A SetFieldAction as the reducer receives it: `idlookup.<id>.<field>`, as action.ts builds the path. */
const set = (id: string, field: string, value: unknown) =>
    ({ type: 'SET_ME_FIELD', className: 'SetFieldAction', field: `idlookup.${id}.${field}`, value, accessModifier: '', isPointer: false, sender: USER });
const setRoot = (field: string, value: unknown) =>
    ({ type: 'SET_ROOT_FIELD', className: 'SetRootFieldAction', field, value, accessModifier: '', isPointer: false, sender: USER });
/** The flushed TRANSACTION: one CompositeAction, its descriptor from the outermost TRANSACTION's name. */
const batch = (title: string, actions: any[], oldval?: unknown, newval?: unknown) =>
    ({ type: 'COMPOSITE_ACTION', className: 'CompositeAction', sender: USER, actions, descriptor: { path: title, oldval, newval } });
const undoAction = () => ({ type: 'UndoAction', className: 'UndoAction', value: 1, forUser: USER, sender: USER });
const redoAction = () => ({ type: 'RedoAction', className: 'RedoAction', value: 1, forUser: USER, sender: USER });

/** Each dispatch 1 s after the previous one: outside the 450 ms merge window, as the probe's gestures were. */
function dispatch(state: any, action: any): any {
    clock += 1000;
    return _reducer(state, action as any, false);
}

/** A state holding: an object O1 with name, and three slots that already hold a value (isMirage false). */
function freshState(): any {
    return {
        timestamp: clock, action_title: '', action_description: '', _lastSelected: { node: '' },
        idlookup: {
            O1: { id: 'O1', className: 'DObject', name: 'lock' },
            S1: { id: 'S1', className: 'DValue', isMirage: false, values: [2] },
            S2: { id: 'S2', className: 'DValue', isMirage: false, values: ['alpha'] },
            S3: { id: 'S3', className: 'DValue', isMirage: false, values: ['p3.[tokens] < 1'] },
            M1: { id: 'M1', className: 'DValue', isMirage: true, values: [] },
        },
    };
}

/** The writes the probe measured, each as the app batches it. */
const rowWrite = () => batch('EditorV2 set tokens', [set('S1', 'isMirage', false), set('S1', 'values.0', '7')]);
const labelWrite = () => batch('EditorV2 set note', [set('S2', 'isMirage', false), set('S2', 'values.0', 'beta')]);
const proxyWrite = () => batch('note.setValue(0: index)', [set('S2', 'isMirage', false), set('S2', 'values.0', 'delta')], 'alpha', 'delta');
const objectNodeWrite = () => batch('EditorV2 set guard', [set('S3', 'isMirage', false), set('S3', 'values.0', 'x > 0')]);

beforeEach(() => {
    for (const k of Object.keys(h.statehistory)) delete h.statehistory[k];
    h.statehistory.globalcanundostate = true;
    h.statehistory.all = new h.UserHistory();
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
});

const top = () => h.statehistory[USER].undoable[h.statehistory[USER].undoable.length - 1];
/** The array without the custom keys the reducer hangs on its copies (`clonedCounter`, `reducer.ts:105`). */
const plain = (a: any) => (Array.isArray(a) ? [...a] : a);

describe('a slot write whose batch starts with a no-op leaves the previous state untouched', () => {
    const cases: Array<[string, () => any, string, unknown[], unknown[]]> = [
        ['IR row value edit (canvas)', rowWrite, 'S1', [2], ['7']],
        ['path label edit (canvas)', labelWrite, 'S2', ['alpha'], ['beta']],
        ['L(o).note.value = on a slot holding a value (not the canvas)', proxyWrite, 'S2', ['alpha'], ['delta']],
        ['ObjectNode cell edit (canvas)', objectNodeWrite, 'S3', ['p3.[tokens] < 1'], ['x > 0']],
    ];
    for (const [name, write, slot, before, after] of cases) {
        it(`${name}: the previous state object is not mutated`, () => {
            const s0 = freshState();
            const snapshot = JSON.stringify(s0);
            const idlookup0 = s0.idlookup;
            const slot0 = s0.idlookup[slot];
            const values0 = slot0.values;
            const s1 = dispatch(s0, write());
            expect(plain(s1.idlookup[slot].values)).toEqual(after);
            expect(JSON.stringify(s0)).toBe(snapshot);
            expect(s0.idlookup).toBe(idlookup0);
            expect(s0.idlookup[slot]).toBe(slot0);
            expect(slot0.values).toBe(values0);
            expect(plain(slot0.values)).toEqual(before);
            expect(s1.idlookup).not.toBe(idlookup0);
            expect(s1.idlookup[slot]).not.toBe(slot0);
        });

        it(`${name}: the undo entry holds the slot, undo restores it and redo reapplies it`, () => {
            const s1 = dispatch(freshState(), write());
            expect(top().idlookup?.[slot]?.values?.[0]).toEqual(before[0]);
            const s2 = dispatch(s1, undoAction());
            expect(plain(s2.idlookup[slot].values)).toEqual(before);
            const s3 = dispatch(s2, redoAction());
            expect(plain(s3.idlookup[slot].values)).toEqual(after);
        });
    }
});

describe('the same defect on other batch shapes', () => {
    it('a no-op on one element ahead of a write on another does not write into the previous idlookup', () => {
        const s0 = freshState();
        const snapshot = JSON.stringify(s0);
        const s1 = dispatch(s0, batch('two elements', [set('S1', 'isMirage', false), set('S2', 'values.0', 'beta')]));
        expect(plain(s1.idlookup.S2.values)).toEqual(['beta']);
        expect(JSON.stringify(s0)).toBe(snapshot);
        expect(s1.idlookup).not.toBe(s0.idlookup);
        const s2 = dispatch(s1, undoAction());
        expect(plain(s2.idlookup.S2.values)).toEqual(['alpha']);
    });

    it('a root field changed ahead of the no-op does not make the no-op count as the previous copy', () => {
        // `_lastSelected` sorts before `idlookup` and changes the root only: idlookup is still the previous one.
        const s0 = freshState();
        const snapshot = JSON.stringify(s0);
        const s1 = dispatch(s0, batch('select and write', [setRoot('_lastSelected', { node: 'V1' }), set('S1', 'isMirage', false), set('S1', 'values.0', '7')]));
        expect(plain(s1.idlookup.S1.values)).toEqual(['7']);
        expect(JSON.stringify(s0)).toBe(snapshot);
        const s2 = dispatch(s1, undoAction());
        expect(plain(s2.idlookup.S1.values)).toEqual([2]);
    });
});

describe('controls: batches without a leading no-op behave as before', () => {
    it('a single-action slot write: previous state untouched, undo restores, redo reapplies', () => {
        const s0 = freshState();
        const snapshot = JSON.stringify(s0);
        const s1 = dispatch(s0, batch('probe single', [set('S1', 'values.0', 9)]));
        expect(JSON.stringify(s0)).toBe(snapshot);
        const s2 = dispatch(s1, undoAction());
        expect(plain(s2.idlookup.S1.values)).toEqual([2]);
        expect(plain(dispatch(s2, redoAction()).idlookup.S1.values)).toEqual([9]);
    });

    it('a rename: previous state untouched, undo restores, redo reapplies', () => {
        const s0 = freshState();
        const snapshot = JSON.stringify(s0);
        const s1 = dispatch(s0, batch('lock.name', [set('O1', 'name', 'lockX')], 'lock', 'lockX'));
        expect(JSON.stringify(s0)).toBe(snapshot);
        const s2 = dispatch(s1, undoAction());
        expect(s2.idlookup.O1.name).toBe('lock');
        expect(dispatch(s2, redoAction()).idlookup.O1.name).toBe('lockX');
    });

    it('the first write of a mirage slot (isMirage changes): both fields land and undo restores both', () => {
        const s0 = freshState();
        const snapshot = JSON.stringify(s0);
        const s1 = dispatch(s0, batch('EditorV2 set note', [set('M1', 'isMirage', false), set('M1', 'values.0', 'first')]));
        expect(s1.idlookup.M1.isMirage).toBe(false);
        expect(plain(s1.idlookup.M1.values)).toEqual(['first']);
        expect(JSON.stringify(s0)).toBe(snapshot);
        const s2 = dispatch(s1, undoAction());
        expect(s2.idlookup.M1.isMirage).toBe(true);
        expect(plain(s2.idlookup.M1.values)).toEqual([]);
    });

    it('an element written twice in one batch is copied once (clonedCounter +1), the copy-on-write the reducer promises', () => {
        const s0 = freshState();
        const s1 = dispatch(s0, batch('two changes', [set('M1', 'isMirage', false), set('M1', 'values.0', 'first')]));
        expect(s1.idlookup.M1.clonedCounter).toBe(1);
        expect(s1.idlookup.clonedCounter).toBe(1);
    });

    it('a batch of no-ops only returns the previous state and pushes nothing', () => {
        const s0 = freshState();
        const values0 = s0.idlookup.S1.values;
        const s1 = dispatch(s0, batch('nothing', [set('S1', 'isMirage', false), set('S1', 'values.0', 2)]));
        expect(s1).toBe(s0);
        expect(s0.idlookup.S1.values).toBe(values0);
        expect(h.statehistory[USER]?.undoable?.length ?? 0).toBe(0);
    });
});
