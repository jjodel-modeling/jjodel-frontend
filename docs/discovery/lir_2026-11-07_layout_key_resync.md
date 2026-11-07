# Layer Impact Report: the layout key becomes an input of the incremental sync (P-2026-11-07-0430)

**Prompt-ID**: P-2026-11-07-0430. **Chat**: C-2026-11-07-0425. **Tree**: `~/jjodel-w-mtlk`, branch
`multi-tab-layout-key`, HEAD `753122b0b` at the start. **Decision**: R-MT-19 (critical-zone go-ahead of Alfonso,
2026-11-07 04:23). **Evidence base**: `discovery_2026-11-07_layout_switch_after_242a82bcd.md` §3-§6 (F1-F5, the
0/3 measurement), `discovery_2026-10-21_jjomsync_incremental.md` §3.3 (cost of one full re-transform).

Written before any edit. Files of `CLAUDE.md` §3.1 touched: `useJjomSync.ts` only. Also touched:
`sync/vertexSnapshot.ts` and a new test beside its own. No D-layer write, no TRANSACTION, no creator call.

## The defect, read on this tree

A viewpoint switch dispatches `state.viewpoint` and nothing else: no vertex D-object, no model element, no content
hash changes. Selector 2 of `useJjomSync.ts` (`:1146-1168`) therefore returns a map whose every entry is `===` to the
last one, `mapReferenceEqual` (`:106`) holds, and the incremental effect (`:1300-1617`) does not even run. Had it run,
`unchanged` (`:1406`) would skip every vertex (`:1414`). `jjomVertexToRFNode` would read the new key through
`effectiveLayoutOf` → `getActiveLayoutKey()` (`jjomTransformers.ts:58-59`), but it is not called.

## The change

| Item | Where | Change |
|---|---|---|
| 1 | `sync/vertexSnapshot.ts` | New pure `elementSnapshotsOf(idlookup, ids, layoutKey)`: the body of selector 2, moved verbatim, plus one term. For an element whose `className` contains `Vertex` (the test of `isVertexClassName`), the `ch:<id>` number also mixes the layout key (`term:layoutKey`). New pure `snapshotUnchanged(prev, curr, id)`: the three-entry comparison of `:1406`, moved verbatim |
| 2 | `hooks/useJjomSync.ts`, selector 2 | `elementSnapshotsOf(state.idlookup, subElementIds, getLayoutKeyOf(state))`, same comparator |
| 3 | `hooks/useJjomSync.ts`, `:1406` | `const unchanged = snapshotUnchanged(prevElements, elementSnapshots, id)` |
| 4 | new `sync/__tests__/vertexSnapshotLayoutKey.test.ts` | Written first, red on its own commit |

Why the key goes **into each vertex's hash** and not into a per-run flag ("bypass `unchanged` for that run" or
"clear `prevElementsRef`", the two variants of the L0b report §5): a vertex inside the anti-bounce window
(`isCanvasUpdated`, 300 ms, `syncState.ts:78`) at the moment of the switch is skipped (`:1408-1412`) and its OLD
entries are carried into `prevElementsRef` (`:1488-1499`) so the re-run 350 ms later (`:1503-1509`) compares it again.
With a per-run flag the re-run sees the same key and the old entries compare equal: that vertex stays at the old
key's position. Clearing `prevElementsRef` has the same hole, since the carry-over finds nothing to carry. With the
key in the hash, the carried old number holds the old key, the new number the new key, the re-run re-transforms
the vertex: the existing anti-bounce machinery covers the switch with no new state. It is also the maintenance rule
written at the head of `vertexSnapshot.ts` («a transformer read added later must extend this hash»): the key is
exactly such a read.

Only vertices whose element has a `model` pointer carry `ch:` today, and the key goes on that same entry. A vertex
with no model element yields no node (`jjomVertexToRFNode` returns `null`, `jjomTransformers.ts:503`), so no rendered
vertex is left out.

## LAYER IMPACT REPORT

