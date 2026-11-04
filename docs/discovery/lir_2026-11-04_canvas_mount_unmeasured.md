# Layer Impact Report: skip React Flow's forced first mount of never-measured nodes (P-2026-11-04-0901)

**Prompt-ID**: P-2026-11-04-0901. **Chat**: C-2026-11-03-2317. **Tree**: `~/jjodel-w-canvasmount`, branch
`canvas-mount-unmeasured`, HEAD `9a8c9ecbd` at the start.
**Evidence base**: `discovery_2026-11-04_jjtl_canvas_render.md` (route A, F2, F7, F8, §4), the throwaway
`~/.jjodel-lanes/P-2026-11-04-0256/probe/patchA-skip-forced-render.diff`, and a read of `@xyflow/system` 0.0.76 and
`@xyflow/react` 12.10.2 in `frontend/node_modules` on this tree.

Written before any edit. No file of `CLAUDE.md` §3.1 is touched: not `useJjomSync.ts`, not `portDistribution.ts`
(its `MAX_HANDLES_PER_SIDE` constant is imported, as `DynamicHandles.tsx` does). `DynamicHandles.tsx` and
`handlePosition.ts` are read, not changed. No D-layer write, no TRANSACTION.

## The mechanism, read on this tree

- `getNodesInside` (`@xyflow/system/dist/esm/index.js:373-374`) renders every node whose internal `handleBounds` is
  unset, visible or not. `adoptUserNodes` sets it from the user node: `parseHandles` (`:1570-1573`) builds it from a
  `handles` array when there is one, and otherwise leaves it unset until the node has been measured.
- `adoptUserNodes` (`:1637-1641`) clears `nodesInitialized` for any non-hidden node with no `measured` size, and
  every `fitView()` waits on `nodesInitialized` (`@xyflow/react/dist/esm/index.js:3277`).
- With `handleBounds` set, the node's inline size is `node.width ?? node.style.width` only
  (`@xyflow/react/dist/esm/index.js:1918-1929`): `measured` and `handles` never reach the DOM.
- A node that mounts is observed by the ResizeObserver, whose first callback forces `updateNodeInternals`
  (`:2027-2037`, `force: true`): real size and real handle bounds replace whatever the user node carried. A
  `dimensions` change is emitted only when the measured size differs from the internal one (`:1825`, `:1856`).
- Measured size is `offsetWidth` / `offsetHeight` (`@xyflow/system:840-843`), an integer.

## What changes

| Item | Where | Change |
|---|---|---|
| 1 | new `frontend/src/components/editor-v2/unmeasuredNodes.ts` | Pure helpers. `synthesizeHandles`: the 32 handle bounds `DynamicHandles` renders (4 per side, a target and a source each), placed by the same `computeSideEndpoints` / `computeSidePositions` on an estimated box, 8 x 8 px, centred on the side as React Flow's handle CSS centres them. `decorateUnmeasured`: a node with no `measured`, no `handles` and not hidden goes in as a copy with those handles and an estimated `measured`; cached per node on its own edges' topology key, as `DynamicHandles` keys its recompute. `undecorate`: back to the canvas node. `allMeasured` |
| 2 | its test, `frontend/src/components/editor-v2/__tests__/unmeasuredNodes.test.ts` | Written first |
| 3 | `EditorV2.tsx`, the `nodes=` prop | `rfNodes` = the canvas nodes, decorated only when `onlyRenderVisible` holds (the same gate as `onlyRenderVisibleElements`, so graphVertex and content-sized views keep their mount) and the canvas has more than `MOUNT_ALL_MAX_NODES` nodes |
| 4 | `EditorV2.tsx`, `getNodes` and `handleCanvasNodesChange` | Every node read through `getNodes()` is undecorated; a `replace` or `add` change React Flow builds from a decorated node is undecorated before it reaches the canvas state. The estimate never enters the canvas state |
| 5 | `EditorV2.tsx`, the first-measurement filter in `handleNodesChange` | The first measurement of a node that went in decorated schedules one port distribution over the edges, coalesced on a frame |
| 6 | `EditorV2.tsx`, `handleAutoLayout` | When a decorated node exists, the decoration is suspended, every node is mounted and measured as today, then the layout runs |

The estimate is 180.5 x 80.5. 180 x 80 is the fallback `DynamicHandles`, `getNodeRect` and `buildNodePositions`
already use for a node with no size; the half pixel keeps it from ever equalling an integer `offsetWidth`, so the
first real measurement always emits the `dimensions` change that tells the canvas state the node is measured. An
estimate equal to the real size would emit none, and the node would stay decorated.

## Port distribution and ELK wait for the measurement

- **Never the estimate.** `applyDistribution`, `handleAutoLayout`, the drag and resize recalculations, history and
  clipboard read `getNodes()` (undecorated) or the canvas state, which never holds a decorated node (item 4).
  `recalculateAnchors` reads the canvas state `nodes`. An unmeasured node reads as unmeasured: no `measured`, the
  readers' own fallbacks, exactly as in the window between mount and measurement today.
