# Discovery 2026-11-08 — DCN L4.5: run wiring of the DCN nucleus

Prompt: P-2026-11-08-0248 (chat C-2026-11-06-2159), lane full, worktree `~/jjodel-w-dcn-l45`, branch `dcn-l45`.
Read-only phase; written before any edit.

## 1. Objective

`startRun` picks the DCN nucleus when the metamodel's bag binds the «Dynamic classification» roles
(R-SIM-47, R-DCN-8, R-DCN-11), the panel texts get DCN twins in `model/simulation/dcn/dcnPanelText.ts`, and a
drone run is checked in the app (crops 1-reset .. 4-flying).

## 2. Files read

- `frontend/src/components/editor-v2/sim/simBridge.ts`: `startRun` (725-798), `runSignature` (816), `haltMessage`
  (910, already has `unclassified` and `ambiguous`), `candidateLabel` (951), `markingLine` (977), `markingChips`
  (1099), `defectsLine` / `defectsTitle` (1161-1178), `inputAsks` (1402), `runStatus` (1435), `lastStepText` (1489),
  `pressRandom` / `pressStep` (1536-1559), `playTick` (1578), `press` (1721-1763).
- `sim/simNucleus.ts` (`SimNucleus`, `petriNucleus`, `nucleusOf`), `sim/simRunState.ts` (the `nucleus` field, `configAt`).
- `model/simulation/dcn/`: `dcnRoles.ts` (`dcnStcFromRoles`), `dcnCompile.ts` (`compileDcn`, `DCN_TICK_EVENT`,
  `DcnEntry`, `DcnSlot.dormantOwner`), `dcnHandles.ts` (`readDcnModel`, `bindDcn`, option `upper`), `dcnStep.ts`
  (`readDcnStep`, `dcnNucleus`, `DCN_SYNC_SELECTOR`, `DcnNucleus.candidates`, `classify`).
- `components/editor-v2/problems/dcnToProblems.ts`: `dcnInputOf(lookup, modelId)` already builds the compile input
  (stc through `runBag`, the fitting R-OI binding, `dcnReadView` over the raw lookup, `DcnFeatures` by `Class.feature`).
- Callers: `SimulationPanel.tsx` (view memo 533-596, Reset 599-654, choice list 1163, Marking chips 1232-1241,
  Events 1244-1272, the gate `rolesComplete` 441-443, `eventSigOf` 1558), `simRoleStatus.ts` (`missingEngineRoles`
  154), `simLabels.ts` (`stateHeading`, `headedStateLine`), `simScenarios.ts` (80-88), `SimInspector.tsx`
  (`traceStepText`, 418), `simBoard.ts` (177), `problems/simCheckToProblems.ts` (174, calls `startRun`).
- The export `~/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel`, decoded (lz UTF-16): the metamodel bag holds
  `simProfile=dynamicClassification`, `ontoBindings` and the eleven dcn keys only; no `simInitial`, `simNextState`,
  `simOwnedTransitions`, `simEvent`, `simTrigger`.

## 3. Findings

F1. `startRun` refuses at `netStcFromRoles(bag) === null` (734). For a DCN-only bag this is the insertion point:
try `dcnStcFromRoles(bag)` there. Petri first keeps «both bound: Petri wins» with no new record and no new halt.

F2. The DCN compile input exists: `dcnInputOf` (dcnToProblems.ts:123) returns `{ stc, binding, view, features }`;
`compileDcn` needs `modelId` on top. Reusing it creates an import cycle `simBridge` ↔ `dcnToProblems` (the latter
imports `collectModelObjectIds`, `runBag`, `runSignature`); both sides use the other only inside functions, so ES
module evaluation order is safe. `readDcnModel` also wants `upper` (the feature id of a property's upper bound),
which `dcnInputOf` does not return; the drone fixture names it `MultiplicityElement.upper`.

F3. `press` (1738) and `playTick` (1584) compute candidates with `netStep.candidates(run.net, ...)`, not with
`DcnNucleus.candidates`. On a DCN run a press of `takeOff` with Flying's redefinition active would list two
candidates, the redefinition alone among them, and choosing it is `inadmissible` in the nucleus (dcnStep.ts:339).
The press must ask the DCN nucleus for its candidates (R-DCN-22).

F4. The text readers in the panel call `candidateLabel(run.net, ...)`, `markingLine(state, r.net, ...)`,
`markingChips(state, lookup)`, `defectsLine(run.net, ...)`, and `SimInspector`/`simScenarios` reach
`candidateLabel` through the net too. A registry keyed by the DCN run's net (`WeakMap<CompiledNet, ...>`, set by
`startRun`) lets these functions call the DCN twins without a change at their call sites. `markingChips` has no net
parameter: an optional third one is needed, and the panel would pass `r.net` (one line).

