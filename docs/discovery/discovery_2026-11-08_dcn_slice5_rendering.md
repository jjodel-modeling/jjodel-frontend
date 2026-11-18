# Discovery: DCN slice 5, run-time rendering, snapshot, coherence watches

- Prompt-ID: P-2026-11-08-1742
- Prompt file: `docs/prompts/claude_2026-11-08_1742_prompt_dcn_s5_discovery.md`
- Chat: C-2026-11-06-2159. Session: 69a9e6bd-c793-4372-9d96-18a00b92d258
- Tree: `~/jjodel-w-dcn-s5d`, branch `dcn-s5d`, HEAD `f51593d7c` (the commit that adds the prompt), clean at start
- Executor model: Claude Opus 5.5 (`claude-opus-5-5`)
- Read-only phase: no edit under `frontend/`, no probe run, no server. Every claim below is **read** on `f51593d7c`
  unless tagged **measured**; the only measurements are grep and Python string counts run in this phase.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

R-DCN-25..28 are not in this branch's `docs/decisions.md`: `dcn-l47` does not contain `2df3c9a32`
(`git merge-base --is-ancestor 2df3c9a32 HEAD` exit 1, **measured**). They were read from
`git show 2df3c9a32:docs/decisions.md` lines 7805-7819. Lane-run's «not found: R-DCN-25..28» has that cause.

## Objective

Answer A-D of the prompt: where a DCN run's state can be painted on the object diagram without writing the model
(R-DCN-25, R-DCN-26), how a snapshot becomes a new M1 model (R-DCN-27), how coherence constraints plug into watches
(R-DCN-28), and which lanes deliver them.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|-----------|---------|
| H1 | The overlay can be fed by a selector over the run, write nothing, and touch no §3.1 file | Holds (§A) |
| H2 | The drone's instance node has slot rows that can be greyed | Falsified on today's fixture (§A.2) |
| H3 | A snapshot can reuse `createM1` and `instantiate` | Falsified for both as they stand (§B) |
| H4 | `CoherenceConstraint` is ready to read in the drone | Partly: M2 classes only, no object, no role (§C.2) |
| H5 | The watch pipeline can already evaluate a DCN constraint per instance | Partly: `evaluateOutput` can, `readWatches` does not ask it (§C.1) |

## Files read (windows, not whole files, unless said)

`frontend/src/components/editor-v2/`: `sim/SimNodeRunState.tsx` (whole), `sim/simCanvasState.ts` (whole), `sim/simRunState.ts`
60-289, `sim/simBridge.ts` 825-909, 942-958, 1738-1900, `sim/SimulationPanel.tsx` 1352-1372, `sim/simNodeRunState.scss` 6-14, 132-150,
`nodes/ObjectNode.tsx` 272-301, 625-719, 930-1006, 1340-1445, `nodes/nodeSizing.ts` (whole), `viewpoint/ir/IRRow.tsx` (whole),
`viewpoint/ir/IRNodeContent.tsx` 360-387, 770-859, `hooks/instantiate.ts` 165-200, 770-817, 950-989, `hooks/createAdapter.ts` 485-500,
`EditorV2.tsx` 1076-1112, 1296-1312, `CLAUDE.md` 1-40.
`frontend/src/model/simulation/`: `dcn/dcnStep.ts` (whole), `dcn/dcnHandles.ts` 1-135, `dcn/dcnCompile.ts` 78-124, 249-372,
`watchEvaluator.ts` (whole), `boardOutputs.ts` 205-246.
Others: `frontend/src/redux/reducer/reducer.ts` 1125-1169, `frontend/src/model/logicWrapper/LModelElement.tsx` 5018-5031,
`frontend/src/components/project/ProjectEditor.tsx` 1636-1648, 1760-1835, `frontend/src/pages/components/Navbar.tsx` 110-128,
`frontend/scripts/probe/dcn-drone-fixture.ts` 1-62 and grep hits, `frontend/scripts/probe/uml-class-object-fixture.ts` 445-460,
`docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md` 70-97, 140-163, `docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md` 64-93,
`docs/log-inbox/dcn.md` 333-418, `docs/discovery/assets/dcn-drone/dcn-drone-objects-light.png`, `~/.jjodel-lanes/P-2026-11-08-1652/crops/1-reset.png`.

