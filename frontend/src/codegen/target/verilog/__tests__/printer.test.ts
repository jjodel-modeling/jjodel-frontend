/**
 * Verilog printer (slice S-D0). (a) Every row of `bv-cases.json` printed: the
 * text is its operator's `oracle.mapping` form, instantiated on the row, and
 * the type is the row's result. (b) The composed cases of `composedCases.ts`:
 * the golden text, and the value by the S1 evaluator. (c), the Verilator run of
 * both, is `node scripts/oracle/bv-printer-verilator.mjs`, not in this suite.
 * Then the memory idiom, the actions and the refusals.
 */

import { describe, it, expect } from 'vitest';
import { jjelEval } from '../../../../jjel';
import { isBitVector } from '../../../../jjel/evaluator/context';
import { parseExpressionStrict } from '../../../../jjel/parser';
import type { JjelValue } from '../../../../jjel/evaluator';
import type { JjelExpression } from '../../../../jjel/types/ast';
import table from '../../../../jjel/__tests__/fixtures/bv-cases.json';
import { printVerilog, printVerilogActions, printVerilogExpression, VerilogPrintDefect } from '../printer';
import type { VerilogNames, VerilogSignal } from '../printer';
import { COMPOSED_CASES } from './composedCases';

interface CaseRow {
    i: number;
    op: string;
    w: number;
    s: boolean;
    a: string;
    b?: string;
    rest?: [number, string][];
    args?: number[];
    rw: number;
}

const rows = (table as unknown as { rows: CaseRow[] }).rows;
const mapping = (table as unknown as { oracle: { mapping: Record<string, string> } }).oracle.mapping;

/** The JjEL expression of each operator (as `bitvectorOracle.test.ts` writes it). */
const EXPR: Record<string, (r: CaseRow) => string> = {
    add: () => 'a + b', sub: () => 'a - b', mul: () => 'a * b', neg: () => '-a',
    eq: () => 'a == b', ne: () => 'a != b', lt: () => 'a < b', le: () => 'a <= b', gt: () => 'a > b', ge: () => 'a >= b',
    and: () => 'a.and(b)', or: () => 'a.or(b)', xor: () => 'a.xor(b)', not: () => 'a.not()',
    shl: r => `a.shl(${r.args![0]})`, shr: r => `a.shr(${r.args![0]})`, ashr: r => `a.ashr(${r.args![0]})`,
    slice: r => `a.slice(${r.args![0]}, ${r.args![1]})`, bit: r => `a.bit(${r.args![0]})`,
    concat: r => `a.concat(${r.rest!.map((_, k) => 'cd'[k]).join(', ')})`, replicate: r => `a.replicate(${r.args![0]})`,
    zext: r => `a.zext(${r.args![0]})`, sext: r => `a.sext(${r.args![0]})`, trunc: r => `a.trunc(${r.args![0]})`,
};

const COMPARISONS = new Set(['eq', 'ne', 'lt', 'le', 'gt', 'ge']);

/** One clause of a prose mapping, by a pattern whose groups are the forms. */
function clause(op: string, pattern: RegExp, group: number): string {
    const m = pattern.exec(mapping[op]);
    if (!m) throw new Error(`mapping of ${op} changed shape: ${mapping[op]}`);
    return m[group];
}

