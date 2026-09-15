# Discovery: `ShapeSpec.cornerRadius`, slice 3 of Symbol Editor 1b

Date: 2026-09-16. Branch: `validation-skeleton` at `d0e920323`. Prompt:
`docs/prompts/2026-09-15_1830_slice-3_corner-radius.md`. Phase 1, read only. Nothing in `frontend/`
was modified.

## 0. Hypotheses under test

1. The nine files in DOVE are enough to deliver the axis end to end: type, validation, painter,
   previews, panel, test, TODO.
2. `IRNodeContent` can paint a rounded polygon in real pixels with what it already receives.
3. Absent `cornerRadius` can be left exactly as today with no code on the render path.
4. `cornerRadius` stays out of recognition without touching `symbolRecognition.ts` or
   `applyPresetToShape`.

Verdict: 3 and 4 hold. 1 does not: three files outside DOVE are needed or strongly advisable
(§3.1, §3.2). 2 does not: `IRNodeContent` has no box size, so a measurement has to be added (§3.3).

## 1. Files read

Repo, full or the relevant section:

- `/Users/alfonso/jjodel/CLAUDE.md`, `/Users/alfonso/jjodel/docs/PROTOCOL.md`, `docs/decisions.md` (process
  section and the symbol and shape entries), `docs/claude-code-log.md` (the last 5 entries),
  `docs/CLAUDE_DEVELOPMENT_GUIDE.md` (outline only: it is the UI design guide and has no IR rule).
- `docs/prompts/2026-09-15_1830_plan_symbol-editor-1b.md`
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (140-250, 680-786)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (285-432)
- `frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` (full)
- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (137-152)
- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (1-80)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/shapeRegistry.test.ts` (1-75 and the test list)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolPreview.tsx` (full)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolBoxPreview.tsx` (full)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (full)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (1-120, 326-381, 440-590)
- `frontend/src/components/editor-v2/viewpoint/authoring/useCanvasNodeBox.ts` (1-60)
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` (320-380)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (895-940)
- `frontend/src/components/ui/NumberInput/NumberInput.tsx` (full)

Outside the repo (cited by the prompt, not in `docs/`):

- `~/Library/Mobile Documents/com~apple~CloudDocs/Sviluppo/jjodel material/jjodel-design-generated prompts/handoff/decisions-symbol-editor-1b.md` (full, D5 at 126-176)
- `.../handoff/02-coder-spec.md` (full, slice 3 at 48-61)
- `.../handoff/README.md`
- `.../handoff/mockups/Symbol Editor 1b - All Sections.dc.html`, artboard `2a`, lines 49-51
- `.../handoff/prompts/2026-09-15_1830_slice-3_corner-radius.md`: `diff -q` against the repo copy,
  silent, so identical.

## 2. Findings

### 2.1 Branch parity and baseline

- `git diff --quiet validation-skeleton alfonso-frontend-jjtl -- frontend/src/components/editor-v2/viewpoint frontend/src/components/editor-v2/components/DynamicHandles.tsx`
  exit 0. Control on `frontend/src`, same command: exit 1. The plan measured its line numbers on
  the other branch, and they hold here: `irValidate.ts:123`, `VertexAuthoringPanel.tsx:514-527`,
  `IRNodeContent.tsx:333-371` all land on the regions the prompt describes.
- `npm run typecheck`: exit 2, **33** `error TS` over the full output, control `Measurable` 6.
  This matches the declared baseline.
- Working tree: no change under `frontend/src`. The three modified files under
  `docs/mde-intelligence-2026/` belong to another lane and were not touched.

### 2.2 Today's corners, the values absent must keep

- `irStyle.ts:72`: `.ir-node-content { box-sizing: border-box; background: var(--node-bg); border: 1px solid var(--border-default); border-radius: 4px; ...}`
- `irStyle.ts:82`: `.ir-node-content.ir-shape--rounded { border-radius: 10px; }`
- `irStyle.ts:94`, `:98`: ellipse and circle `border-radius: 50%`; `:116` stadium `border-radius: 999px`.
- Polygons are sharp: `shapeRegistry.ts:288`, `:305`, `:315` carry `points` in the 0..100 viewBox,
  drawn at `IRNodeContent.tsx:384` with `viewBox="0 0 100 100" preserveAspectRatio="none"`.

