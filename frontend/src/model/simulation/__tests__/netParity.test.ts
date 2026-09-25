/**
 * netParity — step 3a (P-2026-09-25-0935): today's step against the Petri core.
 *
 * Runs the committed `stepFlowchartBoolean`, `runStatus` and `epsilonEnabled`
 * and the new `step`, `netRunStatus` and `structuralInputs` on the fixtures of
 * step.test.ts and events.test.ts, copied here (those files are not touched
 * and export nothing). Two parts:
 *
 * - parity: on every deterministic trace (at most one candidate per step) the
 *   derived `isMarked` (R-SIM-11) equals today's `Set` after each step, for
 *   every element of the fixture;
 * - decisions: the 20 differences measured in report §7
 *   (docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md), each pinned
 *   by name with today's answer beside the new one and the ratification that
 *   changes it. One of them (step.test.ts:167) turns out not to differ in the
 *   core: see its test.
 */

import { describe, it, expect } from 'vitest';
import { applyStepLabel, epsilonEnabled, runStatus, stepFlowchartBoolean } from '../step';
import { candidates, isMarked, netRunStatus, step, structuralInputs } from '../netStep';
import { compileNet, netStcFromRoles } from '../netCompile';
import type { SimConfiguration, SimModelView, StcDescriptor } from '../types';
import type { ActionOracle, CompiledNet, GuardOracle, NetConfiguration, NetModelView, SimState } from '../netTypes';

interface Fixture {
    instances: Record<string, { cls: string; out?: string[] }>;
    transitions: Record<string, { to: string | null; on?: string | string[] }>;
}

const ENGINE = { initial: 'C_Initial', terminal: 'C_Final', ownedTransitions: 'R_out', nextState: 'R_next' };
const OLD: StcDescriptor = { kind: 'boolean', roles: { ...ENGINE } };
const OLD_EV: StcDescriptor = { kind: 'boolean', roles: { ...ENGINE, event: 'C_Event', trigger: 'R_trigger' } };
const BAG = { simInitial: 'C_Initial', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next' };
const NEW = netStcFromRoles(BAG)!;
const NEW_EV = netStcFromRoles({ ...BAG, simEvent: 'C_Event', simTrigger: 'R_trigger' })!;

const NO_GUARDS: GuardOracle = () => ({ kind: 'true' });
const NO_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });

const triggerList = (on: string | string[] | undefined) => (on === undefined ? [] : Array.isArray(on) ? [...on] : [on]);

/** Today's view, as step.test.ts and events.test.ts build it. */
function oldView(f: Fixture): SimModelView {
    return {
        exists: id => id in f.instances || id in f.transitions,
        isInstanceOf: (id, classId) => f.instances[id]?.cls === classId,
        outgoingTransitions: id => [...(f.instances[id]?.out ?? [])],
        transitionTarget: t => f.transitions[t]?.to ?? null,
        transitionTriggers: t => triggerList(f.transitions[t]?.on),
    };
}

/** The same fixture read by pointer, as the compiler reads it. */
function newView(f: Fixture): NetModelView {
    return {
        ...oldView(f),
        references: (o, feature) => {
            if (feature === 'R_out') return [...(f.instances[o]?.out ?? [])];
            if (feature === 'R_next') { const to = f.transitions[o]?.to; return to ? [to] : []; }
            if (feature === 'R_trigger') return triggerList(f.transitions[o]?.on);
            return [];
        },
        values: () => [],
    };
}

function compile(f: Fixture, events: boolean): CompiledNet {
    return compileNet(events ? NEW_EV : NEW, newView(f), 'M', [...Object.keys(f.instances), ...Object.keys(f.transitions)]);
}

function state(ids: readonly string[]): SimState {
    return { marking: new Map(ids.map(id => [id, 1])), attrs: new Map(), presentation: new Map() };
}

function oldCfg(event: string | null, ...ids: string[]): SimConfiguration {
    return { marking: new Set(ids), event };
}

function newCfg(event: string | null, ...ids: string[]): NetConfiguration {
    return { state: state(ids), event };
}

const cands = (net: CompiledNet, c: NetConfiguration) => candidates(net, c, NO_GUARDS).candidates.map(x => x.transition);
const marked = (s: SimState) => [...s.marking].filter(([, n]) => n !== 0).map(([p]) => p).sort();

/**
 * Runs both steps along `inputs` from `start`. On each step the new core has
 * at most one candidate (the trace is deterministic), and after it the derived
 * boolean view equals today's set on every element of the fixture.
 */
