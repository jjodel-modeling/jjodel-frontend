# Discovery: dark theme removal, Phase 1

Prompt: `docs/prompts/claude_2026-10-10_0910_prompt_dark_theme_removal.md` (P-2026-10-10-0910, chat C-2026-10-10-0910).
Branch `dark-theme-removal`, worktree `~/jjodel-w-nodark`, base `32ff5bf34`. Read-only: no source, test, style,
`docs/decisions.md` or `CLAUDE.md` was edited. Session `eb86616f-0b7d-441e-a184-857d0e767443`.

## 0. Answer in brief

- **The hypothesis holds only with one correction.** The dark sources can be deleted with no visible change in
  light and no data migration, but "collapse every branch to light" is ambiguous: today the app has **two light
  states**. A: no `localStorage.theme`, no `data-theme` attribute, the default. B: `localStorage.theme = 'light'`,
  attribute `light`. They differ in **23 custom properties on `:root`**, among them `--color-bg-primary`
  (A `#ffffff`, B `#f8fafc`), the border pair and every shadow (§3.1). Opening Settings > Appearance moves a user
  from A to B without a click (`AppearanceSettings.tsx:19-24`). The three probes that set a theme take their
  light crops in B; the smoke states seed none and run in A.
- **Recommendation (R1):** keep both light states as they are. The boot script keeps writing `data-theme="light"`
  when `'light'` is stored and ignores `'dark'`, so a stored `'dark'` opens in A. Nothing else writes the
  attribute. Converging A and B is D-UI-13 arcs 5 to 8, a visible change, not this lane's work.
- **The dark styles never paint in light.** The scan finds 228 outermost dark rule blocks in 91 style files,
  9016 lines. In the browser, **0 of the 2078 dark selector parts** in the loaded sheets match an element. That
  holds on the dashboard and on the four demo scenes, in A and B (§3.2).
- **No token goes undefined.** All 265 names in `_colors-dark.scss` exist in `_colors-light.scss`. Across every
  dark block, all 389 declared custom properties are also declared outside a dark context (§5).
- **No data migration.** None of the four demo projects' decompressed state contains a theme string. Positive
  control: `jsxString` and `className` are found. The Redux, model and view sources hold only homonyms
  (`formTheme`, `BoardTheme`). No VersionFixer step is needed (§4).
- **Exported symbols that go away**, all importers inside the perimeter, none breaking outside: `ThemeService`,
  `useTheme` and `Theme` (file deleted), `JjodelEvents.THEME_CHANGED`, and `DerivedPaletteVars.dark`, a required
  field (Rule 11). `setTheme` of `scripts/smoke/states.ts` keeps its signature and becomes light-only (§6).
- **Phase 2:** about 113 files, in six slices; details in §7.
  - S0, tests first: 1 new probe and 3 new vitest files, run red on the base.
  - S1, TS and HTML: 9 files edited, 1 deleted.
  - S2, token layer: 8 files edited, 1 deleted.
  - S3, component styles: 83 files, a mechanical deletion checked by a CSS diff of the build.
  - S4, existing tests: 3 files updated.
  - S5, docs: 4 files.

**Decisions awaiting Alfonso (RC-26)**
1. **Critical-zone edit.** `components/editor-v2/viewpoint/authoring/StructureGroups.scss:82-84` is a 3-line dark
   rule in a §3.1 directory. Deleting it needs a Layer Impact Report and an explicit go-ahead. The prompt's
   deletion approval does not cover a critical-zone edit.
   Recommended: go-ahead, with the Layer Impact Report (CSS only, no sync or D-L layer) in the Phase 2 prompt.

**Questions**
1. Do A and B stay two light states after the removal? R1 keeps them. Unifying them changes what the MODELS demo
   shows, so it is an RC-26 item of a separate lane.
   Recommended: keep both in this lane, and open the convergence as D-UI-13 arc 5.

## 1. Hypothesis and objective

Hypothesis being falsified: *the theme can be removed by deleting the dark sources and collapsing every branch to
light, with no visible change in light and no data migration.*

Objective: produce the inventory (A), the persisted-state answer (B), the token check (C), the list of exported
interfaces (D) and the Phase 2 plan (E), each with `file:line` and a verbatim quote.

Verdict: **holds with one amendment.** "Light" names two states (§3.1). The removal is invisible only if the
`data-theme="light"` path survives. The deletion of the dark sources and the absence of a migration are measured,
not assumed (§3.2, §4, §5).

## 2. Method and files read

Searches. Most used `git grep` with the exit status recorded, or `command grep` (BSD), with a positive control in
the same invocation (R-RAIL-28, R-RAIL-31). Patterns were quoted. One early search used `\b`, which `git grep -E`
on this machine does not honour. The positive control (`.light-theme`, known present) came back empty, so the
search was redone without `\b`. Every absence claim below cites its control.

Scratch instruments, gitignored under `frontend/scripts/smoke/_tmp_darkinv/`:

- `blocks.mjs`: brace-walking scanner over the 248 tracked `.scss`/`.css` files under `frontend/src`. It blanks
  comments first. A block is a rule whose prelude carries `[data-theme=dark]` (any quoting), `.theme-dark`,
  `.dark-theme` or `prefers-color-scheme: dark`. Cross-checked against a `git grep -l` of the same markers:
  95 files against 91. The four extra files carry the marker in comments only, or as the import of `index.scss`
  (§A.3).
- `names.mjs` and `darkonly.mjs`: custom-property names declared in dark contexts against all others (§5).
- `state.mjs`: decompresses the `state` field of the four demo exports with the app's own `async-lz-string` (§4).
- `regimes.ts` and `matches.ts`: Playwright probes run by
  `lane-run probe ~/jjodel-w-nodark <probe> --port 3094 --id P-2026-10-10-0910`. Logs are in
  `~/.jjodel-lanes/P-2026-10-10-0910/probe-regimes.log` and `probe-matches.log`. `colorScheme: 'light'`,
  1600×1000. No dark value is read (D-UI-15).

Files read (full paths under `/Users/alfonso/jjodel-w-nodark/`):

- **Rules and decisions:** `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/styles/CLAUDE.md`,
  `docs/decisions.md` (D-UI-10, D-UI-13, D-UI-15, D-UI-16, R-RAIL-28, R-RAIL-31, R-RAIL-44, RC-26),
  `docs/claude-code-log.md` (head), `docs/DESIGN-SYSTEM.md` (header).
- **Boot, theme service, settings:** `frontend/index.html`, `frontend/src/services/ThemeService.ts`,
  `frontend/src/pages/settings/AppearanceSettings.tsx`, `frontend/src/pages/settings/AdvancedSettings.tsx`,
  `frontend/src/components/GlobalDrawer/SettingsDrawerContent.tsx`,
  `frontend/src/components/settings/UnifiedSettingsModal/sections/AppearanceSection.tsx`,
  `frontend/src/components/settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` (40-60, 125-145),
  `frontend/src/pages/TokenPreview.tsx` (1-40), `frontend/src/events/registry.ts` (76-82).
- **Editor:** `frontend/src/components/editor-v2/EditorV2.tsx` (110, 960-966, 4405-4455, 4502-4506),
  `frontend/src/components/editor-v2/hooks/useCustomPaletteStyleSheet.ts`,
  `frontend/src/components/editor-v2/utils/derivePalette.ts` (40-120),
  `frontend/src/components/editor-v2/_themes.scss` (1-25, 335-365),
  `frontend/src/components/abstract/tabs/DocumentationTab.tsx` (1055-1066),
  `frontend/src/components/editors/EditorFullscreenModal.tsx` (29, 45, 310).
- **Tokens:** `frontend/src/styles/tokens/index.scss` (1-120), `frontend/src/styles/tokens/_colors-light.scss`
  (60-80), `frontend/src/styles/tokens/_colors-dark.scss` (1-12, 290-300), `frontend/src/styles/tokens/_shadows.scss`
  (1-70), `frontend/src/styles/tokens/_gradients.scss`, `frontend/src/styles/tokens.css` (1-60).
- **Selector contexts:** `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (768-790),
  `frontend/src/components/editors/node-editor-redesign.scss` (975-990),
  `frontend/src/components/editors/info-improvements.scss` (1360-1385),
  `frontend/src/components/forEndUser/FunctionComponent.scss` (335-350),
  `frontend/src/components/common/AIDisclaimer.scss` (20-35),
  `frontend/src/jjscript/components/ScriptBlock.scss` (555-575),
  `frontend/src/pages/components/navbar.scss` (1160-1175),
  `frontend/src/components/editors/EdgeMarkerEditorModal.scss` (700-712),
  `frontend/src/components/editors/views/data/viewoptions.scss` (410-422),
  `frontend/src/components/editors/properties-with-tree-view.scss` (1178-1190),
  `frontend/src/components/editor-v2/sim/SimRolesModal.scss` (355-368), `frontend/src/pages/settings.scss` (694-704).
- **Tests:** `frontend/src/components/abstract/tabs/__tests__/instanceManager10d.test.ts` (170-185),
  `frontend/src/components/abstract/tabs/__tests__/instanceManager10j.test.ts` (210-230),
  `frontend/src/common/libraries/__tests__/lastSaved.test.ts` (205-222),
  `frontend/src/components/TreeViewSidebar/__tests__/dataManagerSection.test.ts` (40-70), and the theme lines of
  `irInkOutside.test.ts`, `irSelectionRing.test.ts`, `lightThemeLegibility.test.ts`, `inheritanceStyle.test.ts`
  and `entityModelAmberDs1.test.ts`.
- **Harness:** `frontend/scripts/smoke/states.ts` (179-209, 480-580), `frontend/scripts/probe/console-errors-demo.ts`
  (1-60, 163-235, 465-535), `frontend/scripts/tsconfig.json`, `frontend/vitest.config.ts`,
  `frontend/scripts/lane-run.mjs` (probe usage, `GOVERNANCE` at :226).
- **Data:** `~/jjodel-demo-exports/scene_{1..4}_*.json`.

## 3. Findings

### 3.1 Two light states, measured (falsifies "collapse to light" as stated)

`frontend/index.html:13-21`:

```
  <script>
    // Restore theme from localStorage BEFORE React mounts to prevent FOUC
    (function() {
      var t = localStorage.getItem('theme');
      if (t === 'dark' || t === 'light') {
        document.documentElement.setAttribute('data-theme', t);
      }
    })();
  </script>
