/**
 * IR resolution follows the tab's viewpoint (multi-tab L5, P-2026-11-07-1516).
 *
 * The L3 app check measured a tab kept on V drawing 6 nodes while focused and 10 while another
 * tab, on W, was focused (lir_2026-11-07_l3_tab_layout_key.md §6): the node set followed the root
 * `state.viewpoint`. Here two viewpoints, V and W, each with its own views, and a root that is
 * neither or one of them: every hook resolves under the id the tab gives it, a tab on abstract
 * syntax (`null`) resolves nothing, and with no tab (`undefined`) every result is today's.
 *
 * ── The subject runs, React is stubbed ──────────────────────────────────────
 * As in irSimActive.test.ts: `useMemo` honours its deps, effects do not run, external stores are
 * read; plus `useContext`, which returns the canvas context the test sets, and `useRef`. Each
 * canvas (a tab) has its own hook slots, so two `useIRContainment` instances can run side by side.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';

type Slot = { deps?: unknown[]; value: unknown };
const hooks = vi.hoisted(() => ({ byCanvas: {} as Record<string, Slot[]>, slots: [] as Slot[], i: 0 }));
const fake = vi.hoisted(() => ({ state: {} as any, ctx: null as null | { viewpointId?: string | null } }));

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useMemo: (factory: () => unknown, deps: unknown[]) => {
            const k = hooks.i++;
            const prev = hooks.slots[k];
            if (prev && prev.deps && prev.deps.length === deps.length && prev.deps.every((d, j) => Object.is(d, deps[j]))) return prev.value;
            const value = factory();
            hooks.slots[k] = { deps, value };
            return value;
        },
        useRef: (v: unknown) => {
            const k = hooks.i++;
            if (!hooks.slots[k]) hooks.slots[k] = { value: { current: v } };
            return hooks.slots[k].value;
        },
        useEffect: () => {},
        useContext: () => fake.ctx,
        useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
    };
});
vi.mock('react-redux', () => ({ useSelector: (sel: (s: any) => unknown) => sel(fake.state) }));
vi.mock('../../../../../joiner', () => ({
    store: { getState: () => fake.state },
    // No L-layer in node: the lproxy backend falls back to draw on a throw, by design.
    LPointerTargetable: { fromPointer: () => { throw new Error('no L-layer in the node bench'); } },
}));

import type { Edge, Node } from '@xyflow/react';
import { computeIRSignature, getIRIndex } from '../irResolveCore';
import { irViewpointArg, useIRRowView, useIRView, useIRViewpointActive } from '../irResolve';
import { useIRContainment, useIRInteractionPlan } from '../useIRContainment';
import { crossDepsSignature, publishCrossDeps } from '../irCrossDeps';
import { IR_DEFAULT_ROW_VIEW_ID } from '../irDefaults';
import type { RowViewIR, VertexViewIR } from '../irTypes';

const vertexIR = (): VertexViewIR => ({ irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Place'], shape: { form: 'circle' } } as VertexViewIR);
const rowIR = (): RowViewIR => ({ irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Place'], template: [{ from: 'intrinsic', prop: 'name' }] } as RowViewIR);

/**
 * One metamodel class Place, one object `ready` drawn by the vertex `vx1`. V has a vertex view;
 * W has a vertex view and a row view; X is a viewpoint with no IR view. `root` is `state.viewpoint`.
 * Fresh ir objects per call, so every test lands on signatures of its own.
 */
