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
import { AMBIGUOUS_INSTANCES_KEY } from '../evaluator/context';

const ambigMap = (entries: [string, { count: number; sampleClass: string | null }][]) =>
    ({ [AMBIGUOUS_INSTANCES_KEY]: new Map(entries) } as any);

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
