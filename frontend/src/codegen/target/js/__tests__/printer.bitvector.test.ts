/**
 * printer.bitvector — bit-vectors through the JavaScript target (R-BV-6, R-BV-9,
 * P-2026-10-21-0640, P-2026-10-21-0700).
 *
 * The runtime's `$BitVector` helpers are a port of `jjel/evaluator/builtins/bitvectors.ts`
 * as text (R-BV-9): these tests are what keeps the copy from drifting. The golden rows
 * of S1 (`bv-golden.json`; the oracle table `bv-cases.json` is not on this branch) run
 * through printed guards whose vectors sit in σ, so nothing folds and the prelude
 * computes every result. A grid of operators and one of methods compare the printed
 * code with the evaluator, value or defect message. Then `valueLiteral` and `plain()`.
 * Each test name says which break kills it; the bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { jjelEval } from '../../../../jjel';
import type { JjelValue } from '../../../../jjel/evaluator';
import { isBitVector } from '../../../../jjel/evaluator/context';
import { BITVECTOR_METHOD_NAMES, toVerilog } from '../../../../jjel/evaluator/builtins/bitvectors';
import { parseExpressionStrict } from '../../../../jjel/parser';
import golden from '../../../../jjel/__tests__/fixtures/bv-golden.json';
import { generate } from '../../../engine/generate';
import { valueLiteral } from '../access';
import { JS_RUNTIME, printGuard, toJsState } from '../printer';
import { ctxFor, sigma } from './printerFixture';

type Outcome = { readonly kind: 'value'; readonly value: unknown } | { readonly kind: 'throw'; readonly message: string };

interface Runtime {
    $bvm(x: unknown, method: string, args: () => unknown[], nullSafe: boolean): unknown;
    methods: string[];
}

// eslint-disable-next-line no-new-func
const RT = new Function(`'use strict';\n${JS_RUNTIME}\nreturn { $bvm, methods: [...$BV_METHODS.keys()] };`)() as Runtime;

const v = (src: string): JjelValue => jjelEval(src);

/** A result both sides share: a vector as its Verilog form, anything else as it is. */
function shown(x: unknown): unknown {
    return isBitVector(x) ? { bv: toVerilog(x) } : x;
}

function outcome(f: () => unknown): Outcome {
    try {
        return { kind: 'value', value: shown(f()) };
    } catch (e: any) {
        return { kind: 'throw', message: String(e?.message ?? e) };
    }
}

/** The printed guard over σ at t1 holding `vars`, run after the runtime; the raw value, not a canonical one. */
function printed(source: string, vars: Record<string, JjelValue>): () => unknown {
    const out = printGuard(parseExpressionStrict(source).expression!, ctxFor());
    if (!out.ok) throw new Error(`refused: ${out.refusals.map(r => `${r.code} ${r.message}`).join('; ')}\n${source}`);
    const state = toJsState(sigma({ P: 1, Q: 0 }, { t1: vars as Record<string, any> }));
    // eslint-disable-next-line no-new-func
    const fn = new Function('state', 'event', `'use strict';\n${JS_RUNTIME}\nreturn (${out.code});`);
    return () => fn(state, null);
}

/** A trailing call `recv.m(args)`: the receiver, the method, the argument text. */
const TRAILING = /^(.*)\.(\w+)\(([^()]*)\)$/;

/**
 * As `printed`, but a trailing method the printer refuses (a name a string or a number shares over a step value:
 * `slice`, `trunc`, `toNumber`, P-STEP; `toVerilog`, T-METHOD) is applied by the runtime's own `$bvm` to the
 * printed receiver and the printed arguments.
 */
function printedOrApplied(source: string, vars: Record<string, JjelValue>): unknown {
    const out = printGuard(parseExpressionStrict(source).expression!, ctxFor());
    const m = TRAILING.exec(source);
    if (out.ok || m === null) return printed(source, vars)();
    const receiver = printed(m[1], vars)();
    const args = m[3].trim() === '' ? [] : printed(`[${m[3]}]`, vars)() as unknown[];
    return RT.$bvm(receiver, m[2], () => args, false);
}

/**
 * `name` read from σ in the printed source, bound as a variable in the evaluated one. A null is the literal `null`
 * on the printed side: σ holds no null, `$read` reports it as no state attribute.
 */
