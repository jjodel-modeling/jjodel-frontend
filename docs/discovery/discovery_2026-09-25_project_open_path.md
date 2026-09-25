# Discovery — the project open path, and the failures nobody catches (Phase 1)

Prompt-ID: P-2026-09-25-0030 · prompt `docs/prompts/claude_2026-09-25_0030_prompt_project_open_path.md`
Session: 0f25d054-ee25-44fe-9a20-be8ca0be9a57 (read from the harness scratchpad path)
Tree: `~/jjodel-open`, branch `open-path`, HEAD `14b7d5228` for the whole phase (the prompt commit on top of
`2dd17270b`). No other worktree touched; see §0 for the one side effect on `~/jjodel`'s Vite cache.
Executor: Anthropic Claude Opus 5.5 (as the session banner shows it).

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the
real files. "Measured" means a run in this phase on HEAD `14b7d5228` (dev server on 3003 serving this tree);
"read" means read from a file, a doc or git history. Served line numbers were mapped back to source by
fetching the served module (`curl http://localhost:3003/src/redux/reducer/reducer.ts`); the mapping is in §2.

**Open questions for Alfonso are in §7, before the Phase 2 proposal (§8).**

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Every way of opening a project goes through one function where a single `try/catch` can see both the migration and the dispatch. | **Holds for the function, falsified for the catch** (read + measured, §1). Every entry reaches `stateInitializer` (`reducer.ts:1478`) and inside it `SaveManager.load` (`reducer.ts:1570`), which runs both `VersionFixer.update` (`SaveManager.ts:56`) and `LoadAction.new` (`:57`). Two triggers lead there: a page load (`App.tsx:101`) and an in-page pathname change (`PathChecker.tsx:12` → `U.resetState`, `U.tsx:446-449`). The existing `try/catch` (`reducer.ts:1519-1578`) encloses the call, but sees only the migration: the dispatch is deferred (H2). |
| H2 | A `dispatch` that throws inside the reducer propagates synchronously to the caller of `dispatch`. | **Partly** (measured, §2.3). True of `store.dispatch`: redux 5.0.1 rethrows (`try … finally`), and `reducer` does not catch because `safeMode` is `false` (`reducer.ts:613`); a direct synchronous dispatch of a failing LOAD was caught by its caller, with the store unchanged. But nothing on the open path calls `dispatch` synchronously: `Action.fire` defers it through `setTimeout(…, 0)` (`action.ts:349`) or queues it into the open transaction (`action.ts:329-330`). Measured, `LoadAction.new` returns normally and the throw surfaces later as an uncaught page error. |
| H3 | After a failed load the store is usable, so a message plus a return to the project list is enough. | **Partly falsified** (measured, §3). On a page-load open (deep link, list click, reload, import-then-open) the store keeps the pre-load init state and a second open works. On an in-page open (browser history, hash edit) the store keeps the **dashboard's `DProject` stub** of the target: the loading flag can clear on that stub, the editor then renders an empty project, and **a save overwrites the stored project**: measured, 19 `idlookup` entries → 7, the metamodel and its model gone. After an earlier healthy open in the same page, the loading screen is not shown at all. |
| H4 | No real saved project dies on the reducer path today. | **Not established, and the known signatures do die** (measured on synthetic fixtures + read, §4). Server projects take the same path. A current-shape save without `NODES_RECOMPILE_labels`/`NODES_RECOMPILE_longestLabel`, at `version.n` 2.228 or 2.2, dies at `reducer.ts:777`; a save at 2.229 dies in `VersionFixer`. The population is not measurable from here; the 80-project corpus no longer exists (R-IRN-13). |

## Objective

Items 1-6 of the prompt: the open-path map with every catch on the way; the propagation of a throw at the
two classes of site, measured by each drivable entry point; the state after the failure; the population
at risk; a Phase 2 proposal with one catch upstream; the baseline gates. Out of scope and not touched: any
code, the `VersionFixer` steps, backfilling root fields, `frontend/src/examples/`, the smoke harness.

## Files read (full paths)

- `/Users/alfonso/jjodel-open/frontend/src/redux/reducer/reducer.ts`: `CompositeActionReducer` head and
  LOAD case (`426-555`), `reducer` and `unsafereducer` (`598-1101` whole), `_reducer` (`1153-1215`),
  `doreducer` (`1357-1376`), `setDocumentEvents` (`1421-1444`), `stateInitializer` (`1478-1596` whole)
- `/Users/alfonso/jjodel-open/frontend/src/redux/action/action.ts`: `1-420` (transaction machinery,
  `COMMIT`, `END`, `FINAL_END`, `TRANSACTION`, `AFTER_TRANSACTION`, `DO_AFTER_TRANSACTION_NOT_FOR_USERS`,
  `Action.fire`, `LoadAction`), `437-448` (`SetRootFieldAction` constructor)
- `/Users/alfonso/jjodel-open/frontend/src/components/topbar/SaveManager.ts` (whole, 194 lines)
- `/Users/alfonso/jjodel-open/frontend/src/redux/VersionFixer.tsx`: `95-156` (`setup` tail, `update`
  whole), `158` and the `LoadAction` site of `autocorrect` (`352`); no step body
- `/Users/alfonso/jjodel-open/frontend/src/api/persistance/projects.ts` (whole, 531 lines)
- `/Users/alfonso/jjodel-open/frontend/src/api/DTO/ProjectResponseDTO.ts` (whole), `.../api/DTO/GetAllProjects.ts` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/App.tsx` (whole, 255 lines)
- `/Users/alfonso/jjodel-open/frontend/src/pages/Project.tsx` (whole), `.../components/LoadingScreen/ProjectLoadingScreen.tsx` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/components/pathChecker/PathChecker.tsx` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/common/U.tsx`: `90-150` (`R`), `384-449` (`U.alert`,
  `decompressState`, `compressedState`, `resetState`), `2806-2812` (`getProjectID_URL`)
- `/Users/alfonso/jjodel-open/frontend/src/common/Log.ts`: `99-200` (`log`, `e`, `eDev`, `ex`, `exDev`, `eDevv`, `filterMessages` head)
- `/Users/alfonso/jjodel-open/frontend/src/common/ErrorPortal.tsx` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/components/Toast/toastDispatch.ts` (`40-125`), `.../Toast/ToastContext.tsx`
  (listener lines by search), `.../Toast/ToastContainer.tsx` (`18`)
