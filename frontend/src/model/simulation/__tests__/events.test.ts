/**
 * events — step 1 of the plan (R-SIM-16), P-2026-09-23-1850.
 *
 * Executes the core (P11): `stepFlowchartBoolean`, `eventAlphabet`,
 * `enabledEvents`, `epsilonEnabled`, `runStatus`, `stcFromRoles`,
 * `roleOverlaps`, `classIsKindOf` and the raw slot readers, against fake views
 * and raw lookups. `step.test.ts` is not touched: it is the parity oracle of the
 * slice 0 step, and it still runs with no event role.
 *
 * The tests named `provisional:` pin the fire-all restricted by the event
 * (option (a) of discovery_2026-09-23_sim_step1_events.md §3.2). They are
 * expected to be reversed by interleaving in step 3 (R-SIM-7), and that change
 * must be a decision, not an accident.
 *
 * Every "nothing happens" is paired with the same call where something does (P12).
 */

import { describe, it, expect } from 'vitest';
import { enabledEvents, epsilonEnabled, eventAlphabet, runStatus, stepFlowchartBoolean } from '../step';
import { overlapVerdict, roleOverlaps, roleWriteVerdict, stcFromRoles } from '../stcFromRoles';
import { classIsKindOf, isKindOf } from '../isKindOf';
import { objectLabel, objectReferences, objectSlotValues } from '../objectSlots';
import type { SimConfiguration, SimModelView, StcDescriptor } from '../types';

const ENGINE = { initial: 'C_Initial', terminal: 'C_Final', ownedTransitions: 'R_out', nextState: 'R_next' };
/** No event role: the alphabet is {ε}. */
const STC: StcDescriptor = { kind: 'boolean', roles: { ...ENGINE } };
/** The event role declared. */
const STC_EV: StcDescriptor = { kind: 'boolean', roles: { ...ENGINE, event: 'C_Event', trigger: 'R_trigger' } };

interface Fixture {
    /** instance id -> metaclass id and owned transition ids */
    instances: Record<string, { cls: string; out?: string[] }>;
    /** transition id -> target id (null: unset) and trigger event id(s) (absent: none) */
    transitions: Record<string, { to: string | null; on?: string | string[] }>;
    labels?: Record<string, string>;
}

function makeView(f: Fixture, calls?: { trigger: number }): SimModelView {
    return {
        exists: id => id in f.instances || id in f.transitions,
        isInstanceOf: (id, classId) => f.instances[id]?.cls === classId,
        outgoingTransitions: id => [...(f.instances[id]?.out ?? [])],
        transitionTarget: t => f.transitions[t]?.to ?? null,
        transitionTriggers: t => {
            if (calls) calls.trigger++;
            const on = f.transitions[t]?.on;
            return on === undefined ? [] : Array.isArray(on) ? [...on] : [on];
        },
        label: id => f.labels?.[id] ?? id,
    };
}

function config(event: string | null, ...ids: string[]): SimConfiguration {
    return { marking: new Set(ids), event };
}

function marked(c: SimConfiguration): string[] {
    return [...c.marking].sort();
}

/**
 * The turnstile of the visual check: Locked -coin-> Unlocked, Unlocked -push-> Locked,
 * Locked -push-> Locked. Final is the terminal metaclass, with one instance used only
 * where a test marks it.
 */
const TURNSTILE: Fixture = {
    instances: {
        Locked: { cls: 'C_Initial', out: ['tCoin', 'tPushL'] },
        Unlocked: { cls: 'C_State', out: ['tPushU'] },
        F: { cls: 'C_Final' },
        coin: { cls: 'C_Event' },
        push: { cls: 'C_Event' },
    },
    transitions: {
        tCoin: { to: 'Unlocked', on: 'coin' },
        tPushU: { to: 'Locked', on: 'push' },
        tPushL: { to: 'Locked', on: 'push' },
    },
    labels: { coin: 'coin', push: 'push' },
};

