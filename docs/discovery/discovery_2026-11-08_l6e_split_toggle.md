# Discovery 2026-11-08 — L6e, the split as a toggle of the tab

Prompt-ID: P-2026-11-08-2200. Prompt: `docs/prompts/claude_2026-11-08_2200_prompt_multi_tab_l6e_split_toggle_discovery.md`.
Session 1932cd3f-894c-4146-99aa-a6b107471a7d. Tree `~/jjodel-w-mtl6b`, branch `multi-tab-l6b`; source read at `cd5d2ad51` (`6c2e01740`, the L6d closure on top of it, is docs only). Executor: Claude Opus 5.5.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files. Every claim is **read** unless tagged otherwise: no dev server was started in this phase and nothing was measured. Line numbers are of `cd5d2ad51`.

## Objective

For S1..S7 of the prompt: where today's split is created and torn down, where tab and app bar state live, where the textual editor lives and whether it can be mounted in a pane. For each S item the files, the smallest design, the interfaces and the critical-zone files touched, the size. Then a cut into Phase 2 lanes.

## The answer in short

The split must move **inside the dock tab**. Today it is two rc-dock panels, a structure of the whole dock, and S4 (the split belongs to the tab) cannot be expressed on it. A new `SplitStage` is the content of every model and metamodel tab, always, with one or two panes; each pane is today's `ModelTab` or `MetamodelTab`, or `TextualTab`. The textual half is much cheaper than it looks: parse gating, reprint and the element-to-text map already exist. The expensive part is that several readers equate "the dock's active tab" with "the active canvas".

No file of the `CLAUDE.md` §3.1 table has to be edited, except through the separate L4c lane if S3 is to wait for it (Q5). Four lanes, 18 commits at most.

## Files read

Whole: `frontend/src/components/abstract/tabs/modelTabId.ts`, `.../tabs/TabDataMaker.tsx`, `.../tabs/ModelTab.tsx`, `.../tabs/EditorSwitch.tsx`, `frontend/src/components/editor-v2/utils/canvasSplit.ts`, `.../editor-v2/hooks/useCanvasSplit.ts`.

Windows only: `frontend/src/components/abstract/DockManager.tsx` 30-79, 225-330; `.../abstract/Dock.tsx` 358-375; `.../abstract/tabs/MetamodelTab.tsx` 1-60, 150-185; `.../editor-v2/ActiveEditorContext.tsx` 1-40; `.../editor-v2/EditorV2.tsx` 585-630, 845-850, 1375-1383, 4848-4870, 4905-4915, 5205-5225, 5283-5345; `.../editor-v2/Toolbar.tsx` 313-320, 348-356, 380-400, 430-475, 845-860, 1095-1130; `.../editor-v2/viewportInset.ts` 10-40; `.../editor-v2/EditorV2.scss` 32-42, 1198-1212, 4549-4566; `.../abstract/style.scss` 1081-1104, 1175-1190; `frontend/src/pages/components/Navbar.tsx` 1843-1900, 2090-2118; `frontend/src/codegen/textual/ui/TextualTab.tsx` 400-412, 1048-1075, 1182-1241, 1745-1772, 1780-1791, 1795-1822, 1925-1962, 2086-2150; `.../textual/ui/openTextualTab.tsx` 1-70, 200-245; `.../textual/textApply.ts` 1-60; `frontend/src/codegen/ui/canvasSelection.ts` 34-41; `frontend/src/components/TreeViewSidebar/treeViewScope.ts` 1-60; `frontend/src/services/CanvasExportService.ts` 89-101; `frontend/node_modules/rc-dock/lib/DockTabPane.js` by grep (36-72); `docs/decisions.md` R-MT-25, R-MT-26; `docs/log-inbox/multi-tab.md` 273-277.

