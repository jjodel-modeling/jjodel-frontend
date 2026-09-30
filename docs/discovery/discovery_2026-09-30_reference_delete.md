# Discovery: references (edges) cannot be deleted (P-2026-09-30-1542, Phase 1)

**Prompt-ID**: P-2026-09-30-1542. **Prompt**: `docs/prompts/claude_2026-09-30_1542_prompt_reference_delete.md`.
**Chat**: C-2026-09-30-1458. **Session**: `dfc1c5a1-19f2-498a-8995-ed8c16d067a1`. **Tree**: `~/jjodel-w-refdelete`,
branch `reference-delete`, HEAD `c86664e2c` (trunk `ecbc0e92c` plus the prompt). **Model**: Claude Opus 5.5.
**Go-ahead**: RC-30, `goahead.txt` of the lane holds `P-2026-09-30-1542`.

A set of hypotheses with evidence, not a reference. Line numbers are those of `c86664e2c`. **measured** = a run of this
phase (probe named, log in `~/.jjodel-lanes/P-2026-09-30-1542/`); **read** = a file read.

## 0. Answer in brief

- **The failing path is the M1 canvas.** Deleting one link between two objects (Delete, Backspace, the edge's context
  menu «Delete reference», the toolbar trash) deletes the **metamodel reference** the link instantiates, every slot of
  every instance of it and every M1 and M2 edge backed by it. Measured on a fresh project (`_tmp_refdelete_m1`, 4 of 4
  canvas paths) and on the persisted DemoPEST scene (`_tmp_refdelete_scene`: one `nextState` link deleted, the
  `nextState` DReference, its 5 slots and its 5 M1 DEdges gone).
- **What the user sees as «cannot be deleted»**: on a loaded project the other links of that reference stay drawn as
  **ghost edges** (DEdge gone, RF edge left): measured 4 of 5 on DemoPEST, not selectable, a Delete on them does nothing.
  The same ghosts appear on a mounted M1 canvas when the reference is deleted on the M2 canvas (5 of 5, `_tmp_refdelete_scene2`).
- **M2 canvas**: Delete, Backspace, context menu, toolbar, all correct on canvas, tree and model (fresh, drawn and
  loaded references). The tree row and the Properties rail offer **no** delete for a reference (absent affordance).
- **Undo**: not one step on any path. After select + Delete, Cmd+Z restores nothing and leaves a partial DEdge
  (`{clonedCounter, pointedBy, isSelected}`, no `className`) in `idlookup`. Cause in the reducer (core), §5.2.
- **Bisect**: `3.0.0` BAD, `1b40eacd0` BAD (oracle `_tmp_refdelete_bisect`, same failure). No known-good candidate,
  so no first bad commit in `3.0.0..HEAD`. Origin by reading: the M2 cascade on every non-inheritance edge since
  editor-v2's first commit `75fe8f2f5` (2026-02-20); M1 link DEdges carry the DReference in `model` since `964344aff`
  (2026-04-17, drawn links) and `91a0e89c8` (2026-05-09, slot-populated links). Not executed: the oracle needs
  `createAdapter.ts`, absent before `91a0e89c8`.
- **Root cause**: `syncDeleteEdge` (`sync/canvasToJjom.ts:592-605`) treats every non-inheritance edge as an M2
  reference edge and calls `syncDeleteReferenceById(lookup[edgeId].model)`; for an M1 link that `model` is the M2
  DReference (`canvasToJjom.ts:1701-1702`, `useM1ReferenceEdges.ts:168-169`).
- **Recommendation**: in `syncDeleteEdge`, an edge whose start vertex is over a `DObject` deletes the **link** only:
  the value leaves the source slot through `setValueAtPosition(index, undefined)` (the primitive of the rail's ×,
  measured correct), the edge id leaves its graph's `subElements`, the DEdge is deleted, all in one TRANSACTION of pure
  actions; the pair guard is cleared after. M2 and inheritance paths unchanged. Files: `sync/canvasToJjom.ts`, test
  `sync/__tests__/syncDeleteEdge.test.ts` (new).
- **Decisions taken (unattended, RC-21)**: Q1, Q2, Q5 below, adopted as recommended.
- **Decisions awaiting Alfonso** (core, Rule 5): Q3 (one-step undo of an edge delete: reducer merge), Q4 (ghost
  edges after an M2 delete on a loaded project: `Dummy.get_delete` graph net). Neither blocks the fix.

