/**
 * Unit tests for the metaclass list of an IR view, one entry per identity
 * (R-MCID-1, 2026-09-19): rows, picker, labels, add, remove.
 *
 * The functions live in a pure module because their consumers — MatchingSection and
 * the three host panels — are not import-safe in the node vitest env (ui barrel →
 * scss; joiner → monaco → `window`). The fixture is the case that motivates the
 * whole change: two metamodels that both declare `State`.
 */
import { describe, it, expect } from 'vitest';
import {
    metaclassChipLabel,
    metaclassEntries,
    metaclassGroups,
    withMetaclassChoice,
    withoutMetaclassEntry,
    type MetaclassChoice,
} from '../metaclassEntries';
import { withMetaclassPins, type PinnableIR } from '../../ir/metaclassPin';

const M1_STATE: MetaclassChoice = { id: 'c1_State', name: 'State', metamodelName: 'metamodel_1' };
const M1_MACHINE: MetaclassChoice = { id: 'c1_Machine', name: 'Machine', metamodelName: 'metamodel_1' };
const M2_STATE: MetaclassChoice = { id: 'c2_State', name: 'State', metamodelName: 'metamodel_2' };
const M2_EVENT: MetaclassChoice = { id: 'c2_Event', name: 'Event', metamodelName: 'metamodel_2' };
const CHOICES = [M1_STATE, M1_MACHINE, M2_STATE, M2_EVENT];

type Draft = PinnableIR & { priority?: number };
const draft = (metaclasses: string[] | '*', pins?: Record<string, string | string[]>): Draft =>
    pins ? { metaclasses, authoringMetaclassPins: pins } : { metaclasses };

describe('metaclassEntries — one row per identity', () => {
    it('a name without a pin is one entry without id (legacy view: any class with that name)', () => {
        expect(metaclassEntries(['State', 'Machine'], undefined)).toEqual([{ name: 'State' }, { name: 'Machine' }]);
    });

    it('a string pin is one entry carrying its id', () => {
        expect(metaclassEntries(['State'], { State: M1_STATE.id })).toEqual([{ name: 'State', id: M1_STATE.id }]);
    });

    it('an array pin is one entry per id, in array order', () => {
        expect(metaclassEntries(['State'], { State: [M2_STATE.id, M1_STATE.id] })).toEqual([
            { name: 'State', id: M2_STATE.id },
            { name: 'State', id: M1_STATE.id },
        ]);
    });

    it('follows the list order across names, expanding each name in place', () => {
        const rows = metaclassEntries(['Machine', 'State', 'Event'], {
            State: [M1_STATE.id, M2_STATE.id],
            Event: M2_EVENT.id,
        });
        expect(rows).toEqual([
            { name: 'Machine' },
            { name: 'State', id: M1_STATE.id },
            { name: 'State', id: M2_STATE.id },
            { name: 'Event', id: M2_EVENT.id },
        ]);
    });

    it('an empty array or empty string reads as no pin, so the row stays visible and removable', () => {
        expect(metaclassEntries(['State'], { State: [] })).toEqual([{ name: 'State' }]);
        expect(metaclassEntries(['State'], { State: '' })).toEqual([{ name: 'State' }]);
    });

    it('a pin for a name that is not in the list produces no row', () => {
        expect(metaclassEntries(['Machine'], { State: M1_STATE.id })).toEqual([{ name: 'Machine' }]);
    });
});

describe('metaclassGroups — the picker excludes by id, not by name', () => {
    const flat = (groups: ReturnType<typeof metaclassGroups>) =>
        groups.flatMap((g) => g.options.map((o) => `${g.label}/${o.label}=${o.value}`));

    it('nothing taken: every class of every metamodel, grouped by metamodel in order', () => {
        expect(flat(metaclassGroups(CHOICES, []))).toEqual([
            'metamodel_1/State=c1_State',
            'metamodel_1/Machine=c1_Machine',
            'metamodel_2/State=c2_State',
            'metamodel_2/Event=c2_Event',
        ]);
    });

    it('a pinned class leaves the picker, its homonym in the other metamodel stays', () => {
        // The 2026-09-19 defect: after metamodel_1.State, metamodel_2.State vanished.
        const out = flat(metaclassGroups(CHOICES, [{ name: 'State', id: M1_STATE.id }]));
        expect(out).not.toContain('metamodel_1/State=c1_State');
        expect(out).toContain('metamodel_2/State=c2_State');
    });

    it('with both homonyms pinned neither is offered, the other classes still are', () => {
        const out = flat(metaclassGroups(CHOICES, [
            { name: 'State', id: M1_STATE.id },
            { name: 'State', id: M2_STATE.id },
        ]));
        expect(out).toEqual(['metamodel_1/Machine=c1_Machine', 'metamodel_2/Event=c2_Event']);
    });

    it('a name listed WITHOUT a pin excludes every homonym (it already means every class with that name)', () => {
        const out = flat(metaclassGroups(CHOICES, [{ name: 'State' }]));
        expect(out).toEqual(['metamodel_1/Machine=c1_Machine', 'metamodel_2/Event=c2_Event']);
    });

    it('a group left without options is dropped', () => {
        const out = metaclassGroups(CHOICES, [
            { name: 'Event', id: M2_EVENT.id },
            { name: 'State', id: M2_STATE.id },
        ]);
        expect(out.map((g) => g.label)).toEqual(['metamodel_1']);
    });
});

