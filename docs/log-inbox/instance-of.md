# log-inbox — lane «instance-of»

Entries written by the instance-of lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-20 — docs: discovery, ontological instantiation in one model (P-2026-10-20-1835)
**Prompt**: Phase 1 read-only discovery of the instance-of front (R-OI-1..5): where the relation is declared, the creation menu, slot synthesis, ghost rows and orphans, conformance O1..O8, links, genericity; Phase 2 plan in slices
**Files touched**: docs/discovery/discovery_2026-10-20_ontological_instantiation.md (ad405b00b); docs/log-inbox/instance-of.md (this entry)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: No product code edited; LIR draft for S2u in report §6. Throwaway probe (gitignored `_tmp_oi_probe.ts`, EXIT=0): bag and annotations kept by project export, dropped by Ecore export; 1 instance + 3 slots = 5 undo entries, 9 Cmd+Z. Context ceiling (RC-51) hit after the report; handoff in the lane folder. GO of chat C-2026-10-20-1835: questions 1,2,3,5,6,7 as recommended (R-OI-6..11); question 4 (S2u, core) awaits Alfonso.
**Prompt document name**: 2026-10-20 18:35

## 2026-10-20 — feat: S1 binding codec, reader and check (P-2026-10-20-2010)
**Prompt**: S1 of the ontological instantiation front: pure layer under frontend/src/model/ontological/ (codec of ontoBindings in the metamodel bag, reader over a read view, check against a MetamodelSketch) with tests; rework before the GO to use conformance (conformsTo, recordsFor, recordFor most specific) instead of exact metaclass match
**Files touched**: frontend/src/model/ontological/bindingCodec.ts, bindingReader.ts, bindingCheck.ts and __tests__/bindingCodec.test.ts, bindingReader.test.ts, bindingCheck.test.ts (bd633a5e0); bindingReader.ts and bindingReader.test.ts again (73d68cea6); docs/log-inbox/instance-of.md (this entry)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Typecheck zero before and after; 50 tests green. Bench, 6 mutants all red: cycle guard, inherited hop, abstract filter, three slot roles, conformance to equality, most-specific to first. Closure order own-first per the prompt, not discovery §8. Slot-role rule lives in the check, not the codec. No importer yet; no build run.
**Prompt document name**: 2026-10-20 20:10
