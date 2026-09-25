/**
 * simRunState — run-state of the simulation (R-SIM-1, R-SIM-13, R-SIM-36).
 *
 * Module singleton (per session, not persisted): one run record per model +
 * version counter with a React subscription hook. Same shape as
 * irCollapseState.ts, and kept outside Redux by construction: the run-state
 * never persists with the project, never enters the undo history and never
 * travels on the collaborative socket. No actions, no reducer, no bag `_state`.
 *
 * The marking is keyed on the DObject id (the M1 instance), NOT on the ReactFlow
 * vertex id: the panel works on objects, and ObjectNode maps vertex -> object
 * through `idlookup[vertexId].model` (irResolve.ts:55).
 *
 * Step 3b: a run is the record `SimRun` of the Petri core (net, configuration,
 * halt reason, oracles, event alphabet, the R-SIM-13 baseline signature), built
 * at Reset by the bridge (simBridge.ts). A run stays here with an empty marking:
 * `Not started` means no record, not no token (R-SIM-29).
 *
 * The version is the `'mark'` channel of the canvas (R-MK-5, R-MK-6), and only
 * that: it rises when a marking or a halt can have changed (Reset, a `fired` or
 * `halted` step, Stop or interruption of a run), never on a discard, a
 * quiescence or a refused selector, which change nothing the canvas reads. The
 * panel does not follow it for its own lines (R-SIM-36).
 */

import { useSyncExternalStore } from 'react';
import { isMarked } from '../../../model/simulation/netStep';
import type {
    ActionOracle, CompiledNet, GuardOracle, HaltReason, NetConfiguration, StepOutcome,
} from '../../../model/simulation/netTypes';

/** One started run of one model. */
export interface SimRun {
    readonly net: CompiledNet;
    /** `config.event` is always `null` here: every step consumes its input (spec §4.4). */
    readonly config: NetConfiguration;
    /** Set by a `halted` step, kept until Reset (R-SIM-29). */
    readonly halt: HaltReason | null;
    /** Closes over the snapshot of M frozen at Reset (R-SIM-14). */
    readonly guards: GuardOracle;
    readonly actions: ActionOracle;
    /** The event instance ids of the model at Reset. */
    readonly alphabet: readonly string[];
    /** The R-SIM-13 baseline: `runSignature` on the lookup the net was compiled from. */
    readonly signature: string;
}

const runs = new Map<string, SimRun>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
    version++;
    for (const l of listeners) l();
}

/**
 * True when ANY model's run holds a token on the object (tokens != 0, the
 * derived boolean view of R-SIM-11). The boolean contract of ObjectNode's
 * highlight and of `ReadCtx.isMarked` (irReadCtxLproxy.ts) is unchanged: an
 * object id belongs to one model, so the union answers for it.
 */
export function isSimActive(objectId: string): boolean {
    for (const r of runs.values()) if (isMarked(r.config.state, objectId)) return true;
    return false;
}

/** The places with a token of one run's marking. */
function markedOf(run: SimRun | undefined): string[] {
    if (!run) return [];
    const ids: string[] = [];
    for (const id of run.config.state.marking.keys()) if (isMarked(run.config.state, id)) ids.push(id);
    return ids;
}

/**
 * Snapshot copy of the marked ids. With `modelId`, that model's marking.
 * Without it, the union of every model: transitional, for callers that predate
 * R-SIM-13; new callers pass the model.
 */
export function getSimActiveIds(modelId?: string): string[] {
    if (modelId !== undefined) return markedOf(runs.get(modelId));
    const union = new Set<string>();
    for (const r of runs.values()) for (const id of markedOf(r)) union.add(id);
    return [...union];
}

/** The run of a model, or `undefined` when none was started (`Not started`). */
export function getSimRun(modelId: string): SimRun | undefined {
    return runs.get(modelId);
}

/**
 * Installs a model's run (Reset; later the restore primitive of step-back, spec
 * §9.4). Always one bump: a new net can come with the same marking, and a halt
 * cleared at an unchanged marking must still reach every reader.
 */
export function simReset(modelId: string, run: SimRun): void {
    runs.set(modelId, run);
    bump();
}

/**
 * Commits the outcome of one step of a model's run. `fired` stores the next
 * configuration, `halted` also the reason; one bump each. A discard or a
 * quiescence stores the configuration with the event consumed and does not bump;
 * a refused selector stores nothing.
 */
export function simCommit(modelId: string, outcome: StepOutcome): void {
    const run = runs.get(modelId);
    if (!run) return;
    switch (outcome.kind) {
        case 'fired':
            runs.set(modelId, { ...run, config: outcome.next });
            bump();
            return;
        case 'halted':
            runs.set(modelId, { ...run, config: outcome.next, halt: outcome.reason });
            bump();
            return;
        case 'discard':
        case 'quiescence':
            runs.set(modelId, { ...run, config: outcome.next });
            return;
        case 'inadmissible':
            return;
    }
}

/** Removes one model's run (Stop, interruption, and reset on model change or unmount). */
export function simClear(modelId: string): void {
    if (!runs.has(modelId)) return;
    runs.delete(modelId);
    bump();
}

export function getSimVersion(): number {
    return version;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** React hook: re-renders the consumer when any marking changes. */
export function useSimVersion(): number {
    return useSyncExternalStore(subscribe, getSimVersion, getSimVersion);
}

/** Tests only: the store is module-level, and a test inheriting a run would measure the file order. */
export function __resetSimRunsForTests(): void {
    runs.clear();
    version = 0;
}
