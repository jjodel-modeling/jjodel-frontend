# Phase 2 report: slices A1 and A3, the Statechart (UML) and Flowchart (ISO 5807) notations
Prompt-ID P-2026-09-30-0355 · `docs/prompts/claude_2026-09-30_0355_prompt_a1_a3_notations.md` · Chat C-2026-09-29-2230 · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, on the D tip (`64ea9f216`, `4c6b4f315`, HEAD `c676fc6f6`) · executor Anthropic Claude Opus 5.5. [M] measured in this lane, [R] read.

## 0. Answer in brief
- **Two notations added beside their siblings** (code `74995f429`) [M]: «Statechart (UML)» (`statechart`, on the
  `stateMachine` profile) and «Flowchart (ISO 5807)» (`flowchartIso`, on `flowchart`), the dialog now lists six. Each
  post-processes its sibling's role-keyed documents, so State machine, Flowchart, Petri net and Generic derive the D
  tip's documents byte for byte, provenance included (16 digests pinned on `c676fc6f6`).
- **Two optional IR keys** (R-VP-22): `ShapeSpec.entry?: 'dot' | 'arrow'`, `EdgeViewIR.edge.curve?: 'arc'`. Absent, the
  compile's key lists, the fixture irHashes (C2 pins) and the markup of a state box, an IR edge, an IR self-loop, a
  straight IR edge and a reference edge (pinned on the D tip) are unchanged.
- **The three C3 causes, fixed for arc edges only** [M]: the self-loop is a cubic over the top edge on two top handles
  (causes 1 and 2); the arc runs between the handle centres with no router, so no snap (cause 3; on the bench the
  router drew a 7 px step level at y 19.5, the arc keeps 16 → 23).
- **Turnstile as Statechart (UML)** [M]: no two line ends on `locked` within 6 px (6 ends, minimum 10.5 px); the entry
  tip on `locked`'s border (1.0 px from the outer edge, inside the 1 px border); arrow tips 1.00, 1.01, 1.00, 1.00,
  1.00 px from the outer edge of the visible border: **the strict ≤ 1 px check fails by 0.01 px on one tip** (§2).
- **Default viewpoint** [M]: the four demo scenes, left of the rail, pixel-identical to the D tip's shots (4 of 4, 0 px).
- **Gates** [M]: typecheck 14 (the §17 set); vitest 6093 passed (6049 + 44), the 9 known files red at import; build
  exit 0; mutation bench 46/46; lane probe 15/23, the 8 failures read in §2 (rail content, the bag, the 0.01 px).

