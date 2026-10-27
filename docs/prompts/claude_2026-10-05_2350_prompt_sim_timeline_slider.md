# Prompt: simulator, timeline slider (Phase 2, lane 2b)

Prompt-ID: P-2026-10-05-2350
Chat: C-2026-10-05-1110
Lane: full (Phase 2, visual; the design is fixed by R-SIM-142, no Phase 1). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: eseguito 2026-10-06 · lane sim-timeline · 6a771cfee · verifica visiva passata 2026-10-06
Worktree: `~/jjodel-w-simverif`, branch `sim-verif` (lanes 1 and 2 closed on it), `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt and R-SIM-142) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-2350 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

Read whole: R-SIM-106 (viewing a past step), R-SIM-137..142 in `docs/decisions.md`, and the log entries of lanes 1 and 2 in `docs/log-inbox/simulation.md`. Today the run inspector's trace lets you click a row to view a past step (blue band «Viewing step N. The run is still at step M.» with «Back to live»), and lane 2 added `simStepBack` and the Step back button. Alfonso asked (2026-10-05) for a slider that moves the execution back and forth. Alfonso authorised the merge after the chat's visual check (R-SIM-141); this lane does not merge.

Time budget: the session has a hard limit. Keep the probe lean: one script, the four scenes plus the slider cases, no retries beyond two per scene.

## COSA

R-SIM-142, exactly:

1. A timeline slider in the simulation panel, under the transport row and above the status line, full panel width, range 0..current step, one notch per step. Hidden at step 0 (nothing to scrub) and when no run exists.
2. Dragging or clicking it views that step in the mode of R-SIM-106: the same view state the trace click sets, so the inspector's band, the trace highlight, the canvas and the board show that configuration; the run itself does not change. The right end is live; reaching it equals «Back to live».
3. Slider and trace stay in sync both ways (a trace click moves the thumb; the thumb moves the trace highlight).
4. While the slider is not at live, a «Continue from here» button (next to the slider or in the inspector band; pick the one that adds no layout shift, and say which) pops the run to that step with `simStepBack` repeated, discarding the later steps, then returns to live. One project-independent action: no model write.
5. Grabbing the slider stops Play. ←/→ move one step while the slider has focus; Home/End go to 0/live.
6. A new component `sim/SimTimeline.tsx` if it keeps `SimulationPanel.tsx` readable (grep the name and any new class first); styles in the panel's scss with a new prefix checked by grep.

## Visual contract (template-task-visivi)

- Now: past steps only through trace clicks in the inspector.
- Then: the slider row in the panel (the panel grows by the row's height; everything above it keeps its position); the button when not live.
- Byte-identical at step 0 and with no run on the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`, read-only).
- Probe on a port 3080-3099 (never 3000, 3001, 3003): on DemoESM and DemoPetri run k steps, drag to j<k: band says «Viewing step j», configuration equals the trace's step j, run still at k; trace click moves the thumb; Continue from here leaves the run at j with j trace entries; End returns to live. Crops at 600 px (gitignored): the panel with the slider at live and at j, the button, the four scenes at step 0.

## Tests and gates

Tests first, red at the base: the mapping thumb↔step (0, live, clamp), sync with the view state, Continue from here equals k−j pops (configuration, trace length, status Running), Play stopped on grab, keys. Mutation bench on the mapping and the continue. Then typecheck (baseline), vitest, build, `check:docs`, `check:addonly`. Commits: `test:`, `feat(sim):`, `probe:` if any, then the closure docs commit (log entry in `docs/log-inbox/simulation.md`, no Status flip: the flip waits for the chat's visual GO).

## HARD STOP

- If any step needs `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`, `VersionFixer.tsx` or `canvasToJjom.ts`, or changes an exported interface outside `sim/` and `model/simulation/`: stop before editing, `Outcome: question`.
- After the code commits and the probe: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE

Nothing of lane 3 (coverage). No change to the engine's step semantics. No `git stash`, no `git add .`/`-A`/`-u`, no push, no files outside the worktree (no `/tmp` scratch files).

## RIFERIMENTI

R-SIM-101, R-SIM-106, R-SIM-122, R-SIM-134..142; lanes 1 and 2 log entries; `CLAUDE.md`; `template-task-visivi`.
