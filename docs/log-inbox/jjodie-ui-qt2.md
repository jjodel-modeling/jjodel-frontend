# log-inbox — lane «jjodie-ui-qt2»

Entries written by the Quick tip follow-up lane (front jjodie-ui, branch `jjp-qt2`, merged by the chat into `jjodie-panel`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — fix: jjodie quick tip clear of the properties rail
**Prompt**: P-2026-10-24-0656: move the Quick tip (`.notification-widget`) left of the Properties rail by reusing the published rail width, on top of the dock offset of P-2026-10-24-0240; add a dock-probe measure that the tip meets neither rail nor dock; one crop.
**Files touched**: frontend/src/components/NotificationWidget/notification-widget.scss, frontend/scripts/probe/jjodie-dock.ts (abdcc0d92); docs/log-inbox/jjodie-ui-qt2.md, docs/prompts/claude_2026-10-24_0656_prompt_jjodie_quicktip_properties.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (jjodie-dock 36/36 on 3010; crop quicktip_rail_dock.png)
**Notes**: Geometry, not stacking: right = 24px + --jj-jodie-dock-width + --jj-rail-width (bare column width, 0px when hidden; no new variable). Measured at 1600x1000, dock 460, rail 400: tip x 396-716, y 749-940; rail 740-1140; dock 1140-1600; no intersection. The probe stubs the tips worker with one tip so the tip shows on every run. Gates: typecheck exit 0; vitest 422 pass, 9 known, 11915 tests; build ok; check:scripts ok.
**Prompt document name**: 2026-10-24 06:56
