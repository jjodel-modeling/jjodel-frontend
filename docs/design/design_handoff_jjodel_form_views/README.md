# Handoff: Jjodel Form Views (form rendering of views)

## Overview
Jjodel views today render model elements as graphical symbols on the canvas. This design adds a second rendering mode for the same view: the **form**, with editable widgets. The same view (same fields, same applicability conditions) can render as a symbol or as a form, in three hosts:

1. **Properties rail** (right side, 320px) for the element selected on canvas or tree.
2. **Form document**: a workbench tab without canvas; instance list on the left, detail form on the right.
3. **Form inside the node**: a canvas node whose content renders as widgets instead of text rows.

The design covers the visual form of these hosts, four themes, all validation states, and the authoring panel where the view author configures the form rendering.

## About the Design Files
The bundled `Jjodel Form Views.dc.html` is a **design reference created in HTML** — a static, pixel-accurate mockup, not production code. The task is to **recreate these designs in the Jjodel frontend** (React 18, TypeScript, SCSS) using its existing token system (`frontend/src/styles/tokens/`) and component patterns. Do not ship the HTML.

## Fidelity
**High-fidelity.** Colors, typography, spacing, control heights and states are final and should be matched exactly, mapped onto the existing SCSS tokens rather than hard-coded.

## Example domain used in mockups
Statechart metamodel. **State**: `name` string [1..1], `kind` enum {initial, normal, final} [1..1], `entryAction` JjEL string [0..1], `timeout` number [0..1], `isHistory` boolean, `outgoing` ref to Transition [0..*], `substates` containment of State [0..*], `tags` string [0..5]. **Transition**: `source`/`target` refs to State [1..1], `trigger` [0..1], `guard` JjEL [0..1]. Instances: Idle, Running, Paused, Done; transitions start, pause, resume, finish.

## Artboards (ids in the HTML file)
- **1a / 1b** — Properties rail, plain theme, Basic vs Advanced (320px).
- **2a / 2b / 2c / 2d** — Rail in the four themes: plain, card, compact, inspector (all Advanced).
- **3a** — All validation states, plain theme, annotated. Includes an open reference picker with search.
- **4a** — Form document, 1440×900, card theme; plus empty state (no instance selected).
- **5a** — 800×500 canvas: classic symbol node vs widget-form node (compact, selected) vs collapsed form node.
- **6a / 6b** — View authoring panel, Form tab, Basic vs Advanced.
- **7a** — Design recommendations (in Italian; summarized below).

## Anatomy of a field
- **Label row**: label 11px / 500 / `#475569`; required marker = 4px cyan `#0ea5e9` rounded dot right after the label (lower bound ≥ 1; no red asterisk); multiplicity right-aligned, IBM Plex Mono 10px `#94a3b8` (e.g. `1..1`, `0..5`).
- **Value**: 13px `#0f172a`; input height **28px** (plain/card), **26px** (inspector), **24px** (compact); border `1px #e2e8f0`, radius 4px, white bg.
- **Message slot**: fixed **16px** row below the field, always reserved → validation messages never shift layout. Icon 9px + text 11px.
- **Label placement**: above (default); left with 88px label column only in compact theme.

## Widgets
- **Text single line** (`name`, `trigger`): plain input.
- **Multiline JjEL** (`entryAction`, `guard`): IBM Plex Mono 12px, height 44–56px, "JjEL" hint in mono 10px next to label.
- **Number stepper** (`timeout`): value + two 24px-wide `-` / `+` segments separated by hairlines, inside the input border.
- **Checkbox** (`isHistory`): 14px box, 1px `#cbd5e1` border, radius 3px; label 13px to the right ("History state").
- **Select** (`kind`): input with `bi-chevron-down` 11px `#94a3b8` right.
- **Reference picker** (`source`, `target`): input showing metaclass letter badge + element name + chevron; click opens popover (white, border `#e2e8f0`, radius 6px, shadow `0 4px 12px rgba(0,0,0,0.08)`) with a 28px search row and 26px candidate rows; highlighted candidate uses canvas cyan (`#e0f7fa` bg + 2px `#0891b2` left bar). Empty: link icon + "Select a State" placeholder `#94a3b8`.
- **Reference list** (`outgoing`): 28px rows (badge T, name, "to Target" secondary, `bi-x` remove right) + dashed "Add" button (24px, dashed `#cbd5e1`, 11px).
- **Children list** (`substates`): like reference list plus chevron; a row expands into an inline sub-form (24px fields, `#f8fafc` header). Mockup shows one expanded (Warmup) and one collapsed (Steady).
- **Value list** (`tags`): chips 20px (`#f1f5f9` bg, `#e2e8f0` border, radius 4px, 11px, `bi-x`) inside a bordered container, dashed "Add" chip inline.

