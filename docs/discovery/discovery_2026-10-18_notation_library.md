# Discovery — notation library and project gallery: seal, provenance, clone, packaging

Prompt-ID: P-2026-10-18-1735 · prompt `docs/prompts/claude_2026-10-18_1735_prompt_discovery_notation_library.md`
Session: 3ce8b72e-51f5-48ea-9753-dd994d3d3909 · tree `~/jjodel-w-library`, branch `notation-library-disc`, HEAD `3d4508986`
Executor: Claude Opus 5.5 (`claude-opus-5-5`), effort high · Phase 1, read-only on `frontend/`. No `backend/` in this tree (`ls backend` fails; the root holds `frontend/`, `cloudflare-worker/`, `docs/`, `scripts/`).

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files. Every claim
is **read** (code read at `3d4508986`); nothing was run in this phase.

## 0. Answer in brief

- **Q1 Hiding.** The default syntax has no marker on any D-object: a static id allowlist (`common/Defaults.ts:5-42`) is checked ad hoc, 4 hiding filters (main one `LProject.get_viewpoints`, `joiner/classes.ts:3483-3503`) and about 14 read-only sites. Ids are fixed strings, so it cannot hide a copied notation, whose ids are renewed on import. A general marker is needed. Provenance fits the `_state` bag every D-object has (`classes.ts:1477`): it survives save, `.jjodel` export and import (`duplicateProject` only rewrites ids), as the derived binding already does.
- **Q2 Write paths.** Every write, whether creator, L-proxy, JjScript, Jodie, JjTL write-back or collab replay, ends in one loop: `CompositeActionReducer`, `redux/reducer/reducer.ts:541-549`. A guard there covers everything except `LoadAction` (open, import, VersionFixer: `newState = action.value`, `:523-524`) and undo/redo (`:1163-1164`). Undo needs no check of its own once the guard holds, because its deltas only reverse states the guard admitted. The guard needs a field allowlist (`pointedBy`, `instances`) because M1 creation writes bookkeeping onto M2 (`classes.ts:812`, `:1021`, `:616`). `reducer.ts` is not in the §3.1 table, but it is the D-layer write path and core (rule 5): Layer Impact Report and approval. A UI-only guard covers gestures only, not JjScript, Jodie, the proxy or the console.
- **Q3 Project shape.** `DProject` holds pointer arrays `metamodels`, `models`, `viewpoints` (`classes.ts:3080-3084`). An M1 can be created in a project whose metamodel came from a file: the only gate is membership in `project.metamodels` (`ProjectEditor.tsx:1127-1143`). New project: `ProjectsApi.create` writes to localStorage offline, or `POST /project` online. Import: `importFromText` makes every import a duplicate with new ids and appends " copy" to the name (`projects.ts:257-298`, `Project.tsx:139-183`).
- **Q4 Read-only.** No project-level read-only mode exists (parked spec open question 1: no). Near precedents: consumer mode (`?profile=`, a soft UI gate) with its closed-by-default JjScript guard (`jjscript/executor/permissionGuard.ts`), and `__readonly`, enforced only in the proxy set trap (`joiner/proxy.ts:459`). The reducer guard of Q2, with a "refuse every write" policy, is the read-only mode.
- **Q5 Gallery clone.** Templates is a `ComingSoonPlaceholder` (`pages/Templates.tsx:8-17`). The clone can be done entirely on the client: `fetch('/library/…jjodel')`, then `ProjectsApi.importFromText`. No backend change is needed (`POST /project` exists). Gaps: the `name` argument is unused, the megamodel is registered under the old id (`projects.ts:264-265`, plausible bug), and `_clonedFrom` must live inside the state blob, because the online DTO drops unknown top-level fields.
- **Q6 Classic Ecore.** Yes, by a Playwright build script like `build-codegen-examples.ts`. There is no headless path: the importer needs `DOMParser`, the live store and the `joiner` barrel. Missing pieces: `Families.ecore` and `Persons.ecore` do not exist, so the two XMIs cannot resolve. Library, Graph and Shapes need M1 instances written by hand. The Default viewpoint is per project and empty (R-IRN-15), so the projects render with the default syntax.
- **Q7 Format.** `frontend/public/library/notations/<id>/<id>.jjodel`, built by `frontend/scripts/library/build-notation.ts <id>`, holding the canonical metamodel, the derived syntax viewpoint, the simulation binding, `genTemplates`, validation, an empty M1 and the seal markers. The catalog gets optional `version` and `package`. "New model from a notation" starts in the Dashboard's New Project, takes the same fetch-and-import path as the gallery, and opens on the model editor in a shell that hides M2, reusing the consumer-mode gate sites. Reusable as is: `createDerivedViewpoint` with the `DERIVED_NOTATIONS` entries, their `derivedLayout`, the system profiles `stateMachine`/`petri`/`flowchart`, the `notationCatalog.ts` presets, and the codegen templates.
- **Q8 Slices.** S1 gallery build, S2 Templates clone, S3 pure seal predicate, S4 first sealed package, S5 New-from-notation flow and M2-hiding shell, S6 reducer guard (report-only, then enforcing), S7 read-only opening, S8 version update. The first two without the critical zone are S1 and S2 (S3 too). The S6 guard is the only core and critical-zone slice.

**Recommendation.** Build case 2 first (S1, S2), because it needs neither seal nor core. Then put the seal in one pure predicate (S3), and enforce it in the reducer (S6) only after a report-only run shows zero refusals on an M1 editing scenario.

**Decisions awaiting Alfonso** (RC-26 items only):
1. The S6 guard in `reducer.ts`: a core, D-layer write-path edit, critical-zone go-ahead with a Layer Impact Report. Recommended: yes, report-only first, enforcing after the probe.
2. Which slices land before the 3.2 freeze of 2026-10-23. Recommended: S1 and S2 only, S3 if time allows; nothing of S6.
3. S2 replaces the Templates placeholder: this changes what the app shows (the MODELS demo, if it opens the Dashboard). Recommended: yes, the entry already promises "starter projects … you can clone".
4. S2 clones before read-only opening exists (R-LIB-6 keeps read-only opening). Recommended: clone first, a preview card meanwhile, read-only opening in S7 on the S6 guard.
5. `LoadAction` stays outside the guard: a hand-edited `.jjodel` loads its sealed M2 as written (R-LIB-2: a product guarantee). Recommended: yes, with a hash check on load as a later warning.

**Decisions taken (unattended)** are in §9.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The default-syntax hiding can be reused for a sealed notation | **Falsified**: fixed-id allowlist (§2) |
| H2 | A free persisted bag survives export/import | **Holds** (read): `_state` (§2.4) |
| H3 | One choke point intercepts every M2 write | **Partly**: the reducer loop does, except `LoadAction`; undo is covered by induction (§3) |
| H4 | A read-only mode exists | **Falsified** (§5) |
| H5 | A gallery clone needs no backend | **Holds** (read) (§6) |
| H6 | The Ecore importer can build the R-LIB-5 projects headlessly | **Falsified**: browser only; **holds** via Playwright (§7) |
| H7 | Derived-notation pieces are reusable in a sealed package | **Holds** (read) (§8) |

## 2. Q1 — hiding and provenance

### 2.1 The mechanism
- `common/Defaults.ts:5-42`: 20 `Pointer_View*` ids, `["Pointer_ViewPointDefault"]` at `:27`, and 14 type ids. Helpers: `Defaults.check(id)` at `:108`, `isSystemViewpoint` at `:114`, `holdsOnlySystemViews` at `:146`. They are not persisted, and nothing is stored on `DViewPoint`/`DViewElement`.
- The list is known to be incomplete: `Defaults.ts:124-137` names `Pointer_ViewVoid` and `Pointer_ViewDefaultPackage` as system views that are not in the list.

### 2.2 Hiding sites
- `LProject.get_viewpoints`, `joiner/classes.ts:3483-3503`. It drops the seeded viewpoint unless that viewpoint holds authored views. The tree (`TreeViewContent.tsx:3177`), the left bar (`LeftBar.tsx:318`), `Project.tsx:88`, `Dashboard.tsx:377-481`, `ProjectEditor.tsx:212` and `Info.tsx:1615` all read this getter.
- `components/editor-v2/Toolbar.tsx:280-281` applies a second, unconditional filter on `state.viewpoints`, separate on purpose (comment `:269-277`).
- `MegamodelView.tsx:157`.
- Elsewhere: `Dashboard.tsx:504` disables delete, and `VersionFixer.tsx:1299` resets an `activeViewpoint` that holds the seeded id.
- The Data Manager has its own predicate, `isDataManagerViewpoint` (`view/viewPoint/viewpoint.ts:58,64`), deliberately kept out of `Defaults` (`:39-42`).
- Read-only sites through `Defaults.check`, about 14: `Javascript.tsx:33`, `Js.tsx:35`, `Ocl.tsx:20`, `Jsx.tsx:18`, `ViewData.tsx:58`, `Input.tsx:161`, `MySelect.tsx:18`, `MTM.tsx:528`, and others.

### 2.3 Why it cannot serve a sealed notation
- `duplicateProject` renews every non-default id: `pages/components/Project.tsx:173-178`, "rewrites every non-default pointer id in `idlookup` by text replacement". A copied notation therefore has fresh ids on every project, and an allowlist cannot name them.
- The mechanism covers viewpoints only. It does not cover models, validation, `_state` profiles or templates.

