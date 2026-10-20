import { describe, expect, it } from 'vitest';
import type { OntoBinding } from '../bindingCodec';
import { featureClosure, instantiableClassifiers, recordFor, recordsFor, slotDiff } from '../bindingReader';
import type { OntoReadView } from '../bindingReader';

// The UML subset of the class/object notation design (§2, §6): the library, as M1 objects over M2 ids.

const OBJECT: OntoBinding = {
    name: 'object',
    typeReference: 'IS.classifier',
    featureContainer: 'Class.ownedAttributes',
    generalization: { via: 'Class.generalizations', general: 'Generalization.general' },
    slotContainer: 'IS.slots',
    definingFeature: 'Slot.definingFeature',
    valueHolder: 'Slot.values',
    abstractFlag: 'Class.isAbstract',
    valueKinds: [{ when: 'primitive:String', create: 'LiteralString', field: 'LiteralString.value' }],
};
const LINK: OntoBinding = { name: 'link', typeReference: 'IS.classifier', featureContainer: 'Association.memberEnds' };
const ACTIVITY: OntoBinding = { name: 'activity', typeReference: 'Activity.activityTypedBy' };

interface Obj { meta: string; refs?: Record<string, string[]>; attrs?: Record<string, unknown> }

const OWNERS: Record<string, string> = {
    'IS.classifier': 'InstanceSpecification',
    'Class.ownedAttributes': 'Class',
    'Association.memberEnds': 'Association',
    'Activity.activityTypedBy': 'Activity',
    'ActiveClass.ownedPorts': 'ActiveClass',
};
const SUPERS: Record<string, string[]> = {
    ActiveClass: ['Class'],
    Component: ['ActiveClass'],
    AssociationClass: ['Class', 'Association'],
};
const conforms = (meta: string, sup: string, seen = new Set<string>()): boolean => {
    if (meta === sup) return true;
    if (seen.has(meta)) return false;
    seen.add(meta);
    return (SUPERS[meta] ?? []).some(s => conforms(s, sup, seen));
};

const viewOf = (objects: Record<string, Obj>): OntoReadView => ({
    metaclassOf: id => objects[id]?.meta,
    referenceTargets: (id, ref) => objects[id]?.refs?.[ref] ?? [],
    attributeValue: (id, attr) => objects[id]?.attrs?.[attr],
    ownerOf: f => OWNERS[f],
    conformsTo: (m, s) => conforms(m, s),
});

const library = (overrides: Record<string, Obj> = {}): Record<string, Obj> => ({
    Publication: { meta: 'Class', refs: { 'Class.ownedAttributes': ['title', 'year'] }, attrs: { 'Class.isAbstract': true } },
    Book: { meta: 'Class', refs: { 'Class.ownedAttributes': ['isbn', 'genre'], 'Class.generalizations': ['gBook'] }, attrs: { 'Class.isAbstract': false } },
    Magazine: { meta: 'Class', refs: { 'Class.ownedAttributes': ['issue'], 'Class.generalizations': ['gMag'] } },
    Library: { meta: 'Class', refs: { 'Class.ownedAttributes': ['libName'] } },
    Member: { meta: 'Class', refs: { 'Class.ownedAttributes': ['active'] } },
    borrows: { meta: 'Association', refs: { 'Association.memberEnds': ['borrower', 'borrowed'] } },
    Genre: { meta: 'Enumeration' },
    gBook: { meta: 'Generalization', refs: { 'Generalization.general': ['Publication'] } },
    gMag: { meta: 'Generalization', refs: { 'Generalization.general': ['Publication'] } },
    ...overrides,
});

const IS = 'InstanceSpecification';

