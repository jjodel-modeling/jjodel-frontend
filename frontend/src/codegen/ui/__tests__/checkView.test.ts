/**
 * checkView — the oracle's result as the code panel shows it under «Check» (slice S7b, P-2026-10-11-1053; R-GEN-11,
 * R-GEN-17), and the shared reading of a model's stored scenarios (oracle/storedScenarios.ts).
 *
 * Hand-built `OracleResult`s, one per verdict and failure kind: the pass line and its step count, a divergence's step,
 * transition name, differing values (at most five, then `+K more`) and the origin to link, a failure's message and
 * line. Each test name says which break kills it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { checkView, CHECK_MAX_LINES } from '../checkView';
import { decodeStoredScenarios, storedScenarios, storedScenariosRaw } from '../../oracle/storedScenarios';
import type { OracleResult, TraceStep } from '../../oracle/oracle';
import { RUN_SCENARIOS_KEY, encodeScenarios } from '../../../model/simulation/scenarioCodec';
import type { ScenarioRecord } from '../../../model/simulation/scenarioCodec';

const NAMES: Record<string, string> = { tc: 'coin', tp: 'pass', tu: 'unlock', locked: 'Locked', unlocked: 'Unlocked', M: 'Turnstile' };
const nameOf = (id: string) => NAMES[id] ?? `element ${id}`;

const obs = (marking: Record<string, number>, attrs: Record<string, Record<string, unknown>> = {}, derived: Record<string, Record<string, unknown>> = {}) =>
    ({ marking, attrs, derived }) as TraceStep['observed'];

const SCENARIO: ScenarioRecord = {
    name: 'Pay twice, pass, stop',
    steps: [
        { event: 'push', selector: null, kind: 'discard' },
        { event: 'coin', selector: 'tc', kind: 'fired' },
        { event: 'push', selector: 'tp', kind: 'fired' },
    ],
};

/** The simulator's trace of SCENARIO: step 0 the initial state, then one per scenario step. */
const SIM: TraceStep[] = [
    { kind: 'initial', observed: obs({ locked: 1 }, { M: { coins: 0 } }) },
    { kind: 'discard', observed: obs({ locked: 1 }, { M: { coins: 0 } }), transition: null },
    { kind: 'fired', observed: obs({ unlocked: 1 }, { M: { coins: 1 } }), transition: 'tc' },
    { kind: 'fired', observed: obs({ locked: 1 }, { M: { coins: 1 } }), transition: 'tp' },
];

const model = (elementId: string) => ({ kind: 'model' as const, elementId, feature: null, featureName: 'id', transformation: { name: 'identity' } });

describe('checkView: pass', () => {
    it('names the scenario and its step count (mutant: the count is the trace length, initial included)', () => {
        const r: OracleResult = { ok: true, sim: SIM, gen: SIM };
        expect(checkView(r, SCENARIO, nameOf)).toEqual({
            status: 'pass', steps: 3, scenario: 'Pay twice, pass, stop', text: 'Agrees with the simulator on 3 steps · Pay twice, pass, stop',
        });
    });

    it('says one step in the singular', () => {
        const one: ScenarioRecord = { name: 'One', steps: [SCENARIO.steps[0]] };
        expect(checkView({ ok: true, sim: SIM.slice(0, 2), gen: SIM.slice(0, 2) }, one, nameOf).text).toBe('Agrees with the simulator on 1 step · One');
    });
});

