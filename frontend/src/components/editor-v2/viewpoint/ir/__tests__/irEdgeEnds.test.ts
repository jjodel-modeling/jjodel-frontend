/**
 * Slice E (P-2026-09-30-1810): the edge ends through the validator, the compile and the edge-view pass.
 *  - `edge.terminations.sourceEnd` / `targetEnd`: seven more values, and the Conditional form, resolved
 *    per edge instance;
 *  - `edge.labels.sourceEnd` / `targetEnd`: a text source (R-VP-23, the multiplicity) or
 *    `{ multiplicity?, role? }`.
 * Absent additions: the compiled key list and the edge data of a view without them are pinned here
 * literally, as they were before the slice (the C2 pins of ir.test.ts hold the irHash side).
 */
import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/react';
import { clearCompileCache, compileEdgeView, irHash } from '../irCompile';
import { validateIR } from '../irValidate';
import { decorateReferenceEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { makeDrawReadCtx } from '../irReadCtx';
import type { EdgeViewIR, TextSource } from '../irTypes';

const NEW_ENDS = ['filledCircle', 'bar', 'cross', 'erZeroOrOne', 'erExactlyOne', 'erZeroOrMany', 'erOneOrMany'];
const N: TextSource = { from: 'literal', text: 'N' };
const OWNER: TextSource = { from: 'literal', text: 'owner' };
/** `$upperBound.value` is -1 (many). */
const MANY = { op: 'eq', left: '$upperBound.value', right: { kind: 'number', value: -1 } } as const;
const CONDITIONAL_WHEN = { when: MANY, then: 'erZeroOrMany', else: 'erExactlyOne' };
const CONDITIONAL_RULES = { rules: [{ when: MANY, then: 'erZeroOrMany' }], default: 'erExactlyOne' };

/** A reference-as-edge view on Ref's `to`. */
const refView = (edge: Record<string, unknown> = {}): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Ref'], reference: 'to', edge: edge as EdgeViewIR['edge'],
});

describe('validateIR — the new ends, the Conditional form, the end labels', () => {
    it('accepts each new end at either end', () => {
        for (const t of NEW_ENDS) {
            clearCompileCache();
            expect(validateIR(`ee-${t}-t`, refView({ terminations: { targetEnd: t } })), t).toEqual({ ok: true });
            expect(validateIR(`ee-${t}-s`, refView({ terminations: { sourceEnd: t, targetEnd: 'none' } })), t).toEqual({ ok: true });
        }
    });

    it('accepts the two Conditional forms, on either end', () => {
        for (const c of [CONDITIONAL_WHEN, CONDITIONAL_RULES, { when: MANY, then: 'hollowCircle' }]) {
            clearCompileCache();
            expect(validateIR('ee-cond-t', refView({ terminations: { targetEnd: c } })), JSON.stringify(c)).toEqual({ ok: true });
            expect(validateIR('ee-cond-s', refView({ terminations: { sourceEnd: c } })), JSON.stringify(c)).toEqual({ ok: true });
        }
    });

    it('accepts both end-label forms: a text source (R-VP-23) and { multiplicity?, role? }', () => {
        for (const v of [N, { multiplicity: N }, { role: OWNER }, { multiplicity: N, role: { from: 'path', expr: '$name.value' } }, {}]) {
            clearCompileCache();
            expect(validateIR('ee-lab-t', refView({ labels: { targetEnd: v } })), JSON.stringify(v)).toEqual({ ok: true });
            expect(validateIR('ee-lab-s', refView({ labels: { sourceEnd: v } })), JSON.stringify(v)).toEqual({ ok: true });
        }
    });

    it('negative controls, same run: an unknown end, a Conditional with an unknown or malformed branch, a malformed end label', () => {
        const bad: [string, EdgeViewIR, string][] = [
            ['unknown end', refView({ terminations: { targetEnd: 'crowsFoot' } }), 'edge.terminations.targetEnd'],
            ['unknown then', refView({ terminations: { targetEnd: { when: MANY, then: 'crow' } } }), 'edge.terminations.targetEnd'],
            ['unknown else', refView({ terminations: { sourceEnd: { when: MANY, then: 'bar', else: 'Bar' } } }), 'edge.terminations.sourceEnd'],
            ['unknown default', refView({ terminations: { targetEnd: { rules: [{ when: MANY, then: 'bar' }], default: 'x' } } }), 'edge.terminations.targetEnd'],
            ['rules not a list', refView({ terminations: { targetEnd: { rules: 'bar' } } }), 'edge.terminations.targetEnd'],
            ['when not a predicate', refView({ terminations: { targetEnd: { when: 'yes', then: 'bar' } } }), 'edge.terminations.targetEnd'],
            ['no then', refView({ terminations: { targetEnd: { when: MANY } } }), 'edge.terminations.targetEnd'],
            ['end label, unknown key', refView({ labels: { targetEnd: { multiplicity: N, name: OWNER } } }), 'edge.labels.targetEnd'],
            ['end label, role not a text source', refView({ labels: { sourceEnd: { role: { from: 'literal', text: 3 } } } }), 'edge.labels.sourceEnd'],
            ['end label, multiplicity a string', refView({ labels: { targetEnd: { multiplicity: 'N' } } }), 'edge.labels.targetEnd'],
        ];
        for (const [name, ir, where] of bad) {
            clearCompileCache();
            const r = validateIR('ee-bad', ir);
            expect(r.ok, name).toBe(false);
            expect(!r.ok && r.error, name).toContain(where);
        }
        // The positive control of the same run: the same shapes with a known value pass.
        clearCompileCache();
        expect(validateIR('ee-good', refView({ terminations: { targetEnd: { when: MANY, then: 'bar', else: 'cross' } }, labels: { targetEnd: { multiplicity: N, role: OWNER } } }))).toEqual({ ok: true });
    });
});

