# Codegen: a declarative model of the textual notation, a textual viewpoint (discovery, R-TXT-14)

Prompt-ID: P-2026-11-01-2017
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: discovery (read-only; one report, one docs-only commit)
Depends: P-2026-11-01-1709, P-2026-11-01-1946 (merged); decisions R-TXT-1..14 (7b1ac5abf)
Worktree: ~/jjodel-w-textviewpoint, branch textual-viewpoint-discovery (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, «ok alle raccomandazioni», 2026-11-01 20:12, question 2

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textviewpoint` on
`textual-viewpoint-discovery`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2017 · session <id>]`.
No subagents, no background tasks. No code change: a report and a proposal.

## The case

R-TXT-14: the JjEL generator of P-2026-11-01-1946 is the reference implementation of the default notation, not the
final mechanism. In it, a DSL's override is JjEL code, so the grammar of an override cannot be derived (report of
1709, §2.4) and a parser could only cover the default. Xtext does the opposite: the notation is a declarative
description, and printer, grammar, parser and editor are derived from it. The question is what that description
should be in Jjodel, where the natural home is a viewpoint.

## 1. Discovery (read-only)

Answer from the code and the docs, with files and lines:

1. What a viewpoint is today (`DViewPoint`, the view elements, how a viewpoint applies to a metaclass), what «Derive
   viewpoint» derives from a metamodel, and what the notation library of R-LIB stores. Which of these could hold a
   textual notation without a new kind of object?
2. Where generators live after R-GEN-42/43 (on the metamodel, one dock tab each), and whether a textual viewpoint
   would be a generator, a viewpoint, or both (a viewpoint that a generator interprets).
3. What a notation model must express to cover, as data, the defaults R-TXT-1..12 and the overrides the hardware
   prototype needed: a keyword renamed (`registers` for `nregs`), a containment printed one line per object
   (`requester cpu priority 0`), a list grouped by a classification computed from the data (instructions by RISC-V
   section), a value omitted when it equals a default. Say which of these are pure data and which need an expression
   (JjEL) inside the model, and what the latter costs for deriving a grammar.
4. Parsing: which parser technology already exists in the repo (the JjTL and JjEL parsers: hand-written, generated?),
   and what a parser derived from the notation model would need, with no new dependency.

## 2. Proposal (to discuss, not to implement)

A sketch of the notation metamodel (classes and features, as a table or a short Jjodel metamodel description), the
R-TXT default expressed in it (the model a metamodel gets with no override), and the CoreSpec and ArbiterSpec
notations of the prototype (`~/Downloads/micron-proto/`, read-only, nothing copied into the repo) expressed as
overrides in it. Then: how the printer interprets it (a fixed JjEL generator reading the notation model, or the engine),
how the EBNF is derived, what a later parser would read, and the steps in order with what each needs. Say where the
proposal departs from Xtext and why.

## Lane discipline

Report at `docs/discovery/discovery_2026-11-01_textual_viewpoint.md`: goal, files read with paths and lines, findings
per question, the proposal, risks, questions for Alfonso. `git add` the report, the log entry in
`docs/log-inbox/codegen.md` and the `Status:` flip of this prompt (edit the line directly), in one docs-only commit
`docs(codegen): discovery of a textual viewpoint (P-2026-11-01-2017)`. No push, no merge. End with «Decisions taken
(unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
