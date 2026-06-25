# Harness goal model (GRL/NFR)

> Purpose. Make explicit why each harness document type exists, in terms of the quality factors it is
> meant to improve and the ones it harms, as a goal model. Notation: NFR framework softgoal
> interdependency graph (SIG), compatible with GRL. Softgoals are quality factors; document types are
> operationalizations contributing to them with labelled links. Contributions use the NFR scale:
> Make (++), Help (+), Hurt (-), Break (--), Unknown (?). Grounded in the evidence files and the
> meetings; the intended-versus-realized gaps are the bridge back to knowledge debt. No em dashes.

## Softgoals (quality factors)

Two top softgoals are in tension, with a third cross-cutting concern.

Knowledge fidelity (top softgoal), refined into:
- Consistency: documents agree with each other and with the code.
- Freshness: a document reflects the current state of what it describes.
- Traceability: a change can be linked to the intent and the evidence that produced it.
- Coverage: the relevant artifacts and steps are captured by some document.
- Reproducibility: the same input yields the same usable output across sessions.
- Comprehensibility: legible to both the human director and the agents.

Process efficiency (top softgoal), refined into:
- Token economy: low context-window and token cost.
- Velocity: low time to a usable result.

Governance (cross-cutting), refined into:
- Conformance: artifacts obey the rules stated for them.
- Risk containment: verified behaviour is not degraded.

## Document types (operationalizations)

Abstracted from the 11 jJodel languages into a generic catalogue.

1. Persistent context (constitution): rules and conventions read before every task.
2. Agent memory: distilled facts carried across sessions.
3. Task brief: the director's intent for a unit of work.
4. Design note: the architect's design and rationale.
5. Discovery report: a verdict on the current state of the code base.
6. Prompt artifact: the generated instruction handed to the implementer.
7. Specification: a precise language or tool definition that enters the loop.
8. Governance policy: conventions, coding standards, risk areas.
9. Skill: a lazily loaded competence description.
10. Operational log: append-only record of what was done.
11. Handover or session document: state passed between sessions.
12. Code and changelog: the target, plus its record of change.
13. Migration spec: a recovery procedure that realigns drifted artifacts.

## Contribution matrix

Cells: `++` Make, `+` Help, `-` Hurt, `--` Break, blank none. Columns abbreviate the softgoals:
Cons (consistency), Fresh (freshness), Trac (traceability), Cov (coverage), Repr (reproducibility),
Comp (comprehensibility), Tok (token economy), Vel (velocity), Conf (conformance), Risk (risk
containment).

| Document type | Cons | Fresh | Trac | Cov | Repr | Comp | Tok | Vel | Conf | Risk |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Persistent context | ++ | - | | + | + | + | -- | | + | + |
| Agent memory | + | - | + | | | + | - | + | | |
| Task brief | + | | + | + | | + | | + | | |
| Design note | + | | + | + | | ++ | - | | | |
| Discovery report | + | | + | + | | + | + | + | | ++ |
| Prompt artifact | + | | + | | + | + | | + | + | + |
| Specification | ++ | - | | + | + | ++ | - | | + | |
| Governance policy | + | | | + | + | + | -- | | ++ | + |
| Skill | + | | | + | + | + | ++ | + | + | - |
| Operational log | | | ++ | + | | | -- | | + | |
| Handover or session | + | - | + | | | + | - | + | | |
| Code and changelog | | | + | ++ | | | | | | + |
| Migration spec | ++ | + | | | + | | | | + | + |

## Reading the matrix: the three structural trade-offs

1. Token economy versus knowledge fidelity. Almost every fidelity-improving document (persistent
   context, governance, specification, log) hurts token economy, because it competes for the context
   window or is loaded every session. The skill is the harness's resolution: it carries competence
   but loads lazily, so it Makes token economy. Evidence: M5 (instructions load the whole file every
   session, skills load only name and description until matched).

2. Freshness versus consistency. Persistent stores (constitution, specification, agent memory,
   handover) Make or Help consistency but are themselves freshness liabilities: they go stale while
   the code moves. This is why their freshness cell is negative even though their consistency cell is
   strong. Evidence: D1 (stale twin constitution), D9 (derived docs drift from spec).

3. Determinism versus efficiency and flexibility. The skill Helps reproducibility (it compresses a
   refined transformation) yet Hurts risk containment, because its selection is non-deterministic:
   different runs may apply different skills. Evidence: M5 (non-deterministic, top-to-bottom skill
   selection; the proposed coherence or risky-zone monitor).

## Intended versus realized: the bridge to knowledge debt

The matrix records intent: the quality a document is designed to improve. Knowledge debt is where the
realized contribution falls short of the intended one. Three measured gaps from the corpus:

- Discovery report, Traceability: intended `+` (a written verdict that should constrain later work),
  realized close to zero. Only about 4 to 5 percent of discovery reports are carried forward in
  writing (handoff incarnation rate). The intended contribution is not realized: the knowledge stays
  in session.
- Persistent context, Conformance: intended `+` (it states the invariants), realized negative for at
  least one invariant. The log rotation rule is violated 25 to 1, so the document asserts a rule the
  process does not keep.
- Specification, Freshness: intended neutral to positive for its derived views, realized negative.
  The user-facing reference is 3 to 4 percent the size of the spec it mirrors.

So the goal model and the debt register are two readings of the same documents: the SIG is the design
intent, the register is the audit of realization, and each measured gap is one negative
realized-link overriding a positive intended-link.

## Use in the paper

Figure: a compact SIG (see `paper/figures/goal-model.tex`) showing the two top softgoals in tension,
their refinements, and the salient operationalizations with the three trade-offs highlighted. Table:
the full contribution matrix above. Text: define the softgoals, justify the strong links with
evidence, then present the three intended-versus-realized gaps as the transition into the assessment.

## Open points

- The contribution strengths are first-pass and partly judgement-based; mark them as such and justify
  every `++` and `--` with a citation to evidence or a meeting.
- Decide whether velocity belongs under efficiency or is dropped, since it is the hardest to measure
  at n equals 1.
- The skill's negative on risk containment is the most contestable link; it depends on accepting that
  non-deterministic selection is a risk, which the runtime-coherence indicator (D dimension) is meant
  to quantify.
