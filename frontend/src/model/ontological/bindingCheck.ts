/**
 * bindingCheck — whether a binding can be read against a metamodel (R-OI-2, R-OI-7; discovery 2026-10-20 §3.1,
 * §3.7, slice S1). The `bindingCompat` pattern: a pure judge over a `MetamodelSketch`, no store.
 *
 * Per record:
 * - every id exists in the sketch and has the sort its role needs: a reference (type reference, feature container,
 *   generalization, slot container, defining feature, feature type), an attribute (abstract flag, default value), a
 *   reference or an attribute (value holder, and the `field` of a value kind), a class (the `create` of a value kind);
 * - the type reference and the slot container are owned by the same instance metaclass;
 * - the defining feature is owned by the slot metaclass, the type of the slot container;
 * - the four slot roles (slot container, defining feature, value holder, value kinds) all come or none does (R-OI-7),
 *   so a record may bind the type reference alone;
 * - each path of `featureSources` (R-DCN-10) is a list of references, the type of hop i owns hop i+1 or inherits it,
 *   and, when the record has a defining feature, the type of the last hop conforms to the type that feature points to;
 * - the level roles (R-OI-25): `potency` is an attribute the owner of the type reference owns or inherits,
 *   `featurePotency` an attribute the type of the feature container owns or inherits; with `featurePotency` the owner of
 *   the feature container conforms to the owner of the type reference (else a classifier has no type, and no feature
 *   is ever due more than one level below it); `featurePotency` together with `featureSources` is a defect until a
 *   front gives the pair a meaning.
 * Across records: a name is held once.
 *
 * `checkLevels` judges the M1 objects of a model instead, over the reader's view (R-OI-26..28): every type cycle, once,
 * as an error; with `featurePotency`, every feature whose potency is below 1 or above its classifier's potency, which is
 * never due, as a warning. Its findings are data for the caller to word and anchor.
 *
 * Defects are data and block nothing (R-VAL-4): the caller shows them.
 *
 * Pure: the imports are two types and the reader's functions.
 */

import type { MetamodelSketch } from '../simulation/profileBinder';
import type { OntoBinding } from './bindingCodec';
import { clabjectPotency, featurePotencyOf, typeChain, type OntoReadView } from './bindingReader';

export interface BindingDefect {
    /** The record's name. */
    binding: string;
    /** The role at fault, `name` for the duplicate. */
    role: string;
    message: string;
}

export interface BindingVerdict {
    ok: boolean;
    defects: BindingDefect[];
}

/** A finding of `checkLevels`; every id is an M1 id. */
export type LevelFinding =
    /** A type cycle, as the ids around it, the first one repeated at the end (R-OI-27). */
    | { kind: 'type-cycle'; severity: 'error'; cycle: string[] }
    /** A feature of `classifier` that is never due (R-OI-26): its potency is below 1 or above the classifier's. */
    | { kind: 'potency'; severity: 'warning'; classifier: string; feature: string; potency: number; classifierPotency: number };

type Sort = 'reference' | 'attribute' | 'class';

const SLOT_ROLES = ['slotContainer', 'definingFeature', 'valueHolder', 'valueKinds'] as const;

