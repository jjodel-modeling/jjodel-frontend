# Phase 1 report: slice A2, «Petri net (classic)», and open arrowheads in the derived notations
Prompt-ID P-2026-09-30-1521 · `docs/prompts/claude_2026-09-30_1521_prompt_a2_petri_classic_open_arrows.md` · Chat C-2026-09-30-1458 · session `40dcabb6-a933-43ac-bf43-d3da4720d2d8` · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, HEAD `2cde09984` (on the A4 tip `144acf0c8` and the checkpoint `43473dd89`) · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase on `2cde09984`, [R] read.

## 0. Answer in brief
- **Both changes fit the Phase 2 DOVE with six source files** [R]: `irTypes.ts` (one union member), `irValidate.ts` (a termination
  vocabulary), `UnifiedEdge.tsx` (one marker, rendered only when an end uses it), `EdgeAuthoringPanel.tsx` (one option),
  `viewpointDerivation.ts`, `notations.ts`. `irCompile.ts` and `irEdgeViews.ts` pass terminations through verbatim and need no
  change; `DeriveViewpointDialog.tsx` lists `DERIVED_NOTATIONS` generically and needs none either.
- **Open arrowheads touch four notations, not seven** [M]: Generic, Statechart (UML), Flowchart (ISO 5807) and the R-VP-16 Petri
  arc write `closedArrow`; State machine and Flowchart already end in `openArrow` (the structure default the role-keyed transition
  keeps), Chen writes `none`. On the corpus (9 metamodels × 7 notations) 24 of 63 document lists hold `closedArrow`, all in those four.
- **Pins that move, predicted before any edit** [M]: 5 tests, 24 digests, each equal to the tip's documents with every `closedArrow`
  an `openArrow` (§4). No other fixture hash moves; the markup of an IR edge without `hollowCircle` stays byte-identical.
- **What the mockup needs and the IR has** [R]: `outside` labels render (`irStyle.ts:230-237`); `dot`, `dots-2..4` exist
  (`markerRegistry.ts:83-109`); `curve: 'arc'` exists (R-VP-22); `defaultSize` sets a per-view box (`irTypes.ts:538`).
  **The bar cannot follow its orientation** (no per-instance size, no orientation key), and **`defaultSize` is floored at 24 px
  per axis** (`nodeSizing.ts:73`), so a vertical bar written 10×44 draws 24×44. Lifting that floor is outside the DOVE.

Recommended: proceed to Phase 2 in cascade; every question below has one recommendation inside the files of the prompt.

**Decisions awaiting Alfonso** (RC-26, non-blocking)
1. DemoPEST and DemoFlowB open today on **State machine** and **Flowchart** (R-VP-22: «a stored simulation binding still opens on
   the sibling», `notations.ts:139-141`), not on Statechart (UML) and Flowchart (ISO 5807) as the prompt's «as DemoPEST and DemoFlowB
   preselect theirs» reads. This lane moves only the Petri mapping (R-VP-24). Recommended: the same one-line mapping for the state
   machine family → `statechart` and `flowchart` → `flowchartIso` in a follow-up, since the demo uses them (amends R-VP-22).

**Questions** (each adopted as recommended, RC-21)
1. The bar: `defaultSize` floor. Recommended: write `defaultSize: { width: 10, height: 44 }` (the mockup), drawn 24×44 by today's
   floor; the per-form floor (`nodes/nodeSizing.ts:73`, one line) is a ticket for a lane that names that file.
2. `validateIR` checks no termination (`hollowCircle` passes today, so a test for it would be vacuous). Recommended: a closed
   vocabulary `Record<EdgeTermination, true>` checked at authoring time (R-B9-bis), the render staying permissive.
3. The Edge authoring panel's End select. Recommended: list «Hollow circle»; unlisted, a classic inhibitor view shows «None».
4. The Petri mapping. Recommended: every stored Petri binding (system `petri`, a user profile based on it, a Custom Petri shape)
   opens on «Petri net (classic)», `notations.ts:140,149`; the latest derived viewpoint still wins, as today.
