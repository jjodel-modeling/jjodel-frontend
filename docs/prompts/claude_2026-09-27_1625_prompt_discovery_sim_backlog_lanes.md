# Prompt: discovery, the simulator backlog cut into parallel lanes

Prompt-ID: P-2026-09-27-1625
Chat: C-2026-09-27-1437
Lane: full (Phase 1 discovery, read-only; hard stop at the report)
Status: eseguito 2026-09-27 · lane simulation-engine · the commit of this line (docs-only discovery: report, entry and flip in one commit)

Worktree: `~/jjodel-sim`, branch `simulation-engine`, fast-forwarded by the chat to `alfonso-frontend-jjtl` at `2b1b346da` plus this prompt's commit, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso wants as much of the simulator finished as possible, in parallel. Two lanes run now: E1 (P-2026-09-27-1610, `~/jjodel-icons`: `netTypes.ts`, `netCompile.ts`, `netStep.ts` and their tests) and E2 (P-2026-09-27-1611, `~/jjodel-open`: `simRoleStatus.ts`, `SimulationPanel.tsx`, `stcFromRoles.ts`, `modelMarkings.ts`, a new exploration module). This discovery prepares the next wave: every open simulator item, cut into lanes with disjoint file sets, so the chat can launch them the moment E1 and E2 free their files.

The open items (collect them all; this list is a start, not the whole): a failed presentation equation is not surfaced; the containment recursion limit of R-SIM-74; the outputs lane R-SIM-76; «Kept: Node» proposals derived from the binder's Node; «Clear bindings»; the modal lane (user profiles); enum step B (model invariant plus Ecore import); scroll the new declarations row into view and select a prefilled cell on focus (ticket of P-2026-09-27-1500); the `∅` glyph legibility; G3 canvas side (token counts on the nodes). Sources: `docs/log-inbox/simulation.md`, `docs/claude-code-log.md`, the discovery reports of 2026-09-26/27 under `docs/discovery/`, `docs/decisions.md` (R-SIM-*), the session checkpoints under `docs/sessioni/`.

## DOVE

Read-only: `frontend/src/model/simulation/**`, `frontend/src/components/editor-v2/sim/**`, the sources above, and any file an item names.

Write: `docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (new), one entry in `docs/log-inbox/simulation.md`, this prompt's Status flip. Nothing else.

## COME

1. Read `CLAUDE.md` and the sources; build the full list of open simulator items, each with its origin (file:line of the ticket).
2. For each item: what it is in one sentence, the files it touches (verified by reading, not guessed), the tests it needs, size (fast / full), whether it amends an R- row Alfonso ratified or touches the critical zone or R-SIM-4's core surface (then it goes to «Decisions awaiting Alfonso», RC-26), whether it changes what the MODELS demo shows, and its conflicts with E1's and E2's files.
3. Group the items into lanes so that lanes in the same wave have disjoint file sets. Wave 1: lanes that conflict with neither E1 nor E2 (launchable now). Wave 2: lanes that touch E1's or E2's files (after their merges). Give each lane a proposed branch name `sim-<slug>`, its file set, its gates, and whether its merge may land before the freeze of 2026-10-01 (only if it changes nothing the demo shows, or the chat's RC-23 check covers it).
4. Report sections: objective, sources read, the item table, the waves, risks, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
5. One docs commit with the report, the log entry and the Status flip: `docs(sim): backlog cut into parallel lanes (P-2026-09-27-1625)`.
6. `Outcome: hard-stop` with the sha and the list of wave-1 lanes (one line each: slug, files, size).

Never: an edit under `frontend/`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a dev server.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` (E1, E2 scope), `discovery_2026-09-27_sim_demo_readiness_2.md`, `discovery_2026-09-27_sim_demo_hint_path_trunk.md`, `discovery_2026-09-27_sim_profiles_panel.md`.
- `docs/decisions.md` R-SIM-4, R-SIM-74, R-SIM-76, R-SIM-78..81.
- `docs/PROTOCOL.md` P13, P16; RC-22, RC-25, RC-26.
