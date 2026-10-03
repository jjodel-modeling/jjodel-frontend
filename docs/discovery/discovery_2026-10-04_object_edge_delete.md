# Discovery: an object-as-edge (M1 Transition) cannot be deleted (P-2026-10-04-0130, Phase 1)

**Prompt-ID**: P-2026-10-04-0130. **Prompt**: `docs/prompts/claude_2026-10-04_0130_prompt_object_edge_delete.md`.
**Chat**: C-2026-10-04-0125. **Session**: `36c163e0-46f8-4c95-897f-c7da21dbfaa8`. **Tree**: `~/jjodel-w-objedgedel`,
branch `object-edge-delete`, HEAD `ae4ea38e6` (trunk `43685438b` plus the prompt). **Model**: Claude Opus 5.5.
**Go-ahead**: RC-30, `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-04-0130` in the session.

A set of hypotheses with evidence, not a reference. Line numbers are those of `ae4ea38e6`. **measured** = a run of the
lane probe `frontend/scripts/probe/object-edge-delete.ts` (`lane-run probe`, port 3084, 1600x1000, light, log
`~/.jjodel-lanes/P-2026-10-04-0130/probe-object-edge-delete.log`, JSON `probe_before.json`); **read** = a file read.

## 0. Answer in brief

- **Confirmed, and worse than the chat read it.** On DemoESM with the statechart notation derived and active, the 4
  transitions (metaclass `Transition`: `tc`, `tp`, `tu`, `ts`) are synthetic edges `irobj_<objectId>`. Right-click on
  one offers «Convert to Inheritance» and «Delete reference» (plus «Reset routing» with waypoints). «Delete reference»
  and select + Delete both change **nothing**: 4 edges and 4 DObjects at once and after 3 s, the undo stack never
  gets a delta, the problems registry unchanged (`simulation: 2`). The edge does not even leave the canvas for a
  frame: it lives only in the decorated array, so the base-state filter has nothing to drop (measured).
- **Root cause (read)**: every delete path ends in `syncDeleteEdge(edgeId, false)` (`EditorV2.tsx:2481`, `:2533`),
  whose first line resolves `irobj_<id>` as a pointer; there is no such D-object, so it returns before writing
  (`canvasToJjom.ts:618-619`). Nothing maps the synthetic id to its DObject, while `handleReconnect` (`:2104-2105`)
  and `handleEdgeChange` (`:3892-3893`) already do.
- **Other entry points**: none. `M1ReferencePopup.tsx` is a creation popup (`:51-63`); `onObjectAsEdgeClick`
  (`useJjomSelection.ts:241-247`) points the Properties panel at the object and writes nothing.
- **Recommendation (adopted, unattended)**: an object-as-edge gets its own menu, «Reset routing» (with waypoints)
  and «Delete <Metaclass>» (danger, trash). The delete is the object node's: `syncDeleteVertex` on the edge-object's
  hidden vertex in the canvas graph (its own link DEdges, then the DObject cascade), the same call `deleteNode` makes;
  a nested edge-object with no vertex there (R-B14 form (b)) goes to the same DObject cascade alone. Delete,
  Backspace, the toolbar trash and Cut route a selected object-as-edge there. M2 references, inheritance edges and
  M1 links keep `syncDeleteEdge` untouched.
- **Files**: `EditorV2.tsx` (menu branch, `deleteObjectAsEdge`, `deleteSelected` partition); `sync/canvasToJjom.ts`
  (two helpers, so both branches run under vitest: `EditorV2.tsx` does not import there); test
  `sync/__tests__/syncDeleteObjectAsEdge.test.ts`; the probe. Layer Impact Report in §6.
- **Decisions taken (unattended)**: D1-D5 in §7, adopted as recommended.
- **Decisions awaiting Alfonso**: none from the RC-26 list beyond the critical-zone edit, which RC-30's go-ahead
  covers; the visual GO of a critical-zone lane stays his (RC-23).

