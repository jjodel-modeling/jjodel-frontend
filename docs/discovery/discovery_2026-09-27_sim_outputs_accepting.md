# Discovery — Moore/Mealy outputs and Accepting (S4), and when the four hidden presets show

- Prompt-ID: `P-2026-09-27-1725` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-27_1725_prompt_discovery_sim_outputs_accepting.md`
- Session: `21d6650a-5b40-48a5-b230-eb2a8ae7b7f1`
- Tree: `~/jjodel-w-outputs`, branch `sim-outputs-accepting`, HEAD `6f83971cd` (the prompt commit; parent `93e964141`,
  the trunk with E1 and S11a). `git status` empty at the start and after every probe run.
- Executor: Opus 5.5 (session banner)
- Read-only. No file under `frontend/src` was written. One gitignored probe, `frontend/scripts/smoke/_tmp_outacc_probe.ts`,
  ran under `npx tsx` on the pure modules. It started no dev server and used no port, so 3019 stayed free
  (`lsof -iTCP:3019 -sTCP:LISTEN` exit 1 before the run).

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags:
- **[M]** measured in this phase: a run on HEAD `6f83971cd`, or a command on a branch ref, named.
- **[R]** read in a file of HEAD, or of the branch named.

Line numbers are HEAD's unless a branch is named.

---

## 0. Answer in brief

- **Today the engine reads none of the three keys** (`simAccepting`, `simStateOutput`, `simTransitionOutput`) [M]. Still,
  the four hidden presets **run today**. Each Apply reads `Checkable` on a plain DFA-shaped metamodel, and the M1 face
  runs the result as a state machine: events fire, no acceptance is shown, no output is shown [M].
- **Three things stand between them and the select, not one:**
  1. **The engine** (decision H's condition).
  2. **The M2 rows.** Without a Final/Accept-named class, DFA reads `Missing: Accepting.` and the Configure groups
     have no select to fix it (`ROLE_SPECS` lacks the three keys) [M].
  3. **The `off`-key resolver (S5).** After a State machine Apply, a DFA Apply keeps the SM's `simTerminal` and
     `simGuard`, which the engine still reads. The DFA run then ends `Terminated` on its accepting state, all inputs
     off. R-SIM-50 says acceptance «Non ferma il run» [M].
- **Where they enter.**
  - Accepting is a predicate on the marking, like `terminated`. It enters neither σ nor the step, and it adds no
    status (R-SIM-29 keeps five).
  - Role-bound outputs are values of the frozen model, compiled at Reset like the guards' texts. The Moore output is a
    function of the marked places. The Mealy output is a function of the fired transition, whose id `step` already
    returns as `label.selector`.
  - The faces: the status row for «accepting», a line beside the marking line for the Moore output, «Last step» for
    the Mealy output.
- **Recommended Phase 2: two lanes.**
  - **`sim-outputs-engine`.** Nine files: five code, four tests; no visual. It mirrors E1's G6 almost line for line and
    runs beside the panel chain.
  - **`sim-outputs-faces`.** Six files, visual. It sits in the wave-3 panel chain after `sim-off-resolver` (S5) and
    shows the four presets (decision H).
  - Both merge after MODELS.
- **One point waits for Alfonso (RC-26):** how R-SIM-51's «Gli output calcolati sono attributi derivati» reads for
  Mealy. Recommendation: wire the role-bound path now and defer the computed link. The four demo presets see no change
  from the engine lane, and only the Configure layout changes from the faces lane (after MODELS).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The engine reads none of `simAccepting`, `simStateOutput`, `simTransitionOutput` | **holds** | `command grep -rn` over `frontend/src` (`*.ts`, `*.tsx`), exit 0: the keys hit only `roleCatalog.ts:9,77,165,169` and tests; control `simTerminal` 26 hits through the same command [M]. Probe A: `netStcFromRoles keys: ["bound","event","initial","nextState","node","ownedTransitions","shape","transition","trigger"]`, `CompiledNet keys` without any accepting or output field [M] |
| H2 | The four hidden presets cannot run today | **falsified** | Probe A and C: DFA, NFA, Moore and Mealy Apply from an empty bag, each `Checkable after Apply`, `missingEngineRoles (M1 gate): []`; the DFA run fires `a`, `b`, `a`, `b` in `Running` [M] |
| H3 | The engine is the only thing between the presets and the select (decision H's condition) | **falsified** | Probe D: `Missing: Accepting.`, no `choose`, and `ROLE_SPECS has simAccepting / simStateOutput / simTransitionOutput: [false,false,false]` (control `simTerminal`, `simGuard`: `[true,true]`). Probe B: after SM then DFA, `press b: … Terminated; inputs on: (none)` [M] |
| H4 | An edit of the three keys already interrupts a run (R-SIM-34) | **holds** | `runSignature` takes every `sim*` key of the bag (`simBridge.ts:398`); probe A: `runSignature carries simAccepting=: true` [M] |
| H5 | Accepting has to enter σ or the step | **falsified** (by design) | R-SIM-50 (`decisions.md:1856-1857`): «una configurazione accetta quando un posto marcato è istanza di Accepting. Non ferma il run». It has the shape of `terminated` (`netStep.ts:68-81`), a reader of `state.marking` over a compiled place set [R] |
| H6 | Role-bound outputs can be read at Reset from frozen M through today's readers | **holds** | Probe C: `objectSlotValues(place, A_output): [["s0",["x0"]],["s1",["x1"]],["s2",["x2"]]]`, same for the edges [M]. `compileNet` already reads slots by pointer at Reset (`netCompile.ts:448`, initial marking); the guards' texts too (`simBridge.ts:150`) [R] |
| H7 | R-SIM-51's «computed outputs are derived attributes» works with today's derived attributes for both machines | **partly** | Moore: a derived attribute is a function of σ, as a Moore output is. Mealy: λ(q, t) is readable as a derived attribute declared on the transition metaclass, on the σ *before* the step. But the role binds a `DAttribute` pointer (`roleCatalog.ts:165`, `kind: 'attribute'`), which cannot name a declaration, and `event` is barred from equations (R-SIM-75, `decisions.md:2057`) [R] |
| H8 | `simAccepting` is covered by the role overlap check (R-SIM-16) | **falsified** | `ROLE_SORTS` (`stcFromRoles.ts:23-28`) has no `simAccepting` [R]; probe A: `overlapVerdict, simAccepting on the transition class: null`, control `simTerminal` on the same class: `{"overlap":{"classId":"C_Trans","sorts":["node","transition"]},"refuse":true}` [M] |

---

## 2. Objective

The prompt asks for four things (COSA, COME 2):
- Where outputs and acceptance would enter the configuration, the step and the marking line.
- The four hidden presets, and what each needs to become runnable.
- The smallest engine-first Phase 2, and the face slices after it.
- When the four presets show (decision H).

R-SIM-76's outputs lane is part of the scope.

---

## 3. Sources read

Full paths under `/Users/alfonso/jjodel-w-outputs/` unless a branch is named.

**Docs:**
- `CLAUDE.md`: whole. `frontend/src/model/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`: whole (loaded on
  read).
- `docs/PROTOCOL.md`: whole.
- `docs/decisions.md`:
  - `:160-246` (RC-21..30);
  - `:1513-1600` (R-SIM-16..20), `:1620-1760` (R-SIM-25..38);
  - `:1800-2200` (R-SIM-44..84, R-J head).
- `docs/log-inbox/simulation.md`: whole.
- `docs/demo/models_2026_simulator_demo.md`: `:1-40`, `:295-350`, and a grep of Configure, output, Moore, Mealy.
- `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md`:
  - `:116-135` (§3.5);
  - `:300-310`, `:415-440` (risks), `:455-460`.
- Branch refs, read with `git show`:
  - `simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md`: `:1-270` (§0-§4.1),
    `:493-781` (§4.6-§9);
  - `sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md`: whole.
- E2's diff on the files S4 touches: `git diff HEAD...sim-e2-panel-bound` over `SimulationPanel.tsx`,
  `simRoleStatus.ts` and `stcFromRoles.ts`, and `--stat` over all 13 files [M].

**Code** (`frontend/src/`):
- `model/simulation/`:
  - read whole: `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `roleCatalog.ts`, `simProfiles.ts`, `stcFromRoles.ts`,
    `objectSlots.ts`;
  - read in part: `profileBinder.ts` `:1-80`, `:180-200`, `:260-345`; `bindingCompat.ts` `:1-110` and a grep of
    `attribute`; `guardContext.ts` `:1-60`.
