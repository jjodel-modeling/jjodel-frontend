# Background: spec-driven development

Spec-driven development (SDD) emerged during 2025 as one of the most discussed
practices in AI-assisted software engineering. Its premise is simple: rather than
prompting a coding agent ad hoc, the developer first writes a specification, and
that specification becomes the shared reference for both the human and the agent
that generates the code (Böckeler 2025; Liu 2025; GitHub 2025). The intent is to
counter the haphazardness of unstructured "vibe coding" by reintroducing
deliberate requirements analysis, design, and human review before code is
produced (Liu 2025). The term is still in flux, however, and has already
undergone semantic diffusion: practitioners use "spec" to mean anything from a
structured requirements artifact to a merely detailed prompt (Böckeler 2025).

## What counts as a specification

There is no settled definition of a specification in this setting. The recurring
informal characterization is a structured, behavior-oriented artifact written in
natural language that expresses what the software should do and guides a coding
agent (Böckeler 2025). Liu (2025) argues a specification should go beyond a
product requirements document and define external behavior explicitly: input and
output mappings, preconditions and postconditions, invariants, interface and
integration contracts, and state logic. Notably, this is close to the long
established notion of a specification in software engineering, and several of the
quality criteria proposed for AI-oriented specifications, such as the use of
domain ubiquitous language and Given/When/Then scenarios, are inherited directly
from behavior-driven development (Liu 2025).

A distinction that several authors make, and that matters for our purposes, is
between a specification and the broader persistent context of a project. The
persistent context, sometimes called a memory bank or, in GitHub's spec-kit, a
constitution, holds rules, conventions, and high level descriptions of the
product and architecture that apply across all sessions and all tasks. A
specification, by contrast, is relevant only to the task that creates or changes
a particular piece of functionality (Böckeler 2025; GitHub 2025). The two play
different roles: the persistent context is standing, normative, and always in
scope, whereas a specification is local to one unit of work.

## A spectrum of commitment to the specification

Approaches differ most in how durable the specification is meant to be. Böckeler
(2025) identifies three levels that build on one another. In the spec-first level,
a specification is written before coding and then effectively discarded once the
task is done. In the spec-anchored level, the specification is retained and
evolved together with the feature it describes, so that later changes start from
the specification rather than from the code. In the spec-as-source level, the
specification becomes the only artifact a human edits, and code is treated as a
generated, non-authoritative output, sometimes marked explicitly as generated and
not to be edited by hand.

These levels correspond to an underlying and still unresolved disagreement about
the source of truth. One camp, expressed most strongly in GitHub's framing,
treats specifications as the durable artifact from which implementations are
generated, so that maintaining software means evolving specifications and code
becomes a last-mile concern (GitHub 2025). A more conservative camp keeps
executable code as the artifact that must be maintained and regards the
specification as a driver of generation, by analogy with how tests drive code in
test-driven development (Liu 2025). The choice is consequential, because the two
positions lead to entirely different workflows for curating specifications,
regenerating code, and reviewing changes.

## Tooling

The practice is embodied in several tools that, despite the shared label, differ
substantially (Böckeler 2025). Amazon Kiro is the most lightweight and is
essentially spec-first: it guides the developer through a fixed sequence of
requirements, design, and tasks, each captured in a single document, with
requirements written as user stories and acceptance criteria. GitHub's spec-kit
is heavier and more customizable: it sets up a workspace with a constitution of
immutable principles and drives a repeated cycle of specify, plan, and tasks,
generating many documents per feature and using AI-interpreted checklists as a
definition of done for each step. The Tessl framework is the only one that
explicitly aspires to spec-anchored and spec-as-source operation, maintaining a
mapping between a specification and the code generated from it. The diversity of
these tools is itself a finding: spec-driven development is not a single method
but a family of related ones.

## Relationship to earlier practices

Spec-driven development is frequently compared to test-driven and behavior-driven
development, and at the level of intent the comparison is apt: in all three a
declarative artifact precedes and constrains the implementation (Liu 2025). The
more revealing lineage, however, is model-driven development. Böckeler (2025)
observes that the spec-as-source ambition recreates the central idea of
model-driven development, in which a model, expressed in a modeling language or a
domain-specific language, was turned into code by purpose-built generators. That
tradition struggled to gain adoption for business applications because it sat at
an awkward level of abstraction and imposed substantial overhead in building and
maintaining languages and generators. Large language models remove much of that
overhead, since the specification can now be natural language and no bespoke
generator is required. The trade-off is that the determinism of classical
generation is lost, and the structure that once enabled tool support for writing
valid, complete, and consistent specifications is also given up. Böckeler (2025)
raises the concern that spec-as-source may therefore inherit the weaknesses of
both lineages at once, the rigidity of model-driven development and the
non-determinism of language models, an open question that earlier code-from-model
work is well placed to inform.

## Open problems

Reported experience with current tools surfaces several recurring difficulties.
The first is review burden: the more elaborate workflows generate large numbers
of overlapping documents that are verbose and tedious to review, to the point
that reviewing prose can be less informative than reviewing code (Böckeler 2025).
The second is non-determinism: because code generation from a specification is
not deterministic, specification drift and hallucination are difficult to avoid,
and authors on both sides of the source-of-truth debate conclude that strong,
deterministic continuous integration remains necessary to safeguard quality (Liu
2025). The third is the separation of functional from technical concerns: tools
encourage keeping a functional specification distinct from implementation detail,
but in practice the boundary is unclear and inconsistently applied, echoing a long
standing difficulty in requirements practice (Böckeler 2025; Liu 2025). The fourth
is fit to problem size: opinionated, document-heavy workflows can be
disproportionate for small changes, turning a minor bug fix into many user
stories and acceptance criteria, which suggests that an effective approach must
support several workflows scaled to the type and size of the change (Böckeler
2025). Finally, there is as yet no systematic way to evaluate the quality of a
specification, in contrast to the maturing practice of evaluating models and
prompts (Liu 2025). These gaps motivate a more principled account of the
documents and process that an AI-assisted development workflow relies on, which
we develop in the remainder of this paper.

## References

Böckeler, B. (2025). Understanding spec-driven-development: Kiro, spec-kit, and
Tessl. martinfowler.com.
https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html

GitHub (2025). What is spec-driven development? Spec Kit documentation.
https://github.github.com/spec-kit/concepts/sdd.html

Liu, S. (2025). Spec-driven development. Thoughtworks.
https://thoughtworks.medium.com/spec-driven-development-d85995a81387
