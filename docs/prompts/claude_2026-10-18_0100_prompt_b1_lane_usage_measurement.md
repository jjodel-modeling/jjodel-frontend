# B1: lane usage measurement (plan usage, tokens per class, per-call context series), merge templates through the quiet runner

Prompt-ID: P-2026-10-18-0100
Chat: C-2026-10-17-1757
Front: harness
Lane: fast (new read-only script with tests, two template lines, one new doc; outside the critical zone; tier drawn (RC-45): heavy)
Status: da eseguire
Depends: P-2026-10-17-1945
Request: none (Alfonso, 2026-10-18 00:56, «lancia B1 adesso», in chat C-2026-10-17-1757; his words kept locally in the lane folder's request.md, RC-43)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 (visual check) does not apply, no UI is touched. P4 (discovery report) does not apply: Phase 1 is §2.4, §3.1, §5.1 and §7.2 to §7.3 of `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md`, already committed; this is a one-session implementation lane (RC-17 fast lane).

Worktree: `~/jjodel-w-usage`, branch `lane-usage`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned in `.claude/settings.json` (RC-16); effort `high` (B0, P-2026-10-17-1945). Launched with `--tier heavy` from the RC-45 draw.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-0100 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the log entry under «Decisions taken (unattended)».
Time limit: 90 minutes (RC-20). Priority if time runs short: item 1 with its tests first, then item 2, then item 3. An item not reached is written in the log entry as a ticket, not silently dropped.
Output discipline (CLAUDE.md §0.1): read code with Read and `offset`/`limit`; run tests and type checks through `node frontend/scripts/run-quiet.mjs`; the output-budget hook is active in this tree.

## Context (do not redo the analysis)
RC-49 (1) and (2): the harness is governed by usage against the plan limits, not by list-price dollars, and B1 is the batch that records that usage per launch (report §7.2, four items) plus the per-call main-context series that AM-8 needs (report §7.3). Today nothing records it: the lane board's Insights tab reads `total_cost_usd`, `modelUsage.outputTokens` and the `init` model from `log.jsonl` (`lane-board.mjs:623-660`), nothing reads `message.usage` per call or the `rate_limit_event` lines (measured in the report: every lane `log.jsonl` carries them; `auto-intake.mjs:639-651` already parses the fields). The B0 log entry (P-2026-10-17-1945) left a ticket: the merge templates call `npx vitest` directly, which the output-budget hook now denies (rule e), so the next merge lane would block on its test gate.

## COSA

### 1. `frontend/scripts/lane-usage.mjs` (new, Node, no dependencies, read-only)
Usage: `node frontend/scripts/lane-usage.mjs <Prompt-ID> [--json] [--write]` and `node frontend/scripts/lane-usage.mjs --all [--json]`. Lane folders live in `~/.jjodel-lanes/`; honour an environment variable `JJODEL_LANES_DIR` that overrides the root (tests use it; check first whether `lane-run.mjs` or `lane-board.mjs` already define such a variable and reuse its name if so).

For one lane it reads `log.jsonl` (plus `started.txt`, `exit.txt`, `tier.txt`, `session.txt` when present) and reports:
a. Model: the `init` event's `model` (first and, if different, last run); runs = number of `init` events; tier from `tier.txt`.
b. Tokens per model and per class for the main session: sum of `message.usage.input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens` over `assistant` events with no `parent_tool_use_id`, keyed by the event's model. Subagent tokens (events with a `parent_tool_use_id`) in a separate block keyed by model. State in a comment that `result.usage` is per invocation and `modelUsage` is cumulative over resumes (report §2.4, §4.2), which is why neither is used for the series.
c. Per-call main-context series: for each main `assistant` event, `input + cache_read + cache_creation` of that call, in order; report count, max, last, median, and the number of calls at or above 200,000 and 250,000 (the AM-8 thresholds, memo `docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md` §2). `--json` carries the full series; the table shows the summary only.
d. Rate-limit readings: first and last `rate_limit_event` of the log, with `rate_limit_info.unifiedWindows.five_hour.utilization`, `seven_day.utilization`, `seven_day.resetsAt`, `status`, `isUsingOverage`, `overageStatus`, and the delta of the two utilizations. If the log has fewer than two readings, say so instead of a delta. Read the exact field paths from a real lane log before coding (`~/.jjodel-lanes/P-2026-10-16-1000/log.jsonl` has nine readings); if the shape differs from the report, follow the log and say so in the entry.
e. Overlap: the lane's interval is `started.txt` (epoch ms) to the mtime of `exit.txt` (or now, if absent). List every other lane folder whose interval intersects it, and set `alone: true|false`. Print the fixed line «interactive sessions are not visible to lane-run: overlap is a lower bound» (report §7.2 item 2).
f. `--write` saves the JSON form as `usage.json` in the lane folder (the only write of the script; the lane board will read it in B3b). Without `--write` nothing is written.
`--all` prints one row per lane folder (newest first): id, tier, model, runs, main calls, context max, tokens by class (main), seven-day delta or `n/a`, alone. With `--json` an array of the per-lane JSON summaries without the series.
Errors: an unknown Prompt-ID or missing `log.jsonl` exits 1 with one line; a malformed JSON line is skipped and counted (`skippedLines`), never fatal.

### 2. Tests: `frontend/scripts/hooks/__tests__/laneUsage.test.ts` with fixtures under `frontend/scripts/hooks/__tests__/fixtures/lane-usage/`
Synthetic lane folders (two or three) built from short hand-written `log.jsonl` files: one lane with two `init` events (a resume) on two different models, main and subagent assistant events, three `rate_limit_event` lines; a second lane whose interval overlaps the first; a third alone and still running (no `exit.txt`). Cover: the per-class sums per model, main versus subagent separation, the series and the two threshold counts, first/last reading and delta, overlap and `alone`, the `n/a` cases, the skipped-line counter, and that nothing is written without `--write` and `usage.json` appears with it. Run the script as a child process or import its functions, whichever the existing hook tests do for `lane-run.mjs` (follow `laneRun.test.ts`). Keep every fixture under 60 lines; `started.txt`/`exit.txt` mtimes are set by the test, not committed.

### 3. Merge templates through the quiet runner
In `frontend/scripts/lane-templates/merge-into-trunk.md` (line 42) and `trunk-into-branch.md` (line 39), rewrite the three `npx vitest run ...` invocations so that they go through the runner: `node <path to run-quiet.mjs resolved from the directory where the command runs> <label> -- npx vitest run ...`, keeping the read-only wording and the counts those steps measure. Verify with the hook's own classifier (the test helpers of `outputBudget.test.ts`) that the new command lines are allowed and the old ones denied; add that check as one test case in `outputBudget.test.ts` only if the helpers make it a three-line test, otherwise put the two verdicts in the log entry. Nothing else in the templates changes.

### 4. `docs/harness/gates.md` (new)
The gate reference that report §5.2 assigns to this batch: the §17 lists of `CLAUDE.md` (commands, the known red files at import, the typecheck baseline of zero per RC-48, `check:*` scripts and what each rejects) copied into one document with a short header saying that the root keeps the same lists until B5a moves them out. Add the three lines the runner needs: where its logs go (`.agent-logs/`), the override marker of the output-budget hook, and that `lane-usage.mjs` is the measurement source. English, no em dashes, no restatement of rules that are not in §17.

### 5. `frontend/package.json`
One script entry, `lane:usage`, pointing at the new script. Nothing else.

## Gates (all green before the commits)
`node frontend/scripts/run-quiet.mjs lane-usage -- npx vitest run frontend/scripts/hooks/__tests__/laneUsage.test.ts`; the same for `outputBudget.test.ts`; `npm run typecheck:scripts` exit 0; `npm run check:scripts` PASS; `npm run check:docs` after the docs commit (5/5). Run the script for real on `P-2026-10-16-1000` and on `--all` and put the two first lines of each output in the entry body: the first measured numbers are the point of this lane.

## Commits (P13, RC-17: docs and code never together), explicit pathspecs
Commit 1, `feat(harness): lane-usage.mjs measures plan usage and per-call context per lane (P-2026-10-18-0100)`: `frontend/scripts/lane-usage.mjs`, `frontend/scripts/hooks/__tests__/laneUsage.test.ts`, the fixtures directory, `frontend/package.json`, and `outputBudget.test.ts` only if item 3 added the test case. Subject under 72 characters measured without the `(P-...)` suffix (§6.2); trailer `Model:` (P6).
Commit 2, `fix(harness): merge templates run vitest through the quiet runner (P-2026-10-18-0100)`: the two template files.
Commit 3, docs: `docs/harness/gates.md`, the log entry in `docs/log-inbox/harness.md` (§21.2, `Causa` honest, «Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end, the latter expected empty), and the Status flip of this prompt (eseguito, date, lane, sha of commit 1).
No push, no merge (RC-19; the chat runs `lane-run merge` after this lane closes).

## HARD STOP
None planned: the lane closes with `Outcome: done`. Stop with `Outcome: question` only if the `rate_limit_event` shape in the real logs makes item 1d impossible as specified, or if `laneRun.test.ts` offers no reusable pattern for running a script in tests.

## NON FARE
Do not modify `lane-run.mjs`, `lane-board.mjs`, any hook, `.claude/`, `CLAUDE.md`, `docs/PROTOCOL.md` or `docs/decisions.md`. Do not write anything under `~/.jjodel-lanes/` except through `--write` on the fixtures in tests. No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI
`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §2.4, §3.1, §4.2, §5.1 (recording), §5.2, §5.6 (B1), §7.2, §7.3, §7.5; `docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md`; `docs/decisions.md` RC-16, RC-17, RC-20, RC-21, RC-25, RC-26, RC-43, RC-45, RC-48, RC-49; `frontend/scripts/lane-board/lane-board.mjs:623-660` (what the board reads today); `frontend/scripts/auto-intake.mjs:639-651` (rate-limit fields); `frontend/scripts/run-quiet.mjs`; `frontend/scripts/hooks/output-budget.mjs` rule e; `docs/PROTOCOL.md` P6, P13, P14.
