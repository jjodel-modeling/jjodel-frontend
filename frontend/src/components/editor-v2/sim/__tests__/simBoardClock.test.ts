/**
 * simBoardClock — the Clock of the I/O board: time as an environment source
 * (R-SIM-122; P-2026-10-04-0150, docs/discovery/discovery_2026-10-04_sim_io_clock.md).
 *
 * A small microwave under Extended state machine, shaped as the store keeps it
 * (simBridge.test.ts): `idle`, `cooking`, `done` (terminal), `stuck` (no way out)
 * and `spinning` (an ε loop, for Play); events `plus`, `start`, `tick`, `quit`,
 * `jam`, `spin`; the global `secs` (0..120). The run is started by the bridge with a
 * synthetic record of `buildEvalContext`, every press goes through `pressInput` as
 * the panel's `fire` makes it, and Play is the panel's `setTimeout` chain over
 * `playPress`. Time is vitest's fake clock. Each test name says which break of the
 * rule kills it; the mutation bench is in the commit message.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { clockOffText, createClocks } from '../simBoardClock';
import type { ClockOff, Clocks } from '../simBoardClock';
import { playPress, pressInput, runStatus, startRun } from '../simBridge';
import type { ContextBuilder } from '../simBridge';
import { stateValueOf } from '../simCanvasState';
import { __resetSimRunsForTests, getSimRun, simClear, simReset } from '../simRunState';

type Lookup = Record<string, any>;

const CLASSES: Lookup = {
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
};

const ROLES = {
    simInitial: 'C_Init', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger',
    simEventIdentifier: 'A_label', simGuard: 'A_guard', simAction: 'A_effect',
};

type Obj = { cls: string; slots?: Record<string, unknown[]> };

const OBJECTS: Record<string, Obj> = {
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

const GLOBALS = JSON.stringify({
    v: 1,
    attrs: [{ name: 'secs', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 120 }, initial: '0' }],
});

function buildLookup(): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(CLASSES)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', name: 'Oven', _state: { ...ROLES, simProfile: 'extendedStateMachine' } };
    lookup.M = { className: 'DModel', id: 'M', name: 'microwave', instanceof: 'MM', _state: { simStateAttributes: GLOBALS } };
    for (const [id, o] of Object.entries(OBJECTS)) {
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

const build: ContextBuilder = () => {
    const h: Record<string, any> = {};
    for (const id of Object.keys(OBJECTS)) h[id] = { id, __type: 'Object', name: id };
    return { instances: Object.values(h), classes: [], ...h };
};

let lookup: Lookup;
/** The presses the clocks sent, in order. */
let presses: string[];
/** The input dialog or a choice list waits on the user (the panel's `asking`, `pending`). */
let waiting: boolean;
let changes: number;

/** Reset, then the hand presses, each through `pressInput` as the panel's `fire` makes it. */
function reset(hand: string[] = []): void {
    const r = startRun(lookup, 'M', 'MM', 'P', build);
    if (r.kind !== 'started') throw new Error(r.reason);
    simReset('M', r.run);
    for (const e of hand) pressInput('M', e, undefined, lookup, e);
}

function clocks(): Clocks {
    return createClocks({
        run: () => getSimRun('M'),
        waiting: () => waiting,
        press: event => { presses.push(event); pressInput('M', event, undefined, lookup, event); },
        changed: () => { changes++; },
    });
}

const steps = () => getSimRun('M')?.trace?.length ?? 0;
const secs = () => stateValueOf(getSimRun('M')!.config.state, 'semantic', 'M', 'secs');
const offOf = (c: Clocks, id = 'k') => c.state(id)?.off ?? null;

