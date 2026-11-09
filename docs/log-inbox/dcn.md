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

## 2026-11-07 — merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)
**Prompt**: merge `dcn-l21` at `37fc696f7` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, merge base `895669463`, in the shape of `59b532f43`; probes, gates, hard stop for the chat's GO.
**Files touched**: a743c3f37 — the 12 files of the branch (`docs/decisions.md`, the DCN foundations discovery, `docs/log-inbox/dcn.md`, three prompts, `frontend/src/model/ontological/binding{Check,Codec,Reader}.ts` and their tests); docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Zero conflicts, no union. The tip moved to `65852b291` (another chat's docs commit) during the pre-merge gates; accepted as trunk, first parent of the merge. Probes 27/27, control R-MT-5 absent. Gates: typecheck 0, vitest 14491 (14489 + 2 skipped, the known 3 red at import; a first run in parallel with the build timed out two Chromium afterAll hooks, rerun alone clean), hooks 967/967, build 0, check:docs 5/5, agents, scripts, addonly PASS.
**Prompt document name**: 2026-11-06 23:51

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

## 2026-11-07 — merge: dcn into alfonso-frontend-jjtl (P-2026-11-07-1123)
**Prompt**: merge `dcn` at `177378f9d` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, merge base `37fc696f7`, in the shape of `319be0670`; probes, gates, hard stop for the chat's GO.
**Files touched**: 376a2273e — the 40 files of the branch (DCN drone fixture probe, `jjel` lexer/parser/evaluator and AST for `self.in(V::D)`, `sim` nucleus and roles, `model/simulation` role catalog, profiles and `dcn/dcnRoles.ts`, their tests, seven prompts, `docs/log-inbox/dcn.md`); docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, L4.1 browser parity P-2026-11-07-0750, L2.3 roles dialog crops P-2026-11-07-1012; the rest has no UI path)
**Notes**: One conflict, docs/log-inbox/dcn.md, by union (trunk whole, then the five branch entries). Tip moved by two docs commits of another chat (9053a07b8, 896362e52), accepted as first parent. Probes 77/77, control R-MT-24 absent. Gates: typecheck 0, vitest 14709 (14621 trunk + 88 branch, counted here: the dcn tree has no node_modules; known 3 red at import; a Chromium afterAll timed out under load, alone 18/18), hooks 967, build 0, check:docs 5/5, agents, scripts, addonly PASS.
**Prompt document name**: 2026-11-07 11:23

## 2026-11-07 — feat: the DCN compiler, resolved roles and model to a placeless net
**Prompt**: DCN L4.2 (P-2026-11-07-1216): pure module `dcnCompile.ts` from the resolved dcn roles, a model read view and the R-OI binding to a CompiledNet with no places, one transition per invocation and per monitor contribution with opaque ids and a side table; σ seeded from the closure, dormant slots included; domains from range bounds; optional instance key on StateAttributeDecl; plus the L2.3 ticket (dialog under `dcn` shows the dcn group only).
**Files touched**: a5bef0684 — `frontend/src/model/simulation/dcn/dcnCompile.ts` (new), `dcn/__tests__/dcnCompile.test.ts` (new), `netTypes.ts`; 839affc1a — `frontend/src/components/editor-v2/sim/simRolesDraft.ts`, `sim/__tests__/simRolesDraft.test.ts`; docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 25/26 (survivor: precondition read on a monitor, which has none) and 3/3 with M16. Dialog hide rule changed locally in simRolesDraft.ts, not the shared list (validator and codec read it). All ticks on one event `dcn-tick` (R-SIM-122). Parameters, range bounds, literals passed as an extra `features` input. Generalization walk copied from bindingReader. String flagged without domain. Closure written by the chat from the handoff.
**Prompt document name**: 2026-11-07 12:16

## 2026-11-07 — feat: slot writes `self.battery := e` in a DCN action mode
**Prompt**: DCN L3.4 (P-2026-11-07-1215): `parseAction(source, { dcn: true })` admits a member target as a new `SlotTarget` node, `JjelAction.target` widened to the union; `actionEvaluator.ts` returns a slot write as an assignment marked `slot: true`; the core unchanged (an `undeclared` halt until L4.4); tests first, mutation bench, one code commit.
**Files touched**: 5d86470c9 — `frontend/src/jjel/types/ast.ts`, `frontend/src/jjel/parser/parser.ts`, `frontend/src/model/simulation/actionEvaluator.ts`, `frontend/src/model/simulation/__tests__/slotAction.test.ts` (new); docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — every suite green but `irCollapsedRender.test.ts`, whose Chromium `afterAll` timed out in 2 of 6 runs on the branch (all 13 tests passing) and in 0 of 5 on the tip; nothing it imports changed
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: New node, not MemberAccess: `SlotTarget` carries `object` and `attribute`, the field names of `StateAccessExpr`, so the six readers outside jjel/ (printer, stcChecks, simBridge, simStateUsage) compile unchanged; none selects the mode. The marker type `ActionAssignment` lives in actionEvaluator.ts, since netTypes.ts was off limits. Bench 14/14 killed. Gates: typecheck 0, jjel+simulation 1394/1394, full run 546/550 (the known 3 + the flake above), build 0.
**Prompt document name**: 2026-11-07 12:15

**Ticket** (for L4.4, not blocking): the core keys an assignment by `element` and `attr` only, so a slot named like a declared state attribute of the same element would be applied to σ as that attribute, not halted `undeclared`. L4.4 has to read `slot` before the declaration lookup in `netStep.ts`.

## 2026-11-07 — merge: dcn-l42 into alfonso-frontend-jjtl (P-2026-11-07-1308)
**Prompt**: `claude_2026-11-07_1308_prompt_merge_dcn-l42.md`, lane full (merge): `dcn-l42` at `178c1c837` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `75f973840`: the 12 files of the branch (this inbox, the L3.4 and L4.2 prompts, `ast.ts`, `parser.ts`, `actionEvaluator.ts`, `netTypes.ts`, `dcnCompile.ts`, `simRolesDraft.ts` and three test files); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `75f973840`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 552 files, 14797 passed and 2 skipped as expected (tip 14762 + 35), 0 failed, 3 files red: the known `window` imports.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI path; the L4.2 dialog ticket is checked by simRolesDraft.test.ts; chat GO)
**Notes**: Merge tree `b1469f16d` equal to the merge-tree measure; probes 5/5 once; no union resolution. Branch vitest count not run in `/Users/alfonso/jjodel-w-dcn-l42` (no node_modules there; writing forbidden): the 35 new tests counted at `178c1c837` (+1, +17, +17), matched on the merge. First hooks run killed (exit 144) beside the full suite, 967/967 alone. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 13:08

