import { describe, expect, it } from 'vitest';
import type { MetamodelSketch } from '../../simulation/profileBinder';
import type { OntoBinding } from '../bindingCodec';
import { checkBinding, checkBindings } from '../bindingCheck';

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
