/**
 * Tests of `createDraw` — the pure half of the D-graph create adapter (slice 2c).
 *
 * The subject that matters here is the CONTAINMENT-LOOP FILTER, the question point
 * 6 of `form-engine-contract.md` left to this slice. It is tested by CONTRAST: the
 * same call, the same model, one candidate that would close a cycle and one that
 * would not, and only the second is offered. A test that only asserted the absence
 * of the first would pass just as well on a function that returns nothing.
 *
 * The fixture is a plain `idlookup` dictionary, the way the D layer actually holds
 * one: a DObject's `father` is its owner's SLOT (a DValue), not the owner, and a
 * root object's father is the DModel.
 */

import { describe, expect, it } from 'vitest';
import {
    candidatesFor,
    childCount,
    containmentChain,
    filledSlotValues,
    instancesUnder,
    maxIdValue,
    modelOfObject,
    nextIdValue,
    ownerOf,
    siblingNames,
} from '../createDraw';

/** A model holding a three-deep containment chain plus two siblings:
 *
 *    m1 (DModel)
 *      └ root      : Folder   (father m1)
 *          └ mid   : Folder   (father root.$items)
 *              └ leaf : Folder (father mid.$items)
 *          └ other : Folder   (father root.$items)   ← sibling of mid
 *
 * `Folder.items` is a CONTAINMENT reference onto Folder, which is what makes a
 * cycle expressible at all; `Folder.shortcut` is a plain reference onto Folder,
 * which cannot close one. */
function fixture() {
    const idlookup: Record<string, any> = {
        m1: { id: 'm1', className: 'DModel', name: 'model' },

        c_Folder: { id: 'c_Folder', className: 'DClass', name: 'Folder' },
        f_items: { id: 'f_items', className: 'DReference', name: 'items', composition: true },
        f_shortcut: { id: 'f_shortcut', className: 'DReference', name: 'shortcut', composition: false },

        root: { id: 'root', className: 'DObject', name: 'root', instanceof: 'c_Folder', father: 'm1', features: ['v_root_items'] },
        mid: { id: 'mid', className: 'DObject', name: 'mid', instanceof: 'c_Folder', father: 'v_root_items', features: ['v_mid_items'] },
        leaf: { id: 'leaf', className: 'DObject', name: 'leaf', instanceof: 'c_Folder', father: 'v_mid_items', features: [] },
        other: { id: 'other', className: 'DObject', name: 'other', instanceof: 'c_Folder', father: 'v_root_items', features: [] },

        v_root_items: { id: 'v_root_items', className: 'DValue', father: 'root', instanceof: 'f_items', values: ['mid', 'other'] },
        v_mid_items: { id: 'v_mid_items', className: 'DValue', father: 'mid', instanceof: 'f_items', values: ['leaf'] },
    };
    return idlookup;
}

const FOLDERS = new Set(['c_Folder']);

describe('containmentChain', () => {
    it('walks DObject -> DValue -> DObject up to the model, and includes the start', () => {
        expect(containmentChain(fixture(), 'leaf')).toEqual({
            objectIds: ['leaf', 'mid', 'root'],
            modelId: 'm1',
        });
    });

    it('gives a root object a chain of itself', () => {
        expect(containmentChain(fixture(), 'root')).toEqual({ objectIds: ['root'], modelId: 'm1' });
    });

    it('answers nothing for an unknown id, rather than throwing', () => {
        expect(containmentChain(fixture(), 'ghost')).toEqual({ objectIds: [], modelId: null });
    });

    it('stops on a cycle instead of looping', () => {
        const idlookup = fixture();
        // A corrupt model: leaf owns mid, which already owns leaf.
        idlookup.v_leaf_items = { id: 'v_leaf_items', className: 'DValue', father: 'leaf', instanceof: 'f_items', values: ['mid'] };
        idlookup.mid.father = 'v_leaf_items';
        const chain = containmentChain(idlookup, 'leaf');
        expect(chain.modelId).toBeNull();
        expect(new Set(chain.objectIds).size).toBe(chain.objectIds.length);
    });
});

