# Layer Impact Report 2026-11-07 — per-tab viewpoint plumbing (multi-tab L2)

Prompt: P-2026-11-07-0440 · Chat: C-2026-11-07-0425 · Front: multi-tab · Lane: full (`viewpoint/` subtree LIR trigger; not critical zone).
Parent report: `docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md` §1.2 (R3, R7), §2.5, §2.6, §7 row L2, §9 Q2 and Q7.
Decisions: R-MT-1, R-MT-16, R-MT-18, R-LAY-19. Written and committed before any code (CLAUDE.md §3.2).

## 0. Files

| File | Change |
|---|---|
| `components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` | `getLayoutKeyFor(state, vpId)` added; `getLayoutKeyOf(state)` becomes `getLayoutKeyFor(state, state.viewpoint)`, the read of `state.viewpoint` kept inside a `try` (the hostile-getter test). No caller changes (L3). |
| `components/editor-v2/contexts/EditorContext.tsx` | two optional fields (Rule 11): `viewpointId?: string \| null` (the tab's viewpoint; `null` is abstract syntax, `undefined` means no tab owns this canvas) and `onViewpointChange?` (the tab's setter, for the picker). |
| `components/abstract/tabs/EditorSwitch.tsx` | tab state `tabViewpointId`, initialised at mount from the restored preference if one applies, else from the root (R1, the existing reader); passed to `EditorV2` with its setter. Focus write (Q7). R-MT-18 in the mount restore. Metamodel tabs pass the root through unchanged and own no tab state. |
| `components/editor-v2/EditorV2.tsx` | props `viewpointId`, `onViewpointChange`, forwarded to `EditorV2Inner` and into `editorContextValue`. Viewport key at `:587`, `:3896`, `:3902` from `getLayoutKeyFor(state, viewpointId)`. R3 (`:4041`) reads `viewpointId`. Without the prop (the standalone `/editor-v2` route, `App.tsx:152`) both fall back to today's code. |
| `components/editor-v2/Toolbar.tsx` | the picker reads the tab's value from the context (root as fallback, R2 kept for the no-tab case) and, on a pick, writes the tab's value beside `activateViewpoint` and the preference (Q2). The handler keeps its `[modelId]` deps (two source-text tests slice up to it): the setter is read through a ref. |

Tests: `viewpoint/layout/__tests__/vertexLayoutAdapter.test.ts`, `abstract/tabs/__tests__/editorSwitchViewpointPrefs.test.ts` (extended, not new files).

## 1. Layers

```
Layers touched:
  [ ] D-layer (Redux raw data)          no new write path; activateViewpoint is the only writer, as before (R-LAY-11)
  [ ] L-layer (computed proxies)        untouched
  [ ] JjOM (model entities)             untouched
  [x] Canvas v2-flow                    viewport key, ELK profile source, toolbar picker value
  [ ] Canvas classic                    untouched (shut down, Q4)
  [ ] Sync layer (useJjomSync hooks)    untouched (L3, L0b; the parallel lane P-2026-11-07-0430 owns useJjomSync.ts)
  [ ] Persistence (VersionFixer / jsxString)  untouched; no migration (discovery §5)
```

**Canvas v2-flow.**
- What changes: the viewport of `localStorage` `jjodel.viewport.<modelid>.<layoutKey>` is keyed by the tab's viewpoint;
  the ELK auto-layout profile (R3) is read from the tab's viewpoint; the picker shows and writes the tab's value.
- What does NOT change: every layout read and write (`:4110`, `:4565`, `:4693`, `effectiveLayoutOf`, the five writes of
  `canvasToJjom.ts`, `useContentSize.ts`, `useIRContainment.ts`, `SymbolEditorModal.tsx`) stays on `getActiveLayoutKey()`
  / `getLayoutKeyOf(state)`, i.e. on the root, until L3. IR resolution (`computeIRSignature`, `getIRIndex`, `useIRView`,
  `IRForm`, `resolveMetaclassColoring`) stays on the root until L5. So the concrete syntax and the geometry a canvas draws
  are still the root's.
- Cross-layer interaction: the root and the tab agree for the focused tab (below), so the viewport key and the layout
  key coincide where the user looks. They can differ only for a tab rendered off-screen (rc-dock keeps it mounted,
  discovery §2.3); there the viewport key is the tab's and the layout key the root's until L3.
- Side-effect safety: no new reader of `state.viewpoint` (R-LAY-19). The two existing readers that remain (R1 in
  `EditorSwitch`, R2 in `Toolbar`) are now the initial value / fallback, and R3 and the viewport key leave the root.

## 2. How the tab and the root stay in step

The root `state.viewpoint` and `project.activeViewpoint` keep meaning «the focused tab's viewpoint» for the global
readers (Tree View, rail, new-view parenting, discovery §1.5) and for everything L3 and L5 have not moved yet:

