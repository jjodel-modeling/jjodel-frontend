# Discovery 2026-11-20: right rail collapse toggle, from the canvas zoom cluster to the rail

- Prompt-ID: P-2026-11-20-2250 (`docs/prompts/claude_2026-11-20_2250_prompt_right_rail_toggle.md`)
- Session: not exposed to the session (no session variable in the environment)
- Tree: `/Users/alfonso/jjodel-w-railtoggle`, branch `shell-rail-toggle`, HEAD `4d062e265` (= `alfonso-frontend-jjtl` tip)
- Executor: claude-opus-5-5
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream re-reads the real files.

## Objective

Find the `>>` button, its handler and the state it drives; whether it renders once per editor group; whether the left rail has a collapsed strip; what the rail's "title row" is today; overlaps with `ui-vsplit` and `editor-chrome-parity`; and fix the Phase 2 file list.

## Hypotheses under test

1. The `>>` lives in the zoom cluster of the canvas toolbar and calls a shared setter. **Holds** (F1, F2).
2. The state is a context with localStorage persistence, not Redux and not the sync layer. **Holds** (F2); no critical-zone file on the path (F2, searched below).
3. The toggle renders once per editor group. **Holds**, measured: two buttons with two panes (F3).
4. The left rail has a collapsed strip to copy. **Falsified**: the palette collapses to width 0 with no strip and no user control (F6).
5. The right rail has a title row to host the toggle. **Falsified**: the rail header was retired on 2026-08-26 and the top row depends on state (F4).
6. A keyboard shortcut toggles the whole rail. **Falsified**: Cmd+B toggles the tree zone only (F7).

## Files read (full paths)

- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/editor-v2/Toolbar.tsx` (lines 1225-1361, greps)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/contexts/TreeViewPanelContext.tsx` (55-215)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/editors/PropertiesWithTreeView.tsx` (160-234, 676-815, 940-1179)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/editors/properties-with-tree-view.scss` (1305-1634, 2255-2294, 2466-2523)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/editor-v2/EditorV2.scss` (855-1030, 1200-1239, 1530-1549)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/abstract/style.scss` (1070-1094)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (1436-1475)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/codegen/ui/TemplateEditorTab.tsx` (36-49, 250-324)
- `/Users/alfonso/jjodel-w-railtoggle/frontend/src/components/editor-v2/panels/PalettePanel.tsx` (greps), `/Users/alfonso/jjodel-w-railtoggle/frontend/src/styles/tokens/_shell.scss` (greps)
- `/Users/alfonso/jjodel-w-railtoggle/docs/decisions.md` (R-RAIL-11, R-MT-30..34), `/Users/alfonso/jjodel-w-railtoggle/docs/log-inbox/multi-tab.md` (560-635), `/Users/alfonso/jjodel-w-railtoggle/docs/log-inbox/shell-ui.md` (63-94), `/Users/alfonso/jjodel-w-railtoggle/docs/claude-code-log.md` (1-60)

## Findings

**F1 (read).** `Toolbar.tsx:1310-1318`, the button sits in `.toolbar-commands` after zoom, a hairline and Split Right:
> `onClick={toggleRail}` … `title={isRailVisible ? 'Hide panel' : 'Show panel'}` … `bi-chevron-double-right' : 'bi-chevron-double-left'`

The hairline is unconditional, `Toolbar.tsx:1285`: `<div className="toolbar-commands__hairline" aria-hidden="true" />`, and since R-MT-30 it separates zoom from Split Right too (`Toolbar.tsx:1287-1297`). The cluster is `- 70% + | split >>`, not `- 100% + | >>` as the prompt draws it.

**F2 (read).** One source of truth, `TreeViewPanelContext.tsx:179-191`:
> `const isRailVisible = isVisible || isInspectorVisible;` … `const toggleRail = useCallback(() => {`

Persistence: `jjodel_treeview_visible` and `jjodel_property_panel_visible` in localStorage (`TreeViewPanelContext.tsx:76, 82, 128, 148`). Consumers of `toggleRail`/`isRailVisible` (grep `-l` over `frontend/src`, positive control: the same grep finds `Toolbar.tsx`): `App.tsx`, `contexts/TreeViewPanelContext.tsx`, `codegen/ui/TemplateEditorTab.tsx`, `components/editor-v2/Toolbar.tsx`, `components/editors/PropertiesWithTreeView.tsx`, `components/TreeViewSidebar/TreeViewContent.tsx`. None is in the critical zone.

