/**
 * The size `useContentDrivenSize` wrote is given back when the hook goes inactive
 * (F3 finding B, P-2026-09-29-2122).
 *
 * Collapsing a graphVertex whose view declares `collapsed.form: 'cylinder'` turns the hook
 * active (the cylinder carries a size supplement) and it writes the derived box on the
 * React Flow node. Expanding back to `rounded` turns it inactive, and before the fix the
 * inactive branch dropped only a size that came from `defaultSize`: the rounded node kept
 * the cylinder's 54x66 for the session (measured on 3060, discovery
 * 2026-09-29_collapsed_render_layer_impact §6).
 *
 * ── The subject runs, React is stubbed ──────────────────────────────────────
 * The bench has no DOM, so no React client renders here. The hook's own body runs, every
 * branch of it, under a stub of the four React hooks it calls: `useRef` and `useState`
 * keep their slots across calls as React does, `useLayoutEffect` queues the effect and
 * `commit()` runs it, `useEffect` (the fonts re-measure, which reads `document`) is
 * inert. React Flow is a node array behind `getNode`/`setNodes`; the store is a plain
 * state behind `useSelector`. The element is measured through a stand-in with the two
 * reads `measureIntrinsic` makes. Module state is reset in `beforeEach` (P11).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = { slots: [] as unknown[], i: 0, effects: [] as Array<() => void> };
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
        useLayoutEffect: (fn: () => void) => { runtime.effects.push(fn); },
    };
});

type RFNode = { id: string; width?: number; height?: number; measured?: unknown };
const rf: { nodes: RFNode[] } = { nodes: [] };
vi.mock('@xyflow/react', () => ({
    useReactFlow: () => ({
        getNode: (id: string) => rf.nodes.find(n => n.id === id),
        setNodes: (f: (nds: RFNode[]) => RFNode[]) => { rf.nodes = f(rf.nodes); },
    }),
}));

const redux: { state: any } = { state: {} };
vi.mock('react-redux', () => ({ useSelector: (sel: (s: any) => unknown) => sel(redux.state) }));
vi.mock('../../../../../joiner', () => ({ store: { getState: () => redux.state } }));

import { useContentDrivenSize } from '../useContentSize';
import type { ShapeForm } from '../irTypes';

const V = 'v1';
/** The content element: what `measureIntrinsic` reads, a style to write and two offsets. */
const el = { style: {} as Record<string, string>, offsetWidth: 40, offsetHeight: 20 };
const ref = { current: el as unknown as HTMLDivElement };

/** One render of the host, the hook called as IRNodeContent calls it. */
function render(form: ShapeForm, defaultSize?: unknown): void {
    runtime.i = 0;
    runtime.effects = [];
    useContentDrivenSize(V, form, ref, defaultSize);
}
/** The commit: the layout effects of the last render run. */
function commit(): void {
    for (const fn of runtime.effects) fn();
}
const node = () => rf.nodes.find(n => n.id === V)!;
const setResized = (isResized: boolean) => { redux.state = { idlookup: { [V]: { id: V, isResized } } }; };

const savedGCS = (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
beforeEach(() => {
    runtime.slots = [];
    rf.nodes = [{ id: V }];
    setResized(false);
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = () => ({
        borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '1px', borderBottomWidth: '1px',
        paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
    });
});
afterEach(() => {
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = savedGCS;
});

/** Collapse: rounded (inactive), then cylinder until the write settles. Returns the size written. */
function collapse(): { w: number; h: number } {
    render('rounded'); commit();
    render('cylinder'); commit();
    render('cylinder'); commit();
    const n = node();
    return { w: n.width!, h: n.height! };
}

describe('useContentDrivenSize: the size it wrote goes when it goes inactive', () => {
    it('collapse then expand: the derived cylinder box is dropped from the rounded node', () => {
        const written = collapse();
        // Positive control: the hook did write a derived box while the form was a cylinder.
        expect(written.w).toBeGreaterThan(0);
        expect(written.h).toBeGreaterThanOrEqual(64);
        render('rounded'); commit();
        expect(node().width).toBeUndefined();
        expect(node().height).toBeUndefined();
    });

    it('a manual size is kept: the vertex is resized under the layout in force', () => {
        const written = collapse();
        // A propagation can land on the very numbers the hook wrote: only isResized tells them apart.
        setResized(true);
        render('rounded'); commit();
        expect(node()).toMatchObject({ width: written.w, height: written.h });
    });

    it('a size somebody else wrote is kept', () => {
        collapse();
        rf.nodes = [{ id: V, width: 300, height: 120 }];
        render('cylinder'); commit();
        render('rounded'); commit();
        expect(node()).toMatchObject({ width: 300, height: 120 });
    });

    it('unchanged: a default size is dropped when the view stops carrying one', () => {
        render('rounded', { width: 200, height: 100 }); commit();
        render('rounded', { width: 200, height: 100 }); commit();
        expect(node()).toMatchObject({ width: 200, height: 100 });
        render('rounded'); commit();
        expect(node().width).toBeUndefined();
    });
});
