# Handoff: Jjodel editor side panel (Structure + Inspector)

## Overview

Redesign of the right-hand rail of the Jjodel project editor — today two stacked
floating cards ("TREE VIEW" and "PROPERTIES"). The redesign replaces them with a
single continuous rail whose layout is a user preference with four presets
(`1a`, `1b`, `2a`, `3a`).

**The preset is gated by the editor's existing Basic / Advanced mode:**

- **Basic mode — preset `2a` only.** No settings gear, no picker, no other layout.
  Basic users get one panel and never make this decision.
- **Advanced mode — the full picker.** The gear appears in the header and all four
  presets are selectable, exactly as in section `4a` of the design file.

`2a` is therefore both the Basic-mode layout and the default in Advanced mode.

Goals, in priority order: lower cognitive load, higher information density at the
same type sizes, IDE-grade craft.

Problems being fixed (measured on the current panel):

1. Two cards, four header bars, two shadows and two borders inside a ~400px rail.
2. Six section headers (`GENERAL`, `TYPE & BOUNDS`, `ADVANCED`, `FLAGS`,
   `ADVANCED STATE`, `NODE`) rendered with identical weight → no hierarchy;
   `ADVANCED` vs `ADVANCED STATE` is ambiguous.
3. Label-over-field stacking: two fields consume ~300px; only ~3 properties fit
   above the fold.
4. Multiplicity expressed three times (Lower stepper, Upper stepper, read-only
   `[0..1]` chip) for one decision.
5. Selection stated three times within 40px (tree highlight, title row, breadcrumb).
6. The `Basic / Advanced` toggle that governs this panel lives in the top app bar.

Result: 3 → 9 properties above the fold in the same 400px rail, without shrinking
any text.

## About the Design Files

`Jodel Side Panel.dc.html` in this bundle is a **design reference written in HTML**
— a working prototype of the intended look and behavior, not production code to
copy. Implement it inside the Jjodel frontend (React + TypeScript + SCSS) using its
existing patterns: the SCSS token files under `frontend/src/styles/tokens/`,
`entityMeta.ts` for entity colors/icons/letters, and Bootstrap Icons (`bi-*`),
which the app already depends on. Do not introduce a new styling approach, a new
icon set, or new color values — every value below already exists as a token.

Open the file in a browser to interact with it. It contains four turns stacked
vertically; **the section to implement is the one badged `4a`, at the top**
("Configurable rail"). Turns 1–3 below it are the earlier explorations and exist
only as rationale — do not implement them separately, `4a` contains all four
presets.

## Fidelity

**High-fidelity.** Colors, type, spacing, control heights, radii, motion and copy
are final and are all drawn from the existing token system. Recreate pixel-for-pixel
using the codebase's SCSS tokens and components.

## Screens / Views

There is one view — the editor's right rail — with four layout presets driven by a
single user setting, itself gated by the app's Basic / Advanced mode. In Basic mode
only `2a` exists and the gear is not rendered; in Advanced mode all four are
selectable. All presets share the same DOM structure and styling; they differ only
in three booleans:

| Preset | Name | `tabs` | `collapsibleTree` | `recent` |
|---|---|---|---|---|
| `1a` | Unified rail | off | off (tree fixed) | off |
| `1b` | Inspector first | on | n/a (tabs own it) | off |
| `2a` | Adaptive rail (**default**) | off | on | off |
| `3a` | Adaptive + Recent | off | on | on |

### Rail container

- Width: **420px** (the current rail is 400px; 400–460 all work — the layout is fluid).
  Minimum usable width 360px. Height: fills the editor viewport.
- Background `#ffffff`, border `0.5px solid #e2e8f0`, `border-radius: 12px`,
  `box-shadow: 0 4px 16px rgba(15,23,42,0.07)`, `overflow: hidden`.
- `display: flex; flex-direction: column`. Zones top to bottom:
  header → (tabs) → (Recent) → tree pane → (focus breadcrumb bar) → inspector → footer.
- Only the tree pane and the inspector body scroll. Header, tabs, Recent header,
  breadcrumb bar and footer are `flex: none` and never scroll away.

### 1. Header — 44px, `flex: none`

`padding: 0 8px 0 12px`, `border-bottom: 1px solid #eef2f7`, `user-select: none`.

Left → right, `gap: 8px`:
- Entity badge of the open metamodel: 18×18, `border-radius: 4px`, bg
  `--color-entity-metamodel-bg` `#eeedfe`, fg `#534ab7`, letter `M`, 11px/700.
