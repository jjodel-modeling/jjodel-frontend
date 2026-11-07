import { describe, expect, it } from 'vitest';
import { detectInstantiationProblems, type InstantiationFinding } from '../instantiationToProblems';

// The UML subset of `hooks/__tests__/instantiate.test.ts` (metamodel of the notation file §2, library of §6 in one M1
// model), copied: a test file is not imported by another. Plus the object diagram: dune, mag1, alice, cityLib.

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
    cls('LiteralNull', ['ValueSpecification']);
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

    // The object diagram. A slot is `<instance>_<feature name>`, its value `<slot>_v<n>`.
    let n = 0;
    const value = (slot: string, meta: string, v?: unknown) => {
        const vid = `${slot}_v${n++}`;
        obj(vid, meta, val(slot, 'r_Slot_values', [vid]));
        if (v !== undefined) val(vid, meta === 'InstanceValue' ? 'r_InstanceValue_instance' : `a_${meta}_value`, [v]);
        return vid;
    };
    const slot = (inst: string, feature: string, meta?: string, v?: unknown, id = `${inst}_${db[feature]?.name ?? feature}`) => {
        obj(id, 'Slot', val(inst, 'r_InstanceSpecification_slots', [id]));
        val(id, 'r_Slot_definingFeature', [feature]);
        val(id, 'r_Slot_values', []);
        if (meta) value(id, meta, v);
        return id;
    };
    const instance = (id: string, cl: string, slots: Array<[string, string?, unknown?]>) => {
        obj(id, 'InstanceSpecification');
        val(id, 'r_InstanceSpecification_classifier', [cl]);
        val(id, 'r_InstanceSpecification_slots', []);
        for (const [feature, meta, v] of slots) slot(id, feature, meta, v);
    };
    instance('dune', 'Book', [['p_Publication_title', 'LiteralString', 'Dune'], ['p_Publication_year', 'LiteralInteger', 1965],
        ['p_Book_isbn', 'LiteralString', '978-0441013593'], ['p_Book_genre', 'InstanceValue', 'fiction']]);
    instance('mag1', 'Magazine', [['p_Publication_title', 'LiteralString', 'Wired'], ['p_Publication_year'], ['p_Magazine_issue', 'LiteralInteger', 3]]);
    instance('alice', 'Member', [['p_Member_name', 'LiteralString', 'Alice'], ['p_Member_active', 'LiteralBoolean', true]]);
    instance('cityLib', 'Library', [['p_Library_name', 'LiteralString', 'City']]);
    return { db, get, obj, val, prop, general, slot, value, instance };
}

const brief = (fs: InstantiationFinding[]) => fs.map(f => `${f.kind}:${f.instance ?? '-'}:${f.key}`);

