# Slice 2: per-axis conditional border

Generated 2026-09-15. Source documents: `handoff/decisions-symbol-editor-1b.md` (version 3),
decision D1, and `handoff/02-coder-spec.md`, slice 2. Mockup: artboard 2c.

**Parallelism.** Run it alone. It touches `IRNodeContent.tsx` in the same region as slice 3 and
`notationCatalog.applyPresetToShape` in the same function as slice 4. It reads best after slice 1,
whose `formatPredicate` the override rows use, but it does not depend on slice 1 code to compile.

## COSA

`ShapeSpec.border` is scalar today: `{ color, width, style }`. The mockup asks for a scalar base
plus override rows where "only listed properties change, the rest stay as above". Make each axis of
the border independently conditional, exactly like `EdgeViewIR.line` already is
(`irTypes.ts:538-542`), and build the override table on top of that.

Why per-axis and not `Conditional<BorderSpec>`: every existing `Conditional<T>` in the schema is
over a primitive, so a conditional over an object would be a new pattern; the edge line, which is
the same concept, is already per-axis and would diverge permanently since saved IR has no
VersionFixer; and with whole-object replacement a branch that repeats the base color is
indistinguishable from one that inherits it, so the state of the "+ color" chip cannot be
recovered on reopen and every base edit leaves the branches stale.

## DOVE

- `viewpoint/ir/irTypes.ts`: the `border` field of `ShapeSpec` (around line 155) and the `border`
  field of the compiled view (around line 718).
- `viewpoint/ir/irCompile.ts`: line 307 and the `CompiledView` assembly around line 422.
- `viewpoint/ir/IRNodeContent.tsx`: lines 333 to 371 (inline CSS border, SVG stroke, dash, the
  `double` overdraw, the marker color).
- `viewpoint/ir/symbolRecognition.ts`: lines 61 to 69.
- `viewpoint/ir/notationCatalog.ts`: `applyPresetToShape`, lines 138 to 146.
- `viewpoint/authoring/SymbolBoxPreview.tsx`.
- `viewpoint/authoring/SymbolCard.tsx`: line 35, which reads `shape?.border?.color` as a scalar.
- `viewpoint/authoring/SymbolEditorModal.tsx`: `currentAxesPreset`, lines 88 to 105, which reads
  `shape.border.style` and `.width` as scalars.
- `viewpoint/authoring/VertexAuthoringPanel.tsx`: the Border FormSection, lines 341 to 360 for the
  `patchBorder` helper and 546 to 560 for the section itself.

## COME

**Type.** `border?: { color?: Conditional<string>; width?: Conditional<number>; style?:
Conditional<'solid' | 'dashed' | 'dotted' | 'double'> }`. This is additive at the type level,
because `Conditional<T> = T | ...`: every persisted IR, every catalog preset and `irDemoFixture`
stay valid untouched. Note that the node border has `'double'` while the edge line does not, so do
not factor the two style unions into one type.

**Compile.** `CompiledView.border` becomes `borderColor`, `borderWidth`, `borderStyle`, each
`CompiledConditional<...> | null`, built with `compileConditional` exactly as `compileEdgeView`
does at lines 505 to 507. Keep the same fallbacks the render sites use today: `var(--border-default)`
for the color, `1` for the width, `'solid'` for the style.

**Recognition.** Do **not** recognize on the `default`. Route `style` and `width` through the
`scalarOf` helper that already exists in `symbolRecognition.ts` with its `CONDITIONAL` sentinel, so
a conditional axis means "no preset match", which is already the rule for `form`, `fill` and
`marker`. Recognizing the border on its default while the other three axes do not would put two
different rules inside one function.

**`applyPresetToShape`.** Keep today's behavior in this slice: `style` and `width` are always
written (normal is solid 1 when the preset declares nothing), the author's **color** is preserved,
`marker` is written or removed, `fill` is written only when the preset declares one. The only
change is handling the new shape of the field. The "keep my rules" flag belongs to slice 4.

**The panel.** The Border section becomes a scalar base (color, width in px, style) plus an
OVERRIDES table. An override row is a predicate plus the subset of axes it overrides, and it is
written as **one rule in each of those axes, all sharing the same `when`**. It is not a complete
BorderSpec with a display filter on top, and "+ color" adds a rule to `border.color` rather than
revealing a field that was already there. On read, rebuild the rows by grouping the axes on
structural equality of `when`. Predicates that do not coincide across axes cannot be folded into a
row: only hand-written or generated IR produces them, so fall back to one row per axis and say so
in the UI rather than dropping them.

## Acceptance

- A view saved with a scalar border opens and renders identically, pixel for pixel.
- The ER preset "Weak entity" is still recognized, and so are the BPMN event presets that set
  `style: 'double'` with `width: 3`.
- An override on `width` alone leaves the base color and style in force on every instance that
  matches no rule.
- Editing the base color after adding an override does not change what the override renders.
- `SymbolCard` and the catalog thumbnail keep working when the border color is conditional: they
  fall back rather than rendering an object.

## Out of scope

Corner radius, the Goal family, the catalog popover, the multi-instance preview. The `keepRules`
flag. Any change to the rules editor itself, which is slice 1.

## Commit

`feat: make border color, width and style independently conditional`

### Phase 1: discovery, read only

Read the files under DOVE in full (or the relevant sections of the long ones) before changing
anything, and record what you find.

**The discovery report is mandatory and is what closes phase 1.** Save it as
`docs/discovery/discovery_<YYYY-MM-DD>_<short_snake_case>.md`, creating the folder if it does not
exist. Minimum content: the goal of the discovery, every file read with its full path, the
relevant findings, the dependencies and risks you identified, and the open questions for Alfonso.
Terminal output and chat text do not count: phase 1 is not complete until the report is on disk.

Then **hard stop**. Do not start phase 2 until the analysis has been discussed and you have an
explicit go-ahead.

## Guardrails (same in every slice of this round)

- Read `CLAUDE.md` at the repo root and `docs/CLAUDE_DEVELOPMENT_GUIDE.md` before touching
  `editor-v2/viewpoint`. If this prompt contradicts `CLAUDE.md`, report the conflict and stop:
  do not silently follow either one.
- No critical-zone file is in scope for this slice (`useJjomSync.ts`, `canvasToJjom.ts`,
  `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`,
  `VersionFixer.tsx`). If discovery concludes one of them must change, stop and ask: that needs
  a Layer Impact Report and an explicit go-ahead.
- IR is additive only. No `irVersion` bump, no VersionFixer migration, no rewrite of saved views.
- Touch only the files listed under DOVE. Zero opportunistic refactoring, no renaming of existing
  identifiers (CSS/SCSS classes, variables, functions, components, props), no reordering of imports.
- Before introducing any new identifier (CSS class, exported symbol, custom event, context key),
  grep the whole codebase to check it is not already taken.
- Verify the project builds (`npm run build`) before committing.
- Add one entry to `docs/claude-code-log.md` at the end of the task, with the document name of
  this prompt prefixed by date and time.
- Stage surgically: `git add <specific files>`, never `git add .` or `git add -A`. Do not push.