describe('featureClosure', () => {
    it("Book's closure is isbn, genre, title, year: own first, then inherited", () => {
        const r = featureClosure(viewOf(library()), OBJECT, 'Book');
        expect(r.features).toEqual(['isbn', 'genre', 'title', 'year']);
        expect(r.cycles).toEqual([]);
    });

    it('a classifier with no generalization has its own features only', () => {
        expect(featureClosure(viewOf(library()), OBJECT, 'Library').features).toEqual(['libName']);
        expect(featureClosure(viewOf(library()), { ...OBJECT, generalization: undefined }, 'Book').features).toEqual(['isbn', 'genre']);
    });

    it('inherited features come level by level, each feature once', () => {
        const objs = library({
            Publication: { meta: 'Class', refs: { 'Class.ownedAttributes': ['title', 'isbn'], 'Class.generalizations': ['gRoot'] } },
            gRoot: { meta: 'Generalization', refs: { 'Generalization.general': ['Thing'] } },
            Thing: { meta: 'Class', refs: { 'Class.ownedAttributes': ['id'] } },
        });
        expect(featureClosure(viewOf(objs), OBJECT, 'Book').features).toEqual(['isbn', 'genre', 'title', 'id']);
    });

    it('a diamond visits the shared ancestor once and is not a cycle', () => {
        const objs = library({
            Book: { meta: 'Class', refs: { 'Class.ownedAttributes': ['isbn'], 'Class.generalizations': ['gBook', 'gBook2'] } },
            gBook2: { meta: 'Generalization', refs: { 'Generalization.general': ['Printed'] } },
            Printed: { meta: 'Class', refs: { 'Class.ownedAttributes': ['pages'], 'Class.generalizations': ['gPrinted'] } },
            gPrinted: { meta: 'Generalization', refs: { 'Generalization.general': ['Publication'] } },
        });
        const r = featureClosure(viewOf(objs), OBJECT, 'Book');
        expect(r.features).toEqual(['isbn', 'title', 'year', 'pages']);
        expect(r.cycles).toEqual([]);
    });

    it('a cycle Publication <-> Book is reported, not followed, and the closure terminates', () => {
        const objs = library({
            Publication: { meta: 'Class', refs: { 'Class.ownedAttributes': ['title', 'year'], 'Class.generalizations': ['gPub'] } },
            gPub: { meta: 'Generalization', refs: { 'Generalization.general': ['Book'] } },
        });
        const view = viewOf(objs);
        const fromBook = featureClosure(view, OBJECT, 'Book');
        expect(fromBook.features).toEqual(['isbn', 'genre', 'title', 'year']);
        expect(fromBook.cycles).toEqual([['Book', 'Publication', 'Book']]);
        const fromPub = featureClosure(view, OBJECT, 'Publication');
        expect(fromPub.features).toEqual(['title', 'year', 'isbn', 'genre']);
        expect(fromPub.cycles).toEqual([['Publication', 'Book', 'Publication']]);
    });

    it('a classifier that specializes itself is a cycle of one', () => {
        const objs = library({
            Library: { meta: 'Class', refs: { 'Class.ownedAttributes': ['libName'], 'Class.generalizations': ['gSelf'] } },
            gSelf: { meta: 'Generalization', refs: { 'Generalization.general': ['Library'] } },
        });
        const r = featureClosure(viewOf(objs), OBJECT, 'Library');
        expect(r.features).toEqual(['libName']);
        expect(r.cycles).toEqual([['Library', 'Library']]);
    });

    it('a direct generalization reference works as the via form does', () => {
        const direct: OntoBinding = { ...OBJECT, generalization: { direct: 'Class.extends' } };
        const objs = {
            A: { meta: 'Class', refs: { 'Class.ownedAttributes': ['a'], 'Class.extends': ['B'] } },
            B: { meta: 'Class', refs: { 'Class.ownedAttributes': ['b'] } },
        };
        expect(featureClosure(viewOf(objs), direct, 'A').features).toEqual(['a', 'b']);
    });
});

