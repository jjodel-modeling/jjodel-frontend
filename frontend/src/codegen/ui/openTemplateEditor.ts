/**
 * openTemplateEditor — opens the Template Editor tab of a metamodel (slice S2, P-2026-10-23-1945; R-GEN-20,
 * R-GEN-23).
 *
 * One dock tab per metamodel, `codegen_tpl_<metamodelId>`, placed as `DockManager.openTransformation` places the JjTL
 * tab (the first panel of the dock box, group `models`), through `DockManager.dock`, with no change to DockManager.
 * `cached: true`: rc-dock keeps the component, and its drafts, while the tab is hidden. An open tab is activated, and
 * the template asked for is selected in it. Refused in consumer mode, as `DockManager.open2` refuses a metamodel.
 *
 * Slice G3 (P-2026-10-24-0003; R-GEN-36, R-GEN-40): one tab per generator, `generatorTabId` (generatorTabs.ts), the
 * default's id unchanged; the optional generator id picks it, the default when absent. The optional model is chosen
 * in the tab's right pane, also when the tab is already open. The generator opened is remembered as the metamodel's
 * last used, for the pill.
 *
 * Reached only from the Code panel's lazy chunk (scripts/gates/check-codegen-lazy.ts).
 */

import React from 'react';
import type { TabData } from 'rc-dock';
import DockManager from '../../components/abstract/DockManager';
import { isConsumerMode } from '../../components/environment/consumerMode';
import TemplateEditorTab, { TemplateTabTitle, chooseModelInTemplateTab, selectInTemplateTab, templateTabId } from './TemplateEditorTab';
import { rememberGenerator } from './generatorTabs';
import { DEFAULT_GENERATOR_ID } from '../engine/generatorCodec';

/** Opens, or brings forward, the generator's tab on `template` (and `model`); false when refused or not possible. */
export function openTemplateEditor(
    metamodelId: string,
    metamodelName: string,
    template: string | null = null,
    generatorId: string = DEFAULT_GENERATOR_ID,
    model?: string,
): boolean {
    if (isConsumerMode()) {
        console.warn('[openTemplateEditor] the Template Editor is hidden in consumer mode', metamodelId);
        return false;
    }
    const dock = DockManager.dock;
    if (!dock || !metamodelId) return false;
    const id = templateTabId(metamodelId, generatorId);
    rememberGenerator(metamodelId, generatorId);

    if (dock.find(id)) {
        dock.updateTab(id, null, true);
        selectInTemplateTab(metamodelId, template, generatorId);
        if (model) chooseModelInTemplateTab(metamodelId, model, generatorId);
        return true;
    }

    const target = dock.getLayout()?.dockbox?.children?.[0];
    if (!target) return false;
    const tab: TabData = {
        id,
        group: 'models',
        closable: false,
        cached: true,
        title: React.createElement(TemplateTabTitle, { metamodelId, name: metamodelName, generatorId }),
        content: React.createElement(TemplateEditorTab, { metamodelId, initial: template, generatorId, model: model ?? null }),
    };
    dock.dockMove(tab, target, 'middle');
    return true;
}
