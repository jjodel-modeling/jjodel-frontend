# Discovery: slice E, edge ends — richer, conditional terminations and end labels

Prompt-ID: P-2026-09-30-1810 · prompt `docs/prompts/claude_2026-09-30_1810_prompt_edge_ends.md` · session unknown ·
tree `~/jjodel-w-edgeends`, branch `edge-ends`, HEAD `60d223baa` · executor Anthropic Claude Opus 5.5.
A set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the real files.

## 0. Answer in brief

The mechanism fits in the files the prompt expects plus one new pure module and one stylesheet block; no §3.2 file,
no derived-notation file is needed, so the lane goes on to Phase 2 in cascade.

- **Vocabulary.** `EdgeTermination` is a closed union of seven (`irTypes.ts:609-619`), mirrored by a Record
  `VALID_TERMINATIONS` (`irValidate.ts:56`). The seven new names have 0 hits in `frontend/src` except `'bar'`,
  which is also a `ShapeForm` value (R-VP-16, `irTypes.ts:57`): a different closed vocabulary on a different key (Q1).
- **Conditional.** `Conditional<T>` already admits a plain `T` (`irTypes.ts:50-53`): the declared type of each end is
  `Conditional<EdgeTermination>`, no union needed. Line fields resolve per instance in `irEdgeViews.applyEdgeStyle`
  (`irEdgeViews.ts:42-44`) from `compileConditional` (`irCompile.ts:249`); terminations are compiled once per view
  (`irCompile.ts:691-694`). The resolver goes beside them as an optional compiled key, only for a Conditional value.
- **End labels.** `labels.sourceEnd` / `targetEnd` already exist, typed `TextSource` (R-VP-23, `irTypes.ts:714-715`),
  drawn at `computeCardinalityAnchor` (`UnifiedEdge.tsx:502-511`). The prompt's `{ multiplicity?, role? }` collides
  with that key (Q2). The anchor serves both labels with one optional argument that mirrors the lateral side; no
  critical-zone file is needed.
- **Rendering.** Ends are SVG `<marker>`s with `orient="auto"` (`UnifiedEdge.tsx:887-962`): orientation already
  follows the last segment and the curve's tangent. The trim is a pure path function over the drawn `d` (absolute
  M/L/Q/C/A only, every builder in use emits those), the glyph a per-end marker whose reference point is the trim.
- **Editor.** `Select` takes optgroups (`ui/Select`); line fields use `ConditionalEditor` (`EdgeAuthoringPanel.tsx:762`).
  The panel does not read the disclosure mode today; the vertex panel reads `s.advanced` (`VertexAuthoringPanel.tsx:156`).

Phase 2: 9 source files (one new) and 3 new test files plus one updated, over Rule 19's 5: listed in §5, flagged, not
waited on (RC-11, RC-25). Size about 650 lines of code and 550 of tests.

