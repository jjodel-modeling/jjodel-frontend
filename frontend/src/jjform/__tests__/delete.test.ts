/**
 * Tests of `jjform/delete` - the pure half of the delete event (slice 12d).
 *
 * Same fixture as `create.test.ts`, the contract's own `metamodelShape` example:
 * `StateMachine` (root, two child slots), `State` (contained, required `name`),
 * `Transition` (contained, two REQUIRED references at `1..1`). The required
 * references are what makes this the right fixture for a delete: they are exactly
 * the cardinality the simulation's message says would break.
 */

import { describe, expect, it } from 'vitest';
import type { MetamodelShape, RefShape } from '../shape';
import {
    deletePlan,
    deletePreflight,
    deleteVerdict,
    type PreflightInput,
    type ReferrerInput,
} from '../delete';

const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key,
    lower: 0,
    upper: -1,
    many: true,
    required: false,
    derived: false,
    readOnly: false,
    ofId: 'c_' + o.of,
    composition: false,
    ...o,
});

const SHAPE: MetamodelShape = {
    enums: {},
    classes: {
        StateMachine: {
            key: 'StateMachine', id: 'c_StateMachine',
            root: true, abstract: false, singleton: false, containedIn: [],
            attrs: [], refs: [],
            children: [
                ref({ key: 'states', of: 'State', composition: true }),
                ref({ key: 'transitions', of: 'Transition', composition: true }),
            ],
        },
        State: {
            key: 'State', id: 'c_State',
            root: false, abstract: false, singleton: false, containedIn: ['StateMachine'],
            attrs: [], refs: [], children: [],
        },
        Transition: {
            key: 'Transition', id: 'c_Transition',
            root: false, abstract: false, singleton: false, containedIn: ['StateMachine'],
            attrs: [], refs: [
                ref({ key: 'source', of: 'State', lower: 1, upper: 1, many: false, required: true }),
                ref({ key: 'target', of: 'State', lower: 1, upper: 1, many: false, required: true }),
            ],
            children: [],
        },
        Config: {
            key: 'Config', id: 'c_Config',
            root: true, abstract: false, singleton: true, containedIn: [],
            attrs: [], refs: [], children: [],
        },
    },
};

const referrer = (o: Partial<ReferrerInput> & { instanceId: string; featureKey: string }): ReferrerInput => ({
    instanceName: o.instanceId,
    instanceClass: 'Transition',
    featureId: 'r_' + o.featureKey,
    pointsAt: 's1',
    index: 0,
    lower: 1,
    upper: 1,
    slotCount: 1,
    ...o,
});

const input = (o: Partial<PreflightInput> = {}): PreflightInput => ({
    id: 's1',
    name: 'red',
    cls: 'State',
    referrers: [],
    descendants: [],
    candidates: [],
    ...o,
});

describe('deletePreflight - the unreferenced case is a simple confirmation', () => {
    it('reports nothing to deal with, and says the delete is final', () => {
        const pre = deletePreflight(SHAPE, input());
        expect(pre.referencedBy).toEqual([]);
        expect(pre.descendants).toEqual([]);
        expect(pre.simple).toBe(true);
        expect(pre.canReassign).toBe(false);
        expect(pre.title).toBe('Delete red?');
        expect(pre.message).toBe('This cannot be undone.');
        expect(pre.dirtyLabel).toBe('Delete');
    });

    it('falls back to the id when the instance has no name', () => {
        const pre = deletePreflight(SHAPE, input({ name: '' }));
        expect(pre.title).toBe('Delete s1?');
    });
});

describe('deletePreflight - the referenced case lists the referrers BY NAME', () => {
    const pre = deletePreflight(SHAPE, input({
        referrers: [
            referrer({ instanceId: 't1', instanceName: 'go', featureKey: 'source' }),
            referrer({ instanceId: 't2', instanceName: 'back', featureKey: 'target' }),
        ],
        candidates: [{ id: 's2', label: 'green' }],
    }));

    it('carries a name and a feature for every pointer, never an id alone', () => {
        expect(pre.referencedBy.map(r => `${r.instanceName}.${r.featureKey}`))
            .toEqual(['go.source', 'back.target']);
    });

    it('counts them in the message with the metaclass they share', () => {
        expect(pre.message).toBe('red : State is referenced by 2 Transitions - cardinality 1..1 would break.');
    });

    it('offers the reassign only when there is something to point at', () => {
        expect(pre.canReassign).toBe(true);
        expect(deletePreflight(SHAPE, input({
            referrers: [referrer({ instanceId: 't1', featureKey: 'source' })],
            candidates: [],
        })).canReassign).toBe(false);
    });

    it('labels the dirty delete with what it will invalidate', () => {
        expect(pre.dirtyLabel).toBe('Delete anyway - 2 Transitions become invalid');
        expect(pre.clearLabel).toBe('Clear the 2 references, then delete');
    });

    it('says «instance» rather than mislabelling a mixed set', () => {
        const mixed = deletePreflight(SHAPE, input({
            referrers: [
                referrer({ instanceId: 't1', featureKey: 'source', instanceClass: 'Transition' }),
                referrer({ instanceId: 'x1', featureKey: 'uses', instanceClass: 'Widget' }),
            ],
        }));
        expect(mixed.message).toContain('referenced by 2 instances');
    });

    it('singular for one referrer', () => {
        const one = deletePreflight(SHAPE, input({
            referrers: [referrer({ instanceId: 't1', instanceName: 'go', featureKey: 'source' })],
        }));
        expect(one.message).toBe('red : State is referenced by 1 Transition - cardinality 1..1 would break.');
        expect(one.clearLabel).toBe('Clear the reference, then delete');
    });
});

