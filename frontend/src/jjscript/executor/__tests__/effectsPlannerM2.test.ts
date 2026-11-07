/**
 * JjScript effects planner on M2 (P-2026-10-24-1520): the metamodel commands, read without running.
 *
 * One test per M2 command kind, the three warnings of the prompt (duplicate name, type not
 * found, a `set` on a property the element does not have), a class created and then used as the
 * type of an attribute, and a mixed M1/M2 script. Like `effectsPlanner.test.ts`, these pin the
 * planner against the executor rules quoted in `../effectsPlanner.ts`, not against a live run.
 */
import { describe, it, expect } from 'vitest';
import { planEffects, type PlanWorld } from '../effectsPlanner';
import { buildPlanWorld } from '../planWorld';

/** A metamodel `MM` with a package, a class `Person` (attribute `name`), an enum `Color` (literal `RED`). */
function world(level: 'M1' | 'M2' = 'M2'): PlanWorld {
    return {
        level,
        classes: {
            Person: { name: 'Person', kinds: ['Person'], attributes: [{ name: 'name', upper: 1 }], references: [] },
        },
        elements: level === 'M1' ? [{ id: 'p1', name: 'alice', className: 'Person', root: true }] : [],
        m2: {
            id: 'mm', name: 'MM', defaultParent: 'pkg',
            elements: [
                { id: 'pkg', name: 'mmpkg', kind: 'Package', father: 'mm' },
                { id: 'cPerson', name: 'Person', kind: 'Class', father: 'pkg', abstract: false, extends: [] },
                { id: 'aName', name: 'name', kind: 'Attribute', father: 'cPerson', type: 'tString', upper: 1 },
                { id: 'eColor', name: 'Color', kind: 'Enumeration', father: 'pkg' },
                { id: 'lRed', name: 'RED', kind: 'Literal', father: 'eColor' },
            ],
        },
    };
}

const plan = (script: string, w: PlanWorld = world()) => planEffects(script, w);
const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe('planEffects on M2: one test per command kind', () => {
    it('create class: in the default package, with its superclass as a generalization', async () => {
        const p = await plan('create class Student extends Person');
        expect(p.errors).toEqual([]);
        expect(p.warnings).toEqual([]);
        expect(p.level).toBe('M2');
        expect(p.created).toEqual([
            { line: 1, id: 'planned:1', metaclass: 'Class', name: 'Student', container: 'mmpkg', level: 'M2', containerId: 'pkg', abstract: false },
        ]);
        expect(p.generalizations).toEqual([
            { line: 1, child: 'Student', childId: 'planned:1', parent: 'Person', parentId: 'cPerson', parentCreated: false },
        ]);
    });

    it('create abstract class and interface are abstract', async () => {
        const p = await plan('create abstract class Named\ncreate interface Shape');
        expect(p.created.map((c) => [c.name, c.abstract])).toEqual([['Named', true], ['Shape', true]]);
    });

    it('create attribute: in a class, primitive type normalized, EString without a clause', async () => {
        const p = await plan('create attribute age in Person type Integer\ncreate attribute nick in Person');
        expect(p.warnings).toEqual([]);
        expect(p.created.map((c) => [c.metaclass, c.name, c.container, c.type, c.typeId])).toEqual([
            ['Attribute', 'age', 'Person', 'EInt', null],
            ['Attribute', 'nick', 'Person', 'EString', null],
        ]);
    });

    it('create reference and containment: typed by a class, containment flagged', async () => {
        const p = await plan('create reference friends in Person type Person [0..*]\ncreate containment pets in Person type Person');
        expect(p.warnings).toEqual([]);
        expect(p.created.map((c) => [c.metaclass, c.name, c.typeId, c.containment])).toEqual([
            ['Reference', 'friends', 'cPerson', false],
            ['Reference', 'pets', 'cPerson', true],
        ]);
    });

    it('create enumeration and literal', async () => {
        const p = await plan('create enum Mood\ncreate literal HAPPY in Mood\ncreate literal GREEN in Color');
        expect(p.warnings).toEqual([]);
        expect(p.created.map((c) => [c.metaclass, c.name, c.container])).toEqual([
            ['Enumeration', 'Mood', 'mmpkg'],
            ['Literal', 'HAPPY', 'Mood'],
            ['Literal', 'GREEN', 'Color'],
        ]);
    });

    it('create operation, parameter and package', async () => {
        const p = await plan('create operation greet in Person\ncreate parameter who in Person.greet type String\ncreate package Sub\ncreate class Inner in Sub');
        expect(p.errors).toEqual([]);
        expect(p.warnings).toEqual([]);
        expect(p.created.map((c) => [c.metaclass, c.name, c.container])).toEqual([
            ['Operation', 'greet', 'Person'],
            ['Parameter', 'who', 'greet'],
            ['Package', 'Sub', 'mmpkg'],
            ['Class', 'Inner', 'Sub'],
        ]);
    });

    it('add is a create with `to` as the parent', async () => {
        const p = await plan('add attribute x to Person type String');
        expect(p.created.map((c) => [c.metaclass, c.name, c.container])).toEqual([['Attribute', 'x', 'Person']]);
    });

    it('set on a class flag and on a feature, by qualified name', async () => {
        const p = await plan('set Person.abstract = true\nset Person::name.upperBound = -1');
        expect(p.warnings).toEqual([]);
        expect(p.features).toEqual([
            { line: 1, owner: 'Person', ownerId: 'cPerson', feature: 'abstract', value: true, many: false, level: 'M2' },
            { line: 2, owner: 'Person::name', ownerId: 'aName', feature: 'upperBound', value: -1, many: false, level: 'M2' },
        ]);
    });

    it('rename an element, and a name taken in the namespace is an error', async () => {
        const p = await plan('rename Person to Human\nrename Color to Human');
        expect(p.renamed).toEqual([{ line: 1, id: 'cPerson', from: 'Person', to: 'Human', level: 'M2' }]);
        expect(codes(p.errors)).toEqual(['NAME_CONFLICT']);
    });

    it('delete an element and, through father, what it contains', async () => {
        const p = await plan('delete Person');
        expect(p.deleted).toEqual([{ line: 1, id: 'cPerson', name: 'Person', contained: ['name'], level: 'M2' }]);
    });

    it('extends writes a generalization; a cycle is an error', async () => {
        const p = await plan('create class Student\nStudent extends Person\nPerson extends Student');
        expect(p.generalizations).toEqual([
            { line: 2, child: 'Student', childId: 'planned:1', parent: 'Person', parentId: 'cPerson', parentCreated: false },
        ]);
        expect(codes(p.errors)).toEqual(['CIRCULAR_INHERITANCE']);
    });

    it('a repeated extends plans one generalization (extends.ts:125-137)', async () => {
        const p = await plan('create class Student\nStudent extends Person\nStudent extends Person');
        expect((p.generalizations ?? []).map((g) => g.line)).toEqual([2]);
        expect(p.errors).toEqual([]);
    });

    it('abstract toggles the flag of a class', async () => {
        const p = await plan('abstract Person\nabstract Person');
        expect(p.features.map((f) => [f.feature, f.value])).toEqual([['abstract', true], ['abstract', false]]);
    });
});

