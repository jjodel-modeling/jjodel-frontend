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
 *
 * Slice A2 of S15 (P-2026-09-27-2324) adds the second channel of R-SIM-33 3c:
 * the choice version, with its own listeners. It rises only when the panel
 * opens, replaces or closes its «Choose a transition» list, and only the node
 * overlays (SimNodeRunState.tsx) follow it: ObjectNode and the IR resolvers
 * read the `'mark'` version alone, so a choice never re-renders them.
 *
 * R-SIM-100 (P-2026-09-29-1840) adds the minimal trace: the run's seed, its
 * draw count and its committed steps, each with the origin of a choice among
 * two or more candidates, `user` or `random`. In memory only; the export is
 * spec step 5.
 *
 * R-SIM-101 (P-2026-09-29-1943) adds the run policy of each model, in a map
 * beside the runs: how an ε choice is resolved, `ask` (the list) or `random`
 * (a draw), and Play's step limit k. Default `{ ask, 100 }`; lost on reload,
 * kept across Reset, Stop, a clear and a model switch, since no run primitive
 * touches it. It is not in the model and never enters a run record.
 */

import { useSyncExternalStore } from 'react';
import { isMarked } from '../../../model/simulation/netStep';
import { choiceElements, nodeStateOf, type SimNodeState } from './simCanvasState';
import type {
    ActionOracle, CompiledNet, DerivedOracle, GuardOracle, HaltReason, InputRead, NetConfiguration, StepOutcome,
} from '../../../model/simulation/netTypes';

/** Who chose a step among two or more candidates (R-SIM-100): a click on the list, or a draw. */
export type SimOrigin = 'user' | 'random';

/** One committed step of a run's trace (R-SIM-100): what its label says, and who chose it. */
export interface SimTraceStep {
    readonly event: string | null;
    readonly selector: string | null;
    readonly kind: 'fired' | 'halted' | 'discard' | 'quiescence';
    /** Absent on a forced step, zero or one candidate: nothing was chosen. */
    readonly origin?: SimOrigin;
}

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
    /** The derived attributes of every σ′ (lane C2, R-SIM-73); absent when none is declared. */
    readonly derived?: DerivedOracle;
    /** The event instance ids of the model at Reset. */
    readonly alphabet: readonly string[];
    /** The R-SIM-13 baseline: `runSignature` on the lookup the net was compiled from. */
    readonly signature: string;
    /**
     * R-SIM-88: per transition id, the inputs its guards (its `else` siblings' too) and its actions read,
     * folded at Reset over the frozen M; absent when no input is declared. The bridge asks them at a press.
     */
    readonly inputs?: ReadonlyMap<string, readonly InputRead[]>;
    /** R-SIM-100: the seed of the run's draws, drawn once at Reset; draw i is `uniform(seed, i)` (simRandom.ts). */
    readonly seed?: number;
    /** R-SIM-100: the draws consumed so far, so the index of the next one. */
    readonly draws?: number;
    /** R-SIM-100: the committed steps, in order; a refused selector is not one. */
    readonly trace?: readonly SimTraceStep[];
}

/** How a run resolves an ε choice among two or more candidates (R-SIM-101): the list asks, or a draw decides. */
export type SimChoices = 'ask' | 'random';

/** The run policy of one model (R-SIM-101): how ε choices are resolved, and the steps of one Play press at most. */
export interface SimPolicy {
    readonly choices: SimChoices;
    readonly k: number;
}

export const DEFAULT_SIM_POLICY: SimPolicy = { choices: 'ask', k: 100 };

/** The largest k the panel's input accepts; the smallest is 1. */
export const MAX_PLAY_STEPS = 1000;

const policies = new Map<string, SimPolicy>();

const runs = new Map<string, SimRun>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
    version++;
    for (const l of listeners) l();
}

/** The open choice list of each model, as the elements its transitions were compiled from (slice A2). */
const pendings = new Map<string, ReadonlySet<string>>();
let choiceVersion = 0;
const choiceListeners = new Set<() => void>();

