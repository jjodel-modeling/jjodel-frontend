# Discovery — Canvas color scheme / palette system (v2-flow)

**Date**: 2026-06-06
**Branch**: `alfonso-frontend-jjtl`
**Mode**: READ-ONLY discovery. No code modified.
**Goal**: map the color scheme system to assess feasibility of user-created named palettes.

---

## TL;DR

- The scheme system is **one flat axis**: a single `ColorScheme` string id (`'sapphire'`, `'print'`, …) stored in `localStorage`, applied as a CSS class `scheme-<id>` on the `.editor-v2` root. The Palette submenu is **pure UI grouping** — in the data model the 5 named palettes are peers of Monochrome/Print.
- Palettes are **hardcoded twice**, with no derivation function: (a) 4 display swatches per palette in `ColorSchemeSelector.tsx`, (b) ~12 CSS custom properties per palette **per theme** (dark + light) in `_color-schemes.scss`. The two sources do not share values.
- Application is **100% static CSS**: class toggle only. App-wide grep finds **zero** runtime CSS-variable injection (`setProperty`, dynamic `<style>`, `adoptedStyleSheets`, inline `--*` props). A user-generated palette therefore **cannot reuse the existing mechanism as-is** and requires a new runtime injection layer (design follow-up).
- Each palette controls **node header fills + text + accents** (class / abstract class / enum / package / object / orphan). The curated palettes do **not** touch edges; only Monochrome and High Contrast override edge vars, and only Print touches node body/shadows.

---

## File map (all paths verified)

| File | Role |
|------|------|
| `frontend/src/components/editor-v2/components/ColorSchemeSelector.tsx` | Theme dropdown + Palette submenu. Declares `MAIN_OPTIONS` (:22-28) and `PALETTE_OPTIONS` with swatches (:30-36). |
| `frontend/src/components/editor-v2/_color-schemes.scss` | All `.scheme-*` variable overrides (:1-413) + dropdown/submenu styles (:419-631). |
| `frontend/src/components/editor-v2/_themes.scss` | Base vars for `theme-dark` / `theme-light` — these ARE the "Default" scheme (no `.scheme-default` class exists). |
| `frontend/src/components/editor-v2/types.ts:5-14` | `ColorScheme` union type. |
| `frontend/src/components/editor-v2/EditorV2.tsx:738-746` | State + `localStorage` persistence (`editor-v2-color-scheme`). |
| `frontend/src/components/editor-v2/EditorV2.tsx:3256` | Root class application. |
| `frontend/src/components/editor-v2/EditorV2.scss:4-6` | Import order: `themes` → `notations` → `color-schemes`. |
| `frontend/src/components/editor-v2/_notations.scss:31-44` | Notation axis also overrides some of the same vars (wireframe → transparent). |

---

## Q1 — Palette definition

**Two independent hardcoded sources. No seed color, no derivation function.**

### Source 1 — display swatches (`ColorSchemeSelector.tsx:30-36`)

```typescript
const PALETTE_OPTIONS: PaletteOption[] = [
    { id: 'sapphire',   name: 'Sapphire',   swatches: ['#3b82f6', '#94a3b8', '#38bdf8', '#475569'] },
    { id: 'amethyst',   name: 'Amethyst',   swatches: ['#8b5cf6', '#6d5da0', '#a78bfa', '#4c1d95'] },
    { id: 'jade',       name: 'Jade',       swatches: ['#10b981', '#3d7a60', '#2dd4bf', '#134e4a'] },
    { id: 'terracotta', name: 'Terracotta', swatches: ['#d97706', '#a08060', '#fb923c', '#78350f'] },
    { id: 'crimson',    name: 'Crimson',    swatches: ['#ef4444', '#9a4040', '#fb7185', '#881337'] },
];
```

Swatch order is documented in the interface comment (:19): `[class, abstract, enum, package]`. These 4 hexes are **menu-preview-only** (rendered via inline `style={{ backgroundColor }}`, :165). They are *representative* colors, **not** sampled from the SCSS — e.g. Sapphire's class swatch is `#3b82f6`, but the actual class header is `#dbeafe` (light) / `rgba(37,99,235,0.24)` (dark). **Dual-maintenance hazard**: changing a palette in SCSS does not update its swatches.

