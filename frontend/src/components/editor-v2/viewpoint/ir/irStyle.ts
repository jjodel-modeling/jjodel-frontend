/**
 * irStyle — per-view CSS generation and injection for IR views.
 *
 * One class `.ir-view-<viewid>` per view, injected once when the view enters
 * the active index and removed when it leaves. Dedicated <style id="ir-views-css">
 * tag; the existing injector in Dashboard.tsx (#views-css-injector-d) is not
 * touched. Conditional style parts (form, fill) are resolved per instance and
 * applied inline by IRNodeContent; only static parts live here.
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
.ir-shape--rect { border-radius: 0; }
.ir-shape--rounded { border-radius: 10px; }
.ir-shape--ellipse { border-radius: 50%; justify-content: center; }
.ir-hull { border: 1.5px dashed rgba(51,65,85,0.45); border-radius: 12px; background: rgba(51,65,85,0.03); }
.ir-hull__header { display: flex; align-items: center; justify-content: space-between; padding: 0 8px; font-size: 11px; font-weight: 600; color: #334155; }
.ir-hull__toggle { border: none; background: transparent; cursor: pointer; font-size: 11px; color: #334155; padding: 2px 4px; line-height: 1; }
.ir-hull__toggle:hover { color: #0ea5e9; }
.ir-collapse-chip { display: inline-flex; align-items: center; gap: 4px; border: none; background: rgba(51,65,85,0.08); border-radius: 8px; cursor: pointer; font-size: 10px; color: #334155; padding: 2px 6px; margin-left: 6px; line-height: 1.4; }
.ir-collapse-chip:hover { background: rgba(14,165,233,0.12); }
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

/** Static (non-conditional) CSS derived from the view's shape spec. */
function staticCssFor(viewId: string, ir: NodeViewIR): string {
    const rules: string[] = [];
    const border = ir.shape.border;
    if (border) {
        rules.push(`border: ${border.width}px ${border.style} ${border.color};`);
    }
    if (typeof ir.shape.fill === 'string') {
        rules.push(`background: ${ir.shape.fill};`);
    }
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
