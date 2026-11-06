/**
 * A `pointedBy` write parked during a batch is resolved in that batch (P-2026-10-24-1350, R-JJD-12), and a
 * created element carries its root-folder entry once (ticket F8).
 * Report: docs/discovery/discovery_2026-10-24_undo_after_apply.md.
 *
 * THE DEFECT, measured in the app (probe `frontend/scripts/probe/jjodie-udo-after-apply.ts`): a vertex batch holds
 * `idlookup.<graph>.subElements += <vertex>` and the vertex's `CreateElementAction`. Sorted by path the graph comes first,
 * `PointedBy.add` finds no vertex and parks the write in `PendingPointedByPaths.all`, which was drained only at the start
 * of the NEXT composite: any later action (a canvas click) then carried the vertex's `pointedBy` and pushed an undo entry
 * of its own. F8: `CreateElementAction` pushed the folder entry (`vertexs`) into the element by hand and the derived
 * `vertexs[]` pointer action added it again through `PointedBy.add`.
 *
 * HERE the real `_reducer` (with the real `Uobj`) runs in `environment: node` with the doubles of
 * `reducerCopyOnWrite.test.ts`. `PendingPointedByPaths` and `PointedBy` are doubled with the bodies of
 * `joiner/classes.ts:1840-2022` (the parts the reducer calls): `classes.ts` imports the `joiner` barrel, which does not
 * load in the bench. The double is a copy, not the source: a change to those bodies is not seen here.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
    const g = globalThis as any;
    g.window = g.window ?? {};
    g.HTMLElement = g.HTMLElement ?? class {};

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
        endsWith: (s: string, end: string) => s.endsWith(end),
        getStackTrace: () => [],
    };
    g.window.U = U;
    const Log: any = new Proxy({}, { get: () => () => undefined });
    const isPointer = (v: any) => typeof v === 'string' && v.startsWith('Pointer');

    // joiner/classes.ts PointedBy, the members the reducer and the queue call.
    class PointedBy {
        source: string;
        private constructor(source: string) { this.source = source; }
        static new(source: string, modifier?: '-=' | '+='): PointedBy {
            if (modifier && U.endsWith(source, modifier)) source = source.substring(0, source.length - (modifier?.length || 0));
            return new PointedBy(source);
        }
        static remove(oldValue: any, action: any, state: any, casee?: '+=' | '-=', oldState?: any): any {
            if (!oldValue) return state;
            const oldtarget = state.idlookup[oldValue];
            if (!oldtarget) return state;
            let index = -1;
            const actionpath: string = action.path.substring(0, action.path.length - (casee?.length || 0));
            for (let i = 0; i < oldtarget.pointedBy.length; i++) { if (oldtarget.pointedBy[i].source === actionpath) { index = i; break; } }
            if (index < 0) return state;
            if (oldState === state) state = { ...state };
            if (oldState?.idlookup === state.idlookup) state.idlookup = { ...state.idlookup };
            if (oldState?.idlookup[oldValue] === state.idlookup[oldValue]) state.idlookup[oldValue] = { ...oldtarget };
            state.idlookup[oldValue].pointedBy.splice(index, 1);
            return state;
        }
        static add(pointed_val: any, action: any, state: any, casee?: '+=' | '-=', oldState?: any): any {
            if (!isPointer(pointed_val)) {
                const arr: string[] = action.pathArray.filter((e: any) => isPointer(e));
                if (arr.length < 2) return state;
                let pval: string = arr[arr.length - 1];
                const len = pval.length;
                if (pval[len - 1] === ']' && pval[len - 2] === '[' || pval[len - 1] === '=' && (pval[len - 2] === '-' || pval[len - 2] === '+')) pval = pval.substring(0, len - 2);
                pointed_val = pval;
            }
            if (!pointed_val) return state;
            const newtarget = state.idlookup[pointed_val];
            if (!newtarget) { PendingPointedByPaths.new(action, state, pointed_val, casee).saveForLater(); return state; }
            if (oldState === state) state = { ...state };
            if (oldState?.idlookup === state.idlookup) state.idlookup = { ...state.idlookup };
            if (oldState?.idlookup[pointed_val] === newtarget) state.idlookup[pointed_val] = { ...newtarget };
            state.idlookup[pointed_val].pointedBy = [...newtarget.pointedBy, PointedBy.new(action.path, casee)];
            return state;
        }
    }

    // joiner/classes.ts PendingPointedByPaths, the direct-resolution road the reducer takes.
    class PendingPointedByPaths {
        static all: PendingPointedByPaths[] = [];
        action: any;
        constructor(public from: string, public holder: string, public casee?: '+=' | '-=') {}
        static new(action: any, _state: any, ptr: string, casee?: '+=' | '-='): PendingPointedByPaths {
            const p = new PendingPointedByPaths(action.path, ptr, casee);
            p.action = action;
            return p;
        }
        attemptResolveDirectly(state: any, oldState: any): any {
            if (state.idlookup[this.holder]) state = this.resolveDirectly(state, oldState);
            return state;
        }
        private resolveDirectly(state: any, oldState: any): any {
            U.arrayRemoveAll(PendingPointedByPaths.all, this);
            if (state === oldState) state = { ...state };
            let dobj = state.idlookup[this.holder];
            const oldobj = oldState.idlookup[this.holder];
            if (state.idlookup === oldState.idlookup) state.idlookup = { ...state.idlookup };
            if (oldobj && dobj === oldobj) state.idlookup[this.holder] = dobj = { ...dobj };
            if (oldobj && dobj.pointedBy === oldobj.pointedBy) dobj.pointedBy = [...dobj.pointedBy];
            dobj.pointedBy.push(PointedBy.new(this.action.path, this.casee));
            return state;
        }
        saveForLater(): void { PendingPointedByPaths.all.push(this); }
        static getSolveableActions2(state: any, oldState: any): any {
            for (const p of [...this.all]) state = p.attemptResolveDirectly(state, oldState);
            return state;
        }
    }

    class UserHistory { undoable: any[] = []; redoable: any[] = []; }
    return { U, Log, isPointer, PointedBy, PendingPointedByPaths, UserHistory, statehistory: {} as any, holder: {} as any };
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
    // action.ts SetRootFieldAction.create, the shape the reducer derives for the root folder of a created element.
    SetRootFieldAction: {
        cname: 'SetRootFieldAction', type: 'SET_ROOT_FIELD',
        create: (field: string, value: any, accessModifier: string, isPointer: boolean) =>
            ({ type: 'SET_ROOT_FIELD', className: 'SetRootFieldAction', field, value, accessModifier, isPointer, sender: 'U1' }),
    },
    CreateElementAction: { cname: 'CreateElementAction', type: 'CREATE_ELEMENT' },
    DeleteElementAction: { cname: 'DeleteElementAction', type: 'DELETE_ELEMENT' },
    DPointerTargetable: { pendingCreation: {} },
    PendingPointedByPaths: h.PendingPointedByPaths,
    Pointers: { isPointer: h.isPointer },
    PointedBy: h.PointedBy,
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

// Ids embed the creation time (`classes.ts:597`): an older graph's path sorts before a newer vertex's.
const G = 'Pointer1000_G';
const V = 'Pointer2000_V';
const C = 'Pointer2000_C';
const SUB = `idlookup.${G}.subElements`;

/** `setExternalPtr(father, 'subElements', '+=')` of the DGraphElement constructor (`classes.ts:636`). */
const subElementsAdd = (holder: string, id: string) =>
    ({ type: 'SET_ME_FIELD', className: 'SetFieldAction', field: `idlookup.${holder}.subElements`, value: id, accessModifier: '+=', isPointer: true, sender: USER });
