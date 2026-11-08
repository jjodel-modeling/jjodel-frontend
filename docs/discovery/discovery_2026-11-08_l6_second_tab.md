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
