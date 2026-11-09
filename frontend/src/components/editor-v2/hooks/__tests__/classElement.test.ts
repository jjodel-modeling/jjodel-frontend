import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    classDragPayload, classDropRequest, classElementPlan, classRail, createClassElement, generalizationSlot, propertyPlan, selectionTakesProperty,
    type ClassElementPlan,
} from '../instantiate';

// The class level of the rail over D records: a UML subset with its compositions, one Package and one Class in it.

type Rec = Record<string, any>;

function uml(): Record<string, Rec> {
    const d: Record<string, Rec> = {};
    const cls = (id: string, ext: string[] = [], abstract = false) =>
        (d[id] = { className: 'DClass', id, name: id, extends: ext, abstract, attributes: [], references: [] });
    const ref = (owner: string, name: string, type: string, composition = false) => {
        const id = `r_${owner}_${name}`;
        d[id] = { className: 'DReference', id, name, father: owner, type, composition };
        d[owner].references.push(id);
    };
    cls('Element', [], true); cls('NamedElement', ['Element'], true);
    d.a_name = { className: 'DAttribute', id: 'a_name', name: 'name', father: 'NamedElement' };
    d.NamedElement.attributes.push('a_name');
    cls('PackageableElement', ['NamedElement'], true); cls('Package', ['PackageableElement']);
    cls('Classifier', ['PackageableElement'], true); cls('Class', ['Classifier']); cls('Association', ['Classifier']);
    cls('Property', ['NamedElement']); cls('Generalization', ['Element']); cls('InstanceSpecification', ['PackageableElement']);
    ref('Package', 'packagedElements', 'PackageableElement', true);
    ref('Class', 'ownedAttributes', 'Property', true);
    ref('Classifier', 'generalizations', 'Generalization', true);
    ref('Association', 'memberEnds', 'Property');
    ref('InstanceSpecification', 'classifier', 'Classifier');
    const object = { name: 'object', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Class_ownedAttributes',
        generalization: { via: 'r_Classifier_generalizations', general: 'x' } };
    const link = { name: 'link', typeReference: 'r_InstanceSpecification_classifier', featureContainer: 'r_Association_memberEnds' };
    d.MM = { className: 'DModel', id: 'MM', isMetamodel: true, classes: Object.keys(d).filter(k => d[k].className === 'DClass'),
        _state: { ontoBindings: JSON.stringify({ v: 1, bindings: [object, link] }) } };
    d.M1 = { className: 'DModel', id: 'M1', isMetamodel: false, instanceof: 'MM', objects: ['lib'] };
    d.lib = { className: 'DObject', id: 'lib', name: 'lib', instanceof: 'Package', father: 'M1', features: ['lib.packaged'] };
    d['lib.packaged'] = { className: 'DValue', id: 'lib.packaged', father: 'lib', instanceof: 'r_Package_packagedElements', values: ['Book'] };
    d.Book = { className: 'DObject', id: 'Book', name: 'Book', instanceof: 'Class', father: 'lib.packaged', features: [] };
    return d;
}

describe('the class rail over the store (R-OI-21)', () => {
    it('reads the groups of the `object` record', () => {
        const rail = classRail(uml(), 'M1')!;
        expect(rail.groups.map(g => g.kind)).toEqual(['classifier', 'association', 'property', 'generalization']);
        expect(rail.groups[0].items.map(i => i.name)).toEqual(['Class']);
    });

    it('is null with no binding', () => {
        const d = uml();
        d.MM._state = {};
        expect(classRail(d, 'M1')).toBeNull();
    });

    it('changes its signature when an item is renamed', () => {
        const d = uml();
        const before = classRail(d, 'M1')!.signature;
        d.Class.name = 'Klass';
        expect(classRail(d, 'M1')!.signature).not.toBe(before);
    });
});

describe('the class-level payload', () => {
    it('resolves a classifier, and nothing the rail does not offer as one', () => {
        const d = uml();
        expect(classDropRequest(d, 'M1', classDragPayload('Class'))).toBe('Class');
        expect(classDropRequest(d, 'M1', classDragPayload('Association'))).toBeNull();
        expect(classDropRequest(d, 'M1', classDragPayload('Property'))).toBeNull();
        expect(classDropRequest(d, 'M1', 'not json')).toBeNull();
        expect(classDropRequest(d, 'M1', JSON.stringify({ record: 'object', classifier: 'Book' }))).toBeNull();
    });
});

