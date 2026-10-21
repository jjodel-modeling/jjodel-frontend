import { describe, expect, it } from 'vitest';
import {
    BOX_METRICS, creationOptions, instanceBoxSize, instanceName, layoutTargets, modelObjectIds, objectRecord, ontoReadView,
    layoutLanded, readOntoBindings, seedLanded, synthesisPlan, syncSlotsPlan, viewCentre, type NodeLayoutWrite,
    type SlotSyncPlan, type SynthesisPlan,
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
