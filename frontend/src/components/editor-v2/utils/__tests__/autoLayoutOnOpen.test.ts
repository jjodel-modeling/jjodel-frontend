import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldAutoLayoutOnOpen, AUTO_LAYOUT_ON_OPEN_CAP } from '../autoLayoutOnOpen';

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

describe('shouldAutoLayoutOnOpen: the size cap (P-2026-11-04-0926)', () => {
    // b10_8 shape: 2,559 nodes, 2,558 reference edges, 153 s of ELK in the main thread
    // (docs/discovery/discovery_2026-11-04_elk_open_freeze.md F2).
    it('lays out at the cap: 500 nodes and 500 edges', () => {
        expect(AUTO_LAYOUT_ON_OPEN_CAP).toBe(500);
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3), { nodes: 500, edges: 500 })).toBe(true);
    });

    it('skips above the cap on nodes, even with no edge in the canvas yet', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3), { nodes: 501, edges: 0 })).toBe(false);
        expect(shouldAutoLayoutOnOpen(true, null, {}, { nodes: 2559, edges: 0 })).toBe(false);
    });

    it('skips above the cap on edges', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3), { nodes: 300, edges: 501 })).toBe(false);
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3), { nodes: 2559, edges: 2558 })).toBe(false);
    });

    it('without a size the rule is the record rule alone', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', lookup(3))).toBe(true);
    });

    describe('the console', () => {
        let info: ReturnType<typeof vi.spyOn>;
        beforeEach(() => { info = vi.spyOn(console, 'info').mockImplementation(() => {}); });
        afterEach(() => { info.mockRestore(); });

        it('says once why the layout was skipped, with the counts and the cap', () => {
            shouldAutoLayoutOnOpen(true, 'g', lookup(3), { nodes: 2559, edges: 2558 });
            expect(info).toHaveBeenCalledTimes(1);
            const msg = String(info.mock.calls[0].join(' '));
            expect(msg).toContain('2559 nodes');
            expect(msg).toContain('2558 edges');
            expect(msg).toContain('500');
        });

        it('says nothing when the layout runs, or when another rule already skipped it', () => {
            shouldAutoLayoutOnOpen(true, 'g', lookup(3), { nodes: 500, edges: 500 });
            shouldAutoLayoutOnOpen(false, 'g', lookup(3), { nodes: 2559, edges: 2558 });
            shouldAutoLayoutOnOpen(true, 'g', lookup(3, { v1: { __abstract__: REC } }), { nodes: 2559, edges: 2558 });
            expect(info).not.toHaveBeenCalled();
        });
    });
});

describe('shouldAutoLayoutOnOpen: the cap counts the objects of the graph\'s model', () => {
    /** Graph `g` over `n` vertices, its model `m` holding `objects` object ids. */
    function withModel(n: number, objects: number): Record<string, unknown> {
        const L = lookup(n);
        (L.g as any).model = 'm';
        L.m = { id: 'm', className: 'DModel', objects: Array.from({ length: objects }, (_, i) => `o${i}`) };
        return L;
    }
    let info: ReturnType<typeof vi.spyOn>;
    beforeEach(() => { info = vi.spyOn(console, 'info').mockImplementation(() => {}); });
    afterEach(() => { info.mockRestore(); });

    // Measured by the P-2026-11-04-0926 probe on b10_8: at the decision the canvas held 1 node and no edge,
    // while DModel.objects already held all 2,559 objects (they exist before the output tab opens).
    it('skips the b10_8 open: 1 node and 0 edges in the canvas, 2,559 objects in the model', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', withModel(1, 2559), { nodes: 1, edges: 0 })).toBe(false);
        expect(String(info.mock.calls[0]?.join(' '))).toContain('2559 nodes');
    });

    it('skips on the model alone, without a canvas size', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', withModel(1, 501))).toBe(false);
    });

    it('lays out at the cap: 500 objects', () => {
        expect(shouldAutoLayoutOnOpen(true, 'g', withModel(1, 500), { nodes: 1, edges: 0 })).toBe(true);
    });

    it('a graph whose model has no objects array (a metamodel) falls back on the canvas size', () => {
        const L = lookup(2); (L.g as any).model = 'mm'; L.mm = { id: 'mm', className: 'DModel', packages: ['p'] };
        expect(shouldAutoLayoutOnOpen(true, 'g', L, { nodes: 2, edges: 1 })).toBe(true);
        expect(shouldAutoLayoutOnOpen(true, 'g', L, { nodes: 501, edges: 1 })).toBe(false);
    });
});
