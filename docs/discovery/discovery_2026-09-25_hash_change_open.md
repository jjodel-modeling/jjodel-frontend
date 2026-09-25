# Discovery: a change of project id in the URL starts no open (Phase 1)

Prompt-ID: P-2026-09-25-1440 · prompt `docs/prompts/claude_2026-09-25_1440_prompt_hash_change_open_discovery.md`
Session: f433f443-5c09-482d-8743-1c09152a076e (read from the harness scratchpad path)
Tree: `~/jjodel-open`, branch `open-hash`, HEAD `1201382ac` for the whole phase (equal to `alfonso-frontend-jjtl`
at start; the branch already existed at that sha and was checked out, so `git switch -c` was not run).
Executor: Anthropic Claude Opus 5.5 (as the session banner shows it).

This report holds hypotheses with evidence. It is not a reference. Whoever uses it downstream re-reads the
real files. "Measured" means a run in this phase on HEAD `1201382ac`, with a dev server on 3003 serving this
tree. "Read" means read from a file. "Emulated" means an in-page probe that stands in for the candidate fix,
with no source edit. It is evidence about the candidate's mechanism, not about the candidate's code. Served
line numbers were mapped back to source by fetching the served module (`curl http://localhost:3003/src/...`):
`Project.tsx:51:13` served is `Project.tsx:90` source (`project.type`), `PathChecker.tsx:22` served is `:12`
source, `LeftBar.tsx:128` served is `:133` source.

**Open questions for Alfonso are in §7, before the candidate (§8).**

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The project id is the only part of the location that should start an open. | **Holds, stated precisely** (read + measured, §1). Two parts of the location should start an open: a change of pathname, which already does (`PathChecker.tsx:7-14`), and on `/project` a change of `id`, which does not. No other search param should start one. `filter` on `/allProjects` relies on a URL change that neither reloads nor remounts (`LeftBar.tsx:114-128`). `repair` is read only inside an open (`VersionFixer.tsx:125`). Today an open starts on a page load or on a pathname change. It does **not** start on an in-page change of id: a hash edit (a), back/forward between two projects (b1), and **back/forward after two ordinary UI opens** (b2, a same-document navigation). |
| H2 | Keying the open on the id is enough, and does not start a second open where one already runs. | **Partly** (measured + emulated, §2-§3). An id-keyed reset starts the right open in every in-page case measured: (a), (b1), (b2) and (c). No second open starts where one already runs. On a deep link, PathChecker's first effect is skipped (`renders`). In a page that `R.navigate` is reloading, `U.navigating` is `true` and the reducer drops every action (`reducer.ts:611`). The dashboard click already starts in-page opens in that dying page today (measured: `LeftBar.tsx:133` in every recorded click, a second reset in 3 of 4). **It is not enough on its own:** (i) a superseded open still dispatches its LOAD (H3), and (ii) between the render of the new location and the effect, the editor renders the URL's project, which the store does not hold. |
| H3 | The counter of `0609e9793` already handles A → B while A is still loading. | **Falsified** (measured + emulated, §3.3). The counter guards the loading flag (`checkLoaded`, `reducer.ts:1547`), not the LOAD. When A's decompress finishes after B's, A's `SaveManager.load` still runs (`reducer.ts:1593`) and replaces B: **A in the store under B's URL, the loading screen gone**. Measured in A4's own form (with `#/allProjects` in between, **committed code**, 6.86 s). Emulated with an id-keyed reset, from a deep link (5.39 s) and in-page (6.97 s). When B is slower, the end state is correct: A's LOAD lands first and B's replaces it (A4's "harmless residual"). |
| H4 | The `pointedBy` growth of A5 comes from the same in-page reset. | **Same reset, different state; the fix leaves it as it is** (measured, §3.4). The growth needs a reset **from the dashboard's state**: 12 pending `pointedBy` paths, then `EBOOLEAN` 3 → 4 and `EOBJECT` 3 → 5 stored. The new path, A → B from a loaded project, grows nothing: 3/3 and 0 pending, with or without a synchronous empty LOAD. The id change leaves A5's path untouched. The fix does not come for free. A synchronous empty LOAD in `U.resetState` (one line, `common/U.tsx`) removes it on A5's path (0 pending, 3/3), but that is another file and a change to every reset (Q3). |

## Objective

This phase covers items 1-5 of the prompt: a map of the location changes that reach `/project` and what fires
on each; four measurements on 3003 with a variant of each; a candidate fix, not applied, with its tests and
mutants; and this report. Out of scope and not touched: any source edit, the `VersionFixer` steps, the save
format, the examples, the smoke harness, routing outside `/project`.

## Files read (full paths)

- `/Users/alfonso/jjodel-open/frontend/src/components/pathChecker/PathChecker.tsx` (whole) and its mount,
  `/Users/alfonso/jjodel-open/frontend/src/App.tsx` (whole: `99-112` first render and `U.navigating`, `127`,
  `135-178` the `HashRouter`, PathChecker at `136`, routes)
- `/Users/alfonso/jjodel-open/frontend/src/common/U.tsx`: `93-146` (`R.replace`, `R.refresh`, `R.navigate`),
  `181` (`U.navigating`), `216-251` (the beforeunload handler), `446-449` (`resetState`), `2798-2835`
  (`getHashParams`, `getProjectID_URL`, `getHashParam`, `setHashParam`, `getSearchParam`)
