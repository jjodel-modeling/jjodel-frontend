# JjTL: the panel prints a run's warnings (#520, #445), then #474 and #447

Prompt-ID: P-2026-11-03-1553
Chat: C-2026-11-03-1020
Front: hw-notation
Status: da eseguire
Lane: full (small; last step of the plan for the open JjTL points)
Depends: none
Worktree: ~/jjodel-w-jjtlstep6, branch jjtl-panel-warnings-low (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlstep6` on
`jjtl-panel-warnings-low`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1553 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit each item as soon as its gates are green. Print only summary lines.

## COSA

1. #520: on a successful run the panel prints two fixed lines and never the warnings (`jjtl/components/JjtlDevelopmentEnv.tsx`, about lines 358-360). Print them. Then see the #445 line in the panel in the running app, with the Class2Relational fixture or the smallest source that yields it, and capture it. Without that sight the item is not done: nobody has seen it yet. Check that a run with many warnings does not flood the panel; if it does, say so and cap with a count.
2. #474: a repeated pointer in a many-valued source reference reaches the rules once (`ProjectEditor.tsx`, the source serializer, about lines 1556-1574). Deduplicate only features declared `unique`, after checking that the canvas double write this guards against does not return on the others. If it does return, leave it and report why.
3. #447: trace `init_dash` read-only: origin and whether it is new. Fix only if trivial.

## DOVE

`frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`, `frontend/src/components/project/ProjectEditor.tsx` only at the serializer lines (branch jjtl-output-tab-late has STEP 7 and STEP 8 open: stay away), tests beside them, `frontend/src/jjtl/SPEC.md` section 12 if a row changes, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-1553/`. Not touched: every CLAUDE.md 3.2 file. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (3 files red at import are the baseline), build, `check:docs`. Update the tickets, do not close them before the merge. A probe is not a hand run. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
