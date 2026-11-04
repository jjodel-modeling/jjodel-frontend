# log-inbox — lane «hw-notation»

Entries written by the hw-notation lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-02 — feat(jjtl): A3, placed targets marked __nested, write-back reads one test (P-2026-11-02-2108)
**Prompt**: P-2026-11-02-2108, Alfonso's ruling: a placed target carries the `__nested` format; the write-back replaces `v.__nested || isPlacedIn(...)` with one test; `targetModel.containment` stays.
**Files touched**: `frontend/src/jjtl/executor/executor.ts`, `executor/traceModel.ts`, `executor/__tests__/containment-placement.test.ts`, `jjtl/__tests__/jjel-path-parity.test.ts`, `components/project/ProjectEditor.tsx`, `nestedMaterialization.ts`, `__tests__/nestedMaterialization.test.ts`, `frontend/src/jjtl/SPEC.md`, this inbox, the `Status:` line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Marked in settleContainment after pass 2, plus `__placed` so isRuleTarget and both serializers still read a rule target. Claim-time marking kills 4 tests, the old serializer 2. Probe port 3194: A1-A5, save/reopen and A0 S1-S5 same figures as P-2024. Gates: 461 jjtl+project, full 12951 (9 known + 2 laneRun timeouts, 145/145 alone), tsc 0, build 0. Probe: `~/.jjodel-lanes/P-2026-11-02-2108/probe/`.
**Prompt document name**: 2026-11-02 21:08

## 2026-11-02 — feat(jjtl): A2, placed targets written inside their container by the nested path (P-2026-11-02-2024)
**Prompt**: P-2026-11-02-2024, close P-2026-11-02-1956, LIR, then the app's write-back of rule targets placed in a containment, the nine handoff items, measured through the real Execute dialog.
**Files touched**: `frontend/src/components/project/ProjectEditor.tsx` (STEP 6, 6c, 8b), `nestedMaterialization.ts`, `__tests__/nestedMaterialization.test.ts`, `frontend/src/jjtl/SPEC.md`, `docs/discovery/lir_2026-11-02_jjtl_containment_writeback.md` (new), this inbox, the `Status:` lines of both prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato
**Notes**: Probe port 3193, two runs, one tab per scenario: depth 3 both orders, 8 objects, roots s1 and e1 only, order and pointers out of the tree right; mixed feature [a,b,c,made]; second claim fails visibly, no model; save/reopen same tree; P-1838 S1-S5 unchanged. Undo after a run: output tab Undo button disabled, Cmd+Z changes nothing. Gates: 453 jjtl+project, full 12945 (9 known), tsc 0, build 0. Probe: `~/.jjodel-lanes/P-2026-11-02-2024/probe/`.
**Prompt document name**: 2026-11-02 20:24

## 2026-11-02 — feat(jjtl): A1, containment placement through the trace in the executor (P-2026-11-02-1956)
**Prompt**: P-2026-11-02-1956, containment placement of rule targets through the trace in the executor only: ownership errors, per-model trace, ticket #445 finding, parity serializer, SPEC, write-back list for the next lane.
**Files touched**: `frontend/src/jjtl/executor/executor.ts`, `traceModel.ts`, `__tests__/containment-placement.test.ts` (new), `__tests__/nested-name-undeclared.test.ts` (new), `frontend/src/jjtl/__tests__/jjel-path-parity.test.ts`, `frontend/src/jjtl/SPEC.md`, this inbox, the prompt's `Status:`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Placed targets stay unmarked, ownership in `targetModel.containment` and `traceModel.placements`; second claim and cycle fail the run. App write-back unchanged by design: until P-2026-11-02-2024 placed targets become roots, hence Regressions unknown and no merge. Session stopped at the context ceiling; this entry and the Status line written by P-2026-11-02-2024 from the handoff. Gates: src/jjtl 436 passed, full suite 12941 passed (9 known import failures), typecheck 0.
**Prompt document name**: 2026-11-02 19:56

## 2026-11-02 — discovery: can an M1 model depend on another M1 model (P-2026-11-02-2021)
**Prompt**: P-2026-11-02-2021: measure in a running app whether an M1 can depend on another M1 (gesture, reference and getters, save and reopen, delete and cycle, what the JjTL Execute path receives), say what C0 needs, and register R-JTG-8 as provisional.
**Files touched**: `docs/discovery/discovery_2026-11-02_m1_depends_on_m1.md` (new), `docs/decisions.md` (R-JTG-8), this inbox, the `Status:` line of the prompt. Probes outside the repo in `~/.jjodel-lanes/P-2026-11-02-2021/probe/`. No product code.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Yes in the UI (Info panel, "Depends from models"), survives save and reopen; Library delete clears dependency and reference silently; cycle accepted, no hang. Execute reads allSubObjects, so the Library reference is serialised and lost (warned, empty slot). C0 needs one change at ProjectEditor.tsx:1463-1464. Not measured: Library of another metamodel, export.
**Prompt document name**: 2026-11-02 20:21

## 2026-11-02 — ticket: the textual printer writes a bare reference keyword when the target is not in the text, and the text does not parse
**Ticket**: `printTextModel` skips a reference whose target id is not among the printed objects (`printer.ts:91,161,188`). For a Brief whose `library` and `operations` point at objects of another model it prints `library` (keyword with no value) and `operations []`, and `parseText` rejects that text (`4:15 expected an integer; found "]"`). The printer is not total over a model with a cross-model reference, so the print-parse-print property of R-TXT-21 (1) does not hold there. Measured with `probe5` in `~/.jjodel-lanes/P-2026-11-02-1942/`. Fix belongs with the cross-model reference work, or earlier as a guard that prints nothing for the feature.
**Priority**: medium
**Found in**: P-2026-11-02-1942
**Detail**: docs/discovery/discovery_2026-11-02_textual_notation_for_templates.md

## 2026-11-02 — discovery: how far the default textual notation goes for template and library models (P-2026-11-02-1942)
**Prompt**: P-2026-11-02-1942: measure by running what R-TXT (T1 to T4a-1) already covers for template and library models: round trip of a library, a template fragment and a Brief; depth and size at about 2,500 objects; hand-writing cost against infix; custom concrete syntax for a class; references to another model; one recommendation with an owner.
**Files touched**: `docs/discovery/discovery_2026-11-02_textual_notation_for_templates.md` (new), this inbox, the `Status:` line of the prompt. Probes outside the repo in `~/.jjodel-lanes/P-2026-11-02-1942/`. No code.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Default notation round-trips (41 objects) and prints 2,150-2,450 balanced objects in 9-16 ms, parses in 15-22 ms; stack overflow beyond 500 levels (print) and 375 (parse). An expression is 10-12x its infix length; `operator` annotation is stored, not applied. No cross-model reference. Recommended: extend, owner `codegen`. Not measured: Monaco, browser stack, T6.
**Prompt document name**: 2026-11-02 19:42

## 2026-11-02 — docs(jjtl): R-JTG-6 and R-JTG-7 registered, A0 write-back exercised in the running app (P-2026-11-02-1838)
**Prompt**: P-2026-11-02-1838, register the two rulings Alfonso gave on 2026-11-02 18:35, replace the Open block of SPEC 5.3.2, and probe the A0 write-back in the app: a reference between two rules in both orders, one nested creation, one two-rule cycle.
**Files touched**: `docs/decisions.md`, `frontend/src/jjtl/SPEC.md`, this inbox, the `Status:` line of the prompt. Probe outside the repo: `~/.jjodel-lanes/P-2026-11-02-1838/probe/a0-writeback.ts` and its json.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Probe on the real Execute dialog, port 3187: rules in either order, nested creation and cycle all bind to the real target, 0 fallback warnings, ~0.6 s per run; control S5 (no Pet rule) raises the warning. Reusing one transformation tab for several runs executed a stale AST (JjtlDevelopmentEnv, not A0): one tab per scenario. Nested `name := "toy"` is not applied (both TToy are named TToy_0).
**Prompt document name**: 2026-11-02 18:38

## 2026-11-02 — feat(jjtl): A0, resolved targets bound by identity, fallbacks reported, SPEC 5.3, R-JTG (P-2026-11-02-1742)
**Prompt**: P-2026-11-02-1742 resumed on Alfonso's GO: parity serializer change approved on condition every rule target's content is still compared as a root; Steps 3 to 6.
**Files touched**: `frontend/src/jjtl/executor/executor.ts`, `traceModel.ts`, `__tests__/bind-resolved-target.test.ts`, `__tests__/source-collections-in-expressions.test.ts`, `__tests__/resolution-fallbacks.test.ts` (new), `frontend/src/jjtl/__tests__/jjel-path-parity.test.ts`, `frontend/src/jjtl/SPEC.md`, `docs/decisions.md`, the discovery report, this inbox, the prompt's `Status:`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out of scope: `jjel-path-parity.test.ts`, approved by Alfonso. Its serializer writes a rule target short outside `roots` and throws if one is not a root (every rule target is pushed to roots, `executor.ts` single creation site), so A will trip it on purpose. Gates: src/jjtl 408 passed, full suite 12905 passed (9 known import failures), typecheck 0. No app smoke: write-back read, not run.
**Prompt document name**: 2026-11-02 17:42

## 2026-11-02 — ticket: two JjTL executor tests fail once the joiner import is mocked
**Ticket**: `executor-bridge.test.ts` "Test 5: Nested object creation" and `executor-llayer.test.ts` "forall with such that filter using item property" fail on the tip when `joiner` is mocked; both files normally fail at import (`window is not defined`), so the failures are invisible. Read, not diagnosed: Test 5 expects a nested object without the `__sourceId`/`__createdBy`/`__nested` markers added by P-2026-10-30-1330 (stale expectation); the llayer case leaves `tables[0].columns` undefined for a forall in a rule body with no target metamodel (placement of a body forall). Neither involves trace resolution: neither bears on part A.
**Priority**: low
**Found in**: P-2026-11-02-1742

