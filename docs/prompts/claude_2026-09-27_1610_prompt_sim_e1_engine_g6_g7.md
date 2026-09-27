# Prompt: E1, the engine reads the activity final (G6) and resolves `else` over fused transitions (G7)

Prompt-ID: P-2026-09-27-1610
Chat: C-2026-09-27-1437
Lane: full (Phase 2 of P-2026-09-27-1545; more than 3 files; no critical zone, no visual check: the readiness Flow probes replace it)
Status: da eseguire

Worktree: `~/jjodel-icons`, branch `sim-e1-engine` (cut by the chat from `sim-post-models-engine` at `f60a0f0b2`, which carries the discovery report and Alfonso's answers), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-e1-engine`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Implement lane E1 exactly as `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` §5.2 item 1 defines it: G6 (§2.3 minimal change, §2.4 tests, §2.5 R- rows) then G7 (§3.3, §3.4, §3.5, with `else-position` as a new union literal, Rule 11). Alfonso answered B no (§7): R-SIM-31(1) stays as written, the two inexpressible positions are the defect `else-position`. The report's sketches were run in `/tmp/p1545/patched/` and its tests in `/tmp/p1545/g6g7.test.ts`: if those files still exist, read them as the reference; the report is the spec either way.

Chat decision, unattended (RC-25): the schedule «from 2026-10-05» is dropped because the harness runs unattended; E1 changes nothing on the four demo presets (report §2.6, §3.6: Flow B's trace identical line by line), so it may reach the trunk before the freeze of 2026-10-01 once its gates and the Flow probes are green.

## DOVE

- `frontend/src/model/simulation/netTypes.ts`, `netCompile.ts`, `netStep.ts` (the three engine files).
- Tests: `netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts` (the source-text test at lines 74-79 that pins the key as unread moves with G6), optionally `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` (the fused-`else` explanation, report §5.1 risk 4).
- The comment in `roleCatalog.ts` that says the key is unread.
- `docs/decisions.md`: the R- rows of §2.5 and §3.5 (new rows or amendments of rows the chat wrote; none of Alfonso's ratified rows changes: B is no), marked `provisional, unattended` per RC-25.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: `simRoleStatus.ts`, `SimulationPanel.tsx`, `stcFromRoles.ts`, `modelMarkings.ts` and any new module (lane E2 runs in parallel on those files in `~/jjodel-open`), every critical-zone file, the demo script.

## COME

1. Read `CLAUDE.md`, the report §2, §3, §5, §6, §7, §9, and the three engine files whole.
2. Baseline from `frontend/`: typecheck (14 known errors); vitest on `src/model/simulation` and `src/components/editor-v2/sim` (counts, 0 failed).
3. G6: tests first (red on the tree, say how many), then the change of §2.3, then green. Commit 1: `feat(sim): the engine reads the activity final (G6) (P-2026-09-27-1610)`.
4. G7: tests first (red), then §3.3, then green. Commit 2: `feat(sim): else resolved over fused transitions, else-position defect (G7) (P-2026-09-27-1610)`.
5. Mutation bench on the ten mutants of report §9: each killed by the new tests; say the count.
6. Gates: typecheck (same 14), vitest green with baseline plus the new tests, build exit 0, `check:docs`, `check:scripts`.
7. Flow probes: re-run the readiness Flow A, B and C probes (`_tmp_demo2_flow*` in `~/jjodel-sim/frontend/scripts/smoke/`, copied read-only as `_tmp_e1_*`), dev server from this tree on port 3015 (never 3000-3006, 3010-3014). Flow B's trace must be identical line by line to the readiness-2 reading; Flow C must end `Terminated`. Report both.
8. Docs commit: R- rows, log entry, Status flip.
9. `Outcome: done` with the three shas, the counts before and after, the mutant count, and the two Flow readings.

Stop with `Outcome: question` and a `Recommended:` line if a change would reach a file of E2's DOVE, if Flow B's trace differs from readiness-2 in any line, or if a test outside `sim/` and `model/simulation/` turns red.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3015.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` (whole; §5.2 item 1 is the mandate).
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §4 (Flow readings), §12 (probes).
- `docs/decisions.md` R-SIM-31, R-SIM-52, R-SIM-53, R-SIM-70, R-SIM-78; Rule 11.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-21, RC-25, RC-26.
