/**
 * bvToSmv (R-BV-8, slice S2): every S1 method with a nuXmv word operator,
 * the constants, the operators, and the refusals. The types are checked
 * against the S1 method itself on a sample vector, so the printer and the
 * evaluator agree on the width and the signedness of every result.
 */

import { describe, it, expect } from 'vitest';
import { parseExpressionStrict } from '../../../jjel/parser';
import { getBitVectorMethod, makeBitVector } from '../../../jjel/evaluator/builtins/bitvectors';
import type { JjelExpression } from '../../../jjel/types/ast';
import { bvToSmv, smvDeclaration, smvWordConstant, smvWordType, SmvTranslationDefect } from '../bvToSmv';
import type { SmvLeaves, SmvType } from '../bvToSmv';

const u = (width: number): SmvType => ({ kind: 'word', width, signed: false });
const s = (width: number): SmvType => ({ kind: 'word', width, signed: true });

/** a, b: unsigned 8; s, t: signed 8; h: unsigned 16; n: integer; p: boolean. */
const LEAVES: Record<string, SmvType> = { a: u(8), b: u(8), s: s(8), t: s(8), h: u(16), n: { kind: 'integer' }, p: { kind: 'boolean' } };
const leaves: SmvLeaves = e => (e.type === 'Identifier' && LEAVES[e.name] ? { text: e.name, type: LEAVES[e.name] } : null);

function parse(src: string): JjelExpression {
    const out = parseExpressionStrict(src);
    expect(out.errors, src).toEqual([]);
    return out.expression!;
}

const smv = (src: string) => bvToSmv(parse(src), leaves);
const ident = (name: string): JjelExpression => ({ type: 'Identifier', name } as JjelExpression);
/** `and`, `or` and `not` lex as keywords, so `x.and(y)` does not parse (ticket of P-2026-10-20-2331): built by hand. */
const call = (object: string, method: string, args: string[]): JjelExpression =>
    ({ type: 'MethodCall', object: ident(object), method, args: args.map(ident) } as JjelExpression);

describe('declarations and constants (discovery §5.3)', () => {
    it('word types and VAR lines', () => {
        expect(smvWordType(8, false)).toBe('unsigned word[8]');
        expect(smvWordType(16, true)).toBe('signed word[16]');
        expect(smvDeclaration('r', 8, false)).toBe('r : unsigned word[8];');
        expect(smvDeclaration('q', 4, true)).toBe('q : signed word[4];');
    });

    it('unsigned and signed constants, the least signed value as a negation', () => {
        expect(smv('bits(8, 255)')).toEqual({ text: '0ud8_255', type: u(8) });
        expect(smv("bits(8, '0x0f')")).toEqual({ text: '0ud8_15', type: u(8) });
        expect(smv('sbits(8, 5)')).toEqual({ text: '0sd8_5', type: s(8) });
        expect(smv('sbits(8, -1)')).toEqual({ text: '-0sd8_1', type: s(8) });
        expect(smv('sbits(8, -127)').text).toBe('-0sd8_127');
        expect(smv('sbits(8, -128)').text).toBe('!0sd8_127');
        expect(smv("sbits(8, '0x80')").text).toBe('!0sd8_127');
        expect(smv('sbits(1, -1)').text).toBe('!0sd1_0');
        expect(smvWordConstant(16, false, 0n)).toBe('0ud16_0');
    });

    it('a constant needs literal arguments in range', () => {
        expect(() => smv('bits(8, n)')).toThrow(SmvTranslationDefect);
        expect(() => smv('bits(8, 256)')).toThrow(/does not fit/);
    });
});

describe('operators', () => {
    it('+ - * on two words of one type, modular in nuXmv as in S1', () => {
        expect(smv('a + b')).toEqual({ text: '(a + b)', type: u(8) });
        expect(smv('a - b').text).toBe('(a - b)');
        expect(smv('s * t')).toEqual({ text: '(s * t)', type: s(8) });
        expect(smv('-a')).toEqual({ text: '(-a)', type: u(8) });
    });

    it('comparisons are boolean, = for ==, signed or unsigned by the type', () => {
        expect(smv('a == bits(8, 0)')).toEqual({ text: '(a = 0ud8_0)', type: { kind: 'boolean' } });
        expect(smv('a != b').text).toBe('(a != b)');
        expect(smv('s < t').text).toBe('(s < t)');
        expect(smv('a >= b').text).toBe('(a >= b)');
        expect(smv('a == b and not (s < t) or p').text).toBe('(((a = b) & !(s < t)) | p)');
    });

    it('a pair of another width, signedness or a number is a defect (R-BV-3)', () => {
        expect(() => smv('a + h')).toThrow(/one type/);
        expect(() => smv('a + s')).toThrow(/one type/);
        expect(() => smv('a + 1')).toThrow(/one type/);
        expect(() => smv('a / b')).toThrow(/no nuXmv translation/);
        expect(() => smv('a % b')).toThrow(/no nuXmv translation/);
    });
});

