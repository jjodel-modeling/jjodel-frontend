# Prompt: discovery, demo readiness of the four visible presets, end to end (MODELS 2026-10-04)

Prompt-ID: P-2026-09-27-1015
Chat: C-2026-09-26-1702
Lane: full (Phase 1 discovery, read-only; measured on a dev server; a report)
Status: eseguito 2026-09-27 · lane simulation-engine · 567dc25da (discovery only, no Phase 2: the report is the deliverable)

Worktree: `~/jjodel-sim`, branch `simulation-engine` (fast-forwarded by the chat to the trunk at `0eaf477a8`, which carries C1, C2 and M3 merged), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file (its parent `0eaf477a8`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*` (this tree holds many from earlier lanes; leave them). Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1015 · session <id>]` and ends with a bare `Outcome:` line. Run gates and probes in the foreground.

**Phase 1 only: read-only.** No source file is edited, no commit except the report (step 6). A dev server from this tree on a free port (3000, 3001 and 3003 are held by other trees; 3002 and 3004..3006 were used by other lanes: check with `lsof` and take the first free port at 3007 or above); probe files under `frontend/scripts/smoke/_tmp_demo_*` (gitignored); stop the server at the end. You may read, and copy into this tree as `_tmp_demo_*` sources, the probe files of the earlier lanes: `~/jjodel-gate/frontend/scripts/smoke/_tmp_p0225_{common,scenario,visual}.ts|js` (M3: panel readers, `openModel`, Apply through the DOM, the turnstile and b2net builders) and `~/jjodel-icons/frontend/scripts/smoke/_tmp_c2_{0200_probe,scenario}.ts|js` (C2: declarations through the panel, M1 run readers). Never write in those trees.

## COSA

The demo at MODELS (2026-10-04, build freeze proposed for 2026-10-01 evening) shows a metamodel becoming simulable in a few clicks from a preset, then a run. The panel offers four presets (R-SIM-79, A2): Petri net (P/T), Flowchart / Activity, State machine, Extended state machine. Each was built by a lane that verified its own slice (C1 the declarations, C2 the derived attributes, M3 the binder and the panel), but nobody has yet measured the four presets end to end on this tree: metamodel, model, Apply from the panel, Reset, ten Steps, halts and texts. Do that measurement, for each preset, and turn every gap into a costed line, so the chat can decide which lanes fit before the freeze.

## DOVE (read)

- The engine: `frontend/src/model/simulation/` (`netTypes.ts`, `netCompile.ts`, `netStep.ts`, `guardEvaluator.ts`, `actionEvaluator.ts`, `derivedEvaluator.ts`, `roleCatalog.ts`, `simProfiles.ts`, `profileBinder.ts`); the bridge and panel: `frontend/src/components/editor-v2/sim/` (`simBridge.ts`, `simRunState.ts`, `simRoleStatus.ts`, `metamodelSketch.ts`, `SimulationPanel.tsx`).
- `docs/decisions.md`: R-SIM-1..79 (read the whole series once; R-SIM-47..56 for the profiles, R-SIM-67..72 for the declarations, R-SIM-73..79 for derived and M3); `docs/design/claude_2026-09-25_simulation_roles_modal_design.md` for what a preset is meant to mean.
- The discovery reports of the three lanes under `docs/discovery/` dated 2026-09-26 and 2026-09-27 (`sim_state_declarations`, `sim_derived_attributes`, `sim_profiles_panel`): their «open questions» and «out of scope» sections are the first list of candidate gaps.
- The inbox `docs/log-inbox/simulation.md` and the active log: every ticket still open on the simulator.

## COME

1. **Scenarios [M].** For each of the four presets, one minimal but faithful pair (metamodel, model), built through the store as the earlier scenario files do, in the shape a demo would draw by hand:
   - Petri: places, transitions, arcs with weights, an inhibitor arc if the catalog has it, a guard on a transition, tokens; run to a deadlock.
   - Flowchart / Activity: an initial node, activities, a decision with two guarded edges, a fork and a join, an activity final, one declared state attribute read by the guards and written by an action (R-SIM-68 makes `stateAttributes` required here).
   - State machine: the PEST shape (State, Initial, Terminal, Transition with `event` and `nextState`, `State.transitions`), a run driven by events (how does the panel feed an event? measure it).
   - Extended state machine: the State machine plus guard and action, one stored and one derived declaration, a guard reading the derived one.
   Each scenario: Apply the preset from the panel (DOM, as the M3 probe does), read the summary (checkable? proposals? candidates? set-but-off?), read the bag, Reset (defects line), ten Steps (status, halts, «Last step» texts, marking or current state), undo once and confirm the bag is back. Screenshots light only, one per scenario after Apply and one after the run.
2. **Gaps.** Every point where the scenario does not run as a demo would expect: a role the binder cannot resolve on a metamodel drawn the natural way; a key Apply writes that has no select; a required role with no candidate; a Reset defect the user cannot fix from the panel; a Step that halts for an engine reason (fork/join semantics, event delivery, guard on a derived value, a declaration the engine ignores); a text that is wrong or clamped; a panel state that moves Step's top. For each: preset, layer (catalog, binder, panel, bridge, engine), evidence (the probe line), a fix sketch, an honest estimate (fast lane, full lane, or after MODELS), and a `demo-critical: yes|no` verdict with one reason.
3. **What already works.** The same table for what runs cleanly, so the chat knows what not to touch before the freeze.
4. **Risks.** The interaction found on 2026-09-27 (a Checkable bag folds the groups behind Configure…); the `simActivityFinal` and «Kept: Node» tickets of M3; the presentation equation failure that is not surfaced; the Cmd+Z on Mac (verified by Alfonso this morning, say so); anything the ten-step runs reveal about performance or layout.
5. **Recommendation.** The ordered list of lanes to run before 2026-10-01 evening, each with its files, whether it touches an engine file of C2 (merge order after `simulation-engine` takes the trunk), and what the demo loses if it is skipped. Say explicitly whether the outputs lane (R-SIM-76) or the enum step B belong in the list (expected: no).
6. **Report, mandatory.** `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md`: objective, files read, the four scenarios with their readings, the gaps table, the works table, risks, recommendation, «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26: what the demo shows is his; list the choices by letter). Commit it alone, pathspec after `--`, subject `docs: discovery of the demo readiness of the four presets (P-2026-09-27-1015)`, `Model:` trailer. No log entry, no Status flip.
7. **Hard stop.** Closing report `[P-2026-09-27-1015 · session <id>]`: the report sha, the number of gaps and how many are demo-critical, the first three lanes of the recommendation in one line each. Stop the dev server. `Outcome: hard-stop`.

Stop with `Outcome: question` and a `Recommended:` line only if a scenario cannot be built through the store at all (say why); a scenario that builds but halts is a finding, not a question.

Never: an edit to a source file, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start (reading and copying the `_tmp_*` probes named above is the one allowed touch of another tree).

## RIFERIMENTI

- Lanes C1 (`24d8537fd`), C2 (`fe4e3030b`), M3 (`db3e68cde`) and their closures in `docs/log-inbox/simulation.md`; the three discovery reports named in DOVE.
- `docs/PROTOCOL.md` P13, P16; RC-22 (parallel lanes: this one is read-only and runs beside `P-2026-09-27-0935` on the trunk), RC-25..30.
