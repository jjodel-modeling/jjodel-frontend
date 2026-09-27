# Discovery — guard and action checks in the problems list (S16, the checker gap)

- Prompt-ID: `P-2026-09-27-1726` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-27_1726_prompt_discovery_sim_checker_gap.md`
- Session: `4b5bb68d-5ba6-47c1-a926-87ddc75cd823` (the id in the harness's tool-results path; the banner shows none)
- Tree: `~/jjodel-w-checker`, branch `sim-checker-gap`, HEAD `d1d45b9d3` (the prompt commit; parent `93e964141`, the trunk
  after the E1 and `sim-binding-compat` merges). `git status` empty at the start and after every probe.
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No file under `frontend/src` was written. Three probes, gitignored `_tmp_checker_*`, one dev
  server on 3020, stopped at the end (§5.4).

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream re-reads
the real files. Tags: **[M]** measured in this phase on `d1d45b9d3` (the probe on 3020, or a command, named); **[R]**
read in a file of `d1d45b9d3`, or in a ref named.

---

## 0. Answer in brief

- **Today the problems registry sees a guard or an action only when it does not parse, and only when its attribute
  is typed `Expression` or `Action`.** That check is conformance's (`ConformanceValidator.ts:238-258`), a
  `type_mismatch` warning. Everything contextual (`node` in a guard, an undeclared target, a derived target, a double
  assignment) reaches the user only at Reset, in the panel's defects line, or at run time as a halt or a discard. Some
  errors are caught at neither of the first two and show only when the transition fires [M, §5].
- **The measurement in one line** [M]: on the ESM demo preset after Apply and before the declarations, Reset shows
  `2 defects: tc action (undeclared 'coins' on demoESM); tp action (undeclared 'coins' on demoESM).` while the
  registry holds 0 entries for the model.
- **Lane C2's probe (4) reproduces**: `demoESM.[coins] := 1` gives no defect at Reset and halts at run time with
  `the target: 'demoESM' does not exist` [M, case A4]. It is one of 11 error classes (14 cases) that pass Reset
  with no defect and surface only when the transition fires, or never: an undeclared attribute read in a guard, a
  model name as a root, a non-boolean guard, `else` with no sibling, a global attribute read on an element,
  `tokens` on a transition, an unresolved action target, an out-of-domain literal, an undeclared read on an action's
  right side, `now()` in an action, a non-scalar value [M, §5.2].
- **Recommended design, in two Phase 2 lanes after MODELS:**
  - **P2a `sim-checker-registry`** (critical zone, `problems/`): a producer that calls the bridge's own `startRun` and
    publishes its `compileDefects` for guards and actions, plus the `else-*` net defects, under a new
    `NodeProblemKind` literal `'simulation'`. The registry then says what Reset says, with no second copy of the rules.
    Measured cost of `startRun` on the ESM demo model: median 1.6 ms, max 5 ms [M].
  - **P2b `sim-checker-rules`** (no critical zone): the rules neither channel has today, in a pure module that the
    bridge calls at Reset, so the defects line and the registry both gain them.
- **R- rows.** No ratified row is amended by the recommendation: R-SIM-17 and R-VAL-7 are implemented as written,
  R-SIM-43's «controllo statico» is completed, and R-SIM-70 (provisional) is extended. One option, `else` with no
  sibling as a defect, would amend the ratified R-SIM-31 and is left to Alfonso (§12).
- **Demo.** P2a would add problem dots on `tc` and `tp` (ESM) and an entry on `f2` (Flow B) between Apply and the
  declarations, measured as Reset defects today. Petri and State machine as built have 0 [M]. Phase 2 merges after
  MODELS, as ratified (answer E of 17:07).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | No guard or action check reaches the problems registry | **falsified** | a parse error on an `Expression`/`Action` slot is a conformance `type_mismatch`, in the registry under the DObject and the vertex, with a canvas dot [M, cases G1, A1, E1, P1]; `ConformanceValidator.ts:238-267` [R] |
| H2 | Every contextual check runs at Reset, so the gap is only the channel | **falsified** | 11 error classes (the 14 bold rows of §5.2) pass Reset with no defect and surface only when fired, or never [M] |
| H3 | C2's probe (4) still holds on the trunk | **holds** | case A4: Reset lines `Marking: … · Last step: Reset`, no defect; fire: `Halted: the transition action of tc failed: the target: 'demoESM' does not exist.` [M] |
| H4 | A producer needs its own copy of the Reset rules | **falsified** | `startRun` is exported, pure over the lookup and returns `compileDefects` (`simBridge.ts:327-381`) [R]; median 1.6 ms on demoESM [M] |
| H5 | Adding a `NodeProblemKind` literal breaks a consumer | **falsified** | `kind` of a `NodeProblem` is read at two sites, `NodeProblemOverlay.tsx:193` and `registry.ts:276`, neither exhaustive (§4.3) [M: grep with positive control] |
| H6 | The checks can run in `ConformanceValidator` instead of a new producer | **partly** | syntax and by-name checks could; the folded checks need `buildEvalContext` (joiner) and a frozen snapshot, which the pure validator does not import (`ConformanceValidator.ts:14-16`) [R]; §7 option C |
| H7 | The four demo presets as built raise no registry entry of the new producer | **partly** | Petri and SM: 0 Reset defects [M]. ESM before declarations: 2; Flow B as built: 1 (`f2 action (undeclared 'count' on demoFlowB)`) [M]. After the declarations the ESM has 0 [M] |

---

## 2. Objective

Map the problems registry (producers, kinds, registration). Measure which STC guard and action errors are caught
today, and where: the registry, the Reset defects line, or only at run time. Design the producer, its problem kinds
(additive, Rule 11) and its tests, with C2's probe (4) as the reference. Name the R- rows touched, the risk to the four
demo presets, the Phase 2 lanes with their file sets, and draft the Layer Impact Report Phase 2 needs (RC-30).

---

## 3. Sources read

Full paths under `/Users/alfonso/jjodel-w-checker/` unless another tree or ref is named.

**Docs:**
- `CLAUDE.md` (session context); `docs/PROTOCOL.md` whole (P1-P16).
- `docs/claude-code-log.md` `:1-120`; `docs/log-inbox/simulation.md` whole (265 lines).
- `docs/decisions.md`:
  - `:145-246` (RC-20..30), `:262-275` (R-EDGE-2, R-EDGE-3);
  - `:1510-1600` (R-SIM-16..20), `:1772-1812` (R-SIM-39..44), `:1864-1868` (R-SIM-52);
  - `:1913-2170` (R-SIM-57..84);
  - `:4040-4200` (R-VAL-5..19-bis).
- `simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` whole, by `git show` (§4.4 S16, §5,
  §8 E).
- `sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md` whole, by `git show`.
- `docs/discovery/discovery_2026-09-26_sim_state_declarations.md` `:125-145`, `:400-415` (risk 5).
- `docs/demo/models_2026_simulator_demo.md` `:1-30`, `:100-120`, `:160-180`, `:236-262`, `:296-347`.
- `docs/prompts/claude_2026-09-27_0200_fase2_sim_derived_attributes.md` `:52` (C2's probe list).

**Code** (`frontend/src/`), whole unless a window is named:
- `components/editor-v2/problems/`: `registry.ts`, `ConformanceProblemSync.tsx`, `conformanceToProblems.ts`,
  `UniquenessProblemSync.tsx`, `validationToProblems.ts`, `vertexResolver.ts`, `useNodeProblems.ts`,
  `NodeProblemIndicator.tsx`; `NodeProblemOverlay.tsx` `:100-243`; `ValidationFreshnessSync.tsx` `:1-78`.
- `components/editor-v2/viewpoint/ir/formDiagnostics.ts` `:60-110`.
- `components/editor-v2/EditorV2.tsx` `:4270-4295`; `components/editor-v2/Toolbar.tsx` `:700-760`.
- `components/editor-v2/sim/simBridge.ts` `:1-70`, `:140-395`; `sim/SimulationPanel.tsx` `:199-205`, `:600-610`,
  `:670-700`.
- `model/simulation/`: `subsetChecker.ts`, `guardEvaluator.ts`, `actionEvaluator.ts`, `guardContext.ts`;
  `netTypes.ts` `:24-240`; `netCompile.ts` `:1-130`, `:430-520`, grep of `else`; `simProfiles.ts` grep of `id:`.
- `jjel/stateReserved.ts`.
- `model/conformance/ConformanceValidator.ts` `:1-60`, `:200-290`; `model/conformance/useConformance.ts` `:15-40`.
- `jjscript/executor/commands/eval.ts` `:122-134`.
- `components/TreeViewSidebar/TreeViewContent.tsx`: grep of `useNodeProblems`, `NodeProblem`.

**Probe sources, read and copied** (`~/jjodel-sim/frontend/scripts/smoke/`, read only): `_tmp_demo2_common.ts`,
`_tmp_demo2_scenario.js`, `_tmp_demo2_esm.ts`, `_tmp_demo2_vite.config.ts`.

---

## 4. The problems registry today

### 4.1 The store

- One module-level Map, session-local, not persisted, immune to undo [R]. `registry.ts:1-10`: «Producers
  (uniqueness validator today; future conformance / orphan / validation checks tomorrow) call registerProblem /
  clearProblem / markResolved; consumers subscribe through useNodeProblems».
- `registry.ts:38`: `export type NodeProblemKind = 'duplicate-name' | 'conformance' | 'validation';`. Its comment,
  `:29-33`: «Aggiungere un membro a questa union NON e' «aggiungere una proprieta' opzionale» ai sensi della Regola 11
  … Autorizzato dalla spec §8 e dal prompt di Fase 2, che ne dichiarano il prezzo per nome.»
- Ownership: `ownerModelId?` on the entry (`registry.ts:111`), read through
  `getProblemIdsOwnedBy(kind, ownerModelId)` (`:273-281`), the revoke pass of every producer.
- Debug handle: `window._jjNodeProblems` (`registry.ts:132-134`), which the probe reads.

### 4.2 The three producers

| Producer | Kind | Trigger | Anchoring | Revoke |
|---|---|---|---|---|
| `UniquenessProblemSync.tsx:184-213` | `duplicate-name` | `useSelector` signature over ids, names, fathers | element id only (`:58-63`: «the dot does not appear on the canvas») | `getProblemIdsOwnedBy` + `markResolved` (`:178-181`) |
| `ConformanceProblemSync.tsx:54-128` | `conformance` | `useConformance(modelid)`, 500 ms debounce | DObject id and resolved DVertex id (`:95-101`) | own `ownedIds` ref, `markResolved`; `clearProblem` on unmount (`:119-125`) |
| `validationToProblems.ts:91-125` (a function, called by `Toolbar.tsx:738`) | `validation` | the Validate command only | DObject and vertex, through `vertexResolver.ts` | `getProblemIdsOwnedBy` + `markResolved` |

The two components are mounted at `EditorV2.tsx:4283-4284`, next to `ValidationFreshnessSync` at `:4285` [R].

### 4.3 The consumers of an entry

- `NodeProblemIndicator.tsx:48-50`: the dot's count, `n + (p.conformance?.length ?? 1)`.
- `NodeProblemOverlay.tsx:193`: `const isConformance = p.kind === 'conformance' && !!p.conformance?.length;` rows for
  conformance, the description otherwise.
- `formDiagnostics.ts:95-98`: the rail attaches a conformance detail to its field by `metamodelElementName`; «Any
  other kind, `duplicate-name` today, is one unit with no field to attach to», pushed to the residue with
  `p.title || p.description`.
- `TreeViewContent.tsx:1075-1091`: the top problem of a row and `(+N more)`.
- **Who reads `kind`** [M]: `command grep -rn -e "\.kind ===" -e "\.kind !==" -e "switch (p.kind" -e "switch
  (problem.kind"` over `problems/`, `formDiagnostics.ts`, `IRForm.tsx`, `TreeViewContent.tsx`, `ObjectNode.tsx`,
  exit 0. The hits on a `NodeProblem` are `NodeProblemOverlay.tsx:193` and `registry.ts:276`; the other five are
  other `kind` fields (`target.kind`, `ir.kind`, `compiled.kind`, `decision.kind`). No exhaustive switch, so a new
  literal breaks no consumer.

### 4.4 No simulator code in `problems/`

[M] `command grep -rn -e checkGuardSubset -e compileGuard -e compileAction -e startRun -e simBridge -e
'model/simulation' frontend/src/components/editor-v2/problems`: exit 1, no line. Positive control, same tool and
directory, `command grep -rln -e registerProblem`: exit 0, 7 files. The backlog report's absence claim (§4.4 S16)
holds on this HEAD.

---

## 5. Measurements

### 5.1 Method

- Dev server from this tree on **3020** (`_tmp_checker_vite.config.ts`, cache in `/tmp/checker_scratch/vite-cache`,
  never this tree's `.vite-cache`), Playwright, headless Chromium, 1600×1000.
- Fixtures: `_tmp_checker_scenario.js`, a verbatim copy of `~/jjodel-sim` `_tmp_demo2_scenario.js` (`diff` of the
  bodies empty [M]). It builds the demo presets of the script §2 from empty bags. Apply goes through the panel's
  Profile select. The ESM declarations go through the panel's table (`coins` range 0..3 initial 0; `paid` derived
  `model.[coins] >= 2`), as `_tmp_demo2_esm.ts` does.
- Per case (`_tmp_checker_probe.ts`, `probeCase`):
  - set the slot through the L proxy, as the builder does, then wait 2.5 s (conformance debounce 500 ms);
  - read `window._jjNodeProblems` for the model's elements and their vertices, and the visible `.node-problem-dot`s;
  - press Reset and read the M1 face (the defects line with its `title`);
  - fire the transition (`push` for `tp`, `coin` for `tc` and `locked`'s entry) and read the face again;
  - restore.
- Runs:
  - probe 1: ESM, Petri, Flow B, SM, 79 lines, exit 0;
  - probe 2: ESM only, the action and entry cases that probe 1 contaminated, exit 0;
  - probe 3: timing, exit 0.
  - Logs in `/tmp/checker_scratch/probe{,2,3}.log`, outside every tree.
- **Contamination, declared.** In probe 1, setting `tc.effect` back to a one-value list after A8 (two values) left the
  second value `model.[coins] := 2` in the slot, as the C1 entry already noted («a shorter array does not truncate the
  slot»). Probe 1's A9-A12, E1 and E2 carry that leftover's defect. Probe 2 reran them with every list padded to two
  values (restore check: `["model.[coins] := model.[coins] + 1",""]` [M]). The table quotes probe 2 for those rows.
- **Console.** Probe 1: 437 errors, 216 `Cannot serialize in ecore, found loop` with their 216 stack lines, 4 proxy
  set stacks, 1 `failed to get project`. Probes 2 and 3 (ESM only): 1 error, `failed to get project`. The ecore loop
  comes with the other presets built in the same page. Not investigated: it is outside this lane.

### 5.2 Where each error is caught today

«Registry»: entries of the model, with the canvas dot. «Reset»: the defects line after Reset. «Fired»: the face after
the input. All [M] on `d1d45b9d3`; texts verbatim, the line's `title` after `||` omitted unless it adds.

| Case | Text | Registry | Reset | Fired |
|---|---|---|---|---|
| G0 | `tp.guard = model.[paid]` (baseline) | 0 | none | `push: discarded, tp false` |
| G1 | `model.[paid] and` | conformance `type_mismatch` on `tp` and `tp@vertex`, dot `warning` | `1 defect: tp guard (parse error 1:17 Expected expression).` | `discarded, tp defect, parse error …` |
| G2 | `node.[x] > 0` | 0 | `1 defect: tp guard (E-NODE).` | `discarded, tp defect, E-NODE` |
| G3 | `self.[visits] > 0` | 0 | **none** | `discarded, tp defect, 'visits' is not a state attribute of tp` |
| G4 | `demoESM.[paid]` | 0 | **none** | `discarded, tp defect, '.[paid]' needs a model element on its left, got null` |
| G5 | `model.[coins]` (a number) | 0 | **none** | `discarded, tp defect, returns number` |
| G6 | `model.[coins] / 2 > 0` (T-DIV) | 0 | none (R-SIM-61: no warnings) | `discarded, tp false` |
| G7 | `self is Transition` (W-IS) | 0 | none (R-SIM-61) | `discarded, tp false` |
| G8 | `now() > 0` | 0 | `1 defect: tp guard (E-CALL).` | `discarded, tp defect, E-CALL` |
| G9 | `else`, no sibling | 0 | **none** | `push: tp (locked → unlocked) fired`: always true |
| G10 | `self.nextState.[coins] > 0` (global read on a state) | 0 | **none** | `discarded, tp defect, 'coins' is not a state attribute of unlocked` |
| G11 | `self.nextState != null and self.nextState.name == "x"` | 0 | `1 defect: tp guard (E-EAGER).` | `discarded, tp defect, E-EAGER` |
| A0 | `tc.effect = model.[coins] := model.[coins] + 1` | 0 | none | `fired`, `assignments: demoESM.coins = 1` |
| A1 | `model.[coins] :=` | conformance on `tc`, `tc@vertex`, dot | `1 defect: tc action (parse error 1:17 Expected expression).` | `Halted: the transition action of tc failed: 1:17 …` |
| A2 | `model.[coins] := node.[c]` | 0 | `1 defect: tc action (E-NODE).` | halted, E-NODE |
| A3 | `model.[nope] := 1` | 0 | `1 defect: tc action (undeclared 'nope' on demoESM).` | halted, `'nope' is not declared on demoESM` |
| A4 | `demoESM.[coins] := 1` (C2 probe 4) | 0 | **none** | `Halted: … failed: the target: 'demoESM' does not exist.` |
| A5 | `model.[paid] := true` (derived) | 0 | `1 defect: tc action (assigns derived 'paid').` | halted, `'paid' is derived and cannot be assigned` |
| A6 | `node.[coins] := 1` | 0 | `1 defect: tc action (undeclared 'coins' on tc).` | halted, same |
| A7 | `self.nextState.[coins] := 1` | 0 | `1 defect: tc action (undeclared 'coins' on locked).` | halted, same |
| A8 | `model.[coins] := 1`, `model.[coins] := 2` | 0 | `1 defect: tc action (coins of demoESM assigned twice).` | `Halted: coins of demoESM is assigned twice in one step.` |
| A9 | `model.[coins] := 'a'` | 0 | **none** | `Halted: coins of demoESM would be a, outside its domain.` |
| A10 | `model.[coins] := self.[visits]` | 0 | **none** | halted, `'visits' is not a state attribute of tc` |
| A11 | `event.[coins] := 1` | 0 | none (depends on the event) | halted, `'coins' is not declared on coin` |
| A12 | `model.[coins] := now()` | 0 | **none** | halted, `Function 'now' is not defined` |
| A13 | `model.[coins] := self` | 0 | **none** | halted, `the value is object, not a boolean, a number or a string` |
| A14 | `self.name.[coins] := 1` | 0 | **none** | halted, `the target is string, not a model element` |
| E1 | `locked.entry = model.[coins] :=` | conformance on `locked`, `locked@vertex`, dot | `1 defect: locked entry (parse error 1:17 Expected expression).` | `Halted: the entry action of locked failed: …` |
| E2 | `locked.entry = model.[nope] := 1` | 0 | `1 defect: locked entry (undeclared 'nope' on demoESM).` | halted, same |
| P0 | `t2.guard = p3.[tokens] < 1` (Petri baseline) | 0 | none | not fired |
| P1 | `p3.[tokens] <` | conformance on `t2`, `t2@vertex`, dot | `1 defect: t2 guard (parse error 1:14 Expected expression).` | not fired |
| P2 | `node.[x] > 0` | 0 | `1 defect: t2 guard (E-NODE).` | not fired |
| P3 | `else`, no sibling | 0 | **none** | not fired |
| P4 | `p3.[visits] < 1` | 0 | **none** | not fired |
| P5 | `t1.[tokens] < 1` (a transition) | 0 | **none** | not fired |

Row A6 reads «undeclared», not «locality». The attribute `coins` is global, so on `tc` it is undeclared before it is
misplaced. The locality branch (`simBridge.ts:277-281`) needs a name declared on the site with the other space.

The 14 **bold** «none» rows (G3, G4, G5, G9, G10, A4, A9, A10, A12, A13, A14, P3, P4, P5) are 11 classes that Reset
misses today and that a check before the run can decide (§8; G9 and P3 are decision 1 of §12). The other rows marked
none either depend on the event (A11) or are warnings R-SIM-61 keeps off the line (G6, G7).

### 5.3 The demo presets as built

After Apply, before any declaration, from `probe.log` [M]:

| Preset | Registry | Reset |
|---|---|---|
| Petri (`demoNet`) | 0 | none (`Marking: lock, p1 ×2`) |
| State machine (`demoSM`) | 0 | none |
| Extended state machine (`demoESM`) | 0 | `2 defects: tc action (undeclared 'coins' on demoESM); tp action (undeclared 'coins' on demoESM).` |
| Flow B (`demoFlowB`) | 0 | `1 defect: f2 action (undeclared 'count' on demoFlowB).` |

After the ESM declarations: registry 0, Reset none [M, `ESM REGISTRY baseline`, case G0]. On the ESM and Petri canvases
the transitions `tp`, `tc` and `t2` and the state `locked` are nodes with a vertex: their conformance dots showed
(G1, A1, E1, P1) [M].

### 5.4 Cost

Probe 3, on the page's own module instances (`/src/components/editor-v2/sim/simBridge.ts`,
`/src/jjscript/index.ts`), ESM after Apply, 15 iterations, 17 `DObject`s in the lookup [M]:
- `startRun(lookup, m1, mm, projectId, buildEvalContext)`: median **1.6 ms**, max 5 ms, 2 `compileDefects` (the
  undeclared `coins`);
- `buildEvalContext` alone: median 1.4 ms.

The Reset button (handler plus two frames) takes 43-64 ms over 7 presses. Probe 1 measured 345-495 ms with four
models and the ecore-loop errors in the page. The scale on a large model is not measured (§11, risk 2).

The dev server was stopped by pid (79159) at the end; `lsof` on 3020 shows no listener; `git status` empty [M].

---

## 6. Findings

- **F1. The only guard/action check in the registry is syntax, and only for the two primitive types** [R]. At
  `ConformanceValidator.ts:238`: `} else if (attr.type?.id === EXPRESSION_TYPE_ID || attr.type?.id ===
  ACTION_TYPE_ID) {`. The C1 report says so at `discovery_2026-09-26_sim_state_declarations.md:136-137`: «Nothing
  contextual (declared target, locality, `node` in a guard) runs there.» R-SIM-44 (`decisions.md:1808-1810`) keeps
  `simGuard` open to EString attributes. So a malformed guard on an EString attribute has no registry entry at all, and
  appears only at Reset [R, not measured: the demo presets type their guards `Expression`].
- **F2. The contextual rules live in the bridge, at Reset.** `simBridge.ts:231-238` (`guardDefectsOf`, parse and
  subset only) and `:246-300` (`actionDefectsOf`: parse, E-NODE, and for a folded target undeclared, read-only,
  locality, twice) [R]. Every row of §5.2 marked in the Reset column comes from these two [M].
- **F3. A target that does not fold is silent at Reset, whatever the reason.** `actionEvaluator.ts:159`: `if
  (dependsOnStep(target.object)) return null;` and `:164`: `return typeof id === 'string' && id !== '' ? { … } :
  null;`. The same `null` covers «depends on σ or the event» (A11, correctly left to the run) and «does not resolve to
  an element» (A4, A14, knowable before the run) [R]. That is C2's probe (4) [M].
- **F4. Guard reads are never folded.** `guardDefectsOf` looks at `g.defect` only (parse, subset). A `.[x]` read
  whose object does not depend on σ (`self.[visits]`, `p3.[visits]`, `t1.[tokens]`, `self.nextState.[coins]`) is
  judged at run time by `toJjelStateAccess` (`guardContext.ts:189-197`). There, `undefined` for an undeclared attribute
  or for `tokens` off a place makes the guard a defect [R; G3, G10, P4, P5 M].
- **F5. The subset checker is applied to guards whole, to actions for E-NODE only.** `actionEvaluator.ts:80`:
  `checkGuardSubset(parsed.action.value, text).some(d => d.code === 'E-NODE')`. The action evaluator is built without
  builtins (`:67-68`, «Path B … no builtins»), so `now()` on a right side always fails: A12 halts with `Function 'now'
  is not defined` [M], where the guard's E-CALL is a Reset defect (G8) [M].
- **F6. `else` with no sibling is silently true.** R-SIM-31(1) makes `else` the complement of its siblings;
  `resolveElse` (`netCompile.ts:145-165`) gives an `else` with an empty sibling group an `elseOf` of `[]`, the
  complement of nothing [R]. G9 fires, P3 compiles with no defect [M]. The two `else` defects that exist,
  `else-twice` and `else-position` (`netTypes.ts:201-203`), are net defects: the defects line lists them, the
  registry does not [R].
- **F7. `startRun` is the whole Reset check, pure and cheap.** `simBridge.ts:327-381`. It reads the lookup, never
  commits, and returns `compileDefects` next to the run [R]. It needs `buildEvalContext` injected (`:121`,
  `ContextBuilder`), which the editor has [R]. Median 1.6 ms on demoESM [M].
- **F8. The signature a producer would key on exists, but is computed only during a run.**
  `runSignature(lookup, modelId, configModelId)` (`simBridge.ts:391`) covers the model, the `sim*` keys of the bag,
  the objects with every slot, and the metamodel part [R]. The panel computes it only while a run exists,
  `SimulationPanel.tsx:607`: `(run ? runSignature((state as any)?.idlookup ?? {}, modelid, configModelId) : '')` [R].
  An always-on producer would pay it on every store change, as `useConformance` pays its own signature
  (`useConformance.ts:22-33`) [R]. Not measured.
- **F9. The form rail can attach an entry to its field only through `conformance` details.** `formDiagnostics.ts:95-98`
  [R]. A new kind without details lands in the rail's residue, as `duplicate-name` does. That is acceptable for a
  first lane (§7).
- **F10. `CompileDefect.element` is not always an M1 element.** `simBridge.ts:213-214`: «A guard's or an action's
  element; for a declaration, its name, `record N`, or `state attributes` for the key». A double assignment names the
  transition, `t.id` (`:287`), which for a fused fork/join is `node#edge` (`netTypes.ts:180-181`) [R]. A mapper has to
  split `#` and skip the declarations.

---

## 7. Design options

What a producer needs: the M1 model open in the editor (`modelid`); its metamodel's bag
(`lookup[lookup[modelid].instanceof]._state`); the rules; the two anchors (DObject, DVertex); ownership and revoke.

### Option A (recommended): a producer over `startRun`, one set of rules for both channels

- `problems/SimCheckProblemSync.tsx` (new), mounted at `EditorV2.tsx` next to `:4284`.
  - A `useSelector` signature: `runSignature` of the open M1 and its metamodel, or `''` when the bag has no
    `simGuard`, `simAction`, `simEntry` or `simExit`.
  - A 500 ms debounce, as `useConformance`.
  - Then `startRun(lookup, modelid, mm, projectId, buildEvalContext)` in a `try`, since `startRun` rethrows anything
    but `SimSnapshotError` (`simBridge.ts:344-347`).
  - A refused run publishes nothing and revokes what this model owns: no STC, no contextual check (R-SIM-17).
- `problems/simCheckToProblems.ts` (new, pure, node-testable like `validationToProblems.ts`):
  - input: `compileDefects` with `role` `'guard'` or `'action'`, plus the net defects `else-twice` and
    `else-position`;
  - output: entries of kind `'simulation'`, id `simulation:${nodeId}:${role}:${n}`, under the DObject and the resolved
    vertex, `ownerModelId: modelid`;
  - revoke through `getProblemIdsOwnedBy('simulation', modelid)`, then `markResolved`;
  - `clear` on unmount, as `ConformanceProblemSync.tsx:119-125`.
  - Title: `Guard`, `Action`, `Entry` or `Exit`. Description: the defect's `detail`, its `short` in the title of the
    dot.
  - Severity `error` for a guard defect (the transition never becomes a candidate, R-SIM-17). For an action defect,
    `warning` or `error` is decision 4 in §12; recommended `error`, since a fired transition halts the run.
- **Dedup with conformance.** A `parse-error` on a slot whose attribute type is `Pointer_EXPRESSION` or
  `Pointer_ACTION` is skipped: conformance already reports it (G1, A1, E1, P1 show both [M]). On an EString guard
  (R-SIM-44) it is kept, since nothing else reports it (F1).
- `problems/registry.ts`: `NodeProblemKind` gains `'simulation'`, with a comment in the form of `:29-36`.
- Consequences:
  - The registry and the defects line cannot disagree: one function makes both.
  - P2b's new rules reach the registry with no change to the producer.
  - The M2 declarations' defects (`role: 'declaration'`) stay out: they have no M1 element (F10). They are the ticket
    of §13.

### Option B: a producer with its own checker

A pure `model/simulation/stcChecks.ts` that the producer calls, parallel to the bridge. It adds a copy of
`actionDefectsOf`'s folding (`simBridge.ts:246-300`), which is the fourth-copy risk that `vertexResolver.ts:12-18`
names for another scan. The bridge and the registry would drift. Rejected.

### Option C: conformance carries the contextual checks

New `violationType`s in `validateConformance`, so the conformance producer and the rail's field attachment carry them
for free, and no file of `problems/` changes. Against:
- the folded rules need `buildEvalContext` and a frozen snapshot, which the pure validator does not import
  (`ConformanceValidator.ts:14-16`);
- the conformance pill would count simulator defects as conformance violations;
- `useConformance`'s signature does not cover the bag's `simStateAttributes` [R, `:22-40` window: object ids,
  metaclasses, slots, M2 fields], so a declaration change would not re-run it.

Possible for the syntax and by-name rules only. Not recommended.

### The problem kind (Rule 11)

- One literal, `'simulation'`, added to the exported union. §4.3 shows it breaks no consumer, so it is not an RC-26
  item on its own.
- Named for the concern, not the channel, so P2b's rules and a later M2 declarations producer can share it.
- Checked against collisions [M]: `command grep -rn "'simulation'"` over `frontend/src/components/editor-v2/problems`
  exit 1, and `command grep -rln "'simulation'" --include='*.ts' --include='*.tsx'` over `frontend/src` no file.
  Positive control, same tool: `command grep -rln "'validation'"` over `problems/`, exit 0, 4 files. Phase 2 repeats
  the grep before adding the literal (P2).
- No new optional property on `NodeProblem` in P2a: the rail shows the entry in its residue (F9). Per-field
  attachment (a `feature?: string` read by `formDiagnostics.ts`) touches `viewpoint/ir/`, another §3.1 row, and is
  deferred.

---

## 8. The rules neither channel has (P2b)

In a new pure module `model/simulation/stcChecks.ts`, called by `guardDefectsOf` and `actionDefectsOf`, so Reset and
the registry gain them together. Each rule closes rows of §5.2.

| Rule | Closes | Needs |
|---|---|---|
| R1. A `.[x]` read or target whose attribute name no declaration has, and which is not `marked`/`tokens` | G3, P4, A10 (and A3 already) | the AST and the declarations |
| R2. A guard `.[x]` read whose object folds (no σ, no `event`), judged like a folded target: no element, undeclared on the element, `tokens`/`marked` off a place | G4, G10, P5 | the snapshot, the places |
| R3. A folded action target that does not resolve to an element: `unresolved` | A4 (C2 probe 4), A14 | split `foldActionTarget`'s `null` (F3), in a new function |
| R4. The subset checker's `error` codes on an action's right side, not only E-NODE | A12 | `checkGuardSubset` on `value` |
| R5. A right side that folds to a non-scalar, or to a literal outside a semantic target's domain | A13, A9 | the snapshot, `inDomain` |
| R6 (option). A guard whose top level is a `.[x]` read of an attribute declared with a non-boolean domain | G5 | the declarations |

Out of P2b: `else` with no sibling (F6, G9, P3), decision 1 of §12; the warnings W-* and T-* (G6, G7), which R-SIM-61
keeps off the line; A11 and every value that depends on σ or the event, which stay run-time halts (R-SIM-70's «halt a
run time come rete di sicurezza»).

`CompileDefect.reason` gains `'unresolved'` and `'value'` (R3, R5): an exported union of literals, additive, as
R-SIM-70 already authorized for the same field (`decisions.md:2002-2003`, «`CompileDefect.role` e `reason` si
allargano (Rule 11 autorizzata: unione di letterali, additiva)»).

---

## 9. Tests

**P2a** (`problems/__tests__/simCheckToProblems.test.ts`, node env):
- a guard defect registers under the DObject and the vertex;
- the second anchor is skipped when the resolver returns the same id or `null`;
- a `parse-error` on an `Expression`/`Action` slot is skipped, and kept on an EString slot;
- a declaration defect is never published;
- `node#edge` is split to the edge;
- revoke by owner: another model's entries and another kind's are untouched;
- `markResolved` on the entries no longer wanted;
- `clear` on unmount.

The reconcile body is exported for the test, as `reconcileDuplicateProblems` is (`UniquenessProblemSync.tsx:122-127`).
It is driven through `startRun` with the node fixtures of `sim/__tests__/simBridge.test.ts`, so the probe executes the
subject (P11). Mutation bench: drop the dedup, drop the vertex anchor, revoke by kind only, keep declarations.

**P2b** (`model/simulation/__tests__/stcChecks.test.ts` new, `sim/__tests__/simBridge.test.ts`):
- one test per rule R1-R5, each on the rows of §5.2 it closes;
- A11 stays silent at Reset (the negative control of R3);
- A0 and G0 stay clean.
- Mutation bench: one mutant per rule, plus R3 answering `unresolved` for a σ-dependent target.

**Visual** (P2a, RC-23 checklist on the lane's port):
- the E-NODE guard on `tp` lights a dot on `tp`'s node and a line in the rail residue;
- after the fix the dot turns `resolved`, then leaves;
- the ESM before declarations shows 2 entries, after them 0.

---

## 10. R- rows touched

- **R-SIM-17** (ratified): «Il controllo contestuale … spetta al ruolo che consuma il valore, cioè alla STC» and the
  malformed value «entra nel registro dei problemi» (`decisions.md:1532-1537`). P2a implements it as written.
- **R-VAL-7** (ratified): the registry is where a violation of the model lands (`decisions.md:4053-4057`). A guard
  text on an M1 instance is data of the model, so the registry is its authoring channel. Consistent.
- **R-SIM-43** (ratified): «il controllo statico arriva con il checker tipato di C» (`decisions.md:1796-1802`). R2
  and R3 are that static check for the σ-free paths, not the typed checker. They complete the row and do not amend it.
- **R-SIM-61** (ratified): «Solo difetti: gli avvisi del checker di sottoinsieme non si elencano». The recommendation
  keeps warnings out of the registry too, so the row is unchanged.
- **R-SIM-70** (provisional, unattended): the list of Reset action defects grows by R3-R5 and the reason union by two
  literals. Amending a provisional row is not RC-26; P2b writes the row.
- **R-SIM-44** (ratified): EString guards keep no syntax check in conformance. P2a's dedup keeps their parse error. No
  amendment.
- **R-SIM-31(1), R-SIM-64, R-SIM-84**: untouched, unless decision 1 of §12 says otherwise.
- **R-EDGE-3 / S24**: the saved-states detector would share `problems/registry.ts` (a second literal). It queues
  after P2a (backlog report §5 wave 3).

---

## 11. Risks

1. **The demo changes.** With P2a, the ESM's `tc` and `tp` and Flow B's `f2` carry problem entries between Apply and
   the declarations: dots on the nodes, lines in the tree and the rail (§5.3). This is RC-26, and it is handled by
   merging after MODELS (answer E).
2. **Cost on a large model.** Measured on 17 DObjects only. `buildEvalContext` walks the project's M1 objects (`eval.ts`
   `:134`, «Collect raw M1 L-proxy objects first») and `runSignature` walks the model's slots on every store change.
   P2a measures both on a large fixture before wiring and names the threshold. Fallback: key the effect on
   `useConformance`'s result plus the bag's `sim*` string.
3. **Two dots for one parse error.** Avoided by the dedup rule. Without it, G1/A1/E1/P1 would carry a `conformance`
   and a `simulation` entry each.
4. **`startRun` changes under the producer.** Wave-3 lanes touch `simBridge.ts` (S5 off-resolver, S13 glyph, S1/S2
   derived diagnostics, S14). P2a only calls the exported `startRun` and reads `CompileDefect`, so a new reason
   literal flows through untouched. A renamed field would break it at compile time, not silently.
5. **The run and the producer disagree in time.** The producer's `startRun` sees the lookup of its debounce, the
   panel's run the lookup of the last Reset. They can differ during an edit, as conformance does today. R-VAL-18's
   «never stale» rule is kept by revoking on every signature change.
6. **The dot sits on transitions drawn as edges.** In these presets `tp`, `tc`, `t2` have vertices (§5.3). A
   transition rendered as an edge (`irobj_*`) gets no dot (`validationToProblems.ts:47-49`, «LIMITE DICHIARATO»);
   the tree and the rail still show it.
7. **The console ecore-loop errors** of probe 1 (216) appear with several presets in one page. They are unrelated to
   this lane, and the Phase 2 probe should build one preset per page.

---

## 12. Decisions awaiting Alfonso (RC-26)

1. **`else` with no sibling** (F6; G9, P3). Today it is always true, with no word to the author. Making it a defect
   amends the ratified R-SIM-31(1). Recommended: no change in Phase 2; a ticket, revisited with the typed checker.
2. **The critical-zone go-ahead for P2a** (`problems/`, §3.1). The Layer Impact Report of §14 goes to `docs/lir/` as
   P2a's first step. The go-ahead goes in the launch (`--critical-zone-goahead`, RC-30). Timing is already ratified:
   after MODELS (answer E).

The demo change of risk 1 is covered by answer E and needs no new word.

## 13. Decisions taken (unattended)

1. Option A over B and C: one set of rules for Reset and the registry (§7).
2. One new kind, `'simulation'`, and no new `NodeProblem` property in P2a (F9).
3. Dedup: a parse error on an `Expression`/`Action` slot stays conformance's only.
4. Severity `error` for guard and action defects alike: a defective guard removes its transition, a defective action
   halts it (R-SIM-70).
5. Declarations' defects stay out of the registry. They have no M1 element (F10). A ticket for an M2 anchor (the
   metaclass node) is opened with this entry.