### 2.4 Where provenance lives
- `classes.ts:1477`, `_state: GObject = {};`, sits on `DPointerTargetable`, so `DProject`, `DModel` and `DViewPoint` all carry it. Writes go through `set_state` (`:2356-2400`).
- Precedent: `utils/deriveViewpoint.ts:81`, `(vp as any)._state = state;`.
- Save: `U.compressedState` (`common/U.tsx:429-445`) compresses the whole `idlookup`, and the project is written `{...dproject, state:''}` (`:439`).
- Load: `SaveManager.ts:51-53` takes `save.idlookup[project.id]`.
- Import: `projects.ts:268`, `let project = json as unknown as DProject;`, then `duplicateProject`. It rewrites pointer-shaped ids only, so plain strings such as a notation id or a version survive.
- VersionFixer: no `_state` stripping was found. Searching `_state` under `redux/` gives only `VersionFixer.tsx:1320,1339`, both reads; the positive control was the same search finding them. Not tested on a loaded project.
- Online DTO: `UpdateProjectRequest.ts:6-21` has a fixed field list, so a top-level field on the server record is dropped. Inside the `state` blob the field is kept.
- Name collision: `DClass.sealed` already exists (`model/logicWrapper/LModelElement.tsx:2748`, a Java-style field), so the marker must not be called `sealed`.

## 3. Q2 — write paths to M2

### 3.1 The funnel
- `redux/action/action.ts`:
  - The actions: `SetRootFieldAction` at `:404`, `SetFieldAction` at `:481`, `CreateElementAction` at `:721`, `DeleteElementAction` at `:760` (a subclass of SetField), `CompositeAction` at `:773`, `LoadAction` at `:387`, `UndoAction` and `RedoAction` at `:687` and `:667`.
  - `Action.fire` at `:319` queues during a `TRANSACTION` (`:329`).
- There is no middleware: `createStore(reducer)` at `redux/createStore.ts:5`. The only `.dispatch(` calls are `action.ts:349` and `SaveManager.ts:59`.
- `reducer.ts:541-549`, verbatim:
  ```
  case CreateElementAction.type:
  case SetRootFieldAction.type:
  case DeleteElementAction.type:
  case SetFieldAction.type:
      let tmp: false | DState = deepCopyButOnlyFollowingPath(newState, action, prevAction, action.value);
      if (!tmp) return oldState; // rollback due to invalid action in transaction
  ```
  A refusal there is already atomic over the whole batch (`return oldState`).
- The target is `pathArray[1]` of `'idlookup.<id>.<field>'` (`action.ts:585`, `Action.parse1` at `:361`). For a create, it is `action.value.father`.
- Owner resolution: `metamodelOfClass(idlookup, id)` (`joiner/environmentConfig.ts:111`) walks `father` up to the first `DModel`, with a depth cap of 64.

### 3.2 Entry points, all of which reach the funnel
- **Creators.** `DClass.new` at `LModelElement.tsx:2755`, `DAttribute.new` at `:4380`, `DReference.new` at `:4009`, `DEnumerator.new` at `:4807`, `DPackage.new` at `:1827` and `DModel.new` at `:5014`; `DViewElement.new2` at `view/viewElement/view.tsx:408`; `DViewPoint.newVP` at `viewpoint.ts:129`; `DValidationRule.new` at `model/validation/validationTypes.ts:205`. All go through `Constructors.persist` (`classes.ts:655`), then `CreateElementAction.new` (`:676`). Exception: `Constructors.paused` (`:658`, set by `api/data.ts:189`) skips persist, on the Ecore import path.
- **Proxy.** `joiner/proxy.ts:446-448`: `defaultSetter` turns `lobj.x = v` into a `SetFieldAction`.
- **Canvas v2.** The M2 writes are in `useClassRemoval.ts`, `deleteAdapter.ts`, `writeCtxLproxy.ts`, `viewpoint/ir/formWrite.ts`, `viewpoint/authoring/*` and `EditorV2.tsx`. `canvasToJjom.ts` writes layout (`x`, `y`, `w`, `h`, `layoutByViewpoint`) on DVertex, which is not M2.
- **Tree and menus.** `TreeViewContent.tsx`, `ContextMenu.tsx`, `Info.tsx`, `DataManagerViewpointPanel.tsx`, `ValidationRulesModal.tsx`. In all, 102 non-test files mention the four action names.
- **JjScript.** `commands/create.ts:510-1158`, `delete.ts:149`, `set.ts:117`, `move.ts:92`, `copy.ts:197-354`, `extends.ts:143`, `abstract.ts:84`. Pre-dispatch guards run in `executor.ts:127-165`: `permissionGuard`, `scopeGuard`, `m2CreateGuard`.
- **Jodie.** `JjScriptService.execute` (`components/Jodie/ChatMessages.tsx:495`), and `jjodie-integration/JjodieAPIImpl.ts`, which issues direct actions. `services/JjodieActionExecutor.ts` has no importers (dead).
- **JjTL.** The executor builds plain objects, and write-back is `DModel.new(name, targetMetamodel.id, false, true)` (`ProjectEditor.tsx:1681-1689`), an M1 only. A target cannot be M2.
- **Import.** Ecore creates new M2 (`api/data.ts:442`, `XMIService.ts:593`). XMI creates M1 (`XMIService.ts:520`).
- **Collab.** `Collaborative.ts:140`: `fromJson`, then `COMMIT`, then `fire`, so it reaches the funnel.
- **Templates, STC, simulation binding.** These live on the metamodel's `_state` (`codegen/engine/templateCodec.ts:5`, "The templates of a metamodel live in one key of its `_state` bag, `genTemplates`, the bag that holds the STC"). They are set via `set_state`, so they reach the funnel. The M1 run bags (`runWatches`, `runScenarios`) are on the model (`watchCodec.ts:7-8`), which is M1 and stays writable.
- **Paste.** No path that pastes M2 was found. The `ChatInput` and `forEndUser/Try` hits were not read, a window gap.

### 3.3 What the funnel does not see
- **`LoadAction`.** `reducer.ts:523-524`, `newState = action.value;`. It is fired by `SaveManager.load` after `VersionFixer.update(save)` (`SaveManager.ts:56-59`), by `VersionFixer.tsx:442` and by `U.tsx:451`. A hand-edited file loads as written.
- **Undo and redo.** `reducer.ts:1163-1164` handles them before `doreducer`. `undo()` at `:1325` applies stored deltas (`Uobj.applyObjectDelta`), with history capped at 100 (`:79`). They bypass the funnel. But every delta records a transition the funnel admitted, so once the guard holds from the moment the seal exists, undo can only reverse admitted M1 writes, or the creation of the project itself. **Hypothesis to test in the S6 probe**: refuse, then undo, then redo, and the sealed M2 is unchanged.

### 3.4 The trap: bookkeeping writes on M2
- M1 creation writes `instances +=` on the M2 class and the model (`classes.ts:812`, `:1021`).
- `setPtr` writes `pointedBy` on the target (`classes.ts:616`).
- So the guard refuses writes on sealed ids **except** on the fields `pointedBy` and `instances`.
- Whether view elements receive writes during M1 editing (sizes, `subViews` at `classes.ts:1264`) is not established by reading. S6 starts in **report-only** mode to measure it.

### 3.5 The `__readonly` precedent
- `classes.ts:2100-2102`: "All attempts for changes will result in a transactional abortion … Indirect changes, such as editing or adding a subElement, are still allowed."
- It is enforced only in the proxy set trap (`proxy.ts:459`, `if ((this.d as GObject).__readonly && propKey !== '__readonly') {`). It is also unsettable through the same proxy.
- Its absence in the reducer: `command grep -rln -i readonly redux` returned nothing (exit 0), and the positive control, the same search run on `joiner/classes.ts`, found `:1476` and `:2103-2125`.
- Not a seal: it is bypassed by `SetFieldAction.new` and `D*.new`, and anyone can flip it back.

### 3.6 Critical zone and Layer Impact Report
- The guard does not touch `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts` or `VersionFixer.tsx`. It sits in `reducer.ts`: core (rule 5) and the D-layer write path of §3.2. Treat it as critical zone.
- What the Layer Impact Report would cover:
  - D-layer: refusal by target id and field.
  - L-layer: proxies see a no-op.
  - Sync: does a refused M2 change leave canvas state ahead of Redux? Canvas optimistic updates in `useJjomSync` must not assume success.
  - Persistence: none.
  - Smoke: M1 create, link, move and resize on a sealed project with zero refusals; Families import of 8 edges unchanged on an unsealed project.
- Rule 12 is not at stake: a check inside the reducer opens no TRANSACTION.

### 3.7 UI-only versus core
- A UI-only guard (tree menu, palette, panels, view and rule editors) covers gestures.
- It misses JjScript, Jodie and the console (`windoww.s`), the generic proxy and collab.
- Only the funnel holds R-LIB-2 ("enforced on the write path to M2 … not only in the UI").
- `TRANSACTION` callers get no failure signal (`AFTER_TRANSACTION` still fires), so the user message needs its own hook: a toast from the guard, or the JjScript pre-check of S5.

## 4. Q3 — project shape

