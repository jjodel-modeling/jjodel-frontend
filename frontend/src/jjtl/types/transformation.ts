/**
 * JjTL Transformation Type
 * Represents a saved transformation in a project
 */

import { TransformationAST } from './ast';

/**
 * Transformation data stored in project
 */
export interface JjtlTransformation {
    id: string;
    name: string;
    description?: string;
    sourceMetamodelId?: string;
    sourceMetamodelName?: string;
    targetMetamodelId?: string;
    targetMetamodelName?: string;
    code: string;
    createdAt: number;
    modifiedAt: number;
    // Cached AST (regenerated on parse)
    ast?: TransformationAST | null;
    // Validation status
    isValid?: boolean;
    errorCount?: number;
}

/**
 * Form data for creating/editing a transformation
 */
export interface TransformationFormData {
    name: string;
    description: string;
    sourceMetamodelId: string;
    targetMetamodelId: string;
}

/**
 * Create a new empty transformation
 */
export function createTransformation(
    name: string,
    sourceMetamodelId?: string,
    sourceMetamodelName?: string,
    targetMetamodelId?: string,
    targetMetamodelName?: string,
    description?: string
): JjtlTransformation {
    const now = Date.now();
    const safeName = name || 'NewTransformation';
    const safeSourceName = sourceMetamodelName || 'SourceMM';
    const safeTargetName = targetMetamodelName || 'TargetMM';

    return {
        id: `transformation-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name: safeName,
        description: description || '',
        sourceMetamodelId,
        sourceMetamodelName: safeSourceName,
        targetMetamodelId,
        targetMetamodelName: safeTargetName,
        code: generateDefaultCode(safeName, safeSourceName, safeTargetName),
        createdAt: now,
        modifiedAt: now,
        isValid: true,
        errorCount: 0,
    };
}

/**
 * Generate default JjTL code template
 */
function generateDefaultCode(
    name: string,
    sourceMM: string,
    targetMM: string
): string {
    return `transformation ${name.replace(/\s+/g, '')}

from ${sourceMM.replace(/\s+/g, '')}
to   ${targetMM.replace(/\s+/g, '')}

# Define your class mappings here
# Example:
# SourceClass -> TargetClass {
#     sourceAttr -> targetAttr
# }
`;
}

/**
 * Generate unique transformation name
 */
export function generateUniqueName(
    baseName: string,
    existingNames: string[]
): string {
    if (!existingNames.includes(baseName)) {
        return baseName;
    }

    let counter = 1;
    let newName = `${baseName} ${counter}`;
    while (existingNames.includes(newName)) {
        counter++;
        newName = `${baseName} ${counter}`;
    }
    return newName;
}
