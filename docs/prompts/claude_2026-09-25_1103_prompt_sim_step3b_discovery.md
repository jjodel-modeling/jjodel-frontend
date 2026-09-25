# Prompt: simulation step 3b, the panel and the run-state on the Petri core (discovery)

Prompt-ID: P-2026-09-25-1103
Chat: C-2026-09-25-1030
Lane: full (a changed exported interface; more than 3 files)
Status: eseguito 2026-09-25 · lane sim-step3b-discovery · b9fd3a1f7
Worktree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `2b8475d24` or later (wave 3a closed: `79ee9fba3` code, `0fc65866a` closure). Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-sim` on `simulation-engine`, stop and say so; never work by absolute path on another worktree. Do not touch `~/jjodel`, `~/jjodel-release`, `~/jjodel-open` (the open-path lane `P-2026-09-25-0030` may be closing there, its dev server on 3003), `~/jjodel-gate`, `~/jjodel-harness`. The untracked `frontend/scripts/smoke/_tmp_sim1_verify.ts` is Alfonso's: leave it.

Two-phase. **This prompt covers Phase 1 only**: read-only, it ends with a saved and committed report and a hard stop. Phase 2 is written in chat from the report and reaches this session as a GO that opens with this ID. This lane changes the source of `ReadCtx.isMarked` (through `isSimActive`), so the report carries the **definitive Layer Impact Report** for Phase 2, starting from the draft in §11 of the step 3 report.

## COSA

Wave 3b of step 3 (R-SIM-33): the panel and the run-state move to the Petri core of wave 3a, and the old step is deleted in the same lane. Binding: R-SIM-7..33 in `docs/decisions.md`, in particular R-SIM-13 (a model edit interrupts the run), R-SIM-16 (structural buttons), R-SIM-27..33 (termination, optional `simTerminal`, five statuses, compilation rules, provisional keys that become definitive with this lane's code commit). The evidence base is `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` (§5.5, §6, §8, §10.1 wave 3b, §11) and the 3a log entry in `docs/log-inbox/simulation.md` with its Ticket paragraph («What 3b needs to know»). Do not repeat what those documents already establish: re-read the real files, confirm or correct them, and fill the gaps below.

The phase answers six questions:

1. **The bridge.** Where and when the panel builds the run: `buildEvalContext` with `targetMetamodelId` set to the model's metamodel (the defect of report §8.1 must not reach the simulator), `freezeSnapshot`, `compileNet`, the guard oracle from `compileGuard` and `buildGuardContext`, an action oracle that returns no assignments until the Action lane. Which adapter implements `NetModelView` (`references`, `values`) over `objectSlots.ts`. File:line for every call site, and the cost of a Reset measured on the turnstile of step 1.
2. **The run-state.** The new shape of `simRunState.ts`: per model the configuration, the compiled net, the halt reason; an entry kept while the marking is empty; `isSimActive(id)` as `tokens > 0`; one version bump per committed step (R-MK-6). Which exported names keep their signature (`isSimActive`, `getSimActiveIds`, `simReset`, `simClear`, `getSimVersion`, `useSimVersion`) and which change (`simApplyStep` and every other export: list them with every importer, grep with a positive control).
3. **The R-SIM-13 interruption.** How the run notices a model edit and stops with a declaration, using the signature pattern of `buildValidationSignature` (`validationFreshness.ts`) or a better one if measured. What the panel shows after the interruption.
4. **The panel.** The five statuses and the halt message (reason in words, per `HaltReason` kind); the buttons disabled in `Terminated`, `Deadlock` and `Halted` (R-SIM-29); the choice among several candidates. For the choice, propose the minimum that R-SIM-25 allows (external choice is a selector policy): a list of candidates in the panel when a step has more than one, labelled from `NetTransition.origin`, with or without a «random» policy. Say what each option costs and recommend one. A sketch of the panel states (text, not images) for: not started, running with one candidate, running with a choice, terminated, deadlock, halted, interrupted.
5. **The M2 face.** How the configuration side of the panel (opened on a metamodel) exposes the keys of R-SIM-32 and the optional `simTerminal`: which keys the user sets, grouped by shape (control flow, Petri), what `missingEngineRoles` requires per shape, how the overlap sorts of `stcFromRoles.ts` extend to fork, join and arc roles. `simRoleStatus.test.ts:48` pins that `missingEngineRoles` and the old `stcFromRoles` agree: say what replaces that parity.
6. **Deletion and tests.** Every consumer of `stepFlowchartBoolean`, `applyStepLabel`, `simApplyStep`, `runStatus`, `enabledEvents`, `epsilonEnabled`, `SimConfiguration`, `StepLabel`, `SimRunStatus`, `stcFromRoles`, `StcRoles` (grep with positive control); which tests are deleted, which rewritten, and how `netParity.test.ts` changes once the old step is gone (the parity oracle must survive in some form: propose it).

Out of scope: any code edit; wave 3c (candidates on the canvas, the second channel beside `'mark'`); the `.[x]` operator; the `Expression` and `Action` types; the `.smv` exporter; the validation defect of `targetMetamodelId` (a separate ticket); `ObjectNode.tsx` and `viewpoint/ir/*`, which must need no diff (report §4.3; confirm it).

## DOVE

Read in full: `frontend/src/components/editor-v2/sim/` (`SimulationPanel.tsx`, `simRunState.ts`, `simRoleStatus.ts`, `simulation-panel.scss`, their tests), `frontend/src/model/simulation/` (all files, the 3a ones included, and their tests), `editor-v2/problems/validationFreshness.ts`, the callers of `buildEvalContext` in `jjscript/executor/`, `docs/decisions.md` R-SIM-7..33, the step 3 report, the 3a log entry. Read by grep: every importer of the names in question 2 and question 6.

## COME

1. Tables, with file:line and verbatim quotes, for questions 1, 2 and 6.
2. Measure, do not assume: start a dev server of this worktree on a free port (3002 as in Phase 1 of step 3, own `cacheDir` in the scratchpad so that `~/jjodel/frontend/node_modules/.vite` is not rewritten, declare the port), rebuild the turnstile of step 1, and measure the cost of the bridge at Reset (build context, freeze, compile) with the current code paths called from the page. Stop the server at the end.
3. The Phase 2 proposal in prose: files touched with the count (expected around ten, over the five of rule 19, to be listed for the GO), the changed exported interfaces (rule 11, to be authorized in the GO), the order of commits if more than one, a test plan with one mutation per rule (bridge passes `targetMetamodelId`; run-state keeps a run with an empty marking; `isSimActive` as `tokens > 0`; one version bump per step; interruption on model edit; buttons disabled in the three stop statuses; the halt message shown and cleared by Reset; the candidate choice fires the chosen transition; a role configuration without `simTerminal` can run), and the smoke and visual checks Alfonso runs on 3001 after the code commit (turnstile of step 1, a flowchart with a decision block and `else`, a small net with a parallel fork, an AND-join and an inhibitor, a run halted by «unsafe»).
4. The definitive Layer Impact Report for Phase 2.
5. Baseline gates now, from `frontend/`: `npm run typecheck` (14, the §17 set), `npx vitest run` (4623 expected, the 9 files red at import), `npm run build`, `npm run check:docs`, `npm run check:scripts` (1 hit expected, `_tmp_sim1_verify.ts:186`).

**Discovery report (mandatory).** Save it as `docs/discovery/discovery_2026-09-25_sim_step3b_panel.md` (path `docs/discovery/`, naming `discovery_<YYYY-MM-DD>_<description>.md`). Content: objective, hypotheses and verdicts, files read with full paths, findings with file:line and verbatim quotes, **open questions for Alfonso first** (each with a recommendation), dependencies and risks, the Phase 2 proposal with its test plan and visual checks, the Layer Impact Report. Commit it alone on `simulation-engine`, pathspec after `--`, subject `docs: discovery on simulation step 3b, panel and run-state (P-2026-09-25-1103)`, `Model:` trailer. **Hard stop**: the phase is not complete until the report is on disk and committed. Then report in chat, opening with `[P-2026-09-25-1103 · session <id>]`, and wait. No log entry in Phase 1. `git status` empty at the end.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, commits outside `simulation-engine`, push, any edit to a source file.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md` (§4.3, §5.5, §6, §8, §10.1, §11).
- `docs/prompts/claude_2026-09-25_0935_fase2_sim_step3a_core.md` and the 3a entry in `docs/log-inbox/simulation.md`.
- `docs/decisions.md` R-SIM-7..33, R-MK-4, R-MK-6, R-MK-7.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §4, §9.3.
- `CLAUDE.md` §3.2 (Layer Impact Report), §17; `docs/PROTOCOL.md` P4, P11, P12, P13, P14.
