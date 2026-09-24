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
