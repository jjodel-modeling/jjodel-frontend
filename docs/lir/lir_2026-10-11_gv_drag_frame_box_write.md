# Layer Impact Report 2026-10-11: a container's position and size written as one record

- Prompt-ID: P-2026-10-11-1156. Chat: C-2026-10-10-0057. Session `66a12695`.
- Tree: `~/jjodel-w-gvdrag`, branch `gv-drag-frame`, base `bc5b997c1`; the lane's code is `2d2f75846` and
  `18569bcc3`, its probe `6fdf5be0d`.
- Written before any edit of a CLAUDE.md §3.2 file (the prompt, COSA 2: «write the exact change in a LIR under
  `docs/lir/` and stop with `Outcome: question`»). Claims are read in code at the base unless marked measured.

## 0. Verdict

**One §3.2 file has to change, `sync/canvasToJjom.ts`, in one function, `syncPositionBatchToJjom`**: it gains an
optional size per update, so that a vertex's position and size reach the D-layer as one record. Without it, the
existing calls cannot write a vertex's position and its size in one TRANSACTION, or even in one tick: the later write
takes back the earlier one (§1). That is the cause of the ticket of point 3 (S6 Auto layout) and the obstacle to the
rule's «written at drag end (record position and size, one TRANSACTION)».

The rest of the lane needs no §3.2 file: the frame geometry (`viewpoint/ir/irPartitions.ts`, `irContainment.ts`), the
container-drag carry and the pool's own drag-end record (`EditorV2.tsx`, the existing `syncPositionBatchToJjom` call).

## 1. Facts

1. **A layout write materializes the whole record from the store as it is.** `sync/canvasToJjom.ts:53-60`
   `resolveLayoutWriteFor` reads `store.getState()?.idlookup?.[vertexId]` and hands it to `resolveVertexLayoutWrite`
   (`viewpoint/layout/vertexLayout.ts:119-132`), which starts from `readVertexLayout(src, layoutKey)` and overwrites
   only the keys of the patch. `writeLayoutDictionary` (`canvasToJjom.ts:74-77`) emits
   `SetFieldAction.new(vertexId, 'layoutByViewpoint', { [vpId]: record }, '+=')`, a shallow merge per viewpoint id
   (its own comment, `reducer.ts:240-252`): the record of that viewpoint is replaced whole.
2. **Actions inside a TRANSACTION do not reach the store until the outermost END.** `redux/action/action.ts:210-223`:
   `BEGIN()`, `await func()`, `END()`; `FINAL_END` (`:153-181`) fires every pending action as one `CompositeAction`.
   `TRANSACTION` is `async`, so even two sibling calls in one tick nest: the second `BEGIN` runs before the first `END`.
3. **So `syncPositionBatchToJjom([v…])` then `syncSizeBatchToJjom([v…])` for the same `v`, in one tick, writes
   `{x', y', w, h}` then `{x, y, w', h', isResized: true}`; the second record replaces the first.** The position is
   lost; swapping the calls loses the size instead.
4. **Measured on this base** (probe `bpmn-lanes-fixture.ts`, scene `relayout`, tag `trunk`,
   `docs/discovery/assets/graphvertex-drag4/measures-trunk.json`): after one Auto layout Shop is drawn at
   `[48, 568, 1632, 360]` and its record is `[100, 100, 1632, 360, isResized]`: the S6 call site
   (`EditorV2.tsx`, `if (moved.length > 0) syncPositionBatchToJjom(moved)` then
   `syncSizeBatchToJjom([...result.sizes]…)`) writes both for Shop in one tick. After save and reload Shop is drawn at
   its record, Sales and Warehouse at `[130, 100]` and `[130, 280]`, and the five flow nodes outside their lanes.
5. **Measured with the lane's code** (tag `after`, `measures-after.json`): the record is the same, so the reload still
   differs. The frame now reaches the flow nodes from the stale record (Shop `[48, 100, 1684, 740]` instead of
   `[48, 568, 1632, 360]`): no node leaves its lane (`relayout-3` passes), but the picture changes (`relayout-1` and
   `relayout-4` fail, the only two reds of 86 BPMN checks). The statechart's Active is not resized by S6 in its
   fixture, and its relayout checks pass.

## 2. The change

`frontend/src/components/editor-v2/sync/canvasToJjom.ts`, `syncPositionBatchToJjom` (lines 97-112 at the base),
replaced by:

```typescript
/**
 * Write multiple vertex positions at once (e.g. multi-select drag). An update that also carries `w` and `h` writes the
 * vertex's box as sized by hand (`isResized`), in the same record: two writes of one vertex in one batch would each
 * read the record as the store holds it and the later would take back the earlier's half (P-2026-10-11-1156).
 */
export function syncPositionBatchToJjom(updates: Array<{ id: string; x: number; y: number; w?: number; h?: number }>): void {
    if (updates.length === 0) return;
    markCanvasUpdatedBatch(updates.map(u => u.id));
    const layoutKey = getActiveLayoutKey();
    TRANSACTION('EditorV2 drag batch', () => {
        for (const { id, x, y, w, h } of updates) {
            const sized = w !== undefined && h !== undefined;
            const write = resolveLayoutWriteFor(id, sized ? { x, y, w, h, isResized: true } : { x, y }, layoutKey);
            if (write.target === 'dictionary') { writeLayoutDictionary(id, write); continue; }
            SetFieldAction.new(id as any, 'x' as any, x, undefined, false);
            SetFieldAction.new(id as any, 'y' as any, y, undefined, false);
            if (sized) {
                SetFieldAction.new(id as any, 'w' as any, w, undefined, false);
                SetFieldAction.new(id as any, 'h' as any, h, undefined, false);
                SetFieldAction.new(id as any, 'isResized' as any, true, undefined, false);
            }
        }
    });
}
```