describe('detectInstantiationProblems', () => {
    it('1. a clean library has no finding', () => {
        const { get } = uml();
        expect(detectInstantiationProblems(get, 'M1')).toEqual([]);
    });

    it('a metamodel without bindings judges nothing', () => {
        const { db, get, slot } = uml();
        slot('dune', 'p_Publication_title');
        db.MM._state = {};
        expect(detectInstantiationProblems(get, 'M1')).toEqual([]);
    });

    it('2. isbn deleted: dune holds one orphan with no feature and misses nothing, cleared or dangling alike', () => {
        const { db, get } = uml();
        delete db.p_Book_isbn;
        db['Book.r_Class_ownedAttributes'].values = ['p_Book_genre'];
        // Measured in the app (P-2026-10-21-1600, R1): the delete clears the slot's definingFeature to [].
        db['dune_isbn.r_Slot_definingFeature'].values = [];
        const cleared = detectInstantiationProblems(get, 'M1');
        expect(brief(cleared)).toEqual(['orphan:dune:dune_isbn']);
        expect(cleared[0]).toMatchObject({ severity: 'error', title: 'Orphan slot', description: 'Its feature is gone', anchors: ['dune', 'dune_isbn'] });
        // A pointer left dangling reads the same.
        db['dune_isbn.r_Slot_definingFeature'].values = ['p_Book_isbn'];
        expect(brief(detectInstantiationProblems(get, 'M1'))).toEqual(['orphan:dune:dune_isbn']);
    });

    it('a slot of a feature that is not in the closure is an orphan that names it', () => {
        const { get, slot } = uml();
        slot('dune', 'p_Member_name');
        const fs = detectInstantiationProblems(get, 'M1');
        expect(brief(fs)).toEqual(['orphan:dune:dune_name']);
        expect(fs[0].description).toBe('name is not a feature of Book');
    });

    it('3. pages added to Book: dune misses pages, a warning naming it; mag1 is not touched', () => {
        const { get, prop } = uml();
        prop('Book', 'pages', 'Integer');
        const fs = detectInstantiationProblems(get, 'M1');
        expect(brief(fs)).toEqual(['missing:dune:dune']);
        expect(fs[0]).toMatchObject({ severity: 'warning', title: 'Missing slots', description: 'No slot for pages', related: ['p_Book_pages'] });
    });

    it('4. a second title slot on dune: one duplicate, not an orphan, not two', () => {
        const { get, slot } = uml();
        slot('dune', 'p_Publication_title', 'LiteralString', 'Dune II', 'dune_title2');
        const fs = detectInstantiationProblems(get, 'M1');
        expect(brief(fs)).toEqual(['duplicate:dune:dune:p_Publication_title']);
        expect(fs[0]).toMatchObject({ severity: 'error', description: 'Two slots for title', related: ['dune_title', 'dune_title2'] });
    });

    it('5. year holding a LiteralString is one wrong value type; a LiteralNull is not judged', () => {
        const { get, value } = uml();
        const wrong = value('dune_year', 'LiteralString', '1965');
        const fs = detectInstantiationProblems(get, 'M1');
        expect(brief(fs)).toEqual([`value-type:dune:${wrong}`]);
        expect(fs[0]).toMatchObject({ severity: 'error', description: 'year : Integer holds a LiteralString', related: ['dune_year', wrong] });
        const { get: get2, value: value2 } = uml();
        value2('dune_year', 'LiteralNull');
        expect(detectInstantiationProblems(get2, 'M1')).toEqual([]);
    });

    it('6. genre holding fiction fits, holding alice does not; a class-typed feature takes a descendant', () => {
        const { get, value, prop, slot } = uml();
        const bad = value('dune_genre', 'InstanceValue', 'alice');
        prop('Library', 'featured', 'Publication');
        const featured = slot('cityLib', 'p_Library_featured', 'InstanceValue', 'dune');
        const wrongKind = value(featured, 'InstanceValue', 'alice');
        expect(brief(detectInstantiationProblems(get, 'M1'))).toEqual([`value-type:dune:${bad}`, `value-type:cityLib:${wrongKind}`]);
    });

    it('7. a link instance and an enumeration literal are never judged', () => {
        const { get, instance, slot } = uml();
        instance('holdings1', 'Holdings', [['p_Member_name', 'LiteralBoolean', true]]);
        slot('fiction', 'p_Member_name', 'LiteralInteger', 1);
        expect(detectInstantiationProblems(get, 'M1')).toEqual([]);
    });

    it('8. a cycle Publication ⇄ Book is reported once, on both classifiers, and the closure stops at it', () => {
        const { get, general } = uml();
        general('Publication', 'Book');
        const fs = detectInstantiationProblems(get, 'M1');
        const cycles = fs.filter(f => f.kind === 'cycle');
        expect(brief(cycles)).toEqual(['cycle:-:Book,Publication']);
        expect(cycles[0]).toMatchObject({ severity: 'error', title: 'Generalization cycle', anchors: ['Book', 'Publication'] });
        // dune keeps its four features; mag1 now inherits Book's through Publication, so it misses isbn and genre.
        expect(brief(fs.filter(f => f.kind !== 'cycle'))).toEqual(['missing:mag1:mag1']);
        expect(fs.find(f => f.kind === 'missing')?.related).toEqual(['p_Book_isbn', 'p_Book_genre']);
    });
});
