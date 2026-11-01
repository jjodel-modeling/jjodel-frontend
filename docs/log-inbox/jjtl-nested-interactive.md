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
