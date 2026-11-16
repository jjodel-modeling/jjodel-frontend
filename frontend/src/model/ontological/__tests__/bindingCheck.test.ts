import { describe, expect, it } from 'vitest';
import type { MetamodelSketch } from '../../simulation/profileBinder';
import type { OntoBinding } from '../bindingCodec';
import { checkBinding, checkBindings, checkLevels } from '../bindingCheck';
import type { OntoReadView } from '../bindingReader';

// The UML subset of the class/object notation design (§2), as a sketch of its metamodel.

const cls = (id: string, abstract = false) => ({ id, name: id, abstract, supers: [] as string[] });
const ref = (id: string, owner: string, type: string) => ({ id, name: id, owner, type, composition: false, aggregation: false });
const attr = (id: string, owner: string, type = 'Pointer_ESTRING') => ({ id, name: id, owner, type });

const SKETCH: MetamodelSketch = {
    classes: [
        cls('InstanceSpecification'), cls('Slot'), cls('Class'), cls('Association'), cls('Enumeration'), cls('Property'),
        cls('Generalization'), cls('LiteralString'), cls('LiteralBoolean'), cls('InstanceValue'), cls('Activity'),
    ],
    references: [
        ref('IS.classifier', 'InstanceSpecification', 'Class'),
        ref('IS.slots', 'InstanceSpecification', 'Slot'),
        ref('Slot.definingFeature', 'Slot', 'Property'),
        ref('Slot.values', 'Slot', 'LiteralString'),
        ref('Class.ownedAttributes', 'Class', 'Property'),
        ref('Class.generalizations', 'Class', 'Generalization'),
        ref('Generalization.general', 'Generalization', 'Class'),
        ref('Association.memberEnds', 'Association', 'Property'),
        ref('Property.type', 'Property', 'Class'),
        ref('InstanceValue.instance', 'InstanceValue', 'InstanceSpecification'),
        ref('Activity.activityTypedBy', 'Activity', 'Class'),
        ref('Other.slots', 'Class', 'Slot'),
    ],
    attributes: [
        attr('Class.isAbstract', 'Class', 'Pointer_EBOOLEAN'),
        attr('Property.defaultValue', 'Property'),
        attr('LiteralString.value', 'LiteralString'),
        attr('LiteralBoolean.value', 'LiteralBoolean', 'Pointer_EBOOLEAN'),
    ],
};

const OBJECT: OntoBinding = {
    name: 'object',
    typeReference: 'IS.classifier',
    featureContainer: 'Class.ownedAttributes',
    generalization: { via: 'Class.generalizations', general: 'Generalization.general' },
    slotContainer: 'IS.slots',
    definingFeature: 'Slot.definingFeature',
    valueHolder: 'Slot.values',
    abstractFlag: 'Class.isAbstract',
    featureType: 'Property.type',
    defaultValue: 'Property.defaultValue',
    valueKinds: [
        { when: 'primitive:String', create: 'LiteralString', field: 'LiteralString.value' },
        { when: 'instance', create: 'InstanceValue', field: 'InstanceValue.instance' },
    ],
};

const roles = (defects: { role: string }[]) => defects.map(d => d.role);

