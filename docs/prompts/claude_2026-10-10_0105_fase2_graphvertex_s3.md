[P-2026-10-10-0105] Phase 2 GO: slice S3 (gestures and membership). Visual. Critical-zone candidate. Hard stop after S3.

Prompt-ID: P-2026-10-10-0105
Chat: C-2026-10-10-0057
Lane: full (`EditorV2.tsx` drag/drop paths; `canvasToJjom.ts` only behind its own LIR)

## Accepted from S2

Commits `6e22f4a9b`, `b7e061436` and `7d334c817` are accepted, with your nine unattended decisions. Decision 1 (channel edges hide for every claim, including a lost one) goes into the addendum §5 through the S4 lane, P-2026-10-10-1156, which runs in parallel on `ir-graphvertex-s4`. Do not touch the addendum here.

## Branch state

The chat has merged the trunk into `ir-graphvertex` (`lane-run merge --trunk-into ir-graphvertex`). That brings in the re-layout-on-open fix (P-2026-10-10-1155, `b58d8631f`). Since that fix, `EditorV2.tsx` gates the open-time auto-layout with `utils/autoLayoutOnOpen.ts`. Run `git log -3` first and confirm the merge commit is there.

## COSA

S3 as in report §I and §D, with R-GV-8 (the reparent primitive is `LValue.setValueAtPosition`, which moves an object out of its old container when it is written into a new one).

1. **Membership on drag end.** When a node is dropped, resolve the partition or container under it (absolute coordinates, partition boxes from `irPartitions.ts`) and apply the view's `containment.membership.mode`:
   - `none`: today's behaviour.
   - `forbid`: snap back to the pre-drag position.
   - `reference`: remove the node from the old container's slot and append it to the new one, in one SetField-only TRANSACTION. No creator goes inside that TRANSACTION (§3.3).
   - `reparent`: through `setValueAtPosition` on composition slots.

   A node dropped outside every container of its kind snaps back, unless the mode is `none`.
2. **Container drag.** Dragging a pool moves every descendant (lanes and flow nodes) by the same delta, through the existing `syncPositionBatchToJjom`. Lanes are not draggable on their own; they snap back, which is today's S2 behaviour made explicit.
3. **Paired lane resize.** Resizing the border between two lanes writes both heights in one SetField-only TRANSACTION (`syncSizeBatchToJjom`). Their sum stays constant.
4. **Creation owner.**
   - A palette drop into a lane whose view declares `membership.create` creates the object in the declared owner slot (`Process.flowElements` for BPMN) and appends it to the lane's reference slot.
   - The connect gesture of an object-as-edge view (SequenceFlow) creates the edge object in the owner's slot of its source's container chain, not at the root.
   - Do not reuse `createCompositionChild` as a template: it nests `DVoidEdge.new2` inside a TRANSACTION (§D2).

## COME

- **First step: the Layer Impact Report** in `docs/lir/lir_2026-10-10_graphvertex_s3.md`, starting from the draft in report §D6.
  - Cover the `useM1ReferenceEdges` reconcile on a membership edit, the `hasCanvasEdgePair` window on fast back-and-forth drags, and undo.
  - If the LIR concludes that `canvasToJjom.ts` (or another CLAUDE.md §3.2 file) must change, write the exact change in the LIR and stop with `Outcome: question`. The chat reads it and resumes you with `--critical-zone-goahead P-2026-10-10-0105` (RC-30).
  - If no §3.2 file is needed, go on.
- **Fixture:** `bpmn-lanes-fixture.ts`. Acceptance criteria from §I S3, measured from Redux and the DOM on a port of your own (not 3000), in the light theme:
  - Dragging `Ship` from `Warehouse` to `Sales`: `Sales.flowNodeRefs` gains it, `Warehouse.flowNodeRefs` loses it, one undo restores both, and no Lane→Task edge appears.
  - Dragging `Sales` out of `Shop`: it snaps back.
  - Dragging `Shop`: every descendant's `x` changes by exactly the pool's Δx.
  - Resizing the `Sales`/`Warehouse` border: both heights change and their sum is constant.
  - Dropping a Task from the palette into `Warehouse`: the new Task sits in `Process.flowElements` and in `Warehouse.flowNodeRefs`.
  - Connecting a SequenceFlow: the edge object sits in `Process.flowElements`.
  - A graphVertex view without `membership` keeps today's behaviour exactly. Use one of the S1 hull fixtures.
- **Measurements.** Save the JSON and screenshots under `docs/discovery/assets/graphvertex-s3/`.
- **Gates.** `npx tsc --noEmit` (baseline only), the editor-v2 and `viewpoint/ir` suites, the full suite, `npm run build`. Then a mutation bench on the drop-target resolution and the membership dispatch.
- **Commits.** Use an explicit pathspec and the `Model:` trailer: the LIR in its own `docs(lir)` commit first, then `feat(ir)` and/or `feat(editor-v2)`, then `docs` for the measurements and the inbox entry.
- **Close** with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## DOVE

`EditorV2.tsx` (the drag-end and drop/connect regions only), `viewpoint/ir/irInteraction.ts`, `viewpoint/ir/irContainment.ts` or a new pure `viewpoint/ir/irMembership.ts`, their tests, the fixture, `docs/lir/`, the assets, and the inbox entry. `canvasToJjom.ts` only after the RC-30 go-ahead.

## NON FARE

- Do not touch the open-time layout region or `utils/autoLayoutOnOpen.ts`. They belong to the fix that just merged.
- Do not touch the authoring panel, the seed or `irTabs.tsx` (S4 lane), nor `sync/m1EdgeGate.ts`, `useJjomSync.ts` or `m1EdgeSweep.ts` (nested-vertices front).
- Do not wrap `DVoidEdge.new2` or any creator inside a TRANSACTION.
- No `irVersion` bump, no VersionFixer. Do not touch the `Status` line.

## HARD STOP

After the S3 commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`.
