# Canvas mount: the off-screen edge check nobody has run

Prompt-ID: P-2026-11-04-1012
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: full (closes P-2026-11-04-0925)
Depends: P-2026-11-04-0925
Worktree: ~/jjodel-w-canvasmount, branch canvas-mount-unmeasured
Request: none (Alfonso, 2026-11-04 08:57)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1012 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call. Summary lines only. Do not merge.

## COSA

P-2026-11-04-0925 could not produce the crop that matters: on b10_8 the output graph has one node in the nodes prop on both trees, so its crops prove nothing about edges to off-screen nodes, the fault the throwaway patch had. The before and after crops are byte-identical for that reason.

Build in the probe, not in the repo, a graph with more than 150 flat nodes spread beyond the viewport, with references between on-screen and off-screen nodes (a metamodel or a model made through the app's API). On this branch: open it; check an edge with one end off-screen is drawn, by DOM and by crop; pan to the far end and check the edge and the node, handles attached, nothing jumps; fit to view finishes and frames all nodes; select a node reached by pan; export. Compare with the same graph on trunk tip ~/jjodel-release at most by a second run in a throwaway dev server from this tree with MOUNT_ALL_MAX_NODES raised through the probe, if that is cheap; else say so. Crops in ~/.jjodel-lanes/P-2026-11-04-1012/.

A failure is a fix in EditorV2.tsx or unmeasuredNodes.ts with a test first; outside them, or in the critical zone, stop with Outcome: question. Then npm run check:docs, gates if code changed, a short sentence in the log entry, Status. Close with the crop paths, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
