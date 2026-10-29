# Discovery: shell visual consolidation, Phase 1

Prompt-ID: P-2026-10-19-1710 · Chat: C-2026-10-19-1610 · Front: shell-ui · Branch `shell-ui-disc` from `084c67fcd`.
Read-only. No file under `frontend/src` changed, no server started. Paths below are relative to
`frontend/src/` unless they start with `docs/`, `frontend/` or `~`.

## 1. Hypothesis and goal

**Hypothesis under test.** The pilot's target (`~/.jjodel-lanes/pilots/linear/overlay_v1.css`,
`overlay_v2.css`) can be moved into the source as a shell-scoped token layer plus per-surface edits,
without touching `:root`, the canvas or the critical zone, in lanes of at most five files each.

**Verdict.** It holds, with three corrections to the framing:
1. There is no shell root element. Two of the six surfaces (properties rail, editor context menu) are
   portalled to `document.body`, so the only common ancestor is `body`/`html`, which also holds the
   canvas. The token set therefore lives on a **selector list of the six surface roots**, not on one
   element (§3.2).
2. The mode exists twice (Redux `advanced` and `useInterfaceMode`); the DOM attribute must come from
   Redux (R-RAIL-13) (§3.3).
3. Three items of the approved target touch rows Alfonso already ratified (R-RAIL-7, D-UI-11) or what the
   MODELS demo script shows (`SEMANTIC TYPE CLASS`). They are listed in §8 as awaiting him (RC-26).

## 2. Files read

Pilot (input, read-only): `~/.jjodel-lanes/pilots/linear/baseline_2026-10-19.md`, `overlay_v1.css`,
`overlay_v2.css`, `after_v2_2026-10-19.md`.

Repo: `CLAUDE.md`; `docs/PROTOCOL.md` (P4, P9, P13); `docs/decisions.md` (R-RAIL-3..14, D-UI-10..16,
RC-21/25/26, the R-SIM row at :2526); `docs/demo/models_2026_simulator_demo.md`;
`docs/redesign/rail/README.md`; `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`,
`..._1651_prompt_gallery_snapshots_crop.md`;
`pages/components/Navbar.tsx`, `pages/components/navbar.scss`, `pages/components/menu/menu.scss`,
`pages/components/menu/Menu.tsx`, `pages/components/Dashboard.tsx`;
`components/editor-v2/EditorV2.scss`, `EditorV2.tsx`, `Toolbar.tsx`, `ContextMenu.tsx`,
`panels/PalettePanel.tsx`, `_themes.scss`, `components/ColorSchemeSelector.tsx`;
`components/contextMenu/ContextMenu.scss`, `ContextMenu.tsx`;
`components/StatusBar.tsx`, `StatusBar.scss`, `StatusBarRightZone.tsx`, `StatusBarRightZone.scss`;
`components/editors/PropertiesWithTreeView.tsx`, `properties-with-tree-view.scss`, `Info.tsx`,
`info-improvements.scss`, `NodeEditor.tsx`;
`components/TreeViewSidebar/TreeViewContent.tsx`, `tree-view-sidebar.scss`, `TreeViewScopeBar.tsx`;
`components/ui/JjSelect/JjSelect.tsx`, `ui/Toggle/Toggle.tsx`, `Toggle.module.css`,
`ui/InfoTooltip/InfoTooltip.scss`, `components/resize-handle.scss`;
`styles/tokens.css`, `styles/tokens/*.scss`, `styles/components/_form-system.scss`, `styles/style.scss`,
`redux/store.tsx`, `hooks/useInterfaceMode.ts`, `index.scss`, `App.tsx`, `App.scss`, `frontend/index.html`;
`frontend/scripts/smoke/{assertions,states,run,calibrate}.ts`, `README.md`;
tests: `common/libraries/__tests__/lastSaved.test.ts`,
`components/TreeViewSidebar/__tests__/dataManagerSection.test.ts`,
`components/editor-v2/viewpoint/authoring/__tests__/panelSections.test.ts`.

Method: four read-only explorer passes with `command grep` (BSD, bypassing the ugrep wrapper) and
positive controls (`--color-accent:` found at `styles/tokens/_colors-light.scss:118`; `--space-` 53
files), then spot reads of every line that decides something below.

## 3. Findings

### 3.1 Where the shell styles live (COSA 1)

L = literal, T = token. Abbreviations: N `pages/components/navbar.scss`, E `components/editor-v2/EditorV2.scss`,
SB `components/StatusBar.scss`, RZ `components/StatusBarRightZone.scss`, PWT
`components/editors/properties-with-tree-view.scss`, TVS `components/TreeViewSidebar/tree-view-sidebar.scss`,
IMP `components/editors/info-improvements.scss`, FS `styles/components/_form-system.scss`.

**Topbar** (`Navbar.tsx:1862` `nav ... 'w-100 nav-container d-flex appbar'`)

