# Phase 1 report: sizes and markers of the Activity (UML) and classic Petri symbols
Prompt-ID P-2026-09-30-1720 · `docs/prompts/claude_2026-09-30_1720_prompt_activity_sizes.md` · Chat C-2026-09-30-1458 · session `506997c6-66dd-4d2a-aab7-a3f1d52a49b4` · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, HEAD `ea1e64c53` (code as `ca3e41a92`: `git diff --stat ca3e41a92 21345bbba -- frontend/src` empty) · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase on `ea1e64c53`, [R] read.

## 0. Answer in brief
- **The three limits are three pure functions, each reached only by a view that declares the value** [R]: the floor is in
  `defaultBoxFor` (`nodes/nodeSizing.ts:73-74`), called only after `authoredDefaultSize` finds a usable axis
  (`viewpoint/ir/useContentSize.ts:123`, `:208`); the clamp is `clampCornerRadius` (`viewpoint/ir/shapeRegistry.ts:488-491`),
  the file Phase 2 names, reached only by an authored radius; the disc is the `dot` row (`markerRegistry.ts:83`). No native node
  and no IR view without the key reaches any of them, so the default viewpoint cannot move through them.
- **Corpus** [M], the 81 document lists of the nine notations on the seven decoded exports (`_tmp_actuml_docs_after.jsonl`): the
  only authored axes below 24 are Activity's initial 20×20 (3 lists), its bar width 5 (2) and the classic Petri bar width 10 (1);
  the only authored radius is Activity's action, 14 (9); the seven saved exports carry one user radius, 8, on MDE_ERD_1's
  rect views (the box at least 40 high, where the quarter clamp already lets 8 through). So (1) and (3) move exactly the
  Activity and classic Petri symbols the prompt names, and nothing else in the corpus.
- **The floor per form cannot be written in `nodeSizing.ts` alone** [R]: `defaultBoxFor(defaults, derived, keepAspect)` never sees the
  form; the caller passes `desc.keepAspectRatio` (`useContentSize.ts:208`, outside the DOVE, §3.1 `viewpoint/ir/`). Lifting the floor
  from every authored axis stays in the DOVE and, on the corpus, draws exactly what the per-form variant draws (question 1).
- **The registry supports a new row, not a size** [R]: `MarkerDef` is `id`, `label`, `paths` (`markerRegistry.ts:36-41`) and
  `ShapeSpec.marker` is an id (`irTypes.ts:238`). Enlarging `dot` would move 5 other derived lists and the catalogue presets
  `uml-final-state` and `petri-marked-place` (`notationCatalog.ts:95`, `:107`); a new row takes effect only when the Activity
  document names it, `viewpointDerivation.ts:837`, outside the DOVE (question 2).
- The node is the declared size, the painted box 2 px less [R]: the wrapper keeps a transparent 1 px border
  (`irStyle.ts:65`), as A2 recorded for the place (node 44, visible 42). The bar paints 3 px at node 5, the classic bar 8 at 10.

Recommended: proceed to Phase 2 in cascade on the DOVE; ask for `viewpointDerivation.ts` at the hard stop.

**Decisions taken (unattended)**: none beyond the questions below.
**Decisions awaiting Alfonso** (RC-26): none new. What DemoFlowB and DemoPetri show changes by the prompt's own mandate (the mockup
Alfonso approved); the default viewpoint does not.

**Questions**
1. The floor. Recommended: drop the 24 px floor from `defaultBoxFor` for every authored axis (`usableSizeAxis` > 0 stays), keep `SHAPE_MIN_SIZE` for the hand resize; no 12 px circle floor.
2. The bull's-eye. Recommended: a new row `dot-large`, radius 35 of 100, in this lane; the Activity final switches to it through `viewpointDerivation.ts:837` and `activityUml.test.ts` in a resume that adds those two files.
3. The clamp. Recommended: `min(w, h) / 2` in `clampCornerRadius`; no existing view of the corpus changes.

## 1. Layer Impact Report (written before the first source edit)

```
Layers touched:
  [ ] D-layer (Redux raw data)          [ ] L-layer (computed proxies)       [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes)  [ ] Canvas classic                   [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```
