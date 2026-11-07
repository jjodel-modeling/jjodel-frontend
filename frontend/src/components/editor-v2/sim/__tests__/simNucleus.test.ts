/**
 * simNucleus — the nucleus field of a run (DCN L4.1, P-2026-11-07-0701; R-DCN-8, R-DCN-11).
 *
 * Parity: the microwave of simBoardClock.test.ts (an Extended state machine with a
 * global, a terminal and a dead state) and the Petri net of simBridge.test.ts
 * (p1 with 3 tokens, t1, p2, k = 3) run through the field, the switched call sites
 * of `simRunState.ts`, `simBridge.ts` and `simBoardClock.ts`, and through the old
 * path, `netStep.ts` called on `run.net`, compared step by step: outcomes, states,
 * traces, run statuses, the replay of step back and the slider, and the Clock's
 * enabling test, a tick that enables nothing included (R-SIM-136).
 *
 * Reading: a counting nucleus around the Petri one proves each switched call site
 * reads the field, since under Petri a site reverted to `run.net` gives the same
 * values. Each test name says which mutation kills it; the bench is in the commit.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { nucleusOf, petriNucleus } from '../simNucleus';
import type { SimNucleus } from '../simNucleus';
import { clockEnables, createClocks } from '../simBoardClock';
import { inputAsks, panelInputs, playPress, pressInput, runStatus, startRun } from '../simBridge';
import type { ContextBuilder } from '../simBridge';
import { __resetSimRunsForTests, configAt, getSimRun, getSimView, simReset, simSetView, simStepBack } from '../simRunState';
import type { SimRun } from '../simRunState';
import { candidates, netRunStatus, step, structuralInputs, terminated } from '../../../../model/simulation/netStep';
import type { NetConfiguration, StepOutcome } from '../../../../model/simulation/netTypes';

type Lookup = Record<string, any>;
type Obj = { cls: string; slots?: Record<string, unknown[]> };

function lookupOf(classes: Lookup, mm: Lookup, m: Lookup, objects: Record<string, Obj>): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(classes)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', ...mm };
    lookup.M = { className: 'DModel', id: 'M', instanceof: 'MM', ...m };
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: id, features };
    }
    return lookup;
}

function builderOf(objects: Record<string, Obj>): ContextBuilder {
    return () => {
        const h: Record<string, any> = {};
        for (const id of Object.keys(objects)) h[id] = { id, __type: 'Object', name: id };
        return { instances: Object.values(h), classes: [], ...h };
    };
}

// The microwave of simBoardClock.test.ts.
const OVEN: Record<string, Obj> = {
    idle: { cls: 'C_Init', slots: { R_out: ['tPlus', 'tStart', 'tQuit', 'tJam', 'tSpinIn'] } },
    cooking: { cls: 'C_State', slots: { R_out: ['tTick', 'tEnd'] } },
    done: { cls: 'C_Final' },
    stuck: { cls: 'C_State' },
    spinning: { cls: 'C_State', slots: { R_out: ['tSpin', 'tTickS'] } },
    plus: { cls: 'C_Event', slots: { A_label: ['plus'] } },
    start: { cls: 'C_Event', slots: { A_label: ['start'] } },
    tick: { cls: 'C_Event', slots: { A_label: ['tick'] } },
    quit: { cls: 'C_Event', slots: { A_label: ['quit'] } },
    jam: { cls: 'C_Event', slots: { A_label: ['jam'] } },
    spin: { cls: 'C_Event', slots: { A_label: ['spin'] } },
    tPlus: { cls: 'C_Trans', slots: { R_next: ['idle'], R_trigger: ['plus'], A_effect: ['model.[secs] := model.[secs] + 30'] } },
    tStart: { cls: 'C_Trans', slots: { R_next: ['cooking'], R_trigger: ['start'], A_guard: ['model.[secs] > 0'] } },
    tTick: { cls: 'C_Trans', slots: { R_next: ['cooking'], R_trigger: ['tick'], A_guard: ['model.[secs] > 1'], A_effect: ['model.[secs] := model.[secs] - 1'] } },
    tEnd: { cls: 'C_Trans', slots: { R_next: ['idle'], R_trigger: ['tick'], A_guard: ['model.[secs] == 1'], A_effect: ['model.[secs] := 0'] } },
    tQuit: { cls: 'C_Trans', slots: { R_next: ['done'], R_trigger: ['quit'] } },
    tJam: { cls: 'C_Trans', slots: { R_next: ['stuck'], R_trigger: ['jam'] } },
    tSpinIn: { cls: 'C_Trans', slots: { R_next: ['spinning'], R_trigger: ['spin'] } },
    tSpin: { cls: 'C_Trans', slots: { R_next: ['spinning'] } },
    tTickS: { cls: 'C_Trans', slots: { R_next: ['spinning'], R_trigger: ['tick'] } },
};

function ovenLookup(): Lookup {
    return lookupOf({
        C_State: { className: 'DClass', name: 'State', extends: [] },
        C_Init: { className: 'DClass', name: 'Initial', extends: ['C_State'] },
        C_Final: { className: 'DClass', name: 'Terminal', extends: ['C_State'] },
        C_Event: { className: 'DClass', name: 'Event', extends: [] },
        C_Trans: { className: 'DClass', name: 'Transition', extends: [] },
        R_out: { className: 'DReference', name: 'transitions' },
        R_next: { className: 'DReference', name: 'nextState' },
        R_trigger: { className: 'DReference', name: 'event', type: 'C_Event' },
        A_label: { className: 'DAttribute', name: 'name' },
        A_guard: { className: 'DAttribute', name: 'guard' },
        A_effect: { className: 'DAttribute', name: 'effect' },
    }, {
        name: 'Oven',
        _state: {
            simInitial: 'C_Init', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger',
            simEventIdentifier: 'A_label', simGuard: 'A_guard', simAction: 'A_effect', simProfile: 'extendedStateMachine',
        },
    }, {
        name: 'microwave',
        _state: {
            simStateAttributes: JSON.stringify({
                v: 1, attrs: [{ name: 'secs', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 120 }, initial: '0' }],
            }),
        },
    }, OVEN);
}

// The Petri net of simBridge.test.ts: p1 (3 tokens) -a1-> t1 -a2-> p2, k = 3.
const NET: Record<string, Obj> = {
    p1: { cls: 'C_Place', slots: { A_tokens: [3] } },
    p2: { cls: 'C_Place' },
    t1: { cls: 'C_PTr', slots: { A_guard: ['true'] } },
    a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'] } },
    a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'] } },
};

function netLookup(): Lookup {
    return lookupOf({
        C_Place: { className: 'DClass', name: 'Place', extends: [] },
        C_PTr: { className: 'DClass', name: 'PTr', extends: [] },
        C_Arc: { className: 'DClass', name: 'Arc', extends: [] },
        R_src: { className: 'DReference', name: 'src' },
        R_tgt: { className: 'DReference', name: 'tgt' },
        A_tokens: { className: 'DAttribute', name: 'tokens' },
        A_guard: { className: 'DAttribute', name: 'guard' },
    }, {
        name: 'Net',
        _state: {
            simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
            simInitialMarking: 'A_tokens', simBound: '3', simGuard: 'A_guard',
        },
    }, { name: 'pc' }, NET);
}

function started(lookup: Lookup, objects: Record<string, Obj>): SimRun {
    const r = startRun(lookup, 'M', 'MM', 'P', builderOf(objects));
    if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
    return r.run;
}

/** The old path: the enabling test of the panel, the Clock and the board, on `run.net`. */
const oldEnabled = (run: SimRun) => panelInputs(runStatus(run), structuralInputs(run.net, run.config.state));
const oldStatus = (run: SimRun) => netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt);

