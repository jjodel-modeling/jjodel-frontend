/**
 * The nodes React Flow has never measured (P-2026-11-04-0901, LIR docs/discovery/lir_2026-11-04_canvas_mount_unmeasured.md).
 *
 * ── The subject runs ────────────────────────────────────────────────────────
 * The decorated nodes go through React Flow's own code, imported from `@xyflow/system` (the version `@xyflow/react`
 * ships with): `adoptUserNodes` builds the internal nodes as `<ReactFlow nodes>` does, `getNodesInside` is the cull of
 * `onlyRenderVisibleElements`, `getEdgePosition` is what draws an edge or warns `Couldn't create edge`. The two faults
 * of the throwaway patch are asserted there: an edge into a never-measured node has a position, and
 * `nodesInitialized` (the gate of every `fitView()`) holds.
 *
 * Gap: the call sites in `EditorV2.tsx` (the `nodes=` prop, `getNodes`, the change filter, the auto-layout wait) are
 * not executable here, because EditorV2 imports the joiner barrel and monaco, which fail at import with no `window`.
 */
import { describe, expect, it } from 'vitest';
import { adoptUserNodes, getEdgePosition, getNodesInside, ConnectionMode } from '@xyflow/system';
import type { Edge, Node } from '@xyflow/react';
import {
    ESTIMATED_NODE_SIZE,
    HANDLE_SIZE,
    MOUNT_ALL_MAX_NODES,
    allMeasured,
    decorateUnmeasured,
    isDecorated,
    shouldDecorate,
    synthesizeHandles,
    undecorate,
} from '../unmeasuredNodes';
import { computeSideEndpoints, computeSidePositions } from '../utils/handlePosition';

const node = (id: string, x: number, y: number, extra: Partial<Node> = {}): Node =>
    ({ id, position: { x, y }, data: {}, type: 'object', ...extra }) as Node;
const measured = (id: string, x: number, y: number, w = 200, h = 100): Node => node(id, x, y, { measured: { width: w, height: h } });
const edge = (id: string, source: string, target: string, sourceHandle: string, targetHandle: string, type = 'reference'): Edge =>
    ({ id, source, target, sourceHandle, targetHandle, type }) as Edge;

/** React Flow's internal nodes for these user nodes, as the `nodes=` prop builds them. */
function adopt(nodes: Node[]) {
    const nodeLookup = new Map();
    const parentLookup = new Map();
    const { nodesInitialized } = adoptUserNodes(nodes as any, nodeLookup, parentLookup, { checkEquality: true });
    return { nodeLookup, nodesInitialized };
}

describe('shouldDecorate', () => {
    it('leaves a small canvas to React Flow, mounted in full as today', () => {
        expect(shouldDecorate(true, MOUNT_ALL_MAX_NODES)).toBe(false);
        expect(shouldDecorate(true, MOUNT_ALL_MAX_NODES + 1)).toBe(true);
    });
    it('leaves a canvas that renders every element (graphVertex, content size) to React Flow', () => {
        expect(shouldDecorate(false, MOUNT_ALL_MAX_NODES + 1000)).toBe(false);
    });
});