## 2026-11-02 — test(jjtl): A0 step 1, copy on bind confirmed; stopped at the step 2 inventory (P-2026-11-02-1742)
**Prompt**: P-2026-11-02-1742, JjTL slice A0: confirming test of copy on bind, inventory of what relies on it, then binding by identity, reported fallbacks, SPEC §5.3/§12.3, R-JTG rows. Stop with a question if anything beyond `source-collections-in-expressions.test.ts:136` relies on the copy.
**Files touched**: `frontend/src/jjtl/executor/__tests__/bind-resolved-target.test.ts` (new, d2e2c8574), this inbox, the `Status:` line of the prompt.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Copy on bind confirmed on both parse paths (4/4). Identity probe, reverted, patch in `.agent-logs/P-2026-11-02-1742-identity.patch`: `jjel-path-parity.test.ts` fails 4 fixtures (tests#126, #129, #130, SPEC.md#3, the SM2PN arcs), its serializer JSON-stringifies output that identity makes cyclic. Steps 3-6 not done; awaiting Alfonso. Gates ran through a temporary `frontend/node_modules` symlink, removed.
**Prompt document name**: 2026-11-02 17:42

## 2026-10-21 — ticket: JjEL: 0xFF evaluates silently to 0 (lenient parse drops trailing tokens)
**Ticket**: JjEL reads `0xFF` as the number `0` followed by the identifier `xFF`, and the lenient `parse()` keeps the first expression and drops the rest without an error (discovery `docs/discovery/discovery_2026-10-20_jjel_bitvector.md` §3.3; known defect in `docs/spec/concern_languages.md:102`, parse() does not check EOF). A hardware user writing a hex constant gets 0 silently. Expected: a parse error on trailing tokens, or hex/binary number literals; at minimum the error. Found by P-2026-10-20-2055.
**Priority**: medium
**Found in**: P-2026-10-20-2055

## 2026-10-21 — ticket: codegen: a Run result holding a bit-vector breaks JSON.stringify in CodePanel and checkView
**Ticket**: A codegen Run whose result holds a bit-vector throws during render: `frontend/src/codegen/ui/CodePanel.tsx:582` renders `JSON.stringify(outcome.response.results[0])`, and a vector comes back from the worker as a structured clone with a `BigInt` payload and no `toJSON`, so `JSON.stringify` throws `Do not know how to serialize a BigInt`. Same hazard in `frontend/src/codegen/ui/checkView.ts:76,85`. Read by P-2026-10-21-0640, not reproduced in the app; not fixed by S3.
**Priority**: high
**Found in**: P-2026-10-21-0640

## 2026-10-21 — ticket: codegen: the example templates' inDomain has no word case
**Ticket**: The lecture example templates (`frontend/src/codegen/examples/*/…json`, `genTemplates`) generate an `inDomain` with no `word` branch: a `word` value falls into the enum branch and is false, so the generated program of a model with a word-domain attribute halts `domain` at its first write; DECLARED also carries no width. Read by P-2026-10-21-0640; the S3 oracle test declares its register with `domain: null` to stay clear of it. The R-GEN-11 oracle would catch it on any word-domain scenario.
**Priority**: medium
**Found in**: P-2026-10-21-0640

## 2026-10-21 — ticket: Extend the codegen prelude parity test to the 4733-row oracle table
**Ticket**: The parity test of the generated JS prelude against the S1 bit-vector module (`printer.bitvector.test.ts`, P-2026-10-21-0700) runs on the 48 golden rows of `bv-golden.json` only, because the Verilator table `bv-cases.json` (4733 rows, P-2026-10-21-0641) was not on its branch. Both are now on the trunk: extend the parity test to the full table so the prelude copy cannot drift (R-BV-6).
**Priority**: low
**Found in**: P-2026-10-21-0700

## 2026-10-31 — feat: JjEL range(n) and range(a, b), usable in a JjTL forall
**Prompt**: P-2026-10-31-1740: add `range(n)` / `range(a, b)` to JjEL for the hardware generator (registers, bits, stages): integers only, errors naming the function, usable in JjTL `forall` and in code generator templates; report the count of bare `range` reads before choosing global vs method.
**Files touched**: `a64d90f7e`: `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjel/SPEC.md`, `frontend/src/jjel/__tests__/range.test.ts` (new), `frontend/src/jjtl/executor/__tests__/range-forall.test.ts` (new). Status flip of the prompt and this entry in the docs commit that follows.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 0 before and after; `vitest src/jjel src/jjtl` 667 -> 695 tests, 7 files fail to load with "window is not defined" before and after (the known list); `src/codegen src/model` 89 files, 3535 tests green; build exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Global, like `bits`; bare `range` reads in tests, fixtures and samples: 0 (all hits are prose, `'range'` strings, Monaco ranges, `domain.kind`). The JjTL executor evaluates in its own EvaluationContext, which the evaluator's globals never reach, so it registers `range` itself (one line, away from runForAll). Added a 1,000,000-element cap, not in the prompt.
**Prompt document name**: 2026-10-31 17:40

## 2026-10-31 — ticket: JjEL global builtins other than range may be missing in JjTL and validation expressions
**Ticket**: `JjelEvaluator.registerGlobalBuiltins` registers `String`, `Number`, `Boolean`, `Array`, `bits`, `sbits` and the date constructors on its own context only. `JjTLExecutor` (`executor.ts:989`) and `validationEvaluator.ts:268` evaluate in a context they build themselves, so a global called there resolves to "not defined" or null. Measured for `range` only (it failed in a JjTL forall until registered on `evalContext`); the other globals are inferred from the same lookup path (`ctx.getBuiltin`), not run.
**Priority**: low
**Found in**: P-2026-10-31-1740

## 2026-10-31 — merge: jjel-range into alfonso-frontend-jjtl (P-2026-10-31-1746)
**Prompt**: Bring `jjel-range` at `ad4ef1cc8` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 9654de9b6 (7 files from the branch: `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjel/SPEC.md`, `__tests__/range.test.ts` (new), `executor/__tests__/range-forall.test.ts` (new), prompt 1740 and this inbox file); `docs/prompts/claude_2026-10-31_1746_prompt_merge_jjel-range.md` Status line; `docs/log-inbox/hw-notation.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (evaluator and executor only; range covered by range.test.ts and range-forall.test.ts, green on 9654de9b6)
**Notes**: Tip moved mid-session (40dd35d28, de519893f: docs only, other chats), accepted. Merge-tree: zero conflicts, tree f7c289a56 = merge commit's; 7 files branch side, none on both, no governance file; 2 probes once each; no union. Gates on 9654de9b6: typecheck 0, typecheck:scripts 0; vitest 12401 passed, 466 files, 9 known red at import (12373 + 28); hooks 967; build 0; check:docs 5/5; check:agents, check:scripts, check:addonly PASS. Lane board untouched.
**Prompt document name**: 2026-10-31 17:46

## 2026-11-02 — discovery: JjTL generic transformation, Phase 1 report (P-2026-11-02-1425, P-2026-11-02-1612)
**Prompt**: P-2026-11-02-1425: Phase 1 only of the request for one domain-free JjTL transformation (A implicit trace resolution with containment, B called/lazy rules with an environment, C multi-model sources, D inheritance matching, E slots holding fragments): verify the premises, design proposal, answers to questions 1-7, Layer Impact Report. The 1425 session stopped at the context-ceiling hook before writing; P-2026-11-02-1612 wrote the report from its handoff.
**Files touched**: `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md` (new), this inbox, the `Status:` lines of the two prompt files. No code.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced (in the report, section 7)
**Smoke visivo**: non applicabile
**Notes**: Log in the lane inbox (P9), not `docs/claude-code-log.md` as the 1425 prompt says. SPEC §5.3 "NOT IMPLEMENTED" is stale (references resolve through the trace; containment does not). Recommended order A0 -> A -> B -> C0 -> D. All claims are read, none run; the snapshot copy (executor.ts:1671) must be confirmed by a test in the first Phase-2 lane.
**Prompt document name**: 2026-11-02 14:25

## 2026-11-02 — merge: jjtl-generic-transformation into alfonso-frontend-jjtl (P-2026-11-02-1905)
**Prompt**: Bring `jjtl-generic-transformation` at `88dd98234` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 8f14055bf (14 files from the branch: `frontend/src/jjtl/executor/executor.ts`, `traceModel.ts`, `frontend/src/jjtl/SPEC.md`, `bind-resolved-target.test.ts` (new), `resolution-fallbacks.test.ts` (new), two modified tests, `docs/decisions.md`, the discovery report, four prompt files, this inbox file); `docs/prompts/claude_2026-11-02_1905_prompt_merge_jjtl-generic-transformation.md` Status line; `docs/log-inbox/hw-notation.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, unattended: 3001 HTTP 200 on the merged tree; write-back by the P-2026-11-02-1838 probe on 88dd98234, the second parent; app not driven by hand)
**Notes**: Tip moved after the merge (a296fefcb, docs only), accepted. Merge-tree: zero conflicts, tree 9bbb91623 = merge commit's; 14 files branch side, none on both, no governance file; 7 probes once each; no union. Gates on 8f14055bf: typecheck 0, typecheck:scripts 0; vitest 12913 passed, 490 files, 9 known red at import (12899 + 14, counted from the diff: branch tree has no node_modules); hooks 967; build 0; check:docs 5/5; check:agents, check:scripts, check:addonly PASS. Lane board untouched.
**Prompt document name**: 2026-11-02 19:05

## 2026-11-02 — ticket: JjTL nested creation drops name on a class without a declared name attribute
**Ticket**: In the probe of P-2026-11-02-1838 (`~/.jjodel-lanes/P-2026-11-02-1838/probe/`, scenario S3), the nested creation `-> toys { -> TToy { name := "toy" } }` produced objects named `TToy_0`. The probe declares no `name` attribute on TToy, and `nestedMaterialization.ts:112` copies only attributes the class declares, so the cause is probably that. Inferred, not confirmed. A0 did not touch that file. Confirm the cause and decide whether a binding to an undeclared feature must be reported instead of dropped. To clear before slice A, which places containments through this path.
**Priority**: medium
**Found in**: P-2026-11-02-1838

## 2026-11-02 — ticket: JjTL re-run in the same tab executes a stale AST
**Ticket**: In the probe of P-2026-11-02-1838, re-running a transformation in the same tab of `JjtlDevelopmentEnv` after changing its source executed the AST of the earlier run: the trace showed the old rules, and the run looked normal. A wrong result with no signal. Seen once and worked around with a fresh tab per scenario; not investigated. Reproduce, then fix. Probe: `~/.jjodel-lanes/P-2026-11-02-1838/probe/a0-writeback.ts`.
**Priority**: high
**Found in**: P-2026-11-02-1838

## 2026-11-02 — ticket: init_dash page error in the JjTL probe, untraced
**Ticket**: The probe of P-2026-11-02-1838 recorded one page error, `init_dash`, on port 3187. It was not traced and nothing visibly failed. Find its origin and whether it is new.
**Priority**: low
**Found in**: P-2026-11-02-1838

## 2026-11-02 — ticket: Model dependencies: silent loss on delete, cycles and self-dependency accepted
**Ticket**: Measured in P-2026-11-02-2021 (`docs/discovery/discovery_2026-11-02_m1_depends_on_m1.md`, branch `jjtl-notation-measure`): deleting a model that another model depends on removes the dependency and the pointers into it with no message; a dependency cycle between two models is accepted, and `crossObjects` then repeats objects; a model can depend on itself through the assignment. Decide what to report and what to refuse.
**Priority**: medium
**Found in**: P-2026-11-02-2021

## 2026-11-02 — ticket: Undo after a JjTL run does nothing
**Ticket**: Measured in P-2026-11-02-2024: after a JjTL run, the output model's Undo button is disabled and Cmd+Z on the canvas leaves all objects. Undo after a transformation does nothing. Not new with that lane. Decide whether a run should be one undo step.
**Priority**: low
**Found in**: P-2026-11-02-2024

