import {DockLayout, TabData} from 'rc-dock';
import {LModel, LProject, RuntimeAccessible, U} from '../../joiner';
import TabDataMaker from "./tabs/TabDataMaker";
import {DocumentationTab} from "./tabs/DocumentationTab";
import React from 'react';
import { JjtlDevelopmentEnv, ModelOption } from '../../jjtl/components';
import { JjtlTransformation, TransformationAST } from '../../jjtl/types';
import { MetamodelElement } from '../../jjtl/views/MetamodelTreeView';
import type { ExecutionResult } from '../../jjtl/executor';

@RuntimeAccessible('DockManager')
class DockManager {
    static cname = "DockManager";
    static dock: DockLayout|null;

    /**
     * Close a tab by its ID
     * @param tabId - The ID of the tab to close
     * @returns true if the tab was found and closed, false otherwise
     */
    static closeTab(tabId: string): boolean {
        if (!DockManager.dock) {
            console.warn('[DockManager] Dock not available, cannot close tab');
            return false;
        }

        try {
            const existingTab = DockManager.dock.find(tabId);
            // Check if it's a TabData (has 'content' property) or PanelData (has 'tabs' property)
            if (existingTab && ('content' in existingTab || 'tabs' in existingTab)) {
                console.log('[DockManager] Closing tab:', tabId);
                DockManager.dock.dockMove(existingTab as TabData, null, 'remove');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[DockManager] Error closing tab:', error);
            return false;
        }
    }

    /**
     * Close all tabs associated with an entity (metamodel, model, transformation, etc.)
     * This handles different tab ID patterns:
     * - Metamodel/Model: entityId directly
     * - Documentation: doc_${entityId}
     * - Transformation: jjtl_${entityId}
     *
     * @param entityId - The ID of the entity being deleted
     * @param entityType - Optional type to specify which patterns to check
     */
    static closeTabsForEntity(entityId: string, entityType?: 'metamodel' | 'model' | 'transformation' | 'documentation'): void {
        if (!DockManager.dock || !entityId) {
            return;
        }

        console.log('[DockManager] Closing tabs for entity:', { entityId, entityType });

        // Tab IDs to try closing
        const tabIds: string[] = [];

        if (!entityType || entityType === 'metamodel' || entityType === 'model') {
            // Metamodel/Model tabs use the entity ID directly
            tabIds.push(entityId);
            // Also close any documentation tab for this model
            tabIds.push(`doc_${entityId}`);
        }

        if (!entityType || entityType === 'transformation') {
            // Transformation tabs use jjtl_ prefix
            tabIds.push(`jjtl_${entityId}`);
        }

        if (entityType === 'documentation') {
            tabIds.push(`doc_${entityId}`);
        }

        // Try to close each tab
        tabIds.forEach(tabId => {
            DockManager.closeTab(tabId);
        });
    }

    static async open(group: 'models'|'editors', tab: TabData): Promise<void> {
        if(!DockManager.dock) return;
        const index = (group === 'models') ? 0 : 1;
        console.log("TabManager open()", group, tab);
        DockManager.dock.dockMove(tab, DockManager.dock.getLayout().dockbox.children[index], 'middle');
    }

    static async open2(me: LModel): Promise<void> {
        const tab = (me.isMetamodel) ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);
        await DockManager.open('models', tab);
        const editorType = me.isMetamodel ? 'metamodel' : 'model';
        window.dispatchEvent(new CustomEvent('jjodel:editor-type-change', {
            detail: { editorType }
        }));
    }

    /**
     * Open Documentation Tab in the left dock area
     */
    static openDocumentation(project: LProject, documentation?: any): void {
        console.log('[DockManager] openDocumentation called', { projectId: project?.id, dockAvailable: !!DockManager.dock });

        if (!DockManager.dock) {
            console.warn('[DockManager] Dock not available, cannot open documentation');
            U.alert('w', 'Cannot open documentation', 'Please open a metamodel or model first.');
            return;
        }

        if (!project?.id) {
            console.warn('[DockManager] No project ID provided');
            return;
        }

        const tabId = `doc_${project.id}`;

        try {
            // Check if tab already exists
            const existingTab = DockManager.dock.find(tabId);
            if (existingTab) {
                console.log('[DockManager] Activating existing documentation tab');
                DockManager.dock.updateTab(tabId, null as any, true);
                window.dispatchEvent(new CustomEvent('jjodel:editor-type-change', {
                    detail: { editorType: 'summary' }
                }));
                return;
            }

            // Create new Documentation tab
            const tab: TabData = {
                id: tabId,
                title: React.createElement('div', {
                    className: 'tab-title active-on-mouseenter',
                    'data-type': 'documentation'
                }, 'Documentation'),
                group: 'models',
                closable: true,
                content: React.createElement(DocumentationTab, { modelid: project.id })
            };

            const layout = DockManager.dock.getLayout();
            if (layout?.dockbox?.children?.[0]) {
                console.log('[DockManager] Creating new documentation tab');
                DockManager.dock.dockMove(tab, layout.dockbox.children[0], 'middle');
                window.dispatchEvent(new CustomEvent('jjodel:editor-type-change', {
                    detail: { editorType: 'summary' }
                }));
            } else {
                console.warn('[DockManager] Dock layout not ready');
                U.alert('w', 'Cannot open documentation', 'The editor layout is not ready. Please try again.');
            }
        } catch (error) {
            console.error('[DockManager] Error opening documentation:', error);
            U.alert('e', 'Error', 'Failed to open documentation tab.');
        }
    }