describe('parity: without the event role the step is the slice 0 step', () => {
    // The fixture HAS triggers: a core that reads them without checking the role changes these results.
    const fork: Fixture = {
        instances: { A: { cls: 'C_State', out: ['t1', 't2', 't3'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' } },
        transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'C', on: 'push' }, t3: { to: null } },
    };

    it('ε fires every transition, triggered or not, and never asks the view for a trigger', () => {
        const calls = { trigger: 0 };
        const s = stepFlowchartBoolean(config(null, 'A'), STC, makeView(fork, calls));
        expect(marked(s.next)).toEqual(['B', 'C']);
        expect(s.label).toEqual({ fired: ['t1', 't2', 't3'], deactivated: ['A'], activated: ['B', 'C'] });
        expect(calls.trigger).toBe(0);
        // control: the same fixture with the role fires the untriggered t3 only, and asks
        const withRole = stepFlowchartBoolean(config(null, 'A'), STC_EV, makeView(fork, calls));
        expect(withRole.label.fired).toEqual(['t3']);
        expect(calls.trigger).toBeGreaterThan(0);
    });

    it('an ε step label keeps the slice 0 shape: no event, no discarded', () => {
        const s = stepFlowchartBoolean(config(null, 'A'), STC_EV, makeView(fork));
        expect('event' in s.label).toBe(false);
        expect('discarded' in s.label).toBe(false);
        const quiet = stepFlowchartBoolean(config(null), STC_EV, makeView(fork));
        expect(quiet.label).toEqual({ fired: [], deactivated: [], activated: [] });
        expect('discarded' in quiet.label).toBe(false);
    });

    it('the Step button follows the slice 0 rule: disabled only when a marked instance is terminal', () => {
        const view = makeView({
            instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' }, Stuck: { cls: 'C_State' }, F: { cls: 'C_Final' } },
            transitions: { t1: { to: 'B', on: 'coin' } },
        });
        const cases = [config(null), config(null, 'A'), config(null, 'Stuck'), config(null, 'A', 'Stuck'), config(null, 'F'), config(null, 'F', 'A')];
        for (const c of cases) {
            expect(epsilonEnabled(c, STC, view)).toBe(runStatus(c, STC, view) !== 'Terminated');
        }
        expect(epsilonEnabled(config(null, 'Stuck'), STC, view)).toBe(true);
        expect(epsilonEnabled(config(null, 'F', 'A'), STC, view)).toBe(false);
    });

    it('no event buttons and an empty alphabet without the role', () => {
        const view = makeView(TURNSTILE);
        expect([...enabledEvents(config(null, 'Locked'), STC, view)]).toEqual([]);
        expect(eventAlphabet(STC, view, ['Locked', 'coin', 'push'])).toEqual([]);
        // control
        expect([...enabledEvents(config(null, 'Locked'), STC_EV, view)].sort()).toEqual(['coin', 'push']);
        expect(eventAlphabet(STC_EV, view, ['Locked', 'coin', 'push']).map(e => e.id)).toEqual(['coin', 'push']);
    });

    it('a descriptor with the event metaclass and no trigger has no event role', () => {
        const half: StcDescriptor = { kind: 'boolean', roles: { ...ENGINE, event: 'C_Event' } };
        const view = makeView(TURNSTILE);
        expect(eventAlphabet(half, view, ['coin', 'push'])).toEqual([]);
        expect([...enabledEvents(config(null, 'Locked'), half, view)]).toEqual([]);
        expect(stepFlowchartBoolean(config(null, 'Locked'), half, view).label.fired).toEqual(['tCoin', 'tPushL']);
    });

    it('an event without the role accepts nothing: it is discarded, the engine stays total', () => {
        const s = stepFlowchartBoolean(config('coin', 'A'), STC, makeView(fork));
        expect(marked(s.next)).toEqual(['A']);
        expect(s.label).toEqual({ fired: [], deactivated: [], activated: [], event: 'coin', discarded: true });
    });
});

describe('the trigger matches the event by identity (R-SIM-16)', () => {
    // coin1 and coin2: two instances of the same event metaclass, with the same label.
    const view = makeView({
        instances: {
            A: { cls: 'C_State', out: ['t'] }, B: { cls: 'C_State' },
            coin1: { cls: 'C_Event' }, coin2: { cls: 'C_Event' },
        },
        transitions: { t: { to: 'B', on: 'coin1' } },
        labels: { coin1: 'coin', coin2: 'coin' },
    });

    it('the trigger instance fires the transition', () => {
        const s = stepFlowchartBoolean(config('coin1', 'A'), STC_EV, view);
        expect(marked(s.next)).toEqual(['B']);
        expect(s.label).toEqual({ fired: ['t'], deactivated: ['A'], activated: ['B'], event: 'coin1', discarded: false });
    });

    it('another instance of the same metaclass, with the same label, does not', () => {
        const s = stepFlowchartBoolean(config('coin2', 'A'), STC_EV, view);
        expect(marked(s.next)).toEqual(['A']);
        expect(s.label.discarded).toBe(true);
        expect([...enabledEvents(config(null, 'A'), STC_EV, view)]).toEqual(['coin1']);
    });
});

describe('the input restricts the fire-all (option (a))', () => {
    const view = makeView({
        instances: { A: { cls: 'C_State', out: ['tE', 'tC'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
        transitions: { tE: { to: 'B' }, tC: { to: 'C', on: 'coin' } },
    });

    it('ε fires only the transitions without a trigger', () => {
        const s = stepFlowchartBoolean(config(null, 'A'), STC_EV, view);
        expect(marked(s.next)).toEqual(['B']);
        expect(s.label.fired).toEqual(['tE']);
    });

    it('an event fires only the transitions it triggers', () => {
        const s = stepFlowchartBoolean(config('coin', 'A'), STC_EV, view);
        expect(marked(s.next)).toEqual(['C']);
        expect(s.label.fired).toEqual(['tC']);
    });

    it('a multi-valued trigger accepts any of its values, and enables each of them', () => {
        const v = makeView({
            instances: {
                A: { cls: 'C_State', out: ['t'] }, B: { cls: 'C_State' },
                coin: { cls: 'C_Event' }, push: { cls: 'C_Event' }, kick: { cls: 'C_Event' },
            },
            transitions: { t: { to: 'B', on: ['coin', 'push'] } },
        });
        expect(marked(stepFlowchartBoolean(config('coin', 'A'), STC_EV, v).next)).toEqual(['B']);
        expect(marked(stepFlowchartBoolean(config('push', 'A'), STC_EV, v).next)).toEqual(['B']);
        expect(stepFlowchartBoolean(config('kick', 'A'), STC_EV, v).label.discarded).toBe(true);
        expect([...enabledEvents(config(null, 'A'), STC_EV, v)].sort()).toEqual(['coin', 'push']);
        // a triggered transition, however many values, is not an ε transition
        expect(epsilonEnabled(config(null, 'A'), STC_EV, v)).toBe(false);
    });

    it('a marked instance with nothing accepted stays marked while another fires', () => {
        const v = makeView({
            instances: {
                A: { cls: 'C_State', out: ['tP'] }, B: { cls: 'C_State' },
                X: { cls: 'C_State', out: ['tX'] }, Y: { cls: 'C_State' },
                coin: { cls: 'C_Event' }, push: { cls: 'C_Event' },
            },
            transitions: { tP: { to: 'B', on: 'push' }, tX: { to: 'Y', on: 'coin' } },
        });
        const s = stepFlowchartBoolean(config('coin', 'A', 'X'), STC_EV, v);
        expect(marked(s.next)).toEqual(['A', 'Y']);
        expect(s.label).toEqual({ fired: ['tX'], deactivated: ['X'], activated: ['Y'], event: 'coin', discarded: false });
    });

    // PROVISIONAL, reversed by step 3 (R-SIM-7): interleaving fires ONE of the two
    // transitions, chosen by the selector. Until then one event marks both targets.
    it('provisional (reversed by interleaving in step 3, R-SIM-7): an event accepted by two transitions of one node fires both and splits the token', () => {
        const v = makeView({
            instances: { A: { cls: 'C_State', out: ['t1', 't2'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' }, coin: { cls: 'C_Event' } },
            transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'C', on: 'coin' } },
        });
        const s = stepFlowchartBoolean(config('coin', 'A'), STC_EV, v);
        expect(marked(s.next)).toEqual(['B', 'C']);
        expect(s.label.fired).toEqual(['t1', 't2']);
    });

    // PROVISIONAL, reversed by step 3 (R-SIM-7): interleaving moves one token per step.
    it('provisional (reversed by interleaving in step 3, R-SIM-7): one event moves every marked instance that accepts it', () => {
        const v = makeView({
            instances: {
                A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' },
                X: { cls: 'C_State', out: ['t2'] }, Y: { cls: 'C_State' }, coin: { cls: 'C_Event' },
            },
            transitions: { t1: { to: 'B', on: 'coin' }, t2: { to: 'Y', on: 'coin' } },
        });
        const s = stepFlowchartBoolean(config('coin', 'A', 'X'), STC_EV, v);
        expect(marked(s.next)).toEqual(['B', 'Y']);
    });
});

describe('discard: an event that fires nothing is a step at unchanged marking', () => {
    const view = makeView(TURNSTILE);

    it('coin on Unlocked is discarded and consumed; push moves the token', () => {
        const input = config('coin', 'Unlocked');
        const s = stepFlowchartBoolean(input, STC_EV, view);
        expect(marked(s.next)).toEqual(['Unlocked']);
        expect(s.next.event).toBeNull();
        expect(s.label).toEqual({ fired: [], deactivated: [], activated: [], event: 'coin', discarded: true });
        // control
        const p = stepFlowchartBoolean(config('push', 'Unlocked'), STC_EV, view);
        expect(marked(p.next)).toEqual(['Locked']);
        expect(p.next.event).toBeNull();
        expect(p.label).toEqual({ fired: ['tPushU'], deactivated: ['Unlocked'], activated: ['Locked'], event: 'push', discarded: false });
    });

    it('an event on a frozen run is consumed and discarded; ε on a frozen run returns the input itself', () => {
        const frozen = config('coin', 'F', 'Locked');
        const s = stepFlowchartBoolean(frozen, STC_EV, view);
        expect(marked(s.next)).toEqual(['F', 'Locked']);
        expect(s.next.event).toBeNull();
        expect(s.label).toEqual({ fired: [], deactivated: [], activated: [], event: 'coin', discarded: true });
        const eps = config(null, 'F', 'Locked');
        expect(stepFlowchartBoolean(eps, STC_EV, view).next).toBe(eps);
        // control: without F, coin fires
        expect(stepFlowchartBoolean(config('coin', 'Locked'), STC_EV, view).label.fired).toEqual(['tCoin']);
    });

    it('the whole turnstile trace', () => {
        let c = config(null, 'Locked');
        const trace: string[] = [];
        for (const e of ['coin', 'coin', 'push', 'push', 'coin']) {
            const s = stepFlowchartBoolean({ marking: c.marking, event: e }, STC_EV, view);
            c = s.next;
            trace.push(`${e}:${marked(c).join()}${s.label.discarded ? '(discarded)' : ''}`);
        }
        expect(trace).toEqual(['coin:Unlocked', 'coin:Unlocked(discarded)', 'push:Locked', 'push:Locked', 'coin:Unlocked']);
    });
});

describe('enabling (R-SIM-16): structural, on the marked instances', () => {
    const view = makeView(TURNSTILE);

    it('event buttons: Locked enables coin and push, Unlocked enables push only', () => {
        expect([...enabledEvents(config(null, 'Locked'), STC_EV, view)].sort()).toEqual(['coin', 'push']);
        expect([...enabledEvents(config(null, 'Unlocked'), STC_EV, view)]).toEqual(['push']);
        expect([...enabledEvents(config(null), STC_EV, view)]).toEqual([]);
    });

    it('event buttons are disabled on Terminated', () => {
        expect([...enabledEvents(config(null, 'F', 'Locked'), STC_EV, view)]).toEqual([]);
        expect(runStatus(config(null, 'F', 'Locked'), STC_EV, view)).toBe('Terminated');
    });

    it('the Step button (ε) with the role: enabled iff a transition without a trigger leaves a marked instance', () => {
        const v = makeView({
            instances: {
                Locked: { cls: 'C_Initial', out: ['tCoin'] },
                Unlocked: { cls: 'C_State', out: ['tAuto'] },
                F: { cls: 'C_Final' }, coin: { cls: 'C_Event' },
            },
            transitions: { tCoin: { to: 'Unlocked', on: 'coin' }, tAuto: { to: 'Locked' } },
        });
        expect(epsilonEnabled(config(null, 'Locked'), STC_EV, v)).toBe(false);
        expect(epsilonEnabled(config(null, 'Unlocked'), STC_EV, v)).toBe(true);
        expect(epsilonEnabled(config(null), STC_EV, v)).toBe(false);
        // an untriggered transition enables ε, never an event button
        expect([...enabledEvents(config(null, 'Unlocked'), STC_EV, v)]).toEqual([]);
        expect([...enabledEvents(config(null, 'Locked'), STC_EV, v)]).toEqual(['coin']);
        // disabled on Terminated even when an untriggered transition leaves a marked instance
        expect(epsilonEnabled(config(null, 'F', 'Unlocked'), STC_EV, v)).toBe(false);
        // control: without the role, Locked alone keeps the Step button enabled (slice 0 rule)
        expect(epsilonEnabled(config(null, 'Locked'), STC, v)).toBe(true);
    });

    it('runStatus: with the role, a marked instance whose transitions all have a trigger is waiting, not Deadlock', () => {
        expect(runStatus(config(null, 'Locked'), STC_EV, view)).toBe('Running');
        expect(epsilonEnabled(config(null, 'Locked'), STC_EV, view)).toBe(false);
        // control: an instance with no outgoing transition at all is still Deadlock
        const v = makeView({ ...TURNSTILE, instances: { ...TURNSTILE.instances, Stuck: { cls: 'C_State' } } });
        expect(runStatus(config(null, 'Locked', 'Stuck'), STC_EV, v)).toBe('Deadlock');
    });
});

describe('eventAlphabet', () => {
    it('lists the event instances among the ids, sorted by label, then by id', () => {
        const view = makeView({
            instances: {
                e3: { cls: 'C_Event' }, e1: { cls: 'C_Event' }, e2: { cls: 'C_Event' }, S: { cls: 'C_State' },
            },
            transitions: {},
            labels: { e1: 'push', e2: 'coin', e3: 'coin' },
        });
        expect(eventAlphabet(STC_EV, view, ['S', 'e3', 'e1', 'e2'])).toEqual([
            { id: 'e2', label: 'coin' }, { id: 'e3', label: 'coin' }, { id: 'e1', label: 'push' },
        ]);
        // only the ids given count
        expect(eventAlphabet(STC_EV, view, ['S', 'e1']).map(e => e.id)).toEqual(['e1']);
    });

    it('uses the view label, and the id when the view has none', () => {
        const base = makeView({ instances: { e1: { cls: 'C_Event' } }, transitions: {}, labels: { e1: 'coin' } });
        expect(eventAlphabet(STC_EV, base, ['e1'])).toEqual([{ id: 'e1', label: 'coin' }]);
        const { label: _unused, ...noLabel } = base;
        expect(eventAlphabet(STC_EV, noLabel, ['e1'])).toEqual([{ id: 'e1', label: 'e1' }]);
    });
});

describe('stcFromRoles: the event role is optional, and all or nothing', () => {
    const engine = { simInitial: 'C_Initial', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next' };

    it('reads the three keys', () => {
        expect(stcFromRoles({ ...engine, simEvent: 'C_Event', simTrigger: 'R_trigger', simEventIdentifier: 'A_label' })?.roles).toEqual({
            ...ENGINE, event: 'C_Event', trigger: 'R_trigger', eventIdentifier: 'A_label',
        });
    });

    it('the identifier is optional', () => {
        expect(stcFromRoles({ ...engine, simEvent: 'C_Event', simTrigger: 'R_trigger' })?.roles).toEqual({
            ...ENGINE, event: 'C_Event', trigger: 'R_trigger',
        });
    });

    it('one of simEvent and simTrigger alone is no event role; the identifier alone neither', () => {
        expect(stcFromRoles({ ...engine, simEvent: 'C_Event', simEventIdentifier: 'A_label' })?.roles).toEqual(ENGINE);
        expect(stcFromRoles({ ...engine, simTrigger: 'R_trigger', simEventIdentifier: 'A_label' })?.roles).toEqual(ENGINE);
        expect(stcFromRoles({ ...engine, simEventIdentifier: 'A_label' })?.roles).toEqual(ENGINE);
        expect(stcFromRoles({ ...engine, simEvent: '', simTrigger: 'R_trigger' })?.roles).toEqual(ENGINE);
    });

    it('the event keys do not make the run controls appear without the four engine keys', () => {
        const { simNextState, ...partial } = engine;
        expect(stcFromRoles({ ...partial, simEvent: 'C_Event', simTrigger: 'R_trigger' })).toBeNull();
    });
});

describe('roleOverlaps: the STC roles are disjoint under "is a" (R-SIM-16)', () => {
    const lookup: Record<string, any> = {
        C_Node: { className: 'DClass', extends: [] },
        C_Initial: { className: 'DClass', extends: ['C_Node'] },
        C_Final: { className: 'DClass', extends: ['C_Node'] },
        C_NodeSub: { className: 'DClass', extends: ['C_Node'] },
        C_Deep: { className: 'DClass', extends: ['C_NodeSub'] },
        C_Trans: { className: 'DClass', extends: [] },
        C_Event: { className: 'DClass', extends: [] },
        C_SubEvent: { className: 'DClass', extends: ['C_Event'] },
        C_Both: { className: 'DClass', extends: ['C_Event', 'C_Node'] },
    };
    const disjoint = { simNode: 'C_Node', simInitial: 'C_Initial', simTerminal: 'C_Final', simTransition: 'C_Trans', simEvent: 'C_Event' };
    const concrete = ['C_Initial', 'C_Final', 'C_NodeSub', 'C_Trans', 'C_Event', 'C_SubEvent'];

    it('disjoint roles: no overlap; initial and terminal are nodes, not a sort of their own', () => {
        expect(roleOverlaps(lookup, disjoint, concrete)).toBeNull();
    });

    it('the same class in two sorts, even when it is not among the classes given', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_Trans' }, [])).toEqual({ classId: 'C_Trans', sorts: ['transition', 'event'] });
    });

    it('the event class a subclass of the node class, directly or transitively', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_NodeSub' }, concrete)?.sorts).toEqual(['node', 'event']);
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_Deep' }, concrete)).toEqual({ classId: 'C_Deep', sorts: ['node', 'event'] });
    });

    it('the overlap names the role class the user picked before any subclass of it', () => {
        // C_Final (terminal, a node) is also a kind of C_Node: both overlap once the event role is C_Node.
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_Node' }, ['C_Final', ...concrete])?.classId).toBe('C_Node');
    });

    it('the node class a subclass of the event class (the reverse direction)', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simNode: 'C_SubEvent' }, concrete)?.sorts).toEqual(['node', 'event']);
    });

    it('a class inheriting from two sorts through several extends', () => {
        expect(roleOverlaps(lookup, disjoint, [...concrete, 'C_Both'])).toEqual({ classId: 'C_Both', sorts: ['node', 'event'] });
        // control: the same roles without that class among the classes given
        expect(roleOverlaps(lookup, disjoint, concrete)).toBeNull();
    });

    it('run start: without the event role a node/transition overlap is a warning, the run starts', () => {
        const { simEvent, ...noEvent } = disjoint;
        const v = overlapVerdict(lookup, { ...noEvent, simTransition: 'C_NodeSub' }, concrete);
        expect(v).toEqual({ overlap: { classId: 'C_NodeSub', sorts: ['node', 'transition'] }, refuse: false });
        // simEvent alone is no event role (the trigger is missing): still a warning
        expect(overlapVerdict(lookup, { ...noEvent, simEvent: 'C_Event', simTransition: 'C_NodeSub' }, concrete)?.refuse).toBe(false);
        expect(overlapVerdict(lookup, disjoint, concrete)).toBeNull();
    });

    it('run start: with the event role declared every overlap refuses the run', () => {
        const withRole = { ...disjoint, simTrigger: 'R_trigger' };
        expect(overlapVerdict(lookup, { ...withRole, simTransition: 'C_NodeSub' }, concrete))
            .toEqual({ overlap: { classId: 'C_NodeSub', sorts: ['node', 'transition'] }, refuse: true });
        expect(overlapVerdict(lookup, { ...withRole, simEvent: 'C_NodeSub' }, concrete)?.refuse).toBe(true);
        expect(overlapVerdict(lookup, withRole, concrete)).toBeNull();
    });

    it('save: judged after the save; without the event role a node/transition overlap is a warning, the save goes through', () => {
        const { simEvent, ...noEvent } = disjoint;
        expect(roleWriteVerdict(lookup, noEvent, 'simTransition', 'C_NodeSub', concrete))
            .toEqual({ overlap: { classId: 'C_NodeSub', sorts: ['node', 'transition'] }, refuse: false });
        // clearing simTrigger on an overlapping metamodel turns the refusal into a warning
        const overlapping = { ...disjoint, simTrigger: 'R_trigger', simTransition: 'C_NodeSub' };
        expect(overlapVerdict(lookup, overlapping, concrete)?.refuse).toBe(true);
        expect(roleWriteVerdict(lookup, overlapping, 'simTrigger', '', concrete)?.refuse).toBe(false);
        // control: a disjoint save has no verdict
        expect(roleWriteVerdict(lookup, noEvent, 'simTransition', 'C_Trans', concrete)).toBeNull();
    });

    it('save: with the event role any overlap refuses, including adding the event role to an overlapping metamodel', () => {
        const withRole = { ...disjoint, simTrigger: 'R_trigger' };
        expect(roleWriteVerdict(lookup, withRole, 'simTransition', 'C_NodeSub', concrete)?.refuse).toBe(true);
        // node and transition already overlap, simEvent set: saving simTrigger adds the event role
        const overlapNoTrigger = { ...disjoint, simTransition: 'C_NodeSub' };
        expect(overlapVerdict(lookup, overlapNoTrigger, concrete)?.refuse).toBe(false);
        expect(roleWriteVerdict(lookup, overlapNoTrigger, 'simTrigger', 'R_trigger', concrete)?.refuse).toBe(true);
    });

    it('unset or empty keys count for nothing', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: '', simTransition: undefined }, [...concrete, 'C_Both'])).toBeNull();
    });

    it('fork and join are nodes: fork and join classes extending the node class are no overlap (step 3b)', () => {
        const withFork = { ...lookup, C_Fork: { className: 'DClass', extends: ['C_Node'] }, C_Join: { className: 'DClass', extends: ['C_Node'] } };
        expect(roleOverlaps(withFork, { ...disjoint, simFork: 'C_Fork', simJoin: 'C_Join' }, [...concrete, 'C_Fork', 'C_Join'])).toBeNull();
        // control: a fork class that is the transition class overlaps
        expect(roleOverlaps(withFork, { ...disjoint, simFork: 'C_Trans' }, concrete)).toEqual({ classId: 'C_Trans', sorts: ['node', 'transition'] });
    });

    it('arcs are a sort of their own; an inhibitor arc class extending the arc class is no overlap (step 3b)', () => {
        const withArcs = { ...lookup, C_Arc: { className: 'DClass', extends: [] }, C_Inh: { className: 'DClass', extends: ['C_Arc'] } };
        expect(roleOverlaps(withArcs, { ...disjoint, simArc: 'C_Arc', simInhibitorArc: 'C_Inh' }, [...concrete, 'C_Arc', 'C_Inh'])).toBeNull();
        // control: an arc class that is the transition class overlaps
        expect(roleOverlaps(withArcs, { ...disjoint, simArc: 'C_Trans' }, concrete)).toEqual({ classId: 'C_Trans', sorts: ['transition', 'arc'] });
    });

    it('the Petri shape refuses any overlap, as the event role does; control flow without events still warns (R-SIM-37)', () => {
        const { simEvent, ...noEvent } = disjoint;
        const overlapping = { ...noEvent, simTransition: 'C_NodeSub' };
        expect(overlapVerdict(lookup, overlapping, concrete)?.refuse).toBe(false);
        expect(overlapVerdict(lookup, { ...overlapping, simArc: 'C_Arc' }, concrete)?.refuse).toBe(true);
        expect(roleWriteVerdict(lookup, overlapping, 'simArc', 'C_Arc', concrete)?.refuse).toBe(true);
        // control: clearing the arc role turns the refusal back into a warning
        expect(roleWriteVerdict(lookup, { ...overlapping, simArc: 'C_Arc' }, 'simArc', '', concrete)?.refuse).toBe(false);
    });

    it('classIsKindOf walks from a class, transitively, never downwards; isKindOf agrees through the instance', () => {
        expect(classIsKindOf(lookup, 'C_Deep', 'C_Node')).toBe(true);
        expect(classIsKindOf(lookup, 'C_Node', 'C_Deep')).toBe(false);
        expect(classIsKindOf(lookup, 'C_Both', 'C_Event')).toBe(true);
        const withObject = { ...lookup, o: { className: 'DObject', instanceof: 'C_Deep' } };
        expect(isKindOf(withObject, 'o', 'C_Node')).toBe(classIsKindOf(withObject, 'C_Deep', 'C_Node'));
    });
});