## 2026-11-02 — merge: jjtl-containment into alfonso-frontend-jjtl (P-2026-11-02-2149)
**Prompt**: `claude_2026-11-02_2149_prompt_merge_jjtl-containment.md`, full lane: bring jjtl-containment at the explicit sha aa503e261 into the trunk with one --no-ff merge commit (RC-14); zero conflicts; stopped at step 7 for the chat's smoke, resumed on the GO.
**Files touched**: merge commit c58e00349 (the branch's 14 files, no union resolution: `docs/log-inbox/hw-notation.md` merged clean); closure commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (chat GO: 3001 HTTP 200 on the merged tree; behaviour measured by the P-2026-11-02-2108 probe on aa503e261; no hand run on the trunk, not a visual verification)
**Notes**: Merge-tree 230d1041f equal to the staged tree; 22 probes as declared. Gates on c58e00349: typecheck, typecheck:scripts exit 0; vitest 13028 = trunk 12988 + 40 (190 vs 150 in the four touched test files), the known 9 red at import; hooks 967 = trunk; build exit 0; check:docs 5/5; check:agents, check:scripts, check:addonly PASS. Trunk tip red once on one laneRun 15 s timeout under a concurrent run, green on rerun.
**Prompt document name**: 2026-11-02 21:49

## 2026-11-02 — feat(jjtl): B1 steps 2 and 3, called rules tested, the environment (P-2026-11-02-2247)
**Prompt**: P-2026-11-02-2247, continuation of P-2026-11-02-2224 after its context ceiling: test the wip step 2 (called rules, depth limit 256) and commit; implement step 3, the environment, with the acceptance case (2), capture, and implicit resolution inheriting the environment to the leaves.
**Files touched**: `frontend/src/jjtl/executor/executor.ts` (8ddcc744f), `executor/__tests__/called-lazy-rules.test.ts` (4e2891bc3, 8ddcc744f), `frontend/src/jjtl/SPEC.md` (0c2e9d071), this inbox, the `Status:` lines of P-2026-11-02-2224 and P-2026-11-02-2247.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Six files, all in DOVE. Step 2 green unchanged. Step 3: closures (value, binding-site env), structural env keys, lowering per (rule, source, env) under a non-empty env, delegating rules on first demand. Mutation (closures under use-site env) kills 8/14. Gates: jjtl 462 + 7 known; full 13048 passed, 9 known + 2 Chromium hook timeouts, 18/18 alone; tsc exit 0. Steps 4 (lazy) and 5 (fresh subtree under B) are the next lane.
**Prompt document name**: 2026-11-02 22:47

## 2026-11-02 — feat(jjtl): B1 steps 4 and 5, lazy rules and containment under B (P-2026-11-02-2321)
**Prompt**: P-2026-11-02-2321, closes B1: lazy rules (by class, guard selection, matched+lazy ambiguity, `unique` memo) and containment under B (fresh subtrees, double claim only implicit and `unique`); toy rules lazy; ruling R-JTG-6/7 on bound values; remaining acceptance tests; SPEC 5.3.3, 12, B2 list.
**Files touched**: `frontend/src/jjtl/executor/executor.ts` (105140d39, 6bf6e6578), `executor/__tests__/called-lazy-rules.test.ts` (105140d39, 6bf6e6578), `frontend/src/jjtl/SPEC.md` (b0ad73715), this inbox, the `Status:` line of P-2026-11-02-2321.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Five files, all in DOVE. Bound values lower afresh, a matched class untraced. Mutations: unique memo dropped 2/24; closures not fresh 2/34; lazy memoised 4/34. Gates: jjtl 482 + 7 known; full 13068 passed, 9 known import failures, 0 failed tests; tsc exit 0. B2 list in SPEC 5.3.3.
**Prompt document name**: 2026-11-02 23:21

## 2026-11-03 — ticket: JjTL source serializer unwraps a one-element many-valued reference
**Ticket**: A many-valued reference of the source model that holds one value reaches the JjTL rules as a single value, not as a one-element list: the source serializer of the Execute path (`components/project/ProjectEditor.tsx:1556-1574`) unwraps it. Measured in the app, probe `b2-writeback.ts` of P-2026-11-02-2338 (port 3197): `Bind.bindings` holding one `Binding`, the rule `b.bindings.map(x => x.bvar)` warns `Expression evaluation failed (JjelExpression): Unknown method 'map' for type Binding`; S1 wrote 0 objects instead of 3, S3 wrote 1 (`Add(null, null)`) instead of 7. The same sources with two bindings each pass (S1 3 objects, S3 7, two separate subtrees). A transformation that works on two values breaks on one.
**Priority**: high
**Found in**: P-2026-11-02-2338

## 2026-11-03 — ticket: JjTL source serializer drops a repeated pointer of a many-valued reference
**Ticket**: The same pointer listed twice in a many-valued source reference reaches the JjTL rules once: the source serializer of the Execute path (`components/project/ProjectEditor.tsx:1556-1574`) collapses the repeat. Measured in the app, probe `b2-writeback.ts` of P-2026-11-02-2338 (port 3197): `Main.exprs = [c1, c1]` under `items := exprs` with a non-unique lazy rule wrote 1 `Const` and `Holder.items` of 1, against 2 and 2 expected; the executor saw `inst {Holder: 1, Const: 1}`. Reaching the one source twice through two distinct elements (`m.exprs.map(e => m.expr)`) gives 2 Const and 2 distinct pointers, so the loss is on the source side, not in the write-back.
**Priority**: medium
**Found in**: P-2026-11-02-2338

## 2026-11-03 — ticket: JjTL write-back of a 2,559-object tree takes 17 s against 603 ms in the executor
**Ticket**: Writing a tree of 2,559 lowered objects to the store is slow in the app. Measured with probe `b2-writeback.ts` of P-2026-11-02-2338 (port 3197), scenario T: the executor ran in 603 ms and all 2,559 objects were in the store 17,061 ms after Execute (first run, 2026-11-02); reruns gave 955 ms / 22,203 ms and 878 ms / 24,413 ms. The time is the write-back, not the transformation. To find where it goes for trees of this size (actions per object, renders, sync); no fix asked.
**Priority**: medium
**Found in**: P-2026-11-02-2338

## 2026-11-03 — feat(jjtl): B2 closed, probes rerun, SPEC 5.3.3 (P-2026-11-03-0009)
**Prompt**: Continue P-2026-11-02-2338 after its context ceiling: rerun the B2 probe and the probes of P-2026-11-02-2108 and P-2026-11-02-1838, update the B2 list of SPEC 5.3.3, file three tickets, log entry, `Status:` lines. B2 code is 7e96a4e1c (P-2026-11-02-2338).
**Files touched**: `frontend/src/jjtl/SPEC.md` (b1d1c45fd); `docs/log-inbox/hw-notation.md` (three tickets, this entry); `docs/prompts/` `Status:` lines of P-2026-11-03-0009 and P-2026-11-02-2338
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Port 3197. B2 probe 10/10 (S1 3 obj, S3 7, S4 2 Const + 2 pointers, S5 1 + 1, S5b 2 + 2, S6/S7 fail visibly, T 2559 in 878 ms exec / 24.4 s written, reopen equal). S1/S3/S4/S5 rewritten to avoid the two serializer defects (tickets). 2108 a2: A1-A5 all checks true, reopen 8/8/9; a0-rerun and 1838 a0-writeback S1-S5 identical (4/4/6/4/2). Only page error `init_dash`. SPEC item 4 open, awaiting Alfonso.
**Prompt document name**: 2026-11-03 00:09

## 2026-11-03 — merge: jjtl-called-rules takes alfonso-frontend-jjtl (P-2026-11-03-0045)
**Prompt**: `claude_2026-11-03_0045_prompt_jjtl-called-rules_take_trunk.md`, full lane: bring the trunk at the explicit sha b200ccbc8 into jjtl-called-rules with one --no-ff merge commit (RC-14); zero conflicts; stopped at step 8 for the chat's GO, resumed on it.
**Files touched**: merge commit a4aa879ec (the trunk's 56 files, no union resolution: the three files changed on both sides merged clean); closure commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (chat GO on the gates of a4aa879ec; no app run on the merged branch; the app probes of P-2026-11-03-0009 predate this trunk-into)
**Notes**: Merge-tree 7e0dff533 equal to the staged tree; 25 probes once each, control 0, no union. Gates on a4aa879ec: typecheck, typecheck:scripts exit 0; vitest 13193 = trunk 13145 + 48 (59 vs 11 in the three branch test files), the known 9 red at import; hooks 967 = trunk; build exit 0; check:docs 5/5 (the prompt said 4/4); check:scripts, check:addonly PASS. Regressions unknown: gates only, no app run on the merged tree.
**Prompt document name**: 2026-11-03 00:45

## 2026-11-03 — merge: jjtl-called-rules into alfonso-frontend-jjtl (P-2026-11-03-0121)
**Prompt**: `claude_2026-11-03_0121_prompt_merge_jjtl-called-rules.md`, full lane: bring jjtl-called-rules at the explicit sha 4acda9332 into the trunk with one --no-ff merge commit (RC-14); zero conflicts; stopped at step 7 for the chat's GO, resumed on it.
**Files touched**: merge commit f716c5f31 (the branch's 20 files, no union resolution, no file changed on both sides); closure commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (chat GO on HTTP 200 on 3001 and the B2 probe rerun on the branch at 4acda9332; no hand run on the trunk)
**Notes**: Merge-tree dc7859d21 equal to the staged tree; 7 probes once each, no union. Gates on f716c5f31: typecheck, typecheck:scripts exit 0; vitest 500 files, 13193 = trunk 13145 + 48, the known 9 red at import; hooks 967 = trunk; build exit 0; check:docs 5/5 (the prompt said 4/4); check:agents, check:scripts, check:addonly PASS. Lane board untouched. vitest ran twice on the merge by mistake. Regressions unknown: no app run on the trunk.
**Prompt document name**: 2026-11-03 01:21

## 2026-11-03 — fix(jjtl): a many-valued source feature is a collection (P-2026-11-03-0539)
**Prompt**: `claude_2026-11-03_0539_prompt_jjtl_many_valued_source.md`, full lane: ticket #473, source shape by the declared upper bound; inventory; #474 read; B2 probes rerun; R-JTG-12 test; R-JTG-10..13 rows.
**Files touched**: `components/project/ProjectEditor.tsx`, `components/project/jjtlSourceValues.ts` (new), `components/project/__tests__/jjtlSourceValues.test.ts` (new), `jjtl/executor/__tests__/called-lazy-rules.test.ts`, `jjtl/SPEC.md` (code commit 4291b39c9); `docs/decisions.md`, this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (probes in the app: b2-writeback.v1 S1 3 objects, S3 7, S4 fails on #474; current b2-writeback all checks true)
**Notes**: Shape was by count. #474 left: a deliberate dedup against doubled pointers, its fix is a decision. Inventory: no reliance beyond fixtures; micron Arbiter one-requester forall gained. Bench: bound check dropped kills 6/12. Gates: tsc 0; vitest 501 files, 13209 = 13193 + 16, the known 9 at import; build 0; check:docs 5/5. T write-back 16-17.5 s, unchanged.
**Prompt document name**: 2026-11-03 05:39

## 2026-11-03 — merge: jjtl-many-valued into alfonso-frontend-jjtl (P-2026-11-03-0642)
**Prompt**: `claude_2026-11-03_0642_prompt_merge_jjtl-many-valued.md`, full lane: bring jjtl-many-valued at the explicit sha 534b79313 into the trunk with one --no-ff merge commit (RC-14); zero conflicts; stopped at step 7 for the chat's GO, resumed on it.
**Files touched**: merge commit b7dfcc51e (the branch's 8 files, no union resolution, no file changed on both sides); closure commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (chat GO on HTTP 200 on 3001 and the probes of P-2026-11-03-0539 on the branch tip; no hand run on the trunk)
**Notes**: Merge-tree 9a472978d equal to the merge commit's tree; 3 probes once each, no union. Gates on b7dfcc51e: typecheck, typecheck:scripts exit 0; vitest 502 files, 13231 = trunk 13215 + 16 (56 vs 40 in the two branch test files), the known 9 red at import; hooks 967 = trunk; build exit 0; check:docs 5/5 (the prompt said 4/4); check:agents, check:scripts, check:addonly PASS. Lane board untouched. Regressions unknown: no app run on the trunk.
**Prompt document name**: 2026-11-03 06:42

## 2026-11-03 — ticket: JjTL nested-attribute write can run before the last commit and silently drop num at 5,119 objects
**Ticket**: At 5,119 lowered objects the nested-attribute writer (STEP 8, `components/project/ProjectEditor.tsx:2165-2189`, a fixed 1,000 ms after the walk end) can run before the commit that creates the last level's slots, and nothing reports the loss. Measured in the app, probe `wbtime.ts` of P-2026-11-03-0703 (dev server, port 3211), shape `b11_9` (5,119 objects, 12 levels, output tab open): in two of three runs (`grow`, `grow3`) 2,048 of 2,560 `Const` objects lost `num`; the console printed 2,048 times `[ProjectEditor] Feature "$num" not found` and 512 `Const` kept `num`, still 512 after 10 s. The third run (`grow2`) wrote all 2,560. In `grow3` the writer ran at 23,285 ms and the 26,624-action dispatch at 23,296 ms, an 11 ms margin. A silent loss of model data: the toast and the status bar say the transformation completed.

Reproduction: `WB_SIZES=b11_9 node frontend/scripts/lane-run.mjs probe ~/jjodel-w-jjtlwbtime ~/.jjodel-lanes/P-2026-11-03-0703/probe/wbtime.ts --port 3211 --id P-2026-11-03-0703`, three runs; fixture `fixture-b11_9.json` in the same directory. Not seen at 2,559 objects (5 of 5 runs complete) and not seen at 5,119 with the output tab not opened (`WB_ABLATE=open2`: 2,560 of 2,560, attributes at 11.6 s).

Whether a smaller tree can hit it under load: the existing runs do not say. They were all made at machine load 1.4-3.0, and the margin at smaller sizes was not recorded. The window is a fixed timer against a commit stretched by long tasks, so a loaded machine is a plausible way to reach it with fewer objects; this is a hypothesis, not measured. Related: candidate B of `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md` (flush before writing the attributes) closes it by construction.
**Priority**: high
**Found in**: P-2026-11-03-0703
**Detail**: docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md

## 2026-11-03 — discovery: where the JjTL write-back time goes (P-2026-11-03-1014)
**Prompt**: P-2026-11-03-1014, continuation of P-2026-11-03-0703 after its context ceiling: write the report from the handoff, file the ticket for the 5,119-object attribute race, run production only if load allowed.
**Files touched**: `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_0703_prompt_jjtl_writeback_time.md` and `docs/prompts/claude_2026-11-03_1014_prompt_jjtl_writeback_time_report.md` (Status lines)
**Outcome**: ⚠️ partial
**Corregge**: 2026-11-03 07:03 (`claude_2026-11-03_0703_prompt_jjtl_writeback_time.md`: continued after its context ceiling)
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Report written from the handoff, figures from the 0703 probe on the dev server. Production NOT measured: load 15.7 at the check (limit 8). The opening-after canvas cost (WB_OPENAFTER) is also unmeasured. Ticket for the 5,119 attribute race filed (#482, high).
**Prompt document name**: 2026-11-03 10:14

## 2026-11-03 — merge: jjtl-writeback-time into alfonso-frontend-jjtl (P-2026-11-03-1021)
**Prompt**: `claude_2026-11-03_1021_prompt_merge_jjtl-writeback-time.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-writeback-time` at `53d543df6` into `alfonso-frontend-jjtl`, merge base `b7dfcc51e`, 4 commits on the branch side.
**Files touched**: merge `d04a598b6`: 4 files from the branch side (`docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_0703_prompt_jjtl_writeback_time.md`, `docs/prompts/claude_2026-11-03_1014_prompt_jjtl_writeback_time_report.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d04a598b6` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13231 tests in 502 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only (report and log inbox), all gates green on d04a598b6, no visual check made because nothing visible changes
**Notes**: Rollback tag `pre-jjtl-writeback-time` on `6b4f96183` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1021/result.json`.
**Prompt document name**: 2026-11-03 10:21

## 2026-11-03 — ticket: JjTL nested walk drops subtrees when a long task outlasts its 3 s per-level cap
**Ticket**: The JjTL nested walk drops whole subtrees of a 5,119-object tree when a long task outlasts its 3,000 ms per-level wait (`SLOT_WAIT_CAP_MS`): the cap is wall-clock, so one task of 3 s or more exhausts it without a second poll. The loss is reported in the output panel as "not placed", not silent. Measured with the tab open, `b11_9` (2,560 `Const`): at load 102.6 (P-2026-11-03-1033 before run) 2,047 of 5,119 objects created, 1,024 subtrees not placed, longest task 7,021 ms; at load 13.4 falling from a 5-minute average of 52.8 (P-2026-11-03-1057 after run 1) 3,071 of 5,119, the last level's 2,048 `Const` not placed, longest task 3,004 ms. Runs 2 and 3 at load 5.2 and 2.3: 5,119 of 5,119. `b10_8` (2,559 objects) at load 72.7 rising to 255: 2,559 of 2,559, nothing lost. The attribute writer of #482 is not involved: every value it queued was written. Fix candidates, not measured: count polls instead of wall-clock, or flush the open transaction block once per level before polling.
**Priority**: medium
**Found in**: P-2026-11-03-1033

## 2026-11-03 — fix(jjtl): nested attributes wait for their slots, loss in the panel (P-2026-11-03-1057)
**Prompt**: Close #482 after P-2026-11-03-1033's context ceiling: the panel line for unwritten attribute values, the gates, the after-probes with load recorded, a ticket for the walk's per-level cap, the before/after table.
**Files touched**: `frontend/src/components/project/ProjectEditor.tsx`, `nestedMaterialization.ts`, `__tests__/nestedMaterialization.test.ts` (347f3996d, from P-2026-11-03-1033); `nestedMaterialization.ts`, its test, `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (7146fda53); `docs/log-inbox/hw-notation.md`, `Status:` of `docs/prompts/claude_2026-11-03_1033_prompt_jjtl_writeback_flush.md` and `docs/prompts/claude_2026-11-03_1057_prompt_jjtl_writeback_flush_close.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato
**Notes**: Smoke: panel lines read from the DOM by the probe, forced failure included; no manual look. Gates: typecheck 0, vitest 13,238 of 13,238 with the 9 import-red files, build 0, check:docs 0. Panel line adopted as recommended (RC-21). LIR is d8a736474. The 300 ms per-level floor did NOT go (c60 gap median 302 ms): the per-level flush needs a `flush` in `NestedDeps`, its tests and the wiring, over ten lines, so not here. Walk cap: ticket #486.
**Prompt document name**: 2026-11-03 10:57

**Before and after** (dev server, tab open; probe `~/.jjodel-lanes/P-2026-11-03-1033/probe/`; times in ms from the click; load is the 1-minute average at the start):

| run | load | attributes written | longest task | page quiet | `num` kept |
|---|---|---|---|---|---|
| b7_7 before | 5.7 | 4,878 | 359 | 8,852 | 256 of 256 |
| b7_7 after | 2.8 | 4,487 | 341 | 8,899 (worse by 47) | 256 of 256 |
| b10_8 before | 8.4 | 15,312 | 2,410 | 22,610 | 1,280 of 1,280 |
| b10_8 after | 2.2 | 14,640 | 2,362 | 21,840 | 1,280 of 1,280 |
| b10_8 after, loaded | 72.7, 255 at the end | 17,746 | 2,892 | 22,822 | 1,280 of 1,280 |
| b10_8 after, forced failure | 214 | 22,673 | 3,410 | 25,723 | 0 of 1,280, panel line shown |
| b11_9 before | 102.6, not comparable | 30,407 | 7,021 | 44,666 | 512 of 2,560 (walk: 2,047 objects) |
| b11_9 after, run 1 | 13.4 (5-min 52.8) | 19,434 | 3,004 | 26,022 | 512 of 512 created (walk: 3,071 objects, 2,048 `Const` not placed) |
| b11_9 after, run 2 | 5.2 | 30,731 | 7,206 | 42,298 | 2,560 of 2,560 |
| b11_9 after, run 3 | 2.3 | 28,675 | 7,885 | 32,007 | 2,560 of 2,560 |
| c60 before | report §4 | 20,000 | not given | not given | not given |
| c60 after | 5.1 | 19,098 | 101 | 22,325 | 62 of 62 |

b11_9 has no low-load before figure; its longest task after (7,206 and 7,885) is above the loaded before (7,021). The writer does not depend on `addObject`'s 600 ms seeding: in c60 it finished 71 ms after the walk, before the 122 seeding timers fired, and `num` stayed 62 of 62 ten seconds later. Run 1's loss is the walk's, not the writer's: every queued value was written (#486).

## 2026-11-03 — ticket: JjTL nested walk cap raised to high, it breaks #482's acceptance at ordinary load (#486)
**Ticket**: #486 goes from medium to high. The acceptance of #482 is not met: `b11_9` run 1 at load 13.4 never created 2,048 `Const` because `SLOT_WAIT_CAP_MS` (3 s of wall-clock per level, `nestedMaterialization.ts:111`) ran out on one 3,004 ms task, and a load of 13 is ordinary on this machine. No row of `docs/decisions.md` fixes the cap.
**Priority**: high
**Found in**: P-2026-11-03-1137

## 2026-11-03 — fix(jjtl): the nested walk gives up on no progress, not on time (P-2026-11-03-1137)
**Prompt**: #486: the walk's per-level cap counts time without progress, still bounded in total and reported in the panel; one flush per level if it fits in the two files.
**Files touched**: `frontend/src/components/project/nestedMaterialization.ts`, `__tests__/nestedMaterialization.test.ts`, `ProjectEditor.tsx` (8ef8b27ae); `docs/log-inbox/hw-notation.md`, `Status:` of `docs/prompts/claude_2026-11-03_1137_prompt_jjtl_walk_cap.md`
**Outcome**: ✅ completed
**Corregge**: 2026-11-03 10:57
**Causa**: (c)
**Regressions**: yes
**Out-of-scope changes**: no
**Layer Impact Report**: skipped
**Smoke visivo**: passato
**Notes**: Regression: the longest task is worse in every shape (b7_7 341 to 1,829 and 2,238), the walk ends sooner and the tab's render lumps; quiet worse in b7_7 and b11_9. Stall: 60 polls without an answer; total bound 60 s. Smoke: panel read by the probe. LIR skipped: d8a736474 covers this flush. #482 and #486 met here, open until merge. Gates: typecheck 0, vitest 13,244 (9 import-red), build 0, check:docs.
**Prompt document name**: 2026-11-03 11:37

**Before and after** (dev server, tab open; probe `~/.jjodel-lanes/P-2026-11-03-1033/probe/`; before is `208731e0e` from the P-2026-11-03-1057 table; times in ms from the click; load is the 1-minute average at the start, from `uptime`; `Const` created is objects plus one, halved):

| run | load | attributes written | longest task | page quiet | `Const` created | `num` kept |
|---|---|---|---|---|---|---|
| b7_7 before | 2.8 | 4,487 | 341 | 8,899 | 256 | 256 of 256 |
| b7_7 after | 2.6 | 1,704 | 1,829 (worse) | 10,307 (worse) | 256 | 256 of 256 |
| b7_7 after, again | 8.4, 24.5 at the end | 4,820 | 2,238 (worse) | 10,929 (worse) | 256 | 256 of 256 |
| b10_8 before | 2.2 | 14,640 | 2,362 | 21,840 | 1,280 | 1,280 of 1,280 |
| b10_8 after | 4.6 | 13,218 | 3,044 (worse) | 17,518 | 1,280 | 1,280 of 1,280 |
| b10_8 after, forced slot stop | 5.9 | 10,244 | 519 | 14,251 | 1,023 objects of 2,559 | 256, panel line shown |
| b11_9 before, run 1 | 13.4 | 19,434 | 3,004 | 26,022 | 512 of 2,560 | 512 of 512 |
| b11_9 before, run 2 | 5.2 | 30,731 | 7,206 | 42,298 | 2,560 | 2,560 of 2,560 |
| b11_9 before, run 3 | 2.3 | 28,675 | 7,885 | 32,007 | 2,560 | 2,560 of 2,560 |
| b11_9 after, run 1 | 7.9 | 32,997 | 9,823 (worse) | 44,038 (worse) | 2,560 | 2,560 of 2,560 |
| b11_9 after, run 2 | 13.6 | 27,481 | 7,800 | 39,060 | 2,560 | 2,560 of 2,560 |
| b11_9 after, run 3 | 4.1 | 29,391 | 7,958 | 38,863 (worse) | 2,560 | 2,560 of 2,560 |
| b11_9 after, loaded | 17.5 | 30,461 | 7,637 | 38,892 | 2,560 | 2,560 of 2,560 |
| b11_9 after, heavy load | 25.8, 50.5 at the end | 74,403 | 22,405 | 92,904 | 2,560 | 2,560 of 2,560 |
| c60 before | 5.1 | 19,098 | 101 | 22,325 | 62 | 62 of 62 |
| c60 after, loaded | 40.2, 16.0 at the end | 6,607 | 191 (worse) | 9,867 | 62 | 62 of 62 |

c60 gap between levels: mean over the 60 levels 299 ms before, 90 after; the probe's median, over bursts of `addObject` closer than 30 ms, 302 over 61 bursts before and 143 over 23 after, because flushed levels now fall into one burst. The walk ends sooner in every shape (b7_7 3,876 to 1,592; b10_8 10,440 to 4,921; c60 19,027 to 6,479); the longest task now sits just after the walk's end (b7_7 at 3,972, b10_8 at 5,095), where the open tab renders what earlier arrived level by level. The slow levels the old cap would have dropped are in the after runs: a level gap of 10,739 ms in the loaded run and 18,656 ms in the heavy one, with every `Const` created. The forced stop is a scratch probe mode, `WB_FORCESTALL=300`: after 300 `addObject` calls `Tgt.Add.left` is renamed, and the panel reads "feature "left" not available after 3000 ms without a slot answering": 2 lines shown, "... and 492 more" in the console. The 60 s total bound is covered by its unit test only.

## 2026-11-03 — merge: jjtl-writeback-flush into alfonso-frontend-jjtl (P-2026-11-03-1219)
**Prompt**: `claude_2026-11-03_1219_prompt_merge_jjtl-writeback-flush.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-writeback-flush` at `a3317694b` into `alfonso-frontend-jjtl`, merge base `c5b3e30ff`, 9 commits on the branch side.
**Files touched**: merge `f4232f784`: 9 files from the branch side (`docs/discovery/lir_2026-11-03_jjtl_writeback_flush.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1033_prompt_jjtl_writeback_flush.md`, `docs/prompts/claude_2026-11-03_1057_prompt_jjtl_writeback_flush_close.md`, `docs/prompts/claude_2026-11-03_1137_prompt_jjtl_walk_cap.md`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/__tests__/nestedMaterialization.test.ts`, `frontend/src/components/project/nestedMaterialization.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f4232f784` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13262 tests in 503 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on f4232f784; acceptance by app probes on the branch at a3317694b, no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-writeback-flush` on `336f39188` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1219/result.json`.
**Prompt document name**: 2026-11-03 12:19

## 2026-11-03 — fix(jjtl): open the output tab after the write-back (P-2026-11-03-1232)
**Prompt**: #475, candidate A: STEP 7 opens the output tab after the write-back, also on failure; measure what moves; say whether the flush-per-level regression goes; honest toast and status bar; what the user sees between click and tab.
**Files touched**: `docs/discovery/lir_2026-11-03_jjtl_output_tab_late.md` (ce6c7334a); `frontend/src/components/project/ProjectEditor.tsx` (3b8c3b51b); `docs/log-inbox/hw-notation.md`, `Status:` of `docs/prompts/claude_2026-11-03_1232_prompt_jjtl_output_tab_late.md`
**Outcome**: ⚠️ partial
**Corregge**: 2026-11-03 11:37
**Causa**: (c)
**Regressions**: yes
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Attributes written 2.7-2.8x sooner, no loss, save/reopen same tree, toast counts all objects, status bar silent until the tab. Regression kept: the canvas freeze moved after the tab and is not smaller (b10_8 longest task 2,554 to 3,046-3,097). Item 3 open: spreading it needs useJjomSync.ts (critical zone), question to the chat. No unit seam: STEP 7 is inline. Gates: typecheck 0, vitest 13,262 (9 import-red), build 0, check:docs.
**Prompt document name**: 2026-11-03 12:32

**Before and after** (dev server, output tab open; probe `~/.jjodel-lanes/P-2026-11-03-1033/probe/`, labels `pre`/`post*`; before is `6571f548a`, the trunk commit of this branch; times in ms from the click; load is the 1-minute average from `uptime` before the run, and at the end in brackets):

| run | load | attributes written | tab | longest task | lag max | page quiet | `Const` | `num` kept |
|---|---|---|---|---|---|---|---|---|
| b7_7 before | 3.8 (3.5) | 1,672 | 2,086 | 497 | 955 | 7,142 | 256 | 256 of 256 |
| b7_7 after | 4.1 (2.6) | 1,717 | 2,113 | 506 (worse) | 1,164 (worse) | 7,270 (worse) | 256 | 256 of 256 |
| b10_8 before | 3.3 (2.8) | 11,549 | 2,624 | 2,554 | 6,628 | 18,113 | 1,280 | 1,280 of 1,280 |
| b10_8 after | 2.3 (4.5) | 4,392 | 4,416 (later) | 3,097 (worse) | 5,627 | 17,554 | 1,280 | 1,280 of 1,280, reopen same tree |
| b10_8 after, again | 11.7 (5.8) | 4,341 | 4,361 (later) | 3,046 (worse) | 5,374 | 17,128 | 1,280 | 1,280 of 1,280 |
| b11_9 before | 3.0 (9.5) | 30,182 | 3,082 | 8,471 | 12,297 | 42,368 | 2,560 | 2,560 of 2,560 |
| b11_9 after, run 1, loaded | 4.2 (21.0) | 44,079 (worse) | 44,117 | 7,815 | 11,342 | 50,400 (worse) | 2,560 | 2,560 of 2,560 |
| b11_9 after, run 2 | 9.4 (6.8) | 10,854 | 10,878 (later) | 10,150 (worse) | 18,933 (worse) | 35,274 | 2,560 | 2,560 of 2,560 |
| b11_9 after, run 3 | 6.1 (8.2) | 10,642 | 10,667 (later) | 3,664 | 3,792 | 15,234 | 2,560 | 2,560 of 2,560 |
| c60 before | 3.0 (6.1) | 3,653 | 2,090 | 100 | 143 | 6,732 | 62 | 62 of 62 |
| c60 after | 4.2 (9.7) | 2,378 | 2,394 (later) | 111 (worse) | 144 (worse) | 6,501 | 62 | 62 of 62 |

Run 1 of b11_9 went from load 4 to 21 during the run, so it is marked loaded. The flush-per-level figures of P-2026-11-03-1137 (b7_7 longest 1,829) did not come back on the trunk today: 497 before, 506 after. A profiled b10_8 after run (`postprof`, slower by the profiler) puts the window after the tab at 22.8 s busy of 23.7: react-dom 13.6 s inclusive, `action.ts` 4.6 s, `useJjomSync.ts` 2.6 s, `GraphDataElements` 2.1 s, `DynamicHandles.tsx` 0.8 s self. The tab mounts on 2,559 objects and Step 2bis of `useJjomSync` makes 2,558 vertices in one loop, then React renders them: yielding before `open2` cannot split that. Frames for b10_8 in `~/.jjodel-lanes/P-2026-11-03-1232/post2-b10_8-{1-click,2-writing,3-tab,4-tab+2s}.png` (full viewport, not cropped); the `4-tab+2s` frame was meant for 6.4 s and was taken at 13.9 s because the page was frozen.

## 2026-11-03 — ticket: JjTL output canvas freezes the page once the tab opens on a large tree
**Ticket**: With the output tab opened after the write-back (P-2026-11-03-1232), the canvas mounts on the whole tree: `useJjomSync` Step 2bis (`useJjomSync.ts:741-772`) makes one `DVertex.new` per object in one synchronous loop and React renders them all. Measured in the app, dev server: longest task after the tab b10_8 3,046-3,097 ms (2,554 before), b11_9 3,664-10,150 ms (8,471 before), lag max up to 18,933 ms. Spreading it needs a critical-zone file (chunking Step 2bis over frames, or rendering only visible nodes); `ProjectEditor.tsx` cannot split it.
**Priority**: high
**Found in**: P-2026-11-03-1232
**Detail**: docs/discovery/lir_2026-11-03_jjtl_output_tab_late.md

## 2026-11-03 — ticket: nothing tells the user a JjTL run is still writing its output
**Ticket**: Between the click and the output tab the JjTL panel already says "Transformation completed successfully", the status bar says "Success · 122ms · 2559 mapped", and nothing says the write-back is running. Measured with the tab opened after the write-back (P-2026-11-03-1232, dev server): click to tab 4,361-4,416 ms for b10_8 (2,559 objects), 10,667-10,878 ms for b11_9 (5,119 objects), 44,117 ms for b11_9 under load. Above 2 s from about 2,500 objects. No progress UI added: it needs its own lane.
**Priority**: medium
**Found in**: P-2026-11-03-1232

## 2026-11-03 — fix(jjtl): a re-run in the same tab no longer executes a stale AST (P-2026-11-03-1315)
**Prompt**: P-2026-11-03-1315, #446: reproduce the stale AST on a same-tab re-run without the fresh-tab workaround, test first, root cause, fix where the cause is.
**Files touched**: `frontend/src/jjtl/hooks/useJjtlParser.ts`, `frontend/src/jjtl/hooks/__tests__/useJjtlParser.debounce.test.ts` (new) at 0d0b00228; `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1315_prompt_jjtl_rerun_stale_ast.md` (Status line)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Cause: Monaco delivers one edit as several change events reading the final value; each repeat cleared the 300 ms timer, then hit the same-source return, so the parse never ran and Execute used the old AST. Probe (not a hand run), `~/.jjodel-lanes/P-2026-11-03-1315/stale-ast.ts`, port 3191, one tab, 7 runs: before, R2/R3 ran R1's 1 rule; after, all runs match the source. One app parse path: the legacy no-source parser has no app caller.
**Prompt document name**: 2026-11-03 13:15

**Ticket** (#446, update): fixed on `jjtl-rerun-stale-ast` at 0d0b00228; stays open until the merge. Unverified side observation: after `OPEN_TRANSFORMATION` on an already open transformation, no `.dock-tab-btn` id ends in `-tab-jjtl_<id>` and the JjTL pane is hidden after the run; the run itself was correct (2 mappings, model TOwner+TPet). Not diagnosed (`DockManager.updateTab`).

## 2026-11-03 — merge: jjtl-rerun-stale-ast into alfonso-frontend-jjtl (P-2026-11-03-1350)
**Prompt**: `claude_2026-11-03_1350_prompt_merge_jjtl-rerun-stale-ast.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-rerun-stale-ast` at `27a37b79d` into `alfonso-frontend-jjtl`, merge base `8469b98b2`, 3 commits on the branch side.
**Files touched**: merge `ba649974e`: 4 files from the branch side (`docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1315_prompt_jjtl_rerun_stale_ast.md`, `frontend/src/jjtl/hooks/__tests__/useJjtlParser.debounce.test.ts`, `frontend/src/jjtl/hooks/useJjtlParser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ba649974e` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13267 tests in 504 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on ba649974e; acceptance by an app probe on the branch, no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-rerun-stale-ast` on `8469b98b2` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1350/result.json`.
**Prompt document name**: 2026-11-03 13:50

## 2026-11-03 — ticket: JjTL multiplicity [*] creates one target per source, silently
**Ticket**: `A -> B[*]` creates exactly one target per source, silently: `createTargetInstances` (executor.ts) sets count 1 when the upper bound is -1, and no warning says the multiplicity was ignored. `[n]` creates n. Reproduced on both parser paths by `spec12-known-bugs.test.ts` ("row: multiplicity [*]"). The unbounded semantics are undefined (SPEC §12.3 gap 4), so this is a language decision before it is a fix: what drives the count (a collection expression, the source's own multiplicity), and whether `[*]` should warn until then.
**Priority**: medium
**Found in**: P-2026-11-03-1402

## 2026-11-03 — fix(jjtl): SPEC 12.2 rows reviewed, undeclared bindings warned (#445) (P-2026-11-03-1402)
**Prompt**: P-2026-11-03-1402, each SPEC 12.2 row reproduced and classified real or stale, local fixes here, a ticket for the rest; #445 cause confirmed and a binding to an undeclared feature warned with rule, line and column, never dropped silently.
**Files touched**: `e784e325d`: `frontend/src/jjtl/executor/executor.ts`, `executor/astBridge.ts`, `executor/__tests__/spec12-known-bugs.test.ts` (new), `executor/__tests__/nested-name-undeclared.test.ts`, `jjtl/__tests__/executor-bridge.test.ts`, `jjtl/__tests__/executor-llayer.test.ts`; `207cd0252`: `frontend/src/jjtl/SPEC.md`, the prompt's `Status:`; this inbox (ticket and entry).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Nine files, all inside the prompt's DOVE. Stale: forAll (3aa5993c8, d3d42310c), flat-array duplicates, double execution (read only, no app probe). Fixed: import-red 9 to 3 (six jjtl files load; two stale expectations updated), {classes,instances} twice, console.log, EDouble tag. Real: [*], ticketed medium (GitHub card skipped on a 504). Regressions unknown: the panel line was not seen in the app. Gates: tsc 0, vitest 13346 passed, build 0.
**Prompt document name**: 2026-11-03 14:02

## 2026-11-03 — merge: jjtl-spec-12-review into the trunk, closure by hand (P-2026-11-03-1420)
**Prompt**: P-2026-11-03-1420, direct merge of jjtl-spec-12-review.
**Files touched**: `docs/prompts/claude_2026-11-03_1420_prompt_merge_jjtl-spec-12-review.md`, `docs/log-inbox/hw-notation.md`
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Merge `89841fc92` stands. The worker reported `blocked` on vitest: 13346 tests, 0 failed, 3 red at import against a before of 13267, 0 failed, 9 red. Compared per file, every difference is a file going from red at import to passing, or the new test file. `lane-run go` refuses a blocked merge, so this closure is by hand; `result.json` was not edited. Unit tests only: the #445 warning has not been seen in the app, and #445 stays open.
**Prompt document name**: 2026-11-03 14:20

## 2026-11-03 — ticket: merge --direct reads a test file fixed from red at import as a red gate
**Ticket**: `merge --direct` computes the expected vitest counts from the receiving tip, overwriting only the test files the branch changes. A product change that makes an unchanged test file load (red at import before, passing after) therefore reads as a difference, and the worker ends `blocked` with the merge commit left in place, although nothing failed. Measured on P-2026-11-03-1420: 13346 tests, 0 failed, four files listed as not as expected. `go` then refuses the closure. Suggested: a file going from importRed to passing with 0 failed is not a red gate; report it apart.
**Priority**: medium
**Found in**: P-2026-11-03-1420

## 2026-11-03 — ticket: JjTL let bound to a called rule runs the rule at each use, silently
**Ticket**: A `let` bound to a called-rule call runs the called rule again at each use of the variable: `let $id = idColumn(c) in { columns := [$id] ... key := [$id] }` creates one Column per use (called rules are fresh per call, R-JTG-6), so on Class2Relational 8 extra Columns land at the model root and the table's key and the subclass foreign key point to Columns outside their table. No warning is emitted. Measured by `frontend/src/jjtl/executor/__tests__/class2relational.test.ts` (fixture `class2relational.ts`, workaround W5). Workaround: a second matched rule per role (`Class c -> Column`, `Attribute a -> Column where a.multiValued`) and `resolve(x, "T")` at each use. Either the `let` value is evaluated once (a closure value per R-JTG-5 is computed once per environment), or a second use of a fresh target warns.
**Priority**: high
**Found in**: P-2026-11-03-1434

## 2026-11-03 — ticket: JjTL x.parent is null for any element but the rule's own source
**Ticket**: `x.parent` is null for any element other than the rule's own source: only the bare `parent` keyword is bound to the container (executor.ts, read around 2827-2856). On Class2Relational `a.parent.name` inside a called rule gives `Cannot access property 'name' of null` warnings, and join tables lose their name, owner column name and Integer type. Measured by `class2relational.test.ts` (workaround W2: bare `parent`, owner passed as an argument). Navigating to the container of any element should read `_containerId` the same way the keyword does.
**Priority**: medium
**Found in**: P-2026-11-03-1434

## 2026-11-03 — ticket: JjTL resolve(x, T) with a bare type name works only as a whole right-hand side
**Ticket**: `resolve(x, T)` with a bare type name is intercepted only when the call is the whole right-hand side of a binding (executor.ts, read around 4004-4021). Inside `[...]`, a lambda or a `let`, `T` is evaluated as a variable (null) and the call throws the very ambiguity it was written to settle. Measured by `class2relational.test.ts` (workaround W6: quote the name, `resolve(x, "T")`). The bare-name form should be accepted wherever the call appears, or rejected with a message that says to quote it.
**Priority**: medium
**Found in**: P-2026-11-03-1434

## 2026-11-03 — ticket: JjTL binding cut at the newline, continuation gives a misleading parse error
**Ticket**: A binding ends at the end of its line: a continuation line starting with `+` (`columns := a.map(...)` then `+ b.map(...)` on the next line) is a parse error, `23:13 Expected source attribute name`, which does not say that the expression was cut at the newline. Measured by `class2relational.test.ts` (workaround W1: the whole expression on one line). Either accept a continuation that starts with a binary operator, or name the cause in the message.
**Priority**: low
**Found in**: P-2026-11-03-1434

## 2026-11-03 — ticket: JjTL has no allInstances, the idiom is a search of data
**Ticket**: JjTL has no `allInstances` (or `T.allInstances()`): a rule that needs a target-independent element of the source model, here the Integer DataType for key columns, has to search `data` (the whole source model, SPEC 7.3) in a no-arg helper, `data.filter(t => t.className == "DataType" and t.name == "Integer").first()`. It works, but a reader must know that `data` exists and what shape it has. Searched in `frontend/src/jjtl/` and `frontend/src/jjel/` with a positive control on `resolveAll`. Measured by `class2relational.test.ts` (workaround W3). Language decision: add `T.allInstances` or document `data` as the idiom.
**Priority**: low
**Found in**: P-2026-11-03-1434

## 2026-11-03 — ticket: JjTL warnings, #445 included, never reach the output panel
**Ticket**: The #445 warning never reaches the JjTL output panel. Measured by the Class2Relational app probe (`~/.jjodel-lanes/P-2026-11-03-1434/probe/c2r.ts`, real Execute dialog): with `nullable := false` added to the first `Attribute -> Column` rule, the execution result carries exactly `Rule 'Attribute -> Column', binding 'nullable' at line 27, column 5: 'nullable' is not a feature of target class 'Column'; the value is not written to the model.`, but the panel shows the same 7 lines as the run without it, and the toast says only `Created model "out2" with 1 instances.` Read: on success `JjtlDevelopmentEnv.tsx:358-360` writes two fixed lines and does not print `result.warnings`. So #445 is still invisible to a user; a one-line loop over `result.warnings` there would show it. Not fixed in P-2026-11-03-1505 (no product code in scope).
**Priority**: medium
**Found in**: P-2026-11-03-1434

## 2026-11-03 — ticket: JjTL floating Execute button partly under the editor scrollbar
**Ticket**: The floating Execute button of the JjTL editor (`.jjtl-editor-action-btn--primary`, the play icon at the editor's top right) sits partly under Monaco's vertical scrollbar: a pointer click at its centre lands on the scrollbar (`div.visible.scrollbar.vertical` intercepts pointer events), so Playwright cannot click it, with a 72-line text that scrolls. Measured twice by the Class2Relational app probe (`executePointerClickable: false` on both runs; screenshot `~/.jjodel-lanes/P-2026-11-03-1434/probe/c2r-run1-exec-covered.png`). A user can still use the toolbar's Execute or Ctrl+Enter, or the left half of the icon. Suggested: inset the floating toolbar by the scrollbar width.
**Priority**: low
**Found in**: P-2026-11-03-1434

## 2026-11-03 — test(jjtl): Class2Relational acceptance, app probe and report (P-2026-11-03-1505)
**Prompt**: P-2026-11-03-1434 continued by P-2026-11-03-1505: a non-hardware acceptance case, Class2Relational, as executor fixture, app probe through the Execute dialog with save and reopen, the #445 line in the panel, tickets per failure and a report with a verdict on R-JTG-5, 6, 7.
**Files touched**: `8a064bbbd`: `frontend/src/jjtl/__tests__/fixtures/class2relational.ts` (new), `frontend/src/jjtl/executor/__tests__/class2relational.test.ts` (new), `frontend/src/jjtl/executor/executor.ts` (one line); `e2332b61c`, `7ec6305ae`: this inbox (seven tickets); `6226edf31`: `docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`; this entry and the `Status:` lines of both prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe, no hand run: output equals EXPECTED_SCHEMA (6 tables, 14 columns, 3 FKs, 3 types), same tree after save and reopen; #445 warning in the result, not in the panel
**Notes**: R-JTG-5/6/7 fit beyond hardware; one design gap, a called rule cannot create once and be referenced twice (`unique` on called rules recommended). Tickets #515-#521. Gates: tsc 0, vitest 13358 passed, 3 red at import plus irSelectionRing afterAll timeout under load (alone 5/5 green), build 0. Details in the report.
**Prompt document name**: 2026-11-03 15:05

## 2026-11-03 — merge: jjtl-class2relational into alfonso-frontend-jjtl (P-2026-11-03-1532)
**Prompt**: `claude_2026-11-03_1532_prompt_merge_jjtl-class2relational.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-class2relational` at `7f5d686d6` into `alfonso-frontend-jjtl`, merge base `ed6367578`, 7 commits on the branch side.
**Files touched**: merge `1cbb75d13`: 7 files from the branch side (`docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1434_prompt_jjtl_class2relational.md`, `docs/prompts/claude_2026-11-03_1505_prompt_jjtl_class2relational_close.md`, `frontend/src/jjtl/__tests__/fixtures/class2relational.ts`, `frontend/src/jjtl/executor/__tests__/class2relational.test.ts`, `frontend/src/jjtl/executor/executor.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `1cbb75d13` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13401 tests in 506 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 1cbb75d13; acceptance by an app probe on the branch, no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-class2relational` on `968e7a44e` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1532/result.json`.
**Prompt document name**: 2026-11-03 15:32

## 2026-11-03 — ticket: a JjTL rule whose target class does not exist runs without error and writes a partial model
**Ticket**: a rule whose target class is not declared in the target metamodel (`-> Nope`) is not rejected: the run reports no error and writes a partial target model, 4 nested objects of the 10 the same transformation writes with the class declared. Measured in the app by the probe of P-2026-11-03-1435 (`fix-fail2`), not by hand. It is the case R-FA-11 names: a transformation that goes on writes a target model that is wrong and looks done. Expected: the run stops with an error naming the rule and the class, as an abstract target already does (`fix-fail4`), and writes nothing. Seen beside it, not separated: `envLookup("nope")` in a lazy Const did not fail either (`fix-fail`).
**Priority**: high
**Found in**: P-2026-11-03-1435

## 2026-11-03 — ticket: an edit made while a JjTL run is writing is undone with the run
**Ticket**: the undo step of a JjTL run (R-JTG-14) stays open until the store has been quiet 800 ms after the write-back, so a user edit made inside that window is folded into the run's step: Undo reverts the edit together with the run, Redo reapplies both. Measured by the probe of P-2026-11-03-1435 (`fix-edit2`): an edit at +1.35 s (`c0.num` 0 to 7) is reverted to 0 by Undo and back to 7 by Redo. Reported, not fixed; no fix was designed.
**Priority**: low
**Found in**: P-2026-11-03-1435

## 2026-11-03 — feat(jjtl): a JjTL run is one undo step (#458) (P-2026-11-03-1435, P-2026-11-03-1522)
**Prompt**: P-2026-11-03-1435, Undo after a JjTL run did nothing (#458): one run one undo step, Redo brings it back, no TRANSACTION around creators (NN-12); closed by P-2026-11-03-1522 after the context ceiling of the first session.
**Files touched**: `8348487c6`: the Layer Impact Report; `5300d78b6`: `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/nestedMaterialization.ts`, `frontend/src/components/project/__tests__/nestedMaterialization.test.ts`; `a2bfae74e`: `docs/decisions.md` (R-JTG-14); this inbox (two tickets and this entry); the `Status:` lines of both prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato — unattended: acceptance by an app probe on the branch (`~/.jjodel-lanes/P-2026-11-03-1435/probe/`), no hand run and no visual check
**Probe**: this is the app probe of P-2026-11-03-1435, driven by script, not a hand run.

| Case | Before / after | Result |
|------|----------------|--------|
| baseline-plain-b2_1 | before the fix | undo 0 after the run; Cmd+Z and Shift+Cmd+Z change nothing |
| fix-plain-b2_1 | fix | undo 1; Undo: idlookup keys identical to before (model, tab, 11 vertices gone); Redo: keys and tree identical to after the run; the tab is not reopened |
| fix-second-b2_1 | fix | Undo, second run, Undo: clean; a new run does not clear the redo stack (pre-existing) |
| fix-fail4-b2_1 | fix | abstract target rejected with the error in the panel, no writes, no undo entry |
| fix-fail2 | fix | `-> Nope` runs without error, partial model, 4 nested of 10 (ticket, high) |
| fix-edit2-b2_1 | fix | edit at +1.35 s (`c0.num` 0 to 7) folded into the run's step: Undo 0, Redo 7 (ticket, low) |
| fix-plain2-b10_8 | fix | group closed after 15339 ms, not capped; Undo blocks about 933 ms (longest task 875 ms), Redo about 309 ms; 11517 keys added, all removed by Undo, all back with an identical tree on Redo |

**Notes**: Root cause measured: after a programmatic run `U.userHasInteracted` stays false, so every delta was dropped. The run raises it (R-UNDO-2) and opens an undo group after the executor succeeds, closed by R-JTG-14 (provisional, unattended). STEP 7 untouched. Unit: 6 new tests, 32/32, mutation bench kills all 6. Gates at `eb432d962`: vitest 13352 passed, 3 red at import (`window is not defined`, the expected three); build 0; tsc 0. Not merged.
**Prompt document name**: 2026-11-03 14:35

## 2026-11-03 — merge: jjtl-run-undo into alfonso-frontend-jjtl (P-2026-11-03-1542)
**Prompt**: `claude_2026-11-03_1542_prompt_merge_jjtl-run-undo.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-run-undo` at `a6e9a4b24` into `alfonso-frontend-jjtl`, merge base `ed6367578`, 6 commits on the branch side.
**Files touched**: merge `a5e66854b`: 8 files from the branch side (`docs/decisions.md`, `docs/discovery/lir_2026-11-03_jjtl_run_undo.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1435_prompt_jjtl_run_undo.md`, `docs/prompts/claude_2026-11-03_1522_prompt_jjtl_run_undo_close.md`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/__tests__/nestedMaterialization.test.ts`, `frontend/src/components/project/nestedMaterialization.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a5e66854b` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13407 tests in 506 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on a5e66854b; acceptance by an app probe on the branch, no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-run-undo` on `a1d892c10` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1542/result.json`.
**Prompt document name**: 2026-11-03 15:42

## 2026-11-03 — feat(jjtl): run warnings in the Output panel (#520), unique-aware repeats (#474), #447 traced (P-2026-11-03-1553)
**Prompt**: P-2026-11-03-1553: print a run's warnings in the JjTL panel and see the #445 line in the app, check a flood; #474, dedup only features declared `unique` after checking the canvas double write; #447, trace `init_dash`.
**Files touched**: `c52fdaeb4`: `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`, `frontend/src/jjtl/components/runWarnings.ts` (new), `frontend/src/jjtl/components/__tests__/runWarnings.test.ts` (new); `219083ea6`: `frontend/src/components/project/ProjectEditor.tsx` (serializer lines only), `frontend/src/components/project/jjtlSourceValues.ts`, `frontend/src/components/project/__tests__/jjtlSourceValues.test.ts`; `b9b4e01e0`: `frontend/src/jjtl/SPEC.md`; this inbox; the `Status:` line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probes, no hand run: the #445 line in the Output panel on Class2Relational; 25 warnings print 20 lines and "... and 5 more"; #474 exprs [c1, c1] gives 1 then 2 after unique=false
**Notes**: Out of scope: runWarnings.ts (the component cannot load in the bench), jjtlSourceValues.ts (the serializer ProjectEditor calls), SPEC 9.1 besides 12.2; nine files in all. Gates on 219083ea6: tsc 0; vitest 13416 passed, 3 red at import, the baseline; build 0. Benches: #520 6/6 killed, #474 5/5. Probes: ~/.jjodel-lanes/P-2026-11-03-1553/probe/ (warn.ts, p474.ts). Not merged.
**Prompt document name**: 2026-11-03 15:53

**Ticket** (#520, #445, update, not closed before the merge): on success and on failure the panel prints `N warning(s):`, one `Warning: ...` line each up to 20, then `... and K more, listed in the Trace tab.` Seen in the app: `Warning: Rule 'Attribute -> Column', binding 'nullable' at line 27, column 5: 'nullable' is not a feature of target class 'Column'; ...` (`warn-run1-panel.png`). A flood of 25 gives 29 panel lines, not 34.

**Ticket** (#474, update, not closed before the merge): repeats are kept once on a feature declared `unique` (true or absent, the EMF default) and every time on `unique=false`. The double write the dedup guarded against has no source today: the sync hooks write edges, never `DValue.values`. A reference drawn twice on the canvas between the same pair still appends a repeat (`syncCreateReferenceLink` has no `includes` check) and shows one edge; collapsed on a unique feature, a legitimate repeat on a `unique=false` one. The B2 case of the ticket (`exprs` left at the default) still gives 1: it needs `unique=false` to give 2.

**Ticket** (#447, update): `init_dash` is not new. It is `console.error('init_dash')` in `RuntimeStore.init_dashboard` (`frontend/src/redux/store.tsx:240`), called on every load whose hash is not `#/project`, there since `3446baf02` (2025-02-10) and listed in `frontend/scripts/smoke/console-baseline.json:36`. Nothing fails. The fix is trivial (drop the line, rebase the smoke baseline) but `store.tsx` is outside this lane's DOVE: not fixed.

## 2026-11-03 — ticket: JjTL Output panel does not follow its tail and clips long lines
**Ticket**: The JjTL Output panel does not scroll to its last line when a run appends to it: after a Class2Relational run with one warning, the panel shows lines 1-7 of 9 and the warning sits below the fold (`~/.jjodel-lanes/P-2026-11-03-1553/probe/warn-run1.png`). Long lines, a #445 warning among them, are cut at the panel's right edge, not wrapped (`warn-run2-panel.png`). Measured by the app probe of P-2026-11-03-1553, not by hand. Suggested: scroll to the end on append, and wrap.
**Priority**: low
**Found in**: P-2026-11-03-1553
**Detail**: `~/.jjodel-lanes/P-2026-11-03-1553/probe/warn.json`

## 2026-11-03 — merge: jjtl-panel-warnings-low into alfonso-frontend-jjtl (P-2026-11-03-1619)
**Prompt**: `claude_2026-11-03_1619_prompt_merge_jjtl-panel-warnings-low.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-panel-warnings-low` at `ef8f75764` into `alfonso-frontend-jjtl`, merge base `8f3482ab3`, 6 commits on the branch side.
**Files touched**: merge `6fb7d2841`: 9 files from the branch side (`docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1553_prompt_jjtl_panel_warnings_low.md`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/__tests__/jjtlSourceValues.test.ts`, `frontend/src/components/project/jjtlSourceValues.ts`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`, `frontend/src/jjtl/components/__tests__/runWarnings.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6fb7d2841` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13423 tests in 507 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 6fb7d2841; app probes on the branch, no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-panel-warnings-low` on `51ea2aad2` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1619/result.json`.
**Prompt document name**: 2026-11-03 16:19

## 2026-11-03 — fix(jjtl): output tab after the write, onto the trunk, undo group kept (P-2026-11-03-2110)
**Prompt**: merge alfonso-frontend-jjtl into jjtl-output-tab-late; try R-JTG-14's undo group with the tab opened at the end of the write (run, Undo, Redo, failing run, b10_8); force a write-back failure; b10_8 and b11_9 figures after the merge.
**Files touched**: merge 5336934a4 (`docs/log-inbox/hw-notation.md` by union); `frontend/src/components/project/nestedMaterialization.ts`, its test, `ProjectEditor.tsx` (comment) at 9f5b0f1f8; `docs/log-inbox/hw-notation.md`, `Status:` of `docs/prompts/claude_2026-11-03_2110_prompt_jjtl_tab_with_undo.md`
**Outcome**: ✅ completed
**Corregge**: 2026-11-03 12:32
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: After the merge b10_8's group closed at 6.2 s, before the tab's canvas made its vertices; Cmd+Z left the run. Cause: the tab's 1.4 s mount render has no dispatch, so the closer saw quiet. Fix: a poll back more than 200 ms late counts as a write. Then: closed at 14.7 s, Undo clears all, tab too. Merge commit lacks the `Model:` trailer. Probes in `~/.jjodel-lanes/P-2026-11-03-2110/probe/`. Gates: typecheck 0, vitest 3 import-red, build 0, check:docs.
**Prompt document name**: 2026-11-03 21:10

**Undo trial** (undo probe of P-2026-11-03-1435, this lane's copy; real dialog, Cmd+Z and Cmd+Shift+Z): b2_1 plain, before and after the fix: one step, Undo leaves no key added or removed against before, `out1` tab gone; Redo gives the same tree (the tab stays closed, as on the trunk). Failing run (`Const -> E`, E abstract): no step pushed, nothing written, Undo and Redo inert, error in the panel. b10_8 before the fix: group closed 6,107 ms after the close call, 11,517 keys still there after Undo, tab open. After: closed 14,593 ms after the call (14,696 from the click), after the last canvas long task (13,580 + 249); Undo blocks 966 ms (longest task 903), leaves 13 objects and 14 vertices as before; Redo 356 ms, same tree. Forced write-back failure (b2_1, the writer's slot check throws once): tab `out1` opens, panel `Attributes not written in "out1": 6 value(s) of 6 object(s): the attribute writer failed: probe: forced write-back failure`, Undo still clears the run.

**Figures after the merge** (wbtime probe of P-2026-11-03-1033, this lane's copy, dev server 3233 restarted after the edits; ms from the click; load from `uptime` before the run, at the end in brackets):

| run | load | attributes written | tab | longest task | lag max | page quiet | `Const` | `num` kept |
|---|---|---|---|---|---|---|---|---|
| b10_8 | 7.0 (7.7) | 4,289 | 4,311 | 3,282 | 7,013 | 14,032 | 1,280 | 1,280 of 1,280 |
| b11_9 run 1 | 7.4 (7.1) | 10,315 | 10,336 | 7,928 | 14,174 | 31,370 | 2,560 | 2,560 of 2,560 |
| b11_9 run 2 | 7.1 (6.5) | 10,442 | 10,482 | 7,272 | 12,993 | 30,620 | 2,560 | 2,560 of 2,560 |
| b11_9 run 3 | 7.4 (7.2) | 10,355 | 10,377 | 7,294 | 14,043 | 29,464 | 2,560 | 2,560 of 2,560 |

Two b10_8 runs are left out: one never saw the `open2` mark (after the edits Vite served `DockManager` to the app under an HMR `?t=` URL, so the probe patched a second instance; fixed by restarting the server), and the next one, on a cold server, started at load 2.8 and ended at 14.3 (attributes 13,136, longest 14,340); its warm repeat started at 13.2 (attributes 7,957, longest 3,416).

## 2026-11-03 — merge: jjtl-output-tab-late into alfonso-frontend-jjtl (P-2026-11-03-2318)
**Prompt**: `claude_2026-11-03_2318_prompt_merge_jjtl-output-tab-late.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-output-tab-late` at `3622a1dda` into `alfonso-frontend-jjtl`, merge base `bd82f5f72`, 8 commits on the branch side.
**Files touched**: merge `4d053624f`: 7 files from the branch side (`docs/discovery/lir_2026-11-03_jjtl_output_tab_late.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_1232_prompt_jjtl_output_tab_late.md`, `docs/prompts/claude_2026-11-03_2110_prompt_jjtl_tab_with_undo.md`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/__tests__/nestedMaterialization.test.ts`, `frontend/src/components/project/nestedMaterialization.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `4d053624f` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13477 tests in 508 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 4d053624f; app probes on the branch, undo trial and forced failure included; no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-output-tab-late` on `751c900af` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-2318/result.json`.
**Prompt document name**: 2026-11-03 23:18

## 2026-11-03 — ticket: Re-opening an already open transformation leaves its tab unfindable and pane hidden
**Ticket**: Re-opening a transformation that is already open seems to leave its tab button unfindable and its pane hidden. Seen by a probe of P-2026-11-03-1315; not diagnosed. `DockManager.updateTab` is a guess, not a finding.
**Priority**: medium
**Found in**: P-2026-11-03-2112

## 2026-11-03 — ticket: Same reference drawn twice on a non-unique feature adds a second value, one edge shown
**Ticket**: Drawing the same reference twice on a non-unique feature adds a second value to the feature while the canvas shows one edge. The second draw must be refused. `syncCreateReferenceLink` does not check for an existing entry. That file is in the critical zone (CLAUDE.md 3.1), so this is a ticket only, no edit in this lane.
**Priority**: medium
**Found in**: P-2026-11-03-2112

## 2026-11-03 — docs: JjTL housekeeping, CLAUDE.md known failures, init_dash, data idiom (P-2026-11-03-2112)
**Prompt**: Update the known import failures in root CLAUDE.md s17 and jjtl/CLAUDE.md Known limitations; remove the init_dash console.error and its smoke baseline entry; document the data search idiom in SPEC.md; open two tickets.
**Files touched**: CLAUDE.md, AGENTS.md, frontend/src/jjtl/CLAUDE.md, frontend/src/jjtl/AGENTS.md (e5aa9b30f); frontend/src/redux/store.tsx, frontend/scripts/smoke/console-baseline.json (f0b6a8d8b); frontend/src/jjtl/SPEC.md (14d7f5c18); docs/log-inbox/hw-notation.md (tickets #529, #530 and this entry)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes — more than five files (7 plus the inbox); the two AGENTS.md were regenerated by `npm run gen:agents` because the prompt scope omitted them (rule 1c), never hand-edited.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Measured before editing: vitest 3 failed / 504 passed (context-binding, ai-prompt-sanitization, UDComparator). Gates: tsc 0, vitest same 3 red, build 0, check:docs 5/5, check:agents PASS. Smoke baseline not run: port 3000 answers but its tree is unknown, so a run would not measure this branch. #519 note is in SPEC 7.4; no comment posted on the issue.
**Prompt document name**: 2026-11-03 21:12

## 2026-11-03 — merge: jjtl-claudemd-initdash into alfonso-frontend-jjtl (P-2026-11-03-2329)
**Prompt**: `claude_2026-11-03_2329_prompt_merge_jjtl-claudemd-initdash.md`, a merge in a `lane-run` session: `jjtl-claudemd-initdash` at `34e8e7bc6` into `alfonso-frontend-jjtl`, merge base `bd82f5f72`, 5 commits on the branch side, 1 conflict measured (`docs/log-inbox/hw-notation.md`); governance files on the branch (`CLAUDE.md`, `AGENTS.md`).
**Files touched**: merge `8bd217f08`: 9 files from the branch side (`AGENTS.md`, `CLAUDE.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_2112_prompt_jjtl_claudemd_initdash.md`, `frontend/scripts/smoke/console-baseline.json`, `frontend/src/jjtl/AGENTS.md`, `frontend/src/jjtl/CLAUDE.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/redux/store.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8bd217f08`: typecheck exit 0, no `error TS`; typecheck:scripts exit 0; vitest 13477 tests in 508 files, 0 failed, 3 red at import (the trunk tip's count and files; the branch adds no test); hooks 967 in 21 files; build exit 0; check:docs 5/5; check:agents PASS; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 8bd217f08; docs, one console line and its baseline entry; no hand run and no visual check
**Notes**: Stopped once at step 2 on the governance files; resumed on Alfonso's yes (question 4 of 16:50, closed 21:07). Union in hw-notation.md: trunk blocks first, then the branch's, additions only against each side, 15 probes once, R-TXT-39 absent. check:docs is 5/5, not the 4/4 the prompt named (Check E). Lane board untouched; 3001 up, not restarted. Not pushed.
**Prompt document name**: 2026-11-03 23:29

## 2026-11-03 — feat(jjtl): let holds its value (#515), unique on called rules (P-2026-11-03-2111, P-2026-11-03-2325)
**Prompt**: `claude_2026-11-03_2111_prompt_jjtl_let_unique_called.md`: a JjTL `let` holds its value (#515), `unique` on called rules, the natural Class2Relational moved forward; stopped at the context ceiling (AM-8), docs closed by `claude_2026-11-03_2325_prompt_jjtl_let_unique_close.md`.
**Files touched**: code `d8c281211`: `frontend/src/jjtl/parser/parser.ts`, `types/ast.ts`, `executor/executor.ts`, `components/GrammarDiagram/types.ts`, `components/GrammarDiagram/diagramRenderer.ts`, `__tests__/fixtures/class2relational.ts`, `executor/__tests__/class2relational.test.ts`, `executor/__tests__/called-lazy-rules.test.ts`, `parser/__tests__/called-lazy-rules.test.ts`; docs `860f3d5f3`: `docs/decisions.md` (R-JTG-15, R-JTG-16); `5f05b418c`: `frontend/src/jjtl/SPEC.md`; this entry; the Status lines of both prompts in the commit after it.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d8c281211`: typecheck 0; vitest 13439 passed, 0 failed, 3 red at import (baseline); build exit 0. check:docs 5/5 after `5f05b418c`.
**Out-of-scope changes**: no (12 files, all in the declared scope of `frontend/src/jjtl/` and `docs/`, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe on port 3271, not by hand: natural C2R text completes, 27 objects, schemaEqualsExpected true; save/reopen same tree
**Notes**: Red first: 10 tests failed for the intended reasons. Mutation bench 6/6 killed (`~/.jjodel-lanes/P-2026-11-03-2111/mutate.py`); two mutations ran in one tool call, against one-probe-per-call. 11 of the 21 fixture edits go away (W5 10, W6 1), 10 remain (W1 1, W2 4, W3 4, W4 1). Two expectations moved with #515: W2 join-table key, #445 line 27 to 29. Evidence: `~/.jjodel-lanes/P-2026-11-03-2111/handoff.md`.
**Prompt document name**: 2026-11-03 21:11

**Ticket** (#515, update, closed by R-JTG-15): a `let` bound to a called-rule call or an `envLookup` now realizes it once, at the binding (`letValue`/`realizeCalls` in `executor.ts`, all five LetStatement sites), so two uses of the name are one object; a source element bound by a `let` stays the element. On Class2Relational the 8 extra root Columns are gone and no `resolve()` is left in the natural text. #517 stays open, pinned by its test on `MATCHED_KEYS`.

## 2026-11-04 — merge: jjtl-let-unique-called into alfonso-frontend-jjtl (P-2026-11-04-0007)
**Prompt**: `claude_2026-11-04_0007_prompt_merge_jjtl-let-unique-called.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-let-unique-called` at `5d7623c72` into `alfonso-frontend-jjtl`, merge base `bd82f5f72`, 7 commits on the branch side.
**Files touched**: merge `d37e726aa`: 14 files from the branch side (`docs/decisions.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-03_2111_prompt_jjtl_let_unique_called.md`, `docs/prompts/claude_2026-11-03_2325_prompt_jjtl_let_unique_close.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/__tests__/fixtures/class2relational.ts`, `frontend/src/jjtl/components/GrammarDiagram/diagramRenderer.ts`, `frontend/src/jjtl/components/GrammarDiagram/types.ts`, and 6 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d37e726aa` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13493 tests in 508 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on d37e726aa; app probe of the natural Class2Relational on the branch; no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-let-unique-called-P-2026-11-04-0007` on `721927b41` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0007/result.json`.
**Prompt document name**: 2026-11-04 00:07

## 2026-11-04 — feat(jjtl): missing target class, [*] warning, lazy beside matched, such that (P-2026-11-04-0015, P-2026-11-04-0043)
**Prompt**: `claude_2026-11-04_0015_prompt_jjtl_language_open.md`: four JjTL points decided by Alfonso 2026-11-03 (missing target class an error, `[*]` warning, lazy exempt from R-JTG-3, `such that` with bare names); stopped at the context ceiling (AM-8), docs closed by `claude_2026-11-04_0043_prompt_jjtl_language_open_close.md`.
**Files touched**: code `90ee317b5`: `frontend/src/jjtl/executor/executor.ts` and tests (`language-open-points.test.ts`, `class2relational.test.ts`, `called-lazy-rules.test.ts`); docs `1e0786024`, `1729e329a`: `docs/decisions.md` (R-JTG-17..20); `1e0786024`, `e11159e0b`: `frontend/src/jjtl/SPEC.md`; this entry and both Status lines.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `90ee317b5`: typecheck 0; vitest 13503 passed, 0 failed, 3 red at import (baseline); build exit 0. check:docs run on the docs commits.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe on port 3291, not by hand: `DataType -> Nope` fails in the panel, nothing written, 16 objects before and after; control run 27
**Notes**: Red first: 10/10. Mutation bench 5/5 killed; M3 (lazy always wins) dies only in language-open-points. R-JTG-18 held an unattended reach rule as Alfonso's: moved to R-JTG-20, provisional; the unattended parts of R-JTG-17 and 19 are marked provisional. No GitHub issue exists for the two tickets. Evidence: `~/.jjodel-lanes/P-2026-11-04-0015/handoff.md`.
**Prompt document name**: 2026-11-04 00:15

**Ticket** (2026-11-03 — ticket: a JjTL rule whose target class does not exist runs without error and writes a partial model, closed by R-JTG-17): the run fails before pass 1 with `Target class 'Nope' not found in target metamodel (A -> Nope). Nothing is written.`, no output model. The `envLookup("nope")` in a lazy Const seen beside it was not separated and is not closed here.

**Ticket** (2026-11-03 — ticket: JjTL multiplicity [*] creates one target per source, silently, closed by the warning): every `[*]` and `[n..*]` rule warns once that the count is not settled; one target per source as before. The meaning of `[*]` stays Alfonso's open question.

## 2026-11-04 — merge: jjtl-language-open into alfonso-frontend-jjtl (P-2026-11-04-0048)
**Prompt**: `claude_2026-11-04_0048_prompt_merge_jjtl-language-open.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-language-open` at `83a944575` into `alfonso-frontend-jjtl`, merge base `d37e726aa`, 7 commits on the branch side.
**Files touched**: merge `73758798f`: 9 files from the branch side (`docs/decisions.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-04_0015_prompt_jjtl_language_open.md`, `docs/prompts/claude_2026-11-04_0043_prompt_jjtl_language_open_close.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/executor/__tests__/called-lazy-rules.test.ts`, `frontend/src/jjtl/executor/__tests__/class2relational.test.ts`, `frontend/src/jjtl/executor/__tests__/language-open-points.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `73758798f` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13503 tests in 509 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 73758798f; unit tests, mutation bench and an app probe on the branch; no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-language-open` on `10fadd8ab` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0048/result.json`.
**Prompt document name**: 2026-11-04 00:48

## 2026-11-04 — ticket: JjTL output tab: the longest task is React rendering of the canvas, not vertex creation
**Ticket**: Measured by P-2026-11-03-2332 on b10_8, probe only: the longest task after the JjTL output tab mounts (3,354 ms, three React commits) contains no vertex or edge creation. The useJjomSync Step 2bis loop takes 332 to 363 ms inside a separate 1,478 ms task, with 717 to 757 ms of edges. In the profiled longest task react-dom is 82 % of 3,791 ms; DynamicHandles 575 ms, store subscriptions 472 ms, ObjectNode 377 ms, overlapping. Spreading Step 2bis across frames would not shorten the longest task. #475 is re-aimed at the React side by Alfonso, 2026-11-04.
**Priority**: medium
**Found in**: P-2026-11-03-2332

## 2026-11-04 — fix(jjtl): nested missing class is an error; hidden tab does not hold the undo group (P-2026-11-04-0255)
**Prompt**: `claude_2026-11-04_0255_prompt_jjtl_nested_hidden.md`: a nested creation of a class missing from the target metamodel is an error and nothing is written (R-JTG-17 nested case, ratified 2026-11-04); a late undo-step poll while `document.hidden` does not count as busy.
**Files touched**: code `d52a89f99`: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/components/project/nestedMaterialization.ts`, tests `language-open-points.test.ts`, `nested-creation-into-features.test.ts`, `nestedMaterialization.test.ts`; docs: `docs/decisions.md` (R-JTG-17), `frontend/src/jjtl/SPEC.md` §10, this entry and the Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d52a89f99`: typecheck exit 0, 0 errors; vitest 13510 passed, 3 red at import (baseline); build exit 0. check:docs on the docs commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe on port 3295, not by hand: nested `-> columns { -> Ghost }` fails in the panel, no output model, 16 objects before and after; control run 27
**Notes**: Red first: 4 JjTL and 2 hidden-tab tests, for the intended reason. `nested-creation-into-features.test.ts` pinned the old warning and now asserts the error. Mutation bench 5/5 killed (`~/.jjodel-lanes/P-2026-11-04-0255/bench.txt`). Class2Relational and parity fixtures unchanged, no assertion edited.
**Prompt document name**: 2026-11-04 02:55

## 2026-11-04 — merge: jjtl-nested-hidden into alfonso-frontend-jjtl (P-2026-11-04-0312)
**Prompt**: `claude_2026-11-04_0312_prompt_merge_jjtl-nested-hidden.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-nested-hidden` at `93e82ab1e` into `alfonso-frontend-jjtl`, merge base `8411cfae5`, 3 commits on the branch side.
**Files touched**: merge `efe1d320b`: 9 files from the branch side (`docs/decisions.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-04_0255_prompt_jjtl_nested_hidden.md`, `frontend/src/components/project/__tests__/nestedMaterialization.test.ts`, `frontend/src/components/project/nestedMaterialization.ts`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/executor/__tests__/language-open-points.test.ts`, `frontend/src/jjtl/executor/__tests__/nested-creation-into-features.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `efe1d320b` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13575 tests in 511 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on efe1d320b; unit tests, mutation bench and an app probe on the branch; no hand run and no visual check
**Notes**: Rollback tag `pre-jjtl-nested-hidden` on `1f58fece6` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0312/result.json`.
**Prompt document name**: 2026-11-04 03:12

## 2026-11-04 — docs: discovery, JjTL canvas render routes A and B (P-2026-11-04-0256, P-2026-11-04-0400)
**Prompt**: P-2026-11-04-0256, read-only discovery of the React rendering of a large output canvas (#475, #547), route A (skip the forced initial render) against route B (cheaper per-node selectors) on b10_8 and b11_9; stopped at the context ceiling, closed by P-2026-11-04-0400 (handoff items: §4 caller sentence, Status lines, check:docs, commit).
**Files touched**: `docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md` (new), this inbox, the `Status:` lines of both prompts.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Partial only because 0256 hit the context ceiling (RC-51) before its commit; the discovery itself is complete. No source change; throwaway patches in `~/.jjodel-lanes/P-2026-11-04-0256/probe/`, each reverted. Route A: b10_8 longest 4,248 -> 1,571 ms, breaks edges to unmeasured nodes and fitView. Route B: mount -25%/-33%, cull unchanged. Side finding: ELK auto-layout of 117 s in 1 of 9 runs. Open questions in report §8.
**Prompt document name**: 2026-11-04 02:56

## 2026-11-04 — merge: jjtl-canvas-render into alfonso-frontend-jjtl (P-2026-11-04-0404)
**Prompt**: `claude_2026-11-04_0404_prompt_merge_jjtl-canvas-render.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-canvas-render` at `495fd97d2` into `alfonso-frontend-jjtl`, merge base `8411cfae5`, 3 commits on the branch side.
**Files touched**: merge `158f7eb76`: 4 files from the branch side (`docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-04_0256_prompt_jjtl_canvas_render_discovery.md`, `docs/prompts/claude_2026-11-04_0400_prompt_jjtl_canvas_render_close.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `158f7eb76` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13575 tests in 511 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, gates green, no hand run
**Notes**: Rollback tag `pre-jjtl-canvas-render` on `94a196964` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0404/result.json`.
**Prompt document name**: 2026-11-04 04:04

## 2026-11-04 — ticket: Auto-layout on open can block the main thread for minutes on large models, intermittently
**Ticket**: Measured by P-2026-11-04-0256, dev server, load 36 to 38, one run of nine on b10_8: the ELK auto-layout on open ran 117,474 ms on the main thread over 2,559 nodes (EditorV2.tsx:603). Intermittent, no size cap, a timing race not traced. Separately, one profiled b11_9 run blocked the main thread over 7 minutes; cause not captured. See docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md section 5. Trace it before choosing a node cap or a worker.
**Priority**: high
**Found in**: P-2026-11-04-0256

## 2026-11-04 — feat(jjtl): missing class in a let body is an error; [*] settled (P-2026-11-04-0900)
**Prompt**: `claude_2026-11-04_0900_prompt_jjtl_let_multiplicity.md`: R-JTG-17 reaches let bodies; `[*]` one target per source, `[n..*]` n, warning and open-gap passages removed; rows decided by the chat on Alfonso's delegation of 2026-11-04.
**Files touched**: code `96b79cec3`: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/executor/__tests__/language-open-points.test.ts`; docs `5eaae6544`: `docs/decisions.md` (R-JTG-21, R-JTG-22), `frontend/src/jjtl/SPEC.md` (4.4, 10, 12.2, 12.3 gap 4, Appendix C); this entry and the Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `96b79cec3`: typecheck exit 0; vitest 13714 passed, 3 red at import (baseline); build exit 0. check:docs exit 0 on the docs commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no app probe and no hand run; unit tests and mutation bench only
**Notes**: Red first 16/32 for the intended reason. `[3..*]` on 2 sources: 2 before, 6 after; `[*]`, `[0..*]`, `[1..*]` unchanged at one per source. The static walk reaches every let body (rule, objectCreation and let bodies are the only mappingBody sites). Bench 4/5 (`~/.jjodel-lanes/P-2026-11-04-0900/bench.txt`): M3, the abstract check entering let bodies, survives, undecided. Class2Relational and parity fixtures unchanged, no assertion edited.
**Prompt document name**: 2026-11-04 09:00

## 2026-11-04 — feat(jjtl): abstract class in a let body is an error (P-2026-11-04-0900, follow-up)
**Prompt**: GO on the lane's Recommended, on Alfonso's delegation: an abstract class created inside a let body is an error, as for rule and nested targets; the shape check stays; amend R-JTG-22 with a new sentence.
**Files touched**: code `06ce85232`: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/executor/__tests__/language-open-points.test.ts`; docs: `docs/decisions.md` (R-JTG-22 amended), `frontend/src/jjtl/SPEC.md` §10, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `06ce85232`: typecheck exit 0; vitest 13720 passed, 3 red at import (baseline); build exit 0. check:docs on the docs commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no app probe and no hand run; unit tests and mutation bench only
**Notes**: Red first 4/38 for the intended reason; the concrete-subclass control green. Bench rerun 6/6 killed (`~/.jjodel-lanes/P-2026-11-04-0900/bench.txt`): M3 (abstract skipped in a let feature) and the new M3b (in a let forall) die in language-open-points only.
**Prompt document name**: 2026-11-04 09:00

## 2026-11-04 — merge: jjtl-let-multiplicity into alfonso-frontend-jjtl (P-2026-11-04-0936)
**Prompt**: `claude_2026-11-04_0936_prompt_merge_jjtl-let-multiplicity.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-let-multiplicity` at `46da7fabe` into `alfonso-frontend-jjtl`, merge base `32b9c87d3`, 6 commits on the branch side.
**Files touched**: merge `3161cc583`: 6 files from the branch side (`docs/decisions.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-04_0900_prompt_jjtl_let_multiplicity.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/executor/__tests__/language-open-points.test.ts`, `frontend/src/jjtl/executor/executor.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `3161cc583` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13720 tests in 513 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 3161cc583; unit tests and mutation bench on the branch, no app probe, no hand run
**Notes**: Rollback tag `pre-jjtl-let-multiplicity` on `32b9c87d3` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0936/result.json`.
**Prompt document name**: 2026-11-04 09:36

## 2026-11-04 — feat(editor-v2): skip React Flow's forced first mount on large canvases (P-2026-11-04-0901, P-2026-11-04-0925)
**Prompt**: `claude_2026-11-04_0925_prompt_canvas_mount_cont.md`, continuing `claude_2026-11-04_0901_prompt_canvas_mount_unmeasured.md` after its ceiling stop: route A in EditorV2.tsx, gates, figures before and after, crops, entry, Status.
**Files touched**: `b5cfa4a85` LIR (0901); `be8e2eed2` `editor-v2/unmeasuredNodes.ts` + its test; `0740d511f` `EditorV2.tsx`, `unmeasuredNodes.ts`, the test; docs commit: LIR amendment, the two Status lines; this entry.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Gates: tsc 0; vitest 3 red at import + 2 load-timing reds green on rerun; build 0. b10_8 dev, mounted node els 2,559 -> 9, longest 5,008 -> 2,049-2,362 ms, total 16,727 -> 11,330-14,658; prod longest 2,055-2,148 -> 1,369-1,464 ms. 0 edge warnings. b11_9 did not mount on either tree. Partial: no pan crop (out1 ends with 1 node, both trees), no src1 crop. Figures: LIR amendment, ~/.jjodel-lanes/P-2026-11-04-0925/probe/out.
**Prompt document name**: 2026-11-04 09:25

## 2026-11-04 — ticket: Auto layout throws an ELK RangeError on a 200-class metamodel, on trunk too
**Ticket**: Measured by P-2026-11-04-1012, dev server: the toolbar Auto layout on a metamodel of 200 classes throws `RangeError: Maximum call stack size exceeded` inside elkjs, so no layout and no fit follow. Seen on both graphs of the probe (a 400-reference ring with chords; an acyclic 299-reference chain), with route A on and with MOUNT_ALL_MAX_NODES raised to 1e9 by page.route (trunk behaviour). Which ELK phase recurses, and from what size, is not traced.
**Priority**: medium
**Found in**: P-2026-11-04-1012

## 2026-11-04 — test(editor-v2): off-screen edges of route A on 200 flat classes (P-2026-11-04-1012)
**Prompt**: `claude_2026-11-04_1012_prompt_canvas_mount_edge_check.md`: on a probe graph over 150 flat nodes, check an edge with one end off-screen, pan, select, fit, export; compare with trunk; fix in EditorV2.tsx or unmeasuredNodes.ts on failure.
**Files touched**: `docs/log-inbox/hw-notation.md` (this entry, one ticket); the Status line of the 1012 prompt file. No code.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 200 classes, 400 refs. Branch: off-screen edge drawn (DOM, crop), 0 edge warnings; after pan the far end is 2 px from its handle at +150 ms, +2 s and pre-paint of the first frame shown; select, export ok; trunk (threshold 1e9) the same. Open fit frames 200/200 on both. Partial: no fit button exists, and Auto layout throws in ELK on both (ticket above). Probe and figures: ~/.jjodel-lanes/P-2026-11-04-1012.
**Prompt document name**: 2026-11-04 10:12

## 2026-11-04 — merge: canvas-mount-unmeasured into alfonso-frontend-jjtl (P-2026-11-04-1038)
**Prompt**: `claude_2026-11-04_1038_prompt_merge_canvas-mount-unmeasured.md`, a direct merge by `lane-run merge --direct`, no session: `canvas-mount-unmeasured` at `58bcb36f8` into `alfonso-frontend-jjtl`, merge base `32b9c87d3`, 10 commits on the branch side.
**Files touched**: merge `9abc989ff`: 8 files from the branch side (`docs/discovery/lir_2026-11-04_canvas_mount_unmeasured.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-11-04_0901_prompt_canvas_mount_unmeasured.md`, `docs/prompts/claude_2026-11-04_0925_prompt_canvas_mount_cont.md`, `docs/prompts/claude_2026-11-04_1012_prompt_canvas_mount_edge_check.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/__tests__/unmeasuredNodes.test.ts`, `frontend/src/components/editor-v2/unmeasuredNodes.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `9abc989ff` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13740 tests in 514 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates green on 9abc989ff; probes on the branch, no hand run. Known visible difference on models above 150 nodes: parallel edges look stacked in one band; fix lane P-2026-11-04-1050 open, #475 stays open until it closes
**Notes**: Rollback tag `pre-canvas-mount-unmeasured` on `ad34b896f` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-1038/result.json`.
**Prompt document name**: 2026-11-04 10:38
