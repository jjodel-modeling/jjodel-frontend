/**
 * The open-time callback of `useJjomSync` waits for the open to settle (P-2026-11-04-1500).
 *
 * Before this lane the init effect called `requestAnimationFrame(onInitialized)` at its first push.
 * The creators of the populate run of the same commit (`DVertex.new`, `DVoidEdge.new2`) reach the
 * store later, through the async `TRANSACTION` and the `setTimeout(0)` dispatch, so EditorV2's
 * auto-layout decision read a prefix of the graph: measured on b6_5 (191 objects), ELK on 1 node and
 * 0 edges in three of five runs, on 191 and 190 in one, on both in one. The creating populate run
 * can also come in a later commit than the init push (measured on the first version of this gate,
 * run r3). Now `onInitialized` fires once, when every object of the model has a vertex, every
 * created element has landed and the canvas push has processed it, or earlier
 * through two exits that lower `justCreatedGraphRef`: the user has started working (a canvas
 * write-back marked an element of the graph), or the deadline.
 *
 * ── The subject runs, React is stubbed ──────────────────────────────────────
 * `useRef`/`useState`/`useCallback` live in slots, `useEffect` honours its dependency array and runs
 * after the body (`commit()`), `useSelector` runs the selector against the fake store and keeps the
 * previous value when its comparator says equal. The joiner barrel is faked: the creators return an
 * id and land nothing, `land()` writes what a dispatch would. `requestAnimationFrame` is a queue run
 * by hand (`frame()`), timers are fake.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Effect = { fn: () => void | (() => void); deps?: unknown[] };
const runtime = {
    slots: [] as any[], i: 0, e: 0,
    effects: [] as Array<{ deps?: unknown[]; cleanup?: () => void; due?: Effect }>,
};
const depsEqual = (a?: unknown[], b?: unknown[]) =>
    !!a && !!b && a.length === b.length && a.every((x, k) => Object.is(x, b[k]));
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useRef: (v: unknown) => {
            const k = runtime.i++;
            if (!(k in runtime.slots)) runtime.slots[k] = { current: v };
            return runtime.slots[k];
        },
        useState: (v: unknown) => {
            const k = runtime.i++;
            if (!(k in runtime.slots)) runtime.slots[k] = v;
            return [runtime.slots[k], (n: any) => { runtime.slots[k] = typeof n === 'function' ? n(runtime.slots[k]) : n; }];
        },
        useCallback: (fn: unknown, deps: unknown[]) => {
            const k = runtime.i++;
            const s = runtime.slots[k];
            if (!s || !depsEqual(s.deps, deps)) runtime.slots[k] = { fn, deps };
            return runtime.slots[k].fn;
        },
        useEffect: (fn: Effect['fn'], deps?: unknown[]) => {
            const k = runtime.e++;
            const slot = runtime.effects[k] ?? (runtime.effects[k] = {});
            if (!slot.deps || !deps || !depsEqual(slot.deps, deps)) slot.due = { fn, deps };
        },
    };
});

const redux: { state: any } = { state: {} };
vi.mock('react-redux', () => ({
    useSelector: (sel: (s: any) => unknown, eq?: (a: any, b: any) => boolean) => {
        const k = runtime.i++;
        const next = sel(redux.state);
        const s = runtime.slots[k];
        if (s && (eq ? eq(s.v, next) : Object.is(s.v, next))) return s.v;
        runtime.slots[k] = { v: next };
        return next;
    },
}));

const lookup = () => redux.state.idlookup as Record<string, any>;
const created: string[] = [];
const creators = { on: true };
vi.mock('../../../../joiner', () => {
    const fromId = (id: string) => (lookup()[id] ? { ...lookup()[id] } : undefined);
    const action = { new: () => undefined };
    return {
        store: { getState: () => redux.state },
        DGraph: { fromPointer: (ptrs: string[]) => (ptrs ?? []).map(id => lookup()[id]), new: () => ({ id: 'g' }) },
        LGraph: {
            fromPointer: (id: string) => {
                const g = lookup()[id];
                if (!g) return undefined;
                const subs = (g.subElements as string[]).map(s => lookup()[s]).filter(Boolean);
                return { nodes: subs.filter(d => d.className === 'DVertex'), edges: subs.filter(d => d.className === 'DVoidEdge') };
            },
        },
        LPointerTargetable: { fromPointer: fromId },
        DVertex: { new: (_a: unknown, modelId: string) => { if (!creators.on) return undefined; const id = `v-${modelId}`; created.push(id); return { id }; } },
        DVoidEdge: { new2: (_m: unknown, _p: unknown, _g: unknown, _n: unknown, s: string, t: string) => { const id = `e-${s}-${t}`; created.push(id); return { id }; } },
        DEdge: {}, DState: {},
        GraphSize: class { constructor(public x: number, public y: number, public w: number, public h: number) {} },
        TRANSACTION: (_n: string, f: () => void) => f(),
        SetFieldAction: action, SetRootFieldAction: action, DeleteElementAction: action,
    };
});
vi.mock('../../utils/jjomTransformers', () => ({
    jjomVertexToRFNode: (v: any) => ({ id: v.id, position: { x: 0, y: 0 }, data: {} }),
    jjomEdgeToRFEdge: (e: any) => ({ id: e.id, source: e.start, target: e.end, data: {} }),
}));

import { useJjomSync, openSettleVerdict, OPEN_SETTLE_DEADLINE_MS } from '../useJjomSync';
import { clearAllCanvasUpdated, markCanvasUpdated } from '../../sync/syncState';

// ── React Flow, frames, the hook driver ──────────────────────────────────────
const rf = { nodes: [] as any[], edges: [] as any[] };
const setNodes = (v: any) => { rf.nodes = typeof v === 'function' ? v(rf.nodes) : v; };
const setEdges = (v: any) => { rf.edges = typeof v === 'function' ? v(rf.edges) : v; };
let frames: Array<() => void> = [];
const frame = () => { const due = frames; frames = []; due.forEach(f => f()); };
const calls: Array<{ nodes: number; edges: number; justCreated: boolean }> = [];
let result: any;
const onInit = () => calls.push({ nodes: rf.nodes.length, edges: rf.edges.length, justCreated: result.justCreatedGraphRef.current });

function render() {
    runtime.i = 0; runtime.e = 0;
    result = useJjomSync('m', setNodes as any, setEdges as any, onInit);
    for (const slot of runtime.effects) {
        if (!slot.due) continue;
        slot.cleanup?.();
        const c = slot.due.fn();
        slot.cleanup = typeof c === 'function' ? c : undefined;
        slot.deps = slot.due.deps;
        slot.due = undefined;
    }
}
function unmount() { for (const slot of runtime.effects) slot.cleanup?.(); }

/** A model of `n` objects whose v2-flow graph exists and holds nothing yet. */
function openModel(n: number, refs = false) {
    const objs = Array.from({ length: n }, (_, k) => `o${k}`);
    const idl: Record<string, any> = {
        m: { id: 'm', className: 'DModel', objects: objs, packages: [] },
        g: { id: 'g', className: 'DGraph', model: 'm', graphStyle: 'v2-flow', subElements: [] },
    };
    if (refs) idl.ref = { id: 'ref', className: 'DReference', name: 'next' };
    objs.forEach((id, k) => {
        idl[id] = { id, className: 'DObject', name: id, father: 'm', model: 'm', features: refs ? [`f${k}`] : [] };
        if (refs) idl[`f${k}`] = { id: `f${k}`, className: 'DValue', father: id, instanceof: 'ref', values: k + 1 < n ? [`o${k + 1}`] : [] };
    });
    redux.state = { graphs: ['g'], idlookup: idl };
}
/** What the populate dispatch writes: the created vertices and edges, linked into the graph. */
function land(ids = created.splice(0)) {
    const idl = { ...lookup() };
    const subs = [...idl.g.subElements];
    for (const id of ids) {
        if (id.startsWith('v-')) idl[id] = { id, className: 'DVertex', model: id.slice(2), father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120 };
        else { const [, s, t] = id.match(/^e-(v-[^-]+)-(v-.+)$/)!; idl[id] = { id, className: 'DVoidEdge', start: s, end: t, father: 'g', graph: 'g', isReference: true, model: 'ref' }; }
        subs.push(id);
    }
    idl.g = { ...idl.g, subElements: subs };
    redux.state = { ...redux.state, idlookup: idl };
}

