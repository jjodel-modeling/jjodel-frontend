/**
 * jjelTriState — the shared tri-state (R-SIM-15), P-2026-09-24-1520.
 *
 * Executes `evaluateTriState` directly (P11), with a path B evaluator as
 * validation and the guards build it. Written for the three mutations of the
 * extracted logic that the validation suite does not kill (bench in the body
 * of 4bf12ebf9): an exception that is not a `JjelEvaluationError`, an
 * ambiguous name, an absent property. Each case sits beside the control that
 * shows its sentinel is live (P12).
 */

import { describe, it, expect } from 'vitest';
import { EvaluationContext, JjelEvaluationError, JjelEvaluator } from '../../jjel/evaluator';
import type { JjelValue } from '../../jjel/evaluator';
import { parseExpression } from '../../jjel/parser';
import { evaluateTriState } from '../jjelTriState';

/** Path B: the evaluator has no context of its own. */
const evaluator = new JjelEvaluator();

function tri(src: string, vars: Record<string, JjelValue> = {}) {
    const parsed = parseExpression(src);
    expect(parsed.errors).toEqual([]);
    return evaluateTriState(evaluator, parsed.expression!, new EvaluationContext(vars));
}

describe('evaluateTriState', () => {
    it('any exception is the exception entrance, not only JjelEvaluationError: a TypeError is caught', () => {
        const out = tri('[1, 2].all(3)');
        expect(out.kind).toBe('exception');
        expect(out.kind === 'exception' && out.error).toBeInstanceOf(TypeError);
        expect(out.kind === 'exception' && out.error).not.toBeInstanceOf(JjelEvaluationError);
    });

    it('control: a JjelEvaluationError is the exception entrance too', () => {
        const out = tri('x.p', { x: null });
        expect(out.kind).toBe('exception');
        expect(out.kind === 'exception' && out.error).toBeInstanceOf(JjelEvaluationError);
    });

    it('an ambiguous name is not an absence: the verdict stands', () => {
        const ambiguous = new Map([['dup', { count: 2, sampleClass: 'State' }]]);
        const vars = { __ambiguousInstances: ambiguous } as unknown as Record<string, JjelValue>;
        expect(tri('dup == 1', vars)).toEqual({ kind: 'verdict', value: false });
    });

    it('control: the ambiguous name does emit its warning, and an unknown name is an absence', () => {
        const ambiguous = new Map([['dup', { count: 2, sampleClass: 'State' }]]);
        const ctx = new EvaluationContext({ __ambiguousInstances: ambiguous } as unknown as Record<string, JjelValue>);
        const { warnings } = evaluator.evaluateWithDiagnostics(parseExpression('dup == 1').expression!, ctx);
        expect(warnings.map(w => w.kind)).toEqual(['ambiguous-instance']);
        const out = tri('unknownX == 1');
        expect(out.kind).toBe('absent');
        expect(out.kind === 'absent' && out.warning.kind).toBe('undefined-identifier');
    });

    it('an absent property is an absence, not the verdict computed on its null', () => {
        const out = tri('o.nope == null', { o: { p: 1 } });
        expect(out.kind).toBe('absent');
        expect(out.kind === 'absent' && out.warning.kind).toBe('property-not-found');
        expect(out.kind === 'absent' && out.warning.identifier).toBe('nope');
    });

    it('control: the same guard on a present property is a verdict', () => {
        expect(tri('o.p == 1', { o: { p: 1 } })).toEqual({ kind: 'verdict', value: true });
    });
});
