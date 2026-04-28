# DIAGNOSTIC REPORT: Editor V3 Hardcoded Colors

**Date:** 2026-03-10
**Scope:** All `.tsx`, `.ts`, `.scss` files in `frontend/src/components/editor-v3/`
**Existing theming system:** CSS custom properties via `data-theme` attribute on `:root`, defined in `frontend/src/styles/tokens/_colors-light.scss` and `_colors-dark.scss`

---

## Existing Theme Variables Already Available (but NOT used by editor-v3)

The token files already define some canvas-relevant variables:

```
--color-canvas-bg         (light: #ffffff, dark: #0f1012)
--color-canvas-grid       (light: slate-200, dark: rgba(255,255,255,0.05))
--color-node-bg           (light: #ffffff, dark: #16181a)
--color-node-border       (light: slate-300, dark: rgba(255,255,255,0.1))
--color-node-shadow       (light: rgba(15,23,42,0.08), dark: rgba(0,0,0,0.4))
--color-bg-primary/secondary/tertiary/elevated/hover
--color-border-primary/secondary/hover/focus
--color-text-primary/secondary/tertiary/placeholder/disabled/inverse
--color-accent, --color-error, --color-success, --color-warning, --color-info (+ hover/muted/subtle variants)
```

**Editor-v3 uses NONE of these.** Instead, it duplicates the same values as SCSS variables (`$v3-*`).

---

## 1. TSX Files — Hardcoded Colors

### `EditorV3Inner.tsx`

| Line | Code | Purpose |
|------|------|---------|
| 358 | `color={ctx.theme === 'dark' ? '#334155' : '#e2e8f0'}` | React Flow `<Background>` grid dot color |
| 365 | `background: ctx.theme === 'dark' ? '#1e293b' : '#f1f5f9'` | `<MiniMap>` inline style background |

### `toolbar/NotationSelector.tsx`

| Line | Code | Purpose |
|------|------|---------|
| 26 | `color: '#06b6d4'` | Default scheme swatch |
| 27 | `color: '#a78bfa'` | Pastel scheme swatch |
| 28 | `color: '#0ea5e9'` | Ocean scheme swatch |
| 29 | `color: '#22c55e'` | Forest scheme swatch |
| 30 | `color: '#f97316'` | Sunset scheme swatch |
| 31 | `color: '#94a3b8'` | Monochrome scheme swatch |
| 32 | `color: '#ec4899'` | Neon scheme swatch |
| 33 | `color: '#d97706'` | Earth scheme swatch |
| 34 | `color: '#0f766e'` | Nordic scheme swatch |

> **Note:** The COLOR_SCHEME_OPTIONS swatches are *intentionally* hardcoded — they represent fixed brand colors for each scheme, not themeable UI chrome. These should be **excluded** from theming migration.

### `edges/UnifiedEdge.tsx`

| Line | Code | Purpose |
|------|------|---------|
| 184 | `stroke="transparent"` | Invisible hit-test path overlay |

> ⚠️ Review: `transparent` is intentional (hit area), not a theme color.

---

## 2. SCSS — `editor-v3.scss` (Base Styles)

### SCSS Variables (Lines 15-29) — ALL hardcoded, should map to CSS vars