By grep, line hits only: the rest of `EditorV2.tsx`, `TextualTab.tsx`, `Navbar.tsx`, `canvasToJjom.ts`, `TreeViewContent.tsx`. `~/.jjodel-lanes/P-2026-11-08-2045/1730/demo-tabs.mjs` by grep.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | S4 can be built on today's dock split | **falsified** |
| H2 | Two `EditorV2` can live in one dock tab | holds, by reading; not yet run |
| H3 | A hidden tab keeps its React state | holds |
| H4 | The textual editor can be mounted in a pane | holds, three small props |
| H5 | It can be set read-only | holds |
| H6 | Text reaches the model only when it parses | holds, already built |
| H7 | An element-to-text-range map exists | holds |
| H8 | «The 1730 two-model view» is a path of the product | **falsified** |
| H9 | Four layout writes lack a tab key | **partly**: seven writes and two reads |
| H10 | The rail filter's code has to change | **falsified** |
| H11 | L6c's active-pane machinery carries over unchanged | **falsified**, five places |

### H1, falsified

The split is a child of the dock's box, created by `dockMove`: `DockManager.tsx:266-267`, «`case 'split-move': dock.dockMove(open() as TabData, target, 'right'); break;`». What the app calls the active tab is one panel's: `EditorSwitch.tsx:49-50`, «`const panel = DockManager.dock?.getLayout()?.dockbox?.children?.[0] as any;`», «`return !!tabId && panel?.activeId === tabId;`». So the second panel stays on screen when the first panel changes tab: a tab cannot take its split with it, and the divider's `size` is on the dock box, shared by every tab. Rebuilding the row on each tab switch would remount a canvas each time, which is what S4 forbids.

### H2, holds by reading

`EditorV2` takes the model and the viewpoint as props, `EditorSwitch.tsx:270-275`, and two instances on one model already run, in two dock panels (L6, L6c, L6d). What changes is only that they share a `.dock-tabpane`. The readers that assume one per tab pane are in H11.

### H3, holds

`DockTabPane.js:70-72`: «when cached == undefined, it will still cache the children inside tabs component», «`const isRender = cached === false ? active : this.visited;`». `TabDataMaker` sets no `cached`. So a split held in React state survives a tab switch. A move of the tab between panels is not covered by this reading, so the split's state belongs in a module, not in component state (design below).

### H4 and H5, hold

`TextualTabProps`, `TextualTab.tsx:1182-1190`, are `modelId`, `label`, `tabId`, `writeSyntax`. `tabId` serves the close control and the outline's storage key, `:857` and `:2122`, «`onClick={() => DockManager.closeTab(tabId)}>`». Nothing else ties it to the dock. The module is reached only through dynamic import (R-GEN-2, `Toolbar.tsx:396`, «`if (CODEGEN_BUILD) void import('../../codegen/textual/ui/openTextualTab')`»), so a pane must import it the same way or `check:codegen-lazy` fails.

The text's `Editor` takes a plain options object, `:2147`, «`onMount={onMount} options={TEXT_EDITOR_OPTIONS} />`», and the file already spells read-only at `:2014`, «`options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }} />`».

A stale comment, `Toolbar.tsx:390`, calls it «the read-only Text tab»; `TextualTab.tsx:1193` says «The Text view is editable». The second is right: `applyTextEdit` runs at `:1597`.

### H6, holds, already built

Parsing: `editDecision`, `TextualTab.tsx:403`, «`if (!isApplicableParse(parsed) || unresolved) return { kind: 'errors', count: ...`». Applied after a pause of 800 ms (`:271`). The user-facing line exists, `:791`, «`${s.count} problem${s.count === 1 ? '' : 's'} · not applied`». A diagram edit, `onModelPrint`, `:356-358`, «`return editorText === sync.text ? 'reprint' : 'keep';`». So S5's two sentences are today's behaviour; what is missing is carrying the status to the pane header.

One consequence S5 does not state: after a `keep`, `:404` «`if (stale) return { kind: 'stale' };`», so a text that later parses is **not** applied automatically. See Q6.

### H7, holds (report only)