/** The `oracle.mapping` form of the row's operator, instantiated on the row. */
function mappingForm(r: CaseRow): string {
    const n = String(r.args?.[0]);
    switch (r.op) {
        case 'ashr': return clause('ashr', /^signed a: (.+?); unsigned a: (.+?) \(/, r.s ? 1 : 2).replace("32'dn", `32'd${n}`);
        case 'zext': return clause('zext', /^r = (\S+) \(unsigned a\), r = (\S+) \(signed a\)/, r.s ? 2 : 1);
        case 'sext': return clause('sext', /^r = (\S+) \(signed a\), r = (\S+) \(unsigned a\)/, r.s ? 1 : 2);
        case 'trunc': return clause('trunc', /^r = (\S+),/, 1);
        case 'slice': return mapping.slice.replace('hi', n).replace('lo', String(r.args![1]));
        case 'bit': return mapping.bit.replace('[i]', `[${n}]`);
        case 'replicate': return mapping.replicate.replace('{n{', `{${n}{`);
        case 'concat': return mapping.concat.replace('b, ...', r.rest!.map((_, k) => 'cd'[k]).join(', '));
        default: return mapping[r.op].replace("32'dn", `32'd${n}`);
    }
}

function expr(source: string): JjelExpression {
    const r = parseExpressionStrict(source);
    if (!r.expression || r.errors.length > 0) throw new Error(`${source}: ${r.errors.map(e => e.message).join('; ')}`);
    return r.expression;
}

/** Names bound to Verilog variables of the same name. */
function variables(vars: Record<string, readonly [number, boolean]>, memories: Record<string, VerilogSignal> = {}): VerilogNames {
    return {
        leaf: e => {
            if (e.type === 'Identifier' && e.name in vars) return { name: e.name, width: vars[e.name][0], signed: vars[e.name][1] };
            if (e.type === 'StateAccess' && e.object.type === 'Identifier' && e.object.name in vars) {
                const v = vars[e.object.name];
                return { name: e.object.name.toLowerCase(), width: v[0], signed: v[1] };
            }
            return null;
        },
        memory: m => (m.collection.type === 'MemberAccess' && m.collection.object.type === 'Identifier' ? memories[m.collection.object.name] ?? null : null),
    };
}

function rowNames(r: CaseRow): VerilogNames {
    const vars: Record<string, readonly [number, boolean]> = { a: [r.w, r.s], b: [r.w, r.s] };
    r.rest?.forEach(([w], k) => { vars['cd'[k]] = [w, false]; });
    return variables(vars);
}

describe('(a) every row of bv-cases.json prints its oracle.mapping form', () => {
    const operators = [...new Set(rows.map(r => r.op))];

    it('covers the 24 operators of oracle.mapping', () => {
        expect(operators.sort()).toEqual(Object.keys(mapping).sort());
        expect(operators).toHaveLength(24);
    });

    it.each(operators.map(op => [op]))('%s', op => {
        const mine = rows.filter(r => r.op === op);
        const wrong = mine
            .map(r => {
                const got = printVerilog(expr(EXPR[op](r)), rowNames(r));
                const type = COMPARISONS.has(op) ? 'boolean' : `${r.s && !['slice', 'bit', 'concat', 'replicate'].includes(op) ? 'signed ' : ''}word[${r.rw}]`;
                const gotType = got.type.kind === 'word' ? `${got.type.signed ? 'signed ' : ''}word[${got.type.width}]` : 'boolean';
                return { i: r.i, text: got.text, expected: mappingForm(r), type: gotType, expectedType: type };
            })
            .filter(d => d.text !== d.expected || d.type !== d.expectedType);
        expect(wrong.slice(0, 5)).toEqual([]);
    });
});

function vector(w: number, s: boolean, hex: string): JjelValue {
    return jjelEval(`${s ? 'sbits' : 'bits'}(${w}, '0x${hex}')`);
}

describe('(b) composed cases: the wrapping rule', () => {
    it.each(COMPOSED_CASES.map(c => [c.name, c]))('%s', (_name, c) => {
        const names = variables(Object.fromEntries(Object.entries(c.vars).map(([k, [w, s]]) => [k, [w, s] as const])));
        expect(printVerilog(expr(c.jjel), names).text).toBe(c.text);
        const ctx = Object.fromEntries(Object.entries(c.vars).map(([k, [w, s, hex]]) => [k, vector(w, s, hex)]));
        const v = jjelEval(c.jjel, ctx);
        const value = typeof v === 'boolean' ? (v ? '1' : '0') : isBitVector(v) ? v.bits.toString(16).padStart(Math.ceil(v.width / 4), '0') : `not a value: ${String(v)}`;
        expect(value).toBe(c.value);
    });
});

describe('constants, σ reads, the memory idiom', () => {
    const names = variables({ PC: [4, false], IR: [8, false], ACC: [8, false], Z: [1, false], S: [8, true] }, {
        rom: { name: 'rom', width: 8, signed: false },
        ram: { name: 'ram', width: 8, signed: false },
    });

    it('prints constants with toVerilog', () => {
        expect(printVerilogExpression("bits(8, '0xff')", names)).toEqual({ text: "8'hff", type: { kind: 'word', width: 8, signed: false } });
        expect(printVerilogExpression('sbits(8, -128)', names).text).toBe("8'sh80");
        expect(printVerilogExpression('PC.[value] + bits(4, 1)', names).text).toBe("pc + 4'h1");
    });

    it('prints a ROM read, a RAM read with a sliced key, and drops toNumber', () => {
        expect(printVerilogExpression('bits(8, rom.cells.filter(c => c.addr == PC.[value].toNumber()).first.init)', names).text).toBe('rom[pc]');
        expect(printVerilogExpression('ACC.[value] + ram.cells.filter(c => c.addr == IR.[value].slice(3, 0).toNumber()).first.[value]', names).text)
            .toBe('acc + ram[ir[3:0]]');
        expect(printVerilogExpression('ram.cells.filter(c => c.addr == 7).first.[value].slice(3, 0)', names).text).toBe('ram[7][3:0]');
        expect(printVerilogExpression('ram.cells.filter(c => c.addr == (IR.[value] + bits(8, 1)).toNumber()).first.[value]', names).text)
            .toBe("ram[{ir + 8'h01}]");
    });

    it('prints the transfers of the plan §5.3 fragment as nonblocking assignments', () => {
        expect(printVerilogActions([
            'IR.[value] := bits(8, rom.cells.filter(c => c.addr == PC.[value].toNumber()).first.init)',
            '   ',
            'PC.[value] := PC.[value] + bits(4, 1)',
            null,
            "Z.[value] := if ACC.[value] == bits(8, 0) then bits(1, 1) else bits(1, 0)",
            'ACC.[value] := IR.[value].slice(3, 0).zext(8)',
            'ram.cells.filter(c => c.addr == IR.[value].slice(3, 0).toNumber()).first.[value] := ACC.[value]',
        ], names)).toEqual([
            'ir <= rom[pc];',
            "pc <= pc + 4'h1;",
            "z <= (acc == 8'h00) ? 1'h1 : 1'h0;",
            'acc <= ir[3:0];',
            'ram[ir[3:0]] <= acc;',
        ]);
    });

    it('refuses, naming the element', () => {
        const refused: Array<[string, RegExp]> = [
            ['Q.[value]', /Q\.\[value\] names no register/],
            ['bits(8, PC.[value].toNumber())', /bits\(…\) needs literal arguments/],
            ['bits(4, rom.cells.filter(c => c.addr == PC.[value].toNumber()).first.init)', /holds word\[8\], read as word\[4\]/],
            ['mem.cells.filter(c => c.addr == 1).first.[value]', /mem\.cells names no memory/],
            ['ram.cells.filter(c => c.addr == PC.[value]).first.[value]', /the key PC\.\[value\] of a memory idiom must be/],
            ['ram.cells.filter(c => c.addr == S.[value].toNumber()).first.[value]', /is signed/],
            ['ACC.[value].toUpper()', /ACC\.\[value\]\.toUpper\(…\) has no Verilog form/],
            ['ACC.[value] / ACC.[value]', /'\/' has no Verilog form/],
            ['ACC.[value] + PC.[value]', /'\+' needs two words of one type, got word\[8\] and word\[4\]/],
            ['ACC.[value] + S.[value]', /got word\[8\] and signed word\[8\]/],
            ['ACC.[value].shl(PC.[value].toNumber())', /the amount must be a literal integer/],
            ['ACC.[value].slice(8, 0)', /hi must be a literal integer from 0 to 7/],
            ['if Z.[value] then ACC.[value] else ACC.[value]', /needs a boolean, got word\[1\]/],
            ['ACC.[value] == bits(8, 0) and Z.[value] == bits(1, 0)', /'and' has no Verilog form/],
            ['ACC.[value].toNumber()', /has no Verilog form/],
        ];
        for (const [source, message] of refused) {
            expect(() => printVerilogExpression(source, names), source).toThrow(VerilogPrintDefect);
            expect(() => printVerilogExpression(source, names), source).toThrow(message);
        }
        expect(() => printVerilogActions(['ACC.[value] := PC.[value]'], names)).toThrow(/ACC\.\[value\] is word\[8\], the value is word\[4\]/);
        expect(() => printVerilogActions(['Q.[value] := bits(8, 0)'], names)).toThrow(/Q\.\[value\] names no register or memory/);
        expect(() => printVerilogActions(["ACC.[value] := bits(8, 0xFF)"], names)).toThrow(VerilogPrintDefect);
    });
});
