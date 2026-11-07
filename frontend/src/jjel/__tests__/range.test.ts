import { describe, test, expect } from 'vitest';
/**
 * JjEL `range(n)` and `range(a, b)` (P-2026-10-31-1740): the integers from 0 to
 * n-1, or from a to b-1, empty when the bound is not above the start. A global
 * function like `bits`: it shadows a context variable of the same bare name.
 */

import { jjelEval } from '../index';
import type { JjelValue } from '../evaluator';
import { JjelEvaluationError } from '../evaluator';

function ev(src: string, ctx?: Record<string, JjelValue>): JjelValue {
    return jjelEval(src, ctx);
}

function defect(src: string, ctx?: Record<string, JjelValue>): string {
    try {
        ev(src, ctx);
    } catch (e) {
        expect(e).toBeInstanceOf(JjelEvaluationError);
        return (e as Error).message;
    }
    throw new Error(`${src} did not throw`);
}

describe('range(n)', () => {
    test('range(4) is 0..3 in order', () => {
        expect(ev('range(4)')).toEqual([0, 1, 2, 3]);
    });

    test('range(0) is empty', () => {
        expect(ev('range(0)')).toEqual([]);
    });

    test('range(-2) is empty', () => {
        expect(ev('range(-2)')).toEqual([]);
    });

    test('the bound comes from an expression', () => {
        expect(ev('range(n * 2)', { n: 2 })).toEqual([0, 1, 2, 3]);
        expect(ev('range(self.size())', { self: [1, 2, 3] })).toEqual([0, 1, 2]);
    });
});

describe('range(a, b)', () => {
    test('range(2, 5) is 2..4', () => {
        expect(ev('range(2, 5)')).toEqual([2, 3, 4]);
    });

    test('range(5, 2) is empty', () => {
        expect(ev('range(5, 2)')).toEqual([]);
    });

    test('range(2, 2) is empty', () => {
        expect(ev('range(2, 2)')).toEqual([]);
    });

    test('negative start', () => {
        expect(ev('range(-2, 2)')).toEqual([-2, -1, 0, 1]);
    });
});

describe('range defects name the function', () => {
    test.each([
        ['a fraction', 'range(1.5)'],
        ['a fraction as start', 'range(0.5, 3)'],
        ['a fraction as end', 'range(0, 2.5)'],
        ['a string', 'range("3")'],
        ['null', 'range(null)'],
        ['a boolean', 'range(true)'],
        ['a bit-vector', 'range(bits(8, 3))'],
        ['a list', 'range([1, 2])'],
        ['no argument', 'range()'],
        ['three arguments', 'range(1, 2, 3)'],
    ])('%s is an error naming range', (_label, src) => {
        const msg = defect(src);
        expect(msg).toContain('range()');
        expect(msg).not.toContain('not defined');
    });

    test('a missing context variable is an error, not an empty range', () => {
        expect(defect('range(missing)')).toContain('range');
    });

    test('an oversized range is an error, not a hang', () => {
        expect(defect('range(1000000000)')).toContain('range');
    });
});

describe('range as a global', () => {
    test('shadows a context variable of the same bare name, like bits', () => {
        expect(ev('range(2)', { range: 7 })).toEqual([0, 1]);
        expect(ev('self.range', { self: { range: 7 } })).toBe(7);
    });

    test('composes with collection methods', () => {
        expect(ev('range(4).map(i => i * i)')).toEqual([0, 1, 4, 9]);
        expect(ev('range(5).filter(i => i % 2 == 0)')).toEqual([0, 2, 4]);
        expect(ev('range(4).size()')).toBe(4);
        expect(ev('range(3).map(i => "x" + i).join(",")')).toBe('x0,x1,x2');
    });
});
