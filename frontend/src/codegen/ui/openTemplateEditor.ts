/**
 * openTemplateEditor — opens the Template Editor tab of a metamodel (slice S2, P-2026-10-23-1945; R-GEN-20,
 * R-GEN-23).
 *
 * One dock tab per metamodel, `codegen_tpl_<metamodelId>`, placed as `DockManager.openTransformation` places the JjTL
 * tab (the first panel of the dock box, group `models`), through `DockManager.dock`, with no change to DockManager.
 * `cached: true`: rc-dock keeps the component, and its drafts, while the tab is hidden. An open tab is activated, and
 * the template asked for is selected in it. Refused in consumer mode, as `DockManager.open2` refuses a metamodel.
 *
 * Reached only from the Code panel's lazy chunk (scripts/gates/check-codegen-lazy.ts).
 */

import React from 'react';
import type { TabData } from 'rc-dock';
import DockManager from '../../components/abstract/DockManager';
import { isConsumerMode } from '../../components/environment/consumerMode';
import TemplateEditorTab, { TemplateTabTitle, selectInTemplateTab, templateTabId } from './TemplateEditorTab';

/** Opens, or brings forward, the metamodel's Template Editor on `template`; false when refused or not possible. */
export function openTemplateEditor(metamodelId: string, metamodelName: string, template: string | null = null): boolean {
    if (isConsumerMode()) {
        console.warn('[openTemplateEditor] the Template Editor is hidden in consumer mode', metamodelId);
        return false;
    }
    const dock = DockManager.dock;
    if (!dock || !metamodelId) return false;
    const id = templateTabId(metamodelId);

    if (dock.find(id)) {
        dock.updateTab(id, null, true);
        selectInTemplateTab(metamodelId, template);
        return true;
    }

    const target = dock.getLayout()?.dockbox?.children?.[0];
    if (!target) return false;
    const tab: TabData = {
        id,
        group: 'models',
        closable: false,
        cached: true,
        title: React.createElement(TemplateTabTitle, { metamodelId, name: metamodelName }),
        content: React.createElement(TemplateEditorTab, { metamodelId, initial: template }),
    };
    dock.dockMove(tab, target, 'middle');
    return true;
}
