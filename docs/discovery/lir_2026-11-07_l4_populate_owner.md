# Layer Impact Report: multi-tab L4, one populate owner per model, registries cleared by the last instance

Prompt: P-2026-11-08-0131 (lane full, critical zone `useJjomSync.ts`, `syncState.ts`). Base: `db65de069`.
Sources: `discovery_2026-11-06_multi_tab_viewpoints.md` §3.1, §3.2, §3.7, §7 row L4, §8; `lir_2026-11-07_l3_tab_layout_key.md`;
R-MT-17, R-LAY-19. Line numbers below are measured on `db65de069`; the discovery's were measured on `8168b608f`
and have moved by 3 to 4 lines (`useJjomSync.ts` populate effect `:521-1144`, unmount effect `:1617-1634`,
`redux/action/action.ts:352` for the async dispatch the discovery cites at `:349`).

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)       write path only: which instance issues the populate writes
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   no change in what a canvas shows, see §2
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

## 0. The defect, measured by reading on this commit

- Every mounted `EditorV2` runs its own `useJjomSync`, and its populate effect (`useJjomSync.ts:521`) reads the
  store fresh (`:541`) and creates what is missing: `DGraph.new` (`:784`), `DVertex.new` (`:808`, `:841`),
  `DVoidEdge.new2` (`:926`, `:1016`, `:1124`). Its other writes are `TRANSACTION`s with no creator: the stale
  inheritance delete (`:896`), the cross-metamodel stale delete (`:981`) and the reference reconcile, three
  `SetFieldAction`s plus duplicate deletes (`:1054`).
- An action reaches the store one macrotask after it fires (`action.ts:352`). Two instances on one model whose
  populate effects run in the same commit both see the same gap; the re-entry guard `creatingGraphRef` (`:518`)
  is per instance, and the M2 `existingEdgeKeys` reads this instance's `rfEdgeCache` (`:652`). Result: two
  vertices for one element, two M2 edges for one reference (§3.7). The same holds, not named by the discovery,
  for the non-creator writes: two instances issue the reconcile twice, and `edgesIn += edge` twice puts the edge
  twice in the new target's `edgesIn`; the stale deletes are issued twice.
- The unmount effect (`:1617`, deps `[]`) clears five module-level registries (`:1624-1628`) whatever else is
  mounted: closing tab B wipes `edgeRefIds` and `canvasEdgePairs` for tab A (§3.2).

## 1. The change

**Owner registry, `sync/syncState.ts`.** A module-level `Map<modelId, object[]>`: the instances of a model in
mount order, each an opaque token (one `useRef({})` per hook instance). Three functions, on the ref-count
pattern of `preview/scriptPreviewStore.ts:117-139` and L4b's `acquireProducerMount`
(`problems/registry.ts:333`):

- `acquirePopulateOwner(modelId, token)`: appends the token (a token already held is not appended twice).
- `releasePopulateOwner(modelId, token): boolean`: removes it; returns `true` when the model has no instance
  left (the entry is deleted). A token not held returns `false` and changes nothing, so a release run twice
  counts once.
- `isPopulateOwner(modelId, token): boolean`: the token is the first of the model's list.

Hand-over is the list itself: when the owner is released, the next instance in mount order is first.

**Acquire, `useJjomSync.ts`.** An effect keyed on `[modelid]`, declared immediately before the populate effect so
that in every commit it runs first (passive effects of one component run in declaration order): when the held
model differs from `modelid` it releases the held one, without clearing anything, and acquires `modelid`. The
held model lives in a ref, so the unmount effect knows which model to release.

**Populate gate.** The populate effect computes `ownsPopulate = isPopulateOwner(modelid, token)` after its
re-entry check. A non-owner with no graph returns (it cannot create one). Otherwise the analysis runs unchanged
in every instance, and every D-layer write of the run is behind `ownsPopulate`: Step 2 and Step 2bis
(`DVertex.new`), the inheritance and M2 reference creators of Step 3, Step 4 (`DVoidEdge.new2`), the two stale
delete `TRANSACTION`s and the reconcile `TRANSACTION`. `creatingGraphRef` and `justCreatedGraphRef` are raised
only by the owner: a non-owner creates nothing, and a raised re-entry guard would make it skip the run right
after a hand-over.

**What a non-owner still does.** It renders: the init push (`:1214`) and the incremental sync (`:1296`) are
untouched, so the owner's vertices and edges reach it through `subElements`, positions included, under its own
layout key. Inside the populate run it keeps the two RF-only halves of the stale deletes, `rfEdgeCache.delete`
plus `setEdges(prev => prev.filter(...))` (`:903-904`, `:994-995`) and the idempotent `clearCanvasEdgePair`
(`:911`): the comment at `:987-992` records that the D-layer delete alone does not refresh a canvas live, and
today every instance removes the stale edge from its own canvas in this run. `useM1ReferenceEdges` is not
touched: its creators are guarded by the module-level pair set, written synchronously (`:148`, `:177`), which
already keeps two instances from minting one M1 edge twice.

