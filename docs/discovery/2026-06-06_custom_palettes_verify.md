# Phase 0 verify — User-created named canvas palettes

**Date**: 2026-06-06
**Branch**: `alfonso-frontend-jjtl`
**Mode**: READ-ONLY. No code modified.
**Git state**: of the 4 anchor files, only `EditorV2.tsx` carries uncommitted branch changes; `ColorSchemeSelector.tsx`, `types.ts`, `_color-schemes.scss` are clean vs HEAD (`b2dd853b2`). All anchors below verified against the **working tree**, not the discovery report.

---

## 1. Paths and current line anchors — all confirmed

### `frontend/src/components/editor-v2/components/ColorSchemeSelector.tsx` (197 lines)

- **`PALETTE_OPTIONS`** :30-36 — `Array<{ id: ColorScheme; name: string; swatches: string[] }>`, 4 hex per palette, swatch order documented `[class, abstract, enum, package]` (:19). Swatches are hand-picked representative hexes, NOT derived from the SCSS.
- **`MAIN_OPTIONS`** :22-28 — Default, Monochrome, High Contrast, Print (`{id, name, desc, icon}`), with a comment "pastel group handled separately".
- **`handleSelect`** :79-83 — `onColorSchemeChange(id)` + closes dropdown/submenu. Identical path for built-in modes and palettes; custom palettes can reuse it untouched.
- **`isPaletteActive`** :51 — `PALETTE_OPTIONS.some(o => o.id === colorScheme)`; drives the checkmark on the group row (class `has-active-child`).
- **Swatch rendering** :160-168 — `<span className="scheme-selector__swatch" style={{ backgroundColor: color }}>` inside `.scheme-selector__swatches`. Inline `backgroundColor` accepts `hsl()` strings, so derived swatches plug in directly.
- **Submenu construction** :103-105 + :136-173 — `topOptions = MAIN_OPTIONS.slice(0, 2)`, `bottomOptions = MAIN_OPTIONS.slice(2)`; the Palette group sits between them as a `div.scheme-selector__group-item` with hover-open (150 ms close delay, :86-101) `div.scheme-selector__submenu` listing `PALETTE_OPTIONS` as `button.scheme-selector__sub-option`. **A "Your palettes" section + mini-editor will live inside this same submenu container.**

### `frontend/src/components/editor-v2/EditorV2.tsx`

- **State + whitelist** :737-746 (matches the reported ~:738):
  ```typescript
  const VALID_SCHEMES: ColorScheme[] = ['default', 'monochrome', 'sapphire', 'amethyst', 'jade', 'terracotta', 'crimson', 'high-contrast', 'print'];
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
      const saved = localStorage.getItem('editor-v2-color-scheme');
      return VALID_SCHEMES.includes(saved as ColorScheme) ? (saved as ColorScheme) : 'default';
  });
  useEffect(() => { localStorage.setItem('editor-v2-color-scheme', colorScheme); }, [colorScheme]);
  ```
- **Root class** :3256 (exact current form):
  ```
  `editor-v2 theme-${theme} notation-${notation}${colorScheme !== 'default' ? ` scheme-${colorScheme}` : ''}${showEdgeLabels ? ' show-edge-labels' : ''}${showBackground ? '' : ' hide-background'}${highlightModeActive ? ' highlight-mode' : ''}`
  ```
  `scheme-custom-<id>` falls out of the existing template literal with zero changes. ✔

### `frontend/src/components/editor-v2/types.ts` (251 lines, read in full)

- `ColorScheme` union :5-14: `'default' | 'monochrome' | 'sapphire' | 'amethyst' | 'jade' | 'terracotta' | 'crimson' | 'high-contrast' | 'print'`. Adding `CustomColorScheme` / `ActiveColorScheme` alongside is purely additive.

### `frontend/src/components/editor-v2/_color-schemes.scss` (632 lines)

- All **13 var names from the derivation spec exist and are consumed**: `--class-header-bg`, `--class-abstract-header-bg`, `--enum-header-bg`, `--package-header-bg`, `--object-header-bg`, `--orphan-header-bg`, `--orphan-border-color`, `--node-header-text`, `--package-header-text`, `--stereotype-color`, `--field-type-color`, `--enum-accent`, `--package-accent`. Consumers verified in `EditorV2.scss` (`.mm-class/.mm-enum .mm-node__header` :1519/:1526/:1549, `.mm-node__tab` :1328/:1335, `.mm-object__header` :1601, `.mm-object--orphan` :1658-1665, header text :1228, stereotype :1264, field type :1742/:1812, accents :1557/:1562/:1584).
- Curated palette blocks use exactly the target shape `.editor-v2.scheme-<name> { &.theme-dark {…} &.theme-light {…} }` (3-class specificity). The injected blocks mirror it 1:1.
- **Dropdown class prefix** (:419-631): BEM under `.scheme-selector` — `__trigger`, `__dropdown`, `__option`, `__option-name`, `__option-desc`, `__check`, `__group-item`, `__group-label`, `__group-chevron`, `__submenu`, `__sub-option`, `__sub-option-name`, `__swatches`, `__swatch`. New UI styles will follow `scheme-selector__*` and live in this same file (where all dropdown styles already are).

## 2. Component tree / prop path

**`ColorSchemeSelector` is NOT rendered by `EditorV2` directly.** Path:

```
EditorV2.tsx:3278-3279   <Toolbar … colorScheme={colorScheme} onColorSchemeChange={setColorScheme} …>
Toolbar.tsx:25-26        props in ToolbarProps (colorScheme / onColorSchemeChange)
Toolbar.tsx:356-358      <ColorSchemeSelector colorScheme={…} onColorSchemeChange={…} />
```

