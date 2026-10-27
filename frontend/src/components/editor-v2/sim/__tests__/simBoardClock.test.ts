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
 *
 * P-2026-10-04-1625 (R-SIM-134..136): the auto clocks armed once per run, the idle
 * tick that presses nothing, and the clocks owned by the panel. The panel does not
 * import under this bench (the joiner), so «the board closed» is the clocks driven by
 * the panel's press alone, with no card in their deps; the app is the lane probe's.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { autoClocks, clockEnables, clockOffText, createClocks } from '../simBoardClock';
import type { AutoClock, ClockOff, Clocks } from '../simBoardClock';
import { panelInputs, playPress, pressInput, runStatus, startRun, watchResults } from '../simBridge';
import type { ContextBuilder } from '../simBridge';
import { encodeWatches } from '../../../../model/simulation/watchCodec';
import { planPress } from '../simBoardFace';
import { stateValueOf } from '../simCanvasState';
import { __resetSimRunsForTests, getSimRun, simClear, simReset } from '../simRunState';
import { structuralInputs } from '../../../../model/simulation/netStep';
import type { BoardDevice } from '../../../../model/simulation/boardCodec';

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
        expect(c.state('k')).toEqual({ on: true, ticks: 5, dropped: 0, idle: 0, off: null });
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

    it('two clocks tick independently, each at its own period', () => {
        reset(['plus', 'start']);
        const c = clocks();
        c.start('a', 'tick', 1000);
        c.start('b', 'tick', 500);
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
            expect(c.state('k')).toEqual({ on: false, ticks: 1, dropped: 0, idle: 0, off: status });
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
        expect(c.state('k')).toEqual({ on: false, ticks: 2, dropped: 0, idle: 0, off: 'reset' });
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
        expect(c.state('k')).toEqual({ on: false, ticks: 3, dropped: 0, idle: 0, off: 'hand' });
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(3000);
        expect(presses).toHaveLength(3);
        expect(c.start('k', 'tick', 1000)).toBe(true);
        expect(c.state('k')).toEqual({ on: true, ticks: 0, dropped: 0, idle: 0, off: null });
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
        expect(c.state('k')).toEqual({ on: true, ticks: 1, dropped: 2, idle: 0, off: null });
        expect(presses).toHaveLength(1);
        waiting = false;
        vi.advanceTimersByTime(1000);
        expect(c.state('k')).toEqual({ on: true, ticks: 2, dropped: 2, idle: 0, off: null });
        expect(presses).toHaveLength(2);
    });
});

describe('why a clock is off, in words', () => {
    it('one phrase per reason, the run\'s status named (mutant: one phrase for all)', () => {
        const all: ClockOff[] = ['hand', 'reset', 'cleared', 'board', 'panel', 'Terminated', 'Deadlock', 'Halted'];
        expect(all.map(clockOffText)).toEqual([
            'switched off', 'Reset', 'no run (Stop, or the model changed)', 'the board changed', 'the panel was collapsed',
            'the run reached Terminated', 'the run reached Deadlock', 'the run reached Halted',
        ]);
    });

    it('a hit has its own phrase, in the UI\'s words, never «watch» (R-SIM-137, W4; mutant: the default phrase)', () => {
        expect(clockOffText('watch')).toBe('an invariant or a breakpoint was hit');
    });
});