### Source 2 — actual scheme vars (`_color-schemes.scss`)

One block per palette: `.editor-v2.scheme-<name> { &.theme-dark {...} &.theme-light {...} }`. Each theme block hardcodes **12 custom properties**; each light block additionally nests **per-node-type re-overrides** (`.mm-class.abstract`, `.mm-enum`, `.mm-package`) for text contrast on pastel fills. Locations: Sapphire :58-103, Amethyst :107-152, Jade :156-201, Terracotta :205-250, Crimson :254-299. Dark variants use translucent `rgba()` fills over the dark node body; light variants use opaque Tailwind-pastel hexes.

So a "palette" is really **24+ hardcoded color decisions** (12 dark + 12 light + ~4 nested), not 4.

---

## Q2 — Color-to-element mapping (traced end to end, Sapphire / theme-light)

| Var | Sapphire value | Consumer selector | Painted element |
|---|---|---|---|
| `--class-header-bg` | `#dbeafe` | `.mm-class .mm-node__header` (EditorV2.scss:1519) | Class node header strip |
| `--class-abstract-header-bg` | `#e2e8f0` | `.mm-class.abstract .mm-node__header` (:1526) | Abstract class header |
| `--enum-header-bg` | `#e0f2fe` | `.mm-enum .mm-node__header` (:1549) | Enum node header |
| `--package-header-bg` | `#f1f5f9` | `.mm-node__tab` (:1328) | Package tab (folder-style header) |
| `--object-header-bg` | `#dbeafe` | `.mm-object__header` (:1601) | M1 object instance header |
| `--orphan-border-color` | `#2563eb` | `.mm-object--orphan` dashed border (:1658) + class-name text (:1665) | Orphan instance border/label |
| `--orphan-header-bg` | `#e4e8ee` | `.mm-object--orphan .mm-object__header` (:1661) | Orphan instance header |
| `--node-header-text` | `#1e3a5f` | `.mm-node__header` color (:1228) | Header title text (all node types) |
| `--stereotype-color` | `#475569` | `.mm-node__stereotype` (:1264, fallback form) | `«stereotype»` line |
| `--field-type-color` | `#2563eb` | field type labels (:1742, :1812) | Attribute/field type text in node body |
| `--enum-accent` | `#0284c7` | `.mm-enum.selected` / `.drop-target` border (:1557, :1562) | Enum selection ring |
| `--package-accent` | `#1d4ed8` | `.mm-package.selected` tab/container border (:1584) | Package selection ring |
| `--package-header-text` | `#334155` (nested `.mm-package`) | `.mm-node__tab` color (:1335) | Package tab text |

Per-node-type differences exist **only** in the light variants, via nested selectors inside the scheme block (e.g. `.mm-enum { --node-header-text: #075985; }` Sapphire :95-97) — these scope the var to descendants of that node type.

**What the palettes do NOT control**: edge stroke (`--edge-color`), edge selection (`--edge-selected`), markers (`--edge-marker-*`), node body (`--node-bg`), canvas background, field name color. Those stay at the `_themes.scss` base values. Exceptions by scheme:

- **Monochrome** also overrides `--edge-selected`, `--accent`, `--accent-hover`, `--accent-muted` (:26-29, :45-48).
- **High Contrast** also overrides `--edge-color`, `--edge-marker-stroke`, `--border-default`, `--field-name-color` (:316-321, :337-342).
- **Print** also overrides `--node-bg`, `--node-shadow`, `--node-shadow-deep`, `--package-body-bg`, plus **structural rules** (not just vars): `box-shadow: none !important`, `border-width: 1.5px`, header `border-bottom` (:369-412). Print is the only scheme that needs rules beyond custom properties.

Conceptual mapping of the 4 menu swatches → levers: swatch 1 = class header family, swatch 2 = abstract header family, swatch 3 = enum header family, swatch 4 = package family. Object/orphan/accents/text have no swatch.

---

## Q3 — colorScheme value shape

**Single flat id, one axis.** Picking "Palette → Sapphire":

- `localStorage['editor-v2-color-scheme'] = 'sapphire'` (not `palette-sapphire`; key at EditorV2.tsx:740/745).
- Root element class: `scheme-sapphire`, appended at EditorV2.tsx:3256:
  ```
  editor-v2 theme-${theme} notation-${notation}[ scheme-${colorScheme}][ show-edge-labels][ hide-background][ highlight-mode]
  ```