- `/Users/alfonso/jjodel-open/frontend/src/redux/store.tsx` (`200-245`, `DState.init`, `init_editor` head),
  `.../redux/createStore.ts` (`1-10`), `.../joiner/classes.ts` (`452-505`, `RuntimeAccessible`; `2839-2841`, `DUser.getUser`)
- `/Users/alfonso/jjodel-open/frontend/src/joiner/ExecuteOnRead.ts` (`275-283`)
- `/Users/alfonso/jjodel-open/frontend/src/pages/components/Project.tsx` (`150-296`, `483-490`, `583-592`),
  `.../pages/components/LeftBar.tsx` (`120-150`), `.../pages/components/Navbar.tsx` (`495-505`, `1285-1300`,
  `1995-2004`), `.../pages/components/Dashboard.tsx` (`88-100`, `280-305`), `.../pages/AllProjects.tsx` (`55-80`)
- `/Users/alfonso/jjodel-open/frontend/src/index.tsx` (`1-80`), `.../vite.config.ts` (`1-60`),
  `.../scripts/smoke/states.ts` (`1-260`), `.../redux/__tests__/versionfixer_old_states.test.ts` (header, mocks)
- `/Users/alfonso/jjodel/frontend/node_modules/redux/dist/redux.legacy-esm.js` (`155-165`, `dispatch`), redux `package.json` (5.0.1)
- Docs: `/Users/alfonso/jjodel-open/docs/log-inbox/versionfixer.md` (whole),
  `.../docs/discovery/discovery_2026-09-24_versionfixer_old_states.md` (whole),
  `.../discovery_2026-08-05_legacy_view_census_real_projects.md` (`1-40`, `87-88`),
  `.../discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md` (`60-72`, `292-345`),
  `.../docs/decisions.md` (`1-200`, `860-900`, `950-960`, `1098-1108`), `.../docs/PROTOCOL.md` (P14, `274-290`),
  `.../docs/claude-code-log.md` (head).

## §0 Environment and method

**Server.** Vite on **3003**, serving `~/jjodel-open/frontend` through the P14 symlink to
`~/jjodel/frontend/node_modules`, created at phase start (`git status` empty before and after) and removed
at the end. 3000 (`~/jjodel`) and 3001 (`~/jjodel-release`) were already listening and were not touched.

**Side effect, declared.** The first start (00:32:29) used the default `cacheDir`, which through the
symlink is `~/jjodel/frontend/node_modules/.vite`: Vite logged `Re-optimizing dependencies because vite
config has changed` and rewrote `.vite/deps` — the cache the 3000 server of `~/jjodel` also reads. I
stopped it at once and restarted with a wrapper config in the scratchpad (`root` = this tree, `cacheDir` in
the scratchpad, everything else imported from `vite.config.ts` unchanged). From then on
`~/jjodel/frontend/node_modules/.vite/deps/_metadata.json` kept its 00:32:29 mtime (checked three times).
If the 3000 tab misbehaves on its next dependency request, restarting that dev server re-optimizes its
cache. P14 does not mention the shared cache; any symlinked dev server has the same effect (1610 ran 3001
the same way).

**Probes.** Three throwaway Playwright scripts in the scratchpad, not committed:

- `probe_0030_setup.mjs`: seeds the offline user as `scripts/smoke/states.ts` does, creates a project from
  the UI (`Healthy_0030`), opens it, clicks "New metamodel", saves with `SaveManager.save()`. Final fixture:
  `Pointer1790290235219_USER_2`, 19 `idlookup` keys, 1 `m2models`, 1 `models`, `version.n` 2.228.
- `probe_0030_fixtures.mjs`: builds variants in Node with the app's own `async-lz-string`, the project id
  rewritten per variant: **HX** healthy copy (target of the injected throws); **R3A** without
  `NODES_RECOMPILE_labels` and `NODES_RECOMPILE_longestLabel` (the two fields `4e767942d` added on
  2024-08-27, read); **R3B** the same with `version = {n: 2.2, conversionList: []}` (the highest step on
  2024-08-27 was `'2.1 -> 2.2'`, read at `0f52bb743`); **V1** `version.n` 2.229 (a save from a newer schema).
- `probe_0030_open.mjs`: one fresh browser context per scenario, `localStorage` seeded with all five
  projects, then an init script (no source edit) that traps `window.VersionFixer`, `window.DUser` and
  `window.SaveManager` as `RuntimeAccessible` assigns them (`classes.ts:464`, the decorator returns the
  same class, `:504`) and wraps: `VersionFixer.update` to throw `PROBE-0030 migration throw` when the state
  holds the target id (mode `mig`); `DUser.getUser` to throw `PROBE-0030 dispatch throw` when called with
  the loaded state, i.e. from the LOAD case at `reducer.ts:520`, inside `store.dispatch` (mode `disp`);
  `SaveManager.load` to record enter/return/throw. It also records `window` `error` and
  `unhandledrejection` events, and dispatches a probe toast at the moment of each failure plus a late
  control toast. "Loading screen ended" means `.project-loading-screen` absent for a poll after 3 s; 25 s is
  the limit.

**Positive controls.** `none:deep:H` and `none:deep:HX` (no injection) load in 3.1 s, 0 page errors,
store `projects: [<pid>]`, `ProjectsApi.isLoading` false. The late control toast renders in every
scenario, so a missing failure toast is a lost dispatch, not a broken probe.

**A probe defect, declared.** One edit of `probe_0030_open.mjs` dropped the `spa` branch header, so the
`h2` scenario fell through into the SPA body after recording its values (it then navigated to
`/#/project?id=H`, which I first could not explain). Every SPA run predates that edit; the `h2` values were
recorded before the fall-through; the branch was restored before the last run.

**Fonts.** 3× `403 (Forbidden)` per load, as known; not chased.

## §1 The open-path map (item 1, H1)

**The one function.** `stateInitializer` (`reducer.ts:1478`), project branch, read:

```
1510    let isProjectPage = windoww.location.hash.indexOf('#/project') === 0;
1519    try {
1522            const project = await ProjectsApi.getOne(pid);
1524            if (!project) {
1526                console.error('failed to get project', {project});
1527                return;
1529            let checkLoaded = (state: DState): boolean => {
1538                ProjectsApi.isLoading = false; // quits loading screen on project page
1557            if (!project.state) {
1564            else state = JSON.parse(await U.decompressState(project.state));
1568            recursiveCheck();
1570            SaveManager.load(state, project);
1577    } catch (error) {
1578        Log.eDevv('Failed to fetch projects', {error});
```