## 2026-11-07 — feat: σ-backed handles for DCN instances, the classification accessor bound
**Prompt**: DCN L4.3 (P-2026-11-07-1410): a pure module building per σ a handle per instance (own, inherited, dormant slots from σ; links to the linked handles; name and classifier), `isIn` over the invariants memoized per (instance, class), unknown names and W2 cycles throwing; an optional DCN binding on `buildGuardContext` and `evaluateOutput`; tests first, mutation bench, one code commit.
**Files touched**: dfcd795c3 — `frontend/src/model/simulation/dcn/dcnHandles.ts` (new), `dcn/__tests__/dcnHandles.test.ts` (new), `guardContext.ts`, `boardOutputs.ts`; docs commit — `docs/log-inbox/dcn.md`, the prompt's Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 23/24 killed; M11 (memo removed) survives, unobservable through any output. Gates: typecheck 0, sim+JjEL+sim-UI 68 files/2236 green, full run 5 red files: the known three plus two Chromium afterAll timeouts under load, 18/18 green alone; build 0. Links read from the model (spec §6, fixed), upper bound via `options.upper`. `generalizationClosure` duplicated (not exported by dcnCompile.ts).
**Prompt document name**: 2026-11-07 14:10

**Ticket** (for L4.4, not blocking): the Petri guard checker rejects `.in(V::D)` with E-CALL (`subsetChecker.ts`), so `compileGuard` and `compileOutput` refuse every DCN guard or watch that tests a class; the DCN guard compiler must parse without that check (the test's `dcnGuard`) or the checker must gain a DCN mode.

## 2026-11-07 — feat: the DCN step, a SimNucleus over the placeless net
**Prompt**: DCN L4.4 (P-2026-11-07-1432, stopped at the context ceiling; continued by P-2026-11-07-1455 from its handoff): `dcnNucleus` on the shared step with class-test guards, redefinition expansion, Interleave (SoSyM Definition 3) and Sync, slot marker before lookup, then domain, unclassified, ambiguous halts; subset checker DCN mode for guards and outputs; tests first, bench.
**Files touched**: f5b80a816 — `dcn/dcnStep.ts` (new), `dcn/__tests__/dcnStep.test.ts` (new), `netTypes.ts`, `subsetChecker.ts`, `guardEvaluator.ts`, `boardOutputs.ts`, `components/editor-v2/sim/simBridge.ts`; docs commit — `docs/log-inbox/dcn.md`, Status of both prompts
**Outcome**: ✅ completed
**Corregge**: 2026-11-07 14:32
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deroga: 7 code files, not 6; the seventh is simBridge.ts, two `case` lines in `haltMessage` only (Alfonso, second turn of 1432). netStep.ts, netCompile.ts, simRunState.ts untouched. Bench 16/16 killed. Gates: typecheck 0, sim+JjEL+sim-UI 69 files/2253 green, full run 551/554 files with only the known three red, build 0.
**Prompt document name**: 2026-11-07 14:55

**Ticket** (for a cleanup lane, not blocking): `generalizationClosure` now has copies in `dcnCompile.ts` and `dcnHandles.ts`; export it once from `bindingReader.ts`.

**Ticket** (stale comment, not blocking): `actionEvaluator.ts` still says a slot write reaching `netStep.ts` "halts `undeclared` (lane L4.4)"; under the DCN nucleus slot writes are applied (dcnStep.ts), and the comment should say so. Not touched here (out of scope).

## 2026-11-07 — merge: dcn-l44 into alfonso-frontend-jjtl (P-2026-11-07-1545)
**Prompt**: `claude_2026-11-07_1545_prompt_merge_dcn-l44.md`, lane full (merge): `dcn-l44` at `eaac8a39c` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `601b46ceb`: the 14 files of the branch (this inbox, the L4.3 and L4.4 prompts, `dcnHandles.ts`, `dcnStep.ts`, `netTypes.ts`, `subsetChecker.ts`, `guardEvaluator.ts`, `guardContext.ts`, `boardOutputs.ts`, `simBridge.ts` and two test files); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `601b46ceb`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 560 files, 14905 as expected (tip 14871 + 34), 3 files red at import (the known `window` three), plus load reds (tolerant, laneBoard, irCollapsedRender) green alone.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI path; the two halt lines are covered by tests; chat GO)
**Notes**: Merge tree `85656ba5a` equal to the merge-tree measure; probes 12/12 once, control R-MT-25 absent; no union resolution. Load average ~150 during the full runs; the tip itself showed the same kind of load reds (outline, tolerant, two Chromium launches). Branch count not run in `/Users/alfonso/jjodel-w-dcn-l44` (no node_modules; writing forbidden): 34 new tests counted at `eaac8a39c` (18 + 16), matched on the merge. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 15:45

## 2026-11-07 — feat: an invocation is one step under Interleave too (R-DCN-22)
**Prompt**: `claude_2026-11-07_1650_prompt_dcn_l44b_atomic_invocation.md`, lane full: under Interleave an invocation offers one candidate, the static operation and every redefinition of an active dynamic class fused into one parallel assignment on the previous σ; two writes of one slot halt double-assignment (R-SIM-17).
**Files touched**: `2b28fc242`: `dcnStep.ts`, `__tests__/dcnStep.test.ts`; this commit: this entry and the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. typecheck exit 0 (0 `error TS`); dcn 60/60; simulation suites 55 files, 1658 passed; full vitest 557 passed, 3 red at import (the known `window` three), 14934 passed, 2 skipped; build exit 0 (chunk-size warning only).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (nucleus not wired into the run; prompt: no visual check owed)
**Notes**: The W5-gap test is replaced by «land() under Interleave runs with its redefinition in one step», the Sync case kept as its own test, a double-assignment test added. Bench in the commit: 4 of 5 mutants killed; the survivor (singleton shortcut to netStep removed) is equivalent, kept so the non-invocation path stays as in L4.4. A redefinition selected alone is inadmissible.
**Prompt document name**: 2026-11-07 16:50

