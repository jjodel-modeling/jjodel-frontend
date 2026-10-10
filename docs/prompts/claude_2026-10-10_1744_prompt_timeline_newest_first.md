# Lane board Timeline: rows newest first

Prompt-ID: P-2026-10-10-1744
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one file, `frontend/scripts/lane-board/timeline.js`, outside the critical zone; cause measured)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-tlorder`, branch `timeline-newest-first`, cut from the trunk tip `177dc474b`; the docs commit
adding this prompt is the first commit on the branch (the trunk was busy with another chat's merge),
`frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -2` and a clean
`git status`. Otherwise stop with `Outcome: blocked`. Lane P-2026-10-10-1742 runs in parallel on
`lane-board.mjs` only; this lane touches `timeline.js` only.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1744 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
Alfonso wants the Timeline tab in reverse chronological order, as the Lanes tab already is (P-2026-10-10-0840).
In `render()` (`timeline.js:104`) the lanes are sorted by start ascending (`x.a - y.a`) before they are grouped,
so the groups appear in the order of their oldest lane and the rows inside a group run oldest first: the newest
work sits at the bottom of a long page. The time axis itself is not in question: it stays left to right.

## WHAT
1. Order the rows newest first: the groups by their most recent lane start, descending; the lanes inside a group by
   start, descending. Ties by Prompt-ID, descending.
2. Check whatever depends on that order inside `render()`: the packing of overlapping lanes into rows, the overlap
   buckets, the dependency and citation arrows, the expand/collapse state keyed by group, the selected-lane detail.
   None of them may change meaning; only the vertical order changes. State in the report what you checked.
3. The horizontal scroll keeps its current behaviour (it stays at the right end, on now, when it was there).
4. Checks: `node --check frontend/scripts/lane-board/timeline.js`; `npm run check:scripts` from `frontend/`; start
   this tree's board in the background on port 4702 (4701 belongs to lane 1742) with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`;
   report its PID and leave it running.
5. One code commit with an explicit pathspec, `feat(harness): lane board timeline lists the newest lanes first`,
   then the log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch `lane-board.mjs`, `insights.js` or `lane-run.mjs`.
- Change the time axis, the colours, the legend or the controls.
- Touch the launchd service `io.jjodel.lane-board`, ports 4700 and 4701, or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-22, RC-23.
