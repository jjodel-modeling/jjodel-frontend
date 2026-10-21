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