## 2026-11-07 — merge: dcn-l44b into alfonso-frontend-jjtl (P-2026-11-07-1756)
**Prompt**: `claude_2026-11-07_1756_prompt_merge_dcn-l44b.md`, lane full (merge): `dcn-l44b` at `2cb5cca14` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `ced5a3d13`: the 6 files of the branch (`docs/decisions.md`, this inbox, the L4.4b prompt, the DCN spec, `dcnStep.ts`, `__tests__/dcnStep.test.ts`); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ced5a3d13`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 561 files, 14955 as expected (tip 14953 + 2), 0 failed, 3 files red at import (the known `window` three).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI path; nucleus only, covered by tests; chat GO)
**Notes**: Trunk tip moved to `44ecca1f1` (docs only, another chat) after the prompt; accepted as first parent. Probes 6/6 once, control R-DCN-24 absent; no union resolution. Branch count not run in `/Users/alfonso/jjodel-w-dcn-l44b` (no node_modules; writing forbidden): 2 new tests counted at `2cb5cca14` (16 to 18), matched on the merge. Tip run had one laneRun.test.ts timeout under load, green alone. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 17:56

## 2026-11-07 — feat: DCN well-formedness W1..W4, W6 as node problems of kind dcn
**Prompt**: DCN L2.4 (P-2026-11-07-1825, stopped at the context ceiling; continued by P-2026-11-07-1900): pure module of W1..W4, W6, R-DCN-13, R-DCN-16 on the drone, the `dcn` problems producer and its sync, tests, mutation bench, gates, browser probe with Drone crops.
**Files touched**: eb96cbb10 — `frontend/src/model/dcn/dcnWellFormedness.ts` (new), `dcn/__tests__/dcnWellFormedness.test.ts` (new); `frontend/src/components/editor-v2/problems/registry.ts`, `dcnToProblems.ts` (new), `DcnProblemSync.tsx` (new), `__tests__/dcnToProblems.test.ts` (new); `frontend/src/components/editor-v2/EditorV2.tsx`; LIR 12019b986; docs commit — this entry and the Status of both prompts
**Outcome**: ✅ completed
**Corregge**: 2026-11-07 18:25
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (crops ~/.jjodel-lanes/P-2026-11-07-1900/crops read by the chat 2026-11-07: W6 of the probe-made `reset` in its overlay, Drone clean)
**Notes**: Module written before its test (prompt: tests first). One test fixed: a guard on a same-viewpoint class is also the W2 self-loop, the test reads W1 alone. The bag needs `simProfile` «Dynamic classification», else `runBag` turns the dcn roles off. Bench 33/33 killed. Gates: typecheck 0, targeted 1796/1796, full run at baseline (3 known files), build 0, check:docs. Probe 9/9 PASS; the export gives only the 3 Alert W1 below. Second ceiling stop, at the probe.
**Prompt document name**: 2026-11-07 19:00

## 2026-11-07 — ticket: the conformance validator parses DCN bodies outside the DCN action mode
**Ticket**: The conformance validator parses `Operation.body` and `Monitor.body` without the DCN action mode, so every DCN body such as `self.power := 0` gets a `type_mismatch` warning. When the metamodel binds the dcn roles it must parse them in DCN mode (`parseAction(text, { dcn: true })`, as `dcnWellFormedness.ts` does).
**Priority**: medium
**Found in**: P-2026-11-07-1900

## 2026-11-07 — ticket: a W1 guard on a class of the same viewpoint always raises a W2 self-loop
**Ticket**: Under the self-loop rule of W2 (spec §5, P-2026-11-07-1825), `self.in(V::D')` in an expression of a class of V is an edge V -> V, so the W1 guard on a same-viewpoint class (Flying reading `plugged` of Charging) always gives W2; the guard only works across viewpoints. W2 edges also come from bodies and monitors, not only invariants. Spec §5 to settle.
**Priority**: medium
**Found in**: P-2026-11-07-1900

## 2026-11-07 — ticket: W1 on the Alert invariants of the drone export, association ends not reachable from self
**Ticket**: On `dcn-drone.jjodel` the invariants of Safe, Moderate and Adverse read `self.ownedSensors`, an association end owned by the association, not a feature of WeatherAssessmentUnit: three W1 errors (measured by the L2.4 probe). For L2.5/L4.5: make association ends reachable from `self`, or change the export.
**Priority**: medium
**Found in**: P-2026-11-07-1825

## 2026-11-07 — merge: alfonso-frontend-jjtl into dcn-l24 (P-2026-11-07-1945)
**Prompt**: `claude_2026-11-07_1945_prompt_dcn_l24_take_trunk.md`, lane full (merge, RC-14): the trunk into `dcn-l24` before the branch merges into it; `registry.ts` resolved by union, both sides of `EditorV2.tsx` kept, gates, merge commit, this entry.
**Files touched**: merge `ea08a0f8b` (trunk `03bc50239`): the conflict resolution in `frontend/src/components/editor-v2/problems/registry.ts`; this commit: this entry and the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), targeted 72 files 1883/1883, full vitest 15030 passed and 2 skipped, build exit 0, check:docs 4/5 (B below).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (resolution adds no behaviour; the crops of P-2026-11-07-1900 stand)
**Notes**: One conflict, registry.ts, by union: 'instantiation' then 'dcn', the dcn paragraph renumbered the eighth. EditorV2.tsx and the inboxes merged clean. Gates ran through a temporary node_modules symlink to ~/jjodel, removed after. Full run: the 3 known import reds plus 32 in bashGuard.test.ts, caused by MERGE_HEAD during the merge; 160/160 after the commit. check:docs B red on multi-tab.md:201 (P-2026-11-07-1536, prose in Corregge, Causa), identical to the trunk's.
**Prompt document name**: 2026-11-07 19:45

## 2026-11-07 — merge: dcn-l24 into alfonso-frontend-jjtl (P-2026-11-07-1953)
**Prompt**: `claude_2026-11-07_1953_prompt_merge_dcn-l24.md`, lane full (merge, RC-14): `dcn-l24` at `fa3559653` into the trunk, one `--no-ff` merge commit of the explicit sha, gates, then this entry and the Status flip after the GO.
**Files touched**: merge `6a2c07153` (base `03bc50239`, trunk tip `6e92c6ebf`): the 12 files of the branch, no resolution; this commit: this entry and the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: check:addonly PASS, typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 564 passed files, 15062 passed and 2 skipped (expected 15032 + 30), hooks 21 files 967/967, build exit 0, check:agents green, check:scripts PASS, check:docs 4/5 (B below).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat C-2026-11-06-2159, crops of P-2026-11-07-1900; unattended, Alfonso in the morning digest)
**Notes**: Zero conflicts, staged tree equal to merge-tree 966386ac6; five inbox probes once each. The branch tree has no node_modules, so its vitest could not run there without writing in it: the 30 new tests were counted on the two new test files (7 + 23, no .each), and the merged run matched. check:docs B red on multi-tab.md:201 (P-2026-11-07-1536), already red on the base, untouched here, accepted by the chat.
**Prompt document name**: 2026-11-07 19:53