- `'default'` is special-cased: **no** `scheme-*` class is emitted at all — the `_themes.scss` base values are the default scheme (`_color-schemes.scss:7-8` confirms in comments).
- Load-time validation against a whitelist (EditorV2.tsx:738): `['default','monochrome','sapphire','amethyst','jade','terracotta','crimson','high-contrast','print']` — unknown values fall back to `'default'`. The `ColorScheme` union (types.ts:5-14) matches 1:1.

There is no mode/palette pair anywhere; "which selector distinguishes mode from palette" — only the UI does (membership test `isPaletteActive`, ColorSchemeSelector.tsx:51).

Scheme is **orthogonal** to theme (dark/light) and notation: effective colors come from the compiled `.scheme-X.theme-Y` combination, so every scheme ships both a dark and a light variant.

---

## Q4 — Submenu relationship

**Sub-variants in the UI, flat peers in the data model.** `ColorSchemeSelector` splits `MAIN_OPTIONS` at index 2 (:104-105), renders Default + Monochrome, then a hover-submenu group item labeled "Palette" containing `PALETTE_OPTIONS`, then High Contrast + Print. Selecting a palette calls the same `handleSelect(id)` as any top-level mode (:79-83). Nothing downstream (state, storage, SCSS) knows about the grouping.

---

## Q5 — CSS variable inventory

Union of all custom properties that change as a function of scheme (22 vars + 5 highlight vars):

| Var | mono | palettes ×5 | HC | print |
|---|:-:|:-:|:-:|:-:|
| `--class-header-bg` | ✔ | ✔ | ✔ | ✔ (transparent) |
| `--class-abstract-header-bg` | ✔ | ✔ | ✔ | ✔ |
| `--enum-header-bg` | ✔ | ✔ | ✔ | ✔ |
| `--package-header-bg` | ✔ | ✔ | ✔ | ✔ |
| `--object-header-bg` | ✔ | ✔ | ✔ | ✔ |
| `--orphan-border-color` | ✔ | ✔ | ✔ | ✔ |
| `--orphan-header-bg` | ✔ | ✔ | ✔ | ✔ |
| `--node-header-text` | — | ✔ | ✔ | ✔ |
| `--package-header-text` | — | ✔ (nested) | ✔ (light) | ✔ (light) |
| `--stereotype-color` | — | ✔ | ✔ | ✔ |
| `--field-type-color` | ✔ | ✔ | ✔ | ✔ |
| `--field-name-color` | — | — | ✔ | — |
| `--enum-accent` | ✔ | ✔ | — | — |
| `--package-accent` | ✔ | ✔ | — | — |
| `--edge-color` | — | — | ✔ | — |
| `--edge-selected` | ✔ | — | — | — |
| `--edge-marker-stroke` | — | — | ✔ | — |
| `--accent` / `--accent-hover` / `--accent-muted` | ✔ | — | — | — |
| `--border-default` | — | — | ✔ | ✔ |
| `--node-bg` / `--node-shadow` / `--node-shadow-deep` | — | — | — | ✔ |
| `--package-body-bg` | — | — | — | ✔ (light) |
| `--hl-1`..`--hl-5` (highlight mode) | — | — | ✔ | ✔ |

**Concrete values — Sapphire** (light / dark): see the Q2 table for light; dark uses `rgba` fills: `--class-header-bg: rgba(37,99,235,.24)`, `--class-abstract-header-bg: rgba(51,65,85,.28)`, `--enum-header-bg: rgba(14,165,233,.22)`, `--package-header-bg: rgba(30,41,59,.3)`, `--object-header-bg: rgba(37,99,235,.18)`, `--orphan-border-color: #3b82f6`, `--node-header-text: rgba(255,255,255,.92)`, `--stereotype-color: rgba(255,255,255,.55)`, `--field-type-color: #7dd3fc`, `--enum-accent: #38bdf8`, `--package-accent: #3b82f6` (`_color-schemes.scss:59-73`).

