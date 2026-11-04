# JjTL: missing class in a let body is an error; [*] settled

Prompt-ID: P-2026-11-04-0900
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane full · 96b79cec3 · unit tests and mutation bench 4/5, no app probe and no visual check by hand (unattended)
Lane: full (language semantics; Alfonso delegated the decision to the chat, 2026-11-04 08:57)
Depends: none
Worktree: ~/jjodel-w-jjtllet2, branch jjtl-let-multiplicity
Request: none (Alfonso, 2026-11-04 08:57)

Before anything else run pwd, git branch --show-current, git status --short: the stated worktree and branch, clean, otherwise stop with Outcome: blocked. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime recorded before each timing run. Summary lines only, through node scripts/run-quiet.mjs. Commit each green step, before probes: lanes hit the context ceiling in 15 to 30 minutes. A question with one recommendation carries a line Recommended: <one line>. The repo is public: name no partner company. A probe is not a hand run. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso». Every reply opens with [P-2026-11-04-0900 · session <id>].

## COSA

1. A class missing from the target metamodel inside a let body is an error before anything is written, like R-JTG-17. If the static check cannot reach every let body, say which and stop with a question.
2. [*] settled: the bound says the rule fixes no count, and the rule creates one target per source. [n..*] creates n targets, its lower bound. Remove the warning of P-2026-11-04-0015 and the known limitation and open-gap passages in SPEC.md (4.4, 10, 12.3 gap 4). Check what [n..*] does today and report the change with both figures. A tests first for each.
3. Rows in docs/decisions.md with the next free R-JTG numbers, marked decided by the chat on Alfonso's delegation of 2026-11-04, not ratified word by word; checked through parseRows. Hardware fixtures and Class2Relational same output.

## DOVE

frontend/src/jjtl/ (validator, executor, tests, SPEC.md), docs/decisions.md, docs/log-inbox/hw-notation.md, the Status line. No critical zone, no CLAUDE.md 3.2 file.

## COME

Tests first, red for the intended reason. Mutation bench in ~/.jjodel-lanes/P-2026-11-04-0900/. Code and docs in separate commits. Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs.
