# Discovery — persistence of active viewpoint + editor view mode across model/project reopen

**Date**: 2026-06-10
**Type**: discovery, READ-ONLY (no source modified, no commit)
**Branch**: `alfonso-frontend-jjtl`
**Scope**: map where the *selected viewpoint* and the *editor view mode* (flow / classic / split) live, how they initialise on open, and what persistence already exists.

---

## TL;DR (the key finding)

There are **two independent pieces of state** with **opposite persistence stories**:

| State | Lives in | Persists across project reopen? | Persists per-model? |
|-------|----------|-------------------------------|--------------------|
| **Selected viewpoint** | redux **root `state.viewpoint`** (singular) *and* **`project.activeViewpoint`** (D field), written together by `activateViewpoint()` | **YES — incidentally.** Both are inside the full-DState snapshot serialised by `compressedState` and restored by `LoadAction`. Not an explicit "restore" feature; a side effect of snapshotting the whole store. | **No.** `state.viewpoint` is a single project-global root scalar; `project.activeViewpoint` is one field on the project. There is no per-model viewpoint memory. |
| **Editor view mode** (`flow`/`classic`/`split`) | **React local `useState` in `EditorSwitch`** (`EditorSwitch.tsx:30`) | **NO.** Never serialised anywhere. Starts at `'flow'` on every mount, and is force-reset to `'flow'` whenever the viewpoint changes (`EditorSwitch.tsx:35-37`). | It is per-`EditorSwitch`-instance (one per model tab) while mounted, but lost on remount/reopen. |

So the suspicion in the brief ("partial persistence for the viewpoint") resolves to: **the viewpoint *selection* does come back on reopen (project-global), but the *view mode* is always lost, and there is no per-model scoping for either.** That combination is what reads as "partial".

`editorMode` is declared and initialised at **`frontend/src/components/abstract/tabs/EditorSwitch.tsx:30`** (`useState<EditorViewMode>('flow')`).

---

## Q1 — `editorMode` lifecycle

- **Declaration / initial value**: `EditorSwitch.tsx:30` — `const [editorMode, setEditorMode] = useState<EditorViewMode>('flow');`. Type `'flow' | 'classic' | 'split'` (`EditorSwitch.tsx:9`). Initial value is the hard-coded literal `'flow'`.
- **Kind of state**: plain **React local `useState`**. Not Redux, not context, not localStorage.
- **Who sets it**: the three toolbar buttons. `EditorSwitch` passes `setEditorMode` down as `onEditorModeChange` (`EditorSwitch.tsx:60`) → `EditorV2` forwards it to `Toolbar` (`EditorV2.tsx:267` prop, `Toolbar.tsx:168`) → the buttons call it:
  - flow → `Toolbar.tsx:453` `onClick={() => onEditorModeChange?.('flow')}` (`bi bi-diagram-3`)
  - classic → `Toolbar.tsx:463` `onClick={() => onEditorModeChange?.('classic')}` (`bi bi-eye`)
  - split → `Toolbar.tsx:473` `onClick={() => onEditorModeChange?.('split')}` (`bi bi-layout-split`)
  - The toggle group is `Toolbar.tsx:442-479`; disabled when no viewpoint (`modeToggleDisabled`), and additionally `layoutDisabled = editorMode === 'classic'` (`Toolbar.tsx:178`).
- **Keying / reset semantics**:
  - **Not keyed per model.** A fresh `EditorSwitch` is mounted per tab (`ModelTab.tsx:43` `<EditorSwitch modelid={model.id}>`, `MetamodelTab.tsx:183`), so each model tab carries its own `editorMode` instance while mounted, but the value is never stored — it resets to `'flow'` on every mount.
  - **Force-reset on viewpoint change**: `EditorSwitch.tsx:35-37`
    ```ts
    useEffect(() => { setEditorMode('flow'); }, [viewpointId]);
    ```
    Because `viewpointId` comes from `state.viewpoint` (`EditorSwitch.tsx:27`), this effect *also fires on the initial mount* (and again when a restored viewpoint is hydrated `'' → vpId`), so even when the viewpoint is restored on reopen, the mode is clobbered back to `flow`.
  - The `[editorMode]` dependency at `EditorV2.tsx:808` is unrelated to persistence (a `selectstart` listener re-bind).

**Conclusion Q1**: single ephemeral React value, default `'flow'`, no persistence, reset on viewpoint change and on remount.

---

## Q2 — viewpoint selection lifecycle

