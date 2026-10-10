/**
 * printer — the expression and action printer of the JavaScript target profile
 * (R-GEN-6, R-GEN-11, P-2026-10-10-0950).
 *
 * Executes `printGuard` and `printActions` (P11), then runs what they print
 * (`new Function`, after `JS_RUNTIME`) and compares it with the JjEL evaluator
 * on the simulator's own guard context and with `makeActionOracle`. One block
 * per accepted node kind, one per refusal code. The random comparison is in
 * `printer.differential.test.ts`. Each test name says which break kills it;
 * the bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { parseAction, parseExpressionStrict } from '../../../../jjel/parser';
import type { JjelAction, JjelExpression } from '../../../../jjel/types/ast';
import { compileAction, makeActionOracle } from '../../../../model/simulation/actionEvaluator';
import { buildGuardContext, toJjelStateAccess } from '../../../../model/simulation/guardContext';
import { compileGuard, evaluateGuard } from '../../../../model/simulation/guardEvaluator';
import { stateAccess } from '../../../../model/simulation/netStep';
import type { SimState } from '../../../../model/simulation/netTypes';
import { JS_RUNTIME, printActions, printGuard, toJsState } from '../printer';
import type { JsPrintResult, JsRefusalCode } from '../printer';
import {
    DECLARED, PLACES, SIGMA, ctxFor, evaluateJjel, makeSnapshot, runPrintedActions, runPrintedGuard, sigma,
} from './printerFixture';
import type { Outcome } from './printerFixture';

function expr(source: string): JjelExpression {
    const parsed = parseExpressionStrict(source);
    if (!parsed.expression || parsed.errors.length > 0) throw new Error(`fixture does not parse: ${source}`);
    return parsed.expression;
}

function action(source: string): JjelAction {
    const parsed = parseAction(source);
    if (!parsed.action || parsed.errors.length > 0) throw new Error(`fixture does not parse: ${source}`);
    return parsed.action;
}

function printed(source: string, site = 't1'): string {
    const out = printGuard(expr(source), ctxFor(site));
    if (!out.ok) throw new Error(`refused: ${source}: ${out.refusals.map(r => `${r.code} ${r.message}`).join('; ')}`);
    return out.code;
}

/** Both sides on one σ and one event; the JjEL side never reports an absence on a printed guard. */
function both(source: string, state: SimState = SIGMA, event: string | null = null): { jjel: Outcome; js: Outcome } {
    const code = printed(source);
    const jjel = evaluateJjel(expr(source), state, event);
    expect(jjel.absent, `${source}: an absence the printer did not refuse`).toBeUndefined();
    const { absent: _drop, ...plain } = jjel;
    return { jjel: plain, js: runPrintedGuard(code, toJsState(state), event) };
}

/** The value both sides agree on; a throw on either side fails the comparison. */
function agreed(source: string, state: SimState = SIGMA, event: string | null = null): unknown {
    const { jjel, js } = both(source, state, event);
    expect(js.kind, `${source}: printed ${JSON.stringify(js)} vs JjEL ${JSON.stringify(jjel)}`).toBe(jjel.kind);
    if (jjel.kind === 'value' && js.kind === 'value') expect(js.value, source).toEqual(jjel.value);
    return jjel.kind === 'value' ? jjel.value : { throws: true };
}

function refusalCodes(out: JsPrintResult): JsRefusalCode[] {
    return out.ok ? [] : out.refusals.map(r => r.code);
}

function guardRefusals(source: string, site = 't1'): JsRefusalCode[] {
    return refusalCodes(printGuard(expr(source), ctxFor(site)));
}

// ── accepted node kinds ──────────────────────────────────────────────────────

