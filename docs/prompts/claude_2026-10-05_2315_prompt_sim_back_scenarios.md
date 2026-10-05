# Prompt: simulator, step back and scenarios (Phase 2, lane 2 of 3)

Prompt-ID: P-2026-10-05-2315
Chat: C-2026-10-05-1110
Lane: full (Phase 2, visual; the design is fixed by the discovery and R-SIM-137..141, no Phase 1). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: da eseguire
Worktree: `~/jjodel-w-simverif`, branch `sim-verif` (lane 1 `sim-watches` closed on it and merged on the trunk), `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-2315 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

Read whole: R-SIM-137..141 with their adoption paragraph in `docs/decisions.md`, and the discovery `docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md` §3, §4, §6 «Lane 2 `sim-back-scenarios`», §7, §8 (S1..S3, C1..C3, Q3). Lane 1 added `watchEvaluator.ts`, which the scenario's final `expect` reuses. Alfonso authorised the merge after the chat's visual check (R-SIM-141); this lane does not merge.

Time budget: the session has a hard limit; lane 1 hit it during its probe. Keep the probe lean: one script, the four scenes plus the two cases below, no retries beyond two per scene.

## COSA

Step back and scenarios, exactly as S1..S3, C1..C3 and Q3 say:

1. `sim/simRunState.ts`: `simStepBack`, a pop over the kept configurations and `configAt` (no stack, no bound), a no-op at step 0; from Terminated, Deadlock or Halted it returns to Running; `draws` not rewound; one `'mark'` bump; the view returns to live.
2. `sim/SimulationPanel.tsx`: the Step back button between Reset and Step (`bi-skip-start-fill`, «Step back»), disabled at step 0; it stops Play, leaves the clocks alone; the replay handler.
3. `sim/simBoardDevices.tsx`: the Buzzer muted for a backward change.
4. `model/simulation/scenarioCodec.ts` (new): the M1 key `runScenarios`, steps `{event, selector, kind, inputs?}` by id, an inline `expect` (a watch text), cap 1000 steps, tolerant decoding, absent key when there are none, byte-identical round trip, no VersionFixer step.
5. `sim/simScenarios.ts` (new): record from the current trace, step check, synchronous replay from Reset through `pressInput` with the five checks of §4 plus the committed kind; divergence stops at the step and says why; a false final `expect` fails; watches do not stop a replay; clocks are not armed by it; it counts as a run.
6. `sim/SimInspector.tsx` and `.scss`: «Save as scenario» from the trace head; a Scenarios section (name, steps, Replay, last result, delete) shown only when scenarios exist. Saving is one project write and one undo step.

Grep every new identifier before adding it (the discovery listed 0 hits for `simStepBack`, `stepBack`, `runScenarios`, `simScenarios`, `SimScenario`, `sim-panel__back`).

## Visual contract (template-task-visivi)

- Now: no way back but Reset; no way to keep a run.
- Then: the Step back button in the transport row (Step moves right, its top does not); one icon in the trace head; with scenarios, the section.
- Byte-identical with no `runScenarios` key, on the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`, read-only), apart from the declared additions: panel readings, the status line, the State dialog, the inspector, the canvas layer, the four exports reopened with no key added.
- Probe on a port 3080-3099 (never 3000, 3001, 3003): the four scenes; on DemoPetri and DemoESM, k steps then k step backs equal Reset's configuration, step back from Terminated or Deadlock returns to Running; record a scenario, Reset, replay equal to the trace; one tampered scenario diverges with its reason; save, export, import, reopen with the key. Crops at 600 px (gitignored): `<scene>_{base,after}_600.png`, the transport row, the Scenarios section, a divergence line.

## Tests and gates

Tests first, red at the base, as §6 lists: `simRunState.test.ts` (the pop from each status, past the cap, with nothing kept, draws kept, view live, one bump, no-op at 0), `scenarioCodec.test.ts`, `simScenarios.test.ts` (replay equals trace, the divergences of §4, the input one included, the final condition, the cap). Mutation bench on the codec, the pop and the replay. Then typecheck (baseline), vitest, build, `check:docs`, `check:addonly`. Commits: `test:`, `feat(sim):`, `probe:` if any, then the closure docs commit (log entry in `docs/log-inbox/simulation.md`, no Status flip: the flip waits for the chat's visual GO).

## HARD STOP

- If any step needs `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`, `VersionFixer.tsx` or `canvasToJjom.ts`, or changes an exported interface outside `sim/` and `model/simulation/`: stop before editing, `Outcome: question`.
- After the code commits and the probe: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE

Nothing of lane 3 (coverage). No `.smv` mapping. No `git stash`, no `git add .`/`-A`/`-u`, no push, no files outside the worktree (no `/tmp` scratch files).

## RIFERIMENTI

R-SIM-12, R-SIM-88, R-SIM-100..108, R-SIM-110..136, R-SIM-137..141; the discovery report above; lane 1's log entry; `CLAUDE.md`; `template-task-visivi`.
