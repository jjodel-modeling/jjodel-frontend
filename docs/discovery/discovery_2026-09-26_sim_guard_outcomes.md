# Discovery — the Simulation panel shows why a guard is false or defective

- Prompt-ID: `P-2026-09-26-1315` (`docs/prompts/claude_2026-09-26_1315_prompt_sim_guard_outcomes_discovery.md`), chat `C-2026-09-26-1100`
- Session: `935b4b47-404e-4ec8-a4dc-8767776b42c7`
- Tree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `d15cef944` (parent `6aeda5de4`)
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- Phase 1, read-only. No source file edited. Measurements on a dev server on 3002 started from this tree
  and stopped at the end.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the files.

## 0. Answer in brief

- The core already computes every outcome the ticket needs. After a Reset in the four cases of the
  ticket, the ε candidate set of `b2net` carries `false`, `parse-error`, `subset` (`E-NODE`) and
  `exception` in its `evaluated` list [M]. The panel never renders that list.
- **C alone covers the four cases.** C is a reason for every input in `Deadlock`, recomputed in the
  bridge from the `SimRun` over the evaluation `netRunStatus` already runs. It needs no core change and
  no interface change, only new bridge exports. The recomputation costs microseconds [M]. The panel
  does not re-render on the sim version, and its `view` memo runs on `tick` only [R].
- **B covers none of the four in `b2net`.** The label of the step that leads to `Deadlock` was
  evaluated on the configuration before the step: it says `t1: true` [M]. In the three defect cases the
  run is in `Deadlock` right after Reset, so the Step button is off and no step exists to label [M].
- **A covers two of the four** (`parse-error`, `E-NODE`), and it catches them while the run is still
  `Running`, on a branch not reached yet. Lane C needs A: action compile defects today surface only as
  a halt when their site fires (`actionEvaluator.ts:5-7`).
- Recommended: **C + A**. C goes in the status row, one line with no change of height. A merges into
  the existing «not compiled» line. Add the one-line fix of the discard wording, which today reads «no
  transition accepted it» when a guard was false [M]. B is deferred to the trace (R-SIM-25).
- The panel already shifts its layout today [M]. When the «Last step» line wraps, the Step button
  moves up 17 px, because the panel is anchored at the bottom and grows upward.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|------------|---------|----------|
| H1 | The core computes every outcome the four cases need; no core change is required | **holds** | §3.3, §4.1: `candidates(...).evaluated` in `Deadlock` holds `false`, `parse-error`, `subset`, `exception` [M] |
| H2 | B (the evaluated guards of the last step) covers the four cases | **falsified** | §4.1 `b2.step2`: the label is `t1: true`, the status is `Deadlock`; Step is disabled after Reset in the defect cases [M] |
| H3 | The guard compile defects are unreachable from the panel without a new export | **partly** | the oracle returns the compile defect before it looks at the context (`guardEvaluator.ts:89`), so the defects are reachable through `run.guards`. The source text and a clean list are not [R] |
| H4 | Evaluating every input on every render is a cost to fear | **falsified** | the panel does not subscribe to the version, and its memo runs on `tick` (§3.4) [R]; the recomputation costs 0.002–0.008 ms (§4.3) [M] |
| H5 | The panel keeps its height stable today | **falsified** | the Push discard line wraps to two lines: panel 203 → 219 px, Step top 799 → 782 [M] |
| H6 | The per-input result of `netRunStatus` can be returned instead of recomputed without breaking callers | **partly** | a change of return type breaks 23 call sites [R]; a sibling export breaks none, but touches `netStep.ts` |

## 2. Objective and files read

Objective: map what the core and the bridge already produce about guard outcomes, at Reset, after a
step and in a stopped status. Measure the raw outcomes the panel would render, and give three options
with their cost so that the chat can ratify one design that also holds for the action defects of
lane C.

Files read, full paths:

