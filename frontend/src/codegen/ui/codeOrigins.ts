/**
 * codeOrigins — what the generated text says of its fragments, and where they lead (slice G3, P-2026-10-24-0003;
 * R-GEN-36, R-GEN-41). The reader's words for an origin and the model element of a generated position moved here
 * from CodePanel.tsx unchanged; the template a fragment leads to is new.
 *
 * Where an element is on a canvas, among the ids it draws, is here too (canvasSelection.ts reads the ids).
 *
 * Pure: no React, no store.
 */

import type { ModelOrigin, Origin, TextMapEntry } from '../engine/text';
import { resolveEdgeSelectionTarget } from '../../components/editor-v2/utils/edgeSelectionTarget';
import { displayJson } from './displayJson';

type Lookup = Record<string, any>;

/** An element's name for a reader: its `name`, else its class and id. */
export function elementName(lookup: Lookup, id: string): string {
    const d = lookup[id];
    return typeof d?.name === 'string' && d.name ? d.name : `${d?.className ?? 'element'} ${id}`;
}

function transformationText(o: ModelOrigin): string {
    const t = o.transformation;
    return t.args && t.args.length > 0 ? `${t.name}(${t.args.map(a => displayJson(a)).join(', ')})` : t.name;
}

/** What the origin bar says of a fragment. */
export function originText(lookup: Lookup, origin: Origin): string {
    switch (origin.kind) {
        case 'model':
            return `${elementName(lookup, origin.elementId)} · ${origin.featureName} · ${transformationText(origin)}`;
        case 'literal':
            return `template ${origin.template} · line ${origin.line}, column ${origin.column}`;
        case 'opaque':
            return origin.reads.length > 0
                ? `computed from ${origin.reads.map(r => `${elementName(lookup, r.elementId)}.${r.featureName}`).join(', ')}`
                : 'computed, no model read';
        case 'error':
            return origin.message;
    }
}

/**
 * The model element of a generated position (1-based line and column): the model fragment under the column, else
 * the nearest model fragment on the line; `null` when the line holds none.
 */
export function elementAt(map: readonly TextMapEntry[], line: number, column: number | null): ModelOrigin | null {
    const onLine = map.filter((e): e is TextMapEntry & { origin: ModelOrigin } => e.line === line && e.end > e.start && e.origin.kind === 'model');
    if (onLine.length === 0) return null;
    const col = (column ?? 1) - 1;
    const distance = (e: TextMapEntry) => (col < e.start ? e.start - col : col >= e.end ? col - e.end + 1 : 0);
    return onLine.reduce((best, e) => (distance(e) < distance(best) ? e : best)).origin;
}

/** The template a fragment leads to (R-GEN-41), and where in its body when the origin says so (1-based). */
export interface TemplateTarget {
    readonly template: string;
    readonly line: number | null;
    readonly column: number | null;
}

/**
 * The template that produced a fragment: a literal's and an error's position, a model or opaque fragment's template
 * name (G2) with no position; `null` when the origin names no template.
 */
export function templateTarget(origin: Origin): TemplateTarget | null {
    switch (origin.kind) {
        case 'literal':
        case 'error':
            return { template: origin.template, line: origin.line, column: origin.column };
        case 'model':
        case 'opaque':
            return origin.template !== undefined ? { template: origin.template, line: null, column: null } : null;
    }
}

/** Where an element is on a canvas: its vertex, or the edge standing for it and that edge's source vertex if known. */
export type CanvasPick =
    | { readonly kind: 'node'; readonly nodeId: string }
    | { readonly kind: 'edge'; readonly edgeId: string; readonly nodeId: string | null };

/** The pick of `elementId` among the node and edge ids a canvas draws; `null` when it draws neither. Pure. */
export function pickOnCanvas(lookup: Lookup, nodeIds: readonly string[], edgeIds: readonly string[], elementId: string): CanvasPick | null {
    const node = nodeIds.find(id => lookup[id]?.model === elementId || id === elementId);
    if (node !== undefined) return { kind: 'node', nodeId: node };
    const edge = edgeIds.find(id => resolveEdgeSelectionTarget(id, lookup)?.modelElementId === elementId);
    if (edge === undefined) return null;
    const start = lookup[edge]?.start;
    return { kind: 'edge', edgeId: edge, nodeId: typeof start === 'string' && nodeIds.includes(start) ? start : null };
}
