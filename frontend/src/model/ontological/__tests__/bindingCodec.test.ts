import { createHash } from 'node:crypto';
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
                durability: 2,
                generalization: { via: 'a', general: 'b', note: 'x' },
                valueKinds: [{ when: 'instance', create: 'InstanceValue', field: 'InstanceValue.instance', hint: true }],
            }],
        });
        const value = decoded(raw);
        expect(value.potencyDefault).toBe(1);
        expect(value.bindings[0].durability).toBe(2);
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

    describe('the level roles (R-OI-25)', () => {
        // The bags of discovery 2026-11-16 §4 A, in the key order the probes write them (onto-s2-instantiate.ts,
        // dcn-drone-fixture.ts), with readable M2 ids.
        const shared = { typeReference: 'InstanceSpecification.classifier', slotContainer: 'InstanceSpecification.slots',
            definingFeature: 'Slot.definingFeature', valueHolder: 'Slot.values' };
        const umlObject = { name: 'object', ...shared, featureContainer: 'Class.ownedAttributes',
            generalization: { via: 'Classifier.generalizations', general: 'Generalization.general' },
            abstractFlag: 'Classifier.isAbstract', featureType: 'TypedElement.type', defaultValue: 'Property.defaultValue',
            valueKinds: [
                { when: 'primitive:Boolean', create: 'LiteralBoolean', field: 'LiteralBoolean.value' },
                { when: 'primitive:String', create: 'LiteralString', field: 'LiteralString.value' },
                { when: 'primitive:Integer', create: 'LiteralInteger', field: 'LiteralInteger.value' },
                { when: 'instance', create: 'InstanceValue', field: 'InstanceValue.instance' },
            ] };
        const umlLink = { name: 'link', ...shared, featureContainer: 'Association.memberEnds' };
        const sources = [{ path: ['StaticClass.viewpoints', 'Viewpoint.classes', 'DynamicClass.attributes'] }];
        const canonical = (raw: string): string => encodeOntoBindings(decoded(raw));
        const sha = (text: string): string => createHash('sha256').update(text).digest('hex');

        // Length and sha-256 of each canonical form, measured with the codec of a448cadf5 (before the roles).
        const pinned: [string, string, number, string][] = [
            ['UML', JSON.stringify({ v: 1, bindings: [umlObject, umlLink] }), 1022, '4e2b4e6280a8cb0e053f5154f989fa2755c232b735c60972be996215b5fc04d2'],
            ['DCN', JSON.stringify({ v: 1, bindings: [{ ...umlObject, featureSources: sources }, umlLink] }), 1123, '8cad3b6cc9218e77633e945e59a902796b1fc4ab7cf7177a6e7f4056751078fd'],
            ['DCN with foreign keys', JSON.stringify({ v: 1, note: 'root', bindings: [{ ...umlObject, featureSources: sources, hint: 'record' }, umlLink] }), 1153, '9617b6040d4843e4eeb4ab2297eb5ef04516014eb33259e01afb57f78b441743'],
        ];
        for (const [label, raw, length, hash] of pinned) {
            it(`the ${label} bag re-encodes to the bytes it had before the roles, a fixed point`, () => {
                const text = canonical(raw);
                expect(text.length).toBe(length);
                expect(sha(text)).toBe(hash);
                expect(canonical(text)).toBe(text);
                expect('potency' in decoded(text).bindings[0]).toBe(false);
                expect('featurePotency' in decoded(text).bindings[0]).toBe(false);
            });
        }

        // The canonical form of a multilevel record, which the codec of a448cadf5 also gives back byte-equal when it
        // re-encodes it (the roles are unknown keys there, kept in place at the end; measured in the lane, bench.txt).
        const mlmCanonical = '{"v":1,"bindings":[{"name":"object","typeReference":"Clabject.type","featureContainer":"Clabject.fields",'
            + '"generalization":{"direct":"Clabject.supers"},"potency":"Clabject.potency","featurePotency":"Field.potency","hint":"record"}]}';

        it('writes the two roles after the feature sources, potency first, before the unknown keys', () => {
            const raw = JSON.stringify({ v: 1, bindings: [{ featurePotency: 'Field.potency', name: 'object', potency: 'Clabject.potency',
                typeReference: 'Clabject.type', hint: 'record', featureContainer: 'Clabject.fields', generalization: { direct: 'Clabject.supers' } }] });
            expect(canonical(raw)).toBe(mlmCanonical);
            expect(canonical(mlmCanonical)).toBe(mlmCanonical);
            const back = decoded(mlmCanonical).bindings[0];
            expect(back.potency).toBe('Clabject.potency');
            expect(back.featurePotency).toBe('Field.potency');
            const withSources = encodeOntoBindings({ v: 1, bindings: [{ name: 'o', typeReference: 't', featureSources: [{ path: ['p'] }], featurePotency: 'f', potency: 'q' }] });
            expect(Object.keys(JSON.parse(canonical(withSources)).bindings[0])).toEqual(['name', 'typeReference', 'featureSources', 'potency', 'featurePotency']);
        });

        it('a level role that is not an id is a shape defect', () => {
            const r = decodeOntoBindings({ v: 1, bindings: [{ name: 'a', typeReference: 't', potency: 2, featurePotency: '' }] });
            expect(r).toEqual({ ok: false, errors: ['bindings[0].potency: not an id.', 'bindings[0].featurePotency: not an id.'] });
        });
    });
});
