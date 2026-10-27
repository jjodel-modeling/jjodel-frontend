# Discovery: why ELK auto-layout falls short of commercial-grade diagrams, measured per notation

- Prompt-ID: `P-2026-10-01-2215`, prompt `docs/prompts/claude_2026-10-01_2215_prompt_elk_layout_discovery.md`, chat `C-2026-10-01-2215`.
- Session `7f1e822b-b035-4a39-be69-95dc49f62177`; tree `~/jjodel-w-elklayout`, branch `elk-layout-disc`, HEAD `bc29ef585` (from the trunk at `ac3890b7e`).
- Executor: Anthropic Claude Opus 5.5 (session banner). Phase 1 only, read-only on `frontend/src` (no file under it was touched).
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.
- Tags: **[M]** measured in this phase, on `bc29ef585`; **[R]** read in a file at that HEAD.

## 0. Answer in brief

1. **ELK is badly used, not inadequate.** On the same seven real graphs, ELK's own output (node-side elkjs 0.11.1) reaches 0 node overlaps, 0 edge-node intersections, 0 label collisions and 0 crossings in 7/7 scenes (ER with stress + overlap removal), while today's canvas has label collisions in 2/7, crossings in 2/7, mean bends up to 3.6 per edge, and needs a 16:10 viewport 1.8x to 9x larger to show the drawing [M, §5].
2. **The decisive defect is point 1: ELK's routes are discarded.** Fixing ELK's input alone (real sizes V1, labels V2) while keeping our router does not help and sometimes hurts: label-edge collisions on Activity (UML) go 2 → 7 → 5, on Statechart 0 → 4 → 3. The same input with ELK's own geometry (V3) gives 0 label collisions in 6/7 scenes and removes every crossing outside ER [M].
3. **The per-notation profile (V4) is the second lever**: direction, FIRST/LAST layer constraints, outside node labels passed across the flow. It shrinks the zoom-to-fit box to 11-56% of today's (Petri 0.11, Statechart 0.18, Flowchart 0.27, ER 0.28, Activity 0.44, class 0.46 and 0.56) [M].
4. **Fixed-side ports (V5) never helped**: no hard metric moved, the fit box grew or stayed in 7/7 scenes, bends rose in three (Statechart 1.2 → 3.2). Point 4's contradiction is real (ELK's sides agree with ours on 2/9 Activity edges, 3/13 ER edges), but the cure is to take the sides from ELK's sections, not to add ports [M].
5. **New finding**: object-as-edge vertices (ControlFlow, Arc, Transition) are `hidden` React Flow nodes and still go to ELK as 180x120 boxes: 9, 9, 6 and 5 phantom nodes in the four M1 behavioural scenes (`irEdgeViews.ts:289`, `elkLayout.ts:67`) [M, R].
6. **Point 7**: `considerModelOrder: NODES_AND_EDGES` never changed a crossing count (7/7 scenes); `NONE` cut the drawing area by 42% (Flowchart) and 38% (Activity) [M]. The canvas snap grid is 16 px, not 8; every node of every variant is off the 8 px grid [M, R]. The bundled ELK runs on the main thread, but a warm layout costs 5-28 ms in node and the cold first call 108-151 ms [M].
7. Derive viewpoint and Jjodie call no layout; ELK runs only from the toolbar and from the first sync that created vertices (`EditorV2.tsx:510-517`). Waypoints are segment offsets, not points: ELK bend points cannot map onto `data.waypoints` [R].

**Recommendation.** One lane after the 2026-10-04 demo: `elkLayout.ts` returns positions **and** routes (real sizes from the size contract, hidden nodes out, labels in, per-notation profile, model order off), and `UnifiedEdge.tsx` draws an ELK route when one is present and still valid. Ports/handles alignment (`portDistribution.ts`, `handlePosition.ts`) is a second, critical-zone lane.

**Decisions awaiting Alfonso (RC-26):**
- D-A. Any of these fixes changes what the MODELS demo shows (auto-layout of the four demo scenes): nothing lands before the 2026-10-04 demo.
- D-B. Aligning React Flow handles with ELK's port positions is a critical-zone edit (`portDistribution.ts`, `handlePosition.ts`): Layer Impact Report and go-ahead.
- D-C. Fork/join bars of Activity (UML) are upright 5x120 by R-VP-26 (2); under a vertical flow they should follow the direction: an amendment of a ratified row.

**Questions** (§10): Q1 order and scope of the lanes, Q2 where the profile lives, Q3 route persistence, Q4 grid, Q5 ports, Q6 ER algorithm, Q7 bar orientation. Each carries one `Recommended:` line.

---

## 1. Hypotheses under test, with verdict

| # | Hypothesis (from the prompt) | Verdict | Evidence |
|---|---|---|---|
| 1 | Routes discarded; our router ignores other nodes | **Holds** for routes; **partly** for "ignores nodes" | §4.1 |
| 2 | Fixed 180x120 size; gaps for small nodes; big nodes can overlap | **Holds** for size and gaps; overlap **not observed** (no node above the threshold) | §4.2 |
| 3 | Labels not passed; candidate cause of the guard-label ticket | **Holds**, but passing labels alone does not fix the ticket | §4.3 |
| 4 | No ports; ELK's layer order and our side choice contradict | **Holds** (measured disagreement); fixed ports are **not** the cure | §4.4 |
| 5 | No hierarchy | **Holds** [R]; not measured (no nested scene) | §4.5 |
| 6 | Metamodel-only strategy, DOWN everywhere | **Holds** | §4.6 |
| 7 | No 8 px snap; main thread; model order may constrain crossings | Snap **holds** (grid is 16); worker **holds** but cheap; model order **falsified** on crossings, **holds** on area | §4.7 |
| new | Hidden object-as-edge vertices reach ELK | **Holds** | §4.2 |

## 2. Objective