- `components/editor-v2/sim/`:
  - read whole: `simBridge.ts`, `simRoleStatus.ts`, `metamodelSketch.ts`;
  - `SimulationPanel.tsx`: `:60-200`, `:437-1217`.
- Tests:
  - `components/editor-v2/sim/__tests__/simBridge.test.ts` `:1-140` and the `describe` list;
  - `components/editor-v2/sim/__tests__/simRoleStatus.test.ts` `:205-235` and a grep;
  - `model/simulation/__tests__/roleCatalog.test.ts` `:15-50`, `:126-140`;
  - the E1 tests of the activity final, by grep: `netCompile.test.ts:76-79`, `:561-571`; `netStep.test.ts:46-58`,
    `:409-418`, `:682-684`.
- `model/logicWrapper/LModelElement.tsx`: `:300-320` (the DEnumLiteral setter).
- `jjscript/executor/commands/eval.ts`: a grep of `EnumLiteral`.

The four hidden presets' definitions are `simProfiles.ts:153-168`.

---

## 4. The four hidden presets and what each needs

`simProfiles.ts:153-168` [R]:

```
        id: 'dfa', name: 'DFA', shape: 'controlFlow', active: [...EVENTS, 'accepting'],
        addedRequired: ['trigger', 'accepting'], constraints: ['singleToken', 'noEpsilon', 'deterministic'],
        id: 'nfa', name: 'NFA', shape: 'controlFlow', active: [...EVENTS, 'accepting'],
        addedRequired: ['trigger', 'accepting'], constraints: ['singleToken'],
        id: 'moore', name: 'Moore machine', shape: 'controlFlow', active: [...EVENTS, 'stateOutput'],
        addedRequired: ['trigger', 'stateOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'],
        id: 'mealy', name: 'Mealy machine', shape: 'controlFlow', active: [...EVENTS, 'transitionOutput'],
        addedRequired: ['trigger', 'transitionOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'],
```