Sections A-D were written by the chat C-2026-11-06-2159 from the lane handoff (the lane stopped at the context ceiling before saving them); the evidence and line references are the lane's, read on f51593d7c, not re-verified.

## A. Overlay (R-DCN-25/26)

- Pattern R-SIM-3: `SimNodeRunState` mounted on all three branches, `nodes/ObjectNode.tsx:1003, 1242, 1442`, fed by `useSimVersion()`, paints `getSimNodeState`. Quote `sim/SimNodeRunState.tsx:17-20` «Mounted as a SIBLING of the node wrapper, inside `.react-flow__node` ... Absolutely positioned and `pointer-events: none`, so the node keeps its size, its handles and every gesture.»
- Object id: `state.idlookup?.[id]?.model`, `ObjectNode.tsx:278`. Shown step via private `shown()`, `sim/simRunState.ts:196-198, 260-266` (R-SIM-106). Per-record cache idiom, `sim/simCanvasState.ts:76-79`.
- A DCN run already paints: `origin: [instance, element]` `dcnCompile.ts:328`, σ keyed on instance `:305`, so the dashed ring and the changed-σ tags (`SimNodeRunState.tsx:77-80`) appear today.
- **H2 falsified.** Drone uses the default view (`dcn-drone-fixture.ts:13`); `OBJECT_VIEWS|UML object diagram|VP_OBJECT` counts 0 in both drone probes (measured, control `buildObjects` 3). Native branch draws `name`, `classifier`, `slots [7]` pills; every Slot and literal is its own node (`assets/dcn-drone/dcn-drone-objects-light.png`). No slot row on the instance node.
- With the UML object view (`uml-class-object-fixture.ts:447-453`) rows are `<IRRow childObjectId>` (`IRNodeContent.tsx:807-809`), segments opaque (`IRRow.tsx:36-39`), no slot id in the DOM. Both branches show M's value, not σ's. Cannot grey or show σ from outside without editing `IRRow.tsx`; R-SIM-4 keeps the IR out of the run.
- Data sources: `DcnNucleus.classify` `dcnStep.ts:93-97,106`; `model.instances.get(id).viewpoints` `dcnHandles.ts:72-73`; σ value `stateValueOf` `simCanvasState.ts:131-135`; `DcnSlot.dormantOwner` `dcnCompile.ts:103-107`; monitors = `compiled.entries` kind `tick`, instance, dynamicClass `:80-90`, tick has no precondition `:314` so an active class's monitors all run; links `DcnInstance.links` `dcnHandles.ts:74-75`.
- Gap: `dcnRunOf` private in `simBridge.ts:822-827` and simBridge imports simRunState; `classifyState` uncached and evaluates all instances `dcnStep.ts:192-220`.
- Path: new pure `model/simulation/dcn/dcnCanvasState.ts` (`dcnNodeStateOf`); the WeakMap moved from simBridge to a small module simRunState can read; `getSimDcnNode(objectId)` cached per shown record; card in `SimNodeRunState` + `simNodeRunState.scss`. Petri: null, unchanged.
- **Critical-zone files touched: none, no Layer Impact Report.** `sim/` and `model/simulation/dcn/` not in §3.1. Rejected: in-box compartment in `IRNodeContent.tsx`/`IRRow.tsx` (under `viewpoint/ir/`, §3.1).
- Sizing: card absolute, no box, handle, edge or layout shift. Collides with `.sim-node-run__tags` (`top: calc(100% + 6px)`, `simNodeRunState.scss:132-140`): must share a column. In-box option vs R-OI-16: hugging box moves handles and edges at each Reset/Stop; a `defaultSize`/manual box clips (`instanceNode.scss:27` overflow hidden); the grow-only remedy is a write a run may not do. Size persistence gated on `ch.resizing` `EditorV2.tsx:4864`; other routes from auto `dimensions` not traced (recommended path produces none).
- Risks: ring lit on nearly every instance; static slots keep M's value; card occludes (Slot nodes about 117 px below dji in the screenshot); no tooltips (`pointer-events: none`).

## B. Snapshot (R-DCN-27)

