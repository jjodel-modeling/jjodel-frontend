/**
 * singletonShape — whether an M1 instance draws as a pill or as a rectangle,
 * and what its label says.
 *
 * Design handoff: docs/design/design_handoff_instance_node/README.md, "The
 * three-level style model" (level 3: one renderer, two sizes).
 *
 * A singleton is the only member of its class, and it is born carrying that
 * class's name (`joiner/classes.ts:942` — `addObject({name: d.name})`). So the
 * `Red : Red` a rectangle header prints for it says nothing twice, and the
 * compartment under it says nothing at all. The pill is the shape for that
 * case; the rectangle stays for every other instance, singleton included as
 * soon as it holds something.
 *
 * Everything here is a pure function of plain data — a `DClass`-shaped record,
 * an `idlookup`-shaped dictionary. No proxies, no Redux, no React: the same
 * calls answer for the standalone node on the canvas and for the value inside
 * a compartment row, which is what keeps the two from drifting.
 *
 * D-layer field names, and they are not the ones the canvas types use:
 *   - `abstract`, NOT `isAbstract` (that name exists only as a rename inside
 *     `ClassNodeData`, and reads `undefined` off `idlookup`)
 *   - `extends`, the DIRECT superclasses in declaration order — not
 *     `superclasses` / `extendsChain`, which are transitive and would surface
 *     an ancestor several levels up
 */

import { isEmptySlot } from './valueRenderer';

export type InstanceNodeShape = 'pill' | 'rectangle';

export interface InstanceShapeInput {
    /** `DClass.isSingleton` of the metaclass. */
    isSingleton: boolean;
    /** Slots actually holding a value — see `countValuedSlots`. */
    valuedSlotCount: number;
}

/**
 * The shape rule, stated on CONTENT rather than on the flag alone.
 *
 * A pill cannot host a compartment, so a singleton that holds something has to
 * stay a rectangle: `Config` with `debug = true, level = 2` has two rows to
 * show, and they are the reason the node exists. The singleton-ness of that one
 * is carried by the cardinality badge instead.
 */
export function resolveInstanceShape(input: InstanceShapeInput): InstanceNodeShape {
    return input.isSingleton && input.valuedSlotCount === 0 ? 'pill' : 'rectangle';
}

export interface SuperclassRef {
    id: string;
    name: string;
    /** The D-layer `abstract` field. */
    abstract: boolean;
}

/**
 * The first abstract superclass among the DIRECT ones, in declaration order.
 *
 * Only abstract, and only direct. A concrete superclass does not qualify: it
 * would name a set the instance could have been an ordinary member of, which is
 * not what the label is for. With more than one abstract direct superclass the
 * first declared wins — a deliberate simplification, not a tie to be broken:
 * the full list stays available in the inspector.
 */
export function firstAbstractDirectSuperclass(supers: readonly SuperclassRef[]): SuperclassRef | null {
    for (const s of supers) {
        if (s?.abstract) return s;
    }
    return null;
}

export interface SingletonLabelParts {
    /** `null` when no direct superclass is abstract: the name IS the whole label. */
    superclassName: string | null;
    instanceName: string;
}

/**
 * `Color::Red`, or just `Red`.
 *
 * The order is the inverse of the rectangle header's `Red : Color`, and that is
 * the point: the pill reads "a Red, which is a Color". Which half gets the UML
 * underline follows the instance name, not the position — see
 * `SingletonPill.tsx`.
 */
export function singletonLabelParts(
    instanceName: string,
    supers: readonly SuperclassRef[],
): SingletonLabelParts {
    const superclass = firstAbstractDirectSuperclass(supers);
    return { superclassName: superclass?.name ?? null, instanceName };
}

// ─── Reading the D layer ─────────────────────────────────────────────────────
//
// `idlookup`-shaped input: a dictionary whose values are the raw D records. The
// functions below are the only place that knows the field names, so a rename in
// the D layer lands in one file.

type Lookup = Record<string, any>;

/** The direct superclasses of a DClass, resolved and in declaration order. */
export function readDirectSuperclasses(idlookup: Lookup, classId: string | null | undefined): SuperclassRef[] {
    if (!idlookup || !classId) return [];
    const dClass = idlookup[classId];
    const ids = dClass?.extends;
    if (!Array.isArray(ids)) return [];

    const out: SuperclassRef[] = [];
    for (const supId of ids) {
        // `extends` can hold a pointer id or, after some write paths, the record
        // itself. Both shapes appear in the sync layer's own reads.
        const id = typeof supId === 'string' ? supId : supId?.id;
        if (typeof id !== 'string') continue;
        const sup = idlookup[id];
        if (!sup) continue;
        out.push({ id, name: sup.name ?? '', abstract: !!sup.abstract });
    }
    return out;
}

/** `DClass.isSingleton`, defensively. */
export function readIsSingleton(idlookup: Lookup, classId: string | null | undefined): boolean {
    if (!idlookup || !classId) return false;
    return !!idlookup[classId]?.isSingleton;
}