and `SaveManager.load` (`SaveManager.ts:41-58`), read: `:44` assigns `SaveManager.tmpsave`, `:45-54` pushes
`VIEWS_RECOMPILE_*` keys per view, `:56` `save = VersionFixer.update(save);`, `:57` `LoadAction.new(save);`.

**Triggers.** Two, both calling the same `stateInitializer`:

- **Page load.** `App.tsx:99-108`: `if (firstLoading) { firstLoading = false; stateInitializer().then(...);
  return <Loader/>; }`. Every UI open is a page load, because `R.navigate` sets the hash and reloads
  (`U.tsx:139-140`: `window.location.hash = hash; window.location.reload();`, with `if (true as any ||
  refresh === true)` at `:129`).
- **In-page pathname change.** `PathChecker.tsx:12`: `if(/*pathname === '/project' && */newRenders > 1)
  U.resetState();`, and `U.tsx:446-449`: `LoadAction.new({...DState.new(), 'isLoading':true});
  stateInitializer().then(() => SetRootFieldAction.new('isLoading', false));`. No UI control navigates to
  `/project` in-page (search below); the path is reached by browser back/forward and by editing the hash in
  the address bar of an open tab (a pasted share link `…/#/project?id=…` on the same origin).

Search for every navigation to the project page, read: `command grep -rn "project?id\|'/project\|…"
frontend/src` → `Navbar.tsx:1297`, `LeftBar.tsx:132`, `ActivityItem.tsx:72`, `GroupedActivityItem.tsx:23`,
`pages/components/Project.tsx:195` (all `R.navigate`), `shareUtils.ts:12` and `Dashboard.tsx:94` (link
strings), `RowViewSmoke/index.ts:475` (dev fixture). Positive control: the same search returns
`PathChecker.tsx:12`, which it should.

| Entry point | Where | Chain to `VersionFixer.update` and to the LOAD dispatch | Sync/async at each hop | Catches on the way (what logs, `isLoading`, what the user sees) |
|---|---|---|---|---|
| Deep link / share link / URL typed in a new tab | `App.tsx:101` | first render → `stateInitializer` → `await getOne` → `await decompressState` → `SaveManager.load` (`reducer.ts:1570`) → `VersionFixer.update` (`SaveManager.ts:56`) → `LoadAction.new` (`:57`) → `Action.fire` → `setTimeout(()=>storee.dispatch({...this}), 0)` (`action.ts:349`) or queued (`action.ts:329-330`) and flushed by the 300 ms `COMMIT` interval (`reducer.ts:1443`) → `FINAL_END` → `CompositeAction.fire` → `setTimeout` again → `store.dispatch` → `reducer` (`:598`) → `unsafereducer` (`:632`) → `_reducer` (`:1153`) → `doreducer` (`:1357`) → `CompositeActionReducer` (`:426`), LOAD case `:518-532` → back in `unsafereducer`, recompile passes `:640-1098` | async up to `SaveManager.load`; `SaveManager.load` and `VersionFixer.update` sync; LOAD dispatch in a later macrotask | (1) `stateInitializer` catch `:1577-1578`: logs `Failed to fetch projects`; does not touch `isLoading`; user sees "Loading Project..." forever. Sees only the migration. (2) `reducer` catch `:621-629`: dead, `safeMode = false` (`:613`). (3) `DO_AFTER_TRANSACTION_NOT_FOR_USERS` per-callback catch (`action.ts:249`): not reached on a reducer throw. (4) No `window.onerror`, no `unhandledrejection` handler (search below). (5) `Try` boundaries (`App.tsx:129-187`, `Try.tsx:104,134`): render errors only. |
| Reload of the current project | browser reload | same as deep link | same | same |
| Project list card / row / gallery click, "Open", "Repair & open" | `pages/components/Project.tsx:194-196`, `:292`, `:486`, `:589`, menu `:345-347`, `:546-548`, `:619-621` | `R.navigate('/project?id=…'[+'&repair=1'])` → reload → as deep link. With `repair=1`, `VersionFixer.update` also runs `autocorrect(s, false, false)` (`VersionFixer.tsx:125-126`, `:153`) | as deep link | as deep link |
| Left bar, recent projects, activity items | `LeftBar.tsx:132` (followed by `U.resetState()` `:133`), `Navbar.tsx:1297`, `ActivityItem.tsx:72`, `GroupedActivityItem.tsx:23` | `R.navigate` → reload → as deep link (the `resetState` after `R.navigate` runs in a page that is being reloaded) | as deep link | as deep link |
| Import of a `.jjodel` file (menu, "select project", drop on dashboard or on project list) | `projects.ts:225-280`, `Navbar.tsx:1364`, `AllProjects.tsx:72`, `:107`, `Dashboard.tsx:297` | `importFromText` → `JSON.parse` → `duplicateProject` (ids renewed, state not migrated, `pages/components/Project.tsx:160-180`) → `Offline.import` / `Online.import` → `CreateElementAction`. **Does not open**: the user then opens it from the list → as deep link | async | `import()` wraps in `try … catch { U.alert('e', 'Invalid File.', …) }` (`projects.ts:274-278`), `Dashboard.tsx:296-302` likewise; they catch a malformed file, not an unloadable state. Measured: an R3A and a V1 file import without complaint and fail on open. |
| Browser back/forward, hash edit in an open tab | `PathChecker.tsx:12` | `U.resetState` → `LoadAction.new(empty)` (async) + `stateInitializer` → as deep link from `getOne` on | as deep link | as deep link, but see §3 for the state it leaves |
| Online vs offline fetch | `projects.ts:89-92` | `Offline.getOne` (`:332-337`, `localStorage['projects']`) or `Online.getOne` (`:452-462`, `GET …/project/jjodel/<id>` → `ProjectResponseDTO.toJodelClass`, which copies `state`) → the same `decompressState` → `SaveManager.load` | async | online: a non-200 returns `null` → `failed to get project` + `return` (`reducer.ts:1524-1527`), loading forever as well |
| Never-saved project | `reducer.ts:1557-1561` | `Constructors.persist(project)` + `recursiveCheck()`; no `VersionFixer`, no LOAD | — | — |

Other `LoadAction` callers, read (`command grep -rn "LoadAction\.\(new\|create\)\|new LoadAction\|SaveManager\.load"`):
`U.tsx:447` (the empty state of `resetState`), `VersionFixer.tsx:352` (`autocorrect` with `canLoadAction`,
reached from the "repair" link of `Try.tsx:198`, not from an open), `Project.tsx:53` (inside the `/* … */`
block `:38-57`), `ExecuteOnRead.ts:279` (inside the `/* … */` block opened at `:277`). Collaborative: no load
path (`command grep -n "LOAD\|VersionFixer\|decompress\|LoadAction" frontend/src/components/collaborative/*`
exit 1; positive control `command grep -c "Collaborative"` on `CollaborativeAttacher.tsx` → 6).

