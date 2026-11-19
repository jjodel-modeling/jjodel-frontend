## 2026-11-19 — docs(#221): JjEL SPEC aligned with the evaluator, validation rules explained
**Prompt**: user in chat: «Sistemare la documentazione di jjel come descritto nella issue #221. Aggiornare anche il repository jjodel-docs» — issue #221 has a title only («Enhance JjEL documentation + Validation rules explanations»)
**Files touched**: `frontend/src/jjel/SPEC.md`, this entry; in `jjodel-docs` (079b2bc, b3698ab, pushed): `languages/jjel.md`, `user-guide/validation.md`, its log
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — documentation only; jjodel-docs build exit 0 (only the pre-existing jjel/jjtl/jjscript highlighting warnings)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — every published example was run through a temporary vitest probe on `jjelEvalWithDiagnostics` and `evaluateValidation` (deleted, never staged)
**Notes**: SPEC: §5.2 `exists :` dropped; `selectedNode`→`data`; `subClasses`→`subclasses`; filter/map are not removed; new §6.5 (context shape); §7.1 parentheses; §8.4 rewritten. Measured: `name.isNotBlank` without `()` is null, so the published rule example was not evaluable; class virtuals do not resolve bare inside `with`. Not touched: in-app `docs/help/reference/jjel.md`.
**Prompt document name**: — (user in chat, no prompt file)
