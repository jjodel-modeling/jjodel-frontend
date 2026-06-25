# Paper structure: MDE Intelligence 2026

> Working outline for T8. Target: research paper, 10 pages, ACM `acmart` `sigconf`, single-blind
> (authored, not anonymized). A 5-page extended-abstract cut is derivable from the same source and is
> marked per section. The structure is built from the existing materials: `decisions-from-meetings.md`,
> `evidence/inventory-and-traces.md`, `debt-register-firstcut.md`, and the serialized model
> `harness_FTG_PM*.xmi`. No em dashes. Page budget sums to about 10 including references.

## Title (working)

Knowledge debt as a conformance property: an FTG+PM model of a three-agent LLM-assisted development
harness. (Alternatives to test: "Typing the harness", "What the markdown carries".)

## Thesis in one sentence

An AI-assisted MDE development process can be formalized as an FTG+PM model grounded in repository
evidence, and once it is, knowledge debt becomes a conformance property of that model that can be
measured, not just described.

## Research questions

- RQ1. Can a heavily LLM-assisted MDE development harness be reconstructed as an FTG+PM model
  grounded in repository evidence? (feasibility, descriptive)
- RQ2. Does reframing knowledge debt as conformance gaps in that model yield measurable indicators of
  knowledge fidelity? (the assessment claim, fits the special theme)
- RQ3. What do those indicators reveal about where domain knowledge thins out in the harness?
  (findings)

## Contribution statement (for the intro)

1. The harness topology framing: the markup documents are the instruction set of a three-executor
   development loop, and that loop is the object of study.
2. An FTG+PM model of that harness, with executor typing lifted from the binary manual or automatic
   attribute to director, architect, implementer, kept conformant to the metamodel.
3. Knowledge-debt-as-conformance: a lens that turns six classes of knowledge loss into model
   conformance gaps.
4. An assessment instrument: seven re-runnable indicators applied to a real 233-document corpus, with
   an honest reading of what they show and do not show.

## Section structure and page budget

### 1. Introduction (about 1 page; abstract about 0.25)

Hook: LLM agents now write most of the code in some MDE tools (jJodel, about 370k lines), but the
domain knowledge that should survive the process lives in markup documents whose role is informal.
State the problem (knowledge debt versus technical debt), the three contributions, the RQs, and the
result preview (the headline numbers). Abstract drafted last.

5-page cut: keep, compress to about 0.6 page.

### 2. Background (about 1 page)

FTG+PM in brief (formalisms as nodes, transformations as typed edges; PM as the enacted activity
diagram). Be explicit, citing Hans, that FTG+PM is prior art and the novelty is not the formalism.
One paragraph on LLM-agentic development (architect plus implementer plus director, persistent
context, skills). Source: `decisions-from-meetings.md` sections 1 and 2.

5-page cut: fold into the introduction, about 0.4 page.

### 3. The jJodel harness as object of study (about 1 page)

The triad and the two roles of the director (authoring as Activity, gating as Decision). The markup
control surface: persistent context (CLAUDE.md), handoff and spec, target and record, verdict and
review, governance, domain and language. One running example thread (a feature: discovery then
decision then implementation then commit then log). Source: decisions sections 3 to 5, M1, M4, M6.

5-page cut: keep, about 0.5 page, lead with the figure.

### 4. Modeling the harness in FTG+PM (about 2 pages, 2 figures)

Figure 1: the FTG (Languages and Transformations of the harness). Figure 2: the PM (the enacted
cycle as an activity diagram, executors shown, persistent Objects drawn distinctly, the gating
Decision with its back-edge on reject). Executor typing convention (auto plus definition tag).
Validation against traces, and the principle that divergence is data, not a bug to repair. Source:
`harness_FTG_PM*.xmi`, plus the outputs-cardinality correction from M4 (decisions 2.3).

5-page cut: one combined figure, about 1 page, prose trimmed.

### 5. Knowledge debt as conformance (about 1 page)

Define the six conformance classes (missing Language, missing Transformation, stale context store,
dead or aspirational edge, stale dataFlow, undocumented knowledge in transit). This is the
conceptual core and the defensible novelty. Tie each class to the metamodel feature it violates.
Source: project lens plus `debt-register-firstcut.md`.

5-page cut: keep tight, about 0.6 page; it is the contribution, do not cut to nothing.

### 6. Assessment (about 1.75 pages) [special-theme core]

The instrument: seven indicators, each a count over the corpus. Table of indicators with values.
Then the two anchor results in prose: handoff incarnation rate (about 4 to 5 percent of discovery
reports carried forward in writing) and a governance invariant the process does not keep (log
rotation, 514 versus 20, no archive). The debt register (Table) as the per-finding backing. Make
clear the data is scripted and re-runnable. Source: `debt-register-firstcut.md`,
`evidence/inventory-and-traces.md`.

5-page cut: keep the indicator table and the two anchor results, drop the per-finding walkthrough,
about 1 page. This section is what justifies submitting at all under the special theme.

### 7. Discussion and threats to validity (about 0.75 page)

n equals 1, self-study (director, analyst, and the LLM that runs the harness coincide). Classification
sensitivity (what counts as a downstream consumer, what counts as cleanly typed). Indicators measure
incarnation and conformance, not software correctness. The probabilistic-versus-conceptual caveat on
skill selection (M5), presented evenhandedly. Source: decisions 4.2 to 4.4, register "honest limits".

5-page cut: compress to a paragraph.

### 8. Related work (about 0.75 page)

Four buckets and the delta against each: MDE plus LLMs (generation and prompt engineering), process
and workflow modeling (declarative process models, conformance checking, process mining over agentic
runs, M5), technical debt versus knowledge debt, and harness or agent-workflow engineering. Delta:
nobody casts agentic-development knowledge loss as FTG+PM conformance gaps. Source: T6, decisions 4.3.

5-page cut: about 0.4 page, one paragraph per bucket compressed.

### 9. Conclusion and future work (about 0.5 page)

Restate the measured result. Outlook: the prescriptive forward harness (turn the validated PM into a
process the agents follow, each Language into a template), and process mining plus a coherence or
risky-zone monitor over skill traces (M5). Outlook only, not a claim.

5-page cut: about 0.3 page.

### References (about 1 page)

FTG+PM sources (the Springer book chapter already in the repo, `978-3-030-43946-0_9.pdf`), MDE plus
LLM, technical debt, process mining, Anthropic interpretability (Golden Gate, M5).

## Figures and tables checklist (T7)

- Figure 1: FTG of the harness (vector, TikZ or equivalent, two-column safe).
- Figure 2: PM activity diagram (executors and persistent Objects distinct).
- Optional Figure 3 (5-page: the only figure): combined FTG plus PM.
- Table 1: indicators with values.
- Table 2: debt register (condensed to the strongest rows for space).

## Build order recommendation

1. Reconcile the model first (add missing Languages D2 and D4, mark `L_handover` retired, fix
   outputs cardinality) so the figures are drawn once.
2. Draw Figures 1 and 2 (T7).
3. Write sections 5 and 6 first (the contribution and the assessment), since they carry the paper.
4. Then 3, 4, 2, 8, 7, 9, and the introduction and abstract last.

## Decision still owned by the director

10-page research paper versus 5-page extended abstract. The outline supports both from one source.
The empirical spine (section 6) is what makes the 10-page version defensible under the special theme.
