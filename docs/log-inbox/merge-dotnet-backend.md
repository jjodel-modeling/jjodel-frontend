# log-inbox — lane «merge-dotnet-backend»

Entries written by the chat merge of `origin/dotnet-backend-integration` into `staging`
(C-2026-10-29-1805), main tree. Whoever closes the batch moves them into `docs/claude-code-log.md`
**verbatim and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-29 — merge: origin/dotnet-backend-integration into staging (C-2026-10-29-1805)
**Prompt**: Juri in chat, no prompt file: «fai il merge su staging di dotnet-backend-integration», then «ok fai il push». `origin/dotnet-backend-integration` at `5fbfb68aa` into `staging` at `ead81b47e`, merge base `3da1d6348` (PR #191). The branch side is `alfonso-frontend-jjtl` up to `3addb64cf` (PR #195): 919 commits, no commit of its own beyond the PR merges.
**Files touched**: merge `5dbd55dc7` (pushed, `ead81b47e..5dbd55dc7`): 925 files from the branch side, nothing by hand; git auto-merged `docs/decisions.md` and `frontend/src/joiner/classes.ts`. This commit: this inbox, new.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on the merged tree: typecheck exit 0; build exit 0, chunk-size warning only; check:docs 5/5; check:agents aligned; vitest 12096 passed, red the 9 known import files and `bashGuard.test.ts` (32, it reads the live `MERGE_HEAD`), 160/160 after the commit. No visual probe run.
**Out-of-scope changes**: no — 925 files, above five (RC-11, rule 19), all from the branch side: mostly `docs/prompts/`, `docs/discovery/`, `docs/log-inbox/`, `frontend/src/`, `frontend/scripts/`, `tack/`, `tools/`. No new dependency: `frontend/package.json` adds the `prebuild` and `oracle:bv` scripts.
**Layer Impact Report**: skipped — the merge carries a change to `useJjomSync.ts` (37+/76-) authored on Alfonso's line; no report written in this chat.
**Smoke visivo**: non applicabile — not run on the merged tree.
**Notes**: No gate report in `docs/discovery/` (RC-14): text merge clean, no semantic conflict to resolve on the branch. No rollback tag; the pre-merge tip is `ead81b47e`. Local branch `dotnet-backend-integration` is stale at `73307b7ed` (2817 behind origin), left untouched.
**Prompt document name**: 2026-10-29 18:05
