# log-inbox — lane «codegen-engine»

Entries written by the code generation S2 lane on `codegen-engine` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat(codegen): template engine, Text with origin, block indentation, codec (P-2026-10-10-0945)
**Prompt**: `claude_2026-10-10_0945_prompt_codegen_s2_engine.md`, full lane on `~/jjodel-w-codegen-engine`, branch `codegen-engine`: slice S2 of the pilot (R-GEN-4, R-GEN-5, R-GEN-10, R-GEN-12). Text with fragments and origin, block indentation at render time, OriginHost on S1's JjelTextHost, template records as builtins with the `with` refusal and a recursion bound, `genTemplates` codec, one `generate` entry; tests first, mutation bench.
**Files touched**: feat `67d74be39`: `frontend/src/codegen/engine/{text,indent,origin,templates,templateCodec,generate}.ts` (new), `frontend/src/codegen/engine/__tests__/{text,indent,origin,templates,templateCodec,generate}.test.ts` (new). This docs commit: `docs/log-inbox/codegen-engine.md` (new, this entry).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. New files red first on `846fd7629`, 6 of 6 at import, then 79 of 79. Gates on `67d74be39`: tsc 14 errors, the §17 set; vitest `src/jjel` 279, `src/codegen` 100 (21 + 79), `src/model/simulation` 685, `src/jjscript` 541 with the known `context-binding.test.ts` red at import (`window`); build exit 0. Load average 7 to 64, gates in the foreground, no red to rerun.
**Out-of-scope changes**: no. Thirteen files over two commits, above five (RC-11, rule 19), each in the prompt's DOVE, which is the confirmation; no other path touched.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Hard stop on the prompt's own condition: eval.ts imports the joiner (vitest: window is not defined). Adopted under RC-21: generate(globals, lookup, modelId, templates, entry, args?) takes buildEvalContext's record from its caller; tests use a synthetic record over S3's turnstile. MAX_TEMPLATE_DEPTH 64; without it the stack ran out above 625 levels. Bench 18/18 killed, one test tightened to kill its declared mutant; list in 67d74be39.
**Prompt document name**: 2026-10-10 09:45

**Ticket** (S5, owed): the real wiring of `generate` is not exercised by any test of this lane. S5 owes it: its browser probe must call `generate` with the real output of `buildEvalContext(ctx, { extentModelId: modelId })`, and check that the handles of `globals.instances` carry the `id` and the feature keys the synthetic record assumes. Measured gap, not filled: a join of plain strings with a `null` item still writes `null` (`["a", n].join(",")` gives `a,null`), because S1's `joinWithTextHost` calls the host only when an item or the separator is a Text; a Text join writes `''` (`a,`), as U10 asks.
