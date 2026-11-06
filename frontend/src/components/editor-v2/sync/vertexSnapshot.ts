/**
 * Per-vertex content hash for the incremental sync of `useJjomSync` (P-2026-10-21-0155).
 *
 * The sync re-transforms a vertex only when one of three entries of its snapshot changes: the
 * vertex D-object and its model element D-object (compared by reference), and the number this
 * module returns. The number stands for everything else `jjomVertexToRFNode`
 * (`utils/jjomTransformers.ts`) reads to build the node's data: the model element's children, the
 * metamodel facts a slot is rendered with, the names of the objects a reference points to, the
 * ancestry behind a ghost parent or target. A read the hash misses leaves the node showing the old
 * value until its own vertex or model element changes, because the sync no longer re-transforms
 * every vertex on every render.
 *
 * MAINTENANCE: a node type, or a transformer read, added later must extend this hash.
 *
 * Pure: raw `idlookup` reads only, no L proxy and no `joiner` import, so vitest loads it in the
 * node environment and the selector that calls it on every dispatch stays cheap. Every term sits on
 * one line tagged `term:<name>`, and `__tests__/vertexSnapshot.test.ts` has one test per tag that
 * dies when the line is dropped.
 */

type Lookup = Record<string, any>;

const CHILD_KEYS = ['attributes', 'references', 'operations', 'literals', 'features'] as const;
const MAX_ANCESTRY = 32;

function mixStr(h: number, s: unknown): number {
    const v = s == null ? '' : String(s);
    for (let i = 0; i < v.length; i++) h = ((h << 5) - h + v.charCodeAt(i)) | 0;
    return (h * 31 + 7) | 0; // separator, so 'ab'+'c' and 'a'+'bc' differ
}

function mixNum(h: number, n: unknown): number {
    return (h * 31 + (typeof n === 'number' ? n : 0)) | 0;
}

function mixFlag(h: number, b: unknown): number {
    return (h * 31 + (b ? 1 : 2)) | 0;
}

function mixValues(h: number, vals: unknown): number {
    if (!Array.isArray(vals)) return mixNum(h, -1);
    for (const v of vals) h = mixStr(h, v ?? '');
    return mixNum(h, vals.length);
}

function ptr(p: unknown): string | null {
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    return null;
}

function typeIdOf(child: any): string {
    return typeof child.type === 'string' ? child.type : (child.type?.id ?? '');
}

/** `fullname` and `model` of an element walk `father` (`LModelElement.get_containers`, `get_model`). */
function mixAncestry(h: number, L: Lookup, elem: any): number {
    let p = elem;
    for (let depth = 0; p && depth < MAX_ANCESTRY; depth++) {
        h = mixStr(h, p.name); // term:ancestryName
        if (p.className === 'DModel') h = mixStr(h, p.id); // term:ancestryModelId
        p = typeof p.father === 'string' ? L[p.father] : null;
    }
    return h;
}

function owningModelId(L: Lookup, elem: any): string {
    let p = elem;
    for (let depth = 0; p && depth < MAX_ANCESTRY; depth++) {
        if (p.className === 'DModel') return p.id ?? '';
        p = typeof p.father === 'string' ? L[p.father] : null;
    }
    return '';
}

/** `LObject.name`: the populated `name` slot, then `data.name`, then the metaclass name. */
function mixObjectName(h: number, L: Lookup, obj: any): number {
    h = mixStr(h, obj.name); // term:targetDataName
    const feats = obj.features;
    if (Array.isArray(feats)) {
        for (const fvId of feats) {
            const fv = typeof fvId === 'string' ? L[fvId] : null;
            const f = fv ? L[ptr(fv.instanceof) ?? ''] : null;
            if (f && f.name === 'name') { h = mixValues(h, fv.values); break; } // term:targetNameSlot
        }
    }
    h = mixStr(h, L[ptr(obj.instanceof) ?? '']?.name); // term:targetMetaclassName
    return h;
}

