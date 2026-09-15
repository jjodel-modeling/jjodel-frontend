# Performance parameters of a generic harness

> Purpose. Generalize the seven jJodel indicators (`debt-register-firstcut.md`) into a parameter model
> for an arbitrary LLM-assisted development harness, so the paper's assessment section measures a
> harness, not just one repository. The framing stays inside FTG+PM: a harness is its FTG (type
> space), its PM (enacted process), a governance overlay (rules and skills), and a runtime policy.
> Performance parameters attach to each of these. No em dashes. Static means computable from the
> model plus corpus; dynamic means it needs execution traces or logs.

## What a harness is, for measurement

A harness is the apparatus that carries intent, context, and verdicts between executors. Formally:

- a set of `Language`s (typed documents) and `Transformation`s (typed steps), the FTG;
- an enacted process of `Activity`, `Object`, and control nodes, the PM, validated against traces;
- a governance overlay: rules stated inside Languages (CLAUDE.md style) and skills that condition
  transformations;
- a runtime policy: how much is fixed workflow versus delegated to the agent at execution time.

"Performance" then has two readings. The outcome reading (speed, cost, defect rate) is the usual one
and is not our contribution. The knowledge reading (how faithfully domain knowledge survives the
process, and how well the process is governed) is the one this lens makes measurable as conformance.
The claim worth defending: the knowledge parameters explain and predict the outcome parameters.

## Dimension A. Knowledge fidelity (the core, measurable as conformance)

These are the parameters the paper owns. Each is a conformance property of the model.

1. Typing coverage. Share of real artifacts typed by some `Language`, and share of real steps typed
   by some `Transformation`. Low coverage means the model (and the governance) does not reach part of
   the process. Static. jJodel: about 60 percent of documents cleanly typed.
2. Incarnation rate of knowledge in transit. Share of handoffs whose knowledge is written into a
   typed `Object` rather than living only in-session or in the director's head. The sharpest single
   parameter. Static (citation or carry-forward analysis). jJodel: about 4 to 5 percent of discovery
   reports carried forward in writing.
3. Context freshness. Age of each persistent `Object` relative to the code it describes, and the
   share of persistent stores updated within the active window. Captures the stale-but-authoritative
   danger quadrant. Static (git dates) or dynamic (against code change events). jJodel: 1 of 2
   constitutions stale.
4. Definition-to-artifact conformance. Share of invariants and rules stated in a `Language.definition`
   that the actual artifacts satisfy. Static. jJodel: log-rotation rule violated 25 to 1.
5. Derived-document drift. Divergence between a document and the source or spec it should mirror.
   Static (size, diff, or semantic distance). jJodel: help reference 3 to 4 percent the size of the
   spec.
6. Dead and aspirational edges. `Transformation`s declared in the FTG whose outputs never appear as a
   written `Object`, or FTG edges never realized in a PM trace, or production transformations that
   stopped firing. Static plus dynamic. jJodel: `L_handover` retired since 2026-02.
7. Provenance completeness. Share of code changes traceable to a triggering prompt or discovery (the
   trace-link question from M6). Dynamic. jJodel: not yet instrumented.

## Dimension B. Process structure (the shape of the harness)

These characterize the harness independently of any single run.

8. Type-space size and granularity. Number of `Language`s and `Transformation`s and how fine-grained
   they are. Too coarse hides steps, too fine is unenactable. Static.
9. Loop depth and iteration profile. Light versus full iterations, and reject back-edges per feature
   (the director's gating loop). Dynamic.
10. Executor distribution. Share of `auto` (agent) versus manual (human) transformations, and the
    load on each of director, architect, implementer. Reveals where the human is the bottleneck or
    the single point of knowledge. Static (model) plus dynamic (per run).
11. Branching and gating density. Use of `Fork` and `Join` (real parallelism) and number of
    `Decision` gates per cycle. Static.
12. Context-window economy. Token budget consumed per `Activity` against the window, and adherence to
    a working-set rule (the 60 or 40 split from M1). Dynamic.

## Dimension C. Governance and control

13. Strictness calibration. How tight the demanded conformance is, and whether it is right-sized.
    Both over-constraint (rules nobody can follow, so they rot, see parameter 4) and under-constraint
    (no rule where one is needed) are failures. The meetings call for several degrees of conformity.
    Static plus judgment.
14. Gate effectiveness. The director as Oracle: reject rate, and share of rejects that catch a real
    defect. A weak gate lets debt through; an over-eager gate wastes cycles. Dynamic.
15. Risk-zone coverage. Whether dangerous areas (the critical zone) are explicitly typed and guarded
    by rules or skills, versus implicit. Static.

## Dimension D. Runtime non-determinism (from M5)

16. Skill-selection non-determinism. Variance or entropy of which skills fire for similar inputs.
    Some non-determinism is the point of delegation; too much is unpredictability. Dynamic.
17. Trace coherence. Distance of a run's skill-and-activity trace from a reference good trace, and
    proximity to a risky zone where a quality factor is known to degrade. The M5 process-mining idea.
    Dynamic.
18. Determinism versus delegation balance. How much of the process is a fixed workflow versus
    delegated to the runtime agent. A control knob, not a defect: the paper can position the harness
    on this axis. Static (policy) plus dynamic (observed).
19. Property satisfaction on execution traces. Declarative conformance: properties that must hold over
    runs (for example, a validation always follows a code change), checkable by a parallel monitor.
    Dynamic.

## Dimension E. Outcome (context, not the novelty)

20. Velocity (features or lines per unit time), cost (tokens and money per accepted change), defect
    and regression rate, and rework rate. Standard. Use them to test the hypothesis that the
    knowledge-fidelity parameters (A) predict them.

## How to use this in the paper

The assessment section should: (1) present dimension A as the measured core, with the jJodel numbers;
(2) report a few B and C parameters to characterize the harness shape; (3) propose D as the dynamic
extension enabled by logging (process mining over skill traces), positioned as the bridge to the
special theme's call for runtime evaluation; (4) keep E as the outcome the knowledge parameters are
meant to explain, and be explicit that the causal link is hypothesized, not yet demonstrated at
n equals 1.

A clean one-line definition for the paper: the performance of a harness, in knowledge terms, is the
degree to which its enacted process conforms to its own type space and governance, measured as
coverage, incarnation, freshness, conformance, and edge liveness, with non-determinism bounded by
trace coherence.
