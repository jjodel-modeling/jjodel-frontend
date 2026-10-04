/**
 * simBoardClock — the Clock of the I/O board: time as an environment source, not
 * model time (R-SIM-122; P-2026-10-04-0150, docs/discovery/discovery_2026-10-04_sim_io_clock.md).
 *
 * The simulator has no time by construction. A Clock is something in the
 * environment that presses one event on its own, every period: the engine sees
 * only the press, the step, σ, the trace and a future `.smv` export are those of
 * a hand press (decision 3). A tick whose event enables nothing is discarded as a
 * hand press is, and the clock goes on.
 *
 * `createClocks` keeps the clocks of one board card, by device id: one
 * `setInterval` per clock that is on, the first tick one period after switching
 * on. Each tick reads the live run from the store at that moment, as Play's
 * `playPress` does (simBridge.ts), never React state:
 * - `check` switches a clock off, and says why, when its run is gone (Stop, the
 *   interruption of a model edit), replaced (Reset: another `net`), or has reached
 *   `Terminated`, `Deadlock` or `Halted`. It runs before each tick, after each
 *   press, and whenever the card sees the run change, so a hand press or Play
 *   that ends the run switches the clocks off at once (decision 5);
 * - a tick while a press waits on the user, the input dialog of R-SIM-88 or a
 *   choice list, is dropped and counted, never queued (decision 7);
 * - otherwise one press of the bound event (`press`, the card's own press through
 *   the panel's `fire`, which leaves Play running: decision 6).
 * A hand press and Play leave the clocks on; `stopAll` is the board record
 * changing; `dispose` is the card going away (closed, the panel collapsed, the
 * model switched), which clears every timer without a word: what is not on screen
 * does not tick. On and off are view state of the board, never the model's and
 * never an undo step (decision 4).
 *
 * Pure: no React, no store write, so it runs under the node test bench with fake
 * timers (sim/__tests__/simBoardClock.test.ts).
 */

import { isClockPeriod } from '../../../model/simulation/boardCodec';
import type { CompiledNet } from '../../../model/simulation/netTypes';
import { runStatus } from './simBridge';
import type { SimRun } from './simRunState';

/** Why a clock went off: by hand, Reset, no run, the board edited, or the run's end. */
export type ClockOff = 'hand' | 'reset' | 'cleared' | 'board' | 'Terminated' | 'Deadlock' | 'Halted';

/** What one clock shows: on or off, the presses since it was switched on, the ticks dropped, why it is off. */
export interface ClockState {
    readonly on: boolean;
    readonly ticks: number;
    readonly dropped: number;
    /** `null` while on. */
    readonly off: ClockOff | null;
}

/** What the clocks read and call; the card passes the store's run and its own press. */
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
        states.set(id, { ...s, ticks: s.ticks + 1 });
        deps.press(ticking.get(id)!.event);
        sweep();
        deps.changed();
    };

    return {
        start(id, event, period) {
            if (disposed || !isClockPeriod(period)) return false;
            if (ticking.has(id)) return true;
            const run = deps.run();
            if (!run || runStatus(run) !== 'Running') return false;
            const timer = setInterval(() => tick(id), period);
            ticking.set(id, { event, net: run.net, timer });
            states.set(id, { on: true, ticks: 0, dropped: 0, off: null });
            deps.changed();
            return true;
        },
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
        state: id => states.get(id),
        states: () => new Map(states),
        dispose() {
            disposed = true;
            for (const t of ticking.values()) clearInterval(t.timer);
            ticking.clear();
        },
    };
}
