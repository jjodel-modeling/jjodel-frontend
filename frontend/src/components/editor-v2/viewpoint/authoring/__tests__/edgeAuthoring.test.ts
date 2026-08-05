/**
 * Unit tests for the edge authoring surface, both substrates:
 *  - E-ref (reference-as-edge): the built-in `defaultEdgeViewIR` seed (shape +
 *    validity + compile defaults); the minimal `edge` seed EnableIRPanel writes;
 *    the IR-shape invariants the drop-key helpers produce (absent `reference` =
 *    matches any reference; absent `labels.center` = no center label);
 *  - E-obj (object-as-edge): the endpoint pair as the sole discriminant of the
 *    nature, the atomic replacement of both endpoints, the non-destructive editing
 *    of a committed pair, the drop reserved to the explicit nature switch, the
 *    inert wildcard, the endpoint guard, and the object round-trip.
 *
 * EdgeAuthoringPanel / EnableIRPanel are NOT import-safe in the node vitest env
 * (they import joiner → monaco-editor → `window` undefined), so — as in
 * rowAuthoring.test.ts — the seeds are asserted as mirrored literals driven
 * through validateIR / compileEdgeView (the same functions the component's
 * enable()/commit path uses) rather than imported from the component.
 *
 * The panel's endpoint decisions are NOT mirrored: they live in ir/edgeEndpoints,
 * a pure module, and are imported below. What is asserted here is their effect on
 * the ir through the real validate/compile/index pipeline; the functions' own unit
 * behaviour is covered in ir/__tests__/edgeEndpoints.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { validateIR } from '../../ir/irValidate';
import { compileEdgeView } from '../../ir/irCompile';
import { getIRIndex } from '../../ir/irResolveCore';
import { defaultEdgeViewIR } from '../../ir/irDefaults';
import { isUsableEndpointExpr, nextEdgeForEndpoints, dropEndpoints } from '../../ir/edgeEndpoints';
import type { EdgeViewIR } from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Minimal DState slice holding one IR view of a dedicated viewpoint. */
function stateWith(viewId: string, ir: EdgeViewIR) {
    return {
        viewpoint: 'VP_EOBJ',
        viewelements: [viewId],
        idlookup: { [viewId]: { id: viewId, viewpoint: 'VP_EOBJ', ir } } as Record<string, any>,
    };
}

describe('defaultEdgeViewIR — seed shape + validity', () => {
    it('has the exact documented shape (ratifica R-8)', () => {
        expect(defaultEdgeViewIR()).toEqual({
            irVersion: 'ir-1.2',
            kind: 'edge',
            metaclasses: [],
            edge: {},
        });
    });

    it('carries no reference key (matches any reference)', () => {
        expect('reference' in defaultEdgeViewIR()).toBe(false);
    });

    it('validates and compiles with the compile-time defaults', () => {
        const ir = defaultEdgeViewIR();
        expect(validateIR('seed-edge', ir)).toEqual({ ok: true });
        const c = compileEdgeView('seed-edge', ir);
        expect(c.reference).toBe(null);
        expect(c.isObjectAsEdge).toBe(false);
        expect(c.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'openArrow' });
        expect(c.labelText).toBe(null);
        expect(c.lineColor).toBe(null);
        expect(c.lineWidth).toBe(null);
        expect(c.lineStyle).toBe(null);
    });
});

describe('EnableIRPanel — minimal edge seed (mirrored literal)', () => {
    // Mirrors EnableIRPanel.enable() `kind === 'edge'` branch with a resolved source
    // metaclass. The component cannot be imported in node; the literal is asserted
    // here and driven through the real validate/compile pipeline enable() uses.
    const EDGE_SEED: EdgeViewIR = {
        ...defaultEdgeViewIR(),
        metaclasses: ['State'],
    };

    it('has the documented shape (default + resolved source metaclass)', () => {
        expect(EDGE_SEED).toEqual({
            irVersion: 'ir-1.2',
            kind: 'edge',
            metaclasses: ['State'],
            edge: {},
        });
    });

    it('validates and compiles', () => {
        expect(validateIR('seed-edge-mc', EDGE_SEED)).toEqual({ ok: true });
        expect(compileEdgeView('seed-edge-mc', EDGE_SEED).reference).toBe(null);
    });
});

