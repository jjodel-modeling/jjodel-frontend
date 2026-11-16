import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    BOX_METRICS, creationOptions, instanceBoxSize, instanceName, layoutTargets, modelObjectIds, objectRecord, ontoReadView,
    layoutLanded, readOntoBindings, seedLanded, synthesisPlan, syncSlotsPlan, viewCentre, type NodeLayoutWrite,
    ontoDragPayload, ontoDropRequest, ontoLevelOf, ontoRailSections,
    type SlotSyncPlan, type SynthesisPlan,
    instanceRows, materializePlan,
    instantiate, materializeSlot, syncSlots, type InstantiateResult,
    linkOptions,
    bindingsDeclarePotency, clabjectPropertyGroup, ontoLevelIn, ontoLevelKeyOf, ontoLevelsOf,
} from '../instantiate';

// A UML subset as D records: the metamodel of the notation file §2 (only what the record reaches) and the library
// of §6 in one M1 model, classes as roots and properties contained in `ownedAttributes`.

type Rec = Record<string, any>;

function uml() {
    const db: Record<string, Rec> = {};
    const get = (id: string) => db[id];
    const cls = (id: string, ext: string[] = [], abstract = false) =>
        (db[id] = { className: 'DClass', id, name: id, extends: ext, abstract, attributes: [], references: [] });
    const ref = (owner: string, name: string, type: string) => {
        const id = `r_${owner}_${name}`;
        db[id] = { className: 'DReference', id, name, father: owner, type };
        db[owner].references.push(id);
    };
    const attr = (owner: string, name: string, type: string) => {
        const id = `a_${owner}_${name}`;
        db[id] = { className: 'DAttribute', id, name, father: owner, type };
        db[owner].attributes.push(id);
    };
    for (const p of ['EString', 'EBoolean', 'EInt']) db[p] = { className: 'DClass', id: p, name: p };
    cls('NamedElement', [], true); attr('NamedElement', 'name', 'EString');
    cls('Classifier', ['NamedElement'], true); attr('Classifier', 'isAbstract', 'EBoolean');
    cls('Class', ['Classifier']); cls('DataType', ['Classifier']);
    cls('PrimitiveType', ['DataType']); cls('Enumeration', ['DataType']); cls('Association', ['Classifier']);
    cls('Generalization');
    cls('TypedElement', ['NamedElement'], true); cls('MultiplicityElement', [], true);
    cls('Property', ['TypedElement', 'MultiplicityElement']); attr('Property', 'defaultValue', 'EString');
    cls('InstanceSpecification', ['NamedElement']); cls('EnumerationLiteral', ['InstanceSpecification']);
    cls('Slot'); cls('ValueSpecification', ['TypedElement'], true);
    cls('LiteralBoolean', ['ValueSpecification']); attr('LiteralBoolean', 'value', 'EBoolean');
    cls('LiteralString', ['ValueSpecification']); attr('LiteralString', 'value', 'EString');
    cls('LiteralInteger', ['ValueSpecification']); attr('LiteralInteger', 'value', 'EInt');
    cls('InstanceValue', ['ValueSpecification']);
    ref('Classifier', 'generalizations', 'Generalization'); ref('Generalization', 'general', 'Classifier');
    ref('Class', 'ownedAttributes', 'Property'); ref('Association', 'memberEnds', 'Property');
    ref('TypedElement', 'type', 'Classifier');
    ref('InstanceSpecification', 'classifier', 'Classifier'); ref('InstanceSpecification', 'slots', 'Slot');
    ref('Slot', 'definingFeature', 'Property'); ref('Slot', 'values', 'ValueSpecification');
    ref('InstanceValue', 'instance', 'InstanceSpecification');

    const shared = { typeReference: 'r_InstanceSpecification_classifier', slotContainer: 'r_InstanceSpecification_slots',
        definingFeature: 'r_Slot_definingFeature', valueHolder: 'r_Slot_values' };
    const object = { name: 'object', ...shared, featureContainer: 'r_Class_ownedAttributes',
        generalization: { via: 'r_Classifier_generalizations', general: 'r_Generalization_general' },
        abstractFlag: 'a_Classifier_isAbstract', featureType: 'r_TypedElement_type', defaultValue: 'a_Property_defaultValue',
        valueKinds: [
            { when: 'primitive:Boolean', create: 'LiteralBoolean', field: 'a_LiteralBoolean_value' },
            { when: 'primitive:String', create: 'LiteralString', field: 'a_LiteralString_value' },
            { when: 'primitive:Integer', create: 'LiteralInteger', field: 'a_LiteralInteger_value' },
            { when: 'instance', create: 'InstanceValue', field: 'r_InstanceValue_instance' },
        ] };
    const link = { name: 'link', ...shared, featureContainer: 'r_Association_memberEnds' };
    db.MM = { className: 'DModel', id: 'MM', isMetamodel: true, _state: { ontoBindings: JSON.stringify({ v: 1, bindings: [object, link] }) } };
    db.M1 = { className: 'DModel', id: 'M1', isMetamodel: false, instanceof: 'MM', objects: [] };

    // M1. Every DValue is `<object>.<feature>`.
    const val = (o: string, feature: string, values: unknown[]) => {
        const vid = `${o}.${feature}`;
        if (!db[vid]) { db[vid] = { className: 'DValue', id: vid, father: o, instanceof: feature, values: [] }; db[o].features.push(vid); }
        db[vid].values.push(...values);
        return vid;
    };
    const obj = (id: string, meta: string, father = 'M1') => {
        db[id] = { className: 'DObject', id, name: id, instanceof: meta, father, features: [] };
        if (father === 'M1') db.M1.objects.push(id);
        val(id, 'a_NamedElement_name', [id]);
    };
    const classifier = (id: string, meta: string, abstract = false) => { obj(id, meta); val(id, 'a_Classifier_isAbstract', [abstract]); };
    const prop = (owner: string, name: string, type: string, dflt?: string) => {
        const id = `p_${owner}_${name}`;
        const slot = val(owner, 'r_Class_ownedAttributes', [id]);
        obj(id, 'Property', slot);
        db[id].name = name;
        val(id, 'r_TypedElement_type', [type]);
        if (dflt !== undefined) val(id, 'a_Property_defaultValue', [dflt]);
    };
    const general = (specific: string, gen: string) => {
        const id = `gen_${specific}`;
        const slot = val(specific, 'r_Classifier_generalizations', [id]);
        db[id] = { className: 'DObject', id, name: id, instanceof: 'Generalization', father: slot, features: [] };
        val(id, 'r_Generalization_general', [gen]);
    };
    for (const p of ['String', 'Integer', 'Boolean']) classifier(p, 'PrimitiveType');
    classifier('Genre', 'Enumeration');
    obj('fiction', 'EnumerationLiteral'); val('fiction', 'r_InstanceSpecification_classifier', ['Genre']);
    classifier('Publication', 'Class', true); prop('Publication', 'title', 'String'); prop('Publication', 'year', 'Integer');
    classifier('Book', 'Class'); prop('Book', 'isbn', 'String'); prop('Book', 'genre', 'Genre'); general('Book', 'Publication');
    classifier('Magazine', 'Class'); prop('Magazine', 'issue', 'Integer'); general('Magazine', 'Publication');
    classifier('Library', 'Class'); prop('Library', 'name', 'String');
    classifier('Member', 'Class'); prop('Member', 'name', 'String'); prop('Member', 'active', 'Boolean', 'true');
    classifier('Holdings', 'Association');
    return { db, get, object, link, obj, val };
}

const asPlan = (p: SynthesisPlan | { error: string }): SynthesisPlan => {
    if ('error' in p) throw new Error(p.error);
    return p;
};

describe('ontoReadView over the D records', () => {
    it('conformsTo follows every parent of a multiple inheritance', () => {
        const { get } = uml();
        const view = ontoReadView(get);
        expect(view.conformsTo('Property', 'MultiplicityElement')).toBe(true);
        expect(view.conformsTo('Property', 'NamedElement')).toBe(true);
        expect(view.conformsTo('Enumeration', 'Class')).toBe(false);
    });

    it('conformsTo terminates on a cycle in extends and answers false for a class outside it', () => {
        const { db, get } = uml();
        db.Class.extends = ['Classifier', 'Loop'];
        db.Loop = { className: 'DClass', id: 'Loop', name: 'Loop', extends: ['Class'] };
        const view = ontoReadView(get);
        expect(view.conformsTo('Class', 'Slot')).toBe(false);
        expect(view.conformsTo('Loop', 'NamedElement')).toBe(true);
    });

    it('reads reference targets, attribute values and feature owners', () => {
        const { get } = uml();
        const view = ontoReadView(get);
        expect(view.metaclassOf('Book')).toBe('Class');
        expect(view.referenceTargets('Book', 'r_Class_ownedAttributes')).toEqual(['p_Book_isbn', 'p_Book_genre']);
        expect(view.attributeValue('Publication', 'a_Classifier_isAbstract')).toBe(true);
        expect(view.ownerOf('r_InstanceSpecification_classifier')).toBe('InstanceSpecification');
    });
});

