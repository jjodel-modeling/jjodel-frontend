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