/**
 * One press through the switched single step, against the old path computed first on the same run: the outcome of
 * `step(run.net, ...)` with the sole candidate, the stored configuration, the trace entry, the status, every
 * nucleus method on the new configuration.
 */
function pressBoth(lookup: Lookup, event: string | null): StepOutcome {
    const run = getSimRun('M')!;
    const cfg: NetConfiguration = { state: run.config.state, event };
    const cs = candidates(run.net, cfg, run.guards);
    expect(cs.candidates.length).toBeLessThanOrEqual(1);
    const expected = step(run.net, cfg, cs.candidates[0]?.transition ?? null, run.guards, run.actions, run.derived);
    const press = pressInput('M', event, undefined, lookup, event ?? 'ε');
    expect(press.outcome).toEqual(expected);
    const after = getSimRun('M')!;
    if (expected.kind !== 'inadmissible') {
        expect(after.config).toEqual(expected.next);
        expect(after.trace?.at(-1)).toMatchObject({ event, selector: expected.label.selector, kind: expected.kind });
    }
    // Neither fixture declares an input, so the panel's status is the core's.
    expect(runStatus(after)).toBe(oldStatus(after));
    const n = nucleusOf(after);
    expect(n.structuralInputs(after.config.state)).toEqual(structuralInputs(after.net, after.config.state));
    expect(n.terminated(after.config.state)).toBe(terminated(after.net, after.config.state));
    for (const e of after.alphabet) expect(clockEnables(after, e)).toBe(oldEnabled(after).events.has(e));
    return expected;
}