- `/Users/alfonso/jjodel-open/frontend/src/joiner/classes.ts`: `1817-1880` (`PendingPointedByPaths`),
  `1960-1995` (`PointedBy.add`), `2050-2058` (`get_project`), `3014-3018` (`LUser.get_project`),
  `3046-3048` (`DProject.getProject`), `3137-3139` (`LProject.getProject`)
- `/Users/alfonso/jjodel-open/frontend/src/pages/Project.tsx` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/redux/reducer/reducer.ts`: `426-555` (`CompositeActionReducer`,
  the LOAD case `519-532`), `605-615` (`reducer` head, the `U.navigating` drop at `611`), `1479-1640`
  (`openRun`, `announceProjectOpen`, `stateInitializer` whole)
- `/Users/alfonso/jjodel-open/frontend/src/redux/action/action.ts`: `325-350` (`Action.fire`), by search
- `/Users/alfonso/jjodel-open/frontend/src/api/persistance/projects.ts`: `1-130` (`ProjectsApi`: `isLoading`,
  `loadError`, `getAll`, `getOne`, `save` and its guard)
- `/Users/alfonso/jjodel-open/frontend/src/components/topbar/SaveManager.ts`: `1-60` (`save`, `load`)
- `/Users/alfonso/jjodel-open/frontend/src/components/topbar/__tests__/saveManager_load.test.ts` (whole)
- `/Users/alfonso/jjodel-open/frontend/src/components/forEndUser/Try.tsx`: `60-215` (`TryComponent`)
- `/Users/alfonso/jjodel-open/frontend/src/components/devtools/SmokeBoot.tsx` (whole)
- Dashboard and navigation: `/Users/alfonso/jjodel-open/frontend/src/pages/components/Project.tsx` (`185-197`,
  `selectProject`), `.../pages/components/LeftBar.tsx` (`100-150`, `492`), `.../pages/components/Navbar.tsx`
  (`555-570`, `1285-1300`, and every `navigate` by search), `.../pages/components/Dashboard.tsx` (`80-105`,
  `555-600`), `.../pages/components/RightPanel/ActivityItem.tsx` (`60-80`), `.../hooks/useQuery.ts` (whole),
  `.../utils/shareUtils.ts` (`1-30`), `.../components/project/ProjectEditor.tsx` (`400-415`)
- `/Users/alfonso/jjodel-open/frontend/src/redux/VersionFixer.tsx`: `125` and the `repair` lines, by search
- `/Users/alfonso/jjodel-open/frontend/vite.config.ts` (`1-70`), `/Users/alfonso/jjodel-open/frontend/vitest.config.ts` (whole),
  `/Users/alfonso/jjodel-open/frontend/package.json` (scripts, `vitest`, by search)
- Docs: `/Users/alfonso/jjodel-open/docs/discovery/discovery_2026-09-25_project_open_path.md` (whole: §1, §3,
  §8, addendum A1-A5), `git show -s 0609e9793` (the commit body and its mutant table),
  `/Users/alfonso/jjodel-open/docs/PROTOCOL.md` (P13, P14), `/Users/alfonso/jjodel-open/docs/decisions.md`
  (`1-80`, RC-15..RC-19 by search), `/Users/alfonso/jjodel-open/docs/claude-code-log.md` (`1-85`)

Searches, each with a positive control: every writer of the location (`command grep -rn
"setHashParam|location.hash *=|history.pushState|history.replaceState|useNavigate|navigate("`) returns the
`R.navigate` sites, `ProjectLoadingScreen.tsx:15-19`, `LeftBar.tsx:127`, `JjodieWidget.tsx:187`,
`ConfirmAccount.tsx:21`, `U.tsx:139` and `U.tsx:2825`. The last one, `setHashParam`, has no caller: the
search for `setHashParam(` returns only its definition. Links: the search for `href="#/`, `<Link` and
`<NavLink` returns only `Auth.tsx:165`, inside a comment. The control is the same command returning
`App.tsx:13`, the `react-router-dom` import.

## §0 Environment and method

**Server.** Vite on **3003**, started from this tree (`npx vite --port 3003 --strictPort` in `frontend/`),
cache in `frontend/.vite-cache` (`vite.config.ts:45`, per tree since `465605cd7`). `lsof` found 3003 free
before the start. **Temporary symlink** `frontend/node_modules -> /Users/alfonso/jjodel/frontend/node_modules`:
this lane created it at 14:46 after checking that it did not exist (`test ! -e && test ! -L`), with
`git status` empty before and after. It is removed at the end of the phase, together with the server. At
start Vite logged `Failed to run dependency scan … No matching export in "src/DSL/nearley/nearley.tsx" for
import "Nearley"`. The same line is in the 0030 server logs (`vite3003.log`, `vite3003b.log` of that session),
so it is pre-existing and was not chased. The first page load triggered one on-demand dependency reload (a
second document at 17.8 s): a cold cache, only in the first run.

**Fixtures.** The two healthy projects of 0030's `variants.json`, copied into this session's scratchpad:
**A** = `Pointer1790290235219_USER_2` ("Healthy_0030") and **B** = `Pointer1790290235219_HX` ("Probe_HX", the
same content under its own id). The blob of B still names its `DProject` "Healthy_0030", so the probe tells
them apart by `store.projects`, not by the name on screen. Both are seeded in `localStorage` as an offline
user, as the 0030 probe did.

**Probe** (`probe_1440.mjs`, scratchpad, throwaway, not committed). It runs one fresh browser context per
scenario, with an init script and no source edit. The init script:

- stamps each document with a random id (`doc`), so a reload is visible as a new id;
- records `hashchange` events and `window` errors;
- traps the `RuntimeAccessible` globals as the 0030 probe did, and wraps `U.resetState` (with a stack, to
  name the caller), `U.decompressState` (with a per-project delay for (c)), `SaveManager.load` and
  `ProjectsApi.getOne`.

A snapshot reads: the URL, `store.projects`, whether the store holds the URL's project,
`LProject.getProject()`, `ProjectsApi.isLoading` and `loadError`, the loading screen, `.try-message`, the page
text, and the count of page errors. A timeline polls the same tuple every 25 ms inside the page and prints
each change.

**Emulations** (also in the init script, off unless named; they stand in for the candidate, §8):

- **E1**: on a `hashchange` that keeps `/project` and changes `id`, call `U.resetState()` two animation frames
  later, after React has rendered the new location, as a PathChecker effect would run.
- **E2**: E1, plus `ProjectsApi.isLoading = true` set synchronously in that listener, before the router
  re-renders. It stands in for "the page does not render a project the store does not hold".
- **E3**: E2, with the reset's empty LOAD dispatched synchronously (`LoadAction.new` patched only for the
  duration of the `resetState` call). A variant applies the same patch to every reset, PathChecker's pathname
  resets included (H4 only).

