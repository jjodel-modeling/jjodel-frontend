# JjScript settle waits for in-flight dispatches (T8f option A, core)

Prompt-ID: P-2026-11-08-1759
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane jjscript-settle-inflight · fac890de5
Lane: full, core change (redux/action/action.ts, jjscript/executor/commands/instance.ts), two-phase Phase 2 with Layer Impact Report
Depends: T8f report docs/discovery/discovery_2026-11-08_t8f_reorder_hole.md (commit 000a8f1f4 on branch textual-t8e-match, file in ~/jjodel-w-textt8e; read it with git show 000a8f1f4:docs/discovery/discovery_2026-11-08_t8f_reorder_hole.md) and the probe in ~/.jjodel-lanes/P-2026-11-08-1718/
Worktree: ~/jjodel-w-jjsettle, branch jjscript-settle-inflight (from trunk 9cfe2bcc4, own node_modules)
Request: Alfonso 2026-11-08 17:58 «si a tutto» on: option A of the T8f report, T8e merged after it lands

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Core change allowed only in frontend/src/redux/action/action.ts and frontend/src/jjscript/executor/commands/instance.ts and their tests; no CLAUDE.md 3.1 file, no new dependency. Every reply opens with [P-2026-11-08-1759 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1759/handoff.md first.

## COSA

The race: settlePendingWrites (instance.ts:411-413) waits only for the dispatch it schedules itself; a write flushed by the 300 ms interval (reducer.ts:1549) has left the buffer but not reached the store (action.ts:352); the next += reads a stale list and writes past the end (reducer.ts:285-289), leaving a null hole.

(1) **Layer Impact Report** in docs/discovery/lir_2026-11-08_jjscript_settle_inflight.md, committed first: the two files, every caller of settlePendingWrites and of the async flush, the AT_TRANSACTION callbacks the async dispatch exists for (action.ts comment), what a bounded wait changes for each, risk.

(2) **Fix, option A**: action.ts keeps a count (or the promise) of composites between fire and dispatch; the settle in instance.ts, after its own timer, also waits until that count is 0, with a bounded wait (pick the bound, say why, and log once if it expires). The dispatch stays async; no change to the 300 ms interval.

(3) **Tests**, red first: a deterministic node test of the race if the harness allows it (a flushed write in flight while the next command reads); if it cannot be made deterministic in node, say why and use the forced probe as the red. The JjScript and textual test suites stay green.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run smoke if the script exists.

(5) **App acceptance**, with the probe of ~/.jjodel-lanes/P-2026-11-08-1718/ copied (it needs T8e's pairing only for the homonym shape: use its plain reorder mode on this branch, or apply the T8e commits in a throwaway worktree for the probe only, never in this branch): 0 holes in at least 80 natural reorders, and 0 in the forced shape adapted to the new wait; report the run time of a reorder before and after. Crop 1-reorder in ~/.jjodel-lanes/P-2026-11-08-1759/ (the list after a reorder, from the store).

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge the dash, Causa the dash, Layer Impact Report the LIR path), Status flip; left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/redux/action/action.ts, frontend/src/jjscript/executor/commands/instance.ts, their tests (grep the names first), the LIR. Nothing else; ask first.

## RIFERIMENTI

The T8f report (above), options table and Recommended A; ~/.jjodel-lanes/P-2026-11-08-1718/; CLAUDE.md on core changes and the Layer Impact Report.
