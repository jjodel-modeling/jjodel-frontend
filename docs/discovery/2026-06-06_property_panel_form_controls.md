# Discovery — Property Panel form controls inventory (READ-ONLY)

**Date**: 2026-06-06 16:30
**Type**: discovery, read-only (no source changed)
**Branch**: `alfonso-frontend-jjtl`
**Effort**: xhigh
**Method**: grep + static read of the local working tree. Every style value below is copied verbatim from SCSS/TSX; `file:line` anchors are current as of this read. Runtime cascade winners are reasoned from selector specificity + load order and flagged where a DOM/computed-style check would be needed to be 100% certain.

> **Relationship to the earlier doc.** A broader inventory already exists at `docs/discovery/2026-06-02_form_controls_inventory.md` (Italian). It was **not** modified. This report is the focused, re-verified, per-control English inventory the implementation phase needs. Where the two disagree, **this one reflects the current code** (§5.1 "do not trust fixtures from memory"): notably the `ui/Toggle` ON color, which the 2026-06-02 doc reported as slate `#334155` but the current code sets to **cyan `#0ea5e9`** — see §2 / §7.

---

## 1. Property Panel file map (components → sections)

The panel shown for a selected metaclass is the **New-UI M2 properties panel**, rendered by the legacy class `Info` (a `React.Component`), mounted inside the tree-view shell.

```
PropertiesWithTreeView.tsx
  .properties-with-tree-view
   └─ .properties-panel-container
        ├─ .properties-panel-header   ← "PROPERTIES" + <i class="bi bi-sliders">   (PropertiesWithTreeView.tsx:200-209)
        └─ .properties-panel-body
             └─ <Info …>               ← the actual properties editor

Info.tsx  (components/editors/Info.tsx, 1387 lines)
  <section class="properties-tab properties-panel">     (Info.tsx:1172 / :1264; empty state :1226)
   └─ per-element dispatch → static render methods, each wrapping content in <CollapsibleSection>:
        named()      Info.tsx:286   →  "Name" text input            (.jj-field > Input)
        model()      Info.tsx:~290  →  GENERAL · DEPENDENCIES · CONTENTS
        package()    Info.tsx:351   →  GENERAL (Name, Uri, Prefix)
        class()      Info.tsx:370   →  GENERAL · <InheritanceSection> · FLAGS
        InheritanceSection() :106   →  INHERITANCE (Abstract, Interface, Extends combobox, Allow cross-extend)
        enum()       Info.tsx:396   →  GENERAL
        feature()    Info.tsx:405   →  GENERAL · TYPE & BOUNDS (Type select + Lower/Upper) · ADVANCED
        attribute()  Info.tsx:451   →  feature() + FLAGS (ID, IoT)
        reference()  Info.tsx:461   →  feature() + FLAGS (Composition, Aggregation)
        operation()  Info.tsx:472   →  GENERAL · RETURN (return type select)
        literal()    Info.tsx:486   →  GENERAL · VALUE (Ordinal)
        object()/value slots         →  ADVANCED STATE  (Info.tsx:1299) — M1 slot value editors
```

`CollapsibleSection` (Info.tsx:37-62) renders `.props-section > .props-section__header-row > button.props-section__header` (title `.props-section__title` + `.props-section__chevron` = `bi bi-chevron-right`) and, when open, `.props-section__body` (the field container).

**Header / type breadcrumb**: the "PROPERTIES" label is in `PropertiesWithTreeView.tsx:202`. The per-element title (`<h1>{data.name}</h1>`) is in `named()` (Info.tsx:288) but is suppressed inside sections (`skipTitle=true`). The "CLASS" word the prompt cites is the element-type label rendered around the panel top (commandbar / `properties-tab` header region) — not one of the form controls, so not styled here.

**Adjacent panels that are NOT this one** (do not confuse during the migration): `components/editor-v2/panels/M1PropertiesPanel.tsx` (`.properties-panel__content`, the v2-flow M1 inspector) and `components/editors/views/data/InfoData.tsx` (`.properties-tab.properties-panel`, the VIEW/Apply-to editor). They reuse the same legacy `Input`/`Select` + `react-select` engine but live in different files.

---