The print yields object spans, `:213` «`readonly spans: readonly ObjectSpan[];`», carried by Monaco decorations and answered by `innermostSpanAt` (`:1746`). The canvas-to-text direction exists too: `:1820`, the `CANVAS_SELECTION_CHANGED` listener. A later shared selection has both halves, keyed by model id.

### H8, falsified

Nothing in the product is the «1730 two-model view». 1730 is the demo probe, `demo-tabs.mjs:9`, «two tabs  tab A Apartment on Floor plan, tab B Office on Control wiring», and the L6d handoff records «1730 demo is two tabs in one panel, not a split». Searched: `command grep -rln "openBeside\|Open beside\|useCanvasSplit\|isCanvasSplit\|inCanvasSplit" frontend/src`; six files, of which the callers of the beside path are `ScriptTab.tsx:239`, `DockManager.tsx:306` (from `TreeViewContent.tsx:759`). The nearest reading is «Open beside» on a *different* model, which `openModelTabBeside` already permits. See Q3.

### H9, partly

The prompt's four (read by 2025) sit one line later today, and there are more. Without a key, in `EditorV2.tsx`:

| Line | Call | Listed by the prompt |
|---|---|---|
| 1380 | `syncSizeBatchToJjom([...targetIds].map(...))` | yes (:1379) |
| 4864 | `syncPositionBatchToJjom(positionWrites)` | yes (:4863) |
| 4868 | `syncPositionBatchToJjom(positionWrites)` | yes (:4867) |
| 4915 | `syncSizeBatchToJjom(pair)` | yes (:4914) |
| 4874 | `syncPositionToJjom(c.id, c.position.x, c.position.y)` | no |
| 4891 | `syncPositionToJjom(c.id, pos.x, pos.y)` | no |
| 4908 | `syncSizeToJjom(c.id, w, h)` | no |

Reads, also keyless: 4721 and 4849, «`const key = getActiveLayoutKey();`». All four sync functions already take the key (`canvasToJjom.ts:90, 105, 135, 164`), so the fix is at the call sites and `canvasToJjom.ts` stays as it is. The hazard shrinks with S7(a): once the root follows the active pane, and only the active pane can drag (F3), the root's key is that pane's. The keys are still owed, because a root write can lag.

### H10, falsified

The filter reads the root: `treeViewScope.ts` header, «nessun viewpoint attivo (root `state.viewpoint` vuoto)». In a split the root stays on the left pane because `writeFocusViewpoint` runs only on a dock tab change (`EditorSwitch.tsx:204-214`). Writing the root on pane activation is the fix; the filter is not touched.

### H11, falsified, five places

Each breaks silently if the in-tab split is built without it:

1. **The left pane would adopt the right pane's viewpoint.** `EditorSwitch.tsx:114-116`, «`return !!focused && isActiveDockTab(tabId);`», with `:220-224` calling `setTabViewpointId(viewpointId || null)`. Both panes of a tab would count as focused. The fix: focused means dock-active **and** pane-active.
2. **The pane list comes from dock rows.** `DockManager.tsx:43`, «`document.querySelector('.not-strip > .dock-layout > .dock-hbox')`», `:45`, «`.dock-panel.dock-style-models`». An in-tab split is invisible to it.
3. **The active pane is forgotten on a tab switch.** `canvasSplit.ts:18`, «`if (panes.length < 2) return NO_CANVAS_SPLIT;`»: a tab without a split wipes the singleton. S4 needs it per tab.
4. **Coming back to a tab would refit.** `EditorV2.tsx:848`, «`if (inCanvasSplit !== wasInCanvasSplitRef.current) splitFitDueRef.current = inCanvasSplit;`». Switching back re-enters the split, and the viewport S4 wants restored is overwritten.
5. **The palette slot is inside the first canvas.** `EditorV2.tsx:5317-5319`, «`canvasSplit.panes[0].querySelector<HTMLElement>(':scope > .editor-v2-palette-slot')`». With a textual left pane there is no such element and the graphical right pane loses its palette. The slot moves to the stage.

