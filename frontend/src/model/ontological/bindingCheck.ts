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
 *   and, when the record has a defining feature, the type of the last hop conforms to the type that feature points to.
 * Across records: a name is held once.
 *
 * Defects are data and block nothing (R-VAL-4): the caller shows them.
 *
 * Pure: the only import is a type.
 */

import type { MetamodelSketch } from '../simulation/profileBinder';
import type { OntoBinding } from './bindingCodec';

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
    return defects;
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