describe('accepted node kinds: printed, run, equal to the evaluator', () => {
    it('Literal: a guard with no state read folds to its constant (mutant: only literals folded)', () => {
        expect(printed('true')).toBe('true');
        expect(printed('self.count + 1 == 3')).toBe('true');
        expect(agreed('2.5 + 1 == model.[a] + 1.5')).toBe(true);
    });

    it('Literal: negative and decimal numbers print as themselves', () => {
        expect(agreed('model.[a] * 0 + -3')).toBe(-3);
        expect(agreed('model.[a] + 0.1')).toBe(2.1);
    });

    it('Identifier: `event` is the step\'s event, as an element (mutant: event printed as its id string)', () => {
        expect(agreed('event == null', SIGMA, null)).toBe(true);
        expect(agreed('event == null', SIGMA, 'go')).toBe(false);
        expect(agreed('event == go', SIGMA, 'go')).toBe(true);
        expect(agreed('event == "go"', SIGMA, 'go')).toBe(false);
        expect(agreed('event == T1', SIGMA, 'go')).toBe(false);
    });

    it('Identifier: a model name folds to its element', () => {
        expect(printed('T1 == event')).toContain('$E("t1")');
    });

    it('Binary `and` evaluates both operands: a throwing right side throws (mutant: short-circuit `&&`)', () => {
        const { jjel, js } = both('model.[b] > 0 and model.[zzz] > 0');
        expect(jjel.kind).toBe('throw');
        expect(js.kind).toBe('throw');
    });

    it('Binary `or` evaluates both operands: a throwing right side throws (mutant: short-circuit `||`)', () => {
        const { jjel, js } = both('model.[a] > 0 or model.[zzz] > 0');
        expect(jjel.kind).toBe('throw');
        expect(js.kind).toBe('throw');
    });

    it('Binary `and`/`or` answer by truthiness, not by type', () => {
        expect(agreed('model.[a] and model.[s]')).toBe(true);
        expect(agreed('model.[b] or ""')).toBe(false);
    });

    it('Binary `/` and `%` by zero are null (mutant: `/` printed without the null guard)', () => {
        expect(agreed('model.[a] / model.[b]')).toBe(null);
        expect(agreed('model.[a] % model.[b]')).toBe(null);
        expect(agreed('model.[a] / model.[b] == null')).toBe(true);
        expect(agreed('model.[a] / 4')).toBe(0.5);
        expect(agreed('-7 % model.[a]')).toBe(-1);
    });

    it('Binary `+` concatenates when either side is a string, null as the empty string', () => {
        expect(agreed('model.[s] + model.[a]')).toBe('x2');
        expect(agreed('model.[a] + model.[s]')).toBe('2x');
        expect(agreed('model.[s] + null')).toBe('x');
        expect(agreed('model.[a] + null')).toBe(null);
        expect(agreed('model.[a] + true')).toBe(null);
        expect(agreed('[model.[a]] + [1]')).toEqual([2, 1]);
    });

    it('Binary `-` and `*`: numbers only, and a string repeated', () => {
        expect(agreed('model.[a] - 5')).toBe(-3);
        expect(agreed('model.[s] * model.[a]')).toBe('xx');
        expect(agreed('model.[s] - 1')).toBe(null);
    });

    it('Binary `==` is structural, `!=` its negation', () => {
        expect(agreed('[model.[a], 1] == [2, 1]')).toBe(true);
        expect(agreed('[model.[a], 1] == [1, 2]')).toBe(false);
        expect(agreed('model.[a] == "2"')).toBe(false);
        expect(agreed('model.[a] != null')).toBe(true);
        expect(agreed('model.[e] == "RED"')).toBe(true);
    });

    it('Binary ordering: null below every number, strings by locale, booleans as 0 and 1', () => {
        expect(agreed('null < model.[a]')).toBe(true);
        expect(agreed('model.[s] < "y"')).toBe(true);
        expect(agreed('model.[f] > false')).toBe(true);
        expect(agreed('model.[a] >= 2 and model.[a] <= 2')).toBe(true);
    });

    it('Unary `not` by truthiness and `-` on numbers only', () => {
        expect(agreed('not model.[b]')).toBe(true);
        expect(agreed('not model.[s]')).toBe(false);
        expect(agreed('-model.[a]')).toBe(-2);
        expect(agreed('-model.[s]')).toBe(null);
    });

    it('MemberAccess, NullSafeMemberAccess and IndexAccess on M fold to constants', () => {
        expect(printed('self.count == model.[a]')).toBe('$eq(2, $read(state, "M", "a"))');
        expect(agreed('self.requires?.count == model.[a]')).toBe(false);
        expect(agreed('self.items[1].[n] == model.[b]')).toBe(true);
    });

    it('MemberAccess on null folds to a throw at its place, never at print time', () => {
        const code = printed('if model.[f] then 1 else self.requires.count');
        expect(code).toContain('$fail(');
        expect(agreed('if model.[f] then 1 else self.requires.count')).toBe(1);
        const { jjel, js } = both('if model.[f] then 1 else self.requires.count', sigma({}, { M: { f: false } }));
        expect([jjel.kind, js.kind]).toEqual(['throw', 'throw']);
    });

    it('MethodCall `sum` with a lambda over a collection of M expands to its elements', () => {
        expect(agreed('self.children.sum(c => c.[k])')).toBe(3);
        expect(agreed('self.children.sum(c => c.[k] * c.weight)')).toBe(7);
    });

    it('MethodCall `count`, `all`, `any`, `none` with a lambda expand with JavaScript truthiness, as the builtins do', () => {
        expect(agreed('self.children.count(c => c.[k] > 1) == 1')).toBe(true);
        expect(agreed('self.children.all(c => c.[k] > 0)')).toBe(true);
        expect(agreed('self.children.any(c => c.[k] > 1)')).toBe(true);
        expect(agreed('self.children.none(c => c.[k] > 5)')).toBe(true);
        expect(agreed('T2.children.all(c => c.[k] > 5)')).toBe(true);
        expect(agreed('T2.children.any(c => c.[k] > 5)')).toBe(false);
    });

    it('MethodCall `all` stops at the first false element, as the builtin does', () => {
        const s = sigma({}, { M: { a: 0 }, c1: { k: 0 } });
        expect(agreed('self.children.all(c => c.[k] > 0)', s)).toBe(false);
    });

    it('NullSafeMethodCall on a null receiver of M is null, on a collection it expands', () => {
        expect(agreed('self.requires?.any(c => c.[k] > 0) == null')).toBe(true);
        expect(agreed('self.children?.sum(c => c.[k])')).toBe(3);
    });

    it('MethodCall on a null receiver of M throws, `?.` earlier in the chain notwithstanding', () => {
        const { jjel, js } = both('self.requires?.children.any(c => c.[k] > 0)');
        expect([jjel.kind, js.kind]).toEqual(['throw', 'throw']);
    });

    it('IfThenElse evaluates only the branch it takes', () => {
        expect(agreed('if model.[f] then model.[a] else model.[zzz]')).toBe(2);
        expect(agreed('if model.[b] then model.[zzz] else 7')).toBe(7);
    });

    it('NullCoalesce evaluates its right side only on null', () => {
        expect(agreed('model.[a] / model.[b] ?? 9')).toBe(9);
        expect(agreed('model.[a] ?? model.[zzz]')).toBe(2);
    });

    it('Implies is false only on true then false, and skips its right side on false', () => {
        expect(agreed('model.[f] implies model.[a] > 5')).toBe(false);
        expect(agreed('model.[b] implies model.[zzz]')).toBe(true);
    });

    it('IsType on M folds (W-IS stays a warning)', () => {
        expect(agreed('(self is Transition) == model.[f]')).toBe(false);
    });

    it('ArrayLiteral of state reads keeps its order and its elements', () => {
        expect(agreed('[model.[a], model.[s], null]')).toEqual([2, 'x', null]);
    });

    it('Exists over a collection of M expands to a disjunction that stops at the first true', () => {
        expect(agreed('exists c in self.children | c.[k] > 1')).toBe(true);
        expect(agreed('exists c in self.children | c.[k] > 5')).toBe(false);
        expect(agreed('exists c in T2.children | c.[k] > 5')).toBe(false);
        expect(agreed('exists c in self.children | c.[k] > 0 or c.[zzz]')).toEqual({ throws: true });
    });

    it('ForAll and Lambda over M fold whole', () => {
        expect(agreed('(forall c in self.children : c.weight).size() == model.[a]')).toBe(true);
    });

    it('StateAccess reads the attribute, then the derived value (mutant: derived fallback dropped)', () => {
        expect(agreed('self.[n] + T2.[d]')).toBe(8);
    });

    it('StateAccess of an undeclared attribute throws, never null', () => {
        const { jjel, js } = both('model.[zzz] == null');
        expect([jjel.kind, js.kind]).toEqual(['throw', 'throw']);
    });

    it('StateAccess `tokens` and `marked` read the marking of a place', () => {
        expect(agreed('P.[tokens] == 1 and Q.[tokens] == 0')).toBe(true);
        expect(agreed('P.[marked] and not Q.[marked]')).toBe(true);
    });

    it('StateAccess `tokens` on an element that is not a place throws', () => {
        const { jjel, js } = both('T1.[tokens] > 0');
        expect([jjel.kind, js.kind]).toEqual(['throw', 'throw']);
    });

    it('StateAccess on a value of M that is not an element throws', () => {
        const { jjel, js } = both('self.requires.[n] > 0');
        expect([jjel.kind, js.kind]).toEqual(['throw', 'throw']);
    });

    it('a guard printed for another site reads that site as self', () => {
        const out = printGuard(expr('self.count == model.[a] + 3'), ctxFor('t2'));
        expect(out.ok && out.code).toBe('$eq(5, $add($read(state, "M", "a"), 3))');
    });
});

