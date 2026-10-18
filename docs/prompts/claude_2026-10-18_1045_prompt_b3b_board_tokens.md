# B3b: the lane board shows tokens in, out and total per lane, from lane-usage

Prompt-ID: P-2026-10-18-1045
Chat: C-2026-10-17-1757
Front: harness
Lane: fast (lane board and its test, one export in lane-usage.mjs; outside the critical zone; tier drawn (RC-45): heavy)
Status: da eseguire
Depends: P-2026-10-18-0100
Request: none (Alfonso, 2026-10-18 10:38, «in /lane monitor per ogni lane possiamo mettere anche il consumo di token in in e in out, e quello complessivo?»; his words kept in the lane folder's request.md, RC-43)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 (discovery report) does not apply: Phase 1 is report 2026-10-15 §5.6 (B3b) and the B1 log entry of P-2026-10-18-0100; one-session implementation lane (RC-17 fast lane). P8 applies in its RC-23 form: the chat checks the board in the built-in browser with measures from the DOM, no screenshot.

Worktree: `~/jjodel-w-boardtokens`, branch `lane-board-tokens`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Runs in parallel with P-2026-10-18-0945 (RC-22): disjoint DOVE, no shared interface.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`. Launched with `--tier heavy` from the RC-45 draw.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1045 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the log entry under «Decisions taken (unattended)».
Time limit: 90 minutes (RC-20). Priority if time runs short: items 1 and 2 first (the Lanes tab), then 3, then 4.
Output discipline (CLAUDE.md §0.1): `lane-board.mjs` is 1550 lines, read it with Read and `offset`/`limit` around the places named below; run tests through `node frontend/scripts/run-quiet.mjs`. Do not start the board on port 4700 (the launchd agent `io.jjodel.lane-board` owns it): for a manual check use `--port 4710`.

## Context (do not redo the analysis)
`frontend/scripts/lane-usage.mjs` (P-2026-10-18-0100, merged `dcd85da10`) computes per lane, from `log.jsonl`: main-session tokens per class (input, cache_read, cache_creation, output per call) deduplicated by `message.id`, the real output total from the last `modelUsage`, the per-call context series with max and median and the counts at or above 200k and 250k, the rate-limit readings and their delta, the overlap with other lanes. Its `laneUsage(id, intervals)` (line 155) and `summary(u)` (line 251) are module-private; the CLI prints text or JSON. The lane board (`frontend/scripts/lane-board/lane-board.mjs`, served on 4700 by the launchd agent, data root `JJODEL_LANES` at line 34) builds the Lanes table at line 1422 (`COL_W`, fixed widths: Alfonso asked for them on 2026-10-10 to avoid visual noise) and 1438 (`cols`, live and closed variants); the Insights tab (`/api/insights`, line 877, `logFacts` at 623) today reads only `total_cost_usd`, `modelUsage.outputTokens` and the `init` model. The board must keep answering within its 30 s refresh with 500 lane folders, so usage is cached per lane by `log.jsonl` size and mtime (the Timeline already keeps a best-effort cache at `~/.jjodel-lanes/board/timeline-cache.json`, README line 12: follow that pattern).

## COSA
1. `lane-usage.mjs`: export `laneUsage` and `summary` (and `allIntervals` if the board needs it) without changing the CLI's behaviour or output; the existing `laneUsage.test.ts` must stay green unchanged.
2. Lanes tab, both variants (live and closed): three columns after `Span`, `In`, `Out`, `Total`, and one `Ctx max`. `In` is the main session's input + cache_read + cache_creation; `Out` is the output total from the last `modelUsage` (the per-call output is the count at stream start, B1 entry); `Total` is `In + Out`; `Ctx max` is the largest per-call main context. Numbers abbreviated (`12.3k`, `3.1M`, en-US style, one decimal) with the exact integer in the cell's `title`; `n/a` when the lane has no per-call usage. Fixed widths in `COL_W` (about 72 px each; keep the table within its current overall width by trimming `Worktree` or `Launched by` if needed, say which in the entry). Subagent tokens are not in `In`: they go in the `title` of `In` as `subagents: <n> tokens`. `/api/lanes` (or whatever endpoint feeds the table) carries the same fields as integers (`tokensIn`, `tokensOut`, `tokensTotal`, `ctxMax`, `tokensSub`).
3. Insights tab: a block «Tokens» with, per tier and per model over the closed lanes in the current filter: lane count, median and sum of `Total`, median `Ctx max`, number of lanes with at least one call at or above 200k and 250k, and the sum of the seven-day utilization delta over the lanes marked `alone` (with the count of those lanes beside it, since it is a lower bound). Same abbreviation rules. `/api/insights` carries the raw numbers.
4. Cache: per lane, keyed by `log.jsonl` size and mtime, stored best effort next to the Timeline cache (`~/.jjodel-lanes/board/usage-cache.json`), so that a refresh recomputes only lanes whose log changed. Measure and put in the entry: cold start time over all lane folders and warm refresh time.
5. README: the four columns, the Tokens block, the cache file, and that `lane-usage.mjs` is the single source (the board never parses `message.usage` itself).
6. Tests in `frontend/scripts/hooks/__tests__/laneBoard.test.ts`, following its existing patterns: the four columns present in both variants with the abbreviation and the `title`, `n/a` for a lane without usage, the `/api/lanes` fields, the Insights Tokens block on a fixture with two tiers, the cache hit and miss (a changed mtime recomputes). Reuse the B1 fixtures under `__tests__/fixtures/lane-usage/` where they fit.

## Gates
`node frontend/scripts/run-quiet.mjs board -- npx vitest run frontend/scripts/hooks/__tests__/laneBoard.test.ts`, the same for `laneUsage.test.ts`, then the whole `scripts/hooks`; `npm run typecheck:scripts` exit 0; `npm run check:scripts` PASS; `npm run check:docs` after the docs commit (5/5). A manual run on `--port 4710` against the real `~/.jjodel-lanes` must render the Lanes table with the new columns; put the first data row's four values in the entry, then stop that process.

## Commits (P13, RC-17), explicit pathspecs
Commit 1, `feat(harness): lane board shows tokens in, out, total and context max per lane (P-2026-10-18-1045)` (shorten under 72 without the suffix, §6.2): `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/insights.js` if the client needs it, `frontend/scripts/lane-usage.mjs`, `frontend/scripts/hooks/__tests__/laneBoard.test.ts`, any new fixture. Trailer `Model:` (P6).
Commit 2, docs: `frontend/scripts/lane-board/README.md`, the log entry in `docs/log-inbox/harness.md` (§21.2; «Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end) and the Status flip of this prompt.
No push, no merge (RC-19); the chat merges and then restarts the launchd agent so the live board picks the new code.

## HARD STOP
None planned. Stop with `Outcome: question` only if computing usage for 500 lanes cannot be kept under about 2 s warm even with the cache; give the measured number and the recommended cut (for example usage only for lanes started after a date).

## NON FARE
Do not touch `lane-run.mjs`, `timeline.js`, `requirements.js`, any hook, `.claude/`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`. Do not restart or edit the launchd agent. Do not write under `~/.jjodel-lanes/` except the cache file in `board/`. No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI
`frontend/scripts/lane-usage.mjs` (155, 215, 251); `frontend/scripts/lane-board/lane-board.mjs` (34, 623, 877, 1059, 1422, 1438); `frontend/scripts/lane-board/README.md` (12, 158, 252); `frontend/scripts/hooks/__tests__/laneBoard.test.ts`, `laneUsage.test.ts`, `fixtures/lane-usage/`; `docs/log-inbox/harness.md` entry of P-2026-10-18-0100 (measured caveats: dedupe by `message.id`, output from `modelUsage`, `started.txt` rewritten on resume); `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.6 (B3b), §7.2; `docs/decisions.md` RC-16, RC-17, RC-20, RC-21, RC-22, RC-23, RC-25, RC-43, RC-45, RC-49; `docs/PROTOCOL.md` P6, P8, P13, P14.
