# log-inbox — lane «hw-notation»

Entries written by the hw-notation lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-21 — feat: hw demonstrator S-A1, HwDesign metamodel and CPU model built by script
**Prompt**: P-2026-10-21-1100, finish of P-2026-10-21-1036 after its AM-8 ceiling: slice S-A1 of the hw demonstrator plan §10.1, fix the build from the handoff, regenerate hw-cpu.jjodel by the app's export, gates, commit
**Files touched**: frontend/scripts/examples/build-hw-cpu.ts (new), frontend/src/codegen/examples/hw-cpu/hw-cpu.json (new), frontend/public/examples/hw/hw-cpu.jjodel (new), frontend/src/codegen/oracle/__tests__/exampleFixture.ts, frontend/src/codegen/examples/__tests__/importable.test.ts, frontend/scripts/probe/codegen-examples.ts; Status lines of the 1036 and 1100 prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Code d3abfaade. Build fixes: a feature added and bounded in two calls; a containment append waits until the store lists the child. Build ALL GREEN (13); import probe ALL GREEN (80, hw-cpu 9), the lecture path needs VITE_CODEGEN=true. Six mutants killed (commit body). Deviations from §10.1: Format and FinalState added, guard/exit typed EXPRESSION/ACTION, exit multi-valued.
**Prompt document name**: 2026-10-21 11:00

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

