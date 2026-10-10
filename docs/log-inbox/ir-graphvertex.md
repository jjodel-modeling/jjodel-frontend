# log-inbox — lane «ir-graphvertex»

Entries written by the ir-graphvertex lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — docs(discovery): graphVertex for OMG-faithful BPMN lanes (P-2026-10-10-0105)
**Prompt**: `claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, full lane, Phase 1 read-only on `~/jjodel-w-graphvertex` (branch `ir-graphvertex`): falsify the four-capability hypothesis for graphVertex (children channel, arrangement, membership edit, container size), hand-write the OMG BPMN metamodel fragment and its IR, plan Phase 2.
**Files touched**: `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` (new), this inbox file (new); both in this commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Hypothesis reshaped: hull not container; nested objects get no vertex; channel edges drawn; PathExpr cannot fan out; creation owner missing. A draft LIR for the membership slice is in the report §D6 (read-only, no edit). All claims read, none measured. Four helper agents stalled or failed with no output; their topics were read in session. Report and entry in one commit, as the prompt asks (the skills say separate commits).
**Prompt document name**: 2026-10-10 01:05

## 2026-10-10 — feat(ir): graphVertex containment keys, spec addendum and R-GV rows, S0 and S1 (P-2026-10-10-0105)
**Prompt**: Phase 2 GO of `claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md` in the same session, slices S0 and S1 of the report §I, non-visual, after Alfonso's «ratifico tutto» (2026-10-10 08:27): spec addendum and R-GV series; then schema, compile, validate, channel resolution, single visual parent and partition geometry in `viewpoint/ir/`, pure code, hard stop after S1.
**Files touched**: S0 `b7d131729`: `docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md` (new), `docs/decisions.md` (R-GV-1..14, 72 lines added). S1 `c64b9bfaf`: `frontend/src/components/editor-v2/viewpoint/ir/` `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irContainment.ts`, `irPartitions.ts` (new), `__tests__/ir.test.ts`, `__tests__/irValidate.test.ts`, `__tests__/irPartitions.test.ts` (new). This commit: this inbox entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (ten files over two commits, above five (rule 19), each named by the GO's COSA and DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates: tsc 14 = baseline; viewpoint/ir 49 files 1103 tests; full suite 7722 pass, only the 9 known import failures; build exit 0. Invariant test green before the change. Bench 43 mutants: 38 then 43 killed (5 survivors, one test each). LIR not required: §3.2 lists none of these files. Correction: `LValue.setValueAtPosition` auto-moves, a reparent primitive the Phase 1 §D4 missed; recorded in R-GV-8 and spec §6.
**Prompt document name**: 2026-10-10 01:05