// ── refusals ─────────────────────────────────────────────────────────────────

describe('refusals, with their code', () => {
    const cases: Array<[string, JsRefusalCode]> = [
        ['node.[x] > 0', 'E-NODE'],
        ['data.count > model.[a]', 'E-DATA'],
        ['self.children.any(self => self.[k] > 0)', 'E-SHADOW'],
        ['self.requires != null and self.requires.count > model.[a]', 'E-EAGER'],
        ['if model.[f] then true', 'E-NOELSE'],
        ['forall c in self.children such that c.[k] > 0', 'E-FORALL'],
        ['{a: model.[a]} == null', 'E-VALUE'],
        ['(x => x) == model.[a]', 'E-VALUE'],
        ['with self do count > model.[a]', 'E-WITH'],
        ['now() == model.[a]', 'E-CALL'],
        ['model.[a].sqrt() > 1', 'T-METHOD'],
        ['(if model.[f] then P else Q).name == "P"', 'P-STEP'],
        ['model.[s].toUpper() == "X"', 'P-STEP'],
        ['self.children.filter(c => c.[k] > 0).size() > 0', 'P-STEP'],
        ['(forall c in self.children such that c.[k] > 0 : c).size() > 0', 'P-STEP'],
        ['(model.[a] is Integer)', 'P-STEP'],
        ['[1, 2][model.[a]] == 1', 'P-STEP'],
        ['nope == model.[a]', 'P-ABSENT'],
        ['self.nope == model.[a]', 'P-ABSENT'],
        ['self.instanceOf == event', 'P-CONST'],
    ];
    for (const [source, code] of cases) {
        it(`${code}: ${source}`, () => {
            expect(guardRefusals(source)).toContain(code);
        });
    }

    it('P-SITE: a site with no handle in M', () => {
        expect(guardRefusals('model.[a] > 0', 'nowhere')).toEqual(['P-SITE']);
    });

    it('a refusal carries a message and, from the parser, a location', () => {
        const out = printGuard(expr('model.[a].sqrt() > 1'), ctxFor());
        expect(out.ok).toBe(false);
        if (!out.ok) {
            expect(out.refusals[0].message).toMatch(/sqrt/);
            expect(out.refusals[0].location?.start.line).toBe(1);
        }
    });

    it('a warning of the subset checker is not a refusal: W-TRUTHY, W-NULLCMP, W-IS are printed', () => {
        expect(guardRefusals('model.[a] and model.[f]')).toEqual([]);
        expect(guardRefusals('self.requires?.count < model.[a]')).toEqual([]);
        expect(guardRefusals('(self is Transition) == model.[f]')).toEqual([]);
    });

    it('the not-verifiable codes of nuXmv that JavaScript reproduces are printed: T-DIV, T-MOD, T-DECIMAL', () => {
        expect(guardRefusals('model.[a] / 2 > 0.5')).toEqual([]);
        expect(guardRefusals('model.[a] % 2 == 0')).toEqual([]);
    });
});