describe('instantiableClassifiers', () => {
    const ids = ['Publication', 'Book', 'Magazine', 'Library', 'Member', 'borrows', 'Genre'];

    it('Publication is abstract and left out, Book is in; association and enumeration are not classes', () => {
        const r = instantiableClassifiers(viewOf(library()), OBJECT, ids);
        expect(r).toEqual(['Book', 'Magazine', 'Library', 'Member']);
    });

    it('a subclass of the owner is instantiable at any depth; a class that inherits two owners is offered by both records', () => {
        const objs = library({
            Panel: { meta: 'ActiveClass' },
            Sensor: { meta: 'Component' },
            Loan: { meta: 'AssociationClass' },
        });
        const all = [...ids, 'Panel', 'Sensor', 'Loan'];
        expect(instantiableClassifiers(viewOf(objs), OBJECT, all)).toEqual(['Book', 'Magazine', 'Library', 'Member', 'Panel', 'Sensor', 'Loan']);
        expect(instantiableClassifiers(viewOf(objs), LINK, all)).toEqual(['borrows', 'Loan']);
    });

    it('the link record offers the associations', () => {
        expect(instantiableClassifiers(viewOf(library()), LINK, ids)).toEqual(['borrows']);
    });

    it('without an abstract flag role nothing is left out', () => {
        const r = instantiableClassifiers(viewOf(library()), { ...OBJECT, abstractFlag: undefined }, ids);
        expect(r).toContain('Publication');
    });

    it('the flag is read as true or "true"', () => {
        const objs = library({ Member: { meta: 'Class', attrs: { 'Class.isAbstract': 'true' } } });
        expect(instantiableClassifiers(viewOf(objs), OBJECT, ids)).not.toContain('Member');
    });

    it('a record with no feature container offers none', () => {
        expect(instantiableClassifiers(viewOf(library()), ACTIVITY, ids)).toEqual([]);
    });
});

describe('recordFor', () => {
    const objs = library({
        b1: { meta: IS, refs: { 'IS.classifier': ['Book'] } },
        l1: { meta: IS, refs: { 'IS.classifier': ['borrows'] } },
        e1: { meta: IS, refs: { 'IS.classifier': ['Genre'] } },
        u1: { meta: IS },
        act1: { meta: 'Activity', refs: { 'Activity.activityTypedBy': ['T_author'] } },
        notAnInstance: { meta: 'Class' },
    });
    const view = viewOf(objs);
    const records = [OBJECT, LINK];

    it('an instance of a Class selects the object record', () => {
        expect(recordFor(view, records, 'b1')?.name).toBe('object');
    });

    it('an instance of an Association selects the link record', () => {
        expect(recordFor(view, records, 'l1')?.name).toBe('link');
    });

    it('an instance of an Enumeration selects none', () => {
        expect(recordFor(view, records, 'e1')).toBeNull();
    });

    it('an instance with no classifier, an unknown id and a non-instance select none', () => {
        expect(recordFor(view, records, 'u1')).toBeNull();
        expect(recordFor(view, records, 'nope')).toBeNull();
        expect(recordFor(view, records, 'notAnInstance')).toBeNull();
    });

    it('the order of the records does not change the choice', () => {
        expect(recordFor(view, [LINK, OBJECT], 'b1')?.name).toBe('object');
        expect(recordFor(view, [LINK, OBJECT], 'l1')?.name).toBe('link');
    });

    it('an instance of a subclass of Class (an ActiveClass, a Component) selects the object record', () => {
        const more = viewOf(library({
            Panel: { meta: 'ActiveClass' },
            Sensor: { meta: 'Component' },
            p1: { meta: IS, refs: { 'IS.classifier': ['Panel'] } },
            s1: { meta: IS, refs: { 'IS.classifier': ['Sensor'] } },
        }));
        expect(recordFor(more, records, 'p1')?.name).toBe('object');
        expect(recordFor(more, records, 's1')?.name).toBe('object');
    });

    it('a subclass of both Class and Association (AssociationClass) gets two records and no single one', () => {
        const more = viewOf(library({
            Loan: { meta: 'AssociationClass' },
            n1: { meta: IS, refs: { 'IS.classifier': ['Loan'] } },
        }));
        expect(recordsFor(more, records, 'n1').map(r => r.name)).toEqual(['object', 'link']);
        expect(recordsFor(more, [LINK, OBJECT], 'n1').map(r => r.name)).toEqual(['link', 'object']);
        expect(recordFor(more, records, 'n1')).toBeNull();
    });

    it('the most specific record wins: a record on ActiveClass beats the one on Class, whatever the order', () => {
        const ports: OntoBinding = { name: 'active', typeReference: 'IS.classifier', featureContainer: 'ActiveClass.ownedPorts' };
        const more = viewOf(library({
            Panel: { meta: 'ActiveClass' },
            Sensor: { meta: 'Component' },
            p1: { meta: IS, refs: { 'IS.classifier': ['Panel'] } },
            s1: { meta: IS, refs: { 'IS.classifier': ['Sensor'] } },
            b1: { meta: IS, refs: { 'IS.classifier': ['Book'] } },
        }));
        for (const list of [[OBJECT, ports], [ports, OBJECT]]) {
            expect(recordsFor(more, list, 'p1')).toHaveLength(2);
            expect(recordFor(more, list, 'p1')?.name).toBe('active');
            expect(recordFor(more, list, 'b1')?.name).toBe('object');
            expect(recordFor(more, list, 's1')?.name).toBe('active');
        }
    });

    it('a record with no feature container is the least specific; two equally specific records give none', () => {
        const bare: OntoBinding = { name: 'bare', typeReference: 'IS.classifier' };
        expect(recordsFor(view, [bare, OBJECT], 'b1').map(r => r.name)).toEqual(['bare', 'object']);
        expect(recordFor(view, [bare, OBJECT], 'b1')?.name).toBe('object');
        expect(recordFor(view, [OBJECT, { ...OBJECT, name: 'twin' }], 'b1')).toBeNull();
        expect(recordsFor(view, [], 'b1')).toEqual([]);
    });

    it('a record with the type reference alone applies to the instance that owns the reference (FTG+PM)', () => {
        expect(recordFor(view, [ACTIVITY], 'act1')?.name).toBe('activity');
        expect(recordFor(view, [ACTIVITY], 'b1')).toBeNull();
    });
});