describe('checkView: divergence', () => {
    it('kind: reports the step, the transition name, the two kinds and the program\'s reason (mutant: the step one late)', () => {
        const gen = [...SIM.slice(0, 2), { kind: 'halted', observed: SIM[1].observed, reason: 'unsafe: unlocked would hold 2 tokens' } as TraceStep];
        const r: OracleResult = {
            ok: false, step: 2, kind: 'kind', expected: 'fired', actual: 'halted', transitionId: 'tc',
            origin: { line: 41, start: 7, end: 9, origin: model('tc') }, sim: SIM, gen,
        };
        expect(checkView(r, SCENARIO, nameOf)).toEqual({
            status: 'divergence', kind: 'kind', step: 2, transitionId: 'tc', transition: 'coin',
            text: 'Diverges at step 2 · coin',
            lines: ['step kind: expected fired, actual halted', 'the program: unsafe: unlocked would hold 2 tokens'],
            more: 0,
            link: { elementId: 'tc', line: 41 },
        });
    });

    it('observe: lists every place and attribute that differs at the step, each with expected and actual, a place absent as 0', () => {
        const gen = [...SIM.slice(0, 2), { kind: 'fired', observed: obs({ locked: 1 }, { M: { coins: 2 } }) } as TraceStep];
        const r: OracleResult = {
            ok: false, step: 2, kind: 'observe', path: 'marking.locked', expected: null, actual: 1, transitionId: 'tc',
            origin: { line: 41, start: 7, end: 9, origin: model('tc') }, sim: SIM, gen,
        };
        const v = checkView(r, SCENARIO, nameOf);
        expect(v.status).toBe('divergence');
        if (v.status !== 'divergence') return;
        expect(v.step).toBe(2);
        expect(v.text).toBe('Diverges at step 2 · coin');
        expect(v.lines).toEqual([
            'Turnstile.coins: expected 1, actual 2',
            'place Locked: expected 0, actual 1',
            'place Unlocked: expected 1, actual 0',
        ]);
        expect(v.more).toBe(0);
    });

    it('observe: a derived value and a string attribute are told apart and quoted; an absent attribute is none', () => {
        const sim = [{ kind: 'initial', observed: obs({}, { M: { mode: 'idle' } }, { M: { paid: true } }) } as TraceStep];
        const gen = [{ kind: 'initial', observed: obs({}, { M: { mode: 'busy', extra: 3 } }, { M: { paid: false } }) } as TraceStep];
        const r: OracleResult = { ok: false, step: 0, kind: 'observe', path: 'attrs.M.extra', expected: null, actual: 3, sim, gen };
        const v = checkView(r, { name: 'S', steps: [] }, nameOf);
        if (v.status !== 'divergence') throw new Error(v.status);
        expect(v.text).toBe('Diverges at step 0, the initial state');
        expect(v.lines).toEqual([
            'Turnstile.extra: expected none, actual 3',
            'Turnstile.mode: expected "idle", actual "busy"',
            'Turnstile.paid (derived): expected true, actual false',
        ]);
        expect(v.link).toBeNull();
    });

    it('observe: at most five lines, the rest counted as +K more (mutant: no cap)', () => {
        const many = (n: number) => Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`p${i}`, n]));
        const sim = [{ kind: 'initial', observed: obs(many(1)) } as TraceStep];
        const gen = [{ kind: 'initial', observed: obs(many(2)) } as TraceStep];
        const r: OracleResult = { ok: false, step: 0, kind: 'observe', path: 'marking.p0', expected: 1, actual: 2, sim, gen };
        const v = checkView(r, { name: 'S', steps: [] }, nameOf);
        if (v.status !== 'divergence') throw new Error(v.status);
        expect(v.lines).toHaveLength(CHECK_MAX_LINES);
        expect(CHECK_MAX_LINES).toBe(5);
        expect(v.lines[0]).toBe('place element p0: expected 1, actual 2');
        expect(v.more).toBe(3);
    });

    it('observe: with no structural difference to list, falls back to the verdict\'s own path and values', () => {
        const r: OracleResult = { ok: false, step: 1, kind: 'observe', path: 'marking.locked', expected: 1, actual: null, transitionId: undefined, sim: SIM, gen: SIM };
        const v = checkView(r, SCENARIO, nameOf);
        if (v.status !== 'divergence') throw new Error(v.status);
        expect(v.lines).toEqual(['place Locked: expected 1, actual 0']);
        expect(v.transition).toBeNull();
        expect(v.text).toBe('Diverges at step 1');
    });

    it('error: the message the program threw, linked to the transition of the step', () => {
        const gen = [SIM[0], SIM[1], SIM[2], { kind: 'error', message: 'x is not defined' } as TraceStep];
        const r: OracleResult = {
            ok: false, step: 3, kind: 'error', expected: 'fired', actual: 'x is not defined', transitionId: 'tp',
            origin: { line: 52, start: 7, end: 9, origin: model('tp') }, sim: SIM, gen,
        };
        const v = checkView(r, SCENARIO, nameOf);
        expect(v).toMatchObject({ status: 'divergence', step: 3, text: 'Diverges at step 3 · pass', lines: ['the program threw: x is not defined'], link: { elementId: 'tp', line: 52 } });
    });

    it('length: a program trace that stops early, and one that goes on past the simulator\'s', () => {
        const short: OracleResult = { ok: false, step: 3, kind: 'length', expected: 'fired', actual: null, transitionId: 'tp', sim: SIM, gen: SIM.slice(0, 3) };
        expect(checkView(short, SCENARIO, nameOf)).toMatchObject({ step: 3, text: 'Diverges at step 3 · pass', lines: ['the program\'s trace stops before step 3'], link: null });
        const long: OracleResult = { ok: false, step: 4, kind: 'length', expected: null, actual: 'fired', sim: SIM, gen: [...SIM, SIM[3]] };
        expect(checkView(long, SCENARIO, nameOf)).toMatchObject({ step: 4, transition: null, text: 'Diverges at step 4', lines: ['the program\'s trace goes on: fired at step 4'], link: null });
    });

    it('the origin to link is the transition, also when its fragment is computed (mutant: link the fragment\'s first read)', () => {
        const opaque = { kind: 'opaque' as const, reads: [{ elementId: 'locked', featureName: 'name' }, { elementId: 'tc', featureName: 'id' }] };
        const r: OracleResult = {
            ok: false, step: 2, kind: 'kind', expected: 'fired', actual: 'discard', transitionId: 'tc',
            origin: { line: 12, start: 0, end: 4, origin: opaque as any }, sim: SIM, gen: SIM,
        };
        expect(checkView(r, SCENARIO, nameOf)).toMatchObject({ link: { elementId: 'tc', line: 12 } });
    });

    it('no origin in the result: the transition is named, nothing is linked', () => {
        const r: OracleResult = { ok: false, step: 2, kind: 'kind', expected: 'fired', actual: 'discard', transitionId: 'tc', sim: SIM, gen: SIM };
        expect(checkView(r, SCENARIO, nameOf)).toMatchObject({ transition: 'coin', link: null });
    });
});

