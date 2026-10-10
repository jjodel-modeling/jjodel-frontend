# Lane board: Earlier lanes newest first, chains included

Prompt-ID: P-2026-10-10-0840
Chat: C-2026-10-10-0840
Lane: fast (one file, `frontend/scripts/lane-board/lane-board.mjs`, outside the critical zone; cause measured). Model: tier light. No critical-zone go-ahead.
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardorder`, branch `lane-board-order`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0840 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
The "Earlier lanes" section is built by `renderOlder` (`lane-board.mjs:492-502`). It sorts the days newest first
(`:493`) but takes the rows of each day in the order `/api` returns them (`:497`). `collect()` (`:100-136`) keeps
the order of `lane-run status --all`, which prints the lanes by id descending (`lane-run.mjs:749`) and then appends
the chains (`:754`). Measured on `localhost:4700/api` at 08:40 on 2026-10-10: day 2026-10-04 reads
`2147 1832 … 0044 0010 chain-1130`, the chain at the bottom instead of between `1213` and `1025`. The order inside a
day is an accident of the CLI output, not a choice of the board, and the requested behaviour is reverse
chronological order.

## WHAT
1. In `collect()`, keep the time already computed at `:115` on the row as `row.t` (milliseconds, `0` when unknown).
2. In `renderOlder`, sort the rows of each day by `t` descending, ties broken by `id` descending, before building
   the table. The day order stays as it is.
3. Checks: `node --check frontend/scripts/lane-board/lane-board.mjs`; start this tree's board in the background on
   port 4701 (`node frontend/scripts/lane-board/lane-board.mjs --port 4701 --refresh 30`), `curl -s
   localhost:4701/api` and confirm that every row carries a numeric `t`; leave the process running and report its
   PID (the chat uses it for the visual check and stops it).
4. Commit the code as `fix(harness): lane board lists earlier lanes newest first` with an explicit pathspec, write
   the log entry in `docs/log-inbox/harness.md` uncommitted (RC-17), then stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch the Live table, "Last 24 hours", the Timeline or Insights tabs, `timeline.js`, `insights.js` or `lane-run.mjs`.
- Touch the launchd service `io.jjodel.lane-board` or anything on port 4700: it serves the trunk tree.
- Touch `~/.jjodel-lanes/board/`: it is a stale deployed copy.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-23.
