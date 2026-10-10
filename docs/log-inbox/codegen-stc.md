# log-inbox — lane «codegen-stc»

Entries written by the code generation S3 lane on `codegen-stc` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat(codegen): read-only accessor to the STC roles (P-2026-10-10-0901)
**Prompt**: `claude_2026-10-10_0901_prompt_codegen_s3_stc_access.md`, fast lane on `~/jjodel-w-codegen-stc`, branch `codegen-stc`: slice S3 of the pilot (R-GEN-7, discovery §D.4), a pure `stcAccess(lookup, modelId, handleOf)` giving a frozen view of the M1's STC, tests first on simulator fixtures, mutation bench.
**Files touched**: code `0ab88a4ae`: `frontend/src/codegen/stcAccess.ts` (new), `frontend/src/codegen/__tests__/stcAccess.test.ts` (new). This commit: `docs/log-inbox/codegen-stc.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npx tsc --noEmit` 14 before and after, the §17 set; stcAccess.test.ts 21/21 (red first, module absent); `src/model/simulation` 685/685; build exit 0. Bench 10/10 killed, no survivor (commit body).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Copied, not exported: `collectModelObjectIds`, `runBag`, `makeNetModelView` (no label), `storedProfile` (no `readable`); the tests compare each with its original. Choices: lists in lookup order (`compileNet`'s); source/target/trigger arrays; two Guards joined `(a) and (b)`, `else` verbatim; handles not frozen; Petri source/target `[]` (roles off), use `net`. Fixtures copied from simBridge.test.ts.
**Prompt document name**: 2026-10-10 09:01

## 2026-10-10 — merge: codegen-stc into alfonso-frontend-jjtl (P-2026-10-10-0927)
**Prompt**: `claude_2026-10-10_0927_prompt_merge_codegen-stc.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-stc` at `120145e74` into `alfonso-frontend-jjtl`, merge base `0c847329d`, 2 commits on the branch side.
**Files touched**: merge `c242ed7a3`: 3 files from the branch side (`docs/log-inbox/codegen-stc.md`, `frontend/src/codegen/__tests__/stcAccess.test.ts`, `frontend/src/codegen/stcAccess.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c242ed7a3` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7687 tests in 312 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: direct merge gates green: typecheck 14 = base, vitest 7687 tests in 312 files (9 red at import as base), build, check:docs/agents/scripts/addonly exit 0; textual slice, no visual change
**Notes**: Rollback tag `pre-codegen-stc` on `f87d4880a` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-0927/result.json`.
**Prompt document name**: 2026-10-10 09:27