## 2. Per-control style table

The four controls the prompt names. **Critical structural fact**: the `Name` text input and the `Type` select are rendered by the joiner legacy `Input`/`Select` (= `forEndUser/Input.tsx`). When no `label`/`postlabel` prop is passed, that component sets `wrap = false` (Input.tsx:326-331) and returns the **bare** `<input>` / `<select>` — **not** wrapped in `.input-container`. Its className is effectively empty (`classes = ' '`, Input.tsx:163; the old `'my-auto input'` is commented out). Therefore:

- the `Name` input is styled only by the **global** `input[type="text"]` rule (`_form-system.scss:41-86`);
- the `Type` select is styled by **nothing project-level** — the base `select`/`.form-select` blocks are **commented out** (`_form-system.scss:134-184`, `info-improvements.scss:275-320`) and there is no bare `.props-section__body select` rule — so it falls back to the **native browser select**. This is the origin of the "black focus ring" and the odd height.

| Attribute | **Text input** `Name` | **Toggle** (flags / Allow cross-extend) | **Combobox** `Extends` (react-select) | **Native select** `Type` |
|---|---|---|---|---|
| Component | joiner `Input` (`forEndUser/Input.tsx:539`), bare `<input>` | `PropertiesToggle` (Info.tsx:79) → `ui/Toggle` size `xs` (Info.tsx:100) | `MultiSelect` = raw `react-select` default export (Info.tsx:125), `classNamePrefix="jj-select"` | joiner `Select` (`forEndUser/Input.tsx:550`), bare `<select>` |
| Style source | `_form-system.scss:41-86` (global) | `ui/Toggle/Toggle.module.css` | `info.scss:1051-1246` (`.jj-select__*`) | **none** → native browser default |
| height / min-height | `height: 36px` (`--form-input-height`) | track **24×14px** (`.toggleXs`, padding 2px); thumb 10×10 | `.jj-select__control { min-height: 32px }` | native (≈21–25px, UA-dependent) |
| padding | `8px 12px` (`--form-input-padding-y/x`) | n/a (2px track inset) | value container `0 10px`; indicator `4px 8px` | native |
| border | `1px solid #e2e8f0` (`--form-input-border-color`) | none (track) | `1px solid #e2e8f0` | native |
| border-radius | `6px` (`--form-input-border-radius`) | `9999px` (pill) | `6px` | native (~`2px`) |
| background | `#ffffff` (`--form-input-bg`) | off `#cbd5e1`; **on `#0ea5e9`** (cyan) | `#ffffff` | native |
| font-size | `14px` (`--form-input-font-size`) | n/a | `13px` (control, value, placeholder, option) | native (~13–16px) |
| text color | `#0f172a` (`--form-input-color`) | n/a | single-value `#1e293b`; option `#334155`; placeholder `#94a3b8` | native `#000` |
| **focus** | border `#334155` + `outline: 3px solid rgba(71,85,105,0.15)` (box-shadow commented out) — **slate** | `box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(51,65,85,0.3)` — slate ring (`:focus-visible`) | `--is-focused`: border `#94a3b8` + `box-shadow: 0 0 0 3px rgba(100,116,139,0.08)` — **faint slate**, NOT cyan | **native focus ring (black/blue)** — the divergence to fix |
| hover | border `#cbd5e1` (`--form-input-border-color-hover`) | off→`#94a3b8`; on→`#0284c7` | control border `#cbd5e1` | native |
| active / open | n/a | n/a | menu opens below; see §4 | native popup |
| disabled | bg `#f1f5f9`, color `#94a3b8`, opacity .7, not-allowed | opacity .5, not-allowed | (react-select default) | native |
| transition | `border-color 150ms ease, box-shadow 150ms ease` | `background-color 200ms ease`; thumb `transform 200ms ease` | `border-color 0.15s` | native |
| chevron / arrow | none | none | **react-select built-in `DropdownIndicator` SVG** (not a Bootstrap icon), color `#94a3b8`, padding `4px 8px` | native UA arrow |
| divider before chevron | none | none | `indicator-separator` is `display:none`, BUT `.jj-select__value-container--is-multi` has `border-right: 1px solid #e2e8f0` (info.scss:1203) → a vertical rule DOES appear in multi mode | native |

