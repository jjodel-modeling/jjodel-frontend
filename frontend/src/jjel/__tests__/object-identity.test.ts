import { describe, it, expect } from 'vitest';
import { jjelEval } from '../index';

/**
 * Equality of model objects is identity of the underlying object (P-2026-11-17-2219).
 *
 * One model object reaches an expression under several JavaScript objects: the
 * pool handle of `buildEvalContext` (shared by `instances`, reference slots and
 * `parent`), the wider record `wrapSelectedElement` builds for `self`/`data`,
 * and, in JjTL, the source object, its view and the `{ __ref: id }` handle of a
 * reference value. `==` decided by JavaScript reference first and by a key by
 * key comparison second, so `self.parent.father == self` was false on the
 * selected father: `self` is never the pool handle.
 *
 * The records below have the shapes those builders produce; measured on the
 * gallery project «Families and Persons» in
 * docs/discovery/discovery_2026-11-17_jjel_object_equality.md.
 */

/** A pool handle, as `shallowObjectToJjelValue` + `fillInstanceSlots` build it. */
function handle(id: string, firstName: string): any {
    return { id, __type: 'Object', name: 'Member', instanceOf: null, instanceof: null, firstName };
}

/** The record of `wrapSelectedElement`: other keys, another object, the same id. */
function selected(h: any): any {
    return {
        __isProxy: true, __type: 'Object', id: h.id, name: h.name, father: 'Pointer_slot', features: ['Pointer_v1'],
        isRoot: false, firstName: h.firstName, instanceOf: null, instanceof: null, parent: h.parent,
    };
}

function families() {
    const jim = handle('Pointer1_USER_37', 'Jim');
    const cindy = handle('Pointer1_USER_38', 'Cindy');
    const brandon = handle('Pointer1_USER_39', 'Brandon');
    const brenda = handle('Pointer1_USER_40', 'Brenda');
    const march: any = {
        id: 'Pointer1_USER_30', __type: 'Object', name: 'Family', lastName: 'March',
        father: jim, mother: cindy, sons: [brandon], daughters: [brenda], parent: null,
    };
    for (const m of [jim, cindy, brandon, brenda]) m.parent = march;
    return { jim, cindy, brandon, brenda, march, members: [jim, cindy, brandon, brenda] };
}

describe('== and != between model objects', () => {
    it('the selected element equals the handle a navigation reaches', () => {
        const f = families();
        const ctx = { self: selected(f.jim) };
        expect(jjelEval('self.parent.father.id == self.id', ctx)).toBe(true);
        expect(jjelEval('self.parent.father == self', ctx)).toBe(true);
        expect(jjelEval('self == self.parent.father', ctx)).toBe(true);
        expect(jjelEval('self.parent.father != self', ctx)).toBe(false);
    });

    it('two different objects are different, whatever their features hold', () => {
        const f = families();
        const twin = handle('Pointer1_USER_99', 'Jim');
        twin.parent = f.march;
        expect(jjelEval('self.parent.mother == self', { self: selected(f.jim) })).toBe(false);
        expect(jjelEval('self.parent.mother != self', { self: selected(f.jim) })).toBe(true);
        // Same class, same feature values, another id.
        expect(jjelEval('a == b', { a: f.jim, b: twin })).toBe(false);
        expect(jjelEval('a != b', { a: f.jim, b: twin })).toBe(true);
    });

    it('a model object is never equal to null, a primitive or a record', () => {
        const f = families();
        const ctx = { self: selected(f.jim), jim: f.jim };
        expect(jjelEval('self == null', ctx)).toBe(false);
        expect(jjelEval('self != null', ctx)).toBe(true);
        expect(jjelEval('self.parent.parent == null', ctx)).toBe(true);
        expect(jjelEval('self == "Pointer1_USER_37"', ctx)).toBe(false);
        expect(jjelEval('jim == { id: "Pointer1_USER_37" }', ctx)).toBe(false);
    });

    it('holds inside a quantifier and across a containment cycle', () => {
        const f = families();
        const ctx = { self: selected(f.brenda), members: f.members };
        expect(jjelEval('(forall m in members such that m == self : m.firstName)', ctx)).toEqual(['Brenda']);
        expect(jjelEval(
            '(forall m in members such that m.parent.mother == m or m.parent.daughters.contains(m) : m.firstName)', ctx,
        )).toEqual(['Cindy', 'Brenda']);
        // march.father.parent is march: no walk of the cycle, no stack overflow.
        expect(jjelEval('self.parent == self.parent.father.parent', ctx)).toBe(true);
    });

    it('a JjTL reference handle equals the source object it names', () => {
        const source = { id: 'M1', name: 'm1', className: 'Member', __type: 'Member', firstName: 'Jim' };
        const ref = { __ref: 'M1' };
        expect(jjelEval('a == b', { a: ref, b: source })).toBe(true);
        expect(jjelEval('a == b', { a: source, b: ref })).toBe(true);
        expect(jjelEval('a == b', { a: { __ref: 'M2' }, b: source })).toBe(false);
        expect(jjelEval('a == b', { a: ref, b: { __ref: 'M1' } })).toBe(true);
    });
});

