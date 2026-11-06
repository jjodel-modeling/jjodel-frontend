import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    BOX_METRICS, creationOptions, instanceBoxSize, instanceName, layoutTargets, modelObjectIds, objectRecord, ontoReadView,
    layoutLanded, readOntoBindings, seedLanded, synthesisPlan, viewCentre, type NodeLayoutWrite, type SynthesisPlan,
    instantiate, type InstantiateResult,
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

// The write half of `instantiate` over a fake store and a fake undo history (P-2026-11-06-2225). The history keeps the
// trunk's rules (`reducer.ts` `beginUndoGroup` / `endUndoGroup`): every store write is one entry holding the records it
// replaced, a nested begin only counts, the outermost end folds the entries since its mark into one, older record kept.
const h = vi.hoisted(() => {
    const s: any = { lookup: {}, entries: [], depth: 0, mark: 0, opened: [], closed: [], layoutLands: true, vertexAfterMs: 20, made: 0 };
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
    s.create = (modelId: string, className: string, ownerId: string | null, _key: string | null, seed: Record<string, unknown>) => {
        const id = `${className}_${++s.made}`;
        s.write(id, { id, className: 'DObject', instanceof: className, father: ownerId ?? modelId, features: [] });
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
    store: { getState: () => ({ idlookup: h.lookup, viewpoint: undefined }) },
    TRANSACTION: (_name: string, f: () => void) => f(),
    SetFieldAction: { new: (id: string, key: string, value: unknown) => h.setField(id, key, value) },
}));
vi.mock('../createAdapter', () => ({ createInstance: (...a: any[]) => (h.create as any)(...a) }));
vi.mock('../../viewpoint/ir/irResolveCore', () => ({ computeIRSignature: () => null, getIRIndex: () => null, resolveIRView: () => null }));
vi.mock('../../viewpoint/ir/irReadCtxLproxy', () => ({ makeReadCtx: () => ({}) }));
vi.mock('../../viewpoint/layout/vertexLayoutAdapter', () => ({ getLayoutKeyOf: () => '__abstract__' }));
vi.mock('../../viewpoint/layout/vertexLayout', () => ({ resolveVertexLayoutWrite: (_v: unknown, patch: unknown) => ({ target: 'scalars', patch }) }));
vi.mock('../../../../redux/reducer/reducer', () => ({ beginUndoGroup: () => h.begin(), endUndoGroup: () => h.end() }));

describe('instantiate: one undo entry per instantiation, one deadline per instantiation (P-2026-11-06-2225)', () => {
    const bare = { name: 'object', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Class_ownedAttributes' };
    const place = () => ({ x: 10, y: 20 });
    const setup = (o: { layoutLands?: boolean; vertexAfterMs?: number } = {}) => {
        Object.assign(h, { lookup: uml().db, entries: [], depth: 0, mark: 0, opened: [], closed: [], made: 0 });
        Object.assign(h, { layoutLands: o.layoutLands ?? true, vertexAfterMs: o.vertexAfterMs ?? 20 });
        return structuredClone(h.lookup);
    };
    // Loaded once here, so the dynamic imports of `instantiate` resolve from the cache under the fake clock.
    beforeAll(async () => {
        await Promise.all([import('../../../../joiner'), import('../createAdapter'), import('../../../../redux/reducer/reducer')]);
    });

    it('two calls started back to back are two undo entries in order, each undone by one undo to the exact idlookup (Q1)', async () => {
        const before = setup();
        const [a, b] = await Promise.all([instantiate('Book', bare as any, place), instantiate('Magazine', bare as any, place)]);
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
