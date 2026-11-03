# Measure closed: the report on the JjTL write-back time

Prompt-ID: P-2026-11-03-1014
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-03 · lane jjtl-writeback-time · report f88a79bd8 · produzione non misurata
Lane: discovery (continues P-2026-11-03-0703 after its context ceiling; no product code)
Depends: P-2026-11-03-0703
Worktree: ~/jjodel-w-jjtlwbtime, branch jjtl-writeback-time (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's ok of 2026-11-03 06:41)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlwbtime` on
`jjtl-writeback-time`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1014 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. No product code. Read only `~/.jjodel-lanes/P-2026-11-03-0703/handoff.md`. Print only summary lines.

## COSA

Write the report first and commit it, from the handoff: `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md`, in English, beginning with `## 0. Answer in brief`, with the split, the growth, what the user sees, the critical zone cost, each figure marked measured or read, and the recommendation with its unmeasured part stated.

Then file one ticket, priority high, with `lane-run ticket --front hw-notation --found P-2026-11-03-0703`: at 5,119 objects the attribute write can run before the last commit; in two of three runs 2,048 of 2,560 `Const` objects lost `num`, and nothing reports it. A silent loss of model data. Include the reproduction and whether a smaller tree can hit it under load, if the existing runs say so.

Only then, if `uptime` reads under 8 and context allows, the production run of T with the existing probe, and add the figures to the report in a second commit. If not, say production is not measured.

## DOVE

Written: the report, `docs/log-inbox/hw-notation.md`, the `Status:` lines of this prompt and of P-2026-11-03-0703. Probes stay in `~/.jjodel-lanes/P-2026-11-03-0703/`. The repo is public: name no partner company.

## COME

`check:docs`. Docs-only commits, named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