- `classes.ts:3080-3084`: `metamodels`, `models`, `graphs`, `viewpoints`, `activeViewpoint`.
- `LProject.get_metamodels` and `get_models` also append `state.m2models` and `state.m1models` (`:3405-3414`, `:3424-3433`).
- M1 binding: `DModel` constructor at `classes.ts:1005-1026`, `setPtr("instanceof", …)` at `:1010`, reverse `instances` at `:1021`, singletons auto-created at `:1015-1018`. UI: `createM1` at `Navbar.tsx:102-121`.
- No authorship gate: `ProjectEditor.tsx:1127-1143` creates directly with one metamodel and shows a picker with several. `DockManager.tsx:148` refuses metamodels only in consumer mode.
- New project: `ProjectsApi.create` (`AllProjects.tsx:38`, `projects.ts:45-61`). Offline it pushes to localStorage (`:346-350`). Online it calls `POST /project` (`:441-444`). Server endpoints seen from the client: `GET /project/`, `GET /project/jjodel/:id`, `POST /project`, `PUT /project/`, `DELETE /project/:id`.
- Import: `projects.ts:257-298`. `dialogDuplicate = false` at `:276` makes every import a duplicate. `duplicateProject` (`Project.tsx:139-183`) assigns a new id (`:142`), adds a " copy" suffix (`:144`) and does the text id replacement (`:173-179`).
- `Offline.getAll` loads a fixed field whitelist for the list (`projects.ts:359-370`). The editor reads the blob.

## 5. Q4 — read-only

- Absent. A case-insensitive search for `readonly|isReadOnly|viewOnly|locked` in `redux/action`, `redux/reducer`, `store.tsx` and `createStore.ts` returns nothing; the positive control `class SetFieldAction` resolves at `action.ts:481`. This answers the parked spec's open question 1 (`spec_parcheggiata_templates_featured_projects.md:56-63`): no.
- Partial precedents:
  - Consumer mode (`components/environment/consumerMode.ts`, header: "Soft frontend gate (D1): this hides UI paths, it is NOT access control"). Gated in `Dock`, `DockManager`, `LeftBar`, `Navbar`, `Dashboard` and `StatusBar`.
  - `permissionGuard.ts`, header: "Closed by default. A command is allowed only when it is `help`, or a `create` / `set` / `rename` / `delete` on M1 instances".
  - `ReadOnlyGate` (`InstanceDetail.tsx:673-685`).
- What a read-only mode would touch: the funnel of §3.1 with a "refuse all except layout and UI-transient fields" policy, and the save (`ProjectsApi.save`, `projects.ts:124`). Plus the UI gates the spec lists, which are cosmetic once the funnel refuses.

## 6. Q5 — gallery clone