All four are control flow with events. Guard, Terminal, Activity final, the actions and the declarations are `off`
(`systemProfileOf`, `simProfiles.ts:117-124`, «Not used by …»). The select hides them: `simRoleStatus.ts:187-190`
[R]:

```
 * DFA, NFA, Moore and Mealy stay hidden until R-SIM-50 and R-SIM-51 are in the
 * engine: nothing reads Accepting or the outputs yet.
 */
export const PANEL_PROFILE_IDS: readonly SystemProfileId[] = ['petri', 'flowchart', 'stateMachine', 'extendedStateMachine'];
```

| Preset | Today, from an empty bag [M] | Needs, engine | Needs, faces |
|---|---|---|---|
| DFA | Apply writes `simAccepting: C_Final`; `Checkable`; the run fires and shows nothing of acceptance | the accepting set and predicate | the Accepting row; «accepting» on the status row; S5 before the select |
| NFA | the same as DFA; nondeterminism goes to the choice list (R-SIM-35) | as DFA | as DFA |
| Moore | Apply writes `simStateOutput: A_output`; `Checkable`; no output shown | the state output map and its reader | the State output row; the output of the marked state |
| Mealy | Apply writes `simTransitionOutput: A_tout`; `Checkable`; `Last step: b: t12 (s1 → s2) fired`, no output | the transition output map | the Transition output row; the output in «Last step» |

Two points hold for all four:
- **The constraints stay unenforced.** `noEpsilon`, `deterministic` and `singleToken` are «identifiers only here»
  (`simProfiles.ts:12-13`, R-SIM-49), and showing the presets does not enforce them.
- **NFA acceptance is shown per path.** A run is one path: the user resolves each choice from the list. The panel
  says whether *this* path's configuration accepts. Existential acceptance over all paths belongs to the exporter's
  `DEFINE accepting` and a CTL query (R-SIM-50), and the exporter is out of scope.

---

## 5. Findings

### 5.1 The engine: where Accepting and the outputs enter

**The STC keys.** `netCompile.ts:46-55` [R], after E1:

```
const ROLE_KEYS: ReadonlyArray<[Exclude<keyof NetStc, 'shape' | 'bound'>, string]> = [
    ['node', 'simNode'], ['transition', 'simTransition'], ['initial', 'simInitial'],
    ['initialMarking', 'simInitialMarking'], ['terminal', 'simTerminal'], ['activityFinal', 'simActivityFinal'],
```

No pair for the three keys, so `netStcFromRoles` drops them (probe A, H1). Two facts shape the change:
- **The type.** `NetStc` (`netTypes.ts:113-143`) is `Exclude<keyof NetStc, …>`-typed. A pair needs the field first:
  `accepting?`, `stateOutput?`, `transitionOutput?`, all optional (Rule 11, additive).
- **The runnability test.** `netStcFromRoles`'s `ok` (`netCompile.ts:83-85`) names neither `terminal` nor
  `activityFinal`. The three new roles stay optional for the engine in the same way. `missingEngineRoles`
  (`simRoleStatus.ts:139-149`) does not change: requiring them is the profile's business (`checkability`), not the
  engine's (R-SIM-47).

**The compiled net.** `netCompile.ts:494-495` [R]:

```
    const final = stc.terminal ? new Set(places.filter(p => kind(p, stc.terminal))) : null;
    const activityFinal = stc.activityFinal ? new Set(places.filter(p => kind(p, stc.activityFinal))) : null;
```

`accepting` is a third line of the same form, a new optional field of `CompiledNet` (`netTypes.ts:212-234`), `null`
without the role. The outputs are read at the same point. The view is the one the compiler already reads slots through
(`view.values(p, stc.initialMarking)`, `netCompile.ts:448`):
- **Moore.** For each place, `view.values(p, stc.stateOutput)`.
- **Mealy.** For each transition, the values on its **own elements**. A transition's own elements are the ones its
  `actionSites` list with role `'transition'`:

  `actionSites(preset, fused, postset)`, `netCompile.ts:256`; `actionSites(preset, [t], postset)`, `:366`;
  `...own.map((element): ActionSite => ({ element, role: 'transition' }))`, `:126`.

  So a plain edge gives its own value, a fused fork/join transition the values of its edges in origin order, and a
  Petri transition its own. The Mealy profile keeps Fork and Join `off`, so the fused case arises only in a custom bag.
  The engine still has to define it.

