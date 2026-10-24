# Jjodie: M2 scripts in the effects planner, the script card and the ghost preview

Prompt-ID: P-2026-10-24-1520
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (extends the planner beyond the M1 subset)
Depends: P-2026-10-24-1350
Status: non completato 2026-10-24 · lane jjp-m2 · context ceiling (AM-8) before the first test run, wip 4ad31c758 · continued by P-2026-10-24-1600
Corregge: none
Request: Alfonso, 2026-10-24 15:15, in the project chat («chiudiamo tutto senza aspettare la 3.2», then «Dentro la 3.2»)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by section 1 below (a short discovery written into the log entry, no separate report). No core change and no critical-zone file is authorised: if the work needs one, stop with `Outcome: question`.

Worktree: `~/jjodel-w-jjp-m2`, branch `jjp-m2`, cut from `jjodie-panel` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-1520 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat` a whole large file or log; read `effectsPlanner.ts` (529 lines) by grep-found ranges; test, build and probe output through `tail` or `grep`. If the context passes about 150k, commit what is green, write a handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-m2.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

Rows R-JJD-2, R-JJD-8 and R-JJD-10 in `docs/decisions.md`. The header comment of `frontend/src/jjscript/executor/effectsPlanner.ts` (declared limits, lines 1..40) and its `UNSUPPORTED` branches (around 439 and 451). `frontend/src/jjscript/executor/planWorld.ts`. `frontend/src/components/editor-v2/preview/previewElements.ts`. `frontend/src/jjscript/CLAUDE.md` for the M2 command set.

## COSA

Today a script with M2 commands (create class, attribute, reference, enumeration, literal, operation, package; set on their features; delete) is `unsupported` in the planner, so the card falls back to the code block with Run and no ghost preview is drawn (R-JJD-10). Close that gap.

1. Short discovery, written at the top of the log entry: the M2 commands the JjScript executor accepts (from its dispatcher, with file:line), how each resolves its container and names, and what the M2 canvas renders for each (node kinds for class, enumeration, package; rows for attribute, reference, literal, operation; edges for references and generalizations). Positive control for every absence.
2. Planner: extend `effectsPlanner.ts` / `planWorld.ts` so every M2 command the executor accepts is planned read-only, with the same contract as M1 (effects per metaclass, per-line warnings, no D-object created). Warnings at least for: duplicate name in the same container, reference to a type not found and not created earlier in the script, a set on a feature the element does not have. `let`, `forall` and blocks stay `unsupported` unless they are trivial to plan.
3. Card: the effect chips work for M2 (`+2 Class`, `+5 Attribute`, `+1 Enumeration`, ...), with the same ordering rule as M1.
4. Ghost preview on M2: planned classes, enumerations and packages appear as ghost nodes with their planned rows (attributes, references, literals); planned references and generalizations as dashed ghost edges, with the existing ghost style. Apply stays one undo step (R-JJD-6) and its planned/real comparison per metaclass covers M2.
5. Mixed scripts (M1 and M2 commands together) are planned per level; if the preview cannot show both, it shows the level of the open editor and the bar says how many effects are on the other level.

Tests first in `frontend/src/jjscript/executor/__tests__/`: one test per M2 command kind, the three warnings, a script that creates a class and then an attribute typed by it, a mixed script. Mutation bench on the new branches of the planner: at least six mutants, all killed.

Probe: a new `frontend/scripts/probe/jjodie-m2-preview.ts` on the dev server: open an M2 tab, send a fixed M2 script through the Jjodie test hook already used by the S4 probes, measure the chips, count the ghost nodes and edges, Apply, check the real elements match, one Cmd+Z removes all of them. Crops of the card and of the canvas with the preview into `~/.jjodel-lanes/P-2026-10-24-1520/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (a timeout on the first load of a fresh server is the known machine issue: re-run once on the same server), the existing probes `jjodie-s4c-apply-undo.ts` and `jjodie-udo-after-apply.ts` still green.

## DOVE

`frontend/src/jjscript/executor/effectsPlanner.ts`, `frontend/src/jjscript/executor/planWorld.ts`, their tests, `frontend/src/components/Jodie/ScriptCard.tsx`, `frontend/src/components/editor-v2/preview/previewElements.ts`, `frontend/src/components/editor-v2/preview/previewApplyCheck.ts`, `frontend/src/components/editor-v2/preview/scriptPreviewStore.ts`, the new probe, `docs/log-inbox/jjodie-ui-m2.md`, Status of this prompt. Not `PreviewBar.tsx` (another lane holds it) unless point 5 needs one line of text there: then ask.

## HARD STOP

None unless a stop condition fires: close with the docs commit (log entry, Status) and `Outcome: done`, with the probe results.

## NON FARE

No critical-zone file, no `reducer.ts`, no grammar change (R-JJD-4, R-JJD-10), no `EditorV2.tsx` beyond what the preview already uses. No merge, no push.
