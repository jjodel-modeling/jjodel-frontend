# JjTL: nested creation of a missing class is an error; the undo group and a hidden tab

Prompt-ID: P-2026-11-04-0255
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: full (decided by Alfonso, ok of 2026-11-04 02:50)
Depends: P-2026-11-04-0048
Worktree: ~/jjodel-w-jjtlnested, branch jjtl-nested-hidden
Request: none (Alfonso's ok of 2026-11-04 02:50)

Before anything else run pwd, git branch --show-current, git status --short: ~/jjodel-w-jjtlnested on jjtl-nested-hidden, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-0255 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call. Summary lines only, through node scripts/run-quiet.mjs. Commit as soon as gates are green, before any probe.

## COSA

1. A nested creation of a class missing from the target metamodel is an error before the run writes anything, like R-JTG-17: nothing is written. Today it warns. Update R-JTG-17 (nested case, ratified by Alfonso 2026-11-04) and SPEC.md. The undeclared bindings and envLookup behaviours are not changed.
2. While the browser tab is hidden, timers are throttled to about one per second, so closeRunUndoStep reads every check as late (RUN_BUSY_MS, frontend/src/components/project/nestedMaterialization.ts) and the undo group stays open up to 180 s. Exempt that case with document.hidden: a late check while hidden does not count as busy. The group still does not close during a write. Fake timers and a stubbed document.hidden in the existing test.

Hardware fixtures and Class2Relational give the same output; a bench that changes is reported with both numbers.

## DOVE

frontend/src/jjtl/ (validator or executor, tests, SPEC.md), frontend/src/components/project/nestedMaterialization.ts and its test, docs/decisions.md (R-JTG-17), docs/log-inbox/hw-notation.md, the Status line. No critical zone, no CLAUDE.md 3.2 file. The repo is public: name no partner company.

## COME

Tests first, seen red for the intended reason. Mutation bench in ~/.jjodel-lanes/P-2026-11-04-0255/. Code and docs in separate commits, named paths. Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. One app probe for a nested missing class through the real dialog. A probe is not a hand run. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».
