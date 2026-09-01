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

/** The `<option>` that separates the syntaxes from the manager. Disabled, so it is
 *  never selectable and never reaches `onChange`. */
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
