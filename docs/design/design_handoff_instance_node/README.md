# Handoff: Instance node rendering — Jjodel View Designer

## Overview

The Jjodel View Designer currently renders model instances with a default "rectangle + compartment" shape. The default output is functional but information-poor: every attribute slot renders as flat `name = value` text, so an empty slot looks identical to a filled one, a reference to another object looks identical to an enum literal, and a multi-valued collection hides its cardinality entirely.

This handoff specifies a replacement default for the **instance node** and the **style fields** the View Designer should expose so users can override that default per class, per instance, or per viewpoint.

Scope: the node itself (header + attribute compartment) and the value renderers inside it. Edge routing, canvas chrome, palette, and tree view are out of scope.

**Read "The three-level style model" below before implementing.** The rectangular instance node specified in the body of this document is one configuration of a more general model. Implementing only the rectangle is a valid first milestone, but the field names and their homes in the UI are defined by the general model, and getting those wrong now means renaming them later.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. They are authored as streaming "Design Components" for a design tool and depend on that tool's runtime; they will not drop into the Jjodel frontend as-is.

The task is to **recreate these designs inside the existing Jjodel frontend** (React + TypeScript, SCSS token system under `frontend/src/styles/tokens/`), using its established patterns: the existing token variables, the `entityMeta.ts` categorical palette, Bootstrap Icons, and whatever node-rendering primitives the View Designer already has. Do not introduce a new styling approach, a CSS-in-JS layer, or a second icon set.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, borders, and shadows below are final and taken from the Jjodel token system. Recreate them exactly, referencing the existing SCSS/CSS custom properties rather than re-typing hex values wherever a token exists.

The one deliberately unfinished area is the **value-renderer detection logic** (see "Value renderers" below) — the visual result is specified, the inference strategy is specified as a priority order, but the exact parser is an implementation decision.

---

## The problem being fixed

Observed in the current default rendering of two `Shape` instances:

| Defect | Why it matters |
|---|---|
| `color =`, `tags =`, `owner =` — empty slots with a dangling `=` | In one of the two instances, three of four rows carried no information but occupied full visual weight. |
| `cfg = Config` renders like plain text | `cfg` is a **reference to another object**. It should be visually distinct and navigable. |
| `tags = Green` renders like a single scalar | If `tags` is multi-valued, hiding the cardinality misrepresents the model. |
| Header reads `Shape_0 : Shape` at uniform weight, not underlined | UML object diagrams underline the instance specification. The instance name is primary information; the type is secondary. |
| `=` signs not aligned across rows | Vertical scanning degrades quickly past ~4 attributes. |
| No categorical color, no type badge | The node is indistinguishable from any other node kind on the canvas. |

---

## Screens / Views

There is one view: **the instance node**, rendered in a set of style configurations. The reference file `Instance Node.dc.html` shows one filled instance (`Shape_0`) and one nearly-empty instance (`Shape_1`) side by side, driven by the same props, so any style change can be judged against both cases at once.

### Node anatomy

```
┌─────────────────────────────────────┐
│ [optional 3px accent bar — top]     │  accentPlacement = "top"
├─────────────────────────────────────┤
│  header                             │  instance name (underlined) + type
├─────────────────────────────────────┤
│  compartment                        │  2-column grid: label | value
│    color   ■ Green                  │
│    tags [1]  (Green)                │
│    cfg     ⬡ Config ↗               │
│    owner   —                        │
├─────────────────────────────────────┤
│  ⌄ 3 slot vuoti                     │  only when emptyBehavior = "collapse"
└─────────────────────────────────────┘
   ▌ optional 3px accent bar — left      accentPlacement = "left"
```

### Node container

- Width in the reference: `320px`. In production the node is user-resizable; treat 320px as the comfortable default and let content define the minimum. `min-width: 0` on the inner column so long values ellipsize instead of forcing the node wider.
- `background: #ffffff`
- `border: 1px solid #cbd5e1` (slate-300)
- `border-radius: 8px`
- `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04)`
- `overflow: hidden` (so the accent bar clips to the radius)
- Outer element is `display: flex` — the left accent bar is the first flex child, the header+compartment column is the second with `flex: 1; min-width: 0`.

