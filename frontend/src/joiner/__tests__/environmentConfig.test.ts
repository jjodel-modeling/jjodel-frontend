import { describe, it, expect } from 'vitest';
import {
    findEnvironmentConfig,
    findRole,
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
        roles: ['r1'],
    };
    const r1 = {
        className: 'DRole',
        father: 'cfg1',
        name: 'educator',
        typePermissions: { C1: 'read', C2: 'hidden' },
    };
    const idlookup: Record<string, any> = {
        cfg1,
        r1,
        proj1: { className: 'DProject' },
        other: { className: 'DModel' },
    };
    return { idlookup, cfg1, r1 };
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
    it('does not match a config of another project', () => {
        const { idlookup } = fixture();
        idlookup.cfg2 = { className: 'DEnvironmentConfig', father: 'projZ' };
        expect(findEnvironmentConfig(idlookup, 'proj1')).toBe(idlookup.cfg1);
    });
    it('is total on empty inputs', () => {
        const { idlookup } = fixture();
        expect(findEnvironmentConfig({}, 'proj1')).toBeNull();
        expect(findEnvironmentConfig(idlookup, '')).toBeNull();
        expect(findEnvironmentConfig(null as any, 'proj1')).toBeNull();
    });
});

describe('findRole', () => {
    it('finds a role by id', () => {
        const { idlookup, r1 } = fixture();
        expect(findRole(idlookup, 'r1')).toBe(r1);
    });
    it('rejects an id that points at a non-role entity', () => {
        const { idlookup } = fixture();
        expect(findRole(idlookup, 'cfg1')).toBeNull();
        expect(findRole(idlookup, 'proj1')).toBeNull();
    });
    it('is total on absent id', () => {
        const { idlookup } = fixture();
        expect(findRole(idlookup, undefined)).toBeNull();
        expect(findRole(idlookup, null)).toBeNull();
    });
});

describe('resolveTypePermission', () => {
    it('reads explicit overrides', () => {
        const { r1 } = fixture();
        expect(resolveTypePermission(r1, 'C1')).toBe('read');
        expect(resolveTypePermission(r1, 'C2')).toBe('hidden');
    });
    it('defaults to edit for an absent override', () => {
        const { r1 } = fixture();
        expect(resolveTypePermission(r1, 'C3')).toBe('edit');
    });
    it('a null/empty role is unrestricted (edit)', () => {
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
        const { r1 } = fixture();
        expect(isTypeVisible(r1, 'C1')).toBe(true); // read
        expect(isTypeVisible(r1, 'C2')).toBe(false); // hidden
        expect(isTypeVisible(r1, 'C3')).toBe(true); // default edit
        expect(isTypeVisible(null, 'C2')).toBe(true);
    });
    it('editable only when edit', () => {
        const { r1 } = fixture();
        expect(isTypeEditable(r1, 'C1')).toBe(false); // read
        expect(isTypeEditable(r1, 'C3')).toBe(true); // default edit
        expect(isTypeEditable(null, 'Cx')).toBe(true);
    });
});

describe('visibleTopLevelTypes', () => {
    it('filters hidden types and preserves order', () => {
        const { cfg1, r1 } = fixture();
        expect(visibleTopLevelTypes(cfg1, r1)).toEqual(['C1', 'C3']);
    });
    it('a null role sees every top-level type', () => {
        const { cfg1 } = fixture();
        expect(visibleTopLevelTypes(cfg1, null)).toEqual(['C1', 'C2', 'C3']);
    });
    it('a null config yields no types', () => {
        const { r1 } = fixture();
        expect(visibleTopLevelTypes(null, r1)).toEqual([]);
    });
});

describe('defaults', () => {
    it('the default type permission is edit', () => {
        expect(DEFAULT_TYPE_PERMISSION).toBe('edit');
    });
});