describe('bindingCheck', () => {
    it('the full UML object record is valid', () => {
        expect(checkBinding(OBJECT, SKETCH)).toEqual([]);
        expect(checkBindings([OBJECT], SKETCH)).toEqual({ ok: true, defects: [] });
    });

    it('the link record (second application of the relation) is valid beside it', () => {
        const link: OntoBinding = { name: 'link', typeReference: 'IS.classifier', featureContainer: 'Association.memberEnds' };
        expect(checkBindings([OBJECT, link], SKETCH).ok).toBe(true);
    });

    it('a record with the type reference alone is valid (FTG+PM)', () => {
        const activity: OntoBinding = { name: 'activity', typeReference: 'Activity.activityTypedBy' };
        expect(checkBinding(activity, SKETCH)).toEqual([]);
    });

    it('a direct generalization reference is judged as a reference', () => {
        const ok = { ...OBJECT, generalization: { direct: 'Generalization.general' } };
        expect(checkBinding(ok, SKETCH)).toEqual([]);
        const bad = { ...OBJECT, generalization: { direct: 'Class.isAbstract' } };
        expect(roles(checkBinding(bad, SKETCH))).toEqual(['generalization']);
    });

    it('an id outside the metamodel is a defect of its role', () => {
        const d = checkBinding({ ...OBJECT, featureContainer: 'Class.nope' }, SKETCH);
        expect(roles(d)).toEqual(['featureContainer']);
        expect(d[0].message).toContain('not in the metamodel');
    });

    it('an id of the wrong sort is a defect: attribute for a reference, class for a reference, reference for an attribute', () => {
        expect(roles(checkBinding({ ...OBJECT, typeReference: 'Class.isAbstract' }, SKETCH))).toContain('typeReference');
        expect(roles(checkBinding({ ...OBJECT, featureContainer: 'Class' }, SKETCH))).toEqual(['featureContainer']);
        expect(roles(checkBinding({ ...OBJECT, abstractFlag: 'IS.slots' }, SKETCH))).toEqual(['abstractFlag']);
        expect(roles(checkBinding({ ...OBJECT, defaultValue: 'Property.type' }, SKETCH))).toEqual(['defaultValue']);
        expect(roles(checkBinding({ ...OBJECT, featureType: 'Class.isAbstract' }, SKETCH))).toEqual(['featureType']);
    });

    it('the value holder may be a reference or an attribute', () => {
        expect(checkBinding({ ...OBJECT, valueHolder: 'LiteralString.value' }, SKETCH)).toEqual([]);
        expect(roles(checkBinding({ ...OBJECT, valueHolder: 'Slot' }, SKETCH))).toEqual(['valueHolder']);
    });

    it('a value kind needs a class to create and a feature to hold the value', () => {
        const bad = { ...OBJECT, valueKinds: [{ when: 'primitive:String', create: 'LiteralString.value', field: 'LiteralString' }] };
        expect(roles(checkBinding(bad, SKETCH))).toEqual(['valueKinds', 'valueKinds']);
    });

    it('the type reference and the slot container must share the instance metaclass', () => {
        const d = checkBinding({ ...OBJECT, slotContainer: 'Other.slots' }, SKETCH);
        expect(roles(d)).toEqual(['slotContainer']);
        expect(d[0].message).toContain('InstanceSpecification');
    });

    it('the defining feature must be owned by the slot metaclass', () => {
        const d = checkBinding({ ...OBJECT, definingFeature: 'Class.generalizations' }, SKETCH);
        expect(roles(d)).toEqual(['definingFeature']);
    });

    it('three of the four slot roles are refused, whichever one is missing', () => {
        const { slotContainer: _s, ...noContainer } = OBJECT;
        const { definingFeature: _d, ...noDefining } = OBJECT;
        const { valueHolder: _h, ...noHolder } = OBJECT;
        const { valueKinds: _k, ...noKinds } = OBJECT;
        for (const [b, missing] of [[noContainer, 'slotContainer'], [noDefining, 'definingFeature'], [noHolder, 'valueHolder'], [noKinds, 'valueKinds']] as const) {
            const d = checkBinding(b as OntoBinding, SKETCH);
            expect(roles(d)).toEqual(['slotRoles']);
            expect(d[0].message).toContain(missing);
        }
    });

    it('one slot role alone is refused too; none of them is fine', () => {
        const alone: OntoBinding = { name: 'x', typeReference: 'IS.classifier', valueHolder: 'Slot.values' };
        expect(roles(checkBinding(alone, SKETCH))).toEqual(['slotRoles']);
        const { slotContainer, definingFeature, valueHolder, valueKinds, ...none } = OBJECT;
        void slotContainer; void definingFeature; void valueHolder; void valueKinds;
        expect(checkBinding(none as OntoBinding, SKETCH)).toEqual([]);
    });

    it('two records with the same name are refused', () => {
        const v = checkBindings([OBJECT, { ...OBJECT }], SKETCH);
        expect(v.ok).toBe(false);
        expect(v.defects).toEqual([{ binding: 'object', role: 'name', message: expect.stringContaining('object') }]);
    });

    it('defects of several records are all listed and none throws', () => {
        const v = checkBindings([{ ...OBJECT, typeReference: 'nope' }, { name: 'b', typeReference: 'also-nope' }], SKETCH);
        expect(v.defects.map(d => d.binding)).toEqual(['object', 'b']);
    });
});

