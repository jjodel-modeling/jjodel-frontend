# Layer Impact Report 2026-11-04 — the open-time auto-layout race in useJjomSync

Prompt: P-2026-11-04-1444 · Chat: C-2026-11-03-2317 · Front: hw-notation · Lane: full, critical zone.
Parent report: `docs/discovery/discovery_2026-11-04_elk_open_freeze.md` (F1, F3, fix C). Cap of 500 (`b35f43b84`) unchanged.
Written and committed before any code (CLAUDE.md §3.2).

## 0. The race, as read on this tree

- The populate effect of `useJjomSync` (`useJjomSync.ts:450-1068`) creates the missing vertices (Step 2bis) and edges
  (Steps 3, 4) and raises `justCreatedGraphRef` (`:705`). Each creator runs `Constructors.persist`, whose `TRANSACTION`
  (`redux/action/action.ts:210-226`) is async: `END` runs in a microtask, so every creator of one populate run nests
  into one transaction, and its `CompositeAction` reaches the store through one `setTimeout(0)` dispatch
  (`action.ts:349`). The store does not hold the run's elements while the effects of that commit run.
- The init effect (`:1099-1173`) runs in the same commit, after the populate effect, pushes to React Flow what the
  L-graph holds at that instant, then `requestAnimationFrame(onInitialized)` (`:1168`). EditorV2's callback
  (`EditorV2.tsx:597-627`) waits 50 ms, reads the flag, the canvas counts and the model, and decides
  (`shouldAutoLayoutOnOpen`). Whether the populate dispatch, the re-render and the incremental sync's rAF flush have
  landed by then depends on scheduling and load. Measured by the 0926 probe on b10_8: ELK called on 1 node, 0 edges,
  while the model held 2,559 objects and D-state 15 vertices.
- So the decision and ELK's input are an arbitrary prefix of the graph, and the S4b watcher (`EditorV2.tsx:4247-4286`)
  reruns ELK when the remaining reference edges reach the canvas within 3 s: a second layout, later, on another input.

## 1. The change (the gate lives in useJjomSync, EditorV2 unchanged)

`onInitialized` is no longer fired by the init effect at its first push. It fires once, when the open has settled:

1. every element the populate runs of this mount created (ids returned by `DVertex.new`, `DVoidEdge.new2`) is in the
   store;
2. every one of them that the graph lists in `subElements` has been processed by the canvas push (init effect or
   incremental sync: it is in the last processed `subElements`);
3. no React Flow patch is queued or scheduled (`pendingNodePatchRef`, `pendingEdgePatchRef`, `rafIdRef`).

A mount that creates nothing is settled at the init effect: same frame as today. While waiting, a 50 ms poll
re-checks. Two exits lower `justCreatedGraphRef` before firing, so no open-time layout runs:

- **the user has started working**: a canvas write-back marked a vertex of the graph (`isCanvasUpdated`, raised by
  `syncPositionToJjom`, `syncPositionBatchToJjom`, `syncSizeToJjom`, `syncSizeBatchToJjom`, and by a selection in
  `useJjomSelection.ts`, which marks every element of the graph; before the decision only a drag end, a resize end,
  the propagate-size command or a click write them);
- **the deadline**: the open has not settled within a fixed time from the init push. A layout that late would move
  nodes the user may already be looking at.

The pure part is an exported function of `useJjomSync.ts`, tested by execution; the hook wiring through a minimal
hook runtime with the joiner barrel faked (idiom of `hooks/__tests__/useM1ReferenceEdges.test.ts` and
`viewpoint/ir/__tests__/useContentSizeLoop.test.ts`).

## LAYER IMPACT REPORT

```
Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   — timing of the init callback only
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

**Sync layer (`useJjomSync.ts`)**
- What changes: the init effect stops calling `onInitialized` directly; a gate (refs, a poll timer, a deadline timer,
  cleared on unmount and on a model change) fires it once. The populate effect records the ids its creators return.
- What does NOT change: the populate effect's deps (`:1068`, the Step 4 list of `editor-v2/CLAUDE.md` §3.5), its
  guards (rule 13), its early exits, the 150 ms `creatingGraphRef` gate, the grid placement of Steps 2 and 2bis. No
  TRANSACTION is added (rule 12). The incremental sync's diff, anti-bounce and patch logic are untouched; the flush
  callback only calls the gate's check after applying its patches.
- Cross-layer interaction: reads `idlookup` and `syncState.isCanvasUpdated`; writes nothing to D.
- Side-effect safety: `useM1ReferenceEdges` keeps its own trigger and guards; it may still add edges after the
  decision, as today.

**Canvas v2-flow / layout (EditorV2's callback, file unchanged)**
- What changes: the callback runs after the open has settled, so `getNodes()`/`getEdges()` hold the whole graph: the
  cap counts the real canvas, ELK gets every vertex and edge created at open, the opening fit frames the whole graph,
  `applyDistribution` sees every edge at once.
- What does NOT change: `shouldAutoLayoutOnOpen`, the cap, the explicit layout command, the S4b watcher. The watcher
  is armed with a baseline that already holds the open's reference edges, so it reruns only for edges arriving after
  the decision.
- Side-effect safety: a mount that creates nothing fires in the same frame as today. On b10_8 (capped) the callback
  comes after the populate dispatch and the incremental sync of 2,559 vertices: the fit frames the whole graph and
  clamps at the minimum zoom (the "21 nodes at zoom 0.5" outcome of the 1204 runs) instead of the 1 to 4 nodes
  present at +50 ms.

**IR (viewpoint/ir)**: mount, measurement and content-size loop unchanged and not delayed; `useContentSize.ts` does
not write through `syncSizeToJjom`, so it does not trip the user exit. Residual: an IR authoring size write during
the wait would read as the user's.

**Edges**: creation paths unchanged; returned edge ids kept for the check. Edges never linked into `subElements` are
not waited for.

**Route A (`unmeasuredNodes.ts`)**: estimate and mount rule unchanged; the fit at the callback frames the full node
set, so the nodes mounted at settle are those the minimum-zoom viewport covers, every run.

**Undo group of R-JTG-14**: the group closes after 800 ms without store writes (`ProjectEditor.tsx:1719-1734`). The
open's vertices and edges land in the populate dispatch, as today, so they stay in the step. The open-time layout's
position batch now comes after settle + one frame + 50 ms + ELK; under the cap ELK costs up to about 3 s at the
measured load, so that batch can fall after the quiet window and become an undo step of its own. Today the S4b
rerun's batch can do the same. The probe reads the undo count before and after the run, on both trees.

```
Smoke-test scenarios potentially affected:
  - JjTL run under the cap (b6_5, 191 objects): one ELK call with every node and edge, same decision on five runs,
    no watcher rerun; undo count per run.
  - JjTL run, b10_8: no ELK call (cap), one skip line with the full canvas count, five runs.
  - Reopen of a laid-out model: no layout, callback in the first frame (unit test).
  - Metamodel first open: layout once, as today (unit test: landed at init).
  - A drag during the wait: no open-time layout (unit test).
  - A creation that never lands: callback at the deadline, no layout (unit test).
```

Uncertain about propagation: the deadline value trades a late layout for no layout on a slow open; set from the
measured settle times and listed among the decisions awaiting Alfonso.