/** The old replay: step n rebuilt from `net.initial` over the trace with `netStep.step` on `run.net`. */
function oldConfigAt(run: SimRun, n: number): NetConfiguration {
    let cfg: NetConfiguration = { state: run.net.initial, event: null };
    for (const t of (run.trace ?? []).slice(0, n)) {
        const o = step(run.net, { state: cfg.state, event: t.event }, t.selector, run.guards, run.actions, run.derived);
        if (o.kind === 'inadmissible') throw new Error('old replay refused');
        cfg = o.next;
    }
    return cfg;
}

/** A Petri nucleus that counts its calls, so a call site reverted to `run.net` is seen. */
function counting(base: SimNucleus) {
    const calls = { initial: 0, step: 0, structuralInputs: 0, terminated: 0 };
    const nucleus: SimNucleus = {
        get initial() { calls.initial++; return base.initial; },
        step: (...a) => { calls.step++; return base.step(...a); },
        structuralInputs: s => { calls.structuralInputs++; return base.structuralInputs(s); },
        terminated: s => { calls.terminated++; return base.terminated(s); },
    };
    return { nucleus, calls };
}

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('petriNucleus: byte-for-byte the netStep functions on the net', () => {
    it('initial, step, structuralInputs and terminated equal netStep on every configuration of both fixtures, a derived oracle passed through (mutants: derived dropped; another state read; initial not the net\'s)', () => {
        for (const [lookup, objects, events] of [
            [ovenLookup(), OVEN, ['plus', 'start', 'tick', 'tick', 'quit']],
            [netLookup(), NET, [null, null, null, null]],
        ] as const) {
            __resetSimRunsForTests();
            const run = started(lookup, objects);
            const n = petriNucleus(run.net);
            expect(n.initial).toBe(run.net.initial);
            let cfg: NetConfiguration = { state: run.net.initial, event: null };
            for (const e of events) {
                const c = { state: cfg.state, event: e };
                const sel = candidates(run.net, c, run.guards).candidates[0]?.transition ?? null;
                expect(n.step(c, sel, run.guards, run.actions, run.derived)).toEqual(step(run.net, c, sel, run.guards, run.actions, run.derived));
                const failing = vi.fn(() => ({ derived: { attrs: new Map(), presentation: new Map() }, failures: [{ element: 'M', attr: 'x', space: 'semantic', detail: 'boom' }] }) as any);
                const viaField = n.step(c, sel, run.guards, run.actions, failing);
                expect(viaField).toEqual(step(run.net, c, sel, run.guards, run.actions, failing));
                if (sel !== null) expect(viaField.kind).toBe('halted');
                expect(n.structuralInputs(cfg.state)).toEqual(structuralInputs(run.net, cfg.state));
                expect(n.terminated(cfg.state)).toBe(terminated(run.net, cfg.state));
                const o = n.step(c, sel, run.guards, run.actions, run.derived);
                if (o.kind === 'inadmissible') break;
                cfg = o.next;
            }
            expect(n.terminated(cfg.state)).toBe(terminated(run.net, cfg.state));
        }
    });

    it('startRun sets the field to the Petri nucleus of the run\'s net (mutant: the field not set)', () => {
        const run = started(ovenLookup(), OVEN);
        expect(run.nucleus).toBeDefined();
        expect(run.nucleus!.initial).toBe(run.net.initial);
        expect(nucleusOf(run)).toBe(run.nucleus);
    });

    it('a record without the field steps with the Petri nucleus of its net, one per net (mutant: no fallback)', () => {
        const { nucleus: _drop, ...bare } = started(ovenLookup(), OVEN);
        const n = nucleusOf(bare);
        expect(n.initial).toBe(bare.net.initial);
        expect(nucleusOf(bare)).toBe(n);
        simReset('M', bare);
        pressInput('M', 'plus', undefined, ovenLookup(), 'plus');
        expect(getSimRun('M')!.trace).toHaveLength(1);
        expect(configAt({ ...getSimRun('M')!, keptConfigs: [] }, 0)).toEqual({ state: bare.net.initial, event: null });
    });
});