// DCN (R-DCN-10): viewpoints of a class, dynamic classes of a viewpoint, attributes of a dynamic class.
const sub = (id: string, ...supers: string[]) => ({ ...cls(id), supers });
const DCN_SKETCH: MetamodelSketch = {
    classes: [...SKETCH.classes, cls('Viewpoint'), cls('DynamicClass'), sub('TimedClass', 'DynamicClass'), sub('DynProperty', 'Property'), cls('Event')],
    references: [
        ...SKETCH.references,
        ref('Class.viewpoints', 'Class', 'Viewpoint'),
        ref('Viewpoint.classes', 'Viewpoint', 'DynamicClass'),
        ref('Viewpoint.timed', 'Viewpoint', 'TimedClass'),
        ref('DynamicClass.attributes', 'DynamicClass', 'Property'),
        ref('DynamicClass.dynProps', 'DynamicClass', 'DynProperty'),
        ref('DynamicClass.events', 'DynamicClass', 'Event'),
    ],
    attributes: [...SKETCH.attributes, attr('Viewpoint.name', 'Viewpoint')],
};
const PATH = ['Class.viewpoints', 'Viewpoint.classes', 'DynamicClass.attributes'];
const withPath = (...paths: string[][]): OntoBinding => ({ ...OBJECT, featureSources: paths.map(path => ({ path })) });

describe('bindingCheck of feature sources (DCN)', () => {
    it('a path of references, each owned by the type of the one before, ending on a Property, is valid', () => {
        expect(checkBinding(withPath(PATH), DCN_SKETCH)).toEqual([]);
        expect(checkBinding(withPath(['Class.ownedAttributes']), DCN_SKETCH)).toEqual([]);
    });

    it('an inherited hop and a last hop typed by a subclass of the defining feature type are valid', () => {
        expect(checkBinding(withPath(['Class.viewpoints', 'Viewpoint.timed', 'DynamicClass.attributes']), DCN_SKETCH)).toEqual([]);
        expect(checkBinding(withPath(['Class.viewpoints', 'Viewpoint.classes', 'DynamicClass.dynProps']), DCN_SKETCH)).toEqual([]);
    });

    it('a hop outside the metamodel is a defect', () => {
        const d = checkBinding(withPath(['Class.viewpoints', 'Viewpoint.nope', 'DynamicClass.attributes']), DCN_SKETCH);
        expect(roles(d)).toEqual(['featureSources']);
        expect(d[0].message).toContain('not in the metamodel');
    });

    it('a hop that is an attribute or a class is a defect', () => {
        expect(roles(checkBinding(withPath(['Class.viewpoints', 'Viewpoint.name']), DCN_SKETCH))).toEqual(['featureSources']);
        expect(checkBinding(withPath(['Class.viewpoints', 'Viewpoint.name']), DCN_SKETCH)[0].message).toContain('is a attribute');
        expect(roles(checkBinding(withPath(['Viewpoint', 'DynamicClass.attributes']), DCN_SKETCH))).toEqual(['featureSources']);
    });

    it('a hop not owned by the type of the hop before is a defect', () => {
        const d = checkBinding(withPath(['Class.viewpoints', 'DynamicClass.attributes']), DCN_SKETCH);
        expect(roles(d)).toEqual(['featureSources']);
        expect(d[0].message).toContain('DynamicClass.attributes');
        expect(d[0].message).toContain('Viewpoint');
    });

    it('a last hop whose type does not conform to the type of the defining feature is a defect', () => {
        const short = checkBinding(withPath(['Class.viewpoints', 'Viewpoint.classes']), DCN_SKETCH);
        expect(roles(short)).toEqual(['featureSources']);
        expect(short[0].message).toContain('Property');
        expect(roles(checkBinding(withPath(['Class.viewpoints', 'Viewpoint.classes', 'DynamicClass.events']), DCN_SKETCH))).toEqual(['featureSources']);
    });

    it('every path is judged and its index named; the conformance of the last hop needs a defining feature', () => {
        const d = checkBinding(withPath(PATH, ['Class.viewpoints', 'DynamicClass.attributes'], ['Class.viewpoints', 'Viewpoint.classes']), DCN_SKETCH);
        expect(d.map(x => x.message.slice(0, 18))).toEqual(['featureSources[1].', 'featureSources[2].']);
        const { slotContainer, definingFeature, valueHolder, valueKinds, ...noSlots } = withPath(['Class.viewpoints', 'Viewpoint.classes']);
        void slotContainer; void definingFeature; void valueHolder; void valueKinds;
        expect(checkBinding(noSlots as OntoBinding, DCN_SKETCH)).toEqual([]);
    });
});