**Fonts and noise.** The probe filters console lines that match `403` or `Failed to load resource`. Their count
was not recorded. Two console errors appear in healthy runs and are pre-existing noise, not chased:
`wrong project setup in navbar` (`Navbar.tsx:565`, logged on every dashboard render, where
`null !== undefined`), and `Invalid action path 0` (`reducer.ts:43`, `deepCopyButOnlyFollowingPath`, on every
in-page open from the dashboard).

## §1 Location map (item 1, H1, H2)

"Opens" means `stateInitializer` reaches `SaveManager.load` for the URL's project in a live document.

| # | Navigation | What changes | What fires today | Opens today | Hops (file:line) |
|---|---|---|---|---|---|
| 1 | Deep link, new tab, reload, pasted URL on another page | everything (page load) | `App.tsx:99-101` `stateInitializer` on the first render. PathChecker mounts during the open, and its first effect is skipped (`PathChecker.tsx:11-12`, `newRenders > 1`) | **yes** | `stateInitializer` → `getOne` (`reducer.ts:1536`) → `decompressState` (`:1583`) → drain (`:1589-1590`) → `SaveManager.load` (`:1593`) → `store.dispatch(LOAD)` (`SaveManager.ts:59`) |
| 2 | Dashboard → project through the UI: card or row (`pages/components/Project.tsx:194-196`), left-bar recents (`LeftBar.tsx:492` → `132-134`), activity items (`ActivityItem.tsx:72`, `GroupedActivityItem.tsx:23`) | `R.navigate` sets `U.navigating = true` and the hash, then reloads (`U.tsx:138-140`). The hash change moves the pathname from `/allProjects` to `/project` | new document: as #1. Dying document: `LeftBar.tsx:133` `U.resetState()` (left-bar recents only), and PathChecker when the `hashchange` is processed before the unload (measured: a second reset in 3 of 4 recorded clicks, timing-dependent). Its dispatches are dropped by `reducer.ts:611` | **yes**, by the reload | as #1 |
| 3 | Project A → project B through the UI: navbar recent projects (`Navbar.tsx:1297`), `R.navigate` | the hash `id`, then a reload | new document: as #1. Dying document: nothing (pathname unchanged; measured in b2: no reset in A's document) | **yes**, by the reload | as #1 |
| 3b | #3 with unsaved changes (`U.isProjectModified`, the prompt enabled by `ProjectEditor.tsx:409`) and "Stay on page" | the hash `id` only: the reload is cancelled | nothing. `U.navigating` stays `true`, and **the reducer drops every action from then on** (`reducer.ts:611`) | **no** | — |
| 4 | Hash edit or in-page navigation from a non-project page to `/project?id=A` (address bar, history, `ProjectLoadingScreen.tsx:18-20` then Back) | pathname | PathChecker (`PathChecker.tsx:12`) → `U.resetState` (`U.tsx:446-449`): an empty LOAD (deferred) and `stateInitializer` | **yes** | `U.resetState` → as #1 from `stateInitializer` |
| 5 | Hash edit `/project?id=A` → `/project?id=B` (address bar) | search `id` | nothing | **no** | — |
| 6 | Back/forward between two `/project?id=` entries of one document, **including after #2 and #3** (list → A, navbar → B, Back: a same-document navigation) | search `id` | nothing | **no** | — |
| 7 | Back/forward between `/allProjects` and `/project?id=A` in one document | pathname | as #4 | **yes** | as #4 |
| 8 | `/project?id=A` → `/project?id=A&repair=1`, or any other param on `/project` | search, same `id` | nothing | no (and should not) | — |
| 9 | `/project?id=A` → `/project` (no `id`) | search | nothing | no | — |
| 10 | `/allProjects` → `/allProjects?filter=x` (`LeftBar.tsx:124`, `Catalog.tsx:214,225`) | search | nothing | not a project open (and must stay no reset) | — |
| 11 | Share link (`Dashboard.tsx:93-101`, `shareUtils.ts:10-13`) | clipboard only, `https://app.jjodel.io/#/project?id=…` | pasted in the same tab: #5 if already on a project, #4 otherwise, #1 if another origin | — | — |
| 12 | `SmokeBoot` (dev) | none: it builds into the id already in the URL and never navigates (`SmokeBoot.tsx:17-21`) | — | — | — |

