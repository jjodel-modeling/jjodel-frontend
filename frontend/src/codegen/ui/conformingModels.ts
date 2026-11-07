/**
 * conformingModels — the models the code panel of a metamodel editor generates from (R-GEN-19, P-2026-10-23-1910;
 * discovery 2026-10-23 §2.2).
 *
 * The project's models, in the project's order, whose `instanceof` is the metamodel: the `modelsForType` filter of the
 * Configurator (joiner/environmentConfig.ts), over the D-layer project's `models` pointers instead of a scan of the
 * whole lookup (`metamodelModels`, sim/simStateUsage.ts), so a model of another project is never offered.
 * Empty when the project is unknown or holds no such model.
 */

type Lookup = Readonly<Record<string, any>>;

export function conformingModels(lookup: Lookup, projectId: string, metamodelId: string): string[] {
    const ids = lookup[projectId]?.models;
    if (!Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === 'string' && lookup[id]?.className === 'DModel' && lookup[id].instanceof === metamodelId);
}
