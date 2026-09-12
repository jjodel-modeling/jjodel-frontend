# Spec — The computational model of the simulation engine

**Type**: design spec, normative for the simulation lane. **Status**: draft, ratified in the
project chat on 2026-09-12/13, pending the two discovery reports
(`docs/discovery/discovery_2026-09-13_simulation_engine_state.md`,
`docs/discovery/discovery_2026-09-13_jjel_eval_context.md`) for §9.
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

An STC declares three things. The fitting morphism maps a metamodel onto the roles; it is
external to the metamodel, never a stereotype inside it.

### 3.1 Roles (structure)

Node metaclass; edge metaclass with its source and target references; initial node; final
node. For event-driven languages: event metaclass, trigger reference on the edge, identifier
feature of the event. For actions (§5.3): the features or containers holding the condition
(guard) and the assignments, on edges and, where the language has them, on nodes (entry, exit,
action node).

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

Six steps, ratified 2026-09-13. The file-level mapping is filled from the discovery reports.

1. **Events**: roles of §3.1 for events; e as input; candidate (t, e); discard as a step; the
   panel's events section.
2. **Evaluation context**: three roots, read-only model, translatable-subset checker with
   diagnostics.
3. **Condition/assignment roles, unified cycle**: marking as declared component; extended
   components; guards as predicates; actions as parallel assignments; selector as input;
   progress constraint; cycle *candidates → choice → effect → label*. Fork, join and multiple
   tokens come from the marking domain moving from boolean to bounded integer. Laws checked
   at the boundary.
4. **Snapshots**: step-back as a list of full configurations.
   *Between 4 and 5*: Petri nets as third language; the `.smv` exporter.
5. **Trace and scenarios**: label of §4.5; run policy of §6; scenarios saved and replayed as
   regression tests, same shape as counterexamples.
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
- The exact boundary where the read-only exposure of M is enforced (context builder vs proxy
  layer): decided on the JjEL discovery.
- Whether per-element extended components are needed by the three validation languages or
  only the marking is per element (default: marking only, until a language asks).
