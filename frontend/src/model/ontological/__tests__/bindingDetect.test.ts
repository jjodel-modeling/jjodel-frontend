import { describe, expect, it } from 'vitest';
import type { MetamodelSketch } from '../../simulation/profileBinder';
import type { OntoBinding, OntoBindings } from '../bindingCodec';
import { decodeOntoBindings, encodeOntoBindings } from '../bindingCodec';
import { checkBindings } from '../bindingCheck';
import {
    bagAfterConfirm, bagAfterRemove, detectOntoBindings, detectedRecord, editorBase, rolePaths, roleValue, withRoleValue,
} from '../bindingDetect';

// The names of the fixture (uml-s3b/uml-class-object.jjodel), ids distinct from names. Feature names repeat as they
// do there: `value` on three literals, `type` on two classes, each time the wrong owner listed first.

const cls = (name: string, ...supers: string[]) => ({ id: `C:${name}`, name, abstract: false, supers: supers.map(s => `C:${s}`) });
const ref = (owner: string, name: string, type: string) => ({ id: `R:${owner}.${name}`, name, owner: `C:${owner}`, type: `C:${type}`, composition: false, aggregation: false });
const attr = (owner: string, name: string) => ({ id: `A:${owner}.${name}`, name, owner: `C:${owner}`, type: 'Pointer_ESTRING' });

const UML: MetamodelSketch = {
    classes: [
        cls('Element'), cls('NamedElement', 'Element'), cls('Classifier', 'NamedElement'), cls('Class', 'Classifier'), cls('Association', 'Classifier'),
        cls('Generalization', 'Element'), cls('TypedElement', 'NamedElement'), cls('Property', 'TypedElement'), cls('Operation', 'TypedElement'),
        cls('InstanceSpecification', 'NamedElement'), cls('Slot', 'Element'), cls('ValueSpecification', 'TypedElement'),
        cls('LiteralBoolean', 'ValueSpecification'), cls('LiteralString', 'ValueSpecification'), cls('LiteralInteger', 'ValueSpecification'),
        cls('InstanceValue', 'ValueSpecification'),
    ],
    references: [
        ref('InstanceSpecification', 'classifier', 'Classifier'), ref('InstanceSpecification', 'slots', 'Slot'),
        ref('Slot', 'definingFeature', 'Property'), ref('Slot', 'values', 'ValueSpecification'),
        ref('Class', 'ownedAttributes', 'Property'), ref('Classifier', 'generalizations', 'Generalization'),
        ref('Generalization', 'general', 'Classifier'), ref('Operation', 'type', 'Classifier'), ref('TypedElement', 'type', 'Classifier'),
        ref('InstanceValue', 'instance', 'InstanceSpecification'), ref('Association', 'memberEnds', 'Property'),
    ],
    attributes: [
        attr('Classifier', 'isAbstract'), attr('Property', 'defaultValue'),
        attr('LiteralBoolean', 'value'), attr('LiteralString', 'value'), attr('LiteralInteger', 'value'),
    ],
};

const VALUE_KINDS = [
    { when: 'primitive:Boolean', create: 'C:LiteralBoolean', field: 'A:LiteralBoolean.value' },
    { when: 'primitive:String', create: 'C:LiteralString', field: 'A:LiteralString.value' },
    { when: 'primitive:Integer', create: 'C:LiteralInteger', field: 'A:LiteralInteger.value' },
    { when: 'instance', create: 'C:InstanceValue', field: 'R:InstanceValue.instance' },
];

// The probe's table (onto-s2-instantiate.ts, the console setup), `link` with the slot roles of question 3.
const SHARED = {
    typeReference: 'R:InstanceSpecification.classifier', slotContainer: 'R:InstanceSpecification.slots',
    definingFeature: 'R:Slot.definingFeature', valueHolder: 'R:Slot.values',
};
const OBJECT: OntoBinding = {
    name: 'object', ...SHARED, featureContainer: 'R:Class.ownedAttributes',
    generalization: { via: 'R:Classifier.generalizations', general: 'R:Generalization.general' },
    abstractFlag: 'A:Classifier.isAbstract', featureType: 'R:TypedElement.type', defaultValue: 'A:Property.defaultValue', valueKinds: VALUE_KINDS,
};
const LINK: OntoBinding = { name: 'link', ...SHARED, featureContainer: 'R:Association.memberEnds', valueKinds: VALUE_KINDS };

const FOREIGN: OntoBinding = { name: 'dynamic', typeReference: 'R:InstanceSpecification.classifier', featureSources: [{ path: ['R:Class.ownedAttributes'] }], note: 'dcn' };
const bagOf = (bindings: OntoBinding[], extras: Record<string, unknown> = {}): OntoBindings => ({ v: 1, bindings, ...extras });
const decoded = (s: string): OntoBindings => {
    const d = decodeOntoBindings(s);
    if (!d.ok) throw new Error(d.errors.join('; '));
    return d.value;
};

