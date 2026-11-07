/**
 * templatePreview — what the Template Editor's preview generates from, and where its errors go (slice S3,
 * P-2026-10-23-2225; discovery 2026-10-23 codegen authoring §3.3, §3.4).
 *
 * The preview generates over the stored list with the drafts merged in, as Save would write it (`applyDrafts`): a
 * draft wins over the stored record, its mode travels with its body, and a template deleted from the store and from
 * the drafts is gone. The entry is the one chosen while it is listed, else `main`, else the edited template. The
 * generation errors of the edited template become markers at their hole, the ones a parse marker already holds
 * excepted; the pane lists every error.
 *
 * Pure: no Monaco, no store.
 */

import { applyDrafts } from './templateDrafts';
import type { Drafts } from './templateDrafts';
import type { TemplateMarker } from './templateMarkers';
import type { GenerateError } from '../engine/generate';
import type { TemplateRecord } from '../engine/templates';

/** The list the preview generates from: the stored templates with the drafts merged in, in the stored order. */
export function previewTemplates(stored: readonly TemplateRecord[], drafts: Drafts): TemplateRecord[] {
    return applyDrafts(stored, drafts).next;
}

/** The entry of the preview: `chosen` while listed, else `main`, else `edited` while listed, else the first. */
export function previewEntry(templates: readonly TemplateRecord[], chosen: string | null, edited: string | null): string | null {
    const listed = (name: string | null): name is string => name !== null && templates.some(t => t.name === name);
    if (listed(chosen)) return chosen;
    if (listed('main')) return 'main';
    if (listed(edited)) return edited;
    return templates[0]?.name ?? null;
}

/** The markers of the generation errors of the template `edited`, one column wide; those `parsed` holds are left out. */
export function previewMarkers(errors: readonly GenerateError[], edited: string | null, parsed: readonly TemplateMarker[]): TemplateMarker[] {
    const held = new Set(parsed.map(m => `${m.startLineNumber}:${m.startColumn}:${m.message}`));
    return errors
        .filter(e => e.template === edited && !held.has(`${e.line}:${e.column}:${e.message}`))
        .map(e => ({ startLineNumber: e.line, startColumn: e.column, endLineNumber: e.line, endColumn: e.column + 1, message: e.message }));
}
