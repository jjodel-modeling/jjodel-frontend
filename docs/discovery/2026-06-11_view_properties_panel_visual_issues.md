# Discovery — View Properties Panel: Visual Issues Audit (READ-ONLY, Phase 1)

**Date**: 2026-06-11
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery, read-only. NO source modified. NO fix implemented. NO commit.
**Scope of report**: 8 visual issues of the **View** Properties panel ("Apply to" tab of the
default `Class` view), benchmarked against the **metaclass** Properties panel (clean baseline).

---

## 0. Component map (the panel that the prompt screenshots)

The panel in the screenshot is the **classic** Properties panel for a *view*, hosted by:

| Layer | File | Role |
|-------|------|------|
| Tab host + breadcrumb | `frontend/src/components/editors/views/ViewData.tsx` | `.view-editor-header` (back `Btn` + `.path-list` + inline `VIEW` badge) and the tab bar `Apply to / Template / Style / Events / Options` (`ViewData.tsx:112-153`). |
| "Apply to" tab body | `frontend/src/components/editors/views/data/InfoData.tsx` | Name, Is Exclusive, Is Edge, Priority, Preferred appearance, Applicable to, Viewpoint, Parent view, OCL Editor, JS Editor. Root element: `<section className="properties-tab properties-panel">` (`InfoData.tsx:150`). |
| "Apply to" tab styles | `frontend/src/components/editors/views/data/viewapplyto.scss` | **Largely DEAD — see §0.1.** |
| Generic field widgets | `frontend/src/components/forEndUser/Input.tsx` | `Input`, `Select`, `TextArea` (joiner re-exports). Styles in `inputselect.scss`. |
| Editors | `frontend/src/components/editors/languages/{Ocl,Javascript}.tsx` | `OclEditor` / `JsEditor` → `EditorToolbar` + Monaco. |
| Global form CSS | `frontend/src/styles/components/_form-system.scss` | global react-select + number-input rules (imported via `styles/style.scss:2`). |
| **Reference (metaclass)** | `frontend/src/components/editors/Info.tsx` | `PropertiesHeader` (entity header) + `CollapsibleSection` (`GENERAL`/`INHERITANCE`/`FLAGS`). |

**Readonly path (relevant to issues 2,3):** `ViewData.tsx:40` →
`const readOnly = !debug && Defaults.check(view.id)`. The default `Class` view is a `Defaults`
element → **readonly = true** unless debug mode is on. This `readonly` is threaded into `InfoData`
and every field.

### 0.1 ROOT STRUCTURAL FINDING — `viewapplyto.scss` is mostly dead CSS

`viewapplyto.scss` styles classes **`.apply-to-tab`**, **`.form-field`**, **`.form-label`**,
**`.toggle-label`**, **`.apply-to-toggle`**. **InfoData.tsx renders none of these.** It renders
`section.properties-tab.properties-panel` with children `.jj-field`, `.jj-field-label`,
`.jj-toggle-row`, plus the bare widgets from `Input.tsx`. The only rule in `viewapplyto.scss` that
matches the live DOM is the outer-padding rule at line 28
(`.view-editor-tab-content > section.properties-tab.properties-panel`). Everything keyed on
`.apply-to-tab` (input width:100%, the chip palette at 369-400, the monaco-wrapper border at 301,
the spinner-free inputs, the section headers) **never applies**.

The *live* styling of the tab therefore comes from the **baseline** files —
`info.scss`, `info-improvements.scss`, `inputselect.scss`, and the global `_form-system.scss` —
which were written for the **metaclass** panel's `.props-section__body .input-container` field
shape, not for InfoData's flat `.jj-field` + bare-widget shape. **This single mismatch is the
common cause behind issues 1, 5, 7 and part of 4.** (Verified per CLAUDE.md §5.1 "verify consumers
before assuming an output is load-bearing": the `.apply-to-tab` rules have no consumer in the
rendered tree.)

### 0.2 Critical-zone clearance

