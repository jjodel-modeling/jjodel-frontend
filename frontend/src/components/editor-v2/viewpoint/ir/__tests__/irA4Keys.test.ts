/**
 * Slice A4 (P-2026-09-30-0440, R-VP-23): the two optional end-label keys, `edge.labels.sourceEnd`
 * and `edge.labels.targetEnd`, through the compile, the validator and the edge-view pass.
 *
 * Absent keys are pinned by the C2 tests of ir.test.ts (the irHash of every fixture view and the
 * compiled key lists): those stay green, so an IR without the keys compiles to what it compiled to.
 * Here: the keys present, their vocabulary, and what irEdgeViews writes on the edge data.
 */
import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import { clearCompileCache, compileEdgeView, irHash } from '../irCompile';
import { validateIR } from '../irValidate';
import { decorateReferenceEdges, synthesizeObjectAsEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { makeDrawReadCtx } from '../irReadCtx';
import type { EdgeViewIR, TextSource } from '../irTypes';

/** A Chen line: a reference-as-edge view on Relationship's `left`, no endpoints. */
const line = (labels?: EdgeViewIR['edge']['labels']): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Relationship'], reference: 'left',
    edge: { terminations: { sourceEnd: 'none', targetEnd: 'none' }, curve: 'arc', ...(labels ? { labels } : {}) },
});
const N: TextSource = { from: 'literal', text: 'N' };

describe('edge.labels.sourceEnd / targetEnd — compile (R-VP-23)', () => {
    it('each compiles to an accessor when declared, and is absent from the compile when not', () => {
        clearCompileCache();
        const both = compileEdgeView('a4_both', line({ sourceEnd: { from: 'literal', text: '1' }, targetEnd: N }));
        expect(both.sourceEndText!(makeDrawReadCtx({}), 'x')).toBe('1');
        expect(both.targetEndText!(makeDrawReadCtx({}), 'x')).toBe('N');
        const target = compileEdgeView('a4_target', line({ targetEnd: N }));
        expect('sourceEndText' in target).toBe(false);
        expect(typeof target.targetEndText).toBe('function');
        const none = compileEdgeView('a4_none', line());
        expect('sourceEndText' in none).toBe(false);
        expect('targetEndText' in none).toBe(false);
        // The centre label is not touched by the end labels.
        expect(target.labelText).toBeNull();
    });

    it('a path source reads the slot and enters the dependency set', () => {
        clearCompileCache();
        const cv = compileEdgeView('a4_path', line({ targetEnd: { from: 'path', expr: '$card.value' } }));
        expect(cv.dependencySet).toContain('card');
        const lookup = {
            o: { id: 'o', className: 'DObject', instanceof: 'C', features: ['o.card'] },
            'o.card': { id: 'o.card', className: 'DValue', instanceof: 'C.card', values: ['N'] },
            'C.card': { id: 'C.card', className: 'DAttribute', name: 'card' },
        };
        expect(cv.targetEndText!(makeDrawReadCtx(lookup), 'o')).toBe('N');
    });

    it('an unknown source renders as absent (permissive render)', () => {
        clearCompileCache();
        const cv = compileEdgeView('a4_bad', line({ targetEnd: { from: 'formula' } as never, sourceEnd: 'N' as never }));
        expect('targetEndText' in cv).toBe(false);
        expect('sourceEndText' in cv).toBe(false);
    });

    it('round-trips as JSON and moves the irHash', () => {
        const ir = line({ targetEnd: N, style: { fontSize: 12 } });
        expect(JSON.parse(JSON.stringify(ir))).toEqual(ir);
        expect(irHash(ir)).not.toBe(irHash(line({ style: { fontSize: 12 } })));
        expect(irHash(line({ sourceEnd: N }))).not.toBe(irHash(line({ targetEnd: N })));
    });
});