function world(root: string | null) {
    return {
        viewpoint: root,
        viewelements: ['V_vertex', 'W_vertex', 'W_row'],
        objects: ['ready'],
        idlookup: {
            MM: { id: 'MM', className: 'DModel', name: 'DemoPetri' },
            PKG: { id: 'PKG', className: 'DPackage', name: 'demopetri', father: 'MM' },
            C_Place: { id: 'C_Place', className: 'DClass', name: 'Place', extends: [], father: 'PKG' },
            ready: { id: 'ready', className: 'DObject', name: 'ready', instanceof: 'C_Place', father: 'M', features: [] },
            vx1: { id: 'vx1', model: 'ready', father: 'G' },
            fid1: { id: 'fid1', className: 'DValue', values: [1] },
            V: { id: 'V', className: 'DViewPoint', isExclusiveView: true },
            W: { id: 'W', className: 'DViewPoint', isExclusiveView: true },
            X: { id: 'X', className: 'DViewPoint', isExclusiveView: true },
            V_vertex: { id: 'V_vertex', viewpoint: 'V', ir: vertexIR() },
            W_vertex: { id: 'W_vertex', viewpoint: 'W', ir: vertexIR() },
            W_row: { id: 'W_row', viewpoint: 'W', ir: rowIR() },
        } as Record<string, any>,
    };
}

/** One render of a hook in the canvas `canvas`, whose context carries the tab's `viewpointId`. */
function inCanvas<T>(canvas: string, ctx: null | { viewpointId?: string | null }, hook: () => T): T {
    hooks.slots = hooks.byCanvas[canvas] ??= [];
    hooks.i = 0;
    fake.ctx = ctx;
    return hook();
}
const tab = (viewpointId: string | null) => ({ viewpointId });
const NO_TAB = null;

const objectNode = (): Node[] => [{ id: 'vx1', type: 'objectNode', position: { x: 0, y: 0 }, data: {} } as Node];
const NO_EDGES: Edge[] = [];

beforeEach(() => {
    hooks.byCanvas = {};
});

describe('irViewpointArg: the core argument of the three values of a tab id', () => {
    it('a string stays itself, null becomes the empty id, undefined stays undefined (the root)', () => {
        expect(irViewpointArg('W')).toBe('W');
        expect(irViewpointArg(null)).toBe('');
        expect(irViewpointArg(undefined)).toBeUndefined();
    });

    it('null gives the empty signature even when the root has views; undefined gives the root\'s', () => {
        const s = world('V');
        expect(computeIRSignature(s, irViewpointArg(null))).toBe('');
        expect(computeIRSignature(s, irViewpointArg(undefined))).toBe(computeIRSignature(s));
        expect(computeIRSignature(s, irViewpointArg(undefined))).not.toBe('');
    });
});

describe('signature and index caches: two ids in play do not mix', () => {
    it('V and W have two signatures and two indexes, each of its own viewpoint', () => {
        const s = world('V');
        const sigV = computeIRSignature(s, 'V');
        const sigW = computeIRSignature(s, 'W');
        expect(sigV).not.toBe(sigW);
        const iV = getIRIndex(s, sigV, 'V')!;
        const iW = getIRIndex(s, sigW, 'W')!;
        expect(iV.viewpointId).toBe('V');
        expect(iW.viewpointId).toBe('W');
        expect(iV.viewIds).toEqual(['V_vertex']);
        expect(iW.viewIds).toEqual(['W_vertex', 'W_row']);
    });

    it('building W\'s index does not evict V\'s: the same object comes back for V\'s signature', () => {
        const s = world('V');
        const sigV = computeIRSignature(s, 'V');
        const iV = getIRIndex(s, sigV, 'V');
        getIRIndex(s, computeIRSignature(s, 'W'), 'W');
        expect(getIRIndex(s, sigV, 'V')).toBe(iV);
    });
});

describe('useIRView resolves under the tab\'s viewpoint', () => {
    const render = (ctx: null | { viewpointId?: string | null }) => inCanvas('c', ctx, () => useIRView('vx1', 'C_Place'));

    it('a tab on W resolves W\'s view while the root is V, and V\'s view on V', () => {
        fake.state = world('V');
        expect(render(tab('W'))?.compiled.viewId).toBe('W_vertex');
        hooks.byCanvas = {};
        expect(render(tab('V'))?.compiled.viewId).toBe('V_vertex');
    });

    it('a tab on abstract syntax resolves nothing, whatever the root', () => {
        fake.state = world('V');
        expect(render(tab(null))).toBeNull();
    });

    it('no tab (no context, or a context without an id) resolves under the root, as today', () => {
        fake.state = world('V');
        expect(render(NO_TAB)?.compiled.viewId).toBe('V_vertex');
        hooks.byCanvas = {};
        expect(render({})?.compiled.viewId).toBe('V_vertex');
    });
});

