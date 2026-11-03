# Measure: where the time of a large JjTL write-back goes (#475)

Prompt-ID: P-2026-11-03-0703
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: discovery (no product code; one probe outside the repo, one report, one docs-only commit)
Depends: P-2026-11-03-0539
Worktree: ~/jjodel-w-jjtlwbtime, branch jjtl-writeback-time (at the commit that adds this prompt)
Request: none (Alfonso's ok of 2026-11-03 06:41; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlwbtime` on
`jjtl-writeback-time`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-0703 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. No product code. Never print a whole log or profile: only summary lines. Check `uptime` before each run and report it; measure with a load under 8 where possible.

## COSA

Ticket #475: scenario T of `~/.jjodel-lanes/P-2026-11-02-2338/probe/b2-writeback.ts` writes 2,559 lowered objects in 16 to 24 s, against under 1 s in the executor. Say where the time goes, with a CPU profile in the running app on a free port, as `frontend/scripts/probe/large-model-click-profile.ts` does. No fix.

1. Split the total: executor, STEP 6, the nested walk with its 50 ms polls and caps, pointer writes, Redux and React work after the writes. Dev and production build, if the production build is reachable.
2. Growth: 500, 1,000, 2,500 and 5,000 objects. Linear or worse, by phase. Depth versus width if it changes the answer.
3. Is the waiting polling (time asleep) or work (CPU)? Is the tree editable meanwhile, and what does the user see?
4. Does the same cost hit the critical zone (`useJjomSync.ts`, etc.)? Name it, do not touch it.
5. One recommendation with the expected gain of each candidate, and which files it would touch. If the cause is not a single one, say so. A batch write inside a TRANSACTION around creators is forbidden (CLAUDE.md, NON-NEGOTIABLE 12): do not propose it.

Report: `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md`, in English, beginning with `## 0. Answer in brief`, each figure marked measured or read.

## DOVE

Written: the report, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-0703/`. The repo is public: name no partner company.

## COME

`check:docs`. One docs-only commit, named paths only. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
