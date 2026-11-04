# Canvas mount: parallel edges stacked in one band on models above 150 nodes

Prompt-ID: P-2026-11-04-1050
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane full · b6c2cdfa0 · closed by P-2026-11-04-1130 · verifica visiva non applicabile (unattended: probe crops, no hand run)
Lane: full (regression of the route A merge 9abc989ff)
Depends: P-2026-11-04-1038
Worktree: ~/jjodel-w-canvasband, branch canvas-mount-band
Request: none (Alfonso, 2026-11-04 08:57)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1050 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call. Summary lines only. Commit each green step. A question with one recommendation carries a line Recommended: <one line>. A probe is not a hand run. Do not merge.

## COSA

Route A left a visible difference, seen in the crops of ~/.jjodel-lanes/P-2026-11-04-1012/ (branch-* against trunk-*, the probe and fixture are in probe/ there): parallel edges between a pair of nodes (C103 to C104, C106 to C107, C190, C193, C196) are drawn as one thick band on the branch, and as 2 or 3 separate lines on trunk behaviour. The likely cause, to verify and not to assume: port distribution waits for measured nodes, and off-screen nodes are never measured, so their handles keep undistributed positions.

Measure first: handle positions and edge end points of those pairs at open, after 5 s of settling, and after panning to them, on both behaviours. Then fix in EditorV2.tsx or unmeasuredNodes.ts, test first, so that a pair with both nodes on screen spreads as on trunk, and a pair reached by pan spreads no later than the frame after it is measured, with nothing else moving. Port distribution still never reads the estimate. If the fix needs the critical zone (useJjomSync.ts, portDistribution.ts) stop with Outcome: question and do not touch them; say what it would take.

Crops of both behaviours in the lane folder, and read them yourself with the Read tool, saying what differs. Figures on production b10_8 must not lose the gain of route A: longest task about 1,400 ms. Log entry, Status.

## DOVE

EditorV2.tsx, unmeasuredNodes.ts and its test, docs/log-inbox/hw-notation.md, the Status line. No CLAUDE.md 3.2 file.

## COME

Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».
