# Layer Impact Report 2026-10-10: graphVertex S3, gestures and membership

- Prompt-ID: P-2026-10-10-0105 (Phase 2, slice S3). Chat: C-2026-10-10-0057. Session `fc127b41`.
- Tree: `~/jjodel-w-graphvertex`, branch `ir-graphvertex`, HEAD `b48595776` (merge of the trunk with the re-layout-on-open fix `b58d8631f`).
- Base: the draft of `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` §D6, the spec addendum `docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md` §6 and §7, R-GV-8.
- Written before any diff (CLAUDE.md §3.2, RC-30). Every claim below is read in code at that HEAD unless marked measured.

## 0. Verdict

**No file of CLAUDE.md §3.2 has to change.** S3 writes the model through calls that already exist and are SetField-only (`syncPositionBatchToJjom`, `syncSizeBatchToJjom`, the L-proxy `.values` setter that `handleReconnect` and `handleObjectEdgeSelected` already use in `EditorV2.tsx`), and it creates objects only through the existing bare `syncCreateObject`. `useM1ReferenceEdges.ts`, `syncState.ts`, `canvasToJjom.ts`, `useJjomSync.ts`, `portDistribution.ts` and `VersionFixer.tsx` are read and called, not edited. The slice proceeds without the RC-30 go-ahead.

Files the slice changes: `EditorV2.tsx` (the drag-end and resize handling in `handleNodesChange`, the palette drop `onDrop`, the connect `handleObjectEdgeSelected`), `viewpoint/ir/irContainment.ts` (container info, live follow of a dragged or resized partition container), a new pure `viewpoint/ir/irMembership.ts`, their tests, the probe fixture, this report, the assets and the inbox entry.

## 1. Facts the design rests on

1. **TRANSACTION nests by depth.** `redux/action/action.ts:210-223`: `TRANSACTION` calls `BEGIN()` and, after `await func()`, `END()`; `END` (`:142-152`) decrements `transactionDepthLevel` and fires only at depth 0, where `FINAL_END` wraps every pending action in one `CompositeAction` (`:163-174`). A `syncPositionBatchToJjom` called inside an outer `TRANSACTION` therefore lands in the same composite action: one D-layer undo delta.
2. **JjOM undo is the D-layer stack.** `EditorV2.tsx:2628-2637` `handleUndo`: `UndoAction.new(1, DUser.current, false).commit()` (R-UNDO-1). One undo reverts one composite action.
3. **Drag writes are lazy by default.** `sync/syncState.ts:20-21` `return syncModes.get(nodeId) ?? 'lazy';`. `handleNodesChange` writes positions at drag end through `syncPositionBatchToJjom` (`EditorV2.tsx`, the `hasDragEnd` branch), so the pre-drag position is still the record when the drop is handled.
4. **`setValueAtPosition` detaches only from a `DValue` father.** `model/logicWrapper/LModelElement.tsx` `get_setValueAtPosition`: for a containment slot, `let oldContainer = lvalo.father; let oldContainerValue = (oldContainer.className === DModel.cname) ? undefined : oldContainer;` then, when present, a deferred clear of the old slot at the object's index, and always `SetFieldAction.new(val, "father", c.data.id)`. `set_values` (`:7969`) routes every index through it. Consequences: an object whose father is a `DValue` (canvas composition link, XMI import) is moved by appending it to the new slot alone; an object whose father is the `DModel` (a pure root) is not detached and must be removed from its old slot explicitly; and the two must never be combined on the same slot in one transaction, because the deferred clear addresses the old slot by the index read before the transaction.
5. **M1 reference edges follow the slots.** `hooks/useM1ReferenceEdges.ts:63-84` signs every `(object, reference, target)` tuple; `:131-150` creates the missing pair edges with `DVoidEdge.new2`, bare, then `markCanvasEdgePair`; `:155-197` deletes the edges whose pair has no live tuple in a delete-only TRANSACTION and calls `clearCanvasEdgePair`.

## 2. Layer Impact Report

