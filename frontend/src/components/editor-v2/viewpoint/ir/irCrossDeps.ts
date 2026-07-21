/**
 * irCrossDeps — cross-object dependency tracking for multi-hop PathExprs
 * (spec v1.2 sez. 9). Closes the "stale observer" limit: a view whose label or
 * predicate reads a feature of a *navigated* object (e.g. `$assignee.value.$name.value`)
 * must re-render when that feature changes, not only when its own slots change.
 *
 * Design (discovery 2026-07-20, option d — passive registry, NO store.subscribe):
 *
 * - Compile time: irCompile emits `crossPaths` per view (structured hop chain +
 *   terminal feature).
 * - Render time (two-phase): the observer's render resolves its view, walks each
 *   crossPath against the CURRENT idlookup with DRAW semantics (mirroring the
 *   compiled accessor), concretizes each cross-object pair (objectId, feature) to
 *   the DValue id (fid), and PUBLISHES the fid list here.
 * - Selector time: the observer's existing useSelector appends
 *   `crossDepsSignature(idlookup, key)` — a snapshot of the published fids' values.
 *   When any observed DValue changes (Redux replaces it in idlookup) the signature
 *   changes and only that observer re-renders, which re-publishes a fresh set.
 *
 * The registry never subscribes to the store: it is read by selectors already
 * running per node per dispatch (irResolve, useIRContainment), so the added cost
 * is O(#published fids) inside machinery that already runs. No new rAF, no
 * updateNodeInternals, no O(model) per-store-change work (perf contract from the
 * edge-settle trickle discovery).
 *
 * Backend: DRAW only. The concretization walks state.idlookup directly via
 * findFeatureRaw (no L-proxy upperBound coercion), so the observed targets match
 * the rendered value (decision 2026-07-20).
 */

import { findFeatureRaw, navigateRefHop } from './irReadCtx';
import type { CompiledCrossPath } from './irTypes';

type Idlookup = Record<string, any>;

/** Safety cap on multivalue fan-out per path level (spec v1.2 sez. 9, Q6.2). */
export const CROSS_FANOUT_CAP = 100;

export interface CrossDepResult {
    /** DValue ids to observe (the terminal + intermediate cross-object slots). */
    fids: string[];
    /** Pairs whose feature does not resolve on the target (renamed/removed M2 feature). */
    unresolved: { objectId: string; feature: string }[];
    /** True when a multivalue level exceeded CROSS_FANOUT_CAP and was truncated. */
    capped: boolean;
}

/**
 * Walk each crossPath from `objectId` and return the DValue ids to observe.
 * Pure: reads only `idlookup`, no store, no proxy, no side effects.
 *
 * Level 0 is the observer's own slot (self) — NOT observed here, the self
 * subscription already covers it — but IS navigated. Levels >= 1 are cross-object:
 * their (currentObject, feature) pair is concretized to a fid. Navigation goes
 * through the shared `navigateRefHop` helper — the SAME code the compiled render
 * accessor uses via ReadCtx.getRef — so render and reactivity cannot diverge
 * (discovery 2026-07-21): 'value' -> values[0], values[N] -> values[N];
 * a whole-array 'values' intermediate hop dead-ends.
 */
export function resolveCrossDeps(
    idlookup: Idlookup,
    objectId: string,
    crossPaths: CompiledCrossPath[] | undefined,
    opts?: { cap?: number },
): CrossDepResult {
    const fids = new Set<string>();
    const unresolved: { objectId: string; feature: string }[] = [];
    let capped = false;
    if (!crossPaths || crossPaths.length === 0) return { fids: [], unresolved, capped };
    const cap = opts?.cap ?? CROSS_FANOUT_CAP;

    for (const cp of crossPaths) {
        const steps = [...cp.hops, cp.terminal];
        let frontier: string[] = [objectId];
        for (let level = 0; level < steps.length; level++) {
            const step = steps[level];
            const isTerminal = level === steps.length - 1;
            const seen = new Set<string>();
            const next: string[] = [];
            for (const cur of frontier) {
                if (seen.has(cur)) continue;
                seen.add(cur);
                const dv = findFeatureRaw(idlookup, cur, step.feature);
                if (level > 0) {
                    // cross-object pair: observe the DValue slot on this target.
                    if (dv && typeof dv.id === 'string') fids.add(dv.id);
                    else unresolved.push({ objectId: cur, feature: step.feature });
                }
                if (!isTerminal) {
                    // navigate via the shared helper (same semantics as the render accessor).
                    const t = navigateRefHop(idlookup, cur, step.feature, step.take);
                    if (t) next.push(t);
                }
            }
            if (isTerminal) break;
            frontier = next;
            if (frontier.length > cap) { capped = true; frontier = frontier.slice(0, cap); }
            if (frontier.length === 0) break;
        }
    }
    return { fids: Array.from(fids), unresolved, capped };
}

