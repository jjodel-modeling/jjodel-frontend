# log-inbox — lane «endpoints» (#186)

Entries written by the #186 Endpoints lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-16 — feat(#186): the Endpoints window and its app bar menu
**Prompt**: `claude_2026-10-14_1101_prompt_186_endpoints.md`, full lane, director Juri (chat `C-2026-10-14-1020`), step 3 of the #166 plan (R-CFG-4). Phase 2 built an ENDPOINTS section on the project page; Juri's visual check rejected its placement («deve stare in un menu dedicato»), R-CFG-5: a dedicated window opened from an «Endpoints» menu of the top app bar (items «Editable metaclasses», «Roles»), the left bar and Tools › «Configure Environment...» opening it too. The rest stood: no write at mount, the config at the first write, «Role» in the UI, the fold.
**Files touched**: report `68eaecbf6`. `5d88838f2`: `frontend/src/components/project/endpointsModel.ts`, `.../project/__tests__/endpointsModel.test.ts` (new). `0f90bee15`, `3b84117d7`: `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `.../steps/ProfilesStep.tsx`. `0179876d5` (the section), `896833e2f` (the window): `frontend/src/components/project/EndpointsWindow.tsx`, `EndpointsWindow.scss` (renamed from `EndpointsSection.*`), `ProjectEditor.tsx`, `frontend/src/pages/components/Navbar.tsx` (the menu array only). Docs: this inbox, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-10-14 11:01
**Causa**: (f)
**Regressions**: no — measured: probe `_tmp_186_probe.ts` `MODE=after` on 3186, 40/40 PASS, no page error, against the BEFORE oracle of `2ce07f7fa` (the same raw `typePermissions` `["Phase=hidden"]` and the same link after the same gestures); `scripts/smoke/run.ts` GREEN 12 passed, 0 failed, 3 skipped; typecheck exit 0, no `error TS`; vitest 9045 passed in 362 files, the nine known files red at import and nothing else; build exit 0; check:docs 5/5, check:addonly and check:scripts green. Not measured: the wizard itself (now unreached).
**Out-of-scope changes**: no — eight code files, above the five of rule 19, all in the lists of the Phase 2 GO and of the rework prompt.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO of 2026-10-17, in his browser on this tree's server (port 3186): the Endpoints menu, the window, its tabs, Done/Escape, the three doors and the stand-alone link on the ScenarioMM fixture; before it the chat's independent probe `chat_186b_independent.mts`, 9/9, no page error. `scripts/smoke/run.ts` GREEN (12/0/3); the lane's probe read from the DOM: no Endpoints block on the project page; the «Endpoints» menu after Tools in Basic and Advanced, absent on the dashboard and in consumer mode; each item opens the window on its tab, on top at the pixel; the left bar (also from the instance manager tab) and Tools (from the metamodel editor) open it on Editable metaclasses; opening writes nothing; «Done» saves and closes, Escape and the backdrop close without a save.
**Notes**: BEFORE (measured): mounting either step created an empty config and one undo entry, flag unchanged. AFTER: the first write creates the config (one undo entry). The window wears the wizard's modal classes; the event `OPEN_WIZARD` carries `detail.tab`, no new constant. Mutation bench 7/7 killed on the fold helper (`5d88838f2`). The window and the steps do not import under node: the probe is their measure. Report: `docs/discovery/discovery_2026-10-14_186_endpoints.md`.
**Prompt document name**: 2026-10-14 11:01

**Ticket** (P-2026-10-14-1101, measured): `components/ui/Checkbox/Checkbox.tsx:54-68` renders `<label htmlFor={id}>` with `id` undefined when no `id` is passed, so the checkbox button has no accessible name and a click on the label does not toggle it. Every row of «Editable metaclasses» is such a checkbox; the probe had to find the box by its row's label text. Not fixed here (outside DOVE).

## 2026-10-17 — merge: feat/186-endpoints takes staging (P-2026-10-17-1032)
**Prompt**: `claude_2026-10-17_1032_prompt_feat-186-endpoints_take_trunk.md`, trunk into branch rendered by `lane-run merge --trunk-into`, session `7c0a6cce`: `staging` at `f7d0d1d7c` into `feat/186-endpoints` at `cd8f34c68` (pre-merge tip `790cf6ad0`), merge base `358a91da3`, 10 commits on the trunk side (#187 Configurator panel and its merge), 9 on the branch side, before the trunk takes the branch (RC-14).
**Files touched**: merge `348deae2a`: 14 files from the trunk side (`docs/discovery/discovery_2026-10-14_187_configurator_panel.md`, `docs/log-inbox/configurator-panel.md`, the two #187 prompts, `frontend/src/components/environment/ConfiguratorTab.tsx`, `configuratorTab.scss`, seven files under `components/environment/configurator/`, and `frontend/src/pages/components/Navbar.tsx`, auto-merged); nothing by hand. This commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `348deae2a`: typecheck exit 0, no `error TS`; typecheck:scripts exit 0; vitest 9072 passed in 372 files (the trunk's 9064, measured read-only in the main tree, plus the 8 of `endpointsModel.test.ts`), 0 failed, the same 9 files red at import; hooks 681 (trunk 681, branch 0 new); build exit 0; check:docs 5/5; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 21/21 on `348deae2a` (this branch's vite on port 3186): `chat_186b_independent.mts` 9/9 (Endpoints menu, window, tabs and keyboard, Escape, Done saves, left-bar door, fold, stand-alone link) and `chat_187_independent.mts` 12/12 (the trunk side's Configurator panel, developer overlay and role Edu), no page error; the yes to merge is Juri's, 2026-10-17.
**Notes**: merge-tree zero conflicts; union: none (`decisions.md` on the branch side only, each inbox on one side). Step 5: `Navbar.tsx` read whole, the two sides in disjoint regions (the Endpoints menu entry, the `!consumer` gates of the right header), no duplicate. The prompt expected check:docs 4/4: the gate has five checks since `73af7bbac` (Check E), and the trunk tip gives 5/5 too.
**Prompt document name**: 2026-10-17 10:32

## 2026-10-17 — merge: feat/186-endpoints into staging (P-2026-10-17-1047)
**Prompt**: `claude_2026-10-17_1047_prompt_merge_feat-186-endpoints.md`, a direct merge by `lane-run merge --direct`, no session: `feat/186-endpoints` at `b39397d2e` into `staging`, merge base `f7d0d1d7c`, 12 commits on the branch side.
**Files touched**: merge `df67afbf5`: 13 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-14_186_endpoints.md`, `docs/log-inbox/endpoints.md`, `docs/prompts/claude_2026-10-14_1101_prompt_186_endpoints.md`, `docs/prompts/claude_2026-10-17_1032_prompt_feat-186-endpoints_take_trunk.md`, `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `frontend/src/components/envgen/steps/ProfilesStep.tsx`, `frontend/src/components/project/EndpointsWindow.scss`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `df67afbf5` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9072 tests in 372 files, 9 red at import, hooks 681; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: passato — chat, unattended, 21/21: the merged tree differs from 348deae2a only by docs (git diff --name-only b39397d2e staging: the merge prompt and the closure docs), where the chat ran chat_186b_independent.mts 9/9 and chat_187_independent.mts 12/12 on port 3186, no page error; Juri's visual GOs of 2026-10-17 were given on the two lane trees
**Notes**: Rollback tag `pre-feat/186-endpoints` on `f7d0d1d7c` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-17-1047/result.json`.
**Prompt document name**: 2026-10-17 10:47
