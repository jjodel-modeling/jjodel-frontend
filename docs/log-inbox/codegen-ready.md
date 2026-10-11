# log-inbox — lane «codegen-ready»

Entries written by the lane on `codegen-ready` that makes the oracle tests' in-process worker post `ready`
(P9, parallel lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this
order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — fix(codegen): the oracle tests' in-process worker posts ready (P-2026-10-11-1105)
**Prompt**: `claude_2026-10-11_1105_prompt_codegen_oracle_ready_fix.md`, light lane on `~/jjodel-w-codegen-ready`, branch `codegen-ready` cut from `28c9b0aad`: S5b × S6 on the trunk. `InProcessWorker` of the oracle fixture follows the S5b contract (posts `WORKER_READY`, holds a request sent before `ready`), so the five oracle tests that timed out at 15000 ms on the merged trunk run again.
**Files touched**: code `47a0d95a3`: `frontend/src/codegen/oracle/__tests__/exampleFixture.ts`. This commit: `docs/log-inbox/codegen-ready.md` (new).
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 20:29 (`claude_2026-10-10_2029_prompt_codegen_s6_oracle.md`: its fixture predates S5b's `ready`; red at the merge P-2026-10-11-1056)
**Causa**: (f)
**Regressions**: no. Base `npx vitest run src/codegen/oracle`: 5 failed | 20 passed, each timed out at 15000 ms. After: src/codegen 284/284 (16 files), src/model/simulation 692/692 (23 files); `npx tsc --noEmit` exit 2, 14 errors, the base set. Mutation (P11): fixture never posts `ready`, the same five fail; restored 25/25.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Causa (f): S5b changed the runner protocol in a parallel lane cut from the same base as S6; the merge was textually clean. Test helper only: `runner/`, product code, assertions and timeouts untouched. The queue of a request posted before `ready` is killed by no test: `runInWorker` posts only after `ready`, so the path is unreachable here (kept as the prompt asks, mirroring the runner's fake worker).
**Prompt document name**: 2026-10-11 11:05
