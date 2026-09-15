/**
 * tableViews — which per-class view speaks for the Data Manager, and what it says.
 *
 * The manager asks a question the rest of the IR resolution never asks: «what are the
 * columns of THIS METACLASS», with no instance in hand. Every other resolver takes an
 * `objectId` first (`irResolveCore.resolveIRView`) because a view's `predicate` is
 * evaluated on a subject, and a table has no single subject — it has rows, each of which
 * could satisfy a different predicate.
 *
 * R-VP-11 settles it by exclusion rather than by picking a row: **only views WITHOUT a
 * predicate are considered**, in the same order `resolveIRView` would consider them
 * (priority, then specificity, then declaration order — `compareCandidates`, imported and
 * not restated). A view that declares both a `predicate` and a `table` is skipped and
 * REPORTED, because silently ignoring an authored key is the failure mode this codebase
 * keeps paying for. The warning belongs to the caller: this module is pure, and a
 * `console.warn` in here would fire once per render instead of once per class.
 *
 * A file of its own beside `irResolveCore.ts` rather than a function inside it: the
 * resolvers there all answer «which view renders this OBJECT», and this one answers a
 * different question with a different admissibility rule. Sharing the file would put two
 * meanings of "resolve" under one roof.
 */

import type { AuthoringMetaclassPins, TableSpec, NodeViewIR } from './irTypes';
import { classAncestry } from './irReadCtx';
import { compareCandidates, pinAccepts, type IndexEntry, type IRViewpointIndex } from './irResolveCore';

/** What `resolveTableSpec` found, and what it had to leave out. */
export interface TableViewResolution {
    /** The winning view's `table`, or null when no view declares one. */
    spec: TableSpec | null;
    /**
     * View ids that declare `table` AND a `predicate`, therefore skipped (R-VP-11).
     * Empty in the ordinary case. The caller turns a non-empty list into one warning per
     * class — the author has written something that does not apply, and nothing else on
     * screen would say so.
     */
    skippedPredicated: string[];
}

const NOTHING: TableViewResolution = { spec: null, skippedPredicated: [] };

/**
 * The `table` of the metaclass, by R-VP-11.
 *
 * `metaclassId` is the DClass id, as `resolveIRView` takes it: the ancestry walk is what
 * gives an inherited view its chance, and it needs ids, not names.
 *
 * Only `vertex` and `graphVertex` irs can carry `table` (the two kinds
 * `irResolveCore`'s index-build files under `byMetaclass`), so the narrowing below is the
 * same test that put the entry in the bucket in the first place — not a second opinion
 * about which views are class views.
 */
export function resolveTableSpec(
    metaclassId: string,
    index: IRViewpointIndex | null,
    idlookup: Record<string, any>,
): TableViewResolution {
    if (!index) return NOTHING;
    const ancestry = classAncestry(idlookup, metaclassId);   // [self, ...ancestors]
    if (ancestry.length === 0) return NOTHING;

    type Candidate = { entry: IndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<IndexEntry>();
    // Identical shape to `resolveIRView`'s candidate build, pins included: an entry
    // rejected by the pin at one tier is NOT marked seen, because the same view may
    // legitimately match through another ancestor it pinned correctly.
    const push = (entries: IndexEntry[] | undefined, name: string, classId: string, specificity: number) => {
        if (!entries) return;
        for (const e of entries) {
            if (seen.has(e)) continue;
            if (!pinAccepts(e as { pins?: AuthoringMetaclassPins }, name, classId)) continue;
            seen.add(e);
            candidates.push({ entry: e, specificity });
        }
    };
    push(index.byMetaclass.get(ancestry[0].name), ancestry[0].name, ancestry[0].id, 2);
    for (let i = 1; i < ancestry.length; i++) {
        push(index.byMetaclass.get(ancestry[i].name), ancestry[i].name, ancestry[i].id, 1);
    }
    for (const e of index.wildcard) { if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: 0 }); } }
    if (candidates.length === 0) return NOTHING;

    candidates.sort(compareCandidates);

    const skippedPredicated: string[] = [];
    let spec: TableSpec | null = null;
    for (const c of candidates) {
        const ir = c.entry.compiled.ir;
        if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue;
        const declared = (ir as NodeViewIR).table;
        if (!declared) continue;
        // The predicate is read off the RAW ir and not off `compiled.predicate`, which is
        // a function and always present (the compile gives an absent predicate a
        // constant-true one). Only the ir can say whether the author wrote one.
        if (ir.predicate !== undefined) { skippedPredicated.push(c.entry.compiled.viewId); continue; }
        if (spec === null) spec = declared;
    }
    return { spec, skippedPredicated };
}