describe('edge.labels.sourceEnd / targetEnd — the validator', () => {
    it('accepts the three text sources on either end, and the absent keys', () => {
        const sources: TextSource[] = [N, { from: 'path', expr: '$card.value' }, { from: 'intrinsic', prop: 'name' }];
        for (const s of sources) {
            expect(validateIR('a4_ok_t', line({ targetEnd: s })), JSON.stringify(s)).toEqual({ ok: true });
            expect(validateIR('a4_ok_s', line({ sourceEnd: s })), JSON.stringify(s)).toEqual({ ok: true });
        }
        expect(validateIR('a4_ok_none', line())).toEqual({ ok: true });
    });

    it('refuses a value that is not a text source, naming the key', () => {
        for (const [end, v] of [
            ['targetEnd', 'N'], ['targetEnd', 1], ['targetEnd', null], ['targetEnd', []], ['targetEnd', { from: 'formula', text: 'N' }], ['targetEnd', { text: 'N' }],
            ['sourceEnd', 'N'], ['sourceEnd', { from: 'literal', text: 1 }], ['sourceEnd', { from: 'path', expr: 3 }], ['sourceEnd', { from: 'intrinsic', prop: 'id' }],
        ] as const) {
            const r = validateIR('a4_bad', line({ [end]: v } as never));
            expect(r.ok, `${end} ${JSON.stringify(v)}`).toBe(false);
            expect(!r.ok && r.error, `${end} ${JSON.stringify(v)}`).toContain(`edge.labels.${end} must be a text source`);
        }
    });

    it('refuses a forbidden path through the compile', () => {
        const r = validateIR('a4_bad_path', line({ targetEnd: { from: 'path', expr: '$a?.value' } }));
        expect(r.ok).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// irEdgeViews: the resolved text on the edge data
// ---------------------------------------------------------------------------

/** A Relationship object `r` (left → e1) with a card slot, and the viewpoint holding `views`. */
function world(views: EdgeViewIR[], card: unknown[] = ['OneToMany']) {
    const lookup: Record<string, any> = {
        C_Rel: { id: 'C_Rel', className: 'DClass', name: 'Relationship', extends: [] },
        C_Ent: { id: 'C_Ent', className: 'DClass', name: 'Entity', extends: [] },
        'C_Rel.card': { id: 'C_Rel.card', className: 'DAttribute', name: 'card' },
        r: { id: 'r', className: 'DObject', instanceof: 'C_Rel', name: 'hasRole', features: ['r.card'] },
        'r.card': { id: 'r.card', className: 'DValue', instanceof: 'C_Rel.card', values: card },
        e1: { id: 'e1', className: 'DObject', instanceof: 'C_Ent', name: 'Person', features: [] },
    };
    const ids = views.map((_, i) => `V${i}`);
    views.forEach((ir, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: 'VP', ir }; });
    const index = getIRIndex({ viewpoint: 'VP', viewelements: ids, idlookup: lookup }, `a4_world_${Math.random()}`)!;
    const objByVertex = new Map([['vr', 'r'], ['ve1', 'e1']]);
    const edge: Edge = { id: 'm1', source: 'vr', target: 've1', type: 'instanceRef', data: { referenceName: 'left' } };
    return { lookup, index, objByVertex, edge };
}

describe('irEdgeViews — the end labels on the edge data', () => {
    it('a reference edge styled by a view with targetEnd carries its text; the view without it writes no key', () => {
        clearCompileCache();
        const w1 = world([line({ targetEnd: N })]);
        const [a] = decorateReferenceEdges([w1.edge], w1.objByVertex, w1.index, makeDrawReadCtx(w1.lookup), w1.lookup);
        expect((a.data as any).irTargetEndText).toBe('N');
        expect('irSourceEndText' in (a.data as any)).toBe(false);
        const w2 = world([line()]);
        const [b] = decorateReferenceEdges([w2.edge], w2.objByVertex, w2.index, makeDrawReadCtx(w2.lookup), w2.lookup);
        expect('irTargetEndText' in (b.data as any)).toBe(false);
        expect('irSourceEndText' in (b.data as any)).toBe(false);
        // Everything else is what the same view without the key writes.
        const { irTargetEndText: _t, irEdgeViewId: _i, ...restA } = a.data as any;
        const { irEdgeViewId: _j, ...restB } = b.data as any;
        expect(restA).toEqual(restB);
    });

    it('a path end label is read on the edge\'s source object; an unset slot gives the empty string', () => {
        clearCompileCache();
        const w = world([line({ sourceEnd: { from: 'path', expr: '$card.value' } })]);
        const [a] = decorateReferenceEdges([w.edge], w.objByVertex, w.index, makeDrawReadCtx(w.lookup), w.lookup);
        expect((a.data as any).irSourceEndText).toBe('OneToMany');
        const u = world([line({ sourceEnd: { from: 'path', expr: '$card.value' } })], []);
        const [b] = decorateReferenceEdges([u.edge], u.objByVertex, u.index, makeDrawReadCtx(u.lookup), u.lookup);
        expect((b.data as any).irSourceEndText).toBe('');
    });

    it('a predicate and a priority pick the end label per object (the Chen cardinality documents)', () => {
        clearCompileCache();
        const views: EdgeViewIR[] = [
            line(),
            { ...line({ targetEnd: { from: 'literal', text: '1' } }), priority: 1, predicate: { op: 'eq', left: '$card.value', right: { kind: 'string', value: 'OneToMany' } } },
            { ...line({ targetEnd: N }), priority: 1, predicate: { op: 'eq', left: '$card.value', right: { kind: 'string', value: 'ManyToMany' } } },
        ];
        const pick = (card: unknown[]) => {
            const w = world(views, card);
            const [e] = decorateReferenceEdges([w.edge], w.objByVertex, w.index, makeDrawReadCtx(w.lookup), w.lookup);
            return (e.data as any).irTargetEndText ?? null;
        };
        expect([pick(['OneToMany']), pick(['ManyToMany']), pick(['OneToOne']), pick([])]).toEqual(['1', 'N', null, null]);
    });

    it('an object-as-edge view carries its end labels on the synthetic edge too', () => {
        clearCompileCache();
        const ir: EdgeViewIR = {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Relationship'],
            edge: { source: '$left.value', target: '$right.value', labels: { sourceEnd: { from: 'literal', text: '1' }, targetEnd: N } },
        };
        const lookup: Record<string, any> = {
            C_Rel: { id: 'C_Rel', className: 'DClass', name: 'Relationship', extends: [] },
            C_Ent: { id: 'C_Ent', className: 'DClass', name: 'Entity', extends: [] },
            'C_Rel.left': { id: 'C_Rel.left', className: 'DReference', name: 'left' },
            'C_Rel.right': { id: 'C_Rel.right', className: 'DReference', name: 'right' },
            r: { id: 'r', className: 'DObject', instanceof: 'C_Rel', features: ['r.left', 'r.right'] },
            'r.left': { id: 'r.left', className: 'DValue', instanceof: 'C_Rel.left', values: ['e1'] },
            'r.right': { id: 'r.right', className: 'DValue', instanceof: 'C_Rel.right', values: ['e2'] },
            e1: { id: 'e1', className: 'DObject', instanceof: 'C_Ent', features: [] },
            e2: { id: 'e2', className: 'DObject', instanceof: 'C_Ent', features: [] },
            V0: { id: 'V0', viewpoint: 'VP', ir },
        };
        const index = getIRIndex({ viewpoint: 'VP', viewelements: ['V0'], idlookup: lookup }, 'a4_oae')!;
        const nodes = ['vr', 've1', 've2'].map((id, i) => ({ id, position: { x: i * 200, y: 0 }, data: {} }));
        const objByVertex = new Map([['vr', 'r'], ['ve1', 'e1'], ['ve2', 'e2']]);
        const vertexByObj = new Map([['r', 'vr'], ['e1', 've1'], ['e2', 've2']]);
        const out = synthesizeObjectAsEdges(nodes as any, [], objByVertex, vertexByObj, index, makeDrawReadCtx(lookup), lookup);
        const syn = out.edges.find(e => e.id === 'irobj_r')!;
        expect([(syn.data as any).irSourceEndText, (syn.data as any).irTargetEndText]).toEqual(['1', 'N']);
    });
});
