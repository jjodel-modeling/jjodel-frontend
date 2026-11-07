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

## 2026-11-06 — chore: DCN drone fixture, the DCN metamodel and the drone class level on the UML fixture
**Prompt**: DCN L2.2 (P-2026-11-06-2335): new browser probe `dcn-drone-fixture.ts` (R-DCN-19): DCN metamodel of spec §3 on the UML tables, object record with `featureSources`, drone class level of Fig. 6, measures of Expression/Action types, JjEL forms, bindingCheck, instantiableClassifiers, featureClosure, conformance; export as dcn-drone.jjodel.
**Files touched**: 0e2867ed8 — `frontend/scripts/probe/dcn-drone-fixture.ts` (new), `docs/discovery/assets/dcn-drone/dcn-drone.json`, `dcn-drone-class-level-light.png`; docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 17/17 PASS, port 3084, page errors []. JjEL refuses && and ||: invariants stored with and/or; Alert reads self.ownedSensors.first(s => s.classifier.name == 'WindSensor').speed (all five forms parse). All 16 placeholder bodies fail the .[x] rule: the 16 conformance warnings. The given dynamic classes own no attribute: dormantOwner measured on seeded ones after export. Welcome key 3.1.1 set in the probe (seed gap already ticketed, hw-notation inbox). Detail: commit body 0e2867ed8.
**Prompt document name**: 2026-11-06 23:35

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

## 2026-11-07 — feat: the classification accessor on the JjEL evaluation context
**Prompt**: DCN L3.3 (P-2026-11-07-0940): `JjelClassificationAccess { isIn }` beside `JjelStateAccess`, optional `classification` on `EvaluationContext` inherited by child scopes; `ClassificationTest` evaluates its receiver and asks the accessor, throws without one, a non-boolean answer an error; optional accessor on `buildGuardContext`; tests first, mutation bench, one code commit.
**Files touched**: 969aa0b3d — `frontend/src/jjel/evaluator/context.ts`, `evaluator.ts`, `frontend/src/model/simulation/guardContext.ts`, `frontend/src/jjel/__tests__/classificationAccess.test.ts` (new); docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Without an accessor the throw comes before the receiver is evaluated, as `.[a]` does. The receiver goes to `isIn` as evaluated, not by id. Bench 8/9 killed; survivor `return !!answer` after the typeof guard is equivalent. Gates: typecheck 0; jjel + simulation 1350/1350; full run the known three plus a languageService 50 ms budget and an irSelectionRing hook timeout under load (38/38 alone); build 0.
**Prompt document name**: 2026-11-07 09:40

## 2026-11-07 — feat: the dcn role group and the system profile Dynamic classification
**Prompt**: DCN L2.3 (P-2026-11-07-0941, stopped at the context ceiling; continued by P-2026-11-07-1012): role group `dcn` (11 roles), shape `dcn` with its closure, hidden groups per shape, profile «Dynamic classification», `dcnStcFromRoles`; fix the `roleSections` regression, gates, mutation bench, browser crops of the roles dialog.
**Files touched**: f6b918db1 — `frontend/src/model/simulation/roleCatalog.ts`, `simProfiles.ts`, `profileCodec.ts`, `dcn/dcnRoles.ts` (new), `dcn/__tests__/dcnRoles.test.ts` (new), `__tests__/roleCatalog.test.ts`, `__tests__/simProfiles.test.ts`; `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `simRolesDraft.ts`, `__tests__/simLabels.test.ts`; `frontend/src/components/editor-v2/viewpoint/derive/notations.ts`, `viewpointDerivation.ts`; docs commit — `docs/log-inbox/dcn.md`, the Status of both prompts
**Outcome**: ✅ completed
**Corregge**: 2026-11-07 09:41
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe: Petri dialog byte-identical to b02f337d7; crops read by the chat 2026-11-07)
**Notes**: Rule 19 deroga, 12 files: answer A, then simLabels.test.ts by the chat. Operation and Body are multi (R-SIM-90). Bench 18/19: M16 (net groups shown under dcn by roleSections) survives; its killing test belongs in simRolesDraft.test.ts, out of scope, and the crop covers it. Gates: typecheck 0, build 0, check:docs 5/5, full run at baseline (3 known files); 5 load-timing files rerun alone 207/207. Crops: ~/.jjodel-lanes/P-2026-11-07-1012/crops.
**Prompt document name**: 2026-11-07 10:12

**Ticket** (for the chat, none blocking): events are off in «Dynamic classification» because trigger depends on transition, which `dcn` lacks; nothing checks at binding time that `overlapping`/`complete` are Boolean; the panel's select (`PANEL_PROFILE_IDS`, `simRoleStatus.ts`) does not list the new profile; `bindProfile` runs the Petri branch on a dcn profile (harmless, dcn roles come out none); under `dcn` the dialog offers «+ on» for the general, events, data and output roles (crop `dynamic_branch_full.png`).
