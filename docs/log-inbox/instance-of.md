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

## 2026-10-21 — fix: S2 closure, cascade clamp, acceptance probe and assets (P-2026-10-21-0635)
**Prompt**: close S2 after P-2026-10-21-0100 hit the context ceiling: clamp the instance cascade to the viewport, rerun the probe on 3087 with a check on the last cascade item, refresh the screenshots, build and check:docs, stop for the GO, then this entry with two tickets.
**Files touched**: `frontend/src/components/editor-v2/ContextMenu.tsx` (09f63ce6c); `frontend/scripts/probe/onto-s2-instantiate.ts`, `docs/discovery/assets/onto-s2/` onto-s2-cascade-light.png, onto-s2-new-instance-light.png, onto-s2-measures.json (4f1e07953); `docs/log-inbox/instance-of.md` (this entry)
**Outcome**: ⚠️ partial
**Corregge**: 2026-10-21 01:00 P-2026-10-21-0100, continuation of claude_2026-10-21_0040_prompt_onto_s2_instantiate.md
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no (six files, all in the DOVE list: ContextMenu.tsx, the probe, three assets, this inbox)
**Layer Impact Report**: not-required
**Smoke visivo**: fallito (cascade pass: Book, Library, Magazine, Member inside the viewport; new-instance node fail: header `name : Class` unreadable and two of four slot rows visible for book1 and member1, ticket below)
**Notes**: Probe 13/13 PASS, exit 0, page errors []; new S2-1v: vh 900, last item 859..887, unclamped bottom 916. Typecheck 0; vitest editor-v2 3786/3786; build exit 0 (warning: joiner dynamically imported by instantiate.ts and statically elsewhere, no split). Carries 4b156d003 of P-2026-10-21-0100, never logged; its decision (click placement dropped for undo) is in the handoff. Second cause: (c), the node size of a new root. Viewed by C-2026-10-20-1835 (RC-23).
**Prompt document name**: 2026-10-21 06:35

## 2026-10-21 — ticket: a new instance's node is clipped, name and type unreadable
**Ticket**: BLOCKS the merge of oi-s2. A node created for a new instance (pane cascade or class-node «New instance») keeps the Step 2bis default size 280x60, so the header `name : Class` is unreadable and only two of four slot rows show (book1: isbn, genre; member1: name, active). The object diagram must show the instance name and type: size the node from its rows. The sizing lives in `viewpoint/layout`, outside the S2 lane.
**Priority**: high
**Found in**: P-2026-10-21-0635
**Detail**: docs/discovery/assets/onto-s2/onto-s2-new-instance-light.png

## 2026-10-21 — ticket: place a new instance at the click without breaking undo
**Ticket**: the creation menu does not place the new instance at the right click: calling `createVertexForObject` right after `createInstance` added 0 undo entries and Cmd+Z then reverted earlier unrelated edits (the binding write included), so P-2026-10-21-0100 dropped it and the vertex comes from `useJjomSync` Step 2bis, far below the diagram (book1 at 890,9650; member1 at 470,10250). Place it at the click through a layout write path that keeps one undo entry (under `viewpoint/layout`, or S2u).
**Priority**: medium
**Found in**: P-2026-10-21-0100
**Detail**: docs/discovery/assets/onto-s2/onto-s2-measures.json

## 2026-10-21 — fix: size a new instance's node from its rows, ticket (b) closed (P-2026-10-21-0725)
**Prompt**: commit the uncommitted fix of P-2026-10-21-0655 (context ceiling), measure S2-3m against a baseline at 4f1e07953, try gap S2-5 in instantiate.ts only, build, stop for the GO, then this entry.
**Files touched**: `frontend/src/components/editor-v2/hooks/instantiate.ts`, `hooks/__tests__/instantiate.test.ts` (c1a005725); `frontend/scripts/probe/onto-s2-instantiate.ts` (b3e6aacee); `docs/discovery/assets/onto-s2/` three assets (f39138504); `docs/log-inbox/instance-of.md` (this entry)
**Outcome**: ⚠️ partial
**Corregge**: 2026-10-21 06:55 P-2026-10-21-0655, whose session reached the context ceiling with the fix uncommitted
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato — chat, unattended, 1/1 (new-instance screenshot: book1 : Book four rows, member1 : Member two)
**Notes**: Closes ticket (b) for the object-diagram creation paths: nodes 280x138 and 280x102, probe 16/16. Undo S2-3: 1 entry, 1 press in 3/3 runs (was 2 presses, the first empty). S2-3m unchanged over six runs, fix and baseline: +2, +1, 2 presses. Typecheck 0, instantiate.test.ts 15/15, build 0. Probe and assets split in two commits (P13 guard). S2-5 not done: hard stop on the 60-minute limit, ticket (c) below. Detail: ~/.jjodel-lanes/P-2026-10-21-0725/handoff.md.
**Prompt document name**: 2026-10-21 07:25