```

With nothing stored, no attribute is set. `styles/tokens.css:16` says so too: «with no `data-theme` set (the app's
own default)». The light tokens are declared on `:root, :root[data-theme="light"]` (`_colors-light.scss:75-76`,
`_shadows.scss:40-41`, `_gradients.scss:42-43`). `tokens.css` declares some of the same names on a bare `:root`
and loads later.

- **A (no attribute):** the bare selectors tie on specificity, and `tokens.css` wins by order.
- **B (attribute `light`):** the attribute selector outranks it, and `tokens/` wins.

This is D-UI-13's three-regime finding, still true for backgrounds, borders and shadows (arcs 5 to 8 open).

Probe `regimes.ts`, two fresh contexts: A has `attr=null stored=null`, B has `attr=light stored=light`. Each
computes 909 custom properties on `<html>` and 979 on `<body>`. Control PASS.

- **23 root names differ.** Excerpt, values verbatim from the log:

  | Name | A | B |
  |---|---|---|
  | `--color-bg-primary` | `#ffffff` | `#f8fafc` |
  | `--color-bg-secondary` | `#f8fafc` | `#ffffff` |
  | `--color-border-primary` | `#e2e8f0` | `#cbd5e1` |
  | `--color-border-secondary` | `#cbd5e1` | `#d1d9e3` |
  | `--shadow-sm` | `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)` | `0 1px 2px rgba(0, 0, 0, 0.05)` |

  The other 18 are the `--shadow-*` and `--smart-elevation-*` family, all following `--shadow-sm/md/lg/xl`.
- **24 body names differ:** the 23 above plus 8 legacy mappings that only exist on `<body>`: `--bg-1`, `--bg-2`,
  `--bg-3`, `--bg-disabled`, `--border-color`, `--btn-bg`, `--dock-bg`, `--dockpane-bg`.
- **Body background:** `rgb(255, 255, 255)` in A, `rgb(248, 250, 252)` in B.

Who lands in B:

- **Anyone who opened Settings > Appearance.** `pages/settings/AppearanceSettings.tsx:19-24` syncs on mount:

  ```
      const [theme, setThemeState] = useState<Theme>(() => {
          let theme: Theme = (localStorage.getItem('theme') as Theme | null) || 'light';
          let oldTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
          if (theme !== oldTheme) setTheme(theme, true);
          return theme;
      });
  ```

  On first mount for a user in A, `theme` is `'light'` and `oldTheme` is `null`, so it writes attribute and
  storage `'light'` (`:16-17`).
- **Every probe that calls `setTheme(page, 'light')`** (`scripts/smoke/states.ts:529-542`, through
  `ThemeService.set`). Those are `derived-notations-edges.ts:696`, `petri-ink-ports.ts:747` and
  `io-board-lane1.ts:282`.

The smoke states seed no theme, so they run in A. **The lanes' light references are B; a fresh user is A.**

Consequence for Phase 2: an implementation that drops the attribute entirely moves the B users. One that always
writes `light` moves every A user, the default. Either one changes the light picture. R1 keeps both: nobody's
light changes.

### 3.2 The dark styles are inert in light, measured in the browser

Probe `matches.ts` walks every rule of every readable stylesheet. It recurses into media rules, splits selector
lists, and counts `document.querySelectorAll` per dark selector part. The dark marker regex also catches
`.dark` as an ancestor, which covers the mixed lists of §A.3.

Targets: the dashboard and the four demo scenes. Each scene is imported from `scripts/probe/fixtures/`, which is
byte-identical to `~/jjodel-demo-exports/` (checked for PEST with `cmp`). The M1 is opened with
`DockManager.open2`, the route of `petri-ink-ports.ts:84-85`.

| Regime | Target | `.editor-v2` | Nodes | Dark selector parts | Matching | Light-keyed matching |
|---|---|---|---|---|---|---|
| A | dashboard | none | 0 | 2078 | **0** | 0 |
| A | PEST / Petri / ESM / FlowB | `theme-light` | 11 / 13 / 10 / 17 | 2078 | **0** | 1 |
| B | dashboard | none | 0 | 2078 | **0** | 6 |
| B | PEST / Petri / ESM / FlowB | `theme-light` | 11 / 13 / 10 / 17 | 2078 | **0** | 7 |

Control PASS on every target: dark parts seen, plain selectors matching (≥50), light-keyed selectors matching in
B and on the scenes, canvas rendered. One stylesheet per page is unreadable (`errors=1`). No selector failed to
evaluate (a re-run that records the failing selectors printed none), so it is a sheet whose `cssRules` throws.
The Google Fonts sheet of `index.html:11` is the only cross-origin one: inferred, not printed.

Two `@media (prefers-color-scheme: dark)` rules exist at runtime, `matchesNow=false` under the light emulation.

- **Ours:** `components/editors/info-improvements.scss:1365-1381` (`// Dark mode` /
  `@media (prefers-color-scheme: dark) {`). It targets `.props-custom-checkbox__indicator`. No source uses that
  class: `git grep -c -E "props-custom-checkbox" -- 'src/*.tsx' 'src/*.ts' 'src/*.js' 'src/*.jsx'` exits 1.
  Control `props-header` in the same pathspec: exit 0, `Info.tsx:10`. So it is inert even for an OS-dark user.
- **Third-party:** `[data-swal2-theme="auto"]` from sweetalert2. Not ours, out of scope.

### 3.3 `editor-v2-theme` is a dead key since 2026-03-10

`git grep -n -E "Item\(['\"]editor-v2-theme" -- src scripts index.html` exits 1. Control
`Item\(['\"]theme['\"]` on the same pathspec exits 0 with 7 lines (`index.html:16`, `AdvancedSettings.tsx:22,24,30`,
`AppearanceSettings.tsx:17,20`, `states.ts:556`). The key was removed by `3b94ec7fa` (2026-03-10, «Unify light/dark
theme management across entire app»), whose diff drops `localStorage.getItem('editor-v2-theme')` and
`localStorage.setItem('editor-v2-theme', theme)`. A stale value in a browser is read by nothing today, and nothing
after Phase 2.

## A. Inventory

### A.1 TypeScript, TSX, HTML: the app theme (chosen, stored, read)