/**
 * How many slots of a DObject actually hold a value.
 *
 * Emptiness is delegated to `isEmptySlot`, the same predicate the compartment
 * uses to decide the dash treatment, so the count here and the count the node
 * computes from its own rows cannot answer differently. Rows that exist only as
 * lazy co-evolution placeholders hold nothing by construction and are absent
 * from `DObject.features` anyway, so they do not enter either count.
 *
 * A slot whose `instanceof` does not resolve is NOT counted, and that exclusion
 * is load-bearing rather than defensive. The identity slot carries the
 * instance's own name (CLAUDE.md §3.12) and, on a class that declares no `name`
 * attribute, it sits in `DObject.features` pointing at nothing. Measured
 * 2026-08-28 on the `Blue` singleton: the D record held one such slot with
 * `values: ["Blue"]` while `LObject.features` returned zero entries — the L
 * proxy drops it, so the compartment never renders it and the node's own row
 * count never sees it.
 *
 * Counting it would have made every named singleton a rectangle a moment after
 * mount, which is the whole feature gone. It is also wrong on its own terms:
 * that slot holds the name, which the label already shows, not structure the
 * pill would have to make room for.
 */
export function countValuedSlots(idlookup: Lookup, objectId: string | null | undefined): number {
    if (!idlookup || !objectId) return 0;
    const dObject = idlookup[objectId];
    const featureIds = dObject?.features;
    if (!Array.isArray(featureIds)) return 0;

    let count = 0;
    for (const fid of featureIds) {
        const id = typeof fid === 'string' ? fid : fid?.id;
        if (typeof id !== 'string') continue;
        const dValue = idlookup[id];
        if (!dValue) continue;

        // Same gate the L proxy applies: a slot stands for a declared feature,
        // or it is not a slot the node knows how to show.
        const instOf = dValue.instanceof;
        const featureId = typeof instOf === 'string' ? instOf : (Array.isArray(instOf) ? instOf[0] : null);
        if (typeof featureId !== 'string' || !idlookup[featureId]) continue;

        const raw = Array.isArray(dValue.values) ? dValue.values : [];
        const values = raw.map((v: unknown) => String(v ?? ''));
        if (!isEmptySlot({ value: values[0] ?? '', values })) count++;
    }
    return count;
}

/** Everything the pill needs about one instance, read in one pass. */
export interface SingletonInstanceInfo {
    shape: InstanceNodeShape;
    isSingleton: boolean;
    valuedSlotCount: number;
    label: SingletonLabelParts;
}

/**
 * The whole answer for one DObject: is it a pill, and what does it read.
 *
 * Used for a REFERENCE TARGET, where the node has nothing but the target's id
 * and name. The node's own case goes through the pieces instead, because it
 * already holds its slot rows and must not count them a second time from a
 * different source.
 */
export function readSingletonInstanceInfo(
    idlookup: Lookup,
    objectId: string,
    instanceName: string,
): SingletonInstanceInfo {
    const dObject = idlookup?.[objectId];
    const instOf = dObject?.instanceof;
    const classId = typeof instOf === 'string' ? instOf : (Array.isArray(instOf) ? instOf[0] : null);

    const isSingleton = readIsSingleton(idlookup, classId);
    const valuedSlotCount = countValuedSlots(idlookup, objectId);

    return {
        shape: resolveInstanceShape({ isSingleton, valuedSlotCount }),
        isSingleton,
        valuedSlotCount,
        label: singletonLabelParts(instanceName, readDirectSuperclasses(idlookup, classId)),
    };
}

/**
 * The names of every concrete class that directly extends `superclassId`.
 *
 * This is the singleton encoding of an enumeration, and it exists so rule 3 of
 * the colour ladder can run on a singleton drawn as a node. A metamodel that
 * says `Color { Red, Green, Blue }` as an EEnum gives the ladder its literal
 * set for free; one that says it as an abstract `Color` with three singleton
 * subclasses is expressing the same closed set, and the same rule should reach
 * the same answer. Testing the WHOLE set — not just the instance's own name —
 * is the property that makes rule 3 safe, and it is preserved here.
 *
 * Backward-link iteration over `idlookup`, not `superclass.subclasses`: there
 * is no such D field (the `static subclasses` on the runtime class is a
 * different thing entirely), and a forward-link collection would be stale
 * straight after a parse anyway (CLAUDE.md §3.6). The canonical shape of this
 * scan is `buildImportSummary.ts`'s `countDescendantsByFather`.
 */
export function readSiblingSubclassNames(idlookup: Lookup, superclassId: string | null | undefined): string[] {
    if (!idlookup || !superclassId) return [];
    const out: string[] = [];
    for (const id in idlookup) {
        const e = idlookup[id];
        if (e?.className !== 'DClass' || e.abstract) continue;
        const ext = e.extends;
        if (!Array.isArray(ext)) continue;
        for (const supId of ext) {
            const sid = typeof supId === 'string' ? supId : supId?.id;
            if (sid === superclassId) { if (e.name) out.push(e.name); break; }
        }
    }
    return out;
}
