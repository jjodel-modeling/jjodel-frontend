import { describe, test, expect } from 'vitest';
/**
 * `::` and `self.in(V::D)` (R-DCN-7, P-2026-11-07-0700): the token, the
 * `ClassificationTest` node, and what stays as it was. Evaluation is lane L3.3:
 * here the evaluator throws and the tri-state reports `exception`.
 */

import { tokenize } from '../lexer';
import { parseExpression, parseAction } from '../parser';
import { JjelExpression, JjelTokenType } from '../types';
import { JjelEvaluator, EvaluationContext } from '../evaluator';
import { jjelEval } from '../index';
import { evaluateTriState } from '../../model/jjelTriState';
import { checkGuardSubset } from '../../model/simulation/subsetChecker';

function types(src: string, actionMode = false): JjelTokenType[] {
    const { tokens, errors } = tokenize(src, { actionMode });
    expect(errors).toEqual([]);
    return tokens.map(t => t.type).filter(t => t !== JjelTokenType.EOF);
}

function parse(src: string): JjelExpression {
    const result = parseExpression(src);
    if (result.errors.length > 0) throw new Error(result.errors[0].message);
    if (!result.expression) throw new Error('No expression produced');
    return result.expression;
}

function parseError(src: string): string {
    const result = parseExpression(src);
    expect(result.expression).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
    return result.errors[0].message;
}

describe('lexer: the four colon cases', () => {
    test("':' alone is COLON", () => {
        expect(types('a : b')).toEqual([JjelTokenType.IDENTIFIER, JjelTokenType.COLON, JjelTokenType.IDENTIFIER]);
    });
    test("':=' is ASSIGN in action mode and an error in an expression", () => {
        expect(types('x := 1', true)).toEqual([JjelTokenType.IDENTIFIER, JjelTokenType.ASSIGN, JjelTokenType.NUMBER]);
        expect(tokenize('x := 1').errors.length).toBe(1);
    });
    test("'::' is one DOUBLE_COLON token", () => {
        const { tokens } = tokenize('Mode::Charging');
        expect(tokens.map(t => t.type)).toEqual([
            JjelTokenType.IDENTIFIER, JjelTokenType.DOUBLE_COLON, JjelTokenType.IDENTIFIER, JjelTokenType.EOF,
        ]);
        expect(tokens[1]).toMatchObject({ value: '::', start: 4, end: 6, column: 5 });
    });
    test("': :' is two COLON tokens", () => {
        expect(types('a : : b')).toEqual([
            JjelTokenType.IDENTIFIER, JjelTokenType.COLON, JjelTokenType.COLON, JjelTokenType.IDENTIFIER,
        ]);
    });
    test("':::' is DOUBLE_COLON then COLON", () => {
        expect(types('a:::b')).toEqual([
            JjelTokenType.IDENTIFIER, JjelTokenType.DOUBLE_COLON, JjelTokenType.COLON, JjelTokenType.IDENTIFIER,
        ]);
    });
});

describe('parser: ClassificationTest', () => {
    test('self.in(Mode::Charging)', () => {
        const e = parse('self.in(Mode::Charging)');
        expect(e).toEqual({
            type: 'ClassificationTest',
            object: { type: 'Identifier', name: 'self', location: expect.anything() },
            viewpoint: 'Mode',
            dynamicClass: 'Charging',
            location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 23, offset: 23 },
            },
        });
    });
    test('a chained receiver: self.wau.in(Alert::Safe)', () => {
        expect(parse('self.wau.in(Alert::Safe)')).toMatchObject({
            type: 'ClassificationTest',
            object: { type: 'MemberAccess', property: 'wau', object: { type: 'Identifier', name: 'self' } },
            viewpoint: 'Alert',
            dynamicClass: 'Safe',
        });
    });
    test('the node composes: not, and, chained after', () => {
        expect(parse('not self.in(Mode::Charging)')).toMatchObject({
            type: 'Unary', operand: { type: 'ClassificationTest', viewpoint: 'Mode' },
        });
        expect(parse('self.in(Mode::Idle) and self.wau.in(Alert::Safe)')).toMatchObject({
            type: 'Binary', left: { type: 'ClassificationTest' }, right: { type: 'ClassificationTest' },
        });
    });
    test('in uppercase is the same keyword', () => {
        expect(parse('self.IN(Mode::Charging)')).toMatchObject({ type: 'ClassificationTest', dynamicClass: 'Charging' });
    });
});

