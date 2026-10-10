/**
 * printer, differential — the printed JavaScript against the JjEL evaluator on
 * random σ (R-GEN-6, discovery 2026-10-10 §G.3 and §I.4, P-2026-10-10-0950).
 *
 * For a seeded corpus of guards and actions, the fixtures of the simulator's
 * tests adapted to this M plus generated ones, every text the printer accepts
 * is run on random σ over bounded domains (booleans, small integers, enumeration
 * literals, strings, null, a missing attribute) and random events, and must
 * agree with the JjEL evaluator on the simulator's guard context: the same
 * value, or a throw on both sides. Actions are compared with `makeActionOracle`.
 *
 * Positive controls (P12): each seed must accept most of what it generates and
 * must meet a null, a division by zero, a mixed `+`, a throwing right operand
 * of `and`/`or`, and a throw. A seed that meets none of them proves nothing.
 *
 * Each failure names its seed, the text and σ, so it reproduces.
 */

import { describe, it, expect } from 'vitest';
import { parseAction, parseExpressionStrict } from '../../../../jjel/parser';
import { compileAction, makeActionOracle } from '../../../../model/simulation/actionEvaluator';
import { stateAccess } from '../../../../model/simulation/netStep';
import type { SimState, SimValue } from '../../../../model/simulation/netTypes';
import { printActions, printGuard, toJsState } from '../printer';
import { DECLARED, PLACES, ctxFor, evaluateJjel, makeSnapshot, runPrintedActions, runPrintedGuard, sigma } from './printerFixture';
import type { Outcome } from './printerFixture';

/** mulberry32. */
function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

