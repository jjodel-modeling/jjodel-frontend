# JjTL: a failed run returns no target model

Prompt-ID: P-2026-11-07-1125
Chat: C-2026-11-03-1202
Front: hw-notation
Status: da eseguire
Lane: fast (one executor change and its test; unattended)
Depends: P-2026-11-06-2305
Worktree: ~/jjodel-w-jjtlnotarget, branch jjtl-failed-run-no-target
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlnotarget` on `jjtl-failed-run-no-target`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1125 · session <id>]`. No subagents, no background tasks. Print only summary lines of suites. Commit as soon as the gates are green. The repo is public: name no partner company, cite no path outside this tree in anything committed.

## COSA

Read section 0 of `docs/discovery/discovery_2026-11-06_jjtl_builtin_errors_failed_writeback.md`. The executor returns a partial target model when a run fails (938 of 2,524 objects in node); the app discards it only because `ProjectEditor.tsx` returns early. Alfonso decided on 2026-11-07 11:21 that the executor itself returns no target model for a failed run, so that no caller can write a partial one.

1. Failing test first: a transformation whose second rule fails returns `success: false`, its errors, its warnings and its trace as today, and no target model (state which value, `undefined` or `null`, matches the declared type of the result). The existing callers must keep compiling.
2. The change, in the smallest place in the executor. List every caller of the result's target model (grep) and say for each that a failed run already stops before reading it, or what changes.
3. Register one row in `docs/decisions.md` after R-FA-13: R-FA-14, ratified by Alfonso 2026-11-07 11:21, evidence: read, verified: none, reversible: trunk. Check it with `scripts/gates/docs-digest.ts` before committing.

Gates: typecheck, the JjTL and JjEL suites, `check:docs`. No app probe. Docs and code in separate commits.

## DOVE

Written: `frontend/src/jjtl/executor/executor.ts`, a test under `frontend/src/jjtl/executor/__tests__/`, `frontend/src/jjtl/SPEC.md` §11 if it describes the result, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` if a caller outside `jjtl/` reads the target model of a failed run, or the result type is an exported interface that breaks outside this lane.

## COME

Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