Entity letter badges: State "S" = `#fef3c7` / `#b45309` (model amber); Transition "T" = `#cffafe` / `#0e7490`. Sizes 14–18px, radius 3–4px, 9–10px / 600.

## Themes (sections map to the view's compartments: Identity, Behavior, Transitions, Substates)
- **plain**: fields in column, section title 12px / 600 / uppercase / 0.06em / `#64748b`, 1px `#f1f5f9` separators between sections, panel padding 12px.
- **card**: panel bg `#f8fafc`; each section a white card (border `#e2e8f0`, radius 6px) with a bordered header row.
- **compact**: labels left (88px), 24px fields, 12px values, section titles 11px `#94a3b8`; multiplicity may drop to tooltip.
- **inspector**: full-bleed collapsible section headers, 28px, `#f8fafc` bg, chevron 10px + uppercase 11px / 600 / 0.08em `#475569`, count in mono right; 26px fields.

## Rail chrome (all themes)
Header row "PROPERTIES" (11px / 600 / uppercase / 0.08em `#94a3b8`) + Basic/Advanced segmented toggle (bg `#f1f5f9` radius 4, active segment white with `0 1px 2px rgba(0,0,0,0.06)`). Element row: letter badge + name 13px / 600 + metaclass 11px `#94a3b8`. Then the **problem summary slot**: fixed 32px, bg `#fcfdfe`, hairline bottom; with issues: "N errors" red `#b91c1c` + "N warnings" amber `#b45309`, each with filled icon, clickable → scrolls to field; without: muted "No issues" with `bi-check-circle`. Basic shows only `name`, `kind`, `outgoing`; Advanced shows everything.

## Validation states (3a) — diagnostic, never blocking
- Required empty: red `#ef4444` border + "Required" in slot.
- Invalid value: red border + specific message ("timeout must be positive").
- Warning: amber `#f59e0b` border + amber message ("State has no outgoing transitions").
- List at upper bound: Add chip disabled (border/text `#e2e8f0`/`#cbd5e1`, `cursor:not-allowed`) with tooltip "Maximum 5" (slate `#334155` bg, white 10px).
- Required reference unresolved: red border on picker, "Required reference not set"; picker stays clickable.
- Read-only derived: `#f1f5f9` fill, `#64748b` mono text, `bi-lock-fill` 9px by the label, "derived" instead of multiplicity.
- Dirty: cyan dot with 2px `rgba(14,165,233,0.2)` halo before label + `#7dd3fc` border + "Modified, not saved" `#0284c7`.
- Focus: border `#334155` + `box-shadow: 0 0 0 3px rgba(51,65,85,0.15)`.

## Form document (4a)
Workbench tab bar 38px (`#f1f5f9`, tabs 30px, active tab `#f8fafc` with border and no bottom edge). Left list 300px: "STATES · 4" eyebrow + 24px icon button (plus) + 28px search; 34px rows: badge S, name 13px, kind badge (pill 16px: initial `#ede9fe`/`#6d28d9`, normal `#f1f5f9`/`#475569`, final `#d1fae5`/`#047857`), issue count right (amber/red icon + n). Selected row: `#e0f7fa` + 2px `#0891b2` left bar. Right: 760px column — header (22px badge, name 16px/600, path `machine.Running`, Basic/Advanced toggle), 32px summary slot, then card-theme sections in a 2-column grid, gap 12px. Empty state: centered `bi-ui-checks` 28px `#cbd5e1`, "No state selected", helper 12px, primary button (slate `#334155`, white, 28px, radius 6) "New state".

## Form inside node (5a)
Canvas: `#f8fafc` with 16px dot grid (`#dbe3ec` 1px dots). Edges: 1.5px `#64748b` curves with arrowheads; labels 11px `#475569` on `rgba(255,255,255,0.9)` halo rects.
- Symbol node: white, border `#cbd5e1`, radius 8; header with kind dot + name; text compartment 11px.
- Widget node (compact): 260px, selected = 1.5px `#06b6d4` border + `0 0 0 3px rgba(6,182,212,0.12)`; header 12px with badge and collapse chevron; 22px fields, labels left 64px 10px; truncation footer "+3 more fields" (opens the rail).
- Collapsed form node: 130px, header + summary line "8 fields · ⚠1".

