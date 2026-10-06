# Discovery — the loading overlay under the Properties rail (P-2026-09-30-2025)

- Prompt-ID: `P-2026-09-30-2025`, prompt `docs/prompts/claude_2026-09-30_2025_prompt_loader_over_rail.md`, chat `C-2026-09-30-1940`
- Session: `acc0c386-10cb-4479-b37d-63d789a93576`, started by `lane-run`, tier heavy
- Tree: `~/jjodel-w-loaderz`, branch `loader-over-rail`; measured `before` on `a766c0a90` (code identical to `45ff6c290`: the only diff is the prompt file), `after` on the working tree that became `b46af6f27`
- Executor: Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the files.

## 0. Answer in brief

**Root cause.** `#root` is `position: fixed` (`frontend/src/index.scss:31`), so it is a stacking context at level 0 of `<body>`; the save
overlay is rendered inside it (`App.tsx:127`, parent `div.router-wrapper`), so its `z-index: 99999` ranks it only inside `#root`,
while the rail is portaled onto `<body>` at 900 and wins. Same mechanism as D-UI-14 (`docs/decisions.md:3001`), which the toasts
and three modals already went through.

**Fix** (`b46af6f27`, one file): `Loader` renders through `createPortal(..., document.body)`
(`frontend/src/components/loader/Loader.tsx:17-22`). No z-index, class, rail or `--z-navbar` change; `transform: rotate(180deg)`
left alone (not the cause: it only makes the overlay its own context, inside `#root`).

**Measured** (lane probe, port 3071, light, 1600x1000, DPR 2, advanced mode, DemoFlowB under «DemoFlowB (derived)»), overlay up:

| point | before (`a766c0a90`) | after (`b46af6f27`) |
|---|---|---|
| `elementFromPoint` rail centre (1400,530) | `div.jj-conformance-bar` (rail) | `div.loader-spinner` |
| `elementFromPoint` canvas centre (900,529) | `div.loader-spinner` | `div.loader-spinner` |
| pixel rail (1400,560) | `248,250,252` (the idle colour, undimmed) | `74,75,75` |
| pixel canvas (900,529) | `72,73,74` | `72,73,74` |
| loader parent / chain | `div.router-wrapper` → `div#root` (fixed, z auto) → body | `body` |

Two runs of each code state, same values. **The overlay was forced**: the save is too fast to catch in the probe
(`saveProjectWithFeedback` returned in 2.1 ms, no `isLoading` transition, no mount, §4.1), so the probe set
`SetRootFieldAction.new('isLoading', true)` as `saveProject.tsx:63` does, held it 1.2 s, set it back (positive control §4.1).

**Regressions measured**: loader on project open, on navigation (`R.navigate` → reload) and on the `U.navigating` branch still shows,
covers 0,0,1600,1000, top element at the window centre is the loader (before: parent `#root`; after: parent `body`). No loader: the
rail is on top at its centre; the navbar user menu, over the rail's column, is on top at all four items (before and after). The
four demo scenes: 0 px from `before` outside a 24x22 css px box on the Jodie button glyph, which differs between two runs of the
unchanged code too (§4.4).

**Decisions awaiting Alfonso**: none. No recommendation was adopted unattended.

**Questions**

1. The overlay now also covers what is portaled onto `body` below 99999 (the rail, `.sim-panel`, the portaled modals at 9999-10000, the navbar dropdowns); toasts (999998) stay above it. Confirm that is the intended scale.
   Recommended: yes, it is what `--z-loading` and `--z-toast` in `_z-index.scss:37-40` already say.
2. User menu > Dashboard throws `Cannot read properties of undefined (reading 'off')` in the probe (§4.6): ticket filed, low. Leave it to its own lane?
   Recommended: yes, it is outside this lane's DOVE.

## 1. Hypotheses under test

1. **H1** — The save overlay is the `Loader` of `App.tsx:127`. **Holds** (measured: forced flag → parent `div.router-wrapper`).
2. **H2** — It sits in a stacking context lower than the rail's. **Holds** (measured chain, §3).
3. **H3** — Rendering the loader on `body` puts it above the rail without touching any number. **Holds** (measured, §0 table).
4. **H4** — The portal changes nothing else the probe can see (open, navigation, navbar, rail, the four scenes). **Holds**, with the avatar-glyph floor declared (§4.4).
5. **H5** — The save is slow enough in the probe to catch the overlay mid-save. **Falsified** (§4.1): forced instead, as the prompt allows.

## 2. Files read

