# Lane board: fixed column widths in the Lanes tab

Prompt-ID: P-2026-10-10-1742
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one file, `frontend/scripts/lane-board/lane-board.mjs`, outside the critical zone)
Depends: P-2026-10-10-1717
Status: eseguito 2026-10-10, lane P-2026-10-10-1742 (lane-board-columns, 034811a1f); visual check passed (chat, built-in browser on 4701, RC-23)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardcols`, branch `lane-board-columns`, cut from the trunk tip `177dc474b` or later; the
docs commit adding this prompt is the first commit on the branch (the trunk was busy with another chat's merge),
`frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -2` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1742 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
The Lanes tab has three kinds of table built by the client `table()`: Running, Last 24 hours, and one table per
day under Earlier lanes. Each uses automatic layout, so every table sizes its columns to its own content and the
widths change between tables and between refreshes. Alfonso's screenshot of 2026-10-10 17:41: `Started` sits at
x=742 in Running and at x=1005 in Last 24 hours, `Worktree` at 1553 and 1453; the `hard-stop` pill wraps on two
lines in a narrow Outcome cell; the Elapsed/Span values jump when a duration gets longer. He wants fixed column
widths so the tables stop moving.

## WHAT
1. Every Lanes-tab table gets `table-layout: fixed; width: 100%` and a `<colgroup>` whose widths come from one
   map keyed by column name, shared by all tables, so a column has the same width wherever it appears. Running and
   the exited tables have different column sets; give the shared columns the same width and let `Phase` (Running)
   and `Outcome` plus `Ended` (exited) take the room the others leave. The `Lane` column keeps the same width and
   left edge in all tables.
2. Pills (`State`, `Outcome`, `Launched by`) never wrap: `white-space: nowrap`, and the column wide enough for
   `hard-stop` and `lane-run`.
3. Time and duration cells (`Started`, `Ended`, `Elapsed`, `Span`, `Left`) use `font-variant-numeric:
   tabular-nums` and `white-space: nowrap`.
4. `Worktree` and `Phase` truncate with an ellipsis on one line and carry the full text in a `title`; the lane
   title under the Prompt-ID may wrap as today. No cell overflows into its neighbour.
5. Use class names that do not exist yet in the file (grep first). Do not change any column's content, the column
   order, the row order, or the Timeline and Insights tabs.
6. Checks: `node --check frontend/scripts/lane-board/lane-board.mjs`; `npm run check:scripts` from `frontend/`;
   start this tree's board in the background on port 4701 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4701-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4701 --refresh 30`;
   report its PID and leave it running.
7. One code commit with an explicit pathspec, `feat(harness): lane board tables with fixed column widths`, then the
   log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch `timeline.js`, `insights.js` or `lane-run.mjs`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-23.
