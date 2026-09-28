# Decisions: Symbol Editor 1b (D1 to D8)

Version 3. Version 2 was revised against `02-coder-spec.md` and `README.md`, which were not
available when version 1 was written. Version 3 corrects five points found by checking version
2 against the code on 2026-09-15: D5 on what an absent radius means and on which CSS shapes
honor the axis, D1 on the list of border read sites, D4 on the home of `formatPredicate`, and
three small references. No verdict changes. The edits to `02-coder-spec.md` listed at the end
have been applied to that file.

Closes the eight open points of `01-architect-brief.md`. Every claim below was checked
against `jjodel-frontend@alfonso-frontend-jjtl` and against the mockup file
`Symbol Editor 1b - All Sections.dc.html`. Version 3 was re-checked on `validation-skeleton`,
where `components/editor-v2/viewpoint/` and `components/ui/ConditionalEditor/` are identical to
that branch (`git diff --quiet` exit 0, against 39 differing files over `frontend/src`). File and
line references hold on both branches.

One decision per section: the first line is the verdict, the rest is why and what it
costs. Read the "Edits `02-coder-spec.md` needs" section at the end before slicing.

---

## D1 · Conditional border: **per-axis Conditional, neither (a) nor (b)**

**Decision.** `border?: { color?: Conditional<string>; width?: Conditional<number>; style?: Conditional<'solid'|'dashed'|'dotted'|'double'> }`, the shape of `EdgeViewIR.line` plus `'double'`, which node borders already paint (`IRNodeContent.tsx:356-363`) and edge lines do not.

The brief frames the choice as "whole-object replacement" versus "a new merge pattern in
the IR". There is a third shape already in the schema, and it is the one the mockup
describes.

1. Every `Conditional<T>` the IR carries today is over a primitive: `form`, `fill`,
   `marker`, `BadgeSpec.icon`/`visible`, `LabelSpec.visible`, the five `TextStyle` axes,
   `FieldCompartmentSpec.visible`, `line.color`/`width`/`style`. `Conditional<BorderSpec>`
   would be the first conditional over a composite object in the schema. Option (a) does
   not avoid a new pattern, it introduces one.
2. `EdgeViewIR.line` (`irTypes.ts:538-542`) is already per-axis conditional, for the same
   concept: a stroke with a color, a width and a style. Option (a) makes the node border
   and the edge line diverge permanently, and saved IR has no VersionFixer (R-B9), so the
   divergence is not fixable later.
3. The mockup states the semantics literally: "OVERRIDES · Only listed properties change;
   the rest stay as above", with an override row that carries `width 3px`, `style Double`
   and a `+ color` chip for the property not yet overridden. Per-axis makes that the data
   semantics. Whole-object makes it a panel convention with information loss: a branch that
   repeats the base color is indistinguishable from an inherited one, so the state of the
   `+ color` chip cannot be recovered on reopen, and editing the base color after adding an
   override leaves the branch stale unless the panel rewrites every branch on every base edit.
4. It is exactly as additive as (a) at the type level. `Conditional<T> = T | …`, so
   `border: { color: '#334155', width: 1, style: 'solid' }` stays a valid value: every
   persisted IR, every catalog preset (`notationCatalog.ts`), `irDemoFixture.ts` and the
   `SymbolPreset.values.border` shape are untouched. No `irVersion` bump, no VersionFixer.

**The cost, stated plainly.** One override row in the UI maps to N axis conditionals that
share the same predicate. On read the panel groups axes by structural equality of `when`
to rebuild the rows. Predicates that do not coincide across axes (only hand-authored or
machine-generated IR can produce them) do not fold into a row; the panel then falls back to
one row per axis and says so. This is authoring-side only and never blocks rendering.

**Compile and read sites.** `CompiledView.border` splits into
`borderColor` / `borderWidth` / `borderStyle: CompiledConditional<…> | null`, a copy of
`compileEdgeView` (`irCompile.ts:505-507`). Every non-test reader of the border today, found
by a search over `frontend/src`:

