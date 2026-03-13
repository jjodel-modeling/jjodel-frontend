/**
 * Megamodel Persistence
 *
 * Load/save logic for the megamodel, including merge of derived and user-defined edges.
 *
 * Also exposes a per-project registry so that user-defined edges read during project
 * import can be retrieved later (after Redux state is populated and artifacts are
 * available for inference).
 */

import type { Megamodel, MegamodelSerialized } from './megamodel'
import { inferMegamodelEdges } from './megamodelInference'
import type { ProjectArtifacts } from './megamodelInference'

// ============================================================
// Core load / save
// ============================================================

/**
 * Builds the runtime Megamodel by merging:
 *   1. Derived edges — inferred from current project artifacts
 *   2. User-defined edges — loaded from the serialized megamodel (if present)
 *
 * Call this after the project's Redux state is populated and artifacts
 * (metamodels, models, transformations) are accessible.
 */
export function loadMegamodel(
    serialized: MegamodelSerialized | undefined,
    artifacts: ProjectArtifacts,
): Megamodel {
    const derived = inferMegamodelEdges(artifacts)
    const userDefined = serialized?.edges ?? []

    return {
        megamodelVersion: '1.0',
        edges: [...derived, ...userDefined],
    }
}

/**
 * Produces the serialized form of a Megamodel for inclusion in the project file.
 * Only user-defined edges are persisted — derived edges are always re-computed.
 */
export function serializeMegamodel(megamodel: Megamodel): MegamodelSerialized {
    return {
        megamodelVersion: '1.0',
        edges: megamodel.edges.filter(e => e.origin === 'user-defined'),
    }
}

// ============================================================
// Per-project registry
// ============================================================

/**
 * In-memory registry: projectId → serialized megamodel (user-defined edges only).
 *
 * Purpose: bridge the gap between import time (when user-defined edges are read
 * from the JSON file) and later (when Redux state is ready and inference can run).
 *
 * Usage:
 *   - At import: call registerSerializedMegamodel(project.id, json.megamodel)
 *   - Later:     call getSerializedMegamodel(project.id) + inferMegamodelEdges() → loadMegamodel()
 */
const megamodelRegistry = new Map<string, MegamodelSerialized>()

export function registerSerializedMegamodel(
    projectId: string,
    data: MegamodelSerialized,
): void {
    megamodelRegistry.set(projectId, data)
}

export function getSerializedMegamodel(projectId: string): MegamodelSerialized | undefined {
    return megamodelRegistry.get(projectId)
}

export function clearSerializedMegamodel(projectId: string): void {
    megamodelRegistry.delete(projectId)
}

// ============================================================
// Export utility
// ============================================================

/**
 * Builds the JSON object to write into a .jjodel file.
 * Merges the raw DProject object with the serialized megamodel.
 *
 * Usage (in export handlers):
 *   const exportObj = buildProjectExportJson(project.__raw, megamodel)
 *   U.download(`${project.name}.jjodel`, JSON.stringify(exportObj))
 *
 * @param rawProject  The raw DProject object (project.__raw)
 * @param megamodel   Current runtime Megamodel (may be undefined for legacy projects)
 */
export function buildProjectExportJson(
    rawProject: Record<string, unknown>,
    megamodel?: Megamodel,
): Record<string, unknown> {
    const result = { ...rawProject }
    if (megamodel) {
        result.megamodel = serializeMegamodel(megamodel)
    }
    return result
}

/**
 * Extracts the MegamodelSerialized from a raw project JSON object.
 * Returns undefined for legacy projects that predate the megamodel feature.
 */
export function extractMegamodelFromProjectJson(
    json: Record<string, unknown>,
): MegamodelSerialized | undefined {
    const raw = json.megamodel
    if (!raw || typeof raw !== 'object') return undefined
    const candidate = raw as Record<string, unknown>
    if (candidate.megamodelVersion !== '1.0') return undefined
    return candidate as unknown as MegamodelSerialized
}
