/**
 * Fix 2 of P-2026-10-01-2136 — DynamicHandles reads only its own node's edges.
 *
 * The selection must hand the handle computations exactly what they read from the whole
 * edge list, and the equality must say "same" only when no handle would be drawn differently.
 * The first is checked against `computeSideEndpoints` itself (handlePosition.ts, imported, not
 * changed): from all edges and from the selection it returns the same endpoints, on every side.
 */
import { describe, it, expect } from 'vitest';
import { selectOwnEdges, ownEdgesEqual } from '../../components/DynamicHandles';
import { computeSideEndpoints } from '../handlePosition';

const edge = (id: string, source: string, target: string, sourceHandle: string, targetHandle: string, type = 'reference', extra: any = {}): any =>
    ({ id, source, target, sourceHandle, targetHandle, type, ...extra });

const FLOW = [
    edge('e1', 'A', 'B', 'right-0', 'left-0'),
    edge('e2', 'B', 'C', 'right-0', 'left-0'),
    edge('e3', 'C', 'A', 'top-0', 'bottom-0', 'inheritance'),
    edge('e4', 'A', 'A', 'left-1', 'top-1'),
    edge('e5', 'D', 'E', 'right-0', 'left-0'),
    edge('e6', 'B', 'A', 'left-1', 'right-1'),
];

describe('selectOwnEdges', () => {
    it('keeps the edges that touch the node, in store order', () => {
        expect(selectOwnEdges(FLOW, 'A').map(e => e.id)).toEqual(['e1', 'e3', 'e4', 'e6']);
        expect(selectOwnEdges(FLOW, 'Z')).toEqual([]);
    });

    it('computeSideEndpoints gives the same endpoints from the selection as from every edge', () => {
        for (const node of ['A', 'B', 'C', 'D', 'E']) {
            for (const side of ['top', 'right', 'bottom', 'left'] as const) {
                expect(computeSideEndpoints(selectOwnEdges(FLOW, node), node, side))
                    .toEqual(computeSideEndpoints(FLOW, node, side));
            }
        }
    });
});

describe('ownEdgesEqual', () => {
    const own = selectOwnEdges(FLOW, 'A');

    it('equal when the edges are new objects with the same id, ends, type and handles', () => {
        const copies = own.map(e => ({ ...e, data: { label: 'changed' }, selected: true }));
        expect(ownEdgesEqual(own, copies)).toBe(true);
    });

    it('a foreign edge changing does not change the selection', () => {
        const flow2 = FLOW.map(e => (e.id === 'e5' ? { ...e, sourceHandle: 'bottom-3' } : e));
        expect(ownEdgesEqual(own, selectOwnEdges(flow2, 'A'))).toBe(true);
    });

    for (const [field, value] of [
        ['sourceHandle', 'right-2'], ['targetHandle', 'left-3'], ['type', 'inheritance'],
        ['source', 'Q'], ['target', 'Q'], ['id', 'e1b'],
    ] as const) {
        it(`not equal when an own edge's ${field} changes`, () => {
            const changed = own.map((e, i) => (i === 0 ? { ...e, [field]: value } : e));
            expect(ownEdgesEqual(own, changed)).toBe(false);
        });
    }

    it('not equal when an own edge is added or removed', () => {
        expect(ownEdgesEqual(own, own.slice(1))).toBe(false);
        expect(ownEdgesEqual(own, [...own, edge('e9', 'A', 'C', 'bottom-1', 'top-1')])).toBe(false);
    });
});