"Frozen M" is the Reset read: a model edit changes `runSignature` (every slot's values, `simBridge.ts:400-406`) and
withdraws the run (R-SIM-34). This is how the guards' and the actions' texts are frozen today (`simBridge.ts:144-156`,
`:186-200`).

**The step.** `step` (`netStep.ts:225-292`) needs no change:
- **Acceptance.** «Non ferma il run» (R-SIM-50), so `candidates`, `terminated` and `netRunStatus` stay as they are.
  Five statuses (R-SIM-29) and no sixth.
- **The Mealy output.** The fired transition is already in the label: `label: { ...label, consumed: t.preset, produced:
  t.postset, …}` with `selector` = the transition id (`netStep.ts:231-233`, `:288-290`). The output of the last firing
  is `transitionOutput.get(outcome.label.selector)` for a `fired` outcome. A halted, discarded or quiescent step has
  none.

Two readers, pure, beside `terminated` in `netStep.ts`:
- `accepting(net, state)`: some place with `n !== 0` is in `net.accepting`; `false` without the role.
- the Moore output of σ: the outputs of the marked places, in a fixed order, `[]` when none is marked or the role is
  unset.

Without the constraint `singleToken` more than one place can be marked, hence a list.

**The overlap check.** `stcFromRoles.ts:23-28` [R] (HEAD):

```
const ROLE_SORTS: ReadonlyArray<{ sort: string; keys: readonly string[] }> = [
    { sort: 'node', keys: ['simNode', 'simInitial', 'simTerminal', 'simFork', 'simJoin'] },
```

E2 adds `simActivityFinal` to this line (branch `sim-e2-panel-bound`) [M: `git diff`]. `simAccepting` belongs there
too, like the other node subclasses. Today a class that plays Accepting and Transition passes the check (H8).

**What already knows the three roles, and needs no change** [R]:

| Module | Lines | What it does with them |
|---|---|---|
| catalog | `roleCatalog.ts:76-79`, `:164-171` | declares the three roles |
| binder | `profileBinder.ts:194`, `:313-316`, `:329-332` | proposes them: `accepting` by `/accept\|final/`, the outputs by `/^out/` |
| compatibility | `bindingCompat.ts:84`, `:90-92` | judges them: Accepting a proper subclass of Node, `stateOutput` owned by Node, `transitionOutput` by Transition |
| profiles | `simProfiles.ts:153-168` | the four rows |

### 5.2 The M1 face: where the lines go

The panel's `view` memo (`SimulationPanel.tsx:625-659`) computes, once per panel action:
- the status (`netRunStatus`);
- the halt line;
- the stop reason;
- `marking: markingLine(r.config.state, r.net, lookup)` (`:656`).

The status row renders `<span className="sim-panel__status-text">{status}</span>`, then `· reason.line` in Deadlock
(`:1088-1089`). «Last step» is `pressInput`'s `lastStep` (`simBridge.ts:856`, `lastStepText` `:814-828`), rendered
at `:1072-1074`. The marking line (`simBridge.ts:538-555`) is «the run's σ in one line», clamped (R-SIM-63, R-SIM-82).

The entries follow R-SIM-50 and R-SIM-51 (`decisions.md:1857`, `:1861-1862`):
- **Accepting.** «Pannello: «accepting» accanto allo stato del run»: a span after the status text, before the Deadlock
  reason, computed in the same memo from the engine's reader. It is shown only when the role is bound, so the four
  demo presets render as today.
- **Moore.** «l'output dello stato marcato»: it is not σ, so it gets its own line under the marking line, for the
  run's lifetime, clamped like it. The alternative is a suffix on the marking line (§6, option M-b).
- **Mealy.** «quello dell'ultimo scatto in «Last step»»: a suffix on the `fired` case of `lastStepText`, for example
  `a: t01 (s0 → s1) fired, output o01`.

All three are perceptual choices for the visual check (RC-23), not for this report.

### 5.3 The M2 face: rows and presets

`ROLE_SPECS` (`simRoleStatus.ts:65-96`) and `RoleKey` (`:26-49`) lack the three keys (probe A, with control). Neither
does `ROLE_GROUPS` (`SimulationPanel.tsx:188-196`) have them:

```
    { id: 'general', title: 'General', keys: ['simNode', 'simInitial', 'simInitialMarking', 'simTerminal', 'simBound', 'simTransition'] },
```

`roleCatalog.ts:30` has a group `'output'` that no panel group mirrors. The only way to set a key today is Apply's
proposal, and a missed proposal is a dead end (probe D, H3).

E2 is the template (branch `sim-e2-panel-bound`) [M: `git diff`]:
- **The key.** `'simActivityFinal'` joins `RoleKey`.
- **The row.** One `ROLE_SPECS` row, «a row, so a key left by a Flowchart Apply is seen and cleared (G6)», and the key
  in the General group.
- **The overlap.** The key joins the node sort of `ROLE_SORTS`.

The faces lane does the same for:
- Accepting (class, General);
- State output and Transition output (attribute, a new «Output» group), with a `groupOpen` default «open when either
  key is set» (`SimulationPanel.tsx:755-762`).

It also adds the four ids to `PANEL_PROFILE_IDS` (`simRoleStatus.ts:190`) and rewrites the assertion that pins them
(`simRoleStatus.test.ts:212-214`).

### 5.4 The off-key resolver is a precondition of the select (probe B)

The comment on `isBound` says of an `off` role «the bridge does not read it, R-SIM-55» (`simProfiles.ts:272-273`;
`git log -S` names `0834329e4` and `a27e46e8d` [M]). That holds for `checkability` only. `netStcFromRoles` reads every key of `ROLE_KEYS` regardless
of the profile. Measured [M]:

```
[B] DFA summary before its Apply (setButOff): Set but off: Terminal, Guard.
[B] DFA Apply patch: {"simAccepting":"C_Final","simProfile":"dfa"}
[B] netStcFromRoles terminal / guard: {"terminal":"C_Final","guard":"A_guard"}
[B] press b: b: t12 (s1 → s2) fired | Terminated; inputs on: (none); Marking: s2
```

On a metamodel that went State machine → DFA, the binder binds the same class `Final` as SM's Terminal and DFA's
Accepting (`/final|end|terminal|stop/` and `/accept|final/`, `profileBinder.ts:193-194`). The DFA run then stops on
its first accepting state, and the panel turns every input off. S5 (`activeBag`, backlog §4.1) fixes it. Its place in
the ratified wave-3 chain is first, and S4 Phase 2 is fifth. The order therefore holds already; this report makes it
a stated dependency.

### 5.5 Computed outputs (R-SIM-51 last sentence, R-SIM-76)

R-SIM-51 (`decisions.md:1862-1863`): «Gli output calcolati sono attributi derivati (R-SIM-19)». R-SIM-76
(`decisions.md:2064-2065`): «gli output legati a un ruolo sono un percorso sul modello congelato, quelli calcolati sono
derivati sulla via E1».

- **Moore.** A derived attribute is evaluated eagerly on every σ (R-SIM-73). A global one (`self` the model root,
  R-SIM-75) that reads the places' `.[marked]` is exactly a `DEFINE out`, and the marking line already lists derived
  semantic values (`simBridge.ts:552`). Nothing is missing except a pointer from the role.
- **Mealy.** λ(q, t) depends on the transition taken, and σ′ does not record it:
  - A derived attribute declared on the transition metaclass is evaluated per edge instance: `compileNet` owners are
    «every instance that is a kind of» the metaclass (`netCompile.ts:466-468`), edges included.
  - Its value on σ, the state **before** the step, for the fired edge is λ(q, t). That is `run.config.state.derived`
    before `simCommit` (C2 report risk 6, `:426-428`).
  - `event` stays barred (R-SIM-75), and needs no lifting: t fixes the trigger.
- **The missing link, for both.** The role binds an M2 `DAttribute` (`roleCatalog.ts:165`, `kind: 'attribute'`), while
  a derived attribute is a record of `simStateAttributes` named by (metaclass, name). No role value can point at one
  today.

This is a format decision (what `simStateOutput` may hold), and the reading of Mealy is an interpretation of a row
Alfonso ratified. It goes to §10.

### 5.6 Output values

`objectSlotValues` returns the slot's values without `null` (`objectSlots.ts:19-28`). Two consequences:
- **Multi-valued outputs.** An output attribute `[0..*]` gives several values. The engine keeps the list; the face
  joins it.
- **Enumerations, not measured.** The raw shape of an `EEnum` slot in M1 was not measured here (the setter at
  `LModelElement.tsx:311-317` writes `literal` or `ordinal` on the literal itself). The faces lane measures one before
  it words the output, and names an id through `elementName` when it resolves to an element.

---

## 6. Design options

**Engine (lane 1).**

| Option | What | Files | Verdict |
|---|---|---|---|
| **E. Compiled at Reset (recommended)** | Three `NetStc` fields and `ROLE_KEYS` pairs. `CompiledNet.accepting` (set or `null`) and the two output maps (or `null`), read at `compileNet`. Two pure readers in `netStep.ts`. `step` untouched. `simAccepting` in the node sort | `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `stcFromRoles.ts`, `roleCatalog.ts` (header); tests `netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts`, `events.test.ts` | Mirrors E1's G6 (`45a796050`). The exporter reads one source (R-SIM-47: «Motore ed esportatore leggono i ruoli risolti») |
| B. Bridge-only | The bridge reads the slots from the lookup at display time and computes acceptance with `isKindOf` on the marked places | `simBridge.ts`, `simBridge.test.ts` | Fewer files, but no engine reading for the exporter, and `simBridge.ts` is the most queued file of wave 3 (S1/S2, S5, S13, S14). Rejected |
| L. Output on the label | `NetLabel.output?`, set by `step` on `fired` | + `step` | Touches the step for data the selector already gives. Rejected |

**M1 face, Moore (lane 2).**
- **M-a (recommended): its own line.** `Output: x1` under the marking line, only when the role is bound. No existing
  line changes.
- **M-b: a suffix of the marking line.** `Marking: s1 · output x1`: no new row, but the line mixes σ with a
  non-σ value.

**M1 face, Accepting (lane 2).**
- **A-a (recommended): the literal row.** `Running · accepting` when accepting, nothing otherwise (the R-SIM-50
  literal).
- **A-b: also the negative.** `· not accepting` too, which may read better for a DFA lesson. A perceptual call for the
  visual.

---

## 7. Tests (lane 1), each with the mutant that kills it

1. `simAccepting`, `simStateOutput`, `simTransitionOutput` reach `NetStc`, and are absent without the key. Mutant: one
   `ROLE_KEYS` pair dropped.
2. The accepting set is the kind-of places of `simAccepting`, a subclass instance included, independent of F, and
   `null` without the role. Mutants: the set built from `terminal`; `null` always.
3. `accepting(net, σ)`:
   - true when some marked place is in the set, false on an empty marking and without the role;
   - a zero entry does not count.

   Mutants: `every` for `some`; `n !== 0` dropped.
4. **Accepting does not stop the run.** A marked accepting place with an outgoing transition keeps its candidate:
   `terminated` false, status `Running`. Mutant: the check fused into `terminated`.
5. The state output map: each place to its values by pointer, the slot of a superclass attribute included (the
   `objectSlots.ts` rule); `null` without the role.
6. The transition output map:
   - a plain edge, its value;
   - a fused fork transition, its edges' values in origin order;
   - a Petri transition, its own value;
   - `null` without the role.

   Mutant: the fused case reading `origin` (it holds the fork node).
7. The Moore reader on σ: the marked places' outputs in order, `[]` when none. Mutant: all places.
8. `roleCatalog.test.ts`: `NEW_KEYS` (`:20`) emptied, as E1 did for `simActivityFinal`. `:134-140` («finds none of the
   new keys in the code») goes red by design with the first quoted key. It is a source-text test (CLAUDE.md §5), kept
   as the catalog's existing guard, not a new one.
9. `events.test.ts` (the tests of `stcFromRoles`): `simAccepting` on the transition class overlaps node and transition
   and refuses with the event role. Mutant: the key missing from `ROLE_SORTS`. Measured today: `null`.

**Parity on the four demo presets.**
- **What is re-run.** The E1 comparison: the readiness Flow B and SM probes, trace identical line by line.
- **Why no change is expected.** Their profiles keep the three roles `off`, and `proposalsOf` writes `edit` roles only
  (`simRoleStatus.ts:270`). So the demo bags, applied from empty (script §1, «Empty bag»), never hold the keys.

---

## 8. R- rows touched

| Row | Status | Effect |
|---|---|---|
| R-SIM-50 | ratified 2026-09-25 | Implemented as written (lane 1 predicate, lane 2 «accepting») |
| R-SIM-51 | ratified 2026-09-25 | Role-bound path implemented as written. The computed-output sentence, for Mealy, waits (§10) |
| R-SIM-52 | ratified | The three keys leave the provisional list with lane 1's code commit, as `simActivityFinal` did (R-SIM-83) |
| R-SIM-76 | provisional | Closes the «no reader» ticket of C2 (`simulation.md:40`) for the role-bound path |
| R-SIM-79 | provisional | Lane 2 meets its «nascosti finché R-SIM-50 e 51 non sono nel motore» and lists eight presets (decision H) |
| R-SIM-78 (D4) | provisional | S5 becomes a stated precondition of lane 2 (§5.4) |
| R-SIM-29, R-SIM-49 | ratified | Unchanged: five statuses; constraints not enforced |

New rows are numbered at lane 1's closure. `docs/decisions.md` is not a union file (backlog risk 3).

---

## 9. Recommended Phase 2 lanes

**Lane 1, `sim-outputs-engine`.**
- **Size.** Full lane (more than 3 files), no visual check. Nine files, above Rule 19's five, listed before the first
  edit.
- **Code:**
  - `frontend/src/model/simulation/netTypes.ts`, `netCompile.ts`, `netStep.ts`;
  - `stcFromRoles.ts`, `roleCatalog.ts` (header comment `:9-12`).
- **Tests:** `frontend/src/model/simulation/__tests__/netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts`,
  `events.test.ts`.
- **Docs, closure:** `docs/decisions.md` (the new rows), `docs/log-inbox/simulation.md`, the prompt's Status.
- **Precondition.** E2 merged into the trunk (`stcFromRoles.ts` and `events.test.ts` are in E2's diff). The merge
  prompt `P-2026-09-27-1723` is on the trunk at `42787f7d8` [M: `git log 93e964141..alfonso-frontend-jjtl`].
- **Queue.** `netStep.ts` and `netTypes.ts` are `sim-comments`' (S20, wave 2a, comments only), so RC-22 check 1 fails
  if both run at once: one waits for the other's merge.
- **Gates:** the common code gates of the backlog §5; a mutation bench on §7; the parity probe on the demo presets,
  on a port of its own.
- **Merge.** After MODELS: it changes nothing the demo shows, but it reads keys at every Reset, and the pre-freeze rule
  is best kept clean.

**Lane 2, `sim-outputs-faces`.**
- **Size.** Full lane, with a visual check. Six files, listed before the first edit.
- **Code:**
  - `frontend/src/components/editor-v2/sim/simBridge.ts`: the Moore line and the Mealy suffix;
  - `simRoleStatus.ts`: `RoleKey` +3 literals, `ROLE_SPECS` +3 rows, `PANEL_PROFILE_IDS` +4;
  - `SimulationPanel.tsx`: `ROLE_GROUPS`, the Output group, «accepting» on the status row;
  - `simulation-panel.scss`, if the mark needs a class.
- **Tests:** `sim/__tests__/simBridge.test.ts`, `sim/__tests__/simRoleStatus.test.ts`.
- **Place.** In the wave-3 panel chain, after `sim-off-resolver` (S5) and after lane 1.
- **Visual checklist:**
  - a DFA, NFA, Moore and Mealy fixture built by a console script: this probe's metamodel `DemoDFA`, §11;
  - the Accepting and Output rows, and the dead end of probe D closed;
  - the four demo presets, where only the Configure rows move.
- **Merge.** After MODELS, per decision H.

The union of `RoleKey` is an exported type: adding literals is additive, as in E2 and R-SIM-70, and is declared.

---

## 10. Decisions

### Decisions taken (unattended)

1. **Engine first, compiled at Reset** (option E): the outputs and the accepting set are `CompiledNet` data; the
   bridge reads, never re-derives.
2. **Accepting is not a status and not in σ:** a reader beside `terminated`. R-SIM-29 unchanged.
3. **The Mealy output comes from the compiled map by `label.selector`.** `NetLabel` and `step` are untouched (option L
   rejected).
4. **An output is the list of the slot's values** (multi-valued allowed), for the marked places (Moore) or the fired
   transition's own elements (Mealy).
5. **`simAccepting` joins the node sort of the overlap check.** Same reason as E2's `simActivityFinal`.
6. **Two lanes, not one.** The engine lane runs beside the panel chain; the faces lane sits in it after S5.
7. **Both lanes merge after MODELS.**
8. **S5 is a stated precondition of showing the presets** (§5.4). It is already first in the ratified chain, so no
   order changes.
9. **The constraints of the four presets stay unenforced** (R-SIM-49). NFA acceptance is per path.
10. **Face wording is left to the visual:** A-a and M-a recommended, the Mealy suffix `, output …`.
11. **RC-27 applies to lane 1:** it adds optional fields to two exported interfaces, `NetStc` and `CompiledNet`. The
    chat asks a second agent's `Verified:` line before adopting the rows.

### Decisions awaiting Alfonso (RC-26)

1. **R-SIM-51, computed outputs (amends a ratified row by interpretation).** Should lane 2 wire only the role-bound
   outputs, and leave the link from the role to a declared derived attribute (Moore on σ, Mealy on the σ before the
   step, §5.5) for after the modal lane? That later lane would also carry the format of the role value.
   Recommended: yes, role-bound now, computed link deferred.

   Decision H (presets after MODELS, in S4 Phase 2) is already ratified (`claude_ratifiche_2026-09-27_sim_backlog_answers.md`)
   and is not asked again.

---

## 11. Probe

`frontend/scripts/smoke/_tmp_outacc_probe.ts`, gitignored (`.gitignore:68`), `npx tsx` from `frontend/`, `EXIT=0`,
log `/tmp/p1725_probe.log`, 42 lines.

**The fixture.** A metamodel `DemoDFA` with these classes:
- `State` (`output: EString`, composition `out` to `Trans`);
- `Init` and `Final` extending `State`;
- `Event` (`label`);
- `Trans` (`out: EString`, `guard: Expression`, `next`, `trigger`).

The model: `s0 -a-> s1 -b-> s2 -a-> s1`, with `s2` a `Final`. Apply is `profilePatch` over `bindProfile` on
`sketchOfMetamodel`, as the panel's `applyProfile` runs it. The run is `startRun`, then `pressInput`, with a synthetic
context builder.

Readings quoted in §1 and §5; the log verbatim:

```
[A] PANEL_PROFILE_IDS: ["petri","flowchart","stateMachine","extendedStateMachine"]
[A] ROLE_SPECS has simAccepting / simStateOutput / simTransitionOutput: [false,false,false]
[A] control: ROLE_SPECS has simTerminal / simGuard: [true,true]
[A] overlapVerdict, simAccepting on the transition class: null
[A] control: overlapVerdict, simTerminal on the transition class: {"overlap":{"classId":"C_Trans","sorts":["node","transition"]},"refuse":true}
[A] DFA Apply patch: {"simNode":"C_State","simInitial":"C_Init","simAccepting":"C_Final","simTransition":"C_Trans","simOwnedTransitions":"R_out","simNextState":"R_next","simTrigger":"R_trigger","simProfile":"dfa"}
[A] DFA summary text: {"status":"DFA · Checkable after Apply","badge":"Checkable","missing":null,"choose":null,"proposals":["Node → State","Initial → Init","Accepting → Final","Transition → Trans","Owned transitions → out","Next state → next","Trigger → trigger"],"kept":null,"setButOff":null,"declare":null}
[A] checkability after Apply: {"status":"checkable","missing":[]}
[A] netStcFromRoles keys: ["bound","event","initial","nextState","node","ownedTransitions","shape","transition","trigger"]
[A] missingEngineRoles (M1 gate): []
[A] runSignature carries simAccepting=: true
[A] Reset: Running; inputs on: a; Marking: s0
[A] press a: a: t01 (s0 → s1) fired | Running; inputs on: b; Marking: s1
[A] press b: b: t12 (s1 → s2) fired | Running; inputs on: a; Marking: s2
[A] press a: a: t21 (s2 → s1) fired | Running; inputs on: b; Marking: s1
[A] press b: b: t12 (s1 → s2) fired | Running; inputs on: a; Marking: s2
[A] CompiledNet keys: ["activityFinal","attributes","bound","declarationDefects","declared","defects","final","hasEventRole","initial","modelId","places","transitions"]
[B] SM Apply patch: {"simNode":"C_State","simInitial":"C_Init","simTerminal":"C_Final","simTransition":"C_Trans","simOwnedTransitions":"R_out","simNextState":"R_next","simTrigger":"R_trigger","simGuard":"A_guard","simProfile":"stateMachine"}
[B] DFA summary before its Apply (setButOff): Set but off: Terminal, Guard.
[B] DFA Apply patch: {"simAccepting":"C_Final","simProfile":"dfa"}
[B] bag after both: {"simNode":"C_State","simInitial":"C_Init","simTerminal":"C_Final","simTransition":"C_Trans","simOwnedTransitions":"R_out","simNextState":"R_next","simTrigger":"R_trigger","simGuard":"A_guard","simProfile":"dfa","simAccepting":"C_Final"}
[B] netStcFromRoles terminal / guard: {"terminal":"C_Final","guard":"A_guard"}
[B] Reset: Running; inputs on: a; Marking: s0
[B] press a: a: t01 (s0 → s1) fired | Running; inputs on: b; Marking: s1
[B] press b: b: t12 (s1 → s2) fired | Terminated; inputs on: (none); Marking: s2
[B] press a: a: discarded, no transition accepted it | Terminated; inputs on: (none); Marking: s2
[C] moore Apply patch: {"simNode":"C_State","simInitial":"C_Init","simTransition":"C_Trans","simOwnedTransitions":"R_out","simNextState":"R_next","simTrigger":"R_trigger","simStateOutput":"A_output","simProfile":"moore"}
[C] moore summary status: Moore machine · Checkable after Apply
[C] moore checkability after Apply: checkable
[C] mealy Apply patch: {"simNode":"C_State","simInitial":"C_Init","simTransition":"C_Trans","simOwnedTransitions":"R_out","simNextState":"R_next","simTrigger":"R_trigger","simTransitionOutput":"A_tout","simProfile":"mealy"}
[C] mealy summary status: Mealy machine · Checkable after Apply
[C] mealy checkability after Apply: checkable
[C] nfa Apply patch: {"simNode":"C_State","simInitial":"C_Init","simAccepting":"C_Final","simTransition":"C_Trans","simOwnedTransitions":"R_out","simNextState":"R_next","simTrigger":"R_trigger","simProfile":"nfa"}
[C] nfa summary status: NFA · Checkable after Apply
[C] nfa checkability after Apply: checkable
[C] objectSlotValues(place, A_output): [["s0",["x0"]],["s1",["x1"]],["s2",["x2"]]]
[C] objectSlotValues(edge, A_tout): [["t01",["o01"]],["t12",["o12"]],["t21",["o21"]]]
[C] Reset: Running; inputs on: a; Marking: s0
[C] press a: a: t01 (s0 → s1) fired | Running; inputs on: b; Marking: s1
[C] press b: b: t12 (s1 → s2) fired | Running; inputs on: a; Marking: s2
[D] DFA summary without a Final/Accept class: {"status":"DFA · Not checkable after Apply","badge":"Not checkable","missing":"Missing: Accepting.","choose":null,"proposals":["Node → State","Initial → Init","Transition → Trans","Owned transitions → out","Next state → next","Trigger → trigger"],"kept":null,"setButOff":null,"declare":null}
[D] checkability after Apply: {"status":"notCheckable","missing":["accepting"]}
```

**What the probe does not cover:**
- the panel's DOM: no dev server; the faces lane measures it;
- an `EEnum` output slot;
- a fused transition's outputs;
- the parity of the four demo presets, which lane 1 re-runs.

---

## 12. Risks

1. **S5 before lane 2** (§5.4). If the chain order changes, a preset switch leaves live keys, and a DFA stops on its
   accepting state.
2. **Lane 2 moves the Configure layout:** one row in General, one Output group. The demo's ESM hint path was measured
   at fold distances of 19 to 28 px (`models_2026_simulator_demo.md:329-333`). After MODELS only.
3. **File sharing:**
   - lane 1 shares `netStep.ts` and `netTypes.ts` with `sim-comments` (S20) and E1's tests;
   - lane 2 shares `simBridge.ts` and its test with S1/S2, S5, S13 and S14, and `SimulationPanel.tsx` with the whole
     chain.
4. **Two tests go red by design:**
   - `roleCatalog.test.ts:134-140`, a source-text pin of «nothing reads them»;
   - `simRoleStatus.test.ts:212-214`, the preset list.

   Each lane names its own in the red-first list.
5. **The binder binds `Final` as Accepting** (`/accept|final/`). On a metamodel whose `Final` means «flow final» this
   is a wrong proposal, visible in the summary before Apply (R-SIM-77), not written blind.
6. **The E2 merge is not on the trunk yet** (`sim-e2-panel-bound` not an ancestor of HEAD [M]). Lane 1 branches after
   it.
7. **RC-27** (§10, item 11).