function parityTrace(f: Fixture, events: boolean, start: string[], inputs: Array<string | null>): string[] {
    const net = compile(f, events);
    const elements = [...Object.keys(f.instances), ...Object.keys(f.transitions)];
    let old: SimConfiguration = oldCfg(null, ...start);
    let neu: NetConfiguration = newCfg(null, ...start);
    const trace: string[] = [];
    for (const e of inputs) {
        const o = stepFlowchartBoolean({ marking: old.marking, event: e }, events ? OLD_EV : OLD, oldView(f));
        const c = { state: neu.state, event: e };
        const cs = cands(net, c);
        expect(cs.length).toBeLessThanOrEqual(1);
        const out = step(net, c, cs[0] ?? null, NO_GUARDS, NO_ACTIONS);
        expect(out.kind).not.toBe('halted');
        expect(out.kind).not.toBe('inadmissible');
        if (out.kind === 'halted' || out.kind === 'inadmissible') break;
        old = o.next;
        neu = out.next;
        for (const id of elements) expect(isMarked(neu.state, id)).toBe(old.marking.has(id));
        trace.push(marked(neu.state).join());
    }
    return trace;
}

// ── fixtures, copied from step.test.ts and events.test.ts ──────────────────

const CHAIN: Fixture = {
    instances: { A: { cls: 'C_Initial', out: ['t1'] }, B: { cls: 'C_State', out: ['t2'] }, C: { cls: 'C_Final' } },
    transitions: { t1: { to: 'B' }, t2: { to: 'C' } },
};
const LOOP: Fixture = { instances: { A: { cls: 'C_State', out: ['loop'] } }, transitions: { loop: { to: 'A' } } };
const TURNSTILE: Fixture = {
    instances: {
        Locked: { cls: 'C_Initial', out: ['tCoin', 'tPushL'] }, Unlocked: { cls: 'C_State', out: ['tPushU'] },
        F: { cls: 'C_Final' }, coin: { cls: 'C_Event' }, push: { cls: 'C_Event' },
    },
    transitions: { tCoin: { to: 'Unlocked', on: 'coin' }, tPushU: { to: 'Locked', on: 'push' }, tPushL: { to: 'Locked', on: 'push' } },
};
const FORK3: Fixture = {
    instances: { A: { cls: 'C_State', out: ['t1', 't2', 't3'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' } },
    transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'C', on: 'push' }, t3: { to: null } },
};

describe('parity: the derived isMarked equals today\'s Set on every deterministic trace (R-SIM-11)', () => {
    it('linear chain (step.test.ts:75), then the terminal: frozen today, terminated now', () => {
        expect(parityTrace(CHAIN, false, ['A'], [null, null, null])).toEqual(['B', 'C', 'C']);
    });

    it('self-loop (step.test.ts:142): consume then produce keeps A, as activation-wins did', () => {
        expect(parityTrace(LOOP, false, ['A'], [null, null])).toEqual(['A', 'A']);
    });

    it('empty configuration (step.test.ts:158): nothing fires', () => {
        expect(parityTrace(CHAIN, false, [], [null])).toEqual(['']);
    });

    it('control without the terminal mark (step.test.ts:129): A fires', () => {
        const f: Fixture = { instances: { F: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
        expect(parityTrace(f, false, ['A'], [null])).toEqual(['B']);
    });

    it('an event without the role is discarded (events.test.ts:141)', () => {
        expect(parityTrace(FORK3, false, ['A'], ['coin'])).toEqual(['A']);
    });

    it('the whole turnstile trace (events.test.ts:275)', () => {
        expect(parityTrace(TURNSTILE, true, ['Locked'], ['coin', 'coin', 'push', 'push', 'coin']))
            .toEqual(['Unlocked', 'Unlocked', 'Locked', 'Locked', 'Unlocked']);
    });

    it('identity match of the trigger (events.test.ts:159, :165)', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['t'] }, B: { cls: 'C_State' }, coin1: { cls: 'C_Event' }, coin2: { cls: 'C_Event' } },
            transitions: { t: { to: 'B', on: 'coin1' } },
        };
        expect(parityTrace(f, true, ['A'], ['coin2', 'coin1'])).toEqual(['A', 'B']);
    });

    it('ε and an event restrict the transitions (events.test.ts:179, :185)', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['tE', 'tC'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { tE: { to: 'B' }, tC: { to: 'C', on: 'coin' } },
        };
        expect(parityTrace(f, true, ['A'], [null])).toEqual(['B']);
        expect(parityTrace(f, true, ['A'], ['coin'])).toEqual(['C']);
    });

    it('a multi-valued trigger accepts any of its values (events.test.ts:191)', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['t'] }, B: { cls: 'C_State' }, coin: { cls: 'C_Event' }, push: { cls: 'C_Event' }, kick: { cls: 'C_Event' } },
            transitions: { t: { to: 'B', on: ['coin', 'push'] } },
        };
        expect(parityTrace(f, true, ['A'], ['kick', 'push'])).toEqual(['A', 'B']);
        expect(parityTrace(f, true, ['A'], ['coin'])).toEqual(['B']);
    });

    it('a marked instance with nothing accepted stays while another fires (events.test.ts:207)', () => {
        const f: Fixture = {
            instances: {
                A: { cls: 'C_State', out: ['tP'] }, B: { cls: 'C_State' }, X: { cls: 'C_State', out: ['tX'] }, Y: { cls: 'C_State' },
                coin: { cls: 'C_Event' }, push: { cls: 'C_Event' },
            },
            transitions: { tP: { to: 'B', on: 'push' }, tX: { to: 'Y', on: 'coin' } },
        };
        expect(parityTrace(f, true, ['A', 'X'], ['coin'])).toEqual(['A,Y']);
    });

    it('statuses that agree: Running on a live marking, Terminated on the final one', () => {
        const net = compile(TURNSTILE, true);
        expect(runStatus(oldCfg(null, 'Locked'), OLD_EV, oldView(TURNSTILE))).toBe('Running');
        expect(netRunStatus(net, newCfg(null, 'Locked'), ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
        expect(runStatus(oldCfg(null, 'F'), OLD_EV, oldView(TURNSTILE))).toBe('Terminated');
        expect(netRunStatus(net, newCfg(null, 'F'), ['coin', 'push'], NO_GUARDS, null)).toBe('Terminated');
    });
});