6. Warnings (W-*, T-*) stay out of the registry, in line with R-SIM-61.
7. P2a before P2b. P2a gives the channel with today's rules; P2b's rules then reach both channels, and P2b queues
   behind the `simBridge.ts` lanes.
8. The probes read the registry through `window._jjNodeProblems` and fired inputs through the panel. The slots were
   set through the L proxy, the way the builder sets them, not by typing into the rail (declared in §5.1).

---

## 14. Recommended Phase 2 lanes, and the draft Layer Impact Report

### P2a `sim-checker-registry`: full (critical zone), after MODELS, visual check

Files:
- `frontend/src/components/editor-v2/problems/registry.ts`: `'simulation'` added to `NodeProblemKind`, comment;
- `frontend/src/components/editor-v2/problems/simCheckToProblems.ts` (new);
- `frontend/src/components/editor-v2/problems/SimCheckProblemSync.tsx` (new);
- `frontend/src/components/editor-v2/EditorV2.tsx`: one import and one mount line beside `:4284`;
- `frontend/src/components/editor-v2/problems/__tests__/simCheckToProblems.test.ts` (new);
- docs: `docs/lir/…`, `docs/decisions.md` (an R-SIM row for the producer), the inbox.

Five code paths: Rule 19 applies, and the list is stated before the first edit. Gates are those of the backlog report
§5, plus the RC-23 checklist of §9 and Alfonso's GO (critical zone).

