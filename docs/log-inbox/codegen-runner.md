# log-inbox — lane «codegen-runner»

Entries written by the code generation S4 lane on `codegen-runner` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat(codegen): JavaScript target profile and sandboxed runner (P-2026-10-10-0950)
**Prompt**: `claude_2026-10-10_0950_prompt_codegen_s4_runner.md`, full lane on `~/jjodel-w-codegen-runner`, branch `codegen-runner`: slice S4 of the pilot (R-GEN-6, R-GEN-11, discovery §F, §G, §I.4), identifier policy with an invertible table, guard and action printer for the JjEL subset with a differential test against the evaluator, module worker runner with timeout and network removal, browser probe, mutation bench.
**Files touched**: code `a588a27ae`: `frontend/src/codegen/target/js/{identifiers,printer}.ts`, `frontend/src/codegen/target/js/__tests__/{identifiers.test,printer.test,printer.differential.test,printerFixture}.ts`, `frontend/src/codegen/runner/{protocol,runner,runner.worker}.ts`, `frontend/src/codegen/runner/__tests__/runner.test.ts`, `frontend/scripts/probe/codegen-runner.ts` (all new). This commit: `docs/log-inbox/codegen-runner.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npx tsc --noEmit` 14, the §17 set; the four new test files red at import on the base, now 128/128; `src/codegen` 149, `src/jjel` 279, `src/model/simulation` 685; build exit 0; check:scripts, typecheck:scripts exit 0; probe ALL GREEN (24 PASS). Bench 22/22 killed, one only by the probe, no survivor (commit body).
**Out-of-scope changes**: no. Eleven files, above five: the five modules the prompt confirms for rule 19, four test files, the test helper `printerFixture.ts` under the declared `__tests__/`, the probe; all new, all in DOVE.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deviation: T-DIV, T-MOD, T-DECIMAL are printed (JS has the evaluator's numbers, the bench needs `/` with its null guard); T-METHOD refused. A fold meeting an absent name is refused (P-ABSENT). The app build holds no runner yet (S5 imports it); an isolated build emits the worker asset, run in Chromium. Probe red once at load 24 on 2000 ms dev worker starts; its non-timeout runs now use 30 s, green at 11.
**Prompt document name**: 2026-10-10 09:50

**Ticket** (for S5): load time counts against `timeoutMs`, and a cold dev server took 6-48 s to transform the worker module (measured with fresh cache dirs; warm, a run takes 88 ms), so the panel's first Run in dev can answer `timeout`. A ready message from the worker, with the timer started on it and a separate startup limit, would keep the code's 2000 ms apart from the worker's startup. The build's worker is a 1.8 KB asset and did not show it.

## 2026-10-10 — merge: codegen-runner into alfonso-frontend-jjtl (P-2026-10-10-1802)
**Prompt**: `claude_2026-10-10_1802_prompt_merge_codegen-runner.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-runner` at `312927556` into `alfonso-frontend-jjtl`, merge base `164f846fc`, 2 commits on the branch side.
**Files touched**: merge `f02a57d59`: 12 files from the branch side (`docs/log-inbox/codegen-runner.md`, `frontend/scripts/probe/codegen-runner.ts`, `frontend/src/codegen/runner/__tests__/runner.test.ts`, `frontend/src/codegen/runner/protocol.ts`, `frontend/src/codegen/runner/runner.ts`, `frontend/src/codegen/runner/runner.worker.ts`, `frontend/src/codegen/target/js/__tests__/identifiers.test.ts`, `frontend/src/codegen/target/js/__tests__/printer.differential.test.ts`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f02a57d59` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8025 tests in 328 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: direct merge gates green: typecheck 14 = base, vitest 8025 tests in 328 files (9 red at import as base), build, check:docs/agents/scripts/addonly exit 0; textual slice, no visual change
**Notes**: Rollback tag `pre-codegen-runner` on `45ad56bd6` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1802/result.json`.
**Prompt document name**: 2026-10-10 18:02