describe('the plan of a class-level element (R-OI-22)', () => {
    it('goes in the composition reference, under the sole Package, named after its metaclass', () => {
        expect(classElementPlan(uml(), 'M1', 'Class')).toEqual({
            modelId: 'M1', metaclass: 'Class', ownerId: 'lib', childKey: 'packagedElements', seed: { name: 'Class1' },
        });
    });

    it('takes the first integer no object has', () => {
        const d = uml();
        d.Book.name = 'Class1';
        expect(classElementPlan(d, 'M1', 'Class')).toMatchObject({ seed: { name: 'Class2' } });
    });

    it('goes to the root when the model has two Packages', () => {
        const d = uml();
        d.other = { className: 'DObject', id: 'other', name: 'other', instanceof: 'Package', father: 'M1', features: [] };
        d.M1.objects.push('other');
        expect(classElementPlan(d, 'M1', 'Class')).toMatchObject({ ownerId: null, childKey: null });
    });

    it('reports a metaclass that does not resolve', () => {
        expect(classElementPlan(uml(), 'M1', 'Nope')).toEqual({ error: 'the metaclass does not resolve' });
    });
});

describe('an attribute of the selected class', () => {
    it('is accepted on a class of the model, and on nothing else', () => {
        const d = uml();
        expect(selectionTakesProperty(d, 'M1', 'Book')).toBe(true);
        expect(selectionTakesProperty(d, 'M1', 'lib')).toBe(false);
        expect(selectionTakesProperty(d, 'M1', undefined)).toBe(false);
        expect(selectionTakesProperty(d, 'M1', 'Class')).toBe(false);
    });

    it('rejects a class of another model', () => {
        const d = uml();
        d.M2 = { className: 'DModel', id: 'M2', instanceof: 'MM', objects: ['Alien'] };
        d.Alien = { className: 'DObject', id: 'Alien', name: 'Alien', instanceof: 'Class', father: 'M2', features: [] };
        expect(selectionTakesProperty(d, 'M1', 'Alien')).toBe(false);
    });

    it('goes in the record\'s featureContainer, under the selection', () => {
        expect(propertyPlan(uml(), 'M1', 'Property', 'Book')).toEqual({
            modelId: 'M1', metaclass: 'Property', ownerId: 'Book', childKey: 'ownedAttributes', seed: { name: 'property1' },
        });
    });

    it('is refused without a class selected', () => {
        expect(propertyPlan(uml(), 'M1', 'Property', 'lib')).toEqual({ error: 'the selection takes no attribute' });
    });
});

describe('the defaults of a new attribute', () => {
    /** The UML subset with multiplicity, visibility, the type role and a String PrimitiveType in the Package. */
    const typed = () => {
        const d = uml();
        const attr = (name: string, type?: string) => {
            d[`a_${name}`] = { className: 'DAttribute', id: `a_${name}`, name, father: 'Property', type };
            d.Property.attributes.push(`a_${name}`);
        };
        d.public = { id: 'public', name: 'public' };
        d.private = { id: 'private', name: 'private' };
        d.VisibilityKind = { id: 'VisibilityKind', name: 'VisibilityKind', literals: ['private', 'public'] };
        attr('lower'); attr('upper'); attr('visibility', 'VisibilityKind');
        d.r_Property_type = { className: 'DReference', id: 'r_Property_type', name: 'type', father: 'Property', type: 'Classifier' };
        d.Property.references.push('r_Property_type');
        d.PrimitiveType = { className: 'DClass', id: 'PrimitiveType', name: 'PrimitiveType', extends: ['Classifier'], abstract: false, attributes: [], references: [] };
        d.String = { className: 'DObject', id: 'String', name: 'String', instanceof: 'PrimitiveType', father: 'lib.packaged', features: [] };
        d['lib.packaged'].values.push('String');
        const bindings = JSON.parse(d.MM._state.ontoBindings);
        bindings.bindings[0].featureType = 'r_Property_type';
        d.MM._state.ontoBindings = JSON.stringify(bindings);
        return d;
    };
    const seedOf = (d: Record<string, Rec>) => (propertyPlan(d, 'M1', 'Property', 'Book') as { seed: Record<string, unknown> }).seed;

    it('is 1..1, public and typed by the String PrimitiveType', () => {
        expect(seedOf(typed())).toEqual({ name: 'property1', lower: 1, upper: 1, visibility: 'public', type: 'String' });
    });

    it('is untyped when the model has no String PrimitiveType', () => {
        const d = typed();
        d.String.instanceof = 'Class';
        expect(seedOf(d)).not.toHaveProperty('type');
    });

    it('is untyped when the binding declares no featureType', () => {
        const d = typed();
        const bindings = JSON.parse(d.MM._state.ontoBindings);
        delete bindings.bindings[0].featureType;
        d.MM._state.ontoBindings = JSON.stringify(bindings);
        expect(seedOf(d)).not.toHaveProperty('type');
    });
});

