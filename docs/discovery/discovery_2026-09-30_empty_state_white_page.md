# Discovery 2026-09-30 — a project saved with an empty state opens to a white page

Prompt-ID: P-2026-09-30-1540 · prompt `docs/prompts/claude_2026-09-30_1540_prompt_empty_state_white_page.md` ·
session `1ec0aa50-f1ac-4c73-aa81-855690808915` · tree `~/jjodel-w-emptystate`, branch `empty-state-guard`,
HEAD `0e8307c60` (trunk `ecbc0e92c` + the prompt) · executor: Claude Opus 5.5 · Phase 1, read-only.
This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

1. **An empty state is still written on today's trunk, by the in-editor favorite, not by any save.** Measured on
   3061: import `scene_3_DemoESM.jjodel`, open it, Cmd+S (stored state 21846 chars), silent autosave (21850), then
   the sidebar «Add to favorites»: the stored record becomes `state.length 0`, `isFavorite true`, pointer lists
   intact, `lastModified` rolled back to the store's value. Cause: `Offline.favorite` writes `{...project}`
   (`projects.ts:368`), `project` is the editor's store entry, and every saved state stores that entry with
   `state: ''` (`U.tsx:439`). `Offline.updateTags` (`:383`) has the same shape; its two callers are on the dashboard
   (`Catalog.tsx:376`, `Project.tsx:228`), whose entry carries the stored state, so it does not empty it today.
   Cmd+S, the layout autosave, «Save & Exit» and Download all go through `ProjectsApi.save`, whose state comes from
   `compressToUTF16(JSON.stringify(...))` and is never empty (measured 2/2).
2. **The white page is two defects in series.** (a) The load treats `!project.state` as «new project, never
   saved» (`reducer.ts:1578-1581`) and mounts the editor on the record's pointer lists, which name objects no state
   holds: `LProject.get_metamodels` does not filter absent targets (`classes.ts:3406-3414`, unlike `get_models`,
   `:3425`), `LeftBar` and `ProjectEditor` throw on `.id` / `.name`. (b) `TryComponent` then loops: its fallback is
   `<Measurable draggable>` (`DV.tsx:1741`), on a project page `ErrorDisplay` renders a badge (`ErrorPortal.tsx:190`),
   `Measurable` calls a jQuery-UI `draggable` that is not there (`Measurable.tsx:343`), and the boundary catches
   its own fallback. Measured with `<Try><Thrower/></Try>` alone on a project page: 53 `componentDidCatch`, 53
   `$measurable[type] is not a function`, «Maximum update depth exceeded» ×2, container empty. The seeded damaged
   record reproduces the chat's page: `#root` 0 children, 53 catches, max depth ×2.
3. **A state that does not decompress already opens the error screen** (seeded, measured); only `""` bypasses it.

**Recommendation, Phase 2 (all inside DOVE, no critical-zone file):**
- Write: `ProjectsApi.save` refuses an empty serialization (toast + `console.error`, nothing written, project stays
  dirty, version not advanced); at the storage boundary (`Offline.save`, `favorite`, `updateTags`, `import`) a
  record with an empty state never replaces a stored non-empty one: the stored state is kept (`console.warn`).
- Read: `ProjectsApi.getOne` throws for a record whose state is empty while it claims content (non-empty
  `metamodels`/`models`, or a positive `metamodelsNumber`/`modelsNumber`); the throw lands in the one catch of
  `stateInitializer` (`reducer.ts:1604-1609`) and sets the existing `unreadable` error. A brand-new project
  (empty lists, zero counters) still opens as before.
- `LeftBar.tsx:290-291` and `ProjectEditor.tsx:205-206` filter out absent targets. `TryComponent` counts its catches; from the second one of an episode it renders a plain fallback that cannot
  throw, so it catches once for the child and at most once more for its own fallback.

**Decisions taken (unattended, Recommended lines below):** Q1-Q5. **Decisions awaiting Alfonso:** none.