1. **Mount.** The tab state is the restored preference when `savedViewpointToRestore` returns one (R-MT-16: active tab
   only), else the root. R-MT-18: a saved `''` is returned as `''` (abstract syntax) and restored with
   `activateViewpoint(null)`; no saved preference stays «nothing to restore» (`null`).
2. **Pick (Q2).** The picker writes the tab state, calls `activateViewpoint` and saves the model's preference (L1).
3. **Focus (Q7).** On `JjodelEvents.ACTIVE_TAB`, the tab that gains focus calls `activateViewpoint(tabViewpointId)` when
   the root differs. Only on the transition to focused: the event fires on every layout change.
4. **Root changed by someone else while the tab is focused** (undo of an activation, today a D-layer step; a project
   reload): the focused tab adopts the root, so its picker never contradicts the canvas. A tab not focused keeps its own.

Metamodel tabs own no tab state: no picker, no focus write; they pass the root through, as today.

## 3. Readers R3 and R7 (discovery §1.2)

- **R3** `EditorV2.tsx:4041` (ELK profile of `handleAutoLayout`): reads the `viewpointId` prop through a ref, so the
  callback's deps are unchanged; the root only when no tab owns the canvas.
- **R7** `vertexLayoutAdapter.ts:72` (`getLayoutKeyOf`): stays, as the definition of «the key of the root», now
  `getLayoutKeyFor(state, state.viewpoint)`. `getLayoutKeyFor` is the parametric form L3 moves the call sites to.

## 4. What stays on `state.viewpoint` until L3 and L5

- L3: `getActiveLayoutKey()` at `EditorV2.tsx:4110`, `:4565`, `:4693`, `jjomTransformers.ts:59`, `canvasToJjom.ts:89`,
  `:105`, `:134`, `:150`, `:164`, `MetamodelTab.tsx:123`; `getLayoutKeyOf(state)` at `useContentSize.ts:157`, `:306`,
  `useIRContainment.ts:194`, `SymbolEditorModal.tsx:270`, `:303`.
- L5: `computeIRSignature(state)` / `getIRIndex(state, sig)` without the id (discovery §1.4), `IRForm.tsx:251` (R6),
  `metaclassPalette.ts:374` (R8).
- Global by design: `treeViewScope.ts:104`, P2..P6.

## 5. Visible consequences (for the continuation lane's app check)

The discovery's «no behaviour change» holds for one model tab. With two model tabs (different models, the only case
reachable before L6) three things become visible, all the semantics R-MT-1 asks for:

- **V1** Pick vpW in A, focus B: B restores its own viewpoint (the focus write) instead of showing vpW; back to A shows vpW.
- **V2** A tab mounting with a saved preference opens its viewport under the restored viewpoint's key (today the viewport
  is read under the root's key, one render before the restore).
- **V3** A focus switch between tabs on different viewpoints writes `activateViewpoint`, which today is a D-layer step:
  it enters the undo stack (R-LAY-19 notes it dissolves once the tab viewpoint leaves the D-layer).
- R-MT-18 (scene 3b of P-2026-11-07-0105): B's saved abstract syntax is restored.

Smoke scenarios potentially affected:
- one model tab: pick a viewpoint, abstract syntax, back: picker, canvas, preference as today;
- two models A, B: V1, V2, scene 3b;
- metamodel tab beside a model tab: focusing it changes nothing in the root;
- Cmd+Z after a pick: the picker follows the canvas back;
- close and reopen a tab: viewport restored under the tab's viewpoint.

Uncertain about propagation: none found that reaches the sync or the D-layer; V3 is the one D-layer effect, and it is
the existing `activateViewpoint` write fired at a new moment.

## Addendum 2026-11-07 — app check (P-2026-11-07-0457)

Measured in the app, light theme (no `data-theme` attribute is set; D-UI-15), viewport 1600x1000, scale 1. Head:
`multi-tab-l2` at `cec8db8a6` (code `a99ea2482`), port 3621. Base: `69c191631`, the parent of L2, in a temporary detached
worktree (`~/jjodel-w-mtl2-base`, removed at the end), port 3622. Three runs per tree, a fresh browser profile each.
Fixture per run: `scene_3_DemoESM.jjodel` imported; models A = `demoESM`, B = `esmB` (same metamodel, empty); VP1 =
`DemoESM / Generic` (derived), VP2 = `ProbeW` (`newVP`), both exclusive; root on abstract syntax, no saved preference,
no saved viewport. Picks, tab focus (a click on the app bar tab) and drags are real gestures; tab open and close go
through `DockManager`; setup and the seeded preferences and viewports are direct writes. The three runs of each tree
are identical line for line. Probe, runs and crops: `~/.jjodel-lanes/P-2026-11-07-0457/` (`probe.mjs`,
`run-<tree>-<n>.json`, `summarize.mjs`, `crop_*.png`).

