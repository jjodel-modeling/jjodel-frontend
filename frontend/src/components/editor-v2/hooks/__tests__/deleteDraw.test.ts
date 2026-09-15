/**
 * Tests of `deleteDraw` - the pure half of the D-graph delete adapter (slice 12d).
 *
 * Two subjects, and both are tested BY CONTRAST rather than by assertion of
 * absence: a walk that returned nothing would satisfy "the non-containment target
 * is not in the cascade" just as well as a correct one, so every test that says
 * what is excluded also says what is still there.
 *
 *  - `descendantsOf` - the containment closure the CORE does not delete. Measured
 *    on the running app (see the module header): deleting a container leaves the
 *    child alive with a `father` that no longer resolves. This walk is what the
 *    adapter deletes explicitly instead.
 *  - `referrerInputs` - the incoming pointers a delete has to deal with, with the
 *    cardinality facts the engine's `wouldBreak` reads.
 *
 * The fixture is a plain `idlookup`, the way the D layer holds one: a contained
 * DObject's `father` is its owner's SLOT (a DValue), not the owner.
 */

import { describe, expect, it } from 'vitest';
import { descendantsOf, referrerInputs, slotOf } from '../deleteDraw';

/**
 * A model with one container, two levels of containment below it, and two
 * outsiders pointing in:
 *
 *   m1 (DModel)
 *     +- box     : Box     (father m1)
 *     |    +- mid   : Item  (box.$items[0])
 *     |    |    +- leaf : Item (mid.$items[0])
 *     |    +- other : Item  (box.$items[1])
 *     +- w1      : Watcher (father m1)   watches -> box      (1..1)
 *     +- w2      : Watcher (father m1)   watches -> leaf     (1..1)
 *     +- w3      : Watcher (father m1)   tags    -> [mid, other, box]  (1..*)
 *     +- far     : Item    (father m1)   the control: nothing to do with any of it
 *
 * `Box.items` / `Item.items` are CONTAINMENT; `Watcher.watches` and `Watcher.tags`
 * are plain references, which is what makes them referrers rather than owners.
 */
function fixture() {
    const idlookup: Record<string, any> = {
        m1: { id: 'm1', className: 'DModel', name: 'model' },

        c_Box: { id: 'c_Box', className: 'DClass', name: 'Box' },
        c_Item: { id: 'c_Item', className: 'DClass', name: 'Item' },
        c_Watcher: { id: 'c_Watcher', className: 'DClass', name: 'Watcher' },

        f_items: { id: 'f_items', className: 'DReference', name: 'items', composition: true, lowerBound: 0, upperBound: -1 },
        f_watches: { id: 'f_watches', className: 'DReference', name: 'watches', composition: false, lowerBound: 1, upperBound: 1 },
        f_tags: { id: 'f_tags', className: 'DReference', name: 'tags', composition: false, lowerBound: 1, upperBound: -1 },

        box: { id: 'box', className: 'DObject', name: 'box', instanceof: 'c_Box', father: 'm1', features: ['v_box_items'], pointedBy: [] },
        mid: { id: 'mid', className: 'DObject', name: 'mid', instanceof: 'c_Item', father: 'v_box_items', features: ['v_mid_items'], pointedBy: [] },
        leaf: { id: 'leaf', className: 'DObject', name: 'leaf', instanceof: 'c_Item', father: 'v_mid_items', features: [], pointedBy: [] },
        other: { id: 'other', className: 'DObject', name: 'other', instanceof: 'c_Item', father: 'v_box_items', features: [], pointedBy: [] },
        far: { id: 'far', className: 'DObject', name: 'far', instanceof: 'c_Item', father: 'm1', features: [], pointedBy: [] },

        w1: { id: 'w1', className: 'DObject', name: 'w1', instanceof: 'c_Watcher', father: 'm1', features: ['v_w1_watches'], pointedBy: [] },
        w2: { id: 'w2', className: 'DObject', name: 'w2', instanceof: 'c_Watcher', father: 'm1', features: ['v_w2_watches'], pointedBy: [] },
        w3: { id: 'w3', className: 'DObject', name: 'w3', instanceof: 'c_Watcher', father: 'm1', features: ['v_w3_tags'], pointedBy: [] },

        v_box_items: { id: 'v_box_items', className: 'DValue', father: 'box', instanceof: 'f_items', values: ['mid', 'other'] },
        v_mid_items: { id: 'v_mid_items', className: 'DValue', father: 'mid', instanceof: 'f_items', values: ['leaf'] },
        v_w1_watches: { id: 'v_w1_watches', className: 'DValue', father: 'w1', instanceof: 'f_watches', values: ['box'] },
        v_w2_watches: { id: 'v_w2_watches', className: 'DValue', father: 'w2', instanceof: 'f_watches', values: ['leaf'] },
        v_w3_tags: { id: 'v_w3_tags', className: 'DValue', father: 'w3', instanceof: 'f_tags', values: ['mid', 'other', 'box'] },
    };

    // `pointedBy` is what the reducer maintains, and `shapeDraw.referencedBy` reads
    // it as an INDEX rather than scanning the model. Spelled here in the exact path
    // form the reducer writes, so the test drives the real parser.
    const point = (target: string, slot: string, index: number) =>
        idlookup[target].pointedBy.push({ source: `idlookup.${slot}.values.${index}` });
    // Containment links are in `pointedBy` too - they are the entries the walk has
    // to drop, and dropping them is one of the things under test.
    point('mid', 'v_box_items', 0);
    point('other', 'v_box_items', 1);
    point('leaf', 'v_mid_items', 0);
    point('box', 'v_w1_watches', 0);
    point('leaf', 'v_w2_watches', 0);
    point('mid', 'v_w3_tags', 0);
    point('other', 'v_w3_tags', 1);
    point('box', 'v_w3_tags', 2);
    return idlookup;
}