1. Q1. Guard «unparsable» too, by a decompress round-trip on every save? Recommended: no; check emptiness, since every producer of a non-empty state compresses fresh JSON or copies a parsed one, and the round-trip doubles the cost of every layout autosave.
2. Q2. Toast on the metadata writes (favorite, tags) that keep the stored state? Recommended: no toast, `console.warn` only; nothing the user asked for is refused, the favorite goes through.
3. Q3. Guard the Online favorite / tags path (same empty state in the PUT)? Recommended: no, not measurable without a backend; a ticket in the log entry.
4. Q4. Fix LeftBar's Download, which exports `project.__raw` with `state: ''` (`LeftBar.tsx:192-196`)? Recommended: no, out of this prompt's two defects; a ticket.
5. Q5. Rule 19 (more than 5 files): proceed with the DOVE list of §6? Recommended: yes, the prompt's DOVE names each file and its cascade clause is the confirmation.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|------------|---------|----------|
| H1 | Today's save paths (Cmd+S, autosave, tab close, project switch) can emit `state: ""` | **falsified** | §3.1: all go through `ProjectsApi.save` → `compressedState`; measured Cmd+S 21846, silent 21850 |
| H2 | Some other write of the `projects` key can emit `state: ""` over a non-empty one | **holds** | §3.2: in-editor favorite, measured 21850 → 0 |
| H3 | The load treats an empty state as a new project and mounts the editor on dangling pointers | **holds** | §4.1, measured page errors `reading 'id'`, `reading 'name'` |
| H4 | `TryComponent` loops by itself, independently of the project | **holds** | §4.3, arm A: `<Try><Thrower/></Try>` alone, 53 catches |
| H5 | An undecompressable state white-pages too | **falsified** | §4.2, arm C: error screen, zero page errors |

## 2. Files read

`frontend/src/api/persistance/projects.ts` (whole), `frontend/src/api/__tests__/projectsSaveLive.test.ts` (whole),
`frontend/src/common/U.tsx:426-445`, `frontend/src/redux/reducer/reducer.ts:1479-1620`,
`frontend/src/pages/components/LeftBar.tsx:140-200, 285-300, 370-400, 420-440`,
`frontend/src/pages/components/Navbar.tsx:1425-1445`, `frontend/src/pages/components/Project.tsx:120-235`,
`frontend/src/pages/Project.tsx:1-120`, `frontend/src/components/project/ProjectEditor.tsx:198-215, 280-300, 470-490`,
`frontend/src/components/forEndUser/Try.tsx` (whole), `frontend/src/components/forEndUser/Measurable.tsx:60-175, 290-350`,
`frontend/src/common/DV.tsx:1721-1765`, `frontend/src/common/ErrorPortal.tsx:137-254`,
`frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx` (whole), `frontend/src/joiner/classes.ts:1292-1330,
3065-3153, 3400-3440`, `frontend/src/data/storage.ts:1-30`, `frontend/src/api/DTO/UpdateProjectRequest.ts:1-25`,
`frontend/src/model/megamodelPersistence.ts:97-106`, commits `0609e9793` (error screen) and `9ef223452` (live save).

## 3. Write side

### 3.1 The save paths (read, and measured for two)

- `ProjectsApi.save` serializes with `U.compressedState` (`projects.ts:152`: `const state = await U.compressedState(dProject);`),
  which ends in `return await compressToUTF16(str);` over `JSON.stringify(state, proxyToIdReplacer)` (`U.tsx:441-443`):
  a non-empty string for any state.
- Callers (grep `ProjectsApi\.(favorite|updateTags|save|import|importFromText|delete|create|getOne)\(` over `src`,
  `.ts`/`.tsx`, `__tests__` excluded; positive control: the hit on `projects.ts:292` itself): Cmd+S
  `SaveManager.ts:33`, layout autosave `useLayoutAutosave.ts:119` (silent), «Save & Exit» `LeftBar.tsx:153`, Download
  `LeftBar.tsx:194`, Navbar File menu `Navbar.tsx:1392`, `saveProject.tsx:71`. There is no save on `beforeunload`:
  the only `pagehide`/`visibilitychange` listeners are the layout autosave's (`layoutAutosaveScheduler.ts:97-98`),
  which call the same silent save.
