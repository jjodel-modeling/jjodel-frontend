/**
 * `useContentDrivenSize` cannot drive a nested-update loop (P-2026-10-01-1655).
 *
 * The hook writes from a layout effect with no dependency array, so each write is followed by
 * a synchronous commit that runs it again: React Flow's BatchProvider flushes the write in a
 * layout effect, EditorV2 takes it through `onNodesChange`, StoreUpdater pushes the new nodes
 * into the store in a layout effect, the node re-renders. React kills the tree at the 50th
 * nested update («Maximum update depth exceeded», the editor pane on the `<Try>` fallback,
 * reported on 2026-10-01 under a «FlowChart (derived)» viewpoint). Its only guarantee of
 * termination is to stop writing. Before this lane two paths never stopped:
 *
 * - a measurement that alternates between two sizes: every write had a new target, and a new
 *   target reset the budget (`if (!sameTarget) unaccepted.current = 0`);
 * - a size that comes back to the hook and is then dropped again by somebody else, or by the
 *   hook's own unmount when its host remounts: every accepted write, and every remount, reset
 *   the budget, so the hook wrote once per cycle for as long as the cycle lasted.
 *
 * ── The subject runs, React is stubbed ──────────────────────────────────────
 * The bench of useContentSizeUnmount.test.ts: `useLayoutEffect` honours its dependency array
 * and keeps its cleanup, `commit()` runs the due cleanups then the due bodies, `unmount()` runs
 * every cleanup left. React Flow is a node array behind `getNode`/`setNodes`, the writes
 * counted. The element is a stand-in whose `offsetWidth` is read through a function, so the
 * measurement can move between commits. A synchronous run of commits is one cascade, as in the
 * browser, where React flushes the nested sync commits in one loop with no microtask between
 * them; `nextTask()` lets the microtask queue run, which ends the cascade. Module state (the
 * per-cascade counter) is flushed in `beforeEach` (P11).
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
/** The budget of the hook (MAX_UNACCEPTED_WRITES), not exported: the bound these tests hold it to. */
const BUDGET = 3;
/** The ink, read once per commit through `offsetWidth`; the height is fixed. */
let ink: () => number = () => 40;
const el = {
    style: {} as Record<string, string>,
    get offsetWidth() { return ink(); },
    offsetHeight: 20,
};
const ref = { current: el as unknown as HTMLDivElement };

function render(form: ShapeForm = 'circle'): void {
    runtime.i = 0;
    runtime.e = 0;
    runtime.pending = [];
    useContentDrivenSize(V, form, ref);
}
const changed = (a?: unknown[], b?: unknown[]) => !a || !b || a.length !== b.length || a.some((x, k) => !Object.is(x, b[k]));
function commit(): void {
    const due = runtime.pending.map((p, k) => !runtime.mounted[k] || changed(runtime.mounted[k].deps, p.deps));
    runtime.pending.forEach((_, k) => { if (due[k]) runtime.mounted[k]?.cleanup?.(); });
    runtime.pending.forEach((p, k) => {
        if (!due[k]) return;
        const cleanup = p.fn();
        runtime.mounted[k] = { deps: p.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined };
    });
}
function unmount(): void {
    for (const m of runtime.mounted) m?.cleanup?.();
    runtime.mounted = [];
    runtime.slots = [];
}
/** The end of the cascade: the microtask queue runs. */
const nextTask = () => new Promise<void>(r => setTimeout(r, 0));
const node = () => rf.nodes.find(n => n.id === V)!;

