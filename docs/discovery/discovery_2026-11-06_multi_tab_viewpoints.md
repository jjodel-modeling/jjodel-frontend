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
