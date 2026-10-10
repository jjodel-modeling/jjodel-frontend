# Coverage: fixed-width switch and Clear that sees the live marking (R-SIM-146 points 4 and 5)

Prompt-ID: P-2026-10-10-1646
Chat: C-2026-10-10-1620
Request: https://claude.ai/code/session_01CjZSPxRbbXhjGTtAKkf96c
Lane: fast (Phase 2 only, visual; the design is fixed by R-SIM-146, no Phase 1). No critical-zone go-ahead.
Depends: none
Status: eseguito 2026-10-10 · lane sim-coverage-polish · c1ce5b60f · verifica visiva passata 2026-10-10 (RC-23, chat)

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-covpolish`, branch `sim-coverage-polish`, created from the trunk commit that adds this file,
`frontend/node_modules` symlinked (P14). Before anything else, check four things. `pwd` is the worktree. The branch is
`sim-coverage-polish`. `git status` is clean. `git log -1 --format=%H` equals
`git log -1 --format=%H -- docs/prompts/claude_2026-10-10_1646_prompt_sim_coverage_polish.md`. Otherwise stop with
`Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-10-1646 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.
Do not touch the `Status` line. A parallel lane (P-2026-10-10-1645, branch `sim-board-keys`) works on the board editor
files; do not touch them.

## Context

Read R-SIM-140 and R-SIM-146 in `docs/decisions.md` and the entry of P-2026-10-06-0115 in
`docs/log-inbox/simulation.md`. Measured on 2026-10-06: the Coverage switch widens the canvas layer's controls by 77 px,
more when it is on, which worsens the 2026-10-04 ticket of a wide floating board sitting under those controls; after a
Clear, a place that holds a token stays veiled until a new token arrives.

## COSA

1. **Fixed-width switch.** In `frontend/src/components/editor-v2/sim/SimCanvasLayer.tsx`, the Coverage switch becomes
   an icon button (a Bootstrap icon installed in the app; `bi-bullseye` unless it is taken in the layer) with
   `aria-label="Coverage"` and `aria-pressed`, and its `title` carries the text of today's title plus, when on, the summary
   `n/m places · k/l transitions`. The visible summary span goes. Clear stays an icon button (`bi-eraser`) beside it, in a
   slot that keeps its width when coverage is off (hidden with `visibility`, not removed), so the controls have one width
   off and on. Keep the existing class names; add new ones only after a global search shows they are free.
2. **Clear sees the live marking.** In `frontend/src/components/editor-v2/sim/simCoverage.ts`, Clear empties the counts
   and then counts once, as visits, the places marked in the live configuration of the model's run, when there is one;
   the observation state (net and trace) is unchanged, so the next steps count from there. Give `simClearCoverage` the
   run as an optional second parameter (additive, rule 11) and pass it from the layer. Without a run, Clear empties, as
   today. A viewed past step (R-SIM-106) does not matter: the live configuration counts.

## Tests and gates

Tests first, red at the base, in `frontend/src/components/editor-v2/sim/__tests__/simCoverage.test.ts`: Clear with a run
counts its marked places once and nothing else; the next fired step counts on top; Clear without a run empties; one
bump per Clear. A small mutation bench on `simClearCoverage`. Then typecheck (baseline), vitest, build, `check:docs`,
`check:addonly`.

## Visual contract

- Now: the switch is 77 px wider than the layer's other controls and grows when on; after Clear the marked place is veiled.
- Then: one icon of fixed width, the same width off and on; after Clear the marked place shows 1 visit.
- Byte-identical with coverage off on the four demo scenes (`frontend/scripts/probe/fixtures/scene_*.jjodel`), apart
  from the switch itself.
- Probe on a port 3080-3099 (never 3000, 3001, 3003; check `lane-run ports`), lean, at most two retries: the controls'
  bounding box with coverage off and on, before and after; on DemoESM a few steps, Clear, the marked place unveiled with
  count 1, one more step counted. Crops at 600 px in `~/.jjodel-lanes/P-2026-10-10-1646/crops/`:
  `controls_{base,after}_{off,on}_600.png`, `esm_after_clear_600.png`.

## DOVE

`SimCanvasLayer.tsx`, its stylesheet (the one that styles `sim-canvas-layer__*`), `simCoverage.ts`, the test file above,
the probe under `frontend/scripts/probe/`, and one entry in `docs/log-inbox/simulation.md`.

## COME

Commits: `test(sim):`, `feat(sim):`, `chore(probe):`, then the closure docs commit with the log entry (`log-entry`
skill). Explicit pathspec and the `Model:` trailer on every commit.

## NON FARE

- No file outside the DOVE; in particular none of `SimBoardEditor.*` and `simBoardEditorLayout.ts`.
- No change to how the counts are observed (`simObserveRun`) or to the overlay's look on the nodes.
- No `git stash`, no `git add .`, no push, no merge. Do not touch the `Status` line.

## HARD STOP

If a step needs `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`,
`VersionFixer.tsx` or `canvasToJjom.ts`: stop before editing, `Outcome: question`. After the code commits and the probe:
`Outcome: hard-stop (visual check due)`. The owner chat checks the crops (RC-23) and sends the GO for the closure.

## RIFERIMENTI

`CLAUDE.md` §3 and §21. `docs/PROTOCOL.md` P13, P14, P16. R-SIM-106, R-SIM-140 and R-SIM-146 in `docs/decisions.md`.