// The clabject metamodel of discovery 2026-11-16 §3.4: one metaclass on both ends of the type reference.
const MLM_SKETCH: MetamodelSketch = {
    classes: [cls('Element', true), sub('Clabject', 'Element'), sub('Field', 'Element'), cls('Slot'), cls('Value', true), sub('IntValue', 'Value'), sub('DataType', 'Element')],
    references: [
        ref('Clabject.type', 'Clabject', 'Clabject'),
        ref('Clabject.supers', 'Clabject', 'Clabject'),
        ref('Clabject.fields', 'Clabject', 'Field'),
        ref('Clabject.slots', 'Clabject', 'Slot'),
        ref('Slot.field', 'Slot', 'Field'),
        ref('Slot.value', 'Slot', 'Value'),
        ref('Field.type', 'Field', 'DataType'),
    ],
    attributes: [
        attr('Element.rank', 'Element', 'Pointer_EINT'),
        attr('Clabject.potency', 'Clabject', 'Pointer_EINT'),
        attr('Clabject.isAbstract', 'Clabject', 'Pointer_EBOOLEAN'),
        attr('Field.potency', 'Field', 'Pointer_EINT'),
        attr('Field.default', 'Field'),
        attr('IntValue.value', 'IntValue', 'Pointer_EINT'),
    ],
};
const MLM: OntoBinding = {
    name: 'object',
    typeReference: 'Clabject.type',
    featureContainer: 'Clabject.fields',
    generalization: { direct: 'Clabject.supers' },
    slotContainer: 'Clabject.slots',
    definingFeature: 'Slot.field',
    valueHolder: 'Slot.value',
    abstractFlag: 'Clabject.isAbstract',
    featureType: 'Field.type',
    defaultValue: 'Field.default',
    valueKinds: [{ when: 'primitive:Integer', create: 'IntValue', field: 'IntValue.value' }],
    potency: 'Clabject.potency',
    featurePotency: 'Field.potency',
};

describe('bindingCheck of the level roles (R-OI-25)', () => {
    it('the clabject record is valid; so are potencies inherited from a common superclass', () => {
        expect(checkBinding(MLM, MLM_SKETCH)).toEqual([]);
        expect(checkBinding({ ...MLM, potency: 'Element.rank', featurePotency: 'Element.rank' }, MLM_SKETCH)).toEqual([]);
    });

    it('a level role needs an attribute of the metamodel', () => {
        expect(roles(checkBinding({ ...MLM, potency: 'Clabject.type' }, MLM_SKETCH))).toEqual(['potency']);
        expect(roles(checkBinding({ ...MLM, featurePotency: 'Field.nope' }, MLM_SKETCH))).toEqual(['featurePotency']);
    });

    it('potency belongs to the instance metaclass, featurePotency to the feature metaclass', () => {
        const wrong = checkBinding({ ...MLM, potency: 'Field.potency', featurePotency: 'Clabject.potency' }, MLM_SKETCH);
        expect(roles(wrong)).toEqual(['potency', 'featurePotency']);
        expect(wrong[0].message).toContain('Field.potency is owned by Field');
        expect(wrong[1].message).toContain('the type of the feature container');
    });

    it('featurePotency needs the classifier to have a type: on UML (a Class is no InstanceSpecification) it is a defect', () => {
        const uml: MetamodelSketch = { ...SKETCH, attributes: [...SKETCH.attributes, attr('Property.potency', 'Property', 'Pointer_EINT'), attr('IS.potency', 'InstanceSpecification', 'Pointer_EINT')] };
        expect(checkBinding({ ...OBJECT, potency: 'IS.potency' }, uml)).toEqual([]);
        const d = checkBinding({ ...OBJECT, featurePotency: 'Property.potency' }, uml);
        expect(roles(d)).toEqual(['featurePotency']);
        expect(d[0].message).toContain('owned by Class, which is no InstanceSpecification');
    });

    it('featurePotency together with feature sources is a defect', () => {
        const sketch: MetamodelSketch = { ...MLM_SKETCH, references: [...MLM_SKETCH.references, ref('Clabject.more', 'Clabject', 'Field')] };
        const both = checkBinding({ ...MLM, featureSources: [{ path: ['Clabject.more'] }] }, sketch);
        expect(roles(both)).toEqual(['featurePotency']);
        expect(checkBinding({ ...MLM, featurePotency: undefined, featureSources: [{ path: ['Clabject.more'] }] }, sketch)).toEqual([]);
    });
});