/** `CreateElementAction.new(me)` (`action.ts:744`): path `idlookup.<id>`, value the new D-object. */
const create = (elem: any) => ({ type: 'CREATE_ELEMENT', className: 'CreateElementAction', field: `idlookup.${elem.id}`, value: elem, accessModifier: '', isPointer: false, sender: USER });
const setRoot = (field: string, value: unknown) =>
    ({ type: 'SET_ROOT_FIELD', className: 'SetRootFieldAction', field, value, accessModifier: '', isPointer: false, sender: USER });
const batch = (title: string, actions: any[]) => ({ type: 'COMPOSITE_ACTION', className: 'CompositeAction', sender: USER, actions, descriptor: { path: title } });
const undoAction = () => ({ type: 'UndoAction', className: 'UndoAction', value: 1, forUser: USER, sender: USER });
const redoAction = () => ({ type: 'RedoAction', className: 'RedoAction', value: 1, forUser: USER, sender: USER });

function dispatch(state: any, action: any): any {
    clock += 1000;
    return _reducer(state, action as any);
}

function freshState(): any {
    return {
        timestamp: clock, action_title: '', action_description: '', _lastSelected: { node: '' },
        vertexs: [], classs: [],
        idlookup: { [G]: { id: G, className: 'DGraph', subElements: [], pointedBy: [] } },
    };
}
const vertexBatch = () => batch('Create element', [subElementsAdd(G, V), create({ id: V, className: 'DVertex', father: G, pointedBy: [] })]);
const sources = (state: any, id: string): string[] => (state.idlookup[id]?.pointedBy || []).map((p: any) => p.source);
const count = (arr: string[], s: string) => arr.filter((x) => x === s).length;
const top = () => h.statehistory[USER].undoable[h.statehistory[USER].undoable.length - 1];