Measure, per notation, why the toolbar auto-layout does not produce commercial-grade drawings, separate the contribution of each suspected cause by cumulative variants V0..V5 run on real extracted graphs, and give each correction its perimeter, risk and landing estimate.

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-elklayout/CLAUDE.md` (§3.1, §5, §6), `/Users/alfonso/jjodel-w-elklayout/frontend/src/components/editor-v2/CLAUDE.md`, `/Users/alfonso/jjodel-w-elklayout/docs/PROTOCOL.md` (P4, P16), `/Users/alfonso/jjodel-w-elklayout/docs/decisions.md` (RC-20..RC-34, R-VP-24..26), `/Users/alfonso/jjodel-w-elklayout/docs/log-inbox/views.md` (ticket of 2026-09-30), `/Users/alfonso/jjodel-w-elklayout/docs/spec/spec_attive.md:65` (size contract D8..D13).
- `/Users/alfonso/jjodel-w-elklayout/frontend/src/components/editor-v2/utils/elkLayout.ts` (whole), `.../editor-v2/EditorV2.tsx` (`handleAutoLayout` 3630-3685, onInit 505-520, IR edge layout 200-214 and 1548-1592, ReactFlow props 4215-4235, snap 682), `.../editor-v2/Toolbar.tsx:1003-1012`.
- `.../editor-v2/utils/portDistribution.ts` (520 and the role-keyed buckets), `.../editor-v2/utils/handlePosition.ts` (1-40, 132-200), `.../editor-v2/hooks/useAutoAnchor.ts:530-560`, `.../editor-v2/edges/UnifiedEdge.tsx` (119-122, 284-296, 345-360, 1015-1040, 1100-1182), `.../editor-v2/utils/edgeUtils.ts` (136-150, 2120-2125, 2368-2380), `.../editor-v2/types.ts:158-165`, `.../editor-v2/EditorV2.scss:2898-2919`.
- `.../editor-v2/viewpoint/derive/viewpointDerivation.ts` (765-782, 868-877), `.../viewpoint/ir/irContainment.ts:273-281` (grep window), `.../viewpoint/derive/notations.ts` (1-130), `.../viewpoint/derive/erSignals.ts` (1-60), `.../viewpoint/derive/__tests__/erChen.test.ts` (fixtures), `.../viewpoint/ir/notationCatalog.ts` (by a subagent: 33-135), `.../viewpoint/ir/irJunctions.ts` (by a subagent: 8-43), `.../viewpoint/ir/irEdgeViews.ts:270-300`, `.../viewpoint/layout/vertexLayout.ts:66-71`, `.../viewpoint/layout/vertexLayoutAdapter.ts:53-55`, `.../editor-v2/utils/jjomTransformers.ts:55-60`, `.../editor-v2/hooks/useJjomSync.ts` (80-84, 688-722), `.../editor-v2/sync/canvasToJjom.ts:98-108`, `/Users/alfonso/jjodel-w-elklayout/frontend/src/utils/deriveViewpoint.ts:43-84`.
- `/Users/alfonso/jjodel-w-elklayout/frontend/node_modules/elkjs/` (0.11.1): `package.json`, `README.md` (worker section 140-220), `lib/elk-api.js:24-80`, and the option reference the bundle ships, dumped with `knownLayoutOptions()` (234 options, 11 algorithms). Every option id cited here was confirmed in that dump (38 ids checked, 0 missing).

Two Explore subagents read the waypoint/router code and the derive/Jjodie/size paths. Lines they reported are re-read here, except those marked «by a subagent» or «per the subagent» (`notationCatalog.ts`, `irJunctions.ts`, the `UnifiedEdge.tsx` pipeline 297-386).

## 4. Findings

### 4.1 Point 1: routes discarded

- [R] `elkLayout.ts:143-155`: `const layout = await elk.layout(elkGraph);` then only `for (const child of layout.children ?? [])` into `posMap`. The edges of the result are never read.
- [M] ELK computed sections for every edge it was given: 9/9, 9/9, 6/6, 5/5, 13/13, 8/8, 6/6 in the seven scenes (`sectionsDiscarded` control).
- [R] `EditorV2.tsx:3658` recomputes sides with `computeGeometricAnchorsForAllEdges(recalcable, layoutRects)`, `:3677` clears waypoints on a side flip, `:3681` `return applyDistribution(recomputed);`.
- [R] The router does consider nodes, up to a limit: `UnifiedEdge.tsx:353-357` passes every visible node rect to `avoidNodeRects`, which gives up at `rects.length > AVOID_MAX_RECTS` with `const AVOID_MAX_RECTS = 10;` (`edgeUtils.ts:2123`, `:2371`). It never considers labels. So "ignores other nodes" holds only above 10 visible nodes.
- [M] Edge-node intersections on the canvas (V0) were 0 in 7/7 scenes (all at or below 13 nodes; ER, the only one above 10, draws straight lines that happened to clear). The canvas defects are elsewhere: label collisions, crossings, bends, area.
- [M] V2 → V3 changes only where the edge geometry comes from (same ELK input). Label-edge collisions: Flowchart 3 → 0, Activity 5 → 0, Statechart 3 → 0, class DemoFlowB 2 → 0, class DemoERD 3 → 0, Petri 4 → 4 (the four are place/transition names painted outside the node box, which ELK was not told about until V4). Crossings: Flowchart 1 → 0, Activity 1 → 0. Statechart bends 2.8 → 0.8 per edge.

### 4.2 Point 2: fixed node size, and the hidden nodes

- [R] `elkLayout.ts:64-71`: `const NODE_W = 180; const NODE_H = 120;` for every child. The comment `:59-63` gives the reason: «This produces evenly-spaced layouts identical to the Jjodie path (where nodes aren't measured yet).» The first-mount layout runs from onInit (`EditorV2.tsx:510-517`) before React Flow has measured the nodes, so a fix must take sizes from the declared size (IR `defaultSize`, the size contract of `shapeRegistry.ts` / `useContentSize.ts`, `spec_attive.md:65`), not only from the DOM.
- [M] Sent sizes in V0: `180x120` only. Real rendered sizes: `20x20 142x44 36x36 5x120 24x24` (Activity), `44x44 10x44` (Petri), `66x66 200x42 50x14` (Flowchart), `200x42` (Statechart), nine sizes from `54x66` to `200x42` (ER), `140x42 169x80` and `140x60 140x42 140x80` (class).
- [R, arithmetic] With `spacing.nodeNode` 100 and `nodeNodeBetweenLayers` 120 (`elkLayout.ts:124-126`), DOWN siblings sit on a 280 px pitch and layers on a 240 px pitch, top-left anchored. A real node overlaps a neighbour only when wider than 280 or taller than 240. No node in the seven scenes is: node-node overlaps were 0 everywhere [M]. A class with many features can exceed 240 px; not measured here.
- [M] The gap side is measured: a 44 px place in a 280 px pitch; zoom-to-fit boxes 1.8x to 9x larger than the best variant's (§0 item 3).
- **New** [R] `irEdgeViews.ts:289`: `const outNodes = nodes.map(n => (edgeObjectVertices.has(n.id) && !n.hidden ? { ...n, hidden: true } : n));`. `computeElkLayout` filters nothing (`elkLayout.ts:67`). [M] Phantom 180x120 children sent to ELK: 9 (Flowchart), 9 (Activity), 6 (Petri), 5 (Statechart), 0 (ER, class). They are disconnected, so ELK packs them as separate components: the visible layout was unchanged in four scenes and changed in Statechart (V1 640x568 vs V1h 430x432). `irContainment.ts:273-281` hides contained children the same way [R]; not measured.

### 4.3 Point 3: edge labels

- [R] `elkLayout.ts:93-117`: an ELK edge is `{ id, sources, targets, layoutOptions }`; no `labels`. A search for `labels|ports` in `elkLayout.ts` returns nothing, while the same command on the same file matches `NODE_W`, `considerModelOrder` and nine other patterns (positive control, §9).
- [M] The ticket of 2026-09-30 (`docs/log-inbox/views.md:805`, «DemoFlowB's two guard labels overlap in Activity (UML)», 796 px² on the demo layout): after the toolbar auto-layout the two guards overlap 70 px² and cross two foreign edges (V0). With real sizes (V1) they overlap 362 px² and cross 7 edges; with labels passed (V2) 0 px² but still 5 edge crossings; with ELK geometry (V3, V4, V5) 0 and 0.
- So labels unknown to the layout are one cause; the other is that the label position is our router's: `UnifiedEdge.tsx:518` «Small perpendicular nudge off the line. No cross-edge de-overlap here (see 2c).» Both have to change.

### 4.4 Point 4: ports and side choice

- [R] No `ports`, no `portConstraints` in `elkLayout.ts`. Sides are chosen after the layout, by geometry only (`useAutoAnchor.ts:534-560`), and handle positions are a uniform distribution per side (`handlePosition.ts:183`), with at most `MAX_HANDLES_PER_SIDE = 4` (`portDistribution.ts:520`).
- [M] Side agreement between ELK's own sections (V0 input) and the canvas anchors, per edge: Flowchart 7/9, Activity 2/9, ER 3/13, class DemoERD 3/4, Petri 6/6, Statechart 3/3, class DemoFlowB 3/3. Example: Activity `i0->work` ELK S/N, canvas S/W.
- [M] V5 (V4 plus one port per edge end, `elk.portConstraints: FIXED_SIDE`, `elk.port.side` out-side/in-side by direction): no hard metric moved (all already 0 at V4, ER's 2 crossings unchanged), the 16:10 fit box grew or stayed in 7/7 scenes (x1.00 to x1.40), and bends rose in three (Statechart 1.2 → 3.2, Flowchart 1.89 → 2, Activity 1.56 → 1.89). ELK with free ports and its sections as the geometry is better than fixed sides.

### 4.5 Point 5: hierarchy

- [R] `elkLayout.ts:67-71` builds a flat `children` list; no nested `children`, no `elk.hierarchyHandling`. Not measured: none of the seven scenes has a graphVertex nesting. For containment the IR hides children (`irContainment.ts:281`), which then reach ELK as hidden 180x120 boxes (§4.2).

### 4.6 Point 6: metamodel-only strategy

- [R] `elkLayout.ts:88` `const refPriority = hasInheritance ? '0' : '3';`, `:101` inheritance reversed, `:121` `'elk.direction': direction` with default `'DOWN'` (`:58`).
- [M] Captured input: every edge of the five M1 scenes carries `elk.layered.priority.direction: 3`, direction DOWN; the class scenes carry 10 and 0. No layer constraint anywhere.
- [M] V4 (per-notation profile, §7) against V3 (same input, today's options, ELK geometry), ratio of the 16:10 fit boxes: Petri 0.11 (LR instead of DOWN), Statechart 0.23, Flowchart 0.37, Activity 0.45, class DemoERD 0.43, class DemoFlowB 0.60, ER 0.80 with the layered profile and 0.62 with stress + overlap removal. Hard metrics were already 0 at V3 except ER's 2 crossings, which only the stress variant removes.

### 4.7 Point 7: grid, worker, model order

- Grid [R]: `EditorV2.tsx:4224-4225` `snapToGrid={snapEnabled}` `snapGrid={[16, 16]}`; `snapEnabled` defaults to true (`:682`); `handleAutoLayout` writes the raw ELK coordinates (`:3638-3643`). [M] Nodes off the 8 px grid: all of them in V0 (the padding is 50), and between 4/6 and 13/13 in every ELK variant; none of the 234 option ids ELK ships contains `grid`. A snap is a post-pass; with ELK routes it must also move the first and last section points.
- Worker [R]: `elkLayout.ts:20` `import ELK from 'elkjs/lib/elk.bundled.js';` `:24` `const elk = new ELK();` (the README's «without web worker» form). [M] In-app wall time of the awaited call: 182-488 ms (main thread busy with React between the bundled worker's turns). Node, ER V0 input, three runs: cold first call 108, 114, 151 ms; warm 13-28 ms. Node medians of five warm runs per variant: 4-20 ms for layered, 43-77 ms for stress, 110-120 ms for stress + spore. A worker is not needed at these sizes; the cold first call is the only visible cost.
- Model order [R]: the shipped description of `org.eclipse.elk.layered.considerModelOrder.strategy`: «Preserves the order of nodes and edges in the model file if this does not lead to additional edge crossings.» [M] On the V2 input of each scene: crossings identical with `NODES_AND_EDGES`, `NONE` and `PREFER_EDGES` in 7/7 scenes; area with `NONE`: Flowchart 745 560 → 436 000 px² (-42%), Activity 715 288 → 443 440 (-38%), ER -2%, class DemoERD +2%, others equal.

### 4.8 The three questions

- **Does Derive viewpoint or Jjodie call a layout?** No [R]. `deriveViewpoint.ts:61-83` creates a `DViewPoint` and its `DViewElement`s and opens the viewpoint; no vertex, no position. Search `computeElkLayout|autoLayout|elkjs|dagre` over `viewpoint/derive`, `utils/deriveViewpoint.ts`, `sim/DeriveViewpointDialog.tsx`: exit 1, empty; control `createDerivedViewpoint` in `deriveViewpoint.ts`: 1 hit. Same search over `components/Jodie` and `jjscript`: exit 1; control `computeDefaultPosition`: `JodieWindow.tsx`. The only importer of `elkjs` in `src` is `elkLayout.ts` (the megamodel view uses dagre, `megamodel/megamodelLayout.ts:12`). ELK runs from the toolbar (`Toolbar.tsx:1006`, `EditorV2.tsx:4347`) and from onInit when `justCreatedGraphRef` is set (`EditorV2.tsx:510-517`), which `useJjomSync.ts:692` sets whenever the populate effect creates a graph, classifiers, objects or edges; a re-run follows once late M1 edges arrive (`EditorV2.tsx:3688-3727`).
- **Where do M1 positions come from under a derived viewpoint?** [R] One v2-flow graph per model; positions per viewpoint in `DVertex.layoutByViewpoint`, keyed by the active exclusive viewpoint (derived viewpoints are exclusive, `deriveViewpoint.ts:63`). `readVertexLayout` (`vertexLayout.ts:66-71`): `return record ? { ...record } : seed;`, the seed being the vertex's own x/y/w/h. A vertex created by the populate effect gets the grid `x = 50 + col * COL_W; y = 50 + row * ROW_H` with `new GraphSize(x, y, 200, 120)` (`useJjomSync.ts:718-722`, `DEFAULT_LAYOUT` 3 x 420 x 300 at `:80-84`). Auto-layout writes to the active key (`canvasToJjom.ts:103`, `getActiveLayoutKey()`).
- **Waypoints today?** [R] `types.ts:162-165`: `segmentIndex: number; // which segment of the path` and `offset: number; // offset in pixels from auto-calculated position`: a perpendicular offset of one segment of the routed path, not a point. Classic edges keep them in React Flow state only (not persisted); object-as-edge edges persist `irEdgeLayout` on the hidden vertex (`EditorV2.tsx:1551-1560`, rehydrated `:1567-1589`, gated by `persistWaypoints`, `:203-214`). The router pipeline is `computeManhattanPath` (`edgeUtils.ts:136`) → bundle spread → `avoidNodeRects` → lane shifts → waypoints → rounded corners (`UnifiedEdge.tsx`, per the subagent 297-386); IR `straight`/`curved` edges use `getStraightPath`/`getBezierPath` (`:286-295`). **ELK bend points cannot be expressed as these offsets in general** (ELK may add or drop segments); they need a field of their own (§6, F2).