Rows 3b, 5 and 6 are the ticket's cases. Row 6 after UI opens is new: it needs no hand-edited URL. Open A from
the list, switch to B from the navbar's recent projects, and press Back.

## §2 Measurements (item 2), verbatim excerpts

Each block is the probe's output, trimmed to the lines that carry the claim (`…` elides the id's prefix).
Timestamps in `[s]` count from the scenario start. The 4-digit numbers are `performance.now()` in the
document named by the 5-letter id.

### (a) A open by deep link, hash edited to B

```
--- A open: {"doc":"7aiaf","storeProjects":["ER_2"],"storeHasUrlProject":true,"LProject_getProject":"ER_2","isLoading":false,...,"pageErrs":0}
    [52.10s] 7aiaf 38369 hashchange {"from":"/project?ER_2","to":"/project?9_HX"}
    console.error ... wrong project setup in navbar {projectid: Pointer1790290235219_HX, project: undefined}
--- after hash -> B (+6 s): {"doc":"7aiaf","url":"#/project?id=…HX","storeProjects":["ER_2"],"storeHasUrlProject":false,
    "LProject_getProject":null,"isLoading":false,"loadingScreen":false,"tryErrors":0,
    "body":"Jjodel File Edit View Analyze Basic Advanced Help OU All projects Project Megamodel METAMODELS New metamodel MODELS New model TRANSFORMS New","pageErrs":0}
--- after a state change + SaveManager.save(): {...,"storeProjects":["ER_2"],"body":"","pageErrs":56}
    pageerror: Cannot read properties of undefined (reading 'type') | at ProjectComponent (/src/pages/Project.tsx:51:13)   [×2; source :90]
    pageerror: $measurable[type] is not a function | at MeasurableComponent2.afterUpdateSingle (/src/components/forEndUser/Measurable.tsx:327:22)   [×52]
    pageerror: Maximum update depth exceeded. ...   [×2]
    stored before: {"ER_2":{"len":13407,...,"idlookup":19,"m2":1,"m1":1},"9_HX":{"len":13400,...,"idlookup":19,"m2":1,"m1":1}}
    stored after : {"ER_2":{"len":13407,...},"9_HX":{"len":13400,...}}          (identical)
```

(a2), the same followed by `#/allProjects`: `{"url":"#/allProjects","storeProjects":["ER_2"],"body":"","pageErrs":56}`.
It records a `hashchange` but no `U.resetState`.

**What the user sees.** On the hash change, **no open starts** and no throw happens yet. `ProjectComponent`
does not re-render on a location change: its `mapStateToProps` reads the URL but runs only on store changes.
Its children do re-render. `ProjectDashboard` reads the id through `useQuery`/`useLocation`
(`Dashboard.tsx:562-564`) and `Navbar` through `U.getProjectID_URL()` (`Navbar.tsx:564`). The editor becomes an
**empty unnamed project** ("Project Megamodel", "New metamodel"). The **next store change** re-renders
`ProjectComponent`, which throws on `project.type` (`Project.tsx:90`), and the cascade ends in a **blank page**.
The cascade is 56 page errors: a `Measurable` loop, then `Maximum update depth exceeded` inside `TryComponent`.
After that nothing reacts to the location any more, and the tab needs a reload. **The stored copies are
unchanged**: `SaveManager.save()` finds no project (`LProject.getProject()` is `null`), so it writes nothing.

### (b) Back and forward

(b1): deep link A, hash → B, back, forward. All four in one document (`fsoij`):

```
--- hash -> B:  {"storeProjects":["ER_2"],"storeHasUrlProject":false,"LProject_getProject":null,"isLoading":false,...}
--- back:       {"doc":"fsoij","storeProjects":["ER_2"],"storeHasUrlProject":true,...}   hashchange {"from":"/project?9_HX","to":"/project?ER_2"}
--- forward:    {"doc":"fsoij","storeProjects":["ER_2"],"storeHasUrlProject":false,...}  hashchange {"from":"/project?ER_2","to":"/project?9_HX"}
```

(b2): the UI path. Open A from the list, then `R.navigate('/project?id=B')` as the navbar's recent projects
does, then back and forward:

