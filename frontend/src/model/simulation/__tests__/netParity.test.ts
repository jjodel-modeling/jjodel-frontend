/**
 * netParity — the Petri core against the boolean step it replaced (step 3a,
 * P-2026-09-25-0935; rewritten by step 3b, P-2026-09-25-1103, when the old step
 * was deleted).
 *
 * Two parts:
 *
 * - golden traces: the marked sets that the old step produced on every
 *   deterministic trace of step.test.ts and events.test.ts, kept as literals
 *   (proven against the old step in `c400a5163`, the commit before its deletion,
 *   by the test «golden traces: the literals are the old step's output»). Here
 *   they run through the whole path of the panel: the fixture as a raw lookup,
 *   `startRun` of the bridge, `simReset`, then per input `pressInput` (candidates,
 *   step, `simCommit`), and after each step `isSimActive` on every element, the
 *   boolean view the canvas reads (R-SIM-11);
 * - decisions: the 20 differences measured in report §7
 *   (docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md), each pinned
 *   on the new core, the old answer in the test name, with the ratification
 *   that changed it.
 *
 * Plus two checks the deleted step.test.ts held and no net test repeated
 * (report §9.3 of docs/discovery/discovery_2026-09-25_sim_step3b_panel.md).
 */

import { beforeEach, describe, it, expect } from 'vitest';
import { candidates, netRunStatus, step, structuralInputs } from '../netStep';
import { compileNet, netStcFromRoles } from '../netCompile';
import { pressInput, startRun } from '../../../components/editor-v2/sim/simBridge';
import { __resetSimRunsForTests, getSimActiveIds, getSimRun, isSimActive, simReset } from '../../../components/editor-v2/sim/simRunState';
import type { SimModelView } from '../types';
import type { ActionOracle, CompiledNet, GuardOracle, NetConfiguration, NetModelView, SimState } from '../netTypes';

interface Fixture {
    instances: Record<string, { cls: string; out?: string[] }>;
    transitions: Record<string, { to: string | null; on?: string | string[] }>;
}

const BAG = { simInitial: 'C_Initial', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next' };
const BAG_EV = { ...BAG, simEvent: 'C_Event', simTrigger: 'R_trigger' };
const NEW = netStcFromRoles(BAG)!;
const NEW_EV = netStcFromRoles(BAG_EV)!;

const NO_GUARDS: GuardOracle = () => ({ kind: 'true' });
const NO_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });

const triggerList = (on: string | string[] | undefined) => (on === undefined ? [] : Array.isArray(on) ? [...on] : [on]);

/** The committed read interface over a fixture, as the old tests built it. */
function baseView(f: Fixture): SimModelView {
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
        ...baseView(f),
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

function newCfg(event: string | null, ...ids: string[]): NetConfiguration {
    return { state: state(ids), event };
}

const cands = (net: CompiledNet, c: NetConfiguration) => candidates(net, c, NO_GUARDS).candidates.map(x => x.transition);
const marked = (s: SimState) => [...s.marking].filter(([, n]) => n !== 0).map(([p]) => p).sort();

/**
 * A fixture as the store holds it: the metamodel MM with the role bag, the
 * model M, one DObject per instance and transition (father M), the slots as
 * DValues by feature pointer (R_out, R_next, R_trigger).
 */
function rawLookup(f: Fixture, events: boolean): Record<string, any> {
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM', name: 'mm', _state: events ? { ...BAG_EV } : { ...BAG } },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
    };
    for (const c of ['C_Initial', 'C_State', 'C_Final', 'C_Event', 'C_Trans']) lookup[c] = { className: 'DClass', id: c, name: c, extends: [] };
    const object = (id: string, cls: string, slots: Record<string, string[]>) => {
        const features: string[] = [];
        for (const [f, values] of Object.entries(slots)) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values, father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: cls, father: 'M', name: id, features };
    };
    for (const [id, i] of Object.entries(f.instances)) object(id, i.cls, i.out ? { R_out: [...i.out] } : {});
    for (const [id, t] of Object.entries(f.transitions)) {
        object(id, 'C_Trans', { ...(t.to !== null ? { R_next: [t.to] } : {}), ...(t.on !== undefined ? { R_trigger: triggerList(t.on) } : {}) });
    }
    return lookup;
}

// ── fixtures, copied from the deleted step.test.ts and from events.test.ts ─

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

// ── the golden traces (report §9.4 of step 3b) ─────────────────────────────

/**
 * The marked sets of every deterministic trace above, as literals: the oracle
 * that survives the old step. Proven here against the old step while it still
 * exists; after its deletion the same table runs through the bridge and the store.
 */
