/**
 * simBoardClock — the Clock of the I/O board: time as an environment source, not
 * model time (R-SIM-122; P-2026-10-04-0150, docs/discovery/discovery_2026-10-04_sim_io_clock.md).
 *
 * The simulator has no time by construction. A Clock is something in the
 * environment that presses one event on its own, every period: the engine sees
 * only the press, the step, σ, the trace and a future `.smv` export are those of
 * a hand press (decision 3). A tick whose event enables nothing is not a step
 * (R-SIM-136, P-2026-10-04-1625, amending decision 3): the clock asks the run first,
 * with the test that greys the panel's button (`clockEnables`), and a tick nobody
 * listens to presses nothing, counted `idle`; the clock goes on.
 *
 * `createClocks` keeps the clocks of one model, by device id: one
 * `setInterval` per clock that is on, the first tick one period after switching
 * on. Each tick reads the live run from the store at that moment, as Play's
 * `playPress` does (simBridge.ts), never React state:
 * - `check` switches a clock off, and says why, when its run is gone (Stop, the
 *   interruption of a model edit), replaced (Reset: another `net`), or has reached
 *   `Terminated`, `Deadlock` or `Halted`. It runs before each tick, after each
 *   press, and whenever the panel sees the run change, so a hand press or Play
 *   that ends the run switches the clocks off at once (decision 5);
 * - a tick while a press waits on the user, the input dialog of R-SIM-88 or a
 *   choice list, is dropped and counted, never queued (decision 7);
 * - a tick whose event enables nothing is idle (R-SIM-136);
 * - otherwise one press of the bound event (`press`, the board's press through
 *   the panel's `fire`, which leaves Play running: decision 6).
 * A hand press and Play leave the clocks on; `stopAll` is the board record
 * changing, or the panel collapsed; `dispose` is the model switched or the panel
 * gone, which clears every timer without a word. On and off are view state of the
 * board, never the model's and never an undo step (decision 4).
 *
 * The clocks belong to the run, not to the card (R-SIM-135): their owner is the
 * simulation panel, so they tick with the board closed, and the card only shows
 * and toggles them. A Clock with `autoStart` (R-SIM-134) switches itself on: `arm`,
 * called by the panel whenever its run may have changed, switches the auto clocks
 * on the first time it sees a run Running, once per run, so a Reset re-arms them
 * and the hand's off holds until the next Reset.
 *
 * Pure: no React, no store write, so it runs under the node test bench with fake
 * timers (sim/__tests__/simBoardClock.test.ts).
 */

import { CLOCK_PERIOD_DEFAULT, isClockPeriod } from '../../../model/simulation/boardCodec';
import type { BoardDevice } from '../../../model/simulation/boardCodec';
import { structuralInputs } from '../../../model/simulation/netStep';
import type { CompiledNet } from '../../../model/simulation/netTypes';
import { panelInputs, runStatus } from './simBridge';
import type { SimRun } from './simRunState';

/**
 * Why a clock went off: by hand, Reset, no run, the board edited, the panel collapsed, the run's end, or a step that
 * hit an invariant or a breakpoint (R-SIM-137, amending provisional R-SIM-122(5)): the panel switches every clock off
 * there, so no tick moves the run past what the user has just been shown.
 */
export type ClockOff = 'hand' | 'reset' | 'cleared' | 'board' | 'panel' | 'Terminated' | 'Deadlock' | 'Halted' | 'watch';

/** What one clock shows: on or off, the presses since it was switched on, the ticks dropped, why it is off. */
export interface ClockState {
    readonly on: boolean;
    readonly ticks: number;
    readonly dropped: number;
    /** `null` while on. */
    readonly off: ClockOff | null;
    /** R-SIM-136: the ticks since on whose event enabled nothing, so nothing was pressed; never among `ticks`. */
    readonly idle?: number;
}

/** A clock of the board that switches itself on (R-SIM-134): its device, the event it presses, its period. */
export interface AutoClock {
    readonly id: string;
    readonly event: string;
    readonly period: number;
}

/** The Clocks of a board with `autoStart` bound to an event, in its order (R-SIM-134). */
export function autoClocks(devices: readonly BoardDevice[]): AutoClock[] {
    const out: AutoClock[] = [];
    for (const d of devices) {
        if (d.kind !== 'clock' || d.autoStart !== true || d.binding?.kind !== 'event') continue;
        out.push({ id: d.id, event: d.binding.event, period: d.period ?? CLOCK_PERIOD_DEFAULT });
    }
    return out;
}

/**
 * R-SIM-136: whether a press of `event` now reaches the machine, by the test that greys the panel's button of that
 * event and the board's Button (`view.inputs.events`): structural, a transition on it whose preset is marked while the
 * run is Running. Its guards are not read, so a tick they refuse is pressed and is a discard, as a hand press is.
 */
export function clockEnables(run: SimRun, event: string): boolean {
    return panelInputs(runStatus(run), structuralInputs(run.net, run.config.state)).events.has(event);
}

/** What the clocks read and call; the panel passes the store's run and its own press. */
export interface ClockDeps {
    /** The live run of the board's model, read from the store at each call. */
    readonly run: () => SimRun | undefined;
    /** True while a press waits on the user: the input dialog, or a choice list. */
    readonly waiting: () => boolean;
    /** One press of `event`, as the board's Button presses it. */
    readonly press: (event: string) => void;
    /** A clock changed: the card re-renders its faces. */
    readonly changed: () => void;
}