### Height delta (the thing Alfonso observed)
- `Name` input = **36px**, `Extends` combobox = **32px**, `Type` native select = **UA default (~21–25px)**. Three different heights, three different code paths. None of the three currently agrees.

### Rough edges found inside the combobox SCSS (carry into the fix)
- **`info.scss:1197`** — `.jj-select__input-container input { … border: 1px solid red !important; }` — a leftover debug **red border** on the typing input inside the combobox (a later rule `& input.jj-select__input` resets `border:none` with equal specificity + later position, so the net winner is order-dependent — confirm in DOM).
- **`info.scss:1132-1134`** — `.jj-select__option:hover { color: white !important; }` sets only the text color to white but **no background** on hover, so the option text can go white-on-white. Keyboard `--is-focused` instead uses bg `#f1f5f9` + dark text. Hover vs focus are inconsistent.
- **`info.scss:1150`** — `.jj-select__multi-value__label { color: white !important; }` = white label on a slate-100 (`#f1f5f9`) chip → low/invisible contrast.

---

## 3. Native `<select>` census

`grep -rn "<select"` across `frontend/src` = **63 matches** (4 are commented-out / comments: `DockLayout.tsx:159,205`, `ObjectNode.tsx:405` (comment), `PaletteData.tsx:667` (commented)). Live native-`<select>` render sites ≈ 53, plus the wrapper engines that emit one each.

### 3a. Inside the Property Panel (Info.tsx) — the migration target
| File:line | Context | In-panel? |
|---|---|---|
| Info.tsx:414 | `<Select field='type'>` — **Type** (attribute/reference), bare native | ✅ |
| Info.tsx:481 | `<Select field='type'>` — **Return type** (operation), bare native | ✅ |
| Info.tsx:571 | `<select class="jj-slot-value-select">` — Force type override (LObject) | ✅ |
| Info.tsx:720 | `<select class="jj-slot-value-select">` — M1 enum slot value | ✅ |
| Info.tsx:726 | `<select class="jj-slot-value-select">` — M1 reference slot value | ✅ |
| Info.tsx:739 | `<select class="jj-slot-value-select">` — M1 composition ref slot (popup) | ✅ |
| Info.tsx:757 | `<select class="jj-slot-value-select">` — M1 shapeless value | ✅ |
| Info.tsx:797 | `<select>` — IoT "Topic" (tab) | ✅ |
| Info.tsx:825 | `<select class="my-auto ms-auto select">` — IoT "Topic" (popup) | ✅ |

(The bare `Type`/`Return type` selects use no class → native styling; the slot selects use `.jj-slot-value-select`, info-improvements.scss:1553 = 28px, custom slate SVG arrow.)

### 3b. Wrapper engines that render a native `<select>` under the hood (shared)
| File:line | Role |
|---|---|
| forEndUser/Input.tsx:408 | the `Select` engine (`tag:'select'`) used by Info "Type" + VIEW editor |
| forEndUser/Selector.tsx:130 ; MySelect.tsx:78 ; CountryPicker.tsx:317 | other joiner native-select wrappers (`.model-select`) |
| forEndUser/GenericInput.tsx:219 (comment) ; SizeInput.tsx:134 (comment) | dispatch native input/select for VIEW data |
| ui/Select/Select.tsx:84 | the **unused** `ui/` primitive native select (not used by the panel) |

