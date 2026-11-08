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
6. **D6 is the rail's inset applied to a canvas the rail does not cover.** Holds as a reading, app check to confirm. `viewportInset.ts:39` «`return { top: base, bottom: base, left: base, right: `${inset + 20}px` };`» reads one global. After 1729 only the last panel runs under the rail (`abstract/style.scss:1083-1088`); the left canvas also gets that padding, about 420 px on a canvas of about 239 to 400. `viewportInset.ts` needs no change: at the call sites in `EditorV2.tsx` (814, 821, 823, 1210, 2757, 3990, 3992, 4301, 4353) the pane can use `fitPadding()` or the plain `0.2`.
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
