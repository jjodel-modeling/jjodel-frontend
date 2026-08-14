/**
 * Unit tests for the metaclass identity pin (task 1.3).
 *
 * The chain lives in a pure module for two reasons: the same three steps run in
 * all three authoring panels, and the panels themselves are not importable here
 * (joiner -> monaco -> `window` undefined). Everything asserted below is what the
 * panels rely on, so a regression shows up as a red test instead of as a feature
 * list quietly read off the wrong class.
 *
 * The fixture is the case that motivates the whole slice: a project holding two
 * metamodels that both declare `State`, where the name alone cannot tell them
 * apart and the first one always wins.
 */
import { describe, it, expect } from 'vitest';
import {
    resolveMetaclassId,
    withMetaclassPins,
    type MetaclassRef,
    type PinnableIR,
} from '../metaclassPin';

/** Metamodel A comes first in project iteration order, so it wins any name match. */
const A_STATE: MetaclassRef = { id: 'ptr_A_State', name: 'State' };
const A_MACHINE: MetaclassRef = { id: 'ptr_A_Machine', name: 'Machine' };
/** Metamodel B declares a class of the same name — the ambiguity to disambiguate. */
const B_STATE: MetaclassRef = { id: 'ptr_B_State', name: 'State' };

const CANDIDATES: MetaclassRef[] = [A_STATE, A_MACHINE, B_STATE];

describe('resolveMetaclassId — the three-step chain', () => {
    it('1. returns the pinned pointer when the ir pins that name', () => {
        expect(resolveMetaclassId('State', {
            pins: { State: B_STATE.id },
            appliesTo: [],
            candidates: CANDIDATES,
        })).toEqual({ id: B_STATE.id, source: 'pin' });
    });

    it('2. falls back to appliableToClasses when the ir has no pin', () => {
        // The step that protects every view authored before the pin existed.
        expect(resolveMetaclassId('State', {
            appliesTo: [B_STATE],
            candidates: CANDIDATES,
        })).toEqual({ id: B_STATE.id, source: 'appliesTo' });
    });

    it('3. falls back to the name match when neither is available', () => {
        expect(resolveMetaclassId('State', { candidates: CANDIDATES }))
            .toEqual({ id: A_STATE.id, source: 'name' });
    });

    it('4. ignores a pin recorded for a different name', () => {
        // A pin on Machine must not answer a question about State.
        expect(resolveMetaclassId('State', {
            pins: { Machine: A_MACHINE.id },
            appliesTo: [B_STATE],
            candidates: CANDIDATES,
        })).toEqual({ id: B_STATE.id, source: 'appliesTo' });
    });

    it('5. prefers the pinned class over the first class of that name', () => {
        // The case the slice exists for: two metamodels, one name, and the pin
        // is the only thing that says which one.
        const resolved = resolveMetaclassId('State', {
            pins: { State: B_STATE.id },
            candidates: CANDIDATES,
        });
        expect(resolved).toEqual({ id: B_STATE.id, source: 'pin' });
        expect(resolved!.id).not.toBe(A_STATE.id);
    });

    it('6. resolves exactly as before on an ir with no pin at all', () => {
        const legacy = { appliesTo: [B_STATE], candidates: CANDIDATES };
        expect(resolveMetaclassId('State', legacy)).toEqual({ id: B_STATE.id, source: 'appliesTo' });
        expect(resolveMetaclassId('Machine', legacy)).toEqual({ id: A_MACHINE.id, source: 'name' });
        expect(resolveMetaclassId('Nowhere', legacy)).toBeNull();
    });

    it('degrades to the name match when the pinned class no longer exists', () => {
        // A metamodel re-imported under new ids leaves the pointer dangling; a
        // dangling id would starve the feature set instead of degrading.
        expect(resolveMetaclassId('State', {
            pins: { State: 'ptr_deleted' },
            candidates: CANDIDATES,
        })).toEqual({ id: A_STATE.id, source: 'name' });
    });

    it('returns null for the wildcard-ish empty name', () => {
        expect(resolveMetaclassId('', { candidates: CANDIDATES })).toBeNull();
        expect(resolveMetaclassId(null, { candidates: CANDIDATES })).toBeNull();
    });
});

const CTX = { appliesTo: [B_STATE], candidates: CANDIDATES };

const irWith = (metaclasses: string[] | '*', pins?: Record<string, string>): PinnableIR =>
    pins ? { metaclasses, authoringMetaclassPins: pins } : { metaclasses };