- `irCompile.ts:307` and `irTypes.ts:718`: the compiled field.
- `IRNodeContent.tsx:333-371`: inline CSS border, SVG stroke, dash, double overdraw, marker
  color.
- `symbolRecognition.ts:61-69`: `style`/`width` route through the existing `scalarOf`
  CONDITIONAL sentinel exactly as `form`/`fill`/`marker` already do.
- `notationCatalog.ts:137-146`, `applyPresetToShape`.
- `SymbolEditorModal.tsx:101`, `currentAxesPreset`: "scalar or omit", as for `marker` and `fill`.
- **`SymbolCard.tsx:35`**, the rail card thumb: `shape?.border?.color ?? DEFAULT_BORDER_COLOR`,
  whose comment states "Border color is scalar in the schema". It needs the scalar-or-default
  guard that `SymbolEditorModal.tsx:283-284` already applies to the same color.
- **`VertexAuthoringPanel.tsx:341, 350`**: `border` and `patchBorder` spread the base as a
  scalar object. They are replaced by the Border section rewrite.
- `SymbolBoxPreview.tsx`: receives resolved values (D8).

Not read sites: `SymbolEditorModal.tsx:283-284` (already guarded), `irStyle.ts` (only the CSS
base border, no read of the IR border), `irValidate.ts` (no border check today),
`SymbolPreview.tsx` (the 72x48 catalog tile reads `SymbolPreset.values`, which stays scalar).

## D2 · `default` absent ≡ no override: **confirmed**

**Decision.** `default` absent ≡ `''` ≡ no override, and the panel writes `default` only
when the user sets one. No default is ever persisted.

Verified: `irCompile.ts:258` resolves `default` to the compile fallback when absent, and
`fill` compiles with fallback `''` (`irCompile.ts:306`). "Otherwise → None" in the UI is
the rendering of an absent `default`, not a value to write. Same discipline as
`StructureSpec` and as `FormSpec.theme`, whose default deliberately belongs to the host.

## D3 · `when/then/else` → `rules`: **confirmed**

**Decision.** The panel always writes the `rules` form (one rule plus optional `default` is
the equivalent of `when/then/else`); on read it accepts both. `irCompile` is unchanged
(it already handles both at `:246-263`), `isConditionalValue` already accepts both, no
VersionFixer, no migration.

**Correction to version 1 of this document.** It said a `{ rules: [] }` value should never
be persisted. That is wrong for the case the mockup draws in 2i, "switched to Conditional, no
rules yet, every State uses the default below": `{ rules: [], default: X }` is the honest
encoding of that state, because it is what makes the segmented control come back on
Conditional when the modal reopens. `02-coder-spec.md` slice 1 is right to write it.
The refined rule: persist `{ rules: [], default: X }` when the user has chosen Conditional
and set a default; write the scalar back (or drop the axis) only when there is neither a rule
nor a default, since `{ rules: [] }` alone is indistinguishable from absence at compile
(`irCompile.ts:258-263` falls through to the fallback).

## D4 · Predicate editing in a row: **confirmed (a)**

**Decision.** Reuse `PredicateBuilder` in a per-row popover; the row shows a read-only
pretty-print. No text-to-Predicate parser in v1.

`formatPredicate(p: Predicate): string` does not exist today (no `formatPredicate`,
`prettyPredicate` or `describePredicate` anywhere in `src/`). It goes in
`components/ui/ConditionalEditor/conditional.ts`, the home `02-coder-spec.md` gives it. That
file already exists: 17 lines, pure, a single type import from `irTypes`, and it already hosts
`isConditionalValue`, which the authoring panels import through the `ui` barrel
(`TextStyleField.tsx:3`). It becomes the single source of the row text, the preview captions
(D8) and the "Suggested:" chips. Its tests import the module file directly, never the `ui`
barrel, which re-exports React components. Two requirements on it:

- total over the union, `marked` and `literal` included;
- never throws on an unrecognized `op`, returning a neutral placeholder instead. Saved IR
  can carry an op this build does not know: `irValidate.ts` treats that as a load error, but
  `formatPredicate` must not be the thing that crashes the panel.

