# log-inbox — lane «jjtl-input-default» (P-2026-10-31-2245)

Entries written by the JjTL `input` default lane (front release-3-2) on branch `jjtl-input-default`,
worktree `jjodel-w-inputdefault`. Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim
and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — fix(jjtl): input(message, kind, default) passes the default; SPEC status notes (P-2026-10-31-2245)
**Prompt**: pass the evaluated default of `input(message, kind, default)` to `showInput` on both parse paths, with a test on the mocked host; rewrite the stale SPEC §3.5 and §8.3 notes saying prompt and input return null, and the Appendix A prompt comment.
**Files touched**: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/__tests__/jjel-path-interactive.test.ts` (8b0ab9d28); `frontend/src/jjtl/SPEC.md` (e7d38f515); this inbox, prompt file Status line
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (not run: host mocked in tests; the pre-filled default in the 3001 input dialog is unverified)
**Notes**: Both paths build one InputExpression node, one call site fixed. Test uses `"number"`: `input("Size?", EInt, 4)` does not parse, the kind is a string literal (parser.ts:833, :1507). Bench: undefined kills the 4 new tests. Gates: tsc 0; vitest src/jjtl 359 pass, 7 known red at import; build 0. Probe: nested prompt opens no dialog (JjEL warns, null; legacy null silently); notes say so. Alert/notify halves of the notes were stale too, rewritten.
**Prompt document name**: 2026-10-31 22:45

**Ticket** (P-2026-10-31-2245): SPEC §8.3 table and the Appendix A `input` comment name the kind `text`; the parsers accept `string`, not `text`. SPEC "Not Tested" still lists Prompt/Input execution. Left untouched, out of scope.
