# Code generation for 3.2, slice S3: live preview in the Template Editor

Prompt-ID: P-2026-10-23-2225
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; codegen UI only; no critical-zone file)
Depends: P-2026-10-23-2145
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23, in the project chat: «scrivere le template in quella finestra è un po' scomodo» and «mettiamo il template editor in 3.2»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_authoring.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-cgsafety`, branch `cg-safety`, at `c0618cc85` (S7, merged into the trunk at `204d7d624`) plus the commit that adds this prompt. The branch already holds S1, S2 (Template Editor), S5 (text mode), S6 (JjEL guard) and S7 (generation budget). Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-2225 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. If the context gets heavy, write a handoff in the lane folder and stop with `Outcome: hard-stop`.

## Read first, and only this
`discovery_2026-10-23_codegen_authoring.md`: §3.3, §3.4 («Right» pane and the `linesOf` note), the S3 row of §4, risk 6 of §5. Then `discovery_2026-10-23_codegen_textmode_safety.md`, rows R-GEN-26 and R-GEN-28 of §6 (the engine helper that dispatches on `mode`, and the budget every generation now carries). Then the current `TemplateEditorTab.tsx` and `CodePanel.tsx` as they are on this branch.

## COSA
1. **Move `linesOf`** (and only what the span rendering needs with it) from `CodePanel.tsx` to a new `codegen/ui/codeLines.ts`; `CodePanel.tsx` imports it; panel output byte-identical. Move its existing test rows with it or add them in `codeLines.test.ts`.
2. **Right pane of the Template Editor:** model select (the S1 `conformingModels` helper), entry select (`main` if present, else the edited template), the generated text in the panel's `<pre>`-with-gutter form via `codeLines.ts`. Refresh 400 ms after the last edit, over the stored list with the drafts merged in (a pure draft-merge helper, tested: a draft wins over the stored body, a deleted draft removes, mode travels with the body). No Run, no Check.
3. **Generation errors as markers:** errors whose `template` is the edited one become Monaco markers with owner `codegen-gen` at their hole, beside the existing `codegen-parse` markers; errors of other templates are listed in the pane, not marked. A budget stop (S7) shows as its one error; the editor stays responsive.
4. **Cost:** measure one refresh on the largest gallery example (time of `buildEvalContext` plus `generate`), report the figure; if it passes 100 ms, raise the debounce to 800 ms and say so. Do not cache the eval context across model edits.
5. **Bundle:** new modules are reached only from the lazy codegen chunk; `npm run check:codegen-lazy` green in the «on» mode.
6. **Gates:** typecheck, build, `npx vitest run src/codegen src/components/editor-v2`, `check:codegen-lazy` «on», `check:docs`. No existing expectation may change; if one has to, list it and stop with `Outcome: question`.
7. **One docs commit:** log entry in `docs/log-inbox/codegen.md` (with the measured refresh time) and this prompt's `Status:` line.

## DOVE
`frontend/src/codegen/ui/TemplateEditorTab.tsx`, `TemplateEditor.tsx` only if the pane layout needs it, `CodePanel.tsx` (import only), new `codeLines.ts` + test, new draft-merge helper + test under `codegen/ui/`, the SCSS of the Template Editor; `docs/log-inbox/codegen.md`; this prompt file. More than five code files: list them in your first reply (rule 19).

## NON FARE
No completion (S4), no tree or context-menu entry, no change to the engine, to the budget or to the worker; no Run or Check in the editor; nothing in the critical zone; no new dependency. No push, no merge.
