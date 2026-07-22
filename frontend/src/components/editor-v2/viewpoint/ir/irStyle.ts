/**
 * irStyle — per-view CSS generation and injection for IR views.
 *
 * One class `.ir-view-<viewid>` per view, injected once when the view enters
 * the active index and removed when it leaves. Dedicated <style id="ir-views-css">
 * tag; the existing injector in Dashboard.tsx (#views-css-injector-d) is not
 * touched. Conditional style parts (form, fill, border) are resolved per
 * instance and applied inline by IRNodeContent; per-view static parts would
 * live here (none emitted today).
 */

import type { NodeViewIR } from './irTypes';

const STYLE_TAG_ID = 'ir-views-css';

/** Base styles for the IR node content, shape-agnostic. Injected once. */
const BASE_CSS = `
.ir-node-content { position: relative; display: flex; flex-direction: column; min-width: 0; width: 100%; height: 100%; }
.ir-node-content .ir-label { font-size: 11px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ir-node-content .ir-label--top { order: 0; text-align: center; font-weight: 600; }
.ir-node-content .ir-label--center { order: 1; text-align: center; margin: auto 0; font-weight: 600; }
.ir-node-content .ir-label--inside { order: 2; text-align: left; padding: 0 8px; }
.ir-node-content .ir-label--bottom { order: 4; text-align: center; margin-top: auto; }
.ir-node-content .ir-badge { position: absolute; font-size: 12px; line-height: 1; z-index: 2; }
.ir-node-content .ir-badge--tl { top: 2px; left: 4px; }
.ir-node-content .ir-badge--tr { top: 2px; right: 4px; }
.ir-node-content .ir-badge--bl { bottom: 2px; left: 4px; }
.ir-node-content .ir-badge--br { bottom: 2px; right: 4px; }
.ir-node-content .ir-compartment { order: 3; border-top: 1px solid rgba(51,65,85,0.15); padding: 4px 8px; }
.ir-node-content .ir-compartment--no-separator { border-top: none; }
.ir-node-content .ir-compartment .ir-row { font-size: 11px; line-height: 1.4; display: flex; gap: 4px; min-width: 0; }
.ir-node-content .ir-compartment .ir-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Box painting for IR nodes lives on .ir-node-content (Fase B): authored
   border/fill are applied inline by IRNodeContent, shape radius via
   ir-shape--<form> here. The base .mm-node box is neutralized for IR nodes only
   (bridge below, scoped by :has(> .ir-node-content) — native nodes lack that
   child) so a single element paints and clips. border-color: transparent (not
   border: none) keeps the 1px geometry and avoids layout shift. The explicit
   .selected/.drop-target neutralizers outrank EditorV2.scss (0,2,0) by
   specificity. Box values replicate the .mm-node base with the same tokens. */
.mm-node:has(> .ir-node-content) { background: transparent; border-color: transparent; box-shadow: none; }
.mm-node.selected:has(> .ir-node-content),
.mm-node.drop-target:has(> .ir-node-content) { border-color: transparent; box-shadow: none; }
.ir-node-content { box-sizing: border-box; background: var(--node-bg); border: 1px solid var(--border-default); border-radius: 4px; box-shadow: 0 1px 3px var(--node-shadow), 0 4px 12px var(--node-shadow-deep, rgba(0, 0, 0, 0.08)); overflow: hidden; }
.ir-node-content.ir-shape--rounded { border-radius: 10px; }
.ir-node-content.ir-shape--ellipse { border-radius: 50%; justify-content: center; }
.mm-node.selected > .ir-node-content { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.mm-node.drop-target > .ir-node-content { outline: 2px solid var(--color-accent); }
.ir-hull { border: 1.5px dashed rgba(51,65,85,0.45); border-radius: 12px; background: rgba(51,65,85,0.03); }
.ir-hull__header { display: flex; align-items: center; justify-content: space-between; padding: 0 8px; font-size: 11px; font-weight: 600; color: #334155; }
.ir-hull__toggle { border: none; background: transparent; cursor: pointer; font-size: 11px; color: #334155; padding: 2px 4px; line-height: 1; }
.ir-hull__toggle:hover { color: #0ea5e9; }
.ir-collapse-chip { display: inline-flex; align-items: center; gap: 4px; border: none; background: rgba(51,65,85,0.08); border-radius: 8px; cursor: pointer; font-size: 10px; color: #334155; padding: 2px 6px; margin-left: 6px; line-height: 1.4; }
.ir-collapse-chip:hover { background: rgba(14,165,233,0.12); }
.ir-node-content .ir-label__input, .ir-node-content .ir-row__input { font-size: 11px; border: 1px solid #334155; border-radius: 3px; padding: 0 4px; min-width: 40px; width: 90%; outline: none; }
.ir-node-content .ir-row__value--editable { cursor: text; }
.ir-node-content .ir-row__value--editable:hover { background: rgba(14,165,233,0.08); border-radius: 3px; }
`;

function ensureStyleTag(): HTMLStyleElement | null {
    if (typeof document === 'undefined') return null;
    let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!tag) {
        tag = document.createElement('style');
        tag.id = STYLE_TAG_ID;
        tag.appendChild(document.createTextNode(BASE_CSS));
        document.head.appendChild(tag);
    }
    return tag;
}

/** view id → its <style> text node, for targeted removal */
const viewCssNodes = new Map<string, Text>();

/** Static (non-conditional) CSS derived from the view's shape spec.
 *  Fase B: border and fill are painted inline on .ir-node-content by
 *  IRNodeContent, so no static parts are emitted today. Kept (with
 *  ensureViewCss / viewCssNodes) as the hook for future per-view static parts. */
function staticCssFor(viewId: string, ir: NodeViewIR): string {
    const rules: string[] = [];
    // No static parts today: authored border/fill are applied inline (see IRNodeContent).
    if (rules.length === 0) return '';
    return `\n.ir-view-${cssEscape(viewId)} { ${rules.join(' ')} }`;
}

/** Minimal escape for view ids used inside class selectors. */
function cssEscape(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

export function ensureViewCss(viewId: string, ir: NodeViewIR): void {
    const tag = ensureStyleTag();
    if (!tag || viewCssNodes.has(viewId)) return;
    const css = staticCssFor(viewId, ir);
    const node = document.createTextNode(css);
    tag.appendChild(node);
    viewCssNodes.set(viewId, node);
}

export function removeViewCss(viewId: string): void {
    const node = viewCssNodes.get(viewId);
    if (node) {
        node.remove();
        viewCssNodes.delete(viewId);
    }
}
