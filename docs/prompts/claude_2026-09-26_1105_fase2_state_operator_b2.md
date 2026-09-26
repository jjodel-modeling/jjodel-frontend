# Prompt: Phase 2, wave B2 of the `.[x]` operator: guards read σ, the action evaluator

Prompt-ID: P-2026-09-26-1105
Chat: C-2026-09-26-1100
Lane: full (changed exported interface, more than 3 files)
Status: eseguito 2026-09-26 · lane simulation · 81373fab0 · verifica visiva passata 2026-09-26

Worktree: `~/jjodel-sim`, branch `simulation-engine`, a fresh session (`/clear`). Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file (subject `docs: add the wave B2 prompt of the state operator (P-2026-09-26-1105)`), its parent is `89faeef25` (closure of `P-2026-09-25-1840`), `git status` empty. Otherwise stop.

This lane continues `P-2026-09-25-1445` (discovery `ec68ddb9b`, B1 `1c7a9be76`, A `b14294906`/`066383e24`), whose sessions are closed. Read their closure entries in `docs/log-inbox/simulation.md` (they are also in the merge `2537f9e85`) before starting.

## COSA

Wave B2 of report §7.3, as ratified in R-SIM-39 and R-SIM-43 (read R-SIM-17, R-SIM-18, R-SIM-30, R-SIM-39..43 whole in `docs/decisions.md`). Two things, both pure except one bridge line:

1. **Guards read σ.** The guard oracle hands the state the core already gives it to the JjEL hook of B1 (`EvaluationContext.stateAccess`, type `JjelStateAccess` in `jjel/evaluator/context.ts`), through an adapter that resolves the read-only attributes `marked` and `tokens` (R-SIM-30, R-SIM-43). Guards are parsed with the strict entry of B1: `a b` becomes a `parse-error` defect.
2. **The action evaluator.** A new pure module that compiles `Action` values once per run with `parseAction` and returns the core's `ActionOutcome` (`netTypes.ts`). Tested end to end on the pure core with declarations injected through `compileNet`'s `decls`. **Not wired**: the bridge keeps `actions: NO_SIM_ACTIONS`. The action role keys (`simAction`, `simEntry`, `simExit`, R-SIM-52) and the declarations of state attributes arrive with lane C (R-SIM-39): no bag key is read here.

Until C, in the app a guard can read `x.[marked]` and `x.[tokens]`; any other `x.[a]` is a defect (no attribute is declared yet).

## DOVE

Code (Rule 19, more than five files, authorized by this list):

- `frontend/src/model/simulation/guardContext.ts`: `buildGuardContext` gains an optional fourth parameter, the `JjelStateAccess` it sets on the child context; the adapter from `SimStateAccess` to `JjelStateAccess` (new export, name of your choice after the name check).
- `frontend/src/model/simulation/guardEvaluator.ts`: `compileGuard` uses `parseExpressionStrict`.
- `frontend/src/model/simulation/actionEvaluator.ts` (new): compile, evaluate, the `ActionOracle` factory.
- `frontend/src/components/editor-v2/sim/simBridge.ts`: `makeGuardOracle` passes the state through the adapter (the places come from the compiled net); the header line 24 and the `NO_SIM_ACTIONS` comment say the actions wait for lane C (R-SIM-39), not «the Action lane». Nothing else.

Tests: `frontend/src/model/simulation/__tests__/guardContext.test.ts`, `guardEvaluator.test.ts`, `actionEvaluator.test.ts` (new), `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`.

Out of scope: `netStep.ts`, `netCompile.ts`, `netTypes.ts` (the core already does the parallel assignment, the double assignment, the undeclared attribute and the domain: `netStep.ts` assignment block), the JjEL module (B1 is closed: if the hook or `parseAction` need a change, stop and ask), `subsetChecker.ts`, `SimulationPanel.tsx`, `simRunState.ts`, any bag key, any M2 UI, every critical-zone file.

Name check before writing (`command grep -rn '<name>' frontend/src` must be empty) for every new export and for `actionEvaluator`; one positive control that must match (for example `buildGuardContext`).

## COME

### Rulings for this wave

