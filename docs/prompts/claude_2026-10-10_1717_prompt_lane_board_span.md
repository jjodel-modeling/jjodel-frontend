# Lane board: a Span column beside Elapsed

Prompt-ID: P-2026-10-10-1717
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one file, `frontend/scripts/lane-board/lane-board.mjs`, outside the critical zone)
Depends: P-2026-10-10-1253
Status: eseguito 2026-10-10, lane P-2026-10-10-1717 (lane-board-span, 960294cd4), merged 177dc474b; visual check passed (chat, built-in browser on 4701, RC-23)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardspan`, branch `lane-board-span`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and
a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1717 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
Lane P-2026-10-10-1253 (merged `339959aed`) added `Started` and `Ended` to the Lanes tab and made `Elapsed` the
working time, the sum of the turns (`lane-board.mjs:866`, columns at `:872`). Alfonso wants both measures shown:
the working time and the span from start to end, waits for decisions included. On 2026-10-10 lane
`P-2026-10-10-0045` reads 00:45 to 08:24 with Elapsed 34 min: the two numbers answer different questions.
The file was also touched after 1253 by the merge `25383392a` (lane-board-model-insights); read the current trunk
version, not the 1253 diff.

## WHAT
1. Add a `Span` column right after `Elapsed` in all three tables: `end - start` for an exited lane,
   `now - start` for a running lane, empty when `start` is 0 or, for an exited lane, `end` is 0. Same duration
   format as `Elapsed`. Compute it from the `start` and `end` the rows already carry; no new file reads.
2. Give the two headers a `title` tooltip: `Elapsed`: "Working time: the sum of the lane's turns".
   `Span`: "From start to end, waits for decisions included".
3. Checks: `node --check frontend/scripts/lane-board/lane-board.mjs`; `npm run check:scripts` from `frontend/`;
   start this tree's board in the background on port 4701 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4701-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4701 --refresh 30`;
   report its PID and leave it running.
4. One code commit with an explicit pathspec, `feat(harness): lane board shows the span beside the working time`,
   then the log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Change what `Elapsed`, `Started` or `Ended` show, the row order, or any other column.
- Touch the Timeline or Insights tabs, `timeline.js`, `insights.js` or `lane-run.mjs`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-23.