## 5. Measurement method and metrics

**Scenes** [M], built by the demo builder (`_tmp_elk_scenario.js`, a read-only copy of `~/jjodel-w-updatedepth/.../_tmp_c1_scenario.js`, unchanged) plus an ER builder after ERDLanguage's ERD (`_tmp_elk_er.js`): DemoFlowB under Flowchart and Activity (UML), DemoPetri under Petri net (classic), DemoPEST under Statechart (UML), DemoERD under ER (Chen) (3 entities, 7 attributes, 3 relationships with per-end cardinalities), and the class view of the DemoFlowB and DemoERD metamodels. Derived viewpoints were created by `createDerivedViewpoint` with the dialog's prefill (binding for the three profiled ones, signals for ER).

**Extraction** [M]: `lane-run probe ~/jjodel-w-elklayout scripts/smoke/_tmp_elk_probe.ts --port 3216 --id P-2026-10-01-2215`, headless Chromium, light theme, 1600x1000, isolated profile seeded by `states.ts`; log `~/.jjodel-lanes/P-2026-10-01-2215/probe-_tmp_elk_probe.log`, **87/87, EXIT=0, no page error**. For each scene the toolbar «Auto layout» was clicked four times; before each click the probe wrapped `layout` on the prototype of the very ELK module instance `elkLayout.ts` imports (its URL read from the transformed `elkLayout.ts`), in the probe's browser only:

