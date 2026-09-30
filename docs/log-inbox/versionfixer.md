# log-inbox — lane «versionfixer»

Entries written by the versionfixer lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-29 — fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)
**Prompt**: `claude_2026-09-29_2120_prompt_live_save.md`, lane F2 of discovery `a50fa6607` (side finding 1): `ProjectsApi.save` copied `project.__raw`, and the Cmd+S handler holds Navbar's last-render `LProject`, so a viewpoint added before Cmd+S was lost. Fix: copy `idlookup[project.id]`, VER2 unchanged; red first, probe 5/6 to 6/6.
**Files touched**: `041373870`: `frontend/src/api/persistance/projects.ts`, `frontend/src/api/__tests__/projectsSaveLive.test.ts` (new). This commit: `docs/log-inbox/versionfixer.md`, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. typecheck 14, the §17 set by file and code; typecheck:scripts exit 0; vitest 5872/5872 in 231 files as stated before the run, 9 red at import (the §17 list); build exit 0. Probe: the four S2 checks and the fresh-proxy control pass before and after.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Red/green: probe `_tmp_irfreeze_side.ts` on 3057, Cmd+S saved 5 vs 6 live then 6 vs 6, metamodel tab 7 vs 8 then 8 vs 8, SideVP3 now survives a reload; vitest 1 failed/4 passed then 5/5. Mutation bench 3/3 killed. Navbar untouched: every save path ends in `save`. Deviation: the bench restored `projects.ts` from a `/tmp` copy made and removed in this session, a write outside the worktree and not `git checkout HEAD` (RC-13-bis).
**Prompt document name**: 2026-09-29 21:20

## 2026-09-29 — ticket: save counters still read the caller's stale LProject
**Ticket**: `ProjectsApi.save` sets `viewpointsNumber`, `metamodelsNumber` and `modelsNumber` from `project.viewpoints` etc. on the caller's proxy, whose target is detached for Navbar's Cmd+S. Measured after F2 (`_tmp_livesave_counters.ts`): `+ New` then Cmd+S saves `viewpointsNumber` 4 against 5 for a fresh `LProject`, while the saved list is right (6/6). Display only: the dashboard card count. A fix reads the counters from a fresh `LProject`; four save tests mock `L` without `fromPointer`.
**Priority**: low
**Found in**: P-2026-09-29-2120