## 2026-11-08 — fix: conformance parses DCN bodies in DCN mode; W1 names association-owned ends
**Prompt**: `claude_2026-11-08_0010_prompt_dcn_conformance_body_mode.md`, lane full: (1) conformance parses the Action attributes bound to the dcn `body` role in the DCN action mode when the metamodel binds the dcn roles; (2) the W1 message for an end owned by an association (R-DCN-24); tests first, mutation bench, gates.
**Files touched**: 9e5452556 — `frontend/src/model/conformance/ConformanceValidator.ts`, `conformance/__tests__/ConformanceValidator.test.ts`, `frontend/src/model/dcn/dcnWellFormedness.ts`, `dcn/__tests__/dcnWellFormedness.test.ts`, `frontend/src/components/editor-v2/problems/dcnToProblems.ts` (one line); docs commit — this entry and the Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deroga to the four-file HARD STOP, granted by Alfonso in the lane: dcnToProblems.ts fifth file, the one line in dcnInputOf passing `Association.ownedEnds` (the checker has no other way to reach it). Bench 10 mutants, 9 killed; the dropped producer line survives (no dcnToProblems test in scope). Gates: typecheck 0, targeted 1935/1935, build 0. Full run: the 3 known import reds plus the 1000 ms wall-clock guard of tolerant.test.ts under load (1134 ms), 64/64 alone.
**Prompt document name**: 2026-11-08 00:10

## 2026-11-08 — merge: dcn-conf into alfonso-frontend-jjtl (P-2026-11-08-0040)
**Prompt**: `claude_2026-11-08_0040_prompt_merge_dcn-conf.md`, lane full (merge): bring `dcn-conf` at 577368897 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 631076c5a; re-measure, probes, gates, hard stop for the chat's GO.
**Files touched**: 23b47e83c (merge) — `docs/log-inbox/dcn.md`, `docs/prompts/claude_2026-11-08_0010_prompt_dcn_conformance_body_mode.md`, `frontend/src/components/editor-v2/problems/dcnToProblems.ts`, `frontend/src/model/conformance/ConformanceValidator.ts`, `conformance/__tests__/ConformanceValidator.test.ts`, `frontend/src/model/dcn/dcnWellFormedness.ts`, `dcn/__tests__/dcnWellFormedness.test.ts`; docs commit — this entry and the Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Zero conflicts, index tree equal to merge-tree 13fc4ed9f; three probes once each. The branch tree has no node_modules: its 12 new tests were counted on the two test files (6 + 6), and the merged run matched, 15084, 0 failed, 3 import reds. Trunk-tip baseline: two hook tests timed out under load, 967/967 alone and on the merge. check:docs 5/5. Tip moved after the merge (multi-tab-l5, 46554f772, 28e16543b), these files untouched.
**Prompt document name**: 2026-11-08 00:40

