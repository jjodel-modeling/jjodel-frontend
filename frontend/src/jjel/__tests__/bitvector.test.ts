import { describe, test, expect } from 'vitest';
/**
 * JjEL bit-vector values (R-BV, slice S1): constructors, operators, methods,
 * defects, printing and collections. The names of the operator tests are the
 * mutations of the discovery's bench (§13) that they kill.
 */

import { jjelEval } from '../index';
import type { JjelValue } from '../evaluator';
import { EvaluationContext, JjelEvaluationError, evaluate, toJjelValue, fromJjelValue } from '../evaluator';
import { isBitVector } from '../evaluator/context';
import type { MethodCallExpr } from '../types/ast';
import { parseExpression } from '../parser';
import { parseTemplate } from '../parser/parser';
import { toVerilog } from '../evaluator/builtins/bitvectors';
import golden from './fixtures/bv-golden.json';

function ev(src: string, ctx?: Record<string, JjelValue>): JjelValue {
    return jjelEval(src, ctx);
}

/** The Verilog form of a vector result; fails the test on any other value. */
function bv(src: string, ctx?: Record<string, JjelValue>): string {
    const v = ev(src, ctx);
    if (!isBitVector(v)) throw new Error(`not a bit-vector: ${String(v)}`);
    return toVerilog(v);
}

/** Evaluate an interpolated string (holes only parse through `parseTemplate`). */
function tpl(src: string, ctx?: Record<string, JjelValue>): JjelValue {
    const parsed = parseTemplate(src);
    expect(parsed.errors).toEqual([]);
    return evaluate(parsed.expression!, ctx ? new EvaluationContext(ctx) : undefined);
}

/** Evaluate `expr` with the method `M` of its top-level call renamed. */
function evWithMethod(src: string, method: string): JjelValue {
    const parsed = parseExpression(src);
    expect(parsed.errors).toEqual([]);
    const call = parsed.expression as MethodCallExpr;
    expect(call.type).toBe('MethodCall');
    return evaluate({ ...call, method }, new EvaluationContext());
}

function defect(src: string, ctx?: Record<string, JjelValue>): string {
    try {
        ev(src, ctx);
    } catch (e) {
        expect(e).toBeInstanceOf(JjelEvaluationError);
        return (e as Error).message;
    }
    throw new Error(`no defect for: ${src}`);
}

// ============================================================
// GOLDEN SET
// ============================================================

interface GoldenRow { id: string; expr: string; method?: string; bv?: string; value?: JjelValue; source: string }

describe('golden set (bv-golden.json)', () => {
    const rows = (golden as unknown as { rows: GoldenRow[] }).rows;

    test('has about forty cited rows', () => {
        expect(rows.length).toBeGreaterThanOrEqual(40);
        for (const r of rows) expect(r.source.length).toBeGreaterThan(0);
    });

    test.each(rows.map(r => [r.id, r] as const))('%s', (_id, row) => {
        const v = row.method ? evWithMethod(row.expr, row.method) : ev(row.expr);
        if (row.bv !== undefined) {
            expect(isBitVector(v)).toBe(true);
            expect(toVerilog(v as never)).toBe(row.bv);
        } else {
            expect(v).toBe(row.value);
        }
    });
});

// ============================================================
// CONSTRUCTORS
// ============================================================