### 3c. Elsewhere (not the M2 property panel) — sizes the broader, lower-priority migration
- **VIEW / viewpoint editor**: views/data/PaletteData.tsx:676 ; NodeEditor.tsx:713 ; MTM.tsx:140, 409 ; viewpoint/properties/ViewProperties.tsx:123, 138, 296 ; viewpoint/ViewpointBreadcrumb.tsx:53
- **editor-v2 canvas**: Toolbar.tsx:406 ; nodes/ObjectNode.tsx:477
- **Settings / providers**: Settings/ProviderSettings.tsx:164 ; UnifiedSettingsModal/sections/ProfileSection.tsx:327 ; NotificationsSection.tsx:110, 154 ; common/ProviderModelSelector.tsx:133 ; pages/settings/ProviderConfigModal.tsx:211
- **Jodie**: Jodie/ProviderSelector.tsx:50 ; Jodie/SettingsModal.tsx:123
- **EnvGen wizard**: ConcreteSyntaxStep.tsx:88 ; OutputStep.tsx:31, 44 ; GeneralStep.tsx:55 ; TechStackStep.tsx:25 ; DesignStep.tsx:33, 46, 79, 92, 107
- **JjTL dialogs**: NewTransformationDialog.tsx:299, 329 ; ExecuteTransformationDialog.tsx:273 ; dialogs/JjtlInputDialog.tsx:144 ; views/InferredMappingsPanel.tsx:129 ; views/MappingTraceView.tsx:245
- **Misc**: jjscript/ScriptBlock.tsx:1215 ; metrics/Metrics.tsx:105 ; export/ExportImageMenu.tsx:178 ; project/NewViewpointDialog.tsx:124 ; pages/Auth.tsx:321 ; pages/Account.tsx:380 ; pages/Updates.tsx:169 ; pages/components/Edit/Edit.tsx:31

**Sizing**: the Property-Panel migration touches ~9 in-panel native selects (2 bare `Select`, 5 `jj-slot-value-select`, 2 IoT) + 2 react-select comboboxes. The full app has ~40 more native `<select>` sites outside the panel — out of scope for "make the Property Panel uniform" but listed so the blast radius is known if the custom select becomes the app-wide default.

---

## 4. Canonical custom-select wrapper report

**There is no bespoke wrapper component.** `MultiSelect` is the **raw `react-select` default export**, re-exported from joiner:

```
joiner/index.ts:10   import MSelect from 'react-select'
joiner/index.ts:64   export const MultiSelect = MSelect;
```

The `Extends` combobox uses it directly with **no `styles`, no `theme`, no custom `components`** — only `classNamePrefix="jj-select"` (Info.tsx:125-129). All styling is therefore external SCSS targeting `.jj-select__*` in **`components/editors/info.scss:1051-1246`**.

> Caveat: a *different* react-select instance lives **inside** `forEndUser/Input.tsx:353-403` (the legacy `Select` with `isMultiSelect`), styled with `classNamePrefix="jjodel-select"` + an inline `styles` object (`control.minHeight:'38px'`, `borderColor:'#e2e8f0'`, `placeholder #9ca3af`, `clearIndicator:none`) and external `forEndUser/inputselect.scss`. The panel's `Extends`/`Dependencies` do **not** use this path. So two react-select skins coexist: `jj-select` (panel, info.scss) and `jjodel-select` (legacy/VIEW, inputselect.scss).

**Props exposed by the `Extends` usage** (Info.tsx:125-129): `classNamePrefix`, `isMulti`, `options` (= `lclass.validTargetOptions`, type `MultiSelectOptGroup[]` — pre-grouped by metamodel by the L-layer getter, `LModelElement.tsx:1280`), `value`, `placeholder="Select superclass..."`, `onChange`. **Not set**: `styles`, `theme`, `components`, `maxMenuHeight`, `menuPortalTarget`, `menuPlacement`, `isClearable`, `closeMenuOnSelect`.

**Menu handling**:
- `maxMenuHeight` — **not set → react-select default 300px**.
- `menuPortalTarget` — **not set → menu rendered inline** (no portal). It can be clipped by an ancestor `overflow` and is positioned by react-select's own logic.
- `.jj-select__menu` (info.scss:1101): border `1px #e2e8f0`, radius `6px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`, `margin-top: 4px`, `z-index: 10`, `overflow: hidden`.
- `.jj-select__menu-list` padding `4px`. No open animation defined (react-select default = none/instant).

**Option states** (info.scss:1115-1134):
- base option: `#334155`, padding `6px 10px`, radius `4px`.
- **focused/keyboard** `--is-focused`: **background `#f1f5f9` (slate-100, grey)** + color `#1e293b`. ← this is the **grey highlight Alfonso sees on the `BookCopy` row**, and the place to tint **cyan** in the fix.
- **mouse hover** `:hover`: only `color: white` (no bg) — see §2 rough edge.
- **selected**: no `--is-selected` override → for `isMulti` the selected entries become `.jj-select__multi-value` chips (bg `#f1f5f9`, label color `white` — invisible, info.scss:1142-1152); for a single-select usage it would fall back to react-select's default selected highlight.

