/**
 * canvasSelection — a fragment's model element selected on its model's canvas, from the generator tab (slice G3,
 * P-2026-10-24-0003; R-GEN-14, R-GEN-41).
 *
 * The 3.2 panel lived inside React Flow and read its nodes with `useReactFlow` (CodePanel.tsx `selectOnCanvas`). The
 * tab is a dock tab of its own: it reads the ids the model's canvas draws from that editor's pane in the DOM
 * (`.react-flow__node[data-id]`, `.react-flow__edge[data-id]`), and picks as the panel picked: the element's vertex
 * (React Flow ids are DVertex ids whose `model` is the element), else the edge that stands for it, whose source vertex
 * is selected and the edge outlined by the caller (R-GEN-14). The model's tab is opened, or brought forward, first
 * (`DockManager.open2`), so a click from a tab launched on a metamodel canvas, where the element is not drawn, still
 * lands on the model's canvas; the selection is the editor's own `SELECT_NODE` event.
 *
 * Beside the canvas (P-2026-10-24-1515): the generator tab is docked in a split to the right of the canvas's panel,
 * and a click that brings a canvas forward in the generator tab's own panel moves the tab to such a split first, so
 * the code stays on screen. rc-dock's public API only (`find`, `dockMove`, `getLayout`); no change to DockManager.
 */

import type { BoxData, DockLayout, LayoutData, PanelData, TabData } from 'rc-dock';
import { LPointerTargetable } from '../../joiner';
import DockManager from '../../components/abstract/DockManager';
import { JjodelEvents } from '../../events/registry';
import { pickOnCanvas } from './codeOrigins';
import { generatorTabId } from './generatorTabs';
import type { CanvasPick } from './codeOrigins';

type Lookup = Record<string, any>;

/** The dock pane of a model's editor. */
export function modelPane(modelId: string): Element | null {
    return document.querySelector(`[role="tabpanel"][aria-labelledby$="-tab-${CSS.escape(modelId)}"]`);
}

const idsIn = (pane: Element | null, selector: string): string[] =>
    pane ? [...pane.querySelectorAll(selector)].map(e => e.getAttribute('data-id') ?? '').filter(Boolean) : [];

/** The share of the split width the generator tab takes beside a canvas. */
export const BESIDE_SHARE = 0.45;

/** The panel that holds the docked tab `id`, null when no such tab is docked. */
export function panelOf(dock: DockLayout, id: string): PanelData | null {
    const found = dock.find(id) as TabData | PanelData | BoxData | undefined;
    return found && 'content' in found ? found.parent ?? null : null;
}

/** The test of a dock tab id for the tabs of a metamodel's generators (generatorTabs.ts `generatorTabId`). */
export function generatorTabsOf(metamodelId: string): (tabId: string) => boolean {
    const first = generatorTabId(metamodelId);
    return tabId => tabId === first || tabId.startsWith(`${first}_`);
}

/** The panel of the first docked tab whose id passes `test`, null when none. */
export function findPanel(dock: DockLayout, test: (tabId: string) => boolean): PanelData | null {
    const layout: LayoutData = dock.getLayout();
    const walk = (node: BoxData | PanelData | undefined): PanelData | null => {
        if (!node) return null;
        if ('tabs' in node) return node.tabs.some(t => t.id !== undefined && test(t.id)) ? node : null;
        for (const child of node.children ?? []) {
            const hit = walk(child);
            if (hit) return hit;
        }
        return null;
    };
    return walk(layout.dockbox) ?? walk(layout.floatbox) ?? walk(layout.windowbox) ?? walk(layout.maxbox);
}

/**
 * Docks `tab` in a split to the right of the panel that holds the tab `besideId`, and gives it `BESIDE_SHARE` of the
 * two panels' width. rc-dock gives the new panel the target's size; sizes are flex weights, set on the new layout
 * before React renders it. False when `besideId` is not docked.
 */
export function dockBeside(dock: DockLayout, tab: TabData, besideId: string): boolean {
    const target = panelOf(dock, besideId);
    if (!target || tab.id === undefined) return false;
    dock.dockMove(tab, target, 'right');
    const left = panelOf(dock, besideId);
    const right = panelOf(dock, tab.id);
    if (left && right && left !== right && left.parent === right.parent) {
        const total = (left.size ?? 200) + (right.size ?? 200);
        left.size = total * (1 - BESIDE_SHARE);
        right.size = total * BESIDE_SHARE;
    }
    return true;
}

/**
 * Moves the tab `id` out of the panel of the tab `canvasId` when they share it: to the panel of another tab that
 * passes `siblings` (the metamodel's other generator tabs) when one is docked elsewhere, else to a right split. True
 * when it moved.
 */
export function keepBeside(dock: DockLayout, id: string, canvasId: string, siblings: (tabId: string) => boolean = () => false): boolean {
    const panel = panelOf(dock, id);
    if (!panel || panel !== panelOf(dock, canvasId)) return false;
    const tab = dock.find(id) as TabData;
    const others = findPanel(dock, tabId => tabId !== id && siblings(tabId) && panelOf(dock, tabId) !== panel);
    if (others) {
        dock.dockMove(tab, others, 'middle');
        return true;
    }
    return dockBeside(dock, tab, canvasId);
}

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Opens, or brings forward, the model's tab, waits for its canvas (up to `waitMs`), and selects the element there.
 * The generator tab `keepVisible` (the one the click came from) is moved out of the canvas's panel first when the
 * canvas came forward there (`keepBeside`). Resolves to the pick, `null` when the canvas does not draw the element.
 */
export async function selectOnModelCanvas(
    lookup: Lookup, modelId: string, elementId: string, waitMs = 4000, keepVisible: { tabId: string; metamodelId: string } | null = null,
): Promise<CanvasPick | null> {
    try {
        await DockManager.open2(LPointerTargetable.fromPointer(modelId as any) as any);
    } catch (error) {
        console.warn('[canvasSelection] the model tab could not be opened', modelId, error);
    }
    if (keepVisible !== null && DockManager.dock) keepBeside(DockManager.dock, keepVisible.tabId, modelId, generatorTabsOf(keepVisible.metamodelId));
    const end = Date.now() + waitMs;
    let pick: CanvasPick | null = null;
    for (;;) {
        const pane = modelPane(modelId);
        const nodes = idsIn(pane, '.react-flow__node[data-id]');
        pick = pickOnCanvas(lookup, nodes, idsIn(pane, '.react-flow__edge[data-id]'), elementId);
        if (pick || (nodes.length > 0 && Date.now() > end - waitMs + 600) || Date.now() > end) break;
        await pause(100);
    }
    if (pick?.nodeId) window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, { detail: { nodeId: pick.nodeId, modelId } }));
    return pick;
}