describe('methods', () => {
    const cases: Array<[string, string, SmvType]> = [
        ['a.slice(7, 4)', 'a[7:4]', u(4)],
        ['s.slice(3, 0)', 's[3:0]', u(4)],
        ['(a + b).slice(3, 0)', '(a + b)[3:0]', u(4)],
        ['a.bit(0)', 'a[0:0]', u(1)],
        ['a.concat(h)', '(a :: h)', u(24)],
        ['s.concat(a, b)', '(unsigned(s) :: a :: b)', u(24)],
        ['a.replicate(3)', '(a :: a :: a)', u(24)],
        ['a.zext(16)', 'extend(a, 8)', u(16)],
        ['s.zext(16)', 'signed(extend(unsigned(s), 8))', s(16)],
        ['a.zext(8)', 'a', u(8)],
        ['s.sext(16)', 'extend(s, 8)', s(16)],
        ['a.sext(16)', 'unsigned(extend(signed(a), 8))', u(16)],
        ['h.trunc(8)', 'resize(h, 8)', u(8)],
        ['s.trunc(4)', 'signed(resize(unsigned(s), 4))', s(4)],
        ['a.trunc(8)', 'a', u(8)],
        ['a.xor(b)', '(a xor b)', u(8)],
        ['a.shl(3)', '(a << 3)', u(8)],
        ['a.shl(0)', 'a', u(8)],
        ['a.shl(8)', '0ud8_0', u(8)],
        ['a.shr(3)', '(a >> 3)', u(8)],
        ['s.shr(3)', 'signed(unsigned(s) >> 3)', s(8)],
        ['s.shr(9)', '0sd8_0', s(8)],
        ['s.ashr(3)', '(s >> 3)', s(8)],
        ['a.ashr(3)', 'unsigned(signed(a) >> 3)', u(8)],
        ['s.ashr(20)', '(s >> 7)', s(8)],
        ['a.asSigned()', 'signed(a)', s(8)],
        ['s.asSigned()', 's', s(8)],
        ['s.asUnsigned()', 'unsigned(s)', u(8)],
        ['a.asSigned', 'signed(a)', s(8)],
        ['a.width', '8', { kind: 'integer' }],
        ['s.signed', 'TRUE', { kind: 'boolean' }],
    ];
    for (const [src, text, type] of cases) {
        it(`${src} → ${text}`, () => expect(smv(src)).toEqual({ text, type }));
    }

    it('and, or, not as methods (built by hand), and not in the dual form', () => {
        expect(bvToSmv(call('a', 'and', ['b']), leaves)).toEqual({ text: '(a & b)', type: u(8) });
        expect(bvToSmv(call('a', 'or', ['b']), leaves)).toEqual({ text: '(a | b)', type: u(8) });
        expect(bvToSmv(call('s', 'not', []), leaves)).toEqual({ text: '!s', type: s(8) });
        const dual = { type: 'MemberAccess', object: ident('a'), property: 'not' } as JjelExpression;
        expect(bvToSmv(dual, leaves)).toEqual({ text: '!a', type: u(8) });
        expect(() => bvToSmv(call('a', 'and', ['h']), leaves)).toThrow(/same width and signedness/);
    });

    it('every result has the width and signedness the S1 method gives', () => {
        const sample: Record<string, ReturnType<typeof makeBitVector>> = {
            a: makeBitVector('bits', [8, 0xa5]), b: makeBitVector('bits', [8, 3]), s: makeBitVector('sbits', [8, -3]),
            h: makeBitVector('bits', [16, 0x1234]),
        };
        for (const [src, , type] of cases) {
            const e = parse(src);
            if (e.type !== 'MethodCall' || e.object.type !== 'Identifier') continue;
            const args = e.args.map(x => (x.type === 'Identifier' ? sample[x.name] : (x as { value: number }).value));
            const v = getBitVectorMethod(e.method)!(sample[e.object.name], args) as { width: number; signed: boolean };
            expect([src, { kind: 'word', width: v.width, signed: v.signed }]).toEqual([src, type]);
        }
    });

    it('toNumber and toVerilog, a non-literal index or amount, a non-word receiver: defects', () => {
        expect(() => smv('a.toNumber()')).toThrow(/x.toNumber has no nuXmv translation/);
        expect(() => smv('a.toVerilog()')).toThrow(/x.toVerilog has no nuXmv translation/);
        expect(() => smv('a.toNumber')).toThrow(SmvTranslationDefect);
        expect(() => smv('a.shl(n)')).toThrow(/literal integer/);
        expect(() => smv('a.slice(8, 0)')).toThrow(/from 0 to 7/);
        expect(() => smv('a.slice(3, 4)')).toThrow(/from 0 to 3/);
        expect(() => smv('a.trunc(9)')).toThrow(/from 1 to 8/);
        expect(() => smv('a.zext(4)')).toThrow(/from 8/);
        expect(() => smv('n.shl(1)')).toThrow(/needs a word, got integer/);
        expect(() => smv('a.slice(3)')).toThrow(/expects 2 arguments/);
        expect(() => smv('q + a')).toThrow(/Identifier has no nuXmv translation/);
    });
});
