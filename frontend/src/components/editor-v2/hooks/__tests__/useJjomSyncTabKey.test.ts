/**
 * `useJjomSync` builds its snapshot and transforms under the tab's layout key (multi-tab L3,
 * P-2026-11-07-1249).
 *
 * The hook is called by `EditorV2Inner` above the `EditorContext.Provider` it renders, so the tab's
 * viewpoint reaches it as a parameter, not through the context (LIR §0). Two vertices carry a record
 * under `A`, `B` and `C`; the root `state.viewpoint` and the tab's viewpoint differ. Under the tab
 * key the nodes stand on the tab's records, a root switch does not move them, and a tab switch
 * re-keys them. With no tab (`undefined`) the root key is read, which is the hook before L3.
 *
 * ── The subject runs, React is stubbed ── (the harness of useJjomSyncOpenSettle.test.ts)
 * The transformer is faked to the geometry read it performs (`readVertexLayout` under the key it is
 * handed, the root's when none), and records the key.
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
        DVertex: { new: () => undefined },
        DVoidEdge: { new2: () => undefined },
        DEdge: {}, DState: {},
        GraphSize: class { constructor(public x: number, public y: number, public w: number, public h: number) {} },
        TRANSACTION: (_n: string, f: () => void) => f(),
        SetFieldAction: action, SetRootFieldAction: action, DeleteElementAction: action,
    };
});
const transformKeys: Array<string | undefined> = [];
vi.mock('../../utils/jjomTransformers', async () => {
    const { readVertexLayout } = await import('../../viewpoint/layout/vertexLayout');
    const { getLayoutKeyOf } = await import('../../viewpoint/layout/vertexLayoutAdapter');
    return {
        jjomVertexToRFNode: (v: any, key?: string) => {
            transformKeys.push(key);
            const eff = readVertexLayout(v.__raw ?? v, key ?? getLayoutKeyOf(redux.state));
            return { id: v.id, position: { x: eff.x, y: eff.y }, data: {} };
        },
        jjomEdgeToRFEdge: (e: any) => ({ id: e.id, source: e.start, target: e.end, data: {} }),
    };
});

import { useJjomSync } from '../useJjomSync';
import { clearAllCanvasUpdated } from '../../sync/syncState';

const rf = { nodes: [] as any[], edges: [] as any[] };
const setNodes = (v: any) => { rf.nodes = typeof v === 'function' ? v(rf.nodes) : v; };
const setEdges = (v: any) => { rf.edges = typeof v === 'function' ? v(rf.edges) : v; };
let frames: Array<() => void> = [];
const frame = () => { const due = frames; frames = []; due.forEach(f => f()); };

function render(viewpointId?: string | null) {
    runtime.i = 0; runtime.e = 0;
    useJjomSync('m', setNodes as any, setEdges as any, undefined, undefined, viewpointId);
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
/** Renders, then lets the frames and timers of the push run. */
function settle(viewpointId?: string | null) {
    render(viewpointId);
    for (let k = 0; k < 4; k++) { frame(); vi.advanceTimersByTime(60); }
    frame();
}
const positions = () => Object.fromEntries(rf.nodes.map(n => [n.id, n.position]));

const REC: Record<string, Record<string, { x: number; y: number }>> = {
    'v-o0': { A: { x: 10, y: 10 }, B: { x: 200, y: 20 }, C: { x: 3000, y: 30 } },
    'v-o1': { A: { x: 11, y: 11 }, B: { x: 210, y: 21 }, C: { x: 3100, y: 31 } },
};
const at = (key: string) => ({ 'v-o0': REC['v-o0'][key], 'v-o1': REC['v-o1'][key] });

/** A model of two objects whose v2-flow graph already holds a vertex per object, laid out under A, B, C. */
function openModel(root: string) {
    const idl: Record<string, any> = {
        m: { id: 'm', className: 'DModel', objects: ['o0', 'o1'], packages: [] },
        g: { id: 'g', className: 'DGraph', model: 'm', graphStyle: 'v2-flow', subElements: ['v-o0', 'v-o1'] },
        A: { id: 'A', isExclusiveView: true }, B: { id: 'B', isExclusiveView: true }, C: { id: 'C', isExclusiveView: true },
    };
    for (const o of ['o0', 'o1']) {
        const v = `v-${o}`;
        idl[o] = { id: o, className: 'DObject', name: o, father: 'm', model: 'm', features: [] };
        const lbv = Object.fromEntries(Object.entries(REC[v]).map(([k, p]) => [k, { ...p, w: 200, h: 120, isResized: false }]));
        idl[v] = { id: v, className: 'DVertex', model: o, father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120, layoutByViewpoint: lbv };
    }
    redux.state = { graphs: ['g'], viewpoint: root, idlookup: idl };
}
const setRoot = (root: string) => { redux.state = { ...redux.state, viewpoint: root }; };

beforeEach(() => {
    vi.useFakeTimers();
    runtime.slots = []; runtime.effects = [];
    rf.nodes = []; rf.edges = []; frames = []; transformKeys.length = 0;
    clearAllCanvasUpdated();
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => { frames.push(f); return frames.length; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => { unmount(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('useJjomSync: the tab layout key', () => {
    it('the first push transforms every vertex under the tab key, not the root one', () => {
        openModel('A');
        settle('B');
        expect(positions()).toEqual(at('B'));
        expect(transformKeys.length).toBeGreaterThan(0);
        expect(new Set(transformKeys)).toEqual(new Set(['B']));
    });

    it('a root switch with the tab key unchanged leaves the tab nodes where they are', () => {
        openModel('A');
        settle('B');
        setRoot('C');
        settle('B');
        expect(positions()).toEqual(at('B'));
    });

    it('a tab switch re-keys every vertex to the new key, the root unchanged', () => {
        openModel('A');
        settle('B');
        settle('C');
        expect(positions()).toEqual(at('C'));
        settle(null);
        // Abstract syntax: no record under that key, the seed.
        expect(positions()).toEqual({ 'v-o0': { x: 0, y: 0 }, 'v-o1': { x: 0, y: 0 } });
    });

    it('with no tab the root key is read and followed: the hook of one tab, unchanged', () => {
        openModel('A');
        settle();
        expect(positions()).toEqual(at('A'));
        setRoot('B');
        settle();
        expect(positions()).toEqual(at('B'));
    });

    it('with one tab and its key equal to the root key, the canvas equals the keyless one', () => {
        const run = (tab?: string) => {
            runtime.slots = []; runtime.effects = []; rf.nodes = []; frames = [];
            openModel('A');
            settle(tab);
            setRoot('B');
            settle(tab === undefined ? undefined : 'B');
            const out = rf.nodes.map(n => ({ ...n }));
            unmount();
            return out;
        };
        expect(run('A')).toEqual(run());
    });
});
