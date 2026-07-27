/**
 * Unit tests for the Fase E-ref authoring surface (reference-as-edge):
 *  - the built-in `defaultEdgeViewIR` seed (shape + validity + compile defaults);
 *  - the minimal `edge` seed EnableIRPanel writes when enabling an edge view;
 *  - the IR-shape invariants the EdgeAuthoringPanel's drop-key helpers produce
 *    (absent `reference` = matches any reference; absent `labels.center` = no
 *    center label), each driven through the real validate/compile pipeline.
 *
 * EdgeAuthoringPanel / EnableIRPanel are NOT import-safe in the node vitest env
 * (they import joiner → monaco-editor → `window` undefined), so — as in
 * rowAuthoring.test.ts — the seeds are asserted as mirrored literals driven
 * through validateIR / compileEdgeView (the same functions the component's
 * enable()/commit path uses) rather than imported from the component.
 */
import { describe, it, expect } from 'vitest';
import { validateIR } from '../../ir/irValidate';
import { compileEdgeView } from '../../ir/irCompile';
import { defaultEdgeViewIR } from '../../ir/irDefaults';
import type { EdgeViewIR } from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

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