- Metamodel name: 13px/600, `#0f172a`, `letter-spacing: -0.01em`.
- Metamodel name must be the only flexible item: `min-width: 0; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis`. Every control after it is `flex: none`.
- Spacer (`flex: 1; min-width: 8px`).
- **Focus / Browse button** (presets `2a`, `3a` only): **icon-only 26×26**,
  `border: 1px solid #e2e8f0`, `radius: 6px`, bg `#fff`, icon 12px `#475569` —
  `bi-arrows-collapse` in Browse (tooltip "Focus") / `bi-arrows-expand` in Focus
  (tooltip "Browse"). Hover: border `#94a3b8`, icon `#0f172a`.
  A text label does not fit once the Basic/Advanced segmented is present: at 420px
  the header budget is badge 18 + Basic/Advanced 121 + gear 26 + collapse 26 +
  Focus 26 + gaps ≈ 265px, leaving ~155px for the title. Keep the label only if you
  drop the segmented from the header.
- **Basic / Advanced segmented** (the app-mode toggle, moved here from the top app
  bar so it sits next to what it governs): `flex: none`, 2px padding, bg `#f1f5f9`,
  `radius: 6px`, `gap: 2px`; each button 22px tall, `padding: 0 8px`, `radius: 4px`,
  11px/600. Active: bg `#fff`, text `#0f172a`, `box-shadow: 0 1px 2px rgba(15,23,42,0.1)`.
  Inactive: transparent, `#64748b`. If your top bar keeps owning this toggle, omit it
  here — but then the panel must still react to the mode exactly as described below.
- **Settings gear** (**Advanced mode only** — omitted entirely in Basic, not
  disabled): 26×26 icon button, `radius: 6px`, icon `bi-gear` 13px `#475569`.
  Background `#f1f5f9` while the popover is open; hover `#f1f5f9` + `#0f172a`.
- **Collapse rail**: 26×26 icon button, `bi-chevron-double-right` 13px `#94a3b8`.

`ondblclick` on the whole header toggles Focus/Browse (presets `2a`/`3a` only) —
an expert shortcut. It must never be the only way in; the labelled button carries
discovery.

### 2. Settings popover (layout preset picker) — Advanced mode only

Anchored to the gear, `position: absolute; top: 46px; right: 8px; z-index: 5`,
width **268px**, bg `#fff`, `border: 1px solid #e2e8f0`, `radius: 10px`,
`box-shadow: 0 12px 32px rgba(15,23,42,0.16)`, `padding: 8px`.

- Eyebrow: "Panel layout" — 11px/600, uppercase, `letter-spacing: 0.08em`,
  `#94a3b8`, `padding: 5px 8px 8px`.
- Four option rows, `gap: 4px`, each a full-width left-aligned button:
  `padding: 8px 9px`, `radius: 8px`, `border: 1px solid #e2e8f0` (selected `#334155`),
  bg `#fff` (selected `#f8fafc`); hover border `#94a3b8`.
  Icon `bi-check-circle-fill` `#334155` when selected, else `bi-circle` `#cbd5e1`, 13px.
  Title 13px/600 (`#0f172a` selected, `#334155` otherwise); hint 11px/1.45 `#64748b`.
  Exact copy:
  - **Unified rail** — "Tree and inspector always both visible"
  - **Inspector first** — "One at a time, switched by tabs"
  - **Adaptive rail** — "Tree collapses when you focus an element"
  - **Adaptive + Recent** — "Adds a five-item recency list on tall rails"
- Footnote: "Saved per user, per workspace." — 11px `#94a3b8`, `padding: 9px 9px 4px`.

Closes on selection, on outside click and on `Escape`. Persist the choice per user
(same store as other editor preferences).

If the user switches the app from Advanced back to Basic, the rail renders `2a`
regardless of the stored preset; the stored value is kept and restored when they
return to Advanced. Do not clear it, and do not migrate the user to a different
preset behind their back.

### 3. Tabs bar — preset `1b` only, 40px, `flex: none`

`padding: 0 8px`, `border-bottom: 1px solid #eef2f7`, `gap: 2px`.
Two buttons, 28px tall, `padding: 0 11px`, `radius: 7px`, 13px/600, no border.
Active: bg `#f1f5f9`, text `#0f172a`. Inactive: transparent, `#94a3b8`.
- `bi-sliders2` "Inspector"  ·  `bi-diagram-3` "Structure"

