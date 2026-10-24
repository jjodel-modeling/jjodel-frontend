# log-inbox — lane «jjodie-ui-fmt»

Entries written by the JjScript formatter lane (front jjodie-ui, branch `jjp-fmt`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: jjscript formatter that breaks long create lines before in
**Prompt**: P-2026-10-24-0405: a pure JjScript formatter, one command per line, breaking a long `create instance of X "n" in a.b` before `in`; check whether the parser takes the continuation, else display only as `formatForDisplay`; tests first, mutation bench of at least four mutants.
**Files touched**: frontend/src/jjscript/formatter.ts, frontend/src/jjscript/__tests__/formatter.test.ts (dbef14d8b); docs/log-inbox/jjodie-ui-fmt.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Display only: executeScript parses one line per command and a lone `in a.b` falls through to a JjEL eval, so `formatForDisplay` is exported and used by nobody; no grammar change (R-JJD-4). AST test folds the continuation back: equal text and equal per-line ASTs on every fixture. Bench 8/8 killed after adding three fixtures (block comment, quote skip, instance guard). Gates: typecheck 0, vitest 11887 passed with the 9 known §17 import failures, build 0.
**Prompt document name**: 2026-10-24 04:05
