/**
 * `and`/`or` short-circuit (SPEC.md §3 and §6.3, P-2026-11-13-1246): the right
 * operand is evaluated only when the left one does not decide, and a bit-vector
 * on the left never decides. Every input that gave a value before gives the
 * same value; the table of the cells that change is in
 * docs/discovery/discovery_2026-11-13_jjel_and_or_short_circuit.md §5.1.
 * Each test name says which break kills it.
 */

import { describe, test, expect } from 'vitest';
import { parseExpression } from '../parser';
import { EvaluationContext, JjelEvaluator } from '../evaluator';
import type { JjelValue } from '../evaluator';

function run(src: string, vars: Record<string, JjelValue> = {}): { value: JjelValue; warnings: string[] } {
    const parsed = parseExpression(src);
    if (parsed.errors.length > 0 || !parsed.expression) throw new Error(`fixture does not parse: ${src}`);
    const ctx = new EvaluationContext({ nul: null, ...vars });
    const out = new JjelEvaluator(ctx).evaluateWithDiagnostics(parsed.expression, ctx);
    return { value: out.value, warnings: out.warnings.map(w => w.identifier) };
}
const ev = (src: string, vars?: Record<string, JjelValue>) => run(src, vars).value;

describe('the left operand decides: the right one is not evaluated', () => {
    test('the guard idiom on a transition with no event is false (mutant: eager and)', () => {
        expect(ev('t.event != null and t.event.name == "e"', { t: { event: null } })).toBe(false);
    });

    test('its or twin is true (mutant: eager or)', () => {
        expect(ev('t.event == null or t.event.name == "e"', { t: { event: null } })).toBe(true);
    });

    test('a throwing right operand under a falsy left: false, null, "" (mutant: eager and)', () => {
        expect(ev('false and nul.x')).toBe(false);
        expect(ev('null and nul.x')).toBe(false);
        expect(ev('"" and nul.x')).toBe(false);
    });

    test('a throwing right operand under a truthy left: true, 1 (mutant: eager or)', () => {
        expect(ev('true or nul.x')).toBe(true);
        expect(ev('1 or nul.x')).toBe(true);
    });

    test('a bit-vector right operand that is not reached (mutant: right evaluated before the decision)', () => {
        expect(ev('false and bits(8, 1)')).toBe(false);
        expect(ev('true or bits(8, 1)')).toBe(true);
    });

    test('an absent identifier that is not reached raises no warning, as with implies (mutant: eager)', () => {
        expect(run('false and unknownX')).toEqual({ value: false, warnings: [] });
        expect(run('true or unknownX')).toEqual({ value: true, warnings: [] });
    });

    test('an absent identifier on the left still warns and still decides', () => {
        expect(run('unknownX and nul.x')).toEqual({ value: false, warnings: ['unknownX'] });
    });
});

describe('the left operand does not decide: the right one is evaluated as before', () => {
    test('a throwing right operand still throws (mutant: right never evaluated)', () => {
        expect(() => ev('true and nul.x')).toThrow(/Cannot access property 'x' of null/);
        expect(() => ev('false or nul.x')).toThrow(/Cannot access property 'x' of null/);
        expect(() => ev('1 and nul.x')).toThrow(/of null/);
        expect(() => ev('"" or nul.x')).toThrow(/of null/);
    });

    test('the result is the truthiness of the right operand, a boolean (mutant: right value returned as is)', () => {
        expect(ev('true and 1')).toBe(true);
        expect(ev('true and ""')).toBe(false);
        expect(ev('false or [1]')).toBe(true);
        expect(ev('null or []')).toBe(false);
    });

    test('an absent identifier on the right still warns', () => {
        expect(run('true and unknownX')).toEqual({ value: false, warnings: ['unknownX'] });
        expect(run('false or unknownX')).toEqual({ value: false, warnings: ['unknownX'] });
    });
});

describe('a bit-vector on the left never decides: the defect is unchanged', () => {
    test('the message names both operands (mutant: bit-vector left decides)', () => {
        expect(() => ev('bits(8, 1) and false')).toThrow(
            "'and' needs booleans, got 8-bit unsigned and boolean: a bit-vector has no truth value"
        );
        expect(() => ev('bits(8, 1) or true')).toThrow(/^'or' needs booleans, got 8-bit unsigned and boolean/);
    });

    test('the right operand is still evaluated first: its throw wins (mutant: defect thrown before the right operand)', () => {
        expect(() => ev('bits(8, 1) and nul.x')).toThrow(/Cannot access property 'x' of null/);
    });

    test('a reached bit-vector on the right is still a defect', () => {
        expect(() => ev('true and bits(8, 1)')).toThrow(/^'and' needs booleans, got boolean and 8-bit unsigned/);
        expect(() => ev('false or bits(8, 1)')).toThrow(/^'or' needs booleans, got boolean and 8-bit unsigned/);
    });
});