describe('withMetaclassPins — written by the same patch as metaclasses', () => {
    it('pins a name added to the list, through the same chain the reader uses', () => {
        const prev = irWith([]);
        const next = withMetaclassPins(prev, irWith(['State']), CTX);
        // appliableToClasses said metamodel B, so the pin says metamodel B.
        expect(next.authoringMetaclassPins).toEqual({ State: B_STATE.id });
    });

    it('keeps an existing pin when another name is added', () => {
        const prev = irWith(['State'], { State: B_STATE.id });
        const next = withMetaclassPins(prev, irWith(['State', 'Machine']), CTX);
        expect(next.authoringMetaclassPins).toEqual({
            State: B_STATE.id,
            Machine: A_MACHINE.id,
        });
    });

    it('drops the pin of a name removed from the list', () => {
        const prev = irWith(['State', 'Machine'], { State: B_STATE.id, Machine: A_MACHINE.id });
        const next = withMetaclassPins(prev, irWith(['Machine']), CTX);
        expect(next.authoringMetaclassPins).toEqual({ Machine: A_MACHINE.id });
    });

    it('drops the KEY, not writes an empty map, on the wildcard', () => {
        const prev = irWith(['State'], { State: B_STATE.id });
        const next = withMetaclassPins(prev, irWith('*', { State: B_STATE.id }), CTX);
        expect('authoringMetaclassPins' in next).toBe(false);
    });

    it('drops the KEY when the list is emptied', () => {
        const prev = irWith(['State'], { State: B_STATE.id });
        const next = withMetaclassPins(prev, irWith([], { State: B_STATE.id }), CTX);
        expect('authoringMetaclassPins' in next).toBe(false);
    });

    it('never backfills: an unrelated edit leaves an unpinned ir unpinned', () => {
        // Same metaclass list on both sides = the author touched something else.
        const prev = irWith(['State']);
        const next = withMetaclassPins(prev, { ...irWith(['State']), label: 'x' } as PinnableIR, CTX);
        expect('authoringMetaclassPins' in next).toBe(false);
        expect((next as any).label).toBe('x');
    });

    it('returns the same object when the list did not move', () => {
        const prev = irWith(['State'], { State: B_STATE.id });
        const next = irWith(['State'], { State: B_STATE.id });
        expect(withMetaclassPins(prev, next, CTX)).toBe(next);
    });

    it('does not rewrite a map that is already correct', () => {
        // List reordered, same names: the map content is unchanged, so the
        // existing object survives byte-identical.
        const prev = irWith(['State', 'Machine'], { State: B_STATE.id, Machine: A_MACHINE.id });
        const next = irWith(['Machine', 'State'], prev.authoringMetaclassPins);
        expect(withMetaclassPins(prev, next, CTX)).toBe(next);
    });

    it('omits a name no metamodel declares instead of pinning it to nothing', () => {
        const prev = irWith([]);
        const next = withMetaclassPins(prev, irWith(['State', 'Nowhere']), CTX);
        expect(next.authoringMetaclassPins).toEqual({ State: B_STATE.id });
    });

    it('honours the pin the caller declares on next, over the name match', () => {
        // What the grouped picker does: the author picks A.State, so the patch
        // carries `metaclasses: ['State']` AND the pin on A. Without this the
        // chain would answer B (this fixture's appliesTo) and the choice would be
        // lost between the click and the draft.
        const prev = irWith([]);
        const next = withMetaclassPins(
            prev,
            irWith(['State'], { State: A_STATE.id }),
            CTX,
        );
        expect(next.authoringMetaclassPins).toEqual({ State: A_STATE.id });
    });

    it('a pin declared on next beats the one carried by prev', () => {
        const prev = irWith(['Machine'], { State: B_STATE.id, Machine: A_MACHINE.id });
        const next = withMetaclassPins(
            prev,
            irWith(['Machine', 'State'], { State: A_STATE.id }),
            CTX,
        );
        expect(next.authoringMetaclassPins).toEqual({
            Machine: A_MACHINE.id,
            State: A_STATE.id,
        });
    });

    it('ignores a declared pin that no metamodel declares any more', () => {
        const prev = irWith([]);
        const next = withMetaclassPins(prev, irWith(['State'], { State: 'ptr_gone' }), CTX);
        expect(next.authoringMetaclassPins).toEqual({ State: B_STATE.id });
    });
});
