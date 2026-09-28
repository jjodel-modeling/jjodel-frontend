# Mockup 1b: the copy, artboard by artboard

Plain extract of every string shown in `Symbol Editor 1b - All Sections.dc.html`, taken from the
mockup file itself. It exists so that work inside the repo does not have to quote a prompt for UI
copy. Glyphs and drawings are noted as such; this file carries text only.

Shell, present on every artboard: header `Symbol · <name> [preset|preset · modified]` with the
subtitle `<instance> · Base · Flowchart · ER`, the chip `Rectangle  Change…`, the preview strip
labelled `PREVIEW`, the section nav `Symbol | Fill | Border | Padding | Marker | Sizing | Text`
with a count badge where rules exist, the toggle `On canvas | Sample`, and the footer
`Changes apply live · Esc closes` with `Revert to preset` and `Done`.

## 2a, Symbol

`Applies to: State · metaclass`. `View name: View for State`. `Base shape: Rectangle  Change…`.
`Corner radius · all vertices`, stepper `− 6 px +`, three inline glyphs, help text:
"Rounds every vertex of the shape: rectangles, diamonds, hexagons, parallelograms alike. 0 keeps
sharp corners." `Notations: Base ✕  Flowchart ✕  ER ✕  + Add`. `Also used for: Process, Entity ·
same preset, other metaclasses`. `Modified from preset: Fill, Border  Show diff`.

## 2b, Fill, conditional with two rules

Segmented `None | Solid | Conditional`. Caption `Top to bottom · first match wins`. Table headers
`WHEN` and `THEN FILL`. Rows `state.isInitial → #DCFCE7` and `state.isFinal → #FEE2E2`. Closing row
`Otherwise → None`. Button `+ Add rule`. `Suggested: state.isComposite · state.outgoing.size == 0`.
Preview captions: `Idle / isInitial`, `Running / otherwise`, `Done / isFinal`.

## 2c, Border, base plus one override

Segmented `None | Solid | Conditional`. Base row `#334155`, `− 1 px +`, `Solid`. Section `OVERRIDES`
with the caption "Only listed properties change; the rest stay as above". Headers `WHEN` and `THEN`.
Row `state.isFinal → width 3 px ✕ , style Double ✕ , + color`. Button `+ Add override`.
Preview captions: `Idle / base`, `Running / base`, `Done / isFinal`.

## 2d, Padding

Segmented `Tight 4 | Normal 8 | Loose 16 | Custom`. Fields `Top 16 px`, `Bottom 12 px`,
`Left 28 px`, `Right 28 px`, checkboxes `Link left / right` (checked) and `Link top / bottom`.
Help text: "Padding is inside the border. Text and markers are laid out in the content box."

## 2e, Marker

Header caption: "Small glyphs anchored to a corner or edge · all matching rules show". Headers
`WHEN`, `GLYPH`, `POSITION`, `COLOR`. Rows `state.isComposite → ⊕, Bottom right, border` and
`state.hasIssues → !, Top left, #DC2626`. Button `+ Add marker`. Help text: "Glyph can be a symbol,
an icon, or a short expression like state.regions.size". Size `S | M | L`.

## 2f, Sizing

Segmented `Fit content | Fixed | Resizable`. Fields `Min width 80 px`, `Min height 44 px`,
`Max width 200 px`, `Max height none`. `Overflow: Ellipsis | Wrap | Grow`.
`Aspect: Keep 1:1 (useful for Circle, Diamond)`. `Children: Grow to contain nested nodes ·
composite states`. Preview captions `min 80×44`, `fits content`, `max 200 · ellipsis`.

## 2g, Text

`LABEL`, caption "Primary text · shown inside the shape". `Source: state.name (expression)`,
`If empty: unnamed`, `Editable: Double-click`, `Size 13 px`, `Weight 600`, `Align ⇤ ↔ ⇥`,
`Color #0F172A`. `SECONDARY LINES`, caption "One line per matching item", rows
`state.entryActions → "entry / " + it.name + "()"` and `state.doActivity → "do / " + it.name + "()"`.
Button `+ Add line`.

## 2h, Change symbol, the popover

`Search 56 presets…`, `All notations`. Family list with counts: `Base 9`, `Process 29`, `Data 7`,
`Flow 2`, `Goal 9`. Goal subtitle `i* · KAOS · GRL`. Tiles: `Goal`, `Softgoal`, `Task`, `Resource`,
`Actor`, `Agent`, `Role`, `Belief`, `Obstacle`. Footer: checkbox `Keep my Fill / Border rules when
switching` (checked) and link `Manage presets…`.

## 2i, Fill switched to Conditional with no rules

Heading text: "No rules yet, every State uses the default below". Body: "A rule is a boolean
expression on the State plus a fill. Rules are checked top to bottom; the first true one wins."
Button `+ Add first rule`, then `or start from:` with chips `state.isInitial`, `state.isFinal`,
`state.isComposite`. Closing row `Otherwise → None`. Preview captions: `otherwise` on all three
instances.