```
--- A open (list click):      {"doc":"9ch1a","storeProjects":["ER_2"],...}
--- R.navigate(/project?id=B): {"doc":"be03k","storeProjects":["9_HX"],...}     (reload: new document; nothing fired in 9ch1a)
--- back:    {"doc":"be03k","url":"#/project?id=…USER_2","storeProjects":["9_HX"],"storeHasUrlProject":false,"LProject_getProject":null,...}
             be03k 1562 hashchange {"from":"/project?9_HX","to":"/project?ER_2"}
--- forward: {"doc":"be03k","storeProjects":["9_HX"],"storeHasUrlProject":true,...}
```

**Back after two UI opens is a same-document navigation.** The document stays `be03k`, the `hashchange`
fires, no open starts, and B stays under A's URL. The user sees what (a) showed.

### (c) A still loading, hash to B

A's decompress is delayed 3 s in the probe, and the hash goes to B 0.8 s after the loading screen appears.

```
c:-:deep   (A by page load)
    tl 3142ms {"url":"9_HX","store":"","isLoading":true,"ls":true,"errs":0}
    fdy0z 5110 SaveManager.load {"pid":"ER_2","url":"9_HX"}
    tl 5159ms {"url":"9_HX","store":"ER_2","isLoading":false,"ls":false,"errs":56}
--- end: {"storeProjects":["ER_2"],"storeHasUrlProject":false,"body":"","pageErrs":56}
c:-:spa    (A by hash from the list, in-page)
    tl 4765ms {"url":"9_HX","store":"ER_2,9_HX","isLoading":true,"ls":true,"errs":0}      (the dashboard's stubs)
    8uqnl 6958 SaveManager.load {"pid":"ER_2","url":"9_HX"}
    tl 6983ms {"url":"9_HX","store":"ER_2","isLoading":false,"ls":false,"errs":56}
```

A's open completes under B's URL. Its `checkLoaded` is still the current run's, so it clears the loading flag
(`reducer.ts:1547-1556`), and the page throws at once (the LOAD is itself the store change) and goes blank.
The page-load form behaves the same: the loading screen, and so PathChecker in the same `HashRouter`, are
already mounted while A loads (`App.tsx:135-178`).

### (d) Controls: B opens

```
d (list -> A -> navbar logo -> list -> B, each a reload):
--- A open (list click): {"doc":"lyq8j","storeProjects":["ER_2"],...}
    pi597 4069 U.resetState {"url":"ER_2","from":"at selectProject (/src/pages/components/LeftBar.tsx:128:7) <- at onClick (.../LeftBar.tsx:708:89)"}
    pi597 4078 U.resetState {"url":"ER_2","from":"at /src/components/pathChecker/PathChecker.tsx:22:9 <- at commitHookEffectListMount ..."}
--- B open (list click): {"doc":"vo2rg","storeProjects":["9_HX"],"storeHasUrlProject":true,"isLoading":false,"pageErrs":0}
    luvcu 2964 U.resetState {"url":"9_HX","from":"at selectProject (/src/pages/components/LeftBar.tsx:128:7) ..."}   (no PathChecker this time)
dspa (list, hash A, hash #/allProjects, hash B, in-page, A4's form with A loaded first):
--- B open (hash): {"doc":"0q9qx","storeProjects":["9_HX"],"storeHasUrlProject":true,"isLoading":false,"pageErrs":0}
```

Both controls open B. In the dying dashboard document the UI click starts one or two in-page opens. The left
bar's reset ran in every recorded click. A second reset ran in 3 of 4: in d, 1 of 2, named PathChecker by its
stack; in b2 and b2:E2, two resets each, the b2 pair recorded before the stack was added. The reducer drops
their dispatches (`U.navigating`, `reducer.ts:611`).

### (f) A modified, `R.navigate` to B, "Stay on page"

```
f:   dialog beforeunload -> dismiss;  y34in 3898 hashchange {"from":"/project?ER_2","to":"/project?9_HX"}
--- {"doc":"y34in","url":"#/project?id=…HX","storeProjects":["ER_2"],"LProject_getProject":null,"isLoading":false,"loadingScreen":false,
     "body":"... Project Megamodel METAMODELS New metamodel ...","pageErrs":0}
```

The prompt was enabled by `U.enableUnsavedChangesWarning()` (as `ProjectEditor.tsx:409` does) and
`U.isProjectModified = true`, after one click for user activation. The user stays on the page with B's URL,
A's store, and `U.navigating === true`, so every later action is dropped.

## §3 Emulated candidate (item 2 continued, item 3 evidence)

### 3.1 (a) with E1 and E2: B opens, the stored copies are safe

```
a:E1  mvg4q 2471 hashchange {"from":"/project?ER_2","to":"/project?9_HX"}   2527 emu.reset "E1"   2564 SaveManager.load {"pid":"9_HX","url":"9_HX"}
--- after hash -> B (+6 s): {"storeProjects":["9_HX"],"storeHasUrlProject":true,"LProject_getProject":"9_HX","isLoading":false,"pageErrs":0}
    stored after: "9_HX":{"len":13436,"lastModified":1790340890207,"idlookup":19,"m2":1,"m1":1}   (saved as B, content intact); "ER_2" unchanged
a:E2  identical outcome; hashchange 3041 -> emu.reset 3108 -> SaveManager.load 9_HX 3147
```