None of the 8 issues originates in a critical-zone file. They are app-chrome React + SCSS only.
No `DV.tsx`, `defaultViewTemplate.ts`, `VersionFixer.tsx`, `useJjomSync.ts`, or jsxString template
is implicated. A Phase-2 fix touching only the files listed here needs **no VersionFixer migration**.

---

## BUGS (1–3)

### Issue 1 — Black / illegible chip in "Applicable to" multiselect
**Confidence: MEDIUM (direction firm; exact black-pixel cause needs DOM inspection)** · **Fix size: S**

**Files**
- `InfoData.tsx:289-302` — the field: `<Select … field='appliableToClasses' isMultiSelect options={classesOptions}>`.
- `Input.tsx:335-404` — multiselect branch → renders `<MultiSelect …>`.
- joiner: `frontend/src/joiner/index.ts:10,64` — `MultiSelect = MSelect = (bare) 'react-select'`.
- `Input.tsx:353-354` — `classNamePrefix="jjodel-select"`, `styles={…}` inline.
- Live chip CSS: `inputselect.scss:190-210` (`.input-container .jjodel-select__multi-value`),
  `_form-system.scss:543-555` (global), `_form-system.scss:820-828` (dark-mode block).
- Dead chip CSS: `viewapplyto.scss:369-400` (`.apply-to-tab … [class*="-multiValue"]`).

**Answers to the prompt's sub-questions**
- (a) **Bare `react-select`, NOT the `JjSelect` wrapper.** `MultiSelect` is the raw default export
  of `react-select` (`index.ts:64`). It did **not** go through the JjSelect migration. The
  `JjSelect` component (`components/ui/JjSelect/JjSelect.tsx`) is never used here.
- (b) Chip colors come from a 3-way `!important` stack on the `jjodel-select__multi-value(/__label)`
  classes: `_form-system.scss` (global, light `#e2e8f0` bg / `#334155` label; dark block `#334155`
  bg / `#e2e8f0` label) and, *if* the `.input-container` ancestor is present, `inputselect.scss`
  (`#f1f5f9` bg / `#334155` label). The inline emotion `styles.multiValue` (`Input.tsx:385-389`)
  sets only `margin`/`flexShrink`, no color. The `viewapplyto.scss` chip block is **dead** (§0.1).
- (c) **Empty label is unlikely.** The chip set is rebuilt at `Input.tsx:341-344` by matching stored
  ids against option objects; only *matched* options (which always carry a non-empty `label`,
  `InfoData.tsx:88-94`) are pushed. A stored id with no matching option produces **no chip**, not an
  empty one. So "empty solid block" is not the expected failure mode.

**Two concrete, testable hypotheses for the black pill** (a static trace did **not** unambiguously
produce black in light mode — flagged honestly):
1. **`.input-container` class is lost on the wrapper** → the carefully-tuned readable chip rules in
   `inputselect.scss` do not apply, leaving the weaker global `_form-system.scss` rules (and, in
   dark mode, `#334155` bg). Mechanism: `Input.tsx:446` renders
   `<label className={'input-container'} {...rootprops}>`, but `rootprops.className` is set to `''`
   at `Input.tsx:296` and, being spread *after* the literal, **overrides** `'input-container'` with
   an empty string. Worth confirming in the DOM.
2. **Theme-dependent cascade**: if the panel is rendered in dark mode (or import order flips the tie
   between `_form-system.scss` dark bg and the label-color rule), the chip can land on a dark bg
   while the label color resolves dark → dark-on-dark.

**Fix sketch (do the check FIRST, per CLAUDE.md §5.1)**: inspect the live chip element — its class
list (does it carry `jjodel-select__multi-value`? is there an `.input-container` ancestor?), its
computed `background-color`/`color`, the winning rule, and the active theme. Then either (i) restore
the `.input-container` class on the wrapper, or (ii) migrate the field to `JjSelect`, or (iii) add a
single scoped readable rule under `.properties-panel .jj-field .jjodel-select__multi-value{…}`.

