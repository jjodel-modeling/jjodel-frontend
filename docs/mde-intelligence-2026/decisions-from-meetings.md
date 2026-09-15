# Decisions and findings from the meetings

> Scope. This note distills the modeling decisions, framing shifts, and open questions that surface
> across the six meetings, for use in paper drafting (T8) and as input to the trace log (T1). Each
> item is keyed to its meeting of origin. Following the project epistemics rule, claims are marked
> as observed (stated explicitly in a meeting) or inferred (read off the type space or implied),
> and the inferences are flagged. No em dashes. Sentence case headings. Source quotes live in
> `evidence/meeting-transcripts.md`.

## How to read this

The meetings are a reverse-engineering exercise: the group reconstructs, with the LLM, the FTG+PM
model of the harness Alfonso already uses to build jJodel. Meeting 4 is the pivot, where Hans
Vangheluwe (the FTG+PM author) participates and corrects both the metamodel and the framing. The
decisions below are the residue of that process.

## 1. Framing decisions

### 1.1 The object of study is the harness topology, not a doc inventory (M4)

Observed. The reframing is explicit: "what you are describing is not documentation cleanup, it is an
audit of your development." The real object of study is the harness topology and the markdown files
are its instruction set. Consequence for the paper: the research question moves from "what docs
exist" to "what role does each doc play in the loop and who writes versus reads it." This is the
contribution framing the project instructions already adopt.

### 1.2 Two directions, one of them is ours (M1)

Observed. The group names two axes: MDE for AI (use models to define the AI workflow) and AI for MDE
(use AI for modeling activities). The paper sits on the first axis: modeling the agentic process
itself. The AI-for-MDE demos (state machine generation, metamodel from screenshot) are evidence and
motivation, not the claim.

### 1.3 Knowledge depth is a distance, not a code property (M4)

Observed. Knowledge depth is defined as the gap between what the designer knows and what the system
knows. It is explicitly distinguished from technical depth (code structure). The human in the loop
is "not aware of everything." This is the conceptual seed of knowledge debt as a conformance
property: debt is where knowledge "lives only in your head and was never incarnated" in a document.
Mapping to the project lens (inferred): this is the same quantity the debt register measures as
undocumented knowledge in transit and missing Language or Transformation.

### 1.4 Target venue and posture (M4)

Observed. The group decides, in the room, to aim the result at MDE Intelligence. The model is
produced by reverse engineering the existing harness, and the stated next step is to feed the model
back to the agent to generate or improve infrastructure (this becomes the paper's outlook, not its
main claim).

## 2. Metamodel decisions (FTG+PM)

### 2.1 FTG+PM is the chosen instrument (M4)

Observed. After considering AADL and an uncertainty-aware variant, the group decides to model with
FTG+PM. The metamodel is recovered from a screenshot of the source book chapter (the COST action
Springer chapter by Muharrem, Hans, Joachim and others) and is treated as the authority.

### 2.2 The novelty is in the FTG, not the PM (M4)

Observed, from Hans. The PM is "just graphs" plus an activity diagram with fork and join, nothing
new. The value of the FTG is explicitly typed objects and the ability to reason about transformation
paths in heterogeneous models. Direct consequence for the paper: do not claim novelty in the process
model. Frame the contribution as the FTG of the harness (documents as formalisms, transformations as
typed edges) plus the knowledge-debt-as-conformance lens. The project instructions already encode
this; the meeting is the primary evidence for it.

### 2.3 `Transformation.outputs` cardinality: the recovered model was wrong (M4)

Observed. The model generated from the screenshot constrained a transformation to exactly one output
language. Hans corrects this live: a language can be used in many transformations, and a
transformation can have many outputs (star to star). Transformations are in general N to M. Example
given: one transformation outputs both a code model and a configuration model. Status: the corrected
cardinality should be the one carried in `FTG_PM.ecore` and in the serialized harness model. Action
(inferred): cross-check `harness_FTG_PM*.xmi` and `FTG_PM.ecore` against this correction before the
figures are drawn (T7).

### 2.4 FTG is really a relationship graph (M4, Hans)

Observed. Hans notes the name history: FTL (lattice), then FTG (graph), and argues it should be FRG
(formalism relationship graph). Links between formalisms can carry semantics other than
transformation, and formalisms can be annotated with the analyses they admit (his PetriNet plus LTL
gives Boolean plus counterexample example). Implication for us (inferred): the harness FTG can carry
non-transformation edges (for example, a document that types or constrains another), and the lens of
"what analysis does this formalism admit" is a natural extension. Keep this as discussion or future
work, not as a metamodel change, to stay conformant.