describe('parser: in with any other argument stays a member call', () => {
    test('self.in(x)', () => {
        expect(parse('self.in(x)')).toMatchObject({
            type: 'MethodCall', method: 'in', args: [{ type: 'Identifier', name: 'x' }],
        });
    });
    test('self.in(), self.in(x, y), self.in(Mode)', () => {
        expect(parse('self.in()')).toMatchObject({ type: 'MethodCall', method: 'in', args: [] });
        expect(parse('self.in(x, y)')).toMatchObject({ type: 'MethodCall', method: 'in', args: [{}, {}] });
        expect(parse('self.in(Mode)')).toMatchObject({ type: 'MethodCall', method: 'in', args: [{ name: 'Mode' }] });
    });
    test('self.in without parentheses is member access', () => {
        expect(parse('self.in')).toMatchObject({ type: 'MemberAccess', property: 'in' });
    });
    test('evaluation of the member call is unchanged', () => {
        expect(jjelEval('o.in', { o: { in: 2 } })).toBe(2);
    });
});

describe("parser: '::' anywhere else is refused", () => {
    const allowed = /only in a classification test/;
    test.each([
        ['Mode::Charging'],
        ['self.inside(Mode::Charging)'],
        ['self.in(Mode::Charging, x)'],
        ['self.in(Mode::Charging.x)'],
        ['self.in(Mode::Charging::Fast)'],
        ['f(Mode::Charging)'],
        ['x == Mode::Charging'],
        ['self.in(::Charging)'],
        ['self.in(Mode::)'],
        ['self.in(1::Charging)'],
        ['self.in(Mode::not)'],
    ])('%s', (src) => {
        expect(parseError(src)).toMatch(allowed);
    });
    test("the message names the one place '::' is allowed", () => {
        expect(parseError('Mode::Charging')).toContain('.in(V::D)');
    });
    test('an action target cannot be a classification test', () => {
        const r = parseAction('self.in(Mode::Charging) := 1');
        expect(r.action).toBeNull();
        expect(r.errors.length).toBeGreaterThan(0);
    });
});

describe('forall / exists parity', () => {
    test('forall x in S', () => {
        expect(parse('forall x in S | x > 0')).toMatchObject({ type: 'ForAll', variable: 'x' });
        expect(parse('forall x in S : x.name')).toMatchObject({ type: 'ForAll', variable: 'x' });
        expect(jjelEval('forall x in S | x > 1', { S: [1, 2, 3] })).toEqual([2, 3]);
    });
    test('exists x in S', () => {
        expect(parse('exists x in S | x > 0')).toMatchObject({ type: 'Exists', variable: 'x' });
        expect(jjelEval('exists x in S | x > 2', { S: [1, 2, 3] })).toBe(true);
    });
    test('forall over a classification test', () => {
        expect(parse('forall d in drones | d.in(Mode::Charging)')).toMatchObject({
            type: 'ForAll', filter: { type: 'ClassificationTest', object: { name: 'd' } },
        });
    });
});

describe('evaluation is not bound here (L3.3)', () => {
    test('the evaluator throws with a clear message', () => {
        expect(() => jjelEval('self.in(Mode::Charging)', { self: {} })).toThrow(/classification is not bound here/);
    });
    test('the tri-state reports exception', () => {
        const out = evaluateTriState(new JjelEvaluator(), parse('self.in(Mode::Charging)'), new EvaluationContext({ self: {} }));
        expect(out.kind).toBe('exception');
    });
});

describe('the guard subset refuses it until a translation exists', () => {
    test('E-CALL on the node, not on the plain member call', () => {
        const codes = checkGuardSubset(parse('self.in(Mode::Charging)')).map(d => d.code);
        expect(codes).toContain('E-CALL');
        expect(checkGuardSubset(parse('self.in(x)')).map(d => d.code)).not.toContain('E-CALL');
    });
});