| Selector | Rule | Current value |
|---|---|---|
| `nav.nav-container` | N:174-175, overridden by `.nav-container.appbar` N:1452-1456 | `0.5px solid var(--color-border-tertiary, #e2e8f0)` (width L; token undefined, so the fallback paints), `box-shadow: none !important` |
| `kbd.keystroke-pill` | N:681, :692, :694 | `border: 1px solid rgba(0, 0, 0, 0.1)` L; `color: #6b7280` L (gray ramp, not slate) |
| `.appbar-tab__badge` | N:1676 | `border-radius: 3px`, `font-size: 9px`, `font-weight: 700` (all L) |
| `.appbar-tab__close` | N:1735 | `border-radius: 2px` L, `color: var(--color-text-placeholder, #94a3b8)` T, `font-size: 10px` L |
| `.new-document` / `__btn` | N:1819, N:1832 | `border-left: 0.5px solid var(--color-border-secondary, #e2e8f0)`; `border-radius: 6px` L |
| `.appbar-save` | N:1533 | `border: 1px solid var(--color-border-secondary)` T, `border-radius: 6px` L |
| `.appbar-mode-switch` / `__opt` | N:2020, N:2027-2030 | `border-radius: 10px` L; opt `padding: 4px 10px`, `font-size: 12px`, `line-height: 1` = 20 px tall |
| `.menu-trigger` | N:844 | `border-radius: $menu-item-radius` = `6px` (N:824) |
| `.user-badge` | N:392, menu.scss:296 | `font-weight: var(--font-semibold)` T (600) |

**Menus.** Three different `.context-menu` systems:
- `E:3998` global, the white one the pilot measured: `background: var(--float-bg, #ffffff); border: 1px solid var(--float-border, #e2e8f0); border-radius: 12px; padding: 6px;`. The editor menu is portalled to `document.body` (`EditorV2.tsx:4982-4990`, markup `editor-v2/ContextMenu.tsx:36`).
- `components/contextMenu/ContextMenu.scss:214` global, dark: `background: #1e293b; border: 1px solid #334155; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);` (legacy per-graph menu, `contextMenu/ContextMenu.tsx:67`). Both are bare `.context-menu`; on the navbar File menu the pilot measured the white 12 px one, so E wins by load order there. Not re-measured here.
- Navbar dropdown: `N:567` `.nav-container .content.context-menu { ... padding: 0; }`, `ul` `padding: var(--space-2)` (N:573-579), `.highlight` `min-height: 30px` (N:585), item `padding: var(--space-2) var(--space-3)` (N:647), hover radius `var(--radius-md)` (N:618). The 36 px item height is computed, no literal.
- Shadow on open: `App.scss:95` `box-shadow: var(--smart-elevation-8)`.

**Left palette** (`PalettePanel.tsx:126-255`, mounted `EditorV2.tsx:4876`)

