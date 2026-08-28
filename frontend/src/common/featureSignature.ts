/**
 * Feature signature — the type suffix shown next to a structural feature's name.
 *
 * Single source (D5, arco 2 passo 4): the tree and the properties shell must not spell
 * the same fact two different ways. Extracted verbatim from the local helpers that lived
 * inside `buildPackageData` in `TreeViewSidebar/TreeViewContent.tsx`; field probing,
 * fallbacks and composition are unchanged, so the tree renders exactly what it rendered
 * before the extraction.
 */

/** Type name of a structural feature. `'any'` when the type cannot be resolved. */
export function getTypeName(feature: any): string {
    const rawType = feature?.type;
    if (typeof rawType === 'string') return rawType;
    if (rawType?.name) return rawType.name;
    return 'any';
}

/** Multiplicity as `lower..upper`, with `*` for an unbounded upper bound. */
export function getMultiplicity(feature: any): string {
    const lower = typeof feature?.lowerBound === 'number' ? feature.lowerBound : 0;
    const upperRaw = feature?.upperBound;
    const upper = upperRaw === -1 ? '*' : (typeof upperRaw === 'number' ? String(upperRaw) : '1');
    return `${lower}..${upper}`;
}

/** The rendered suffix, e.g. `: EString [0..1]`. */
export function formatFeatureSignature(typeName: string, multiplicity: string): string {
    return ` ${typeName} [${multiplicity}]`;
}
