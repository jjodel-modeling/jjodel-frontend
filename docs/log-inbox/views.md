# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-02 — fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)
**Prompt**: `claude_2026-10-01_2336_prompt_ir_corner_clip.md`, fast lane, light tier, Phase 1 then Phase 2 in cascade on `~/jjodel-w-irclip` (branch `ir-corner-clip`). The corners of an IR rect symbol on an M1 node (an Activity action drawn as `rect`) were clipped at rest by the wrapper's `overflow: hidden`; the fix lifts the clip for every wrapper that hosts an IR shape. Q1 (one test added to the scope) answered by the chat as recommended.
**Files touched**: Phase 1 `8cd4adb69`: `docs/discovery/discovery_2026-10-01_ir_corner_clip.md`. Code `0070222d8`: `frontend/src/components/editor-v2/nodes/instanceNode.scss` (one rule and its comment), `frontend/src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts` (one test). This commit: the report addendum (section 6) and this entry. The Status line of the prompt file is left at `da eseguire`: the `status-flip` skill is reserved for the user, so the flip is owed to the chat.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `0070222d8`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run src/components/editor-v2` 105 files, 2559 tests, exit 0; `npm run build` exit 0. The one committed test that pinned the old rest state was changed on purpose (see Out-of-scope changes). The four default scenes and the two metamodel tabs 0 px from the before run; a census of 20 nodes finds nothing drawn past the wrapper's box at rest.
**Out-of-scope changes**: yes — `irSelectionRing.test.ts`, one test, not listed in the prompt: `expect(rgb).toEqual(CANVAS)` for an unselected IR node failed once the resting shadow showed (240,244,248 against 241,245,249). Added to the scope by the chat's ratified answer to Q1; the ring tests are untouched, mutation bench 1/1. Every other path is as the prompt listed.
**Layer Impact Report**: not-required (no §3.1 file touched)
**Smoke visivo**: chat (pending), lane probe on 3077, light, DPR 2: before run 49/49, after run 103/103; crops `sips -Z 600` in `frontend/scripts/smoke/_tmp_irclip_crops/` (gitignored): `ic_triptych_<label>_600.png` [before rest | after rest | after selected] per form, `ic_before_triptych_*` the defect, `ic_after_hover_*` the anchors.
**Notes**: Reading confirmed on 19 nodes. Corrections: no M2 IR node exists (IRNodeContent renders only in ObjectNode); radius 7 and up and the Activity action at 14 keep their corners but lost the shadow. irSelectionRing.test.ts pinned the old rest state: stopped with a question, scope added by the chat. Anchors on hover now draw whole (accepted). Report with addendum: docs/discovery/discovery_2026-10-01_ir_corner_clip.md.
**Prompt document name**: 2026-10-01 23:36

**Ticket** (observation, low, not a ticket of its own): the Chromium-laid-out vitest files (`irSelectionRing`, `irCollapsedRender`, `irActivityRender`, `irC2Render`) time out (hook 10 s, test 15 s) when the machine load is above about 25; a gate run in that state reads red without an assertion failing. `lane-run probe` also met a cold-server flake twice ("Failed to fetch dynamically imported module", "Execution context was destroyed"), absorbed by a warm-up in the probe, not in the app.

## 2026-10-02 — merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)
**Prompt**: `claude_2026-10-02_1501_prompt_merge_ir-corner-clip.md`, a merge in a session (`lane-run merge --direct` fell back: a union hunk edits a base section of `docs/log-inbox/views.md`): `ir-corner-clip` at `50d87c3ba` into `alfonso-frontend-jjtl`, merge base `4b9bc5836`, 5 commits on the branch side.
**Files touched**: merge `3db161e62`: 5 files from the branch side (`docs/discovery/discovery_2026-10-01_ir_corner_clip.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-01_2336_prompt_ir_corner_clip.md`, `frontend/src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts`, `frontend/src/components/editor-v2/nodes/instanceNode.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `3db161e62`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6457 in 260 files (the trunk tip's 6457 in 260, the branch adds no test: `irSelectionRing.test.ts` counts 5 on both sides), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 5 files, all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the lane's crops checked before the merge (rect 4 and the derived action as rect: corners whole at rest, resting shadow, rest and selected differ by ring and band only, hover anchors whole); the merge shares no code file with the trunk side
**Notes**: Union in `docs/log-inbox/views.md`: the trunk's preamble, then the branch's entry P-2026-10-01-2336 and its ticket paragraph; the base's 80 entries, folded by `d2eb5fb83` and byte-identical in the log and its archive, not carried back. No rollback tag, pre-merge tip `eaead2d71`. The session started with nvm node v18 first on PATH (trunk tip 277 red there); gates ran on `~/.hermes/node/bin` v26.8.1. The tip then moved by `0be127357`, docs only.
**Prompt document name**: 2026-10-02 15:01

## 2026-09-30 — feat(views): «Color by metaclass» v2, pastel swatches, per-metaclass overrides, reference-aware (P-2026-09-30-2022)
**Prompt**: `claude_2026-09-30_2022_prompt_viewpoint_colors_pastel.md`, Phase 1 and 2 in cascade on `~/jjodel-w-vppastel`, on Alfonso's review of P-2026-09-30-1815: pastel colours; a metaclass dropdown beside the swatches to change a class's colour; the colour chosen from the source and target of the references. Chat decisions 1-4 (RC-25).
**Files touched**: report `f61fc0265`: `docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md`. Code `feefa9214`: `frontend/src/view/viewPoint/metaclassPalette.ts`, its test, `components/editors/viewpoint/properties/ViewpointProperties.tsx`, `properties.scss`, `view/viewElement/view.tsx` (doc comment). This commit: `docs/decisions.md` (R-VP-32..34), this entry and two tickets, the report's addendum, the Status line of the prompt.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 18:15
**Causa**: (a)
**Regressions**: no — on `feefa9214`: typecheck exit 2, 14 errors, the §17 set; vitest 6013 passed, the 9 known files red at import, plus 4 of `criticalZone.test.ts` red only with the lane's `JJODEL_CRITICAL_ZONE_GOAHEAD` set (70/70 unset; ticket below); build exit 0. metaclassPalette 68/68; mutation bench 55/59, the 4 survivors equivalent. Lane probe 3137, light, 60/60.
**Out-of-scope changes**: no — 9 files over three commits, all in the DOVE list
**Layer Impact Report**: not-required (no §3.1 file touched: the resolver's output shape is unchanged, `ObjectNode.tsx` and `IRNodeContent.tsx` are not in the diff)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3137 (light) 60/60: DemoESM 4 connected class pairs, all different fills; override, Reset, Reset all from the panel; toggle off and the four demo scenes byte-identical to `31999a630`; crops `frontend/scripts/smoke/_tmp_vppastel_crops/vpp_after3_*_600.png`
**Notes**: The probe found two panel defects, both fixed before the commit: `.jj-select` padding-bottom 20 px, and a current-swatch outline dropped on focus. The trunk baseline ran on HEAD's four source files, the same code as `31999a630`, then restored (cmp identical). One scratch typecheck output went to `/tmp`, outside the worktree, against the prompt; it was deleted at once. Detail: the report's addendum.
**Prompt document name**: 2026-09-30 20:22

## 2026-09-30 — ticket: colour the edges of a coloured viewpoint by source or target
**Ticket**: Edges are not coloured by «Color by metaclass» (out of scope of P-2026-09-30-2022, decision 4). Cheap to add: the resolver answers per class id, and `UnifiedEdge.tsx:709-712` already applies an inline `stroke` for IR edges. One selector on the source (or target) node's metaclass plus the same inline stroke would do it. Use the border shade (L 55 %), not the pastel fill: L 82-88 on a white canvas reads 1.2-1.9:1.
**Priority**: low
**Found in**: P-2026-09-30-2022
**Detail**: docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md

## 2026-09-30 — ticket: criticalZone.test.ts goes red inside a go-ahead lane
**Ticket**: `frontend/scripts/hooks/__tests__/criticalZone.test.ts` reads the ambient `JJODEL_CRITICAL_ZONE_GOAHEAD`. In a lane launched with `--critical-zone-goahead` (RC-30), 4 of its 70 tests fail («bypass not read», «deny limited to the six files»). With the variable unset they pass 70/70. Measured on `feefa9214`. The tests should clear or set the variable themselves, so the full vitest gate of a go-ahead lane is not red for its environment.
**Priority**: medium
**Found in**: P-2026-09-30-2022

## 2026-10-02 — merge: the trunk into viewpoint-colors-pastel, pastel rows renumbered R-VP-37..39 (P-2026-10-02-1506)
**Prompt**: `claude_2026-10-02_1506_prompt_pastel_trunk_sync.md`, Phase 1 and 2 in cascade on `~/jjodel-w-vppastel` after Alfonso's GO on the pastel colours: merge `alfonso-frontend-jjtl` into the branch (RC-14) and move its rows R-VP-32..34, which collide with the trunk's R-VP-32..36, to the next free ids.
**Files touched**: report `48abe2b94`: `docs/discovery/discovery_2026-10-02_pastel_trunk_sync.md`. Merge `68c3f8251` (`c3a9c9ffd`): `docs/decisions.md` (R-VP-32→37, 33→38, 34→39), `docs/log-inbox/views.md`. Code `25ed824fb`: `metaclassPalette.ts`, its test, `ViewpointProperties.tsx`, `properties.scss`, `view.tsx` (comments, `describe` names). This commit: the addendum, this entry and a ticket, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: no — on `25ed824fb`: typecheck exit 2, the §17 set of 14; vitest 6492 tests, the 9 known files red at import, `traceMonitor.test.ts` 2 red at load 25, 9/9 alone; build exit 0; check:docs 4/4; check:scripts PASS; check:addonly range 7/8 clean, the merge red (194 folded entries, all verbatim in the trunk's archive; ticket below). metaclassPalette 68/68, mutation bench 55/59, the 4 equivalent survivors.
**Out-of-scope changes**: no — 9 files over three commits plus the closure, all in the DOVE list
**Layer Impact Report**: not-required (no §3.1 file in the lane's own diff; the merge carries the trunk's as they are)
**Smoke visivo**: pending — chat; lane probe on 3151 (light) 60/60: the four demo scenes, the off states and the FlowB control 0 px from `c3a9c9ffd`; swatches, override, Reset, Reset all, contrast 10.53-17.48:1; crops `frontend/scripts/smoke/_tmp_vp_sync_crops/vpp_after_*_600.png`
**Notes**: Merged `c3a9c9ffd` by sha (the ref moved by one docs prompt). The views inbox kept the trunk's fold: union of the branch's 3 new entries only. The 2026-09-30 entry still says R-VP-32..34: add-only, this entry is the mapping. ⚠️ for the add-only red only, which the prompt's measure did not foresee; second cause (a). Five recommendations adopted by the session; details in the report's addendum.
**Prompt document name**: 2026-10-02 15:06

## 2026-10-02 — ticket: check:addonly reads a fold-and-rotate as a rewrite through a trunk-into-branch merge
**Ticket**: `d2eb5fb83` folded the inboxes and rotated the log in one commit. `check-addonly.ts` explains an inbox deficit only by the active log's new entries, so `d2eb5fb83` fails its own gate (199) and so does every merge of the trunk into a branch cut before it: `5c9aadb1c` (196), `68c3f8251` (194). Every flagged entry is byte-identical in the archive; nothing is lost. Either accept inbox → archive in one comparison, or fold and rotate in two commits.
**Priority**: medium
**Found in**: P-2026-10-02-1506
**Detail**: docs/discovery/discovery_2026-10-02_pastel_trunk_sync.md

## 2026-10-02 — merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)
**Prompt**: `claude_2026-10-02_1642_prompt_merge_viewpoint-colors-pastel.md`, a direct merge by `lane-run merge --direct`, no session: `viewpoint-colors-pastel` at `8b5bd6de5` into `alfonso-frontend-jjtl`, merge base `c3a9c9ffd`, 9 commits on the branch side.
**Files touched**: merge `abb05cb9f`: 11 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md`, `docs/discovery/discovery_2026-10-02_pastel_trunk_sync.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_2022_prompt_viewpoint_colors_pastel.md`, `docs/prompts/claude_2026-10-02_1506_prompt_pastel_trunk_sync.md`, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`, `frontend/src/components/editors/viewpoint/properties/properties.scss`, and 3 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `abb05cb9f` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6531 tests in 261 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: lane probe 60/60 on the branch (P-2026-10-02-1506), four default scenes 0 px, pastel tests 68/68; worker gates green
**Notes**: Rollback tag `pre-viewpoint-colors-pastel` on `adb5d9731` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-02-1642/result.json`.
**Prompt document name**: 2026-10-02 16:42

## 2026-09-30 — feat(views): edge ends, seven glyphs, Conditional ends, end roles, slice E (P-2026-09-30-1810)
**Prompt**: `claude_2026-09-30_1810_prompt_edge_ends.md`, Phase 1 then 2 in cascade, heavy, on `~/jjodel-w-edgeends` branch `edge-ends` (from `viewpoint-notations` `30f3d8a81`): seven more edge ends, each end a Conditional resolved per instance, a multiplicity and a role per end, the line cut at the glyph's back, the panel grouped with Conditional ends and end labels in Advanced; no notation bound.
**Files touched**: report `77c2f946b` + §9 here: `docs/discovery/discovery_2026-09-30_edge_ends.md`. Code `8f3e7c307`: `viewpoint/ir/{irTypes,irValidate,irCompile,irEdgeViews}.ts`, `edges/edgeEndGlyphs.ts` (new), `edges/UnifiedEdge.tsx`, `utils/edgeUtils.ts`, `viewpoint/authoring/EdgeAuthoringPanel.tsx`, `EditorV2.scss`; tests `irEdgeEnds`, `irEdgeEndsRender`, `edgeEndGlyphs` (new), `irValidate`. Code `462fba92d`: `irCompile.ts`, two tests. This commit: report §9, `docs/decisions.md` (R-EE-1..4), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `462fba92d`: typecheck exit 2, 14 errors, the §17 set; vitest 6255 passed, 0 failed, the 9 known files red at import; build exit 0. Red first on `77c2f946b`: 14 failed, 1 file at import; 9 markup pins taken there stay green. Mutation bench 22/23, the survivor equivalent.
**Out-of-scope changes**: no — 16 files, all in the report's §5 list (Rule 19, flagged there, RC-11); `EditorV2.scss` and `edgeEndGlyphs.ts` named by the report, as the prompt's DOVE asked.
**Layer Impact Report**: produced (report §6, in the Phase 1 commit before the first source edit)
**Smoke visivo**: passato (lane probe on 3093 16/16: 42 fixture links, light and dark, widths 1 and 2; the four demo scenes 0 px from the pre-edit shots) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_edgeends_crops/ee_fixture_w{1,2}_{light,dark}{,_new}_600.png`
**Notes**: Eight questions adopted as recommended, unattended (RC-21/RC-25), rows R-EE-1..4; Q2 (end labels widened to `TextSource | EdgeEndLabels`, R-VP-23 kept) verified by a second agent (RC-27), whose scratch folders in /tmp were removed. `bar` also names a ShapeForm (Q1). Tips stop on the handle's outer edge, as every IR arrow. Detail in the report §0, §9.
**Prompt document name**: 2026-09-30 18:10

## 2026-10-02 — merge: alfonso-frontend-jjtl into edge-ends, slice E synced with the trunk (P-2026-10-02-1505)
**Prompt**: `claude_2026-10-02_1505_prompt_edge_ends_trunk_sync.md`, Phase 1 then 2 in cascade, heavy, on `~/jjodel-w-edgeends` branch `edge-ends`: the trunk into slice E before its merge, both intents kept, gates at baseline (RC-14).
**Files touched**: report `b7d0885e9` + §7 here: `docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md`. Merge `1e1ce1334` of `eaead2d71`, resolved: `edges/UnifiedEdge.tsx`, `viewpoint/ir/irEdgeViews.ts`, `docs/log-inbox/views.md`. Fix `9e1f9fae5`: `edges/UnifiedEdge.tsx`, `viewpoint/ir/__tests__/irEdgeEndsRender.test.ts`; `119046cb2`: the same test file. This entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 2, 14 errors, the §17 set; vitest 6502/6503, 11 files red: the 9 known at import, `irSelectionRing.test.ts` and `traceMonitor.test.ts` green alone (load); build exit 0; `check:scripts` PASS; mutation benches: the fix 9/9, slice E 22/23 (T13 equivalent). `check:addonly` red on the merge only, inherited from `d2eb5fb83` (report §7).
**Out-of-scope changes**: no — the merge, the two code files resolved as the report says, and the fix the report names (Q3) with its tests, in separate `fix:` commits (DOVE).
**Layer Impact Report**: produced (report §4, in the Phase 1 commit; no §3.2 file in any resolution)
**Smoke visivo**: passato (lane probe on 3095, light: base 5/5 on the `c3a9c9ffd` code, after 20/20; the four demo scenes and DemoFlowB as Activity (UML) byte-identical to base, bars 7×120 painted 5×118, every flow on the open arrowhead; slice E's fixture at widths 1 and 2) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_ee_sync_crops/`
**Notes**: Q1-Q3 adopted as recommended (RC-21): `eaead2d71` merged pinned, the trunk moving to `7de984795` meanwhile (the next merge meets only a `views.md` union); `views.md` = the trunk preamble + the slice E entry; the junction trunk takes its own new-end marker. `check:addonly` flags the merge only: 172 entries, all 185 that leave the inboxes verbatim in the log or archive (ticket below). Detail in the report §0, §7.
**Prompt document name**: 2026-10-02 15:05

## 2026-10-02 — ticket: check:addonly refuses a fold and a rotation in one commit, and every trunk merge across it
**Ticket**: `check:addonly` explains an inbox entry that disappears only by the active log of the same commit, never by the archive. The trunk's `d2eb5fb83` (P-2026-10-01-2344) folded the inboxes and rotated the log in one commit, so `npm run check:addonly -- d2eb5fb83` fails on the trunk itself. Every merge of the trunk into a branch that still carries the pre-fold inboxes fails the same way, measured on `1e1ce1334`: 172 entries flagged, all verbatim in the archive. Either the archive joins the inbox pool, or fold and rotation stay two commits.
**Priority**: medium
**Found in**: P-2026-10-02-1505
**Detail**: docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md

## 2026-10-02 — merge: edge-ends takes alfonso-frontend-jjtl, slice E on the trunk before its own merge (P-2026-10-02-1641)
**Prompt**: `claude_2026-10-02_1641_prompt_edge-ends_take_trunk.md`, rendered by `lane-run merge --trunk-into`, full lane on `~/jjodel-w-edgeends` branch `edge-ends`: the trunk `alfonso-frontend-jjtl` at `adb5d9731` into the branch with one `--no-ff` merge, merge base `eaead2d71`, before the branch's own merge into the trunk (RC-14).
**Files touched**: merge `0c221f237`: 18 files from the trunk side (`docs/decisions.md`, two discovery reports, five prompts, `docs/log-inbox/{jjscript,symbol-editor,views}.md`, `nodes/instanceNode.scss`, `authoring/LabelEntryEditor.tsx`, `ir/irCompile.ts`, `ir/irLabelEdit.ts` and three tests), `views.md` resolved by union. This commit: this entry and the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `0c221f237`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6542/6542 in 264 files, 0 failed, the 9 known files red at import (expected: 6496 at `adb5d9731` plus the 46 the branch adds); hooks 344/344; build exit 0; check:docs 4/4; check:scripts and check:addonly PASS.
**Out-of-scope changes**: no — 18 files, above five (RC-11), all from the trunk side, the merge being the prompt's scope; the one hand resolution is `views.md`, by the union of COME 4.
**Layer Impact Report**: not-required (no §3.2 file; `irCompile.ts`, under `viewpoint/ir/`, auto-merged with disjoint hunks, no hand edit)
**Smoke visivo**: passato — chat GO, unattended, on the report and the slice E probes of P-2026-10-02-1505 (20/20); no probe re-run on `0c221f237`; Alfonso in the morning digest.
**Notes**: Union in `views.md`: preamble, the trunk's two entries, the branch's three, verbatim. `decisions.md` auto-merged (R-IRN-38, Serie R-EE): base plus each side's hunk. Trunk count from P-2026-10-02-1642's `vitest-before.json` on `adb5d9731`: `jjodel-release` moved to `abb05cb9f` (pastel, code) mid-lane, its gates running. `merge-tree HEAD abb05cb9f`: 1 conflict, `views.md`, for the merge into the trunk.
**Prompt document name**: 2026-10-02 16:41

## 2026-10-02 — merge: edge-ends into alfonso-frontend-jjtl (P-2026-10-02-1704)
**Prompt**: `claude_2026-10-02_1704_prompt_merge_edge-ends.md`, a direct merge by `lane-run merge --direct`, no session: `edge-ends` at `5cc0522f0` into `alfonso-frontend-jjtl`, merge base `adb5d9731`, 14 commits on the branch side.
**Files touched**: merge `0bcdac22a`: 20 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-30_edge_ends.md`, `docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1810_prompt_edge_ends.md`, `docs/prompts/claude_2026-10-02_1505_prompt_edge_ends_trunk_sync.md`, `docs/prompts/claude_2026-10-02_1641_prompt_edge-ends_take_trunk.md`, `frontend/src/components/editor-v2/EditorV2.scss`, and 12 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0bcdac22a` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6577 tests in 264 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: edge-ends probes 20/20 (P-2026-10-02-1505), trunk-take gates green on 0c221f237 (P-2026-10-02-1641), worker gates green
**Notes**: Rollback tag `pre-edge-ends` on `cdec5e44d` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-02-1704/result.json`.
**Prompt document name**: 2026-10-02 17:04

## 2026-10-02 — fix(editor-v2): IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)
**Prompt**: `claude_2026-10-02_1645_prompt_ir_label_name_refresh.md`, fast lane, light tier, Phase 1 then Phase 2 in cascade on `~/jjodel-w-labelname` (branch `ir-label-name-refresh`). After a double-click rename of an M1 object whose class has no `name` attribute the store held the new name and the IR node kept drawing the old label: the `useIRView` signature carried the slot values but not `dObject.name`. The session was killed once by the Mac sleeping during the docs closure and resumed from the committed state.
**Files touched**: Phase 1 `acf5a9fc3`: `docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md`. Code `7c92ffc2c`: `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`objectSnapshotParts`, additive), `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (the two selectors and one import name), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irObjectSnapshot.test.ts` (new, 11 tests). Docs `8f5102d29`: the report addendum (section 7) and `docs/decisions.md` (R-IRN-39). This commit: this entry and the ticket below. The Status line of the prompt file is left at `da eseguire`: `status-flip` is user-only, so the flip is owed to the chat.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `7c92ffc2c`: typecheck exit 2, 14 errors, the §17 set by file and code; vitest 262 files, 6507 tests, 0 failed, the 9 known files red at import (`window is not defined`); build exit 0; `check:scripts` and `check:addonly` clean. Probe: the name-attribute control (B) follows by +5 s and after the tab round trip as before, and the four demo scenes are 0 px from `adb5d9731`.
**Out-of-scope changes**: no — three code files, all in the prompt's list (`irResolveCore.ts` additive, as the prompt allows). `useIRRowView`, a second selector of `irResolve.ts`, is fixed with the first: the report's Q1, answered by its recommendation, and the probe shows its row stale before and right after.
**Layer Impact Report**: skipped — the §3.1 table lists `viewpoint/ir/`, which holds both files; Phase 1 wrongly said it did not. The §3.2 trigger list names other files, the prompt named these two, and the change writes nothing to the D-layer or the sync layer; no report was written before the diff. The layers it would have named are in section 7.1 of the report.
**Smoke visivo**: passato — lane probe on 3171, light, DPR 2, 1600x1000: before (the two files at `adb5d9731`) 11 pass, 7 fail, the defect on A, C and D; after (`7c92ffc2c`) 21 pass, 1 fail; the one failure is the probe's own two-frame limit on the metaclass rename (stale at about 33 ms, right at the next read). Memo re-runs of the renamed node 0 to 1, of every other node 0 to 0; chat check pending. Crops `sips -Z 600` in `frontend/scripts/smoke/_tmp_labelname_crops/` (gitignored): `ln_<before|after>_{labels_rest,A_after_rename,final}_600.png`.
**Notes**: Q1 to Q4 answered as recommended (row hook fixed too, metaclass term the class's own name, edge-label gap and the stale comment at `useIRFormView.ts:79-82` ticketed). Bench 11/12, then 14/14: an inverted name/initialName fallback survived until a test held both. The hook wiring cannot load in the bench; the probe runs it. Report with addendum: docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md.
**Prompt document name**: 2026-10-02 16:45

**Ticket** (observation, low, not a ticket of its own): a rename of a SUPERCLASS mid-session leaves an inherited view match stale, the metaclass term of `objectSnapshotParts` stops at the class itself (R-IRN-39). Also: three of four `lane-run probe` after runs died at start under a machine load of 131 to 60 (`page.goto` timeout, `Failed to fetch dynamically imported module` twice, `Execution context was destroyed`); the run that passed was at load 14. Same flakes as the corner-clip lane's ticket above.

## 2026-10-02 — ticket: IR edge labels and the form-hook comment after a rename
**Ticket**: an edge view's label (centre, template segment, end label) may take an `intrinsic` name or `metaclassName` (`irCompile.ts` `compileTextSource`), and the decoration memo of `useIRContainment.ts` (deps `[nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep]`) observes no name: whether a rename re-runs it depends on `nodes`/`edges` changing identity, which was NOT measured (the probe scene has no edge view). Measure first with a reference-as-edge and an object-as-edge view carrying an intrinsic name label, then fix in `oaeSlotsSig` or the deps. Also: the comment at `useIRFormView.ts:79-82` says `useIRView` can leave the object's name out of its snapshot; after R-IRN-39 that is no longer true.
**Priority**: medium
**Found in**: P-2026-10-02-1645
**Detail**: docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md

## 2026-10-02 — merge: ir-label-name-refresh into alfonso-frontend-jjtl (P-2026-10-02-2109)
**Prompt**: `claude_2026-10-02_2109_prompt_merge_ir-label-name-refresh.md`, a merge in a session (Lane: full, 2 conflicts measured: `docs/decisions.md`, `docs/log-inbox/views.md`): `ir-label-name-refresh` at `fb567d6a2` into `alfonso-frontend-jjtl`, merge base `adb5d9731`, 6 commits on the branch side.
**Files touched**: merge `fc11b841a`: 7 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-02_1645_prompt_ir_label_name_refresh.md`, `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irObjectSnapshot.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `fc11b841a`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6600 in 266 files (the trunk tip's 6589 in 265 plus the branch's 11, `irObjectSnapshot.test.ts` new), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 7 files, all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended (C-2026-10-01-2349): 3001 answers 200; vite serves the merged `irResolve.ts`, so the merged code compiles on the running server; the behaviour was measured by the branch probe (after 21/22)
**Notes**: Union in `docs/decisions.md` (R-IRN-40, then R-IRN-39) and in `docs/log-inbox/views.md` (the trunk's 11 entries, then the branch's entry, its ticket paragraph and its ticket), markers removed and nothing else: 0 lines removed against either side. Probes 25/25, control R-EE-5 absent. Rollback tag `pre-ir-label-name-refresh` on `79b29a7da` (RC-31), set by lane-run. check:docs printed 5 non-blocking warnings.
**Prompt document name**: 2026-10-02 21:09

## 2026-10-02 — fix(views): notation glyphs out of «Color by metaclass» (P-2026-10-02-2045)
**Prompt**: `claude_2026-10-02_2045_prompt_vp_glyph_nocolor.md`, light tier, Phase 1 and 2 in cascade on `~/jjodel-w-vpglyph`, branch `vp-glyph-nocolor`. Alfonso's «ok» of 2026-10-02: a node a derived notation draws as a glyph (fork and join bars, initial dot, final bull's-eye) keeps its own colours with coloring on. Decision row R-VP-50, amending R-VP-27 on the scope.
**Files touched**: report `353fa49b4`: `docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md`. Code `00b16d998`: `frontend/src/view/viewPoint/metaclassPalette.ts`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`, `frontend/src/view/viewPoint/__tests__/notationGlyph.test.ts` (new), `frontend/src/components/editor-v2/nodes/__tests__/irGlyphNoColor.test.ts` (new). This commit: the report (§8 addendum), `docs/decisions.md` (R-VP-50), this entry and the ticket below, the Status line of the prompt file.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no. Gates on `00b16d998`: typecheck exit 2, 14 errors, the §17 set; vitest 266 files, 6609 of 6609 tests, the known 9 red at import; build exit 0. Tests 28 of 32 red on the code of `1ff8ab314`, then green; mutation bench 14/14. The four default scenes 0 px from the base run.
**Out-of-scope changes**: no — nine files over three commits, above five (RC-11, rule 19), each named in the prompt's DOVE; `IRNodeContent.tsx` was edited for Q5 and reverted, in no commit.
**Layer Impact Report**: produced
**Smoke visivo**: passato (lane probe on 3097, light: base 17/17 shows the defect, after 30/30; crops in `frontend/scripts/smoke/_tmp_vpglyph_crops/`, gitignored; Alfonso's visual GO pending)
**Notes**: Q1-Q4, Q6, Q7 adopted as recommended (RC-21). Q5 (Statechart entry mark keeps the ink) failed on the probe, since metaclassColoringVars rebinds --color-inode-name on the node root, and was reverted: hence partial, ticket below. R-VP-50 because elk-layout-disc holds R-VP-40..49. Temporary node_modules symlink removed at close. Report: docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md.
**Prompt document name**: 2026-10-02 20:45

## 2026-10-02 — ticket: name-ink marks outside a coloured node take its text colour
**Ticket**: With «Color by metaclass» on, `metaclassColoringVars` sets `--color-inode-name` to the node's text colour inline on `.ir-node-content`, so whatever that node draws on the canvas in the name ink follows it. Measured on 3097, light: the entry mark of Statechart (UML)'s Initial and the outside name label of a classic Petri place go from `rgb(15, 23, 42)` to `rgb(0, 0, 0)`. R-VP-30 says outside labels keep their ink. In dark they would be black on the dark canvas (read, not measured). Keeping the ink needs a token that survives the override (rule 28, `styles/tokens/`).
**Priority**: medium
**Found in**: P-2026-10-02-2045
**Detail**: docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md

## 2026-10-02 — merge: vp-glyph-nocolor into alfonso-frontend-jjtl (P-2026-10-02-2330)
**Prompt**: `claude_2026-10-02_2330_prompt_merge_vp-glyph-nocolor.md`, a direct merge by `lane-run merge --direct`, no session: `vp-glyph-nocolor` at `e6bbc9829` into `alfonso-frontend-jjtl`, merge base `1ff8ab314`, 4 commits on the branch side.
**Files touched**: merge `e2e4fbc35`: 9 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-02_2045_prompt_vp_glyph_nocolor.md`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/nodes/__tests__/irGlyphNoColor.test.ts`, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`, `frontend/src/view/viewPoint/__tests__/notationGlyph.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e2e4fbc35` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6695 tests in 268 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat on 3001 (built-in browser, trunk e2e4fbc35): DemoFlowB copy re-derived on Activity (UML), Color by metaclass on: initial dot, fork and join bars and final bulls-eye paint the notation ink rgb(15,23,42), the three Activity nodes take their palette fill rgb(243,203,203) with border rgb(212,69,69); every gate green
**Notes**: Rollback tag `pre-vp-glyph-nocolor-P-2026-10-02-2330` on `8ef9e3c48` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-02-2330/result.json`.
**Prompt document name**: 2026-10-02 23:30

## 2026-10-03 — fix(ir): outside marks of a coloured node keep the notation ink (P-2026-10-02-2356)
**Prompt**: `claude_2026-10-02_2356_prompt_ir_ink_outside.md`, light tier, Phase 1 and 2 in cascade on `~/jjodel-w-inkout`, branch `ir-ink-outside`. Closes the ticket «name-ink marks outside a coloured node take its text colour» (P-2026-10-02-2045, this inbox): with «Color by metaclass» on, the outside labels and the Statechart Initial's entry mark keep the notation ink in light and dark. Questions 1-6 of the report adopted as recommended (RC-21).
**Files touched**: report `770b3ddc9`: `docs/discovery/discovery_2026-10-02_ir_ink_outside.md`. Code `cce1ecfef`: `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/view/viewPoint/metaclassPalette.ts`, `frontend/src/styles/tokens/_colors-light.scss`, `frontend/src/styles/tokens/_colors-dark.scss`, `frontend/src/components/editor-v2/nodes/__tests__/irInkOutside.test.ts`. This commit: the report addendum (§9), R-VP-51 in `docs/decisions.md`, this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-10-02 20:45 (`claude_2026-10-02_2045_prompt_vp_glyph_nocolor.md`, its Q5 left as a ticket)
**Causa**: (c)
**Regressions**: no. Gates on `cce1ecfef`: typecheck exit 2, 14 errors, the §17 set; vitest 269 files, 6711 of 6711 tests, the known 9 red at import; build exit 0. Tests 8 of 16 red first, then green; mutation bench 13/14, the survivor an equivalent mutant. Probe on 3098, light and dark: base 20/20 shows the defect, after 50/50; inside colours and the four default scenes 0 px from `7c9ae4e0d`.
**Out-of-scope changes**: no — nine files over three commits, above five (RC-11, rule 19): the five code files and the four docs files, each named in the prompt's DOVE, taken as the confirmation; `irStyle.ts` not touched (report §4).
**Layer Impact Report**: produced (report §7, `viewpoint/ir/` is in the §3.1 table)
**Smoke visivo**: passato (lane probe 50/50, crops in `frontend/scripts/smoke/_tmp_inkout_crops/`, gitignored; the visual GO of the chat and Alfonso is pending)
**Notes**: The typecheck output went once to `/tmp/x`, against the prompt's no-`/tmp` rule; deleted at once, every later log kept in the gitignored bench folder. The dark rule sits in two stylesheets of the dev page (the token file imported twice); the browser check of the dropped dark token removed both. Report: `docs/discovery/discovery_2026-10-02_ir_ink_outside.md` §9.
**Prompt document name**: 2026-10-02 23:56

## 2026-10-03 — merge: ir-ink-outside into alfonso-frontend-jjtl (P-2026-10-03-0038)
**Prompt**: `claude_2026-10-03_0038_prompt_merge_ir-ink-outside.md`, a direct merge by `lane-run merge --direct`, no session: `ir-ink-outside` at `d5defd00d` into `alfonso-frontend-jjtl`, merge base `7c9ae4e0d`, 4 commits on the branch side.
**Files touched**: merge `a48a8aefa`: 9 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_ir_ink_outside.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-02_2356_prompt_ir_ink_outside.md`, `frontend/src/components/editor-v2/nodes/__tests__/irInkOutside.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/styles/tokens/_colors-dark.scss`, `frontend/src/styles/tokens/_colors-light.scss`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a48a8aefa` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6711 tests in 269 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat on 3001 (built-in browser, trunk a48a8aefa, light), visual GO delegated by Alfonso: DemoPetri copy re-derived on Petri net (classic); with Color by metaclass on the places fill rgb(243,223,203) and the outside labels p1 p2 p3 lock stay rgb(15,23,42), the same as with coloring off; transition labels t1..t3 rgb(100,116,139) both ways; dark checked on the lane crops (labels readable, were black); every gate green
**Notes**: Rollback tag `pre-ir-ink-outside` on `6dc5fdc4b` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0038/result.json`.
**Prompt document name**: 2026-10-03 00:38

## 2026-10-01 — docs: ELK auto-layout quality, measured per notation (P-2026-10-01-2215)
**Prompt**: `claude_2026-10-01_2215_prompt_elk_layout_discovery.md`, Phase 1 only, heavy, on `~/jjodel-w-elklayout` branch `elk-layout-disc`. Verify by measurement why the toolbar auto-layout falls short of commercial-grade drawings: points 1-7 on `elkLayout.ts` and `handleAutoLayout`, variants V0..V5 on real graphs, per-notation profile draft.
**Files touched**: `e83a16d41`: `docs/discovery/discovery_2026-10-01_elk_layout_quality.md` (new). This commit: this entry, one ticket, the prompt's Status line. Nothing under `frontend/src`; probes and crops gitignored (`frontend/scripts/smoke/_tmp_elk_*`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only on `frontend/src` (`git status` clean but for ignored `_tmp_` files); no gate run, no code changed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (Phase 1; prospective reports for F4 and F5 in the report §6)
**Smoke visivo**: non applicabile
**Notes**: Probe via `lane-run probe` on 3216: 87/87, EXIT=0, no page error; node elkjs reproduces the in-app call at 0 px (7/7). ELK's own geometry reaches 0 on every hard metric in 7/7 scenes; fixing ELK's input alone with our router worsens label collisions (Activity 2 → 7 → 5). Fixed-side ports never helped. Seven questions, each with a Recommended line (report §10); decisions D-A..D-C await Alfonso.
**Prompt document name**: 2026-10-01 22:15

## 2026-10-01 — ticket: hidden object-as-edge vertices reach ELK as 180x120 boxes
**Ticket**: `computeElkLayout` (`elkLayout.ts:67`) sends every React Flow node to ELK, including the vertices `irEdgeViews.ts:289` marks `hidden` because their object is drawn as an edge (ControlFlow, Arc, Transition). Measured: 9, 9, 6 and 5 phantom 180x120 children in Flowchart, Activity (UML), Petri net (classic) and Statechart (UML); disconnected, so ELK packs them as components (Statechart's visible drawing changed, 640x568 vs 430x432). Contained children hidden by `irContainment.ts:281` take the same path (not measured). Filter `hidden` nodes in the layout input.
**Priority**: medium
**Found in**: P-2026-10-01-2215
**Detail**: docs/discovery/discovery_2026-10-01_elk_layout_quality.md

## 2026-10-02 — feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)
**Prompt**: `claude_2026-10-01_2215_fase2_elk_layout.md`, Phase 2, heavy, no critical-zone go-ahead. ELK input (real sizes, hidden nodes out, labels, model order off, per-notation profile), ELK routes drawn in session, 8 px snap, Activity bars across the flow (Q7); Alfonso ratified Q1, D-B, Q7, the chat adopted Q2-Q6.
**Files touched**: merge `5c9aadb1c` (trunk `c3a9c9ffd`); docs `ccba4b030`; code `803b84e3a`: `utils/elkLayout.ts`, `utils/__tests__/elkLayout.test.ts` (new), `EditorV2.tsx`, `edges/UnifiedEdge.tsx`, `viewpoint/derive/notations.ts`, `viewpointDerivation.ts`, `__tests__/activityUml.test.ts`, `__tests__/erChen.test.ts`, `nodes/__tests__/nodeSizing.test.ts`. This commit: `docs/decisions.md` (R-VP-37..47), the report's §12, this entry, a ticket, the Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: unknown — typecheck 14, the §17 set; vitest 6487 passed, the 9 known import reds; build exit 0; rest probe 0 px on 7 scenes outside Jodie's animated avatar (same noise baseline against baseline); bench 38/38 plus the renderer mutant. Gestures after a layout other than a drag (reconnect, label edit, segment drag) not exercised.
**Out-of-scope changes**: yes — 9 files (RC-11): the three pinned tests outside the DOVE (`activityUml`, `erChen`, `nodeSizing`: the bar and the `_state` they pin) and the toolbar prop line outside `handleAutoLayout`.
**Layer Impact Report**: not-required (no §3.2 file touched; D-B deferred)
**Smoke visivo**: passato — probe, unattended: 6 of 7 scenes at 0 overlaps, 0 edge-node, 0 label collisions, 0 crossings after a toolbar layout; Petri 2 label-edge; Alfonso's GO pending (RC-23)
**Notes**: Causa (c): Phase 1's V4 placed outside node names across the flow, which the Petri renderer does not; its transition names stay crossed by their arc (report §12.1 Q1). Closes the ticket on hidden object-as-edge vertices (`a2b4e8168`) and, for the toolbar layout, the DemoFlowB guard-label ticket. Merge `5c9aadb1c` inherits `check:addonly` findings of the trunk's `d2eb5fb83` (196 of its 199).
**Prompt document name**: 2026-10-01 22:15

## 2026-10-02 — ticket: Petri net (classic) transition names are crossed by their outgoing arc after the toolbar layout
**Ticket**: Under the left-to-right profile of Petri net (classic) the transition name is painted right of the upright bar and the outgoing arc leaves the bar's right side through it: `t1` and `t2` on DemoPetri after a toolbar auto-layout (2 label-edge collisions, against 3 place names at V0). The label position is the notation's (R-VP-24); moving it above the bar, or the outgoing port off the centre, removes it. The second needs the handle alignment of D-B (critical zone).
**Priority**: medium
**Found in**: P-2026-10-01-2215
**Detail**: docs/discovery/discovery_2026-10-01_elk_layout_quality.md

## 2026-10-03 — merge: elk-layout-disc into alfonso-frontend-jjtl (P-2026-10-03-0126)
**Prompt**: `claude_2026-10-03_0126_prompt_merge_elk-layout-disc.md`, a direct merge by `lane-run merge --direct`, no session: `elk-layout-disc` at `15a17ba08` into `alfonso-frontend-jjtl`, merge base `07bca00e2`, 14 commits on the branch side.
**Files touched**: merge `788570c06`: 16 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-01_elk_layout_quality.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-01_2215_fase2_elk_layout.md`, `docs/prompts/claude_2026-10-01_2215_prompt_elk_layout_discovery.md`, `docs/prompts/claude_2026-10-02_1718_prompt_elk-layout-disc_take_trunk.md`, `docs/prompts/claude_2026-10-03_0050_prompt_elk-layout-disc_take_trunk.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, and 8 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `788570c06` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6794 tests in 271 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat on 3001 (built-in browser, trunk 788570c06) after Alfonso visual GO (2026-10-03 01:25): DemoFlowB copy re-derived on Activity (UML): fork and join bars 120x7 horizontal; toolbar auto-layout runs top-down with ELK, initial at top, merge and decision diamonds on the spine, guard labels [model.count < 2] and >= 2 clear of edges and nodes, fork and join bars across the flow, final at the bottom; no console error; every gate green (vitest 6794, 9 known red at import)
**Notes**: Rollback tag `pre-elk-layout-disc` on `f7131a405` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0126/result.json`.
**Prompt document name**: 2026-10-03 01:26