const GOLDEN: Array<{ name: string; f: Fixture; events: boolean; start: string[]; inputs: Array<string | null>; trace: string[] }> = [
    { name: 'linear chain (step.test.ts:75)', f: CHAIN, events: false, start: ['A'], inputs: [null, null, null], trace: ['B', 'C', 'C'] },
    { name: 'self-loop (step.test.ts:142)', f: LOOP, events: false, start: ['A'], inputs: [null, null], trace: ['A', 'A'] },
    { name: 'empty configuration (step.test.ts:158)', f: CHAIN, events: false, start: [], inputs: [null], trace: [''] },
    {
        name: 'control without the terminal mark (step.test.ts:129)', events: false, start: ['A'], inputs: [null], trace: ['B'],
        f: { instances: { F: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } },
    },
    { name: 'an event without the role is discarded (events.test.ts:141)', f: FORK3, events: false, start: ['A'], inputs: ['coin'], trace: ['A'] },
    {
        name: 'the whole turnstile trace (events.test.ts:275)', f: TURNSTILE, events: true, start: ['Locked'],
        inputs: ['coin', 'coin', 'push', 'push', 'coin'], trace: ['Unlocked', 'Unlocked', 'Locked', 'Locked', 'Unlocked'],
    },
    {
        name: 'identity match of the trigger (events.test.ts:159, :165)', events: true, start: ['A'], inputs: ['coin2', 'coin1'], trace: ['A', 'B'],
        f: {
            instances: { A: { cls: 'C_State', out: ['t'] }, B: { cls: 'C_State' }, coin1: { cls: 'C_Event' }, coin2: { cls: 'C_Event' } },
            transitions: { t: { to: 'B', on: 'coin1' } },
        },
    },
    ...([[null, 'B'], ['coin', 'C']] as Array<[string | null, string]>).map(([input, to]) => ({
        name: `ε and an event restrict the transitions (events.test.ts:179, :185): ${input ?? 'ε'}`, events: true, start: ['A'], inputs: [input], trace: [to],
        f: {
            instances: { A: { cls: 'C_State', out: ['tE', 'tC'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { tE: { to: 'B' }, tC: { to: 'C', on: 'coin' } },
        } as Fixture,
    })),
    ...([[['kick', 'push'], ['A', 'B']], [['coin'], ['B']]] as Array<[string[], string[]]>).map(([inputs, trace]) => ({
        name: `a multi-valued trigger accepts any of its values (events.test.ts:191): ${inputs.join(' ')}`, events: true, start: ['A'], inputs, trace,
        f: {
            instances: { A: { cls: 'C_State', out: ['t'] }, B: { cls: 'C_State' }, coin: { cls: 'C_Event' }, push: { cls: 'C_Event' }, kick: { cls: 'C_Event' } },
            transitions: { t: { to: 'B', on: ['coin', 'push'] } },
        } as Fixture,
    })),
    {
        name: 'a marked instance with nothing accepted stays while another fires (events.test.ts:207)', events: true, start: ['A', 'X'], inputs: ['coin'], trace: ['A,Y'],
        f: {
            instances: {
                A: { cls: 'C_State', out: ['tP'] }, B: { cls: 'C_State' }, X: { cls: 'C_State', out: ['tX'] }, Y: { cls: 'C_State' },
                coin: { cls: 'C_Event' }, push: { cls: 'C_Event' },
            },
            transitions: { tP: { to: 'B', on: 'push' }, tX: { to: 'Y', on: 'coin' } },
        },
    },
];

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('golden traces through the bridge and the store: isSimActive equals the old step\'s Set after each step (R-SIM-11)', () => {
    for (const g of GOLDEN) {
        it(g.name, () => {
            const lookup = rawLookup(g.f, g.events);
            const start = startRun(lookup, 'M', 'MM', '', () => ({ instances: [] }));
            if (start.kind !== 'started') throw new Error(start.reason);
            simReset('M', { ...start.run, config: { state: state(g.start), event: null } });
            const elements = [...Object.keys(g.f.instances), ...Object.keys(g.f.transitions)];
            const seen: string[] = [];
            g.inputs.forEach((e, i) => {
                const pressed = pressInput('M', e, undefined, lookup, e ?? 'ε');
                expect(pressed.pending).toBeNull();                              // deterministic: at most one candidate
                expect(pressed.outcome?.kind).not.toBe('halted');
                const want = new Set(g.trace[i] === '' ? [] : g.trace[i].split(','));
                for (const id of elements) expect([id, isSimActive(id)]).toEqual([id, want.has(id)]);
                seen.push(getSimActiveIds('M').sort().join());
            });
            expect(seen).toEqual(g.trace);
        });
    }

    it('statuses that agree with the old ones: Running on a live marking, Terminated on the final one', () => {
        const net = compile(TURNSTILE, true);
        expect(netRunStatus(net, newCfg(null, 'Locked'), ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
        expect(netRunStatus(net, newCfg(null, 'F'), ['coin', 'push'], NO_GUARDS, null)).toBe('Terminated');
        // and through the store: the run of the turnstile starts Running
        const lookup = rawLookup(TURNSTILE, true);
        const start = startRun(lookup, 'M', 'MM', '', () => ({ instances: [] }));
        if (start.kind !== 'started') throw new Error(start.reason);
        simReset('M', start.run);
        const run = getSimRun('M')!;
        expect(netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt)).toBe('Running');
    });
});

describe('two checks of the deleted step.test.ts (report §9.3)', () => {
    it('a step does not mutate its input configuration (step.test.ts:174)', () => {
        const net = compile(CHAIN, false);
        const cfg = newCfg(null, 'A');
        const before = [...cfg.state.marking];
        const out = step(net, cfg, 't1', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['B']);
        expect([...cfg.state.marking]).toEqual(before);
        expect(cfg.event).toBeNull();
    });

    it('a role value that is not a string counts as unset (step.test.ts:326)', () => {
        for (const key of ['simInitial', 'simOwnedTransitions', 'simNextState']) {
            expect(netStcFromRoles({ ...BAG, [key]: 42 })).toBeNull();
        }
        // control: the same bag with strings builds the STC
        expect(netStcFromRoles(BAG)).not.toBeNull();
    });
});

describe('decisions: what R-SIM-21..33 changed, the old answer in each name', () => {
    it('step.test.ts:89, R-SIM-7: a fork fired all its transitions; now two candidates and one firing', () => {
        const f: Fixture = { instances: { A: { cls: 'C_Initial', out: ['t1', 't2'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' } }, transitions: { t1: { to: 'B' }, t2: { to: 'C' } } };
        const net = compile(f, false);
        expect(cands(net, newCfg(null, 'A'))).toEqual(['t1', 't2']);
        const out = step(net, newCfg(null, 'A'), 't2', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['C']);
    });

    it('step.test.ts:99, R-SIM-7 and R-SIM-23: a join collapsed two tokens into one mark; now the second arrival is unsafe', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State', out: ['t2'] }, C: { cls: 'C_State' } }, transitions: { t1: { to: 'C' }, t2: { to: 'C' } } };
        const net = compile(f, false);
        expect(cands(net, newCfg(null, 'A', 'B'))).toEqual(['t1', 't2']);
        const first = step(net, newCfg(null, 'A', 'B'), 't1', NO_GUARDS, NO_ACTIONS);
        expect(first.kind === 'fired' && marked(first.next.state)).toEqual(['B', 'C']);
        if (first.kind !== 'fired') return;
        expect(candidates(net, first.next, NO_GUARDS).candidates).toEqual([{ transition: 't2', unsafe: { place: 'C', value: 2 } }]);
    });

    it('step.test.ts:109, R-SIM-31: a dangling transition consumed the source token; now it is a compile defect and A stays', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['tUnset', 'tGone'] } }, transitions: { tUnset: { to: null }, tGone: { to: 'DELETED' } } };
        const net = compile(f, false);
        expect(net.defects.map(d => [d.element, d.code])).toEqual([['tUnset', 'no-target'], ['tGone', 'no-target']]);
        const out = step(net, newCfg(null, 'A'), null, NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'quiescence' && marked(out.next.state)).toEqual(['A']);
    });

    it('step.test.ts:119, R-SIM-27: any marked terminal froze the run; now A still fires, F is not all of the marking', () => {
        const f: Fixture = { instances: { F: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
        const net = compile(f, false);
        const out = step(net, newCfg(null, 'F', 'A'), 't1', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['B', 'F']);
    });

    it('step.test.ts:149, R-SIM-7 and R-SIM-23: two tokens swapping stayed both marked; now each firing is unsafe', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['tAB'] }, B: { cls: 'C_State', out: ['tBA'] } }, transitions: { tAB: { to: 'B' }, tBA: { to: 'A' } } };
        expect(candidates(compile(f, false), newCfg(null, 'A', 'B'), NO_GUARDS).candidates).toEqual([
            { transition: 'tAB', unsafe: { place: 'B', value: 2 } }, { transition: 'tBA', unsafe: { place: 'A', value: 2 } },
        ]);
    });

    it('step.test.ts:167, R-SIM-13: a marked id no longer in the model is kept by the core too; the run interruption of 3b removes the case', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
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
    const status = (...ids: string[]) => netRunStatus(compile(STATUS, false), newCfg(null, ...ids), [], NO_GUARDS, null);

    it('step.test.ts:200, R-SIM-27 and R-SIM-29: F with A was Terminated; now Running', () => {
        expect(status('F', 'A')).toBe('Running');
    });

    it('step.test.ts:204, R-SIM-27 and R-SIM-29: F with a stuck token was Terminated; now Deadlock', () => {
        expect(status('F', 'Stuck')).toBe('Deadlock');
    });

    it('step.test.ts:208, R-SIM-29: one stuck token made Deadlock while A could move; now Running', () => {
        expect(status('A', 'Stuck')).toBe('Running');
    });

    it('step.test.ts:215, R-SIM-21: activation-wins has no counterpart; a self-loop keeps its token by arithmetic', () => {
        const out = step(compile(LOOP, false), newCfg(null, 'A'), 'loop', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && [out.label.consumed, out.label.produced, marked(out.next.state)])
            .toEqual([[{ place: 'A', weight: 1 }], [{ place: 'A', weight: 1 }], ['A']]);
    });

    it('step.test.ts:255, R-SIM-27 and R-SIM-23: a marked subclass of terminal froze A; now A moves into SubF and is unsafe', () => {
        const f: Fixture = { instances: { SubF: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t2'] } }, transitions: { t2: { to: 'SubF' } } };
        expect(candidates(compile(f, false), newCfg(null, 'SubF', 'A'), NO_GUARDS).candidates)
            .toEqual([{ transition: 't2', unsafe: { place: 'SubF', value: 2 } }]);
    });

    it('events.test.ts:90, R-SIM-7 and R-SIM-31: without the role ε fired every transition; now t1, t2 are candidates and t3 is a defect', () => {
        const net = compile(FORK3, false);
        expect(cands(net, newCfg(null, 'A'))).toEqual(['t1', 't2']);
        expect(net.defects.map(d => d.element)).toEqual(['t3']);
    });

    it('events.test.ts:111, R-SIM-29: the Step button stayed enabled on a stuck marking; now it is structural on the net', () => {
        const f: Fixture = { instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' }, Stuck: { cls: 'C_State' } }, transitions: { t1: { to: 'B' } } };
        const net = compile(f, false);
        expect(structuralInputs(net, state(['Stuck'])).epsilon).toBe(false);
        expect(structuralInputs(net, state(['A'])).epsilon).toBe(true);
    });

    it('events.test.ts:133, R-SIM-7: with half an event role both transitions of Locked fired; now they are two candidates', () => {
        const half = netStcFromRoles({ ...BAG, simEvent: 'C_Event' })!;
        const net = compileNet(half, newView(TURNSTILE), 'M', [...Object.keys(TURNSTILE.instances), ...Object.keys(TURNSTILE.transitions)]);
        expect(cands(net, newCfg(null, 'Locked'))).toEqual(['tCoin', 'tPushL']);
    });

    it('events.test.ts:223, R-SIM-7 (announced as provisional): one event on two transitions of a node split the token; now one fires', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['t1', 't2'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'C', on: 'coin' } },
        };
        expect(cands(compile(f, true), newCfg('coin', 'A'))).toEqual(['t1', 't2']);
    });

    it('events.test.ts:234, R-SIM-7 (announced as provisional): one event moved every token; now one token per step', () => {
        const f: Fixture = {
            instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' }, X: { cls: 'C_State', out: ['t2'] }, Y: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'Y', on: 'coin' } },
        };
        const out = step(compile(f, true), newCfg('coin', 'A', 'X'), 't1', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['B', 'X']);
    });

    it('events.test.ts:263, R-SIM-27: an event on F with Locked was discarded; now coin fires', () => {
        const out = step(compile(TURNSTILE, true), newCfg('coin', 'F', 'Locked'), 'tCoin', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && marked(out.next.state)).toEqual(['F', 'Unlocked']);
    });

    it('events.test.ts:296, R-SIM-27: the event buttons were off with F and Locked; now coin and push are on, and the run is Running', () => {
        const net = compile(TURNSTILE, true);
        expect([...structuralInputs(net, state(['F', 'Locked'])).events].sort()).toEqual(['coin', 'push']);
        expect(netRunStatus(net, newCfg(null, 'F', 'Locked'), ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
    });

    it('events.test.ts:301, R-SIM-27: ε was off with F and Unlocked; now the untriggered tAuto enables it', () => {
        const f: Fixture = {
            instances: { Locked: { cls: 'C_Initial', out: ['tCoin'] }, Unlocked: { cls: 'C_State', out: ['tAuto'] }, F: { cls: 'C_Final' }, coin: { cls: 'C_Event' } },
            transitions: { tCoin: { to: 'Unlocked', on: 'coin' }, tAuto: { to: 'Locked' } },
        };
        expect(structuralInputs(compile(f, true), state(['F', 'Unlocked'])).epsilon).toBe(true);
    });

    it('events.test.ts:322, R-SIM-29: Locked with a stuck token was Deadlock; now Running, Locked waits on its events', () => {
        const f: Fixture = { ...TURNSTILE, instances: { ...TURNSTILE.instances, Stuck: { cls: 'C_State' } } };
        expect(netRunStatus(compile(f, true), newCfg(null, 'Locked', 'Stuck'), ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
    });
});