- Measured (probe `_tmp_emptystate_repro.ts`, 3061, this tree): Cmd+S → stored `stateLen 21846`; silent save →
  `21850`.

### 3.2 The writer that empties it (read, then measured)

Every write of the `projects` key is in `projects.ts` (grep `Storage\.write\(|setItem\(['"]projects` over `src`;
positive control: `projects.ts:361` found; the other hits are `user`, `token*`, `offline` and
`examples/StateMachine`'s `Storage.write('projects', [])`). Six writers: `Offline.create` `:315`, `delete` `:346`,
`save` `:361`, `favorite` `:368`, `updateTags` `:389`, `import` `:400`.

- `projects.ts:368`: `Storage.write('projects', [...filtered, {...project, isFavorite: !project.isFavorite}]);`
- `U.tsx:439`: `state.idlookup[id] = {...dproject, state: ''} as any;` — so after any open, `idlookup[pid].state === ''`
  (measured: `store idlookup[pid] after open {"state":""...}`).
- Callers passing the editor's entry: `LeftBar.tsx:190` `await ProjectsApi.favorite(project?.__raw as DProject);`
  (the sidebar «Add to favorites», `:433`) and `Navbar.tsx:1438` (Edit › Add to Favorites, editor only).
- Measured: after the sidebar click, `{"stateLen":0,"isFavorite":true,"metamodels":["Pointer1790775343719_USER_4"],
  "models":[...],"lastModified":1790585698712}`: pointer lists of the live project, state empty, `lastModified`
  rolled back to the one inside the loaded state. This matches the chat's record (pointers kept, state empty,
  `lastModified` 23:46 = the save before the last open). The chat can confirm on Alfonso's record: `isFavorite`
  should read `true` (or toggled against before), by reading only.
- `Offline.updateTags` (`:383`, `const updatedProject = {...project, tags};`) has the same shape; its callers
  `Catalog.tsx:376` and `Project.tsx:228` are dashboard components, whose entry is built by `Offline.getAll` with
  `DProject.new(project.type, project.name, project.state, [], [], project.id)` (`projects.ts:328`): state kept,
  pointer lists `[]`. Not an emptier today; guarded by the same rule.
- Online: `Online.favorite`/`updateTags` PUT `new UpdateProjectRequest({...project})`, whose DTO carries `state`
  (`UpdateProjectRequest.ts:11`). Same empty state; the backend's reaction is not measurable here (Q3).

## 4. Read side

### 4.1 The load of `state` (read, measured)

`reducer.ts:1578-1585`:
```
            if (!project.state) {
                ...
                Constructors.persist(project);
                recursiveCheck();
                return; // empty new project, keep initializing actions.
            }
            else state = JSON.parse(await U.decompressState(project.state));
```
The record's pointer lists become the store entry. `classes.ts:3406` `let ret = context.data.metamodels || [];` →
`L.fromArr(...)` keeps `undefined` for an absent target; `get_models` filters (`:3425`
`.filter(e=>!!e)`). `LeftBar.tsx:377` `pMetamodels.map(m => ({ id: m.id, name: m.name }))` and
`ProjectEditor.tsx:205` `const metamodels = project.metamodels || [];` then throw. Measured, arm B: page errors
`Cannot read properties of undefined (reading 'id')`, `(reading 'name')`.

`getOne` has one caller: `reducer.ts:1536` (grep above; `pages/Project.tsx:55` is inside a comment block).
A throw from it lands in the catch at `reducer.ts:1604-1609`, which sets
`ProjectsApi.loadError = {kind: 'unreadable', details: ..., projectId: openPid}`; `ProjectLoadingScreen` then shows
«This project could not be opened» with the details (`ProjectLoadingScreen.tsx:16, 51, 64`), and `ProjectsApi.save`
already refuses a project whose open failed (`projects.ts:121`).

