/**
 * PlanWorld builder (S4b, R-JJD-2): the planner's world read from a plain D-layer `idlookup`.
 *
 * The fixture is a metamodel (package, two classes, one inheriting) and a model with a root
 * machine containing a state, plus an object of another model that must stay out.
 */
import { describe, it, expect } from 'vitest';
import { buildPlanWorld } from '../planWorld';
import { planEffects } from '../effectsPlanner';

function idlookup(): Record<string, any> {
    return {
        mm: { id: 'mm', className: 'DModel', name: 'MM' },
        pkg: { id: 'pkg', className: 'DPackage', father: 'mm' },
        cNamed: { id: 'cNamed', className: 'DClass', name: 'Named', father: 'pkg', abstract: true, attributes: ['aName'], references: [] },
        cMachine: { id: 'cMachine', className: 'DClass', name: 'Machine', father: 'pkg', extends: ['cNamed'], attributes: [], references: ['rStates'] },
        cState: { id: 'cState', className: 'DClass', name: 'State', father: 'pkg', isSingleton: false, extends: ['cNamed'], attributes: ['aTags'], references: ['rOut', 'rIn'] },
        aName: { id: 'aName', className: 'DAttribute', name: 'name', upperBound: 1 },
        aTags: { id: 'aTags', className: 'DAttribute', name: 'tags', upperBound: -1 },
        rStates: { id: 'rStates', className: 'DReference', name: 'states', type: 'cState', composition: true, upperBound: -1 },
        rOut: { id: 'rOut', className: 'DReference', name: 'next', type: 'cState', upperBound: 1, opposite: 'rIn' },
        rIn: { id: 'rIn', className: 'DReference', name: 'prev', type: 'cState', aggregation: true, upperBound: 1, opposite: 'rOut' },
        // Another metamodel's class of the same name: not part of this world.
        otherMm: { id: 'otherMm', className: 'DModel', name: 'Other' },
        cOther: { id: 'cOther', className: 'DClass', name: 'Gadget', father: 'otherMm', attributes: [], references: [] },

        m: { id: 'm', className: 'DModel', instanceof: 'mm', objects: ['o1'] },
        o1: { id: 'o1', className: 'DObject', instanceof: 'cMachine', father: 'm', name: 'M', features: ['v1'] },
        v1: { id: 'v1', className: 'DValue', instanceof: 'rStates', father: 'o1', values: ['o2', null] },
        o2: { id: 'o2', className: 'DObject', instanceof: 'cState', father: 'v1', name: 'old', features: ['v2', 'v3'] },
        v2: { id: 'v2', className: 'DValue', instanceof: 'aName', father: 'o2', values: ['Idle'] },
        v3: { id: 'v3', className: 'DValue', instanceof: 'rOut', father: 'o2', values: [] },
        // An object of another model.
        m2: { id: 'm2', className: 'DModel', instanceof: 'mm', objects: ['x'] },
        x: { id: 'x', className: 'DObject', instanceof: 'cState', father: 'm2', name: 'Stranger', features: [] },
    };
}

describe('buildPlanWorld', () => {
    it('reads the metamodel classes, inherited features included, own first', () => {
        const w = buildPlanWorld(idlookup(), 'm');
        expect(Object.keys(w.classes).sort()).toEqual(['Machine', 'Named', 'State']);
        const state = w.classes.State;
        expect(state.kinds).toEqual(['State', 'Named']);
        expect(state.attributes).toEqual([{ name: 'tags', upper: -1 }, { name: 'name', upper: 1 }]);
        expect(w.classes.Named.abstract).toBe(true);
        expect(w.classes.State.abstract).toBe(false);
    });

    it('reads containment from composition or aggregation, type and opposite by name', () => {
        const w = buildPlanWorld(idlookup(), 'm');
        expect(w.classes.Machine.references).toEqual([{ name: 'states', containment: true, upper: -1, type: 'State' }]);
        expect(w.classes.State.references).toEqual([
            { name: 'next', containment: false, upper: 1, type: 'State', opposite: 'prev' },
            { name: 'prev', containment: true, upper: 1, type: 'State', opposite: 'next' },
        ]);
    });

    it('reads roots and contained elements of the model only, names by the slot first', () => {
        const w = buildPlanWorld(idlookup(), 'm');
        expect(w.elements.map((e) => e.id).sort()).toEqual(['o1', 'o2']);
        const o1 = w.elements.find((e) => e.id === 'o1')!;
        const o2 = w.elements.find((e) => e.id === 'o2')!;
        expect(o1).toMatchObject({ name: 'M', className: 'Machine', root: true });
        expect(o1.container).toBeUndefined();
        expect(o1.references).toEqual({ states: ['o2'] });
        expect(o2).toMatchObject({ name: 'Idle', className: 'State', root: false, container: { owner: 'o1', feature: 'states' } });
        expect(o2.references).toEqual({ next: [] });
    });

    it('is empty for an id that is not a model with a metamodel', () => {
        expect(buildPlanWorld(idlookup(), 'mm')).toEqual({ classes: {}, elements: [] });
        expect(buildPlanWorld(idlookup(), 'nope')).toEqual({ classes: {}, elements: [] });
    });

    it('does not write the lookup it reads', () => {
        const lookup = idlookup();
        const before = JSON.stringify(lookup);
        buildPlanWorld(lookup, 'm');
        expect(JSON.stringify(lookup)).toBe(before);
    });

    it('feeds the planner: a create inside an existing container, and one end of an opposite pair', async () => {
        const plan = await planEffects([
            'create instance of State "Busy" in M.states',
            'set Busy.next = Idle',
        ].join('\n'), buildPlanWorld(idlookup(), 'm'));
        expect(plan.errors).toEqual([]);
        expect(plan.created).toMatchObject([{ metaclass: 'State', name: 'Busy', container: 'M.states' }]);
        expect(plan.references).toMatchObject([{ source: 'Busy', feature: 'next', targetId: 'o2' }]);
        expect(plan.warnings.map((w) => w.code)).toEqual(['OPPOSITE_ONE_END']);
    });
});