describe('constructors', () => {
    test('bits and sbits print in Verilog form, padded to the width', () => {
        expect(bv('bits(8, 255)')).toBe("8'hff");
        expect(bv('sbits(8, -1)')).toBe("8'shff");
        expect(bv('bits(16, 52)')).toBe("16'h0034");
        expect(bv('bits(5, 1)')).toBe("5'h01");
    });

    test('a 0x or 0b string is a pattern; sbits reinterprets it', () => {
        expect(bv("bits(8, '0b1010')")).toBe("8'h0a");
        expect(ev("sbits(8, '0xff').toNumber()")).toBe(-1);
        expect(bv("bits(8, '0XFF')")).toBe("8'hff");
    });

    test('a decimal string is a value, exact beyond 2^53', () => {
        expect(bv("bits(64, '18446744073709551615')")).toBe("64'hffffffffffffffff");
        expect(bv("sbits(64, '-9223372036854775808')")).toBe("64'sh8000000000000000");
    });

    test('out-of-range constructor is a defect', () => {
        expect(defect('bits(8, 300)')).toMatch(/bits\(8, 300\): the value does not fit in 8 unsigned bits/);
        expect(defect('bits(8, 256)')).toMatch(/does not fit/);
        expect(defect('bits(8, -1)')).toMatch(/does not fit in 8 unsigned bits/);
        expect(defect('sbits(8, 128)')).toMatch(/does not fit in 8 signed bits/);
        expect(defect('sbits(8, -129)')).toMatch(/does not fit in 8 signed bits/);
        expect(defect("bits(8, '0x1ff')")).toMatch(/the pattern does not fit in 8 bits/);
        expect(bv('sbits(8, -128)')).toBe("8'sh80");
        expect(bv('sbits(8, 127)')).toBe("8'sh7f");
    });

    test('the width is an integer from 1 to 1024', () => {
        expect(defect('bits(0, 0)')).toMatch(/the width must be an integer from 1 to 1024, got 0/);
        expect(defect('bits(1025, 0)')).toMatch(/got 1025/);
        expect(defect('bits(2.5, 0)')).toMatch(/got 2.5/);
        expect(defect("bits('8', 0)")).toMatch(/got '8'/);
        expect(ev('bits(1024, 0).width')).toBe(1024);
    });

    test('anything but a safe integer or a decimal/0x/0b string is a defect, never a truncation', () => {
        expect(defect('bits(64, 9007199254740992)')).toMatch(/must be a safe integer/);
        expect(defect('bits(8, 1.5)')).toMatch(/must be a safe integer/);
        expect(defect("bits(8, '12abc')")).toMatch(/got '12abc'/);
        expect(defect('bits(8, null)')).toMatch(/got null/);
        expect(defect('bits(8, true)')).toMatch(/got true/);
        expect(defect('bits(8)')).toMatch(/expects 2 arguments, got 1/);
    });

    test('the value is frozen', () => {
        const v = ev('bits(8, 1)');
        expect(Object.isFrozen(v)).toBe(true);
    });
});

// ============================================================
// OPERATORS (mutation-bench targets)
// ============================================================

