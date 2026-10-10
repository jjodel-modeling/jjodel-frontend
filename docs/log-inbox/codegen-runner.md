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