## D5 · Corner radius: **confirmed as an axis, absent is not zero**

**Decision.** `ShapeSpec.cornerRadius?: number` (px, scalar, additive, not Conditional in
v1). **Absent keeps today's rendering.** A written value, 0 included, replaces the form's base
radius on the forms that honor the axis.

- **Absent is not 0.** Today every `.ir-node-content` carries `border-radius: 4px`
  (`irStyle.ts:72`) and `rounded` carries 10px (`irStyle.ts:82`); the polygons are sharp.
  Reading absent as 0 would square every saved `rect` and `rounded` view on load, which the
  no-VersionFixer rule rules out. So: absent = the form's base radius (4px `rect`, 10px
  `rounded`, 0 for polygons); a written r is used as typed, and 0 is persisted when the user
  writes it. The panel shows the base radius as placeholder while the axis is absent, and a
  reset drops the key: the D2 discipline. The help text "0 keeps sharp corners" stays true,
  because 0 is a written value.
- **Which forms honor the axis, gated by form and not by painter kind.** `rect` and `rounded`
  get an inline `border-radius`, which beats the class rule. `diamond`, `hexagon` and
  `parallelogram` get `roundedPolygonPath(points, r)`, a new pure function beside the
  descriptors in `shapeRegistry.ts`, emitting a closed path with arcs. `ellipse`, `circle` and
  `stadium` ignore it even though they are CSS-painted: their roundness *is* their
  `border-radius` (50%, 50%, 999px, `irStyle.ts:94, 98, 116`), and applying r would turn a
  circle into a rounded square. `cylinder` and `cloud` (D6) are `svgPath` and ignore it too.
  The set that honors the axis is exactly the set the mockup copy names: "rectangles,
  diamonds, hexagons, parallelograms alike". Document the ignore list in the `ShapeSpec` doc
  comment and keep the panel help text as written.
- **Coordinate space.** `02-coder-spec.md` slice 3 makes the right call and it is
  load-bearing: the registry's `points` live in a `0 0 100 100` viewBox drawn with
  `preserveAspectRatio="none"`, so a radius applied there is stretched by the box aspect and
  comes out as an ellipse quadrant. For r > 0 the painter converts the points to real
  `(w, h)` pixels and emits a `<path>` in a `0 0 w h` viewBox.
- **Correction.** `edgeEndpoints.ts` is not affected: it handles endpoint expressions, not
  geometry. The geometry consumers are `DynamicHandles.tsx`, the only reader of
  `insetFractionAt` / `handleInsetAt` (through `getShapeDescriptor`), and `contentRect` in
  `shapeRegistry.ts`.
- Confirmed: no anchor and no content-rect recompute for r ≤ 12px; clamp to `min(w,h)/4` at
  render. Both are render-time, and the authored number is stored as typed.
- `rounded` stays a distinct `ShapeForm`. It is a catalog preset and a `symbolRecognition`
  discriminator, and recognition compares `form` exactly (`symbolRecognition.ts:67`), so
  collapsing it into `rect + cornerRadius` would silently re-recognize every saved rounded
  symbol. The radius is orthogonal: when written, it replaces the 10px base.
- `irValidate.ts` gets a numeric guard for `cornerRadius` (finite, ≥ 0), in the same place
  and the same spirit as the closed-vocabulary check on `shape.padding` (`:120-125`).
- **`cornerRadius` is not a recognition axis.** `recognizeSymbol` must ignore it, otherwise a
  BPMN task with r = 6 stops matching its own preset and the modal titles it "Custom symbol".
  The radius is orthogonal by construction, and recognition compares the preset axis space
  only.
- `SymbolPreview` (the 72x48 tile). The modal already feeds it a synthetic preset built by
  `currentAxesPreset` (`SymbolEditorModal.tsx:93-105`), so the radius does need to reach it,
  but as an **optional prop**, passed only when written, not as a new `SymbolPreset.values`
  field. Keeping it out of `values` keeps the catalog a pure point in the preset axis space and
  keeps the previous point true for free. Catalog tiles and the rail card pass nothing and
  render as today.