### 4. Recent — preset `3a` only, `flex: none`

`border-bottom: 1px solid #e2e8f0`, bg `#fcfdfe`.

- Header row 30px, `padding: 0 12px`, clickable to collapse: caret
  (`bi-chevron-down` / `bi-chevron-right`, 10px `#94a3b8`), label "Recent"
  (11px/600 uppercase `letter-spacing: 0.08em` `#94a3b8`), right-aligned count
  ("5 items", IBM Plex Mono 10px `#cbd5e1`).
- Rows: 28px, `padding: 0 12px`, `gap: 8px` —
  entity letter badge 16×16 (`radius: 4px`, 10px/700, entity bg/fg),
  element name 13px/500 `#0f172a`,
  owning classifier 11px `#94a3b8` (ellipsis),
  spacer, age right-aligned (IBM Plex Mono 10px `#cbd5e1`: "just now", "4m", "1h").
  Hover `#f1f5f9`; selected bg `#e0f7fa` + `box-shadow: inset 2px 0 0 #0891b2`.

Rules — these are what keep it from becoming a second tree:
- **Visited, not favourite.** Ordered by last visit, deduplicated by element id.
- **Max 5 entries.** Never paginate, never nest, never add sub-headers.
- Every row carries its owner; without it, three elements named `name` are noise.
- **Not rendered at all in Focus posture.** Rendered collapsed by default when the
  rail is shorter than ~900px. It may never push the inspector below the fold.
- Clicking a row changes the selection and the inspector but **must not re-scroll
  the tree** — the user's place in the structure survives the detour.

### 5. Tree pane

Container: `flex: none`, `overflow: hidden`, `border-bottom: 1px solid #e2e8f0`,
`transition: height 250ms cubic-bezier(0,0,0.2,1), opacity 150ms cubic-bezier(0,0,0.2,1)`.

Height by preset:
- `1a`: fixed — roughly 45% of rail height (392px in the mock), user-resizable via
  the divider.
- `1b`: `620px` (fills) when the Structure tab is active, `0px` + `opacity: 0` otherwise.
- `2a`/`3a`: `392px` in Browse posture, `0px` + `opacity: 0` in Focus posture.

**Filter row** — 36px, `padding: 0 12px`, `border-bottom: 1px solid #eef2f7`,
`gap: 8px`: `bi-search` 12px `#94a3b8`; borderless input, 13px `#0f172a`,
placeholder "Filter structure"; right-aligned count in IBM Plex Mono 10px `#94a3b8`
("16 items", or "4 of 16" while filtering). When filtering, rows flatten to depth 0.

**Tree rows** — height **26px** (compact) / 30px (comfortable), `gap: 7px`,
`padding-right: 10px`:
- Indent spacer: `8px + depth * 13px`.
- Caret: 12px slot, `bi-chevron-down` / `bi-chevron-right`, 10px `#94a3b8`; empty for leaves.
- Entity letter badge 16×16, `radius: 4px`, 10px/700, `entityMeta` bg/fg pair
  (M metamodel violet, P package blue, C class red, A attribute green,
  R reference cyan, O operation indigo, E enum amber). Group rows: transparent bg,
  no letter.
- Name: 13px, weight 500 (600 when selected or a group), `#0f172a`
  (`#94a3b8` for group rows), **italic for abstract classifiers**.
- Type suffix: IBM Plex Mono 11px `#94a3b8` — `": EString [0..1]"`. This replaces
  the current inline label and is what makes the tree scan like a table.
- Right-aligned child count for group rows: IBM Plex Mono 10px `#cbd5e1`.
- Hover `#f1f5f9`. Selected bg `#e0f7fa` + `box-shadow: inset 2px 0 0 #0891b2`
  (the existing canvas-selection cyan; keep the tree and canvas selection in sync).

**Divider** (preset `1a`): 9px strip, bg `#f8fafc`, hairlines top/bottom,
`cursor: ns-resize`, with a 26×2 `#cbd5e1` grabber centered.

### 6. Focus breadcrumb bar — 34px, only when the tree pane is collapsed

bg `#f8fafc`, `border-bottom: 1px solid #eef2f7`, `padding: 0 10px`, `gap: 6px`:
- "Back" chip: 22px tall, `padding: 0 8px`, `border: 1px solid #e2e8f0`,
  `radius: 6px`, bg `#fff`, 11px `#475569`, icon `bi-diagram-3` 10px — label is the
  **owning classifier**. Click restores Browse posture.
