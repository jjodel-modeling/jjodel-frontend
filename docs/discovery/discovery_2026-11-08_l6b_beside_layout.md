# Discovery 2026-11-08 — L6b, the layout of a model tab opened beside another

Prompt-ID: P-2026-11-08-1608 (`docs/prompts/claude_2026-11-08_1608_prompt_multi_tab_l6b_beside_layout.md`)
Session: ee7408f7-7ef4-4acd-94f4-ece5dfab58e8
Tree: `~/jjodel-w-mtl6b`, branch `multi-tab-l6b`, HEAD `f081ad4f2`
Model: Anthropic Claude Opus 5.5

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.

## Objective

For each of the four layout findings of P-2026-11-08-1003, the rule or code that causes it and the smallest fix, in SCSS
files or `pages/components/Navbar.tsx` only.

## Files read

Full paths under `frontend/src/`, windows as read:
`components/abstract/style.scss` 1010-1099; `components/abstract/tabs/ScriptTab.scss` (diff of `7f8e8c0fb`);
`components/abstract/DockManager.tsx` 200-261; `components/editors/PropertiesWithTreeView.tsx` 180-239, 682-710, 800-830;
`components/editors/properties-with-tree-view.scss` 1305-1384; `components/editor-v2/Toolbar.tsx` 884-1099, 1176-1335;
`components/editor-v2/EditorV2.scss` 222-421, 510-569, 597-636, 837-996; `components/editor-v2/viewportInset.ts` whole;
`pages/components/Navbar.tsx` 1725-1999; `components/dock/DockManagerStyles.scss` 318-335. Library:
`node_modules/rc-dock/lib/DockPanel.js:299`, `lib/DockBox.js:48`, `dist/rc-dock.css:516-520`.

## Measured baseline

Probe `~/.jjodel-lanes/P-2026-11-08-1608/gesture.mjs`, SCENE=beside, RUN=before, on `f081ad4f2`, viewport 1600 x 1000, light
theme, body `data-layout-mode="split"`. «Open beside ▸ Floor plan» on Office, Apartment on Floor plan. Pageerrors 0.

| Measure | Value |
|---|---|
| Dock sizes | [800, 800] |
| Panels | left x 0, w 889; divider x 889; right x 890, w 710 |
| Left flow | x 201, w 687, right edge 888 |
| Rail | x 489, w 400, right edge 889, computed `right: 711px` |
| Left canvas not under the rail | 288 px |
| Right flow | x 1091, w 508 |
| Toolbar left / right | w 687 (rail cell x 489, w 399) / w 508 (rail cell x 1370, w 399, right edge 1769) |
| Overlapping control pairs (bounding boxes) | left 38, right 37 |
| App bar | Apartment only |
| Drag of the divider 260 px to the left | sizes [629, 970], panels unchanged: 889 and 710 |

## Hypotheses

1. **(a) The rail is anchored on the left panel, by a deliberate measure.** Holds (read and measured).
   `PropertiesWithTreeView.tsx:209` «`const raw = panel ? Math.round(edge - panel.getBoundingClientRect().right) : 0;`», applied at `:1153`
   «`right: `${canvasGap}px``», where `CANVAS_PANEL` (`:182`) is the first child of the dock box. The rail is `position: fixed`
   (`properties-with-tree-view.scss:1332`) and floats over the left flow. Left canvas = panel 889 - palette 201 - rail 400 = 288.
2. **(b) The cap exempts only the Refactoring split.** Holds (read and measured). `abstract/style.scss:1051`
   «`.dock-hbox:not(:has(> .dock-panel .script-tab--beside)) > .dock-panel:not(:first-child):last-child,`» with `:1055` «`max-width: 710px`»
   in layout mode `split`, and the same exemption at `:1068` with `:1071` «`max-width: 550px;`» in mode `sidebar`. The dragged sizes above
   show the cap holding the panel at 710 while the stored size is 970.
