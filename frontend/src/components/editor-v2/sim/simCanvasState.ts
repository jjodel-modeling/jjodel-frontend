/**
 * simCanvasState: what the canvas reads of a run, per node (S15, slice A1,
 * P-2026-09-27-1647; ratified 2026-09-27, C-2026-09-27-1437).
 *
 * Pure: no React, no store. The run-state singleton (simRunState.ts) calls it
 * per object; the node overlay (SimNodeRunState.tsx) paints what it returns.
 * The IR interpreter is not involved (R-SIM-3 pattern, R-SIM-4 untouched):
 * every node gets the same overlay whichever branch of ObjectNode paints it.
 *
 * Three readings of one committed configuration:
 * - the tokens of every place of the net, 0 included;
 * - the semantic σ of the element, stored then derived; the presentation
 *   space stays out, as it does in the panel's marking line (simBridge.ts);
 * - the elements a candidate transition was compiled from (`origin`), for ε
 *   and every event of the alphabet, while the run can move.
 */

import { candidates, tokens } from '../../../model/simulation/netStep';
import { netStcFromRoles } from '../../../model/simulation/netCompile';
import type { SimState, SimValue } from '../../../model/simulation/netTypes';
import type { SimRun } from './simRunState';

/** The part of a run the canvas reads. */
export type SimCanvasRun = Pick<SimRun, 'net' | 'config' | 'guards' | 'alphabet' | 'halt'>;

/** One semantic attribute of an element in σ, as text. */
export interface SimSigmaRow {
    readonly attr: string;
    readonly value: string;
}

/** What one node shows of a run. */
export interface SimNodeState {
    /** The model whose run knows the element. */
    readonly modelId: string;
    /** The element's tokens when it is a place of the net, 0 included; `null` otherwise. */
    readonly tokens: number | null;
    /** The element's semantic σ, sorted by attribute. */
    readonly sigma: readonly SimSigmaRow[];
    /** A candidate transition of some input was compiled from the element. */
    readonly enabled: boolean;
}

/**
 * Per run record: a commit replaces the record (simRunState.ts), so a cache
 * keyed on it can never outlive the configuration it was computed from.
 */
const enabledCache = new WeakMap<SimCanvasRun, ReadonlySet<string>>();

/**
 * The elements the candidate transitions of ε and of every event were compiled
 * from. Empty on a halted run: `candidates` does not read the halt, the panel
 * gates on the status, and so must the canvas. A terminated configuration has
 * no candidate by definition (R-SIM-27).
 */
export function enabledElements(run: SimCanvasRun): ReadonlySet<string> {
    const cached = enabledCache.get(run);
    if (cached) return cached;
    const out = new Set<string>();
    if (run.halt === null) {
        const byId = new Map(run.net.transitions.map(t => [t.id, t]));
        for (const event of [null, ...run.alphabet]) {
            const cs = candidates(run.net, { state: run.config.state, event }, run.guards);
            for (const c of cs.candidates) for (const element of byId.get(c.transition)?.origin ?? []) out.add(element);
        }
    }
    enabledCache.set(run, out);
    return out;
}

/** The element's attributes of one σ space, `[]` when it has none. */
function rowsOf(space: SimState['attrs'] | undefined, element: string): SimSigmaRow[] {
    const values = space?.get(element);
    if (!values) return [];
    return [...values].map(([attr, value]: [string, SimValue]) => ({ attr, value: String(value) }));
}

/**
 * What the node of `objectId` shows of `run`: `null` when the run does not know
 * the element (not a place, not the origin of a candidate, no σ). The model's
 * globals are keyed on the model id, which is never a node, so they stay in the
 * panel.
 */
export function nodeStateOf(run: SimCanvasRun, objectId: string): SimNodeState | null {
    const state = run.config.state;
    const isPlace = run.net.places.has(objectId);
    const enabled = enabledElements(run).has(objectId);
    const sigma = [...rowsOf(state.attrs, objectId), ...rowsOf(state.derived?.attrs, objectId)]
        .sort((a, b) => a.attr.localeCompare(b.attr));
    if (!isPlace && !enabled && sigma.length === 0) return null;
    return { modelId: run.net.modelId, tokens: isPlace ? tokens(state, objectId) : null, sigma, enabled };
}

/**
 * The feature of the initial marking (R-SIM-9, `simInitialMarking`) of the
 * model's metamodel, read from the same bag the run was started from (the
 * panel's `configModelId`, the model's `instanceof`). `null` when the roles
 * cannot make a net.
 */
export function initialMarkingFeature(lookup: Record<string, any>, modelId: string): string | null {
    const metamodel = lookup[modelId]?.instanceof;
    const bag = typeof metamodel === 'string' ? lookup[metamodel]?._state : undefined;
    return netStcFromRoles(bag)?.initialMarking ?? null;
}

/**
 * True when the row of `rowId` shows the initial marking: a slot whose value
 * instantiates `feature`, or a lazy placeholder, whose id is the feature's own.
 */
export function isInitialMarkingRow(lookup: Record<string, any>, rowId: string, feature: string | null): boolean {
    if (feature === null) return false;
    return rowId === feature || lookup[rowId]?.instanceof === feature;
}
