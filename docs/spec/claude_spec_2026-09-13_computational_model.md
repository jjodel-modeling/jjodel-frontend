# Spec — The computational model of the simulation engine

**Type**: design spec, normative for the simulation lane. **Status**: ratified 2026-09-14
(R-SIM-7..R-SIM-15 in `docs/decisions.md`), on the evidence of
`docs/discovery/discovery_2026-09-13_simulation_engine_state.md` and
`docs/discovery/discovery_2026-09-13_jjel_eval_context.md`.
**Amended**: 2026-09-25 by R-SIM-21..33 (Petri core, termination, five run statuses);
see sections 3.3 and 3.4.

**Supersedes**: nothing; the current engine in `frontend/src/components/editor-v2/sim/` is the
implementation this spec reshapes.
**Vocabulary**: nuXmv's, on purpose (§8). Verification is the last step of the plan; the
vocabulary is adopted from the first.

## 1. Purpose and scope

Jjodel languages get executable behaviour through a **semantic type class** (STC): a minimal
set of properties a metamodel must supply (roles), bound to the metamodel by a **fitting
morphism**. On top of the STC the engine runs a simulation. This spec fixes what a
simulation *is*: the state space, the step, the inputs, the labels, and what is deliberately
left out. It does not fix UI, panel layout or file formats, except where the semantics
constrains them.

Three languages are the validation set: flowcharts, state machines, Petri nets. The spec is
written so that the three are restrictions of one semantics, not three engines.

## 2. Configuration

A configuration is a triple **(M, σ, e)**.

- **M**, the model: fixed for the whole execution. No step creates, deletes or edits model
  elements or their features. This is what makes the state space finite; it is a deliberate
  choice, to be presented as such.
- **σ**, the state: owned by the engine, shaped by the STC (§3.2). Its main component is the
  **marking**, a total map from the elements selected by a role to values of a declared finite
  domain. Further components (counters, flags, "extended state") are declared the same way.
- **e**, the current event: a value of the event enumeration, or *absent*.

The execution starts from the **initial configuration**: σ set by the STC's initial rule
(flowchart and state machine: the initial node marked; Petri net: the declared initial
marking), e absent.

## 3. Semantic type class

An STC declares three things, and has a **kind**: *boolean marking* (flowcharts, state
machines) or *bounded-natural marking* (Petri nets). The kind fixes the marking domain, the
initial rule (§3.4) and the laws. The fitting morphism maps a metamodel onto the roles; it is
external to the metamodel, never a stereotype inside it. In code the fitting is the set of flat
`sim*` keys in the M2 model's `_state` bag (R-SIM-2); new roles are new flat keys, never nested
objects.

### 3.1 Roles (structure)

Node metaclass; edge metaclass with its **source** and **target** references, both allowing
multiplicity (R-SIM-10; containment is an admissible derived source: when `simSource` is unset
the source is the owner of `simOwnedTransitions`). Initial and final (§3.4). For event-driven
languages: event metaclass, trigger reference on the edge, identifier feature of the event
(R-SIM-12: events are the M1 instances of the event metaclass). For actions (§5.3): the
features or containers holding the condition (guard) and the assignments, on edges and, where
the language has them, on nodes (entry, exit, action node). Metaclass roles are matched with
the IR's notion of "is a", `isKindOf` with ancestry (R-SIM-8).

### 3.2 State components

Each component has a **name**, a **domain** and an **indexing**. Domains are finite: boolean,
bounded integer `0..n`, enumeration. Indexing is either *per element of role R* (the component
is a map from R's elements) or *global* (one value). The marking is a per-node component;
flowcharts and state machines declare it boolean, Petri nets bounded integer.

The domain is checked at the boundary of every effect: a value outside the domain is a defect
of the module, reported as such, never a state that propagates.

### 3.3 Laws

Predicates on configurations that must hold in every reachable configuration. They are what
distinguishes one language from another on the same machinery: token conservation (exactly one
node marked) for flowcharts; exclusivity among sibling states for state machines; no
additional law for Petri nets. In verification they are checked first, as invariants: a
violated law means the language is ill-defined, before any model property is asked.

Amended 2026-09-25 (R-SIM-22, R-SIM-33): token conservation holds for flowcharts only while
no fork role is set; with `simFork`/`simJoin` a flowchart marks several places at once and the law
neither holds nor is checked. Laws stay out of step 3.

### 3.4 Initial rule and final rule, by kind

Amended 2026-09-25 (R-SIM-23, R-SIM-27, R-SIM-28). The two kinds reduce to the bound k and
the initial rule. Boolean kind: k = 1 and the initial role is a metaclass (one token on each of its
instances). Bounded-natural kind: the initial marking is the integer feature `simInitialMarking` on
the node; an initial marking above k is a compile defect. In both kinds the final role
`simTerminal` is optional. When set, its instances among the places form F, and a configuration is
terminated when its marking is non-empty and every marked place is in F; a terminated
configuration has no candidates. When unset, no configuration terminates.

## 4. Step

A step is a labelled transition **(M, σ, e) → (M, σ', e')**. It has two **inputs**, provided
by the environment, and one **effect**, computed by the engine.

### 4.1 Inputs

- The **event** e (§2), possibly absent.
- The **selector**: an edge of M, or *none*.

The environment is the user in step-by-step mode, the run policy (§6) in run mode, the model
checker in verification.

### 4.2 Enabling and candidates

An edge t is a **candidate** in configuration (M, σ, e) when all of the following hold:
its trigger accepts e (or t has no trigger and e is absent); the STC's **enabling condition**
holds on σ (flowchart: the source is marked; state machine: the source is active; Petri net:
every input place has enough tokens); its **guard**, a JjEL predicate evaluated read-only on
the whole configuration, is true.

The set of candidates is a first-class value: the panel shows it, the trace records it, the
policy chooses from it, the model checker quantifies over it.

### 4.3 Admissibility and progress

The selector is admissible only if it names a candidate. The selector *none* is admissible
**only if the candidate set is empty** (progress constraint). Consequences: in run mode, if
anything is enabled, something fires; the transition relation is total (there is always an
admissible step); liveness properties are not trivially false.

Two steps have selector *none*: the **discard** of an unaccepted event (e present, no
candidate accepts it) and **quiescence** (e absent, nothing enabled). Both leave σ unchanged
and are recorded in the trace as steps, so a scenario can assert them.

### 4.4 Effect

When the selector names t, σ' is computed **atomically** from σ:

1. the STC's structural effect (flowchart: move the token; state machine: deactivate the
   source, activate the target; Petri net: consume from input places, produce to output
   places);
