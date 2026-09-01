/**
 * rowViewAnnotations — the metamodel declarations the Row view library reads.
 *
 * Design handoff: docs/design/design_handoff_instance_node/README.md,
 * "Value-renderer detection", rule 1 — «the metamodel declaration, the only
 * authoritative source», and `Instance Node Proposal.dc.html` Turno 5, which
 * states three times over that a unit, a bound and a mono treatment come from
 * the metamodel and are NEVER inferred from the attribute name.
 *
 * ── Why the encoding looks like this ────────────────────────────────────────
 *
 * Ecore's own mechanism for this is `EAnnotation` with keyed `details`, and the
 * D layer has the class for it. Half of it works, and the paragraph that used to
 * stand here said none of it did — re-measured 2026-09-01 (TXT1 Fase 1, §2.1):
 *
 *   - `EcoreParser.parseDAnnotation` is IMPLEMENTED (`api/data.ts:691-709`) and
 *     has its own test. When the annotation carries details it emits
 *     `source + '/' + key + '=' + value` — which is this file's wire format
 *     exactly, so an `.ecore` with `<eAnnotations source="jjodel"><details
 *     key="multiline" value="true"/></eAnnotations>` already imports as
 *     `jjodel/multiline=true`, with no code of ours in the path;
 *   - `DAnnotationDetail` (`LModelElement.tsx:192`) IS still an empty class whose
 *     whole body is `// todo`. The parser flattens the details into `source`
 *     precisely to get around that, and declares the deviation in its own header;
 *   - `addAnnotation` has zero call sites, so nothing writes one that way either.
 *
 * Filling `DAnnotationDetail` in is a core change. What DOES exist and works is
 * `DAnnotation.source`, a plain string field, and `DAnnotation.new(source,
 * details, father)`, which parents an annotation on any DModelElement —
 * `DAttribute.annotations` included. So one annotation carries one key, and the
 * key/value pair lives in `source`:
 *
 *     jjodel/unit=px
 *     jjodel/renderer=swatch
 *     jjodel/min=0
 *
 * The namespace prefix is what makes this safe to read back: nothing in the
 * codebase currently reads `DAnnotation.source` at all, and anything that
 * starts doing so can tell our five keys from an annotation that arrived some
 * other way.
 *
 * ── The one thing this costs ────────────────────────────────────────────────
 *
 * An `.ecore` round trip drops these, and the loss is on the EXPORT, not on the
 * read side — the other half of the same re-measurement (TXT1 §2.2).
 * `services/export/EcoreService.ts` emits no `eAnnotations` at all: its
 * `includeAnnotations?: boolean` (`:42`) is declared and never read, one grep
 * hit and it is the declaration, and `exportDataType` (`:500`) defers
 * `eAnnotations` to «W5/W4». So a model carrying declarations loses them on the
 * way OUT and would read them back fine. Pre-existing and not fixed here;
 * `EcoreService` is where that effort belongs, and it is a lane of its own.
 *
 * Everything here is pure: a function of plain strings and of a plain
 * `idlookup`-shaped dictionary, no proxies and no Redux, so the same calls
 * answer for a compartment row, for a standalone node and for a test.
 *
 * The two functions that WRITE a declaration live in `rowViewAnnotationsWrite.ts`
 * and import `annotationSource` from here, so the wire format still has exactly
 * one owner. They are a separate module because importing the joiner barrel
 * pulls Monaco in with it, and Monaco dereferences `window` at import time —
 * which makes any module that touches the barrel unloadable under the `node`
 * test environment. Keeping the decision side free of that is what lets the
 * encoding be tested at all.
 */

/** The keys this module owns. `renderer` is rule 1 of the detection ladder. */
export type RowViewAnnotationKey = 'renderer' | 'unit' | 'min' | 'max' | 'multiline';

/** Prefix that marks a `DAnnotation.source` as ours. */
export const ROW_VIEW_ANNOTATION_PREFIX = 'jjodel/';

/**
 * The declarations of one attribute, already parsed.
 *
 * Absent rather than defaulted: `unit: undefined` is "the metamodel says
 * nothing", which is the case the acceptance criterion is about — a numeric
 * attribute with no unit annotation shows no unit, whatever it is called.
 */
export interface RowViewAnnotations {
    /** Rule-1 renderer declaration. Stops the ladder for this property. */
    renderer?: string;
    /** Unit suffix for `numberUnit`. Never inferred from the attribute name. */
    unit?: string;
    /** Lower bound. `progress` needs BOTH bounds; one alone is not enough. */
    min?: number;
    /** Upper bound. */
    max?: number;
    /**
     * `jjodel/multiline=true` — the attribute wants the growing prose box.
     *
     * The one key here that the ROW view library does not read. It is a FORM
     * declaration: it reaches rung 2 of `jjform/layout.widthOf` and nothing else,
     * which is why the canvas and the table are unaffected by its arrival — both
     * destructure this object by name (`jjomTransformers.ts`, `instanceTable.ts`)
     * and neither names it. It lives here anyway because a second reader of
     * `DAnnotation.source` is how two readers start disagreeing about the wire
     * format, and this file is that format's one owner.
     */
    multiline?: boolean;
}

