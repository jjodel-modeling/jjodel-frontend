# lane-run status --all: cache the outcome of exited lanes so the board stops timing out

Prompt-ID: P-2026-10-22-1140
Chat: C-2026-10-22-1050
Front: harness
Lane: fast (one function family in lane-run.mjs, measured cause; the 4700 board is not touched, R-TACK-2)
Depends: none
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-22 11:34, in the project chat: «lane monitor non carica le info»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (cause measured below). P8 replaced: the chat checks the board and the tray after the merge.

Worktree: `~/jjodel-w-statuscache`, branch `status-cache`, created by the chat from `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-22-1140 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as the gates are green. Do not run `lane-run start`, `resume`, `merge` or `go` against the real `~/.jjodel-lanes`; tests use their own temporary root.

## Context
Measured by the chat at 11:35 on the Mac: the board on 4700 answers `{"error":"lane-run status timed out after 15 s","rows":[]}` (`lane-board.mjs`, `STATUS_KILL_MS = 15_000`), so the board and the Lane Monitor tray show nothing. `node scripts/lane-run.mjs status --all` alone takes 10.4 s with load average 6.6, over about 740 lane folders; under any load it passes 15 s. A CPU profile of that run: `events` (lane-run.mjs:557) 4.2 s self, `Buffer.slice` 2.0 s, `readSync` 1.4 s, GC 0.3 s, `lastOutcome` 0.45 s. The cause: `laneState` calls `lastOutcome(f.log, from.log)` for every exited lane on every call, which parses the whole `log.jsonl` again, although an exited lane's log never changes. `statusAll` also calls `runLines(laneFiles(id))` and discards the result (only `completeRun`'s one-time write-back is wanted there).

## COSA
1. In `laneState`, for an exited lane, read the outcome and fate from a cache file in the lane folder (`state-cache.json`), valid only while its key matches: the `exit.txt` mtime, the `log.jsonl` size, `latestRunFrom(f).log`, and the presence of `resolved.txt` is read live as today (never cached). On a miss, compute as today and write the cache atomically (tmp then rename). A running lane never reads or writes the cache. A cache that does not parse is a miss, never an error.
2. In `statusAll`, replace the discarded `runLines` call with `completeRun` inside the same try/catch semantics `runLines` gives it (a failure never stops the listing).
3. Tests in the existing lane-run test file: a hit returns the stored outcome without reading the log (spy or a log replaced after the first call); a resumed lane (log grown, new exit mtime) misses and recomputes; a corrupt cache file is ignored; output of `status --all` identical with and without the cache on a fixture of several lanes.
4. Measure on the real root, read-only: `time node scripts/lane-run.mjs status --all` twice (first fills the cache, second hits it); report both times and that the two outputs are byte-identical to the run before the change (save it first).
5. Gates: the lane-run tests, `typecheck:scripts`, `check:scripts`, `check:docs`.
6. One `perf(lane-run)` commit, one docs commit with the log entry in `docs/log-inbox/harness.md` and this prompt's `Status:` line.

## DOVE
`frontend/scripts/lane-run.mjs` (`laneState`, `statusAll`, a helper beside them), its test file under `frontend/scripts/`, `docs/log-inbox/harness.md`, this prompt file.

## NON FARE
No change to `lane-board.mjs` or its timeout; no change to the meaning of any status field; no change to `runs.jsonl`. No push, no merge.
