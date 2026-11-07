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