- **Key finding:** R-OI is one model: the M1 `drone` holds class level and instance level (`dcn-drone-fixture.ts:13`, minimap of the screenshot). `classifier` targets live in the same model, so instances alone have no classifier in a new model.
- Model: `DModel.new(name, mm, false, true)` `LModelElement.tsx:5018-5030`, collisions suffix ` (n)` via `uniqueModelName` `model/nameLookup.ts:78-87` (pool: every DModel). So «drone (snapshot step 21)» taken twice gives «... (1)»: acceptable. `createM1` is forbidden (Rule 21, comment `ProjectEditor.tsx:1641`), and it opens a tab. Sequence to mirror: `ProjectEditor.tsx:1768-1805` (DModel.new, DGraph.new with `Constructors.DGraph_makeID`, `project.models +=`, root `graphs +=`, `project.graphs +=`).
- Instances: `createInstance(modelId, className, ownerId, childKey, seed)` `hooks/createAdapter.ts:491`, returns a real id (`instantiate.ts:966-971`). `instantiate` synthesizes slots from defaults for one classifier: wrong shape, no σ values. No model copy exists: `duplicateModel|cloneModel|copyModel` 0 files (measured; control `DModel.new` 11 files, same command); no `get_duplicate` in LModel or LObject (grep lines 1086..4878 only, LModel starts 5137, LObject 6153).
- Links: in the drone a link is an `InstanceValue.instance` in a slot; the `link` record is «judged by checkBindings and not stored» (`dcn-drone-fixture.ts:16-17`). UML fixture also has link instances (`IS_LINK`, `:445`). A generic two-pass copy covers both: create all objects via `collectModelObjectIds` (`simBridge.ts:150`) in containment order, then write references with `.values = [id]` and attributes `.value` (`model/CLAUDE.md` §9.3), then σ over attribute literals. σ holds the first target only for links: copy links from M, never from σ. A slot in σ with no Slot object (default-seeded) needs one created.
- Undo: `history.beginUndoGroup()`/`endUndoGroup()` `reducer.ts:1148-1169`, used by `instantiate.ts:797-805`; end only after the last write landed (`seedLanded`, `layoutLanded`, deadline `INSTANTIATE_DEADLINE_MS`) because the store sends on a timer. Not a TRANSACTION, so Rule 12 is respected; do not wrap DVertex.new/DVoidEdge in TRANSACTION.
- Run unaffected: `runSignature` reads only modelId's objects and config `simBridge.ts:942-958`, so a new model does not stale the run. Layout: copy positions or let the sync lay out on open (not traced).
- Gesture: button in the transport row after Stop, `SimulationPanel.tsx:1362`; only for a DCN run; σ of the shown step (`getSimView ?? trace.length`, so N matches the slider); disabled while Playing and while a snapshot is in flight.
- Layer: new D-layer objects and possibly DVertex: Rule 20 and §3.2, Layer Impact Report and go-ahead for the write lane.

## C. Coherence (R-DCN-28)

