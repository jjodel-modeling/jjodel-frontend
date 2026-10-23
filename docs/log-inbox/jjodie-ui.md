# log-inbox — lane «jjodie-ui»

Entries written by the Jjodie panel redesign lanes (front jjodie-ui, branch `jjodie-panel`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — discovery: jjodie panel redesign report from the handoff
**Prompt**: P-2026-10-24-0115, continuation of P-2026-10-24-0020 Phase 1 (stopped at the AM-8 ceiling): close the three open checks (JodieConfig storage, Properties rail positioning, Q7 estimates) and write the discovery report Q1..Q7 with D1..D9 and A1..A4.
**Files touched**: docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md (0a0922975); docs/log-inbox/jjodie-ui.md, docs/prompts/claude_2026-10-24_0115_prompt_jjodie_panel_report_from_handoff.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Docs only, no source read beyond point 1. Rail is fixed at right:0 (viewport), so a docked Jjodie needs the rail offset (D7); dock width on JodieConfig, localStorage per browser profile (D8). D-UI-1 has no row in decisions.md (A4, report only). D1..D9 not yet written as decisions.md rows (outside scope): owed by the project chat.
**Prompt document name**: 2026-10-24 01:15

## 2026-10-24 — feat: jjodie S1a, docked panel with a resize handle
**Prompt**: P-2026-10-24-0135, slice S1a under R-JJD-1: Jjodie as a grid column of `.dashboard-container`, left-edge drag handle 420..760 (default 460), `dockWidth` on `JodieConfig` saved on pointer-up, floating and fullscreen removed, Properties rail offset by a new body variable. Code and gates only; visual check in the probe lane.
**Files touched**: frontend/src/components/Jodie/Jodie.tsx, JodieWindow.tsx, JodieWindow.css, frontend/src/components/editors/properties-with-tree-view.scss, frontend/src/pages/components/Dashboard.tsx, frontend/src/pages/dashboard.scss, frontend/src/styles/tokens/_layout.scss, frontend/src/types/jodie.ts (467e3ec98); docs/log-inbox/jjodie-ui.md, docs/prompts/claude_2026-10-24_0135_prompt_jjodie_s1a_dock.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 8 code files, above the rule-19 five: all 8 are the Q7 S1a row; the pause was not taken (unattended, RC-21). Jodie.tsx changed only for the Cmd+J focus check, which `contains()` lost to the portal. Gates: typecheck exit 0; vitest 409 files pass, the 9 known window-import failures, 11766 tests pass; build ok, chunk-size warning only. Regressions unknown until the S1a probe measures width, handle and rail edge.
**Prompt document name**: 2026-10-24 01:35

**Ticket** (unattended decisions, `ratified as recommended, unattended`, RC-21/RC-25, for the digest): (1) where no dashboard slot exists (pages other than a project) the panel docks to the viewport's right edge, fixed, full height below the app bar; (2) the docked panel is not hidden by the notifications popover (it no longer overlaps it); hide-on-popover still applies to the FAB and the viewport fallback; (3) the header Reset now restores the default dock width 460; (4) the handle is a focusable `role="separator"`, ArrowLeft/ArrowRight step 8 px, saved per key press. For the probe: moving between a project and another page swaps portal and in-place rendering, so the window remounts and an unsent input draft is lost.
