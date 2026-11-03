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
