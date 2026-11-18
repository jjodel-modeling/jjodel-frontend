# Class2Relational: app probe, the #445 line, tickets, report

Prompt-ID: P-2026-11-03-1505
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · 6226edf31 · app probe through the Execute dialog, output equals the expected schema, same tree after reopen; #445 not in the panel (#520); no visual check by hand (unattended)
Lane: full (continues P-2026-11-03-1434 after its context ceiling)
Depends: P-2026-11-03-1434
Worktree: ~/jjodel-w-jjtlc2r, branch jjtl-class2relational (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's request of 2026-11-03 10:20)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlc2r` on
`jjtl-class2relational`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1505 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit each step. Print only summary lines. Read only `~/.jjodel-lanes/P-2026-11-03-1434/handoff.md`, the prompt of P-2026-11-03-1434, and the fixture.

## COSA

In this order, committing each:

1. Tickets, first, because they cost little and must survive a ceiling: W5 high (a `let` used twice runs the called rule at each use: extra roots and pointers outside their table, no warning), W2 medium, W6 medium, W1 low, W3 low, each with `lane-run ticket --front hw-notation --found P-2026-11-03-1434`, as a separate call each.
2. App probe on a free port, real Execute dialog, the output model read back against the fixture's expected schema (6 tables, 14 columns, 3 foreign keys, 3 types in one root schema). Save and reopen: same tree.
3. In the same probe, the #445 warning in the output panel: capture the line. Say whether it was seen in the panel.
4. Report `docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`, as the first prompt asks, with the natural version against the running one, the six workarounds, size figures, and a reasoned verdict on whether R-JTG-5, 6, 7 fit only the hardware shape. Separate what is the grammar or the implementation from what is the design. Include the question on `unique` for called rules with one recommendation.

No product code beyond what is committed. No fix of W1 to W6 here.

## DOVE

The report, the fixture and its test only if the probe shows they are wrong, `docs/log-inbox/hw-notation.md`, the `Status:` lines of both prompts. Probes in `~/.jjodel-lanes/P-2026-11-03-1434/`. The repo is public: name no partner company.

## COME

Named paths. Gates: `tsc`, full vitest (3 files red at import are the baseline), build, `check:docs`. A probe is not a hand run. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
