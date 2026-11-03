# JjTL write-back: open the output tab after the write (#475)

Prompt-ID: P-2026-11-03-1232
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · jjtl-output-tab-late · 3b8c3b51b · question to the chat (item 3: the canvas freeze needs a critical-zone file) · verifica visiva non applicabile (probe, frames in ~/.jjodel-lanes/P-2026-11-03-1232/)
Lane: full (visible behaviour of a JjTL run)
Depends: P-2026-11-03-1219
Worktree: ~/jjodel-w-jjtltab, branch jjtl-output-tab-late (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtltab` on
`jjtl-output-tab-late`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1232 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md` sections 0 and 6, the log entry of P-2026-11-03-1137, STEP 6c to STEP 8b of `ProjectEditor.tsx`.

## COSA

1. STEP 7 opens the output tab after the write-back ends, attributes and references included, also when the write-back reports a failure. Own commit. Failing test first if a seam exists; otherwise say so and rely on the probe.
2. Measure what moves: the probe mode `WB_OPENAFTER` of the report was never run. The report warns that the canvas cost is moved, not removed, and may freeze the UI as long as before, only later. The freeze must not simply change place.
3. The regression of the flush per level, now on the trunk: longest task `b7_7` 341 to 1,829 ms, `b10_8` 2,362 to 3,044 ms, `b11_9` up to 9,823 ms, since the tab renders everything in one long task. State whether step 1 removes it. If not, and the fix stays in the DOVE, spread the opening (for example yielding before it); never touch the auto-population. If it needs a critical-zone file, stop with `Outcome: question`, one recommendation, and the figures.
4. Honest status, only if it stays in `ProjectEditor.tsx`: the toast says «1 instances» (roots only) and the status bar reports conformance before the attributes exist. Otherwise file a ticket.
5. Say what the user sees between click and tab: if nothing tells them a run is writing, for how long. Do not add a progress UI here: file a ticket with the figure if it exceeds about 2 s.

## Acceptance

Probe in `~/.jjodel-lanes/P-2026-11-03-1033/probe/`, `uptime` before each run, comparable runs at load under 15 (at most 3 checks, then mark the figure as loaded). Before and after table against the trunk commit of this branch: click to attributes written, click to tab, longest task, event-loop lag max, page quiet, `Const` created, `num` kept, for `b7_7`, `b10_8`, `b11_9` and `c60`. No loss in any run; `b11_9` three of three. Save and reopen gives the same tree. A figure that worsens is reported, not hidden. Crops of the sequence for `b10_8` at click, during the write, tab open, in the lane folder, for Alfonso. This is a probe, not a hand run: do not write that a visual check passed.

## DOVE

`frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/nestedMaterialization.ts` and its test if needed, `frontend/src/jjtl/SPEC.md` section 12 if a row changes, `docs/log-inbox/hw-notation.md`, the `Status:` line. Layer Impact Report first, `docs/discovery/lir_2026-11-03_jjtl_output_tab_late.md`, because this changes what the canvas sync receives and when. Not touched: every CLAUDE.md 3.2 file, the reducer, `action.ts`, `joiner/classes.ts`; no TRANSACTION around creators (NN-12). The repo is public: name no partner company.

## COME

Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (9 files red at import are the known baseline), build, `check:docs`. Update #475. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
