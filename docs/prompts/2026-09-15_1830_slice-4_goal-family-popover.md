# Slice 4: Goal family and catalog popover

Generated 2026-09-15. Source documents: `handoff/decisions-symbol-editor-1b.md` (version 3),
decisions D6 and D7, and `handoff/02-coder-spec.md`, slice 4. Mockups: artboard 2h and the 1b
shell in `Symbol Editor Variants.dc.html`.

**Parallelism.** Run it last among the shell slices, after slice 2 (it extends
`applyPresetToShape`, which slice 2 rewrites) and after slice 3 (both touch `shapeRegistry.ts` and
`FORM_OPTIONS`).

## COSA

Three things: the Goal family in the catalog, the catalog moved into a popover, and the 1b shell
of the modal.

## DOVE

- `viewpoint/ir/irTypes.ts`: `ShapeForm` gains `'cloud'`.
- `viewpoint/ir/shapeRegistry.ts`: the `cloud` descriptor.
- `viewpoint/ir/notationCatalog.ts`: `CatalogFamily`, `CATALOG_FAMILIES`, the nine presets,
  `applyPresetToShape`.
- `viewpoint/ir/markerRegistry.ts`: `bar-top` and `bar-bottom`.
- `viewpoint/authoring/SymbolCatalogPicker.tsx`: `variant='popover'`.
- `viewpoint/authoring/SymbolEditorModal.tsx` and `.scss`: the 1b shell.
- `viewpoint/authoring/VertexAuthoringPanel.tsx`: `FORM_OPTIONS` at line 40, plus the
  `activeSection` prop.
- `editor-v2/nodes/nodeSizing.ts`: `defaultResizableForForm` and `keepAspectRatioForForm` for
  `cloud`.
- `viewpoint/ir/__tests__/shapeRegistry.test.ts`.

## COME

**The nine presets**, notation `'i*'`, `'KAOS'` or `'GRL'`, one per preset as BPMN and UML already
do: Goal as `stadium`, Softgoal as `cloud`, Task as `hexagon`, Resource as `rect`, Actor as
`circle`, Agent as `circle` plus marker `bar-top`, Role as `circle` plus marker `bar-bottom`,
Belief as `ellipse`, Obstacle as `parallelogram`.

**Obstacle is a parallelogram, not a diamond.** A diamond with a plain border is already the ER
relationship point in the axis space, and `recognizeSymbol` returns every preset whose written axes
coincide while the modal titles the symbol with `matches[0]`, so a diamond Obstacle would come back
labelled as an ER relationship. The parallelogram is both the KAOS drawing and a free point.

**`cloud` needs a full `ShapeDescriptor`**, not just a painter: `painter` of kind `svgPath` (a
cloud is arcs, not a polygon, like the cylinder), `defaultResizable`, `keepAspectRatio`,
`insetFractionAt`, and `sizing`. Start from the ellipse parameters and an inset of roughly 18% per
side, then extend the equivalence test in `__tests__/shapeRegistry.test.ts` so the new descriptor is
covered like the others. `markerRegistry` has no bare-line glyph today, hence the two new ids.

**Counts.** The catalog holds 47 presets in 4 families today (Base 9, Process 29, Data (ER) 7,
Flowchart 2). After this slice it must be 56 in 5, which is what the search placeholder of the
mockup shows. `catalogFamilySections` must return Goal with a total of 9.

**Popover.** Add `variant='popover'` reusing the existing `'column'` code path, so D18 recents, the
search-first layout and the D24 family sections need no new plumbing. Footer: the checkbox "Keep my
Fill / Border rules when switching", checked by default, and "Manage presets…" disabled or dropped.

**`applyPresetToShape(shape, preset, { keepRules })`.** The rule in one line: **a preset overwrites
a scalar axis and never a conditional one.** With `keepRules` on, an axis that is `Conditional`
(`fill`, `marker`, or any of the three border axes) is left untouched, full stop. Do **not** write
the preset value into `default` when `default` is absent: that persists a default the user never
set, which the D2 convention forbids, and it silently changes what every instance matching no rule
renders as, on an action whose own checkbox promises to keep the author's rules. With `keepRules`
off, the behavior is exactly today's.

**1b shell.** Header with the "View for X" subtitle and the chip
`[glyph] Rectangle [preset·modified] Change…` that opens the popover; the catalog column
disappears. Body becomes a 170px section nav plus the panel: Symbol, Fill, Border, Padding, Marker,
Sizing, Text, each with a rule-count badge. The badge is `rules.length` for a single-axis section;
for Border, where three axes each carry rules, it counts **distinct override rows**, that is
distinct predicates across the three axes. Clicking a section shows the matching FormSection of the
re-hosted panel: pass `activeSection` as an extra prop that drives the visibility filter, the same
way `activeTab` does today. **Do not fork `VertexAuthoringPanel`.** Move "Reset to preset" from the
header to the footer as "Revert to preset", next to "Done".

## Acceptance

- 56 presets, 5 families, Goal with 9.
- Switching preset with `keepRules` on leaves a two-rule fill untouched and does not create a
  default.
- Switching preset with `keepRules` off behaves exactly as before this slice.
- A Softgoal node resizes and renders like the other geometric shapes, and the registry test covers
  its descriptor.
- Snapshot test of the popover.

## Out of scope

Goal edges: contribution make/help/hurt/break, AND/OR decomposition, dependency D. They need
`EdgeViewIR.terminations` and have their own ticket. Also out: multiple markers per symbol, the
"Notations" chips of artboard 2a, per-side padding, the Sizing min/max fields.

## Commit

`feat: add Goal family and move the symbol catalog into a popover`

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