- **The adapter.** `read(id, attr)`: if `attr` is `marked` or `tokens` (read the names from `STATE_RESERVED.readOnlyAttributes`, never literals), the answer is `isMarked(id)` or `tokens(id)` **only when `id` is a place of the compiled net**; on any other element it is `undefined`, so the evaluator throws «not a state attribute» and the guard is a defect. Otherwise `read` delegates to the `SimStateAccess`. `readPresentation` delegates. A guard never reaches `readPresentation`: `node` in a guard is `E-NODE` at compile time (B1).
- **The guard state.** `makeGuardOracle` uses the `state` argument of the `GuardOracle`; no state is rebuilt in the bridge.
- **Actions, compile.** One compiled action per `Action` text: blank is no action; a `parseAction` error is a compile defect that turns into `{ kind: 'defect' }` when the site is evaluated (the core halts with `action-defect`). No subset check on actions in B2: the static check arrives with C's typed checker (R-SIM-43). A site holds `0..*` actions in order.
- **Actions, context.** The context is `buildGuardContext(snapshot, { transitionId: site.element }, { event }, adapter)`, so `self` is the site element (the place for `entry`/`exit`, the edge or transition for `transition`); a missing handle is a defect. The adapter's `readPresentation` is the one the core built for the site (`stateAccess(cfg.state, site.element)`), so `node.[a]` on the right-hand side reads the site's presentation only.
- **Actions, right-hand side.** Evaluated with diagnostics on the σ the oracle receives (the state before the step, never a state updated by an earlier action of the same step): an exception, an absent identifier (read the diagnostics as `evaluateTriState` does in `model/jjelTriState.ts`, `firstAbsence`), or a value that is not `boolean | number | string` (an object, a collection, `null`) is a defect with a detail that names the action text.
- **Actions, target.** `node.[a]`: the element is `site.element`. Otherwise the object of the `StateAccessExpr` is evaluated on the same context over the frozen M; anything but a model element handle (a primitive, a collection, `null`) is a defect. **Locality (R-SIM-18, R-SIM-43)**: the evaluator reads the declaration from the compiled net's `declared` (element → attribute → declaration): a non-`node` target on a `presentation` attribute is a defect; a `node` target on a `semantic` attribute is a defect. An undeclared target is left to the core, which already halts on it. A read-only target (`marked`, `tokens`) never parses (B1).
- **The oracle.** A factory in `actionEvaluator.ts` builds the `ActionOracle` from the snapshot, the compiled net (`places`, `declared`) and the compiled actions keyed by `ActionSite` (element **and** role: the entry and the exit of the same place are different sites). The key function is exported and tested. A site with no actions returns `{ kind: 'ok', assignments: [] }`.

### Steps

1. Baseline on this commit: `npm run typecheck` (expected exit 2, 14 errors, the §17 set), `npx vitest run` (expected 4772 passed, the same 9 files red at import, 0 failed), `npm run build` (exit 0, 51 warning lines), `check:docs` 4/4, `check:scripts` (the known `_tmp_sim1_verify.ts:186`). State the expected numbers, then record the measured ones.
2. Tests first, red where the feature is missing, one per mutant below at least:
   - guards: `p.[tokens] > 0` and `p.[marked]` on a Petri net follow the marking across steps (candidates change); `t.[tokens]` on a transition is a defect; an undeclared `p.[visits]` is a defect (`exception`), never `false`; `a b` is a `parse-error` defect; every guard test that passes today still passes;
   - `buildGuardContext` without the fourth argument behaves as today (no hook: `.[a]` throws); with it, child scopes (`forall`, lambdas) see the hook;
   - actions: blank, one, several on a site; the swap `a := b`, `b := a` on one site through `step()` gives the swap; locality both ways; right-hand side object, collection, `null`, absent identifier; target path to a collection and to `null`; a parse error halts with `action-defect`; `entry` and `exit` of the same place keep their own actions;
   - **Ex1 and Ex2** of `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` §5 (the worked examples, there as TypeScript oracles), now as JjEL text end to end on the pure core, with the declarations passed as `decls` to `compileNet` (Ex1: global `x`, semantic, range 0..2, initial 0; Ex2: globals `coins` and `last`). Ex1: the action `model.[x] := model.[x] + 1` on `e2`, the guard `model.[x] < 2` on `e3`, `else` on `e4`; the candidate sets and the `Terminated` of the report, the labels carrying the assignments. Ex2: the step on `tCoin` gives `coins = 1`, `last = 0` (the parallel reading of the report, with `last := model.[coins]` on the entry of `Unlocked`);
   - `simBridge`: `startRun` on a Petri fixture with the guard `p.[tokens] < 2` on a transition: after the firings that put 2 tokens on `p`, the transition leaves the candidates and the label reports the guard `false`; the run's action oracle is still `NO_SIM_ACTIONS`.
