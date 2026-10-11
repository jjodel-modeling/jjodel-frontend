# log-inbox — lane «codegen-names»

Entries written by the code generation S7a lane on `codegen-names` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — feat(codegen): readable element names in the generated JavaScript (P-2026-10-11-1052)
**Prompt**: `claude_2026-10-11_1052_prompt_codegen_s7a_readable_names.md`, full lane on `~/jjodel-w-codegen-names`, branch `codegen-names`: slice S7a (R-GEN-17 provisional, R-GEN-16). Every element id written once, in `const $ID = Object.freeze({ … })`; elsewhere `$ID.<name>`. Optional table on the printer's context, `target.ids` and `target.ref`, `initial` as a JS literal, both lecture template sets and READMEs, probe, tests first, mutation bench. Stopped once with `Outcome: question` on four pinned literals in `oracle/__tests__/examples.test.ts`; resumed with DOVE extended to them.
**Files touched**: code `5b6bd3e01`: `frontend/src/codegen/target/js/{identifiers,printer,access}.ts`, `frontend/src/codegen/target/js/__tests__/{identifiers,printer,access}.test.ts`, `frontend/src/codegen/examples/__tests__/names.test.ts` (new), `frontend/src/codegen/examples/turnstile/{turnstile.json,README.md}`, `frontend/src/codegen/examples/petri-producer-consumer/{petri-producer-consumer.json,README.md}`, `frontend/src/codegen/oracle/__tests__/exampleFixture.ts` (`swapTarget` only), `frontend/src/codegen/oracle/__tests__/examples.test.ts` (four string literals), `frontend/scripts/probe/codegen-oracle.ts`. This commit: `docs/log-inbox/codegen-names.md` (new).
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 20:29 (`claude_2026-10-10_2029_prompt_codegen_s6_oracle.md`: its programs ran and passed the oracle, but were full of raw ids and unreadable for students)
**Causa**: (a)
**Regressions**: no. Tests first: 21 red and `printer.test.ts` red at collection on `4b6e071a3`. On `5b6bd3e01`: `npx tsc --noEmit` 14 errors, the base set; `src/codegen` + `src/model/simulation` 976 → 1004 tests, all green; build exit 0; `check:codegen-lazy` ALL GREEN; `typecheck:scripts`, `check:scripts` exit 0; probe 35/35 on 3093. Bench 17 of 17 killed, unmutated control clean (commit body).
**Out-of-scope changes**: yes. `oracle/__tests__/examples.test.ts` lies under the prompt's NON FARE `oracle/`: four string literals (lines 67-69, 89) moved to the `$ID` form after the lane's question, DOVE extended by the chat; nothing else in that file. Fourteen files, above five (RC-11, rule 19): the other thirteen are in the prompt's DOVE, taken as the confirmation.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 35/35 on 3093; 4 crops `{turnstile,petri-producer-consumer}_{ids,transitions}.png` in `~/.jjodel-lanes/P-2026-10-11-1052/crops/`, light theme, 536x489; the RC-23 check of the chat and Alfonso's GO are pending)
**Notes**: `target`: `ids` (text) and `ref(element)` added; `initial` from JSON text to a JS literal with `[$ID.x]` keys; `guard`, `actions`, `equation` print `$ID.<name>`. Deviations: `$tokens`, `$marked` and `$apply` writes also go through the table; attribute names stay double-quoted; the transition's origin moved from `id:` to `name: '${c.name}'` (`target.ref` is opaque); new template `arcList`; the probe is `codegen-oracle.ts` extended (`CGO_CROPS`).
**Prompt document name**: 2026-10-11 10:52
