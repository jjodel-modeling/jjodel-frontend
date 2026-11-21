# Discovery: canvas toolbar rationalization (P-2026-11-20-2310, Phase 1)

- Prompt: `docs/prompts/claude_2026-11-20_2310_prompt_canvas_toolbar_rationalization.md`
- Sessions: 375503b7-c863-4562-a3f2-b012364fc8a5 (cut at the context ceiling, nothing written) and its continuation
- Tree: `~/jjodel-w-toolbar`, branch `toolbar-rationalize`, HEAD f15e52035 (merge of trunk 92271b39b, which holds
  editor-chrome-parity a448f35d1, into 802ecf15f)
- Executor: Opus 5.5 (claude-opus-5-5)
- This report is a set of hypotheses with evidence, not a reference. Downstream readers re-read the files.

## 0. Answer in brief

1. The «eye» in the bar is not a visibility toggle: it is the per-tab syntax (viewpoint) picker, `Toolbar.tsx:1115-1131`
   (`bi-eye`, title «Select viewpoint»). Nothing moves to View as a checkable entry; the eye's job goes to the chip.
2. Notation and colors live per EditorV2 instance, seeded from and written to GLOBAL localStorage keys
   (`EditorV2.tsx:1181-1217`). The syntax (viewpoint) is per tab (EditorSwitch state + groups record). Scopes differ;
   kept as they are, no migration (prompt decision 1). Effect: after a reload every group shows the last notation and
   colors written, not its own.
3. The group tab-bar row has no room for the chip at narrow widths (measured, §4): at 400px groups a lone tab is
   246px wide and the row has ~140px free; at the 280px floor ~20px. The chip goes in the editor bar row instead (the
   row of the zoom cluster), at the start of the right zone, before `Diagram | Text`, which never scrolls out.
4. The bar's left zone overflows today at two groups (scroll box 309/349px) and at three (109/349px). The overflow
   measures the scroll box (`.editor-bar__scroll`, `scrollWidth > clientWidth`) and trims from the end.
5. No critical-zone file is involved: presentation and colors are plain React state in EditorV2 and CSS classes on
   `.editor-v2` (`EditorV2.tsx:5534`). Cascade to Phase 2 is allowed.
6. The base had to move: trunk merged editor-chrome-parity (EditorBar, R-MT-35..38) at 23:2x; merged into this
   branch (f15e52035) before Phase 2, so the work sits on the EditorBar zones and not on the pre-merge bar.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | The eye is a visibility toggle (prompt 2, third bullet) | Falsified, read: `Toolbar.tsx:1124` `title={isMetamodel ? 'Metamodels use abstract syntax only' : 'Select viewpoint'}` |
| H2 | Presentation and colors are stored per tab | Falsified, read: `EditorV2.tsx:1181` `localStorage.getItem('editor-v2-notation')`, `:1209` `localStorage.getItem('editor-v2-color-scheme')`; live state per EditorV2 instance |
| H3 | The tab-bar row fits a chip at 280px | Falsified, measured §4 |
| H4 | State passes through a critical-zone file | Falsified, read: the props chain is EditorV2 state → `Toolbar` props (`EditorV2.tsx:5557-5564`) |
| H5 | Shortcuts exist for the moved controls | Partly: undo Ctrl+Z, redo Ctrl+Shift+Z, Delete/Backspace are handled by EditorV2 `onKeyDown`, not by the bar (`Toolbar.tsx:910,918,934` tooltips); none for notation, colors, picker |

## 2. Files read (full paths under `frontend/src/`)

`components/editor-v2/Toolbar.tsx` (40-169, 380-610, 851-1345), `components/editor-v2/EditorBar.tsx` (whole),
`components/editor-v2/components/ColorSchemeSelector.tsx` (1-53, 200-310), `components/editor-v2/contexts/EditorContext.tsx`
(5-40), `components/editor-v2/EditorV2.tsx` (5540-5587, greps), `components/abstract/tabs/EditorSwitch.tsx` (150-299),
`components/abstract/tabs/dockGroups.ts` (exports), `components/abstract/Dock.tsx` (365-394),
`pages/components/Navbar.tsx` (416-499, 1586-1650), `docs/decisions.md` (RC-26).

## 3. Toolbar inventory (merged base f15e52035, read)

