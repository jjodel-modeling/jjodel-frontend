/**
 * The size `useContentDrivenSize` wrote is given back when its host unmounts (P-2026-09-30-1625).
 *
 * Measured on 3081 at `ee5cd0792` (discovery 2026-09-30_derived_size_leak): DemoPetri's places
 * are native cards of 200x78 in the default viewpoint; under the derived Petri viewpoint (R-VP-16)
 * IRNodeContent renders them as circles and this hook writes 66x66 on the React Flow node. Back
 * in the default viewpoint the node renders through ObjectNode's native branch, IRNodeContent
 * unmounts, and nothing took the 66x66 back: the sync patches a size only when its transformer's
 * output moves, and a derived size never reaches the transformer. The places stayed 66x66.
 *
 * ── The subject runs, React is stubbed ──────────────────────────────────────
 * As in useContentSizeDrop.test.ts, plus what an unmount needs: `useLayoutEffect` honours its
 * dependency array (none = every commit, `[]` = mount only) and keeps the cleanup its body
 * returns; `commit()` runs, per effect, the previous cleanup then the body when it is due,
 * all cleanups first as React does for one component; `unmount()` runs every cleanup left.
 * React Flow is a node array behind `getNode`/`setNodes`, with the writes counted; the store is
 * a plain state behind `useSelector` and behind the joiner `store`. Module state is reset in
 * `beforeEach` (P11).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Effect = { fn: () => void | (() => void); deps?: unknown[] };
const runtime = {
    slots: [] as unknown[], i: 0, e: 0,
    pending: [] as Effect[],
    mounted: [] as Array<{ deps?: unknown[]; cleanup?: () => void }>,
};
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
            return [runtime.slots[k], () => {}];
        },
        useEffect: () => {},
        useLayoutEffect: (fn: Effect['fn'], deps?: unknown[]) => { runtime.pending[runtime.e++] = { fn, deps }; },
    };
});

type RFNode = { id: string; width?: number; height?: number; measured?: unknown };
const rf: { nodes: RFNode[]; writes: number } = { nodes: [], writes: 0 };
vi.mock('@xyflow/react', () => ({
    useReactFlow: () => ({
        getNode: (id: string) => rf.nodes.find(n => n.id === id),
        setNodes: (f: (nds: RFNode[]) => RFNode[]) => {
            const next = f(rf.nodes);
            if (next !== rf.nodes) rf.writes += 1;
            rf.nodes = next;
        },
    }),
}));

const redux: { state: any } = { state: {} };
vi.mock('react-redux', () => ({ useSelector: (sel: (s: any) => unknown) => sel(redux.state) }));
vi.mock('../../../../../joiner', () => ({ store: { getState: () => redux.state } }));

import { useContentDrivenSize } from '../useContentSize';
import type { ShapeForm } from '../irTypes';

const V = 'v1';
/** Layout keys: the default viewpoint is not exclusive (abstract syntax key), the derived one is. */
const DERIVED = 'vp_derived';
const el = { style: {} as Record<string, string>, offsetWidth: 40, offsetHeight: 20 };
const ref = { current: el as unknown as HTMLDivElement };

/** One render of IRNodeContent's host, the hook called as IRNodeContent calls it. */
function render(form: ShapeForm, defaultSize?: unknown): void {
    runtime.i = 0;
    runtime.e = 0;
    runtime.pending = [];
    useContentDrivenSize(V, form, ref, defaultSize);
}
const changed = (a?: unknown[], b?: unknown[]) => !a || !b || a.length !== b.length || a.some((x, k) => !Object.is(x, b[k]));
/** The commit: cleanups of the due effects, then their bodies, in order. */
function commit(): void {
    const due = runtime.pending.map((p, k) => !runtime.mounted[k] || changed(runtime.mounted[k].deps, p.deps));
    runtime.pending.forEach((_, k) => { if (due[k]) runtime.mounted[k]?.cleanup?.(); });
    runtime.pending.forEach((p, k) => {
        if (!due[k]) return;
        const cleanup = p.fn();
        runtime.mounted[k] = { deps: p.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined };
    });
}
/** The host stops rendering IRNodeContent: every cleanup left runs. */
function unmount(): void {
    for (const m of runtime.mounted) m?.cleanup?.();
    runtime.mounted = [];
    runtime.slots = [];
}
const node = () => rf.nodes.find(n => n.id === V)!;
/** The store: the viewpoint in force and the vertex's layout records. */
function setStore(viewpoint: string | null, layouts: Record<string, { isResized?: boolean; w?: number; h?: number }> = {}): void {
    redux.state = {
        viewpoint,
        idlookup: {
            [V]: { id: V, layoutByViewpoint: layouts },
            [DERIVED]: { id: DERIVED, isExclusiveView: true },
        },
    };
}
/** Shows the derived viewpoint: a place becomes a circle, the hook writes until the size settles. */
function showDerived(): { w: number; h: number } {
    setStore(DERIVED, redux.state.idlookup?.[V]?.layoutByViewpoint ?? {});
    render('circle'); commit();
    render('circle'); commit();
    return { w: node().width!, h: node().height! };
}