/** Defects of one record against the sketch; the name clash is `checkBindings`'s. */
export function checkBinding(binding: OntoBinding, sketch: MetamodelSketch): BindingDefect[] {
    const defects: BindingDefect[] = [];
    const defect = (role: string, message: string) => defects.push({ binding: binding.name, role, message });
    const classes = new Map(sketch.classes.map(c => [c.id, c]));
    const attributes = new Map(sketch.attributes.map(a => [a.id, a]));
    const references = new Map(sketch.references.map(r => [r.id, r]));

    const sortOf = (id: string): Sort | null => (references.has(id) ? 'reference' : attributes.has(id) ? 'attribute' : classes.has(id) ? 'class' : null);
    const expect = (role: string, id: string | undefined, ...sorts: Sort[]): void => {
        if (id === undefined) return;
        const sort = sortOf(id);
        if (sort === null) defect(role, `${id} is not in the metamodel.`);
        else if (!sorts.includes(sort)) defect(role, `${id} is a ${sort}, the role needs a ${sorts.join(' or ')}.`);
    };

    expect('typeReference', binding.typeReference, 'reference');
    expect('featureContainer', binding.featureContainer, 'reference');
    const g = binding.generalization;
    if (g) {
        const { direct, via, general } = g as { direct?: string; via?: string; general?: string };
        if (direct !== undefined) expect('generalization', direct, 'reference');
        else { expect('generalization', via, 'reference'); expect('generalization', general, 'reference'); }
    }
    expect('slotContainer', binding.slotContainer, 'reference');
    expect('definingFeature', binding.definingFeature, 'reference');
    expect('valueHolder', binding.valueHolder, 'reference', 'attribute');
    expect('abstractFlag', binding.abstractFlag, 'attribute');
    expect('featureType', binding.featureType, 'reference');
    expect('defaultValue', binding.defaultValue, 'attribute');
    expect('potency', binding.potency, 'attribute');
    expect('featurePotency', binding.featurePotency, 'attribute');
    for (const kind of binding.valueKinds ?? []) {
        expect('valueKinds', kind.create, 'class');
        expect('valueKinds', kind.field, 'reference', 'attribute');
    }

    const present = SLOT_ROLES.filter(r => binding[r] !== undefined);
    if (present.length > 0 && present.length < SLOT_ROLES.length) {
        const absent = SLOT_ROLES.filter(r => binding[r] === undefined);
        defect('slotRoles', `The slot roles come together or not at all; missing: ${absent.join(', ')}.`);
    }

    const typeRef = references.get(binding.typeReference);
    const slotContainer = binding.slotContainer !== undefined ? references.get(binding.slotContainer) : undefined;
    if (typeRef && slotContainer && typeRef.owner !== slotContainer.owner) {
        defect('slotContainer', `The type reference is owned by ${typeRef.owner} and the slot container by ${slotContainer.owner}: they must share the instance metaclass.`);
    }
    const definingFeature = binding.definingFeature !== undefined ? references.get(binding.definingFeature) : undefined;
    if (slotContainer && definingFeature && definingFeature.owner !== slotContainer.type) {
        defect('definingFeature', `The defining feature is owned by ${definingFeature.owner}, the slot metaclass is ${slotContainer.type}.`);
    }

    const conforms = (id: string, superId: string): boolean => {
        const seen = new Set<string>();
        const stack = [id];
        while (stack.length > 0) {
            const c = stack.pop() as string;
            if (c === superId) return true;
            if (seen.has(c)) continue;
            seen.add(c);
            stack.push(...(classes.get(c)?.supers ?? []));
        }
        return false;
    };
    (binding.featureSources ?? []).forEach(({ path }, i) => {
        const at = `featureSources[${i}]`;
        const hops = path.map((id, j) => {
            const sort = sortOf(id);
            if (sort === null) defect('featureSources', `${at}.path[${j}]: ${id} is not in the metamodel.`);
            else if (sort !== 'reference') defect('featureSources', `${at}.path[${j}]: ${id} is a ${sort}, a path needs references.`);
            return references.get(id);
        });
        for (let j = 0; j + 1 < hops.length; j++) {
            const hop = hops[j], nextHop = hops[j + 1];
            if (hop && nextHop && !conforms(hop.type, nextHop.owner)) {
                defect('featureSources', `${at}.path[${j + 1}]: ${nextHop.id} is owned by ${nextHop.owner}, which ${hop.type} (the type of ${hop.id}) neither is nor inherits.`);
            }
        }
        const lastHop = hops[hops.length - 1];
        if (lastHop && definingFeature && !conforms(lastHop.type, definingFeature.type)) {
            defect('featureSources', `${at}.path[${hops.length - 1}]: ${lastHop.id} holds ${lastHop.type}, the defining feature points to ${definingFeature.type}.`);
        }
    });

    const potency = binding.potency !== undefined ? attributes.get(binding.potency) : undefined;
    if (potency && typeRef && !conforms(typeRef.owner, potency.owner)) {
        defect('potency', `${potency.id} is owned by ${potency.owner}, which ${typeRef.owner} (the owner of the type reference) neither is nor inherits.`);
    }
    const featureContainer = binding.featureContainer !== undefined ? references.get(binding.featureContainer) : undefined;
    const featurePotency = binding.featurePotency !== undefined ? attributes.get(binding.featurePotency) : undefined;
    if (featurePotency && featureContainer && !conforms(featureContainer.type, featurePotency.owner)) {
        defect('featurePotency', `${featurePotency.id} is owned by ${featurePotency.owner}, which ${featureContainer.type} (the type of the feature container) neither is nor inherits.`);
    }
    if (binding.featurePotency !== undefined && featureContainer && typeRef && !conforms(featureContainer.owner, typeRef.owner)) {
        defect('featurePotency', `The feature container is owned by ${featureContainer.owner}, which is no ${typeRef.owner} (the owner of the type reference): a classifier has no type, so no feature is due more than one level below it.`);
    }
    if (binding.featurePotency !== undefined && binding.featureSources !== undefined) {
        defect('featurePotency', 'A feature potency and feature sources together have no meaning yet: one of the two goes.');
    }
    return defects;
}

/** The level findings on the M1 objects `objectIds` under `binding`: see the module comment. */
export function checkLevels(view: OntoReadView, binding: OntoBinding, objectIds: readonly string[]): LevelFinding[] {
    const findings: LevelFinding[] = [];
    const seenCycles = new Set<string>();
    for (const id of objectIds) {
        const { cycle } = typeChain(view, binding, id);
        if (cycle === null) continue;
        const key = [...new Set(cycle)].sort().join('\u0000');
        if (seenCycles.has(key)) continue;
        seenCycles.add(key);
        findings.push({ kind: 'type-cycle', severity: 'error', cycle });
    }
    if (binding.featurePotency === undefined || binding.featureContainer === undefined) return findings;
    for (const classifier of objectIds) {
        const features = view.referenceTargets(classifier, binding.featureContainer);
        if (features.length === 0) continue;
        const classifierPotency = clabjectPotency(view, binding, classifier);
        for (const feature of features) {
            const potency = featurePotencyOf(view, binding, feature);
            if (potency < 1 || potency > classifierPotency) findings.push({ kind: 'potency', severity: 'warning', classifier, feature, potency, classifierPotency });
        }
    }
    return findings;
}

/** The verdict on a list of records: each one's defects, then a defect for every name held more than once. */
export function checkBindings(bindings: readonly OntoBinding[], sketch: MetamodelSketch): BindingVerdict {
    const defects = bindings.flatMap(b => checkBinding(b, sketch));
    const seen = new Set<string>();
    for (const b of bindings) {
        if (seen.has(b.name)) defects.push({ binding: b.name, role: 'name', message: `The name ${b.name} is held by an earlier record.` });
        seen.add(b.name);
    }
    return { ok: defects.length === 0, defects };
}
