import { describe, it, expect } from 'vitest';
import { hasRowMenu, refSlotControls, type RefSlotControls, type RefSlotReads } from '../refSlot';

/**
 * The contract of `jjform/refSlot` (#172, R-REF-3, R-REF-4): what one reference slot of
 * an instance detail offers, row by row and at its foot.
 *
 * Each test is named after the mutation that kills it; the bench that establishes it is
 * in the commit that added this file.
 */

const ref = (lower: number, upper: number, o: { readOnly?: boolean; derived?: boolean } = {}) =>
    ({ lower, upper, readOnly: !!o.readOnly || !!o.derived, derived: !!o.derived });

/** Every pointer resolves, the viewer may write the source, nothing is locked. */
const live: RefSlotReads = { resolves: () => true, sourceEditable: true };

const actionsOf = (c: RefSlotControls) => c.rows.map(r => r.actions);

describe('the rows and their address', () => {
    it('a row carries its RAW index, not its position among the filled values (kills a re-packed index)', () => {
        const c = refSlotControls(ref(0, 1), [null, 'a'], live);
        expect(c.rows).toHaveLength(1);
        expect(c.rows[0].value).toBe('a');
        expect(c.rows[0].index).toBe(1);
    });

    it('the rows of a multi-valued slot keep their raw indices across holes (kills a re-packed index)', () => {
        const c = refSlotControls(ref(0, -1), ['a', null, 'c'], live);
        expect(c.rows.map(r => r.index)).toEqual([0, 2]);
        expect(actionsOf(c)).toEqual([['open', 'remove'], ['open', 'remove']]);
    });

    it('undefined, null, the empty string and blanks are holes, never rows (kills an empty value counted)', () => {
        const c = refSlotControls(ref(0, -1), [undefined, null, '', '  ', 'a'], live);
        expect(c.rows.map(r => [r.value, r.index])).toEqual([['a', 4]]);
    });

    it('the input array is not mutated (kills a filter in place)', () => {
        const raw = Object.freeze(['a', null, 'b']);
        expect(() => refSlotControls(ref(0, -1), raw, live)).not.toThrow();
        expect(raw).toEqual(['a', null, 'b']);
    });
});

describe('the menu of a row', () => {
    it('a 1..1 row has Open and Change, a 0..1 row has Remove too (kills Remove on a required single reference)', () => {
        expect([...refSlotControls(ref(1, 1), ['a'], live).rows[0].actions].sort()).toEqual(['change', 'open']);
        expect([...refSlotControls(ref(0, 1), ['a'], live).rows[0].actions].sort()).toEqual(['change', 'open', 'remove']);
    });

    it('a multi-valued row never has Change (kills Change leaking to a list)', () => {
        for (const r of [ref(0, -1), ref(1, -1), ref(0, 2)]) {
            const c = refSlotControls(r, ['a', 'b'], live);
            expect(actionsOf(c).flat()).not.toContain('change');
            expect(actionsOf(c).flat()).toContain('remove');
        }
    });

    it('the order is open, change, remove (kills a reorder)', () => {
        expect(refSlotControls(ref(0, 1), ['a'], live).rows[0].actions).toEqual(['open', 'change', 'remove']);
    });

    it('a broken pointer has no Open and keeps its write, and counts toward the upper bound (kills Open on a dead pointer)', () => {
        const reads: RefSlotReads = { ...live, resolves: v => v !== 'dead' };
        const many = refSlotControls(ref(0, 2), ['dead', 'a'], reads);
        expect(many.rows[0]).toEqual({ value: 'dead', index: 0, broken: true, actions: ['remove'] });
        expect(many.rows[1].broken).toBe(false);
        expect(many.full).toBe(true);
        expect(many.link).toBeNull();
        const single = refSlotControls(ref(1, 1), ['dead'], reads);
        expect(single.rows[0].actions).toEqual(['change']);
        expect(single.link).toBeNull();
    });

    it('hasRowMenu: a row that can only be opened, or do nothing, has no menu button (kills a button on an open-only row)', () => {
        expect(hasRowMenu({ value: 'a', index: 0, broken: false, actions: ['open'] })).toBe(false);
        expect(hasRowMenu({ value: 'a', index: 0, broken: true, actions: [] })).toBe(false);
        expect(hasRowMenu({ value: 'a', index: 0, broken: true, actions: ['remove'] })).toBe(true);
        expect(hasRowMenu({ value: 'a', index: 0, broken: false, actions: ['open', 'change'] })).toBe(true);
    });
});

