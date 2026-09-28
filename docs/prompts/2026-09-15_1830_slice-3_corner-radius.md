# Slice 3: corner radius on every vertex

Generated 2026-09-15. Source documents: `handoff/decisions-symbol-editor-1b.md` (version 3),
decision D5, and `handoff/02-coder-spec.md`, slice 3. Mockup: artboard 2a.

**Parallelism.** Can run at the same time as slice 1. It shares only `VertexAuthoringPanel.tsx`
with it, and in a different FormSection (Shape here, Fill and Marker there). Do not run it at the
same time as slice 2, which edits the same region of `IRNodeContent.tsx`, nor slice 4, which edits
`shapeRegistry.ts` and `FORM_OPTIONS`.

## COSA

A new scalar axis `ShapeSpec.cornerRadius?: number` (px), applied to every vertex of the shape:
rectangles, diamonds, hexagons and parallelograms alike.

## DOVE

- `viewpoint/ir/irTypes.ts`: `ShapeSpec`.
- `viewpoint/ir/irValidate.ts`: the numeric guard, next to the closed-vocabulary check on
  `shape.padding` at line 123.
- `viewpoint/ir/shapeRegistry.ts`: the new `roundedPolygonPath`, beside the descriptors.
- `viewpoint/ir/IRNodeContent.tsx`: the painter branches.
- `viewpoint/authoring/SymbolPreview.tsx`: a new optional prop.
- `viewpoint/authoring/SymbolBoxPreview.tsx`: the replica must use the same painter.
- `viewpoint/authoring/VertexAuthoringPanel.tsx`: the Shape FormSection only, lines 514 to 527.
- `viewpoint/ir/__tests__/shapeRegistry.test.ts`.
- `editor-v2/components/DynamicHandles.tsx`: a TODO comment only, no behavior change.

## COME

**Semantics of an absent value.** This is the point that has to be right, because today the
corners are not sharp: `irStyle.ts` gives `.ir-node-content` a `border-radius: 4px` and
`.ir-shape--rounded` 10px, while the SVG polygons are sharp. So an **absent** `cornerRadius`
keeps exactly those values, and a **written** value, `0` included, replaces them and is saved.
"Absent means sharp" would square off every rectangle already on every saved canvas.

**Which shapes honor the axis.** `rect`, `rounded`, `diamond`, `hexagon`, `parallelogram`. It is
ignored by `ellipse`, `circle`, `stadium` and `cylinder`: on the first three the `border-radius`
(50%, 50%, 999px) is not decoration, it is what constitutes the shape, and the cylinder is drawn
as a path with its own arcs. Document the ignore list in the doc comment of the field and keep the
help text of the mockup, which already names exactly the honoring set.

**Painting.** CSS shapes take `border-radius: <r>px`. The SVG polygon shapes need
`roundedPolygonPath(points, r, w, h)`: for each vertex, shorten the two adjacent edges by `r`
(clamped to half of the shorter edge) and join them with a quadratic segment through the vertex.
The coordinate space is load-bearing: the registry `points` live in a `0 0 100 100` viewBox drawn
with `preserveAspectRatio="none"`, so a radius applied there is stretched by the box aspect and
comes out as an elliptical quadrant. Convert the points to real `(w, h)` pixels first and emit a
`<path>` in a `0 0 w h` viewBox. The `double` border overdraw must follow the same path, or the
two strokes will not be concentric.

**Clamping and geometry.** Clamp `r` to `min(w, h) / 4` at render, keeping the authored number as
typed. Do not recompute anchors or the content rect: the decision is that up to 12px the
difference is not worth the coupling, and above it the clamp keeps the shape sane. Leave a TODO in
`DynamicHandles.tsx`, the only reader of `insetFractionAt` and `handleInsetAt`, pointing at this
prompt. `edgeEndpoints.ts` is **not** involved: it handles endpoint expressions, not geometry.

**Recognition.** `cornerRadius` must **not** enter `recognizeSymbol`. If it did, a BPMN task with
r = 6 would stop matching its own preset and the modal would title it "Custom symbol". The radius
is orthogonal to the preset axis space.

**Previews.** `SymbolPreview` (the 72x48 tile) takes the radius as an **optional prop**, not as a
new field of `SymbolPreset.values`: catalog presets have no radius, and the modal already feeds
that component a synthetic preset built by `currentAxesPreset` in `SymbolEditorModal.tsx`, which is
the only caller that needs to pass it. Catalog tiles and the rail card pass nothing.

**Panel.** In the Shape section, under the base form: the stepper "Corner radius · all vertices",
the three inline glyphs of the mockup as feedback, and the help text as written.

## Acceptance

- A `rect` saved before this change renders identically, with its 4px corners, and a `rounded`
  keeps its 10px.
- A `circle` stays a circle and an `ellipse` an ellipse whatever the value written.
- A hexagon with r = 8 renders a closed path with no spikes; a radius larger than the edge is
  clamped.
- Snapshot test of the emitted `d` for a diamond at 100x60 with r = 6.
- A preset is still recognized after the radius is changed.

## Out of scope

Making the radius conditional. Anchors and content rect. The Border section. The Goal family.

## Commit

`feat: add cornerRadius axis with rounded polygon painter`

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
