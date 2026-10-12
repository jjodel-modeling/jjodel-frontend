/**
 * Editor V2 — metamodelSignature: the string `useEditorMode` keys its memo on.
 *
 * The memo re-derives `allClasses` / `rootableClasses` (and with them the M1
 * palette, the drop gate and the canvas menu) only when this string changes.
 * So it must change whenever something `resolveM1Info` reads changes. Before
 * 2026-10-11 it carried class names, flags, feature names and the reference
 * count, not containment: a containment switched off under an open model kept
 * its target out of the palette and the drop gate
 * (docs/discovery/discovery_2026-10-11_new_model_instantiate.md §3.1).
 *
 * Pure over a raw idlookup and import-free on purpose: `useEditorMode.ts`
 * imports the joiner barrel, which does not import under vitest.
 */

type Idlookup = Record<string, any> | null | undefined;

/** A pointer field as an id: a string as is, an object by its `id`. */
const ptr = (v: any): string => (typeof v === 'string' ? v : v?.id ?? '');

export function metamodelSignature(idlookup: Idlookup, mmId: string | null | undefined): string {
    if (!mmId) return '';
    const raw = idlookup?.[mmId] as any;
    if (!raw) return '';

    // Collect all class IDs from model + packages + subpackages
    const allClassIds: string[] = [];

    const collectClassIds = (containerId: string, depth = 0) => {
        if (depth > 10) return;
        const container = idlookup?.[containerId] as any;
        if (!container) return;
        // Direct classes on this container
        const classIds = container.classes ?? [];
        if (Array.isArray(classIds)) {
            for (const cid of classIds) {
                const id = typeof cid === 'string' ? cid : null;
                if (id) allClassIds.push(id);
            }
        }
        // Recurse into subpackages
        const subPkgs = container.subpackages ?? [];
        if (Array.isArray(subPkgs)) {
            for (const spId of subPkgs) {
                const sid = typeof spId === 'string' ? spId : null;
                if (sid) collectClassIds(sid, depth + 1);
            }
        }
    };

    // Collect from model directly
    collectClassIds(mmId);

    // Collect from packages
    const pkgIds = raw.packages ?? [];
    if (Array.isArray(pkgIds)) {
        for (const pid of pkgIds) {
            const pkgId = typeof pid === 'string' ? pid : null;
            if (pkgId) collectClassIds(pkgId);
        }
    }

    // Build signature from all collected class IDs
    const parts: string[] = [];
    for (const id of allClassIds) {
        const cls = idlookup?.[id] as any;
        if (!cls) continue;
        const refs = cls.allReferences ?? cls.references ?? [];
        const refCount = Array.isArray(refs) ? refs.length : 0;
        // Include feature NAMES so an id-preserving M2 rename (which keeps
        // both the id and the count unchanged) still changes this signature
        // and re-derives modeInfo. Counting alone let a rename slip through,
        // feeding a stale reference name to the M1 connect write path
        // (see docs/discovery/discovery_2026-07-26_coevolution_edge_rename.md).
        const refNames = Array.isArray(refs)
            ? refs.map((rid: any) => (typeof rid === 'string' ? idlookup?.[rid]?.name : rid?.name) ?? '').join(',')
            : '';
        const attrs = cls.attributes ?? [];
        const attrNames = Array.isArray(attrs)
            ? attrs.map((aid: any) => (typeof aid === 'string' ? idlookup?.[aid]?.name : aid?.name) ?? '').join(',')
            : '';
        // What else resolveM1Info reads, and a name never changes with: the
        // supertypes (concreteSubclasses), `interface` (isAbstract), and per
        // reference its target, containment, aggregation and bounds
        // (references[], hence the composition targets that decide rootable).
        const supers = Array.isArray(cls.extends) ? cls.extends.map(ptr).join(',') : '';
        const refShapes = Array.isArray(refs)
            ? refs.map((rid: any) => {
                const r = typeof rid === 'string' ? idlookup?.[rid] : rid;
                if (!r) return '';
                return `${ptr(r.type)}/${!!r.composition}/${!!r.aggregation}/${r.lowerBound}/${r.upperBound}`;
            }).join(',')
            : '';
        parts.push(`${id}:${cls.name}:${cls.abstract}:${cls.isSingleton}:${refCount}:${refNames}:${attrNames}:${!!cls.interface}:${supers}:${refShapes}`);
    }
    return parts.join('|');
}
