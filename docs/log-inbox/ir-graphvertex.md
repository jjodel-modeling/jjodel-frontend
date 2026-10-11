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

## 2026-10-10 — feat(ir): graphVertex partitions, header bands and channel edges rendered, S2 (P-2026-10-10-0105)
**Prompt**: Phase 2 GO of `claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, slice S2 (visual): BPMN fixture as oracle, partitions applied in the presentation pass, header band and vertical label, channel-edge suppression, D-c rows win, graphVertex `visible`, black-box pool, channel-slot memo signature, containment problems; measurements before/after, hard stop.
**Files touched**: `6e22f4a9b` (13): `viewpoint/ir/` irContainment, useIRContainment, IRContainmentHulls, IRNodeContent, irStyle; `nodes/ObjectNode.tsx`; `problems/` registry, containmentToProblems (new); tests ir, shapeRegistry, irContainerLayout (new), irHeaderBandRender (new), containmentToProblems (new). `b7e061436`: `frontend/scripts/probe/bpmn-lanes-fixture.ts` (new). This commit: `docs/discovery/assets/graphvertex-s2/` and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (fourteen code files over two commits, above five (rule 19), each in the GO's DOVE; no CLAUDE.md §3.2 file, no EditorV2.tsx)
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Probe 2/12 before (pre-S2 tree), 12/12 after; hull scenes byte-identical. Gates: tsc 14 = baseline; full suite 7760 pass, 9 known import failures; build 0. Bench 31 mutants: 23/26 then 30/31, E3 equivalent. Spec §5 says the won claim; code hides every claim's channel edge (decision, amendment owed). Lanes dragged by hand snap back; tasks do not follow a pool drag (S3). Correction from P-2026-10-10-0830 noted in chat.
**Prompt document name**: 2026-10-10 01:05

## 2026-10-10 — feat(editor-v2): graphVertex gestures and membership, S3 (P-2026-10-10-0105)
**Prompt**: `claude_2026-10-10_0105_fase2_graphvertex_s3.md`, Phase 2 GO slice S3: LIR first, then membership on drag end (none, forbid, reference, reparent), pool drag carrying its descendants, paired lane resize, creation owner for the palette drop and the connect gesture; BPMN fixture criteria measured on port 3071, light theme; gates, mutation bench, hard stop.
**Files touched**: `d08cf5665`: `docs/lir/lir_2026-10-10_graphvertex_s3.md` (new). `ab22e962a` (5): `viewpoint/ir/` irMembership (new), irContainment; tests irMembership (new), irContainerLayout, ir. `38e7a6006`: `EditorV2.tsx`. `d174cf607`: `frontend/scripts/probe/bpmn-lanes-fixture.ts`. `aa6d4b670`: the LIR §4, `docs/discovery/assets/graphvertex-s3/` (10 files). This commit: this inbox file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes (every file is in the GO's DOVE, seven code files over three commits, above five; but EditorV2 also gains, outside the three named regions, the imports, a containment ref and the slot-write helper next to useIRContainment)
**Layer Impact Report**: produced
**Smoke visivo**: passato
**Notes**: Probe 7/13 before (pre-S3 tree), 13/13 after; hull control scenes unchanged. tsc 14 = baseline; editor-v2 3575; full 7852, 9 known import failures; build 0. Bench 37 mutants: 34 then 37 killed; S2 edge mutants 7/8, E3 equivalent. LIR §4: removal by value, replay-safe drag-end updaters, stale channel edges dropped (narrows R-GV-4, decision owed). Regressions unknown: the replay-safe change covers every canvas drag end, only BPMN and hull measured.
**Prompt document name**: 2026-10-10 01:05

**Ticket** (lane, decision owed): a selected layout container covers its own lanes. React Flow lifts a selected node by 1000 (elevateNodesOnSelect), so after a pool is clicked or dragged its lanes sit under it until it is deselected: a click on a lane selects the pool (measured on the S3 fixture after the pool drag; the fixture now clicks the pane first). Options: elevateNodesOnSelect off on the canvas, or children of a layout container lifted with it.

## 2026-10-10 — ticket: useJjomSync keeps the RF edge of a deleted M1 reference edge
**Ticket**: after a slot edit, useM1ReferenceEdges deletes the stale DVoidEdge (delete-only TRANSACTION, gone from the graph's subElements), but the React Flow edge stays in the canvas state (measured 4.5 s later, BPMN fixture, lane-to-lane move of Ship). The incremental removal of useJjomSync, keyed on rfEdgeCache, does not drop it. Each round trip adds one; hidden or not, they take handle slots. S3 drops them in its presentation pass for declared channels only (LIR §4.3).
**Priority**: medium
**Found in**: P-2026-10-10-0105
**Detail**: docs/lir/lir_2026-10-10_graphvertex_s3.md

## 2026-10-10 — ticket: a state updater replayed by React loops the canvas to the update depth limit
**Ticket**: EditorV2 subscribes to React Flow's nodes (useAutoAnchor's useNodes), and the object-as-edge synthesis returns a new node array on every presentation pass. When an update of lower priority waits in the edges queue (useJjomSync's patch flushed in a frame), React replays the later updaters on each render; one that builds new arrays makes new edges, new nodes, StoreUpdater.setNodes, a synchronous re-render, and so on: 52 replays, then "Maximum update depth exceeded". S3 made its two drag-end updaters replay-safe; the amplifier stays.
**Priority**: medium
**Found in**: P-2026-10-10-0105
**Detail**: docs/lir/lir_2026-10-10_graphvertex_s3.md

## 2026-10-10 — ticket: under the pointer the target ghost handle covers the source ghost
**Ticket**: DynamicHandles draws the target and source ghost of a free slot at the same point. elementFromPoint returns the source ghost before the pointer reaches it and the target ghost once it hovers there; a target handle cannot start a connection (isConnectableStart false), so a press on a free side's ghost started no connection in the S3 fixture until the mousedown was dispatched on the source ghost. Not yet tried by hand.
**Priority**: low
**Found in**: P-2026-10-10-0105
**Detail**: frontend/scripts/probe/bpmn-lanes-fixture.ts

## 2026-10-10 — feat(ir): graphVertex self-framing containers for UML statecharts, S2b (P-2026-10-10-0105)
**Prompt**: Phase 2 GO slice S2b (chat C-2026-10-10-0057; no prompt file under `docs/prompts/` at the time), visual: `containment.layout.frame: 'self'` (a composite state as the box of its substates) and `separator: 'dashed'` (orthogonal regions), a UML statechart fixture on its own port in the light theme, a new addendum section and one R-GV row; BPMN S2/S3 and the S1 hull scenes kept; gates, frame-geometry bench, hard stop.
**Files touched**: `d2f169781` (12): `viewpoint/ir/` irTypes, irCompile, irValidate, irFrame (new), irContainment, useIRContainment, irStyle; tests irFrame (new), irContainerLayout, ir, irValidate, shapeRegistry. `7b0aa3a46`: `frontend/scripts/probe/statechart-fixture.ts` (new). `3858e8cf2`: spec addendum §11, `docs/decisions.md` R-GV-15, `docs/discovery/assets/graphvertex-s2b/` (9 files). This commit: this inbox file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes (`irContainment.ts` is not in the GO's DOVE: the layout pass `useIRContainment` calls lives there, and frames, drag offsets and the selection rule needed it; twelve code files in one commit, above five)
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Statechart 3/7 before (pre-S2b tree), 7/7 after; BPMN S2+S3 25/25 and hull scenes byte-identical on the S2b tree. tsc 14 = baseline; editor-v2 3599; full 7876, 9 known import failures; build 0. Bench 31 mutants, all killed after tests for C6, C7. Fixed in-lane: a collapsed frame jumped to its record; a selected composite hid its regions, and that fix then hid a lane's resize line (S3-7). Regressions unknown: the lift and selection rules reach derived viewpoints, unmeasured.
**Prompt document name**: 2026-10-10 01:05

**Ticket** (lane): the collapse chip of a layout container lies under the edges. The container's z-index is below them, so an edge crossing the chip takes the pointer (measured on the statechart fixture: Running's chip is covered by a transition's 20 px interaction path; the fixture dispatches the click). Options: draw the chip in the header band, or lift the chip out of the node.

## 2026-10-10 — ticket: an IR view cannot hide a reference edge, nor a predicate reach an object's owner
**Ticket**: to tell a region of a two-region state from the only region of a state, the statechart fixture adds UML's `Region.state` and tests `$state.value.$regions.values[1]`: a predicate has no way to climb to the owner (`father`), and the edge that back-reference draws can only be styled clear (`line.color: transparent`), since an edge view has no `visible`. Either key would remove the workaround.
**Priority**: low
**Found in**: P-2026-10-10-0105
**Detail**: docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md

## 2026-10-10 — feat(editor-v2): graphVertex Auto layout across containers, S6 (P-2026-10-10-0105)
**Prompt**: Phase 2 GO slice S6 (chat C-2026-10-10-0057), visual: the toolbar Auto layout respects containment, bottom-up by container (RC-25): free and self-framed containers laid out on their own, a partitions container in one run flowing across its bands, edges at their lowest common container, hidden channel edges out, collapsed containers as one node; no change without containment; BPMN and statechart criteria after one Auto layout, idempotent; controls byte-identical; gates, bench, hard stop.
**Files touched**: `65dc0fe7e`: `frontend/src/components/editor-v2/utils/elkContainers.ts` (new), its test (new), `EditorV2.tsx` (the toolbar Auto layout call site). `f8934e929`: `frontend/scripts/probe/bpmn-lanes-fixture.ts`, `statechart-fixture.ts`. `b89000360`: `docs/discovery/assets/graphvertex-s6/` (16 files). This commit: this inbox file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: BPMN S6 3/6 before, 6/6 after (twice); statechart 1/3 then 3/3. Controls: no-graphVertex view and S1 hull scenes, identical positions; S2+S3 25/25, S2b 7/7, hull screenshots byte-identical. tsc 14; editor-v2 3654; full 7931, 9 known import failures; build 0. Bench 22 mutants, all killed after five tests. Found in-lane: the pool's written size reached the canvas only by chance (records land a dispatch later); fixed by a bounded redraw.
**Prompt document name**: 2026-10-10 01:05

**Ticket** (lane): a band places its nodes by their boxes, not by their outside labels: after Auto layout the start event's «Order received», wider than the event, overhangs the Sales lane's band (s6-bpmn-after-light.png). The ELK runs reserve the label's room between nodes, the band margin does not.

## 2026-10-10 — merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-10-1945)
**Prompt**: `claude_2026-10-10_1945_prompt_ir-graphvertex_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into`, a lane-run session in `~/jjodel-w-graphvertex` on `ir-graphvertex`: RC-14, the trunk at the explicit sha `f753bf0d9` into the branch with one `--no-ff` merge, base `18d9dfb57`, 181 trunk commits against 33 on the branch and this prompt on top; hard stop for the visual GO, then this closure.
**Files touched**: merge `53530dcba`: the 152 files of the trunk side (153 changed since the base; the S4 prompt carries the same Status line on both sides); `docs/decisions.md` auto-merged, no union resolution, no hand edit. This commit: the Status of this prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `53530dcba`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8272 passed in 340 files, 0 failed, the 9 §17 files red at import (expected: trunk tip 8066 in 330 files, measured read-only in `~/jjodel-release`, plus 206 in 10 new files from the branch, 7931 at `111c9d6e2` minus 7725 at the base); hooks 501 (trunk 501, the branch adds none); build exit 0; check:docs 5/5; check:scripts PASS 71 files; check:addonly PASS; check:agents PASS.
**Out-of-scope changes**: no. The merge carries 152 files, above five (RC-11), all the trunk side's.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso's visual GO 2026-10-11 00:03 on dev server 3080, scenes gv-bpmn, gv-statechart, gv-hull; fixtures BPMN 31/31, statechart 7/7
**Notes**: merge-tree exit 0, tree `75a24acd1`, zero conflicts; the index after `--no-commit` writes the same tree. Probes 85 of 85 once, control R-SIM-147 0. decisions.md read end to end: 5917 lines = base 5821 + branch 80 + trunk 16, nothing deleted, no row or heading duplicated by the merge. check:docs is 5/5, not 4/4: Check E is on the trunk. `8f94261cc` (GV_SAVE probe, P-2026-10-10-0105) landed after the merge, outside this lane. No rollback tag.
**Prompt document name**: 2026-10-10 19:45

## 2026-10-11 — merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-11-0011)
**Prompt**: `claude_2026-10-11_0011_prompt_ir-graphvertex_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into`, a lane-run session in `~/jjodel-w-graphvertex` on `ir-graphvertex`: RC-14, the trunk at the explicit sha `dfdef69f1` into the branch with one `--no-ff` merge, base `f753bf0d9`, 34 trunk commits against 38 on the branch and this prompt on top; hard stop for the visual GO, then this closure.
**Files touched**: merge `7523373cb`: the 45 files of the trunk side; `docs/decisions.md` resolved by union (the one hand-resolved hunk), `frontend/src/components/editor-v2/EditorV2.tsx` auto-merged. This commit: the Status of this prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7523373cb`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8386 passed in 344 files, 0 failed, the 9 §17 files red at import (expected: trunk tip 8180 in 334 files, measured read-only in `~/jjodel-release`, minus 286 in the 3 test files the branch modifies, plus 492 in the branch's 13 test files); hooks 603 in 10 files (trunk 603, the branch adds none); build exit 0; check:docs 5/5; check:scripts PASS 80 files; check:addonly PASS.
**Out-of-scope changes**: no. The merge carries 45 files, above five (RC-11), all the trunk side's.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — the chat re-ran the fixtures on `7523373cb`: BPMN 31/31 with S3, S6 and the hull/flat controls, statechart 7/7; Alfonso's visual GO of 2026-10-11 00:03 stands, the trunk delta being codegen only
**Notes**: merge-tree: 1 conflict, docs/decisions.md, resolved by union, R-GEN-16 (trunk) then the R-GV section (branch), verbatim: 5933 lines = base 5837 + 9 + 87, nothing deleted; read in its changed region, the rest shown equal to the base. EditorV2.tsx read end to end: branch tip plus the trunk's 59 Code-pill lines. Probes 41 of 41 once, control R-GEN-17 0. check:docs 5/5, not 4/4: Check E is in the base (73af7bbac). No rollback tag.
**Prompt document name**: 2026-10-11 00:11

## 2026-10-11 — merge: ir-graphvertex into alfonso-frontend-jjtl (P-2026-10-11-0059)
**Prompt**: `claude_2026-10-11_0059_prompt_merge_ir-graphvertex.md`, a direct merge by `lane-run merge --direct`, no session: `ir-graphvertex` at `aa9fd6701` into `alfonso-frontend-jjtl`, merge base `dfdef69f1`, 41 commits on the branch side.
**Files touched**: merge `eb5600dbb`: 110 files from the branch side (`docs/decisions.md`, `docs/discovery/assets/graphvertex-s2/bpmn-after-light-clean.png`, `docs/discovery/assets/graphvertex-s2/bpmn-after-light.png`, `docs/discovery/assets/graphvertex-s2/bpmn-before-light-clean.png`, `docs/discovery/assets/graphvertex-s2/bpmn-before-light.png`, `docs/discovery/assets/graphvertex-s2/demos-before.json`, `docs/discovery/assets/graphvertex-s2/hull-collapsed-after-light.png`, `docs/discovery/assets/graphvertex-s2/hull-collapsed-before-light.png`, and 102 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `eb5600dbb` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8438 tests in 347 files, 9 red at import, hooks 603; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Alfonso visual GO 2026-10-11 00:03 on ir-graphvertex; fixtures re-run on 7523373cb (BPMN 31/31, statechart 7/7)
**Notes**: Rollback tag `pre-ir-graphvertex` on `294a29084` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-0059/result.json`.
**Prompt document name**: 2026-10-11 00:59

## 2026-10-11 — fix(ir): graphVertex frame follows a dragged child on four sides (P-2026-10-11-1156)
**Prompt**: `claude_2026-10-11_1156_prompt_gv_drag_frame.md`, full lane on `~/jjodel-w-gvdrag` (`gv-drag-frame`): probe first (drag4, relayout), the four-side frame, a size set by hand as a floor, the pool record after Auto layout; LIR and question on `canvasToJjom.ts`, go-ahead by Alfonso 14:23 (one function), resumed by hand after the RC-19 hook; spec §12, R-GV-17, hard stop for the visual GO.
**Files touched**: `2d2f75846`: `viewpoint/ir/` irPartitions, irContainment, tests irPartitions, irContainerLayout. `18569bcc3`, `d7b6914a4`: `EditorV2.tsx`, `sync/canvasToJjom.ts`, test syncPositionBatch (new). `7b23cfa74`: that test. `6fdf5be0d`: probes bpmn-lanes-fixture, statechart-fixture. `74ce6c94f`, `879276a2a`: LIR (new), `docs/discovery/assets/graphvertex-drag4/`, spec addendum §12, `docs/decisions.md` R-GV-17. This commit: this inbox file.
**Outcome**: ⚠️ partial
**Corregge**: 2026-10-10 01:05 (`claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, slices S2 and S6)
**Causa**: (c)
**Regressions**: unknown. tsc 14 = the §17 set; full suite 8563, 9 known import failures; build 0; check:docs 5/5; check:scripts 82. Probes base→after: BPMN drag4+relayout+carry 36/55→55/55, statechart 41/52→48/52; S2, S3, S6 (rerun 6/6), S2b 7/7 green; S1 hull shots byte-identical; S6 flat as base. Unmeasured: derived viewpoints.
**Out-of-scope changes**: yes (`canvasToJjom.ts`, granted mid-lane; two temporary worktrees at the base, removed; 13 files and the assets folder over 8 commits, above five)
**Layer Impact Report**: produced
**Smoke visivo**: passato — lane probes on 3121-3124, light theme, `docs/discovery/assets/graphvertex-drag4/`; Alfonso's visual GO pending (RC-23)
**Notes**: Partial: 4 statechart reds are the open ticket below, (a) second. Closes the ticket «Auto layout writes a grown pool's size with its old position» (P-2026-10-11-0040): relayout 4/4. `lane-run ticket` closes only through `--backfill --plan`, which syncs every block to GitHub: not run. Bench: 20/20 on the frame; batch 4/5, B3 not re-run (shell edit of canvasToJjom.ts denied). Detail: `docs/lir/lir_2026-10-11_gv_drag_frame_box_write.md`.
**Prompt document name**: 2026-10-11 11:56

## 2026-10-11 — ticket: regions packed edge to edge cannot grow across their shared border
**Ticket**: R-GV-17 grows a partition against the stack by moving the border with its neighbour, and the neighbour cannot give room its own children need. In the statechart fixture A1 and A2 meet with exactly 16 + 16 px between Waiting and Running's frame, so Fetch dragged 40 px up in Running, or Waiting 40 px down in A1, leaves A2's top gap at −24 and −16 px (4 reds of drag4). The earlier partition keeps its children by rule; whether a pushed partition should carry its children instead is open.
**Priority**: medium
**Found in**: P-2026-10-11-1156
**Detail**: docs/discovery/assets/graphvertex-drag4/statechart-drag4-relayout-statechart-s6-after.json

## 2026-10-11 — ticket: a child dragged out of a none container is framed again after the drop
**Ticket**: with membership `none` (the statechart fixture), the frame stops following a child once the pointer leaves the box it had at rest, so the drag shows the child leaving; the drop is a plain move and the model is untouched, so the child is still a member and the frame, derived from its members, takes it back in at rest (Fetch dropped below Active: Running grows down to it). Measured by SC-fetch-out and SC-waiting-out of drag4.
**Priority**: low
**Found in**: P-2026-10-11-1156
**Detail**: docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md