**Risk/blast radius**: `.jjodel-select__*` classes are shared by **every** multiselect in the app
(`grep jjodel-select` → `_form-system.scss`, `inputselect.scss`, many tabs). Any global edit is
high blast radius. The safe fix is a new selector scoped under `.properties-panel .jj-field`
(verify no collision first). Touching `Input.tsx:446`/`:296` is low-visual-risk but affects *all*
`<Input>`/`<Select>` wrappers — treat as a separate, carefully-verified change.

---

### Issue 2 — "Parent view" select shows native text-selection highlight
**Confidence: HIGH** · **Fix size: S**

**Files**
- `Input.tsx:104-121` — `useLayoutEffect` (deps `[visible]`, runs once on mount).
- `InfoData.tsx:323-339` — Parent view `<Select field='father'>` (the *last* `Input.tsx` widget in the tab).

**Root cause (code-confirmed).** On mount every `Input`/`Select`/`TextArea` runs
`useLayoutEffect` → `inputRef.current.focus()`; for an `<input>` it calls `.select()`, **for
anything else** (`<select>`, `<label>`) it builds a `Range` and `selectNodeContents(input)` +
`selection.addRange(range)` (`Input.tsx:110-118`). For a `<select>` this paints the native
text-selection highlight on the visible option ("Package").

**Why only Parent view and not Viewpoint (right above it)?** Nothing differs in the component — it
is **mount order**. Only one DOM `Selection` can exist at a time; the *last* widget to run its layout
effect wins. In InfoData the last `Input.tsx`-based widget is **Parent view** (`father` select,
`InfoData.tsx:323-339`); Viewpoint (`:304-321`) runs just before it and gets its selection
overwritten. (Is Exclusive/Is Edge use the `Toggle` from `components/ui`, not `Input.tsx`, so they
do not participate.)

**Fix sketch**: the focus+select-on-mount is an "edit-in-place" affordance that should not fire for
`<select>` (or for readonly fields). Gate the effect: skip when `props.tag === 'select'`, when
`readOnly`, or when the element is not a freshly-revealed editable input.

**Risk/blast radius**: `Input.tsx` is used app-wide; the effect's auto-select is *intended* for the
inline-rename inputs (double-click → text pre-selected). Narrow the gate to `<select>`/readonly so
the rename UX is preserved. Verify the classic inline-rename flows after any change.

---

### Issue 3 — "Name" renders as gray placeholder instead of value
**Confidence: HIGH** · **Fix size: XS (likely "by design"; cosmetic only)**

**Files**
- `ViewData.tsx:40` — `readOnly = !debug && Defaults.check(view.id)` → **true** for default views.
- `InfoData.tsx:152-158` — Name `<Input data={view} field='name' readOnly={readOnly}>`.
- `Input.tsx:283-284` — when readOnly, the `<input>` gets `readOnly` **and** `disabled`.

**Answers**
- (a) **Yes, intentionally read-only.** The default `Class` view is a `Defaults` element, so
  `Defaults.check` returns true → `readOnly` true → the input is `disabled`.
- (b) **No, "Class" is the real value**, not a placeholder. The Name field has **no** `placeholder`
  prop; `value` is `view.name` ("Class"). The gray look is the **disabled** rendering
  (browser default gray text, plus any `:disabled`/`[readonly]` rule). It merely *reads* like a
  placeholder.
- (c) Intended editability: default views are locked (you cannot rename the built-in `Class` view),
  so read-only is correct. The only problem is that "disabled" visually masquerades as "empty".

**Fix sketch**: cosmetic — give disabled values in the panel a darker, filled appearance (value
color `#334155`, not the `#94a3b8` placeholder slate) so a locked value doesn't look empty;
optionally render the name as static text + a lock affordance for default views.

**Risk/blast radius**: low. A disabled-input color rule scoped to `.properties-panel .jj-field`
won't affect the metaclass panel (different markup). Do not remove the read-only gate.

---

## CONSISTENCY POLISH (4–8)

### Issue 4 — OCL editor: double/heavy borders + native resize handle + first-line gray
**Confidence: HIGH (resize, first-line) / MEDIUM (exact border count)** · **Fix size: S**

