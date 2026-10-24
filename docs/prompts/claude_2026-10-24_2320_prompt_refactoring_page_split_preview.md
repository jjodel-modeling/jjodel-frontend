# Refactoring page: split editor, planner diagnostics, metamodel diff preview, Preview/Apply

Prompt-ID: P-2026-10-24-2320
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (short discovery inside, then implementation)
Depends: P-2026-10-24-2255
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 ~23:15 («proceedi con una /lane auto», on mockup A of the refactoring page)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by section 1 (a short discovery written at the top of the log entry). No core change, no critical-zone file, no `reducer.ts`: if the work needs one, stop with `Outcome: question`.

Worktree: `~/jjodel-w-jjp-rfa`, branch `jjp-rfa`, cut from the trunk `alfonso-frontend-jjtl` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Design reference: canvas https://claude.ai/artifact/TMWZRPpqBHrVhidqjnSTLJ, board «Refactoring A · Split editor, diagnostics, diff preview».

## Lane discipline

Every reply opens with `[P-2026-10-24-2320 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as each step is green. One probe run per tool call. Context discipline: never read a file over 300 lines whole, use grep-found ranges; test, build and probe output only through `tail -20` or `grep`. If the context passes about 140k, commit what is green, write a handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-rfa.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

Rows R-JJD-2, R-JJD-6, R-JJD-14 in `docs/decisions.md`. The Status lines and COSA of `docs/prompts/claude_2026-10-24_2200_prompt_refactoring_artifact_menu.md`, `..._2215_prompt_run_refactoring_from_tab.md`, `..._2255_prompt_jjscript_syntax_highlight.md`. `frontend/src/components/abstract/tabs/ScriptTab.tsx`, `frontend/src/components/scripts/RunRefactoringMenu.tsx` (by ranges if long).

## COSA

The refactoring tab today: a full-width editor, a project Save and an editor Save, a target dropdown plus «Run on <target>» that applies at once, no diagnostics, the metamodel not visible. Syntax highlighting is already in (P-2026-10-24-2255).

1. Short discovery (top of the log entry, file:line, positive control for every absence): the tab's layout and header; how Run applies the script; whether the M2 effects planner (`jjscript/executor/effectsPlanner.ts`) and the ghost preview pieces (`components/editor-v2/preview/`) can be reused outside the editor-v2 canvas; how to render a read-only view of the target metamodel inside the tab (an existing diagram component in read-only mode, or a compact class-box renderer).
2. Layout: the editor on the left at 600 px (resizable 480..800, persisted like the dock width), a read-only preview of the target metamodel on the right. Header: file name, a dirty dot instead of the editor Save (Cmd+S saves; the project Save in the top bar stays), «Refactoring of» plus the single target selector, a warnings counter, and `Preview` as the primary button. Remove «Run on <target>» from the header; running happens only through Preview then Apply.
3. Diagnostics: run the planner on the script against the selected target, debounced 300 ms after typing; amber dots in the gutter on lines with warnings, a wavy underline on the names that do not resolve, and a list under the editor (line range plus message). Add one warning to the planner if it is not there: a `delete` of an attribute or reference whose feature holds values in a conforming model, with the count per model («org loses 12 slot values»).
4. Preview: `Preview` draws the planned effects on the right pane: added classes and features dashed cyan, removed features struck through in red, new generalizations as dashed edges with a hollow triangle. A bottom bar shows the effect chips, the impact on conforming models, `Discard` and `Apply`. Apply runs the script as one undo step (R-JJD-6) and clears the preview; Discard clears it. Editing the script while previewing re-plans.
5. Jjodie's launcher on this page follows the docked panel (R-JJD-1): no floating button over the sidebar.

Tests first where logic is pure (planner warning, diagnostics mapping from planner output to lines and ranges). Probe `frontend/scripts/probe/refactoring-split-preview.ts`: open a project with a metamodel, a model with values and a refactoring file; type a script with an unresolved name and a delete of a filled attribute; measure gutter dots, the underline, the list, the warnings counter; Preview; count ghost classes, struck features and edges; Apply; check the metamodel; one Cmd+Z restores it. Crops into `~/.jjodel-lanes/P-2026-10-24-2320/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (re-run once on the same server on the known first-load timeout), the probes of 2200, 2215 and 2255 still green.

## DOVE

To be confirmed by step 1. Expected: `ScriptTab.tsx`, `RunRefactoringMenu.tsx` and the components it uses, new components under `frontend/src/components/scripts/`, `effectsPlanner.ts` (the one new warning), styles under the existing tokens, the new probe, `docs/log-inbox/jjodie-ui-rfa.md`, Status of this prompt. If more than 8 source files change, list them in the log with the reason.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`, with the probe results.

## NON FARE

No critical-zone file, no `reducer.ts`, no JjScript grammar change, no new refactoring operations (that is P-2026-10-24-2321). No merge, no push.
