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

## 2026-11-01 — merge: jjtl-input-default into alfonso-frontend-jjtl (P-2026-11-01-0049)
**Prompt**: Bring `jjtl-input-default` at `45ad4cb3d` into the trunk `alfonso-frontend-jjtl` with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, union resolution of decisions and log inboxes if they conflict, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 02333c0d0 (5 files from the branch: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/__tests__/jjel-path-interactive.test.ts`, `frontend/src/jjtl/SPEC.md`, the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_0049_prompt_merge_jjtl-input-default.md` Status line; `docs/log-inbox/jjtl-input-default.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat on 3001, unattended: GO on gates; the real input dialog was not opened, the default reaching the host is covered only with the host mocked)
**Notes**: Tip did not move. Re-measured at 8ebcf6502: zero conflicts, tree 4028e38bb = index. No file on both sides, no union, 3 probes as expected. Gates on 02333c0d0: typecheck 0, typecheck:scripts 0; vitest 12587 = 12583 + 4 new, 471 files, same 9 red at import; hooks 967; build 0; check:docs 5/5 (prompt said 4/4); agents, scripts, addonly PASS. Lane board untouched; 3001 up.
**Prompt document name**: 2026-11-01 00:49