| Place | Verbatim | Planned action |
|---|---|---|
| `frontend/index.html:16-18` | `if (t === 'dark' \|\| t === 'light') {` / `document.documentElement.setAttribute('data-theme', t);` | **Collapse:** set the attribute only for `'light'`; `'dark'` is ignored (R1). The key is not deleted (§4). |
| `src/services/ThemeService.ts:1-71` | `export const ThemeService = {` … `export function useTheme(): [Theme, (t: Theme) => void] {` | **Delete the file** (pre-approved). |
| `src/pages/settings/AppearanceSettings.tsx:2` | `import { ThemeService, useTheme } from '../../services/ThemeService';` | **Delete** the import. |
| `src/pages/settings/AppearanceSettings.tsx:4-24` | `type Theme = 'light' \| 'dark';` and the `setTheme` / `useState` init sync quoted in §3.1 | **Delete.** The init sync is what moves A to B today. |
| `src/pages/settings/AppearanceSettings.tsx:28-72` | `{/* Theme Selection */}` … `<i className="bi bi-moon" />` / `Dark` … `<div className="settings-divider" />` | **Delete** the Theme group, both radios and the divider. Keep the «Coming Soon» group and the component's export and props. |
| `src/components/editor-v2/EditorV2.tsx:110` | `import { useTheme } from '../../services/ThemeService';` | **Delete.** |
| `src/components/editor-v2/EditorV2.tsx:963-964` | `// Theme state — follows global ThemeService (synced with Navbar/Settings)` / `const [theme] = useTheme();` | **Delete.** |
| `src/components/editor-v2/EditorV2.tsx:4417-4418` | `fill={theme === 'dark' ? '#334155' : '#cbd5e1'}` / `fillOpacity={theme === 'dark' ? 0.6 : 0.55}` | **Collapse:** `fill="#cbd5e1"`, `fillOpacity={0.55}` (dot grid). |
| `src/components/editor-v2/EditorV2.tsx:4445-4449` | `if (node.type === 'classNode') return theme === 'dark' ? '#0ea5e9' : '#0284c7';` … `return theme === 'dark' ? '#334155' : '#e2e8f0';` | **Collapse** to the light literals: class `#0284c7`, enum `#7c3aed` (unchanged), package `#94a3b8`, object `#d97706`, default `#e2e8f0` (MiniMap). |
| `src/components/editor-v2/EditorV2.tsx:4504` | ``<div className={`editor-v2 theme-${theme} notation-${notation}…`` | **Collapse** to the literal `theme-light`. The class stays: 24 source lines key on it (`git grep -c -E 'theme-light'`, 6 files) (Rule 2). |
| `src/components/abstract/tabs/DocumentationTab.tsx:1062` | `theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs'}` | **Collapse:** `theme="vs"`. |
| `src/pages/TokenPreview.tsx:19-35` | `const [theme, setTheme] = useState<'light' \| 'dark'>('light');` … `document.documentElement.setAttribute('data-theme', newTheme);` … `{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}` | **Delete** the toggle (state, handler, button). The page is routed at `App.tsx:148` (`<Route path={'test-tokens'} …/>`) and is a second writer of `data-theme="dark"` today. |
| `src/components/editor-v2/hooks/useCustomPaletteStyleSheet.ts:30,32` | `const { light, dark, lightAbstract, lightEnum, lightPackage } = derivePaletteVars(p.seed);` / ``blocks.push(block(`${base}.theme-dark`, dark));`` | **Delete** the dark emission and `dark` from the destructuring. |
| `src/components/editor-v2/utils/derivePalette.ts:52-53, 88-102, 115` | `/** Root vars for `.theme-dark`. */` / `dark: Record<string, string>;` … `const dark: Record<string, string> = {` … `return { light, dark, lightAbstract, lightEnum, lightPackage };` | **Delete** the field and its computation: an exported interface change, Rule 11, §6. |
| `src/events/registry.ts:79-80` | `// Theme` / `THEME_CHANGED: 'jjodel:theme-changed',` | **Delete** (only user: `ThemeService`). |
| `src/pages/settings/AdvancedSettings.tsx:22-24, 30` | `const theme = localStorage.getItem('theme');` / `if (theme) localStorage.setItem('theme', theme);` / `theme: localStorage.getItem('theme'),` | **Keep.** It preserves a B user's `'light'` across «Clear data». A `'dark'` imported from a settings file is ignored at boot. |
| Mounts of `AppearanceSettings`: `components/GlobalDrawer/SettingsDrawerContent.tsx:16,29-30`, `pages/Settings.tsx:13,26-27` (route `App.tsx:157`), `components/settings/UnifiedSettingsModal/sections/AppearanceSection.tsx:7,28` (case `UnifiedSettingsModal.tsx:136-137`) | `{ id: 'appearance' as const, label: 'Appearance', icon: 'bi-palette' },` / `return <AppearanceSettings />;` | **Keep.** The three surfaces keep an Appearance section with the placeholder. Removing the section would change the exported `SettingsSection` union (`UnifiedSettingsModal.tsx:18`). |

Comment-only mentions, **kept** (Rule 8):

- `components/abstract/tabs/InstanceManagerTab.tsx:2738`: «Il tema vive su `html[data-theme]`».
- `components/editor-v2/Toolbar.tsx:1062`: «The theme lives on `html[data-theme]`».
- `jjform/palettes.ts:59`: «(`data-theme`, `data-density`)».
- `common/entityMeta.ts:8`, `viewpoint/authoring/SymbolPreview.tsx:6` and `viewpoint/ir/widgets/ChipInputWidget.tsx:20-21`.
  The last two sit in critical-zone directories.
- `viewpoint/derive/viewpointDerivation.ts:24,130,401-402,418`.

They describe a light attribute that still exists, or history.

### A.2 HTML outside `index.html`

`git grep -n -i -E "theme" -- 'frontend/test.html' 'frontend/public/*.html' 'frontend/index.html' …` exits 0. The
only app hit is `index.html:14-18`. `public/index.html:20` `<meta name="theme-color" content="#000000" />` is a
browser chrome colour (homonym, keep). `public/webjars/ace/1.3.3/**` are third-party Ace demos (keep).

### A.3 Styles: dark blocks

**Count:** 228 outermost dark blocks in 91 files, 9016 lines (scanner, comments blanked).

| Kind | Blocks |
|---|---|
| bare `[data-theme="dark"]` | 149 |
| `html[data-theme="dark"]` | 55 |
| `.theme-dark` (editor) | 12 |
| `:root[data-theme="dark"]` | 10 |
| `@media (prefers-color-scheme: dark)` | 1 |
| `.dark-theme, [data-theme="dark"]` | 1 |

The nested dark blocks (depth > 0) are 15:

- the 8 `&.theme-dark` palette blocks of `_color-schemes.scss`;
- the 3 `.editor-v2.theme-dark` blocks of `EditorV2.scss`;
- `SimRolesModal.scss:363-365`, `properties-with-tree-view.scss:1184-1186`, and the two in `viewoptions.scss`
  (421-516, 518-613).

All are deleted as blocks. The full per-block list, with verbatim selectors, is in the Appendix.

Largest by deleted lines:

| File | Blocks | Lines (of file) |
|---|---|---|
| `components/editors/Console/console-tab.scss` | 1 | 499/1899 |
| `styles/tokens/_colors-dark.scss` | 1 | 417/426, **delete file** |
| `components/abstract/tabs/DocumentationTab.scss` | 1 | 410/1827 |
| `components/editors/views/data/palette-data.scss` | 2 | 398/1836 |
| `components/TreeViewSidebar/tree-view-sidebar.scss` | 4 | 386/2034 |
| `components/project/project-editor.scss` | 1 | 369/1497 |
| `components/logger/logger.scss` | 2 | 282/1136 |
| `components/Jodie/JodieWindow.css` | 79 | 274/2903 |
| `pages/settings.scss` | 1 | 274/1162 |
| `components/editors/node-editor-redesign.scss` | 2 | 273/1058 |
| `pages/components/navbar.scss` | 10 | 273/2375 |

Theme machinery that is not a block:

- `components/editor-v2/_themes.scss:23-178`: `$editor-v2-theme-dark: (` … `);`, a 156-line SCSS map. **Delete** with
  its two emissions `.editor-v2.theme-dark {` (348-350) and `:root[data-theme="dark"] {` (362-364). Keep
  `$editor-v2-theme-light`, `.editor-v2.theme-light` and the bare `:root` emission (D-UI-10).
- `styles/tokens/index.scss:31-32`: `/* 2. Colors - Dark theme (overrides when [data-theme="dark"]) */` /
  `@import './colors-dark';`. **Delete.** `_colors-dark.scss` declares no SCSS variable, mixin or function:
  `command grep -c -E '^\s*\$[a-zA-Z_-]+\s*:'` gives 0, exit 1; the control on `_colors-light.scss` gives 4 lines,
  exit 0. Nothing downstream of the import depends on it. The header lines 18-20 («Theme switching: Add
  [data-theme="dark"] …») are **deleted** with it.
- The other token-layer dark blocks: `_shadows.scss:13`, `_gradients.scss:70`, and `_form-palettes.scss:59, 85, 118`
  (`:root[data-theme="dark"] .instance-manager[data-palette="paper"|"ink"|"mist"] {`). **Delete.** The light
  definitions of the palettes are untouched.

Mixed selector lists, 7, all in `pages/components/navbar.scss`: 1165, 1279, 1355, 1473, 1478, 1509 and 1518.
Example `[data-theme="dark"] .debug-toggle,` / `.dark .debug-toggle {`.

- The `.dark` half matches nothing at runtime (§3.2: `.dark` ancestors are in the regex, 0 matches).
- Its only producers are leaf elements: `CommandBar.tsx:28,48` (`${props.theme ? props.theme : 'light'}` on an
  `<i>` / `<div>`), `Widgets.tsx:61` (`<hr>`) and `AllProjects.tsx:107` (`<button className={'dark'}>`). None
  has a `.debug-toggle`, `.mode-toggle-btn`, `.layout-btn` or `.keystroke-pill` descendant.
- **Delete the whole rule.**

`components/editors/EdgeMarkerEditorModal.scss:706-707`: `.dark-theme,` / `[data-theme="dark"] {`. No code writes
`dark-theme`: `git grep -n -E "dark-theme|light-theme" -- 'src/*.ts' 'src/*.tsx'` exits 1, control `jj-empty-state`
exits 0. **Delete.**

Light-keyed rules, **kept** (they are light):

- `styles/tokens/_colors-light.scss:75`, `_gradients.scss:42`, `_shadows.scss:40` (`:root, :root[data-theme="light"]`).
- `components/common/AIDisclaimer.scss:26-27` (`.light-theme &,` / `[data-theme="light"] & {`, B only).
- `jjscript/components/ScriptBlock.scss:563` (`[data-theme="light"] {`, an empty rule).

Two light-keyed preludes sit **inside** dark blocks and go with them:

- `tree-view-sidebar.scss:775` (`body:not([data-theme="light"]) {` in `html[data-theme="dark"] {` at 774);
- `node-editor-redesign.scss:981` (`:root:not([data-theme="light"]) {` in `html[data-theme="dark"] {` at 980).

The chooser's own styles, `pages/settings.scss:396-487` (the `// THEME OPTIONS (Appearance Section)` header,
`.theme-options`, `.theme-option`, `.theme-preview`, `.theme-preview-light`, `.theme-preview-dark`,
`.theme-label`, and the `.preview-*` rules nested in them) and `:700-702`, lose their only consumer with A.1. **Delete** in the same slice; they are provably unused, not "apparently" (Rule 9). Lines 1029 and 1041 sit
inside the dark block at 888 and go with it.

### A.4 Homonyms, out of scope (keep)

- `Btn`/`CommandBar` `theme={'dark'}` and the `.dark` classes of `commandbar.scss`, `widgets.scss`, `cards.scss`,
  `dashboard.scss:239,251`, `ContextMenu.scss:203`, `tooltip.scss:75`, `variables.scss:96`: button and widget
  styles.
- `components/envgen/types.ts:196,272` and `envgen/services/EnvGenPersistence.ts:82`: generated environments.
- `components/editor-v2/sim/simBoardDevices.tsx:317` (`'dark'` lamp label), `simBoardFace.ts`, `SimBoardEditor.tsx`,
  and `model/simulation/boardCodec.ts:142` (`BoardTheme`, front-panel themes, D-UI-16).
- `jjform/themes.ts` / `view/viewElement/view.tsx:251` `formTheme` (form layout presets) and `jjform/palettes.ts`
  `Ink`.
- `components/StatusBarRightZone.tsx:21,55` `variant: 'light' | 'dark'` (JjTL status bar), `JsonViewer.tsx:36`,
  `MarkdownRenderer.tsx:10` (`oneDark` code style), `forEndUser/Tooltip.tsx:299`, `Notes.tsx:43`, `Cards.tsx:29,40`,
  `Icons.tsx:80`.
- `EditorFullscreenModal.tsx:29` `theme?: 'vs' | 'vs-dark'`: a Monaco prop, default `'vs'`. None of its 7 callers
  passes it.
- Words: «darker», `valueRenderer.ts:49-53` CSS colour names, `redux/defaults/views.ts:81-89` comments.

### A.5 Tests