| Control | Icon | Tooltip | Handler / state | Scope | Fate |
|---|---|---|---|---|---|
| Undo | bi-arrow-counterclockwise | Undo (Ctrl+Z) | `onUndo`, `canUndo` (`:906-913`) | per pane | stays, priority 1 |
| Redo | bi-arrow-clockwise | Redo (Ctrl+Shift+Z) | `onRedo` (`:914-921`) | per pane | stays, 2 |
| Duplicate | bi-copy | Duplicate selected | `onDuplicateSelected` (`:922-930`) | per pane | stays, 6 |
| Delete | bi-trash | Delete selected (Delete/Backspace) | `onDeleteSelected` (`:931-937`) | per pane | stays, 5 |
| ALIGN group | svg | Align … / Distribute … | swaps in for the four above at 2+ selected (`:869-903`) | per pane | stays (committed), overflowable |
| Rules | bi-list-check | Validation rules of this metamodel | `handleOpenRules`, metamodel + Advanced (`:944-957`) | per model | stays, 7 |
| Validate + freshness pill | bi-shield-check | Validate the open model against the active rules | `handleValidate`, `freshness` (`:962-1008`) | per model | stays, 7 |
| Notation dropdown | — | Notation mode | `notation`, `onNotationChange` (`:1018-1045`) | per EditorV2, global key | leaves: chip + View › Syntax |
| Colors dropdown | — | Color scheme | `ColorSchemeSelector` (`:1048-1056`) | per EditorV2, global key | leaves: View › Colors |
| Highlight palette | swatches | — | only in highlight mode (`:1060-1069`) | per pane | stays, not overflowable |
| Snap to grid | bi-grid-3x3 | Enable/Disable snap to grid | `onToggleSnap` (`:1076-1083`) | per pane | stays, 3 |
| Auto layout | bi-diagram-3 | Auto layout | `onAutoLayout` (`:1084-1093`) | per pane | stays, 4 |
| Viewpoint picker (the eye) | bi-eye | Select viewpoint | `handleViewpointChange` (`:386-414`), listbox (`:442-605`) | per tab | leaves: becomes the chip |
| Views menu | bi-pencil | Edit the views of this viewpoint | `viewpointViews`, `DockManager.openView` (`:1192-1229`) | per viewpoint | stays, 8 (edits views, not a view setting) |
| Zoom − / level / + | bi-dash, bi-plus | Zoom out / Reset zoom to 100% / Zoom in | middle zone (`:1260-1292`) | per pane | untouched, never overflows |
| Diagram / Text | bi-diagram-3, bi-file-earmark-text | R-MT-35 | right zone (`:1296`) | per tab | untouched |
| Split Right, rail `>>` | bi-layout-split, bi-chevron-double-right | Split Right / Hide panel | right zone (`:1299-1332`) | group / shell | untouched (`>>` is lane P-2026-11-20-2250's) |

Unclear purpose: none. `onFitView` has no call site (`:50-54`, an existing TODO: cleanup).

## 4. Measurements (measured, probe `scripts/smoke/_tmp_tb2310_measure.ts`, uncommitted, Playwright, 1600×900, Basic, new metamodel, port 3140, base f15e52035)

| Groups | Bar root width (px) | Scroll box client/scroll | Tab bar width | Tab widths | Free in tab row |
|---|---|---|---|---|---|
| 1 | 1398 | 902/902 | 1598 | 141 | ~1445 |
| 2 | 398, 998 | 309/349, 520/520 | 598, 998 | 246, 246 | ~340 / ~740 |
| 3 | 198, 398, 798 | 109/349, 309/349, 320/349 | 398, 398, 798 | 246 ×3 | ~140 |

The first group's bar is 200px shorter than its group (the palette column). The last group's bar spans under the
rail (rail reserve). The tab label already reads «metamodel_1 · Abstract syntax». At the 280px floor a lone 246px
tab leaves ~20px: no chip. Crops: `~/.jjodel-lanes/P-2026-11-20-2310/shots/measure-{1,two,three}.png`.

## 5. Storage scopes (read)

- Notation: `useState` in EditorV2 seeded from `localStorage['editor-v2-notation']`, written back on change (`EditorV2.tsx:1181-1186`). Global key, per-instance live value.
- Colors: same pattern, `localStorage['editor-v2-color-scheme']` (`:1209-1217`); custom palettes `jjodel.customPalettes`.
- Syntax (viewpoint): EditorSwitch `tabViewpointId` (`EditorSwitch.tsx:159`), `noteTabViewpoint(ownTabId, …)` into the groups record (`:167`), per-model preference via `saveViewpointPreference` (`Toolbar.tsx:413`).
- No data moves (prompt decision 1). The mismatch is recorded, not fixed.

## 6. View menu and dock (read)

- View menu: `Navbar.tsx:1586-1650`; `MenuEntry` `:487-499` (name, icon, function, disabled, subItems, section, title, jsx);
  check mark is the `name + '  ✓'` convention (`:1616-1644`); `makeEntry` `:416-470` keys by `i.id||i.name`.
- Active tab: `activeTabId(DockManager.dock.getLayout())` (`dockGroups.ts:81`, used at `jjscript/executor/utils.ts:103`);
  `JjodelEvents.ACTIVE_TAB` fires with `detail.activeId` (`Dock.tsx:480`).
- EditorV2 does not know its tab id: EditorSwitch holds `ownTabId` (`EditorSwitch.tsx:150`) and does not pass it
  (`:265-271`, `:289-295`). Phase 2 adds an optional `tabId` prop.

## 7. Lane overlaps (measured, `git diff --name-only alfonso-frontend-jjtl...<branch>`)

- shell-rail-toggle (`~/jjodel-w-railtoggle`, clean tree): only its discovery report. Its target, the `>>` button,
  is not touched here; the chip is added before `RepresentationSwitch`, away from `toggleRail`.
- ui-vsplit: 16 files, SCSS and `JjtlDevelopmentEnv.tsx`; none of the files planned here (grep of the list for
  Toolbar|EditorV2|EditorSwitch|Navbar|ColorScheme|EditorBar|Dock returned nothing; the same list shows `_vsplit.scss`).
- editor-chrome-parity: merged into trunk; no diff left against trunk.

## 8. Phase 2 file list (more than 5: rule 19, listed; none in the critical zone)

1. `components/editor-v2/canvasViewChoices.ts` (new): the one entry definition (syntax choices, colors choices, chip label set), `NOTATION_OPTIONS` moved here, and the registry of canvas views by tab id.
2. `components/editor-v2/ToolbarOverflow.tsx` (new): the `bi-three-dots` button and its menu.
3. `components/editor-v2/CanvasViewControls.scss` (new): chip and overflow styles.
4. `components/editor-v2/__tests__/canvasViewChoices.test.ts` (new).
5. `components/editor-v2/Toolbar.tsx`: VIEW group and picker trigger leave the left zone; buttons reordered by priority with overflow; the picker's listbox reused for the chip; the canvas view registered.
6. `components/editor-v2/EditorV2.tsx`: optional `tabId` prop forwarded to Toolbar.
7. `components/abstract/tabs/EditorSwitch.tsx`: passes `tabId={ownTabId}`.
8. `components/editor-v2/components/ColorSchemeSelector.tsx`: exports the two option lists; optional `defaultOpen` / `onOpenChange`.
9. `pages/components/Navbar.tsx`: View › Syntax and View › Colors.

## 9. Risks

- The overflow loop re-renders in a layout effect: bounded by the item count (≤ 12).
- The notation entries switch a viewpoint tab back to abstract syntax when chosen (the old dropdown was disabled
  there). That is the unification the prompt asks for, recorded as a behaviour change.
- Colors stay disabled while a viewpoint is active, as today (`ColorSchemeSelector.tsx:230`).

## Decisions taken (unattended, RC-21/RC-25)

1. Base: trunk merged into the branch before Phase 2 (f15e52035). Recommended: yes, done.
2. The eye is the syntax picker; its vocabulary plus the five notation variants under «Abstract syntax» is the unified list. Viewpoints, Text and Data manager entries stay (Rule 3).
3. Chip in the editor bar row (right zone, before `Diagram | Text`), not in the tab bar: no room at 280px (§4).
4. Visual order follows priority: undo, redo | grid, auto-layout | delete, duplicate | rules or validate | views; overflow trims from the end. ALIGN swap kept.
5. View › Colors › Palette lists every palette, then «Manage palettes…», which opens the existing ColorSchemeSelector as a popover under the bar.
6. Storage unchanged (§5).
7. A new R-MT row records the new bar contents, amending R-MT-38 without rewriting it (Alfonso's request, 2026-11-20 23:08).

## Decisions awaiting Alfonso

None from the RC-26 list. The new R-MT row is his explicit request; the visual GO on the closure stays his (P13).
