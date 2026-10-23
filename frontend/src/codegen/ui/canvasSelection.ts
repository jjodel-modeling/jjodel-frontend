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
 */

import { LPointerTargetable } from '../../joiner';
import DockManager from '../../components/abstract/DockManager';
import { JjodelEvents } from '../../events/registry';
import { pickOnCanvas } from './codeOrigins';
import type { CanvasPick } from './codeOrigins';

type Lookup = Record<string, any>;

/** The dock pane of a model's editor. */
export function modelPane(modelId: string): Element | null {
    return document.querySelector(`[role="tabpanel"][aria-labelledby$="-tab-${CSS.escape(modelId)}"]`);
}

const idsIn = (pane: Element | null, selector: string): string[] =>
    pane ? [...pane.querySelectorAll(selector)].map(e => e.getAttribute('data-id') ?? '').filter(Boolean) : [];

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Opens, or brings forward, the model's tab, waits for its canvas (up to `waitMs`), and selects the element there.
 * Resolves to the pick, `null` when the canvas does not draw the element.
 */
export async function selectOnModelCanvas(lookup: Lookup, modelId: string, elementId: string, waitMs = 4000): Promise<CanvasPick | null> {
    try {
        await DockManager.open2(LPointerTargetable.fromPointer(modelId as any) as any);
    } catch (error) {
        console.warn('[canvasSelection] the model tab could not be opened', modelId, error);
    }
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