Absent needs no code: when the key is missing nothing inline is emitted, and the class rules
above stay in force. An inline `border-radius` beats `.ir-shape--rounded` (specificity 0,2,0
loses to inline).

### 2.3 The painter has no box size (hypothesis 2 falsified)

- `IRNodeContentProps` (`IRNodeContent.tsx:92-128`) carries `compiled`, `objectId`, `vertexId`,
  `readCtx` and two callbacks. No width, no height. `ObjectNode.tsx:921-928` passes nothing more.
- The SVG layer is `position: absolute; inset: 0` inside `.ir-node-content`
  (`irStyle.ts:107`, `:125`), whose border is 1px (`:72`). So the SVG box is the **padding box**
  of `.ir-node-content`: `clientWidth x clientHeight`, 2px smaller on each axis than the React
  Flow node box. A size read from `useCanvasNodeBox` or from the RF node would be 2px off, and
  under `preserveAspectRatio="none"` that stretches the path by about 1-3%.
- `contentRef` already points at `.ir-node-content` (`IRNodeContent.tsx:173`, `:379`).
- Layout metrics are zoom-immune, measured before: `useContentSize.ts:46-51`, «`offsetWidth`/`offsetHeight` rather than a client rect: the canvas viewport carries a `scale()` transform».

### 2.4 `CompiledView` does not carry the axis

- `irTypes.ts:716-722`: `form`, `fill`, `border`, `marker`, `padding`. No radius field.
- `irCompile.ts:315`: `const padding = ir.shape.padding ?? 'normal';` is the precedent for a
  scalar axis materialized at compile. `irCompile.ts` is not in DOVE.
- `CompiledView.ir` holds the source IR (`irTypes.ts:686`), and the compile cache key is
  `${viewId}:${irHash(ir)}` with `irHash` = a hash of `JSON.stringify(ir)` (`irCompile.ts:285-296`).
  A change of `cornerRadius` therefore yields a new compiled object, and `compiled.ir.shape.cornerRadius`
  is always the current value. Reading it from there needs no change to `irCompile.ts`.

### 2.5 Selection ring and `double` overdraw

- `IRNodeContent.tsx:389-409`: the selection ring, the selection band, the `double` pair and the
  plain stroke all go through `svgOutline(svgPainter, …)` (`:38-42`). If `svgOutline` emits the
  rounded path, all four follow it, which covers the prompt's concentric-double requirement and
  keeps the ring aligned with the shape. On CSS forms the ring is `outline` plus `box-shadow`
  (`irStyle.ts:144`), which follow `border-radius`.

### 2.6 Validation

- `irValidate.ts:118-126`: the padding guard, read as `unknown`, inside
  `if (ir.kind === 'vertex' || ir.kind === 'graphVertex')`. The numeric guard fits in the same
  block: `undefined` passes, anything that is not a finite number ≥ 0 is rejected.
- The tests for that guard live in `ir/__tests__/irValidate.test.ts:169-200` (padding block),
  which is not in DOVE.

### 2.7 Recognition and presets (hypothesis 4 holds)

- `symbolRecognition.ts:59-75` reads `form`, `border.style`, `border.width`, `marker`, `fill` and
  nothing else. `cornerRadius` stays out by construction.
- `notationCatalog.ts:139-140`: `const next: ShapeSpec = { ...shape, form: preset.values.form, …}`.
  The spread keeps `cornerRadius` when a preset is applied.
- The executable test of "a preset is still recognized after the radius is changed" belongs in
  `ir/__tests__/symbolRecognition.test.ts` (block `round-trip con applyPresetToShape`, line 27).
  That file is not in DOVE.

### 2.8 Previews

- `SymbolPreview.tsx:30-51`: the tile draws its own contours in a 72x48 viewBox, in **absolute**
  coordinates (`'23,8 49,8 62,24 49,40 23,40 10,24'`), not in the registry's 0..100 space. Its
  `rect` is sharp (`:49`) while the canvas rect has 4px; its `rounded` uses `rx={7}` (`:32`) for the
  canvas 10px. That divergence already exists and is out of scope.