describe('parity: the switched call sites against the old path, step by step', () => {
    it('the microwave: presses, a discard, Terminated; then every step replayed and stepped back to 0 (mutants: any switched site with another result)', () => {
        const lookup = ovenLookup();
        simReset('M', started(lookup, OVEN));
        const kinds = ['plus', 'plus', 'start', 'tick', 'tick', 'jam', 'quit'].map(e => pressBoth(lookup, e).kind);
        // `jam` in cooking has no transition: a discard; `quit` in cooking too.
        expect(kinds).toEqual(['fired', 'fired', 'fired', 'fired', 'fired', 'discard', 'discard']);
        const live = getSimRun('M')!;
        const m = live.trace!.length;
        // The kept configurations dropped, so configAt and step back replay through the field.
        const replayed = { ...live, keptConfigs: [] };
        for (let n = 0; n <= m; n++) {
            const want = n === m ? live.config : live.keptConfigs![n - 1] ?? { state: live.net.initial, event: null };
            expect(configAt(replayed, n)).toEqual(want);
            expect(configAt(replayed, n)).toEqual(n === m ? live.config : oldConfigAt(live, n));
        }
        simReset('M', replayed);
        for (let n = m; n > 0; n--) {
            const before = getSimRun('M')!;
            expect(simStepBack('M')).toBe(true);
            const after = getSimRun('M')!;
            expect(after.config).toEqual(oldConfigAt(before, n - 1));
            expect(after.trace).toEqual(before.trace!.slice(0, -1));
            expect(runStatus(after)).toBe(oldStatus(after));
        }
        expect(simStepBack('M')).toBe(false);
        expect(getSimRun('M')!.config).toEqual({ state: live.net.initial, event: null });
        // Terminated, from idle by quit: the field and the old path agree on it.
        pressBoth(lookup, 'quit');
        const run = getSimRun('M')!;
        expect([runStatus(run), oldStatus(run), nucleusOf(run).terminated(run.config.state)]).toEqual(['Terminated', 'Terminated', true]);
    });

    it('the Petri net: three firings to Deadlock; the slider shows each step as the old replay builds it (mutants: any switched site with another result)', () => {
        const lookup = netLookup();
        simReset('M', started(lookup, NET));
        expect([null, null, null].map(() => pressBoth(lookup, null).kind)).toEqual(['fired', 'fired', 'fired']);
        const live = getSimRun('M')!;
        expect([runStatus(live), oldStatus(live)]).toEqual(['Deadlock', 'Deadlock']);
        simReset('M', { ...live, keptConfigs: [] });
        const run = getSimRun('M')!;
        for (const n of [0, 1, 2]) {
            simSetView('M', n);
            expect(getSimView('M')).toBe(n);
            expect(configAt(run, n)).toEqual(oldConfigAt(run, n));
        }
        expect(simStepBack('M')).toBe(true);
        expect(getSimRun('M')!.config).toEqual(oldConfigAt(run, 2));
        expect(runStatus(getSimRun('M')!)).toBe('Running');
    });

    it('Play: each tick presses as the old path steps, to the step limit of the ε loop (mutant: Play\'s press stepping another way)', () => {
        const lookup = ovenLookup();
        simReset('M', started(lookup, OVEN));
        pressBoth(lookup, 'spin');
        let steps = 0;
        for (let i = 0; i < 5; i++) {
            const run = getSimRun('M')!;
            const cfg = { state: run.config.state, event: null };
            const sel = candidates(run.net, cfg, run.guards).candidates[0].transition;
            const expected = step(run.net, cfg, sel, run.guards, run.actions, run.derived);
            const p = playPress('M', lookup, steps);
            expect(p.press?.outcome).toEqual(expected);
            steps = p.steps;
        }
        expect(steps).toBe(5);
        expect(getSimRun('M')!.trace).toHaveLength(6);
    });
});

