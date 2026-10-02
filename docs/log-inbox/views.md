# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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
