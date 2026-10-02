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
