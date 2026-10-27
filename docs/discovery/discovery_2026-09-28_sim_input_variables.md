# Discovery 2026-09-28: input variables for the simulator (a value asked during the run)

- Prompt-ID: P-2026-09-28-0034, `docs/prompts/claude_2026-09-28_0034_prompt_sim_input_variables.md`
- Chat: C-2026-09-27-1437. Session: `faea756d-f872-4644-8f86-0083cf9bf0a6` (`~/.jjodel-lanes/P-2026-09-28-0034/session.txt`).
- Tree: `~/jjodel-w-input`, branch `sim-input-variables`, HEAD `ac7f5db80` (the prompt's docs commit; code identical to
  `b452d9e5c`, the trunk with the P2b checker rules merged). Executor: Opus 5.5 (`claude-opus-5-5`).
- Discovery lane, read-only on the code. One probe, gitignored: `frontend/scripts/smoke/_tmp_input_probe.test.ts` with its
  config `_tmp_input_vitest.config.ts`, run under vitest on the node bench (no dev server, no port: the question is the
  engine's, and the bridge runs there). Log `/tmp/input_scratch/probe.log`, exit 0, 5 of 5. `git status` empty after it.
- This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.
  Tags: **[M]** measured in this phase on `ac7f5db80`, **[R]** read in a file at HEAD, **[M-2255]** measured by
  P-2026-09-27-2255 on `a3eacdbdd` (report at `6cc28c866`), cited, not re-run.

---

## 0. Answer in brief

**Today an input enters the run in two ways only, and neither assigns a value**: an event button (the event instance
is the input; its parameters are frozen attributes of the instance, R-SIM-16) and the selector (the «Choose a
transition» list, R-SIM-35). A Data row is σ with a fixed initial value. Measured on HEAD [M]: a DecisionNode with two
unguarded flows opens the choice list (P1); two events `yes`/`no` carrying `value = true/false` and the guards
`event.value` / `else` pick the branch from the event buttons, enabled only while the DecisionNode is marked (P4). Both
work with no code change; the second needs the Trigger role, which the Flowchart preset has off.

**Recommendation: option (a), an `input` form of the Data row beside `stored` and `derived`, asked at each step that
reads it.** It is nuXmv's IVAR (a value chosen by the environment per step, spec §8), per element or global like any
declaration, never in σ, read-only. At a press (▶ or an event) the bridge collects the input reads of the structurally
enabled transitions' guards and actions; if any, a dialog asks them before anything is committed; Cancel leaves the run
as it is. The values reach guards through a bridge-side overlay of the state accessor: measured feasible with the core
untouched (P5: one distinct read `DecisionNode_0.decision`, `true` → `Flow_1`, `false` → `Flow_2`). The core changes by
one check (an action on an input halts `read-only`). Not a catalog role: the demo's roles counts do not move.

Three slices (core and codec, bridge, UI) plus docs, about 1.5 lane-days (§6). Slices 1 and 2 change nothing on the four
demo scenes; slice 3 adds `input` to the form select that ESM step 3 opens (demo script: «The labels `range`,
`derived`, `stored` are the options of the dialog's selects»). **Recommended: build on this branch, merge after the
Málaga demo (2026-10-04)**; the freeze of 2026-10-01 stays untouched.

**Decisions awaiting Alfonso (RC-26):**
1. Option (a) amends R-SIM-7 (ratified 2026-09-14): a step gets three inputs, event, selector, input valuation.
2. Slice 3 before the freeze would change what the ESM scene shows (a third option in an open select).
3. Options (b) and (c) would amend ratified rows (R-SIM-16 free event parameters; R-SIM-17 a defective read that pauses
   instead): not recommended.

**Questions:**
1. Asked at every step that reads it (IVAR), or once per run and then kept (a free initial value, option c)?
   Recommended: every step; a DecisionNode in a loop is asked again at each visit.
2. Ask only the inputs the enabled transitions read, or every input of the element? Recommended: only those read,
   one dialog per press, none when nothing is read.
3. Show a runtime decision in the Málaga demo with today's means (choice list or events)? Recommended: no; the four
   scenes stay as scripted.
4. When the answer must stay visible in the Marking line, is an explicit action enough
   (`self.target.[answer] := self.source.[decision]` on a stored `answer`)? Recommended: yes, no automatic copy into σ.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | No path lets the environment choose a value during a run today | **partly** | no value is assigned from outside, but the event (P4) and the selector (P1) are environment inputs that already decide a branch [M] |
| H2 | An event parameter can be supplied at the press | **falsified** | parameters are frozen attributes of the instance, free parameters out of scope: `docs/decisions.md:1543` [R]; `event` is bound to the frozen handle, `guardContext.ts:167-173` [R] |
| H3 | A Data row without an initial value makes the guard pause | **falsified** | Reset: `2 defects: Flow_1 guard (undeclared 'decision'); decision (no initial or equation).`, then `Deadlock` [M, P3] |
| H4 | The ask can be done without changing the pure core | **holds** for the evaluation: a guard oracle wrapped by the caller sees supplied values and records the misses [M, P5]; one core check is still owed for actions (§5.2) |
| H5 | The run status is right while a value is still to be asked | **falsified** | on the probe pass `netRunStatus` says `Deadlock` [M, P5]: a status rule is owed (§5.3) |
| H6 | The P2b rules R1/R2/R6 accept a read of a declared input | **holds** by reading: R1 looks up names in `net.attributes`, R2 in `net.declared` and wants `semantic`; an input declaration is both (`stcChecks.ts:133-136`, `:158-162`) [R]; not run |
| H7 | The recommended design changes nothing on the four demo scenes | **partly** | engine and bridge: no scene declares an input, so the ask never fires; the form select of the Data table gains an option that ESM step 3 opens (`docs/demo/models_2026_simulator_demo.md:209`, `:215`) [R] |

## 2. Files read

Under `/Users/alfonso/jjodel-w-input/`.

- `CLAUDE.md`; `docs/decisions.md` R-SIM-1..85, RC-17, RC-25..31 (`:118-126`, `:187-262`, `:1436-2260`);
  `docs/spec/claude_spec_2026-09-13_computational_model.md` (whole); `docs/demo/models_2026_simulator_demo.md` (`:1-16`,
  outline, `:166-215`, `:246-292`); `docs/claude-code-log.md` `:1-80`; `docs/log-inbox/simulation.md` (headings).
- `git show 6cc28c866:docs/discovery/discovery_2026-09-27_sim_decision_boolean.md` (whole);
  `docs/discovery/discovery_2026-09-27_sim_modal.md` (`:1-70`, outline); `docs/discovery/discovery_2026-09-27_sim_checker_gap.md`
  (`:1-80`, outline).
- `frontend/src/model/simulation/`: `netTypes.ts` (whole), `netStep.ts` (whole), `guardContext.ts` (whole),
  `stcChecks.ts` (whole), `stateAttributesCodec.ts` (whole), `netCompile.ts` (`:60-111`, `:430-556`, greps),
  `derivedEvaluator.ts` (`:440-460`, greps), `simProfiles.ts` (`:100-200`), `roleCatalog.ts` (greps),
  `subsetChecker.ts` (greps), `guardEvaluator.ts` (`:88-101`).
- `frontend/src/components/editor-v2/sim/`: `simBridge.ts` (whole), `simRunState.ts` (whole), `SimulationPanel.tsx`
  (`:1-140`, `:180-470`, `:480-864`), `SimRolesModal.tsx` (`:1-60`, `:250-345`, `:405-440`, `:780-892`),
  `SimRolesModal.scss` (`:1-60`), `__tests__/simBridge.test.ts` (`:1-140`, `:585-615`, `:1140-1175`).
- `frontend/src/components/editor-v2/problems/simCheckToProblems.ts` (`:1-40`, greps);
  `frontend/src/jjel/evaluator/evaluator.ts` (grep `:997-1018`); `frontend/vitest.config.ts`.

---

## 3. Question 1: where an input enters today

### 3.1 Events, end to end [R]

- **Roles.** Trigger is the one primary key; the event class is its declared type, derived at every read and never
  stored: `netCompile.ts:100-108`, «`if (cls?.className === 'DClass' && !cls.isPrimitive) derived.simEvent = type;`».
  The role exists only with both keys: `netCompile.ts:78-82`. Identifier optional (R-SIM-38).
- **STC and net.** `compileNet` reads the triggers per edge: `netCompile.ts:439`
  «`const triggersOf = (id: string) => (hasEventRole ? view.references(id, stc.trigger as string) : []);`»; each
  transition keeps `triggers` (`netTypes.ts:189-190`, «`/** Event instance ids; `[]`: accepted by ε only (R-SIM-16). */`»).
  The alphabet is the event instances of the model: `netCompile.ts:549-556`.
- **Step.** The configuration is `(σ, e)`: `netTypes.ts:95-98` «`readonly event: string | null;`». Acceptance by
  identity: `netStep.ts:95-97` «`return event === null ? t.triggers.length === 0 : t.triggers.includes(event);`».
  Every step consumes the event: `netStep.ts:236-239`, `:287-290` (`next: { state, event: null }`).
- **Guards see the event** as the frozen handle of its instance: `guardContext.ts:167-173`
  «`const handle = snapshot.handleById.get(step.event);`» … «`const ctx = snapshot.base.child({ self, event, model: snapshot.model });`».
  So `event.value` reads a model slot frozen at Reset; nothing assigns it.
- **Panel.** The event list is a JSON signature of the alphabet (`SimulationPanel.tsx:846-852`); one button per
  instance, enabled structurally (`SimulationPanel.tsx:683-706`, `disabled={!view?.inputs.events.has(e.id)}`; the rule
  is `structuralInputs`, `netStep.ts:317-327`); a click is `fire(e.id)` (`:448-456`) → `pressInput`
  (`simBridge.ts:879-905`) → `candidates` → `step` → `simCommit` (`simRunState.ts:111-130`).
- **The rule that fixes today's scope**: `docs/decisions.md:1542-1543` «I parametri di un evento sono attributi
  congelati della sua istanza; gli eventi con parametri liberi sono fuori scope.»

### 3.2 The ε choice [R]

`pressInput` without a selector returns the candidates when there are more than one, and commits nothing:
`simBridge.ts:886-888` «`if (cs.candidates.length > 1) return { pending: cs.candidates, lastStep: null, outcome: null };`».
The panel shows the list above the buttons (`SimulationPanel.tsx:635-657`, R-SIM-82) and a choice calls
`fire(pending.event, c.transition)` (`:644`); Cancel drops it (`:652`). The selector is the second input of the step
(R-SIM-7, `docs/decisions.md:1475`), and R-SIM-25 names it as the place of the external choice: `docs/decisions.md:1636-1638`
«La scelta esterna (modale all'utente, random, scenario) è una politica del selettore (R-SIM-7), mai un'espressione con
effetti nella guardia».

### 3.3 Data rows and σ [R]

- **Storage.** One bag key, a JSON string: `stateAttributesCodec.ts:32` «`export const STATE_ATTRIBUTES_KEY = 'simStateAttributes';`».
  A record needs exactly one of `initial` and `equation`: `stateAttributesCodec.ts:123-128`, «`if (r.initial === undefined) return defect('no initial or equation');`».
- **σ.** `SimState` holds `marking`, `attrs`, `presentation`, `derived` (`netTypes.ts:82-92`). The compiler writes one
  initial value per owner: `netCompile.ts:486-490` «`if (decl.equation !== undefined || decl.initial === undefined) continue;`» …
  «`values.set(decl.name, decl.initial);`». A declaration with no initial therefore has no value in σ, but it never gets
  there: the codec drops the record first.
- **Read.** `.[x]` reaches σ through the accessor: `netStep.ts:52-54`
  «`read: (elementId, attr) => state.attrs.get(elementId)?.get(attr) ?? state.derived?.attrs.get(elementId)?.get(attr),`»,
  adapted for JjEL in `guardContext.ts:189-198`; an absent value throws in the evaluator,
  `jjel/evaluator/evaluator.ts:1018` «`throw new JjelEvaluationError(`'${expr.attribute}' is not a state attribute of …`»,
  and the guard becomes a defect (`guardEvaluator.ts:99-101`).
- **Shown.** The Marking line prints σ's stored and derived semantic values (`simBridge.ts:578-595`); the Last step
  title lists the assignments (`simBridge.ts:897-903`).

### 3.4 Measured on HEAD [M, `/tmp/input_scratch/probe.log`]

Model: the 2255 flowchart rebuilt as a raw lookup (`StartNode_0 -Flow_0-> DecisionNode_0`, `Flow_1 → ActionNode_0`,
`Flow_2 → ActionNode_1`, both actions `→ EndNode_0`), roles `simInitial simSource simNextState simGuard simTerminal`,
the JjEL record synthetic as in `simBridge.test.ts` (handles with `source`, `target`, `trigger` resolved). The real
`startRun`, `pressInput`, `candidates`, `netRunStatus`.

| Id | Setup | Measured |
|---|---|---|
| P1 | no guard on Flow_1, Flow_2 | step 1 `ε: Flow_0 (StartNode_0 → DecisionNode_0) fired`; step 2 `pending` `["Flow_1 (DecisionNode_0 → ActionNode_0)","Flow_2 (DecisionNode_0 → ActionNode_1)"]`; choosing Flow_2: `ε: Flow_2 (DecisionNode_0 → ActionNode_1) fired`, `Running` |
| P2 | stored `decision` on DecisionNode, guards `self.source.[decision]` / `else` | initial `true`: `ε: Flow_1 … fired`, `Marking: ActionNode_0 · DecisionNode_0.decision = true`; `false`: `ε: Flow_2 … fired`, `… decision = false`; no defect |
| P3 | the same record without `initial` | Reset `2 defects: Flow_1 guard (undeclared 'decision'); decision (no initial or equation).`; after Flow_0 `Deadlock`, reason `ε: Flow_1 defect, 'decision' is not a state attribute of DecisionNode_0; Flow_2 else, Flow_1 is defective` |
| P4 | events `yes` (`value true`), `no` (`value false`); Flow_1, Flow_2 triggered by both; guards `event.value` / `else` | at Start `epsilon true events []`; at Decision `epsilon false events ["yes","no"]`, `Running`; `no: Flow_2 … fired`; `yes: Flow_1 … fired` |
| P5 | P2 at DecisionNode, guard oracle wrapped: a read of `decision` records a miss and answers `undefined`, or answers a supplied value | probe pass: 0 candidates, misses raw `["DecisionNode_0.decision","DecisionNode_0.decision"]` (the `else` re-evaluates Flow_1), distinct 1, 0.08 ms; `netRunStatus` on the probe pass **`Deadlock`**; supplied `true` → `["Flow_1"]`, `false` → `["Flow_2"]` |

P3 re-measures 2255 §3.3 on the trunk with P2b: the rule R1 now names the read at Reset (`undeclared 'decision'`),
where 2255 saw only the declaration defect. P1 and P2 agree with 2255 §2.1 and S2 [M-2255].

---

## 4. Question 2: design options

The prompt's three options, plus the two that exist today, since they bound what a new mechanism must add.

### 4.0 Today, no change: the selector (0) or an event (0′)

- **(0) Selector.** Two unguarded flows; the choice list is the question (P1). R-SIM-25 as written. Cost only for a
  branch label in the list: a new role, `roleCatalog.ts` `ROLE_IDS` 28 → 29, the dialog's counts move on every scene
  (2255 §6.2). **Risk**: the question reads as a transition name, not a value; nothing is a value in σ.
- **(0′) Events.** An event class with a frozen `value` (P4). The buttons are the question, enabled only at the node.
  Needs Trigger, off in `Flowchart / Activity` (`simProfiles.ts:140-143`, no `trigger` in `active`; `:121` «`Not used by
  ${row.name}`»): a user copy with Trigger on (S11c) or the State machine presets. **Risk**: a boolean becomes two event
  instances; a range of n values becomes n events.
- nuXmv: (0) the selector IVAR; (0′) the event IVAR (spec §8, `claude_spec_…computational_model.md:211-212`).

### 4.1 Option (a): an input form of the Data row

- **Roles.** None new in the catalog. The Data row's form select `stored | derived` (`SimRolesModal.tsx:272-280`) gains
  `input`; the record carries `"input": true` instead of `initial`/`equation`; semantic with a finite domain only.
- **Engine.** Inputs are not σ: they are the third input of the step, held by the bridge for one press. The core keeps
  its signature; one check: an action assigning an input halts `read-only`, today tested only for derived
  (`netStep.ts:257` «`if (decl.equation !== undefined) return halted({ kind: 'read-only', … });`»). The compiler already
  leaves a declaration with no initial out of σ (`netCompile.ts:486`).
- **Panel.** A small dialog at the press when the enabled transitions read an input (§5.4); no panel element added.
- **Checker (P2b).** R1/R2/R6 unchanged (H6). New: an action on an input is `read-only` at Reset (beside
  `simBridge.ts:309-312`); an equation reading an input is a declaration defect, as `event` is
  (`derivedEvaluator.ts:448-456`, «`defect('event', 'the equation reads event');`»); an input on presentation or without
  a domain is a declaration defect. The registry (P2a) inherits all through `startRun` (`simCheckToProblems.ts:7-12`).
- **Demo (after).** ▶ at the DecisionNode opens `Input · DecisionNode_0.decision  [true] [false]`; `false` fires Flow_2
  with no choice list; the Last step title lists `inputs: DecisionNode_0.decision = false`.
- **Risk.** R-SIM-7 amended (ratified). Status and «why» lines must learn «waiting for an input» (H5). A per-element
  input on a metaclass with many instances asks one row per instance read, not per metaclass.
- **nuXmv / STC.** `IVAR` with the declared domain, one per owner after flattening; read in `DEFINE`/`TRANS`/`next()`,
  never in `INIT`, never assigned. STC: an input of the step (spec §4.1), not a state component (spec §3.2); R-SIM-19's
  VAR/DEFINE pair becomes VAR/DEFINE/IVAR.

### 4.2 Option (b): an input bound to an event

- **Roles.** A parameter of the event class: either a new role (`eventParameter`, attribute of the event class, count
  lines move) or option (a)'s row restricted to the event metaclass.
- **Engine.** The event input becomes a record (instance, parameter values); guards read `event.[p]` (the handle stays
  frozen, `guardContext.ts:167-173`, so the value cannot be a slot). Assigned before the transitions fire: the
  candidates of that press see it.
- **Panel.** The event button asks every time its class has a parameter, read or not.
- **Checker.** `event.[p]` never folds (`stcChecks.ts:95`, `x.name === 'event'`), so R2 skips it; new rules: a read of
  `event.[p]` on an ε transition or on a transition none of whose triggers is of p's class.
- **Demo.** Only event-driven profiles; the flowchart DecisionNode needs Trigger turned on (as 0′).
- **Risk.** Amends R-SIM-16's last clause (ratified 2026-09-23): «gli eventi con parametri liberi sono fuori scope».
- **nuXmv / STC.** The event IVAR plus one IVAR per parameter, meaningful when the event is the one carrying it
  (optionally constrained in `TRANS`); STC §7 events gain parameters.

### 4.3 Option (c): no new role, an unset read pauses

- **Roles.** None; a stored row with no initial.
- **Engine.** The codec must accept a record with neither initial nor equation (today `stateAttributesCodec.ts:128`);
  σ must carry «unset»; the guard evaluation must stop on that read and resume after the answer, which then stays in σ.
- **Panel.** The same dialog as (a), once per attribute per run; the Marking line shows `decision = ?` until asked.
- **Checker.** P2b flags exactly this read at Reset (P3: `Flow_1 guard (undeclared 'decision')`): R1 must count a
  declaration without initial, and the codec's record defect goes. R-SIM-72 (provisional) amended.
- **Demo.** As (a) on the first visit; in a loop the second visit does not ask.
- **Risk.** Amends R-SIM-17 (ratified): a failed read is a defect and the arc leaves the candidates
  (`docs/decisions.md:1548-1550`); also R-SIM-25's «mai un'espressione con effetti nella guardia», since the read
  itself triggers the question. The exporter needs an «unset» value no finite domain has.
- **nuXmv / STC.** Not an IVAR: `VAR decision : boolean;` with no `init`, a nondeterministic initial value chosen once
  and asked lazily at the first read. STC §3.4 gains a free initial rule.

### 4.4 Side by side

| | roles | core | bridge | panel | checker | demo scenes | ratified rows amended | nuXmv |
|---|---|---|---|---|---|---|---|---|
| 0 / 0′ | — / Trigger | — | — | — | — | unchanged | — | selector / event IVAR |
| (a) | form value, no role | 1 check | ask + overlay + status | dialog | 3 small rules | ESM select gains an option | R-SIM-7 | IVAR |
| (b) | new role or row | event record | ask at press | dialog | 2 new rules | counts move if role | R-SIM-16 | IVAR per parameter |
| (c) | — | unset σ, resumable read | ask on miss | dialog + `?` | R1 and codec change | ESM select unchanged | R-SIM-17 (and 25) | VAR, free init |

---

## 5. Question 3: the recommended design, option (a)

### 5.1 Semantics

An input declaration has a name, an owner (metaclass or Global), the semantic space and a finite domain. Its value is
chosen by the environment for one step: the step that reads it. It is read with `.[x]` exactly like a stored attribute
(`self.source.[decision]`, `model.[answer]`), in guards and in the right side of actions; it is never assigned, never in
σ, never in the Marking line, never read by an equation. After the step it has no value: the next step that reads it
asks again. The core's parallel assignment is untouched: an action that wants to remember the answer writes it into a
stored attribute (`self.target.[answer] := self.source.[decision]`), which is `next(answer) := in_decision` in nuXmv.

### 5.2 Engine and bridge

- **Ask (bridge).** At a press, for the input (ε or event) pressed: the transitions whose preset is enabled and which
  accept it (`netStep.ts:99-101`, `:95-97`), their guard sites, their `else` siblings' guard sites and their action
  sites. Walk each compiled expression for `StateAccess` nodes whose name is an input declaration; fold the object as R2
  does (`stcChecks.ts:103-118`, `self` the site) to an element; an object that does not fold asks every owner of that
  name. The result is the list of `(element, name, domain)` to ask; empty means today's path, byte for byte. Static,
  so one dialog per press. P5 is the dynamic twin and the test oracle: on the decision model both give
  `DecisionNode_0.decision` once.
- **Evaluate (bridge).** `pressInput(modelId, event, selector, lookup, input, inputs?)` (optional last parameter,
  additive): with `inputs` it wraps `run.guards` and `run.actions` in an overlay of the accessor that answers input
  names from `inputs` and everything else from σ, then calls the unchanged `candidates` and `step`
  (`simBridge.ts:884-893`). The core never sees the map, so σ′ cannot keep it: `step` builds σ′ from `cfg.state` and the
  assignments only (`netStep.ts:268-272`). Without `inputs` and with a non-empty ask list, `pressInput` returns
  `asks` (new optional field of `InputPress`, Rule 11) and commits nothing, as `pending` does.
- **Choice.** Several candidates after the answer: the list opens as today, the panel keeps the values in
  `PendingChoice` (`SimulationPanel.tsx:196-200`) and passes them with the choice.
- **Status (bridge).** A transition that is structurally enabled and reads an input is waiting, not blocked: a
  `runStatus(run)` beside `netRunStatus` answers `Running` when the core says `Deadlock` and some input's ask list is
  not empty (P5 shows the core alone says `Deadlock`). `explain` (`simBridge.ts:763-778`) names it `Flow_1 asks
  decision`, never `defect, 'decision' is not a state attribute`.
- **Core.** `netStep.ts:257` also halts `read-only` on an input; `StateAttributeDecl.input?: true` (`netTypes.ts:39-50`,
  Rule 11); `DeclarationDefectCode` gains `'input'` (additive literal, as R-SIM-70).
- **Last step.** Its title gains a line `inputs: DecisionNode_0.decision = false` after the assignments
  (`simBridge.ts:899-903`). The label of the core is unchanged; the trace of step 5 records the inputs with it.

### 5.3 Checker

R1, R2, R6 unchanged (H6: `net.attributes` and `net.declared` contain the input, semantic). Added: (i) an action whose
target folds to an input, or names only inputs, is `read-only` at Reset (beside `simBridge.ts:309-312`); (ii) an
equation that reads an input is the declaration defect `input` (beside `derivedEvaluator.ts:454-456`); (iii) an input
record on presentation, without a domain, or with `initial`/`equation` is a declaration or record defect (codec and
`netCompile.ts` `declarationDefects`). The problems registry gets (i) through `startRun`, no change in `problems/`.

### 5.4 Panel and dialog

- **Nothing is added to the panel.** The dialog is portaled (`createPortal(…, document.body)`,
  `SimRolesModal.tsx:876-889`), so Step, the choice list and the lines cannot move. The buttons' `title` may add
  `Asks: decision` (title only, R-SIM-60's channel).
- **Shape, from the Simulation roles dialog:** the backdrop and its stacking (`SimRolesModal.scss:23-32`, `z-index:
  var(--z-alert, 10000)`); the root stops keyboard and pointer events so Backspace never reaches the canvas
  (`SimRolesModal.tsx:880-881`); Escape is Cancel (`:412-418`); the focus goes into the dialog on open (`:419`);
  header, body, footer with `Cancel` (secondary) and the primary on the right (`:855-871`). Smaller: 400 px wide,
  height by content, the body scrolling past six rows.
- **Body.** One row per asked `(element, name)`: the label `DecisionNode_0.decision` (a global: `answer`), the control by
  domain: boolean two segment buttons `true`/`false` with none preselected, range a number field bounded by the
  domain, enum a select of its literals. The primary reads the input (`Step`, `Fire yes`) and is off until every row
  has a value; Enter confirms; Cancel leaves the run as it is (R-SIM-35).
- **Data table.** The form select gains `input`; the value cell becomes the existing void span, so the row keeps its
  two lines (the pattern of `SimRolesModal.tsx:301-306`, «Presentation has no domain: the cells stay, hidden, so the
  row keeps its layout»); the space select is fixed to `semantic` on an input row.

### 5.5 Slices

Every slice lists more than five files, so each Phase 2 prompt carries the Rule 19 list; no critical-zone file
(`model/simulation/` and `editor-v2/sim/` are not in §3.1).

| Slice | Files | Tests | Probes |
|---|---|---|---|
| S1 core and codec (pure, tests first) | `model/simulation/netTypes.ts`, `stateAttributesCodec.ts`, `netCompile.ts`, `netStep.ts`, `derivedEvaluator.ts`, `stcChecks.ts` (export the input reads: `walk`, `folds`, `fold` reused) and their `__tests__` | codec round trip with `input`; `input` with `initial` or `equation` a defect; presentation input a defect; step halts `read-only`; equation reading an input a defect; the reads of `self.source.[decision]` fold to `DecisionNode_0` | none |
| S2 bridge | `components/editor-v2/sim/simBridge.ts`, `__tests__/simBridge.test.ts` | `asks` on the decision model; nothing asked when no input is read (every existing test green, the parity oracle); `true`/`false` pick Flow_1/Flow_2; σ′ without the input; `runStatus` Running while waiting; `explain` says `asks`; Reset `read-only` defect | none |
| S3 UI | `sim/SimInputDialog.tsx` (new), `sim/SimInputDialog.scss` (new, tokens only, Rule 28), `sim/SimulationPanel.tsx`, `sim/SimRolesModal.tsx` | helpers of the dialog (rows from asks, confirm gate) in a pure module | on 3031: Step's rect before and after the dialog opens (equal); an input row's height equal to a stored row's; the four scenes of the demo script re-run (RC-31); the decision scene end to end |
| S4 docs | the R- rows below, spec §4.1 and §8, the log | — | — |

Mutation bench (CLAUDE.md §5): the overlay reads σ instead of the map; the ask list ignores `else` siblings; the ask
fires when nothing is read; the map leaks into σ′ (the Marking line shows it); `runStatus` drops the waiting rule
(`Deadlock` at the node); `read-only` dropped for inputs; the codec accepts `input` with `initial`. Each must kill a test.

### 5.6 R- rows it would need (drafted, not written)

- **R-SIM-86 (draft). Input variables.** A third form of state declaration, `input`, beside stored (VAR) and derived
  (DEFINE): semantic, finite domain, neither initial nor equation (extends R-SIM-19; amends R-SIM-72 to «exactly one of
  initial, equation, input»). Its value is chosen by the environment for the step that reads it, never kept in σ,
  never assigned (`read-only` at Reset and in the core), never read by an equation (as `event`, R-SIM-75). nuXmv: IVAR.
  **Amends R-SIM-7**: a step has three inputs, event, selector and the input valuation.
- **R-SIM-87 (draft). When the value is asked.** At a press the bridge collects the input reads of the enabled
  transitions that accept the input (guards, `else` siblings, actions; objects folded as R2), and asks them in one
  dialog before anything is committed; Cancel leaves the run as it is (R-SIM-35); the choice among candidates follows
  with the same values. A transition waiting for an input keeps the run `Running` (precises R-SIM-29). The core stays
  pure: the ask and the overlay are the bridge's (R-SIM-14, R-SIM-59). Last step's title lists the inputs.
- **R-SIM-88 (draft). Dialog and table.** The dialog is portaled with the Simulation roles dialog's shell (backdrop,
  event stop, Escape, focus, footer); nothing is added to the panel (R-SIM-63, R-SIM-65, R-SIM-66 untouched). The form
  select of the Data table offers `input`; the value cell stays as a void cell.
- Spec: §4.1 gains the input valuation; §8 gains the row `input variable | IVAR (declared domain) | free for the
  checker, supplied by the user in simulation`.

---

## 6. Question 4: cost and timing against the freeze (2026-10-01 evening, RC-31)

| Slice | Estimate | Touches the four scenes? | Before the freeze? |
|---|---|---|---|
| S1 | ~3 h | no (no scene declares an input) | can be built; merging it alone is inert |
| S2 | ~3-4 h | no behaviour change (empty ask list), but a trunk commit to `simBridge.ts` obliges a re-run of the readiness probes (`docs/demo/models_2026_simulator_demo.md:11-13`) | can be built; merge carries that re-run |
| S3 | ~4-5 h with the visual check and the four scenes | yes: ESM step 3 opens the form select, which the script lists as `range`, `derived`, `stored` (`:209`, `:215`) | waits for Alfonso (RC-26) |
| S4 | ~1 h | no | with the merge |
| merge (RC-31) | ~1-2 h: tag `pre-sim-input-variables`, gates, four scenes | — | — |

About 1.5 lane-days in all. Before the freeze, without changing a scene: S1 and S2 on this branch, and, with no code at
all, (0) and (0′) as they are. Must wait: S3 (a visible change in the ESM scene) and every merge of S1-S3, which gains
nothing for the demo and adds a readiness re-run the night before. Recommended: build S1-S3 on this branch, merge
after 2026-10-04.

---

## 7. Risks

1. **Status and reasons.** Without the waiting rule a run at the DecisionNode reads `Deadlock` with a defect reason
   (P5). S2 must land `runStatus` and `explain` together with `asks`.
2. **Folding.** An object that does not fold (`self.source.children.first()` over σ) asks every owner of the name: a
   metaclass with many instances gives a long dialog. The dialog scrolls; the rule is conservative, never wrong.
3. **Eager `and`/`or`** (spec §11): irrelevant to the static ask (it reads the AST), relevant to a dynamic one, which is
   why the dynamic probe stays a test oracle and not the mechanism.
4. **Two names, two forms.** A stored and an input declaration of the same name on one element meet the existing
   `twice` defect (`netCompile.ts:473-483`); a stored `decision` on DecisionNode and an input `decision` on another
   metaclass are both legal, and `self.source.[decision]` reads whichever the element has.
5. **Scenarios (step 5).** A replay must carry the input values with each step; the trace format is not written yet,
   so the label must be extended when it is, not now.
6. **The probe's record is synthetic.** P1-P5 ran the real bridge and core over a hand-built `buildEvalContext` record;
   the dialog and the panel are not measured (no UI exists).

## 8. Decisions taken (unattended)

1. The probe ran on the node bench (the real bridge and core), not on 3031: every question here is the engine's, and
   no UI exists to measure.
2. The recommended ask is static (reads collected from the compiled expressions), the dynamic probe kept as oracle.
3. The input is a form of the Data row, not a catalog role, so the dialog's `N of M roles matched` lines do not move.
4. No log entry: the prompt's Never list allows only the report and the Status line.

## 9. Decisions awaiting Alfonso (RC-26)

1. Option (a) amends R-SIM-7 (ratified 2026-09-14): the step's inputs become three.
2. S3 before the freeze would show a third option in the ESM scene's form select.
3. Options (b) and (c) would amend R-SIM-16 and R-SIM-17 (both ratified); not recommended.