### 2.5 Executor typing: lift the binary manual/automatic into three executors (M4)

Observed. Classic FTG+PM types a transformation as manual or automatic, but the loop has three
executors: human director, architect (Claude AI), implementer (Claude Code). The decision is to
lift the binary attribute into an executor typing. This is exactly the project's `auto` plus
definition-tag convention (and the optional `Executor` enum extension). The meeting is the
justification for that convention.

### 2.6 The director plays two roles that must not be collapsed (M4, inferred from M6 plus instructions)

Inferred. The meetings show the director both authoring intent and gating (accept, reject, redirect,
"I am happy with what you have done and we are out of the cycle", M5). The metamodel keeps these
apart: authoring is an `Activity` typed by a manual `Transformation`, gating is a `Decision`. This is
a modeling decision the instructions fix; the meetings supply the behavioral evidence (the director
as a weak Oracle, M6) but never state the split explicitly. Flag as inferred.

## 3. The document type space (candidate Languages)

### 3.1 Markup documents need types, not just structure (M2)

Observed. The first generated metamodel of MD documents captured only document structure (Document,
Block, Paragraph) with no domain types. The objection is explicit: "this is basically the structure
of the document, there are no types, whereas in the other case the word types are visible." Decision:
introduce domain types. Candidate types named in M2: Prosa, Decisiones (decisions with motivation,
date, text), Generated Prompt, Pending Prompt, Feature, Block, Date, Description. Prompt and Feature
are treated as types; Block is the per-domain class.

### 3.2 The system prompt or CLAUDE.md is the constitution (M1, M6)

Observed. M1 calls the main document "the constitution," the system prompt that "knows everything"
and is changed instead of the code to change behavior. M6 walks through the actual CLAUDE.md and
reads it as the persistent control surface ("read before every task," model and effort, risk areas,
critical zone, do-not list). Decision (inferred): CLAUDE.md is the canonical persistent `Object`, as
the project instructions state, and its `Language.definition` must note persistence.

### 3.3 Discovery report is a distinct Language, currently with a broken edge (M1, M6)

Observed. The discovery and implementation split is described in M1 (light vs full iteration:
generate a discovery prompt, run discovery, get a markup report, then generate an implementation
prompt from it). M6 inspects a real discovery report and flags a finding: the discovery report "is
not used by anyone, and this is a mistake, because it must be used" by the implementation step. This
is a concrete conformance gap (a dead or merely aspirational edge, or a missing dataFlow into the
implementation activity) and a candidate row in the debt register (T4).

### 3.4 Session documents replaced end-overs at a known date (M4)

Observed. Handoff documents between chats were called end-overs and used until "the first week of
February." After a recalibration they became Session documents. Two consequences: the corpus is not
homogeneous over time (early stages less structured), and there is a datable schema migration in the
harness itself. The trace ordering (T1) should respect this: end-over and Session document are two
Languages, or one Language with a versioned definition. Decision deferred (open question 6.2).

### 3.5 Specification is a first-class document, named late (M6)

Observed. The JjEL SPEC.md is the first artifact the group is willing to call a "specification"
rather than skill or instruction, because it is "precise enough" and "definitely in the model." It
is read-only and pure (the word "transforming" in its own objective line is flagged as wrong). It
was produced from a conversation, not written up front, and updated incrementally as the language
was revised. Candidate Language: language specification, in the domain-and-language role. Note
(inferred): SPEC.md is both an input to the development loop and the source from which the
implementation was derived, so it has both reader and writer transformations.

## 4. Skills: a separate kind of document

### 4.1 A skill is name plus description plus operational body, loaded lazily (M5)

Observed. A skill carries a front matter (name, description) loaded at session start, and an
operational body loaded only when an evaluation matches the user prompt to the description. This is
contrasted with project instructions, which load the whole file every session. The token economy is
the stated reason. Modeling consequence (M5, observed and debated): a skill is not a transformation;
it is rule-based competence (rules added to a transformation). "When you call the skill and it
executes, that is a transformation." So a skill conditions or refines an `Activity` rather than
being typed as one.

### 4.2 Skill selection is non-deterministic, and that is the interesting part (M5)

