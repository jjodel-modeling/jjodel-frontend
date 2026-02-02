import {DockLayout, TabData} from 'rc-dock';
import {LModel, LProject, RuntimeAccessible, U} from '../../joiner';
import TabDataMaker from "./tabs/TabDataMaker";
import {DocumentationTab} from "./tabs/DocumentationTab";
import React from 'react';

@RuntimeAccessible('DockManager')
class DockManager {
    static cname = "DockManager";
    static dock: DockLayout|null;

    static async open(group: 'models'|'editors', tab: TabData): Promise<void> {
        if(!DockManager.dock) return;
        const index = (group === 'models') ? 0 : 1;
        console.log("TabManager open()", group, tab);
        DockManager.dock.dockMove(tab, DockManager.dock.getLayout().dockbox.children[index], 'middle');
    }

    static async open2(me: LModel): Promise<void> {
        const tab = (me.isMetamodel) ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);
        await DockManager.open('models', tab);
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
            } else {
                console.warn('[DockManager] Dock layout not ready');
                U.alert('w', 'Cannot open documentation', 'The editor layout is not ready. Please try again.');
            }
        } catch (error) {
            console.error('[DockManager] Error opening documentation:', error);
            U.alert('e', 'Error', 'Failed to open documentation tab.');
        }
    }

}

export default DockManager;