Questions (each answered as recommended, §7):
1. Menu content. Recommended: «Reset routing» when waypoints, «Delete <Metaclass>»; nothing else.
2. Delete path. Recommended: the object node's (`syncDeleteVertex` on the hidden vertex), the cascade alone without one.
3. Keyboard. Recommended: Delete, Backspace, toolbar and Cut on a selected object-as-edge do the same delete.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The right-click on a transition shows the generic M2 edge menu | **Holds** (measured): `Convert to Inheritance`, `Delete reference`; `Reset routing` too when waypoints. |
| H2 | «Delete reference» removes the edge from React Flow state only, and the next sync redraws it | **Falsified in its first half** (measured): the edge never leaves; 4 edges at 300 ms and at 3 s. Nothing is written (undo stack `null` throughout). |
| H3 | `deleteM1Link` runs and returns false for a synthetic id | **Falsified** (read): `syncDeleteEdge` returns at `if (!edgeProxy) return;` (`canvasToJjom.ts:619`) before reaching it; the effect is the same, no write. |
| H4 | The Delete key has a custom handler that reaches the same path | **Holds** (read, measured): `onKeyDown` (`EditorV2.tsx:2758-2761`) → `deleteSelected` → `syncDeleteEdge` (`:2481`); the selected synthetic edge is in `getEdges()` because React Flow is fed the decorated array (`:4320`) and the decoration re-applies `selected` (`useIRContainment.ts:191`). No change (measured). |
| H5 | Another delete entry point exists (M1ReferencePopup, onObjectAsEdgeClick) | **Falsified** (read). |

## 2. Measured, before the fix (`probe_before.json`, tag `before`)

