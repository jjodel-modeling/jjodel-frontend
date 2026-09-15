/**
 * Stage 2 — instance-by-name resolution: evaluator-level behaviour.
 *
 * Covers the framework-free part: the reserved-key threading of the ambiguity
 * map into EvaluationContext, the pedagogical `ambiguous-instance` warning, and
 * the resolution precedence (bound key / builtin win over the ambiguity map).
 * The buildEvalContext binding logic (Parts A/B) is framework-coupled (imports
 * the joiner barrel -> `window is not defined` under the node env) and is
 * verified via the Console probes instead.
 */
import { describe, it, expect } from 'vitest';
import { jjelEvalWithDiagnostics } from '../index';
import {
    AMBIGUOUS_INSTANCES_KEY,
    AMBIGUOUS_CANDIDATES_SHOWN,
    formatAmbiguousCandidates,
} from '../evaluator/context';
import type { AmbiguousInstanceInfo } from '../evaluator/context';

const ambigMap = (entries: [string, AmbiguousInstanceInfo][]) =>
    ({ [AMBIGUOUS_INSTANCES_KEY]: new Map(entries) } as any);

const candidate = (id: string, className: string | null, path: string | null) =>
    ({ id, className, path });

describe('JjEL instance-by-name ambiguity (Stage 2)', () => {
    it('emits an ambiguous-instance warning for a recorded ambiguous name', () => {
        const { value, warnings } = jjelEvalWithDiagnostics(
            'S0',
            ambigMap([['S0', { count: 3, sampleClass: 'State' }]]),
        );
        expect(value).toBeNull();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatchObject({
            kind: 'ambiguous-instance',
            identifier: 'S0',
            count: 3,
            sampleClass: 'State',
        });
    });

    it('a bound unique name resolves to its handle with no warning', () => {
        const handle = { name: 'S0', __type: 'Object', isInitial: true } as any;
        const { value, warnings } = jjelEvalWithDiagnostics('S0', { S0: handle } as any);
        expect(value).toBe(handle);
        expect(warnings).toHaveLength(0);
    });

    it('a bound key wins over the ambiguity map (no ambiguity warning)', () => {
        const cls = { name: 'Foo', __type: 'Class' } as any;
        const { value, warnings } = jjelEvalWithDiagnostics('Foo', {
            Foo: cls,
            ...ambigMap([['Foo', { count: 2, sampleClass: 'Foo' }]]),
        } as any);
        expect(value).toBe(cls);
        expect(warnings).toHaveLength(0);
    });

    it('a builtin wins over the ambiguity map (no ambiguity warning)', () => {
        // `now` is a registered builtin; the evaluator consults builtins before
        // context vars and before the ambiguity map.
        const { warnings } = jjelEvalWithDiagnostics(
            'now()',
            ambigMap([['now', { count: 2, sampleClass: 'State' }]]),
        );
        expect(warnings.some(w => w.kind === 'ambiguous-instance')).toBe(false);
    });

    it('a genuinely unknown name still yields undefined-identifier', () => {
        const { value, warnings } = jjelEvalWithDiagnostics('Nope', ambigMap([]));
        expect(value).toBeNull();
        expect(warnings).toHaveLength(1);
        expect(warnings[0].kind).toBe('undefined-identifier');
    });

    it('the reserved ambiguity key is not exposed as a user variable', () => {
        // Reading the reserved key by name must miss (it was lifted into the
        // context field, not kept as a binding) -> undefined-identifier, not value.
        const { value, warnings } = jjelEvalWithDiagnostics(
            AMBIGUOUS_INSTANCES_KEY,
            ambigMap([['S0', { count: 2, sampleClass: 'State' }]]),
        );
        expect(value).toBeNull();
        expect(warnings[0]?.kind).toBe('undefined-identifier');
    });

    it('the warning fires from inside a forall scope (child-context propagation)', () => {
        const { warnings } = jjelEvalWithDiagnostics(
            'forall x in [1,2] : S0',
            ambigMap([['S0', { count: 2, sampleClass: 'State' }]]),
        );
        expect(warnings.some(w => w.kind === 'ambiguous-instance' && w.identifier === 'S0')).toBe(true);
    });
});

describe('JjEL ambiguity — the candidates are named (S1b micro)', () => {
    it('two cross-model homonyms: the warning carries both paths, and still binds nothing', () => {
        const { value, warnings } = jjelEvalWithDiagnostics(
            'S0',
            ambigMap([['S0', {
                count: 2,
                sampleClass: 'State',
                candidates: [
                    candidate('Pointer_a1', 'State', 'Traffic/machine/S0'),
                    candidate('Pointer_b2', 'State', 'Lift/machine/S0'),
                ],
            }]]),
        );
        // Unchanged from before the candidates existed: no binding, one warning.
        expect(value).toBeNull();
        expect(warnings).toHaveLength(1);
        const w = warnings[0] as any;
        expect(w.kind).toBe('ambiguous-instance');
        expect(w.count).toBe(2);
        expect(w.candidates).toHaveLength(2);
        expect(w.candidates.map((c: any) => c.path)).toEqual([
            'Traffic/machine/S0',
            'Lift/machine/S0',
        ]);
        expect(w.candidates.map((c: any) => c.id)).toEqual(['Pointer_a1', 'Pointer_b2']);
        // The path is what separates them here (the pool is cross-model), so the
        // copy must show both — a metaclass-only line would print 'State' twice.
        expect(formatAmbiguousCandidates(w.candidates)).toBe(
            'Traffic/machine/S0 (State), Lift/machine/S0 (State)',
        );
    });

    it('a producer that names nobody leaves the warning exactly as it was', () => {
        const { value, warnings } = jjelEvalWithDiagnostics(
            'S0',
            ambigMap([['S0', { count: 3, sampleClass: 'State' }]]),
        );
        expect(value).toBeNull();
        expect(warnings[0]).toMatchObject({
            kind: 'ambiguous-instance',
            identifier: 'S0',
            count: 3,
            sampleClass: 'State',
        });
        expect('candidates' in (warnings[0] as any)).toBe(false);
        expect(formatAmbiguousCandidates((warnings[0] as any).candidates)).toBeNull();
    });

    it('an empty candidate list is absent, not empty, on the warning', () => {
        // Negative control on the distinction the copy depends on: '[]' from the
        // producer must not become a list the reader is shown.
        const { warnings } = jjelEvalWithDiagnostics(
            'S0',
            ambigMap([['S0', { count: 2, sampleClass: null, candidates: [] }]]),
        );
        expect('candidates' in (warnings[0] as any)).toBe(false);
    });

    it('the copy names the first five and counts the rest', () => {
        const many = Array.from({ length: 8 }, (_, i) =>
            candidate(`Pointer_${i}`, 'State', `M${i}/S0`));
        expect(AMBIGUOUS_CANDIDATES_SHOWN).toBe(5);
        expect(formatAmbiguousCandidates(many)).toBe(
            'M0/S0 (State), M1/S0 (State), M2/S0 (State), M3/S0 (State), M4/S0 (State), and 3 more',
        );
        // Exactly at the cap there is nothing left to count.
        expect(formatAmbiguousCandidates(many.slice(0, 5))).toBe(
            'M0/S0 (State), M1/S0 (State), M2/S0 (State), M3/S0 (State), M4/S0 (State)',
        );
    });

    it('a candidate with no path falls back to metaclass, then to id', () => {
        expect(formatAmbiguousCandidates([candidate('Pointer_x', 'State', null)])).toBe('State');
        expect(formatAmbiguousCandidates([candidate('Pointer_x', null, null)])).toBe('Pointer_x');
    });
});