```
LAYER IMPACT REPORT — P-2026-10-10-0105 S3

Layers touched:
  [x] D-layer (Redux raw data)       DValue.values of channel slots (lane flowNodeRefs, process flowElements),
                                     DObject.father through set_values on containment slots, DVertex x/y/w/h/isResized
  [ ] L-layer (computed proxies)     read only; the `.values` setter is the existing L write path
  [x] JjOM (model entities)          membership of flow nodes in lanes and processes, owner of new objects
  [x] Canvas v2-flow (ReactFlow)     drag end (snap back, descendants), resize end (paired), palette drop, connect
  [ ] Canvas classic                 untouched
  [x] Sync layer (useJjomSync hooks) read path only: useM1ReferenceEdges reconciles after a slot edit
  [ ] Persistence (VersionFixer)     no new persisted field, no migration (R-B9)
```

**D-layer**
- What changes: on a membership drop, one `TRANSACTION` holds the dropped node's position write (`syncPositionBatchToJjom`, nested) and the slot edits: `.values` without the object on the source's terminal slot (`reference`), `.values` with it appended on the target's terminal slot, and, when the target lane names a creation owner the object is not yet in, the append on the owner's containment slot (`flowElements`), which re-fathers it (fact 4). A pool drag writes the pool and every descendant by the same delta in one `syncPositionBatchToJjom`. A paired resize writes the two lanes in one `syncSizeBatchToJjom`. A palette drop into a lane with `membership.create` creates the object with `syncCreateObject` (bare, its own internal TRANSACTION, as today), then, once the object resolves, one SetField-only `TRANSACTION` appends it to the owner's slot and to the lane's slot. The connect gesture appends the new edge object to the owner slot of its source's container chain inside its existing deferred slot write.
- What does NOT change: no creator inside any new TRANSACTION (§3.3); `syncCreateObject` and `DVoidEdge.new2` are never wrapped; no new field on any D-object; the composition and reference edges are not created by this slice (the sync does it, fact 5).
- Cross-layer: every slot edit moves `m1RefValuesSig` and `channelSig` (S2), so the edge reconcile and the presentation pass both re-run.
- Side-effect safety: a `reparent` append on an object with a `DValue` father is never paired with an explicit removal from the same old slot (fact 4); a pure root is removed explicitly. Ops that would not change a slot (append of a present value, removal of an absent one) are skipped before the write.

