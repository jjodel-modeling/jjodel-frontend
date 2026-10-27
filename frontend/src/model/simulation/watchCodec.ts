/**
 * watchCodec — the invariants and breakpoints of a model, as its bag stores them
 * (R-SIM-137; P-2026-10-05-1735, docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §2, W1).
 *
 * A watch is a named boolean JjEL expression over σ, of kind `invariant`
 * (expected true on every configuration) or `breakpoint` (of interest when
 * true); it is compiled and read by `watchEvaluator.ts`. The watches of a model
 * live in one key of its M1 bag, `runWatches`, whose value is a JSON string, as
 * `ioBoard` is (boardCodec.ts): `{"v":1,"watches":[watch...]}`, a watch being
 * `name`, `kind` and `text`, written in that order, so the same watches give the
 * same string.
 *
 * The key is not a `sim*` key on purpose: `runSignature` folds every `sim*` key
 * of the model bag (simBridge.ts `modelRunBag`), so an edit under such a key
 * would interrupt the run, and a watch never changes what a run reads (measured,
 * discovery §0 «Keys»).
 *
 * A model with no watches has no key, and nothing writes one until a list is
 * applied (`watchesPatch`); a stored list emptied is written `[]`, never removed:
 * the undo of a removed bag key does not restore it (R-SIM-99).
 *
 * Decoding is tolerant, watch by watch, as the declarations' codec is record by
 * record (R-SIM-68): a string that is not JSON, or has no `v` 1 and `watches`
 * list, is one defect on the key and the list is not readable; a watch that is
 * not a record, has no name, a name an earlier watch holds, a kind unknown or a
 * text that is not a string is a defect of its own and the others decode. An
 * empty text is a watch: what it fails to compile is the watch's defect, shown on
 * it. Unknown fields are ignored. No VersionFixer step: a project saved before the
 * key has none.
 *
 * Pure: no import.
 */

/** The bag key of the watches (W1). */
export const RUN_WATCHES_KEY = 'runWatches';

/** An invariant is expected true on every configuration; a breakpoint is of interest when true (R-SIM-137). */
export type WatchKind = 'invariant' | 'breakpoint';

export const WATCH_KINDS: readonly WatchKind[] = ['invariant', 'breakpoint'];

/** One watch as stored: its name, unique in the model; its kind; its JjEL text. */
export interface WatchRecord {
    readonly name: string;
    readonly kind: WatchKind;
    readonly text: string;
}

/** Why a stored watch, or the key, was not read: `index` is the watch's, `null` for the key. */
export interface WatchDefect {
    readonly index: number | null;
    /** The watch's name when it is readable; `null` otherwise. */
    readonly name: string | null;
    readonly message: string;
}

export interface DecodedWatches {
    readonly watches: WatchRecord[];
    readonly defects: WatchDefect[];
    /** False when the key itself is not: then there is no watch and one defect. */
    readonly readable: boolean;
}

/** The one string of the key: `v`, then the list, each watch's fields in the order `name`, `kind`, `text`. */
export function encodeWatches(watches: readonly WatchRecord[]): string {
    return JSON.stringify({ v: 1, watches: watches.map(w => ({ name: w.name, kind: w.kind, text: w.text })) });
}

const isKind = (v: unknown): v is WatchKind => v === 'invariant' || v === 'breakpoint';

/** The watches of the key, in order, and what could not be read. `undefined` and `null` are no key: no watch, no defect. */
export function decodeWatches(raw: string | null | undefined): DecodedWatches {
    if (raw === undefined || raw === null) return { watches: [], defects: [], readable: true };
    const unreadable = (message: string): DecodedWatches => ({ watches: [], defects: [{ index: null, name: null, message }], readable: false });
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return unreadable('The invariants and breakpoints are not JSON.');
    }
    const root = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    if (!root || root.v !== 1 || !Array.isArray(root.watches)) return unreadable('The invariants and breakpoints have no version 1 and no list.');
    const watches: WatchRecord[] = [];
    const defects: WatchDefect[] = [];
    const names = new Set<string>();
    root.watches.forEach((item, index) => {
        const r = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null;
        const name = typeof r?.name === 'string' && r.name !== '' ? r.name : null;
        const defect = (message: string) => defects.push({ index, name, message });
        if (!r) return defect('Not an invariant or a breakpoint.');
        if (name === null) return defect('No name.');
        if (names.has(name)) return defect(`${name}: the name is taken by an earlier one.`);
        if (!isKind(r.kind)) return defect(`${name}: the kind '${String(r.kind)}' is neither invariant nor breakpoint.`);
        if (typeof r.text !== 'string') return defect(`${name}: the expression is not a text.`);
        names.add(name);
        watches.push({ name, kind: r.kind, text: r.text });
    });
    return { watches, defects, readable: true };
}

/**
 * What the dialog's Apply writes (W1, W4): one `state` assignment holding the key alone, so one `set_state`, one
 * TRANSACTION and one undo step; `null` when there is nothing to write, the list being the stored one, or empty on a
 * model that has no key, which keeps its bytes. `raw` is the key as stored, `null` or `undefined` when absent.
 */
export function watchesPatch(raw: string | null | undefined, watches: readonly WatchRecord[]): Record<string, string> | null {
    const absent = raw === undefined || raw === null;
    if (absent && watches.length === 0) return null;
    const encoded = encodeWatches(watches);
    return encoded === raw ? null : { [RUN_WATCHES_KEY]: encoded };
}
