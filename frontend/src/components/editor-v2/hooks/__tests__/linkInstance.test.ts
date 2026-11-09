import { beforeAll, describe, expect, it, vi } from 'vitest';
import { classifierConforms } from '../../../../model/ontological/bindingReader';
import { instantiate, instantiateLink, linkOptions, linkPlan, linkRecord, objectRecord, ontoReadView, type SynthesisPlan } from '../instantiate';

type Rec = Record<string, any>;

/** The library of the UML fixture: M2 classes by name, M1 objects by name, every DValue `<object>.<feature>`. */
function uml(linkExtras: Rec = {}) {
    const db: Record<string, Rec> = {};
    const get = (id: string) => db[id];
    const cls = (id: string, ext: string[] = [], abstract = false) =>
        (db[id] = { className: 'DClass', id, name: id, extends: ext, abstract, attributes: [], references: [] });
    const ref = (owner: string, name: string, type: string) => {
        const id = `r_${owner}_${name}`;
        db[id] = { className: 'DReference', id, name, father: owner, type };
        db[owner].references.push(id);
    };
    cls('Classifier', [], true); cls('Class', ['Classifier']); cls('Association', ['Classifier']); cls('Generalization');
    cls('Property'); cls('InstanceSpecification'); cls('Slot'); cls('InstanceValue');
    ref('Classifier', 'generalizations', 'Generalization'); ref('Generalization', 'general', 'Classifier');
    ref('Class', 'ownedAttributes', 'Property'); ref('Association', 'memberEnds', 'Property'); ref('Property', 'type', 'Classifier');
    ref('InstanceSpecification', 'classifier', 'Classifier'); ref('InstanceSpecification', 'slots', 'Slot');
    ref('Slot', 'definingFeature', 'Property'); ref('Slot', 'values', 'InstanceValue'); ref('InstanceValue', 'instance', 'InstanceSpecification');

    const shared = { typeReference: 'r_InstanceSpecification_classifier', slotContainer: 'r_InstanceSpecification_slots',
        definingFeature: 'r_Slot_definingFeature', valueHolder: 'r_Slot_values' };
    const object = { name: 'object', ...shared, featureContainer: 'r_Class_ownedAttributes', featureType: 'r_Property_type',
        generalization: { via: 'r_Classifier_generalizations', general: 'r_Generalization_general' },
        valueKinds: [{ when: 'instance', create: 'InstanceValue', field: 'r_InstanceValue_instance' }] };
    const link = { name: 'link', ...shared, featureContainer: 'r_Association_memberEnds', ...linkExtras };
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
    };
    const general = (specific: string, gen: string) => {
        const id = `gen_${specific}`;
        obj(id, 'Generalization', val(specific, 'r_Classifier_generalizations', [id]));
        val(id, 'r_Generalization_general', [gen]);
    };
    const association = (id: string, ...ends: Array<[string, string]>) => {
        obj(id, 'Association');
        for (const [name, type] of ends) {
            const end = `${id}_${name}`;
            obj(end, 'Property', val(id, 'r_Association_memberEnds', [end]));
            db[end].name = name;
            val(end, 'r_Property_type', [type]);
        }
    };
    const instance = (id: string, classifier: string) => { obj(id, 'InstanceSpecification'); val(id, 'r_InstanceSpecification_classifier', [classifier]); };
    for (const c of ['Publication', 'Book', 'Magazine', 'Library', 'Member']) obj(c, 'Class');
    general('Book', 'Publication'); general('Magazine', 'Publication');
    association('Holdings', ['library', 'Library'], ['holdings', 'Publication']);
    association('Membership', ['libraries', 'Library'], ['members', 'Member']);
    association('Borrowing', ['borrower', 'Member'], ['loans', 'Book']);
    instance('cityLib', 'Library'); instance('dune', 'Book'); instance('history', 'Book'); instance('nature', 'Magazine'); instance('alice', 'Member');
    instance('borrowing1', 'Borrowing');
    return { db, get, association, object, link };
}

const namesOf = (get: (id: string) => Rec, source: string, target: string) => linkOptions(get, source, target).map(o => o.name);

