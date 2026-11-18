/**
 * dataManagerOption — the vocabulary of the «Data manager» entry in the toolbar
 * viewpoint picker.
 *
 * The picker's vocabulary is «one <option> per viewpoint, plus the empty string for
 * abstract syntax», and every value it carries is written to `state.viewpoint` by
 * `activateViewpoint`. The manager is NOT a viewpoint — it is a third tab on the same
 * model (`TabDataMaker.instanceManager`), it has no `DViewPoint` behind it and nothing
 * renders through it — so it enters the list as a SYNTHETIC entry: a sentinel value the
 * picker recognises and intercepts BEFORE the viewpoint write, never a fake viewpoint in
 * the D-layer graph.
 *
 * The sentinel is deliberately shaped so it cannot collide with a pointer: viewpoint ids
 * in this codebase are `Pointer_…` strings, and no pointer starts with `@`.
 *
 * Zero imports on purpose — nine suites in this repo die at import on
 * `window is not defined`, and a module that needs the store is a module that does not
 * get tested. The impure half (resolving the `LModel`, opening the tab) stays in
 * `Toolbar.tsx`.
 */

/** The `<option value>` of the «Data manager» entry. Never reaches `state.viewpoint`. */
export const DATA_MANAGER_OPTION_VALUE = '@data-manager';

/** Ratified label (2026-09-01): sentence case, NOT «CRUD», NOT «Tabular syntax». */
export const DATA_MANAGER_OPTION_LABEL = 'Data manager';

/** Bootstrap glyph of the entry. NAV1 could not paint it — a native `<option>` renders
 *  text only — so the mock's `bi-table` lived on the models rail alone. NAV2 replaces the
 *  `<select>` with a listbox whose entries carry icons, and the glyph comes home. */
export const DATA_MANAGER_OPTION_ICON = 'bi-table';

/** TODO: cleanup — no reader since NAV2 (2026-09-01). The separator was an `<option disabled>`
 *  because a native `<select>` has no other way to draw a rule; in the listbox that replaced it
 *  the separator is a hairline `<div role="presentation">`, which is not an entry at all and so
 *  cannot be highlighted, counted, or reached by the arrow keys. Kept, not deleted: it is the
 *  vocabulary NAV1 ratified, and the unit suite still asserts the shape of the sentinel against
 *  it. */
export const DATA_MANAGER_SEPARATOR_LABEL = '────────';

/**
 * Whether a picker value is the manager sentinel rather than a viewpoint id.
 *
 * Total on purpose: the picker calls it on every change, including the empty string
 * («Abstract syntax»), which must read as a viewpoint value and not as the sentinel.
 */
export function isDataManagerOption(value: string | null | undefined): boolean {
    return value === DATA_MANAGER_OPTION_VALUE;
}

/* ── The textual entry (R-TXT-23, slice T2b, P-2026-11-02-0040) ──────────────────────────
   The model's text in the textual notation is a viewpoint-like entry of the model, as the
   manager is: a second synthetic entry on the same pattern, intercepted before the viewpoint
   write, opening a tab of the dock. Its label is the language's name, by default the
   metamodel's. The tab and the notation live in `src/codegen/` and load by dynamic import only
   (R-GEN-2); this vocabulary stays here, with zero imports, for the reason given at the top. */

/** The `<option value>` of the textual entry. Never reaches `state.viewpoint`. */
export const TEXTUAL_OPTION_VALUE = '@textual';

/** Bootstrap glyph of the textual entry: a text file, beside the manager's table. */
export const TEXTUAL_OPTION_ICON = 'bi-file-earmark-text';

/** The label when neither a language name nor a metamodel name is at hand. */
export const TEXTUAL_OPTION_FALLBACK_LABEL = 'Text';

/** Whether a picker value is the textual sentinel. Total, as `isDataManagerOption`. */
export function isTextualOption(value: string | null | undefined): boolean {
    return value === TEXTUAL_OPTION_VALUE;
}

/**
 * The label of the textual entry: the language's name, else the metamodel's (R-TXT-23), else
 * `TEXTUAL_OPTION_FALLBACK_LABEL`. A blank name counts as absent; the name shown is trimmed.
 */
export function textualOptionLabel(metamodelName: string | null | undefined, languageName?: string | null): string {
    const language = (languageName ?? '').trim();
    if (language) return language;
    const metamodel = (metamodelName ?? '').trim();
    return metamodel || TEXTUAL_OPTION_FALLBACK_LABEL;
}

/** The key of the metamodel's `_state` that holds its syntax annotations (codegen/textual/syntaxRecord.ts, R-TXT-21 (2)). */
export const TEXTUAL_SYNTAX_KEY = 'textSyntax';

let lastStored: unknown;
let lastLanguage: string | null = null;

/**
 * The language's name a stored annotations record sets (R-TXT-25 (12)), `null` when there is none or the record is not
 * a readable version-1 record. Read here, with no import, so the picker can show it without loading `src/codegen/`;
 * the rule is `resolveAnnotations`'s (a non-blank string). The last value read is kept, as the picker reads it per
 * store change.
 */
export function textualLanguageOf(stored: unknown): string | null {
    if (stored === lastStored) return lastLanguage;
    let language: string | null = null;
    if (typeof stored === 'string') {
        try {
            const r = JSON.parse(stored);
            if (r && typeof r === 'object' && !Array.isArray(r) && r.v === 1 && typeof r.language === 'string' && r.language.trim()) language = r.language;
        } catch { /* not JSON: no language */ }
    }
    lastStored = stored;
    lastLanguage = language;
    return language;
}

/** The language's name stored on the metamodel the model `modelId` is an instance of, or `null`. */
export function textualLanguageNameOf(lookup: Readonly<Record<string, any>> | undefined, modelId: string | undefined): string | null {
    const mm = modelId ? lookup?.[lookup?.[modelId]?.instanceof] : undefined;
    return textualLanguageOf(mm?._state?.[TEXTUAL_SYNTAX_KEY]);
}