Two hops, plain prop drilling, no intermediate logic. **Props are clearly practical; no context needed.** New props (`customPalettes`, create/rename/delete callbacks) thread the same way.

⚠️ **Scope flag**: `frontend/src/components/editor-v2/Toolbar.tsx` is **not in the Phase-1 file list** but **must change** (extend `ToolbarProps` + pass-through, and its `ColorScheme` prop type broadens to `ActiveColorScheme`). Per the brief's own rule ("if more than what is listed becomes necessary, stop and ask first") I am flagging it here so the Phase-1 go-ahead can explicitly include it. The change is mechanical (interface + forwarding).

`ColorScheme` type blast radius (app-wide grep): `types.ts` (definition), `EditorV2.tsx`, `Toolbar.tsx`, `ColorSchemeSelector.tsx`, plus one **commented-out** line in `joiner/index.ts:319` (inert). Broadening to `ActiveColorScheme` stays inside the (flagged) scope. ✔

## 3. localStorage helper

**None exists** (no storage util in `frontend/src/utils/` or `editor-v2/utils/`). The established local idiom is inline `try/catch` around `localStorage` + `JSON.parse`, right in `EditorV2.tsx`:

```typescript
// EditorV2.tsx:459-460 — the precedent to mirror
try { return JSON.parse(localStorage.getItem(`jjodel.highlight.${modelid}`) || '{}'); } catch { … }
```

The `jjodel.*` key-prefix family already exists: `jjodel.highlightMode`, `jjodel.highlight.<modelid>`, `jjodel.showGrid`, `jjodel.showEdgeLabels`, `jjodel.showBackground`, `jjodel.showSingletons.<modelid>`. → `jjodel.customPalettes` is consistent; inline safe-parse, no new helper module.

**Ordering note for 1c**: the `colorScheme` lazy initializer must be able to see the custom palettes. Declare/read `customPalettes` (or read the raw localStorage list inside the validator) **before** the `colorScheme` initializer runs — simplest is declaring the `customPalettes` state above `colorScheme` in `EditorV2.tsx`.

## 4. Name-collision greps — ALL CLEAR

Globally grepped over `frontend/src/`; zero hits for every planned identifier:

| Identifier | Hits |
|---|---|
| `jjodel.customPalettes` (storage key) | 0 |
| `jjodel-custom-palettes` (style id) | 0 |
| `derivePalette` / `derivePaletteVars` | 0 |
| `useCustomPaletteStyleSheet` | 0 |
| `CustomPalette` / `CustomColorScheme` / `ActiveColorScheme` | 0 |
| `hexToHsl` | 0 |
| CSS: `scheme-selector__custom*`, `__mini*`, `__section*`, `__seed*`, `__row-actions` | 0 |
| `crypto.randomUUID` | unused in codebase (available; Vite/modern target) |

Also: **no `<style>` element is created anywhere in `editor-v2`** (no `getElementById`/`document.head.appendChild` hits) — the injected `jjodel-custom-palettes` style id is collision-free and first-of-its-kind, as the architecture expects.

CSS-class validity of generated ids: `custom-<uuid>` contains only `[0-9a-f-]` and the class is prefixed `scheme-custom-…` → valid CSS class, no escaping needed.

## 5. Critical zone

None of the in-scope files is in the CLAUDE.md §3.1 critical-zone list: `ColorSchemeSelector.tsx`, `Toolbar.tsx` (flagged addition), `EditorV2.tsx`, `types.ts`, `_color-schemes.scss`, and the new palette files are all outside `useJjomSync.ts` / `useM1ReferenceEdges.ts` / `syncState.ts` / `canvasToJjom.ts` / `portDistribution.ts` / `VersionFixer.tsx` / `defaultViewTemplate.ts` / `DV.tsx`. The brief's excluded files (`jjomTransformers.ts`, `handlePosition.ts`, …) are untouched. Layer Impact Report: **not-required**. ✔

## File placement (convention check, decision at go-ahead)

Local convention: pure functions → `editor-v2/utils/` (`laneSeparation.ts`, `edgeUtils.ts`, …), hooks → `editor-v2/hooks/` (`useAlignment.ts`, …), UI → `editor-v2/components/`. No `palette/` directory exists, and "palette" is an overloaded term locally (`PalettePanel` = the node palette; `HighlightPalette`). **Recommendation**: `utils/derivePalette.ts` + `hooks/useCustomPaletteStyleSheet.ts` instead of a new `palette/` dir — matches convention and avoids the overloaded name as a directory.

## Open questions for the go-ahead

1. **Toolbar.tsx in scope** (see §2) — mechanical pass-through; needs explicit approval.
2. **File placement** — `utils/` + `hooks/` per convention, or the `palette/` dir from the brief?
3. **Custom swatch derivation choice**: brief says "derive the menu swatches from `derivePaletteVars`". The faithful candidates are the 4 light header fills (`--class/abstract/enum/package-header-bg`), but at L=91-96% they render near-white in a 10px swatch. Alternative faithful-but-legible: show the light fills anyway (they ARE the real canvas colors), or pick the more saturated derived values (`--orphan-border-color`, `--enum-accent`, `--package-accent` + abstract fill). Planned default unless told otherwise: **the 4 light header fills**, exactly as output by `derivePaletteVars` (zero drift, matches the brief literally).

---

**HARD STOP** — Phase 0 complete. No edits made. Awaiting go-ahead for Phase 1.
