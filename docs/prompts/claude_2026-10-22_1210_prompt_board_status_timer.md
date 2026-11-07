# Lane board: the status timeout fires because the board's own synchronous git calls block its event loop

Prompt-ID: P-2026-10-22-1210
Chat: C-2026-10-22-1050
Front: harness
Lane: fast (bug fix on the 4700 board, allowed by R-TACK-2; measured cause)
Depends: P-2026-10-22-1140
Status: eseguito 2026-10-22 · lane board-timer · ab4824a83
Corregge: none
Request: Alfonso, 2026-10-22 11:34, in the project chat: «lane monitor non carica le info»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (cause measured below). P8 replaced: the chat checks the board and the tray after the merge.

Worktree: `~/jjodel-w-boardtimer`, branch `board-timer`, created by the chat from `alfonso-frontend-jjtl` at `3c90455bd` (after the status-cache merge). Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-22-1210 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as the gates are green. Do not restart or stop the launchd agent `io.jjodel.lane-board`; run your own board instance on port 4790 (`--port 4790`) for checks and stop it before you exit.

## Context
Measured by the chat at 12:02, after P-2026-10-22-1140 reached the trunk: `lane-run status --all` takes 0.31 to 0.63 s from a shell, also under `env -i` with launchd's PATH and `/opt/homebrew/bin/node`. Yet `GET localhost:4700/api` still answers `{"error":"lane-run status timed out after 15 s","rows":[]}` after a `launchctl kickstart -k`, and the request itself takes 15.5 s. The board runs heavy synchronous git calls on its own event loop: `promptCommits()` (`lane-board.mjs` near line 1016, `spawnSync('git', ['log', '--all', '--diff-filter=A', '--name-only', ...,'--', 'docs/prompts/'])`, 6.75 s measured alone), the `cat-file --batch` near line 1064, and the `git` helper near line 1160, each with a 20 s timeout. While one of them blocks the loop, the `setTimeout` of `runStatus` (line 622, `STATUS_KILL_MS = 15_000`) and the child's `close` event both wait; when the loop frees, the timers phase runs first, so the kill wins and a child that finished in 0.4 s is reported as timed out.

## COSA
1. Make the board's git reads asynchronous (`spawn` or `execFile` with a promise, same arguments, same timeouts, same parsing), so none of them blocks the event loop; keep their caches (`launchMem` and the others) and their 5-minute windows. Callers that are synchronous today become async along the path that serves `/api` and `/api/attention`; responses keep their shape byte for byte.
2. In `runStatus`, measure the timeout on the child's own runtime: when the timer fires but the child has already exited (`child.exitCode !== null` or a `close` already queued), resolve from its output instead of killing. Keep `STATUS_KILL_MS`.
3. Tests beside the board's existing tests: `runStatus` with a fake child that exits at 100 ms while the loop is blocked for 200 ms past the kill time returns ok; a child that really hangs is still killed; the promptCommits parse is unchanged on a fixture.
4. Measure on your 4790 instance: `/api` time and `error` field over five requests, with a `node -e` busy loop of 20 s running beside it to load the Mac; report the figures.
5. Gates: the board tests, `typecheck:scripts`, `check:scripts`, `check:docs`.
6. One `fix(lane-board)` commit, one docs commit with the log entry in `docs/log-inbox/harness.md` and this prompt's `Status:` line.

## DOVE
`frontend/scripts/lane-board/lane-board.mjs`, its tests under `frontend/scripts/`, `docs/log-inbox/harness.md`, this prompt file.

## NON FARE
No new board features (R-TACK-2: the 4700 board takes bug fixes only); no change to `lane-run.mjs`, to the plist, or to the page markup. No push, no merge.
