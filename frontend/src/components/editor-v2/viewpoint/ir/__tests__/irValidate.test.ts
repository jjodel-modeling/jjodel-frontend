/**
 * Unit tests for validateIR (authoring slice-1 enabling layer, F6).
 * Pure: no store, no React — irValidate -> irCompile is joiner-free.
 */
import { describe, it, expect } from 'vitest';
import { validateIR, VALID_PADDING_VALUES, VALID_ROUTING_VALUES } from '../irValidate';
import { clearCompileCache, compileView, irHash } from '../irCompile';
import { defaultObjectViewIR, defaultEdgeViewIR } from '../irDefaults';
import { CONTAINER_ENDPOINT } from '../irTypes';
import type { EdgeViewIR, GraphVertexViewIR, RowViewIR, VertexViewIR } from '../irTypes';

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

describe('validateIR: shape.padding closed vocabulary (asse padding, 2026-08-25)', () => {
    /**
     * Padding is typed as the union, but the values this rule catches come from outside
     * the type system (the empty option of the shared Select, an import, a direct store
     * edit), so the field is written through `unknown` here too, like `routing`.
     */
    const vertexWithPadding = (padding: unknown): VertexViewIR => ({
        ...defaultObjectViewIR(),
        shape: { ...defaultObjectViewIR().shape, padding } as VertexViewIR['shape'],
    });

    it('accepts a vertex with NO padding key (absent is the normal default)', () => {
        clearCompileCache();
        const ir = defaultObjectViewIR();
        expect('padding' in ir.shape).toBe(false);
        expect(validateIR('v-padding-absent', ir)).toEqual({ ok: true });
    });

    it('accepts each of the three vocabulary values', () => {
        for (const value of VALID_PADDING_VALUES) {
            clearCompileCache();
            expect(validateIR(`v-padding-${value}`, vertexWithPadding(value))).toEqual({ ok: true });
        }
    });

    it('rejects a value outside the vocabulary, naming the field and the value read', () => {
        clearCompileCache();
        const r = validateIR('v-padding-huge', vertexWithPadding('huge'));
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.error).toContain('shape.padding');
            expect(r.error).toContain('"huge"');
        }
    });

    it('rejects the empty string, which is what the shared Select placeholder would write', () => {
        clearCompileCache();
        const r = validateIR('v-padding-empty', vertexWithPadding(''));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('shape.padding');
    });

    it('applies to graphVertex too, not only to vertex', () => {
        clearCompileCache();
        const outOfVocabulary: unknown = 'huge';
        const gv: GraphVertexViewIR = {
            irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['Package'],
            shape: { form: 'rect', padding: outOfVocabulary } as GraphVertexViewIR['shape'],
            containment: {},
        };
        const r = validateIR('gv-padding-huge', gv);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('shape.padding');
    });
});


/**
 * FormSpec (Slice 1a, 2026-08-26).
 *
 * The whole point of these cases is that validateIR needed NO change to accept `form`:
 * the validator is permissive towards keys it does not know, and the compile-as-validator
 * ignores what it does not read. What it is NOT permissive about is a string `op`
 * anywhere in the ir, because findUnknownPredicateOp walks the whole tree generically —
 * hence the last case, which is the trap FormSpec's doc-comment warns against.
 */
describe('validateIR — form (additive optional field)', () => {
    const withForm = (form: unknown): VertexViewIR => ({
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: { form: 'rounded', labels: [{ position: 'top', source: { from: 'intrinsic', prop: 'name' } }] },
        fieldCompartments: [{
            id: 'attributes', title: 'Identity',
            source: { from: 'attributes' },
            rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] },
        }],
        form: form as VertexViewIR['form'],
    });

    it('accepts a view with every FormSpec field populated, and a compartment title', () => {
        clearCompileCache();
        const r = validateIR('v-form-full', withForm({
            theme: 'plain',
            labelPlacement: 'above',
            widgets: { entryAction: 'textarea', timeout: 'number', kind: 'select' },
            features: { outgoing: 'list', substates: 'inline', tags: 'hidden' },
            basic: ['name', 'kind', 'outgoing'],
        }));
        expect(r).toEqual({ ok: true });
    });

    it('accepts a view with no form at all (every saved view today)', () => {
        clearCompileCache();
        const noForm: VertexViewIR = {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'], shape: { form: 'rect' },
        };
        expect(validateIR('v-no-form', noForm)).toEqual({ ok: true });
    });

    it('rejects a form carrying a string `op`, which the predicate scan reads as an operator', () => {
        clearCompileCache();
        const r = validateIR('v-form-op', withForm({ theme: 'plain', widgets: { op: 'text' }, filter: { op: 'contains' } }));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('unknown predicate operator');
    });
});

describe('compileView — form passthrough', () => {
    const view = (theme: string): VertexViewIR => ({
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: { form: 'rect' },
        form: { theme } as VertexViewIR['form'],
    });

    it('returns the authored FormSpec verbatim on formSpec, and null when absent', () => {
        clearCompileCache();
        const withIt = compileView('v-form-pass', view('card'));
        expect(withIt.formSpec).toEqual({ theme: 'card' });
        // `form` on CompiledView is the compiled SHAPE form and must be untouched by this.
        expect(typeof withIt.form).toBe('function');

        clearCompileCache();
        const without = compileView('v-form-none', {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'], shape: { form: 'rect' },
        });
        expect(without.formSpec).toBeNull();
    });

    it('does not add the form to the dependency set or to the cross paths', () => {
        clearCompileCache();
        const c = compileView('v-form-deps', view('plain'));
        expect(c.dependencySet).toEqual([]);
        expect(c.crossPaths).toEqual([]);
        expect(c.channels).toBeUndefined();
    });

    it('changes irHash, so a form edit cannot return a stale compile from the cache', () => {
        const a = irHash(view('plain'));
        const b = irHash(view('card'));
        expect(a).not.toBe(b);

        // And the cache keyed on it hands back the new value for the same view id.
        clearCompileCache();
        expect(compileView('v-form-cache', view('plain')).formSpec).toEqual({ theme: 'plain' });
        expect(compileView('v-form-cache', view('card')).formSpec).toEqual({ theme: 'card' });
    });
});
