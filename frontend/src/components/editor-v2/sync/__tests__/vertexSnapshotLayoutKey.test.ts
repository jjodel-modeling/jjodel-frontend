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
import { elementSnapshotsOf, snapshotUnchanged } from '../vertexSnapshot';
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