Global handlers, read: `command grep -rn "onerror\|unhandledrejection\|addEventListener('error'…\|componentDidCatch\|getDerivedStateFromError" frontend/src`
returns only `FileReader`/`IndexedDB` `onerror` assignments and `Try.tsx:104,134`; positive control: the same
command returns those `reader.onerror` lines.

**Verdict H1.** One function holds both steps (`SaveManager.load`), one caller reaches it
(`stateInitializer`), one `try/catch` encloses the call. The catch is the right place; what defeats it is
H2.

## §2 Throw propagation (item 2, H2), measured

### 2.1 Served → source mapping

`served reducer.ts:407` → `:520` `let u = DUser.getUser(newState);` · `:461` → `:616` `let ret =
unsafereducer(oldState, action);` · `:482` → `:636` · `:620` → `:777` `if (arr.length) {` (after `:776`
`arr = ret.NODES_RECOMPILE_labels;`) · `:958` → `:1167` · `:1117` → `:1370` · `:1274` → `:1578`
`Log.eDevv('Failed to fetch projects', {error});` · `served action.ts:235` → `action.ts:349`
`setTimeout(()=>storee.dispatch({...this}), 0);`.

### 2.2 Per class and entry point (verbatim excerpts; 403 font lines removed)

**Migration class, deep link** (`mig:deep:HX`):

```
events: SaveManager.load.enter → VersionFixer.update.enter {n:2.228,target:true} → probe.throw mig
        → probe.toast {why:"at migration throw"} → SaveManager.load.throw "PROBE-0030 migration throw"
[1.4s] console.error:  at stateInitializer (http://localhost:3003/src/redux/reducer/reducer.ts:1274:9) Failed to fetch projects {error: Error: PROBE-0030 migration throw at VF.update (<anonymous>:36:114) at SaveManager2.load (h…}
[1.5s] console.warning: init looping, project not found yet {pid: Pointer1790289380367_HX, temp: Object}
loading screen ended: never within 25s
snapshot: {"loadingScreen":true,"ProjectsApi_isLoading":true,"store":{"version":2.228,"projects":[],"idlookup":14,"hasTarget":false,"hasUser":true},
           "tmpsave":{"n":2.228,"isTarget":true,"protoPatched":false},"probeToastsInDom":["Probe now PROBE-0030 toast late control"]}
```

**Dispatch class, deep link** (`disp:deep:HX`):

```
events: SaveManager.load.enter → VersionFixer.update.exit {n:2.228} → SaveManager.load.return   (t=1338 ms)
        → probe.throw disp → window.error "PROBE-0030 dispatch throw" → probe.toast {why:"from window.error"}   (t=1357 ms)
[1.4s] pageerror: PROBE-0030 dispatch throw | at DU.getUser (<anonymous>:47:66) <- at CompositeActionReducer (…/reducer.ts:407:23) <- at doreducer (…/reducer.ts:1117:13) <- at _reducer (…/reducer.ts:958:17) <- at unsafereducer (…/reducer.ts:482:15)
loading screen ended: never within 25s
snapshot: {"loadingScreen":true,"ProjectsApi_isLoading":true,"store":{"projects":[],"idlookup":14,"hasTarget":false,"hasUser":true},"probeToastsInDom":["Probe now PROBE-0030 toast late control"]}
```

`SaveManager.load` had already **returned** when the reducer threw 19 ms later; no `Failed to fetch
projects` line; the only observer is the `window` `error` event.

**List click** (`mig:list:HX`, `disp:list:HX`): `navigated /#/allProjects` … `[3.2s] navigated
/#/project?id=…HX` (the reload of `R.navigate`), then the same two outcomes verbatim (`[4.0s] … Failed to
fetch projects …`; `[3.9s] pageerror: PROBE-0030 dispatch throw | at DU.getUser …`), loading never ends.

**Reload** (`mig:deep:HX:reload`): the reload repeats the same failure (`[28.8s] … Failed to fetch projects
…`), loading never ends.

**In-page hash change** (`mig:spa:HX`, `disp:spa:HX`): same logs (`[3.0s] … Failed to fetch projects …`;
`[3.3s] pageerror: PROBE-0030 dispatch throw …`), loading never ends; the state it leaves is in §3.

**Import then open** (`none:imp:R3A`, `none:imp:V1`, no injection): `import returned
[{"id":"Pointer1790290531480_USER_7","name":"Imported_R3A copy","stateLen":13412}]`, then on open
`[7.9s] pageerror: Cannot read properties of undefined (reading 'length') | at unsafereducer (…/reducer.ts:620:11) <- at reducer (…:461:15) <- at Object.dispatch (…/deps/redux.js?v=5ec30bf1:152:22) <- at …/src/redux/action/action.ts:235:31`;
and for V1 `[7.7s] console.error: MyError [Dev Error]missing version adapter from "2.229", please notify the
developers.` … `[7.7s] … Failed to fetch projects {error: MyError2: …}`. Loading never ends in either.

**Real data, no injection, deep link.** R3A and R3B: the same page error at served `:620` → `reducer.ts:777`,
stack ending in `action.ts:235` → `:349`, the `setTimeout` closure. R3B first runs the chain:
`tmpsave.conv` = `[2.2, 2.201, …, 2.227]` (27 steps), `n` 2.228. V1: `VersionFixer.update` throws its own
`Log.exDev` (`VersionFixer.tsx:128`, `missing version adapter from "2.229"`), caught at `:1577`, labelled
`Failed to fetch projects`.

### 2.3 Direct measurement of H2 (`none:h2:H`, on `#/allProjects`)

In page: a copy of the live state without `NODES_RECOMPILE_labels` and with `VIEWS_RECOMPILE_all = true`.

```
H2 measurement: {
 "txDepthBefore": 1,
 "a_directDispatch": "CAUGHT by the caller of store.dispatch: Cannot read properties of undefined (reading 'length')",
 "a_stateUnchanged": true,
 "a_nextDispatchApplied": true,
 "b_LoadActionNew": "returned normally",
 "b_windowErrorsAfter": [ "Cannot read properties of undefined (reading 'length')" ]
}
```