describe('a hit switches the clocks off (R-SIM-137, P-2026-10-05-1735, W3)', () => {
    /** The watches of the microwave, in its bag as the dialog writes them. */
    const watch = (text: string, kind: 'invariant' | 'breakpoint') => {
        lookup.M._state = { ...lookup.M._state, runWatches: encodeWatches([{ name: 'w', kind, text }]) };
    };
    /**
     * The clocks with the panel's press: `fire`, then `show`, which reads the watches on the configuration the
     * committed step left and switches every clock off at a hit. The panel does not import under this bench, so its
     * wiring is the lane probe's; here the press is the bridge's and the clocks are the subject's.
     */
    function panelClocks(): Clocks {
        const c: Clocks = createClocks({
            run: () => getSimRun('M'),
            waiting: () => waiting,
            press: event => {
                presses.push(event);
                const pressed = pressInput('M', event, undefined, lookup, event);
                const run = getSimRun('M');
                if (pressed.outcome !== null && run && watchResults(run, lookup).some(r => r.hit)) c.stopAll('watch');
            },
            changed: () => { changes++; },
        });
        return c;
    }

    it('a breakpoint reached by a tick: every clock off with the reason, the count kept, nothing pressed after (mutants: the reason lost; a clock left ticking)', () => {
        watch('model.[secs] <= 87', 'breakpoint');
        reset(['plus', 'plus', 'plus', 'start']);
        const c = panelClocks();
        expect(c.start('k', 'tick', 1000)).toBe(true);
        expect(c.start('j', 'plus', 5000)).toBe(true);
        vi.advanceTimersByTime(3000);
        expect([presses, secs(), steps()]).toEqual([['tick', 'tick', 'tick'], 87, 7]);
        expect(c.state('k')).toEqual({ on: false, ticks: 3, dropped: 0, idle: 0, off: 'watch' });
        expect(offOf(c, 'j')).toBe('watch');
        vi.advanceTimersByTime(10000);
        expect([presses.length, steps()]).toEqual([3, 7]);
        // the run goes on: a hit stops the clocks, never the run
        expect(runStatus(getSimRun('M')!)).toBe('Running');
    });

    it('an invariant broken by a tick, the same; the clock on again ticks until the next hit, level-triggered (mutant: the hit read before the press)', () => {
        watch('model.[secs] > 88', 'invariant');
        reset(['plus', 'plus', 'plus', 'start']);
        const c = panelClocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(5000);
        expect([presses.length, secs(), offOf(c)]).toEqual([2, 88, 'watch']);
        expect(c.start('k', 'tick', 1000)).toBe(true);
        vi.advanceTimersByTime(1000);
        expect([presses.length, secs(), offOf(c)]).toEqual([3, 87, 'watch']);
    });

    it('no watch, or a watch that does not hit: the clock ticks on (control: the hit is what stops it)', () => {
        watch('model.[secs] >= 0', 'invariant');
        reset(['plus', 'plus', 'plus', 'start']);
        const c = panelClocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(5000);
        expect([presses.length, offOf(c)]).toEqual([5, null]);
    });
});

