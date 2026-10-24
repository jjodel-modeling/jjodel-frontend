import { describe, expect, it } from 'vitest';
import { createdCounts, effectsMismatch, otherLevelEffects, plannedCounts } from '../previewApplyCheck';

const el = (id: string, className: string) => ({ id, name: id, className, root: true });
const world = (...elements: ReturnType<typeof el>[]) => ({ classes: {}, elements }) as any;
const plan = (...metaclasses: string[]) => ({
    created: metaclasses.map((metaclass, i) => ({ line: i + 1, id: `planned:${i}`, metaclass, name: `n${i}`, container: null })),
    features: [], references: [], renamed: [], deleted: [], warnings: [], errors: [], error: null,
}) as any;

describe('planned against real effects of an Apply', () => {
    it('counts the planned creations per metaclass', () => {
        expect(plannedCounts(plan('State', 'State', 'Transition'))).toEqual({ State: 2, Transition: 1 });
        expect(plannedCounts(plan())).toEqual({});
    });

    it('counts only the objects the run added, per metaclass', () => {
        const before = world(el('a', 'State'), el('b', 'Transition'));
        const after = world(el('a', 'State'), el('b', 'Transition'), el('c', 'State'), el('d', 'State'), el('e', 'Transition'));
        expect(createdCounts(before, after)).toEqual({ State: 2, Transition: 1 });
        expect(createdCounts(after, after)).toEqual({});
    });

    it('agreeing counts give no mismatch', () => {
        expect(effectsMismatch({ State: 2 }, { State: 2 })).toBeNull();
        expect(effectsMismatch({}, {})).toBeNull();
    });

    it('a missing, a fewer and an unplanned metaclass are each reported, in name order', () => {
        expect(effectsMismatch({ State: 3, Region: 1 }, { State: 2, Transition: 1 }))
            .toBe('planned +1 Region, created +0 Region; planned +3 State, created +2 State; planned +0 Transition, created +1 Transition');
    });
});

const m2el = (id: string, kind: string) => ({ id, name: id, kind, father: 'mm' });
const m2world = (...elements: ReturnType<typeof m2el>[]) => ({ classes: {}, elements: [], level: 'M2', m2: { id: 'mm', name: 'MM', defaultParent: 'mm', elements } }) as any;
const mixed = (level: 'M1' | 'M2') => ({
    ...plan(),
    level,
    created: [
        { line: 1, id: 'planned:1', metaclass: 'Class', name: 'Pet', container: null, level: 'M2' },
        { line: 2, id: 'planned:2', metaclass: 'Attribute', name: 'legs', container: 'Pet', level: 'M2' },
        { line: 3, id: 'planned:3', metaclass: 'Person', name: 'bob', container: null },
    ],
    features: [{ line: 4, owner: 'bob', ownerId: 'b', feature: 'name', value: 'Bob', many: false }],
    generalizations: [{ line: 5, child: 'Pet', childId: 'planned:1', parent: 'Animal', parentId: 'a', parentCreated: false }],
}) as any;

describe('planned against real effects on M2 (P-2026-10-24-1600)', () => {
    it('the planned count reads the level of the plan', () => {
        expect(plannedCounts(mixed('M2'))).toEqual({ Class: 1, Attribute: 1 });
        expect(plannedCounts(mixed('M1'))).toEqual({ Person: 1 });
    });

    it('on an M2 world the created count reads the metamodel elements per kind', () => {
        const before = m2world(m2el('p', 'Package'), m2el('c', 'Class'));
        const after = m2world(m2el('p', 'Package'), m2el('c', 'Class'), m2el('c2', 'Class'), m2el('a', 'Attribute'));
        expect(createdCounts(before, after)).toEqual({ Class: 1, Attribute: 1 });
    });

    it('the effects on the other level are counted, generalizations on M2', () => {
        expect(otherLevelEffects(mixed('M2'))).toBe(2);
        expect(otherLevelEffects(mixed('M1'))).toBe(3);
        expect(otherLevelEffects(plan('State'))).toBe(0);
    });
});