- `/Users/alfonso/jjodel-sim/docs/prompts/claude_2026-09-26_1315_prompt_sim_guard_outcomes_discovery.md`
- `/Users/alfonso/jjodel-sim/docs/prompts/claude_2026-09-26_1105_fase2_state_operator_b2.md`
- `/Users/alfonso/jjodel-sim/docs/log-inbox/simulation.md` (whole; the B2 entry and the ticket)
- `/Users/alfonso/jjodel-sim/docs/claude-code-log.md` (lines 1-120)
- `/Users/alfonso/jjodel-sim/docs/decisions.md` (lines 1374-1440, 1505-1605, 1636-1680: R-SIM-16..19, R-SIM-28..37, R-SIM-39..46)
- `/Users/alfonso/jjodel-sim/docs/spec/claude_spec_2026-09-13_computational_model.md` (lines 95-182: §4, §5)
- `/Users/alfonso/jjodel-sim/docs/discovery/discovery_2026-09-25_state_operator_core_types.md` (§7.3, §7.4: lines 435-474)
- `/Users/alfonso/jjodel-sim/docs/DESIGN-SYSTEM.md` (lines 22, 322-328)
- `/Users/alfonso/jjodel-sim/docs/PROTOCOL.md` (lines 280-310, P14)
- `/Users/alfonso/jjodel-sim/frontend/src/styles/CLAUDE.md` (lines 1-40)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/simBridge.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/simRunState.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/simulation-panel.scss` (lines 1-200, 405-516)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` (test list; lines 194-235, 361-431)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/__tests__/simRunState.test.ts` (test list)
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/netStep.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/netTypes.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/guardEvaluator.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/guardContext.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/actionEvaluator.ts` (whole)
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/objectSlots.ts` (lines 47-73)
- `/Users/alfonso/jjodel-sim/frontend/src/model/logicWrapper/LModelElement.tsx` (lines 6035-6070, `DObject.autoName`)
- `/Users/alfonso/jjodel-sim/frontend/src/hooks/useInterfaceMode.ts` (lines 1-40)
- `/Users/alfonso/jjodel-sim/frontend/scripts/smoke/_tmp_sim3b_scenarios.js`, `_tmp_b2_scenario.js`, `_tmp_b2_visual.ts`, `_tmp_b2_vite.config.ts` (whole, gitignored)

The prompt names «the console snippet of the B2 report». The B2 lane wrote no discovery report. The
snippet it means is the `read` function of `_tmp_b2_visual.ts:39-58`, which calls `candidates` over
the stored run for ε only. The measurement here uses the same function, extended to every input.

## 3. What exists [R]

### 3.1 After Reset: compile defects

Net defects are reachable today. `startRun` puts them on the run, and the panel prints them:

- `simBridge.ts:291` — `export function defectsLine(net: CompiledNet, lookup: Lookup): string | null {`
- `SimulationPanel.tsx:316` — `setDefects(defectsLine(started.run.net, lookup));`
- `SimulationPanel.tsx:559` — `{defects && <div className="sim-panel__hint sim-panel__hint--warning">{defects}</div>}`

The guard compile defects are closed inside the oracle. `compileGuards` builds a
`Map<string, CompiledGuard>` (`simBridge.ts:127-139`), and the only consumer of that map is
`makeGuardOracle`:

- `simBridge.ts:190` — `guards: makeGuardOracle(snapshot, compileGuards(net, stc, lookup), net.places),`
- `simRunState.ts:40` — `readonly guards: GuardOracle;` (the `SimRun` holds the closure, not the map)
- `guardEvaluator.ts:44-45` — `/** Set when the guard never runs: it does not parse, or the checker reports an error. */` / `readonly defect: { readonly reason: 'parse-error' | 'subset'; readonly detail: string } | null;`

The oracle can still reach them without a new export. `evaluateGuard` answers the compile defect
before it looks at the context:

- `guardEvaluator.ts:89` — `if (guard.defect) return { kind: 'defect', reason: guard.defect.reason, detail: guard.defect.detail };`
- `guardEvaluator.ts:91` — `if (ctx === null) {` (checked after the compile defect)

The bridge could therefore call `run.guards(site, null, stateAccess(run.config.state))` on every
`run.net.transitions[i].guardSites` entry and keep the outcomes whose reason is `parse-error` or
`subset`. That path rests on the order of two `if`s. It also loses the guard's source text, which only
`CompiledGuard.source` holds (`guardEvaluator.ts:39`). The explicit path is for `startRun` to return
the defects of the map it already has, in an optional field of `RunStart` (§5, option A).

The subset warnings, `CompiledGuard.diagnostics` with `severity` other than `error`
(`guardEvaluator.ts:42-43`), are closed inside the oracle as well, and no path reaches them.

### 3.2 After a step: `NetLabel.evaluated`

The data reaches the panel and is dropped there:

- `simBridge.ts:323-329` — `export interface InputPress {` … `readonly outcome: StepOutcome | null;`
- `simBridge.ts:372` — `return { pending: null, lastStep: lastStepText(outcome, run.net, lookup, input), outcome };`
- `SimulationPanel.tsx:340-342` — `const pressed = pressInput(modelid, event, selector, lookup, input);` / `setPending(...)` / `if (pressed.lastStep !== null) setLastStep(pressed.lastStep);` (`pressed.outcome` is never read)
- `netStep.ts:213-214` — `const label: NetLabel = {` / `event, selector, candidates: cs.candidates.map(c => c.transition), evaluated: cs.evaluated,`

The label is computed on the configuration **before** the step (`netStep.ts:211`,
`const cs = candidates(net, cfg, guards);`), as spec §4.5 wants: «the outcome of every guard
evaluated on the candidates, including the ones not chosen». The label of a step does not tell why
the configuration after it has no candidate (§4.1).

`lastStepText` ignores `evaluated`, and its discard text states a cause it does not check:

- `simBridge.ts:338-339` — `case 'discard':` / ``return `${input}: discarded, no transition accepted it`;``

### 3.3 In a stopped status: why no input has a candidate

`netRunStatus` evaluates the candidate set of every input and keeps only the count:

- `netStep.ts:273-276` — `for (const event of [null, ...alphabet]) {` / `if (candidates(net, { state: cfg.state, event }, guards).candidates.length > 0) return 'Running';` / `}` / `return 'Deadlock';`

In `Deadlock` it has evaluated all 1 + |alphabet| inputs. In `Running` it stops at the first input
that has a candidate. `Terminated` and `Halted` return before the loop (`netStep.ts:271-272`).

The result can be recomputed. Every ingredient is on the `SimRun` (`net`, `config`, `alphabet`,
`guards`, `simRunState.ts:33-46`), and `candidates` is exported (`netStep.ts:143`). The guard oracle
is deterministic over a frozen snapshot and has no builtins (`guardEvaluator.ts:14-19`: «a guard has
none of them: no clock, no conversions»), so a second evaluation gives the same answer.

The result can also be returned, at one of two costs:

- Changing the return type of `netRunStatus` breaks its callers: 23 calls outside its definition
  (`command grep -rn "netRunStatus(" frontend/src | grep -v "export function" | wc -l` → 23; one
  production caller, `SimulationPanel.tsx:273`, the other 22 in four test files).
- A sibling export (for example `netRunInputs(net, cfg, alphabet, guards, halt)` returning
  `{ status, inputs: CandidateSet[] }`, with `netRunStatus` delegating to it) breaks nothing. It
  touches `netStep.ts` and its tests, and it drops the short-circuit in `Running` when all inputs are
  asked for.

What an entry of `evaluated` can say (`netTypes.ts:207-219`):

- `netTypes.ts:208-211` — `export type Evaluation =` / `| GuardOutcome` / `| { readonly kind: 'inhibited'; readonly place: string }` / `| { readonly kind: 'else'; readonly outcome: GuardOutcome };`
- `netStep.ts:163` — `if (t.guardSites.length > 0) evaluated.push({ transition: t.id, outcome: g });`: a transition with no guard, structurally enabled, is a candidate with no entry. A transition that is not structurally enabled (wrong input, preset not enabled) has no entry either (`netStep.ts:151`).
- `netStep.ts:113-114` — `const g = guardOf(sibling, event, access, guards);` / `if (g.kind === 'defect') return g;`: an `else` with a defective sibling carries the sibling's detail, not its name.

So, for an input with no candidate, an empty `evaluated` list means that nothing accepts that input
from the current marking. A non-empty list names each blocked transition and its reason.

### 3.4 When the panel evaluates

- `SimulationPanel.tsx:269-281` — the `view` memo calls `netRunStatus` with deps `[isModelMode, rolesComplete, modelid, tick]`; `:280` — `// tick is the real input of this memo: the run changes only through this panel.`
- The panel does not subscribe to the version. `command grep -n "useSimVersion\|getSimVersion" sim/SimulationPanel.tsx` exits 1. The positive control `command grep -n "useSimVersion" nodes/ObjectNode.tsx` matches line 40.
- It re-renders on connect props (primitives, `SimulationPanel.tsx:24-26`), its own state, and `useSelector(liveSignature)` (`:253-254`). None of these recomputes the memo unless `tick` moves.

A reason computed inside the same memo runs once per panel action (Reset, a press, Stop, an
interruption), never on the version. R-SIM-36 already holds for it.

### 3.5 Texts, names, sizes

- Names: `elementName` (`simBridge.ts:94-97`) uses `lookup[id].name`, then `objectLabel`, then `shortId` (`objectSlots.ts:47-48`, ``return id.length > 8 ? `…${id.slice(-4)}` : id;``). Every new `DObject` gets an auto name `Class_N` (`LModelElement.tsx:6035-6060`, `prefixOf(meta) + '0'` increased). So a `…xxxx` label appears only for a name the user cleared, or for an id that is not in the lookup. The real ambiguity is an auto name such as `FEdge_3`, which does not say where the arc goes. A fused fork/join transition has the id `node#edge`, and `candidateLabel` names it after the node (`simBridge.ts:285`), so two fused transitions of one node read alike.
- Panel geometry: `simulation-panel.scss:55-56` — `left: calc(200px + 30px + 58px + 16px);` / `bottom: 16px;` and `:62` — `width: 288px;`. The panel is anchored at the bottom and grows upward. Its hints wrap: `:182-189` `&__hint {` … `font-size: 11px;` … `overflow-wrap: anywhere;`. The status row is one line: `:479-490`.
- Design rules: `DESIGN-SYSTEM.md:328` — «Components use fixed dimensions. No reflow on state change.»; `:324` — «All panels support Basic/Advanced modes.»; `:22` — secondary text 11px.
- Basic/Advanced: the panel does not read the mode. `command grep -n -i "interfaceMode\|isAdvancedMode\|advanced" sim/SimulationPanel.tsx` exits 1. The positive control, `isAdvancedMode` in `EditorV2.tsx`, matches 3 lines. The accessor exists: `useInterfaceMode.ts:21-29`, `getInterfaceMode()`, default `'basic'`.

## 4. Measurements [M]

Environment: `npx vite` on 3002 from `~/jjodel-sim` at `d15cef944`, with the cache in the tree's own
`frontend/.vite-cache` (P14) and the config in the session scratchpad (`fs.allow` for the
`node_modules` symlink). The browser was Playwright Chromium at 1600×1000, seeded with
`seed(ctx, true)` (Advanced), on project `Pointer_RowViewSmokeProject`. The fixtures ran in order:
`_tmp_sim3b_scenarios.js`, then `_tmp_b2_scenario.js`. Three scripts in the scratchpad drove them
(`measure_1315.ts`, `measure_1315b.ts`, `measure_net.ts`); none is committed. Each state was
reached through the real panel buttons (Reset, Step, event buttons), except where noted. Each read
records the panel DOM and, for every input among ε and the alphabet,
`candidates(run.net, { state: run.config.state, event }, run.guards)` over the stored run. Transition
names are resolved through the lookup. Console errors: one, `failed to get project {project: null}`,
the known one at load (B2 entry Notes).

### 4.1 `b2net` (p1 with 3 tokens → t1 → p2, k = 3)

| State | Panel status | Step | ε candidates | ε `evaluated` |
|-------|--------------|------|--------------|---------------|
| Reset, guard `p2.[tokens] < 2` | Running | on | `t1` | `t1: {kind: true}` |
| after step 1 (p1 2, p2 1) | Running | on | `t1` | `t1: {kind: true}` |
| after step 2 (p1 1, p2 2) | **Deadlock** | off | — | `t1: {kind: false}` |
| Reset, `p2.[tokens] <` | Deadlock | off | — | `t1: {kind: defect, reason: parse-error, detail: "1:14 Expected expression"}` |
| Reset, `a b` | Deadlock | off | — | `t1: {defect, parse-error, "1:3 Unexpected 'b' after the end of the expression"}` |
| Reset, `node.[x] > 0` | Deadlock | off | — | `t1: {defect, subset, "E-NODE: \`node\` is presentation state: a guard cannot depend on it (R-SIM-18)."}` |
| Reset, `p2.[visits] > 0` | Deadlock | off | — | `t1: {defect, exception, "JjelEvaluationError: 'visits' is not a state attribute of p2"}` |
| Reset, `t1.[tokens] == 0` | Deadlock | off | — | `t1: {defect, exception, "JjelEvaluationError: 'tokens' is not a state attribute of t1"}` |
| Reset, `1 + 1` | Deadlock | off | — | `t1: {defect, non-boolean, "the guard returned number, not a boolean"}` |
| Reset, a 4-conjunct guard of 117 characters | Running | on | `t1` | `t1: {kind: true}` |

In every row the panel's only hint is `Last step: Reset` or `Last step: ε: t1 (p1 → p2) fired`, and
`defects` is empty (`netDefects: []`). The status never says why. In the step-2 row the label of the
step that led there is `t1: true`, measured one row above on p2 = 1: B would show `true` next to
`Deadlock`. The core status and the panel status agree in every row.

### 4.2 `else`, inhibitor, events

- **`flow`** (a decision with `else`). After step 1 (S → D): ε candidates `e3`, and `evaluated` holds `e2: {false}` and `e3: {kind: else, outcome: {true}}`. After step 2: `Terminated`, and the ε set is `{terminated: true, evaluated: []}`. With e2's guard set to `model.nope > 0`, after step 1 the status is `Deadlock`, and `evaluated` holds `e2: {defect, absent-identifier, "'nope' does not exist"}` and `e3: {else, outcome: {defect, absent-identifier, "'nope' does not exist"}}`. The `else` repeats the sibling's detail without naming e2.
- **`net`** (fork, AND-join, inhibitor a1 ⊸ tb, k = 2), on the pure core through `startRun`, then `step` without commit. The panel could not be switched to this model in the harness: the first two scripts read b2net's panel instead, and those reads are discarded. After `tf` (a1 1, b1 1), the ε candidates are `ta`, and `evaluated` holds `tb: {kind: inhibited, place: <a1 id>}`. `step(..., 'tb')` returns `inadmissible`, and the label's `evaluated` holds the same entry. After `ta` the label of that step still carries `tb: inhibited` (a transition not chosen, spec §4.5), and `tb` is then a candidate. The `place` is an id: the panel must resolve it.
- **`turnstile`** (events, no guard role), after Reset: `Running`, Step off, `Coin` and `Push` on. ε has candidates `[]` and `evaluated: []`; coin has `tCoin` and `[]`; push has `tPushL` and `[]`. Without a guard role, `evaluated` is empty for every input: a reason can only speak of structure.
- **`turnstile` with a guard role.** Added in the browser: an `Expression` attribute `guard` on `TTrans`, `simGuard` in the bag, `tCoin: event.label == "Coin"`, `tPushL: false`, `tPushU: self.[visits] > 0`. The PEST SM shape was not measured; this is the 3b scenario with events.
  - Reset: `Running`, both buttons on. ε `[]`/`[]`; coin `tCoin`/`tCoin: true`; push has no candidate and `tPushL: false`. This is the case «`Running` with an input that has no candidate».
  - Press Push: a discard, and the panel prints **`Last step: Push: discarded, no transition accepted it`**. The text is false: `tPushL` accepted Push, and its guard was false.
  - Press Coin: `Deadlock`, both buttons off. ε `[]`; coin `[]` (tCoin's preset is not marked); push `tPushU: {defect, exception, "JjelEvaluationError: 'visits' is not a state attribute of tPushU"}`.

### 4.3 Cost

These are the per-call means inside the page. They count 1000 or 2000 iterations of `candidates` for
every input, of `netRunStatus`, and of one guard call:

| Run | Inputs | Transitions | All inputs | `netRunStatus` | One guard |
|-----|--------|-------------|------------|----------------|-----------|
| turnstile with guards, at Unlocked (Deadlock; one guard that throws) | 3 | 3 | 0.0078 ms | 0.0102 ms | — |
| b2net, 4-conjunct guard, at Reset (Running) | 1 | 1 | 0.0018 / 0.0020 ms (two runs) | — | 0.0022 / 0.0010 ms |

The cost of every input is (1 + |alphabet|) passes over the transitions, plus one guard call for each
structurally enabled guarded transition. For a model 100 times larger, the order is still below a
millisecond per panel action. That figure is an extrapolation, not measured.

### 4.4 Height of the panel

These are bounding rects in viewport pixels:

| State | Panel top / height | Step top |
|-------|--------------------|----------|
| b2net, every state of §4.1 (every hint on one line) | 805 / 147 | 855 |
| turnstile, Reset (events section) | 749 / 203 | 799 |
| turnstile with guards, after the Push discard (the «Last step» line wraps to 2 lines) | 732 / 219 | **782** |
| turnstile with guards, after Coin (one line again) | 749 / 203 | 799 |

Whenever a line wraps, the Reset, Step and event buttons move 17 px under the cursor. Every text that
can grow below the actions row makes this shift today.

## 5. Options

The three options of the prompt, then the fix of the discard wording. No file of the §3.1 critical zone
is touched by any of them. There is no sync or D-L layer, so no Layer Impact Report is needed.

### A — a «not compiled» line for guards after Reset

- **Data.** `startRun` keeps the `CompiledGuard` entries whose `defect !== null` from the map it
  builds at `simBridge.ts:190`. It returns them on the `started` variant of `RunStart` as an optional
  field, for example `guardDefects?: readonly { site; reason; detail; source }[]`.
  `simRunState.ts` is untouched. The alternative with no interface change goes through the oracle,
  as in §3.1. It rests on the order of two `if`s in `evaluateGuard`, and it loses the source text.
- **Files.** `simBridge.ts` (the field in `startRun`, and a text function; either a new
  `guardDefectsLine` or an optional parameter of `defectsLine`), `SimulationPanel.tsx` (`onReset`
  composes one line), `__tests__/simBridge.test.ts`.
- **Interfaces.** `RunStart` gains an optional field (Rule 11). There is one new export, or one
  optional parameter.
- **Tests.** `parse-error`, `a b` and `E-NODE` are listed; `false`, `exception`, `non-boolean` and
  `absent-identifier` are not, because they happen at run time. The site is named. The first three
  are shown, then a count. Mutants: the list is always empty; a run-time defect is listed; the name
  of another element is printed; there is no truncation.
- **The four cases.** A shows nothing for `false` and nothing for `p2.[visits]` (run time). It shows
  the `parse-error` and `E-NODE` defects.
- **Height.** A merges into the existing warning line, which already appears at Reset, a user
  action. That line can wrap, as `defectsLine` does today.
- **Lane C.** `CompiledAction.defect` (`actionEvaluator.ts:45-46`) is today «reported when its site
  is evaluated, so the core halts the step with `action-defect`» (`:5-7`). With A, lane C lists these
  defects at Reset in the same line, from the same field (renamed in general form, for example
  `compileDefects`). A declaration defect of lane C is compile-time too, and goes there or into
  `NetDefect`.

### B — the evaluated guards under «Last step»

- **Data.** `pressed.outcome.label.evaluated` is already in the panel's hands (§3.2); it needs no
  new data.
- **Files.** `simBridge.ts` (a text function over `label.evaluated`; either inside `lastStepText` or
  a new optional field `InputPress.guards?: string | null`), `SimulationPanel.tsx` (one state and one
  line), `simulation-panel.scss` if the line is clamped, `__tests__/simBridge.test.ts`.
- **Interfaces.** `InputPress` gains an optional field, or no interface changes if the text extends
  `lastStep`.
- **Tests.** One per outcome kind: `true`, `false`, each defect reason, `else`, `inhibited`. The
  truncation.
- **The four cases.** B shows **none** of them in b2net. For `false`, the last label says `t1: true`
  (§4.1). For the three defects, Step is off after Reset, so no label exists. B does show the reason
  of the turnstile Push discard (`tPushL: false`), but after the press, not before it.
- **Height.** Every press can change the length of the line, which is the 17 px shift of §4.4 on
  every step, unless the line is clamped to one row.

### C — a reason for every input in a stopped status

- **Data.** C1, recommended: a bridge function recomputes `candidates` for ε and each event from the
  `SimRun`, inside the panel's `view` memo (`tick`), only when the status is `Deadlock` (all inputs)
  or `Running` (the inputs whose button is on). It is deterministic (§3.3). The cost is microseconds
  (§4.3), and in `Deadlock` it doubles the loop `netRunStatus` already ran. C2: the sibling core
  export of §3.3. It avoids the double evaluation, but touches `netStep.ts` and its tests.
- **Files, C1.** `simBridge.ts` (a new export, for example `stopReason(run, status, lookup, labels)`
  → `{ line, details } | null`), `SimulationPanel.tsx` (the memo, the status row, the button titles),
  `simulation-panel.scss` (a one-line reason with ellipsis in the status row, and the details list),
  `__tests__/simBridge.test.ts`. That is four files. C2 adds `model/simulation/netStep.ts` and
  `__tests__/netStep.test.ts`.
- **Interfaces.** C1 adds new exports only. C2 adds a new core export; `netRunStatus` is unchanged.
- **Rendering.**
  - `Deadlock`: the status row keeps its single line and adds a reason after the status, with
    ellipsis and the full text in `title`. For b2net at step 2: `Deadlock · ε: t1 false`. After
    turnstile Coin: `Deadlock · Push: tPushU defect ('visits' is not a state attribute of tPushU)`.
    The inputs with an empty `evaluated` list are folded into one clause, «no transition enabled»,
    or dropped when another input gives a reason.
  - `Running`: a button that is on but whose input has no candidate gets the reason in its `title`,
    for example Push: «tPushL: false, pressing discards Push». That changes no layout.
  - The per-input list: a disclosure opened by a click on the status row. The growth is started by
    the user.
- **Texts** (from §4.1-4.2):
  - `t: false`
  - `t: defect, parse error 1:14 Expected expression`
  - `t: defect, E-NODE` (the full message in `title`)
  - `t: defect, 'visits' is not a state attribute of p2` (the `JjelEvaluationError: ` prefix stripped)
  - `t: defect, returns number`
  - `t: defect, 'nope' does not exist`
  - `e3: else, a sibling is defective` (not the sibling's detail a second time: e2 is in the same list)
  - `tb: inhibited by a1` (the place id resolved)
  - «nothing enabled» for an empty list
  - The first three inputs, then a count, as `defectsLine`.
- **Tests.** The four cases; `else` with a true and a defective sibling; `inhibited`; an input with
  no enabled transition; `null` in `Terminated`, `Halted` and `Not started`, and in `Running` when
  every enabled input has a candidate; the names of the events come from the labels. Mutants: the
  reason is computed on the configuration of the last label; the empty-list inputs are reported as
  defects; the `else` sibling detail is duplicated; the place id is printed; the reason shows in
  `Terminated`. The panel's rendering does not load under the bench (`window`, joiner): the memo
  and the row are held by the visual check only, as in the 3b and B2 lanes.
- **The four cases.** C shows **all four** (§4.1).
- **Height.** Zero change: the status row exists in every M1 state with a run, and the reason is
  `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` inside it. The only growth is the
  disclosure, and it is user-initiated.

### The discard wording (a small part of B)

`lastStepText` reads `outcome.label.evaluated` for `discard` and `quiescence` only. When the list is
not empty, the text says «no candidate» and names the first blocked transition:
`Push: discarded, tPushL false`. When the list is empty, it keeps «no transition accepted it». The
change sits in `simBridge.ts` and its test, and no interface changes. It corrects the false text of
§4.2.

### Which combination

- **The least surface for the four cases: C1 alone.** It touches four files, no core file, and no
  exported interface.
- **Recommended: C1 + A + the discard wording.** Five files: `simBridge.ts`, `SimulationPanel.tsx`,
  `simulation-panel.scss`, `__tests__/simBridge.test.ts`, and none in `model/simulation/`. That is
  the Rule 19 threshold exactly. `RunStart` gains one optional field. A is added because it reports a
  compile defect in a run that is still `Running`, on a branch not reached yet, and because lane C
  needs the same line for its action compile defects.
- **B deferred.** The history of labels belongs to the trace of step 5 (R-SIM-25), where every label
  is kept anyway. Until then the discard wording is the only lie B would fix.

How the design extends to lane C, one place per moment:

- **At Reset:** what does not compile, for nets, guards, actions and declarations. This is A's line
  (R-SIM-37 extended).
- **When stopped:** the status row. `Deadlock` gives C's reason. `Halted` keeps `haltMessage`, whose
  `action-defect` detail already names the action text (`actionEvaluator.ts:157`,
  ``return { kind: 'defect', detail: `'${c.source}': ${out}` };``), long enough to need the same
  one-line treatment. Today the halt goes on its own error line (`SimulationPanel.tsx:561`).
- **While running:** the button titles.

The double assignment and the domain violation stay halts (`netStep.ts:240-244`). Once lane C
declares attributes, fewer guards will throw `'x' is not a state attribute`. The mechanism of C does
not change with that.

## 6. Risks

1. **The double evaluation in `Deadlock` (C1).** It costs microseconds (§4.3), and it cannot
   diverge, because the oracle is deterministic over a frozen snapshot (§3.3). If a guard ever gains
   a builtin with a clock, the two evaluations could disagree; C2 removes the risk.
2. **Evaluating on every render.** This is not a real risk today (§3.4). It becomes one if the reason
   is computed in the render body instead of the `tick` memo, or if a later lane subscribes the
   panel to the version. The rule for the lane is to compute in the memo.
3. **Guard texts longer than the panel.** The panel is 288 px wide. The line shows outcomes, not
   sources; a source of 117 characters (§4.1) goes only in the `title`. The `E-NODE` message (77
   characters) and `exception` details are longer than one row, so the line keeps a short form and
   `title` holds the full one.
4. **Names.** A `…xxxx` label appears only for a cleared name or an id missing from the lookup
   (§3.5). The ambiguity that really occurs is an auto name (`FEdge_3`) and a fused `node#edge`
   transition, which prints the node's name for every one of its edges. Proposal: the name in the
   line, and `name (S → D)` from `candidateLabel` in the details and in `title`.
5. **The existing layout shift.** Measured at 17 px per wrapped line (§4.4). Neither option fixes the
   «Last step», halt, error or interruption lines. C and A add no new shift if they follow §5; B
   would add one per press.
6. **Basic/Advanced.** The panel ignores the mode (§3.5). Adding it means reading
   `getInterfaceMode()`, or `U.interfaceMode`, in the panel, a new dependency of the component.
7. **Structural buttons (R-SIM-16).** In `Running`, a button stays on while its input has no
   candidate (turnstile Push, §4.2). C explains this through the `title`; it does not change it.
   Disabling such a button would amend R-SIM-16 and R-SIM-29 («le guardie non si valutano» for the
   buttons).
8. **Tests.** The panel does not load under the bench. The memo, the status row and the titles are
   held only by the visual check. The texts must stay in the bridge, where the bench reaches them.

## 7. Questions for Alfonso

1. Combination: C1 + A + the discard wording, with B deferred to the trace (R-SIM-25)? Recommended: yes.
2. C in the status row as one line with ellipsis, plus a click-to-open list per input, rather than a separate «Why» line? Recommended: the status row.
3. Per-input sets recomputed in the bridge (C1, no core change), or returned by a new core export (C2, `netStep.ts`)? Recommended: C1.
4. In `Running`, the reason of an input that is on without a candidate only in the button `title`, with R-SIM-16 unchanged? Recommended: yes, title only.
5. A as an optional field of `RunStart` filled by `startRun`, rather than a scan through the oracle? Recommended: the field, named generally (`compileDefects`) for lane C.
6. A merged into the existing «not compiled» line, rather than a separate «Guards» line? Recommended: merged.
7. The subset warnings (not-verifiable diagnostics) listed by A? Recommended: no, defects only.
8. The guard source text shown only in `title`, never in the line? Recommended: yes.
9. Basic/Advanced: the one-line reason in both modes, the per-input list only in Advanced? Recommended: yes.
10. The existing 17 px shift of «Last step», halt and error lines (a one-line clamp with `title`): fix it in this lane, or open a ticket? Recommended: fix it in this lane (the same lines, `simulation-panel.scss`), stated as an addition to the Phase 2 scope.
11. Unnamed or fused transitions shown as `name (S → D)` in the details and in `title`? Recommended: yes.
