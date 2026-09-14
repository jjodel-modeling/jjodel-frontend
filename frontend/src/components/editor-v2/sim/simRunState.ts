/**
 * simRunState — run-state of the state-machine simulation (R-SIM-1, R-SIM-13).
 *
 * Module singleton (per session, not persisted): one configuration per model +
 * version counter with a React subscription hook. Same shape as
 * irCollapseState.ts, and kept outside Redux by construction: the run-state
 * never persists with the project, never enters the undo history and never
 * travels on the collaborative socket. No actions, no reducer, no bag `_state`.
 *
 * The marking is keyed on the DObject id (the M1 instance), NOT on the ReactFlow
 * vertex id: the panel works on objects, and ObjectNode maps vertex -> object
 * through `idlookup[vertexId].model` (irResolve.ts:55).
 *
 * Per model since R-SIM-13: `Map<modelId, SimConfiguration>`, so clearing one
 * model's run leaves another's alone. One global `version` stays (R-MK-6).
 */

import { useSyncExternalStore } from 'react';
import { applyStepLabel } from '../../../model/simulation/step';
import type { SimConfiguration } from '../../../model/simulation/types';

const configurations = new Map<string, SimConfiguration>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
    version++;
    for (const l of listeners) l();
}

function markingOf(modelId: string): ReadonlySet<string> {
    return configurations.get(modelId)?.marking ?? new Set<string>();
}

function store(modelId: string, marking: Set<string>): void {
    if (marking.size === 0) configurations.delete(modelId);
    else configurations.set(modelId, { marking, event: null });
}

/**
 * True when ANY model's marking holds the object. The boolean contract of
 * ObjectNode's highlight and of `ReadCtx.isMarked` (irReadCtxLproxy.ts) is
 * unchanged: an object id belongs to one model, so the union answers for it.
 */
export function isSimActive(objectId: string): boolean {
    for (const c of configurations.values()) if (c.marking.has(objectId)) return true;
    return false;
}

/**
 * Snapshot copy of the marked ids — the internal sets are never handed out.
 * With `modelId`, that model's marking. Without it, the union of every model:
 * transitional, for callers that predate R-SIM-13; new callers pass the model.
 */
export function getSimActiveIds(modelId?: string): string[] {
    if (modelId !== undefined) return [...markingOf(modelId)];
    const union = new Set<string>();
    for (const c of configurations.values()) for (const id of c.marking) union.add(id);
    return [...union];
}

/**
 * Replaces a model's whole marking (simulation reset). One bump, and only when
 * the content actually changed: an identical reset is invisible, so re-rendering
 * every subscriber for it would be pure cost (same `changed` guard as
 * irCollapseState.hydrateCollapsed).
 */
export function simReset(modelId: string, activeIds: string[]): void {
    const current = markingOf(modelId);
    const next = new Set(activeIds);
    if (next.size === current.size) {
        let same = true;
        for (const id of next) if (!current.has(id)) { same = false; break; }
        if (same) return;
    }
    store(modelId, next);
    bump();
}

/**
 * Applies one simulation step to a model as a single transition of its marking:
 * the sources given in `deactivate` leave, the targets in `activate` enter. One
 * bump for the whole step, whatever the number of objects involved.
 *
 * Deactivations are applied BEFORE activations, so activation wins on an id
 * present in both lists (self-loop, or a state re-entered by another firing
 * transition): the rule lives in `applyStepLabel` (model/simulation/step.ts),
 * shared with the core. The bump fires exactly when the previous in-place
 * version fired: a deactivated id was present, or an activated id was absent.
 */
export function simApplyStep(modelId: string, deactivate: string[], activate: string[]): void {
    const current = markingOf(modelId);
    const changed = deactivate.some(id => current.has(id)) || activate.some(id => !current.has(id));
    if (!changed) return;
    store(modelId, applyStepLabel(current, deactivate, activate));
    bump();
}

/** Empties one model's marking (stop, and reset on model change or unmount). */
export function simClear(modelId: string): void {
    if (markingOf(modelId).size === 0) return;
    configurations.delete(modelId);
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