Also single-pane readers, to follow the active pane:
- `Navbar.tsx:1875-1876`, the tab's label from the first `.toolbar-viewpoint-trigger__label` in the tab pane.
- `CanvasExportService.ts:93`, «`?? shown[0]`», and `:95`, the model id from `.dock-tabpane`'s id: File > Export exports the left canvas, under the tab's model.
- `canvasSelection.ts:34-36`, `modelPane(modelId)` finds the tab by the model id, so it misses a pane showing another model and merges both panes' selection on one model. Its reader is `TextualTab.tsx:1810-1815`.

## Design, the whole

- **`splitTabs.ts`** (new, `components/abstract/tabs/`, no imports, like `modelTabId.ts`): a `Map<tabId, TabSplit>` of `{ panes: [{ key, modelId, content }], ratio, active }`, `content` a viewpoint id, null, or the textual marker. Pure rules, subscribable with `useSyncExternalStore`.
- **`SplitStage.tsx`** (new): the content of every model and metamodel tab, from `TabDataMaker.tsx:25, 39`. It always renders through the same pane list, with panes keyed by `key`, so toggling never remounts the left canvas. With two panes it draws a divider of its own, with L6d's look.
- **`DockManager.refreshCanvasSplit`** reads the stage of the active tab pane, `.dock-tabpane-active .split-stage`, and the active pane from `splitTabs`. `CanvasSplit<P>` is generic over the pane and does not change.
- The dock-row SCSS of L6b, L6c, L6d goes unused for canvases once S6 lands. It stays, marked `// TODO: cleanup` (Rule 9). The `:has` rules a pane still needs are restated on `.split-stage`: the toolbar's container query and scroll (`EditorV2.scss:1200`), the first pane's minimap (`:4551`), the rail column (`style.scss:1083`), the divider (`:1094`).

## Per item

Critical-zone files (§3.1): none is edited for any item below. `EditorV2.tsx` and `DockManager.tsx` are not in the table, and neither is `Toolbar.tsx`. Exported interfaces only gain optional properties.

### S1. Toggle, cross, two panes at most. 4 commits

Files: `splitTabs.ts`, `SplitStage.tsx` (both new), `TabDataMaker.tsx`, `DockManager.tsx`, `useCanvasSplit.ts`, `Toolbar.tsx`, `EditorSwitch.tsx`, `EditorV2.tsx`, `EditorSwitch.scss`. Over five files: Rule 19 applies.

The icon goes in the toolbar **before** the fieldset of `Toolbar.tsx:852`, «`<fieldset className="editor-v2-toolbar__commands" disabled={!!commandsDisabled}>`», or F3 disables it on the inactive pane. New optional props `onToggleSplit`, `splitOpen`. Closing keeps the active pane by its `key`, so it is not remounted. On a metamodel the same icon; see S2.

### S2. The automatic viewpoint. 1 commit

Pure `nextPaneContent(left, viewpoints, hasText)` in `canvasSplit.ts`, on the list `Toolbar.tsx:313-314` builds, «`.filter(ptr => !Defaults.isSystemViewpoint(ptr) && !isDataManagerViewpointId(ptr))`», moved to a helper both call. Order: another named viewpoint, abstract syntax, textual, same.

A metamodel has no choice: `Toolbar.tsx:1108`, `disabled={isMetamodel}`, and no textual entry (`:449`, «`if (!isMetamodel) {`»), so it always opens the same abstract syntax, the last clause of S2. `openBeside` refuses a further tab on a metamodel (`DockManager.tsx:247`), but that guards the dock tab, by R-MT-25 for want of a use case, and an in-tab pane does not pass there. Two canvases on one metamodel have never run: to be measured first in Phase 2.

«A textual syntax exists»: today's picker asks only `codegenEnabled`, `Toolbar.tsx:351`, not the model; see Q4.

### S3. Selectors and drop. 3 commits

