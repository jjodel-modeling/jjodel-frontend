/**
 * The layout key as an input of the incremental sync (R-MT-19, P-2026-11-07-0430).
 *
 * `useJjomSync` re-transforms an existing element only when `snapshotUnchanged` is false for it,
 * over the snapshot `elementSnapshotsOf` builds on every dispatch. A viewpoint switch changes no
 * D-object, so before R-MT-19 every vertex compared equal and kept the previous key's position
 * (discovery_2026-11-07_layout_switch_after_242a82bcd.md, 0/3 on the trunk). These tests switch the
 * key and nothing else. The transformer itself (`jjomVertexToRFNode`) does not import in the bench
 * (joiner barrel); the position it reads is `readVertexLayout` under the active key, asserted here.
 */
import { describe, it, expect } from 'vitest';
import { elementSnapshotsOf, snapshotUnchanged, layoutKeyOnlyChange, rekeyedNode } from '../vertexSnapshot';
import { readVertexLayout } from '../../viewpoint/layout/vertexLayout';

type L = Record<string, any>;

const KEY_A = 'Pointer_VP_A';
const KEY_B = 'Pointer_VP_B';
const VERTICES = ['VA', 'VB', 'VC'];
const IDS = [...VERTICES, 'E1', 'X1'];

function vertex(id: string, model: string, i: number) {
    const seed = { x: 0, y: 100 * i, w: 120, h: 60, isResized: false };
    return {
        id, className: 'DVertex', model, ...seed,
        layoutByViewpoint: {
            [KEY_A]: { ...seed, y: seed.y + 180 },
            [KEY_B]: { ...seed, x: seed.x + 160 },
        },
    };
}

function fixture(): L {
    const L: L = {};
    const put = (o: any) => { L[o.id] = o; };
    put({ id: 'M', className: 'DModel', name: 'm' });
    put({ id: 'C', className: 'DClass', name: 'Alpha', attributes: ['AT'] });
    put({ id: 'AT', className: 'DAttribute', name: 'name', father: 'C', type: 'T' });
    put({ id: 'T', className: 'DDataType', name: 'EString' });
    put({ id: 'R', className: 'DReference', name: 'next', father: 'C', type: 'C' });
    put({ id: 'OA', className: 'DObject', name: 'a', father: 'M', instanceof: 'C', features: [] });
    put({ id: 'OB', className: 'DObject', name: 'b', father: 'M', instanceof: 'C', features: [] });
    put({ id: 'OC', className: 'DObject', name: 'c', father: 'M', instanceof: 'C', features: [] });
    put(vertex('VA', 'OA', 0));
    put(vertex('VB', 'OB', 1));
    put(vertex('VC', 'OC', 2));
    // An edge with a model element carries a content hash today; X1 has no model element.
    put({ id: 'E1', className: 'DEdge', model: 'R', start: 'VA', end: 'VB' });
    put({ id: 'X1', className: 'DVoidEdge', start: 'VB', end: 'VC' });
    return L;
}

const retransformed = (prev: Map<string, any>, curr: Map<string, any>, ids: string[]) =>
    ids.filter(id => !snapshotUnchanged(prev, curr, id));

describe('elementSnapshotsOf: a layout switch and nothing else', () => {
    it('re-transforms every vertex once, and each takes the new key\'s record', () => {
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(underA, underB, VERTICES)).toEqual(VERTICES);
        for (const id of VERTICES) {
            const { x, y } = readVertexLayout(L[id], KEY_B);
            expect({ x, y }, id).toEqual({ x: L[id].layoutByViewpoint[KEY_B].x, y: L[id].layoutByViewpoint[KEY_B].y });
            expect({ x, y }, id).not.toEqual({ x: L[id].layoutByViewpoint[KEY_A].x, y: L[id].layoutByViewpoint[KEY_A].y });
        }
    });
    it('a second run under the same key re-transforms nothing, and the selector sees an equal map', () => {
        const L = fixture();
        const first = elementSnapshotsOf(L, IDS, KEY_B)!;
        const second = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(first, second, IDS)).toEqual([]);
        expect(second.size).toBe(first.size);
        for (const [k, v] of second) expect(first.get(k), k).toBe(v);
    });
    it('switching back re-transforms every vertex again', () => {
        const L = fixture();
        const a = elementSnapshotsOf(L, IDS, KEY_A)!;
        const b = elementSnapshotsOf(L, IDS, KEY_B)!;
        const a2 = elementSnapshotsOf(L, IDS, KEY_A)!;
        expect(retransformed(b, a2, VERTICES)).toEqual(VERTICES);
        expect(retransformed(a, a2, IDS)).toEqual([]);
    });
    it('does not re-patch the edges', () => {
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(underA, underB, ['E1', 'X1'])).toEqual([]);
    });
    it('a vertex carried over by the anti-bounce window is re-transformed on the re-run', () => {
        // The hook keeps a skipped vertex's OLD entries in prevElementsRef (useJjomSync, "preserve
        // anti-bounced entries") and runs again after the window, under the same key.
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        const carried = new Map(underB);
        for (const k of ['VA', 'model:VA', 'ch:VA']) carried.set(k, underA.get(k));
        const rerun = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(carried, rerun, IDS)).toEqual(['VA']);
    });
});

