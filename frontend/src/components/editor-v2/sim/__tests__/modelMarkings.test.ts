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
import { boundEstimate, boundEstimateSignature, largestInitialMarking } from '../modelMarkings';

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

// ---------------------------------------------------------------------------
// The Bound from the reachable markings (G12(b), R-SIM-81(1) as amended 2026-09-27, P-2026-09-27-1611)
// ---------------------------------------------------------------------------

/** The Petri bag as Apply leaves it on the demo metamodel (script §2.2), the Bound aside. */
const BAG: Record<string, string> = {
    simNode: 'C_Place', simTransition: 'C_Trans', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
    simArcWeight: 'A_weight', simInhibitorArc: 'C_Inhibitor', simInitialMarking: 'A_tokens', simProfile: 'petri',
};

/** An object of `model` with the slots given, by feature pointer. */
function object(lookup: Lookup, id: string, cls: string, model: string, slots: Record<string, unknown[]> = {}): void {
    const features = Object.keys(slots).map(f => `${id}_${f}`);
    lookup[id] = { className: 'DObject', id, instanceof: cls, father: model, features };
    for (const [f, values] of Object.entries(slots)) lookup[`${id}_${f}`] = { className: 'DValue', id: `${id}_${f}`, instanceof: f, father: id, values };
}

/** The demo net of the script §2.2 as model `model`: `p1` 2, `lock` 1, `t1` → `p2` ×2, `p2` ×2 → `t2` → `p3`, `lock` inhibits `t2`. */
function demoNet(lookup: Lookup, model: string, prefix = ''): void {
    const id = (x: string) => `${prefix}${x}`;
    object(lookup, id('p1'), 'C_Place', model, { A_tokens: [2] });
    object(lookup, id('p2'), 'C_Place', model);
    object(lookup, id('p3'), 'C_Place', model);
    object(lookup, id('lock'), 'C_Place', model, { A_tokens: [1] });
    for (const t of ['t1', 't2', 't3']) object(lookup, id(t), 'C_Trans', model);
    const arcs: Array<[string, string, string, number?, string?]> = [
        ['a1', 'p1', 't1'], ['a2', 't1', 'p2', 2], ['a3', 'p2', 't2', 2], ['a4', 't2', 'p3'], ['a5', 'lock', 't3'],
        ['i1', 'lock', 't2', undefined, 'C_Inhibitor'],
    ];
    for (const [a, s, t, w, cls] of arcs) {
        object(lookup, id(a), cls ?? 'C_Arc', model, { R_src: [id(s)], R_tgt: [id(t)], ...(w !== undefined ? { A_weight: [w] } : {}) });
    }
}

function petriFixture(): Lookup {
    const lookup = fixture();
    lookup.C_Arc = { className: 'DClass', id: 'C_Arc', extends: [] };
    lookup.C_Inhibitor = { className: 'DClass', id: 'C_Inhibitor', extends: ['C_Arc'] };
    // M1a holds the demo net only; M1b is emptied of the fixture's place.
    for (const id of ['p1', 'p1_v', 'p2', 'p2_v', 'p3', 'p3_v', 'p4']) delete lookup[id];
    demoNet(lookup, 'M1a');
    return lookup;
}

