/**
 * watchEvaluator — an invariant or a breakpoint, compiled and read (R-SIM-137;
 * P-2026-10-05-1735, docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §1, W2, W3, Q1).
 *
 * A watch is read as an output of the I/O board is (boardOutputs.ts), plus a
 * boolean check. It cannot go through the guards' oracle, which needs a
 * transition as `self` (guardContext.ts `buildGuardContext`); an output is an
 * anonymous global DEFINE, `self` the model root and `event` null, which is what
 * a watch reads after a step. So `compileOutput` gives a watch its checks: a
 * parse, the subset checker with E-NODE (`node.[x]` is presentation, not σ,
 * R-SIM-108), `event`, an input variable (R-SIM-88), a presentation name, an
 * undeclared name, and, with the run's snapshot, R2 on the element left of a
 * `.[x]`; `X.[marked]` compiles with no declaration (the State machine profile).
 * `evaluateOutput` reads it on σ; a value that is not a boolean is the watch's
 * defect, named by its type. A defect is shown on the watch, never a run error
 * and never a hit.
 *
 * The hit rule (W3, level-triggered): an invariant hits when it reads false, a
 * breakpoint when it reads true, on whatever configuration it is read; when the
 * run reads them (after every committed step, never on the configuration Play
 * starts from) is the bridge's (simBridge.ts `playPress`).
 *
 * Pure: the board's output path and the codec's types.
 */

import { compileOutput, evaluateOutput } from './boardOutputs';
import type { CompiledOutput, OutputScope } from './boardOutputs';
import type { SimSnapshot } from './guardContext';
import type { WatchKind, WatchRecord } from './watchCodec';
import type { CompiledNet, SimState } from './netTypes';

/** A watch with its compiled expression; `output.defect` is what it fails to compile, `null` when nothing. */
export interface CompiledWatch {
    readonly name: string;
    readonly kind: WatchKind;
    readonly text: string;
    readonly output: CompiledOutput;
}

/** What a watch reads on one configuration: a boolean, or the defect, short for a row and in full for its title. */
export type WatchReading =
    | { readonly kind: 'value'; readonly value: boolean }
    | { readonly kind: 'defect'; readonly short: string; readonly detail: string };

/** A watch read on one configuration, and whether it hits there. */
export interface WatchResult {
    readonly watch: CompiledWatch;
    readonly reading: WatchReading;
    readonly hit: boolean;
}

export function compileWatch(watch: WatchRecord, scope: OutputScope): CompiledWatch {
    return { name: watch.name, kind: watch.kind, text: watch.text, output: compileOutput(watch.text, scope) };
}

/** The watch's reading on σ: a compile defect as compiled, an evaluation defect, a value that is not a boolean, or the boolean. */
export function evaluateWatch(
    watch: CompiledWatch, snapshot: SimSnapshot, net: Pick<CompiledNet, 'modelId' | 'places'>, state: SimState,
): WatchReading {
    const defect = watch.output.defect;
    if (defect !== null) return { kind: 'defect', short: defect.short, detail: defect.detail };
    const read = evaluateOutput(watch.output, snapshot, net, state);
    if (read.kind === 'defect') return { kind: 'defect', short: read.detail, detail: read.detail };
    if (typeof read.value !== 'boolean') {
        const type = typeof read.value;
        return { kind: 'defect', short: `non-boolean: ${type}`, detail: `the value is a ${type}, ${JSON.stringify(read.value)}, not a boolean` };
    }
    return { kind: 'value', value: read.value };
}

/** The hit rule (W3): an invariant false, a breakpoint true; a defect never hits. */
export function isWatchHit(kind: WatchKind, reading: WatchReading): boolean {
    if (reading.kind !== 'value') return false;
    return kind === 'invariant' ? !reading.value : reading.value;
}

/** Every watch read on σ, in declaration order, with its hit. */
export function readWatches(
    watches: readonly CompiledWatch[], snapshot: SimSnapshot, net: Pick<CompiledNet, 'modelId' | 'places'>, state: SimState,
): WatchResult[] {
    return watches.map(watch => {
        const reading = evaluateWatch(watch, snapshot, net, state);
        return { watch, reading, hit: isWatchHit(watch.kind, reading) };
    });
}
