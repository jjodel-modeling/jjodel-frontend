# Jjodie front: NaN paths in the megamodel and the Discard button under Playwright

Prompt-ID: P-2026-10-24-1521
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: fast (two small fixes)
Depends: none
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 15:15, in the project chat («chiudiamo tutto senza aspettare la 3.2»)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by the cause written in the log entry for each fix. No core change, no critical-zone file.

Worktree: `~/jjodel-w-jjp-low`, branch `jjp-low`, cut from `jjodie-panel` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-1521 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. Outputs through `tail` or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-low.md`. Nothing merges anywhere: the chat merges.

## COSA

1. **NaN in megamodel SVG paths.** `buildRoundedPath` (`frontend/src/components/megamodel/MegamodelEdge.ts:186`) emits `NaN` coordinates on zero-length segments (two consecutive equal points), which the browser reports as SVG errors; a known case predates this front and S6b (scripts in the megamodel view) added a second. Reproduce both on the dev server (console errors counted before), fix at the source (drop consecutive duplicate points and guard the corner radius against a zero-length segment), unit test with the degenerate inputs (two equal points, three collinear points with a zero segment, a single point). Console errors after: zero `NaN` path errors on the megamodel of a project with a script file.
2. **Discard under Playwright.** The S4 probe could not click Discard on the preview bar (`frontend/src/components/editor-v2/preview/PreviewBar.tsx`) with a Playwright click, while a DOM click worked. Find the cause with `elementFromPoint` at the button's centre (an overlay, `pointer-events`, a z-index below the canvas pane, or the bar moving on hover). Fix it so a real pointer click works; if the cause is an element outside the two files above, ask. Re-run the S4 probe with a Playwright click on both Discard and Apply.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (re-run once on the same server on the known first-load timeout).

## DOVE

`frontend/src/components/megamodel/MegamodelEdge.ts` and a new test beside it, `frontend/src/components/editor-v2/preview/PreviewBar.tsx` (and its SCSS if it has one), the S4 probe file, `docs/log-inbox/jjodie-ui-low.md`, Status of this prompt.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`.

## NON FARE

No critical-zone file, no planner or card file (another lane holds them). No merge, no push.