- `bi-chevron-right` 9px `#cbd5e1`, then current element name 11px/600 `#334155`.
- Right: two 22×22 stepper buttons (`bi-chevron-up` / `bi-chevron-down`,
  `border: 1px solid #e2e8f0`, `radius: 6px`, bg `#fff`, `#64748b`) that move to the
  previous/next sibling, skipping group rows. Keyboard: `K`/`↑` and `J`/`↓`,
  suppressed while an input or textarea has focus.

### 7. Inspector

**Identity block** — `flex: none`, padding `11px 14px 10px` (Browse) /
`18px 14px 14px` (Focus), `transition: padding 250ms`:
- Entity badge: 22×22 / 34×34 in Focus, `radius: 7px`, 12px / 15px, weight 700,
  entity bg/fg. `transition: all 250ms cubic-bezier(0,0,0.2,1)`.
- Title: element name, 14px / 19px in Focus, weight 600, `letter-spacing: -0.015em`,
  `#0f172a`, `line-height: 1.2`, `transition: font-size 250ms`.
- Under it: entity kind, 11px/600 uppercase `letter-spacing: 0.06em`, in the
  **entity fg color** (e.g. `#059669` for an attribute).
- Right: signature chip — IBM Plex Mono 11px `#64748b`, bg `#f1f5f9`,
  `padding: 3px 7px`, `radius: 5px`, content `"EString [0..1]"`.

This block replaces the current title row **and** the breadcrumb. Do not render a
separate breadcrumb in Browse posture — the tree row already shows the position.

**Form body** — `flex: 1`, `overflow-y: auto`, `padding: 4px 14px 18px`.

The core density move: `display: grid; grid-template-columns: 84px minmax(0, 1fr);
align-items: center; gap: 8px 10px`. Labels are 12px `#475569`, **right-aligned**,
in the left column; each field is one 30px row instead of a 3-row stack. The second
track is `minmax(0, 1fr)` and not `1fr`: a `1fr` track has `min-width: auto`, refuses
to shrink below min-content, and produces horizontal scroll in a narrow rail.

- **Name** — text input, 30px, `border: 1px solid #cbd5e1`, `radius: 6px`,
  `padding: 0 9px`, 13px `#0f172a`. Focus: `border-color: #64748b;
  box-shadow: 0 0 0 3px rgba(51,65,85,0.06)`. Required-field asterisks are dropped:
  validate on blur and show the error inline instead.
- **Type** — combobox styled as the input, with `bi-chevron-expand` 11px `#94a3b8`
  right-aligned; hover `border-color: #94a3b8`. Only for typed features.
- **Multiplicity** — a single segmented control replacing the two steppers and the
  read-only chip. Five equal buttons in a `flex; gap: 4px` row, each
  `flex: 1 1 0; min-width: 0; padding: 0 2px` (required — otherwise the mono labels
  refuse to shrink and overflow the rail), 28px tall, `radius: 6px`, IBM Plex Mono 11px.
  Unselected: bg `#fff`, `border: 1px solid #cbd5e1`, text `#475569`.
  Selected: bg `#334155`, border `#334155`, text `#fff`.
  Options: `[0..1]` `[1..1]` `[0..*]` `[1..*]` `Custom`.
  **Custom** reveals a Lower/Upper stepper pair on its own row (28px, `radius: 6px`,
  `−` / value / `+`, value in IBM Plex Mono 12px, 30px wide) — this is the only place
  steppers survive. Lower clamps at 0, Upper at 1, Upper `*` allowed.

**Flags** — section eyebrow row, `margin: 18px 0 9px`: label "Flags"
(11px/600 uppercase `letter-spacing: 0.08em` `#94a3b8`), a `1px #eef2f7` rule
filling the middle, and a right-aligned live summary in IBM Plex Mono 10px `#94a3b8`
("unique · ordered", or "none set"). The summary is what lets a user skip the
section entirely.

Two renderings, chosen by available space (chips in Browse, switches in Focus):
- **Chips** (compact): 26px pills, `padding: 0 9px 0 7px`, `radius: 99px`,
  `gap: 5px`, 12px text, 10px leading icon.
  Off: bg `#fff`, `border: 1px solid #e2e8f0`, text `#475569`.
  On: bg `#334155`, border `#334155`, text `#fff`.
