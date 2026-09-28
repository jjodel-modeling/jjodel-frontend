# Discovery: a cancelled navigation leaves the tab dead (Phase 1)

Prompt-ID: P-2026-09-25-1905 · prompt `docs/prompts/claude_2026-09-25_1905_prompt_navigate_cancel_discovery.md`
(read from `~/jjodel-release`, as the prompt says)
Session: f2c4a398-3d32-41d5-bd62-f77c2334f185 (read from the harness scratchpad path)
Tree: `~/jjodel-open`, branch `navigate-cancel`, HEAD `b5e109519` for the whole phase. The prompt asked for the
trunk tip at `df94302e6`. The trunk had moved to `98ff75a27` (5 commits, docs plus `frontend/vite.config.ts`),
so the session stopped. Alfonso then set the base at `b5e109519`. None of the files this lane reads differ between
`df94302e6` and `b5e109519`. The file name keeps the prompt's date (2026-09-25). The phase ran on 2026-09-26.
Executor: Anthropic Claude Opus 5.5 (as the session banner shows it).

This report holds hypotheses with evidence. It is not a reference. Whoever uses it downstream re-reads the
real files. "Measured" means a run in this phase on HEAD `b5e109519`, with a dev server on 3003 serving this tree.
"Read" means read from a file. "Emulated" means an in-page probe that stands in for a candidate fix, with no source
edit. It is evidence about the candidate's mechanism, not about the candidate's code.

**Questions for Alfonso are in §7, before the candidate (§8).**

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Every way to reach the stuck state goes through `R.navigate`. | **Holds** (read, §1). `U.navigating` has one writer, `U.tsx:138`, inside `R.navigate`. It has two readers, `App.tsx:112` and `reducer.ts:611`. The 34 grep lines of `R.navigate(` are 27 calls plus 7 strings or comments. Only 4 call sites can meet the prompt: the logo, the recent projects, the user menu's Dashboard, and `AuthApi.logout` behind the three Sign-out entries. The other reloads never set the flag. |
| H2 | After "Stay on page" the hash is already the target's, so the URL and the shown project disagree. | **Holds, and it is worse than stated** (measured, §2). The hash is the target's in all 4 Stay runs. The router has moved too: `location.hash =` fires `popstate` synchronously inside `R.navigate`, before the dialog. So the page renders the target route over the old store. From the logo it shows an empty dashboard frame. For project → project it shows "Loading Project..." forever. From Sign-out it shows the in-app dialog, stuck over `/auth`. The editor unmounts and its cleanup removes the `beforeunload` handler (`"handler":false`). After Stay, closing the tab no longer warns about the unsaved work that is still in the store. No edit reaches the store, and Cmd+S writes nothing. |
| H3 | A reset after `reload()` (a macrotask, `pageshow`, `focus` or `visibilitychange`) runs on cancel and never renders anything wrong when the reload proceeds. | **Falsified** (measured and emulated, §2.3, §3). `pageshow` and `visibilitychange` do not fire on Stay. `focus` does not fire after the headless dialog, which is not evidence for a real window. `setTimeout(0)` does fire on Stay, but only after PathChecker has already started the target's open. Once the flag is reset, that open completes. A's unsaved edit is replaced by B, B shows "Unsaved" and Cmd+S writes B (C1). On Leave, the timer fired before `pagehide` in 1 of 9 runs. A signal that works in Chromium: the Navigation API `navigate` event of the reload. Its `signal` is aborted synchronously inside `reload()` when the user stays, and not when the user leaves (12/12 Stay runs, 0/8 Leave or proceed runs). |
| H4 | Nothing else depends on `U.navigating` staying `true` until unload. | **Holds for the flag, not for the callers** (read and measured, §1, §3.3). No other code reads the flag. The LeftBar and Navbar close paths disable the warning first, so they never prompt. The candidate is inert on them (measured control). But two callers do work that "Stay" cannot undo, before `R.navigate`. `AuthApi.logout` clears the login first. With the candidate the tab works, but Cmd+S persists nothing and clears the dirty flag. The user menu's Dashboard calls `U.resetState()` first. With the candidate, that reopen of A from storage lands and replaces the unsaved edit. Today both are frozen instead. `Action.fire` defers every dispatch to a macrotask (`action.ts:349`), so anything fired just before `R.navigate` is dropped today and would apply after a reset. |

## Objective

This phase covers items 1-4 of the prompt:

- the callers of `R.navigate`, and every reader and writer of `U.navigating` (H1, H4);
- a measurement on 3003 of "Stay" and "Leave" from two UI callers, plus the project → project case of the ticket;
- a candidate fix, not applied, with its mutants;
- this report.

Out of scope and not touched: any source edit, the save format, the open path of 0030/1440 except where
`R.navigate` enters it, the `pointedBy` ticket, the simulator.

## Files read (full paths)

- `/Users/alfonso/jjodel-open/frontend/src/common/U.tsx`:
  - `99-146` (`R`, `R.replace`, `R.refresh`, `R.navigate` whole);
  - `170-252` (`U.navigating`, `isProjectModified`, `enableUnsavedChangesWarning`, `disableUnsavedChangesWarning`,
    `shouldBypassBeforeUnload`);
  - `405-449` (`dialog`, `dialog2`, `compressedState`, `isOffline`, `resetState`).
- `/Users/alfonso/jjodel-open/frontend/src/App.tsx`: `70-120` (the first render, the `Loader` returns at `108`
  and `112`) and `225-254` (`mapStateToProps`: App re-renders on `isLoading` and `user` only).
- `/Users/alfonso/jjodel-open/frontend/src/redux/reducer/reducer.ts`: `598-625` (the `reducer` head, the drop at
  `611`) and `1476-1636` (`openRun` and `stateInitializer` whole).
- `/Users/alfonso/jjodel-open/frontend/src/redux/action/action.ts`: `320-356` (`Action.fire`, the deferred
  dispatch at `349`) and `387-401` (`LoadAction`).