- `pass`: unchanged call (V0); `V1`: children resized to the DOM node box, hidden nodes kept at 180x120; `V1h`: V1 with hidden nodes removed; `V2`: V1h plus each edge's visible labels with their measured size.
- Controls per click: exactly one ELK call through the wrapper with the expected mode; canvas node positions equal ELK's output (max deviation 0 px in 28/28); client-to-flow calibration spread below 1 px (28/28). Node-side elkjs reproduces the in-app V0 call exactly (max deviation 0 px, 7/7).
- Measured from the DOM in flow coordinates: node boxes (`offsetWidth/Height`, translate), edge polylines (`getPointAtLength` every 3 px on `path.reference-edge, path.inheritance-edge`), source and target from xyflow's `aria-label` «Edge from X to Y», visible labels (`.edge-label__text`, `.edge-cardinality`, `.edge-end-label`, `checkVisibility` with opacity) and node text painted outside the node box. Labels carry no `data-id`; each is assigned to its nearest edge.

**Variants V3..V5** [M] ran in node (`_tmp_elk_variants.mjs`) on the captured V2 input: V3 = same input and options, ELK sections and label positions used as geometry; V4 = V3 plus the per-notation profile and outside node labels passed as ELK node labels placed across the flow; V5 = V4 plus fixed-side ports. Alternatives measured beside V4/V5: NETWORK_SIMPLEX (`ns`), model order off (`nmo`), both, and per notation (Petri ORTHOGONAL / DOWN / labels as measured, Statechart DOWN, ER stress, ER DOWN, ER stress + `sporeOverlap` with straight lines, Flowchart RIGHT, class `mergeEdges`).

**Metrics**, identical code for canvas and ELK drawings: node-node overlaps (boxes shrunk 0.5 px); edge-node intersections (non-incident nodes, shrunk 2 px); crossings (proper intersections, 8 px around endpoints excluded); edge-edge overlap (pairs sharing more than 12 px within 1.5 px); label-label, label-node, label-edge (foreign edges; for node labels any edge); nodes off the 8 px grid; bends (RDP 1.5 px, vertices within 10 px merged, turns above 10°); bounding box with labels; layout time (in-app: wall time of the awaited call; node: median of five warm runs, machine under load, indicative only).

**Best variant**: lexicographic on node-node, edge-node, label collisions, crossings, edge-edge overlap, bends in half-bend buckets, then the 16:10 box needed to show the drawing (zoom-to-fit). Without the last two refinements a 0.22-aspect Petri strip ranked first.

### 5.1 Metrics table (scene x variant)

V0..V2: canvas, our router. V3..V5 and best: ELK geometry, node elkjs.

