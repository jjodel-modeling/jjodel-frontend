# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-10-02 — discovery: the simulator's state UI, R-SIM-102..107 and 109 (P-2026-10-02-2340)
**Prompt**: `claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md`, heavy tier, read-only on `~/jjodel-w-simstate`, branch `sim-state-disc`: where the inspector docks, the `.smv` preview, «Written by»/«Read by», kept configurations, viewer preferences, the «Data» label, the demo per lane; a Phase 2 plan of at most three lanes.
**Files touched**: `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (new), the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (docs only; the benches are gitignored `_tmp_*` under `frontend/scripts/smoke/`)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Benches on the four demo exports reproduce the script's readings word for word. Kept configurations about 100 B each (100 KiB for 1000), 3.2 KB on a 62-global σ; replay 3-13 µs a step, equal to live 4/4; the trace lacks input values. Inspector: a floating card beside the panel. Preview dropped. Lanes A ∥ B, then C. Report §0, §8.
**Prompt document name**: 2026-10-02 23:40

## 2026-10-03 — merge: sim-state-disc into alfonso-frontend-jjtl (P-2026-10-03-0032)
**Prompt**: `claude_2026-10-03_0032_prompt_merge_sim-state-disc.md`, a direct merge by `lane-run merge --direct`, no session: `sim-state-disc` at `fece79bc3` into `alfonso-frontend-jjtl`, merge base `872d0abe8`, 3 commits on the branch side.
**Files touched**: merge `6dc5fdc4b`: 4 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_sim_state_ui.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6dc5fdc4b` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6695 tests in 268 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only: rows R-SIM-102..109 and two discovery reports; no code on the branch
**Notes**: Rollback tag `pre-sim-state-disc` on `7c9ae4e0d` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0032/result.json`.
**Prompt document name**: 2026-10-03 00:32

## 2026-10-03 — feat: the run model of the simulator's state UI, Lane A (P-2026-10-03-0040)
**Prompt**: `claude_2026-10-03_0040_prompt_sim_state_model.md`, heavy tier, `~/jjodel-w-simmodel` on `sim-state-model`: §8.1 and §8.4 of the state UI discovery and the R-SIM-108 reader; inputs on the trace, kept configurations and replay, the viewed step, the face's builders, `simViewerPrefs.ts`, `presentationOf` and `getSimPresentation`. Tests first, mutation bench, no visual change.
**Files touched**: `14311a636`: `sim/simRunState.ts`, `sim/simViewerPrefs.ts` (new), `sim/simBridge.ts`, `sim/simCanvasState.ts`, `model/simulation/netStep.ts`, and their tests `simRunState`, `simBridge`, `simCanvasState`, `simViewerPrefs` (new), `netStep`; the prompt's Status and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (ten code files, all in the prompt's DOVE, which confirmed them under rule 19)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: configAt and withInputs live in simRunState.ts, not simBridge.ts as the discovery placed them: the store's viewed reads need them and simBridge imports the store. Mutation bench 53/56, the 3 survivors equivalent (view deletes behind viewedOf's identity check). Readings of the four scenes identical to the base tree; replay equal to kept 30/30. Propagation of discovery §4: isSimActive feeds ReadCtx.isMarked, so a viewed step reaches IR views once Lane C sets one.
**Prompt document name**: 2026-10-03 00:40

## 2026-10-03 — merge: sim-state-model into alfonso-frontend-jjtl (P-2026-10-03-0114)
**Prompt**: `claude_2026-10-03_0114_prompt_merge_sim-state-model.md`, a direct merge by `lane-run merge --direct`, no session: `sim-state-model` at `6ae536200` into `alfonso-frontend-jjtl`, merge base `fece79bc3`, 3 commits on the branch side.
**Files touched**: merge `2a60dbd3d`: 12 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_0040_prompt_sim_state_model.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simCanvasState.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRunState.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simViewerPrefs.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/components/editor-v2/sim/simCanvasState.ts`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2a60dbd3d` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6764 tests in 270 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no visual change: Lane A is pure; gates green (typecheck 14 = baseline, 6764 tests, build, docs, agents); demo readings identical per the lane
**Notes**: Rollback tag `pre-sim-state-model` on `47d6dc97d` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0114/result.json`.
**Prompt document name**: 2026-10-03 01:14

## 2026-10-03 — feat: the M1 face, run inspector and canvas tags of the state UI, Lane C (P-2026-10-03-0120)
**Prompt**: `claude_2026-10-03_0120_prompt_sim_state_face.md`, heavy tier, Phase 2 Lane C on `~/jjodel-w-simface`, branch `sim-state-face`: report §8.3 as R-SIM-109 adopts it, R-SIM-104, 105, 106 (UI), 107, 109 and R-SIM-102 on the face and the canvas, rendering Lane A's builders; lane probe on the four demo exports; the chat's visual check, then its two fixes (the seed in the title only, Watch four rows with the globals by default).
**Files touched**: code `6eedc4bf3`, fixes `d7ff4f821`, `16539631f`: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `simulation-panel.scss`, `SimInspector.tsx` (new), `SimInspector.scss` (new), `SimNodeRunState.tsx`, `simNodeRunState.scss`, `SimCanvasLayer.tsx` (new). Demo `eb7d54c6b`, `d9e344274`: `docs/demo/models_2026_simulator_demo.md`. This commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Typecheck 14 errors, the §17 set, none in `sim/`; sim suites 978/978 in 28 files; build exit 0, chunk-size warning only; lane probe on 3068, light, 1600×1000, 138/138, the four scenes' readings line for line as the script's. Not run: Play, the reasons list, the dark theme.
**Out-of-scope changes**: yes — no file outside DOVE (ten files over six commits, above five, DOVE taken as the confirmation), but three scratch outputs (a typecheck log, two probe stdouts) were first written to `/tmp`, outside the worktree, then deleted; later ones went to the gitignored `frontend/scripts/smoke/`.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 GO 2026-10-03 on the fresh crops (status line with step and last step, seed in the title only; Watch at most four rows; panel, Marking chips, Events, inspector with the viewed step, trace, canvas tags and Inspect switch as checked at 02:31), after two fixes asked on the first crops (`16539631f`); lane probe 138/138 on 3068, light, 1600×1000; crops `docs/discovery/harness/_tmp_simface_*.png`, gitignored
**Notes**: Amends R-SIM-104 on the seed: in the status line's title only, as R-SIM-100 had it. Watch: the globals by default, at most four rows (`facePins`). The chat adopted the lane's four choices as recommended: the panel stays live while a step is viewed; closing the inspector or collapsing the panel returns to live; the canvas layer under the toolbar; the inspector clamped at 234 (MiniMap 202 px). Demo lines 62, 270, 403 also rewritten by Lane B: union at the second merge.
**Prompt document name**: 2026-10-03 01:20
**Ticket** (P-2026-10-03-0120): with the seed gone the last step still loses its tail in 184 px of status line: PEST and ESM by 23-71 px, Flow B's step 6 by 17 px, Petri's step 4 behind the Deadlock reason (61 px left); it reads whole in Petri's steps 1-3 and Flow B's 1-5. The title carries it whole; a perceptual item for Alfonso.
