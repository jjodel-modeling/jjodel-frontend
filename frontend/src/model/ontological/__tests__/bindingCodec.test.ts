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

    it('round-trips feature sources (DCN), with the unknown keys of an entry', () => {
        const sources = [
            { path: ['StaticClass.viewpoints', 'Viewpoint.classes', 'DynamicClass.attributes'] },
            { path: ['Class.ownedAttributes'], note: 'one hop' },
        ];
        const value: OntoBindings = { v: 1, bindings: [{ ...objectRecord, featureSources: sources }] };
        const text = encodeOntoBindings(value);
        const back = decoded(text);
        expect(back.bindings[0].featureSources).toEqual(sources);
        expect(back).toEqual(value);
        expect(encodeOntoBindings(back)).toBe(text);
    });

    it('a record without feature sources decodes without the key and encodes as before', () => {
        const text = JSON.stringify({ v: 1, bindings: [objectRecord] });
        const back = decoded(text);
        expect('featureSources' in back.bindings[0]).toBe(false);
        expect(encodeOntoBindings(back)).toBe(text);
    });

    it('refuses malformed feature sources, one defect each', () => {
        const bad: [unknown, string][] = [
            ['StaticClass.viewpoints', 'bindings[0].featureSources: not a list'],
            [['StaticClass.viewpoints'], 'bindings[0].featureSources[0]: not a record'],
            [[{ path: [] }], 'bindings[0].featureSources[0].path'],
            [[{ path: ['a', ''] }], 'bindings[0].featureSources[0].path'],
            [[{ path: 'a' }], 'bindings[0].featureSources[0].path'],
            [[{}], 'bindings[0].featureSources[0].path'],
            [[{ path: ['a'] }, { path: ['a', 3] }], 'bindings[0].featureSources[1].path'],
        ];
        for (const [featureSources, message] of bad) {
            const r = decodeOntoBindings({ v: 1, bindings: [{ name: 'a', typeReference: 't', featureSources }] });
            expect(r.ok).toBe(false);
            if (!r.ok) {
                expect(r.errors).toHaveLength(1);
                expect(r.errors[0]).toContain(message);
            }
        }
    });

    it('decoding a parsed record copies its feature sources: the bag value is not shared', () => {
        const input = { name: 'a', typeReference: 't', featureSources: [{ path: ['r1', 'r2'] }] };
        const back = decoded({ v: 1, bindings: [input] }).bindings[0];
        expect(back.featureSources).toEqual(input.featureSources);
        expect(back.featureSources).not.toBe(input.featureSources);
        expect(back.featureSources![0].path).not.toBe(input.featureSources[0].path);
    });

    it('an empty list of feature sources is read as such', () => {
        expect(decoded({ v: 1, bindings: [{ name: 'a', typeReference: 't', featureSources: [] }] }).bindings[0].featureSources).toEqual([]);
    });
});