| scene | variant | node-node | edge-node | crossings | edge-edge overlap | label-label | label-node | label-edge | off 8px grid | bends mean / max | W×H px | aspect | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| flowB_flowchart | V0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 8/8 | 1.78 / 2 | 775×1026 | 0.76 | 367.5 |
| flowB_flowchart | V1 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 8/8 | 1.78 / 4 | 717×710 | 1.01 | 283 |
| flowB_flowchart | V1h | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 8/8 | 1.78 / 4 | 717×710 | 1.01 | 267 |
| flowB_flowchart | V2 | 0 | 0 | 1 | 0 | 1 | 0 | 3 | 7/8 | 0.89 / 2 | 855×872 | 0.98 | 366.7 |
| flowB_flowchart | V3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/8 | 0.89 / 2 | 855×872 | 0.98 | 17.15 |
| flowB_flowchart | V4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/8 | 1.89 / 4 | 605×532 | 1.14 | 11.73 |
| flowB_flowchart | V5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 2 / 4 | 537×556 | 0.97 | 19.02 |
| flowB_flowchart | **best: V4-ns** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/8 | 1.11 / 2 | 701×532 | 1.32 | 9.71 |
| flowB_activityUml | V0 | 0 | 0 | 1 | 0 | 1 | 0 | 2 | 8/8 | 2.11 / 3 | 717×984 | 0.73 | 282.1 |
| flowB_activityUml | V1 | 0 | 0 | 1 | 0 | 1 | 0 | 7 | 8/8 | 1.22 / 2 | 557×824 | 0.68 | 412.3 |
| flowB_activityUml | V1h | 0 | 0 | 1 | 0 | 1 | 0 | 7 | 8/8 | 1.22 / 2 | 557×824 | 0.68 | 298.1 |
| flowB_activityUml | V2 | 0 | 0 | 1 | 1 | 0 | 0 | 5 | 8/8 | 1.56 / 4 | 742×964 | 0.77 | 405.4 |
| flowB_activityUml | V3 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 8/8 | 1.11 / 2 | 742×964 | 0.77 | 10.83 |
| flowB_activityUml | V4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.56 / 2 | 569×649 | 0.88 | 10.58 |
| flowB_activityUml | V5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.89 / 4 | 449×674 | 0.67 | 14.6 |
| flowB_activityUml | **best: V4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.56 / 2 | 569×649 | 0.88 | 10.58 |
| petri_petriClassic | V0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 7/7 | 0 / 0 | 354×1027 | 0.34 | 488 |
| petri_petriClassic | V1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 7/7 | 0 / 0 | 188×723 | 0.26 | 468.6 |
| petri_petriClassic | V1h | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 7/7 | 0 / 0 | 188×723 | 0.26 | 435 |
| petri_petriClassic | V2 | 0 | 0 | 1 | 0 | 0 | 0 | 4 | 7/7 | 0 / 0 | 175×1022 | 0.17 | 438.9 |
| petri_petriClassic | V3 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 7/7 | 0.33 / 2 | 175×1022 | 0.17 | 5.99 |
| petri_petriClassic | V4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/7 | 0 / 0 | 552×179 | 3.08 | 6.93 |
| petri_petriClassic | V5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/7 | 0 / 0 | 559×180 | 3.11 | 6.76 |
| petri_petriClassic | **best: V4-ns** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/7 | 0 / 0 | 547×179 | 3.06 | 6.98 |
| pest_statechart | V0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/6 | 3.6 / 7 | 600×802 | 0.75 | 269.6 |
| pest_statechart | V1 | 0 | 0 | 0 | 0 | 1 | 0 | 4 | 6/6 | 4 / 7 | 640×568 | 1.13 | 266.5 |
| pest_statechart | V1h | 0 | 1 | 0 | 0 | 1 | 1 | 4 | 5/6 | 4 / 7 | 430×432 | 1 | 263.8 |
| pest_statechart | V2 | 0 | 1 | 0 | 0 | 0 | 1 | 3 | 6/6 | 2.8 / 7 | 640×704 | 0.91 | 354.8 |
| pest_statechart | V3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/6 | 0.8 / 2 | 640×700 | 0.91 | 11.83 |
| pest_statechart | V4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/6 | 1.2 / 2 | 541×278 | 1.95 | 9.44 |
| pest_statechart | V5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/6 | 3.2 / 4 | 640×276 | 2.32 | 8.27 |
| pest_statechart | **best: V4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/6 | 1.2 / 2 | 541×278 | 1.95 | 9.44 |
| er_erChen | V0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 13/13 | 0 / 0 | 1741×546 | 3.19 | 379 |
| er_erChen | V1 | 0 | 0 | 3 | 0 | 1 | 0 | 0 | 13/13 | 0 / 0 | 1020×414 | 2.46 | 351.7 |
| er_erChen | V1h | 0 | 0 | 3 | 0 | 1 | 0 | 0 | 13/13 | 0 / 0 | 1020×414 | 2.46 | 238.1 |
| er_erChen | V2 | 0 | 0 | 2 | 0 | 1 | 0 | 0 | 13/13 | 0 / 0 | 1011×735 | 1.38 | 253.5 |
| er_erChen | V3 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 13/13 | 1.69 / 2 | 1011×735 | 1.38 | 15.35 |
| er_erChen | V4 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 13/13 | 2.77 / 4 | 692×657 | 1.05 | 13.33 |
| er_erChen | V5 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 13/13 | 2.77 / 4 | 697×657 | 1.06 | 13.96 |
| er_erChen | **best: V5-stress-spore** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13/13 | 0 / 0 | 649×579 | 1.12 | 119.91 |
| class_DemoFlowB | V0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1 / 2 | 1540×522 | 2.95 | 262.2 |
| class_DemoFlowB | V1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8/8 | 0.67 / 2 | 1340×404 | 3.32 | 263.5 |
| class_DemoFlowB | V1h | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8/8 | 0.67 / 2 | 1340×404 | 3.32 | 328.9 |
| class_DemoFlowB | V2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 8/8 | 0.67 / 2 | 1340×552 | 2.43 | 327.9 |
| class_DemoFlowB | V3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.5 / 2 | 1340×552 | 2.43 | 6.15 |
| class_DemoFlowB | V4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.5 / 2 | 1040×384 | 2.71 | 5.71 |
| class_DemoFlowB | V5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.5 / 2 | 1040×388 | 2.68 | 7.84 |
| class_DemoFlowB | **best: V4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.5 / 2 | 1040×384 | 2.71 | 5.71 |
| class_DemoERD | V0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 1.5 / 2 | 276×800 | 0.35 | 211.2 |
| class_DemoERD | V1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 4/4 | 1.5 / 2 | 253×622 | 0.41 | 210.2 |
| class_DemoERD | V1h | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 4/4 | 1.5 / 2 | 253×622 | 0.41 | 213.8 |
| class_DemoERD | V2 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 4/4 | 1 / 2 | 244×916 | 0.27 | 210.4 |
| class_DemoERD | V3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 1.5 / 3 | 244×916 | 0.27 | 7.49 |
| class_DemoERD | V4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 2.5 / 4 | 217×604 | 0.36 | 6.5 |
| class_DemoERD | V5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 2.5 / 4 | 217×610 | 0.36 | 8.85 |
| class_DemoERD | **best: V4-ns** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 1.67 / 4 | 235×596 | 0.39 | 8.26 |

Limits of the measure: seven small graphs (4 to 13 nodes); the schematics draw node boxes, not shapes (a Chen diamond is its box); in the ER best variant end labels are placed at the line's midpoint by the script, not by our end-label placement; label-to-edge attribution on the canvas is by distance.

### 5.2 Crops

Under `frontend/scripts/smoke/_tmp_elk_crops/` (gitignored), each at 600 px:
- the real canvas after the toolbar layout: `<scene>_V0_canvas_600.png`, and `_V1_`, `_V1h_`, `_V2_` likewise;
- the same painter for both sides of the comparison: `<scene>_V0_schematic_600.png` and `<scene>_best_<variant>_schematic_600.png`.

Scenes: `flowB_flowchart` (best `V4-ns`), `flowB_activityUml` (`V4`), `petri_petriClassic` (`V4-ns`), `pest_statechart` (`V4`), `er_erChen` (`V5-stress-spore`), `class_DemoFlowB` (`V4`), `class_DemoERD` (`V4-ns`). Data: `_graphs.json`, `_metrics.json`, `_picks.json`, `_variants.out`.

## 6. Corrections: perimeter, Layer Impact, risk, landing estimate

