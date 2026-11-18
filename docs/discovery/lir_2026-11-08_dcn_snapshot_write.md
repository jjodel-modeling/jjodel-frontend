# Layer Impact Report: DCN snapshot write (P-2026-11-08-2157)

Lane: DCN slice 5, lane 5. Format: CLAUDE.md §3.2. Decisions: R-DCN-27, R-DCN-30. Depends on `planSnapshot` (lane 4, 73476ef3f).
Measured on `dcn-drone-objects.jjodel` imported on its own dev server (port 3157), read only, before any code.

## Layers touched

```
[x] D-layer (Redux raw data)       new records only: one DModel, one DGraph, DObjects, their DValues
[ ] L-layer (computed proxies)     called, not changed
[ ] JjOM (model entities)          no code; the new M1 model is new JjOM content
[ ] Canvas v2-flow                 no code; drawn on open by the existing Step 2bis
[ ] Canvas classic                 not reached
[ ] Sync layer (useJjomSync hooks) not changed, not called by the write
[x] Undo history                   one entry, by the existing undo group
[ ] Persistence (VersionFixer)     no schema change, no default-view source touched
```

## D-layer

**What changes.** New records, nothing edited in place except the registrations:
`DModel.new(name, sourceMetamodel, false, true)` (the name through `uniqueModelName`, inside `DModel.new`), `DGraph.new` tagged `graphStyle: 'v2-flow'`, `project.models +=`, root `graphs +=`, `project.graphs +=` (the sequence of `ProjectEditor.tsx:1768-1805`). Then one `DObject.new(classId, newModelId, DModel, name, true)` per object of the source (117 on the drone), each giving its own DValues through the `instanceof` side effect, then `.values = [ids]` on reference slots and `.value` on attribute slots (`model/CLAUDE.md` §9.3), then σ over them. Slots are found by `instanceof`.

Reverse pointers the creates write outside the new model, as any instance does: `instances +=` and `pointedBy` on the M2 classes and features of the source metamodel. Not read by the run signature's model part and undone by the same entry.

**What does not change.** The source model and its objects: every reference of the copy is remapped to a new id, and the measured source has no reference outside the model (0 of 243 reference slots). `DModel._state` of the source is empty, so nothing of it needs copying. The metamodel's bag (dcn roles, R-OI bindings) is shared through `instanceof`.

**Containment.** Measured: 7 roots, 110 objects whose `father` is a DValue. They are created as roots of the new model, then the write on the containment slot moves them: `setValueAtPosition` sets `father = slot` when the reference is containment (`LModelElement.tsx:7964-7985`), the same two steps as the canvas path `syncCreateObject` + `syncCreateCompositionLink`. Created as roots because `DObject.new` has no uniqueness gate, while `addObject` refuses a name already at the root (`Slot_0` of two instances).

## Sync layer

**No change is needed in `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`.** No tab is opened, so no hook runs during the write. On open, Step 2bis (`useJjomSync.ts:843-875`) gives a DVertex to every object without one, the path written for JjScript and JjTL output; `useM1ReferenceEdges` draws the M1 edges. The writer creates no DVertex and no DVoidEdge, so Rule 12 has nothing to apply to. No TRANSACTION encloses `DObject.new`.

Consequence, to be measured by the probe: positions and sizes of the new diagram are the grid of Step 2bis (200 x 120), not the source's. Rows of an instance node may need more height than 120.

## Undo history

`beginUndoGroup` before the first create; `endUndoGroup` in a `finally`, after polling the store for every create and every write or past a deadline, because the store sends actions on its update timer (`instantiate.ts:797-805`). A group never folds with a neighbour: the writes are one entry, undo removes it whole.

## Cross-layer interaction

- The live run: `runSignature` reads the model's own objects and the M2 definitions, not `instances` or other models, so it does not move. A run freezes its model (P-2026-11-08-0345), and the source is only read.
- `σ` at the shown step, read through `configAt`: the run is not stepped.
- `DcnCompiled.slots` is recompiled on the frozen model: `compileDcn` is pure.

## Side-effect safety against other layers

The writes touch new records and reverse pointers on M2 only. No view, no viewpoint, no canvas state, no validation producer is called. Problems producers of the new model run when it opens, as for any model.

## Smoke scenarios potentially affected

