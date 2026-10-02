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
 *
 * R-SIM-106 (P-2026-10-03-0040): the trace is navigable. A committed step keeps
 * its configuration beside the trace, the last `SIM_KEEP_CONFIGS` of them, and
 * the inputs it was given; `configAt` rebuilds an older one by replay. A model
 * can show a past step (`simSetView`): the canvas readers of this module read
 * the shown configuration through one record cached per (run, step), while the
 * run itself, and `getSimRun`, stay live. Showing a step bumps the `'mark'`
 * version; a stored commit, Reset and Stop return to live. R-SIM-108 adds the
 * reader of an element's presentation, `getSimPresentation`, on the same record.
 */

import { useSyncExternalStore } from 'react';
import { isMarked, presentationOf, step } from '../../../model/simulation/netStep';
import { choiceElements, nodeStateOf, type SimNodeState } from './simCanvasState';
import type {
    ActionOracle, CompiledNet, DerivedOracle, GuardOracle, HaltReason, InputRead, NetConfiguration, SimState, SimStateAccess, SimValue, StepOutcome,
} from '../../../model/simulation/netTypes';
import type { InputValue } from './simBridge';

/** Who chose a step among two or more candidates (R-SIM-100): a click on the list, or a draw. */
export type SimOrigin = 'user' | 'random';

