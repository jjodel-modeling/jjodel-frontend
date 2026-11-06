# JjTL write-back, close #482: panel line, gates, after-probes

Prompt-ID: P-2026-11-03-1057
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · 7146fda53 · panel line verified on the DOM by the probe, no manual look (unattended)
Lane: full (continues P-2026-11-03-1033 after its context ceiling)
Depends: P-2026-11-03-1033
Worktree: ~/jjodel-w-jjtlflush, branch jjtl-writeback-flush (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's request of 2026-11-03 10:20)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlflush` on
`jjtl-writeback-flush`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1057 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read only `~/.jjodel-lanes/P-2026-11-03-1033/handoff.md`, the diff of the wip commit, and what a step names.

## COSA

The fix is in the wip commit at HEAD~1. Finish it, in this order, committing each step:

1. Panel: `jjtl/components/JjtlDevelopmentEnv.tsx` (about lines 273-290) prints one line when `unwritten` is set: `Attributes not written in <model>: N value(s) of M object(s): <reason>`. Adopted as the previous lane recommended (RC-21). Test if the file has a testable seam.
2. Gates: `tsc`, full vitest (9 files red at import are the baseline), build, `check:docs`. Replace the wip by a further `fix:` commit, do not rewrite history.
3. After-probes with the probe in `~/.jjodel-lanes/P-2026-11-03-1033/probe/`, one run per tool call, `uptime` recorded before each. Comparable runs need a load under 15: if it is higher, wait with a command that returns (check again on the next call, at most 3 checks, then measure and mark the figure as loaded). Tab open:
   - `b11_9`, three runs: 2,560 of 2,560 `Const` keep `num`. The repeat of the before run at low load comes first, because the previous one ran at load 102.
   - `b7_7`, `b10_8`: before figures are in the handoff. `c60` before and after: `git stash` is forbidden; for the before figure run it in a separate call on the commit before the wip only if a cheap way exists (a flag in the probe is not one), otherwise use `c60` of the report section 4 and say the source.
   - `b10_8` under load, the load recorded; a forced failure of the wait reaches the panel.
   - Check the open item: the writer does not depend on the 600 ms seeding of `addObject`.
4. A walk loss seen at load 102: the 3 s per-level cap dropped over 1,006 subtrees, reported as not placed. Do not change the cap here. File one ticket with `lane-run ticket --front hw-notation --found P-2026-11-03-1033`, priority by what you measure, with the figures. If the acceptance at `b10_8` under load fails only for this, say so, with both numbers.
5. Report the before and after table in the log entry: click to attributes written, longest task, page quiet, `num` kept. A figure that worsens is reported. Say whether the 300 ms per level floor went; the flush per level is not implemented and stays out of this lane unless it is under ten lines in the DOVE.

## DOVE

As P-2026-11-03-1033, plus `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`, and `Status:` of both prompts. Same exclusions: no CLAUDE.md 3.2 file, reducer, `action.ts`, `joiner/classes.ts`, no TRANSACTION around creators. The repo is public: name no partner company.

## COME

Named paths. Update ticket #482 with the result, do not close it before the merge. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
