/**
 * environmentConfig — pure read + permission helpers for the #157 stand-alone environments
 * (see docs/discovery/discovery_2026-09-23_157_standalone_configurator.md).
 *
 * ZERO imports on purpose. `joiner/classes.ts` is not importable in the vitest bench
 * (`window is not defined`, like nine other suites — see CLAUDE.md §5), so the logic that
 * must be tested lives here and operates on a plain `idlookup` object, exactly the way
 * `components/abstract/tabs/instanceManagerModel.ts` does. The impure half (resolving the
 * store, creating the entity via `.new()`) stays in `classes.ts` on the D-class statics.
 *
 * The config is a `DEnvironmentConfig` entity whose `father` is the owning project (a
 * back-pointer, so `DProject` gains no field). A project's config is found by scanning
 * `idlookup` for `className === 'DEnvironmentConfig' && father === projectId`.
 *
 * A **profile** (role) restricts which top-level types a stand-alone viewer sees/edits.
 * Named "profile" throughout; the legacy className/field name "DRole"/"roles" (from the
 * Fase 0b draft) is still accepted on read so profiles created before the rename survive.
 */

/** Per-metaclass permission for a profile. Absent override in the profile = {@link DEFAULT_TYPE_PERMISSION}. */
export type EnvPermission = 'hidden' | 'read' | 'edit';

/** No override recorded on the profile means the type is fully editable. */
export const DEFAULT_TYPE_PERMISSION: EnvPermission = 'edit';

/** The D-layer className of the config entity (kept here so the pure scan needs no import). */
export const ENVIRONMENT_CONFIG_CLASSNAME = 'DEnvironmentConfig';
/** The D-layer className of a profile entity. */
export const PROFILE_CLASSNAME = 'DProfile';
/** Legacy className accepted on read (profiles authored before the role→profile rename). */
export const LEGACY_PROFILE_CLASSNAME = 'DRole';

type Idlookup = Record<string, any>;

function isProfile(e: any): boolean {
    return !!e && (e.className === PROFILE_CLASSNAME || e.className === LEGACY_PROFILE_CLASSNAME);
}

/**
 * The `DEnvironmentConfig` owned by `projectId` (`father === projectId`), or null.
 * Total on the empty/absent cases: a project with no config yet reads as null, never throws.
 */
export function findEnvironmentConfig(idlookup: Idlookup, projectId: string): any | null {
    if (!idlookup || !projectId) return null;
    for (const k in idlookup) {
        const e = idlookup[k];
        if (e && e.className === ENVIRONMENT_CONFIG_CLASSNAME && e.father === projectId) return e;
    }
    return null;
}

/** The profile with the given id, or null when the id is absent or points at another entity. */
export function findProfile(idlookup: Idlookup, profileId: string | null | undefined): any | null {
    if (!idlookup || !profileId) return null;
    const e = idlookup[profileId];
    return isProfile(e) ? e : null;
}

/** The ids of a config's profiles, tolerating the legacy `roles` field name. */
export function profileIdsOf(config: any | null | undefined): string[] {
    if (!config) return [];
    const raw = Array.isArray(config.profiles) ? config.profiles
        : Array.isArray(config.roles) ? config.roles
        : [];
    return raw as string[];
}

/** The resolved profile objects of a config, in stored order, skipping dangling ids. */
export function profilesOfConfig(idlookup: Idlookup, config: any | null | undefined): any[] {
    return profileIdsOf(config)
        .map((id) => findProfile(idlookup, id))
        .filter(Boolean);
}

/**
 * Effective permission of a metaclass for a profile. A null/undefined profile (e.g. the
 * language developer, no `?profile` in the URL) is unrestricted; an absent override is 'edit'.
 */
export function resolveTypePermission(profile: any | null | undefined, metaclassId: string): EnvPermission {
    if (!profile) return DEFAULT_TYPE_PERMISSION;
    const perms = profile.typePermissions;
    const p = perms ? perms[metaclassId] : undefined;
    return (p === 'hidden' || p === 'read' || p === 'edit') ? p : DEFAULT_TYPE_PERMISSION;
}

/** A metaclass is visible to a profile unless the profile marks it 'hidden'. */
export function isTypeVisible(profile: any | null | undefined, metaclassId: string): boolean {
    return resolveTypePermission(profile, metaclassId) !== 'hidden';
}

/** A metaclass is editable (create/modify) only when the profile grants 'edit' (the default). */
export function isTypeEditable(profile: any | null | undefined, metaclassId: string): boolean {
    return resolveTypePermission(profile, metaclassId) === 'edit';
}

/**
 * The config's ordered top-level metaclass pointers, filtered to those visible to `profile`.
 * Order is preserved (the developer's ordering is the top-bar order). A null config yields [].
 */
export function visibleTopLevelTypes(config: any | null | undefined, profile: any | null | undefined): string[] {
    const types: string[] = (config && Array.isArray(config.topLevelTypes)) ? config.topLevelTypes : [];
    return types.filter((id) => isTypeVisible(profile, id));
}
