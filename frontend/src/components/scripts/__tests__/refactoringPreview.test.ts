/**
 * The Refactoring tab's metamodel view (P-2026-10-24-2320): the world as boxes, the plan's effects
 * as statuses, the grid layout, the chips and the impact line. Planned by the real `planEffects`.
 */
import { describe, it, expect } from 'vitest';
import { planEffects, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import { columnsFor, effectChips, layoutView, metamodelView, modelImpact } from '../refactoringPreview';

const world: PlanWorld = {
    level: 'M2',
    classes: {},
    elements: [],
    m2: {
        id: 'mm', name: 'MM', defaultParent: 'pkg',
        elements: [
            { id: 'pkg', name: 'p', kind: 'Package', father: 'mm' },
            { id: 'cNamed', name: 'Named', kind: 'Class', father: 'pkg', abstract: true, extends: [] },
            { id: 'cPerson', name: 'Person', kind: 'Class', father: 'pkg', extends: ['cNamed'] },
            { id: 'aAge', name: 'age', kind: 'Attribute', father: 'cPerson', type: 'tInt', upper: 1 },
            { id: 'rFriend', name: 'friend', kind: 'Reference', father: 'cPerson', type: 'cPerson', upper: 1 },
            { id: 'eColor', name: 'Color', kind: 'Enumeration', father: 'pkg' },
        ],
        slotValues: { aAge: [{ modelId: 'org', model: 'org', count: 12 }, { modelId: 'demo', model: 'demo', count: 2 }] },
    },
};
const typeName = (id: string) => (id === 'tInt' ? 'EInt' : undefined);
const status = (v: ReturnType<typeof metamodelView>) =>
    Object.fromEntries(v.classes.map((c) => [c.name, [c.status, ...c.features.map((f) => `${f.name}:${f.status}`)]]));

describe('metamodelView', () => {
    it('without a plan: classes, enums, features typed by the world or the caller, generalizations kept', () => {
        const v = metamodelView(world, null, typeName);
        expect(status(v)).toEqual({ Named: ['kept'], Person: ['kept', 'age:kept', 'friend:kept'], Color: ['kept'] });
        expect(v.classes[1].features.map((f) => f.type)).toEqual(['EInt', 'Person']);
        expect(v.generalizations).toEqual([{ childId: 'cPerson', parentId: 'cNamed', status: 'kept' }]);
    });

    it('with a plan: added class and features, a removed feature, a rename, an added generalization', async () => {
        const plan = await planEffects([
            'create class Student extends Person',
            'create attribute school in Student type String',
            'create attribute nick in Person',
            'delete attribute Person.age',
            'rename Color to Colour',
        ].join('\n'), world);
        const v = metamodelView(world, plan, typeName);
        expect(status(v)).toEqual({
            Named: ['kept'], Person: ['kept', 'age:removed', 'friend:kept', 'nick:added'], Colour: ['renamed'], Student: ['added', 'school:added'],
        });
        expect(v.classes.find((c) => c.name === 'Colour')!.from).toBe('Color');
        expect(v.generalizations.map((g) => g.status)).toEqual(['kept', 'added']);
        expect(v.generalizations[1]).toEqual({ childId: 'planned:1', parentId: 'cPerson', status: 'added' });
    });

    it('a deleted class strikes its features and its generalizations; created-then-deleted leaves nothing', async () => {
        const plan = await planEffects('delete class Person\ncreate class Tmp\ndelete class Tmp', world);
        const v = metamodelView(world, plan, typeName);
        expect(status(v)).toEqual({ Named: ['kept'], Person: ['removed', 'age:removed', 'friend:removed'], Color: ['kept'] });
        expect(v.generalizations.map((g) => g.status)).toEqual(['removed']);
    });
});

describe('layoutView', () => {
    it('places parents first, rows as tall as their tallest box, edges from child border to parent border', async () => {
        const plan = await planEffects('create class Student extends Person', world);
        const l = layoutView(metamodelView(world, plan), 2);
        expect(l.boxes.map((b) => b.id)).toEqual(['cNamed', 'cPerson', 'eColor', 'planned:1']);
        expect(l.boxes.map((b) => [b.x, b.y])).toEqual([[16, 16], [236, 16], [16, 128], [236, 128]]);
        const e = l.edges.find((x) => x.childId === 'planned:1')!;
        expect([e.x1, e.y1, e.x2, e.y2]).toEqual([326, 128, 326, 88]);
        const reversed: PlanWorld = { ...world, m2: { ...world.m2!, elements: [...world.m2!.elements].reverse() } };
        expect(layoutView(metamodelView(reversed, null), 3).boxes.map((b) => b.id)).toEqual(['eColor', 'cNamed', 'cPerson']);
        expect(columnsFor(500)).toBe(2);
        expect(columnsFor(100)).toBe(1);
    });
});

describe('the bar', () => {
    it('chips per kind and the impact summed per model', async () => {
        const plan = await planEffects([
            'create class Student extends Person',
            'create attribute nick in Person',
            'delete attribute Person.age',
            'rename Color to Colour',
        ].join('\n'), world);
        expect(effectChips(plan).map((c) => c.label)).toEqual(['+1 class', '+1 feature', '+1 generalization', '−1 element', '1 rename']);
        expect(modelImpact(plan)).toEqual(['org loses 12 slot values', 'demo loses 2 slot values']);
    });

    it('the impact sums one model over several lines', async () => {
        const w: PlanWorld = { ...world, m2: { ...world.m2!, slotValues: { ...world.m2!.slotValues, rFriend: [{ modelId: 'org', model: 'org', count: 3 }] } } };
        const plan = await planEffects('delete attribute Person.age\ndelete reference Person.friend', w);
        expect(modelImpact(plan)).toEqual(['org loses 15 slot values', 'demo loses 2 slot values']);
    });
});