**Group header rendering** (`METAMODEL_1`, `METAMODEL_2`, …): the `jj-select` prefix has **no `__group` / `__group-heading` SCSS** anywhere → the `Extends` dropdown uses react-select's **default** group-heading style (small uppercase grey). The *other* prefix `jjodel-select` does style groups (`inputselect.scss:306-320`: 10px / 700 / uppercase / `#94a3b8`, option hover bg `#f1f5f9`) — so the two comboboxes render group headers differently today.

**Why a scrollbar appears with only ~8 options**: default `maxMenuHeight` is 300px and is *not* overridden; with grouped options each metamodel adds a group-heading row plus options, so 8 grouped options + headers exceed 300px and react-select scrolls instead of growing. To "grow to fit few options" the fix must raise/remove `maxMenuHeight` (or set it conditionally).

---

## 5. Design tokens (name → value → file)

Slate is the real token system; cyan is mostly hardcoded.

| Token / literal | Value | File:line | Notes |
|---|---|---|---|
| `$slate-100` | `#f1f5f9` | _colors-light.scss:20 | option/chip grey highlight |
| `$slate-250` | `#d1d9e3` | _colors-light.scss:25 | `--color-border-secondary` |
| `$slate-300` | `#cbd5e1` | _colors-light.scss:26 | `--color-border-primary`; toggle-off track |
| `$slate-400` | `#94a3b8` | _colors-light.scss:29 | combobox focus border / placeholder / arrow |
| `$slate-700` | `#334155` | _colors-light.scss:32 | `--color-accent`; slate focus base |
| `--color-accent` | `#{$slate-700}` = `#334155` | _colors-light.scss:118 | canonical accent (legacy `.input-container` focus uses it) |
| `--color-border-secondary` | `#{$slate-250}` = `#d1d9e3` | _colors-light.scss:91 | — |
| `--color-bg-secondary` | `#ffffff` | _colors-light.scss:81 | panel/control bg |
| `--radius-sm` / `--radius-md` | `4px` / `8px` | _radius.scss:13-14 | inputs use sm-ish; legacy input-container uses `--radius-md`=8px |
| `--form-input-height` | `36px` | _form-system.scss:8 | input height |
| `--form-input-border-color` | `#e2e8f0` | _form-system.scss:13 | control border (note: ≠ `--color-border-secondary`) |
| `--form-input-border-color-focus` | `#334155` | _form-system.scss:16 | the standardized slate focus border |
| `--form-input-focus-shadow` | `0 0 0 3px rgba(51,65,85,0.15)` | _form-system.scss:17 | slate focus ring (often commented out at the input) |
| `--form-toggle-bg` / `-bg-active` | `#cbd5e1` / `#475569` | _form-system.scss:29-30 | **note**: these token values (slate-active) are NOT what `ui/Toggle` actually uses |
| cyan `#0ea5e9` | literal | Toggle.module.css:79 ; info-improvements.scss:1620 (`.bool-toggle--on`) | **hardcoded**, no single canonical semantic token |
| `--color-canvas-accent` | `#06b6d4` (cyan-500) | _colors-light.scss:205 | a *different* cyan, canvas-only |
| `--color-toolbar-btn-active-text` | `#0ea5e9` | _colors-light.scss:281 | the only token literally `#0ea5e9` |

There are dark-mode counterparts in `_colors-dark.scss` and `_form-system.scss:697,828` (focus border `#64748b`, ring `rgba(100,116,139,0.25)`); the `.jj-select__*` block is light-mode-only literals.

---

## 6. Spacing / alignment / dropdown-height findings

