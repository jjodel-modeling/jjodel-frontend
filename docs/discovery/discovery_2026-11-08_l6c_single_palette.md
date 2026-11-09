# Discovery 2026-11-08 — L6c, one Instances palette for a split of canvases

Prompt-ID: P-2026-11-08-1855 (`docs/prompts/claude_2026-11-08_1855_prompt_multi_tab_l6c_single_palette.md`)
Session: ffd125fd-b1b7-4458-b557-a4106217c5a1
Tree: `~/jjodel-w-mtl6b`, branch `multi-tab-l6b`, HEAD `25de37c41`
Model: Anthropic Claude Opus 5.5

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.

## Objective

Where the palette is mounted and what it reads, where the active pane can live, where the fit reads its viewport, where the app bar builds a label; for each of D1..D6 the smallest change and its files.

## Files read

Under `frontend/src/`, windows as read: `components/editor-v2/panels/PalettePanel.tsx` whole; `components/editor-v2/EditorV2.tsx` 800-829, 1895-1944, 2736-2826, 5225-5422; `components/editor-v2/viewportInset.ts` whole; `components/editor-v2/Toolbar.tsx` 462-485; `components/editor-v2/EditorV2.scss` 12-37, 224-232, 1410-1425, 1520-1545; `components/abstract/DockManager.tsx` 1-120; `components/abstract/style.scss` 1078-1100; `pages/components/Navbar.tsx` 1733-1882, 2085-2114; `components/editor-v2/CLAUDE.md` whole. Library: `node_modules/rc-dock/dist/rc-dock.css:130`.

## Hypotheses

All read on `25de37c41`; none measured in this phase.

1. **The palette depends only on its own editor.** Holds. `EditorV2.tsx:5247` «`<PalettePanel`», whose props are that editor's `modeInfo`, `irPalette`, `lastSelectedModelElement` and `onPaletteActivate`. So one palette can only be one editor's: the active pane must render it.
2. **Exactly one palette in the DOM needs the inactive pane not to render it; CSS cannot do it.** Holds, from check (7): hiding leaves two elements matching the root. A React portal keeps the props, the handlers and the context of the pane that renders it, and places the element elsewhere.
3. **The active pane can live in `DockManager.tsx`.** Holds. `DockManager.tsx:21` «`static dock: DockLayout|null;`» is already the per-dock state, and `EditorV2.tsx:134` «`import DockManager from '../abstract/DockManager';`» already imports it. No other common parent of two editors exists: rc-dock mounts them separately.
4. **A layout-change notification is reachable inside DOVE.** Falsified as a callback: `onLayoutChange` is wired in `components/abstract/Dock.tsx:423`, outside DOVE. A `ResizeObserver` on each editor's root replaces it, because every change of split membership changes a pane's size (hidden tabs: `rc-dock.css:130` «`.dock-tabpane:not(.dock-tabpane-active)`»), and an editor's unmount refreshes by itself. To be confirmed by the app check.
5. **D3 fits the two existing drop paths.** Holds. `EditorV2.tsx:2763` «`const onDragOver = useCallback((event: React.DragEvent) => {`» and `:2739` for the flow, `:2816` and `:2795` for the classic wrapper.
6. **D6 is the rail's inset applied to a canvas the rail does not cover.** Holds as a reading, app check to confirm. `viewportInset.ts:39` «`return { top: base, bottom: base, left: base, right: `${inset + 20}px` };`» reads one global. After 1729 only the last panel runs under the rail (`abstract/style.scss:1083-1088`); the left canvas also gets that padding, about 420 px on a canvas of about 239 to 400. `viewportInset.ts` needs no change: at the call sites in `EditorV2.tsx` (814, 821, 823, 1210, 2757, 3990, 3992, 4301, 4353) the pane can use `fitPadding()` or the plain `0.2`. **Corrected by the app check (P-2026-11-08-2025): this is half of the cause.** The inset was real and is fixed; the other half is React Flow's default `minZoom` 0.5 (`@xyflow/react/dist/esm/index.mjs:267`), which clamps the fit: that layout is about 2700 wide and the canvas 397, so after the inset fix the left canvas still showed nodes at x -275..1075 on a canvas 201..598. A pane in a split now has `minZoom` 0.05.
7. **The app bar can read a tab's viewpoint inside DOVE.** Holds, through the DOM: the viewpoint is the tab's state in `EditorSwitch.tsx`, outside DOVE, while `syncTabs` (`Navbar.tsx:1733`) runs on a timer and the pane's `.toolbar-viewpoint-trigger` shows the name.