// ── the 20 decisions of report §7 ───────────────────────────────────────────

describe('decisions: what R-SIM-21..33 change, each beside today\'s answer', () => {
    it('step.test.ts:89, R-SIM-7: a fork fired all its transitions; now two candidates and one firing', () => {
        const f: Fixture = { instances: { A: { cls: 'C_Initial', out: ['t1', 't2'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' } }, transitions: { t1: { to: 'B' }, t2: { to: 'C' } } };
        expect([...stepFlowchartBoolean(oldCfg(null, 'A'), OLD, oldView(f)).next.marking].sort()).toEqual(['B', 'C']);
        const net = compile(f, false);
        expect(cands(net, newCfg(null, 'A'))).toEqual(['t1', 't2']);
        const out = step(net, newCfg(null, 'A'), 't2', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['C']);
    });

    it('step.test.ts:99, R-SIM-7 and R-SIM-23: a join collapsed two tokens into one mark; now the second arrival is unsafe', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State', out: ['t2'] }, C: { cls: 'C_State' } }, transitions: { t1: { to: 'C' }, t2: { to: 'C' } } };
        expect([...stepFlowchartBoolean(oldCfg(null, 'A', 'B'), OLD, oldView(f)).next.marking]).toEqual(['C']);
        const net = compile(f, false);
        expect(cands(net, newCfg(null, 'A', 'B'))).toEqual(['t1', 't2']);
        const first = step(net, newCfg(null, 'A', 'B'), 't1', NO_GUARDS, NO_ACTIONS);
        expect(first.kind === 'fired' && marked(first.next.state)).toEqual(['B', 'C']);
        if (first.kind !== 'fired') return;
        expect(candidates(net, first.next, NO_GUARDS).candidates).toEqual([{ transition: 't2', unsafe: { place: 'C', value: 2 } }]);
    });

    it('step.test.ts:109, R-SIM-31: a dangling transition consumed the source token; now it is a compile defect and A stays', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['tUnset', 'tGone'] } }, transitions: { tUnset: { to: null }, tGone: { to: 'DELETED' } } };
        expect([...stepFlowchartBoolean(oldCfg(null, 'A'), OLD, oldView(f)).next.marking]).toEqual([]);
        const net = compile(f, false);
        expect(net.defects.map(d => [d.element, d.code])).toEqual([['tUnset', 'no-target'], ['tGone', 'no-target']]);
        const out = step(net, newCfg(null, 'A'), null, NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'quiescence' && marked(out.next.state)).toEqual(['A']);
    });

    it('step.test.ts:119, R-SIM-27: any marked terminal froze the run; now A still fires, F is not all of the marking', () => {
        const f: Fixture = { instances: { F: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
        const frozen = oldCfg(null, 'F', 'A');
        expect(stepFlowchartBoolean(frozen, OLD, oldView(f)).next).toBe(frozen);
        const net = compile(f, false);
        const out = step(net, newCfg(null, 'F', 'A'), 't1', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['B', 'F']);
    });

    it('step.test.ts:149, R-SIM-7 and R-SIM-23: two tokens swapping stayed both marked; now each firing is unsafe', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['tAB'] }, B: { cls: 'C_State', out: ['tBA'] } }, transitions: { tAB: { to: 'B' }, tBA: { to: 'A' } } };
        expect([...stepFlowchartBoolean(oldCfg(null, 'A', 'B'), OLD, oldView(f)).next.marking].sort()).toEqual(['A', 'B']);
        expect(candidates(compile(f, false), newCfg(null, 'A', 'B'), NO_GUARDS).candidates).toEqual([
            { transition: 'tAB', unsafe: { place: 'B', value: 2 } }, { transition: 'tBA', unsafe: { place: 'A', value: 2 } },
        ]);
    });

    it('step.test.ts:167, R-SIM-13: a marked id no longer in the model is kept by the core too; the run interruption of 3b removes the case', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
        expect([...stepFlowchartBoolean(oldCfg(null, 'A', 'DELETED'), OLD, oldView(f)).next.marking].sort()).toEqual(['B', 'DELETED']);
        const net = compile(f, false);
        expect(net.places.has('DELETED')).toBe(false);
        const out = step(net, newCfg(null, 'A', 'DELETED'), 't1', NO_GUARDS, NO_ACTIONS);
        // Report §7 measured a difference through its bench shim, which dropped unknown ids;
        // the core itself carries an unknown token as given and never enables anything with it.
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['B', 'DELETED']);
    });

    const STATUS: Fixture = {
        instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State', out: ['t2'] }, Stuck: { cls: 'C_State' }, F: { cls: 'C_Final' } },
        transitions: { t1: { to: 'B' }, t2: { to: 'A' } },
    };
    const status = (...ids: string[]) => [
        runStatus(oldCfg(null, ...ids), OLD, oldView(STATUS)),
        netRunStatus(compile(STATUS, false), newCfg(null, ...ids), [], NO_GUARDS, null),
    ];

    it('step.test.ts:200, R-SIM-27 and R-SIM-29: F with A was Terminated; now Running', () => {
        expect(status('F', 'A')).toEqual(['Terminated', 'Running']);
    });

    it('step.test.ts:204, R-SIM-27 and R-SIM-29: F with a stuck token was Terminated; now Deadlock', () => {
        expect(status('F', 'Stuck')).toEqual(['Terminated', 'Deadlock']);
    });

    it('step.test.ts:208, R-SIM-29: one stuck token made Deadlock while A could move; now Running', () => {
        expect(status('A', 'Stuck')).toEqual(['Deadlock', 'Running']);
    });

    it('step.test.ts:215, R-SIM-21: activation-wins has no counterpart; a self-loop keeps its token by arithmetic', () => {
        expect([...applyStepLabel(new Set(['A', 'X']), ['A'], ['A', 'B'])].sort()).toEqual(['A', 'B', 'X']);
        const out = step(compile(LOOP, false), newCfg(null, 'A'), 'loop', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && [out.label.consumed, out.label.produced, marked(out.next.state)])
            .toEqual([[{ place: 'A', weight: 1 }], [{ place: 'A', weight: 1 }], ['A']]);
    });

    it('step.test.ts:255, R-SIM-27 and R-SIM-23: a marked subclass of terminal froze A; now A moves into SubF and is unsafe', () => {
        const f: Fixture = { instances: { SubF: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t2'] } }, transitions: { t2: { to: 'SubF' } } };
        expect(stepFlowchartBoolean(oldCfg(null, 'SubF', 'A'), OLD, oldView(f)).label.fired).toEqual([]);
        expect(candidates(compile(f, false), newCfg(null, 'SubF', 'A'), NO_GUARDS).candidates)
            .toEqual([{ transition: 't2', unsafe: { place: 'SubF', value: 2 } }]);
    });

    it('events.test.ts:90, R-SIM-7 and R-SIM-31: without the role ε fired every transition; now t1, t2 are candidates and t3 is a defect', () => {
        expect([...stepFlowchartBoolean(oldCfg(null, 'A'), OLD, oldView(FORK3)).next.marking].sort()).toEqual(['B', 'C']);
        const net = compile(FORK3, false);
        expect(cands(net, newCfg(null, 'A'))).toEqual(['t1', 't2']);
        expect(net.defects.map(d => d.element)).toEqual(['t3']);
    });

    it('events.test.ts:111, R-SIM-29: the Step button stayed enabled on a stuck marking; now it is structural on the net', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' }, Stuck: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
        const net = compile(f, false);
        expect(epsilonEnabled(oldCfg(null, 'Stuck'), OLD, oldView(f))).toBe(true);
        expect(structuralInputs(net, state(['Stuck'])).epsilon).toBe(false);
        expect(structuralInputs(net, state(['A'])).epsilon).toBe(true);
    });

    it('events.test.ts:133, R-SIM-7: with half an event role both transitions of Locked fired; now they are two candidates', () => {
        expect(stepFlowchartBoolean(oldCfg(null, 'Locked'), { kind: 'boolean', roles: { ...ENGINE, event: 'C_Event' } }, oldView(TURNSTILE)).label.fired)
            .toEqual(['tCoin', 'tPushL']);
        const half = netStcFromRoles({ ...BAG, simEvent: 'C_Event' })!;
        const net = compileNet(half, newView(TURNSTILE), 'M', [...Object.keys(TURNSTILE.instances), ...Object.keys(TURNSTILE.transitions)]);
        expect(cands(net, newCfg(null, 'Locked'))).toEqual(['tCoin', 'tPushL']);
    });

    it('events.test.ts:223, R-SIM-7 (announced as provisional): one event on two transitions of a node split the token; now one fires', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['t1', 't2'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'C', on: 'coin' } },
        };
        expect([...stepFlowchartBoolean(oldCfg('coin', 'A'), OLD_EV, oldView(f)).next.marking].sort()).toEqual(['B', 'C']);
        expect(cands(compile(f, true), newCfg('coin', 'A'))).toEqual(['t1', 't2']);
    });

    it('events.test.ts:234, R-SIM-7 (announced as provisional): one event moved every token; now one token per step', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' }, X: { cls: 'C_State', out: ['t2'] }, Y: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'Y', on: 'coin' } },
        };
        expect([...stepFlowchartBoolean(oldCfg('coin', 'A', 'X'), OLD_EV, oldView(f)).next.marking].sort()).toEqual(['B', 'Y']);
        const out = step(compile(f, true), newCfg('coin', 'A', 'X'), 't1', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['B', 'X']);
    });

    it('events.test.ts:263, R-SIM-27: an event on F with Locked was discarded; now coin fires', () => {
        expect(stepFlowchartBoolean(oldCfg('coin', 'F', 'Locked'), OLD_EV, oldView(TURNSTILE)).label.discarded).toBe(true);
        const out = step(compile(TURNSTILE, true), newCfg('coin', 'F', 'Locked'), 'tCoin', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['F', 'Unlocked']);
    });

    it('events.test.ts:296, R-SIM-27: the event buttons were off with F and Locked; now coin and push are on, and the run is Running', () => {
        expect(runStatus(oldCfg(null, 'F', 'Locked'), OLD_EV, oldView(TURNSTILE))).toBe('Terminated');
        const net = compile(TURNSTILE, true);
        expect([...structuralInputs(net, state(['F', 'Locked'])).events].sort()).toEqual(['coin', 'push']);
        expect(netRunStatus(net, newCfg(null, 'F', 'Locked'), ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
    });

    it('events.test.ts:301, R-SIM-27: ε was off with F and Unlocked; now the untriggered tAuto enables it', () => {
        const f: Fixture = {
            instances: { Locked: { cls: 'C_Initial', out: ['tCoin'] }, Unlocked: { cls: 'C_State', out: ['tAuto'] }, F: { cls: 'C_Final' }, coin: { cls: 'C_Event' } },
            transitions: { tCoin: { to: 'Unlocked', on: 'coin' }, tAuto: { to: 'Locked' } },
        };
        expect(epsilonEnabled(oldCfg(null, 'F', 'Unlocked'), OLD_EV, oldView(f))).toBe(false);
        expect(structuralInputs(compile(f, true), state(['F', 'Unlocked'])).epsilon).toBe(true);
    });

    it('events.test.ts:322, R-SIM-29: Locked with a stuck token was Deadlock; now Running, Locked waits on its events', () => {
        const f: Fixture = { ...TURNSTILE, instances: { ...TURNSTILE.instances, Stuck: { cls: 'C_State' } } };
        expect(runStatus(oldCfg(null, 'Locked', 'Stuck'), OLD_EV, oldView(f))).toBe('Deadlock');
        expect(netRunStatus(compile(f, true), newCfg(null, 'Locked', 'Stuck'), ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
    });
});