/** A slot (DValue): its metamodel feature, the feature's type, and the reference targets. */
function mixSlot(h: number, L: Lookup, fv: any): number {
    const featureId = ptr(fv.instanceof) ?? '';
    const feature = L[featureId];
    h = mixStr(h, featureId); // term:slotFeatureId
    if (!feature) return h;
    h = mixStr(h, feature.name); // term:slotFeatureName
    h = mixNum(h, feature.upperBound); // term:slotFeatureUpper
    h = mixNum(h, feature.lowerBound); // term:slotFeatureLower
    h = mixFlag(h, feature.derived === true); // term:slotFeatureDerived
    if (Array.isArray(feature.annotations)) {
        for (const annId of feature.annotations) h = mixStr(h, L[annId]?.source); // term:slotAnnotationSource
    }
    if (feature.className === 'DReference') {
        // Reference targets: each resolved target's name. A broken pointer adds nothing, so a
        // target deleted, or brought back, changes the hash by the name terms it drops or adds.
        if (Array.isArray(fv.values)) {
            for (const v of fv.values) {
                const target = typeof v === 'string' ? L[v] : null;
                if (target) h = mixObjectName(h, L, target);
            }
        }
        return h;
    }
    // Attribute: the type's id and name, and an enumeration's literals (name, raw value, order).
    const typeId = typeIdOf(feature);
    const type = L[typeId];
    h = mixStr(h, typeId); // term:slotTypeId
    h = mixStr(h, type?.name); // term:slotTypeName
    if (type?.className === 'DEnumerator' && Array.isArray(type.literals)) {
        for (const litId of type.literals) {
            const lit = L[litId];
            h = mixStr(h, lit?.name); // term:slotLiteralName
            h = mixNum(h, lit?.value); // term:slotLiteralValue
        }
    }
    return h;
}

/** A child of the model element: attribute, reference, operation, literal or slot. */
function mixChild(h: number, L: Lookup, child: any): number {
    h = mixStr(h, child.name); // term:childName
    const typeId = typeIdOf(child);
    h = mixStr(h, typeId); // term:childTypeId
    h = mixStr(h, typeId ? L[typeId]?.name : ''); // term:childTypeName
    h = mixNum(h, child.lowerBound ?? 0); // term:childLower
    h = mixNum(h, child.upperBound ?? 0); // term:childUpper
    h = mixFlag(h, child.abstract); // term:childAbstract
    h = mixFlag(h, child.composition); // term:childComposition
    h = mixFlag(h, child.aggregation); // term:childAggregation
    h = mixStr(h, child.defaultValueLiteral); // term:childDefaultValue
    h = mixNum(h, child.value); // term:childLiteralValue
    h = mixStr(h, typeof child.opposite === 'string' ? L[child.opposite]?.name : ''); // term:childOppositeName
    if (Array.isArray(child.values)) h = mixValues(h, child.values); // term:childValues
    if (Array.isArray(child.parameters)) {
        for (const parId of child.parameters) {
            const par = L[parId];
            if (!par) continue;
            h = mixStr(h, par.name); // term:paramName
            h = mixStr(h, L[typeIdOf(par)]?.name); // term:paramTypeName
        }
    }
    if (child.className === 'DReference' && L[typeId]) h = mixAncestry(h, L, L[typeId]); // term:refTypeAncestry
    if (typeof child.instanceof === 'string' || Array.isArray(child.instanceof)) h = mixSlot(h, L, child); // term:slot
    return (h * 31 + 7) | 0;
}

/**
 * The content hash of one vertex, given the raw lookup and the vertex's model element D-object
 * (`DClass`, `DEnumerator`, `DPackage` or `DObject`). Equal content gives an equal number whatever
 * the object identities; any change to a fact the vertex's node renders changes it.
 */
export function vertexChildrenHash(L: Lookup, modelElem: any): number {
    let h = 0;
    if (!modelElem) return h;
    for (const key of CHILD_KEYS) {
        const arr = modelElem[key];
        if (!Array.isArray(arr)) continue;
        for (const childId of arr) {
            if (typeof childId !== 'string') continue;
            const child = L[childId];
            if (child) h = mixChild(h, L, child);
        }
    }

    // Object: the metaclass name, and (M1 co-evolution) the literal names of the enumerations
    // typing the metaclass's own attributes.
    const metaclass = L[ptr(modelElem.instanceof) ?? ''];
    if (metaclass) {
        h = mixStr(h, metaclass.name); // term:metaclassName
        if (Array.isArray(metaclass.attributes)) {
            for (const mAttrId of metaclass.attributes) {
                const mType = L[typeof L[mAttrId]?.type === 'string' ? L[mAttrId].type : ''];
                if (mType?.className !== 'DEnumerator' || !Array.isArray(mType.literals)) continue;
                for (const litId of mType.literals) h = mixStr(h, L[litId]?.name); // term:metaclassEnumLiteral
            }
        }
    }

    // Class: the owning model (the ghost test compares it), and each parent's name, ancestry and model.
    if (modelElem.className === 'DClass') {
        h = mixStr(h, owningModelId(L, modelElem)); // term:ownModelId
        if (Array.isArray(modelElem.extends)) {
            for (const pId of modelElem.extends) if (L[pId]) h = mixAncestry(h, L, L[pId]); // term:parentAncestry
        }
    }
    return h;
}