type R = () => number;
const pick = <T>(r: R, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

// ── σ over bounded domains ───────────────────────────────────────────────────

const INTS: readonly (SimValue | null)[] = [-2, -1, 0, 0, 1, 2, 3];
const STRINGS: readonly SimValue[] = ['', 'x', 'RED', '2'];
const ENUM: readonly SimValue[] = ['RED', 'GREEN', 'BLUE'];

/** A random σ: now and then an attribute is null or missing, so the read throws on both sides. */
function randomSigma(r: R): SimState {
    const maybe = <T>(v: T): T | null | undefined => {
        const x = r();
        if (x < 0.04) return undefined;
        if (x < 0.07) return null;
        return v;
    };
    const rec = (o: Record<string, SimValue | null | undefined>) => {
        const out: Record<string, SimValue | null> = {};
        for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
        return out;
    };
    return sigma(
        { P: pick(r, [0, 1, 2]), Q: pick(r, [0, 0, 1, 2]) },
        {
            M: rec({ a: maybe(pick(r, INTS)), b: maybe(pick(r, INTS)), f: maybe(r() < 0.5), s: maybe(pick(r, STRINGS)), e: maybe(pick(r, ENUM)) }),
            t1: rec({ n: maybe(pick(r, INTS)) }),
            Q: rec({ n: maybe(pick(r, INTS)) }),
            c1: rec({ k: maybe(pick(r, INTS)) }),
            c2: rec({ k: maybe(pick(r, INTS)) }),
        },
        { t2: { d: pick(r, [0, 7]) } },
    );
}

const EVENTS: readonly (string | null)[] = [null, null, 'go', 't1', 'c1'];

// ── the corpus ───────────────────────────────────────────────────────────────

/** Guards and actions of the simulator's tests, renamed onto this M. */
const FIXTURE_GUARDS = [
    'self.[n] > 0', 'self.[n] > 1', 'model.[a] < 2', 'model.[a] <= 2', 'model.[a] >= 2', 'self.[n] == model.[a]',
    'Q.[tokens] < 2', 'Q.[tokens] > 0', 'Q.[tokens] == 0', 'Q.[marked]', 'P.[marked] or Q.[marked]',
    'P.[marked] and Q.[marked]', 'model.[a] / 0 == null', 'self.[n] * 2 + model.[b]', 'model.[a] + model.[b]',
    'if model.[f] then 1 else 0', 'if self.next == null then 1 else self.next.[n] + 1',
    'if self.requires == null then 0 else self.requires.[n] + 1', 'model.[a] * 2 + model.[zzz]',
    'self.[n] + self.children.sum(c => c.[k])', 'self.[n] + self.children.sum(c => if c.[k] > 0 then c.[k] else 0)',
    'self.children.sum(c => c.[k])', 'model.[f] == true', 'event == null', 'model.[s] + model.[a]',
    'exists c in self.children | c.[k] > 1', 'self.children.all(c => c.[k] >= 0)', 'P.[tokens] - Q.[tokens]',
];

const FIXTURE_ACTIONS: readonly string[][] = [
    ['model.[a] := model.[a] + 1'], ['model.[a] := model.[b]', 'model.[b] := model.[a]'], ['self.[n] := 1'],
    ['self.[n] := if event == null then 1 else 2'], ['Q.[n] := 1'], ['self.next.[n] := 1'], ['model.[a] := null'],
    ['model.[a] := self'], ['self.requires.[n] := 1'], ['model.[f] := model.[a] > 0'], ['model.[s] := "dark"'],
    ['self.[color] := "blue"'], ['model.[a] := 1', 'model.[a] := 2'], ['model.[a] := model.[zzz]'],
    ['self.[n] := self.[n] + 1', 'Q.[n] := self.[n]'], ['model.[a] := model.[a] / model.[b]'],
];

/** A typed generator: int, bool and any; `c` is in scope inside a lambda. */
function genInt(r: R, d: number, inLambda: boolean): string {
    const atoms = ['model.[a]', 'model.[b]', 'self.[n]', 'Q.[n]', 'P.[tokens]', 'Q.[tokens]', 'T2.[d]', 'self.count',
        'c1.[k]', String(pick(r, [-1, 0, 1, 2, 3])), '0', 'null', 'model.[zzz]', '2.5'];
    if (inLambda) atoms.push('c.[k]', 'c.[k]', 'c.weight');
    if (d <= 0 || r() < 0.3) return pick(r, atoms);
    switch (Math.floor(r() * 8)) {
        case 0: case 1: return `(${genInt(r, d - 1, inLambda)} ${pick(r, ['+', '-', '*', '/', '%'])} ${genInt(r, d - 1, inLambda)})`;
        // `-(…)`: a bare `--1` is a JjEL comment.
        case 2: return `-(${pick(r, atoms)})`;
        case 3: return `(if ${genBool(r, d - 1, inLambda)} then ${genInt(r, d - 1, inLambda)} else ${genInt(r, d - 1, inLambda)})`;
        case 4: return `(${genAny(r, d - 1, inLambda)} ?? ${genInt(r, d - 1, inLambda)})`;
        case 5: return inLambda ? pick(r, atoms) : `self.children.sum(c => ${genInt(r, d - 1, true)})`;
        case 6: return inLambda ? pick(r, atoms) : `self.children.count(c => ${genBool(r, d - 1, true)})`;
        default: return `(model.[s] + ${genInt(r, d - 1, inLambda)})`;
    }
}

function genBool(r: R, d: number, inLambda: boolean): string {
    const atoms = ['model.[f]', 'P.[marked]', 'Q.[marked]', 'true', 'false', 'event == null', 'event == go',
        'model.[e] == "RED"', 'model.[e] != "GREEN"'];
    if (inLambda) atoms.push('c == event', 'c.[k] > 0');
    if (d <= 0 || r() < 0.25) return pick(r, atoms);
    const sub = () => genBool(r, d - 1, inLambda);
    switch (Math.floor(r() * 10)) {
        case 0: case 1: return `(${genInt(r, d - 1, inLambda)} ${pick(r, ['==', '!=', '<', '>', '<=', '>='])} ${genInt(r, d - 1, inLambda)})`;
        case 2: return `(${sub()} and ${sub()})`;
        case 3: return `(${sub()} or ${sub()})`;
        case 4: return `(not ${sub()})`;
        case 5: return `(${sub()} implies ${sub()})`;
        case 6: return inLambda ? pick(r, atoms) : `(exists c in self.children | ${genBool(r, d - 1, true)})`;
        case 7: return inLambda ? pick(r, atoms) : `self.children.${pick(r, ['all', 'any', 'none'])}(c => ${genBool(r, d - 1, true)})`;
        case 8: return `(${genAny(r, d - 1, inLambda)} == ${genAny(r, d - 1, inLambda)})`;
        default: return `(${genInt(r, d - 1, inLambda)} and ${genInt(r, d - 1, inLambda)})`;
    }
}

function genAny(r: R, d: number, inLambda: boolean): string {
    switch (Math.floor(r() * 5)) {
        case 0: return genInt(r, d, inLambda);
        case 1: return genBool(r, d, inLambda);
        case 2: return pick(r, ['model.[s]', '"x"', '"RED"', 'model.[e]', 'null', 'self.label']);
        case 3: return pick(r, ['event', 'go', 'T1', 'self.requires', 'self.next']);
        default: return `[${genInt(r, d - 1, inLambda)}, ${genBool(r, d - 1, inLambda)}]`;
    }
}

function genAction(r: R): string {
    const target = pick(r, ['model.[a]', 'model.[b]', 'model.[f]', 'model.[s]', 'self.[n]', 'Q.[n]', 'c1.[k]', 'self.next.[n]']);
    return `${target} := ${genAny(r, 2, false)}`;
}

// ── the comparison ───────────────────────────────────────────────────────────

interface Tally {
    accepted: number;
    refused: number;
    runs: number;
    nulls: number;
    throws: number;
    divByZero: number;
    mixedPlus: number;
    eagerThrow: number;
}

function agree(label: string, jjel: Outcome, js: Outcome): void {
    expect(js.kind, `${label}\nprinted ${JSON.stringify(js)}\nJjEL    ${JSON.stringify(jjel)}`).toBe(jjel.kind);
    if (jjel.kind === 'value' && js.kind === 'value') expect(js.value, label).toEqual(jjel.value);
}

function runGuard(source: string, r: R, tally: Tally, seed: number, sigmas: number): void {
    const parsed = parseExpressionStrict(source);
    if (!parsed.expression || parsed.errors.length > 0) throw new Error(`seed ${seed}: the generator wrote a text that does not parse: ${source}`);
    const out = printGuard(parsed.expression, ctxFor());
    if (!out.ok) {
        tally.refused++;
        return;
    }
    tally.accepted++;
    for (let i = 0; i < sigmas; i++) {
        const state = randomSigma(r);
        const event = pick(r, EVENTS);
        const jjel = evaluateJjel(parsed.expression, state, event);
        const label = `seed ${seed}: ${source}\nσ ${JSON.stringify(toJsState(state))} event ${event}\ncode ${out.code}`;
        expect(jjel.absent, `${label}: an absence the printer did not refuse`).toBeUndefined();
        const { absent: _drop, ...plain } = jjel;
        const js = runPrintedGuard(out.code, toJsState(state), event);
        agree(label, plain, js);
        tally.runs++;
        if (plain.kind === 'value' && plain.value === null) tally.nulls++;
        if (plain.kind === 'throw') tally.throws++;
        if (/[/%] *(0\b|null\b|model\.\[b\])/.test(source) && plain.kind === 'value' && plain.value === null) tally.divByZero++;
        if (source.includes('model.[s] +') && plain.kind === 'value' && typeof plain.value === 'string') tally.mixedPlus++;
        if (/ (and|or) /.test(source) && plain.kind === 'throw') tally.eagerThrow++;
    }
}

function oracleNext(sources: readonly string[], state: SimState, event: string | null): Outcome {
    const compiled = sources.map(s => compileAction(s)!);
    const oracle = makeActionOracle(makeSnapshot(), { places: PLACES, declared: DECLARED }, new Map([['transition:t1', compiled]]));
    const out = oracle({ element: 't1', role: 'transition' }, event, stateAccess(state, 't1'));
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

function runActions(sources: readonly string[], r: R, tally: Tally, seed: number, sigmas: number): void {
    const actions = sources.map(s => {
        const parsed = parseAction(s);
        if (!parsed.action || parsed.errors.length > 0) throw new Error(`seed ${seed}: an action that does not parse: ${s}`);
        return parsed.action;
    });
    const out = printActions(actions, ctxFor());
    if (!out.ok) {
        tally.refused++;
        return;
    }
    tally.accepted++;
    for (let i = 0; i < sigmas; i++) {
        const state = randomSigma(r);
        const event = pick(r, EVENTS);
        const label = `seed ${seed}: ${sources.join('; ')}\nσ ${JSON.stringify(toJsState(state))} event ${event}\ncode ${out.code}`;
        agree(label, oracleNext(sources, state, event), runPrintedActions(out.code, toJsState(state), event));
        tally.runs++;
    }
}

const SEEDS = [11, 23, 37, 41, 59];

/** Division and remainder by zero, mixed `+`, a throwing right operand of `and` and `or`. */
const ANCHORS = [
    'model.[a] / model.[b]', 'model.[a] % model.[b]', 'model.[a] / model.[b] ?? -1', 'model.[s] + model.[a]',
    'model.[a] + model.[s]', 'model.[b] > 0 and model.[zzz] > 0', 'model.[a] > 0 or model.[zzz] > 0',
    'model.[f] and (model.[a] / model.[b] == null)',
];

describe('differential: printed guards against the JjEL evaluator', () => {
    it('the simulator\'s fixtures, on 40 σ each', () => {
        const r = rng(7);
        const tally: Tally = { accepted: 0, refused: 0, runs: 0, nulls: 0, throws: 0, divByZero: 0, mixedPlus: 0, eagerThrow: 0 };
        for (const g of FIXTURE_GUARDS) runGuard(g, r, tally, 7, 40);
        expect(tally.refused, 'every fixture guard is in the subset').toBe(0);
        expect(tally.throws).toBeGreaterThan(0);
    });

    for (const seed of SEEDS) {
        it(`generated guards, seed ${seed}`, () => {
            const r = rng(seed);
            const tally: Tally = { accepted: 0, refused: 0, runs: 0, nulls: 0, throws: 0, divByZero: 0, mixedPlus: 0, eagerThrow: 0 };
            for (let i = 0; i < 250; i++) runGuard(genBool(r, 3, false), r, tally, seed, 12);
            for (let i = 0; i < 80; i++) runGuard(genAny(r, 3, false), r, tally, seed, 12);
            // The anchors, on this seed's σ: the cases the controls below count are met by construction.
            for (const a of ANCHORS) runGuard(a, r, tally, seed, 30);
            // Positive controls: the seed met what it was written to meet.
            expect(tally.accepted, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0.9 * (tally.accepted + tally.refused));
            expect(tally.nulls, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0);
            expect(tally.throws, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0);
            expect(tally.divByZero, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0);
            expect(tally.mixedPlus, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0);
            expect(tally.eagerThrow, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0);
        });
    }
});

describe('differential: printed actions against makeActionOracle', () => {
    it('the simulator\'s fixtures, on 40 σ each', () => {
        const r = rng(8);
        const tally: Tally = { accepted: 0, refused: 0, runs: 0, nulls: 0, throws: 0, divByZero: 0, mixedPlus: 0, eagerThrow: 0 };
        for (const a of FIXTURE_ACTIONS) runActions(a, r, tally, 8, 40);
        expect(tally.refused, 'every fixture action is in the subset').toBe(0);
    });

    for (const seed of SEEDS) {
        it(`generated action lists, seed ${seed}`, () => {
            const r = rng(seed);
            const tally: Tally = { accepted: 0, refused: 0, runs: 0, nulls: 0, throws: 0, divByZero: 0, mixedPlus: 0, eagerThrow: 0 };
            for (let i = 0; i < 120; i++) {
                const n = 1 + Math.floor(r() * 3);
                runActions(Array.from({ length: n }, () => genAction(r)), r, tally, seed, 10);
            }
            expect(tally.accepted, `seed ${seed}: ${JSON.stringify(tally)}`).toBeGreaterThan(0.9 * (tally.accepted + tally.refused));
        });
    }
});
