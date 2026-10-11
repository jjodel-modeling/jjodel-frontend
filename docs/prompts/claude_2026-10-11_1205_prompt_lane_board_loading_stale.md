# Lane board: a loading indicator, and the last good data instead of an empty table when lane-run status times out

Prompt-ID: P-2026-10-11-1205
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: fast (three files: `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoard.test.ts`; outside the critical zone; cause measured). No critical-zone go-ahead.
Depends: none
Status: eseguito 2026-10-11, lane P-2026-10-11-1205 (board-loading, f59f1ccd5), merged 9461bfd7c (P-2026-10-11-1221); visual check passed (chat, built-in browser on 4703, RC-23)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardload`, branch `board-loading`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1205 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): a question with one recommendation inside this lane's perimeter is answered as recommended
(RC-21).

## Context (measured by the chat on 2026-10-11 at 12:00, do not redo)
With the load average at 45, the board on `localhost:4700` showed `spawnSync /opt/homebrew/Cellar/node/23.3.0/bin/node
ETIMEDOUT` in red, the strip at `0 running` and "No lane is running." while at least four lanes were running
(P-2026-10-11-1150 among them). Cause: `collect()` (`lane-board.mjs:433-436`) runs
`spawnSync(process.execPath, [LANE_RUN, 'status', '--all'], { encoding: 'utf8', timeout: 15_000 })`; on timeout
`r.stdout` is empty, so `rows` is empty and the page draws an empty board as if it were the truth. `spawnSync` also
blocks the server's event loop for up to 15 s, so every other route (`/api/timeline`, `/api/insights`,
`/api/requirements`, which run their own `spawnSync` on git at `:730` and `:842` with 20 s timeouts) waits behind it.
On the page, `tick()` (`:1387-1395`) gives no sign that a request is in flight: the previous content stays until the
answer arrives, or is replaced by an empty table.

Alfonso asked for a visible sign that the board is loading. The chat adds the fix that makes the sign honest: a
timed-out status must never be shown as "no lanes".

## WHAT
1. **Server, last good snapshot.** In `collect()`, when `lane-run status --all` fails or times out and a previous
   successful snapshot exists, return that snapshot's rows with `stale: true`, `staleSince` (ms of the last success)
   and `error` (the failure, one line). Only when there has never been a success return empty rows, with `error`.
   A successful run clears `stale`. Keep the rest of `collect()` as it is.
2. **Server, no blocking.** Replace the `spawnSync` of step 1 with an asynchronous `spawn` (the module already
   imports `spawn`, `:19`), with the same 15 s timeout and a single run in flight at a time: a request that arrives
   while a run is in flight gets the current snapshot (marked `refreshing: true`) and does not start a second run.
   If `collect()` has synchronous callers that cannot become async without touching the other routes, say so and
   keep the refresh in the background (a promise started by the request, answered from the snapshot). Do not
   convert the git `spawnSync` calls of the other routes in this lane: list them in the report with their measured
   duration at the current load, for a later lane.
3. **Page, loading indicator.** One small indicator beside the "updated at" line (a spinner in CSS, no image, no new
   dependency) that is visible while any request to `/api` or `/api/*` is in flight, from any tab. Implement it once
   in the page script of `lane-board.mjs` (for instance by counting in-flight requests around `fetch` for URLs that
   start with `/api`), so that `timeline.js`, `insights.js` and `requirements.js` need no change. On the very first
   load, before any answer, the Lanes tab shows "Loading lanes…" instead of "No lane is running.".
4. **Page, stale data.** When the answer has `stale: true`, keep drawing the rows and show, in place of the red error
   line, an amber line: `Status timed out at load <x>; showing data from <HH:MM:SS>.` The strip counters use the stale
   rows. `refreshing` alone shows only the spinner.
5. **Test.** In `laneBoard.test.ts`, a test that fails before the change: with a `lane-run` stub that succeeds once
   and then times out (or exits non-zero), the second `/api` answer carries the first answer's rows, `stale: true`
   and a `staleSince` equal to the first success. Reuse the existing stubbing pattern of that file.
6. **README.** One short paragraph under the existing description of `/api`: the `stale`, `staleSince` and
   `refreshing` fields and what the page does with them.
7. **Checks.** `node --check frontend/scripts/lane-board/lane-board.mjs`; the board test files
   (`npx vitest run scripts/hooks/__tests__/laneBoard*.test.ts` from `frontend/`); `npm run check:scripts`. Start this
   tree's board on port 4703 (`node frontend/scripts/lane-board/lane-board.mjs --port 4703 --refresh 30`), confirm
   with `curl` that `/api` answers within 1 s while a status run is in flight, leave it running and report its PID.
8. Commit the code as `fix(harness): lane board keeps the last good data and shows a loading indicator`, with an
   explicit pathspec; write the log entry in `docs/log-inbox/harness.md` uncommitted (RC-17); stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch `timeline.js`, `insights.js`, `requirements.js`, `lane-run.mjs`, or any route other than `/api`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.
- Write into `~/.jjodel-lanes/` or into other worktrees. Lane P-2026-10-11-1150 (`~/jjodel-w-insightsmore`) is a
  read-only discovery on the same board: do not touch its tree.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-23.
- `frontend/scripts/lane-board/README.md`.
