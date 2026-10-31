# log-inbox — lane «jjtl-expr-resolve» (P-2026-10-31-1340)

Entries written by the JjTL source-collections lane (front release-3-2) on branch `jjtl-expr-resolve`,
worktree `jjodel-w-jjtlexpr`. Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim
and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — fix(jjtl): source references resolve in expressions, alias in nested bodies (P-2026-10-31-1340)
**Prompt**: In a JjTL rule, a JjEL expression read a source reference collection as raw `{ __ref }` wrappers (`requirements.first().kind` null, no warning); the rule alias was unbound inside forall bodies; `exists` did not parse in a forall `such that`. Two-phase: discovery, then fix in the executor.
**Files touched**: `docs/discovery/discovery_2026-10-31_jjtl_expression_source_collections.md` (2a0373896); `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/executor/__tests__/source-collections-in-expressions.test.ts` (new, 19 tests) (636d465c0); `docs/log-inbox/jjtl-expr-resolve.md`, prompt file Status line
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (executor and parser only, no UI)
**Notes**: Gates: tsc 0, build 0, src/jjtl 176 passed (157 before + 19), same 7 files fail at import (window is not defined) before and after. With joiner mocked by a temp config the suite shows the same 2 pre-existing failures before and after. Mutation bench in 636d465c0. Regressions unknown: the 7 suites do not collect. Parked for Alfonso: useJjtlParser passing source (app-wide JjEL, exists in app); let variables in nested bodies.
**Prompt document name**: 2026-10-31 13:40