Questions:
1. M1 edge delete removes the link only, never the metamodel reference. Recommended: yes, the rail ×'s semantics.
2. M1 **composition** edge: detach the child (father → model, the object stays) like the rail's containment ×, not delete it. Recommended: detach.
3. One-step undo: needs the reducer's merge rule (core). Recommended: make the deletion one dispatch here; defer the undo to a core lane with Alfonso's approval.
4. Ghost edges after an M2 reference delete on a loaded project. Recommended: a core lane for an edge net in `Dummy.get_delete` (R-DEL-4 shape); a ticket now.
5. Tree row and Properties rail offer no reference delete. Recommended: no change in this lane; a ticket for the affordance.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The enum edge guard (`5dc09a4ce`, `1b40eacd0`, `a64bf5755`) broke deletion on the M2 canvas | **Falsified**. `isValidConnection` and the two `isClassKind` checks sit on the create path only (read: `EditorV2.tsx` diff of `5dc09a4ce`; `canvasToJjom.ts:305-310`); M2 deletion measured correct on every canvas path at HEAD. |
| H2 | Some delete path fails at HEAD | **Holds**: the four M1 canvas paths (§2). |
| H3 | The failure is a regression inside `3.0.0..HEAD` | **Falsified**: BAD at `3.0.0` and at `1b40eacd0` (§3). |
| H4 | The M1 failure is in the sync layer (edges not removed) | **Partly**: the model write is wrong (canvasToJjom); the ghosts are a consequence of a core cascade gap (§5.1). |
| H5 | Undo restores a deleted reference in one step | **Falsified** (§5.2). |

## 2. Matrix (measured at HEAD `c86664e2c`, light theme, fresh project, headless Chromium 1440×900)

Probes `_tmp_refdelete_m2.ts` (one reference per path, A→B) and `_tmp_refdelete_m1.ts` (one reference and one target
object per path: M1 edges are pair-keyed, CLAUDE.md rule 13), both through `lane-run probe` on 3093. «model» = the
`DReference` (M2) or the slot value and the M1 DEdge (M1) in `idlookup`; «tree» = the reference's tree row.

### M2 canvas: reference between two classes

| Path | Canvas | Tree | Model | Undo (one Cmd+Z) |
|---|---|---|---|---|
| select + Delete | gone | gone | gone | nothing restored; partial DEdge left (§5.2) |
| select + Backspace | gone | gone | gone | nothing restored |
| context menu «Delete reference» | gone | gone | gone | restored (stack empty before; see §5.2) |
| toolbar trash (`Toolbar.tsx:852`) | gone | gone | gone | nothing restored |
| Properties rail | no delete control (`Info.tsx:1769`, «TODO: Duplicate/Delete available via toolbar and context menu») | | | |
| tree row | no path: the row has no context menu and no key handler (`TreeViewContent.tsx:1289-1343`); Delete with the row selected changes nothing | | | |

Also measured: a reference **drawn** on the canvas (handle drag + «Association», `_tmp_refdelete_drawn.ts`) deletes
with Delete, 2/2; the `event` reference of the loaded DemoPEST deletes with Delete (`_tmp_refdelete_scene.ts`).
A click on the name label selects the edge (`UnifiedEdge.tsx:953`) except when a selected sibling's segment handle
covers it (3 parallel references: `lab2` under `DIV.segment-handle`, `_tmp_refdelete_label.ts`): an overlap, not a
delete defect.

### M1 canvas: link between two objects (reference `r_k`, `a → b_k`)

| Path | Canvas | Model | M2 reference | Undo |
|---|---|---|---|---|
| select + Delete | gone | slot and DEdge gone **with the DReference** | **deleted** | nothing restored |
| select + Backspace | gone | same | **deleted** | nothing restored |
| context menu «Delete reference» | gone | same | **deleted** | restored (stack state) |
| toolbar trash | gone | same | **deleted** | nothing restored |
| Properties rail × («Remove this reference», `Info.tsx:850-855`) | gone | slot empty, DEdge gone | kept | edge back, slot still empty (inconsistent) |
| tree row | links are not tree rows | | | |

The context menu of an M1 edge offers «Convert to Inheritance» and «Delete reference» (`EditorV2.tsx:3379-3424`,
one menu for both levels).

Persisted scene (DemoPEST, `_tmp_refdelete_scene.ts`, 1600×1000): one `nextState` link deleted with Delete → before
`{refs:1, m1dedges:5, slotsFilled:5}`, after `{refs:0, m1dedges:0, slotsFilled:0, rfOnly:4}`: 4 RF edges left whose ids
are no longer in `idlookup`. Clicking one selects nothing; Delete leaves it (1 s and 4 s). The composition `transitions`
behaves the same (`{refs:0, slotsFilled:0, rfOnly:4}`, objects 11 → 11).

