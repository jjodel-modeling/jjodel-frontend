# Prompt: discovery for the post-MODELS engine batch (G6, G7, G12)

Prompt-ID: P-2026-09-27-1545
Chat: C-2026-09-27-1437
Lane: full (Phase 1 discovery, read-only; hard stop at the report; nothing of this lane reaches the trunk before 2026-10-04)
Status: eseguito 2026-09-27 · lane sim-post-models-engine · measured on f18d976d5; the report is in the commit that carries this line (a commit cannot name its own sha)

Worktree: `~/jjodel-icons`, branch `sim-post-models-engine` (cut by the chat from `alfonso-frontend-jjtl` at `d7fe8871f`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-post-models-engine`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Three engine gaps are known, measured, and held after MODELS because the demo script works around them (readiness-2 report §8, decision E, decision H):

- **G6**: `simActivityFinal` is written by a Flowchart Apply but the engine never reads it (R-SIM-52, R-SIM-53); a flow final named `ActivityFinal` does not end the run.
- **G7**: `[else]` on a transition into a Fork or a Join is not supported in fused transitions; the script uses an explicit complement instead.
- **G12**: Apply proposes Bound = the largest initial marking, a lower bound; on the demo net (arc ×2) k = 2 halts `unsafe` at step 2. Decision H (Alfonso, 2026-09-27 14:27) keeps Bound = 4 set by hand in the demo and leaves R-SIM-81 as it is for now; this discovery prepares the post-MODELS option of a proposal that accounts for arc weights (or a bounded reachability estimate), which would amend R-SIM-81 and therefore needs Alfonso's yes before Phase 2.

Goal: a report that lets Phase 2 start on 2026-10-05 without further reading: for each gap, the code path, the smallest change, the tests that pin it, the R- rows it touches, and the risk to the four demo presets. Chat decision, unattended (RC-25): discovery now, in parallel, because it is read-only and nothing merges before the demo.

## DOVE

Read-only: `frontend/src/model/simulation/**`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (only where Apply builds the proposal), their tests, `docs/decisions.md` (R-SIM-47..81), `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md`, `docs/demo/models_2026_simulator_demo.md`.

Write: `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` (new), one entry in `docs/log-inbox/simulation.md`, this prompt's Status flip. Nothing else.

## COME

1. Read `CLAUDE.md`, the three sources above, and the engine files the gaps name.
2. For each of G6, G7, G12: where the behaviour lives (file:line), the minimal change with a code sketch, tests to add (names and assertions), R- rows touched (and whether that is an amendment of a row Alfonso ratified, RC-26), the effect on each of the four demo presets (unchanged / changes, with why), and an estimate (fast lane / full lane).
3. For G12 give two options with their cost: (a) a proposal that multiplies by the largest arc weight into each place, (b) a bounded exploration of reachable markings up to a small depth; say which one the report recommends and why. No code.
4. Report sections: objective, files read, the three gaps, cross-cutting risks, recommended Phase 2 order, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
5. One docs commit with the report, the log entry and the Status flip: `docs(sim): post-MODELS engine batch discovery (P-2026-09-27-1545)`.
6. `Outcome: hard-stop` with the sha.

Never: an edit to any file under `frontend/`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a dev server.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §5 (G6, G7, G12), §8, §10.
- `docs/decisions.md` R-SIM-52, R-SIM-53, R-SIM-81; decision E and decision H as recorded in the demo script §3.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-25, RC-26.
