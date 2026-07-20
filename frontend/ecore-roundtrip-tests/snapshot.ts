/**
 * Semantic snapshots of imported models, computed on the D-layer (raw Redux
 * state) so the comparison is independent of L-proxy getter derivations.
 *
 * A round-trip is CLEAN when snapshot(import(X)) deep-equals
 * snapshot(import(export(import(X)))) — identity is by NAME/structure, never
 * by Pointer id (ids are regenerated at every import).
 *
 * eAnnotations are deliberately excluded (out of scope by decision).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Lookup = Record<string, any>;

const typeName = (lookup: Lookup, ptr: any): string | null => {
    if (!ptr) return null;
    const t = lookup[ptr];
    return t ? t.name ?? null : `<dangling:${String(ptr)}>`;
};

const sortByName = (a: any, b: any) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

// ---------------------------------------------------------------------------
// M2 snapshot
// ---------------------------------------------------------------------------

function snapAttribute(lookup: Lookup, d: any): any {
    return {
        kind: 'attribute',
        name: d.name,
        type: typeName(lookup, d.type),
        lowerBound: d.lowerBound,
        upperBound: d.upperBound,
        ordered: d.ordered,
        unique: d.unique,
        changeable: d.changeable,
        volatile: d.volatile,
        transient: d.transient,
        unsettable: d.unsettable,
        derived: d.derived,
        defaultValueLiteral: d.defaultValueLiteral ?? '',
        isID: d.isID ?? false,
    };
}

function snapReference(lookup: Lookup, d: any): any {
    const opp = d.opposite ? lookup[d.opposite] : null;
    return {
        kind: 'reference',
        name: d.name,
        type: typeName(lookup, d.type),
        lowerBound: d.lowerBound,
        upperBound: d.upperBound,
        ordered: d.ordered,
        unique: d.unique,
        changeable: d.changeable,
        volatile: d.volatile,
        transient: d.transient,
        unsettable: d.unsettable,
        derived: d.derived,
        containment: !!d.composition,
        container: !!d.container,
        opposite: opp ? opp.name : null,
        defaultValueLiteral: d.defaultValueLiteral ?? '',
    };
}

function snapOperation(lookup: Lookup, d: any): any {
    return {
        kind: 'operation',
        name: d.name,
        type: typeName(lookup, d.type),
        lowerBound: d.lowerBound,
        upperBound: d.upperBound,
        ordered: d.ordered,
        unique: d.unique,
        exceptions: (d.exceptions || []).map((e: any) => typeName(lookup, e)).sort(),
        parameters: (d.parameters || []).map((p: any) => {
            const dp = lookup[p];
            return dp ? {
                name: dp.name,
                type: typeName(lookup, dp.type),
                lowerBound: dp.lowerBound,
                upperBound: dp.upperBound,
                ordered: dp.ordered,
                unique: dp.unique,
            } : `<dangling:${p}>`;
        }), // parameter ORDER is meaningful — do not sort
    };
}

function snapClass(lookup: Lookup, d: any): any {
    return {
        kind: 'class',
        name: d.name,
        abstract: !!d.abstract,
        interface: !!d.interface,
        instanceClassName: d.instanceClassName ?? '',
        extends: (d.extends || []).map((e: any) => typeName(lookup, e)).sort(),
        attributes: (d.attributes || []).map((a: any) => snapAttribute(lookup, lookup[a])).sort(sortByName),
        references: (d.references || []).map((r: any) => snapReference(lookup, lookup[r])).sort(sortByName),
        operations: (d.operations || []).map((o: any) => snapOperation(lookup, lookup[o])).sort(sortByName),
    };
}

function snapEnum(lookup: Lookup, d: any): any {
    return {
        kind: 'enum',
        name: d.name,
        instanceClassName: d.instanceClassName ?? '',
        serializable: d.serializable !== false,
        literals: (d.literals || []).map((l: any) => {
            const dl = lookup[l];
            return dl ? { name: dl.name, value: dl.value, literal: dl.literal ?? '' } : `<dangling:${l}>`;
        }), // literal ORDER is meaningful
    };
}

function snapDataType(lookup: Lookup, d: any): any {
    return {
        kind: 'datatype',
        name: d.name,
        instanceClassName: d.instanceClassName ?? '',
        serializable: d.serializable !== false,
    };
}

function snapPackage(lookup: Lookup, d: any): any {
    return {
        kind: 'package',
        name: d.name,
        uri: d.uri ?? '',
        prefix: d.prefix ?? '',
        classes: (d.classes || []).map((c: any) => snapClass(lookup, lookup[c])).sort(sortByName),
        enumerators: (d.enumerators || []).map((e: any) => snapEnum(lookup, lookup[e])).sort(sortByName),
        datatypes: (d.datatypes || []).map((t: any) => snapDataType(lookup, lookup[t])).sort(sortByName),
        subpackages: (d.subpackages || []).map((p: any) => snapPackage(lookup, lookup[p])).sort(sortByName),
    };
}

/** Snapshot of a metamodel (DModel) from raw state. */
export function m2Snapshot(lookup: Lookup, dModelId: string): any {
    const dModel = lookup[dModelId];
    if (!dModel) return { error: `model ${dModelId} not in idlookup` };
    return {
        kind: 'metamodel',
        packages: (dModel.packages || []).map((p: any) => snapPackage(lookup, lookup[p])).sort(sortByName),
    };
}

