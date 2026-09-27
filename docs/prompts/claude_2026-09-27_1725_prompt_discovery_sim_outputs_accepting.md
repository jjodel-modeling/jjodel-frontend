# Prompt: discovery, Moore/Mealy outputs and Accepting (S4)

Prompt-ID: P-2026-09-27-1725
Chat: C-2026-09-27-1437
Lane: full (Phase 1, read-only; hard stop at the report; Phase 2 after MODELS per Alfonso's ratification of 2026-09-27 17:07)
Status: eseguito 2026-09-27 · lane sim-outputs-accepting · measured on 6f83971cd; the report is in the commit that carries this line (a commit cannot name its own sha)

Worktree: `~/jjodel-w-outputs`, branch `sim-outputs-accepting` (a new worktree created by the chat from `alfonso-frontend-jjtl` at `93e964141`, with `frontend/node_modules` symlinked to `/Users/alfonso/jjodel/frontend/node_modules` as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-outputs`, branch `sim-outputs-accepting`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Wave 1 of the backlog report (P-2026-09-27-1625), item S4: R-SIM-50/51 (outputs and accepting states) in the engine and on both faces (M2 configure, M1 run panel), and when to show the four hidden presets (decision H: hidden until this engine is merged). The outputs lane R-SIM-76 belongs here too.

Read the backlog report with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§4.1 S4, §4.6, §5 wave 1, §8 H) and Alfonso's answers in `git show sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md`. E1 is on the trunk: the engine files `netTypes.ts`, `netCompile.ts`, `netStep.ts` already carry the activity final and the fused `else`.

## DOVE

Read-only: `frontend/src/model/simulation/**`, `frontend/src/components/editor-v2/sim/**`, the four hidden presets' definitions, `docs/decisions.md` (R-SIM-50, R-SIM-51, R-SIM-76, R-SIM-83, R-SIM-84). Write: `docs/discovery/discovery_2026-09-27_sim_outputs_accepting.md` (new), one entry in `docs/log-inbox/simulation.md`, this prompt's Status flip. Probes, if any, gitignored `_tmp_outacc_*`, on port 3019 only.

## COME

1. Read `CLAUDE.md`, the report sections, the ratification memo, the R- rows and the files.
2. Find where outputs and acceptance would enter the configuration, the step and the marking line; list the hidden presets and what each needs to become runnable; propose the smallest engine-first Phase 2 and the face slices after it.
3. Report: objective, files read, findings with file:line, measurements where a probe helps, design options with files, tests, R- rows touched and risk to the four demo presets, the recommended Phase 2 lane(s) with their file sets, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
4. One docs commit with the report, the log entry and the Status flip: `docs(sim): Moore/Mealy outputs and Accepting discovery (P-2026-09-27-1725)`.
5. `Outcome: hard-stop` with the sha.

Never: an edit under `frontend/src`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3019.

## RIFERIMENTI

- Backlog report (above), the ratification memo; `docs/PROTOCOL.md` P13, P14, P16; RC-22, RC-25, RC-26.
