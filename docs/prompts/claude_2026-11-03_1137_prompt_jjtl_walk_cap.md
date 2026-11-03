# JjTL write-back: the walk does not drop levels on elapsed time (#486)

Prompt-ID: P-2026-11-03-1137
Chat: C-2026-11-03-1020
Front: hw-notation
Status: da eseguire
Lane: full (behaviour of the JjTL write-back in the app)
Depends: P-2026-11-03-1057
Worktree: ~/jjodel-w-jjtlflush, branch jjtl-writeback-flush (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's request of 2026-11-03 10:20)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlflush` on
`jjtl-writeback-flush`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1137 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read only `nestedMaterialization.ts`, its test, STEP 6c of `ProjectEditor.tsx`, ticket #486, the log entry of P-2026-11-03-1057.

## COSA

The acceptance of #482 is not met: `b11_9` run 1 at load 13.4 never created 2,048 `Const`, because `SLOT_WAIT_CAP_MS` (3 s per level, `nestedMaterialization.ts:111`) ran out. A load of 13 is ordinary on this machine.

1. Set #486 to high, with the reason above. Grep `docs/decisions.md` for the cap: if a row Alfonso ratified fixes it, stop with `Outcome: question` and one recommendation.
2. Failing test first: a level whose slots answer slowly but steadily is not dropped; slots that stop answering are.
3. The limit counts time without progress (no further slot answering, no commit), not elapsed time per level. Still bounded, with a total bound you state and justify, and still reported in the panel when it fires. Never an unbounded wait.
4. A flush once per level, if it stays in the two files of the DOVE: the walk does not wait for the 300 ms commit. Check against the report's `settlePendingWrites` precedent. If it does not fit, say why and leave it.

Not in this lane: opening the output tab later.

## Acceptance

Probe in `~/.jjodel-lanes/P-2026-11-03-1033/probe/`, `uptime` before each run. `b11_9` tab open, load under 15: 2,560 of 2,560 in three of three, created and with `num`. If the load is above 15, check again on the next call, at most 3 checks, then measure and mark the figure as loaded: a loaded run does not count toward the three. At least one `b11_9` under heavy load, the load recorded; figures reported whatever they are. Any load you generate stops within the same call. `c60`: median gap between levels. `b7_7`, `b10_8`. Before and after table against `208731e0e` in the log entry: click to attributes written, longest task, page quiet, `Const` created, `num` kept. A figure that worsens is reported. A forced stop of the slots still reaches the panel. This is a probe, not a hand run.

## DOVE

`frontend/src/components/project/nestedMaterialization.ts`, its test, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/jjtl/SPEC.md` section 12 if a row changes, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-1033/probe/`. Not touched: the reducer, `action.ts`, `joiner/classes.ts`, every CLAUDE.md 3.2 file; no TRANSACTION around creators (NN-12). If the fix needs them, stop with `Outcome: question`. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (9 files red at import are the known baseline), build, `check:docs`. Update #482 and #486 with the result, do not close them before the merge. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
