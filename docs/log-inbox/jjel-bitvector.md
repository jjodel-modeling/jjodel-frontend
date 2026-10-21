# log-inbox — lane «jjel-bitvector»

Entries written by the jjel-bitvector lane (front `hw-notation`) in the worktree `~/jjodel-w-bitvector`.
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-21 — fix: JjEL keyword as member name after `.` and `?.`
**Prompt**: P-2026-10-21-0011: the JjEL parser accepts any keyword as the member name after `.` and `?.`, so the S1 bit-vector methods `x.and(y)`, `x.or(y)`, `x.not()` parse; remove the S1 workaround, the SPEC §7.5 limit, restore the autocomplete entries, amend R-BV-4.
**Files touched**: `3aa5993c8` frontend/src/jjel/parser/parser.ts, frontend/src/jjel/__tests__/parser.test.ts, frontend/src/jjel/__tests__/bitvector.test.ts, frontend/src/jjel/__tests__/fixtures/bv-golden.json, frontend/src/jjel/SPEC.md, frontend/src/jjel/metadata/builtins.ts; closure commit: docs/decisions.md (R-BV-4), the Status line of the prompt, this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (bv-golden.json, not listed: it held half of the S1 workaround, the `M` placeholder and the `method` field of the and/or/not rows)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates: typecheck exit 0; vitest src/jjel, src/jjtl, src/model/simulation, src/codegen 1595 passed, only the 7 known jjtl window files; build exit 0. `true`, `false`, `null` stay refused as member names: M12 (R-SIM-17) pins `x.true` as an error, and `null` maps to NULL in JJEL_KEYWORDS, so it is filtered explicitly. JjTL's parser has the same IDENTIFIER-only restriction (jjtl/parser/parser.ts:176, 1045, 1069): reported, not changed.
**Prompt document name**: 2026-10-21 00:11

## 2026-10-20 — feat: JjEL bit-vector values, discovery and slice S1
**Prompt**: P-2026-10-20-2055 (discovery of bit-vector values in JjEL), P-2026-10-20-2331 (slice S1: the value and its operations in the evaluator; stopped at the soft context ceiling with the code uncommitted, RC-51) and P-2026-10-20-2350 (S1 closure: gates, mutation bench, feat commit, docs closure).
**Files touched**: `319b16865` docs/discovery/discovery_2026-10-20_jjel_bitvector.md; `de0ce082c` frontend/src/jjel/evaluator/builtins/bitvectors.ts (new), frontend/src/jjel/evaluator/context.ts, frontend/src/jjel/evaluator/evaluator.ts, frontend/src/jjel/evaluator/builtins/collections.ts, frontend/src/jjel/metadata/builtins.ts, frontend/src/jjel/SPEC.md, frontend/src/jjel/__tests__/bitvector.test.ts (new), frontend/src/jjel/__tests__/fixtures/bv-golden.json (new); closure commit: docs/decisions.md (R-BV-1..6), the Status lines of the three prompt files, this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (14 files over three prompts, more than five, all declared by their prompts: listed in Files touched)
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Gates on de0ce082c's tree: typecheck exit 0; vitest src/jjel, src/jjtl, src/model/simulation, src/codegen 1590 passed, 0 failed, only the 7 known jjtl window files; build passed in 2331 (only test assertions changed since). Bench: 26 mutations, 0 survivors, one killer each in the de0ce082c body. R-BV-2 evidence moved from inferred to read (discovery §10). LIR: discovery §12 (S1 touches no sync or D-L file).
**Prompt document name**: 2026-10-20 23:50

**Ticket** (medium, found in P-2026-10-20-2331): `x.and(y)`, `x.or(y)`, `x.not()` are implemented but do not parse: `and`, `or`, `not` lex as keywords and the parser takes only an IDENTIFIER after `.` and `?.`. A parser lane that accepts a keyword as a member name is owed; the chat writes it (R-BV-4).

## 2026-10-21 — merge: jjel-bitvector into alfonso-frontend-jjtl (P-2026-10-21-0002)
**Prompt**: `claude_2026-10-21_0002_prompt_merge_jjel-bitvector.md`, a direct merge by `lane-run merge --direct`, no session: `jjel-bitvector` at `0e8d7e31a` into `alfonso-frontend-jjtl`, merge base `19ea86152`, 8 commits on the branch side.
**Files touched**: merge `2aa86bb19`: 14 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-20_jjel_bitvector.md`, `docs/log-inbox/jjel-bitvector.md`, `docs/prompts/claude_2026-10-20_2055_prompt_jjel_bitvector_discovery.md`, `docs/prompts/claude_2026-10-20_2331_prompt_jjel_bitvector_s1.md`, `docs/prompts/claude_2026-10-20_2350_prompt_jjel_bitvector_s1_closure.md`, `frontend/src/jjel/SPEC.md`, `frontend/src/jjel/__tests__/bitvector.test.ts`, and 6 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2aa86bb19` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9599 tests in 389 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: JjEL evaluator only, no UI file in the merge; every gate green (9599 tests, build, check:docs); dev server on 3001 answers 200
**Notes**: Rollback tag `pre-jjel-bitvector` on `ba083c6b9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-0002/result.json`.
**Prompt document name**: 2026-10-21 00:02

