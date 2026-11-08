# Discovery 2026-11-08 — L6, a second tab on one model

Prompt: P-2026-11-08-0808 · Branch `multi-tab-l6` at `f64bd6592` · Read-only.

## Hypothesis being falsified

That L6 lands inside the declared list (`TabDataMaker.tsx` plus one helper beside it, `Dock.tsx`,
`DockManager.tsx`, `Navbar.tsx`, the two menu-site files): that the sites of discovery 2026-11-06
§2.2 are the only places where a tab id is read as a model id, and that a tab can be created on a
chosen viewpoint through the L2 path without touching the tab content.

**Result: falsified on three points** (§2, §3, §4). The lane stops before (2) with a question.

## Files read

- `frontend/src/components/abstract/tabs/TabDataMaker.tsx` (whole, 97 lines)
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx:20-259`
- `frontend/src/components/abstract/tabs/ModelTab.tsx:20,44-47` (grep), `MetamodelTab.tsx:26,178` (grep)
- `frontend/src/components/abstract/Dock.tsx:355-395`, `:407`
- `frontend/src/components/abstract/DockManager.tsx:60-80`, `:150-270` (grep), `:195-248`
- `frontend/src/components/dock/MyRcDock.tsx:575-602`
- `frontend/src/pages/components/Navbar.tsx:696-737`, `:1580-1582`
- `frontend/src/codegen/ui/canvasSelection.ts:40-50`, `:94-100`, `:128-138`
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:621-705`, `:1345-1366` (grep), `:1532-1602`, `:1633-1659`
- `frontend/src/joiner/classes.ts:597-598` (id format)

## 1. The §2.2 sites on this commit

| Site (2026-11-06) | On `f64bd6592` | Verbatim | Status |
|---|---|---|---|
| `Dock.tsx:375-390` | `Dock.tsx:374-390` | `const model = (state as any).idlookup?.[activeId];` … `detail: { editorType: resolvedEditorType, modelId: activeId }` | unchanged, in scope |
| `Dock.tsx:360` | `Dock.tsx:359-360` | `const panel = newLayout?.dockbox?.children?.[0];` | known limit, unchanged |
| `DockManager.tsx:67-75` | `DockManager.tsx:66-73` | `tabIds.push(entityId);` … `tabIds.push(managerTabId(entityId));` | in scope |
| `DockManager.tsx:222-229` | `DockManager.tsx:207-226` | `const model = (store.getState() as any).idlookup?.[modelId];` … `const open = () => dock.find(modelId)` | in scope |
| `Navbar.tsx:718-724` | `Navbar.tsx:697-737` | `const raw = state[activeId] \|\| state.idlookup?.[activeId];` and `` `jjodel.showSingletons.${tab.id}` `` (`:715`, `:723`, `:733`) | in scope; the lookup at `:706` must decode too, or the toggle hides on a second tab |
| `canvasSelection.ts:46`, `:98`, `:132-136` | `:45-47`, `:95-98`, `:130-136` | `const found = dock.find(id)` | first tab only, acceptable as declared |

## 2. Sites §2.2 does not list (out of the file list)

**(a) `EditorSwitch.tsx` equates the tab id with `modelid` three times.**
- `:73` `if (!isActiveDockTab(modelid)) return null;     // mounted behind the active tab (R-MT-16)`
- `:141` `if (focusedRef.current === null) focusedRef.current = isActiveDockTab(modelid);`
- `:185` `focusedRef.current = (e as CustomEvent).detail?.activeId === modelid;`

A second tab on model M, id `M~tab2`, is never focused for its `EditorSwitch`: it never makes the
Q7 focus write (`writeFocusViewpoint`, `:187`) and never adopts a root change (`:199`). Clicking it
leaves the root on the first tab's viewpoint, which the Tree View, the rail and new-view parenting
read (discovery 2026-11-06 §1.5).

