# Discovery — simulation step 3b, the panel and the run-state on the Petri core

**Prompt-ID**: `P-2026-09-25-1103` (chat `C-2026-09-25-1030`)
**Prompt file**: `docs/prompts/claude_2026-09-25_1103_prompt_sim_step3b_discovery.md`
**Session**: `b2bac111-c812-4472-bb7b-d50c709ed107`
**Tree**: `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, HEAD `e3c0c6776` (the prompt commit on top of
`2b8475d24`). `pwd` and branch checked first. Working tree clean at the start and at the end.
**Executor**: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), as the session shows it.
**Type**: Phase 1, read-only. No source file modified. This report is a set of hypotheses with
evidence, not a reference: whoever uses it downstream re-reads the real files.
**Tags**: **[M]** measured in this phase (a run on HEAD `e3c0c6776`), **[R]** read, **[D]** deduced.
**Scratchpad artefacts** (not committed): the runtime probe `probe_sim3b_bridge.mts` on a dev server of
this worktree on port 3002, one run, ALL GREEN, 0 page errors (§13).

---

## 0. Summary

1. **The bridge is cheap at Reset and absent today.** No caller of `buildEvalContext` exists in the
   simulator; on the step 1 turnstile (pool 14) the whole bridge (context with `targetMetamodelId`,
   freeze, ids, `compileNet`, `compileGuard` per site) costs **3.0 ms median, 5.4 ms max**, 93% of it
   in `buildEvalContext`; on the turnstile grown to 74 objects, **15.3 ms median**. The status, the
   buttons and the candidate sets of every input cost **≤ 0.3 ms per render** **[M]** (§4.3).
2. **`targetMetamodelId` is needed on the M1 tab and measured again**: `getActiveMetamodel()` is
   `null` there, and with the id the pool holds the model's 14 objects **[M]**. `scopeBound: true`
   turns a missing metamodel into an empty pool instead of the first metamodel (`utils.ts:306`) **[R]**.
3. **The run-state keeps its canvas contract.** Every consumer outside `sim/` reads `isSimActive` or
   `useSimVersion` only; both keep their signature. `ObjectNode.tsx` and `viewpoint/ir/*` need no
   diff **[M]** grep with control (§5.3).
4. **`simReset` cannot keep its signature** (the prompt's hypothesis): a run needs a net, oracles and
   a baseline signature, not a list of ids. Proposed: same name, the run record as parameter (§5.2).
5. **R-SIM-13 signature measured on six edits.** `buildValidationSignature` misses a role write in
   the M2 bag and fires on an edit of another model; a run-scoped signature (sim keys + the run
   model's objects + the M2 part) gets all six right and costs ≤ 0.2 ms at 506 idlookup entries
   **[M]** (§6).
6. **The panel**: five statuses, one halt line per `HaltReason` kind, all inputs disabled in
   `Terminated`/`Deadlock`/`Halted`, and a candidate list after an input click when it has more than
   one candidate; random deferred to run mode (spec §6 wants a recorded seed) (§7).
7. **The M2 face grows from 9 to 20 keys.** `missingEngineRoles` becomes shape-aware with two
   disjunctions (control flow) and five keys (Petri); the 16-subset parity becomes a 4096-bag parity
   against `netStcFromRoles` (§8).
8. **Deletion**: 21 of the 27 tests of `step.test.ts` go and 6 `isKindOf` tests move or are
   rewritten; 24 of the 43 of `events.test.ts` go and 4 are rewritten; `netParity.test.ts` becomes a golden-trace test through the
   bridge and the store. Two coverage gaps would be lost if nothing ports them (§9.3).
9. **Phase 2**: about 15 files (10 modified, 2 deleted, 3 new), two code commits, a test plan with one
   mutation per rule, a definitive Layer Impact Report (§11, §12). The visual-check port is open:
   3001 serves `~/jjodel-release` today **[M]**.
10. **Baseline** on `e3c0c6776`: typecheck 14 (the §17 set), vitest 4623 passed with the 9 files red at
    import, build exit 0, `check:docs` 4/4, `check:scripts` 1 hit (`_tmp_sim1_verify.ts:186`) **[M]**.

---

## 1. Open questions for Alfonso

Recommendation first in each line; the section that holds the evidence in brackets.

1. **Interruption (R-SIM-13)**: withdraw the run (highlight gone, status `Not started`) and show one
   line, "Run interrupted: the model changed. Reset to run again."; not a sixth status, not a
   `Halted` that keeps a stale highlight (§6.3).
2. **Signature**: a new run-scoped signature in the bridge module, not `buildValidationSignature`
   as is (§6.2).
3. **Choice**: a candidate list shown after an input click with more than one candidate, the user
   picks; no random policy in 3b (§7.4).
4. **Store API**: keep the name `simReset` with a new parameter, the run record `SimRun` (new exported
   interface); `simApplyStep` replaced by `simCommit(modelId, outcome)`; new `getSimRun`; rule 11
   authorization for the `simReset` signature (§5.2).
5. **Bumps**: one on each Reset, on each `fired` or `halted` commit, on Stop or interruption of an
   existing run; none on discard, quiescence, inadmissible (§5.2).
6. **Bridge module**: new `sim/simBridge.ts`, pure over the lookup with the context builder injected,
   so the `targetMetamodelId` rule runs under the node bench; the context carries `scopeBound: true`
   (§4.2).
7. **Old types**: delete `SimConfiguration`, `StcRoles`, `StcDescriptor`, `StepLabel`, `SimRunStatus`
   (rule 11); leave `SimModelView` as is, its step-only members marked `// TODO: cleanup` (slimming
   it now touches two more test files) (§9.1).
8. **Homes after the deletion**: delete `step.ts`; move `eventAlphabet`, retyped on `NetStc`, into
   `netCompile.ts`; keep `stcFromRoles.ts` for the overlap functions only, not renamed (rule 2) (§9.1).
9. **Overlap refusal**: refuse any overlap when the event role **or** the Petri shape is declared; the
   warning path stays for control-flow bags without events (§8.3).
10. **M2 face**: four collapsible groups (General, Control flow, Petri net, Events), the shape line
    derived from `simArc`, Bound as a number input that writes a digit string (§8.1).
11. **Compile defects** shown after Reset as one warning line (first three, then "and N more"); the
    run still starts (§7.5).
12. **A "Last step" line** from `NetLabel` (fired, discarded, quiescence): yes, one line, so that a
    structurally enabled button blocked by a guard does something visible (§7.5).
13. **Keys of R-SIM-32** become definitive unchanged: no collision, no rename proposed (§8.1).
14. **Commits**: two code commits, `feat(sim)` for the panel, store and bridge, then `refactor(sim)`
    for the deletion; the types to be named in the GO (P6) (§11.3).
15. **Visual check port**: 3001 serves `~/jjodel-release` (pid 58802); check on 3002 from this
    worktree as in steps 1 and 3, or repoint 3001 (§11.5).
16. **File count**: 15 files, above rule 19's 5, listed in §11.1 for the GO.

---

## 2. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The six names `isSimActive`, `getSimActiveIds`, `simReset`, `simClear`, `getSimVersion`, `useSimVersion` keep their signature | **Partly**: five hold, `simReset` does not | a run needs net, oracles, halt and baseline; `simReset(modelId, activeIds: string[])` (`simRunState.ts:68`) cannot carry them (§5.2) **[R]** |
| H2 | `ObjectNode.tsx` and `viewpoint/ir/*` need no diff (step 3 report §4.3) | **Holds** | their only reads are `isSimActive(id)` and `useSimVersion()` (§5.3) **[M]** grep, control |
| H3 | The Reset bridge is cheap enough to run on every Reset | **Holds** | 3.0 ms median on the turnstile, 15.3 ms on 74 objects (§4.3) **[M]** |
| H4 | `buildValidationSignature` is the right interruption signature for the run | **Falsified** | misses a role write, fires on an edit of another model (§6.2) **[M]** |
| H5 | A vertex move (layout only) does not interrupt a run under either signature | **Holds** | x 890 → 927 landed, both unchanged (§6.2) **[M]** |
| H6 | `eventAlphabet` survives the deletion as it is (step 3 report §5.5) | **Falsified** | it takes a `StcDescriptor` (`step.ts:141`), a deleted type, and lives in the deleted file (§9.1) **[R]** |
| H7 | The overlap functions survive with `stcFromRoles` deleted | **Holds, with a move decision** | they read the bag, not the descriptor (`stcFromRoles.ts:77-129`) **[R]** |
| H8 | Deleting `step.test.ts` loses only old-step behaviour | **Falsified** | it holds the 6 `isKindOf` tests, the `classAncestry` parity among them (`step.test.ts:221-293`), and two checks no net test repeats (§9.3) **[R]** |
| H9 | A `simTerminal`-free bag runs on the new core | **Holds in the core, not in the panel** | `netStcFromRoles` builds it (`netCompile.test.ts:69`); the panel gates on `ENGINE_ROLE_KEYS` with Terminal (`simRoleStatus.ts:58`) **[R]** |

---

## 3. Objective and files read

Objective: the six questions of the prompt (bridge, run-state, interruption, panel, M2 face, deletion
and tests), with measured costs, the Phase 2 proposal and the definitive Layer Impact Report.

Read in full unless a range is given, all under `/Users/alfonso/jjodel-sim/`:

- `CLAUDE.md`; `docs/PROTOCOL.md`; `frontend/src/components/editor-v2/CLAUDE.md`
- `docs/prompts/claude_2026-09-25_1103_prompt_sim_step3b_discovery.md`;
  `docs/prompts/claude_2026-09-25_0935_fase2_sim_step3a_core.md`
- `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` (whole)
- `docs/decisions.md` 1254-1536 (R-SIM-1..33), 1606-1730 (R-MK-1..12), 3538-3548 (R-VAL-18)
- `docs/log-inbox/simulation.md` (the 3a entry and its Ticket); `docs/claude-code-log.md` 1-120
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §4.5, §5, §6, §7, §9, §10, §11
- `frontend/src/components/editor-v2/sim/`: `SimulationPanel.tsx`, `simRunState.ts`,
  `simRoleStatus.ts`, `simulation-panel.scss`, `__tests__/simRoleStatus.test.ts`
- `frontend/src/model/simulation/`: `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `types.ts`,
  `step.ts`, `stcFromRoles.ts`, `objectSlots.ts`, `isKindOf.ts`, `guardContext.ts`, `guardEvaluator.ts`;
  `subsetChecker.ts` 1-80 and its export list; `__tests__/netParity.test.ts` (whole);
  `__tests__/step.test.ts` 1-60, 180-331 and its test list; `__tests__/events.test.ts` 1-90, 355-549
  and its test list; `__tests__/netCompile.test.ts` 1-120 and its test list;
  `__tests__/netStep.test.ts` 1-121, 322-340 and its test list
- `frontend/src/components/editor-v2/problems/validationFreshness.ts`, `ValidationFreshnessSync.tsx`;
  `frontend/src/components/editor-v2/Toolbar.tsx` 700-752
- Callers of `buildEvalContext`: `frontend/src/jjscript/executor/commands/eval.ts` 1-60, 85-330;
  `frontend/src/jjscript/executor/utils.ts` 176-318; `frontend/src/jjscript/types.ts` 485-515;
  `frontend/src/components/Jodie/jodieJjelContext.ts` 20-50;
  `frontend/src/model/validation/validationContext.ts` 95-190
- Consumers of the marking: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` 262-276;
  `viewpoint/ir/irReadCtxLproxy.ts` 1-30, 55-66; `viewpoint/ir/irReadCtx.ts` 36-46, 140-156
- `frontend/src/components/editor-v2/EditorV2.tsx` by grep (the mount, `:4400`)
- `frontend/scripts/smoke/_tmp_sim1005_e2e.ts` 1-30 and by grep (to copy the role bag; not modified)

---

## 4. Question 1 — the bridge

### 4.1 Where the run is built today, and where the bridge goes **[R]**

| Step of Reset | Today | 3b | Existing call site |
|---|---|---|---|
| STC | `stcFromRoles(roles)` (`SimulationPanel.tsx:316`) | `netStcFromRoles(bag)` | `netCompile.ts:60` |
| Overlap check | `overlapVerdict(...)` (`:323-333`) | same, sorts extended (§8.3) | `stcFromRoles.ts:105` |
| Model ids | `collectModelObjectIds(lookup, modelid)` (`:335`) | same function, moved to the bridge | `SimulationPanel.tsx:129-143` |
| Context | none | `buildEvalContext(ctx, { extentModelId: modelid })` with `ctx.targetMetamodelId = lookup[modelid].instanceof` | `eval.ts:122` |
| Freeze | none | `freezeSnapshot(globals, { id: modelid, name })`; a `SimSnapshotError` refuses the run | `guardContext.ts:112` |
| Net | `initialConfiguration(stc, view, ids)` (`:335`) | `compileNet(stc, view, modelid, ids)` | `netCompile.ts:323` |
| Guards | none | `compileGuard(text)` once per guard site, text read by `simGuard` pointer | `guardEvaluator.ts:60` |
| Guard oracle | none | `(site, event) => evaluateGuard(compiled.get(site), buildGuardContext(snap, { transitionId: site }, { event }))` | `guardEvaluator.ts:88`, `guardContext.ts:152` |
| Action oracle | none | `() => ({ kind: 'ok', assignments: [] })` until the Action lane | type `netTypes.ts:197` |
| Store | `simReset(modelid, [...config.marking])` (`:336`) | `simReset(modelid, run)` (§5.2) | `simRunState.ts:68` |

Per input click, today `fire` (`SimulationPanel.tsx:349-357`): `const { label } = stepFlowchartBoolean(config, stc, view);`
then `simApplyStep(modelid, label.deactivated, label.activated);`. In 3b: `candidates(net, cfg, guards)`
(`netStep.ts:143`), the choice (§7.4), `step(net, cfg, selector, guards, actions)` (`netStep.ts:208`),
`simCommit(modelid, outcome)`. Status: `netRunStatus(net, cfg, alphabet, guards, halt)` (`netStep.ts:266`);
buttons: `structuralInputs(net, state)` (`netStep.ts:284`) gated by the status (§7.3).

**The context.** `getTargetMetamodel` (`utils.ts:295-318`): `if (context.targetMetamodelId) {` (`:299`),
then `if (context.scopeBound) return null;` (`:306`), then the active metamodel (`:309`), then
"Fall back to first metamodel" (`:316-317`). With the id and `scopeBound: true` a deleted metamodel
gives `null`, so `buildEvalContext` returns `{}` (`eval.ts:131-132`), the pool is empty and every guard
is a `no-handle` defect: a visible failure instead of a wrong pool. `scopeBound` is read in `utils.ts`
only at `:253` (`getDefaultParent`, not on this path) and `:306` **[R]** grep. The project id: the
validation pattern, `L.fromPointer(DUser.current).project.id` (`validationContext.ts:108-115`);
`getProject` falls back to it anyway when the id is empty (`utils.ts:194-198`).

**Guard text coercion.** `compileGuard(source: string | null | undefined)` (`guardEvaluator.ts:60`) calls
`text.trim()`: a non-string slot value (a number in a mistyped guard attribute) would throw. The bridge
passes `typeof v === 'string' ? v : undefined`, or a defect; the probe used the first **[M]**.

### 4.2 The adapter and the module

`NetModelView` (`netTypes.ts:106-109`) extends `SimModelView` (`types.ts:110-117`) with
`references(objectId, featureId)` and `values(objectId, featureId)`. The adapter, as the 3a tests
already build it (`netCompile.test.ts:39`, `rawView`) and as the probe ran it on the real lookup:

```ts
exists: id => !!lookup[id],
isInstanceOf: (id, c) => isKindOf(lookup, id, c),          // isKindOf.ts:26
outgoingTransitions: () => [], transitionTarget: () => null, // step-only members, never read by compileNet
references: (o, f) => objectReferences(lookup, o, f),      // objectSlots.ts:35
values: (o, f) => objectSlotValues(lookup, o, f),          // objectSlots.ts:20
label: id => objectLabel(lookup, id, stc.eventIdentifier), // objectSlots.ts:57
```

It replaces the proxy readers `outgoingTransitions` and `transitionTargetId`
(`SimulationPanel.tsx:151-175`) and `makeSimModelView` (`:186-209`).

**Proposed module** `frontend/src/components/editor-v2/sim/simBridge.ts`: pure over the raw lookup,
with the context builder injected, so the node bench runs it (the panel imports the joiner and does
not load there). Exports: `evalContextFor`, `makeNetModelView`, `collectModelObjectIds` (moved),
`startRun(lookup, modelId, configModelId, projectId, build)` returning the run or a refusal,
`runSignature` (§6.2), `haltMessage` (§7.2), `candidateLabel` (§7.4), `panelInputs` (§7.3). The panel
calls `startRun(..., buildEvalContext)`. Every name checked free:
`command grep -rnw <name> src scripts` from `frontend/`, 0 lines each for `simBridge`, `startRun`,
`evalContextFor`, `makeNetModelView`, `runSignature`, `haltMessage`, `candidateLabel`, `panelInputs`,
`simCommit`, `getSimRun`, `SimRun`; control `collectModelObjectIds` found at `SimulationPanel.tsx:129`
**[M]**.

### 4.3 The cost, measured on the turnstile of step 1 **[M]**

Dev server of this worktree on 3002, the turnstile built on `RowViewSmoke` exactly as the step 1 e2e
harness does (roles of `_tmp_sim1005_e2e.ts:18-22`), each phase timed in the page with the committed
code imported from `/src/`. `performance.now()` is coarsened in this Chromium: every figure is a
multiple of 0.1 ms, so 0 means below 0.1 ms.

| Model | Runs | Context | Freeze | Ids | Compile | Guards | **Bridge total** | Old Reset path | Status + buttons + candidates |
|---|---|---|---|---|---|---|---|---|---|
| Turnstile, no guard role (pool 14, idlookup 161) | 30 | 2.8 median, 4.4 first | 0.1 | <0.1 | <0.1 | 0 sites | **3.0 median**, 4.2 p90, 5.4 max | ≤ 0.2 | ≤ 0.3 |
| Turnstile, `simGuard` on 3 transitions | 30 | 2.8 | 0.1 | <0.1 | <0.1 | 0.7 first, <0.1 after | **3.0 median**, 4.0 p90, 4.6 max | ≤ 0.2 | ≤ 0.2 |
| Turnstile + 30-state chain (pool 74, idlookup 506) | 15 | 14.9 | 0.2 | <0.1 | 0.1 | <0.1 (32 sites) | **15.3 median**, 17.6 max | ≤ 0.1 | ≤ 0.1 |

Results of the compiled turnstile: 2 places, 3 transitions, 0 defects, Locked marked (the old path
marks the same one), status `Running`, ε disabled, coin and push enabled, candidates per input
`[ε 0, coin 1, push 1]`; with the guard role 3 sites compiled, 0 defective, 1 guard evaluated per event.
The grown model shows 1 defect, explained: the chain rewired Unlocked's `out` slot, so `tPushU` has
no owner and the transition role finds it without a source (`no-source`, `netCompile.ts:160`).

`buildEvalContext` is O(objects × features) with no cache (`eval.ts:197`, "PERF: O(objects × features)
per context build"): 0.2 ms per object here. Once per Reset it is negligible; per dispatch it would not be,
which is why the interruption uses a signature and never rebuilds the context (§6).

---

## 5. Question 2 — the run-state

### 5.1 Today **[R]**

`const configurations = new Map<string, SimConfiguration>();` (`simRunState.ts:22`); `store` deletes the
entry on an empty marking: `if (marking.size === 0) configurations.delete(modelId);` (`:36`);
`isSimActive` is `c.marking.has(objectId)` over every model (`:45-48`); `simApplyStep` applies a label
through `applyStepLabel` (`:91-97`); `simReset` bumps only when the content changed (`:68-78`);
`simClear` bumps only on a non-empty marking (`:100-104`).

### 5.2 The proposed shape

```ts
export interface SimRun {                      // new exported interface
    readonly net: CompiledNet;
    readonly config: NetConfiguration;         // config.event is always null in the store
    readonly halt: HaltReason | null;          // sticky until Reset (R-SIM-29)
    readonly guards: GuardOracle;              // closes over the frozen snapshot of this run
    readonly actions: ActionOracle;
    readonly alphabet: readonly string[];      // event ids at Reset
    readonly signature: string;                // R-SIM-13 baseline, taken on the lookup that was compiled
}
const runs = new Map<string, SimRun>();        // an entry per started run, kept with an empty marking
```

| Export | Today | 3b | Importers (tracked `src/`, non-test) |
|---|---|---|---|
| `isSimActive(id)` | `Set.has` | some run has `isMarked(state, id)` (`netStep.ts:41`, tokens ≠ 0) | `ObjectNode.tsx:40`, `:272`; `irReadCtxLproxy.ts:10`, `:21`, `:63` |
| `getSimActiveIds(modelId?)` | ids of the Set | places with tokens > 0; the no-argument union kept | `SimulationPanel.tsx:30`, `:294`, `:310`, `:353` (all three go) |
| `simReset(modelId, activeIds)` | new marking, bump if changed | **`simReset(modelId, run: SimRun)`**, bump always | `SimulationPanel.tsx:30`, `:336` |
| `simApplyStep(modelId, deact, act)` | label applied | **deleted**, replaced by `simCommit(modelId, outcome: StepOutcome)` | `SimulationPanel.tsx:30`, `:356` |
| `simClear(modelId)` | bump if marking non-empty | delete the entry, bump if an entry existed | `SimulationPanel.tsx:30`, `:255`, `:327`, `:342` |
| `getSimVersion()` | unchanged | unchanged | `simRunState.ts:117` only |
| `useSimVersion()` | unchanged | unchanged | `ObjectNode.tsx:271`; `SimulationPanel.tsx:235`; `irResolve.ts:89`, `:179`; `useIRContainment.ts:120`; `useIRFormView.ts:99` |
| `getSimRun(modelId)` | — | new | panel |
| `__resetSimRunsForTests()` | — | new (P11: module state reset in `beforeEach`) | tests |

Search: `command grep -rnw <name> src scripts` from `frontend/`, exit 0 for each, the definitions in
`simRunState.ts` found for all seven (control). Gitignored probes also call the store:
`scripts/smoke/_tmp_sim0_verify.ts:192`, `:220-236` (`simReset` with an array, `getSimActiveIds`,
`simClear`, `isSimActive`), `_tmp_sim1_e2e.ts:42`, `_tmp_sim1005_e2e.ts:44` **[M]**: they are
outside `tsconfig` (`"include": ["src"]`) and break at run time after 3b (§10, R6).

**Why `simReset` keeps its name.** Spec §9.4: "`simReset` is the restore primitive to generalise" for
step-back; the run record is exactly what a restore installs. Its parameter changes: rule 11
authorization (question 4).

**`simCommit(modelId, outcome)`**, one per step:

| Outcome (`netTypes.ts:243-247`) | Stored | Bump |
|---|---|---|
| `fired` | `config = next` | 1 |
| `halted` | `halt = reason`, `config = next` (σ unchanged, event consumed, `netStep.ts:224`) | 1 |
| `discard`, `quiescence` | nothing observable changes (`config.event` is `null` in the store) | 0 |
| `inadmissible` | nothing | 0 |

Reset bumps always (a new net, maybe a cleared halt: the old "identical reset is invisible" guard of
`simRunState.ts:62-67` would hide a halt cleared at an unchanged marking). Stop and interruption bump
once when a run existed. That is "one bump per committed step" (R-MK-6) with committed read as
"σ or the halt changed" (question 5).

### 5.3 The canvas contract does not move **[M]**

`command grep -rnw` of `isSimActive`, `useSimVersion`, `getSimVersion`, `getSimActiveIds`, `simApplyStep`,
`simReset`, `simClear` over `frontend/src` and `frontend/scripts`, control the definitions: outside
`sim/`, only `ObjectNode.tsx:271-272` (`useSimVersion();` /
`const isSimActiveNode = typeof simObjectId === 'string' && isSimActive(simObjectId);`), the injection
`makeDrawReadCtx(idlookup, isSimActive)` (`irReadCtxLproxy.ts:21`, `:63`) and the four `'mark'`
subscribers. With `isSimActive(id): boolean` total and `useSimVersion(): number` unchanged,
`ObjectNode.tsx` and `viewpoint/ir/*` need **no diff**; `EditorV2.tsx:4400`
(`{modelid && <SimulationPanel modelid={modelid} isModelMode={isModelMode} />}`) neither.

---

## 6. Question 3 — the R-SIM-13 interruption

### 6.1 The pattern **[R]**

R-VAL-18: at the first transaction that touches the model after a run, the dots are withdrawn and one
declaration says so. Mechanics: the command takes the signature on the state it looked at
(`Toolbar.tsx:742-746`, `noteValidationRun(..., buildValidationSignature(state.idlookup))`);
`ValidationFreshnessSync` recomputes it per dispatch only while armed
(`armed ? buildValidationSignature(state?.idlookup) : ''`, `ValidationFreshnessSync.tsx:63-64`) and on a
difference calls `markStaleIfFresh` (`:66-70`).

For the run: the baseline is taken in `startRun` on the lookup that was compiled and stored in the
run record; the panel (connected, always mounted with its editor) subscribes with
`useSelector(state => run ? runSignature(state.idlookup, modelid, configModelId) : '')` and, on a
difference with `run.signature`, interrupts. No new component, no change to `EditorV2.tsx`. The run
never writes to the model (R-SIM-6), so it cannot interrupt itself.

### 6.2 Which signature: measured on six edits **[M]**

Each edit applied through the L proxy, landed-check read back from the store after 1.8 s (P12), then
both signatures compared with the ones taken before it.

| Edit | Landed | `buildValidationSignature` | Run-scoped prototype | Wanted |
|---|---|---|---|---|
| Rename `Unlocked` (object of the run's model) | `UnlockedX` | changed | changed | interrupt |
| `tCoin.next := Locked` | `[Locked]` | changed | changed | interrupt |
| Move Locked's `DVertex` x + 37 | `927` | unchanged | unchanged | no interrupt |
| M2 bag `simBound := '2'` | `'2'` | **unchanged** | changed | interrupt (k changed) |
| Rename metaclass `TState` | `TStateX` | changed | changed | interrupt (guards read class names) |
| Rename an object of **another** M1 of the same metamodel | `Elsewhere` | **changed** | unchanged | no interrupt |

Cost, 20 runs: validation ≤ 0.1 ms (length 7378 at 161 entries, 19033 at 506), run-scoped ≤ 0.2 ms
(7804, 19005). Prototype: the `sim*` keys of the M2 bag, then for each id of
`collectModelObjectIds(lookup, modelId)` `o<id>=instanceof,name` and every DValue of its `features`,
then the M2 part of `buildValidationSignature` (`DClass`, `DAttribute`, `DReference`, `DEnumerator`,
`DEnumLiteral`, `validationFreshness.ts:114-128`). Phase 2 adds the M1 `DModel` name (the `model`
handle's `name`, `guardContext.ts:139`).

### 6.3 What the panel shows after the interruption

Recommended: `simClear(modelid)` (the highlight goes, status `Not started`) plus one warning line in
the panel, "Run interrupted: the model changed. Reset to run again.", held in the panel's state
(the component stays mounted while collapsed: `if (!open)` returns the chip from the same instance,
`SimulationPanel.tsx:368`) and cleared by Reset or Stop. It is the R-VAL-18 transition: withdrawal and
declaration together, one place, never per node. Alternatives: keep the marking as `Halted` with a
fifth `HaltReason` (a core type change, and a highlight computed on a model that no longer exists: a
deleted place would keep a phantom token, the `step.test.ts:167` case pinned in 3a); a sixth status
`Interrupted` (R-SIM-29 lists five).

---

## 7. Question 4 — the panel

### 7.1 Statuses **[R]**

`NetRunStatus` = `'Not started' | 'Running' | 'Terminated' | 'Deadlock' | 'Halted'` (`netTypes.ts:250`),
`netRunStatus` puts `Halted` before `Terminated` (`netStep.ts:270-276`). The panel's twin
`type RunStatus = 'Not started' | 'Running' | 'Terminated' | 'Deadlock';` (`SimulationPanel.tsx:221`)
goes. Dots: `--running`, `--terminated`, `--deadlock` exist (`simulation-panel.scss:371-373`); `--halted`
is new, on the existing `--color-error` token (`styles/tokens/_colors-light.scss:143`,
`_colors-dark.scss:82`).

### 7.2 The halt message, by `HaltReason` kind (`netTypes.ts:233-237`)

| Kind | Message (labels by `objectLabel`) | Reachable in 3b |
|---|---|---|
| `unsafe` | "Halted: unsafe. {place} would hold {value} tokens; the bound is {bound}." | yes |
| `domain` | "Halted: {attr} of {element} would be {value}, outside its domain." | no: no declared attributes until the Action lane |
| `double-assignment` | "Halted: {attr} of {element} is assigned twice in one step." | no |
| `action-defect` | "Halted: the {exit / transition / entry} action of {element} failed: {detail}." | no |

Shown as a `sim-panel__hint--error` line under the status, cleared by Reset (a new run record,
`halt: null`) and by Stop. The function is total over the four kinds and tested on all four.

### 7.3 Buttons (R-SIM-29)

`panelInputs(status, structuralInputs(net, state))`: every input button (ε and events) disabled in
`Terminated`, `Deadlock` and `Halted`; in `Running` the structural rule (R-SIM-16); in `Not started`
all disabled, as today's `enablement === null` (`SimulationPanel.tsx:444`, `:469`). Reset and Stop
stay enabled.

### 7.4 The choice among several candidates

R-SIM-25: external choice is a policy of the selector. Spec §6: "In **step-by-step** mode the user picks
(candidates are highlighted). In **run** mode a declared **policy** picks: ... random with a **seed
recorded in the trace**."

| Option | What it is | Cost |
|---|---|---|
| **(a) recommended** | A click on an input computes `candidates`; 0 → `step(null)` (discard or quiescence); 1 → fires; more than 1 → a list "Choose a transition (coin)" of buttons, one per candidate, and Cancel. A candidate flagged `unsafe` shows "exceeds bound k" | panel state `pending { event, candidates }`, dropped on any bump or input change; one `candidateLabel` pure function; one scss block |
| (b) (a) plus a Random toggle | picks uniformly | an RNG; spec §6 wants the seed recorded in a trace that step 5 brings; untestable without an injected RNG |
| (c) every input's candidates always listed | no pending state, one click | candidates of every input per render (measured ≤ 0.3 ms), a panel that grows with inputs × candidates |
| (d) pick on the canvas | the spec's "highlighted" | wave 3c, critical zone |

`candidateLabel`: the name of the transition's own element (a plain edge or a Petri transition: `t.id`;
a fused fork/join: the pseudo-node, the element of `origin` equal to the id before `#`,
`netTypes.ts:135-138`), then "(preset → postset)" in place labels: "tCoin (Locked → Unlocked)",
"F (p0 → a1, b1)". An unsafe single candidate fires at once and halts, with the message of §7.2.

### 7.5 Two additions

- **Compile defects** (R-SIM-31: never a candidate, the reason kept, `netCompile.ts:17-18`): after Reset,
  one warning line, "2 elements not compiled: tUnset has no target; tGone ...", first three then
  "and N more". Without it a target-less edge silently never fires.
- **Last step**: one line from the label, "coin: tCoin fired", "coin: discarded, no candidate",
  "ε: nothing to fire". A structural button blocked by a false guard is enabled (R-SIM-16) and a click on
  it is a discard; without the line nothing visible happens.

### 7.6 The states, as text

Model face, 288 px wide; buttons `[⏮]` Reset, `[▶ ε]` Step, `[⏹]` Stop; `·` disabled, `›` enabled.

```
NOT STARTED                          RUNNING, ONE CANDIDATE (turnstile at Locked)
[⏮] [▶ ε·] [⏹]                       [⏮] [▶ ε·] [⏹]
EVENTS                               EVENTS
[› Coin·] [› Push·]                  [› Coin] [› Push]        Coin fires tCoin at once
─────────────────                    Last step: Reset
● Not started                        ─────────────────
                                     ● Running

RUNNING, A CHOICE (after a click on ε at A)   TERMINATED
[⏮] [▶ ε] [⏹]                        [⏮] [▶ ε·] [⏹]
CHOOSE A TRANSITION (ε)              EVENTS  [› Coin·] [› Push·]
[t1 (A → B)]                         Last step: ε: e4 fired
[t2 (A → C)  exceeds bound 1]        ─────────────────
Cancel                               ● Terminated               (green)
─────────────────
● Running

DEADLOCK                             HALTED
[⏮] [▶ ε·] [⏹]                       [⏮] [▶ ε·] [⏹]
Last step: ε: tj fired               Halted: unsafe. b2 would hold 2 tokens;
─────────────────                    the bound is 1.                (error)
● Deadlock                (amber)    ─────────────────
                                     ● Halted                   (red; last marking stays)

INTERRUPTED
[⏮] [▶ ε·] [⏹]
Run interrupted: the model changed. Reset to run again.   (warning)
─────────────────
● Not started             (grey; highlight withdrawn)
```

---

## 8. Question 5 — the M2 face

### 8.1 The keys, grouped **[R]**

Today `ROLE_SPECS` has 9 rows (`simRoleStatus.ts:35-47`) of four kinds (`RoleKind`, `:26`). R-SIM-32 and
R-SIM-10 add 11. `simBound` is a value, not a pointer: a fifth kind, a number input writing a digit
string, because `mapStateToProps` keeps only non-empty strings
(`if (typeof value === 'string' && value) roles[key] = value;`, `SimulationPanel.tsx:531-534`) and
`netStcFromRoles` accepts digits (`netCompile.ts:36-40`).

| Group | Key (kind) | Control flow | Petri |
|---|---|---|---|
| General | Node `simNode` (class) | optional | **required** |
| | Initial `simInitial` (class) | one of Initial / Initial marking | — |
| | Initial marking `simInitialMarking` (attribute) | one of Initial / Initial marking | **required** |
| | Terminal `simTerminal` (class) | optional (R-SIM-28) | optional |
| | Bound `simBound` (number) | optional, default 1, an integer ≥ 1 | same |
| | Transition `simTransition` (class) | optional (finds unowned edges, `netCompile.ts:150`) | **required** |
| | Guard `simGuard` (attribute) | optional | optional |
| Control flow | Owned transitions `simOwnedTransitions` (composition) | one of Owned / Source | — |
| | Source `simSource` (reference) | one of Owned / Source | — |
| | Next state `simNextState` (reference) | **required** | — |
| | Fork `simFork`, Join `simJoin` (class) | optional | — |
| Petri net | Arc `simArc` (class) | its presence selects Petri (R-SIM-31 (4)) | **required** |
| | Arc source `simArcSource`, Arc target `simArcTarget` (reference) | — | **required** |
| | Arc weight `simArcWeight` (attribute) | — | optional, default 1 |
| | Inhibitor arc `simInhibitorArc` (class) | — | optional |
| Events | Event, Trigger, Event identifier | as today | as today |

The requirements are those of `netStcFromRoles` (`netCompile.ts:77-79`):
`? !!(stc.node && stc.transition && stc.arc && stc.arcSource && stc.arcTarget && stc.initialMarking)`
`: !!(stc.nextState && (stc.ownedTransitions || stc.source) && (stc.initial || stc.initialMarking));`.
Layout: collapsible groups, open by default when the derived shape uses them or a required key is
missing; one line "Shape: control flow. Set Arc for a Petri net." 20 flat rows would be about 700 px.
Keys: every new name has 0 hits outside the 3a files (step 3 report §10.1), nothing to rename.

### 8.2 `missingEngineRoles` per shape, and what replaces the parity

Today `ENGINE_ROLE_KEYS = ['simInitial', 'simTerminal', 'simOwnedTransitions', 'simNextState']`
(`simRoleStatus.ts:58`), and the panel hides the run controls until all four are set
(`rolesComplete`, `SimulationPanel.tsx:258-259`): the `TFinal` workaround R-SIM-28 closes. Proposed:

- control flow: "Next state"; "Owned transitions or Source"; "Initial or Initial marking";
- Petri: each of "Node", "Transition", "Arc source", "Arc target", "Initial marking";
- a malformed Bound is not "missing": a second function `invalidEngineRoles(roles)` gives
  "Bound (a whole number ≥ 1)".

`simRoleStatus.test.ts:48` ("is empty exactly when stcFromRoles builds a descriptor, over the 16 subsets
of the engine keys") becomes: over every subset of the ten keys `simNextState`, `simOwnedTransitions`,
`simSource`, `simInitial`, `simInitialMarking`, `simNode`, `simTransition`, `simArc`, `simArcSource`,
`simArcTarget` (1024 bags) times `simBound` ∈ {unset, `'2'`, `'0'`, `'x'`} (4096 bags),
`missing.length === 0 && invalid.length === 0` iff `netStcFromRoles(bag) !== null`; with the control
that both sides are true on some bags and false on others (not vacuous), and a second loop that adds
`simTerminal` to every bag and finds both sides unchanged (R-SIM-28). The two stay independently
written: deriving one from the other would make the parity vacuous.

### 8.3 The overlap sorts **[R]**

Today: `{ sort: 'node', keys: ['simNode', 'simInitial', 'simTerminal'] }`, `transition`
`['simTransition']`, `event` `['simEvent']` (`stcFromRoles.ts:54-58`). Proposed: `node` gains `simFork`,
`simJoin` (a fork class extending the node class is the norm, as for initial; the 3a fixtures do it,
`netCompile.test.ts:64`); a new sort `arc` = `['simArc', 'simInhibitorArc']` (an inhibitor class
extending the arc class is one sort). Refusal: today `refuse: !!(pointer(roles, 'simEvent') && pointer(roles, 'simTrigger'))`
(`stcFromRoles.ts:112`), the warning path kept for step 1 parity. A Petri bag has no such history: a class
both place and transition makes `compilePetri` put it in both sets (`netCompile.ts:268-269`), so refuse
when the Petri shape is declared too (question 9).

---

## 9. Question 6 — deletion and tests

### 9.1 Every consumer of the names to delete **[M]**

`git grep -nw` over `frontend/src`, tests excluded, comment lines excluded; control: each name's
definition found. Gitignored copies under `scripts/smoke/_tmp_bench_sim1/` and `_tmp_bench_1005/` import
their own copies and are not affected.

| Name | Definition | Consumers (non-test) | Fate |
|---|---|---|---|
| `stepFlowchartBoolean` | `step.ts:102` | `SimulationPanel.tsx:32`, `:355` | deleted |
| `applyStepLabel` | `step.ts:40` | `simRunState.ts:19`, `:95` | deleted |
| `runStatus` | `step.ts:188` | `SimulationPanel.tsx:32` (as `computeRunStatus`), `:295` | deleted |
| `enabledEvents`, `epsilonEnabled` | `step.ts:157`, `:175` | `SimulationPanel.tsx:32`, `:312` | deleted |
| `initialConfiguration` | `step.ts:87` | `SimulationPanel.tsx:32`, `:335` | deleted |
| `eventAlphabet` | `step.ts:141` | `SimulationPanel.tsx:32`, `:560` | **survives**, retyped on `NetStc`, moved to `netCompile.ts` |
| `SimConfiguration` | `types.ts:26` | `SimulationPanel.tsx:37`, `:294`, `:310`, `:353`; `simRunState.ts:20`, `:22` | deleted (rule 11) |
| `StepLabel` | `types.ts:76` | `step.ts` only | deleted (rule 11) |
| `SimRunStatus` | `types.ts:91` | `step.ts` only; twin `SimulationPanel.tsx:221` | deleted (rule 11) |
| `stcFromRoles` | `stcFromRoles.ts:22` | `SimulationPanel.tsx:33`, `:291`, `:307`, `:316`, `:350`, `:556` | deleted |
| `StcRoles`, `StcDescriptor` | `types.ts:45`, `:58` | `stcFromRoles.ts:15`, `step.ts` | deleted (rule 11) |
| `SimModelView` | `types.ts:110` | `netTypes.ts:17`, `:106`; `SimulationPanel.tsx:37`, `:192` | kept; `outgoingTransitions`, `transitionTarget`, `transitionTriggers` marked `// TODO: cleanup` |
| `SimEventInfo` | `types.ts:85` | `SimulationPanel.tsx:37`, `:246`, `:248` | kept |
| `roleOverlaps`, `overlapVerdict`, `roleWriteVerdict`, `RoleOverlap` | `stcFromRoles.ts:61-129` | `SimulationPanel.tsx:33-34`, `:212`, `:273`, `:324` | kept, sorts extended |
| `ENGINE_ROLE_KEYS`, `missingEngineRoles` | `simRoleStatus.ts:58`, `:75` | `SimulationPanel.tsx:31`, `:258` | rewritten per shape |

### 9.2 The tests, file by file (counts **[M]** by `command grep -c "^\s*it("`; coverage **[R]**)

| File (tests) | Deleted | Rewritten or moved | Kept |
|---|---|---|---|
| `step.test.ts` (27) | 21: `initialConfiguration` 2, `stepFlowchartBoolean` 11, `runStatus` 4, `applyStepLabel` 1, `stcFromRoles` 3 | 6 `isKindOf` tests (`:249-292`): `:262`, `:269`, `:275`, `:280` move verbatim to `events.test.ts`; `:249`, `:255` rewritten on `compileNet`/`terminated` | the file goes |
| `events.test.ts` (43) | 24: slice 0 parity 5 (all but `:124`), identity 2, input restriction 6, discard 3, enabling 4, `stcFromRoles` 4 | 4: `eventAlphabet` 2 (retyped), `:124` alphabet without the role, `:523` redone over `compileNet` | 15: overlaps 12 (+ new sort tests), slot readers 3 |
| `netParity.test.ts` (31) | the old-side asserts | all 31 (§9.4) | — |
| `simRoleStatus.test.ts` (12) | — | `missingEngineRoles` 4 (per shape, parity), `:79` on `netStcFromRoles`, message `:94-98` | `missingEventRoles` 4, messages 2 |

Every deleted behaviour is pinned elsewhere, read (not measured by mutation) by comparing the test
lists: the deterministic traces and the 20 decisions in `netParity.test.ts`, the new rules in
`netStep.test.ts` (36) and `netCompile.test.ts` (26). The exceptions are §9.3.

### 9.3 Two checks no net test repeats **[M]**

`command grep -n "mutat|not a string|42|Object.freeze"` over `netStep.test.ts` and `netCompile.test.ts`:
no hit. So deleting `step.test.ts` loses (i) "does not mutate the input marking" (`step.test.ts:174`) and
(ii) a role value that is not a string counts as unset (`stcFromRoles({ ...complete, [key]: 42 })`,
`:326`). Both are ported into the rewritten `netParity.test.ts`, on `step` and `netStcFromRoles`.

### 9.4 The parity oracle after the old step

The oracle survives as **golden traces**: the ten deterministic traces of `netParity.test.ts:134-204`
already assert literal sequences (`['B', 'C', 'C']`, the turnstile
`['Unlocked', 'Unlocked', 'Locked', 'Locked', 'Unlocked']`, ...) that the old step produced. Proposed:

1. Commit 1 adds a test that runs the old step on each fixture and asserts it equals the golden
   literals: the literals are proven against the old oracle while it still exists.
2. Commit 2 deletes the old step and that test, and replaces `parityTrace` by a run through the whole
   3b path: the fixture as a raw lookup, `startRun` (bridge), `simReset`, then per input `candidates`,
   `step`, `simCommit`, and `isSimActive` per element against the golden set after each step. The
   oracle then covers the adapter and the store the canvas reads, the 3a ticket's "rewritten against the
   new store".
3. The 20 decisions keep their new-side assertions; the old answer stays in the test name as a literal,
   with the commit of step 1 cited in the header.

---

## 10. Dependencies and risks

| # | Risk or dependency | Evidence | Severity |
|---|---|---|---|
| R1 | The panel wiring (context builder passed, signature effect, pending choice) runs only in the page: the panel imports the joiner and does not load under node | `SimulationPanel.tsx:29` | medium: closed by the bridge split (§4.2) and a Phase 2 e2e probe, declared |
| R2 | `buildEvalContext` grows with the model: 15 ms at 74 objects | §4.3 | low at Reset; forbidden per dispatch |
| R3 | A signature that misses what the run reads leaves a stale run; one that reads too much interrupts on noise | §6.2 | medium; the six measured edits become unit tests |
| R4 | Behaviour visible to users changes: fire-all gone, merges unsafe at k = 1, `Deadlock` disables every input, fork/join nodes never highlighted | R-SIM-33 "Conseguenze accettate"; step 3 report §9 R1 | accepted, to be seen in the visual check |
| R5 | The M2 face grows to 20 rows | §8.1 | medium: collapsible groups; a panel taller than the editor would clip |
| R6 | The step 1 e2e harness (`_tmp_sim1_e2e.ts`, `_tmp_sim1005_e2e.ts`, imported by Alfonso's `_tmp_sim1_verify.ts`) and `_tmp_sim0_verify.ts` assume the old store and statuses | §5.2 | low: gitignored; a new harness in the Phase 2 scratchpad, `_tmp_sim1_verify.ts` untouched |
| R7 | Rule 11: `SimConfiguration`, `StcRoles`, `StcDescriptor`, `StepLabel`, `SimRunStatus` deleted; `simReset` parameter changed; `RoleKey`, `RoleKind` unions extended | §5.2, §9.1 | needs the GO |
| R8 | 3001 serves `~/jjodel-release/frontend` (pid 58802), 3000 serves `~/jjodel/frontend` (pid 19238) | `lsof -d cwd` **[M]** | the visual check needs a server on this worktree |
| R9 | The validation twin of the `targetMetamodelId` defect stays | R-SIM-33 ticket | outside this lane |
| D1 | 3c (candidates on the canvas) reads `SimRun` and `NetTransition.origin` | R-SIM-33 | the store shape is its input |

---

## 11. Phase 2 proposal

### 11.1 Files (15; rule 19, to be listed in the GO)

Modified (10):
1. `frontend/src/components/editor-v2/sim/simRunState.ts`: `SimRun` map, `isSimActive` as tokens ≠ 0,
   `simReset(modelId, run)`, `simCommit`, `getSimRun`, bump rules (§5.2).
2. `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: bridge calls, five statuses, halt line,
   input gating, candidate list, interruption, defects and last-step lines, M2 face groups and the number
   input; proxy readers and `makeSimModelView` deleted.
3. `frontend/src/components/editor-v2/sim/simRoleStatus.ts`: 20 role specs, `RoleKind` `'number'`,
   per-shape `missingEngineRoles`, `invalidEngineRoles`, messages.
4. `frontend/src/components/editor-v2/sim/simulation-panel.scss`: `--halted` dot, candidate list, group
   headers, number input.
5. `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`: the 4096-bag parity.
6. `frontend/src/model/simulation/types.ts`: five types deleted, `SimModelView` TODO marks.
7. `frontend/src/model/simulation/stcFromRoles.ts`: `stcFromRoles` deleted, sorts extended, refusal rule.
8. `frontend/src/model/simulation/netCompile.ts`: `eventAlphabet` moved in, on `NetStc`.
9. `frontend/src/model/simulation/__tests__/events.test.ts`: §9.2.
10. `frontend/src/model/simulation/__tests__/netParity.test.ts`: §9.4, and the two ports of §9.3.

Deleted (2): `frontend/src/model/simulation/step.ts`, `frontend/src/model/simulation/__tests__/step.test.ts`.

New (3): `frontend/src/components/editor-v2/sim/simBridge.ts`,
`frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`,
`frontend/src/components/editor-v2/sim/__tests__/simRunState.test.ts`.

Not touched, byte-identical: `ObjectNode.tsx`, `viewpoint/ir/*`, `EditorV2.tsx`, `netTypes.ts`,
`netStep.ts`, `guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts`, `objectSlots.ts`, `isKindOf.ts`,
`netCompile.test.ts`, `netStep.test.ts`, `validationFreshness.ts`, `jjscript/*`, `jjel/*`. If question 7
goes the other way, `netCompile.test.ts` and `netStep.test.ts` join (17 files).

### 11.2 Changed exported interfaces (rule 11, for the GO)

`simReset` (parameter); `simApplyStep` (deleted); `SimConfiguration`, `StcRoles`, `StcDescriptor`,
`StepLabel`, `SimRunStatus` (deleted); `stcFromRoles`, `stepFlowchartBoolean`, `applyStepLabel`,
`runStatus`, `enabledEvents`, `epsilonEnabled`, `initialConfiguration` (deleted functions);
`eventAlphabet` (parameter type, file); `ENGINE_ROLE_KEYS` (shape); `RoleKey`, `RoleKind` (unions
extended). New: `SimRun`, `simCommit`, `getSimRun`, the `simBridge.ts` exports.

### 11.3 Commits

1. `feat(sim): panel and run-state on the Petri core (P-2026-09-25-1103)`: files 1-5, 8, the three new
   files, and in `netParity.test.ts` the golden-vs-old test (§9.4 step 1). The old step is still in the
   tree, unwired.
2. `refactor(sim): delete the old boolean step (P-2026-09-25-1103)`: `step.ts`, `step.test.ts`,
   `types.ts`, `stcFromRoles.ts`, `events.test.ts`, `netParity.test.ts` rewritten.
3. Docs: the log entry in `docs/log-inbox/simulation.md`, the Status line, R-SIM-32 keys marked
   definitive if Alfonso wants that recorded in `decisions.md`.

Each code commit green on its own (typecheck 14, vitest, build).

### 11.4 Test plan, one mutation per rule

Every test executes the public function (P11), module state reset in `beforeEach`, every "nothing
happens" with its control (P12). The bench runs each mutation and the table goes in the commit body.

| Rule | Test (file) | Mutation that must turn it red |
|---|---|---|
| The bridge passes `targetMetamodelId` | `startRun` with a spy builder: called once with `targetMetamodelId === lookup[m].instanceof`, `scopeBound: true`, `extentModelId === m` (simBridge) | drop `targetMetamodelId`; pass the configModel of another metamodel |
| A run is kept with an empty marking | `simReset` a run whose marking is empty: `getSimRun` defined; `simCommit` of a firing that empties it: still defined (simRunState) | today's delete-on-empty (`simRunState.ts:36`) |
| `isSimActive` is tokens > 0 | marking `{p: 2}` true; an explicit `{p: 0}` entry false; absent false; two models (simRunState) | `=== 1`; `marking.has` |
| One bump per committed step | version +1 on Reset, `fired`, `halted`, Stop of a run; +0 on discard, quiescence, inadmissible, Stop without a run (simRunState) | bump on every commit; no bump on `halted` |
| Interruption on model edit | `runSignature` on the six edits of §6.2 as lookups, plus the M1 name (simBridge) | drop the bag keys; scan every DObject; include `DVertex` |
| Inputs disabled in the three stop statuses | `panelInputs` for each of five statuses (simBridge) | drop `Halted` from the stop set |
| The halt message, shown and cleared by Reset | `haltMessage` on the four kinds; `simCommit(halted)` sets `halt`, `simReset` clears it, `simClear` removes it (simBridge, simRunState) | Reset keeps `halt`; two kinds' messages swapped |
| The candidate choice fires the chosen one | two candidates, select the second: the marking is the second's postset (simBridge, through `step`) | fire `candidates[0]` |
| A bag without `simTerminal` runs | the parity loop with Terminal added and removed; `startRun` on a Terminal-free bag gives `Running` (simRoleStatus, simBridge) | Terminal back in the required keys |
| Overlap sorts | fork/join as nodes do not overlap; an arc class that is a transition class refuses under Petri (events) | `simFork` in its own sort; refusal on event role only |
| Parity oracle | golden traces through bridge and store (netParity) | `simCommit` ignoring `next`; `isSimActive` reading the initial marking |

### 11.5 Smoke and visual checks for Alfonso, after the code commits

On a dev server of this worktree (3002, or 3001 once repointed: question 15), light and dark:

1. **Turnstile of step 1**, with `simTerminal` unset: the run controls show; Reset marks Locked,
   `Running`; ε disabled, Coin and Push enabled; Coin → Unlocked; Push → Locked; the trace of step 1.
2. **Flowchart with a decision block and `else`** (guards over M, since state attributes wait for the
   Action lane): `S → D`, `D -[model.name == "fast"]-> A`, `D -[else]-> B`, Terminal on the end nodes.
   With the model named `fast` the guarded edge fires, otherwise `else`; the end marking is `Terminated`,
   green, every input disabled. Renaming the model mid-run interrupts it (highlight withdrawn, the line).
3. **A small net with a parallel fork, an AND-join and an inhibitor** (Ex3 of the step 3 report, Petri
   metamodel with Place, Transition, Arc, InhibitorArc, weight and initial marking): tb blocked while a1
   is marked, the fork marks both branches, the join fires once both are there; without Terminal the dead
   marking is `Deadlock`, amber, every input disabled.
4. **A run halted by «unsafe»**: the same net with Bound 1: the step into b2 halts, `Halted`, red, the
   message names b2, 2 and 1; the marking stays visible; Reset clears message and status.
5. **A choice**: a node with two ε edges: the list appears, the chosen edge fires, Cancel leaves the run
   as it was.
6. **Interruption noise**: dragging a node during a run does not interrupt; editing an object of another
   model of the same metamodel does not interrupt.
7. The P8 smoke states from a scratchpad copy pointed at the server (`states.ts` hardcodes 3000).

---

## 12. Layer Impact Report — definitive, for Phase 2

```
LAYER IMPACT REPORT — wave 3b (P-2026-09-25-1103)

Layers touched:
  [x] D-layer (Redux raw data)          the M2 face writes the new flat sim* keys into the M2 bag through the
                                        existing path (lmm.state = {...}, SimulationPanel.tsx:284, R-SIM-2);
                                        the run never writes to the model (R-SIM-6)
  [x] L-layer (computed proxies)        read only, once per Reset: buildEvalContext walks L proxies; the panel's
                                        proxy readers (SimulationPanel.tsx:151-175) are deleted
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   indirectly: the source of isSimActive and so of ReadCtx.isMarked
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)   no migration: no key renamed, simTerminal keeps its meaning where
                                        set, the 3a keys were never persisted (R-SIM-32)

For each touched layer:
  - What changes:
      D-layer: eleven more bag keys can be written, simBound as a digit string.
      L-layer: one buildEvalContext per Reset with targetMetamodelId = the M1's instanceof and
        scopeBound true; its record is frozen (freezeSnapshot), measured 0 objects shared with the
        store and 0 L proxies outside data/node (step 3 report §8.2).
      Canvas: isSimActive(id) = some run has tokens(id) != 0 on a Map; an entry per started run, kept
        with an empty marking; bumps on Reset, fired, halted, Stop/interrupt of a run.
  - What does NOT change: the signatures of isSimActive, getSimActiveIds, simClear, getSimVersion,
      useSimVersion; ReadCtx.isMarked total and boolean (R-MK-4, R-MK-7); the injection point
      makeReadCtx (irReadCtxLproxy.ts:21, :63); ObjectNode.tsx, viewpoint/ir/* and EditorV2.tsx have no
      diff; the 'mark' channel and its four subscribers; the global version (R-MK-6).
  - Cross-layer interaction: while a run exists, the panel reads idlookup on each dispatch for the
      run signature (<= 0.2 ms at 506 entries, measured) and interrupts on a difference; the Reset
      reads L proxies once (3.0 ms at 14 objects, 15.3 ms at 74, measured).
  - Side-effect safety vs other layers: fork and join nodes are never highlighted (not places);
      edges never; a place with 2 tokens is highlighted as with 1; a Halted run keeps its last marking;
      an interrupted run withdraws it; a vertex move does not interrupt (measured); an edit of
      another model does not interrupt (measured, run-scoped signature).

Smoke-test scenarios potentially affected:
  - turnstile of step 1: identical trace, highlight on the same node at each step
  - a view with a `marked` conditional re-renders once per committed step, as today
  - Reset / Stop / interruption / model tab change clear or replace the highlight
  - a flowchart fork: one branch per step now (R-SIM-7), the join unsafe at k = 1 for two tokens

Uncertain about propagation: none found; the grep of §5.3 is the evidence.
```

---

## 13. The probe (scratchpad, not committed)

`probe_sim3b_bridge.mts`, run with `npx tsx` against `vite --config vite.sim3b.config.ts` from
`frontend/` (own `cacheDir` in the scratchpad, `fs.allow` on this tree, the main tree's `node_modules`
and the scratchpad; port 3002 declared, `strictPort`). The dependency scan failed on the pre-existing
`MTM.tsx` `Nearley` import and vite continued without pre-bundling, as in step 3: environmental. One
run: **ALL GREEN, 0 page errors**; 11 checks (canvas control, compiled turnstile, pool with the id while
the active metamodel is `null`, guard sites compiled, six landed-checks, the three edits both
signatures must see). Server stopped at the end, `lsof` on 3002 empty.

---

## 14. Baseline gates at `e3c0c6776`, from `frontend/` **[M]**

| Gate | Result |
|---|---|
| `npm run typecheck` | exit 2, **14** errors, the §17 set by file and code: `api/data.ts` TS2304 ×2, TS2322; `common/Dummy.ts` TS2307; `EditorV2.tsx` TS2339; `Measurable.tsx` TS2552, TS7053 ×4, TS2345; `Jodie/ChatMessages.tsx` TS2322; `project/ProjectEditor.tsx` TS2769; `pages/components/Dashboard.tsx` TS2339 |
| `npx vitest run` | exit 1: **4623 passed**, 0 failed; 185 files passed, **9 red at import** (`window is not defined`): `jjscript/__tests__/context-binding`, the seven `jjtl/__tests__/*` of §17, `utils/__tests__/UDComparator` |
| `npm run build` | exit 0, the chunk-size warning only |
| `npm run check:docs` | exit 0, 4/4; one non-blocking warning: the `simulation` inbox has 1 entry waiting to be folded |
| `npm run check:scripts` | exit 1, **1** finding, `frontend/scripts/smoke/_tmp_sim1_verify.ts:186:5`, the expected one; 48 files, 13 `_tmp_*` |

---

## 15. State of the tree

No source file modified. `frontend/scripts/smoke/_tmp_sim1_verify.ts` untouched. Written by this phase:
this report only, committed alone with pathspec. `git status --short` empty before this commit.