/** `jjodel/unit=px`. The single place that knows the wire format. */
export function annotationSource(key: RowViewAnnotationKey, value: string | number): string {
    return `${ROW_VIEW_ANNOTATION_PREFIX}${key}=${String(value)}`;
}

/**
 * The key of a `jjodel/...` source, or null when the annotation is not ours.
 * Used to find the annotation to overwrite rather than adding a second one for
 * the same key.
 */
export function annotationKeyOf(source: string | null | undefined): RowViewAnnotationKey | null {
    if (typeof source !== 'string') return null;
    if (!source.startsWith(ROW_VIEW_ANNOTATION_PREFIX)) return null;
    const eq = source.indexOf('=');
    if (eq < 0) return null;
    const key = source.slice(ROW_VIEW_ANNOTATION_PREFIX.length, eq);
    return key === 'renderer' || key === 'unit' || key === 'min' || key === 'max' || key === 'multiline'
        ? key
        : null;
}

/**
 * Parse a list of `source` strings into the declarations.
 *
 * Later entries win, which is only reachable if two annotations carry the same
 * key — a state the write path does not create but an imported model could.
 * THREE families, not two, and each drops what it cannot read rather than
 * coercing it:
 *
 *   - `min` / `max` parse as numbers. A bound that is not finite is DROPPED
 *     rather than kept as NaN: the `progress` renderer asks for both bounds and
 *     a NaN would satisfy the check while producing an unpaintable bar;
 *   - `multiline` parses as a BOOLEAN, and the vocabulary is closed to the two
 *     words the writer emits. `1`, `yes`, `True` are dropped, for the argument
 *     that already settles the NaN: a value that means nothing here must not
 *     arrive downstream looking like a decision. `false` is kept as `false` and
 *     not dropped — an explicit denial reads the same as an absence at rung 2,
 *     but it is a different thing to have said, and a round trip must not
 *     silently turn one into the other;
 *   - everything else is a string, and only the empty one is dropped.
 */
export function parseRowViewAnnotations(sources: readonly (string | null | undefined)[]): RowViewAnnotations {
    const out: RowViewAnnotations = {};
    for (const source of sources) {
        const key = annotationKeyOf(source);
        if (!key) continue;
        const raw = (source as string).slice((source as string).indexOf('=') + 1);
        if (key === 'min' || key === 'max') {
            const n = Number(raw);
            if (Number.isFinite(n)) out[key] = n;
            continue;
        }
        if (key === 'multiline') {
            const b = raw.trim();
            if (b === 'true') out.multiline = true;
            else if (b === 'false') out.multiline = false;
            continue;
        }
        // An empty value is a declaration of nothing, not a declaration of "".
        if (raw.trim() === '') continue;
        out[key] = raw;
    }
    return out;
}

type Lookup = Record<string, any>;

/**
 * The declarations on one DAttribute (or DReference), read off an
 * `idlookup`-shaped dictionary.
 *
 * `annotations` holds pointer ids, but some write paths leave the record
 * itself in place — the same two shapes `readDirectSuperclasses` handles in
 * `singletonShape.ts`, and for the same reason.
 */
export function readRowViewAnnotations(idlookup: Lookup, featureId: string | null | undefined): RowViewAnnotations {
    if (!idlookup || !featureId) return {};
    const feature = idlookup[featureId];
    const ids = feature?.annotations;
    if (!Array.isArray(ids)) return {};

    const sources: (string | undefined)[] = [];
    for (const entry of ids) {
        if (entry && typeof entry === 'object' && typeof entry.source === 'string') { sources.push(entry.source); continue; }
        const id = typeof entry === 'string' ? entry : entry?.id;
        if (typeof id !== 'string') continue;
        const annotation = idlookup[id];
        if (annotation && typeof annotation.source === 'string') sources.push(annotation.source);
    }
    return parseRowViewAnnotations(sources);
}

/**
 * The id of the annotation already carrying `key` on this feature, or null.
 * The write path overwrites that one instead of stacking a second declaration.
 */
export function findRowViewAnnotationId(
    idlookup: Lookup,
    featureId: string | null | undefined,
    key: RowViewAnnotationKey,
): string | null {
    if (!idlookup || !featureId) return null;
    const ids = idlookup[featureId]?.annotations;
    if (!Array.isArray(ids)) return null;
    for (const entry of ids) {
        const id = typeof entry === 'string' ? entry : entry?.id;
        if (typeof id !== 'string') continue;
        if (annotationKeyOf(idlookup[id]?.source) === key) return id;
    }
    return null;
}