const savedGCS = (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
beforeEach(() => {
    runtime.slots = [];
    runtime.pending = [];
    runtime.mounted = [];
    rf.nodes = [{ id: V }];
    rf.writes = 0;
    setStore(null);
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = () => ({
        borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '1px', borderBottomWidth: '1px',
        paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
    });
});
afterEach(() => {
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = savedGCS;
});

describe('useContentDrivenSize: the size it wrote goes when its host unmounts', () => {
    it('DemoPetri round trip: a place sized as a circle in the derived viewpoint is back to its card size in the default one', () => {
        const before = { ...node() };
        const written = showDerived();
        // Positive control: the derived viewpoint did write a circle's box on the node.
        expect(written.w).toBeGreaterThanOrEqual(64);
        expect(written.w).toBe(written.h);
        // Back to the default viewpoint: ObjectNode renders the native card, IRNodeContent unmounts.
        setStore(null);
        unmount();
        expect(node()).toEqual(before);
        expect(node().width).toBeUndefined();
        expect(node().height).toBeUndefined();
    });

    it('a size chosen by hand in the default viewpoint keeps its precedence there', () => {
        const manual = showDerived();
        // The default layout holds a hand size that happens to be the derived numbers, and the
        // sync already patched it on: only the layout record tells the two apart.
        setStore(null, { __abstract__: { isResized: true, w: manual.w, h: manual.h } });
        unmount();
        expect(node()).toMatchObject({ width: manual.w, height: manual.h });
    });

    it('a size somebody else wrote before the unmount is kept, one axis equal or none', () => {
        // Not a hand size (no isResized anywhere): only "is it still ours" protects it.
        for (const other of [{ w: 300, h: 120 }, { w: 0, h: 120 }, { w: 300, h: 0 }]) {
            runtime.slots = []; runtime.mounted = [];
            rf.nodes = [{ id: V }];
            setStore(null);
            const written = showDerived();
            const size = { width: other.w || written.w, height: other.h || written.h };
            rf.nodes = [{ id: V, ...size }];
            setStore(null);
            unmount();
            expect(node()).toMatchObject(size);
        }
    });

    it('a node resized by hand in the derived viewpoint: the hook wrote nothing and touches nothing', () => {
        setStore(DERIVED, { [DERIVED]: { isResized: true, w: 100, h: 100 } });
        rf.nodes = [{ id: V, width: 100, height: 100 }];
        render('circle'); commit();
        render('circle'); commit();
        expect(rf.writes).toBe(0);
        setStore(null);
        unmount();
        expect(rf.writes).toBe(0);
        expect(node()).toMatchObject({ width: 100, height: 100 });
    });

    it('steady state: a commit that moves nothing writes nothing (the unmount cleanup is not a per-commit one)', () => {
        showDerived();
        const writes = rf.writes;
        render('circle'); commit();
        render('circle'); commit();
        expect(rf.writes).toBe(writes);
        expect(node().width).toBeGreaterThanOrEqual(64);
    });

    it('the derived viewpoint again: the circle box is derived again after the round trip', () => {
        const first = showDerived();
        setStore(null);
        unmount();
        const again = showDerived();
        expect(again).toEqual(first);
    });
});