describe('linkOptions: the end-type matrix with the closure (R-OI-5)', () => {
    const { get } = uml();
    it.each([
        ['alice', 'dune', ['Borrowing']],
        ['cityLib', 'dune', ['Holdings']],
        ['cityLib', 'alice', ['Membership']],
    ])('%s → %s offers %j', (s, t, names) => { expect(namesOf(get, s, t)).toEqual(names); });

    it('cityLib → nature: a Magazine fills an end typed Publication, through its generalization', () => {
        expect(namesOf(get, 'cityLib', 'nature')).toEqual(['Holdings']);
    });

    it('alice → nature: a Magazine is no Book, so Borrowing is out', () => {
        expect(namesOf(get, 'alice', 'nature')).toEqual([]);
    });

    it('a pair with no association offers nothing', () => {
        expect(namesOf(get, 'dune', 'nature')).toEqual([]);
        expect(namesOf(get, 'dune', 'history')).toEqual([]);
    });

    it('a generalization upward gives nothing: a Publication end accepts a Book, a Book end no Publication', () => {
        const u = uml();
        u.db.pub = { className: 'DObject', id: 'pub', name: 'pub', instanceof: 'InstanceSpecification', father: 'M1', features: [] };
        u.db.M1.objects.push('pub');
        u.db['pub.r_InstanceSpecification_classifier'] = { className: 'DValue', id: 'pub.r_InstanceSpecification_classifier', father: 'pub', instanceof: 'r_InstanceSpecification_classifier', values: ['Publication'] };
        u.db.pub.features.push('pub.r_InstanceSpecification_classifier');
        expect(namesOf(u.get, 'alice', 'pub')).toEqual([]);
    });

    it('two associations accept the pair: both are offered, sorted, the others left out', () => {
        const u = uml();
        u.association('Reservation', ['reserver', 'Member'], ['reserved', 'Publication']);
        expect(namesOf(u.get, 'alice', 'history')).toEqual(['Borrowing', 'Reservation']);
        expect(namesOf(u.get, 'alice', 'nature')).toEqual(['Reservation']);
    });

    it('a link is no end, a class is no end, an unknown id is no end', () => {
        expect(namesOf(get, 'borrowing1', 'dune')).toEqual([]);
        expect(namesOf(get, 'Book', 'dune')).toEqual([]);
        expect(linkOptions(get, undefined, 'dune')).toEqual([]);
    });

    it('an association without exactly two ends is not offered', () => {
        const u = uml();
        u.association('Triple', ['a', 'Member'], ['b', 'Book'], ['c', 'Book']);
        expect(namesOf(u.get, 'alice', 'dune')).toEqual(['Borrowing']);
    });

    it('classifierConforms follows the generalization and terminates on a cycle', () => {
        const u = uml();
        const view = ontoReadView(u.get);
        expect(classifierConforms(view, u.object as any, 'Book', 'Publication')).toBe(true);
        expect(classifierConforms(view, u.object as any, 'Publication', 'Book')).toBe(false);
        u.db['Publication.r_Classifier_generalizations'] = { className: 'DValue', id: 'Publication.r_Classifier_generalizations', father: 'Publication', instanceof: 'r_Classifier_generalizations', values: ['gen_Publication'] };
        u.db.Publication.features.push('Publication.r_Classifier_generalizations');
        u.db.gen_Publication = { className: 'DObject', id: 'gen_Publication', instanceof: 'Generalization', father: 'Publication.r_Classifier_generalizations', features: ['gen_Publication.g'] };
        u.db['gen_Publication.g'] = { className: 'DValue', id: 'gen_Publication.g', father: 'gen_Publication', instanceof: 'r_Generalization_general', values: ['Book'] };
        expect(classifierConforms(view, u.object as any, 'Book', 'Member')).toBe(false);
    });
});

describe('both ends in memberEnds order', () => {
    const { get } = uml();
    it('a drag from the first end to the second keeps the two in place', () => {
        expect(linkOptions(get, 'alice', 'dune')[0].ends).toEqual(['alice', 'dune']);
    });

    it('a drag the other way writes the same order', () => {
        expect(linkOptions(get, 'dune', 'alice')[0].ends).toEqual(['alice', 'dune']);
    });

    it('when both orders fit, the source takes the first end', () => {
        const u = uml();
        u.association('Friendship', ['from', 'Member'], ['to', 'Member']);
        u.db.bob = { className: 'DObject', id: 'bob', name: 'bob', instanceof: 'InstanceSpecification', father: 'M1', features: ['bob.c'] };
        u.db['bob.c'] = { className: 'DValue', id: 'bob.c', father: 'bob', instanceof: 'r_InstanceSpecification_classifier', values: ['Member'] };
        u.db.M1.objects.push('bob');
        expect(linkOptions(u.get, 'bob', 'alice')[0].ends).toEqual(['bob', 'alice']);
        expect(linkOptions(u.get, 'alice', 'bob')[0].ends).toEqual(['alice', 'bob']);
    });
});