describe('operators', () => {
    test("add wraps 8'hff + 8'h01 to 8'h00", () => {
        expect(bv('bits(8, 255) + bits(8, 1)')).toBe("8'h00");
    });

    test('mul keeps the low w bits', () => {
        expect(bv('bits(8, 16) * bits(8, 16)')).toBe("8'h00");
        expect(bv('bits(8, 20) * bits(8, 13)')).toBe("8'h04");
    });

    test('sub is not commutative', () => {
        expect(bv('bits(8, 5) - bits(8, 3)')).toBe("8'h02");
        expect(bv('bits(8, 3) - bits(8, 5)')).toBe("8'hfe");
    });

    test("8'sh80 < 8'sh01 when signed", () => {
        expect(ev("sbits(8, '0x80') < sbits(8, 1)")).toBe(true);
        expect(ev("sbits(8, '0x80') > sbits(8, 1)")).toBe(false);
    });

    test("8'h80 > 8'h01 when unsigned", () => {
        expect(ev("bits(8, '0x80') > bits(8, 1)")).toBe(true);
        expect(ev("bits(8, '0x80') <= bits(8, 1)")).toBe(false);
    });

    test("ashr of 8'sh80 by 1 is 8'shc0", () => {
        expect(bv("sbits(8, '0x80').ashr(1)")).toBe("8'shc0");
        // ashr copies the top bit whatever the signedness
        expect(bv("bits(8, '0x80').ashr(1)")).toBe("8'hc0");
        expect(bv("bits(8, '0x40').ashr(1)")).toBe("8'h20");
    });

    test('shl by w gives zero', () => {
        expect(bv("bits(8, '0xff').shl(8)")).toBe("8'h00");
        expect(bv("bits(8, '0xff').shl(40)")).toBe("8'h00");
        expect(bv("bits(8, '0xff').shl(32)")).toBe("8'h00");
        expect(bv("bits(8, '0xff').shr(8)")).toBe("8'h00");
        expect(bv("bits(8, '0xff').shr(33)")).toBe("8'h00");
        expect(bv("bits(8, '0xff').shl(bits(1024, '0x' + '1' * 256))")).toBe("8'h00");
        expect(bv("bits(8, '0x81').shl(bits(4, 1))")).toBe("8'h02");
    });

    test("sext of 4'b1000 to 8 is 8'hf8", () => {
        expect(bv("bits(4, '0b1000').sext(8)")).toBe("8'hf8");
        expect(bv("bits(4, '0b1000').zext(8)")).toBe("8'h08");
    });

    test("slice(7, 4) of 8'hab is 4'ha", () => {
        expect(bv("bits(8, '0xab').slice(7, 4)")).toBe("4'ha");
        expect(bv("bits(8, '0xab').slice(4, 4)")).toBe("1'h0");
    });

    test('concat puts the receiver high', () => {
        expect(bv("bits(4, '0xa').concat(bits(4, '0xb'))")).toBe("8'hab");
        expect(bv("bits(4, '0xb').concat(bits(4, '0xa'))")).toBe("8'hba");
    });

    test("replicate(3) of 2'b10 is 6'b101010", () => {
        expect(bv("bits(2, '0b10').replicate(3)")).toBe("6'h2a");
        expect(bv("bits(2, '0b10').replicate(1)")).toBe("2'h2");
    });

    test("trunc of 16'h1234 to 8 is 8'h34", () => {
        expect(bv("bits(16, '0x1234').trunc(8)")).toBe("8'h34");
    });

    test('8 + 16 bits is a defect', () => {
        expect(defect('bits(8, 1) + bits(16, 1)')).toBe(
            "'+' needs two bit-vectors of the same width and signedness, got 8-bit unsigned and 16-bit unsigned"
        );
        expect(defect('bits(8, 1) < bits(16, 1)')).toMatch(/^'<' needs two bit-vectors/);
    });

    test('signed + unsigned is a defect', () => {
        expect(defect('bits(8, 1) + sbits(8, 1)')).toBe(
            "'+' needs two bit-vectors of the same width and signedness, got 8-bit unsigned and 8-bit signed"
        );
        expect(bv('bits(8, 1) + sbits(8, 1).asUnsigned()')).toBe("8'h02");
    });

    test('x + 1 is a defect', () => {
        expect(defect('bits(8, 1) + 1')).toBe(
            "'+' needs two bit-vectors of the same width and signedness, got 8-bit unsigned and number"
        );
        expect(defect('1 * bits(8, 1)')).toMatch(/got number and 8-bit unsigned/);
        expect(defect('bits(8, 1) == 1')).toMatch(/^'==' needs two bit-vectors/);
        expect(defect('bits(8, 1) < 3')).toMatch(/^'<' needs two bit-vectors/);
    });

    test('bits(8,255) != sbits(8,-1)', () => {
        // top level: a mismatched pair is a defect; nested: unequal, no defect
        expect(defect('bits(8, 255) == sbits(8, -1)')).toMatch(/got 8-bit unsigned and 8-bit signed/);
        expect(ev('[bits(8, 255)] == [sbits(8, -1)]')).toBe(false);
        expect(ev('[bits(8, 255)] == [bits(8, 255)]')).toBe(true);
        expect(ev('[bits(8, 255)] == [bits(16, 255)]')).toBe(false);
        expect(ev("[bits(8, 255)] == [\"8'hff\"]")).toBe(false);
    });

    test('not x is a defect', () => {
        expect(defect('not bits(8, 1)')).toBe(
            'A bit-vector has no truth value: compare it explicitly, e.g. x != bits(8, 0)'
        );
        expect(defect('if sbits(4, 1) then 1 else 2')).toMatch(/x != sbits\(4, 0\)/);
        expect(defect('bits(8, 1) and true')).toMatch(/^'and' needs booleans/);
        expect(defect('true or bits(8, 1)')).toMatch(/^'or' needs booleans/);
        expect(defect('bits(1, 1) implies true')).toMatch(/no truth value/);
        expect(defect('Boolean(bits(1, 1))')).toMatch(/no truth value/);
        expect(defect('exists v in [bits(1, 1)] such that v')).toMatch(/no truth value/);
        expect(defect('forall v in [bits(1, 1)] such that v')).toMatch(/no truth value/);
        expect(defect('[bits(1, 1)].filter(v => v)')).toMatch(/no truth value/);
        expect(ev('if bits(8, 1) != bits(8, 0) then 1 else 2')).toBe(1);
    });

    test("interpolation prints 8'hff", () => {
        expect(tpl('"v=${bits(8, 255)}"')).toBe("v=8'hff");
        expect(tpl('"vs=${[bits(4, 1), sbits(4, -1)]}"')).toBe("vs=4'h1, 4'shf");
        expect(tpl('"c=${x}"', { x: structuredClone(ev('bits(8, 255)')) as JjelValue })).toBe("c=8'hff");
    });

    test('unary minus negates modulo 2^w', () => {
        expect(bv('-bits(8, 1)')).toBe("8'hff");
        expect(bv('-sbits(8, 5)')).toBe("8'shfb");
    });

    test('/ and % are defects (R-BV-4)', () => {
        expect(defect('bits(8, 4) / bits(8, 2)')).toBe("'/' is not defined on bit-vectors yet (R-BV-4)");
        expect(defect('bits(8, 4) % bits(8, 2)')).toMatch(/^'%' is not defined/);
    });

    test('a null operand is a defect, except for == and != (R-BV-2)', () => {
        expect(defect('bits(8, 1) + null')).toMatch(/got 8-bit unsigned and null/);
        expect(defect('null < bits(8, 1)')).toMatch(/got null and 8-bit unsigned/);
        expect(ev('bits(8, 1) == null')).toBe(false);
        expect(ev('null == bits(8, 1)')).toBe(false);
        expect(ev('bits(8, 1) != null')).toBe(true);
        expect(ev('bits(8, 1) ?? 3')).not.toBe(3);
    });

    test('+ with a string concatenates the Verilog form', () => {
        expect(ev("'v=' + bits(8, 255)")).toBe("v=8'hff");
        expect(ev("sbits(4, -2) + '!'")).toBe("4'she!");
    });
});

