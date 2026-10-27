# Prompt: fast fix, the panel explains state attributes under a profile without them

Prompt-ID: P-2026-10-03-1420
Chat: C-2026-10-02-2340
Lane: fast (two files, maybe a third for one style; a hint line in the panel and in the inspector; visual check by the chat). Tier: light.
Status: eseguito 2026-10-03 · lane sim-profile-hint · ff8e22e22, 1c4212b43 (after the chat's check: the hint wraps in two rows, `--halt` without `--line`, hint 41 px, transport row top 873 at Not started and after Reset) · SimulationPanel.tsx (`stateAccessHint`, a hint line where the Undeclared line sits) and SimInspector.tsx (optional prop `stateHint`, once at the top of σ); matched defect reason 'undeclared' only; typecheck 14 (the §17 set), sim suites 1020/1020, build exit 0, lane probe on 3073 (light, 1600×1000, DemoESM) 21 PASS 0 FAIL: State machine shows the line in the panel and the inspector, Extended state machine shows today's lines again; crops docs/discovery/harness/_tmp_simhint_*.png (gitignored) · verifica visiva della chat in attesa (RC-23) · non fuso

Worktree: `~/jjodel-w-simhint`, branch `sim-profile-hint`, cut by the chat from `alfonso-frontend-jjtl` at `764e00502`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-10-03: on a metamodel whose profile is «State machine» he looked for where to add state attributes and could not find it, then asked how to write guards without them. The panel never told him why. Read on the trunk at `764e00502`: under a profile whose `stateAttributes` mode is `'off'` (`modelDataOff`, `SimulationPanel.tsx` about line 1223) the panel hides the model's «State…» entry (about line 839) and empties the Undeclared line (about line 522), so a guard or an action that reads or writes `.[x]` leaves at most the compile-defects line, with no reason and no way out.

1. When the profile's `stateAttributes` mode is off and the compile defects of the run (`started.compileDefects`) contain state accesses, the panel shows one hint line where the Undeclared line sits:
   line: `«<profile name>» has no state attributes: use Extended state machine.`
   title: `The profile «<profile name>» has no state attributes, so <names> cannot be read or assigned. Choose Extended state machine (or a profile with state attributes) in the metamodel's Simulation roles.`
   `<names>` are the accessed paths as the user wrote them (`model.[coins]`, `self.[visits]`), at most four then `…`. Which defect reasons mark a state access under that profile (`'undeclared'`, `'declaration'`, or another one in the union of `simBridge.ts` about line 385) you read in the compiler and in `undeclaredGlobals`; do not guess, and report which reasons you matched. The profile's display name comes from the stored profile the panel already reads (`storedProfile(rawState).profile`).
2. The line reuses the classes of today's Undeclared line (`sim-panel__hint sim-panel__hint--line`) and carries no button: the model cannot fix it, the metamodel can. No new class unless one is needed; grep before naming one.
3. The run inspector says the same once, at the top of its σ section, when the same condition holds (one optional prop from the panel; the inspector computes nothing).
4. With `stateAttributes` on, nothing changes: the Undeclared line and «Declare in State…» behave as today. The compile-defects line itself is not touched.

## DOVE

Exactly: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/SimInspector.tsx`, and `frontend/src/components/editor-v2/sim/SimInspector.scss` only if the inspector's line needs a rule. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (design tokens only, BEM, grep before naming), P16, RC-17, RC-23, R-SIM-47..55 (profiles), R-SIM-94, R-SIM-103, R-SIM-105, and the files whole.
2. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the sim suites and `src/components/editor-v2/viewpoint/ir/__tests__/irActivityRender.test.ts`, `npm run build`. A unit test for the condition is welcome if the panel already has a pure helper beside it; do not create a test harness for the component.
3. Lane probe at 1600×1000, light theme (`lane-run probe`, port 3073, never 3001; kit `~/.jjodel-lanes/probe-kit/simgate/`, scenes `~/jjodel-demo-exports/`, never written): import DemoESM, switch its metamodel's profile to «State machine» in the probe session only, Reset on the model, check the line and its title in the panel and in the inspector; then back to «Extended state machine», Reset, check that the line is gone and today's behaviour is back. Crops as gitignored `docs/discovery/harness/_tmp_simhint_*.png`: panel and inspector under «State machine», panel under «Extended state machine».
4. Commits: code, then the closure docs commit. Stop with `Outcome: hard-stop` for the chat's visual check, with the shas, the matched defect reasons and the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

R-SIM-47..55 (catalog and profiles), R-SIM-94 (the model's state dialog), R-SIM-103 («State…»), R-SIM-105 (the inspector); Lane B P-2026-10-03-0041 and Lane C P-2026-10-03-0120.
