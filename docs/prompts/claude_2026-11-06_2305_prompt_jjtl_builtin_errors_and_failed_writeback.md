# JjTL: builtin errors name the rule (R-FA-13), and what the app writes after a failed run

Prompt-ID: P-2026-11-06-2305
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-06 · lane full · 860597f15 (code), 8ef186680 (SPEC), 77732b93d (report) · app probe: a failed run writes no model, no ticket
Lane: full (unattended; measure first, then the smallest fix for item 1 only)
Depends: P-2026-11-05-2225
Worktree: ~/jjodel-w-jjtlbuiltin, branch jjtl-builtin-errors
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlbuiltin` on `jjtl-builtin-errors`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-06-2305 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines of probes and suites, never whole logs. Commit as soon as the gates are green. The repo is public: name no partner company, cite no path outside this tree in anything committed.

## COSA

Read R-FA-11, R-FA-12 and R-FA-13 in `docs/decisions.md`, and section 0 of `docs/discovery/discovery_2026-11-05_jjtl_method_failure.md`. Two items, in this order.

1. R-FA-13 (ratified by Alfonso 2026-11-06 23:02): a builtin that fails inside a JjTL expression names the rule and the source element in its error, with the same wording R-FA-12 uses for a failing method. Failing tests first (a builtin that throws in a binding, a guard, a forall collection and a helper body), then the change. List every existing test whose expected message changes. The node runs of P-2026-11-05-1400 on the inputs in `~/.jjodel-lanes/pending/corexf-inputs/` must stay byte-equal to the references.

2. Measure only: what the app does with the target model of a run that fails. With the probes of `~/.jjodel-lanes/P-2026-11-05-1400/` on a dev server of this tree (free port above 3010, never 3000, 3001 or 3003), import the metamodels and `rv_mc4` with `xlen` changed to a string in a private copy of the XMI, so that the import keeps it as text (R-XMI-1), and run `CoreSpec2SyncRTL.jjtl`. Report: whether a target model is created, how many objects it holds, what the JjTL output panel and the model panel say, a screenshot. Do not fix anything here: if a partial model is written beside the error, file a ticket with `lane-run ticket --front hw-notation --found P-2026-11-06-2305`, with the reproduction, and give a recommendation.

Report: `docs/discovery/discovery_2026-11-06_jjtl_builtin_errors_failed_writeback.md`, in English, beginning with `## 0. Answer in brief`, each figure marked measured or read.

## DOVE

Written: the JjTL executor and its tests, `frontend/src/jjtl/SPEC.md` §10, the report, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` if item 1 changes what JjEL does outside JjTL, needs a critical-zone file, or breaks an exported interface outside this lane. Stop the dev server when done. A load average above 20 invalidates a timing: say so.

## COME

The usual gates. Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
