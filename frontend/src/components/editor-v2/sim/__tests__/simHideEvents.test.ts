/**
 * simHideEvents: the canvas without the run's events (P-2026-10-04-0935, R-SIM-16, R-SIM-29).
 * Executes the pure filter on hand-built React Flow arrays (P11); EditorV2 hands it the run's
 * alphabet and the vertex -> object lookup, and the lane probe drives that wiring through the
 * panel. Each test name says which break of the rule kills it; the mutation bench is in the
 * commit message.
 */

import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { hideRunEvents, occupiesCanvas } from '../simHideEvents';

/** Vertex ids differ from object ids, as on the canvas (a node is a DVertex, its object is `model`). */
const objectOf = (nodeId: string): unknown => ({ vS1: 'S1', vS2: 'S2', vT1: 'T1', vE1: 'E1', vE2: 'E2' } as Record<string, string>)[nodeId];

function node(id: string, extra: Partial<Node> = {}): Node {
    return { id, type: 'objectNode', position: { x: id.length * 10, y: 7 }, width: 120, height: 40, data: { label: id }, ...extra };
}
function edge(id: string, source: string, target: string, extra: Partial<Edge> = {}): Edge {
    return { id, source, target, type: 'instanceRef', sourceHandle: 'right-0', targetHandle: 'left-0', data: { ref: id }, ...extra };
}

function scene() {
    const nodes = [node('vS1'), node('vT1'), node('vE1'), node('vS2'), node('vE2')];
    const edges = [
        edge('src', 'vT1', 'vS1'),                 // transition -> state
        edge('tgt', 'vT1', 'vS2'),                 // transition -> state
        edge('trig', 'vT1', 'vE1'),                // the trigger reference
        edge('own', 'vS1', 'vT1', { type: 'composition' }),
        edge('fromEvent', 'vE2', 'vS2'),           // an edge leaving an event
    ];
    return { nodes, edges };
}

const hiddenIds = (xs: Array<{ id: string; hidden?: boolean }>) => xs.filter(x => x.hidden).map(x => x.id);

describe('hideRunEvents', () => {
    it('no run: the same arrays (an undefined alphabet hides nothing)', () => {
        const { nodes, edges } = scene();
        const out = hideRunEvents(nodes, edges, undefined, objectOf);
        expect(out.nodes).toBe(nodes);
        expect(out.edges).toBe(edges);
    });

    it('a run without the event role: the same arrays, the parity oracle of R-SIM-16', () => {
        const { nodes, edges } = scene();
        const out = hideRunEvents(nodes, edges, [], objectOf);
        expect(out.nodes).toBe(nodes);
        expect(out.edges).toBe(edges);
    });

    it('events that are not on this canvas: the same arrays', () => {
        const { nodes, edges } = scene();
        const out = hideRunEvents(nodes, edges, ['E9'], objectOf);
        expect(out.nodes).toBe(nodes);
        expect(out.edges).toBe(edges);
    });

    it('an event node is flagged hidden, matched by its object and not by its node id', () => {
        const { nodes, edges } = scene();
        expect(hiddenIds(hideRunEvents(nodes, edges, ['E1', 'E2'], objectOf).nodes)).toEqual(['vE1', 'vE2']);
        // The node id of an event is not an event: nothing matches.
        expect(hideRunEvents(nodes, edges, ['vE1'], objectOf).nodes).toBe(nodes);
    });

    it('only the run\'s events: a node of another object is not hidden', () => {
        const { nodes, edges } = scene();
        expect(hiddenIds(hideRunEvents(nodes, edges, ['E2'], objectOf).nodes)).toEqual(['vE2']);
    });

    it('the trigger reference, an edge whose target is an event, is hidden', () => {
        const { nodes, edges } = scene();
        expect(hiddenIds(hideRunEvents(nodes, edges, ['E1'], objectOf).edges)).toEqual(['trig']);
    });

    it('an edge whose source is an event is hidden', () => {
        const { nodes, edges } = scene();
        expect(hiddenIds(hideRunEvents(nodes, edges, ['E2'], objectOf).edges)).toEqual(['fromEvent']);
    });

    it('every other node and edge keeps its object, so its box cannot move', () => {
        const { nodes, edges } = scene();
        const out = hideRunEvents(nodes, edges, ['E1', 'E2'], objectOf);
        for (const id of ['vS1', 'vT1', 'vS2']) expect(out.nodes.find(n => n.id === id)).toBe(nodes.find(n => n.id === id));
        for (const id of ['src', 'tgt', 'own']) expect(out.edges.find(e => e.id === id)).toBe(edges.find(e => e.id === id));
    });

    it('hidden, never removed: the same lengths in the same order', () => {
        const { nodes, edges } = scene();
        const out = hideRunEvents(nodes, edges, ['E1', 'E2'], objectOf);
        expect(out.nodes.map(n => n.id)).toEqual(nodes.map(n => n.id));
        expect(out.edges.map(e => e.id)).toEqual(edges.map(e => e.id));
    });

    it('the hidden copy keeps position, size, handles and data: only the flag, and on a node the run\'s mark, are added', () => {
        const { nodes, edges } = scene();
        const out = hideRunEvents(nodes, edges, ['E1'], objectOf);
        expect(out.nodes.find(n => n.id === 'vE1')).toEqual({ ...nodes.find(n => n.id === 'vE1'), hidden: true, simRunHidden: true });
        expect(out.edges.find(e => e.id === 'trig')).toEqual({ ...edges.find(e => e.id === 'trig'), hidden: true });
    });

    it('the inputs are not written: the editor\'s own arrays stay as they were', () => {
        const { nodes, edges } = scene();
        const before = JSON.stringify({ nodes, edges });
        hideRunEvents(nodes, edges, ['E1', 'E2'], objectOf);
        expect(JSON.stringify({ nodes, edges })).toBe(before);
    });

    it('an element already hidden keeps its object, and alone it changes nothing', () => {
        const nodes = [node('vS1'), node('vE1', { hidden: true })];
        const edges = [edge('trig', 'vS1', 'vE1', { hidden: true }), edge('loop', 'vS1', 'vS1')];
        const out = hideRunEvents(nodes, edges, ['E1'], objectOf);
        expect(out.nodes).toBe(nodes);
        expect(out.edges).toBe(edges);
    });

    it('a node whose object is unknown is never hidden', () => {
        const nodes = [node('vX'), node('vE1')];
        const out = hideRunEvents(nodes, [], ['E1', 'undefined'], objectOf);
        expect(hiddenIds(out.nodes)).toEqual(['vE1']);
    });
});

describe('occupiesCanvas', () => {
    it('a drawn node takes its place', () => {
        expect(occupiesCanvas(node('vS1'))).toBe(true);
    });

    it('a node the run hides keeps its place, so the routes and lanes of the other edges do not move', () => {
        const { nodes, edges } = scene();
        const hidden = hideRunEvents(nodes, edges, ['E1'], objectOf).nodes.find(n => n.id === 'vE1')!;
        expect(hidden.hidden).toBe(true);
        expect(occupiesCanvas(hidden)).toBe(true);
    });

    it('a node hidden otherwise (an IR row, a collapsed hull) takes no place, as before', () => {
        expect(occupiesCanvas(node('vE1', { hidden: true }))).toBe(false);
        // An event node the IR already hides is left so by the run: still no place.
        const nodes = [node('vS1'), node('vE1', { hidden: true })];
        const out = hideRunEvents(nodes, [], ['E1'], objectOf).nodes.find(n => n.id === 'vE1')!;
        expect(occupiesCanvas(out)).toBe(false);
    });
});
