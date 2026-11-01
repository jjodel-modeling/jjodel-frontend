# Codegen: textual syntax from the metamodel: base grammar, styles, annotations, identity (discovery, R-TXT-16..20)

Prompt-ID: P-2026-11-01-2210
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-01 · hard-stop at the context ceiling, continued by P-2026-11-01-2232
Lane: discovery (read-only; measured probes allowed outside `src/`; one addendum, one docs-only commit)
Depends: P-2026-11-01-2017 (report on the trunk); decisions R-TXT-1..20
Worktree: ~/jjodel-w-textsyntax, branch textual-syntax-discovery (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 20:47-22:06, «procediamo»

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textsyntax` on
`textual-syntax-discovery`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2210 · session <id>]`.
No subagents, no background tasks. No change under `frontend/src/`.

## The case

Read `docs/decisions.md` section R-TXT (rows 16 to 20 are new) and `docs/discovery/discovery_2026-11-01_textual_viewpoint.md`
in full first. The design is now: a base grammar derived from the metamodel and not editable (R-TXT-16, level 1); a
style chosen from a catalog that maps it to a concrete grammar (level 2); optional syntax annotations on metamodel
elements (level 3); printer and parser derived from the resulting feature-annotated EBNF; the model as the single
source of truth (R-TXT-17); identity by editor origins inside Jjodel and by a confirmed cascade on re-import (R-TXT-18);
application as a minimal diff in one undo step (R-TXT-19); comments and formatting kept by a concrete syntax tree
(R-TXT-20). Reuse what still holds in the 2017 report and say what changes.

## Questions

1. **Base grammar.** Its form (one rule per metaclass, which constructs), the derivation algorithm from a metamodel
   against R-TXT-1..12, and the base grammar of the 1709 fixture metamodel.
2. **Styles.** Define a style as a function from base to concrete grammar: its parameters (block delimiters, assignment
   form, separators, terminators, comments, quoting, keyword case). Write the C-like and Pascal/Ada styles in full,
   sketch indentation, Lisp, YAML-like and HUTN, and give the argument that each is unambiguous for every base grammar
   (or the condition under which it is not). Show the 1709 fixture printed in each of the first two.
3. **Annotations.** The minimal set of syntax annotations on metamodel elements needed to reproduce, in the C-like
   style, the hand-written text of the prototype's CoreSpec and ArbiterSpec (`~/Downloads/micron-proto/`, read-only,
   nothing copied into the repo): feature keyword, one-line or positional class, enumeration subsets for grouping,
   binary operator with symbol and precedence. Where annotations live in Jjodel's metamodel data, and for each one how
   it changes the concrete grammar and why the result stays unambiguous. Write the two concrete EBNF grammars in full.
4. **Printer and parser.** The serialization rule from the concrete grammar; then, measured on the two grammars and
   the fixture, `nearley` (Earley, already a dependency), `ohm-js` (PEG, already a dependency) and a hand-written
   interpreter: grammar as data at run time, indentation-sensitive lexing (for the indentation style), error messages
   on a broken input (show one), error tolerance (what is recovered from a partly broken text), parse time on 1,000
   objects. Probes in a scratch folder outside `src/`, not committed.
5. **Identity and application (R-TXT-18, R-TXT-19).** How origins become Monaco decorations that survive edits, and
   what the editor knows of a span after a cut, a paste, an undo. The cascade on re-import step by step, its thresholds
   and the confirmation the user sees. The diff as JjScript lines through the existing guard, planner, preview and
   `applyAsOneStep`: does that path cover create, update, delete and move, or what is missing.
6. **Comments and formatting (R-TXT-20).** What the concrete syntax tree stores and how an incremental print replaces
   only the spans of changed objects; what Xtext's node model and change serializer do that we copy and what we do not.
7. **Plan.** The steps in order, each with what it needs and what it delivers, starting from «new model from text» in
   one style and ending with the round trip of scenario 2 (edit in a diagram, text updated with its comments kept).

## Lane discipline

Addendum at the end of `docs/discovery/discovery_2026-11-01_textual_viewpoint.md`, headed `## Addendum: textual
syntax from the metamodel (P-2026-11-01-2210)` (R-E/E-1: the existing report is not rewritten). In the same pass,
replace «JjEL generator» with «JjGen generator» in that report where it names the generator (R-TXT-15). Then the
questions for Alfonso with one recommendation each, and which of the ten questions of §4 the rows R-TXT-16..20 settle.
`git add` the report, the log entry in `docs/log-inbox/codegen.md` and the `Status:` flip of this prompt (edit the line
directly) in one docs-only commit `docs(codegen): textual syntax addendum (P-2026-11-01-2210)`. No push, no merge. End
with «Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