- **Where the dropdown reads its value**: `Toolbar.tsx:186`
  ```ts
  const activeViewpointId = useSelector((state: any) => state.viewpoint) as string;   // ROOT scalar, not project.activeViewpoint
  const viewpointPointers = useSelector((state: any) => state.viewpoints) as string[]; // ROOT array = dropdown options
  ```
  The `<select value={activeViewpointId || ''}>` is `Toolbar.tsx:419`; options from `state.viewpoints` mapped at `Toolbar.tsx:188-193`.
- **What `onChange` calls**: `handleViewpointChange` (`Toolbar.tsx:195-197`) → `activateViewpoint(vpId || null)` (imported `Toolbar.tsx:9` from `utils/lastViewpoint`).
- **What `activateViewpoint` does** (`utils/lastViewpoint.ts:46-57`) — **dual write, no TRANSACTION**:
  1. `SetFieldAction.new(projectId, 'activeViewpoint', viewpointId, '', true)` → persists into `project.activeViewpoint` (the D field). *(used by the classic renderer)*
  2. `SetRootFieldAction.new('viewpoint', viewpointId || '', '', true)` → sets root `state.viewpoint`. *(used by the toolbar dropdown + `EditorSwitch`)*
- **Two distinct source-of-truth consumers** (this is the architectural crux):
  - **flow side / toolbar / mode toggle** read root `state.viewpoint`: `Toolbar.tsx:186`, `EditorSwitch.tsx:27`, `selectors.ts:104` (`LProject.getViewpoint()`).
  - **classic renderer / tree highlight** read `project.activeViewpoint`: `NestedView.tsx:82,544` (`mapStateToProps … ret.active = ret.project.activeViewpoint`), `selectors.ts:529` (view-score computation), `TreeViewContent.tsx:1869` (active-VP highlight), `EdgeOverlay.tsx:187`.
  - The dual-write in `activateViewpoint` exists precisely to keep these two in sync; its docstring (`lastViewpoint.ts:36-43`) says so explicitly.
- **The only writers of root `state.viewpoint`**: `utils/lastViewpoint.ts:56` (the dropdown path) — there is **no mount-time / open-model effect that hydrates `state.viewpoint` from `project.activeViewpoint`.** (`view.tsx:1731` writes the *plural* `state.viewpoints` on VP creation, not the singular.) Default value is `''` (`store.tsx:165`).
- **The only writers of `project.activeViewpoint`**: `activateViewpoint` (`lastViewpoint.ts:52`), the L-setter `set_activeViewpoint` (`classes.ts:3371-3377`), and `NestedView.tsx:111,315` (`project.activeViewpoint = ptr`). Getter falls back to `Defaults.viewpoints[0]` (`classes.ts:3368-3370`).
- **Is `project.activeViewpoint` in the saved payload?** **YES, twice over:**
  - It is a normal D field on `DProject` (`classes.ts:2933`, `2958`), so it lives in `idlookup` and is captured by the full-state snapshot (below).
  - The online dashboard list path also carries it explicitly: `projects.ts:338` `pointers.activeViewpoint = raw.activeViewpoint`.
- **The decisive persistence mechanism (save → reopen of a project into the editor):**
  - **Save**: `ProjectsApi.save` (`projects.ts:94-117`) → `state = await U.compressedState(dProject)` (`projects.ts:107`). `compressedState` (`U.tsx:427-441`) takes **`{...store.getState()}` — the ENTIRE DState** (all root scalars, including `viewpoint` and `viewpoints`), prunes other projects from `idlookup`, then `JSON.stringify` + compress. **Therefore root `state.viewpoint` is serialised into `project.state`.**
  - **Open**: reducer init `projects.ts`/`reducer.ts:1546` `state = JSON.parse(await U.decompressState(project.state))` → `SaveManager.load(state, project)` (`reducer.ts:1552`) → `VersionFixer.update(save)` → `LoadAction.new(save)` (`SaveManager.ts:56-57`). `LoadAction` **replaces the whole store** with the snapshot, so root `state.viewpoint` is restored to whatever it was at save time.
  - **VersionFixer treatment of the restored value** (`VersionFixer.tsx`): the root-pointer scrub list `rootPointers` (`VersionFixer.tsx:294-323`) includes `"viewpoints"` (plural) but **NOT `"viewpoint"` (singular)**. The generic `deepReplace` pass (`VersionFixer.tsx:209-245`) will null out *any* invalid pointer, so `state.viewpoint` survives **iff** it still points to a live entity, and is dropped to `undefined` if it points to a deleted viewpoint. (Relevant to the deleted-viewpoint fallback in Q5.)