- Templates: `LeftBar.tsx:558` (`<Item action={'templates'}>`), route at `App.tsx:164`, page at `pages/Templates.tsx:8-17`, a `ComingSoonPlaceholder`.
- Codegen examples are imported by hand. Their README says Import on Projects or File > Import Project (`petri-producer-consumer/README.md:86-92`). No `fetch` of `/examples` exists in non-test `src`.
- `importable.test.ts` checks that each file is well formed (`:56-62`) and carries its metamodel, model, roles, templates and scenario (`:64-110`). It also checks that no id is a prefix of another (`:112-117`; the import's text replacement needs that), and runs the oracle in node (`:119-131`). It does not run `importFromText`, which does not load in node (`:13-16`).
- Client clone: `fetch(url)`, then `.text()`, then `ProjectsApi.importFromText(text)`. This works offline and online with existing endpoints, so the parked spec's `POST /projects/:id/clone`, `featured` and curator are not needed (R-LIB-6).
- To add:
  - Honour the unused `name` parameter (`projects.ts:257`), so no " copy" suffix.
  - Set `_clonedFrom` on the DProject entry inside the blob: the online DTO drops top-level unknowns. The persisted name is `_clonedFrom`, as the spec has it.
  - Check the megamodel registration under the old id (`projects.ts:264-265`, `registerSerializedMegamodel(json.id, megamodelData);`, before `duplicateProject` at `:285`). This is plausible, not confirmed, since `loadMegamodel` may read it again from the blob. It is a probe item of S2.
- `frontend/public/library/` does not exist (`ls` fails; the control `ls public/examples/codegen/` lists 2 files).

## 7. Q6 — classic Ecore projects

### 7.1 Fixtures and gaps
- Fixtures (`frontend/src/__tests__/fixtures/xmi-m1/`): `Library.ecore` 1791 B, `Graph.ecore` 1087 B, `Shapes.ecore` 1338 B, `StateMachine.ecore` 4257 B, `sample-Families.xmi` 506 B, `sample-Persons.xmi` 446 B, `sample-StateMachine.xmi` 1883 B (the "Heater" machine, with a deliberate `Broken` instance).
- `Families.ecore` and `Persons.ecore` are absent repo-wide. `find .. -name "*.ecore"` without node_modules lists only the 8 fixture ecores and `scripts/benchmarks/bench.ecore`; the control `-iname "Library*.ecore"` hits. The XMIs resolve their metamodel by nsURI or EPackage name (`XMIService.ts:36-58`), so both ecores must be written.

### 7.2 The importer
- `EcoreService.importFromXML` (`EcoreService.ts:571`) and `XMIService.importM1FromFile` (`XMIService.ts:520`) both need `new DOMParser()` (`:577`, `:544`), the `joiner` barrel (`:34`, `:25`) and the live store (`DModel.new`, `api/data.ts:442`, `:537`).
- No headless test exists: `ecore-io.test.ts` mocks joiner (`:7`).

### 7.3 Build path
- `build-codegen-examples.ts` drives Playwright against a dev server (`:23`, `:251`). It imports with `ProjectsApi.importFromText` in `page.evaluate` (`:65-73`) and exports via File → Download Project (`:171-238`). It runs through `lane-run.mjs probe` (`:18-19`).
- The probes `bpmn-lanes-fixture.ts` and `statechart-fixture.ts` give helpers: `createProject` at `:211`, `buildMetamodel` at `:237`, `buildModelShell` at `:260`, `buildObjects` and `buildLinks` at `:275` and `:298`, `buildViewpoint` at `:311`. `saveScene` at `:184` calls `buildProjectExportJson`.
- Earlier probes upload `.ecore` and `.xmi` through `setInputFiles` (`nested-vertices.ts:196-198`).

### 7.4 Viewpoints
- Default viewpoint: `init_editor` creates the "Default" viewpoint per project (`redux/store.tsx:243-247`), empty under R-IRN-15 (`docs/decisions.md:1165`). The gallery projects therefore render with the default syntax and need no viewpoint of their own.

## 8. Q7 — the sealed package

### 8.1 On disk
- `frontend/public/library/notations/<id>/<id>.jjodel`: a normal export, so it is self-contained (R-LIB-2), plus a `README.md`.
- The gallery's files go to `frontend/public/library/gallery/<id>.jjodel`.
- The catalog entry gains optional `version` (semver string) and `package` (the public path). These are additions to the schema, not a change of meaning.
- Built by `frontend/scripts/library/build-notation.ts <id>` (Playwright, the §7.3 pattern), from sources under `frontend/scripts/library/notations/<id>/`: the canonical metamodel (`.ecore` or JjScript), the derive choice, the templates.

### 8.2 Contents
- The canonical metamodel (`DModel`, M2).
- The syntax viewpoint built by `createDerivedViewpoint(metamodelId, choice)` (`utils/deriveViewpoint.ts:55-99`). It carries `derivedFrom`, `derivedNotation`, `derivedRole_*` and `derivedLayout`, and its views carry `ir.generated`.
- The simulation binding on the metamodel's `_state`, written by `profileBinder.ts`.
- `genTemplates` on the metamodel's `_state`.
- A validation viewpoint, if the notation has rules.
- One empty M1 model.
- The `activeViewpoint` set to the syntax viewpoint.
- Seal markers: on the project `_state` (`libraryNotation` = id, `libraryNotationVersion` = version) and on each sealed root, the metamodel and each viewpoint (`_state.librarySeal` = id).
- The guard resolves any target to its root by walking `father`. Ids inside strings (the `oclCondition` `self.instanceof.id = '<classId>'` at `deriveViewpoint.ts:87`) are rewritten by the text replacement of import, which is why `importable.test.ts:112-117` exists. The package build reruns that check.

### 8.3 Flow
- Dashboard New Project → "From a notation" lists catalog `sealedNotation` entries that have a `package`. Then fetch and `importFromText` with the user's name, the same code as the gallery clone.
- The project opens on its M1 model. The shell hides M2 surfaces where `isConsumerMode()` is gated today, through a predicate `hidesMetamodelSurfaces() = isConsumerMode() || isSealedProject()`. The Jodie consumer voice is not reused: a sealed project's user is a modeler, not a consumer.
- JjScript gets a pre-dispatch "M1 only" refusal in a sealed project, beside `permissionGuard` (`executor.ts:127-165`), so Jodie "helps at M1 and refuses at M2" with a message. The reducer guard is the guarantee.
- XMI import of an instance of the sealed metamodel stays allowed (M1). Ecore import is refused (new M2).

### 8.4 Reusable as is
| Piece | Where | Sealed packages that reuse it |
|---|---|---|
| `DERIVED_NOTATIONS` | `viewpoint/derive/notations.ts:89-114` | statechart, petriClassic, flowchartIso, activityUml, erChen |
| layout profiles | same file, `derivedLayout` (`:121`) | statechart, petriClassic, flowchart, activityUml, erChen |
| system sim profiles | `model/simulation/simProfiles.ts` | stateMachine, petri, flowchart (and activity) |
| symbol presets | `viewpoint/ir/notationCatalog.ts` | BPMN, UML class, mind map, i* (drawn on the IR) |
| codegen templates | `public/examples/codegen/turnstile.jjodel`, `petri-producer-consumer.jjodel` | stateMachineUml, petriNet |
| graphVertex fixtures | `scripts/probe/bpmn-lanes-fixture.ts`, `statechart-fixture.ts` | BPMN pools/lanes, composite states |

The canonical metamodels (R-LIB-4) are new work for every notation.

## 9. Q8 — slices

Lane kinds as in P16. "CZ" means critical zone.

| # | Slice | Files (main) | Lane | CZ | Probe |
|---|---|---|---|---|---|
| S1 | Gallery build: 5 R-LIB-5 projects | `scripts/library/build-gallery.ts`; `Families.ecore`, `Persons.ecore` and sample XMIs for Library, Graph and Shapes under `scripts/library/gallery/`; `public/library/gallery/*.jjodel`; an `importable`-style test | full (new files, build) | no | the test (well formed, counts, no id prefix) + Playwright import of each file: metamodels/models/objects as built |
| S2 | Templates page clone | `pages/Templates.tsx`, `api/persistance/projects.ts` (name, `_clonedFrom`), `pages/components/Project.tsx` (suffix optional) | full (UI, visual) | no | Playwright: clone, then new id ≠ file id, name kept, `_clonedFrom` after save and reopen; megamodel edges kept |
| S3 | Seal predicate, pure | `model/librarySeal.ts` + tests (node bench, as `nameLookup.ts`) | fast | no | unit tests + mutation bench: allowlist, father walk, M1 vs M2 |
| S4 | First sealed package (statechart or Petri) | `scripts/library/build-notation.ts`, `scripts/library/notations/<id>/`, `public/library/notations/<id>/` | full | no | importable test + oracle on its scenario; derived views byte-identical to a derive on the same metamodel |
| S5 | New-from-notation flow, M2-hiding shell, JjScript M1-only check | Dashboard/New Project, `consumerMode.ts` (+ predicate), `LeftBar`, `Navbar`, `Dock*`, `TreeViewContent.tsx`, `executor.ts` | full (UI, visual; touches an active area) | no (`LProject.get_viewpoints` is core: report if touched) | Playwright: new from notation, no metamodel or viewpoint in tree, rail or menus; a JjScript M2 command is refused with a message; M1 create/link works |
| S6 | Reducer guard, report-only, then enforcing | `redux/reducer/reducer.ts` (+ S3 module) | full, `--critical-zone-goahead`, Layer Impact Report in `docs/lir/` | **yes** (core) | battery on a sealed project (JjScript M2 create/set/delete, proxy set, `SetFieldAction.new`, Jodie, collab replay, refuse, undo, redo): structural hash of sealed M2 unchanged; M1 scenario (create, link, move, resize, simulate, generate) with zero refusals in report-only mode first |
| S7 | Read-only opening of gallery projects | the S6 guard with a "refuse all" policy + banner + Clone button | full | yes (via S6) | open, write attempts refused, Clone works |
| S8 | Version update of a sealed notation | migration per notation version | full | maybe (VersionFixer if global) | old and new package: M1 kept, M2 replaced |

- First two slices clear of the critical zone: **S1 and S2**. S3 can run in parallel.
- Before the 3.2 freeze (2026-10-23): a question for Alfonso (§0, decision 2). The lane's estimate is S1 and S2, plus S3.

### Decisions taken (unattended)
1. Marker: `_state` keys `libraryNotation` and `libraryNotationVersion` on `DProject`, and `librarySeal` on each sealed root. The word `sealed` is avoided (collision with `DClass.sealed`). Provisional names, permanent once saved (R-B9).
2. `_clonedFrom` is kept as the spec's name and stored on the DProject entry inside the state blob, with the catalog entry id as its value.
3. Paths: `public/library/notations/<id>/` and `public/library/gallery/`. Optional catalog fields `version` and `package` (for Phase 2, not in this lane).
4. The guard sits in the reducer loop, refuses by target root, and allowlists `pointedBy` and `instances`. M2 `_state` is sealed (STC, templates and binding are M2 components). The M1 run bags stay writable.
5. Undo gets no check of its own (§3.3), to be proved by the S6 probe.
6. The builds are Playwright through `lane-run probe`, as `build-codegen-examples.ts` is. Moving the importer headless is a lane of its own.
7. `Families.ecore`, `Persons.ecore` and sample M1s for Library, Graph and Shapes are written by hand in S1.
8. The sealed shell reuses the consumer-mode gate sites through a combined predicate, without the consumer Jodie voice.

### Open questions (numbered, one line each)
1. Do M1 gestures write to view elements (sizes, `subViews`)? The S6 report-only mode measures it.
2. Is the megamodel lost on import (`projects.ts:264-265`)? The S2 probe settles it; a ticket if so.
3. Should a sealed project allow the user's own extra viewpoints? Recommended: no, R-LIB-1 ("only models with").

## 10. Files read (paths under `/Users/alfonso/jjodel-w-library/`)

- `docs/decisions.md` (6133-6170), `docs/library/catalog.json`, `docs/spec/parcheggiate/spec_parcheggiata_templates_featured_projects.md` (15-89), `docs/PROTOCOL.md` (304-317), `docs/claude-code-log.md` (1-30).
- `frontend/src/utils/deriveViewpoint.ts` (50-99), `frontend/src/components/editor-v2/viewpoint/derive/notations.ts` (exports, 47-125), `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (1-25), `frontend/src/codegen/engine/templateCodec.ts` (heads), `frontend/src/codegen/setting.ts` (1-30), `frontend/src/model/simulation/*Codec.ts` (heads), `frontend/src/components/environment/consumerMode.ts`, `frontend/src/jjscript/executor/permissionGuard.ts` (1-30), `frontend/src/components/Jodie/consumerVoice.ts` (1-25), `frontend/src/joiner/classes.ts` (1470-1480, 2098-2125), `frontend/src/joiner/proxy.ts` (452-465), `frontend/src/redux/reducer/reducer.ts` (505-552), `frontend/src/api/persistance/projects.ts` (255-299).
- Through explorer subagents, conclusions with `file:line` cited above: `common/Defaults.ts`, `common/U.tsx`, `components/topbar/SaveManager.ts`, `pages/components/Project.tsx`, `pages/Templates.tsx`, `pages/components/Navbar.tsx`, `pages/components/LeftBar.tsx`, `components/project/ProjectEditor.tsx`, `redux/action/action.ts`, `redux/createStore.ts`, `redux/store.tsx`, `model/logicWrapper/LModelElement.tsx`, `services/export/EcoreService.ts`, `services/export/XMIService.ts`, `codegen/examples/__tests__/importable.test.ts`, `scripts/examples/build-codegen-examples.ts`, `scripts/probe/bpmn-lanes-fixture.ts`, `scripts/probe/statechart-fixture.ts`, `jjscript/executor/executor.ts`, `joiner/environmentConfig.ts`, `components/collaborative/Collaborative.ts`.

## Gallery S1+S2 (P-2026-10-18-1800)

Tree `~/jjodel-w-gallery`, branch `library-gallery`, base `56b54365e`. Executor Claude Opus 5.5 (`claude-opus-5-5`), effort high. Everything below is **measured** (probe logs under `~/.jjodel-lanes/P-2026-10-18-1800/`).

### S1 — the build (`ca6dc27fe`, catalog `e2f47ea6e`)
- Sources in `frontend/scripts/library/gallery/`: the fixtures `Graph.ecore`, `Shapes.ecore`, `StateMachine.ecore`, `sample-Families.xmi`, `sample-Persons.xmi`, `sample-StateMachine.xmi` copied; `Families.ecore` (classic, 4 containments with their 4 `eOpposite`) and `Persons.ecore` (abstract `Person`, `Male`, `Female`) without nsURI, so the XMIs resolve by EPackage name; `Library.ecore` is the fixture extended with `Writer`, `Library.writers` and `Book.authors` (the fixture has no writers); sample models for Library (1 library, 3 books, 1 magazine, 2 writers, 2 members, `authors` and `borrowedBy` set), Graph (4 nodes, 5 edges, 6 targets) and Shapes (1 canvas, 2 circles, 1 square).
- `build-gallery.ts` (port 3097): New Project named as the label, `.ecore` then `.xmi` through the project page's file inputs, each model's editor opened once, File → Download Project. ALL GREEN, no page error. Objects per model: Library 9; Families 11, Persons 9; StateMachine 10; Graph 10; Shapes 4; each editor shows one node per object. Models keep the importer's names (`sample-<Name>`).
- `gallery.test.ts`: 31 green (30 at S1, plus the catalog copy check in S2). Bench: `graph.jjodel` copied over `shapes.jjodel` kills 4 tests; restored byte-identical.
- The five packages carry `megamodel.edges: []`.

### S2 — the clone (`d8ed13f1c`, catalog `86eea439f`)
- Catalog delivery: **copied and fetched**, not imported. `searchForWorkspaceRoot(frontend)` resolves to `frontend/` (measured), so `docs/` is outside `server.fs.allow` and the dev server would refuse the import; `vite.config.ts` stays untouched. `scripts/library/copy-catalog.mjs` runs as `prebuild`, the copy `public/library/catalog.json` is committed (a `lane-run probe` server starts vite without npm), and the test fails when it drifts.
- Counts on the cards are read from each package's top-level `metamodels` and `models`; the fetched text is kept and reused by the clone.
- `importFromText(content, name, date, clone?)`: with `clone`, the name given, unique by ` (1)`, ` (2)` against the store and the stored list, `_clonedFrom` on the DProject entry of the blob, and the call awaits the transaction and returns the new id. Without it, behaviour is unchanged: `AllProjects.tsx:72` passes the dropped file's name (`x.jjodel`), so honouring `name` for every caller would have renamed dropped projects.
- Probe `scripts/probe/library-gallery-clone.ts` (port 3098, 1440×900, one context): 53 checks at `d8ed13f1c` (the closing report said 54, a miscount), ALL GREEN, no page error. For each entry: modal prefilled with the label (Graph typed «My Graph»), new id ≠ file id, name in store and stored record, `_clonedFrom` = catalog id before and after explicit save + reopen, metamodels/models/objects equal to the file's, before and after reopen, one node per object in each default editor. A second Library clone is «Library (1)».
- Megamodel (open question 2): **confirmed loss**. A package with one user-defined edge, cloned: `getSerializedMegamodel(newId) = undefined`, `getSerializedMegamodel(oldId)` = 1 edge. Not a one-line fix (the edges hold artifact ids the import renews), so ticket in the inbox, not fixed here. No gallery clone loses anything today (`edges: []`).
- A probe pitfall, recorded: an `evaluate` started while «Clone & open» reloads the page can hang past the poll deadline; the probe races each evaluate against 5 s and waits for the URL first.
- Screenshots: `assets/library-gallery/templates-page.png`, `templates-modal.png`, `cloned-familiesPersons.png`, and `projects-page.png` as the reference (retaken after the visual check, below).

### Visual check fixes (`3fa4b921a`)
The chat's check on the three screenshots, three items, each measured:
1. **Modal.** Not a styling defect. At rest the dialog measures opacity `1`, z-index `1001` over the overlay's `1000`, background `rgb(255, 255, 255)`, and it is the element on top at its centre (`elementFromPoint`). The old screenshot was taken during its 200 ms `slideUp` (`create-project-dialog.scss`). The probe now waits until the dialog's and the overlay's animations have finished, then checks those four values and the prefilled name before the screenshot.
2. **Page shell.** `Dashboard` gives every page except `active === 'All'` the `.dash-content.user` panel: white, padding 40px, `margin: auto 20px`, so vertically centred (Templates title at y=249, panel at y=185). Templates now passes `style={'projects-view'}` (appended to the shell's classes; `.dash-content.projects-view` overrides `.user` by source order, `dashboard.scss:518` after `:462`) and uses the Projects page's `dashboard-main-content` and `dashboard-cta-row`/`dashboard-page-title`, with the one-line subtitle in the row's right slot. Measured on both pages: title at (264, 74), content at (264, 136), main padding 24px. `Dashboard.tsx` is untouched and no wrapper was added; the page's own header styles were removed.
3. **Popups.** The probe closes the Quick Tip and the donation banner before every screenshot, three passes, because the banner shows 30 s after load (`useDonationBanner.ts`). It uses a DOM click: in the project editor the banner sits under the right properties panel, where a pointer click cannot reach its close button. This is an existing overlap, not touched here.

Probe after the fix: 55 checks, ALL GREEN (the 53, plus the shell check and the dialog check).

Found while checking, not fixed (ticket in the inbox): the app-bar Basic|Advanced control shows Basic on Templates while `localStorage` holds `advanced`. Redux `state.advanced` drops to false on any navigation from All Projects to another dashboard page, Explore included, with no reload: 4 of 4 runs, true for 20 s and then false from the first sample. The Templates screenshot therefore shows Basic; the cloned project shows Advanced.

### Decisions taken (unattended)
1. `Library.ecore` extended with writers (a copy in the gallery sources; the fixture is untouched): the prompt asks for 2 writers, the fixture has none.
2. Catalog `source` of the five entries points at the gallery copies; Library's stale note replaced.
3. P13 hook refuses docs and code in one commit: each slice is a code commit plus a catalog docs commit (4 commits instead of 2).
4. Commit 2 subject shortened to «feat(library): clone gallery projects (S2, …)» (§6.2, 72 characters).
5. `name` honoured only with the new `clone` argument (see above), and the clone resolves with the new id.
6. Catalog copied at prebuild and committed, with a byte-for-byte test; `package.json` gains `prebuild`.
7. Commit 2 touches 8 files (> 5, rule 19): taken as recommended under RC-21/RC-25.
8. The probe file is committed in `scripts/probe/` with S2.
9. Visual fixes: the Projects shell is reached through `Dashboard`'s existing `style` prop, not by editing `Dashboard.tsx`; the mode-toggle defect is ticketed, not fixed (out of the lane's files).

### Decisions awaiting Alfonso
None of the RC-26 list. The Templates page now shows the gallery (decision 3 of §0, already recommended yes).

## Gallery viewpoints S1b (P-2026-10-18-2150)

Tree `~/jjodel-w-gallery`, branch `library-gallery`, on `cc0b9af61`. Executor Claude Opus 5.5 (`claude-opus-5-5`), effort high. Code commit `2925b96d8`. Everything below is **measured** (probe logs under `~/.jjodel-lanes/P-2026-10-18-2150/`).

### The derive path in the build
- `build-gallery.ts`, after the M1 imports and before the editors open: for each row of `DERIVE`, a `page.evaluate` imports `utils/deriveViewpoint.ts` and `derive/notations.ts`, takes the dialog's table (`dialogPrefill` with `projectViewpointIds()`), checks `canDerive`, and calls `createDerivedViewpoint(metamodelId, { notation, classRoles })`. No IR is written by the build; `deriveViewpoint.ts`, `notations.ts` and the editors are untouched.
- Derived (names by the existing `<metamodel> / <notation label>` rule): Library `Library / Generic`; Families and Persons `Families / Generic`, `Persons / Generic`; StateMachine `statemachine / State machine (UML statechart)` then `statemachine / Generic`; Graph `Graph / Generic`; Shapes `Shapes / Generic`. ALL GREEN, no page error.
- **Statechart table.** `canDerive` accepts the prefill: `from: 'signals'` (the binder over names and structure, no stored binding), `State → node`, `Transition → transition`. Initial and final are values of the `StateKind` enum on `State.kind`, not classes, so no class takes those roles. The fallback the build declares (`State: node`, `Transition: transition`) was not used (`completed: false`).
- **Active viewpoint.** The project format records one: `activateViewpoint(<first derived id>)` (`utils/lastViewpoint.ts`) writes `project.activeViewpoint` and the root `viewpoint`, both in the exported store; the top-level record carries `activeViewpoint` too. The project-wide active viewpoint is the first derived one: the statechart for StateMachine, `Families / Generic` for Families and Persons. The clone (text replacement of ids) keeps it: on open, the root `viewpoint` is the clone's copy of the first derived viewpoint, 5 of 5.

### Test, card, probe
- `gallery.test.ts`: 42 green (31 before; the «no viewpoint» test replaced by the expected names, plus `derivedFrom` = the metamodel's id and `derivedNotation` in each `_state` with `ir.generated.notation` on every view, the first one active in record, project and root, and the statechart table). Bench: the pre-S1b `graph.jjodel` restored gives 3 red (the three Graph viewpoint tests); restored.
- Templates card: «N metamodels · N models · N viewpoints». The viewpoints counted are the record's `viewpoints` whose `_state.derivedFrom` is set in the package store (decompressed with `U.decompressState`), so only derived ones count. Measured: Library 1, Families and Persons 2, StateMachine 2, Graph 1, Shapes 1.
- Clone probe (port 3098, 1440×900, light): 76 checks, ALL GREEN, no page error. Added: the derived viewpoints equal the file's, the clone opens on the first, the card's count line; per model, the toolbar's viewpoint picker (`.toolbar-viewpoint-trigger`, then the option by name) switches to the derived viewpoint of its metamodel, the trigger reads its name and nodes render; screenshots `assets/library-gallery/viewpoint-<id>.png` (Persons as `viewpoint-familiesPersons-Persons.png`), `templates-page.png` and `templates-modal.png` retaken.
- Nodes under the derived viewpoint (objects in brackets): Library 5 (9), Families 2 (11), Persons 9 (9), StateMachine 7 (10), Graph 5 (10), Shapes 1 (4). Generic draws a contained object as a row of its container's compartment, so the default editor's «one node per object» no longer holds; the probe checks `nodes > 0` and records the counts.

### Observed, not changed (derive code out of scope)
1. **Graph, «edges as edges» not met.** `Graph / Generic` draws the five `Edge` objects as rows of `Graph_0`'s compartment; the arcs drawn are the `nodes` containment from Graph to the four Nodes. Drawing `Edge` as an arc needs a role notation (e.g. a statechart with `Node = node`, `Edge = transition`); `Edge.target` is multi-valued.
2. **Families rows.** The compartment rows of the two Family nodes read `Member_0`, `Member_1`, not the members' names: the row label of the Generic derivation for a class without a `name` attribute.
3. **StateMachine layout.** The `Heater` container is drawn as a node with arcs to its states; at 1440×900 the `Broken` state sits under the minimap.
4. `cloned-familiesPersons.png` is not retaken: the probe step that took it (the default editor) is replaced by the viewpoint screenshots. The file stays as S2 left it.

### Decisions taken (unattended)
1. Active viewpoint set with `activateViewpoint` before the editors open, so the exported layout is the active viewpoint's.
2. Families and Persons: the project-wide active viewpoint is `Families / Generic` (first metamodel); the probe switches Persons by the picker.
3. StateMachine: statechart derived first (active), Generic second.
4. Graph stays on `generic`, as the prompt names it, with the gap of observation 1 recorded rather than closed by a second notation.
5. The card counts derived viewpoints from the package store, not from the record's `viewpoints` length.
6. The clone probe (`scripts/probe/library-gallery-clone.ts`, outside the DOVE list) is extended in the code commit; its «one node per object» check is replaced as above.
7. Code commit of 9 files (> 5, rule 19), as the prompt's DOVE list plus the probe.
8. Commit subject «…, S1b (P-2026-10-18-2150)»: the hook counts the suffix only in the ` (P-…)` form.

### Decisions awaiting Alfonso
None of the RC-26 list. Observation 1 (Graph edges as arcs) is a design choice for a later slice: a role notation on Graph, or a Generic that draws reference-holding classes as arcs.

## Gallery templates and examples (P-2026-10-18-2300)

R-LIB-9 on the branch: S1b recorded (`739dc4ca8`) and reverted (`7672cd683`); two tiers, versions, deep link; one
hand-written IR viewpoint per template metamodel. Commits: catalog v2 `b08ce9444`, structure `8602e2c4f`, catalog
sha256 `81c5bc7b3`, viewpoints `23fe96d80`. Screenshots in `assets/library-gallery/` (uncommitted, RC-17).

### Structure (`8602e2c4f`)

- `public/library/gallery/<id>/1.jjodel` for `library`, `families-persons`, `state-machine`, `graph`, `shapes`
  (templates) and `turnstile`, `petri-producer-consumer` (examples, byte copies of `public/examples/codegen/`, which
  stay). Sources in `scripts/library/gallery/<id>/`; the examples' `source` names the codegen file and its build script.
- Catalog `version: 2`: `tier`, `version`, `versions[{n, file, published, sha256, notes}]`; `package` is gone from the
  gallery entries (the version's `file` replaces it).
- `src/library/galleryRef.ts` (new, pure): `parseGalleryRef`, `resolveGalleryRef`, `galleryRefOf`, `currentVersion`.
  Route `#/templates/:ref`; `_clonedFrom` is `<id>@<n>` (written by the page, `projects.ts` unchanged).
- build-gallery refuses an existing version file unless `GAL_REWRITE=<id>@<n>`.

### Template viewpoints (`23fe96d80`)

Written in build-gallery as the probes write theirs, then `activateViewpoint` on the first. Measured by the clone probe
from the DOM, 112/112 on port 3105 (1440×900, light):

| Template | Viewpoint(s) | Measured |
|---|---|---|
| graph | Graph | 4 circles A–D, Graph not drawn, 6 open-arrow arcs A>B B>C C>D D>A A>C A>D, 0 rows, 0 containment arcs |
| library | Library | 3 Book (rounded), 1 Magazine (dashed rect), 2 Writer (ellipse), 2 Member (stadium); 3 `author` + 2 `borrowed by` arcs |
| state-machine | StateMachine | 6 States; Idle and Warmup filled dots, Off double circle; Running a frame holding Warmup, Steady; 3 arcs, labels `power`, `power [temp > 60]` |
| families-persons | Families (active), Persons | frames March (4) and Sailor (5) by `lastName`, Members by `firstName`; Male rect ×5, Female stadium ×4 by `fullName` |
| shapes | Shapes | frame `Sketch` holding sun, wheel (circles) and house (72×72 rect) |

Every vertex is inside the canvas and clear of the minimap after the fit, for all five.

- `State.kind` with `eq` on `$kind.value` against the literal name works on the imported model (the slot holds the
  literal, R-FRM-3; the comparison is `String(l) === String(r)`).
- An object-as-edge does not fan out over a multi-valued target (`irEdgeViews.ts:306-323`). Graph fallback applied:
  `Edge.target` single-valued in the gallery's `Graph.ecore`, the two-target edge split in two. The fixture is untouched.
- No edge view hides a reference edge: `State.outgoing` and the four `Member.family*` opposites are drawn clear.
- The fit (`fitView`, maxZoom 1) does not avoid the minimap. The build places the vertices with the drag's write
  (`syncPositionToJjom`) in short layouts (≤ 330 px tall), each fitted before the export.

### Examples, observed (not edited)

- Both carry only `Default`: they open on abstract syntax, and the card reads `0 viewpoints`.
- turnstile (`turnstile.png`): State, Event and Transition objects as boxes with reference arcs, the layout taller than
  the canvas at 100 %, and `tp : Transition` under the minimap.
- petri-producer-consumer (`…-demoNet.png`, `…-producerConsumer.png`): Arcs drawn as boxes between Places and
  Transitions, a layout wider than the canvas, and `deliver` under the minimap.
- As examples of "a whole language" they show no notation yet. A viewpoint lane would be their version 2.

### Template details, observed

- Off's double border (width 4, `double`) renders as two thin rings at 32 px.
- Warmup's outside label touches Running's bottom edge.
- `fault` has no trigger, so its arc has no label, as specified.
- Broken keeps its validation dot (deliberate).

### Decisions taken (unattended)

Each is ratified as recommended, unattended.

1. The ids as the chat proposed them.
2. `src/library/galleryRef.ts` added outside the DOVE list, so the ref parser runs in the bench (§5).
3. Families and Persons: two viewpoints, `Families` active on open. The project has one active viewpoint (the root
   `viewpoint`), so the probe reaches `Persons` through the picker.
4. The Graph fallback.
5. Layout by placement in the build. The build context is 1440×900, with a fit before the export.
6. `package` removed from the gallery entries; `GalleryEntry.package` stays optional.
7. Version 1 of the templates rebuilt in step 2 rather than bumped. It never left the branch.
8. The catalog sha update is its own docs commit (P13), so there are five commits instead of four.
9. The probe gained `CLONE_ONLY`.
10. A deep link to a non-current version opens its dialog, but only the current version has a card.

### Decisions awaiting Alfonso

None of the RC-26 list.

### Correction round 1

Commits `d3e02370e` (catalog sha256) and `ba7eb0f33`. Version 1 of library, families-persons, state-machine and graph
was rebuilt; it is still unpublished. shapes is unchanged. Clone probe 132/132 on 3105; gallery.test 49; typecheck,
build and check:scripts exit 0.

1. **Cut nodes.** The old check measured the React Flow pane, which runs on under the properties panel. The new check
   needs two things. The element under each corner of a vertex, inset 2 px, must be that vertex. Its box must lie
   inside the visible canvas (it ends at x = 1083 at 1440×900, found along the pane's middle row) and clear of the
   minimap.
   - **Bench on the previous packages:** it fails graph C (corners `1010`), library «Literary Review» (`1010`) and
     Persons David (`1010`), Dylan (`0000`) and Kelly (`1010`). Those are the vertices the chat saw cut.
   - **Cause:** the fit centres on the whole pane, not on the visible canvas. At 1440×900 a layout stays visible
     only when it is at most ~560 px wide. Every layout is now at most 520 × 410.
   - **Persons:** males then females, in rows of three.
   - **Families:** the two frames stacked.
2. **library.**
   - Members and the magazine sit above the books and the writers below. The `borrowed by` arcs go up and the
     `author` arcs go down, both straight. No label overlaps another label or a vertex (checked).
   - The orange dot on J. R. R. Tolkien is a Conformance warning, `invalid_name_format`: «Object "J. R. R. Tolkien"
     can only contain letters, digits, spaces, apostrophes, or the $ _ symbols». The dots in the name trip it.
     Renaming the writer in the sample (e.g. «J R R Tolkien») would remove it. Not done: not asked.
3. **state-machine.**
   - **a. Final state:** now a 28 px UML bullseye, a ring around the marker registry's `dot-large`, label below.
   - **b. Warmup:** its `kind` in the sample is `initial` (`<substates name="Warmup" kind="initial"/>`), so the
     filled dot is right. Frame padding is now 24. The label renders above the dot and clears the bottom edge by
     more than 8 px (checked).
   - **c. Arcs leaving Running:** both leave Running itself. `stop` and `fault` have `source="s_running"`, and the
     probe's source is Running's frame. The gap is not specific to them: every arc in every template ends 4–5 px off
     its node. React Flow ends an edge at the outer edge of its handle, and the handle is an 8 px `.mm-anchor`
     centred on the border. Closing the gap is an editor change, so it is asked, not done. The probe records the gap
     per arc and fails only beyond 6 px.
4. **graph.** The Edge view uses `curve: 'arc'` (R-VP-22). Single arcs are straight, and the A>D / D>A pair is bowed
   apart, which is the parallel pair the screenshot showed. The model has no C>A. Pairs between the same two vertices
   are checked to be at least 16 px apart.
5. **Templates page.** Each card has the title, then `<id>@<n>` on its own line, mono, nowrap with an ellipsis. All
   seven cards are checked for one line each, nothing cut.

**Open item, not a defect of this lane.** The two examples have no viewpoint of their own and open on abstract syntax,
so they do not yet meet R-LIB-9's example tier. Their viewpoints come in a separate lane from the chat.

### Correction round 2

Commits `86ff4e69c` (catalog sha256) and `4a3c1db49`. A template opens with no conformance warning.

- The library writer «J. R. R. Tolkien» is renamed «JRR Tolkien» in `scripts/library/gallery/library/sample-Library.xmi`.
  Its layout key in PLACES and the probe's expected arc are renamed with it. library@1 was rebuilt with
  `GAL_REWRITE=library@1`; it is still unpublished.
- **New probe check:** a template draws no problem badge (`.node-problem-dot`). The one exception is state-machine's
  Broken, its deliberate error.
  - **Bench:** on the previous library@1 the check fails on «J. R. R. Tolkien: node-problem-dot--warning |
    Conformance».
  - **After the rebuild:** `CLONE_ONLY=library` passes 27/27, with no badge.
  - **The other templates:** this round did not rerun them. In round 1's full run they had no problem dot beyond
    Broken.
- gallery.test 49; typecheck, build, check:scripts and typecheck:scripts exit 0. library.png was retaken.
- **3c:** the Recommended answer was adopted. The handle gap is untouched; a ticket is filed in
  `docs/log-inbox/notation-library.md`.

**Templates page layout:** not part of Alfonso's visual OK of 2026-10-19 16:41; a redesign from the design handoff (`docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md`, trunk) follows in other lanes.

## Example viewpoints (P-2026-10-19-0300)

R-LIB-10: the two examples get their hand-written viewpoints before `library-gallery` is merged. Version 1 of both is
still unpublished, so it is rebuilt (`GAL_REWRITE=<id>@1`), not superseded.

### The metamodels and the models, as found

**turnstile, DemoESM** (one model, `demoESM`, 10 objects):

- `State`: `entry : Action [0..*]` (an attribute, a primitive type), `transitions : Transition [0..*]` (a composition).
- `Initial` extends State, `Terminal` extends State; neither adds a feature.
- `Transition`: `guard : Expression [0..1]`, `effect : Action [0..*]`, `nextState : State [0..1]`, `event : Event [0..1]`.
- `Event`: `name : EString`. No enum. No class has a `name` attribute but Event: a state's name is the object's own.
- Objects: `locked : Initial` (transitions tc, tp, ts), `unlocked : State` (tu), `off : Terminal`; events coin, push,
  stop; tc locked→locked on coin, effect `model.[coins] := model.[coins] + 1`; tp locked→unlocked on push, guard
  `model.[paid]`, effect `model.[coins] := 0`; tu unlocked→locked on push; ts locked→off on stop. No state has an entry
  action. The transitions live in their state's `transitions`; the states and the events in the model.

**petri-producer-consumer, DemoPetri** (two models):

- `PNode` (abstract); `Place` extends it, `tokens : EInt`; `Transition` extends it, `guard : Expression`.
- `Arc`: `weight : EInt`, `src : PNode`, `tgt : PNode`; `InhibitorArc` extends Arc. No container class: every object
  sits in the model, so there is no net to hide.
- `demoNet` (13): places p1 (2 tokens), p2, p3, lock (1); t1, t2 (guard `p3.[tokens] < 1`), t3; arcs a1 p1→t1,
  a2 t1→p2 (weight 2), a3 p2→t2 (weight 2), a4 t2→p3, a5 lock→t3; inhibitor i1 lock→t2.
- `producerConsumer` (19): places ready (1), produced, buffer, idle (1), busy; produce, deliver (guard
  `buffer.[tokens] < 2`), take, consume; ten arcs, none weighted, no inhibitor.

### What was built

`build-gallery.ts` writes the two viewpoints with the IR, as the templates' are (the same `BUILD_VIEWPOINT`), makes
each the active one, places the layout (PLACES, by object name: the label lookup now falls back to the object's own
name) and downloads the project.

- **Turnstile statechart**, 6 views.
  - `State`: rounded 120 × 48, name centred. An `entry` compartment draws `entry / <action>` at 11 px as a second line,
    visible only when `$entry.value` exists.
  - `Initial`: the same, plus `entry: 'dot'`, the filled dot with a short arrow onto its left border. This is the
    Recommended mark (R-VP-22), not colour.
  - `Terminal`: the bullseye of the state-machine template, 28 px, name below.
  - `Event`: not drawn (`visible: false`).
  - `Transition`: an arc from `container` (the owning state: `transitions` is a composition) to `$nextState.value`,
    `curve: 'arc'`. Labelled by a template `[event, ' / ', effect]`, where the event is one hop away
    (`$event.value.$name.value`). A priority-1 view, when the guard exists, adds ` [guard]`: a template drops the
    literal before an empty value, but not the `]` after one.
  - No reference edge is left to draw clear. Transition is an object-as-edge and Event is hidden, so their edges go
    with them (measured: 4 arcs, none clear).
- **Petri net**, 5 views; both models use it.
  - `Place`: circle 44, name outside below. Marking: `dot` / `dots-2..4` for 1–4 tokens, the number centred for more.
  - `Transition`: `form: 'bar'` 10 × 40, black, no `barThickness`, so it stays upright and is never turned. Name below,
    guard above, italic 11 px, only when set. Above, not beside: the arcs leave the bar's sides.
  - `Arc`: `$src.value` → `$tgt.value`, open arrow, `curve: 'arc'`. A priority-1 view labels `$weight.value` when it is
    above 1.
  - `InhibitorArc`: the same, ending in `hollowCircle`.
- **Layouts.**
  - Turnstile: unlocked right of locked, off below it.
  - demoNet: the flow left to right, the lock below right.
  - producerConsumer: two diamonds, places left and right, bars top and bottom; deliver and take on top with the
    buffer between them. A first layout, with the bars left and right, put deliver's guard on two arcs; a second, with
    deliver at the bottom, put it on the two arcs meeting at its top. Both were rejected on the screenshot.

**How an example is opened.** The codegen example is stored as the browser stores a saved project (`Offline.import`:
its record in `localStorage.projects`) and opened. It is not imported with `importFromText`, because that renews every
id, and the generated code names the elements by id (the `$ID` table). The first build imported it, and the
byte-for-byte test failed on that table alone, which is the bench of that test.

**How the files now differ from `public/examples/codegen/`.** Those two files are untouched, and their README still
points at them. Each gallery copy keeps every id of its codegen example and adds:

- one `DViewPoint` and its 6 (turnstile) or 5 (Petri) `DViewElement`s;
- `layoutByViewpoint` on the drawn vertices (3; 16);
- the project's `viewpoints`, `activeViewpoint`, `viewpointsNumber`, `lastModified`, `version`, `clonedCounter`;
- the fields the version fixer writes on Default when the file is opened (`defaultVSize`, `snap`, the edge offsets and
  sizes, `version`).

Nothing else changes: no class, object, value, template or scenario.

### Checks

- **Gates.** typecheck, build and `check:scripts` exit 0. `gallery.test` passes 58: 49 before, one removed, four
  viewpoint tests for the examples, six example tests. With the codegen example tests, 84/84.
  - `gallery.test` (per example) now checks:
    - one non-Default viewpoint, named as above, with its view kinds;
    - active on open (record, project and root);
    - Default kept beside it;
    - the sha256 equal to the catalog's;
    - the stored scenarios kept.
  - The old test «packages each example unchanged, byte for byte» is removed: the example is no longer a copy.
- **Code generation.** It is compared with the templates read from each file:
  - turnstile: 12 templates on demoESM;
  - Petri: 13 templates on each of demoNet and producerConsumer.
  - The template list and the text generated by `main` and by `engine` (the templates that take no argument) are
    equal, byte for byte, to the codegen example's, errors included (none). The test is in `gallery.test`.
- **Clone probe** (port 3098, 1440×900, light), `CLONE_ONLY=turnstile,petri-producer-consumer`: 62 PASS, 0 FAIL. Per
  model:
  - vertices, forms, sizes, arcs, labels;
  - 0 rows, 0 containment arcs;
  - every vertex visible after fit (the corner check, clear of the minimap), and the initial mark inside the canvas;
  - no label over a label or a node;
  - arcs leaving their source (0–1 px);
  - no badge;
  - the inhibitor's end a hollow circle, every other end an open arrow.
  - Screenshots: `turnstile.png`, `petri-producer-consumer-demoNet.png`, `petri-producer-consumer-producerConsumer.png`.
- **Simulation**, in the model tab's panel:
  - Turnstile: Reset, coin, coin, push ends in `unlocked`, highlighted, its pill 1 (`turnstile-sim.png`).
  - producerConsumer: Reset and three steps; the third asked a choice and took `produce`. It ends with produced,
    buffer and idle marked (`petri-producer-consumer-sim.png`).
- **Full probe**, all seven entries, once after the rebuild: 176 PASS, 0 FAIL, ALL GREEN (the templates still green).

### The marking during a run

The simulator draws its own marking on a place:

- on a hand-written view, a corner pill with the run's count, 0 included (`SimNodeRunState`, `ObjectNode.tsx:937`);
- on a derived view, an inside dot, chosen only when the view carries `generated`.

It never reads the `tokens` attribute. The IR cannot tell that a run is showing the model. `marked` is `tokens !== 0`
in the run (`netStep.isMarked`), and no other predicate reads the run.

The Place view therefore hides its drawn marking where the run marks the place (`not marked`). Measured after Reset
and three steps:

- produced, buffer and idle show only the run's pill;
- `ready`, which the run emptied, still shows its initial dot beside the pill «0» (on `petri-producer-consumer-sim.png`).

Removing the drawn marking from a place the run has emptied needs an editor change. See the decisions below.

### Decisions taken (unattended)

1. The turnstile run is coin, coin, push, not the prompt's coin, push. `paid` is `coins >= 2` (the README), so one
   coin and push is a discard and the run stays in locked (measured: «push: discarded, tp guard false»).
2. The examples are opened from the stored record with their own ids, not imported (see above), so that the generated
   text is identical byte for byte.
3. The drawn marking is hidden under `not marked`, the best the IR allows today.
4. A transition's guard sits above the bar and its name below, not beside the bar.
5. No `decisions.md` row is written: the file is outside this lane's DOVE.

### Decisions awaiting Alfonso

1. **The drawn marking beside the run's.** The view does not hide a place the run has emptied (`ready` above), and
   closing that needs an editor or IR change, which is outside this lane. Recommended: a lane of its own adds an IR
   predicate true while a run shows the element's model (additive, of the `marked` family). The Place view then hides
   its drawn marking under it, and petri-producer-consumer@1 is rebuilt while it is still unpublished.

## IR predicate for a running simulation (P-2026-10-19-0930)

Closes the decision the previous section left awaiting Alfonso (option 1, «ok con la prima», 2026-10-19 09:20). The IR gets
`{ op: 'simActive' }`, true on an element while a simulation run is active on the model it belongs to. The Petri
example's Place view draws its tokens under `not simActive`. Commits `50ab1d74c` (IR), `15fac4bfa` (catalog sha256),
`e1bb5db65` (gallery and probe).

### Discovery

- **How the marking reaches the IR.** `makeReadCtx` (`irReadCtxLproxy.ts:65`) builds the draw backend with the run-state's
  `isSimActive` injected as `isMarked`. Despite its name, `isSimActive` answers «the run marks this object»
  (`simRunState.ts:212`). The lproxy backend delegates `isMarked` and `getPresentation` to draw.
  `irReadCtx.ts` imports nothing, by contract (R-MK-4).
- **Where the run state lives.** `simRunState.ts` keeps one run per model in `runs`, keyed by the DModel id
  (`collectModelObjectIds`, `simBridge.ts:140`, compares the `father` walk's DModel to it). `getSimRun(modelId)`
  (`:241`) says whether a model has a run. The panel starts a run with `simReset(modelid, …)` (`SimulationPanel.tsx:642`)
  and ends it with `simClear` (Stop `:621`, `:632`, `:484`; unmount `:438`).
- **The channel.** A run's start and stop already move the `'mark'` version:
  - `simReset` bumps always (`simRunState.ts:285`);
  - `simClear` bumps when a run existed (`:502`).

  So `simActive` declares `'mark'`, not a channel of its own. The consumers gate on `channelsInUse.has('mark')`:
  `irResolve.ts:89` and `:172`, `useIRContainment.ts:136`, `useIRFormView.ts:104`. A view that reads `simActive` also
  re-resolves at every step, as a `marked` view does.
- **Backends.** Two `ReadCtx`, switched by `IR_READ_BACKEND = 'lproxy'`: draw (`makeDrawReadCtx`) and lproxy, which
  delegates every non-slot read to draw. Fifteen production call sites build a bare draw context (instance table,
  draw adapters, Jodie). They inject neither the marking nor the run, so both read false there.
- **Where `Predicate.op` is enumerated.**
  - the union, `irTypes.ts:47`;
  - `compilePredicate`, `irCompile.ts:219`;
  - `VALID_PREDICATE_OPS`, `irValidate.ts:121`, a `Record` over the union, so the typecheck forces the entry;
  - `formatNode`, `conditional.ts:170`;
  - `PREDICATE_KIND_OPTIONS` and `forPredicateKind` (`predicateDefaults.ts`);
  - the body switch of `PredicateBuilder.tsx`, whose `default` is pinned to the comparators.

  There is no serializer: the IR is JSON on `view.ir`. `node.[marked]` (`pathExpr.ts`) is a presentation attribute,
  not this operator. The IR spec (`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`) names `marked` and is not
  updated here, because it is outside DOVE.
- **The name.** `simActive` is free as an operator (grep). The run-state function `isSimActive` means the marking, as
  above. It is not renamed (rule 2), and the new `ReadCtx` member is called `isRunActive` so the two do not mix.
- **The authoring surface, as found.** `marked` is not in the predicate builder's list: the slice that would add it
  (R-MK-9, M2) never landed, and the builder's `default` branch still says so. «Reads state» is a grouping of the
  simulator's I/O board editor (`SimBoardEditor.tsx:180`, device bindings), not of the conditional editor, whose list
  is flat. See decision 4.

### What was built

- `irTypes.ts`: `{ op: 'simActive' }`, no `path` in v1.
- `irReadCtx.ts`:
  - `ReadCtx.isRunActive?(elementId)`, optional (rule 11);
  - `makeDrawReadCtx` takes a fourth parameter, `hasRun(modelId)`, default false;
  - the element's model is found by walking `father` up to the DModel, bounded at 40 like `simBridge`'s walk.
    It is true on the model itself, its objects, nested objects and slots, and false on metamodel elements and orphans.
- `irReadCtxLproxy.ts`: `hasSimRun = id => getSimRun(id) !== undefined` is injected on both branches of
  `makeReadCtx`, and lproxy delegates `isRunActive` to draw.
- `irCompile.ts`: the branch declares `'mark'` and returns `ctx.isRunActive?.(id) === true`. That is total: a context
  without the reader reads false.
- `irValidate.ts`: `simActive: true`.
- `conditional.ts`: `sim active`.
- `predicateDefaults.ts` and `PredicateBuilder.tsx`: offered as «Sim active (run in progress)» after «Is of type…»,
  seeded as `{ op: 'simActive' }`, with no controls.
- `build-gallery.ts`: `NOT_MARKED` becomes `NOT_SIM_ACTIVE` (`not simActive`), used by the four marker rules and the
  «more than four» label.
- `library-gallery-clone.ts`, for the Petri example:
  - before Reset, the initial tokens and no pill;
  - after Reset and three steps, no drawn tokens and a pill on every place, ready included;
  - after Stop, the initial tokens back and no pill;
  - places are matched by object name, because a vertex's text runs on into the pill (`ready0`).

### Checks

- **Gates.**
  - Typecheck exit 0, build exit 0, `check:scripts` exit 0.
  - IR, viewpoint, UI and sim suites: 106 files, 2793 tests green. `irSimActive.test.ts` adds 16.
  - Gallery and codegen suites: 20 files, 404 tests green.
- **Code generation.** `gallery.test` compares the templates and the text of `main` and `engine` for both examples
  with the codegen examples', byte for byte, the same reference 0300 measured. The structural diff below leaves every
  class, object and value of the package untouched.
- **Mutation bench**, in place, restored with `cmp`:
  - compiler branch, 5/5 killed: always false (8 tests failed), always true (11), no channel (4), reads `isMarked`
    (8), drops `=== true` (1);
  - backends, 4/4 killed: lproxy without `isRunActive` (2), lproxy without the run check (2), a walk of one level (8),
    a walk that stops at the first object (7).
- **The package.** Decompressed and diffed against `18ce5cdf1`, ids normalised:
  - the Place view's IR differs only in its 5 `marked` → `simActive`;
  - the rest is the per-build ids of the viewpoint, its views and their points, and timestamps, as in 0300;
  - every layout is equal value for value.

  sha256 `79baa798…` → `9cffa7bd…`, in both catalogs.
- **Probe bench.** The new probe ran on the pre-change package: 39 PASS, 1 FAIL, on `ready` alone (`ready0:dots:0`, its
  dot beside the run's 0). The fix by name came after that run. It changes only how the places are named, not the
  failing clause.
- **Clone probe**, port 3096, `CLONE_ONLY=petri-producer-consumer`: 40 PASS, 0 FAIL.
  - Mid-run: `ready::0`, `produced::1`, `buffer::1`, `idle::1`, `busy::0`.
  - After Stop: `ready:dots`, `idle:dots`, no pill.
  - Screenshots: `petri-producer-consumer-sim.png` (retaken), `petri-producer-consumer-stopped.png`.
- **Full probe**, all seven entries: 178 PASS, 0 FAIL, ALL GREEN. That is 176 before, plus the two new checks of the
  Petri run. The screenshots it rewrote, other than the two above, were restored from a copy taken before this lane's
  probes, so 0300's closure assets are as 0300 left them.

### Decisions taken (unattended)

1. The operator keeps the prompt's name, `simActive`. The `ReadCtx` member is `isRunActive`, beside the run-state's
   `isSimActive` (the marking), which is not renamed.
2. It uses the `'mark'` channel: Reset and Stop already bump it (evidence above). As a result, such a view also
   re-resolves at each step.
3. The element's model is found by the `father` walk in the draw backend, and the run is asked by model id
   (`getSimRun`). `simRunState.ts` is unchanged.
4. The authoring surface. `simActive` is offered in the predicate builder's flat list, and its display text sits next
   to `marked`'s. No «Reads state» group is added, because that group exists only in the I/O board editor. `marked`
   stays out of the list: its M2 slice is outside this lane.
5. The subject of commit 1 says «an element's model», not «the element's model»: the prompt's subject is 73
   characters, and the hook caps it at 72.
6. In `build-gallery.ts`, `NOT_MARKED` is renamed `NOT_SIM_ACTIVE`. It is a constant local to the script, and its value
   is the change.
7. For the Petri example only, the probe ends its run with Stop and the `-stopped.png` screenshot. The turnstile run
   ends with Reset, as before.
8. Commit 1 touches 11 files and the lane 15, all in DOVE. There was no pause (rule 19), because the lane runs
   unattended on a declared list.
9. No Layer Impact Report. `viewpoint/ir/` is in §3.1's table, but none of this is in §3.2's trigger (RC-15 (2)),
   and nothing writes the D-layer.
10. No `decisions.md` row and no update to the IR spec: both are outside DOVE.

### Decisions awaiting Alfonso

None from the RC-26 list.