Recommended: accept the 1.00-1.01 px tips (the handle centre, on the RF box, 1 px outside `.ir-node-content`'s
visible border because of the wrapper's transparent 1 px border); moving the arc's ends 1 px further in would read that
wrapper geometry inside UnifiedEdge.

**Decisions awaiting Alfonso** (RC-26): which of the two state-machine notations and which of the two flowcharts the
demo uses (the prompt's own open choice). None new: R-VP-22 is written under the delegation of 2026-09-29 evening and
amends no row.

**Questions**
1. The strict tip criterion: accept 1.01 px as within 1 px? Recommended: yes, the 0.01 px is sub-pixel rounding of the
   same 1 px wrapper offset every IR node has.
2. There is no Decision role in the role catalogue (`model/simulation/roleCatalog.ts`), so A3's diamond comes from the
   name signal only (DemoFlowB's `Decision` class). Recommended: keep; a Decision role is a catalogue change, its own lane.

## 1. Layer Impact Report (written before the first source edit)

Base: the notation discovery §1 rows 1, 2, 7, 19, 20 and §2 (`ee7206d0c`), the C3 report (`fb8944688`), R-B9,
R-IRN-32, R-IRN-33, Rule 11, R-VP-15..21.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   -- IRNodeContent (entry mark), UnifiedEdge (arc path), irEdgeViews (handles of an arc self-loop)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the saved IR only: two optional keys; no VersionFixer, no jsxString
```

**Persistence (the saved `DViewElement.ir`).**
- What changes: two optional keys, spelled once and for good (R-B9, no VersionFixer for IR views):
  `ShapeSpec.entry?: 'dot' | 'arrow'` and `EdgeViewIR.edge.curve?: 'arc'`. The derivation writes them only
  for the two new notations; the `_state` value `derivedNotation` gains two values, `statechart` and
  `flowchartIso`, and `ir.generated.notation` the same two.
- What does NOT change: every key already persisted, `irVersion` (no bump, R-IRN-32), `structuralHash`
  and `irHash` of every IR without the keys (the compile adds `entry` / `curve` to its output only when
  declared, so the compiled key lists pinned by C2 stay as they are).
- Cross-layer: none; the IR is read by the compile, the index and the renderers only.
- Safety: an absent key renders today's output byte for byte; an unknown value renders as absent (the
  permissive render of R-B9-bis) and is refused by `validateIR`.

**Canvas v2-flow.**
- What changes, only where the key is present: (1) `IRNodeContent` draws the entry mark, an absolute SVG
  outside the box on its left (`irStyle.ts` places it and lifts the two clips, as for the outside label);
  (2) `irEdgeViews` writes `irCurve` on the edge data and gives an arc self-loop two `top` handles
  (source and target) instead of right → left, so its handles are the ones its line touches (C3 causes 1
  and 2); (3) `UnifiedEdge` draws an arc edge between the centres of its two handles, bypassing the
  Manhattan pipeline as `routing: straight | curved` does: straight when single, a quadratic bowed away
  from the opposite edge when one runs between the same nodes the other way, a cubic loop over the top
  edge for a self-loop; no router, so no snap (C3 cause 3). The pure geometry lives in `edgeUtils.ts`.
- What does NOT change: an edge without `curve` (every condition added is `|| isArcIR`, false for it),
  `portDistribution.ts`, `handlePosition.ts`, `DynamicHandles.tsx` (the handles of an arc edge are placed
  by the same pool, only their side changes for a self-loop), the classic canvas, the default notation.
- Cross-layer: an arc edge registers no path for the crossing detector (as the non-orthogonal IR
  edges), so no other edge gets a bridge against it, by design.
- Safety: the demo scenes in the default viewpoint render no IR view with the keys; measured below.

**Derivation (pure, `viewpointDerivation.ts`, `notations.ts`).** Two notations added to the list,
«Statechart (UML)» on the `stateMachine` profile and «Flowchart (ISO 5807)» on the `flowchart` profile;
each post-processes the role-keyed documents of its profile, so «State machine» and «Flowchart» keep
their documents byte for byte (pinned below). No D-layer write beyond what slice D already does.

Smoke-test scenarios potentially affected:
- the four demo scenes in the default viewpoint, pixel-identical to the D tip;
- DemoPEST derived as State machine and DemoFlowB as Flowchart, the documents byte-identical to the D tip;
- save → reopen of a derived viewpoint: the two keys round-trip as JSON (tested).

## 2. Measures

**Bench (vitest, node)** [M]. New `ir/__tests__/irA1Keys.test.ts` (10) and `irA1Render.test.ts` (12, the C2 bench with
React Flow's node and edge hooks answering from a fixture: two 120×48 nodes, 8×8 handles centred on the border at
(k+1)/(N+1)); `notations.test.ts` +17. Red first on the D tip: the pins read there (`ff9502eeadfde0a1` state box;
`f9e649a65eec1012`, `010be3f59473befc`, `d2ba7fd8d6331a51`, `7152fdaa37b894f5` the four edges; 16 derivation digests),
every A1/A3 expectation red. Two existing tests changed with the list and the CSS: `DeriveViewpointDialog.test.ts` (six
notations) and `shapeRegistry.test.ts` (the outside-label section now ends at `ENTRY_MARK_CSS_START = 20461`, the whole
CSS of the D tip, sha `9389262213aac4a4`; the appended rules are exactly the two clip lifts).

**Mutation bench** (`frontend/scripts/smoke/_tmp_a1a3_bench.mjs`, gitignored) [M]: 46/46 killed, controls green
before and after (435 tests). Mutants: compile (entry dropped, any entry, curve dropped), validator (both vocabularies
opened), edge views (no `irCurve`, `irCurve` always, loop sides kept, every loop on top), geometry (never bows, always
left, label on the apex, loop below, loop label below, handle edge instead of centre), UnifiedEdge (arc ignored, arc on
every IR edge, RF points, no opposite, loop fallback at handles, path and label not arc), IRNodeContent (never, always,
no dot, tip 1 px short, fixed colour), irStyle (wrapper clip kept), Statechart (no entry, single terminal border, no
curve, open arrow, unstyled label, keyed on the Trigger, no compartment, weight), ISO (name before role, no `io`, no
`if`, yes/no at priority 0, compared with the word, center instead of template, role-less restyled, font), routing and
the notation dropped in `notations.ts`.

**Lane probe** (`lane-run probe`, port 3076, light, 1600×1000, DPR 2; `_tmp_a1a3_probe.ts`, log
`~/.jjodel-lanes/P-2026-09-30-0355/probe-_tmp_a1a3_probe.log`, EXIT=1, 15/23) [M]. The D probe's fixture and dialog path.
- Default scenes `first`: SM identical outright; Petri, ESM, FlowB differ only right of x 2002 (the rail: my run shows a
  model's properties, D's showed its derived viewpoint), 0 px left of it (`_tmp_a1a3_pixdiff.ts`, split at x 1970;
  control SM against Petri 348100 px). Counted as FAIL by the probe's whole-canvas rule, 3 of the 8.
- Default scenes `after`, not comparable to D's `after` (D shot it before any bag): ESM and Petri 0 px from my own
  `first`; SM and FlowB, the two scenes where the probe wrote the simulation bag, differ (the Simulation chip and the
  sim rendering of the default view), 112579 and 176208 px. The split follows the bag exactly. 4 of the 8.
- Turnstile as Statechart: 6 views say `statechart`, the Initial with `entry: 'dot'`, the transition `curve: 'arc'`;
  paths `M 250 71 Q 358.39 16.9 470 64`, `M 470 78 Q 360.81 130.35 250 81.5` (bowed apart), two cubics over `locked` and
  `unlocked`, `stop` `M 250 60.5 L 890 71` straight; every state a rounded box; line ends on `locked` 6, minimum distance
  10.5 flow px; entry tip 1 px from the outer edge (on the border); arrow tips 1.00/1.01/1.00/1.00/1.00 px, the last FAIL.
- FlowB as ISO: `i0`, `fin` stadium, `d1` diamond, `work`, `fk`, `left`, `right`, `jn` rect; names 13 px 500
  `rgb(15, 23, 42)`; guards `model.[count] < 2`, `>= 2` in the halo style (12 px, 500, `rgb(100, 116, 139)`).
- No page error; one console error, `failed to get project {project: null}`, the one earlier lanes logged.
- Crops (`frontend/scripts/smoke/_tmp_a1a3_crops/`, gitignored): `a1a3_sm_statechart_600.png`,
  `a1a3_sm_stateMachine_600.png`, `a1a3_flowB_flowchartIso_600.png`, `a1a3_flowB_flowchart_600.png`.

**Read on the crops, not measured**: `stop` runs straight from `locked` to `off` across `unlocked` (the demo layout puts
`off` on the same row; the mockup has it below); the ISO diamond is content-sized, small against the mockup's 176×96.

## 3. Lane choices (inside the prompt)
- The drawing of the two notations is a post-process of the sibling's documents (order, endpoints, labels, rules), so
  the sibling cannot move; a class with no role keeps the sibling's drawing (an Event, a Note).
- Statechart: a state holding slots other than its name keeps R-VP-17's attribute rows, its name then on top; the
  Terminal none. The arc label is the sibling's (event, else guard).
- ISO: the Initial, the Terminal and an Activity final are stadiums by role; then the name words (camel case and `_`
  split, R-VP-19's split), stadium > parallelogram > diamond; fork and join are rectangles. `yes`/`no`: two more
  documents per flow class with a guard, `predicate: guard eq 'true' | 'false'` (the loose `eq` also takes a boolean)
  and priority 1; the plain one labels with the template `[$guard.value]`. No guard, one document, unlabelled.
- The arc: bowed away from the mean midpoint of the opposite chords (so the two arcs part whichever slot each got),
  control 0.23 of the chord (24..96 px), label 10 px past the apex; the loop 64 px high, spread 16 px, label 10 px
  above; a loop whose handles are not both on top is drawn at the top centre, ±18 px. An arc registers no path for the
  crossing detector; its endpoint grips sit on its ends.
- The entry mark: 40×14, dot r 6, filled 8 px arrowhead, 1 px line, in the border colour (the marker's), placed inline
  (`right: 100%`), so the SVG-painted forms' in-flow rule cannot take it back.

## 4. Files (Rule 19: 15 files, all in the prompt's DOVE or their tests)
`irTypes.ts` (the two keys, the compiled fields), `irCompile.ts` (both, only when declared), `irValidate.ts` (both
vocabularies), `irEdgeViews.ts` (`irCurve`, top handles for an arc self-loop), `edgeUtils.ts` (the arc geometry,
appended), `UnifiedEdge.tsx` (the arc path, gated), `IRNodeContent.tsx` (the entry mark), `irStyle.ts` (two clip lifts,
appended), `viewpointDerivation.ts` (the two drawings, the routing), `notations.ts` (the two entries, the notation
passed); tests `irA1Keys.test.ts`, `irA1Render.test.ts` (new), `notations.test.ts`, `DeriveViewpointDialog.test.ts`,
`shapeRegistry.test.ts`. The dialog's source is untouched: it maps the list. `portDistribution.ts`, `handlePosition.ts`,
`DynamicHandles.tsx` untouched.

## 5. Files read (under `/Users/alfonso/jjodel-w-notations/`)
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P4-P9, P11, P12, P16), `docs/decisions.md`
(RC-20..34, R-VP-15..21), discovery `ee7206d0c` (§0, §1, §5), C3 report (`git show fb8944688:…`), the D report, the two
mockups; `irTypes.ts`, `irCompile.ts` (edge and vertex compile), `irValidate.ts`, `irEdgeViews.ts`, `irResolveCore.ts`
(resolution order), `IRNodeContent.tsx` (render), `irStyle.ts`, `UnifiedEdge.tsx`, `edgeUtils.ts` (router, self-loop),
`components/DynamicHandles.tsx`, `utils/handlePosition.ts` (split and order), `useContentSize.ts`, `nodeSizing.ts`,
`utils/deriveViewpoint.ts`, `DeriveViewpointDialog.tsx`, `viewpointDerivation.ts`, `notations.ts`, and their tests.