## D6 · Goal family: **confirmed, edges out of scope, two corrections**

**Decision.** `CatalogFamily` gains `'Goal'`, appended last in `CATALOG_FAMILIES` (the order
there is the section order). Nine presets, notations `'i*'`, `'KAOS'`, `'GRL'`, one per
preset as BPMN and UML already do.

The count checks out: the catalog holds 47 presets today (Base 9, Process 29, Data (ER) 7,
Flowchart 2) and the mockup's search placeholder reads "Search 56 presets…". 47 + 9 = 56.
The mockup was built on the real catalog.

- Goal → `stadium`, Softgoal → `cloud`, Task → `hexagon`, Resource → `rect`,
  Actor → `circle`, Agent → `circle` + marker, Role → `circle` + marker,
  Belief → `ellipse`, Obstacle → **`parallelogram`**.
- **Obstacle is a parallelogram, not a diamond.** `diamond` plus a plain border is already
  the ER relationship point in the axis space, and `recognizeSymbol` returns every preset
  whose written axes coincide while the modal titles the symbol with `matches[0]`
  (`SymbolEditorModal.tsx:180`). A diamond Obstacle would come back labelled as an ER
  relationship. The parallelogram is both the KAOS drawing and a collision-free point.
- **Softgoal is not the only new rendering code.** `cloud` is a new `ShapeForm` with an
  `svgPath` painter (a cloud is arcs, not a polygon, like the cylinder), plus a
  `ShapeDescriptor` entry: `insetFractionAt`, `sizing`, resize policy. Agent and Role also
  need two new ids in `markerRegistry.ts` (`bar-top` and `bar-bottom` as `02-coder-spec.md`
  names them): there is no bare-line glyph in the registry today
  (`x`, `plus`, `circle`, `asterisk`, `envelope`, `clock`, `triangle`, `lightning`, `gear`,
  `person`, `document`, `loop`, `bars`, `dot`, `history`, `history-deep`).
- Goal edges (contribution make/help/hurt/break, AND/OR decomposition, dependency D) are
  **out of this round**. Separate ticket on `EdgeViewIR.terminations`; nothing in the Symbol
  Editor depends on it.

## D7 · Catalog popover: **confirmed, preservation rule pinned**

**Decision.** `SymbolCatalogPicker` gains `variant='popover'` reusing the `'column'` code
path unchanged, so D18 recents, the search-first layout and the D24 family sections need no
new plumbing. "Keep my Fill / Border rules when switching" is checked by default, as in the
mockup.

**The rule, in one line: a preset overwrites a scalar axis and never a conditional one.**
With the flag on, `applyPresetToShape` preserves any axis the author left as a
`Conditional`; scalar axes still follow the preset. Authored rules outrank the preset.

What already holds today and must not regress: `applyPresetToShape` already preserves the
author's border **color**, already preserves `fill` unless the preset declares one (fill is
symbol semantics for initial state and Petri transition), and already **removes** `marker`
when the preset declares none, so that "task" after "service task" drops the gear. With the
flag on, a conditional `marker` survives a preset that declares no marker. With the flag
off, behavior is exactly today's.

**Where this differs from `02-coder-spec.md` slice 4.** That spec says a kept conditional
axis also receives the preset's value into `default` when `default` is absent. Do not do
that. It persists a default the user never set, which is exactly what D2 forbids, and it
changes what every instance matching no rule renders as, silently, on an action whose own
checkbox promises to keep the author's rules. With `keepRules` on, a conditional axis is
left untouched, full stop. With `keepRules` off, the preset applies exactly as it does today.

`Manage presets…` in the popover footer is out of scope: drop it or render it disabled.

## D8 · Multi-instance preview: **confirmed real instances only, plus two missing pieces**

**Decision.** Up to 3 real instances, in DOM order, active dock pane only. No synthetic
"Sample" mode in v1: the On canvas / Sample segmented control stays out of the DOM rather
than shipping disabled, and gets its own ticket. With 0 instances the strip keeps today's
symbolic replica, which already degrades honestly.

