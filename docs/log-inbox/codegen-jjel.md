# log-inbox — lane «codegen-jjel»

Entries written by the code generation slice S1 lane on `codegen-jjel-template` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat: JjEL template interpolation, opt-in, Text host and read observer (P-2026-10-10-0900)
**Prompt**: `claude_2026-10-10_0900_prompt_codegen_s1_jjel_template.md`, full lane on `~/jjodel-w-codegen-jjel`, branch `codegen-jjel-template`: slice S1 of the code generation pilot, R-GEN-10. Lexer option `interpolation` off by default, `parseTemplate`, context fields `textHost` and `readObserver` inherited by children, host consulted at interpolation, `+`, `join`, stringify; tests first, mutation bench, `SPEC.md` §9.4 and the Handlebars lines (R-GEN-13).
**Files touched**: feat `4eda9c793`: `frontend/src/jjel/lexer/lexer.ts`, `frontend/src/jjel/parser/parser.ts`, `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/builtins/collections.ts`, `frontend/src/jjel/index.ts`, `frontend/src/jjel/__tests__/templateInterpolation.test.ts` (new). This docs commit: `frontend/src/jjel/SPEC.md`, `docs/log-inbox/codegen-jjel.md` (new, this entry).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. New file red first on `0c847329d`, 26 of 34 (the 8 green: 4 identity cases, 4 lexer cases equal to the base lexer), then 34 of 34. Gates on `4eda9c793`: tsc 14 errors, the base set; vitest `src/jjel` 279 (245 + 34); consumer suites (`src/jjel`, `jjtl`, `jjscript`, `model/simulation`, `model/validation`, `model/conformance`, ir `pathExpr`) 72 files, the same 8 red at import (`window`), 1843 passed (1809 + 34); build exit 0. Load average 4 to 10.
**Out-of-scope changes**: yes — `SPEC.md` §8.6 (:591) carried the same Handlebars claim as :37 and :660 and was corrected with them (R-GEN-13); a line, not a file. Nine files over two commits, above five (RC-11, rule 19), each in the prompt's DOVE; no other path touched.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: JjelTextHost: isText(v), interpolate(parts, expr), concat(l, r), join(items, sep), stringify(t), optional evaluateHole(expr, evaluate) for per-hole reads and errors. Hole part: {kind:'hole', value, expr, location, render()}. join untouched; host path is joinWithTextHost. Bench 7/7 killed. Gap for S2: text parts carry no location (ast.ts outside DOVE); spans via tokenize(src, {interpolation: true}). Detail: body of 4eda9c793.
**Prompt document name**: 2026-10-10 09:00

## 2026-10-10 — merge: codegen-jjel-template into alfonso-frontend-jjtl (P-2026-10-10-0936)
**Prompt**: `claude_2026-10-10_0936_prompt_merge_codegen-jjel-template.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-jjel-template` at `de640d661` into `alfonso-frontend-jjtl`, merge base `0c847329d`, 2 commits on the branch side.
**Files touched**: merge `7e06abb4c`: 9 files from the branch side (`docs/log-inbox/codegen-jjel.md`, `frontend/src/jjel/SPEC.md`, `frontend/src/jjel/__tests__/templateInterpolation.test.ts`, `frontend/src/jjel/evaluator/builtins/collections.ts`, `frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjel/index.ts`, `frontend/src/jjel/lexer/lexer.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7e06abb4c` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7721 tests in 313 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: direct merge gates green: typecheck 14 = base, vitest 7721 tests in 313 files (9 red at import as base), build, check:docs/agents/scripts/addonly exit 0; textual slice, no visual change
**Notes**: Rollback tag `pre-codegen-jjel-template` on `a2eef734f` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-0936/result.json`.
**Prompt document name**: 2026-10-10 09:36