| Test | What it does with the theme | Planned action |
|---|---|---|
| `src/styles/__tests__/entityModelAmberDs1.test.ts:25,36,129-130,146` | reads `_colors-dark.scss`; a `'scuro'` row in `THEMES`; a floor assertion on `DARK_RULES` | **Trim** to the light row (the file is deleted). |
| `src/components/editor-v2/nodes/__tests__/irInkOutside.test.ts:215-264` | `tokenMap('dark')` reads `_colors-dark.scss`; `const THEMES = ['light', 'dark'] as const;` drives 4 `describe` loops | **Trim** to light. |
| `src/components/abstract/tabs/__tests__/instanceManager10d.test.ts:175` | `expect(SHADOWS.match(/--shadow-desk-card:/g)?.length).toBe(2);` counts the dark and light declarations in `_shadows.scss` | **Change to 1.** It would turn red on the deletion. |
| `src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts:140-141` | `<html data-theme="light">` … `<div class="editor-v2 theme-light" …>` | **Keep** (light, B). |
| `src/components/editor-v2/__tests__/lightThemeLegibility.test.ts:22-28` | `themeMap(which: 'light' \| 'dark')`, called only with `'light'` | **Keep.** It reads the light map, which survives. |
| `src/components/editor-v2/edges/__tests__/inheritanceStyle.test.ts:26-27` | `themeMap` declared, never called | **Keep** (Rule 9). |
| `src/components/abstract/tabs/__tests__/instanceManager10j.test.ts:219-226` | a comment names `[data-theme="dark"] .jj-empty-state__…` as the reason for a doubled class; the assertions are on light text | **Keep.** The selector stays (Rule 2). |
| `src/common/libraries/__tests__/lastSaved.test.ts:209-214`, `dataManagerSection.test.ts:48`, `instanceManager10e/f/k`, `instanceManagerIconInherit`, `dataManagerPicker` | read style files that carry dark blocks; assertions on light rules | **Keep;** re-run in Phase 2. |

### A.6 Harness

- `scripts/smoke/states.ts:487-576`: `export async function setTheme(page: Page, theme: 'light' | 'dark')`. It
  imports `/src/services/ThemeService.ts` by URL (`:542`) and polls attribute, storage and `.editor-v2.theme-<t>`.
  **Change** to a light-only shim with the same signature. `'light'` writes attribute and storage `'light'` (state
  B, as today) and keeps the editor check. `'dark'` returns `{ ok: false, error: 'no dark theme (D-UI-15)' }`.
  `states.ts` is under `typecheck:scripts` (`scripts/tsconfig.json` includes `smoke/**/*.ts`).
- Callers:
  - `probe/derived-notations-edges.ts:696`: light, works unchanged.
  - `probe/petri-ink-ports.ts:716-718, 747, 754-760, 806-812`: light and dark passes.
  - `probe/io-board-lane1.ts:281-289`: a light and dark loop.

  These probes are archival lane instruments outside `typecheck:scripts` (`probe/**` is not included). **Keep
  them unchanged.** Re-run, their dark passes fail with the shim's error, which is honest.
- `probe/console-errors-demo.ts:238` reads `data-theme` into its output. **Keep.**
- **No tracked or untracked script under `frontend/scripts/` writes `localStorage.theme` itself.**
  `command grep -rn -E "theme" --include='*.ts' --include='*.mjs' --include='*.js' --include='*.json'` (BSD,
  ignores no file) found only the lines above. No `_tmp_` probe existed in this worktree before this lane.

### A.7 Docs inside `frontend/src`

- `styles/tokens/README.md:15,47-49,265-272` («Both light and dark themes are defined. Simply change the
  `data-theme` attribute»).
- `components/ResizeHandle/README.md:142` («Dark mode support via `prefers-color-scheme`»).
- `styles/CLAUDE.md:27` («`_colors-dark.scss` is inert legacy, awaiting a removal lane; do not edit it»), which
  becomes false. Its `AGENTS.md` (`frontend/src/styles/AGENTS.md:29`) is regenerated, never hand-edited (rule 1c).

**Update** all of them in the docs slice. D-UI-15: no document describes a dark theme as a feature.

## 4. B. Persisted state

A returning user after R1:

- **`localStorage.theme = 'dark'`:** the boot script ignores it, so no attribute and state A from the first
  paint. No code switches the theme later: the only writer left is the `'light'` branch of the boot script. No
  flash: nothing changes after the first paint, and no dark rule exists to paint. No error: nothing parses the
  value. The key stays in storage, unread. `AdvancedSettings` would carry it through «Clear data» and export,
  harmless.
- **`editor-v2-theme = 'dark'`:** read by nothing since `3b94ec7fa` (§3.3), today and after.
- **`localStorage.theme = 'light'`:** state B, as today.

Project data stores no app theme:

- **Demo projects.** The `state` field of the four exports was decompressed with `async-lz-string`, the
  library of `common/U.tsx:43,427`. 133068 to 181172 characters each. Counts: `data-theme` 0, `theme-dark` 0,
  `theme-light` 0, `"theme"` 0, `formTheme` 0, `vs-dark` 0, `dark` (any case) 0. Control: `jsxString` 2 and
  `className` 119 to 167 per scene.
- **The top level of the export** (`DProject` fields) has no theme field: keys listed, `layout*`, `megamodel` and
  others, none themed.
- **Sources.** `git grep -n -i -E "theme" -- 'redux/*' 'model/*' 'joiner/*' 'api/*' 'view/*' 'common/*' 'utils/*'`
  exits 0 with homonyms only: `formTheme` (`view.tsx:226-251`), `BoardTheme` (`boardCodec.ts:141-151`), comments
  in `error.scss` and `jqui-types.ts`. `redux/` has no hit. The same full `data-theme` sweep that found 115 files
  has no hit in `DV.tsx`, `defaultViewTemplate.ts`, `VersionFixer.tsx` or `redux/defaults/`.

**No VersionFixer step is needed;** nothing is parked.

## 5. C. Tokens

- `_colors-dark.scss` declares 265 names and `_colors-light.scss` 278. **Names in the dark file only: 0.** Control:
  the light file has 13 names the dark one lacks (`--color-bg-active`, `--color-interactive-*` ×4,
  `--color-{error,success,warning,info}-bg`, `--gradient-{card,sidebar,panel,hover}`), so the comparison has
  signal.
- Over every dark block in every style file, including the `_themes.scss` maps and custom properties written by
  TS: **389 names declared in a dark context, 389 also declared outside one, 0 dark-only.** Control: 545 names are
  declared outside dark only; `--color-bg-active` reads `inDark=false outDark=true` and `--color-bg-primary` reads
  `true true`.
- So **no `var()` loses its definition** in light, and every light value is untouched by construction: a deleted
  dark block matches nothing in light (§3.2), and a non-matching rule cannot shift the cascade of the others.

## 6. D. Exported interfaces

| Symbol | Change | Importers | Outside the perimeter? |
|---|---|---|---|
| `services/ThemeService.ts`: `export type Theme`, `export const ThemeService`, `export function useTheme` | gone with the file | `EditorV2.tsx:110` (`useTheme`), `AppearanceSettings.tsx:2` (`ThemeService, useTheme`), `scripts/smoke/states.ts:542` (dynamic import by URL) | no |
| `events/registry.ts` `JjodelEvents.THEME_CHANGED` | key removed | `ThemeService.ts:35,62,63` only (`git grep -n -E "THEME_CHANGED"`, exit 0, 6 lines, the rest comments) | no |
| `editor-v2/utils/derivePalette.ts` `DerivedPaletteVars.dark` (required) | field removed (Rule 11: the Phase 2 prompt names it) | `hooks/useCustomPaletteStyleSheet.ts:30` only; no test imports `derivePaletteVars` | no |
| `scripts/smoke/states.ts` `setTheme`, `ThemeResult` | same signature, light-only behaviour | `probe/derived-notations-edges.ts`, `probe/petri-ink-ports.ts`, `probe/io-board-lane1.ts` | no (harness) |
| CSS API: class `.theme-dark` on `.editor-v2`, attribute value `data-theme="dark"` | never emitted | the dark blocks themselves | no |
| `AppearanceSettings` (props `onDirtyChange`), `TokenPreview`, `EditorFullscreenModal` props, `SettingsSection` unions | **unchanged** | | |

**No interface breaks outside the perimeter. No RC-26 item from D.**

## 7. E. Phase 2 plan

Order: S0, then S1 to S4 as code commits, then S5 as docs. One commit per slice; docs never with code (P13). Over
5 files, so rule 19: this section is the list.

**S0. Tests and the before-probe, on the base, before any code change.**

1. New `frontend/scripts/probe/dark-theme-removal.ts`, tracked, built from the two scratch probes. For each of the
   dashboard and the four scenes, and for each seed (none = A, `'light'` = B, `'dark'`), it dumps:
   - the root and body custom properties;
   - `.editor-v2` classes;
   - computed `color`, `background-color`, `border-*-color`, `box-shadow`, `fill`, `stroke` and `opacity` of every
     `.react-flow__node` subtree element and of the chrome landmarks (app bar, toolbar, dock tabs, tree, rail);
   - `.react-flow__minimap-node` fills and the dot-grid circle `fill`/`fill-opacity`;
   - the rule walk (dark selector parts, matches);
   - `data-theme`.

   Run it on the base into `before.json` (gitignored). Its assertions go **red on the base** by design: the
   rule-walk count of dark selector parts is 2078, not 0, and the `'dark'` seed yields `data-theme="dark"`.
2. Vitest, executing the subject (P11):
   - **(a)** `src/__tests__/bootTheme.test.ts` extracts the inline script of `index.html` and runs it in a `vm`
     context with a fake `localStorage` and `documentElement`. Stored `'dark'` sets no attribute; `'light'` sets
     `light`; none sets none. Red on the base for `'dark'`.
   - **(b)** `src/pages/settings/__tests__/appearanceNoTheme.test.ts` renders `AppearanceSettings` with
     `renderToString`: no `input[name="theme"]`, no «Dark» label, no write to `localStorage.theme`. Red on the
     base. It needs `localStorage`/`document` stubs only for the base run.
   - **(c)** `derivePaletteVars('#0ea5e9')` has no `dark` key, and its `light`/`light*` output equals a literal
     snapshot taken on the base.
   - Mutation bench: put the `'dark'` branch back in the boot script, then the radio, then the dark emission; each
     must turn its test red.