describe('linkPlan', () => {
    const asPlan = (p: SynthesisPlan | { error: string }): SynthesisPlan => {
        if ('error' in p) throw new Error(p.error);
        return p;
    };

    it('classifies the instance by the association, one slot per end in memberEnds order, each naming its instance', () => {
        const { get } = uml();
        const plan = asPlan(linkPlan(get, linkRecord(get, 'M1')!, 'Borrowing', ['alice', 'dune']));
        expect(plan.instanceSeed.classifier).toBe('Borrowing');
        expect(plan.slots.map(s => s.feature)).toEqual(['Borrowing_borrower', 'Borrowing_loans']);
        expect(plan.slots.map(s => s.value)).toEqual([
            { metaclass: 'InstanceValue', seed: { instance: 'alice' } },
            { metaclass: 'InstanceValue', seed: { instance: 'dune' } },
        ]);
    });

    it('uses the link record\'s own value kinds when it has them', () => {
        const { get } = uml({ valueKinds: [{ when: 'instance', create: 'Slot', field: 'r_Slot_definingFeature' }] });
        const plan = asPlan(linkPlan(get, linkRecord(get, 'M1')!, 'Borrowing', ['alice', 'dune']));
        expect(plan.slots[0].value).toEqual({ metaclass: 'Slot', seed: { definingFeature: 'alice' } });
    });

    it('refuses an association without two ends, and a record with no instance value kind anywhere', () => {
        const u = uml();
        u.association('Lonely', ['a', 'Member']);
        expect(linkPlan(u.get, linkRecord(u.get, 'M1')!, 'Lonely', ['alice', 'dune'])).toHaveProperty('error');
        const object = objectRecord(u.get, 'M1') as any;
        const bindings = JSON.parse(u.db.MM._state.ontoBindings);
        bindings.bindings[0] = { ...object, valueKinds: [] };
        u.db.MM._state.ontoBindings = JSON.stringify(bindings);
        expect(linkPlan(u.get, linkRecord(u.get, 'M1')!, 'Borrowing', ['alice', 'dune'])).toHaveProperty('error');
    });
});

const h = vi.hoisted(() => {
    const s: any = { lookup: {}, groups: 0, depth: 0, maxDepth: 0, made: 0, creates: [], layoutCalls: [] };
    s.featuresOf = (meta: string): string[] => {
        const c = s.lookup[meta];
        if (!c) return [];
        return [...(c.attributes ?? []), ...(c.references ?? []), ...(c.extends ?? []).flatMap((e: string) => s.featuresOf(e))];
    };
    // `addObject`: the object and its empty DValues now, listed in its owner 10 ms later, its seed 20 ms later.
    s.create = (modelId: string, className: string, ownerId: string | null, key: string | null, seed: Record<string, unknown>) => {
        const id = `${className}_${++s.made}`;
        s.creates.push({ id, className, ownerId, key, seed });
        const features = s.featuresOf(className).map((f: string) => {
            const vid = `${id}.${f}`;
            s.lookup[vid] = { className: 'DValue', id: vid, father: id, instanceof: f, values: [] };
            return vid;
        });
        s.lookup[id] = { id, className: 'DObject', instanceof: className, father: ownerId ?? modelId, features };
        if (ownerId && key) setTimeout(() => {
            const vid = s.lookup[ownerId].features.find((f: string) => s.lookup[s.lookup[f].instanceof]?.name === key);
            if (vid) s.lookup[vid] = { ...s.lookup[vid], values: [...s.lookup[vid].values, id] };
        }, 10);
        setTimeout(() => {
            for (const [k, v] of Object.entries(seed ?? {})) {
                const vid = features.find((f: string) => s.lookup[s.lookup[f].instanceof]?.name === k);
                if (vid) s.lookup[vid] = { ...s.lookup[vid], values: [v] };
            }
        }, 20);
        return { ok: true, id };
    };
    return s;
});

