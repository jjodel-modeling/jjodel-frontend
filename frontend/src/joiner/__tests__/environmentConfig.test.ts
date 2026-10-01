import { describe, it, expect } from 'vitest';
import {
    findEnvironmentConfig,
    findProfile,
    profileIdsOf,
    profilesOfConfig,
    resolveTypePermission,
    isTypeVisible,
    isTypeEditable,
    visibleTopLevelTypes,
    DEFAULT_TYPE_PERMISSION,
    metamodelOfClass,
    modelsForType,
} from '../environmentConfig';

// A plain idlookup, the shape the store persists — no D-layer classes, so this suite
// imports the pure module only (classes.ts dies on `window is not defined`, CLAUDE.md §5).
function fixture() {
    const cfg1 = {
        className: 'DEnvironmentConfig',
        father: 'proj1',
        topLevelTypes: ['C1', 'C2', 'C3'],
        profiles: ['p1'],
    };
    const p1 = {
        className: 'DProfile',
        father: 'cfg1',
        name: 'educator',
        typePermissions: { C1: 'read', C2: 'hidden' },
    };
    const idlookup: Record<string, any> = {
        cfg1,
        p1,
        proj1: { className: 'DProject' },
        other: { className: 'DModel' },
    };
    return { idlookup, cfg1, p1 };
}

describe('findEnvironmentConfig', () => {
    it('finds the config owned by the project (father === projectId)', () => {
        const { idlookup, cfg1 } = fixture();
        expect(findEnvironmentConfig(idlookup, 'proj1')).toBe(cfg1);
    });
    it('returns null for a project with no config', () => {
        const { idlookup } = fixture();
        expect(findEnvironmentConfig(idlookup, 'projX')).toBeNull();
    });
    it('is total on empty inputs', () => {
        const { idlookup } = fixture();
        expect(findEnvironmentConfig({}, 'proj1')).toBeNull();
        expect(findEnvironmentConfig(idlookup, '')).toBeNull();
        expect(findEnvironmentConfig(null as any, 'proj1')).toBeNull();
    });
});

describe('findProfile', () => {
    it('finds a profile by id', () => {
        const { idlookup, p1 } = fixture();
        expect(findProfile(idlookup, 'p1')).toBe(p1);
    });
    it('accepts the legacy DRole className', () => {
        const idlookup: Record<string, any> = { r1: { className: 'DRole', name: 'legacy' } };
        expect(findProfile(idlookup, 'r1')).toBe(idlookup.r1);
    });
    it('rejects an id that points at a non-profile entity', () => {
        const { idlookup } = fixture();
        expect(findProfile(idlookup, 'cfg1')).toBeNull();
        expect(findProfile(idlookup, 'proj1')).toBeNull();
    });
    it('is total on absent id', () => {
        const { idlookup } = fixture();
        expect(findProfile(idlookup, undefined)).toBeNull();
        expect(findProfile(idlookup, null)).toBeNull();
    });
});

describe('profileIdsOf / profilesOfConfig', () => {
    it('reads the profiles array', () => {
        const { cfg1 } = fixture();
        expect(profileIdsOf(cfg1)).toEqual(['p1']);
    });
    it('tolerates the legacy `roles` field name', () => {
        expect(profileIdsOf({ roles: ['r1', 'r2'] })).toEqual(['r1', 'r2']);
    });
    it('resolves objects in order and skips dangling ids', () => {
        const { idlookup, p1 } = fixture();
        (idlookup.cfg1 as any).profiles = ['p1', 'ghost'];
        expect(profilesOfConfig(idlookup, idlookup.cfg1)).toEqual([p1]);
    });
    it('is total on null config', () => {
        expect(profileIdsOf(null)).toEqual([]);
        expect(profilesOfConfig({}, null)).toEqual([]);
    });
});

describe('resolveTypePermission', () => {
    it('reads explicit overrides', () => {
        const { p1 } = fixture();
        expect(resolveTypePermission(p1, 'C1')).toBe('read');
        expect(resolveTypePermission(p1, 'C2')).toBe('hidden');
    });
    it('defaults to edit for an absent override', () => {
        const { p1 } = fixture();
        expect(resolveTypePermission(p1, 'C3')).toBe('edit');
    });
    it('a null/empty profile is unrestricted (edit)', () => {
        expect(resolveTypePermission(null, 'C1')).toBe('edit');
        expect(resolveTypePermission(undefined, 'C1')).toBe('edit');
        expect(resolveTypePermission({}, 'C1')).toBe('edit');
    });
    it('falls back to edit on a malformed override value', () => {
        expect(resolveTypePermission({ typePermissions: { C1: 'garbage' } }, 'C1')).toBe('edit');
    });
});

