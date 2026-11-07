# log-inbox — lane «graphvertex»

Entries written by the graphvertex lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-20 — fix(editor-v2): graphVertex hides the edges a container encloses, R-GV-18 (P-2026-10-20-1420)
**Prompt**: with `containment.edges: 'hide'`, `suppressChannelEdges` also hides every instanceRef/composition edge between a container that declares hide and an object it encloses (own claim or deeper through `parentOf`), in either direction; channel step and S3 drops kept. Critical zone, go-ahead by Alfonso, Phase 1 waived, LIR first.
**Files touched**: `docs/lir/lir_2026-10-20_gv_enclosed_edges.md` (a94a06f28); `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irContainerLayout.test.ts` (ca92882ed); `docs/log-inbox/graphvertex.md`, `docs/prompts/claude_2026-10-20_1420_prompt_gv_enclosed_edges.md` (closure commit)
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile — the visual check is the chat's, after the merge, on «Jjodel harness» (RC-23); the lane ran none
**Notes**: Requirement (d) was unsatisfiable: the R-GV-4 fixture draws t inside L, so R-GV-18 also hides e2, e4, e5 there; four existing cases had their expected hidden sets widened to that union, every other assertion unchanged (LIR §2). The rule covers every hide container, multi-hop included; a lost claim does not enclose. Bench 6/6 mutants killed, table in ca92882ed. Gates: typecheck 0, vitest ir 1235/1235, build 0.
**Prompt document name**: 2026-10-20 14:20

## 2026-10-20 — merge: gv-enclosed-edges into alfonso-frontend-jjtl (P-2026-10-20-1437)
**Prompt**: `claude_2026-10-20_1437_prompt_merge_gv-enclosed-edges.md`, a direct merge by `lane-run merge --direct`, no session: `gv-enclosed-edges` at `f9251ed60` into `alfonso-frontend-jjtl`, merge base `68fd369ee`, 3 commits on the branch side.
**Files touched**: merge `841230360`: 5 files from the branch side (`docs/lir/lir_2026-10-20_gv_enclosed_edges.md`, `docs/log-inbox/graphvertex.md`, `docs/prompts/claude_2026-10-20_1420_prompt_gv_enclosed_edges.md`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irContainerLayout.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `841230360` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9446 tests in 384 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: BPMN viewpoint of Jjodel harness after merge 841230360: 42 edges (all irobj_ flows), 0 reference edges (was 107 = 42 + 65), 48 nodes; R-GV-18 holds
**Notes**: Rollback tag `pre-gv-enclosed-edges` on `68fd369ee` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-20-1437/result.json`.
**Prompt document name**: 2026-10-20 14:37

## 2026-10-21 — discovery: graphVertex F2 read-only user views, F3 palette click (P-2026-10-21-1926)
**Prompt**: Phase 1 read-only: reproduce F2 (user views read-only) with a probe, trace it to the line, list readers, propose the smallest fix; F3: palette click and drop paths, viewport centre, proposal and tests
**Files touched**: docs/discovery/discovery_2026-10-21_gv_f2_readonly_views_f3_palette_click.md (3d08a5aed), frontend/scripts/probe/gv-f2-f3.ts (8bfa1071b)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: F2 reproduces on 9da5b4048: after an in-page open, not after a page load. Root cause: the scan at reducer.ts:1111-1117 registers every view, user ones included, whether or not the seeded viewpoint exists. Fix: Pointer_View id filter in a pure module, with a test. F3: click creates 0 (measured); proposal reuses the drop path at the viewport centre, unsnapped like the drop. Details in the report.
**Prompt document name**: 2026-10-21 19:26

## 2026-10-23 — fix(F2, F3): read-only user views and palette click at the visible canvas centre (P-2026-10-22-1325)
**Prompt**: Finish Phase 2 of P-2026-10-21-1950 in a fresh session: typecheck F3, unit tests, probe AFTER scenes (card, url, main, bpmn, hull, demo), vitest, build, commit F3, crops for the chat, docs commit
**Files touched**: frontend/src/components/editor-v2/EditorV2.tsx, frontend/src/components/editor-v2/panels/PalettePanel.tsx, frontend/src/components/editor-v2/utils/canvasCentre.ts (ce9e499ad, 5a1faa267); frontend/src/components/editor-v2/utils/__tests__/canvasCentre.test.ts (5a1faa267); frontend/scripts/probe/gv-f2-f3.ts (c98c5be6d, 1bcd4d5cd); F2 in 4da12da92; this inbox and the two prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Eight files, all in the handoff scope. The crop showed the click centred on .editor-v2__canvas, 200 px right of the visible centre: the fixed Properties+Tree overlay covers 408 px. Fix 5a1faa267 subtracts --jj-canvas-right-inset. Probe: click/Enter/Space 1, member 0, offCentre (1,-6) main, (4,4) bpmn, (8,4) hull; stateBare 0, stateInRegion 1; F2 user checks false, map only Pointer_View*; demo identical. Gates: typecheck 0, vitest 4052, build, smoke 12/0/3.
**Prompt document name**: 2026-10-22 13:25

**Decisions** (ratified as recommended, unattended): (1) probe container check on a Region/State scene, since BPMN lanes hold children by reference; (2) demo fixtures have no user views, the F2 demo check is a no-change check; (3) the probe matches palette entries by their label span; (4) commit a94dae98d was amended twice before F2, unpushed; (5) the off-centre bound is half the 16-grid step, not 1 px: the shared drop snaps (drag lands (-4,4) off its cursor, nodes at residue 10,12 mod 16); (6) the hull probe clicks State before Region, which otherwise sits on the centre and takes the drop; (7) the click centres on the canvas less the right overlay inset, the value fitView already reserves. Crops: ~/.jjodel-lanes/P-2026-10-22-1325/crops/.

## 2026-10-23 — ticket: the M1 palette does not offer reference-membership children
**Ticket**: The M1 palette does not offer the children a container holds by reference (a Task into a BPMN lane, whose lanes hold flowNodeRefs): deriveDroppableChildMetaclasses (irInteraction.ts:158) adds only targets of containment refs of drop containers, so the BPMN palette offers Collaboration, Process and LaneSet and no Task; a Task cannot be dropped into a lane either.
**Priority**: medium
**Found in**: P-2026-10-21-1950
