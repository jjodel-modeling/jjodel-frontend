/**
 * `FEATURE_HAS_VALUES` (P-2026-10-24-2320): a `delete` of an attribute or reference whose slots
 * hold values in a conforming model warns once per model, with the count, and still plans.
 *
 * The world is built from a plain `idlookup` by `buildPlanWorld`, so the count is the builder's
 * (holes dropped, models of another metamodel left out) and the warning the planner's.
 */
import { describe, it, expect } from 'vitest';
import { buildPlanWorld } from '../planWorld';
import { planEffects } from '../effectsPlanner';

function lookup(): Record<string, any> {
    return {
        mm: { id: 'mm', className: 'DModel', name: 'MM', isMetamodel: true, packages: ['pkg'] },
        pkg: { id: 'pkg', className: 'DPackage', name: 'p', father: 'mm' },
        cPerson: { id: 'cPerson', className: 'DClass', name: 'Person', father: 'pkg', extends: [], attributes: ['aAge', 'aNick'], references: ['rFriends'] },
        aAge: { id: 'aAge', className: 'DAttribute', name: 'age', father: 'cPerson', upperBound: 1 },
        aNick: { id: 'aNick', className: 'DAttribute', name: 'nick', father: 'cPerson', upperBound: 1 },
        rFriends: { id: 'rFriends', className: 'DReference', name: 'friends', father: 'cPerson', type: 'cPerson', upperBound: -1 },

        org: { id: 'org', className: 'DModel', name: 'org', instanceof: 'mm', objects: ['o1', 'o2'] },
        o1: { id: 'o1', className: 'DObject', instanceof: 'cPerson', father: 'org', features: ['v1', 'v2', 'v5'] },
        v1: { id: 'v1', className: 'DValue', instanceof: 'aAge', father: 'o1', values: [41] },
        v2: { id: 'v2', className: 'DValue', instanceof: 'rFriends', father: 'o1', values: ['o2', null] },
        v5: { id: 'v5', className: 'DValue', instanceof: 'aNick', father: 'o1', values: [''] },
        o2: { id: 'o2', className: 'DObject', instanceof: 'cPerson', father: 'org', features: ['v3'] },
        v3: { id: 'v3', className: 'DValue', instanceof: 'aAge', father: 'o2', values: [0] },

        demo: { id: 'demo', className: 'DModel', name: 'demo', instanceof: 'mm', objects: ['o3'] },
        o3: { id: 'o3', className: 'DObject', instanceof: 'cPerson', father: 'demo', features: ['v4'] },
        v4: { id: 'v4', className: 'DValue', instanceof: 'aAge', father: 'o3', values: [7] },

        // A model of another metamodel with a slot that names the same feature: not counted.
        other: { id: 'other', className: 'DModel', name: 'other', instanceof: 'mmOther', objects: ['o9'] },
        o9: { id: 'o9', className: 'DObject', instanceof: 'cPerson', father: 'other', features: ['v9'] },
        v9: { id: 'v9', className: 'DValue', instanceof: 'aAge', father: 'o9', values: [1, 2, 3] },
    };
}

describe('buildPlanWorld: slot values of a metamodel world', () => {
    it('counts the values per feature and conforming model, holes and other metamodels out', () => {
        const w = buildPlanWorld(lookup(), 'mm');
        expect(w.m2!.slotValues).toEqual({
            aAge: [{ modelId: 'org', model: 'org', count: 2 }, { modelId: 'demo', model: 'demo', count: 1 }],
            rFriends: [{ modelId: 'org', model: 'org', count: 1 }],
        });
    });

    it('is not read for an M1 world', () => {
        expect(buildPlanWorld(lookup(), 'org').m2!.slotValues).toBeUndefined();
    });
});

describe('planEffects: FEATURE_HAS_VALUES', () => {
    const plan = (script: string) => planEffects(script, buildPlanWorld(lookup(), 'mm'));

    it('a delete of a filled attribute warns once per model, with the count, and still plans', async () => {
        const p = await plan('delete attribute Person.age');
        expect(p.warnings).toEqual([
            { line: 1, code: 'FEATURE_HAS_VALUES', message: 'org loses 2 slot values' },
            { line: 1, code: 'FEATURE_HAS_VALUES', message: 'demo loses 1 slot value' },
        ]);
        expect(p.deleted.map((d) => d.name)).toEqual(['age']);
    });

    it('a delete of a filled reference warns', async () => {
        const p = await plan('delete reference Person.friends');
        expect(p.warnings.map((w) => w.message)).toEqual(['org loses 1 slot value']);
    });

    it('a delete of a class sums the values of the features it cascades to', async () => {
        const p = await plan('\ndelete class Person');
        expect(p.warnings).toEqual([
            { line: 2, code: 'FEATURE_HAS_VALUES', message: 'org loses 3 slot values' },
            { line: 2, code: 'FEATURE_HAS_VALUES', message: 'demo loses 1 slot value' },
        ]);
    });

    it('a delete of an empty feature, or of one the script created, does not warn', async () => {
        expect((await plan('delete attribute Person.nick')).warnings).toEqual([]);
        expect((await plan('create attribute extra in Person\ndelete attribute Person.extra')).warnings).toEqual([]);
    });
});