**(b) `MyRcDock.tsx:583-602` is a second `EDITOR_TYPE_CHANGE` emitter keyed on the raw `activeId`.**
`const rawModel = store.getState().idlookup[activeId] as any;` … `editorType = rawModel?.className === 'DModel' ? … : 'summary';` …
`detail: { editorType, modelId: activeId }`. On a second tab it fires `editorType: 'summary'` with
`modelId: 'M~tab2'`, so decoding only `Dock.tsx` leaves the status bar and `body[data-editor-type]`
contradicted by this emitter.

## 3. How a tab carries its viewpoint at creation (the L2 path)

It does not. `TabDataMaker.model` (`:29-37`) renders `<ModelTab modelid=… metamodelid=… />`;
`ModelTab.tsx:47` renders `<EditorSwitch modelid={model.id} />`; `EditorSwitch.tsx:131-132` seeds the
tab state with `initialTabViewpoint(viewpointId, restoreAtMount)`, the root `state.viewpoint` or the
per-model preference. No prop reaches the tab state. Activating the chosen viewpoint before opening
does not substitute: the focused first tab adopts every root change (`:197-201`), so «Open in new tab
▸ V» would switch the tab the user is leaving to V as well. Carrying the chosen viewpoint needs an
optional `initialViewpointId` (and the tab id, for §2(a)) on `ModelTab` and `EditorSwitch`, absent
props equal to today.

## 4. The menu sites of R-MT-9

- **Tree View, M1 model row**: `TreeViewContent.tsx:1532-1602` (`ModelNode`) has **no context menu**:
  `EntityRow` is rendered without `onContextMenu` (`:1570-1583`). The item needs a new menu there.
- **Tree View, metamodel row**: `TreeViewContent.tsx:1633` `useClassifierContextMenu(mm.id, mm.name, 'DModel')`,
  the hook shared with class (`:1366`) and package (`:1463`) rows, gated on Advanced mode at `:651`
  (`if (!isAdvancedMode()) return;`). A metamodel owns no tab viewpoint (`EditorSwitch.tsx:128`,
  «A metamodel owns none»), so a viewpoint list there has nothing to seed.
- **Model rail**: no such site. `grep -rlc onContextMenu` over `frontend/src` (`*.tsx`) returns 15
  files with hits, `TreeViewContent.tsx` among them (positive control); none is a model rail. The
  nearest model-row surfaces are `megamodel/MegamodelNode.tsx` and `megamodel/MegamodelView.tsx`, not
  read. Both menu sites therefore live in one file, `TreeViewContent.tsx`; a second site is a choice
  for Alfonso, not a fact of the code.

## 5. The two open points of R-MT-24

**How `openBeside` addresses the second tab.** Its second parameter becomes a tab id: `modelId` is
the decoded model of that id (`idlookup` lookup, `:207`), `besideAction(panels, besideTabId, tabId)`
and `dock.find(tabId)` (`:218`, `:222`, `:226`) use the tab id, and `fresh()` (`:223`) builds the tab
with that id and the chosen viewpoint. A first tab's id is the bare model id, so `ScriptTab.tsx:239`
passes what it passes today and keeps its behaviour.

**What happens when `openBeside` returns false.** Recommended: fall back to «Open in new tab» with the
same viewpoint. The preconditions (horizontal dockbox, nothing maximized, `:212`) can change between
the menu's opening and the click, so a menu-time disabled state would need the same checks copied
outside `DockManager` and could still be wrong at click; the fallback is one branch in the menu
handler and needs no file outside the list.

## 6. Tab-id scheme

Model ids are `"Pointer" + time + "_" + user + "_" + n` (`joiner/classes.ts:598`); existing tab
prefixes are `doc_`, `jjtl_`, `jjs_`, `vp_` and the manager prefix. Proposed: first tab `<modelId>`,
later tabs `<modelId>~tab<N>`, decoded at the first `~tab`; `~` occurs in none of those forms.

## Dependencies and risks

- §2(a) and §3 touch the tab content of L2 (`EditorSwitch.tsx`, `ModelTab.tsx`), a lane already merged; their
  existing tests (`tabs/__tests__/editorSwitchViewpointPrefs.test.ts`) must stay green unchanged.
