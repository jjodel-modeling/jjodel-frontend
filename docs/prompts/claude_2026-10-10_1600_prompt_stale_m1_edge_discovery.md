# Stale canvas edge of a deleted M1 reference edge: discovery

Prompt-ID: P-2026-10-10-1600
Chat: C-2026-10-10-0057
Lane: full (Phase 1, read-only on sources; the fix touches CLAUDE.md §3.2 `useJjomSync.ts`, so Phase 2 needs a Layer Impact Report and an explicit go-ahead)
Depends: none
Status: eseguito 2026-10-10 · lane stale-m1-edge · 46bcfcb92, 9e1b0b7b8, df7904064, ad08a8519, 82b4b71c6, d6448ef04 · flip 2026-10-10 dalla chat

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-staleedge`, branch `stale-m1-edge`, created from the trunk commit that adds this file.
Before anything else, check four things. `pwd` is the worktree. The branch is `stale-m1-edge`. `git status` is clean. `git log -1 --format=%H` equals
`git log -1 --format=%H -- docs/prompts/claude_2026-10-10_1600_prompt_stale_m1_edge_discovery.md`. Otherwise stop.

## Lane discipline
Every reply opens with `[P-2026-10-10-1600 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.
Do not touch the `Status` line.

## Context (measured elsewhere, do not redo)

The graphVertex S3 lane (P-2026-10-10-0105, branch `ir-graphvertex`) measured the defect and filed it as a ticket in
`docs/log-inbox/ir-graphvertex.md` (commit `f4756a94b`). Read it with `git show f4756a94b:docs/log-inbox/ir-graphvertex.md`
and the S3 LIR with `git show aa6d4b670:docs/lir/lir_2026-10-10_graphvertex_s3.md` (its section 4.3).

- After a reference-slot edit, `useM1ReferenceEdges` deletes the stale `DVoidEdge` in a delete-only TRANSACTION. The edge
  leaves the graph's `subElements`.
- The React Flow edge stays in the canvas state: still there 4.5 s later, on the BPMN fixture, after a lane-to-lane move.
- The incremental removal in `useJjomSync.ts`, keyed on `rfEdgeCache`, does not drop it. Each round trip adds one stale
  edge. Hidden or not, stale edges take handle slots, so a live edge can lose its handle and stop being drawn.
- S3 works around it in its presentation pass, for declared graphVertex channels only. Every other M1 reference edge is
  still exposed.

Alfonso decided on 2026-10-10 that this ticket gets its own lane.

## COSA (Phase 1, read-only)

Write `docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md` (P4), opening with `## 0. Answer in brief`.

1. **Reproduce on the trunk** with a minimal probe, `frontend/scripts/probe/stale-m1-edge.ts`, run by `lane-run probe` on a
   dev server port of your own (not 3000; check `lane-run` ports). Take a model whose M1 reference edges are drawn, remove
   one value from a reference slot (through LModel, the way a user edit does), and count the `.react-flow__edge`
   elements for that pair, and the React Flow edge state, at 0, 1 and 5 seconds. Then add the value back and remove it
   again. A failing reproduction is a valid result: say so and stop there.
2. **Root cause** with `file:line` and verbatim quotes. Which path removes React Flow edges in `useJjomSync.ts`, why it
   misses this deletion (cache key, timing against the delete-only TRANSACTION, or the gate in `sync/m1EdgeGate.ts`),
   and whether `m1EdgeSweep.ts` was meant to cover it.
3. **Prior work.** Read the reference-delete lane (P-2026-09-30-1542, worktree `~/jjodel-w-refdelete`) and the update-depth
   lane (P-2026-10-01-1655, `~/jjodel-w-updatedepth`). Say whether either touched this path, and whether the fix can
   interact with the replay loop S3 found (second ticket in the same inbox file).
4. **Fix proposal** as a draft Layer Impact Report in the report: the exact change, every caller affected, and the
   tests that would pin it. Prefer the smallest change in one file.
5. **Sequencing.** The nested-vertices front (P-2026-10-10-0830) reserves `useJjomSync.ts`, `sync/m1EdgeGate.ts` and
   `m1EdgeSweep.ts` for its slices S2 and S3 (its report is on branch `nested-vertices`,
   `docs/discovery/discovery_2026-10-10_nested_object_vertices.md`). Say whether this fix should land before those
   slices, or be folded into nested S3 («live channel and reconciles»).

Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## DOVE

The report and its assets under `docs/discovery/assets/stale-m1-edge/`, the probe, and
`docs/log-inbox/stale-m1-edge.md`. No source file.

## COME

Commits: one `chore(probe)` for the probe, one `docs(discovery)` for the report, assets and inbox entry (`log-entry` skill).
Explicit pathspec and the `Model:` trailer on every commit.

## NON FARE

- No edit to any file under `frontend/src/`. In particular no edit to `useJjomSync.ts`, `sync/m1EdgeGate.ts`,
  `m1EdgeSweep.ts` or `useM1ReferenceEdges.ts`.
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.

## HARD STOP

After the commits, stop with `Outcome: hard-stop`. The chat reads the report and decides Phase 2 with Alfonso.

## RIFERIMENTI

`CLAUDE.md` §3 and §21. `docs/PROTOCOL.md` P4, P13, P16. The S3 LIR and inbox ticket on `ir-graphvertex` (commits above).
