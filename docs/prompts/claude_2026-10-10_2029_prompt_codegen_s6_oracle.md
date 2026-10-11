# Code generation S6: the oracle against the simulator, and two lecture examples

Prompt-ID: P-2026-10-10-2029
Chat: C-2026-10-10-0046
Lane: full (new oracle module over the simulator's run and the S4 runner; two example template sets; a light visual
check on the examples). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-10-0945, P-2026-10-10-0950, P-2026-10-10-0901
Status: eseguito 2026-10-10 · lane codegen-oracle · code a40c39948 · log dd75987f5 · tsc 14 = base, vitest codegen + simulation 968 (932 + 36), build exit 0, check:codegen-lazy green, probe 29/29, mutation bench 14/14 · visual check passata 2026-10-11 (RC-23 by the chat on 4 crops, GO by Alfonso 10:48); follow-ups: oracle button in the panel, readable names in generated code, importable example projects (ticket)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-oracle`, branch `codegen-oracle`, cut from the trunk tip that carries S1..S5; the branch
carries the docs commit adding this prompt. `frontend/node_modules` symlinked (P14). Before anything else: `pwd`,
branch, `git log -1`, a clean `git status`, and `frontend/src/codegen/engine/generate.ts`,
`frontend/src/codegen/runner/runner.ts`, `frontend/src/codegen/ui/CodePanel.tsx` present. Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-2029 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Contract: spec `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` §8, and **R-GEN-11** (amends R-GEN-8) and
**R-GEN-15** in `docs/decisions.md`. Evidence: `docs/discovery/discovery_2026-10-10_code_generation_pilot.md` §G
(all), §I.4 (row S6). Read the log entries of S2, S3, S4, S5 in `docs/log-inbox/codegen-*.md` first.

In short:
- The generated program of a state-based language exports `initial()`, `step(state, event, selector, inputs)` and
  `observe(state)`. `step` returns `{kind: 'fired' | 'halted' | 'discard' | 'quiescence' | 'inadmissible', next,
  reason?}`.
- A scenario is `ScenarioRecord {name, steps: ScenarioStep[], expect?}` with steps `{event, selector, kind,
  inputs?}` (`frontend/src/model/simulation/scenarioCodec.ts:54-72`); elements are named by id.
- The simulator's past configurations are recoverable with `configAt(run, n)`
  (`frontend/src/components/editor-v2/sim/simRunState.ts:320`); the configuration is `SimState {marking, attrs,
  presentation, derived?}` (`model/simulation/netTypes.ts:98-107`); `step` is `model/simulation/netStep.ts:264`.
- `expect` is a single predicate on the final configuration; it defines no equality. The oracle compares, at every
  step, the `kind` and `observe(next)` against the same projection of the simulator's configuration; `expect`
  stays the simulator's final check.
- `observe` is canonical: sorted non-zero marking, semantic attributes, derived values; presentation (`node.[x]`)
  excluded.
- The JS printer of S4 (`codegen/target/js/printer.ts`) prints guards and actions with the evaluator's semantics;
  its differential test is the guard on that.
- The runner (S4) loads one module and runs a sequence of calls; S5 wired `buildEvalContext` in the panel. A lane
  `P-2026-10-10-2027` (branch `codegen-fix`) is changing `runner/*` and `ui/CodePanel.*` in parallel: do not touch
  those files.

## WHAT

1. **Tests first**, run on the base commit to record that they fail.
   - The projection: `observe` on a hand-built `SimState` (marking order, zero tokens dropped, presentation absent).
   - The comparison: identical traces pass; a trace that differs in `kind` at step k, or in one attribute at step k,
     reports exactly step k, the transition fired there, and (when given) the fragment origin that generated that
     transition's code.
   - End to end, in node, without a browser: for each lecture example, generate the program with `generate`, run it
     with the runner's in-process path used by S4's tests (or `new Function` on the module text if that is what S4's
     tests use; say which), replay a recorded scenario in the simulator core, and compare: it passes. Then mutate the
     generated program (swap the target of one transition) and the oracle reports the divergence at the expected
     step and transition.
2. **Module** `frontend/src/codegen/oracle/{observe,oracle}.ts`, pure, no React: `observeSim(state)`, the canonical
   projection; `compareTraces(simSteps, genSteps)` returning `{ok: true} | {ok: false, step, kind, expected, actual,
   transitionId?, origin?}`; `runOracle(...)` that drives the simulator core over a scenario and the generated
   program over the same `(event, selector, inputs)` sequence. Reuse simulator core functions by import; do not copy
   them, and do not import from `components/` (if `configAt` or the replay helper live only under `components/`,
   rebuild the minimal replay from `netStep` and say so).
3. **Lecture examples** under `frontend/src/codegen/examples/`:
   - `turnstile`: the state machine the S2/S3 tests use (coin, push), with a template set that generates a
     JavaScript module exporting `initial`, `step`, `observe` and `main`, guards and actions printed by the S4 printer;
     a recorded scenario of at least six steps including one discard.
   - `petri-producer-consumer` (or the smallest Petri net in the simulator fixtures): a template set over the STC
     roles (`stc.net` for places and transitions), generating the same three exports; a scenario of at least six
     steps, including a choice resolved by `selector`.
   Each example is a JSON fixture (metamodel with `genTemplates` in `_state`, model, scenario) plus a short README
   in English that a student can follow: what the templates do, how to run «Generate» and «Run», how to run the
   oracle. The two template sets must be written against roles (R-GEN-7), so that the same set applies to every
   metamodel bound to the same STC; say in the README which roles each uses.
4. **Panel hook, minimal**: none in this slice. The oracle is callable from tests and from a dev probe; the panel
   button is a later slice. Record this in the log entry.
5. **Probe** `frontend/scripts/probe/codegen-oracle.ts` on a free port between 3080 and 3099 (never 3001): load each
   example project, enable the setting, generate, run the oracle through a dev-only hook exposed only when the
   setting is on, assert pass; then the mutated program, assert the reported step. Crops of the two examples in the
   Code panel (Output tab after Generate), light theme, into the lane folder's `crops/`.
6. **Gates**: `npx tsc --noEmit` (same set as base), `src/codegen` and `src/model/simulation` suites (base counts plus
   new), `npm run build`, `npm run check:codegen-lazy` (the oracle must live in the lazy chunk), the probe. Mutation
   bench (P11), in the commit body: projection keeps presentation; projection keeps zero-token places; comparison
   ignores `kind`; first divergence reported one step late. Survivors are reported.
7. **Commits**: one `feat(codegen): …` commit with module, tests, examples and probe; then the log entry with the
   `log-entry` skill into `docs/log-inbox/codegen-oracle.md` in a docs commit. Stop with `Outcome: hard-stop` after
   the crops. No merge.

## DOVE

`frontend/src/codegen/oracle/{observe,oracle}.ts` and `frontend/src/codegen/oracle/__tests__/*.test.ts`,
`frontend/src/codegen/examples/**` (fixtures and READMEs), `frontend/scripts/probe/codegen-oracle.ts`,
`docs/log-inbox/codegen-oracle.md`. A dev-only hook for the probe may add at most one guarded line in a file under
`frontend/src/codegen/ui/` that is not `CodePanel.tsx` or `CodePanel.scss`; if none fits, expose the hook from the
oracle module itself on `window` behind the setting.

## NON FARE

- No edit to `frontend/src/codegen/runner/`, `frontend/src/codegen/ui/CodePanel.*` (lane P-2026-10-10-2027), the
  engine, the printer, `stcAccess.ts`, `frontend/src/jjel/`, or any file under `frontend/src/model/simulation/` or
  `components/editor-v2/sim/`. A gap there stops the lane with `Outcome: question` and a `Recommended:` line.
- No change to scenario files or the simulator's `expect` semantics.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §7, §8; R-GEN-7, R-GEN-11, R-GEN-15; discovery §G, §I.4.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` (step, kinds, marking).
- R-SIM-139 (scenarios) in `docs/decisions.md`.
- `CLAUDE.md` §5, §21; `docs/PROTOCOL.md` P8, P9, P11, P13, P14, P16.