## 2026-11-08 — test: DCN drone object diagram on R-OI instantiation (P-2026-11-08-0011, P-2026-11-08-0057)
**Prompt**: `claude_2026-11-08_0011_prompt_dcn_l25_object_diagram.md` (L2.5: class-owned ends per R-DCN-24, dormant `Charging.chargeRate`, dcn roles bag; object level through S2 `instantiate`, measures, export, light screenshot), stopped at the context ceiling, and its continuation `claude_2026-11-08_0057_prompt_dcn_l25_objects_cont.md` (rerun, screenshot, exports, commits).
**Files touched**: `f097a2847` `frontend/scripts/probe/dcn-drone-fixture.ts` (0011's rewrite plus 0057's object-level grid: values past the slot's chips, sensors in a band under wau1 clear of its values); `a6c855081` `docs/discovery/assets/dcn-drone/` `dcn-drone.json`, `dcn-drone-class-level-light.png`, `dcn-drone-objects-light.png` (new); this commit: this entry and the Status of the two prompts. Split in two commits, not one as the prompt asked: the P13 guard rejects docs and code in one commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. No `frontend/src` change; probe runs 4 to 7 DONE pass=25 fail=0, page errors none; tsc on the probe file exit 0; check:scripts PASS.
**Out-of-scope changes**: no (7 files over three commits, all in the prompt's DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: screenshot read by the lane, chat to read it (`docs/discovery/assets/dcn-drone/dcn-drone-objects-light.png`: six instances, 36 nodes, no overlap)
**Notes**: MEAS: dji 7 slots, chargeRate=1 dormant under Charging; wau1.ownedSensors holds the 4 sensors; 0 instantiation and 0 dcn problems. 16 type_mismatch warnings on Action bodies expected (charge, takeOff, rampUp 2, rampDown 2, drain 2, injectFailure 4, reset 4), fixed on trunk by P-2026-11-08-0010. Run 3 was a load flake: 4 green runs after, no fix. Four sensors, not two: the Alert invariants read all four. Both exports from run 7, roles bound, simProfile dynamicClassification.
**Prompt document name**: 2026-11-08 00:57

## 2026-11-08 — merge: dcn-l25 into alfonso-frontend-jjtl (P-2026-11-08-0154)
**Prompt**: `claude_2026-11-08_0154_prompt_merge_dcn-l25.md`, lane full (merge; 1 conflict, `docs/log-inbox/dcn.md`): bring `dcn-l25` at a42645aa5 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 631076c5a; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: 21e7da758 (merge) — `docs/discovery/assets/dcn-drone/` (`dcn-drone.json`, `dcn-drone-class-level-light.png`, `dcn-drone-objects-light.png`), `docs/log-inbox/dcn.md` (union), the two prompts 0011 and 0057, `frontend/scripts/probe/dcn-drone-fixture.ts`; docs commit — this entry and the Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: check:addonly PASS, typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 566 passed files, 15122 passed and 2 skipped (expected 15122 + 0), hooks 21 files 967/967, build exit 0, check:docs 5/5, check:agents green, check:scripts PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs and probe only; gates verified by the chat C-2026-11-06-2159)
**Notes**: Stopped once: the textual-t8a-ids merge (94a55a92d, code) landed on this prompt's commit; the chat accepted c8153d84a as pre-merge tip, reset target and step-7 base. Union byte-identical to trunk file plus the branch's added lines; 11 probes once each. The branch adds no vitest test (its probe is outside the include; counted from the diff, no node_modules in its tree). Lane board not restarted (no change).
**Prompt document name**: 2026-11-08 01:54

## 2026-11-08 — feat: DCN L4.5 run wiring, startRun to panel (P-2026-11-08-0248, P-2026-11-08-0303, P-2026-11-08-0315)
**Prompt**: `claude_2026-11-08_0248_prompt_dcn_l45_run_wiring.md` (discovery), `claude_2026-11-08_0303_prompt_dcn_l45a_code.md` (stopped at the context ceiling after items 0-2), `claude_2026-11-08_0315_prompt_dcn_l45c_panel.md` (continuation, items 3-5): startRun starts a DCN run, its texts dispatch by net, the panel gates on either role set and shows the DCN inputs row.
**Files touched**: bdd94bfc7 `docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md`; 70c5174c8 `model/simulation/dcn/dcnPanelText.ts` + test; b7bffda4c `sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`; b4bb4c04c `sim/simRoleStatus.ts`, `sim/__tests__/simRoleStatus.test.ts`, `sim/SimulationPanel.tsx`; this entry; Status of the three prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates at b4bb4c04c: typecheck exit 0, typecheck:scripts exit 0, vitest 3 failed (the 3 known import reds) | 567 passed files, 15144 passed tests, build exit 0, check:docs exit 0; the panel render is not covered by a test
**Out-of-scope changes**: no (eight files over three prompts, each in its DOVE: the report, dcnPanelText.ts and test, simBridge.ts and test, simRoleStatus.ts and test, SimulationPanel.tsx)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (separate lane, chat to read the crops)
**Notes**: Benches 13/13, 12/12, 6/6 killed (lists in the commit messages). runEngine is startRun's rule, Petri first, dcn roles read through runBag. The DCN row reuses the sim-panel__event classes, is on while Running, and labels by candidateLabel, which dispatches to dcnCandidateLabel. The heading is DCN_PANEL_HEADING in the panel; simLabels.ts and the inspector's markingHeading are untouched. The unattended decisions are in the handoff of 0303 and the closing report.
**Prompt document name**: 2026-11-08 03:15

**Ticket** (medium): `withInputs` (simRunState.ts:303) overlays only the values the net declares `input: true`; the arguments of a DCN invocation (entries[].inputs, element = the transition id) are not declared, so a value given for `dji.charge(rate)` is asked but may not reach the action. Not measured; the drone visual check uses `takeOff()`, which has no arguments.

## 2026-11-08 — fix: a DCN run freezes its model, class shell flags read the stored field (P-2026-11-08-0345)
**Prompt**: `claude_2026-11-08_0345_prompt_dcn_l45e_freeze.md`: Reset of the drone refused the run («The model cannot be frozen: an L proxy at ...superTypes.0.isAbstract»); root cause first, then the fix, probe acceptance, gates. The cause sat in `eval.ts`, outside DOVE: hard stop with a question, the chat (C-2026-11-06-2159) widened DOVE to the flag reads.
**Files touched**: 53606f71c `frontend/scripts/probe/dcn-drone-run.ts`; 969670d5b `docs/discovery/discovery_2026-11-08_dcn_freeze_proxy.md`; db9d66ddf `frontend/src/jjscript/executor/commands/eval.ts`, `frontend/src/jjscript/executor/__tests__/classShellFlags.test.ts` (new); this entry; Status of the prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 03:40 (P-2026-11-08-0329, the drone run report)
**Causa**: (c)
**Regressions**: no. Gates at db9d66ddf: typecheck exit 0, typecheck:scripts exit 0, vitest 3 failed (the 3 known import reds) | 568 passed files, 15148 passed tests, build exit 0, check:docs exit 0
**Out-of-scope changes**: yes (`eval.ts` and its new test were outside the prompt's DOVE; widened by the chat before the change)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (probe acceptance, crops by the re-run of P-2026-11-08-0329)
**Notes**: The chat widened DOVE to eval.ts (flag reads only). The fix is shared: the same builder serves Petri, DCN, JjScript eval and validation. Red test first (4/4 red, path Association.superTypes.0.isPartial); bench 8/8 killed. Probe: L45d-1 and L45d-2 pass, Reset Running, σ0 classified Mode=Charging, Alert=Safe; then it aborts on its own locator (/^tick/ vs the label dcn-tick). Detail: discovery_2026-11-08_dcn_freeze_proxy.md.
**Prompt document name**: 2026-11-08 03:45

**Ticket** (medium): `dcn-drone-run.ts` presses the tick with `/^tick/i`, but the DCN inputs row labels it `dcn-tick` (MEAS `inputs row`), so the probe aborts after L45d-2 with a 30 s click timeout. Causa line: a latent bug in the shared builder (`isAbstract`/`isInterface`/`isPartial` have no getter and resolve to a same-named child); `cls.partial` falls back to the child again when the D field is unset (read, not measured).

## 2026-11-08 — test: DCN drone run in the Simulation panel, crops (P-2026-11-08-0329)
**Prompt**: `claude_2026-11-08_0329_prompt_dcn_l45d_visual.md`: probe `dcn-drone-run.ts` imports dcn-drone-objects.jjodel, opens the object diagram and the Simulation panel, Choices Random on a fixed seed, Reset, Ticks to Ready, takeOff, three Ticks; four crops and one MEAS per step. The first run stopped on the freeze (fixed by P-2026-11-08-0345); resumed from the chat after the tick selector fix.
**Files touched**: 53606f71c `frontend/scripts/probe/dcn-drone-run.ts` (committed by 0345); 32a3e617e the same probe, the tick matched by its label `dcn-tick`; this entry; Status of this prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (probe only, no frontend/src change)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crops read by the chat 2026-11-08 04:24: 1-reset, 3-takeoff viewed; 2, 4 per MEAS; Charging to Ready to Flying, takeOff one trace step)
**Notes**: Probe 5/5 PASS, page errors none, seed 4242, Choices Random. dji reaches Mode=Ready on Tick 20 (battery 100), the limit exactly; takeOff is trace 20 to 21, Mode=Flying, speed 1; three Ticks fire Mode::Flying drain (distance 3, battery 97). Crops 1-reset 2-ready 3-takeoff 4-flying in ~/.jjodel-lanes/P-2026-11-08-0329/crops/. The panel shows «15 defects: dji.power (no slot and no default); ...» over the heading. Selector fix 32a3e617e.
**Prompt document name**: 2026-11-08 03:29

**Ticket** (low): the inputs row labels the Tick button with its raw id `dcn-tick` (MEAS `tick button label`), where every invocation has a readable label. Also seen, not fixed: the last-step line repeats the label (`dji.takeOff() in Mode::Ready: dji.takeOff() in Mode::Ready fired`); the chips title lists `wau1: ownedSensors = temp`, one of four sensors; every input is on while Running, takeOff in Charging included.

## 2026-11-08 — merge: dcn-l45 into alfonso-frontend-jjtl (P-2026-11-08-0430)
**Prompt**: `claude_2026-11-08_0430_prompt_merge_dcn-l45.md`, lane full (merge; zero conflicts measured): bring `dcn-l45` at 1d2691776 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 089b39fc9; re-measure, probes, gates, hard stop for the chat's GO.
**Files touched**: 617ad7579 (merge) — `frontend/src/components/editor-v2/sim/` (`SimulationPanel.tsx`, `simBridge.ts`, `simRoleStatus.ts`, two tests), `frontend/src/jjscript/executor/commands/eval.ts` and `classShellFlags.test.ts`, `frontend/src/model/simulation/dcn/dcnPanelText.ts` and its test, `frontend/scripts/probe/dcn-drone-run.ts`, two discovery reports, five prompts, `docs/log-inbox/dcn.md`; docs commit — this entry and the Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 569 passed files, 15165 passed and 2 skipped (expected 15139 + 26), 0 failed, the known 3 red at import; hooks 21 files 967/967 (expected 967 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (merge; app check by P-2026-11-08-0329, crops read by the chat C-2026-11-06-2159 at 04:24)
**Notes**: Zero conflicts, no union; merge tree c43096b29 equal to the merge-tree measure; 6 probes once each. Branch vitest not run in /Users/alfonso/jjodel-w-dcn-l45 (no node_modules; writing forbidden): 26 new tests counted at 1d2691776 (+6, +3, +4, +13), matched on the merge. check:docs reports 5/5, not the 4/4 of the prompt. Lane board not restarted (no change). App check by P-2026-11-08-0329, crops read by the chat 04:24.
**Prompt document name**: 2026-11-08 04:30

## 2026-11-08 — fix: DCN Simulation panel polish, findings of the L4.5 visual check (P-2026-11-08-1606)
**Prompt**: `claude_2026-11-08_1606_prompt_dcn_l46_panel_polish.md`, lane full: the Tick reads `Tick`; the last step says the input label once; a DCN input is on only when admissible, the title says why; the chips title lists a multi-valued slot; invocation arguments through `withInputs`; gates, mutants, one probe run.
**Files touched**: 1af6fc775, fe041980c, 040f431ee `frontend/src/model/simulation/dcn/dcnPanelText.ts` and its test; 69d4a4da7 the same, `frontend/src/components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `__tests__/simBridge.test.ts`; 4a7b147c6 `sim/simRunState.ts`, `__tests__/simBridge.test.ts`; 4bf647cf4 `frontend/scripts/probe/dcn-drone-run.ts`; docs commits: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 03:29 (the findings in its log entry)
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no (nine files, all in the DOVE of the prompt: dcnPanelText.ts and test, simBridge.ts and test, SimulationPanel.tsx, simRunState.ts, the probe, this inbox, the prompt)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crops read by the chat 2026-11-08 16:23: Tick label, takeOff greyed in Charging and in Flying, rampUp/rampDown on in Flying)
**Notes**: Gates: typecheck, typecheck:scripts, build, check:scripts exit 0; vitest 3 known import reds, 15441 passed. Bench 19/20 killed; survivor: the panel `on` line, held by probe L46-1/2. Probe 7/7, seed 4242, 20 Ticks to Ready. Item 5 measured failing; fixed for `self.[rate]`, the R-SIM-88 read form. Item 4 uses the DCN links, since σ holds the first target. `dcnClassificationLine` of the prompt is `dcnMarkingLine`. Causa: findings seen only in the L4.5 visual check.
**Prompt document name**: 2026-11-08 16:06

**Ticket** (medium): a bare argument name in a DCN body (`self.chargeRate := rate`) still halts with `'rate' does not exist`: the evaluation context is built in `dcnStep.ts` (`actions`), outside this lane's scope; `self.[rate]` works. A multi-valued attribute slot (not a link) still shows its first value: σ holds one and `dcnCompile.ts` was out of scope. A DCN argument named as a slot of its instance is not readable through `self.[...]` (σ is kept).

## 2026-11-08 — test: DCN drone fixture fills the empty slots, exports regenerated (P-2026-11-08-1652)
**Prompt**: `claude_2026-11-08_1652_prompt_dcn_l47_drone_data.md`, lane full: a value for `dji.power`, `dji.vmax` and every sensor slot, initial state still Charging and Safe; both exports, screenshots and `dcn-drone.json` regenerated; run probe once on the new export, no defects line, Ready within 20 Ticks.
**Files touched**: de1ff2fb8 `frontend/scripts/probe/dcn-drone-fixture.ts`, `docs/discovery/assets/dcn-drone/` (class-level and object-level png, `dcn-drone.json`); 11f6f1c0b `frontend/scripts/probe/dcn-drone-run.ts`; outside the repo `~/jjodel-demo-exports/dcn/dcn-drone.jjodel`, `dcn-drone-objects.jjodel`; docs commit: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 03:29 (the empty-slot finding in its log entry, «15 defects»)
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (seven repo files, all in the DOVE of the prompt: the fixture, the run probe, three assets, this inbox, the prompt)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crop 1-reset read by the chat 2026-11-08 17:10: no defects line, Charging/Safe, Tick on, takeOff greyed)
**Notes**: Fixture 26/26 (O-6 new), dcn and instantiation problems zero, conformant. Defaults: power 0, unit, status OK, presence false. Slots: vmax 15, temp 20, wind 3, humidity 45, rain 0. Run probe 9/9, seed 4242: L47-1 no defects line (control: panel text, not a defective run), L47-2 Charging and Safe, Ready on Tick 20. Status committed per the prompt, ahead of the chat's check (P13). Object screenshot copied from DCN_CROPS. Crops in ~/.jjodel-lanes/P-2026-11-08-1652/crops/.
**Prompt document name**: 2026-11-08 16:52

## 2026-11-08 — feat: DCN run card state, pure per instance (P-2026-11-08-1829)
**Prompt**: `claude_2026-11-08_1829_prompt_dcn_s5_1_canvas_state.md`, lane full, slice 5 lane 1: `dcnCanvasState.ts`, plain data for one instance (viewpoints with active classes, dormant slots, tick monitors, static slots changed since Reset; null for a non-instance), test red first, gates, bench of at least 6 mutants. No UI.
**Files touched**: d614f6dde `frontend/src/model/simulation/dcn/dcnCanvasState.ts` (new), `frontend/src/model/simulation/dcn/__tests__/dcnCanvasState.test.ts` (new); docs commit: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: New module with test: dcnNodeStateOf adds nameOf (DcnEntry holds only the monitor id). classify covers all instances: WeakMap per state. Bench 19/20; survivor is the unreachable guard on an absent slot (R-DCN-3). Typecheck 0; vitest 15456 passed, 3 known import reds, irSelectionRing load red (hook timeout), alone 5/5; build 0. Gates through a temporary node_modules symlink to ~/jjodel (P14), removed after. A viewpoint with no class keeps its empty row.
**Prompt document name**: 2026-11-08 18:29

## 2026-11-08 — feat: DCN run card data reachable from the canvas (P-2026-11-08-1905)
**Prompt**: `claude_2026-11-08_1905_prompt_dcn_s5_2_registry.md`, lane full, slice 5 lane 2: the DCN run registry moves to a module simRunState can read, `getSimDcnNode(objectId)` on the shown step cached per record, tests red first, gates, bench of at least 5 mutants. No UI.
**Files touched**: b109e1479 `frontend/src/components/editor-v2/sim/simDcnRuns.ts` (new), `sim/simBridge.ts`, `sim/simRunState.ts`, `sim/__tests__/simBridge.test.ts`; docs commit: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Registry in simDcnRuns.ts; it gains nameOf (the lookup at Reset), since simRunState has no lookup. Tests in simBridge.test.ts on real startRun and presses. Bench 12/12. Typecheck 0; vitest 15464 passed, 3 known import reds, tolerant.test.ts load red (timing, 91 vs 50 ms), alone 64/64; build 0. Gates through a temporary node_modules symlink to ~/jjodel (P14), removed after.
**Prompt document name**: 2026-11-08 19:05

## 2026-11-08 — test: DCN drone object level in the UML object viewpoint (P-2026-11-08-1939)
**Prompt**: `claude_2026-11-08_1939_prompt_dcn_s5_0_object_view.md`, lane full, slice 5 lane 0 (R-DCN-29): the UML object views copied into the drone fixture, both exports, screenshots and `dcn-drone.json` regenerated, a check on the export's viewpoint, run probe once, screenshot read. Answer of the chat after the stop on the lost links: re-apply them after `buildLinks`, one MEAS per loss, a non-failing count.
**Files touched**: 13ff7af42 `frontend/scripts/probe/dcn-drone-fixture.ts`, `docs/discovery/assets/dcn-drone/` (class-level and object-level png, `dcn-drone.json`); outside the repo `~/jjodel-demo-exports/dcn/dcn-drone.jjodel`, `dcn-drone-objects.jjodel` (previous ones in `~/.jjodel-lanes/P-2026-11-08-1939/prev/`); docs commit: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (six repo files, all in the DOVE of the prompt: the fixture, three assets, this inbox, the prompt)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (screenshot read by the chat 2026-11-08 20:35: six instances with slot rows, readable, no overlap)
**Notes**: Fixture 30/30 (O-7, O-8, RT-1, L-1 new), dcn and instantiation problems zero, conformant. Run probe 9/9, no selector changed, Ready on Tick 20. Exports from the green run; earlier runs: 4 edited and 1 on HEAD each lost one link. The green run, with a settle added after buildLinks, lost none: the re-apply branch is unexercised. Own 3x2 grid in the viewpoint. check:scripts 0, tsc on the fixture 0; repo typecheck, vitest, build not run (no frontend/src change).
**Prompt document name**: 2026-11-08 19:39

**Ticket** (high, for a diagnosis lane): a containment write from `syncCreateCompositionLink` is lost about once per fixture build: 5 of 5 runs, load 3-13, also on unmodified HEAD, a different link each time (`WindSensor.ownedAttributes->p_WindSensor_speed`, `pkg.packagedElements->Boolean`, `TempSensor.ownedOperations->op_TempSensor_injectFailure` twice, `TempSensor.ownedAttributes->p_TempSensor_value`). Cause not diagnosed. A sixth run, with a settle added after `buildLinks`, lost none (L-1 counts 0): one observation, not a cause. The fixture now re-applies a lost link and L-1 reports it without failing.

**Ticket** (low): the copied row template shows `values[0]` only, so `wau1` reads `ownedSensors = temp` while the slot holds the four sensors. Kept as copied, by the chat's answer.

## 2026-11-08 — feat: DCN run card under the instance node (P-2026-11-08-2042)
**Prompt**: `claude_2026-11-08_2042_prompt_dcn_s5_3_run_card.md`, lane full, slice 5 lane 3 (R-DCN-29): the run card in `SimNodeRunState` below the node, viewpoint compartments, dormant slots, monitors, changed static slots, one column with the tags, no dashed ring; styles; the drone probe with DOM assertions and three crops; gates. After the stop on the test mock, the chat's answer: one line in that mock, a ticket on the panel chips.
**Files touched**: da677a25f `frontend/src/components/editor-v2/sim/SimNodeRunState.tsx`, `sim/simNodeRunState.scss`; 3a3563cc4 `frontend/scripts/probe/dcn-drone-run.ts`; 2b6effb56 `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irActivityRender.test.ts`; docs commit: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes (4 tests of irActivityRender.test.ts, red because its mock lacked getSimDcnNode; fixed in the lane, no production behaviour affected)
**Out-of-scope changes**: yes (test mock only, granted by the chat: one line in irActivityRender.test.ts; six repo files in all, the five of the DOVE and this mock)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (GO given; 1-charging and 2-flying read by the chat 2026-11-08 20:58: the card is right; 3-stepback read by the lane only)
**Notes**: Probe 17/17, port 3142. Run twice: in the first the open panel hid the card in the crops, so it is hidden for the crop only. Ring absent on dji with enabled true. Typecheck, scripts, build 0; vitest 15465 passed, 3 known import reds. Stopped once: the card broke the mock in irActivityRender.test.ts (4 reds, under viewpoint/ir/); the chat granted one line. Column only around a card, Petri DOM unchanged. At this zoom the open panel covers dji's card.
**Prompt document name**: 2026-11-08 20:42

**Ticket** (medium): the panel Classification chips do not follow the viewed step at step back (R-SIM-106): with the timeline at step 0 the card reads Charging while the chips read `dji.Mode = Flying` (probe MEAS `card step back`, `panelChips`).

## 2026-11-08 — feat: DCN snapshot copy, the pure plan (P-2026-11-08-2124)
**Prompt**: `claude_2026-11-08_2124_prompt_dcn_s5_4_snapshot_plan.md`, lane full, slice 5 lane 4 (R-DCN-27, R-DCN-30): `planSnapshot`, the ordered list of operations that copy an M1 model and write σ over it, executing nothing, with its test red first; gates; bench.
**Files touched**: 73476ef3f `frontend/src/components/editor-v2/sim/simSnapshot.ts` (new), `frontend/src/components/editor-v2/sim/__tests__/simSnapshot.test.ts` (new); docs commit: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: σ goes on the first holder of the first Slot (slots are objects, as in slotsOf); enum slots point to the literal. Outside-model targets and LiteralNull holders are listed in `unwritten`, for lane 5 to show. Bench 31/31, one survivor first. Typecheck, build 0; vitest 15500 passed, 3 known import reds. Temporary node_modules link (P14), removed. Red first at the import.
**Prompt document name**: 2026-11-08 21:24

## 2026-11-08 — feat: DCN snapshot written as a new model, layout, exact match (P-2026-11-08-2355)
**Prompt**: `claude_2026-11-08_2157_prompt_dcn_s5_5_snapshot_write.md`, `claude_2026-11-08_2216_prompt_dcn_s5_5b_snapshot_write_cont.md`, `claude_2026-11-08_2320_prompt_dcn_s5_5c_snapshot_layout.md`, `claude_2026-11-08_2355_prompt_dcn_s5_5d_snapshot_close.md`, lanes full and critical, slice 5 lane 5 (R-DCN-30): write a run snapshot as a new model in one undo, keep the source layout, match source vertices by id, probe with edges on open; gates; closure
**Files touched**: 3cc93959d, f26b6faa6, 31db26323, 220791eb5 `frontend/src/components/editor-v2/sim/simSnapshotWrite.ts` (new), `frontend/src/components/editor-v2/sim/__tests__/simSnapshotWrite.test.ts` (new); 220791eb5 `frontend/src/components/editor-v2/sim/simSnapshot.ts`, `frontend/src/components/editor-v2/sim/__tests__/simSnapshot.test.ts`; aa2c628f8, 50fe1ccbc `frontend/scripts/probe/dcn-snapshot.ts` (new); 795940ae1, 765f6068d `docs/discovery/lir_2026-11-08_dcn_snapshot_write.md` (new); docs commits: this entry, Status of the four prompts
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 23:50 (P-2026-11-08-2320 stopped at the context ceiling, closure owed)
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no (11 files, all in the prompts' DOVE: the writer, the plan and their two tests, the probe, the LIR, this inbox, the four prompts)
**Layer Impact Report**: produced: docs/discovery/lir_2026-11-08_dcn_snapshot_write.md, with its addendum
**Smoke visivo**: passato (crop of P-2026-11-08-2320 read by the chat 23:53, dji's seven rows visible)
**Notes**: Objects the plan adds still get the Step 2bis grid, which supersedes the 2216 ticket for the rest. SN-24: source and snapshot draw 0 edges of 188 stored, same endpoints; the control on the 0 is the node count. Second cause (d): the overlap of 2320 seen only at the visual check. Bench 5/5 on sourceId, 19/19 on the layout. Vitest 15542 passed, 3 known import reds. Probe 24/24, ~/.jjodel-lanes/P-2026-11-08-2355.
**Prompt document name**: 2026-11-08 23:55

**Ticket** (low): the row template shows values[0] of a multi-valued slot.

## 2026-11-09 — feat: DCN Save snapshot button in the Simulation panel (P-2026-11-09-0017)
**Prompt**: `claude_2026-11-09_0017_prompt_dcn_s5_6_snapshot_button.md`, the button after Stop for a DCN run, its line, the probe by the button, crops.
**Files touched**: 0e71ec074 `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/simSnapshotButton.ts` (new), `frontend/src/components/editor-v2/sim/__tests__/simSnapshotButton.test.ts` (new); 55fe8cbb8 `frontend/scripts/probe/dcn-snapshot.ts`; this inbox; the Status of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no (6 files, all in the DOVE of the prompt: panel, helper, its test, probe, this inbox, the prompt; the stylesheet needed no change)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (GO given; 1-button and 2-saved read by the chat 2026-11-09 00:47: camera button last in the transport row, Saved as drone (snapshot step 24))
**Notes**: Probe 29 PASS, 0 FAIL, SN-25..29 new. SN-30, a Petri run has no button, was skipped by MEAS: no Simulation panel on demoNet after two open2, so that absence rests on the dcnEngine guard, not on a browser read; hence Regressions unknown. SN-29: Play on DCN ends in its first beat, the off state read by a MutationObserver. Vitest: the 3 known import reds, 15551 pass. The load wait used Monitor, the wait the harness allows; no lane work ran in it.
**Prompt document name**: 2026-11-09 00:17

## 2026-11-09 — fix: DCN bare invocation arguments, chips at step back (P-2026-11-09-0055)
**Prompt**: `claude_2026-11-09_0055_prompt_dcn_s5_t_tickets.md`, lane full: an argument read by its bare name in a DCN body and precondition; the panel's Classification chips follow the shown step (R-SIM-106); one probe run with the step-back check and a crop; gates, mutants.
**Files touched**: 57a7fc6da `frontend/src/model/simulation/dcn/dcnStep.ts` and its test, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`; 10b207546 `frontend/src/components/editor-v2/sim/simBridge.ts`, `sim/SimulationPanel.tsx`, the same test; 93619a11a `frontend/scripts/probe/dcn-drone-run.ts`; docs commits: this entry, Status of the prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 16:06 and 2026-11-08 20:42 (their tickets)
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no (eight files, all in the DOVE of the prompt: dcnStep.ts and test, simBridge.ts and test, SimulationPanel.tsx, the probe, this inbox, the prompt)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (GO given; 1-stepback-chips read by the chat 2026-11-09 01:13: slider at step 0, chips dji.Mode = Charging)
**Notes**: Probe 18/18, port 3155. Typecheck, scripts, build 0; vitest 15562 passed, 3 known import reds. Bench 12/13, survivor equivalent. Causa per ticket: 1606 (c), bare names outside the context; 2042 (c), the panel's view off the version. Slot keeps σ as self.[name]; roots win over an argument, an argument over an instance. Petri chips stay live: the panel's Petri line is live too. dji.charge(rate) not probed: in the drone charge is a monitor, no parameter.
**Prompt document name**: 2026-11-09 00:55

**Ticket** (low): `SimInspector.tsx:415` calls `markingChips(state, lookup)` without the net, so on a DCN run it lists places, of which a DCN net has none (read, not run). The panel's status line stays on the live step while a past step is shown (crop: `step 24` at step 0).

## 2026-11-09 — feat: DCN coherence roles and their reader (P-2026-11-09-0124)
**Prompt**: `claude_2026-11-09_0124_prompt_dcn_s5_7_coherence_roles.md`, lane full: nine optional roles of the dcn group binding coherence constraints, and a reader returning the constraints as plain data, with a defect for a bad k.
**Files touched**: d6e051d6c `frontend/src/model/simulation/roleCatalog.ts`, `frontend/src/model/simulation/dcn/dcnRoles.ts`, `frontend/src/model/simulation/profileCodec.ts`, `frontend/src/model/simulation/__tests__/roleCatalog.test.ts`, `frontend/src/model/simulation/__tests__/simProfiles.test.ts`, `frontend/src/model/simulation/dcn/__tests__/dcnRoles.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRolesDraft.test.ts`; this inbox and the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes (minor, accepted by the chat: a dcn user copy stored before these roles now reads as modified, see the ticket below)
**Out-of-scope changes**: yes (granted by the chat, nine files in all: `profileCodec.ts` for the off-and-omit fill of the nine roles, three lines of `simRolesDraft.test.ts`; `simProfiles.ts` needed no change, its dcn role list derives from the group)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI path; GO given by the chat 2026-11-09)
**Notes**: Two stops, both granted by the chat: DOVE cited a wrong directory; the new roles made stored dcn profiles undecodable. Reader: dcnCoherenceFromRoles(stc, view), a bad k is a DeclarationDefect `bounds` and drops the pattern only. Typecheck, build 0; vitest 15586 passed, 3 known import reds; check:docs 0. Bench 22/22. Gates ran through a temporary node_modules symlink to ~/jjodel, removed after.
**Prompt document name**: 2026-11-09 01:24

**Ticket** (low): `isModified` (`simRolesDraft.ts:402`) compares a user copy with its system profile, where the nine coherence roles are in edit: a dcn copy stored before them holds them off, so it reads as modified. The copy stays readable and re-encodes to the same string. Left as is by the chat.