describe('EdgeAuthoringPanel — reference matching (drop-key semantics)', () => {
    it('a named reference compiles to that reference (and gains the +0.5 tier)', () => {
        const ir: EdgeViewIR = { ...defaultEdgeViewIR(), metaclasses: ['State'], reference: 'target' };
        expect(validateIR('ref-named', ir)).toEqual({ ok: true });
        expect(compileEdgeView('ref-named', ir).reference).toBe('target');
    });

    it('no reference key (any reference) compiles to reference null', () => {
        const ir: EdgeViewIR = { ...defaultEdgeViewIR(), metaclasses: ['State'] };
        expect('reference' in ir).toBe(false);
        expect(compileEdgeView('ref-any', ir).reference).toBe(null);
    });
});

describe('EdgeAuthoringPanel — center label (drop-key semantics)', () => {
    it('a center label compiles to a live label accessor', () => {
        const ir: EdgeViewIR = {
            ...defaultEdgeViewIR(),
            metaclasses: ['State'],
            edge: { labels: { center: { from: 'literal', text: 'to' } } },
        };
        expect(validateIR('label-on', ir)).toEqual({ ok: true });
        expect(typeof compileEdgeView('label-on', ir).labelText).toBe('function');
    });

    it('no labels key compiles to labelText null (edge keeps its default label)', () => {
        const ir: EdgeViewIR = { ...defaultEdgeViewIR(), metaclasses: ['State'], edge: {} };
        expect('labels' in ir.edge).toBe(false);
        expect(compileEdgeView('label-off', ir).labelText).toBe(null);
    });
});

// ---- E-obj: object-as-edge ------------------------------------------------

/** Mirrors the ir the panel commits once BOTH endpoints are usable. */
const OBJECT_SEED: EdgeViewIR = {
    ...defaultEdgeViewIR(),
    metaclasses: ['Transition'],
    edge: { source: '$src.value', target: '$tgt.value' },
};

describe('EdgeAuthoringPanel — object-as-edge seed', () => {
    it('validates and compiles as object-as-edge', () => {
        expect(validateIR('obj-seed', OBJECT_SEED)).toEqual({ ok: true });
        const c = compileEdgeView('obj-seed', OBJECT_SEED);
        expect(c.isObjectAsEdge).toBe(true);
        expect(typeof c.sourceExpr).toBe('function');
        expect(typeof c.targetExpr).toBe('function');
        expect(c.reference).toBe(null);
    });
});

describe('EdgeAuthoringPanel — the endpoint pair is the discriminant (atomic write)', () => {
    it('a source without a target is NOT object-as-edge', () => {
        const ir: EdgeViewIR = { ...OBJECT_SEED, edge: { source: '$src.value' } };
        expect(validateIR('obj-src-only', ir)).toEqual({ ok: true });
        expect(compileEdgeView('obj-src-only', ir).isObjectAsEdge).toBe(false);
    });

    it('a target without a source is NOT object-as-edge', () => {
        const ir: EdgeViewIR = { ...OBJECT_SEED, edge: { target: '$tgt.value' } };
        expect(validateIR('obj-tgt-only', ir)).toEqual({ ok: true });
        expect(compileEdgeView('obj-tgt-only', ir).isObjectAsEdge).toBe(false);
    });

    it('the drop leaves NEITHER key in the ir (both keys go together)', () => {
        // Mirrors applyEndpoints' incomplete branch: drop of the keys, never empty strings.
        const edge = { ...OBJECT_SEED.edge };
        delete edge.source;
        delete edge.target;
        const dropped: EdgeViewIR = { ...OBJECT_SEED, edge };
        expect('source' in dropped.edge).toBe(false);
        expect('target' in dropped.edge).toBe(false);
        expect(validateIR('obj-dropped', dropped)).toEqual({ ok: true });
        expect(compileEdgeView('obj-dropped', dropped).isObjectAsEdge).toBe(false);
    });

    it('the endpoint guard accepts .value and values[N], refuses a whole array', () => {
        expect(isUsableEndpointExpr('$src.value')).toBe(true);
        expect(isUsableEndpointExpr('$src.values[0]')).toBe(true);
        expect(isUsableEndpointExpr('$src.values[12]')).toBe(true);
        expect(isUsableEndpointExpr('$src.values')).toBe(false);
        expect(isUsableEndpointExpr('')).toBe(false);
        expect(isUsableEndpointExpr(undefined)).toBe(false);
    });
});

