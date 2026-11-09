/**
 * simSnapshot — the plan of «Save snapshot as object diagram» (DCN slice 5, lane 4,
 * P-2026-11-08-2124; R-DCN-27, R-DCN-30).
 *
 * `planSnapshot` lists, in order, what the write lane will do to copy an M1 model
 * into a new one and write σ over it. It executes nothing. Pure: no React, no
 * store, ids and values only.
 *
 * - The order: every create first, a container before its contents; then the
 *   reference writes; then the attributes of the model; then σ over them. The
 *   objects are addressed by temporary keys, the write lane maps them to real ids.
 * - Why the whole model: R-OI keeps the class level and the instance level in one
 *   M1 model, so the classifiers are objects of the copy (R-DCN-30).
 * - A slot is an object here (`dcnCompile.ts` `slotsOf`): the instance holds Slot
 *   objects, a Slot names its feature (an M1 object) and holds its value in a value
 *   specification. So σ is written on the holder of the first Slot of the feature,
 *   its first value only, the one the compiler reads and the only one σ holds.
 * - A link is never written from σ, which holds only the name of its first target
 *   (R-DCN-30): it is copied with the other references. An enumeration slot is an
 *   InstanceValue too, but σ moves it, so it is pointed to the literal σ names.
 * - A dormant slot is written like any other: σ keeps its value (R-DCN-3).
 * - A target outside the model, and a σ value with no place to go, are listed in
 *   `unwritten` and left out of the operations: a value in `values` is always a key.
 */

import type { OntoValueKind } from '../../../model/ontological/bindingCodec';
import type { DcnSlot } from '../../../model/simulation/dcn/dcnCompile';
import type { SimValue } from '../../../model/simulation/netTypes';

/** One slot of a source object: its M2 feature (`DValue.instanceof`) and its raw values, null entries included. */
export interface SnapshotSourceSlot {
    readonly feature: string;
    readonly values: readonly unknown[];
}

/** One object of the source model (`collectModelObjectIds`), as raw data. */
export interface SnapshotSourceObject {
    readonly id: string;
    /** The M2 class: the copy has the same metamodel, so this id is not remapped. */
    readonly classId: string;
    readonly name?: string;
    /** `DObject.father`: another object of the model, or anything else for a root (the model's id). */
    readonly owner: string | null;
    readonly attributes: readonly SnapshotSourceSlot[];
    readonly references: readonly SnapshotSourceSlot[];
}

/** The M2 roles of a slot, from the DCN binding (`OntoBinding`) and `DcnFeatures`. */
export interface SnapshotRoles {
    /** The M2 class of a Slot object: the type of `slotContainer`. */
    readonly slotClass: string;
    readonly slotContainer: string;
    readonly definingFeature: string;
    /** A reference, or an attribute of the Slot when the binding keeps the value there. */
    readonly valueHolder: string;
    readonly featureType: string;
    /** An enumeration to its literals. */
    readonly literals?: string;
    readonly valueKinds: readonly OntoValueKind[];
}

export interface SnapshotInput {
    readonly modelName: string;
    /** The shown step: `getSimView ?? trace.length`, so N matches the slider. */
    readonly step: number;
    readonly objects: readonly SnapshotSourceObject[];
    readonly roles: SnapshotRoles;
    /** σ at the shown step, instance to attribute name to value: `SimState.attrs`. */
    readonly sigma: ReadonlyMap<string, ReadonlyMap<string, SimValue>>;
    /** Instance to attribute name to its feature: `DcnCompiled.slots`. */
    readonly slots: ReadonlyMap<string, ReadonlyMap<string, DcnSlot>>;
}

export interface SnapshotCreate {
    readonly op: 'create';
    readonly key: string;
    readonly classId: string;
    readonly name?: string;
    /** The key of the container, `null` for a root of the new model. */
    readonly ownerKey: string | null;
    /** The object this create copies, absent for an object the plan adds. */
    readonly sourceId?: string;
}

/** `.values = [keys mapped to ids]` on the slot of `feature` (`model/CLAUDE.md` §9.3). */
export interface SnapshotReferenceWrite {
    readonly op: 'reference';
    readonly key: string;
    readonly feature: string;
    readonly values: readonly string[];
}