beforeEach(() => {
    __resetSimRunsForTests();
    vi.useFakeTimers();
    lookup = buildLookup();
    presses = [];
    waiting = false;
    changes = 0;
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ticking: one press of the bound event per period, through the panel\'s press (decision 3)', () => {
    it('N periods give N presses, the first one period after switching on; each is one step, so ticks and step n agree (mutants: first tick at the switch-on; two timers)', () => {
        reset(['plus', 'plus', 'plus', 'start']);
        expect([steps(), secs()]).toEqual([4, 90]);
        const c = clocks();
        expect(c.start('k', 'tick', 1000)).toBe(true);
        vi.advanceTimersByTime(999);
        expect(presses).toEqual([]);
        vi.advanceTimersByTime(1);
        expect(presses).toEqual(['tick']);
        vi.advanceTimersByTime(4000);
        expect(presses).toEqual(['tick', 'tick', 'tick', 'tick', 'tick']);
        expect(c.state('k')).toEqual({ on: true, ticks: 5, dropped: 0, off: null });
        expect([steps(), secs()]).toEqual([9, 85]);
    });

    it('the period is the record\'s: 250 ms gives four presses a second (mutant: a fixed pace)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 250);
        vi.advanceTimersByTime(1000);
        expect(presses).toHaveLength(4);
        expect(secs()).toBe(26);
    });

    it('a tick whose event enables nothing is discarded as a hand press is, and the clock keeps ticking (mutant: off at a discard)', () => {
        reset();
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(3000);
        expect(presses).toHaveLength(3);
        expect(getSimRun('M')!.trace!.map(t => t.kind)).toEqual(['discard', 'discard', 'discard']);
        expect(c.state('k')?.on).toBe(true);
    });

    it('two clocks tick independently, each at its own period', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('a', 'tick', 1000);
        c.start('b', 'plus', 500);
        vi.advanceTimersByTime(1000);
        expect([c.state('a')?.ticks, c.state('b')?.ticks]).toEqual([1, 2]);
    });

    it('switching on is refused without a run, after the run ended, and with a period out of range: nothing ticks (mutants: on without a run; period not checked)', () => {
        const c = clocks();
        expect(c.start('k', 'tick', 1000)).toBe(false);
        reset();
        expect(c.start('k', 'tick', 50)).toBe(false);
        expect(c.start('k', 'tick', 60001)).toBe(false);
        reset(['quit']);
        expect(runStatus(getSimRun('M')!)).toBe('Terminated');
        expect(c.start('k', 'tick', 1000)).toBe(false);
        vi.advanceTimersByTime(5000);
        expect([presses, c.state('k')]).toEqual([[], undefined]);
    });

    it('every change of a clock is announced, so the card re-renders its face (mutant: changed not called)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        const afterStart = changes;
        expect(afterStart).toBeGreaterThan(0);
        vi.advanceTimersByTime(1000);
        expect(changes).toBeGreaterThan(afterStart);
        const afterTick = changes;
        c.stop('k');
        expect(changes).toBeGreaterThan(afterTick);
    });
});