- `/Users/alfonso/jjodel-open/frontend/src/components/project/ProjectEditor.tsx`: `395-420` (the effect at `405-411`),
  `480-505` (`markDirty`, `clearDirty`), `585-685` (the description, tag and type handlers that call
  `markDirty`) and `2453-2486` (the description editor).
- `/Users/alfonso/jjodel-open/frontend/src/pages/components/LeftBar.tsx`: `40-62` (`Item`, the string `action`
  at `54`), `100-200` (`selectProject`, `closeProject`, `doclose`, `saveAndClose`) and `380-500` (the project
  branch versus the dashboard branch).
- `/Users/alfonso/jjodel-open/frontend/src/pages/components/Navbar.tsx`:
  - `380-392` (a menu entry with no sub-items is not rendered) and `490-525` (`CloseProject`,
    `SaveAndCloseProject`);
  - `555-575` (`recentProjects`) and `1105-1150` (Cmd+Alt+W, Cmd+Alt+Q);
  - `1280-1365` (the recent projects, Jjodel > Sign-out, File) and `1822-1832` (the logo);
  - `1990-2022` (the user menu: Dashboard, Sign out).
- `/Users/alfonso/jjodel-open/frontend/src/pages/components/menu/Menu.tsx`: `80-146` (the portalled user menu, `Item`).
- `/Users/alfonso/jjodel-open/frontend/src/api/persistance/auth.ts`: `20-40` (`logout`).
- `/Users/alfonso/jjodel-open/frontend/src/api/persistance/projects.ts`:
  - `40-60` (`isLoading`, `create`, the `R.navigate` at `52`);
  - `140-200` (`save`, the dirty flag cleared at `178` whatever `persisted` says).
- `/Users/alfonso/jjodel-open/frontend/src/data/storage.ts`: `89-97` (`resetLogin`).
- `/Users/alfonso/jjodel-open/frontend/src/common/libraries/projectModified.ts` (whole).
- `/Users/alfonso/jjodel-open/frontend/src/components/pathChecker/PathChecker.tsx` (whole) and `openKey.ts` (whole).
- Other callers, each at the cited window:
  - `/Users/alfonso/jjodel-open/frontend/src/pages/Auth.tsx` `185-250`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/Project.tsx` `50-100`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/Updates.tsx` `160-175`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/components/Project.tsx` `183-200`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/components/RightPanel/RightPanel.tsx` `40-60`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/components/RightPanel/ActivityItem.tsx` `62-78`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/components/RightPanel/GroupedActivityItem.tsx` `15-28`;
  - `/Users/alfonso/jjodel-open/frontend/src/pages/AllProjects.tsx` `25-55`;
  - `/Users/alfonso/jjodel-open/frontend/src/utils/keyboardShortcuts.ts` `30-50` (the context detection) and `122`.
- `/Users/alfonso/jjodel-open/frontend/vitest.config.ts` (whole).
- `/Users/alfonso/jjodel/frontend/node_modules/@remix-run/router/dist/router.js`, `355-367` and `438` (the hash
  history listens to `popstate` only, and reads `window.location` when the event fires).
- Docs:
  - `/Users/alfonso/jjodel-open/docs/discovery/discovery_2026-09-25_hash_change_open.md` (§0, §1, §2 (f), §4 F5,
    §5, §6-§8);
  - `/Users/alfonso/jjodel-open/docs/discovery/discovery_2026-09-25_project_open_path.md` (by search on
    `navigat`);
  - `/Users/alfonso/jjodel-open/docs/claude-code-log.md` `1-80` (the 1440 entry and its ticket at `43`; the
    `versionfixer` inbox was folded in `02f16c829`);
  - `/Users/alfonso/jjodel-open/docs/PROTOCOL.md` P13 and P14;
  - `/Users/alfonso/jjodel-open/docs/decisions.md` `1-80` and RC-17.

Searches (BSD `command grep`, each with its exit status and a positive control through the same command):

- `command grep -rn "navigating" --include='*.ts' --include='*.tsx' frontend/src` exits 0. The only hits on
  `U.navigating` are `U.tsx:133,138,181`, `App.tsx:98,110,112,117` (98, 110 and 117 are commented logs) and
  `reducer.ts:611`. Control: `isProjectModified` returns 90 lines.
- `command grep -rn "R\.navigate(" ... | wc -l` returns 34 lines. Their breakdown is in §1.
  `command grep -rn "R\.navigate\b" | command grep -v "R\.navigate("` returns only comments, so no call passes
  `R.navigate` as a value.
- `command grep -rln "RightPanel" --include='*.tsx' --include='*.ts' frontend/src` returns `Dashboard.tsx` (a TODO
  comment at `645-649`), the component itself, its `index.ts` and an unrelated identifier in
  `JjtlDevelopmentEnv.tsx`. So `RightPanel` is mounted nowhere, and neither are `ActivityItem` and
  `GroupedActivityItem`: `command grep -rn "ActivityItem\b" --include='*.tsx' . | command grep -v RightPanel/` exits
  1. Controls: the same `-rln` for `LeftBar` returns `Toolbar.tsx`, `ProjectEditor.tsx` and `Navbar.tsx`, and the
  same pipeline for `LeftBar\b` returns `Toolbar.tsx:332` and `ProjectEditor.tsx:395`.
- `command grep -rn "beforeunload\|onbeforeunload\|pagehide\|pageshow\|visibilitychange\|'unload'"` outside the
  tests: the only `beforeunload` listener is `U.tsx:237`.
- `command grep -rln "reducer/reducer'\|common/U'" --include='*.test.ts' frontend/src` exits 1, so no test
  imports `reducer.ts` or `U.tsx` by those paths. Control: the same command with `\|/openKey'` added returns
  `components/pathChecker/__tests__/openKey.test.ts`.