/** One committed step of a run's trace (R-SIM-100): what its label says, and who chose it. */
export interface SimTraceStep {
    readonly event: string | null;
    readonly selector: string | null;
    readonly kind: 'fired' | 'halted' | 'discard' | 'quiescence';
    /** Absent on a forced step, zero or one candidate: nothing was chosen. */
    readonly origin?: SimOrigin;
    /** R-SIM-106: the values the environment gave the inputs the step read (R-SIM-88), so a replay reads them; absent when none was given. */
    readonly inputs?: readonly InputValue[];
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
    /**
     * R-SIM-106: the configuration after each of the last `SIM_KEEP_CONFIGS` committed steps, in order, the
     * last one `config`; step 0, `net.initial`, is never kept, and an older step is rebuilt by `configAt`.
     */
    readonly keptConfigs?: readonly NetConfiguration[];
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

/** R-SIM-106: the configurations a run keeps, the last ones; about 100 B each on the demo scenes (discovery 2026-10-02 §4). */
export const SIM_KEEP_CONFIGS = 1000;

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

/** A past step a model's run shows instead of its live configuration (R-SIM-106). */
interface SimViewed {
    /** The run record the view was taken on: a commit, Reset or Stop replaces or drops it, and the view with it. */
    readonly live: SimRun;
    readonly n: number;
    /** The run as step n shows it, created once: the enabled set is cached per record (simCanvasState.ts). */
    readonly record: SimRun;
    /** σ before step n, for the changes step n made; `null` at step 0. */
    readonly before: SimState | null;
}

const views = new Map<string, SimViewed>();

/** σ before the live step of a run record, computed once per record. */
const liveBefore = new WeakMap<SimRun, SimState | null>();

/** The live step of a run: its committed steps. */
function stepOf(run: SimRun): number {
    return run.trace?.length ?? 0;
}

/** σ before step n of a run, `null` at step 0. */
function stateBefore(run: SimRun, n: number): SimState | null {
    return n === 0 ? null : configAt(run, n - 1)?.state ?? null;
}

function viewedOf(modelId: string, run: SimRun): SimViewed | null {
    const v = views.get(modelId);
    return v && v.live === run ? v : null;
}

/** The run of a model as the canvas shows it: the cached record of the viewed step, the live run otherwise. */
function shown(modelId: string, run: SimRun): SimRun {
    return viewedOf(modelId, run)?.record ?? run;
}

/** σ before the shown step, for the changes it made. */
function shownBefore(modelId: string, run: SimRun): SimState | null {
    const v = viewedOf(modelId, run);
    if (v) return v.before;
    let before = liveBefore.get(run);
    if (before === undefined) {
        before = stateBefore(run, stepOf(run));
        liveBefore.set(run, before);
    }
    return before;
}

/**
 * True when ANY model's run holds a token on the object (tokens != 0, the
 * derived boolean view of R-SIM-11). The boolean contract of ObjectNode's
 * highlight and of `ReadCtx.isMarked` (irReadCtxLproxy.ts) is unchanged: an
 * object id belongs to one model, so the union answers for it. A run read on
 * the step it shows (R-SIM-106).
 */
export function isSimActive(objectId: string): boolean {
    for (const [modelId, r] of runs) if (isMarked(shown(modelId, r).config.state, objectId)) return true;
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
 * R-SIM-13; new callers pass the model. A run read on the step it shows.
 */
export function getSimActiveIds(modelId?: string): string[] {
    if (modelId !== undefined) {
        const run = runs.get(modelId);
        return markedOf(run && shown(modelId, run));
    }
    const union = new Set<string>();
    for (const [id, r] of runs) for (const marked of markedOf(shown(id, r))) union.add(marked);
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
 * enabled set is cached per run record, which every commit replaces. A run is
 * read on the step it shows, with the changes that step made (R-SIM-106, R-SIM-107).
 */
export function getSimNodeState(objectId: string): SimNodeState | null {
    for (const [modelId, r] of runs) {
        const s = nodeStateOf(shown(modelId, r), objectId, shownBefore(modelId, r));
        if (s) return s;
    }
    return null;
}

/**
 * R-SIM-108: an element's presentation attribute on the configuration its run
 * shows, the viewed step's while one is shown, through the record the overlay
 * reads, so the two never show different steps; stored then derived, as the
 * engine reads it (`presentationOf`). `undefined` when no run knows the element
 * or its σ has no such value. A reader: it bumps nothing, and views never write.
 */
export function getSimPresentation(objectId: string, attr: string): SimValue | undefined {
    for (const [modelId, r] of runs) {
        const value = presentationOf(shown(modelId, r).config.state, objectId, attr);
        if (value !== undefined) return value;
    }
    return undefined;
}

/**
 * Installs a model's run (Reset; later the restore primitive of step-back, spec
 * §9.4). Always one bump: a new net can come with the same marking, and a halt
 * cleared at an unchanged marking must still reach every reader. A past step
 * shown returns to live.
 */
export function simReset(modelId: string, run: SimRun): void {
    views.delete(modelId);
    runs.set(modelId, run);
    bump();
}

/**
 * The run with its oracles reading `values` for the inputs they name, σ for
 * everything else. A value for a name that is not an input of its element is
 * ignored, so an answer never shadows σ. The record is not stored: the values
 * hold for this press only, and σ′ is built from σ and the assignments alone.
 * Moved from simBridge.ts (P-2026-10-03-0040): the press and the replay of
 * `configAt` read the inputs of a step through the one overlay.
 */
export function withInputs(run: SimRun, values: readonly InputValue[]): SimRun {
    const given = new Map<string, SimValue>();
    for (const v of values) {
        if (run.net.declared.get(v.element)?.get(v.attr)?.input === true) given.set(`${v.element}\u0000${v.attr}`, v.value);
    }
    const over = (s: SimStateAccess): SimStateAccess => ({
        ...s,
        read: (element, attr) => {
            const key = `${element}\u0000${attr}`;
            return given.has(key) ? given.get(key) : s.read(element, attr);
        },
    });
    return { ...run, guards: (site, e, s) => run.guards(site, e, over(s)), actions: (site, e, s) => run.actions(site, e, over(s)) };
}

/**
 * The configuration of step n of a run (R-SIM-106): step 0 is the net's initial
 * σ, step m (the trace's length) the live configuration, a kept step its kept
 * configuration. An older one is rebuilt by replay from `net.initial` over the
 * recorded selectors, each step with the inputs it was given, through the run's
 * own oracles over the M frozen at Reset (R-SIM-14); the seed is not needed, a
 * draw is recorded as its selector. `null` out of 0..m, and where the replay
 * disagrees with the trace (a refused selector, another kind of step).
 */
export function configAt(run: SimRun, n: number): NetConfiguration | null {
    const trace = run.trace ?? [];
    const m = trace.length;
    if (!Number.isInteger(n) || n < 0 || n > m) return null;
    if (n === m) return run.config;
    const kept = run.keptConfigs ?? [];
    const index = n - (m - kept.length) - 1;
    if (index >= 0) return kept[index];
    let cfg: NetConfiguration = { state: run.net.initial, event: null };
    for (const t of trace.slice(0, n)) {
        const given = t.inputs ? withInputs(run, t.inputs) : run;
        const o = step(run.net, { state: cfg.state, event: t.event }, t.selector, given.guards, given.actions, run.derived);
        if (o.kind === 'inadmissible' || o.kind !== t.kind) return null;
        cfg = o.next;
    }
    return cfg;
}

/**
 * The trace, the draw count and the kept configurations after one committed
 * step (R-SIM-100, R-SIM-106). The origin holds only where the label has two or
 * more candidates, so a forced step has none whatever the caller passed; a
 * random choice among them is one draw. The inputs are recorded as given, a
 * copy, when there are any. The configuration is kept, the oldest dropped
 * beyond `SIM_KEEP_CONFIGS`.
 */
function traced(
    run: SimRun, outcome: Exclude<StepOutcome, { kind: 'inadmissible' }>, origin?: SimOrigin, inputs?: readonly InputValue[],
): Pick<SimRun, 'trace' | 'draws' | 'keptConfigs'> {
    const chosen = outcome.label.candidates.length > 1 ? origin : undefined;
    const entry: SimTraceStep = {
        event: outcome.label.event, selector: outcome.label.selector, kind: outcome.kind, ...(chosen ? { origin: chosen } : {}),
        ...(inputs && inputs.length > 0 ? { inputs: [...inputs] } : {}),
    };
    const kept = run.keptConfigs ?? [];
    return {
        trace: [...(run.trace ?? []), entry],
        draws: (run.draws ?? 0) + (chosen === 'random' ? 1 : 0),
        keptConfigs: [...(kept.length < SIM_KEEP_CONFIGS ? kept : kept.slice(kept.length - SIM_KEEP_CONFIGS + 1)), outcome.next],
    };
}

/**
 * Commits the outcome of one step of a model's run. `fired` stores the next
 * configuration, `halted` also the reason; one bump each. A discard or a
 * quiescence stores the configuration with the event consumed and does not bump;
 * a refused selector stores nothing. Every stored step is appended to the trace,
 * with `origin` when it was chosen among candidates (R-SIM-100) and the `inputs`
 * the press was given (R-SIM-106), and its configuration is kept. A stored step
 * returns a past step shown to live, with a bump where the step itself has none.
 */
export function simCommit(modelId: string, outcome: StepOutcome, origin?: SimOrigin, inputs?: readonly InputValue[]): void {
    const run = runs.get(modelId);
    if (!run) return;
    const viewed = outcome.kind !== 'inadmissible' && views.delete(modelId);
    switch (outcome.kind) {
        case 'fired':
            runs.set(modelId, { ...run, ...traced(run, outcome, origin, inputs), config: outcome.next });
            bump();
            return;
        case 'halted':
            runs.set(modelId, { ...run, ...traced(run, outcome, origin, inputs), config: outcome.next, halt: outcome.reason });
            bump();
            return;
        case 'discard':
        case 'quiescence':
            runs.set(modelId, { ...run, ...traced(run, outcome, origin, inputs), config: outcome.next });
            if (viewed) bump();
            return;
        case 'inadmissible':
            return;
    }
}

/**
 * Shows step n of a model's run instead of its live configuration (R-SIM-106);
 * `null`, or the live step, shows live. Read-only: the run does not move and
 * `getSimRun` stays live, while `isSimActive`, `getSimActiveIds`,
 * `getSimNodeState` and `getSimPresentation` read the shown step through one
 * record, built here once. One bump of the `'mark'` version when what is shown
 * changes, none otherwise; a step out of 0..m, or one the replay cannot
 * rebuild, changes nothing.
 */
export function simSetView(modelId: string, n: number | null): void {
    const run = runs.get(modelId);
    if (!run || n === null || n === stepOf(run)) {
        if (views.delete(modelId)) bump();
        return;
    }
    if (viewedOf(modelId, run)?.n === n) return;
    const config = configAt(run, n);
    if (!config) return;
    views.set(modelId, { live: run, n, record: { ...run, config, halt: null }, before: stateBefore(run, n) });
    bump();
}

/** The past step a model's run shows, `null` while it shows the live one or has no run (R-SIM-106). */
export function getSimView(modelId: string): number | null {
    const run = runs.get(modelId);
    return run ? viewedOf(modelId, run)?.n ?? null : null;
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

/** Removes one model's run (Stop, interruption, and reset on model change or unmount); a past step shown goes with it. */
export function simClear(modelId: string): void {
    views.delete(modelId);
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
    views.clear();
    pendings.clear();
    choiceVersion = 0;
    policies.clear();
}