describe('the bag and the menu', () => {
    it('reads the bindings of the metamodel bag and finds the object record', () => {
        const { get } = uml();
        expect(readOntoBindings(get, 'M1').map(b => b.name)).toEqual(['object', 'link']);
        expect(objectRecord(get, 'M1')?.name).toBe('object');
    });

    it('a metamodel without the key, or with an unreadable one, has no record', () => {
        const { db, get } = uml();
        db.MM._state = {};
        expect(objectRecord(get, 'M1')).toBeNull();
        db.MM._state = { ontoBindings: '{"v":2,"bindings":[]}' };
        expect(readOntoBindings(get, 'M1')).toEqual([]);
    });

    it('lists the model objects, roots and contained ones, not an object of another model a reference reaches', () => {
        const { db, get, val } = uml();
        db.alien = { className: 'DObject', id: 'alien', name: 'alien', instanceof: 'Class', father: 'M2', features: [] };
        val('fiction', 'r_InstanceSpecification_classifier', ['alien']);
        const ids = modelObjectIds(get, 'M1');
        expect(ids).toContain('Book');
        expect(ids).toContain('p_Book_isbn');
        expect(ids).toContain('gen_Book');
        expect(ids).not.toContain('alien');
    });

    it('offers Book, Library, Magazine, Member: no abstract class, no enumeration, no association', () => {
        const { get, object } = uml();
        expect(creationOptions(get, object as any, 'M1').map(o => o.name)).toEqual(['Book', 'Library', 'Magazine', 'Member']);
    });

    it('names an instance after its classifier with the first free integer', () => {
        const { get, obj } = uml();
        expect(instanceName(get, 'M1', 'Book')).toBe('book1');
        obj('book1', 'InstanceSpecification');
        expect(instanceName(get, 'M1', 'Book')).toBe('book2');
    });
});

describe('the «Instances of» rail (R-OI-18)', () => {
    it('lists the ids of creationOptions per record: object enabled, link disabled', () => {
        const { get, object, link } = uml();
        const { sections } = ontoRailSections(get, 'M1');
        expect(sections.map(s => [s.record.name, s.disabled])).toEqual([['object', false], ['link', true]]);
        expect(sections[0].options).toEqual(creationOptions(get, object as any, 'M1'));
        expect(sections[1].options).toEqual(creationOptions(get, link as any, 'M1'));
        expect(sections[1].options.map(o => o.name)).toEqual(['Holdings']);
    });

    it('the signature changes on a new Class, a rename and isAbstract true, and the list follows (killed by no abstract filter)', () => {
        const { db, get, obj, val } = uml();
        const s0 = ontoRailSections(get, 'M1').signature;
        obj('Novel', 'Class'); val('Novel', 'a_Classifier_isAbstract', [false]);
        const s1 = ontoRailSections(get, 'M1');
        expect(s1.signature).not.toBe(s0);
        expect(s1.sections[0].options.map(o => o.name)).toContain('Novel');
        db.Book.name = 'Tome';
        const s2 = ontoRailSections(get, 'M1');
        expect(s2.signature).not.toBe(s1.signature);
        expect(s2.sections[0].options.map(o => o.name)).toContain('Tome');
        db['Library.a_Classifier_isAbstract'].values = [true];
        const s3 = ontoRailSections(get, 'M1');
        expect(s3.signature).not.toBe(s2.signature);
        expect(s3.sections[0].options.map(o => o.name)).toEqual(['Magazine', 'Member', 'Novel', 'Tome']);
    });

    it('no binding, or an unreadable bag, gives no section and an empty signature', () => {
        const { db, get } = uml();
        db.MM._state = {};
        expect(ontoRailSections(get, 'M1')).toEqual({ sections: [], signature: '' });
        db.MM._state = { ontoBindings: '{"v":2,"bindings":[]}' };
        expect(ontoRailSections(get, 'M1')).toEqual({ sections: [], signature: '' });
    });

    it('a drop re-reads its record by name: a bag edited after the drag runs the new record, a removed one nothing (killed by a carried record)', () => {
        const { db, get, object, link } = uml();
        const payload = ontoDragPayload(object as any, 'Book');
        const edited = { ...object, defaultValue: undefined };
        db.MM._state = { ontoBindings: JSON.stringify({ v: 1, bindings: [edited, link] }) };
        const request = ontoDropRequest(get, 'M1', payload);
        expect(request?.classifierId).toBe('Book');
        expect(request?.record).toEqual(JSON.parse(JSON.stringify(edited)));
        db.MM._state = {};
        expect(ontoDropRequest(get, 'M1', payload)).toBeNull();
    });

    it('a drop of a link, an abstract class, an unknown id or a payload that does not parse runs nothing', () => {
        const { get, object, link } = uml();
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'Member'))?.classifierId).toBe('Member');
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(link as any, 'Holdings'))).toBeNull();
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'Publication'))).toBeNull();
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'alien'))).toBeNull();
        expect(ontoDropRequest(get, 'M1', 'objectNode')).toBeNull();
    });
});

describe('the level of a viewpoint (R-OI-19)', () => {
    const levelOf = (vp: Rec | undefined) => ontoLevelOf((id: string) => (id === 'VP' ? vp : undefined), 'VP');

    it('no viewpoint reads as both, the store not read (killed by dropping the id guard)', () => {
        const get = vi.fn(() => ({ _state: { ontoLevel: 'class' } }));
        expect(ontoLevelOf(get, undefined)).toBe('both');
        expect(ontoLevelOf(get, null)).toBe('both');
        expect(ontoLevelOf(get, '')).toBe('both');
        expect(get).not.toHaveBeenCalled();
    });

    it('a viewpoint not in the store reads as both (killed by dropping the optional access on the record)', () => {
        expect(levelOf(undefined)).toBe('both');
    });

    it('a viewpoint with no _state, or no key in it, reads as both (killed by dropping the optional access on _state)', () => {
        expect(levelOf({})).toBe('both');
        expect(levelOf({ _state: {} })).toBe('both');
        expect(levelOf({ _state: { other: 1 } })).toBe('both');
    });

    it('each stored value reads back (killed by dropping either comparison)', () => {
        expect(levelOf({ _state: { ontoLevel: 'class' } })).toBe('class');
        expect(levelOf({ _state: { ontoLevel: 'instance' } })).toBe('instance');
        expect(levelOf({ _state: { ontoLevel: 'both' } })).toBe('both');
    });

    it('an unknown value reads as both (killed by returning the stored value unchecked)', () => {
        expect(levelOf({ _state: { ontoLevel: 'meta' } })).toBe('both');
        expect(levelOf({ _state: { ontoLevel: 1 } })).toBe('both');
    });

    it('the viewpoint read is the one given (killed by reading a fixed record)', () => {
        const db: Record<string, Rec> = { A: { _state: { ontoLevel: 'class' } }, B: { _state: { ontoLevel: 'instance' } } };
        const get = (id: string) => db[id];
        expect(ontoLevelOf(get, 'A')).toBe('class');
        expect(ontoLevelOf(get, 'B')).toBe('instance');
    });
});