## Smallest change per decision

| D | Change | Files |
|---|---|---|
| D1, D3, D4 | Pure rules (`reconcile`, `activate`, drop rule) in a plain module; state, subscribe and DOM read of the split in `DockManager`; a hook observing the editor's root; every editor renders an empty `display: contents` slot, the active pane portals its palette into the first pane's slot, the other pane renders none. Header with the viewpoint name. Guard at the head of the four drop handlers | `editor-v2/utils/canvasSplit.ts` (new), its test (new), `editor-v2/hooks/useCanvasSplit.ts` (new), `abstract/DockManager.tsx`, `editor-v2/EditorV2.tsx`, `editor-v2/panels/PalettePanel.tsx`, `editor-v2/EditorV2.scss` |
| D2 | Root classes, top border on the toolbar | `EditorV2.tsx`, `EditorV2.scss` |
| D5 | Count model tabs per model in `syncTabs`, append the pane's viewpoint | `pages/components/Navbar.tsx` |
| D6 | A pane-local inset, zero when the pane is a split's non-last | `EditorV2.tsx` |

Nothing outside `components/editor-v2/`, `DockManager.tsx`, `Navbar.tsx` and SCSS is needed, so the fallback of the prompt does not apply. No critical-zone file is touched. Overall 7 source files plus one test, declared here per P6.

New identifiers are unused: `command grep -rl` over `components pages styles events` for `useCanvasSplit|canvasSplit|CanvasSplit|palette-instances__viewpoint|editor-v2-palette-slot|editor-v2--split-pane|editor-v2--active-pane` returned nothing; the same command for `editor-v2-palette--m1` returned `EditorV2.scss` and `PalettePanel.tsx`, so the search ran.

## Dependencies and risks

- A portal into another pane's root: React event bubbling follows the renderer, so the left pane's key handlers do not see events from a palette the right pane renders; that is the wanted behaviour.
- A programmatic focus inside a canvas switches the active pane, as D1 words it. To watch in the app check.
- The palette takes 201 px from the left panel only, so at 1280 the left canvas is narrow; the fit there is bounded by the `minZoom`.

## Open questions

None.

## App check and closure (P-2026-11-08-1855, finished by P-2026-11-08-2025)

