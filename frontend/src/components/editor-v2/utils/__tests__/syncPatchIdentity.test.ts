import { describe, it, expect } from 'vitest';
import type { Edge } from '@xyflow/react';
import { samePlainData, mergeSyncedEdge } from '../syncPatchIdentity';

// ---------------------------------------------------------------------------
// samePlainData — structural equality over plain data, conservative elsewhere
// (P-2026-10-02-1450, T9: a sync patch equal in content must keep identity)
// ---------------------------------------------------------------------------

/** The node data a class with one reference gets from the transformer (jjomTransformers.ts:127). */
const classData = () => ({
    label: 'A',
    isAbstract: false,
    isSingleton: false,
    attributes: [],
    references: [{
        id: 'ref_r', name: 'r', kind: 'association', targetClassId: 'cls_B',
        lowerBound: 0, upperBound: -1, containment: false, opposite: undefined,
        type: { id: 'cls_B', name: 'B' },
    }],
    operations: undefined,
});

describe('samePlainData', () => {
    it('S1 — the same object is equal to itself', () => {
        const d = classData();
        expect(samePlainData(d, d)).toBe(true);
    });

    it('S2 — two transformer outputs equal in content are equal, three levels down (references[i].type)', () => {
        expect(samePlainData(classData(), classData())).toBe(true);
    });

    it('S3 — a leaf that differs three levels down is a difference', () => {
        const b = classData();
        b.references[0].type.name = 'C';
        expect(samePlainData(classData(), b)).toBe(false);
    });

    it('S4 — arrays of different length differ even when one is a prefix of the other', () => {
        expect(samePlainData([1, 2], [1, 2, 3])).toBe(false);
        expect(samePlainData([1, 2, 3], [1, 2])).toBe(false);
    });

    it('S5 — same key count, different key names, both undefined: a difference', () => {
        expect(samePlainData({ a: 1, b: undefined }, { a: 1, c: undefined })).toBe(false);
    });

    it('S6 — a key present with undefined is not the same as a key absent (conservative)', () => {
        expect(samePlainData({ a: 1, b: undefined }, { a: 1 })).toBe(false);
        expect(samePlainData({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    });

    it('S7 — null and undefined are different values', () => {
        expect(samePlainData({ a: null }, { a: undefined })).toBe(false);
        expect(samePlainData(null, undefined)).toBe(false);
        expect(samePlainData(null, null)).toBe(true);
        expect(samePlainData(null, {})).toBe(false);
    });

    it('S8 — class instances with equal fields compare by identity only', () => {
        class P { constructor(public x: number) {} }
        const p = new P(1);
        expect(samePlainData(new P(1), new P(1))).toBe(false);
        expect(samePlainData({ v: p }, { v: p })).toBe(true);
        expect(samePlainData({ v: new P(1) }, { v: new P(1) })).toBe(false);
    });

    it('S9 — a Map is not plain data: identity only', () => {
        expect(samePlainData({ m: new Map([[1, 1]]) }, { m: new Map([[1, 1]]) })).toBe(false);
    });

    it('S10 — functions compare by identity', () => {
        const f = () => 1;
        expect(samePlainData({ f }, { f })).toBe(true);
        expect(samePlainData({ f }, { f: () => 1 })).toBe(false);
    });

    it('S11 — an array and an object with the same indices differ', () => {
        expect(samePlainData(['x'], { 0: 'x', length: 1 })).toBe(false);
        expect(samePlainData({ 0: 'x', length: 1 }, ['x'])).toBe(false);
    });

    it('S12 — objects without a prototype are plain data', () => {
        const a = Object.assign(Object.create(null), { k: { v: 1 } });
        const b = Object.assign(Object.create(null), { k: { v: 1 } });
        expect(samePlainData(a, b)).toBe(true);
    });

    it('S13 — beyond the depth bound two equal structures count as different (conservative)', () => {
        const deep = (n: number): any => (n === 0 ? { leaf: 1 } : { next: deep(n - 1) });
        expect(samePlainData(deep(4), deep(4))).toBe(true);
        expect(samePlainData(deep(40), deep(40))).toBe(false);
    });

    it('S14 — primitives: equal values are equal, different types are not', () => {
        expect(samePlainData('a', 'a')).toBe(true);
        expect(samePlainData(1, '1')).toBe(false);
        expect(samePlainData(0, false)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// mergeSyncedEdge — the merge of useJjomSync's edge patch, keeping identity
// ---------------------------------------------------------------------------

/** A reference edge as jjomEdgeToRFEdge builds it (jjomTransformers.ts:644-674). */
const refEdge = (over: Partial<Edge> = {}, data: Record<string, any> = {}): Edge => ({
    id: 'e1', source: 'vA', target: 'vB', sourceHandle: 'right-source-0', targetHandle: 'left-target-0',
    type: 'reference', reconnectable: 'target', label: 'r',
    data: {
        reference: { id: 'ref_r', name: 'r', kind: 'association', targetClassId: 'vB', lowerBound: 0, upperBound: -1, containment: false, opposite: undefined },
        jjomRefId: 'ref_r',
        ...data,
    },
    ...over,
} as Edge);

describe('mergeSyncedEdge', () => {
    it('M1 — a patch equal in content returns the current edge itself', () => {
        const current = refEdge();
        expect(mergeSyncedEdge(current, refEdge())).toBe(current);
    });

    it('M2 — a patch with a real change returns a new edge carrying it', () => {
        const current = refEdge();
        const out = mergeSyncedEdge(current, refEdge({ label: 'renamed' }));
        expect(out).not.toBe(current);
        expect(out.label).toBe('renamed');
    });

    it('M3 — the handles of the current edge win over the incoming ones', () => {
        const current = refEdge({ sourceHandle: 'top-source-2', targetHandle: 'bottom-target-1' });
        const out = mergeSyncedEdge(current, refEdge());
        expect(out.sourceHandle).toBe('top-source-2');
        expect(out.targetHandle).toBe('bottom-target-1');
        expect(out).toBe(current);
    });

    it('M4 — local waypoints survive an incoming edge without them; incoming ones win', () => {
        const wp = [{ x: 10, y: 20 }];
        const current = refEdge({}, { waypoints: wp });
        const kept = mergeSyncedEdge(current, refEdge());
        expect((kept.data as any).waypoints).toBe(wp);
        expect(kept).toBe(current);
        const replaced = mergeSyncedEdge(current, refEdge({}, { waypoints: [{ x: 1, y: 2 }] }));
        expect((replaced.data as any).waypoints).toEqual([{ x: 1, y: 2 }]);
        expect(replaced).not.toBe(current);
    });

    it('M5 — local source and target anchors survive an incoming edge without them', () => {
        const current = refEdge({}, { sourceAnchor: { side: 'top', t: 0.25 }, targetAnchor: { side: 'left', t: 0.5 } });
        const out = mergeSyncedEdge(current, refEdge());
        expect((out.data as any).sourceAnchor).toEqual({ side: 'top', t: 0.25 });
        expect((out.data as any).targetAnchor).toEqual({ side: 'left', t: 0.5 });
        expect(out).toBe(current);
    });

    it('M6 — the jjomRefId of the current edge survives an incoming edge without it', () => {
        const current = refEdge();
        const incoming = refEdge();
        delete (incoming.data as any).jjomRefId;
        const out = mergeSyncedEdge(current, incoming);
        expect((out.data as any).jjomRefId).toBe('ref_r');
        expect(out).toBe(current);
    });

    it('M7 — an incoming association does not overwrite a current composition or aggregation', () => {
        const current = refEdge({}, { reference: { id: 'ref_r', name: 'r', kind: 'composition', targetClassId: 'vB', lowerBound: 0, upperBound: -1, containment: true, opposite: undefined } });
        const out = mergeSyncedEdge(current, refEdge());
        expect((out.data as any).reference.kind).toBe('composition');
        expect((out.data as any).reference.containment).toBe(true);
        expect(out).toBe(current);
    });

    it('M8 — the merge does not carry the canvas selection flag (EditorV2 re-applies it)', () => {
        const current = refEdge({ selected: true });
        const out = mergeSyncedEdge(current, refEdge());
        expect(out).not.toBe(current);
        expect('selected' in out).toBe(false);
    });

    it('M9 — an M1 instance edge equal in content keeps its identity', () => {
        const m1 = (): Edge => ({ id: 'e2', source: 'o1', target: 'o2', sourceHandle: 'right-source-0', targetHandle: 'left-target-0',
            type: 'instanceRef', label: 'transitions', data: { referenceName: 'transitions', referenceId: 'ref_t' } } as Edge);
        const current = m1();
        expect(mergeSyncedEdge(current, m1())).toBe(current);
    });

    it('M10 — an inheritance edge with empty data keeps its identity', () => {
        const inh = (): Edge => ({ id: 'e3', source: 'vB', target: 'vA', sourceHandle: 'top-source-0', targetHandle: 'bottom-target-0',
            type: 'inheritance', data: {} } as Edge);
        const current = inh();
        expect(mergeSyncedEdge(current, inh())).toBe(current);
    });
});
