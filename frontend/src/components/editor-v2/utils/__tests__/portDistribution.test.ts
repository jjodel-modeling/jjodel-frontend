import { describe, it, expect } from 'vitest';
import {
    computePortDistribution,
    sideCapacity,
    MAX_HANDLES_PER_SIDE,
    MIN_ANCHOR_SPACING_PX,
    type EdgeMinimal,
    type NodePosition,
} from '../portDistribution';

// The neutral node measured on the canvas (see the Fase A discovery report).
const NODE_W = 140;
const NODE_H = 53;

function node(x: number, y: number, w = NODE_W, h = NODE_H): NodePosition {
    return { centerX: x + w / 2, centerY: y + h / 2, width: w, height: h };
}

const LEAF_STEP = 120;

/**
 * Hub with `n` leaves due east, stacked vertically and CENTRED on the hub — so
 * the fan is symmetric and the two ends of the side point one up, one down.
 * (With the hub at the top of the column every leaf sits below it and a spill
 * toward `top` would be geometrically wrong, not a bug.)
 */
function eastFan(n: number, opts: { type?: string; hubHeight?: number } = {}) {
    const positions = new Map<string, NodePosition>();
    const hubH = opts.hubHeight ?? NODE_H;
    const spanCentre = ((n - 1) * LEAF_STEP) / 2;
    positions.set('hub', node(0, spanCentre + NODE_H / 2 - hubH / 2, NODE_W, hubH));
    const edges: EdgeMinimal[] = [];
    for (let i = 0; i < n; i++) {
        const id = `leaf${i}`;
        positions.set(id, node(600, i * LEAF_STEP));
        edges.push({
            id: `e${i}`,
            source: 'hub',
            target: id,
            sourceHandle: 'right-0',
            targetHandle: 'left-0',
            type: opts.type ?? 'reference',
        });
    }
    return { edges, positions, nodeIds: Array.from(positions.keys()) };
}

/** Side of the handle the hub uses for each edge, in edge order. */
function hubSides(
    result: Map<string, { sourceHandle: string; targetHandle: string }>,
    edges: EdgeMinimal[],
): string[] {
    return edges.map(e => result.get(e.id)!.sourceHandle.split('-')[0]);
}

/** Feed a distribution's own output back in, the way EditorV2's reactive guard does. */
function reapply(edges: EdgeMinimal[], result: Map<string, { sourceHandle: string; targetHandle: string }>): EdgeMinimal[] {
    return edges.map(e => ({
        ...e,
        sourceHandle: result.get(e.id)!.sourceHandle,
        targetHandle: result.get(e.id)!.targetHandle,
    }));
}

describe('sideCapacity — the physical capacity policy', () => {
    it('counts how many anchors fit at the minimum spacing', () => {
        // N endpoints sit at (k+1)/(N+1) along the side, so the step is L/(N+1).
        expect(sideCapacity('right', { width: NODE_W, height: NODE_H })).toBe(4);   // 53/5  = 10.6
        expect(sideCapacity('left', { width: NODE_W, height: 100 })).toBe(9);       // 100/10 = 10
        expect(sideCapacity('top', { width: NODE_W, height: NODE_H })).toBe(13);    // 140/14 = 10
    });

    it('every anchor it admits is at least MIN_ANCHOR_SPACING_PX from its neighbour', () => {
        for (const h of [40, 53, 80, 100, 160, 240]) {
            const n = sideCapacity('right', { width: NODE_W, height: h });
            expect(h / (n + 1)).toBeGreaterThanOrEqual(MIN_ANCHOR_SPACING_PX - 1e-9);
        }
    });

    it('falls back to the fixed pool when the size is unknown — the pre-capacity behaviour', () => {
        expect(sideCapacity('right', undefined)).toBe(MAX_HANDLES_PER_SIDE);
        expect(sideCapacity('right', { width: NODE_W })).toBe(MAX_HANDLES_PER_SIDE);
        expect(sideCapacity('right', { width: NODE_W, height: 0 })).toBe(MAX_HANDLES_PER_SIDE);
    });

    it('R0 by construction: on the neutral node the capacity IS the old fixed cap', () => {
        // This is why nothing moves below five incidences. If this assert ever
        // fails, the non-saturated baseline of the Fase A report moves with it.
        expect(sideCapacity('right', { width: NODE_W, height: NODE_H })).toBe(MAX_HANDLES_PER_SIDE);
    });
});