The trunk freeze for the demo holds (RC-31) and every item below changes what the demo scenes show after an auto-layout (RC-26): none lands before 2026-10-04. Estimates are for the merge window 2026-10-05 to 2026-10-07.

| # | Correction | Perimeter | Critical zone | Risk | Before 2026-10-07 |
|---|---|---|---|---|---|
| F1 | ELK input: real sizes (declared size first, DOM when measured), hidden nodes out, visible labels in, model order off, per-notation options | `utils/elkLayout.ts`, a pure options module, `EditorV2.tsx` (`handleAutoLayout` passes notation and labels), tests | no | low; alone it worsens label collisions with our router (V1/V2 rows): never ship F1 without F2 | yes, with F2 |
| F2 | ELK routes as the edge geometry: `computeElkLayout` returns sections and label positions; `handleAutoLayout` stores them as an optional session field on the edge (e.g. `data.elkRoute`, points, not offsets) with sides read from the sections; `UnifiedEdge.tsx` draws it while both end nodes keep the positions it was computed for, else falls back to today's router | `elkLayout.ts`, `EditorV2.tsx`, `edges/UnifiedEdge.tsx`, `types.ts` (optional property), tests | no, if not persisted | medium: label position and handle dot must follow the route; drag invalidation | yes, one lane |
| F3 | Per-notation profile as data (§7) | `viewpoint/derive/notations.ts` (optional key), the profile module, `deriveViewpoint.ts` if stored in `_state` | no | low | yes, with F1 |
| F4 | Handles aligned with ELK's port positions (no uniform redistribution on ELK-routed edges) | `utils/portDistribution.ts`, `utils/handlePosition.ts`, `DynamicHandles.tsx` | **yes** | medium-high (§3.10 bucket invariants) | no |
| F5 | Route persistence per viewpoint | `sync/canvasToJjom.ts` (`layoutByViewpoint` record or a sibling field), `vertexLayout.ts`, rehydration in `EditorV2.tsx` | **yes** (`canvasToJjom.ts`) | medium (persisted shape, VersionFixer not needed if additive) | no |
| F6 | 8 px snap post-pass | `elkLayout.ts` (positions and section end points) | no | low | yes, with F2 |
| F7 | Worker | `elkLayout.ts` (`elk-api` + `workerUrl`) | no | low; gain measured as small | not needed |

**Prospective Layer Impact Report, F4** (written before any diff, as §3.2 asks; for the lane that will run it):

```
Layers touched:
  [ ] D-layer  [ ] L-layer  [ ] JjOM
  [x] Canvas v2-flow (handle positions of ELK-routed edges)
  [ ] Canvas classic  [ ] Sync layer  [ ] Persistence
What changes: for an edge carrying an ELK route, the handle's position on its side is the
  route's end point instead of the uniform slot of computeSidePositions.
What does NOT change: handle ids, role-keyed buckets (§3.10), MAX_HANDLES_PER_SIDE, edges
  without a route.
Cross-layer interaction: none outside the canvas; handleAutoLayout already recomputes sides.
Side-effect safety: two routes ending on the same side at distinct points must keep distinct
  handle ids; more than 4 ends on one side must not overflow (today's cap).
Smoke: import Families.ecore → 8 Family↔Member edges; the four demo scenes after auto-layout;
  drag a node → its routes fall back to the router, handles return to uniform slots.
```

**Prospective Layer Impact Report, F5**:

```
Layers touched:
  [x] D-layer (DVertex layoutByViewpoint record, or irEdgeLayout for object-as-edge)
  [ ] L-layer  [ ] JjOM
  [x] Canvas v2-flow (rehydration)  [ ] Canvas classic
  [x] Sync layer (canvasToJjom write path)  [x] Persistence (additive field)
What changes: an optional route per edge per viewpoint key, written in the same
  SetFieldAction as positions (no creator, so no TRANSACTION hazard, §3.3).
What does NOT change: positions, the read-through seed (vertexLayout.ts:66-71), classic edges'
  waypoint semantics.
Cross-layer interaction: classic M2/M1 edges have no persisted geometry today; the route needs a
  home keyed by edge id under the vertex or the graph.
Smoke: save → reopen → identical routes; switch viewpoint → the other key's routes; old
  projects open unchanged.
Uncertain: whether the record belongs to the source vertex or to the graph. → STOP and ask.
```

## 7. Draft of a per-notation layout profile (shape only, no code)

`notationCatalog.ts` is the symbol-preset picker (`SymbolPreset`, families Base/Process/Data/Flowchart/Goal) and has no notion of a derived notation; the notations live in `viewpoint/derive/notations.ts` (`DerivedNotation`, `:60-71`). The draft therefore adds one optional key there, copied into the derived viewpoint's `_state` as flat keys (R-VP-21 style) so a viewpoint keeps the profile it was derived with:

```
DerivedNotation.layout?: {
  algorithm?: 'layered' | 'stress';            // ER (Chen): 'stress', then overlap removal
  overlapRemoval?: boolean;                    // stress only: a sporeOverlap pass
  direction?: 'DOWN' | 'RIGHT';                // Flowchart, Activity, class: DOWN; Petri, Statechart: RIGHT
  edgeGeometry?: 'elk' | 'router';             // 'elk' by default once F2 lands
  edgeRouting?: 'ORTHOGONAL' | 'POLYLINE' | 'STRAIGHT';   // Petri classic: POLYLINE; ER: STRAIGHT
  nodePlacement?: 'NETWORK_SIMPLEX' | 'BRANDES_KOEPF';    // measured best: NS for Flowchart, Petri, ERD class
  layerConstraints?: { first?: NotationRoleId[]; last?: NotationRoleId[] };  // initial / terminal
  nodeLabelSide?: 'across-flow';               // outside names never on the flow side
  modelOrder?: 'none' | 'nodesAndEdges';       // measured: none
  spacing?: { node?: number; layer?: number; edgeNode?: number; edgeEdge?: number; label?: number };
  grid?: 8 | 16 | null;
}
```

Measured values for V4 (`BASE4` in `_tmp_elk_variants.mjs`): node 40, layer 56, edge-node 24, edge-edge 16, edge label 4, label-node 6, padding 48, `elk.edgeLabels.placement: CENTER`. The class view keeps today's inheritance priority (reversed, 10) with references at 0.

## 8. Decisions taken (unattended)

Method only; no R- row is written by a discovery.
1. V1h added between V1 and V2, to separate the hidden-node effect from the size effect.
2. V1/V1h/V2 measured in the app (our router kept) by wrapping ELK in the probe's browser, not simulated.
3. Ranking of the best variant as in §5, with half-bend buckets and the 16:10 fit box.
4. Outside node labels placed across the flow in V4/V5; the measured side kept as the alternative `labelAsMeasured` (2 label-edge collisions on Petri, against 0).
5. ER measured with stress plus a `sporeOverlap` pass and straight lines, beside the layered profile.

## 9. Absence claims and their controls