// ── actions ──────────────────────────────────────────────────────────────────

/** The oracle side: the simulator's action oracle, its assignments written on a copy of σ without `derived`. */
function oracleNext(sources: string[], state: SimState, event: string | null, site = 't1'): Outcome {
    const compiled = sources.map(s => compileAction(s)!);
    const oracle = makeActionOracle(makeSnapshot(), { places: PLACES, declared: DECLARED }, new Map([[`transition:${site}`, compiled]]));
    const out = oracle({ element: site, role: 'transition' }, event, stateAccess(state, site));
    if (out.kind === 'defect') return { kind: 'throw', message: out.detail };
    const next = toJsState(state);
    delete (next as any).derived;
    const seen = new Set<string>();
    for (const a of out.assignments) {
        const key = `${a.element}\u0000${a.attr}`;
        if (seen.has(key)) return { kind: 'throw', message: 'double assignment' };
        seen.add(key);
        next.attrs[a.element] = { ...(next.attrs[a.element] ?? {}), [a.attr]: a.value };
    }
    return { kind: 'value', value: next };
}

function printedActions(sources: string[], site = 't1'): JsPrintResult {
    return printActions(sources.map(action), ctxFor(site));
}

function actionsAgree(sources: string[], state: SimState = SIGMA, event: string | null = null): Outcome {
    const out = printedActions(sources);
    if (!out.ok) throw new Error(`refused: ${out.refusals.map(r => r.code).join(', ')}`);
    const before = JSON.stringify(toJsState(state));
    const input = toJsState(state);
    const js = runPrintedActions(out.code, input, event);
    expect(JSON.stringify(input), 'σ is never written').toBe(before);
    const expected = oracleNext(sources, state, event);
    expect(js.kind, `${sources.join('; ')}: ${JSON.stringify(js)} vs ${JSON.stringify(expected)}`).toBe(expected.kind);
    if (expected.kind === 'value' && js.kind === 'value') expect(js.value).toEqual(expected.value);
    return js;
}

