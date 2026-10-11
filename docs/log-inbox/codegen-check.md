# log-inbox — lane «codegen-check»

Entries written by the code generation S7b lane on `codegen-check` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — feat(codegen): «Check» runs the oracle from the Code panel (P-2026-10-11-1053)
**Prompt**: `claude_2026-10-11_1053_prompt_codegen_s7b_oracle_button.md`, full lane on `~/jjodel-w-codegen-check`, branch `codegen-check`: slice S7b of the pilot (R-GEN-11, R-GEN-17; spec §8). A scenario select and a «Check» button on the row of «Run», the oracle's result in Run's result area (pass, divergence, failure), a pure view model, the stored-scenario reading shared with the probe hook, a probe with three crops, tests first, mutation bench.
**Files touched**: code `f32d5d94b`: `frontend/src/codegen/ui/checkView.ts`, `frontend/src/codegen/ui/__tests__/checkView.test.ts`, `frontend/src/codegen/oracle/storedScenarios.ts`, `frontend/scripts/probe/codegen-check.ts` (all new); `frontend/src/codegen/ui/{CodePanel.tsx,CodePanel.scss}`, `frontend/src/codegen/oracle/oracle.ts` (`hookRun` reads the scenarios through the shared helper). This commit: `docs/log-inbox/codegen-check.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. tsc 14 errors, the same set as the base worktree at `5499a1cb3`; vitest `src/codegen` 16 files and 284 tests on the base, 17 files and 301 tests on the slice, `checkView.test.ts` red at import on the base and then 17/17; build exit 0; `check:codegen-lazy` ALL GREEN, generator modules outside the eager closure 16 → 18; `typecheck:scripts`, `check:scripts` exit 0. Probes on the final source: codegen-check 43/43 on 3092, codegen-panel (S5/S5b) 46/46 on 3093, codegen-oracle (S6) 29/29 on 3094, both unchanged. Bench 4/4 killed (commit body). The whole vitest suite was not run, only `src/codegen`.
**Out-of-scope changes**: no. Eight files over two commits, above five (RC-11, rule 19): each in the prompt's DOVE, which is the confirmation. No other path touched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 43/43 on 3092; crops `check_disabled.png` 536x489, `check_pass.png` 536x515, `check_divergence.png` 536x583 in `~/.jjodel-lanes/P-2026-10-11-1053/crops/`, light theme; the RC-23 check of the chat and Alfonso's GO are pending)
**Notes**: Probe mutation by editing the `main` template in the Templates tab: a last statement swaps one postset place in the program's TRANSITIONS table (the hook's `mutate` never reaches the panel's code). The S5 probe's strict `.codegen-panel__select` locator went red on a draft: the scenario select has its own class. S6 probe run with HOME redirected, to spare the S6 lane's crops. Code commit amended once, unreferenced, for the Model trailer.
**Prompt document name**: 2026-10-11 10:53

**Ticket** (follow-up, styles): the tokens have no success text colour. The pass line uses `--color-success-hover` (green-600, about 3.3:1 on white, below WCAG AA for 11 px text); a `--color-success-text` token in `styles/tokens/`, as `--color-error-text` is red-700, would bring it to AA. Outside this lane's DOVE (rule 28).

## 2026-10-11 — merge: codegen-check into alfonso-frontend-jjtl (P-2026-10-11-1250)
**Prompt**: `claude_2026-10-11_1250_prompt_merge_codegen-check.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-check` at `4de3ccf23` into `alfonso-frontend-jjtl`, merge base `276a69ac7`, 4 commits on the branch side.
**Files touched**: merge `f735959f6`: 9 files from the branch side (`docs/log-inbox/codegen-check.md`, `docs/prompts/claude_2026-10-11_1053_prompt_codegen_s7b_oracle_button.md`, `frontend/scripts/probe/codegen-check.ts`, `frontend/src/codegen/oracle/oracle.ts`, `frontend/src/codegen/oracle/storedScenarios.ts`, `frontend/src/codegen/ui/CodePanel.scss`, `frontend/src/codegen/ui/CodePanel.tsx`, `frontend/src/codegen/ui/__tests__/checkView.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f735959f6` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8582 tests in 355 files, 9 red at import, hooks 654; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 on the S7b crops (Check pass, divergence with origin link, disabled without scenario), GO by Alfonso 12:35; all trunk gates green; on the merged trunk the probes codegen-check 43/43, codegen-panel 46/46 and codegen-oracle all green
**Notes**: Rollback tag `pre-codegen-check` on `4d47e8653` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-1250/result.json`.
**Prompt document name**: 2026-10-11 12:50