- **So what actually shows in the dropdown on reopen?**
  - If the project was last **saved while a viewpoint was active**, live `state.viewpoint = vpId` → snapshot → restored → dropdown shows it, `EditorSwitch.hasViewpoint = true`, classic/split available again.
  - If it was saved in metamodel/flow with no VP, `state.viewpoint = ''` → "No viewpoint".
  - This is why the brief's "Known: `state.viewpoint` can be `''` at project init" holds for *new/never-saved* projects (`DState.new()` default, `store.tsx:165`; `U.resetState` `U.tsx:446-449`) but **not** for a saved project that had a VP active.

**Conclusion Q2**: the viewpoint selection is **already restored on project reopen** through the full-state snapshot (root `state.viewpoint`) and independently through `project.activeViewpoint`. There is **no explicit per-open hydration code** — it rides the generic whole-store load. It is **project-global**, never per-model, and the dropdown reads the root scalar, not `project.activeViewpoint`.

---

## Q3 — inventory of existing persistence channels

### 3a — localStorage (all keys found)

`grep -rn "localStorage" frontend/src/`. Inventory of keys relevant to "remembered choices":

| Key | Shape | Scope | Read | Write |
|-----|-------|-------|------|-------|
| `jjodel.highlight.${modelid}` | JSON `{id:colorIdx}` | **per-model** | `EditorV2.tsx:460` | `EditorV2.tsx:467` |
| `jjodel.showSingletons.${modelid}` | `'true'`/absent | **per-model** | `EditorV2.tsx:656` | (paired writer in EditorV2) |
| `jjodel.highlightMode` | `'true'` | global | `EditorV2.tsx:457` | — |
| `jjodel.showGrid` / `jjodel.showEdgeLabels` / `jjodel.showBackground` | bool string | global | `EditorV2.tsx:509/512/515` | — |
| `editor-v2-notation` | enum string | global | `EditorV2.tsx:730` | `EditorV2.tsx:735` |
| `editor-v2-color-scheme` | enum string | global | `EditorV2.tsx:758` | `EditorV2.tsx:766` |
| `jjodel.customPalettes` | JSON | global | `EditorV2.tsx:742` | `EditorV2.tsx:749` |
| `jjodel.interfaceMode` | `'basic'`/`'advanced'` | global/user | `ProfileSection.tsx:368` (write) + `useInterfaceMode` | |
| Jodie `mode` / `codeFlavor` | string | per-console | `Jodie.tsx:45` | `Jodie.tsx:53` |
| AI provider prefs (`AI.STORAGE_PREFIX${feature}`, global default, configs) | JSON | global/user | `types/jodie.ts:408-704` | same |
| Toast prefs `jjodel-toast-preferences` | JSON | global | `toastTypes.ts:84/91` | |
| Dock: `jjodel_layout_mode`, `jjodel_dock_ratio_${mode}`, `jjodel_vertical_console_height` | string | global | `Dock.tsx:34/42/83/90/153/160` | |
| Panels: TreeView visible (`TreeViewPanelContext.tsx:72/93`), Features panel expand (`FeaturesPanelContext.tsx:35/46`), Properties width/visible (`PropertiesWithTreeView.tsx:44/79/87/94`) | string/bool | global | as cited | |
| Console footer height / language (`Console.tsx:339/343/364/370`) | string | global | | |
| `debug` (`classes.ts:687`), `_jjRecent` (`reducer.ts:1577`, recent projects) | misc | global | | |

**Decisive precedent**: per-model UI preferences are an *established idiom* keyed `jjodel.<pref>.${modelid}`, and the design intent is documented in-line at **`EditorV2.tsx:450-455`**:
> "…persistita in localStorage **keyed per modello; NON viaggia col file di progetto**…"

i.e. per-model view preferences are deliberately kept **out** of the project file and in localStorage.

### 3b — project Redux state persisted via save

