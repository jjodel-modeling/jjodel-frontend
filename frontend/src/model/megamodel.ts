/**
 * Megamodel — Data Types
 *
 * The megamodel describes the relationships between project artifacts
 * (metamodels, models, transformations, scripts) as a directed graph.
 *
 * Nodes = artifacts (derived at runtime from DProject state, never persisted)
 * Edges = relationships (derived edges are re-computed; only user-defined edges are persisted)
 */

// ============================================================
// Artifact types
// ============================================================

export type ArtifactType = 'metamodel' | 'model' | 'transformation' | 'script'

/**
 * A lightweight reference to a project artifact.
 * Name is denormalized for fast display without Redux lookups.
 */
export interface ArtifactRef {
    id: string
    type: ArtifactType
    /** Denormalized display name — kept in sync on rename */
    name: string
}

// ============================================================
// Edge types
// ============================================================

export type EdgeType =
    | 'conformsTo'    // model → metamodel
    | 'inputOf'       // metamodel → transformation  (the transformation consumes models of this type)
    | 'outputOf'      // transformation → metamodel  (the transformation produces models of this type)
    | 'generatedBy'   // generated model → transformation  (instance-level: this model was produced by this transformation)
    | 'sourceOf'      // generated model → source model  (instance-level: this model was produced from this source model)
    | 'instanceInputOf' // source model → transformation  (instance-level: this model was used as input for this transformation run)
    | 'tracedBy'      // transformation → trace (execution record)
    | 'user-defined'  // explicit relationship added by the user

export type TriggerEvent =
    | 'onChange'          // artifact content modified
    | 'onSave'            // project saved
    | 'onDemand'          // manual execution by user
    | 'onCreate'          // artifact created
    | 'onOpen'            // project opened/loaded
    | 'onValidationPass'  // model became valid
    | 'onValidationFail'  // model became invalid
    // future: 'onSimilarityAbove' | 'onSimilarityBelow'

export interface TriggerConfig {
    event: TriggerEvent
    transformationId: string
    enabled: boolean
    /** ISO date string — when the trigger last fired */
    lastRun?: string
    lastStatus?: 'ok' | 'error'
    lastError?: string
}

export interface MegamodelEdge {
    id: string
    source: ArtifactRef
    target: ArtifactRef
    type: EdgeType
    /** 'derived' edges are inferred from artifact structure; 'user-defined' edges are explicit */
    origin: 'derived' | 'user-defined'
    /** Trigger config — only meaningful on edges that connect to transformations */
    trigger?: TriggerConfig
    label?: string
    metadata?: Record<string, unknown>
}

// ============================================================
// Megamodel — in-memory runtime state
// ============================================================

/**
 * The full megamodel: derived edges + user-defined edges.
 * Nodes are NOT stored here — they are derived from the project's artifacts.
 * Derived edges are NOT persisted — they are re-computed on every load.
 */
export interface Megamodel {
    megamodelVersion: '1.0'
    /** All edges: derived + user-defined */
    edges: MegamodelEdge[]
}

// ============================================================
// Serialized form — what ends up in the .jjodel file
// ============================================================

/**
 * What is written into the project JSON file.
 * Only user-defined edges are persisted; derived edges are re-computed at load time.
 */
export interface MegamodelSerialized {
    megamodelVersion: '1.0'
    /** Only edges with origin === 'user-defined' */
    edges: MegamodelEdge[]
}
