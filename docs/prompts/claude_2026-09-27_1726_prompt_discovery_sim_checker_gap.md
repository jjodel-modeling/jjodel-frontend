# Prompt: discovery, guard and action checks in the problems list (S16)

Prompt-ID: P-2026-09-27-1726
Chat: C-2026-09-27-1437
Lane: full (Phase 1, read-only; hard stop at the report; Phase 2 after MODELS per Alfonso's ratification of 2026-09-27 17:07)
Status: eseguito 2026-09-27 · lane sim-checker-gap · measured on d1d45b9d3; the report is in the commit that carries this line (a commit cannot name its own sha)

Worktree: `~/jjodel-w-checker`, branch `sim-checker-gap` (a new worktree created by the chat from `alfonso-frontend-jjtl` at `93e964141`, with `frontend/node_modules` symlinked to `/Users/alfonso/jjodel/frontend/node_modules` as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-checker`, branch `sim-checker-gap`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Wave 1 of the backlog report (P-2026-09-27-1625), item S16: a producer of STC guard and action checks in the problems registry (`problems/`, critical zone in Phase 2), with lane C2's probe as the reference measurement.

Read the backlog report with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§4.4 S16, §5 wave 1, §8 E) and Alfonso's answers in `git show sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md`. Critical-zone files are read only; include the draft Layer Impact Report Phase 2 would need (RC-30).

## DOVE

Read-only: `frontend/src/components/editor-v2/problems/**` or wherever the problems registry lives, `frontend/src/model/simulation/**` (guard and action evaluators), `frontend/src/components/editor-v2/sim/**`, `docs/decisions.md` (R-SIM-* on guards and actions, the problems registry rows). Write: `docs/discovery/discovery_2026-09-27_sim_checker_gap.md` (new), one entry in `docs/log-inbox/simulation.md`, this prompt's Status flip. Probes, if any, gitignored `_tmp_checker_*`, on port 3020 only.

## COME

1. Read `CLAUDE.md`, the report sections, the ratification memo, the R- rows and the files.
2. Map the problems registry (producers, kinds, how a producer registers); list which STC guard and action errors are caught today and which are not, with a probe on the demo presets if needed; design the producer, its new problem kinds (additive, Rule 11) and its tests.
3. Report: objective, files read, findings with file:line, measurements where a probe helps, design options with files, tests, R- rows touched and risk to the four demo presets, the recommended Phase 2 lane(s) with their file sets, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
4. One docs commit with the report, the log entry and the Status flip: `docs(sim): guard and action checks in the problems list discovery (P-2026-09-27-1726)`.
5. `Outcome: hard-stop` with the sha.

Never: an edit under `frontend/src`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3020.

## RIFERIMENTI

- Backlog report (above), the ratification memo; `docs/PROTOCOL.md` P13, P14, P16; RC-22, RC-25, RC-26.
