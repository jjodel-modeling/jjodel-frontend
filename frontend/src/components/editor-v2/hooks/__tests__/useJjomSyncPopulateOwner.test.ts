/**
 * Two `useJjomSync` instances on one model: one populate owner, registries cleared by the last
 * instance (multi-tab L4, P-2026-11-08-0131, R-MT-17).
 *
 * An action reaches the store one macrotask after it fires (redux/action/action.ts:352), so two
 * instances whose populate effects run in the same commit both see the same missing element and both
 * create it: two vertices for one class, two M2 edges for one reference (discovery
 * 2026-11-06 multi-tab §3.7). And the unmount of any instance cleared every sync registry, so closing
 * one tab wiped `canvasEdgePairs` and `edgeRefIds` for the other (§3.2). Now the first mounted instance
 * owns the populate and hands it over on unmount; the others render only. See
 * docs/discovery/lir_2026-11-07_l4_populate_owner.md.
 *
 * ── The subject runs, React is stubbed ── (the harness of useJjomSyncOpenSettle.test.ts, one runtime
 * per instance). The creators return an id and land nothing; `land()` writes what the dispatch would.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Effect = { fn: () => void | (() => void); deps?: unknown[] };
type Runtime = { slots: any[]; i: number; e: number; effects: Array<{ deps?: unknown[]; cleanup?: () => void; due?: Effect }> };
const rt: { cur: Runtime } = { cur: { slots: [], i: 0, e: 0, effects: [] } };
const depsEqual = (a?: unknown[], b?: unknown[]) =>
    !!a && !!b && a.length === b.length && a.every((x, k) => Object.is(x, b[k]));
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useRef: (v: unknown) => {
            const r = rt.cur; const k = r.i++;
            if (!(k in r.slots)) r.slots[k] = { current: v };
            return r.slots[k];
        },
        useState: (v: unknown) => {
            const r = rt.cur; const k = r.i++;
            if (!(k in r.slots)) r.slots[k] = v;
            return [r.slots[k], (n: any) => { r.slots[k] = typeof n === 'function' ? n(r.slots[k]) : n; }];
        },
        useCallback: (fn: unknown, deps: unknown[]) => {
            const r = rt.cur; const k = r.i++;
            const s = r.slots[k];
            if (!s || !depsEqual(s.deps, deps)) r.slots[k] = { fn, deps };
            return r.slots[k].fn;
        },
        useEffect: (fn: Effect['fn'], deps?: unknown[]) => {
            const r = rt.cur; const k = r.e++;
            const slot = r.effects[k] ?? (r.effects[k] = {});
            if (!slot.deps || !deps || !depsEqual(slot.deps, deps)) slot.due = { fn, deps };
        },
    };
});

const redux: { state: any } = { state: {} };
vi.mock('react-redux', () => ({
    useSelector: (sel: (s: any) => unknown, eq?: (a: any, b: any) => boolean) => {
        const r = rt.cur; const k = r.i++;
        const next = sel(redux.state);
        const s = r.slots[k];
        if (s && (eq ? eq(s.v, next) : Object.is(s.v, next))) return s.v;
        r.slots[k] = { v: next };
        return next;
    },
}));

const lookup = () => redux.state.idlookup as Record<string, any>;
/** Every creator call and every non-creator write, in order. */
const writes = {
    vertices: [] as string[],
    edges: [] as Array<{ id: string; model: unknown; s: string; t: string; isExtend?: boolean; isReference?: boolean }>,
    sets: 0,
    deletes: [] as string[],
};
vi.mock('../../../../joiner', () => {
    const fromId = (id: string) => (lookup()[id] ? { ...lookup()[id] } : undefined);
    const action = { new: () => undefined };
    let n = 0;
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
        DVertex: { new: (_a: unknown, modelId: string) => { writes.vertices.push(modelId); return { id: `v${modelId}` }; } },
        DVoidEdge: {
            new2: (m: unknown, _p: unknown, _g: unknown, _n: unknown, s: string, t: string, cb?: (d: any) => void) => {
                const d: any = {}; cb?.(d);
                const id = `ne${++n}`;
                writes.edges.push({ id, model: m, s, t, isExtend: d.isExtend, isReference: d.isReference });
                return { id };
            },
        },
        DEdge: {}, DState: {},
        GraphSize: class { constructor(public x: number, public y: number, public w: number, public h: number) {} },
        TRANSACTION: (_n: string, f: () => void) => f(),
        SetFieldAction: { new: () => { writes.sets++; } },
        SetRootFieldAction: action,
        DeleteElementAction: { new: (raw: any) => { writes.deletes.push(raw?.id); } },
    };
});
vi.mock('../../utils/jjomTransformers', () => ({
    jjomVertexToRFNode: (v: any) => ({ id: v.id, position: { x: 0, y: 0 }, data: {} }),
    jjomEdgeToRFEdge: (e: any) => ({
        id: e.id, source: e.start, target: e.end,
        type: e.isExtend ? 'inheritance' : 'reference',
        data: e.isExtend ? {} : { jjomRefId: e.model },
    }),
}));