describe('synthesisPlan', () => {
    it('Book: an InstanceSpecification typed Book, four slots in the closure order of S1, own features first', () => {
        const { get, object } = uml();
        const plan = asPlan(synthesisPlan(get, object as any, 'Book'));
        expect(plan.modelId).toBe('M1');
        expect(plan.instanceMetaclass).toBe('InstanceSpecification');
        expect(plan.instanceSeed).toEqual({ classifier: 'Book', name: 'book1' });
        expect(plan.slotKey).toBe('slots');
        expect(plan.slotMetaclass).toBe('Slot');
        expect(plan.valueKey).toBe('values');
        expect(plan.slots.map(s => s.feature)).toEqual(['p_Book_isbn', 'p_Book_genre', 'p_Publication_title', 'p_Publication_year']);
        expect(plan.slots[0].seed).toEqual({ definingFeature: 'p_Book_isbn' });
        expect(plan.slots.every(s => s.value === null)).toBe(true);
    });

    it('Member: the slot of active gets a LiteralBoolean true from defaultValue', () => {
        const { get, object } = uml();
        const plan = asPlan(synthesisPlan(get, object as any, 'Member'));
        expect(plan.slots.map(s => s.feature)).toEqual(['p_Member_name', 'p_Member_active']);
        expect(plan.slots[0].value).toBeNull();
        expect(plan.slots[1].value).toEqual({ metaclass: 'LiteralBoolean', seed: { value: true } });
    });

    it('an Integer default is typed by the field, an enumeration default is an InstanceValue on the literal', () => {
        const { get, object, val } = uml();
        val('p_Publication_year', 'a_Property_defaultValue', ['2026']);
        val('p_Book_genre', 'a_Property_defaultValue', ['fiction']);
        const plan = asPlan(synthesisPlan(get, object as any, 'Book'));
        const byFeature = Object.fromEntries(plan.slots.map(s => [s.feature, s.value]));
        expect(byFeature.p_Publication_year).toEqual({ metaclass: 'LiteralInteger', seed: { value: 2026 } });
        expect(byFeature.p_Book_genre).toEqual({ metaclass: 'InstanceValue', seed: { instance: 'fiction' } });
    });

    it('a default on a feature typed by a class gives no value object, even when an instance of it has that name', () => {
        const { get, object, val, db, obj } = uml();
        obj('book1', 'InstanceSpecification'); val('book1', 'r_InstanceSpecification_classifier', ['Book']);
        const slot = val('Library', 'r_Class_ownedAttributes', ['p_Library_featured']);
        db.p_Library_featured = { className: 'DObject', id: 'p_Library_featured', name: 'featured', instanceof: 'Property', father: slot, features: [] };
        val('p_Library_featured', 'r_TypedElement_type', ['Book']);
        val('p_Library_featured', 'a_Property_defaultValue', ['book1']);
        const plan = asPlan(synthesisPlan(get, object as any, 'Library'));
        expect(plan.slots.find(s => s.feature === 'p_Library_featured')?.value).toBeNull();
    });

    it('a record without slot roles plans the instance alone; an abstract instance metaclass is refused', () => {
        const { db, get } = uml();
        const bare = { name: 'object', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Class_ownedAttributes' };
        expect(asPlan(synthesisPlan(get, bare, 'Book')).slots).toEqual([]);
        db.InstanceSpecification.abstract = true;
        expect(synthesisPlan(get, bare, 'Book')).toEqual({ error: 'InstanceSpecification is abstract' });
    });
});

describe('syncSlotsPlan (S3a, R-OI-9)', () => {
    // dune : Book with a slot for each of the four features of its closure, in S2's order.
    const withDune = () => {
        const u = uml();
        const { obj, val } = u;
        obj('dune', 'InstanceSpecification');
        val('dune', 'r_InstanceSpecification_classifier', ['Book']);
        for (const f of ['p_Book_isbn', 'p_Book_genre', 'p_Publication_title', 'p_Publication_year']) {
            const id = `dune_${f}`;
            obj(id, 'Slot', val('dune', 'r_InstanceSpecification_slots', [id]));
            val(id, 'r_Slot_definingFeature', [f]);
        }
        return u;
    };
    const asSync = (p: SlotSyncPlan | { error: string }): SlotSyncPlan => {
        if ('error' in p) throw new Error(p.error);
        return p;
    };
    const propOn = (u: ReturnType<typeof uml>, owner: string, name: string, type: string, dflt?: string) => {
        const id = `p_${owner}_${name}`;
        u.obj(id, 'Property', u.val(owner, 'r_Class_ownedAttributes', [id]));
        u.db[id].name = name;
        u.val(id, 'r_TypedElement_type', [type]);
        if (dflt !== undefined) u.val(id, 'a_Property_defaultValue', [dflt]);
    };

    it('pages added to Book: exactly pages, with the slot roles and its default value', () => {
        const u = withDune();
        propOn(u, 'Book', 'pages', 'Integer', '320');
        const plan = asSync(syncSlotsPlan(u.get, u.object as any, 'dune'));
        expect(plan).toMatchObject({ modelId: 'M1', instance: 'dune', slotKey: 'slots', slotMetaclass: 'Slot', valueKey: 'values' });
        expect(plan.slots).toEqual([
            { feature: 'p_Book_pages', seed: { definingFeature: 'p_Book_pages' }, value: { metaclass: 'LiteralInteger', seed: { value: 320 } } },
        ]);
    });

    it('nothing missing gives no slot; an orphan and a duplicate are not in it', () => {
        const u = withDune();
        expect(asSync(syncSlotsPlan(u.get, u.object as any, 'dune')).slots).toEqual([]);
        for (const [id, f] of [['dune_orphan', 'p_Member_name'], ['dune_title2', 'p_Publication_title']]) {
            u.obj(id, 'Slot', u.val('dune', 'r_InstanceSpecification_slots', [id]));
            u.val(id, 'r_Slot_definingFeature', [f]);
        }
        expect(asSync(syncSlotsPlan(u.get, u.object as any, 'dune')).slots).toEqual([]);
    });

    it('a record without slot roles, or an instance in no model, cannot be synced', () => {
        const u = withDune();
        const bare = { name: 'object', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Class_ownedAttributes' };
        expect(syncSlotsPlan(u.get, bare, 'dune')).toEqual({ error: 'the slot roles do not resolve' });
        expect(syncSlotsPlan(u.get, u.object as any, 'nowhere')).toEqual({ error: 'the instance is in no model' });
    });
});

describe('instanceBoxSize', () => {
    // The object view of the UML fixture: two top labels (name, classifier), one slot compartment, 280x60 authored.
    const objectView = {
        defaultSize: { width: 280, height: 60 },
        shape: { labels: [{ position: 'top' }, { position: 'top' }] },
        fieldCompartments: [{ id: 'slots' }],
    };

    it('grows with the slot count: the header plus one row per slot, the view width kept', () => {
        const heights = [0, 1, 2, 4].map(n => instanceBoxSize(objectView, n));
        expect(heights).toEqual([
            { w: 280, h: 66 }, { w: 280, h: 84 }, { w: 280, h: 102 }, { w: 280, h: 138 },
        ]);
        expect(heights[3]!.h).toBe(BOX_METRICS.chrome + 2 * BOX_METRICS.label + 4 * BOX_METRICS.row);
    });

    it('never goes below the authored height, counts no rows without a compartment, and sizes nothing it does not own', () => {
        expect(instanceBoxSize({ ...objectView, defaultSize: { width: 280, height: 200 } }, 4)).toEqual({ w: 280, h: 200 });
        expect(instanceBoxSize({ ...objectView, fieldCompartments: [] }, 4)).toEqual({ w: 280, h: 66 });
        expect(instanceBoxSize({ ...objectView, defaultSize: undefined }, 4)).toBeNull();
        expect(instanceBoxSize({ ...objectView, visible: false }, 4)).toBeNull();
        expect(instanceBoxSize(null, 4)).toBeNull();
    });
});

describe('the layout of a new node (tickets (a) and (c), P-2026-10-21-1016)', () => {
    it('viewCentre is the flow point under the centre of the pane: screen = flow * zoom + offset', () => {
        expect(viewCentre({ x: 0, y: 0, zoom: 1 }, { width: 800, height: 600 })).toEqual({ x: 400, y: 300 });
        expect(viewCentre({ x: -100, y: 50, zoom: 2 }, { width: 800, height: 600 })).toEqual({ x: 250, y: 125 });
    });

    it('layoutTargets: the layout in force first, then every other exclusive viewpoint once, no decorative one', () => {
        const lookup = {
            CD: { className: 'DViewPoint', isExclusiveView: true },
            OD: { className: 'DViewPoint', isExclusiveView: true },
            DECO: { className: 'DViewPoint', isExclusiveView: false },
            V1: { className: 'DViewElement', isExclusiveView: true },
        };
        expect(layoutTargets(lookup, 'CD', 'CD')).toEqual([
            { vp: 'CD', layoutKey: 'CD', active: true }, { vp: 'OD', layoutKey: 'OD', active: false },
        ]);
        expect(layoutTargets(lookup, 'DECO', '__abstract__')).toEqual([
            { vp: 'DECO', layoutKey: '__abstract__', active: true },
            { vp: 'CD', layoutKey: 'CD', active: false }, { vp: 'OD', layoutKey: 'OD', active: false },
        ]);
        expect(layoutTargets(lookup, undefined, '__abstract__')[0]).toEqual({ vp: undefined, layoutKey: '__abstract__', active: true });
    });

    it('seedLanded reads each seeded key through the slot of the feature of that name, by value', () => {
        const { get, obj, val } = uml();
        obj('book9', 'InstanceSpecification');
        const seed = { classifier: 'Book', name: 'book9' };
        expect(seedLanded(get, 'book9', seed)).toBe(false);
        val('book9', 'r_InstanceSpecification_classifier', ['Book']);
        expect(seedLanded(get, 'book9', seed)).toBe(true);
        expect(seedLanded(get, 'book9', { classifier: 'Magazine' })).toBe(false);
        obj('lit9', 'LiteralBoolean');
        expect(seedLanded(get, 'lit9', { value: true })).toBe(false);
        val('lit9', 'a_LiteralBoolean_value', ['true']);
        expect(seedLanded(get, 'lit9', { value: true })).toBe(true);
    });

    it('layoutLanded holds once every key written is in the store, the dictionary record or the vertex itself (S2-4u)', () => {
        const lookup: Record<string, any> = { V1: { id: 'V1', className: 'DVertex', x: 0, y: 0, w: 300, layoutByViewpoint: {} } };
        const get = (id: string) => lookup[id];
        const writes: NodeLayoutWrite[] = [
            { vertex: 'V1', write: { target: 'dictionary', vpId: 'VP1', record: { x: 10, y: 20, w: 280, h: 102, isResized: true } as any } },
            { vertex: 'V1', write: { target: 'scalars', patch: { x: 10, y: 20, w: undefined } } },
        ];
        // Written but not sent: the store still holds the old vertex.
        expect(layoutLanded(get, writes)).toBe(false);
        lookup.V1 = { ...lookup.V1, layoutByViewpoint: { VP1: { x: 10, y: 20, w: 280, h: 102, isResized: true } } };
        expect(layoutLanded(get, writes)).toBe(false);
        lookup.V1 = { ...lookup.V1, x: 10, y: 20 };
        expect(layoutLanded(get, writes)).toBe(true);
        // One key short in the record is not landed; an undefined key of the patch is not a key written.
        lookup.V1 = { ...lookup.V1, layoutByViewpoint: { VP1: { x: 10, y: 20, w: 280, h: 60, isResized: true } } };
        expect(layoutLanded(get, writes)).toBe(false);
        expect(layoutLanded(get, [{ vertex: 'V2', write: { target: 'scalars', patch: { x: 1 } } }])).toBe(false);
        expect(layoutLanded(get, [])).toBe(true);
    });
});

describe('S3b: ghost rows and orphan rows (instanceRows, materializePlan)', () => {
    // The library's dune : Book with one slot per feature of its closure, each with its value; a Magazine instance.
    const library = () => {
        const u = uml();
        const { obj, val } = u;
        const instance = (id: string, cls: string, features: string[]) => {
            obj(id, 'InstanceSpecification');
            val(id, 'r_InstanceSpecification_classifier', [cls]);
            for (const f of features) {
                const sid = `${id}_${f}`;
                obj(sid, 'Slot', val(id, 'r_InstanceSpecification_slots', [sid]));
                val(sid, 'r_Slot_definingFeature', [f]);
                const vid = `${sid}_v`;
                obj(vid, 'LiteralString', val(sid, 'r_Slot_values', [vid]));
            }
        };
        instance('dune', 'Book', ['p_Book_isbn', 'p_Book_genre', 'p_Publication_title', 'p_Publication_year']);
        instance('wired', 'Magazine', ['p_Magazine_issue', 'p_Publication_title', 'p_Publication_year']);
        return u;
    };
    const addPages = (u: ReturnType<typeof uml>) => {
        const id = 'p_Book_pages';
        u.obj(id, 'Property', u.val('Book', 'r_Class_ownedAttributes', [id]));
        u.db[id].name = 'pages';
        u.val(id, 'r_TypedElement_type', ['Integer']);
        u.val(id, 'a_Property_defaultValue', ['320']);
    };
    const asPlan = (p: SlotSyncPlan | { error: string } | null): SlotSyncPlan => {
        if (p === null || 'error' in p) throw new Error(p === null ? 'no plan' : p.error);
        return p;
    };

    it('1: the library with dune\'s four slots has no ghost and no orphan', () => {
        const u = library();
        expect(instanceRows(u.get, 'dune', null)).toEqual({ ghosts: [], orphans: {}, hidden: [] });
        expect(instanceRows(u.get, 'wired', null)).toEqual({ ghosts: [], orphans: {}, hidden: [] });
    });

    it('2: pages added to Book gives dune one ghost named pages, and the Magazine instance none', () => {
        const u = library();
        addPages(u);
        expect(instanceRows(u.get, 'dune', null)!.ghosts).toEqual([{ feature: 'p_Book_pages', name: 'pages', text: null }]);
        expect(instanceRows(u.get, 'wired', null)!.ghosts).toEqual([]);
    });

    it('3: the Property isbn deleted leaves one orphan, «Its feature is gone», and no ghost isbn', () => {
        const u = library();
        delete u.db.p_Book_isbn;
        u.db['Book.r_Class_ownedAttributes'].values = u.db['Book.r_Class_ownedAttributes'].values.filter((v: string) => v !== 'p_Book_isbn');
        u.db['dune_p_Book_isbn.r_Slot_definingFeature'].values = [];
        expect(instanceRows(u.get, 'dune', null)).toEqual({ ghosts: [], orphans: { dune_p_Book_isbn: 'Its feature is gone' }, hidden: [] });
    });

    it('4: a slot of Magazine\'s issue on dune is an orphan, «issue is not a feature of Book»', () => {
        const u = library();
        u.obj('dune_issue', 'Slot', u.val('dune', 'r_InstanceSpecification_slots', ['dune_issue']));
        u.val('dune_issue', 'r_Slot_definingFeature', ['p_Magazine_issue']);
        expect(instanceRows(u.get, 'dune', null)).toEqual({ ghosts: [], orphans: { dune_issue: 'issue is not a feature of Book' }, hidden: [] });
    });

    it('5: a cleared pointer with the Property kept gives a ghost isbn and an orphan slot both', () => {
        const u = library();
        u.db['dune_p_Book_isbn.r_Slot_definingFeature'].values = [];
        expect(instanceRows(u.get, 'dune', null)).toEqual({
            ghosts: [{ feature: 'p_Book_isbn', name: 'isbn', text: null }],
            orphans: { dune_p_Book_isbn: 'Its feature is gone' },
            hidden: [],
        });
    });

    it('6: a model with no bindings, and a link instance, give null', () => {
        const u = library();
        u.obj('borrowing', 'InstanceSpecification');
        u.val('borrowing', 'r_InstanceSpecification_classifier', ['Holdings']);
        expect(instanceRows(u.get, 'borrowing', null)).toBeNull();
        delete u.db.MM._state;
        expect(instanceRows(u.get, 'dune', null)).toBeNull();
    });

    it('7: materializePlan writes the typed text, not the default; empty text, a covered feature, a literal, a non-parsing text', () => {
        const u = library();
        addPages(u);
        expect(asPlan(materializePlan(u.get, u.object as any, 'dune', 'p_Book_pages', '300')).slots).toEqual([
            { feature: 'p_Book_pages', seed: { definingFeature: 'p_Book_pages' }, value: { metaclass: 'LiteralInteger', seed: { value: 300 } } },
        ]);
        expect(materializePlan(u.get, u.object as any, 'dune', 'p_Book_pages', '  ')).toBeNull();
        expect(materializePlan(u.get, u.object as any, 'dune', 'p_Book_isbn', '42')).toEqual({ error: 'isbn has a slot already' });
        // Decision 3: a text that does not parse for the feature's type is a String value.
        expect(asPlan(materializePlan(u.get, u.object as any, 'dune', 'p_Book_pages', 'abc')).slots[0].value)
            .toEqual({ metaclass: 'LiteralString', seed: { value: 'abc' } });
        u.db['dune.r_InstanceSpecification_slots'].values = u.db['dune.r_InstanceSpecification_slots'].values
            .filter((v: string) => v !== 'dune_p_Book_genre');
        expect(asPlan(materializePlan(u.get, u.object as any, 'dune', 'p_Book_genre', 'fiction')).slots[0].value)
            .toEqual({ metaclass: 'InstanceValue', seed: { instance: 'fiction' } });
    });

    it('8: an in-flight slot covers its feature: no ghost, not an orphan, hidden until its feature lands', () => {
        const u = library();
        addPages(u);
        // Listed, its defining feature not landed yet (the seed comes 600 ms after the create).
        u.obj('dune_new', 'Slot', u.val('dune', 'r_InstanceSpecification_slots', ['dune_new']));
        u.val('dune_new', 'r_Slot_definingFeature', []);
        const flight = { features: ['p_Book_pages'], slots: { dune_new: 'p_Book_pages' }, materializing: null };
        expect(instanceRows(u.get, 'dune', flight)).toEqual({ ghosts: [], orphans: {}, hidden: ['dune_new'] });
        // Landed: drawn as a real row.
        u.db['dune_new.r_Slot_definingFeature'].values = ['p_Book_pages'];
        expect(instanceRows(u.get, 'dune', flight)).toEqual({ ghosts: [], orphans: {}, hidden: [] });
        // A materialization keeps its ghost, with the typed text, and its slot hidden until the run ends.
        const writing = { ...flight, materializing: { feature: 'p_Book_pages', text: '300' } };
        expect(instanceRows(u.get, 'dune', writing)).toEqual({
            ghosts: [{ feature: 'p_Book_pages', name: 'pages', text: '300' }], orphans: {}, hidden: ['dune_new'],
        });
    });
});

// The clabject metamodel of the multilevel discovery (§3.4) as D records, with the potency roles (R-OI-25), plus an
// association for the link rule (R-OI-30). ProductType (potency 2) { taxRate^1, price^2 }; Book : ProductType { isbn }
// with taxRate; DVD : ProductType with taxRate; mobyDick : Book with isbn and price. Pairs joins two ProductType
// instances, Stocks a ProductType instance and a Book instance.
function mlm() {
    const db: Record<string, Rec> = {};
    const get = (id: string) => db[id];
    const cls = (id: string, ext: string[] = [], abstract = false) =>
        (db[id] = { className: 'DClass', id, name: id, extends: ext, abstract, attributes: [], references: [] });
    const ref = (owner: string, name: string, type: string) => {
        const id = `r_${owner}_${name}`;
        db[id] = { className: 'DReference', id, name, father: owner, type };
        db[owner].references.push(id);
    };
    const attr = (owner: string, name: string, type: string) => {
        const id = `a_${owner}_${name}`;
        db[id] = { className: 'DAttribute', id, name, father: owner, type };
        db[owner].attributes.push(id);
    };
    for (const p of ['EString', 'EBoolean', 'EInt']) db[p] = { className: 'DClass', id: p, name: p };
    cls('Element', [], true); attr('Element', 'name', 'EString');
    cls('Clabject', ['Element']); attr('Clabject', 'potency', 'EInt'); attr('Clabject', 'isAbstract', 'EBoolean');
    cls('Field', ['Element']); attr('Field', 'potency', 'EInt'); attr('Field', 'default', 'EString');
    cls('DataType', ['Element']); cls('Slot'); cls('Value', [], true);
    cls('StringValue', ['Value']); attr('StringValue', 'value', 'EString');
    cls('IntValue', ['Value']); attr('IntValue', 'value', 'EInt');
    cls('Association', ['Element']); cls('End', ['Element']);
    ref('Clabject', 'type', 'Clabject'); ref('Clabject', 'supers', 'Clabject');
    ref('Clabject', 'fields', 'Field'); ref('Clabject', 'slots', 'Slot');
    ref('Field', 'type', 'DataType'); ref('Slot', 'field', 'Field'); ref('Slot', 'value', 'Value');
    ref('Association', 'ends', 'End'); ref('End', 'type', 'Clabject');

    const shared = { typeReference: 'r_Clabject_type', slotContainer: 'r_Clabject_slots', definingFeature: 'r_Slot_field', valueHolder: 'r_Slot_value' };
    const object = { name: 'object', ...shared, featureContainer: 'r_Clabject_fields', generalization: { direct: 'r_Clabject_supers' },
        abstractFlag: 'a_Clabject_isAbstract', featureType: 'r_Field_type', defaultValue: 'a_Field_default',
        valueKinds: [
            { when: 'primitive:String', create: 'StringValue', field: 'a_StringValue_value' },
            { when: 'primitive:Integer', create: 'IntValue', field: 'a_IntValue_value' },
        ],
        potency: 'a_Clabject_potency', featurePotency: 'a_Field_potency' };
    const link = { name: 'link', ...shared, featureContainer: 'r_Association_ends', featureType: 'r_End_type' };
    db.MM = { className: 'DModel', id: 'MM', isMetamodel: true, _state: { ontoBindings: JSON.stringify({ v: 1, bindings: [object, link] }) } };
    db.M1 = { className: 'DModel', id: 'M1', isMetamodel: false, instanceof: 'MM', objects: [] };

    const val = (o: string, feature: string, values: unknown[]) => {
        const vid = `${o}.${feature}`;
        if (!db[vid]) { db[vid] = { className: 'DValue', id: vid, father: o, instanceof: feature, values: [] }; db[o].features.push(vid); }
        db[vid].values.push(...values);
        return vid;
    };
    const obj = (id: string, meta: string, father = 'M1') => {
        db[id] = { className: 'DObject', id, name: id, instanceof: meta, father, features: [] };
        if (father === 'M1') db.M1.objects.push(id);
        val(id, 'a_Element_name', [id]);
    };
    const clabject = (id: string, type?: string, potency?: number) => {
        obj(id, 'Clabject');
        if (type !== undefined) val(id, 'r_Clabject_type', [type]);
        if (potency !== undefined) val(id, 'a_Clabject_potency', [potency]);
        val(id, 'r_Clabject_slots', []);
    };
    const field = (owner: string, name: string, type: string, potency?: number) => {
        const id = `f_${owner}_${name}`;
        obj(id, 'Field', val(owner, 'r_Clabject_fields', [id]));
        db[id].name = name;
        val(id, 'r_Field_type', [type]);
        if (potency !== undefined) val(id, 'a_Field_potency', [potency]);
        return id;
    };
    // A slot is `<clabject>_<field name>`, its value `<slot>_v`.
    const slot = (inst: string, feature: string, meta?: string, v?: unknown) => {
        const id = `${inst}_${db[feature]?.name ?? feature}`;
        obj(id, 'Slot', val(inst, 'r_Clabject_slots', [id]));
        val(id, 'r_Slot_field', [feature]);
        if (meta) {
            obj(`${id}_v`, meta, val(id, 'r_Slot_value', [`${id}_v`]));
            if (v !== undefined) val(`${id}_v`, `a_${meta}_value`, [v]);
        }
        return id;
    };
    const association = (id: string, first: string, second: string) => {
        obj(id, 'Association');
        for (const [n, type] of [[1, first], [2, second]] as const) {
            const end = `${id}_end${n}`;
            obj(end, 'End', val(id, 'r_Association_ends', [end]));
            val(end, 'r_End_type', [type]);
        }
    };
    for (const t of ['String', 'Integer']) obj(t, 'DataType');
    clabject('ProductType', undefined, 2);
    field('ProductType', 'taxRate', 'Integer', 1);
    field('ProductType', 'price', 'Integer', 2);
    clabject('Book', 'ProductType');
    field('Book', 'isbn', 'String');
    slot('Book', 'f_ProductType_taxRate', 'IntValue', 7);
    clabject('DVD', 'ProductType');
    slot('DVD', 'f_ProductType_taxRate', 'IntValue', 5);
    clabject('mobyDick', 'Book');
    slot('mobyDick', 'f_Book_isbn', 'StringValue', '978-0142437247');
    slot('mobyDick', 'f_ProductType_price', 'IntValue', 10);
    association('Pairs', 'ProductType', 'ProductType');
    association('Stocks', 'ProductType', 'Book');
    return { db, get, object, link, val, obj, clabject, field, slot };
}

describe('multilevel consumers (R-OI-26, R-OI-30; P-2026-11-16-0300)', () => {
    it('an instance of ProductType gets taxRate alone, an instance of Book gets isbn then price (killed by synthesis on featureClosure)', () => {
        const { get, object } = mlm();
        const ofProductType = asPlan(synthesisPlan(get, object as any, 'ProductType'));
        expect(ofProductType.instanceMetaclass).toBe('Clabject');
        expect(ofProductType.instanceSeed).toEqual({ type: 'ProductType', name: 'productType1' });
        expect(ofProductType.slots.map(s => s.feature)).toEqual(['f_ProductType_taxRate']);
        const ofBook = asPlan(synthesisPlan(get, object as any, 'Book'));
        expect(ofBook.instanceSeed).toEqual({ type: 'Book', name: 'book1' });
        expect(ofBook.slots.map(s => s.feature)).toEqual(['f_Book_isbn', 'f_ProductType_price']);
        expect(ofBook.slots[1].seed).toEqual({ field: 'f_ProductType_price' });
    });

    it('a default two levels up is planned on the slot it becomes', () => {
        const { get, object, val } = mlm();
        val('f_ProductType_price', 'a_Field_default', ['12']);
        const ofBook = asPlan(synthesisPlan(get, object as any, 'Book'));
        expect(ofBook.slots[1].value).toEqual({ metaclass: 'IntValue', seed: { value: 12 } });
    });

    it('the three levels are clean; mobyDick without price shows one ghost price, Book none', () => {
        const u = mlm();
        for (const id of ['Book', 'DVD', 'mobyDick']) expect(instanceRows(u.get, id, null)).toEqual({ ghosts: [], orphans: {}, hidden: [] });
        u.db['mobyDick.r_Clabject_slots'].values = ['mobyDick_isbn'];
        expect(instanceRows(u.get, 'mobyDick', null)!.ghosts).toEqual([{ feature: 'f_ProductType_price', name: 'price', text: null }]);
        expect(instanceRows(u.get, 'Book', null)!.ghosts).toEqual([]);
    });

    it('a ghost being written keeps its place among the due features once its slot has landed (killed by the ghost order on featureClosure)', () => {
        const u = mlm();
        u.db['mobyDick.r_Clabject_slots'].values = ['mobyDick_price'];
        const flight = { features: ['f_ProductType_price'], slots: { mobyDick_price: 'f_ProductType_price' }, materializing: { feature: 'f_ProductType_price', text: '11' } };
        expect(instanceRows(u.get, 'mobyDick', flight)!.ghosts).toEqual([
            { feature: 'f_Book_isbn', name: 'isbn', text: null },
            { feature: 'f_ProductType_price', name: 'price', text: '11' },
        ]);
    });

    it('a slot due at another level of the type chain is an orphan that says how many levels, and which way', () => {
        const u = mlm();
        u.slot('mobyDick', 'f_ProductType_taxRate', 'IntValue', 7);
        u.slot('Book', 'f_ProductType_price', 'IntValue', 9);
        u.slot('DVD', 'f_Book_isbn');
        expect(instanceRows(u.get, 'mobyDick', null)!.orphans).toEqual({ mobyDick_taxRate: 'taxRate is due 1 level above mobyDick' });
        expect(instanceRows(u.get, 'Book', null)!.orphans).toEqual({ Book_price: 'price is due 1 level below Book' });
        expect(instanceRows(u.get, 'DVD', null)!.orphans).toEqual({ DVD_isbn: 'isbn is not a feature of ProductType' });
    });

    it('a field never due keeps the plain orphan text: potency above its owner\'s, or below 1', () => {
        const u = mlm();
        u.db['f_ProductType_price.a_Field_potency'].values = [3];
        expect(instanceRows(u.get, 'mobyDick', null)!.orphans).toEqual({ mobyDick_price: 'price is not a feature of Book' });
        u.db['f_ProductType_price.a_Field_potency'].values = [0];
        expect(instanceRows(u.get, 'mobyDick', null)!.orphans).toEqual({ mobyDick_price: 'price is not a feature of Book' });
    });

    it('a link joins two instances at one level: Book and DVD by Pairs, never Book and mobyDick (killed by dropping the same-level guard)', () => {
        const { get } = mlm();
        expect(linkOptions(get, 'Book', 'DVD').map(o => o.name)).toEqual(['Pairs']);
        expect(linkOptions(get, 'Book', 'DVD')[0].ends).toEqual(['Book', 'DVD']);
        // Stocks accepts Book (a ProductType) and mobyDick (a Book) by their classifiers; their levels are 1 and 2.
        expect(linkOptions(get, 'Book', 'mobyDick')).toEqual([]);
        expect(linkOptions(get, 'mobyDick', 'Book')).toEqual([]);
    });

    it('UML, two levels and no potency role: the plans of today, inheritance included', () => {
        const { get, object } = uml();
        expect(asPlan(synthesisPlan(get, object as any, 'Magazine')).slots.map(s => s.feature))
            .toEqual(['p_Magazine_issue', 'p_Publication_title', 'p_Publication_year']);
        expect(asPlan(synthesisPlan(get, object as any, 'Library')).slots.map(s => s.feature)).toEqual(['p_Library_name']);
    });
});

// The write half of `instantiate` over a fake store and a fake undo history (P-2026-11-06-2225). The history keeps the
// trunk's rules (`reducer.ts` `beginUndoGroup` / `endUndoGroup`): every store write is one entry holding the records it
// replaced, a nested begin only counts, the outermost end folds the entries since its mark into one, older record kept.
const h = vi.hoisted(() => {
    const s: any = { lookup: {}, entries: [], depth: 0, mark: 0, opened: [], closed: [], layoutLands: true, vertexAfterMs: 20, made: 0 };
    // The root's viewpoint, the viewpoints whose IR draws the instance, the node layout writes resolved (P-2026-11-07-1620).
    Object.assign(s, { rootVp: undefined, irDraws: [], layoutCalls: [] });
    // `getLayoutKeyFor`'s rule: an exclusive viewpoint is its own key, anything else abstract syntax.
    s.keyFor = (state: any, vp: unknown) =>
        (typeof vp === 'string' && state?.idlookup?.[vp]?.isExclusiveView ? vp : '__abstract__');
    s.write = (id: string, rec: any) => {
        s.entries.push({ [id]: s.lookup[id] === undefined ? undefined : structuredClone(s.lookup[id]) });
        s.lookup[id] = rec;
    };
    s.undo = () => {
        const e = s.entries.pop();
        for (const k of Object.keys(e)) { if (e[k] === undefined) delete s.lookup[k]; else s.lookup[k] = e[k]; }
    };
    s.begin = () => {
        if (s.depth++ > 0) return;
        s.mark = s.entries.length;
        s.opened.push({ at: Date.now(), lookup: structuredClone(s.lookup) });
    };
    s.end = () => {
        if (s.depth === 0 || --s.depth > 0) return;
        s.closed.push(Date.now());
        const grouped: any[] = s.entries.splice(s.mark);
        if (grouped.length === 0) return;
        const merged: Record<string, any> = {};
        for (const d of grouped) for (const k of Object.keys(d)) if (!(k in merged)) merged[k] = d[k];
        s.entries.push(merged);
    };
    // `addObject`: the object now, its seed 60 ms later; the sync draws a root object's vertex `vertexAfterMs` later.
    // A contained object is listed 30 ms later in its owner's DValue of the feature named `key`.
    s.create = (modelId: string, className: string, ownerId: string | null, key: string | null, seed: Record<string, unknown>) => {
        const id = `${className}_${++s.made}`;
        s.write(id, { id, className: 'DObject', instanceof: className, father: ownerId ?? modelId, features: [] });
        if (ownerId && key) setTimeout(() => {
            const vid = (s.lookup[ownerId]?.features ?? []).find((f: string) => s.lookup[s.lookup[f]?.instanceof]?.name === key);
            if (vid) s.write(vid, { ...s.lookup[vid], values: [...s.lookup[vid].values, id] });
        }, 30);
        setTimeout(() => {
            for (const [key, value] of Object.entries(seed ?? {})) {
                if (!s.lookup[`f_${key}`]) s.write(`f_${key}`, { id: `f_${key}`, name: key });
                const vid = `${id}.${key}`;
                s.write(vid, { id: vid, className: 'DValue', instanceof: `f_${key}`, values: [value] });
                s.write(id, { ...s.lookup[id], features: [...s.lookup[id].features, vid] });
            }
        }, 60);
        if (!ownerId) setTimeout(() => s.write(`V_${id}`, { id: `V_${id}`, className: 'DVertex', model: id, x: 0, y: 0 }), s.vertexAfterMs);
        return { ok: true, id };
    };
    // A SetFieldAction lands on the store's next COMMIT, or never.
    s.setField = (id: string, key: string, value: unknown) => {
        if (s.layoutLands) setTimeout(() => s.write(id, { ...s.lookup[id], [key]: value }), 30);
    };
    return s;
});

vi.mock('../../../../joiner', () => ({
    store: { getState: () => ({ idlookup: h.lookup, viewpoint: h.rootVp }) },
    TRANSACTION: (_name: string, f: () => void) => f(),
    SetFieldAction: { new: (id: string, key: string, value: unknown) => h.setField(id, key, value) },
}));
vi.mock('../createAdapter', () => ({ createInstance: (...a: any[]) => (h.create as any)(...a) }));
vi.mock('../../viewpoint/ir/irResolveCore', () => ({
    computeIRSignature: (_s: unknown, vp: unknown) => (h.irDraws.includes(vp) ? `sig:${vp}` : null),
    getIRIndex: (_s: unknown, signature: unknown) => signature,
    resolveIRView: () => ({ kind: 'vertex', ir: {} }),
}));
vi.mock('../../viewpoint/ir/irReadCtxLproxy', () => ({ makeReadCtx: () => ({}) }));
vi.mock('../../viewpoint/layout/vertexLayoutAdapter', () => ({
    getLayoutKeyOf: (state: any) => h.keyFor(state, state?.viewpoint),
    getLayoutKeyFor: (state: any, vp: unknown) => h.keyFor(state, vp),
}));
vi.mock('../../viewpoint/layout/vertexLayout', () => ({
    resolveVertexLayoutWrite: (_v: unknown, patch: unknown, layoutKey: string) => {
        h.layoutCalls.push({ layoutKey, patch });
        // An exclusive viewpoint's key goes to the vertex's dictionary, abstract syntax to its scalars (R-LAY-16).
        return layoutKey === '__abstract__' ? { target: 'scalars', patch } : { target: 'dictionary', vpId: layoutKey, record: patch };
    },
}));
vi.mock('../../../../redux/reducer/reducer', () => ({ beginUndoGroup: () => h.begin(), endUndoGroup: () => h.end() }));

describe('instantiate: one undo entry per instantiation, one deadline per instantiation (P-2026-11-06-2225)', () => {
    const bare = { name: 'object', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Class_ownedAttributes' };
    const place = () => ({ x: 10, y: 20 });
    const setup = (o: { layoutLands?: boolean; vertexAfterMs?: number; db?: Record<string, Rec> } = {}) => {
        Object.assign(h, { lookup: o.db ?? uml().db, entries: [], depth: 0, mark: 0, opened: [], closed: [], made: 0 });
        Object.assign(h, { layoutLands: o.layoutLands ?? true, vertexAfterMs: o.vertexAfterMs ?? 20 });
        return structuredClone(h.lookup);
    };
    // Loaded once here, so the dynamic imports of `instantiate` resolve from the cache under the fake clock.
    beforeAll(async () => {
        await Promise.all([import('../../../../joiner'), import('../createAdapter'), import('../../../../redux/reducer/reducer')]);
    });

    it('a call made while another holds its undo group runs after it: two entries in order, each undone exactly (Q1)', async () => {
        // The second click comes once the first instantiation has opened its group and waits for its writes. Not in the
        // same tick: two calls loading the mocked modules at once get the mock for one of them only (vitest), and the
        // mutant without the queue then died of a module load, not of these assertions (bench, P-2026-11-06-2225).
        const before = setup();
        const first = instantiate('Book', bare as any, place);
        for (let i = 0; i < 200 && h.depth === 0; i++) await new Promise(resolve => setTimeout(resolve, 5));
        expect(h.depth).toBe(1);
        const [a, b] = await Promise.all([first, instantiate('Magazine', bare as any, place)]);
        expect([a.problems, b.problems]).toEqual([[], []]);
        expect(h.depth).toBe(0);
        expect(h.entries).toHaveLength(2);
        expect(h.opened).toHaveLength(2);
        expect(Object.keys(h.entries[0])).toContain(a.instance);
        expect(Object.keys(h.entries[0])).not.toContain(b.instance);
        expect(Object.keys(h.entries[1])).toContain(b.instance);
        expect(h.opened[0].lookup).toEqual(before);
        h.undo();
        expect(h.lookup).toEqual(h.opened[1].lookup);
        expect(h.lookup[a.instance!]).toBeDefined();
        expect(h.lookup[b.instance!]).toBeUndefined();
        h.undo();
        expect(h.lookup).toEqual(before);
    });

    it('a «Sync slots» asked while an instantiation holds its undo group runs after it: two entries, each undone exactly (S1)', async () => {
        // dune : Book has the slots of its closure but pages, added to Book since. Same pacing as Q1.
        const u = uml();
        u.obj('dune', 'InstanceSpecification');
        u.val('dune', 'r_InstanceSpecification_classifier', ['Book']);
        for (const f of ['p_Book_isbn', 'p_Book_genre', 'p_Publication_title', 'p_Publication_year']) {
            u.obj(`dune_${f}`, 'Slot', u.val('dune', 'r_InstanceSpecification_slots', [`dune_${f}`]));
            u.val(`dune_${f}`, 'r_Slot_definingFeature', [f]);
        }
        u.obj('p_Book_pages', 'Property', u.val('Book', 'r_Class_ownedAttributes', ['p_Book_pages']));
        u.db.p_Book_pages.name = 'pages';
        u.val('p_Book_pages', 'r_TypedElement_type', ['Integer']);
        const before = setup({ db: u.db });
        const first = instantiate('Book', bare as any, place);
        for (let i = 0; i < 200 && h.depth === 0; i++) await new Promise(resolve => setTimeout(resolve, 5));
        expect(h.depth).toBe(1);
        const [a, b] = await Promise.all([first, syncSlots('dune', u.object as any)]);
        expect([a.problems, b.problems]).toEqual([[], []]);
        expect(b.slots).toHaveLength(1);
        const slot = b.slots[0];
        expect(h.depth).toBe(0);
        expect(h.entries).toHaveLength(2);
        expect(h.opened).toHaveLength(2);
        expect(Object.keys(h.entries[0])).toContain(a.instance);
        expect(Object.keys(h.entries[0])).not.toContain(slot);
        expect(Object.keys(h.entries[1])).toContain(slot);
        expect(Object.keys(h.entries[1])).not.toContain(a.instance);
        h.undo();
        expect(h.lookup).toEqual(h.opened[1].lookup);
        expect(h.lookup[a.instance!]).toBeDefined();
        expect(h.lookup[slot]).toBeUndefined();
        h.undo();
        expect(h.lookup).toEqual(before);
    });

    it('a ghost value typed while an instantiation holds its undo group is written after it: two entries, each undone exactly (G1)', async () => {
        // dune : Book as in S1, pages its ghost; 300 typed in it. Same pacing as Q1.
        const u = uml();
        u.obj('dune', 'InstanceSpecification');
        u.val('dune', 'r_InstanceSpecification_classifier', ['Book']);
        for (const f of ['p_Book_isbn', 'p_Book_genre', 'p_Publication_title', 'p_Publication_year']) {
            u.obj(`dune_${f}`, 'Slot', u.val('dune', 'r_InstanceSpecification_slots', [`dune_${f}`]));
            u.val(`dune_${f}`, 'r_Slot_definingFeature', [f]);
        }
        u.obj('p_Book_pages', 'Property', u.val('Book', 'r_Class_ownedAttributes', ['p_Book_pages']));
        u.db.p_Book_pages.name = 'pages';
        u.val('p_Book_pages', 'r_TypedElement_type', ['Integer']);
        const before = setup({ db: u.db });
        // `addObject` gives a new slot the DValue of its values with the object; the fake writes it with the listing.
        const create = h.create;
        h.create = (modelId: string, className: string, ownerId: string | null, key: string | null, seed: Record<string, unknown>) => {
            const made = create(modelId, className, ownerId, key, seed);
            if (className === 'Slot') setTimeout(() => {
                const vid = `${made.id}.r_Slot_values`;
                h.write(vid, { id: vid, className: 'DValue', instanceof: 'r_Slot_values', values: [] });
                h.write(made.id, { ...h.lookup[made.id], features: [...h.lookup[made.id].features, vid] });
            }, 30);
            return made;
        };
        try {
            const first = instantiate('Book', bare as any, place);
            for (let i = 0; i < 200 && h.depth === 0; i++) await new Promise(resolve => setTimeout(resolve, 5));
            expect(h.depth).toBe(1);
            const [a, b] = await Promise.all([first, materializeSlot('dune', 'p_Book_pages', '300')]);
            expect([a.problems, b.problems]).toEqual([[], []]);
            expect([b.slots, b.values].map(ids => ids.length)).toEqual([1, 1]);
            const [slot, value] = [b.slots[0], b.values[0]];
            expect(h.depth).toBe(0);
            expect(h.entries).toHaveLength(2);
            expect(h.opened).toHaveLength(2);
            expect(Object.keys(h.entries[0])).toContain(a.instance);
            expect(Object.keys(h.entries[0])).not.toContain(slot);
            expect(Object.keys(h.entries[1])).toEqual(expect.arrayContaining([slot, value]));
            expect(Object.keys(h.entries[1])).not.toContain(a.instance);
            h.undo();
            expect(h.lookup).toEqual(h.opened[1].lookup);
            expect(h.lookup[a.instance!]).toBeDefined();
            expect([h.lookup[slot], h.lookup[value]]).toEqual([undefined, undefined]);
            h.undo();
            expect(h.lookup).toEqual(before);
        } finally {
            h.create = create;
        }
    });

    it('a layout that never lands closes the group by the shared deadline, records it, leaves no group open (D1)', async () => {
        // The vertex comes 5 s late and its layout write never lands: one deadline closes the group at 8 s, where a
        // fresh limit per wait would hold it for 5 s plus 6 s.
        const before = setup({ layoutLands: false, vertexAfterMs: 5000 });
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
        let done: InstantiateResult | null = null;
        try {
            void instantiate('Book', bare as any, place).then(r => { done = r; });
            for (let i = 0; i < 1000 && !done; i++) await vi.advanceTimersByTimeAsync(50);
        } finally {
            vi.useRealTimers();
        }
        const r = done as InstantiateResult | null;
        expect(r?.problems).toEqual(['the node layout did not land within 8000 ms']);
        expect(r?.ok).toBe(false);
        expect(h.depth).toBe(0);
        expect(h.closed).toHaveLength(1);
        expect(h.closed[0] - h.opened[0].at).toBeGreaterThanOrEqual(8000);
        expect(h.closed[0] - h.opened[0].at).toBeLessThanOrEqual(8000 + 50);
        expect(h.entries).toHaveLength(1);
        h.undo();
        expect(h.lookup).toEqual(before);
    });
});

describe('instantiate under the layout of the tab, not the root (P-2026-11-07-1620)', () => {
    // Two exclusive viewpoints of the project; the root shows CD while the tab the click is in shows another.
    const bare = { name: 'object', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Class_ownedAttributes' };
    const CLICK = { x: 11, y: 22 };
    const CENTRE = { x: 500, y: 300 };
    // runInstantiate's placement: the click under the key of the tab, the centre of the view under any other.
    const placeFor = (tabKey: string) => (layoutKey: string) => (layoutKey === tabKey ? CLICK : CENTRE);
    const run = async (o: { viewpoint?: string | null; tabKey: string; irDraws?: string[] }) => {
        const db = uml().db;
        db.CD = { className: 'DViewPoint', id: 'CD', isExclusiveView: true };
        db.OD = { className: 'DViewPoint', id: 'OD', isExclusiveView: true };
        Object.assign(h, { lookup: db, entries: [], depth: 0, mark: 0, opened: [], closed: [], made: 0, layoutLands: true, vertexAfterMs: 20 });
        Object.assign(h, { rootVp: 'CD', irDraws: o.irDraws ?? [], layoutCalls: [] });
        try {
            const r = await instantiate('Book', bare as any, placeFor(o.tabKey), o.viewpoint);
            expect(r.problems).toEqual([]);
            // One entry per layout key, the point written there (a node laid out twice keeps its last write).
            const at = new Map<string, unknown>();
            for (const c of h.layoutCalls) at.set(c.layoutKey, { x: c.patch.x, y: c.patch.y });
            return Object.fromEntries(at);
        } finally {
            Object.assign(h, { rootVp: undefined, irDraws: [], layoutCalls: [] });
        }
    };
    beforeAll(async () => {
        await Promise.all([import('../../../../joiner'), import('../createAdapter'), import('../../../../redux/reducer/reducer')]);
    });

    it('layoutTargets: an abstract-syntax tab is in force, the root\'s exclusive viewpoint one more layout', () => {
        const lookup = { CD: { className: 'DViewPoint', isExclusiveView: true }, OD: { className: 'DViewPoint', isExclusiveView: true } };
        expect(layoutTargets(lookup, null, '__abstract__')).toEqual([
            { vp: undefined, layoutKey: '__abstract__', active: true },
            { vp: 'CD', layoutKey: 'CD', active: false }, { vp: 'OD', layoutKey: 'OD', active: false },
        ]);
    });

    it('an abstract-syntax tab under an exclusive root: the click lands in the tab\'s layout (killed by the root in force)', async () => {
        // CD's IR draws the instance, so the root's layout takes the centre; the tab's takes the click.
        expect(await run({ viewpoint: null, tabKey: '__abstract__', irDraws: ['CD'] })).toEqual({ __abstract__: CLICK, CD: CENTRE });
    });

    it('an exclusive tab whose IR does not draw the instance: its layout still takes the click (killed by the root in force)', async () => {
        // In force, the tab's layout takes the position without a view; the root's, not drawn there, takes nothing.
        expect(await run({ viewpoint: 'OD', tabKey: 'OD' })).toEqual({ OD: CLICK });
    });

    it('no viewpoint given: the root\'s is in force, as before (killed by reading absent as abstract syntax)', async () => {
        expect(await run({ viewpoint: undefined, tabKey: 'CD' })).toEqual({ CD: CLICK });
    });
});

describe('the levels of a viewpoint and the instance surfaces (R-OI-29; P-2026-11-16-0340)', () => {
    const at = (ontoLevel: unknown) => ({ _state: { ontoLevel } });
    const setOf = (vp: Rec | undefined) => ontoLevelsOf((id: string) => (id === 'VP' ? vp : undefined), 'VP');
    const levelOf = (vp: Rec | undefined) => ontoLevelOf((id: string) => (id === 'VP' ? vp : undefined), 'VP');
    const has = (vp: Rec | undefined, n: number) => ontoLevelIn(setOf(vp), n);
    // The MLM fixture with one viewpoint per stored level.
    const withViewpoint = (ontoLevel?: unknown) => {
        const fx = mlm();
        fx.db.VP = ontoLevel === undefined ? {} : at(ontoLevel);
        return fx;
    };
    const names = (options: { name: string }[]) => options.map(o => o.name);

    it('ontoLevelsOf: absent, both and unknown are every level; class {0}; instance every level below the top (killed by instance as {1})', () => {
        for (const vp of [undefined, {}, at('both'), at('meta'), at(2), at(''), at('1,x'), at('-1')]) {
            expect([0, 1, 2, 7].map(n => ontoLevelIn(setOf(vp), n))).toEqual([true, true, true, true]);
        }
        expect(setOf(at('class'))).toEqual({ levels: [0] });
        expect([0, 1, 2, 7].map(n => has(at('instance'), n))).toEqual([false, true, true, true]);
        expect(ontoLevelsOf(() => at('class'), undefined)).toEqual(ontoLevelsOf(() => at('class'), null));
        expect([0, 1, 2, 3].map(n => has(at('2'), n))).toEqual([false, false, true, false]);
        expect([0, 1, 2, 3].map(n => has(at(' 2 , 1,2'), n))).toEqual([false, true, true, false]);
        expect(setOf(at('2,1,2'))).toEqual({ levels: [1, 2] });
    });

    it('ontoLevelOf on every string form: class exactly at {0}, the aliases as before (killed by class on any set holding 0)', () => {
        expect(levelOf(at('class'))).toBe('class');
        expect(levelOf(at('0'))).toBe('class');
        expect(levelOf(at('0,0'))).toBe('class');
        expect(levelOf(at('0,1'))).toBe('both');
        expect(levelOf(at('instance'))).toBe('instance');
        expect(levelOf(at('1'))).toBe('instance');
        expect(levelOf(at('2'))).toBe('instance');
        expect(levelOf(at('1,2'))).toBe('instance');
        expect(levelOf(at('both'))).toBe('both');
        expect(levelOf(at('meta'))).toBe('both');
        expect(levelOf(at(0))).toBe('both');
        expect(levelOf(undefined)).toBe('both');
    });

    it('ontoLevelKeyOf gives the canonical stored form the select compares', () => {
        const key = (vp: Rec | undefined) => ontoLevelKeyOf((id: string) => (id === 'VP' ? vp : undefined), 'VP');
        expect([at('class'), at('instance'), at('both'), at('2'), at(' 2,1,2'), at('meta'), at(3), undefined].map(key))
            .toEqual(['class', 'instance', 'both', '2', '1,2', 'both', 'both', 'both']);
    });

    it('three levels: each viewpoint offers the classifiers whose instances land at its levels (killed by dropping the level filter)', () => {
        const offered = (ontoLevel?: unknown) => {
            const { get, object } = withViewpoint(ontoLevel);
            return names(creationOptions(get, object as any, 'M1', 'VP'));
        };
        expect(offered()).toEqual(['Book', 'DVD', 'ProductType']);
        expect(offered('both')).toEqual(['Book', 'DVD', 'ProductType']);
        expect(offered('instance')).toEqual(['Book', 'DVD', 'ProductType']);
        expect(offered('1')).toEqual(['ProductType']);
        expect(offered('2')).toEqual(['Book', 'DVD']);
        expect(offered('1,2')).toEqual(['Book', 'DVD', 'ProductType']);
        expect(offered('0')).toEqual([]);
        expect(offered('class')).toEqual([]);
        expect(offered('3')).toEqual([]);
        const { get, object } = withViewpoint('2');
        expect(names(creationOptions(get, object as any, 'M1'))).toEqual(['Book', 'DVD', 'ProductType']);
    });

    it('the rail follows the viewpoint: its object section and its signature (killed by dropping the level filter)', () => {
        const { get, db } = withViewpoint('1');
        const one = ontoRailSections(get, 'M1', 'VP');
        expect(names(one.sections[0].options)).toEqual(['ProductType']);
        db.VP = at('2');
        const two = ontoRailSections(get, 'M1', 'VP');
        expect(names(two.sections[0].options)).toEqual(['Book', 'DVD']);
        expect(two.signature).not.toBe(one.signature);
        expect(names(ontoRailSections(get, 'M1').sections[0].options)).toEqual(['Book', 'DVD', 'ProductType']);
    });

    it('a drop re-checks the level: a payload of another level runs nothing (killed by dropping the drop guard)', () => {
        const { get, object, db } = withViewpoint('2');
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'Book'), 'VP')?.classifierId).toBe('Book');
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'ProductType'), 'VP')).toBeNull();
        db.VP = at('1');
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'Book'), 'VP')).toBeNull();
        expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'ProductType'), 'VP')?.classifierId).toBe('ProductType');
    });

    it('UML unchanged: at every alias and at level 1 the options are those with no viewpoint, the drop too', () => {
        const { db, get, object } = uml();
        const none = creationOptions(get, object as any, 'M1');
        expect(names(none)).toEqual(['Book', 'Library', 'Magazine', 'Member']);
        for (const ontoLevel of ['both', 'instance', '1']) {
            db.VP = at(ontoLevel);
            expect(creationOptions(get, object as any, 'M1', 'VP')).toEqual(none);
            expect(ontoRailSections(get, 'M1', 'VP')).toEqual(ontoRailSections(get, 'M1'));
            expect(ontoDropRequest(get, 'M1', ontoDragPayload(object as any, 'Member'), 'VP')?.classifierId).toBe('Member');
        }
        db.VP = at('2');
        expect(creationOptions(get, object as any, 'M1', 'VP')).toEqual([]);
    });

    it('the Attributes group: for a clabject below the top, none at class, none on UML', () => {
        const { db } = withViewpoint('2');
        db.MM.classes = Object.keys(db).filter(id => db[id].className === 'DClass' && !['EString', 'EBoolean', 'EInt'].includes(id));
        for (const ontoLevel of ['2', '1', 'instance', 'both']) {
            db.VP = at(ontoLevel);
            expect(clabjectPropertyGroup(db, 'M1', 'VP')?.items.map(i => i.metaclass)).toEqual(['Field']);
        }
        for (const ontoLevel of ['class', '0']) {
            db.VP = at(ontoLevel);
            expect(clabjectPropertyGroup(db, 'M1', 'VP')).toBeNull();
        }
        const fx = uml();
        fx.db.VP = at('instance');
        expect(clabjectPropertyGroup(fx.db, 'M1', 'VP')).toBeNull();
    });

    it('bindingsDeclarePotency: the MLM bag declares one, UML\'s none, an unreadable bag none', () => {
        const { get } = mlm();
        expect(bindingsDeclarePotency(get, ['MM'])).toBe(true);
        const u = uml();
        expect(bindingsDeclarePotency(u.get, ['MM'])).toBe(false);
        u.db.MM._state = { ontoBindings: '{' };
        expect(bindingsDeclarePotency(u.get, ['MM', '', 7])).toBe(false);
        expect(bindingsDeclarePotency(get, [])).toBe(false);
    });
});
