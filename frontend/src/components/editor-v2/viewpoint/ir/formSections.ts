/**
 * formSections - partition the fields of a form into sections.
 *
 * R-FRM-1 (spec addendum 2026-08-28, section 7): compartments ORDER and TITLE the form, they do
 * not filter it. A view declaring a single `attributes` compartment used to make every reference
 * and every containment child vanish from the form, with nothing on screen to say so. The only
 * gesture that removes a field is `FormSpec.features[name] === 'hidden'`, and it must stay the
 * only one: compartments were designed for the SYMBOL on the canvas, where space is finite and
 * filtering is the point, while a form is the surface where everything gets edited. Using one
 * construct for both gives two mechanisms for one job, with the worse outcome of the two - data
 * that does not appear without anyone having asked.
 *
 * A module of its own rather than a helper inside IRForm, for the reason `formDiagnostics` and
 * `slotValues` are: IRForm imports the framework barrel, which pulls Monaco, which touches
 * `window` at import time, so a node-environment test cannot load it. Here the input is plain
 * data and the partition is testable directly.
 */

import type { CompiledFieldCompartment } from './irTypes';
import type { FormFieldDescriptor } from './useFormWidgets';

/**
 * A section of the form, with the fields that belong to it.
 *
 * Generic over the field type since Slice 2a, with the form's own descriptor as the default,
 * so `Section` alone still means what it meant. The authoring surface partitions rows derived
 * from the METACLASS, which have no slot behind them and therefore cannot be
 * `FormFieldDescriptor`s: the two callers must nonetheless get the same order and the same
 * titles, or the panel would describe a layout the form does not produce.
 */
export interface Section<F = FormFieldDescriptor> {
    key: string;
    title: string;
    fields: F[];
}

/** What `buildFormSections` reads off a compartment, and the whole of it. */
export type SectionCompartment = Pick<CompiledFieldCompartment, 'id' | 'source' | 'title'>;

/** What `buildFormSections` reads off a field, and the whole of it. */
export type SectionField = Pick<FormFieldDescriptor, 'isReference' | 'isComposition'>;

/** The three natural groups a `source` can claim, in the order the tail renders them. */
const GROUPS = ['attributes', 'references', 'children'] as const;
type Group = typeof GROUPS[number];

const GROUP_TITLE: Record<Group, string> = {
    attributes: 'Attributes',
    references: 'References',
    children: 'Children',
};

/** Section heading: the authored title, else the compartment id made presentable. */
function sectionTitle(c: Pick<CompiledFieldCompartment, 'id' | 'title'>): string {
    if (c.title) return c.title;
    const id = c.id ?? '';
    return id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Fields';
}

/**
 * Sections of a form, in render order.
 *
 * `fields` arrives already filtered by `hidden` and by the Basic/Advanced mode: this function
 * knows nothing about either, it only decides where what it is given goes.
 *
 * Empty sections are RETURNED, not dropped. The caller filters them (`fields.length > 0`), which
 * keeps this testable as a partition rather than as a partition plus a display rule.
 *
 * A `children` compartment takes the subject's own composition features, read from its slots.
 * That is not the same set the canvas row-dispatch renders, which resolves the child OBJECTS and
 * gives each its own row view; the two converge on the same children from opposite ends, and the
 * form reads the owning slots because that is where multiplicity and requiredness live.
 */
export function buildFormSections<F extends SectionField>(
    fields: F[],
    compartments: SectionCompartment[],
): Section<F>[] {
    const byGroup: Record<Group, F[]> = {
        attributes: fields.filter(f => !f.isReference && !f.isComposition),
        references: fields.filter(f => f.isReference),
        children: fields.filter(f => f.isComposition),
    };

    // No compartments: the three natural groups, with the keys they have always had. Those keys
    // are what the collapse state is persisted under (`jjodel.formPrefs.<viewId>.collapsed`), so
    // changing one would silently unfold a section the user had folded.
    if (compartments.length === 0) {
        return GROUPS.map(g => ({ key: g, title: GROUP_TITLE[g], fields: byGroup[g] }));
    }

    const authored: Section<F>[] = compartments.map((c, i) => ({
        key: `${c.id}-${i}`,
        title: sectionTitle(c),
        fields: byGroup[(c.source as Group)] ?? [],
    }));

    // What no compartment claims. A `source` claims a WHOLE group, so what is left out are whole
    // groups and never single features; two compartments on the same source claim it once.
    //
    // Deliberately NOT deduplicated on the authored side: a group declared by two compartments
    // renders twice, today and after this change, because that is the view author's doing. The
    // set below only decides what is missing.
    const claimed = new Set<string>(compartments.map(c => c.source));
    const tail: Section<F>[] = GROUPS
        .filter(g => !claimed.has(g))
        // `residual-` cannot collide with an authored key, which always ends in `-<index>`.
        .map(g => ({ key: `residual-${g}`, title: GROUP_TITLE[g], fields: byGroup[g] }));

    return [...authored, ...tail];
}