import { useJjomSync } from '../useJjomSync';
import {
    clearAllCanvasUpdated, markCanvasEdgePair, hasCanvasEdgePair, setEdgeRefId, getEdgeRefId,
    clearCanvasEdgePairs, clearEdgeRefIds,
} from '../../sync/syncState';

// ── Instances (one per tab), frames, the driver ──────────────────────────────
interface Tab { rt: Runtime; rf: { nodes: any[]; edges: any[] }; vp?: string | null; mounted: boolean; setNodes: any; setEdges: any }
const tabs: Tab[] = [];
function mount(vp?: string | null): Tab {
    const rf = { nodes: [] as any[], edges: [] as any[] };
    const tab: Tab = {
        rt: { slots: [], i: 0, e: 0, effects: [] }, rf, vp, mounted: true,
        setNodes: (v: any) => { rf.nodes = typeof v === 'function' ? v(rf.nodes) : v; },
        setEdges: (v: any) => { rf.edges = typeof v === 'function' ? v(rf.edges) : v; },
    };
    tabs.push(tab);
    render(tab);
    return tab;
}
function render(tab: Tab) {
    rt.cur = tab.rt; tab.rt.i = 0; tab.rt.e = 0;
    useJjomSync('mm', tab.setNodes, tab.setEdges, undefined, undefined, tab.vp);
    for (const slot of tab.rt.effects) {
        if (!slot.due) continue;
        slot.cleanup?.();
        const c = slot.due.fn();
        slot.cleanup = typeof c === 'function' ? c : undefined;
        slot.deps = slot.due.deps;
        slot.due = undefined;
    }
}
/** One commit: every mounted instance renders and runs its due effects, in mount order. */
const commit = () => { for (const t of tabs) if (t.mounted) render(t); };
function unmount(tab: Tab) {
    if (!tab.mounted) return;
    tab.mounted = false;
    for (const slot of tab.rt.effects) slot.cleanup?.();
}
let frames: Array<() => void> = [];
const frame = () => { const due = frames; frames = []; due.forEach(f => f()); };
/** Past the 150 ms re-entry window of every instance, with the frames of the push run. */
const settle = () => { for (let k = 0; k < 4; k++) { frame(); vi.advanceTimersByTime(60); } frame(); };