`useCanvasNodeBox` already queries every `.mm-node[data-viewid]` mark and keeps the first
(`useCanvasNodeBox.ts:50-58`). Generalize to `useCanvasNodeBoxes(viewId, max)` returning the
array, and keep the single-box hook as element 0 so the existing callers do not move.

Two pieces the brief does not cover, both needed for the caption:

1. **Nothing exposes which rule won.** `CompiledConditional<T>` returns `T` only
   (`irCompile.ts:244-263`) and `compilePredicate` is not exported. Add one exported helper,
   `matchIndexOf<T>(c: Conditional<T>, ctx: ReadCtx, id: string): number | null`, null
   meaning default/base. Additive, no change to `CompiledConditional`, no change to any
   render path. The per-instance `ReadCtx` is already available through
   `makeReadCtx(idlookup)` (`irReadCtxLproxy.ts:62`) and the compiled accessors already take
   `(ctx, id)`.
2. **`SymbolBoxPreview` is a replica, and declares per-instance conditional axes out of
   scope** (its header comment says so). Keep it dumb: the modal evaluates the axes per
   instance and passes the resolved `{ form, fill, border, marker }` plus the caption.
   Do not turn the replica into a real IR render in this round.

Caption text is `formatPredicate(rules[i].when)` for the winning index, `otherwise` when
null in Fill and Marker, `base` when null in Border. The mockup uses both words and they
denote the same state in two sections; keep both, each reads correctly where it sits.

---

## Out of scope, and why the coder-spec must not promise it

The brief says the data model "already holds almost everything". For the three sections the
1b shell exposes as tables, that is true for Fill and Border and **false for Marker**. The
rest of the mockup's sections are further out. Naming them here so the coder-spec does not
quietly commit to them.

- **2e Markers (real gap).** The mockup shows a list of markers, each with its own
  predicate, position and color, and "all matching rules show". The IR has
  `marker?: Conditional<string>`: one glyph, first match wins, no position, painted in the
  border color (`IRNodeContent.tsx:371`). Either the section ships as a when-to-glyph table
  with first-match-wins and no position or color columns, or the axis grows to
  `markers?: { when?: Predicate; glyph: string; position?: BadgePosition; color?: string }[]`.
  That is a new decision, call it D9, and it needs to be taken before slicing the Marker
  section.
- **2d Padding, custom per side.** `padding` is a scalar token
  (`'small' | 'normal' | 'large'`) with a closed-vocabulary validator. Per-side pixels and
  the link checkboxes are a new axis.
- **2f Sizing.** Only `resizable?: boolean` exists on `VertexViewIR`. Min/max width and
  height, overflow policy, keep-aspect and grow-to-contain are not in the IR; the box today
  is derived by the sizing engine from content plus the shape's supplement.
- **2g Secondary lines.** Expression-valued repeated lines are not a `LabelSpec`. The
  nearest existing construct is a field compartment over a `children` or `references` source.
- **2a "Notations" chips and "Also used for".** No model support. What exists is
  `metaclasses[]` plus `authoringMetaclassPins`.

## Edits `02-coder-spec.md` needs

Applied to `02-coder-spec.md` on 2026-09-15, together with version 3 of this document.

The spec assumed D1a, D3 rules-always, D4a, D5 scalar, D6 nodes only, D8 real instances.
Four of those hold. D1 does not, D3 is refined, D5 needs the absent-is-not-zero rule, and one
slice is missing outright.

**Slice 1 (Fill, Marker).** Stands, with three amendments. `formatPredicate` keeps the home the
spec gives it, `components/ui/ConditionalEditor/conditional.ts`, which already exists and is
extended rather than created; its tests import the file, not the `ui` barrel. The acceptance
test "on every `op`" must include `marked` and an unknown operator, which must return a
placeholder rather than throw. The empty state persists as `{ rules: [], default }` exactly as
written, and the scalar write-back applies only when there is no default either (see D3).

**Slice 2 (Border).** Must be rewritten for the per-axis shape.