- §2(b) touches `MyRcDock.tsx`, which drives the status bar.
- None of them is in the critical zone (`CLAUDE.md` §3.1).

## Open question

L6 cannot land inside the declared list. Smallest option: extend it by `EditorSwitch.tsx`,
`ModelTab.tsx` (an optional tab id and initial viewpoint, absent props equal to today) and
`MyRcDock.tsx` (decode at `:594`), with both menu items on the M1 `ModelNode` row of
`TreeViewContent.tsx` only.

## Resolution and known limits (added after Alfonso's GO, 2026-11-08)

The list was widened as recommended: `EditorSwitch.tsx`, `ModelTab.tsx`, `MyRcDock.tsx`. Both menu items are on
the M1 `ModelNode` row of `TreeViewContent.tsx` only. Code: `89fa42c59`.

- **No second tab on a metamodel in this lane.** A metamodel owns no tab viewpoint (§4); `openBeside` returns
  false for a suffixed id on a metamodel, and `openModelTab` and `openModelTabBeside` do nothing on one.
- **A tab in the right panel does not drive the side panels and is never focused** (`Dock.tsx:360`, R-MT-24,
  `isActiveDockTab` reads `children[0]` only). It keeps the viewpoint it was opened on and does not write the root.
- **Two more readers take the tab id for a model id, found after §2 and left unchanged (outside the list).**
  `jjscript/executor/utils.ts:103-107,146-148` and `components/editors/Console.tsx:846-848,1058-1059`. On a
  second tab the lookup misses: no crash (`fromPointer` inside `try`, null handled). The Console sees no active
  model and `:1059` clears its node as «from a different metamodel» (read, not observed). Corrected by the app check:
  JjScript does find the model, through the `EDITOR_TYPE_CHANGE` cache (see App check, below).
- **A third, fixed in `Navbar.tsx`.** The tab-strip loop (`:1830`) skipped a tab whose id resolves to nothing as a
  ghost, which would have dropped every second tab from the strip; it decodes now.
- **Not executed by the bench** (node environment, no DOM): the mount write and the props passed through
  `ModelTab`, the `Navbar.tsx` decoding, the `TreeViewContent.tsx` menu. They go to the app check of the
  continuation lane.

## App check (P-2026-11-08-0852, P-2026-11-08-1003, added 2026-11-08)

Demo project `jjodel-multitab-demo.jjodel` on a dev server of this tree, light theme, viewport 1600 x 1000. Probes,
JSON and crops: `~/.jjodel-lanes/P-2026-11-08-0852/`, `~/.jjodel-lanes/P-2026-11-08-1003/`. Second tabs are `~tab2`,
`~tab3` (`modelTabId.test.ts:30`).

### P-2026-11-08-0852, before the paint fix (HEAD `d65442ea9`)

The gesture, three runs, 14/16 checks each, the same two red, pageerrors 0:

| Check | r1 | r2 | r3 |
|---|---|---|---|
| Open in new tab: ids `M` and `M~tab2` | pass | pass | pass |
| Focus A, B, A: node set = single tab, +4 and +10 s (A Floor plan 18, B Control wiring 17) | pass | pass | pass |
| Focus A, B, A: root viewpoint, `body[data-editor-type]` = model, status bar, active tab | pass | pass | pass |
| Open beside: layout has a right panel, DOM holds 27 nodes (Office Floor plan = 27) | pass | pass | pass |
| **Open beside: the right panel is painted** | **FAIL** | **FAIL** | **FAIL** |
| Maximized: fallback creates `O~tab2` on the same viewpoint, not a right panel | pass | pass | pass |
| **Maximized: the new tab is painted** | **FAIL** | **FAIL** | **FAIL** |

Beside: `dockbox` sizes [800, 800], the right `.dock-panel` 0 x 0, the left 1599 px. Cause: `ScriptTab.scss:279-284`,
only a split holding `.script-tab--beside` got `display: block`.

Guards, one run (failures 1: the same painted check):