beforeEach(() => {
    vi.useFakeTimers();
    runtime.slots = []; runtime.effects = [];
    rf.nodes = []; rf.edges = []; frames = []; calls.length = 0; created.length = 0; creators.on = true;
    clearAllCanvasUpdated();
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => { frames.push(f); return frames.length; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => { unmount(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('openSettleVerdict', () => {
    const base = { created: ['v1', 'e1'], idlookup: { v1: {}, e1: {} } as Record<string, unknown>, listed: ['v1', 'e1'], processed: ['v1', 'e1'], patchQueued: false, unplacedObjects: 0, touched: false, elapsedMs: 0, deadlineMs: 1000 };
    it('settled when every created element has landed and been pushed, no patch queued', () => {
        expect(openSettleVerdict(base)).toEqual({ verdict: 'settled', pending: [] });
    });
    it('waits for a created element the store does not hold yet', () => {
        expect(openSettleVerdict({ ...base, idlookup: { v1: {} } })).toEqual({ verdict: 'wait', pending: ['e1'] });
    });
    it('waits for a listed element the canvas push has not processed yet', () => {
        expect(openSettleVerdict({ ...base, processed: ['v1'] })).toEqual({ verdict: 'wait', pending: ['e1'] });
    });
    it('does not wait for a landed element the graph does not list', () => {
        expect(openSettleVerdict({ ...base, listed: ['v1'], processed: ['v1'] }).verdict).toBe('settled');
    });
    it('waits while an object of the model has no vertex yet', () => {
        expect(openSettleVerdict({ ...base, unplacedObjects: 1 }).verdict).toBe('wait');
    });
    it('waits for a queued patch', () => {
        expect(openSettleVerdict({ ...base, patchQueued: true }).verdict).toBe('wait');
    });
    it('the user exit wins over a settled open', () => {
        expect(openSettleVerdict({ ...base, touched: true }).verdict).toBe('touched');
    });
    it('the deadline ends the wait, not a settled open', () => {
        expect(openSettleVerdict({ ...base, processed: [], elapsedMs: 1000 }).verdict).toBe('deadline');
        expect(openSettleVerdict({ ...base, elapsedMs: 5000 }).verdict).toBe('settled');
    });
});

describe('useJjomSync open-time callback', () => {
    it('race: creations land after the init push, the callback fires once, after, on the whole graph', () => {
        openModel(3, true);
        render();
        expect(created).toEqual(['v-o0', 'v-o1', 'v-o2', 'e-v-o0-v-o1', 'e-v-o1-v-o2']);
        frame(); vi.advanceTimersByTime(60); frame();
        expect(calls).toEqual([]);
        land(); render();
        frame(); frame(); vi.advanceTimersByTime(200); frame();
        expect(calls).toEqual([{ nodes: 3, edges: 2, justCreated: true }]);
        vi.advanceTimersByTime(OPEN_SETTLE_DEADLINE_MS); frame();
        expect(calls).toHaveLength(1);
    });

    it('two interleavings of the dispatch give the same observation', () => {
        const run = (landEarly: boolean) => {
            runtime.slots = []; runtime.effects = []; rf.nodes = []; rf.edges = []; frames = []; calls.length = 0; created.length = 0;
            openModel(3, true);
            render();
            if (landEarly) { land(); render(); }
            frame(); vi.advanceTimersByTime(60); frame();
            if (!landEarly) { land(); render(); }
            for (let k = 0; k < 4; k++) { frame(); vi.advanceTimersByTime(60); }
            frame();
            const out = [...calls];
            unmount();
            return out;
        };
        expect(run(false)).toEqual(run(true));
        expect(run(false)).toEqual([{ nodes: 3, edges: 2, justCreated: true }]);
    });

    it('the creating populate run comes after the init push: the callback waits for it', () => {
        openModel(3, true);
        creators.on = false;
        render();
        expect(created).toEqual([]);
        frame(); vi.advanceTimersByTime(60); frame();
        expect(calls).toEqual([]);
        creators.on = true;
        vi.advanceTimersByTime(200);
        const idl = lookup();
        redux.state = { ...redux.state, idlookup: { ...idl, m: { ...idl.m, objects: [...idl.m.objects, 'o3'] }, o3: { id: 'o3', className: 'DObject', name: 'o3', father: 'm', model: 'm', features: [] } } };
        render();
        expect(created).toEqual(['v-o0', 'v-o1', 'v-o2', 'v-o3', 'e-v-o0-v-o1', 'e-v-o1-v-o2']);
        land(); render();
        frame(); vi.advanceTimersByTime(60); frame(); frame();
        expect(calls).toEqual([{ nodes: 4, edges: 2, justCreated: true }]);
    });

    it('the user starts working during the wait: callback with the flag down', () => {
        openModel(2);
        render();
        frame();
        land(); render();
        markCanvasUpdated('v-o0');
        vi.advanceTimersByTime(60); frame(); frame();
        expect(calls).toHaveLength(1);
        expect(calls[0].justCreated).toBe(false);
    });

    it('a creation that never lands: callback at the deadline, the flag down', () => {
        openModel(2);
        render();
        vi.advanceTimersByTime(OPEN_SETTLE_DEADLINE_MS - 100); frame();
        expect(calls).toEqual([]);
        vi.advanceTimersByTime(200); frame();
        expect(calls).toEqual([{ nodes: 0, edges: 0, justCreated: false }]);
    });

    it('a mount that creates nothing fires in the first frame, as before', () => {
        openModel(2);
        land(['v-o0', 'v-o1']);
        render();
        expect(created).toEqual([]);
        frame();
        expect(calls).toEqual([{ nodes: 2, edges: 0, justCreated: false }]);
    });
});