describe('metaclassChipLabel — qualified only when the name is ambiguous', () => {
    it('a name declared by one metamodel is bare, pinned or not', () => {
        expect(metaclassChipLabel({ name: 'Machine' }, CHOICES)).toBe('Machine');
        expect(metaclassChipLabel({ name: 'Machine', id: M1_MACHINE.id }, CHOICES)).toBe('Machine');
    });

    it('a homonym with an id reads metamodel.Name, each entry with its own metamodel', () => {
        expect(metaclassChipLabel({ name: 'State', id: M1_STATE.id }, CHOICES)).toBe('metamodel_1.State');
        expect(metaclassChipLabel({ name: 'State', id: M2_STATE.id }, CHOICES)).toBe('metamodel_2.State');
    });

    it('a homonym without an id stays bare: inventing a metamodel would be a guess', () => {
        expect(metaclassChipLabel({ name: 'State' }, CHOICES)).toBe('State');
    });

    it('an id no choice carries any more (class gone) reads bare', () => {
        expect(metaclassChipLabel({ name: 'State', id: 'c9_gone' }, CHOICES)).toBe('State');
    });
});

describe('withMetaclassChoice — add from the picker', () => {
    it('a new name is appended and its id pinned as the plain string', () => {
        const out = withMetaclassChoice(draft([]), M1_STATE)!;
        expect(out.metaclasses).toEqual(['State']);
        expect(out.authoringMetaclassPins).toEqual({ State: M1_STATE.id });
    });

    it('a homonym of a pinned name appends its id: the string becomes a two-element array', () => {
        const out = withMetaclassChoice(draft(['State'], { State: M1_STATE.id }), M2_STATE)!;
        expect(out.metaclasses).toEqual(['State']);
        expect(out.authoringMetaclassPins).toEqual({ State: [M1_STATE.id, M2_STATE.id] });
    });

    it('a third identity is appended to the array, in order', () => {
        const third: MetaclassChoice = { id: 'c3_State', name: 'State', metamodelName: 'metamodel_3' };
        const out = withMetaclassChoice(draft(['State'], { State: [M1_STATE.id, M2_STATE.id] }), third)!;
        expect(out.authoringMetaclassPins).toEqual({ State: [M1_STATE.id, M2_STATE.id, third.id] });
    });

    it('a class already pinned (string or array) is a no-op', () => {
        expect(withMetaclassChoice(draft(['State'], { State: M1_STATE.id }), M1_STATE)).toBeNull();
        expect(withMetaclassChoice(draft(['State'], { State: [M1_STATE.id, M2_STATE.id] }), M2_STATE)).toBeNull();
    });

    it('a name listed WITHOUT a pin is a no-op: an unpinned name must not be narrowed silently', () => {
        expect(withMetaclassChoice(draft(['State']), M2_STATE)).toBeNull();
    });

    it('an unknown class id is a no-op', () => {
        expect(withMetaclassChoice(draft(['State'], { State: M1_STATE.id }), undefined)).toBeNull();
    });

    it('other names keep their pins', () => {
        const out = withMetaclassChoice(draft(['Machine'], { Machine: M1_MACHINE.id }), M1_STATE)!;
        expect(out.metaclasses).toEqual(['Machine', 'State']);
        expect(out.authoringMetaclassPins).toEqual({ Machine: M1_MACHINE.id, State: M1_STATE.id });
    });

    it('an ir with one identity per name is written byte-identically to before (key order kept)', () => {
        const before = { metaclasses: ['Machine'], authoringMetaclassPins: { Machine: M1_MACHINE.id }, priority: 3 };
        const out = withMetaclassChoice(before as Draft, M1_STATE)!;
        expect(JSON.stringify(out)).toBe(
            '{"metaclasses":["Machine","State"],"authoringMetaclassPins":{"Machine":"c1_Machine","State":"c1_State"},"priority":3}',
        );
    });
});