describe('descendantsOf - the containment closure the core does not delete', () => {
    it('reaches every level, parent before child, with its depth', () => {
        const found = descendantsOf(fixture(), 'box');
        expect(found.map(d => `${d.name}@${d.depth}`)).toEqual(['mid@1', 'leaf@2', 'other@1']);
    });

    it('names the containment feature each one sits in, and its metaclass', () => {
        const leaf = descendantsOf(fixture(), 'box').find(d => d.id === 'leaf');
        expect(leaf).toMatchObject({ cls: 'Item', childKey: 'items', depth: 2 });
    });

    it('CONTRAST - it descends through containment and NOT through a plain reference', () => {
        // `w3` owns nothing: `tags` is a reference, and its three targets are not
        // its children. A walk that followed references would report all three.
        expect(descendantsOf(fixture(), 'w3')).toEqual([]);
        // And the control: the same walk over a real container does report them.
        expect(descendantsOf(fixture(), 'mid').map(d => d.id)).toEqual(['leaf']);
    });

    it('reports nothing for a childless instance, and for one that does not exist', () => {
        expect(descendantsOf(fixture(), 'far')).toEqual([]);
        expect(descendantsOf(fixture(), 'ghost')).toEqual([]);
    });

    it('stops on a containment cycle instead of looping', () => {
        const idlookup = fixture();
        // A corrupt model: leaf contains box, which already contains leaf.
        idlookup.v_leaf_items = { id: 'v_leaf_items', className: 'DValue', father: 'leaf', instanceof: 'f_items', values: ['box'] };
        idlookup.leaf.features = ['v_leaf_items'];
        const found = descendantsOf(idlookup, 'box').map(d => d.id);
        expect(new Set(found).size).toBe(found.length);
        expect(found).not.toContain('box');
    });
});

describe('referrerInputs - the pointers a delete has to deal with', () => {
    it('reports the outside pointer aimed at the target, by name and feature', () => {
        const refs = referrerInputs(fixture(), ['box']);
        expect(refs.map(r => `${r.instanceName}.${r.featureKey}[${r.index}]`))
            .toEqual(['w1.watches[0]', 'w3.tags[2]']);
    });

    it('DROPS the containment link: an owner is not a referrer (R-FORM-8)', () => {
        // `mid` is pointed at by its own owner's slot AND by w3.tags. Only the
        // second is a referrer; the first is where it lives.
        const refs = referrerInputs(fixture(), ['mid']);
        expect(refs.map(r => r.instanceId)).toEqual(['w3']);
    });

    it('KEEPS a pointer aimed at a descendant, and says what it points at (rule 3)', () => {
        const refs = referrerInputs(fixture(), ['box', 'mid', 'leaf', 'other']);
        const byWho = refs.map(r => `${r.instanceId}->${r.pointsAt}`).sort();
        expect(byWho).toEqual(['w1->box', 'w2->leaf', 'w3->box', 'w3->mid', 'w3->other']);
    });

    it('DROPS a pointer held by an instance that is dying too', () => {
        // `mid` points at `leaf` through containment already; make it point through
        // a reference as well, then delete the pair. The referrer is inside the
        // dying set, so offering to repoint it would be offering to edit a ghost.
        const idlookup = fixture();
        idlookup.v_mid_watch = { id: 'v_mid_watch', className: 'DValue', father: 'mid', instanceof: 'f_watches', values: ['other'] };
        idlookup.mid.features = ['v_mid_items', 'v_mid_watch'];
        idlookup.other.pointedBy.push({ source: 'idlookup.v_mid_watch.values.0' });

        // CONTROL: deleting `other` alone DOES report mid as a referrer.
        expect(referrerInputs(idlookup, ['other']).map(r => r.instanceId)).toContain('mid');
        // And deleting both drops it, because mid is going too.
        expect(referrerInputs(idlookup, ['other', 'mid']).map(r => r.instanceId)).not.toContain('mid');
    });

    it('carries the cardinality and the live count of the referring slot', () => {
        const refs = referrerInputs(fixture(), ['box']);
        expect(refs.find(r => r.instanceId === 'w1')).toMatchObject({
            lower: 1, upper: 1, slotCount: 1,
        });
        expect(refs.find(r => r.instanceId === 'w3')).toMatchObject({
            lower: 1, upper: -1, slotCount: 3,
        });
    });

    it('counts the slot holes-excluded, so a cleared value does not inflate it', () => {
        const idlookup = fixture();
        // `clearSlotValue` leaves a hole rather than shortening (R-FORM-7).
        idlookup.v_w3_tags.values = ['mid', null, 'box'];
        const w3 = referrerInputs(idlookup, ['box']).find(r => r.instanceId === 'w3');
        expect(w3?.slotCount).toBe(2);
    });

    it('reports nothing for an instance nothing points at', () => {
        expect(referrerInputs(fixture(), ['far'])).toEqual([]);
    });

    it('orders by referring instance, then feature, then position', () => {
        const refs = referrerInputs(fixture(), ['box', 'mid', 'leaf', 'other']);
        const keys = refs.map(r => `${r.instanceName} ${r.featureKey} ${r.index}`);
        expect(keys).toEqual([...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    });
});

describe('slotOf', () => {
    it('finds the DValue of one (instance, feature) by NAME', () => {
        expect(slotOf(fixture(), 'w3', 'tags')?.id).toBe('v_w3_tags');
    });

    it('answers null for a feature the instance does not hold', () => {
        expect(slotOf(fixture(), 'w3', 'watches')).toBeNull();
        expect(slotOf(fixture(), 'ghost', 'tags')).toBeNull();
    });
});