describe('ownerOf and modelOfObject', () => {
    it('reports the owning DObject, one hop through the slot', () => {
        const idlookup = fixture();
        expect(ownerOf(idlookup, 'leaf')).toBe('mid');
        expect(ownerOf(idlookup, 'mid')).toBe('root');
    });

    it('reports null for an instance the model owns directly', () => {
        expect(ownerOf(fixture(), 'root')).toBeNull();
    });

    it('finds the model from any depth', () => {
        const idlookup = fixture();
        expect(modelOfObject(idlookup, 'leaf')).toBe('m1');
        expect(modelOfObject(idlookup, 'root')).toBe('m1');
    });
});

describe('the containment-loop filter (contract point 6)', () => {
    it('CONTRAST — a candidate that would close a cycle is not offered, a lawful one is', () => {
        const idlookup = fixture();
        // A draft contained by `leaf`: its chain will be leaf -> mid -> root.
        const chain = containmentChain(idlookup, 'leaf').objectIds;

        const offered = candidatesFor(idlookup, 'm1', FOLDERS, {
            isContainment: true,
            excludeIds: chain,
        }).map(c => c.id);

        // `root` is an ancestor of the draft: putting it inside would close the cycle.
        expect(offered).not.toContain('root');
        expect(offered).not.toContain('mid');
        expect(offered).not.toContain('leaf');
        // `other` is a cousin, not an ancestor: it is a lawful containment target,
        // and it is the half of this test that proves the filter still offers things.
        expect(offered).toEqual(['other']);
    });

    it('applies to CONTAINMENT features only — a plain reference may point at an ancestor', () => {
        const idlookup = fixture();
        const chain = containmentChain(idlookup, 'leaf').objectIds;

        const offered = candidatesFor(idlookup, 'm1', FOLDERS, {
            isContainment: false,
            excludeIds: chain,
        }).map(c => c.id);

        expect(offered).toEqual(['leaf', 'mid', 'other', 'root']);
    });

    it('excludes nothing for a root draft, which has no ancestors yet', () => {
        const idlookup = fixture();
        const offered = candidatesFor(idlookup, 'm1', FOLDERS, {
            isContainment: true,
            excludeIds: [],
        }).map(c => c.id);
        expect(offered).toEqual(['leaf', 'mid', 'other', 'root']);
    });
});

describe('candidatesFor', () => {
    it('keeps candidates inside the model', () => {
        const idlookup = fixture();
        idlookup.m2 = { id: 'm2', className: 'DModel', name: 'other model' };
        idlookup.stranger = {
            id: 'stranger', className: 'DObject', name: 'stranger',
            instanceof: 'c_Folder', father: 'm2', features: [],
        };
        expect(candidatesFor(idlookup, 'm1', FOLDERS).map(c => c.id)).not.toContain('stranger');
        expect(candidatesFor(idlookup, 'm2', FOLDERS).map(c => c.id)).toEqual(['stranger']);
    });

    it('accepts the whole conformance closure it is given, and nothing else', () => {
        const idlookup = fixture();
        idlookup.c_Note = { id: 'c_Note', className: 'DClass', name: 'Note' };
        idlookup.note = {
            id: 'note', className: 'DObject', name: 'note',
            instanceof: 'c_Note', father: 'm1', features: [],
        };
        expect(candidatesFor(idlookup, 'm1', FOLDERS).map(c => c.id)).not.toContain('note');
        expect(candidatesFor(idlookup, 'm1', new Set(['c_Folder', 'c_Note'])).map(c => c.id)).toContain('note');
    });

    it('labels by name and sorts by it', () => {
        expect(candidatesFor(fixture(), 'm1', FOLDERS)).toEqual([
            { id: 'leaf', label: 'leaf' },
            { id: 'mid', label: 'mid' },
            { id: 'other', label: 'other' },
            { id: 'root', label: 'root' },
        ]);
    });

    it('answers empty for an empty class set rather than offering everything', () => {
        expect(candidatesFor(fixture(), 'm1', new Set())).toEqual([]);
    });
});