DemoESM imported in a fresh context, M1 `demoESM` opened, statechart derived through the dialog's calls and activated
(the probe's `derive`, from `petri-ink-ports.ts`). Start: 4 synthetic edges `locked->locked`, `locked->unlocked`,
`unlocked->locked`, `locked->off`, labels `coin`, `push`, `push [model.[paid]]`, `stop`; 4 DObjects of `Transition`;
problems `{simulation: 2}`, the rest 0; undo stack `null` (no delta yet).

| Step | Menu (DOM) | Edges | DObjects | Undo stack | Problems |
|---|---|---|---|---|---|
| right-click `tc` (`locked->locked`) | `Convert to Inheritance`, `Delete reference` (danger, `bi-trash`) | 4 | 4 | null | sim 2 |
| click «Delete reference», +300 ms | | 4 | 4 | null | sim 2 |
| +3 s (two syncs) | | 4 | 4 | null | sim 2 |
| Cmd+Z | | 4 | 4 | null | |
| click `tp` (selected: true), Delete, +300 ms / +3 s | | 4 / 4 | 4 / 4 | null | |
| waypoint set on a third transition, right-click | `Convert to Inheritance`, `Reset routing`, `Delete reference` | | | | |

The scene Alfonso described (microwave: Idle, DoorOpen, TimeAdded) is not the one in `~/jjodel-demo-exports/scene_3_DemoESM.jjodel`
(a turnstile: `locked`, `unlocked`, `off`); the mechanism is the same, transitions as object-as-edge. Crops:
`~/.jjodel-lanes/P-2026-10-04-0130/crops/oed_before_menu.png`, `oed_before_menu_waypoints.png`.
Console errors on DemoESM after the derive, present before any change: `Cannot serialize in ecore, found loop`
(`LModelElement.tsx:5939`), and on every scene `Invalid action path 0` at import (`reducer.ts:43`).

## 3. Findings (read)

- **The menu.** `EditorV2.tsx:3412-3468`, one branch for every edge: «Edge context menu» … `label: isInheritance ?
  'Convert to Reference' : 'Convert to Inheritance'` … `label: isInheritance ? 'Delete inheritance' : 'Delete
  reference'`, `onClick: () => deleteEdge(contextMenu.edgeId!)`. «Create edge view» is gated on
  `edgeData?.reference?.id` (`:3453`), absent on a synthetic edge, which is why it did not show.
- **The delete.** `deleteEdge` (`:2525-2536`): `if (isJjomMode && edge) syncDeleteEdge(edgeId, edge.type ===
  'inheritance');`. `deleteSelected` (`:2448-2500`): `for (const edge of selectedEdges) { syncDeleteEdge(edge.id,
  edge.type === 'inheritance'); }`. `syncDeleteEdge` (`canvasToJjom.ts:616-619`): `const edgeProxy: any =
  LPointerTargetable.fromPointer(edgeId); if (!edgeProxy) return;`.
- **The synthetic edge.** `viewpoint/ir/irEdgeViews.ts:326-336`: `id: \`irobj_${objectId}\``, `data: { irObjectAsEdge:
  true, irObjectId: objectId, … }`. The object's own vertex is hidden and its own reference edges dropped (`:341-345`):
  «Suppress the hidden object's own reference edges (they duplicate the synthetic edge)». R-B14: an edge-object may
  also have no vertex (form (b), `father = DValue`).
- **Selection outside the base state.** `onEdgesChange` (`EditorV2.tsx:464-477`): «Synthetic IR edges (object-as-edge,
  ids irobj_*) exist only in the decorated array»; `onEdgeClick` (`:2853-2860`) keeps the selection in the IR
  interaction store. The base-state filters of `deleteEdge`/`deleteSelected` can therefore not drop them.
- **The object node's delete.** `deleteNode` (`:2503-2522`): `takeSnapshot(); setNodes(… n.id !== nodeId); setEdges(…
  e.source !== nodeId && e.target !== nodeId); if (isJjomMode) syncDeleteVertex(nodeId);`. `syncDeleteVertex`
  (`canvasToJjom.ts:397-485`): singleton guard, the vertex's connected DEdges in one TRANSACTION, then for a DObject
  `modelElement.delete()` («the canonical cascade cleans the incoming reference slots via pointedBy (case 'values'), the
  instance's own DValue features (children), model.objects (father safety net) and every DVertex across graphs»).
- **The vertex of an edge-object.** `irVertexIdForObject(graphId, objectId)` (`EditorV2.tsx:187-196`), the graph's
  `subElements` scanned for the DVertex whose `model` is the object.
- **Routing.** A synthetic edge's waypoints live in the IR session store; `handleEdgeChange`'s `irobj_` branch
  (`:3886-3904`) turns `data.waypoints` into `setIREdgeAnchorOverride(objectId, { waypoints })` and
  `persistIREdgeLayout(objectId)`; the base-state `setEdges` of the generic «Reset routing» (`:3434-3447`) cannot
  reach a synthetic edge. `persistIREdgeLayout` (`:1552-1561`) returns without writing when the override reduces to
  nothing (`if (!layout || …) return;`): an empty waypoint list with no side pin is not persisted, so a reset of a
  persisted route would come back at reload (read, not measured; D4).
- **Other entry points.** `M1ReferencePopup.tsx:51-63`: `options`, `onSelect`, `objectEdgeOptions`,
  `onSelectObjectEdge`, creation only. `useJjomSelection.ts:241-247` `onObjectAsEdgeClick`: `selectEdgeTarget(edgeId,
  modelid)` only. Toolbar trash (`Toolbar.tsx:852`) and Cut (`EditorV2.tsx:2697-2700`) call `deleteSelected`.
- **Keyboard.** `deleteKeyCode={null}` (`:4357`); the wrapper div `tabIndex={0} onKeyDown={onKeyDown}` (`:4451`).

## 4. Dependencies and risks

- Undo: the object delete is two dispatches (`syncDeleteVertex`'s edge TRANSACTION, then `.delete()`'s own); the
  reducer's merge of a delta carrying `edges` into the previous step (2026-09-30 report §5.2) may apply. Measured after
  the fix (addendum §10), not assumed.
- The 2026-09-30 tickets (ghost edges after a cascade, one-step undo of an edge delete) are core; this lane does not
  touch the reducer or `Dummy.ts`.
- Pair guard: the edge-object's own link DEdges are pair-keyed M1 edges (rule 13); `syncDeleteVertex` deletes them
  without clearing the guard, as for any object node today. Not changed here.

## 5. Fix

`EditorV2.tsx`:
- Edge context menu: before the generic branch, `resolveObjectAsEdge(edgeId, idlookup)`; when it answers, the menu is
  `[«Reset routing» if waypoints, «Delete <metaclassName>»]`. «Reset routing» calls `handleEdgeChange(edgeId, { data:
  { waypoints: [] } })`, the synthetic branch the segment gesture uses.
- `deleteObjectAsEdge(edgeId)`: resolve, `irVertexIdForObject(graphId, objectId)`, `takeSnapshot()`, drop the synthetic
  selection, drop the hidden vertex and its edges from React Flow state as `deleteNode` does, then
  `syncDeleteObjectAsEdge(objectId, vertexId)`.
- `deleteSelected`: the selected `irobj_` edges leave `selectedEdges` and go to `deleteObjectAsEdge`; nothing else in
  the function changes.

`sync/canvasToJjom.ts` (critical zone):
- `resolveObjectAsEdge(edgeId, lookup)`: pure, `irobj_<id>` whose `<id>` is a live DObject → `{ objectId,
  metaclassName }`, every other id → null.
- `syncDeleteObjectAsEdge(objectId, vertexId)`: with a vertex, `syncDeleteVertex(vertexId)`; without, the DObject's
  `.delete()` (the same cascade `syncDeleteVertex` ends with, singleton guard inside it). `syncDeleteEdge` untouched.

## 6. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)      through the existing syncDeleteVertex / LObject.delete only, no new action shape
  [ ] L-layer (computed proxies)    LObject.delete called (unchanged), no L code edited
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   hidden vertex and its edges dropped locally, as deleteNode does
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)  not edited; its removal pass evicts the vertex as for any node delete
  [ ] Persistence (VersionFixer / jsxString)
```