describe('checkView: failure', () => {
    it('model: the reason the model has no run, no line', () => {
        const r: OracleResult = { ok: false, kind: 'model', step: 0, message: 'no simulation profile', sim: [], gen: [] };
        expect(checkView(r, SCENARIO, nameOf)).toEqual({
            status: 'failure', kind: 'model', step: 0, text: 'The model cannot be simulated', message: 'no simulation profile', line: null,
        });
    });

    it('scenario: the simulator\'s refusal, with its step', () => {
        const r: OracleResult = { ok: false, kind: 'scenario', step: 2, message: 'the simulator refuses step 2: tc is not a candidate', sim: SIM.slice(0, 2), gen: [] };
        expect(checkView(r, SCENARIO, nameOf)).toEqual({
            status: 'failure', kind: 'scenario', step: 2, text: 'The simulator does not replay Pay twice, pass, stop',
            message: 'the simulator refuses step 2: tc is not a candidate', line: null,
        });
    });

    it('run: the runner\'s message and the line it placed the error on', () => {
        const r: OracleResult = { ok: false, kind: 'run', step: 0, message: 'load: Unexpected token', line: 17, sim: SIM, gen: [] };
        expect(checkView(r, SCENARIO, nameOf)).toEqual({
            status: 'failure', kind: 'run', step: 0, text: 'The program did not run', message: 'load: Unexpected token', line: 17,
        });
        const noLine: OracleResult = { ok: false, kind: 'run', step: 0, message: 'timeout: The run did not finish in 1 ms', line: null, sim: SIM, gen: [] };
        expect(checkView(noLine, SCENARIO, nameOf)).toMatchObject({ line: null, message: 'timeout: The run did not finish in 1 ms' });
    });
});

describe('storedScenarios', () => {
    const A: ScenarioRecord = { name: 'A', steps: [{ event: 'coin', selector: 'tc', kind: 'fired' }] };
    const B: ScenarioRecord = { name: 'B', steps: [] };
    const lookup = (raw: unknown) => ({ m1: { _state: { [RUN_SCENARIOS_KEY]: raw } }, m2: {} });

    it('reads the model\'s key, in stored order', () => {
        const raw = encodeScenarios([A, B]);
        expect(storedScenariosRaw(lookup(raw), 'm1')).toBe(raw);
        expect(storedScenarios(lookup(raw), 'm1').map(s => s.name)).toEqual(['A', 'B']);
        expect(decodeStoredScenarios(raw)).toEqual([A, B]);
    });

    it('no key, no model, or a value that is not a string: no scenario', () => {
        expect(storedScenarios(lookup(undefined), 'm2')).toEqual([]);
        expect(storedScenarios({}, 'nope')).toEqual([]);
        expect(storedScenariosRaw(lookup(42), 'm1')).toBeUndefined();
        expect(decodeStoredScenarios(42)).toEqual([]);
    });

    it('a defective scenario is dropped, the others kept', () => {
        const raw = JSON.stringify({ v: 1, scenarios: [{ name: 'A', steps: A.steps }, { steps: [] }, { name: 'B', steps: [] }] });
        expect(storedScenarios(lookup(raw), 'm1').map(s => s.name)).toEqual(['A', 'B']);
        expect(decodeStoredScenarios('not json')).toEqual([]);
    });
});
