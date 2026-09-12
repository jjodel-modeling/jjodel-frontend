# Prompt — Discovery: the simulation engine as it stands (read-only)

**Date**: 2026-09-13 00:30
**Type**: discovery (Phase 1 of two-phase). No code changes.
**Lane**: simulation engine, computational model. Independent of `validation-skeleton` work.

## Context

Alfonso and the project chat have settled the computational model of the simulation engine.
This discovery maps that design onto the code as it exists today, before any implementation
prompt is written. Nothing here is to be implemented; the outcome is a report.

The design, in short (read it to judge fit, not to build it):

- A **configuration** is a triple (model, state, current event). The model is frozen during
  execution; only the state changes.
- The **state** is owned by the engine. Its main component is a **marking**: a map from
  structural elements (selected through the roles of the semantic type class, STC) to values
  of a declared finite domain (boolean for flowcharts and state machines, bounded naturals for
  Petri nets). Further **extended components** (counters, flags) are declared with name,
  domain and indexing (per element of a role, or global).
- A **step** is a labelled transition between configurations. Its two **inputs** are the
  current event (possibly absent) and a **selector** naming the edge that fires (or none).
  A selector is admissible only on an enabled candidate; `none` is admissible only when no
  candidate is enabled (progress constraint). Discarding an unaccepted event is a step with
  unchanged state.
- **Guards** are JJL predicates evaluated read-only on the whole configuration. **Actions**
  are parallel assignments to state components, read on the previous state, written
  simultaneously (nuXmv `next(x) := expr` semantics); order exit, transition, entry inside one
  atomic step.
- The vocabulary is deliberately nuXmv's (FROZENVAR, VAR, IVAR, DEFINE, ASSIGN/TRANS, INVARSPEC).
  Verification is step 6 of the plan; an `.smv` exporter without execution comes earlier.
- The incremental plan has six steps: (1) events, (2) JJL evaluation context, (3) condition and
  assignment roles with the unified cycle (marking, selector, progress), (4) snapshots for
  step-back, (5) trace and scenarios, (6) verification. Petri nets as third language and the
  `.smv` exporter sit between (4) and (5).

## What to find out (COSA)

Produce a faithful picture of the simulation engine today, then assess the distance to the
design above, step by step. Answer at least these questions with file paths and line ranges:

1. **Where the engine lives.** Known entry points: `frontend/src/components/editor-v2/sim/`
   (`SimulationPanel.tsx`, `simRunState.ts`, `simulation-panel.scss`). Find every other file
   that participates: the animation in the abstract-syntax editor and in the concrete-syntax
   editor (`EditorV2.tsx`, `ObjectNode.tsx` are known to mention simulation), the context menu,
   anything in `viewpoint/ir/irTypes.ts`.
2. **The interface / STC and the fitting morphisms.** How the mapping (node metaclass, edge
   metaclass, initial node, final node) is declared and stored: which D/L type holds it, which
   form edits it, whether it is per metamodel or per model, how it is persisted. Note the exact
   identifiers; do not paraphrase names.
3. **The state mechanism.** How the "state attributes" work today: where the single current
   value lives (store slice, D-object, React state), how it is written (through the always-open
   transaction at `reducer.ts:1443` or otherwise), whether it is persisted with the project,
   whether anything exists at element level or only globally, and how the concrete-syntax
   editor reads it for animation. This is the component the design turns into a per-element
   marking: report precisely what a map-valued global value would require.
4. **The step today.** What `simRunState.ts` and the panel do on start, step, stop: how the
   next element is chosen, whether guards exist and how they are evaluated, whether more than
   one candidate can be enabled and what happens then, whether there is any event notion.
5. **The JJL interpreter entry points.** Which function evaluates an expression against a
   context, how the context is built (compare with `buildEvalContext` on the validation lane
   if present on this branch), what roots are available (`self`, others), and whether the
   evaluator can be given a read-only model plus a separate writable state root without
   changing the interpreter.
6. **Interactions with the critical zone.** Whether any of the above touches `useJjomSync.ts`
   or `portDistribution.ts`, or the D-graph adapters in `editor-v2/hooks/`. If yes, name the
   exact call sites.
7. **Branch situation.** The working tree is on `validation-skeleton` with two dirty files of
   another lane (`ValidationRulesModal.tsx/.scss`): do not touch them and do not switch branch.
   Report with `git diff alfonso-frontend-jjtl validation-skeleton --stat -- frontend/src/components/editor-v2/sim/`
   (and the other files you identify) whether the engine files differ between the two branches.

Then, for each of the six steps of the plan: which files would be touched, what existing
identifier or structure it builds on, what it would break, and what is unknown.

## Where (DOVE)

Report: `docs/discovery/discovery_2026-09-13_simulation_engine_state.md`. Create the file.
Log entry: `docs/claude-code-log.md`, newest-first, right under the header line, per the
existing convention.

## How (COME)

- Read whole files before citing them. Cite identifiers exactly as they appear; an assertion
  about a name is valid only if measured on the exact identifier (grep it, quote the hit).
- Use `grep -r` / `ugrep --ignore-files` across `frontend/src` for `simulation`, `simRun`,
  `fitting`, `stateAttr`, `initialNode`, `finalNode` and whatever names you discover in step 1.
  Report zero-hit searches too; they are findings.
- No code changes, no `git add`, no commits of code. The only files written are the report and
  the log entry. Commit those two with a `docs:` message.
- Keep the report factual. Separate three kinds of statements: measured (with path and lines),
  deduced, and open questions for Alfonso.

## Hard stop

Stop after the report and the log entry are committed. Do not draft implementation. The
analysis continues in the project chat, from the saved report.

## References

- `CLAUDE.md` (source of truth for conventions), `docs/PROTOCOL.md`.
- Prior discovery reports in `docs/discovery/` for the expected shape.
- `docs/claude-code-log.md` for the log entry format.
