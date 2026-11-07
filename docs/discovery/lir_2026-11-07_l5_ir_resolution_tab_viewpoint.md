# Layer Impact Report 2026-11-07 — IR resolution with the tab's viewpoint (multi-tab L5)

Prompt: P-2026-11-07-1516 · Chat: C-2026-11-07-0425 · Front: multi-tab · Lane: full (`viewpoint/` subtree LIR trigger; not critical zone).
Parent report: `docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md` §1.2 (R4, R5, R6, R8), §1.4, §7 row L5.
Observation it answers: `docs/discovery/lir_2026-11-07_l3_tab_layout_key.md` §6 (pane A, kept on V, draws 6 nodes focused and 10 with the root on W).
Decisions: R-MT-1, R-LAY-19, R-DMV-1. Scope widened in chat (Option A, 2026-11-07): `EditorV2.tsx` and `nodes/ObjectNode.tsx` added to the five files of §7, seven source files in all. Written and committed before any code (CLAUDE.md §3.2).

## 0. Files

Line numbers measured on `4834b0edb`.

| File | Change |
|---|---|
| `components/editor-v2/viewpoint/ir/irResolve.ts` | `irViewpointArg(viewpointId)` added: the core's viewpoint argument for a tab's id (§2). `useIRView`, `useIRViewpointActive`, `useIRRowView` read `useEditorContextSafe()?.viewpointId` and pass it to every `computeIRSignature` / `getIRIndex` call (`:50`, `:87-88`, `:99-100`, `:133`, `:136`, `:157`, `:170-171`, `:181`, `:186`). Their consumers (`ObjectNode`, `IRRow`, both under the canvas provider) do not change. |
| `components/editor-v2/viewpoint/ir/useIRContainment.ts` | `useIRInteractionPlan(viewpointId?)` and `useIRContainment(nodes, edges, viewpointId?)` take the id as a parameter: their only caller is `EditorV2Inner`, which renders the provider below itself and cannot read it. Every signature and index read takes it (`:76`, `:79`, `:87`, `:95`, `:97`, `:135`, `:158`); the container layout key at `:194` becomes `getLayoutKeyFor(state, viewpointId)` when a tab id is given. The cross-deps epoch and bar-orientation resets (`:153`, `:155`) fire when THIS instance's signature changes (§3). |
| `components/editor-v2/viewpoint/ir/IRForm.tsx` | `viewpointOfHost(host, tabViewpointId)`: the manager keeps `DATA_MANAGER_VIEWPOINT_ID` (R-DMV-1); any other host takes the tab's id through `irViewpointArg`, the root when there is no tab. The theme read at `:251` goes through the same function. |
| `view/viewPoint/metaclassPalette.ts` | `resolveMetaclassColoring(state, classId, viewpointId?)`: a string names the viewpoint, `null` paints nothing (abstract syntax), `undefined` reads `state.viewpoint` as today (R8, `:374`). |
| `components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` | the open event's `detail` accepts an optional `viewpointId`; the two instance-size layout keys (`:270`, `:303`) use `getLayoutKeyFor(s, viewpointId)` when it is given and `getLayoutKeyOf(s)` otherwise. The only dispatcher, `components/editors/views/ViewData.tsx:111`, is not changed: the views editor is a dock panel with no tab, so the modal keeps reading the root. |
| `components/editor-v2/EditorV2.tsx` | passes `viewpointId` to `useIRContainment` (`:1726`) and `useIRInteractionPlan` (`:1888`). The seven root IR reads (`:235/237` `isIREdgeLayoutPersistable`, `:1298` views-editor entry, `:1740` `onlyRenderVisible`, `:1863` IR layout hydration, `:3748` context menu, `:4451` container drag, plus the `:1848` and `:1872` callers of the first) take the tab's id through `viewpointIdRef.current` and `irViewpointArg`. |
| `components/editor-v2/nodes/ObjectNode.tsx` | `:146` passes `editorContext?.viewpointId` (already read at `:95`) to `resolveMetaclassColoring`. |