Note the radius is **8px, not the 12px card radius**. Canvas nodes are denser than dashboard cards; 12px reads as too soft at diagram scale.

### Header

- `padding: 11px 14px`
- `border-bottom: 1px solid #cbd5e1`
- `display: flex; align-items: center; gap: 10px`
- `justify-content: center` when `typeDisplay = "inline"`, otherwise `flex-start`
- Background: `transparent` by default; `#f1f5f9` (slate-100) when `headerFill = true`
- Instance name: `font-size: 14px; font-weight: 600; color: #0f172a; text-decoration: underline; text-underline-offset: 3px`, with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- The underline is not decoration — it is the UML object-diagram convention for an instance specification. Keep it in every configuration.

Type presentation, by `typeDisplay`:

- `"inline"` (default) — the whole string `Shape_0 : Shape` is one centered underlined run. Strictest UML reading.
- `"chip"` — name on the left, type as a pill pushed right with `margin-left: auto`: `font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px`, colors from the badge pair below.
- `"badge"` — a 20×20 square before the name: `border-radius: 4px; font-size: 11px; font-weight: 700`, centered single-letter glyph (`m` for model instances, per the existing `entityMeta.ts` letter set), colors from the badge pair below.

**Badge pair** (shared by chip and badge):

| Condition | Background | Foreground |
|---|---|---|
| Selected | `#cffafe` | `#0e7490` |
| Categorical accent active (`accentPlacement ≠ "none"` and `accent ≠ #cbd5e1`) | `#fef3c7` | `#b45309` |
| Otherwise | `#f1f5f9` | `#475569` |

The amber pair here is the **model** entry of the categorical palette. In production, read the pair from `entityMeta.ts` for the actual entity type rather than hardcoding amber — amber is correct only because these are model instances.

### Compartment

- `padding: 10px 14px`
- `display: grid; grid-template-columns: 66px 1fr; row-gap: 8px; column-gap: 12px`
- `font-size: 13px; align-items: center`

The grid is the fix for the ragged-`=` problem: labels and values form true columns. **The `=` character is dropped entirely** — the column boundary carries that meaning, and removing it recovers horizontal space. The 66px label column is a starting value; a production implementation should size it to the widest label in the compartment, clamped (e.g. `min(max-content, 45%)`), so `66px` is not a magic constant that breaks on long property names.

Label cell:
- `color: #64748b` (slate-500)
- `display: flex; align-items: baseline; gap: 4px; min-width: 0`
- name span: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- cardinality suffix (when multi-valued): `color: #cbd5e1; font-size: 11px`, rendered as `[1]`, `[0]`, `[5]` — the **actual count of values held**, not the metamodel bound. This is what makes an empty collection legible.

Value cell:
- `display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap`

### Collapsed-slots footer

Rendered only when `emptyBehavior = "collapse"` and at least one slot is empty:

- `padding: 8px 14px`
- `border-top: 1px solid #f1f5f9`
- `font-size: 11px; color: #94a3b8`
- `display: flex; align-items: center; gap: 6px; cursor: pointer`
- Content: `bi-chevron-down` icon + `"3 slot vuoti"` / `"1 slot vuoto"` (Italian singular/plural must both be handled; in the English locale, `"3 empty slots"` / `"1 empty slot"`)
- Clicking expands the hidden rows in place, rendered with the `dash` treatment.

---

## Value renderers

Each renderer is a distinct visual treatment inside the value cell.

### Empty / unset

`—` (em dash) in `#cbd5e1` (slate-300). Deliberately at the lowest contrast in the node — present so the model's shape stays visible, quiet enough not to compete with real data. This is the **default** behavior (`emptyBehavior = "dash"`).

### Scalar / plain text

`color: #0f172a; font-weight: 500`.

### Color value

A swatch preceding the text: `width: 10px; height: 10px; border-radius: 3px; flex: none; background: <the color>`, then the label (`Green`) as plain text. Swatch and text always travel together — the swatch annotates the value, it does not replace it.

### Collection

One chip per value: `font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; color: #475569`, laid out with the cell's `gap: 6px` and `flex-wrap`. The label carries the count.

