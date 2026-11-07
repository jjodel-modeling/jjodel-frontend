/**
 * `useContentDrivenSize` under several tabs (multi-tab L3, P-2026-11-07-1249).
 *
 * 1. The manual-size gate reads the layout key of the tab's viewpoint (`EditorContext.viewpointId`),
 *    not the root one: the hook stays the complement of `manualSizeOf`, which the sync now runs
 *    under the tab key. No context, or a context with no tab (`undefined`), reads the root key.
 * 2. The cascade cap (`MAX_WRITES_PER_CASCADE`, module level so a node remount does not refill it)
 *    counts per (canvas, vertex): two canvases showing the same vertex in one synchronous cascade
 *    do not spend each other's budget (discovery_2026-11-06_multi_tab_viewpoints.md §3.5). The
 *    canvas is the React Flow store of its provider (`useStoreApi`), one per `EditorV2`.
 *
 * React is stubbed per hook instance (the harness of useContentSizeLoop.test.ts): each instance has
 * its own slots and layout effects, and the canvas and context it renders in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Effect = { fn: () => void | (() => void); deps?: unknown[] };
type RFNode = { id: string; width?: number; height?: number; measured?: unknown };
type Canvas = { nodes: RFNode[]; writes: number; api: object };
type Instance = {
    slots: unknown[]; i: number; e: number;
    pending: Effect[]; mounted: Array<{ deps?: unknown[]; cleanup?: () => void }>;
    canvas: Canvas; ctx: { viewpointId?: string | null } | null;
};
let cur: Instance;

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useRef: (v: unknown) => {
            const k = cur.i++;
            if (!(k in cur.slots)) cur.slots[k] = { current: v };
            return cur.slots[k];
        },
        useState: (v: unknown) => {
            const k = cur.i++;
            if (!(k in cur.slots)) cur.slots[k] = v;
            return [cur.slots[k], () => {}];
        },
        useContext: () => cur.ctx,
        useEffect: () => {},
        useLayoutEffect: (fn: Effect['fn'], deps?: unknown[]) => { cur.pending[cur.e++] = { fn, deps }; },
    };
});
vi.mock('@xyflow/react', () => ({
    useReactFlow: () => {
        const c = cur.canvas;
        return {
            getNode: (id: string) => c.nodes.find(n => n.id === id),
            setNodes: (f: (nds: RFNode[]) => RFNode[]) => {
                const next = f(c.nodes);
                if (next !== c.nodes) c.writes += 1;
                c.nodes = next;
            },
        };
    },
    useStoreApi: () => cur.canvas.api,
}));
const redux: { state: any } = { state: {} };
vi.mock('react-redux', () => ({ useSelector: (sel: (s: any) => unknown) => sel(redux.state) }));
vi.mock('../../../../../joiner', () => ({ store: { getState: () => redux.state } }));

import { useContentDrivenSize } from '../useContentSize';

const V = 'v1';
const el = { style: {} as Record<string, string>, offsetWidth: 40, offsetHeight: 20 };
const ref = { current: el as unknown as HTMLDivElement };
const canvas = (): Canvas => ({ nodes: [{ id: V }], writes: 0, api: {} });
const instance = (c: Canvas, ctx: Instance['ctx']): Instance =>
    ({ slots: [], i: 0, e: 0, pending: [], mounted: [], canvas: c, ctx });

const changed = (a?: unknown[], b?: unknown[]) => !a || !b || a.length !== b.length || a.some((x, k) => !Object.is(x, b[k]));
/** One render of `inst` and its commit: the layout effects whose deps moved run. */
function renderCommit(inst: Instance): void {
    cur = inst;
    inst.i = 0; inst.e = 0; inst.pending = [];
    useContentDrivenSize(V, 'circle', ref);
    const due = inst.pending.map((p, k) => !inst.mounted[k] || changed(inst.mounted[k].deps, p.deps));
    inst.pending.forEach((_, k) => { if (due[k]) inst.mounted[k]?.cleanup?.(); });
    inst.pending.forEach((p, k) => {
        if (!due[k]) return;
        const cleanup = p.fn();
        inst.mounted[k] = { deps: p.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined };
    });
}
function unmount(inst: Instance): void { cur = inst; for (const m of inst.mounted) m?.cleanup?.(); inst.mounted = []; }
/** A remount with fresh refs on a node whose size somebody else dropped: one write each time. */
function remountDropped(c: Canvas, ctx: Instance['ctx']): void {
    c.nodes = [{ id: V }];
    renderCommit(instance(c, ctx));
}
const nextTask = () => new Promise<void>(r => setTimeout(r, 0));

