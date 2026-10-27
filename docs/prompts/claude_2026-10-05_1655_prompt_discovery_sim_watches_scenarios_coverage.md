# Prompt: watches, step back, scenarios and coverage in the simulator, discovery (read-only)

Prompt-ID: P-2026-10-05-1655
Chat: C-2026-10-05-1110
Lane: full (Phase 1 discovery read-only, hard stop; Phase 2 in later lanes on disjoint files, written by the chat from this report). Tier: heavy (RC-32: a discovery across the simulator modules). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: eseguito 2026-10-05 · lane sim-verif · discovery only · probe 8511a9c16 (frontend/scripts/probe/sim-verif-bench.ts, node, the four demo fixtures, 35 PASS, 0 FAIL, EXIT=0; check:scripts exit 0) · report ac81aca96 docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md, read on d48373101 · hard-stop: 12 decisions taken unattended (§8.1), none awaiting Alfonso, five questions with Recommended (§8.3), three Phase 2 lanes in §6 · nothing under frontend/src changed
Worktree: `~/jjodel-w-simverif`, branch `sim-verif`, cut by the chat from `alfonso-frontend-jjtl` at `57ff86f5d`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt and R-SIM-137..141, on top of `57ff86f5d`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1655 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## COSA

R-SIM-137..141 in `docs/decisions.md` (read them whole, and R-SIM-137..140 are the scope): watches (invariants and breakpoints), step back, scenarios, coverage. Each row lists what is «to settle». Answer each question with file and line, a measurement where one decides it, and a recommendation with its alternatives:

1. **Watch evaluation.** Where the run evaluates guards over σ after a step (`guardEvaluator.ts`, `guardContext.ts`, `simRunState.ts`, `simBridge.ts`), whether a watch can be evaluated there on the new configuration with `event` null, including `X.[marked]` and `model.[x]`, and how `node.[x]` is refused with a defect. How Play is stopped today (Deadlock, Halted, waiting) and where a watch stop plugs in, also under Choices Random (R-SIM-101).
2. **Watch storage and editing.** The per-model record of the state declarations (R-SIM-94, `stateAttributesCodec.ts`) and of the board (`boardCodec.ts`): the key a watch list would take, round-trip through save, `.jjodel` export/import and `VersionFixer`, byte identity when absent. Where watches are edited: the State page of R-SIM-102, the inspector, or a group of their own; how compile defects are shown (the guard defects of R-SIM-57..63).
3. **Step back.** What the trace keeps per step today (R-SIM-106 viewing a past step, `SimInspector.tsx`, the history in `simRunState.ts`/`simBridge.ts`): is the full configuration (marking, σ, status, selector state) kept, so that a pop restores it exactly, or must a stack be added; memory bound measured on the four demo scenes; how board outputs (`boardOutputs.ts`) and clocks (`simBoardClock.ts`, R-SIM-134..136) react; where the button goes.
4. **Scenarios.** What an input is in the trace (event id, IVAR values of R-SIM-88, the ε choice of R-SIM-100/101), how it is named so a rename keeps it (ids or names, as the board's bindings settled), the storage key, the replay path (the same `fire` the panel and the board use), divergence detection, and the list's place in the panel.
5. **Coverage.** Where visit and firing counts can be gathered (the step function's result, `netStep.ts`, `simRunState.ts`), where they live (run-state per modelId, R-SIM-12), and the overlay in `SimCanvasLayer.tsx` / `SimNodeRunState.tsx` without any box change; whether edges can be marked from the canvas layer or only nodes.
6. **Phase 2 split.** Propose the lanes (watches; step back and scenarios; coverage) as disjoint file sets, with new and touched files, the tests first for each, what the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`) must still show byte-identical, and which lanes can run in parallel.
7. **Risks.** Anything in the critical zone (`useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`): name it and stop; any exported interface that would change outside the simulator.

## DOVE

Read-only on the app. You may add a probe under `frontend/scripts/probe/` (grep the name first) and copy fixtures from `/Users/alfonso/jjodel-demo-exports/` (read-only) only if a measurement needs one; probe ports 3080-3099, never 3000, 3001 or 3003. Write the discovery report `docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md` (objective, files read with paths, findings, dependencies and risks, decisions taken in the lane, questions for Alfonso with `Recommended:`).

## COME

1. Read `CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-21, RC-25, RC-26, R-SIM-4, R-SIM-12, R-SIM-57..63, R-SIM-88, R-SIM-94, R-SIM-100..108, R-SIM-110..136, R-SIM-137..141, the spec `docs/spec/claude_spec_2026-09-13_computational_model.md`, and the simulator files the questions name.
2. Answer the seven questions; measure where a number decides.
3. Commit the probe if any (`probe:`) and the report (`docs:`), then the closure docs commit (Status flip with lane, shas and «discovery only»; entry in `docs/log-inbox/simulation.md`); stage by explicit path. Stop with `Outcome: hard-stop`, the report's path and two lists: decisions taken in the lane, questions with `Recommended:`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, any change under `frontend/src/`, removing the `frontend/node_modules` link.

## RIFERIMENTI

R-SIM-137..141 (this round); R-SIM-88, R-SIM-94, R-SIM-100..108, R-SIM-110..136; Alfonso's request of 2026-10-05 («si procedi con tutto, usa /lane auto»).