- **Switches** (roomy): 36px rows in a `1px #eef2f7` bordered box, `radius: 9px`,
  rows split by `1px #f8fafc`; icon 12px `#94a3b8`, label 13px `#334155`, one-word
  hint 12px `#94a3b8`, then a 30×18 track (`radius: 99px`, `#cbd5e1` off /
  `#334155` on) with a 14×14 white knob, `transform: translateX(0 → 12px)`,
  `transition: 150ms cubic-bezier(0,0,0.2,1)`.

Flags and hints: ID "identifies instances" (`bi-key`), Unique "no duplicates"
(`bi-fingerprint`), Ordered "position matters" (`bi-sort-down`), Derived "computed"
(`bi-calculator`), Transient "not persisted" (`bi-cloud-slash`), Read-only "no edit"
(`bi-lock`).

**Advanced** and **Appearance** — collapsed disclosure rows, 30px, caret 10px
`#94a3b8` + eyebrow label + hairline rule + right-aligned summary 11px `#94a3b8`
("default · opposite · derivation" / "Node · default"). Expanded content reuses the
84px label grid (Default value, Opposite, Derivation expression in IBM Plex Mono
on `#f8fafc`).

This replaces the current `ADVANCED`, `FLAGS`, `ADVANCED STATE` and `NODE` sections.
Map the old fields as: Advanced ← `ADVANCED` + `ADVANCED STATE`, Flags ← `FLAGS`,
Appearance ← `NODE`. Never ship two sections whose names differ only by a suffix.

### 8. Footer — 34px, `flex: none`

`border-top: 1px solid #eef2f7`, bg `#f8fafc`, `padding: 0 12px`, `gap: 8px`:
`bi-check-circle` 11px `#22c55e`, save state 11px `#64748b`
("Saved to Class Diagram"), spacer, right-aligned contextual shortcut hint in
IBM Plex Mono 10px `#94a3b8` — "dbl-click header to focus" / "esc to browse" /
"⌘Z undo". Wire the save state to the real persistence status (Saving… / Saved /
Offline) — it is the only always-visible reassurance in the panel.

## Interactions & Behavior

- **Selecting a tree row**: updates selection (canvas + inspector), pushes the
  element onto the recency list. In `2a`/`3a`, selecting a **leaf** (attribute,
  reference, operation, literal) also switches to Focus posture; selecting a
  container (package, class, group) does not. In `1b` it switches to the Inspector tab.
- **Posture switch** (`2a`/`3a`): double-click header, the Focus/Browse button, or
  selecting a leaf. `Escape` always returns to Browse. Only the tree pane's height
  animates — header, inspector and footer never move, so the switch reads as a
  change of height rather than a change of screen.
- **Sibling stepping**: `J`/`↓` next, `K`/`↑` previous, skipping group rows,
  wrapping at the ends; disabled while typing in a field.
- **Filtering**: flattens the tree, updates the count, preserves selection.
- **Editing**: commit on blur and on `Enter`; `Escape` reverts the field.
  Every edit is undoable through the existing editor undo stack.
- **Motion**: 150ms `cubic-bezier(0,0,0.2,1)` for hover/focus and toggles, 250ms for
  posture and size changes. Nothing else animates. Respect
  `prefers-reduced-motion: reduce` by dropping to 0ms.
- **Accessibility**: tree = `role="tree"` / `treeitem` with `aria-expanded`,
  `aria-selected` and roving tabindex; multiplicity = `role="radiogroup"`;
  flag chips/switches = `role="switch"` with `aria-checked`; popover = `role="menu"`
  with focus trap and `Escape` to close; visible focus ring
  `outline: 2px solid #475569; outline-offset: 2px`. Selection is never signalled by
  the cyan fill alone — the 2px `#0891b2` inset bar and the bold weight carry it too.

## State Management

Panel-local:
- `layout: '1a' | '1b' | '2a' | '3a'` — **persisted per user** (default `2a`).
  Effective layout = `mode === 'basic' ? '2a' : layout`; the stored preference is
  only read in Advanced mode.
- `posture: 'browse' | 'focus'` — session-only, resets to `browse` on project open.
- `tab: 'inspector' | 'structure'` — preset `1b` only.
- `treeHeight: number` — preset `1a` only, persisted.
- `filter: string`, `recentOpen: boolean`, `advancedOpen: boolean`,
  `appearanceOpen: boolean`.
