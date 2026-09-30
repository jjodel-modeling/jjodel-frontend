# Phase 1 report: the «Activity (UML)» notation for the derived viewpoints
Prompt-ID P-2026-09-30-1552 · `docs/prompts/claude_2026-09-30_1552_prompt_activity_uml_notation.md` · Chat C-2026-09-30-1458 · session `d2ca035a-fda0-4f63-9da9-9c86b9c4ce51` · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, HEAD `d4daecaf7` (on the A2 tip `f603f28e8`, `9ed06f9cd`) · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase on `d4daecaf7`, [R] read.

## 0. Answer in brief
- **No new IR key is needed** [R]: the six drawing rules map onto keys A1, A2, A3 and C2 already built (`defaultSize`, the `bar`,
  `circle`, `diamond` and `rounded` forms, `cornerRadius`, the `dot` marker, the edge `template`, `predicate` + `priority`).
  Phase 2 touches two source files, `derive/notations.ts` and `derive/viewpointDerivation.ts`, and their tests; `irTypes.ts`,
  `irCompile.ts`, `irValidate.ts`, `irEdgeViews.ts`, `UnifiedEdge.tsx` and `DeriveViewpointDialog.tsx` need no change.
- **Three sizes cannot be drawn as specified inside the DOVE** [R], all from render floors outside it: every authored
  `defaultSize` axis is floored at 24 px (`nodes/nodeSizing.ts:73`), so the 5 px bar draws 24 px thick and the 20 px initial
  draws 24; the bull's-eye's inner disc is the registry `dot` (radius 16 of 100, `markerRegistry.ts:83`), about 7 px, not 14;
  the action's radius 14 is clamped to `min(w, h) / 4` = 11 on a 44 px box (`shapeRegistry.ts:490`).
- **The bar cannot be oriented or sized from the edges** [R]: no orientation key, `defaultSize` is per view and not Conditional,
  and no predicate reads geometry. DemoFlowB's model positions run in rows, and every edge of `fk` and `jn` attaches on one
  vertical side [M], so the fixed bar is upright.
- **«Leaving a decision» is not readable on the production backend** [R]: `isKind` with a `path` gets the L-proxy's `.value`
  of the reference, never an id, so it is always false there (`irReadCtxLproxy.ts:28`, `irCompile.ts:193`). On DemoFlowB the
  only guards sit on the two edges leaving `d1` [M], so bracketing every non-empty guard draws exactly the target.
- **The preselection is one mapping in `notations.ts`** [R]; a Decision role is a notation-own role, as A4's ER roles.

Recommended: proceed to Phase 2 in cascade; every question below has one recommendation inside the files of the prompt.

**Decisions awaiting Alfonso** (RC-26, non-blocking)
1. Lift the 24 px floor per form in `nodes/nodeSizing.ts` (the bar none, a circle 12): one line in a file outside this DOVE, and
   it also changes what DemoPetri shows (the classic bar 24 → 10 wide, as A2's documents say, its open ticket). Recommended: a
   lane naming that file; this lane writes the specified sizes so they take effect then, with no document change.
2. A larger bull's-eye disc: a new registry row (`markerRegistry.ts`, outside this DOVE). Recommended: the same lane.

**Questions** (each adopted as recommended, RC-21)
1. The bar. Recommended: upright, `defaultSize: { width: 5, height: 120 }`, drawn 24×120 by today's floor, 5×120 after it.
2. The Decision role. Recommended: a notation-own role `decision`, «Decision / merge» in the table, not a catalogue change.
3. The signal words. Recommended: the prompt's, plus `merge` for the diamond; `final|end` gives `activityFinal` (the bull's-eye);
   applied only to a class that takes Node by inheritance, after the binder.
4. The guard. Recommended: every non-empty guard as `[guard]` (a second document, `exists` and priority 1); no `isKind` path.
5. The preselection. Recommended: `flowchart` and a Custom binding without Trigger → Activity (UML); `stateMachine` → Statechart
   (UML); `extendedStateMachine`, `dfa`, `nfa`, `moore`, `mealy` and a Custom one with Trigger keep State machine.