describe('isTypeVisible / isTypeEditable', () => {
    it('visible unless hidden', () => {
        const { p1 } = fixture();
        expect(isTypeVisible(p1, 'C1')).toBe(true); // read
        expect(isTypeVisible(p1, 'C2')).toBe(false); // hidden
        expect(isTypeVisible(p1, 'C3')).toBe(true); // default edit
        expect(isTypeVisible(null, 'C2')).toBe(true);
    });
    it('editable only when edit', () => {
        const { p1 } = fixture();
        expect(isTypeEditable(p1, 'C1')).toBe(false); // read
        expect(isTypeEditable(p1, 'C3')).toBe(true); // default edit
        expect(isTypeEditable(null, 'Cx')).toBe(true);
    });
});

describe('visibleTopLevelTypes', () => {
    it('filters hidden types and preserves order', () => {
        const { cfg1, p1 } = fixture();
        expect(visibleTopLevelTypes(cfg1, p1)).toEqual(['C1', 'C3']);
    });
    it('a null profile sees every top-level type', () => {
        const { cfg1 } = fixture();
        expect(visibleTopLevelTypes(cfg1, null)).toEqual(['C1', 'C2', 'C3']);
    });
    it('a null config yields no types', () => {
        const { p1 } = fixture();
        expect(visibleTopLevelTypes(null, p1)).toEqual([]);
    });
});

describe('defaults', () => {
    it('the default type permission is edit', () => {
        expect(DEFAULT_TYPE_PERMISSION).toBe('edit');
    });
});

// #157, field test 2026-09-29 («AIM Pro»): two metamodels, a model of only one of them.
function multiModelFixture() {
    const idlookup: Record<string, any> = {
        mmScenario: { className: 'DModel', id: 'mmScenario', isMetamodel: true },
        mmEducators: { className: 'DModel', id: 'mmEducators', isMetamodel: true },
        pkgS: { className: 'DPackage', id: 'pkgS', father: 'mmScenario' },
        pkgE: { className: 'DPackage', id: 'pkgE', father: 'mmEducators' },
        pkgE2: { className: 'DPackage', id: 'pkgE2', father: 'pkgE' },
        Scenario: { className: 'DClass', id: 'Scenario', father: 'pkgS' },
        Educator: { className: 'DClass', id: 'Educator', father: 'pkgE' },
        Nested: { className: 'DClass', id: 'Nested', father: 'pkgE2' },
        learningphase: { className: 'DModel', id: 'learningphase', isMetamodel: false, instanceof: 'mmScenario' },
        scenario2: { className: 'DModel', id: 'scenario2', isMetamodel: false, instanceof: 'mmScenario' },
    };
    return idlookup;
}

describe('metamodelOfClass', () => {
    it('walks the package chain up to the metamodel, nested packages included', () => {
        const idlookup = multiModelFixture();
        expect(metamodelOfClass(idlookup, 'Scenario')).toBe('mmScenario');
        expect(metamodelOfClass(idlookup, 'Nested')).toBe('mmEducators');
    });
    it('is null for an unknown class or a broken chain', () => {
        const idlookup = multiModelFixture();
        expect(metamodelOfClass(idlookup, 'nope')).toBeNull();
        idlookup.Orphan = { className: 'DClass', id: 'Orphan', father: 'gone' };
        expect(metamodelOfClass(idlookup, 'Orphan')).toBeNull();
    });
});

describe('modelsForType', () => {
    it('keeps only the models of the class\'s metamodel, in project order', () => {
        const idlookup = multiModelFixture();
        const models = ['learningphase', 'scenario2'];
        expect(modelsForType(idlookup, models, 'Scenario')).toEqual(['learningphase', 'scenario2']);
        expect(modelsForType(idlookup, ['scenario2', 'learningphase'], 'Scenario')).toEqual(['scenario2', 'learningphase']);
    });
    it('is empty for a type whose metamodel has no model — not the first model of the project', () => {
        const idlookup = multiModelFixture();
        expect(modelsForType(idlookup, ['learningphase', 'scenario2'], 'Educator')).toEqual([]);
    });
    it('finds the model once the project has one', () => {
        const idlookup = multiModelFixture();
        idlookup.educators1 = { className: 'DModel', id: 'educators1', isMetamodel: false, instanceof: 'mmEducators' };
        expect(modelsForType(idlookup, ['learningphase', 'educators1'], 'Educator')).toEqual(['educators1']);
        expect(modelsForType(idlookup, ['learningphase', 'educators1'], 'Nested')).toEqual(['educators1']);
    });
});