// ============================================================
// METHODS
// ============================================================

describe('methods', () => {
    test('width and signed are readable, as properties and as calls', () => {
        expect(ev('bits(12, 0).width')).toBe(12);
        expect(ev('sbits(12, 0).signed')).toBe(true);
        expect(ev('bits(12, 0).signed')).toBe(false);
        expect(ev('bits(12, 0).width()')).toBe(12);
    });

    test('zero-argument methods read without parentheses (dual form)', () => {
        expect(ev('bits(8, 255).asSigned.toNumber')).toBe(-1);
        expect(ev('bits(8, 255).toVerilog')).toBe("8'hff");
        expect(ev('bits(8, 255).toVerilog()')).toBe("8'hff");
    });

    test('the raw fields never leak and unknown properties are null', () => {
        expect(ev('bits(8, 255).bits')).toBeNull();
        expect(ev('bits(8, 255).__type')).toBeNull();
        expect(ev('bits(8, 255).foo')).toBeNull();
    });

    test('bit(i) returns a 1-bit unsigned vector', () => {
        expect(bv('sbits(8, -1).bit(7)')).toBe("1'h1");
        expect(defect('bits(8, 1).bit(8)')).toBe('x.bit: i must be an integer from 0 to 7, got 8');
    });

    test('argument defects name the method and the range', () => {
        expect(defect('bits(8, 1).slice(3, 4)')).toBe('x.slice: lo must be an integer from 0 to 3, got 4');
        expect(defect('bits(8, 1).slice(8, 0)')).toMatch(/hi must be an integer from 0 to 7/);
        expect(defect('bits(8, 1).zext(4)')).toMatch(/x.zext: the width must be an integer from 8 to 1024/);
        expect(defect('bits(8, 1).sext(4)')).toMatch(/x.sext: the width must be an integer from 8 to 1024/);
        expect(defect('bits(8, 1).trunc(9)')).toMatch(/x.trunc: the width must be an integer from 1 to 8/);
        expect(defect('bits(8, 1).replicate(0)')).toMatch(/x.replicate: n must be an integer from 1 to 128/);
        expect(defect('bits(8, 1).concat()')).toMatch(/at least 1 argument/);
        expect(defect('bits(8, 1).concat(1)')).toMatch(/argument 1 must be a bit-vector, got number/);
        expect(defect('bits(8, 1).shl(-1)')).toMatch(/non-negative integer or a bit-vector, got -1/);
        expect(defect('bits(8, 1).xor(bits(4, 1))')).toMatch(/^x.xor needs two bit-vectors/);
        expect(defect('bits(8, 1).asSigned(1)')).toMatch(/x.asSigned expects 0 arguments, got 1/);
        expect(defect('bits(1024, 0).concat(bits(1, 0))')).toMatch(/wider than 1024 bits/);
    });

    test('extensions keep the signedness; slice, bit, concat, replicate are unsigned', () => {
        expect(bv('sbits(4, -1).zext(8)')).toBe("8'sh0f");
        expect(bv('sbits(4, -1).sext(8)')).toBe("8'shff");
        expect(bv('sbits(8, -1).trunc(4)')).toBe("4'shf");
        expect(bv('sbits(8, -1).slice(3, 0)')).toBe("4'hf");
        expect(bv('sbits(2, 1).concat(sbits(2, 1))')).toBe("4'h5");
        expect(bv('sbits(2, 1).replicate(2)')).toBe("4'h5");
    });

    test('toNumber is refused beyond the safe integers', () => {
        expect(ev("bits(64, '9007199254740991').toNumber()")).toBe(9007199254740991);
        expect(defect("bits(64, '9007199254740992').toNumber()")).toMatch(/beyond the safe integers/);
        expect(ev("sbits(64, '-9007199254740991').toNumber()")).toBe(-9007199254740991);
        expect(defect("sbits(64, '-9007199254740992').toNumber()")).toMatch(/beyond the safe integers/);
    });

    test('an unknown method names the type and the available methods', () => {
        expect(defect('bits(8, 1).foo()')).toMatch(/^Unknown method 'foo' for type BitVector/);
        expect(defect('bits(8, 1).slise(1, 0)')).toMatch(/Did you mean 'slice'/);
    });

    test("x.and(y), x.or(y), x.not() do not parse yet: and, or, not are keywords after '.'", () => {
        expect(() => ev('bits(8, 1).and(bits(8, 1))')).toThrow(/parse error/);
        expect(() => ev('bits(8, 1).not()')).toThrow(/parse error/);
        expect(bv("bits(8, '0xcc').xor(bits(8, '0xff'))")).toBe("8'h33");
    });

    test('a builtin shadows a bare context name; self.bits is unaffected', () => {
        expect(ev('self.bits', { self: { bits: 42 } })).toBe(42);
    });
});