describe('idle ticks: a tick that enables nothing is not a step (R-SIM-136, amending decision 3)', () => {
    it('it presses nothing: no step, no trace entry, no kept configuration; counted idle and announced, the clock goes on (mutants: pressed anyway; counted as a tick; off at an idle tick; not announced)', () => {
        reset();
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(2000);
        const before = changes;
        vi.advanceTimersByTime(1000);
        expect(changes).toBeGreaterThan(before);
        const run = getSimRun('M')!;
        expect([presses, steps(), run.trace?.length ?? 0, run.keptConfigs?.length ?? 0]).toEqual([[], 0, 0, 0]);
        expect(c.state('k')).toEqual({ on: true, ticks: 0, dropped: 0, idle: 3, off: null });
        expect(vi.getTimerCount()).toBe(1);
    });

    it('a tick that enables a transition is a step as today; the clock follows the state between idle and pressing (mutant: the test read once at switch-on)', () => {
        reset(['plus']);
        const c = clocks();
        c.start('k', 'tick', 1000);
        vi.advanceTimersByTime(2000);
        pressInput('M', 'start', undefined, lookup, 'start');
        vi.advanceTimersByTime(3000);
        expect([c.state('k')?.ticks, c.state('k')?.idle, steps(), secs()]).toEqual([3, 2, 5, 27]);
        vi.advanceTimersByTime(27000);
        expect([secs(), steps()]).toEqual([0, 32]);
        vi.advanceTimersByTime(2000);
        expect([c.state('k')?.ticks, c.state('k')?.idle, steps(), presses.length]).toEqual([30, 4, 32, 30]);
    });

    it('a hand press that enables nothing is still a step at unchanged state: hand presses are as they were (mutant: the idle rule applied to the hand)', () => {
        reset();
        pressInput('M', 'tick', undefined, lookup, 'tick');
        expect([steps(), getSimRun('M')!.trace!.map(t => t.kind)]).toEqual([1, ['discard']]);
    });

    it('the test is the one that greys the panel\'s button, structural: a tick whose guard refuses it is still pressed, a discard step (report R3; mutants: candidates instead; any event enabled; the run\'s status not read)', () => {
        reset();
        const run = getSimRun('M')!;
        const grey = (e: string) => panelInputs(runStatus(run), structuralInputs(run.net, run.config.state)).events.has(e);
        expect(run.alphabet.map(e => clockEnables(run, e))).toEqual(run.alphabet.map(grey));
        expect(['tick', 'plus', 'start'].map(e => clockEnables(run, e))).toEqual([false, true, true]);
        const c = clocks();
        c.start('k', 'start', 1000);
        vi.advanceTimersByTime(1000);
        expect([presses, getSimRun('M')!.trace!.map(t => t.kind)]).toEqual([['start'], ['discard']]);
        for (const hand of [['quit'], ['plus', 'plus', 'plus', 'plus', 'plus']]) {
            reset(hand);
            const ended = getSimRun('M')!;
            expect(ended.alphabet.some(e => clockEnables(ended, e))).toBe(false);
        }
        expect(runStatus(getSimRun('M')!)).toBe('Halted');
    });

    it('a tick while a press waits is dropped before the idle test: decision 7 as it was (mutant: the idle test first)', () => {
        reset();
        const c = clocks();
        c.start('k', 'tick', 1000);
        waiting = true;
        vi.advanceTimersByTime(2000);
        expect([c.state('k')?.dropped, c.state('k')?.idle]).toEqual([2, 0]);
        waiting = false;
        vi.advanceTimersByTime(1000);
        expect([c.state('k')?.dropped, c.state('k')?.idle]).toEqual([2, 1]);
    });
});