const rec = (isResized: boolean) => ({ x: 0, y: 0, w: 300, h: 200, isResized });
/** Root viewpoint `root`; the vertex is sized by hand under `A` only. */
function state(root: string) {
    redux.state = {
        viewpoint: root,
        idlookup: {
            A: { id: 'A', isExclusiveView: true }, B: { id: 'B', isExclusiveView: true }, C: { id: 'C', isExclusiveView: true },
            [V]: { id: V, layoutByViewpoint: { A: rec(true), B: rec(false), C: rec(false) } },
        },
    };
}

const savedGCS = (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
beforeEach(async () => {
    await nextTask();
    warn.mockClear();
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = () => ({
        borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '1px', borderBottomWidth: '1px',
        paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
    });
});
afterEach(() => {
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = savedGCS;
});

describe('useContentDrivenSize: the manual-size gate reads the tab key', () => {
    it('a tab whose key has no manual size derives the size, whatever the root key says', () => {
        state('A');
        const c = canvas();
        renderCommit(instance(c, { viewpointId: 'B' }));
        expect(c.writes).toBe(1);
        expect(c.nodes[0].width).toBeGreaterThan(0);
    });

    it('a tab whose key has a manual size leaves the node alone, whatever the root key says', () => {
        state('B');
        const c = canvas();
        renderCommit(instance(c, { viewpointId: 'A' }));
        expect(c.writes).toBe(0);
    });

    it('at unmount the derived size goes when the tab key has no manual size, the root key resized', () => {
        state('C');
        const c = canvas();
        const inst = instance(c, { viewpointId: 'B' });
        renderCommit(inst);
        expect(c.nodes[0].width).toBeGreaterThan(0);
        state('A');
        unmount(inst);
        expect(c.nodes[0].width).toBeUndefined();
    });

    it('with no context, or no tab in it, the root key is read: the hook of one tab, unchanged', () => {
        for (const ctx of [null, {}, { viewpointId: undefined }]) {
            state('A');
            const a = canvas();
            renderCommit(instance(a, ctx));
            expect(a.writes).toBe(0);
            state('B');
            const b = canvas();
            renderCommit(instance(b, ctx));
            expect(b.writes).toBe(1);
        }
    });

    it('with one tab and its key equal to the root key, the writes equal the keyless ones', () => {
        for (const root of ['A', 'B']) {
            state(root);
            const keyed = canvas(), keyless = canvas();
            renderCommit(instance(keyed, { viewpointId: root }));
            renderCommit(instance(keyless, null));
            expect(keyed.nodes).toEqual(keyless.nodes);
            expect(keyed.writes).toBe(keyless.writes);
        }
    });
});

describe('useContentDrivenSize: the cascade cap counts per (canvas, vertex)', () => {
    it('two canvases on the same vertex in one cascade each get the three writes', () => {
        state('B');
        const one = canvas(), two = canvas();
        for (let k = 0; k < 3; k++) remountDropped(one, null);
        for (let k = 0; k < 3; k++) remountDropped(two, null);
        expect(one.writes).toBe(3);
        expect(two.writes).toBe(3);
        expect(warn).not.toHaveBeenCalled();
    });

    it('one canvas still yields at the fourth write of the cascade, and the next cascade lifts it', async () => {
        state('B');
        const one = canvas(), two = canvas();
        for (let k = 0; k < 4; k++) remountDropped(one, null);
        expect(one.writes).toBe(3);
        expect(warn).toHaveBeenCalledTimes(1);
        remountDropped(two, null);
        expect(two.writes).toBe(1);
        await nextTask();
        remountDropped(one, null);
        expect(one.writes).toBe(4);
    });
});
