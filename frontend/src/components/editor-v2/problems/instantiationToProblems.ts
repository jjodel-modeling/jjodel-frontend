/**
 * instantiationToProblems — the instances of a model whose slots do not match their classifier (R-OI-3, R-OI-11; S3a,
 * plan `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md` Q2). Pure: it reads the store's D records
 * through `get` (the read half of `instantiate.ts` and `bindingReader.ts`, both vitest-safe) and writes nothing; the
 * producer `InstantiationProblemSync.tsx` maps the findings into the registry.
 *
 * Only the instances whose most specific record is `object` are judged (decision D4: links are S4's; an enumeration
 * literal has no record, R-OI-8). For each:
 *  - missing: the features of the closure with no slot (`slotDiff`), one finding per instance, a warning;
 *  - orphan: a slot whose defining feature is gone or not in the closure (`slotDiff`), one per slot, an error;
 *  - duplicate (O3): a defining feature a second slot of the instance repeats, one per feature, an error;
 *  - value-type (O5): a value whose metaclass is the `create` of one of the record's value kinds and is not the one
 *    the feature's type asks for: the `primitive:<Type>` kind of the type's name, otherwise the `instance` kind, whose
 *    instance must be classified by the type or a descendant over the record's generalization. A value of any other
 *    metaclass (a `LiteralNull`) is not judged, as in the fixture's rule (`uml-class-object-fixture.ts:589`).
 * And once per cycle of the generalization, over every classifier the record's feature container can hold: one
 * finding anchored on each classifier of the cycle (an error; the closure does not follow it).
 *
 * Reconciliation is never destructive (R-OI-3): these are reports; nothing here or in the producer deletes.
 */

import { featureClosure, recordFor, slotDiff, type OntoReadView } from '../../../model/ontological/bindingReader';
import type { OntoBinding } from '../../../model/ontological/bindingCodec';
import { modelObjectIds, OBJECT_RECORD, ontoReadView, readOntoBindings, type DGet } from '../hooks/instantiate';

export type InstantiationFindingKind = 'missing' | 'orphan' | 'duplicate' | 'value-type' | 'cycle';

export interface InstantiationFinding {
    kind: InstantiationFindingKind;
    /** Unique within the kind: the instance (missing), the slot (orphan), `instance:feature` (duplicate), the value
     *  (value-type), the sorted classifier ids (cycle). */
    key: string;
    severity: 'warning' | 'error';
    title: string;
    description: string;
    /** The instance judged; `null` for a cycle. */
    instance: string | null;
    /** The M1 ids the finding is shown on. */
    anchors: string[];
    /** The ids it names: the missing features, the slots, the value, the classifiers. */
    related: string[];
}

/** The classifiers `classifierId` directly specializes through the record's generalization (as `bindingReader`). */
function generalsOf(view: OntoReadView, binding: OntoBinding, classifierId: string): string[] {
    if (!binding.generalization) return [];
    const { direct, via, general } = binding.generalization as { direct?: string; via?: string; general?: string };
    if (direct !== undefined) return view.referenceTargets(classifierId, direct);
    if (via === undefined || general === undefined) return [];
    return view.referenceTargets(classifierId, via).flatMap(link => view.referenceTargets(link, general));
}

/** True when `classifierId` is `typeId` or specializes it at any depth; a cycle terminates. */
function specializes(view: OntoReadView, binding: OntoBinding, classifierId: string, typeId: string): boolean {
    const seen = new Set<string>();
    const stack = [classifierId];
    while (stack.length > 0) {
        const c = stack.pop()!;
        if (c === typeId) return true;
        if (seen.has(c)) continue;
        seen.add(c);
        stack.push(...generalsOf(view, binding, c));
    }
    return false;
}

/** Whether the value `valueId` fits a feature typed by `typeId` (see the module comment); `true` when not judged. */
function valueFits(get: DGet, view: OntoReadView, binding: OntoBinding, valueId: string, typeId: string): boolean {
    const kinds = binding.valueKinds ?? [];
    const meta = view.metaclassOf(valueId);
    if (meta === undefined || !kinds.some(k => k.create === meta)) return true;
    const primitive = kinds.find(k => k.when === `primitive:${String(get(typeId)?.name ?? '')}`);
    if (primitive) return meta === primitive.create;
    const instanceKind = kinds.find(k => k.when === 'instance');
    if (!instanceKind) return true;
    if (meta !== instanceKind.create) return false;
    const target = view.referenceTargets(valueId, instanceKind.field)[0];
    if (target === undefined) return true;
    const targetClassifier = view.referenceTargets(target, binding.typeReference)[0];
    return targetClassifier !== undefined && specializes(view, binding, targetClassifier, typeId);
}