**Concrete values — Print (light)** (`:374-399`): all 5 header bgs + `--package-body-bg` + `--orphan-header-bg` → `transparent`; `--node-bg: #ffffff`; shadows → `transparent`; `--node-header-text: #0f172a`; `--stereotype-color: #64748b`; `--field-type-color: #334155`; `--border-default: rgba(0,0,0,.3)`; plus structural rules (`box-shadow: none !important` on all `.mm-*`, `border-width: 1.5px`, header `border-bottom`).

**A user palette mirroring the curated ones = ~12 levers × 2 themes**, of which 5 are the header fills, ~3 text, 2 accents, 2 orphan.

---

## Q6 — Static vs runtime (DECISIVE)

**Purely static.** The scheme mechanism is exclusively: toggle class `scheme-<id>` on the root (EditorV2.tsx:3256) → precompiled SCSS rules supply fixed var values.

Evidence of absence (app-wide greps over `frontend/src/`, not just editor-v2):

- No `style.setProperty` / `documentElement.style` anywhere.
- No `document.createElement('style')`, `insertRule`, `CSSStyleSheet`, `adoptedStyleSheets` anywhere.
- No `<style>` JSX tags and no inline `--*` custom properties in editor-v2 TSX.
- The only runtime color styling found: the menu swatch previews, `style={{ backgroundColor: color }}` (ColorSchemeSelector.tsx:163-166) — presentation of the dropdown, not scheme application.
- The Highlight Mode `--hl-*` set (EditorV2.scss:3598-3613) follows the **same static pattern**: base set on `.editor-v2`, fixed overrides per `.scheme-high-contrast` / `.scheme-print`. It established per-scheme var overriding, but still compile-time. The `hl-c1..c5` classes are applied at render time by `HighlightContext`, but the colors they reference are static.
- Dev-only `body.header-variant-a/b/c` blocks (EditorV2.scss:3403-3496, toggled by hand from DevTools) are likewise static CSS.

**Consequence**: a user-generated palette cannot be a precompiled class. It requires a runtime injection mechanism (to be designed separately). Two observations for that future design, recorded here as facts, not proposals:

1. Every consumer reads colors via `var(--*)` resolved on the `.editor-v2` subtree — there is a clean variable seam; no consumer hardcodes scheme colors except as `var(..., fallback)` defaults.
2. The curated light palettes use **nested per-node-type var re-overrides** (e.g. `.mm-enum { --node-header-text: ... }`). Inline `style` custom props on the root element could not express those descendant-scoped overrides; a dynamic `<style>` element could. This constrains the choice of injection mechanism.

### Cascade/precedence note

Import order is `themes` → `notations` → `color-schemes` (EditorV2.scss:4-6), but precedence is decided by specificity: scheme+theme blocks are 3 classes (`.editor-v2.scheme-X.theme-Y`) vs 2 for base theme and notation (`.editor-v2.notation-wireframe`). So an active scheme **beats** notation-wireframe's transparent header overrides (`_notations.scss:31-44`) on the shared vars. Any runtime mechanism must decide where it sits in this hierarchy (inline style on the element would beat everything for root-scoped vars).

### Persistence note (confirmed)

`localStorage` only, key `editor-v2-color-scheme`, editor-wide/cross-project. No Redux, no DObject, no VersionFixer involvement. A *named user palette* that must travel with a project or across machines would need a different persistence story — out of scope here.

---

## Answers recap

| Q | Answer in one line |
|---|---|
| Q1 | Hardcoded twice: 4 display swatches in TSX + ~12 vars × 2 themes per palette in `_color-schemes.scss`; no seed/derivation. |
| Q2 | Vars paint node header fills/text/accents per node type (class/abstract/enum/package/object/orphan); curated palettes never touch edges or node bodies. |
| Q3 | Single flat id (`'sapphire'`) in `localStorage['editor-v2-color-scheme']`; root class `scheme-sapphire`; `'default'` emits no class. |
| Q4 | Flat peers in the model; submenu is UI-only grouping. |
| Q5 | 22 scheme-sensitive vars overall; a curated palette defines ~12 per theme (5 fills, 3 text, 2 accents, 2 orphan). |
| Q6 | **Purely static** compiled SCSS classes; zero runtime injection anywhere in `frontend/src` → user palettes need a new runtime mechanism. |