describe('synthesizeHandles', () => {
    const box = { width: 180, height: 80 };

    it('lists the 32 handles of the pool: four per side, a target and a source each, in DOM order', () => {
        const hs = synthesizeHandles('A', [], box, new Map());
        expect(hs).toHaveLength(32);
        expect(hs.slice(0, 4).map(h => `${h.type}:${h.id}`)).toEqual(['target:top-0', 'source:top-0', 'target:top-1', 'source:top-1']);
        expect(new Set(hs.map(h => `${h.type}:${h.id}`)).size).toBe(32);
        expect(hs.every(h => h.width === HANDLE_SIZE && h.height === HANDLE_SIZE)).toBe(true);
    });

    it('centres an inactive handle on the middle of its side, as the CSS translate(-50%) centres it', () => {
        const hs = synthesizeHandles('A', [], box, new Map());
        const at = (type: string, id: string) => hs.find(h => h.type === type && h.id === id)!;
        const half = HANDLE_SIZE / 2;
        expect(at('source', 'left-2')).toMatchObject({ x: -half, y: 40 - half, position: 'left' });
        expect(at('target', 'right-0')).toMatchObject({ x: 180 - half, y: 40 - half, position: 'right' });
        expect(at('source', 'top-3')).toMatchObject({ x: 90 - half, y: -half, position: 'top' });
        expect(at('target', 'bottom-1')).toMatchObject({ x: 90 - half, y: 80 - half, position: 'bottom' });
    });

    it('places an active endpoint where DynamicHandles does, ordered by the opposite centre', () => {
        // Two edges leave A's right side: to B (lower) on right-0 and to C (higher) on right-1.
        const edges = [edge('e1', 'A', 'B', 'right-0', 'left-0'), edge('e2', 'A', 'C', 'right-1', 'left-0')];
        const positions = new Map([['B', { centerX: 500, centerY: 300 }], ['C', { centerX: 500, centerY: -100 }]]);
        const hs = synthesizeHandles('A', edges, box, positions);
        const expected = computeSidePositions(computeSideEndpoints(edges, 'A', 'right'), positions);
        const y = (id: string) => hs.find(h => h.type === 'source' && h.id === id)!.y + HANDLE_SIZE / 2;
        expect(y('right-0')).toBeCloseTo(expected.get('right-0:source')! * 80);
        expect(y('right-1')).toBeCloseTo(expected.get('right-1:source')! * 80);
        // C is above B, so the edge to C sits higher on the side.
        expect(y('right-1')).toBeLessThan(y('right-0'));
        // The target role of the same id stays inactive, in the middle.
        expect(hs.find(h => h.type === 'target' && h.id === 'right-0')!.y + HANDLE_SIZE / 2).toBe(40);
    });
});

describe('decorateUnmeasured', () => {
    it('decorates only a node with no size, no handles and not hidden', () => {
        const nodes = [node('A', 0, 0), measured('B', 300, 0), node('H', 0, 0, { hidden: true }), node('U', 0, 0, { handles: [] })];
        const out = decorateUnmeasured(nodes, [], new Map());
        expect(out[0]).not.toBe(nodes[0]);
        expect(isDecorated(out[0])).toBe(true);
        expect(out[0].measured).toEqual(ESTIMATED_NODE_SIZE);
        expect(out[0].handles).toHaveLength(32);
        out.slice(1).forEach((n, i) => expect(n).toBe(nodes[i + 1]));
    });

    it('hands back the array itself when nothing needs it', () => {
        const nodes = [measured('A', 0, 0), measured('B', 300, 0)];
        expect(decorateUnmeasured(nodes, [], new Map())).toBe(nodes);
    });

    it('keeps the estimate off any integer size, so the first measurement always reports a change', () => {
        expect(Number.isInteger(ESTIMATED_NODE_SIZE.width)).toBe(false);
        expect(Number.isInteger(ESTIMATED_NODE_SIZE.height)).toBe(false);
    });

    it('keeps the decorated object while the node and its own edges stay, so React Flow keeps its internal node', () => {
        const cache = new Map();
        const nodes = [node('A', 0, 0), measured('B', 300, 0), measured('C', 600, 0)];
        const e1 = edge('e1', 'A', 'B', 'right-0', 'left-0');
        const e2 = edge('e2', 'B', 'C', 'right-0', 'left-0');
        const first = decorateUnmeasured(nodes, [e1], cache);
        // Another node's edge appears: A's handles do not change, nor does its object.
        const second = decorateUnmeasured(nodes, [e1, e2], cache);
        expect(second[0]).toBe(first[0]);
        // A's own edge moves to another handle: new handles.
        const third = decorateUnmeasured(nodes, [edge('e1', 'A', 'B', 'bottom-0', 'left-0'), e2], cache);
        expect(third[0]).not.toBe(first[0]);
        const bottom0 = third[0].handles!.find(h => h.type === 'source' && h.id === 'bottom-0')!;
        expect(bottom0.x + HANDLE_SIZE / 2).toBeCloseTo(ESTIMATED_NODE_SIZE.width / 2);
    });

    it('follows the node object: a moved node goes in at its new position', () => {
        const cache = new Map();
        const first = decorateUnmeasured([node('A', 0, 0)], [], cache);
        const moved = decorateUnmeasured([node('A', 50, 70)], [], cache);
        expect(moved[0]).not.toBe(first[0]);
        expect(moved[0].position).toEqual({ x: 50, y: 70 });
    });
});