## 3. Bisect

Oracle `_tmp_refdelete_bisect.ts`: two links of one reference `r` (`a1→b`, `a2→b`), select `a1`'s edge, Delete. GOOD iff
`a1`'s link is gone, `a2`'s link and `r` intact, no RF edge without its DEdge. Exit 0/1/125.

| Commit | Verdict | Measure |
|---|---|---|
| HEAD `c86664e2c` | BAD | `after {"ref":false,"a1":-1,"a2":-1,"m1":[],"rf":[]}` |
| `3.0.0` (`cb699ad58`) | BAD | identical |
| `1b40eacd0` | BAD | identical |

`git bisect` was started by mistake as `start HEAD 3.0.0` before `3.0.0` was measured, and reset at once (no step
tested); the three runs above are plain checkouts, the tree back on `reference-delete`.

Origin, **read** (not executed): `syncDeleteEdge` at `75fe8f2f5:frontend/src/components/editor-v2/sync/canvasToJjom.ts:169-176`
already reads «// Delete the reference model element ... DeleteElementAction.new(refModel.__raw ?? refModel)» for every
non-inheritance edge. M1 links got the DReference as `model` in `964344aff` (drawn, `syncCreateReferenceLink`) and in
`91a0e89c8` (slot-populated, `useM1ReferenceEdges`); before them the M1 DEdge had no `model` and the delete wrote nothing
in the model. There is no commit where an M1 link deletes as a link.

## 4. Root cause

`frontend/src/components/editor-v2/sync/canvasToJjom.ts:592-605` (read), the only non-inheritance branch:

```ts
// Reference edge: cascade-delete the M2 DReference, its M1 slots, and all backing edges.
const refModel: any = edgeProxy.model;
...
const refId: string = lookup[edgeId]?.model ?? (refModel?.__raw ?? refModel)?.id;
if (refModel && refId) {
    syncDeleteReferenceById(refId, refModel);
```

For an M1 link, `lookup[edgeId].model` is the metaclass DReference: `canvasToJjom.ts:1699-1702` «pass the metaclass
DReference id so the JjOM→RF transformer (jjomEdgeToRFEdge) can recover the reference name and type» and
`useM1ReferenceEdges.ts:168-169` `DVoidEdge.new2(refMetaId, ...)`. `syncDeleteReferenceById` (`:501-564`) then runs
`lRef.delete()`, whose cascade clears every DValue of that reference (`Dummy.ts:234-238`, case `instanceof`) and every
Edge whose `model` is it (`:249-260`, case `model`). Callers: `EditorV2.tsx:2439-2441` (`deleteSelected`: Delete,
Backspace at `:2717`, toolbar at `:4307`) and `:2492` (`deleteEdge`: the context menu at `:3419-3424`). Measured on
all four.

## 5. Secondary findings (not in the fix)

### 5.1 Ghost edges: a deleted DEdge that stays in `graph.subElements`

Measured (`_tmp_refdelete_scene2.ts`): after the `nextState` delete the 5 M1 DEdge ids are absent from `idlookup` and
still listed in the M1 graph's `subElements`. `useJjomSync`'s removal pass compares `subElements` snapshots only
(`hooks/useJjomSync.ts:1310-1315`, `if (!currentIds.has(id))`), so the RF edges are never dropped. The removal from
`subElements` rides on `pointedBy` (`Dummy.ts:205-225`, case `subElements`, `SetFieldAction.new(dObj.id, field,
deletedID, '-=', true)`); on a fresh project it fires (0 ghosts, bisect oracle), on the loaded scene it does not. The
cure is a father net for edges in `Dummy.get_delete`, the shape of the DObject/DValue nets at `:104-115`: core (Rule 5),
Q4. The M1 fix below does not produce this state (it removes the id from `subElements` itself).

### 5.2 Undo of an edge delete