describe('bindingDetect: Detect', () => {
    it('finds the 15 pairs of the probe table on the fixture names, every row found', () => {
        const { bindings, rows } = detectOntoBindings(UML);
        const pairs = new Set(rows.filter(r => r.featureName !== undefined).map(r => `${r.className}.${r.featureName}`));
        expect(pairs.size).toBe(15);
        expect(rows.filter(r => r.status === 'missing')).toEqual([]);
        expect(bindings).toEqual([OBJECT, LINK]);
    });

    it('resolves an ambiguous name by its owner: value on three literals, type on two classes', () => {
        const [object] = detectOntoBindings(UML).bindings;
        expect(object.valueKinds?.map(k => k.field)).toEqual(['A:LiteralBoolean.value', 'A:LiteralString.value', 'A:LiteralInteger.value', 'R:InstanceValue.instance']);
        expect(object.featureType).toBe('R:TypedElement.type');
    });

    it('searches the ancestors of the named class, nearest first', () => {
        const sketch: MetamodelSketch = {
            ...UML,
            classes: [...UML.classes.filter(c => c.name !== 'InstanceSpecification'), cls('Spec', 'NamedElement'), cls('InstanceSpecification', 'Spec')],
            references: [...UML.references.filter(r => r.id !== 'R:InstanceSpecification.classifier'), ref('Spec', 'classifier', 'Classifier'), ref('Spec', 'slots', 'Slot')],
        };
        const [object] = detectOntoBindings(sketch).bindings;
        expect(object.typeReference).toBe('R:Spec.classifier');
        expect(object.slotContainer).toBe('R:InstanceSpecification.slots');
    });

    it('proposes nothing on a sketch that is not UML, every row missing', () => {
        const petri: MetamodelSketch = {
            classes: [cls('Net'), cls('Place'), cls('Transition'), cls('Arc')],
            references: [ref('Net', 'places', 'Place'), ref('Arc', 'source', 'Place'), ref('Arc', 'target', 'Transition')],
            attributes: [attr('Place', 'tokens'), attr('Place', 'value')],
        };
        const { bindings, rows } = detectOntoBindings(petri);
        expect(bindings).toEqual([]);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every(r => r.status === 'missing')).toBe(true);
    });

    it('the proposed link carries the four slot roles, valueKinds as object, and the proposal passes checkBindings', () => {
        const { bindings } = detectOntoBindings(UML);
        const link = bindings.find(b => b.name === 'link') as OntoBinding;
        expect(link.valueKinds).toEqual(OBJECT.valueKinds);
        expect(checkBindings(bindings, UML)).toEqual({ ok: true, defects: [] });
    });

    it('leaves a missing part unset and marks its row missing; half a generalization is not proposed', () => {
        const sketch: MetamodelSketch = { ...UML, references: UML.references.filter(r => r.id !== 'R:Generalization.general') };
        const { bindings, rows } = detectOntoBindings(sketch);
        expect(bindings[0].generalization).toBeUndefined();
        expect(rows.filter(r => r.status === 'missing').map(r => `${r.record}:${r.path}`)).toEqual(['object:generalization.general']);
        expect(decodeOntoBindings(bagAfterConfirm(bagOf([]), bindings)).ok).toBe(true);
    });
});

describe('bindingDetect: the bag Confirm and Remove write', () => {
    it('Confirm keeps a foreign record and an unknown root key byte-equal after decode', () => {
        const stored = decoded(encodeOntoBindings(bagOf([FOREIGN, { name: 'object', typeReference: 'R:Slot.values' }], { origin: 'dcn-front' })));
        const after = decoded(bagAfterConfirm(stored, [OBJECT, LINK]));
        expect(JSON.stringify(after.bindings.find(b => b.name === 'dynamic'))).toBe(JSON.stringify(stored.bindings[0]));
        expect(after.origin).toBe('dcn-front');
        expect(after.bindings.map(b => b.name)).toEqual(['dynamic', 'object', 'link']);
        expect(after.bindings[1]).toEqual(OBJECT);
    });

    it('Detect keeps the keys of a stored record the editor does not list', () => {
        const stored: OntoBinding = { name: 'object', typeReference: 'R:Slot.values', featureSources: [{ path: ['R:Class.ownedAttributes'] }], extra: 7 };
        const record = detectedRecord(stored, OBJECT);
        expect(record.featureSources).toEqual(stored.featureSources);
        expect(record.extra).toBe(7);
        expect(record.typeReference).toBe(OBJECT.typeReference);
    });

    it('Remove takes out object and link and keeps the foreign record and the root key', () => {
        const stored = decoded(encodeOntoBindings(bagOf([OBJECT, FOREIGN, LINK], { origin: 'dcn-front' })));
        const after = decoded(bagAfterRemove(stored));
        expect(after.bindings.map(b => b.name)).toEqual(['dynamic']);
        expect(JSON.stringify(after.bindings[0])).toBe(JSON.stringify(stored.bindings[1]));
        expect(after.origin).toBe('dcn-front');
    });

    it('Remove gives {"v":1,"bindings":[]} when there is no other record', () => {
        expect(bagAfterRemove(decoded(encodeOntoBindings(bagOf([OBJECT, LINK]))))).toBe('{"v":1,"bindings":[]}');
    });

    it('the editor base of an undecodable bag is its errors, of no bag an empty list', () => {
        expect(editorBase('{"v":2,"bindings":[]}')).toEqual({ ok: false, errors: ['Unknown version 2: only 1 is read.'] });
        expect(editorBase(undefined)).toEqual({ ok: true, base: { v: 1, bindings: [] } });
    });
});

describe('bindingDetect: role paths', () => {
    it('reads and writes an id role, a generalization part and a value kind part', () => {
        expect(rolePaths(OBJECT)).toContain('valueKinds.3.field');
        expect(roleValue(OBJECT, 'generalization.general')).toBe('R:Generalization.general');
        const b = withRoleValue(withRoleValue(OBJECT, 'valueKinds.1.field', 'A:LiteralInteger.value'), 'abstractFlag', undefined);
        expect(roleValue(b, 'valueKinds.1.field')).toBe('A:LiteralInteger.value');
        expect('abstractFlag' in b).toBe(false);
        expect(OBJECT.valueKinds?.[1].field).toBe('A:LiteralString.value');
    });
});