describe('deletePreflight - wouldBreak is per SLOT, not per pointer', () => {
    it('breaks a 1..1 slot that loses its only value', () => {
        const pre = deletePreflight(SHAPE, input({
            referrers: [referrer({ instanceId: 't1', featureKey: 'source', lower: 1, slotCount: 1 })],
        }));
        expect(pre.referencedBy[0].wouldBreak).toBe(true);
        expect(pre.referencedBy[0].multiplicity).toBe('1..1');
    });

    it('does NOT break a 1..* slot that keeps two of its three values', () => {
        const pre = deletePreflight(SHAPE, input({
            referrers: [referrer({
                instanceId: 't1', featureKey: 'members', lower: 1, upper: -1, slotCount: 3,
            })],
        }));
        expect(pre.referencedBy[0].wouldBreak).toBe(false);
        expect(pre.message).toBe('red : State is referenced by 1 Transition.');
    });

    it('counts the pointers of ONE slot together: two of three leaves one, still enough', () => {
        const pre = deletePreflight(SHAPE, input({
            referrers: [
                referrer({ instanceId: 't1', featureKey: 'members', index: 0, lower: 1, upper: -1, slotCount: 3 }),
                referrer({ instanceId: 't1', featureKey: 'members', index: 2, lower: 1, upper: -1, slotCount: 3 }),
            ],
        }));
        expect(pre.referencedBy.map(r => r.wouldBreak)).toEqual([false, false]);
    });

    it('and breaks when all three of a 1..* slot point at the dying set', () => {
        const pre = deletePreflight(SHAPE, input({
            referrers: [0, 1, 2].map(i => referrer({
                instanceId: 't1', featureKey: 'members', index: i, lower: 1, upper: -1, slotCount: 3,
            })),
        }));
        expect(pre.referencedBy.every(r => r.wouldBreak)).toBe(true);
    });
});

describe('deletePreflight - the containment cascade is declared, with its referrers', () => {
    const pre = deletePreflight(SHAPE, input({
        id: 'm1', name: 'traffic light', cls: 'StateMachine',
        descendants: [
            { id: 's1', name: 'red', cls: 'State', childKey: 'states', depth: 1 },
            { id: 's2', name: 'green', cls: 'State', childKey: 'states', depth: 1 },
            { id: 'x1', name: 'deep', cls: 'State', childKey: 'states', depth: 2 },
        ],
        referrers: [referrer({ instanceId: 't9', instanceName: 'outside', featureKey: 'source', pointsAt: 's1' })],
    }));

    it('lists every descendant that falls, with its count in the message', () => {
        expect(pre.descendants.map(d => d.name)).toEqual(['red', 'green', 'deep']);
        expect(pre.message).toContain('Containment cascades: its 3 contained elements will be deleted too.');
    });

    it('keeps a pointer aimed at a DESCENDANT, and flags it as such (rule 3)', () => {
        expect(pre.referencedBy).toHaveLength(1);
        expect(pre.referencedBy[0].viaDescendant).toBe(true);
    });

    it('does not flag a pointer aimed at the target itself', () => {
        const direct = deletePreflight(SHAPE, input({
            referrers: [referrer({ instanceId: 't1', featureKey: 'source', pointsAt: 's1' })],
        }));
        expect(direct.referencedBy[0].viaDescendant).toBe(false);
    });

    it('says only the cascade when nothing points in', () => {
        const only = deletePreflight(SHAPE, input({
            descendants: [{ id: 's1', name: 'red', cls: 'State', childKey: 'states', depth: 1 }],
        }));
        expect(only.message).toBe('Containment cascades: its 1 contained element will be deleted too.');
        expect(only.simple).toBe(false);
    });
});

describe('deletePreflight - what the host refuses is declared, not discovered', () => {
    it('carries the blocked sentence through', () => {
        const pre = deletePreflight(SHAPE, input({
            cls: 'Config', blocked: 'Config is a singleton - remove the singleton flag first',
        }));
        expect(pre.blocked).toBe('Config is a singleton - remove the singleton flag first');
    });

    it('a singleton is never a simple confirmation, even with nothing pointing at it', () => {
        expect(deletePreflight(SHAPE, input({ cls: 'Config' })).simple).toBe(false);
    });
});