```
LAYER IMPACT REPORT (draft, P2a)

Layers touched:
  [ ] D-layer (Redux raw data)          read only: idlookup through useSelector and store.getState
  [ ] L-layer (computed proxies)        read only, inside buildEvalContext (as the panel's Reset)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   indirectly: NodeProblemIndicator on ObjectNode shows new entries
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Problems registry (critical-zone directory, §3.1):
  - What changes: one literal in NodeProblemKind; a fourth producer writing kind 'simulation',
    ownerModelId = the open M1, revoke by getProblemIdsOwnedBy('simulation', modelid).
  - What does NOT change: the store, the three producers, their ids and kinds, the consumers
    (indicator, overlay, tree, formDiagnostics), NodeProblem's shape.
  - Cross-layer interaction: reads the metamodel's bag and the M1 through startRun (pure over the
    lookup); writes nothing to Redux; no TRANSACTION, no creator (Rule 12 not engaged).
  - Side-effect safety: startRun builds a run object that is discarded; the panel's run singleton
    (simRunState) is never touched; buildEvalContext is the call the panel's Reset makes.

Canvas v2-flow:
  - What changes: a dot on the vertex of an element with a guard/action defect.
  - What does NOT change: nodes, edges, handles, layout; no ReactFlow state is written.

Smoke-test scenarios potentially affected:
  - ESM demo (script §2.3) between Apply and the declarations: 2 new entries (tc, tp), 0 after.
  - Flow B demo (§2.4) before declaring count: 1 new entry (f2).
  - Petri and State machine demos: none (measured 0 Reset defects).
  - A model with no sim* role bound: none (the producer is inert).
  - Open two models of one metamodel: each revokes only its own entries (ownerModelId).
  - Close the editor: the model's 'simulation' entries are cleared.
```

### P2b `sim-checker-rules`: full (more than 3 files; an exported union extended), after MODELS, no visual check

Files:
- `frontend/src/model/simulation/stcChecks.ts` (new);
- `frontend/src/components/editor-v2/sim/simBridge.ts`: `guardDefectsOf` and `actionDefectsOf` call it;
  `CompileDefect.reason` gains `'unresolved'` and `'value'`;
- `frontend/src/model/simulation/__tests__/stcChecks.test.ts` (new);
- `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`;
- docs: the R-SIM-70 extension in `docs/decisions.md`, the inbox.

No critical-zone file. It shares `simBridge.ts` and its test with S1/S2, S5, S13 and S14, so it queues with its merge
position fixed (RC-22). The defects line gains the new reasons with no panel change: `defectShort` falls back to the
detail (`simBridge.ts:562`) [R].

---

## 15. Questions for the chat

1. Launch P2a and P2b as two lanes after MODELS in that order, or P2b first since it needs no go-ahead?
2. Should P2a's probe build one preset per page, to keep the ecore-loop errors of risk 7 out of its console baseline?