### V1 — a pick in A, focus B

| Step | Expected (L2) | Head r1/r2/r3 | Match | Base (reference) |
|---|---|---|---|---|
| ProbeW picked in B | B ProbeW, root ProbeW, prefB ProbeW; A Abstract | as expected | 3/3 | A also shows ProbeW |
| focus A | root back to abstract; A Abstract | root null, A Abstract, B ProbeW | 3/3 | root ProbeW, A ProbeW |
| VP1 picked in A | A VP1, root VP1, prefA VP1, prefB ProbeW | as expected | 3/3 | B also shows VP1 |
| focus B | B ProbeW, root ProbeW, prefB ProbeW, prefA VP1 | as expected | 3/3 | B VP1, root VP1 (prefs as head) |
| focus A again | A VP1, root VP1 | as expected | 3/3 | root VP1 |

### V2 — B reopens restoring its saved ProbeW

Seeded for B: preference ProbeW; viewports `__abstract__` (11, 22, 0.61), VP1 (55, -44, 0.83), ProbeW (-133, 77, 1.37).
Root VP1, A focused.

| Expected (L2) | Head r1/r2/r3 | Match | Base (reference) |
|---|---|---|---|
| B on ProbeW, viewport (-133, 77, 1.37) | B ProbeW, root ProbeW, viewport (-133, 77, 1.37) | 3/3 | B ProbeW, viewport (55, -44, 0.83): read under the root's key, one render before the restore |

### V3 — undo entries added by a focus switch

`statehistory.all.undoable.length` (equal to the offline user's stack in every reading).

| Case | Head r1/r2/r3 | Base |
|---|---|---|
| A on VP1, B on ProbeW: focus B, then back to A | +1, +1 (2 per round trip); top delta keys `idlookup`, `viewpoint` | +0, +0 |
| control, both tabs on VP1: focus A, then B | +0, +0 | +0, +0 |

Each focus write is one D-layer undo step, as §5 V3 predicted (R-MT-15: one stack across tabs). Not fixed here.

### R-MT-18 — saved `''` and no saved preference

| Step | Expected | Head r1/r2/r3 | Match | Base (reference) |
|---|---|---|---|---|
| B reopens, saved `''` (root VP1 before) | B Abstract syntax, root null | B Abstract, root null, viewport `__abstract__`'s | 3/3 | B on the root (ProbeW): `''` skipped |
| B reopens, no preference | B on the root, root unchanged, no preference written | B VP1 = root, prefB none | 3/3 | same: B on the root (ProbeW), prefB none |

Where the preference lives: `localStorage` `jjodel.editorPrefs.<modelid>`, JSON `{ viewpointId, editorMode }`, per
browser, outside the project file (`EditorSwitch.tsx:16-39`). A value written before L1 cannot be told apart from one
written after: same key, same literal (`viewpointId: viewpointId || ''`, `editorMode: 'flow'`), no version, no
timestamp. Before L1 (`d9949895c^`, `EditorSwitch.tsx:108`) every mounted model tab wrote it on every root change, so a
stored `''` may be another tab's pick of abstract syntax, or an undone activation, rather than this model's choice;
after L1 only the picker of the model's own toolbar writes it (`saveViewpointPreference`, `EditorSwitch.tsx:92`). Until
L2 a `''` was ignored; from L2 it restores abstract syntax, so a cross-written `''` left by a pre-L1 session now opens
that model in abstract syntax. A fresh profile cannot measure how many real users carry one.

### One tab — A alone, ProbeW -> VP1 -> ProbeW from the picker

Three nodes dragged down under VP1 and right under ProbeW first. Per node, DOM translate against the app's resolver
(`readVertexLayout` under the active key), at +4 s and +10 s.

| Step | Head match | Base match | Head DOM = base DOM |
|---|---|---|---|
| ProbeW baseline | 9/10 | 9/10 | yes |
| ProbeW -> VP1 | 4/6 | 4/6 | yes |
| VP1 -> ProbeW | 9/10 | 9/10 | yes |

52/52 node positions equal between head and base in each run: no regression of one-tab behaviour. The misses are the
trunk's and the same on both trees: under VP1, `locked` and `off` keep their ProbeW positions (DOM 464,208 and 1104,208,
VP1 records 48,208 and 896,208), and under ProbeW `unlocked` sits at 464,208 over `locked` with no record (resolver
seed 470,50). Same kind as the stale positions L0b measured (`~/.jjodel-lanes/P-2026-11-07-0106/handoff.md`); not L2.

Crops (head r3): `crop_v1_focus_B.png`, `crop_v2_B_reopened.png` (zoom 140%), `crop_rmt18_saved_empty.png` (Abstract
syntax, 60%), `crop_one_tab_end.png` (shows the overlap above). Page errors: 0 in all six runs.