describe('childCount — the upper-bound gate reads filled values, not array length', () => {
    it('counts what a slot holds', () => {
        expect(childCount(fixture(), 'root', 'items')).toBe(2);
        expect(childCount(fixture(), 'mid', 'items')).toBe(1);
    });

    it('counts a slot that does not exist yet as empty', () => {
        expect(childCount(fixture(), 'leaf', 'items')).toBe(0);
    });

    it('does not count holes — `clearSlotValue` leaves one rather than shortening', () => {
        const idlookup = fixture();
        idlookup.v_root_items.values = ['mid', null, 'other', ''];
        expect(idlookup.v_root_items.values.length).toBe(4);
        expect(childCount(idlookup, 'root', 'items')).toBe(2);
        expect(filledSlotValues(idlookup, 'root', 'items')).toEqual(['mid', 'other']);
    });
});

describe('the sibling scope of the uniqueness rule (12a)', () => {
    it('is same class AND same owner — a cousin is not a sibling', () => {
        const idlookup = fixture();
        expect(instancesUnder(idlookup, 'm1', FOLDERS, 'root').sort()).toEqual(['mid', 'other']);
        expect(instancesUnder(idlookup, 'm1', FOLDERS, 'mid')).toEqual(['leaf']);
    });

    it('reads the roots of the model when the owner is null', () => {
        expect(instancesUnder(fixture(), 'm1', FOLDERS, null)).toEqual(['root']);
    });

    it('yields the names the uniqueness check compares against', () => {
        expect(siblingNames(fixture(), 'm1', 'c_Folder', 'root').sort()).toEqual(['mid', 'other']);
        expect(siblingNames(fixture(), 'm1', 'c_Folder', null)).toEqual(['root']);
    });

    it('separates classes: a Note under root is not a Folder sibling', () => {
        const idlookup = fixture();
        idlookup.c_Note = { id: 'c_Note', className: 'DClass', name: 'Note' };
        idlookup.note = {
            id: 'note', className: 'DObject', name: 'note',
            instanceof: 'c_Note', father: 'v_root_items', features: [],
        };
        idlookup.v_root_items.values = ['mid', 'other', 'note'];
        expect(siblingNames(idlookup, 'm1', 'c_Folder', 'root').sort()).toEqual(['mid', 'other']);
        expect(siblingNames(idlookup, 'm1', 'c_Note', 'root')).toEqual(['note']);
    });
});


// ── AUTO1: the auto-increment scan ───────────────────────────────────────────
//
// The subject is the SCOPE of the scan, and it is tested by contrast the way the
// containment filter above is: the same call, one slot that must count and one
// that must not, and the answer moves only when the right one moves.
//
// The fixture puts ONE DAttribute (`a_code`) on an abstract superclass and gives
// it three holders across two different subclasses and two different models —
// which is exactly the shape a scan «per metaclass» would get wrong.

/**
 *    a_code : EInt, isID           declared on Item (abstract)
 *      ├ Book   (subclass)  b1.code = 3
 *      └ Disc   (subclass)  d1.code = 7        ← sibling branch
 *    a_rank : EInt, no flag        r1.rank = 99   ← a different attribute
 *    a_code, second model         b2.code = 12    ← another model, same attribute
 */
function idFixture() {
    return {
        a_code: { id: 'a_code', className: 'DAttribute', name: 'code', isID: true },
        a_rank: { id: 'a_rank', className: 'DAttribute', name: 'rank' },

        v_b1_code: { id: 'v_b1_code', className: 'DValue', father: 'b1', instanceof: 'a_code', values: [3] },
        v_d1_code: { id: 'v_d1_code', className: 'DValue', father: 'd1', instanceof: 'a_code', values: [7] },
        v_b2_code: { id: 'v_b2_code', className: 'DValue', father: 'b2', instanceof: 'a_code', values: [12] },
        v_r1_rank: { id: 'v_r1_rank', className: 'DValue', father: 'r1', instanceof: 'a_rank', values: [99] },
    } as Record<string, any>;
}