5. The styles the mockup leaves to the notation. Recommended: place 44×44 (`defaultSize`, the mockup's r = 22), its name outside
   `s` 13 px 500 in the ink (`.sm`); transition name outside `e` (R-VP-15 (1)), 12 px 500 quiet ink (`.lbl`); the weight label in
   the C2 halo style (`.lbl`); one token the registry's `dot`, 2-4 `dots-*`, from 5 the number 15 px 600 in the ink (`.mk`);
   the bar keeps `#334155` (R-VP-15 (4)).
6. The weight > 1. Recommended: per arc class a second document, predicate `gt $weight.value 1`, priority 1, label the weight;
   an inhibitor arc too (the mockup's `3`). The resolver ranks priority before specificity (`irResolveCore.ts:59-68`), so the
   InhibitorArc's own weighted document wins over Arc's.

## 1. Layer Impact Report (written before the first source edit)

Base: R-B9, R-IRN-32, R-IRN-33, Rule 11, R-VP-15..23, the A4 report. Read: `irTypes.ts` (`EdgeTermination`, `LabelSpec`,
`defaultSize`), `irCompile.ts:691-694`, `irEdgeViews.ts:40-80`, `irValidate.ts` (whole), `UnifiedEdge.tsx:560-600, 750-960`,
`EdgeAuthoringPanel.tsx:105-125, 465-480, 815-840`, `irStyle.ts:195-245`, `shapeRegistry.ts:300-330, 425-440`,
`markerRegistry.ts:60-125`, `nodes/nodeSizing.ts` (whole), `useContentSize.ts:95-245`, `irResolveCore.ts:55-70`.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   -- UnifiedEdge: one IR marker, drawn only when an end is hollowCircle
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the saved IR only: one union member; no VersionFixer, no jsxString
```

**Persistence (the saved `DViewElement.ir`).**
- What changes: `EdgeTermination` gains `'hollowCircle'` (the name ratified in R-VP-15 (1), permanent, R-B9); the `_state` value
  `derivedNotation` and `ir.generated.notation` gain `petriClassic`. New derived documents of four notations write `openArrow`
  where they wrote `closedArrow`; viewpoints already derived keep what they saved (no migration: they are data).
- What does NOT change: every other key, `irVersion` (R-IRN-32), `structuralHash` / `irHash` of every IR a derivation did not write.
- Cross-layer: none; the compile passes `terminations` through (`irCompile.ts:691-694`), `irEdgeViews.ts:71-72` copies them to
  `data.irSourceTermination` / `irTargetTermination`.
- Safety: an unknown termination still draws no marker (`UnifiedEdge.tsx:590`, `default: return undefined`); `validateIR`
  refuses it at authoring time only (question 2).

**Canvas v2-flow.**
- What changes: `irMarkerUrl` maps `hollowCircle` to a per-edge `<marker>` (a circle, the `reference-marker hollow` class, tinted by
  `irStroke` like the others), mounted only on an edge one of whose ends is `hollowCircle`.
- What does NOT change: the markup of every edge without it (the render pins of C2, A1, A4); classic edges; the default viewpoint
  (M2 and M1 native views never carry IR terminations).
- Cross-layer: none. Side effects: none on sync, ports (`portDistribution.ts` not touched) or handles.

**Smoke-test scenarios potentially affected.** The four demo scenes in the default viewpoint (expect 0 px from `43473dd89`); DemoPetri
derived as «Petri net (classic)» and as «Petri net»; DemoPEST as Statechart (UML); DemoFlowB as Flowchart (ISO 5807); one Generic.

## 2. Hypotheses and verdicts
| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `ShapeForm 'bar'` can take the mockup's 10×44 and follow the orientation | **falsified** (partly) | fixed CSS box `.ir-node-content.ir-shape--bar { width: ${BAR_SIZE.w}px; height: ${BAR_SIZE.h}px;` (`irStyle.ts:212`), `BAR_SIZE: Size = { w: 48, h: 12 }` (`shapeRegistry.ts:312`); an explicit size fills it: `.mm-node.ir-sized > .ir-node-content.ir-shape--bar { width: 100%; height: 100%; }` (`:213`); `defaultSize?: { width?: number; height?: number };` (`irTypes.ts:538`) is per view, not Conditional, and `Math.max(SHAPE_MIN_SIZE, defaults.width)` (`nodeSizing.ts:73`) with `SHAPE_MIN_SIZE = 24` (`:19`) [R] |
| H2 | The place name can sit below the circle with the existing `outside` label | holds | `LabelPosition = 'top' \| 'center' \| 'inside' \| 'bottom' \| 'outside'` (`irTypes.ts:60`); `.ir-label--outside.ir-label--anchor-s { top: calc(100% + 8px);` (`irStyle.ts:235`); the outside rules (0,4,0) beat the bar's centred label (0,3,0) (`irStyle.ts:223-225`) [R] |
| H3 | The `dots-*` markers draw the initial marking | holds, with `dot` for one token | `dot: { id: 'dot', label: 'Dot (final state, token)'` r 16 (`markerRegistry.ts:83`), `'dots-2'` r 8 (`:87-93`); the recipe of lane 1 (`3a1753b73`): marker rules `eq 1..4`, a centre label `visible` when `gt 4` [R] |
| H4 | `hollowCircle` is missing everywhere | holds | `grep -rn hollowCircle frontend/src` exit 1, 0 lines; control `grep -c closedArrow viewpointDerivation.ts` 4 [M] |
| H5 | Every derived notation with an arrowhead writes `closedArrow` | **falsified** | the baseline dump: `stateMachine` 0/9 closed 7/9 open, `flowchart` 0/9 closed 7/9 open, `generic` 8/9 closed, `statechart` 5/9, `petri` 6/9, `flowchartIso` 5/9, `erChen` 0 [M]; `targetEnd: 'openArrow'` (`viewpointDerivation.ts:336`) kept by the control-flow transitions, `'closedArrow'` at `:342, :537, :644, :708` [R] |
| H6 | `validateIR` knows the terminations | **falsified** | `grep -n "terminations\|Termination" irValidate.ts` exit 1; control `grep -n routing` 2 lines [M] |
| H7 | DemoPEST and DemoFlowB preselect Statechart (UML) and Flowchart (ISO 5807) | **falsified** | `petri: 'petri', flowchart: 'flowchart', stateMachine: 'stateMachine',` (`notations.ts:140`); tests `initialNotation … toBe('stateMachine')` (`notations.test.ts:306`), `'flowchart'` (`:312`) [R] |

## 3. Files and lines per change (Phase 2)
1. `viewpoint/ir/irTypes.ts:609-615`: `| 'hollowCircle'` after `'hollowDiamond'`, with its doc (R-VP-15 (1), R-VP-24).
2. `viewpoint/ir/irValidate.ts`: `VALID_TERMINATIONS: Record<EdgeTermination, true>` beside `VALID_CURVE_VALUES` (`:47`), checked in the
   edge block after `curve` (`:344-351`), each end read as unknown, absent legal.
3. `edges/UnifiedEdge.tsx:572-591`: `markerIRHollowCircleId`, `case 'hollowCircle'`, and in the IR defs (`:880-940`) a `<marker>`
   drawn only when `irSourceTermination` or `irTargetTermination` is `hollowCircle`.
4. `viewpoint/authoring/EdgeAuthoringPanel.tsx:115-122`: `{ value: 'hollowCircle', label: 'Hollow circle' }`.
5. `viewpoint/derive/viewpointDerivation.ts`: `closedArrow` → `openArrow` at `:342` (R-VP-16 arc), `:537` (Generic), `:644` (Statechart),
   `:708` (ISO); `DerivationRoles.notation` gains `'petriClassic'`; a new `deriveClassicPetriViewpointIRs` over the Petri documents
   (place, transition, arc, inhibitor arc re-drawn; every other document the sibling's); `deriveViewpointForBinding` dispatches it.
6. `viewpoint/derive/notations.ts`: `'petriClassic'` in `DerivedNotationId` and `DERIVED_NOTATIONS` after Petri net, on the `petri`
   profile, `nodeLabel: 'Place'`; `PROFILE_NOTATION.petri` and the Custom Petri shape (`:140`, `:149`) → `petriClassic`;
   `derivationRolesOf` (`:253`) passes it.
Tests: `irValidate.test.ts`, `notations.test.ts`, `viewpointDerivation.test.ts`, `erChen.test.ts`, `DeriveViewpointDialog.test.ts`,
a new `irA2Render.test.ts`. Rule 19: 6 source files, 6 test files, the DOVE of the prompt; no `§3.1` file outside it.

## 4. Fixtures that move (predicted on `2cde09984`, before any edit)
Method [M]: temporary copies of the three derive test files whose `digest` hashes the JSON with every `"closedArrow"` an `"openArrow"`,
run and deleted (`frontend/scripts/smoke/_tmp_a2_pred.log`, gitignored): 5 of 207 tests fail, only on pins. After Phase 2 the real
digests must equal these predictions.
- `viewpointDerivation.test.ts`: the R-VP-16 Petri pin `d43f9d79bf78f9f4` → `997f12afe5b58db0` (twice, `:595` and the rule-1 table).
- `notations.test.ts`: the same Petri pin (`:447`); the D-tip table (`:640-643`) Generic ×4 and `DemoPetri petri`, `DemoFlowB petri`.
- `erChen.test.ts` (the 54 corpus pins): Generic, Statechart, Flowchart (ISO) and Petri net where the tip held `closedArrow`,
  24 in all; every `stateMachine` and `flowchart` pin unchanged.
- Documents asserted whole that name `closedArrow`: `viewpointDerivation.test.ts:689` (Petri arc), `:1062` (`C_ARROW`, Generic),
  `notations.test.ts:712, 783` (Statechart and ISO flows). The render tests use `closedArrow` as input and do not move.
The corpus dump (`_tmp_a2_dump.ts`, 63 lists) is kept as `_tmp_a2_docs_base.jsonl` for the same comparison on the exports.

## 5. Files read (under `/Users/alfonso/jjodel-w-notations/`)
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, `docs/decisions.md` RC-20..34 and R-VP-15..23,
`docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` (whole), `docs/discovery/discovery_2026-09-30_a4_er_chen.md`
§0-§1, `docs/sessioni/sessione_2026-09-30.md`, `docs/log-inbox/views.md` (the C1..A4 entries), `docs/mockups/derived-viewpoints/petri-A.svg`;
`frontend/src/components/editor-v2/viewpoint/derive/notations.ts` and `viewpointDerivation.ts` whole; the windows of §1; the diffs of
`3a1753b73` and `7a254a52f` (the lane-1 marking and its removal); `model/simulation/roleCatalog.ts` ids, `simProfiles.ts:140`.