3. Implement in the order adapter → `buildGuardContext` → strict guard parse → bridge → action evaluator. Minimal diffs; no refactor of adjacent code; no rename.
4. Mutation bench, each mutant applied, run, reverted, table in the code commit body with the killing test; a survivor is a stop, do not weaken the mutant:
   1. `makeGuardOracle` still drops `state`: `p.[tokens] > 0` is a defect.
   2. The adapter maps `marked` to `read()`: `x.[marked]` is a defect.
   3. An undeclared attribute reads `null` instead of a defect.
   4. Actions evaluated sequentially: the swap does not swap.
   5. A non-`node` target accepted on a presentation attribute.
   6. A `node` target accepted on a semantic attribute.
   7. A right-hand side that yields an object or a collection is accepted.
   8. A target path that yields a collection or `null` is accepted.
   9. An absent identifier on the right-hand side yields a `null` assignment instead of a defect.
   10. `compileGuard` keeps the non-strict parse: `a b` is not a defect.
   11. The adapter answers `tokens`/`marked` on any element: `t.[tokens]` on a transition reads 0.
   12. The site key ignores the role: the entry actions of a place run on its exit.
5. Gates on the code commit: typecheck exit 2, 14 errors, set identical to the baseline; vitest the baseline plus the new tests (state the delta before the run; report §7.3 estimated about +45), 0 failed, the same 9 files red at import; build exit 0, warnings as the baseline; `check:docs` 4/4; `check:scripts` as the baseline. `git diff --stat` outside DOVE empty.
6. Code commit, pathspec after `--`, subject `feat(sim): guards read state, pure action evaluator (P-2026-09-26-1105)` (within §6.2 without the suffix), body with the baseline, the gates, the mutant table, `Model:` trailer.
7. **Visual check, hard stop.** Start a dev server on 3002 from this tree (port free first). Prepare, and name in the report, a Petri net (from the models of the 3b scenarios, `_tmp_sim3b_scenarios.js`, or a new one: say which) with `p1 → t1 → p2`, at least 3 tokens on `p1`, k at least 3, and the guard `p2.[tokens] < 2` on `t1`. Give Alfonso the steps: (1) Reset, fire `t1` twice: `p2` holds 2 tokens; (2) `t1` is no longer a candidate although `p1` still holds tokens, the status is `Deadlock`, and the label or the candidate line says the guard is `false` (the input buttons are structural, R-SIM-16: say in the steps that they may stay enabled, and what pressing one then does); (3) change the guard to `p2.[marked]` and Reset: `t1` needs a token on `p2` first; (4) the guard `node.[x] > 0` shows its defect after Reset, and so does `p2.[visits] > 0`; (5) a model whose guards do not use `.[x]` behaves as before (one of the six 3b scenarios). Take your own screenshots of each step before handing over; the GO is Alfonso's. Wait for his answer.
8. After the GO, one closure commit (P13, RC-17): the entry in `docs/log-inbox/simulation.md` (CLAUDE.md §21.2; Layer Impact Report: `produced`, the B2 draft of report §8 confirmed or corrected; `Smoke visivo:` Alfonso's answer), and the Status of this file flipped to `eseguito 2026-09-26 · lane simulation · <code sha>` plus the visual outcome. The ruling on `tokens`/`marked` outside places goes in the entry's Notes as an interpretation under test.
9. Closing report opening with `[P-2026-09-26-1105 · session <id>]`: the two shas, the gates, the mutant table summary, any deviation. Then stop: the merge toward the trunk gets its own prompt from chat.

Stop and ask if: the hook or `parseAction` of B1 need a change; the core needs a change to take an action's outcome; a guard test that passes today turns red for a reason other than the strict parse; the Ex1 test cannot be built without touching `netCompile.ts`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of the `node_modules` symlink, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_state_operator_core_types.md` §5.1-§5.3, §7.3, §7.4, §8 (B2 draft).
- `docs/decisions.md` R-SIM-16..19, R-SIM-30, R-SIM-39..43, R-SIM-52; RC-3, RC-17.
- `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` §5 (Ex1, Ex2).
- `docs/PROTOCOL.md` P13, P14.
