# JjTL: a demand compared or called as a method stops the run (S2, second part)

Prompt-ID: P-2026-11-08-0835
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane fast · d2fabcef7 (executor and tests), 5e10ad449 (SPEC), 0da9a8a2e (R-JTG-30)
Lane: fast (one executor change and its tests; unattended)
Depends: P-2026-11-08-0740
Worktree: ~/jjodel-w-demandcmp, branch jjtl-demand-cmp
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-demandcmp` on `jjtl-demand-cmp`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0835 · session <id>]`. No subagents, no background tasks. Print only summary lines of suites. Commit as soon as the gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Read R-JTG-25 (a demand used as a value stops the run) and the S2 tests in `frontend/src/jjtl/executor/__tests__/demand-as-value.test.ts`. Alfonso decided on 2026-11-08 08:33: the error extends to a comparison (`==`, `!=`, `<`, `<=`, `>`, `>=`) with a demand as an operand and to a method call whose receiver is a demand; a property read on a demand (`envLookup(n).name`) stays a warning with `null`, as R-FA-12 leaves a read on a missing feature.

1. Failing tests first, on both parser paths, beside the existing ones: each comparison operator, a method call on `envLookup(n)` and on a called rule's result; the property read stays a warning. A demand that a binding places stays legal.
2. The change, in the same subclass of the evaluator S2 added in `executor.ts`; same error wording.
3. One row in `docs/decisions.md` after R-JTG-29, ratified by Alfonso 2026-11-08 08:33, registered by P-2026-11-08-0835, evidence: measured, verified: none, reversible: trunk; checked with `scripts/gates/docs-digest.ts`.

Gates: typecheck, the FULL vitest suite (report only files that differ from the known import-red ones), `check:docs`. No app probe.

## DOVE

Written: `frontend/src/jjtl/executor/executor.ts`, `demand-as-value.test.ts`, `frontend/src/jjtl/SPEC.md` §10, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` if an existing test or fixture compares or calls a demand legally today.

## COME

Docs and code in separate commits, named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