3. **(c) The toolbar has no floor below which it stops shrinking without overlap.** Holds (read and measured).
   `EditorV2.scss:348-353` lets every group shrink («`min-width: 0; flex-shrink: 1;`») with no clip, so their buttons paint out of the group
   onto the next one. `:963` «`flex: none;`» and `:974` «`width: calc(var(--jj-rail-width, 0px) - 1px);`» give the rail cell 399 px in a bar of 508:
   on the right it runs to x 1769, past the window, over nothing, since no rail is under it. Controls, measured at full size: buttons 40 px x 7,
   views 29, dropdowns 64 and 110, trigger 72, command box about 139. No `@container` or `container-type` exists in that sheet:
   `grep -n "toolbar\|container-type\|@container" EditorV2.scss` returned the `toolbar` lines and none of the other two, so the search ran.
4. **(d) The app bar reads the first panel only, plus generators.** Holds (read and measured). `Navbar.tsx:1737`
   «`const modelsPanel = layout?.dockbox?.children?.[0];`» and `:1852` «`if (!id.startsWith('codegen_tpl_')) return;`» in `walkBeside`.
5. **Removing the cap alone would serve (a).** Falsified (arithmetic on the measures). Uncapped, sizes [800, 800] give a left panel of 800 and a left
   canvas of 800 - 201 - 400 = 199, worse than 288. The cap is what leaves 288 today. (a) and (b) are one problem: palette 201, left canvas X, rail 400 and
   right panel R must sum to 1600, so R = 800 leaves X = 199.
6. **The reservation can go on a panel's size.** Falsified for `flex-basis` and `padding` (read). rc-dock writes `flex: <size> <shrink> <size>px`
   inline (`DockPanel.js:299`) and on the first drag reads `offsetWidth` back as the new sizes (`DockBox.js:48`). A basis or padding not reflected in
   `offsetWidth` makes the panel jump on the first drag.

## The fixes

| Finding | Smallest fix | File |
|---|---|---|
| (a) | Only for a split of two canvases (a `.editor-v2` in the second model panel, no `.script-tab--beside`): `margin-right: var(--jj-rail-width)` on the first panel, so the rail gets its own column in the row; the panel's content extends under the rail as in a single tab, so `--jj-canvas-right-inset` stays true for that canvas. A margin counts in the flex sum and not in `offsetWidth`, so the sizes rc-dock reads back stay consistent and the first drag does not jump. | `abstract/style.scss` |
| (a) | The rail, whose inline `right` measures the panel's edge, moves back over that column: `margin-right: calc(-1 * var(--jj-rail-width))`, same scope, by `body:has(...)` because it is portaled | `editors/properties-with-tree-view.scss` |
| (b) | A second `:not(:has(...))` on the four selectors of the split and sidebar caps | `abstract/style.scss` |
| (c) | Same scope: `.editor-v2-toolbar` becomes a size container; under the threshold the labels go, the dropdowns show the chevron, the separators go, the buttons compact; on the right pane the rail cell shrinks to the badge. Existing classes only, `title` attributes already in the markup | `editor-v2/EditorV2.scss` |
| (d) | `walkBeside` also lists an M1 model tab, not when the first panel shows a Refactoring tab, so that split stays as it is | `pages/components/Navbar.tsx` |

Every fix is scoped to the split of two canvases, so a single tab and the Refactoring split are not matched by construction. None lies outside SCSS and `Navbar.tsx`.

## Dependencies and risks

