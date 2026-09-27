# Prompt: discovery, well-founded recursion in derived attributes (S3)

Prompt-ID: P-2026-09-27-1727
Chat: C-2026-09-27-1437
Lane: full (Phase 1, read-only; hard stop at the report; Phase 2 after MODELS per Alfonso's ratification of 2026-09-27 17:07)
Status: da eseguire

Worktree: `~/jjodel-w-recursion`, branch `sim-derived-recursion` (a new worktree created by the chat from `alfonso-frontend-jjtl` at `93e964141`, with `frontend/node_modules` symlinked to `/Users/alfonso/jjodel/frontend/node_modules` as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-recursion`, branch `sim-derived-recursion`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Wave 1 of the backlog report (P-2026-09-27-1625), item S3: the recursion R-SIM-74 refuses today: a per-(element, attr) dependency graph over frozen M, and the collection form against R-SIM-43 (a collection-valued `.[x]`). Alfonso's ratification C: Phase 1 now, no amendment before MODELS.

Read the backlog report with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§4.1 S3, §5 wave 1, §8 C) and Alfonso's answers in `git show sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md`. 

## DOVE

Read-only: `frontend/src/model/simulation/derivedEvaluator.ts`, `guardContext.ts`, `actionEvaluator.ts` and their tests, the JjEL evaluation entry points they call, `docs/decisions.md` (R-SIM-43, R-SIM-74). Write: `docs/discovery/discovery_2026-09-27_sim_derived_recursion.md` (new), one entry in `docs/log-inbox/simulation.md`, this prompt's Status flip. Probes, if any, gitignored `_tmp_recur_*`, on port 3021 only.

## COME

1. Read `CLAUDE.md`, the report sections, the ratification memo, the R- rows and the files.
2. Show where the recursion is refused and why; build the per-(element, attr) graph on paper against two or three realistic models (a tree size, a linked list length), with cycle detection; measure the cost of the graph on the demo presets with a probe if needed; state the exact amendment text R-SIM-74 and R-SIM-43 would need.
3. Report: objective, files read, findings with file:line, measurements where a probe helps, design options with files, tests, R- rows touched and risk to the four demo presets, the recommended Phase 2 lane(s) with their file sets, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
4. One docs commit with the report, the log entry and the Status flip: `docs(sim): well-founded recursion in derived attributes discovery (P-2026-09-27-1727)`.
5. `Outcome: hard-stop` with the sha.

Never: an edit under `frontend/src`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3021.

## RIFERIMENTI

- Backlog report (above), the ratification memo; `docs/PROTOCOL.md` P13, P14, P16; RC-22, RC-25, RC-26.