describe('off: when the run ends, at Reset, when the run goes, when the board changes, by hand (decision 5)', () => {
    const ended: Array<[string, ClockOff, string[]]> = [
        ['quit', 'Terminated', []],
        ['jam', 'Deadlock', []],
        ['plus', 'Halted', ['plus', 'plus', 'plus', 'plus']],
    ];
    for (const [event, status, before] of ended) {
        it(`off at ${status}, at the press that reached it, and no press after (mutant: ${status} not read)`, () => {
            reset(before);
            const c = clocks();
            c.start('k', event, 1000);
            vi.advanceTimersByTime(1000);
            expect(runStatus(getSimRun('M')!)).toBe(status);
            expect(c.state('k')).toEqual({ on: false, ticks: 1, dropped: 0, off: status });
            expect(vi.getTimerCount()).toBe(0);
            vi.advanceTimersByTime(5000);
            expect(presses).toEqual([event]);
        });
    }

    it('off at Reset, at once when the card checks the new run (mutant: Reset not told apart from the same run)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(2000);
        reset();
        c.check();
        expect(c.state('k')).toEqual({ on: false, ticks: 2, dropped: 0, off: 'reset' });
        vi.advanceTimersByTime(5000);
        expect(presses).toHaveLength(2);
    });

    it('off at Reset by the next tick itself, pressing nothing, when nobody checked (mutant: the tick presses on the new run)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(1000);
        reset(['plus', 'start']);
        vi.advanceTimersByTime(1000);
        expect([presses.length, offOf(c), steps()]).toEqual([1, 'reset', 2]);
    });

    it('off when the run goes, Stop or the interruption of a model edit (mutant: no run read as Running)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        simClear('M');
        vi.advanceTimersByTime(1000);
        expect([presses, offOf(c)]).toEqual([[], 'cleared']);
    });

    it('off when the board changes, every clock (mutant: a removed clock left ticking)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('a', 'tick', 1000);
        c.start('b', 'tick', 500);
        c.stopAll('board');
        vi.advanceTimersByTime(3000);
        expect([presses, offOf(c, 'a'), offOf(c, 'b')]).toEqual([[], 'board', 'board']);
    });

    it('switched off by hand keeps its count; on again counts from zero (decision 4)', () => {
        reset(['plus', 'plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(3000);
        c.stop('k');
        expect(c.state('k')).toEqual({ on: false, ticks: 3, dropped: 0, off: 'hand' });
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(3000);
        expect(presses).toHaveLength(3);
        expect(c.start('k', 'tick', 1000)).toBe(true);
        expect(c.state('k')).toEqual({ on: true, ticks: 0, dropped: 0, off: null });
    });

    it('dispose clears every timer without a word: the card closed, the panel collapsed, the model switched (mutant: a timer left behind)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('a', 'tick', 1000);
        c.start('b', 'tick', 300);
        const before = changes;
        c.dispose();
        vi.advanceTimersByTime(10000);
        expect([presses, changes]).toEqual([[], before]);
        expect(vi.getTimerCount()).toBe(0);
        expect(c.start('a', 'tick', 1000)).toBe(false);
    });
});

describe('beside the hand, Play and the input dialog (decisions 5, 6, 7)', () => {
    it('a hand press between two ticks leaves the clock on, and both reach the machine (mutant: a hand press stops the clock)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(1500);
        pressInput('M', 'tick', undefined, lookup, 'tick');
        c.check();
        vi.advanceTimersByTime(1500);
        expect([c.state('k')?.on, presses.length, steps(), secs()]).toEqual([true, 3, 6, 26]);
    });

    it('with Play on, both press in arrival order and neither stops the other (mutant: a tick stops Play, or Play the clock)', () => {
        reset(['spin']);
        const c = clocks();
        let played = 0;
        let stopped: string | null = null;
        const play = (): void => {
            const r = playPress('M', lookup, played);
            played = r.steps;
            if (r.stop === null) setTimeout(play, 500); else stopped = r.stop;
        };
        c.start('k', 'tick', 1000);
        play();
        vi.advanceTimersByTime(3000);
        const events = getSimRun('M')!.trace!.slice(1).map(t => t.event);
        expect([stopped, c.state('k')?.on]).toEqual([null, true]);
        expect(events.filter(e => e === null)).toHaveLength(7);
        expect(events.filter(e => e === 'tick')).toHaveLength(3);
        expect(getSimRun('M')!.trace!.slice(1).every(t => t.kind === 'fired')).toBe(true);
    });

    it('a tick while a press waits on the input dialog or a choice is dropped and counted, never queued (decision 7; mutants: pressed anyway; queued and replayed)', () => {
        reset(['plus', 'plus', 'start']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(1000);
        waiting = true;
        vi.advanceTimersByTime(2000);
        expect(c.state('k')).toEqual({ on: true, ticks: 1, dropped: 2, off: null });
        expect(presses).toHaveLength(1);
        waiting = false;
        vi.advanceTimersByTime(1000);
        expect(c.state('k')).toEqual({ on: true, ticks: 2, dropped: 2, off: null });
        expect(presses).toHaveLength(2);
    });
});

describe('why a clock is off, in words', () => {
    it('one phrase per reason, the run\'s status named (mutant: one phrase for all)', () => {
        const all: ClockOff[] = ['hand', 'reset', 'cleared', 'board', 'Terminated', 'Deadlock', 'Halted'];
        expect(all.map(clockOffText)).toEqual([
            'switched off', 'Reset', 'no run (Stop, or the model changed)', 'the board changed',
            'the run reached Terminated', 'the run reached Deadlock', 'the run reached Halted',
        ]);
    });
});
