/**
 * JjScript Executor Utilities
 * Shared helper functions for command executors
 */

import { ExecutionContext } from '../types';
import { DUser, L, LUser, LProject, LModel, store, LPointerTargetable, LModelElement, DState, GObject } from '../../joiner';
import DockManager from '../../components/abstract/DockManager';

// ============================================
// ACTIVE ARTIFACT CACHE
// ============================================

/**
 * Module-level cache of the active artefact, populated by Jodie's listener on
 * `JjodelEvents.EDITOR_TYPE_CHANGE`. The DockManager dispatches that event with
 * `{ editorType, modelId }` whenever a tab is opened/activated.
 *
 * The cache exists because non-React contexts (JjScript service, executor) have
 * no reliable way to read the DockManager's active tab synchronously. The
 * fallback to `DockManager.dock.getLayout()` works only when the dock instance
 * is reachable via the singleton — in many flows it is not.
 */
type ActiveArtifactCache = { modelId: string; editorType: string };
let _activeArtifactCache: ActiveArtifactCache | null = null;

/**
 * Update the active artefact cache. Called by Jodie's EDITOR_TYPE_CHANGE
 * listener (and at mount-time to seed the cache from the existing fallback).
 */
export function setActiveArtifactCache(modelId: string, editorType: string): void {
    if (!modelId) return;
    _activeArtifactCache = { modelId, editorType };
}

/**
 * Resolve a cached LModel by id and isMetamodel flag. Returns null if the cache
 * is empty, the editorType doesn't match, or the model can't be resolved.
 */
function getCachedModel(expectMetamodel: boolean): LModel | null {
    if (!_activeArtifactCache) return null;
    const { editorType, modelId } = _activeArtifactCache;
    const expectedType = expectMetamodel ? 'metamodel' : 'model';
    if (editorType !== expectedType) return null;
    try {
        const m = LPointerTargetable.fromPointer(modelId) as LModel | null;
        if (m && (!!m.isMetamodel) === expectMetamodel) return m;
    } catch (e) { console.error(e); }
    return null;
}

/**
 * Get the active/selected metamodel from UI state.
 *
 * Resolution order:
 * 1. _activeArtifactCache — last EDITOR_TYPE_CHANGE event payload (most reliable)
 * 2. DockManager active tab — the metamodel/model tab the user is currently viewing
 * 3. _lastSelected.modelElement — the last clicked element's metamodel
 * 4. null (caller decides fallback)
 */
export function getActiveMetamodel(): LModel | null {
    try {
        // 0. Check the cache first — populated by EDITOR_TYPE_CHANGE listener.
        const cached = getCachedModel(/* expectMetamodel */ true);
        if (cached) return cached;

        // 1. Use DockManager active tab ID (most reliable indicator of which metamodel is "active")
        const activeTabModel = getActiveTabMetamodel();
        if (activeTabModel) return activeTabModel;

        // 2. Fall back to _lastSelected.modelElement
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
 * Get the metamodel corresponding to the currently active DockManager tab.
 * Tab IDs in the dock layout correspond to model/metamodel pointer IDs.
 */
function getActiveTabMetamodel(): LModel | null {
    try {
        if (!DockManager.dock) return null;

        const layout = DockManager.dock.getLayout();
        const modelsPanel = layout?.dockbox?.children?.[0];
        const tabs = (modelsPanel as any)?.tabs || [];
        const activeId: string = (modelsPanel as any)?.activeId || tabs[0]?.id;
        if (!activeId) return null;

        // Resolve the active tab ID to an LModel
        const model = LPointerTargetable.fromPointer(activeId) as LModel | null;
        if (model && model.isMetamodel) {
            return model;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Returns the active M1 model (DModel with isMetamodel === false) from the
 * currently focused dock tab. Returns null if the active tab is a metamodel
 * or no model tab is active.
 *
 * Resolution order (mirrors getActiveMetamodel):
 * 0. _activeArtifactCache — last EDITOR_TYPE_CHANGE event payload
 * 1. DockManager active tab — if it's a non-metamodel DModel
 * 2. _lastSelected.modelElement — walk to its owning DModel if non-metamodel
 * 3. null
 */
export function getActiveModel(): LModel | null {
    try {
        // 0. Check the cache first — populated by EDITOR_TYPE_CHANGE listener.
        const cached = getCachedModel(/* expectMetamodel */ false);
        if (cached) return cached;

        // 1. DockManager active tab
        if (DockManager.dock) {
            const layout = DockManager.dock.getLayout();
            const modelsPanel = layout?.dockbox?.children?.[0];
            const tabs = (modelsPanel as any)?.tabs || [];
            const activeId: string = (modelsPanel as any)?.activeId || tabs[0]?.id;
            if (activeId) {
                const model = LPointerTargetable.fromPointer(activeId) as LModel | null;
                if (model && !model.isMetamodel) {
                    return model;
                }
            }
        }

        // 2. Fall back to _lastSelected.modelElement
        const state: DState & GObject = store.getState();
        const selected = state._lastSelected?.modelElement;
        if (selected) {
            const me = LPointerTargetable.fromPointer(selected) as LModelElement;
            if (me) {
                const model = me.model;
                if (model && !model.isMetamodel) {
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
 * Returns 'M1' if the active editor tab contains a model (instance level),
 * 'M2' if it contains a metamodel. Defaults to 'M2' on ambiguity.
 *
 * Cache-aware: reads `_activeArtifactCache.editorType` first to avoid the
 * round-trip through DockManager / _lastSelected when the cache is fresh.
 */
export function getActiveLevel(): 'M1' | 'M2' {
    if (_activeArtifactCache?.editorType === 'model') return 'M1';
    if (_activeArtifactCache?.editorType === 'metamodel') return 'M2';
    // Fallback for cold cache (e.g., before any EDITOR_TYPE_CHANGE has fired)
    return getActiveModel() !== null ? 'M1' : 'M2';
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
 *
 * @param context — optional execution context. When level === 'M1', the parent
 *   is resolved as the active instance DModel (not a metamodel package).
 */
export function getDefaultParent(project: LProject, elementType: string, context?: ExecutionContext): any {
    // M1: default parent is the active instance model (DModel where isMetamodel === false)
    if (context?.level === 'M1') {
        if (context.modelId) {
            const models = (project as any).models || [];
            const model = models.find(
                (m: LModel) => m.id === context.modelId && !m.isMetamodel
            );
            if (model) return model;
        }
        return getActiveModel();
    }

    // M2: existing logic unchanged
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
