# Prompt: discovery, D-A1, «Add» of a nested instance under a graphVertex container

Prompt-ID: P-2026-10-15-1710
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (Phase 1, read-only; may lead into the IR, the 2.230 step and the canvas sync)
Depends: P-2026-10-12-0115
Request: none (Alfonso, 2026-10-15 17:08, "affrontiamo il problema in 1"; D-A1 of the release 3.1 reports)
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-da1`, branch `da1-disc`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-15-1710 · session <id>]` and ends with an `Outcome:` line (P16). Gates and probes run in the foreground.

## What is known (do not redo)

From `docs/discovery/discovery_2026-10-12_rel31_version.md` §5 (crops 10a to 10e) and `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md` (D-A1):

- Fixture `/Users/alfonso/jjodel-demo-exports/graphvertex/gv-bpmn.jjodel` (2.229, BPMN viewpoint: pool Shop with lanes Sales and Warehouse, Customer, Supplier; 21 instances). The probe script that produced the crops is `~/.jjodel-lanes/P-2026-10-12-0115/crop-scripts/c10.ts` (with `lib.ts` beside it) and its control `c10ctl.ts`. Reuse them.
- Right-click on lane Sales → «Add LaneSet (childLaneSet)»: the store gets `LaneSet_0` in Sales' `childLaneSet` (22 instances), **no new vertex appears in the DOM**, no frame is resized, three edges enter the frame from above onto Order received, Check order and In stock?, and problem dots appear on Order received and Check order.
- Auto layout after the Add moves those three flow nodes outside Shop and leaves Sales empty; the control (same file, Auto layout, no Add) keeps them inside.
- L1's reading: after the 2.230 step (staging #174, «every instance is listed by its model»), an instance created with «Add» gets a top-level vertex at a grid position instead of becoming a child of its graphVertex container. Not measured.

Alfonso asked whether this could be a CSS z-index problem. The «no new vertex in the DOM» line argues against it; measure it anyway.

## COSA

Answer three questions, each with a measurement, not a reading.

1. **Rendering or structure.** On this tree's dev server (port 3151), replay the Add and read, right after it, for the new instance and for Order received, Check order and In stock?: whether a `.react-flow__node` exists, its bounding rect, its `parentId` in the React Flow store, its computed `z-index` and `visibility`; and in the Jjodel store, the instance's container (`father`), the membership the graphVertex view derives for the lane (which children it lists), and which vertex each of the three flow nodes is attached to before and after the Add. Say plainly whether any part is CSS.
2. **Regression or pre-existing.** Replay the same probe on two `git archive` copies: `07bfa0673` (trunk with L2 and L3, before the staging merge) and `d7b24c83b` (the staging merge itself), on ports 3152 and 3153. If the pre-merge copy behaves like the control, bisect the 110 staging commits with the probe (`git bisect run` on copies, never on this tree) and name the first bad commit. If the pre-merge copy already shows the defect, find when graphVertex membership started deriving it (the graphVertex merge `38e7a6006` and after).
3. **Mechanism.** From 1 and 2, the code path: which function decides the parent vertex of a newly added nested instance under a graphVertex container, why the Add of a LaneSet into `childLaneSet` displaces the lane's flow nodes (are they re-derived as children of the new LaneSet, or detached), and what the problem dots report. Cite file and line.

Then propose the smallest fix, with files and line ranges, and say whether it touches the critical zone (CLAUDE.md §3: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`) or the persisted format. If the fix touches saved projects (a new step), say so: that decides whether it can enter 3.1.

Report: `docs/discovery/discovery_2026-10-15_da1_graphvertex_add.md`, with crops in the lane folder, the bisect log if any, «Decisions taken (unattended)» and «Decisions awaiting Alfonso», closing with a one-line verdict for the release: blocker for 3.1 or not, and why. Log entry in `docs/log-inbox/release-3-1-da1.md`. Commit both on `da1-disc`, then stop with `Outcome: hard-stop`.

## NON FARE

No source edits, no fix. No edits to the fixture file (copy it to `/tmp` before loading). No push, no merge, no tag. Do not run `git bisect` in this tree or in `~/jjodel-release`. Do not touch `CLAUDE.md` (it has uncommitted changes from another chat in the trunk tree).

## RIFERIMENTI

CLAUDE.md §3, §5, §17; PROTOCOL P4, P9, P12, P14, P16; the two reports above; R-NEST-6 (#174) in docs/decisions.md.
