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

import { LPointerTargetable } from '../../../../joiner';

export const IR_READ_BACKEND: 'lproxy' | 'draw' = 'lproxy';

export interface ReadCtx {
    /** Single value of a feature (attribute slot) by name; undefined if absent. */
    getValue(elementId: string, featureName: string): unknown;
    /** All values of a feature slot by name; [] if absent. */
    getValues(elementId: string, featureName: string): unknown[];
    /** Metaclass (DClass) name of the element; null if unresolvable. */
    getMetaclassName(elementId: string): string | null;
    /** True if the element's metaclass is `className` or inherits from it. */
    isKindOf(elementId: string, className: string): boolean;
}

type Idlookup = Record<string, any>;

/** Walk the element's DValue features on the D-layer, match by DAttribute/DReference name. */
function findFeatureRaw(idlookup: Idlookup, elementId: string, featureName: string): any | null {
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

/** Ancestor walk over DClass.extends (transitive, cycle-safe). */
export function classAncestryNames(idlookup: Idlookup, classId: string): string[] {
    const names: string[] = [];
    const seen = new Set<string>();
    const queue: string[] = [classId];
    while (queue.length > 0) {
        const cid = queue.shift() as string;
        if (seen.has(cid)) continue;
        seen.add(cid);
        const dClass = idlookup[cid];
        if (!dClass) continue;
        if (typeof dClass.name === 'string') names.push(dClass.name);
        const ext = dClass.extends;
        if (Array.isArray(ext)) {
            for (const e of ext) if (typeof e === 'string') queue.push(e);
        }
    }
    return names;
}

function metaclassIdOf(idlookup: Idlookup, elementId: string): string | null {
    const dObject = idlookup[elementId];
    const inst = dObject?.instanceof;
    return typeof inst === 'string' ? inst : null;
}

/** D-layer direct backend ('draw'): raw values, no proxy coercion. */
export function makeDrawReadCtx(idlookup: Idlookup): ReadCtx {
    return {
        getValue(elementId, featureName) {
            const dValue = findFeatureRaw(idlookup, elementId, featureName);
            const vals = dValue?.values;
            return Array.isArray(vals) ? vals[0] : undefined;
        },
        getValues(elementId, featureName) {
            const dValue = findFeatureRaw(idlookup, elementId, featureName);
            const vals = dValue?.values;
            return Array.isArray(vals) ? vals : [];
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
    };
}

/**
 * L-proxy backend ('lproxy'): reads through LObject/LValue proxies.
 * Semantic note (spike Fase A finding): the proxy coerces and truncates to
 * upperBound, so single-value reads may differ from raw D-layer reads.
 * Falls back to the draw backend when the proxy throws on stale data.
 */
export function makeLproxyReadCtx(idlookup: Idlookup): ReadCtx {
    const draw = makeDrawReadCtx(idlookup);
    return {
        getValue(elementId, featureName) {
            try {
                const lObj = LPointerTargetable.fromPointer(elementId as any) as any;
                const slot = lObj?.['$' + featureName];
                if (slot === undefined) return undefined;
                return slot.value;
            } catch {
                return draw.getValue(elementId, featureName);
            }
        },
        getValues(elementId, featureName) {
            try {
                const lObj = LPointerTargetable.fromPointer(elementId as any) as any;
                const slot = lObj?.['$' + featureName];
                const vals = slot?.values;
                return Array.isArray(vals) ? vals : draw.getValues(elementId, featureName);
            } catch {
                return draw.getValues(elementId, featureName);
            }
        },
        // Metaclass identity is structural, not value-coerced: the draw path is canonical.
        getMetaclassName: draw.getMetaclassName,
        isKindOf: draw.isKindOf,
    };
}

export function makeReadCtx(idlookup: Idlookup): ReadCtx {
    return IR_READ_BACKEND === 'lproxy' ? makeLproxyReadCtx(idlookup) : makeDrawReadCtx(idlookup);
}