Observed. Selection runs top to bottom over descriptions and is non-deterministic: different runs may
apply different subsets. You can also call a skill directly, bypassing evaluation. Research move
proposed in the room: log not only the usual events but the skills applied per run, then do process
mining over the traces. Define a notion of coherence: tolerate non-determinism, but flag when a trace
enters a "risky zone" where a quality factor may degrade. This is a concrete assessment idea for T5
(an indicator over execution traces), and it is the meeting's strongest link to the special theme.

### 4.3 The paradigm shift: from strict workflows to declarative properties plus runtime delegation (M5)

Observed. The arc is named: strict procedural workflows, then declarative process models (assert
properties, not order), then conformance checking on logs, now delegation to an intelligent agent at
runtime. Consequence for the model (observed): a fixed workflow may be too dynamic to capture, but
properties can still be checked, including on execution traces (for example, "a validation is always
done after a code change"), possibly via a parallel runtime monitor. This reframes what the PM can
honestly claim: the PM is deterministic at the level the director drives it, but each activity is
internally non-deterministic.

### 4.4 The Golden Gate case underwrites the inference claim (M5)

Observed. The Anthropic interpretability work (dictionary learning, Sonnet, May 2024) is cited to
argue that skill selection involves inference over natural language mapped to a concept, not pure
lexical matching. The group connects this to the semiotic triangle (concept, representation,
interpreter). Caveat raised in the room: some participants hold that the base reasoning is still
probabilistic, and that observationally the two accounts may be indistinguishable. Use in the paper
(inferred): support, with hedging, the claim that description-to-skill matching is semantic; do not
overclaim a non-probabilistic mechanism. Present the opposing view, per the evenhandedness rule.

## 5. Tooling and method decisions

### 5.1 The triad is fixed and named (M4)

Observed. Architect is Claude (the chat, used for reasoning and prompt generation), implementer is
Claude Code, and the director is Alfonso. The director writes "0, maybe 10 percent" of code; the
work is knowing what to do and tooling up first (M2). This is the executor vocabulary the whole model
depends on.

### 5.2 Model and prompt management is an acknowledged gap (M2)

Observed. There is no Git-like deterministic rollback over the conversation: chat may roll back while
code does not, so frequent commits plus Git are the mitigation. Multi-agent orchestration (an
orchestrator dispatching sub-agents with separate context windows) is described as the way to save
tokens and sharpen focus, but consistency across agents is an open concern. Implication (inferred):
the PM should model the back-edge on reject as the director's Decision, and treat cross-agent
consistency as a finding rather than a solved mechanism.

### 5.3 Concrete syntax for the harness model is small and was built live (M4)

Observed. The group builds a jJodel concrete syntax (the "visual process" viewpoint) for the model:
roughly five node kinds (object, activity, plus control nodes), with Object carrying a required typed
link to Language and edges for typing. This is the basis for the FTG and PM figures (T7). Note: the
demo ran on the beta build, which was slow due to a suspected data leak.

### 5.4 Reverse engineering, then forward generation (M4)

Observed. The agreed pipeline: reverse engineer the harness into an FTG+PM model, validate that it
represents what is in the project, then optionally hand the model back to the agent to generate or
improve the running infrastructure. The forward direction is outlook, consistent with the project's
phase 5.

## 6. Open questions to carry forward

These are unresolved in the meetings and should be tracked, not closed prematurely.

6.1 Multiplicity on the gating Decision (M4). Whether a Decision has exactly two outcomes was raised
and not answered ("I think it does matter"). Resolve against observed traces.

6.2 End-over versus Session document (M4). One Language with a versioned definition, or two
Languages. Decide during FTG synthesis (T2) using the February recalibration date.

6.3 Whether Markdown draft and Markdown reviewed are one Language with a status, or two (M4). The
group floated unification by status or role. Resolve by inventory.

6.4 Where invariants live in the metamodel (M6). JjEL invariants exist but their placement (general
versus per-metaclass) is undecided. This is a JjEL design question, relevant only if invariants enter
the development loop as a Language.

6.5 How to capture trace links between a prompt and the code change it triggered (M6). Raised as
useful ("if I change the code here and it was triggered by the prompt"). This is the provenance
backbone for the trace log; decide whether it lives in the model or the companion trace log.

6.6 Discovery report dead edge (M6). Confirm on current corpus whether the discovery report is in
fact consumed by the implementation step, or whether the edge is aspirational. First debt-register
row to validate.

6.7 Coverage of a specification is unknown and possibly probabilistic (M6). The closing observation:
documents like SPEC.md have no fixed structure and an unknown, possibly probabilistic, coverage.
Bears on how honestly the assessment (T5) can claim conformance.