Not yet designed, and needed before shipping: **overflow above ~4 chips.** Recommendation: render the first N and a `+k` chip that expands on click; do not let a collection grow the node unbounded.

### Reference to another object

A pill: `display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 999px; background: #ecfeff; color: #0891b2; border: 1px solid #a5f3fc`, with a leading `bi-link-45deg` icon, then the target's name.

Cyan is correct here: within the canvas, cyan is the interaction/navigation accent. The pill should be **clickable** — select and reveal the target object.

### Edge marker

When a reference or association target is also present on the canvas and drawn as an edge, the row gains a trailing `bi-arrow-up-right` at `font-size: 11px; color: #94a3b8`.

**The row is never removed.** A reference rendered as an edge is duplicated graphically, not moved: the edge shows the topology, the row shows that this specific property holds that specific value. If the row disappeared, a user reading the node alone could not tell whether the property was unset. This applies to associations as well as to containment references.

`edgeMarker = false` turns off the marker without touching the row.

---

## Interactions & Behavior

### Selection — the cyan rule

While a node is selected:
- `border-color: #0891b2`
- `box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.18), 0 1px 2px rgba(0, 0, 0, 0.04)`
- header `background: #e0f7fa`, header `border-bottom-color: #a5f3fc`
- badge/chip pair switches to `#cffafe` / `#0e7490`
- **the accent bar switches to `#0891b2`, overriding whatever categorical color the node carries**

That last rule matters and was arrived at by testing: an amber 3px bar plus a cyan selection ring plus an amber chip is three colors fighting on one small object, and the user cannot tell which one means "selected". So **selection owns the cyan, and the categorical accent yields to it for the duration.** The identity color returns on deselect. Implement this as a render-time override, not by mutating the stored accent.

This is also the strongest argument for the neutral default: with no categorical color in the node chrome, the cyan of selection is unambiguous at any zoom level and with any number of nodes on screen.

### Hover

Not specified in the reference and should follow existing canvas node behavior. Suggested: lift the shadow to `0 4px 12px rgba(0, 0, 0, 0.08)`, `150ms ease-out`, no movement (nodes have canvas coordinates — they must not drift on hover).

### Reference pill click

Select and scroll-reveal the target object. If the target is off-canvas, the pill is still the affordance that brings the user to it.

### Collapsed footer click

Expand the hidden empty rows in place. Local, non-persisted UI state per node is acceptable.

### Transitions

House curve, per the Jjodel token system: `150ms cubic-bezier(0, 0, 0.2, 1)` for hover/focus/selection changes. No motion on the accent-bar color swap beyond a plain color transition. No bounces.

---

## State Management

### Style configuration (the substance of this handoff)

These are the fields the View Designer must expose. Each resolves through a cascade: **metamodel class default → viewpoint override → per-instance override**, with the resolved value used at render time.

| Field | Type | Default | Notes |
|---|---|---|---|
| `accentPlacement` | `"none" \| "top" \| "left"` | `"none"` | Where the 3px categorical bar goes, or nowhere. |
| `accent` | color | `#cbd5e1` (slate-300) | Inherited from the metamodel class; overridable per instance. |
| `headerFill` | boolean | `false` | `#f1f5f9` header vs transparent. |
| `typeDisplay` | `"inline" \| "chip" \| "badge"` | `"inline"` | See header section. Consider also shipping `"hidden"` for viewpoints where every node is the same type. |
| `emptyBehavior` | `"dash" \| "collapse" \| "hide"` | `"dash"` | Applies to unset slots. |
| `edgeMarker` | boolean | `true` | Marks properties whose target is drawn as an edge. |

`selected` is runtime canvas state, not a style field.

**Why these defaults.** The neutral configuration (`accentPlacement: "none"`, slate accent, no header fill, inline type, dash) was chosen over the colored variants for a specific reason: it keeps color out of the node chrome so that color inside the node — a color swatch, a cyan reference pill, a cyan selection — always means something. The categorical tint remains one field away, so a user who wants amber `Shape` nodes gets them by changing `accent` and `accentPlacement`, and that tint is then an **explicit authored decision rather than an imposed default**. Ship the colored presets; do not make one the factory default.

