/**
 * simViewerPrefs — what the viewer of a run chose to see (P-2026-10-03-0040):
 * the Watch pins of the panel (R-SIM-104), the tags and the globals card of the
 * canvas (R-SIM-107), the «Inspect node.[x]» switch (R-SIM-109), the skin of
 * the I/O board with its «Show bindings» (R-SIM-114, P-2026-10-03-2000), and the
 * board's window, docked or floating with its place, and its sound (R-SIM-132,
 * R-SIM-133, P-2026-10-04-1131).
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

/** R-SIM-114: the skins of the I/O board, Variant A the working surface, Variant B the front panel. */
export type SimBoardSkin = 'board' | 'panel';

/** R-SIM-132: the top left corner of the I/O board's floating window, in the canvas's pixels. */
export interface SimBoardWindow {
    readonly x: number;
    readonly y: number;
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
    /** R-SIM-114: the skin the I/O board shows, `'board'` (Variant A) by default. */
    readonly boardSkin?: SimBoardSkin;
    /** R-SIM-114: Variant B's «Show bindings», which outlines each device and names its binding; off by default. */
    readonly showBindings?: boolean;
    /** R-SIM-133: the Buzzer sounds; off, muted, by default. */
    readonly boardSound?: boolean;
    /** R-SIM-132: a board of four columns floats over the canvas by the viewer's choice; off by default (6 and 8 always float). */
    readonly boardFloating?: boolean;
    /** R-SIM-132: where the floating window was left; absent until it is first moved. */
    readonly boardWindow?: SimBoardWindow;
}

export const DEFAULT_SIM_VIEWER_PREFS: SimViewerPrefs = {
    pins: null, tags: [], globalsCard: false, inspectNode: false, boardSkin: 'board', showBindings: false,
};

/** The card slot's left edge in the canvas (SimBoard.scss `.sim-board`, report 2026-10-03 H1): the window's first place. */
export const BOARD_SLOT_LEFT = 584;

/** A rectangle of the canvas, in its pixels. */
export interface SimRect {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
}

/**
 * R-SIM-132: a window's place kept inside the canvas, whole pixels: never left of it or above it, never past its right
 * or bottom edge; a window larger than the canvas sits at its top left corner.
 */
export function clampBoardWindow(pos: SimBoardWindow, size: { readonly width: number; readonly height: number }, bounds: SimRect): SimBoardWindow {
    const maxX = Math.max(bounds.left, bounds.left + bounds.width - size.width);
    const maxY = Math.max(bounds.top, bounds.top + bounds.height - size.height);
    return { x: Math.round(Math.min(maxX, Math.max(bounds.left, pos.x))), y: Math.round(Math.min(maxY, Math.max(bounds.top, pos.y))) };
}

/** R-SIM-132: the window's first place, the card slot's left and 16 px under the canvas's top, clamped. */
export function defaultBoardWindow(size: { readonly width: number; readonly height: number }, bounds: SimRect): SimBoardWindow {
    return clampBoardWindow({ x: BOARD_SLOT_LEFT, y: bounds.top + 16 }, size, bounds);
}

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