F5. **The panel never reaches a DCN run.** `SimulationPanel.tsx:443` `rolesComplete = missingEngineRoles(roles) ...`
reads the Petri/control-flow engine roles only (simRoleStatus.ts:154-164); with the drone's bag it lists
«Initial or Initial marking, Owned transitions or Source, Next state», so the panel shows «Simulation not
configured» and no Reset (gates at 534, 979, 991, 1081). Beyond the gate, the panel has no input for a DCN run:
the Events row is built from `eventSigOf` (Petri `netStcFromRoles` and the event role), so neither the tick
(`DCN_TICK_EVENT`) nor an invocation (`takeOff` on `dji`, triggered by its own transition id) has a button, and ε
has no DCN candidate. Making the panel run the drone needs the gate, an inputs row for the DCN alphabet, and the
chip line: more than «a row added or renamed». By (3) of the prompt this is a stop with Outcome: question.

F6. `compileDcn` gives the initial σ of a slot with no value the feature's default, else the least value of its
domain with an `initial` declaration defect (dcnCompile.ts:289-294). The drone's empty slots (`power`, `vmax`,
the sensor slots) therefore read 0 / the first literal at Reset with one `initial` defect each, and no halt. The
nucleus classifies after a fired step only; Reset sets `halt: null` and does not classify σ0.

F7. `simCheckToProblems.reconcileSimCheckProblems` calls `startRun` and publishes `compileDefects` and
`run.net.defects`. A DCN run that returns `compileDefects: []` and a net with `defects: []` publishes nothing, as the
refused run did: no new node problems. The DCN declaration defects go to the panel's line through `dcnDefectsLine`.

F8. Not a critical-zone file: `sim/` and `model/simulation/dcn/` are not in CLAUDE.md §3.1; `problems/` is, and
is only imported, not edited.

## 4. Insertion points

- `simBridge.ts` `startRun` 733-734: `if (!stc) return startDcnRun(...) ?? refused`.
- `simBridge.ts`: `dcnRuns = new WeakMap<CompiledNet, DcnRunText>()`, `dcnRunOf(run)`; dispatch at the top of
  `candidateLabel`, `markingLine`, `markingChips` (optional `net`), `defectsLine`; `press`: `runCandidates(run, ...)`
  and `lastStepText` → `dcnLastStepText`; `playTick` 1584 → `runCandidates`.
- New `model/simulation/dcn/dcnPanelText.ts` and its test.
- `SimulationPanel.tsx`, `SimInspector.tsx`, `simBoard.ts`, `simScenarios.ts`: no edit in this lane (F5).

## 5. Risks

- R1 the import cycle of F2; covered by the simBridge test importing the module under node.
- R2 `simCheckToProblems` now compiles the DCN net on each reconcile of a DCN model (cost only).
- R3 `simScenarios.ts:86` checks a scenario's choice against `netStep.candidates`: a scenario recorded on a DCN run
  that names an invocation with a redefinition would read «not offered» for the redefinition id only; scenarios
  record the selector the nucleus accepted (the static operation's id), which `netStep.candidates` also lists. Left.
- R4 the tick label of the prompt names no instance: two instances of one static class give two equal labels.

## 6. Open questions

- Q1 (outside the line budget of (3), F5): the panel gate and the DCN inputs row. Stop with Outcome: question after
  the in-scope work. Recommended: one lane that sets `rolesComplete` from either role set, adds a DCN inputs row
  (Tick plus one button per invocation, labelled by `dcnCandidateLabel`, from `run.alphabet`), passes `r.net` to
  `markingChips` and reads the heading «Classification» for a DCN run.
- Q2 (in DOVE, decided): Reset does not classify σ0 (F6); the line shows `unclassified` where it is.