- No `labels`/`ports` in `elkLayout.ts`: one `command grep -n` over the file with 13 alternatives printed 13 lines (NODE_W, considerModelOrder, `await elk.layout`, ...), none for `labels` or `ports`.
- No layout call in derive and Jjodie paths: §4.8, exit 1 with positive controls through the same `command grep`.
- No grid option in ELK: the 234 ids of `knownLayoutOptions()` filtered by `/grid/i` give `[]`; the same dump contains every one of the 38 ids checked for this report.
- Edge-node intersections 0 on the canvas: the same metric code reports 1 on the canvas for Statechart V1h and V2 (the `unlocked->unlocked` self-loop through the event node `push`, resp. `coin`), so it has signal.

## 10. Questions

1. Order and scope of the lanes after the demo?
   Recommended: one lane F1+F2+F3+F6 (ELK input, routes drawn session-only, profile as data, 8 px snap), merged before 2026-10-07; F4 and F5 in a later critical-zone lane.
2. Where does the layout profile live?
   Recommended: an optional `layout` key on `DerivedNotation` in `notations.ts`, copied into the derived viewpoint's `_state` at derivation, not in `notationCatalog.ts`.
3. Are ELK routes persisted?
   Recommended: session-only in the first lane, as classic waypoints are today; persistence (F5) after the Layer Impact Report.
4. Which grid?
   Recommended: snap auto-layout positions to 8 px (the quality bar) and leave the drag snap at 16 px unchanged.
5. Fixed-side ports?
   Recommended: no; take each edge's sides from ELK's sections (V5 measured no gain and more bends).
6. ER (Chen) algorithm?
   Recommended: stress with an overlap-removal pass and straight lines, the only variant at 0 on every hard metric.
7. Fork/join bar orientation under a vertical Activity (UML) flow (amends R-VP-26 (2), Alfonso)?
   Recommended: the bar follows the layout direction, horizontal 120x5 under DOWN.

RC-10: the prompt cites «single vertical axis for Activity (UML), as ratified». `docs/decisions.md` has no such row (search `single axis|single vertical|vertical axis|asse verticale`, one unrelated hit at `:1764`); R-VP-26 (2) says the bars are upright because «DemoFlowB's rows run left to right». This report used DOWN for Activity (UML) as the prompt states; question 7 carries the conflict.

## 11. Addendum 2026-10-02, Phase 2 plan (before any code)

