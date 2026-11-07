# Jjodie S6b: scripts in the project tree and the megamodel view

Prompt-ID: P-2026-10-24-0355
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S6b part 1, listing)
Depends: P-2026-10-24-0312
Status: eseguito 2026-10-24 · lane jjodie-ui-s6b · code 2b56495cc · gates green · probe 19/19 · done
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run; S6 approved)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s6b`, branch `jjp-s6b`, cut from `jjodie-panel` at `b01d1eac1` (S6a merged) plus the commit
that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0355 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 70 minutes. No subagents, no
background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; `LeftBar.tsx`, the megamodel files and the tree view only by grep-found ranges (follow how
transformations are listed); test, build and probe output through `tail` or `grep`. Dev server only on a free port in
3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only. Subject lines without
`(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s6b.md`. Nothing
merges anywhere: the chat merges.

## Read first, and only this

The S6 paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`. Q6 and Q7 row S6 of the
report (the tree view is a hot area). Row R-JJD-5. `docs/log-inbox/jjodie-ui-s6a.md` and
`frontend/src/components/scripts/scriptFiles.ts`.

## COSA

S6b, listing only (the arrival of Jjodie changes as a diff on a file is a later lane, after S5):

1. The project's scripts (`DProject.scripts`) are listed under a SCRIPTS section in the left bar / project tree, in the
   same style and position logic as the transformations section, with the `.jjs` name; click opens the S6a script tab;
   the context menu offers Rename and Delete through the S6a pure functions (Delete asks for confirmation as other
   project artifacts do).
2. The megamodel view lists scripts as nodes if the view lists transformations as nodes, linked to the model they run
   on (`modelId`) when set; otherwise as a list section, matching the view's conventions. Do not change the layout of
   existing megamodel nodes.
3. Tests for any pure helper added; a probe under `frontend/scripts/probe/` that creates two scripts with
   `openScriptAsFile`, checks both appear under SCRIPTS and in the megamodel view, opens one by click, renames one,
   and leaves the rest of the tree unchanged (count of other sections' rows before and after). One crop under
   `~/.jjodel-lanes/P-2026-10-24-0355/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` once. Commit
(`feat(project): list scripts in the tree and the megamodel view`).

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`, with the probe result.

## NON FARE

No edit to Jjodie components (another lane is editing them), `reducer.ts`, `EditorV2.tsx`, the preview code, or any
critical-zone file. No merge, no push.