## §0 Environment and method

**Server.** Vite on **3003**, started from this tree (`npx vite --port 3003 --strictPort` in `frontend/`) after
`lsof -nP -iTCP:3003 -sTCP:LISTEN` exited 1. Stopped at the end: the listener was pid 64378,
`node …/jjodel-open/frontend/node_modules/.bin/vite --port 3003`, and `lsof` found 3003 free afterwards.

**Temporary symlink.** `frontend/node_modules -> /Users/alfonso/jjodel/frontend/node_modules`, created at 10:59:40
after `test ! -e && test ! -L` confirmed it did not exist, and removed at the end. `git status` was empty before
and after.

**Server log.** It holds no dependency-scan failure: a search for `scan|failed|nearley` returns nothing, and the
control `VITE` returns the ready line. Page loads took 0.1-0.2 s on a warm per-tree cache.

**Browser.** Playwright 1.62.1 driving Chromium 151.0.7922.34 (`chromium.launch({headless: true})`). No Firefox or
WebKit is installed (`~/Library/Caches/ms-playwright` holds chromium only), so Firefox and Safari are **read, not
measured** everywhere below.

**Fixtures.** They are those of 1440, copied from that session's scratchpad (`variants.json`):

- **A** = `Pointer1790290235219_USER_2` ("Healthy_0030");
- **B** = `Pointer1790290235219_HX`.

Both are seeded in `localStorage` as the offline user.

**Probe** (`probe_1905.mjs`, scratchpad, throwaway, not committed). An init script only, with no source edit:

- It traps the `RuntimeAccessible` globals (`R`, `U`, `store`, `SaveManager`).
- It wraps `R.navigate` to time the call, and adds a late `beforeunload` listener that reads `defaultPrevented`
  after the project's handler.
- It records a set of events with timestamps, each flagged when it fires *inside* `R.navigate`:
  - `hashchange`, `popstate`, `pagehide`, `pageshow`, `unload`, `focus`, `blur` and `visibilitychange`;
  - the Navigation API's `navigate`, `navigateerror`, `navigatesuccess` and `currententrychange`, plus the `abort`
    of each navigate event's `signal`.
- It records every `store.dispatch` while watching, with whether the state changed. A render timeline, one line per
  change, holds: URL, `U.navigating`, `store.projects`, A's description in the store, `ProjectsApi.isLoading`, the
  loading screen, the editor, the dashboard, and the page text.
- It writes every line to `localStorage` synchronously as well. The dying document's console lines are lost with
  its context, which the first Leave run showed. So the dying document's events are read back from the new one.

**The gesture and the prompt.** The project is made modified through the UI. Playwright clicks the description's
pencil (`.edit-btn--inline[title="Edit description"]`), fills the textarea and presses Tab. The blur runs
`handleSaveDescription` (`ProjectEditor.tsx:621-628`), which fires `project.description = …` and `markDirty()`.
Playwright's clicks and key presses are CDP `Input.dispatch*` events: trusted input with user activation, not a
DOM `dispatchEvent`. Chromium shows the `beforeunload` dialog only after such a gesture. The dialog is answered
from Playwright's `dialog` handler after 400 ms: `dismiss()` is "Stay on page" and `accept()` is "Leave".

In headless Chromium the dialog belongs to the automation client, so `focus` and `blur` around it do not represent
a real window (RC-8). Nothing below rests on them. Alfonso did not need to act by hand: the prompt was driven from
the session.

**Callers exercised:**

| Label | Path | How |
|---|---|---|
| `logo` | `Navbar.tsx:1828`, project → dashboard | UI click on `.nav-logo` |
| `signout` | Jjodel > Sign-out (`Navbar.tsx:1333-1341`), then the in-app confirm, then `AuthApi.logout` → `R.navigate('/auth')` (`auth.ts:32`) | UI hover and clicks |
| `evalB` | project → project, the ticket's case. The only UI entry, File > Recent Projects (`Navbar.tsx:1297`), was not rendered (§1). | `R.navigate('/project?id=B')` from `page.evaluate`, after the UI gesture, as 1440 (f) did |
| `evalResetFirst` | the shape of the user menu's Dashboard (`Navbar.tsx:2001-2002`), which throws before it in offline mode (§1) | `U.resetState(); R.navigate('/allProjects')` from `page.evaluate` |
| `leftclose` (control) | LeftBar > Close project > "Don't save" (`LeftBar.tsx:136-172`), which disables the warning first | UI clicks |

**The save check.** Cmd+S goes through `Navbar.tsx`'s capture keydown. A save "works" when the stored record's
`lastModified` advances and its blob carries the edited text. In a control run (edit, then Cmd+S, with no
navigation), the blob carries the edit but `idlookup[A].description` in the blob keeps the old text (§6, F6). So
this report measures the save by `lastModified` and by the text anywhere in the blob, as the control does.

## §1 Map (item 1, H1, H4)

### Readers and writers of `U.navigating`