- **What survives**: the **entire DState** is snapshotted (`U.compressedState`, `U.tsx:429` `{...store.getState()}`), so *every* top-level root scalar/array (`models`, `graphs`, `viewpoints`, **`viewpoint`**, `objects`, `values`, …; `store.tsx:115-171`) is serialised, except other projects' `DProject` entries are pruned from `idlookup` (`U.tsx:433`) and `state.projects` is reduced to `[id]` (`U.tsx:438`). On load the whole thing is reinstated via `LoadAction` (`SaveManager.ts:57`).
- **Is `project.activeViewpoint` among them?** Yes — both as a D field in `idlookup` and (online list) as an explicit pointer (`projects.ts:338`).
- **Is root `state.viewpoint` among them?** **Yes** — it is a DState root scalar and is captured verbatim by the snapshot. (Not listed in VersionFixer's `rootPointers` scrub, so only nulled if it dangles — see Q2 / Q5.)
- **Other "view preference"-like fields already persisted this way**: yes, abundantly — node positions/sizes, edge routing & bend points (`DVoidEdge`/`DEdgePoint` subtree), all view `jsxString`, etc. all live in `idlookup` and travel with the file. Canvas zoom/pan is *not* in this snapshot (it is ReactFlow-local / ephemeral).
- **Note**: because the snapshot is *whole-store*, persisting a new field via Redux root or via a D field is "free" w.r.t. the save path — but it makes the value **project-global and collaborative** (shared with every collaborator and every model in the project), which is exactly what the `EditorV2.tsx:450-455` comment warns against for per-model UI prefs.

### 3c — user settings / backend

- AI/provider settings and Jodie config persist in **localStorage** only (`types/jodie.ts` throughout; `ProviderSettings.tsx:73` "API keys are stored in browser localStorage"). Interface mode (`jjodel.interfaceMode`) likewise.
- The project backend (`U.env('JODEL_PERSISTANCE')/project`) stores the compressed project state blob (`Online.save`, `projects.ts:370-389`); there is **no per-user, per-model preferences endpoint**. So a backend channel is global-per-user at best and would require new API surface — not idiomatic here.

### 3d — `utils/lastViewpoint.ts` in full

- It is **not** a restore-on-open mechanism despite the name. It contains:
  - `lastEditedViewpointId/Name` module-level vars + `setLastEditedViewpoint` / `getLastEditedViewpointId` / `clearLastEditedViewpoint` (`:12-31`) — an **in-memory** (non-persistent) "where to create the next view" hint for context menus. **`setLastEditedViewpoint` has no caller** in `frontend/src` (only its own definition), so this tracker is currently dormant/write-less.
  - `activateViewpoint(viewpointId)` (`:46-57`) — the dual-write described in Q2. This is the *write* path, not a *restore* path.
  - `resolveParentViewpoint` (`:64-95`) and `createBlankViewInViewpoint` / `createViewInWorkbench` (`:107-217`) — view-creation helpers.
- **Why it doesn't give the desired behaviour**: it has no on-mount read of any persisted preference and the in-memory tracker is module-scoped (lost on reload) and unused. The only thing that "restores" the viewpoint today is the generic whole-store snapshot (Q2), not this file.

### Comparison table (Q3 synthesis)

| Channel | Scope granularity | Survives browser/device change | Collaborative side effects | Precedent for view preferences | Suitability for this feature |
|---------|------------------|-------------------------------|----------------------------|-------------------------------|------------------------------|
| **localStorage per-model** (`jjodel.X.${modelid}`) | **per-model** (or global) | No | **None** (local only) | **Strong & explicit** (`EditorV2.tsx:450-455`; highlight, showSingletons) | **Best fit** — matches the documented "per-model UI pref, doesn't travel with the file" idiom; ideal for `editorMode`, good for per-model viewpoint memory |
| **project Redux snapshot** (root `state.viewpoint` / `project.activeViewpoint`) | project-global only | Yes (in the file) | **Yes** (shared with collaborators & every model) | Exists for the viewpoint already (incidental) | OK for viewpoint *if* project-global is acceptable; cannot express per-model; cannot host `editorMode` cleanly (not a D field) |
| user/backend settings | global-per-user | Yes | Per-user global | localStorage-backed today; no per-model endpoint | Poor — no per-model granularity, new API needed |
| `lastViewpoint.ts` in-memory tracker | session-only | No | None | N/A (dormant) | Not a persistence channel |

---

## Q4 — scoping

- **Viewpoint is conceptually project-global today.** The selection lives in a single root scalar `state.viewpoint` (`store.tsx:165`) and one `project.activeViewpoint` field. Switching the viewpoint while model A is open changes the same global field, so model B's editor (and the classic renderer, tree highlight) sees the new viewpoint too. There is no per-model viewpoint storage. (The *classic view* will still only render `DViewElement`s whose OCL/`appliableTo` match the open model's elements, but the *selected* viewpoint is shared.)
- **`editorMode` is per-`EditorSwitch`-instance.** Each model/metamodel tab renders its own `<EditorSwitch>` (`ModelTab.tsx:43`, `MetamodelTab.tsx:183`), so two open model tabs have independent `editorMode` values **while both are mounted**. Whether switching tabs preserves the value depends on rc-dock mount behaviour (`MyRcDock.tsx`): inactive tabs are generally unmounted unless cached, so switching away and back typically **remounts `EditorSwitch` → `editorMode` resets to `'flow'`**. On a full project reopen everything remounts fresh → `'flow'`. Net: `editorMode` is effectively "current session, current mount" only.
- Metamodels never participate: `EditorSwitch` short-circuits to flow-only when `isMetamodel` (`EditorSwitch.tsx:17,26,28,39-48`).

