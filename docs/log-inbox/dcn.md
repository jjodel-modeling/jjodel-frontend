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

## 2026-11-07 — refactor: a nucleus field on the simulator run, Petri as its default
**Prompt**: DCN L4.1 (P-2026-11-07-0701): `SimNucleus` beside `simRunState.ts`, `petriNucleus(net)` over `netStep.ts`, `SimRun.nucleus` set by `startRun`; replay, step back, slider, single step, Play and the Clock's enabling test on the field; tests first, parity, mutation bench, browser probe against the base; one code commit.
**Files touched**: 8de3f6ae8 — `frontend/src/components/editor-v2/sim/simNucleus.ts` (new), `simRunState.ts`, `simBridge.ts`, `simBoardClock.ts`, `__tests__/simNucleus.test.ts` (new); docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, 2026-11-07: browser parity with base on scene_3_DemoESM, 17 gestures identical, P-2026-11-07-0750)
**Notes**: `nucleus` is optional: the existing suites build SimRun literals without it, so `nucleusOf` falls back to the Petri nucleus of `run.net`, cached per net. Switched also `inputAsks`'s `terminated`, on the path of Play and single step. Bench 12/12 killed. Gates: typecheck 0; sim 1560/1560; full run the known three plus an irSelectionRing Chromium hook timeout under load (5/5 alone); build 0. Probe sim-event-attrs-browser 3091 vs base 3092: same 4 PASS lines; no probe covers step back or the Clock.
**Prompt document name**: 2026-11-07 07:01
