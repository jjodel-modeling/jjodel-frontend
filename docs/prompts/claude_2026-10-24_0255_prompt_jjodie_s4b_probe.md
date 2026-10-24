# Jjodie S4b probe: visual check of the ghost preview

Prompt-ID: P-2026-10-24-0255
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (probe and closure of S4b)
Depends: P-2026-10-24-0225
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-s4p`, branch `jjp-s4p`, cut from `jjodie-panel` at `709122e2c` (S4b merged) plus the commit
that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0255 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 60 minutes. No subagents, no
background tasks. One probe run per tool call. Context discipline: never `cat` a whole large file or log;
`EditorV2.tsx` only by grep-found ranges. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000,
3001 or 3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body,
`Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s4p.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

`docs/log-inbox/jjodie-ui-s4b.md`; the S4 paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`;
row R-JJD-2. The preview code under `frontend/src/components/editor-v2/preview/`.

## COSA

1. A probe under `frontend/scripts/probe/` that opens a project with a metamodel and a model on the canvas, fires the
   S4b «preview script» event with a small M1 script (three created instances, two references, one deliberate warning
   such as an unknown feature) and measures from the DOM: ghost nodes present with a dashed border of colour
   `#06b6d4` (rgb 6, 182, 212) and a translucent fill (alpha below 1); ghost edges dashed; the amber marker on the
   element with the warning; the bar text `Preview · +N objects · K warnings` with the right N and K; ghost nodes not
   selectable (click leaves the selection unchanged) and not draggable (position unchanged after a drag); no ghost
   overlapping an existing node; Discard removes every ghost and leaves the model's element count unchanged; a second
   preview then Apply creates exactly the planned elements and clears the bar; console free of new errors. Two crops
   (preview shown; after Apply) under `~/.jjodel-lanes/P-2026-10-24-0255/`.
2. If a measure fails and the fix lies inside the S4b files (`editor-v2/preview/*`, the S4b hunks of `EditorV2.tsx`),
   fix it in one commit (`fix(canvas): ...`) with the gates (typecheck at baseline, vitest summary, build) and re-run.
   Anything else: `Outcome: question` with `Recommended:`.
3. Close: log entry, Status of `docs/prompts/claude_2026-10-24_0225_prompt_jjodie_s4b_ghost_preview.md` to the visual
   outcome and this prompt's Status, in one docs-only commit.

## HARD STOP

`Outcome: hard-stop` after the closing commit, with the crop paths and the measures table.

## NON FARE

No edit outside the S4b files. No `reducer.ts`. No merge, no push.