---

## Q5 — proposal sketch (NOT to be implemented now)

### Recommended channel

**localStorage, keyed per model** — it matches the existing, explicitly-documented idiom (`EditorV2.tsx:450-455`; `jjodel.highlight.${modelid}`, `jjodel.showSingletons.${modelid}`) and keeps these UI preferences *out* of the collaborative project file. This is the right home for **`editorMode`** unconditionally, and the cleanest home for **per-model viewpoint memory** if per-model granularity is wanted.

Two sub-decisions, with trade-offs:

1. **`editorMode`** → **localStorage `jjodel.editorMode.${modelid}`** (no alternative is comparable; it isn't a D field and shouldn't be collaborative). *Recommended, unambiguous.*
2. **Viewpoint** → two genuinely comparable options:
   - **(a) Do nothing structural for project reopen** — it already persists project-globally via the snapshot + `project.activeViewpoint` (Q2). *Trade-off*: zero code, but it stays project-global (model A and B share it) and relies on the incidental snapshot.
   - **(b) Add per-model viewpoint memory** via localStorage `jjodel.viewpoint.${modelid}`, hydrated on mount by calling the existing `activateViewpoint(savedId)`. *Trade-off*: a few lines, gives true per-model recall and decouples from "was a VP active at save time", at the cost of a second source of truth that must defer to the snapshot/`project.activeViewpoint` as fallback.
   - **Recommendation**: if the goal is literally "restore what model X showed", choose **(b)**; if "remember the project's last viewpoint" is enough, **(a)** is already done and only `editorMode` needs work.

### Minimal intervention (per-model, localStorage) — sketch only

Owner component: **`EditorSwitch.tsx`** (it already holds `editorMode` and subscribes to `state.viewpoint`; it knows `modelid`). No critical-zone file is touched.

- **Read / hydrate (on mount)** in `EditorSwitch`:
  - `editorMode` initial value via lazy `useState` initializer: `localStorage.getItem('jjodel.editorMode.${modelid}')`, validated against `'flow'|'classic'|'split'`, default `'flow'`.
  - (option b) viewpoint: on first mount, read `jjodel.viewpoint.${modelid}`; **validate** it exists in `state.viewpoints` (the scrubbed list) before trusting; if valid and different from current `state.viewpoint`, call `activateViewpoint(savedId)`. Otherwise leave the snapshot/`project.activeViewpoint`-restored value alone.
- **Write points**:
  - mode change: wrap `setEditorMode` so it also `localStorage.setItem('jjodel.editorMode.${modelid}', mode)` (the call sites are the three buttons via `onEditorModeChange`).
  - viewpoint change (option b): persist `jjodel.viewpoint.${modelid}` on `viewpointId` change. The existing `useEffect([viewpointId])` (`EditorSwitch.tsx:35-37`) is the natural spot, *but* it currently force-resets `editorMode` to `'flow'` — see the reconciliation below.