describe('elementSnapshotsOf: the incremental path stays as it was', () => {
    it('under one key, a write to one object re-transforms that vertex only', () => {
        const L = fixture();
        const before = elementSnapshotsOf(L, IDS, KEY_B)!;
        L.OA = { ...L.OA, name: 'a2' };
        const after = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(before, after, IDS)).toEqual(['VA']);
    });
    it('holds the D-object, its model element and a number per element with a model element', () => {
        const L = fixture();
        const s = elementSnapshotsOf(L, IDS, KEY_A)!;
        expect(s.get('VA')).toBe(L.VA);
        expect(s.get('model:VA')).toBe(L.OA);
        expect(typeof s.get('ch:VA')).toBe('number');
        expect(s.get('model:E1')).toBe(L.R);
        expect(typeof s.get('ch:E1')).toBe('number');
        expect(s.get('X1')).toBe(L.X1);
        expect(s.has('model:X1')).toBe(false);
        expect(s.has('ch:X1')).toBe(false);
        expect(s.size).toBe(3 * 3 + 3 + 1);
    });
    it('skips an id with no D-object, and gives null for an empty graph', () => {
        const L = fixture();
        expect(elementSnapshotsOf(L, ['VA', 'GONE'], KEY_A)!.has('GONE')).toBe(false);
        expect(elementSnapshotsOf(L, [], KEY_A)).toBeNull();
    });
});

// P-2026-11-07-0555: a vertex the key alone moved skips the transformer. `layoutKeyOnlyChange` is the
// hook's test for it, `rekeyedNode` the node it patches instead of `jjomVertexToRFNode`'s output.
const cachedNode = (L: L, id: string, key: string, type = 'objectNode') => {
    const { x, y } = readVertexLayout(L[id], key);
    return { id, type, position: { x, y }, data: { label: L[L[id].model].name } } as any;
};

describe('a key change and nothing else takes the cheap path (P-2026-11-07-0555)', () => {
    it('every vertex is a key-only change, and its rekeyed node lands on the new key\'s record', () => {
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        for (const id of VERTICES) {
            expect(layoutKeyOnlyChange(underA, underB, id, KEY_A, KEY_B), id).toBe(true);
            const cached = cachedNode(L, id, KEY_A);
            const node = rekeyedNode(cached, underB.get(id), KEY_B);
            const rec = L[id].layoutByViewpoint[KEY_B];
            expect(node.position, id).toEqual({ x: rec.x, y: rec.y });
            expect(node.data, id).toBe(cached.data);
            expect(cached.position, id).not.toEqual(node.position);
        }
    });
    it('switching back is key-only too', () => {
        const L = fixture();
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        for (const id of VERTICES) expect(layoutKeyOnlyChange(underB, underA, id, KEY_B, KEY_A), id).toBe(true);
    });
    it('a key change together with a content change still re-transforms that vertex', () => {
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        L.OA = { ...L.OA, name: 'a2' };
        L.OB = { ...L.OB, features: ['F'] };
        L.F = { id: 'F', className: 'DValue', instanceof: 'AT', values: ['x'], father: 'OB' };
        L.VC = { ...L.VC, x: 7 };
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(underA, underB, VERTICES)).toEqual(VERTICES);
        expect(VERTICES.filter(id => layoutKeyOnlyChange(underA, underB, id, KEY_A, KEY_B))).toEqual([]);
    });
    it('a change of the hash alone, the elements unchanged, is not key-only', () => {
        // A child of the model element renamed: VA and OA are the same objects, only ch: moves.
        const L = fixture();
        L.OA = { ...L.OA, features: ['F'] };
        L.F = { id: 'F', className: 'DValue', instanceof: 'AT', values: ['x'], father: 'OA' };
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        L.F = { ...L.F, values: ['y'] };
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(underB.get('VA')).toBe(underA.get('VA'));
        expect(underB.get('model:VA')).toBe(underA.get('model:VA'));
        expect(layoutKeyOnlyChange(underA, underB, 'VA', KEY_A, KEY_B)).toBe(false);
        expect(layoutKeyOnlyChange(underA, underB, 'VB', KEY_A, KEY_B)).toBe(true);
    });
    it('same-key runs re-transform nothing and take no cheap path', () => {
        const L = fixture();
        const first = elementSnapshotsOf(L, IDS, KEY_B)!;
        const second = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(first, second, IDS)).toEqual([]);
        expect(IDS.filter(id => layoutKeyOnlyChange(first, second, id, KEY_B, KEY_B))).toEqual([]);
        L.OA = { ...L.OA, name: 'a2' };
        const third = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(retransformed(second, third, IDS)).toEqual(['VA']);
        expect(layoutKeyOnlyChange(second, third, 'VA', KEY_B, KEY_B)).toBe(false);
    });
    it('a vertex carried over by the anti-bounce window takes the full transform on the re-run', () => {
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        const carried = new Map(underB);
        for (const k of ['VA', 'model:VA', 'ch:VA']) carried.set(k, underA.get(k));
        // Re-run under the key of the last run.
        const rerun = elementSnapshotsOf(L, IDS, KEY_B)!;
        expect(layoutKeyOnlyChange(carried, rerun, 'VA', KEY_B, KEY_B)).toBe(false);
        // A further switch inside the window: the carried number holds A, the last run was B.
        const KEY_C = 'Pointer_VP_C';
        const underC = elementSnapshotsOf(L, IDS, KEY_C)!;
        expect(layoutKeyOnlyChange(carried, underC, 'VA', KEY_B, KEY_C)).toBe(false);
        expect(layoutKeyOnlyChange(carried, underC, 'VB', KEY_B, KEY_C)).toBe(true);
    });
    it('an edge, an element without a model element, or an id missing on either side is never key-only', () => {
        const L = fixture();
        const underA = elementSnapshotsOf(L, IDS, KEY_A)!;
        const underB = elementSnapshotsOf(L, IDS, KEY_B)!;
        for (const id of ['E1', 'X1', 'GONE']) expect(layoutKeyOnlyChange(underA, underB, id, KEY_A, KEY_B), id).toBe(false);
        expect(layoutKeyOnlyChange(new Map(), underB, 'VA', KEY_A, KEY_B)).toBe(false);
    });
});

