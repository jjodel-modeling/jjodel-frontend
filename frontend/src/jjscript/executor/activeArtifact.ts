/**
 * Which artefact is on screen: the decision, without the runtime
 *
 * `_activeArtifactCache` (see `utils.ts`) is stamped by Jodie's
 * `EDITOR_TYPE_CHANGE` listener with the tab the user actually opened. Before this module the
 * cache was only a shortcut: `getActiveModel()` consulted it, and on a miss walked on to the
 * dock tab and then to `_lastSelected.modelElement`, so an element selected in an M1 model at
 * any earlier time made it answer M1 while a metamodel was on screen. `getActiveLevel()`, which
 * obeys the cache, answered M2 on the same state; a Jjodie reply was then stamped M1 and every
 * `create` in it refused. Measured in
 * `docs/discovery/discovery_2026-09-16_jjodie_scope_level_m1_on_metamodel.md`.
 *
 * The rule here: when the cache names an artefact level, it decides, and the fallbacks do not
 * run. `editorType` is not two-valued (`'summary'`, `'transformation'` and `'viewpoint'` are
 * stamped too), so only `'model'` and `'metamodel'` count as naming a level. On any other value,
 * and on a cold cache, the fallback chain runs exactly as before.
 *
 * Pure on purpose: the cache, the cached resolution and the fallbacks are all arguments, so this
 * runs under the bench's `environment: 'node'`, which `utils.ts` does not (it reaches monaco
 * through `joiner`, and `DockManager` through the dock).
 */

/** The shape `setActiveArtifactCache` stores. `editorType` is free-form by design (see above). */
export interface ActiveArtifactCache {
    modelId: string;
    editorType: string;
}

/** The only thing this module needs to know about a model. */
export interface ArtifactLike {
    isMetamodel?: unknown;
}

/**
 * `true` / `false` when the cache names an artefact level, `null` when it does not, either
 * because it is cold, or because it holds a tab that is not an artefact at all.
 */
export function cachedArtifactIsMetamodel(cache: ActiveArtifactCache | null | undefined): boolean | null {
    if (!cache) return null;
    if (cache.editorType === 'metamodel') return true;
    if (cache.editorType === 'model') return false;
    return null;
}

/**
 * The artefact of the requested level, or null.
 *
 * @param expectMetamodel  true to ask for the active metamodel, false for the active M1 model.
 * @param cache            the module-level cache, as stamped by the last EDITOR_TYPE_CHANGE.
 * @param resolveCached    resolves the cached id to a model; only called when the cache names
 *                         the requested level.
 * @param fallbacks        the cold-cache chain, tried in order (dock tab, then last selection).
 *                         Never called when the cache names the OTHER level: that is the whole
 *                         fix. Still called when the cache names this level but its id no longer
 *                         resolves (stale cache, see the body).
 */
export function resolveActiveArtifact<T extends ArtifactLike>(
    expectMetamodel: boolean,
    cache: ActiveArtifactCache | null | undefined,
    resolveCached: () => T | null,
    fallbacks: Array<() => T | null>
): T | null {
    const cachedIsMetamodel = cachedArtifactIsMetamodel(cache);
    if (cachedIsMetamodel !== null) {
        // The cache decides the LEVEL. Asking for the other one gets null, never a fallback:
        // that fall-through is the bug.
        if (cachedIsMetamodel !== expectMetamodel) return null;
        const cached = resolveCached();
        if (cached) return cached;
        // Same level, but the id no longer resolves: the artefact was deleted, or the tab was
        // closed without an EDITOR_TYPE_CHANGE to restamp. Nothing ever clears the cache
        // (census in the discovery report), so this state persists. Fall through rather than
        // answer null, which would lose a scope the dock can still supply.
    }
    for (const next of fallbacks) {
        const candidate = next();
        if (candidate && (!!candidate.isMetamodel) === expectMetamodel) return candidate;
    }
    return null;
}

/**
 * The level on screen. Same rule, same cache: it can therefore never disagree with
 * `resolveActiveArtifact`.
 *
 * @param coldCacheHasModel  only consulted when the cache names no level.
 */
export function resolveActiveLevel(
    cache: ActiveArtifactCache | null | undefined,
    coldCacheHasModel: () => boolean
): 'M1' | 'M2' {
    const cachedIsMetamodel = cachedArtifactIsMetamodel(cache);
    if (cachedIsMetamodel !== null) return cachedIsMetamodel ? 'M2' : 'M1';
    return coldCacheHasModel() ? 'M1' : 'M2';
}
