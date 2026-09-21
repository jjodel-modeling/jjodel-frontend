# Discovery 2026-09-16 — Slice 2: per-axis conditional border

Prompt: `docs/prompts/2026-09-15_1830_slice-2_border-per-axis.md`, decision D1 of
`docs/handoff/decisions-symbol-editor-1b.md` (ratified), plus the three amendments given with the GO
(slice 1 has landed and is to be reused; a Layer Impact Report is required because CLAUDE.md §3.1
declares `viewpoint/ir/` and `viewpoint/authoring/` critical zone as whole directories, which the
prompt's guardrail line contradicts; the log entry goes to `docs/log-inbox/` per P9).
Branch `validation-skeleton`, HEAD `119803916`, phase 1 read only: no source modified.

## 1. Hypotheses this discovery tries to falsify

- H1. The border's readers are the ones the prompt lists, and nothing outside `editor-v2` reads it.
- H2. Splitting `CompiledView.border` into three axes is invisible to every consumer but the render.
- H3. A view saved with a scalar border can render pixel-identical after the change.
- H4. The override table can be built out of slice 1's parts without a second predicate formatter,
  a second normalizer, or a second copy of the WHEN popover.
- H5. No test pins the current compiled border.

## 2. Files read

All paths under `/Users/alfonso/jjodel`.

- `docs/prompts/2026-09-15_1830_slice-2_border-per-axis.md`
- `docs/handoff/decisions-symbol-editor-1b.md` (D1, D2, D7), `docs/handoff/02-coder-spec.md` (slice 2),
  `docs/handoff/mockup-copy-1b.md` (artboard 2c)
- `docs/discovery/discovery_2026-08-15_border_marker_axes.md` — the discovery that introduced the axis
- `docs/CLAUDE_DEVELOPMENT_GUIDE.md` (index; it holds no section on `editor-v2/viewpoint`), `CLAUDE.md`, `docs/PROTOCOL.md`
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (ShapeSpec 152-180, CompiledView 703-740,
  EdgeViewIR.line 530-560, CompiledEdgeView 636-668)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (compileView 294-330 and the assembly
  400-432, compileEdgeView 480-540, compileConditional 244-263)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (svgOutline 45, render 300-530)
- `frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (grep: the CSS base border)
- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (`SVG_BORDER_DASH` 253-260)
- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (24-55)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (374-400, 644-660)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (88-110, 270-300)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.tsx` (full)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolBoxPreview.tsx` (full)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolPreview.tsx` (grep: border 91-94)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (the Line section, 740-790)
- `frontend/src/components/ui/ConditionalEditor/{conditional.ts,ConditionalEditor.tsx,ConditionalEditor.module.css}`
  (slice 1, commit `aeb0c9134`)
- Tests: `ir/__tests__/{symbolRecognition.test.ts,notationCatalog.test.ts}` (full/55-110),
  `ir/__tests__/ir.test.ts` (helpers), greps over `ir/__tests__` and `authoring/__tests__`

## 3. Findings

### F1. All three border fields are REQUIRED today, so the change is a widening of an exported interface

`irTypes.ts:157`:

```
border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' | 'double' };
```

The field is optional, its three members are not. The target type makes each member optional AND
`Conditional`. For persisted data this is additive (a scalar stays a legal `Conditional<T>`), but at
the type level it relaxes three required properties, which CLAUDE.md rule 11 forbids «except to add
optional properties». D1 ratifies the shape; the deviation is recorded here rather than assumed
(Q9).

### F2. H1 holds: eleven read sites, all inside `editor-v2`

`grep -rn "shape.border|shape?.border"` over `frontend/src` returns **zero** hits outside
`components/editor-v2` and **10** inside (positive control on the same command). The full census,
adding the compiled field:

| site | reads | effect of the change |
|---|---|---|
| `irCompile.ts:307` | `ir.shape.border ?? null` | replaced by three `compileConditional` calls |
| `irCompile.ts:422` | `border` into `CompiledView` | three fields |
| `IRNodeContent.tsx:380` | `compiled.border` → inline `border` shorthand | per-instance, see F5 |
| `IRNodeContent.tsx:413-415,424` | svg stroke, width, dash, `double` | per-instance |
| `IRNodeContent.tsx:428` | marker color = border color | per-instance |
| `IRNodeContent.tsx:472-482` | cylinder ornaments: stroke, width, dash | **not named by the prompt**, F4 |
| `symbolRecognition.ts:61-62` | `style ?? 'solid'`, `width ?? 1` | must go through `scalarOf`, F6 |
| `notationCatalog.ts:138-146` | `applyPresetToShape` | keeps working, F7 |
| `SymbolEditorModal.tsx:102` | `currentAxesPreset` | needs scalar-or-omit, F8 |
| `SymbolEditorModal.tsx:287` | preview border color | **already guarded** `typeof === 'string'` |
| `SymbolCard.tsx:35` | `shape?.border?.color ?? DEFAULT_BORDER_COLOR` | renders `[object Object]`, F9 |
| `VertexAuthoringPanel.tsx:381,393` | `border`, `patchBorder` | replaced by the base + overrides UI |
| `irDemoFixture.ts:64,93` | writes scalar borders | unaffected |

`SymbolPreview.tsx:91-94` reads `preset.values.border`, which is the catalog's own scalar type, not
the IR: it is unaffected **provided** F8 is done, because the modal feeds it a synthetic preset.

### F3. H2 holds for the compiled side: `CompiledView.border` has exactly one consumer

`irTypes.ts:738` declares it; `IRNodeContent.tsx` is the only reader (grep above). `compileEdgeView`
already does per-axis compile at `irCompile.ts:505-507` and is the template to copy:

```
lineColor: e.line?.color !== undefined ? compileConditional(e.line.color, '', deps) : null,
lineWidth: e.line?.width !== undefined ? compileConditional(e.line.width, 1, deps) : null,
lineStyle: e.line?.style !== undefined ? compileConditional(e.line.style, 'solid' as const, deps) : null,
```

Predicates inside the axes extend `deps` through `compileConditional` for free, so per-instance
re-render on the right features comes with no extra plumbing.

### F4. The prompt's line range misses the cylinder ornaments

The prompt names `IRNodeContent.tsx` «lines 333 to 371». After slice 3 the border block sits at
376-430, and the **ornaments** branch (the cylinder lid, `:472-482`) also paints with `svgStroke`,
`svgStrokeWidth` and `svgDash`. Left out, a cylinder's lid would keep the base border while its
silhouette follows the override. It is the same JSX and the same three locals, so it costs nothing —
but it is one more site than the prompt declares.

### F5. H3 is at risk on ONE case: a border with only some axes authored

Today the emission is all-or-nothing (`IRNodeContent.tsx:380`):

```
const b = compiled.border;
if (b && !svgPainter) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;
```

`border` absent → **no inline border at all**, and the CSS box rule applies
(`irStyle.ts:72`, `.ir-node-content { border: 1px solid var(--border-default); }`). With three
independent axes a new state appears that cannot exist today: *some* axes authored. If the render
emits the shorthand whenever any axis is non-null, a view that authors only `color` starts emitting
`1px solid <color>` inline, which is what the CSS rule already paints — same pixels. If instead it
emits nothing until all three are present, an authored color would not paint. Both are defensible;
the point is that **the prompt does not say**, and «pixel for pixel» only constrains the two states
that exist today (all three, or none). Q4.

### F6. Recognition breaks silently unless routed through `scalarOf`

`symbolRecognition.ts:61-62` reads the two axes raw. A conditional `width` would be an object,
unequal to every preset's number, so **every** preset fails and the modal titles the symbol «Custom
symbol» with no error. `scalarOf` (`:45-48`) already returns the `CONDITIONAL` sentinel for exactly
this, and its doc comment («every axis this module compares is a primitive») stays true per axis —
it must be applied to `shape.border?.style` and `shape.border?.width`, never to `shape.border`,
which is an object in both worlds.

### F7. `applyPresetToShape` keeps working, and its «preserve the author's color» rule survives

`notationCatalog.ts:138-146` copies `prevBorder?.color` verbatim into the new border and writes
`width`/`style` from the preset. With a conditional color the same line carries the whole object
across, which is precisely the preservation rule, extended for free. Only the type of the local
changes. `notationCatalog.test.ts:76` (`expect(next.border).toEqual({color, width, style})`) and
`symbolRecognition.test.ts:32` keep passing: they build scalars.

### F8 / F9. Two unguarded reads that would render an object

- `SymbolEditorModal.tsx:102` puts `shape.border.style/width` into a `SymbolPreset`, whose type
  declares them scalar. A conditional axis reaches `SymbolPreview` (`${object}px`, dash lookup by
  object) and `SymbolBoxPreview:114-120`. The fix is the «scalar or omit» treatment already applied
  to `marker` and `fill` two lines above.
- `SymbolCard.tsx:35` feeds `borderColor` into `style={{ background }}` and prints it as hex text:
  a conditional color renders `[object Object]`. The guard to copy is in the same codebase, at
  `SymbolEditorModal.tsx:287`.

### F10. Sizing reads the DOM, not the IR

`useContentSize.ts:54-55` subtracts `borderLeftWidth`/`borderRightWidth` from the **computed style**
of the rendered node. A per-instance width is therefore absorbed per node with no coupling to the IR
— one less thing to wire, and the reason a conditional width does not disturb the sizing engine.

### F11. H5 holds: no test pins the compiled border

`grep -E "\.border|border:"` over `ir/__tests__` and `authoring/__tests__`, minus the two catalog
suites, returns nothing (positive control: `ir.test.ts` has 31 hits for `form`). The two suites that
do mention it build scalar `ShapeSpec`s and stay valid. `symbolRecognition.test.ts` already pins the
conditional rule for the other axes («form condizionale non riconosce nulla», `:102`), so the new
cases for a conditional `width`/`style` have an exact template.

### F12. `irValidate` needs nothing new, and gets the predicate check for free

There is no border rule today. `findUnknownPredicateOp` (`irValidate.ts:76-94`) walks the whole ir
generically, so predicates inside the new border axes are covered the day they exist. A numeric
guard on `width` would be new policy, not a requirement of this slice (Q8).

### F13. H4 is the open one: slice 1's parts are reusable as VALUES, not as UI

What slice 1 exports and the override table can use directly, with no second copy:
`formatPredicate(p, {subject})`, `toRules`, `fromRules`, `RulesForm<T>` (`conditional.ts`, pure).

What it does **not** export, and the table needs:

- the **WHEN cell**: the trigger button plus the portal popover with `PredicateBuilder`, its
  outside-mousedown / Esc / scroll closers and `whenPopoverStyle`. All of it lives inside
  `RulesModeEditor`, a module-private function in `ConditionalEditor.tsx`. Reusing it means
  extracting it into `ui/ConditionalEditor/`, which is **not in this slice's DOVE**. Q2.
- the **CSS classes**: they are a CSS module, so they are reachable only by importing
  `ui/ConditionalEditor/ConditionalEditor.module.css` from the panel. Measured: **no cross-folder
  CSS-module import exists anywhere in `frontend/src`** (the single grep hit is a test that reads
  `Select.module.css` as text). Reuse here would set a precedent. Q3.

### F14. The grouping logic is new, and it has no home yet

An override row is *one predicate + up to three axis rules sharing it*. Reading it back means
grouping the three arrays by structural equality of `when`; writing it means one rule per axis.
`toRules`/`fromRules` work on a single axis and do not cover this. Two sub-problems:

- **Predicate equality** needs a canonical comparison. `JSON.stringify` is key-order sensitive, and
  the builder produces `{...k, path}` spreads whose key order is not guaranteed to match a
  hand-authored or preset-written predicate. A stable-key serializer is required for the grouping to
  be reliable. Q5.
- **Order.** First-match-wins is per axis, so each axis has its own order. Three axes can disagree on
  the order of the predicates they share, and then no single row list represents them. The prompt
  covers the *predicate mismatch* case («fall back to one row per axis and say so») but not the
  *order mismatch* case. Q5.

Where this code lives decides whether it is testable in the node bench: a pure module is, logic
inside the panel `.tsx` is not (the panel does not import under node — the lesson CLAUDE.md §5 draws
from lanes A2-A4). Q1.

### F15. The panel's `double` hint becomes ambiguous

`VertexAuthoringPanel.tsx:655` shows «Double shows two lines from width 3 up» when
`border.style === 'double' && border.width < 3`. With a base plus overrides, the condition must
either be scoped to the base row or evaluated per row. Q6.

### F16. Minor, not in scope

`#334155` is spelled three times as a border default: `DEFAULT_BORDER` (panel), `INK`
(notationCatalog), `DEFAULT_BORDER_COLOR` (SymbolCard). Noted, not touched.

## 4. LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)        — only as the SHAPE of DViewElement.ir (JSON), no new write path
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges) — IRNodeContent paints the border
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString) — declared to assert NO migration, see below
```

**D-layer.** *What changes*: the type of `ShapeSpec.border` inside the `ir` blob of a
`DViewElement`. *What does NOT change*: the write path (`view.ir = draft` → `SetFieldAction`, the
whole-object replace the panel already uses), the key name, the id space, every other field.
*Cross-layer interaction*: none beyond the existing `set_ir`. *Side-effect safety*: a scalar
`{color,width,style}` stays a legal value of the new type, so every persisted view, every catalog
preset and `irDemoFixture` remain valid **unread and unwritten**.

**Canvas v2-flow.** *What changes*: `IRNodeContent` resolves three values per instance instead of
reading one object per view — the inline shorthand, the SVG stroke/width/dash, the `double`
overdraw, the cylinder ornaments and the marker color. *What does NOT change*: the DOM structure,
the class names, `irStyle.ts`, the sizing engine (F10), anchors and handles (the border is paint,
not geometry — the I3 invariant the 2026-08-15 discovery states). *Cross-layer interaction*:
per-instance reads go through the `ReadCtx` already in scope at those lines. *Side-effect safety*:
the fallbacks stay where they are today unless Q4 says otherwise.

**Persistence.** *What changes*: nothing. *What does NOT change*: no `irVersion` bump, no
VersionFixer migration, no rewrite of saved views — the type is additive by the same argument as
`marker` and `authoringMetaclassPins` (2026-08-15 discovery, F7). This layer is listed to state the
assertion, not because a migration is planned.

**Smoke-test scenarios potentially affected**

- Open a project saved before the change with IR views → every border renders identically (F5 is the
  one case where «identically» needs Q4 answered).
- ER «Weak entity» and «Identifying relationship», BPMN «Intermediate event» and «End event» → still
  recognized (they are the presets that set `style`/`width`).
- Apply a preset over an authored color → the color survives (`notationCatalog.test.ts`).
- The rail Symbol card and the modal preview with a conditional border color → fall back, never
  render an object (F8, F9).
- A cylinder and a diamond with `double` → lid and silhouette agree (F4).
- Sizing: a node whose border width is conditional → the box follows per instance (F10).

**Uncertain about propagation?** The uncertainty is not propagation but two design points, Q4 and
Q5; both are answerable before any diff.

## 5. Risks

- R1 (F5). «Pixel for pixel» is under-specified for partially authored borders. Highest risk in the
  slice, because it is invisible in dev on new views and shows on saved ones.
- R2 (F6, F8, F9). Three unguarded scalar reads that degrade **silently** (custom symbol,
  `[object Object]`, `NaNpx`), none of which throws.
- R3 (F13, F14). Without a decision on where the shared WHEN cell and the grouping live, the slice
  either duplicates slice 1's popover or edits files outside its DOVE.
- R4 (F14). Key-order-sensitive predicate comparison would fold rows together, or apart, depending
  on how the predicate was written. A stable serializer is not optional.
- R5. `IRNodeContent.tsx` is the file slice 3 just finished editing (`8da572191`) and the same region
  slice 4 will touch. The prompt says to run slice 2 alone; the tree is shared, so the commit must go
  in with an explicit pathspec and the file must carry only this lane's hunks.
- R6 (F1). Rule 11 deviation on an exported interface, ratified by D1 but worth naming.

## 6. Open questions for Alfonso

**Q1. Where does the grouping logic live?** Recommendation: a new pure module
`viewpoint/authoring/borderOverrides.ts` (`toOverrideRows` / `fromOverrideRows`), testable in the
node bench, plus its `__tests__`. That is +2 files over the DOVE.

**Q2. May slice 1's WHEN cell be extracted into `ui/ConditionalEditor/` and reused?** It is the only
way to honour «no second predicate formatter, no second normalizer, no cloned popover» literally.
That is +1 file in scope (`ConditionalEditor.tsx`, which slice 1 owns and has committed).
Alternative: duplicate ~40 lines in the panel, which the amendment explicitly rules out.

**Q3. CSS: import `ConditionalEditor.module.css` across folders (no precedent in the repo), or move
the override table into `ui/`?** My recommendation follows Q2: if the WHEN cell moves to `ui/`, its
classes travel with it and the panel imports a component, not a stylesheet.

**Q4. What does a partially authored border render (F5)?** Recommendation: emit the inline shorthand
when **any** axis is authored, filling the unauthored ones with the CSS defaults (`1px`, `solid`,
`var(--border-default)`), which keeps both existing states pixel-identical.

**Q5. Predicate equality and order (F14).** Confirm a canonical stable-key serializer for grouping,
and say what the panel does when the three axes carry the same predicates in a **different order**:
recommendation, the same fallback as a predicate mismatch — one row per axis, with the reason shown.

**Q6. The `double` + width < 3 hint (F15): base only, or per row?** Recommendation: base only in this
slice.

**Q7. Can a view have overrides with no base?** Today `border` absent means «CSS default». With
per-axis axes, `border: { width: {rules...} }` and no base color is expressible. Is that legal, or
does the panel always write a base?

**Q8. Numeric guard on `width` in `irValidate` — in or out of this slice?** Recommendation: out,
unless you want it while the file is open.

**Q9. Rule 11.** Confirm that relaxing the three required members of `ShapeSpec.border` into optional
`Conditional` members is the ratified reading of D1 (F1).

**Q10. Scope of the acceptance run.** `npm run smoke` came back VOID twice during slice 1 because
other lanes were editing the tree under it. If slice 2 runs alone, it can be certified; if not, the
Playwright probe stays the measurement and the void is reported with its cause.