- `frontend/src/App.tsx` (lines 60-240), `frontend/src/components/loader/Loader.tsx`, `frontend/src/components/loader/style.scss`
- `frontend/src/index.scss` (1-45), `frontend/src/App.scss` (`.router-wrapper`, 436-441)
- `frontend/src/components/editors/properties-with-tree-view.scss` (1420-1500), `frontend/src/styles/tokens/_z-index.scss`
- `frontend/src/common/libraries/saveProject.tsx`, `frontend/src/api/persistance/projects.ts` (124-160, 392-397)
- `frontend/src/pages/components/Navbar.tsx` (366-420, 555-567, 940-975, 1098-1118, 1375-1392, 2008-2045), `frontend/src/pages/components/menu/Menu.tsx` (class names)
- `frontend/src/common/U.tsx` (97-150), `frontend/src/common/navigateReload.ts`, `frontend/src/components/collaborative/Collaborative.ts` (30-60)
- `frontend/src/components/Toast/ToastContainer.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (410-445), `frontend/src/common/ErrorPortal.tsx` (head)
- `frontend/src/components/Jodie/JodieMinimized.tsx`, `frontend/src/components/Jodie/JodieWindow.css` (860-960)
- `docs/decisions.md` (D-UI-14 at 3001, RC-17, RC-21..RC-26), `docs/PROTOCOL.md`, `frontend/scripts/smoke/README-probes.md`

## 3. Findings

**Where the overlay lives** (read):
- `frontend/src/App.tsx:126-127`: `<div className={"router-wrapper"}>` / `{isLoading && <Loader/>}`. The other two JSX sites, `App.tsx:202` and `:210`, are inside the `/* ... */` block that starts at `:198`. `App.tsx:108` `return <Loader/>;` (first render) and `:112` `if (U.navigating) return <Loader/>;` return the loader as App's whole tree.
- `frontend/src/common/libraries/saveProject.tsx:63`: `SetRootFieldAction.new('isLoading', true);`, `:78` `SetRootFieldAction.new('isLoading', false);`: the only save path (Navbar `:1112` Cmd+S, `:1387` File > Save Project).
- `frontend/src/components/loader/style.scss:2` `position: fixed;`, `:7` `z-index: 99999;`, `:9` `transform: rotate(180deg);`.

**The trapping context** (read, then measured):
- `frontend/src/index.scss:30-31`: `#root{` / `position: fixed; // without this, it can scroll`. A fixed element is a stacking context whatever its z-index.
- Measured loader chain, before (forced, 1.2 s after mount): `div.loader-spinner pos=fixed z=99999` → `div.router-wrapper pos=static z=auto` → `div#root pos=fixed z=auto` → `body pos=static z=auto` → `html`. Every ancestor: `transform none`, `filter none`, `isolation auto`, `contain none`, `will-change auto`, `opacity 1` (full record in the probe log, `~/.jjodel-lanes/P-2026-09-30-2025/probe-_tmp_loaderz_probe.log`). The only context-creating ancestor is `#root`, by `position: fixed`.
- Measured rail chain (before and after): `div.properties-tree-overlay pos=fixed z=900` → `body` → `html`, all other properties at their initial values. Body children at scene time: `div#root`, `script`, `div.properties-tree-overlay`.
- `frontend/src/components/editors/properties-with-tree-view.scss:1468` `.properties-tree-overlay {`, `:1486` `z-index: 900; // above canvas + rc-dock, below canvas context-menu (1000) and modals`.

**One sentence.** The overlay's 99999 is compared inside `#root`, which enters `<body>` at level 0 because `position: fixed` makes it a stacking context, and the rail, a `<body>` child at 900, is painted over that whole level.

**The fix** (`b46af6f27`): `frontend/src/components/loader/Loader.tsx:2` `import {createPortal} from 'react-dom';`, `:17` `return createPortal(<div className={'loader-spinner'} ...`, `:22` `</div>, document.body);`, with a four-line comment citing D-UI-14. Preferred option (1) of the prompt; option (2), removing `position: fixed` from `#root`, was not tried: `index.scss:31` says it is what stops the page from scrolling, so it is not inert.

## 4. Measures

Probe `frontend/scripts/smoke/_tmp_loaderz_probe.ts` (gitignored), through `lane-run probe ... --port 3071 --id P-2026-09-30-2025`, fixture
DemoFlowB + DemoPEST of `_tmp_loaderz_scenario.js` (copied read-only from `~/jjodel-w-selring`). An init-script MutationObserver
records, the moment `.loader-spinner` mounts, its parent, its rect, `elementFromPoint` and `elementsFromPoint` at the rail centre, the
canvas centre and the window centre, and both computed chains. Runs: `before` (3 runs, the last kept), `after`, `after2`, `before2`
(pre-fix `Loader.tsx` from `a766c0a90` written over the file, restored with `git checkout HEAD --` after the run).

### 4.1 The save (H5, falsified)

- Cmd+S (`Meta+s`): capture-phase `keydown` log on `window` empty, `navigator.platform` `MacIntel`. The key never reached the page.
- File > Save Project, DOM click on the `li` of `Navbar.tsx:1387` (the only `li` whose label contains «Save Project»): no `isLoading` transition.
- `saveProjectWithFeedback(LPointerTargetable.fromPointer('Pointer_RowViewSmokeProject'))` called from the page (the function both gestures call): returned `true` after 2.1 ms; store subscription saw no transition; no loader mounted (`_tmp_loaderz_savedbg.ts`, log `probe-_tmp_loaderz_savedbg.log`).
- Positive control on the same subscription (forced phase): `[{v:false},{v:true,t:245199.6},{v:false,t:249421.3}]`, the loader in the DOM at the second.
- Hence the forced flag. Why the save's own true/false never shows in the subscription (batched root-field actions, or the gestures' `project` being null in this fixture, `Navbar.tsx:564` `let project: LProject | undefined = user?.project || undefined;` and console `failed to get project {project: null}` from `reducer.ts:1542`) was not pursued: it does not change the stacking.

