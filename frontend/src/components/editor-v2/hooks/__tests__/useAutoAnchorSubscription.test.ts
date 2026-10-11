/**
 * useAutoAnchor does not re-render its host on a node move (P-2026-10-12-0011, Fix A of
 * discovery_2026-10-10_petri_classic_drag_loop.md §6).
 *
 * The drag loop of 2026-10-10 ran through `useAutoAnchor`'s `useNodes()`: every React Flow nodes push re-rendered
 * EditorV2Inner at sync priority, and each of those renders re-ran a rebased `setEdges` updater (§4.3). The hook now
 * reads the store at call time; these tests pin both halves of that.
 *
 * ── The bench ────────────────────────────────────────────────────────────────────────────────────────────────────
 * The hook runs for real, inside a real `ReactFlowProvider`, under React's server renderer (the node bench has no DOM).
 * React decides a re-render through `useSyncExternalStore`: it subscribes, and re-renders when the snapshot it was
 * handed moves after a notification. `@xyflow/react` reaches it through zustand and the `use-sync-external-store` shim,
 * which binds `React.useSyncExternalStore` when it loads, outside vite's module graph, so `vi.mock('react')` cannot
 * reach it. `vi.hoisted` wraps it on React's CommonJS exports before any import loads the shim: the wrapper records
 * every subscription handed to React while the probe component renders, then delegates. A test moves a node through
 * the store's own `setNodes` (the action xyflow's StoreUpdater calls) and asks each recorded subscription what React
 * would: did it notify, and did its snapshot move. The control (P12) is a component that calls `useNodes()` in the
 * same bench: it must read as re-rendering, or the bench is blind.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */
import { describe, expect, it, vi } from 'vitest';

type Sub = { subscribe: (cb: () => void) => () => void; getSnapshot: () => unknown };
const rec = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module');
    const React = createRequire(import.meta.url)('react');
    const state = { on: false, subs: [] as Sub[] };
    const original = React.useSyncExternalStore;
    React.useSyncExternalStore = (subscribe: Sub['subscribe'], getSnapshot: Sub['getSnapshot'], getServerSnapshot?: () => unknown) => {
        if (state.on) state.subs.push({ subscribe, getSnapshot });
        return original(subscribe, getSnapshot, getServerSnapshot);
    };
    return state;
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactFlowProvider, useNodes, useStoreApi, type Node } from '@xyflow/react';
import { useAutoAnchor } from '../useAutoAnchor';

const node = (id: string, x: number, y: number): Node => ({ id, position: { x, y }, data: {}, width: 180, height: 80 });
const side = (h: string | undefined) => (h ?? '').split('-')[0];

type Captured = { store: ReturnType<typeof useStoreApi>; hook: ReturnType<typeof useAutoAnchor> | null; subs: Sub[] };

/** Renders `use` inside a ReactFlowProvider holding `nodes`; returns the store and the subscriptions `use` handed React. */
function mount(nodes: Node[], use: () => ReturnType<typeof useAutoAnchor> | null): Captured {
    const out = {} as Captured;
    const Probe = () => {
        out.store = useStoreApi();
        rec.subs = [];
        rec.on = true;
        try { out.hook = use(); } finally { rec.on = false; }
        out.subs = rec.subs;
        return null;
    };
    renderToStaticMarkup(createElement(ReactFlowProvider, { initialNodes: nodes, children: createElement(Probe) }));
    return out;
}

/** What React would do for each subscription after `change`: was it notified, and did its snapshot move. */
function reRenders(c: Captured, change: () => void): boolean {
    const before = c.subs.map((s) => s.getSnapshot());
    let notified = 0;
    const offs = c.subs.map((s) => s.subscribe(() => { notified++; }));
    change();
    const moved = c.subs.some((s, i) => !Object.is(s.getSnapshot(), before[i]));
    offs.forEach((off) => off());
    return notified > 0 && moved;
}

const moveB = (c: Captured) => () => {
    const nodes = c.store.getState().nodes;
    c.store.getState().setNodes(nodes.map((n) => (n.id === 'B' ? { ...n, position: { x: 0, y: 400 } } : n)));
};

describe('useAutoAnchor and the React Flow nodes', () => {
    it('control: a host calling useNodes() reads as re-rendering on a node move (bench not blind)', () => {
        const c = mount([node('A', 0, 0), node('B', 400, 0)], () => { useNodes(); return null; });
        expect(c.subs.length).toBeGreaterThan(0);
        expect(reRenders(c, moveB(c))).toBe(true);
    });

    it('a node move does not re-render the host (kills: useNodes() or useStore(s => s.nodes) back in the hook)', () => {
        const c = mount([node('A', 0, 0), node('B', 400, 0)], () => useAutoAnchor());
        expect(c.hook).not.toBeNull();
        expect(reRenders(c, moveB(c))).toBe(false);
    });

    it('both callbacks read the nodes at call time, not at render (kills: getState().nodes read in the render body)', () => {
        const c = mount([node('A', 0, 0), node('B', 400, 0)], () => useAutoAnchor());
        const at = c.hook!.getOptimalAnchors('A', 'B', 'reference');
        expect([side(at.sourceHandle), side(at.targetHandle)]).toEqual(['right', 'left']);

        moveB(c)();

        const one = c.hook!.getOptimalAnchors('A', 'B', 'reference');
        expect([side(one.sourceHandle), side(one.targetHandle)]).toEqual(['bottom', 'top']);
        const all = c.hook!.getOptimalAnchorsForAllEdges([{ id: 'e', source: 'A', target: 'B', type: 'reference' }]).get('e')!;
        expect([side(all.sourceHandle), side(all.targetHandle)]).toEqual(['bottom', 'top']);
    });
});
