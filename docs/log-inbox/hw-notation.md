# log-inbox — lane «hw-notation»

Entries written by the hw-notation lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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