In both, `wrong project setup in navbar {projectid: …HX, project: undefined}` is logged once between the hash
change and the reset. For those two frames the editor rendered B's id with A's store: the render window of H2
(ii). No throw happened, because no store change landed in the window. In (a), one store change inside that
state was enough to produce the blank page. E2's `isLoading = true` did not close the window. `ProjectComponent`
re-renders only on a store change or `PROJECT_OPEN_CHANGED`, so its guard is not evaluated while the children
render the new location. The guard has to subscribe to the location itself (§8).

### 3.2 Back and forward with E2 (b2:E2)

```
--- back:    {"doc":"q98tp","url":"#/project?id=…USER_2","storeProjects":["ER_2"],"storeHasUrlProject":true,"pageErrs":0}   SaveManager.load {"pid":"ER_2","url":"ER_2"}
--- forward: {"doc":"q98tp","url":"#/project?id=…HX","storeProjects":["9_HX"],"storeHasUrlProject":true,"pageErrs":0}      SaveManager.load {"pid":"9_HX","url":"9_HX"}
```

### 3.3 The counter (H3)

```
a4:-  (committed code, A4's form: hash A, 0.8 s, #/allProjects, 0.4 s, hash B; A delayed 3 s)
    5qqfa 5060 SaveManager.load {"pid":"9_HX","url":"9_HX"}
    tl 5084ms {"url":"9_HX","store":"9_HX","isLoading":false,"ls":false,"errs":0}
    5qqfa 6860 SaveManager.load {"pid":"ER_2","url":"9_HX"}
    tl 6882ms {"url":"9_HX","store":"ER_2","isLoading":false,"ls":false,"errs":0}
--- end: {"storeProjects":["ER_2"],"storeHasUrlProject":false,"LProject_getProject":null,"body":"... Healthy_0030 METAMODELS M metamodel_1 ..."}
c:E2:deep:A3000          B loaded at 3538ms ({"store":"9_HX","isLoading":false}); 8559n 5386 SaveManager.load {"pid":"ER_2","url":"9_HX"}; tl 5398ms {"store":"ER_2","isLoading":false,"ls":false}
c:E2:spa:A3000           B loaded at 4859ms; 2gu7w 6967 SaveManager.load {"pid":"ER_2","url":"9_HX"}; tl 6974ms {"store":"ER_2","isLoading":false,"ls":false}
c:E2:deep:A3000,B6000    tl 5124ms {"store":"ER_2","isLoading":true,"ls":true}; tl 9251ms {"store":"9_HX","isLoading":false,"ls":false}   (correct end state)
```

The superseded open is stopped from clearing the flag (`reducer.ts:1547`) but not from loading: nothing checks
`run` between `await decompressState` (`:1583`) and `SaveManager.load` (`:1593`). This is **reachable today
without the fix**: open a large project in-page, go back to the list, and open a small one before the first
finishes. The editor then shows A's content under B's URL. The next store change then re-renders `ProjectComponent`
with `project` undefined. That throw was read here and measured in the same state in (a).

### 3.4 `pointedBy` (H4)

Store after the open of B (the LOAD), then after one dispatch, then B's blob after `SaveManager.save()`. The
seeded blob is 3/3.

```
deep link B:                                    after LOAD 3/3, pending 0;  after 1 dispatch 3/3;  stored 3/3
list -> hash B (pathname change, A5's path):    after LOAD 3/3, pending 12; after 1 dispatch 4/5;  stored 4/5
   pendingList: ECHAR<-classs, ESTRING<-classs, EDATE<-classs, EBOOLEAN<-classs, EBYTE<-classs, ESHORT<-classs,
                EINT<-classs, ELONG<-classs, EFLOAT<-classs, EDOUBLE<-classs, EOBJECT<-classs, EOBJECT<-ecoreClasses
A -> hash B, E2:                                after LOAD 3/3, pending 0;  after 1 dispatch 3/3;  stored 3/3
A -> hash B, E3 (sync empty LOAD):              3/3, pending 0; 3/3; stored 3/3
list -> hash B, every reset with a sync empty LOAD:  after LOAD 3/3, pending 0; after 1 dispatch 3/3; stored 3/3
```

