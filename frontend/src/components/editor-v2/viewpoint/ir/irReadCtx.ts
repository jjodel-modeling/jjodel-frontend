/**
 * ReadCtx — narrow read interface the compiled IR accessors run against.
 *
 * Two interchangeable backends (decision 2026-07-17, sessione _2):
 * - 'lproxy': reads through the L-layer proxy (coerces/truncates to upperBound).
 * - 'draw':  reads the D-layer directly via state.idlookup (the __raw discipline
 *            documented in jjomTransformers.ts — "the proxy lies to checks" family).
 *
 * The micro-benchmark (Fase 0/4) decides the final default; until then the
 * switch is the IR_READ_BACKEND constant below. Do not measure here.
 *
 * Element ids passed to ReadCtx are DObject ids (model layer), NOT vertex ids.
 */

export const IR_READ_BACKEND: 'lproxy' | 'draw' = 'lproxy';  // consumed by irReadCtxLproxy.makeReadCtx

export interface ReadCtx {
    /** Single value of a feature (attribute slot) by name; undefined if absent. */
    getValue(elementId: string, featureName: string): unknown;
    /** All values of a feature slot by name; [] if absent. */
    getValues(elementId: string, featureName: string): unknown[];
    /** Element display name (D-layer name, initialName fallback); null if unresolvable. */
    getName(elementId: string): string | null;
    /** Metaclass (DClass) name of the element; null if unresolvable. */
    getMetaclassName(elementId: string): string | null;
    /** True if the element's metaclass is `className` or inherits from it. */
    isKindOf(elementId: string, className: string): boolean;
    /** Resolve a reference feature to the target element id with draw semantics
     *  (no proxy coercion), honoring `take`. Used to navigate non-terminal PathExpr
     *  hops identically on both backends; null when the hop dead-ends. */
    getRef(elementId: string, featureName: string, take: 'value' | 'values' | number): string | null;
}

type Idlookup = Record<string, any>;

/** Walk the element's DValue features on the D-layer, match by DAttribute/DReference name.
 *  Exported for irCrossDeps: cross-object dep concretization needs the DValue id
 *  and its pointer values with draw semantics (no L-proxy upperBound coercion). */
export function findFeatureRaw(idlookup: Idlookup, elementId: string, featureName: string): any | null {
    const dObject = idlookup[elementId];
    if (!dObject?.features) return null;
    for (const fid of dObject.features) {
        if (typeof fid !== 'string') continue;
        const dValue = idlookup[fid];
        if (!dValue) continue;
        const instId = dValue.instanceof;
        if (typeof instId !== 'string') continue;
        const dFeature = idlookup[instId];
        if (dFeature?.name === featureName) return dValue;
    }
    return null;
}

/** Normalize a pointer slot value to an element id (draw yields strings; defensive on proxy objects). */
function pointerToId(x: unknown): string | null {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object' && typeof (x as any).id === 'string') return (x as any).id;
    return null;
}

/**
 * Navigate one non-terminal PathExpr hop: resolve `feature` on `currentId` to the
 * target element id with draw semantics (findFeatureRaw -> pointer value), honoring
 * `take`. Single source of truth for hop navigation, shared by the compiled render
 * accessor (via ReadCtx.getRef) and the cross-dep concretization (resolveCrossDeps),
 * so render and reactivity cannot diverge (discovery 2026-07-21). Contract: 'value'
 * -> values[0], N -> values[N]; a whole-array 'values' intermediate hop dead-ends;
 * missing slot / non-array / empty values -> null.
 */
export function navigateRefHop(
    idlookup: Idlookup,
    currentId: string,
    feature: string,
    take: 'value' | 'values' | number,
): string | null {
    const dValue = findFeatureRaw(idlookup, currentId, feature);
    const vals = dValue?.values;
    if (!Array.isArray(vals)) return null;
    if (take === 'value') return pointerToId(vals[0]);
    if (typeof take === 'number') return pointerToId(vals[take]);
    return null; // whole-array 'values' intermediate hop: no navigation
}

/** One step of the ancestor walk: the class, by identity and by name. */
export interface ClassAncestor {
    id: string;
    name: string;
}

/**
 * Ancestor walk over DClass.extends (transitive, cycle-safe), keeping the class
 * ID next to each name.
 *
 * The id is what tells two homonymous classes apart: the IR index is keyed by
 * name, and a view pinned to one specific class matches an entry only when the
 * ancestor that produced the name is that same class (`irResolveCore`).
 */
export function classAncestry(idlookup: Idlookup, classId: string): ClassAncestor[] {
    const out: ClassAncestor[] = [];
    const seen = new Set<string>();
    const queue: string[] = [classId];
    while (queue.length > 0) {
        const cid = queue.shift() as string;
        if (seen.has(cid)) continue;
        seen.add(cid);
        const dClass = idlookup[cid];
        if (!dClass) continue;
        if (typeof dClass.name === 'string') out.push({ id: cid, name: dClass.name });
        const ext = dClass.extends;
        if (Array.isArray(ext)) {
            for (const e of ext) if (typeof e === 'string') queue.push(e);
        }
    }
    return out;
}

/** The same walk, names only — the `isKind` backend and every pre-pin caller. */
export function classAncestryNames(idlookup: Idlookup, classId: string): string[] {
    return classAncestry(idlookup, classId).map((a) => a.name);
}

function metaclassIdOf(idlookup: Idlookup, elementId: string): string | null {
    const dObject = idlookup[elementId];
    const inst = dObject?.instanceof;
    return typeof inst === 'string' ? inst : null;
}

/** D-layer direct backend ('draw'): raw values, no proxy coercion. */
export function makeDrawReadCtx(idlookup: Idlookup): ReadCtx {
    const getValue = (elementId: string, featureName: string): unknown => {
        const dValue = findFeatureRaw(idlookup, elementId, featureName);
        const vals = dValue?.values;
        return Array.isArray(vals) ? vals[0] : undefined;
    };
    return {
        getValue,
        getValues(elementId, featureName) {
            const dValue = findFeatureRaw(idlookup, elementId, featureName);
            const vals = dValue?.values;
            return Array.isArray(vals) ? vals : [];
        },
        getName(elementId) {
            // Identity-binding parity: prefer the 'name' slot value when present
            // (XMI import populates the slot without propagating onto DObject.name),
            // then the D-layer name, then initialName.
            const slotValue = getValue(elementId, 'name');
            if (typeof slotValue === 'string' && slotValue) return slotValue;
            const d = idlookup[elementId];
            return d?.name ?? d?.initialName ?? null;
        },
        getMetaclassName(elementId) {
            const cid = metaclassIdOf(idlookup, elementId);
            return cid ? (idlookup[cid]?.name ?? null) : null;
        },
        isKindOf(elementId, className) {
            const cid = metaclassIdOf(idlookup, elementId);
            if (!cid) return false;
            return classAncestryNames(idlookup, cid).includes(className);
        },
        getRef(elementId, featureName, take) {
            return navigateRefHop(idlookup, elementId, featureName, take);
        },
    };
}