beforeEach(() => {
    for (const k of Object.keys(h.statehistory)) delete h.statehistory[k];
    h.statehistory.globalcanundostate = true;
    h.statehistory.all = new h.UserHistory();
    h.PendingPointedByPaths.all.length = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
});

describe('a pointedBy parked during a batch is resolved in that batch', () => {
    it('graph.subElements += V and CreateElementAction(V): V.pointedBy holds the subElements path, the queue is empty', () => {
        const s1 = dispatch(freshState(), vertexBatch());
        expect(s1.idlookup[G].subElements).toEqual([V]);
        expect(sources(s1, V)).toContain(SUB);
        expect(h.PendingPointedByPaths.all).toHaveLength(0);
    });

    it('the previous state keeps its identity and content', () => {
        const s0 = freshState();
        const snapshot = JSON.stringify(s0);
        const idlookup0 = s0.idlookup;
        const graph0 = s0.idlookup[G];
        const sub0 = graph0.subElements;
        const s1 = dispatch(s0, vertexBatch());
        expect(JSON.stringify(s0)).toBe(snapshot);
        expect(s0.idlookup).toBe(idlookup0);
        expect(s0.idlookup[G]).toBe(graph0);
        expect(graph0.subElements).toBe(sub0);
        expect(s0.idlookup[V]).toBeUndefined();
        expect(s1.idlookup).not.toBe(idlookup0);
    });

    it('the next unrelated action yields no idlookup in its delta and pushes no undo entry', () => {
        // The click of the probe: `_lastSelected` alone is not a relevant change (reducer.ts isRelevantChange), so
        // before the fix only the drained `pointedBy` (an `idlookup` key) made it an entry of its own.
        const s1 = dispatch(freshState(), vertexBatch());
        const n1 = h.statehistory[USER].undoable.length;
        const top1 = top();
        const s2 = dispatch(s1, batch('EditorV2 deselect', [setRoot('_lastSelected', { node: 'X' })]));
        expect(s2._lastSelected).toEqual({ node: 'X' });
        expect(s2.idlookup).toBe(s1.idlookup);
        expect(h.statehistory[USER].undoable.length).toBe(n1);
        expect(top()).toBe(top1);
    });

    it('one undo removes the vertex and its subElements entry, one redo brings back both with the path', () => {
        const s1 = dispatch(freshState(), vertexBatch());
        const s2 = dispatch(s1, undoAction());
        expect(s2.idlookup[V]).toBeUndefined();
        expect(s2.idlookup[G].subElements).toEqual([]);
        const s3 = dispatch(s2, redoAction());
        expect(sources(s3, V)).toContain(SUB);
    });
});

describe('ticket F8: a created element carries its root-folder entry once', () => {
    it('a DVertex (folder `vertexs`, sorted after idlookup): one `vertexs` entry after creation, undo and redo', () => {
        const s1 = dispatch(freshState(), vertexBatch());
        expect(s1.vertexs).toEqual([V]);
        expect(count(sources(s1, V), 'vertexs')).toBe(1);
        const s2 = dispatch(s1, undoAction());
        expect(s2.idlookup[V]).toBeUndefined();
        const s3 = dispatch(s2, redoAction());
        expect(count(sources(s3, V), 'vertexs')).toBe(1);
        expect(count(sources(s3, V), SUB)).toBe(1);
    });

    it('a DClass (folder `classs`, sorted before idlookup): one `classs` entry in the same batch', () => {
        const s1 = dispatch(freshState(), batch('Create element', [create({ id: C, className: 'DClass', pointedBy: [] })]));
        expect(s1.classs).toEqual([C]);
        expect(count(sources(s1, C), 'classs')).toBe(1);
        expect(h.PendingPointedByPaths.all).toHaveLength(0);
    });
});
