# Expression fold: open the folded model without mounting every node

Prompt-ID: P-2026-11-09-0900
Chat: C-2026-11-01-1434
Front: plugins
Lane: fast (one cause, one fix, one measure; critical zone go-ahead of Alfonso 2026-11-08 23:39, this lane 2026-11-09 08:55)
Status: eseguito ✅ 1123ced34
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-09-0806

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: cause measured by P-2026-11-09-0806, stated below).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt. Expected tree:
only the uncommitted S1 closure docs (`docs/log-inbox/plugins.md`, four prompt Status lines); leave them alone. Model
and tier as pinned, effort `xhigh`.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-09-0900 · session <id>]`; final message ends with
`Outcome: done | hard-stop | question | blocked`. Time limit 45 minutes. **This lane is small on purpose: six lanes on
this front stopped at the context ceiling.** Read nothing except the lines named below (±20 lines) and the files you
change. Never print a profile, a log, the diff, a fixture or the XMI; grep summary lines. Load gate before the probe:
`uptime`, 1-minute load ≤ 16.

## Cause (measured by P-2026-11-09-0806, do not re-measure)

The fold views set `defaultSize: { width: FOLD_VIEW_WIDTH }` (`frontend/src/model/expression/exprFoldViews.ts:83`).
`viewNeedsMount` (`frontend/src/components/editor-v2/onlyRenderVisible.ts:44-47`) then returns true, so
`canRenderOnlyVisible` turns virtualization off and all 249 nodes mount with their formulas (15 on the trunk). The
trace showed 15.5 s of style recalculation over about 65,000 elements; open blocked 31.8 s (trunk 12.7 s), longest task
18.0 s (trunk 3.4 s). The previous lane's half-applied work is saved in `~/.jjodel-lanes/P-2026-11-09-0806/wip-all.patch`;
do not apply it, the tree is clean.

## COSA

1. Test first in `frontend/src/model/expression/__tests__/exprFoldViews.test.ts`: no fold view needs its node mounted
   (`viewNeedsMount({kind: v.ir.kind, ir: v.ir})` is false for every view of `exprFoldViews`). It must fail on the
   current code.
2. Fix in `exprFoldViews.ts`: no `defaultSize` on the fold views; the formula's width is capped by CSS on the expression
   label (the `EXPRESSION_LABEL_CSS` block of `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`, appended at
   its end, no pinned hash changed), so long formulas still wrap at about the old width. No other file.
3. Gates: typecheck; vitest on `src/model/expression` and `src/components/editor-v2/viewpoint/ir`; `shapeRegistry`
   test; full vitest only if those are green (baseline: the three known import failures).
4. Measure once with the S1b probe (`frontend/scripts/smoke/_tmp_expr_s1b.ts`, gitignored; skip its Auto layout step if
   it has a switch, otherwise ignore the layout numbers): open blocked total, longest task, mounted nodes, labels matching
   (expected 246/246). Acceptance: mounted nodes of the order of the trunk's (tens, not 249), open blocked total within
   1.5 times the trunk's 12.7 s, no single task above 5 s. Screenshot of the open canvas with a formula visible.
5. Code commit `perf(expression): fold views no longer force every node to mount (P-2026-11-09-0900)` with explicit
   pathspec. Append two lines with the numbers to the S1 entry of `docs/log-inbox/plugins.md`, uncommitted. Exit
   `Outcome: done`.

## HARD STOP

Acceptance not met, or a fix that needs another file: stop before the commit with the numbers and one `Recommended:`
line. Near the ceiling: stop at once, commit nothing.
