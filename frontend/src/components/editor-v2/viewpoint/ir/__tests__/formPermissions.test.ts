/**
 * Unit tests for ir/formPermissions — what a stand-alone profile lets the IR form show and
 * offer (#157 step B). Executed on a D-layer fixture shaped like the Configurator scenario the
 * discovery measured: Scenario `edit`, Phase `read`, Vault `hidden`, Learner `edit`.
 *
 * Each test names the mutation that kills it; the bench is in the commit message.
 */
import { describe, it, expect } from 'vitest';
import {
    featureAccessIn,
    instancePermission,
    isHiddenFeature,
    isLockedValue,
    offerForProfile,
    withoutHiddenFeatures,
    type ProfileReads,
} from '../formPermissions';
import type { TargetOption } from '../../../../../jjform';

const PERMS: Record<string, 'edit' | 'read' | 'hidden'> = {
    C_Scenario: 'edit',
    C_Phase: 'read',
    C_Vault: 'hidden',
    C_Learner: 'edit',
};

/** Two roots and two bound elements per class that matters, one model. */
const LOOKUP: Record<string, any> = {
    M: { id: 'M', className: 'DModel' },
    // metafeatures of Scenario
    R_guard: { id: 'R_guard', className: 'DReference', name: 'guard', type: 'C_Vault', composition: false, aggregation: false },
    R_lead: { id: 'R_lead', className: 'DReference', name: 'lead', type: 'C_Phase', composition: true, aggregation: false },
    R_team: { id: 'R_team', className: 'DReference', name: 'team', type: 'C_Learner', composition: false, aggregation: true },
    R_mentor: { id: 'R_mentor', className: 'DReference', name: 'mentor', type: 'C_Learner', composition: false, aggregation: false },
    A_title: { id: 'A_title', className: 'DAttribute', name: 'title', type: 'EString' },
    // the subject and its slots
    sc: { id: 'sc', className: 'DObject', instanceof: 'C_Scenario', father: 'M', features: ['v_guard', 'v_lead', 'v_team', 'v_mentor', 'v_title'] },
    v_guard: { id: 'v_guard', className: 'DValue', instanceof: 'R_guard', father: 'sc' },
    v_lead: { id: 'v_lead', className: 'DValue', instanceof: 'R_lead', father: 'sc' },
    v_team: { id: 'v_team', className: 'DValue', instanceof: 'R_team', father: 'sc' },
    v_mentor: { id: 'v_mentor', className: 'DValue', instanceof: 'R_mentor', father: 'sc' },
    v_title: { id: 'v_title', className: 'DValue', instanceof: 'A_title', father: 'sc' },
    // candidates
    ph_free: { id: 'ph_free', className: 'DObject', instanceof: 'C_Phase', father: 'M' },
    ph_bound: { id: 'ph_bound', className: 'DObject', instanceof: 'C_Phase', father: 'v_lead' },
    le_free: { id: 'le_free', className: 'DObject', instanceof: 'C_Learner', father: 'M' },
    le_bound: { id: 'le_bound', className: 'DObject', instanceof: 'C_Learner', father: 'v_team' },
    va: { id: 'va', className: 'DObject', instanceof: 'C_Vault', father: 'M' },
};

const READS: ProfileReads = {
    permissionOf: (classId) => PERMS[classId] ?? 'edit',
    classOf: (id) => LOOKUP[id]?.instanceof ?? null,
    isBound: (id) => {
        const f = LOOKUP[id]?.father;
        return !f || LOOKUP[f]?.className !== 'DModel';
    },
};

const access = (key: string) => featureAccessIn(LOOKUP, 'sc', key);
const opts = (...ids: string[]): TargetOption[] => ids.map(id => ({ id, label: id }));
const ids = (o: TargetOption[]) => o.map(x => x.id);

describe('featureAccessIn — the metafeature, read off the D-layer', () => {
    it('reads a plain reference, a composition, an aggregation and an attribute', () => {
        expect(access('guard')).toEqual({ isReference: true, containment: false, typeId: 'C_Vault' });
        expect(access('lead')).toEqual({ isReference: true, containment: true, typeId: 'C_Phase' });
        // killed by: containment = composition only (aggregation also re-fathers, LReference.get_containment)
        expect(access('team')).toEqual({ isReference: true, containment: true, typeId: 'C_Learner' });
        expect(access('title')).toEqual({ isReference: false, containment: false, typeId: 'EString' });
    });

    it('is undefined for an unknown feature or object, which the rules read as nothing to filter', () => {
        expect(access('nope')).toBeUndefined();
        expect(featureAccessIn(LOOKUP, 'missing', 'guard')).toBeUndefined();
        expect(featureAccessIn(undefined, 'sc', 'guard')).toBeUndefined();
    });
});

