# Layer Impact Report: multi-tab L3, the three canvas doors take the tab's layout key

Prompt: P-2026-11-07-1249 (lane full, critical zone `useJjomSync.ts`, `canvasToJjom.ts`). Base: `9d3a79c22`.
Sources: `discovery_2026-11-06_multi_tab_viewpoints.md` §3.3, §3.5, §7 row L3; `lir_2026-11-07_layout_key_resync.md`;
`lir_2026-11-07_tab_viewpoint_plumbing.md`. Line numbers below are measured on `9d3a79c22`.

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)       write path only: the key a layout record is written under
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

## 0. One finding that changes the mechanism of the prompt

The prompt has `useJjomSync.ts` read the tab key from `EditorContext`. It cannot: the only
`EditorContext.Provider` is rendered by `EditorV2Inner` itself (`EditorV2.tsx:5134`), and the same component
calls `useJjomSync` above it (`EditorV2.tsx:610`). A `useContext` in the hook finds no provider and would always
return null: the code would be inert. `useJjomSync` therefore takes the tab's viewpoint as an optional sixth
parameter, `viewpointId?: string | null`, with the convention of `EditorV2.tsx:595-597` (`undefined` = no tab,
the root's key; otherwise `getLayoutKeyFor(state, viewpointId)`). Making it live needs one argument at
`EditorV2.tsx:610`, a file outside this lane's scope: raised as the closing question, not done.
`useContentSize` runs inside the nodes, under the provider, and reads the context as the prompt says.

## 1. Per door: what changes, what does not

**Transformer, `utils/jjomTransformers.ts`** (read). `effectiveLayoutOf(raw, layoutKey)` takes the key; the four
vertex mappers, `manualSizeOf` and `computeOptimalHandles` pass it down; the three exports
`jjomVertexToRFNode(vertex, layoutKey?)`, `jjomEdgeToRFEdge(edge, layoutKey?)`,
`transformJjomGraph(vertices, edges, layoutKey?)` take it optional, and an absent key reads
`getActiveLayoutKey()` once per call, as today. Unchanged: what a node or an edge contains, the per-record
read-through (R-LAY-15), position, size and anchors from one record. The callers outside scope,
`EditorV2.tsx:944` and `:4326`, pass nothing and keep the global key.

**Write-back, `sync/canvasToJjom.ts`** (write). The five functions (`syncPositionToJjom`,
`syncPositionBatchToJjom`, `syncSizeToJjom`, `syncSizeResetToJjom`, `syncSizeBatchToJjom`) take an optional last
`layoutKey`; absent, `getActiveLayoutKey()` is read once per gesture as today. The actions are identical: one
`SetFieldAction` of `layoutByViewpoint` with `'+='` and the single key `{ [key]: record }`, so the other keys'
records are untouched (reducer shallow merge, `canvasToJjom.ts:66-70`). TRANSACTION content unchanged, no
creator inside (Rule 12 not concerned). Every caller is in `EditorV2.tsx` or elsewhere out of scope and passes
nothing. The default stays right with several tabs because a gesture happens in the focused tab and L2 writes
`activateViewpoint` when a tab gains focus (Q2): at gesture time the root key is the focused tab's key.

**Sync, `hooks/useJjomSync.ts`** (read, critical zone). The tab key replaces `getLayoutKeyOf(state)` in the two
selectors (`:1152-1156`, the snapshot and `layoutKey`) and is passed to every transformer call: init push
(`:1245`, `:1249`), added elements (`:1329`, `:1345`), patched elements (`:1411`, `:1461`). The R-MT-19 path is
unchanged: the key is already an input of the snapshot (`vertexSnapshot.ts:214-236`, term mixed last) and
`layoutKeyOnlyChange` / `rekeyedNode` take it as a parameter, so `vertexSnapshot.ts` needs **no change**. With
a tab key, a root switch moves neither selector, so a tab whose key did not change is not re-transformed; a
tab key change moves both, and the vertices take the new key's geometry through `rekeyedNode`. Unchanged:
populate (Step 4) and its deps, Step 3 edge guards (Rule 13), `syncState` registries, TRANSACTIONs.

**Content size, `viewpoint/ir/useContentSize.ts`** (read, `viewpoint/ir`). The `isResized` selector (`:156-157`)
and the unmount check (`:306`) read the key of `useEditorContextSafe()?.viewpointId`, same convention
(`undefined`, or no provider, is the root). The unmount effect is mount-only, so it reads the viewpoint through
a ref. `cascadeWrites` (`:99`) is keyed by (canvas instance, vertex). The instance is `useStoreApi()`, one store
per `ReactFlowProvider`, i.e. per `EditorV2`, and stable across a node remount, which is why the cap is module
level (`:94-96`); `useReactFlow()`'s object is memoised per hook call (`@xyflow/react` `index.mjs:1037`) and
would reset on remount. Same three writes per (instance, vertex) per cascade, same microtask clear, same warning.

## 2. Cross-layer interaction and safety

- D-layer: no new field, no new action kind. A write under key `B` and a read under key `B` meet on the same
  record; a reader under `A` never sees it (R-LAY-14 dictionary).
- Sync ↔ transformer: the sync hands the transformer the key its snapshot was built under, so the node is
  never placed under one key and skipped under another. The edges get the same key, so anchors are chosen on
  the geometry the nodes stand on.
- Content size ↔ transformer: the hook gates on `isResized` of the same key `manualSizeOf` reads, so they stay
  complements (`useContentSize.ts:134-140`) per tab.
- R-LAY-19: no new reader of `state.viewpoint`. The defaults go through the adapter (`getLayoutKeyOf`,
  `getActiveLayoutKey`), existing readers.

## 3. What stays global after L3

- `EditorV2.tsx`: the `useJjomSync` argument (§0), the write-back calls, the transformer calls at `:944` and
  `:4326`, and its own key reads at `:4125`, `:4580`, `:4708` (the `:596` read is L2's no-tab fallback).
- IR resolution on the root viewpoint: `irResolveCore.ts`, `computeIRSignature`, `SymbolEditorModal` (L5).
- Populate ownership and the `syncState` registries per model (L4).
- `portDistribution.ts`, `handlePosition.ts`: not touched (instance-local RF geometry).

## 4. The single-tab case

With one tab the tab's viewpoint starts from the root and the picker writes both (L2), so
`getLayoutKeyFor(state, tabVp) === getLayoutKeyOf(state)`. Until `EditorV2.tsx:610` passes the argument, the
sync takes the `undefined` branch, which is the current call. The transformer and the write-back with no key
are the current code. The cascade cap with one canvas has one instance, so its counts equal today's.

## 5. Smoke scenarios potentially affected

- import Families.ecore → 8 edges Family↔Member, anchors as before.
- open an existing project under an exclusive viewpoint → nodes at that viewpoint's positions and sizes.
- drag, resize, Reset size under viewpoint `B` → only `layoutByViewpoint.B` changes; switch to `A` and back.
- save → reopen → identical state.
- IR content-sized node (a Petri place) settles in two writes; a ping-pong still yields at three.

Uncertain about propagation: only §0, raised as a question.

## 6. Addendum: app check (P-2026-11-07-1352)

Tree `~/jjodel-w-mtl3` at `b33b17377` (code `0002f1ae4`), dev server 3352 started by `lane-run probe`, one per run,
stopped by it. Probes copied into `~/.jjodel-lanes/P-2026-11-07-1352/`, originals untouched; JSON, logs, summaries
and crops there. Every probe run 0 page errors. Load (1-min) before each run below 40 (one wait, from 81.6).

**Single tab, no regression.** Layout probe of 0628 (the P-2026-11-07-1008 copy, welcome-key seed included),
`LS_RUNS=3`: 3/3 at every step, every run, at +4 s and +10 s; 18/18 table rows yes / yes / yes; exit 0.

| Step | r1 / r2 / r3, +4 s and +10 s |
|---|---|
| 1 A baseline, 2 A->B, 3 B->A, 4 reload on B, 5 after reload B->A, 6 rename Alpha | 3/3 each |

Container probe, one run: 5 checks PASS, 0 failures (12 node boxes identical c0 vs c2; 0 hulls, vacuous on this
fixture as in 0431, 0555, 1008).

**Two tabs on two models, scene L3** (the 0457 probe extended). Tab A on model `demoESM` with V = `DemoESM / Generic`,
tab B on `esmB` with W = `ProbeW`, both exclusive. Three objects created in B by `syncCreateObject` (State, Initial,
Terminal). V and W records written by real drags in each tab, and they differ for every node measured (setup check).
Focus by a click on the app bar tab. Both panes read at +4 s and +10 s after each step: the DOM translate of the three
dragged nodes against `layoutByViewpoint[tab key]`.

| Step | Pane A (key V) | Pane B (key W) | Runs |
|---|---|---|---|
| 1 focus A | 3/3, own key | 3/3, own key | r1..r4, +4 s and +10 s |
| 2 focus B (root becomes W) | 3/3, own key | 3/3, own key | r1..r4, +4 s and +10 s |
| 3 focus A again | 3/3, own key | 3/3, own key | r1..r4, +4 s and +10 s |
| 4 after a drag in B | 3/3, own key | 3/3, own key | r1..r4, +4 s and +10 s |

32 of 32 reads per pane: the DOM shows the record of the tab's own key, never the other one. Records (r2..r4,
identical): A V `48,192 / 464,192 / 896,192`, W `48,400 / 464,400 / 896,400`; B V `128,224 / 416,224 / 720,224`,
W `256,176 / 560,176 / 864,176`. Drag in B (+70, +50 px, the State node): W `256,176 -> 320,224`, V `128,224`
unchanged; the other two B vertices and the three A vertices unchanged under every key. Same in r1.

Runs: r1 with every 0457 scene first (V1, V3, V2, R-MT-18, ONE, then L3); r2..r4 setup and L3 only. A first r2
failed its setup check (A: 2 of 3 nodes with distinct V and W records): the scene's +150 px drag of A's first
node under W landed it on the second node of the row, so the second drag grabbed the first node again. Probe
fixture defect: A's W drag made vertical (0, +260), r2 rerun; the failed JSON kept as `run-l3-2-overlap.json`.
r1 ran before the change, with A's W records from the ONE scene and the +150 px drags.

**0457 scenes, once (r1).** Every step line of V1, V3, V2 and R-MT-18 (picker label of each pane, root, project
field, saved preferences, active tab, B's viewport) is identical to 0457 head run 1. Undo on focus: +0, +0 with the
two tabs on VP1 and ProbeW (0457: +1, +1); control +0, +0 as before. This is L2's no-undo-on-focus fix, on the
trunk since 0457. ONE scene: 10/10 under ProbeW, 6/6 under VP1 (0457: 9/10 and 4/6, before the layout-key fix).

**Observation, not L3's scope.** Pane A, kept on V, draws 6 nodes while A is focused and 10 while B is focused (root W),
in every run. The four extra nodes stand at V's resolved positions (10/10 against the resolver under V). The node set
follows the root viewpoint, which is IR resolution on the root (§3, L5 territory); positions follow the tab key.

**Crops** (light theme, r1 at +10 s): `crop_l3_focus_B.png`, `crop_l3_focus_A.png`, `crop_l3_after_drag_B.png`,
and `crop_2_B.png` (single tab, ProbeA -> ProbeB). Not committed. Alfonso's visual check is due.
