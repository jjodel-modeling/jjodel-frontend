# Three checks asked by the book review, and the label «Depends on models»

Prompt-ID: P-2026-11-14-1235
Chat: C-2026-11-12-1346
Front: maintenance
Lane: full (three read-only checks with a report; one label rename, scoped; no visual hard stop inside the lane, the visual line is closed by the chat)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-14 12:10: yes to renaming the label of the properties panel before the book quotes it; the three checks are asked by the verification of the second external review of the Jjodel book (questions Q17, Q18, Q19)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-book-review-checks`, branch `book-review-checks`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt.
Model and tier as pinned (RC-16), effort `xhigh`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as
stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-14-1235 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. Context discipline: grep and read the parts
you need, never cat whole large files or logs; write the report before the soft ceiling (RC-51). If the session nears its
context ceiling, write the handoff with the six headings `## Task`, `## Scope`, `## Decisions taken`, `## Evidence`,
`## Current diff`, `## Remaining checks`. No push, no merge.

## COSA

### Part 1, read-only: three questions of fact, answered from the code and by a probe

Write the report `docs/discovery/discovery_2026-11-14_book_review_trunk_checks.md` (P4: the question, the files read with full
paths, findings with `file:line` and verbatim quotes, the probe and its output). The book repository is read-only; the passages
are quoted here so that you do not need it.

1. **JjGen, `forall` in a template (book, Listing 12.1 and Section 12.3).** The book's generator iterates with
   `State.allInstances.map(...)` and `filter(...)`, and the review asks why it does not use `forall`. In a JjGen hole and in a
   template loop: does `forall x in C such that p : e` (and the block form, if JjGen has one) keep the order of the collection,
   and does it keep repeated values, or does it return a set? Is `map`/`filter` needed to keep order and repetitions? Give the
   answer for JjEL in general and for a JjGen hole in particular.
2. **JjScript, `create instance of State "red"` (book, Section 13.2.3).** What does the quoted string set: the `name` attribute
   of the new object, an identifier internal to the script, or both? What happens when the metaclass has no `name` attribute?
   Is the string usable afterwards as a variable (`set red.name = "Red"`), and by what rule?
3. **JjTL, coercion in a binding (book, Section 11.8.1).** When the source expression of `:=` has a primitive type different
   from the target feature's (an integer to a string feature, a string to an integer one, a boolean to a string), does the
   executor convert, refuse, or assign the value unconverted? Is there a warning? Give the cases as a table, from the code and
   from a probe on both parse paths.

Commit the report alone (`docs: discovery, three checks asked by the book review (P-2026-11-14-1235)`).

### Part 2, scoped change: the label

The properties panel of a model shows the label "Depends from models" (a calque). It becomes "Depends on models". Find every
place where the string, or a variant of it ("Depends from", "depends from"), is shown to the user or asserted by a test, and
change the wording only: no identifier, no key, no class name. List what you changed. Tests first where a test asserts the
string; gates (typecheck against the baseline, `npx vitest run`, build); one code commit (`fix(ui): «Depends on models» in the
properties panel`). Log entry in `docs/log-inbox/maintenance.md` and Status flip as P9 and P13 prescribe; the visual line reads
that the check is owed to Alfonso on localhost:3000 (the properties panel of a model with a dependency).

## NON FARE

- No change of behaviour, no rename of an identifier, no file of the critical zone.
- Nothing in the book repository. No push, no merge: the chat merges.

## RIFERIMENTI

`frontend/src/codegen/` (JjGen), `frontend/src/jjel/`, `frontend/src/jjscript/`, `frontend/src/jjtl/executor/executor.ts`,
the properties panel under `frontend/src/components/`.
