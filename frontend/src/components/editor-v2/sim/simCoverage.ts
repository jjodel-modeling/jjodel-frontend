/**
 * simCoverage — the coverage of a model's runs (R-SIM-140; P-2026-10-06-0115,
 * discovery 2026-10-05 §5, V1, V2).
 *
 * Per model, over the runs since the counts were last cleared:
 * - the visits of every place, token arrivals: one for each place the run's
 *   initial marking holds, one for each fired step whose postset holds it,
 *   whatever the weight, a self-loop included;
 * - the firings of every transition, the fired steps that chose it.
 * A halted step, a discard and a quiescence count nothing.
 *
 * Gathered by observing the live run (`simObserveRun`), which the canvas layer
 * does after each render: the trace entries not seen yet are counted, found by
 * identity, so a step back followed by a step between two observations still
 * counts the new one. A new net is a new run, its initial marking counted: the
 * bridge compiles one at every Reset (simBridge.ts `startRun`), and a replayed
 * scenario is a Reset and its steps, so it counts like a run. The counts are
 * outside the run record, which `simReset` replaces, so Reset, Stop, a step
 * back (never decremented: coverage is what was exercised) and a model switch
 * keep them; `simClearCoverage` empties them. Lost on reload.
 *
 * Module singleton beside simRunState.ts and simViewerPrefs.ts, outside Redux,
 * never in a bag: nothing persisted, nothing on the undo stack, no model write.
 * Its own version channel and hook, never `'mark'`, which re-renders ObjectNode
 * and the IR resolvers: a count changes what the overlay shows, not the run.
 */

import { useSyncExternalStore } from 'react';
import type { CompiledNet } from '../../../model/simulation/netTypes';
import { getSimRun } from './simRunState';
import type { SimRun, SimTraceStep } from './simRunState';

/** The counts of one model since they were last cleared; a snapshot, never changed after it is handed out. */
export interface SimCoverageCounts {
    /** Token arrivals per place id. */
    readonly visits: ReadonlyMap<string, number>;
    /** Fired steps per transition id. */
    readonly firings: ReadonlyMap<string, number>;
}

/** What one node reads: a place's visits, or the firings of the transitions compiled from the element, summed. */
export interface SimNodeCoverage {
    readonly modelId: string;
    readonly kind: 'place' | 'transition';
    readonly count: number;
}

/** The canvas layer's summary: places visited of all, transitions fired of all, over the run's net. */
export interface SimCoverageSummary {
    readonly places: number;
    readonly visited: number;
    readonly transitions: number;
    readonly fired: number;
}

interface Entry {
    counts: SimCoverageCounts;
    /** The net and the trace of the last observation, to count only what is new. */
    net: CompiledNet | null;
    trace: readonly SimTraceStep[];
}

const EMPTY: SimCoverageCounts = { visits: new Map(), firings: new Map() };

const entries = new Map<string, Entry>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
    version++;
    for (const l of listeners) l();
}

/** The counts of a model, empty when none were taken. */
export function getSimCoverage(modelId: string): SimCoverageCounts {
    return entries.get(modelId)?.counts ?? EMPTY;
}

/**
 * Counts what the live run of a model holds that the last observation did not:
 * the initial marking and every step when its net is new, the trace entries past
 * the part shared with the last observation otherwise. One bump of the coverage
 * channel when a count changed, none otherwise, so observing twice is harmless.
 */
export function simObserveRun(modelId: string, run: SimRun): void {
    const entry = entries.get(modelId) ?? { counts: EMPTY, net: null, trace: [] };
    const trace = run.trace ?? [];
    const visits = new Map(entry.counts.visits);
    const firings = new Map(entry.counts.firings);
    const add = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    let changed = false;
    let from = 0;
    if (entry.net !== run.net) {
        for (const [place, n] of run.net.initial.marking) if (n > 0) { add(visits, place); changed = true; }
    } else {
        const shared = Math.min(entry.trace.length, trace.length);
        while (from < shared && entry.trace[from] === trace[from]) from++;
    }
    const byId = new Map(run.net.transitions.map(t => [t.id, t]));
    for (const t of trace.slice(from)) {
        if (t.kind !== 'fired' || t.selector === null) continue;
        add(firings, t.selector);
        for (const arc of byId.get(t.selector)?.postset ?? []) add(visits, arc.place);
        changed = true;
    }
    entries.set(modelId, { counts: changed ? { visits, firings } : entry.counts, net: run.net, trace });
    if (changed) bump();
}

/**
 * Clear: empties a model's counts. The run seen stays seen, so only the steps after it count. With the model's
 * run (R-SIM-146), the places its live configuration marks are then counted once each as visited, so a place
 * that holds a token is not veiled until a new token arrives; the live configuration, whatever step is viewed
 * (R-SIM-106). One bump.
 */
export function simClearCoverage(modelId: string, run?: SimRun): void {
    const entry = entries.get(modelId);
    const visits = new Map<string, number>();
    if (run) for (const [place, n] of run.config.state.marking) if (n > 0) visits.set(place, 1);
    entries.set(modelId, {
        counts: visits.size > 0 ? { visits, firings: new Map() } : EMPTY,
        net: entry?.net ?? null,
        trace: entry?.trace ?? [],
    });
    bump();
}

/** Per net, the transitions compiled from each element (`origin`). */
const originCache = new WeakMap<CompiledNet, ReadonlyMap<string, readonly string[]>>();

function transitionsOf(net: CompiledNet): ReadonlyMap<string, readonly string[]> {
    let out = originCache.get(net);
    if (!out) {
        const m = new Map<string, string[]>();
        for (const t of net.transitions) for (const element of t.origin) m.set(element, [...(m.get(element) ?? []), t.id]);
        originCache.set(net, m);
        out = m;
    }
    return out;
}

/**
 * What the node of `objectId` reads of the coverage of the model whose live run
 * knows it: a place's visits, else the firings of the transitions compiled from
 * it, summed; 0 when never. `null` when no run knows the element as either, and
 * without a run (Stop): the counts are kept, not shown.
 */
export function getSimNodeCoverage(objectId: string): SimNodeCoverage | null {
    for (const [modelId, entry] of entries) {
        const net = getSimRun(modelId)?.net;
        if (!net) continue;
        if (net.places.has(objectId)) return { modelId, kind: 'place', count: entry.counts.visits.get(objectId) ?? 0 };
        const ts = transitionsOf(net).get(objectId);
        if (ts) return { modelId, kind: 'transition', count: ts.reduce((sum, id) => sum + (entry.counts.firings.get(id) ?? 0), 0) };
    }
    return null;
}

/** The summary over a net: its places with a visit, its transitions with a firing. */
export function simCoverageSummary(net: CompiledNet, counts: SimCoverageCounts): SimCoverageSummary {
    return {
        places: net.places.size,
        visited: [...net.places].filter(p => (counts.visits.get(p) ?? 0) > 0).length,
        transitions: net.transitions.length,
        fired: net.transitions.filter(t => (counts.firings.get(t.id) ?? 0) > 0).length,
    };
}

export function getSimCoverageVersion(): number {
    return version;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** React hook: re-renders the consumer when a model's counts change. The canvas layer and the node overlays. */
export function useSimCoverageVersion(): number {
    return useSyncExternalStore(subscribe, getSimCoverageVersion, getSimCoverageVersion);
}

/** Tests only: the store is module-level, and a test inheriting counts would measure the file order. */
export function __resetSimCoverageForTests(): void {
    entries.clear();
    version = 0;
}