- `history: { id, visitedAt }[]` — capped at 5, deduplicated by id, session-scoped
  (persisting it across sessions is optional and low value).

From the existing editor store: current selection, the megamodel tree, the element's
properties, the type catalogue for the Type combobox, and the save/persistence state.
Selection must stay bidirectional with the canvas — clicking a node on the canvas
updates the panel and, in `2a`/`3a`, switches to Focus posture.

## Design Tokens

All of these already exist in `frontend/src/styles/tokens/` — use the variables,
not the literals below.

Colors: `#ffffff` surface · `#f8fafc` footer/subtle · `#fcfdfe` Recent zone ·
`#f1f5f9` hover/chip · `#eef2f7` hairline rule · `#e2e8f0` border ·
`#cbd5e1` input border / mono muted · `#94a3b8` tertiary text ·
`#64748b` secondary · `#475569` labels · `#334155` accent (selected fill) ·
`#0f172a` primary text · selection `#e0f7fa` bg + `#0891b2` bar ·
`#22c55e` save OK. Entity pairs from `entityMeta.ts`.

Type: Inter — 19/14/13/12/11px UI; IBM Plex Mono — 12/11/10px for types,
multiplicity, counts, ages, shortcuts. Weights 500/600/700 only. Eyebrows:
11px/600 uppercase, `letter-spacing: 0.08em`.

Spacing: 4px grid. Row heights 26 (tree) / 28 (recent, multiplicity) /
30 (form field, disclosure) / 34 (footer, breadcrumb, flag switch) /
36 (filter) / 44 (header). Rail padding 12–14px.

Radius: 4 (badges, small chips) · 6 (inputs, buttons, steppers) ·
7 (identity badge, tabs) · 9–10 (grouped boxes, popover) · 12 (rail) · 99 (pills, switches).

Shadows: rail `0 4px 16px rgba(15,23,42,0.07)` · popover
`0 12px 32px rgba(15,23,42,0.16)` · focus ring `0 0 0 3px rgba(51,65,85,0.06)` ·
switch knob `0 1px 2px rgba(15,23,42,0.2)`.

## Assets

No new assets. Icons are Bootstrap Icons 1.13 (already a dependency):
`bi-gear`, `bi-search`, `bi-chevron-down/right/up/expand`,
`bi-chevron-double-right`, `bi-arrows-collapse`, `bi-arrows-expand`,
`bi-diagram-3`, `bi-sliders2`, `bi-check-circle`, `bi-check-circle-fill`,
`bi-circle`, `bi-key`, `bi-fingerprint`, `bi-sort-down`, `bi-calculator`,
`bi-cloud-slash`, `bi-lock`, `bi-bounding-box`. Entity glyphs and letters come from
`entityMeta.ts`.

## Files

- `Jodel Side Panel.dc.html` — the interactive design reference. Implement the
  section badged **`4a` "Configurable rail"** (top of the page). Sections `1a`,
  `1b`, `2a`, `3a` further down are the exploration history and the written
  rationale for each decision; read them for intent, do not implement them
  separately.

## Suggested build order

1. Rail shell + header + footer, no presets — replaces the two cards.
2. Tree pane (rows, badges, mono type suffix, filter, selection sync).
3. Inspector (identity block, 84px label grid, Type, multiplicity segmented control).
4. Flags (chips + switches) and the Advanced / Appearance disclosures.
5. Posture switching + keyboard (`Esc`, `J`/`K`) — this yields preset `2a`, the default.
6. Settings popover + persistence, gated on Advanced mode, then presets `1a` and
   `1b` (they are the same component with two booleans). Basic mode ships after
   step 5 and needs nothing from steps 6–7.
7. Recent (preset `3a`) last — it is the only genuinely new data requirement.

## Definition of done

- At 420 × 1000 in preset `2a`, at least 9 properties/controls are visible without
  scrolling the inspector.
- No horizontal scrollbar at any rail width from 360px up (check the multiplicity row).
- The header stays one line at 360px in Advanced mode: the metamodel name truncates
  with an ellipsis, no control wraps or shrinks.
- Switching posture moves nothing but the tree pane's height.
- Every color, size and radius traces back to an existing token.
- In Basic mode the rail renders `2a` with no gear anywhere in the panel; switching
  to Advanced reveals the gear and restores the user's stored preset.
