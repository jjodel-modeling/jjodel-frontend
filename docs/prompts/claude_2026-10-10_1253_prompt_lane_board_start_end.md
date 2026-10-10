# Lane board: Started and Ended columns in the Lanes tab

Prompt-ID: P-2026-10-10-1253
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one file, `frontend/scripts/lane-board/lane-board.mjs`, outside the critical zone)
Depends: none
Status: eseguito 2026-10-10, lane P-2026-10-10-1253 (lane-board-times, 635ddc919 and b8fa0e1bc), merged 339959aed; visual check passed (chat, built-in browser on 4701, RC-23)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardtimes`, branch `lane-board-times`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and
a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1253 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: Alfonso is away; a question with one recommendation inside this lane's perimeter is answered as
recommended (RC-21).

## Context (measured, do not redo the analysis)
Alfonso wants each lane's start and end time in the Lanes tab tables (Running, Last 24 hours, Earlier lanes).
Today the rows carry only `Elapsed`, and it misleads: on 2026-10-10 lane `P-2026-10-10-1150` ran about 10 minutes
but shows `0 min`, because `started.txt` is rewritten by every run (start, resume, go) and the row measures the last
run only. The timeline code already knows the true span: `lanes()` builds `turns` from the mtimes of `input-k.md`
and `exit.txt`/`result` events (`lane-board.mjs:141-222`), so the first turn's start and the last turn's end are the
lane's start and end.

## WHAT
1. In `collect()`, give each lane row `start` and `end` in epoch ms: `start` from the first turn's start, `end`
   from the last turn's end when the lane has exited, `0` while it runs. Reuse the turn computation (and its cache)
   rather than reading the files a second time; for a chain row take the earliest start and latest end of its
   lanes, or `0` when unknown. State which path you took.
2. In the client `table()`, add a `Started` column to all three tables and an `Ended` column to Last 24 hours and
   Earlier lanes, placed right before `Elapsed`. Format: `HH:MM` (24 h, local time) when the time falls on the row's
   own day (the start day; for Running, today), otherwise `MM-DD HH:MM`. Empty cell when the value is `0`.
3. Do not change what `Elapsed` measures. In the report, say in one line whether it should become `end - start` (or
   `now - start` while running), with your recommendation; the chat decides after this lane.
4. Checks: `node --check frontend/scripts/lane-board/lane-board.mjs`; `npm run check:scripts` from `frontend/`;
   start this tree's board in the background on port 4701 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4701-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4701 --refresh 30`
   (the env var keeps it off `~/.jjodel-lanes/board/`); with `curl -s localhost:4701/api` confirm that
   `P-2026-10-10-1150` has `start` about 11:5x and `end` about 12:0x local time, that a running lane has `end` 0,
   and paste three rows. Leave the board running and report its PID.
5. One code commit with an explicit pathspec, `feat(harness): lane board shows when each lane started and ended`,
   then the log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch the Timeline or Insights tabs, `timeline.js`, `insights.js` or `lane-run.mjs`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.
- Change the order of rows, the existing columns or their content.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23.
