/**
 * JjodieAPI Implementation
 * Real integration with Jjodel's Redux store, models, and JjScript executor
 */

import { JjodieAPI } from './useMetamodelGeneration';
import {DUser, DProject, DModel, L, LUser, LProject, LModel, SetFieldAction, Pointer} from '../joiner';
import { executeCommand as jjScriptExecuteCommand } from '../jjscript/executor/executor';

// Snapshot storage for undo functionality
const snapshots = new Map<string, unknown>();

function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createJjodieAPI(): JjodieAPI {
    return {
        // isn't identical to luser.project with logs added? i think it should be removed
        async getOpenProject() {
            try {
                const user: LUser = L.fromPointer(DUser.current);
                if (user?.project) {
                    const project = user.project as LProject;
                    if (project?.id) {
                        // console.log('[JjodieAPI] Open project found:', project.id, project.name);
                        return { id: project.id, name: project.name || 'Unnamed Project' };
                    }
                }
            } catch (err) {
                console.warn('[JjodieAPI] getOpenProject error:', err);
            }
            // console.log('[JjodieAPI] No project open');
            return null;
        },

        async getOpenMetamodels() {
            try {
                const user: LUser = L.fromPointer(DUser.current);
                if (user?.project) {
                    const project = user.project as LProject;
                    // Check metamodels first (M2), then models (M1)
                    const metamodels = project?.metamodels || project?.models || [];
                    if (metamodels.length > 0) {
                        // console.log('[JjodieAPI] Open metamodels:', metamodels.length);
                        return (metamodels as LModel[]).map(m => ({
                            id: m.id,
                            name: m.name || 'Unnamed',
                            elementCount: m.classes?.length || 0
                        }));
                    }
                }
            } catch (err) {
                console.warn('[JjodieAPI] getOpenMetamodels error:', err);
            }
            // console.log('[JjodieAPI] No metamodels found');
            return [];
        },

        async createProject(name: string) {
            try {
                const user: LUser = L.fromPointer(DUser.current);
                /*const otherProjects = user?.projects || [];

                // Create new project using DProject.new
                // DProject.new(type, name, state, m2, m1, id, otherProjects)
                const newProject = DProject.new(
                    'private',           // type
                    name,                // name
                    '',                  // state
                    [],                  // metamodels (m2)
                    [],                  // models (m1)
                    undefined,           // id (auto-generated)
                    otherProjects        // for auto-naming conflict resolution
                );*/
                const newProject = DProject.new2({father: user.id, name}, (d)=>{ d.type = 'private'; })

                // Add to user's projects
                // damiano: it is already inserted by DProject.new, this makes a duplicate reference.
                // SetFieldAction.new(DUser.current, 'projects', newProject.id, '+=', true);

                // console.log('[JjodieAPI] Project created:', newProject.id, newProject.name);
                return { id: newProject.id };
            } catch (err) {
                console.error('[JjodieAPI] createProject error:', err);
                throw err;
            }
        },

        async createMetamodel(projectId: Pointer<DProject>, name: string) {
            try {
                // Create new metamodel using DModel.new3 with father
                // DModel.new3({ name, father, ... }, callback, persist)
                const newModel = DModel.new3(
                    { name, father: projectId },
                    undefined,
                    true
                );

                // Add to project's metamodels
                SetFieldAction.new(projectId, 'metamodels', newModel.id, '+=', true);

                // console.log('[JjodieAPI] Metamodel created:', newModel.id, newModel.name);
                return { id: newModel.id };
            } catch (err) {
                console.error('[JjodieAPI] createMetamodel error:', err);
                throw err;
            }
        },

        async openMetamodel(id: string) {
            /*try {
                const model = L.fromPointer(id) as LModel;
                if (model) {
                    // Set as current model for the user
                    SetFieldAction.new(DUser.current, 'currentModel', id, undefined, true);
                    // console.log('[JjodieAPI] Metamodel opened:', id, model.name);
                }
            } catch (err) {
                console.warn('[JjodieAPI] openMetamodel error:', err);
            }*/
        },

        async saveSnapshot() {
            const id = generateId();
            try {
                // For now, save a simple marker - full undo would require
                // deep cloning the model state
                const user: LUser = L.fromPointer(DUser.current);
                const project = user?.project as LProject;
                const metamodels = project?.metamodels || [];

                // Store minimal state for undo reference
                snapshots.set(id, {
                    timestamp: Date.now(),
                    projectId: project?.id,
                    metamodelIds: metamodels.map((m: LModel) => m.id)
                });

                // console.log('[JjodieAPI] Snapshot saved:', id);
            } catch (err) {
                console.error('[JjodieAPI] saveSnapshot error:', err);
            }
            return id;
        },

        async restoreSnapshot(id: string) {
            const snapshot = snapshots.get(id);
            if (!snapshot) throw new Error('Snapshot not found');

            // Note: Full undo requires implementing state restoration
            // For now, we just clean up the snapshot
            // console.log('[JjodieAPI] Snapshot restore requested:', id);
            snapshots.delete(id);
        },

        async discardSnapshot(id: string) {
            snapshots.delete(id);
            // console.log('[JjodieAPI] Snapshot discarded:', id);
        },

        async executeCommand(command: string) {
            try {
                // console.log('[JjodieAPI] executeCommand:', command);

                // Get current project context
                const user: LUser = L.fromPointer(DUser.current);
                const project = user?.project as LProject;
                const projectId = project?.id;

                if (!projectId) {
                    return {
                        success: false,
                        message: 'No active project'
                    };
                }

                // Get current model ID if available
                const metamodels = project?.metamodels || [];
                const modelId = metamodels.length > 0 ? (metamodels[0] as LModel).id : undefined;

                // Execute via JjScript executor
                const result = await jjScriptExecuteCommand(command, projectId, modelId);

                if (result.success) {
                    // console.log('[JjodieAPI] Command succeeded:', result.message);
                    return {
                        success: true,
                        message: result.message || 'Command executed successfully'
                    };
                } else {
                    const errorMsg = result.errors?.[0]?.message || result.message || 'Unknown error';
                    console.error('[JjodieAPI] Command failed:', errorMsg);
                    return {
                        success: false,
                        message: errorMsg
                    };
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                console.error('[JjodieAPI] executeCommand error:', errorMsg);
                return {
                    success: false,
                    message: errorMsg
                };
            }
        },
    };
}

let instance: JjodieAPI | null = null;
export function getJjodieAPI(): JjodieAPI {
    if (!instance) instance = createJjodieAPI();
    return instance;
}
