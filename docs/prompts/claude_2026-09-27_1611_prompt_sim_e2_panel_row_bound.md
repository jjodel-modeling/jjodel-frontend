# Prompt: E2, the activity-final row in the panel (G6) and the Bound proposed by a bounded exploration (G12(b))

Prompt-ID: P-2026-09-27-1611
Chat: C-2026-09-27-1437
Lane: full (Phase 2 of P-2026-09-27-1545; more than 3 files; visual checklist run by the chat on the lane's crops, RC-23)
Status: da eseguire

Worktree: `~/jjodel-open`, branch `sim-e2-panel-bound` (cut by the chat from `sim-post-models-engine` at `f60a0f0b2`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `sim-e2-panel-bound`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Implement lane E2 as `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` §5.2 item 2 defines it:

- The G6 panel row: the activity-final key visible and clearable in Configure… General (report §2.5, §5.1 risk 1).
- G12 option (b): Apply proposes Bound from a bounded exploration of the reachable markings, guards aside, inhibitors and termination kept, unboundedness detected (report §4.2, tests §4.3, R- rows §4.4). Proposed only when the value is above 1; when the exploration does not close, the proposal is today's value with a title that says why. Alfonso answered A yes on 2026-09-27 16:05: this amends R-SIM-81(1), which he ratified; the amendment is his, write it as `ratified by Alfonso 2026-09-27`, not provisional.
- Report §5.1 risk 5 is binding: the exploration never runs inside a `useSelector`; memoise it on a signature of the net and cap it (the report's cap, or say the one you choose and why).

Lane E1 (P-2026-09-27-1610) runs in parallel in `~/jjodel-icons` on `netTypes.ts`, `netCompile.ts`, `netStep.ts`: this lane uses the engine as it is on its branch and never edits those three files. The two lanes meet at merge time; the merge lane re-runs the gates.

Chat decision, unattended (RC-25), after Alfonso's «procediamo» on dropping the post-MODELS schedule: E2 may reach the trunk before the freeze. It changes one thing the demo shows: the Petri proposal reads `Bound → 4` (report §4.4), which makes step 3 of the script redundant; the script update is a separate docs lane after the merge.

## DOVE

- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, `SimulationPanel.tsx`, `stcFromRoles.ts`, `frontend/src/model/simulation/modelMarkings.ts`, one new module for the exploration under `frontend/src/model/simulation/` (verify the name is free with a global grep first), and their tests.
- `docs/decisions.md`: the R-SIM-81(1) amendment (Alfonso's) and any new row of §4.4 (provisional, unattended).
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.
- Screenshots in `~/.jjodel-lanes/shots_e2/`.

Out of scope: `netTypes.ts`, `netCompile.ts`, `netStep.ts` and their tests (E1), every critical-zone file, every SCSS file unless the row needs a style (then only `simulation-panel.scss`, and say so), the demo script.

## COME

1. Read `CLAUDE.md`, the report §2.5, §4, §5, §6, §7, and the files of the DOVE whole. The probe of §4.2 (`/tmp/p1545/probe.ts`) is the reference if it still exists.
2. Baseline from `frontend/`: typecheck (14 known errors); vitest on `src/model/simulation` and `src/components/editor-v2/sim`.
3. G12(b): tests of §4.3 first (red), the module, the wiring into Apply's proposal with the memo and the cap, green. Measure the five nets of §4.2 through the new code and report the five values. Commit 1: `feat(sim): Bound proposed by a bounded exploration (G12) (P-2026-09-27-1611)`.
4. The G6 row: test first, the row, green. Commit 2: `feat(sim): activity-final row in Configure General (G6) (P-2026-09-27-1611)`.
5. Gates: typecheck (same 14), vitest green with baseline plus the new tests, build exit 0, `check:docs`, `check:scripts`.
6. Probe on port 3016 (never 3000-3006, 3010-3015), copied read-only from `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_petri.ts` and its common file as `_tmp_e2_*`: open the Petri preset, Apply, read the Bound proposal and its title, crop the proposal row; open Configure… General on the Flowchart preset, crop the activity-final row; then run the Petri scene with the proposed Bound and read that it no longer halts `unsafe` at step 2. Time the Apply click to the proposal on screen (ms).
7. Docs commit: decisions, log entry, Status flip.
8. `Outcome: hard-stop` with the shas, the five §4.2 values, the Apply timing, and the crop paths: the chat runs the visual check (RC-23) on the crops and gives the GO.

Stop with `Outcome: question` and a `Recommended:` line if a change would reach an E1 file, if the exploration cannot be kept out of render without an exported-interface change, or if Apply takes more than 100 ms on the demo net.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3016.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` (§5.2 item 2 is the mandate; §7 carries Alfonso's answers).
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §4 (Petri), §5 (G12), §12 (probes).
- `docs/decisions.md` R-SIM-79, R-SIM-81; Rule 11.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-21, RC-23, RC-25, RC-26.