// ---- passive registry (published by render, consumed by selectors) ---------

/** observer key (vertexId for vertices, edge-object id for object-as-edges) -> fids */
const published = new Map<string, string[]>();
/** the edge-object ids whose cross deps were published in the last decoration pass */
let edgeObjectKeys: string[] = [];
/** current irSig epoch, to drop the whole registry on a viewpoint change */
let epoch: string | null = null;

/** Publish the resolved cross-dep fids for an observer (empty clears the entry). */
export function publishCrossDeps(key: string, fids: string[]): void {
    if (fids.length > 0) published.set(key, fids);
    else published.delete(key);
}

export function getPublishedCrossDeps(key: string): string[] | undefined {
    return published.get(key);
}

/** Drop one observer's published deps (call on unmount). */
export function clearCrossDeps(key: string): void {
    published.delete(key);
}

/** Publish the list of edge-object ids observed in the last decoration pass. */
export function publishEdgeObjectKeys(keys: string[]): void {
    edgeObjectKeys = keys;
}

export function getEdgeObjectKeys(): string[] {
    return edgeObjectKeys;
}

/**
 * Reset the registry when the active viewpoint (irSig) changes. Returns true if a
 * reset happened. Called at the START of the containment memo (the top-level IR
 * consumer, rendered before the ObjectNodes): every observer re-renders on an
 * irSig change and re-publishes in the same commit, so clearing first is safe and
 * prevents leaking deps of the previous viewpoint's objects.
 */
export function resetCrossDepsEpoch(irSig: string): boolean {
    if (irSig === epoch) return false;
    epoch = irSig;
    published.clear();
    edgeObjectKeys = [];
    warnedUnresolved.clear();
    warnedCapped.clear();
    return true;
}

/**
 * Signature of the published fids for an observer, for inclusion in its selector.
 * A gone fid (deleted DValue) serializes to a distinct marker so its disappearance
 * still invalidates the observer (spec v1.2 sez. 9, Q6.4).
 */
export function crossDepsSignature(idlookup: Idlookup, key: string): string {
    const fids = published.get(key);
    if (!fids || fids.length === 0) return '';
    let s = '';
    for (const fid of fids) {
        const dv = idlookup?.[fid];
        s += dv && Array.isArray(dv.values) ? `|${fid}=${JSON.stringify(dv.values)}` : `|${fid}=∅`;
    }
    return s;
}

// ---- one-shot diagnostics --------------------------------------------------

const warnedUnresolved = new Set<string>();
const warnedCapped = new Set<string>();

/** One-shot console.warn per (viewId, feature) for an unresolved cross-object pair. */
export function warnUnresolvedCrossDeps(
    unresolved: { objectId: string; feature: string }[],
    viewId: string,
): void {
    for (const u of unresolved) {
        const k = `${viewId}:${u.feature}`;
        if (warnedUnresolved.has(k)) continue;
        warnedUnresolved.add(k);
        console.warn(
            `[ir] cross-object path in view "${viewId}" references feature "${u.feature}" ` +
            `not found on target object ${u.objectId}; value falls back to undefined. ` +
            `If the feature was renamed at M2, update the view's PathExpr.`,
        );
    }
}

/** One-shot console.warn per view when the fan-out cap truncated the observed set. */
export function warnCappedCrossDeps(viewId: string): void {
    if (warnedCapped.has(viewId)) return;
    warnedCapped.add(viewId);
    console.warn(
        `[ir] cross-object dependency fan-out in view "${viewId}" exceeded ` +
        `${CROSS_FANOUT_CAP} targets; observation truncated (dense multivalue navigation).`,
    );
}

/** Test/dev helper: wipe the whole registry and one-shot warn state. */
export function clearAllCrossDeps(): void {
    published.clear();
    edgeObjectKeys = [];
    epoch = null;
    warnedUnresolved.clear();
    warnedCapped.clear();
}
