# log-inbox — lane «templates-ui»

Entries written by the templates-ui lanes on `tplui-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: templates page, catalog fields and filters, lane L-B1 (P-2026-10-19-1615)
**Prompt**: Templates page of the handoff §2.2, §2.3, §2.5, §7 within R-LIB-13..17, R-LIB-19, R-LIB-20: catalog level, concepts, callout, preview; header, search, Start here, concept and level chips, sections, cards with preview; level tokens; gallery test
**Files touched**: frontend/src/pages/Templates.tsx, frontend/src/pages/Templates.scss, frontend/src/styles/tokens.css, frontend/src/library/__tests__/gallery.test.ts, frontend/public/library/catalog.json, docs/library/catalog.json, docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (section), docs/discovery/assets/tpl-b1/ (6 PNG), docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Typecheck 0, gallery 62/62, build 0. Headless 1440x900, 0 page errors: chips, AND counts, dashed zeros, empty state, search, Start here focus, Advanced-only ids measured from the DOM (report section P-2026-10-19-1615). No Preview button: no read-only gallery path. Visual check owed to the chat (RC-23). 7 unattended decisions.
**Prompt document name**: 2026-10-19 16:15

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