The positive control (A5's path) has signal: 12 pending, 4/5 stored, the same numbers as A5's table. The
pending paths are the `classs` and `ecoreClasses` entries of the Ecore primitives, which the deferred empty
LOAD and `init jodel state` leave unresolved **when the reset starts from the dashboard's state**. The same
reset from a loaded project leaves none.

## §4 Findings

- **F1** (H1): an in-page change of project id never starts an open, whether by hash edit, by back/forward
  between two projects, or by **Back after two ordinary UI opens**. It also never starts one after a cancelled
  "leave page" prompt.
- **F2**: the damage comes in two steps. First an empty editor under B's URL, whose `ProjectDashboard` and
  `Navbar` read the id from the URL. Then, at the next store change, a throw in `ProjectComponent` and a blank,
  dead tab. The stored copies are not touched (measured, a).
- **F3** (H3): a superseded open still dispatches its LOAD. The counter covers the flag only. This is reachable
  today in A4's own form.
- **F4** (H2 ii): between a location change and any effect, the project page's children render the new id with
  the old store. `ProjectComponent` does not re-render on a location change.
- **F5** (out of scope, new): after `R.navigate` whose reload is cancelled by "Stay on page", `U.navigating`
  stays `true` and `reducer.ts:611` drops every action for the rest of the tab's life. Unsaved edits of A stay
  in the store but can be neither changed nor, under B's URL, saved.
- **F6** (H4): A5's growth depends on the dashboard state, not on the id path. A synchronous empty LOAD in
  `U.resetState` removes it (measured by E3 on every reset).

## §5 Risks of the candidate (§8)

1. **Dying-page opens on project → project `R.navigate`** (#3). The id key makes PathChecker fire on the
   `hashchange` in a page that is reloading, as it already does for dashboard → project (#2, measured). The
   reducer drops its dispatches (`reducer.ts:611`), and `stateInitializer` writes nothing but statics and a
   `getOne` read. This was read, and measured only for the #2 analog.
2. **"Stay on page"** (#3b, F5). The id key starts B's open, but its LOAD is dropped, so the loading screen
   stays forever (measured, `f:E2`: `"isLoading":true,"loadingScreen":true`, store A). Today the tab shows an
   empty editor that drops every edit. Neither loses stored data, and the cause is F5, not this change.
3. **The page-load window.** A hash change after `stateInitializer` starts and before PathChecker mounts (App's
   second render) is not seen. The guard then shows the loading screen with no open behind it. The window is
   narrow (PathChecker is mounted while the loading screen shows) and was not measured.
4. **The guard's fallback.** With no `loadError`, a missing URL project shows the loading screen with its back
   button. That is right while an open runs, and a dead end in risks 2 and 3 (Q2).
5. **A superseded reset's `.then(SetRootFieldAction('isLoading', false))`** (`U.tsx:448`) clears
   `state.isLoading`, which drives App's overlay `Loader` (`App.tsx:127`), while the newer open still loads. The
   project page keeps its own screen, so the effect is cosmetic and pre-existing.
6. **Online mode** was not measured. There `getOne` is a network fetch, so any order of A and B can happen; the
   superseded checks do not depend on order.
7. **Collaborative projects** (`Project.tsx:90`, `CollaborativeAttacher`) were not measured. During an id change
   the guard unmounts the attacher of A before B's open.

## §6 Tests that would pin it

Model: `saveManager_load.test.ts` and 0030's mutant table. The bench is `environment: 'node'` and includes only
`*.test.ts` (`vitest.config.ts`). It has no DOM and no React renderer, and adding one is a new dependency
(Rule 4). So PathChecker's decision moves into a pure module that the bench can import (§5 of `CLAUDE.md`, the
`nameLookup.ts` pattern). `stateInitializer` and `Project.tsx` do not import in the bench (0030 §8), so their
rules are held by probes on 3003 and each probe names the mutant it kills. No source-text test.

| Test | Rule | Kills |
|---|---|---|
| K1 (vitest) | `openKey('/project','?id=A') !== openKey('/project','?id=B')` | M1 |
| K2 (vitest) | `openKey('/project','?id=A') === openKey('/project','?id=A&repair=1')` | M2 |
| K3 (vitest) | `openKey('/allProjects','') === openKey('/allProjects','?filter=public')` | M2 |
| K4 (vitest) | `openKey('/allProjects','') !== openKey('/account','')`, and `openKey('/project','?id=A') !== openKey('/project','')` | M3 |
| P1 (probe, a) | hash A → B: B opens, and **no** render of the editor with B's id before B's LOAD (the `wrong project setup in navbar` line carrying B's id counts 0 between the `hashchange` and `SaveManager.load(B)`), 0 page errors | M5, M6 |
| P2 (probe, c) | A delayed 3 s, hash → B at 0.8 s: the end store is B, and `SaveManager.load(A)` never runs | M4 |
| P3 (probe, b2) | list → A, `R.navigate` → B, Back: A opens in the same document; Forward: B | M1 (at runtime) |
| P4 (probe, deep) | deep link A: one `stateinitializer` in the document, no `U.resetState` | M7 |
| P5 (probe, controls) | d, dspa and A4 (A loaded first) open B as today; `/allProjects?filter=` changes fire no reset | none (control) |

Mutants (at least four are asked; seven are listed):

- **M1**: `openKey` returns `pathname` only (today's behavior).
- **M2**: `openKey` keys on the whole `search`. This would reset on `repair=1`, and on every dashboard filter
  click.
- **M3**: `openKey` returns the id only, ignoring the pathname.
- **M4**: the superseded check before `SaveManager.load` removed.
- **M5**: the `!project` guard in `Project.tsx` removed.
- **M6**: the `useLocation()` subscription in `Project.tsx` removed, so the guard is evaluated only on store
  changes, as E2 showed.
- **M7**: PathChecker's first-run skip removed, so it resets on mount.

## §7 Open questions for Alfonso

- **Q1. How is the id key tested: a pure module and a vitest, or probes only?** The module version touches 5
  files (3 modified, 2 new) and so needs `Lane: full (more than 3 files)` (RC-3). The probe-only version touches
  3 files and can run in the fast lane. *Recommended:* the pure module and the vitest (§5 of `CLAUDE.md`: move
  the logic where the bench runs it), in the full lane.
- **Q2. When the URL's project is not in the store and no open has failed, what does `Project.tsx` show?**
  *Recommended:* the existing loading screen with its back button. PathChecker always starts an open, and a
  failed open already turns that screen into the error screen (`loadError`).
- **Q3. Is A5's fix in this lane?** It is one line in `common/U.tsx` (the reset's empty LOAD synchronous) and
  measured to remove the growth (§3.4). *Recommended:* no, a lane of its own. It does not come from the id key:
  it is a different file and a different path, and it changes the timing of every reset, dashboard ones
  included.
- **Q4. Does F5 (the frozen reducer after "Stay on page") get a ticket?** *Recommended:* yes, **high**, a lane
  of its own (`R.navigate` should restore `U.navigating` when the unload is cancelled). The in-page open this
  lane adds cannot complete while it stands (risk 2).
- **Q5. Is the page-load window (risk 3) accepted as a residual?** *Recommended:* yes, recorded in the closing
  entry. Closing it means PathChecker compares against the id of the latest open, which needs a new exported
  static on `ProjectsApi`: more surface for a window that was not observed.
- **Q6. Where do the superseded checks go?** *Recommended:* two, one right after `await ProjectsApi.getOne`
  and one right after the drain. The first also keeps a superseded never-saved project from persisting its stub
  (`reducer.ts:1579`) into the newer open's store (read, not measured).

## §8 Candidate fix (item 3), not applied

The candidate has three parts, one per failure. Everything goes through the open path that `0609e9793` fixed:
`U.resetState` → `stateInitializer`, with its catch, `loadError`, save guard, `openRun` and
`PROJECT_OPEN_CHANGED`. None of them changes.

1. **Start the open on a change of project id.** New `frontend/src/components/pathChecker/openKey.ts`:
   `export function openKey(pathname: string, search: string): string`. It returns `pathname` off `/project`,
   and `'/project?id=' + (new URLSearchParams(search).get('id') ?? '')` on it. In `PathChecker.tsx`,
   `const {pathname, search} = useLocation();` and the effect deps become `[openKey(pathname, search)]`. The
   body, the `renders` first-run skip and the commented condition stay as they are (Rule 8).
2. **Never render a project that is not the URL's.** In `frontend/src/pages/Project.tsx`: `useLocation();`
   next to the existing hooks, so the component re-renders on a location change in the same pass as its
   children (F4, M6). After `let project = LProject.getProject();` (`:80`):
   `if (!project) return <ProjectLoadingScreen error={ProjectsApi.loadError} />;`. The existing
   `isLoading` branch (`:69-70`) is untouched.
3. **A superseded open loads nothing.** In `frontend/src/redux/reducer/reducer.ts`, `stateInitializer`, project
   branch: `if (run !== openRun) return;` right after `await ProjectsApi.getOne(pid)` (`:1536`) and right after
   the drain (`:1590`, before `recursiveCheck()`). The existing `run === openRun` checks stay.

**Files: 5.** `frontend/src/components/pathChecker/PathChecker.tsx`, new
`frontend/src/components/pathChecker/openKey.ts`, new
`frontend/src/components/pathChecker/__tests__/openKey.test.ts`, `frontend/src/pages/Project.tsx`,
`frontend/src/redux/reducer/reducer.ts`. That is at the Rule 19 threshold, not over it. No exported interface
changes; `openKey` is new. Docs go in the closure commit: the log entry, the Status flip, and the ticket of Q4
if ruled. Beyond its own rules, the fix is expected to cover the high ticket's cases (a), (b) and (c), row 6 of
§1, and F3 in A4's form, which is reachable today. It does not cover A5 (Q3) or F5 (Q4).

### Layer Impact Report — draft (the definitive one goes in chat before the edit)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)   — which LOADs reach the store: a superseded open's no longer does;
                                   an in-page id change now triggers the existing reset (empty LOAD + open)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString) — not touched; the save guard of 0609e9793 unchanged

D-layer:
  - What changes: PathChecker's reset (U.resetState, unchanged) also runs when /project's id changes;
    stateInitializer returns without dispatching when a newer open has started (after getOne, after the drain).
  - What does NOT change: U.resetState, the LOAD reducer case, SaveManager.load (synchronous LOAD), the drain,
    checkLoaded, the catch and loadError, the save guard, VersionFixer, every other dispatch.
  - Cross-layer interaction: Project.tsx renders the loading screen while the store lacks the URL's project;
    the editor subtree (dock, canvases, sync hooks) unmounts before the new open, as on a pathname change.
  - Side-effect safety vs other layers: no canvas/sync/JjOM file; no TRANSACTION added (Rule 12).

Smoke-test scenarios potentially affected:
  - deep link, list click, reload: one open, store equal to today's
  - list -> A, navbar recents -> B, Back -> A, Forward -> B, each opens the URL's project in the same tab
  - hash edit A -> B in an open tab: B opens; save -> reopen -> identical state
  - A slow, B fast (hash, and A4's #/allProjects form): the end store is B
  - dashboard filter clicks: no reset
```
