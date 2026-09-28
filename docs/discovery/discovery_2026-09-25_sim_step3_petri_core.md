# Discovery — simulation step 3, the Petri core and the unified cycle

**Prompt-ID**: `P-2026-09-25-0935` (chat `C-2026-09-25-0016`)
**Prompt file**: `docs/prompts/claude_2026-09-25_0935_prompt_sim_step3_discovery.md`
**Session**: `788499b3-5e0d-4a67-ae04-b0e692f651bc`
**Tree**: `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, HEAD `2a0883ac2` (the prompt commit on
top of `dee18d69b`). `pwd` and branch checked first. Working tree clean at the start and at the end.
**Executor**: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), as the session shows it.
**Type**: Phase 1, read-only. No source file modified. This report is a set of hypotheses with
evidence, not a reference: whoever uses it downstream re-reads the real files.
**Tags**: **[M]** measured in this phase (a run), **[R]** read (a file or a doc), **[D]** deduced.
**Scratchpad artefacts** (not committed): a runtime probe on the real editor
(`probe_sim3_guardctx.mts`, 3 runs, ALL GREEN) and a vitest bench with a prototype of the proposed core
(`bench/src/model/simulation/net.ts`), both described in §12.

---

## 0. Summary

1. **Today's engine is a boolean fire-all.** `stepFlowchartBoolean` fires every accepted transition of
   every marked instance in one step, deactivations before activations (`step.ts:115-124`, `:40-49`);
   `runStatus` has four values and reads `Deadlock` as soon as any marked instance has no outgoing
   transition (`step.ts:188-194`). `simTerminal` is read on 13 lines across 4 files (§4.2).
2. **The target is a compiled net plus a step over it**: σ = marking `place → 0..k` plus declared
   attributes; a compiler from the STC roles to transitions with weighted preset and postset,
   inhibitors, triggers, guard sites, `else` siblings and action sites; candidates, admissibility,
   effect, label and status as pure functions (§5). A scratchpad prototype runs the three worked
   examples of §5.4 green **[M]**.
3. **The derived boolean view stays where it is.** Every consumer outside `sim/` reads the marking
   through `isSimActive(id)` or `useSimVersion()` (`ObjectNode.tsx:271-272`, `irReadCtxLproxy.ts:21`,
   `:63`, four IR hooks). If `isSimActive` answers `tokens > 0`, ObjectNode and the IR need no change
   (R-SIM-11) **[R]**.
4. **Measured: 20 of the 70 current core tests encode behaviour R-SIM-21..26 changes** with the
   recommended "all tokens final" predicate, 13 with the "any token final" one. The other 50 pass
   unchanged on the prototype, which is the parity measure for the derived `isMarked` (§7) **[M]**.
5. **Carried items settled.** (i) No caller of `buildEvalContext` exists in the simulator yet; the
   `targetMetamodelId` defect is real and measured in validation's path: with a second metamodel and the
   M1 tab active, the pool is **0** without the id and **1** with it (§8.1) **[M]**. (ii) On the real
   editor, the record of `buildEvalContext` holds **0** L proxies outside `data`/`node`, shares **0**
   objects with the store, freezes, and guards answer true/false on real handles; with a selection,
   `data` and `node` each carry 1 live proxy and the strip removes them (§8.2) **[M]**.
6. **3a is six new files and no modified one**: the core beside today's step, unwired until 3b (§10).
7. **Baseline**: typecheck 14 (the §17 set), vitest 4530 passed with the 9 files red at import, build
   exit 0, `check:docs` 4/4, `check:scripts` 1 hit (the expected `_tmp_sim1_verify.ts:186`) **[M]**.

---

## 1. Open questions for Alfonso

The four open points of R-SIM-24 and R-SIM-26 first, recommendation first; §6 has the alternatives and
their cost.

1. **(a) Form of the termination predicate.** Recommended: *every marked place is final*
   (the marking is non-empty and its support is inside F, F = the places of the terminal role), and a
   terminated configuration has no candidates. Alternatives: *some marked place is final* (today's
   rule), or a JjEL predicate in the STC after the `.[x]` lane.
2. **(b) The `simTerminal` role.** Recommended: **optional**, the source of F when set; unset means no
   termination (the run ends in `Deadlock` or never). This reverses the ruling of `P-2026-09-24-1005`
   ("`simTerminal` stays required") and closes the step 1 ticket on the `TFinal` workaround.
3. **(c) Termination vs deadlock.** Recommended: distinguish them, five statuses: `Not started` (no run
   in the store), `Running`, `Terminated`, `Deadlock` (not terminated, no candidate for ε nor for any
   event, guards evaluated), `Halted` (sticky after an unsafe firing or an action defect, with the reason;
   cleared by Reset).
4. **(d) The marking accessor for inhibitor guards.** Recommended: the core accessor is
   `SimStateReader` (`guardContext.ts:66-73`) plus `tokens(id)`; the JjEL surface is `x.[marked]`
   (boolean, R-SIM-11) and `x.[tokens]` (0..k), read-only, reached from any root, no new root, when the
   `.[x]` operator lands; until then inhibitor arcs compile from an optional role into a core guard
   conjunct `tokens(p) < w`. The subset checker accepts both as exportable; today `.[` does not parse,
   so nothing reaches it.

Secondary, one line each:

5. `else`: the literal text `else` in the guard feature (recommended, UML `[else]`, no new key) or a
   boolean attribute role `simElse`?
6. An edge with no target in the model: a compile defect, never a candidate (recommended), or a sink
   that consumes the token (today's quirk, `step.test.ts:109`)?
7. Fork and join nodes are not places: their edges fuse into one transition (recommended), or they stay
   places and are marked for one step?
8. Ratify the new flat keys of §5.3: `simBound`, `simInitialMarking`, `simFork`, `simJoin`, `simGuard`,
   `simArc`, `simArcSource`, `simArcTarget`, `simArcWeight`, `simInhibitorArc` (plus `simSource`,
   already R-SIM-10).
9. 3a scope: control-flow and Petri-arc compilation together (recommended), or control-flow only, with
   the arc roles moved to the "Petri nets as third language" point of spec §9?
10. The new core sits beside `stepFlowchartBoolean`, unwired, from 3a to 3b; 3b deletes the old step.
    Is that compatible with R-SIM-7's "sostituito, non affiancato" (one semantics wired at any time)?
11. Laws (spec §3.3) stay out of step 3; the flowchart law "exactly one node marked" no longer holds
    once fork roles exist (R-SIM-22), so spec §3.3 and §3.4 want an amendment. Confirm.
12. The event and ε buttons stay structural (R-SIM-16): preset enabled and trigger match, guards and
    inhibitors not evaluated. Confirm.
13. Commit type of 3a: `feat:`?

---

## 2. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The boolean marking has consumers outside `sim/` that read the `Set` directly | **Falsified** | every external read goes through `isSimActive` or `useSimVersion` (§4.3) **[M]** grep, control positive |
| H2 | Flowchart and statechart runs of today are reproduced by the Petri core wherever the old step was deterministic | **Holds** | 50 of 70 committed tests pass on the prototype, and each of the 20 that fail is a named R-SIM-21..26 change (§7) **[M]** |
| H3 | The guard context of step 2 works on the real `buildEvalContext` output, not only on fixtures | **Holds** | 0 proxies, 0 shared objects, freeze ok, guards true/false on real handles (§8.2) **[M]** |
| H4 | The `targetMetamodelId` fallback only matters in theory (the active metamodel is usually right) | **Falsified** | from an M1 tab `getActiveMetamodel()` is `null` by design and the fallback is `metamodels[0]`: pool 0 vs 1 (§8.1) **[M]** |
| H5 | Fork and join need no new core construct | **Holds** | fusion of pseudo-node edges into one transition gives the same pre/post sets as the arc form (§5.4 Ex3) **[M]** prototype |
| H6 | The inhibitor accessor can be written in today's JjEL without a new root | **Falsified** | `.[` does not parse (step 2 report `[4f]`); the alternatives need a call (E-CALL, no builtins on path B) or break R-SIM-18 (§6.4) **[R]** |
| H7 | 3a can land without touching a committed file | **Holds** | the new core needs only new names (0 hits each, §10.1) and the old step stays for the panel until 3b **[M]** grep |

---

## 3. Objective and files read

Objective: the four questions of the prompt (engine map, target types, the four open points, the
slicing) and the two carried items of `P-2026-09-24-1520`, with a 3a proposal and its test plan.

Read in full unless a range is given, all under `/Users/alfonso/jjodel-sim/`:

- `CLAUDE.md`; `docs/PROTOCOL.md` (P1..P15); `frontend/src/components/editor-v2/CLAUDE.md`
- `docs/prompts/claude_2026-09-25_0935_prompt_sim_step3_discovery.md`
- `docs/decisions.md` 1254-1470 (R-SIM-1..26), 1470-1640 (R-J, R-MK), 3466-3476 (R-VAL-18)
- `docs/ratifiche/claude_ratifiche_2026-09-25_rsim21_nucleo_petri.md`
- `docs/spec/claude_spec_2026-09-13_computational_model.md` (whole)
- `docs/sessioni/sessione_2026-09-24.md` 47-60 (the paragraph behind R-SIM-21..26)
- `docs/claude-code-log.md` 1-150 (the entries of 2026-09-24)
- `docs/discovery/discovery_2026-09-24_sim_step2_eval_context.md` (whole);
  `docs/discovery/discovery_2026-09-23_sim_step1_events.md` (whole)
- `frontend/src/model/simulation/`: `types.ts`, `step.ts`, `stcFromRoles.ts`, `isKindOf.ts`,
  `objectSlots.ts`, `guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts`; `__tests__/step.test.ts`,
  `events.test.ts`, `guardContext.test.ts` (whole); `guardEvaluator.test.ts` 1-80
- `frontend/src/components/editor-v2/sim/`: `SimulationPanel.tsx`, `simRunState.ts`, `simRoleStatus.ts`
  (whole); `simulation-panel.scss` 360-386; `__tests__/simRoleStatus.test.ts` 26-56
- Consumers of the marking: `editor-v2/nodes/ObjectNode.tsx` 262-275 and the three class lines;
  `viewpoint/ir/irReadCtx.ts` 36-46, 138-190; `irReadCtxLproxy.ts` 1-65; `irCompile.ts` 185-225; grep of
  `irResolve.ts`, `useIRContainment.ts`, `useIRFormView.ts`, `irTypes.ts`
- Callers of `buildEvalContext`: `jjscript/executor/commands/eval.ts` 20-40, 88-210;
  `jjscript/executor/utils.ts` 41-115, 286-318; `jjscript/executor/activeArtifact.ts` 57-79;
  `components/Jodie/jodieJjelContext.ts` 20-50; `model/validation/validationContext.ts` 100-190;
  `pages/components/Navbar.tsx` 73-116 (for the probe)
- `editor-v2/problems/validationFreshness.ts` 1-40 and its export list (the R-VAL-18 pattern)
- `frontend/scripts/smoke/_tmp_sim1005_verify.ts` 1-200 (read to copy the turnstile construction; not
  modified); `frontend/vite.config.ts` 1-60; `frontend/vitest.config.ts`

---

## 4. Question 1 — where the engine stands

### 4.1 The map

| Function / type | file:line | What it does today | What the Petri core changes |
|---|---|---|---|
| `SimConfiguration` | `types.ts:26-29` | `readonly marking: ReadonlySet<string>; readonly event: string \| null;` | `NetConfiguration { state: SimState; event }`, marking `Map<place, 1..k>` plus attributes (§5.1) |
| `StcRoles`, `StcDescriptor` | `types.ts:45-61` | four required pointers (`terminal: string;` at `:47`), `kind: 'boolean'` only | `NetStc`, shape control-flow or Petri, `bound` k, `terminal?` (§5.3) |
| `StepLabel` | `types.ts:76-82` | `fired`, `deactivated`, `activated`, `event?`, `discarded?` | `NetLabel`: inputs, candidates, every evaluated guard, consumed/produced arcs, assignments (§5.2) |
| `SimRunStatus` | `types.ts:91` | `'Not started' \| 'Running' \| 'Terminated' \| 'Deadlock'` | five values (§6.3); the panel duplicates the type at `SimulationPanel.tsx:221` |
| `applyStepLabel` | `step.ts:40-49` | "the ids in `deactivated` leave, then the ids in `activated` enter, so activation wins" | no counterpart: M' = M − pre + post; a self-loop keeps its token by arithmetic |
| `initialConfiguration` | `step.ts:87-92` | every instance of the initial metaclass among `ids` | 1 token per initial instance, or the value of `simInitialMarking` (R-SIM-9); above k a compile defect |
| `stepFlowchartBoolean` | `step.ts:102-134` | freeze on any marked terminal (`:110-113`); "every outgoing transition of every marked instance fires in one step" over the accepted ones (`:115-124`); a dangling target still deactivates the source (`:121-123`); discard flag (`:126-129`) | candidates → selector (admissibility, progress) → effect (consume, produce, «unsafe», parallel assignments) → label (§5.2) |
| `accepts`, `triggersOf` | `step.ts:66-75` | ε accepts the untriggered, an event the transitions it is among the triggers of; no role, no triggers | same rule, read once at compile into `NetTransition.triggers` |
| `enabledEvents`, `epsilonEnabled` | `step.ts:157-180` | structural on marked instances, empty on a terminal freeze; without the event role ε is enabled unless terminal | structural on the net (preset enabled and trigger), empty when terminated; without the role ε is no longer enabled on a stuck marking (`events.test.ts:111`, §7) |
| `runStatus` | `step.ts:188-194` | "'Deadlock' when ANY marked instance has no outgoing transition, even if others can still progress" | on the candidate set (§6.3) |
| `eventAlphabet` | `step.ts:141-148` | instances of the event metaclass, sorted | unchanged |
| `stcFromRoles` | `stcFromRoles.ts:22-47` | `if (!initial \|\| !terminal \|\| !ownedTransitions \|\| !nextState) return null;` (`:28`) | `netStcFromRoles` beside it in 3a; the old one goes in 3b |
| `ROLE_SORTS`, `roleOverlaps`, verdicts | `stcFromRoles.ts:54-129` | `{ sort: 'node', keys: ['simNode', 'simInitial', 'simTerminal'] }` (`:55`) | fork and join join the node sort, arcs get a sort of their own (3b) |
| `isKindOf`, `classIsKindOf` | `isKindOf.ts:26-51` | ancestry walk, R-SIM-8 | unchanged |
| `objectSlotValues`, `objectReferences`, `objectLabel` | `objectSlots.ts:20-73` | raw reads by feature pointer, for trigger and label | the only readers of the compiler: targets (multi), sources, arcs, weights, guard text |
| run-state map, `store` | `simRunState.ts:22`, `:35-38` | `configurations.set(modelId, { marking, event: null })`; an empty marking deletes the entry (`:36`) | one entry per started run, even with an empty marking; holds the compiled net and a halt reason |
| `isSimActive` | `simRunState.ts:45-48` | `c.marking.has(objectId)` over every model | `tokens > 0` over every model (§5.5) |
| `getSimActiveIds` | `simRunState.ts:55-60` | ids of the Set | ids with `tokens > 0` |
| `simApplyStep` | `simRunState.ts:91-97` | applies a label through `applyStepLabel` | replaced by a commit of the whole next configuration (3b) |
| `simReset`, `simClear`, version | `simRunState.ts:68-78`, `:100-118` | | same names and contract |
| `ENGINE_ROLE_KEYS`, `missingEngineRoles` | `simRoleStatus.ts:58`, `:75-79` | the four keys, Terminal included | per open point (b) and per shape (3b) |
| panel readers | `SimulationPanel.tsx:151-175` | outgoing transitions and target through the L proxy by name, single `.value` | raw by pointer, multi-valued (R-SIM-10) |
| panel memos, handlers | `SimulationPanel.tsx:289-313`, `:315-357` | status, enablement, Reset, `fire` → `simApplyStep(modelid, label.deactivated, label.activated)` (`:356`) | bridge to the new core, candidate chooser, five statuses (3b) |
| `SimStateReader` | `guardContext.ts:66-73` | "Type only in step 2" | implemented by the core's `stateAccess(σ)`, plus `tokens` |
| guard evaluator | `guardEvaluator.ts:60-113` | "The step does not call this module yet" (`:21`) | the guard oracle of the core, wired by the 3b bridge |

### 4.2 Where `simTerminal` is read **[M]**

`command grep -rn "terminal\|Terminal"` over `model/simulation/*.ts` and `editor-v2/sim/*`, comments
excluded: `stcFromRoles.ts:25` (`const terminal = pointer(state, 'simTerminal');`), `:28` (the null
rule), `:32`, `:55` (node sort); `step.ts:79` (`anyTerminal`), `:110` (freeze), `:161`, `:177` (buttons),
`:191` (status); `types.ts:47`; `simRoleStatus.ts:18`, `:38`, `:58`. The prompt's `stcFromRoles.ts:25`
and `:55` are confirmed. Two tests pin the requirement: `step.test.ts:322` and
`simRoleStatus.test.ts:48`, which asserts that `missingEngineRoles` and `stcFromRoles` agree over the 16
subsets of the engine keys: making Terminal optional in one and not the other turns it red **[R]**.

### 4.3 The consumers of the boolean marking **[M]**

`command grep -rn` of `isSimActive|useSimVersion|getSimVersion|getSimActiveIds|simApplyStep|simReset|simClear|isMarked|'marked'|sim-active`
over `frontend/src` (`.ts`, `.tsx`, `.scss`, tests excluded), exit 0, the known lines found (positive
control: the definitions in `simRunState.ts`). Outside `sim/`:

- `ObjectNode.tsx:271-272`: `useSimVersion();` / `const isSimActiveNode = typeof simObjectId === 'string' && isSimActive(simObjectId);`,
  class `sim-active` at `:908`, `:1148`, `:1198`; style at `simulation-panel.scss:382-386`.
- `irReadCtxLproxy.ts:21` and `:63`: `makeDrawReadCtx(idlookup, isSimActive)`, the single injection
  point of `ReadCtx.isMarked` (`irReadCtx.ts:42`, `:150-153`).
- `irCompile.ts:193-222`: `channelSink?.add('mark');` (`:198`) and `ctx.isMarked(id)` (`:199`, `:220`).
- `useSimVersion` as the `'mark'` channel subscription: `irResolve.ts:89`, `:179`;
  `useIRContainment.ts:120`; `useIRFormView.ts:99`; all gated on `channelsInUse?.has('mark')`.

None reads the `Set`: the contract is `isSimActive(id): boolean` plus the version counter. H1 falsified.

---

## 5. Question 2 — the target, as types

### 5.1 σ and the configuration (R-SIM-19, R-SIM-23)

```ts
export type SimValue = boolean | number | string;           // an enum literal is a string
export type Domain =
    | { readonly kind: 'boolean' }
    | { readonly kind: 'range'; readonly min: number; readonly max: number }
    | { readonly kind: 'enum'; readonly literals: readonly string[] };

/** R-SIM-19: declared in the STC per metaclass. `marked` and `tokens` are reserved names (§6.4). */
export interface StateAttributeDecl {
    readonly name: string;
    readonly metaclass: string;                              // DClass id; every kind-of instance carries it
    readonly space: 'semantic' | 'presentation';
    readonly domain: Domain | null;                          // required when semantic
    readonly initial: SimValue;
}

/** σ, owned by the engine. The marking: place id -> 1..k, an absent place holds 0. */
export interface SimState {
    readonly marking: ReadonlyMap<string, number>;
    readonly attrs: ReadonlyMap<string, ReadonlyMap<string, SimValue>>;         // element id (model id for globals)
    readonly presentation: ReadonlyMap<string, ReadonlyMap<string, SimValue>>;
}
export interface NetConfiguration { readonly state: SimState; readonly event: string | null }

/** The read-only accessor of open point (d): step 2's reader plus the count. */
export interface SimStateAccess extends SimStateReader { tokens(elementId: string): number }
```

### 5.2 The compiled net, candidates, effect, label, status

```ts
export interface Arc { readonly place: string; readonly weight: number }    // weight >= 1

export interface NetTransition {
    readonly id: string;                        // the edge id; a fused fork/join: the node id, or `F#e` when several
    readonly origin: readonly string[];         // the M elements compiled into it (label, canvas in 3c)
    readonly preset: readonly Arc[];            // one Arc per place, weights summed
    readonly postset: readonly Arc[];
    readonly inhibitors: readonly Arc[];        // guard conjuncts tokens(p) < weight (R-SIM-24)
    readonly triggers: readonly string[];       // event instance ids; [] = ε only (R-SIM-16)
    readonly guardSites: readonly string[];     // elements whose guard applies, conjoined
    readonly elseOf: readonly string[] | null;  // R-SIM-25: guard = not (g1 or ... or gn) of these siblings
    readonly actionSites: readonly string[];    // exit(source), the edge, entry(target): one parallel assignment
}

export type NetDefectCode = 'no-target' | 'no-source' | 'not-a-place' | 'pseudo-chain' | 'pseudo-open'
    | 'bad-arc' | 'bad-weight' | 'else-twice' | 'initial-over-bound';
export interface NetDefect { readonly element: string; readonly code: NetDefectCode; readonly message: string }

export interface CompiledNet {
    readonly modelId: string;
    readonly places: ReadonlySet<string>;
    readonly transitions: readonly NetTransition[];   // a defective transition is not here, only in `defects`
    readonly bound: number;                           // k (R-SIM-23), default 1
    readonly final: ReadonlySet<string> | null;       // F; null = no termination predicate (open points a, b)
    readonly hasEventRole: boolean;
    readonly attributes: readonly StateAttributeDecl[];
    readonly initial: SimState;
    readonly defects: readonly NetDefect[];
}

/** Injected by the caller: the core stays pure (R-SIM-14). GuardOutcome is guardEvaluator.ts's. */
export type GuardOracle = (site: string, event: string | null, state: SimStateAccess) => GuardOutcome;
export interface SimAssignment { readonly element: string; readonly attr: string; readonly value: SimValue }
export type ActionOutcome = { kind: 'ok'; assignments: readonly SimAssignment[] } | { kind: 'defect'; detail: string };
/** Every right-hand side is evaluated on σ, the state BEFORE the step (spec §4.4, R-SIM-17). */
export type ActionOracle = (site: string, event: string | null, state: SimStateAccess) => ActionOutcome;

export interface Candidate {
    readonly transition: string;
    readonly unsafe: { readonly place: string; readonly value: number } | null;   // firing it would exceed k
}
export type Evaluation = GuardOutcome | { kind: 'inhibited'; place: string } | { kind: 'else'; outcome: GuardOutcome };
export interface CandidateSet {
    readonly event: string | null;
    readonly terminated: boolean;                     // true: no candidate by definition (open point a)
    readonly candidates: readonly Candidate[];
    readonly evaluated: ReadonlyArray<{ readonly transition: string; readonly outcome: Evaluation }>;
}

export interface NetLabel {                           // spec §4.5
    readonly event: string | null;
    readonly selector: string | null;
    readonly candidates: readonly string[];
    readonly evaluated: CandidateSet['evaluated'];    // every guard evaluated, the chosen one included
    readonly consumed: readonly Arc[];
    readonly produced: readonly Arc[];
    readonly assignments: readonly SimAssignment[];
}
export type HaltReason =
    | { kind: 'unsafe'; place: string; value: number; bound: number }
    | { kind: 'domain'; element: string; attr: string; value: SimValue }
    | { kind: 'double-assignment'; element: string; attr: string }
    | { kind: 'action-defect'; site: string; detail: string };
export type StepOutcome =
    | { kind: 'fired'; next: NetConfiguration; label: NetLabel }
    | { kind: 'discard' | 'quiescence'; next: NetConfiguration; label: NetLabel }
    | { kind: 'halted'; reason: HaltReason; next: NetConfiguration; label: NetLabel }   // marking unchanged, event consumed
    | { kind: 'inadmissible'; label: NetLabel };
export type NetRunStatus = 'Not started' | 'Running' | 'Terminated' | 'Deadlock' | 'Halted';

export function netStcFromRoles(bag: Record<string, unknown> | undefined): NetStc | null;
export function compileNet(stc: NetStc, view: NetModelView, modelId: string, ids: readonly string[],
    decls?: readonly StateAttributeDecl[]): CompiledNet;
export function stateAccess(state: SimState): SimStateAccess;
export function tokens(state: SimState, place: string): number;
export function isMarked(state: SimState, id: string): boolean;       // tokens != 0 (R-SIM-11)
export function terminated(net: CompiledNet, state: SimState): boolean;
export function candidates(net: CompiledNet, cfg: NetConfiguration, guards: GuardOracle): CandidateSet;
export function admissible(cs: CandidateSet, selector: string | null): boolean;
export function step(net: CompiledNet, cfg: NetConfiguration, selector: string | null,
    guards: GuardOracle, actions: ActionOracle): StepOutcome;
export function netRunStatus(net: CompiledNet, cfg: NetConfiguration | null, alphabet: readonly string[],
    guards: GuardOracle, halt: HaltReason | null): NetRunStatus;
export function structuralInputs(net: CompiledNet, state: SimState): { epsilon: boolean; events: ReadonlySet<string> };
```

The rules the functions implement, in the order of the spec:

- **Candidates (§4.2)**, per transition t in compile order: (1) the input accepts t (ε an untriggered
  t, an event a t it is among the triggers of; without the event role triggers are `[]`); (2) the
  preset is enabled, `∀(p,w) ∈ pre(t): M(p) ≥ w`; (3) no inhibitor blocks, `∀(p,w) ∈ inh(t): M(p) < w`,
  else `inhibited`; (4) the guard: the conjunction of the guard sites, or for an `else` transition
  "no sibling true, no sibling a defect"; a defect is never true (R-SIM-17, spec §5.2). A terminated
  marking has no candidates. Steps (3) and (4) are recorded in `evaluated`.
- **Admissibility and progress (§4.3)**: a selector is admissible iff it names a candidate; `null` iff
  there is none. `null` with an event is a discard, without one quiescence; both keep σ, and
  quiescence returns the input configuration itself.
- **Effect (§4.4)**: `M' = M − pre(t) + post(t)`; if some `M'(p) > k` the outcome is `halted`/`unsafe`
  and nothing is applied (R-SIM-23: "il run si ferma e lo segnala, non satura"). The check is on M', so
  a self-loop at k = 1 is safe. Then the actions of every action site, all right-hand sides read on σ,
  all writes together; two writes to one target are `double-assignment`, a value outside its domain is
  `domain` (spec §3.2); both halt. `next.event` is always `null`.
- **Candidate flags**: `unsafe` is computed on every candidate, so the panel and the policy see it before
  choosing; choosing it halts.
- **nuXmv**: `m_p : 0..k` per place (`VAR`); `en_t := ∧ m_p ≥ w ∧ ∧ m_q < w' ∧ guard` (`DEFINE`);
  admissibility and progress as today's §8 `TRANS`; `next(m_p) := case sel = t : m_p − pre + post; … TRUE : m_p; esac`;
  «unsafe» as `INVARSPEC !(sel = t & m_p − pre + post > k)` for each (t, p) where it can happen.

### 5.3 Compilation rules, role by role

| Construct and roles | Places | Transition(s) | Preset | Postset | Weights | Also |
|---|---|---|---|---|---|---|
| Edge t owned by s (`simOwnedTransitions`, today) | s and the targets | t | {s} | the values of `simNextState` (R-SIM-10: several) | 1 | triggers `simTrigger`; guard site t |
| Edge with `simSource` (R-SIM-10) | sources, targets | t | the values of `simSource` | the values of `simNextState` | 1 | a multi-source edge is an AND-join, a multi-target edge a parallel fork, with no pseudo-node |
| Fork node F (`simFork`), in-edge e, out-edges e1..en | F is **not** a place | one per in-edge: id F, or `F#e` when F has several | sources(e) | ∪ targets(ei) | 1 | triggers of e; guard sites e, e1..en conjoined (a guard on a fork branch gets an authoring warning) |
| Join node J (`simJoin`), in-edges e1..en, out-edge e | J is **not** a place | one per out-edge: id J, or `J#e` | ∪ sources(ei) | targets(e) | 1 | triggers of e; "senza token sugli archi" (R-SIM-22) |
| Node both fork and join | not a place | one | ∪ sources(in) | ∪ targets(out) | 1 | |
| Edge between two pseudo-nodes | | none | | | | defect `pseudo-chain` |
| Decision block (a plain node) with guarded edges and one `else` | a place | one per edge | {D} | target | 1 | the `else` edge gets `elseOf` = its siblings (same preset, same triggers); two `else` edges: defect `else-twice` |
| Merge, non-deterministic fork, external choice | | ordinary edges | | | | conflicts; the selector chooses (R-SIM-22, R-SIM-25) |
| Edge whose target is unset, deleted, or not a node (`simNode` set) | | none | | | | defect `no-target` / `not-a-place` (question 6) |
| Petri transition t (`simTransition`), arcs a (`simArc`, `simArcSource`, `simArcTarget`) | instances of `simNode` | t | Σ over arcs place→t | Σ over arcs t→place | `simArcWeight`, default 1 | an arc of `simInhibitorArc` place→t is an inhibitor (p, w); an arc not joining a place and a transition is `bad-arc` |
| Initial | | | | | | control-flow: 1 token on each instance of `simInitial`; Petri: `simInitialMarking` (R-SIM-9); above k: `initial-over-bound` |
| Final | | | | | | F = instances of `simTerminal` among the places, when set |
| k | | | | | | `simBound`, default 1 |
| Entry, exit, arc actions | | | | | | action sites exit(source), the edge, entry(target) (R-SIM-17); the keys come with the Action lane |

The shape is Petri iff `simArc` is set; otherwise control-flow. R-SIM-9's two kinds collapse into k
and the initial rule: "boolean" is k = 1 with the metaclass rule, "natural" is the integer feature.
`simNode` and `simTransition`, declarative today (`simRoleStatus.ts:50-57`), are read by the Petri shape.
The new keys have 0 hits over `frontend/src` and `frontend/scripts` (§10.1).

### 5.4 Three worked examples, computed by hand, re-run on the prototype **[M]**

Guards and actions below are written in the R-SIM-18 surface (`model.[x]`), which does not parse yet;
in 3a they are TypeScript oracles over σ. All three are in the bench's `worked.test.ts`, 4 of 4 green.

**Ex1, flowchart with a decision block and an `else`.** `S -e1-> Inc -e2 / model.[x] := model.[x] + 1 -> D`,
`D -e3 [model.[x] < 2]-> Inc`, `D -e4 [else]-> E`. Terminal `End` = {E}, k = 1, σ₀ = {S:1}, x = 0.
Compiled: e1 {S}→{Inc}; e2 {Inc}→{D} with action site e2; e3 {D}→{Inc}, guard site e3;
e4 {D}→{E}, `elseOf = [e3]`.
- At ({D:1}, x = 1): e3 true, e4 = not(true) = false. **Candidates {e3}**; evaluated `[e3: true, e4: else(false)]`.
- At ({D:1}, x = 2): e3 false, e4 true. **Candidates {e4}**. Step with selector e4: consumed {D:1},
  produced {E:1}; σ' = {E:1}; all tokens are in F, so `Terminated`, and the next candidate set is empty.
- With e3 a defect (say its guard throws), e4 is a defect too: no candidate, the label says why.

**Ex2, statechart with an event trigger.** Turnstile: `tCoin: Locked -coin-> Unlocked / model.[coins] := model.[coins] + 1`,
`tPushU: Unlocked -push-> Locked`, `tPushL: Locked -push-> Locked`; `entry(Unlocked): model.[last] := model.[coins]`.
No terminal role. Alphabet {coin, push}.
- At {Locked:1}: ε → ∅ (quiescence); coin → **{tCoin}**; push → **{tPushL}**. At {Unlocked:1}: coin → ∅ (discard), push → {tPushU}.
- Step (Locked, coins = 0, last = 0), e = coin, selector tCoin: consumed {Locked:1}, produced
  {Unlocked:1}; action sites exit(Locked), tCoin, entry(Unlocked), read on σ: coins := 0 + 1, last := coins = **0**.
  σ' = {Unlocked:1}, coins = 1, last = 0, e' = none. A sequential reading would give last = 1: this is
  the case the parallel-assignment test pins.
- tPushL at {Locked:1}: M' = 1 − 1 + 1 = 1 ≤ k: a self-loop is not unsafe.
- Selector tCoin at (Unlocked, coin) is `inadmissible`.

**Ex3, Petri net with a parallel fork, an AND-join and an inhibitor.** Places p0, a1, b1, a2, b2, done;
arcs p0→tf, tf→a1, tf→b1, a1→ta, ta→a2, b1→tb, tb→b2 (w 2), **a1 ⊸ tb** (inhibitor), a2→tj,
b2→tj (w 2), tj→done; k = 2; M₀ = {p0:1}.
Compiled: tf {p0:1}→{a1:1, b1:1} (parallel fork); ta {a1:1}→{a2:1}; tb {b1:1}→{b2:2}, inhibitors {a1:1};
tj {a2:1, b2:2}→{done:1} (AND-join).
- M₀: {tf}. M₁ = {a1:1, b1:1}: tb's preset is enabled but a1 = 1 ≥ 1 blocks it, evaluated
  `tb: inhibited(a1)`; **candidates {ta}**. Step ta: M₂ = {a2:1, b1:1}.
- M₂: {tb} (a1 = 0 now; tj needs b2 ≥ 2). Step tb: M₃ = {a2:1, b2:2}. M₃: {tj}. M₄ = {done:1}:
  no candidate, no F: **`Deadlock`** (the dead marking of a Petri net without a predicate: open points b, c).
- With k = 1 at M₂: candidate `{ transition: tb, unsafe: { place: b2, value: 2 } }`; selecting it halts,
  M₂ unchanged.
- The same net written as a flowchart with a fork node F (`p0 -e0-> F`, `F -e1-> a1`, `F -e2-> b1`)
  and a join node J (`a2 -e3-> J`, `b2 -e4-> J`, `J -e5-> done`) compiles to F: {p0}→{a1, b1} and
  J: {a2, b2}→{done}, with origins `[e0, F, e1, e2]` and `[e3, e4, J, e5]`, F and J not places
  (weights 1: the flowchart form has no weights).

### 5.5 What survives, what is replaced, and the derived `isMarked`

- **Survive as they are**: `isKindOf.ts`, `objectSlots.ts`, `eventAlphabet`, `SimEventInfo`,
  `guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts` (it gains the `.[x]` case with its lane),
  the run-state API names (`isSimActive`, `getSimActiveIds`, `simReset`, `simClear`, `getSimVersion`,
  `useSimVersion`), the `'mark'` channel.
- **Replaced in 3b**: `stepFlowchartBoolean`, `applyStepLabel` and the activation-wins rule,
  `simApplyStep`, `runStatus`, `enabledEvents`/`epsilonEnabled`, `SimConfiguration` (a changed exported
  interface: to be authorized, rule 11), `StepLabel`, `SimRunStatus`, `stcFromRoles` and `StcRoles`
  (by `netStcFromRoles`/`NetStc`), the proxy readers of the panel.
- **Derived `isMarked`** (R-SIM-11: "valore diverso dal default del dominio"): the marking's default is
  0, so `isMarked(σ, x) ⇔ tokens(σ, x) ≠ 0`, and `isSimActive(id)` answers it over every model's run.
  `ObjectNode.tsx` and the IR files need no diff (§4.3). Two visible differences, both of
  construction: a fork or join node, not being a place, is never highlighted (today a fork node in a
  flowchart is marked for a step); an edge is never a place, as today.

---

## 6. Question 3 — the four open points

### 6.1 (a) The form of the termination predicate

**Recommendation: all tokens final.** `terminated(M) ⇔ M ≠ 0 ∧ ∀p. M(p) > 0 ⇒ p ∈ F`, and a terminated
configuration has no candidates (the freeze of today, kept as a definition). It is the predicate that
stays right under a parallel fork: with one token it equals today's rule, with two it waits for both.
nuXmv: `DEFINE terminated := (m_f1 > 0 | …) & m_p1 = 0 & …` over the non-final places.

| Option | Behaviour | Cost, measured on the committed tests (§7) |
|---|---|---|
| (a1) all final, recommended | a branch that reaches an end waits for the others | 20 of 70 change |
| (a2) some final (today's `step.ts:110`) | one branch ending freezes the others mid-way, the quirk pinned at `step.test.ts:119` | 13 of 70 change; the 7 of difference are the `F` + other token fixtures |
| (a3) a JjEL predicate over the accessor, an STC key | arbitrary (exact final marking, `marked(End) and not marked(Error)`) | needs the Expression type (not ratified) and the `.[x]` lane; the natural extension of (a1), not a replacement |
| (a4) exact final marking (classic workflow nets) | Petri only | expressible in (a3) |

### 6.2 (b) The fate of `simTerminal`

**Recommendation: optional; when set it is F, the source of (a1); when unset there is no termination.**
A Petri STC leaves it unset (R-SIM-9 says the natural kind has no final role; this makes the role
allowed there, not required: a small amendment of R-SIM-9). A statechart without a final state no
longer needs the `TFinal` metaclass with no instance (the ticket in the step 1 log entry of
2026-09-24, "The run controls stay hidden until the Terminal role is set").
It reverses the ruling of `P-2026-09-24-1005` that kept the role required, so it needs saying.

- Keep required: the panel gate stays as is; the Petri shape then needs a dummy metaclass, which R-SIM-9
  forbids in spirit.
- Remove: termination only through (a3), which is blocked on two lanes.
- Cost of the recommendation, all in 3b: the null rule `stcFromRoles.ts:28` (or its replacement),
  `ENGINE_ROLE_KEYS` (`simRoleStatus.ts:58`), the two parity tests `step.test.ts:322` and
  `simRoleStatus.test.ts:33`, `:48`, the panel message. 3a does not touch them: `NetStc.terminal` is
  optional from birth.

### 6.3 (c) Termination against deadlock, and `runStatus`

**Recommendation: distinguish them, on the candidate set, five statuses.**

| Status | Definition |
|---|---|
| `Not started` | no run for the model in the store (not "empty marking": a net can consume every token) |
| `Halted` | sticky after an unsafe firing, a domain violation, a double assignment or an action defect; reason shown; cleared by Reset |
| `Terminated` | `terminated(M)` (6.1) |
| `Running` | some input in {ε} ∪ alphabet has a candidate, guards and inhibitors evaluated |
| `Deadlock` | none of the above: no input can fire anything |

- Why on candidates and not structural: spec §9.3 says "deadlock = no candidate and not terminal", and
  R-SIM-6 asked the panel to fix the deadlock behaviour before code. A run blocked only by false guards
  is `Deadlock`, even while R-SIM-16 keeps some button enabled (question 12); the panel may disable
  every button on `Deadlock` (3b).
- Alternatives: one status `Stopped` for both (loses what R-SIM-6 asked for); `Deadlock` structural,
  guards ignored (consistent with the buttons, but calls a guard-blocked run `Running`); `Unsafe` as its
  own status instead of `Halted` plus reason (one value per halt reason; R-SIM-23 names only «unsafe»,
  the domain check of spec §3.2 is the same class of stop).
- Cost: `SimRunStatus` (`types.ts:91`) and its twin `SimulationPanel.tsx:221`; the chip dot
  (`:379-381`) and the status line (`:481-484`); a `--halted` dot in `simulation-panel.scss:365-373`;
  the store keeps an entry with an empty marking (`simRunState.ts:36` deletes it today). Measured: the
  status rule alone changes `step.test.ts:208` and `events.test.ts:322` in both modes (§7).

### 6.4 (d) The read-only marking accessor for inhibitor guards

**Recommendation.** Core: `SimStateAccess` = `SimStateReader` (`guardContext.ts:66-73`, whose
`isMarked(elementId): boolean` already is the derived view) plus `tokens(elementId): number`. Surface:
`x.[marked]` and `x.[tokens]`, two reserved attribute names in the `.[x]` namespace of R-SIM-18, read
through any path from the four roots (`self.inhibitor.[tokens] < 2`, `not event.[marked]`), no new
root, never assignable. Until the `.[x]` operator lands, inhibitor arcs compile from `simInhibitorArc`
into the core guard conjunct `tokens(p) < w`, which is what R-SIM-24 describes: the core sees a guard,
not an arc type.

**The step 2 subset checker.** Today it never sees the form: `.[` is a parse error (step 2 report,
`[4f]`), so the guard is a `parse-error` defect before the checker runs (`guardEvaluator.ts:64-71`).
When the operator adds an AST node, the walk's exhaustive switch (`subsetChecker.ts:370-373`,
`const never: never = e;`) forces a case. Proposed rules there: `.[marked]` and `.[tokens]` accepted
and **exportable** (a `DEFINE` over `m_p`, a `VAR` of the declared domain 0..k); `node.[…]` already an
error through `E-NODE` (`:270`); an assignment to either is an error of the action checker, not of the
guard checker.

| Alternative | Why not |
|---|---|
| `marked(x)` / `tokens(x)` as functions | `E-CALL` today (`subsetChecker.ts:309-312`); path B has no builtins; adding one changes `jjel/evaluator/*` (out of scope) and puts a new name in call position |
| `x.marked` as navigation | breaks R-SIM-18: `e.f` is always navigation on M, and a feature named `marked` would collide |
| `model.marking[id]`, a data map on the `model` root | string ids in guards; collides with the root element's features once `model` is its handle (R-SIM-18); not a finite formula without constant folding |

Cost: the `.[x]` lane (lexer, parser, AST node, evaluator hook, checker case): not step 3. Two
attribute names reserved in the STC.

---

## 7. The committed tests against the new semantics **[M]**

Measured, not assumed. A scratchpad bench copies `types.ts`, `stcFromRoles.ts`, `isKindOf.ts`,
`objectSlots.ts`, `irReadCtx.ts` (import-free) and the two test files **unchanged**, and replaces
`step.ts` with a shim that implements its API over the prototype core. The shim signals and never
absorbs: more than one candidate throws `NONDET[…]` (the old API has no selector), an unsafe firing
throws `UNSAFE[…]`, `applyStepLabel` throws `REMOVED`. **Positive control**: the same bench with the
committed `step.ts` passes 70 of 70. Result: **50 passed, 20 failed** with (a1), **57 passed, 13
failed** with (a2).

| Test | (a1) | (a2) | What changes, and by which ratification |
|---|---|---|---|
| `step.test.ts:89` fire-all fork | NONDET[t1,t2] | same | interleaving, one of B, C (R-SIM-7) |
| `step.test.ts:99` join collapses into one mark | NONDET[t2,t1] | same | one at a time; the second arrival on C is **unsafe** at k = 1 (R-SIM-23) |
| `step.test.ts:109` dangling transition consumes | A stays | same | a target-less edge is a compile defect (question 6) |
| `step.test.ts:119` any terminal freezes | A fires | passes | termination predicate (6.1) |
| `step.test.ts:149` re-entry keeps both marked | NONDET[tBA,tAB] | same | interleaving, and both candidates are unsafe at k = 1 |
| `step.test.ts:167` deleted marked id kept | dropped | same | the net is compiled per run; a model edit interrupts it (R-SIM-13, 3b) |
| `step.test.ts:200` Terminated when any terminal | Running | passes | 6.1 |
| `step.test.ts:204` Terminated wins over Deadlock | Deadlock | passes | 6.1, 6.3 |
| `step.test.ts:208` Deadlock on one stuck token | Running | Running | 6.3 |
| `step.test.ts:215` `applyStepLabel` | REMOVED | same | no activation-wins: arithmetic effect (R-SIM-21) |
| `step.test.ts:255` subclass of terminal (SubF, A) | UNSAFE[t2: SubF=2] | passes | 6.1; with (a1) A's move into SubF is a second token on SubF |
| `events.test.ts:90` ε fires everything without the role | NONDET[t1,t2] | same | interleaving; t3 is dangling, a defect |
| `events.test.ts:111` Step button, slice 0 rule | ε disabled on Stuck | same | buttons structural on the net (question 12) |
| `events.test.ts:133` half event role | NONDET[tCoin,tPushL] | same | interleaving (no role: both untriggered) |
| `events.test.ts:223` provisional split of the token | NONDET | same | reversed as announced (R-SIM-7) |
| `events.test.ts:234` provisional one event moves all | NONDET | same | reversed as announced |
| `events.test.ts:263` event on a frozen run | fires | passes | 6.1 |
| `events.test.ts:296` buttons disabled on Terminated | enabled | passes | 6.1 |
| `events.test.ts:301` ε with the role, `F`+`Unlocked` | enabled | passes | 6.1 |
| `events.test.ts:322` waiting vs Deadlock control | Running | Running | 6.3 |

Not measured by the bench, deduced from the code **[D]**: `step.test.ts:322` and
`simRoleStatus.test.ts:33`, `:48` change with (b), because they pin Terminal as an engine key (§4.2).

**Parity of the derived `isMarked`.** The 50 tests that pass include every deterministic trace of the
two files: the linear chain (`step.test.ts:75`), the self-loop (`:142`, which passes: consume then
produce leaves A at 1), the turnstile trace (`events.test.ts:275`), the discards, the identity match of
triggers, the stuck-on-event node (`events.test.ts:207`). On each, the set of places with a token after
each step equals today's `Set`. That is the oracle 3a's `netParity.test.ts` turns into a committed test.

---

## 8. The carried items of `P-2026-09-24-1520`

### 8.1 `targetMetamodelId` for every caller of `buildEvalContext`

**Callers today** (`command grep -rn buildEvalContext src scripts` from `frontend/`, exit 0, 39 lines,
comments and tests included; positive control: the definition `eval.ts:122`): `eval.ts:32` (`executeEval`, the console, context from the executor),
`let.ts:125`, `forall.ts:32` (same context), `jodieJjelContext.ts:39` (`makeMinimalContext`, `:28-33`,
no id), `validationContext.ts:159` (`minimalExecutionContext`, `:108-115`, no id). **The simulator has
none**: the only hits under `model/simulation/` are comments and tests. The 3b bridge is the first.

**The mechanism** **[R]**: `getTargetMetamodel` uses the id when given (`utils.ts:299`), else
`getActiveMetamodel()` (`:309`), else `metamodels[0]` (`:316-317`, "Fall back to first metamodel").
From an M1 tab the active metamodel is `null` by design: `activeArtifact.ts:67`,
`if (cachedIsMetamodel !== expectMetamodel) return null;`. So from the model tab, where a run or a
validation starts, the pool is built from the **first metamodel of the project**, and `extentModelId`
then restricts that metamodel's instances to a model that is not among them.

**Measured on the real editor** (probe, 3 runs): with one metamodel the fallback is right by
coincidence (pool 14 both ways). After `createM2` and `createM1` add a second metamodel and a model of
it with one object, from that model's tab: `getActiveMetamodel()` = `null`, `getTargetMetamodel` = the
first metamodel, `buildEvalContext` without the id **pool 0**, with `targetMetamodelId` **pool 1, the
object present** (the control).

**In validation (reported, not fixed)**: every instance without a handle is skipped
(`validationContext.ts:181-185`, "Un'istanza senza handle non si valuta a occhio: si salta"), so a
model of any metamodel but the first is validated against nothing and reports no violation.
Jodie's `makeMinimalContext` has the same shape; there the "active metamodel" reading may be intended.

**For the simulator (3b)**: `buildEvalContext({ projectId, history: [], variables: new Map(),
targetMetamodelId: <the M1's instanceof> }, { extentModelId: modelId })`, once per run at Reset.

### 8.2 A runtime check of the guard context on real L proxies

Done in this phase on `http://localhost:3002`, a dev server of this worktree started from a scratchpad
config and stopped at the end. The turnstile of the step 1 harness was built on the `RowViewSmoke`
project, then `buildEvalContext` (with the id), `freezeSnapshot`, `buildGuardContext` and
`evaluateGuard` were imported from `/src/…` and run in the page. Control of the import path: the
dynamically imported `joiner` exports the same `LPointerTargetable` as the page's (`true`).

| Check | Result |
|---|---|
| Objects reachable from the record, `data`/`node` excluded | 314, **0** L proxies |
| Objects shared with the store (idlookup entries and their direct fields, 1297) | **0**; control: the M1's D-object is in the store set |
| Frozen store objects before/after `freezeSnapshot` | 0 / 0; the counter's control (a frozen probe object is counted) passes |
| `freezeSnapshot` | ok; the pool is frozen; 14 handles |
| `self.trigger == event` on tCoin, event coin / push | `true` / `false`; `trigger` is the pool handle of coin itself |
| `self.next.name == "Unlocked"` on tCoin / tPushU | `true` / `false` |
| `event.label == "Coin"`, `self.next.out.size == 2`, `event == null` (ε) | `true`, `true`, `true` |
| `self.nope == 1` | defect `absent-identifier` |
| A model write after the freeze | lands (`name` read back from `idlookup`) |
| With a selected element (run 3) | `data` and `node` present, **1 live L proxy each**; the record without them still 0; `freezeSnapshot` ok |

So step 2's risk R1 is real and its guard works: a selection puts live proxies in the record, and the
strip of `data`/`node` is what keeps them out of the freeze. R8 of that report ("the snapshot shape is
read, not measured") is closed for this model. Not measured: a cross-metamodel reference (the "wrapped
on demand" branch of `eval.ts:200-201`, `:603-605`).

---

## 9. Dependencies and risks

| # | Risk or dependency | Evidence | Severity |
|---|---|---|---|
| R1 | Merges of concurrent tokens into one state become **unsafe** at k = 1, where today they collapse silently | `step.test.ts:99`, `:149` on the prototype | medium: visible behaviour change for models with two initial instances |
| R2 | Per-run compile makes a mid-run model edit invisible until Reset, where today the next step reads it (step 1 log) | step 1 log "A trigger edited mid-run is read at the next step" | medium, closed by the R-SIM-13 interruption in 3b; `buildValidationSignature` (`validationFreshness.ts:98`) is the pattern |
| R3 | Guards and actions written in `.[x]` need the operator and the Expression/Action types | step 2 `[4f]`; R-SIM-17 "corsia dedicata" | high for authoring; 3a and 3b run on TS oracles and M-only JjEL guards |
| R4 | Two step functions in the tree between 3a and 3b | question 10 | low, declared, one wired |
| R5 | The `Deadlock` status and the structural buttons can disagree (guard-blocked run) | 6.3 | low, UI rule in 3b |
| R6 | Rule 11: `SimConfiguration`, `StcRoles.terminal`, `SimRunStatus` change in 3b | §5.5 | needs authorization in 3b's GO |
| R7 | The validation defect of §8.1 hides violations on non-first metamodels today | measured pool 0 | medium, outside this lane: a ticket |
| R8 | The role vocabulary grows by ten keys | §5.3 | medium: authoring load on the M2 face; the Petri keys are cuttable (question 9) |
| R9 | Spec §3.3/§3.4 and R-SIM-9 no longer describe the kinds exactly | §5.3 | low, a docs amendment |
| D1 | 3b depends on 3a; 3c on 3b (the candidate set must exist per model before the canvas reads it) | §10 | |

---

## 10. Question 4 — the waves, and the Phase 2 proposal for 3a

### 10.1 The waves

- **3a, the pure core** (this proposal). New files only, under `model/simulation/`; nothing wired;
  gates: typecheck 14, vitest 4530 + the new tests with the same 9 red at import, build, `check:docs`.
  No UI, no smoke.
- **3b, the panel and the run-state on the new core.** `sim/simRunState.ts` (a `NetConfiguration`,
  the net and a halt per model; `isSimActive` as `tokens > 0`; a commit in place of `simApplyStep`);
  `sim/SimulationPanel.tsx` (the bridge: `buildEvalContext` with `targetMetamodelId`, `freezeSnapshot`
  and `compileNet` at Reset, guard oracle from `guardEvaluator`, a candidate list when a step has more
  than one, five statuses and the halt message, the R-SIM-13 interruption); `sim/simRoleStatus.ts` and
  its test (new role specs, `ENGINE_ROLE_KEYS` per (b) and shape); `sim/simulation-panel.scss`
  (`--halted` dot, candidate list); `model/simulation/step.ts`, `types.ts`, `stcFromRoles.ts` (old step
  deleted, overlap sorts extended); `__tests__/step.test.ts`, `events.test.ts` (the 20 tests of §7
  rewritten as decisions or deleted). About 10 files, a smoke and a visual check. The source of
  `ReadCtx.isMarked` changes meaning (§11): Layer Impact Report in that lane.
- **3c, candidates on the canvas**, a second channel beside `'mark'`: critical zone
  (`editor-v2/viewpoint/ir/`, `ObjectNode.tsx`, the edge components, since control-flow candidates are
  edges). Its own discovery and LIR; the `origin` of `NetTransition` is what it will highlight.
- **Outside step 3**: the `.[x]` operator lane, which brings `x.[marked]`/`x.[tokens]`, JjEL actions
  and the authoring of attribute declarations (R-SIM-17..19).

Name check for 3a (`command grep -rnw <name> src scripts` from `frontend/`, 0 lines each; control
`stepFlowchartBoolean` 47 lines, `guardEvaluator` 5): `SimState`, `NetTransition`, `CompiledNet`,
`compileNet`, `NetConfiguration`, `NetLabel`, `StepOutcome`, `CandidateSet`, `GuardOracle`,
`ActionOracle`, `SimStateAccess`, `StateAttributeDecl`, `NetStc`, `netStcFromRoles`, `NetModelView`,
`NetRunStatus`, `SimAssignment`, `structuralInputs`, `netStep`, `netTypes`, `netCompile`, `netParity`,
`Halted`, and the keys `simBound`, `simFork`, `simJoin`, `simArc`, `simArcWeight`, `simInhibitorArc`,
`simInitialMarking`, `simGuard`, `simElse`, `simWeight`.

### 10.2 The 3a proposal, in prose

Six new files, no modified file:

1. `frontend/src/model/simulation/netTypes.ts` — the declarations of §5.1 and §5.2, `NetStc`, and
   `NetModelView extends SimModelView` with two readers by pointer, `references(objectId, featureId)`
   and `values(objectId, featureId)` (the 3b adapter implements them with `objectSlots.ts`).
2. `frontend/src/model/simulation/netCompile.ts` — `netStcFromRoles` (the keys of §5.3; control-flow
   needs an initial rule, a source rule and `simNextState`; Petri needs node, transition, arc, its two
   references and the initial marking), `compileNet` (the table of §5.3, defects, `else` siblings,
   fork/join fusion, weights, inhibitors, initial state and attribute initials).
3. `frontend/src/model/simulation/netStep.ts` — `stateAccess`, `tokens`, `isMarked`, `terminated`,
   `candidates`, `admissible`, `step`, `netRunStatus`, `structuralInputs`.
4. `frontend/src/model/simulation/__tests__/netCompile.test.ts`
5. `frontend/src/model/simulation/__tests__/netStep.test.ts` (guards through the real `compileGuard` /
   `evaluateGuard` over a synthetic snapshot, as step 2's tests do, and TS oracles for state)
6. `frontend/src/model/simulation/__tests__/netParity.test.ts` — today's `stepFlowchartBoolean` and the
   new `step` on the committed fixtures: equal derived `isMarked` on every deterministic trace, and the
   20 differences of §7 each pinned by name as a decision.

Not touched: `step.ts`, `types.ts`, `stcFromRoles.ts`, their tests (byte-identical, the old oracle
stays green), `sim/*`, `jjel/*`, `ObjectNode.tsx`, the IR. No critical-zone file, so no LIR for 3a.
Six files, above the five of rule 19: listed here for the GO.

### 10.3 Test plan, one mutation per rule

Every test executes the public functions (P11); every "nothing happens" has its control (P12). The
mutation bench is run on the committed sources and reported in the commit body.

| Rule | Test | Mutation that must turn it red |
|---|---|---|
| Enabling with weights | preset {p:2}: M(p) = 1 not a candidate, 2 a candidate | `M(p) > 0` in place of `≥ w`; `>` in place of `≥` |
| AND-join | preset {a, b}: only a marked, no candidate; both, candidate; firing empties both | `some` in place of `every` over the preset |
| Parallel fork | postset {a, b}: one firing marks both | postset truncated to its first arc |
| Progress | `admissible(cs, null)` false with candidates, true without; a non-candidate selector inadmissible | `null` always admissible; membership unchecked |
| «unsafe» | M'(p) = k fires; k + 1 halts with the marking unchanged; the self-loop at k = 1 fires | `>=` in the check; check on M + post before consuming; saturation `min(k, …)` |
| Candidate flag | an unsafe candidate is listed with `unsafe`, not dropped | filtering unsafe candidates out |
| Parallel assignment reading σ | Ex2: `last := coins` beside `coins := coins + 1` gives last 0; a swap `x := y`, `y := x` swaps | writes applied site by site (the second read sees the first) |
| Double assignment | two writes to one target halt | last write wins |
| Domain | a write outside the declared range halts | no check |
| `else` as the complement | Ex1: sibling true → else false; all false → true; sibling defect → else defect | `else` always true; a defective sibling read as false |
| Inhibitor | Ex3 M₁: tb `inhibited(a1)`; after ta, tb a candidate | inhibitors ignored; `>` in place of `≥ w` |
| Guard defect | a throwing guard: not a candidate, recorded in `evaluated` | defect read as true |
| Label | `evaluated` holds every guard, the chosen one and the others | only the chosen one recorded |
| Trigger | ε accepts the untriggered only; an event by identity; without the role every event is a discard | triggered transitions accepted on ε |
| Termination (a1) | F + another token: not terminated; only F tokens: terminated, no candidates | "some" in place of "all" |
| Status (c) | Deadlock iff no candidate for ε and every event; waiting on an event is Running; Halted wins | today's "any stuck token" rule; ε only |
| Fork/join fusion | Ex3 flowchart form: F and J not places, pre/post as in §5.4, origins recorded | fork out-edges compiled as separate transitions; J kept as a place |
| Compile defects | a target-less edge is in `defects`, not in `transitions` | compiled as a sink |
| Initial | ancestry for `simInitial`; `simInitialMarking` = 3 with k = 2 is `initial-over-bound` | exact class match; no bound check |
| Derived `isMarked` | parity file: equal to today's `Set` on the deterministic fixtures; `tokens = 2` still marked | `isMarked` as `tokens === 1` |
| Quiescence | ε with no candidate returns the input configuration itself; a discard consumes the event | a fresh object; `next.event` left set |

---

## 11. Layer Impact Report draft (for 3b, not due for 3a)

```
LAYER IMPACT REPORT — draft, wave 3b

Layers touched:
  [ ] D-layer (Redux raw data)          the run never writes to the model (R-SIM-6)
  [x] L-layer (computed proxies)        read only: buildEvalContext at Reset; the panel's proxy readers go
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   indirectly: the source of isSimActive / ReadCtx.isMarked
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

For each touched layer:
  - What changes: isSimActive(id) answers tokens > 0 on a Map instead of Set.has; one entry per started run.
  - What does NOT change: the signature and totality of isSimActive and ReadCtx.isMarked (R-MK-4, R-MK-7);
    useSimVersion and the 'mark' channel; ObjectNode.tsx and viewpoint/ir/ have no diff.
  - Cross-layer interaction: one bump per committed step, as today (R-MK-6).
  - Side-effect safety: fork/join nodes are never marked; a Halted run keeps its last marking visible.

Smoke-test scenarios potentially affected:
  - turnstile of step 1: identical trace, highlight on the same node at each step
  - a view with a `marked` conditional re-renders on each step, as today
  - Reset / Stop / model change clear the highlight
```

---

## 12. The probe and the bench (scratchpad, not committed)

- **Probe** `probe_sim3_guardctx.mts`, run with `npx tsx` against a vite dev server of this worktree on
  3002 (config in the scratchpad, own `cacheDir`, `fs.allow` on this tree, the main tree's
  `node_modules` and the scratchpad). The vite dependency scan failed on a pre-existing import
  (`MTM.tsx:27`, `Nearley`) and continued without pre-bundling: environmental. Three runs: the first
  stopped at the second-metamodel step (`createM2` returns `void`), fixed by finding the models by name;
  runs 2 and 3 **ALL GREEN, 0 page errors**; run 3 with a selection. Server stopped after each use.
- **Bench** `bench/`: copies named in §7, the prototype `net.ts` (≈260 lines), the shim `step.ts`,
  `worked.test.ts`; `node_modules` symlinked. Control 70/70 on the committed `step.ts`; shim 50/70 (a1),
  57/70 (a2); worked examples 4/4.

---

## 13. Baseline gates at `2a0883ac2`, from `frontend/` **[M]**

| Gate | Result |
|---|---|
| `npm run typecheck` | exit 2, **14** errors, the §17 set by file and code: `api/data.ts` TS2304 ×2, TS2322; `common/Dummy.ts` TS2307; `EditorV2.tsx` TS2339; `Measurable.tsx` TS2552, TS7053 ×4, TS2345; `Jodie/ChatMessages.tsx` TS2322; `project/ProjectEditor.tsx` TS2769; `pages/components/Dashboard.tsx` TS2339 |
| `npx vitest run` | exit 1: **4530 passed**, 0 failed; 182 files passed, **9 red at import** (`window is not defined`): `jjscript/__tests__/context-binding`, the seven `jjtl/__tests__/*` of §17, `utils/__tests__/UDComparator` |
| `npm run build` | exit 0, the chunk-size warning only |
| `npm run check:docs` | exit 0, 4/4 (log at 40 entries, threshold 40) |
| `npm run check:scripts` | exit 1, **1** finding: `frontend/scripts/smoke/_tmp_sim1_verify.ts:186:5` (`failures += await e2e.run(...)`), the expected one; 48 files, 13 `_tmp_*` |

The `frontend/node_modules` symlink to `~/jjodel/frontend/node_modules` was already in this tree (dated
2026-09-14, gitignored); the gates ran through it and it was left in place, since this lane did not
create it. `frontend/dist` is rewritten by the build and gitignored.

---

## 14. State of the tree

No source file modified. `frontend/scripts/smoke/_tmp_sim1_verify.ts` untouched. Written by this phase:
this report only, committed alone with pathspec. `git status --short` empty before this commit.
