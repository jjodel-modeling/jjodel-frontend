# log-inbox — lane «hw-notation»

Entries written by the hw-notation lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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