**Files**
- `languages/Ocl.tsx:43-59` — wrapper `<div className="monaco-editor-wrapper" style={{…resize:'vertical', overflow:'hidden', padding:'5px'}}>` + `@monaco-editor/react` `<Editor>`.
- `languages/Javascript.tsx:101-112` — same shape (also `resize:'vertical'`).
- `EditorToolbar.tsx:100-115` + `EditorToolbar.scss:13-15` — the chevron+icon header (`border-bottom`, `border-radius:6px 6px 0 0`, `background:#f8fafc`).
- Live `.monaco-editor-wrapper` CSS: `styles/style.scss:640` (radius only, **no border**), `_form-system.scss:921` (`min-height` only). The intended border in `viewapplyto.scss:301` is **dead** (§0.1).
- `monacoConfig.ts:74` — `compactMonacoOptions.renderLineHighlight: 'line'` (OCL); `:131` `mediumMonacoOptions.renderLineHighlight: 'all'` (JS).

**Answers**
- (a) Wrapper chain: `OclEditor` → `EditorToolbar` (header) + `.monaco-editor-wrapper` div → Monaco `<Editor>`.
- (b) Bordered containers stacked: **(1)** the `EditorToolbar` header box (border-bottom + top
  radius); **(2)** Monaco's own editor frame/background. The intended wrapper border
  (`viewapplyto.scss:301`) does **not** render (dead selector), so the "double border" is the
  toolbar header meeting the Monaco frame — *confirm the exact count by inspecting the element*
  (a docked-panel rule `skeleton.scss:78` `.dock-style-editors .dock-tabpane:has(input) .monaco-editor-wrapper`
  may also contribute if the panel is inside a dock tab — verify).
- (c) **The native resize grabber is intentional inline CSS**: `resize:'vertical'` on the wrapper
  (`Ocl.tsx:44`, `Javascript.tsx:102`). It clashes with the design system; `EditorToolbar` already
  provides an expand button, so the native grabber is redundant.
- (d) **First-line gray = Monaco current-line highlight**: `renderLineHighlight:'line'`
  (`monacoConfig.ts:74`) for OCL — not a CSS residue.