describe('raw slot readers, by the feature pointer', () => {
    // Shape measured on the live editor (P-2026-09-23-1850, _tmp_sim1_verify.ts): a DObject lists
    // its DValue ids in `features`; each DValue's `instanceof` is the DECLARING feature, which for
    // an inherited attribute is the superclass's DAttribute. A never-set reference holds [null].
    const lookup: Record<string, any> = {
        A_label: { className: 'DAttribute', name: 'label' },
        A_name: { className: 'DAttribute', name: 'name' },
        A_count: { className: 'DAttribute', name: 'count' },
        R_trigger: { className: 'DReference', name: 'trigger' },
        coin: { className: 'DObject', features: ['v_coin_label', 'v_coin_name'] },
        v_coin_label: { className: 'DValue', instanceof: 'A_label', values: ['Coin'] },
        v_coin_name: { className: 'DValue', instanceof: 'A_name', values: ['coinName'] },
        push: { className: 'DObject', features: ['v_push_label', 'v_push_name'] },
        v_push_label: { className: 'DValue', instanceof: 'A_label', values: ['  '] },
        // DValue.name kept stale on purpose: the `name` feature is found by the declaring feature's name
        v_push_name: { className: 'DValue', name: 'oldName', instanceof: 'A_name', values: ['push'] },
        Pointer1790195771751_USER_128: { className: 'DObject', features: ['v_bare_label', 'v_bare_count'] },
        v_bare_label: { className: 'DValue', instanceof: 'A_label', values: [] },
        v_bare_count: { className: 'DValue', instanceof: 'A_count', values: [0] },
        t1: { className: 'DObject', features: ['v_t1_trigger'] },
        v_t1_trigger: { className: 'DValue', instanceof: 'R_trigger', values: ['coin', 'push'] },
        t2: { className: 'DObject', features: ['v_t2_trigger'] },
        v_t2_trigger: { className: 'DValue', instanceof: 'R_trigger', values: [null] },
    };

    it('objectSlotValues drops null and undefined, keeps 0, answers [] for a missing slot or object', () => {
        expect(objectSlotValues(lookup, 't1', 'R_trigger')).toEqual(['coin', 'push']);
        expect(objectSlotValues(lookup, 't2', 'R_trigger')).toEqual([]);
        expect(objectSlotValues(lookup, 'Pointer1790195771751_USER_128', 'A_count')).toEqual([0]);
        expect(objectSlotValues(lookup, 't1', 'A_label')).toEqual([]);
        expect(objectSlotValues(lookup, 'nobody', 'R_trigger')).toEqual([]);
    });

    it('objectReferences: every id in slot order, [] for a never-set reference', () => {
        expect(objectReferences(lookup, 't1', 'R_trigger')).toEqual(['coin', 'push']);
        expect(objectReferences(lookup, 't2', 'R_trigger')).toEqual([]);
    });

    it('objectLabel: identifier, else the name feature, else a shortened id', () => {
        expect(objectLabel(lookup, 'coin', 'A_label')).toBe('Coin');
        expect(objectLabel(lookup, 'coin')).toBe('coinName');
        expect(objectLabel(lookup, 'push', 'A_label')).toBe('push');
        expect(objectLabel(lookup, 'Pointer1790195771751_USER_128', 'A_label')).toBe('…_128');
        expect(objectLabel(lookup, 'Pointer1790195771751_USER_128', 'A_count')).toBe('0');
    });

    it('end to end over the raw lookup, with a view built as the panel adapter builds it', () => {
        const raw: Record<string, any> = {
            ...lookup,
            C_Event: { className: 'DClass', extends: [] },
            C_SubEvent: { className: 'DClass', extends: ['C_Event'] },
            C_State: { className: 'DClass', extends: [] },
            ev1: { className: 'DObject', instanceof: 'C_SubEvent', features: ['v_ev1_label'] },
            v_ev1_label: { className: 'DValue', instanceof: 'A_label', values: ['go'] },
            S: { className: 'DObject', instanceof: 'C_State', out: ['tr'] },
            T: { className: 'DObject', instanceof: 'C_State', out: [] },
            tr: { className: 'DObject', next: 'T', features: ['v_tr_trigger'] },
            v_tr_trigger: { className: 'DValue', instanceof: 'R_trigger', values: ['ev1'] },
        };
        const stc: StcDescriptor = { kind: 'boolean', roles: { ...ENGINE, event: 'C_Event', trigger: 'R_trigger', eventIdentifier: 'A_label' } };
        const view: SimModelView = {
            exists: id => !!raw[id],
            isInstanceOf: (id, classId) => isKindOf(raw, id, classId),
            outgoingTransitions: id => [...(raw[id]?.out ?? [])],
            transitionTarget: t => raw[t]?.next ?? null,
            transitionTriggers: t => objectReferences(raw, t, 'R_trigger'),
            label: id => objectLabel(raw, id, stc.roles.eventIdentifier),
        };
        expect(eventAlphabet(stc, view, ['S', 'T', 'ev1'])).toEqual([{ id: 'ev1', label: 'go' }]);
        expect([...enabledEvents(config(null, 'S'), stc, view)]).toEqual(['ev1']);
        expect(marked(stepFlowchartBoolean(config('ev1', 'S'), stc, view).next)).toEqual(['T']);
    });
});
