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

## 2026-10-31 — merge: jjtl-expr-resolve into alfonso-frontend-jjtl (P-2026-10-31-1508)
**Prompt**: Bring `jjtl-expr-resolve` at `2d85e6ed0` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 7227828c4 (6 files from the branch: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/executor/__tests__/source-collections-in-expressions.test.ts`, the 1340 discovery report, prompt and this inbox file); `docs/prompts/claude_2026-10-31_1508_prompt_merge_jjtl-expr-resolve.md` Status line; `docs/log-inbox/jjtl-expr-resolve.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (executor and parser only, no UI; GO from chat on the gates)
**Notes**: Merge-tree measured again: zero conflicts, no file on both sides, no governance file; no union resolution; probe once. Gates on 7227828c4: typecheck 0 and typecheck:scripts 0 (no error TS); vitest 12303 passed, 459 files, 9 known red at import, as expected (trunk 12284/458 + branch 19/1); hooks 967; build 0; check:docs 5/5 (the prompt said 4/4, gate E was added since); check:agents, check:scripts, check:addonly PASS.
**Prompt document name**: 2026-10-31 15:08
