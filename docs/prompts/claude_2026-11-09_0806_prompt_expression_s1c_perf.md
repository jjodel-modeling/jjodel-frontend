# Expression catalog S1c: open time and Auto layout on the folded DDR4 model

Prompt-ID: P-2026-11-09-0806
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (critical zone CLAUDE.md §3.1, `viewpoint/ir/`; go-ahead of Alfonso 2026-11-08 23:39, this lane chosen 2026-11-09 08:04)
Status: eseguito ⚠️ hard-stop (measure only; fixes in P-2026-11-09-0900 and P-2026-11-09-0952)
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-09-0108

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica in forma separata (motivo: step 1 is the measurement and its report section; no Phase 2 GO is
needed inside the scope below).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt, on top of the S1b
code `b42ddc837`. Expected tree: the uncommitted closure docs of S1 (`docs/log-inbox/plugins.md` and four prompt Status
lines); leave them alone. Model and tier as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-09-0806 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. Gates through
`node scripts/run-quiet.mjs`. Load gate before every probe run: `uptime`, 1-minute load ≤ 16.

**Context: five lanes on this front stopped at AM-8.** Read only what a step names. CPU profiles and probe logs are
never printed: reduce them with a script to the top 15 functions by self time and by total time (name, file:line,
ms), and grep. Read code only at the lines the profile points to (±30 lines). Write the report section of step 1
before any fix; write a handoff before the soft ceiling and commit nothing half-done.

## Contesto (do not redo)

S1 folds 4020 of the 4269 objects of `ddr4_closed_v` and shows 249 nodes and 248 edges, formulas byte-identical to the
kernel view. Two problems remain, measured by P-2026-11-09-0108 (`~/.jjodel-lanes/P-2026-11-09-0035/probe_s1b.json`)
and by the chat's visual check (2026-11-09 ~01:50):

1. Open: main thread blocked 32.1-32.9 s over four runs, one single task of about 21.6 s; trunk without the fold:
   18.2-21.5 s blocked. In the chat's check the page did not answer a script for more than 45 s after open.
2. Auto layout: in the chat's check the 249 nodes did not move after two minutes; they stay spread over about 206,000 px
   of height (the positions of the unfolded tree). The probe reports `layoutMs` 35,966 but its «laid out» and «after
   edit» screenshots are byte-identical files. The minimap shows 319 nodes against 249 on the canvas. Hypothesis of the
   chat, not verified: layout and minimap still take the 4020 hidden vertices (R-EXP-10 kept their records).

The S1b probe `frontend/scripts/smoke/_tmp_expr_s1b.ts` (gitignored) already imports `Brief.ecore` and
`ddr4_closed_v.xmi` from `~/Downloads/micron-proto/out/dram/jjodel/`, applies the Brief binding and opens the model.

## COSA

1. **Measure.** Extend the probe with a CPU profile of the open (Chrome DevTools Protocol `Profiler`) and of one Auto
   layout click, and record: blocked total, longest task, the top 15 functions of each profile, the positions of the 249
   nodes before and after layout (bounding box), how many nodes the layout input holds, and what the minimap counts.
   Same measures on the trunk build without the fold for the open (a temporary worktree of `alfonso-frontend-jjtl`,
   removed at the end). Write the section «S1c measure» at the end of `docs/discovery/lir_2026-11-08_expression_fold.md`
   with the numbers and the cause of each problem, `file:line` and a verbatim quote.
2. **Fix, within this perimeter:** the cause of the long task at open, the layout input and the minimap so that folded
   vertices are not counted. Allowed files: those of the LIR's list, the Auto layout call sites and the layout adapter
   it names, the minimap node filter. Tests first where a seam exists. No removal of folded vertex records (that stays
   S4); if the fix needs it, or needs a CLAUDE.md §3.2 file or a sync write, stop and ask.
3. **Acceptance**, on the same probe at load ≤ 16, median of three: open blocked total not above the trunk's, no single
   task above 5 s; after Auto layout the 249 nodes fit a bounding box of the order of a few screens (state the numbers),
   finished within 10 s; minimap 249. Screenshots after layout and after an edit, checked to differ by content, in the
   lane folder.
4. Gates: typecheck, vitest (baseline: the three known import failures), build, smoke, `check:scripts`, `check:docs`,
   `bpmn-lanes` 12/12, the expression golden test.
5. Code commit `perf(expression): ...` with explicit pathspec; LIR section commit. Append to the S1 log entry in
   `docs/log-inbox/plugins.md` a paragraph with the S1c numbers, uncommitted with the rest of the closure (RC-17).
   Remove the temporary trunk worktree, stop every server. Exit `Outcome: hard-stop` with «visual check due».

## HARD STOP

Acceptance not met, a red gate, a fix outside the perimeter, or a §3.2 trigger: stop before the code commit with the
numbers and one `Recommended:` line.