### 4.2 Overlay up (forced), rail and canvas

| run | rail centre top | rail pixel | canvas centre top | canvas pixel | covers |
|---|---|---|---|---|---|
| before | `div.jj-conformance-bar` (inRail) | 248,250,252 | `div.loader-spinner` | 72,73,74 | 0,0,1600,1000 |
| before2 | `div.jj-conformance-bar` (inRail) | 248,250,252 | `div.loader-spinner` | 72,73,74 | 0,0,1600,1000 |
| after | `div.loader-spinner` | 74,75,75 | `div.loader-spinner` | 72,73,74 | 0,0,1600,1000 |
| after2 | `div.loader-spinner` | 74,75,75 | `div.loader-spinner` | 72,73,74 | 0,0,1600,1000 |

Idle colour at the rail point: 248,250,252 in every run. After the flag goes back to false: no loader, rail on top at its centre (every run).
Crops: `frontend/scripts/smoke/_tmp_loaderz_crops/lz_{before,after}_forced_600.png` (full window), `lz_{before,after}_forced_rail.png`
(rail region, full resolution), `lz_{before,after}_idle_600.png`. The user menu stayed open through the forced phase in every run
(Escape plus a click on the canvas did not close it), so the crops show it too: bright above the overlay before, dimmed after.

### 4.3 Open, navigation, navbar

| check | before | after |
|---|---|---|
| open: loader parent, covers, centre top | `div#root`, yes, `span.spinner-animated` | `body`, yes, `span.spinner-animated` |
| nav (`R.navigate('/allProjects')`, reload): same | `div#root`, yes, spinner | `body`, yes, spinner |
| `U.navigating` branch (flag set, App re-rendered): same | `div#root`, yes, spinner | `body`, yes, spinner |
| idle: rail top at its centre | `div.jj-conformance-bar` | same |
| user menu over the rail column, 4 items at x 1447 | all 4 on top (`div.item`), dropdown parent `body` | same |

### 4.4 The four demo scenes

Pane screenshots (DPR 2, 3196x1832) of `default_flowB_work`, `default_sm_class_State`, `derived_flowB_work`, `derived_flowB_d1`.

| pair | differing pixels | bbox (css, pane-relative) |
|---|---|---|
| before vs after | 497 each | 226.5,863 → 250.5,885 |
| before vs before2 (same code) | 416 each | same box |
| before2 vs after | 462 each | same box |
| after vs after2 | 0 | — |

The box is the `bi-robot` glyph of `.jodie-minimized` (`JodieMinimized.tsx:22`, rect 216,903 48x48, glyph 228,912.5 24x29, no
transform, not hovered). Within each run the box is identical across the four scenes (0 px); max channel delta before vs after 88,
on the glyph's 1 px pulse line. Two runs of the unchanged code differ in that box, so the box is the instrument's floor, not a
measure of the change. Outside it every pairing is 0 px.

### 4.5 Gates on `b46af6f27`

- `npm run typecheck`: exit 2, 14 errors, the §17 set by file and code.
- `npm run build`: exit 0, the pre-existing chunk-size and dynamic-import warnings.
- `npx vitest run`: 5949 tests passed, 0 failed; 10 files red: the 9 §17 files at import, plus `src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts`, whose 5 tests pass and whose `afterAll` (`browser.close()`) timed out at 10 s, alone too; load average 110 at the time. `Loader.tsx` is imported only by `App.tsx` and `pages/Project.tsx` (`grep -rln "loader/Loader" src`, which also found the importer it was expected to find), outside that test's graph.

### 4.6 Side observation (ticket, low)

User menu > Dashboard (`Navbar.tsx:2019` `Collaborative.client.off('pullAction');`) threw `Cannot read properties of undefined (reading 'off')`
and did not navigate, in the probe's offline session on a non-collaborative project: `Collaborative.ts:36` `static client: Socket;` is
assigned only in `connect()` (`:55`). Automation only (RC-8): not a product defect until reproduced by hand.

## 5. Dependencies and risks

- Anything on `<body>` between 900 and 99999 is now under the overlay while it is up: `.sim-panel` (850), the portaled modals, the navbar dropdowns (`.dropdown--portal`), `ErrorPortal`. Toasts (999998) stay above, so the save-timeout and save-error alerts of `saveProject.tsx` stay visible.
- `onClick`/`onContextMenu` of the overlay still go through React: React 18 listens on a portal's container.
- The first render (`App.tsx:108`) now returns a portal only, `#root` stays empty until the tree mounts: measured, the overlay covers the window from the first mutation.

## 6. Open questions

See §0.
