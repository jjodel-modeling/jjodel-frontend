/**
 * Editor V3 — useEditorMode: detects and manages the editor mode (M2 vs M1).
 *
 * - M2 (metamodel): editing classes, enums, packages, datatypes
 * - M1 (model): editing object instances of a metamodel
 *
 * Detection logic:
 * 1. If mode is explicitly provided → use it
 * 2. If the model has a metamodelId / instanceof → M1
 * 3. Otherwise → M2
 *
 * Also reads the metamodel's non-abstract classes for the M1 palette.
 */

import { useMemo } from 'react';
import { LPointerTargetable, store } from '../../../joiner';
import type { EditorMode } from '../types';

export interface EditorModeInfo {
    /** The resolved editor mode */
    mode: EditorMode;
    /** If M1: the metamodel ID */
    metamodelId: string | null;
    /** If M1: instantiable classes from the metamodel (non-abstract, non-interface) */
    instantiableClasses: InstantiableClass[];
}

export interface InstantiableClass {
    id: string;
    name: string;
    attributeCount: number;
    referenceCount: number;
}

/**
 * Detect editor mode and gather M1 metadata.
 */
export function useEditorMode(
    modelId: string,
    explicitMode?: EditorMode,
): EditorModeInfo {
    return useMemo(() => {
        // If explicitly set, use it
        if (explicitMode) {
            if (explicitMode === 'model') {
                return resolveM1Info(modelId);
            }
            return { mode: 'metamodel', metamodelId: null, instantiableClasses: [] };
        }

        // Auto-detect: check if model has a metamodel reference
        try {
            const lModel: any = LPointerTargetable.fromPointer(modelId);
            const metamodelRef = lModel?.instanceof ?? lModel?.metamodel ?? lModel?.__raw?.instanceof;

            if (metamodelRef) {
                const metamodelId = typeof metamodelRef === 'string' ? metamodelRef : metamodelRef?.id;
                if (metamodelId) {
                    return resolveM1Info(modelId, metamodelId);
                }
            }
        } catch {
            // Fall through to M2
        }

        return { mode: 'metamodel', metamodelId: null, instantiableClasses: [] };
    }, [modelId, explicitMode]);
}

/**
 * Resolve M1 info: find the metamodel and its instantiable classes.
 */
function resolveM1Info(modelId: string, knownMetamodelId?: string): EditorModeInfo {
    const instantiableClasses: InstantiableClass[] = [];
    let metamodelId: string | null = knownMetamodelId ?? null;

    try {
        // Find the metamodel if not provided
        if (!metamodelId) {
            const lModel: any = LPointerTargetable.fromPointer(modelId);
            const metamodelRef = lModel?.instanceof ?? lModel?.metamodel ?? lModel?.__raw?.instanceof;
            metamodelId = typeof metamodelRef === 'string' ? metamodelRef : metamodelRef?.id ?? null;
        }

        if (!metamodelId) {
            return { mode: 'model', metamodelId: null, instantiableClasses: [] };
        }

        // Read classes from the metamodel
        const lMetamodel: any = LPointerTargetable.fromPointer(metamodelId);
        const classes = lMetamodel?.classes ?? [];

        for (const cls of classes) {
            // Skip abstract and interface classes
            if (cls.abstract || cls.interface) continue;

            instantiableClasses.push({
                id: cls.id ?? '',
                name: cls.name ?? 'Unnamed',
                attributeCount: (cls.attributes ?? []).length,
                referenceCount: (cls.references ?? []).length,
            });
        }
    } catch {
        // Ignore errors — return what we have
    }

    return { mode: 'model', metamodelId, instantiableClasses };
}