describe('planEffects on M2: warnings', () => {
    it('a duplicate name in the same container: class in the metamodel, attribute in its class and inherited', async () => {
        const p = await plan('create class Person\ncreate attribute name in Person\ncreate class Student extends Person\ncreate attribute name in Student\ncreate literal RED in Color');
        expect(p.warnings.map((w) => [w.line, w.code])).toEqual([[1, 'DUPLICATE_NAME'], [2, 'DUPLICATE_NAME'], [4, 'DUPLICATE_NAME'], [5, 'DUPLICATE_NAME']]);
        expect(p.created.map((c) => c.name)).toEqual(['Student']);
    });

    it('the same name in another class, or differing in case, is no duplicate', async () => {
        const p = await plan('create class Pet\ncreate attribute name in Pet\ncreate class person');
        expect(p.warnings).toEqual([]);
    });

    it('a type found neither in the metamodel nor among the creations', async () => {
        const p = await plan('create reference owner in Person type Ghost\ncreate attribute mood in Person type Mood\ncreate class Kid extends Nobody');
        expect(p.warnings.map((w) => [w.line, w.code])).toEqual([[1, 'UNKNOWN_REFERENCE_TYPE'], [2, 'UNKNOWN_ATTRIBUTE_TYPE'], [3, 'PARENT_NOT_FOUND']]);
        expect(p.created).toEqual([]);
    });

    it('a reference cannot be typed by an enum or a primitive', async () => {
        const p = await plan('create reference c in Person type Color\ncreate reference s in Person type String');
        expect(codes(p.warnings)).toEqual(['UNKNOWN_REFERENCE_TYPE', 'UNKNOWN_REFERENCE_TYPE']);
    });

    it('a set on a property the element does not have, and on an element that does not exist', async () => {
        const p = await plan('set Person.colour = 3\nset Color.abstract = true\nset Nobody.abstract = true');
        expect(p.warnings.map((w) => [w.line, w.code])).toEqual([[1, 'UNKNOWN_PROPERTY'], [2, 'UNKNOWN_PROPERTY'], [3, 'ELEMENT_NOT_FOUND']]);
        expect(p.features).toEqual([]);
    });

    it('a container of the wrong kind or missing', async () => {
        const p = await plan('create literal X in Person\ncreate attribute a in Nowhere');
        expect(p.warnings.map((w) => [w.line, w.code])).toEqual([[1, 'PARENT_NOT_FOUND'], [2, 'PARENT_NOT_FOUND']]);
    });
});