**Clears.** The unmount effect releases the held model and runs the five clears only when the release returns
`true`, i.e. when the last instance of that model unmounts. An instance that holds no model (`modelid`
undefined) clears as today. An in-place model switch releases the old model without clearing, as today (the
effect with `[]` deps never cleared on a switch).

## 2. Per layer

**D-layer.** What changes: with two or more instances on one model, the populate writes are issued once, by the
owner. What does not: the writes themselves, their order, the bare-loop creators outside any outer
`TRANSACTION` (Rule 12), the M2 composite key and the M1 pair key (Rule 13). No new reader of `state.viewpoint`
(R-LAY-19). Safety: a non-owner's analysis reads the same store and decides the same writes; it now drops them.

**Sync layer.** What changes: the owner registry, the acquire effect, the gate, the clear condition. What does
not: the init push, the incremental sync, the open settle gate (`openSettleVerdict` reads the store: a
non-owner's gate waits for the owner's vertices like any other landing; `recordCreated` is only ever fed by
creators, so a non-owner's `created` list stays empty), `portDistribution.ts`.

**Canvas v2-flow.** What changes: nothing a canvas shows, beyond the duplicates no longer created. A non-owner
on another viewpoint (L3's per-tab key) gets the new vertex through its incremental sync and transforms it under
its own key (`layoutKeyIn`, `:1156`); the vertex is one per model element, the record is per (model, viewpoint).

## 3. Registries of §3.2: what stays global and why

All six stay module-level and keyed by element id, not by model and not by instance. They are shared on
purpose: `canvasEdgePairs` is the cross-instance guard of M1 and inheritance edges, and must stay global for it
to work; `edgeRefIds` maps one edge to one reference, the same for every instance; `canvasUpdatedIds` is what
mirrors a drag between two tabs (R-MT-4); `syncModes` and `dropCreatedIds` are per node; `suppressedSingletonIds`
is written by `EditorV2.tsx` and never cleared by this unmount, unchanged. What changes is only when the five
clears run.

**Limit, not fixed here.** The clears stay global: the registries carry no model key, so the last instance of
model N unmounting still clears model M's entries while a tab on M is open. That is today's behaviour between
tabs of different models (discovery §2.3, §8), unchanged by this lane. Keying them by model needs the writers
outside this scope (`canvasToJjom.ts`, `useM1ReferenceEdges.ts`, `jjomTransformers.ts:679`, `EditorV2.tsx`) to
pass a model id, or a clear by membership in the model's graph; a ticket in the inbox.

## 4. Residual risk named, not introduced

A canvas gesture that creates an M2 reference in a non-owner tab: `syncReferenceEdge` lands the `DReference`
(`canvasToJjom.ts:357`) one dispatch before the `DVoidEdge` (`:381`). The owner's populate guard for that edge is
the `subElements` read and the `idlookup` scan; the gesture tab's `rfEdgeCache` is not in it. Before this lane
the owner ran the same guard on the same gesture in the same commit, so the exposure is unchanged; what is gone
is the non-owner's own run. To be measured in the continuation lane (gesture in each tab, edges counted by
`refId`).

## 5. The single-tab case

One instance acquires before its first populate run and is always the owner: every gate is open, every write
is issued as today. Its unmount is the last release of its model: the five clears run as today. A model switch
releases and acquires in the same commit, before the populate run: owner of the new model, no clear, as today.
The existing harnesses (`useJjomSyncOpenSettle.test.ts`, `useJjomSyncTabKey.test.ts`) mount one instance and
unmount it after each test; they run unchanged.

## 6. Smoke scenarios potentially affected

- Import Families.ecore, one tab: 8 edges Family↔Member, as before.
- Two tabs on the metamodel (crafted from the console until L6): a reference added from Properties gives one
  `DVoidEdge` with that `refId`; a class added from the Tree View one vertex in each tab.
- Close the first tab: the other adds the next element alone; `canvasEdgePairs` and `edgeRefIds` survive.
- Open an existing project, save, reopen: identical state.
- A JjTL or JjScript run that creates M1 objects, one tab: vertices and M1 edges as before.

The app measurement, before and after, is the continuation lane on the same branch.

## 7. Addendum: the app measurement (P-2026-11-08-0150, P-2026-11-08-0245)

Added after the code commit `587aed3cf`; §0-§6 above are unchanged. Parent `db65de069`, branch `587aed3cf`. Probes and
JSON in `~/.jjodel-lanes/P-2026-11-08-0150/` and `~/.jjodel-lanes/P-2026-11-08-0245/`, a throwaway browser profile
per run.

**Setup.** Families.ecore imported through the project page's `.ecore` file input (`ProjectEditor.tsx:978`, the
gesture's own handler). Tab 1 opened by `DockManager.open2`; tab 2 crafted from the console as discovery §6
describes: `DockManager.open('models', {...TabDataMaker.metamodel(m), id: m.id + '~2'})`.

**Departures, declared.**
- Console creation. No Tree View gesture adds a class and no Properties control adds a reference on this tree
  (`TreeViewContent.tsx` offers Create View, Derive viewpoint, Add view only, `:663-702`, `:2012-2020`; positive
  control: "Add view" found). The D-first creations of §6 go through the L-layer calls of the classic context menu,
  from the console: `LPackage.addClass` (`ContextMenu.tsx:325`) and `LClass.addReference(name, type)`
  (`ContextMenu.tsx:321`).
- The view move in tab 2. Step C focuses tab 2 (`dock.updateTab`) and frames its viewport through the RF12 store
  (`panZoom.setViewport`), because ProbeC1 lands off-viewport; viewport only, no node moved. Then a real connect drag
  Family -> ProbeC1 and Association picked in the edge-type popup. Facing Family/Member sides failed (source handle
  under the drop, source -> source invalid) in 6 dry runs, not counted. Per-pane DOM counts miss off-viewport nodes:
  the per-pane minimap node count (`m`) was added.
- Load gate. The branch 3-run invocation of 0150 started at 1-min load 64.15 (uptime printed in the run's own
  command, not checked before it); its results were identical to the 6 dry runs at loads 2-39. P-2026-11-08-0245
  reran the scene once on the branch at load 2.40: identical row by row (table below).

**Two tabs on one model, 0150** (parent 1 run, branch 3 runs, identical; pageerrors 0 in every run):

| step | parent `db65de069` | branch `587aed3cf` |
|---|---|---|
| one tab: reference edges | 8 x 1 | 8 x 1 |
| two tabs mounted | Family/Member one vertex each, edges 8 x 1 | same |
| A ProbeC1 (`addClass`) +4/+10 s: DVertex | **2** (minimap 4 nodes per pane) | **1** (minimap 3) |
| B probeRef (`addReference`) +4/+10 s: edges with that refId | 1 | 1 |
| C canvas reference in tab 2 (non-owner) +4/+10 s | 1 | 1 |
| R0 registries, both mounted (pairs / edgeRefIds) | 3 / 10 | 3 / 10 |
| R1 after closing tab 1 (the owner) | **0 / 0** | **3 / 10** (kept) |
| D ProbeC2 after closing tab 1: DVertex, in tab 2 | 1, rendered | 1, rendered |
| R2 after closing tab 2 | 0 / 0 | 0 / 0 (cleared) |

**Findings.** The vertex duplicate of discovery §3.7 reproduces on the parent (2) and is gone on the branch (1). The
duplicate M2 edge of §3.7 does not reproduce on the parent: a reference added D-first gives one `DVoidEdge` with its
refId on both commits, so that half of §3.7 is not confirmed by this measurement. The residual risk of §4: the
canvas gesture in the non-owner tab gives 1 edge, no duplicate. The registries survive the owner's close and are
cleared by the last instance, as §1 states. The limit of §3 (no model key) is a ticket in `docs/log-inbox/multi-tab.md`.

**Crops** (light theme, four, in the 0150 folder): `crop_head_t1_after_class.png`, `crop_head_t2_after_class.png`,
`crop_parent_t1_after_class.png`, `crop_parent_t2_after_class.png`. The ProbeC1 vertices are off-viewport and stacked
on the parent: the duplicate shows only in the minimap count, not as a visible second box. Alfonso's visual check due.

**Rerun on the branch, 0245** (1 run, load 2.40, pageerrors 0): A 1 DVertex (minimap 3 per pane); B 1; C 1 (tab 2
pane 1 edge); R0 3 / 10; R1 3 / 10, tab 1 pane gone; D 1, rendered in tab 2 (minimap 4); R2 0 / 0.

**Single tab and two models, no regression, 0245 on the branch** (each run in its own call, 1-min load checked
before it, all below 10):

| probe | runs | result |
|---|---|---|
| 0628 layout switch (steps 1-6, +4 s / +10 s) | 3 | 3/3 at every step in every run, pageErrors 0, 0, 0 |
| container switch | 1 | FAILURES 0, exit 0 |
| 0457 scenes V1, V3, V2, R-MT-18 (with ONE and L3, `SCENES=all`) | 1 | 17 PASS, 0 FAIL, pageErrors 0; undo +0, +0; R-MT-18 saved `''` reopens on Abstract syntax, no preference on VP1 |
| 1730 two-tab demo | 1 | tab A 18/18, tab B 25/25 at every focus, +4 s and +10 s; fails 0/15, pageErrors 0 |