A thin **pane header** row, shown only in a split, holds the model selector, the viewpoint selector, the parse warning and the cross. It is one component for canvas and text panes, since a text pane has no `Toolbar`. In a split the toolbar's own picker is hidden by a new optional prop.

- Viewpoint selector: the list of S2, a separator, the textual entry. Today the textual entry opens a dock tab (`Toolbar.tsx:392-396`); in a pane it sets the pane's content. The Data Manager entry is left out, as S3 lists it not.
- Model selector: `layoutTabIds(dock.getLayout())` through `modelOfTabId`, deduplicated, kept to `DModel` (`modelTabId.ts:12, 27`).
- Drop: the app bar has no drag source. `command grep -c "draggable\|onDragStart\|onDrop\|application/" Navbar.tsx` gives 0, exit 1; the same command on `EditorV2.tsx` gives 7 (control). So `draggable` on `Navbar.tsx:2096` with a MIME of its own, and capture handlers on the pane wrapper. Firefox has a history of not dragging `<button>`; not checked here.
- A pane on a deleted model: `ModelTab.tsx:30` closes the model's tabs; in a pane it must close the pane.

**Dependency.** Changing a pane's model unmounts the last instance of a model far more often than closing a tab does, and that clears the module-level registries of every other model (ticket, inbox `:273`, «the last tab of model N unmounting clears the entries of an open tab on model M»). L4c fixes it and touches `syncState.ts`, critical zone; go-ahead by R-MT-26. See Q5.

### S4. The tab owns the split. 2 commits

The state is in `splitTabs`; the sizes are `ratio`; H11 points 3 and 4 are the work. App bar: the model branch of `walkBeside`, `Navbar.tsx:1856-1858`, goes; a mark on the entry from `splitTabs`. Tab identity when the *left* pane changes model: Q2.

Not read: whether the dock layout persists across a reload. S4 asks only for tab switching: Q7.

### S5. The textual pane. 4 commits