interface Obj { meta: string; refs?: Record<string, string[]>; attrs?: Record<string, unknown> }
const levelView = (objects: Record<string, Obj>): OntoReadView => ({
    metaclassOf: id => objects[id]?.meta,
    referenceTargets: (id, r) => objects[id]?.refs?.[r] ?? [],
    attributeValue: (id, a) => objects[id]?.attrs?.[a],
    ownerOf: f => ({ 'Clabject.type': 'Clabject', 'Clabject.fields': 'Clabject' } as Record<string, string>)[f],
    conformsTo: (m, s) => m === s,
});
const field = (potency?: number): Obj => ({ meta: 'Field', attrs: potency === undefined ? {} : { 'Field.potency': potency } });

describe('checkLevels', () => {
    const shop: Record<string, Obj> = {
        ProductType: { meta: 'Clabject', refs: { 'Clabject.fields': ['taxRate', 'price', 'legacy', 'bonus'] }, attrs: { 'Clabject.potency': 2 } },
        taxRate: field(1), price: field(2), legacy: field(0), bonus: field(3),
        Book: { meta: 'Clabject', refs: { 'Clabject.type': ['ProductType'], 'Clabject.fields': ['isbn'] } },
        isbn: field(),
        mobyDick: { meta: 'Clabject', refs: { 'Clabject.type': ['Book'], 'Clabject.fields': ['note'] } },
        note: field(1),
        Thing: { meta: 'Clabject', refs: { 'Clabject.fields': ['deep'] } },
        deep: field(5),
    };
    const ids = Object.keys(shop);

    it('a field below 1 or above its classifier\'s potency is a warning; an unbounded root takes any potency', () => {
        expect(checkLevels(levelView(shop), MLM, ids)).toEqual([
            { kind: 'potency', severity: 'warning', classifier: 'ProductType', feature: 'legacy', potency: 0, classifierPotency: 2 },
            { kind: 'potency', severity: 'warning', classifier: 'ProductType', feature: 'bonus', potency: 3, classifierPotency: 2 },
            { kind: 'potency', severity: 'warning', classifier: 'mobyDick', feature: 'note', potency: 1, classifierPotency: 0 },
        ]);
    });

    it('without featurePotency no potency is judged', () => {
        expect(checkLevels(levelView(shop), { ...MLM, featurePotency: undefined }, ids)).toEqual([]);
    });

    it('each type cycle is one error, whichever member or descendant meets it first', () => {
        const view = levelView({
            A: { meta: 'Clabject', refs: { 'Clabject.type': ['B'] } },
            B: { meta: 'Clabject', refs: { 'Clabject.type': ['A'] } },
            x1: { meta: 'Clabject', refs: { 'Clabject.type': ['A'] } },
            X: { meta: 'Clabject', refs: { 'Clabject.type': ['X'] } },
        });
        expect(checkLevels(view, MLM, ['x1', 'A', 'B', 'X'])).toEqual([
            { kind: 'type-cycle', severity: 'error', cycle: ['A', 'B', 'A'] },
            { kind: 'type-cycle', severity: 'error', cycle: ['X', 'X'] },
        ]);
        expect(checkLevels(view, { ...MLM, featurePotency: undefined, potency: undefined }, ['B'])).toEqual([
            { kind: 'type-cycle', severity: 'error', cycle: ['B', 'A', 'B'] },
        ]);
    });
});
