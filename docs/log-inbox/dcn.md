# log-inbox — lane «dcn»

Entries written by the DCN lanes on `dcn` (P9, parallel lanes). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The
active log is not touched by this lane.

---

## 2026-11-06 — feat: featureSources in the ontological binding, dormant slots in the feature closure
**Prompt**: DCN L2.1 (P-2026-11-06-2300): optional `featureSources` on `OntoBinding` (codec), applied by `featureClosure` from every classifier of the generalization closure with an additive `dormantOwner`, judged by `bindingCheck`; tests first, mutation bench, one code commit.
**Files touched**: d51def3e7 — `frontend/src/model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`, `__tests__/bindingCodec.test.ts`, `__tests__/bindingReader.test.ts`, `__tests__/bindingCheck.test.ts`; docs commit — `docs/log-inbox/dcn.md` (new), the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Six code files, the Rule 19 deroga of the prompt. Bench 24/24 killed; an equivalent frontier dedup was dropped, a no-aliasing codec test added. Gates: typecheck 0, ontological 69/69, full run 3 failed files (the known three) / 533 passed, build 0. `dormantOwner` is present (possibly empty) whenever `featureSources` is, absent otherwise. The first hop is not checked against the classifier metaclass: the prompt did not ask it.
**Prompt document name**: 2026-11-06 23:00

## 2026-11-07 — feat: parse `::` and `self.in(V::D)` into a ClassificationTest node
**Prompt**: DCN L3.2 (P-2026-11-07-0700): a `DOUBLE_COLON` token, a `ClassificationTest { object, viewpoint, dynamicClass }` node for a member call `in` whose only argument is `IDENT :: IDENT`, `::` refused anywhere else, the evaluator throwing «classification is not bound here»; tests first, mutation bench, one code commit.
**Files touched**: 0125bae93 — `frontend/src/jjel/lexer/lexer.ts`, `types/tokens.ts`, `types/ast.ts`, `parser/parser.ts`, `evaluator/evaluator.ts`, `__tests__/classificationTest.test.ts` (new), `frontend/src/codegen/target/js/printer.ts`, `frontend/src/model/simulation/subsetChecker.ts`; docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Eight files, Rule 19 deroga from the chat: printer.ts and subsetChecker.ts only close exhaustive switches (HARD STOP raised, answered). Bench 11/11 killed. Typecheck 0, JjEL 581/581, build 0; full run 6 failed files: the known three, plus irSelectionRing, tolerant and languageService under load, all green alone (languageService also on the tip). Interface named ClassificationTestExpr like its neighbours. `?.in(V::D)` is refused.
**Prompt document name**: 2026-11-07 07:00
