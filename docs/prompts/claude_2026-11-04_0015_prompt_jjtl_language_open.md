# JjTL: missing target class, [*] warning, lazy and R-JTG-3, such that with bare names

Prompt-ID: P-2026-11-04-0015
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: full (language semantics, decided by Alfonso on 2026-11-03)
Depends: P-2026-11-04-0007
Worktree: ~/jjodel-w-jjtlopen, branch jjtl-language-open
Request: none (Alfonso's ok of 2026-11-03 21:07)

Before anything else run pwd, git branch --show-current, git status --short: ~/jjodel-w-jjtlopen on jjtl-language-open, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-0015 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call. Summary lines only, through node scripts/run-quiet.mjs. Commit as soon as gates are green, before any probe: this front hits the context ceiling in 15 to 30 minutes.

## COSA

Decided by Alfonso:

1. A rule whose target class does not exist in the target metamodel gives an error before the run writes anything: nothing is written. The high ticket of P-2026-11-03-1522 in docs/log-inbox/hw-notation.md describes it; find its number and close it in the log only (the chat closes it on GitHub). (Q: silent partial model today.)
2. [*]: a warning that says the count of targets is not settled. The meaning of [*] stays Alfonso's open question: do not define it, and do not change what it does today. The ticket from the same log.
3. lazy is exempt from R-JTG-3 when the class also has a matched rule: it does not compete in step 1.
4. The such that of forall sees bare names like the body does.

Register rows for 1, 3 and 4 as new R-JTG rows in docs/decisions.md with the next free numbers (R-JTG-15 and 16 exist), ratified by Alfonso 2026-11-03, checked against parseRows of frontend/scripts/gates/docs-digest.ts. Update frontend/src/jjtl/SPEC.md. Check the hardware fixtures and Class2Relational still give the same output; a bench that changes is reported with both numbers.

## DOVE

frontend/src/jjtl/ (parser, executor, validator, tests, SPEC.md), the panel only if a message does not reach it, docs/decisions.md (rows), docs/log-inbox/hw-notation.md, the Status line. Not touched: ProjectEditor.tsx unless the check before the write has no other home (then say so), critical zone, CLAUDE.md 3.2 files. Probes in ~/.jjodel-lanes/P-2026-11-04-0015/. The repo is public: name no partner company.

## COME

Tests first, one per decision, seen red for the intended reason. Mutation bench in the lane folder. Code and docs in separate commits, named paths. Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. One app probe: a rule on a missing class through the real Execute dialog, nothing written, the error in the panel. A probe is not a hand run. A question with one recommendation carries a line Recommended: <one line>. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».