describe('planEffects on M2: order and levels', () => {
    it('a class created and then an attribute typed by it, also when the type comes later (deferral)', async () => {
        const p = await plan('create enum Size\ncreate attribute size in Person type Size\ncreate reference best in Person type Friend\ncreate class Friend');
        expect(p.warnings).toEqual([]);
        const size = p.created.find((c) => c.name === 'size')!;
        expect([size.type, size.typeId, size.typeCreated]).toEqual(['Size', 'planned:1', true]);
        const best = p.created.find((c) => c.name === 'best')!;
        expect([best.type, best.typeId, best.typeCreated]).toEqual(['Friend', p.created.find((c) => c.name === 'Friend')!.id, true]);
    });

    it('a set on a class the script creates', async () => {
        const p = await plan('create class Shape\nset Shape.abstract = true');
        expect(p.features.map((f) => [f.ownerId, f.feature, f.value])).toEqual([['planned:1', 'abstract', true]]);
    });

    it('a mixed script is planned per level, on an M1 world', async () => {
        const p = await plan('create class Pet\ncreate attribute legs in Pet type Integer\ncreate instance of Person "bob"\nset bob.name = "Bob"\nset Pet.abstract = true', world('M1'));
        expect(p.errors).toEqual([]);
        expect(p.warnings).toEqual([]);
        expect(p.level).toBe('M1');
        expect(p.created.map((c) => [c.metaclass, c.level ?? 'M1'])).toEqual([['Class', 'M2'], ['Attribute', 'M2'], ['Person', 'M1']]);
        expect(p.features.map((f) => [f.owner, f.level ?? 'M1'])).toEqual([['bob', 'M1'], ['Pet', 'M2']]);
    });

    it('the open level wins for a name both levels know', async () => {
        const w = world('M1');
        w.elements.push({ id: 'p2', name: 'Person', className: 'Person', root: true });
        const p = await plan('set Person.name = "x"', w);
        expect(p.features.map((f) => f.level ?? 'M1')).toEqual(['M1']);
    });

    it('move and copy stay unsupported', async () => {
        const p = await plan('move Person to mmpkg\ncopy Person to mmpkg as Person2');
        expect(codes(p.warnings)).toEqual(['UNSUPPORTED', 'UNSUPPORTED']);
    });

    it('does not write the world it reads', async () => {
        const w = world();
        const before = JSON.stringify(w);
        await plan('create class A extends Person\nrename Person to P\ndelete Color\nset P.abstract = true', w);
        expect(JSON.stringify(w)).toBe(before);
    });
});

describe('buildPlanWorld on a metamodel', () => {
    const lookup = (): Record<string, any> => ({
        mm: { id: 'mm', className: 'DModel', name: 'MM', isMetamodel: true, packages: ['pkg'] },
        pkg: { id: 'pkg', className: 'DPackage', name: 'p', father: 'mm' },
        cA: { id: 'cA', className: 'DClass', name: 'A', father: 'pkg', abstract: true, extends: [], attributes: ['aX'], references: ['rB'] },
        cB: { id: 'cB', className: 'DClass', name: 'B', father: 'pkg', extends: ['cA'], attributes: [], references: [] },
        aX: { id: 'aX', className: 'DAttribute', name: 'x', father: 'cA', type: 'prim', upperBound: 1 },
        rB: { id: 'rB', className: 'DReference', name: 'b', father: 'cA', type: 'cB', composition: true, upperBound: -1 },
        eE: { id: 'eE', className: 'DEnumerator', name: 'E', father: 'pkg' },
        lL: { id: 'lL', className: 'DEnumLiteral', name: 'L', father: 'eE' },
        prim: { id: 'prim', className: 'DClass', name: 'EString', father: 'defaults' },
        defaults: { id: 'defaults', className: 'DModel', name: 'Defaults', isMetamodel: true },
        m: { id: 'm', className: 'DModel', instanceof: 'mm', objects: [] },
    });

    it('reads the elements of the metamodel by father, with level M2', () => {
        const w = buildPlanWorld(lookup(), 'mm');
        expect(w.level).toBe('M2');
        expect(w.elements).toEqual([]);
        expect(w.m2!.defaultParent).toBe('pkg');
        expect(w.m2!.elements.map((e) => [e.id, e.kind, e.father]).sort()).toEqual([
            ['aX', 'Attribute', 'cA'], ['cA', 'Class', 'pkg'], ['cB', 'Class', 'pkg'], ['eE', 'Enumeration', 'pkg'],
            ['lL', 'Literal', 'eE'], ['pkg', 'Package', 'mm'], ['rB', 'Reference', 'cA'],
        ]);
        const rB = w.m2!.elements.find((e) => e.id === 'rB')!;
        expect([rB.type, rB.containment, rB.upper]).toEqual(['cB', true, -1]);
        expect(w.m2!.elements.find((e) => e.id === 'cB')!.extends).toEqual(['cA']);
        expect(Object.keys(w.classes).sort()).toEqual(['A', 'B']);
    });

    it('an M1 model carries its metamodel, with level M1', () => {
        const w = buildPlanWorld(lookup(), 'm');
        expect(w.level).toBe('M1');
        expect(w.m2!.id).toBe('mm');
        expect(w.m2!.elements.length).toBe(7);
    });

    it('feeds the planner', async () => {
        const p = await planEffects('create attribute y in B type E\ncreate class A', buildPlanWorld(lookup(), 'mm'));
        expect(p.created.map((c) => [c.name, c.typeId])).toEqual([['y', 'eE']]);
        expect(codes(p.warnings)).toEqual(['DUPLICATE_NAME']);
    });
});