- **D-layer.** Changes: a synthetic `irobj_` id now reaches a write, the object node's delete. Does not change:
  `syncDeleteEdge` (M2 cascade, `deleteM1Link`, inheritance), `syncDeleteVertex`, `Dummy.get_delete`. Cross-layer: the
  same two dispatches an object node's delete makes (edge TRANSACTION of pure `DeleteElementAction`, then `.delete()`'s
  own async TRANSACTION, never wrapped: editor-v2 CLAUDE.md §3.3). Safety: no creator, no outer TRANSACTION.
- **Canvas.** `setNodes`/`setEdges` filters on the hidden vertex id, the shape of `deleteNode`; the synthetic edge
  disappears because synthesis no longer finds the object (`irEdgeViews.ts:295-296`, «const metaclassId =
  idlookup[objectId]?.instanceof; if (typeof metaclassId !== 'string') continue;»). Ordinary edges: `deleteSelected` keeps its filters for the non-synthetic ones.
- **Sync layer.** Not edited. `useJjomSync`'s removal pass and `useM1ReferenceEdges` see the vertex and the link DEdges
  gone as after any object node delete.

Smoke scenarios potentially affected: object-as-edge delete (menu, Delete, Backspace, toolbar, Cut) on DemoESM; M2
reference, inheritance and M1 link delete (unchanged, unit tests); the four demo scenes' default panes (identical,
probe).

## 7. Decisions taken (unattended)

Adopted as recommended (RC-21, RC-25), provisional; R-B17 in `docs/decisions.md` at closure.

- **D1** The menu of an object-as-edge holds «Reset routing» (only with waypoints) and «Delete <Metaclass>» (danger,
  `bi-trash`). No «Convert to …», no «Delete reference», no «Create edge view». (Q1)
- **D2** The delete is the object node's: `syncDeleteVertex` on the hidden vertex in the canvas graph; without a vertex
  there, the DObject cascade alone. (Q2)
- **D3** Delete, Backspace, the toolbar trash and Cut on a selected object-as-edge do the same delete. (Q3)
- **D4** «Reset routing» uses `handleEdgeChange`'s synthetic branch; its reload gap (§3, Routing) is a ticket, not fixed
  here (`persistIREdgeLayout` is shared by the segment and anchor gestures).
- **D5** The two helpers live in `canvasToJjom.ts`, the delete-path module the bench can import (CLAUDE.md §5: move the
  pure logic where the bench runs it); the menu's item list stays in `EditorV2.tsx`, covered by the probe from the DOM.

## 8. Decisions awaiting Alfonso

None from the RC-26 list: the critical-zone edit is covered by RC-30's go-ahead, with the LIR in §6. The visual GO of a
critical-zone lane is his (RC-23).

## 9. Files read

`frontend/src/components/editor-v2/EditorV2.tsx` (180-215, 430-510, 1540-1590, 2080-2180, 2420-2560, 2690-2900,
3150-3530, 3855-3925, 4315-4360, 4445-4455, 4555-4575), `sync/canvasToJjom.ts` (1-90, 165-200, 390-660),
`viewpoint/ir/irEdgeViews.ts` (280-470), `viewpoint/ir/irEdgeInteraction.ts` (whole), `utils/edgeSelectionTarget.ts`
(whole), `hooks/useJjomSelection.ts` (170-270), `components/M1ReferencePopup.tsx` (40-125), `Toolbar.tsx` (840-860),
`ContextMenu.tsx` (1-70), `problems/registry.ts` (40-60, 180-300), `sync/__tests__/syncDeleteEdge.test.ts` (whole),
`docs/discovery/discovery_2026-09-30_reference_delete.md`, `docs/decisions.md` (RC-14, RC-21..30, R-B10..16),
`docs/PROTOCOL.md`, `frontend/src/components/editor-v2/CLAUDE.md`.