describe('compileEdgeView — the absent additions compile to the shape of before', () => {
    const KEYS = ['viewId', 'ir', 'priority', 'predicate', 'dependencySet', 'crossPaths', 'reference', 'isObjectAsEdge', 'sourceExpr', 'targetExpr',
        'sourceIsContainer', 'targetIsContainer', 'lineColor', 'lineWidth', 'lineStyle', 'terminations', 'routing', 'labelText', 'labelPlacement', 'persistWaypoints'];

    it('plain ends and an R-VP-23 end label: the key list, the static terminations, no resolver, no role', () => {
        clearCompileCache();
        const plain = compileEdgeView('ee-plain', refView({ terminations: { sourceEnd: 'hollowDiamond', targetEnd: 'erOneOrMany' } }));
        expect(Object.keys(plain).sort()).toEqual([...KEYS].sort());
        expect(plain.terminations).toEqual({ sourceEnd: 'hollowDiamond', targetEnd: 'erOneOrMany' });
        const none = compileEdgeView('ee-none', refView());
        expect(none.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'openArrow' });
        const labelled = compileEdgeView('ee-lab', refView({ labels: { targetEnd: N } }));
        expect(Object.keys(labelled).sort()).toEqual([...KEYS, 'targetEndText'].sort());
    });

    it('a Conditional end: a resolver beside the static value (its else / default, else the default end)', () => {
        clearCompileCache();
        const w = compileEdgeView('ee-cw', refView({ terminations: { targetEnd: CONDITIONAL_WHEN } }));
        expect(w.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'erExactlyOne' });
        expect(typeof w.targetEndTermination).toBe('function');
        expect('sourceEndTermination' in w).toBe(false);
        expect(w.dependencySet).toContain('upperBound');
        const r = compileEdgeView('ee-cr', refView({ terminations: { sourceEnd: CONDITIONAL_RULES } }));
        expect(r.terminations).toEqual({ sourceEnd: 'erExactlyOne', targetEnd: 'openArrow' });
        const bare = compileEdgeView('ee-cb', refView({ terminations: { targetEnd: { when: MANY, then: 'bar' } } }));
        expect(bare.terminations.targetEnd).toBe('openArrow');
    });

    it('a malformed Conditional renders as the default end, never drops the view (permissive render, R-B9-bis)', () => {
        clearCompileCache();
        const cv = compileEdgeView('ee-cm', refView({ terminations: { targetEnd: { rules: 'bar' } } }));
        expect('targetEndTermination' in cv).toBe(false);
        expect(cv.terminations.targetEnd).toBe('openArrow');
    });

    it('the new fields round-trip as JSON and move the irHash', () => {
        const ir = refView({ terminations: { targetEnd: CONDITIONAL_WHEN }, labels: { targetEnd: { multiplicity: N, role: OWNER } } });
        expect(JSON.parse(JSON.stringify(ir))).toEqual(ir);
        expect(irHash(ir)).not.toBe(irHash(refView({ labels: { targetEnd: { multiplicity: N, role: OWNER } } })));
        expect(irHash(refView({ labels: { targetEnd: N } }))).not.toBe(irHash(refView({ labels: { targetEnd: { multiplicity: N } } })));
    });
});