// ── The metamodel: classes A and B on the canvas, nothing else ───────────────
function openMetamodel(extra: Record<string, any> = {}, subs: string[] = []) {
    redux.state = {
        graphs: ['g'],
        idlookup: {
            mm: { id: 'mm', className: 'DModel', packages: ['p'], objects: [] },
            p: { id: 'p', className: 'DPackage', classes: ['A', 'B'], enumerators: [], subpackages: [] },
            A: { id: 'A', className: 'DClass', references: [], extends: [] },
            B: { id: 'B', className: 'DClass', references: [], extends: [] },
            g: { id: 'g', className: 'DGraph', model: 'mm', graphStyle: 'v2-flow', subElements: ['vA', 'vB', ...subs] },
            vA: { id: 'vA', className: 'DVertex', model: 'A', father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120 },
            vB: { id: 'vB', className: 'DVertex', model: 'B', father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120 },
            vp2: { id: 'vp2', isExclusiveView: true },
            ...extra,
        },
    };
}
const patch = (entries: Record<string, any>) => { redux.state = { ...redux.state, idlookup: { ...lookup(), ...entries } }; };
/** A class added from outside the canvas (Tree View, JjScript): the package lists it, no vertex yet. */
const addClass = (id: string) => patch({
    p: { ...lookup().p, classes: [...lookup().p.classes, id] },
    [id]: { id, className: 'DClass', references: [], extends: [] },
});
/** An M2 reference added from Properties: the class lists it, no edge yet. */
const addReference = (refId: string, from: string, to: string) => patch({
    [from]: { ...lookup()[from], references: [...lookup()[from].references, refId] },
    [refId]: { id: refId, className: 'DReference', type: to },
});
/** What the dispatch of the creators writes: the vertices and edges, linked into the graph. */
function land() {
    const idl = { ...lookup() };
    const subs = [...idl.g.subElements];
    for (const m of writes.vertices) {
        const id = `v${m}`;
        if (idl[id]) continue;
        idl[id] = { id, className: 'DVertex', model: m, father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120 };
        subs.push(id);
    }
    for (const e of writes.edges) {
        if (idl[e.id]) continue;
        idl[e.id] = { id: e.id, className: 'DVoidEdge', start: e.s, end: e.t, model: e.model, father: 'g', graph: 'g', isExtend: e.isExtend, isReference: e.isReference };
        subs.push(e.id);
    }
    idl.g = { ...idl.g, subElements: subs };
    redux.state = { ...redux.state, idlookup: idl };
}
const edgesFor = (refId: string) => writes.edges.filter(e => e.model === refId);

