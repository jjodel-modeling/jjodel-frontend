/**
 * JjScript Executor Utilities
 * Shared helper functions for command executors
 */

import { ExecutionContext } from '../types';
import { DUser, L, LUser, LProject, LModel, store, LPointerTargetable, LModelElement, DState, GObject } from '../../joiner';

/**
 * Get the active/selected metamodel from UI state
 * Uses the _lastSelected state to determine which metamodel is currently being worked on
 */
export function getActiveMetamodel(): LModel | null {
    try {
        const state: DState & GObject = store.getState();
        const selected = state._lastSelected?.modelElement;

        if (selected) {
            const me = LPointerTargetable.fromPointer(selected) as LModelElement;
            if (me) {
                const model = me.model;
                if (model && model.isMetamodel) {
                    return model;
                }
            }
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Get the current project
 * Uses the same pattern as Jodie.tsx to access the user's project
 */
export function getProject(context: ExecutionContext): LProject | null {
    try {
        // Try to get from context projectId
        if (context.projectId) {
            const state = store.getState();
            const idlookup = (state as any).idlookup || {};
            const projectData = idlookup[context.projectId];
            if (projectData) {
                return L.fromPointer(context.projectId) as LProject;
            }
        }

        // Try to get current project from user (same pattern as Jodie.tsx)
        const user: LUser = L.fromPointer(DUser.current);
        if (user?.project) {
            return user.project as LProject;
        }

        return null;
    } catch (err) {
        console.warn('[JjScript] Could not get project:', err);
        return null;
    }
}

/**
 * Get the current user
 */
export function getCurrentUser(): LUser | null {
    try {
        return L.fromPointer(DUser.current) as LUser;
    } catch {
        return null;
    }
}

/**
 * Get the default parent for a new element based on type
 * Prioritizes the currently selected metamodel in the UI
 */
export function getDefaultParent(project: LProject, elementType: string): any {
    // For classes, enums, packages: use selected metamodel or first available
    if (['class', 'abstract class', 'interface', 'enum', 'enumeration', 'package'].includes(elementType)) {
        const metamodels = (project as any).metamodels || [];

        if (metamodels.length === 0) {
            return null;
        }

        // Try to use the active/selected metamodel first
        const activeMetamodel = getActiveMetamodel();
        let targetMetamodel = activeMetamodel;

        // If no active metamodel or it's not in this project, use first metamodel
        if (!targetMetamodel) {
            targetMetamodel = metamodels[0];
        } else {
            // Verify the active metamodel belongs to this project
            const isInProject = metamodels.some((mm: any) => mm.id === targetMetamodel?.id);
            if (!isInProject) {
                targetMetamodel = metamodels[0];
            }
        }

        // Get the root package of the target metamodel
        const packages = targetMetamodel?.packages || [];
        if (packages.length > 0) {
            return packages[0];
        }
        return targetMetamodel;
    }
    return null;
}

/**
 * Check if an element type needs a parent
 */
export function needsParent(elementType: string): boolean {
    return ['attribute', 'reference', 'operation', 'parameter', 'literal'].includes(elementType);
}

/**
 * Get the target metamodel from context.
 * Uses targetMetamodelId if explicitly set, otherwise falls back to the active metamodel.
 *
 * @param context - The execution context
 * @param project - The current project
 * @returns The target metamodel or null
 */
export function getTargetMetamodel(context: ExecutionContext, project: LProject): LModel | null {
    const metamodels = (project as any).metamodels || [];

    // If explicitly specified, use that
    if (context.targetMetamodelId) {
        const target = metamodels.find((mm: LModel) => mm.id === context.targetMetamodelId);
        if (target) return target;
    }

    // Otherwise use the active/selected metamodel
    const active = getActiveMetamodel();
    if (active) {
        // Verify it belongs to this project
        const isInProject = metamodels.some((mm: LModel) => mm.id === active.id);
        if (isInProject) return active;
    }

    // Fall back to first metamodel
    return metamodels.length > 0 ? metamodels[0] : null;
}
