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
        if (!DockManager.dock) return;

        const tabId = `doc_${project.id}`;

        // Check if tab already exists
        const existingTab = DockManager.dock.find(tabId);
        if (existingTab) {
            DockManager.dock.updateTab(tabId, null as any, true);
            return;
        }

        // Create new Documentation tab
        // Uses data-type attribute for CSS-based badge styling (like Metamodel/Model tabs)
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

        DockManager.dock.dockMove(tab, DockManager.dock.getLayout().dockbox.children[0], 'middle');
    }

}

export default DockManager;
