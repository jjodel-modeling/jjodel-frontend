# Prompt: simulation step 2, the evaluation context

Prompt-ID: P-2026-09-24-1520
Chat: C-2026-09-24-1005
Status: eseguito 2026-09-24 · lane simulation · 80dab51b9

Worktree: `~/jjodel-sim`, branch `simulation-engine`, at `7cb1a716b` plus the commit that adds this file. Do not merge the trunk. Do not work in `~/jjodel-release` or `~/jjodel`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-sim` on `simulation-engine`, stop and say so; never work by absolute path on another worktree.

Parallel lane: `P-2026-09-24-1455` runs on the trunk in `~/jjodel-release` (files `irDefaults.ts`, `VersionFixer.tsx`, `ir.test.ts`). Its session was opened in this folder, but it writes only the trunk. Do not touch those files, and do not remove or change `~/jjodel-release/frontend/node_modules`.

Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID.

## COSA

Step 2 of the six-step plan: the context in which guards and actions will be evaluated. Most of the questions of the 2026-09-13 discovery (`discovery_2026-09-13_jjel_eval_context.md`, §11) are already ratified: R-SIM-14 (pure core in `model/simulation/`, evaluator path B, M snapshot built once per run and deep-frozen), R-SIM-15 (tri-state shared with validation, not copied), R-SIM-18 (roots `self`, `event`, `model`, `node`; state read with `.[x]`; a guard that mentions `node` is a defect). Read them first; they are normative.

What step 2 delivers, all pure and without React: a context builder over the frozen snapshot with the roots of R-SIM-18; a guard evaluator that runs a compiled JjEL expression on a configuration through path B and returns the shared tri-state; a subset checker that walks `JjelExpression` and reports what cannot be translated or is forbidden (including `node` in a guard). The step function does not call any of it yet: guards enter the step at step 3.

Not in this step, do not start: the `.[x]` operator and the lexer change it needs (it belongs to the `Expression` core lane of R-SIM-17); the shape of σ beyond an interface (step 3, which moves the core to a Petri net); actions; any change under `jjel/evaluator/*` or to `buildEvalContext`'s default path.

## DOVE

Phase 1 reads, under `frontend/src/`: `model/simulation/*` (current state after 1850 and 1005), `model/validation/validationEvaluator.ts`, `validationContext.ts`, `validationTypes.ts`; `jjscript/executor/commands/eval.ts` (`buildEvalContext` and its options); `jjel/types/ast.ts`; `jjel/evaluator/` read-only; the IR rule context of editor v2 (`components/editor-v2/viewpoint/ir/`) only to answer item 4. In `docs/`: the 2026-09-13 report above, R-SIM-11..20 in `decisions.md`, spec `claude_spec_2026-09-13_computational_model.md` §5.

Phase 2 is expected to add new files under `model/simulation/` (builder, guard evaluator, subset checker, tests) and possibly export a helper from `model/validation/` for the shared tri-state. Any other file is declared in the report before the GO.

## COME

### Phase 1 (read-only)

1. Re-measure the 2026-09-13 report against today's code: which findings still hold (two evaluator paths, `buildEvalContext` snapshot shape, eager `and`/`or`, silent null on a primitive property, keyword lexing after a dot). One line each, with file and line. Re-run its probe if it is recoverable; if not, say so and measure the four that matter for guards.
2. Propose the builder's signature and the snapshot's lifetime: built once per run over the model and its metamodel, deep-frozen, `event` and the marked view rebuilt per step. Say what `self` is for a guard on a transition and for a node-level expression. State the interface through which σ will enter at step 3, as a type only.
3. Shared tri-state: show exactly which export of `model/validation/` the guard evaluator reuses, and whether reusing it needs a change there. If it does, that is a file outside `model/simulation/`: declare it.
4. **R-SIM-18 check**: in the IR rule context of editor v2, does `node` already mean something? If it collides, report where; the ratified fallback name is `look`. Also check `model` and `event` for collisions with existing roots or builtins on path B.
5. **Open question for Alfonso, the most important one**: eager `and`/`or` (R1 of the old report). The guard idiom `x != null and x.p` throws today. Options: (a) the subset checker rejects the idiom and suggests `implies`/`?.`, leaving the evaluator alone; (b) change the evaluator, which moves validation, JjTL and JjScript results. The chat leans to (a), because (b) is a cross-lane change. Show one concrete guard for each option and recommend. Do not decide.
6. Subset checker: the list of constructs it accepts, rejects, or accepts with a warning, derived from §7 of the old report, as a table. Say which diagnostics go to authoring and which are run-time defects.
7. Test plan with one mutation per rule: frozen snapshot rejects writes; path B has no `now()`; `node` in a guard is rejected; the tri-state matches validation's on the same inputs; absent guard means `true` (R-SIM-17 degenerate case).
8. Baseline gates now: typecheck error set (14 expected), vitest count (4240 expected on this branch), build.

Save the report as `docs/discovery/discovery_2026-09-24_sim_step2_eval_context.md`: objective, files read with full paths, item 1 as a table, findings, risks, open questions for Alfonso (item 5 first), the proposed Phase 2 diff in prose with the file list. Commit it alone, with pathspec, on `simulation-engine`. Hard stop: the phase is not complete until the report is on disk and committed.

### Phase 2 (after GO)

1. Implement what the GO ratifies, pure modules only.
2. Tests per Phase 1 item 7, mutations reported. The existing `step.test.ts` stays byte-identical.
3. Gates: typecheck with the same error set as the baseline, vitest, build, `npm run check:docs`, `npm run check:agents`.
4. No visual check: nothing reaches the UI in this step. Say so in the log entry.
5. One code commit with pathspec, then one docs commit with the entry appended to `docs/log-inbox/simulation.md` and the Status flip of this file per P13. P6 trailer `Model: ...` in both bodies. Subjects end with `(P-2026-09-24-1520)` and stay within 72 characters without the suffix.

Never: `git add .`, `git stash`, merges, commits outside `simulation-engine`, push.

## RIFERIMENTI

- `docs/decisions.md`: R-SIM-11, R-SIM-14, R-SIM-15, R-SIM-17, R-SIM-18, R-SIM-19.
- `docs/discovery/discovery_2026-09-13_jjel_eval_context.md` (§0, §7, §9, §11).
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §5 and §9 step 2.