vi.mock('../../../../joiner', () => ({
    store: { getState: () => ({ idlookup: h.lookup, viewpoint: undefined }) },
    TRANSACTION: (_name: string, f: () => void) => f(),
    SetFieldAction: { new: (id: string, key: string, value: unknown) => { h.lookup[id] = { ...h.lookup[id], [key]: value }; } },
}));
vi.mock('../createAdapter', () => ({ createInstance: (...a: any[]) => (h.create as any)(...a) }));
vi.mock('../../viewpoint/ir/irResolveCore', () => ({
    computeIRSignature: () => null, getIRIndex: () => null, resolveIRView: () => null,
}));
vi.mock('../../viewpoint/ir/irReadCtxLproxy', () => ({ makeReadCtx: () => ({}) }));
vi.mock('../../viewpoint/layout/vertexLayoutAdapter', () => ({
    getLayoutKeyOf: () => '__abstract__', getLayoutKeyFor: () => '__abstract__',
}));
vi.mock('../../viewpoint/layout/vertexLayout', () => ({
    resolveVertexLayoutWrite: (_v: unknown, patch: unknown, layoutKey: string) => {
        h.layoutCalls.push({ layoutKey, patch });
        return { target: 'scalars', patch };
    },
}));
vi.mock('../../../../redux/reducer/reducer', () => ({
    beginUndoGroup: () => { h.depth++; h.maxDepth = Math.max(h.maxDepth, h.depth); h.groups++; },
    endUndoGroup: () => { h.depth--; },
}));

describe('instantiateLink: one undo group, in the queue of instantiate', () => {
    const setup = () => {
        const u = uml();
        Object.assign(h, { lookup: u.db, groups: 0, depth: 0, maxDepth: 0, made: 0, creates: [], layoutCalls: [] });
        return linkRecord(u.get, 'M1')!;
    };
    beforeAll(async () => {
        await Promise.all([import('../../../../joiner'), import('../createAdapter'), import('../../../../redux/reducer/reducer')]);
    });

    it('creates the link, both slots in order and their values, in one group closed at the end', async () => {
        const record = setup();
        const result = await instantiateLink('Borrowing', record, ['alice', 'dune']);
        expect(result.problems).toEqual([]);
        expect(result.ok).toBe(true);
        expect(h.groups).toBe(1);
        expect(h.depth).toBe(0);
        expect(h.creates.map((c: Rec) => c.className)).toEqual(['InstanceSpecification', 'Slot', 'InstanceValue', 'Slot', 'InstanceValue']);
        expect(h.creates[0].seed.classifier).toBe('Borrowing');
        expect(h.creates[1].seed).toEqual({ definingFeature: 'Borrowing_borrower' });
        expect(h.creates[2].seed).toEqual({ instance: 'alice' });
        expect(h.creates[3].seed).toEqual({ definingFeature: 'Borrowing_loans' });
        expect(h.creates[4].seed).toEqual({ instance: 'dune' });
    });

    it('writes no node layout: a link draws as an edge', async () => {
        const record = setup();
        await instantiateLink('Borrowing', record, ['alice', 'dune']);
        expect(h.layoutCalls).toHaveLength(0);
    });

    it('asked while an instantiation holds its group, it runs after it: two groups, never nested', async () => {
        const record = setup();
        const first = instantiate('Book', objectRecord((id: string) => h.lookup[id], 'M1')!, () => null);
        for (let i = 0; i < 200 && h.depth === 0; i++) await new Promise(resolve => setTimeout(resolve, 5));
        expect(h.depth).toBe(1);
        await Promise.all([first, instantiateLink('Borrowing', record, ['alice', 'dune'])]);
        expect(h.groups).toBe(2);
        expect(h.maxDepth).toBe(1);
    });

    it('opens no group and writes nothing when the plan fails', async () => {
        const record = setup();
        const result = await instantiateLink('Nothing', record, ['alice', 'dune']);
        expect(result.ok).toBe(false);
        expect(result.problems.length).toBe(1);
        expect(h.groups).toBe(0);
        expect(h.creates).toEqual([]);
    });
});