**Decisions taken (unattended, RC-21/RC-25, each the Recommended line of §0's questions):** Q1 to Q8 below.

**Decisions awaiting Alfonso (RC-26):** none. No §3.2 file, no derived notation, no demo change, no R- row amended,
no exported interface narrowed.

1. `'bar'` is already a `ShapeForm` value. Recommended: keep `'bar'` as the prompt names it; marker ids and classes are namespaced `ir-end-*`, no code reads both vocabularies.
2. `labels.sourceEnd` is already a `TextSource` (R-VP-23). Recommended: widen each end to `TextSource | EdgeEndLabels`; a bare text source reads as the multiplicity, so every R-VP-23 document renders byte for byte.
3. Glyph size at width 2. Recommended: fixed geometry (§4), the stroke follows the width; the longest back (20 px) fits the 24 px Manhattan stub at any width.
4. The trim and the canvas fill for the seven existing ends. Recommended: the seven new ends only; the existing seven keep their markup byte for byte.
5. An end label beside a new glyph. Recommended: pushed along the axis by the glyph's back, so it clears the glyph; 0 for every other end.
6. Basic mode. Recommended: the grouped Select as today; a Conditional end shows the panel's read-only chip; the Conditional control and the end labels only in Advanced.
7. The glyph classes. Recommended: a block in `EditorV2.scss` beside `.reference-marker`, filling hollow parts with `var(--canvas-bg)`.
8. The static `terminations` of a Conditional end. Recommended: its `else` / `default`, else the compile default (`none`, `openArrow`); the per-instance value comes from the resolver.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The seven names are free | partly | 0 hits each in `frontend/src` for `filledCircle`, `cross'`, `erZeroOrOne`, `erExactlyOne`, `erZeroOrMany`, `erOneOrMany` (`command grep -rn`, control `closedArrow` 19 hits); `'bar'` 5 hits, all `ShapeForm` (`irTypes.ts:57`, `shapeRegistry.ts:435`, `viewpointDerivation.ts:380,381,842,956`), plus Records over `ShapeForm` (`structureCapabilities.ts:65,102`). [measured] |
| H2 | `Conditional<T>` admits a plain `T` | holds | `export type Conditional<T> =` / `\| T` (`irTypes.ts:50-51`) [read] |
| H3 | Terminations are resolved per view, line per instance | holds | `sourceEnd: e.terminations?.sourceEnd ?? 'none',` (`irCompile.ts:692`); `const color = cv.lineColor ? String(cv.lineColor(ctx, evalId) \|\| '') : '';` (`irEdgeViews.ts:42`); `irSourceTermination: cv.terminations.sourceEnd,` (`irEdgeViews.ts:71`) [read] |
| H4 | The only edge label is `labels.center` | falsified | `sourceEnd?: TextSource;` / `targetEnd?: TextSource;` (`irTypes.ts:714-715`), R-VP-23; also `template` and `style` (R-VP-20, `:696`, `:708`) [read] |
| H5 | The cardinality anchor serves end labels without the critical zone | holds | `computeCardinalityAnchor(` (`edgeUtils.ts:1091`) reads only the end point, the side and the drawn points; the side comes from the handle id (`getSideFromHandle`, `edgeUtils.ts:69`). `portDistribution.ts` and `handlePosition.ts` are not on the path [read] |
| H6 | Orientation needs new code | falsified | every IR marker is `orient="auto"` (`UnifiedEdge.tsx:895`), `auto-start-reverse` for the hollow circle (`:957`) [read] |
| H7 | Hollow ends are filled with the canvas background today | falsified | `.reference-marker.hollow { fill: var(--edge-marker-fill);` (`EditorV2.scss:2752-2753`); light `'edge-marker-fill': #f8fafc` vs `'canvas-bg': #f1f5f9` (`_themes.scss:257`, `:183`) [read] |

## 2. Where terminations live today (read, on `60d223baa`)

- **Declared**: `EdgeTermination` (`irTypes.ts:609-619`), `terminations?: { sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination };` (`:671`); compiled `terminations: { sourceEnd: EdgeTermination; targetEnd: EdgeTermination };` (`:818`).
- **Validated**: `export const VALID_TERMINATIONS: Record<EdgeTermination, true> = {` (`irValidate.ts:56`); each end a string in it (`:364-375`). Authoring-time only (R-B9-bis). The vocabulary is pinned key by key by `irValidate.test.ts:644`.
- **Compiled**: `irCompile.ts:691-694`, the defaults `'none'` / `'openArrow'`.
- **Resolved onto the edge**: `irEdgeViews.ts:71-72`, the domain vocabulary on `e.data`.
- **Drawn**: `irMarkerUrl` (`UnifiedEdge.tsx:584-595`), `markerStart` / `markerEnd` (`:760-770`), one `<marker>` per end kind (`:887-962`), `hollowCircle` mounted only when an end uses it (`:949`). Marker styles `EditorV2.scss:2745-2764`; `.reference-edge { stroke-width: 1; }`, `.selected` 1.5 (`:2703-2711`).
- **Edited**: `TERMINATION_OPTIONS` (`EdgeAuthoringPanel.tsx:115-124`), two plain `Select`s in «Ends» (`:822-837`).
- Only these six files carry the vocabulary: `command grep -rln hollowDiamond frontend/src` lists `UnifiedEdge.tsx`, `irTypes.ts`, `irValidate.ts`, `EdgeAuthoringPanel.tsx` and two tests [measured].

## 3. `Conditional<T>` for `line`, and the end-label anchor (read)

- `compileConditional` (`irCompile.ts:249-267`): a non-object, or an object without `when` / `rules`, is the plain value; `{when, then, else?}` and `{rules, default?}` compile their predicates into `deps`. `line.color` / `width` / `style` compile with it (`:688-690`) and resolve per edge in `applyEdgeStyle` with the evaluation id: the source object of a reference edge, the edge-object of an object-as-edge.
- `ConditionalEditor` (`ui/ConditionalEditor/ConditionalEditor.tsx`) wraps any scalar editor; `allowConditional={false}` renders a Conditional value as the chip «conditional (edit in Advanced mode)».
- `computeCardinalityAnchor(targetX, targetY, targetSide, boxGap, depthShift = 0, pathPoints?)` (`edgeUtils.ts:1091-1122`): along the side's normal at `boxGap + depthShift`, laterally `CARD_LINE_GAP` (4 px, `:1080`) on the side the path does not come from. A seventh optional argument that flips the lateral sign puts the role on the other side; absent it returns the same string.

## 4. Proposed glyph geometry

Local frame: the tip at x = 0 (the path's end), the line running towards −x; y across. Geometry fixed in px (Q3);
the stroke is the line's resolved width w (1 or 2 px) and colour; hollow parts fill `var(--canvas-bg)`; one `<path>`
for all line work (a semi-transparent ink, `rgba(148,163,184,.65)` in dark, `_themes.scss:94`, must not darken at
crossings) and a `<circle>` per disc. The glyph draws its own stem from its back to the tip; the line is trimmed by
the back, so it never runs under a hollow part.

| End | Parts | Back (trim) w=1 / w=2 | Across |
|---|---|---|---|
| `filledCircle` | disc, centre (−4, 0), r 4, filled with the ink | 8 / 8 | ±4 (+w/2) |
| `bar` | bar at x −8, y ±6; stem −8..0 | 8 / 8 | ±6 |
| `cross` | X centred at (−10, 0), arms ±4; stem −14..0 | 14 / 14 | ±4 |
| `erZeroOrOne` | bar at −8 (one, max); circle centre −16, r 4, hollow (zero, min); stem −12..0 | 20 / 20 | ±6 |
| `erExactlyOne` | bars at −8 and −12; stem −12..0 | 12 / 12 | ±6 |
| `erZeroOrMany` | crow: (−10, 0) to (0, ±6) and the stem; circle centre −16, r 4, hollow | 20 / 20 | ±6 |
| `erOneOrMany` | crow as above; bar at −14 | 14 / 14 | ±6 |

The marker: `markerUnits="userSpaceOnUse"` (the size does not follow the selection's CSS width), viewBox the
glyph's box padded by w/2 + 0.5, `refX` = −(trim applied), `orient` the angle from the trimmed point to the tip.
The trim (`trimPathEnds`, edgeUtils): on the first and last drawing command, L exact, Q and C split by de Casteljau
at the parameter whose arc length (32 samples) matches; an A end, or anything but absolute M/L/Q/C/A, is left
untrimmed and the glyph falls back to `orient="auto"` with its tip on the vertex (its hollow parts still cover the
line). A last run shorter than the back is trimmed to its length and the glyph keeps the straight direction.

## 5. Phase 2 file list (Rule 19: 12 files plus docs; flagged, RC-11)

| File | Change | Size |
|---|---|---|
| `viewpoint/ir/irTypes.ts` | 7 union members; ends `Conditional<EdgeTermination>`; `EdgeEndLabels`; two optional compiled keys per end | ~40 |
| `viewpoint/ir/irValidate.ts` | vocabulary +7; Conditional ends; end labels of both forms | ~50 |
| `viewpoint/ir/irCompile.ts` | resolver per end, only for a Conditional; end labels of both forms | ~35 |
| `viewpoint/ir/irEdgeViews.ts` | resolved end per instance; role text on the data | ~6 |
| `edges/edgeEndGlyphs.ts` (new) | the glyph table, marker attributes, the grouped options | ~140 |
| `edges/UnifiedEdge.tsx` | trim, two per-end markers, role labels, depth | ~70 |
| `utils/edgeUtils.ts` | `trimPathEnds`; `computeCardinalityAnchor(…, mirror)` | ~150 |
| `viewpoint/authoring/EdgeAuthoringPanel.tsx` | grouped list; Conditional (Advanced); end labels (Advanced) | ~110 |
| `EditorV2.scss` | `.ir-end-glyph` classes | ~20 |
| tests: `ir/__tests__/irEdgeEnds.test.ts`, `ir/__tests__/irEdgeEndsRender.test.ts`, `edges/__tests__/edgeEndGlyphs.test.ts` (new); `ir/__tests__/irValidate.test.ts` (the vocabulary pin :644) | | ~550 |

Docs: `docs/decisions.md` (R- rows, `provisional, unattended`), `docs/log-inbox/views.md`, the prompt's Status.

## 6. Layer Impact Report (viewpoint/ir and authoring are §3.1, not §3.2; written because prior lanes did)

- D-layer, L-layer, JjOM, sync, persistence/VersionFixer: not touched. The IR is persisted as data; every key is optional and additive (R-B9, R-IRN-32: no `irVersion` bump, no migration).
- Canvas v2-flow: IR-decorated edges only; an edge whose ends are none of the seven new values, with no Conditional end and no role, renders byte for byte (pinned in the render test against this HEAD).
- Canvas classic: not touched. Smoke scenarios: the four demo scenes in the default viewpoint, pixel-identical before/after.

## 7. Risks

1. Curves: the glyph lies on the chord of the trimmed piece, not the curve; the deviation is below 1 px for a 20 px back on the arcs measured (bow ≥ 24 px on a 200 px chord).
2. Manhattan tips sit on the handle's outer edge, 4 px past the border, as every IR arrow today (`edgeUtils.ts:2384-2386` comment); the crow's toes stop there too.
3. An end label beside a glyph on a diagonal arc may touch the glyph: the depth is along the side's normal.
4. The panel cannot be imported in the bench (monaco): its grouped options live in the pure module and are tested there; the panel wiring has no executed test.

## 8. Files read (under `/Users/alfonso/jjodel-w-edgeends/`)

`CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` P1-P16; `docs/decisions.md` RC-20..RC-34,
R-B9, R-B9-bis, R-VP-15, R-VP-23..R-VP-26; `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §1;
`docs/log-inbox/views.md`; `frontend/src/components/editor-v2/viewpoint/ir/{irTypes,irCompile,irEdgeViews,irValidate,markerRegistry}.ts`;
`…/viewpoint/ir/__tests__/{irA2Render,irA4Keys,irValidate}.test.ts`; `…/edges/UnifiedEdge.tsx`; `…/utils/edgeUtils.ts`
(:1-75, :628-880, :1040-1125, :1885-1960, :2380-2479); `…/viewpoint/authoring/EdgeAuthoringPanel.tsx` (:1-140, :440-883);
`…/authoring/__tests__/edgeAuthoring.test.ts` (:1-50); `…/EditorV2.scss` (:2703-2790, :2839-2847, :4425-4500);
`…/_themes.scss` (grep); `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx` (:1-140); `…/ui/Select` (grep);
`frontend/scripts/hooks/critical-zone.mjs` (:1-80); `frontend/node_modules/@xyflow/system/dist/esm/index.js` (:945-970, :1144-1152).

## 9. Phase 2 (added 2026-09-30, after the Phase 1 commit `77c2f946b`)

Code `8f3e7c307` and `462fba92d` (13 and 3 files; the list of §5, all within it). The decisions of §0 were adopted as
recommended and are rows R-EE-1..R-EE-4 of `docs/decisions.md` (`provisional, unattended`). Q2 was checked by a second
agent (RC-27): verified, the line is in R-EE-3.

- **Tests first.** The three new files (`irEdgeEnds.test.ts`, `irEdgeEndsRender.test.ts`, `edgeEndGlyphs.test.ts`) ran
  red on `77c2f946b`: 14 failed and one file at import, 4 passed, the markup pins among them. The pins are 9 digests of
  UnifiedEdge markup (the seven existing ends on orthogonal, two-segment, straight, curved and arc routes, the R-VP-23
  end labels as halo and as badge, an unknown end, an M2 reference), taken on `77c2f946b` before any edit; green after.
- **Gates on `462fba92d`.** `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; `npx vitest run`
  6255 passed, 0 failed, the 9 known files red at import; `npm run build` exit 0. `irValidate.test.ts:643` (the
  vocabulary pin) extended with the seven names.
- **Mutation bench** (`frontend/scripts/smoke/_tmp_edgeends_bench.mjs`, gitignored; 10 on the resolver, 13 on the trim
  and its use): first run 20/23, on `8f3e7c307` plus the source-end and no-else per-instance test; survivors the
  resolver's `rules` guard (redundant with its catch), the split's right half (no test read the kept curve after a start
  cut), the zero-trim early return. `462fba92d` removed the guard (the mutant now drops the catch, and dies), added the
  start-cut curve test and carried the per-instance test. Second run **22/23**; the survivor, the zero-trim early return,
  is equivalent: with no cut every path returns `d` itself.
- **Lane probe** on 3093 (`_tmp_edgeends_probe.ts` + `_tmp_edgeends_fixture.ts`, DPR 2, 1600×1000): **16/16**. The four
  demo scenes in the default viewpoint against the shots taken on `77c2f946b` before any edit: 0 px left of the rail and
  on the rail in all three runs (byte-identical in one; the others differ only in the Jodie launcher's animated glyph,
  masked, as in every lane since C2). The fixture: metamodel EdgeEnds, 84 boxes, 42 links, one row per termination (all
  fourteen), three links per row (orthogonal, straight, curved), the end at both ends from a fourteen-rule Conditional on
  `$end.value`; at widths 1 and 2, light and dark: every new end cut at its back (±0.6 px) at both ends with its marker,
  glyph stroke = width, every old end uncut and on its old marker; hollow fill `rgb(241, 245, 249)` light and
  `rgb(30, 41, 59)` dark, each equal to `var(--canvas-bg)` resolved in the pane; the `erZeroOrMany` row carries six
  multiplicities and six roles. Console: the one pre-existing `failed to get project {project: null}`, also in the base run.
- **Crops** (`sips -Z 600`, gitignored) in `frontend/scripts/smoke/_tmp_edgeends_crops/`: `ee_fixture_w{1,2}_{light,dark}_600.png`,
  `ee_fixture_w{1,2}_{light,dark}_new_600.png`; detail `ee_fixture_w1_light_zoom.png`, `ee_fixture_w2_dark_zoom.png`; the
  default scenes `ee_{sm,petri,esm,flowB}_default_{base,after}.png`.
- **Seen on the crops, not measured:** a Manhattan or bezier tip stops on the handle's outer edge, a few px off the box
  (§7 risk 2, as every IR arrow today); on the diagonal rows the labels of the `erZeroOrMany` row sit close to the glyph
  (§7 risk 3).
- **Incident.** The RC-27 verifier wrote two scratch folders in `/tmp` (`rc27probe`, `rc27old`), outside the worktree;
  removed by this session after its report.