describe('EdgeAuthoringPanel — editing an endpoint does not destroy the committed pair', () => {
    it('emptying the source leaves BOTH committed endpoints in the ir, and commits nothing', () => {
        const before = clone(OBJECT_SEED);
        expect(nextEdgeForEndpoints(before.edge, '', '$tgt.value')).toBe(null);
        // The ir is untouched: still object-as-edge, still byte-identical.
        expect(before).toEqual(OBJECT_SEED);
        expect(compileEdgeView('obj-keep-empty', before).isObjectAsEdge).toBe(true);
    });

    it('an unusable source (whole array) leaves the committed pair alone too', () => {
        const before = clone(OBJECT_SEED);
        expect(nextEdgeForEndpoints(before.edge, '$src.values', '$tgt.value')).toBe(null);
        expect(before).toEqual(OBJECT_SEED);
        expect(compileEdgeView('obj-keep-array', before).isObjectAsEdge).toBe(true);
    });

    it('with no committed pair an incomplete input still writes nothing (unchanged)', () => {
        const ir: EdgeViewIR = { ...defaultEdgeViewIR(), metaclasses: ['Transition'] };
        expect(nextEdgeForEndpoints(ir.edge, '$src.value', '')).toBe(null);
        expect('source' in ir.edge).toBe(false);
        expect('target' in ir.edge).toBe(false);
        expect(compileEdgeView('obj-none-partial', ir).isObjectAsEdge).toBe(false);
    });

    it('a complete new pair replaces the committed one atomically, other fields intact', () => {
        const before: EdgeViewIR = {
            ...OBJECT_SEED,
            edge: { ...OBJECT_SEED.edge, routing: 'orthogonal', persistWaypoints: false },
        };
        const edge = nextEdgeForEndpoints(before.edge, '$from.value', '$to.values[0]')!;
        expect(edge).not.toBe(null);
        expect(edge.source).toBe('$from.value');
        expect(edge.target).toBe('$to.values[0]');
        // Untouched fields survive the replacement.
        expect(edge.routing).toBe('orthogonal');
        expect(edge.persistWaypoints).toBe(false);
        const after: EdgeViewIR = { ...before, edge };
        expect(validateIR('obj-replaced', after)).toEqual({ ok: true });
        expect(compileEdgeView('obj-replaced', after).isObjectAsEdge).toBe(true);
    });

    it('retyping the same pair does not move the ir (no commit, no recompile)', () => {
        expect(nextEdgeForEndpoints(OBJECT_SEED.edge, '$src.value', '$tgt.value')).toBe(null);
    });

    it('the nature switch to reference is what drops both endpoints', () => {
        const dropped: EdgeViewIR = { ...OBJECT_SEED, edge: dropEndpoints(OBJECT_SEED.edge) };
        expect('source' in dropped.edge).toBe(false);
        expect('target' in dropped.edge).toBe(false);
        expect(validateIR('obj-nature-reference', dropped)).toEqual({ ok: true });
        expect(compileEdgeView('obj-nature-reference', dropped).isObjectAsEdge).toBe(false);
    });
});

