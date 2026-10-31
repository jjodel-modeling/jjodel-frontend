/**
 * templateDrafts — the drafts of the Template Editor tab, and how they meet the stored list (slice S2,
 * P-2026-10-23-1945; R-GEN-22, discovery §5.2).
 *
 * A draft is a template being edited: its name, its parameters as typed (a comma-separated list), its body and its
 * mode (S5, R-GEN-27), and the type of its first parameter (P-2026-10-31-1410, `''` for none), over the stored record
 * it started from, its `base`, keyed by the base's key (`templateKey`: its name, with its parameter type when typed). Only dirty
 * drafts are kept: an edit that
 * brings a draft back to its base drops it, so a template with no draft shows the stored record and follows every
 * outside write (an Undo, the panel's own editor). A dirty draft stays when the store changes under it, and is then
 * «changed outside the editor»; if the store comes to hold what the draft holds, the draft is dropped.
 *
 * Save writes every draft at once (`applyDrafts`, then `templatesPatch`), one undo step, and is refused while a draft
 * has a problem: the name rules of the panel's editor (TemplateEditor.tsx), an empty name or a key another template
 * holds.
 *
 * Pure: no Monaco, no store.
 */

import { templateKey } from '../engine/dispatch';
import { modeOf } from '../engine/templates';
import type { TemplateMode, TemplateRecord } from '../engine/templates';

export interface TemplateDraft {
    readonly base: TemplateRecord;
    readonly name: string;
    /** As typed: a comma-separated list. */
    readonly params: string;
    readonly body: string;
    /** The mode of the body (R-GEN-27): the toggle is a draft edit, written by Save. */
    readonly mode: TemplateMode;
    /** The metaclass of the first parameter, `''` for an untyped template. */
    readonly paramType: string;
}

/** Dirty drafts by the key of their base. */
export type Drafts = Readonly<Record<string, TemplateDraft>>;

/** The editable fields of a draft. */
export type DraftEdit = Partial<Pick<TemplateDraft, 'name' | 'params' | 'body' | 'mode' | 'paramType'>>;

export const paramsOf = (text: string): string[] => text.split(',').map(p => p.trim()).filter(p => p !== '');

export function draftOf(record: TemplateRecord): TemplateDraft {
    return { base: record, name: record.name, params: record.params.join(', '), body: record.body, mode: modeOf(record), paramType: record.paramType ?? '' };
}

/** The record a draft saves as; a base with no mode keeps none while the draft stays an expression. */
export function recordOf(draft: TemplateDraft): TemplateRecord {
    const { mode: _baseMode, paramType: _baseType, ...base } = draft.base;
    const mode = draft.base.mode === undefined && draft.mode === 'expression' ? {} : { mode: draft.mode };
    const paramType = draft.paramType.trim() === '' ? {} : { paramType: draft.paramType.trim() };
    return { ...base, name: draft.name.trim(), params: paramsOf(draft.params), ...paramType, body: draft.body, ...mode };
}

const sameRecord = (a: TemplateRecord, b: TemplateRecord): boolean =>
    a.name === b.name && a.paramType === b.paramType && a.body === b.body && modeOf(a) === modeOf(b) && a.target === b.target && a.params.join('\u0000') === b.params.join('\u0000');

/** The draft differs from what it started from. */
export function isDirty(draft: TemplateDraft): boolean {
    return !sameRecord(recordOf(draft), draft.base);
}

/** What the tab shows of a stored template: its draft, else the record. */
export function shownDraft(drafts: Drafts, record: TemplateRecord): TemplateDraft {
    return drafts[templateKey(record)] ?? draftOf(record);
}

/** The drafts after an edit of the template `record` shows; a draft back to its base is dropped. */
export function editDraft(drafts: Drafts, record: TemplateRecord, edit: DraftEdit): Drafts {
    const next: TemplateDraft = { ...shownDraft(drafts, record), ...edit };
    const key = templateKey(record);
    const { [key]: _dropped, ...others } = drafts;
    return isDirty(next) ? { ...others, [key]: next } : others;
}

/** The drafts that still say something over the stored list: a draft whose record the store now holds is dropped. */
export function followStore(drafts: Drafts, stored: readonly TemplateRecord[]): Drafts {
    let changed = false;
    const next: Record<string, TemplateDraft> = {};
    for (const [key, draft] of Object.entries(drafts)) {
        const current = stored.find(t => templateKey(t) === key);
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
    const current = stored.find(t => templateKey(t) === templateKey(draft.base));
    return !current || !sameRecord(current, draft.base);
}

/** Why a draft cannot be saved, or `null`; `taken` are the keys the other templates will hold. */
export function draftProblem(draft: TemplateDraft, taken: readonly string[]): string | null {
    const name = draft.name.trim();
    if (name === '') return 'A template needs a name.';
    const type = draft.paramType.trim();
    if (taken.includes(templateKey({ name, paramType: type === '' ? undefined : type }))) {
        return type === '' ? `The name ${name} is taken by another template.` : `The name ${name} with the type ${type} is taken by another template.`;
    }
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
    const next = stored.map(t => (drafts[templateKey(t)] ? recordOf(drafts[templateKey(t)]) : t));
    const keys = stored.map(t => templateKey(t));
    for (const [key, draft] of Object.entries(drafts)) {
        if (!stored.some(t => templateKey(t) === key)) {
            next.push(recordOf(draft));
            keys.push(key);
        }
    }
    const problems: Record<string, string> = {};
    keys.forEach((key, i) => {
        const draft = drafts[key];
        if (!draft) return;
        const problem = draftProblem(draft, next.filter((_, j) => j !== i).map(o => templateKey(o)));
        if (problem) problems[key] = problem;
    });
    return { next, problems };
}

/** The draft key a template is saved under maps to its new name. */
export function savedNames(drafts: Drafts): Record<string, string> {
    return Object.fromEntries(Object.entries(drafts).map(([key, d]) => [key, d.name.trim()]));
}