- `irTypes.ts`: `border?: { color?: Conditional<string>; width?: Conditional<number>; style?: Conditional<'solid'|'dashed'|'dotted'|'double'> }`.
- `irTypes.ts:718` and `irCompile.ts:307`: `CompiledView.border` becomes `borderColor`,
  `borderWidth`, `borderStyle`, each `CompiledConditional<…> | null`, copying
  `compileEdgeView` (`:505-507`).
- `symbolRecognition.ts`: **not** "recognize on the `default`". Route `style` and `width`
  through the existing `scalarOf` sentinel, so a conditional axis means no preset match, which
  is already the rule for `form`, `fill` and `marker`. Recognizing border on its default while
  the other three axes do not would be an inconsistency inside one function.
- Panel: an OVERRIDES row is a predicate plus the subset of axes it overrides, written as one
  rule in each of those axes. It is not a complete BorderSpec with a chip filter on top, and
  the "+ color" chip adds a rule to `border.color` rather than revealing a field that was
  already there. Read back by grouping axes on structural equality of `when`.
- `SymbolEditorModal.currentAxesPreset` (`:93-105`) reads `shape.border.style` and `.width`
  as scalars today. It needs the same "scalar or omit" treatment it already applies to
  `marker` and `fill`.
- `SymbolCard.tsx:35` needs the scalar-or-default guard on the border color; the spec did not
  list it. `irStyle.ts`, which the spec lists, reads no border and needs no change.
- The acceptance criteria stand as written and are the right ones: "Weak entity" still
  recognized, a view saved with a scalar border opens identical.

**Slice 3 (Corner radius).** Stands, with the D5 corrections. "Absent = 0, never persist 0" is
replaced by "absent = the form's base radius, a written value (0 included) is persisted". The
painter gates on form: `ellipse`, `circle` and `stadium` ignore the axis although they are CSS.
`cornerRadius` stays out of `recognizeSymbol`, and `SymbolPreview` takes it as a prop rather
than through `SymbolPreset.values`. The `edgeEndpoints.ts` TODO the spec asks for goes in
`DynamicHandles.tsx` instead, which is the module that actually reads the shape profile.

**Slice 4 (Goal family and popover).** Stands, minus the `default` injection in
`applyPresetToShape` (see D7). Two additions: `ShapeForm += 'cloud'` needs a full
`ShapeDescriptor`, not only a painter, so `insetFractionAt`, `sizing` and the resize policy
have to be chosen and the equivalence test in `ir/__tests__/shapeRegistry.test.ts` extended; and
the section nav badge, which the spec defines as `rules.length`, has no single number for
Border now, so it counts distinct override rows, that is distinct predicates across the three
axes. `defaultResizableForForm` lives in `editor-v2/nodes/nodeSizing.ts`, not in the panel.

**Slice 5, missing: the multi-instance preview (D8).** The spec has no slice for it. The 1b
shell is specified in slice 4 and the mockup captions ("Idle · isInitial", "Running · base")
are shown in every artboard, but nothing in `02` delivers them, and the only D8 line in the
out-of-scope list is the synthetic Sample mode. The slice is: widen `useCanvasNodeBox` to
`useCanvasNodeBoxes(viewId, max)`; add `matchIndexOf` to `irCompile.ts`; have the modal build
a `ReadCtx` and resolve the axes per instance; pass resolved values plus caption into
`SymbolBoxPreview`, which stays a pure replica. Without it slice 4 ships the 1b shell with
today's single-instance strip, which is a defensible intermediate state but must be a stated
one rather than an omission.

**Out of scope list.** Correct as written. Add the Marker gap above it, because 2e is
currently listed in the screen map as "reuse slice 1, no extra work", and that is true only
for a reduced Marker section.

## Constraints reaffirmed

No editorial fork of `VertexAuthoringPanel`: the modal keeps re-hosting it. Writes only
through whole-object `set_ir`, with the panel realigning on the external reseed. IR
additive-only, no `irVersion` bump, no VersionFixer. No `op` key with a string value outside
`Predicate`, which is the premise `irValidate.ts:75` relies on to find unknown operators
generically. Modal mounted once at the root, opened through
`JjodelEvents.SYMBOL_EDITOR_OPEN`.
