/**
 * modelMarkings — the initial markings on the M1 models of a metamodel, read
 * from the raw lookup (R-SIM-81, G2, P-2026-09-27-1110).
 *
 * A fake lookup with the D-layer fields the reader walks: `className`, `id` and
 * `instanceof` on a model, `father`, `instanceof` and `features` on an object,
 * `instanceof` and `values` on a slot, `extends` on a class. Two models of the
 * metamodel, one of another. Each test name says which break of the rule kills
 * it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { largestInitialMarking } from '../modelMarkings';

type Lookup = Record<string, any>;

/** An object of `model` (or of the object `father`) with one slot of `A_tokens`, unless `tokens` is undefined. */
function place(lookup: Lookup, id: string, cls: string, father: string, tokens?: unknown): void {
    const features = tokens === undefined ? [] : [`${id}_v`];
    lookup[id] = { className: 'DObject', id, instanceof: cls, father, features };
    if (tokens !== undefined) lookup[`${id}_v`] = { className: 'DValue', id: `${id}_v`, instanceof: 'A_tokens', father: id, values: [tokens] };
}

function fixture(): Lookup {
    const lookup: Lookup = {
        MM: { className: 'DModel', id: 'MM', name: 'Petri' },
        OTHER: { className: 'DModel', id: 'OTHER', name: 'Other' },
        C_PNode: { className: 'DClass', id: 'C_PNode', abstract: true, extends: [] },
        C_Place: { className: 'DClass', id: 'C_Place', extends: ['C_PNode'] },
        C_BigPlace: { className: 'DClass', id: 'C_BigPlace', extends: ['C_Place'] },
        C_Trans: { className: 'DClass', id: 'C_Trans', extends: ['C_PNode'] },
        A_tokens: { className: 'DAttribute', id: 'A_tokens', name: 'tokens' },
        M1a: { className: 'DModel', id: 'M1a', instanceof: 'MM' },
        M1b: { className: 'DModel', id: 'M1b', instanceof: 'MM' },
        M1x: { className: 'DModel', id: 'M1x', instanceof: 'OTHER' },
    };
    place(lookup, 'p1', 'C_Place', 'M1a', 2);
    place(lookup, 'p2', 'C_Place', 'M1b', 3);
    place(lookup, 'p3', 'C_Place', 'M1a', 1);
    place(lookup, 'p4', 'C_Place', 'M1a');
    return lookup;
}

describe('largestInitialMarking', () => {
    it('the largest marking over the two models of the metamodel: 2 and 3 give 3 (killed by reading the first model only)', () => {
        expect(largestInitialMarking(fixture(), 'MM', 'C_Place', 'A_tokens')).toBe(3);
        // control: without the second model the largest is the first model's
        const one = fixture();
        delete one.M1b;
        expect(largestInitialMarking(one, 'MM', 'C_Place', 'A_tokens')).toBe(2);
    });

    it('a model of another metamodel is not read (killed by dropping the instanceof test)', () => {
        const lookup = fixture();
        place(lookup, 'px', 'C_Place', 'M1x', 9);
        expect(largestInitialMarking(lookup, 'MM', 'C_Place', 'A_tokens')).toBe(3);
    });

    it('a subclass instance is a place, and an object nested under a place counts for its model (the engine\'s kind and walk)', () => {
        const lookup = fixture();
        place(lookup, 'big', 'C_BigPlace', 'M1a', 5);
        expect(largestInitialMarking(lookup, 'MM', 'C_Place', 'A_tokens')).toBe(5);
        const nested = fixture();
        place(nested, 'inner', 'C_Place', 'p1_v', 6);
        expect(largestInitialMarking(nested, 'MM', 'C_Place', 'A_tokens')).toBe(6);
    });

    it('only instances of the place class: a transition with the same slot is not read (killed by dropping the kind test)', () => {
        const lookup = fixture();
        place(lookup, 't1', 'C_Trans', 'M1a', 7);
        expect(largestInitialMarking(lookup, 'MM', 'C_Place', 'A_tokens')).toBe(3);
    });

    it('a value the engine refuses whatever the bound is skipped: a string, a fraction, a negative number', () => {
        const lookup = fixture();
        place(lookup, 's', 'C_Place', 'M1a', '8');
        place(lookup, 'f', 'C_Place', 'M1a', 4.5);
        place(lookup, 'n', 'C_Place', 'M1a', -6);
        expect(largestInitialMarking(lookup, 'MM', 'C_Place', 'A_tokens')).toBe(3);
    });

    it('all markings at or below 1 give 1; no model, no place or no value give null', () => {
        const low = fixture();
        low.p1_v.values = [1];
        low.p2_v.values = [0];
        expect(largestInitialMarking(low, 'MM', 'C_Place', 'A_tokens')).toBe(1);
        expect(largestInitialMarking(fixture(), 'NOPE', 'C_Place', 'A_tokens')).toBeNull();
        expect(largestInitialMarking(fixture(), 'MM', 'C_None', 'A_tokens')).toBeNull();
        expect(largestInitialMarking(fixture(), 'MM', 'C_Place', 'A_other')).toBeNull();
        expect(largestInitialMarking({}, 'MM', 'C_Place', 'A_tokens')).toBeNull();
    });
});
