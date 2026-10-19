# log-inbox — lane «templates-ui»

Entries written by the templates-ui lanes on `tplui-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: templates page, catalog fields and filters, lane L-B1 (P-2026-10-19-1615)
**Prompt**: Templates page of the handoff §2.2, §2.3, §2.5, §7 within R-LIB-13..17, R-LIB-19, R-LIB-20: catalog level, concepts, callout, preview; header, search, Start here, concept and level chips, sections, cards with preview; level tokens; gallery test
**Files touched**: frontend/src/pages/Templates.tsx, frontend/src/pages/Templates.scss, frontend/src/styles/tokens.css, frontend/src/library/__tests__/gallery.test.ts, frontend/public/library/catalog.json, docs/library/catalog.json, docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (section), docs/discovery/assets/tpl-b1/ (6 PNG), docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md (Status)
## 2026-10-19 — feat: gallery preview snapshots, lane L-C (P-2026-10-19-1617)
**Prompt**: New snap-gallery.ts capturing one diagram per gallery entry headless (PNG, pixelRatio 2, transparent, variant D on metamodels), run once for the seven entries, legibility measured
**Files touched**: frontend/scripts/library/snap-gallery.ts (new), frontend/public/library/gallery/<id>/1.preview.png ×7 (new), docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (section P-2026-10-19-1617), docs/log-inbox/templates-ui.md, docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md (Status)
## 2026-10-19 — feat: New model dialog, metamodel tab only, lane L-D (P-2026-10-19-1618)
**Prompt**: New model dialog with the «Metamodel in this project» panel only (R-LIB-20), opened by the models section's + New, the rail + and a new OPEN_NEW_MODEL_DIALOG event; createM1 gains an optional name
**Files touched**: frontend/src/components/NewModelDialog/NewModelDialog.tsx (new), frontend/src/components/NewModelDialog/NewModelDialog.scss (new), frontend/src/pages/components/Navbar.tsx, frontend/src/events/registry.ts, frontend/src/components/project/ProjectEditor.tsx, docs/discovery/discovery_2026-10-19_templates_notations_file_new.md, docs/discovery/assets/tpl-d/ (5 PNG), docs/log-inbox/templates-ui.md, docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Typecheck 0, gallery 62/62, build 0. Headless 1440x900, 0 page errors: chips, AND counts, dashed zeros, empty state, search, Start here focus, Advanced-only ids measured from the DOM (report section P-2026-10-19-1615). No Preview button: no read-only gallery path. Visual check owed to the chat (RC-23). 7 unattended decisions.
**Prompt document name**: 2026-10-19 16:15
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
**Notes**: 7/7 PNGs, 47-148 KB, 10-15 s per entry warm (38 s cold). Variant D verified by computed style on 5/5 metamodels. Fit scale in 300x136: 16.4-23.1 % for four templates, 39-53 % for the rest; rule proposed (below 25 % render variant C). Negative control refused 7/7, exit 1. Visual check owed to the chat (RC-23). Report section P-2026-10-19-1617.
**Prompt document name**: 2026-10-19 16:17
**Smoke visivo**: non applicabile (owed to the chat, RC-23; the lane's own probe is in Notes)
**Notes**: Lane probe 20/20 on port 3104 (one, two and no metamodel); visual check owed to the chat (RC-23). Measured: metamodel.models is empty on cloned gallery projects, so counts go by instanceof and the default name by the pool DModel.new checks (a clash becomes «People (1)»). The critical-zone hook did not ask; no LIR. Typecheck and build exit 0. Report §P-2026-10-19-1618.
**Prompt document name**: 2026-10-19 16:18

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
## 2026-10-19 — fix: template previews cropped to the root class, lane L-C2 (P-2026-10-19-1651)
**Prompt**: Templates only: crop the preview to a card-aspect frame at 45 % or more around the root class and its neighbours, no node name cut; rewrite the five template PNGs, examples untouched
**Files touched**: frontend/scripts/library/snap-gallery.ts, frontend/public/library/gallery/{library,shapes,graph,state-machine,families-persons}/1.preview.png (f120bd3cf); docs/discovery/discovery_2026-10-19_templates_notations_file_new.md (section P-2026-10-19-1651), docs/log-inbox/templates-ui.md, docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md (Status)
**Outcome**: ✅ completed
**Corregge**: 2026-10-19 16:17 claude_2026-10-19_1617_prompt_gallery_snapshots.md
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Nine files, all in DOVE. Five templates at 45 % (names 5.9 px), roots Library, Canvas, Graph, StateMachine, Family. Examples sha256 identical before and after. check:scripts PASS, negative control 7/7 refused exit 1. Regressions unknown: the card in the app not checked by the lane. Visual check owed to the chat (RC-23).
**Prompt document name**: 2026-10-19 16:51
**Ticket** (P-2026-10-19-1651): check:docs B is red on this inbox at the branch base `4d683d9c0`, before this lane: the L-B1 (line 9) and L-C (line 12) entries keep only `Prompt` and `Files touched`, cut in the merges into `tpl-int`; four errors (Corregge, Causa absent). Not repaired here: the entries belong to their lanes and the log is add-only; the merging lane restores them from `tpl-b1` and `tpl-c`.
