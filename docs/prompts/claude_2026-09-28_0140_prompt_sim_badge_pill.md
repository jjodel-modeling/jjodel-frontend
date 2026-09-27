# Prompt: the panel summary badge agrees with the dialog pill (S6-S8 bundle)

Prompt-ID: P-2026-09-28-0140
Chat: C-2026-09-27-1437
Lane: two-phase (Phase 1 discovery read-only with a saved report, hard stop; Phase 2 only after the chat's GO)
Status: da eseguire

Worktree: `~/jjodel-w-badge`, branch `sim-badge-pill` (cut by the chat from `alfonso-frontend-jjtl` at `d861cc922`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-badge`, branch `sim-badge-pill`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

The P-2026-09-27-1740 lane (Simulation roles dialog) left a Medium ticket: the Simulation panel's summary badge ignores the compatibility verdicts that the dialog's pill uses, so the two can disagree when a binding warns. None of the four demo metamodels triggers a warning today. The S6-S8 items of the simulation backlog group this with the other panel/dialog verdict mismatches; find them in `docs/log-inbox/simulation.md`, `docs/decisions.md` and the discovery reports under `docs/discovery/` (grep `S6`, `S7`, `S8`, `badge`, `pill`).

Goal: one source of truth for the verdict shown by the badge and the pill, so they can never disagree, with no change to what the four demo scenes show.

## Phase 1 (read-only)

1. Read `CLAUDE.md`, `docs/PROTOCOL.md` P13, P14, P16, the 1740 Phase 2 log entry and its discovery report, and the S6-S8 entries.
2. Locate where the badge verdict and the pill verdict are computed (start from `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` and the dialog component). List every consumer.
3. Write the discovery report `docs/discovery/discovery_2026-09-28_sim_badge_pill.md` (English): objective, files read with full paths, the two computations side by side, the exact inputs on which they disagree (construct one if possible, e.g. a warning binding), the S6-S8 items with their current state, the proposed minimal change (which function becomes the single source, which files change), risks (critical zone must stay untouched: `useJjomSync.ts`, `portDistribution.ts`), questions for the chat with a `Recommended:` line each.
4. Commit the report alone: `docs(sim): discovery badge vs pill (P-2026-09-28-0140)`. Stop with `Outcome: hard-stop`.

## Phase 2 (only after GO)

Minimal diff per the report as approved; a vitest case reproducing the disagreement (red before, green after); gates: typecheck same 14 baseline errors, vitest on the sim directories green, build exit 0, `check:docs`; the four demo scenes on port 3034 with the `_tmp_m0059_*` probe copies from `~/jjodel-release/frontend/scripts/smoke/` (read-only, copy as `_tmp_badge_*`), readings identical to trunk. Commits: `fix(sim): panel badge and dialog pill share one verdict (P-2026-09-28-0140)`, then docs (log entry in `docs/log-inbox/simulation.md`, Status flip). `Outcome: hard-stop` with shas, diff, readings.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3034.

## RIFERIMENTI

- `docs/log-inbox/simulation.md` (1740 entry, S6-S8); `docs/decisions.md` R-SIM-85; `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-23, RC-25.