Session 4f8e24fc-40e7-4d16-abb1-4ea2f1addd7d. Code at `81c7608af`. Probe: `~/.jjodel-lanes/P-2026-11-08-2025/gesture.mjs` (copy of the 1855 one; the entry and E4 checks added, the workaround that hid the left pane's move removed), own Vite on 3790 restarted after the last source edit.

### Gates

| Gate | Result |
|---|---|
| typecheck | exit 0 |
| build | exit 0 |
| check:docs | exit 0, 5/5 |
| vitest: `canvasSplit.test.ts`, the five L6 files, the three layout-key files, the six files reading `EditorV2.tsx` | 15 files, 177 passed |

### Split of one model, Control wiring and Floor plan

Pageerrors 0 in every run.

| Run | W | Checks | Left canvas | Right canvas | Nodes outside on entry | Left nodes moved by the right auto layout |
|---|---|---|---|---|---|---|
| `pre1600`, before E4's fix | 1600 | 23 of 24, E4 fails | 201..598.5 | 601.5..1599 | 0 | 17 of 17 |
| `r1600-1` | 1600 | 24 of 24 | 201..598.5 | 601.5..1599 | 0 | 0 of 17 |
| `r1600-2` | 1600 | 24 of 24 | 201..598.5 | 601.5..1599 | 0 | 0 of 17 |
| `r1280-1` | 1280 | 24 of 24 | 201..458.5 | 461.5..1279 | 0 | 0 of 17 |
| `r1280-2` | 1280 | 24 of 24 | 201..458.5 | 461.5..1279 | 0 | 0 of 17 |

Positive control of the E4 check: the right pane's own 18 nodes moved in every run. The fit after an auto layout leaves no node on the palette or the rail or outside its canvas, in both panes, in every run.

### The other scenes, 1600

| Scene | Checks | Note |
|---|---|---|
| single tab | 5 of 5 | one palette, no split class, title `Instances` |
| Refactoring split | 6 of 6 | no split class, two palettes, as before |
| 1730 two-model demo | 20 of 20 | labels unchanged, models differ |

Crops, light theme, in `~/.jjodel-lanes/P-2026-11-08-2025/`: `crop_split_1600.png` (right pane active), `crop_split_1280.png`, `crop_single_tab.png`. Their runs passed too: 24 of 24 twice and 5 of 5.

### Decisions recorded

- **E1.** `minZoom={inCanvasSplit ? 0.05 : 0.5}` on `<ReactFlow>`, `EditorV2.tsx`. 0.5 is spelled out because the store skips an undefined prop, so a pane leaving a split would keep 0.05.
- **E2.** A pane refits once on entering a split, when it has nodes, two frames on. No refit on later resizes or on focus.
- **E3, the reading of D2.** The inactive pane's toolbar has a transparent 2 px top border: nothing is painted, and the toolbar does not shift when the active pane switches.
- **E4, fixed.** Cause: `handleAutoLayout` called `syncPositionBatchToJjom` with no key, so `canvasToJjom.ts:108` wrote under `getActiveLayoutKey()`, the root viewpoint's. Measured: `state.viewpoint` was Control wiring, the left pane's, and both viewpoints are exclusive. So the right pane's layout was stored as the left pane's positions, and the left canvas, reading its own key, moved. The positions live per vertex under the layout key (`viewpoint/layout/vertexLayoutAdapter.ts:82`). The fix passes the tab's key at `EditorV2.tsx:4265`, 4283, 4290 and 4349; `canvasToJjom.ts` is unchanged, its parameter exists since L3.

### Open

- The same missing key, read and not measured, on the other canvas writes: drag end `EditorV2.tsx:4863` and 4867 with the reads at 4720 and 4848, resize 1379 and 4914. A drag in a pane whose viewpoint is not the root's would write under the root's key. Outside E4, which names the auto layout.
- At 1280 the two app bar tabs are too narrow to show the text: the `Apartment · <viewpoint>` label passes as text and in the tooltip, and the crop shows only the model chip.
- After a fit the Control wiring layout stands at about 10% in the left canvas, as E1 allows: inside the canvas, hard to read. The right pane's minimap covers part of Kitchen and Bathroom.
- With the right pane active the rail's filter still reads Control wiring, the root viewpoint.

## L6d: visible divider, inactive pane's commands disabled (P-2026-11-08-2045)

Session b89ef4c2-88ae-4b8a-bdc8-bdd3381bd2b9, stopped at the context ceiling before this closure; closed by P-2026-11-08-2200 from `~/.jjodel-lanes/P-2026-11-08-2045/handoff.md`. Code at `efcda31f1`: `7dbaf45bb` F2, `f45805984` F1, `efcda31f1` F3. Probe: `~/.jjodel-lanes/P-2026-11-08-2045/gesture.mjs`, scene `l6d`, own Vite on 3790. Alfonso's visual GO 2026-11-08 21:55.

### Gates

| Gate | Result |
|---|---|
| typecheck | exit 0 |
| build | exit 0 |
| vitest: `canvasSplit.test.ts`, the five L6 files, the layout-key files, the files reading `EditorV2.tsx`, those naming `Toolbar.tsx`, `EditorV2.scss`, `abstract/style.scss` | 19 files, 254 passed |

### Split of one model

Pageerrors 0 in every run.

| Run | W | Checks | Divider x..r, width | Rest colour, grip | Inactive toolbar disabled | Active toolbar disabled (own) |
|---|---|---|---|---|---|---|
| r1600-1 | 1600 | 45/45 | 597..603, 6 | rgb(203,213,225), rgb(148,163,184), 4x32 | 15 of 15 | 3 of 15 |
| r1600-2 | 1600 | 45/45 | 597..603, 6 | same | 15 of 15 | 3 of 15 |
| r1280-1 | 1280 | 45/45 | 457..463, 6 | same | 15 of 15 | 3 of 15 |
| r1280-2 | 1280 | 45/45 | 457..463, 6 | same | 15 of 15 | 3 of 15 |

The active pane's 3 are its own: Redo, and the two view controls the active viewpoint disables. r1600-1 ran before two probe-only fixes (wait 500 ms for the colour transition before reading it during a drag; zoom back before picking a node); the other three ran with them, r1600-2 with the first only. The earlier red runs were probe errors, none a product defect.

### The other scenes

| Scene | Result |
|---|---|
| single tab | 5/5 |
| Refactoring split | 7/7; divider measured w 1, flex 0 0 1px, ew-resize, grip transparent 4x40, no ::before: none of the L6d rule reaches it |
| 1730 demo | 15/15, errors 0 (`demo-l6d.json`) |
| L6c scene, regression, not asked | 23/24; the one red is `cyan border on the right toolbar only`, which is what F2 removes |

Measured besides: right-click and double-click on an inactive node open nothing and change nothing; Delete on the inactive pane deletes nothing (19 to 19 objects), the same on the active pane deletes (19 to 18); drag on the inactive pane moves nothing; first click switches the palette header, selection unchanged; second click selects; a press on a disabled toolbar control activates and runs nothing; divider drag +60 px gives +60 (395 to 455); clicking the other pane closes an open context menu (0 left).

Crops, light theme, in `~/.jjodel-lanes/P-2026-11-08-2045/`: `crop_l6d_split_1600_right_active.png`, `crop_l6d_split_1600_divider_hover.png`, `crop_l6d_split_1280.png`.

### Decisions recorded

- **F1.** Rule beside the split rule in `abstract/style.scss`, same `:has` row selector, so the Refactoring divider and every other divider are out. `flex 0 0 6px`, `transform: none` (rc-dock's scaleX(3) would triple it), `::before` 1 px past each side = 8 px hit area, `::after` is the grip (4 x 32). Grip colour `var(--text-dim, #94a3b8)` on `--color-border-primary`. Hover and `:active`: both `#0ea5e9`, cursor `col-resize`.
- **F3, toolbar.** One `<fieldset class="editor-v2-toolbar__commands" disabled>` around the controls, `display: contents`; new optional prop `commandsDisabled`. Controls match `:disabled`, their `.disabled` property stays false, so the ones disabled on their own remain distinguishable. Tooltips kept. The rail toggle is included.
- **F3, canvas.** React capture handlers on the pane root, `paneGuardProps` in `EditorV2.tsx`, verdict in the pure `paneEventVerdict` (`utils/canvasSplit.ts`). Consumed events stop at the React root's capture. Wheel is not guarded. `preventDefault` is skipped on pointerdown and on keydown. Activation also focuses the pane root.
- **Double-click on the inactive pane.** The browser's `detail > 1` on mousedown is the click count, no time window. The second press's pointerdown does reach the canvas; its mousedown, click and dblclick do not. Measured: nothing changes.
- The 1730 demo is two tabs in one panel, not a split, so F3 and F1 do not reach it.

### Findings

- **Literal reading of "no element with a cyan top border".** Each toolbar still has one: `.toolbar-viewpoint-trigger`, a 1 px cyan border on all four sides, the picker's existing accent. Not D2's mark, not removed. The probe's check was narrowed to "only a top border".
- **Wheel.** Only Ctrl+wheel (pinch) zooms, on both panes alike. Shift+wheel and plain wheel moved neither pane under Playwright, active included, despite `zoomActivationKeyCode="Shift"`. So nothing was lost by F3, but "pan by wheel" has nothing to keep.
- The demo probe's `LANE` is hardcoded to `P-2026-11-08-1729/1730`; its output `demo-l6d.json` landed there and was moved to the 2045 folder. No other file there changed.
