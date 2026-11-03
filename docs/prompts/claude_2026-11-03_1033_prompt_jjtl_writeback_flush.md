# JjTL write-back: no silent loss of nested attributes (#482)

Prompt-ID: P-2026-11-03-1033
Chat: C-2026-11-03-1020
Front: hw-notation
Status: da eseguire
Lane: full (behaviour of the JjTL write-back in the app)
Depends: P-2026-11-03-1014
Worktree: ~/jjodel-w-jjtlflush, branch jjtl-writeback-flush (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlflush` on
`jjtl-writeback-flush`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1033 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines of probe logs. Read `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md` sections 0, 5, 6, then the real code: STEP 6c and STEP 8 of `ProjectEditor.tsx`, `nestedMaterialization.ts`, `settlePendingWrites` in `jjscript/executor/commands/instance.ts`.

## COSA

Ticket #482: the nested-attribute writer (`writeNestedAttributes`, started by a fixed 1,000 ms timer after the walk) can run before the commit that creates the last level's slots. At 5,119 objects, in two of three runs, 2,048 of 2,560 `Const` lost `num`, reported only in the console.

1. Failing test first, at the lowest level that reproduces the ordering.
2. The writer waits for what it needs instead of a fixed time: the commit that creates the slots, and also the seeding of `addObject` (a comment in the code says its json values land on a timer of `U.UpdatingTimer * 2`, so a flush alone may not be enough: check it, do not assume). The wait is bounded.
3. If the wait does not complete, or a feature is still missing when written, the user sees an error in the transformation output panel naming how many objects and attributes were not written. Never console only.
4. Say whether this removes the floor of about 300 ms per level: measure on the comb `c60`. Removing it is welcome, not required; if it needs a further change outside the DOVE, name it.

Not in this lane: opening the output tab later, the toast and status bar wording (next lanes).

## Acceptance

With `~/.jjodel-lanes/P-2026-11-03-0703/probe/wbtime.ts` on a free port, copied into this lane's folder if it needs edits: `WB_SIZES=b11_9`, tab open, 2,560 of 2,560 `Const` keep `num` in three of three runs. `b10_8` under heavy load (`uptime` recorded at the run): all written. A forced failure of the wait reaches the panel. Before and after table in the log entry: click to attributes written, longest task, page quiet, for 511, 2,559, 5,119 objects and `c60`. A figure that worsens is reported, not hidden. A probe result counts only if its mtime follows the run. Say that this is a probe, not a hand run.

## DOVE

`frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/nestedMaterialization.ts`, `frontend/src/components/project/__tests__/nestedMaterialization.test.ts`, a new test beside it if needed, `frontend/src/jjtl/SPEC.md` section 12 if a row changes, `docs/log-inbox/hw-notation.md`, the `Status:` line of this prompt. Probes in `~/.jjodel-lanes/P-2026-11-03-1033/`.

Not touched: the reducer, `action.ts`, `joiner/classes.ts`, `useJjomSync.ts` and every CLAUDE.md 3.2 file. No TRANSACTION around creators (NN-12). If the fix needs any of them, stop with `Outcome: question` and one recommendation. Layer Impact Report first: `docs/discovery/lir_2026-11-03_jjtl_writeback_flush.md`, because the timing of what `useJjomSync` receives may change. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (9 files red at import are the known baseline), build, `check:docs`. Update ticket #482 when the fix is committed, do not close it before the merge. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
