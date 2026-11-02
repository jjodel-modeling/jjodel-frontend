/**
 * openTextualTab — opens the read-only Text tab of a model (R-TXT-23, slice T2b, P-2026-11-02-0040).
 *
 * The target of the toolbar picker's dynamic import (Toolbar.tsx `handleViewpointChange`, the textual entry of
 * dataManagerOption.ts): the one way into this directory from the eager bundle (R-GEN-2,
 * scripts/gates/check-codegen-lazy.ts). One tab per model, `txt_<modelId>`, opened through `DockManager.open` as the
 * manager is, so a second pick activates the open tab instead of mounting another; no change to DockManager or
 * TabDataMaker. The title carries `data-type="textual"`, not `model`: Dock.tsx `handleLayoutChange` reads that
 * attribute, and `model` would announce the tab's id as a model's.
 */

import type { TabData } from 'rc-dock';
import DockManager from '../../../components/abstract/DockManager';
import { store } from '../../../joiner';
import TextualTab from './TextualTab';

/** The prefix of a Text tab's id. */
export const TEXTUAL_TAB_PREFIX = 'txt_';

export const textualTabId = (modelId: string): string => `${TEXTUAL_TAB_PREFIX}${modelId}`;

/** Opens, or brings forward, the Text tab of `modelId`, titled with `label`; false when the dock or the model is missing. */
export function openTextualTab(modelId: string, label: string): boolean {
    if (!DockManager.dock || !modelId) return false;
    const model = (store.getState() as any)?.idlookup?.[modelId];
    if (!model) return false;
    const id = textualTabId(modelId);
    const name = typeof model.name === 'string' && model.name ? model.name : 'Unnamed';
    const tab: TabData = {
        id,
        group: 'models',
        closable: true,
        title: <div className="tab-title active-on-mouseenter" data-type="textual">{`${name} · ${label}`}</div>,
        content: <TextualTab key={id} modelId={modelId} label={label} tabId={id} />,
    };
    void DockManager.open('models', tab);
    return true;
}
