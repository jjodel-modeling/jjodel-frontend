# Discovery: multi-tab viewpoints — per-tab active viewpoint, shared layout per (model, viewpoint), state that is one per project today

- **Prompt-ID**: P-2026-11-06-2350
- **Prompt file**: `docs/prompts/claude_2026-11-06_2350_prompt_multi_tab_viewpoints_discovery.md`
- **Session**: `1bfcefa2-d853-4427-854f-373e6b2e0d31`
- **Tree**: `~/jjodel-w-multitab`, branch `multi-tab`, HEAD `6fcf5d5df` (the prompt's commit), clean at start
- **Executor model**: claude-opus-5-5
- **Phase**: 1, read only. No source file changed; probes only in `~/.jjodel-lanes/P-2026-11-06-2350/`.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

Every claim is tagged **[read]** (a file read in this phase, on HEAD `6fcf5d5df`) or **[measured]** (a run in this phase). Searches use `command grep` (BSD grep, which honours `--include`; CLAUDE.md §5), run from `frontend/src`, excluding `__tests__`.

## 0. Hypothesis and objective

**Hypothesis to falsify**: «the active viewpoint and the canvas sync state are global per project, so two editor instances on the same model cannot show different viewpoints without interfering».

**Verdict: holds, in part.** Detail in §3 and §4; short form:

- **Holds** for the active viewpoint. It is one root value, `state.viewpoint`, plus its persisted twin `project.activeViewpoint`; every editor-v2 reader takes it from the root, by `getActiveLayoutKey()` (no argument), `getLayoutKeyOf(state)`, `computeIRSignature(state)` without the optional id, or a direct read (§1). Two instances mounted today would render the same concrete syntax and the same layout key, whatever each tab wanted.
- **Holds** for five module-level sync registries in `syncState.ts` that one instance's unmount clears for every instance (§3.2).
- **Falsified** for the layout store and the IR index: `layoutByViewpoint` is already a dictionary per viewpoint on the one `DVertex` (R-LAY-14), the pure resolver already takes the key as a parameter (R-LAY-16), and `computeIRSignature` / `getIRIndex` already accept an explicit viewpoint id with a per-viewpoint cache key (R-DMV-1, `irResolveCore.ts:127`, `:187`). The D-layer does not need a new shape (§5).
- **Falsified** for vertices and edges: the DGraph is one per model (`graphStyle === 'v2-flow'`), and the populate effect is idempotent against the store, so a second instance on an already populated model creates nothing (§3.1); the simultaneous first mount is a race declared, not reachable by the gestures that exist (§3.1).

**Objective**: measure what the code needs for R-MT-1..4 (tab owns active viewpoint, pan, zoom, session size; pair (model, viewpoint) owns layout; selection and simulator run shared by model), and plan lanes of five files or fewer.

**Context already decided, not reopened**: R-MT-1..4; R-LAY-19 (2026-08-25), which already sketched «viewpoint di tela»: each `EditorV2` receives its `viewpointId` and exposes it by context, the adapter becomes `getLayoutKeyFor(vpId)`, the project's active viewpoint survives as the viewpoint of the focused canvas, and **«nessun nuovo lettore di `state.viewpoint` nei percorsi di rendering e di scrittura di editor-v2»** from that day (`docs/decisions.md:3397`). This report is the discovery of that slice 2, now on the multi-tab front.

## 1. Active viewpoint census

### 1.1 Writers

Searches: `command grep -rn --include='*.ts' --include='*.tsx' -E "activateViewpoint\b"` and `-E "activeViewpoint"` (38 lines, `examples/` excluded, list in the lane folder `g_activeViewpoint.txt`).

| # | Site | What | Kind |
|---|------|------|------|
| W1 | `utils/lastViewpoint.ts:60` | `SetFieldAction.new(projectId, 'activeViewpoint', viewpointId \|\| null, '', true);` | project field |
| W2 | `utils/lastViewpoint.ts:70` | `SetRootFieldAction.new('viewpoint', viewpointId \|\| null, '', true);` | root |
| W3 | `components/editor-v2/Toolbar.tsx:385` | `activateViewpoint(vpId \|\| null);` (the syntax picker) | caller of W1+W2, inside an editor instance |
| W4 | `components/abstract/tabs/EditorSwitch.tsx:93` | `activateViewpoint(savedVpId);` mount-only, from `localStorage` `jjodel.editorPrefs.<modelid>` | caller of W1+W2, inside an editor instance |
| W5 | `joiner/classes.ts:3540-3546` | `set_activeViewpoint` (L-proxy setter, TRANSACTION + `SetFieldAction`) | **no caller**: `-E "activeViewpoint\s*="` matches only `VersionFixer.tsx:1300` (`e.activeViewpoint = null;`, a raw migration write) |
| W6 | `redux/VersionFixer.tsx:1299-1300` | 2.228 migration, system viewpoint → `null` | load time only |
| W7 | `api/persistance/projects.ts:515` | `pointers.activeViewpoint = raw.activeViewpoint;` | save/load serialization |

[read] R-LAY-11 still holds: `activateViewpoint` (`lastViewpoint.ts:49`) is the only live writer of both values. `NestedView.tsx`, the third writer of R-LAY-10, is gone: deleted in `0494a9cad` (2026-08-30, «via NestedView, UI morta da due censimenti»). Absence: `command grep -rln "NestedView" .` from `frontend/src` returns nothing, exit 0; positive control, same command on `EditorSwitch`, returns `utils/lastViewpoint.ts` and `MetamodelTab.tsx`.

**Two writers, both inside an editor instance (W3, W4), write a global.** W4 is already an interference between tabs of *different* models today: mounting the tab of model B activates B's saved viewpoint for the whole project, so the tab of model A, still mounted in rc-dock, switches syntax under the user. And `EditorSwitch.tsx:101-109` runs in every mounted `EditorSwitch` on every root change:

```
setEditorMode('flow');
if (!isMetamodel) writeEditorPrefs(modelid, { viewpointId: viewpointId || '', editorMode: 'flow' });
```

so a pick in A's toolbar is also written as B's saved preference. [read; not measured on screen, §6]

### 1.2 Readers of the root `state.viewpoint`

Search: `-E "(state|s|st|root|getState\(\))\??\.viewpoint\b"` (42 lines, lane folder `g_state_viewpoint.txt`), plus `-E "getViewpoint\(\)|\[['\"]viewpoint['\"]\]|\{ *viewpoint *\} *= *(store\.getState|state)"` for other spellings (only a definition `selectors.ts:102` and the unrelated `view.tsx:1645` `get_viewpoint`; `Selectors.getViewpoint()` has no caller). Positive control: the same regex counts 3 lines in `EditorSwitch.tsx`.

| # | Site | Verbatim | Where | Could take the tab's viewpoint? |
|---|------|----------|-------|------|
| R1 | `abstract/tabs/EditorSwitch.tsx:55` | `useSelector((state: any) => state.viewpoint)` | editor instance (wrapper) | yes: it becomes the tab's own state |
| R2 | `editor-v2/Toolbar.tsx:297` | `const rawActiveViewpointId = useSelector((state: any) => state.viewpoint) as string;` | editor instance (toolbar picker) | yes, from context |
| R3 | `editor-v2/EditorV2.tsx:4041` | `const vpState ... = (typeof state?.viewpoint === 'string' && lookup[state.viewpoint]?._state) \|\| {};` (ELK auto-layout profile) | editor instance | yes. **Added 2026-10-02 (`803b84e3a`), after R-LAY-19's freeze** |
| R4 | `editor-v2/viewpoint/ir/irResolveCore.ts:128` | `const vp = viewpointId ?? state.viewpoint;` (`computeIRSignature`) | pure core, the activation source R-LAY-16 cites as `:139` (re-measured: now `:128`) | already parametric |
| R5 | `editor-v2/viewpoint/ir/irResolveCore.ts:192` | `const vp = (viewpointId ?? state.viewpoint) as string;` (`getIRIndex`) | pure core | already parametric |
| R6 | `editor-v2/viewpoint/ir/IRForm.tsx:251` | `const vp = viewpointOfHost(host) ?? state?.viewpoint;` | form inside a node / drawer | yes, host first already |
| R7 | `editor-v2/viewpoint/layout/vertexLayoutAdapter.ts:72` | `const vp = state?.viewpoint;` (`getLayoutKeyOf`) | adapter: every layout key | yes, by a new `getLayoutKeyFor(state, vpId)` (R-LAY-19) |
| R8 | `view/viewPoint/metaclassPalette.ts:374` | `const vpId = state?.viewpoint;` (`resolveMetaclassColoring`, called by `nodes/ObjectNode.tsx:44`) | canvas node | yes. **Added 2026-09-30 (`fa0b20de1`), after R-LAY-19's freeze** |
| R9 | `redux/selectors/selectors.ts:104` | `return LPointerTargetable.fromPointer(state.viewpoint);` | global helper | no caller |

R3 and R8 are new readers in editor-v2 rendering paths written after the R-LAY-19 rule «nessun nuovo lettore di `state.viewpoint`»: the rule held in prose, not in a machine. [read, `git blame` on HEAD]

### 1.3 Readers of `project.activeViewpoint`

| # | Site | Verbatim | Where |
|---|------|----------|-------|
| P1 | `redux/selectors/selectors.ts:529` | `let activevpid ... = project.activeViewpoint?.id;` in `updateScores`, under `getAppliedViewsNew` (`:609`) | classic view matching. `getAppliedViewsNew` has **no caller** in `frontend/src` (`-E "getAppliedViews\|AppliedViews"`: only the definition and a comment, `irResolve.ts:7`) |
| P2 | `joiner/classes.ts:1257` | `if (!vp) vp = LProject.getProject()?.activeViewpoint?.id \|\| Defaults.viewpoints[0];` | `DViewElement` constructor: parent viewpoint of a new view |
| P3 | `view/viewElement/view.tsx:444` | `let activeVP ... = LProject.getProject()?.activeViewpoint;` | `newDefault`: parent of a new view |
| P4 | `view/viewElement/view.tsx:991` | `if (!(dproject && dproject.activeViewpoint === c.data.id)) return '';` | classic view getter |
| P5 | `utils/lastViewpoint.ts:144`, `:169` | `hasCreatableViewpoint`, `resolveParentViewpoint` priority 2 | «Create View» gates and parent resolution (Tree View, context menu) |
| P6 | `components/viewParenting/ViewParentingFields.tsx:49` | `const activeViewpointId = LProject.getProject()?.activeViewpoint?.id;` | view-authoring rail: «is this view's viewpoint active» |
| P7 | `utils/globalCssAudit.ts:42` | comment only (`isActive` is computed in `lastViewpoint.ts:99` from the argument) | — |

P2, P3, P5 answer «where does a new view go» and are global by nature; with tabs they should answer «the focused tab's viewpoint» (the R-LAY-19 «tela a fuoco»), which the project value already is if the focused tab keeps writing it (Q2).

### 1.4 Indirect readers (take the root through a function with no viewpoint argument)

`getActiveLayoutKey()` — `-E "getActiveLayoutKey|getLayoutKeyOf"`, 30 lines:

- `editor-v2/EditorV2.tsx:587` (viewport restore), `:3896`, `:3902` (viewport save), `:4110` (auto-layout stored sizes), `:4565`, `:4693` (gesture paths)
- `editor-v2/utils/jjomTransformers.ts:59` (`effectiveLayoutOf`, «EVERY geometry read in this file goes through here»): called by `jjomVertexToRFNode`, i.e. by the sync
- `editor-v2/sync/canvasToJjom.ts:89`, `:105`, `:134`, `:150`, `:164` (every layout write)
- `abstract/tabs/MetamodelTab.tsx:123` (drop on the metamodel tab)

`getLayoutKeyOf(state)` — `viewpoint/ir/useContentSize.ts:157`, `:306`; `viewpoint/ir/useIRContainment.ts:194`; `viewpoint/authoring/SymbolEditorModal.tsx:270`, `:303`.

`computeIRSignature(state)` / `getIRIndex(state, sig)` without the id — `EditorV2.tsx:235`, `:237`, `:1283`, `:1725`, `:1848`, `:3733`, `:4434`; `viewpoint/ir/useIRContainment.ts:76`, `:79`, `:87`, `:95`, `:97`, `:135`, `:158`; `viewpoint/ir/irResolve.ts:50`, `:87`, `:88`, `:99`, `:100`, `:133`, `:136`, `:157`, `:170`, `:171`, `:181`, `:186` (the hooks `useIRView`, `useIRViewpointActive`, `useIRRowView`, consumed by `nodes/ObjectNode.tsx`, `viewpoint/ir/IRRow.tsx`, `SymbolEditorModal.tsx`, `useIRFormView.ts`); `TreeViewSidebar/treeViewScope.ts:104` (global: the Tree View sidebar).

Already explicit (the precedent): `InstanceManagerTab.tsx:1674-1676`, `InstanceDetail.tsx:699-701`, `environment/configurator/ConfiguratorPanel.tsx:99-101` (`DATA_MANAGER_VIEWPOINT_ID`), `viewpoint/ir/useIRFormView.ts:76`, `:102-103`, `:122-123` (`viewpointId` parameter).

### 1.5 Classification by surface (COSA 1)

| Surface | Reads | Inside an instance? | From the tab? |
|---|---|---|---|
| Canvas (nodes, rows, containment, sizes, transformer, write-back) | R4-R8, 1.4 | yes | yes: one context value read by hooks; non-hook modules (`jjomTransformers.ts`, `canvasToJjom.ts`) take the key as a parameter |
| Toolbar picker | R2, W3 | yes | yes |
| Properties rail | P6 | global floating rail, follows the active tab (`EDITOR_TYPE_CHANGE`, `Dock.tsx:387-390`) | yes, if the rail reads the focused tab's viewpoint |
| Symbol Editor | `SymbolEditorModal.tsx:270`, `:303`, `useIRView` | opened from a node | yes, the modal is opened from an instance and can carry its viewpoint |
| Textual tab, Code panel | none found: `codegen/textual/ui/openTextualTab.tsx` is opened by a sentinel option that returns before `activateViewpoint` (`Toolbar.tsx:378-383`) | separate tab | not concerned |
| Validation (problems) | not a reader of the root; see §4.2 | — | — |
| Jjodie preview | see §4.5 | — | — |
| Tree View sidebar | `treeViewScope.ts:104` | global | focused tab's viewpoint |
| New-view parenting | P2, P3, P5 | global | focused tab's viewpoint (= project value, Q2) |

## 2. Tabs and editor instances

### 2.1 How a model tab is created and identified [read]

- `components/abstract/tabs/TabDataMaker.tsx:29-36`: `static model(model)` returns `{ id: model.id, ..., group: 'models', closable: true, content: <ModelTab modelid={model.id} .../> }`; `metamodel` at `:19-25` likewise with `id: model.id`. The tab id **is** the model id. Every other kind is prefixed so that it does not collide with it (`:44-47`: «The id is PREFIXED, unlike `metamodel()` and `model()` which use the bare `model.id`. It has to be: `DockManager.open` activates any tab whose id already exists»).
- `components/abstract/DockManager.tsx:100-106`: «Guard: if a tab with this ID already exists, just activate it» — `DockManager.dock.find(tab.id)` then `updateTab(tab.id, null, true)`. Opening the same model again **raises** the existing tab. `openBeside` (`:204-248`) says the same in its doc: «Never a second instance of the tab».
- The same model cannot be opened twice today. No gesture reaches a second instance.

### 2.2 What breaks if a second tab on the same model is forced (a tab id other than `model.id`)

Every site that equates tab id and model id (search `-E "dock\.find\(|updateTab\("`, 20 lines, plus the `ACTIVE_TAB` listeners):

| Site | Assumption | Effect on a second tab `T2` |
|---|---|---|
| `abstract/Dock.tsx:375-390` | `idlookup[activeId]` resolves the model and fires `EDITOR_TYPE_CHANGE { modelId: activeId }` | activating `T2` fires nothing: the rail, status bar and `body[data-editor-type]` stay on the previous tab |
| `abstract/Dock.tsx:360` | only `dockbox.children[0]` is read | a tab in a split panel (`openBeside`) never drives the panels — true today, not new |
| `abstract/DockManager.tsx:67-75` | `closeTabsForEntity` closes `entityId`, `doc_`, manager | deleting the model leaves `T2` open (it self-closes via `ModelTab.tsx:30`, `useEffect(() => { if (!model) DockManager.closeTabsForEntity(...) })`, which again closes only the bare id) |
| `abstract/DockManager.tsx:222-229` | `openBeside` finds `modelId` | targets the first tab only; acceptable |
| `pages/components/Navbar.tsx:718-724` | `getActiveModelTab()` then `localStorage ... jjodel.showSingletons.${tab.id}` | the singleton toggle reads a key no one writes |
| `codegen/ui/canvasSelection.ts:46`, `:98`, `:132-136` | `dock.find(id)` for the canvas beside a generator | finds the first tab only; acceptable |

So a second tab needs (a) its own id with a recoverable model id (`<modelId>` for the first, `<modelId>~<n>` or similar after it, decoded in one helper), and (b) `Dock.tsx:378` and `Navbar.tsx:723` to decode it. That is one lane, outside the critical zone.

### 2.3 Are inactive tabs mounted? [read]

Yes. `DockManager.tsx:122-125`: «rc-dock lays inactive panes out off-screen inside a clipped container», and nothing sets `cached` or unmounts (`groups` at `Dock.tsx:284-289` is `{floatable, maximizable, tabLocked}` only). Two model tabs are therefore two live `EditorSwitch` + `EditorV2` trees **today**, which is what makes the W4 interference of §1.1 real now and not only with multi-tab.

### 2.4 rc-dock tabs are not persisted [read]

`PinnableDock.load` / `save` (`components/dock/MyRcDock.tsx:677`, `:729`) have no caller outside that file (`command grep -rln -E "PinnableDock\.(load|save)" .` returns only `MyRcDock.tsx`, which is the positive control: the pattern matches its own definitions). `Dock.tsx:34`, `:42` persist only the layout *mode* (`jjodel_layout_mode`). A reload reopens no model tab: there is no tab state to migrate, and «which viewpoint did this tab have» survives a reload only through what the tab writes elsewhere (`localStorage` prefs, `project.activeViewpoint`).

### 2.5 What one EditorV2 instance owns [read]

| Thing | Where | Per instance? |
|---|---|---|
| React Flow store (nodes, edges, viewport) | `EditorV2.tsx:5285` `<ReactFlowProvider>` around `EditorV2Inner` | yes |
| `fitViewOptions` | `viewportInset.ts:76-79` `useFitViewOptions()`, a `useMemo` over the canvas inset | yes (value derived from a global inset) |
| Stored viewport | `EditorV2.tsx:174-194`, key `jjodel.viewport.<modelid>.<layoutKey>`, read once at `:587`, written at `:3896`, `:3902` | key per (model, layout key): two tabs on one model and one viewpoint share it, last writer wins (R-MT-1 says pan/zoom belong to the tab, so this is the default for the next opening, as for the project viewpoint) |
| `EditorContext` | `contexts/EditorContext.tsx:35`, provided at `EditorV2.tsx:5119`, value at `:4894`; already carries `modelId` (`:31-33`) | yes: the natural home of the tab's viewpoint (an optional field, Rule 11) |
| `ActiveEditorProvider` | `editor-v2/ActiveEditorContext.tsx:25-60`, one per `EditorSwitch` (`EditorSwitch.tsx:113`, `:131`) | yes, but it tracks `'flow' \| 'classic'` zoom controllers inside one tab, not focus between tabs. R-LAY-19's «tela a fuoco (`ActiveEditorProvider`)» does not exist at that level: focus between tabs is rc-dock's `activeId` (`Dock.tsx:361`) |
| Sync refs (`rfNodeCache`, `rfEdgeCache`, `prevElementsRef`, open gate) | `hooks/useJjomSync.ts:300-320`, `:514-515` | yes |
| Sync registries | `sync/syncState.ts` | **no**, module level (§3.2) |
| Editor prefs (`viewpointId`, `editorMode`) | `EditorSwitch.tsx:22-37`, key `jjodel.editorPrefs.<modelid>` | per model, written by every mounted instance (§1.1) |
| Highlight, singletons, notation, scheme, grid, minimap toggles | `EditorV2.tsx:734-1121` localStorage | per model or global; shared by two tabs of one model, which R-MT does not contradict |

### 2.6 Where the per-tab viewpoint lives

Two candidates, measured against what exists:

- **React state of the tab, exposed by `EditorContext`** (plus a prop on `EditorV2`). Matches R-LAY-19's «ogni `EditorV2` riceve il suo `viewpointId` e lo espone per context», the per-instance `ReactFlowProvider`, and the fact that tabs are not persisted (§2.4), so a Redux slice keyed by tab id would hold ids that die at every reload. Non-hook modules (`jjomTransformers.ts`, `canvasToJjom.ts`, the adapter) take the key as a parameter; hooks read the context. Selectors that need it close over it (`useSelector(s => getLayoutKeyFor(s, vpId))`).
- **Redux root keyed by tab id**: gives global readers (Tree View, rail, new-view parenting) a way to ask «the focused tab's viewpoint», but they can already get it from the project value if the focused tab keeps writing it (Q2), and it adds persisted state for something R-MT-1 calls tab state. Not recommended (Q1).

## 3. Sync and critical zone (read only)

### 3.1 One DGraph per model, populate idempotent against the store [read]

- `hooks/useJjomSync.ts:359-372`: the graph is found by `dGraphs.find(g => g?.model === modelid && (g as any).graphStyle === 'v2-flow')`. One graph per model, whatever the viewpoint. The per-viewpoint part is the dictionary `layoutByViewpoint` on each `DVertex` (R-LAY-14) and the edge layout fields; vertices and edges are not per viewpoint.
- The populate effect (`:517-1140`) is declared «IDEMPOTENT: it checks existing graph elements and only creates what's missing» (`:529`), reads the store fresh (`const idlookup = store.getState()?.idlookup;`, `:537`), and returns early when nothing is missing (`:761-765`). A second instance mounted on a model the first has already populated finds nothing missing and **creates nothing**.
- Its guard against re-entry is per instance: `const creatingGraphRef = useRef(false);` (`:514`), `if (!modelid || creatingGraphRef.current) return;` (`:518`), lowered by `setTimeout(() => { creatingGraphRef.current = false; }, 150);` (`:1138`). Two instances that both see `!hasGraph` in the same commit would each run `DGraph.new(0, modelid)` (`:780`). Reachable only if two tabs of one never-opened model mount in the same commit; no gesture does that (tabs open one at a time and are not restored at reload, §2.4). Declared, not measured.
- M2 reference edges (Step 3) use the composite key and `existingEdgeKeys`, built from the fresh `idlookup` plus **this instance's** `rfEdgeCache` (`:648`). M1 reference edges (`useM1ReferenceEdges.ts:148`) use `existingKeys.has(ek) || hasCanvasEdgePair(ek)`, and `hasCanvasEdgePair` reads the module-level set, so a pair minted by instance A (`markCanvasEdgePair`, `:177`) is seen by instance B: for M1 the global set is what keeps two instances from minting the same edge twice. For M2 there is no such cross-instance mark (Rule 13 forbids the pair guard there). Whether instance B's Step 3, running in the same commit as A's after a D-first reference creation, can see A's `DVoidEdge.new2` in the fresh `idlookup` depends on that creator committing synchronously outside an outer TRANSACTION. **Not measured**: it is the first check of the first critical-zone lane (§7, L4), with Families.ecore and two tabs on the metamodel.

### 3.2 Module-level registries in `sync/syncState.ts` [read]

| Registry | Lines | Keyed by | Two instances |
|---|---|---|---|
| `syncModes` | `:14` | node id | shared; harmless (drag strategy per node) |
| `dropCreatedIds` | `:37` | node id | consumed once (`consumeDropCreated`, `useJjomSync.ts:1327`): the dropping instance consumes it, the other instance treats the vertex as a normal addition, which is what it should do |
| `edgeRefIds` | `:59` | edge id → DReference id | shared, same values for every instance (the edge is one); fine while alive |
| `canvasUpdatedIds` (anti-bounce) | `:81` | element id, 300 ms window | shared: a drag in A marks the id, B's incremental sync skips it and schedules one re-run after the window (`useJjomSync.ts:1408-1412`, `:1503-1509`, `ANTI_BOUNCE_RERUN_MS`). R-MT-4 «a drag in one moves the node in the other» holds, with a lag of about 350 ms in B. Acceptable; it is what a mirrored drag costs |
| `canvasEdgePairs` | `:129` | `src→tgt` pair, **no viewpoint, no model** | shared, and correct to share: edges are one per model, not per viewpoint |
| `suppressedSingletonIds` | `:159` | vertex id | shared; written by `EditorV2.tsx:926`, `:1001`, `:1028`, cleared by `:1036` |

**Unmount clears every instance's registry.** `useJjomSync.ts:1620-1637`:

```
clearAllCanvasUpdated();
clearSyncModes();
clearDropCreated();
clearEdgeRefIds();
clearCanvasEdgePairs();
```

Closing tab B wipes `edgeRefIds` and `canvasEdgePairs` for tab A, and for every other model's tab, because nothing is keyed by model. This is already true today across tabs of different models (both mounted, §2.3); multi-tab makes it the common case. The consequence of a wiped `canvasEdgePairs` is the race window of CLAUDE.md §3.4 reopening for A until A's next sync; of a wiped `edgeRefIds`, `getEdgeRefId` returning `undefined` for A's edges until something reloads them. Fix shape: reference-count the registries (clear when the last instance unmounts) or key them by model id. Critical zone (`syncState.ts`, `useJjomSync.ts`).

### 3.3 Where the sync reads the layout key [read, counted]

Count per file of `-E "viewpoint|LayoutKey|layoutByViewpoint|irSig|computeIRSignature"` (positive control: `sync/canvasToJjom.ts` 11):

| File | Count | Reads the key? |
|---|---|---|
| `hooks/useJjomSync.ts` | 0 | not directly; through `jjomVertexToRFNode` → `jjomTransformers.ts:59` |
| `hooks/useM1ReferenceEdges.ts` | 0 | no |
| `sync/vertexSnapshot.ts` | 0 | no (content hash, `vertexChildrenHash`, `:163`) |
| `sync/canvasToJjom.ts` | 11 | yes, `getActiveLayoutKey()` at `:89`, `:105`, `:134`, `:150`, `:164` |
| `utils/jjomTransformers.ts` | 7 | yes, `effectiveLayoutOf` `:58-60`: `return readVertexLayout((raw ?? {}) as VertexLayoutSource, getActiveLayoutKey());` |
| `utils/portDistribution.ts` | 0 | no (works on RF geometry of its instance; `overflowWarnedNodes`, `:288`, is warn-once only) |
| `utils/handlePosition.ts` | 0 | no |
| `viewpoint/ir/useContentSize.ts` | 7 | yes, `getLayoutKeyOf(s)` at `:157`, `:306` |
| `nodes/nodeSizing.ts` | 3 | no: the three hits are an import of `ShapeForm`, `shapeRegistry`, and a comment (`:6`, `:7`, `:35`) |

So the key enters the canvas through three doors: the transformer (read), the write-back (write), and the content-size hook (read). Each must take the tab's key. `portDistribution.ts` and `handlePosition.ts` need no change: they see only the RF nodes of their own instance.

### 3.4 A switch of layout key without a vertex change does not re-run the incremental sync [read]

The incremental effect's deps are `[isJjomMode, elementSnapshots, subElementIds, scheduleFlush, antiBounceTick]` (`useJjomSync.ts:1617`), and each vertex is skipped when `const unchanged = prevD === dElement && prevModel === currModel && currHash === prevHash;` (`:1406`, `:1414`). None of these moves when only the layout key moves. R-LAY-18 (2026-08-24) recorded that positions followed a layout change thanks to `Date.now()` in the deps and `prevModel = {}`, and that «chi li rimuove deve sostituirli con una ripropagazione progettata». `242a82bcd` (2026-10-21, P-2026-10-21-0335) removed both («prevModel is the real previous entry (the `= {}` override is gone); Date.now() out of the effect deps»), and its discovery left the question open: `docs/discovery/discovery_2026-10-21_jjomsync_incremental.md:221-223`, «Whether a run of the sync without `Date.now()` misses the first render after a viewpoint switch that changes `graphInfo` but not `elementSnapshots`: the vp row refreshed (2038 reads = no run)».

Hypothesis, **not measured** (no dev server, §6): on today's trunk, switching between two exclusive viewpoints with different records may leave nodes at the previous key's positions until a vertex changes. Whether or not it is live today, multi-tab needs the layout key as an explicit input of the incremental sync (a dep, and a re-transform of every vertex when it changes), because a per-tab key changes nothing in the store. This belongs to the first critical-zone lane (L3), and the probe of today's behaviour is a ticket candidate of its own (Q9).

### 3.5 Session sizes [read]

`useContentSize.ts:120-128`: the content-driven size «is written in session only, on the same channel the size propagation uses (top-level width/height with `measured` reset). Nothing reaches the D-layer». It writes through `useReactFlow()` (`:153`), i.e. into the instance's own RF store: **already per tab**, as R-MT-1 wants. One shared piece: `const cascadeWrites = new Map<string, number>();` (`:99`), a per-vertex cap of `MAX_WRITES_PER_CASCADE = 3` (`:98`) counted at module level. Two tabs that show the same vertex with different contents and re-measure in the same synchronous cascade spend one budget: a legitimate settle needs two writes (`:96`), two tabs need four, and the second tab yields with a console warning. Key it by (instance, vertex) in the lane that threads the key through this hook.

### 3.6 Critical-zone files a Phase 2 touches (CLAUDE.md §3.1, §3.2)

| File | §3.1 | §3.2 trigger (LIR owed) | Why |
|---|---|---|---|
| `components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` | in `viewpoint/` subtree (authoring/ir siblings) | no (not in the six) | `getLayoutKeyFor(state, vpId)` beside `getLayoutKeyOf` |
| `components/editor-v2/utils/jjomTransformers.ts` | not listed | no | key as parameter of `effectiveLayoutOf` and its callers |
| `components/editor-v2/sync/canvasToJjom.ts` | yes | **yes** | key as parameter of the five layout writes |
| `components/editor-v2/hooks/useJjomSync.ts` | yes | **yes** | key into the transformer call, key as dep of the incremental sync (§3.4), registry lifecycle (§3.2) |
| `components/editor-v2/sync/syncState.ts` | yes | **yes** | reference-counted or model-keyed clearing |
| `components/editor-v2/viewpoint/ir/useContentSize.ts` | in `viewpoint/ir/` | no | tab key, `cascadeWrites` per instance |
| `components/editor-v2/viewpoint/ir/irResolve.ts`, `useIRContainment.ts`, `IRForm.tsx` | `viewpoint/ir/` | no | explicit viewpoint into `computeIRSignature` / `getIRIndex` |
| `components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` | `viewpoint/authoring/` | no | tab key |
| `components/editor-v2/hooks/useM1ReferenceEdges.ts` | yes | yes if touched | **not** expected to change: no key read, the shared pair set is correct |
| `utils/portDistribution.ts`, `utils/handlePosition.ts` | yes / cross-ref | — | not expected to change |
| `redux/VersionFixer.tsx`, `utils/defaultViewTemplate.ts`, `common/DV.tsx` | yes | — | not expected to change (§5) |

The Layer Impact Report is owed by the lanes that touch `useJjomSync.ts`, `syncState.ts` or `canvasToJjom.ts`, not by this one.