Tests: one new file `components/editor-v2/viewpoint/ir/__tests__/irTabViewpoint.test.ts` (the hooks with React stubbed, the core's two ids, the per-instance reset), and a new `describe` in `view/viewPoint/__tests__/metaclassPalette.test.ts`. Existing test mocks extended without changing assertions where a hook now calls `useContext` outside a render (React stubbed): listed in the log entry.

## 1. Layers

```
Layers touched:
  [ ] D-layer (Redux raw data)          no write; every change is a read
  [ ] L-layer (computed proxies)        untouched (makeReadCtx unchanged)
  [ ] JjOM (model entities)             untouched
  [x] Canvas v2-flow                    which IR views a node, a row, a containment pass and the
                                        interaction plan resolve; metaclass colours; seven EditorV2 IR reads
  [ ] Canvas classic                    untouched (shut down)
  [ ] Sync layer (useJjomSync hooks)    untouched (L3 took the layout key; this lane takes the view set)
  [ ] Persistence (VersionFixer / jsxString)  untouched; no migration, no persisted field
```

- What changes: the viewpoint the IR resolution of one canvas reads, from the root to the tab's.
- What does NOT change: the core (`irResolveCore.ts`), already parametric (R4 `:128`, R5 `:192`, the R-DMV-1 precedent); the index cache; the layout records and keys (L3); every writer of `state.viewpoint`.
- Cross-layer interaction: none new. The tab's id comes from the L2 plumbing (`EditorContext.viewpointId`, `EditorV2` prop); the containment layout key uses the L2 adapter `getLayoutKeyFor`.
- Side-effect safety: no new reader of `state.viewpoint` (R-LAY-19). Every fallback to the root is the existing read, reached only when `viewpointId` is `undefined`.

## 2. The three values of the tab's id

`EditorContext.viewpointId` (L2) is `string` (the tab's viewpoint), `null` (the tab is on abstract syntax) or `undefined` (no tab owns the canvas: the standalone `/editor-v2` route, a host outside any canvas). The core reads its optional argument with `viewpointId ?? state.viewpoint`, so a `null` handed over as-is would resolve under the root: the defect this lane removes for the abstract-syntax tab. `irViewpointArg` maps the three values once:

| Tab id | Core argument | Result |
|---|---|---|
| `'W'` | `'W'` | W's signature and index |
| `null` | `''` | `'' ?? root` is `''`: empty signature, no index, the node renders natively |
| `undefined` | `undefined` | the root, byte-identical to today |

The palette makes the same split by hand (`undefined` reads the root, `null` paints nothing).

## 3. Caches and registries: two ids, no cross-tab pollution

- **Signature and index cache** (`irResolveCore.ts:172`): keyed by the signature, whose first part is the viewpoint id (`:131`). Two tabs on V and W hold two entries; the eviction at `:290-295` drops only older signatures of the SAME viewpoint (`oldIdx.viewpointId === vp`), and so do the css removals. Pinned by a test, not changed.
- **Cross-deps epoch and bar orientations** (`irCrossDeps.ts:144`, `barOrientation.ts:45`): module-level, reset when the signature passed differs from the last one seen. Today every canvas passes the root's signature, so two canvases never disagree. After L5, two tabs on V and W pass two signatures: each decoration recompute of one tab would clear the other's published deps and edge-object keys, the other's `oaeSlotsSig` would move, its recompute would clear the first's, and so on, once per store update, for as long as both show object-as-edge views. The reset therefore fires when the signature of THIS `useIRContainment` instance changes (a ref of the last signature it decorated with), and on its first decoration as today. `useIRContainment.ts` is the only caller of both resets, so with one canvas the calls are the same as today. Residual: a tab that changes viewpoint, or mounts, still clears the other tab's published deps once; they are re-published at the next store update (the selectors of `useIRView` see their cross part vanish and re-resolve), and no loop follows.
- **Not changed, found here** (a ticket in the log entry): `publishedChannelSlots` (`useIRContainment.ts:61`) is one module-level list for every canvas. With two IR canvases mounted (two models, already reachable today) the last decoration overwrites the other's list, and that canvas stops re-decorating on its own membership edits until its next recompute. Independent of the viewpoint, out of this lane.

## 4. Readers of `state.viewpoint` left after L5, and why

| Reader | Stays because |
|---|---|
| R1 `EditorSwitch.tsx:55` | the tab state is initialised from the root (L2). |
| R2 `Toolbar.tsx:297` | the no-tab fallback of the picker (L2). |
| R3 `EditorV2.tsx:4057` | already the tab's, root only when `viewpointIdRef.current === undefined` (L2). |
| R4, R5 `irResolveCore.ts:128`, `:192` | the core's own fallback for `undefined`. |
| R6 `IRForm.tsx:251` | reached only when no tab owns the form; today `IRForm` is mounted only with `host="manager"` (`InstanceDetail.tsx:1133`, `:1169`), so the line is inert in the app. |
| R7 `vertexLayoutAdapter.ts:72` | `getLayoutKeyOf`, the no-tab door (L3). |
| R8 `metaclassPalette.ts:374` | the `undefined` branch only. |
| `SymbolEditorModal.tsx:270`, `:303` | its opener has no tab (§0); the modal is mounted at `App.tsx:187`, outside every canvas. |
| `TreeViewSidebar/treeViewScope.ts:104` | the Tree View sidebar is per project, not per canvas; a decision of its own if the tree should follow the focused tab. |

L9 (an allow-list check, discovery Q10) would start from this table.

## 5. The single-tab case

One tab, or the standalone route: `viewpointId` is the root's value (L2 initialises the tab from it and writes it back on focus) or `undefined`. With a string equal to `state.viewpoint` every signature is the same string as today's, so every cache key, memo dep and selector output is unchanged; with `undefined` the code path is today's. The abstract-syntax case changes only when the tab's `null` and the root disagree, which one tab cannot produce: L2 keeps the root in step with the focused tab. The per-instance reset makes the same calls as today with one instance (§3).

## 6. Smoke-test scenarios for the continuation lane (app check)

- The L3 scene: tab A on V, tab B on W; pane A draws the same node set focused and unfocused (the 6/10 observation of the L3 LIR §6 becomes 6/6), at V's resolved positions.
- A tab on abstract syntax beside a tab on an IR viewpoint: the abstract tab draws native nodes whatever tab is focused.
- Metaclass colouring on for V only: A's nodes keep V's colours when B (W) is focused; B's nodes never show them.
- Single tab: switching viewpoints, reload, rename, the L3 single-tab probe (layout 3/3, container 0 failures): unchanged.
- Symbol Editor opened from the views editor: instance sizes as today.

Uncertain about propagation: none found; the Sync layer and the D-layer are not reached.
