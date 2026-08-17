/**
 * Unit tests for validateIR (authoring slice-1 enabling layer, F6).
 * Pure: no store, no React — irValidate -> irCompile is joiner-free.
 */
import { describe, it, expect } from 'vitest';
import { validateIR, VALID_ROUTING_VALUES } from '../irValidate';
import { clearCompileCache } from '../irCompile';
import { defaultObjectViewIR, defaultEdgeViewIR } from '../irDefaults';
import { CONTAINER_ENDPOINT } from '../irTypes';
import type { EdgeViewIR, RowViewIR, VertexViewIR } from '../irTypes';

describe('validateIR', () => {
    it('accepts a valid IR (defaultObjectViewIR)', () => {
        clearCompileCache();
        expect(validateIR('v-ok', defaultObjectViewIR())).toEqual({ ok: true });
    });

    it('rejects a forbidden PathExpr with a non-empty error message', () => {
        clearCompileCache();
        const bad: VertexViewIR = {
            irVersion: 'ir-1.2',
            kind: 'vertex',
            metaclasses: '*',
            shape: {
                form: 'rect',
                labels: [{ position: 'top', source: { from: 'path', expr: '$a?.b' } }],
            },
        };
        const r = validateIR('v-bad', bad);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    });

    it('accepts a well-formed RowViewIR (intrinsic/literal/path template)', () => {
        clearCompileCache();
        const row: RowViewIR = {
            irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Attribute'],
            template: [
                { from: 'intrinsic', prop: 'name' },
                { from: 'literal', text: ' : ' },
                { from: 'path', expr: '$type.value' },
            ],
        };
        expect(validateIR('r-ok', row)).toEqual({ ok: true });
    });

    it('rejects a RowViewIR with an empty template', () => {
        clearCompileCache();
        const row: RowViewIR = { irVersion: 'ir-1.0', kind: 'row', metaclasses: '*', template: [] };
        const r = validateIR('r-empty', row);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    });

    it('rejects a RowViewIR whose template has a forbidden PathExpr', () => {
        clearCompileCache();
        const row: RowViewIR = {
            irVersion: 'ir-1.0', kind: 'row', metaclasses: '*',
            template: [{ from: 'path', expr: '$a?.b' }],
        };
        const r = validateIR('r-bad', row);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    });
});

describe('validateIR — edge.routing closed vocabulary (R-B9)', () => {
    /**
     * `routing` is typed as the union, but the values this rule catches come from
     * outside the type system (a Select placeholder, an import, a direct store
     * edit), so the field is written through `unknown` here too.
     */
    const edgeWithRouting = (routing: unknown): EdgeViewIR => ({
        ...defaultEdgeViewIR(),
        metaclasses: ['Transition'],
        edge: { routing } as EdgeViewIR['edge'],
    });

    it('accepts an edge with NO routing key (absent is the Manhattan default)', () => {
        clearCompileCache();
        const ir = defaultEdgeViewIR();
        expect('routing' in ir.edge).toBe(false);
        expect(validateIR('e-routing-absent', ir)).toEqual({ ok: true });
    });

    it('accepts each of the three vocabulary values', () => {
        for (const value of VALID_ROUTING_VALUES) {
            clearCompileCache();
            expect(validateIR(`e-routing-${value}`, edgeWithRouting(value))).toEqual({ ok: true });
        }
    });

    it('rejects the empty string, naming the field and the value read', () => {
        clearCompileCache();
        const r = validateIR('e-routing-empty', edgeWithRouting(''));
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.error).toContain('edge.routing');
            expect(r.error).toContain('""');
        }
    });

    it('rejects an arbitrary value, naming the field and the value read', () => {
        clearCompileCache();
        const r = validateIR('e-routing-foo', edgeWithRouting('foo'));
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.error).toContain('edge.routing');
            expect(r.error).toContain('"foo"');
        }
    });
});

describe('validateIR — edge endpoints (R-B13, first endpoint rule)', () => {
    /**
     * Endpoints are typed `PathExpr`, and the values this rule exists to catch come
     * from outside the type system (a hand-written ir, an import, a direct store
     * edit), so the pair is written through `unknown` like `routing` above.
     */
    const edgeWithEndpoints = (source: unknown, target: unknown): EdgeViewIR => ({
        ...defaultEdgeViewIR(),
        metaclasses: ['Transition'],
        edge: { source, target } as EdgeViewIR['edge'],
    });

    it('accepts the reserved container token on source, on target, and on both', () => {
        for (const [i, pair] of ([
            [CONTAINER_ENDPOINT, '$next.value'],
            ['$from.value', CONTAINER_ENDPOINT],
            [CONTAINER_ENDPOINT, CONTAINER_ENDPOINT],
        ] as const).entries()) {
            clearCompileCache();
            expect(validateIR(`e-container-${i}`, edgeWithEndpoints(pair[0], pair[1])))
                .toEqual({ ok: true });
        }
    });

    it('accepts an indexed array read (values[N]) on either end', () => {
        clearCompileCache();
        expect(validateIR('e-indexed', edgeWithEndpoints('$next.values[0]', '$prev.values[1]')))
            .toEqual({ ok: true });
    });

    it('rejects a whole-array read on the source, naming the field and the value', () => {
        clearCompileCache();
        const r = validateIR('e-src-values', edgeWithEndpoints('$next.values', '$prev.value'));
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.error).toContain('edge.source');
            expect(r.error).toContain('"$next.values"');
        }
    });

    it('rejects a whole-array read on the target', () => {
        clearCompileCache();
        const r = validateIR('e-tgt-values', edgeWithEndpoints('$prev.value', '$next.values'));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('edge.target');
    });

    it('accepts an edge with NO endpoint keys (reference-as-edge substrate)', () => {
        clearCompileCache();
        const ir = defaultEdgeViewIR();
        expect('source' in ir.edge).toBe(false);
        expect(validateIR('e-no-endpoints', ir)).toEqual({ ok: true });
    });
});
