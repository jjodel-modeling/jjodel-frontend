# Prompt: simulator, coverage (Phase 2, lane 3 of 3)

Prompt-ID: P-2026-10-06-0115
Chat: C-2026-10-05-1110
Lane: full (Phase 2, visual; the design is fixed by the discovery and R-SIM-140/141, no Phase 1). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: eseguito 2026-10-06 · lane sim-verif · 42bad725c · verifica visiva passata 2026-10-06
Worktree: `~/jjodel-w-simverif`, branch `sim-verif` (lanes 1, 2 and 2b closed on it and merged on the trunk), `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-06-0115 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

Read whole: R-SIM-140 and R-SIM-141 with their adoption paragraph (V1, V2, Q2, Q4) in `docs/decisions.md`, and the discovery `docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md` §5, §6 «Lane 3 `sim-coverage`», §7. Alfonso authorised the merge after the chat's visual check (R-SIM-141); this lane does not merge. The Status flip of this prompt is done by the chat after its visual GO: the lane closes with the log entry and does not touch the Status line.

Time budget: the session has a hard limit; earlier lanes hit it during the probe. Keep the probe lean: one script, the four scenes plus the coverage cases, no retries beyond two per scene.

## COSA

Coverage, exactly as V1, V2, Q2, Q4 say:

1. `sim/simCoverage.ts` (new): per model, visits of every node (token arrivals) and firings of every transition (fired steps), over the runs since the counts were last cleared; Reset, Stop and a step back keep them, Clear empties them; a replayed scenario counts like a run. Its own change channel, never `'mark'`. Counting by observing the live run from the canvas layer, as the discovery measured (counts from labels equal counts from the trace).
2. `sim/SimCanvasLayer.tsx`: a toggle in the layer's controls, off by default (the right-aligned controls shift left, nothing else moves), and the Clear action.
3. `sim/SimNodeRunState.tsx` and `sim/simNodeRunState.scss`: with coverage on, nodes never visited stand out (a muted treatment from the tokens) and visited nodes show their count discreetly; no box changes (0 px on every node), nothing on the undo stack, no model write.
4. `sim/simViewerPrefs.ts`: the optional `coverage?` preference, absent by default, round trip unchanged when absent.
5. Edges: not in this lane (Q2); leave a one-line note in the log entry.

Grep every new identifier and class before adding it (the discovery found 0 hits for `simCoverage`, `sim-node-run__cov`, `sim-canvas-layer__coverage`).

## Visual contract (template-task-visivi)

- Now: no way to see which parts of the model a run never reached.
- Then: one toggle in the canvas layer's controls; with coverage on, unvisited nodes muted and visited ones with a count.
- Byte-identical with coverage off, on the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`, read-only): panel readings, the canvas layer apart from the toggle, every node box, the exports reopened with no key added.
- Probe on a port 3080-3099 (never 3000, 3001, 3003): on DemoESM run the discovery's path and show `off` never visited; on DemoPetri a few steps; counts survive Reset and a step back, Clear empties them; boxes 0 px delta. Crops at 600 px (gitignored): `<scene>_{base,after}_600.png` with coverage off, `esm_coverage_on_600.png`, `petri_coverage_on_600.png`, the toggle.

## Tests and gates

Tests first, red at the base, as §6 lists: `simCoverage.test.ts` (counts from the trace equal counts from the labels; Reset and a pop keep them; Clear; its own channel, not `'mark'`), `simViewerPrefs.test.ts` for `coverage?`. Mutation bench on `simCoverage.ts`. Then typecheck (baseline), vitest, build, `check:docs`, `check:addonly`. Commits: `test:`, `feat(sim):`, `probe:` if any, then the closure docs commit (log entry in `docs/log-inbox/simulation.md`; no Status flip).

## HARD STOP

- If any step needs `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`, `VersionFixer.tsx` or `canvasToJjom.ts`, or changes an exported interface outside `sim/` and `model/simulation/`: stop before editing, `Outcome: question`.
- After the code commits and the probe: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE

No edges overlay, no change to watches, step back, scenarios or the slider, no change to the board editor (another lane is redesigning it). No `git stash`, no `git add .`/`-A`/`-u`, no push, no files outside the worktree (no `/tmp` scratch files).

## RIFERIMENTI

R-SIM-12, R-SIM-106, R-SIM-137..142; the discovery report above; the log entries of lanes 1, 2 and 2b; `CLAUDE.md`; `template-task-visivi`.