## 2026-10-21 — feat: S-D0, the JjEL to Verilog printer of the register-transfer subset
**Prompt**: Hardware demonstrator slice S-D0 (plan §10.1): a JjEL→Verilog printer for σ reads, the memory idiom, bits/sbits, the 24 oracle.mapping operators, if-then-else and actions; the pure memory-idiom recogniser; tests (a) every bv-cases.json row, (b) composed width-trap cases, (c) a Verilator mode; mutation bench on the wrapping rule and the ashr/zext/sext casts.
**Files touched**: `frontend/src/codegen/target/verilog/printer.ts`, `…/verilog/__tests__/printer.test.ts`, `…/verilog/__tests__/composedCases.ts`, `frontend/src/model/simulation/memoryIdiom.ts`, `frontend/src/model/simulation/__tests__/memoryIdiom.test.ts`, `frontend/scripts/oracle/bv-printer-verilator.mjs` (da6405568); `docs/prompts/claude_2026-10-21_1035_prompt_hw_sd0_verilog_printer.md` Status line, this entry (closure commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Six code files, above five: `composedCases.ts` is not in the S-D0 file list but sits in the declared `verilog/` directory; it holds the (b) cases that the test and the script share. (c) stays in this slice: 4746 cases, 0 disagree with Verilator 5.052; `run` and the build line are copied, since `bv-verilator.mjs` runs on import and exports nothing, and the TS printer loads through Vite's `ssrLoadModule`. Typecheck baseline not run before the edits; after them, exit 0.
**Prompt document name**: 2026-10-21 10:35

## 2026-10-21 — merge: hw-printer into alfonso-frontend-jjtl (P-2026-10-21-1138)
**Prompt**: `claude_2026-10-21_1138_prompt_merge_hw-printer.md`, a direct merge by `lane-run merge --direct`, no session: `hw-printer` at `3ae51fbf` into `alfonso-frontend-jjtl`.
**Files touched**: merge `8d40c015f` (codegen/target/verilog, model/simulation/memoryIdiom.ts, scripts/oracle/bv-printer-verilator.mjs and their tests); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8d40c015f`: typecheck 0, typecheck:scripts 0, build 0, check:docs, check:agents, check:scripts, check:addonly 0; vitest with failures outside the merge, green re-run alone.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: codegen Verilog printer and tests only, no UI file; gates green after re-run
**Notes**: The red test was `traceMonitor.test.ts`, with nine more files (lane-run, board, hook, check-addonly, js printer differential, irSelectionRing) under load average 100; all nine re-run alone at 12:17, 444/444. Block cleared with `lane-run resolve`, closure by hand. Tag `pre-hw-printer on fb9aecbcd`.
**Prompt document name**: 2026-10-21 11:38

## 2026-10-21 — feat: hw demonstrator S-B, simulation roles, a running program and its committed trace

**Prompt**: Hardware demonstrator slice S-B (plan §10.1), P-2026-10-21-1145: state roles, word σ attributes on registers and cells, a ROM program and its per-cycle trace.
**Files touched**: `frontend/src/codegen/examples/hw-cpu/hw-cpu.json`, `…/hw-cpu/hw-cpu.trace.json`, `…/hw-cpu/__tests__/hw-cpu.run.test.ts`, `frontend/scripts/examples/build-hw-cpu.ts`, `frontend/public/examples/hw/hw-cpu.jjodel`, `frontend/src/codegen/examples/__tests__/importable.test.ts`, `frontend/scripts/probe/codegen-examples.ts`; this commit: the Status of the prompt, this entry and one ticket.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 0, typecheck:scripts 0, check:scripts 0, build 0; vitest jjel/codegen/model/jjtl 3862 passed, failures only in the known jjtl window imports (CLAUDE.md §17).
**Out-of-scope changes**: yes, `importable.test.ts` and `codegen-examples.ts`, two files beyond the five declared, without the Rule 19 pause.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane R7 probe: Play to Terminated in 170 steps, the run inspector reads ram_12 = 8'h2a; the panel shows the E-CALL defect (ticket below).
**Notes**: Code a1acfa658; lane stopped at the AM-8 ceiling and the chat wrote this closure from its handoff. The program multiplies 7 by 6 into RAM[12] in 170 cycles; seven spec mutants killed. The build probe reports a read race in the S-A1 metamodel (`Transition.next` read 0..1 right after its bound write); the file holds 1..1.
**Prompt document name**: 2026-10-21 11:45

## 2026-10-21 — ticket: Subset checker flags the hw-cpu ROM read bits(8, c.init) as E-CALL

**Ticket**: `subsetChecker.ts:321-322` accepts `bits` only with literal arguments; FETCH's ROM read is `bits(8, rom.cells.filter(…).first.init)`, so the panel shows «1 defect: FETCH exit (E-CALL)». The run is unaffected, but the defect is visible in a demo. The fix belongs to the subset checker or to S-G1's memory idiom, not to the model.
**Priority**: medium
**Found in**: P-2026-10-21-1145

## 2026-10-21 — fix: S-C0 JjTL prerequisites, F4 and the containment write-back
**Prompt**: S-C0 of the hw demonstrator plan §10.1, finished after the context ceiling of P-2026-10-21-1037: rerun the containment write-back probe with its snapshot fixed, fill §3 of the discovery, commit it, close both prompts.
**Files touched**: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/executor/__tests__/source-ref-member-access.test.ts` (c3f5cb15e); `docs/discovery/discovery_2026-10-21_hw_jjtl_prerequisites.md` (229e822f5); Status lines of `docs/prompts/claude_2026-10-21_1037_prompt_hw_sc0_jjtl_prerequisites.md` and `docs/prompts/claude_2026-10-21_1220_prompt_hw_sc0_finish.md`; this inbox
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: One entry for P-2026-10-21-1037 and -1220 (six files, all declared). F4 fixed in executor.ts, gates and mutation bench in the body of c3f5cb15e. H4 holds, measured in the app on three levels: the fathers move into the slots, roots drops to the container; no ProjectEditor.tsx fix. navResolveRev stays null: pass-2 order, not F4. Evidence: docs/discovery/discovery_2026-10-21_hw_jjtl_prerequisites.md §2-§3.
**Prompt document name**: 2026-10-21 12:20

**Ticket** (JjTL, medium): three findings outside F4, each with a Recommended line in the discovery §5, none fixed here: pass-2 rule order for `resolve(x, T).attr`; `p.owner.name` inside a `forall` body; `self.src.name` / `source.src.name`.

## 2026-10-21 — merge: hw-jjtl into hw-demo (P-2026-10-21-1302)
**Prompt**: `claude_2026-10-21_1302_prompt_merge_hw-jjtl.md`, a direct merge by `lane-run merge --direct`, no session: `hw-jjtl` at `26793856d` into `hw-demo`, merge base `f8ee48a07`, 5 commits on the branch side.
**Files touched**: merge `19877ff1c`: 6 files from the branch side (`docs/discovery/discovery_2026-10-21_hw_jjtl_prerequisites.md`, `docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-10-21_1037_prompt_hw_sc0_jjtl_prerequisites.md`, `docs/prompts/claude_2026-10-21_1220_prompt_hw_sc0_finish.md`, `frontend/src/jjtl/executor/__tests__/source-ref-member-access.test.ts`, `frontend/src/jjtl/executor/executor.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `19877ff1c` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11496 tests in 401 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: passato — chat, unattended: JjTL executor fix (attribute read through source __ref) and docs only, no UI file; all gates green
**Notes**: Rollback tag `pre-hw-jjtl` on `7fc04bb7a` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1302/result.json`.
**Prompt document name**: 2026-10-21 13:02

## 2026-10-21 — feat: hw demonstrator S-D, route A, the Verilog target and the hw-cpu testbench
**Prompt**: P-2026-10-21-1340, finish of P-2026-10-21-1300 after its AM-8 ceiling: slice S-D of the hw demonstrator plan §10.1, the Verilog target, genTemplates cpu and tb on HwDesign, committed expected cpu.v and tb.v, the regenerated .jjodel, verilator --lint-only once, gates, commit
**Files touched**: code 671dc5638: frontend/src/codegen/target/verilog/access.ts (new), frontend/src/codegen/engine/generate.ts, frontend/src/codegen/examples/hw-cpu/hw-cpu.json, frontend/src/codegen/examples/hw-cpu/expected/cpu.v (new), frontend/src/codegen/examples/hw-cpu/expected/tb.v (new), frontend/public/examples/hw/hw-cpu.jjodel, frontend/src/codegen/examples/hw-cpu/__tests__/hw-cpu.verilog.test.ts (new), frontend/src/codegen/examples/__tests__/importable.test.ts; Status lines of the 1300 and 1340 prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Continues P-2026-10-21-1300 from its handoff.md. Eight code files, two undeclared: hw-cpu.verilog.test.ts (8 tests) and importable.test.ts (JS oracle only on a spec with a main template). Gates, lint, five killed mutants in the 671dc5638 body. Lint: default exit 1, one WIDTHEXPAND cpu.v:125; -Wno-WIDTH exit 0. 1300's one-off sim: 171/171 trace lines equal. Template sources stay uncommitted in the lane scratch: the DOVE names no home.
**Prompt document name**: 2026-10-21 13:40

## 2026-10-21 — ticket: codegen probe: checkable() now treats hw-cpu as a JS example
**Ticket**: `frontend/scripts/probe/codegen-examples.ts:65` `checkable` holds for any example with a scenario and `genTemplates`; since S-D (671dc5638) hw-cpu has both, so the probe would run JavaScript Generate, Run and Check on its Verilog templates. Needs the predicate `importable.test.ts` now uses: the spec has a `main` template.
**Priority**: medium
**Found in**: P-2026-10-21-1300

## 2026-10-21 — ticket: S-D0 printer: a top-level zext prints a bare select, default verilator lint warns
**Ticket**: The S-D0 printer prints a top-level `zext(8)` as the bare select, so `expected/cpu.v:125` reads `acc <= ir[3:0];` and `verilator --lint-only` without `-Wno-WIDTH` exits 1 on one `%Warning-WIDTHEXPAND`. A size cast (or an explicit zero-extension) would make the generated module lint-clean without the flag; the §7.4 build line passes `-Wno-WIDTH` today.
**Priority**: low
**Found in**: P-2026-10-21-1300

## 2026-10-21 — ticket: CodePanel Run on a Verilog entry runs the text as JavaScript
**Ticket**: `frontend/src/codegen/ui/CodePanel.tsx:276` `canRun` does not look at the entry template's `target`: on a `target: 'verilog'` entry (hw-cpu since 671dc5638) «Run» and «Check» load the generated Verilog in the JavaScript runner. They should be disabled, or routed to a Verilog runner, when the entry is not JavaScript.
**Priority**: medium
**Found in**: P-2026-10-21-1300

## 2026-10-21 — feat: S-G1, the nuXmv .smv exporter, finished after the context ceiling (P-2026-10-21-1341)
**Prompt**: `claude_2026-10-21_1341_prompt_hw_sg1_finish.md`, continuing `claude_2026-10-21_1301_prompt_hw_sg1_smv_exporter.md` from its handoff: goldens, round trip by the simulator on the committed S-B trace, mutation bench, closure of both Prompt-IDs.
**Files touched**: `frontend/src/model/simulation/smvExport.ts`, `…/__tests__/smvExport.test.ts`, `…/__tests__/fixtures/turnstile.smv`, `…/__tests__/fixtures/hw-cpu.smv` (`8e20fd489`, `2f602806c`); the Status lines of the 1301 and 1341 prompts; this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck exit 0; vitest `src/model/simulation src/jjel src/codegen src/model src/jjtl` 3878 passed, 5 skipped, 7 suites red = the §17 jjtl window imports; build exit 0; smvExport.test.ts 9 passed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Continuation of P-2026-10-21-1301 after the AM-8 ceiling. Deviation from the plan: a derived attribute is exported as a DEFINE of its equation (the turnstile's paid), not refused. The round trip found a bug in handoff decision 7: a memory write tested no key on the last cell, so every STA also wrote RAM[15]; fixed in 8e20fd489. Bench: 9 mutations, none survived (body of 2f602806c). nuXmv not installed.
**Prompt document name**: 2026-10-21 13:41

## 2026-10-21 — merge: hw-smv into hw-demo (P-2026-10-21-1414)
**Prompt**: `claude_2026-10-21_1414_prompt_merge_hw-smv.md`, a direct merge by `lane-run merge --direct`, no session: `hw-smv` at `1b6c648fd` into `hw-demo`, merge base `31e277fcd`, 6 commits on the branch side.
**Files touched**: merge `27f4024c1`: 7 files from the branch side (`docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-10-21_1301_prompt_hw_sg1_smv_exporter.md`, `docs/prompts/claude_2026-10-21_1341_prompt_hw_sg1_finish.md`, `frontend/src/model/simulation/__tests__/fixtures/hw-cpu.smv`, `frontend/src/model/simulation/__tests__/fixtures/turnstile.smv`, `frontend/src/model/simulation/__tests__/smvExport.test.ts`, `frontend/src/model/simulation/smvExport.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `27f4024c1` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11513 tests in 403 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: passato — chat, unattended: pure .smv exporter and tests only, no UI file; all gates green
**Notes**: Rollback tag `pre-hw-smv` on `620e0ee00` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1414/result.json`.
**Prompt document name**: 2026-10-21 14:14

## 2026-10-21 — feat: hw demonstrator S-E, the hw-cpu trace compared with Verilator (P-2026-10-21-1430)
**Prompt**: `claude_2026-10-21_1430_prompt_hw_se_verilator_trace.md`: slice S-E of the hw demonstrator plan §10.1 (D5, trace format §7.4): the Verilator oracle script, the `oracle:hw` script, the committed Verilator trace and a stale-proof normal-suite test.
**Files touched**: code `054dd604b`: `frontend/scripts/oracle/hw-cpu-verilator.mjs` (new), `frontend/package.json`, `frontend/src/codegen/examples/hw-cpu/hw-cpu.verilator.trace` (new), `frontend/src/codegen/examples/hw-cpu/__tests__/hw-cpu.verilator.test.ts` (new); the Status line of the 1430 prompt; this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck exit 0; vitest `src/codegen` 26 files, 2103 passed, 5 skipped; `npm run oracle:hw` exit 0, 171 lines, 171 agree; check:scripts PASS; build exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Verilator 5.052. The trace header records the sha256 of cpu.v and tb.v; the test fails if either changes without a new run. Script bench on scratch copies: EX_SUB transfer gives "cycle 27: ACC jjodel 05, verilator 07", DECODE to EX_STA gives "cycle 20: state". Test bench: 5 mutants, each killed by its named test; two appended a comment to cpu.v and tb.v, restored by git checkout. The code commit was amended once, message only, to carry the bench.
**Prompt document name**: 2026-10-21 14:30

## 2026-10-21 — merge: hw-oracle into hw-demo (P-2026-10-21-1521)
**Prompt**: `claude_2026-10-21_1521_prompt_merge_hw-oracle.md`, a direct merge by `lane-run merge --direct`, no session: `hw-oracle` at `d57c4d0de` into `hw-demo`, merge base `a061086d1`, 3 commits on the branch side.
**Files touched**: merge `ebdfefbbf`: 6 files from the branch side (`docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-10-21_1430_prompt_hw_se_verilator_trace.md`, `frontend/package.json`, `frontend/scripts/oracle/hw-cpu-verilator.mjs`, `frontend/src/codegen/examples/hw-cpu/__tests__/hw-cpu.verilator.test.ts`, `frontend/src/codegen/examples/hw-cpu/hw-cpu.verilator.trace`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ebdfefbbf` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11516 tests in 404 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: passato — chat, unattended: oracle script, committed Verilator trace and its test, no UI file; all gates green
**Notes**: Rollback tag `pre-hw-oracle` on `a061086d1` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1521/result.json`.
**Prompt document name**: 2026-10-21 15:21

## 2026-10-21 — feat: S-G2, the structural properties generated from the model (P-2026-10-21-1431)
**Prompt**: `claude_2026-10-21_1431_prompt_hw_sg2_properties.md`: the plan's §10.1 S-G2 entry, items 1 to 6, with the free-ROM variant and the graph check in the exporter; nuXmv neither installed nor run.
**Files touched**: `frontend/src/model/simulation/smvExport.ts`, `…/__tests__/smvExport.test.ts`, `…/__tests__/fixtures/turnstile.smv`, `…/__tests__/fixtures/hw-cpu.smv`, `…/__tests__/fixtures/hw-cpu-free-rom.smv` (new) (`ade77d5a7`); the Status line of the 1431 prompt; this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck exit 0; vitest `src/model/simulation src/codegen` 52 files, 2871 passed, 5 skipped; build exit 0; smvExport.test.ts 17 passed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Properties read the state only: with events, ready_<t> is en_<t> without its event. A named double write stays refused (S-G1); two memory writes leave !(en_t & e1 = e2). FROZENVARs are named <cell>_<feature> (rom_0_init), not rom_k. On the CPU live_DECODE is proved by dec_else, so in the free-ROM export item 4 holds without nuXmv; S-H's per-opcode instances must leave the else out. Bench: 13 mutations, none survived (body of ade77d5a7). nuXmv not installed.
**Prompt document name**: 2026-10-21 14:31

## 2026-10-21 — merge: hw-props into hw-demo (P-2026-10-21-1536)
**Prompt**: `claude_2026-10-21_1536_prompt_merge_hw-props.md`, a direct merge by `lane-run merge --direct`, no session: `hw-props` at `baeb6698b` into `hw-demo`, merge base `a061086d1`, 3 commits on the branch side.
**Files touched**: merge `29086862f`: 7 files from the branch side (`docs/log-inbox/hw-notation.md`, `docs/prompts/claude_2026-10-21_1431_prompt_hw_sg2_properties.md`, `frontend/src/model/simulation/__tests__/fixtures/hw-cpu-free-rom.smv`, `frontend/src/model/simulation/__tests__/fixtures/hw-cpu.smv`, `frontend/src/model/simulation/__tests__/fixtures/turnstile.smv`, `frontend/src/model/simulation/__tests__/smvExport.test.ts`, `frontend/src/model/simulation/smvExport.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `29086862f` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11524 tests in 404 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: passato — chat, unattended: pure .smv exporter properties and tests, no UI file; all gates green
**Notes**: Rollback tag `pre-hw-props` on `db5e53dab` (RC-31). Union: `docs/log-inbox/hw-notation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1536/result.json`.
**Prompt document name**: 2026-10-21 15:36

## 2026-10-21 — feat: S-A2, the viewpoints ISA, Datapath, Control, finished after the context ceiling (P-2026-10-21-1620)
**Prompt**: `claude_2026-10-21_1620_prompt_hw_sa2_finish.md`, continuation of P-2026-10-21-1545 from its `handoff.md`: finish the three IR viewpoints of S-A2 in `build-hw-cpu.ts`, regenerate `hw-cpu.jjodel`, one screenshot per viewpoint, the acceptance criterion of 1545.
**Files touched**: `frontend/scripts/examples/build-hw-cpu.ts`, `frontend/public/examples/hw/hw-cpu.jjodel` (`34a8a7ee7`); `docs/discovery/assets/hw-sa2/*.png`, the Status lines of the 1545 and 1620 prompts, this inbox.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: in attesa — Alfonso: ISA passes; Datapath and Control screenshots unframed, criterion not met
**Notes**: Hard-stop on the time limit. Scope note: the import check lives in `build-hw-cpu.ts` (`verify`), not in `codegen-examples.ts`. Gates: typecheck 0, vitest src/codegen green; check:docs green; build and typecheck:scripts not run. Open: Datapath counts the 25 transparent `ports` arcs as drawn edges; guards `0x0` and `else` overlap; fit after remount does not move the canvas; clipped screenshot untested (last run: Vite timeout). Evidence: `~/.jjodel-lanes/P-2026-10-21-1620/probe-build-hw-cpu.log`.
**Prompt document name**: 2026-10-21 16:20

## 2026-10-21 — ticket: a live viewpoint switch keeps the previous viewpoint's positions
**Ticket**: Switching the exclusive viewpoint from the toolbar on an open model leaves every vertex where the previous viewpoint had it; the `layoutByViewpoint` record of the new one is applied only when the canvas remounts. Measured on the imported hw-cpu (P-2026-10-21-1620, `verify` in `build-hw-cpu.ts`): PC at (40,400) after the switch to Datapath, (480,1000) after close and reopen; FETCH at (40,1720) under Control, (0,2000) after the remount. Cause named by the research: commit 242a82bcd dropped the dependency that made positions follow (R-LAY-18). The closing tab also stores the previous viewpoint's pan under the new key, so the reopened canvas keeps it and the `%` fit did not move it.
**Priority**: high
**Found in**: P-2026-10-21-1620
**Detail**: `docs/discovery/discovery_2026-10-21_jjomsync_incremental.md`

## 2026-10-21 — ticket: object-as-edge handle index is not clamped, React Flow drops the edge
**Ticket**: `assignGeometricHandles` (`irEdgeViews.ts:195-196`) gives each object-as-edge the next free index on its side with no clamp to `MAX_HANDLES_PER_SIDE` (4), unlike `portDistribution.ts:415`. A fifth end on one side gets `right-4`, and React Flow refuses it (error #008): under the first hw-cpu Control layout 8 of 20 transitions were not drawn. S-A2 works around it by layout (at most four ends a side and role).
**Priority**: medium
**Found in**: P-2026-10-21-1620
