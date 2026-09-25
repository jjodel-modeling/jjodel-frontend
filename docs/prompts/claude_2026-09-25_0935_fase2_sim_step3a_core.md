# Prompt P-2026-09-25-0935, Phase 2: simulation step 3a, the pure Petri core

Prompt-ID: P-2026-09-25-0935 (Phase 2 of `claude_2026-09-25_0935_prompt_sim_step3_discovery.md`)
Chat: C-2026-09-25-1030
Lane: full (more than 3 files)
Status: da eseguire
Worktree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `e4506e78f` or later (the ratification commit on top of the report commit `de21a2c93`).
Report this phase answers: `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` (`de21a2c93`).
Protocollo: docs/PROTOCOL.md, clausole P1..P15 applicabili.
Every message opens with `[P-2026-09-25-0935 · session <id>]`.

Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-sim` on `simulation-engine`, stop and say so. Do not touch `~/jjodel`, `~/jjodel-release`, `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel-harness`. The untracked `frontend/scripts/smoke/_tmp_sim1_verify.ts` is Alfonso's: leave it.

## Decisions

The report holds. Alfonso ratified the thirteen answers of its §1 as recommended, written as **R-SIM-27..33** in `docs/decisions.md` (`e4506e78f`, section «Ratifiche 2026-09-25: passo 3, punti aperti e compilazione»), with spec §3.3 and §3.4 amended in the same commit. Read that section before any code. What binds 3a:

1. Termination (R-SIM-27): `terminated(M)` iff M is non-empty and every place with a token is in F; a terminated configuration has no candidates. F is the set of places that are kind-of `simTerminal` (ancestry, R-SIM-8).
2. `simTerminal` is optional (R-SIM-28): `NetStc.terminal` is optional from birth and `CompiledNet.final` is `null` when it is unset. The old `stcFromRoles` and `ENGINE_ROLE_KEYS` are not touched in 3a; they change in 3b.
3. Five statuses (R-SIM-29): `NetRunStatus` = `'Not started' | 'Running' | 'Terminated' | 'Deadlock' | 'Halted'`, computed on candidates with guards and inhibitors evaluated; `Halted` takes precedence and is driven by the halt reason the caller passes. `structuralInputs` stays structural (preset enabled and trigger, guards not evaluated, R-SIM-16), empty when terminated.
4. Marking accessor (R-SIM-30): `SimStateAccess` = `SimStateReader` of `guardContext.ts` plus `tokens(id)`. An arc of role `simInhibitorArc` from place p to transition t with weight w compiles into `NetTransition.inhibitors` and is checked as `tokens(p) < w`. The `.[x]` surface is out of scope.
5. Compilation rules (R-SIM-31) and the table of report §5.3: literal `else` in the guard feature (trimmed text equal to `else`), guard = not (g1 or ... or gn) over its siblings (same preset, same triggers), a defective sibling makes the `else` defective, two `else` siblings are the defect `else-twice`; a target-less, deleted or non-place target is a compile defect, never a candidate; `simFork`/`simJoin` nodes are not places and their edges fuse into one transition with recorded origins; an edge between two pseudo-nodes is `pseudo-chain`; the Petri shape is recognised by `simArc` being set.
6. Keys (R-SIM-32): `simBound` (k, default 1), `simInitialMarking`, `simFork`, `simJoin`, `simGuard`, `simArc`, `simArcSource`, `simArcTarget`, `simArcWeight`, `simInhibitorArc`, plus `simSource` (R-SIM-10). Provisional until 3b. The 3a compiler covers both the control-flow shape and the Petri shape.
7. Scope (R-SIM-33): 3a only. The new core sits beside `stepFlowchartBoolean`, unwired; nothing under `sim/` imports it.
8. Exceptions granted for this lane: six new files, above the five of rule 19; zero modified files, so rule 11 (changed exported interfaces) does not apply. No critical-zone file, so no Layer Impact Report.

## COSA

Implement wave 3a as report §10.2: the pure core of the Petri engine with its compiler, step, status and tests. The declarations of report §5.1 and §5.2 are the starting point. They are hypotheses: adjust a name or a field only when typecheck or a name collision forces it, and list every such change in the closing report. Effects (§4.4 of the spec, report §5.2): M' = M − pre + post, the «unsafe» check on M' against k with nothing applied on failure, then every action site read on σ (the state before the step) and applied together; double assignment and a value outside its declared domain halt. Quiescence returns the input configuration object itself; a discard consumes the event; `next.event` is always `null`. Actions in 3a arrive through the injected `ActionOracle` only (no JjEL actions: the Action lane is separate).

## DOVE

New files, all under `frontend/src/model/simulation/`:

1. `netTypes.ts`: the declarations of report §5.1 and §5.2, `NetStc`, `NetModelView extends SimModelView` with `references(objectId, featureId)` and `values(objectId, featureId)` read by pointer.
2. `netCompile.ts`: `netStcFromRoles`, `compileNet`.
3. `netStep.ts`: `stateAccess`, `tokens`, `isMarked`, `terminated`, `candidates`, `admissible`, `step`, `netRunStatus`, `structuralInputs`.
4. `__tests__/netCompile.test.ts`
5. `__tests__/netStep.test.ts`
6. `__tests__/netParity.test.ts`

Imports allowed into the three source files: `./types` (types only), `./isKindOf`, `./guardContext` and `./guardEvaluator` (types only). No React, no store, no L proxies, no `jjel/*` import in source files (R-SIM-14). Tests may use the real `compileGuard`/`evaluateGuard` over a synthetic snapshot, as step 2's tests do.

Not touched, byte-identical at the end: `step.ts`, `types.ts`, `stcFromRoles.ts`, `isKindOf.ts`, `objectSlots.ts`, `guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts`, their tests, everything under `components/editor-v2/sim/`, `jjel/*`, `ObjectNode.tsx`, `viewpoint/ir/*`.

## COME

1. Re-read the real files before writing (the report is evidence, not reference): the eight files of `model/simulation/`, `__tests__/step.test.ts`, `__tests__/events.test.ts`, and R-SIM-7..33.
2. Before creating each exported name, confirm it is still free with `command grep -rnw <name> src scripts` from `frontend/`, with the positive control of report §10.1 (`stepFlowchartBoolean`).
3. Write the core, then the tests. Every row of report §10.3 becomes at least one test that executes the public functions (P11), every «nothing happens» with its control (P12). The three worked examples of report §5.4 (Ex1 decision block with `else`, Ex2 turnstile with parallel assignment, Ex3 net with parallel fork, AND-join and inhibitor, in both its Petri and its fork/join form) are tests as computed there, including the k = 1 unsafe variant of Ex3.
4. `netParity.test.ts`: today's `stepFlowchartBoolean` and the new `step` on the committed fixtures of `step.test.ts` and `events.test.ts`. On every deterministic trace the derived `isMarked` equals today's `Set` after each step. Each of the 20 differences of report §7 is pinned by name as a decision, citing the R-SIM that changes it (for the termination rows, R-SIM-27; for status rows, R-SIM-29; for dangling edges, R-SIM-31). Import the fixtures by copying them into the parity file if they are not exported; do not modify the old test files.
5. Mutation bench: for each row of report §10.3 apply the named mutation to the source, run the suite, record that at least one test turns red, revert. Report the table (rule, mutation, red tests) in the closing report and in the body of the code commit. A mutation that stays green is a stop: say which and wait.
6. Gates from `frontend/`, with the existing `node_modules` symlink: `npm run typecheck` (14, the §17 set, unchanged), `npx vitest run` (4530 plus the new tests, the same 9 files red at import), `npm run build` (exit 0), `npm run check:docs`, `npm run check:scripts` (1 hit, `_tmp_sim1_verify.ts:186`, not a stop).
7. Code commit, pathspec after `--`, the six files only: `feat(sim): Petri core of the simulator, unwired (P-2026-09-25-0935)`, with the mutation table in the body and the `Model:` trailer.
8. Closure (P13, lane without visual check): flip this file's Status to `Status: eseguito 2026-09-25 · lane sim-step3a · <code sha>`, write the entry in `docs/log-inbox/simulation.md` by the rules of the active log, and commit both in one docs commit, pathspec after `--`: `docs: close simulation step 3a (P-2026-09-25-0935)`. `git status` empty at the end.
9. Report in chat, opening with `[P-2026-09-25-0935 · session <id>]`: files, test count, the mutation table, gates, every deviation from the report's declarations, and anything 3b must know. Then stop. Do not start 3b.

Stop and ask, before acting, if: an existing file needs a change; the typecheck count moves; a rule of R-SIM-27..33 contradicts a declaration of the report in a way that is not a rename; a parity trace differs outside the 20 named rows.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, commits outside `simulation-engine`, push, edits to the files listed as not touched.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md`, §5, §7, §10.
- `docs/decisions.md` R-SIM-7..33; memo `docs/ratifiche/claude_ratifiche_2026-09-25_rsim21_nucleo_petri.md`.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §3, §4, §9.3 (amended 2026-09-25).
- `docs/prompts/claude_2026-09-24_1520_prompt_sim_step2_eval_context.md` (the tests of step 2 as pattern).
- `CLAUDE.md` §3.2, §17; `docs/PROTOCOL.md` P11, P12, P13, P14.