- Callers: `SymbolCatalogPicker.tsx:158`, `:219`, `:260` and `SymbolCard.tsx:42` pass catalog
  presets. `SymbolEditorModal.tsx:295` is the only one that passes `currentAxesPreset`.
- `SymbolBoxPreview.tsx:79`: `const svgPainter = desc.painter.kind === 'svg' ? desc.painter : null;`.
  It draws `<polygon points>` in `0 0 100 100` (`:113-141`). The box is known (`box.w`, `box.h`,
  `:91-92`), so no measurement is needed there. Pre-existing and out of scope: `svgPath` painters
  (cylinder) are not replicated, so the replica shows a CSS box for the cylinder.
- `SymbolEditorModal.tsx:279-287` and `:295` are where the radius would be passed. The prompt says
  the modal "is the only caller that needs to pass it", but `SymbolEditorModal.tsx` is **not** in
  DOVE. Without that change the new props exist and nothing passes them.

### 2.9 Panel

- Shape section: `VertexAuthoringPanel.tsx:513-527`. `patchShape` spreads (`:347-348`). Dropping a
  key by patching `undefined` is the idiom already used for padding (`:574`) and marker (`:588`).
- `NumberInput` (`NumberInput.tsx:4-13`): `value: number` is required, there is no `placeholder`,
  and the input parses with `parseInt` and ignores an empty string (`:36-43`). It cannot show an
  absent state or a placeholder. D5 asks for both: «The panel shows the base radius as placeholder
  while the axis is absent, and a reset drops the key». The prompt does not mention them.
- Mockup 2a, `Symbol Editor 1b - All Sections.dc.html:49-51`, verbatim:
  - label `Corner radius` + `· all vertices` in `#94a3b8`
  - stepper `−` | `6 px` | `+`
  - three 30x20 glyphs, `viewBox="0 0 44 28"`: a rect with `rx="5"`, a diamond
    `M24.4 3 L39.6 12.5 Q42 14 39.6 15.5 L24.4 25 Q22 26.5 19.6 25 L4.4 15.5 Q2 14 4.4 12.5 L19.6 3 Q22 1.5 24.4 3 Z`,
    a hexagon `M13 1.5 L31 1.5 Q34 1.5 35.2 3.4 …`. They are static in the mockup, and the
    diamond and hexagon already use the `L … Q vertex …` construction the prompt describes.
  - help text: `Rounds every vertex of the shape — rectangles, diamonds, hexagons, parallelograms alike. 0 keeps sharp corners.`

### 2.10 Anchors

- `DynamicHandles.tsx:351-359`, `insetPct`, is the only non-test reader of `handleInsetAt` /
  `insetFractionAt` besides `shapeRegistry.ts:402` (`availableWidthFraction`). The TODO goes above
  `:354`. BSD grep over `editor-v2`, matches in both files, so the search has signal.

### 2.11 Identifiers and test conventions

- `roundedPolygonPath`: 0 matches in `frontend/src` and `docs/` (excluding the prompts). The same
  command matches `cornerRadius` in `edgeUtils.ts:1870`, `:1934` (a function parameter, no collision
  with a `ShapeSpec` field). The search has signal.
- `honorsCornerRadius`, `effectiveCornerRadius`: 0 matches. The same command counted the 2
  `cornerRadius` lines above.
- Snapshot tests: 0 files in `frontend/src` use `toMatchSnapshot` or `toMatchInlineSnapshot`, and
  there is no `__snapshots__` directory. Control, same command with `toEqual`: 113 files.
- `IRNodeContent.tsx` imports `store, U` from the `joiner` barrel (`:14`), so it does not import in
  the vitest bench (`window is not defined`, CLAUDE.md §5). "A rect saved before renders identically"
  and "a circle stays a circle" can only be executed as tests if the decision "which radius, if
  any, for this form" lives in a pure function in `shapeRegistry.ts`.

### 2.12 CLAUDE.md against the prompt