Measured (`_tmp_refdelete_undo.ts`, M2, select + Delete): the edge click pushes a delta `idlookup,_lastSelected`
(R-UNDO-4); the delete's delta carries `edges`, which forces a merge into it (`redux/reducer/reducer.ts:1211`, «if
(!shouldMerge && (delta.vertexs || ... || delta.edges || delta.graphs)) shouldMerge = true»); the merge is
`U.objectMergeInPlace` (`common/U.tsx:896-905`, `out[key] ?? (out[key] = o[key])`), first-wins on the top key
`idlookup`, so the delete's `idlookup` part is dropped (R-UNDO-5 measured the same). After one Cmd+Z: DReference absent,
`idlookup[edge] = {clonedCounter, pointedBy, isSelected}` with no `className`, `state.edges` and `state.references`
listing both ids again. Any edge create or delete merges into the previous step this way, whatever the path; the
context menu restores only when the stack was empty. A fix in editor-v2 cannot reach it (the merge is decided in the
reducer from the delta's keys), so «one undo step» of the prompt's fix is out of reach without a core change: Q3.

### 5.3 Absent affordances

The reference's tree row (`StructuralFeatureRow`, `TreeViewContent.tsx:1289`) and the rail (`Info.tsx:1769`) have no
delete. Q5.

## 6. Fix and Layer Impact Report

**Change** (`sync/canvasToJjom.ts`, `syncDeleteEdge`): before the M2 branch, when the edge's start vertex is over a
`DObject`, resolve the source object, the target object and the slot (the source's DValue whose `instanceof` is the
edge's `model`; when `model` is missing or dangling, the single DReference slot holding the target; none or several →
the DEdge alone is deleted). Then one TRANSACTION: `lSlot.setValueAtPosition(index, undefined, { isPtr: true })` at the
first index holding the target (for a containment slot this reassigns the child's `father` to the model,
`LModelElement.tsx:7855-7857`), `SetFieldAction.new(graph, 'subElements', edgeId, '-=', true)`,
`DeleteElementAction.new(edge)`; after it `clearCanvasEdgePair(start, end)`. An M1 edge whose `model` resolves to a
non-DReference keeps today's path (no other mechanism is known; nothing else changes).

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)      one TRANSACTION of SetFieldAction/DeleteElementAction, no creator
  [x] L-layer (computed proxies)    LValue.setValueAtPosition called (unchanged), no L code edited
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   RF edge dropped by the existing removal pass
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)  read only: pair guard cleared as syncDeleteReferenceById does
  [ ] Persistence (VersionFixer / jsxString)
```

- **D-layer.** Changes: an M1 edge delete writes the source slot's value at one index, the graph's `subElements`
  and the DEdge, in one dispatch, instead of deleting the DReference. Does not change: the M2 branch, the inheritance
  branch, `syncDeleteReferenceById`, the DEdge and DValue shapes. Cross-layer: the slot write goes through
  `setValueAtPosition`, the rail ×'s primitive, so `father` and `pointedBy` move as on the rail. Safety: pure actions
  in a TRANSACTION (editor-v2 CLAUDE.md §3.3 «SAFE»); `setValueAtPosition`'s own TRANSACTION nests pure actions only.
- **L-layer.** No L code edited; the containment side effect is the existing one of `_clearValueAtPosition`.
- **Canvas.** `deleteSelected`/`deleteEdge` already drop the RF edge locally; the id leaving `subElements` drives
  `useJjomSync.ts:1310-1315` to evict it from the cache. `useM1ReferenceEdges` sees the tuple gone and has nothing to
  reap (the DEdge is already deleted); a second value for the same pair recreates its edge (pair-keyed, rule 13).
- **Sync layer.** No hook edited. `clearCanvasEdgePair` as `syncDeleteReferenceById:548`.

Smoke scenarios potentially affected: M1 link delete (4 canvas paths), M1 composition edge delete, M2 reference delete
(4 paths, unchanged), inheritance delete (unchanged), the four demo scenes (open, no delete gesture).

Test: `sync/__tests__/syncDeleteEdge.test.ts` (new), the fake-barrel idiom of `hooks/__tests__/createAdapterFlow.test.ts`:
the subject runs, the joiner is mocked. Mutation bench on the new branch.

## 7. Files read

`frontend/src/components/editor-v2/EditorV2.tsx` (2380-2500, 2690-2860, 3360-3430, 1690-1850), `sync/canvasToJjom.ts`
(1-86, 289-380, 390-610, 1587-1720), `hooks/useM1ReferenceEdges.ts` (whole), `hooks/useJjomSync.ts` (303-343,
1180-1330), `components/DynamicHandles.tsx` (300-410), `edges/UnifiedEdge.tsx` (925-975), `components/editors/Info.tsx`
(680-700, 807-860, 950-958, 1400-1430, 1755-1770), `components/TreeViewSidebar/TreeViewContent.tsx` (1197-1343),
`common/Dummy.ts` (50-320), `redux/reducer/reducer.ts` (1110-1300), `common/U.tsx` (896-906),
`model/logicWrapper/LModelElement.tsx` (7836-7960), `docs/decisions.md` (RC-20..34, R-EDGE, R-UNDO).

Probes (gitignored, `frontend/scripts/smoke/_tmp_refdelete_*.ts`): `m2`, `m1`, `drawn`, `scene`, `scene2`, `undo`,
`label`, `bisect`, `explore`, `common`.