```
Layers touched:
  [ ] D-layer (Redux raw data)
  [x] L-layer (computed proxies)        read only, as today: one fromPointer + transform per vertex per switch
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

**Sync layer**
- What changes: selector 2 carries, per vertex, the layout key in force; a key change changes every vertex's `ch:`
  number once, so the next incremental run sees `!unchanged` for every vertex and re-transforms it once. A second run
  under the same key compares equal again: the incremental path of `d9ea6a486` / `242a82bcd` stays as it is.
- What does NOT change: structural additions and removals (`:1325-1392`), the anti-bounce skip, carry-over and re-run,
  the deferred patch queue and `scheduleFlush`, Step 3 / Step 4 and every edge guard (Rule 13), the init transform
  (`:1219-1297`), `Date.now()` and `prevModel = {}` stay absent (R-LAY-18's note is about their removal, done in
  `242a82bcd`; this is the designed re-propagation it asks for).
- Cross-layer interaction: the selector already runs on every dispatch over all subElements; it now also calls
  `getLayoutKeyOf(state)` once (two property reads) and mixes one number per vertex.
- Side-effect safety: the selector stays pure (raw `idlookup` and `state.viewpoint` reads); the comparator still
  sees numbers and D-object references, so no new object per dispatch and no re-render loop.

**Canvas v2-flow: positions, sizes, `measured`, handles**
- Positions: the existing patch path compares transformer output against `rfNodeCache` (`:1427-1428`) and patches
  `position` where the new key's record differs (`patchedNodePositions`). Vertices whose layout is the same under
  both keys (no record under either: the seed) are re-transformed and patch nothing.
- Sizes: the existing top-level size comparison (`:1445-1451`, `a7d52327a`, R-LAY-18) patches `width`/`height` and
  drops `measured` where the effective size differs, or drops all three where the new key has none. Unchanged code.
- Handles: dropping `measured` resets `handleBounds` and React Flow's ResizeObserver recomputes them
  (`:1554-1559`); a position-only patch keeps the node's handle bounds, which are node-relative. Unchanged code.
- Data: `patchedNodeData` only when the transformer's data differ (`shallowDataEqual` / `samePlainData`), so a
  switch re-renders node content only where the data depend on the key.

**Edges**: not re-patched. The key is mixed only for vertex elements, so edge entries compare equal and the edge
branch (`:1471-1482`) does not run on a switch. Nothing is lost: on a re-transform that branch copies
`sourceHandle`/`targetHandle` from the cache, so the edge it would build is the one already there. Edge paths follow
the moved nodes through React Flow's internals. Handle ids are not re-distributed on a switch, as before `242a82bcd`
(the old per-render re-transform preserved them too); `portDistribution.ts` is not touched.

**`useIRContainment` / `applyContainerLayout`**: reads the key itself (`useIRContainment.ts:194`,
`getLayoutKeyOf(state)`); not touched. It now receives a new node array once per switch, with the new key's
positions, where before the fix it got the old positions under the new key.

**`fitView` and the viewport per key**: not touched. The stored viewport is read once per mount
(`EditorV2.tsx:585-587`, `readStoredViewport(modelid, getActiveLayoutKey())`), `fitView` fires on the open-settle
callback and explicit gestures only (`:613-619`, R-LAY-18). A switch neither fits nor restores the viewport, before
or after this fix; if the new key's positions lie off screen, the view does not follow. Outside this lane.

**D-layer**: receives no writes. The patch goes through `setNodes(fn)`, which emits no `onNodesChange`; the only
React Flow change a patch can provoke is the `dimensions` re-measure after `measured` is dropped, the existing
R-LAY-18 path, unchanged.

**Multi-tab**: two open `EditorV2` tabs each run their own selector; with the global key both re-transform on a
switch. Lane L3's per-tab key replaces `getLayoutKeyOf(state)` in the selector argument: the same dependency.

## Cost on the 407-instance harness model (estimate from the code, measured in lane 0431)

- Per dispatch, not only per switch: one `getLayoutKeyOf` and, per vertex, one string hash of the key mixed into a
  number. The key hash is computed once per selector call, so the per-vertex cost is one multiply-add: negligible
  beside `vertexChildrenHash`, which already walks each vertex's children on every dispatch.
- Per switch: one run that re-transforms every vertex once. `discovery_2026-10-21_jjomsync_incremental.md` §3.3
  measured one such run at 3051 `LObject.name` reads on this model, and the long-task difference of one run at about
  250 ms (drag, D vs DP) to 500 ms (click, D vs DP), dev, ±30 %. Plus one `setNodes` patch over the nodes whose
  position or size differs, and React Flow's re-render of those nodes, not measured before.
- Not per render: before `242a82bcd` the same full run happened on every host render (16 per drag).

## Collision

The key enters as a 32-bit mix. Two viewpoint ids whose key terms collide would leave a switch between exactly those
two undetected, the same 2^-32 order the content hash already accepts for every edit. Accepted.

## Smoke-test scenarios potentially affected (lane 0431)

- Two exclusive viewpoints, three nodes moved under each: A → B → A, every node at the active key's record, at +4 s
  and +10 s (L0b steps 2, 3, 5).
- Reload under B, then B → A (L0b steps 4-5).
- Rename one object after a switch: only that node re-renders, the others stay (L0b step 6, the incremental path).
- A container viewpoint (R-GV layouts): containers and children both follow the switch.
- Resized node under one key, auto-sized under the other: the size follows the key, the edges stay attached.
- Drag a node and switch within 300 ms: the node lands at the new key's record after the anti-bounce re-run.
- Switch cost on the 407-instance model.

## Uncertain

The re-render cost of a full position patch on 407 nodes. Not a propagation question: no layer beyond the ones
above receives anything new.

## Addendum P-2026-11-07-0555 (1): what the re-transform of a switch does that a key change does not need

**Prompt-ID**: P-2026-11-07-0555, item (1), written before any code. **Source**: the CPU profiles lane 0431 took on
this code (`03a093081`, `~/.jjodel-lanes/P-2026-11-07-0431/vp-cost-out/perfclick-{head,parent}-lp-r{1,2,3}-vp.cpuprofile`,
switch «Harness / Lane process (BPMN)» → «Harness / Lane process», 407-instance harness model), attributed by stack
(inclusive time of the samples with a frame of the named function or file), mean of three runs each side.

| Inclusive, ms (mean r1-r3) | head `03a093081` | parent `753122b0b` | delta |
|---|---|---|---|
| whole switch (root) | 5689 | 4966 | +723 |
| frames of `useJjomSync.ts` or `vertexSnapshot.ts` | 279 | 48 | +231 |
| of which the incremental effect | 226 | 0 | +226 |
| of which `jjomVertexToRFNode` → `objectVertexToRFNode` | 214 | 0 | +214 |
| `DynamicHandles.tsx` (handle re-measure, `updateNodeInternals`) | 313 | 131 | +182 |
| `IRNodeContent.tsx` / `useContentSize.ts` | 266 / 329 | 222 / 301 | +43 / +27 |

`LObject.name` reads per switch: 3458 head, 407 parent (the probe's counter): +3051, the figure
`discovery_2026-10-21_jjomsync_incremental.md` §3.3 measured for one full re-transform. The L-layer self time 0431
named (`joiner/proxy.ts`, `LModelElement.tsx`) sits under `objectVertexToRFNode` for 153 of its 256 ms in head r3.
Fibers committed per switch: 14916-14922 head, 13140 parent.

**The hypothesis holds.** In `utils/jjomTransformers.ts` the layout key enters a vertex's node through one function
only, `effectiveLayoutOf` (`:58-60`, `readVertexLayout(raw, getActiveLayoutKey())` on the vertex D-object), read for
`position` by all four node types (`:202`, `:249`, `:272`, `:478`), for the top-level `width`/`height` of class, enum
and object nodes through `manualSizeOf` (`:74-85`), and for `style.width`/`style.height` of a package node (`:277-278`,
defaults 400 and 300). Its other caller (`:545-546`) is `computeOptimalHandles`, an edge read. Every other field of the
node (`id`, `type`, the package's `zIndex`, all of `data`) reads the model element through L proxies, or the vertex
D-object (`ghostOffsets`, `:179`), which the snapshot holds by reference. Nothing there reads `state.viewpoint`. So a
vertex whose D-object, model element D-object and content hash are unchanged, and whose `ch:` number moved only by the
key term, gets from the transformer the cached node with a new geometry. The 214 ms of `objectVertexToRFNode` (the
data build, the proxy reads, `namelessTargetLabel` 51 ms) plus one `LPointerTargetable.fromPointer` per vertex is the
work a key change does not need. The geometry is `readVertexLayout` under the new key on the D-object the snapshot
already holds, and the existing comparison against `rfNodeCache` (`useJjomSync.ts:1404-1435`) patches position and
size exactly as it does today.

**What the cheap path does not remove.** The other ~490 ms of the delta follow from the nodes actually moving, which
the parent does not do: `DynamicHandles` re-measures the handles of the moved nodes (+182), React Flow and React
re-render them (+1780 fibers), the IR content re-reads its size. Projected head-minus-parent after the change: about
+500 ms, above the 300 ms target of item (3). Lowering that part is outside `useJjomSync.ts` and `vertexSnapshot.ts`.

**The cheap path, as it will be written (item 2).** A vertex goes through it only when the transformer would return
the cached node with new geometry, decided on the snapshot alone and failing towards the full transform:
- `!snapshotUnchanged`, the vertex D-object and the model element D-object `===` to the last run's, a cached node
  exists, and the layout key in force differs from the key of the last run;
- the `ch:` number equals the last run's with the last run's key term subtracted and the new one added. `mixNum`
  adds the key term last (`h * 31 + term`, mod 2^32), so this is exact: equal iff the content hash is equal (the
  2^-32 collision the hash already accepts). A vertex carried over by the anti-bounce window holds an older key's
  number, the subtraction of the last run's term does not cancel it, and it takes the full transform, as today.
- The key of the last run is a ref beside `prevElementsRef`, written where it is written; the key of the run comes
  from a `useSelector(getLayoutKeyOf)`, the same state the snapshot was built on. The snapshot map keeps its shape,
  so the carry-over and the tests of `03a093081` stand unchanged.
- The geometry mirrors `jjomTransformers.ts` (`effectiveLayoutOf`, `manualSizeOf`, the package defaults) as a pure
  function in `vertexSnapshot.ts`: the transformer imports `joiner`, so the bench cannot call it, and moving its
  helper out is a file outside this lane. The mirror is a maintenance rule (a geometry read added to the transformer
  must be added there), checked in the app by the 0431 probes in item (3).