- **Distribution re-runs on the measurement** (item 5). The distribution of the open runs before off-screen nodes are
  measured; each node's first measurement queues one more run, which reads its real size. A node remounted after a
  cull is not a first measurement and queues nothing.
- **ELK runs on measured nodes only** (item 6): before the layout, the decoration is off, React Flow mounts and
  measures every node as today, and the layout starts when all are measured. The cost of the forced mount comes back
  for the auto-layout only, which the 117 s ELK ticket already dwarfs.
- **Readers outside the gate.** Readers of React Flow's own store see the decorated node: `DynamicHandles` (the
  opposite node's centre, for the order of a side), `useAutoAnchor` (on connect, between two nodes on screen, so
  measured), `useAlignment` (guides while dragging), `useTreeLayout` and `UnifiedEdge` (drawing), the ticket #419
  viewport fallback. None of them is port distribution or ELK. Each reads 180.5 x 80.5 where the fallback would read
  180 x 80; today they read the real size, because today the node has been force-mounted.

## LAYER IMPACT REPORT

```
Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

**Canvas v2-flow.**
- What changes: the node array handed to `<ReactFlow nodes>` on a large canvas that renders only visible elements;
  `getNodes()` returns undecorated nodes; one extra distribution per first measurement; the auto-layout waits for a
  full measurement.
- What does NOT change: the canvas state (`useNodesState`), the nodes `useJjomSync` builds, `onlyRenderVisible`,
  `DynamicHandles`, the handle pool, edge handle ids, `portDistribution.ts`, `CanvasExportService`.
- Cross-layer interaction: none. Nothing is written to the store; layout persistence reads positions, not `measured`.
- Side-effect safety: a decorated node carries `measured` and `handles` only on React Flow's side of the prop.

**Sync layer.** Not touched. `useJjomSync` keeps building and setting the canvas nodes; it never sees a decorated
node (it writes through the canvas state's `setNodes`).

## Behaviour that must not change, and how each is held

| Behaviour | Held by | Checked by |
|---|---|---|
| Small models | Not decorated at or under `MOUNT_ALL_MAX_NODES`: the `nodes=` prop is the canvas array itself, as today | test (gate), probe crop of a small model before and after |
| Selection | Click selects a mounted node; select-all and box selection read React Flow's node list and boxes, the box of an unmounted node being its estimate. The selection changes React Flow emits are id-based and applied to the canvas state | read; select-all is a `select` change per id |
| Fit to view | `nodesInitialized` holds with the estimate, so every `fitView()` resolves (the open fit, the toolbar, the auto-layout chain, the problems overlay). It frames estimated boxes for never-measured nodes | probe: the open fit finishes on b10_8 |
| Export | `CanvasExportService` reads the DOM (`CanvasExportService.ts:50`); after the first render the DOM holds the same mounted elements as today (the cull already removed the rest) | read |
| Pan into an off-screen node | The node becomes visible on its estimated box, mounts, is measured; real handle bounds replace the synthesized ones; an edge to it is drawn before and after | probe crop: b10_8 panned to an edge between an on-screen and an off-screen node |
| Edges touching a never-measured node | Drawn from the synthesized handles, ids `${side}-${index}` as the pool renders them | probe: count of React Flow `Couldn't create edge` warnings, 0 expected |

## Smoke-test scenarios potentially affected

- Open the JjTL output tab of b10_8 and b11_9: no mount-all and cull pair, the open fit completes, edges into the
  visible region drawn.
- Open a small model: identical to today (crop).
- Toolbar Auto layout on a large model: the nodes mount once, then the layout runs on measured sizes.
- Pan to a node never seen: it appears with its edges; its side order may settle once measured.

## Residual risks

- A node whose real box differs from 180 x 80 is fitted and culled on the estimate until it is measured.
- A non-rectangular IR shape or a turned bar pulls a mounted node's handles in to its outline; the synthesized
  handles sit on the box. The difference lies at an off-screen end until the node mounts.
- The extra distribution runs once per newly measured batch while panning on a large canvas; its cost is measured
  in the probe and reported.

## Amendment, P-2026-11-04-0925 (implementation)

- **Measured once is never decorated.** `useJjomSync.ts` drops `measured` from a node whose size changes, so that React
  Flow resets its handle bounds and measures it again. Item 1's gate (no `measured`, no `handles`) would have
  decorated such a node with the estimate, and a mounted node whose DOM size did not change would have kept it.
  `decorateUnmeasured` takes the ids React Flow has measured at least once (every `dimensions` change seen by
  `handleNodesChange`, both of its paths) and leaves them alone. Tested.
- **Item 6 is capped**: the auto-layout waits at most 5 s (`AUTO_LAYOUT_MEASURE_WAIT_MS`) for the measurement.
- **Pan into an off-screen node, measured**: not reproducible on b10_8. At the end of the run the out1 `nodes=` prop
  holds 1 node and 2,558 edges on both trees (the nested objects are canvas nodes only while the model is populated),
  so there is no off-screen node to pan to. Held by the unit test (an edge into a decorated node has a position) and
  by 0 `Couldn't create edge` warnings in every run.
- Figures and crops: `~/.jjodel-lanes/P-2026-11-04-0925/probe/out/`.