- **Reconcile the reset-on-change effect** (`EditorSwitch.tsx:35-37`): it fires on initial mount too and would clobber a hydrated `editorMode`. Guard the *first* run with a `useRef(true)` "didMount" flag so hydration wins on mount, while a genuine user-initiated viewpoint change still resets to `'flow'` (or, if per-VP memory is desired, restores that VP's saved mode).
- **Fallback when the saved `viewpointId` no longer exists (deleted viewpoint)**: validate against `state.viewpoints` (which VersionFixer *does* scrub, `VersionFixer.tsx:322`) before calling `activateViewpoint`. Note root `state.viewpoint` is **not** in the scrub list, so a stale singular pointer can survive (`VersionFixer.tsx:294-323`); the validation step protects both `EditorSwitch.hasViewpoint` and the dropdown from a dangling id. On miss: clear to `''`/no-viewpoint → flow mode.
- **Does `project.activeViewpoint` need touching?** **No.** Hydration only needs to call the existing `activateViewpoint(savedId)`, which already writes both `project.activeViewpoint` and root `state.viewpoint` with the correct (no-TRANSACTION) action pattern (`lastViewpoint.ts:46-57`). No new write into project state, no serializer change.
- **No VersionFixer migration required**: nothing here modifies default-view source (`DV.tsx`, `defaultViewTemplate.ts`) or any persisted `jsxString`. localStorage is schema-free and the only Redux call reuses the existing `activateViewpoint` path.

### Layer Impact Report

Strictly **not required** — no candidate touch point is in or adjacent to a critical-zone file (`useJjomSync.ts`, `VersionFixer.tsx`, `DV.tsx`, `defaultViewTemplate.ts`, `portDistribution.ts`, `canvasToJjom.ts`). For completeness:

```
LAYER IMPACT REPORT (candidate intervention: EditorSwitch.tsx + a localStorage helper; reuse activateViewpoint)

Layers touched:
  [ ] D-layer (Redux raw data)       — only via existing activateViewpoint → SetFieldAction(project.activeViewpoint)
  [ ] L-layer (computed proxies)     — none
  [ ] JjOM                           — none
  [ ] Canvas v2-flow                 — none (editorMode is layout-only, already a prop)
  [ ] Canvas classic                 — none (reads project.activeViewpoint, unchanged)
  [ ] Sync layer (useJjomSync)       — NONE (no sync-adjacent code; no TRANSACTION introduced)
  [ ] Persistence                    — localStorage only; NO jsxString / VersionFixer change → no migration

  - What changes: EditorSwitch hydrates editorMode (and optionally viewpoint) from localStorage on mount;
    writes localStorage on change; guards the existing reset effect with a didMount ref.
  - What does NOT change: activateViewpoint internals, project serializer, default-view source, sync hooks.
  - Cross-layer interaction: hydration calls the existing root+project dual-write; no new field, no new action type.
  - Side-effect safety: activateViewpoint is already non-TRANSACTION and used live by the dropdown; reusing it is safe.

Smoke-test scenarios potentially affected:
  - open saved project that had a VP active → dropdown shows it (already true today) + mode restored (new)
  - switch model tab A→B→A → editorMode restored per model (new)
  - delete the saved viewpoint, reopen → falls back to no-viewpoint/flow without dangling selection
  - metamodel tab → still flow-only (isMetamodel short-circuit unaffected)
```

---

## File:line index (for the next session)

- `EditorSwitch.tsx:9` mode type · `:27` reads `state.viewpoint` · `:30` `editorMode` state init `'flow'` · `:35-37` reset-on-change effect · `:55-61` passes `editorMode`/`onEditorModeChange` to `EditorV2`
- `Toolbar.tsx:186-187` dropdown reads root `state.viewpoint`/`state.viewpoints` · `:195-197` onChange → `activateViewpoint` · `:442-479` 3-button mode toggle
- `utils/lastViewpoint.ts:46-57` `activateViewpoint` dual-write (project.activeViewpoint + root state.viewpoint); `:15` dormant `setLastEditedViewpoint`
- `store.tsx:165` `viewpoint: Pointer<DViewPoint> = ''` (root default) · `:166` `viewpoints`
- `classes.ts:2933/2958` `DProject.activeViewpoint` D field · `:3368-3377` L getter/setter · `:3024-3026` `getProject()`
- `U.tsx:427-441` `compressedState` = full-DState snapshot · `:424-425` `decompressState`
- `reducer.ts:1546` decompress on open · `SaveManager.ts:41-58` `load` → `VersionFixer.update` → `LoadAction`
- `VersionFixer.tsx:294-323` `rootPointers` scrub list (has `viewpoints`, **not** `viewpoint`) · `:209-245` invalid-pointer deepReplace
- `projects.ts:107-108` save serialises state · `:338` online list carries `activeViewpoint`
- `EditorV2.tsx:450-455` per-model-localStorage design-intent comment · `:460/467` `jjodel.highlight.${modelid}` precedent · `:656` `jjodel.showSingletons.${modelid}`
- Classic-side viewpoint consumers: `NestedView.tsx:82,544`, `selectors.ts:529`, `TreeViewContent.tsx:1869`, `EdgeOverlay.tsx:187`
- `ModelTab.tsx:43` / `MetamodelTab.tsx:183` mount `EditorSwitch`