describe('useIRViewpointActive follows the tab', () => {
    const render = (ctx: null | { viewpointId?: string | null }) => inCanvas('c', ctx, () => useIRViewpointActive());

    it('true for a tab on W while the root has no IR view; false for a tab on abstract syntax while the root has one', () => {
        fake.state = world('X');
        expect(render(tab('W'))).toBe(true);
        fake.state = world('V');
        hooks.byCanvas = {};
        expect(render(tab(null))).toBe(false);
    });

    it('no tab: the root decides, as today', () => {
        fake.state = world('V');
        expect(render(NO_TAB)).toBe(true);
        fake.state = world('X');
        hooks.byCanvas = {};
        expect(render(NO_TAB)).toBe(false);
    });
});

describe('useIRRowView follows the tab', () => {
    const render = (ctx: null | { viewpointId?: string | null }) => inCanvas('c', ctx, () => useIRRowView('ready'));

    it('a tab on W resolves W\'s row view; the root V has none, so no tab gives the built-in default row', () => {
        fake.state = world('V');
        expect(render(tab('W'))?.compiled.viewId).toBe('W_row');
        hooks.byCanvas = {};
        expect(render(NO_TAB)?.compiled.viewId).toBe(IR_DEFAULT_ROW_VIEW_ID);
    });

    it('a tab on abstract syntax has no row resolution at all', () => {
        fake.state = world('V');
        expect(render(tab(null))).toBeNull();
    });
});

describe('useIRInteractionPlan and useIRContainment take the tab id as a parameter', () => {
    it('the interaction plan exists for a tab on W while the root has no IR view, and not for abstract syntax', () => {
        fake.state = world('X');
        expect(inCanvas('a', NO_TAB, () => useIRInteractionPlan('W'))).not.toBeNull();
        fake.state = world('V');
        expect(inCanvas('b', NO_TAB, () => useIRInteractionPlan(null))).toBeNull();
        expect(inCanvas('c', NO_TAB, () => useIRInteractionPlan(undefined))).not.toBeNull();
    });

    it('the containment pass indexes the drawn object under W while the root has no IR view; abstract syntax passes through', () => {
        fake.state = world('X');
        const nodes = objectNode();
        expect(inCanvas('a', NO_TAB, () => useIRContainment(nodes, NO_EDGES, 'W')).model.objByVertex.get('vx1')).toBe('ready');
        expect(inCanvas('b', NO_TAB, () => useIRContainment(nodes, NO_EDGES, undefined)).model.objByVertex.size).toBe(0);
        fake.state = world('V');
        const passed = inCanvas('c', NO_TAB, () => useIRContainment(nodes, NO_EDGES, null));
        expect(passed.nodes).toBe(nodes);
        expect(passed.model.objByVertex.size).toBe(0);
    });

    it('a recompute of the tab on V does not wipe the cross deps the tab on W published', () => {
        fake.state = world('V');
        inCanvas('A', NO_TAB, () => useIRContainment(objectNode(), NO_EDGES, 'V'));
        inCanvas('B', NO_TAB, () => useIRContainment(objectNode(), NO_EDGES, 'W'));
        // B's node published what it navigates to, after both canvases decorated once.
        publishCrossDeps('vx1@B', ['fid1']);
        const before = crossDepsSignature(fake.state.idlookup, 'vx1@B');
        expect(before).not.toBe('');
        // A re-decorates on a new node array, its viewpoint unchanged.
        inCanvas('A', NO_TAB, () => useIRContainment(objectNode(), NO_EDGES, 'V'));
        expect(crossDepsSignature(fake.state.idlookup, 'vx1@B')).toBe(before);
    });
});
