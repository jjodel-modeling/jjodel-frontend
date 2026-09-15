/**
 * Pure source-conformance predicate for transformation execution.
 * Decides whether a model is an instance of the transformation's source metamodel.
 * Identity-first (metamodel ID) with a name fallback for legacy transformations
 * that were persisted without a sourceMetamodelId.
 */

/** Structural subset of ModelOption needed to resolve the model's metamodel identity. */
export interface SourceCompatInput {
    metamodelId?: string;
    metamodelName?: string;
    conformsTo?: string;
    metamodel?: { id?: string; name?: string } | string;
}

/** Resolve the model's metamodel ID from the various possible fields. */
export function resolveModelMetamodelId(model: SourceCompatInput): string {
    return (
        model.metamodelId
        || model.conformsTo
        || (typeof model.metamodel === 'string' ? model.metamodel : model.metamodel?.id)
        || ''
    );
}

/** Resolve the model's metamodel name from the various possible fields. */
export function resolveModelMetamodelName(model: SourceCompatInput): string {
    return (
        model.metamodelName
        || (typeof model.metamodel === 'object' ? model.metamodel?.name : '')
        || ''
    );
}

/**
 * True when `model` conforms to the transformation source metamodel.
 * - If `sourceMetamodelId` is present: match by metamodel ID only (immune to rename,
 *   duplicate-name suffixes, whitespace, and lazy name resolution).
 * - If `sourceMetamodelId` is absent (legacy transformation): fall back to name equality.
 */
export function isModelCompatibleWithSource(
    model: SourceCompatInput,
    sourceMetamodelId: string | undefined,
    sourceMetamodelName: string,
): boolean {
    const mmId = resolveModelMetamodelId(model);
    if (sourceMetamodelId) {
        return !!mmId && mmId === sourceMetamodelId;
    }
    const mmName = resolveModelMetamodelName(model);
    return !!mmName && !!sourceMetamodelName && mmName === sourceMetamodelName;
}