6. The flows. Recommended: the Flowchart's orthogonal router (no `curve`), 1 px ink, the open arrowhead (R-VP-25).
7. The list. Recommended: `activityUml`, «Activity (UML)», after Flowchart (ISO 5807), before ER (Chen), on `flowchart`.

## 1. Layer Impact Report (written before the first source edit)

Base: R-B9, R-IRN-32, R-IRN-33, Rule 11, R-VP-15..25, the A1+A3, A4 and A2 reports. Read: `irTypes.ts:15-60, 183-300, 512-540`,
`irCompile.ts:148-230, 600-630`, `irReadCtx.ts` (whole), `irReadCtxLproxy.ts` (whole), `pathExpr.ts` (whole), `irStyle.ts:95-215`,
`shapeRegistry.ts:265-330, 440-560, 660-700`, `markerRegistry.ts:50-125`, `notationCatalog.ts:93-108`, `nodes/nodeSizing.ts` (whole),
`useContentSize.ts:95-250`, `IRNodeContent.tsx:415-425, 489-570`, `derive/notations.ts` and `derive/viewpointDerivation.ts` whole,
`sim/DeriveViewpointDialog.tsx` whole.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)   -- no code; new documents over keys whose render is already pinned
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the saved IR and _state values only; no new key, no VersionFixer, no jsxString
```

**Persistence (the saved `DViewElement.ir` and the derived viewpoint's `_state`).**
- What changes: new values of existing keys, permanent once saved (R-B9): `_state.derivedNotation` and `ir.generated.notation`
  gain `activityUml`; `derivedRole_<classId>` and `ir.generated.role` gain `decision`. The documents of Activity (UML) are new.
- What does NOT change: every IR key and its vocabulary, `irVersion` (R-IRN-32), the documents of the eight existing notations
  (baseline below), the simulation binding (read, never written, R-VP-21).
- Cross-layer: none; the documents are read by the compile, the index and the renderers as every derived document is.
- Safety: no validator rule changes; every new document passes `validateIR` (tested).

**Canvas v2-flow.** No file of the canvas changes. What the new documents ask of it is already rendered and pinned: a
`defaultSize` box (A2), the `bar`, `circle`, `diamond` forms, the `dot` marker in the border colour (R-VP-17), `cornerRadius`
(R-IRN-35), a label template in the halo style (C2), a predicate with priority on an edge document (A3's yes/no, A2's weight).

**Behaviour change outside the documents.** The dialog's preselection for a stored `flowchart` or `stateMachine` binding
(DemoFlowB and DemoPEST once their roles are applied): what the demo opens on, accepted by Alfonso on 2026-09-30 (the prompt).

Smoke-test scenarios potentially affected:
- the four demo scenes in the default viewpoint, 0 px from the A2 tip's shots (`_tmp_a2_crops/a2_*_default_first.png`);
- DemoFlowB derived as Activity (UML) and as Flowchart (ISO 5807); the latter's documents unchanged;
- the dialog on DemoFlowB and DemoPEST with their binding applied: Activity (UML), Statechart (UML).

## 2. Hypotheses and verdicts
| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The notation needs a new IR key | **falsified** | every rule maps to an existing key (§3); `GeneratedProvenance` holds `notation: string; role?: string;` (`irTypes.ts:514-515`), so the two new values need no type change [R] |
| H2 | The fork/join bar can be 5 px thick | **falsified** | `const w = defaults.width !== undefined ? Math.max(SHAPE_MIN_SIZE, defaults.width) : undefined;` (`nodes/nodeSizing.ts:73`), `SHAPE_MIN_SIZE = 24` (`:19`); an axis left out is derived, at least `BAR_SIZE = { w: 48, h: 12 }` (`shapeRegistry.ts:312`, `BAR_SIZING` `:319`): upright 48 wide, flat 12 high [R] |
| H3 | The bar can follow the flow | **falsified** | `defaultSize?: { width?: number; height?: number };` (`irTypes.ts:538`) is per view, not Conditional; the predicate ops read slots, kinds and the marking (`irTypes.ts:24-48`), no geometry [R] |
| H4 | The initial can be a 20 px disc | partly | the same floor: 24 px, a circle keeping its aspect (`nodeSizing.ts:75-78`); the wrapper's 1 px border leaves 22 visible (A2 §6, places 44 → 42) [R] |
| H5 | The bull's-eye inner disc can be 14 of 24 | **falsified** | `dot: { id: 'dot', label: 'Dot (final state, token)', paths: [{ d: 'M34,50 A16,16 0 1,0 66,50 A16,16 0 1,0 34,50', fill: true }] },` (`markerRegistry.ts:83`): 32% of the box; no larger filled disc in the registry (`:50-125` read whole) [R] |
| H6 | The action's radius 14 draws | partly | `return Math.min(r, Math.min(w, h) / 4);` (`shapeRegistry.ts:490`): 11 on a 44 px box [R] |
| H7 | «An edge leaving a decision» is a predicate | partly | `isKind` takes a `path` (`irTypes.ts:30`) and compares only a string: `return typeof target === 'string' ? ctx.isKindOf(target, cls) : false;` (`irCompile.ts:193`); the default backend returns `slot.value` (`irReadCtxLproxy.ts:28`), and «lproxy .value on a reference yields a name/proxy, not the pointer id» (`:44-45`); `irCompile.ts:221` names it «the defect isKind's path branch has» [R] |
| H8 | DemoFlowB guards sit only on edges leaving the decision | holds | the export: `f3 d1 → work [model.[count] < 2]`, `f4 d1 → fk [model.[count] >= 2]`, the other seven flows `guard []` (`_tmp_actuml_facts` run, below) [M] |
| H9 | A Decision role is in the role catalogue | **falsified** | the A1+A3 report, question 2; the flowchart binder on DemoFlowB binds node, initial, terminal, transition, fork, join, and `activityFinal` «No concrete subclass of ActivityNode named like Activity final» [M] |
| H10 | DemoPEST and DemoFlowB open on the siblings today | holds | `petri: 'petriClassic', flowchart: 'flowchart', stateMachine: 'stateMachine', extendedStateMachine: 'stateMachine',` (`notations.ts:146`); the exported DemoFlowB bag is `{}`, so it opens on Generic until Apply writes one [M] |
| H11 | The dialog's source must change for the entry | **falsified** | `{DERIVED_NOTATIONS.map(n => <option value={n.id} key={n.id}>{n.label}</option>)}` (`DeriveViewpointDialog.tsx:94`); the preselection is `initialNotation` (`:178`) [R] |
| H12 | The derived box of the Decision class is a node today (no role of its own) | holds | Flowchart: Activity and Decision inherit `node` from ActivityNode (`notations.test.ts:538-545`), so an own `decision` entry changes only the notation that offers it [R] |

**Measures of this phase** [M]:
- The flowchart binder on the DemoFlowB export (`frontend/scripts/smoke/_tmp_actuml_facts.ts`, gitignored): `node` ActivityNode,
  `initial` InitialNode, `terminal` FinalNode, `transition` ControlFlow, `source`/`nextState` `source`/`target`, `fork`, `join`,
  `guard` ControlFlow.guard, `action` effect; prefill `from: 'signals'`; `initialNotation` `generic` (empty bag).
- Positions of the export (DVertex `x, y`): `i0 (50,50)`, `work (470,50)`, `d1 (890,50)`, `fk (50,350)`, `left (470,350)`,
  `right (890,350)`, `jn (50,650)`, `fin (470,650)`: `fk`'s three edges and `jn`'s three all run from the right side.
- Baseline of the documents: `_tmp_actuml_dump.ts --out base`, every notation × every metamodel of the seven decoded exports,
  provenance stripped, 72 lists; byte-identical to the A2 lane's `_tmp_a2_docs_after.jsonl` (`cmp` exit 0).

## 3. What A1, A2, A3 and C2 give for free
| Rule of the prompt | Key, as already rendered | Source |
|---|---|---|
| 1 Initial, filled circle 20 | `form: 'circle'`, fill and border `var(--color-inode-name)`, `labels: []`, `defaultSize` 20×20 | A2 (`defaultSize`), R-VP-17 (nameless) |
| 2 Action, rounded 14, height 44, name 13/500 | `form: 'rounded'`, `cornerRadius: 14`, `defaultSize: { height: 44 }` (width from content, at least 140 by `BOX_SIZING`), `centredName(13, 'medium')` | R-IRN-35, A3 |
| 3 Decision and merge, hollow diamond 36 | `form: 'diamond'`, white, 1 px ink, `labels: []`, `defaultSize` 36×36 | A3, A4 (diamond) |
| 4 Fork and join, bar | `form: 'bar'`, fill and border in the ink, `labels: []`, `defaultSize` 5×120 | R-VP-16 (`bar`), A2 |
| 5 Activity final, bull's-eye 24/14 | `form: 'circle'`, white, 1 px ink, `marker: 'dot'` (drawn in the border colour, `IRNodeContent.tsx:495`), `defaultSize` 24×24 | R-VP-17 |
| 6 Control flow, open head, `[guard]` | the Flowchart's edge, `targetEnd: 'openArrow'`, 1 px ink; a second document, `predicate: { op: 'exists', path: '$guard.value' }`, `priority: 1`, `labels.template` `[` + guard + `]` in the C2 style | R-VP-25, A3 (yes/no), C2 |

The two documents per flow are needed because a template drops only the literal *before* an empty value (`irCompile.ts:625`,
«A literal right before an empty value is its caption»): with one document an unset guard would still draw `]`.

## 4. Files and lines per change (Phase 2)
1. `viewpoint/derive/notations.ts`: `'activityUml'` in `DerivedNotationId` and `DERIVED_NOTATIONS` (after `flowchartIso`, profile
   `flowchart`, `nodeLabel: 'Action'`, optional `extraRoles: ['decision']`); `ActivityRoleId`, `NotationRoleId` widened;
   `notationRoles` appends `extraRoles`; `roleLabel` names `decision`; `dialogPrefill` adds the name signals for the notation;
   `PROFILE_NOTATION` and the Custom case (`:145-158`); `derivationRolesOf` passes the notation (`:259`).
2. `viewpoint/derive/viewpointDerivation.ts`: `DerivationRoles.notation` gains `'activityUml'`; `activitySignalRole(name)` beside
   `ISO_FORMS`; `deriveActivityViewpointIRs` over the Flowchart documents; `deriveViewpointForBinding` dispatches it.
Tests: `notations.test.ts`, `erChen.test.ts`, `DeriveViewpointDialog.test.ts` (the list of nine), a new `activityUml.test.ts`. Rule 19:
2 source files, 4 test files, docs; all in the prompt's DOVE; no §3.1 file edited.

**Pins that move, predicted before any edit** [R]: none of the documents. The tests that name the list or the preselection:
the list (`notations.test.ts:175`, `erChen.test.ts:270-271`, `DeriveViewpointDialog.test.ts:57-67`); the `DEMOS` column (DemoPEST
`statechart`, DemoFlowB `activityUml`); `every system profile names one notation`, the Custom and user-profile cases, `DemoPEST and
DemoFlowB still open on the siblings`, A1's `a stored binding still opens the dialog on the sibling`; the tests that derive
`defaultChoice` and read Flowchart's table (the default-choice digests, `Activity and Decision are FlowB nodes`); the corpus filter of
`erChen.test.ts:253`, which would otherwise take the new notation into the A4 pins.

## 5. Files read (under `/Users/alfonso/jjodel-w-notations/`)
`CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, `docs/decisions.md` RC-20..34 and
R-VP-15..25, `docs/discovery/discovery_2026-09-30_a1_a3_notations.md` and `discovery_2026-09-30_a2_petri_classic_open_arrows.md`
whole, `docs/log-inbox/views.md` (the A1..A2 entries and tickets), `docs/sessioni/sessione_2026-09-30.md:11-25`; the windows of §1;
`frontend/src/components/editor-v2/viewpoint/derive/__tests__/notations.test.ts` whole, `erChen.test.ts:136-290`,
`sim/__tests__/DeriveViewpointDialog.test.ts` (the notation lines); `frontend/scripts/smoke/_tmp_a2_probe.ts`, `_tmp_a2_dump.ts`,
`_tmp_a2_bench.mjs` (whole), `_tmp_a1a3_crops/a1a3_flowB_flowchart.png`. The design canvas
`https://claude.ai/artifact/2zcZ84EkYUUq7ZhMqVJFKg` was not readable from this session (the docs connector answered «not shared
with you»); the six rules of the prompt's COSA are the specification used.