    /**
     * Open JjTL Transformation Editor Tab
     * @param transformation - The transformation to open
     * @param sourceMetamodel - Optional source metamodel data (MetamodelElement[])
     * @param targetMetamodel - Optional target metamodel data (MetamodelElement[])
     * @param onSave - Optional callback when code is saved
     * @param getSourceMetamodel - Optional getter for fresh source metamodel data
     * @param getTargetMetamodel - Optional getter for fresh target metamodel data
     * @param availableModels - Optional list of models available for transformation execution
     * @param existingModelNames - Optional list of existing model names (to prevent duplicates)
     * @param onExecuteTransformation - Optional callback when transformation is executed
     */
    static openTransformation(
        transformation: JjtlTransformation,
        sourceMetamodel?: MetamodelElement[],
        targetMetamodel?: MetamodelElement[],
        onSave?: (code: string) => void,
        getSourceMetamodel?: () => MetamodelElement[],
        getTargetMetamodel?: () => MetamodelElement[],
        availableModels?: ModelOption[],
        existingModelNames?: string[],
        onExecuteTransformation?: (sourceModelId: string, outputModelName: string, ast: TransformationAST) => Promise<ExecutionResult | void>
    ): void {
        console.log('[DockManager] openTransformation called', {
            transformationId: transformation?.id,
            name: transformation?.name,
            dockAvailable: !!DockManager.dock,
            hasSourceMetamodel: !!sourceMetamodel?.length,
            hasTargetMetamodel: !!targetMetamodel?.length,
            hasGetters: !!(getSourceMetamodel && getTargetMetamodel)
        });

        if (!DockManager.dock) {
            console.warn('[DockManager] Dock not available, cannot open transformation');
            U.alert('w', 'Cannot open transformation', 'Please open a metamodel or model first to initialize the editor.');
            return;
        }

        if (!transformation?.id) {
            console.warn('[DockManager] No transformation ID provided');
            return;
        }

        const tabId = `jjtl_${transformation.id}`;

        // Create tab content with current props (needed for both new and existing tabs)
        const tabContent = React.createElement(JjtlDevelopmentEnv, {
            initialCode: transformation.code,
            sourceMetamodel: sourceMetamodel || [],
            targetMetamodel: targetMetamodel || [],
            getSourceMetamodel: getSourceMetamodel,
            getTargetMetamodel: getTargetMetamodel,
            sourceMetamodelName: transformation.sourceMetamodelName || 'Source',
            targetMetamodelName: transformation.targetMetamodelName || 'Target',
            availableModels: availableModels || [],
            existingModelNames: existingModelNames || [],
            onSave: onSave,
            onCodeChange: (_code: string) => {
                // Code change tracked internally
            },
            onExecuteTransformation: onExecuteTransformation
        });

        try {
            // Check if tab already exists
            const existingTab = DockManager.dock.find(tabId);
            if (existingTab) {
                console.log('[DockManager] Updating and activating existing transformation tab');
                // CRITICAL: Update tab content with fresh callbacks to avoid stale closures
                DockManager.dock.updateTab(tabId, { content: tabContent }, true);
                window.dispatchEvent(new CustomEvent('jjodel:editor-type-change', {
                    detail: { editorType: 'transformation' }
                }));
                return;
            }

            // Create new JjTL Development Environment tab
            const tab: TabData = {
                id: tabId,
                title: React.createElement('div', {
                    className: 'tab-title active-on-mouseenter',
                    'data-type': 'transformation'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        className: 'bi bi-arrow-left-right',
                        style: { marginRight: '6px', fontSize: '12px' }
                    }),
                    transformation.name || 'Transformation'
                ]),
                group: 'models',
                closable: true,
                content: tabContent
            };

            const layout = DockManager.dock.getLayout();
            if (layout?.dockbox?.children?.[0]) {
                console.log('[DockManager] Creating new transformation tab');
                DockManager.dock.dockMove(tab, layout.dockbox.children[0], 'middle');
                window.dispatchEvent(new CustomEvent('jjodel:editor-type-change', {
                    detail: { editorType: 'transformation' }
                }));
            } else {
                console.warn('[DockManager] Dock layout not ready');
                U.alert('w', 'Cannot open transformation', 'The editor layout is not ready. Please try again.');
            }
        } catch (error) {
            console.error('[DockManager] Error opening transformation:', error);
            U.alert('e', 'Error', 'Failed to open transformation editor.');
        }
    }

}

export default DockManager;