(a) `store.dispatch({...new LoadAction(bad, false)})` in a `try`; (b) `LoadAction.new(bad)` in a `try`, then
1.2 s wait. Read, redux 5.0.1 `dispatch`: `try { isDispatching = true; currentState =
currentReducer(currentState, action); } finally { isDispatching = false; }`, so a throw leaves
`currentState` as it was and later dispatches work, as (a) shows. `txDepthBefore: 1` confirms the app sits
inside an open transaction (`COMMIT(undefined, false)` every `U.UpdatingTimer` at `reducer.ts:1443`
re-`BEGIN`s, `action.ts:137`), so `LoadAction.new` is queued, not dispatched, at the time of the call.

### 2.4 The toast at the moment of failure

| Path | Toast dispatched at the failure moment | In the DOM 25 s later |
|---|---|---|
| deep link, list click, reload, import-then-open | yes (both classes) | **no** — only the late control is |
| in-page hash change | yes (both classes) | **yes** (`"Probe 20s PROBE-0030 toast at migration throw"`, `"… from window.error"`) |

On a page load the tree that holds `ToastProvider` (`App.tsx:121`) is not rendered until
`stateInitializer()` resolves (`App.tsx:99-108` returns `<Loader/>`), and `toast` is a bare
`window.dispatchEvent` with no buffer (`toastDispatch.ts:46-55`). The `containerMountedAtDispatch` field of
the probe is not evidence: `ToastContainer` renders `null` with no toasts (`ToastContainer.tsx:18`).

## §3 State after failure (item 3, H3), measured

| Path | Store after the failure | `tmpsave` | Back button (`.btn-back`, `ProjectLoadingScreen.tsx:14-16`) | Second open of the healthy H in the same page |
|---|---|---|---|---|
| deep link, list, reload, import (both classes) | pre-load init state: `projects: []`, 14 `idlookup`, user present, target absent | the target's state; `idlookup` prototype patched (`true`) after a reducer throw at `:777` (R3A, R3B), unpatched after an early throw | works: `{"hash":"#/allProjects","listShowsHealthy":true,"loadingScreen":false}` | works: `loading screen ended 3.0s` |
| in-page hash change (both classes) | the **dashboard** state: `projects` = the 5 seeded ids, 7 `idlookup`, target **present as a `DProject` stub** (no models, no views) | as above | not measured on this path | not measured on this path |

**The in-page path, followed further.** With no injection, `none:spa:R3A:poke`: after the failure,
`ProjectsApi_isLoading` flips to `false` (in `mig:spa` it already had, 25 s after the throw) because
`checkLoaded` (`reducer.ts:1529-1538`) only asks for `state.idlookup[DUser.current]` and `state.idlookup[pid]`,
both satisfied by the dashboard stub. The screen stays on "Loading Project..." only because `Project.tsx`
re-reads `ProjectsApi.isLoading` in `mapStateToProps` (`:102`) when the store changes. One state-changing
dispatch later (`SetRootFieldAction.new('tooltip', 'p30-poke', '', false)`), measured:

```
snapshot: {"loadingScreen":false,"ProjectsApi_isLoading":false,"store":{"projects":[5 ids],"idlookup":7,"hasTarget":true},
           "body":"Jjodel File Edit View Analyze Probe_R3A Basic Advanced Help OU All projects Probe_R3A METAMODELS New metamodel"}
LProject.getProject(): {"id":"Pointer1790290235219_R3A","name":"Probe_R3A"}
stored target after SaveManager.save(): {"len":96133,…,"lastModified":1790290475968} (CHANGED)
stored state content before vs after save: {"before":{"version":2.228,"idlookup":19,"m2models":1,"models":1,"viewelements":0,"projects":1},
  "after":{"version":2.228,"idlookup":7,"m2models":0,"models":0,"viewelements":0,"projects":1},
  "idsLost":["Pointer_EBOOLEAN",…,"Pointer_ViewPointDefault","Pointer1790290249306_USER_10","Pointer1790290249306_USER_10_graph1","Pointer1790290249308_USER_11","Pointer1790290249306_USER_10_graph2"]}
```

The editor opens an empty project under the real project's name, and one save replaces the stored state:
the metamodel (`…USER_10`), its graphs and the model (`…USER_11`) are gone. The same was measured for
`mig:spa:HX:poke` and `disp:spa:HX:poke` (19 → 7, `m2models` 1 → 0). The deep-link path does not do this:
`LProject.getProject()` is `null`, `SaveManager.save()` is a no-op, stored state `(unchanged)`.

**After a healthy open** (`none:afterhealthy:R3A:poke`): H by deep link (loaded), hash → `#/allProjects`,
hash → R3A. `ProjectsApi.isLoading` is never set back to `true` (its only writers are the static
initializer `projects.ts:41` and `reducer.ts:1538`, plus a dev fixture, read), so **no loading screen
appears at all** (`loading screen ended: 3.0s`, i.e. never shown), the editor renders the stub at once, the
page error is the only trace, and `SaveManager.save()` loses the metamodel as above (19 → 7).

**Verdict H3.** On page-load paths the store is usable and the list is one click away: a message plus the
existing back button suffices, provided the loading screen is not replaced by the editor. On in-page paths
it is not: the store holds a stub the app treats as the loaded project. A recovery needs (a) the load
failure to keep the editor from mounting, whatever `checkLoaded` sees afterwards, and (b) `isLoading` reset
at the start of every open. `tmpsave` needs nothing: its only reader is `SaveManager.load` with a falsy
first argument (`SaveManager.ts:42`), and the one live caller passes the parsed state, falsy only if a
stored blob decompresses to `null` (read; not measured).

## §4 Population (item 4, H4)

**Server projects, read.** Same path: `Online.getOne` (`projects.ts:452-462`) → `ProjectResponseDTO.toJodelClass`
copies every DTO field present on `DProject`, `state` included (`ProjectResponseDTO.ts:36-40`) →
`stateInitializer` decompresses and calls `SaveManager.load`. Nothing server-side is migrated on read.

**What a server measurement needs** (not attempted, per the prompt): either (a) read access to the projects
collection, and for each project: decompress `state` (lz-string UTF-16, the format of `async-lz-string`),
read `version.n` (absent included), the presence of `NODES_RECOMPILE_labels`, `NODES_RECOMPILE_longestLabel`,
`ClassNameChanged`, and `lastModified`; bucket as: no version; version without the labels fields (risk 3);
`version.n` above the deployed `highestVersion` (V1 class); unreadable; ok. Or (b) per user, in an
authenticated dashboard: `GET …/project/` returns `state` for each project (`GetAllProjects.ts:9`) and
`Online.getAll` copies it into each `DProject` (`projects.ts:438`, `d[k] = raw[k]`), so the snippet
below can read `store.getState().idlookup[p].state` instead of `localStorage` — one user's projects only.