describe('the slot of a generalization drawn at the class level (R-OI-22)', () => {
    const atLevel = (level: string | undefined) => {
        const d = uml();
        d.VP = { id: 'VP', _state: level ? { ontoLevel: level } : {} };
        return d;
    };

    it('is generalization.via of its source, at `class`', () => {
        expect(generalizationSlot(atLevel('class'), 'VP', 'Generalization', 'Book')).toEqual({ ownerId: 'Book', feature: 'generalizations' });
    });

    it('is left to the shared edge path at any other level', () => {
        expect(generalizationSlot(atLevel('instance'), 'VP', 'Generalization', 'Book')).toBeNull();
        expect(generalizationSlot(atLevel(undefined), 'VP', 'Generalization', 'Book')).toBeNull();
    });

    it('is left to the shared edge path with no declared binding', () => {
        const d = atLevel('class');
        d.MM._state = {};
        expect(generalizationSlot(d, 'VP', 'Generalization', 'Book')).toBeNull();
    });

    it('takes no edge object of another metaclass, and no source that holds none', () => {
        expect(generalizationSlot(atLevel('class'), 'VP', 'Association', 'Book')).toBeNull();
        expect(generalizationSlot(atLevel('class'), 'VP', 'Generalization', 'lib')).toBeNull();
    });
});

const h = vi.hoisted(() => {
    const s: any = { lookup: {}, groups: 0, maxDepth: 0, depth: 0, made: 0, layoutCalls: [], failCreate: false, args: [] };
    s.create = (modelId: string, className: string, ownerId: string | null, key: string | null, seed: Record<string, unknown>) => {
        s.args.push([modelId, className, ownerId, key]);
        if (s.failCreate) return { ok: false, id: null, reason: 'refused' };
        const id = `${className}_${++s.made}`;
        s.lookup[id] = { id, className: 'DObject', name: id, instanceof: className, father: ownerId ?? modelId, features: [] };
        s.lookup[`V_${id}`] = { id: `V_${id}`, className: 'DVertex', model: id, x: 0, y: 0 };
        setTimeout(() => {
            for (const [k, value] of Object.entries(seed ?? {})) {
                s.lookup[`f_${k}`] = { id: `f_${k}`, name: k };
                const vid = `${id}.${k}`;
                s.lookup[vid] = { id: vid, className: 'DValue', instanceof: `f_${k}`, values: [value] };
                s.lookup[id].features.push(vid);
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

describe('createClassElement: one undo group, in the queue of instantiate', () => {
    const plan: ClassElementPlan = { modelId: 'M1', metaclass: 'Class', ownerId: 'lib', childKey: 'packagedElements', seed: { name: 'Class1' } };
    const setup = () => Object.assign(h, { lookup: uml(), groups: 0, maxDepth: 0, depth: 0, made: 0, layoutCalls: [], failCreate: false, args: [] });
    beforeAll(async () => {
        await Promise.all([import('../../../../joiner'), import('../createAdapter'), import('../../../../redux/reducer/reducer')]);
    });

    it('creates under the planned owner, in one group, closed at the end', async () => {
        setup();
        const result = await createClassElement(plan);
        expect(result.ok).toBe(true);
        expect(h.args).toEqual([['M1', 'Class', 'lib', 'packagedElements']]);
        expect(h.groups).toBe(1);
        expect(h.depth).toBe(0);
    });

    it('writes the position of the drop and no size: the box hugs its rows', async () => {
        setup();
        await createClassElement(plan, () => ({ x: 11, y: 22 }));
        expect(h.layoutCalls).toHaveLength(1);
        expect(h.layoutCalls[0].patch).toEqual({ x: 11, y: 22 });
    });

    it('writes no layout without a placement (an attribute draws inside its class)', async () => {
        setup();
        const result = await createClassElement(plan);
        expect(result.ok).toBe(true);
        expect(h.layoutCalls).toHaveLength(0);
    });

    it('two quick gestures make two groups, never nested', async () => {
        setup();
        const first = createClassElement(plan);
        await new Promise(r => setTimeout(r, 5));
        const second = createClassElement(plan);
        await Promise.all([first, second]);
        expect(h.groups).toBe(2);
        expect(h.maxDepth).toBe(1);
    });

    it('closes the group when the create is refused, and reports it', async () => {
        setup();
        h.failCreate = true;
        const result = await createClassElement(plan);
        expect(result.ok).toBe(false);
        expect(result.problems).toEqual(['element: refused']);
        expect(h.depth).toBe(0);
    });
});