describe('maxIdValue — the scan is by ATTRIBUTE, and that is the point', () => {
    it('spans the whole hierarchy: two subclasses, one attribute, one maximum', () => {
        const l = idFixture();
        // positive control: both branches ARE in the fixture
        expect(l.v_b1_code.values).toEqual([3]);
        expect(l.v_d1_code.values).toEqual([7]);
        expect(maxIdValue(l, 'a_code')).toBe(12);
    });

    it('ignores every other attribute — 99 is in the fixture and must not win', () => {
        const l = idFixture();
        expect(l.v_r1_rank.values).toEqual([99]);   // positive control
        delete l.v_b2_code;
        expect(maxIdValue(l, 'a_code')).toBe(7);
    });

    it('answers null, not 0, when the attribute has no value yet', () => {
        expect(maxIdValue(idFixture(), 'a_nothing')).toBeNull();
        expect(maxIdValue({}, 'a_code')).toBeNull();
        expect(maxIdValue(null as any, 'a_code')).toBeNull();
    });

    it('reads a numeric string', () => {
        const l = {
            a_code: idFixture().a_code,
            v1: { id: 'v1', className: 'DValue', instanceof: 'a_code', values: ['4'] },
        };
        expect(maxIdValue(l, 'a_code')).toBe(4);
    });

    it('never coerces an empty or unparsable value to zero', () => {
        // The slots EXIST and hold something; what they hold is not a number. A
        // `Number()` with no guard turns '', '  ' and null into 0 — and 0 is a
        // maximum, so the sequence would start at 1 on a model that has no ids AND
        // on a model whose ids are all blank, silently. Asserted on the null, which
        // is the only answer that separates the two.
        const l = {
            a_code: idFixture().a_code,
            v1: { id: 'v1', className: 'DValue', instanceof: 'a_code', values: ['', '  '] },
            v2: { id: 'v2', className: 'DValue', instanceof: 'a_code', values: [null, undefined] },
            v3: { id: 'v3', className: 'DValue', instanceof: 'a_code', values: ['abc', NaN, Infinity] },
        };
        expect(maxIdValue(l, 'a_code')).toBeNull();
        expect(nextIdValue(l, 'a_code')).toBe(1);
    });

    it('does not mistake a non-DValue that happens to carry the same instanceof', () => {
        const l = idFixture();
        l.impostor = { id: 'impostor', className: 'DObject', instanceof: 'a_code', values: [999] };
        expect(maxIdValue(l, 'a_code')).toBe(12);
    });

    it('takes the maximum over a multivalued slot, not its last entry', () => {
        const l = { a: { id: 'a' }, v: { id: 'v', className: 'DValue', instanceof: 'a', values: [5, 2] } };
        expect(maxIdValue(l, 'a')).toBe(5);
    });
});

describe('nextIdValue — after the largest, and holes stay spent', () => {
    it('starts a fresh sequence at 1, not at 0', () => {
        expect(nextIdValue({}, 'a_code')).toBe(1);
    });

    it('is the maximum plus one, whatever the gaps below it', () => {
        const l = idFixture();
        expect(nextIdValue(l, 'a_code')).toBe(13);
        // the 3 and the 7 are still there: the sequence does not recycle them
        delete l.v_b2_code;
        expect(nextIdValue(l, 'a_code')).toBe(8);
    });

    it('advances past a negative maximum rather than clamping to 1', () => {
        const l = { a: { id: 'a' }, v: { id: 'v', className: 'DValue', instanceof: 'a', values: [-3] } };
        expect(nextIdValue(l, 'a')).toBe(-2);
    });
});