/** Every finding of the model `modelId`: see the module comment. None without an `object` record. */
export function detectInstantiationProblems(get: DGet, modelId: string): InstantiationFinding[] {
    const bindings = readOntoBindings(get, modelId);
    const objectRecord = bindings.find(b => b.name === OBJECT_RECORD);
    if (!objectRecord) return [];
    const view = ontoReadView(get);
    const nameOf = (id: string | null | undefined): string => (id ? String(get(id)?.name ?? id) : '?');
    const ids = modelObjectIds(get, modelId);
    const out: InstantiationFinding[] = [];

    const containerOwner = objectRecord.featureContainer !== undefined ? view.ownerOf(objectRecord.featureContainer) : undefined;
    if (containerOwner !== undefined) {
        const reported = new Set<string>();
        for (const id of ids) {
            const meta = view.metaclassOf(id);
            if (meta === undefined || !view.conformsTo(meta, containerOwner)) continue;
            for (const cycle of featureClosure(view, objectRecord, id).cycles) {
                const members = Array.from(new Set(cycle)).sort();
                const key = members.join(',');
                if (reported.has(key)) continue;
                reported.add(key);
                out.push({
                    kind: 'cycle', key, severity: 'error', title: 'Generalization cycle',
                    description: `${cycle.map(nameOf).join(' → ')}: the closure does not follow it`,
                    instance: null, anchors: members, related: members,
                });
            }
        }
    }

    for (const id of ids) {
        const record = recordFor(view, bindings, id);
        if (!record || record.name !== OBJECT_RECORD) continue;
        if (record.slotContainer === undefined || record.definingFeature === undefined) continue;
        const classifier = view.referenceTargets(id, record.typeReference)[0];
        if (classifier === undefined) continue;
        const diff = slotDiff(view, record, id);
        if (diff.missing.length > 0) {
            out.push({
                kind: 'missing', key: id, severity: 'warning', title: 'Missing slots',
                description: `No slot for ${diff.missing.map(nameOf).join(', ')}`,
                instance: id, anchors: [id], related: diff.missing,
            });
        }
        for (const { slot, feature } of diff.orphans) {
            out.push({
                kind: 'orphan', key: slot, severity: 'error', title: 'Orphan slot',
                description: feature === null ? 'Its feature is gone' : `${nameOf(feature)} is not a feature of ${nameOf(classifier)}`,
                instance: id, anchors: [id, slot], related: [slot],
            });
        }

        const slots = view.referenceTargets(id, record.slotContainer);
        const featureOf = (slot: string): string | undefined => view.referenceTargets(slot, record.definingFeature!)[0];
        const seen = new Set<string>();
        const repeated = new Set<string>();
        for (const slot of slots) {
            const feature = featureOf(slot);
            if (feature === undefined) continue;
            if (seen.has(feature)) repeated.add(feature);
            else seen.add(feature);
        }
        for (const feature of repeated) {
            out.push({
                kind: 'duplicate', key: `${id}:${feature}`, severity: 'error', title: 'Duplicate slot',
                description: `Two slots for ${nameOf(feature)}`,
                instance: id, anchors: [id], related: slots.filter(s => featureOf(s) === feature),
            });
        }

        if (record.featureType === undefined || record.valueHolder === undefined) continue;
        for (const slot of slots) {
            const feature = featureOf(slot);
            const type = feature !== undefined ? view.referenceTargets(feature, record.featureType)[0] : undefined;
            if (type === undefined) continue;
            for (const value of view.referenceTargets(slot, record.valueHolder)) {
                if (valueFits(get, view, record, value, type)) continue;
                out.push({
                    kind: 'value-type', key: value, severity: 'error', title: 'Wrong value type',
                    description: `${nameOf(feature)} : ${nameOf(type)} holds a ${nameOf(view.metaclassOf(value))}`,
                    instance: id, anchors: [id], related: [slot, value],
                });
            }
        }
    }
    return out;
}
