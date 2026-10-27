# Prompt: simulator, invariants and breakpoints (Phase 2, lane 1 of 3)

Prompt-ID: P-2026-10-05-1735
Chat: C-2026-10-05-1110
Lane: full (Phase 2, visual; the design is fixed by the discovery and R-SIM-137..141, no Phase 1). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: eseguito 2026-10-05 · lane sim-watches · ed800135c · verifica visiva passata 2026-10-05
Worktree: `~/jjodel-w-simverif`, branch `sim-verif` (the discovery's branch), `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt and the adoption paragraph of R-SIM-137..141) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1735 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

Read whole: R-SIM-137..141 in `docs/decisions.md` with their adoption paragraph, and the discovery `docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md` §1, §2, §6 «Lane 1 `sim-watches`», §7 and §8 (W1..W4, Q1). The probe bench of the discovery (`8511a9c16`) is your starting measurement. Alfonso authorised the merge after the chat's visual check (R-SIM-141); this lane does not merge.

## COSA

Invariants and breakpoints, exactly as W1..W4 and Q1 say:

1. `model/simulation/watchCodec.ts`: the M1 key `runWatches`, `{"v":1,"watches":[{name,kind,text}]}`, fixed order, tolerant decoding (a bad entry drops with a defect, never the list), absent key when there are no watches, byte-identical round trip; no VersionFixer step.
2. `model/simulation/watchEvaluator.ts`: compile and read a watch as a board output (`compileOutput`/`evaluateOutput` of `boardOutputs.ts`, `self` the model root, `event` null) plus a boolean check; `node.[x]`, `event`, input variables and undeclared names refused at compile with a defect; a non-boolean value a defect at evaluation; the hit rule (invariant false, breakpoint true), level-triggered.
3. `sim/simBridge.ts`: `PlayStop` gains `'watch'`; the check in `playPress` after its press, never on the configuration Play starts from, identical under Choices Random for the same seed; the line text naming the watch, the step and the firing.
4. `sim/simBoardClock.ts`: `ClockOff` gains `'watch'` with its `clockOffText`; a hit switches the clocks off.
5. `sim/SimulationPanel.tsx`: hits in `show`, the hit line above the buttons, Play and the clocks stopped on a hit; a hand Step reports a hit and never refuses to fire.
6. `sim/SimWatchesModal.tsx` (new) opened from an icon in the inspector header (`sim/SimInspector.tsx` and its `.scss`): add, rename, choose kind, edit the text with compile defects shown on the row; an inspector section only when watches exist; trace marks on the steps that hit. UI wording «Invariants and breakpoints», never «watch» (R-SIM-104 keeps «Watch»). Saving is one project write and one undo step.

Every new identifier was grepped by the discovery (0 hits; `SimWatch*` is taken): grep again before adding any other.

## Visual contract (template-task-visivi)

- Now: no way to state a property; Play runs until Deadlock, Terminated, Halted or Stop.
- Then: one new icon in the inspector header; with watches, the dialog, the section and the hit line; Play stops at the first hit with the line naming watch, step and firing.
- Byte-identical with no `runWatches` key, on the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`, read-only): every panel reading of the script (the `trunk_readings` oracle), Step's top at 854.5 px and the status line, the State dialog, the inspector at 400/372 px apart from the one header icon, the canvas layer, the four exports reopened with no key added.
- Probe on a port 3080-3099 (never 3000, 3001, 3003): the four scenes as above, plus one scene with an invariant that breaks (e.g. on DemoESM or DemoPetri, a bound on a marking or state attribute) and one breakpoint, under Ask and under Random with a fixed seed; save, export, import and reopen with the key. Crops at 600 px (gitignored): `<scene>_{before,after}_600.png`, the dialog, the hit line, for the chat's RC-23.

## Tests and gates

Tests first, red at the base, as §6 lists: `watchCodec.test.ts`, `watchEvaluator.test.ts`, the stop cases in `simBridge.test.ts`, the clock off in `simBoardClock.test.ts`. Mutation bench on the codec and the evaluator. Then typecheck (baseline 14), vitest, build, `check:docs`, `check:addonly`. Commits: `test:`, `feat(sim):`, `probe:` if any, then the closure docs commit (log entry in `docs/log-inbox/simulation.md`, no Status flip: the flip waits for the chat's visual GO).

## HARD STOP

- If any step needs `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`, `VersionFixer.tsx` or `canvasToJjom.ts`, or changes an exported interface outside `sim/` and `model/simulation/`: stop before editing, `Outcome: question`.
- After the code commits and the probe: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE

Nothing of lanes 2 and 3 (step back, scenarios, coverage). No `.smv` mapping. No `git stash`, no `git add .`/`-A`/`-u`, no push, no files outside the worktree (no `/tmp` scratch files).

## RIFERIMENTI

R-SIM-101, R-SIM-104, R-SIM-108, R-SIM-110..136, R-SIM-137..141; the discovery report above; `CLAUDE.md`; `template-task-visivi`.
