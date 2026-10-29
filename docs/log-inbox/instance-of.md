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
## 2026-10-20 — chore: UML class and object fixture, run and commit (P-2026-10-20-2330)
**Prompt**: finish P-2026-10-20-2005 in a fresh session: run the never-run draft probe on 3085 with GV_SAVE, fix it until exit 0, add the §7 fallback lines, commit, stop for the GO.
**Files touched**: `frontend/scripts/probe/uml-class-object-fixture.ts` (b2d299f1a); `docs/discovery/assets/uml-class-object/` uml-class-object.json, uml-class-diagram-light.png, uml-object-diagram-light.png (a74520920); `docs/archivio/claude_2026-10-14_uml_class_object_notation.md` §7 (cb6a8bc4c); this inbox; export `~/jjodel-demo-exports/uml/uml-class-object.jjodel` outside the repository
**Outcome**: ✅ completed
**Corregge**: 2026-10-20 20:05 claude_2026-10-20_2005_prompt_uml_class_object_fixture_reissue.md
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no (six files, all in the DOVE list: the probe, three assets, the design §7, this inbox)
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Probe 32 pass 0 fail, 5 runs. Fixes: name slot written per object; O1 detach through `__raw.values`; InstanceValue row by `exists` on a hop; RT-1 accepts " copy"; boxes sized; shots framed (outSteps 2). Hidden Property edges not drawn: 5 edges each viewpoint, no §7 line. Assets split from the probe commit (P13 hook), not one commit as COME 5 said. Run 5 passed the 600 s foreground limit and was moved to background by the harness. Label crowding Borrowing/0..3 cosmetic.
**Prompt document name**: 2026-10-20 23:30

**Ticket** (unverified on the UI path): `syncCreateObject(graphId, classId, x, y, name)` sets `DObject.name` but leaves the `name : EString` slot at its auto value (`Property_0`), so intrinsic labels read the given name and `$name.value` paths read the auto one; the fixture writes the slot itself. Measured in run 1 of P-2026-10-20-2330.

## 2026-10-20 — ticket: IR cannot express four UML notations
**Ticket**: four renderings of the UML viewpoints need IR features that do not exist, and the fixture takes a fallback for each: (1) a vertex label template, so `dune : Book` is one label and not two stacked `top` labels; (2) a multiplicity template or value map on edge end labels, so `l..u` with `-1 -> *` is computed instead of one Association edge view per multiplicity pair; (3) a second `children` compartment on a vertex view (only the first renders), so attributes and operations are apart; (4) a list join in row templates, so all parameters and all slot values show, not the first.
**Priority**: medium
**Found in**: P-2026-10-20-2330
**Detail**: docs/archivio/claude_2026-10-14_uml_class_object_notation.md

## 2026-10-20 — ticket: isKind on a one-step path to a contained value never matches
**Ticket**: in an IR predicate, `isKind('InstanceValue', '$values.values[0]')` on a Slot was false although the value is an InstanceValue (store measured: `instanceof` InstanceValue). The one-step terminal read goes through the lproxy backend and does not return an id string, so `isKindOf` is never called (`irCompile.ts` isKind branch, `typeof target === 'string'`); a navigating hop (`ctx.getRef`) returns the id. Workaround in the fixture: `exists` on `$values.values[0].$instance.value`. A LiteralNull row written with `isKind` stays unreachable.
**Priority**: medium
**Found in**: P-2026-10-20-2330
**Detail**: frontend/scripts/probe/uml-class-object-fixture.ts