describe('slotDiff', () => {
    const slots = (feature: string) => ({ meta: 'Slot', refs: { 'Slot.definingFeature': [feature] } });

    it('an instance with a slot per feature has nothing missing and no orphan', () => {
        const objs = library({
            b1: { meta: IS, refs: { 'IS.classifier': ['Book'], 'IS.slots': ['s1', 's2', 's3', 's4'] } },
            s1: slots('isbn'), s2: slots('genre'), s3: slots('title'), s4: slots('year'),
        });
        expect(slotDiff(viewOf(objs), OBJECT, 'b1')).toEqual({ missing: [], orphans: [], cycles: [] });
    });

    it('a class that gained pages and lost isbn: pages is missing, the isbn slot is an orphan', () => {
        const objs = library({
            Book: { meta: 'Class', refs: { 'Class.ownedAttributes': ['genre', 'pages'], 'Class.generalizations': ['gBook'] } },
            b1: { meta: IS, refs: { 'IS.classifier': ['Book'], 'IS.slots': ['s1', 's2', 's3', 's4'] } },
            s1: slots('isbn'), s2: slots('genre'), s3: slots('title'), s4: slots('year'),
        });
        expect(slotDiff(viewOf(objs), OBJECT, 'b1')).toEqual({
            missing: ['pages'],
            orphans: [{ slot: 's1', feature: 'isbn' }],
            cycles: [],
        });
    });

    it('missing features come in closure order; a slot with no defining feature is an orphan', () => {
        const objs = library({
            b1: { meta: IS, refs: { 'IS.classifier': ['Book'], 'IS.slots': ['s3', 'sx'] } },
            s3: slots('title'),
            sx: { meta: 'Slot' },
        });
        expect(slotDiff(viewOf(objs), OBJECT, 'b1')).toEqual({
            missing: ['isbn', 'genre', 'year'],
            orphans: [{ slot: 'sx', feature: null }],
            cycles: [],
        });
    });

    it('carries the cycles of the closure', () => {
        const objs = library({
            Publication: { meta: 'Class', refs: { 'Class.ownedAttributes': ['title', 'year'], 'Class.generalizations': ['gPub'] } },
            gPub: { meta: 'Generalization', refs: { 'Generalization.general': ['Book'] } },
            b1: { meta: IS, refs: { 'IS.classifier': ['Book'] } },
        });
        const r = slotDiff(viewOf(objs), OBJECT, 'b1');
        expect(r.missing).toEqual(['isbn', 'genre', 'title', 'year']);
        expect(r.cycles).toEqual([['Book', 'Publication', 'Book']]);
    });

    it('judges nothing without slot roles or without a classifier', () => {
        const objs = library({ b1: { meta: IS, refs: { 'IS.classifier': ['Book'] } }, u1: { meta: IS } });
        const none = { missing: [], orphans: [], cycles: [] };
        expect(slotDiff(viewOf(objs), { name: 'x', typeReference: 'IS.classifier', featureContainer: 'Class.ownedAttributes' }, 'b1')).toEqual(none);
        expect(slotDiff(viewOf(objs), OBJECT, 'u1')).toEqual(none);
    });
});