2. the actions (§5.3), in the order the STC declares (state machines: exit of the source,
   action of t, entry of the target).

All assignments in a step are **parallel**: every right-hand side is evaluated on σ (the
previous state), all writes land together. No intermediate configuration exists. e' is absent
after any firing (the event is consumed).

### 4.5 Label

The label of a step is the pair of inputs (e, selector) plus the outcome of every guard
evaluated on the candidates, including the ones not chosen. The label is what makes step-back
explainable, not just reversible, and what a scenario asserts.

## 5. Guards and actions

### 5.1 Evaluation context

Three roots: `self` (structural, the element the expression is attached to), the **state**,
the current **event**. The model is exposed **read-only**; writes are admitted on state
components only, and the boundary enforces it (context, not author discipline). Nothing in a
guard or action reaches outside the configuration: no I/O, no calls with side effects.

### 5.2 Guards

JjEL predicates, evaluated as in the validation lane: the result must be boolean; a non-boolean
result or an evaluation error is a **defect of the guard**, reported, and the edge is not a
candidate. Guards read the configuration; they never write.

### 5.3 Actions

An action is a list of pairs **(state component, JjEL expression)**, declarative. Semantics:
each component is assigned the value of its expression evaluated on σ; all pairs in the same
step are applied simultaneously (§4.4). Two components assigned twice in one step is a defect,
reported at authoring time. No sequential language, no statements; sugar may come later on
top of this, never instead of it.

### 5.4 Translatable subset

Guards and action expressions must lie in the subset of JjEL that expands to finite formulas
over a frozen model: boolean and arithmetic on bounded integers, enumeration comparison,
navigation on M (resolved to constants at translation), quantifiers over model collections
(expanded to finite conjunctions/disjunctions). Out: strings and dates in state components,
variable-size collections in state, calls with effects. The checker for this subset runs in
the simulator too, with diagnostics: a model that cannot be verified is discovered while
writing it. The census of constructs is a deliverable of the JjEL discovery.

## 6. Non-determinism and run policy

More than one candidate is normal. In **step-by-step** mode the user picks (candidates are
highlighted). In **run** mode a declared **policy** picks: explicit priority where declared;
otherwise random with a **seed recorded in the trace**. A scenario stores the sequence of
events supplied and selectors chosen, hence it is replayable by construction, independent of
the policy. The model checker ignores the policy.

## 7. Events and run-to-completion

Events are values of an enumeration built from the event metaclass and its identifier feature;
*absent* is a value. The trigger of an edge accepts an event by identifier. An event not
accepted by any candidate is discarded (§4.3); there is no deferral and no queue.

State machines have run-to-completion: after an event fires, untriggered edges (completion
transitions) fire until the configuration is **stable**, defined as "no untriggered edge is a
candidate". In the transition system these are ordinary steps with e absent. A **macro-step**
(event plus completion steps) is a notion of the presentation, shown in step-by-step mode with
its micro-steps inspectable; the engine has one notion of step. An event is admitted as input
only in a stable configuration. Flowcharts and Petri nets have no events; all their steps have
e absent.

## 8. Correspondence with nuXmv

| This spec | nuXmv | Note |
|---|---|---|
| M (model) | `FROZENVAR` / constants | elements and edges become enumerations and constants |
| state components | `VAR` with declared domain | domain from §3.2, never inferred |
| current event | `IVAR` (event enum + absent) | free for the checker, supplied by the user in simulation |
| selector | `IVAR` (edge enum + none) | choice is an input of the step, not part of it |
| enabling, guards, stable | `DEFINE` | stateless predicates |
| admissibility, progress, event only when stable | `TRANS` | constraints on the IVARs |
| structural effect, actions | `ASSIGN next(x) := …` | parallel, read on current state |
| initial configuration | `ASSIGN init(x) := …` / `INIT` | |
| laws | `INVARSPEC`, checked first | |
| model properties | `LTLSPEC`, `CTLSPEC`, `INVARSPEC` | guard observable ones with `stable` |
| trace / scenario | counterexample (states + inputs) | same information; replayable without conversion |

