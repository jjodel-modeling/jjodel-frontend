import { describe, it, expect } from 'vitest';
import { shouldAutoLayoutOnOpen } from '../autoLayoutOnOpen';

const REC = { x: 781, y: 1010, w: 200, h: 120, isResized: false };

/** A v2-flow graph `g` over vertices `v1..vn`; `records` maps a vertex id to its layoutByViewpoint. */
function lookup(n: number, records: Record<string, unknown> = {}, extra: Record<string, unknown> = {}): Record<string, unknown> {
    const L: Record<string, unknown> = {};
    const ids: string[] = [];
    for (let i = 1; i <= n; i++) {
        const id = `v${i}`;
        ids.push(id);
        L[id] = { id, className: 'DVertex', model: `o${i}`, x: 50, y: 50, w: 200, h: 120, ...(id in records ? { layoutByViewpoint: records[id] } : {}) };
    }
    L.g = { id: 'g', className: 'DGraph', graphStyle: 'v2-flow', subElements: ids };
    return { ...L, ...extra };
}

describe('shouldAutoLayoutOnOpen', () => {
    it('an open that created nothing never lays out', () => {
        expect(shouldAutoLayoutOnOpen(false, 'g', lookup(3))).toBe(false);
        expect(shouldAutoLayoutOnOpen(false, null, {})).toBe(false);
    });

    it('a first import lays out: the graph did not exist (E1)', () => {
        expect(shouldAutoLayoutOnOpen(true, null, {})).toBe(true);
        expect(shouldAutoLayoutOnOpen(true, undefined, {})).toBe(true);
        expect(shouldAutoLayoutOnOpen(true, 'g', {})).toBe(true);
    });

    it('a transformation output lays out: vertices with a birth position and no record', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(10))).toBe(true);
    });

    it('one record on one vertex, under the abstract-syntax key, keeps the whole graph where it is (E3b)', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(10, { v7: { __abstract__: REC } }))).toBe(false);
    });

    it('a record under a viewpoint key counts as well', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(4, { v1: { Pointer_VP_1: REC } }))).toBe(false);
    });

    it('an empty dictionary, or a key left without a record, is not a record', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3, { v1: {}, v2: { k: null }, v3: { k: undefined } }))).toBe(true);
    });

    it('a record on a vertex of another graph does not count', () => {
        const other = { w1: { id: 'w1', className: 'DVertex', layoutByViewpoint: { __abstract__: REC } }, g2: { id: 'g2', subElements: ['w1'] } };
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3, {}, other))).toBe(true);
        expect(shouldAutoLayoutOnOpen(true, 'g2', lookup(3, {}, other))).toBe(false);
    });

    it('a record on a vertex nested in a container vertex counts', () => {
        const L = lookup(2, {}, { n1: { id: 'n1', className: 'DVertex', layoutByViewpoint: { __abstract__: REC } } });
        (L.v2 as any).subElements = ['n1'];
        expect(shouldAutoLayoutOnOpen(true, 'g', L)).toBe(false);
    });

    it('dangling and cyclic subElements terminate', () => {
        const L = lookup(2, {}, { c: { id: 'c', subElements: ['g', 'missing', 42] } });
        (L.g as any).subElements = [...(L.g as any).subElements, 'c', 'missing'];
        expect(shouldAutoLayoutOnOpen(true, 'g', L)).toBe(true);
    });
});