beforeEach(() => {
    vi.useFakeTimers();
    tabs.length = 0; frames = [];
    writes.vertices.length = 0; writes.edges.length = 0; writes.sets = 0; writes.deletes.length = 0;
    clearAllCanvasUpdated(); clearCanvasEdgePairs(); clearEdgeRefIds();
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => { frames.push(f); return frames.length; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => { for (const t of tabs) unmount(t); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('useJjomSync: two instances on one model, one populate owner', () => {
    it('a class added after both mounted gives one vertex, not one per instance', () => {
        openMetamodel();
        mount(); mount(); settle();
        expect(writes.vertices).toEqual([]);
        addClass('C'); commit();
        expect(writes.vertices).toEqual(['C']);
    });

    it('an M2 reference added after both mounted gives one edge, not one per instance', () => {
        openMetamodel();
        mount(); mount(); settle();
        addReference('r1', 'A', 'B'); commit();
        expect(edgesFor('r1').map(e => [e.s, e.t])).toEqual([['vA', 'vB']]);
    });

    it('a reference retarget is reconciled once: three writes, not six', () => {
        openMetamodel({
            A: { id: 'A', className: 'DClass', references: ['r1'], extends: [] },
            r1: { id: 'r1', className: 'DReference', type: 'B' },
            vC: { id: 'vC', className: 'DVertex', model: 'C', father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120 },
            C: { id: 'C', className: 'DClass', references: [], extends: [] },
            p: { id: 'p', className: 'DPackage', classes: ['A', 'B', 'C'], enumerators: [], subpackages: [] },
            e1: { id: 'e1', className: 'DVoidEdge', start: 'vA', end: 'vB', model: 'r1', father: 'g', graph: 'g', isReference: true },
        }, ['vC', 'e1']);
        mount(); mount(); settle();
        expect(writes.sets).toBe(0);
        patch({ r1: { ...lookup().r1, type: 'C' } }); commit();
        expect(writes.sets).toBe(3);
        expect(writes.edges).toEqual([]);
    });

    it('a stale inheritance edge is deleted once, and leaves both canvases', () => {
        openMetamodel({
            A: { id: 'A', className: 'DClass', references: [], extends: ['B'] },
            eX: { id: 'eX', className: 'DVoidEdge', start: 'vA', end: 'vB', father: 'g', graph: 'g', isExtend: true },
        }, ['eX']);
        const a = mount(), b = mount(); settle();
        expect(a.rf.edges.map(e => e.id)).toEqual(['eX']);
        expect(b.rf.edges.map(e => e.id)).toEqual(['eX']);
        patch({ A: { ...lookup().A, extends: [] } }); commit();
        expect(writes.deletes).toEqual(['eX']);
        expect(a.rf.edges).toEqual([]);
        expect(b.rf.edges).toEqual([]);
    });

    it('the owner unmounts: the other instance becomes owner and populates the next addition', () => {
        openMetamodel();
        const a = mount(); mount(); settle();
        addClass('C'); commit();
        expect(writes.vertices).toEqual(['C']);
        land(); commit(); settle();
        unmount(a);
        addClass('D'); commit();
        expect(writes.vertices).toEqual(['C', 'D']);
        land(); commit(); settle();
        addReference('r1', 'C', 'D'); commit();
        expect(edgesFor('r1').map(e => [e.s, e.t])).toEqual([['vC', 'vD']]);
    });

    it('a non-owner on another viewpoint renders the vertex the owner created', () => {
        openMetamodel();
        const a = mount(), b = mount('vp2'); settle();
        addClass('C'); commit();
        expect(writes.vertices).toEqual(['C']);
        land(); commit(); settle();
        expect(a.rf.nodes.map(n => n.id).sort()).toEqual(['vA', 'vB', 'vC']);
        expect(b.rf.nodes.map(n => n.id).sort()).toEqual(['vA', 'vB', 'vC']);
    });
});

describe('useJjomSync: the sync registries clear on the last instance of the model', () => {
    for (const closeFirst of ['owner', 'non-owner'] as const) {
        it(`closing the ${closeFirst} of two keeps edgeRefIds and canvasEdgePairs; closing the last clears them`, () => {
            openMetamodel();
            const a = mount(), b = mount(); settle();
            markCanvasEdgePair('vA', 'vB');
            setEdgeRefId('e1', 'r1');
            unmount(closeFirst === 'owner' ? a : b);
            expect(hasCanvasEdgePair('vA→vB')).toBe(true);
            expect(getEdgeRefId('e1')).toBe('r1');
            unmount(closeFirst === 'owner' ? b : a);
            expect(hasCanvasEdgePair('vA→vB')).toBe(false);
            expect(getEdgeRefId('e1')).toBeUndefined();
        });
    }
});

describe('useJjomSync: one instance alone, as before', () => {
    it('a class and a reference added: one vertex, one edge; the unmount clears the registries', () => {
        openMetamodel();
        const a = mount(); settle();
        addClass('C'); commit();
        expect(writes.vertices).toEqual(['C']);
        land(); commit(); settle();
        expect(a.rf.nodes.map(n => n.id).sort()).toEqual(['vA', 'vB', 'vC']);
        addReference('r1', 'A', 'C'); commit();
        expect(edgesFor('r1').map(e => [e.s, e.t])).toEqual([['vA', 'vC']]);
        land(); commit(); settle();
        expect(a.rf.edges.map(e => e.id)).toEqual([edgesFor('r1')[0].id]);
        markCanvasEdgePair('vA', 'vC');
        setEdgeRefId('e1', 'r1');
        unmount(a);
        expect(hasCanvasEdgePair('vA→vC')).toBe(false);
        expect(getEdgeRefId('e1')).toBeUndefined();
    });

    it('a retarget is reconciled with three writes, a stale inheritance edge deleted once', () => {
        openMetamodel({
            A: { id: 'A', className: 'DClass', references: ['r1'], extends: ['B'] },
            r1: { id: 'r1', className: 'DReference', type: 'B' },
            vC: { id: 'vC', className: 'DVertex', model: 'C', father: 'g', graph: 'g', x: 0, y: 0, w: 200, h: 120 },
            C: { id: 'C', className: 'DClass', references: [], extends: [] },
            p: { id: 'p', className: 'DPackage', classes: ['A', 'B', 'C'], enumerators: [], subpackages: [] },
            e1: { id: 'e1', className: 'DVoidEdge', start: 'vA', end: 'vB', model: 'r1', father: 'g', graph: 'g', isReference: true },
            eX: { id: 'eX', className: 'DVoidEdge', start: 'vA', end: 'vB', father: 'g', graph: 'g', isExtend: true },
        }, ['vC', 'e1', 'eX']);
        const a = mount(); settle();
        patch({ r1: { ...lookup().r1, type: 'C' } }); commit();
        expect(writes.sets).toBe(3);
        vi.advanceTimersByTime(200);
        patch({ A: { ...lookup().A, extends: [] } }); commit();
        expect(writes.deletes).toEqual(['eX']);
        expect(a.rf.edges.map(e => e.id)).toEqual(['e1']);
    });
});
