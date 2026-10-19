# log-inbox — lane «templates-ui»

Entries written by the templates-ui lanes on `tplui-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-19 — feat: New model dialog, metamodel tab only, lane L-D (P-2026-10-19-1618)
**Prompt**: New model dialog with the «Metamodel in this project» panel only (R-LIB-20), opened by the models section's + New, the rail + and a new OPEN_NEW_MODEL_DIALOG event; createM1 gains an optional name
**Files touched**: frontend/src/components/NewModelDialog/NewModelDialog.tsx (new), frontend/src/components/NewModelDialog/NewModelDialog.scss (new), frontend/src/pages/components/Navbar.tsx, frontend/src/events/registry.ts, frontend/src/components/project/ProjectEditor.tsx, docs/discovery/discovery_2026-10-19_templates_notations_file_new.md, docs/discovery/assets/tpl-d/ (5 PNG), docs/log-inbox/templates-ui.md, docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
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