A brand-new project: `DProject.new` → `metamodels = m2`, `models = m1` (`classes.ts:1295-1296`), with `[]` from both
callers (`AllProjects.tsx:38`, `RightPanel.tsx:51`), counters at the class defaults `0`. The discriminator of §0 does
not flag it; viewpoints are left out because a never-saved project favorited in the editor may carry default
viewpoint pointers, which every state holds.

### 4.2 Undecompressable state (measured)

Arm C, record with `state: 'not a compressed state'`: `{"errorScreen":true,"title":"This project could not be
opened","spinner":false}`, zero page errors. The existing path of `0609e9793` covers it.

### 4.3 TryComponent (read, measured)

- `Try.tsx:104` `static getDerivedStateFromError`, `:134-137` `componentDidCatch` → `this.setState({error, info, ...})`,
  `:148` render → `this.catch(...)` → `:203` `return DefaultView.error(visibleMessage, "unhandled", ...)`.
- `DV.tsx:1741` `<Measurable draggable={true} resizable={false}>` around `ErrorDisplay`; `ErrorPortal.tsx:190`
  `if (!isInEditor) {` return null — so off a project page the fallback has no element and does not throw.
- `Measurable.tsx:343` `($measurable as GObject)[type](options);` throws `$measurable[type] is not a function`.
- Measured, arm A (`_tmp_emptystate_try.ts`), `<Provider><Try><Thrower/></Try></Provider>` in a detached div:
  on `#/allProjects` 1 catch, no loop; on a project page 53 catches, 54 fallback renders, 53 Measurable throws,
  max depth ×2, container empty. The loop is the boundary's own, independent of the project.

## 5. Dependencies and risks

- `ProjectsApi.save` clears the dirty flag even when the persistence layer returns false (`projects.ts:185`
  `if (!silent) U.isProjectModified = false;`): the refusal must return before that line.
- The metadata writes keep the caller's other fields (`lastModified` rolled back, §3.2): not in scope.
- `DV.tsx`/`Measurable.tsx` are the reason the fallback throws; `DV.tsx` is rule-14 territory and out of DOVE, so
  the fix stays in `Try.tsx`.
- Test bench: vitest runs `environment: node`, `include` `*.test.ts` only, no jsdom/testing-library/react-test-renderer
  in `node_modules` (checked by directory, the five absent, 617 entries listed). React's error-boundary protocol
  cannot run there: the Try test executes the class's own methods, and the React loop is measured by the probe.

## 6. Phase 2 file list (Q5)

| File | Change |
|------|--------|
| `frontend/src/api/persistance/projects.ts` | save refusal; storage-boundary state keep; `getOne` damaged-record throw |
| `frontend/src/pages/components/LeftBar.tsx` | `:290-291` filter absent targets |
| `frontend/src/components/project/ProjectEditor.tsx` | `:205-206` filter absent targets |
| `frontend/src/components/forEndUser/Try.tsx` | catch counter, plain fallback from the second catch |
| `frontend/src/api/__tests__/projectsEmptyState.test.ts` (new) | save / favorite / getOne |
| `frontend/src/components/forEndUser/__tests__/tryCatchOnce.test.ts` (new) | the catch counter |
| `docs/log-inbox/versionfixer.md`, the prompt's Status | closure (the inbox the live-save lane used) |

## 7. Probes

`frontend/scripts/smoke/_tmp_emptystate_repro.ts` and `_tmp_emptystate_try.ts` (gitignored), logs in
`~/.jjodel-lanes/P-2026-09-30-1540/`. Repro: 6 PASS lines, reproduction arms included. Try, before the fix:
5 FAILURE(S) out of 7 checks, the two green ones being the untouched stored record and arm C.