The prompt's guardrail says «No critical-zone file is in scope for this slice», listing
`useJjomSync.ts` and the others. CLAUDE.md §3.1 lists `components/editor-v2/viewpoint/authoring/`
and `components/editor-v2/viewpoint/ir/` in the critical-zone table, and `02-coder-spec.md:8`
repeats it. §3.2 makes the Layer Impact Report mandatory only for the sync and D-L list, which
this slice does not touch. The two texts differ on the label, not on the obligation. A short
report is in §5 anyway.

## 3. Dependencies and risks

### 3.1 Scope: files outside DOVE

| file | why | without it |
|---|---|---|
| `authoring/SymbolEditorModal.tsx` | passes the radius to `SymbolBoxPreview` (`:279`) and `SymbolPreview` (`:295`) | the modal preview never shows the radius |
| `ir/__tests__/irValidate.test.ts` | tests for the numeric guard, next to the padding block | the guard ships untested, or its tests land in the wrong file |
| `ir/__tests__/symbolRecognition.test.ts` | executes "preset still recognized after the radius changes" | the acceptance runs from `shapeRegistry.test.ts`, which is not about recognition |

`irCompile.ts` is **not** needed if the painter reads `compiled.ir.shape.cornerRadius` (§2.4).

### 3.2 Rule 19

DOVE already names 9 files, and §3.1 would bring the total to 12. The list with what changes in
each file is in §4 and needs confirmation.

### 3.3 Measurement on the canvas

- A `useLayoutEffect` plus `ResizeObserver` on `contentRef`, reading `clientWidth/clientHeight`
  (§2.3). It runs only when the axis is written on a form that honors it. Layout effect means no
  unrounded frame on mount. While there is no measurement, or when w or h ≤ 0, the painter falls
  back to today's polygon.
- During a live resize the path can lag one observer callback behind the box. With
  `preserveAspectRatio="none"` the lag shows as a stretch of a few pixels, never as a gap.

### 3.4 Geometry

- A quadratic segment through the vertex is not a circular arc. At r ≤ 12 px, and with the
  `min(w,h)/4` clamp, the difference is below a pixel.
- `dashed`/`dotted` on a `<path>`: the dash phase starts at the path origin (the first shortened
  point), not at the polygon's first vertex. This is visible only when the axis is written.

### 3.5 Parallel slices

- Slice 1, running at the same time, edits `VertexAuthoringPanel.tsx` in Fill and Marker
  (`:529-543`, `:584+`), next to Shape (`:513-527`). Different hunks, but the file is shared on the
  same tree, so commits have to use a pathspec and I must re-read the file before editing.
- Slice 2 will rewrite `IRNodeContent.tsx:333-371` and `SymbolBoxPreview.tsx`. The radius branch
  should sit in `svgOutline` and in one place in the body, so slice 2 moves around it rather than
  through it.
- Slice 4 adds `cloud`. A closed honoring set (`rect`, `rounded`, `diamond`, `hexagon`,
  `parallelogram`) leaves `cloud` ignored by default, which is what D5 wants.

## 4. Planned diff, per file (for Rule 19)

1. `ir/irTypes.ts`: `ShapeSpec.cornerRadius?: number`, with a doc comment covering absent vs
   written, the honoring set, the ignore list with the reason, and the render clamp.
2. `ir/irValidate.ts`: numeric guard in the vertex/graphVertex block after padding.
3. `ir/shapeRegistry.ts`: `roundedPolygonPath(points, r, w, h)`, plus one pure helper for the
   form gate and the clamp (name to be grepped). No change to `ShapeDescriptor` or to `SHAPE_REGISTRY`.
4. `ir/IRNodeContent.tsx`: read the axis, inline `border-radius` on `rect`/`rounded` when written,
   measurement hook for the polygon forms, and `svgOutline` emitting `<path d>` in a `0 0 w h`
   viewBox when rounded. Ring, band, double and plain stroke all follow.
5. `authoring/SymbolPreview.tsx`: optional `cornerRadius` prop, honored on the same forms.
6. `authoring/SymbolBoxPreview.tsx`: optional `cornerRadius` prop, inline radius on the CSS forms
   and the same `roundedPolygonPath` on `box` for the polygons.