Ship these as named presets over the same fields:

- **Default** — everything at its default value.
- **Header riempito** — `headerFill: true`. Separates header from compartment without spending color.
- **Nome primario** — `accentPlacement: "left"`, `typeDisplay: "chip"`. Instance name is the only primary element; type demotes to a pill.
- **Categoriale** — the above plus `accent` set from `entityMeta.ts`. The colored reading.

### Per-node runtime state

- `selected: boolean` (owned by the canvas)
- `emptyRowsExpanded: boolean` (local, when `emptyBehavior = "collapse"`)

---

## Value-renderer detection

How the renderer decides that `color = Green` deserves a swatch. **Not by attribute name** — that is the easiest route and the wrong one: `color` on a `Printer` class might be a CMYK integer, and `background`, `fill`, `stroke`, `tint` are all colors that are not named `color`.

Priority order, most to least reliable:

1. **Metamodel declaration — the only authoritative source.** Attribute typed `Color`, or annotated (`@color`, `@renderer=color`). Decides the renderer outright. This is also the only mechanism that can be correct for an enum like `Green` that carries no RGB value of its own.
2. **The value, parsed syntactically.** `#22c55e`, `rgb(...)`, `oklch(...)`, `0xFF00AA` are unambiguous. This is a lexer, not a heuristic.
3. **Enums whose literals are recognizable colors.** If **every** literal of the enumeration maps to a known CSS color name, the enum is almost certainly a color enum. Testing the whole literal set rather than the single value is what makes this safe. (`Status { Green, Amber, Red }` passes — and a swatch is still informative there, so the false positive is benign.)
4. **Attribute name — only as a final tie-break between two already-plausible renderers, never as a sole trigger.**

Two requirements that matter more than the detection itself:

- **Inference must be visible and reversible.** The View Designer shows which renderer was chosen and why (`inferred from: CSS color enum`), with a menu to change it. A guessed renderer that cannot be corrected is worse than flat text.
- **A user correction promotes to the metamodel, not the instance.** It becomes the rule-1 declaration, and the heuristic stops running for that property. The heuristic accelerates the first encounter; it is not a permanent mechanism.

The same ladder generalizes to the other value renderers worth building next: dates, durations, URLs, percentages, icon enums, booleans.

---

## Design Tokens

All values below exist in the Jjodel token system (`frontend/src/styles/tokens/`). Reference the variables; the hex values are here for verification only.

**Neutrals (slate)**
| Value | Use |
|---|---|
| `#f8fafc` | app / canvas background |
| `#ffffff` | node surface |
| `#f1f5f9` | header fill, collection chip background |
| `#e2e8f0` | hairline divider (collapsed-footer top border) |
| `#cbd5e1` | node border, header border, neutral accent, empty-value dash, cardinality suffix |
| `#94a3b8` | edge marker, footer text, eyebrow labels |
| `#64748b` | property labels |
| `#475569` | chip foreground (neutral), secondary text |
| `#0f172a` | instance name, scalar values |

**Canvas cyan (selection & navigation)**
| Value | Use |
|---|---|
| `#ecfeff` | reference pill background |
| `#e0f7fa` | selected header background |
| `#cffafe` | selected badge/chip background |
| `#a5f3fc` | reference pill border, selected header border |
| `#0891b2` | reference pill text, selected border, selected accent bar |
| `#0e7490` | selected badge/chip foreground |
| `rgba(6,182,212,0.18)` | selection ring |

**Categorical (model / instance = amber)**
| Value | Use |
|---|---|
| `#fef3c7` | badge/chip background, tinted |
| `#f59e0b` | accent bar, tinted |
| `#b45309` | badge/chip foreground, tinted |

Other entity types take their own pair from `entityMeta.ts`. Note the known inconsistency documented there: some color *comments* disagree with their hex values — **the hex values are ground truth.**

**Semantic**
`#22c55e` (success green) appears in the reference only as the *data* value of the `color` attribute — it is not chrome.

