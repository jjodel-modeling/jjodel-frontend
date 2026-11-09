import { describe, expect, it } from 'vitest';
import type { MetamodelSketch } from '../../simulation/profileBinder';
import type { OntoBinding } from '../bindingCodec';
import { classRailGroups, conformsIn, containerFor, type ClassRailGroup } from '../classRail';

// The composition references and the classifier tree of the fixture (uml-s3b/uml-class-object.jjodel), ids distinct
// from names. Abstract classes are the ones the rail must not offer.

const cls = (name: string, supers: string[] = [], abstract = false) => ({ id: `C:${name}`, name, abstract, supers: supers.map(s => `C:${s}`) });
const ref = (owner: string, name: string, type: string, composition = false) =>
    ({ id: `R:${owner}.${name}`, name, owner: `C:${owner}`, type: `C:${type}`, composition, aggregation: false });

const UML: MetamodelSketch = {
    classes: [
        cls('Element', [], true), cls('PackageableElement', ['Element'], true), cls('Package', ['PackageableElement']),
        cls('Classifier', ['PackageableElement'], true), cls('Class', ['Classifier']), cls('DataType', ['Classifier']),
        cls('PrimitiveType', ['DataType']), cls('Enumeration', ['DataType']), cls('Association', ['Classifier']),
        cls('Generalization', ['Element']), cls('Property', ['Element']), cls('InstanceSpecification', ['PackageableElement']),
        cls('Slot', ['Element']),
    ],
    attributes: [],
    references: [
        ref('Package', 'packagedElements', 'PackageableElement', true),
        ref('Class', 'ownedAttributes', 'Property', true),
        ref('Classifier', 'generalizations', 'Generalization', true),
        ref('Association', 'memberEnds', 'Property'),
        ref('InstanceSpecification', 'classifier', 'Classifier'),
        ref('InstanceSpecification', 'slots', 'Slot', true),
    ],
};

const OBJECT = {
    name: 'object', typeReference: 'R:InstanceSpecification.classifier', featureContainer: 'R:Class.ownedAttributes',
    generalization: { via: 'R:Classifier.generalizations', general: 'x' },
} as unknown as OntoBinding;
const LINK = { name: 'link', typeReference: 'R:InstanceSpecification.classifier', featureContainer: 'R:Association.memberEnds' } as unknown as OntoBinding;

const names = (groups: ClassRailGroup[], kind: ClassRailGroup['kind']) => groups.find(g => g.kind === kind)?.items.map(i => i.name);
const objects = (...pairs: Array<[string, string]>) => pairs.map(([id, meta]) => ({ id, metaclass: `C:${meta}` }));

describe('classRailGroups (R-OI-21)', () => {
    it('lists the concrete conformers of the type reference, by name, apart from the associations', () => {
        const groups = classRailGroups(UML, OBJECT, LINK);
        expect(groups.map(g => g.kind)).toEqual(['classifier', 'association', 'property', 'generalization']);
        expect(names(groups, 'classifier')).toEqual(['Class', 'DataType', 'Enumeration', 'PrimitiveType']);
        expect(names(groups, 'association')).toEqual(['Association']);
        expect(names(groups, 'property')).toEqual(['Property']);
        expect(names(groups, 'generalization')).toEqual(['Generalization']);
    });

    it('offers no abstract class and no class outside the classifier tree (the metaclass filter)', () => {
        const offered = classRailGroups(UML, OBJECT, LINK).find(g => g.kind === 'classifier')!.items.map(i => i.name);
        expect(offered).not.toContain('Classifier');
        expect(offered).not.toContain('Package');
        expect(offered).not.toContain('Property');
        expect(offered).not.toContain('Slot');
    });

    it('carries the metaclass id, not its name', () => {
        const item = classRailGroups(UML, OBJECT, LINK)[0].items[0];
        expect(item).toEqual({ metaclass: 'C:Class', name: 'Class' });
    });

    it('has no generalization group on a metamodel with no generalization', () => {
        const noGen = { ...OBJECT, generalization: undefined } as unknown as OntoBinding;
        const groups = classRailGroups(UML, noGen, LINK);
        expect(groups.map(g => g.kind)).toEqual(['classifier', 'association', 'property']);
    });

    it('has no generalization group for a `direct` generalization, which has no element to create', () => {
        const direct = { ...OBJECT, generalization: { direct: 'R:Class.ownedAttributes' } } as unknown as OntoBinding;
        expect(classRailGroups(UML, direct, LINK).map(g => g.kind)).not.toContain('generalization');
    });

    it('has no association group without a `link` record: an association is then a classifier like the others', () => {
        const groups = classRailGroups(UML, OBJECT, null);
        expect(names(groups, 'association')).toBeUndefined();
        expect(names(groups, 'classifier')).toContain('Association');
    });

    it('is empty when the type reference does not resolve', () => {
        expect(classRailGroups(UML, { ...OBJECT, typeReference: 'nope' } as unknown as OntoBinding, LINK)).toEqual([]);
    });
});

describe('conformsIn', () => {
    it('follows every supertype and stops on a cycle', () => {
        expect(conformsIn(UML, 'C:PrimitiveType', 'C:PackageableElement')).toBe(true);
        expect(conformsIn(UML, 'C:Property', 'C:Classifier')).toBe(false);
        const cyclic: MetamodelSketch = { ...UML, classes: [cls('A', ['B']), cls('B', ['A'])] };
        expect(conformsIn(cyclic, 'C:A', 'C:Z')).toBe(false);
    });
});

describe('containerFor (R-OI-22)', () => {
    it('puts a class in the composition reference that accepts it, under the sole instance of its owner', () => {
        const slot = containerFor(UML, 'C:Class', objects(['lib', 'Package'], ['book', 'Class']));
        expect(slot).not.toBeNull();
        expect(slot!.owner).toBe('lib');
        expect(slot!.reference.name).toBe('packagedElements');
    });

    it('counts an instance of a subclass of the owner', () => {
        const sub: MetamodelSketch = { ...UML, classes: [...UML.classes, cls('Model', ['Package'])] };
        expect(containerFor(sub, 'C:Class', objects(['m', 'Model']))?.owner).toBe('m');
    });

    it('is the root when the owner has no instance', () => {
        expect(containerFor(UML, 'C:Class', objects(['book', 'Class']))).toBeNull();
    });

    it('is the root when the owner has several instances', () => {
        expect(containerFor(UML, 'C:Class', objects(['a', 'Package'], ['b', 'Package']))).toBeNull();
    });

    it('is the root when two references qualify: the rule does not guess', () => {
        const two: MetamodelSketch = {
            ...UML,
            classes: [...UML.classes, cls('Folder')],
            references: [...UML.references, ref('Folder', 'items', 'Classifier', true)],
        };
        expect(containerFor(two, 'C:Class', objects(['p', 'Package'], ['f', 'Folder']))).toBeNull();
        expect(containerFor(two, 'C:Class', objects(['p', 'Package']))?.reference.name).toBe('packagedElements');
    });

    it('ignores a reference that is not a composition', () => {
        const plain: MetamodelSketch = { ...UML, references: UML.references.map(r => ({ ...r, composition: false })) };
        expect(containerFor(plain, 'C:Class', objects(['lib', 'Package']))).toBeNull();
    });

    it('ignores a composition the metaclass does not conform to', () => {
        expect(containerFor(UML, 'C:Property', objects(['lib', 'Package']))).toBeNull();
    });
});