**Offline corpus, read.** The 2026-08-04 census does not record its origin: "i progetti in
`localStorage['projects']` della sessione di sviluppo, modalita offline" (`discovery_2026-08-05_legacy_view_census_real_projects.md:5-6`),
"eseguita in chat di progetto, non da Claude Code" (`:4`). On 2026-08-18 the same measurement at
`http://localhost:3000` found **2** projects, 1 with state (`discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md` §7.1),
and R-IRN-13 closes it: "Gli 80 progetti del censimento del 2026-08-04 … non esistono piu'; confermato da
Alfonso" (`docs/decisions.md`, R-IRN-13). The 80-project corpus of the prompt is therefore not a
population to measure; the one on record is `http://localhost:3000` (Q3).

**Snippet for Alfonso** (not in code). The 1610 snippet imports `/node_modules/.vite/deps/async-lz-string.js`,
a path that exists only with the default `cacheDir`; this variant uses the app's own `U.decompressState`
and adds the risk-3 signature. Measured on 3003 with seven seeded projects:
`{"2.228":2,"2.228 / no NODES_RECOMPILE_labels":1,"2.2 / no NODES_RECOMPILE_labels":1,"2.229":1,"(never saved)":1,"(unreadable)":1}`.

```js
(async () => {
  const projects = JSON.parse(localStorage.getItem('projects') || '[]');
  const rows = {};
  for (const p of projects) {
    let key;
    if (!p.state) key = '(never saved)';
    else {
      try {
        const s = JSON.parse(await window.U.decompressState(p.state));
        key = (!s.version ? '(no version)' : String(s.version.n))
          + ('NODES_RECOMPILE_labels' in s ? '' : ' / no NODES_RECOMPILE_labels');
      } catch (e) { key = '(unreadable)'; }
    }
    rows[key] = (rows[key] || 0) + 1;
  }
  console.table(rows);
  return rows;
})();
```

**Risk 3 of 1610, measured on synthetic fixtures.** R3A (2.228, both fields removed) and R3B (2.2, both
removed; the chain runs 27 steps) die at `reducer.ts:777`, so no step backfills the fields (consistent with
the 1610 read: only `NODES_RECOMPILE_grid`/`_snap` are guarded, `VersionFixer.tsx:575-577`). This proves the
reducer line, not the population: a real save of 2024-06-28..2024-08-27 may differ in other ways and die
earlier or later.

**Verdict H4.** Cannot hold as stated: the claim needs the population, which is not measurable here, and
two measured signatures (missing labels fields; a newer schema) die on the open path.

## §5 Findings

- **F1** (read + measured) — The dispatch of the loaded state is always asynchronous with respect to its
  caller: `action.ts:349` `setTimeout(()=>storee.dispatch({...this}), 0); // force action execution to be
  async, so i can add callbacks like AFTER_TRANSACTION`, or queued at `:329-330` while the permanent
  transaction is open. This, not the absence of a catch, is why the reducer class is uncaught.
- **F2** (measured) — The reducer mutates the action's value in place before a late throw: `LOAD` sets
  `newState = action.value` (`reducer.ts:519`), `unsafereducer` sets `ret.idlookup.__proto__` (`:639`) and
  recompiles into `transientProperties` before reaching `:777`. `tmpsave.protoPatched` is `true` after R3A/R3B.
  The store itself is untouched (redux does not assign on throw).
- **F3** (measured) — The label at `reducer.ts:1578` covers a project-open failure and a dashboard fetch
  failure alike; for the V1 class it wraps `missing version adapter from "2.229"`.
- **F4** (measured) — In-page opens can install nothing and still clear the loading flag: `checkLoaded`
  accepts the dashboard's `DProject` stub (§3). Combined with F5, a failed in-page open plus one save
  destroys the stored project.
- **F5** (read + measured) — `ProjectsApi.isLoading` is never reset to `true` after the first successful
  load of a page (§3); a later in-page open shows no loading screen.
- **F6** (measured) — A toast from either failure moment is lost on every page-load path (§2.4); a message
  that must be seen belongs in the loading screen itself.
- **F7** (read) — A third silent case: `getOne` returning `null` (unknown id, deleted project, online
  non-200) logs `failed to get project` and returns (`reducer.ts:1524-1527`), loading forever. Not in the
  two classes of the prompt; same symptom (Q5).
- **F8** (read) — The loading screen already has the exit: `.btn-back` → `navigate('/allProjects')`
  (`ProjectLoadingScreen.tsx:14-16`, `:21-28`), an in-page navigation, so `PathChecker` resets the state
  (measured working after both classes).
- **F9** (read) — `reducer`'s own catch (`reducer.ts:621-629`, `'unhandled error in reducer'`) is dead
  code behind `let safeMode = false;` (`:613`). Not proposed for change (Rule 9).

## §6 Dependencies and risks

1. **Changing the dispatch timing of the LOAD** (the proposal, §8) moves it ahead of actions already queued
   in the open transaction. Today, queued with them, LOAD sorts first by path (`reducer.ts:494-499`,
   `path ''`), so queued actions already apply after it; with a synchronous dispatch they apply after it in
   a later dispatch. A `setTimeout` scheduled before the load would now run after it instead of before. To
   verify in Phase 2 on the healthy control (store equality after load, old vs new path), not assumed.
2. **`AFTER_TRANSACTION` callbacks** registered before the load would run inside `stateInitializer`'s call
   stack (they already run inside `reducer`, `:617`). A throw in one is caught per callback
   (`action.ts:249`), so it cannot reach the new catch.
3. **The data-loss path of §3 exists today**, independently of the ticket: any in-page open that fails,
   followed by a save (explicit or the layout autosave, `projects.ts` `save(..., {silent: true})`), replaces
   the stored project. Not a new risk of the proposal; the proposal closes it.
4. **`VersionFixer.tsx` is not touched** by the proposal; `SaveManager.load` is a D-layer write path (it
   installs the whole state), so a Layer Impact Report draft is in §8.
5. **Environment.** The one-time rewrite of `~/jjodel/frontend/node_modules/.vite/deps` (§0). Phase 2 needs
   the symlink again; use a `cacheDir` outside the shared `node_modules`.
6. **The fixtures are synthetic** (§4): the R3 variants carry today's shape minus two fields.