**Typography** — Inter for all UI; IBM Plex Mono for identifiers and code-like strings. Ligatures disabled globally.
| Size | Weight | Use |
|---|---|---|
| 14px | 600 | instance name |
| 13px | 400 | compartment labels and values |
| 13px | 500 | scalar values (emphasis) |
| 12px | 500 | reference pill |
| 11px | 500 | collection chip |
| 11px | 600 | type chip, type badge (700), eyebrow labels |
| 11px | 400 | cardinality suffix, collapsed footer, edge marker |

**Spacing** — 4px grid. Header `11px 14px`; compartment `10px 14px`; footer `8px 14px`; compartment `row-gap: 8px`, `column-gap: 12px`; header `gap: 10px`; value cell `gap: 6px`; chip run `gap: 4px`.

**Radius** — node `8px`; badge `4px`; collection chip `4px`; swatch `3px`; pills `999px`.

**Shadows** — resting `0 1px 2px rgba(0,0,0,0.04)`; selected `0 0 0 3px rgba(6,182,212,0.18), 0 1px 2px rgba(0,0,0,0.04)`; hover (suggested) `0 4px 12px rgba(0,0,0,0.08)`.

**Accent bar** — 3px on every placement.

---

## Assets

No images. Icons are **Bootstrap Icons v1.13**, already a dependency of the Jjodel frontend (`bootstrap-icons` npm package):

- `bi-link-45deg` — reference pill
- `bi-arrow-up-right` — edge marker
- `bi-chevron-down` — collapsed-slots footer

No emoji, no custom SVG. Single-letter type glyphs come from the existing `entityMeta.ts` letter set (M / m / T / V / C / P / A / R / O).

---

## Not yet designed

Flag these before implementation is called complete:

- **Collections above ~4 values** — chip overflow / `+k` affordance.
- **Broken references** — a reference whose target was deleted. Needs a distinct treatment (probably error red `#ef4444`, not the cyan pill).
- **Very long instance or type names** — ellipsis is specified, but the truncation point and tooltip behavior are not.
- **Zoom-out legibility** — below what scale does the compartment stop rendering and the node become a labeled box? The neutral default was chosen partly to survive this, but the threshold is untested.
- **Operations compartment** — this design covers attributes and references only. UML nodes have a third compartment.
- **Dark mode** — not addressed anywhere in this handoff.

---

## The three-level style model

The rectangle is not the general case. Four real notations (state machine, BPMN, ER, and the Shape/Config model from the screenshots) were checked against the design, and they separate cleanly into three levels. **The View Designer already implements level 1.**

### Level 1 — Symbol (exists today)

The `Symbol` tab of a view, and the symbol editor behind "Open symbol editor": shape preset (47 presets across Base / BPMN / UML / Flowchart / Petri net / ER families), fill, border, padding, marker, sizing — each switchable between **Fixed** and **Conditional**.

Two consequences that must shape the implementation:

- **Do not build a parallel cascade for the categorical accent.** A per-type or per-state color is a *conditional fill* on the metaclass, expressed with the mechanism that already exists. `selected → #e0f7fa, else → #ffffff` is exactly the selection rule from this document, written as a Conditional. Adding a second override system beside Conditional would be duplicate machinery with divergent semantics.
- **The chosen Symbol determines which level-2 fields exist at all.** The panel must show only the fields the current shape supports, and say why — e.g. "available because the Symbol is Rectangle" under `name.position`. A stadium has no flat top edge for a header band; a diamond has no room for a name inside it.

### Level 2 — Structure (shape-dependent)

Where the name goes, where the compartments go, what happens to unset slots. These are the fields introduced by this handoff, and they belong in the existing **Structure** tab, not in a new "Style" tab.

| Field | Values | Notes |
|---|---|---|
| `name.position` | `header-band` \| `center` \| `below` \| `external` | `header-band` only for shapes with a flat top edge. `below` is what a diamond or circle needs — label anchored under the shape, type as a dimmed second line. |
| `accentPlacement` | `none` \| `top` \| `left` \| `ring` | `top`/`left` are rectangle-only; `ring` is the round-shape equivalent. |
| `compartment.mode` | `inline` \| `popover` \| `none` | `none` for state-machine nodes (the diagram is topology, not data). `popover` reveals the compartment on selection, anchored under the shape. |
| `compartment.columns` | `2` \| `3` | `2` = name · value (the instance reading). `3` = marker · name · type (the schema reading, for ER). Not cosmetic — two different readings of the same compartment. |
| `emptyBehavior` | `dash` \| `collapse` \| `hide` | Shape-independent in effect, but lives here with the compartment. |

