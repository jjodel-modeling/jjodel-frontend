/**
 * Per-viewpoint vertex layout — the single resolver every reader and writer goes through
 * (R-LAY-16). Slice 1a: the module only, no call site is wired yet.
 *
 * The model, in one paragraph. A vertex carries four scalars (`x`, `y`, `w`, `h`) plus
 * `isResized`: that is its SEED — the layout it is born with, and the fallback of every layout
 * that has no record yet. It may also carry records of the same shape in
 * `DVertex.layoutByViewpoint`, one per layout: keyed by the id of the exclusive viewpoint that
 * was active when the gesture happened, or by `ABSTRACT_SYNTAX_LAYOUT_KEY`
 * (`vertexLayoutAdapter.ts`) when none was (R-LAY-14). Abstract syntax is a layout like any
 * other, NOT the scalars: until the rectification of 2026-08-24 it was both a layout and the
 * fallback, and the second role made the first one leak — moving a node in abstract syntax moved
 * it under every viewpoint not yet touched. Existing projects have no dictionary at all, so
 * every layout falls back to the seed and no migration exists (R-LAY-14; no version bump either,
 * not even a no-op: a bump regenerates every untouched default view, VersionFixer.tsx:133-143).
 *
 * Reading is read-through: no record for the layout in force means read the seed (R-LAY-15).
 * Nothing is copied at activation time. The first gesture under a layout materializes the
 * COMPLETE record from the effective values and only then applies the patch, so a record is
 * never partial and the fallback is per-record, not per-field (R-LAY-15 as amended
 * 2026-08-24). Records left behind by a deleted viewpoint are inert garbage that read-through
 * never consults, by construction (R-LAY-17).
 *
 * Purity (R-LAY-16). This module has NO imports — not even `import type`. In particular it does
 * not borrow `GraphSize` (common/Geom.ts:677), whose shape `{x, y, w, h}` `VertexLayout`
 * reproduces: that class is nominal (its `private dontMixWithSize` at :678 makes every POJO
 * unassignable, measured as TS2740) and importing it at runtime pulls the joiner barrel and
 * monaco-editor, which is what makes 9 suites red with `window is not defined`. See
 * `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md` §2.
 *
 * This module DESCRIBES a write, it does not perform one: no redux, no SetFieldAction. See
 * `resolveVertexLayoutWrite` for how a call site turns the description into an action.
 */

/** Position and size of a vertex under one layout. Same shape as GraphSize plus isResized. */
export interface VertexLayout {
    x: number;
    y: number;
    w: number;
    h: number;
    isResized: boolean;
}

/**
 * The read model of a `DVertex` as far as layout is concerned: the four scalars and
 * `isResized` (the seed), plus the optional per-layout dictionary.
 * A `DVertex` satisfies this structurally — the resolver never needs the D-object itself.
 */
export interface VertexLayoutSource extends VertexLayout {
    layoutByViewpoint?: { [viewpointId: string]: VertexLayout };
}

/**
 * Effective layout of `src` under the given layout key.
 *
 * `layoutKey` is the id of the active EXCLUSIVE viewpoint, or `ABSTRACT_SYNTAX_LAYOUT_KEY`, or
 * `null` for "the seed itself". The impure adapter (`vertexLayoutAdapter.ts`) decides which,
 * and collapses BOTH "no viewpoint active" and "active viewpoint is not exclusive" to the
 * abstract-syntax key BEFORE calling in — it never returns `null`, because editor-v2 does not
 * rewrite the seed. This module never reads the store and never decides exclusivity: that
 * predicate does not exist as a function in the codebase and is a direct read of
 * `isExclusiveView` on the viewpoint's D-object (lastViewpoint.ts:96, selectors.ts:558).
 *
 * Read-through (R-LAY-15): a missing key falls back to the seed, as a whole record.
 */
export function readVertexLayout(src: VertexLayoutSource, layoutKey: string | null): VertexLayout {
    const seed: VertexLayout = { x: src.x, y: src.y, w: src.w, h: src.h, isResized: src.isResized };
    if (layoutKey === null) return seed;
    const record = src.layoutByViewpoint?.[layoutKey];
    return record ? { ...record } : seed;
}

/**
 * What a layout write should do, described rather than performed.
 *
 * `scalars` — write the patched fields onto the vertex's own x/y/w/h/isResized, i.e. onto the
 * seed, exactly as every call site did before slice 1b. Reachable only with a `null` key, which
 * the adapter never produces: it survives as the safe fallback for a call site that cannot
 * resolve the D-object.
 *
 * `dictionary` — write `record` under `vpId` (the layout key: a viewpoint id, or the
 * abstract-syntax key). `record` is always COMPLETE, so the call site never has to merge
 * anything itself. This is the case that keeps the classic renderer governed rather than
 * exempt (R-LAY-9, R-LAY-16).
 */
export type VertexLayoutWrite =
    | { target: 'scalars'; patch: Partial<VertexLayout> }
    | { target: 'dictionary'; vpId: string; record: VertexLayout };

/**
 * Resolves a layout patch into the write that should happen.
 *
 * With `null` the patch goes to the seed untouched. With a layout key the result carries
 * the complete record — the effective layout read through `readVertexLayout`, with the patch
 * applied on top. "Materialize, then patch" is an ORDER OF COMPUTATION, not two writes
 * (R-LAY-15 as amended): a first drag-only gesture must not leave `w`/`h`/`isResized`
 * undefined under the new key, because `manualSizeOf` (jjomTransformers.ts:50-57) would then
 * read those undefined fields from the record instead of falling back to the scalars.
 *
 * Note for the slice-1b call sites: the `dictionary` case translates into exactly ONE action,
 *
 *     SetFieldAction.new(vertexId, 'layoutByViewpoint', { [vpId]: record }, '+=', false)
 *
 * because `'+='` on an object is a shallow per-key merge (reducer.ts:240-252), so the records
 * of the other layouts survive untouched; and on an ABSENT field it falls through to acting as
 * a plain `'='` (reducer.ts:186-188), so the dictionary needs no seeding and there is no
 * intermediate partial state. Both are properties of the reducer documented nowhere else —
 * hence the line references. Undo restores the whole dictionary, since the reducer snapshots
 * it before merging (reducer.ts:242, replayed at :1127-1157).
 *
 * A key present in `patch` with an explicit `undefined` value is IGNORED rather than copied
 * over: a plain spread would punch a hole in the materialized record, which is the very
 * failure mode the R-LAY-15 amendment exists to prevent. The seed case passes the patch
 * through untouched instead, since there the call site writes field by field and an absent
 * field simply is not written.
 *
 * Pure: `src` is never mutated, and neither is `patch`.
 */
export function resolveVertexLayoutWrite(
    src: VertexLayoutSource,
    patch: Partial<VertexLayout>,
    layoutKey: string | null
): VertexLayoutWrite {
    if (layoutKey === null) return { target: 'scalars', patch: { ...patch } };
    const record: VertexLayout = readVertexLayout(src, layoutKey);
    if (patch.x !== undefined) record.x = patch.x;
    if (patch.y !== undefined) record.y = patch.y;
    if (patch.w !== undefined) record.w = patch.w;
    if (patch.h !== undefined) record.h = patch.h;
    if (patch.isResized !== undefined) record.isResized = patch.isResized;
    return { target: 'dictionary', vpId: layoutKey, record };
}