describe('EdgeAuthoringPanel — wildcard is inert on the object substrate', () => {
    it('metaclasses "*" with both endpoints lands in NO bucket', () => {
        const ir: EdgeViewIR = { ...OBJECT_SEED, metaclasses: '*' };
        const index = getIRIndex(stateWith('V_obj_wild', ir), 'sig_eobj_wildcard')!;
        expect(index.objectAsEdgeByMetaclass.size).toBe(0);
        expect(index.edgeByMetaclass.size).toBe(0);
        expect(index.edgeWildcard.length).toBe(0);
        // Still counted as a view of the viewpoint — it simply applies to nothing.
        expect(index.viewIds).toEqual(['V_obj_wild']);
    });

    it('a named metaclass lands in the object bucket, never in the reference one', () => {
        const index = getIRIndex(stateWith('V_obj_named', OBJECT_SEED), 'sig_eobj_named')!;
        expect(index.objectAsEdgeByMetaclass.get('Transition')!.map(e => e.compiled.viewId))
            .toEqual(['V_obj_named']);
        expect(index.edgeByMetaclass.size).toBe(0);
        expect(index.edgeWildcard.length).toBe(0);
    });
});

describe('EdgeAuthoringPanel — object round-trip (draft → ir, untouched fields survive)', () => {
    it('a fully-authored object ir survives clone → validate → compile with fields intact', () => {
        const ir: EdgeViewIR = {
            irVersion: 'ir-1.2',
            kind: 'edge',
            metaclasses: ['Transition'],
            priority: 2,
            edge: {
                source: '$src.value',
                target: '$tgt.values[0]',
                line: { color: '#334155', width: 1, style: 'solid' },
                terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
                labels: { center: { from: 'intrinsic', prop: 'name' } },
                // Fields the panel does not author must round-trip verbatim.
                routing: 'orthogonal',
                persistWaypoints: false,
            },
        };
        const roundTripped = clone(ir);
        expect(roundTripped).toEqual(ir);
        expect(validateIR('obj-roundtrip', roundTripped)).toEqual({ ok: true });
        const c = compileEdgeView('obj-roundtrip', roundTripped);
        expect(c.isObjectAsEdge).toBe(true);
        expect(c.priority).toBe(2);
        expect(c.routing).toBe('orthogonal');
        expect(c.persistWaypoints).toBe(false);
        expect(typeof c.labelText).toBe('function');
        expect(c.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'openArrow' });
    });
});

describe('EdgeAuthoringPanel — round-trip (draft → ir, untouched fields survive)', () => {
    it('a fully-authored edge ir survives clone → validate → compile with fields intact', () => {
        const ir: EdgeViewIR = {
            irVersion: 'ir-1.2',
            kind: 'edge',
            metaclasses: ['State'],
            reference: 'target',
            priority: 3,
            edge: {
                line: { color: '#0ea5e9', width: 2, style: 'dashed' },
                terminations: { sourceEnd: 'none', targetEnd: 'closedArrow' },
                labels: { center: { from: 'intrinsic', prop: 'name' } },
                // A field the panel does not author must round-trip verbatim.
                routing: 'orthogonal',
            },
        };
        const roundTripped = clone(ir);
        expect(roundTripped).toEqual(ir);
        expect(validateIR('roundtrip', roundTripped)).toEqual({ ok: true });
        const c = compileEdgeView('roundtrip', roundTripped);
        expect(c.reference).toBe('target');
        expect(c.priority).toBe(3);
        expect(c.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'closedArrow' });
        expect(c.routing).toBe('orthogonal');
        expect(typeof c.labelText).toBe('function');
        expect(c.lineColor).not.toBe(null);
        expect(c.lineWidth).not.toBe(null);
        expect(c.lineStyle).not.toBe(null);
    });
});