### Level 3 — Row views (shape-independent)

**This is the level to implement first.** It is identical in all four notations and requires no decision about geometry.

Jjodel already models the rendering of a value as a sub-view: in the screenshots, `View for Color` has kind **Row**. So the "value renderers" of this handoff are not a new concept to invent — they are a **library of ready-made Row views** attached per metaclass:

| Row view | Applies to | Rendering |
|---|---|---|
| Swatch | `Color` | 10px rounded square + the label |
| Chip | collections | one Tag-style chip per value, cardinality on the label |
| Pill | references | cyan `bi-link-45deg` pill, clickable to reveal the target |
| Dash | unset | `—` in slate-300 |

And the detection ladder in "Value-renderer detection" becomes **"suggested Row view for this metaclass"** — the same priority order, but the output is a view suggestion the user confirms or replaces, which is exactly the correction-promotes-to-the-metamodel behavior described there.

**The critical requirement:** a value must render identically whether it appears as a row inside a compartment or as a standalone Row-view node on the canvas. In the current default it does not — `Green` is a bordered node on the canvas and flat text inside `Shape_0`, two unrelated representations of one piece of information. One renderer, two sizes.

### A third value for property rendering

"Edge marker" in this document assumed two possibilities: the property is a row, and it may additionally be drawn as an edge. BPMN adds a third: the property is the **edge's label**. A gateway's condition belongs on the outgoing connection, not in the node.

So `property.render` = `row` \| `row + edge` \| `edge-label`. The Row views apply unchanged in all three positions.

### Implementation order

1. **Level 3** — the Row-view library plus the shared renderer for rows and standalone nodes. No geometry decisions, applies to every notation.
2. **Level 2 for Rectangle** — the fields in this document, in the Structure tab, with the neutral defaults.
3. **Level 2 contextual filtering** — the panel showing only what the current Symbol supports, with the reason stated.
4. **`property.render` = `edge-label`** — needed before BPMN-style notations are usable.

---

## Files

In the bundle:

- `Instance Node.dc.html` — **the specification artifact.** One filled instance and one nearly-empty instance rendered from the same configurable props, plus an on-page summary of the style fields. Every value in this README is taken from here.
- `Instance Node Proposal.dc.html` — the exploration history, newest first: turn 3 (the accepted direction plus its selected state and the two neutral derivatives), turn 2 (four header presets), turn 1 (the original default-vs-proposal comparison). Useful for understanding *why* the default is neutral; not needed to implement.

Both are Design Component files and depend on a design-tool runtime plus the Jjodel design-system bundle. Read them as references; do not attempt to run them inside the Jjodel frontend.

- `Use Cases.dc.html` — **the source for "The three-level style model" above.** Four notations, each as current-default vs proposal: the real Shape/Config model (with the Structure panel, the Conditional fill, and the Row-view library), a state machine on Stadium symbols, a BPMN gateway on a Diamond with the label below, and an ER entity with the three-column compartment. Read this to see why the levels split where they do.
- `Style Tab.dc.html` — an earlier exploration of a dedicated Style tab, drawn before the real Symbol/Structure tabs were known. **Superseded**: its conclusion (that style needs its own tab) is wrong — the tabs already exist. Kept only for the inheritance-provenance treatment in its second frame ("inherited from Style · viewpoint" / "overridden here" with a reset), which is still the right pattern for any per-instance override UI.

- `screenshots/instance-node.png` — the specification artifact as rendered, at its default configuration.
- `screenshots/explorations.png` — the full exploration board as rendered.

The screenshots are a convenience for reviewing the design without a runtime. **The HTML files are authoritative** — where a screenshot and the README disagree, trust the README; where the README and the HTML disagree, trust the HTML.