| Site | Verbatim | Role |
|---|---|---|
| `U.tsx:181` | `public static navigating: boolean = false; // if i'm changing page, i stop rendering to prevent meaningless errors.` | declaration |
| `U.tsx:138` | `U.navigating = true;` (then `:139` `window.location.hash = hash;`, `:140` `window.location.reload();`) | the only writer; nothing sets it back |
| `reducer.ts:611` | `if (U.navigating) return oldState;` | drops every action, before `DO_AFTER_TRANSACTION_NOT_FOR_USERS`, so `AFTER_TRANSACTION` callbacks (the open's `checkLoaded`, through `recursiveCheck` at `reducer.ts:1569`) never run either |
| `App.tsx:112` | `if (U.navigating) return <Loader/>;` | reached only when App re-renders, on `isLoading` or `user` (`App.tsx:232-237`). With every action dropped, App did not re-render in any measured run, so this `Loader` never showed |

The other reloads do not set the flag, so a cancel on them leaves nothing stuck (read):

- `R.refresh` (`U.tsx:113-116`) and `R.replace` (`U.tsx:108-111`);
- the absolute branch of `R.navigate` (`U.tsx:125-127`, `window.location.href = path`);
- `Dock.tsx:74`, `AdvancedSettings.tsx:25,54` and `reducer.ts:446`.

`U.tsx:2825` (`setHashParam`) has no caller (1440 report, by search).

### Who can meet the prompt

The warning exists only while `ProjectEditor` is mounted. It is enabled at mount (`ProjectEditor.tsx:409`
`U.enableUnsavedChangesWarning();`) and disabled at unmount (`:411`
`return () => U.disableUnsavedChangesWarning();`). The handler prompts only when
`!U.shouldBypassBeforeUnload && U.isProjectModified` (`U.tsx:228-234`). `ProjectEditor` is the project page's
summary tab (`ModelsSummaryTab.tsx:14`). On the dashboard and on every other page no handler exists, so no prompt
appears and the reload always proceeds.

### The 34 lines of `R.navigate(` in `frontend/src`

27 calls and 7 non-calls. The non-calls are 2 strings in `U.tsx:120,135` and 5 comments: `Auth.tsx:240`,
`pages/Project.tsx:59`, `pages/Project.tsx:77` (inside the `/* … */` at `73-80`), and `reducer.ts:1522,1619`.

| Kind | Sites (file:line) | Can run while the project is modified, with the prompt? | Measured |
|---|---|---|---|
| **Navbar, project page, no check** | `Navbar.tsx:1828` logo `onClick={() => R.navigate('/allProjects')}`; `:1297` recent projects `function: ()=> R.navigate('/project?id=' + pid)` | **yes** | logo: Stay and Leave. Recents: **not rendered** in the measured sessions. The File menu labels were `New Project \| New \| … \| Save Project \| … \| Close Project \| Delete Project`, and `Navbar.tsx:388` drops a menu entry with no sub-items, because `user?.projects` was empty (deep link and list click, offline). Not measured online. |
| **Navbar, project page, work before** | `Navbar.tsx:2002` user menu Dashboard, preceded at `:1999-2001` by `Collaborative.client.off('pullAction'); await Collaborative.client.disconnect(); U.resetState();` | **yes** (online) | Offline it **throws before reaching `R.navigate`**: `pageerror: Cannot read properties of undefined (reading 'off')` (measured, F4). Its shape was emulated as `evalResetFirst`. |
| **Sign-out** (after the in-app confirm) | `auth.ts:32` `R.navigate('/auth');` from `AuthApi.logout`, called by Jjodel > Sign-out (`Navbar.tsx:1337,1340`), Cmd+Alt+Q (`:1145,1149`) and the user menu (`:2013,2017`). The user menu then calls `R.navigate('/auth')` a second time (`:2014,2018`). | **yes**. `logout` clears the login first (`auth.ts:29-31`; `storage.ts:89-95` removes `offline`, `token`, `user`). The in-app confirm does not disable the warning, so the user is asked twice. | Jjodel > Sign-out: Stay and Leave |
| **Close / save-and-close** | `Navbar.tsx:506` (`CloseProject`: `:498` `U.disableUnsavedChangesWarning();` first; reached from Cmd+Alt+W and "Save & Exit"); `LeftBar.tsx:143` (`doclose`: `:138-139` disable first) | no prompt: the warning is disabled first | `leftclose`: `defaultPrevented:false`, no dialog, the reload proceeds |
| **Dashboard and other pages** | `LeftBar.tsx:54` (string `action` items), `:132` (`selectProject`, then `U.resetState()` `:133`); `pages/components/Project.tsx:195` (cards, "Repair & open"); `projects.ts:52` (`create`, online, from `AllProjects.tsx:38`); `Navbar.tsx:1131` (Cmd+Alt+W in the `USER_PROFILE` context, `keyboardShortcuts.ts:43-45`); `Updates.tsx:170`; `Auth.tsx:198,247` (no user yet) | no prompt: no `ProjectEditor`, so no handler | 1440 measured the dashboard clicks |
| **Not mounted** | `RightPanel.tsx:52,74,77,85,88,96,99,107,110`, `ActivityItem.tsx:72`, `GroupedActivityItem.tsx:23` | never: `RightPanel` is rendered nowhere (search above) | — |
| **After save / after import / error paths** | After save: only through `CloseProject` (above). After import: no `R.navigate` (the search covers every call). Error paths: the three are commented out (`reducer.ts:1522,1619`, `pages/Project.tsx:59`). | — | — |

## §2 Measurements (item 2), verbatim excerpts

Each block is trimmed to the lines that carry the claim. The 4-5-digit numbers are `performance.now()` in the
document named by the 5-letter id. "(inside R.navigate)" marks an event that fired during the call. The
navigation-API lines of the hash's own `push` are elided after the first block.

### 2.1 Stay, today (logo)

```
tcqpp 2834 R.navigate.enter {"path":"/allProjects","from":"at onClick (/src/pages/components/Navbar.tsx:1972:79) ..."}
tcqpp 2835 navigation.navigate (inside R.navigate) {"type":"push","to":"/allProjects","sameDoc":true}
tcqpp 2835 popstate (inside R.navigate) {"url":"/allProjects","navigating":true}
tcqpp 2835 navigate.signal.abort (inside R.navigate) {"type":"push","reason":"AbortError: Navigation was aborted"}
tcqpp 2835 navigation.navigate (inside R.navigate) {"type":"reload","to":"/allProjects","sameDoc":false}
tcqpp 2836 beforeunload(late listener) (inside R.navigate) {"defaultPrevented":true,"returnValue":""}
           dialog beforeunload shown; answering Stay (dismiss) in 400 ms
tcqpp 3238 navigate.signal.abort (inside R.navigate) {"type":"reload","reason":"AbortError: Navigation was aborted"}
tcqpp 3238 navigation.navigateerror (inside R.navigate) {"name":"AbortError","msg":"Navigation was aborted"}
tcqpp 3238 R.navigate.return {"ms":404,"navigating":true,"url":"/allProjects","prevented":true}
tcqpp 3246 U.resetState {"url":"/allProjects","navigating":true,"from":"at /src/components/pathChecker/PathChecker.tsx:23:9 ..."}
tcqpp 3265 render {"url":"/allProjects","nav":true,"store":"ER_2","desc":"unsaved-1905-stay","editor":false,"dash":true,
                   "body":"Jjodel File Edit View Analyze Basic Advanced Help "}
tcqpp 3266 hashchange {"from":"/project?ER_2","to":"/allProjects"}      tcqpp 3266 after.timeout0 {"navigating":true}
tcqpp 3550 dispatch {"type":"COMPOSITE_ACTION","applied":false,"navigating":true}
--- after Stay (+3 s): {"url":"/allProjects","nav":true,"store":"ER_2","desc":"unsaved-1905-stay","editor":false,"handler":false,"modified":true}
    second edit: page.click: Timeout 10000ms exceeded.      (the editor is gone)
--- after Cmd+S: stored ER_2 lastModified 1790290257350 (unchanged)
```

Served `Navbar.tsx:1972` is source `:1828` (the logo). The frame after Stay is the dashboard shell with no project
list: `stateInitializer` ran (`init_dash`), and its fetch dispatches were dropped.

### 2.2 Stay, today (project → project, `evalB`) and Sign-out

```
6yfpl 3922 navigate.signal.abort (inside R.navigate) {"type":"reload","reason":"AbortError: Navigation was aborted"}
6yfpl 3923 R.navigate.return {"ms":406,"navigating":true,"url":"/project?9_HX","prevented":true}
6yfpl 3930 U.resetState {"url":"/project?9_HX","navigating":true,"from":"at /src/components/pathChecker/PathChecker.tsx:23:9 ..."}
6yfpl 3949 render {"url":"/project?9_HX","nav":true,"store":"ER_2","desc":"unsaved-1905-stay","apiLoading":true,"pls":true,"editor":false,
                   "body":"Loading Project... This should only take a moment "}
6yfpl 3951 SaveManager.load {"pid":"9_HX","url":"/project?9_HX","navigating":true}   6yfpl 3951 dispatch {"type":"LOAD","applied":false}
--- after Stay (+3 s) and after Cmd+S: {"url":"/project?9_HX","nav":true,"store":"ER_2","desc":"unsaved-1905-stay","apiLoading":true,"pls":true,
    "handler":false,"modified":true}; stored ER_2 unchanged
signout (Stay): R.navigate.enter {"path":"/auth","from":"at AuthApi.logout (/src/api/persistance/auth.ts:35:7) <- at async /src/pages/components/Navbar.tsx:1288:15"}
--- after Stay (+3 s): {"url":"/auth","nav":true,"store":"ER_2","editor":false,"body":"You are about to log out without saving your proje","handler":false}
```

The 1440 id-keyed PathChecker (`PathChecker.tsx:12-16`) starts B's open in the page that stayed. B's `LOAD` is
dropped (`reducer.ts:611`), `checkLoaded` never runs, and `ProjectsApi.isLoading` stays `true`
(`reducer.ts:1533`): risk 2 of the 1440 report, measured here. On Sign-out the in-app dialog stays on screen,
because its closing dispatch is dropped.

### 2.3 Leave, today (the dying document, read back from `localStorage`)

```
egmic 4689 R.navigate.return {"ms":405,"navigating":true,"url":"/allProjects","prevented":true}      (logo)
egmic 4698 U.resetState {... PathChecker ...}   egmic 4718 after.microtask   egmic 4720 render {"url":"/allProjects","editor":false,"dash":true,...}
egmic 4723 pagehide {"navigating":true,"persisted":false}   egmic 4723 unload
z364l 38 doc.start "/allProjects"                                                                     (the new document)
a44p4 5048 reload.navigate {"seen":true,"aborted":false}   a44p4 5048 R.navigate.return {...}          (evalB)
a44p4 5057 U.resetState   a44p4 5072 render {"url":"/project?9_HX","pls":true,"body":"Loading Project... ..."}   a44p4 5074 pagehide
yizl4 1658 SaveManager.load {"pid":"9_HX","url":"/project?9_HX","navigating":false}
```

A proceeding reload behaves as today's design assumes:

- the dying document lives 8-44 ms after `reload()` returns, across the 9 Leave runs (logo 34, evalB 26, Sign-out 17, LeftBar 44, C3 8);
- PathChecker's reset in it is dropped;
- the new document opens the target, and the stored copies are unchanged.

The dying document still paints **one frame of the target route over the old store** before `pagehide`. That is
the dashboard shell, "Loading Project...", or the in-app dialog on `/auth`. This is today's behavior, not something
a fix introduces.

### 2.4 The signal (H3)

| Event after the answer | Stay (12 runs with the detector: logo, evalB, Sign-out, evalResetFirst, with and without C1/C4/C5/C6) | Leave or proceed (8 runs with the detector: logo, evalB ×4, Sign-out, LeftBar ×2; the first logo run predates the detector and shows no `navigateerror` after the answer) |
|---|---|---|
| the reload's `navigate` event (fires **before** `beforeunload`, inside `reload()`) | fired | fired |
| its `signal` aborted before `reload()` returns (`AbortError: Navigation was aborted`) | **yes, 12/12** | **no, 0/8** |
| `pageshow` / `visibilitychange` | none | `visibilitychange: hidden` at `pagehide` |
| `setTimeout(0)` before `pagehide` | fires 1-102 ms after the return; in the runs without C4 it fires after PathChecker's reset | in 1 of 9 runs (C3: +2 ms, `pagehide` +8 ms); 8 of 9 died first |
| the hash's own `push` navigate, aborted by the reload | aborted | aborted (every run) |

The `beforeunload` dialog blocks inside `reload()` (`"ms":404-407` = the 400 ms answer). The abort is observable
synchronously, before `R.navigate` returns and before React renders the new location.

## §3 Emulations (item 3 evidence)

Each emulation is an addition to the wrapper, run right after the original `R.navigate` returns and only when the
late `beforeunload` listener saw `defaultPrevented`:

- **C1**: `setTimeout(() => U.navigating = false, 0)`.
- **C3**: `location.replace(oldHref)` now, plus C1's timer.
- **C4**: if the reload's navigate signal was aborted, `location.replace(oldHref); U.navigating = false;`
  synchronously.
- **C5**: C4's restore only.
- **C6**: C4's reset only.

### 3.1 C4 on Stay: the tab works, the URL is A's

```
r3sui 3040 navigate.signal.abort (inside R.navigate) {"type":"reload",...}   r3sui 3040 reload.navigate {"seen":true,"aborted":true}
r3sui 3040 navigation.navigate {"type":"replace","to":"/project?ER_2","sameDoc":true}   r3sui 3041 popstate {"url":"/project?ER_2"}
r3sui 3041 emu.C4 restore+reset "/project?ER_2"   r3sui 3041 R.navigate.return {"navigating":false,"url":"/project?ER_2"}
r3sui 3041 render {"url":"/project?ER_2","nav":false,"store":"ER_2","desc":"unsaved-1905-stay","editor":true,...}
r3sui 3042 hashchange {"from":"/project?ER_2","to":"/allProjects"}   r3sui 3042 hashchange {"from":"/allProjects","to":"/project?ER_2"}
--- after a second UI edit: {"desc":"second-edit-1905","editor":true,"handler":true,"modified":true}; dispatch applied:true
--- after Cmd+S: body "... Saved j...", "modified":false; stored ER_2 lastModified 1790290257350 -> 1790413895626
```

The same holds for `evalB` (`0qxst`). No `U.resetState` fires, and the editor stays mounted with its handler. The
second edit applies, and Cmd+S writes: `blobHasSecondEdit:true, blobHasUnsaved:true` (rerun `stay evalB C4`). The
router never renders the target. Both `popstate`s run in the task that called `R.navigate`, so React renders once, at A.
The two `hashchange`s arrive afterwards with `location` already A's, and the hash history does not listen to
them (`router.js:438`).

### 3.2 C4 on Leave and on the control: nothing changes

For `leave logo C4`, `leave evalB C4` and `leave leftclose C4`, `reload.navigate` reads
`{"seen":true,"aborted":false}` and C4 does nothing. The timelines match the runs without C4, and the new
document opens the target.

### 3.3 Where C4 is not enough (H4)

```
signout C4:        after Stay the editor is back at A, the second edit applies; Cmd+S: "modified":false,
                   stored ER_2 lastModified unchanged (1790290257350)   -> nothing persisted, dirty flag cleared
evalResetFirst C4: 4nzn7 4926 emu.C4 restore+reset "/project?ER_2"
                   4nzn7 5035 SaveManager.load {"pid":"ER_2","url":"/project?ER_2","navigating":false}
                   4nzn7 5039 dispatch {"type":"LOAD","applied":true}
                   render {"desc":"A new Project. Created b","pls":true} -> {"editor":true}   (A reloaded from storage: the unsaved edit is gone)
```

- **Sign-out.** `logout` removed `offline` (`storage.ts:90`), so `U.isOffline()` is false (`U.tsx:443-444`), and
  the save takes the online path with no token. `projects.ts:178`
  `if (!silent) U.isProjectModified = false;` clears the flag whatever `persisted` says (read). So after this Stay
  a later tab close would not warn either.
- **Reset before `R.navigate`.** `U.resetState()` (`U.tsx:446-449`) had already started a full open of A from
  storage. The reset lets its `LOAD` through. Without C4 the same run stays frozen on a dashboard shell
  (`stay evalResetFirst`: `"url":"/allProjects","nav":true`, edit impossible).

### 3.4 C1, C3, C5, C6

```
stay evalB C1:  mfmou 2896 U.resetState {... PathChecker ...}   mfmou 2909 emu.reset(timer)
                mfmou 2912 SaveManager.load {"pid":"9_HX",...,"navigating":false}   dispatch {"type":"LOAD","applied":true}
                --- after Stay: {"url":"/project?9_HX","store":"9_HX","desc":"A new Project. Created b","body":"... Healthy_0030 Unsaved","modified":true}
                --- after Cmd+S: stored 9_HX lastModified -> 1790413961763 (B written; A's unsaved edit lost)
leave evalB C1: u1fl1 3125 R.navigate.return   u1fl1 3143 pagehide   (the timer did not fire first; the new document opens B)
leave evalB C3: sqkhh 3232 emu.restore "/project?ER_2"   sqkhh 3233 emu.reset(timer)   sqkhh 3239 pagehide
                b8n39 936 SaveManager.load {"pid":"9_HX","url":"/project?9_HX"}   (the reload still loads B; the dying page shows A to the end)
stay evalB C5:  --- after a second UI edit: {"url":"/project?ER_2","nav":true,"desc":"unsaved-1905-stay"}   (the edit is dropped)
                --- after Cmd+S: stored ER_2 blobHasUnsaved:true, blobHasSecondEdit:false
stay evalB C6:  461ux 5825 U.resetState {"url":"/project?9_HX","navigating":false, ... PathChecker ...}
                --- after Stay: {"url":"/project?9_HX","store":"9_HX","desc":"A new Project. Created b","body":"... Unsaved"}   (B opened, A's edit lost)
```

C3 shows that in Chromium a `location.replace` in the dying page does not redirect a reload already in flight: the
reload keeps the URL it started with.

## §4 Findings

- **F1** (H1, read). One writer (`U.tsx:138`), two readers (`reducer.ts:611`, `App.tsx:112`). Four call sites can
  meet the prompt: `Navbar.tsx:1828`, `:1297`, `:2002` and `auth.ts:32`.
- **F2** (H2, measured). On Stay, the location **and the router** are already the target's.
  `location.hash =` fires `popstate` synchronously inside `R.navigate`. The page shows the target route over the old
  store, the editor unmounts and removes the unload warning, every dispatch is dropped, and no save is possible. The
  unsaved edit survives only in the store, where nothing can reach it.
- **F3** (H3, measured). In Chromium the one synchronous discriminator measured is the Navigation API. The reload's
  `navigate` event fires before `beforeunload`, and its `signal` aborts inside `reload()` exactly when the user
  stays. Timers are too late on Stay (the target's open has started) and can fire on Leave.
- **F4** (new, measured, out of scope). In offline mode the user menu's Dashboard item throws at `Navbar.tsx:1999`
  (`Collaborative.client` is undefined) and does nothing. When it does run (online), it resets the store before
  asking, so "Stay" cannot keep the work (§3.3).
- **F5** (new, measured, out of scope). Sign-out with unsaved changes asks twice, the in-app confirm then the
  browser prompt. "Stay" at the second leaves a logged-out tab whose save persists nothing and clears the dirty flag
  (§3.3).
- **F6** (control, measured, out of scope). An edit of the project description, saved by Cmd+S with no navigation,
  advances `lastModified` and the blob carries the text. `idlookup[A].description` in the blob keeps the old one.
  `U.compressedState` writes `state.idlookup[id] = {...dproject, state: ''}` (`U.tsx:437`) from the caller's
  `dproject`, which `projects.ts` VER1 describes as detached. This cause is read, not verified.

## §5 Risks of the candidate (§8)

1. **Chromium only, by measurement.** Firefox and Safari were not run. If a browser fires the reload's `navigate`
   only after `beforeunload` has passed (the order of the HTML navigate algorithm is recalled here, not read in
   this lane), a Stay there fires no navigate event and no abort. The candidate then does nothing: today's
   behavior, no regression. Where `window.navigation` is absent, the same. `App.tsx:115` already calls Firefox
   unsupported.
2. **The history entry.** `location.hash =` pushed an entry. The restore rewrites that entry to A's URL, so after a
   Stay the history holds A twice, and one Back stays on A. The id key is unchanged, so PathChecker would not reset.
   This was read and inferred, **not measured** (Phase 2 probe P5).
3. **Callers that act before asking** (F4, F5). The candidate makes their Stay a working tab, not a lossless one.
   `evalResetFirst` goes from frozen to "A reloaded from storage, edit lost". Sign-out goes from frozen to "working
   tab that cannot save". The fix belongs in those callers (Q1, Q2).
4. **Dispatches fired just before `R.navigate`.** `Action.fire` defers each one (`action.ts:349`
   `setTimeout(()=>storee.dispatch({...this}), 0)`). Today a Stay drops them, and after the reset they apply. For
   the four prompting sites the only such dispatches are those of the two callers above. The logo and the recents
   fire nothing before.
5. **The dying document's one frame of the target route** (§2.3) stays as it is. The candidate does not act on
   Leave. Removing it would mean restoring the URL on Leave too (C3 shows that is harmless to the reload in
   Chromium), but that changes the proceeding path, which COSA wants as today.
6. **Online mode and collaborative projects** were not measured. On Stay from the user menu, the collaborative
   client was already disconnected (`Navbar.tsx:1999-2000`), and nothing reconnects it.

## §6 Tests that would pin it

The vitest bench is `environment: 'node'` and includes only `*.test.ts` (`vitest.config.ts`). `U.tsx` and
`reducer.ts` do not import there: no test imports either (search above), and both pull the `joiner` barrel
(`reducer.ts:12`, `U.tsx:4-39`). So the decision moves into a pure module the bench imports, as `openKey.ts` did in
1440 (§5 of `CLAUDE.md`). The prompt cannot be reached by vitest; it is held by probes on 3003. The reducer guard
(`reducer.ts:611`) is not changed by the candidate, so it gets no new test. Testing it would need the
`vi.mock('../../joiner')` harness of `projectsSaveDirty.test.ts`, which is out of proportion to a line this lane
does not touch.

| Test | Rule | Kills |
|---|---|---|
| V1 (vitest) | a fake window whose `reload()` fires a `navigate` of type `reload` and aborts its signal synchronously: `hashReload` returns `false`, `replace` was called with the href from before, and the last `setNavigating` value is `false` | M1, M2, M4, M7 |
| V2 (vitest) | the same, with the signal not aborted: returns `true`, no `replace`, the last `setNavigating` value is `true` | M7 |
| V3 (vitest) | the hash setter fires a `push` navigate whose signal is aborted (as measured on every run), and the reload is not aborted: returns `true`, no `replace` | M3 |
| V4 (vitest) | call order recorded by the fake: `setNavigating(true)` → hash set → `reload` → (on cancel) `replace` → `setNavigating(false)`, all before `hashReload` returns | M5, M6 |
| V5 (vitest) | no `navigation` on the fake window: returns `true`, no `replace`, the flag stays `true` (today's behavior) | M8 |
| P1 (probe, Stay: logo, evalB) | after Stay: URL = A's, `U.navigating === false`, 0 `U.resetState`, the editor mounted with its handler, a second UI edit reaches the store, Cmd+S advances A's `lastModified` and the blob carries both edits | M1, M2, M4, M5, M7 |
| P2 (probe, Leave: logo, evalB) | at `R.navigate`'s return `U.navigating === true` and the URL is the target's; the new document opens the target; stored copies unchanged | M3, M7 |
| P3 (probe, control) | LeftBar > Close project > "Don't save": no dialog, `aborted:false`, the reload proceeds as today | M3 (at runtime) |
| P4 (probe, Sign-out and evalResetFirst) | records the residuals of §5.3 as they are; not a pass/fail on this lane | none (documents Q1, Q2) |
| P5 (probe, history) | after Stay, `navigation.entries()` and one Back: the page stays on A with no reset | none (measures risk 2) |

Mutants (at least five are asked; eight are listed):

- **M1**: no `setNavigating(false)` on cancel, restore only. Emulated as C5: the next edit is dropped.
- **M2**: no `location.replace` on cancel, reset only. Emulated as C6: B opens in the page and A's edit is lost.
- **M3**: any aborted navigate counts, with the `navigationType === 'reload'` filter dropped. The hash's `push` is
  aborted on every run, so every navigation would count as cancelled.
- **M4**: the abort is looked for after `reload()` returns (a `navigateerror` listener added later, or a check on
  `navigation.transition`), so the synchronous abort is never seen, as today.
- **M5**: the restore and reset are deferred to a macrotask. As C1 shows, PathChecker starts the target's open
  first.
- **M6**: `setNavigating(true)` moved after `reload()`. On Leave the dying page's last dispatches would apply. It is
  invisible to a probe on a local server: the dying page lives 8-44 ms and dispatches are deferred. It is held by V4
  alone, as declared.
- **M7**: the condition inverted.
- **M8**: a missing `navigation` treated as cancelled. That is the tempting cross-browser guess of risk 1, and it
  would reset on every reload in a browser without the API.

## §7 Open questions for Alfonso

- **Q1.** Are the two callers that act before asking (F4 user-menu Dashboard, F5 Sign-out) in this lane?
  *Recommended:* no. This lane fixes `R.navigate`, 3 files, `Lane: fast`. The callers get one medium ticket:
  "confirm first, then reset or log out".
- **Q2.** Should the Sign-out paths disable the unload warning after the in-app confirm, as `CloseProject` does at
  `Navbar.tsx:498`, so the user is asked once? *Recommended:* yes, in that ticket's lane, not here.
- **Q3.** Does F4 (the user-menu Dashboard throws offline) get its own ticket? *Recommended:* yes, low, merged into
  Q1's ticket since the fix is the same item.
- **Q4.** Is Chromium-only coverage accepted, with no inference from a missing navigate event (risk 1, M8)?
  *Recommended:* yes. Firefox and Safari keep today's behavior until someone measures them.
- **Q5.** Is the duplicate history entry after a Stay (risk 2) accepted, to be measured by P5 in Phase 2?
  *Recommended:* yes. `history.back()` instead of `replace` would be asynchronous and reopen the render window of
  F2.
- **Q6.** Does F6 (the description kept stale in the saved blob) get a ticket? *Recommended:* yes, low, a discovery
  of its own. The cause cited here is read, not verified.

## §8 Candidate fix (item 3), not applied

**Files: 3.** No critical-zone file, no exported interface changed, so `Lane: fast` (RC-3, RC-17). None of the
`CLAUDE.md` §3.2 files is touched, so no Layer Impact Report is owed. The behavior it changes is which actions reach
the store (D-layer) after a cancelled navigation, and it is named here for the GO.

1. New `frontend/src/common/navigateReload.ts`, with no imports (the pure part, which the bench imports):

   ```ts
   export interface ReloadWindow {
       location: { href: string; hash: string; reload(): void; replace(url: string): void };
       navigation?: { addEventListener(t: 'navigate', l: (e: any) => void): void;
                      removeEventListener(t: 'navigate', l: (e: any) => void): void };
   }
   /** Sets the hash and reloads, as R.navigate always did. "Stay on page" at the unsaved-changes prompt cancels the
    *  reload and nothing unloads: then the page gets back the URL it still shows, and actions go through again.
    *  Returns false in that case. Chromium aborts the reload's own navigate event inside reload() when the user stays
    *  (P-2026-09-25-1905); without that signal nothing changes. */
   export function hashReload(win: ReloadWindow, hash: string, setNavigating: (v: boolean) => void): boolean {
       const shown = win.location.href;
       let cancelled = false;
       const onNavigate = (e: any) => {
           if (e.navigationType === 'reload') e.signal.addEventListener('abort', () => { cancelled = true; });
       };
       win.navigation?.addEventListener('navigate', onNavigate);
       setNavigating(true);
       try { win.location.hash = hash; win.location.reload(); }
       finally { win.navigation?.removeEventListener('navigate', onNavigate); }
       if (!cancelled) return true;
       win.location.replace(shown);
       setNavigating(false);
       return false;
   }
   ```

2. `frontend/src/common/U.tsx`, `R.navigate`: the three lines `138-140` become
   `hashReload(window as any, hash, (v) => { U.navigating = v; });`, with the import. The rest of `R.navigate`
   stays, the commented lines included (Rule 8). Its return type stays `void`.
3. New `frontend/src/common/__tests__/navigateReload.test.ts`: V1-V5 of §6. Red first: the module does not exist.

**How the hash is rewritten.** `location.replace(shown)`, synchronously, in the task that called `R.navigate`. It
fires a same-document `popstate`, which the hash history reads (`router.js:355-367`), in the same task as the one
fired by the hash set, so React renders once, at A (measured, C4). `history.replaceState` would not notify the
router. `history.back()` would be asynchronous.

**What stays as it is.** A proceeding navigation (measured, C4 on Leave and on the control), the reducer guard, the
App `Loader`, `PathChecker`, `stateInitializer`, `U.resetState`, the unload handler, and every caller. Phase 2 gates
follow RC-3's fast lane:

- typecheck against the 14-error baseline;
- vitest on the new test;
- `npm run build`;
- the probes P1-P5 on 3003.

The ticket's visual check for Alfonso is modify → logo → "Stay" → edit → save, and the same with "Leave".
