# log-inbox — lane «jjtl-nested-interactive» (P-2026-11-01-0110)

Entries written by the JjTL nested-interactive lane (front release-3-2) on branch `jjtl-nested-interactive`,
worktree `jjodel-w-nestedinteractive`. Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim
and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-01 — fix(jjtl): nested interactive calls warn on both paths; SPEC input kinds (P-2026-11-01-0110)
**Prompt**: a prompt/confirm/input nested in an expression yields null with the JjEL-path warning on the legacy path too, nothing awaited, test on both paths; SPEC §8.3 and Appendix A name the input kinds the parsers accept, Prompt/Input leaves «Not Tested».
**Files touched**: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/__tests__/jjel-path-interactive.test.ts` (8ee42b697); `frontend/src/jjtl/SPEC.md` (eaa44fad0); this inbox, prompt file Status line
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (host mocked in tests; no dialog to open, the nested case opens none)
**Notes**: Legacy was not null: the bridge made the call a null literal, so "x"+prompt gave "x", not confirm gave true. Now the whole expression is null on both paths. Text copied verbatim, «(JjelExpression)» included. SPEC §3.5 rewritten too (stale after the fix). Bench: guard off kills the 4 new tests. Gates: tsc 0 (first run exit 1, no error line, 2 reruns 0); vitest src/jjtl 363 = 359+4, 7 red at import; build 0.
**Prompt document name**: 2026-11-01 01:10

## 2026-11-01 — merge: jjtl-nested-interactive into alfonso-frontend-jjtl (P-2026-11-01-1441)
**Prompt**: Bring `jjtl-nested-interactive` at `bac611e62` into the trunk `alfonso-frontend-jjtl` with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, union resolution of decisions and log inboxes if they conflict, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit fcc465991 (5 files from the branch: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/__tests__/jjel-path-interactive.test.ts`, `frontend/src/jjtl/SPEC.md`, the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_1441_prompt_merge_jjtl-nested-interactive.md` Status line; `docs/log-inbox/jjtl-nested-interactive.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat on 3001, unattended: GO on gates; nested interactive calls open no dialog, the warning is covered with the host mocked)
**Notes**: Tip did not move. Re-measured at d5c667cc4: zero conflicts, tree 0d26b5314 = index. No file on both sides, no union, 1 probe as expected. Gates on fcc465991: typecheck 0, typecheck:scripts 0; vitest 12591 = 12587 + 4 new, 471 files, same 9 red at import; hooks 967; build 0; check:docs 5/5 (prompt said 4/4); agents, scripts, addonly PASS. Lane board untouched; 3001 up.
**Prompt document name**: 2026-11-01 14:41
