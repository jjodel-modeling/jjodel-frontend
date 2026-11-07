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
 * Beside the canvas (P-2026-10-24-1515): a new tab goes to the panel of an open tab of the same metamodel's
 * generators, else to a split right of the panel that holds the model's (or metamodel's) editor tab, about 45 % of
 * the width (canvasSelection.ts `dockBeside`), else to the first panel as before.
 *
 * Every opening, of a new tab or of one brought forward, collapses the Properties/Tree rail once the tab is beside the
 * canvas (P-2026-10-25-0925, TemplateEditorTab.tsx `collapseRailOnOpen`).
 *
 * A real tab (P-2026-10-25-1045): the group is `GENERATOR_GROUP`, not `models`, so its panel shows rc-dock's tab bar
 * with the title and its close control; the canvas it docks beside may also be a docked model conforming to the
 * metamodel, and with none docked the tab goes right of the project page (generatorTabs.ts `besideTarget`), never
 * stacked over it in the first panel, whose tab bar the app bar replaces.
 *
 * In the app bar (P-2026-10-25-1200): with no canvas docked the tab joins the first panel after all, listed by the app
 * bar beside the project and model tabs (Navbar.tsx `syncTabs`), full width when selected. The app bar imports no
 * generator module, so the tab carries its title and its close (`AppBarTabHooks`), kept by rc-dock as it moves.
 *
 * One rule for placement (P-2026-10-25-1310): the canvas counts only while its panel shows a canvas
 * (canvasSelection.ts `shownCanvas`). Asked for with one shown, an open tab that shares the canvas's panel, as one
 * first opened in the app bar does, moves beside it, and a new one goes beside it; with none shown, an open tab goes
 * back to the first panel and a new one joins it, both listed by the app bar. A tab already beside is only activated.
 *
 * One tab bar (P-2026-10-25-1510): beside the canvas the app bar lists the tab too, next to the canvas tab, and the
 * panel shows its content only (TemplateEditorTab.scss).
 *
 * Reached only from the Code panel's lazy chunk and the left bar's dynamic import (scripts/gates/check-codegen-lazy.ts).
 */

import React from 'react';
import type { BoxData, PanelData, TabData } from 'rc-dock';
import DockManager from '../../components/abstract/DockManager';
import { isConsumerMode } from '../../components/environment/consumerMode';
import { store } from '../../joiner';
import TemplateEditorTab, {
    TemplateTabTitle, chooseModelInTemplateTab, collapseRailOnOpen, requestCloseTemplateTab, selectInTemplateTab, templateTabId,
} from './TemplateEditorTab';
import { GENERATOR_GROUP, besideTarget, generatorTabTitle, rememberGenerator } from './generatorTabs';
import type { AppBarTabHooks } from './generatorTabs';
import { dockBeside, findPanel, generatorTabsOf, panelOf, placeOpenTab, shownCanvas } from './canvasSelection';
import { DEFAULT_GENERATOR_ID, GEN_GENERATORS_KEY, decodeGenerators } from '../engine/generatorCodec';
import { GEN_TEMPLATES_KEY } from '../engine/templateCodec';

/** The left bar's «+ New generator» reaches the tab's creation through this module's dynamic import (R-GEN-42). */
export { createGenerator } from './TemplateEditorTab';

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
    collapseRailOnOpen();

    const docked: string[] = [];
    const walk = (node: BoxData | PanelData | undefined): void => {
        if (!node) return;
        if ('tabs' in node) node.tabs.forEach(t => { if (t.id !== undefined) docked.push(t.id); });
        else (node.children ?? []).forEach(walk);
    };
    walk(dock.getLayout()?.dockbox);
    const first = dock.getLayout()?.dockbox?.children?.[0];
    const shownFirst = first && 'tabs' in first ? first.activeId ?? first.tabs[0]?.id : undefined;
    const lookup = (store.getState() as any)?.idlookup ?? {};
    const canvas = shownCanvas(dock, besideTarget(metamodelId, model, docked, shownFirst, lookup), lookup);
    const ofMetamodel = generatorTabsOf(metamodelId);

    if (dock.find(id)) {
        placeOpenTab(dock, id, canvas, ofMetamodel);
        selectInTemplateTab(metamodelId, template, generatorId);
        if (model) chooseModelInTemplateTab(metamodelId, model, generatorId);
        return true;
    }

    const appBar: AppBarTabHooks = {
        appBarTitle: () => {
            const mm = (store.getState() as any)?.idlookup?.[metamodelId];
            if (!mm) return null;
            const key = (v: unknown) => (typeof v === 'string' ? v : v === undefined || v === null ? v : String(v));
            const generators = decodeGenerators(key(mm._state?.[GEN_TEMPLATES_KEY]), key(mm._state?.[GEN_GENERATORS_KEY])).generators;
            return generatorTabTitle(typeof mm.name === 'string' && mm.name ? mm.name : metamodelName, generators, generatorId);
        },
        requestClose: () => requestCloseTemplateTab(id),
    };
    const tab: TabData & AppBarTabHooks = {
        ...appBar,
        id,
        group: GENERATOR_GROUP,
        closable: false,
        cached: true,
        title: React.createElement(TemplateTabTitle, { metamodelId, name: metamodelName, generatorId }),
        content: React.createElement(TemplateEditorTab, { metamodelId, initial: template, generatorId, model: model ?? null }),
    };
    if (canvas !== null) {
        // The siblings' panel, unless it is the canvas's own: a new tab there would cover the canvas.
        const canvasPanel = panelOf(dock, canvas);
        const siblings = findPanel(dock, t => ofMetamodel(t) && panelOf(dock, t) !== canvasPanel);
        if (siblings) {
            dock.dockMove(tab, siblings, 'middle');
            return true;
        }
        if (dockBeside(dock, tab, canvas)) return true;
    }
    if (!first) return false;
    dock.dockMove(tab, first, 'middle');
    return true;
}