Prompt `claude_2026-10-01_2215_fase2_elk_layout.md` (`57c150a2a`); the trunk tip `c3a9c9ffd` merged as `5c9aadb1c` (one conflict, `docs/log-inbox/views.md`, resolved as the trunk's folded inbox plus this lane's two entries; `check:addonly` on the merge reports 196 entries, all among the 199 it already reports on the trunk's own fold-and-rotate commit `d2eb5fb83`: inherited, not introduced).

- **The edge renderer that draws the route: `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`.** The route enters its pipeline in place of the router's raw polyline (`computeManhattanPath`), with bundle spread, node avoidance and lane shifts skipped for that edge; waypoints, crossings bridges and corner rounding stay. Self-loops, `curve: 'arc'` edges (Statechart (UML), Petri net (classic), ER (Chen)), non-orthogonal IR edges, Activity junction branches and grouped inheritance keep their own geometry: for them the route gives the sides only. Label `div`s gain `data-elk-edge` / `data-elk-label` attributes (additive) so `handleAutoLayout` can measure them.
- **Where the route lives:** a session store inside `elkLayout.ts` (keyed by edge id, with a revision counter read like `laneShiftsRevision()`), not `edge.data`: `useJjomSync.ts:1501-1522` rebuilds patched edges keeping only waypoints, anchors, `jjomRefId` and `reference`, so a field on `data` would be dropped by the first incremental sync, and that file is in the critical zone. Never written to JjOM.
- **Validity:** a route carries the two node rects it was computed for; `UnifiedEdge` draws it only while both end nodes still have those rects (0.5 px), and its end points are fitted to the handles React Flow gives (first and last segment moved along their own axis), since aligning the handles with ELK's ports waits for the critical-zone lane (D-B).
- **Only the toolbar runs the new path.** `handleAutoLayout` gains an argument; the toolbar passes it, the onInit layout and the late-edge re-layout (`autoLayoutRef`) keep today's `computeElkLayout`, byte for byte, so opening a project or a viewpoint renders as before. The toolbar prop (`EditorV2.tsx:4347`) is the one line outside `handleAutoLayout` this needs.
- **Profiles:** `DerivedNotation.layout` for Flowchart, Activity (UML), Petri net (classic), Statechart (UML), ER (Chen), copied into `_state` as `derivedLayout` (a JSON string, the `_state` values being strings); a metamodel canvas without a derived profile takes the measured class profile (§5.1: V4 and V4-ns tie on DemoFlowB, V4-ns best on DemoERD); every other canvas keeps today's strategy, with the input fixes (real sizes, hidden nodes out, labels, model order off, 8 px snap).
- **Q7 with R-VP-36:** the prompt's «120 x 5» predates R-VP-36 (bar declared 7 px, ratified 2026-10-01); the bar follows the direction at 7 px: 120 x 7 under DOWN.
- **Tests outside the DOVE list, declared:** `viewpoint/derive/__tests__/activityUml.test.ts` (the bar's pinned 7 x 120) and `__tests__/erChen.test.ts` (the pinned `_state` of ER (Chen), which gains `derivedLayout`).

## 12. Addendum 2026-10-02, Phase 2 results (measured)

Code `803b84e3a` on `elk-layout-disc`. Files: `utils/elkLayout.ts` (the toolbar path appended; `computeElkLayout` unchanged
but for one import line), `utils/__tests__/elkLayout.test.ts` (new, 30 tests), `EditorV2.tsx` (`handleAutoLayout`'s
`full` branch, and the toolbar prop at the `onAutoLayout` line), `edges/UnifiedEdge.tsx`, `viewpoint/derive/notations.ts`,
`viewpoint/derive/viewpointDerivation.ts`, and three pinned tests: `activityUml.test.ts`, `erChen.test.ts`,
`nodes/__tests__/nodeSizing.test.ts` (the bar and the `_state` they pinned). No critical-zone file.

**What changed against §11's plan, each measured on the in-app probe:**
- Route ends are ELK's own ports, moved only by their node's 8 px snap, not fitted to the handles: fitting them to the
  handles' uniform slots reordered ports and crossed routes (Flowchart 2 crossings, measured). The endpoint grips sit on
  the drawn ends (R-VP-38).
- Activity (UML)'s merge and decision diamonds are 28 px ELK nodes, the branches fitted to the diamond's vertex: with
  the junction edges left on the router the guards still crossed three edges (measured).
- `curve: 'arc'` edges draw their chord between the route's ends, the opposite edge of a pair read the same way; a
  stress (ER) route keeps the handles' ends, since it ends on the box, not on the diamond or the ellipse.
- No `data-*` attribute on the label `div`s: they changed the markup bytes the IR render tests pin (6 files red,
  measured). The labels are matched to edges by their text, then by distance.

**Metrics after a real toolbar auto-layout** (`lane-run probe ... _tmp_elk_after.ts --port 3220`, 17/17, no page error;
fit box = the 16:10 box needed to show the drawing, against V0):

| scene | variant | node-node | edge-node | crossings | edge-edge overlap | label-label | label-node | label-edge | off 8px grid | bends mean / max | W×H px | aspect | fit box vs V0 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| flowB_flowchart | V0 (today) | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 8/8 | 1.78 / 2 | 775×1026 | 0.76 | 1.00 |
| flowB_flowchart | Phase 1 best (V4-ns) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/8 | 1.11 / 2 | 701×532 | 1.32 | 0.27 |
| flowB_flowchart | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/8 | 0.89 / 2 | 442×538 | 0.82 | 0.27 |
| flowB_activityUml | V0 (today) | 0 | 0 | 1 | 0 | 1 | 0 | 2 | 8/8 | 2.11 / 3 | 717×984 | 0.73 | 1.00 |
| flowB_activityUml | Phase 1 best (V4) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.56 / 2 | 569×649 | 0.88 | 0.44 |
| flowB_activityUml | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/8 | 1.78 / 5 | 368×680 | 0.54 | 0.48 |
| petri_petriClassic | V0 (today) | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 7/7 | 0 / 0 | 354×1027 | 0.34 | 1.00 |
| petri_petriClassic | Phase 1 best (V4-ns) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/7 | 0 / 0 | 547×179 | 3.06 | 0.11 |
| petri_petriClassic | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0/7 | 0 / 0 | 556×155 | 3.59 | 0.11 |
| pest_statechart | V0 (today) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/6 | 3.6 / 7 | 600×802 | 0.75 | 1.00 |
| pest_statechart | Phase 1 best (V4) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/6 | 1.2 / 2 | 541×278 | 1.95 | 0.18 |
| pest_statechart | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/6 | 4 / 7 | 552×442 | 1.25 | 0.30 |
| er_erChen | V0 (today) | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 13/13 | 0 / 0 | 1741×546 | 3.19 | 1.00 |
| er_erChen | Phase 1 best (V5-stress-spore) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13/13 | 0 / 0 | 649×579 | 1.12 | 0.28 |
| er_erChen | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/13 | 0 / 0 | 622×586 | 1.06 | 0.29 |
| class_DemoFlowB | V0 (today) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1 / 2 | 1540×522 | 2.95 | 1.00 |
| class_DemoFlowB | Phase 1 best (V4) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/8 | 1.5 / 2 | 1040×384 | 2.71 | 0.46 |
| class_DemoFlowB | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/8 | 0 / 0 | 1044×394 | 2.65 | 0.46 |
| class_DemoERD | V0 (today) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 1.5 / 2 | 276×800 | 0.35 | 1.00 |
| class_DemoERD | Phase 1 best (V4-ns) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/4 | 1.67 / 4 | 235×596 | 0.39 | 0.56 |
| class_DemoERD | **after (Phase 2)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/4 | 0.5 / 2 | 228×608 | 0.38 | 0.58 |

- Target «0 node overlaps, 0 edge-node intersections, 0 label collisions»: met in 6 of 7 scenes. **Petri net (classic)
  keeps 2**: the transition names `t1`, `t2` are painted right of the upright bar and the outgoing arc leaves the bar's
  right side through them (the notation's label position, R-VP-24; V0 had 3, the place names). Question 1 below.
- Crossings: 0 in 7/7, no worse than the best variant. Bends: no worse in 5/7; Activity 1.78 mean / 5 max against 1.56 / 2
  (the fit to the diamond vertex adds a jog on two branches); Statechart reads 4 / 7 because its transitions are arcs and
  the bend count reads their curvature (V0 3.6 / 7), not ELK segments.
- Area: the fit box at 0.11 to 0.58 of V0's, within 0.04 of the best variant everywhere but Statechart (0.30 against
  0.18: the wider spacing that keeps the arc labels apart).
- Drag: on Flowchart, after the layout, dragging `work` 60 px redraws its 3 edges on the router (3/3 paths changed), 0 on
  every collision metric after the drag. Mutant «the renderer ignores the route's validity»: 0/3 changed, killed.
- At rest (no auto-layout pressed), `_tmp_elk_rest.ts` against a baseline dev server that serves the five changed runtime
  files from `5c9aadb1c` through a Vite `load` plugin (positive control both ways: the served `elkLayout.ts` has, resp.
  lacks, `computeElkAutoLayout`): the four demo scenes in the default viewpoint and DemoFlowB under Generic, Flowchart,
  Flowchart (ISO 5807) are 0 px outside Jodie's avatar button; the avatar differs by 1 729 px (1 672 in an earlier run),
  and differs by the same amount baseline against baseline: an animation, not this lane. DemoFlowB under Activity (UML)
  differs by 94 135 px: the bars, 120×7 (Q7), the expected change.

**Gates on the code commit:** typecheck exit 2, 14 errors, the §17 set by file and code; vitest 6487 passed, 0 failed, the 9 known files red at import; build
exit 0, 50 warning lines. **Mutation bench** (`_tmp_elk_mutate.mjs`, one replacement per mutant, file restored and hash-checked): 38/38
killed on the input builder (hidden nodes, real sizes and their precedence, labels and their placement, model order,
profile direction, placement, spacing, FIRST and LAST, inheritance reversal and priority, stress and overlap removal, the
snap), the routes (orientation, junction node, side and position, snap shift of both ends, centre label, rects), the
validity (tolerance, source, target, size), the fit (both bends, the jog, polyline ends), the store (delete, revision),
the profiles (`_state`, Activity direction, ER overlap removal) and Q7; plus the renderer mutant on the probe.

**Crops** (`frontend/scripts/smoke/_tmp_elk_crops/`, gitignored, 600 px): `after_<scene>_600.png` for the seven scenes,
`after_flowB_flowchart_drag_600.png`, next to Phase 1's `<scene>_V0_canvas_600.png`; rest shots under `rest/`.

### 12.1 Questions

1. Petri net (classic) transition names cross their outgoing arc under the left-to-right profile. Move the name above the
   bar (a notation change, R-VP-24, RC-26), or accept the two collisions?
   Recommended: move the transition name above the bar in Petri net (classic), in a lane of its own after the demo.
2. Statechart (UML)'s transitions stay arcs between ELK's ports; Phase 1's best (V4) assumed orthogonal routes and is 40%
   smaller. Keep the arcs?
   Recommended: keep the arcs (R-VP-22, the notation's own curve) and accept the larger fit box.
