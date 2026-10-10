# log-inbox — lane «codegen-fix»

Entries written by the code generation S5b lane on `codegen-fix` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — fix(codegen): run clock starts at worker ready; output scrolls (P-2026-10-10-2027)
**Prompt**: `claude_2026-10-10_2027_prompt_codegen_s5b_fixes.md`, fast lane on `~/jjodel-w-codegen-fix`, branch `codegen-fix`: the two follow-ups of S5 (R-GEN-6). The worker posts `ready` and the runner starts the program timeout on it, with a start-up bound of its own; the Output of the code panel keeps one row per generated line and scrolls, gutter fixed, error highlight full width; probe at the panel default timeout, crops, mutation bench.
**Files touched**: code `a880e5ab8`: `frontend/src/codegen/runner/{protocol,runner,runner.worker}.ts`, `frontend/src/codegen/runner/__tests__/runner.test.ts`, `frontend/src/codegen/ui/CodePanel.scss`, `frontend/scripts/probe/codegen-panel.ts`. This commit: `docs/log-inbox/codegen-fix.md` (new).
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 18:25
**Causa**: (d)
**Regressions**: no. tsc 14, the §17 set (identical before and after); typecheck:scripts, check:scripts exit 0; src/codegen 248/248 (the first new test red on the base: `timeout` at 250 ms for a worker ready at 400 ms); build exit 0; check:codegen-lazy ALL GREEN; probe 46 PASS 0 FAIL on 3086. The whole vitest suite was not run, only src/codegen. Bench 17/17 killed, no survivor of a mutant that was run (commit body).
**Out-of-scope changes**: no. Six files, above five (RC-11, rule 19; the prompt's header says five at most): each in the prompt's DOVE, which is the confirmation. No other path touched, CodePanel.tsx included.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 46/46 on 3086; crops `panel_run_error_left.png` and `panel_run_error_right.png` in `~/.jjodel-lanes/P-2026-10-10-2027/crops/`, light theme, 536x361; the RC-23 check of the chat and Alfonso's GO are pending)
**Notes**: Second cause (g), the cold dev server. Deviations: STARTUP_TIMEOUT_MS is 30000 as asked, but S4 measured cold dev transforms up to 48 s, so a very cold start can answer 'worker: did not start'. bootWorker extracted from the worker's top-level block, to test the order of ready. Probe: browser keeps scrollbars, 8 checks beyond the one asked (wheel, gutter, scroll-padding, worker held 3500 ms), crops in this lane's folder. Unmeasured: the tint of the error gutter. Bench in the commit body.
**Prompt document name**: 2026-10-10 20:27

**Ticket** (S4's and S5's, closed here): load time no longer counts against `timeoutMs`; the probe's first Run ran at 2000 ms with the worker script held back 3500 ms and returned in 3529 ms. The EditorV2 Backspace-in-TEXTAREA ticket of S5 stays open, untouched.