// ============================================================
// PRINTING, CONVERSIONS, TYPES
// ============================================================

describe('printing and conversions', () => {
    test('String(x) prints the Verilog form; Number(x) is a defect', () => {
        expect(ev('String(sbits(8, -128))')).toBe("8'sh80");
        expect(defect('Number(bits(8, 1))')).toBe('Number(x) does not convert a bit-vector: use x.toNumber()');
    });

    test('is BitVector', () => {
        expect(ev('bits(8, 1) is BitVector')).toBe(true);
        expect(ev('bits(8, 1) is Object')).toBe(false);
        expect(ev('3 is BitVector')).toBe(false);
    });

    test('JSON and String safety nets print the Verilog form', () => {
        const v = ev('bits(8, 255)');
        expect(String(v)).toBe("8'hff");
        expect(JSON.stringify({ r: v })).toBe('{"r":"8\'hff"}');
    });

    test('toJjelValue and fromJjelValue pass a vector through', () => {
        const v = ev('bits(8, 255)');
        expect(toJjelValue(v)).toBe(v);
        expect(fromJjelValue(v)).toBe(v);
    });

    test('a structured-cloned vector is still a vector', () => {
        const clone = structuredClone(ev('bits(8, 255)')) as JjelValue;
        expect(isBitVector(clone)).toBe(true);
        expect(bv('x + bits(8, 1)', { x: clone })).toBe("8'h00");
        expect(tpl('"${x}"', { x: clone })).toBe("8'hff");
        expect(ev('String(x)', { x: clone })).toBe("8'hff");
    });
});