**Fix sketch**: drop the inline `resize:'vertical'` (use the toolbar expand button); set
`renderLineHighlight:'none'` for these compact editors (or override the line-highlight color);
collapse the bordering to a single container border (one wrapper border + the toolbar's top radius).

**Risk/blast radius**: `monacoConfig.ts` presets are shared by many editors — prefer per-instance
`options={{renderLineHighlight:'none'}}` over editing the shared preset. `.monaco-editor-wrapper` is
a very common class — scope any new border rule to the properties panel.

---

### Issue 5 — Priority number input shows native spinners
**Confidence: HIGH** · **Fix size: XS**

**Files**
- `InfoData.tsx:240-255` — Priority `<Input type='number'>` → renders `<input type="number">`.
- `_form-system.scss:189-199` — **global** `input[type="number"]` rule that *forces spinners visible*: `-webkit-appearance: inner-spin-button; opacity: 1`.
- Existing hide conventions (proof the pattern exists): `viewoptions.scss:707-708`, `skeleton.scss:209-210`, `nestedView.scss:1459` (`-moz-appearance: textfield`).

**Answers**
- (a) Yes, it is a native `<input type="number">` (`InfoData.tsx:248`).
- (b) A hide convention exists in several SCSS files, but **none reaches this input**: the Priority
  field is `.properties-panel .jj-field input[type=number]` (no width/appearance rule —
  `info-improvements.scss:1169` is empty), and the *global* `_form-system.scss:189-199` actively
  **un-hides** spinners. So the default spinners show.

**Fix sketch**: add, scoped to the panel,
`.properties-panel .jj-field input[type="number"]{ -webkit-appearance:none; appearance:none; -moz-appearance:textfield } &::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0 }`.

**Risk/blast radius**: low if scoped to `.properties-panel .jj-field`. Do **not** edit the global
`_form-system.scss:189-199` (it deliberately shows spinners elsewhere).

---

### Issue 6 — Missing entity header
**Confidence: HIGH** · **Fix size: M**

**Files**
- Metaclass entity header: `Info.tsx:889-914` `PropertiesHeader` (+ `getElementTypeInfo` `:860-887`, `HelpButton`, `jj-type-badge`).
- View breadcrumb header: `ViewData.tsx:112-133` (`CommandBar` back `Btn` + `.path-list` + inline `.breadcrumb-type-badge`).

**Anatomy comparison**

```
METACLASS (clean)                         VIEW (current)
.props-header                             .view-editor-header
├─ .props-header__icon  <i bi-box>        ├─ <CommandBar><Btn icon=back></CommandBar>
├─ .props-header__name  "Class"           └─ .path-list
├─ .jj-type-badge--class "Class"              ├─ .path-element  "Default" › "Model" › … "Class"
└─ <HelpButton>  (i)                          └─ .breadcrumb-type-badge.view  "VIEW"
   (+ separate light-blue breadcrumb band)
```

**Answers**
- (a) Metaclass header = `PropertiesHeader` (Info.tsx).
- (b) View header = the `.view-editor-header` block in `ViewData.tsx`.
- (c) **No shared structure** — different components, different class namespaces
  (`.props-header*`/`.jj-type-badge` vs `.view-editor-header`/`.path-list`/`.breadcrumb-type-badge`),
  no common header primitive.
- (d) Feasibility **MEDIUM**: give views the same anatomy by adding an icon + `view.name` +
  `VIEW` badge + `HelpButton` row, keeping the back arrow. Blockers: `PropertiesHeader` is **local**
  to `Info.tsx` (not exported) and `getElementTypeInfo` has **no `DViewElement` case** (`:884`
  default → "Element"/`bi-square`). Either export+extend `PropertiesHeader` (add a view icon, e.g.
  `bi-eye`, and badge), or build a parallel `ViewHeader` in `ViewData.tsx` reusing the `.props-header`
  classes. Not a one-liner.

**Risk/blast radius**: `PropertiesHeader`/`getElementTypeInfo` are used by the metaclass panel — if
you export+extend them, verify no regression there. A parallel header in `ViewData.tsx` is lower
risk (additive).

---

### Issue 7 — Inconsistent input widths
**Confidence: HIGH** · **Fix size: S**

**Files**
- `Input.tsx:324-331` — wrap logic: a `<Select>`/`<Input>` with no label/postlabel and not
  multiselect renders **bare** (`wrap=false`) — no `.input-container` wrapper.
- Width rules that **don't reach** these fields: `info-improvements.scss:1119-1163` (scoped to
  `.properties-panel .props-section__body .input-container` / `.properties-fields .input-container`);
  `info-improvements.scss:1169` (`.properties-panel .jj-field input[type=text]`) is **empty**.
- Dead width rules: `viewapplyto.scss:78-114` (`.apply-to-tab input/select width:100%`).

**Root cause.** InfoData renders **bare** `<input>` / `<select>` directly under `.jj-field`
(Name, Priority, Preferred appearance, Viewpoint, Parent view all hit the `wrap=false` path). The
panel's `width:100%` normalization is keyed on the **metaclass** field shape
(`.props-section__body .input-container`), which InfoData does not produce, and the `.apply-to-tab`
width rules are dead (§0.1). With no width rule applied, each native `<select>` **auto-sizes to its
widest `<option>`**: "Preferred appearance" (long `GraphElements.cname` values) → ~570px; Viewpoint/
Parent view (vp/view names) → ~350px; Name (text input intrinsic) → ~300px. (The multiselect
"Applicable to" has its own min-width from `inputselect.scss`, adding to the inconsistency.)

**Answers**
- (a) Widths are **not** set per-field; they're the browser's intrinsic content-based sizing because
  the intended `width:100%` rules don't match the rendered selectors.
- (b) Yes — the metaclass panel's fields sit in `.props-section__body .input-container`, which **does**
  get `width:100%` (`info-improvements.scss:1146-1156`); InfoData's flat `.jj-field` + bare widgets
  do not.

**Fix sketch**: add `.properties-panel .jj-field input, .properties-panel .jj-field select{ width:100%; box-sizing:border-box }`
(and a sensible `max-width` for Priority). Optionally wrap InfoData fields in `.input-container` to
inherit the baseline. Grep the new selector first.

