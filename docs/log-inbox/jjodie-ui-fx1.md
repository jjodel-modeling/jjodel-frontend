# log-inbox — lane «jjodie-ui-fx1»

Entries written by the fix lane after the S1a and S1b probes (front jjodie-ui, branch `jjp-fx1`, merged by the chat into `jjodie-panel`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — fix: jjodie quick tip clear of the dock, context chip at 460
**Prompt**: P-2026-10-24-0240: move the Quick tip (`.notification-widget`) left by the dock width; re-measure the header context chip at 460 and keep level and model name if it collapses; re-run the dock and S1b probes; one crop with the tip visible.
**Files touched**: frontend/src/components/NotificationWidget/notification-widget.scss, frontend/scripts/probe/jjodie-dock.ts (12906d19a); docs/log-inbox/jjodie-ui-fx1.md, docs/prompts/claude_2026-10-24_0240_prompt_jjodie_fix_overlaps.md (this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 01:35 (S1a dock, Quick tip over the dock input)
**Causa**: (d)
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato (jjodie-dock 35/35, jjodie-s1b-header-composer 33/33 on 3014; crop with the tip visible)
**Notes**: Tip at 460: x 796-1116, y 768-940, right 484 px; dock 1140-1600; no fixed element over the dock. Chip unchanged: 116.2 px, «M1 · demoESM» in full (name 76.2, scrollWidth 76); JodieHeader.tsx and JodieWindow.css untouched. Out of scope: the dock probe's reset step opens the overflow menu first (S1b moved Reset there). Gates: typecheck 0; vitest 412 pass, 9 known, 11812 tests; build ok; check:scripts ok.
**Prompt document name**: 2026-10-24 02:40

**Ticket** (unattended decisions, `ratified as recommended, unattended`, RC-21/RC-25, for the digest): (1) the Quick tip fix as recommended by the S1a probe, `right: calc(24px + var(--jj-jodie-dock-width, 0px))`; (2) the dock probe's reset step edited (outside the prompt's NON FARE list, test harness only): it found no Reset button since S1b and failed «reopen: docked at 460», a stale probe and not a product defect. Finding, why Regressions is unknown: with the Properties rail open the shifted tip falls under the rail (`.properties-tree-overlay`, fixed, z 900); the tip's z 1000 is trapped in its `position: fixed; z-index: auto` wrapper, so it paints at level 0. Before the fix it showed over the dock input; with Jjodie closed it already sits under the rail the same way. The crop was taken with the rail hidden through its toolbar toggle. Clearing the rail too needs a rail-width variable or a stacking change outside this lane's files. Crop: `~/.jjodel-lanes/P-2026-10-24-0240/fx1-quicktip-dock.png`; probe crops under `dock/` and `s1b/` there.