- No `WatchHit` type exists; `isWatchHit` `watchEvaluator.ts:72` and `WatchResult` `:46`. Pipeline: `_state[RUN_WATCHES_KEY]` → `runWatchesOf` `simBridge.ts:1790` → `watchResults` `:1805` → `playPress` stop `:1741+`, `keptHits` per config `:1812`, `watchHitLine` `:1845`, modal `SimWatchesModal.tsx`.
- **H5 partly.** `evaluateOutput` already takes `dcn?: { binding, self? }` «a watch per instance, spec §7» (`boardOutputs.ts:209-229`), callers `simBoardFace.ts:317` and `watchEvaluator.ts:62` never pass it (measured). So a user watch on a DCN run has `self` the root, no named handles, no `.in()`. `compileOutput(text, scope, options?)` `:100` takes `SubsetOptions`, `dcn` mode exists `subsetChecker.ts:104-113, 406, 422`. `bindDcn` exported, gives `selfOf`, `named`, `classification`.
- **H4 partly.** M2 only: classes and features `dcn-drone-fixture.ts:96-97, 128-129, 154-157`; `dcn-drone.json` hits are all under `/metamodel/` (measured). No `CoherenceConstraint` object in the fixture. No role: `coherence|Coherence` count 0 in `roleCatalog.ts`, `dcnRoles.ts`, `dcnCompile.ts`, `dcnToProblems.ts` (measured; control `monitor` 4 in roleCatalog). Must add: roles (constraint class, context ref, pointwise, pattern, the two pattern classes' fields), profile, `dcnStcFromRoles`, fixture objects, fixture role binding.
- Spec: `CoherenceConstraint { context: StaticClass; pointwise: Expression[0..1]; pattern: TrajectoryPattern[0..1] }`, `BoundedPersistence { condition; k }`, `BoundedResponse { trigger; response; k }` (spec:78-86); order after classification checks, «violation reported as a watch hit» (:142-145); φ state invariant, ψ counter automaton per instance; «Step back, scenarios and the slider work on σ unchanged» (:152-153). Exact k semantics are not in the spec or foundations report (grep `at most k|within k|consecutive` no hit, measured): SoSyM needed.
- Plug-in: compile at `startDcnRun` onto `DcnRunText`, per instance whose classifier closure includes `context`; φ reads `evaluateOutput(out, snapshot, net, state, {binding: bindDcn(...), self})`; counters NOT in σ: pure fold over configurations, cached `WeakMap<NetConfiguration,...>` (as `keptHits`), so step back and `configAt` replay work; append to `watchResults` so Play stop, hit line and timeline work with no panel change. Results shaped as `WatchResult`, kind `invariant`, name `<constraint>@<instance>`. A hit: Play stops, panel hit line, timeline tick; optional marker on the card.
- A defect in a constraint expression: as for watches, shown, never a run error.
- Static check of the expressions would be in `problems/` (§3.1): separate lane, go-ahead.

## D. Lanes (one commit each)

0. Fixture viewpoint `UML object diagram` on the drone, exports regenerated. `dcn-drone-fixture.ts` (importing the UML fixture sets GV_OUT, so copy the views). Probe: fixture. No crit.
1. `dcn/dcnCanvasState.ts` + test, bench. No crit.
2. Registry module, `getSimDcnNode`, `simBridge`, `simRunState` + tests. No crit.
3. Card: `SimNodeRunState.tsx`, `simNodeRunState.scss`, tokens if new. Probe `dcn-drone-run.ts`, crops Charging, Flying (pills, grey `chargeRate`, monitor icon), step back. No crit.
4. Pure snapshot plan `sim/simSnapshot.ts` + test (create order, reference remap, σ overrides). No crit.
5. Snapshot write + undo group. **Layer Impact Report and go-ahead.** Probe: name, one undo removes all, original byte-equal, `runSignature` equal, reopened object diagram.
6. Panel button, enabled state. `SimulationPanel.tsx`. Crop.
7. Coherence roles: `roleCatalog.ts`, `dcnRoles.ts`, `simProfiles.ts`, tests. No crit.
8. Fixture: constraint objects (φ, each pattern), role binding, exports. Probe.
9. `dcn/dcnCoherence.ts` (φ, counters) + test, bench. No crit.
10. Wiring into `startDcnRun`, `watchResults` + `simBridge.test.ts`. Probe, crop of the hit line.
11. (optional) W1 of constraint expressions, `problems/dcnToProblems.ts`. **Go-ahead (§3.1).**

Tickets: bare argument `rate`: before lane 9, in `actions` ctx `dcnStep.ts:291`, with test. Multi-valued non-link title: `dcnCompile.ts` σ holds the first value (`dcnPanelText.ts` chips), small lane after 3. Render test: no `@testing-library` or `jsdom` in `package.json` (measured), panel imports fail at `window` in bench: Rule 4 approval needed, otherwise probe assertions in `dcn-drone-run.ts`.

## Open questions

1. Which view for the object diagram of the run? Recommended: add the UML object viewpoint to the drone fixture; the card works on either.
2. Do static slots show σ during a run? Recommended: the card also lists static slots whose σ differs from Reset, node rows stay M.
3. Snapshot copies the class level too? Recommended: yes, a full copy, because R-OI keeps classifiers in the same model and the snapshot then opens and runs alone.
4. Are k steps counted per trajectory step or per Tick? Recommended: per committed step, checked against SoSyM Definition before lane 9.
5. Snapshot on Petri runs? Recommended: no, R-DCN-27 is DCN only.
6. Keep the dashed ring on DCN instances? Recommended: suppress it when the card is shown.
7. Panel render test? Recommended: no new dependency; probe assertions hold it.