| Scenario | Expected | How run |
| --- | --- | --- |
| Families.ecore import, 8 edges Family↔Member | unchanged: no import or M2 path is touched | reported in the closing message, see lane log |
| Open an existing project, views render | unchanged | the probe opens the drone project and its diagram before the write |
| Save and reopen, identical state | unchanged path; the new model persists as any M1 | the probe serializes the source before and after |

Uncertain propagation: none found that needs sync, port distribution or canvas-to-JjOM changes, so the lane proceeds.

## Addendum 2026-11-08: the snapshot keeps the source layout (P-2026-11-08-2320)

Why: on open, Step 2bis puts every object on a 200x120 grid and `temp` paints over the rows of `dji` (crop of P-2026-11-08-2216). The writer now creates the vertices itself. This addendum replaces the line «No DVertex» of the report above for objects that have a source vertex.

```
[x] D-layer (Redux raw data)       new records only: one DVertex per object with a source vertex
[ ] L-layer (computed proxies)     called, not changed
[ ] JjOM (model entities)          not reached
[ ] Canvas v2-flow                 no code; reads the new vertices on open
[ ] Canvas classic                 not reached
[ ] Sync layer (useJjomSync hooks) not changed, not called by the write
[x] Undo history                   same single entry
[ ] Persistence (VersionFixer)     no schema change, no default-view source touched
```

Measured on `dcn-drone-objects.jjodel`, read only: 117 M1 vertices for 117 objects, all in the model's `v2-flow` graph (`_graph5`); the other graph of the model (`_graph4`) has no sub-elements. 51 of them carry `layoutByViewpoint`, keys `__abstract__` and the UML object viewpoint. That dictionary is what the canvas shows: `dji` has the seed (50, 6650) and the record (60, 2600) in the viewpoint, `temp` the seed (50, 7850) and the record (900, 2600). Stored sizes are 200x80 (111) and 200x120 (6), `isResized` false on all.

**What changes.** After the slot writes, inside the same undo group, one `DVertex.new(0, object, graph, graph, undefined, new GraphSize(x, y, w, h))` per object with a source vertex, in the `v2-flow` graph `createModel` made, then two `SetFieldAction` on the new vertex only: `isResized` when the source's is true (`nodeSizing.ts` reads it as the gate on the stored size), `layoutByViewpoint` `+=` the source's dictionary when it has one (the write of `canvasToJjom.ts:79`). A view of the source is one of its layout records: the viewpoint ids are the project's, so they hold for the new model. Source vertex: the `DVertex` whose `model` is the object and whose `graph` is the source's `v2-flow` graph, as `useJjomSync` selects it.

**Rule 12.** A bare loop, no TRANSACTION around `DVertex.new`, as Step 2bis. The two writes are `SetFieldAction` with no creator.

**Graph id.** `Constructors.DGraph_makeID` increments a counter, so a second call names another graph: the id is the one taken when the graph is created.

**Plan keys.** `SnapshotCreate` carries no source id and `simSnapshot.ts` is outside this lane's scope. The writer matches the creates to the source objects by owner, class and name, in the plan's order, owners first. Objects the plan adds match nothing. Two siblings with the same class and name could exchange vertices; they cannot be told apart by name anyway.

**What does not change.** The source and its vertices (read only). `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `LModelElement`, `reducer`, `ProjectEditor`, no edit. Edges: none created here.

**Cross-layer interaction.** On open:
- Step 2bis reads `subElements` of the graph and creates a vertex only for objects with none: those the plan added keep the grid.
- The early exit of `useJjomSync.ts:790-794` also requires `missingM1EdgeCount === 0`, so M1 edges are still created on open with every vertex present.
- `autoLayoutOnOpen` runs only on a graph with no layout record. A source with records gives a snapshot with records, so it does not move them; a source with none gives a snapshot with none, and it runs as it would on the source.

**Side-effect safety.** New records and their own fields only; one undo removes them with the model. A tab opened on the new model during the 2 s of the write could run Step 2bis before the vertices land: no tab is opened by the write, and the panel does not open one.

Smoke scenarios, in the probe unless stated: every instance's vertex has the source's position and size; no node overlaps `dji`; source byte-equal; one undo removes all, vertices included; reopened Reset gives Flying. Open and save-reopen as above; Families.ecore import not run, no import or M2 path is touched.

Uncertain propagation: none found that needs a core or §3.1 file, so the lane proceeds.