describe('withoutMetaclassEntry — remove a row', () => {
    it('one identity of two: the other remains, collapsed to the plain string; the name stays listed', () => {
        const out = withoutMetaclassEntry(
            draft(['State'], { State: [M1_STATE.id, M2_STATE.id] }),
            { name: 'State', id: M1_STATE.id },
        );
        expect(out.metaclasses).toEqual(['State']);
        expect(out.authoringMetaclassPins).toEqual({ State: M2_STATE.id });
    });

    it('one identity of three: an array of two remains, order kept', () => {
        const out = withoutMetaclassEntry(
            draft(['State'], { State: ['a', 'b', 'c'] }),
            { name: 'State', id: 'b' },
        );
        expect(out.authoringMetaclassPins).toEqual({ State: ['a', 'c'] });
    });

    it('the last identity: the name leaves the list and the pin key is dropped', () => {
        const out = withoutMetaclassEntry(
            draft(['State', 'Machine'], { State: M1_STATE.id, Machine: M1_MACHINE.id }),
            { name: 'State', id: M1_STATE.id },
        );
        expect(out.metaclasses).toEqual(['Machine']);
        expect(out.authoringMetaclassPins).toEqual({ Machine: M1_MACHINE.id });
    });

    it('the last identity of the last name: the pin map is dropped as a KEY, not written as {}', () => {
        const out = withoutMetaclassEntry(draft(['State'], { State: M1_STATE.id }), { name: 'State', id: M1_STATE.id });
        expect(out.metaclasses).toEqual([]);
        expect('authoringMetaclassPins' in out).toBe(false);
    });

    it('an entry without id removes the name and any pin under it', () => {
        const out = withoutMetaclassEntry(draft(['State', 'Machine']), { name: 'State' });
        expect(out.metaclasses).toEqual(['Machine']);
        expect('authoringMetaclassPins' in out).toBe(false);
    });

    it('an entry without id drops a stray pin of that name too, keeping other pins', () => {
        const out = withoutMetaclassEntry(
            draft(['State', 'Machine'], { State: [], Machine: M1_MACHINE.id }),
            { name: 'State' },
        );
        expect(out.metaclasses).toEqual(['Machine']);
        expect(out.authoringMetaclassPins).toEqual({ Machine: M1_MACHINE.id });
    });

    it('an entry that is not in the draft is a no-op (same object back)', () => {
        const d = draft(['State'], { State: M1_STATE.id });
        expect(withoutMetaclassEntry(d, { name: 'Machine' })).toBe(d);
        expect(withoutMetaclassEntry(d, { name: 'State', id: M2_STATE.id })).toBe(d);
    });

    it('does not touch the other fields of the ir', () => {
        const d = { metaclasses: ['State'], authoringMetaclassPins: { State: [M1_STATE.id, M2_STATE.id] }, priority: 7 } as Draft;
        expect(withoutMetaclassEntry(d, { name: 'State', id: M1_STATE.id }).priority).toBe(7);
    });
});

describe('the panel round trip — patch = withMetaclassPins(draft, next)', () => {
    // What a host panel does: the handler computes `next`, `patch` reconciles it.
    const CTX = { candidates: CHOICES.map((c) => ({ id: c.id, name: c.name })) };
    const patchOf = (prev: Draft, next: Draft) => withMetaclassPins(prev, next, CTX);

    it('add metamodel_1.State, add metamodel_2.State, remove one, remove the other', () => {
        let d: Draft = draft([]);

        d = patchOf(d, withMetaclassChoice(d, M1_STATE)!);
        expect(d.authoringMetaclassPins).toEqual({ State: M1_STATE.id });
        // The homonym is still offered.
        expect(metaclassGroups(CHOICES, metaclassEntries(d.metaclasses as string[], d.authoringMetaclassPins))
            .flatMap((g) => g.options.map((o) => o.value))).toContain(M2_STATE.id);

        d = patchOf(d, withMetaclassChoice(d, M2_STATE)!);
        expect(d.metaclasses).toEqual(['State']);
        expect(d.authoringMetaclassPins).toEqual({ State: [M1_STATE.id, M2_STATE.id] });
        expect(metaclassEntries(d.metaclasses as string[], d.authoringMetaclassPins)
            .map((e) => metaclassChipLabel(e, CHOICES))).toEqual(['metamodel_1.State', 'metamodel_2.State']);

        d = patchOf(d, withoutMetaclassEntry(d, { name: 'State', id: M1_STATE.id }));
        expect(d.metaclasses).toEqual(['State']);
        expect(d.authoringMetaclassPins).toEqual({ State: M2_STATE.id });
        // The removed one is offered again.
        expect(metaclassGroups(CHOICES, metaclassEntries(d.metaclasses as string[], d.authoringMetaclassPins))
            .flatMap((g) => g.options.map((o) => o.value))).toContain(M1_STATE.id);

        d = patchOf(d, withoutMetaclassEntry(d, { name: 'State', id: M2_STATE.id }));
        expect(d.metaclasses).toEqual([]);
        expect('authoringMetaclassPins' in d).toBe(false);
    });

    it('adding a homonym does not go through the reconciler and is not undone by it', () => {
        // `metaclasses` does not move on the second add, so withMetaclassPins returns
        // the handler's patch as it came.
        const d = draft(['State'], { State: M1_STATE.id });
        const next = withMetaclassChoice(d, M2_STATE)!;
        expect(patchOf(d, next)).toBe(next);
    });
});
