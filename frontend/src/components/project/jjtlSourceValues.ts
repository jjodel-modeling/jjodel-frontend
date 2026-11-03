/**
 * Shape of one source feature value handed to the JjTL executor (P-2026-11-03-0539, ticket #473).
 *
 * `handleExecuteTransformation` (ProjectEditor.tsx) serializes every slot of every source object. It
 * used to pick the shape from the number of values: none gave `null`, one gave the bare value, two or
 * more gave a list. So a many-valued feature holding one value reached the rules as a single value,
 * and `b.bindings.map(...)` failed with `Unknown method 'map' for type Binding`, while a `forall` over
 * it saw no array and produced nothing. The shape now follows the feature's declared upper bound:
 * a many-valued feature (upper bound -1 or above 1) is always a list, `[]` when empty; a
 * single-valued feature is the value, `null` when empty. A slot with no declared feature (no
 * `instanceof`, schema-less) keeps the count-based shape, as there is no bound to read.
 *
 * Pure: no store, no joiner import (the joiner barrel does not load under vitest). The caller passes
 * the upper bound and the wrapper of pointer values.
 */

/** True when the declared upper bound allows several values; undefined when there is no bound. */
export function isManyValued(upperBound: unknown): boolean | undefined {
    if (typeof upperBound !== 'number' || Number.isNaN(upperBound)) return undefined;
    return upperBound < 0 || upperBound > 1;
}

/**
 * The value of one feature as the executor reads it.
 *
 * `rawVals` are the raw `DValue.values` (primitives for attributes, Pointer ids for references).
 * Empty entries are dropped and a repeated Pointer id is kept once, as before: DValue.values can
 * hold the same id twice (an edge created via canvas and then via auto-populate, or data
 * corruption). That collapse is ticket #474, left as it was.
 */
export function serializeFeatureValues(
    rawVals: unknown,
    upperBound: unknown,
    wrap: (val: any) => any,
): any {
    const vals: any[] = Array.isArray(rawVals) ? rawVals : [];
    const seen = new Set<string>();
    const meaningful = vals.filter((v: any) => {
        if (v == null || v === '') return false;
        if (typeof v === 'string') {
            if (seen.has(v)) return false;
            seen.add(v);
        }
        return true;
    });
    const many = isManyValued(upperBound);
    if (many === true) return meaningful.map(wrap);
    if (meaningful.length === 0) return null;
    if (meaningful.length === 1) return wrap(meaningful[0]);
    return meaningful.map(wrap);
}
