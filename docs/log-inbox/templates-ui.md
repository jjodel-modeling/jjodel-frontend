# log-inbox — lane «templates-ui»

Entries written by the templates-ui lanes on `tplui-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: dashboard sidebar and quick tip on Templates, lane L-B2 (P-2026-10-19-1616)
**Prompt**: Handoff §2.4 in the R-LIB-20 cut: FILTERS hidden on Templates, active item with aria-current=page and slate-100/600/3px slate-700 bar, no Quick tip on #/templates
**Files touched**: frontend/src/pages/components/LeftBar.tsx, frontend/src/pages/dashboard.scss, frontend/src/components/NotificationWidget/NotificationWidget.tsx, docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (section P-2026-10-19-1616), docs/discovery/assets/tpl-b2/ (2 PNG), docs/log-inbox/templates-ui.md, docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3102, DOM read, 5/5 routes; chat check owed (RC-23)
**Notes**: Typecheck exit 0. Probe with a stubbed tip: tip shown on All projects and Explore, absent on Templates (direct and via sidebar). Active fill rgb(241,245,249), weight 600, inset 3px rgb(51,65,85). Restyle changes All projects, Explore and the FILTERS items (cyan to slate). Regressions unknown: no tests cover the sidebar. Report section P-2026-10-19-1616.
**Prompt document name**: 2026-10-19 16:16

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