describe('the foot of the slot', () => {
    it('«(none)» is offered at lower bound 0 and not at 1 (kills the bound dropped, and `< 1` turned `<= 1`)', () => {
        expect(refSlotControls(ref(0, 1), ['a'], live).allowNone).toBe(true);
        expect(refSlotControls(ref(1, 1), ['a'], live).allowNone).toBe(false);
    });

    it('a single-valued slot links at index 0 when empty and not when it holds a value (kills a link on a full single slot, and an append on a single one)', () => {
        expect(refSlotControls(ref(1, 1), [], live).link).toBe(0);
        expect(refSlotControls(ref(0, 1), [null], live).link).toBe(0);
        expect(refSlotControls(ref(0, 1), ['a'], live).link).toBeNull();
        expect(refSlotControls(ref(0, 1), [null, 'a'], live).link).toBeNull();
    });

    it('a multi-valued slot appends below its upper bound, not at it, and an unbounded one always (kills `>=` turned `>`, and the -1 test dropped)', () => {
        const below = refSlotControls(ref(0, 2), ['a'], live);
        expect([below.link, below.full]).toEqual(['append', false]);
        const at = refSlotControls(ref(0, 2), ['a', 'b'], live);
        expect([at.link, at.full]).toEqual([null, true]);
        const unbounded = refSlotControls(ref(1, -1), ['a', 'b', 'c'], live);
        expect([unbounded.link, unbounded.full]).toEqual(['append', false]);
        expect(refSlotControls(ref(0, -1), [], live).link).toBe('append');
    });
});

describe('who may write', () => {
    it('read-only, and derived: Open on every row, no link, and lockedBy says which (kills either flag dropped)', () => {
        const ro = refSlotControls(ref(0, -1, { readOnly: true }), ['a', 'b'], live);
        expect(actionsOf(ro)).toEqual([['open'], ['open']]);
        expect([ro.link, ro.lockedBy]).toEqual([null, 'readOnly']);
        const derived = refSlotControls(ref(0, 1, { derived: true }), [], live);
        expect([derived.link, derived.lockedBy]).toEqual([null, 'derived']);
        expect(actionsOf(refSlotControls(ref(0, 1, { derived: true }), ['a'], live))).toEqual([['open']]);
    });

    it('a source the viewer cannot edit: Open only, no link, lockedBy profile (kills a write offered outside the gate)', () => {
        const c = refSlotControls(ref(0, 1), ['a'], { ...live, sourceEditable: false });
        expect(actionsOf(c)).toEqual([['open']]);
        expect([c.link, c.lockedBy]).toEqual([null, 'profile']);
        expect(refSlotControls(ref(0, -1), [], { ...live, sourceEditable: false }).link).toBeNull();
        expect(refSlotControls(ref(0, 1), ['a'], live).lockedBy).toBeNull();
    });

    it('a locked value loses its write, its neighbours keep theirs, the link stays (kills the lock ignored, and the lock widened to the slot)', () => {
        const c = refSlotControls(ref(0, -1), ['a', 'b', 'c'], { ...live, isLocked: v => v === 'b' });
        expect(actionsOf(c)).toEqual([['open', 'remove'], ['open'], ['open', 'remove']]);
        expect([c.link, c.lockedBy]).toEqual(['append', null]);
    });
});
