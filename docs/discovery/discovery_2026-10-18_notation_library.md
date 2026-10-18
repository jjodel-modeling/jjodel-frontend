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