describe('auto-start: the clock switches itself on with its run (R-SIM-134, R-SIM-135)', () => {
    const AUTO: AutoClock[] = [{ id: 'k', event: 'tick', period: 1000 }];
    const arm = (c: Clocks, auto: readonly AutoClock[] = AUTO) => c.arm?.(() => auto);

    it('not before Reset; at the run\'s first sight it is on, the first tick one period later (mutants: armed without a run; the first tick at the arm)', () => {
        const c = clocks();
        arm(c);
        expect([c.state('k'), vi.getTimerCount()]).toEqual([undefined, 0]);
        vi.advanceTimersByTime(5000);
        reset(['plus', 'start']);
        arm(c);
        expect(c.state('k')).toEqual({ on: true, ticks: 0, dropped: 0, idle: 0, off: null });
        vi.advanceTimersByTime(999);
        expect(presses).toEqual([]);
        vi.advanceTimersByTime(1);
        expect(presses).toEqual(['tick']);
    });

    it('once per run: the hand\'s pause holds at the next sight of the same run, and Reset re-arms it with a fresh count, one timer (mutants: re-armed at every sight; Reset not re-arming; the old timer kept)', () => {
        reset(['plus', 'plus', 'start']);
        const c = clocks();
        arm(c);
        vi.advanceTimersByTime(2000);
        c.stop('k');
        arm(c);
        expect(c.state('k')).toEqual({ on: false, ticks: 2, dropped: 0, idle: 0, off: 'hand' });
        vi.advanceTimersByTime(3000);
        expect(presses).toHaveLength(2);
        reset(['plus', 'start']);
        arm(c);
        expect(c.state('k')).toEqual({ on: true, ticks: 0, dropped: 0, idle: 0, off: null });
        expect(vi.getTimerCount()).toBe(1);
        vi.advanceTimersByTime(1000);
        expect(presses).toHaveLength(3);
    });

    it('Reset while it ticks: the arm turns the old one off and on again for the new run (mutant: the arm without the sweep keeps the old net)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        arm(c);
        vi.advanceTimersByTime(2000);
        reset(['plus', 'start']);
        arm(c);
        expect(c.state('k')).toEqual({ on: true, ticks: 0, dropped: 0, idle: 0, off: null });
        vi.advanceTimersByTime(1000);
        expect([presses.length, steps(), secs()]).toEqual([3, 3, 29]);
    });

    it('only the listed clocks whose event the run knows; any other clock is left as it is (mutants: an unknown event armed; a clock not listed armed)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        arm(c, [{ id: 'a', event: 'tick', period: 1000 }, { id: 'g', event: 'gone', period: 1000 }]);
        expect([c.state('a')?.on, c.state('g'), c.state('m')]).toEqual([true, undefined, undefined]);
    });

    it('a run that is not Running arms nothing, and the next Reset does (mutant: armed on a Terminated run)', () => {
        reset(['quit']);
        const c = clocks();
        arm(c);
        expect([c.state('k'), vi.getTimerCount()]).toEqual([undefined, 0]);
        reset();
        arm(c);
        expect(c.state('k')?.on).toBe(true);
    });

    it('an edit of the board and the panel collapsed switch it off until Reset or the hand, each with its reason (R-SIM-135; mutant: re-armed in the same run)', () => {
        reset(['plus', 'start']);
        const c = clocks();
        arm(c);
        c.stopAll('board');
        arm(c);
        expect(offOf(c)).toBe('board');
        expect(c.start('k', 'tick', 1000)).toBe(true);
        c.stopAll('panel');
        arm(c);
        expect(offOf(c)).toBe('panel');
        vi.advanceTimersByTime(3000);
        expect(presses).toEqual([]);
        reset(['plus', 'start']);
        arm(c);
        expect(c.state('k')?.on).toBe(true);
    });

    it('the probe\'s microwave with no card in the deps (the board closed): idle 5 s at Reset is no step; plus x3, start, 5 s more read 85, the steps the presses plus the ticks that fired (R-SIM-135, R-SIM-136)', () => {
        const panel = createClocks({
            run: () => getSimRun('M'),
            waiting: () => false,
            press: event => {
                const plan = planPress(getSimRun('M'), event, []);
                if (plan.kind === 'fire') pressInput('M', plan.event, undefined, lookup, plan.event, plan.values);
            },
            changed: () => undefined,
        });
        reset();
        panel.arm?.(() => AUTO);
        vi.advanceTimersByTime(5000);
        expect([steps(), panel.state('k')?.idle]).toEqual([0, 5]);
        for (const e of ['plus', 'plus', 'plus', 'start']) pressInput('M', e, undefined, lookup, e);
        vi.advanceTimersByTime(5000);
        expect([secs(), steps(), steps() - 4]).toEqual([85, 9, panel.state('k')?.ticks]);
    });
});

describe('autoClocks: the clocks of a board that switch themselves on (R-SIM-134)', () => {
    it('a Clock with auto-start bound to an event, in board order, its period defaulted; manual, unbound and other kinds left out (mutants: manual listed; unbound listed; a button listed)', () => {
        const ev = (event: string) => ({ kind: 'event' as const, event });
        const devices: BoardDevice[] = [
            { id: 'a', kind: 'clock', cell: [0, 0], label: '', binding: ev('tick'), period: 500, autoStart: true },
            { id: 'b', kind: 'clock', cell: [1, 0], label: '', binding: ev('tick'), period: 500 },
            { id: 'c', kind: 'clock', cell: [2, 0], label: '', binding: null, autoStart: true },
            { id: 'd', kind: 'button', cell: [3, 0], label: '', binding: ev('tick'), autoStart: true },
            { id: 'e', kind: 'clock', cell: [0, 1], label: '', binding: ev('plus'), autoStart: true },
        ];
        expect(autoClocks(devices)).toEqual([{ id: 'a', event: 'tick', period: 500 }, { id: 'e', event: 'plus', period: 1000 }]);
    });
});