function sides(template: string, vars: Record<string, JjelValue>): { jjel: Outcome; js: Outcome } {
    const names = Object.keys(vars).sort((a, b) => b.length - a.length);
    const re = new RegExp(`\\b(${names.join('|')})\\b`, 'g');
    const js = template.replace(re, (_m, name: string) => (vars[name] === null ? 'null' : `self.[${name}]`));
    const held = Object.fromEntries(Object.entries(vars).filter(([, x]) => x !== null));
    return { jjel: outcome(() => jjelEval(template, vars)), js: outcome(() => printedOrApplied(js, held)) };
}

// ── parity with the S1 golden set ────────────────────────────────────────────

interface GoldenRow { id: string; expr: string; bv?: string; value?: unknown }

/** A `bits(…)`/`sbits(…)` call with literal arguments: the leaves the rows build their vectors from. */
const LEAF = /\bs?bits\((?:[^()']|'[^']*')*\)/g;

/**
 * The row with every leaf moved into σ (`self.[vK]`), so the printer cannot fold it. A trailing shared name
 * (`slice`, `trunc`, `toNumber`) is applied by the runtime's `$bvm`, the rest is printed.
 */
function goldenOnRuntime(row: GoldenRow): unknown {
    const vars: Record<string, JjelValue> = {};
    const source = row.expr.replace(LEAF, leaf => {
        const name = `v${Object.keys(vars).length}`;
        vars[name] = v(leaf);
        return `self.[${name}]`;
    });
    expect(Object.keys(vars).length).toBeGreaterThan(0);
    return printedOrApplied(source, vars);
}

describe('parity: the golden rows of S1 computed by the printed runtime', () => {
    const rows = (golden as unknown as { rows: GoldenRow[] }).rows;

    it('covers every row of the table (mutant: a row skipped)', () => {
        expect(rows.length).toBeGreaterThanOrEqual(48);
    });

    it.each(rows.map(r => [r.id, r] as const))('%s (mutant: any change to the ported arithmetic or Verilog form)', (_id, row) => {
        const out = goldenOnRuntime(row);
        if (row.bv !== undefined) {
            expect(isBitVector(out)).toBe(true);
            expect(String(out)).toBe(row.bv);
        } else {
            expect(out).toBe(row.value);
        }
    });
});

// ── dispatched operators against the evaluator ───────────────────────────────

const OPERANDS: Record<string, JjelValue> = {
    u8: v("bits(8, 200)"), u8b: v("bits(8, 100)"), s8: v("sbits(8, -3)"), s8b: v("sbits(8, 5)"),
    u4: v("bits(4, 9)"), u1: v("bits(1, 1)"), u33: v("bits(33, '0x1ffffffff')"), u33b: v("bits(33, 2)"),
    s64: v("sbits(64, '0x8000000000000000')"), s64b: v("sbits(64, 7)"),
    u65: v("bits(65, '0x1ffffffffffffffff')"), u65b: v("bits(65, 1)"),
    n: 3, z: null, str: 'x', t: true,
};

const PAIRS: readonly (readonly [string, string])[] = [
    ['u8', 'u8b'], ['u8b', 'u8'], ['u8', 'u8'], ['s8', 's8b'], ['s8b', 's8'], ['u1', 'u1'], ['u33', 'u33b'],
    ['s64', 's64b'], ['u65', 'u65b'],
    // mismatches: width, sign, number, null, string, boolean, on either side
    ['u8', 'u4'], ['u8', 's8'], ['u8', 'n'], ['n', 'u8'], ['u8', 'z'], ['z', 'u8'], ['u8', 'str'], ['str', 'u8'],
    ['u8', 't'], ['t', 'u8'],
];

const BINARY = ['+', '-', '*', '==', '!=', '<', '<=', '>', '>=', '/', '%', 'and', 'or'];

describe('dispatched runtime helpers against the evaluator', () => {
    const cases = PAIRS.flatMap(([a, b]) => BINARY.map(op => `${a} ${op} ${b}`));

    it.each(cases)('%s (mutant: a helper that does not dispatch, or a defect message reworded)', source => {
        const { jjel, js } = sides(source, OPERANDS);
        expect(js).toEqual(jjel);
    });

    it.each(['-u8', '-s8', '-u1', '-s64', '-u65', 'not u8', 'if u8 then 1 else 2', 'u8 and true', '-z'])(
        '%s (mutant: unary minus or truthiness not dispatched)', source => {
            const { jjel, js } = sides(source, OPERANDS);
            expect(js).toEqual(jjel);
        });

    it('a width mismatch is a defect on both sides, with the same message (mutant: $bvPair accepts any widths)', () => {
        const { jjel, js } = sides('u8 + u4', OPERANDS);
        expect(jjel.kind).toBe('throw');
        expect(js).toEqual(jjel);
    });
});

// ── methods against the evaluator ────────────────────────────────────────────

const RECEIVERS: Record<string, JjelValue> = {
    x8: v("bits(8, '0xab')"), xs8: v("sbits(8, -2)"), x1: v("bits(1, 1)"), x70: v("bits(70, '0x3ffffffffffffffff')"),
};
const ARGS = { b8: v("bits(8, '0x0f')"), b4: v("bits(4, 3)"), sb8: v("sbits(8, 1)") };
const ARG_LISTS = [
    '', '0', '3', '7, 4', '4, 7', '8', '9', '16', '-1', '1.5', "'x'", 'null', 'b8', 'b4', 'sb8', 'b8, b4', '100', '1025', '1, 2, 3',
];

describe('bit-vector methods: printed $bvm against the evaluator', () => {
    it('the runtime has every method of S1 (mutant: a method dropped from $BV_METHODS)', () => {
        expect([...RT.methods].sort()).toEqual([...BITVECTOR_METHOD_NAMES].sort());
    });

    it('a shared name over a step value is refused, toVerilog by the subset checker (mutant: BITVECTOR_ONLY keeps shared names)', () => {
        const codes = (src: string) => {
            const out = printGuard(parseExpressionStrict(src).expression!, ctxFor());
            return out.ok ? [] : out.refusals.map(r => r.code);
        };
        expect(codes('self.[n].toNumber() > 0')).toEqual(['P-STEP']);
        expect(codes('self.[n].slice(3, 0) == null')).toEqual(['P-STEP']);
        expect(codes('self.[n].toVerilog() == null')).toEqual(['T-METHOD']);
        expect(codes('self.[n].zext(16) == null')).toEqual([]);
    });

    const cases = Object.keys(RECEIVERS).flatMap(r => BITVECTOR_METHOD_NAMES.flatMap(m => ARG_LISTS.map(a => `${r}.${m}(${a})`)));

    it.each(cases)('%s (mutant: a ported method, its arity or its range check changed)', source => {
        const { jjel, js } = sides(source, { ...RECEIVERS, ...ARGS });
        expect(js).toEqual(jjel);
    });

    it('on null: a defect, and null through ?. without evaluating the arguments (mutant: $bvm calls the method on null)', () => {
        const jjel = (src: string) => outcome(() => jjelEval(src, { z: null }));
        const noArgs = () => { throw new Error('arguments evaluated on a null receiver'); };
        expect(outcome(() => RT.$bvm(null, 'zext', () => [16], false))).toEqual(jjel('z.zext(16)'));
        expect(outcome(() => RT.$bvm(null, 'zext', noArgs, true))).toEqual({ kind: 'value', value: null });
        expect(jjel('z?.zext(16)')).toEqual({ kind: 'value', value: null });
    });

    it('on a number: the evaluator prefix, no suggestion (mutant: $bvm returns null on a non-vector)', () => {
        const { jjel, js } = sides('n.zext(16)', { n: 5 });
        expect(js.kind).toBe('throw');
        expect(jjel.kind).toBe('throw');
        const message = (js as { message: string }).message;
        expect(message).toMatch(/^Unknown method 'zext' for type \w+$/);
        expect((jjel as { message: string }).message.startsWith(message)).toBe(true);
    });
});

// ── valueLiteral and plain() ─────────────────────────────────────────────────

describe('a vector as a literal of the generated program', () => {
    it('valueLiteral rebuilds the vector, nested too (mutant: the isBitVector branch removed)', () => {
        const x = v("sbits(8, -1)");
        expect(valueLiteral(x)).toBe('$bv(8, true, 0xffn)');
        const nested = valueLiteral({ r: [x, 1] });
        expect(nested).toContain('$bv(8, true, 0xffn)');
        // eslint-disable-next-line no-new-func
        const back = new Function(`'use strict';\n${JS_RUNTIME}\nreturn (${nested});`)() as { r: unknown[] };
        expect(String(back.r[0])).toBe("8'shff");
        expect(isBitVector(back.r[0])).toBe(true);
    });

    it('plain() prints a template hole holding a vector in its Verilog form (mutant: the isBitVector branch removed)', () => {
        const out = generate({ instances: [] }, { M: { className: 'DModel', id: 'M', name: 'm' } }, 'M',
            [{ name: 'w', params: [], body: '"w = ${bits(8, 255)}, s = ${sbits(4, -1)}"' } as any], 'w');
        expect(out.errors).toEqual([]);
        expect(out.code).toBe("w = 8'hff, s = 4'shf");
    });
});
