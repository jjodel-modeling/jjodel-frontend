/**
 * bindingReader — what the bindings say about the M1 objects of a model (R-OI-2, R-OI-7, R-OI-8; discovery
 * 2026-10-20 §3.1 to §3.4, slice S1).
 *
 * Functions over `OntoReadView`, a small read interface a later adapter implements over the store; nothing here
 * imports the store, the joiner or React, and nothing writes. Ids in a binding are M2 ids, ids in the view are M1
 * ids; the view maps one to the other through `metaclassOf` and `ownerOf`.
 *
 * - `recordFor`: the binding that applies to an instance. The type reference must be owned by the instance's
 *   metaclass, and when the binding has a feature container its owner must be the metaclass of the instance's
 *   classifier (R-OI-8: the links record and the objects record share the type reference, the classifier's metaclass
 *   tells them apart; an enumeration selects none). Metaclasses are compared exactly: the view carries no `extends`.
 * - `instantiableClassifiers`: the M1 objects whose metaclass owns the feature container, abstract ones left out. A
 *   binding with no feature container cannot say which objects classify (the view does not carry the type of a
 *   reference), so it gives none.
 * - `featureClosure`: the features of a classifier, its own first and then the inherited ones, level by level over the
 *   generalization. A feature is listed once. A cycle is reported as data (the ids around it, the first repeated at
 *   the end) and not followed.
 * - `slotDiff`: for an instance, the features of its classifier's closure that have no slot, and the slots whose
 *   defining feature is not in the closure. Nothing is judged when the binding has no slot roles or the instance has no
 *   classifier.
 */

import type { OntoBinding } from './bindingCodec';

/** The reads the functions below need; every id is a string, an unknown one reads as empty or `undefined`. */
export interface OntoReadView {
    /** The M2 class id of the M1 object `objectId`. */
    metaclassOf(objectId: string): string | undefined;
    /** The M1 ids held by the reference `referenceId` of the object `objectId`, in order. */
    referenceTargets(objectId: string, referenceId: string): string[];
    /** The value of the attribute `attributeId` of the object `objectId`. */
    attributeValue(objectId: string, attributeId: string): unknown;
    /** The M2 class id that owns the M2 feature `featureId`. */
    ownerOf(featureId: string): string | undefined;
}

export interface FeatureClosure {
    /** Feature ids, own first, then inherited level by level; each once. */
    features: string[];
    /** Each cycle as the classifier ids around it, the first one repeated at the end. */
    cycles: string[][];
}

export interface OrphanSlot {
    slot: string;
    /** The slot's defining feature, `null` when it has none. */
    feature: string | null;
}

export interface SlotDiff {
    /** Features of the closure with no slot, in closure order. */
    missing: string[];
    orphans: OrphanSlot[];
    cycles: string[][];
}

const classifierOf = (view: OntoReadView, binding: OntoBinding, instanceId: string): string | undefined =>
    view.referenceTargets(instanceId, binding.typeReference)[0];

/** The binding of `bindings` that applies to `instanceId`, `null` when none does. */
export function recordFor(view: OntoReadView, bindings: readonly OntoBinding[], instanceId: string): OntoBinding | null {
    const instanceMeta = view.metaclassOf(instanceId);
    if (instanceMeta === undefined) return null;
    for (const binding of bindings) {
        if (view.ownerOf(binding.typeReference) !== instanceMeta) continue;
        if (binding.featureContainer === undefined) return binding;
        const classifier = classifierOf(view, binding, instanceId);
        if (classifier === undefined) continue;
        const classifierMeta = view.metaclassOf(classifier);
        if (classifierMeta !== undefined && classifierMeta === view.ownerOf(binding.featureContainer)) return binding;
    }
    return null;
}

const isTrue = (v: unknown): boolean => v === true || v === 'true';

/** The M1 ids of `modelObjectIds` that `binding` lets an instance be made of: not abstract, in the given order. */
export function instantiableClassifiers(view: OntoReadView, binding: OntoBinding, modelObjectIds: readonly string[]): string[] {
    if (binding.featureContainer === undefined) return [];
    const owner = view.ownerOf(binding.featureContainer);
    if (owner === undefined) return [];
    const abstractFlag = binding.abstractFlag;
    return modelObjectIds.filter(id => {
        if (view.metaclassOf(id) !== owner) return false;
        return !(abstractFlag !== undefined && isTrue(view.attributeValue(id, abstractFlag)));
    });
}

/** The classifiers `classifierId` directly specializes, through the binding's generalization; none without one. */
function generalsOf(view: OntoReadView, binding: OntoBinding, classifierId: string): string[] {
    if (!binding.generalization) return [];
    const { direct, via, general } = binding.generalization as { direct?: string; via?: string; general?: string };
    if (direct !== undefined) return view.referenceTargets(classifierId, direct);
    if (via === undefined || general === undefined) return [];
    return view.referenceTargets(classifierId, via).flatMap(link => view.referenceTargets(link, general));
}

/** The feature closure of `classifierId`: see the module comment. */
export function featureClosure(view: OntoReadView, binding: OntoBinding, classifierId: string): FeatureClosure {
    const features: string[] = [];
    const seenFeatures = new Set<string>();
    const cycles: string[][] = [];
    const visited = new Set<string>([classifierId]);
    let level: { id: string; path: string[] }[] = [{ id: classifierId, path: [classifierId] }];
    while (level.length > 0) {
        const next: { id: string; path: string[] }[] = [];
        for (const { id, path } of level) {
            if (binding.featureContainer !== undefined) {
                for (const f of view.referenceTargets(id, binding.featureContainer)) {
                    if (seenFeatures.has(f)) continue;
                    seenFeatures.add(f);
                    features.push(f);
                }
            }
            for (const general of generalsOf(view, binding, id)) {
                const at = path.indexOf(general);
                if (at >= 0) {
                    cycles.push([...path.slice(at), general]);
                    continue;
                }
                if (visited.has(general)) continue;
                visited.add(general);
                next.push({ id: general, path: [...path, general] });
            }
        }
        level = next;
    }
    return { features, cycles };
}

/** The missing features and the orphan slots of `instanceId`: see the module comment. */
export function slotDiff(view: OntoReadView, binding: OntoBinding, instanceId: string): SlotDiff {
    const none: SlotDiff = { missing: [], orphans: [], cycles: [] };
    if (binding.slotContainer === undefined || binding.definingFeature === undefined) return none;
    const classifier = classifierOf(view, binding, instanceId);
    if (classifier === undefined) return none;
    const { features, cycles } = featureClosure(view, binding, classifier);
    const inClosure = new Set(features);
    const covered = new Set<string>();
    const orphans: OrphanSlot[] = [];
    for (const slot of view.referenceTargets(instanceId, binding.slotContainer)) {
        const feature = view.referenceTargets(slot, binding.definingFeature)[0] ?? null;
        if (feature !== null && inClosure.has(feature)) covered.add(feature);
        else orphans.push({ slot, feature });
    }
    return { missing: features.filter(f => !covered.has(f)), orphans, cycles };
}
