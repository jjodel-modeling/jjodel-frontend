# Prompt: discovery, random resolution of nondeterminism in the simulator (Random button and the Ask|Random run policy)

Prompt-ID: P-2026-09-29-1700
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the simulation panel, the pure stepping core, Play, the trace). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-randdisc`, branch `sim-random-disc` (cut by the chat from `alfonso-frontend-jjtl` at `8f972410f`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-randdisc`, branch `sim-random-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29, ratified the proposal «random resolution of nondeterminism», both parts, as written. Both enter the MODELS build before the freeze (2026-10-01 evening); Part 2 lands after Part 1; a regression on the trial run on 3001 means rollback. The chat assigned the rows: **R-SIM-100** (Part 1) and **R-SIM-101** (Part 2); the Phase 2 lanes write them, not this discovery.

**Part 1.** A «Random» button (Bootstrap Icons `bi-shuffle`) next to Cancel in the choice list (R-SIM-98, «Nondeterministic choice (ε)»), shown only for ε choices with at least two candidates. It draws uniformly among the options shown. The trace records the drawn transition and its origin `user|random`; the panel reads «Last step: t3 (random)». The RNG is injected into the pure core, seedable; the run's seed goes in the trace. Tests with a stub RNG.

**Part 2.** A run policy «Choices: Ask | Random» in the run state, per `modelId` (default Ask, not persisted in the model). With Random, Play continues until termination, deadlock, Stop or a step limit k. The policy resolves only internal nondeterminism; external events stay user input.

Goal: the facts and a Phase 2 plan for two lanes (Part 1, then Part 2). Open questions Alfonso left to this discovery, each answered with evidence and a `Recommended:` line:

1. Does Play today stop at every ε choice? Measure it on the Petri scene (and on any other demo scene with an ε choice: say which have one).
2. Default of k (proposal 100), editable next to the policy: where, what control, what happens when k is reached (message, state).
3. The seed: shown in the panel, or only in the exported trace.

## DOVE (read-only)

- The choice list component and its Cancel button (grep `Nondeterministic choice`, `choiceHead` in `simBridge.ts`), its SCSS.
- The pure stepping core (`netStep.ts`, `netCompile.ts`, the state-machine step, wherever the enabled set is computed and one transition fired): where an RNG can be injected without touching the call sites' semantics; whether any `Math.random` exists today.
- Play/Step/Stop: the run loop, how it stops today, the run state and where it is keyed by `modelId`.
- The trace model and export (what a step records today; where `origin` and `seed` fit; the trace monitor's readers).
- «Last step» rendering; the demo script's lines on choices (`docs/demo/models_2026_simulator_demo.md`).
- Report: `docs/discovery/discovery_2026-09-29_sim_random_choice.md`, opening with `## 0. Answer in brief`, at most 50 lines; plus this prompt's Status and a log entry in `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, critical zone, naming, Bootstrap Icons only, no new dependency), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, R-SIM-97, R-SIM-98, R-SIM-99, and the trace monitor rows.
2. Answer with [M]/[R] evidence and file:line: the injection point and the RNG type (a seedable PRNG in a few lines, no dependency: say which algorithm); the trace fields and their compatibility with existing exports and readers; the button's place and the no-layout-shift rule; the policy's state location and its reset rules (model switch, reload); Play's loop with the policy and the k limit; the three open questions.
3. Measure with gitignored `_tmp_*` scripts under `npx tsx`; a lane probe only if Question 1 needs it (`lane-run probe`, port 3056, never 3001; setup from `~/.jjodel-lanes/probe-kit/simgate/`).
4. `Recommended:` two Phase 2 lanes, each with its file list, order, tests (stub RNG, seed reproducibility, uniformity over a stub, Play stops at k/deadlock/termination/Stop, external events never drawn), and the demo script lines to change. Name every point that is Alfonso's decision and every critical-zone file (a hit means that lane needs a go-ahead and a Layer Impact Report).
5. One docs commit. Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## RIFERIMENTI

- Alfonso's ratification of 2026-09-29 (above); R-SIM-98 (the choice list); the demo script; the trace monitor rows.
