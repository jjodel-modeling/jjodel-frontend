/**
 * JjScript Executor Utilities
 * Shared helper functions for command executors
 */

import { ExecutionContext } from '../types';
import { DUser, L, LUser, LProject, store } from '../../joiner';

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
 */
export function getDefaultParent(project: LProject, elementType: string): any {
    // For classes, enums, packages: return first metamodel's root package
    if (['class', 'abstract class', 'interface', 'enum', 'enumeration', 'package'].includes(elementType)) {
        const metamodels = (project as any).metamodels || [];
        if (metamodels.length > 0) {
            const mm = metamodels[0];
            const packages = mm.packages || [];
            if (packages.length > 0) {
                return packages[0];
            }
            return mm;
        }
    }
    return null;
}

/**
 * Check if an element type needs a parent
 */
export function needsParent(elementType: string): boolean {
    return ['attribute', 'reference', 'operation', 'parameter', 'literal'].includes(elementType);
}