describe('what does not change', () => {
    it('records and arrays still compare by content', () => {
        expect(jjelEval('{ a: 1, b: [1, 2] } == { a: 1, b: [1, 2] }', {})).toBe(true);
        expect(jjelEval('{ a: 1 } == { a: 2 }', {})).toBe(false);
        // A record with an `id` key is a record: no marker of a model object.
        expect(jjelEval('{ id: "x", n: 1 } == { id: "x", n: 2 }', {})).toBe(false);
        expect(jjelEval('{ id: "x", n: 1 } == { id: "x", n: 1 }', {})).toBe(true);
        expect(jjelEval('[1, "a", null] == [1, "a", null]', {})).toBe(true);
    });

    it('primitives and null compare as before', () => {
        expect(jjelEval('1 == 1', {})).toBe(true);
        expect(jjelEval('"1" == 1', {})).toBe(false);
        expect(jjelEval('null == null', {})).toBe(true);
        expect(jjelEval('x == null', { x: 0 })).toBe(false);
    });

    it('an object a JjTL rule is building has no identity yet: two of them compare by content', () => {
        // A target class may declare an attribute `id`: it is a value, not the object's identity.
        const t1 = { __type: 'Person', className: 'Person', __sourceId: 'M1', __createdBy: 'JjTL', id: 'k', fullName: 'A' };
        const t2 = { __type: 'Person', className: 'Person', __sourceId: 'M2', __createdBy: 'JjTL', id: 'k', fullName: 'B' };
        expect(jjelEval('a == b', { a: t1, b: t2 })).toBe(false);
        expect(jjelEval('a == a', { a: t1 })).toBe(true);
    });

    it('arrays of model objects compare element by element, by identity', () => {
        const f = families();
        const ctx = { self: selected(f.brandon), jim: f.jim, march: f.march };
        expect(jjelEval('[self] == march.sons', ctx)).toBe(true);
        expect(jjelEval('[jim] == march.sons', ctx)).toBe(false);
    });
});

describe('collection operations that rely on equality', () => {
    it('contains and indexOf find the selected element in a navigated collection', () => {
        const f = families();
        const ctx = { self: selected(f.brenda), jim: f.jim, members: f.members };
        expect(jjelEval('self.parent.daughters.contains(self)', ctx)).toBe(true);
        expect(jjelEval('self.parent.sons.contains(self)', ctx)).toBe(false);
        expect(jjelEval('members.contains(self)', ctx)).toBe(true);
        expect(jjelEval('members.indexOf(self)', ctx)).toBe(3);
        expect(jjelEval('self.parent.sons.indexOf(self)', ctx)).toBe(-1);
        expect(jjelEval('members.indexOf(jim)', ctx)).toBe(0);
    });

    it('distinct keeps one of two references to the same object, and does not walk the object', () => {
        const f = families();
        const ctx = { self: selected(f.jim), members: f.members };
        // The handles form a cycle (jim.parent.father is jim): JSON.stringify threw here.
        expect(jjelEval('[self, self.parent.father, self.parent.mother].distinct().size', ctx)).toBe(2);
        expect(jjelEval('members.distinct().size', ctx)).toBe(4);
        expect(jjelEval('(forall m in members : m.parent).distinct().size', ctx)).toBe(1);
    });

    it('distinct keeps the first occurrence, as before', () => {
        const f = families();
        const self = selected(f.jim);
        const out = jjelEval('[self, jim].distinct()', { self, jim: f.jim }) as any[];
        expect(out).toHaveLength(1);
        expect(out[0]).toBe(self);
    });

    it('distinctBy and groupBy key a model object by its identity', () => {
        const f = families();
        const ctx = { self: selected(f.jim), members: f.members };
        expect(jjelEval('members.distinctBy(m => m.parent).size', ctx)).toBe(1);
        expect(jjelEval('[self, self.parent.father].distinctBy(m => m).size', ctx)).toBe(1);
        const groups = jjelEval('members.groupBy(m => m.parent)', ctx) as any;
        expect(groups).toHaveLength(1);
        expect(groups[0].items).toHaveLength(4);
    });

    it('distinct on records and primitives is unchanged', () => {
        expect(jjelEval('[1, 1, "1", 2].distinct()', {})).toEqual([1, '1', 2]);
        expect(jjelEval('[{ a: 1 }, { a: 1 }, { a: 2 }].distinct().size', {})).toBe(2);
        expect(jjelEval('[{ id: "x", n: 1 }, { id: "x", n: 2 }].distinct().size', {})).toBe(2);
    });
});
