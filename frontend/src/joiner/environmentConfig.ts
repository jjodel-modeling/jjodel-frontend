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

/**
 * The metamodel (an M2 `DModel`) a metaclass belongs to, by walking `father` up to the first
 * `DModel` — a class sits under a package, possibly nested, and the package under the model.
 * Null when the chain breaks (a class not in the store yet, a corrupt father). `depthCap` is a
 * cycle belt, not a semantic limit.
 */
export function metamodelOfClass(idlookup: Idlookup, classId: string, depthCap = 64): string | null {
    if (!idlookup || !classId) return null;
    let current = idlookup[classId];
    for (let i = 0; i < depthCap && current; i++) {
        if (current.className === 'DModel') return typeof current.id === 'string' ? current.id : null;
        if (typeof current.father !== 'string') return null;
        current = idlookup[current.father];
    }
    return null;
}

/**
 * The models, among `modelIds`, a metaclass can be instantiated in: the M1 models whose
 * `instanceof` is the class's metamodel, in the order given (the project's order).
 *
 * #157, field test of 2026-09-29: the Configurator used the project's FIRST model for every
 * type, so a type of any other metamodel could not be created (the class is resolved by name
 * inside the model's own metamodel) and its instances never listed. An M1 offers the classes
 * of its own metamodel only, so the model has to be chosen per type. Empty when the project
 * has no model of that metamodel yet.
 */
export function modelsForType(idlookup: Idlookup, modelIds: readonly string[], classId: string): string[] {
    const mm = metamodelOfClass(idlookup, classId);
    if (!mm) return [];
    return (modelIds ?? []).filter((id) => idlookup[id]?.className === 'DModel' && idlookup[id].instanceof === mm);
}

/**
 * Why a metaclass cannot be a top-level type of the Configurator — created on its own at the
 * model root — or null when it can (#157 R3).
 *
 * Reads the class as the L-layer reports it, so a proxy (`LClass`) or a plain object of the same
 * shape both work, and the module keeps its zero imports. The rule is the core's own
 * `LClass.rootable` (`LModelElement.tsx` `get_rootable`): the metamodel's explicit choice when
 * set, otherwise not abstract, not interface, not singleton and not the target of a composition.
 * The other fields only explain a `false`. Measured on 2026-10-01: without this gate «New» on a
 * composed class created a part at the model root, and on an abstract class an abstract instance.
 */
export function topLevelReason(cls: any): string | null {
    if (!cls) return 'unknown metaclass';
    if (cls.rootable) return null;
    if (cls.abstract || cls.interface) return 'abstract, it has no instances of its own';
    const owners: string[] = [];
    for (const r of ((cls.isComposedBy ?? []) as any[])) {
        const name = r?.father?.name;
        if (typeof name === 'string' && name && !owners.includes(name)) owners.push(name);
    }
    if (owners.length) return `created inside ${owners.join(', ')}`;
    if (cls.isSingleton) return 'a singleton';
    return 'not allowed at the model root by its metamodel';
}
