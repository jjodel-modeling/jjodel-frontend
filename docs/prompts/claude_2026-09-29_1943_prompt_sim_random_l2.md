# Prompt: Part 2 of random resolution of nondeterminism, the Ask | Random run policy and Play (R-SIM-101)

Prompt-ID: P-2026-09-29-1943
Chat: C-2026-09-28-1936
Lane: full (Phase 2 of `discovery_2026-09-29_sim_random_choice.md`, lane L2; tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane sim-random-l2 · 0d1e8ed94, 15fdc7363, 6f1bcea1d · non fuso: hard-stop, lane probe on 3058 (light), Choices row with k, Step 854.5 under Ask and Random, Play between Step and Stop, Petri Random + Play Deadlock at p2 ×2, p3 in 4 steps (three seeds), Flow B Terminated in 6, SM «Play waits for an event», pause and Stop mid-play, Ask + Play stops at the first list, hand runs identical to 09-29c, crop in docs/discovery/harness/_tmp_randl2_*.png (gitignored), R-SIM-101 nel commit docs, verifica visiva alla chat

Worktree: `~/jjodel-w-randl2`, branch `sim-random-l2` (cut by the chat from `alfonso-frontend-jjtl` at `7c2539ae9`, which contains lane L1, R-SIM-100; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-randl2`, branch `sim-random-l2`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29, ratified Part 2 as written: a run policy «Choices: Ask | Random» in the run state per `modelId` (default Ask, not persisted in the model); with Random, Play continues until termination, deadlock, Stop or a step limit k; the policy resolves only internal nondeterminism, external events stay user input. It enters the MODELS build before the freeze; a regression on the trial run on 3001 means rollback.

Alfonso, 2026-09-29, then approved all four decisions of the discovery §0 («sì su tutto»):

- **A1.** Play is a new fourth button, `bi-fast-forward-fill`, between Step and Stop: one ε step every 500 ms; the glyph turns `bi-pause-fill` while playing (a press pauses); Stop keeps today's meaning (it clears the run).
- **A2.** Play also stops when no ε candidate exists while an event has one, and when an ε press asks an input (R-SIM-88); it never draws an event or an input value; the status row reads `Running · Play waits for an event` (and a matching line for the input case: say which).
- **A3.** The policy applies to ε lists only, never to a list opened by an event.
- **A4.** The demo script §2.2 keeps its three hand choices and gains one optional beat: Reset, Choices → Random, Play, ending in `Deadlock` at `p2 ×2, p3` in 4 steps.

The chat adopted the discovery's Q2 and Q3: k = 100, a number input (1..1000) after the `Choices` select in one constant row above the buttons, so Step does not move; k counts the steps of one Play press; at k Play stops, the run stays `Running`, the status row reads `Running · Play stopped at 100 steps`, Play continues. The seed stays where L1 put it.

Implement **lane L2 of the discovery §7-§8**: the policy map in `simRunState.ts` (default `{ ask, 100 }`, reset rules of §7), the pure `playTick(run, policy)` in `simBridge.ts`, the panel's `setTimeout` chain reading the store each tick (never React state), the Choices row reusing `sim-panel__row` / `__label` / `__select`. Under Random no ε list opens on Step either (§7); every drawn step goes through L1's `pressRandom` and records `origin: 'random'`.

Record a row **R-SIM-101** in `docs/decisions.md` after R-SIM-100, header exactly: `- **R-SIM-101** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).` Body: the ratified text, A1-A4 as approved, k and its control, the stops, and it cites this prompt and chat.

## DOVE

§8 L2 (Rule 19: list before the first edit): `frontend/src/components/editor-v2/sim/simRunState.ts`, `sim/simBridge.ts`, `sim/SimulationPanel.tsx`, `sim/simulation-panel.scss`, `__tests__/simRunState.test.ts`, `__tests__/simBridge.test.ts`. Plus `docs/decisions.md` (the row, add-only) and the demo script lines `:68-69`, after `:199` (the optional beat), `:177` (count), `:476-481`. Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (Rule 9, Rule 11, Rule 19, §21.2, SCSS and naming, Bootstrap Icons only, no layout shift, critical zone), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, R-SIM-34, R-SIM-88, R-SIM-98, R-SIM-100, and the discovery end to end.
2. Baseline: typecheck count, vitest of `model/simulation` and `editor-v2/sim`.
3. Tests first (red, then green), the list of §8 L2: `playTick` stops at k (cyclic net, exactly k), `Deadlock` (Petri, 4), `Terminated` (Flow B, 6), no ε candidate (SM, 0), an input ask, a list under Ask; a cleared run stops the next tick; the press is always ε (a spy on `step`'s event); the policy map's default and per-model scope; under Random, Step opens no list. Mutation bench on the stop conditions and the k counter.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only (a `laneRun.test.ts` 5 s timeout under load is known: re-run that file alone and report), `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
5. A lane probe on port 3058 (`lane-run probe`, never 3001), light theme, 1600×1000; setup with the Simulation toggle and the kind picker (reuse L1's `_tmp_randl1_walk.ts` approach). Measure: Step's top 854.5 with the Choices row present, Ask and Random; the panel's top inside the editor; Petri Random + Play ends in `Deadlock` at `p2 ×2, p3` in 4 steps (three seeds); Flow B Play ends `Terminated` in 6; SM Play stops with `Play waits for an event`; pause and Stop mid-play; Ask + Play stops at the first list. The four scenes' hand runs unchanged against `~/.jjodel-lanes/probe-kit/trunk_readings_2026-09-29c.txt`. Crops at `sips -Z 600` under `docs/discovery/harness/_tmp_randl2_*.png` (gitignored).
6. Commits one per layer, then one docs commit (row, demo lines, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the measures and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, `netStep.ts` or `netCompile.ts` edits, a new dependency.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-29_sim_random_choice.md` (§0, §7, §8); R-SIM-100; the demo script.
