# Prompt — Discovery: the JjEL evaluator and its context for simulation (read-only)

**Date**: 2026-09-13 01:00
**Type**: discovery (Phase 1 of two-phase). No code changes.
**Lane**: simulation engine, computational model.
**Runs in parallel with**: `claude_2026-09-13_0030_prompt_discovery_simulation_engine.md` (the
engine and panel side). Perimeters are disjoint: this prompt does not read
`frontend/src/components/editor-v2/sim/`; the other does not read `frontend/src/jjel/`. Both write
to `docs/claude-code-log.md`: before committing, re-read the head of the log and place your entry
under the header line, above any entry the other session may have added; if `git add`/`commit`
fails on `.git/index.lock`, wait and retry, never remove the lock.

## Context

The simulation engine is being redesigned around a computational model with nuXmv's semantics.
Guards will be JjEL predicates evaluated read-only on a **configuration** (frozen model, engine
state, current event); actions will be parallel assignments to engine state components, whose
right-hand sides are JjEL expressions read on the previous state. Step 2 of the plan is the
evaluation context: three roots (`self` structural, the state, the current event), model in
read-only, writes admitted on the state only. A translator to nuXmv will later need to expand
JjEL guards and action expressions into finite formulas over a frozen model, so the usable subset
of JjEL must be known.

This discovery measures how far the current evaluator is from that, without changing it.

## What to find out (COSA)

1. **Entry points.** In `frontend/src/jjel/` (evaluator, `context.ts`, builtins, parser/lexer):
   which function evaluates an expression against a context, its exact signature, and every
   caller in `frontend/src` (validation: `frontend/src/model/validation/validationEvaluator.ts`;
   edges: `frontend/src/utils/edgeExpressionEval.ts`; JjScript `executor/commands/eval.ts`; any
   other). Report which callers build the context themselves and which reuse a shared builder
   (`buildEvalContext` if present on this branch: quote its signature and its optional
   restriction parameter).
2. **Context shape.** What a context contains: roots (`self`, `instances`, class shells, named
   instances, ambiguity map), how the model is exposed (L proxies, raw D objects, both), whether
   an expression can write through the context (proxy setters, `$attr.value`) or only read.
   State precisely whether a **read-only** exposure of the model already exists or would have to
   be constructed, and at what boundary (proxy layer, context builder, evaluator).
3. **Additional roots.** Whether a caller can add roots (a `state` object, an `event` object)
   without touching the evaluator: is the context an open record, a typed structure, a closure?
   Quote the type.
4. **Errors and tri-state.** How the evaluator behaves on an absent value, a type mismatch, an
   unknown identifier: throws, returns `null`, returns `undefined`. The validation lane builds a
   tri-state at the rule boundary because "JjEL throws on absent": confirm or refute on the code.
5. **The translatable subset.** Enumerate the language constructs the evaluator supports
   (from the parser's grammar and the builtins directories: `strings.ts`, `dates.ts`,
   `collections.ts`, `numbers.ts`, others). Classify each as: (a) finite-expandable over a frozen
   model (navigation, quantifiers over model collections, boolean/arithmetic on bounded ints,
   enum comparison); (b) expressible in nuXmv only with restrictions (integers without bounds,
   `case`-like conditionals); (c) not expressible (strings in state, dates, variable-size
   collections in state, function calls with side effects). This is a census, not a design.
6. **Lexer situation.** The known lexer issue (keywords after a dot; `true`/`false`/`null` as the
   only silent case) and whether JjEL and JjTL share a reserved-names list. One paragraph, with
   paths; do not fix anything.

Then, for step 2 of the plan (evaluation context with three roots and read-only model): which
files would be touched, what it builds on, what it would break, what is unknown.

## Where (DOVE)

Report: `docs/discovery/discovery_2026-09-13_jjel_eval_context.md`. Create the file.
Log entry: `docs/claude-code-log.md`, newest-first, right under the header line.

## How (COME)

- Read whole files before citing them. Cite identifiers exactly; quote the grep hit for any
  assertion about a name. Report zero-hit searches; they are findings.
- Use `grep -r` / `ugrep --ignore-files` across `frontend/src` for the evaluator's exported
  names to find every caller.
- No code changes, no `git add` of code, no branch switch. The working tree is on
  `validation-skeleton` with two dirty files of another lane (`ValidationRulesModal.tsx/.scss`):
  do not touch them. The only files written are the report and the log entry; commit them with
  a `docs:` message.
- Keep the report factual: measured (path and lines), deduced, open questions for Alfonso.

## Hard stop

Stop after the report and the log entry are committed. Do not draft implementation.

## References

- `CLAUDE.md`, `docs/PROTOCOL.md`, prior reports in `docs/discovery/`, log format in
  `docs/claude-code-log.md`.
- `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` for how the validation lane
  uses the evaluator (tri-state, `buildEvalContext` restriction).