/** The value of the attribute slot of `feature`. */
export interface SnapshotAttributeWrite {
    readonly op: 'attribute';
    readonly key: string;
    readonly feature: string;
    readonly values: readonly unknown[];
}

export type SnapshotOperation = SnapshotCreate | SnapshotReferenceWrite | SnapshotAttributeWrite;

export type SnapshotUnwrittenReason = 'target-outside-model' | 'no-instance' | 'no-feature' | 'no-type' | 'holder-kind';

/** What the plan left out. `objectId` is a source id; `what` a reference feature, or the name of an attribute of σ. */
export interface SnapshotUnwritten {
    readonly objectId: string;
    readonly what: string;
    readonly reason: SnapshotUnwrittenReason;
}

export interface SnapshotPlan {
    /** The name asked for: the suffix for a name already taken is `uniqueModelName`'s, at write time. */
    readonly name: string;
    readonly operations: readonly SnapshotOperation[];
    readonly unwritten: readonly SnapshotUnwritten[];
}

/** The ids held by a raw reference slot, without null entries. */
function targetsOf(values: readonly unknown[]): string[] {
    return values.filter((v): v is string => typeof v === 'string' && v !== '');
}

function referenceTargets(object: SnapshotSourceObject | undefined, feature: string | undefined): string[] {
    const slot = object?.references.find(r => r.feature === feature);
    return slot ? targetsOf(slot.values) : [];
}