describe('rekeyedNode: the geometry jjomVertexToRFNode reads under a key, on the cached node', () => {
    const seed = { x: 1, y: 2, w: 50, h: 40, isResized: false };
    const v = (records: Record<string, any>) => ({ id: 'V', className: 'DVertex', model: 'O', ...seed, layoutByViewpoint: records });
    it('a resized record gives top-level width and height; an auto-sized one drops them', () => {
        const vertex = v({ [KEY_A]: { x: 10, y: 20, w: 300, h: 200, isResized: true }, [KEY_B]: { x: 30, y: 40, w: 300, h: 200, isResized: false } });
        const cached = { id: 'V', type: 'classNode', position: { x: 0, y: 0 }, data: {} } as any;
        const a = rekeyedNode(cached, vertex, KEY_A);
        expect([a.position, a.width, a.height]).toEqual([{ x: 10, y: 20 }, 300, 200]);
        const b = rekeyedNode(a, vertex, KEY_B);
        expect(b.position).toEqual({ x: 30, y: 40 });
        expect('width' in b || 'height' in b).toBe(false);
    });
    it('a key with no record reads the seed, as a whole record', () => {
        const vertex = v({ [KEY_A]: { x: 10, y: 20, w: 300, h: 200, isResized: true } });
        const cached = { id: 'V', type: 'enumNode', position: { x: 10, y: 20 }, width: 300, height: 200, data: {} } as any;
        const b = rekeyedNode(cached, vertex, KEY_B);
        expect(b.position).toEqual({ x: 1, y: 2 });
        expect('width' in b || 'height' in b).toBe(false);
    });
    it('a package node takes its size in style, with the transformer\'s defaults', () => {
        const vertex = v({ [KEY_A]: { x: 10, y: 20, w: 640, h: 480, isResized: true }, [KEY_B]: { x: 5, y: 6 } });
        const cached = { id: 'V', type: 'packageNode', position: { x: 0, y: 0 }, style: { zIndex: -1, width: 400, height: 300 }, data: {} } as any;
        expect(rekeyedNode(cached, vertex, KEY_A).style).toEqual({ zIndex: -1, width: 640, height: 480 });
        expect(rekeyedNode(cached, vertex, KEY_B).style).toEqual({ zIndex: -1, width: 400, height: 300 });
        expect('width' in rekeyedNode(cached, vertex, KEY_A)).toBe(false);
    });
    it('non-numeric coordinates fall back to 0, and the cached node is not mutated', () => {
        const vertex = v({ [KEY_A]: { x: undefined, y: 'n', w: 1, h: 1, isResized: false } });
        const cached = { id: 'V', type: 'objectNode', position: { x: 9, y: 9 }, width: 5, height: 5, data: { k: 1 } } as any;
        const snapshot = JSON.stringify(cached);
        const n = rekeyedNode(cached, vertex, KEY_A);
        expect(n.position).toEqual({ x: 0, y: 0 });
        expect(n).not.toBe(cached);
        expect(n.id).toBe('V');
        expect(n.type).toBe('objectNode');
        expect(JSON.stringify(cached)).toBe(snapshot);
    });
});