**Sync layer (read path)**
- The reconcile after a lane-to-lane drop: the old pair `Warehouse→Ship` has no live tuple and is deleted (delete-only TRANSACTION, `clearCanvasEdgePair`); the new pair `Sales→Ship` is created bare and marked. Both are channel edges, hidden by the S2 pass (R-GV-4, every claim), so no lane edge is drawn at any moment of the gesture.
- **Fast back-and-forth** (A→B→A inside the reconcile window): each slot change re-fires the effect; a pair created and then made stale is deleted with `clearCanvasEdgePair`, so a later re-creation is not blocked by a stale mark. A pair still marked from a creation whose DVoidEdge has not reached `subElements` yet is skipped by `hasCanvasEdgePair` (the guard's purpose), and the next signature change creates it. Worst case: an edge created one reconcile late, hidden anyway by the channel suppression. To be exercised by the probe (two drags in a row).
- **Undo**: one undo reverts the composite action of the drop (position and slots, fact 2). The reconcile that follows the undo creates and deletes edges in actions of its own; they enter the undo stack after the undo, as for any reference edit made through the properties panel today (pre-existing behaviour, not introduced here). Declared: a redo after such an undo may find its stack cleared by those actions.
- What does NOT change: `useJjomSync` Step 3/4 deps (§3.5), the M1 pair key (Rule 13), `syncState.ts`.

**Canvas v2-flow**
- Drag end, one node dragged alone: resolve the target container under the node's centre, among the containers whose channel accepts it (`childFilter`), deepest first (pure `irMembership.resolveDropTarget`); plan the drop from the two containers' membership modes (pure `irMembership.planDrop`): move, snap back (the position change is rewritten to the pre-drag position and nothing is written), or edit. A partition (a lane under `partitions`) always snaps back: its place is computed (R-GV-6).
- Container drag: a container that declares a `layout` moves every descendant by its delta at drag end (base nodes patched at once, records written in one batch); during the drag the presentation pass shows them following (live offset from the container's record), so nothing jumps at release. A container without `layout` keeps today's behaviour exactly (its children stay).
- Resize: a partition's size is not written per resize event; the presentation pass shows the live border with the neighbour compensated (sum constant), and the end of the gesture writes both sizes in one batch. The moved border is the partition's end border (bottom under `vertical`), whatever handle the user took (v1, declared).
- Multi-node drags, `none` mode, and graphVertex views without the R-GV keys: unchanged.

## 3. Smoke scenarios potentially affected

- BPMN fixture: Ship from Warehouse to Sales (lists swapped, one undo restores, no lane edge); Sales out of Shop (snaps back); Shop dragged (every descendant by the pool's Δx); Sales/Warehouse border resized (sum constant); Task dropped from the palette into Warehouse (in `Process.flowElements` and `Warehouse.flowNodeRefs`); SequenceFlow connected (in `Process.flowElements`); two drags in a row (back and forth).
- Hull scene (S1 fixture, no `membership`, no `layout`): a State dragged out of its Region keeps today's behaviour (position only, slots untouched); a Region dragged moves alone.
- Unchanged by construction, not re-measured: import Families.ecore (M2 edges), open of an existing project (re-layout-on-open is not touched), save and reopen.

## 4. Deviations measured while building (added after the diff)

Three facts the report above did not hold, each measured on the BPMN fixture (port 3071) and closed in the slice. None changes a §3.2 file.

1. **A removal does not go through `.values`.** `set_values` cannot shrink a list: its excess removal `SetFieldAction(values, undefined, '-=')` (`LModelElement.tsx:8021`) reaches the reducer's array-remove branch with no value (`reducer.ts:304`), which splices a copy and then reports `gotChanged = !!indexes.length`, false (`:331`). Measured: Sales kept Ship after the drop, through the gesture and through a hand-written TRANSACTION alike. The removal is the reducer's remove-by-value, `SetFieldAction.new(slotId, 'values', objectId, '-=', true)`, the idiom of `LModelElement.tsx:4242`; the append keeps the L setter (it re-fathers on a containment slot). Still SetField-only, still in the one TRANSACTION of the drop (§2).
2. **The drag-end updater must survive a replay.** When an update of lower priority waits in the edges queue (useJjomSync's batched patch, flushed in a frame), React replays the later updaters on every render. The drag-end `setEdges` built new arrays on each replay; the presentation pass then built new nodes, React Flow's `StoreUpdater` set them, and EditorV2's own `useNodes()` (`useAutoAnchor`, `EditorV2.tsx:1146`, `hooks/useAutoAnchor.ts:568`) re-rendered it at once: 52 replays, then "Maximum update depth exceeded", canvas caught. The drag-end `setEdges` and the container-drag `setNodes` now hand back the same array for the same input (`replaySafe`, in `handleNodesChange`). The amplifier is older than S3 (the object-as-edge synthesis returns a new node array on every pass, `irEdgeViews.ts:348`) and stays: reported, not fixed.
3. **A stale channel edge is dropped, not hidden.** After a membership edit the reconcile deletes the old lane→task DVoidEdge (fact 5), but the canvas keeps its React Flow edge (still in the RF state 4.5 s later: useJjomSync's incremental removal does not drop it). Hidden, it still took a handle slot on the task, because the object-as-edge synthesis counts every edge (`freeHandleIndex`, `irEdgeViews.ts:105`); after one round trip Ship's incoming SequenceFlow asked for `top-4`, a handle Ship does not have (React Flow error 008, edge not drawn). `suppressChannelEdges` now drops, for a declared single-hop channel, an edge of the feature to an object the slot no longer holds, and every edge of a pair but the last (one edge per pair, Rule 13). This narrows R-GV-4's "hidden, never removed" to the edges that are still references of the model.

## 5. Not done here

- No change to `canvasToJjom.ts` or another §3.2 file. Had one been needed (for instance a remove-capable reference write), it would have been written here and the slice stopped with `Outcome: question`.
- The open-time layout region and `utils/autoLayoutOnOpen.ts` (the merged fix), the authoring panel, the seed and `irTabs.tsx` (S4), `sync/m1EdgeGate.ts`, `useJjomSync.ts`, `m1EdgeSweep.ts` (nested-vertices front): untouched.