**S1. Code, TS and HTML** (9 edited, 1 deleted): `index.html`, `AppearanceSettings.tsx`, `EditorV2.tsx`,
`DocumentationTab.tsx`, `TokenPreview.tsx`, `useCustomPaletteStyleSheet.ts`, `derivePalette.ts`, `registry.ts`,
`scripts/smoke/states.ts`; delete `services/ThemeService.ts`.

**S2. Code, token layer** (8 edited, 1 deleted): `tokens/index.scss`, `_shadows.scss`, `_gradients.scss`,
`_form-palettes.scss`, `editor-v2/_themes.scss`, `editor-v2/_color-schemes.scss`, `editor-v2/EditorV2.scss`,
`pages/settings.scss` (the dark block plus the chooser CSS); delete `tokens/_colors-dark.scss`.

**S3. Code, component styles** (83 files: the Appendix's 91 minus the 8 of S2). Mechanical deletion of the listed ranges,
with any adjacent header comment that names the deleted block («// Dark mode», «DARK THEME VARIANT»).
`StructureGroups.scss:82-84` only after the critical-zone go-ahead; without it, S3 leaves that one rule and says
so.

Check of S2 and S3 together:
- the scanner reports 0 blocks;
- the CSS of `npm run build` (`dist/assets/*.css`), parsed into rules, equals the base build's rules minus the
  dark ones, compared rule by rule, order kept. That proves no light rule changed or moved.

**S4. Existing tests updated** with S1 to S3 (3 files): `entityModelAmberDs1.test.ts`, `irInkOutside.test.ts`,
`instanceManager10d.test.ts`. The new tests of S0 (`bootTheme.test.ts`, `appearanceNoTheme.test.ts`, a
`derivePalette` test) and the probe are committed with S1.

**S5. Docs** (4 files, separate commit): `styles/tokens/README.md`, `components/ResizeHandle/README.md`,
`frontend/src/styles/CLAUDE.md` §7.2, and `frontend/src/styles/AGENTS.md` regenerated by `npm run gen:agents`.

**Gates** (P7, CLAUDE.md §17), foreground, after each code slice and at the end:
- `npm run typecheck`: 14, the §17 set;
- `npm run typecheck:scripts`: exit 0;
- `npm run test`: the 9 known import reds only;
- `npm run build`: exit 0;
- `npm run check:scripts` (`states.ts` edited);
- `npm run check:docs` (inbox), `npm run check:agents` (S5);
- `npm run smoke`: GREEN;
- the probe after: A and B dumps byte-identical to `before.json`; the `'dark'` seed identical to A; dark parts 0.

**Visual checklist for the chat** (RC-23, light only, read from the DOM; fixtures are the four files of
`~/jjodel-demo-exports/`, imported as in `console-errors-demo.ts:163-171`):
1. Settings has no Dark radio. On `#/settings` > Appearance, in the drawer > Appearance and in the unified
   modal > Appearance: `document.querySelectorAll('input[name="theme"]').length === 0`, and no element with
   text «Dark».
2. A stored `'dark'` opens light. `localStorage.setItem('theme','dark')`, reload:
   `document.documentElement.getAttribute('data-theme') === null`,
   `getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)'`, every `.editor-v2` has
   `theme-light`.
3. The four demo scenes are byte-identical in light against the trunk, in A and in B: the probe's per-scene dumps
   equal `before.json`.
4. MiniMap colours: `.react-flow__minimap-node` fills are among `#0284c7`, `#7c3aed`, `#94a3b8`, `#d97706` and
   `#e2e8f0`, the same per node as before. The dot-grid circle reads `fill="#cbd5e1"`, `fill-opacity="0.55"`.
5. The Documentation tab's Monaco is `vs`: in edit mode, `.monaco-editor` carries class `vs`, not `vs-dark`.

## 8. Dependencies and risks

- **Hot files:**
  - `EditorV2.tsx` (7 lines), `JodieWindow.css` (79 blocks), `tree-view-sidebar.scss` and `navbar.scss` are in
    CLAUDE.md §2.5 active areas, or are often touched by other lanes. Run `lane-run status --all` before Phase 2.
    Every edit is a deletion, so a conflict resolves by keeping the other side's light change and dropping the
    dark block.
- **Critical zone:** `viewpoint/authoring/StructureGroups.scss` only (§0). No sync, D-layer, VersionFixer, DV or
  `defaultViewTemplate` file is touched.
- **Visibility:** R1 is invisible, by §3.2 and §5. The one behaviour change is that opening Settings no longer
  moves a user from A to B. From Phase 2 on, state B gains no new members.
- **Archival probes:** `petri-ink-ports.ts` and `io-board-lane1.ts` fail their dark passes if re-run (§A.6).
- **Method note:** one early `grep` wrote its output to `/tmp/x_unused`, against the prompt's scratch rule. The
  file was removed at once; nothing else used `/tmp`.

## 9. Open questions

1. States A and B (§3.1): keep both (R1, this lane) or converge?
   Recommended: keep both here; converge in D-UI-13 arc 5, which withdraws the colliding background, border and
   shadow names from `tokens.css` and moves A onto B's values, a visible change with its own RC-26 check.

## 10. Decisions taken (unattended)

1. R1: the boot script keeps `'light'` and ignores `'dark'`; the storage key is not deleted, so no persisted data
   is touched.
2. The three Appearance surfaces stay, with the placeholder only; the Theme group, its init sync and the chooser
   CSS are deleted.
3. `TokenPreview`'s toggle is deleted; the page stays at `/test-tokens`.
4. MiniMap, dot grid and Monaco collapse to their light literals; `.editor-v2` keeps the `theme-light` class.
5. `THEME_CHANGED` and `DerivedPaletteVars.dark` are removed (all importers inside the perimeter).
6. `setTheme` becomes a light-only shim with the same signature; the archival probes stay unchanged.
7. The navbar mixed lists are deleted whole; the OS-dark media block and the `.dark-theme` alternative are
   deleted.
8. Comments outside deleted blocks stay (Rule 8), except the `tokens/index.scss` header that teaches the switch.
9. `AdvancedSettings` keeps preserving `'theme'` (it keeps state B users in B).

## 11. Decisions awaiting Alfonso

1. Critical-zone go-ahead for `components/editor-v2/viewpoint/authoring/StructureGroups.scss:82-84`
   (`html[data-theme='dark'] .ir-structure-group__hidden {`), with the Layer Impact Report in the Phase 2 prompt.
   Recommended: yes.

## Appendix. The 228 dark blocks

Paths under `frontend/src/`. A range is the prelude line to the closing brace. Selectors are verbatim with
whitespace collapsed, cut at 160 characters. Depth is the brace depth of the block; 0 is top level.

| # | Range | Depth | Selector (verbatim, whitespace collapsed) | Action |
|---|---|---|---|---|
| 1 | `common/error.scss:408-413` | 0 | `html[data-theme="dark"] .error-badge-slick .error-badge-icon, html[data-theme="dark"] .error-indicator-only .error-badge-icon, [data-theme="dark"] .error-badge-` | delete |
| 2 | `common/error.scss:478-543` | 0 | `html[data-theme="dark"]` | delete |
| 3 | `common/error.scss:545-611` | 0 | `[data-theme="dark"]` | delete |
| 4 | `components/AdvancedModeTutorial/advanced-mode-tutorial.scss:284-375` | 0 | `[data-theme="dark"]` | delete |
| 5 | `components/BrowserWarningModal/browser-warning-modal.scss:172-226` | 0 | `html[data-theme="dark"]` | delete |
| 6 | `components/ComingSoonPlaceholder/coming-soon-placeholder.scss:62-67` | 0 | `[data-theme="dark"]` | delete |
| 7 | `components/EmptyDashboard/empty-dashboard.scss:88-93` | 0 | `[data-theme="dark"]` | delete |
| 8 | `components/ErrorModal/error-modal.scss:307-425` | 0 | `html[data-theme="dark"]` | delete |
| 9 | `components/ErrorModal/syntax-error-modal.scss:503-633` | 0 | `html[data-theme="dark"]` | delete |
| 10 | `components/FeaturesPalette/features-palette.scss:255-333` | 0 | `html[data-theme="dark"]` | delete |
| 11 | `components/FeaturesPalette/features-palette.scss:336-414` | 0 | `[data-theme="dark"]` | delete |
| 12 | `components/GlobalDrawer/GlobalDrawer.scss:200-261` | 0 | `html[data-theme="dark"]` | delete |
| 13 | `components/Jodie/ChatInput.scss:270-331` | 0 | `[data-theme="dark"]` | delete |
| 14 | `components/Jodie/ChatInput.scss:425-453` | 0 | `[data-theme="dark"]` | delete |
| 15 | `components/Jodie/JodieWindow.css:294-296` | 0 | `[data-theme="dark"] .jodie-alive-dot--idle` | delete |
| 16 | `components/Jodie/JodieWindow.css:369-372` | 0 | `[data-theme="dark"] .jodie-metamodel-indicator` | delete |
| 17 | `components/Jodie/JodieWindow.css:374-376` | 0 | `[data-theme="dark"] .jodie-metamodel-count` | delete |
| 18 | `components/Jodie/JodieWindow.css:378-381` | 0 | `[data-theme="dark"] .jodie-metamodel-indicator.jodie-metamodel-warning` | delete |
| 19 | `components/Jodie/JodieWindow.css:383-386` | 0 | `[data-theme="dark"] .jodie-metamodel-indicator.jodie-metamodel-inactive` | delete |
| 20 | `components/Jodie/JodieWindow.css:1106-1109` | 0 | `[data-theme="dark"] .jodie-window` | delete |
| 21 | `components/Jodie/JodieWindow.css:1111-1114` | 0 | `[data-theme="dark"] .jodie-header` | delete |
| 22 | `components/Jodie/JodieWindow.css:1116-1118` | 0 | `[data-theme="dark"] .jodie-name` | delete |
| 23 | `components/Jodie/JodieWindow.css:1120-1122` | 0 | `[data-theme="dark"] .jodie-header-btn` | delete |
| 24 | `components/Jodie/JodieWindow.css:1124-1127` | 0 | `[data-theme="dark"] .jodie-header-btn:hover` | delete |
| 25 | `components/Jodie/JodieWindow.css:1129-1131` | 0 | `[data-theme="dark"] .jodie-messages` | delete |
| 26 | `components/Jodie/JodieWindow.css:1133-1136` | 0 | `[data-theme="dark"] .jodie-message-assistant .jodie-message-bubble` | delete |
| 27 | `components/Jodie/JodieWindow.css:1138-1140` | 0 | `[data-theme="dark"] .jodie-welcome` | delete |
| 28 | `components/Jodie/JodieWindow.css:1142-1145` | 0 | `[data-theme="dark"] .jodie-welcome-icon` | delete |
| 29 | `components/Jodie/JodieWindow.css:1147-1149` | 0 | `[data-theme="dark"] .jodie-welcome h3` | delete |
| 30 | `components/Jodie/JodieWindow.css:1151-1153` | 0 | `[data-theme="dark"] .jodie-welcome li` | delete |
| 31 | `components/Jodie/JodieWindow.css:1155-1157` | 0 | `[data-theme="dark"] .jodie-welcome li i` | delete |
| 32 | `components/Jodie/JodieWindow.css:1159-1162` | 0 | `[data-theme="dark"] .jodie-input-container` | delete |
| 33 | `components/Jodie/JodieWindow.css:1164-1168` | 0 | `[data-theme="dark"] .jodie-input` | delete |
| 34 | `components/Jodie/JodieWindow.css:1170-1172` | 0 | `[data-theme="dark"] .jodie-input::placeholder` | delete |
| 35 | `components/Jodie/JodieWindow.css:1174-1177` | 0 | `[data-theme="dark"] .jodie-input:focus` | delete |
| 36 | `components/Jodie/JodieWindow.css:1179-1182` | 0 | `[data-theme="dark"] .jodie-image-preview` | delete |
| 37 | `components/Jodie/JodieWindow.css:1184-1186` | 0 | `[data-theme="dark"] .jodie-image-preview:hover` | delete |
| 38 | `components/Jodie/JodieWindow.css:1188-1190` | 0 | `[data-theme="dark"] .jodie-image-remove` | delete |
| 39 | `components/Jodie/JodieWindow.css:1192-1194` | 0 | `[data-theme="dark"] .jodie-attach-btn` | delete |
| 40 | `components/Jodie/JodieWindow.css:1196-1199` | 0 | `[data-theme="dark"] .jodie-attach-btn:hover:not(:disabled)` | delete |
| 41 | `components/Jodie/JodieWindow.css:1201-1203` | 0 | `[data-theme="dark"] .jodie-attach-btn:disabled` | delete |
| 42 | `components/Jodie/JodieWindow.css:1205-1208` | 0 | `[data-theme="dark"] .jodie-minimized` | delete |
| 43 | `components/Jodie/JodieWindow.css:1210-1212` | 0 | `[data-theme="dark"] .jodie-confirm-dialog` | delete |
| 44 | `components/Jodie/JodieWindow.css:1214-1216` | 0 | `[data-theme="dark"] .jodie-confirm-header h3` | delete |
| 45 | `components/Jodie/JodieWindow.css:1218-1220` | 0 | `[data-theme="dark"] .jodie-confirm-dialog p` | delete |
| 46 | `components/Jodie/JodieWindow.css:1222-1225` | 0 | `[data-theme="dark"] .jodie-confirm-cancel` | delete |
| 47 | `components/Jodie/JodieWindow.css:1227-1229` | 0 | `[data-theme="dark"] .jodie-confirm-cancel:hover` | delete |
| 48 | `components/Jodie/JodieWindow.css:1256-1258` | 0 | `[data-theme="dark"] .jodie-message-image` | delete |
| 49 | `components/Jodie/JodieWindow.css:1401-1404` | 0 | `[data-theme="dark"] .jodie-document-preview` | delete |
| 50 | `components/Jodie/JodieWindow.css:1406-1408` | 0 | `[data-theme="dark"] .jodie-document-preview:hover` | delete |
| 51 | `components/Jodie/JodieWindow.css:1410-1412` | 0 | `[data-theme="dark"] .jodie-document-name` | delete |
| 52 | `components/Jodie/JodieWindow.css:1414-1416` | 0 | `[data-theme="dark"] .jodie-document-size` | delete |
| 53 | `components/Jodie/JodieWindow.css:1418-1420` | 0 | `[data-theme="dark"] .jodie-message-document` | delete |
| 54 | `components/Jodie/JodieWindow.css:1422-1424` | 0 | `[data-theme="dark"] .jodie-message-document .jodie-document-name` | delete |
| 55 | `components/Jodie/JodieWindow.css:1482-1485` | 0 | `[data-theme="dark"] .jodie-jjscript-avatar.jodie-jjscript-success` | delete |
| 56 | `components/Jodie/JodieWindow.css:1487-1490` | 0 | `[data-theme="dark"] .jodie-jjscript-avatar.jodie-jjscript-error` | delete |
| 57 | `components/Jodie/JodieWindow.css:1492-1495` | 0 | `[data-theme="dark"] .jodie-jjscript-bubble` | delete |
| 58 | `components/Jodie/JodieWindow.css:1497-1499` | 0 | `[data-theme="dark"] .jodie-jjscript-label-success` | delete |
| 59 | `components/Jodie/JodieWindow.css:1501-1503` | 0 | `[data-theme="dark"] .jodie-jjscript-label-error` | delete |
| 60 | `components/Jodie/JodieWindow.css:2164-2167` | 0 | `[data-theme="dark"] .jodie-executing-toolbar` | delete |
| 61 | `components/Jodie/JodieWindow.css:2169-2171` | 0 | `[data-theme="dark"] .jodie-executing-indicator` | delete |
| 62 | `components/Jodie/JodieWindow.css:2173-2175` | 0 | `[data-theme="dark"] .jodie-executing-command` | delete |
| 63 | `components/Jodie/JodieWindow.css:2220-2223` | 0 | `[data-theme="dark"] .jodie-mode-switch` | delete |
| 64 | `components/Jodie/JodieWindow.css:2225-2227` | 0 | `[data-theme="dark"] .jodie-mode-switch__opt` | delete |
| 65 | `components/Jodie/JodieWindow.css:2229-2231` | 0 | `[data-theme="dark"] .jodie-mode-switch__opt:hover` | delete |
| 66 | `components/Jodie/JodieWindow.css:2303-2306` | 0 | `[data-theme="dark"] .jodie-code-subrow` | delete |
| 67 | `components/Jodie/JodieWindow.css:2308-2311` | 0 | `[data-theme="dark"] .jodie-flavor-switch` | delete |
| 68 | `components/Jodie/JodieWindow.css:2313-2315` | 0 | `[data-theme="dark"] .jodie-flavor-switch__opt` | delete |
| 69 | `components/Jodie/JodieWindow.css:2317-2320` | 0 | `[data-theme="dark"] .jodie-flavor-switch__badge` | delete |
| 70 | `components/Jodie/JodieWindow.css:2322-2324` | 0 | `[data-theme="dark"] .jodie-code-scope` | delete |
| 71 | `components/Jodie/JodieWindow.css:2444-2447` | 0 | `[data-theme="dark"] .jodie-code-entry` | delete |
| 72 | `components/Jodie/JodieWindow.css:2449-2452` | 0 | `[data-theme="dark"] .jodie-code-entry--error` | delete |
| 73 | `components/Jodie/JodieWindow.css:2454-2456` | 0 | `[data-theme="dark"] .jodie-code-entry__input` | delete |
| 74 | `components/Jodie/JodieWindow.css:2458-2460` | 0 | `[data-theme="dark"] .jodie-code-entry__output` | delete |
| 75 | `components/Jodie/JodieWindow.css:2462-2464` | 0 | `[data-theme="dark"] .jodie-code-entry__output-row--error .jodie-code-entry__output` | delete |
| 76 | `components/Jodie/JodieWindow.css:2508-2511` | 0 | `[data-theme="dark"] .jodie-code-entry__warning` | delete |
| 77 | `components/Jodie/JodieWindow.css:2513-2515` | 0 | `[data-theme="dark"] .jodie-code-entry__warning i` | delete |
| 78 | `components/Jodie/JodieWindow.css:2517-2520` | 0 | `[data-theme="dark"] .jodie-code-entry__warning code` | delete |
| 79 | `components/Jodie/JodieWindow.css:2625-2627` | 0 | `[data-theme="dark"] .jodie-inspect-toggle` | delete |
| 80 | `components/Jodie/JodieWindow.css:2629-2631` | 0 | `[data-theme="dark"] .jodie-inspect-toggle:hover` | delete |
| 81 | `components/Jodie/JodieWindow.css:2633-2636` | 0 | `[data-theme="dark"] .jodie-inspector` | delete |
| 82 | `components/Jodie/JodieWindow.css:2638-2640` | 0 | `[data-theme="dark"] .jodie-inspector-key` | delete |
| 83 | `components/Jodie/JodieWindow.css:2642-2645` | 0 | `[data-theme="dark"] .jodie-inspector-value-string, [data-theme="dark"] .jodie-inspector-value-bool` | delete |
| 84 | `components/Jodie/JodieWindow.css:2647-2649` | 0 | `[data-theme="dark"] .jodie-inspector-value-number` | delete |
| 85 | `components/Jodie/JodieWindow.css:2651-2653` | 0 | `[data-theme="dark"] .jodie-inspector-value-null` | delete |
| 86 | `components/Jodie/JodieWindow.css:2655-2657` | 0 | `[data-theme="dark"] .jodie-inspector-value-expandable` | delete |
| 87 | `components/Jodie/JodieWindow.css:2659-2661` | 0 | `[data-theme="dark"] .jodie-inspector-value-expandable:hover` | delete |
| 88 | `components/Jodie/JodieWindow.css:2663-2665` | 0 | `[data-theme="dark"] .jodie-inspector-nested` | delete |
| 89 | `components/Jodie/JodieWindow.css:2708-2712` | 0 | `[data-theme="dark"] .jodie-promote-btn` | delete |
| 90 | `components/Jodie/JodieWindow.css:2714-2718` | 0 | `[data-theme="dark"] .jodie-promote-btn:hover` | delete |
| 91 | `components/Jodie/JodieWindow.css:2759-2762` | 0 | `[data-theme="dark"] .jodie-offer` | delete |
| 92 | `components/Jodie/JodieWindow.css:2764-2766` | 0 | `[data-theme="dark"] .jodie-offer__title` | delete |
| 93 | `components/Jodie/JodieWindow.css:2768-2771` | 0 | `[data-theme="dark"] .jodie-offer__preview` | delete |
| 94 | `components/LoadingScreen/project-loading-screen.scss:117-142` | 0 | `html[data-theme="dark"]` | delete |
| 95 | `components/M2AnalyticsModal/m2-analytics-modal.scss:592-772` | 0 | `[data-theme="dark"]` | delete |
| 96 | `components/ModeSystem/mode-system.scss:521-647` | 0 | `[data-theme="dark"]` | delete |
| 97 | `components/ResizeHandle/resizable-layout.example.scss:86-115` | 0 | `html[data-theme="dark"]` | delete |
| 98 | `components/ResizeHandle/resize-handle.scss:203-225` | 0 | `html[data-theme="dark"]` | delete |
| 99 | `components/ShortcutsReference/shortcuts-reference.scss:320-408` | 0 | `[data-theme="dark"]` | delete |
| 100 | `components/TreeViewSidebar/tree-view-sidebar.scss:594-771` | 0 | `[data-theme="dark"]` | delete |
| 101 | `components/TreeViewSidebar/tree-view-sidebar.scss:774-900` | 0 | `html[data-theme="dark"]` | delete |
| 102 | `components/TreeViewSidebar/tree-view-sidebar.scss:1689-1740` | 0 | `[data-theme="dark"]` | delete |
| 103 | `components/TreeViewSidebar/tree-view-sidebar.scss:2005-2033` | 0 | `[data-theme="dark"]` | delete |
| 104 | `components/abstract/style.scss:1225-1232` | 0 | `[data-theme="dark"] body[data-layout-mode="sidebar"]` | delete |
| 105 | `components/abstract/style.scss:1235-1237` | 0 | `[data-theme="dark"] .dock-divider` | delete |
| 106 | `components/abstract/style.scss:1239-1242` | 0 | `[data-theme="dark"] .dock-divider::after` | delete |
| 107 | `components/abstract/style.scss:1244-1247` | 0 | `[data-theme="dark"] .dock-divider:hover::after` | delete |
| 108 | `components/abstract/tabs/DocumentationTab.scss:1417-1826` | 0 | `[data-theme="dark"]` | delete |
| 109 | `components/common/ExportImportMenu.scss:121-151` | 0 | `[data-theme="dark"]` | delete |
| 110 | `components/common/ImportDropZone.scss:145-186` | 0 | `[data-theme="dark"]` | delete |
| 111 | `components/common/MarkdownRenderer.scss:493-538` | 0 | `[data-theme="dark"]` | delete |
| 112 | `components/common/ProviderSelector.scss:199-247` | 0 | `[data-theme="dark"]` | delete |
| 113 | `components/common/element-badge.scss:103-171` | 0 | `html[data-theme="dark"]` | delete |
| 114 | `components/dock/dock-tabs.scss:486-544` | 0 | `[data-theme="dark"]` | delete |
| 115 | `components/dock/tabs-overflow-menu.scss:95-122` | 0 | `[data-theme="dark"]` | delete |
| 116 | `components/editor-v2/EditorV2.scss:4260-4266` | 1 | `.editor-v2.theme-dark` | delete |
| 117 | `components/editor-v2/EditorV2.scss:4284-4295` | 1 | `.editor-v2.theme-dark` | delete |
| 118 | `components/editor-v2/EditorV2.scss:4316-4323` | 1 | `.editor-v2.theme-dark` | delete |
| 119 | `components/editor-v2/_color-schemes.scss:13-30` | 1 | `&.theme-dark` | delete |
| 120 | `components/editor-v2/_color-schemes.scss:59-73` | 1 | `&.theme-dark` | delete |
| 121 | `components/editor-v2/_color-schemes.scss:108-122` | 1 | `&.theme-dark` | delete |
| 122 | `components/editor-v2/_color-schemes.scss:157-171` | 1 | `&.theme-dark` | delete |
| 123 | `components/editor-v2/_color-schemes.scss:206-220` | 1 | `&.theme-dark` | delete |
| 124 | `components/editor-v2/_color-schemes.scss:255-269` | 1 | `&.theme-dark` | delete |
| 125 | `components/editor-v2/_color-schemes.scss:304-322` | 1 | `&.theme-dark` | delete |
| 126 | `components/editor-v2/_color-schemes.scss:349-372` | 1 | `&.theme-dark` | delete |
| 127 | `components/editor-v2/_themes.scss:348-350` | 0 | `.editor-v2.theme-dark` | delete |
| 128 | `components/editor-v2/_themes.scss:362-364` | 0 | `:root[data-theme="dark"]` | delete |
| 129 | `components/editor-v2/sim/SimRolesModal.scss:363-365` | 3 | `:root[data-theme="dark"] &` | delete |
| 130 | `components/editor-v2/viewpoint/authoring/StructureGroups.scss:82-84` | 0 | `html[data-theme='dark'] .ir-structure-group__hidden` | delete after critical-zone go-ahead |
| 131 | `components/editors/Console/console-tab.scss:1253-1751` | 0 | `html[data-theme="dark"]` | delete |
| 132 | `components/editors/EdgeMarkerEditorModal.scss:706-877` | 0 | `.dark-theme, [data-theme="dark"]` | delete |
| 133 | `components/editors/EditorFullscreenModal.scss:471-484` | 0 | `html[data-theme="dark"]` | delete |
| 134 | `components/editors/EditorFullscreenModal.scss:486-499` | 0 | `[data-theme="dark"]` | delete |
| 135 | `components/editors/EditorToolbar.scss:130-183` | 0 | `[data-theme="dark"]` | delete |
| 136 | `components/editors/InteractivePathCanvas.scss:161-195` | 0 | `html[data-theme="dark"]` | delete |
| 137 | `components/editors/empty.scss:124-164` | 0 | `[data-theme="dark"]` | delete |
| 138 | `components/editors/info-improvements.scss:656-855` | 0 | `html[data-theme="dark"]` | delete |
| 139 | `components/editors/info-improvements.scss:1366-1380` | 0 | `@media (prefers-color-scheme: dark)` | delete |
| 140 | `components/editors/info.scss:1033-1044` | 0 | `html[data-theme="dark"]` | delete |
| 141 | `components/editors/node-editor-redesign.scss:785-978` | 0 | `[data-theme="dark"]` | delete |
| 142 | `components/editors/node-editor-redesign.scss:980-1058` | 0 | `html[data-theme="dark"]` | delete |
| 143 | `components/editors/properties-with-tree-view.scss:1184-1186` | 2 | `[data-theme="dark"] &:not(.tree-viewpoint):not(.tree-leaf-view):not(.tree-view-vertex):not(.tree-view-row):not(.tree-view-edge):not(.tree-m1-icon)` | delete |
| 144 | `components/editors/properties-with-tree-view.scss:1322-1424` | 0 | `[data-theme="dark"]` | delete |
| 145 | `components/editors/properties-with-tree-view.scss:1567-1569` | 0 | `[data-theme="dark"] .properties-with-tree-view--floating` | delete |
| 146 | `components/editors/properties-with-tree-view.scss:1848-1873` | 0 | `[data-theme="dark"] .properties-with-tree-view--rail` | delete |
| 147 | `components/editors/properties-with-tree-view.scss:2056-2085` | 0 | `[data-theme="dark"] .properties-with-tree-view--rail .properties-fields` | delete |
| 148 | `components/editors/properties-with-tree-view.scss:2304-2323` | 0 | `[data-theme="dark"] .properties-with-tree-view--rail .properties-fields` | delete |
| 149 | `components/editors/properties-with-tree-view.scss:2325-2348` | 0 | `[data-theme="dark"] .properties-with-tree-view--rail-focus .properties-fields` | delete |
| 150 | `components/editors/properties-with-tree-view.scss:2417-2421` | 0 | `[data-theme="dark"] .properties-with-tree-view--rail .jj-disclosure` | delete |
| 151 | `components/editors/railSystem.scss:332-335` | 0 | `html[data-theme='dark'] .properties-with-tree-view--rail .properties-panel-container .view-editor-tab-content` | delete |
| 152 | `components/editors/views/data/palette-data.scss:1409-1724` | 0 | `[data-theme="dark"]` | delete |
| 153 | `components/editors/views/data/palette-data.scss:1726-1807` | 0 | `html[data-theme="dark"]` | delete |
| 154 | `components/editors/views/data/viewapplyto.scss:508-611` | 0 | `[data-theme="dark"] .apply-to-tab` | delete |
| 155 | `components/editors/views/data/viewapplyto.scss:726-728` | 0 | `[data-theme="dark"] .properties-tab.properties-panel .jjodel-select__multi-value` | delete |
| 156 | `components/editors/views/data/viewapplyto.scss:729-731` | 0 | `[data-theme="dark"] .properties-tab.properties-panel .jjodel-select__multi-value__label` | delete |
| 157 | `components/editors/views/data/viewapplyto.scss:732-734` | 0 | `[data-theme="dark"] .properties-tab.properties-panel .jjodel-select__multi-value__remove` | delete |
| 158 | `components/editors/views/data/viewoptions.scss:421-516` | 1 | `html[data-theme="dark"]` | delete |
| 159 | `components/editors/views/data/viewoptions.scss:518-613` | 1 | `[data-theme="dark"]` | delete |
| 160 | `components/envgen/EnvGenWizardModal.scss:806-952` | 0 | `html[data-theme="dark"]` | delete |
| 161 | `components/export/ExportImageMenu.scss:290-324` | 0 | `[data-theme="dark"]` | delete |
| 162 | `components/forEndUser/FunctionComponent.scss:278-338` | 0 | `[data-theme="dark"]` | delete |
| 163 | `components/forEndUser/FunctionComponent.scss:341-347` | 0 | `html[data-theme="dark"]` | delete |
| 164 | `components/forEndUser/tree.scss:213-277` | 0 | `html[data-theme="dark"]` | delete |
| 165 | `components/logger/logger.scss:853-996` | 0 | `html[data-theme="dark"]` | delete |
| 166 | `components/logger/logger.scss:998-1135` | 0 | `[data-theme="dark"]` | delete |
| 167 | `components/project/DocumentationSection.scss:99-136` | 0 | `[data-theme="dark"]` | delete |
| 168 | `components/project/project-editor.scss:1118-1486` | 0 | `html[data-theme="dark"]` | delete |
| 169 | `components/project/share-modal.scss:246-310` | 0 | `html[data-theme="dark"]` | delete |
| 170 | `components/project/unsaved-changes-dialog.scss:164-215` | 0 | `html[data-theme="dark"]` | delete |
| 171 | `components/settings/AISettingsContent.scss:430-608` | 0 | `[data-theme="dark"]` | delete |
| 172 | `components/settings/AISettingsContent.scss:872-925` | 0 | `[data-theme="dark"] .ai-settings-content` | delete |
| 173 | `components/settings/PromptEditor.scss:209-235` | 0 | `[data-theme="dark"]` | delete |
| 174 | `components/settings/PromptsSettingsSection.scss:191-218` | 0 | `[data-theme="dark"]` | delete |
| 175 | `components/ui/Checkbox/Checkbox.module.css:61-65` | 0 | `html[data-theme="dark"]` | delete |
| 176 | `components/ui/ColorPicker/ColorPicker.module.css:80-85` | 0 | `html[data-theme="dark"]` | delete |
| 177 | `components/ui/ConditionalEditor/ConditionalEditor.module.css:47-50` | 0 | `html[data-theme="dark"] .chip` | delete |
| 178 | `components/ui/ConditionalEditor/ConditionalEditor.module.css:234-237` | 0 | `html[data-theme="dark"] .ruleIconBtn, html[data-theme="dark"] .ruleWhen` | delete |
| 179 | `components/ui/ConditionalEditor/ConditionalEditor.module.css:239-241` | 0 | `html[data-theme="dark"] .ruleIconBtn:hover:not(:disabled)` | delete |
| 180 | `components/ui/ConditionalEditor/ConditionalEditor.module.css:243-246` | 0 | `html[data-theme="dark"] .ruleWhen` | delete |
| 181 | `components/ui/ConditionalEditor/ConditionalEditor.module.css:248-251` | 0 | `html[data-theme="dark"] .defaultNone, html[data-theme="dark"] .addRuleBtn` | delete |
| 182 | `components/ui/ConditionalEditor/ConditionalEditor.module.css:253-255` | 0 | `html[data-theme="dark"] .addRuleBtn` | delete |
| 183 | `components/ui/EmptyState/EmptyState.scss:92-129` | 0 | `[data-theme="dark"]` | delete |
| 184 | `components/ui/ErrorText/ErrorText.module.css:22-26` | 0 | `html[data-theme="dark"]` | delete |
| 185 | `components/ui/HelpText/HelpText.module.css:23-31` | 0 | `html[data-theme="dark"]` | delete |
| 186 | `components/ui/Input/Input.module.css:159-178` | 0 | `html[data-theme="dark"]` | delete |
| 187 | `components/ui/Label/Label.module.css:22-26` | 0 | `html[data-theme="dark"]` | delete |
| 188 | `components/ui/ListEditor/ListEditor.module.css:128-131` | 0 | `html[data-theme="dark"] .entry` | delete |
| 189 | `components/ui/ListEditor/ListEditor.module.css:133-135` | 0 | `html[data-theme="dark"] .entryHeader` | delete |
| 190 | `components/ui/ListEditor/ListEditor.module.css:137-139` | 0 | `html[data-theme="dark"] .iconBtn:hover:not(:disabled)` | delete |
| 191 | `components/ui/ListEditor/ListEditor.module.css:141-144` | 0 | `html[data-theme="dark"] .addBtn` | delete |
| 192 | `components/ui/VerticalToggle.scss:205-257` | 0 | `[data-theme="dark"]` | delete |
| 193 | `jjscript/components/ExecutionErrorDialog.scss:426-551` | 0 | `[data-theme="dark"]` | delete |
| 194 | `jjscript/components/JjScriptSuccessNotification.scss:204-292` | 0 | `html[data-theme="dark"]` | delete |
| 195 | `jjtl/components/GrammarDiagram/GrammarDiagram.scss:255-350` | 0 | `html[data-theme="dark"]` | delete |
| 196 | `jjtl/components/GrammarDiagram/GrammarDiagramModal.scss:367-451` | 0 | `html[data-theme="dark"]` | delete |
| 197 | `jjtl/views/GrammarTab.scss:336-421` | 0 | `html[data-theme="dark"]` | delete |
| 198 | `pages/account.scss:442-569` | 0 | `html[data-theme="dark"]` | delete |
| 199 | `pages/components/RightPanel/RightPanel.scss:119-143` | 0 | `[data-theme="dark"]` | delete |
| 200 | `pages/components/about/about-dialog.scss:195-264` | 0 | `html[data-theme="dark"]` | delete |
| 201 | `pages/components/bottomToolbar.scss:110-147` | 0 | `[data-theme="dark"] .bottom-toolbar` | delete |
| 202 | `pages/components/menu/menu.scss:369-400` | 0 | `:root[data-theme="dark"]` | delete |
| 203 | `pages/components/navbar.scss:1165-1205` | 0 | `[data-theme="dark"] .debug-toggle, .dark .debug-toggle` (mixed list, see A.3) | delete |
| 204 | `pages/components/navbar.scss:1279-1320` | 0 | `[data-theme="dark"] .mode-toggle-btn, .dark .mode-toggle-btn` (mixed list, see A.3) | delete |
| 205 | `pages/components/navbar.scss:1355-1364` | 0 | `[data-theme="dark"] .advanced-mode-badge, .dark .advanced-mode-badge` (mixed list, see A.3) | delete |
| 206 | `pages/components/navbar.scss:1473-1476` | 0 | `[data-theme="dark"] .navbar__layout-controls, .dark .navbar__layout-controls` (mixed list, see A.3) | delete |
| 207 | `pages/components/navbar.scss:1478-1495` | 0 | `[data-theme="dark"] .layout-btn, .dark .layout-btn` (mixed list, see A.3) | delete |
| 208 | `pages/components/navbar.scss:1509-1512` | 0 | `[data-theme="dark"] .navbar__divider, .dark .navbar__divider` (mixed list, see A.3) | delete |
| 209 | `pages/components/navbar.scss:1518-1523` | 0 | `[data-theme="dark"] .keystrokes .keystroke-pill, .dark .keystrokes .keystroke-pill` (mixed list, see A.3) | delete |
| 210 | `pages/components/navbar.scss:1704-1706` | 0 | `[data-theme="dark"] .appbar__sep` | delete |
| 211 | `pages/components/navbar.scss:2217-2342` | 0 | `[data-theme="dark"]` | delete |
| 212 | `pages/components/navbar.scss:2356-2374` | 0 | `:root[data-theme="dark"]` | delete |
| 213 | `pages/components/project-card.scss:1250-1285` | 0 | `[data-theme="dark"]` | delete |
| 214 | `pages/settings.scss:888-1161` | 0 | `[data-theme="dark"]` | delete |
| 215 | `pages/settings/ProviderConfigModal.scss:429-539` | 0 | `html[data-theme="dark"]` | delete |
| 216 | `styles/components/_form-system.scss:698-825` | 0 | `[data-theme="dark"]` | delete |
| 217 | `styles/components/_form-system.scss:827-839` | 0 | `html[data-theme="dark"]` | delete |
| 218 | `styles/components/_switch.scss:122-168` | 0 | `[data-theme="dark"]` | delete |
| 219 | `styles/diagram.scss:785-815` | 0 | `[data-theme="dark"]` | delete |
| 220 | `styles/forms.scss:350-410` | 0 | `html[data-theme="dark"]` | delete |
| 221 | `styles/style.scss:684-697` | 0 | `html[data-theme="dark"]` | delete |
| 222 | `styles/style.scss:699-712` | 0 | `[data-theme="dark"]` | delete |
| 223 | `styles/tokens/_colors-dark.scss:9-425` | 0 | `:root[data-theme="dark"]` | delete |
| 224 | `styles/tokens/_form-palettes.scss:59-69` | 0 | `:root[data-theme="dark"] .instance-manager[data-palette="paper"]` | delete |
| 225 | `styles/tokens/_form-palettes.scss:85-98` | 0 | `:root[data-theme="dark"] .instance-manager[data-palette="ink"]` | delete |
| 226 | `styles/tokens/_form-palettes.scss:118-128` | 0 | `:root[data-theme="dark"] .instance-manager[data-palette="mist"]` | delete |
| 227 | `styles/tokens/_gradients.scss:70-75` | 0 | `:root[data-theme="dark"]` | delete |
| 228 | `styles/tokens/_shadows.scss:13-33` | 0 | `:root[data-theme="dark"]` | delete |
