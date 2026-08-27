/**
 * Unit tests for the section partition of a form (R-FRM-1).
 *
 * Pure: plain objects shaped like the two inputs, no store, no React, no framework barrel.
 * The case that matters is the second one - a single `attributes` compartment used to make
 * every reference and every child disappear from the form, and that is the regression the
 * ratification closes.
 *
 * The partition is checked including EMPTY sections: `buildFormSections` returns them and the
 * caller drops them, so testing here means testing where things go, not what ends up drawn.
 */
import { describe, it, expect } from 'vitest';
import { buildFormSections, type Section } from '../formSections';
import type { CompiledFieldCompartment } from '../irTypes';
import type { FormFieldDescriptor } from '../useFormWidgets';

// --- fixtures ----------------------------------------------------------------

/** Only the three fields the partition reads. */
const attr = (name: string) => ({ name, isReference: false, isComposition: false } as FormFieldDescriptor);
const ref = (name: string) => ({ name, isReference: true, isComposition: false } as FormFieldDescriptor);
const child = (name: string) => ({ name, isReference: false, isComposition: true } as FormFieldDescriptor);

const comp = (id: string, source: 'attributes' | 'references' | 'children', title?: string) =>
    ({ id, source, title } as CompiledFieldCompartment);

/** The Statechart State of the handoff, reduced to what this function looks at. */
const FIELDS: FormFieldDescriptor[] = [
    attr('name'), attr('kind'), attr('timeout'),
    ref('outgoing'),
    child('substates'),
];

const names = (s: Section | undefined) => (s?.fields ?? []).map(f => f.name);

// --- cases -------------------------------------------------------------------

describe('buildFormSections', () => {
    it('with no compartments returns the three natural groups, in order and with the old keys', () => {
        // The keys are what the collapse state is persisted under, so they are part of the
        // contract and not an implementation detail.
        const out = buildFormSections(FIELDS, []);
        expect(out.map(s => s.key)).toEqual(['attributes', 'references', 'children']);
        expect(out.map(s => s.title)).toEqual(['Attributes', 'References', 'Children']);
        expect(names(out[0])).toEqual(['name', 'kind', 'timeout']);
        expect(names(out[1])).toEqual(['outgoing']);
        expect(names(out[2])).toEqual(['substates']);
    });

    it('keeps the unclaimed groups in a tail instead of dropping them', () => {
        // THE regression of R-FRM-1: before this, a lone `attributes` compartment left
        // `outgoing` and `substates` nowhere, with nothing on screen to say so.
        const out = buildFormSections(FIELDS, [comp('identity', 'attributes', 'Identity')]);
        expect(out.map(s => s.key)).toEqual(['identity-0', 'residual-references', 'residual-children']);
        expect(out.map(s => s.title)).toEqual(['Identity', 'References', 'Children']);
        // The tail carries the FIELDS, not just the headings.
        expect(names(out[1])).toEqual(['outgoing']);
        expect(names(out[2])).toEqual(['substates']);
    });

    it('adds no tail when the compartments claim all three groups', () => {
        const out = buildFormSections(FIELDS, [
            comp('a', 'attributes'), comp('r', 'references'), comp('c', 'children'),
        ]);
        expect(out.map(s => s.key)).toEqual(['a-0', 'r-1', 'c-2']);
        expect(out.some(s => s.key.startsWith('residual-'))).toBe(false);
    });

    it('two compartments on one source render twice and claim it once', () => {
        // The duplication on the authored side is the view author's doing and is preserved;
        // deduplication only decides what is missing.
        const out = buildFormSections(FIELDS, [comp('a1', 'attributes'), comp('a2', 'attributes')]);
        expect(out.map(s => s.key)).toEqual(['a1-0', 'a2-1', 'residual-references', 'residual-children']);
        expect(names(out[0])).toEqual(['name', 'kind', 'timeout']);
        expect(names(out[1])).toEqual(['name', 'kind', 'timeout']);
        expect(out.filter(s => s.key === 'residual-attributes')).toHaveLength(0);
    });

    it('uses the authored title, and the capitalized id when there is none', () => {
        const out = buildFormSections(FIELDS, [comp('behavior', 'attributes')]);
        expect(out[0].title).toBe('Behavior');
        const titled = buildFormSections(FIELDS, [comp('behavior', 'attributes', 'Behaviour')]);
        expect(titled[0].title).toBe('Behaviour');
    });

    it('renders the tail in the natural order, whatever the compartment claimed', () => {
        const out = buildFormSections(FIELDS, [comp('nested', 'children')]);
        expect(out.map(s => s.key)).toEqual(['nested-0', 'residual-attributes', 'residual-references']);
    });

    // --- edges the six cases do not cover ------------------------------------

    it('returns empty sections rather than dropping them: the caller filters', () => {
        const out = buildFormSections([attr('name')], []);
        expect(out).toHaveLength(3);
        expect(names(out[1])).toEqual([]);
        expect(names(out[2])).toEqual([]);
    });

    it('a residual key can never collide with an authored one', () => {
        // Authored keys always end in `-<index>`; `residual-` is a prefix no id can produce
        // through that template.
        const out = buildFormSections(FIELDS, [comp('residual', 'attributes')]);
        expect(out.map(s => s.key)).toEqual(['residual-0', 'residual-references', 'residual-children']);
        expect(new Set(out.map(s => s.key)).size).toBe(out.length);
    });
});
