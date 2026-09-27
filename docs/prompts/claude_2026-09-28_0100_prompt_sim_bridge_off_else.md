# Prompt: the run skips roles that are off, and an else with no sibling becomes a defect

Prompt-ID: P-2026-09-28-0100
Chat: C-2026-09-27-1437
Lane: full (two tickets in the simulation bridge; no critical zone; four demo scenes re-run as the visual check)
Status: da eseguire

Worktree: `~/jjodel-w-bridge`, branch `sim-bridge-off-else`, cut by the chat from `alfonso-frontend-jjtl` at `2e4a09c78` (modal, halt line, enum step B and checker rules merged); `frontend/node_modules` symlinked (P14); a fresh session started by `lane-run`. Before anything else: `pwd` is that worktree, the branch is `sim-bridge-off-else`, `git log -1` is the commit that adds this file, `git status` is empty; otherwise `Outcome: blocked`.

## COSA

Alfonso set the chat to auto mode on 2026-09-28 at 00:07 and asked for the post-MODELS items now. Two tickets:

1. **Roles that are off are skipped by the run.** The Simulation roles modal (P-2026-09-27-1740, report `docs/discovery/discovery_2026-09-27_sim_modal.md`, the Phase 1 decision «skipping off keys in the run is a later simBridge lane») lets a role be `off` in a profile; the run still reads the bag key of an off role in some paths. Find every place where `simBridge.ts` (and what it calls to build the STC) reads a role key, and make an `off` role behave exactly as an unbound one. The validator already refuses a derived role whose source is off (`derivedFromOff`); do not change the validator. Quote the modal report lines that define the expected behaviour.
2. **`else` with no sibling.** Today an `else` guard on a transition with no sibling is silently always true (ticket from 2026-09-27; R-SIM-31 unchanged; the checker report `docs/discovery/discovery_2026-09-27_sim_checker_gap.md` §8 «Out of P2b» and §12 decision 1). Read §12 decision 1 first: if it says the choice is Alfonso's and no answer is recorded (search `docs/decisions.md` and `docs/ratifiche/`), stop with `Outcome: question` and a `Recommended:` line. If it is settled or recommends reporting it, add it as a defect at Reset through the P2b rules module `stcChecks.ts` (a new rule beside R1-R6, reason in the existing `CompileDefect.reason` union or a new literal added under Rule 11), without changing what the run does.

Out of scope: the panel (`SimulationPanel.tsx` and its SCSS), the modal files, every critical-zone file, the demo script unless a scene reading changes (then stop and ask).

## DOVE

`frontend/src/components/editor-v2/sim/simBridge.ts` and its test; the STC builder it calls for role keys (find it; say which); `frontend/src/model/simulation/stcChecks.ts` and its test (ticket 2); `docs/decisions.md` (a provisional, unattended row per ticket if the reports say one is owed; never amend a row Alfonso ratified); `docs/log-inbox/simulation.md` one entry; this prompt's Status. Verify any new identifier is free with a global grep first.

## COME

1. Read `CLAUDE.md`, the two reports' relevant sections, the files of the DOVE whole.
2. Baseline: typecheck (14 known), vitest on `src/model/simulation` and `src/components/editor-v2/sim`.
3. Ticket 1: tests first (a profile with each switchable role off, the run equals the same profile with the role unbound), then the change, green. Commit `fix(sim): roles that are off are skipped by the run (P-2026-09-28-0100)`.
4. Ticket 2: tests first, the rule, green; A0/G0 stay clean. Commit `feat(sim): else with no sibling is a defect at Reset (P-2026-09-28-0100)`.
5. Mutation bench: one mutant per changed branch; each killed.
6. Four demo scenes: copy read-only the P-2026-09-27-2105 probe as `_tmp_bridge_*`, dev server from this tree on port 3033 only; SM 10 steps Terminated, Petri Bound 4 and 4 steps Deadlock, ESM 10 steps domain halt, Flow B 6 steps Terminated; the Reset defect lines unchanged on the four presets. Any difference: `Outcome: question`.
7. Gates: typecheck same 14, full vitest, build exit 0, `check:docs`, `check:scripts`.
8. One docs closure commit (rows, log entry, Status). `Outcome: done` with the shas, counts, mutants and the four readings.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3033.

## RIFERIMENTI

`docs/discovery/discovery_2026-09-27_sim_modal.md`; `docs/discovery/discovery_2026-09-27_sim_checker_gap.md`; `docs/decisions.md` R-SIM-31, R-SIM-48, R-SIM-70, RC-31; `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-21, RC-25.
