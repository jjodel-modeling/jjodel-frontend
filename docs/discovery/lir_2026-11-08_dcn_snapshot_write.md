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
