/**
 * The transformer reads the layout key it is given (multi-tab L3, P-2026-11-07-1249).
 *
 * Two tabs on one model under two exclusive viewpoints `A` and `B` hand the transformer two keys
 * while the root `state.viewpoint` is one of them. Each vertex carries a record under both keys, so
 * a transformer that read the root would place, size and anchor the `B` tab on `A`'s geometry. With
 * no key the root's is read, which is the transformer before L3.
 *
 * The joiner barrel is faked to its store: the transformer reaches it only through the layout
 * adapter (`getActiveLayoutKey`).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redux: { state: any } = { state: {} };
vi.mock('../../../../joiner', () => ({ store: { getState: () => redux.state } }));

import { jjomVertexToRFNode, jjomEdgeToRFEdge, transformJjomGraph } from '../jjomTransformers';

const rec = (x: number, y: number, w: number, h: number, isResized = true) => ({ x, y, w, h, isResized });
/** A D-vertex with a seed and a record under `A` and under `B`. */
function raw(id: string, a: ReturnType<typeof rec>, b: ReturnType<typeof rec>) {
    return { id, className: 'DVertex', x: 1, y: 2, w: 100, h: 50, isResized: false, layoutByViewpoint: { A: a, B: b } };
}
const enumV = { id: 'e1', model: { className: 'DEnumerator', name: 'E', literals: [] }, __raw: raw('e1', rec(10, 20, 120, 60), rec(300, 400, 220, 160)) };
const pkgV = { id: 'p1', model: { className: 'DPackage', name: 'P' }, __raw: raw('p1', rec(5, 6, 500, 350), rec(50, 60, 700, 450)) };
// Under A the target stands to the right of the source, under B below it.
const objS = { id: 's1', model: { className: 'DObject' }, __raw: raw('s1', rec(0, 0, 180, 80), rec(0, 0, 180, 80)) };
const objT = { id: 't1', model: { className: 'DObject' }, __raw: raw('t1', rec(600, 0, 180, 80), rec(0, 600, 180, 80)) };
const edge = { id: 'x1', start: objS, end: objT, model: { id: 'r', name: 'r', composition: true } };

beforeEach(() => {
    redux.state = { viewpoint: 'A', idlookup: { A: { id: 'A', isExclusiveView: true }, B: { id: 'B', isExclusiveView: true } } };
});

describe('jjomTransformers: the layout key is a parameter', () => {
    it('a vertex is placed and sized on the record of the key it is given, not the root one', () => {
        const n = jjomVertexToRFNode(enumV, 'B')!;
        expect(n.position).toEqual({ x: 300, y: 400 });
        expect([n.width, n.height]).toEqual([220, 160]);
    });

    it('a package takes position and box from the key it is given', () => {
        const n = jjomVertexToRFNode(pkgV, 'B')!;
        expect(n.position).toEqual({ x: 50, y: 60 });
        expect(n.style).toMatchObject({ width: 700, height: 450 });
    });

    it('an edge is anchored on the geometry of the key it is given', () => {
        expect(jjomEdgeToRFEdge(edge, 'A')).toMatchObject({ sourceHandle: 'right-0', targetHandle: 'left-0' });
        expect(jjomEdgeToRFEdge(edge, 'B')).toMatchObject({ sourceHandle: 'bottom-0', targetHandle: 'top-0' });
    });

    it('the batch transform hands its key to every vertex and edge', () => {
        const { nodes, edges } = transformJjomGraph([enumV, objS, objT], [edge], 'B');
        expect(nodes.map(n => n.position)).toEqual([{ x: 300, y: 400 }, { x: 0, y: 0 }, { x: 0, y: 600 }]);
        expect(edges[0]).toMatchObject({ sourceHandle: 'bottom-0', targetHandle: 'top-0' });
    });

    it('a key with no record reads the seed, whatever the root is', () => {
        const n = jjomVertexToRFNode(enumV, '__abstract__')!;
        expect(n.position).toEqual({ x: 1, y: 2 });
        expect(n.width).toBeUndefined();
    });

    it('with no key the root key is read: the transformer of one tab, unchanged', () => {
        expect(jjomVertexToRFNode(enumV)!.position).toEqual({ x: 10, y: 20 });
        expect(jjomEdgeToRFEdge(edge)).toMatchObject({ sourceHandle: 'right-0', targetHandle: 'left-0' });
        redux.state = { ...redux.state, viewpoint: 'B' };
        expect(jjomVertexToRFNode(enumV)!.position).toEqual({ x: 300, y: 400 });
        expect(transformJjomGraph([enumV], [])).toEqual(transformJjomGraph([enumV], [], 'B'));
    });

    it('with one tab and its key equal to the root key, the result equals the keyless one', () => {
        expect(jjomVertexToRFNode(enumV, 'A')).toEqual(jjomVertexToRFNode(enumV));
        expect(jjomVertexToRFNode(pkgV, 'A')).toEqual(jjomVertexToRFNode(pkgV));
        expect(jjomEdgeToRFEdge(edge, 'A')).toEqual(jjomEdgeToRFEdge(edge));
    });
});