describe('deleteVerdict - the options ARE the verdict', () => {
    it('reads the three shapes of the option object', () => {
        expect(deleteVerdict({ reassignTo: 's2' })).toBe('reassign');
        expect(deleteVerdict({ clearRefs: true })).toBe('clear');
        expect(deleteVerdict({})).toBe('dirty');
        expect(deleteVerdict()).toBe('dirty');
    });

    it('an empty reassign target is not a reassign', () => {
        expect(deleteVerdict({ reassignTo: '' })).toBe('dirty');
    });
});

describe('deletePlan - reassign', () => {
    const pre = deletePreflight(SHAPE, input({
        referrers: [
            referrer({ instanceId: 't1', instanceName: 'go', featureKey: 'source', index: 0 }),
            referrer({ instanceId: 't2', instanceName: 'back', featureKey: 'target', index: 1 }),
        ],
        candidates: [{ id: 's2', label: 'green' }, { id: 's3', label: 'amber' }],
    }));

    it('repoints every pointer, one step each, at the chosen target', () => {
        const plan = deletePlan(pre, { reassignTo: 's2' });
        expect(plan.verdict).toBe('reassign');
        expect(plan.reassign).toEqual([
            { instanceId: 't1', featureKey: 'source', index: 0, to: 's2' },
            { instanceId: 't2', featureKey: 'target', index: 1, to: 's2' },
        ]);
        expect(plan.clear).toEqual([]);
    });

    it('leaves nothing invalid - that is the whole reason it is offered first', () => {
        expect(deletePlan(pre, { reassignTo: 's2' }).invalidates).toEqual([]);
    });

    it('REFUSES a target outside the candidate set rather than silently going dirty', () => {
        const plan = deletePlan(pre, { reassignTo: 'somewhere_else' });
        expect(plan.blocked).toBe('"somewhere_else" is not a valid target for this reference');
        expect(plan.deletes).toEqual([]);
        expect(plan.reassign).toEqual([]);
    });
});

describe('deletePlan - clear and dirty are DIFFERENT writes', () => {
    const pre = deletePreflight(SHAPE, input({
        referrers: [
            referrer({ instanceId: 't1', featureKey: 'source', index: 0 }),
            referrer({ instanceId: 't2', featureKey: 'target', index: 3 }),
        ],
        candidates: [{ id: 's2', label: 'green' }],
    }));

    it('clear writes one step per pointer, at the position it sits in', () => {
        const plan = deletePlan(pre, { clearRefs: true });
        expect(plan.verdict).toBe('clear');
        expect(plan.clear).toEqual([
            { instanceId: 't1', featureKey: 'source', index: 0 },
            { instanceId: 't2', featureKey: 'target', index: 3 },
        ]);
        expect(plan.reassign).toEqual([]);
    });

    it('dirty writes NOTHING first: the core cascade removes the pointers by value', () => {
        const plan = deletePlan(pre, {});
        expect(plan.verdict).toBe('dirty');
        expect(plan.clear).toEqual([]);
        expect(plan.reassign).toEqual([]);
    });

    it('both declare the referrers they invalidate (contract section 2)', () => {
        expect(deletePlan(pre, { clearRefs: true }).invalidates).toHaveLength(2);
        expect(deletePlan(pre, {}).invalidates).toHaveLength(2);
    });

    it('and declare nothing when no cardinality is violated', () => {
        const loose = deletePreflight(SHAPE, input({
            referrers: [referrer({ instanceId: 't1', featureKey: 'tags', lower: 0, upper: -1, slotCount: 2 })],
        }));
        expect(deletePlan(loose, {}).invalidates).toEqual([]);
    });
});

describe('deletePlan - the deletes are ordered deepest first, the target last', () => {
    it('sorts the cascade by depth and puts the container at the end', () => {
        const pre = deletePreflight(SHAPE, input({
            id: 'm1', cls: 'StateMachine',
            descendants: [
                { id: 'a', name: 'a', cls: 'State', childKey: 'states', depth: 1 },
                { id: 'c', name: 'c', cls: 'State', childKey: 'states', depth: 3 },
                { id: 'b', name: 'b', cls: 'State', childKey: 'states', depth: 2 },
            ],
        }));
        expect(deletePlan(pre, {}).deletes).toEqual(['c', 'b', 'a', 'm1']);
    });

    it('a childless instance is one delete', () => {
        expect(deletePlan(deletePreflight(SHAPE, input()), {}).deletes).toEqual(['s1']);
    });

    it('a blocked preflight plans nothing at all', () => {
        const pre = deletePreflight(SHAPE, input({ blocked: 'singleton' }));
        const plan = deletePlan(pre, {});
        expect(plan.blocked).toBe('singleton');
        expect(plan.deletes).toEqual([]);
        expect(plan.clear).toEqual([]);
    });
});