**F3 (measured, HEAD 4d062e265, dev server 3130, 1600x1000, probe `~/.jjodel-lanes/P-2026-11-20-2250/probe-base.mjs`, 0 console errors).**
- Single canvas, open: toggle `[1157,92,28,26]` in the toolbar; rail `[1200,91,400,877]`; toolbar `[201,85,1398,40]`; `--jj-rail-width 400px`, inset `408px`.
- Single canvas, collapsed: toggle `[1556,92,28,26]` (it moves 399px right: the pointer jumps today); rail unmounted; `--jj-rail-width 0px`.
- Two panes: two toggles, `[608,92,22,26]` (pane 1, past its 398px toolbar, scrolled) and `[1165,92,22,26]`.

**F4 (read + measured).** The rail has no title row. `PropertiesWithTreeView.tsx:984-995`:
> `No header row (2026-08-26). … The rail therefore opens on the filter band, then the Filter field.`

Its top row depends on state: `.tree-scope-bar` only with a viewpoint (`TreeViewScopeBar.tsx:84`: `if (!scope) return null;`), else the Filter field; `.rail-structurebar` with the tree hidden (`PropertiesWithTreeView.tsx:1003-1014`); `.rail-focusbar` in Focus. The rail's top is `calc(var(--jj-appbar-height) + 1px + var(--jj-toolbar-height))` (`properties-with-tree-view.scss:1340`) = 91, while the toolbar now spans 85-125 under the per-group tab strip: the rail overlaps the toolbar band by 34px and covers its `.toolbar-rail-cell` (`[1200,85,399,40]`). Its top row is in the same band as the old toggle.

**F5 (read).** `--jj-rail-width` makes room for the rail: in a split, the last panel takes `margin-right: var(--jj-rail-width, 0px)` (`abstract/style.scss:1083-1089`); the toolbar cell is `width: calc(var(--jj-rail-width, 0px) - 1px)` (`EditorV2.scss:989`). It is written by one effect, `PropertiesWithTreeView.tsx:699-710`, which sets 0 when the rail is hidden.

**F6 (read).** The palette's collapsed state, `EditorV2.scss:1538-1543`:
> `.editor-v2-palette.editor-v2-palette--collapsed { width: 0; padding: 0; border-right: 0; overflow: hidden; }`

Programmatic only (`DockManager.paletteCollapsed`, R-MT-30 Q6; `PalettePanel.tsx:64-65`). It has no strip and no button, so the strip is 28px (prompt item 4).

**F7 (read).** `keyboardShortcuts.ts:143` `TOGGLE_TREE_VIEW: { key: 'B', modifiers: ['cmd'] }`. It toggles the tree zone (`PropertiesWithTreeView.tsx:748-757`), and nothing toggles the whole rail. Cmd+B closing the last open zone hides the rail, and the strip will show then. Same state, no change.

**F8 (read).** The kill-switch hides the rail by CSS on canvas-only, documentation and manager (`properties-with-tree-view.scss:1314-1322`). With two canvas groups the rail is pinned to the window edge by `right: … !important` (`:1372-1374`). With a generator tab beside the canvas the rail sits at `right: canvasGap` (`PropertiesWithTreeView.tsx:193-226, 1153`) and is collapsed by `toggleRail` (`TemplateEditorTab.tsx:271-279`). The strip has to follow all three.

## Overlaps with lanes in flight (measured, `git diff alfonso-frontend-jjtl...<branch> --stat`)