## 2026-10-21 — ticket: a new instance made from the class diagram keeps 280x60 in the object diagram
**Ticket**: ticket (c), does not block the merge of oi-s2. «New instance» on a class node in the class diagram leaves the instance's node at 280x60 in the object diagram: the view in force hides the instance, so instantiate.ts sizes nothing. WIP (not committed): size it in every exclusive viewpoint that draws it, in instantiate.ts only, plus probe check S2-5o. In its one run S2-3 regressed to 2 presses (cause not measured; suspect the second viewpoint's index build delaying the write past the merge window), and S2-5o read no node: it needs zoom-to-fit after the switch.
**Priority**: medium
**Found in**: P-2026-10-21-0725
**Detail**: ~/.jjodel-lanes/P-2026-10-21-0725/s2-5-wip.diff

## 2026-10-21 — fix: S2u one undo entry per instantiation, tickets (a) and (c) closed (P-2026-10-21-1219)
**Prompt**: close S2u after P-2026-10-21-1121 stopped: revert 13966af7a, explain the second Cmd+Z press, three acceptance runs, undo-inline-edit on the branch and on 9bfc0cc78, build, stop for the GO, then this entry.
**Files touched**: S2u lanes 1016/1041/1121, never logged: reducer.ts, undoGroup.test.ts (55f3bd556); instantiate.ts, instantiate.test.ts (f62d6edb0, 940bc6e55, efe348885); probe (09b06ba24); reducer.ts, undoGroup.test.ts (13966af7a, reverted in 765b9f94f). This lane: probe onto-s2-instantiate.ts (951feff3e, 3d5b3fd8a); docs/discovery/assets/onto-s2/ three assets (a38d2fc4e); this inbox
**Outcome**: ✅ completed
**Corregge**: 2026-10-21 11:21 P-2026-10-21-1121, whose session stopped with S2-4u fixed and the second press unexplained
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no (seven files in this lane, all in the DOVE list: reducer.ts and undoGroup.test.ts by the revert, the probe, three assets, this inbox)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat C-2026-10-20-1835, RC-23 (book1 : Book four rows, member1 : Member two rows)
**Notes**: Closes (a) (S2-2p within 4 px) and (c) (S2-5o) in 3/3 runs, 21/21. Second press: the probe's pane click, whose deselect lands a DEdge.pointedBy entry ~300 ms later; with it +1 entry, 2 presses; without 0 entries, 1 press. Probe now focuses and waits for the store idle. 13966af7a reverted: it did not remove the press. undo-inline-edit 33/33 here and on 9bfc0cc78, identical. Build 0, typecheck 0, 182 tests. Detail: ~/.jjodel-lanes/P-2026-10-21-1219/.
**Prompt document name**: 2026-10-21 12:19

**Ticket** (note, no action): mutant M8 of the 55f3bd556 bench, a legacy push that keeps the group tail, survives: equivalent with one sender, because the tail entry is back on top only after an undo, which clears it.

## 2026-10-21 — ticket: undo outside a group merges shallow and leaves idlookup orphans
**Ticket**: the legacy undo merge (`U.tsx:903`) is shallow: a later delta's `idlookup` patch is dropped from the merged entry, so one Cmd+Z removes an object and leaves its children or vertex in `idlookup` (measured T2 of the S2u discovery). S2u gives exact contents to group entries only. A case: the `DEdge.pointedBy` sync write that a pane click's deselect triggers lands ~300 ms later as an entry of its own, so create, then pane click, then Cmd+Z costs an extra press with no visible effect.
**Priority**: medium
**Found in**: P-2026-10-21-0947
**Detail**: docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md