Composition of several modules on one STC (the second paper) maps to one selector whose domain
is the union of the modules' edges, with declared priorities as `TRANS` constraints; nuXmv's
synchronous composition is not used for it.

The **exporter** (a pure function from model + STC to an `.smv` text, no execution) is due
between steps 4 and 5 of the plan. **Execution** (a service running nuXmv or NuSMV) is step 6
and is not on the critical path; the binary is not redistributable with the frontend.

## 9. Mapping onto the incremental plan

Six steps, ratified 2026-09-13; file-level mapping from the two discovery reports (their §7 and
§9 hold the line-level detail). Layout (R-SIM-14): the pure core in
`frontend/src/model/simulation/` (context builder, guard/action evaluator, subset checker, step
function, exporter; no React), the panel and the run-state store in
`frontend/src/components/editor-v2/sim/`. The run-state is keyed by `modelId` (R-SIM-13). The
today's engine is three files (`SimulationPanel.tsx`, `simRunState.ts`, `simulation-panel.scss`),
byte-identical between `alfonso-frontend-jjtl` and `validation-skeleton`; consumers of the
boolean marking are `ObjectNode.tsx` (`sim-active`) and the IR (`{ op: 'marked' }`,
`ReadCtx.isMarked`, channel `'mark'`), the latter critical zone.

1. **Events**: roles of §3.1 for events as optional flat keys (`rolesComplete` must not
   require them); e as input; candidate (t, e), which already forces a candidate notion; discard
   as a step; the panel's events section listing the M1 event instances. Files: `sim/*`;
   `collectMetaOptions` must offer attributes for the identifier feature.
2. **Evaluation context**: new `model/simulation/` builder over the `buildEvalContext`
   snapshot without `data`/`node`, deep-frozen once per run, roots `self`, `state`, `event`;
   evaluator path B; tri-state shared with validation (R-SIM-15); subset checker walking
   `JjelExpression` with receiver types. No change to `jjel/evaluator/*`.
3. **Condition/assignment roles, unified cycle**: σ as `component → element id → value` plus
   globals, replacing the `Set`; `isSimActive`/`isMarked` kept as the derived boolean view
   (R-SIM-11); `simApplyStep` and its "activation wins" rule replaced by the arithmetic effect;
   guards as predicates; actions as parallel assignments; selector as input; progress
   constraint; cycle *candidates → choice → effect → label*; the four `runStatus` values
   redefined on the candidate set (deadlock = no candidate and not terminal). Fork, join and
   multiple tokens come from the marking domain moving from boolean to bounded integer. Laws
   checked at the boundary. Candidate highlighting on canvas as a second channel beside
   `'mark'`: critical zone, Layer Impact Report.
4. **Snapshots**: step-back as a list of full configurations (σ, e, label), per model, outside
   Redux (R-SIM-1); `simReset` is the restore primitive to generalise.
   *Between 4 and 5*: Petri nets as third language; the `.smv` exporter.
5. **Trace and scenarios**: label of §4.5; run policy of §6 with seeded RNG; scenarios as JSON
   documents exported and imported as files, same shape as counterexamples; project persistence
   decided after the format (deferred, see decisions).
6. **Verification**: the execution service; laws first; properties with `stable`;
   counterexamples replayed as scenarios.

## 10. Excluded by construction

Stated as limits of the first paper, not discovered in review:

- **Time**: no clocks, no durations, no timed automata; a logical counter in the state is
  discrete time, not real time. **Do-activities** of state machines fall here.
- **Dynamic structure**: no creation or deletion of elements during execution; languages whose
  semantics is graph rewriting are out. Price of finiteness.
- **True concurrency**: no step semantics (several firings per step), no partial-order
  processes; interleaving only. If ever wanted, the change is confined to the choice: one
  candidate becomes a set of mutually independent candidates; enabling and effect stay.
- **Deferral and queues** of events.

## 11. Open points

- Whether the macro-step of §7 needs any engine-level marker beyond `stable` for the panel
  (presentation decision, after step 1).
- Whether per-element extended components are needed by the three validation languages or
  only the marking is per element (default: marking only, until a language asks).
- Guard authoring: `and`/`or` are eager in the evaluator, so `x != null and x.p` throws and the
  guard is reported defective; authors write `x?.p` or `x != null implies x.p` until the
  evaluator is fixed in its own lane.
- Names: event identifiers and state component names avoid the 18 JjEL keywords; nuXmv reserved
  words are not a user constraint because the exporter renames.

Closed on the discoveries: the read-only boundary is the context builder (the evaluator never
writes; the only write path is a caller-bound function, which the simulation builder never
binds); model edits during a run interrupt it with a declaration (R-SIM-13).