describe('the Clock through the field (R-SIM-122, R-SIM-136)', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('a tick that enables nothing presses nothing, a tick that enables a transition is one step, as the old test says (mutants: the enabling test on another state; idle ticks pressed)', () => {
        vi.useFakeTimers();
        const lookup = ovenLookup();
        simReset('M', started(lookup, OVEN));
        const presses: string[] = [];
        const c = createClocks({
            run: () => getSimRun('M'),
            waiting: () => false,
            press: e => { presses.push(e); pressInput('M', e, undefined, lookup, e); },
            changed: () => {},
        });
        // idle has no transition on tick: not enabled, by the field and by the old path.
        const at0 = getSimRun('M')!;
        expect([clockEnables(at0, 'tick'), oldEnabled(at0).events.has('tick')]).toEqual([false, false]);
        expect(c.start('k', 'tick', 1000)).toBe(true);
        vi.advanceTimersByTime(3000);
        expect([presses, getSimRun('M')!.trace?.length ?? 0, c.state('k')?.idle]).toEqual([[], 0, 3]);
        c.stop('k');
        // plus is enabled in idle: one tick is one step.
        expect([clockEnables(at0, 'plus'), oldEnabled(at0).events.has('plus')]).toEqual([true, true]);
        c.start('p', 'plus', 1000);
        vi.advanceTimersByTime(1000);
        expect([presses, getSimRun('M')!.trace?.length]).toEqual([['plus'], 1]);
        c.dispose();
    });
});

describe('every switched call site reads the field (a counting nucleus)', () => {
    function counted(lookup: Lookup, objects: Record<string, Obj>) {
        const run = started(lookup, objects);
        const spy = counting(petriNucleus(run.net));
        simReset('M', { ...run, nucleus: spy.nucleus });
        return spy;
    }

    it('the single step steps with the field (mutant: simBridge press back on step(run.net, ...))', () => {
        const lookup = ovenLookup();
        const { calls } = counted(lookup, OVEN);
        pressInput('M', 'plus', undefined, lookup, 'plus');
        expect(calls.step).toBe(1);
        expect(getSimRun('M')!.trace).toHaveLength(1);
    });

    it('Play\'s press steps with the field (mutant: the same, seen through playPress)', () => {
        const lookup = ovenLookup();
        const { calls } = counted(lookup, OVEN);
        pressInput('M', 'spin', undefined, lookup, 'spin');
        const before = calls.step;
        playPress('M', lookup, 0);
        expect(calls.step).toBe(before + 1);
    });

    it('the replay of configAt starts from the field\'s initial and steps with the field (mutants: configAt back on run.net.initial; on step(run.net, ...))', () => {
        const lookup = ovenLookup();
        const { calls } = counted(lookup, OVEN);
        for (const e of ['plus', 'plus', 'start']) pressInput('M', e, undefined, lookup, e);
        const run = { ...getSimRun('M')!, keptConfigs: [] };
        const [i, s] = [calls.initial, calls.step];
        expect(configAt(run, 2)).toEqual(oldConfigAt(run, 2));
        expect([calls.initial - i, calls.step - s]).toEqual([1, 2]);
    });

    it('step back and the slider replay through the field (mutants: as configAt\'s, seen through simStepBack and simSetView)', () => {
        const lookup = ovenLookup();
        const { calls } = counted(lookup, OVEN);
        for (const e of ['plus', 'plus']) pressInput('M', e, undefined, lookup, e);
        simReset('M', { ...getSimRun('M')!, keptConfigs: [] });
        let s = calls.step;
        simSetView('M', 1);
        expect(calls.step - s).toBeGreaterThan(0);
        s = calls.step;
        expect(simStepBack('M')).toBe(true);
        expect(calls.step - s).toBe(1);
    });

    it('the Clock\'s enabling test reads the field (mutant: clockEnables back on structuralInputs(run.net, ...))', () => {
        const lookup = ovenLookup();
        const { calls } = counted(lookup, OVEN);
        expect(clockEnables(getSimRun('M')!, 'plus')).toBe(true);
        expect(calls.structuralInputs).toBe(1);
    });

    it('the input asks of a press read termination from the field (mutant: inputAsks back on terminated(run.net, ...))', () => {
        const lookup = ovenLookup();
        const run = started(lookup, OVEN);
        const read = { element: 'M', attr: 'secs', domain: run.net.declared.get('M')!.get('secs')!.domain! };
        const asking = { ...run, inputs: new Map([['tPlus', [read]]]) };
        expect(inputAsks(asking, 'plus')).toEqual([read]);
        const ended: SimNucleus = { ...petriNucleus(run.net), terminated: () => true };
        expect(inputAsks({ ...asking, nucleus: ended }, 'plus')).toEqual([]);
    });
});