## Authoring panel (6a/6b)
Rail 320px, header "StateView" with `bi-eye` (viewpoint pink `#db2777`). Tab row: `Applies to | Structure | Symbol | Form | Source`, active = 11px/600 `#0f172a` + `inset 0 -2px 0 #334155`. Basic: Theme select, Labels segmented (Above/Left), info note that widgets derive from feature types. Advanced adds: **Widgets table** (24px header row, 30px rows: feature name in mono 12px, widget select 110px; overridden default flagged with a 5px cyan dot + legend) and **References and children** rows with a 3-way mini segmented `Inline | List | Hidden` (outgoing=List, substates=Inline).

## Interactions & behavior
- Basic/Advanced toggle filters fields per view configuration (default heuristic: lower bound ≥ 1 + semantically central features; overridable per feature — recommended future column "Visibility" in the widgets table).
- Problem summary chips scroll to and focus the offending field.
- Validation is diagnostic only; editing is never blocked. Messages occupy the reserved 16px slot (or tooltip) — **zero layout shift** is a hard requirement, including the 32px summary slot.
- Reference picker opens a searchable candidate popover; keyboard: type-to-filter, arrows, Enter.
- Children rows expand/collapse inline sub-forms; node form collapses to header + count.
- Transitions/motion: 150ms ease-out hover/focus per Jjodel tokens.

## State management (per form instance)
- `mode: 'basic' | 'advanced'` (persisted per user per view).
- `dirtyFields: Set<featureId>`; commit on blur/Enter.
- `diagnostics: {featureId, severity: 'error'|'warning', message}[]` from the validation viewpoint; summary derives counts.
- Picker: `open`, `query`, `highlightedCandidate`.
- Section collapse state (inspector theme, node form).
- View author config: `theme`, `labelPlacement`, per-feature `widget` override, per-reference `treatment: inline|list|hidden`.

## Design tokens
Colors: slate text `#0f172a` / `#475569` / `#64748b` / `#94a3b8`; borders `#e2e8f0` / `#cbd5e1`; fills `#ffffff` / `#f8fafc` / `#f1f5f9` / `#fcfdfe`; accent slate `#334155`; cyan `#0ea5e9` (required/dirty markers), canvas cyan `#06b6d4` / `#0891b2` / `#e0f7fa` (selection); error `#ef4444` / `#b91c1c`; warning `#f59e0b` / `#b45309`; enum badges as listed above.
Type: Inter (UI), IBM Plex Mono (multiplicities, JjEL, derived values, counts, feature names). Sizes: 16 (doc title), 13 (values/names), 12 (section titles, compact values), 11 (labels, messages, chips), 10 (multiplicity, micro).
Spacing: 4px grid; panel padding 12px (rail) / 24px (document); field gap 10–12px (plain), 4–5px (compact).
Radius: 3 (checkbox, small badges), 4 (inputs, chips, buttons), 5–6 (cards, popovers, selected rows), 8 (rail/node frames).
Focus ring: `0 0 0 3px rgba(51,65,85,0.15)` + `#334155` border.

## Recommendations (accepted design decisions)
1. **Labels above** in the 320px rail; labels left only in compact theme.
2. **Required = 4px cyan dot; multiplicity = mono 10px gray right of label.** Red is reserved for diagnostics.
3. **Default themes: plain for the rail, card for the document.** Inspector is the best rail alternative for many-section models; compact is opt-in.
4. **Widget node is viable only in compact theme, capped at 5–6 fields, min width ~240px**, with "+N more fields" opening the rail; otherwise degrade to the collapsed form (header + field/problem counts).

## Assets
Bootstrap Icons v1.13 (CDN) — glyphs used: `bi-chevron-down/up/right`, `bi-x`, `bi-plus`, `bi-dash`, `bi-search`, `bi-x-circle-fill`, `bi-exclamation-triangle-fill`, `bi-check-circle`, `bi-lock-fill`, `bi-link-45deg`, `bi-diagram-3`, `bi-ui-checks`, `bi-eye`, `bi-info-circle`. Fonts: Inter, IBM Plex Mono (already in the codebase). No images.

## Files
- `Jjodel Form Views.dc.html` — the full mockup (open in a browser; artboards 1a–7a). `support.js` is its runtime helper; ignore for implementation.