describe('undecorate', () => {
    it('gives back the canvas node for a decorated one', () => {
        const a = node('A', 0, 0);
        const [d] = decorateUnmeasured([a], [], new Map());
        expect(undecorate(d)).toBe(a);
    });

    it('strips the estimate and the handles from a copy React Flow made of a decorated node, keeping its edits', () => {
        const a = node('A', 0, 0);
        const [d] = decorateUnmeasured([a], [], new Map());
        const copy = { ...d, selected: true, position: { x: 5, y: 6 } };
        const out = undecorate(copy);
        expect(out.measured).toBeUndefined();
        expect(out.handles).toBeUndefined();
        expect(isDecorated(out)).toBe(false);
        expect(out).toMatchObject({ id: 'A', selected: true, position: { x: 5, y: 6 } });
    });

    it('leaves any other node as it is', () => {
        const b = measured('B', 0, 0);
        expect(undecorate(b)).toBe(b);
    });
});

describe('allMeasured', () => {
    it('holds when every node that is not hidden has a measured size', () => {
        expect(allMeasured([measured('A', 0, 0), node('H', 0, 0, { hidden: true })])).toBe(true);
        expect(allMeasured([measured('A', 0, 0), node('U', 0, 0)])).toBe(false);
    });
});

describe('through React Flow', () => {
    // A on screen, mounted and measured: React Flow read its handle bounds off the DOM, here the pool on its real box.
    // B and C far off screen, never measured.
    const edges = [edge('e1', 'A', 'B', 'right-0', 'left-0'), edge('e2', 'B', 'C', 'bottom-0', 'top-0')];
    const aHandles = synthesizeHandles('A', [edges[0]], { width: 200, height: 100 }, new Map());
    const nodes = [{ ...measured('A', 0, 0), handles: aHandles }, node('B', 5000, 0), node('C', 5000, 3000)];
    const pane = { x: 0, y: 0, width: 1000, height: 800 };

    it('without the decoration, React Flow renders every never-measured node and no fit resolves (the baseline)', () => {
        const { nodeLookup, nodesInitialized } = adopt(nodes);
        expect(getNodesInside(nodeLookup, pane, [0, 0, 1], true).map((n: any) => n.id)).toEqual(['A', 'B', 'C']);
        expect(nodesInitialized).toBe(false);
    });

    it('with it, only the node on screen is rendered', () => {
        const { nodeLookup } = adopt(decorateUnmeasured(nodes, edges, new Map()));
        expect(getNodesInside(nodeLookup, pane, [0, 0, 1], true).map((n: any) => n.id)).toEqual(['A']);
    });

    it('with it, nodesInitialized holds, so fitView() resolves', () => {
        expect(adopt(decorateUnmeasured(nodes, edges, new Map())).nodesInitialized).toBe(true);
    });

    it('with it, an edge into a never-measured node has a position, at the synthesized handle', () => {
        const { nodeLookup } = adopt(decorateUnmeasured(nodes, edges, new Map()));
        const errors: string[] = [];
        for (const mode of [ConnectionMode.Strict, ConnectionMode.Loose]) {
            for (const e of edges) {
                const p = getEdgePosition({
                    id: e.id, sourceNode: nodeLookup.get(e.source), targetNode: nodeLookup.get(e.target),
                    sourceHandle: e.sourceHandle ?? null, targetHandle: e.targetHandle ?? null,
                    connectionMode: mode, onError: (code: string) => errors.push(code),
                } as any);
                expect(p).not.toBeNull();
            }
        }
        expect(errors).toEqual([]);
        const p = getEdgePosition({
            id: 'e1', sourceNode: nodeLookup.get('A'), targetNode: nodeLookup.get('B'),
            sourceHandle: 'right-0', targetHandle: 'left-0', connectionMode: ConnectionMode.Strict,
        } as any)!;
        // B's left-0 is a target on B's left side, in the middle of the estimated box.
        expect(p.targetX).toBeCloseTo(5000 - HANDLE_SIZE / 2);
        expect(p.targetY).toBeCloseTo(ESTIMATED_NODE_SIZE.height / 2);
    });

    it('with empty handles (the throwaway patch), the same edge has no position', () => {
        const patched = nodes.map(n => (n.measured ? n : { ...n, handles: [], initialWidth: 180, initialHeight: 80 }));
        const { nodeLookup } = adopt(patched as Node[]);
        const errors: string[] = [];
        const p = getEdgePosition({
            id: 'e1', sourceNode: nodeLookup.get('A'), targetNode: nodeLookup.get('B'),
            sourceHandle: 'right-0', targetHandle: 'left-0', connectionMode: ConnectionMode.Strict,
            onError: (code: string) => errors.push(code),
        } as any);
        expect(p).toBeNull();
        expect(errors).toEqual(['008']);
    });
});