- **Field vertical rhythm**: `.jj-field { margin-bottom: 14px }` (_form-system.scss:939). Inside it: `.jj-field-label` (font 11px / 500 / `#64748b`, `margin-bottom: 5px`) → control → `.jj-field-hint` (font 11px / `#94a3b8`, `margin-top: 4px`). Required asterisk `.jj-field-required` = `#ef4444`, 10px.
- **Toggle rows**: `.jj-toggle-row { padding: 5px 0 15px 0 }` (_form-system.scss:999), label `.jj-toggle-row__label` 13px `#334155`; rows separated by `.jj-divider`.
- **Confirmed height delta**: input **36px** (global) vs `Extends` combobox **32px** (`.jj-select__control` min-height, info.scss:1052) vs native `Type` select **UA default**. The combobox is 4px shorter than the input; the native select is shorter still and visually unaligned.
- **Two conflicting `.input-container` rule sets** (neither applies to bare Name/Type, but they DO govern wrapped fields like DEPENDENCIES and any `<label class="input-container">`):
  - `info.scss:768` `.properties-panel .input-container input/select { height: 36px; radius var(--radius-md)=8px; focus border var(--color-accent)=#334155 }`
  - `info-improvements.scss:1079` `.properties-panel .props-section__body .input-container input/select { height: 28px; radius 4px; focus border #334155 + ring rgba(51,65,85,.15) }` — **more specific**, wins inside section bodies → 28px.
  So even the *wrapped* controls disagree (28 vs 36) depending on whether they sit under `.props-section__body`.
- **Dropdown height**: `maxMenuHeight` unset → default **300px**, no portal; grouped options + headings overflow 300px → scrollbar even with few options. Menu shadow `0 4px 12px rgba(0,0,0,0.08)`, radius 6px, margin-top 4px, z-index 10.
- **Slot selects** (`.jj-slot-value-select`, info-improvements.scss:1553): height **28px**, radius **5px**, custom slate SVG down-triangle arrow (`#94a3b8`, right 8px center), focus border `#94a3b8` + ring `rgba(100,116,139,0.08)` — yet *another* height (28) and radius (5) variant.

---

## 7. Open questions for Alfonso

1. **Toggle ON color — cyan or slate?** Current code: `ui/Toggle` checked = **cyan `#0ea5e9`** (Toggle.module.css:78-79, comment says "active = cyan accent (design system A)"). This contradicts CLAUDE.md §7.1 ("Active `#334155`, slate not cyan") and the 2026-06-02 doc. The slot-value `.bool-toggle--on` is also cyan (`#0ea5e9`). Do the flag toggles stay cyan, or move to slate to match the design-system rule? (Affects whether the new uniform controls use cyan or slate as the "active" hue.)
2. **Cyan target for the active/hovered option**: the prompt wants the focused/hovered dropdown option tinted **cyan**. Which cyan — `#0ea5e9` (sky, used by toggles) or `#06b6d4` (`--color-canvas-accent`)? And the design-system note says cyan is for *interactive states only* while chips stay slate — confirm chips (`multi-value`) stay slate `#f1f5f9` (and fix the white-on-grey label).
3. **Native `Type` select**: replace the bare native `<select>` (Type / Return type / IoT topic) with the same custom react-select skin, or only restyle the native element (appearance:none + slate arrow + slate focus)? The decision in the prompt says "all custom via react-select" — confirm this includes the M1 `jj-slot-value-select` slot editors (9 sites) or only the M2 Type/Return-type.
4. **Combobox divider**: remove the `border-right` divider on `.jj-select__value-container--is-multi` (info.scss:1203) and keep `indicator-separator: none` (already hidden)?
5. **Chevron**: the prompt asks for a single Bootstrap-icon chevron everywhere. react-select draws its own SVG `DropdownIndicator` — to use `bi bi-chevron-*` we must pass a custom `components.DropdownIndicator`. Confirm that's in scope.
6. **Target uniform height**: 36px (input), 32px (combobox), or 28px (slot/section-body)? Pick one as the canonical control height so all four controls align.
7. **Dropdown grow-to-fit**: raise `maxMenuHeight` to a large value, or compute it from option count? And should the menu be portaled (`menuPortalTarget={document.body}`) to escape panel `overflow` clipping?
8. **Debug artifact**: the `border: 1px solid red !important` at info.scss:1197 — confirm it should be deleted as part of the cleanup (it is clearly leftover).

---

## HARD STOP

Read-only discovery complete. No source file created/modified/deleted other than this report. Awaiting the implementation prompt — no fixes proposed-as-applied.