const savedGCS = (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
beforeEach(async () => {
    await nextTask();
    runtime.slots = [];
    runtime.pending = [];
    runtime.mounted = [];
    rf.nodes = [{ id: V }];
    rf.writes = 0;
    ink = () => 40;
    redux.state = { viewpoint: null, idlookup: { [V]: { id: V } } };
    warn.mockClear();
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = () => ({
        borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '1px', borderBottomWidth: '1px',
        paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
    });
});
afterEach(() => {
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = savedGCS;
});

/** Two inks on alternate reads: the measurement moves with every commit. */
function alternate(a: number, b: number): void {
    let k = 0;
    ink = () => (k++ % 2 === 0 ? a : b);
}

describe('useContentDrivenSize: a measurement that alternates never loops', () => {
    it('in one cascade: fifty commits, at most the budget of writes (was one write per commit)', () => {
        alternate(40, 120);
        const sizes = new Set<string>();
        for (let i = 0; i < 50; i++) {
            render(); commit();
            sizes.add(`${node().width}x${node().height}`);
        }
        // Positive control: the two inks give two different boxes, both written.
        expect(sizes.size).toBeGreaterThanOrEqual(2);
        expect(rf.writes).toBeGreaterThan(0);
        expect(rf.writes).toBeLessThanOrEqual(BUDGET);
    });

    it('across tasks: the yield holds while the measurement keeps alternating, the budget is not refilled by a new target', async () => {
        alternate(40, 120);
        for (let i = 0; i < 50; i++) {
            render(); commit();
            await nextTask();
        }
        expect(rf.writes).toBeGreaterThan(0);
        expect(rf.writes).toBeLessThanOrEqual(BUDGET);
    });

    it('the yield leaves a drawable node: a box the hook derived, finite on both axes', () => {
        alternate(40, 120);
        for (let i = 0; i < 50; i++) { render(); commit(); }
        expect(Number.isFinite(node().width)).toBe(true);
        expect(Number.isFinite(node().height)).toBe(true);
        expect(node().width).toBeGreaterThan(0);
    });

    it('after the yield the hook leaves the vertex, and takes it back once its size is dropped (Reset size)', async () => {
        alternate(40, 120);
        for (let i = 0; i < 10; i++) { render(); commit(); }
        await nextTask();
        const yielded = rf.writes;
        // The ink settles: the hook does not come back on its own, the node keeps its box.
        ink = () => 200;
        for (let i = 0; i < 5; i++) { render(); commit(); await nextTask(); }
        expect(rf.writes).toBe(yielded);
        // The size goes (Reset size drops width and height): the hook owns the vertex again.
        rf.nodes = [{ id: V }];
        render(); commit(); render(); commit();
        expect(rf.writes).toBe(yielded + 1);
        expect(node().width).toBeGreaterThan(0);
    });
});

describe('useContentDrivenSize: a size dropped and taken back inside one cascade never loops', () => {
    it('another writer drops the size after every accepted write: at most the budget of writes in the cascade', async () => {
        for (let i = 0; i < 50; i++) {
            render(); commit();
            render(); commit();
            rf.nodes = [{ id: V }];
        }
        expect(rf.writes).toBeGreaterThan(0);
        expect(rf.writes).toBeLessThanOrEqual(BUDGET);
        // Per contrast: the next cascade writes again, the yield is not for the session.
        await nextTask();
        const before = rf.writes;
        render(); commit();
        expect(rf.writes).toBe(before + 1);
        expect(node().width).toBeGreaterThan(0);
    });

    it('the host remounts on every commit (mount writes, unmount drops): at most the budget of writes in the cascade', async () => {
        for (let i = 0; i < 50; i++) {
            render(); commit();
            unmount();
        }
        expect(rf.writes).toBeGreaterThan(0);
        // A write and its drop are two store writes; the writes alone are bounded by the budget.
        expect(rf.writes).toBeLessThanOrEqual(2 * BUDGET);
        await nextTask();
        render(); commit();
        render(); commit();
        expect(node().width).toBeGreaterThan(0);
    });
});

describe('useContentDrivenSize: the settles that are correct today are unchanged', () => {
    it('mount: one write, then steady over many commits', () => {
        render(); commit();
        const w = node().width;
        for (let i = 0; i < 20; i++) { render(); commit(); }
        expect(rf.writes).toBe(1);
        expect(node().width).toBe(w);
        expect(warn).not.toHaveBeenCalled();
    });

    it('a content change in a later task writes the new box once, as many times as the content changes', async () => {
        render(); commit(); render(); commit();
        const boxes = new Set([node().width]);
        for (const w of [100, 160, 220, 280, 340]) {
            await nextTask();
            ink = () => w;
            render(); commit(); render(); commit();
            boxes.add(node().width);
        }
        // Positive control: every ink gave a box of its own.
        expect(boxes.size).toBe(6);
        expect(rf.writes).toBe(6);
        expect(warn).not.toHaveBeenCalled();
    });

    it('two writes to settle (the box moves the chrome once) stay inside the budget', () => {
        let k = 0;
        ink = () => (k++ === 0 ? 40 : 200);
        render(); commit();
        render(); commit();
        render(); commit();
        render(); commit();
        expect(rf.writes).toBe(2);
        expect(warn).not.toHaveBeenCalled();
    });
});
