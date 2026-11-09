# log-inbox — lane «notices»

Entries written by the notices lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-08 — docs: notices and tips discovery, Phase 1 (P-2026-11-08-2230)
**Prompt**: `claude_2026-11-08_2230_prompt_notices_tips_discovery.md`: locate the notification card, its data path, seen state, consumers and geometry, read-only, as Phase 1 of the split into an announcement banner and a tips card
**Files touched**: `docs/discovery/discovery_2026-11-08_notices_and_tips.md` (`4e200c093`). No product file
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only; `git status` clean after every run
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no sync or D-L path; F8 of the report)
**Smoke visivo**: non applicabile
**Notes**: One card, one mount. The second edge is the React Flow minimap. Tips return because seen expires after 14 days and the pause yields as soon as one tip is not recently seen. Six questions for Alfonso, answered by R-NT-1..5. Closed by P-2026-11-08-2340, item 1.
**Prompt document name**: 2026-11-08 22:30

## 2026-11-09 — ticket: donation banner ignores the right rail in the editor
**Ticket**: The donation banner ignores the right rail in the editor: `DonationBanner.scss:3-4` fixes it at `bottom: 20px; right: 100px`, z-index 9000, with no offset for the rail.
At 1440x900 the banner measures 1020..1340 x 691.1..880 (P-2026-11-08-2230, F1) and the Properties panel 1080..1440 x 91..868 (P-2026-11-08-2340): the two rects share 260 x 176.9 px.
Stacking inside that area was not measured by a hit test on the rail. A comment in `frontend/scripts/probe/library-gallery-clone.ts` says the banner sits under the panel, so the fix starts by measuring which one paints.
**Priority**: low
**Found in**: P-2026-11-08-2230
**Detail**: docs/discovery/discovery_2026-11-08_notices_and_tips.md

## 2026-11-09 — ticket: .notification-header is global and reaches the JjScript success notification
**Ticket**: `.notification-header` is a global rule in `notification-widget.scss:25`, so it also styles `.jjscript-success-notification .notification-header` (`JjScriptSuccessNotification.scss:10,24`). P-2026-11-08-2340 kept the rule for that reason (`notification-widget.scss:2`). Scoping it needs a check of what the JjScript notification inherits from it.
**Priority**: low
**Found in**: P-2026-11-08-2230
**Detail**: docs/discovery/discovery_2026-11-08_notices_and_tips.md

## 2026-11-09 — ticket: Properties overlay covers the Help menu in the editor
**Ticket**: In the editor the Properties overlay covers the Help menu below y=91, so "Tips" and its neighbours cannot be clicked while the right panel is open. Measured by a hit test on every item at 1440x900: the panel is 1080..1440 x 91..868, and Playwright reports `.tree-section__header` from `.properties-tree-overlay` intercepting pointer events (`~/.jjodel-lanes/P-2026-11-08-2340/probe-_tmp_notices_probe.log:63`). The navbar and the overlay were not changed by P-2026-11-08-2340.
**Priority**: low
**Found in**: P-2026-11-08-2340

## 2026-11-09 — feat: notices and tips Phase 2, banner, tips card, tips browser (P-2026-11-08-2340)
**Prompt**: `claude_2026-11-08_2340_prompt_notices_tips_phase2.md`: split the notification card into an announcement banner and a tips card, with a "Show tips" switch in Settings and a tips browser in the Help menu
**Files touched**: `docs/decisions.md`, `docs/log-inbox/notices.md`, `docs/prompts/claude_2026-11-08_2230_prompt_notices_tips_discovery.md`, `frontend/src/events/registry.ts`, `frontend/src/components/NotificationWidget/{NotificationWidget.tsx,TipsBrowserModal.tsx,noticesStore.ts,notification-widget.scss,__tests__/noticesStore.test.ts}`, `frontend/src/components/settings/UnifiedSettingsModal/sections/NotificationsSection.tsx`, `frontend/src/pages/components/Navbar.tsx` (`dbc981491`..`e0ecdfffa`, `633351f8f`)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck 0, build ok, probe 70 of 70; crop check passed 2026-11-09
**Out-of-scope changes**: yes — `TipsBrowserModal.tsx`, new file of item 7, is not named in the prompt; eleven files, above five (RC-11), listed in Files touched
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-11-09, controllo crop della chat (editor tip, editor banner, dashboard banner, Help tips modal), GO Alfonso 09:27; nota minore: il menu Help resta aperto dietro la modale Tips — probe 70/70 PASS, 0 page errors; crops in ~/.jjodel-lanes/P-2026-11-08-2340/crops/
**Notes**: Stopped by the context ceiling during item 8; gates and closure are in P-2026-11-09-0036. Vitest showed 6 red files against 3 at baseline, under load above 60: that entry explains the three extra ones.
**Prompt document name**: 2026-11-08 23:40

## 2026-11-09 — chore: notices Phase 2 closure, gates, stale probe, tickets (P-2026-11-09-0036)
**Prompt**: `claude_2026-11-09_0036_prompt_notices_tips_phase2_closure.md`: explain three vitest reds, run smoke and docs gates, repoint a stale probe, file three tickets, close both prompts
**Files touched**: `frontend/scripts/probe/library-gallery-clone.ts` (`45d3b1794`), `docs/log-inbox/notices.md`, the Status line of the two Phase 2 prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — smoke, check:scripts and typecheck:scripts green; the edited probe was not executed; crop check passed 2026-11-09
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-11-09, controllo crop della chat (editor tip, editor banner, dashboard banner, Help tips modal), GO Alfonso 09:27; nota minore: il menu Help resta aperto dietro la modale Tips — smoke GREEN on this worktree, 12 passed, 0 failed, 3 skipped
**Notes**: The three vitest files pass alone, 3 of 3 runs each, so not this lane's and no run on 4e200c093. Under load above 60 they failed on two 10 s hook timeouts (irCollapsedRender, irSelectionRing) and on 50.47 ms against the 50 ms budget (languageService). Probe: line 124 repointed too, same stale selector as 120-121, same function. Tickets 830, 831, 832.
**Prompt document name**: 2026-11-09 00:36

**Ticket** (smoke through `lane-run probe`): the probe runs under `tsx`, whose `__name` helper breaks `page.evaluate` in `scripts/smoke/assertions.ts:68` (`ReferenceError: __name is not defined`), so the recipe of the handoff of P-2026-11-08-2340 fails. A bare `npm run smoke` hits port 3000, served from `~/jjodel-release/frontend`. Measured here with a scratch `_tmp_` wrapper: lane-run served the worktree, npm run smoke ran under node with `SMOKE_URL`.
