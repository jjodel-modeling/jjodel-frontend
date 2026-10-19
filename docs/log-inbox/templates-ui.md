# log-inbox — lane «templates-ui»

Entries written by the templates-ui lanes on `tplui-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: gallery preview snapshots, lane L-C (P-2026-10-19-1617)
**Prompt**: New snap-gallery.ts capturing one diagram per gallery entry headless (PNG, pixelRatio 2, transparent, variant D on metamodels), run once for the seven entries, legibility measured
**Files touched**: frontend/scripts/library/snap-gallery.ts (new), frontend/public/library/gallery/<id>/1.preview.png ×7 (new), docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (section P-2026-10-19-1617), docs/log-inbox/templates-ui.md, docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 7/7 PNGs, 47-148 KB, 10-15 s per entry warm (38 s cold). Variant D verified by computed style on 5/5 metamodels. Fit scale in 300x136: 16.4-23.1 % for four templates, 39-53 % for the rest; rule proposed (below 25 % render variant C). Negative control refused 7/7, exit 1. Visual check owed to the chat (RC-23). Report section P-2026-10-19-1617.
**Prompt document name**: 2026-10-19 16:17

## 2026-10-19 — discovery: templates, notations, file new, lane L-A (P-2026-10-19-1510)
**Prompt**: Phase 1 read-only discovery for the design handoff: Templates page, File menu, creation paths, offscreen viewpoint snapshot, tokens, catalog content against §2.5, lane split and 3.2 cut
**Files touched**: docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (new), docs/log-inbox/templates-ui.md (new), docs/prompts/claude_2026-10-19_1510_prompt_templates_notations_discovery.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Probe on port 3096, 7/7 entries snapshotted headless: PNG 12-55 KB, html-to-image SVG 1.4-6.8 MB (unusable), 15-27 s per entry. No sealed package on any branch: Notations page, Built-in tab and Basic notation entries proposed out of 3.2 (R-LIB-7). families-persons has no transformation. 8 unattended decisions, 4 awaiting Alfonso (report §9, §10).
**Prompt document name**: 2026-10-19 15:10
