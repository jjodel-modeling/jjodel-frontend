# Requirements tab: softgoal balance bars and the cluster by macro goal matrix

Prompt-ID: P-2026-10-11-1735
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: full (five files: req-trace, the tab, two test files, the lane-board README)
Depends: P-2026-10-11-1650
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-sgbalance`, branch `softgoal-balance`, cut from the trunk tip that carries the merge of
P-2026-10-11-1650 (`docs/goals/goal-tree.json` present), `frontend/node_modules` symlinked (P14). Before anything
else: `pwd`, branch, `git log -1`, a clean `git status`, and `test -f docs/goals/goal-tree.json`. Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1735 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
The Requirements tab (`frontend/scripts/lane-board/requirements.js`, data from `frontend/scripts/req-trace.mjs` through
`/api/requirements`) ends with "Opposing contributions": the 11 declared conflicts as closed groups, then "Pairs
without a declared conflict, by softgoal", 601 pairs in closed groups per softgoal (P-2026-10-11-0008 resume). The
chat measured on the live board that, for each softgoal, `goalModel.opposing` is exactly the Cartesian product of the
realized rows that help it and the realized rows that hurt it (`joinGoals`, `req-trace.mjs` about `:548-555`): SG-1 is
61 x 6 = 366 pairs, SG-4 67 x 1, SG-3 53 x 1, SG-2 26 x 3, SG-7 4 x 12. The pair tables carry no information beyond
those two sets, and read as noise. Alfonso asked in chat for a visual form; he approved the design below.

P-2026-10-11-1650 added to `docs/goals/` the macro goals (`goal-tree.json`: `[{id: "MG-n", name, description,
softgoals: [...]}]`), new softgoals from SG-8, negative contributions, and side effects between softgoals
(`correlations.json`: `[{from, to, kind, witnesses: [...], evidence, verified, why}]`). Read `docs/goals/README.md` and
the 1650 discovery report `docs/discovery/discovery_2026-10-11_goal_tree_hurts.md` for the shapes as merged; where
they differ from this prompt, the files win.

## WHAT
1. **req-trace.** `joinGoals` also returns `tree` (the content of `goal-tree.json`, or `[]` when absent) and
   `correlations` (the content of `correlations.json`, or `[]`), and per softgoal `balance: { softgoal, help: [ids],
   hurt: [ids] }` over realized rows, ids sorted as req-trace sorts rows. `opposing` stays in the output unchanged
   (other readers may use it). Absent files give empty arrays and no error. Update the header comment.
2. **Tab, section "Softgoal balance"** in place of "Pairs without a declared conflict, by softgoal" (the pair tables
   per softgoal go away; the declared-conflict groups stay as they are, under their own heading, after this section):
   - One block per macro goal in `tree` order (heading: id, name, its description as a muted line); softgoals not in
     any macro goal, or every softgoal when `tree` is empty, go in a last block "Other softgoals".
   - One row per softgoal: a fixed 200 px label (id, name, then a muted "n help · m hurt"), then a diverging bar on
     one shared scale for the whole section (px per row computed once from the largest side, so the bars compare
     across softgoals): hurting rows to the left of a centre axis in one red, helping rows to the right as one
     segment per cluster, largest first, two alternating blues with a 2 px gap, the cluster name and count in each
     segment's `title`. The left side has a fixed width (the largest hurt count at the shared scale), so the axes of
     all rows align.
   - Under the bar, the hurting rows as small monospace chips (red tint), each with the row title in `title`.
   - Clicking a segment opens, under that softgoal row, a list of the cluster's helping rows (id, title, kind,
     evidence) beside the hurting rows: the reader rebuilds any pair from it. One open list at a time per softgoal,
     remembered per viewer as the other groups are. Plain HTML and CSS, no library, no canvas.
3. **Tab, section "Clusters by macro goal".** A matrix after the balance section: one row per cluster (the order and
   names of the cluster groups above, unclustered last), one column per macro goal (plus "Other" when needed). A cell
   shows `+h / −k`: the cluster's realized rows that help, and that hurt, any softgoal of that macro goal; a row
   counts once per cell. Background in one sequential blue by `h + k` (five steps, empty cell blank); the `−k` part in
   the danger text colour when `k > 0`. Clicking a cell opens under the matrix the rows behind it with their
   contributions to that macro goal's softgoals. Fixed column widths.
4. **Tab, correlations.** When `correlations` is not empty, a closed group "Side effects between softgoals (n)"
   after the matrix: one line per link (`from` to `to`, kind, the witness ids as chips, `why` in `title`), ordered by
   macro goal of `from`, then of `to`.
5. **No layout shift.** Fixed widths everywhere; opening a list or a cell detail adds content below, never moves the
   bars, the axis or the matrix columns. No em dash in anything the tab renders.
6. **README.** `frontend/scripts/lane-board/README.md`: the three sections, what each reads, and that the pair
   tables were replaced because they were the product of two sets.
7. **Tests.** In `reqTrace.test.ts`: `tree`, `correlations` and `balance` from a fixture (absent files, a softgoal in
   no macro goal, unrealized rows left out). In `laneBoardRequirements.test.ts`, on the stub DOM: one bar row per
   softgoal under its macro goal; segments per cluster summing to the help count; the shared scale (equal counts give
   equal widths across softgoals); aligned axes; chips equal to the hurt set; a segment click opens the list with
   exactly that cluster's helping rows; matrix cell counts against a hand-computed fixture, each row once per cell;
   correlations group present only when the file has links; equal row heights with and without an open list. The old
   test of the per-softgoal pair groups (the one named "the pairs no conflict names, under one heading…") encodes the
   section this lane removes: replace it, say so in the report, keep the declared-conflict test unchanged. Run the
   new cases on the base commit and record that they fail. At least 8 single-point mutations over balance, scale,
   segments, matrix counting and the click handlers, one at a time on a `/tmp` copy; report each.
8. **Gates and live check.** `node --check` on both scripts; the `reqTrace`, `laneBoard`, `laneBoardStrip`,
   `laneBoardRequirements` and `laneBoardInsights` suites; `npm run check:scripts` and `npm run check:docs` from
   `frontend/`. Start this tree's board on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`,
   leave it running and report its PID and, from `/api/requirements`, the help and hurt counts per softgoal and the
   matrix totals per macro goal; the chat runs the RC-23 visual check (1400 px wide) and stops it.
9. **Commits.** One code commit with an explicit pathspec of the five files, subject within 72 characters:
   `feat(harness): softgoal balance and cluster matrix (P-2026-10-11-1735)`. Then the log entry in
   `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch any file under `docs/goals/`, `docs/decisions.md`, the clustering or the cluster keys.
- Remove `opposing` from the req-trace output, or change the declared-conflict groups.
- Touch `lane-board.mjs`, `timeline.js`, `insights.js`, `lane-run.mjs` or `lane-tracking.mjs`.
- Add a dependency or a charting library.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/goals/README.md`; `docs/discovery/discovery_2026-10-11_goal_tree_hurts.md`.
- `frontend/scripts/req-trace.mjs` `joinGoals`; `frontend/scripts/lane-board/requirements.js` `opposingSection`,
  `softgoalGroups`, `render`.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23.
