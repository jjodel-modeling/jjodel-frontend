/**
 * environmentConfig — pure read + permission helpers for the #157 role environments
 * (see docs/discovery/discovery_2026-09-23_157_standalone_configurator.md, Fase 0a).
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
 */

/** Per-metaclass permission for a role. Absent override in the role = {@link DEFAULT_TYPE_PERMISSION}. */
export type EnvPermission = 'hidden' | 'read' | 'edit';

/** No override recorded on the role means the type is fully editable. */
export const DEFAULT_TYPE_PERMISSION: EnvPermission = 'edit';

/** The D-layer className of the config entity (kept here so the pure scan needs no import). */
export const ENVIRONMENT_CONFIG_CLASSNAME = 'DEnvironmentConfig';
/** The D-layer className of a role entity. */
export const ROLE_CLASSNAME = 'DRole';

type Idlookup = Record<string, any>;

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

/** The `DRole` with the given id, or null when the id is absent or points at another entity. */
export function findRole(idlookup: Idlookup, roleId: string | null | undefined): any | null {
    if (!idlookup || !roleId) return null;
    const e = idlookup[roleId];
    return e && e.className === ROLE_CLASSNAME ? e : null;
}

/**
 * Effective permission of a metaclass for a role. A null/undefined role (e.g. the language
 * developer, no `?role` in the URL) is unrestricted; an absent override defaults to 'edit'.
 */
export function resolveTypePermission(role: any | null | undefined, metaclassId: string): EnvPermission {
    if (!role) return DEFAULT_TYPE_PERMISSION;
    const perms = role.typePermissions;
    const p = perms ? perms[metaclassId] : undefined;
    return (p === 'hidden' || p === 'read' || p === 'edit') ? p : DEFAULT_TYPE_PERMISSION;
}

/** A metaclass is visible to a role unless the role marks it 'hidden'. */
export function isTypeVisible(role: any | null | undefined, metaclassId: string): boolean {
    return resolveTypePermission(role, metaclassId) !== 'hidden';
}

/** A metaclass is editable (create/modify) only when the role grants 'edit' (the default). */
export function isTypeEditable(role: any | null | undefined, metaclassId: string): boolean {
    return resolveTypePermission(role, metaclassId) === 'edit';
}

/**
 * The config's ordered top-level metaclass pointers, filtered to those visible to `role`.
 * Order is preserved (the developer's ordering is the top-bar order). A null config yields [].
 */
export function visibleTopLevelTypes(config: any | null | undefined, role: any | null | undefined): string[] {
    const types: string[] = (config && Array.isArray(config.topLevelTypes)) ? config.topLevelTypes : [];
    return types.filter((id) => isTypeVisible(role, id));
}
