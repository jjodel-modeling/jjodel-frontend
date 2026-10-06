# Log inbox — merge gate (P-2026-09-19-1622)

Entries for the merge-gate lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.


## 2026-10-02 — ticket: a lane removes the node_modules symlink the direct merge needs later

**Ticket**: Lane P-2026-10-02-2045 linked `frontend/node_modules` in `~/jjodel-w-vpglyph` to run its gates and removed the link at the end. The direct merge P-2026-10-02-2315 then ran the incoming vitest gate in that worktree, found no vitest (`sh: vitest: command not found`), wrote no report and stopped at `Outcome: blocked` before any merge commit. The chat restored the link and reran the merge as P-2026-10-02-2330 (green, merged `e2e4fbc35`). Fix options: `lane-run merge --direct` checks or creates the worktree link before the incoming gate, or lanes keep the link (it is gitignored).
**Priority**: low
**Found in**: P-2026-10-02-2315 (chat C-2026-10-01-2220)

## 2026-10-03 — fix: lane-run links node_modules for direct gates, warns on unflipped Status (P-2026-10-03-1631)
**Prompt**: `claude_2026-10-03_1631_prompt_lane_run_hygiene.md`: the direct merge worker checks `frontend/node_modules` in every tree it runs a gate in, links it when missing (ticket above) and removes the link after the gates (P14); `lane-run status` warns when a lane exited on done or hard-stop and its prompt still reads `Status: da eseguire` (P-2026-10-02-1718, P-2026-10-03-0050).
**Files touched**: `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts` (`d414c934d`); this commit: the prompt's Status and this entry.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 23:30 (`claude_2026-09-27_2330_prompt_harness_lane_efficiency.md`, the direct worker that assumed node_modules)
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests first, 8 red before the fix; mutation bench 20/20 killed (commit body). Measured, unchanged: `trunk-into-branch.md` already carries the flip clause in step 9 in the words of `merge-into-trunk.md`, and `merge --trunk-into --direct` already flips in `go`; the two prompts stayed unflipped because no GO followed their hard-stop. Dry render of `merge --trunk-into lane-run-hygiene` showed step 9; its pending file was deleted.
**Prompt document name**: 2026-10-03 16:31

## 2026-10-03 — merge: lane-run-hygiene into alfonso-frontend-jjtl (P-2026-10-03-1650)
**Prompt**: `claude_2026-10-03_1650_prompt_merge_lane-run-hygiene.md`, a direct merge by `lane-run merge --direct`, no session: `lane-run-hygiene` at `ec5d412cb` into `alfonso-frontend-jjtl`, merge base `d2a1866b6`, 3 commits on the branch side.
**Files touched**: merge `ac601d867`: 5 files from the branch side (`docs/log-inbox/merge-gate.md`, `docs/prompts/claude_2026-10-03_1631_prompt_lane_run_hygiene.md`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts`, `frontend/scripts/lane-run.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ac601d867` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6979 tests in 277 files, 9 red at import, hooks 352; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: scripts-only harness change, no app code; eight gates of the direct worker green (vitest 6979, typecheck 14 baseline, build 0), 3001 up
**Notes**: Rollback tag `pre-lane-run-hygiene` on `d2a1866b6` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1650/result.json`.
**Prompt document name**: 2026-10-03 16:50
