/**
 * displayJson (P-2026-10-21-0715): a bit-vector prints in its Verilog form, a bigint as its decimal text, anything
 * else byte-identical to JSON.stringify.
 */

import { describe, it, expect } from 'vitest';
import { displayJson } from '../displayJson';
import { makeBitVector } from '../../../jjel/evaluator/builtins/bitvectors';

const vector = makeBitVector('bits', [8, 255]);
// What the run worker hands back: a structured clone, the class (and its toJSON) gone, the bigint kept.
const cloned = structuredClone(vector);

describe('displayJson', () => {
    it('prints a bit-vector in its Verilog form, live or cloned', () => {
        expect(displayJson(vector)).toBe("8'hff");
        expect(displayJson(cloned)).toBe("8'hff");
        expect(() => JSON.stringify(cloned)).toThrow();
    });

    it('prints a vector nested in an object bare, at any depth', () => {
        const value = { name: 'r', regs: [cloned, { acc: makeBitVector('sbits', [8, -128]) }] };
        expect(displayJson(value)).toBe(`{"name":"r","regs":[8'hff,{"acc":8'sh80}]}`);
        expect(displayJson(value, 2)).toBe(`{\n  "name": "r",\n  "regs": [\n    8'hff,\n    {\n      "acc": 8'sh80\n    }\n  ]\n}`);
    });

    it('prints a plain bigint as its decimal text', () => {
        expect(displayJson(12345678901234567890n)).toBe('12345678901234567890');
        expect(displayJson({ n: -7n })).toBe('{"n":-7}');
    });

    it('prints an ordinary value byte-identical to JSON.stringify', () => {
        const ordinary = { s: 'a "q" è', n: 1.5, b: false, z: null, u: undefined, a: [1, 'x', { d: new Date(0) }] };
        expect(displayJson(ordinary)).toBe(JSON.stringify(ordinary));
        expect(displayJson(ordinary, 2)).toBe(JSON.stringify(ordinary, null, 2));
        expect(displayJson('text')).toBe(JSON.stringify('text'));
        expect(displayJson(undefined)).toBeUndefined();
        // No vector, no unquoting: a text that happens to hold the marker stays a quoted text.
        expect(displayJson({ t: 'x' })).toBe(JSON.stringify({ t: 'x' }));
    });
});