// ============================================================
// COLLECTIONS
// ============================================================

describe('collections', () => {
    test('distinct keys a vector by width, signedness and bits, apart from its string', () => {
        const r = ev("[bits(8, 1), bits(8, 1), sbits(8, 1), bits(16, 1), \"8'h01\"].distinct()") as JjelValue[];
        expect(r.length).toBe(4);
    });

    test('distinctBy and groupBy key on vectors', () => {
        expect((ev('[1, 2, 3].distinctBy(n => bits(1, n % 2))') as JjelValue[]).length).toBe(2);
        const groups = ev('[1, 2, 3].groupBy(n => bits(1, n % 2))') as Array<{ key: JjelValue; items: JjelValue[] }>;
        expect(groups.length).toBe(2);
        expect(groups[0].items).toEqual([1, 3]);
    });

    test('contains and indexOf compare vectors', () => {
        expect(ev('[bits(8, 1), bits(8, 2)].contains(bits(8, 2))')).toBe(true);
        expect(ev('[bits(8, 1), bits(8, 2)].contains(sbits(8, 2))')).toBe(false);
        expect(ev('[bits(8, 1), bits(8, 2)].indexOf(bits(8, 2))')).toBe(1);
    });

    test('sortBy, min, max order vectors by their signedness', () => {
        expect(ev('[sbits(8, 1), sbits(8, -1), sbits(8, 0)].sortBy(v => v).map(v => v.toNumber())')).toEqual([-1, 0, 1]);
        expect(ev('[bits(8, 1), bits(8, 255), bits(8, 0)].sortBy(v => v).map(v => v.toNumber())')).toEqual([0, 1, 255]);
        expect(bv('[sbits(8, 1), sbits(8, -1)].min()')).toBe("8'shff");
        expect(bv('[bits(8, 1), bits(8, 255)].max()')).toBe("8'hff");
    });

    test('ordering a mismatched pair is a defect', () => {
        expect(defect('[bits(8, 1), sbits(8, 1)].max()')).toBe(
            'ordering needs two bit-vectors of the same width and signedness, got 8-bit signed and 8-bit unsigned'
        );
        expect(defect('[bits(8, 1), 3].min()')).toMatch(/^ordering needs two bit-vectors/);
    });

    test('join prints the Verilog form; sum and avg are defects', () => {
        expect(ev("[bits(4, 1), sbits(4, -1)].join(' ')")).toBe("4'h1 4'shf");
        expect(defect('[bits(8, 1)].sum()')).toMatch(/'sum' and 'avg' do not take bit-vectors/);
        expect(defect('[bits(8, 1)].avg()')).toMatch(/'sum' and 'avg' do not take bit-vectors/);
    });

    test('predicates over vectors compare explicitly', () => {
        expect(ev('[bits(1, 0), bits(1, 1), bits(1, 1)].count(b => b == bits(1, 1))')).toBe(2);
        expect(defect('[bits(1, 1)].any(b => b)')).toMatch(/no truth value/);
        expect(defect('[bits(1, 1)].all(b => b)')).toMatch(/no truth value/);
    });
});
