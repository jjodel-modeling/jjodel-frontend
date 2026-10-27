# Prompt: Part 1 of random resolution of nondeterminism, the Random button, the seeded RNG and the minimal trace (R-SIM-100)

Prompt-ID: P-2026-09-29-1840
Chat: C-2026-09-28-1936
Lane: full (Phase 2 of `discovery_2026-09-29_sim_random_choice.md`, lane L1; tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane sim-random-l1 · f10af6812, 7a00d5af7, 25acfefe6, 3cbfbc15b · non fuso: hard-stop, lane probe on 3057 (light), Petri step 1 list 123.1 px and Step 854.5 open and closed, Random right of Cancel, «Last step: ε (random): …» with the seed in its title, t2's line unclamped, sm/esm/flowB run readings identical to 09-29c, crop in docs/discovery/harness/_tmp_randl1_*.png (gitignored), R-SIM-100 nel commit docs, verifica visiva alla chat

Worktree: `~/jjodel-w-randl1`, branch `sim-random-l1` (cut by the chat from `alfonso-frontend-jjtl` at `70b580af4`, which contains the discovery; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-randl1`, branch `sim-random-l1`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29, ratified Part 1 as written: a Random button (`bi-shuffle`) next to Cancel on ε choices with at least two candidates; a uniform draw among the options shown; the trace records the drawn transition and its origin `user|random` («Last step: t3 (random)»); the RNG injected, seedable, the run's seed in the trace; tests with a stub RNG. It enters the MODELS build.

Implement **lane L1 of the discovery §8**, as recommended there, with these points fixed by the chat:

- `simRandom.ts` as in §4 (pure mulberry32, draw *i* of seed *s*, `drawTransition`); the seed drawn once per run at Reset in the bridge with `crypto.getRandomValues`; no `Math.random`.
- The optional `SimRun` fields of §5 (`seed`, `draws`, `trace` with `origin`), `origin` absent on forced steps; no export (spec step 5).
- The button of §6: Cancel and Random in one row, Random right of Cancel, Cancel's vocabulary, 11 px; draws among the candidates the list shows.
- «Last step» as §6 recommends: `ε (random): t3 (…) fired`, the marker after the input (the ratified «t3 (random)» intent: the step says it was drawn); a hand choice unchanged.
- The seed per §5 Q3: no visible line; in the `title` of «Last step:» after a drawn step and in the Reset line's title (`seed <n>`).
- Part 1 only: no policy, no Play, no Choices row (lane L2, after this merges).

Record a row **R-SIM-100** in `docs/decisions.md` after R-SIM-99, header exactly: `- **R-SIM-100** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).` Body: the ratified text, what it amends in R-SIM-35 (the seed and the minimal trace arrive now; export stays step 5), the RNG and seed choice, the «Last step» wording, and it cites this prompt and chat.

## DOVE

The eight files of §8 L1 (Rule 19: list them before the first edit): `frontend/src/model/simulation/simRandom.ts` (new) and its test; `frontend/src/components/editor-v2/sim/simRunState.ts` and test; `sim/simBridge.ts` and test; `sim/SimulationPanel.tsx`; `sim/simulation-panel.scss`. Plus `docs/decisions.md` (the row, add-only) and the demo script lines `:184-187` only. Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (Rule 9, Rule 11, Rule 19, §21.2, SCSS and naming, Bootstrap Icons only, critical zone), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, R-SIM-7, R-SIM-35, R-SIM-98, and the discovery end to end.
2. Baseline: typecheck count, vitest of `model/simulation` and `editor-v2/sim`.
3. Tests first (red, then green), the list of §8 L1: stub RNG (0 → first, 0.9999999 → last, 0.5 of 3 → second); pure = closure mulberry32 on fixed vectors; same seed same stream, seed+1 not; a cycling stub hits each index once; χ² bound on 120000 seeded draws; one candidate consumes no draw; `origin` recorded and absent on forced steps; an event press never `random`; two runs with one seed give one trace. Mutation bench on the pick and the draw counter.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only (a `laneRun.test.ts` 5 s timeout under load is known: re-run that file alone and report), `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
5. A lane probe on port 3057 (`lane-run probe`, never 3001), light theme, 1600×1000; setup from `~/.jjodel-lanes/probe-kit/simgate/`: Petri scene, step 1, the list open: Random present right of Cancel; the list 123.1 px and Step's top 854.5 open and closed (the §6 criterion); press Random: «Last step» with the marker, the seed in its title; the widest line (t2's) not clipped at the marker; the other three scenes' run readings unchanged against `~/.jjodel-lanes/probe-kit/trunk_readings_2026-09-29c.txt`. Crops at `sips -Z 600` under `docs/discovery/harness/_tmp_randl1_*.png` (gitignored).
6. Commits one per layer, then one docs commit (row, demo lines, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the measures and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, `netStep.ts` or `netCompile.ts` edits, a new dependency, dark-theme-only work.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-29_sim_random_choice.md` (§0, §4-§6, §8); R-SIM-35, R-SIM-98; the demo script.