## §7 Open questions for Alfonso

1. **Message text and placement.** Proposed: in the loading screen itself, replacing spinner and subtitle —
   title "This project could not be opened", text "Jjodel could not read the saved data of this project.
   Nothing was loaded and your saved copy was not changed.", a collapsed "Details" line with the error
   message, and the existing "back" arrow. No toast (lost on page loads, F6). Accept, or other wording?
2. **After a failure: stay on the error screen, or return to the project list automatically?** Recommended:
   stay (the back button exists, F8; an automatic return would need a toast that survives the navigation).
3. **The `localStorage` count.** Run the §4 snippet in your browser at `http://localhost:3000/#/allProjects`
   (the origin R-IRN-13 measured), and on 3001 if you ever worked there? It also counts the risk-3 signature.
4. **Server population.** Is a database read of the project collection (§4 (a)) possible, and by whom?
5. **The third case, `getOne` → `null` (F7):** include it in the same outcome ("This project was not
   found."), or leave it out of this ticket?
6. **Scope of the in-page data-loss fix (F4, F5):** in this ticket, as proposed (it is the same catch and
   the same flag), or a separate ticket first because it is the more severe defect?
7. **Rule 19:** the proposal touches 7 files (6 code + 1 new test; 8 with the stylesheet). Proceed as
   listed in §8, or split?

## §8 Proposal for Phase 2 (prose)

**The single catch** stays where it is, `reducer.ts:1577` in `stateInitializer`, the one function every
open reaches (H1). What changes is what it can see:

- **`SaveManager.ts:57`**: the loaded state is dispatched **synchronously** —
  `store.dispatch({...new LoadAction(save, false)})` in place of `LoadAction.new(save)` — so a reducer throw
  propagates out of `SaveManager.load` into the catch, exactly as measured in §2.3 (a). The migration
  (`:56`), the pre-migration loop (`:45-54`), `decompressState`/`JSON.parse` (`reducer.ts:1564`) and
  `getOne` already throw into it. The `:42` branch (`tmpsave` reload) is left as is.
- **The catch** (`reducer.ts:1577-1578`): for a project page it logs `Failed to open project` with the
  project id and the error (the dashboard branch keeps `Failed to fetch projects`), and sets
  `ProjectsApi.loadError = {message}`. It does **not** set `isLoading` to `false`: the loading screen stays
  mounted and turns into the error screen, so the editor never mounts over a state that was not loaded.
- **`checkLoaded`** (`reducer.ts:1529`): returns `true` (stop looping) without touching `isLoading` when
  `ProjectsApi.loadError` is set, so a later dispatch cannot clear the flag on a dashboard stub (F4).
- **Start of every project open** (`reducer.ts`, before `getOne`, `:1522`): `ProjectsApi.isLoading = true;
  ProjectsApi.loadError = undefined;` (F5).
- **`getOne` → `null`** (`:1524-1527`): the same outcome with "not found", **only if Q5 says so**.
- **`projects.ts:41`**: `static loadError?: {message: string}` next to `isLoading` (additive, Rule 11).
- **`pages/Project.tsx:99-103`**: `mapStateToProps` also maps `ProjectsApi.loadError`, passed to
  `<ProjectLoadingScreen error={…}/>` (`:61`). Needed on the in-page path, where the page is already mounted
  when the catch runs; the `SetRootFieldAction('isLoading', false)` of `U.resetState` (`U.tsx:448`) is the
  store change that re-runs `mapStateToProps`. On page loads the page mounts after the catch.
- **`ProjectLoadingScreen.tsx`**: an optional `error` prop; with it, no spinner, the Q1 text, and the
  existing back button. `project-loading-screen.scss` only if the variant needs a rule (tokens only, Rule 28).
- **`tmpsave`**: unchanged (§3).

**Files**, 7: `frontend/src/redux/reducer/reducer.ts`, `frontend/src/components/topbar/SaveManager.ts`,
`frontend/src/api/persistance/projects.ts`, `frontend/src/pages/Project.tsx`,
`frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx`, new
`frontend/src/components/topbar/__tests__/saveManager_load.test.ts`; plus
`frontend/src/components/LoadingScreen/project-loading-screen.scss` if needed (8). Over the Rule 19
threshold: listed here for the GO (Q7). Docs in a separate commit: the inbox entry, the prompt Status line.

**Test plan, one mutation per rule.** Vitest where the file imports under mocks, following the joiner mock
of `versionfixer_old_states.test.ts:25-56` (`RuntimeAccessible: () => (ctor) => ctor`); whether
`SaveManager.ts` imports that way is to be verified in Phase 2, not assumed. `stateInitializer` does not
import in the bench; its rules are verified by re-running this report's probes, and the gap is stated in
the entry (§5 of `CLAUDE.md`: no source-text test).

| Test | Rule | Mutant that must kill it |
|---|---|---|
| T1 (vitest) | `SaveManager.load` rethrows a `VersionFixer.update` throw, and dispatches nothing | a `try/catch` around `:56` that swallows |
| T2 (vitest) | a throwing `store.dispatch` makes `SaveManager.load` throw synchronously | `LoadAction.new(save)` restored (deferred dispatch) |
| T3 (vitest) | healthy: `dispatch` called once, synchronously, with the migrated object | dispatching the pre-migration `state0` |
| P1 (probe) | migration throw: error screen shown, loading ends, console says `Failed to open project` | label reverted; catch not setting `loadError` |
| P2 (probe) | dispatch throw (injected, and real R3A): same as P1 | `SaveManager.ts:57` reverted |
| P3 (probe) | in-page failure + state change + save: stored project unchanged, editor never mounts | `checkLoaded` guard removed |
| P4 (probe) | failing in-page open after a healthy one shows the error screen | the `isLoading = true` reset removed |
| P5 (probe) | healthy H by deep link, list, in-page: loads, store equal to the old path's (§6.1) | — control |

### Layer Impact Report — draft (the definitive one goes in chat before the edit)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)   — the LOAD that installs a saved project: timing only
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString) — not touched; the fix removes a path that overwrote saves

D-layer:
  - What changes: SaveManager.load dispatches LOAD synchronously instead of via Action.fire
    (setTimeout / open-transaction queue); on failure the store is not replaced (already true)
    and the app no longer mounts the editor over the pre-load state.
  - What does NOT change: the LOAD reducer case, unsafereducer, VersionFixer.update and its steps,
    tmpsave, every other action's dispatch timing, Action.fire, TRANSACTION/COMMIT.
  - Cross-layer interaction: AFTER_TRANSACTION callbacks (checkLoaded) now run inside the
    stateInitializer call stack; queued actions apply after LOAD in a later dispatch (§6.1).
  - Side-effect safety vs other layers: no canvas/sync/JjOM file; no TRANSACTION wraps a creator (Rule 12).

