/**
 * templateDrafts — the drafts of the Template Editor tab, and how they meet the stored list (slice S2,
 * P-2026-10-23-1945; R-GEN-22, discovery §5.2).
 *
 * A draft is a template being edited: its name, its parameters as typed (a comma-separated list) and its body, over
 * the stored record it started from, its `base`, keyed by the base's name. Only dirty drafts are kept: an edit that
 * brings a draft back to its base drops it, so a template with no draft shows the stored record and follows every
 * outside write (an Undo, the panel's own editor). A dirty draft stays when the store changes under it, and is then
 * «changed outside the editor»; if the store comes to hold what the draft holds, the draft is dropped.
 *
 * Save writes every draft at once (`applyDrafts`, then `templatesPatch`), one undo step, and is refused while a draft
 * has a problem: the name rules of the panel's editor (TemplateEditor.tsx), an empty name or one another template
 * holds.
 *
 * Pure: no Monaco, no store.
 */

import type { TemplateRecord } from '../engine/templates';

export interface TemplateDraft {
    readonly base: TemplateRecord;
    readonly name: string;
    /** As typed: a comma-separated list. */
    readonly params: string;
    readonly body: string;
}

/** Dirty drafts by the name of their base. */
export type Drafts = Readonly<Record<string, TemplateDraft>>;

/** The editable fields of a draft. */
export type DraftEdit = Partial<Pick<TemplateDraft, 'name' | 'params' | 'body'>>;

export const paramsOf = (text: string): string[] => text.split(',').map(p => p.trim()).filter(p => p !== '');

export function draftOf(record: TemplateRecord): TemplateDraft {
    return { base: record, name: record.name, params: record.params.join(', '), body: record.body };
}

/** The record a draft saves as. */
export function recordOf(draft: TemplateDraft): TemplateRecord {
    return { ...draft.base, name: draft.name.trim(), params: paramsOf(draft.params), body: draft.body };
}

const sameRecord = (a: TemplateRecord, b: TemplateRecord): boolean =>
    a.name === b.name && a.body === b.body && a.target === b.target && a.params.join('\u0000') === b.params.join('\u0000');

/** The draft differs from what it started from. */
export function isDirty(draft: TemplateDraft): boolean {
    return !sameRecord(recordOf(draft), draft.base);
}

/** What the tab shows of a stored template: its draft, else the record. */
export function shownDraft(drafts: Drafts, record: TemplateRecord): TemplateDraft {
    return drafts[record.name] ?? draftOf(record);
}

/** The drafts after an edit of the template `record` shows; a draft back to its base is dropped. */
export function editDraft(drafts: Drafts, record: TemplateRecord, edit: DraftEdit): Drafts {
    const next: TemplateDraft = { ...shownDraft(drafts, record), ...edit };
    const { [record.name]: _dropped, ...others } = drafts;
    return isDirty(next) ? { ...others, [record.name]: next } : others;
}

/** The drafts that still say something over the stored list: a draft whose record the store now holds is dropped. */
export function followStore(drafts: Drafts, stored: readonly TemplateRecord[]): Drafts {
    let changed = false;
    const next: Record<string, TemplateDraft> = {};
    for (const [key, draft] of Object.entries(drafts)) {
        const current = stored.find(t => t.name === key);
        if (current && sameRecord(recordOf(draft), current)) {
            changed = true;
            continue;
        }
        next[key] = draft;
    }
    return changed ? next : drafts;
}

/** The store changed the template under a dirty draft, or removed it. */
export function changedOutside(draft: TemplateDraft, stored: readonly TemplateRecord[]): boolean {
    const current = stored.find(t => t.name === draft.base.name);
    return !current || !sameRecord(current, draft.base);
}

/** Why a draft cannot be saved, or `null`; `taken` are the names the other templates will hold. */
export function draftProblem(draft: TemplateDraft, taken: readonly string[]): string | null {
    const name = draft.name.trim();
    if (name === '') return 'A template needs a name.';
    if (taken.includes(name)) return `The name ${name} is taken by another template.`;
    return null;
}

export interface AppliedDrafts {
    /** The list Save writes: every stored template with its draft applied, then the drafts whose template is gone. */
    readonly next: TemplateRecord[];
    /** The problems that refuse the Save, by draft key. */
    readonly problems: Readonly<Record<string, string>>;
}

/** The stored list with the drafts applied, in the stored order. */
export function applyDrafts(stored: readonly TemplateRecord[], drafts: Drafts): AppliedDrafts {
    const next = stored.map(t => (drafts[t.name] ? recordOf(drafts[t.name]) : t));
    const keys = stored.map(t => t.name);
    for (const [key, draft] of Object.entries(drafts)) {
        if (!stored.some(t => t.name === key)) {
            next.push(recordOf(draft));
            keys.push(key);
        }
    }
    const problems: Record<string, string> = {};
    keys.forEach((key, i) => {
        const draft = drafts[key];
        if (!draft) return;
        const problem = draftProblem(draft, next.filter((_, j) => j !== i).map(o => o.name));
        if (problem) problems[key] = problem;
    });
    return { next, problems };
}

/** The draft key a template is saved under maps to its new name. */
export function savedNames(drafts: Drafts): Record<string, string> {
    return Object.fromEntries(Object.entries(drafts).map(([key, d]) => [key, d.name.trim()]));
}