export interface Clocks {
    /** Switches a clock on; refused, and nothing changes, without a Running run or with a period out of range. */
    start(id: string, event: string, period: number): boolean;
    /** Switches a clock off by hand. */
    stop(id: string): void;
    /** Switches every clock off, with one reason. */
    stopAll(reason: ClockOff): void;
    /**
     * R-SIM-134: the check, then, the first time a run is seen Running, the clocks `auto` lists whose event that run
     * knows switch on; once per run, so only a Reset arms them again. `auto` is read only then.
     */
    arm?(auto: () => readonly AutoClock[]): void;
    /** Switches off the clocks whose run is gone, replaced or ended. */
    check(): void;
    state(id: string): ClockState | undefined;
    states(): ReadonlyMap<string, ClockState>;
    /** Clears every timer; the clocks are gone. */
    dispose(): void;
}

/** One phrase for each reason, as the face's title says it. */
export function clockOffText(reason: ClockOff): string {
    switch (reason) {
        case 'hand': return 'switched off';
        case 'reset': return 'Reset';
        case 'cleared': return 'no run (Stop, or the model changed)';
        case 'board': return 'the board changed';
        case 'panel': return 'the panel was collapsed';
        // The UI's words (R-SIM-137, W4): «watch» is the Watch rows' (R-SIM-104).
        case 'watch': return 'an invariant or a breakpoint was hit';
        default: return `the run reached ${reason}`;
    }
}

interface Ticking {
    readonly event: string;
    /** The net of the run the clock was switched on for: another one is Reset. */
    readonly net: CompiledNet;
    readonly timer: ReturnType<typeof setInterval>;
}

/** Why the clocks of `net` must go off now, `null` while they may tick. */
function offReason(run: SimRun | undefined, net: CompiledNet): ClockOff | null {
    if (!run) return 'cleared';
    if (run.net !== net) return 'reset';
    const status = runStatus(run);
    return status === 'Terminated' || status === 'Deadlock' || status === 'Halted' ? status : null;
}

export function createClocks(deps: ClockDeps): Clocks {
    const ticking = new Map<string, Ticking>();
    const states = new Map<string, ClockState>();
    let disposed = false;
    /** The net of the run the auto clocks were last armed for (R-SIM-134). */
    let armed: CompiledNet | null = null;

    const halt = (id: string, reason: ClockOff): void => {
        const t = ticking.get(id);
        if (!t) return;
        clearInterval(t.timer);
        ticking.delete(id);
        const s = states.get(id)!;
        states.set(id, { ...s, on: false, off: reason });
    };

    /** The check of every clock on; `true` when one went off. */
    const sweep = (): boolean => {
        if (ticking.size === 0) return false;
        const run = deps.run();
        let any = false;
        for (const [id, t] of [...ticking]) {
            const reason = offReason(run, t.net);
            if (reason !== null) { halt(id, reason); any = true; }
        }
        return any;
    };

    const tick = (id: string): void => {
        if (disposed || !ticking.has(id)) return;
        if (sweep() && !ticking.has(id)) { deps.changed(); return; }
        const s = states.get(id)!;
        if (deps.waiting()) {
            states.set(id, { ...s, dropped: s.dropped + 1 });
            deps.changed();
            return;
        }
        const event = ticking.get(id)!.event;
        // R-SIM-136: a tick nobody listens to equals no tick: nothing pressed, no step, counted idle.
        const run = deps.run();
        if (!run || !clockEnables(run, event)) {
            states.set(id, { ...s, idle: (s.idle ?? 0) + 1 });
            deps.changed();
            return;
        }
        states.set(id, { ...s, ticks: s.ticks + 1 });
        deps.press(event);
        sweep();
        deps.changed();
    };

    const start = (id: string, event: string, period: number): boolean => {
        if (disposed || !isClockPeriod(period)) return false;
        if (ticking.has(id)) return true;
        const run = deps.run();
        if (!run || runStatus(run) !== 'Running') return false;
        const timer = setInterval(() => tick(id), period);
        ticking.set(id, { event, net: run.net, timer });
        states.set(id, { on: true, ticks: 0, dropped: 0, idle: 0, off: null });
        deps.changed();
        return true;
    };

    return {
        start,
        stop(id) {
            if (!ticking.has(id)) return;
            halt(id, 'hand');
            deps.changed();
        },
        stopAll(reason) {
            if (ticking.size === 0) return;
            for (const id of [...ticking.keys()]) halt(id, reason);
            deps.changed();
        },
        check() {
            if (sweep()) deps.changed();
        },
        arm(auto) {
            if (disposed) return;
            const went = sweep();
            const run = deps.run();
            if (run && run.net !== armed && runStatus(run) === 'Running') {
                armed = run.net;
                for (const c of auto()) if (run.alphabet.includes(c.event)) start(c.id, c.event, c.period);
            }
            if (went) deps.changed();
        },
        state: id => states.get(id),
        states: () => new Map(states),
        dispose() {
            disposed = true;
            for (const t of ticking.values()) clearInterval(t.timer);
            ticking.clear();
        },
    };
}
