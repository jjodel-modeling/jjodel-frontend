# Prompt: discovery, the Simulation panel shows why a guard is false or defective

Prompt-ID: P-2026-09-26-1315
Chat: C-2026-09-26-1100
Lane: full (Phase 1 discovery, read-only)
Status: da eseguire

Worktree: `~/jjodel-sim`, branch `simulation-engine`, a fresh session (`/clear`). Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file (subject `docs: add prompt P-2026-09-26-1315, guard outcomes discovery`), its parent is `6aeda5de4` (the Status flip of the merge `4b70b5634`), `git status` empty apart from the three untracked, gitignored `frontend/scripts/smoke/_tmp_b2_*` files. Otherwise stop.

**Phase 1 only: read-only.** No source file is edited, no dependency installed, no commit except the report (step 5). A dev server on 3002 from this tree is allowed for measurements; stop it at the end.

## COSA

The ticket of the B2 lane (`docs/log-inbox/simulation.md`, «the panel shows no guard outcome, false and defect alike», to be scheduled before lane C): today a guard that is `false`, one that does not parse, `node.[x] > 0` (E-NODE) and `p.[visits] > 0` (undeclared) all end in the same silent `Deadlock`. Spec §4.5 and §5.2 want the label to say why an arc is not a candidate. Map what the core already computes, where the panel could show it, and what each option costs, so that the chat can ratify one design. Lane C (declarations, action keys) will multiply the run-time defects, so the design must hold for action defects too.

## DOVE (read)

- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `simBridge.ts`, `simRunState.ts`, `simulation-panel.scss`, and their tests.
- `frontend/src/model/simulation/netStep.ts` (`candidates`, `elseOutcome`, `netRunStatus`, `structuralInputs`), `netTypes.ts` (`Evaluation`, `CandidateSet`, `NetLabel`, `HaltReason`), `guardEvaluator.ts` (`CompiledGuard.defect`, `GuardOutcome`), `guardContext.ts`, `actionEvaluator.ts`.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §4.5, §5.2; `docs/decisions.md` R-SIM-16, R-SIM-29, R-SIM-34..37, R-SIM-39, R-SIM-43; `CLAUDE.md` (design rules: progressive disclosure, fixed sizes, no layout shift, 11px secondary text).

## COME

1. **What exists [R].** For each of the three moments below, say which data the core or the bridge already produces, where it lives, and whether the panel can reach it today without a new export:
   - after Reset: the compile defects of the guards (`CompiledGuard.defect`, today closed inside `makeGuardOracle`) and of the net (`defectsLine`);
   - after a step: `NetLabel.evaluated` (the guards of the configuration **before** the step);
   - in a stopped status, above all `Deadlock`: why no input has a candidate. `netRunStatus` already evaluates `candidates` for ε and every event of the alphabet; say whether that result, per input, can be returned instead of recomputed, and at what cost.
2. **Measure [M].** On 3002, with the B2 fixture (`frontend/scripts/smoke/_tmp_sim3b_scenarios.js`, then `_tmp_b2_scenario.js`), record `candidates(...).evaluated` for ε and each event in `b2net` after two steps, and in one model with events (PEST SM shape or a 3b scenario), with the console snippet of the B2 report. Give the raw outcomes (kinds and details) the panel would have to render, including `else` and `inhibited`.
3. **Options.** At least these three, each with the files it touches, the exported interfaces it changes (`SimRun`, `InputPress`, a new bridge text function), the tests it needs, and what it shows in the four cases of the ticket:
   - A: a «Guards» line after Reset listing the compile defects of the guards, like `defectsLine`;
   - B: under «Last step», the evaluated guards of that step (`t1: false`, `t2: defect (E-NODE …)`), truncated like `defectsLine`;
   - C: when the status is `Deadlock` (or `Running` with an input that has no candidate), a «Why» line per input built from the evaluation `netRunStatus` already runs.
   Say which combination covers the four cases with the least surface, and how it extends to an `action-defect` halt (already in `haltMessage`) and to lane C. Respect R-SIM-36 (the panel never reads its lines from the version) and the no-layout-shift rule: say how each option keeps the panel's height stable or where it grows.
4. **Risks and questions.** The cost of evaluating every input on every render (the panel re-renders on the sim version); guard texts longer than the panel; names of transitions without a name (`…R_49`); Basic/Advanced disclosure. Numbered questions for Alfonso, each with your recommendation.
5. **Report, mandatory.** Save it as `docs/discovery/discovery_2026-09-26_sim_guard_outcomes.md` (objective, files read with full paths, findings marked [R] read or [M] measured, options, risks, questions). Commit it alone, pathspec after `--`, subject `docs: discovery of the guard outcomes in the panel (P-2026-09-26-1315)`, `Model:` trailer. No log entry and no Status flip in Phase 1 (P13): both come with Phase 2.
6. **Hard stop.** Closing report opening with `[P-2026-09-26-1315 · session <id>]`: the report sha, the recommended option in two lines, the questions. Stop the dev server if you started one. Wait for Phase 2 from chat.

Never: an edit to a source file, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- The B2 lane: prompt `claude_2026-09-26_1105_fase2_state_operator_b2.md`, code `81373fab0`, closure `61c5b98a0` and its ticket; merge `4b70b5634`.
- `docs/discovery/discovery_2026-09-25_state_operator_core_types.md` §7.3, §7.4.
- `docs/PROTOCOL.md` P13.
