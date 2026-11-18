/**
 * classRail — what a viewpoint at the `class` level offers to create, read from the binding (R-OI-21), and where a
 * created element goes (R-OI-22). P-2026-11-08-1753, discovery 2026-11-08 §4.
 *
 * - `classRailGroups`: from the `object` record. The classifiers are the concrete conformers of the target of its
 *   `typeReference`; those conforming to the owner of the `link` record's `featureContainer` are the associations, listed
 *   apart because an association is drawn between two classes. The properties are the concrete conformers of the target
 *   of `featureContainer`, the generalizations of the target of `generalization.via`. A group with no item is left out,
 *   so a metamodel with no generalization has no such group.
 * - `containerFor`: the composition reference that accepts the metaclass and whose owner has one instance in the model.
 *   Anything else, no such reference, an owner with none or with several instances, two references that both qualify, is
 *   no container: the element goes to the model root, and the rule never guesses.
 *
 * Pure: a sketch of the metamodel, the records, a list of objects.
 */

import type { MetamodelSketch, SketchClass, SketchReference } from '../simulation/profileBinder';
import type { OntoBinding } from './bindingCodec';

export type ClassRailKind = 'classifier' | 'association' | 'property' | 'generalization';

export interface ClassRailItem {
    /** The M2 class the item creates. */
    metaclass: string;
    name: string;
}

export interface ClassRailGroup {
    kind: ClassRailKind;
    items: ClassRailItem[];
}

/** Why an item takes no click: drawn on the canvas, or waiting for a selected class. */
export const CLASS_RAIL_HINTS = {
    association: 'An association is drawn between two classes',
    generalization: 'A generalization is drawn between two classes',
    property: 'Select a class to add an attribute',
} as const;

/** An object of the model and its M2 class. */
export interface ModelObjectRef {
    id: string;
    metaclass: string;
}

export interface ContainerSlot {
    /** The composition reference. */
    reference: SketchReference;
    /** The sole instance of its owner. */
    owner: string;
}

/** True when the M2 class `metaclassId` is `superId` or has it as an ancestor, over every `extends`. */
export function conformsIn(sketch: MetamodelSketch, metaclassId: string, superId: string): boolean {
    const seen = new Set<string>();
    const stack = [metaclassId];
    while (stack.length > 0) {
        const c = stack.pop()!;
        if (c === superId) return true;
        if (seen.has(c)) continue;
        seen.add(c);
        const cls = sketch.classes.find(k => k.id === c);
        if (cls) stack.push(...cls.supers);
    }
    return false;
}

const byName = (a: SketchClass, b: SketchClass): number => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/** The concrete classes conforming to `superId`, by name; none for an unset one. */
function concreteConformers(sketch: MetamodelSketch, superId: string | undefined): SketchClass[] {
    if (!superId) return [];
    return sketch.classes.filter(c => !c.abstract && conformsIn(sketch, c.id, superId)).sort(byName);
}

const referenceOf = (sketch: MetamodelSketch, id: unknown): SketchReference | undefined =>
    typeof id === 'string' ? sketch.references.find(r => r.id === id) : undefined;

const toItem = (c: SketchClass): ClassRailItem => ({ metaclass: c.id, name: c.name });

/** The groups of the class rail and pane menu; none when the `object` record's type reference does not resolve. */
export function classRailGroups(sketch: MetamodelSketch, object: OntoBinding, link: OntoBinding | null): ClassRailGroup[] {
    const typeReference = referenceOf(sketch, object.typeReference);
    if (!typeReference) return [];
    const associationOwner = referenceOf(sketch, link?.featureContainer)?.owner;
    const isAssociation = (c: SketchClass): boolean => associationOwner !== undefined && conformsIn(sketch, c.id, associationOwner);
    const classifiers = concreteConformers(sketch, typeReference.type);
    const generalization = object.generalization as { via?: unknown } | undefined;
    const groups: ClassRailGroup[] = [
        { kind: 'classifier', items: classifiers.filter(c => !isAssociation(c)).map(toItem) },
        { kind: 'association', items: classifiers.filter(isAssociation).map(toItem) },
        { kind: 'property', items: concreteConformers(sketch, referenceOf(sketch, object.featureContainer)?.type).map(toItem) },
        { kind: 'generalization', items: concreteConformers(sketch, referenceOf(sketch, generalization?.via)?.type).map(toItem) },
    ];
    return groups.filter(g => g.items.length > 0);
}

/** Where an element of `metaclassId` goes: see the module comment. `null` is the model root. */
export function containerFor(sketch: MetamodelSketch, metaclassId: string, objects: readonly ModelObjectRef[]): ContainerSlot | null {
    const slots: ContainerSlot[] = [];
    for (const reference of sketch.references) {
        if (!reference.composition || !conformsIn(sketch, metaclassId, reference.type)) continue;
        const owners = objects.filter(o => conformsIn(sketch, o.metaclass, reference.owner));
        if (owners.length === 1) slots.push({ reference, owner: owners[0].id });
    }
    return slots.length === 1 ? slots[0] : null;
}