describe('computePortDistribution — capacity spill', () => {
    it('leaves a side at capacity alone (R0: 4 edges keep right-0..3)', () => {
        const { edges, positions, nodeIds } = eastFan(4);
        const { edgeHandles } = computePortDistribution(edges, nodeIds, positions);

        expect(hubSides(edgeHandles, edges)).toEqual(['right', 'right', 'right', 'right']);
        expect(edges.map(e => edgeHandles.get(e.id)!.sourceHandle).sort())
            .toEqual(['right-0', 'right-1', 'right-2', 'right-3']);
    });

    it('spills the overflow onto the adjacent sides instead of clamping', () => {
        const { edges, positions, nodeIds } = eastFan(6);
        const { edgeHandles } = computePortDistribution(edges, nodeIds, positions);
        const sides = hubSides(edgeHandles, edges);

        expect(sides.filter(s => s === 'right')).toHaveLength(4);
        // Shed symmetrically: the leaf highest up leaves toward the top, the one
        // lowest down toward the bottom — each toward where it already pointed.
        expect(sides[0]).toBe('top');
        expect(sides[5]).toBe('bottom');

        // No two edges share a handle any more, which is what the clamp used to do.
        const handles = edges.map(e => edgeHandles.get(e.id)!.sourceHandle);
        expect(new Set(handles).size).toBe(handles.length);
    });

    it('keeps every edge: none is dropped or left without a handle', () => {
        const { edges, positions, nodeIds } = eastFan(9);
        const { edgeHandles } = computePortDistribution(edges, nodeIds, positions);
        expect(edgeHandles.size).toBe(edges.length);
        for (const e of edges) {
            expect(edgeHandles.get(e.id)!.sourceHandle).toMatch(/^(top|right|bottom|left)-\d+$/);
        }
    });

    it('is idempotent — distribute(distribute(x)) === distribute(x)', () => {
        // The reactive guard in EditorV2 (:1221) re-runs the distribution over its
        // own output; without this property it would never settle.
        const { edges, positions, nodeIds } = eastFan(7);
        const first = computePortDistribution(edges, nodeIds, positions).edgeHandles;
        const second = computePortDistribution(reapply(edges, first), nodeIds, positions).edgeHandles;

        for (const e of edges) {
            expect(second.get(e.id)).toEqual(first.get(e.id));
        }
    });

    it('is deterministic regardless of the order the edges arrive in', () => {
        const { edges, positions, nodeIds } = eastFan(6);
        const forward = computePortDistribution(edges, nodeIds, positions).edgeHandles;
        const backward = computePortDistribution([...edges].reverse(), nodeIds, positions).edgeHandles;

        for (const e of edges) {
            expect(backward.get(e.id)).toEqual(forward.get(e.id));
        }
    });

    it('does nothing at all when the caller supplies no sizes', () => {
        const { edges, positions, nodeIds } = eastFan(6);
        const sizeless = new Map<string, NodePosition>();
        for (const [id, p] of positions) sizeless.set(id, { centerX: p.centerX, centerY: p.centerY });

        const { edgeHandles } = computePortDistribution(edges, nodeIds, sizeless);
        // Pre-capacity behaviour: everything stays on the elected side and the
        // overflow shares the last handle of the pool.
        expect(hubSides(edgeHandles, edges).every(s => s === 'right')).toBe(true);
        expect(edgeHandles.get('e5')!.sourceHandle).toBe(`right-${MAX_HANDLES_PER_SIDE - 1}`);
    });
});

describe('computePortDistribution — what the spill must never touch', () => {
    it('never moves an inheritance edge off its side', () => {
        // Inheritance owns top/bottom by convention and collapses its whole fan
        // into one port, so it cannot saturate a side by itself either.
        const { edges, positions, nodeIds } = eastFan(6, { type: 'inheritance' });
        const inh = edges.map(e => ({ ...e, sourceHandle: 'top-0', targetHandle: 'bottom-0' }));
        const { edgeHandles } = computePortDistribution(inh, nodeIds, positions);

        for (const e of inh) {
            expect(edgeHandles.get(e.id)!.sourceHandle).toBe('top-0'); // one shared port
        }
    });

    it('never moves a pinned endpoint', () => {
        const { edges, positions, nodeIds } = eastFan(6);
        const pinned = edges.map((e, i) => ({ ...e, sourcePinned: i < 5 }));
        const { edgeHandles } = computePortDistribution(pinned, nodeIds, positions);

        for (let i = 0; i < 5; i++) {
            expect(edgeHandles.get(`e${i}`)!.sourceHandle.split('-')[0]).toBe('right');
        }
        // Only the one free endpoint can relieve the side.
        expect(edgeHandles.get('e5')!.sourceHandle.split('-')[0]).not.toBe('right');
    });

    it('falls back to the clamp — never to a hidden edge — when nothing can move', () => {
        // Every endpoint pinned: the side stays over capacity and STEP 3 clamps,
        // which is exactly the behaviour that predates this change.
        const { edges, positions, nodeIds } = eastFan(6);
        const allPinned = edges.map(e => ({ ...e, sourcePinned: true }));
        const { edgeHandles } = computePortDistribution(allPinned, nodeIds, positions);

        expect(edgeHandles.size).toBe(edges.length);
        for (const e of edges) {
            const h = edgeHandles.get(e.id)!.sourceHandle;
            expect(h.split('-')[0]).toBe('right');
            expect(parseInt(h.split('-')[1], 10)).toBeLessThan(MAX_HANDLES_PER_SIDE);
        }
    });
});

describe('computePortDistribution — the pool truncates the benefit on tall nodes', () => {
    it('a tall side admits more anchors geometrically than the DOM pool can address', () => {
        // Declared limitation: sideCapacity says 9 on a 100px side, but each role
        // bucket still has to fit MAX_HANDLES_PER_SIDE pre-allocated handles, so
        // the spill relieves the side down to the pool, not down to the geometry.
        const tall = 100;
        expect(sideCapacity('right', { width: NODE_W, height: tall })).toBeGreaterThan(MAX_HANDLES_PER_SIDE);

        const { edges, positions, nodeIds } = eastFan(9, { hubHeight: tall });
        const { edgeHandles } = computePortDistribution(edges, nodeIds, positions);
        const sides = hubSides(edgeHandles, edges);

        // The pool, not the 9-anchor geometry, sets what stays on the right.
        expect(sides.filter(s => s === 'right').length).toBeLessThanOrEqual(MAX_HANDLES_PER_SIDE);
        // And still nothing collapses: every edge keeps its own handle.
        const handles = edges.map(e => edgeHandles.get(e.id)!.sourceHandle);
        expect(new Set(handles).size).toBe(handles.length);
    });
});