/** The plan of the copy of `input.objects` with σ over it; see the header for the order. */
export function planSnapshot(input: SnapshotInput): SnapshotPlan {
    const { roles } = input;
    const byId = new Map(input.objects.map(o => [o.id, o]));
    const unwritten: SnapshotUnwritten[] = [];

    /** The objects σ needs and the model has not, and the references that hold them; ids of their own, gone from the plan. */
    const added: SnapshotSourceObject[] = [];
    const appended = new Map<string, Map<string, string[]>>();
    const append = (objectId: string, feature: string, id: string) => {
        const byFeature = appended.get(objectId) ?? new Map<string, string[]>();
        byFeature.set(feature, [...(byFeature.get(feature) ?? []), id]);
        appended.set(objectId, byFeature);
    };
    const add = (classId: string, owner: string, attributes: SnapshotSourceSlot[], references: SnapshotSourceSlot[]): string => {
        const id = `snapshot-added-${added.length}`;
        added.push({ id, classId, owner, attributes, references });
        return id;
    };

    const typeOf = (feature: string) => byId.get(referenceTargets(byId.get(feature), roles.featureType)[0]);

    /** The enumeration literal of the feature's type that `value` names. */
    const literalNamed = (feature: string, value: SimValue): SnapshotSourceObject | undefined =>
        referenceTargets(typeOf(feature), roles.literals).map(l => byId.get(l)).find(l => l?.name === value);

    /** Builds a new holder of `value` as the feature's type asks; `null` when the type is no value type: a link. */
    const newHolder = (feature: string, value: SimValue): ((owner: string) => string) | null => {
        const primitive = roles.valueKinds.find(k => k.when === `primitive:${typeOf(feature)?.name}`);
        if (primitive) return owner => add(primitive.create, owner, [{ feature: primitive.field, values: [value] }], []);
        const literal = literalNamed(feature, value);
        const instanceKind = roles.valueKinds.find(k => k.when === 'instance');
        if (literal === undefined || instanceKind === undefined) return null;
        return owner => add(instanceKind.create, owner, [], [{ feature: instanceKind.field, values: [literal.id] }]);
    };

    const overrides: Array<SnapshotAttributeWrite | SnapshotReferenceWrite> = [];

    for (const [instanceId, attrs] of input.sigma) {
        const instance = byId.get(instanceId);
        for (const [name, value] of attrs) {
            if (instance === undefined) { unwritten.push({ objectId: instanceId, what: name, reason: 'no-instance' }); continue; }
            const feature = input.slots.get(instanceId)?.get(name)?.feature;
            if (feature === undefined) { unwritten.push({ objectId: instanceId, what: name, reason: 'no-feature' }); continue; }
            const slot = referenceTargets(instance, roles.slotContainer).map(s => byId.get(s))
                .find(s => referenceTargets(s, roles.definingFeature)[0] === feature);
            if (slot?.attributes.some(a => a.feature === roles.valueHolder)) {
                overrides.push({ op: 'attribute', key: slot.id, feature: roles.valueHolder, values: [value] });
                continue;
            }
            const held = byId.get(referenceTargets(slot, roles.valueHolder)[0]);
            if (held === undefined) {
                if (typeOf(feature) === undefined) { unwritten.push({ objectId: instanceId, what: name, reason: 'no-type' }); continue; }
                const holder = newHolder(feature, value);
                if (holder === null) continue;
                let slotId = slot?.id;
                if (slotId === undefined) {
                    slotId = add(roles.slotClass, instanceId, [], [{ feature: roles.definingFeature, values: [feature] }]);
                    append(instanceId, roles.slotContainer, slotId);
                }
                append(slotId, roles.valueHolder, holder(slotId));
                continue;
            }
            const kind = roles.valueKinds.find(k => k.create === held.classId);
            if (kind === undefined) { unwritten.push({ objectId: instanceId, what: name, reason: 'holder-kind' }); continue; }
            if (kind.when !== 'instance') {
                overrides.push({ op: 'attribute', key: held.id, feature: kind.field, values: [value] });
                continue;
            }
            const literal = literalNamed(feature, value);
            if (literal !== undefined) overrides.push({ op: 'reference', key: held.id, feature: kind.field, values: [literal.id] });
        }
    }

    const all = [...input.objects, ...added];
    const allById = new Map(all.map(o => [o.id, o]));

    // Containers first, otherwise in the order of the model. Marked before the owner is
    // visited, so a malformed cycle of owners ends instead of recursing.
    const ordered: SnapshotSourceObject[] = [];
    const seen = new Set<string>();
    const visit = (o: SnapshotSourceObject) => {
        if (seen.has(o.id)) return;
        seen.add(o.id);
        const owner = o.owner === null ? undefined : allById.get(o.owner);
        if (owner) visit(owner);
        ordered.push(o);
    };
    all.forEach(visit);

    const keys = new Map(ordered.map((o, i) => [o.id, `new:${i}`]));
    const keyOf = (id: string) => keys.get(id) as string;

    const creates: SnapshotCreate[] = ordered.map(o => ({
        op: 'create',
        key: keyOf(o.id),
        classId: o.classId,
        ...(o.name !== undefined ? { name: o.name } : {}),
        ownerKey: o.owner !== null && keys.has(o.owner) ? keyOf(o.owner) : null,
        ...(byId.has(o.id) ? { sourceId: o.id } : {}),
    }));

    const references: SnapshotReferenceWrite[] = [];
    const attributes: SnapshotAttributeWrite[] = [];
    for (const o of ordered) {
        const written = new Map(o.references.map(r => [r.feature, targetsOf(r.values)]));
        for (const [feature, ids] of appended.get(o.id) ?? []) written.set(feature, [...(written.get(feature) ?? []), ...ids]);
        for (const [feature, ids] of written) {
            const inModel = ids.filter(id => {
                if (keys.has(id)) return true;
                unwritten.push({ objectId: o.id, what: feature, reason: 'target-outside-model' });
                return false;
            });
            // A new object is unset, and `.values = []` would not clear one (model/CLAUDE.md §9.3).
            if (inModel.length > 0) references.push({ op: 'reference', key: keyOf(o.id), feature, values: inModel.map(keyOf) });
        }
        for (const a of o.attributes) {
            if (a.values.length > 0) attributes.push({ op: 'attribute', key: keyOf(o.id), feature: a.feature, values: a.values });
        }
    }

    const overlay = overrides.map(w => w.op === 'reference'
        ? { ...w, key: keyOf(w.key), values: w.values.map(keyOf) }
        : { ...w, key: keyOf(w.key) });

    return {
        name: `${input.modelName} (snapshot step ${input.step})`,
        operations: [...creates, ...references, ...attributes, ...overlay],
        unwritten,
    };
}