describe('actions: parallel assignment on σ', () => {
    it('every right-hand side reads the old σ: a swap swaps (mutant: writes before all values are read)', () => {
        const js = actionsAgree(['model.[a] := model.[b]', 'model.[b] := model.[a]']);
        expect(js.kind === 'value' && (js.value as any).attrs.M).toMatchObject({ a: 0, b: 2 });
    });

    it('an increment writes next, never σ', () => {
        const js = actionsAgree(['self.[n] := self.[n] + 1']);
        expect(js.kind === 'value' && (js.value as any).attrs.t1.n).toBe(2);
    });

    it('a target folded through M: self.next.[n] writes Q', () => {
        const out = printedActions(['self.next.[n] := 4']);
        expect(out.ok && out.code).toContain('"Q"');
        actionsAgree(['self.next.[n] := 4']);
    });

    it('the event decides a value', () => {
        actionsAgree(['self.[n] := if event == null then 1 else 2'], SIGMA, 'go');
        actionsAgree(['self.[n] := if event == null then 1 else 2'], SIGMA, null);
    });

    it('a value that is not a boolean, a number or a string is a throw, as the oracle\'s defect', () => {
        actionsAgree(['model.[a] := null']);
        actionsAgree(['model.[a] := self']);
        actionsAgree(['model.[a] := model.[a] / 0']);
    });

    it('a target that names no element is a throw at its place', () => {
        actionsAgree(['self.requires.[n] := 1']);
        actionsAgree(['model.[a] := model.[zzz]', 'self.requires.[n] := 1']);
    });

    it('a presentation attribute assigned through a semantic path is a throw (locality, R-SIM-18)', () => {
        actionsAgree(['self.[color] := "blue"']);
    });

    it('two writes to one target are a throw, the core\'s double assignment', () => {
        actionsAgree(['model.[a] := 1', 'model.[a] := 2']);
    });

    it('an undeclared target is written: the core, not the printer, refuses it', () => {
        actionsAgree(['model.[zzz] := 1']);
    });

    it('derived values are not copied into next: the core rebuilds them', () => {
        const js = actionsAgree(['model.[a] := 1']);
        expect(js.kind === 'value' && 'derived' in (js.value as object)).toBe(false);
    });

    it('no action is a copy of σ', () => {
        actionsAgree([]);
    });

    it('P-TARGET: a target that depends on the step is refused', () => {
        expect(refusalCodes(printedActions(['(if model.[f] then P else Q).[n] := 1']))).toContain('P-TARGET');
    });

    it('P-PRESENTATION: `node.[a]` assigns presentation, outside the generated state', () => {
        expect(refusalCodes(printedActions(['node.[color] := "blue"']))).toContain('P-PRESENTATION');
    });

    it('E-NODE: a semantic value that reads presentation is refused', () => {
        expect(refusalCodes(printedActions(['self.[n] := node.[size]']))).toContain('E-NODE');
    });

    it('a refused right-hand side refuses the whole list, with every refusal', () => {
        const codes = refusalCodes(printedActions(['model.[a] := model.[s].toUpper()', 'model.[b] := nope']));
        expect(codes).toEqual(['P-STEP', 'P-ABSENT']);
    });
});

