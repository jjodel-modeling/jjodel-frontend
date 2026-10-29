import { describe, expect, it } from 'vitest';
import { decodeOntoBindings, encodeOntoBindings, ONTO_BINDINGS_KEY } from '../bindingCodec';
import type { OntoBindings } from '../bindingCodec';

const objectRecord = {
    name: 'object',
    typeReference: 'InstanceSpecification.classifier',
    featureContainer: 'Class.ownedAttributes',
    generalization: { via: 'Class.generalizations', general: 'Generalization.general' },
    slotContainer: 'InstanceSpecification.slots',
    definingFeature: 'Slot.definingFeature',
    valueHolder: 'Slot.values',
    abstractFlag: 'Class.isAbstract',
    featureType: 'Property.type',
    defaultValue: 'Property.defaultValue',
    valueKinds: [{ when: 'primitive:String', create: 'LiteralString', field: 'LiteralString.value' }],
};

const decoded = (raw: unknown): OntoBindings => {
    const r = decodeOntoBindings(raw);
    if (!r.ok) throw new Error(r.errors.join('; '));
    return r.value;
};

describe('bindingCodec', () => {
    it('the key is not a sim* key', () => {
        expect(ONTO_BINDINGS_KEY).toBe('ontoBindings');
        expect(ONTO_BINDINGS_KEY.startsWith('sim')).toBe(false);
    });

    it('round-trips a full record and a type-reference-only record (FTG+PM)', () => {
        const value: OntoBindings = { v: 1, bindings: [objectRecord, { name: 'activity', typeReference: 'Activity.activityTypedBy' }] };
        const text = encodeOntoBindings(value);
        expect(decoded(text)).toEqual(value);
        expect(encodeOntoBindings(decoded(text))).toBe(text);
    });

    it('keeps unknown keys of the root, of a record and of the nested records', () => {
        const raw = JSON.stringify({
            v: 1,
            potencyDefault: 1,
            bindings: [{
                ...objectRecord,
                potency: 2,
                generalization: { via: 'a', general: 'b', note: 'x' },
                valueKinds: [{ when: 'instance', create: 'InstanceValue', field: 'InstanceValue.instance', hint: true }],
            }],
        });
        const value = decoded(raw);
        expect(value.potencyDefault).toBe(1);
        expect(value.bindings[0].potency).toBe(2);
        expect((value.bindings[0].generalization as any).note).toBe('x');
        expect(value.bindings[0].valueKinds![0].hint).toBe(true);
        expect(JSON.parse(encodeOntoBindings(value))).toEqual(JSON.parse(raw));
    });

    it('accepts the parsed record as well as the string; no key is no binding', () => {
        expect(decoded({ v: 1, bindings: [{ name: 'a', typeReference: 't' }] }).bindings).toHaveLength(1);
        expect(decoded(undefined)).toEqual({ v: 1, bindings: [] });
        expect(decoded(null)).toEqual({ v: 1, bindings: [] });
    });

    it('refuses an unknown version, a non-list, non-JSON, and a root that is not a record', () => {
        expect(decodeOntoBindings('{"v":2,"bindings":[]}')).toEqual({ ok: false, errors: ['Unknown version 2: only 1 is read.'] });
        expect(decodeOntoBindings('{"bindings":[]}').ok).toBe(false);
        expect(decodeOntoBindings('{"v":1,"bindings":{}}').ok).toBe(false);
        expect(decodeOntoBindings('not json').ok).toBe(false);
        expect(decodeOntoBindings('[1]').ok).toBe(false);
    });

    it('lists every shape defect and reads none of the key', () => {
        const r = decodeOntoBindings(JSON.stringify({
            v: 1,
            bindings: [
                { name: '', typeReference: 't' },
                { name: 'b' },
                { name: 'c', typeReference: 't', featureContainer: 3 },
                { name: 'd', typeReference: 't', generalization: { via: 'only-via' } },
                { name: 'e', typeReference: 't', generalization: { direct: 'x', via: 'y', general: 'z' } },
                { name: 'f', typeReference: 't', valueKinds: [{ when: 'x' }] },
                7,
            ],
        }));
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.errors).toHaveLength(7);
            expect(r.errors[0]).toContain('bindings[0].name');
        }
    });

    it('does not refuse a record with three of the four slot roles: that is the check\'s', () => {
        const r = decodeOntoBindings({ v: 1, bindings: [{ name: 'a', typeReference: 't', slotContainer: 's', definingFeature: 'd', valueHolder: 'h' }] });
        expect(r.ok).toBe(true);
    });

    it('a direct generalization round-trips', () => {
        const value: OntoBindings = { v: 1, bindings: [{ name: 'x', typeReference: 't', generalization: { direct: 'Class.extends' } }] };
        expect(decoded(encodeOntoBindings(value))).toEqual(value);
    });
});