// ---------------------------------------------------------------------------
// M1 snapshot
// ---------------------------------------------------------------------------

/**
 * Objects are identified positionally: roots in document order, children in
 * containment order. Non-containment references are rendered as the target's
 * path label. Enum values are rendered as literal names.
 */
export function m1Snapshot(lookup: Lookup, dModelId: string): any {
    const dModel = lookup[dModelId];
    if (!dModel) return { error: `model ${dModelId} not in idlookup` };

    const allObjs: string[] = Array.from(new Set(dModel.objects || []));
    // roots = objects not contained in any containment slot (father-independent:
    // headless the father field may be lost to F7)
    const contained = new Set<string>();
    for (const o of allObjs) {
        const d = lookup[o];
        if (!d) continue;
        for (const fId of d.features || []) {
            const f = lookup[fId];
            if (!f) continue;
            const meta = lookup[f.instanceof];
            if (!meta || meta.className !== 'DReference' || !meta.composition) continue;
            for (const v of f.values || []) {
                if (typeof v === 'string' && lookup[v]?.className === 'DObject') contained.add(v);
            }
        }
    }
    const roots = allObjs.filter((o) => lookup[o] && !contained.has(o));

    // First pass: assign stable path labels via DFS in containment order.
    const label = new Map<string, string>();
    const visit = (objId: string, path: string) => {
        label.set(objId, path);
        const d = lookup[objId];
        if (!d) return;
        let childIdx = 0;
        for (const fId of d.features || []) {
            const f = lookup[fId];
            if (!f) continue;
            const meta = lookup[f.instanceof];
            if (!meta || meta.className !== 'DReference' || !meta.composition) continue;
            for (const v of f.values || []) {
                if (typeof v === 'string' && lookup[v]?.className === 'DObject') {
                    visit(v, `${path}/${meta.name}.${childIdx++}`);
                }
            }
        }
    };
    roots.forEach((r, idx) => {
        const cls = lookup[lookup[r]?.instanceof]?.name ?? '?';
        visit(r, `/${cls}.${idx}`);
    });

    const snapValue = (v: any, metaTypeD: any): any => {
        if (typeof v === 'string' && lookup[v]) {
            const target = lookup[v];
            if (target.className === 'DObject') return { ref: label.get(v) ?? `<unlabeled:${v}>` };
            if (target.className === 'DEnumLiteral') return { literal: target.name };
            return { pointer: target.className };
        }
        return v === undefined ? null : v;
    };

    const snapObject = (objId: string): any => {
        const d = lookup[objId];
        if (!d) return { error: `<dangling:${objId}>` };
        const meta = lookup[d.instanceof];
        const features: any = {};
        for (const fId of d.features || []) {
            const f = lookup[fId];
            if (!f) continue;
            const fMeta = lookup[f.instanceof];
            const fName = fMeta?.name ?? `<meta-dangling>`;
            const isCont = fMeta?.className === 'DReference' && fMeta.composition;
            const metaTypeD = fMeta ? lookup[fMeta.type] : null;
            if (isCont) {
                features[fName] = (f.values || []).map((v: any) =>
                    typeof v === 'string' && lookup[v]?.className === 'DObject' ? snapObject(v) : snapValue(v, metaTypeD));
            } else {
                features[fName] = (f.values || []).map((v: any) => snapValue(v, metaTypeD));
            }
        }
        return { class: meta?.name ?? '?', features };
    };

    return {
        kind: 'model',
        objectCount: allObjs.length,
        rootCount: roots.length,
        roots: roots.map(snapObject),
    };
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export function deepDiff(a: any, b: any, path = '', out: string[] = [], cap = 200): string[] {
    if (out.length >= cap) return out;
    if (a === b) return out;
    const ta = typeof a; const tb = typeof b;
    if (ta !== tb || a === null || b === null || ta !== 'object') {
        out.push(`${path || '/'}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
        return out;
    }
    if (Array.isArray(a) !== Array.isArray(b)) {
        out.push(`${path || '/'}: array-vs-object mismatch`);
        return out;
    }
    if (Array.isArray(a)) {
        if (a.length !== b.length) out.push(`${path || '/'}: length ${a.length} ≠ ${b.length}`);
        const n = Math.min(a.length, b.length);
        for (let i = 0; i < n; i++) {
            const key = a[i]?.name && a[i].name === b[i]?.name ? a[i].name : i;
            deepDiff(a[i], b[i], `${path}[${key}]`, out, cap);
            if (out.length >= cap) return out;
        }
        return out;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        deepDiff(a[k], b[k], `${path}.${k}`, out, cap);
        if (out.length >= cap) return out;
    }
    return out;
}