## 2026-10-21 — merge: jjel-keyword-member into alfonso-frontend-jjtl (P-2026-10-21-0025)
**Prompt**: `claude_2026-10-21_0025_prompt_merge_jjel-keyword-member.md`, a direct merge by `lane-run merge --direct`, no session: `jjel-keyword-member` at `a3a0d1d60` into `alfonso-frontend-jjtl`.
**Files touched**: merge `8ad09e0ce` (the parser, its tests, `bitvector.test.ts`, `SPEC.md`, `metadata/builtins.ts`, `docs/decisions.md`, the log inbox and the prompt); `5d96f34dc` `frontend/src/model/validation/__tests__/validationEvaluator.test.ts`; this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8ad09e0ce` in the worker: typecheck 0, typecheck:scripts 0, vitest 9604 tests with the one failure above, build 0, check:docs, check:agents, check:scripts, check:addonly 0. The block was cleared with `lane-run resolve`.
**Out-of-scope changes**: one test file, fixed by the chat on the trunk.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: JjEL parser only, no UI file in the merge; dev server on 3001 answers 200
**Notes**: One red test in the worker gate: `validationEvaluator.test.ts` used `coll.forAll(x => x.p)` as a body that does not compile, and it now parses; fixed in `5d96f34dc` (file green, 30/30), block cleared with `lane-run resolve`, closure written by hand since `go` refuses a blocked merge. Tags `pre-jjel-keyword-member`, `pre-kwmember-testfix-2026-10-21`.
**Prompt document name**: 2026-10-21 00:25

## 2026-10-21 — feat: JjEL bit-vector slice S2, the simulator word domain
**Prompt**: P-2026-10-21-0010 (slice S2: word domains in the simulator, `bvToSmv`; stopped at the soft context ceiling with the code uncommitted, RC-51) and P-2026-10-21-0055 (S2 finish: `bits` undefined in the simulator, gates, bench, docs closure).
**Files touched**: `9b4ded919` frontend/src/model/simulation/netTypes.ts, netStep.ts, netCompile.ts, stateAttributesCodec.ts, actionEvaluator.ts, subsetChecker.ts, stcChecks.ts, guardContext.ts, bvToSmv.ts (new), __tests__/bvToSmv.test.ts (new), __tests__/wordDomain.test.ts (new); frontend/src/jjel/evaluator/evaluator.ts; frontend/src/components/editor-v2/sim/simBoard.ts, simInputs.ts, SimInputDialog.tsx, simScenarios.ts; closure commit: docs/decisions.md (R-BV-8), the Status lines of the two prompt files, this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (16 files over two prompts, more than five, all declared by their prompts: listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates on 9b4ded919's tree: typecheck exit 0; vitest src/jjel, src/model, src/codegen, src/components/editor-v2/sim 94 files, 2716 passed; build passed. Bench: 6 mutations (the handoff's 5 plus the base-context registration), 0 survivors, killers in the closure commit body. registerBitVectorConstructors sits in evaluator.ts, not bitvectors.ts, which cannot import the evaluator: R-BV-8 (5). toNumber not added, toVerilog in a separate set: R-BV-8 (3).
**Prompt document name**: 2026-10-21 00:55

## 2026-10-21 — merge: bv-sim into alfonso-frontend-jjtl (P-2026-10-21-0105)
**Prompt**: `claude_2026-10-21_0105_prompt_merge_bv-sim.md`, a direct merge by `lane-run merge --direct`, no session: `bv-sim` at `bc65a9a32` into `alfonso-frontend-jjtl`.
**Files touched**: merge `2f0550605` (the simulator word domain of S2, `bvToSmv.ts`, `guardContext.ts`, four sim view files, the JjEL constructor helper, tests, `docs/decisions.md` R-BV-8, the log inbox, the prompts); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2f0550605`: typecheck 0, typecheck:scripts 0, build 0, check:docs, check:agents, check:scripts, check:addonly 0; vitest 9659 tests with 2 failures outside the merge, both green re-run alone.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the four sim view files only gained an inert word case; dev server on 3001 answers 200
**Notes**: Red files under load average 60 from other lanes: `traceMonitor.test.ts` (port checks, already red in vitest-before) and `irSelectionRing.test.ts` (import); both 14/14 green alone at 01:22. Block cleared with `lane-run resolve`, closure by hand. Tag `pre-bv-sim` on `3d1f53016`.
**Prompt document name**: 2026-10-21 01:05

## 2026-10-21 — feat: JjEL bit-vector slice S3, code generation
**Prompt**: P-2026-10-21-0640 (slice S3: a bit-vector through the codegen pilot, `plain()`, `valueLiteral`, the JS runtime prelude and the S1 methods; stopped at the soft context ceiling with the code uncommitted, RC-51) and P-2026-10-21-0700 (S3 finish: the tests of the handoff, the prelude parity test, gates, bench, docs, two tickets)
**Files touched**: `35c761ca3` frontend/src/codegen/engine/origin.ts, frontend/src/codegen/target/js/access.ts, frontend/src/codegen/target/js/printer.ts, frontend/src/codegen/target/js/__tests__/printer.bitvector.test.ts (new), frontend/src/codegen/oracle/__tests__/bitvector.test.ts (new); docs closure: docs/decisions.md (R-BV-9), docs/prompts/claude_2026-10-21_0640_prompt_bitvector_s3_codegen.md, docs/prompts/claude_2026-10-21_0700_prompt_bitvector_s3_finish.md, docs/log-inbox/jjel-bitvector.md, docs/log-inbox/hw-notation.md (two tickets)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates on 35c761ca3: typecheck exit 0; vitest src/jjel src/model src/codegen src/components 266 files, 8115 passed, none red; build exit 0. Parity on bv-golden.json, 48 rows (bv-cases.json not on this branch). Bench, 5 mutations all killed: plain branch, valueLiteral branch, + without asUintN, $bvPair any widths, $eq no dispatch. Handoff step corrected: the register is declared on MM (stateAttributesCodec.ts:303). Tickets #212 high, #213 medium. Decisions: R-BV-9.
**Prompt document name**: 2026-10-21 07:00