// ---------------------------------------------------------------------------
// irEdgeViews: resolved per edge instance
// ---------------------------------------------------------------------------

/** Two Ref objects, r1 (upperBound -1) and r2 (upperBound 1), each with a `to` reference to e; the viewpoint holds `views`. */
function world(views: EdgeViewIR[]) {
    const lookup: Record<string, any> = {
        C_Ref: { id: 'C_Ref', className: 'DClass', name: 'Ref', extends: [] },
        C_E: { id: 'C_E', className: 'DClass', name: 'E', extends: [] },
        'C_Ref.upperBound': { id: 'C_Ref.upperBound', className: 'DAttribute', name: 'upperBound' },
        'C_Ref.name': { id: 'C_Ref.name', className: 'DAttribute', name: 'name' },
        r1: { id: 'r1', className: 'DObject', instanceof: 'C_Ref', name: 'items', features: ['r1.ub', 'r1.name'] },
        'r1.ub': { id: 'r1.ub', className: 'DValue', instanceof: 'C_Ref.upperBound', values: [-1] },
        'r1.name': { id: 'r1.name', className: 'DValue', instanceof: 'C_Ref.name', values: ['items'] },
        r2: { id: 'r2', className: 'DObject', instanceof: 'C_Ref', name: 'owner', features: ['r2.ub', 'r2.name'] },
        'r2.ub': { id: 'r2.ub', className: 'DValue', instanceof: 'C_Ref.upperBound', values: [1] },
        'r2.name': { id: 'r2.name', className: 'DValue', instanceof: 'C_Ref.name', values: ['owner'] },
        e: { id: 'e', className: 'DObject', instanceof: 'C_E', name: 'Target', features: [] },
    };
    const ids = views.map((_, i) => `V${i}`);
    views.forEach((ir, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: 'VP', ir }; });
    const index = getIRIndex({ viewpoint: 'VP', viewelements: ids, idlookup: lookup }, `ee_world_${Math.random()}`)!;
    const objByVertex = new Map([['v1', 'r1'], ['v2', 'r2'], ['ve', 'e']]);
    const edges: Edge[] = [
        { id: 'm1', source: 'v1', target: 've', type: 'instanceRef', data: { referenceName: 'to' } },
        { id: 'm2', source: 'v2', target: 've', type: 'instanceRef', data: { referenceName: 'to' } },
    ];
    return decorateReferenceEdges(edges, objByVertex, index, makeDrawReadCtx(lookup), lookup).map(x => x.data as Record<string, any>);
}

describe('irEdgeViews — a Conditional end resolved per edge instance', () => {
    it('erZeroOrMany where upperBound is -1, erExactlyOne otherwise, on two references of the same view', () => {
        for (const c of [CONDITIONAL_WHEN, CONDITIONAL_RULES]) {
            clearCompileCache();
            const [a, b] = world([refView({ terminations: { sourceEnd: 'none', targetEnd: c } })]);
            expect([a.irEdgeViewId, b.irEdgeViewId], JSON.stringify(c)).toEqual(['V0', 'V0']);
            expect([a.irTargetTermination, b.irTargetTermination], JSON.stringify(c)).toEqual(['erZeroOrMany', 'erExactlyOne']);
            expect([a.irSourceTermination, b.irSourceTermination]).toEqual(['none', 'none']);
        }
    });

    it('a plain end writes the same edge data it wrote before the slice', () => {
        clearCompileCache();
        const [a] = world([refView({ terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, labels: { targetEnd: N } })]);
        expect(a).toEqual({
            referenceName: 'to', irEdgeViewId: 'V0', irRoutingHint: undefined, irLabelPlacement: 'auto', irStroke: undefined,
            irStrokeWidth: undefined, irStrokeDasharray: undefined, irSourceTermination: 'none', irTargetTermination: 'openArrow',
            irLabelText: undefined, irLabelAlwaysVisible: false, irTargetEndText: 'N',
        });
    });

    it('{ multiplicity, role }: the multiplicity on the R-VP-23 key, the role on its own, each read per instance', () => {
        clearCompileCache();
        const [a, b] = world([refView({ labels: { targetEnd: { multiplicity: N, role: { from: 'path', expr: '$name.value' } }, sourceEnd: { role: OWNER } } })]);
        expect([a.irTargetEndText, a.irTargetEndRole, b.irTargetEndRole]).toEqual(['N', 'items', 'owner']);
        expect([a.irSourceEndRole, 'irSourceEndText' in a]).toEqual(['owner', false]);
    });
});
