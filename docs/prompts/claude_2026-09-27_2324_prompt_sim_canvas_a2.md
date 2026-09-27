# Prompt: canvas run state, slice A2 (the pending choice on the canvas)

Prompt-ID: P-2026-09-27-2324
Chat: C-2026-09-27-1437
Lane: full (Phase 2 of P-2026-09-27-1647, slice A2; `SimulationPanel.tsx` touched; visual check by the chat on the lane's crops, RC-23)
Status: da eseguire

Worktree: `~/jjodel-icons`, branch `sim-canvas-state` (A1 at `4538d824f`, flip `b0d75d190`, then the trunk taken in by P-2026-09-27-2304 after the modal and halt-line merges), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-canvas-state`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Implement slice A2 of `docs/discovery/discovery_2026-09-27_sim_canvas_state.md` as §7 (Option A), §8 and the §9 Layer Impact Report define it: while the «Choose a transition» list is open, exactly its candidate transitions carry a pending mark on the canvas, through a second version counter in `sim/simRunState.ts` (`simSetPending` / `useSimChoiceVersion`, R-SIM-33 3c «secondo canale»), published by `SimulationPanel.tsx` where it sets the pending list and cleared at every `setPending(null)` site. The IR object-as-edge candidate class in `edges/UnifiedEdge.tsx` is optional: do it only if it stays additive, and say so.

The motivating case is Alfonso's flowchart of 2026-09-27 (see P-2026-09-27-2255's report when it lands): at a DecisionNode with two flows whose `condition` is empty, the ε list offers `Flow_1` and `Flow_2`, and the canvas shows nothing to tell which objects are the candidates. After A2, those two objects carry the pending mark while the list is open, and lose it on choice, Cancel, Reset and Stop.

The binding constraint of §9: A2's counter re-renders only the overlays, never `ObjectNode` or an IR resolver. The panel lost 449 lines to the modal and gained the halt slot since the report was written: re-find the `setPending` sites on the tree as it is now, and quote them.

No trunk merge before 2026-10-04 (ratified). The demo does not show A2.

## DOVE

- `frontend/src/components/editor-v2/sim/simRunState.ts` (additive), `SimulationPanel.tsx` (publish and clear only), the A1 overlay files that render the mark (`SimNodeRunState.tsx`, `simNodeRunState.scss`, `simCanvasState.ts`), optionally `edges/UnifiedEdge.tsx`, and their tests (`sim/__tests__/simCanvasState.test.ts`, `sim/__tests__/simRunState.test.ts`). Verify any new class or export name is free with a global grep first.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.
- Crops in `~/.jjodel-lanes/shots_canvas_a2/`.

Out of scope: every critical-zone file, `ObjectNode.tsx` beyond what A1 already added, the demo script, `docs/decisions.md` unless the report names a row A2 owes (then provisional, unattended).

## COME

1. Read `CLAUDE.md`, the report §4, §7-§10, the A1 log entry, and the DOVE files whole.
2. Baseline: typecheck (14 known), vitest on the two sim directories.
3. Tests first (red), then the counter, the publish/clear sites, the overlay mark. Green. A render-count assertion or probe that `ObjectNode` does not re-render on a choice-version bump.
4. Mutation bench: at least one mutant per clear site, and one that publishes without clearing.
5. Gates: typecheck same 14, vitest green, build exit 0, `check:docs`, `check:scripts`.
6. Probe on port 3028 (never 3000-3006, 3010-3027): Petri conflict (the preset's ε choice), Flow B, and Alfonso's YES/NO flowchart rebuilt as in P-2026-09-27-2255; crops with the list open, after choosing, after Cancel, light and dark, 1600x1000.
7. Commits: `feat(sim): the pending choice on the canvas, slice A2 (P-2026-09-27-2324)`, then docs.
8. `Outcome: hard-stop` with the shas, the render-count evidence, the mutant count and the crop paths.

Stop with `Outcome: question` and a `Recommended:` line if keeping `ObjectNode` out of the re-render needs an exported-interface change, or if a publish/clear site cannot be found.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3028.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_canvas_state.md`; `docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md` and `claude_ratifiche_2026-09-27_evening_answers.md`; the P-2026-09-27-1647 entries in `docs/log-inbox/simulation.md`.
- `docs/decisions.md` R-SIM-1, R-SIM-3, R-SIM-4, R-SIM-33, R-SIM-65.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-21, RC-22, RC-23, RC-25.