| Step | Result |
|---|---|
| Two tabs, addObject from outside the canvas (Sensor, `LModel.addObject(.., true)`) | +1 object, 1 vertex, +4 and +10 s, drawn in both panes |
| Close B (app bar x), drag on A | Floor plan record moved (126,338 to 208,384), Control wiring unchanged (560,42) |
| Second tab again, close A first, addObject | +1 object, 1 vertex, drawn in B |
| Delete Apartment (the two lines of `handleDeleteModel`) | both tabs closed |
| Delete Office (`delete()` alone, `ModelTab.tsx:30`) | both tabs closed |

Single tab, no regression:

| Probe | Result |
|---|---|
| 0628 layout, three runs | 3/3 at every step, +4 and +10 s, FAILURES 0 |
| Container, one run | FAILURES 0 |
| 0457 scenes, one run | checks 2/2, pageerrors 0, node matches 10/10, 6/6, 10/10 |
| 1730 demo, one run | 15/15, Apartment Floor plan 18, Office Control wiring 25 |

### P-2026-11-08-1003, with the paint fix (`7f8e8c0fb`)

The exception of `ScriptTab.scss` also covers `.dock-hbox > .dock-panel.dock-style-models ~ .dock-panel.dock-style-models`.

«Open beside ▸ Floor plan» on Office from the Tree View row, three runs, 16/17 checks each, pageerrors 0:

| Check | r1 | r2 | r3 |
|---|---|---|---|
| Right panel: canvas x 1091, w 508, on top at its centre | pass | pass | pass |
| Right panel: 27 nodes, minimap 27, node set = single tab on Floor plan | pass | pass | pass |
| Left canvas: Floor plan, 18 before = 18 after = single tab, on top outside the side panels | pass | pass | pass |
| Open in new tab and focus A, B, A (the table above) | pass | pass | pass |
| Maximized: the fallback tab is painted | **FAIL** | **FAIL** | **FAIL** |

| Regression scene | Result |
|---|---|
| Refactoring split (M2 target, `createProjectRefactoring`), one run | `.script-tab--beside` mounted, editor w 542, canvas w 613, 8 nodes, on top, failures 0 |
| 1730 two-model demo, one run | 15/15, pageerrors 0 |

The first left-canvas check hit-tested the centre of the flow and failed on the side panels, not on the canvas: the
probe was corrected and the three runs repeated (`gesture-1-centre-hit.json`). An M1 Refactoring on the demo project
placed nothing, because `projectTargetCandidates` listed only the metamodel, so the split was measured on an M2 one
(`dry/refactor-m1-no-candidate.json`); why the M1 models are not listed was not traced.

### Findings and known limits

- **JjScript on a second tab finds the model**: `getActiveModel()` returns it through the `EDITOR_TYPE_CHANGE` cache,
  with the decoded id. `fromPointer(tabId)` returns null without throwing.
- **The Console was not observed at runtime**: `.console-tab-v2` is not mounted in this layout. Its reading of the tab
  id stands from the code only.
- **The maximized fallback creates the tab in a hidden placeholder panel**, `-maximized-placeholder-`, width 0, while
  status and active id move to the model. The Tree View row is at x = -391 while a panel is maximized, so the gesture
  is not reachable with the mouse (the probe uses dispatched events). Known limit.
- **The status bar at opening** stays on the left model when the left tab is `M`, and follows the right panel when the
  left tab is a `~tab` id. Not traced.
- **A click in the right panel** leaves root, editor type, status and active tab unchanged (R-MT-24; measured by
  P-2026-11-08-0852 with the rule injected in the browser).
- **In the split the side panels sit over the left panel**: the left flow is x 201, w 687, the Tree View starts at
  x 490, so 289 px of it are uncovered. The right panel measures 710 px for sizes [800, 800]; the `max-width: 710px` of
  `style.scss:1055` exempts only the Refactoring split. Not changed.
- **The selector matches any split of two model-group panels**, not only one made by Open beside. A split made by
  dragging a tab was not exercised.