describe('JS_RUNTIME', () => {
    it('is plain JavaScript that compiles in strict code and declares no export', () => {
        // eslint-disable-next-line no-new-func
        expect(() => new Function(`'use strict';\n${JS_RUNTIME}`)).not.toThrow();
        expect(JS_RUNTIME).not.toMatch(/\bexport\b/);
    });

    it('$guard gives the outcome kind of the simulator\'s evaluateGuard: true, false, a defect for a throw and for a non-boolean', () => {
        const snapshot = makeSnapshot();
        const ctx = buildGuardContext(snapshot, { transitionId: 't1' }, { event: null }, toJjelStateAccess(stateAccess(SIGMA, 't1'), PLACES));
        for (const source of ['model.[a] > 1', 'model.[a] > 5', 'model.[zzz] > 0', 'model.[a]', 'model.[a] / model.[b]']) {
            const expected = evaluateGuard(compileGuard(source), ctx);
            // eslint-disable-next-line no-new-func
            const got = new Function('state', 'event', `'use strict';\n${JS_RUNTIME}\nreturn $guard(() => (${printed(source)}));`)(toJsState(SIGMA), null);
            expect(got.kind, source).toBe(expected.kind);
            if (expected.kind === 'defect') expect(got.reason, source).toBe(expected.reason);
        }
    });

    it('toJsState keeps marking, attributes and derived values, and drops presentation', () => {
        expect(toJsState(SIGMA)).toEqual({
            marking: { P: 1, Q: 0 },
            attrs: { M: { a: 2, b: 0, f: true, s: 'x', e: 'RED' }, t1: { n: 1 }, Q: { n: 0 }, c1: { k: 1 }, c2: { k: 2 } },
            derived: { t2: { d: 7 } },
        });
    });
});