The parameter type only gains two optional properties (rule 11); every existing caller passes neither and is unchanged
byte for byte in what it writes. No creator inside the TRANSACTION (rule 12): SetField only, as before.

**The S6 call site** (`EditorV2.tsx`, the toolbar Auto layout, after `computeContainedAutoLayout`): the sizes travel
in the position batch; `syncSizeBatchToJjom` stays only for a resized vertex the layout did not move (none today, kept
for safety); the bounded redraw that waits for the sizes to land is unchanged.

```typescript
const moved = placed.filter(n => result.positions.has(n.id)).map(n => {
    const s = result.sizes.get(n.id);
    return { id: n.id, x: n.position.x, y: n.position.y, ...(s ? { w: s.w, h: s.h } : {}) };
});
if (moved.length > 0) syncPositionBatchToJjom(moved);
const unmoved = [...result.sizes].filter(([v]) => !result.positions.has(v));
if (unmoved.length > 0) syncSizeBatchToJjom(unmoved.map(([vertexId, s]) => ({ vertexId, w: s.w, h: s.h })));
```

## 3. Layer Impact Report

```
LAYER IMPACT REPORT — P-2026-10-11-1156

Layers touched:
  [x] D-layer (Redux raw data)       DVertex layoutByViewpoint[vp] (or x/y/w/h/isResized on the scalar path)
  [ ] L-layer (computed proxies)     untouched
  [ ] JjOM (model entities)          untouched
  [x] Canvas v2-flow (ReactFlow)     the S6 Auto layout writes; the presentation pass reads the records
  [ ] Canvas classic                 untouched (it never calls syncPositionBatchToJjom with a size)
  [x] Sync layer (useJjomSync hooks) canvasToJjom.ts, one function; anti-bounce unchanged (markCanvasUpdatedBatch)
  [ ] Persistence (VersionFixer)     no new field, no migration, no irVersion bump
```

- **D-layer.** Changes: a vertex in the S6 batch with a grown size gets one record `{x, y, w, h, isResized: true}`
  instead of two that cancel. Does not change: the record format, the per-viewpoint merge, the other viewpoints'
  records, `isResized` semantics (R-LAY-4, R-LAY-14). Cross-layer: the presentation pass (`applyContainerLayout`)
  reads the record a dispatch later, as today; the redraw retry of S6 still waits for it.
- **Canvas v2-flow.** Changes: after Auto layout the records of Shop (and of a lane that grew) equal what is drawn;
  a reload draws the same picture. Does not change: positions and routes computed by `elkContainers.ts`.
- **Sync layer.** Changes: one signature gains optional fields. Does not change: `markCanvasUpdatedBatch`, the
  TRANSACTION name, the scalar fallback for an unresolvable vertex.
- **Side-effect safety.** Every other caller of `syncPositionBatchToJjom` (drag end, multi-drag, S3 container carry,
  membership drop, the probe fixtures) passes `{ id, x, y }` only.

Smoke scenarios potentially affected: BPMN S6 (Auto layout, idempotence), statechart S6, the S6 flat and hull
controls, a drag of a pool after Auto layout, save → reload after Auto layout (`relayout` scenes, both fixtures).

## 4. The drag end: what the lane did, and the choice left open

The rule asks the drag end to write the container's record (position and size) in one TRANSACTION. With §2 approved,
that write is one more entry of the existing drag-end batch. The lane implemented the frame without it: the drawn box of
a framing container is the union of its record box (its origin and, when sized by hand, its far border) and the box its
children need (each child plus `PARTITION_CONTENT_MARGIN`, its band included), recomputed on every render, live and at
rest. At drag end nothing of the container is written; after a save and a reload the same records give the same box
(measured, scene `drag4`, check `reload-same`: no drift, BPMN and statechart). The two readings differ only when a child
that grew the frame is moved back: derived, the frame returns to its record box; written, it keeps the grown box, as
sized by hand, from then on.

The one record the drag end now writes differently is a dragged container's own: it lands at its record plus the drag
delta (`18569bcc3`), not where its box was dropped, so a box drawn off its record keeps its far border (scene `carry`:
Shop drawn `[60, 100, 940, 360]` over a record `[100, 100, 900, 360]`, dragged by `(84, 44)`, is drawn
`[144, 144, 940, 360]` over `[184, 144, 900, 360]`). A position write through the existing call; the mutant without
it is killed by `carry-1` and `carry-2`.