**Risk/blast radius**: scoping under `.properties-panel .jj-field` avoids the metaclass panel and the
workbench `ViewProperties.tsx`. Verify no other `.jj-field` consumer relies on auto-width.

---

### Issue 8 — Section style mismatch (chevron+icon vs uppercase collapsible)
**Confidence: HIGH** · **Fix size: S–M**

**Files**
- Metaclass uppercase sections: `Info.tsx:36-60` `CollapsibleSection` →
  `.props-section` / `.props-section__header` / `.props-section__title` (uppercase) /
  `.props-section__chevron` / `.props-section__body`. Used as `<CollapsibleSection title="GENERAL">` etc.
- OCL/JS inline headers: `EditorToolbar.tsx:100-160` — `.editor-toolbar` with chevron +
  `bi-braces`/`bi-filetype-js` icon + title + action buttons (wrap/copy/expand/fullscreen).

**Answers**
- (a) The uppercase collapsible section is `CollapsibleSection` (Info.tsx:36). It is **local** to
  `Info.tsx` (not exported).
- (b) Reusable in principle — it is a thin presentational wrapper — but the OCL/JS headers are **not**
  plain section headers: `EditorToolbar` carries editor-specific controls (wrap toggle, copy,
  expand, fullscreen). You cannot simply swap `EditorToolbar` for `CollapsibleSection` without
  losing those controls.
- (c) Blocking constraint: the editor header needs its toolbar icons. A consistent look means
  **restyling `EditorToolbar` to match `.props-section__header`** (uppercase title, same chevron,
  same border treatment) while keeping its action buttons — or hosting each editor inside a
  `CollapsibleSection` and moving the toolbar buttons into `headerRight`.

**Fix sketch**: align `EditorToolbar.scss` typography/borders to `.props-section__header`
(uppercase 11px title, slate chevron, single bottom border), or wrap OCL/JS in `CollapsibleSection`
with the toolbar buttons passed as `headerRight`. Export `CollapsibleSection` if reused.

**Risk/blast radius**: `EditorToolbar` is shared by many editors (OCL, JS, console, MTM, function
editors) — restyling it changes all of them. Prefer a variant/prop or a panel-scoped override.
`CollapsibleSection` export touches `Info.tsx` (metaclass panel) — verify no regression.

---

## Summary table

| # | Issue | Bucket | Root-cause confidence | Fix size |
|---|-------|--------|----------------------|----------|
| 1 | Black chip in "Applicable to" | Bug | **Medium** (bare react-select confirmed; black-pixel cause needs DOM check) | S |
| 2 | Parent view text-selection highlight | Bug | **High** (`useLayoutEffect` select-on-mount, last select wins) | S |
| 3 | Name renders gray (placeholder-like) | Bug | **High** (read-only/disabled default view; value is real) | XS |
| 4 | OCL editor borders + resize + 1st-line gray | Polish | **High** resize/line, **Medium** border count | S |
| 5 | Priority native number spinners | Polish | **High** (global form-system forces spinners; no panel hide) | XS |
| 6 | Missing entity header | Polish | **High** (PropertiesHeader vs view-editor-header; not shared) | M |
| 7 | Inconsistent input widths | Polish | **High** (width:100% rules don't match `.jj-field` bare widgets) | S |
| 8 | Section style mismatch | Polish | **High** (CollapsibleSection vs EditorToolbar) | S–M |

**Cross-cutting**: issues 1, 5, 7 (and part of 4) share one root cause — `viewapplyto.scss` is keyed
on `.apply-to-tab`/`.form-field`, which InfoData does not render (§0.1). A Phase-2 plan should decide
up front whether to (A) re-point the panel CSS to the live `.properties-panel .jj-field` selectors,
or (B) wrap InfoData fields in the baseline `.input-container`/section structure. Option B converges
the view panel onto the metaclass baseline and resolves 1/5/7 + the header/section work together,
but is the larger change.

**HARD STOP**: report only. No source modified, no fix implemented, no commit. Report file left
untracked.