function bumpChoice(): void {
    choiceVersion++;
    for (const l of choiceListeners) l();
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
 * What the node of an object shows of the run that knows it (S15, slice A1):
 * its tokens, its σ, whether a candidate was compiled from it. `null` when no
 * run knows the object. An object id belongs to one model, so the first run
 * that knows it is the only one (R-SIM-13). Read on the `'mark'` version: the
 * enabled set is cached per run record, which every commit replaces.
 */
export function getSimNodeState(objectId: string): SimNodeState | null {
    for (const r of runs.values()) {
        const s = nodeStateOf(r, objectId);
        if (s) return s;
    }
    return null;
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
 * The trace and the draw count after one committed step (R-SIM-100). The origin
 * holds only where the label has two or more candidates, so a forced step has
 * none whatever the caller passed; a random choice among them is one draw.
 */
function traced(run: SimRun, outcome: Exclude<StepOutcome, { kind: 'inadmissible' }>, origin?: SimOrigin): Pick<SimRun, 'trace' | 'draws'> {
    const chosen = outcome.label.candidates.length > 1 ? origin : undefined;
    const entry: SimTraceStep = {
        event: outcome.label.event, selector: outcome.label.selector, kind: outcome.kind, ...(chosen ? { origin: chosen } : {}),
    };
    return { trace: [...(run.trace ?? []), entry], draws: (run.draws ?? 0) + (chosen === 'random' ? 1 : 0) };
}

/**
 * Commits the outcome of one step of a model's run. `fired` stores the next
 * configuration, `halted` also the reason; one bump each. A discard or a
 * quiescence stores the configuration with the event consumed and does not bump;
 * a refused selector stores nothing. Every stored step is appended to the trace,
 * with `origin` when it was chosen among candidates (R-SIM-100).
 */
export function simCommit(modelId: string, outcome: StepOutcome, origin?: SimOrigin): void {
    const run = runs.get(modelId);
    if (!run) return;
    switch (outcome.kind) {
        case 'fired':
            runs.set(modelId, { ...run, ...traced(run, outcome, origin), config: outcome.next });
            bump();
            return;
        case 'halted':
            runs.set(modelId, { ...run, ...traced(run, outcome, origin), config: outcome.next, halt: outcome.reason });
            bump();
            return;
        case 'discard':
        case 'quiescence':
            runs.set(modelId, { ...run, ...traced(run, outcome, origin), config: outcome.next });
            return;
        case 'inadmissible':
            return;
    }
}

/**
 * Publishes the panel's open choice list of a model (slice A2): `transitions`
 * are the ids of its candidates, `null` closes it. Called by the panel where it
 * sets its pending list, and at every site that clears it; a publish with no run
 * closes the list, since the panel shows none without one. Bumps the choice
 * version only, and not when there is nothing to close.
 */
export function simSetPending(modelId: string, transitions: readonly string[] | null): void {
    const run = runs.get(modelId);
    if (transitions === null || !run) {
        if (!pendings.delete(modelId)) return;
        bumpChoice();
        return;
    }
    pendings.set(modelId, choiceElements(run.net, transitions));
    bumpChoice();
}

/**
 * True when the object is an element of a candidate of an open choice list.
 * Only while that model has a run, as the panel shows its list (`pending && run`);
 * the panel closes the list at Reset, at Stop and at an interruption.
 */
export function isSimPending(objectId: string): boolean {
    for (const [modelId, elements] of pendings) if (runs.has(modelId) && elements.has(objectId)) return true;
    return false;
}

/** The run policy of a model: its own when one was set, the default otherwise (R-SIM-101). */
export function getSimPolicy(modelId: string): SimPolicy {
    return policies.get(modelId) ?? DEFAULT_SIM_POLICY;
}

/**
 * Changes a model's run policy and returns it (R-SIM-101); what the change does
 * not name is kept. k is stored as an integer in 1..MAX_PLAY_STEPS, and a k
 * that is not a finite number keeps the old one. No version bump: the canvas
 * does not read the policy, and the panel re-reads it after its own change.
 */
export function setSimPolicy(modelId: string, change: Partial<SimPolicy>): SimPolicy {
    const old = getSimPolicy(modelId);
    const k = change.k === undefined || !Number.isFinite(change.k) ? old.k : Math.min(MAX_PLAY_STEPS, Math.max(1, Math.round(change.k)));
    const next: SimPolicy = { choices: change.choices ?? old.choices, k };
    policies.set(modelId, next);
    return next;
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

export function getSimChoiceVersion(): number {
    return choiceVersion;
}

function subscribeChoice(fn: () => void): () => void {
    choiceListeners.add(fn);
    return () => choiceListeners.delete(fn);
}

/** React hook: re-renders the consumer when a choice list opens, changes or closes. The node overlays only. */
export function useSimChoiceVersion(): number {
    return useSyncExternalStore(subscribeChoice, getSimChoiceVersion, getSimChoiceVersion);
}

/** Tests only: the store is module-level, and a test inheriting a run would measure the file order. */
export function __resetSimRunsForTests(): void {
    runs.clear();
    version = 0;
    pendings.clear();
    choiceVersion = 0;
    policies.clear();
}
