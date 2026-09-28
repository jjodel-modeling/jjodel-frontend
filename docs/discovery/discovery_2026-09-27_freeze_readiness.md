# Discovery: freeze readiness of the trunk after the Simulation roles modal

- Prompt-ID: `P-2026-09-27-2236`. Prompt file: `docs/prompts/claude_2026-09-27_2236_prompt_freeze_readiness.md`.
  Chat: `C-2026-09-27-1437`. Session: `2e279476-1c20-4e37-8c00-01bc5a8ed307`.
- Tree: `~/jjodel-w-freeze`, branch `freeze-readiness`, HEAD `a42fb1ed4` (the prompt's docs commit on top of
  `d88e70e0e`; `git diff --stat d88e70e0e a42fb1ed4` is the prompt file alone, so every measurement below is of the
  trunk's `frontend/` at `d88e70e0e`). Dev server on 3026 only. Executor model: Opus 5.5.
- Measured 2026-09-27 22:32 to 2026-09-28 00:04, headless Chromium (Playwright), light unless stated, 1600x1000 and
  1280x800, one fresh browser context per probe.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the files.
- **The trunk has moved since.** At the time of writing `alfonso-frontend-jjtl` is `e87df1ff6`: sim-halt-line
  (`ff4bc0988`, P-2026-09-27-2248) and enum-step-b (`c030871ff`, P-2026-09-27-2327) are merged, 10 files under
  `frontend/src` (among them `sim/SimulationPanel.tsx`, `sync/canvasToJjom.ts`, `model/logicWrapper/LModelElement.tsx`).
  Nothing here was measured on them. The probe below is built to be re-run there unchanged (§7).

## 0. Verdict

**Ready with the listed caveats.** Every gate matches its expectation; the §1 Setup of the demo script holds on all
four presets at both sizes; the panel outside the four scenes breaks nothing (cancel, Stop, a model with no profile,
a metamodel with no shape). No finding blocks the demo as scripted. Three findings are visible in the demo or in its
preparation, each with a measured way around it (§4, F1 to F3). Five everyday-editor findings sit outside the demo
path, two of them serious for general use (undo after an edge, undo after a delete).

## 1. Objective and hypotheses

Objective: say whether the trunk at `d88e70e0e` is ready to freeze (2026-10-01) for the MODELS demo (2026-10-04), and
if not, what stands in the way.

| # | Hypothesis under test | Verdict |
|---|---|---|
| H1 | The gates read as the 2049 merge left them: typecheck 14, vitest 5265 in 214 files with the nine known red at import, hooks 300, build 0, the four scripts gates green. | **Holds** on a quiet machine (§2). The first vitest run had one extra red, a 5000 ms timeout under load; alone and in the quiet re-run it passes. |
| H2 | §1 Setup of `docs/demo/models_2026_simulator_demo.md` holds as written on every preset, at 1600x1000 and 1280x800. | **Holds**, 55/55 checks per size (§3.1). |
| H3 | The everyday editor flows a demo can hit by accident work: create, edit, undo and redo, rename, delete, reload, light and dark. | **Partly falsified**: create, edit, rename, the M1 link, Cmd+S then reload hold; undo after an edge, undo after a delete, persistence with no Cmd+S, the theme switch with a project open and the name focus after a drop fail (§3.2, §4). |
| H4 | The panel outside the four scenes shows sensible text and breaks nothing: no profile, a metamodel, the dialog cancelled, after Stop. | **Holds**, 26/26 per size (§3.3). |
| H5 | The console carries only the known kinds. | **Holds**: four kinds, all known; no `pageerror` in any run (§5). |

## 2. Gates, expected vs measured

Measured on `a42fb1ed4` (frontend = `d88e70e0e`). Logs in `~/.jjodel-lanes/P-2026-09-27-2236/` (first pass) and
`~/.jjodel-lanes/P-2026-09-27-2236/run1/gate-*.log` (the runner's quiet pass, 23:28).

| Gate | Expected | Measured | Match |
|---|---|---|---|
| `npm run typecheck` | 14, the baseline set | exit 2, 14: `data.ts` TS2304 x2, TS2322; `Dummy.ts` TS2307; `EditorV2.tsx` TS2339; `Measurable.tsx` TS2552, TS7053 x4, TS2345; `ChatMessages.tsx` TS2322; `ProjectEditor.tsx` TS2769; `Dashboard.tsx` TS2339 | yes |
| `npx vitest run` | 5265 in 214 files, the nine known red at import | quiet pass: `Tests 5265 passed (5265)`, `Test Files 9 failed \| 205 passed (214)`, the nine are exactly CLAUDE.md §17's list. First pass (22:32, with typecheck and Vite starting alongside): 5264 + 1 failed, `docsDigest.test.ts > --write twice: the second run changes nothing`, `Test timed out in 5000ms`; that file alone: 41/41 in 4.97 s | yes (quiet) |
| hook tests (`npx vitest run scripts/hooks`) | 300 | 300 passed, 4 files | yes |
| `npm run build` | exit 0, the chunk-size warning | exit 0, 51 warning lines (the 2049 merge counted 51), `built in 1m 28s` | yes |
| `npm run typecheck:scripts` | exit 0 | exit 0 | yes |
| `npm run check:docs` | pass | 4/4, 5 non-blocking warnings (two `Corregge` values with no match, three inboxes waiting to fold) | yes |
| `npm run check:agents` | pass | PASS, every generated document matches | yes |
| `npm run check:scripts` | pass | PASS, 39 files. It reads the disk: this count includes the untracked `_tmp_freeze_*` probes (32 at the first pass, before the runner and the toolbar probe existed) | yes |

The one timeout is a load artefact, not a regression: same test, same tree, green alone and green in the quiet full run.

## 3. The walk

### 3.1 Setup (§1 of the demo script), per preset, both sizes

Probe `_tmp_freeze_setup.ts`: one fresh page per preset, the preset built by the demo builder (copied read-only from
`~/jjodel-w-demo-modal/.../_tmp_demomodal_scenario.js`) in the RowViewSmoke seed project, as every readiness probe did.

- The `Simulation` chip opens the panel docked at the bottom of the editor, 16 px above its bottom edge, left 305,
  width 288: M2 face top 752.5, height 198.5 at 1600x1000; top 552.5, same height, at 1280x800 [M].
- Empty bag, all four presets: `Custom · Not checkable` and `Missing: Node, Transition, Next state, Initial or
  Initial marking, Source or Owned transitions.`, verbatim as the script quotes it; the bag holds no `sim*` key [M].
- M1 face with an empty bag: `Simulation not configured. Missing on DemoPEST: Initial or Initial marking, Owned
  transitions or Source, Next state.` (and the same with `DemoPetri`, `DemoESM`, `DemoFlowB`), no run control [M].
- Canary through the dialog (not the scene walk): the kind, Continue, Apply give `State machine · Checkable`,
  `Petri net (P/T) · Checkable`, `Extended state machine · Checkable`, `Flowchart / Activity · Checkable`; before
  Reset `Not started` with `coin(off)`, `push(off)`, `stop(off)` (SM, ESM) or Step off (Petri, Flow B); Reset gives
  `Running` and `Marking: locked`, `Marking: lock, p1 ×2`, `Marking: locked`, `Marking: i0`; one step reads
  `Last step: push: t3 (locked → locked) fired` (SM), the list `t1 (p1 → p2 ×2)`, `t3 (lock → ∅)` (Petri),
  `Last step: ε: f1 (i0 → work) fired` (Flow B) [M].
- Result: `setup_sm` 14/14, `setup_petri` 14/14, `setup_esm` 13/13, `setup_flowB` 14/14, at each size (run1).

The demo script has no scene outside the simulator: §2.1 to §2.4 are the four simulator scenes, so the walk of item 2
covers §1 and the everyday flows below.

### 3.2 The everyday editor flows

Probe `_tmp_freeze_editor.ts`, driven through the real UI as a presenter would: dashboard, `New Project`, the card,
`Create Your First Metamodel`, palette drags (HTML5 drag and drop, `PalettePanel.tsx:82-92`), anchors, keyboard.
Result run1: 28/38 at 1600x1000, 29/38 at 1280x800. Four development runs of the same steps at 1600x1000 (D1 to D4,
22:40 to 22:57, the probe's readers still being fixed) are counted where they add a sample; D1's store reader was
wrong for classes, so D1 counts only for what it read by name (the model).

Holds [M, both sizes unless said]:
- Dashboard, the Create New Project dialog, the card opens `#/project?id=...`.
- `Create Your First Metamodel` mounts the canvas and the palette.
- Class, Enumeration by drag; Attribute and Literal dropped on their node; the store holds `Person[attr_0:EString]`,
  `Color[literal_0]`.
- An edge between anchors: hover the right side, the ghost anchor, release on the target's left ghost anchor; the
  `Edge Type` popup offers `Association`, `Composition`, `Aggregation`, `Inheritance`; Association writes
  `newAssociation -> Address`.
- Rename by double-click on the header (`ClassNode.tsx:713`), and the reference follows the rename
  (`newAssociation -> Location`).
- Models `+ New` opens `model_1` with the M1 palette (`Person`, `Location`); two instances by drag; the link between
  anchors fills `Person_0.newAssociation = Location_0` with no popup (one compatible reference).
- Cmd+S then reload keeps metamodel, model and objects (D4 and run1 at both sizes: 3 of 3).
- Dark survives a reload, the editor included (`theme-dark`, pane `rgb(30, 41, 59)`).

Fails: F1, F2, F4, F5, F6 in §4.

### 3.3 The Simulation panel outside the four scenes

Probe `_tmp_freeze_panel.ts`, sm and petri built in one page. 26/26 at each size (run1); 23/23 and 26/26 in two
earlier 1600 runs.

- **A model with no profile.** demoSM with an empty bag: `Simulation not configured. Missing on DemoPEST: Initial or
  Initial marking, Owned transitions or Source, Next state.`, no button, no event. The seed's own `smoke_model`
  (metamodel `Smoke`, no simulation shape): the same line with `Missing on Smoke:` [M].
- **A metamodel.** `Smoke`: `Custom · Not checkable` and the Missing line. The dialog, `State machine`, Continue:
  pill `Not checkable`, `4 of 10 roles matched`, Node `Config`, Transition `AllNine`, Next state `AllNine.cfg`;
  Apply is **on** (it would write the partial binding); Cancel writes nothing (undo stack 3 before and after, bag
  empty). Crop `shots_freeze/run1/1600x1000/panel_b_dialog_no_shape.png` [M].
- **The dialog cancelled**, four ways on DemoPEST: Cancel on the kind step, Cancel on the roles, Escape on the roles,
  the close button. Each closes the dialog, writes nothing (bag `{}`, undo stack unchanged), leaves
  `Custom · Not checkable`; reopened, it starts on `What kind of model is this?` with nothing picked and Continue off.
  A click on the backdrop leaves the dialog open [M].
- **After Stop.** Stop before Reset: `Not started`, events off. Reset, push, coin, then Stop: the face returns to
  `Not started`, the Marking and Last step lines go, every event off; the same after collapse and reopen and after a
  tab switch; Reset starts again (`Running`, `Marking: locked`) and push reads `Last step: push: t3 (locked → locked)
  fired`; a second Stop changes nothing. On Petri with the choice list open, Stop closes the list, Step goes off, Reset
  reads `Marking: lock, p1 ×2` again. Crops `panel_d_after_stop_sm.png`, `panel_d_after_stop_petri_choice.png` [M].
  Stop discards the run rather than freezing it; the script does not use Stop.

## 4. Findings

Severity: **blocks the demo** / **visible in the demo** (on stage or in its preparation) / **not in the demo**.
Counts: blocks 0, visible 3, not in the demo 5.

### F1. With no Cmd+S, model edits are not reliably persisted, although the bar reads `Saved just now` (visible in the demo: its preparation)

[M] Reload with no explicit save, same page, same storage:
- D1 and D2 (1600): `model_1` with its objects before (`Person_0`; `Person_0`, `Location_0`); after the reload the
  model is not in the store and the project lists `MODELS (0)`; the metamodel and its classes survive. Crop
  `shots_freeze/1600x1000/editor_11_after_reload_nosave.png` (D2).
- run1 (1600 and 1280): `Location_0` deleted (objects 2 to 1), the reload brings it back (`Person_0`, `Location_0`).
- D4: kept. So the model side held in 1 of 5 reloads; the metamodel side survived in 5 of 5.
- The bar read `Saved just now` / `Saved 1m ago` before every one of these reloads.
- After Cmd+S, a reload kept everything, 3 of 3.

Same family as the open high ticket «no unload warning after a canvas edit» (log, 2026-09-26: «add a class in the
canvas, click the logo ... the class is gone»). Cause not investigated. Mitigation measured: end the preparation of
each of the four projects with Cmd+S, reload once, and check the metamodel, the model and its objects.

### F2. Switching the theme in Settings with a project open leaves the editor in the old theme (visible in the demo: §1 sets the light theme)

[M] Avatar, Settings, Appearance, Dark: `html[data-theme]` becomes `dark`, `localStorage.theme` `dark`, the body
`rgb(8, 9, 10)`, but the open editor keeps `theme-light` and its pane `rgb(241, 245, 249)`; back to Light, the editor
keeps `theme-dark` (pane `rgb(30, 41, 59)`). Both sizes, every run. On screen: dark app bar and side panel over a light
canvas, the tree labels dark on dark, the edge label pill unreadable. A reload aligns the editor. Crops
`shots_freeze/run1/1600x1000/editor_13_dark_canvas.png`, `editor_15_light_canvas.png`, and `1280x800/` the same.

[R] The Settings radio writes the attribute and the storage without the service's event:

- `frontend/src/pages/settings/AppearanceSettings.tsx:6-10`: `//const [theme, setTheme] = useTheme();` then
  `document.documentElement.setAttribute('data-theme', newTheme);` `localStorage.setItem('theme', newTheme);`
- `frontend/src/services/ThemeService.ts:32-36`: `apply` also does
  `window.dispatchEvent(new CustomEvent(JjodelEvents.THEME_CHANGED, { detail: theme }));`
- `frontend/src/components/editor-v2/EditorV2.tsx:914`: `const [theme] = useTheme();`, read at `:4282`
  `` className={`editor-v2 theme-${theme} ...`} ``.

Mitigation: set Light on the dashboard, before a project is open, or reload after switching.

### F3. Toolbar labels cut on the demo tabs (visible in the demo, cosmetic)

[M] `_tmp_freeze_toolbar.ts`, elements whose text is wider than their box: at 1600x1000 on demoSM (M1) `LAYOUT` (box
27, needed 42) and `Abstract syntax` (67 of 81); none on DemoPEST. At 1280x800 on both tabs `Structured` (38 of 55,
34 of 55) and `Abstract syntax` (34 of 81, 25 of 81). The panel overlaps neither the Jjodie button (left 230 to 288,
panel from 305) nor the minimap. Crops `shots_freeze/run1/1600x1000/toolbar_demoSM_full.png`,
`1280x800/toolbar_DemoPEST_full.png`.

### F4. Drawing an edge adds no undo step; the next Cmd+Z reverts older edits and the edge stays (not in the demo)

[M] `_tmp_freeze_undo.ts`, fresh project, the current user's stack (`statehistory[DUser.current]`), one Cmd+Z after an
empty-canvas click as the script prescribes:

| Gesture | Entries added | One undo |
|---|---|---|
| rename `Place` to `Spot` (control) | 1 or 2 | reverts it, nothing older |
| Delete a class (control) | 1 | see F5 |
| Association `Person -> Address` | **0** | nothing visible reverts; the edge stays |
| Inheritance `Hub -> Person` | **0** | the edge stays |
| Composition `Address -> Hub` | **0** | the edge stays |

In the walk (D4 and run1, both sizes) the undos pressed after the association reverted, in order, the enum's
literal (`Color:1` to `Color:0`), the enum's name (`Color` to `NewEnum`), the attribute (`Person[1a]` to `[0a]`) and a
rename (`Address` to `NewClass`), while `newAssociation` stayed; one redo then left those edits undone. The keyboard
and the toolbar Undo behave the same (`EditorV2.tsx:2557`, `UndoAction.new(1, DUser.current, false).commit();`,
both paths). [R] The edge is written by `syncReferenceEdge` / `syncInheritanceEdge`
(`EditorV2.tsx:1747`, `:1755`; `sync/canvasToJjom.ts:281`, whose comment reads «Model changes and edge creation are
done in SEPARATE transactions»). Why no entry lands was not investigated; `canvasToJjom.ts` is critical zone and
changed on the trunk after `d88e70e0e` (+14 lines, enum-step-b), so the re-run must re-measure this row.

The demo's only undo (§2.1, after Apply on DemoPEST) is a different path, measured good by P-2026-09-27-1740 and 2105.

### F5. Undo of a Delete does not reliably bring the element back (not in the demo; a risk if a key slips)

[M] Undo after deleting a class, 14 samples:
- restored in the store, canvas not read: 3 (D2; run1 1280, twice);
- restored in the store, but no node for it in the visible canvas: 4 (`Spot`, the undo probe's control, all four
  valid runs; the reader counts nodes whose box starts inside the viewport, so a node restored off-screen would read
  the same);
- not restored at all within three presses: 7 (D3, D4, run1 1600 twice, where the third undo removed the enum literal
  instead; the undo probe's `Temp` three times, stack 9 to 8 with nothing back, also after a tab round trip).

M1 object: restored in D4, not in run1 at either size (three presses). Crop
`shots_freeze/run1/1600x1000/undo_undo_delete_canvas.png` (`Temp`).

[R] `EditorV2.tsx:2707-2714`: `if ((event.target as HTMLElement).tagName === 'INPUT') return;` ... `if (event.key ===
'Delete' || event.key === 'Backspace') { deleteSelected();`. A Backspace with the canvas focused and a node selected
deletes it, and F5 says undo may not recover it. Mitigation for the demo: export the four projects to files after
their preparation (F1), so a slipped key costs an import, not the scene.

### F6. After a palette drop, the name input sometimes renders without the focus (not in the demo)

[M] The drop leaves `.mm-node__input` rendered (`inputs=1`) and the focus on `DIV.editor-v2` at 0, 300, 800 and
1500 ms in 10 of 15 walk drops (D2 to D4 and run1 at both sizes): the first Class drop 2 of 5, the second Class drop
(after a rename by Enter) 4 of 5, the Enumeration drop (after an Attribute drop) 4 of 5. In the repeat arms, later in
the same pages, it never hit: 22 of 22 focused (6 drop and Escape in D4, 8 drop, type, Enter at each size in run1).
The typed name goes nowhere; the new node was not selected (`selected: false`, run1, every unfocused drop), so a
Backspace deletes nothing. A double-click on the header renames. [R]
`ClassNode.tsx:726` and `EnumNode.tsx:177`: `autoFocus` on the input.

### F7. Dark after a reload: low contrast in the properties panel (not in the demo, the demo is light)

[M, screenshot] `editor_14_dark_after_reload.png`: the `CONTENTS` class list (`Person`, `Location`) and `+ Add` grey on
the dark panel; the toolbar's duplicate and delete buttons on a white ground. Perceptual; not measured from the DOM.

### F8. A burst of `Cannot serialize in ecore, found loop` in the console (not in the demo: console only)

[M] 24 pairs in 1 of 4 panel runs (1600, 22:59, sm and petri in one page, during the Stop steps), 0 in the other 3
and 0 in the 14 single-preset pages (Setup 12, toolbar 2). First frame `LObjectN.generateEcoreJson_impl` (`LModelElement.tsx`). [R]
`LModelElement.tsx:1071`, `:1135`, `:1897`: `return Log.exx('Cannot serialize in ecore, found loop', ...)`. The kind
P-2026-09-27-1740 recorded («showed once, 24 console errors, with ESM and Flowchart B in one page»). Nothing on
screen.

## 5. Console errors, by kind

No `pageerror` in any run. Playwright reports the console call site as `src/common/Log.ts:174:8` for every kind (the
app's console path), so the source line is the grep's.

| Kind | Where | Count | First frame | Known |
|---|---|---|---|---|
| `init_dash` | dashboard load | 1 per page | `redux/store.tsx:240` `console.error('init_dash');` | yes, `scripts/smoke/console-baseline.json` |
| `wrong project setup in navbar {projectid: null, project: undefined}` | dashboard load | 3 per page | `at renderWithHooks`; `pages/components/Navbar.tsx:565` `Log.eDev(...)` | yes, the same baseline |
| `failed to get project {project: null}` | seed project load | 1 per seed page | `redux/reducer/reducer.ts:1542` | yes, in every 1740 and 2105 run (`~/.jjodel-lanes/P-2026-09-27-2105/`, 25 lines) |
| `Cannot serialize in ecore, found loop` | F8 | 24 pairs, 1 panel run of 4 | `LObjectN.generateEcoreJson_impl` | yes, P-2026-09-27-0225 / 1740 |

## 6. Crops

In `~/.jjodel-lanes/shots_freeze/run1/1600x1000/` and `.../1280x800/` (and the development runs in
`~/.jjodel-lanes/shots_freeze/1600x1000/`):

- F1: `shots_freeze/1600x1000/editor_11_after_reload_nosave.png` (D2, `MODELS (0)`); `run1/*/editor_10_after_reload_nosave.png`.
- F2: `run1/1600x1000/editor_13_dark_canvas.png`, `editor_15_light_canvas.png`; `run1/1280x800/editor_13_dark_canvas.png`.
- F3: `run1/1600x1000/toolbar_demoSM_full.png`, `run1/1280x800/toolbar_DemoPEST_full.png`.
- F5: `run1/1600x1000/undo_undo_delete_canvas.png`, `undo_undo_delete_canvas_after_tab.png`.
- F7: `run1/1600x1000/editor_14_dark_after_reload.png`.
- Setup: `run1/*/setup_{sm,petri,esm,flowB}_{m2_empty_bag,m1_empty_bag,m1_canary}.png`.
- Panel: `run1/*/panel_{a_m1_no_profile,a_m1_seed_model,b_m2_no_shape,b_dialog_no_shape,d_after_stop_sm,d_after_stop_petri_choice}.png`.

## 7. The probe, for the re-run

One command, from the tree it sits in (gitignored `frontend/scripts/smoke/_tmp_freeze_*`):

```
zsh frontend/scripts/smoke/_tmp_freeze_run.sh                 # gates, then the walk at both sizes
FREEZE_GATES=0 FREEZE_TAG=<tag> zsh frontend/scripts/smoke/_tmp_freeze_run.sh
```

It starts the tree's Vite on 3026 when free and stops it after (the config reads the root and the `node_modules`
target from its own place), writes `~/.jjodel-lanes/P-2026-09-27-2236[/TAG]/SUMMARY.txt` with every gate line, every
`RESULT`, `FAIL` and `ERRKIND`, and crops under `~/.jjodel-lanes/shots_freeze[/TAG]/<size>/`. Files: `_run.sh`,
`_vite.config.ts`, `_common.ts` (browser, error capture with the first frame, crops), `_canvas.ts` (drops, renames,
anchors, undo trails), `_simreaders.ts` and `_scenario.js` (copied read-only from `~/jjodel-w-demo-modal`),
`_setup.ts`, `_editor.ts`, `_panel.ts`, `_undo.ts`, `_toolbar.ts`, plus `_explore.ts` (reconnaissance, not run).
The run of this report: `FREEZE_TAG=run1`, 23:28 to 00:02, exit 1 on the F-rows above; the toolbar probe was added
after it and run on its own with the same environment. The files are untracked, so the re-run happens in
`~/jjodel-w-freeze` after the branch takes the trunk, or with the files copied to another tree.

Expected on a re-run over `e87df1ff6`: the halt line (sim-halt-line) does not show in these probes, which stop at the
first step; F4 must be re-measured (the enum-step-b change to `canvasToJjom.ts`).

## 8. Files read

`CLAUDE.md`; `docs/demo/models_2026_simulator_demo.md` (whole); `docs/log-inbox/simulation.md:315-380` (the 1740 Phase
1 and 2, 2049 and 2105 entries); `docs/prompts/claude_2026-09-27_2236_prompt_freeze_readiness.md`; the 2146 merge
commit message `ff5855d74` and `docs/sessioni/sessione_2026-09-27_6.md:7-9` (no inbox entry for 2146 exists: `grep
-rn 2146 docs/log-inbox docs/claude-code-log.md` empty, positive control the same grep for `2105` in
`docs/log-inbox/simulation.md`, which hits); `docs/decisions.md` (RC-17, RC-23, RC-25, R-SIM-85);
`docs/claude-code-log.md` (head); `frontend/scripts/smoke/{README-probes.md,states.ts,console-baseline.json}`;
`frontend/src/components/editor-v2/{EditorV2.tsx (1587-1840, 2135-2240, 2540-2600, 2700-2750, 914, 4282),panels/PalettePanel.tsx,components/DynamicHandles.tsx (300-410),components/EdgeTypePopup.tsx,nodes/ClassNode.tsx (255-275, 700-745),sim/SimulationPanel.tsx (515-660),sim/SimRolesModal.tsx (600-700, 845-880),sync/canvasToJjom.ts (281-340)}`;
`frontend/src/services/ThemeService.ts`; `frontend/src/pages/settings/AppearanceSettings.tsx`;
`frontend/src/pages/components/Navbar.tsx (1985-2020, 420-430, 565)`; `frontend/src/redux/store.tsx (60-90, 238-241)`;
`frontend/src/redux/reducer/reducer.ts:1540-1543`; `frontend/src/joiner/classes.ts:535-543`;
`frontend/src/model/logicWrapper/LModelElement.tsx` (the D-class fields, `:1071`); `frontend/vitest.config.ts`;
`frontend/package.json` (scripts); the probes of `~/jjodel-w-demo-modal/frontend/scripts/smoke/_tmp_demomodal_*`.

## 9. Open questions for Alfonso

1. How will the four demo projects be prepared on 3001: the builder from the console, as every probe did, or drawn by hand? Either way, Cmd+S and one reload check after each (F1)?
2. Export the four projects to files after the preparation, as the fallback for a slipped Delete (F5)?
3. Is the theme set on 3001 before the project opens, or with it open (F2)?
4. F4 and F5 (undo after an edge, after a delete): a lane before the freeze, or tickets for after MODELS?
5. F3 (cut toolbar labels at 1600 on the M1 tab): accept for the demo, or a CSS lane before the freeze?