- `ui-vsplit` (e40a4e405): touches `properties-with-tree-view.scss` (9 lines, the resize handle's rest hairline, around :161-190) and `abstract/style.scss`. These are textually far from this lane's hunks: no conflict expected, to be re-measured at merge.
- `editor-chrome-parity` (0d3eba646): rewrites `Toolbar.tsx` around the commands group (hunks at :1218, :1281, :1317). It moves zoom to a middle zone, keeps the rail toggle beside Split Right, removes the identity cell, and adds `trailing={isRailVisible ? <span className="editor-bar__rail-reserve" …/> : undefined}`. **A conflict is certain** in `Toolbar.tsx` for whichever lane merges second: they have to drop the toggle and make the reserve strip-wide when the rail is collapsed (this lane's `toolbar-rail-cell--strip`).

## Design adopted for Phase 2

1. Toolbar: remove the `>>` button. The hairline stays as Split Right's separator and renders only when zoom and Split Right both render, so it is never a dangling separator. `.toolbar-commands:empty` hides an empty box.
2. Rail: the toggle (`.rail-collapse-toggle`, 24px `--shell-hit`, muted `--shell-text-3`, `--shell-text-1` on hover and focus) is absolutely placed at the rail's top right, 4px from the top and right edges, inside the first row's band whatever that row is. The four rows that can be first (`.tree-scope-bar`, the Filter row when no scope bar precedes it, `.rail-structurebar`, `.rail-focusbar`) reserve 32px on the right. No row is added, so the rail content does not move.
3. Strip: `.properties-tree-strip`, portaled into `#root` like the rail. It shows while a model or metamodel editor is active and both zones are collapsed: fixed, same top and bottom as the rail, 28px, `--shell-surface-rail`, hairline `--border-subtle`, z-index 899 so the exiting rail slides over it. It holds the same `.rail-collapse-toggle` with `bi-chevron-double-left` and "Show panel", so the button keeps its y. It follows `canvasGap`, the two-canvas `right` and the kill-switch.
4. Footprint: the one writer publishes `--jj-rail-width` = 28 and inset = 36 while the strip shows, instead of 0. Split panes then reflow once, rail width to 28, with proportions kept by the margin mechanism (F5). The toolbar keeps a reserve as wide as the strip (an empty `toolbar-rail-cell toolbar-rail-cell--strip`, hidden in the first pane of a split), so nothing in the bar sits under the strip.

New names grepped before use (`grep -r -c` over `frontend/src`, all 0; positive control `toolbar-rail-cell` in `EditorV2.scss` = 3): `rail-collapse-toggle`, `properties-tree-strip`, `toolbar-rail-cell--strip`, `RAIL_STRIP_WIDTH`.

## Phase 2 file list (4 code files + docs)

- `frontend/src/components/editor-v2/Toolbar.tsx`: button removed, hairline gated, strip reserve cell, `toggleRail` dropped from the destructure.
- `frontend/src/components/editor-v2/EditorV2.scss`: `:empty` box, reserve cell in the first pane.
- `frontend/src/components/editors/PropertiesWithTreeView.tsx`: rail toggle, strip, footprint, gap.
- `frontend/src/components/editors/properties-with-tree-view.scss`: toggle, strip, row reserves, kill-switch, two-canvas `right`.
- Docs: this report, the entry in `docs/log-inbox/multi-tab.md`, the Status of the prompt.

No exported interface changes and no critical-zone file is touched.

## Risks

- Narrow rail (360px minimum): the 32px reserve shortens the scope bar label, which already ellipsizes (`tree-view-sidebar.scss:1458-1462`).
- Hover band of `.rail-structurebar` runs under the toggle; the toggle paints above it (z-index inside the shell).
- Generator-beside layout: the auto-collapsed rail now leaves a 28px strip over the canvas's right edge (a way back, as the toolbar `<<` was).
- F4's 34px overlap of rail and toolbar band is pre-existing (since the per-group tab strip). It is not fixed here.

## Decisions taken (unattended)

1. Toggle overlaid in the rail's top row instead of a new header row (recommended: no added chrome, stable y in every rail state). Ratified as recommended, unattended.
2. Hairline kept as Split Right's separator, gated so it never dangles (the prompt's picture predates Split Right). Ratified as recommended, unattended.
3. Strip 28px and its own `.rail-collapse-toggle`, as the left rail has no strip (F6). Ratified as recommended, unattended.
4. `--jj-rail-width`/inset publish the strip's footprint while collapsed (needed so split panes and the bar clear it). Ratified as recommended, unattended.
5. Log entry in `docs/log-inbox/multi-tab.md`, not the active log: P9 sends parallel lanes to their inbox (`docs/PROTOCOL.md:140`). Ratified as recommended, unattended.

## Decisions awaiting Alfonso

None (no RC-26 item: no critical zone, no exported interface, no ratified R- row amended, no deletion, MODELS demo: `grep -r -n -i "hide panel|show panel|chevron|side panel" docs/demo/` returned nothing over the one file `docs/demo/models_2026_simulator_demo.md`; its positive control (`Semantic type class`, quoted there by S7) was not run before the context ceiling, so the absence is unproven and listed in the handoff's remaining checks).

## Open questions

1. Should the rail's top later stop at the toolbar's bottom (F4), giving the toggle a band of its own? Out of scope here.