- **Canvas v2-flow**. What changes: the RF `width`/`height` the content hook writes for an IR vertex whose view declares a
  `defaultSize` axis below 24 (session only, `useContentSize.ts:237-248`, never the D-layer: `isResized` is not raised); the inline
  `border-radius` of a CSS form, and the rounded polygon of an SVG form, when an authored radius exceeds a quarter of the box's
  shorter side; one more marker id in the registry. What does NOT change: native nodes (ClassNode, EnumNode, PackageNode, the
  native M1 object and every migrated default, `ObjectNode.tsx:900` `irDelegated`); IR views without `defaultSize`, without
  `cornerRadius`, without a marker; the hand-resize floor (`ObjectNode.tsx:934-935`, `SHAPE_MIN_SIZE`); anchors (`DynamicHandles.tsx`
  reads no radius, `:354-357`); the documents (no derivation file in the DOVE). Cross-layer: none; sizes stay in the RF store as
  today. Side effects: edges re-anchor on the narrower bars (the router's end offset, unchanged).
- Persistence: none. `defaultSize`, `cornerRadius` and `marker` values are read, never rewritten; no `irVersion` bump.
- Smoke scenarios: the four demo scenes in the default viewpoint 0 px from `21345bbba` (shots of the Activity lane at `ca3e41a92`,
  same code); DemoFlowB as Activity (UML): bar node 5×120, initial 20, action radius 14; DemoPetri as Petri net (classic): bars 10×44.

## 2. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Only a view with an authored `defaultSize` reaches the floor | **holds** [R] | `const defaults = authoredDefaultSize(defaultSize);` (`useContentSize.ts:123`); `const size = defaults ? defaultBoxFor(defaults, derived, desc.keepAspectRatio) : derived;` (`:208`); the only other callers of `nodeSizing.ts` read `SHAPE_MIN_SIZE` (`ObjectNode.tsx:934-935`) and `authoredDefaultSize` (`SymbolEditorModal.tsx:259`) [M, `command grep -rn` over `src`, exit 0, every hit listed] |
| H2 | The floor can be lifted per form inside `nodeSizing.ts` | **falsified** | `export function defaultBoxFor(defaults: DefaultSizeAxes, derived: Size, keepAspect: boolean): Size {` (`nodeSizing.ts:72`): no form; `keepAspect` is true only for `circle` in `SHAPE_REGISTRY` (`shapeRegistry.ts:334-439`, read whole), so a bar cannot be told from a rect [R] |
| H3 | No CSS floor holds a bar or a circle above its explicit size | **holds** [R], to be measured in Phase 2 | `.mm-node.ir-sized { min-width: 0; min-height: 0; width: 100%; height: 100%; }` (`irStyle.ts:145`); `.mm-node:has(> .ir-node-content.ir-shape--bar) { min-width: 0; min-height: 0; overflow: visible; }` (`:214`); `.mm-node.ir-sized > .ir-node-content.ir-shape--bar { width: 100%; height: 100%; }` (`:213`); the circle's at `:99-100` |
| H4 | The R-VP-16 Petri bar (48×12) moves with the floor | **falsified** [R] | it declares no `defaultSize` (0 lists of `petri` carry one [M]); `BAR_SIZE: Size = { w: 48, h: 12 }` is its CSS box (`shapeRegistry.ts:312`, `irStyle.ts:212`), and a bar has no supplement, so the hook stays off (`shapeRegistry.ts:613-615`) |
| H5 | The registry can size a marker | **falsified** [R] | `export interface MarkerDef { readonly id: string; readonly label: string; readonly paths: readonly MarkerPath[]; }` (`markerRegistry.ts:36-41`); «Aggiungere un marker e' aggiungere una entry qui» (`:11`) |
| H6 | A larger disc reaches the derived Activity documents with no document change and moves nothing else | **falsified** [M] | `dot` is in 5 lists besides Activity's 3: State machine 1, Flowchart 3 (R-VP-17's bull's-eye), classic Petri 1 (the one-token rule, `viewpointDerivation.ts:866`); catalogue `values: { form: 'circle', marker: 'dot' }` (`notationCatalog.ts:95`, `:107`) |
| H7 | The disc drawn today is about 6.4 px | **holds** [R] | the layer is `position: absolute; inset: 0` in `.ir-node-content` (`irStyle.ts:43`, `position: relative` at `:24`), so it spans the padding box: node 24, painted 22, inside the 1 px border 20; `M34,50 A16,16` gives 32/100 × 20 = 6.4 px; 14 px needs radius 35 |
| H8 | `min(w, h) / 2` changes no existing view of the corpus | **holds** [M] | radii in the 81 lists: `rounded r=14` ×9, Activity only; in the seven exports: `"cornerRadius":8` on MDE_ERD_1's user rect views (1 file of 7, `command grep -c`), content-hug boxes at least 40 high (`irStyle.ts:82`), where `min(r, 40/4)` = 8 already |
| H9 | The authoring previews move with the clamp | **partly** [R] | `clampCornerRadius(radius * GLYPH_RADIUS_RATIO, GLYPH_W, GLYPH_H)` (`VertexAuthoringPanel.tsx:120`, 41×25); `clampCornerRadius(radius, 52, 32)` (`SymbolPreview.tsx:64`): only radii above 8.9 and 8 move, on the corpus the Activity action alone; they mirror the canvas by design |

## 3. What else would move
- **Floor, uniform**: any user view with an authored axis below 24 (the panel accepts ≥ 1, `VertexAuthoringPanel.tsx:914`, `:925`) draws
  at its number. Not measurable beyond the corpus (none there). A circle of 20 stays resizable; a hand resize starts from the
  24 px resizer floor (`ObjectNode.tsx:934`), unchanged by design.
- **Clamp at half**: a user view with a radius above a quarter of its box draws closer to the number written. The D5 note on
  anchors (`DynamicHandles.tsx:354-357`) holds for the action: on 140×42 with radius 14 the sides run straight between 14 and 28,
  where a centred anchor sits. `roundedPolygonPath` already clamps each corner to half its edges (`shapeRegistry.ts:586`).
- **New marker row**: one more option in the Symbol Editor's marker select (`VertexAuthoringPanel.tsx:78`). A persisted name once saved.

## 4. Files and lines per change (Phase 2)
1. `frontend/src/components/editor-v2/nodes/nodeSizing.ts:67-80`: `defaultBoxFor` without `Math.max(SHAPE_MIN_SIZE, …)`; comment.
2. `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts:483-491`: `/ 4` to `/ 2`, comment.
3. `frontend/src/components/editor-v2/viewpoint/ir/markerRegistry.ts:83`: the row `dot-large` after `dot`.
4. Tests: `nodes/__tests__/nodeSizing.test.ts`, `viewpoint/ir/__tests__/shapeRegistry.test.ts`, `viewpoint/ir/__tests__/markerRegistry.test.ts`.
Not in the DOVE, asked: `viewpoint/derive/viewpointDerivation.ts:837` (`marker: 'dot'`), `derive/__tests__/activityUml.test.ts`.

## 5. Files read (under `/Users/alfonso/jjodel-w-notations/`)
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, `docs/decisions.md` RC-20..RC-34 and
R-VP-15..26, `docs/discovery/discovery_2026-09-30_activity_uml_notation.md` §0 and §6, `docs/discovery/discovery_2026-09-29_symbol_default_size.md`
(the 24 floor's origin, grep), `docs/discovery/discovery_2026-09-16_corner_radius_axis.md` (the quarter clamp, grep);
`frontend/src/components/editor-v2/nodes/nodeSizing.ts` (whole), `viewpoint/ir/markerRegistry.ts` (whole), `viewpoint/ir/useContentSize.ts`
(whole), `viewpoint/ir/shapeRegistry.ts:265-325`, `:330-440`, `:440-540`, `:560-700`, `viewpoint/ir/irStyle.ts:20-47`, `:60-147`, `:212-214`,
`viewpoint/ir/IRNodeContent.tsx:425-560`, `viewpoint/ir/irDefaults.ts:1-80`, `:115-270`, `viewpoint/derive/viewpointDerivation.ts:355-400`,
`:740-990`, `nodes/ObjectNode.tsx:900-940`, `components/DynamicHandles.tsx:345-365`, `authoring/VertexAuthoringPanel.tsx:100-125`,
`:450-475`, `:905-940`; the tests `nodes/__tests__/nodeSizing.test.ts`, `ir/__tests__/markerRegistry.test.ts:1-120`,
`ir/__tests__/shapeRegistry.test.ts` (grep of the clamp), `derive/__tests__/activityUml.test.ts:1-200`; `scripts/smoke/_tmp_actuml_dump.ts`.

## 6. Addendum 2026-09-30, Phase 2 (measured on `3805796be`)
- **Adopted as recommended** (RC-21, unattended): questions 1 and 3 as written; question 2 in part, the row `dot-large` in
  `markerRegistry.ts`. Its use by the Activity final (`viewpointDerivation.ts:837`, `activityUml.test.ts`) is outside the DOVE and
  is not done: asked at the hard stop. The derivation's comments that still speak of the 24 px floor
  (`viewpointDerivation.ts:768`, `:775-777`, `:871-873`) are in the same file and wait with it.
- **Code** `3805796be`: `nodeSizing.ts` (`defaultBoxFor` without the floor), `shapeRegistry.ts` (`clampCornerRadius` at half),
  `markerRegistry.ts` (`dot-large`, radius 35), and their three test files. No other file.
- **Tests first** [M]: 9 of 101 red on the unchanged source (`_tmp_actsize_red.log`): the two floor unit tests, fork and join,
  initial, bull's-eye (no `dot-large`), action radius, classic bar, the clamp unit test, the `dot-large` row. 101/101 after.
- **Gates** [M]: typecheck exit 2, 14 errors, the §17 set by file and code; `npx vitest run` 6213 tests (6201 + 12), 6209 passed,
  the 9 known files red at import and 4 in `criticalZone.test.ts` from the lane's go-ahead variable (70/70 with it unset);
  `npm run build` exit 0.
- **Mutation bench** [M] (`_tmp_actsize_bench.mjs`, 16 mutants on the three sources): **16/16** killed, controls 101/101 before
  and after; the floor back at 24, 12 or 6, the axes swapped, the width ignored, the resize floor moved, the clamp at a quarter,
  a third, none or the longer side, `dot-large` dropped, at radius 32, hollow, off-centre, and `dot` enlarged.
- **Lane probe** [M] (`lane-run probe`, 3087, light, 1600×1000, DPR 2; `_tmp_actsize_probe.ts`, log
  `~/.jjodel-lanes/P-2026-09-30-1720/probe-_tmp_actsize_probe.log`) **19/19**:
  - Default scenes `first`: sm, petri, esm, flowB 0 px left of the rail from the Activity lane's shots at `ca3e41a92` (code of
    `21345bbba`), 462 px each inside the animated Jodie launcher's box, masked as in earlier lanes; control 348100 px.
  - DemoFlowB as Activity (UML), flow px: fork and join node 5×120, painted 3×118 (was 24×120, 22×118); the initial node 20×20,
    painted 18 (was 24, 22); the bull's-eye node 24×24, painted 22, its `dot` disc 6.4 px on a 20 px layer; actions node 142×44,
    radius `14px` (was 10.5); the decision 36×36, unchanged; nine flows 1 px ink.
  - DemoPetri as Petri net (classic): t1, t2, t3 node 10×44, painted 8×42 (was 24×44); p1, p2, p3, lock 44×44, unchanged.
  - Session only, the FinalNode view's marker set to `dot-large` through its L-proxy: the disc 14×14 px on the 20 px layer, in the
    ink (the store read at once still said `dot`; the canvas after reactivation drew the new row). Nothing saved.
  - Read on the crops, not measured: the flows stop 5 px short of the bars as of every symbol (the router's end offset, the
    Activity lane's §6), more visible now the bar paints 3 px.
  - No page error.
  - Crops (`frontend/scripts/smoke/_tmp_actsize_crops/`, gitignored): `actsize_flowB_activityUml_600.png`,
    `actsize_petri_classic_600.png`, `actsize_flowB_activityUml_dotlarge_600.png`, and the full-size close-ups
    `actsize_flowB_activityUml_bars.png`, `_initial.png`, `_final_dot.png`, `_final_dotlarge.png`, `actsize_petri_classic_bar.png`.
- **Open**, for the chat: (a) switch the Activity final to `dot-large` (question 2); (b) the bar paints 3 px at the declared 5
  (the wrapper's 1 px each side, question in the hard stop): a 5 px painted bar is `defaultSize` 7, a derivation change.