| Line | Variable | Value | Maps to |
|------|----------|-------|---------|
| 16 | `$v3-bg-canvas` | `#f8fafc` | `--color-canvas-bg` (mismatch: token says #ffffff) |
| 17 | `$v3-bg-node` | `#ffffff` | `--color-node-bg` |
| 18 | `$v3-border-node` | `#e2e8f0` | `--color-node-border` (mismatch: token says slate-300) |
| 19 | `$v3-border-selected` | `#06b6d4` | NEW: `--color-canvas-selected` |
| 20 | `$v3-text-primary` | `#1e293b` | `--color-text-primary` |
| 21 | `$v3-text-secondary` | `#64748b` | `--color-text-secondary` (close to token's slate-700) |
| 22 | `$v3-text-muted` | `#94a3b8` | `--color-text-disabled` |
| 25 | `$v3-dark-bg-canvas` | `#0f172a` | `--color-canvas-bg` (dark) |
| 26 | `$v3-dark-bg-node` | `#1e293b` | `--color-node-bg` (dark) |
| 27 | `$v3-dark-border-node` | `#334155` | `--color-node-border` (dark) |
| 28 | `$v3-dark-text-primary` | `#f1f5f9` | `--color-text-primary` (dark) |
| 29 | `$v3-dark-text-secondary` | `#94a3b8` | `--color-text-secondary` (dark) |

### Inline hardcoded values

| Line | Code | Purpose |
|------|------|---------|
| 44 | `background: $v3-bg-canvas` | Canvas background (via SCSS var) |
| 48 | `background: $v3-dark-bg-canvas` | Canvas background dark |
| 78 | `background: $v3-bg-node` | Node background |
| 79 | `border: 1px solid $v3-border-node` | Node border |
| 83 | `color: $v3-text-primary` | Node text |
| 86 | `rgba(0, 0, 0, 0.06)` | Node shadow |
| 91 | `rgba($v3-border-selected, 0.2)` + `rgba(0, 0, 0, 0.1)` | Selected node glow |
| 96-98 | Dark theme node overrides | Via SCSS vars |
| 118 | `rgba(0, 0, 0, 0.02)` | Header subtle bg tint (light) |
| 122 | `rgba(255, 255, 255, 0.02)` | Header subtle bg tint (dark) |
| 126 | `rgba($v3-border-selected, 0.05)` | Package header accent |
| 193 | `#3b82f6` | Class node left border (blue) |
| 197 | `#8b5cf6` | Enum node left border (violet) |
| 201 | `#10b981` | Package node left border (emerald) |
| 209 | `#f59e0b` | Object node left border (amber) |
| 213 | `#6366f1` | DataType node left border (indigo) |
| 233-234 | `$v3-border-selected` / `$v3-bg-node` | Anchor border/bg |
| 258 | `$v3-border-selected` | Named anchor fill |
| 265 | `$v3-border-selected` | Anchor hover fill |
| 279 | `$v3-text-muted` | Empty state color |
| 289-293 | `$v3-border-selected` / `$v3-bg-node` / `$v3-text-primary` | Inline editor |

---

## 3. SCSS — `edges.scss`

### SCSS Variables (Lines 9-14)

| Line | Variable | Value | Purpose |
|------|----------|-------|---------|
| 9 | `$v3-edge-color` | `#94a3b8` | Default edge stroke |
| 10 | `$v3-edge-selected` | `#06b6d4` | Selected edge stroke (cyan) |
| 11 | `$v3-edge-marker-stroke` | `#94a3b8` | Marker outline |
| 12 | `$v3-edge-marker-fill` | `#ffffff` | Marker fill (hollow) |
| 13 | `$v3-dark-edge-color` | `#64748b` | Dark edge stroke |
| 14 | `$v3-dark-edge-marker-fill` | `#1e293b` | Dark marker fill |

### Edge Labels (Lines 133-201)

| Line | Code | Purpose |
|------|------|---------|
| 136 | `rgba(255, 255, 255, 0.9)` | Label background (light) |
| 139 | `#475569` | Label text (light) |
| 145 | `#0e7490` | Label selected text (light) |
| 146 | `rgba(255, 255, 255, 0.95)` | Label selected bg (light) |
| 156 | `#ffffff` | Label input background |
| 158 | `#1e293b` | Label input text |
| 169 | `rgba(30, 41, 59, 0.9)` | Label background (dark) |
| 170 | `#94a3b8` | Label text (dark) |
| 173 | `#22d3ee` | Label selected text (dark) |
| 177 | `#1e293b` | Label input bg (dark) |
| 178 | `#f1f5f9` | Label input text (dark) |
| 190 | `#94a3b8` | Cardinality text (light) |
| 191 | `rgba(255, 255, 255, 0.85)` | Cardinality bg (light) |
| 199 | `rgba(30, 41, 59, 0.85)` | Cardinality bg (dark) |
| 200 | `#64748b` | Cardinality text (dark) |

### Segment Handles (Lines 207-224)

| Line | Code | Purpose |
|------|------|---------|
| 209 | `#ffffff` | Handle stroke |
| 216 | `#22d3ee` | Handle hover fill (cyan-300) |
| 220 | `#22d3ee` | Handle dragging fill |
| 222 | `rgba(14, 165, 233, 0.4)` | Handle drag glow |

### Edge Type Popup (Lines 230-290)

| Line | Code | Purpose |
|------|------|---------|
| 233 | `#ffffff` | Popup background (light) |
| 235 | `rgba(0, 0, 0, 0.12)` + `rgba(0, 0, 0, 0.08)` | Popup shadow (light) |
| 251 | `#334155` | Option text (light) |
| 256 | `#f1f5f9` | Option hover bg (light) |
| 265 | `#64748b` | Icon color (light) |
| 275 | `#1e293b` | Popup background (dark) |
| 276 | `rgba(0, 0, 0, 0.3)` | Popup shadow (dark) |
| 279 | `#e2e8f0` | Option text (dark) |
| 283 | `#334155` | Option hover bg (dark) |
| 288 | `#94a3b8` | Icon color (dark) |

---

## 4. SCSS — `toolbar.scss`

| Line | Code | Purpose |
|------|------|---------|
| 10 | `rgba(255, 255, 255, 0.95)` | Toolbar background (light) |
| 13 | `rgba(0, 0, 0, 0.08)` | Toolbar shadow (light) |
| 19 | `rgba(30, 41, 59, 0.95)` | Toolbar background (dark) |
| 20 | `rgba(0, 0, 0, 0.3)` | Toolbar shadow (dark) |
| 30 | `#94a3b8` | Label text |
| 40 | `rgba(0, 0, 0, 0.04)` | Button group bg (light) |
| 45 | `rgba(255, 255, 255, 0.06)` | Button group bg (dark) |
| 57 | `#64748b` | Button text |
| 63 | `rgba(0, 0, 0, 0.06)` | Button hover bg (light) |
| 64 | `#1e293b` | Button hover text (light) |
| 68 | `rgba(255, 255, 255, 0.08)` | Button hover bg (dark) |
| 69 | `#f1f5f9` | Button hover text (dark) |
| 73 | `#ffffff` | Active button bg |
| 74 | `#0ea5e9` | Active button text (cyan) |
| 75 | `rgba(0, 0, 0, 0.06)` | Active button shadow |
| 78 | `rgba(255, 255, 255, 0.1)` | Active button bg (dark) |
| 79 | `#38bdf8` | Active button text (dark, cyan-300) |
| 112 | `#1e293b` | Active swatch border (light) |
| 116 | `#f1f5f9` | Active swatch border (dark) |

---

## 5. SCSS — `panels.scss`

### SCSS Variables (Lines 10-17)

| Line | Variable | Value | Purpose |
|------|----------|-------|---------|
| 10 | `$v3-panel-bg` | `#ffffff` | Panel background |
| 11 | `$v3-panel-border` | `#e2e8f0` | Panel border |
| 12 | `$v3-panel-header-bg` | `#f8fafc` | Panel header bg |
| 15 | `$v3-dark-panel-bg` | `#1e293b` | Dark panel bg |
| 16 | `$v3-dark-panel-border` | `#334155` | Dark panel border |
| 17 | `$v3-dark-panel-header-bg` | `#0f172a` | Dark panel header bg |

### Palette Section (Lines 23-170)

| Line | Code | Purpose |
|------|------|---------|
| 39 | `#334155` | Palette header text |
| 64 | `#64748b` | Section header text |
| 69 | `rgba(0, 0, 0, 0.02)` | Section header hover |
| 75 | `#94a3b8` | Chevron icon |
| 95 | `#334155` | Palette item text |
| 99 | `#f1f5f9` | Item hover bg |
| 104 | `#e2e8f0` | Item active bg |
| 118 | `#64748b` | Item icon color |
| 135 | `#94a3b8` | Sublabel text |
| 141 | `#94a3b8` | Hint text |
| 152 | `#94a3b8` | Info text |
| 165 | `#94a3b8` | Instructions text |
| 169 | `#64748b` | Instructions strong text |

### Properties Panel (Lines 176-415)

| Line | Code | Purpose |
|------|------|---------|
| 192 | `#334155` | Properties header text |
| 218 | `#64748b` | Section header text |
| 221 | `rgba(0, 0, 0, 0.02)` | Section header hover |
| 227 | `#94a3b8` | Chevron icon |
| 236 | `#e2e8f0` | Count badge bg |
| 237 | `#64748b` | Count badge text |
| 263 | `#334155` | Checkbox field text |
| 270 | `#64748b` | Field label |
| 282 | `#e2e8f0` | Input border |
| 284 | `#ffffff` | Input background |
| 285 | `#1e293b` | Input text |
| 289 | `#06b6d4` | Input focus border (cyan) |
| 294 | `#334155` | Field value text |
| 305 | `#e2e8f0` | Row hover border |
| 306 | `rgba(0, 0, 0, 0.01)` | Row hover bg |
| 320 | `#94a3b8` | Row summary icon |
| 330 | `#334155` | Row name text |
| 335 | `#94a3b8` | Row type text |
| 348 | `#334155` | Inline input text |
| 352 | `#06b6d4` | Inline input focus border |
| 353 | `#ffffff` | Inline input focus bg |
| 359 | `#f1f5f9` | Row detail border |
| 373 | `#06b6d4` | Add button text (cyan) |
| 374 | `rgba(6, 182, 212, 0.1)` | Add button hover bg |
| 378 | `#94a3b8` | Remove button text |
| 380 | `#ef4444` + `rgba(239, 68, 68, 0.1)` | Remove button hover |
| 387 | `#94a3b8` | Empty state text |
| 398 | `#94a3b8` | Empty state icon/text |
| 410 | `#64748b` | Multi-select text |

### Context Menu (Lines 421-478)

| Line | Code | Purpose |
|------|------|---------|
| 422 | `#ffffff` | Menu background |
| 424 | `rgba(0, 0, 0, 0.12)` + `rgba(0, 0, 0, 0.08)` | Menu shadow |
| 441 | `#334155` | Menu item text |
| 449 | `#f1f5f9` | Item hover bg |
| 454 | `#ef4444` | Danger item text |
| 458 | `rgba(239, 68, 68, 0.08)` | Danger item hover bg |
| 467 | `#64748b` | Icon color |
| 470 | `#ef4444` | Danger icon color |
| 476 | `#e2e8f0` | Divider color |

### Dark Theme Overrides (Lines 484-564)

| Line | Code | Purpose |
|------|------|---------|
| 494 | `#e2e8f0` | Header text (dark) |
| 502 | `#94a3b8` | Section header text (dark) |
| 503 | `rgba(255, 255, 255, 0.02)` | Header hover (dark) |
| 507 | `#e2e8f0` | Palette item text (dark) |
| 508 | `#334155` | Item hover bg (dark) |
| 509 | `#475569` | Item active bg (dark) |
| 512 | `#94a3b8` | Icon color (dark) |
| 513-514 | `#64748b` | Sublabel/hint text (dark) |
| 527 | `#e2e8f0` | Properties header text (dark) |
| 531 | `#94a3b8` | Section header (dark) |
| 532 | `#334155` / `#94a3b8` | Count badge (dark) |
| 534 | `#94a3b8` | Field label (dark) |
| 535 | `#0f172a` / `#334155` / `#f1f5f9` / `#06b6d4` | Input styles (dark) |
| 536-537 | `#e2e8f0` | Field value / checkbox (dark) |
| 539 | `#334155` / `rgba(255,255,255,0.01)` | Row hover (dark) |
| 540-541 | `#e2e8f0` / `#64748b` | Row name/type (dark) |
| 542 | `#e2e8f0` / `#0f172a` / `#06b6d4` | Inline input (dark) |
| 543 | `#334155` | Row detail border (dark) |
| 545 | `#64748b` / `#ef4444` | Remove button (dark) |
| 547-548 | `#64748b` / `#94a3b8` | Empty/multi state (dark) |
| 552-553 | via vars + `rgba(0,0,0,0.3)` | Context menu (dark) |
| 557-558 | `#e2e8f0` / `#334155` | Menu items (dark) |
| 559 | `#ef4444` / `rgba(239,68,68,0.1)` | Danger items (dark) |
| 562 | `#94a3b8` | Icon (dark) |
| 563 | `#334155` | Divider (dark) |

---

## 6. SCSS — `notations.scss`

### SCSS Variables (redeclared, Lines 15-21)

Same variables as `editor-v3.scss` — duplicated declarations.

### Hardcoded Colors

| Line | Code | Purpose |
|------|------|---------|
| 39 | `rgba(0, 0, 0, 0.02)` | Class/enum header bg (light) |
| 96 | `rgba(0, 0, 0, 0.03)` | Attr/op/ref hover (light) |
| 154 | `rgba(0, 0, 0, 0.02)` | Enum header bg (light) |
| 184 | `rgba(0, 0, 0, 0.03)` | Literal hover (light) |
| 206 | `rgba(0, 0, 0, 0.02)` | Package tab bg (light) |
| 230 | `rgba(0, 0, 0, 0.04)` | Package badge bg |
| 298 | `rgba(0, 0, 0, 0.06)` | Simplified badge bg |
| 301 | `rgba(59, 130, 246, 0.1)` / `#3b82f6` | Attr badge (blue) |
| 302 | `rgba(6, 182, 212, 0.1)` / `#06b6d4` | Ref badge (cyan) |
| 303 | `rgba(139, 92, 246, 0.1)` / `#8b5cf6` | Op badge (violet) |
| 304 | `rgba(139, 92, 246, 0.1)` / `#8b5cf6` | Lit badge (violet) |
| 324 | `rgba(0, 0, 0, 0.02)` | Object header bg (light) |
| 354 | `rgba(0, 0, 0, 0.03)` | Object feature hover (light) |
| 359 | `#3b82f6` | Ref feature value (blue) |
| 423 | `rgba(16, 185, 129, 0.1)` / `#10b981` | Object badge (green) |
| 427-428 | `rgba(6, 182, 212, 0.1)` / `#06b6d4` | Object ref badge (cyan) |
| 447 | `rgba(0, 0, 0, 0.04)` | Custom view tag bg |

### Dark Theme Overrides (Lines 457-592)

All dark overrides use `rgba(255, 255, 255, 0.0x)` for backgrounds and `$v3-dark-*` SCSS vars for colors.

---

## 7. SCSS — `color-schemes.scss`

9 color schemes with ~42 hardcoded color values. Each scheme defines header/tab backgrounds for light and dark modes.

| Scheme | Light Header | Dark Header | Light Package Tab | Dark Package Tab |
|--------|-------------|-------------|-------------------|-----------------|
| pastel | `#f0f4ff` | `rgba(96,165,250,0.08)` | `#ecfdf5` | `rgba(52,211,153,0.08)` |
| ocean | `#e0f2fe` | `rgba(14,165,233,0.1)` | `#ccfbf1` | `rgba(20,184,166,0.1)` |
| forest | `#ecfdf5` | `rgba(34,197,94,0.08)` | `#f0fdf4` | — |
| sunset | `#fff7ed` | `rgba(249,115,22,0.08)` | `#fefce8` | — |
| monochrome | `#f8fafc` | `rgba(255,255,255,0.03)` | `#f8fafc` | same |
| neon | `#ede9fe`/`#fce7f3`/`#e0e7ff` | rgba variants | `#d1fae5` | rgba variant |
| earth | `#fef3c7` | `rgba(217,119,6,0.08)` | `#fef9c3` | — |
| nordic | `#f1f5f9` | `rgba(148,163,184,0.06)` | `#f0fdfa` | `rgba(94,234,212,0.06)` |

Additional badge color overrides in ocean, forest, sunset, neon, nordic schemes (~12 more values).

> **Note:** Color scheme values are DECORATIVE — they intentionally differ between schemes. They are NOT suitable for CSS variable replacement via the global theme. They should remain hardcoded OR use per-scheme CSS custom properties.

---

## 8. SCSS — `viewpoint.scss`

| Line | Code | Purpose |
|------|------|---------|
| 36 | `rgba(0, 0, 0, 0.04)` | Field hover bg (light) |
| 43 | `#3b82f6` | Field input border (blue) |
| 48 | `white` | Field input bg |
| 51 | `rgba(59, 130, 246, 0.2)` | Field input focus glow |
| 62 | `#e2e8f0` | Input border |
| 66 | `white` | Input bg |
| 70 | `#3b82f6` | Input focus border |
| 71 | `rgba(59, 130, 246, 0.15)` | Input focus glow |
| 87 | `#64748b` | Toggle label text |
| 94 | `#cbd5e1` | Toggle switch bg (inactive) |
| 106 | `white` | Toggle knob |
| 111 | `#3b82f6` | Toggle switch bg (active) |
| 127 | `#e2e8f0` | Selector border |
| 131 | `white` | Selector bg |
| 135 | `#3b82f6` | Selector focus border |
| 155 | `#e2e8f0` | Subview border |
| 160 | `#94a3b8` | Subview placeholder text |
| 179 | `#e2e8f0` | Vertex border |
| 181 | `rgba(0, 0, 0, 0.01)` | Vertex bg |
| 186 | `#94a3b8` | Edge text |
| 199 | `#fef2f2` | Error bg |
| 200 | `#fecaca` | Error border |
| 202 | `#dc2626` | Error text |
| 224 | `#991b1b` | Error message pre text |

### Dark Overrides (Lines 233-295)

| Line | Code | Purpose |
|------|------|---------|
| 236 | `rgba(255, 255, 255, 0.04)` | Field hover (dark) |
| 241-243 | `#1e293b` / `#f1f5f9` / `#3b82f6` | Field input (dark) |
| 247-252 | `#1e293b` / `#f1f5f9` / `#334155` / `#3b82f6` | Input (dark) |
| 257 | `#475569` | Toggle switch bg (dark inactive) |
| 260 | `#3b82f6` | Toggle switch bg (dark active) |
| 265-267 | `#1e293b` / `#f1f5f9` / `#334155` | Selector (dark) |
| 271 | `#334155` | Subview border (dark) |
| 274 | `#64748b` | Subview placeholder (dark) |
| 279-280 | `#334155` / `rgba(255,255,255,0.02)` | Vertex (dark) |
| 284 | `#64748b` | Edge text (dark) |
| 288-289 | `#450a0a` / `#7f1d1d` | Error bg/border (dark) |
| 292 | `#fca5a5` | Error pre text (dark) |

---

## 9. React Flow Default Overrides

### Current state in editor-v3:

- **`editor-v3.scss` lines 43-49:** Only overrides `.react-flow { background }` — light and dark via SCSS vars
- **No `colorMode` prop:** `<ReactFlow>` does NOT receive `colorMode`
- **No `.react-flow__edge-path`** overrides — edges use custom classes (`v3-edge`)
- **No `.react-flow__handle`** overrides — handles use custom classes (`v3-anchor`)
- **No `.react-flow__controls`** overrides — controls not rendered (custom toolbar instead)
- **No `.react-flow__selection`** overrides

### editor-v2 (for reference):

`EditorV2.scss` has **extensive** `.react-flow` overrides (lines 107-605) — these are NOT shared with v3.

---

## SUMMARY

### Totals

| Category | Count |
|----------|-------|
| **Hex color values** | ~95 |
| **RGBA values** | ~63 |
| **Named colors** (`white`, `transparent`) | ~6 |
| **SCSS variable declarations** (duplicated across files) | ~18 |
| **Total hardcoded color instances** | **~182** |

### Files Affected

1. `styles/editor-v3.scss` — 30+ instances
2. `styles/edges.scss` — 35+ instances
3. `styles/panels.scss` — 55+ instances
4. `styles/notations.scss` — 30+ instances
5. `styles/toolbar.scss` — 20+ instances
6. `styles/viewpoint.scss` — 25+ instances
7. `styles/color-schemes.scss` — 42+ instances (decorative, may keep)
8. `EditorV3Inner.tsx` — 2 instances (React Flow props)
9. `toolbar/NotationSelector.tsx` — 9 instances (decorative swatches, keep)

### Categories Needing New CSS Variables

| Category | Example | New Variable Needed? |
|----------|---------|---------------------|
| Canvas bg | `#f8fafc` | Already exists: `--color-canvas-bg` (adjust value) |
| Canvas grid | `#e2e8f0` | Already exists: `--color-canvas-grid` |
| Node bg/border/shadow | `#ffffff`, `#e2e8f0` | Already exists: `--color-node-bg`, `--color-node-border`, `--color-node-shadow` |
| Node selected border | `#06b6d4` | **NEW:** `--color-canvas-selected` |
| Edge default/selected | `#94a3b8`, `#06b6d4` | **NEW:** `--color-edge-default`, `--color-edge-selected` |
| Edge marker fill | `#ffffff`, `#1e293b` | **NEW:** `--color-edge-marker-fill` |
| Edge label bg/text | `rgba(...)`, `#475569` | **NEW:** `--color-edge-label-bg`, `--color-edge-label-text` |
| Handle colors | `#06b6d4` | **NEW:** `--color-handle-border`, `--color-handle-hover` |
| Panel bg/border/header | `#ffffff`, `#e2e8f0`, `#f8fafc` | Map to existing `--color-bg-*`, `--color-border-*` |
| Toolbar bg | `rgba(255,255,255,0.95)` | **NEW:** `--color-toolbar-bg` |
| Context menu | `#ffffff`, shadow | Map to existing `--color-bg-elevated` |
| Type-specific borders | `#3b82f6`, `#8b5cf6`, etc. | **NEW:** `--color-type-class`, `--color-type-enum`, etc. |
| Subtle hover tints | `rgba(0,0,0,0.02)` | **NEW:** `--color-tint-hover` (or use existing `--color-bg-hover`) |
| Focus/accent (cyan) | `#06b6d4`, `#0ea5e9` | **NEW:** `--color-canvas-accent` (distinct from global `--color-accent` which is slate) |
| Error states | `#ef4444`, `#fef2f2` | Map to existing `--color-error`, `--color-error-bg` |
| Color scheme headers | `#f0f4ff`, `#e0f2fe`, etc. | Keep hardcoded OR per-scheme CSS vars |

### Key Architectural Decision Needed

The existing global `--color-accent` is **slate** (monochromatic design), but editor-v3 uses **cyan** (`#06b6d4`) as its accent for selection, focus, and active states. Options:

1. **Keep cyan as canvas-specific accent** → New `--color-canvas-accent` variable
2. **Align with global slate accent** → Would change the editor's visual identity
3. **Make global accent cyan** → Would affect the entire app

> Recommendation: Option 1 — introduce `--color-canvas-accent` for the editor's interactive accent color.