Files: `TextualTab.tsx` (`frontend/src/codegen/textual/ui/`; not critical zone), `SplitStage.tsx`, `EditorV2.tsx`, `canvasSplit.ts`. New optional props on the exported `TextualTabProps`: `embedded` (no cross of its own), `readOnly` (merged into the options at `:2147`), `onStatus` (the header's warning).

- Palette: `PalettePanel`'s `collapsed` exists (`panels/PalettePanel.tsx:62`), fed at `EditorV2.tsx:5286`, «`collapsed={!!scriptPreview?.owner}`». A text pane active adds one disjunct there.
- First click: `paneEventVerdict` consumes a pointerdown, which would stop a text selection from starting. The two clauses of S5 conflict there: Q1.
- **A trap.** A caret move on an inactive pane selects on the canvas: `:1964`, «`if (isUserCaretMove(e)) caretPause.poke();`», reaches `:1784`, «`selectAt(m.getOffsetAt(p), false);`». `readOnly` does not stop it; the handler must check the prop.
- Rail: the text pane as last pane sits under the rail. To check at the app.
- Two editors on one model (a `txt_` tab and a pane) reconcile through `onModelPrint`, which already names «another tab» (`:352`).

### S6. Shortcuts. 2 commits

`openModelTabBeside`, `DockManager.tsx:301-308`, becomes a split of the active tab with that model and viewpoint, the new-tab fallback of R-MT-25 kept. `TreeViewContent.tsx:759` is unchanged. `openBeside` stays for Refactoring (`ScriptTab.tsx:239`). `dockManagerSecondTab.test.ts:136-148` is rewritten.

A third beside path exists and S6 does not name it: the Text tab docking beside the canvas (E9, R-TXT-54, `openTextualTab.tsx` header, `canvasSelection.ts:76` `dockBeside`). Q3.

### S7. Leftovers. 3 commits

- (a) Rail filter: H10, H11.1. Inside S1's lane, 0 further files.
- (b) Minimap. `<MiniMap>` at `EditorV2.tsx:5211`, default size, 16 px from the corner; `paddingForInset`, `viewportInset.ts`, «`return { top: base, bottom: base, left: base, right: \`${inset + 20}px\` };`», knows the rail only. Smallest: `fitPadding` gets the minimap's footprint when it is shown, an optional argument, read at `paneFitPadding` (`EditorV2.tsx:604`).
- (c) Left fit at about 10%. From L6c's note, not measured here. `minZoom` is 0.05 in a split (`:5168`) and the fit obeys the layout's extent in a 397 px canvas: so a floor costs nodes out of view, and nothing else about it is known. Needs a number: Q8.
- (d) The keys of H9. `EditorV2.tsx` only. It writes the layout next to the D-layer, as E4 did, so a Layer Impact Report comes first (§3.2).

## Proposed Phase 2 lanes

| Lane | Delivers visibly | Commits |
|---|---|---|
| **L6f** split in the tab | S1, S4, S7(a). The icon, two canvases on one model, divider, cross, one app bar entry with a mark, tab switch restores all, rail filter follows the active pane. S2's rule at its simplest. Includes the first run of two canvases on a metamodel | 5 |
| **L6g** pane selectors | S2 complete, S3. Pane header, viewpoint and model selectors, drop from the app bar. After L4c if Q5 says so | 4 |
| **L6h** textual pane | S5, the textual entry of S3 | 4 |
| **L6i** shortcuts, leftovers | S6, S7(b), (c), (d) with its report | 5 |

L6f is the one that must land first; the others are independent of each other, save L6h needing L6g's header. R-MT-26 had queued L7, L8 and L4c after L6b: Q5 covers the order.

## Dependencies and risks

- Every EditorV2-level assumption of "one canvas per tab pane" not listed in H11 surfaces at the app: this phase read windows, not the whole 5498-line file.
- `ContextMenu`, one per `ModelTab` and graph (`ModelTab.tsx:46`), is doubled by construction, as it is in today's dock split.
- `ACTIVE_TAB` carries the tab's id (`Dock.tsx:370`). Its readers, `StatusBar.tsx` and `Dashboard.tsx` besides `Navbar.tsx` and `treeViewScope.ts`, see the tab's model, not the active pane's, when a pane shows another model. An optional field in the detail would carry it. Not designed further here.
- R-MT-27 is provisional and is not in `docs/decisions.md` (`npm run decisions -- R-MT-27`, as injected: not found).

## Open questions

1. S5 says the inactive text pane allows select-to-copy and that the first click only activates. A consumed press cannot start a selection. Recommended: a press without movement activates at mouseup; a drag selects and leaves the pane inactive.
2. When the left pane changes model, what is the tab? Its id is the model's (`TabDataMaker.tsx:35`). Recommended: the id stays, the title follows the left pane, accepting that opening the original model raises this tab.
3. What is «the 1730 two-model view» (H8), and does E9's Text-tab-beside join S6? Recommended: read 1730 as «Open beside» on another model, no separate command; leave E9 as it is, since a pane is now the other way in.
4. S2's «if one exists»: the picker's rule (setting and build flag on) or a printable model? Recommended: the picker's rule; a model that cannot print shows the message the Text tab already has.
5. L4c before L6g, and L7/L8 after the L6 series? Recommended: yes to both; L4c immediately before L6g, since S3 makes the clearing reachable by one selector change.
6. After a diagram edit, a held text that later parses stops at `stale` and is not applied (H6). Is that S5's intent? Recommended: yes, keep it: applying would overwrite the diagram edit; the header says why.
7. Should the split survive a reload? Recommended: not in this round; in memory, then a separate look at where the dock layout persists.
8. S7(c), what is acceptable after a fit in the left pane: a minimum zoom, or all nodes in view? Recommended: all nodes in view stays the criterion and the default ratio is reviewed at the app, with a number measured before any change (§5).
9. Should the toolbar's cyan viewpoint trigger, noted in the L6d findings, stay in the new pane header? Recommended: yes, it is the picker's accent, not the mark F2 removed.