| Selector | Rule | Current value |
|---|---|---|
| `.editor-v2-palette` | E:1229-1230 | `background: var(--surface-1)` (#fff), `border-right: 1px solid var(--border-subtle)` (rgba(0,0,0,.06)) |
| `.palette-instances` / `__title` | E:1348, E:1350 | `border-bottom: 0.5px`; title `color: var(--text-muted)`, `font-size: 10px`, `text-transform: uppercase`, `letter-spacing: 0.05em` (the uppercase category label, kept) |
| `__item` | E:1366 | `border-radius: 6px` L, `border: 0.5px solid var(--border-subtle)` |
| `.palette-hints` / `.palette-hint__key` | E:1551, E:1564 | `0.5px` border-top; key `border-radius: 3px`, `font-size: 10px`, `color: #94a3b8` (all L) |

**Status bar** (`StatusBar.tsx:322`, `StatusBarRightZone.tsx:65-102`)
- `SB:19` `font-family: -apple-system, BlinkMacSystemFont, 'Inter Variable', sans-serif;` (the one non-Inter surface). Crumb/middot/stats/conforms (SB:66, 107, 99, 112) inherit it; colours are literals `#334155`, `#94a3b8`, `#64748b`.
- `RZ:100` `.sb-rz__dot` `border: 1.5px solid #f8fafc`; `RZ:166` `.sb-rz__version` `font-size: 10px; color: #94a3b8`.
- `.sb-rz__jjodie` (RZ:53) and `.sb-rz__bell` (RZ:114) have no size; the child sets it (icon 20x20 at RZ:69-70, bell glyph 15 px at RZ:125).

**Editor toolbar** (`Toolbar.tsx:786`)
- `E:231` `.editor-v2-toolbar` `border-bottom: 1px solid #f8fafc` L.
- Radii all literal: `.toolbar-btn` E:521 `6px`; `.toolbar-viewpoint-trigger` E:638 `5px`; `.toolbar-commands__btn` E:866 and `__level` E:893 `6px`; `.toolbar-commands` E:853-854 `8px`; `.toolbar-identity__badge` E:1024 `5px`; `.toolbar-dropdown-btn` E:548 `0.5px solid var(--border-default, #e2e8f0)`, `6px`.
- `.toolbar-group__label` E:247 `font-size: 9.5px`, uppercase. `.validation-freshness` E:471 `font-weight: 600`.

**Properties rail** (portal, `PropertiesWithTreeView.tsx:1100-1107`: `createPortal(<div className={\`properties-tree-overlay...\`}> ... document.body`)

| Selector | Rule | Current value |
|---|---|---|
| `.properties-with-tree-view--rail` | PWT:1440-1446 | `background: var(--color-panel-bg)` (#fff); `border-left: 1px solid var(--border-subtle)` |
| `.tree-view-panel-container` | PWT:786, rail override PWT:1465 | `#fff`, then `transparent` |
| `.tree-scope-bar` | TVS:1442 | `background: #ecfeff; border-bottom: 1px solid #cffafe` (L, cyan) |
| `.tree-search__input` | TVS:103 no radius; global `input[type="text"]` FS:43 | `var(--form-input-border-radius)` = 6px (FS:12) |
| `.tree-section__label` | TVS:946-952 | `font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.06em; color: var(--color-text-tertiary)` |
| `.tree-counter`, `.tree-row__not-rendered-hint`, `.resize-handle__hint` | TVS:958, TVS:1429, `resize-handle.scss:156` | `font-size: 10px` L |
| `.tree-node__icon` | PWT:1142, TVS:309 | `border-radius: 3px; font-size: 10px; font-weight: 600`; `.tree-m1-icon` TVS:1547 `5px` |
| `.tree-row` | TVS:997-1000 | `height: 26px; // literal by R-RAIL-9` |
| `.tree-node__toggle` | TVS:262, PWT:1110 | `14px x 14px` |
| `.tree-row__action` | TVS:1102 | `20px x 20px`, `border-radius: 3px`, `color: var(--color-text-secondary)` |
| `.props-header__glyph` / `__kind` | PWT:389, PWT:431-438 | 700 / 600, kind uppercase 0.06em |
| `.props-section__title` | IMP:736-740 | `font-size: 13px; font-weight: 500!important; color: var(--text-muted)`, uppercase, `0.5px` |
| Advanced disclosure title | PWT:2133 | 11px, 600, uppercase, 0.08em, `$pc-slate-400` |
| `.jj-field-label` / `.jj-field-required` | FS:800, rail PWT:1730; FS:811 | `11px; 500; #64748b`, rail 12px; required `10px` |
| `input.text` in rail | PWT:1750 | `border-radius: 6px; border: 1px solid $pc-slate-300 !important` |
| `.properties-node-section__label` | PWT:1264-1268 | 600, uppercase, 0.08em |
| `.jj-flags__title` / `__summary` / `__group` / `.jj-flag` | PWT:1899, :1913, :1995, :1929 | 11/600/uppercase; summary `10px`; group (Focus) `1px solid #eef2f7; border-radius: 9px`; flag `99px` |
| `.jj-mult__seg` | PWT:1795, :1817 | `1px solid $pc-slate-300; border-radius: 6px`; selected 600 |
| `.jj-info-icon` | `ui/InfoTooltip/InfoTooltip.scss:35` | `font-size: 9px; font-weight: 600; color: #94a3b8` |
| `.rail-focusbar` / `__back` / `__step` / `__current` | PWT:1614, :1634, :1670, :1655 | bar `var(--input-height-sm)`; back `height: 22px`, step 22x22, `var(--radius-base)`; current 600 |

`b.me-2` in the rail: `Info.tsx:524` ("Depends from models") and `Info.tsx:1157` ("Topic"), styled by IMP:861
`font-size: 13px !important; font-weight: 400 !important; color: #64748b !important;`.

**Files shared with non-shell components.**
- `E` (EditorV2.scss, 4400+ lines) holds canvas, vertex, rail-in-editor and menu rules together. `.toolbar-btn` is also defined unscoped in `pages/components/catalog/catalog.scss:763`, `editors/Console/console-tab.scss:105`, `pages/components/bottomToolbar.scss:44`, and rendered by Catalog, BottomToolbar, ConsoleToolbar, Logger, JjtlToolbar, HighlightPalette, ScriptExecutionWindow, DocumentationTab. Toolbar edits must stay under `.editor-v2-toolbar`.
- `menu.scss` reaches `pages/Notes.tsx:19`, `Recent.tsx:18`, `Project.tsx:6` through `Menu`.
- `navbar.scss` also styles `.project-label`, `.help-menu`; `.nav-container` is reused in `pages/components/style.scss:5`.
- `contextMenu/ContextMenu.scss` (global `.context-menu`, `.highlight`) also serves the canvas context menu, undo/redo (`components/topbar/undoredocomponent.tsx:184`) and the tree view.
- `RZ` is shared with the JjTL status bar: `jjtl/components/JjtlStatusBar.tsx:7` renders `<StatusBarRightZone variant="dark">`.
- `TVS` serves the standalone sidebar too; D-UI-11 already says rail-only changes go in an override in PWT under `.properties-with-tree-view--floating`, "mai nel foglio della sidebar".
- `FS` and `InfoTooltip.scss` are global form and tooltip sheets; `JjSelect` is used by `forEndUser/Input.tsx:360,439`, which renders form views on the canvas. None of them can carry a shell value without scoping.

### 3.2 Token inventory and the shell token set (COSA 2)

`:root` declarations: `styles/tokens.css:23` 150; `styles/tokens/_colors-light.scss:76` 278
(`:root, :root[data-theme="light"]`); `_typography` 33, `_spacing` 33, `_shadows` 28, `_z-index` 27,
`_transitions` 26, `_radius` 20, `_gradients` 12, `_layout` 3; `_form-system.scss:7` 24;
`editor-v2/_themes.scss:197` emits a 95-name map on `:root` and on `.editor-v2.theme-light` (`:191`, D-UI-10).
716 unique names.

**Canvas reads** (nodes, edges, IR, DynamicHandles, `DV.tsx`, `defaultViewTemplate.ts`, node and form sheets,
E:1580-3049 and E:4412-end): 1150 references, 247 unique names. Largest groups: `--color-inode-*` 139
(e.g. `edges/UnifiedEdge.tsx:1312`), `--color-form-*` 99, `--text-*` 94, `--font-*` 63, `--color-text-*` 54,
`--radius-*` 43, `--space-*` 36, `--border-*` 32 (`--border-default` x30), `--surface-*` 24,
`--canvas-*` 11 (`irStyle.ts:233`). The canvas reads `--radius-*`, `--color-text-*`, `--border-default` and
`--surface-*`, so none of these can change value globally: this is why the pilot never touched `:root`, and
why the shell needs names of its own.

**Shell reads.** 154 unique names, 72 shared with the canvas, 82 shell-only. Examples of shell-only:
`--jj-appbar-height` (N:1453), `--z-navbar` (N:187), `--color-border-tertiary` (N:1455, undefined),
`--text-dim` (E:250), `--alignment-bg` (E:1139), `--color-panel-border` (PWT:1278), `--float-*` (E:4001-4130).
The status bar reads almost no tokens: only `--jj-statusbar-height` (SB:13) plus three semantic colours.

**Never read.** 272 of 716 (lower bound: a mention in a comment counts as a read). Includes 15 theme-map
names (`--topbar-bg`, `--topbar-text`, `--menu-bg`, `--menu-shadow`, `--panel-border`, ...). Not touched here.

**Spacing.** `var(--space-`: 745 occurrences in 51 files (rem scale, `_spacing.scss:13-25`, no `--space-7`).
`var(--spacing-`: 49 in 19 files, one a comment in `tokens.css`, the rest `components/ui/*.module.css` and
three `viewpoint/authoring` files (px scale, `tokens.css:130-141`). `--space-*` is the scale; `var(--space-half)`
is read once and defined nowhere. The shell lanes use `--space-*` only and do not migrate `--spacing-*`.

**Name check.** `command grep -rlF -e '--shell-'` over `frontend/src`, `frontend/` (no node_modules), `docs/`
and the repo: 0 files. Control on the same commands: `--space-` 53 files in `src`, 39 in `docs`.

**Proposed set** (aliases only, no new values, per R-RAIL-10 "si emenda il design, non si estende la scala"):

| Name | Value | Source of the value |
|---|---|---|
| `--shell-radius-control` | `var(--radius-sm)` | 4px, `_radius.scss:14` |
| `--shell-radius-menu` | `var(--radius-md)` | 8px, `_radius.scss:16` |
| `--shell-border` | `var(--color-panel-border)` | `$slate-200` #e2e8f0, the D-UI-11 hairline token |
| `--shell-text-1` | `var(--color-text-primary)` | #0f172a, `_colors-light.scss:98` |
| `--shell-text-2` | `var(--color-text-tertiary)` | #475569, `_colors-light.scss:100` |
| `--shell-text-3` | `var(--color-text-placeholder)` | #64748b, `_colors-light.scss:101`; 4.6:1 per D-UI-13 Em. 2 |
| `--shell-surface-rail` | `var(--color-slate-50)` | #f8fafc, `tokens.css:27`; `--color-bg-secondary` avoided (R-RAIL-6 black list) |
| `--shell-surface-field` | `#fff` via `var(--color-panel-bg)` | `_colors-light.scss:251` |
| `--shell-font-size-min` | `var(--text-xs)` | 11px |
| `--shell-hit` | `24px` | literal, like R-RAIL-9 heights (no step near 24 on the control scale) |
| `--shell-row-height` | `26px`, `24px` under `[data-mode="advanced"]` | R-RAIL-9 literal |
| `--shell-menu-item-height` | `36px`, `28px` under `[data-mode="advanced"]` | today computed, no literal |
| `--shell-menu-shadow` | `0 4px 12px rgba(15, 23, 42, 0.08)` | pilot v1 line 8; composed by hand as R-RAIL-10 asks for shadows |

Note that `--shell-text-2` is the token named *tertiary* and `--shell-text-3` the one named *placeholder*:
the shell levels are not the `tokens/` roles, and writing the alias once is what keeps that mapping in one place.

**Where it lives.** Ancestry measured in source:
- topbar `nav#navbar` and `.app-statusbar` are fragment siblings in `pages/components/Dashboard.tsx:648,674`;
- palette, toolbar and canvas are all inside `div.editor-v2.theme-light` (`EditorV2.tsx:4871`): palette at `:4876`, `.editor-v2__main` at `:4884` holds `.editor-v2-toolbar` and `.editor-v2__canvas` (`:4968`);
- the rail and the editor context menu are portalled to `document.body`.

The only common ancestor of the six is `body` (or `.router-wrapper` without the portals), and it contains the
canvas. A single shell root element does not exist, and creating one would mean moving portals. The set is
therefore declared once, on the selector list of the six surface roots:

```
nav.nav-container, .editor-v2-toolbar, aside.editor-v2-palette,
.properties-tree-overlay, .app-statusbar, .context-menu { --shell-...: ...; }
```

`.editor-v2__canvas` is a sibling of the toolbar and of the palette, so it inherits nothing. A popover that
portals outside these roots (react-select menus, tooltips) does not inherit either; its rules use
`var(--shell-x, <fallback>)`. File: `styles/tokens/_shell.scss` (new), imported by `styles/tokens/index.scss`
(D-UI-13: the semantic layer belongs to `styles/tokens/`). Mode-dependent values go under
`html[data-mode="advanced"] :is(<same list>)`.

### 3.3 Basic/Advanced (COSA 3)

- State: Redux root field `advanced: boolean = false` (`redux/store.tsx:215`). A second system,
  `useInterfaceMode` with localStorage `jjodel.interfaceMode` (`hooks/useInterfaceMode.ts:15`), mirrored in
  `U.interfaceMode` (`common/U.tsx:216`). R-RAIL-13: "Il rail legge **solo** Redux `state.advanced`; nessun
  consumatore nuovo di `useInterfaceMode`".
- Writers all go through `SetRootFieldAction.new('advanced', ...)`: `Navbar.tsx:872,886,921`,
  `BottomBar.tsx:55`, `ProfileSection.tsx:394`, `LockedFeature.tsx:41`.
- Switch: `Navbar.tsx:2016` `{(['basic', 'advanced'] as const).map((m) => (`; active class at :2020
  ``className={`appbar-mode-switch__opt${(m === 'advanced') === !!props.advanced ? ' appbar-mode-switch__opt--active' : ''}`}``;
  click :2021 `onClick={() => selectInterfaceMode(m)}`.
- No `data-mode` exists. Existing attributes: `html[data-theme="light"]` from the boot script in
  `frontend/index.html` (light only, D-UI-15), `body[data-layout-mode]` (`editor-v2/Toolbar.tsx:609`),
  `body[data-editor-type]` and `body[data-active-tab]` (`components/abstract/Dock.tsx:248,252,410,412`).
- **Smallest change**: one `useEffect` in `NavbarComponent` next to the restore effect at `Navbar.tsx:919-925`,
  keyed on `props.advanced`, setting `document.documentElement.dataset.mode = props.advanced ? 'advanced' : 'basic'`.
  Navbar is mounted on every view (comment at `Navbar.tsx:913`) and reads Redux, so R-RAIL-13 holds.
  `documentElement`, not an app div, because of the two body portals. Known cost: one frame of `basic`
  before the restore effect at :920 for a user who left Advanced on; harmless for density.

### 3.4 Uppercase source strings (COSA 4)

Uppercase in source, all `<CollapsibleSection title="...">` in `components/editors/Info.tsx`, rendered through
`.props-section__title`: `INHERITANCE` :105; `GENERAL` :514, :546, :571, :583, :593, :645, :659;
`SEMANTIC TYPE CLASS` :518; `DEPENDENCIES` :522; `CONTENTS` :538; `TYPE &amp; BOUNDS` :597; `DISPLAY` :624;
`RETURN` :649; `VALUE` :663; `TYPE` :726; `SLOTS` :733, :741; `REFERENCES` :818. Also `NODE`
(`PropertiesWithTreeView.tsx:1081`, `<span className="properties-node-section__label">NODE</span>`) and the
NODE section's own titles in `components/editors/NodeEditor.tsx`: `TRANSFORM` :382, `RELATIONSHIPS` :577,
`ANCHORS` :655. Mixed case in source, uppercased by CSS only: "Advanced" (Info.tsx:1752, PWT:2133),
"Flags" (Info.tsx:222, PWT:1902), "Properties" (Info.tsx:1269), tree section labels (TVS:949).
`.props-header__kind` (PWT:438) is the type badge, not a section title, and stays uppercase.

- No translation layer: zero hits for i18n, `useTranslation`, i18next, react-intl, locale folders (control:
  `react-select` in `package.json`, 1 hit).
- Tests and probes: none matches the titles. `dataManagerSection.test.ts:297` asserts
  `.tree-section__label--clickable` exists in TVS (source text). `panelSections.test.ts:66,87,150,164` pins
  `"General"` in the authoring panels, a different component. `UnifiedSettingsModal.tsx:37` `label: 'GENERAL'`
  is the settings modal, out of scope.
- **Documents that quote them**: the MODELS demo script `docs/demo/models_2026_simulator_demo.md:20,35,109,501`
  ("section `SEMANTIC TYPE CLASS`"), the R-SIM row `docs/decisions.md:2526`, and the rail spec
  `docs/redesign/rail/README.md:25` ("Six section headers (`GENERAL`, `TYPE & BOUNDS`, ..."). See §8.

### 3.5 Unstable selectors (COSA 5)

- `css-1g1bwnd-control` comes from `components/ui/JjSelect/JjSelect.tsx`: `className={'jj-select'}` (:175) and
  `styles={{ ...buildStyles<Option, IsMulti, Group>(), ...(userStyles || {}) }}` (:183), with `control` at :33
  (`minHeight: 36, height: 36`, `borderRadius: 6`). No `classNamePrefix`, no `classNames`. Rail consumers:
  `Info.tsx:115` (Extends), :313 (`TypeSelect`, used :600, :652), :525 (Depends from models). Also used by
  `ViewpointProperties.tsx:191` and `forEndUser/Input.tsx:360,439` (canvas forms). A stable hook already
  exists: PWT:1769 `.jj-field .jj-select > div:first-of-type`.
  Route: add `classNamePrefix="jj-select"` (additive, emits `.jj-select__control` alongside the hash) and style
  it from PWT under the rail. Editing `buildStyles` would reach canvas forms.
- `_toggleXs_*` is `components/ui/Toggle/Toggle.module.css:78` `.toggleXs { width: 24px; height: 14px; padding: 2px; }`,
  consumer `ui/Toggle/Toggle.tsx:89`, mounted in the rail at `Info.tsx:90`, :349 with `size="xs"`, and by
  authoring panels (`ContainmentSection.tsx:343`, `RowAuthoringPanel.tsx:433`, others) as consumers.
- `b.me-2`: see §3.1; route is a semantic class on the two `<b>` in `Info.tsx`.

### 3.6 Small targets (COSA 6)

| Target | TSX | Size today | 24 px without moving layout |
|---|---|---|---|
| `.tree-node__toggle` | `TreeViewContent.tsx:746,1124` | 14x14 (TVS:262, PWT:1110) | Yes: 24x24 with `margin: -5px` (pilot). Row is 26 px, no `overflow:hidden` (`position:relative`, TVS:1008). `.is-leaf` is `visibility:hidden` (:1154) |
| `.tree-row__action` | `TreeViewContent.tsx:1838,1845,2014` | 20x20 (TVS:1102), `gap: 0` | Vertically yes. Horizontally the 24 px boxes overlap their neighbours by 2 px each side with `margin: -2px`; the later sibling wins the overlap. Hidden (`opacity:0; pointer-events:none`) until row hover or `:focus-within` (TVS:1082-1099) |
| `.rail-focusbar__step` | `PropertiesWithTreeView.tsx:1039,1048` | 22x22 (PWT:1670) | Yes, `flex:none`, `margin: -1px` in a 34 px bar |
| `.rail-focusbar__back` | `PropertiesWithTreeView.tsx:1027` | `height: 22px` (PWT:1634) | Yes with height + `margin-block: -1px`; a `::before` would be clipped by its own `overflow:hidden` (PWT:1648-1650) |
| `.sb-rz__jjodie` | `StatusBarRightZone.tsx:65` | 20x20 child | Yes; bar 32 px (`_layout.scss:19`), no clip (SB:9-24) |
| `.sb-rz__bell` | `StatusBarRightZone.tsx:81` | 15 px glyph | Yes; badge is absolute inside. Keep the `NotificationCenter` anchor rect in the check |
| `.appbar-mode-switch__opt` | `Navbar.tsx:2020` | 20 px (N:2030) | Yes with `height: 24px; margin-block: -2px` (pilot); `padding: 6px` would grow the switch 26 -> 30 |
| `toggleXs` | `ui/Toggle/Toggle.tsx:89` | 24x14 (`Toggle.module.css:78`) | Yes with `.toggleXs::before { content: ''; position: absolute; inset: -5px 0; }`; `.toggle` is `position: relative` (:34), no clip. Reaches the authoring panels as consumers, layout unchanged |

Measuring note: the pilot's "targets < 24 px" reads element rects. The negative-margin route grows the rect
and is measured by it; a `::before` route is not (the rect stays 24x14). For `toggleXs` the check is
`document.elementFromPoint` at centre ±12 px vertically, which must return the button.

### 3.7 Contrast (COSA 7)

Tokens resolving to `#94a3b8` used as text in the shell: `--text-dim` (`_themes.scss:44`),
`--color-text-disabled` (`_colors-light.scss:102`), `--input-placeholder` (`_themes.scss:108`),
`--color-slate-400` (`tokens.css:31`), `--float-header-arrow` (`_themes.scss:175`), plus literals.
Count of `color:` uses per surface:

| Surface | Uses | Where |
|---|---|---|
| Topbar | 11 | literals N:1129, 1199, 1943, 2033; `var(--color-text-placeholder, #94a3b8)` N:1750, 1956 (token paints #64748b, fallback inert); `--color-text-disabled` N:537, 636, menu.scss:123, 128; inline `Navbar.tsx:1551` |
| Toolbar | 8 | `--text-dim` E:250, 422, 447, 490, 1089, 1092, 1154, 1175 |
| Palette | 4 | `--text-dim` E:1300; literals E:1510, 1540, 1568 |
| Properties rail | 26 | `--text-dim` x11 and `--input-placeholder` x2 in E:3128-3972; PWT:1251, 1591; literals TVS:271, 355, 367, 642, 675, 724; `--color-text-disabled` TVS:1420, 1434, 1500, 1523 |
| Status bar | 6 | literals SB:59, 86, 93, 108; RZ:126, 167 |
| Menus | 2 | E:4130 (`--float-header-arrow`), `EdgeTypePopup.scss:26` |

Total 57. The `--color-text-disabled` sites inside a disabled control stay at #94a3b8 (exempt, D-UI-13
Em. 6 rule "R3 prima di R5"); every lane checks each site's state before moving it to `--shell-text-3`.
App-wide `#94a3b8` is in 125 files (387 occurrences); outside the shell it is not this front's business.

### 3.8 Risks (COSA 8)

- **Critical zone.** No file of CLAUDE.md §3.1 imports or defines a shell class or sheet (`command grep -rnE`
  over those paths; only comments hit: `utils/defaultViewTemplate.ts:66`, `LabelEntryEditor.tsx:196`,
  `ir/widgets/ReferencePicker.tsx:6`). Indirect: the authoring and IR panels render inside
  `.properties-tree-overlay` and use `ui/Toggle` with `size="xs"`, so rail and toggle styling reach them
  visually. No Layer Impact Report is needed; every rail lane's visual check includes one authoring panel.
- **Smoke** (`frontend/scripts/smoke/`): A2 canvas/main ratio >= 0.95 (`states.ts:26-30`); A3 no fixed
  element intersecting `.app-statusbar`, tolerance 0 (`states.ts:33`, `assertions.ts:90,216`); A5 seams
  among appbar, toolbar, rail and status bar, 0.5 px, appbar to toolbar 1 px (`assertions.ts:146-148,
  267-300`, `states.ts:40,48`). Clipping is not covered (`states.ts:272-274`). No shell lane changes a
  height token, so A5 holds if `--jj-*-height` stay untouched.
- **Source-text tests**: `lastSaved.test.ts:209-215` asserts the 300 characters after `.appbar-last-saved`
  in N contain `var(--color-text-tertiary)` and `font-size: 11px`; `dataManagerSection.test.ts:48,297`
  asserts TVS blocks exist; `dataManagerPicker.test.ts:318-425`, `irSelectionRing.test.ts:115`,
  `inheritanceStyle.test.ts:22` read E. Lanes on those files run those tests.
- **Open branches.** `tpl-e` (P-2026-10-19-1650, File > New) and `tpl-c2` (P-2026-10-19-1651) are not
  merged into HEAD (`git merge-base --is-ancestor` exit 1); at HEAD both prompts read `Status: da eseguire`.
  `tpl-e` commit `1c3d9460e` edits `pages/components/Navbar.tsx` (hunks near 389, 454-478, 621, 1373-1427)
  and adds 13 lines to N near :509 (`ul li.section-label`, uppercase, in the File menu). `tpl-c2`
  (`f120bd3cf`) touches only `scripts/library/snap-gallery.ts` and five gallery PNGs: no overlap.
  `tpl-int` also touches `Navbar.tsx`, `pages/dashboard.scss`, `styles/tokens.css` (+12, level tokens),
  `App.tsx`. No tpl-* branch touches SB, RZ, TVS, PWT, E, PalettePanel or `styles/tokens/*`.
  Consequence: the topbar and menu lanes wait for `tpl-e`/`tpl-int` to merge, or rebase on them.
- **`.context-menu` triple definition** (§3.1): a menu lane that edits only one of them may see no change;
  it measures which rule paints before editing (CLAUDE.md §5, consumers first).
- **`.toolbar-btn` collisions** (§3.1): toolbar rules stay under `.editor-v2-toolbar`.

## 4. Slicing (COSA 9)

Every lane: worktree per P14, typecheck 0, build exit 0, tests of the touched area, `npm run smoke`, P8 visual
check at 1600x1000 on "DemoPetri copy" with the pilot's DOM measures on the three screens (model, attribute,
class selected), in Basic and Advanced: region rects and canvas 1398x876 unchanged; text < 11 px; targets
< 24 px; clipped text count not above baseline (5); console errors not above baseline (5 `init_dash`);
border widths; distinct radii; weights. Each lane's check is restricted to its surface.

| Lane | Scope (files) | Diff | Kind | Depends | Surface-specific measures |
|---|---|---|---|---|---|
| **S1 tokens + data-mode** | `styles/tokens/_shell.scss` (new), `styles/tokens/index.scss`, `pages/components/Navbar.tsx` (one effect) | ~50 lines | fast | — | `html[data-mode]` flips with the switch and on reload; zero computed-style change on a 60-element sample per surface (tokens not consumed yet); `--shell-*` resolve on the six roots and are empty on `.react-flow` |
| **S2 topbar** | `pages/components/navbar.scss` (non-menu blocks), `Navbar.tsx` only if a class is missing | ~60 | full | S1; after `tpl-e`/`tpl-int` merge | appbar rect 1600x50; mode-switch opt 24 px tall, switch rect unchanged; badge 11 px; radii 4/8; weights <= 600 |
| **S3 status bar** | `components/StatusBar.scss`, `components/StatusBarRightZone.scss` | ~40 | fast | S1 | footer Inter on 5/5; version 11 px; jjodie and bell 24x24, bar 32 px, A3; JjTL dark variant (`JjtlStatusBar.tsx:7`) unchanged |
| **S4 editor chrome** | `components/editor-v2/EditorV2.scss` (E:219-1579 only) | ~90 | full | S1 | toolbar 40 px, palette 200 px wide; group label 11 px; palette tint #f8fafc; muted icons in Advanced only; `.toolbar-btn` outside the editor (Catalog, Console) unchanged |
| **S5 menus** | `EditorV2.scss` (E:3978-4133), `pages/components/navbar.scss` (menu block), `components/contextMenu/ContextMenu.scss` if it paints | ~50 | full | S2, S4 | File menu radius 8, 1 px border, one shadow; item 36 px Basic, 28 px Advanced; canvas context menu same; legacy dark menu decided by measure |
| **S6 rail surfaces** | `editors/properties-with-tree-view.scss`, `editors/info-improvements.scss`, `ui/JjSelect/JjSelect.tsx` (`classNamePrefix`), `ui/InfoTooltip/InfoTooltip.scss` (rail-scoped only if it can be; else PWT override) | ~120 | full | S1 | rail on #f8fafc, fields white; borders 1 px; radii 4/8; no `css-*-control` selector; weights <= 600; text >= 11 px; an authoring panel in the rail unchanged in geometry |
| **S7 rail titles** | `editors/Info.tsx`, `editors/PropertiesWithTreeView.tsx`, `editors/NodeEditor.tsx`, PWT (rail override of `.tree-section__label`, `.props-section__title`, `.properties-node-section__label`, `.jj-flags__title`), `docs/demo/models_2026_simulator_demo.md` | ~60 | full | S6; §8 A1 | titles sentence case, 12/500, no tracking; left palette label still uppercase; `b.me-2` replaced by a class |
| **S8 rail targets and density** | `TreeViewSidebar/tree-view-sidebar.scss` (only under the rail scope, else PWT), PWT, `ui/Toggle/Toggle.module.css` | ~50 | full | S7; §8 A2 | tree row 26 Basic / 24 Advanced; toggles 24x24; actions 24x24; focusbar 24; `toggleXs` hit by `elementFromPoint`; muted action icons in Advanced, type icons coloured |

**Parallelism.** After S1: S2, S3, S4 and S6 touch disjoint files and can run together (S2 gated on the
tpl-* merges). S5 needs S2 and S4 (shares N and E). S6 -> S7 -> S8 are sequential (same sheets). S7 has five
files plus a doc; it stays at five code files only if the title overrides live in PWT and not in TVS/IMP.

## 5. Dependencies and risks

- **Token naming**: `--shell-text-2/3` alias tokens named tertiary/placeholder; a future rename of the
  `tokens/` roles changes the shell only through `_shell.scss`.
- **Body-level legacy mappings** (`styles/variables.scss` on `body`, R-RAIL-6, D-UI-10) beat `:root` on
  shared names; `--shell-*` share no name with them.
- **One-frame mode flash** at boot (§3.3).
- **`tpl-e` merge order** for S2 and S5.
- **Source-text tests** on N, TVS and E (§3.8).

## 6. Decisions taken (unattended)

Taken by this lane under RC-21/RC-25 for the Phase 2 plan, each `provisional, unattended`:
1. Shell tokens on a selector list of the six surface roots, not on `:root` and not on a new wrapper (§3.2).
2. `data-mode` on `document.documentElement`, written by Navbar from Redux `advanced` (§3.3).
3. Shell tokens are aliases of existing tokens; the only literals are 24 px, the two density heights and the
   menu shadow (§3.2).
4. Hit areas by explicit size plus negative margin (rect-measurable), `::before` only for `toggleXs` (§3.6).
5. React-select styled through an additive `classNamePrefix="jj-select"`, never through `buildStyles` (§3.5).
6. Right-rail section titles fixed in source plus rail-scoped CSS; `.props-header__kind` badge stays uppercase.
7. No migration of `--spacing-*` and no removal of never-read tokens in this front.

## 7. Open questions (non-gating)

- Which `.context-menu` rule paints on the canvas context menu and on the legacy MetamodelTab menu: S5
  measures it first.
- Whether `docs/redesign/rail/README.md:25` is updated by S7 or left as a historical spec.
  Recommended: leave it, add a one-line note in S7's log entry.

## 8. Decisions awaiting Alfonso (RC-26)

- **A1, MODELS demo**: sentence case changes a label the demo script quotes (`SEMANTIC TYPE CLASS`,
  `docs/demo/models_2026_simulator_demo.md:20,35,109,501`; R-SIM row `docs/decisions.md:2526`).
  Recommended: approve; S7 rewrites those four lines to `Semantic type class` in its docs commit.
- **A2, R-RAIL-7** ("riga 26px", ratified) is amended by the 24 px tree row in Advanced, which Alfonso
  approved on 2026-10-19 in the chat. Recommended: record the amendment on R-RAIL-7 citing that approval, Basic stays 26.
- **A3, D-UI-11**: "Il **bordo esterno** del rail resta su `--border-subtle` ... non va unificato con gli
  hairline interni"; the target's "borders 1 px #e2e8f0 when neutral" unifies them, as the pilot did for both rails.
  Recommended: move both outer borders (palette right, rail left) to `--shell-border` together, keeping their coupling, and amend D-UI-11.
