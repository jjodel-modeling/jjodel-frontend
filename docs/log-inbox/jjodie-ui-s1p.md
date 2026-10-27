# log-inbox — lane «jjodie-ui-s1p»

Entries written by the S1a probe lane (front jjodie-ui, branch `jjp-s1p`, merged by the chat into `jjodie-panel`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — probe: jjodie S1a docked panel, DOM measures and header fix
**Prompt**: P-2026-10-24-0210, probe and closure of S1a (R-JJD-1): measure the docked panel from the DOM (width, handle, clamp, persistence, canvas, rail edge, fixed overlaps, fullscreen, closed state, console), run the smoke, fix inside the S1a files if a measure fails.
**Files touched**: frontend/scripts/probe/jjodie-dock.ts (ecb77a0c8); frontend/src/components/Jodie/JodieWindow.css (785e65d19); docs/log-inbox/jjodie-ui-s1p.md, docs/prompts/claude_2026-10-24_0135_prompt_jjodie_s1a_dock.md, docs/prompts/claude_2026-10-24_0210_prompt_jjodie_s1a_probe.md (this commit)
**Outcome**: ⚠️ partial
**Corregge**: 2026-10-24 01:35 (S1a dock, header overflow)
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: fallito (probe 34/35, Quick tip over the dock; npm run smoke green 12/0/3, A5 1/0/0 px)
**Notes**: Probe on 3012, viewport 1600x1000, DemoESM. Fixed: at 460 the header measured 506 px, close button 47 px past the edge (S1a regression, old default 760); now 1584 vs 1600. Open: `.notification-widget.is-tip` (fixed, right 24px, z 1000) covers the dock input; fix is `notification-widget.scss:9`, outside S1a. Gates: typecheck 0 (two earlier silent exit-1 runs, environmental, not reproduced); vitest 411 pass, 9 known; build ok. Crops in ~/.jjodel-lanes/P-2026-10-24-0210/.
**Prompt document name**: 2026-10-24 02:10

**Ticket** (unattended decisions, `ratified as recommended, unattended`, RC-21/RC-25, for the digest): (1) the header overflow counts as a failed closed-state measure (close unreachable by pointer at 460) and is fixed in `JodieWindow.css`: actions, avatar and mode switch keep their width, the title column clips, so the provider selector reads «Configure a pr» at 460 until S1b moves it out; perceptual item, owed to Alfonso's GO (RC-23). (2) The context chip in the header is squeezed to its icon at 460, before and after the fix; left to S1b. Open, awaiting the chat: the Quick tip toast over the dock (Recommended: `right: calc(24px + var(--jj-jodie-dock-width, 0px))` on `.notification-widget`).