Smoke-test scenarios potentially affected:
  - open an existing current project (deep link, list, in-page) → identical store after load
  - save → reopen → identical state
  - a project that cannot be loaded → error screen, stored copy unchanged after any save attempt
```

## §9 Baseline gates (item 6, measured on `14b7d5228`, symlink in place, full output, exit status recorded)

- `npm run typecheck`: exit 2, **14** `error TS` lines, the §17 set: `api/data.ts` TS2304 ×2 + TS2322,
  `common/Dummy.ts` TS2307, `editor-v2/EditorV2.tsx` TS2339, `forEndUser/Measurable.tsx` TS2552, TS7053 ×4,
  TS2345, `Jodie/ChatMessages.tsx` TS2322, `project/ProjectEditor.tsx` TS2769, `pages/components/Dashboard.tsx` TS2339.
- `npx vitest run`: exit 1, `Test Files 9 failed | 178 passed (187)`, `Tests 4449 passed (4449)`. The 9 red
  files are the §17 set, all `ReferenceError: window is not defined` at import: `jjscript/__tests__/context-binding`,
  the seven under `jjtl/__tests__/` (`abstract-target`, `ai-prompt-sanitization`, `circular-refs`,
  `executor-bridge`, `executor-llayer`, `forall-mapping`, `source-alias`), and `utils/__tests__/UDComparator`.
- `npm run build`: exit 0, the chunk-size warning plus a pre-existing esbuild CSS warning
  (`"bordr" is not a known CSS property`, `properties-with-tree-view.scss:1210`, since `217743fbc`, 2026-03-24).
- `npm run check:docs`: exit 0, 4/4, 4 non-blocking warnings (inbox entries waiting to be folded).

## Addendum 2026-09-25 (Phase 2) — what changed from §8, and what the probes found

Code commit `0609e9793` (mutation bench in its body). Measured on 3003, this tree. Three additions beyond
§8, each ruled in chat and each held by a mutant, plus the `openRun` counter accepted with the LIR.

**A1. Drain before the synchronous LOAD** (`reducer.ts`, project branch, after `decompressState`, before
`recursiveCheck()`): `COMMIT(undefined, false)` then one macrotask. §6.1 risk 1 happened: without it (M10)
the LOAD overtook the `init jodel state` batch on deep link and list (40 leaves vs the old store:
duplicated `Pointer_E*` in `classs`, `primitiveTypes`, `ecoreClasses`), and in-page the reset's own empty
LOAD (`U.tsx:447`) landed after the project's LOAD; the project survived only because that batch rolled
back (`reducer.ts:540`). Ordering, read: `DState.init()` (`reducer.ts:1498` → `store.tsx:236` →
`TRANSACTION('init jodel state')`, `store.tsx:245-355`, synchronous body) queues its `END` in the microtask
after `await func()` (`action.ts:220`), before `stateInitializer` resumes from `await ProjectsApi.getOne`;
at the drain point the init actions are in a 0 ms timer (deep link) or pending in the open transaction
(in-page) until the drain's `COMMIT` fires them; the drain's own 0 ms timer is scheduled later and runs
after. Caveat, read and not measured: this assumes the init timer is not clamped to 4 ms (timer nesting
level of 5 or more) while the drain's is not; in the call chains found (render, effect, click, interval
tasks) nesting stays below 5. P5 ×5 per entry point: order `INIT → LOAD` every run; deep link and list
equal to the old store modulo `timestamp`/`timestampdiff`.

**A2. `JjodelEvents.PROJECT_OPEN_CHANGED`.** §8 assumed that the `SetRootFieldAction('isLoading', false)`
of `U.resetState` re-runs `mapStateToProps`: it does not when `state.isLoading` is already `false`
(unchanged state, react-redux skips the selector). Without the event (M12) an in-page failure stayed a
spinner, and after a healthy open (P4) the editor stayed mounted over the dashboard stub. The page now
reads `ProjectsApi.isLoading` and `loadError` live and re-renders on the event (§8's `loadError` prop
mapping was dropped).

**A3. Save guard** (`ProjectsApi.save`): no write, a warning, for a project whose open failed in this
page. M11: a save from the failed in-page state overwrote the stored project, 19 → 7 `idlookup`.

**A4. P4b and the counter.** P4b as first written (A → B by hash inside `/project`) tested nothing: no
second open starts, because `PathChecker` fires on pathname changes only (`PathChecker.tsx:7-14`); A
then shows under B's URL and `Project.tsx` throws on `project.type` (ticket, high). The rewritten P4b
(A slow, `#/allProjects`, B, all in-page) kills M9: A's leftover callback clears B's loading at 3.06 s.
The example "failed A, healthy B" passes with or without the counter: A's leftover callback is consumed
by the dashboard's dispatches while `loadError` is still set. Residual, harmless: a superseded open's
LOAD lands in the store while the newer one loads; the loading screen holds and the newer LOAD replaces
it (6.88 s).

**A5. The in-page store after the fix.** In-page opens no longer apply `init jodel state` on top of the
loaded project, so the old duplicates of `classs` and of the project's `viewpoints` are gone. What
remains is not in the stored blob (the deep-link store equals the blob): the reset's
`[emptyLOAD + init]` batch applies to the empty state and leaves pending `pointedBy` paths, resolved at
the next dispatch onto the loaded project (`Pointer_EBOOLEAN.pointedBy` 3 after the LOAD, 4 after the
next dispatch, `PendingPointedByPaths`, `reducer.ts:433`). Stored state after cycles 1-3 of open +
`SaveManager.save()` (original blob: 11 / 3 / 3 / 1):

| Path | `classs` | `EBOOLEAN.pointedBy` | `EOBJECT.pointedBy` | project `viewpoints` |
|---|---|---|---|---|
| deep link, new code | 11 / 11 / 11 | 3 / 3 / 3 | 3 / 3 / 3 | 1 / 1 / 1 |
| in-page, new code | 11 / 11 / 11 | 4 / 5 / 6 | 5 / 7 / 9 | 1 / 1 / 1 |
| in-page, old code | 22 / 33 / 44 | 5 / 7 / 9 | 5 / 7 / 9 | 2 / 3 / 4 |

Ticket, medium, in `docs/log-inbox/versionfixer.md`.
