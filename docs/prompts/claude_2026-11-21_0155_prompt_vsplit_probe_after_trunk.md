# Splitter probe after the trunk merge: drift or regression

Prompt-ID: P-2026-11-21-0155
Chat: C-2026-11-19-2200
Front: maintenance
Status: eseguito 2026-11-21 · lane fast · 5fe23fba6, eca23597e · regression found and fixed in DockManagerStyles.scss (DOVE widened by the chat, RC-25)
Lane: fast (probe update on a branch already reviewed; no critical zone)
Depends: P-2026-11-19-2200
Request: https://claude.ai/code/session_01DQt9R6xGnqUtiRzRQbr61k (Alfonso gave the visual GO on the splitters 2026-11-21 01:25; the merge into the trunk waits on this probe)
Branch: `ui-vsplit` (worktree `~/jjodel-w-vsplit`, trunk merged in at `99b18d7df`)
Model: default from `.claude/settings.json`; no subagents, no background tasks; one probe run per tool call

## COSA

`frontend/scripts/probe/vsplit-uniform.ts` was 435/435 before the trunk was merged into `ui-vsplit`. After the merge (it brings the full-screen project dashboard R-MT-34, the canvas toolbar rationalization R-MT-39 and per-tab notation/colors) it first failed every scenario at project load, because it waited for a `.dock-tab` and the dashboard is no tab any more. The chat changed that wait to `.dock-layout` (uncommitted, line ~120). The rerun on port 3007 gives 345 PASS, 7 FAIL:

1. `dock-canvas-split: visible  .not-strip > .dock-layout > .dock-hbox > .dock-divider`
2. `align canvas split + rail: knobs at one height` (no canvas-split knob measured)
3. `jjtl-side: the knob takes the drag over its inner half (>= 3 columns)` (grab [1078,1079], knob 1078..1083)
4. `dock-divider-generator-beside: visible`
5. `align generator beside a canvas` (no divider knob measured)
6. `dock-divider-plain: visible`
7. `jjodie dock (canvas toolbar: viewpoint listbox): the overlay opened` (n 0)

Hypotheses of the chat, to confirm or refute by measurement, not by reading: 1, 2, 4, 5, 6 are probe drift, the project dashboard (`.project-dashboard--shown`) still covering the editor area because the scenario opens its tabs with `splitRight` / `open2` / `openManager`, which may not close it (`DockManager.closeDashboard`, `Dock.tsx` ~462); 7 is drift, the viewpoint listbox having moved to the syntax chip of the canvas bar's right zone (R-MT-39); 3 is unknown.

## DOVE

`frontend/scripts/probe/vsplit-uniform.ts`. Only if a failure is a real regression of the splitter contract: the splitter files of P-2026-11-19-2200 (`_vsplit.scss`, `abstract/style.scss` splitter rules, `resize-handle.scss`, `properties-with-tree-view.scss` rail handle rules, `jjtl.scss`, `JodieWindow.css`). Plus `docs/claude-code-log.md` or the maintenance log inbox, and this prompt's Status line. Nothing else; nothing of the critical zone.

## COME

1. For each of the 7 failures, establish drift or regression with a measurement (a screenshot or a DOM read in the failing state), one probe run per tool call, dev server on port 3007 via `lane-run probe` (3001 and 3006 are Alfonso's and the chat's).
2. Drift: update the probe to today's UI (close the dashboard or open the artifact the way the UI does; open the syntax chip instead of the old viewpoint listbox), keeping every assertion of the contract.
3. Regression: fix it in the splitter files, smallest change, and say so.
4. Gate: the full probe green, `npm run build` clean. Commit as soon as green: `test(probe): vsplit probe follows the dashboard and the syntax chip (P-2026-11-21-0155)` (plus a `fix(ui): ...` commit if a regression was fixed). Then the log entry and the Status flip in one docs commit.

## Stop and ask

- A failure is a regression that needs a file outside DOVE.
- An assertion of the contract would have to be weakened to pass.

## Lane discipline

`git add <specific files>` only; English everywhere; close with `Outcome: done | hard-stop | question | blocked`. Keep the session short: no audits beyond the 7 failures.