describe('boundEstimate: the exploration over the models of the metamodel', () => {
    it('the demo net: 4 from the reachable markings, closed, beside the largest initial marking 2', () => {
        // 9 markings of M1a, and the one empty marking of M1b, a model with no object
        expect(boundEstimate(petriFixture(), 'MM', BAG)).toEqual({
            largestInitial: 2, exploration: { max: 4, end: 'closed', markings: 10 },
        });
    });

    it('compiles with the bound lifted: an unset Bound (k = 1) does not drop a marking of 3 (killed by compiling at the bag\'s k)', () => {
        const lookup = petriFixture();
        lookup.p1_A_tokens.values = [3];
        const e = boundEstimate(lookup, 'MM', BAG);
        expect(e.largestInitial).toBe(3);
        expect(e.exploration).toMatchObject({ end: 'closed', max: 6 });
    });

    it('the largest over every model, and a model of another metamodel is not explored (killed by exploring the first model only)', () => {
        const lookup = petriFixture();
        demoNet(lookup, 'M1b', 'b_');
        lookup.b_p1_A_tokens.values = [4];
        expect(boundEstimate(lookup, 'MM', BAG)).toEqual({
            // 9 markings of M1a, and 20 of M1b: 5 with `lock` marked, 1 + 2 + 3 + 4 + 5 without
            largestInitial: 4, exploration: { max: 8, end: 'closed', markings: 29 },
        });
        // control: a bigger net in a model of another metamodel changes nothing
        const other = petriFixture();
        demoNet(other, 'M1x', 'x_');
        other.x_p1_A_tokens.values = [9];
        expect(boundEstimate(other, 'MM', BAG).exploration).toMatchObject({ max: 4, markings: 10 });
    });

    it('one model that does not close ends the estimate with its reason; the cap is shared by the models (killed by a cap per model)', () => {
        const lookup = petriFixture();
        object(lookup, 'loop', 'C_Place', 'M1b', { A_tokens: [1] });
        object(lookup, 'tl', 'C_Trans', 'M1b');
        object(lookup, 'la', 'C_Arc', 'M1b', { R_src: ['loop'], R_tgt: ['tl'] });
        object(lookup, 'lb', 'C_Arc', 'M1b', { R_src: ['tl'], R_tgt: ['loop'], A_weight: [2] });
        expect(boundEstimate(lookup, 'MM', BAG).exploration).toMatchObject({ end: 'unbounded' });
        // the cap: 9 markings of M1a and one of a second demo net exceed 9
        const two = petriFixture();
        demoNet(two, 'M1b', 'b_');
        expect(boundEstimate(two, 'MM', BAG, 9).exploration).toMatchObject({ end: 'cap' });
        // what is left of the cap goes to the next model: 9 of M1a, then 3 of M1b
        expect(boundEstimate(two, 'MM', BAG, 12).exploration).toMatchObject({ end: 'cap', markings: 12 });
        expect(boundEstimate(two, 'MM', BAG, 18).exploration).toMatchObject({ end: 'closed', markings: 18 });
    });

    it('a bag that makes no net has no exploration, and the largest initial marking is still read', () => {
        const noArcTarget = { ...BAG };
        delete noArcTarget.simArcTarget;
        expect(boundEstimate(petriFixture(), 'MM', noArcTarget)).toEqual({ largestInitial: 2, exploration: null });
        // no Place role: nothing to read either way
        const noNode = { ...BAG };
        delete noNode.simNode;
        expect(boundEstimate(petriFixture(), 'MM', noNode)).toEqual({ largestInitial: null, exploration: null });
    });
});

describe('boundEstimateSignature: what the estimate reads, for the panel\'s memo', () => {
    it('changes with a marking or an arc weight of a model of the metamodel (killed by leaving the slots out)', () => {
        const lookup = petriFixture();
        const before = boundEstimateSignature(lookup, 'MM');
        expect(before).not.toBe('');
        lookup.p1_A_tokens.values = [3];
        const marking = boundEstimateSignature(lookup, 'MM');
        expect(marking).not.toBe(before);
        lookup.a2_A_weight.values = [5];
        expect(boundEstimateSignature(lookup, 'MM')).not.toBe(marking);
    });

    it('stays equal on an edit of a model of another metamodel, and is empty with no model', () => {
        const lookup = petriFixture();
        demoNet(lookup, 'M1x', 'x_');
        const before = boundEstimateSignature(lookup, 'MM');
        lookup.x_p1_A_tokens.values = [9];
        expect(boundEstimateSignature(lookup, 'MM')).toBe(before);
        expect(boundEstimateSignature(lookup, 'NOPE')).toBe('');
    });
});
