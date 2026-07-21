/**
 * pathExpr — pure PathExpr emitter for the PathBuilder control (authoring F5).
 *
 * Produces strings accepted by the IR compiler's parsePathExpr grammar
 * (irCompile.ts STEP_RE): `$feature` optionally followed by `.value` |
 * `.values` | `.values[N]`. Slice 1 is single-hop; multi-hop chaining is a
 * later slice. Kept dependency-free so it lives in the design-system layer and
 * is unit-testable in the node vitest environment.
 */

export interface PathSelection {
    feature: string;
    take: 'value' | 'values' | 'valuesAt';
    index?: number;
}

/** Emit a single-hop PathExpr from a feature selection. */
export function pathExprFromSelection(sel: PathSelection): string {
    const base = '$' + sel.feature;
    switch (sel.take) {
        case 'value': return base + '.value';
        case 'values': return base + '.values';
        case 'valuesAt': return base + '.values[' + (sel.index ?? 0) + ']';
        default: return base;
    }
}
