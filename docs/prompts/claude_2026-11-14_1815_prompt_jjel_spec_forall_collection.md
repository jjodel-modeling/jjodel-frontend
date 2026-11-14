# JjEL SPEC and the rules dialog: `forall` returns a collection, not a set

Prompt-ID: P-2026-11-14-1815
Chat: C-2026-11-12-1346
Front: maintenance
Lane: fast (wording only: one table and one sentence of `frontend/src/jjel/SPEC.md`, one user-visible string; no behaviour change; the visual line is closed by the chat)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-14 17:40: between "the trunk is right and the word set is imprecise" and "forall should return a set", he chose the first; the book now says collection (book lane P-2026-11-14-1745), and the SPEC must say the same (ticket #932)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-spec-forall`, branch `spec-forall`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt. Model and tier as pinned (RC-16). Before anything else: `pwd`, branch, `git log -1` and `git status` are as
stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-14-1815 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 30 minutes. Grep and read the parts you need, never
cat whole large files. If the session nears its context ceiling, write the handoff with the six headings `## Task`,
`## Scope`, `## Decisions taken`, `## Evidence`, `## Current diff`, `## Remaining checks`. No push, no merge.

## WHAT

`evaluateForAll` (`frontend/src/jjel/evaluator/evaluator.ts:1178-1194`) returns an array that keeps the order of the
collection it ranges over and its repetitions. Two texts call that value a set. Correct the wording. The evaluator, the
parser and the tests are not touched: this is not a behaviour change, and the lane must not make it one.

The rule, the same the book follows: where a text describes the value, say collection; where it names the notation or
the idea (set comprehension, set-builder, set-theoretic), leave it.

## WHERE and HOW

1. `frontend/src/jjel/SPEC.md`, section 5.1.
   - Table **Forms**, column Returns: `Set` becomes `Collection` in the filter and the map rows; `Set + Map` becomes
     `Collection`. The `do` row stays.
   - Directly under that table add two sentences, in the plain register of the file: the set comprehension is how a
     `forall` is read; its value is a collection in the order of the collection it ranges over, repetitions kept
     (`forall s in State.instances : s.isFinal` on three non-final states is `[false, false, false]`), and
     `distinct()` gives the set when a set is wanted.
   - The title of section 5.1 (which ends in "Set Comprehension"), the sentence "It has set-theoretic semantics", line 35 and the rows
     at lines 80 and 774 name the idea: leave them.
   - Section 5.1.1: read it and change it only if a sentence calls the result a set. As read on `aa58e1e17` it already
     says "list of records" and "every ordered pair": if that still holds, no change.
   - Then grep the rest of the file for `set` (case-insensitive, whole word) and apply the rule to each hit; list in the
     final message every hit, changed or kept, with its line.

2. `frontend/src/components/validation/ValidationRulesModal.tsx`, the hint at about line 436: "returns a set and
   produces no verdict" becomes "returns a collection and produces no verdict". Only that word; no identifier, no class
   name, no markup.

3. Grep `frontend/src` and `docs` (excluding `docs/discovery`, `docs/prompts`, `docs/sessioni`, `docs/log-inbox`,
   `docs/claude-code-log*`) for other user-facing or normative texts that say a `forall` returns a set (in-app help,
   Jjodie prompt texts, hover documentation, other SPEC files). Do not edit them: list them in the final message with
   file and line, so the chat decides.

## Gates

`npm run typecheck` (or the project's typecheck command) and the build, as for any lane that touches a `.tsx`. No new
test: nothing behaves differently.

## Closure

One commit, `docs: forall returns a collection in the JjEL SPEC and in the rules dialog hint`, with only the two files
(`git add <the two files>`, never `git add .`). Entry in the maintenance log per P16, closing ticket #932. The Status
flip of this prompt belongs to the closure commit after the chat's GO. Final message: the diff in words, the list of
hits of step 1 and of step 3, gate results.

## REFERENCES

- `frontend/src/jjel/evaluator/evaluator.ts:1178-1194`, `frontend/src/jjel/parser/parser.ts:848`
- `docs/discovery/discovery_2026-11-14_book_review_trunk_checks.md` (probe of lane P-2026-11-14-1235)
- Ticket #932 in `docs/log-inbox/maintenance.md`
