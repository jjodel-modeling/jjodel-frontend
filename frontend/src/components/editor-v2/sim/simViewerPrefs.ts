/**
 * simViewerPrefs — what the viewer of a run chose to see (P-2026-10-03-0040):
 * the Watch pins of the panel (R-SIM-104), the tags and the globals card of the
 * canvas (R-SIM-107), and the «Inspect node.[x]» switch (R-SIM-109).
 *
 * Module singleton per model, beside the run policy of simRunState.ts and kept
 * the same way: outside Redux, never in a bag, so a preference never moves
 * `runSignature` and never reaches the model (R-SIM-6). Lost on reload; kept
 * across Reset, Stop, an interruption, a model switch and the panel's unmount,
 * since no primitive of the run touches it.
 *
 * Its own version channel and hook, for the panel and the canvas layer that
 * read it. Never the `'mark'` channel, which re-renders ObjectNode and the IR
 * resolvers: a preference changes what the overlay shows, not the run.
 *
 * A pin or a tag that names an attribute no longer declared is kept here and
 * skipped by the reader, so an undo of the declaration brings it back.
 */

import { useSyncExternalStore } from 'react';
import type { StateAttributeDecl } from '../../../model/simulation/netTypes';

/** A declared state attribute, as the viewer names it: its metaclass (`null` for a global), its name and its space. */
export interface SimAttrRef {
    readonly metaclass: string | null;
    readonly name: string;
    readonly space: 'semantic' | 'presentation';
}

/** The viewer preferences of one model. */
export interface SimViewerPrefs {
    /** R-SIM-104, at most `MAX_SIM_PINS`; `null` is the default, `defaultSimPins` over the run's declarations. */
    readonly pins: readonly SimAttrRef[] | null;
    /** R-SIM-107, default none; the attributes the last step changed are tagged anyway, computed, never stored. */
    readonly tags: readonly SimAttrRef[];
    /** R-SIM-107: the globals in one card pinned to the canvas corner. */
    readonly globalsCard: boolean;
    /** R-SIM-109: the dashed tags of every element's presentation state. */
    readonly inspectNode: boolean;
}

export const DEFAULT_SIM_VIEWER_PREFS: SimViewerPrefs = { pins: null, tags: [], globalsCard: false, inspectNode: false };

/** The Watch rows of the panel name four attributes at most (R-SIM-104). */
export const MAX_SIM_PINS = 4;

const prefs = new Map<string, SimViewerPrefs>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
    version++;
    for (const l of listeners) l();
}

/** The prefs of a model: its own when some were set, the defaults otherwise. */
export function getSimViewerPrefs(modelId: string): SimViewerPrefs {
    return prefs.get(modelId) ?? DEFAULT_SIM_VIEWER_PREFS;
}

/**
 * Changes a model's prefs and returns them; what the change does not name is
 * kept. Pins beyond `MAX_SIM_PINS` are dropped, the first ones kept. One bump of
 * the prefs channel.
 */
export function setSimViewerPrefs(modelId: string, change: Partial<SimViewerPrefs>): SimViewerPrefs {
    const next: SimViewerPrefs = { ...getSimViewerPrefs(modelId), ...change };
    const capped = next.pins === null ? next : { ...next, pins: next.pins.slice(0, MAX_SIM_PINS) };
    prefs.set(modelId, capped);
    bump();
    return capped;
}

/**
 * The pins of `null` (R-SIM-104): the first four semantic declarations, the
 * globals first, each group in declaration order, a name declared twice for the
 * same owner once. The presentation is never a default pin: σ and `node` are
 * shown apart (R-SIM-102); a viewer may still pin it.
 */
export function defaultSimPins(attributes: readonly StateAttributeDecl[]): SimAttrRef[] {
    const semantic = attributes.filter(d => d.space === 'semantic');
    const ordered = [...semantic.filter(d => d.metaclass === null), ...semantic.filter(d => d.metaclass !== null)];
    const out: SimAttrRef[] = [];
    const seen = new Set<string>();
    for (const d of ordered) {
        const key = `${d.metaclass ?? ''}\u0000${d.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ metaclass: d.metaclass, name: d.name, space: d.space });
        if (out.length === MAX_SIM_PINS) break;
    }
    return out;
}

export function getSimViewerPrefsVersion(): number {
    return version;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** React hook: re-renders the consumer when a model's prefs change. The panel and the canvas layer only. */
export function useSimViewerPrefsVersion(): number {
    return useSyncExternalStore(subscribe, getSimViewerPrefsVersion, getSimViewerPrefsVersion);
}

/** Tests only: the store is module-level, and a test inheriting prefs would measure the file order. */
export function __resetSimViewerPrefsForTests(): void {
    prefs.clear();
    version = 0;
}