## 2026-09-29 — merge: live-save into alfonso-frontend-jjtl (P-2026-09-29-2140)
**Prompt**: `claude_2026-09-29_2140_prompt_merge_live-save.md`, a direct merge by `lane-run merge --direct`, no session: `live-save` at `d15c657c7` into `alfonso-frontend-jjtl`, merge base `5626b3364`, 3 commits on the branch side.
**Files touched**: merge `9ef223452`: 4 files from the branch side (`docs/log-inbox/versionfixer.md`, `docs/prompts/claude_2026-09-29_2120_prompt_live_save.md`, `frontend/src/api/__tests__/projectsSaveLive.test.ts`, `frontend/src/api/persistance/projects.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `9ef223452` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5872 tests in 231 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Non-visual persistence fix (save reads the live project). Chat checked result.json: all 8 gates green on 9ef223452 (typecheck 14 at the tip set, vitest 5872 tests 0 failed, build ok, check:docs/agents/scripts/addonly ok), 3001 up. Branch lane proved it with projectsSaveLive.test.ts (5 tests) and the side-finding probe 6/6. Unattended GO by the chat under Alfonso standing approval of F2 (2026-09-29 21:15).
**Notes**: Rollback tag `pre-live-save` on `5626b3364` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-2140/result.json`.
**Prompt document name**: 2026-09-29 21:40

## 2026-09-30 — fix(persistence): never store an empty state, open it as an error (P-2026-09-30-1540)
**Prompt**: `claude_2026-09-30_1540_prompt_empty_state_white_page.md`, Phase 1 and 2 in cascade: «DemoESM copy» stored with `state: ""` opened to a white page. Establish who writes an empty state on today's trunk and guard it; open such a project on the error screen; LeftBar and ProjectEditor tolerate an absent target; `TryComponent` must not loop.
**Files touched**: `c93ddb0fb`: `docs/discovery/discovery_2026-09-30_empty_state_white_page.md`. `28a98534e`: `frontend/src/api/persistance/projects.ts`, `frontend/src/components/forEndUser/Try.tsx`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/api/__tests__/projectsEmptyState.test.ts` (new), `frontend/src/components/forEndUser/__tests__/tryCatchOnce.test.ts` (new). This commit: this inbox, the report's Phase 2 addendum, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the baseline set; vitest 5922 passed, the 9 known files red at import; build exit 0; the four demo scenes open, save, reload intact (45/45), State machine runs to `Terminated`.
**Out-of-scope changes**: no — 9 files over three commits, each named by the prompt's DOVE (listed above).
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probes on 3061, light: error screen crop `_tmp_after_damaged_crop.png`, `<Try>` alone 1 catch; the chat's GO pending (RC-23)
**Notes**: Emptier: the in-editor favorite wrote the store entry (`state: ''`) over storage, 21850 -> 0 chars; no save path can. Q1-Q5 adopted as recommended (report §0). Mutation bench 16/16; the list filters measured in the browser, 4 throws off, 0 on. Petri, ESM, Flow B runs not re-scripted: no current walk probe on disk. Details: report addendum.
**Prompt document name**: 2026-09-30 15:40

## 2026-09-30 — ticket: Online favorite and tags PUT the editor's empty state
**Ticket**: `Online.favorite` and `Online.updateTags` send `new UpdateProjectRequest({...project})`, and from the editor `project` is the store entry with `state: ''` (`U.tsx:439`); the DTO carries `state` (`UpdateProjectRequest.ts:11`). The offline twin emptied the stored project (measured); the backend's reaction was not measurable in the lane.
**Priority**: medium
**Found in**: P-2026-09-30-1540
**Detail**: docs/discovery/discovery_2026-09-30_empty_state_white_page.md

## 2026-09-30 — ticket: the editor's Download exports an empty state
**Ticket**: `LeftBar.tsx` `exportProject` saves, then downloads `buildProjectExportJson(project?.__raw ...)`: in the editor `__raw` is the store entry with `state: ''`, so the file cannot be re-imported (`duplicateProject` parses the state). Read, not measured. Navbar's Download uses the value `save` returns and is not affected.
**Priority**: medium
**Found in**: P-2026-09-30-1540
**Detail**: docs/discovery/discovery_2026-09-30_empty_state_white_page.md

## 2026-09-30 — ticket: LProject.get_metamodels keeps absent targets
**Ticket**: `get_metamodels` (`classes.ts:3406`) returns `undefined` for a pointer no state holds, unlike `get_models` (`:3425`). LeftBar and ProjectEditor now filter it; `ConfiguratorTab` (via `LProject.classes`) still throws `object is not iterable`, caught once by `Try`. Measured with the `getOne` guard off; with it on, a damaged record never reaches the editor.
**Priority**: low
**Found in**: P-2026-09-30-1540
**Detail**: docs/discovery/discovery_2026-09-30_empty_state_white_page.md

## 2026-09-30 — merge: empty-state-guard into alfonso-frontend-jjtl (P-2026-09-30-1633)
**Prompt**: `claude_2026-09-30_1633_prompt_merge_empty-state-guard.md`, a direct merge by `lane-run merge --direct`, no session: `empty-state-guard` at `693dc86e5` into `alfonso-frontend-jjtl`, merge base `ecbc0e92c`, 4 commits on the branch side.
**Files touched**: merge `eb5c02928`: 9 files from the branch side (`docs/discovery/discovery_2026-09-30_empty_state_white_page.md`, `docs/log-inbox/versionfixer.md`, `docs/prompts/claude_2026-09-30_1540_prompt_empty_state_white_page.md`, `frontend/src/api/__tests__/projectsEmptyState.test.ts`, `frontend/src/api/persistance/projects.ts`, `frontend/src/components/forEndUser/Try.tsx`, `frontend/src/components/forEndUser/__tests__/tryCatchOnce.test.ts`, `frontend/src/components/project/ProjectEditor.tsx`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `eb5c02928` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5924 tests in 236 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: non-visual persistence guard: favorite and tags no longer write an empty state; a damaged record opens the error screen (lane probe 3061); four demo scenes 45/45; 8 gates green on eb5c02928; GO by the chat C-2026-09-30-1458, unattended
**Notes**: Rollback tag `pre-empty-state-guard` on `ecbc0e92c` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-1633/result.json`.
**Prompt document name**: 2026-09-30 16:33
