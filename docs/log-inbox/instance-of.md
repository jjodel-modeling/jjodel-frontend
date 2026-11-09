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

## 2026-10-21 — fix: S3a acceptance probe, regression, assets, closing (P-2026-10-21-1636)
**Prompt**: items 4 to 8 of the P-2026-10-21-1600 handoff: the probe onto-s3a-slot-problems.ts (S3-0..S3-7) with M4, regression of undo-inline-edit and onto-s2-instantiate, three assets, this entry, delete the two throwaways.
**Files touched**: S3a lanes 1600/1635, never logged: problems/registry.ts, NodeProblemOverlay.tsx, instantiationToProblems.ts (new), InstantiationProblemSync.tsx (new), problems/__tests__/instantiationToProblems.test.ts (new), EditorV2.tsx, hooks/instantiate.ts, hooks/__tests__/instantiate.test.ts (8b79e63ff). This lane: probe onto-s3a-slot-problems.ts (bb99637b4); docs/discovery/assets/onto-s3a/ three crops and onto-s3a-measures.json, this inbox (docs commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-21 16:00 P-2026-10-21-1600, stopped by the context-ceiling hook (AM-8) during step 3, before any gate
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: no (six files in this lane, all in the DOVE list: the probe, four assets, this inbox; NodeProblemOverlay.tsx mutated for M4 and reverted; the two gitignored throwaways deleted as asked)
**Layer Impact Report**: produced
**Smoke visivo**: passato — three crops read by the session (badge, overlay with Sync slots, five rows); the visual GO stays the chat's (P8)
**Notes**: Probe run 8: 8/8, load 5.20/8.13. undo-inline-edit 33/33 (8.38/8.85), onto-s2-instantiate 21/21 (8.34/32.81), both unchanged. Bench, 32 tests: M1 1 red, M2 2, M3 2; M4 S3-3 red. valueKindFor stays private. S3-2 adds pages by createInstance (no Add attribute gesture). S3-6 duplicate entry ~350 ms after its definingFeature lands, ~1350 ms from the call. Gates of 1635: typecheck 0, 10/10 + 22/22, build 0. Detail: ~/.jjodel-lanes/P-2026-10-21-1636/closing.md
**Prompt document name**: 2026-10-21 16:36

## 2026-10-21 — ticket: an orphan slot's row shows its value with no feature name
**Ticket**: after its Property is deleted, dune's isbn slot renders as the row ` = 978-0441013593`: no feature name and nothing marking it orphan; only the node's badge and the overlay say «Orphan slot». S3b is where orphan rows are drawn.
**Priority**: low
**Found in**: P-2026-10-21-1636
**Detail**: docs/discovery/assets/onto-s3a/onto-s3a-badge-light.png

## 2026-10-21 — ticket: an undo entry with nothing created after a problem-dot click
**Ticket**: under M4 (the overlay's run branch dropped) the user's undo stack grew 4 → 5 between the click on dune's problem dot, then on «Sync slots», and the end of a 6 s wait, with no object created. Origin not measured; a click-born write such as the pointedBy sync of the shallow-merge ticket is the candidate. In the unmutated flow such a write would join the open «Sync slots» group.
**Priority**: low
**Found in**: P-2026-10-21-1636
**Detail**: ~/.jjodel-lanes/P-2026-10-21-1636/closing.md

## 2026-10-25 — fix: S3b ghost and orphan rows, probe, regression, assets (P-2026-10-25-2220)
**Prompt**: S3b Phase 2 closure over P-2026-10-21-1955 (stopped at step 3, nothing committed), P-2026-10-25-2205 (code) and this lane: re-export the library after decision 2, the probe onto-s3b-ghost-rows.ts S3b-0..S3b-5 with M4, regression of S2, S3a and undo-inline-edit on the new export, four crops, this entry.
**Files touched**: 2205 (f454b12b7): hooks/instantiate.ts, hooks/__tests__/instantiate.test.ts, viewpoint/ir/IRNodeContent.tsx, IRRow.tsx, irStyle.ts, scripts/probe/uml-class-object-fixture.ts. This lane: scripts/probe/onto-s3b-ghost-rows.ts (cd69c6243); docs/discovery/assets/onto-s3b/ four crops and onto-s3b-measures.json, this inbox, the Status line of the 2205 prompt (docs commit). Outside the repo: ~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel
**Outcome**: ✅ completed
**Corregge**: 2026-10-21 19:56 P-2026-10-21-1956, never launched, replaced by this lane
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no (twelve files over the two lanes, all in their DOVE lists; IRNodeContent.tsx mutated for M4 and reverted)
**Layer Impact Report**: produced
**Smoke visivo**: passato — four crops read by the session (ghost row, typing, pages = 300, orphan row); the visual GO stays the chat's (P8)
**Notes**: Probe run 4: 6/6, load 2.51/1.78 (run 1 4/6: undo counted from before the double-click, see ticket). M4: S3b-4 red only. onto-s2 21/21, onto-s3a 8/8, undo-inline-edit 33/33, all on the new export. Bench of 2205, 30 tests: M1 6 red, M2 1, M3 1. Gates of 2205: typecheck 0, 30/30, ir and nodes 1455/1455, build 0. Decision 2: instance boxes 300x84..138 manual before, 200x80 unresized now. Detail: ~/.jjodel-lanes/P-2026-10-25-2220/closing.md
**Prompt document name**: 2026-10-25 22:20

**Ticket** (decision 2, measured): the old export carried five manual instance boxes (cityLib, dune, history, nature, alice: 300 wide, 84 to 138 high, isResized true); the new one carries none (all ten 200x80, isResized false), and the rendered box hugs its rows: dune 200x135.5 with four rows, 200x153.7 with the ghost row, which sits inside it and is hit-tested. S2 on the new export measures book1 200x136 and member1 200x99, where it measured 280x138; no S2 check asserted the old size. The orphan row now carries the marker and the tooltip but still no feature name (D7), so the ticket of 2026-10-21 on the nameless orphan row is half closed. The native `title` tooltip is not painted in a headless screenshot: the orphan crop shows the marker, the tooltip text is in onto-s3b-measures.json.

## 2026-10-25 — ticket: opening a ghost row's editor adds an undo entry with nothing created
**Ticket**: the double-click on dune's ghost value moves the user's undo stack 3 → 4 with no idlookup key created, before any text is typed; Enter then adds the materialization's one entry (4 → 5) and one Cmd+Z removes it (5 → 4), so the double-click's entry needs a second Cmd+Z with no visible effect. Same family as the shallow-merge ticket (a click-born selection write landing as an entry of its own); onto-s3b-ghost-rows.ts counts S3b-2's +1 from the open editor and records both lengths.
**Priority**: low
**Found in**: P-2026-10-25-2220
**Detail**: docs/discovery/assets/onto-s3b/onto-s3b-measures.json

## 2026-10-25 — ticket: a ghost row's feature name is cut while its value is typed
**Ticket**: with the editor open, the ghost row of dune's pages reads `pa… = [300]`: the input takes the row's width and the feature name is ellipsized, so the user types without seeing which feature. Measured at 200 px of node width.
**Priority**: low
**Found in**: P-2026-10-25-2220
**Detail**: docs/discovery/assets/onto-s3b/onto-s3b-typing-light.png

## 2026-11-06 — fix: undo groups reconciled with option (c), L1..L2 closed (P-2026-11-06-2257)
**Prompt**: close the undo-groups chain of option (c) (discovery P-2026-11-06-2105, L1 merge P-2026-11-06-2150, L1b deadline and queue P-2026-11-06-2225): five cross-front probes on oi-s2u, each failure rerun on the trunk, this entry, Status flips of 2150 and 2225
**Files touched**: docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md (5b1e2fe41, branch oi-undo-discovery); L1: reducer.ts, undoGroup.test.ts, EditorV2.tsx, instantiate.ts (merge 197ae1fd1); L1b: instantiate.ts, instantiate.test.ts (809d85ce1, 9baae8d88); chat: scripts/smoke/states.ts (19abb1356, trunk 54f38d163); L2: this inbox, the Status lines of the prompts 2150 and 2225
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (states.ts, 19abb1356: the chat's welcome-key fix between L1b's two probe runs, in no lane's DOVE list; ten files across the chain, every other one in its lane's list)
**Layer Impact Report**: produced (discovery §6, 5b1e2fe41, before L1's diff; L1 cited it)
**Smoke visivo**: non applicabile
**Notes**: Gates: typecheck 0, build 0, vitest 58/58 + 40/40 (L1), 60/60 (L1b). Bench: T1 survives, equivalent with one user, accepted; T2, T3, Q1, D1 killed. onto-s2 21/21, S2-3b1 lateSync 0. Probes at 87cf9a392: undo-inline-edit 33/33, s4c 11/11, rf2 15/15, udo exit 0 (no entry from a pane click); new-model-instantiate exit 1, identical on the trunk: not a regression. Load 4.4-113. Detail: ~/.jjodel-lanes/P-2026-11-06-2257/closing.md
**Prompt document name**: 2026-11-06 22:57

**Ticket** (proposed, trunk-side, low): `frontend/scripts/probe/new-model-instantiate.ts` predates the «New model» dialog (6d70d38c1): its setup clicks the Models «+ New» and never presses «Create model», so `model: null`, every path misses and the `vp-*` setup crashes on a disabled viewpoint trigger. Same result on the trunk at ad6da074b.

**Ticket** (proposed, trunk-side, low): `frontend/scripts/probe/templates-mode-restore.ts` seeds the welcome keys itself (:66-67) and lacks `jjodel_welcome_3_1_1_seen`, which `scripts/smoke/states.ts` seeds since 19abb1356 (trunk 54f38d163): on a fresh browser the 3.1.1 WelcomeModal can swallow its first click. Same on the trunk; verified by grep, probe not run.

## 2026-11-07 — fix: undo groups L3..L5 on oi-s3a and oi-s3b, chain closed (P-2026-11-07-0155)
**Prompt**: close the undo-groups chain of option (c) on oi-s3b: L3 merge oi-s2u into oi-s3a (P-2026-11-06-2340), the S3-4 extra-entry diagnosis (P-2026-11-07-0005), the overlay click fix (P-2026-11-07-0040), L4 merge oi-s3a into oi-s3b (P-2026-11-07-0110), L5 probe setup for the visible-only canvas, the R-OI-14/15 wording, this entry, the Status flips of 2340, 0005, 0040, 0110
**Files touched**: L3: instantiate.ts, instantiate.test.ts, this inbox (merge 6b52b905d); 0005: onto-s3a-slot-problems.ts, onto-s2-instantiate.ts (ccb3abd2b); 0040: NodeProblemOverlay.tsx, NodeProblemOverlay.test.ts (72ad1753d), docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md (f7d46e0c9); L4: instantiate.ts, instantiate.test.ts, this inbox (merge f04faba02); L5: onto-s3b-ghost-rows.ts, onto-s3a-slot-problems.ts (23e741a97); docs/decisions.md (R-OI-14, R-OI-15), this inbox, the four Status lines (this docs commit)
**Outcome**: ✅ completed
**Corregge**: 2026-11-06 23:40 (its S3-4 FAIL, remedied by 0005 and 0040; L5's step remedies the setup abort measured by 0005 and L4)
**Causa**: (c)
**Regressions**: unknown
**Out-of-scope changes**: no (twelve files across the chain, each in its lane's DOVE list; the merges bring the other side's files unchanged, as their DOVE allows)
**Layer Impact Report**: not-required (no §3.2 file in L3..L5; option (c)'s report is the reconcile discovery §6, 5b1e2fe41)
**Smoke visivo**: non applicabile
**Notes**: Gates: L3 typecheck 0, vitest 64/64, build 0; 0040 test 6/6 (4 red before), typecheck 0, build 0; L4 typecheck 0, vitest 79/79, build 0. Benches: 0040 each overlay stop killed by its test; 0110 the queue bypass killed by G1 only. L5 probes (1-min load): S3b uml-s3b 6/6 (15.9→12.1), S3a uml-s3b 8/8 (12.5→22.4), S3a default 8/8 (17.5→16.9); S3-4 undo [4,5,4]. Second cause (c): the probes took every node as mounted. Detail: ~/.jjodel-lanes/P-2026-11-07-0155/closing.md
**Prompt document name**: 2026-11-07 01:55

**Ticket** (proposed, low): Enter or Space on a focused button of the problem overlay still bubbles its keydown to the node wrapper's `onKeyDown`, which calls `handleNodeClick` on the selection keys (React Flow `index.mjs:2177-2183`). Whether that writes `isSelected` to the D-layer, and so an undo entry, is not measured (`docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md` §6).

**Ticket** (proposed, trunk-side, low): the trunk's `NodeProblemOverlay.tsx` (59947fc70, :174, :181) stops only mousedown at its root, so a click on one of its actions bubbles to `onNodeClick` and writes the node's selection; with no «Sync slots» there, that is one empty undo step. Read, not measured. A cherry-pick of `72ad1753d` without the «Sync slots» test case would close it (same discovery §3.4, §8 question 2).

**Ticket** (proposed, trunk-side, low, still open from P-2026-11-06-2257): `frontend/scripts/probe/new-model-instantiate.ts` predates the «New model» dialog (6d70d38c1): its setup never presses «Create model», so `model: null` and the `vp-*` setup crashes on a disabled viewpoint trigger.

**Ticket** (proposed, trunk-side, low, still open from P-2026-11-06-2257): `frontend/scripts/probe/templates-mode-restore.ts` seeds the welcome keys itself (:66-67) and lacks `jjodel_welcome_3_1_1_seen`, so on a fresh browser the 3.1.1 WelcomeModal can swallow its first click.

## 2026-11-07 — fix: the right button opens the pane menu, no pan (P-2026-11-07-1235)
**Prompt**: on a trackpad a moving two-finger click on the empty canvas panned and opened no pane menu (R-OI-10); set `panOnDrag={[0, 1]}` in `EditorV2.tsx`, add probe check S2-1m with a red/green bench, regression S3a and undo-inline-edit, a throwaway drag measurement, decision row R-OI-17
**Files touched**: frontend/src/components/editor-v2/EditorV2.tsx (af1230b5d); frontend/scripts/probe/onto-s2-instantiate.ts (5cba3621c); docs/decisions.md (R-OI-17), docs/log-inbox/instance-of.md (this docs commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (one ReactFlow prop; no §3.2 file, no D-layer write path)
**Smoke visivo**: non eseguito (Playwright gestures only, no real trackpad)
**Notes**: Typecheck 0, build 0. S2: [0,1] 22/22; [0,1,2] 21/22, S2-1m red alone (viewport x +3, no menu). S3a default 8/8; undo-inline-edit 33/33. Throwaway: left and middle drag pan, right drag pans only with [0,1,2]; wheel no change and ctrl+wheel zoom to k 2 on both. The first fixed-build throwaway started at load 23.6, above the gate; rerun gated (11.4), same result. No probe or test right-drags. Detail: ~/.jjodel-lanes/P-2026-11-07-1235/closing.md
**Prompt document name**: 2026-11-07 12:35

## 2026-11-07 — fix: instance-of on the multi-tab trunk, per-tab producer and placement (P-2026-11-07-1620)
**Prompt**: P-2026-11-07-1517 (`oi-s3b` takes the trunk at 3.2.0, merge `cbc392c69`) and P-2026-11-07-1620: `InstantiationProblemSync` clears through `acquireProducerMount`; `runInstantiate` places under the tab's layout; on the RC-21 answer (A) `instantiate()` takes the tab's viewpoint for `layoutTargets`, absent the root's
**Files touched**: merge `cbc392c69` (1517); `aad8e74bb`: `EditorV2.tsx` (`runInstantiate` only), `hooks/instantiate.ts`, `hooks/__tests__/instantiate.test.ts`, `problems/InstantiationProblemSync.tsx`, `problems/__tests__/instantiationProducerMounts.test.ts` (new); this commit: this entry, the Status lines of 1517 and 1620
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: unknown
**Out-of-scope changes**: yes (hooks/instantiate.ts and its test, added to DOVE by the RC-21 answer (A))
**Layer Impact Report**: produced
**Smoke visivo**: non eseguito (onto-s2, onto-s3a default, onto-s3b uml-s3b owed: 1-min load 22.9 to 78.5 from 16:59 to 17:19, gate 20, lane window closed)
**Notes**: 1517: cbc392c69 gates green (typecheck, vitest 14,912 passed, hooks 967, build, check:docs); check:addonly red, inherited from trunk 3f7f6f7f4, which rewrote the hw-notation.md entry of 2026-11-05 without a Log-Repair: trailer; declared, ticket below. 1620: typecheck 0, build 0, problems+instantiate+undoGroup 187/187; bench 4 mutants red, the root key in runInstantiate out of unit reach. Two tabs on one model wait for L6: unit tests only. Detail: ~/.jjodel-lanes/P-2026-11-07-1620/bench.txt
**Prompt document name**: 2026-11-07 16:20

**Ticket** (proposed, for the owner of `docs/log-inbox/hw-notation.md`, medium): trunk commit `3f7f6f7f4` rewrites that inbox's entry of 2026-11-05 with no `Log-Repair:` trailer, so `check:addonly` fails on every merge that takes the trunk past it as second parent (`cbc392c69` here). Fix on the trunk: a `Log-Repair:` trailer on a follow-up commit, or a `KNOWN_REPAIRS` entry in `check-addonly.ts`.

**Ticket** (proposed, for the multi-tab front, medium): no probe under `frontend/scripts/probe/` covers the problem producers across tabs (grep for multi-tab, two tabs, `acquireProducerMount`, `ACTIVE_TAB`: exit 1; control: the three onto probes found). The two-tab probes live in `~/.jjodel-lanes/` (`P-2026-11-07-1352/two-tab.mjs`) on two models. Owed with L6: two tabs on one model, close one, the other keeps its badges (four producers); instantiate from a tab whose viewpoint is not the root's.

**Ticket** (proposed, low): a canvas beside a Script tab (`DockManager.openBeside`) never receives `ACTIVE_TAB` (`Dock.handleLayoutChange` reads `dockbox.children[0]` only), so its viewpoint can differ from the root's on today's trunk; inferred from code, not measured. The probe for the root-key mutant of `runInstantiate` can stage it there. The three onto probes are owed on `aad8e74bb`.


**Probe results** (chat, 2026-11-07 18:04, on `4b665664a`, owed by P-2026-11-07-1620 which stopped at the context ceiling): onto-s2-instantiate 22/22 (S2-1m included), onto-s3a-slot-problems 8/8 (default export), onto-s3b-ghost-rows 6/6 (uml-s3b); 1-minute load 20.2 to 15.0; logs in `~/.jjodel-lanes/P-2026-11-07-1620/`.

## 2026-11-07 — merge: oi-s3b into alfonso-frontend-jjtl (P-2026-11-07-1834)
**Prompt**: `claude_2026-11-07_1834_prompt_merge_oi-s3b.md`, a direct merge by `lane-run merge --direct`, no session: `oi-s3b` at `065a1c501` into `alfonso-frontend-jjtl`, merge base `4834b0edb` (tag 3.2.0); `oi-s2u` and `oi-s3a` are contained in `oi-s3b`.
**Files touched**: merge `e5add4d95` (53 files on the branch side, no conflicts); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. The worker's gates were red on two items outside this branch: vitest 1 red, `codegen/textual/__tests__/tolerant.test.ts:270` (a timing bound, 1484 ms against 1000 at load 144; rerun alone on `efd40eb55` at 00:06: 103/103 with `jjelIslands.test.ts`), and check:docs B on the 3.1.2 entry of `multi-tab.md` (fixed by its owner in `d9187549d`). Incoming tests 79/79; typecheck, build, check:addonly, check:agents, check:scripts green.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, GO of 2026-11-07 15:10 on oi-s3b at localhost:3005
**Notes**: Prompt-ID collision: `P-2026-11-07-1834` was also taken in the same second by the merge of `textual-f1e-names` (closed by hand in `e91177c3b`); the two workers shared one lane folder, so its result.json mixes both runs. Rollback tag `pre-oi-s3b` on `f5fc80aaf`. Pushed with the trunk.
**Prompt document name**: 2026-11-07 18:34

## 2026-11-08 — feat: onto binding editor with Detect, probe and bench (P-2026-11-08-0151)
**Prompt**: three lanes of the «Instances of» front in one entry: the discovery of the rail section and the binding declaration (P-2026-11-08-0049), lane B, the binding editor with Detect and one row in Info (P-2026-11-08-0113, cut at its context ceiling), and this continuation: probe, regression, mutants, docs.
**Files touched**: `docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md` (e138a09ca); `model/ontological/bindingDetect.ts` and its test, `editor-v2/onto/OntoBindingModal.tsx` and `.scss`, `editors/Info.tsx` (c55874212); `scripts/probe/onto-binding-editor.ts` (d680fce0d); this inbox and the `Status:` of the three prompts (closure commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (eleven files across three lanes, each declared in its prompt or its rule-19 reply, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe crops b1, b2, b3, b8 in `~/.jjodel-lanes/P-2026-11-08-0151/crops/`, read by the lane; Alfonso's look owed)
**Notes**: Q1..Q8 of discovery §6 adopted as recommended, unattended (RC-21). Own choices: Confirm allowed with checkBindings defects (R-VAL-4), blocked only when the bag does not decode; value kinds editable, not addable (ticket). Undo: Cmd+Z after Confirm drops the key (gone, no empty bag); Cmd+Z after Remove restores it byte-equal. Probe 10/10, s2 22/22 (started at load 21.2, gate 20: breach), s3a 8/8, mutants 3/3 red. Bench, crops: ~/.jjodel-lanes/P-2026-11-08-0151/.
**Prompt document name**: 2026-11-08 01:51

**Ticket** (proposed, low): a row corrected by hand shows the `checkBindings` message with raw ids, «The defining feature is owned by Pointer…_USER_40, the slot metaclass is Pointer…_USER_44», not the class names (crop `b3-row-corrected-by-hand.png`). The message is built in `bindingCheck.ts`, outside lane B's files.

**Ticket** (proposed, low): the `link` record lists the object-only roles (Generalization, General, Abstract flag, Feature type, Default value) as empty rows with no verdict; Detect does not search them (question 3), and the probe's B-2 admits them as such. Hiding them on `link` is a UI choice for Alfonso.

## 2026-11-08 — ticket: value kinds can be edited in the binding editor but not added
**Ticket**: `OntoBindingModal` shows one row pair per `valueKinds` entry that Detect proposed, and offers no way to add one. On a metamodel that is not UML, where Detect proposes nothing, a hand declaration cannot carry `valueKinds`, so the slots it binds cannot create values. Lane B's own choice, declared in its handoff as a limit.
**Priority**: medium
**Found in**: P-2026-11-08-0113
**Detail**: docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md

## 2026-11-08 — feat: «Instances of» rail section, probe, regression, bench (P-2026-11-08-0241)
**Prompt**: two lanes in one entry: lane A of the rail discovery, the «Instances of» section of the M1 rail with drop and click through `runInstantiate` (P-2026-11-08-0212, cut at its context ceiling after the code and the probe run), and this continuation: probe commit, regression, the third mutant, crops, docs.
**Files touched**: `editor-v2/hooks/instantiate.ts` and its test, `panels/PalettePanel.tsx`, `EditorV2.tsx`, `EditorV2.scss` (910558ef4); `scripts/probe/onto-s2-instantiate.ts` (ba69124a9); `docs/decisions.md` R-OI-18, this inbox, the `Status:` of the two prompts (closure commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (ten files across two lanes, each declared in discovery §5 lane A or in the prompts, listed above)
**Layer Impact Report**: produced
**Smoke visivo**: passato (crops r0, r1, r2 in `~/.jjodel-lanes/P-2026-11-08-0241/crops/`, read by the lane; Alfonso's look owed)
**Notes**: Q1, Q2, Q4, Q5 adopted as recommended, unattended (RC-21). Gates on 910558ef4: typecheck 0, vitest 78/78, build 0. S2 28/28 on uml-s3b; S2-R1/R2 tolerance 8 px × zoom + 1 (16 px grid snap; a 4 px box failed on deltas of 6.5 and 6.8 px); S2-R4 drags on the Petri export, uml-s3b's linguistic block being empty. Regression s3a 8/8, s3b 6/6, binding editor 10/10. Mutants 3/3 red. new-model-instantiate.ts still stale (ticket above). Bench, handoff: ~/.jjodel-lanes/P-2026-11-08-0212/.
**Prompt document name**: 2026-11-08 02:41

**Own choices** (lane A, from its handoff): `ontoRailSections` returns `{sections, signature}` over the `object` and `link` records only, `link` disabled; the drag payload is `{record: name, classifier}` (`ontoDragPayload`), and `ontoDropRequest` re-reads `objectRecord` from the store and re-checks the classifier against fresh `creationOptions`; drop and click share `runOntoPayload`, which calls `runInstantiate`, the drop reaching it through `runOntoPayloadRef` (TDZ); `onDeclareBinding` is passed only in Advanced, so the empty state shows there only; group subtitles «Objects» / «Links»; `OntoBindingModal` mounted in `EditorV2`, the metamodel id taken at the click.

## 2026-11-08 — feat: the viewpoint's level gates the instance surfaces (P-2026-11-08-1726)
**Prompt**: four lanes in one entry: the discovery of levels, class rail and links (P-2026-11-08-1605, cut, continued by -1635 with its probe addendum); lane 1, `_state.ontoLevel` with its control and five gating points (-1658, cut at its context ceiling after the code); this continuation, the probe's level block, regressions, crops, docs (-1726).
**Files touched**: `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` (940959760, 4d736d663); `editor-v2/hooks/instantiate.ts` and its test, `EditorV2.tsx`, `editors/viewpoint/properties/ViewpointProperties.tsx` (a709a12b1); `scripts/probe/onto-s2-instantiate.ts` (b8fbddd72); `docs/decisions.md` R-OI-19, R-OI-20, this entry, the Status of the four prompts (closure commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (twelve files across four lanes, each declared in the prompts, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (five crops in `~/.jjodel-lanes/P-2026-11-08-1726/crops/`, read by the lane; Alfonso's look owed)
**Notes**: Q1, Q2, Q3, Q4, Q6, Q7 adopted as recommended, unattended (RC-21); Q5 asked to Alfonso; Q8 declined. The select's Advanced gate is Redux `advanced`, not `useInterfaceMode` (deviation from discovery §3.4, `BottomBar.tsx:52-58`). Gates: typecheck 0 on a709a12b1, build exit 0. S2 on uml-s3b: 39/39 with no level, 28/28 with the object viewpoint at `instance`; S3a 8/8; binding editor 10/10. Own choices below.
**Prompt document name**: 2026-11-08 17:26

**Own choices** (lane 1, from its handoff): `ontoLevelOf` takes the id from the caller, `undefined` and `null` read `both`, no new `state.viewpoint` reader (R-MT-14), so `<EditorV2/>` with no `viewpointId` (route `App.tsx:152`) never sees a level; `writeOntoLevel` writes nothing on the current value, so `both` on an absent key stays absent; `onDeclareBinding` is `advancedMode && !ontoClassLevel`; drop and click share one guard in `runOntoPayload`, read at the drop through `viewpointIdRef`; labels «Classes and instances», «Classes», «Instances», field «Ontological level», class hook `.wp-onto-level-select`. The S2 suite leaves the side panel closed, the step that does it not identified, so the level block reopens it with the toolbar button.

## 2026-11-08 — feat: the class rail and pane menu from the binding, probe, bench (P-2026-11-08-1822)
**Prompt**: two lanes in one entry: lane 2 of the levels front, the rail's four class-level groups, the container rule and the pane menu «New ▸» (P-2026-11-08-1753, cut at its context ceiling after the code); this continuation, the probe with the three points the handoff left unverified, two regressions, three mutants, the docs.
**Files touched**: `model/ontological/classRail.ts` and its test, `editor-v2/hooks/instantiate.ts`, `editor-v2/hooks/__tests__/classElement.test.ts`, `editor-v2/panels/PalettePanel.tsx`, `editor-v2/EditorV2.tsx` (b8b9bfe30); `scripts/probe/onto-s2-instantiate.ts` (3f399f545); `docs/decisions.md` R-OI-21, R-OI-22, R-OI-23, this entry, the `Status:` of both prompts (this docs commit).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (`hooks/__tests__/classElement.test.ts` is not named by the 1753 prompt, placed under «its tests» so that `instantiate.test.ts` stays untouched, accepted by the 1822 prompt; ten files across two lanes, listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (four crops in `~/.jjodel-lanes/P-2026-11-08-1822/crops/`, read by the lane; Alfonso's look owed)
**Notes**: S2-L5 and S2-L6 amended: they asserted lane 1's empty class tab, Q2 puts the rail and «New ▸» there. Titles read with textContent, CSS uppercases innerText. On uml-s3b S2 52/52, s3a 8/8, binding editor 10/10. Mutants red and reverted, `~/.jjodel-lanes/P-2026-11-08-1822/bench.txt`: M1, M2 in vitest, M3 on S2-L9; port 3005 served them while they ran. «No rootable classes found» left as a design choice (discovery §4). No product change in 1822.
**Prompt document name**: 2026-11-08 18:22

**Ticket** (the three points of the 1753 handoff, measured by P-2026-11-08-1822). (1) Stray node or composition edge: none drawn, a new Class adds one node and no edge (S2-L12), a new attribute no node and no edge (S2-L18); the D-layer gains one vertex and one edge record for each, drawn by no view. (2) The attribute draws as a row of its class, `property1 : [ 0 .. 0 ]` with no visibility and no type, unlike the fixture's rows; in `class-new-attribute.png` the 83 px node clips Book's header with the third row in, not diagnosed. (3) The class view's edge drag Book → Publication creates a Generalization with no picker: specific Book, general Publication, one undo entry, one edge drawn. It is a root object of the model, not in `Book.generalizations`, so it differs from the fixture's composition (`Classifier.generalizations`). The rail item stays disabled (S2-L22).

**Own choices** (lane 2, from its handoff, also in R-OI-21..23): the group titles; an association told apart by the `link` record; the Attributes item needs a selected class and the node menu keeps its own; two qualifying pairs do not guess, the element is a root; a classifier keeps the capital and a property goes through `instanceName`; only the position is written (`slots: null`); the class payload shares `ONTO_DRAG_MIME` with shape `{ classElement: id }`.

## 2026-11-08 — feat: a link drawn between two instances, probe, bench (P-2026-11-08-2041)
**Prompt**: two lanes in one entry: lane 3 of the levels front, S4, the drag between two instances that makes a link (P-2026-11-08-2012, cut at its context ceiling after the code); this continuation, the placement by R-OI-22, the probe, four regressions, the mutants, the docs.
**Files touched**: `editor-v2/EditorV2.tsx`, `editor-v2/hooks/instantiate.ts`, `model/ontological/bindingReader.ts`, `editor-v2/hooks/__tests__/linkInstance.test.ts` (d9b1912f9); `editor-v2/hooks/instantiate.ts` (21cf3a99e); `scripts/probe/onto-s4-links.ts` (2bed6cb5c); `docs/decisions.md` R-OI-24, this entry, the `Status:` of both prompts (this docs commit).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (nine files across two lanes, over the five of RC-11, listed above; the 2012 lane gave its list in chat before the diff)
**Layer Impact Report**: produced
**Smoke visivo**: passato (three crops in `~/.jjodel-lanes/P-2026-11-08-2041/crops/`, read by the lane; Alfonso's look owed)
**Notes**: S4 14/14 on uml-s3b; S2 52/52, s3a 8/8, s3b 6/6, binding editor 10/10. Mutants red and reverted, `~/.jjodel-lanes/P-2026-11-08-2041/bench.txt`: closure, ends swapped, outside the queue in vitest; placement dropped red on S4-3b only, vitest does not see it. Probe faults fixed: `history` also names an EnumerationLiteral; edge ids carry the link id; the drop waits for a target handle. R-OI-25 and R-OI-26 not needed.
**Prompt document name**: 2026-11-08 20:41

**Layer Impact Report, summary** (P-2026-11-08-2012, in chat before the diff). D-layer and JjOM gain a link InstanceSpecification, two Slots and two InstanceValues through `createInstance` in the queue and undo group of `instantiate`, with no new D class or field, no TRANSACTION, no vertex or edge creator. Canvas v2-flow gains one branch in `onConnectEnd`. Sync layer and persistence untouched. `useIRContainment.ts` and `irEdgeViews.ts` unchanged.

**Q6** (measured by the probe). At the first viewport of the object tab no node is mounted: the five instances lie past the canvas, `nature`'s box projects to x 2205 on a canvas 1238 wide. Framed, `nature` mounts. Nothing to fix. It fits rendering only what is visible; that cause was not isolated.

**Ticket** (P-2026-11-08-2041): the popup header reads «Link Reference» for a link too; `M1ReferencePopup.tsx`, out of scope.

**Ticket** (P-2026-11-08-2041): a second link between the same pair is not prevented; UML allows it unless the association is unique, and uniqueness is not read.

**Ticket** (P-2026-11-08-2041): a drag dropped away from a target handle writes nothing and says nothing. Aimed at the nearest handle of any kind, the reversed drag opened no menu. With no wait for the handles under the pointer, the class-tab drag made nothing in two of three runs, one of them aimed at a target handle. Aimed at a target handle after a 400 ms wait, both worked in every run. A source handle under the drop, and handles not yet drawn, are the likely causes, inferred and not isolated.

## 2026-11-08 — fix: class diagram defects, one undo for the generalization, handle reach (P-2026-11-08-2214)
**Prompt**: two lanes in one entry: P-2026-11-08-2146, the three defects of levels lane 2 (empty new attribute, class header clipping, Generalization at the model root) and the handle-reach measure, cut at its context ceiling; this continuation, S2-L28, the probes, the docs.
**Files touched**: `editor-v2/hooks/instantiate.ts`, `editor-v2/EditorV2.tsx`, `editor-v2/hooks/__tests__/classElement.test.ts` (a5f657409); `editor-v2/EditorV2.tsx` (a102c23a5); `scripts/probe/onto-s2-instantiate.ts`, `scripts/probe/onto-s4-links.ts` (4ee0983ac); `docs/decisions.md` R-OI-22 amendment, this entry, the `Status:` of both prompts (this docs commit).
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 17:53
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes (nine files across two lanes, over the five of RC-11, listed above; `EditorV2.tsx` in this lane within the prompt's limit, 16 lines)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (three crops in `~/.jjodel-lanes/P-2026-11-08-2214/crops/`, read by the lane; Alfonso's look owed)
**Notes**: S2 57/57, S4 14/14, binding editor 10/10; vitest 96/96 (classElement, instantiate, undoGroup), typecheck 0, build 0. No unit test for the group: `EditorV2.tsx` does not import in the bench, S2-L28 is its test. The inverse lost in the merge is read at `reducer.ts:1336` and confirmed by the fix, the delta itself was not dumped. Level `both` measured on this tree, not on the base before a5f657409. Logs and crops in `~/.jjodel-lanes/P-2026-11-08-2214/`.
**Prompt document name**: 2026-11-08 22:14

**Root causes and fixes, 2146** (a5f657409). A new attribute was created without defaults: it now gets `String` and multiplicity [1] where the metaclass has those features, and renders `+ property1 : String`. The class header clipped because the node did not grow with a new row: the height now grows, grow-only, in the same undo group (Book 220x82 to 220x100, undo gives 220x82 back). The Generalization took the container chain to the model root: at `class` with a declared `generalization.via` it goes in that feature of its source (`generalizationSlot`).

**S2-L28** (measured, three runs on port 3097). Before the fix one Cmd+Z left the Generalization: 112 objects, 111 expected. Control (a), no click on the edge first: the same failure; the edge click itself writes no undo entry (22 to 22), so the click was not the cause. Control (b), the same drag at level `both`: the same failure (113, 112 expected), so the 2146 owner branch was not the cause. Trace: the undo stack goes 21 to 20 at 250 ms with the object's id still in idlookup, back to 21 at 500 ms with a new entry (three DEdge and the DGraph). The popped entry carried `mergeCounter`, the reducer's legacy merge (`U.objectMergeInPlace`, newer wins). Fix (a102c23a5): at `class` with a declared `generalization.via`, `handleObjectEdgeSelected` opens the reducer's undo group and closes it once the owner's write has landed, 8 s at most. After it: 21 to 20, the id gone, no new entry, S2-L28 PASS; an undo right after the edge click removes it too.

**Handle reach** (S4-11, zoom 1, both tabs). A drop 0, 15 or 30 screen px from the target handle connects (class tab: one Generalization; object tab: the link menu); at 45, 60 or 90 px it does not. Consistent with `connectionRadius={40}` in `EditorV2.tsx`.

## 2026-11-08 — ticket: one undo does not remove an object-as-edge outside level class
**Ticket**: `handleObjectEdgeSelected` (`EditorV2.tsx`) opens an undo group only at level `class` with a declared `generalization.via`. At level `both` on uml-s3b one Cmd+Z after the same drag leaves the object (113 objects, 112 expected), through the reducer's legacy merge of the deferred writes. Other notations share the path and were not measured.
**Priority**: medium
**Found in**: P-2026-11-08-2214
**Detail**: `~/.jjodel-lanes/P-2026-11-08-2214/probe-onto-s2-instantiate.log`

## 2026-11-09 — merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)
**Prompt**: `claude_2026-11-09_0943_prompt_oi-rail_take_trunk.md`: bring the trunk at the explicit sha `733a67020` into `oi-rail` with one merge commit (RC-14), merge base `819c700b5`. The session stopped at step 2 on two code conflicts; chat `C-2026-10-25-2159` then authorized resolving exactly those two files by hand in the merge commit (RC-21) and gave the GO after the visual check.
**Files touched**: merge `a1cb914c0` (322 files from the trunk side); by hand in it: `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx`; by union: `docs/log-inbox/instance-of.md`. This commit: this entry and the Status of the prompt file.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: unknown
**Out-of-scope changes**: no. The merge brings 322 files, listed by `git show --stat a1cb914c0`; by hand only the two code files the chat authorized.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — GO of chat `C-2026-10-25-2159` on this tree, 2026-11-09, step 8, with a split-pane case asked for; this session ran no probe and the GO carries no numbers.
**Notes**: Vitest: 15923 passed, 0 failed tests, the expected count, but exit 1: beyond the 3 import reds, irCollapsedRender and irSelectionRing time out on browser.close() at load above 50. Both pass alone; load is not proven the only cause. Step 5: decisions.md and this inbox compared by script with both parents, not read by eye. Merged 733a67020 as pinned; the trunk moved to 53e89405f with code. Details in the body of a1cb914c0.
**Prompt document name**: 2026-11-09 09:43

**Ticket** (open, to be fixed by the next lane of chat `C-2026-10-25-2159`): in a split, a click on the rail is centred without regard to the pane. `onOntoActivate` and `onClassActivate` (`EditorV2.tsx:3439`, `:3446`) use `getCanvasRightInset()`, where the trunk's `onPaletteActivate` uses `paneRightInset()`: a pane not under the rail centres the click off by the rail's inset. Read on `a1cb914c0`, not measured in the app.

**Ticket** (open, to be fixed by the next lane of chat `C-2026-10-25-2159`): a rail drag can drop on the inactive pane of a split. The `ONTO_DRAG_MIME` path of `onDrop` (`EditorV2.tsx:2838-2841`) returns before the `paneAcceptsDropRef` guard (`:2844`), and the `onDragOver` guard (`:2865`) matches `application/reactflow` only, which a rail drag does not carry (`PalettePanel.tsx:132`, `:137`). Read on `a1cb914c0`, not measured in the app.
