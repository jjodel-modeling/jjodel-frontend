# Prompt: lane board, progress milestones for running lanes (harness)

Prompt-ID: P-2026-10-05-1705
Chat: C-2026-10-05-1110
Lane: full (harness, scripts only; no Phase 1 hard stop: the design is fixed below). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: da eseguire
Worktree: `~/jjodel-w-boardprog`, branch `harness-board-progress`, cut by the chat from `alfonso-frontend-jjtl` at `57ff86f5d`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `57ff86f5d`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1705 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

The live lane board (`/lane monitor`, http://localhost:4700) is served by `/Users/alfonso/.jjodel-lanes/board/lane-board.mjs` (476 lines, Node, no dependencies, read-only) under the launchd agent `io.jjodel.lane-board`. For a running lane it shows state, kind, elapsed, a time-left estimate (`MEDIAN` per kind minus elapsed, corrected by `phaseOf`, the last tool `description` in `log.jsonl`) and the phase text. Alfonso asked (2026-10-05) whether one can tell how far a running lane has got. The phase text says what it does now, not how much is behind it. The sessions do not use TodoWrite (0 calls in the logs of 2026-10-04/05), so progress must be read from the stream-json log that `lane-run` already writes: tool names, Bash commands and descriptions, file paths of Edit/Write, git commits.

## COSA

1. **Port the board into the repo.** Copy `/Users/alfonso/.jjodel-lanes/board/lane-board.mjs` byte for byte to `frontend/scripts/lane-board.mjs` (grep the name first) in a first commit (`chore(harness): port the lane board into the repo (verbatim)`), so the next diff shows only the new work. The live copy under `~/.jjodel-lanes/board/` is not touched by the lane; the chat repoints the launchd agent after the merge.
2. **Milestones.** A pure function `milestones(kind, events)` (exported, unit-tested) that reads the parsed log events of one lane and returns the ordered milestone list for its kind, each `reached: boolean`, plus the current one. The ladders:
   - `phase2` and `fast`: Orient (`pwd`/`git log` at start) · Read (first Read/Grep of `frontend/src`) · Tests first (a test file written, or vitest run before any `frontend/src` edit) · Code (Edit/Write under `frontend/src`, not tests) · Gates (typecheck, vitest, build or `check:*` after the code) · Probe (`lane-run probe` or a probe script run) · Commit (a `git commit` whose message is not `docs:`) · Closure (a `docs:` commit touching `docs/log-inbox/` or the prompt's Status).
   - `discovery`: Orient · Read · Probe · Report (Write of `docs/discovery/*.md`) · Commit · Closure.
   - `merge`: Measure · Merge (`git merge`) · Gates · Commit · Closure.
   A milestone counts as reached when its signal appears; a later one may be reached while an earlier one is skipped (a lane without a probe): skipped ones show as skipped, not pending, once a later one is reached. The current milestone is the last reached one.
3. **Board.** In the running table add a column «Progress»: `n/m` plus a compact segmented bar (one segment per milestone: reached, skipped, pending) and the current milestone's name; the phase text stays. `/api` gains `progress: { reached, total, current, steps: [{name, state}] }` per live row (additive). The estimate uses the milestone fraction when it is available: left = max(0, median × (1 − fraction)) blended with the existing phase rule; keep «circa» semantics (never a promise) and the load correction.
4. **Tests.** Under the scripts test setup already in use (find it: `typecheck:scripts`, `check:scripts`, any `scripts/**/__tests__`): fixture logs (small synthetic `.jsonl`, plus one trimmed real log from `~/.jjodel-lanes/` copied into the fixtures, read-only source) for each kind, red before the implementation. Mutation bench on `milestones`.

## Tests and gates

Tests first, then `typecheck:scripts`, `check:scripts`, `check:docs`, `check:addonly`, the scripts tests; the app gates are not needed unless a file under `frontend/src` changes (none should). Run the ported board on port 4790 (never 4700, the live one) against the real `~/.jjodel-lanes/` and check `/api` shows `progress` for the running lane(s); save one screenshot of the table at 600 px wide (gitignored path) for the chat's check. Commits: the verbatim port, `test:`, `feat(harness):`, then the closure docs commit (Status flip with lane and the feat sha, entry in the harness log inbox under `docs/log-inbox/`).

## HARD STOP

- If the board cannot be ported without changing its behaviour beyond the additions: `Outcome: question`.
- After the closure commit: `Outcome: done`. Do not merge, do not touch `~/.jjodel-lanes/board/` or the launchd agent.

## NON FARE

No new dependency, no change under `frontend/src/`, no change to `lane-run.mjs` behaviour, no `git stash`, no `git add .`/`-A`/`-u`, no push, no files outside the worktree except reading `~/.jjodel-lanes/`.

## RIFERIMENTI

`CLAUDE.md`, `docs/PROTOCOL.md` P16 and RC-20..RC-32, `frontend/scripts/lane-run.mjs` (log format, kinds), the `/lane monitor` description in the lane skill; Alfonso's request of 2026-10-05.
