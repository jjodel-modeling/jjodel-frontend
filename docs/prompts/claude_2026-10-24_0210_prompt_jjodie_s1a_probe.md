# Jjodie S1a probe: visual check of the docked panel

Prompt-ID: P-2026-10-24-0210
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (probe and closure of S1a)
Depends: P-2026-10-24-0135
Status: eseguito 2026-10-24 · lane jjodie-ui-s1p · ecb77a0c8 785e65d19 · probe 34/35, smoke green · Quick tip over the dock open (question to the chat) · GO owed (RC-23)
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s1p`, branch `jjp-s1p`, cut from `jjodie-panel` at `8ab7500f1` (S1a merged) plus the commit
that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0210 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files are not authorised. Time limit: 60
minutes. No subagents, no background tasks. One probe run per tool call. Context discipline: never `cat` a whole large
file or log; probe output through `grep` of its summary lines. Dev server only on a free port in 3010..3019 (check with
`lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only (D-UI-15). Subject lines without `(P-...)`
suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s1p.md` (a file of its own, so
parallel lanes do not collide). Nothing merges anywhere: the chat merges `jjp-s1p` into `jjodie-panel`.

## Read first, and only this

The log entry of S1a in `docs/log-inbox/jjodie-ui.md` (its Notes and Ticket lines), row R-JJD-1 in
`docs/decisions.md`, and the S1 paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`.

## COSA

1. A probe under `frontend/scripts/probe/` (follow an existing one, for example `codegen-panel.ts`) that opens a
   project with a model on the canvas, opens Jjodie and measures from the DOM: the dock width (default 460), the
   handle (present, `role=separator`, focusable), the clamp at 420 and 760 after a drag or arrow keys, the persisted
   `dockWidth` after reload, the editor canvas width shrinking by the dock width, the Properties rail's right edge
   equal to the dock's left edge when both are open, no element with `position: fixed` overlapping the dock, no
   fullscreen button, the closed state (FAB) still working, and the console free of new errors. Save two crops
   (Jjodie open beside the canvas with the rail open; Jjodie closed) under `~/.jjodel-lanes/P-2026-10-24-0210/`.
2. Run `npm run smoke` once; report A5 (rail top) in particular.
3. If a measure fails and the fix lies inside the S1a files (`JodieWindow.tsx`, `JodieWindow.css`, `Dashboard.tsx`,
   `dashboard.scss`, the rail scss line, `_layout.scss`), fix it in one commit (`fix(jjodie): ...`) with the gates
   (typecheck at baseline, vitest summary, build) and re-run the probe. Anything else: `Outcome: question` with
   `Recommended:`.
4. Close: log entry, and flip the Status of `docs/prompts/claude_2026-10-24_0135_prompt_jjodie_s1a_dock.md` to the
   visual outcome, plus this prompt's Status, in one docs-only commit.

## HARD STOP

`Outcome: hard-stop` after the closing commit, with the crop paths and the measures table: the chat runs RC-23.

## NON FARE

No edit outside the S1a files. No merge, no push.