- **R is the share of what the rail leaves, not the stored 800** (decision of this lane, Alfonso's look due): with the rail as a column, sizes [800, 800] give two panels of 600.
  The cap is gone: the panel follows its dock share past 710.
- `useCanvasPanelGap` and `viewportInset.ts` are unchanged. The inset reads as 408 on the right canvas too, which no rail covers: true today as well (read and measured, minimap x 973-1175 on a flow starting at 1091).
- A selector with `:has()` on the dock box runs on style recalculation only; the same shape already stands at `style.scss:1051`.
- A container on the toolbar could change how its absolutely positioned dropdowns paint: scoped to the split and checked in the app.
- Icons alone do not fit at full size in 400 px (sum of the controls above): the compact sizes are part of the fix, and the app check counts the controls left outside the bar.

## Open questions

1. Is the rail between the two panes the arrangement wanted, against the rail at the window's edge? Recommended here: between, so it stays next to the canvas it describes and the single-tab geometry of the left pane holds.

## Results, P-2026-11-08-1608

Viewport 1600 x 1000, one run, before the toolbar was finished. Baseline `f081ad4f2`, after = the three fixes in the tree.

| Measure | before | after |
|---|---|---|
| Panels | 889, 710 | 600, 600 (share 0.5 = dock share) |
| Left canvas not under the rail | 288 | 398 |
| Rail | x 489 to 889 | x 599 to 999, right canvas from 1202 |
| Overlapping control pairs, left / right | 38 / 37 | 0 / 0 |
| App bar | Apartment | Apartment, Office (`beside: true`) |
| Pageerrors | 0 | 0 |

## Results, P-2026-11-08-1633

**Correction to 1608: the divider drag was not dead.** The probe grabbed `x + w/2` of a rounded rect, 1000.5, while the 1px divider lies at x 999.5 to 1000.5 (panels 599.5 wide). That point is the right panel. Integer x 999 and 1000 both hit `.dock-divider`, and a real drag from 999 moves the panels. No code changed for it.

Fixes: `fa3b09e2f` (right minimap, inline `right` without the rail's inset), `b89421b06` (toolbar).

Toolbar: under 1100px of bar, icons only. What does not fit scrolls inside the bar. On the first pane the rail cell is sticky and opaque, so it stays over the rail. The menus are fixed and anchored to their selector: a fixed box with auto offsets stayed at x 298 to 498 after the bar scrolled.

Split, three runs per width, 0 failures in all six, pageerrors 0 (numbers identical where read):

| Measure | 1600 | 1280 |
|---|---|---|
| Rail | x 599 to 999, w 400 | x 459 to 819, w 360 (its minimum) |
| Left canvas clear of the rail | 398 | 258 |
| Right canvas | x 1202 to 1599, w 398 | x 1022 to 1279, w 258 |
| Divider drag, panels after | 339, 861 (right past 710) | 199, 721 |
| Left minimap | x 373 to 575 | x 233 to 435 |
| Right minimap | x 1381 to 1583 | x 1061 to 1263 |
| Overlapping control pairs, left / right | 0 / 0 | 0 / 0 |
| Buttons reachable after scrolling, left / right | 15 of 15 / 15 of 15 | 15 of 15 / 15 of 15 |
| Bar scrollWidth / clientWidth, left | 819 / 798 | 779 / 618 |
| Bar scrollWidth / clientWidth, right | 443 / 398 | 443 / 258 |
| Left rail cell against the rail | within 1px | x 460 (rail 459), r 819 |
| Views menu whole, on its trigger | left, right | x 258 to 458, x 1079 to 1279 |
| App bar | Apartment, Office | Apartment, Office |

Once each, 1600:

| Scene | Result |
|---|---|
| Single tab, lane against the base `f081ad4f2` | same: canvas x 201 to 1599, rail cell x 1200 w 399, rail x 1200 to 1600, minimap x 973 to 1175, zoom 0.716, 18 nodes, 0 overlaps |
| Refactoring split | editor w 542, canvas w 613, 8 nodes, sizes 640 / 960, as in 1003 |
| 1730 two-model demo | 15 of 15, Apartment 18, Office 25, pageerrors 0 |

Gates on `b89421b06`: typecheck exit 0, build exit 0, check:docs exit 0, vitest 12 files 147 passed (the seven test files that name a touched file, the five of L6).

Probe changes against 1608's copy: a sticky cell over a scrolled control does not count as an overlap, since the reachability row measures that case; the left-canvas threshold is 300 at 1600 and 250 at 1280, because 258 is all the accepted split leaves there; the menu probe scrolls the trigger into view first.

Limits, as measured or as noted:

- Only the views menu was opened. The notation and theme triggers are disabled with a viewpoint active; they share the rule.
- A browser without `anchor()` places a menu under its trigger only while the bar is unscrolled.
- A long drag can leave the left panel narrower than its palette: at 1280 it reached 199, palette 201, so the left canvas lies wholly under the rail. rc-dock's minimum, untouched here. The probe's `leftVisible` 357 on that row is not a visible width.
- At 1280 the app bar chips shrink to the icon and one letter (crop). Not compared with the trunk.
- Inferred, not measured: `overflow-y: hidden` clips the cell's `margin-bottom: -1px`, so in the split its hairline can stop 1px above the rail's.
- The crops of the split show the bars as the probe left them, scrolled to the views menu.