describe('instancePermission — the exact class of the instance', () => {
    it('reads the class rule, and an unresolved class is edit', () => {
        expect(instancePermission('ph_free', READS)).toBe('read');
        expect(instancePermission('va', READS)).toBe('hidden');
        expect(instancePermission('ghost', READS)).toBe('edit');
    });
});

describe('rule 1 — a reference typed by a hidden class is not a field', () => {
    it('hides the Vault-typed reference and nothing else', () => {
        expect(isHiddenFeature(access('guard'), READS)).toBe(true);
        expect(isHiddenFeature(access('lead'), READS)).toBe(false);
    });

    it('never hides an attribute, whatever the profile says about its type', () => {
        // killed by: dropping the `isReference` gate of isHiddenFeature
        const everythingHidden: ProfileReads = { ...READS, permissionOf: () => 'hidden' };
        expect(isHiddenFeature(access('title'), everythingHidden)).toBe(false);
    });

    it('drops only the hidden field, and returns the same array when there is nothing to drop', () => {
        const fields = [{ name: 'guard' }, { name: 'lead' }, { name: 'title' }];
        expect(withoutHiddenFeatures(fields, access, READS).map(f => f.name)).toEqual(['lead', 'title']);
        const none = [{ name: 'lead' }, { name: 'title' }];
        // killed by: always returning the filtered copy (a new identity re-renders the memo chain)
        expect(withoutHiddenFeatures(none, access, READS)).toBe(none);
    });
});

describe('rule 2 — the candidates a picker may show', () => {
    it('drops hidden candidates from a plain reference and keeps bound ones there', () => {
        expect(ids(offerForProfile(opts('le_free', 'le_bound', 'va'), access('mentor'), READS)))
            .toEqual(['le_free', 'le_bound']);
    });

    it('offers no read element in a containment slot, free or bound (D3d)', () => {
        // killed by: `p === 'edit'` relaxed to `p !== 'hidden'` in the containment branch
        expect(ids(offerForProfile(opts('ph_free', 'ph_bound'), access('lead'), READS))).toEqual([]);
    });

    it('offers only FREE edit elements in an aggregation slot, which re-fathers too', () => {
        // killed by: dropping `!reads.isBound(o.id)`; by containment = composition only
        expect(ids(offerForProfile(opts('le_free', 'le_bound', 'va'), access('team'), READS))).toEqual(['le_free']);
    });

    it('leaves an attribute offer (an enum) untouched', () => {
        const literals = opts('lit_a', 'lit_b');
        expect(offerForProfile(literals, access('title'), READS)).toBe(literals);
    });
});

describe('rule 3 — a non-edit value held in a containment slot is locked (D3e, D3f)', () => {
    it('locks a read element in a composition slot, not an edit one in an aggregation slot', () => {
        expect(isLockedValue('ph_bound', access('lead'), READS)).toBe(true);
        expect(isLockedValue('le_bound', access('team'), READS)).toBe(false);
    });

    it('does not lock a value of a plain reference, whose removal evicts nothing', () => {
        // killed by: dropping the `containment` gate of isLockedValue
        expect(isLockedValue('ph_free', access('mentor'), READS)).toBe(false);
    });

    it('does not lock a hole', () => {
        // Declared intent, not a kill: dropping the `''` guard survives the bench, because a
        // hole resolves no class and an unresolved class is `edit` anyway (§5, mutation rule).
        expect(isLockedValue('', access('lead'), READS)).toBe(false);
        expect(isLockedValue(undefined, access('lead'), READS)).toBe(false);
    });
});

describe('no profile — the form is exactly the one without this module', () => {
    it('returns every input unchanged, by identity, and locks nothing', () => {
        // killed by: any rule firing without `reads` (the Data Manager and the developer path)
        const offered = opts('ph_free', 'ph_bound', 'va');
        expect(offerForProfile(offered, access('lead'), undefined)).toBe(offered);
        const fields = [{ name: 'guard' }, { name: 'lead' }];
        expect(withoutHiddenFeatures(fields, access, undefined)).toBe(fields);
        expect(isHiddenFeature(access('guard'), undefined)).toBe(false);
        expect(isLockedValue('ph_bound', access('lead'), undefined)).toBe(false);
    });
});
