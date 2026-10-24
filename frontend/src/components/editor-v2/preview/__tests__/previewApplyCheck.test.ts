import { describe, expect, it } from 'vitest';
import { createdCounts, effectsMismatch, plannedCounts } from '../previewApplyCheck';

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