7. `authoring/VertexAuthoringPanel.tsx`: the Shape section only. Stepper, three glyphs, help text.
8. `ir/__tests__/shapeRegistry.test.ts`: literal `d` for a diamond at 100x60 with r = 6, a hexagon
   at r = 8 (closed, no spikes, every point inside the box), a radius above the edge clamped, the
   form gate (rect/rounded as CSS, ellipse/circle/stadium/cylinder ignored), and absent vs 0.
9. `components/DynamicHandles.tsx`: a TODO comment only.
10. (§3.1) `authoring/SymbolEditorModal.tsx`: two props passed from `ir.shape.cornerRadius`.
11. (§3.1) `ir/__tests__/irValidate.test.ts`: absent passes, 0 and 6 pass, -1, NaN-like, `'6'` rejected.
12. (§3.1) `ir/__tests__/symbolRecognition.test.ts`: every preset, with `cornerRadius` written, is
    still recognized.

A mutation bench runs on items 3, 8, 11 and 12: I break the clamp, the gate, the guard and the
spread in turn, and each test has to go red.

## 5. Layer Impact Report (short, see §2.12)

- Canvas v2-flow: changes the painting of `.ir-node-content` for IR nodes with the axis written.
  Nothing changes for nodes without the axis, and neither anchors, `contentRect`, sizing nor
  resize change.
- Persistence: an optional key in the saved IR, written through the existing whole-object
  `set_ir`. No `irVersion` bump, no VersionFixer, no `jsxString`.
- D-layer, L-layer, JjOM, sync, canvas classic: not touched.
- Smoke scenarios affected: an IR view on a `rect` opened before the change (4px), a `rounded`
  (10px), and a diamond, hexagon, parallelogram and circle with a radius written, at zoom 0.5, 1
  and 2 and selected.

## 6. Open questions for Alfonso

1. **Scope expansion (§3.1).** Add `SymbolEditorModal.tsx`, `irValidate.test.ts` and
   `symbolRecognition.test.ts`? Recommended: yes, all three.
2. **Where the painter reads the axis (§2.4).** From `compiled.ir.shape.cornerRadius`, with no
   change to `irCompile.ts`, or as a new `CompiledView.cornerRadius` materialized like `padding`
   (another file, in the same region slice 2 rewrites)? Recommended: `compiled.ir`.
3. **Box size on the canvas (§3.3).** `ResizeObserver` plus `clientWidth/clientHeight` on
   `.ir-node-content`, only when needed, falling back to the sharp polygon. Confirm.
4. **Clamp on the CSS forms.** Apply `min(w,h)/4` on `rect`/`rounded` too, with the same
   measurement, or leave those to the native CSS clamp (half the side)? Recommended: the same
   clamp everywhere, so one number looks the same on every form.
5. **Absent in the stepper (§2.9).** `NumberInput` has no placeholder. Proposal: while the axis is
   absent, show the form's base radius (4, 10, 0) in muted text with the note `default`, plus a
   `Reset` link, visible only when a value is written, that drops the key. `NumberInput` stays as
   it is. The alternative is an optional `placeholder` on `NumberInput`, which is a `ui/` file
   outside scope.
6. **Forms that ignore the axis.** Should the stepper stay visible on `ellipse`, `circle`,
   `stadium` and `cylinder`, where the help text explains the honoring set, or be hidden, the way
   7b handles structure? Recommended: always visible, as in the mockup copy. A written value stays
   in the IR either way.
7. **Glyphs.** Static as drawn in the mockup, or live, redrawn with the current r? Recommended:
   live, in glyph units, with the same `/4` clamp (so 0 draws sharp corners).
8. **Radius in the 72x48 tile.** Canvas px times 0.7, the ratio the tile already applies to
   `rounded` (10 → `rx 7`), or in tile units as is? Recommended: × 0.7. The tile polygons use
   absolute coordinates, so it calls `roundedPolygonPath` with w = h = 100, which is the identity
   scale. The call gets a comment saying so.
9. **"Snapshot".** The repo has no snapshot tests at all (§2.11). A literal expected `d` string in
   the test, with no `__snapshots__` file. Confirm.
Declared, not asked: this report and the slice-3 prompt file are committed as `docs:`, in two
commits, following the log precedent (the prompt names only the code commit type). The code commit
stays `feat: add cornerRadius axis with rounded polygon painter`. The log entry is written at the
end of the task, after phase 2.
