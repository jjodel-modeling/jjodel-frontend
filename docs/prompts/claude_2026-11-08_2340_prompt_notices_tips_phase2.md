# Notices and tips, Phase 2: tips card, announcement banner, tips browser

Prompt-ID: P-2026-11-08-2340
Chat: C-2026-11-08-2220
Front: maintenance
Request: https://claude.ai/code/session_01DQt9R57EjNuookGRd8rukw (Alfonso, 2026-11-08 23:38: «ok alle raccomandazioni procedi in lane auto»)
Lane: full (more than three files; persistence of seen state; shared payload)
Status: eseguito 2026-11-09 · lane notices · 633351f8f · verifica visiva passata 2026-11-09 (chat crops; GO Alfonso 09:27)

Protocollo: docs/PROTOCOL.md: clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-notices`, branch `notices-discovery`, HEAD is the commit that adds this file, whose parent is
`4e200c093` (the Phase 1 report). Before anything else: `pwd`, branch, `git log -2` and `git status` are as stated
here. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2340 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Context discipline: never `cat` a whole log, a probe output or a large file; grep the summary lines. One numbered
item per commit. If the context nears its ceiling, commit what is done as wip, write
`~/.jjodel-lanes/P-2026-11-08-2340/handoff.md` and stop with `Outcome: hard-stop`.

## Contesto (non rifare l'analisi)

Read `docs/discovery/discovery_2026-11-08_notices_and_tips.md` (Phase 1, P-2026-11-08-2230) first; its numbers are
the baseline. Summary: one component, `frontend/src/components/NotificationWidget/NotificationWidget.tsx`, mounted
once at `frontend/src/App.tsx:178`, fetches the Cloudflare Worker once per mount and renders either the first
undismissed system notice or a tip. Tips come back because "seen" expires after 14 days (`TIP_HIDE_WINDOW_MS`, `:26`)
and the pause yields as soon as one tip is not recently seen (`:50-66`). The "second card" is the React Flow minimap
under the card. The Worker source is not in the repo; its payload is `{ posts: [{ id, category, title, message,
priority }] }` and this lane does not change it.

## Decisions ratified by Alfonso (2026-11-08 23:38), to record

Add these rows to `docs/decisions.md` in a new series `R-NT` (notices and tips), in the grammar that
`scripts/gates/docs-digest.ts` `parseRows` reads (check it after writing; a row it cannot parse blocks every later
lane):

- **R-NT-1**: a tip counts as seen when it is displayed, and stays seen forever. No expiry window. Existing entries
  of `jjodel-quick-tips-state.seen` (keyed by Notion page id) stay valid; no migration.
- **R-NT-2**: at most one tip is shown automatically per browser session (`sessionStorage`); "Next tip" shows another
  unseen tip on demand. When every tip in the payload is seen, the card does not appear. A tip added later in Notion
  appears once.
- **R-NT-3**: "Show tips" is a per-browser preference in localStorage, toggled from the card ("Turn off tips") and
  from Settings, Notifications section. Cross-device storage is deferred (the persistence backend is outside this
  repo). `DUser` is not changed.
- **R-NT-4**: tips card at the bottom left of the work area, 16 px right of the Jjodie button and aligned with its
  bottom edge; announcements as a banner at the top of the work area, in the editor and on the dashboard, one at a
  time, with precedence over the tip as today.
- **R-NT-5**: the announcement link and date window need new Notion columns and a Worker change; deferred until the
  Worker source is in the repo (Alfonso exports it from Cloudflare). Severity reuses `priority`.

## COSA

1. **Close Phase 1 first.** Flip the `Status` of `docs/prompts/claude_2026-11-08_2230_prompt_notices_tips_discovery.md`
   and write its log entry in `docs/log-inbox/notices.md` (P9 format, `Outcome` ✅, `Smoke visivo: non applicabile`).
   One docs commit with pathspec.
2. **Decisions.** The five R-NT rows above, docs commit alone.
3. **Data and state module.** A module with no React (name to be checked free by grep, for example
   `frontend/src/components/NotificationWidget/noticesStore.ts`): one fetch per page load shared by every reader
   (module-level promise; a second reader never triggers a second request), `res.ok` checked, errors logged once and
   turned into an empty list. Seen state reuses the key `jjodel-quick-tips-state`, ignores `pauseUntil` and the
   14-day window, and marks a tip seen on display. Session limit in `sessionStorage`. Preference key
   `jjodel-tips-prefs` (check it is free) with `{ showTips: boolean }`, default `true`. A custom DOM event
   (registered in `frontend/src/events/registry.ts`, name checked free) tells mounted readers that the preference
   changed. Unit tests first, under vitest, for: seen on display; no expiry; at most one automatic tip per session;
   silent when all seen; a new id shows once; preference off hides the card; one fetch for two readers; HTTP 500 and
   non-JSON give an empty list without throwing.
4. **Tips card.** Replace the tip branch of the widget with a compact card (new scoped class names, verified free;
   existing class names are not renamed, Rule 2; the old tip-only rules may be deleted only where nothing else uses
   them, by grep). Content: lightbulb icon (Bootstrap Icons), a small label "Tip", the message, a footer with "Turn off
   tips" (link style) and "Next tip" (secondary button); a close X. Width 300 px, design tokens of the project
   (slate base, 11 px secondary text, 8 px grid), neutral surface, no saturated color. No "Tip 1 of 1" counter.
   Position computed from the Jjodie button's rect (`button.jodie-minimized`) when present: `left = jodie.right + 16`,
   `bottom` aligned with `jodie.bottom`; when the button is absent (consumer mode, Templates page), `left = 16` px
   from the left edge of the work area. Recompute on resize and on the rail and Jjodie dock width variables.
   Keep the gates of the current widget (consumer mode, Templates page, `auth` in the hash, logged-in user only).
5. **Announcement banner.** Replace the notice branch with a banner at the top of the work area: in the editor,
   inside the canvas column (left of the right panel, right of the palette), 8 px below its top edge; on the dashboard,
   at the top of the main content column. Height one line (40 px), icon and colors by `priority`
   (`info`, `warning`, `success`, `error`; default `info`), title in weight 500 when present, message, close X that
   writes the dismissal to the existing key `jjodel-dismissed-notifications`. One banner at a time, the first
   undismissed. Not covering the right panel, the palette, the canvas toolbar or the minimap.
6. **Settings toggle.** "Show tips" switch in `frontend/src/components/settings/UnifiedSettingsModal/sections/NotificationsSection.tsx`,
   bound to `jjodel-tips-prefs`, live through the event of item 3.
7. **Tips browser.** A "Tips" item in the Help menu (`frontend/src/pages/components/Navbar.tsx`, near
   `:1697-1712`) opening a small modal that lists every tip of the payload (message only), from the shared fetch.
   Opening it does not mark tips as seen. Bootstrap Icons only.
8. **Gates.** Baseline before the code (typecheck count, vitest, build) and after; `npm run smoke`; `npm run
   check:docs`.
9. **Visual probe and crops** (light theme only; numbers from the DOM, never from screenshots), on a private dev
   server on a free port in 3100-3199, headless Chromium 1440x900, offline user seeded as in
   `frontend/scripts/smoke/states.ts:178`, payload mocked with route interception: six tips and, in a second
   scenario, one `system-notice` with `priority: warning`. Scenes: editor with tip; dashboard with tip; editor with
   banner; dashboard with banner; Settings with the toggle; Help menu tips modal. For each scene record the rects of
   the card or banner and of `button.jodie-minimized`, `.react-flow__minimap`, `.properties-tree-overlay`,
   `aside.editor-v2-palette`, `.app-statusbar`, `.donation-banner` (when shown), and save crops under
   `~/.jjodel-lanes/P-2026-11-08-2340/crops/`. Behaviour checks with a faked clock and true reloads (a hash
   `page.goto` does not remount): day 0, day 15, day 30 after seeing all tips: no card; a new tip id: shown once.
10. **Closing entry** for this lane in `docs/log-inbox/notices.md`, `Smoke visivo` pending until the chat's check.

## Acceptance (mechanical)

At 1440x900 in the four card and banner scenes: intersection area 0 px² between the tips card and each of
`button.jodie-minimized`, `.react-flow__minimap`, `.properties-tree-overlay`, `aside.editor-v2-palette`,
`.app-statusbar`; card left edge equal to the Jjodie button right edge plus 16 px (±1 px) and bottom edges equal
(±1 px); banner intersection area 0 px² with `.properties-tree-overlay`, `aside.editor-v2-palette` and the minimap;
`document.querySelectorAll` of the card and of the banner each return at most 1. Behaviour: after all tips are seen,
no card on days 0, 15 and 30; one request to the Worker per page load with card, banner and tips modal all mounted.

## HARD STOP

After the gates, the probe and the crops are committed or saved: stop with `Outcome: hard-stop` and the table of
measured rects. The chat checks the crops (RC-23); Alfonso gives the GO before the merge. No merge in this lane.

## NON FARE

No change to the Worker, to Notion, to `DUser`, to `useJjomSync.ts` or `portDistribution.ts`. No new dependencies.
No renaming of existing identifiers. Do not touch the donation banner or `.notification-header` (two tickets, item
below). No `git add .`, no stash, no push.

At closure, file two tickets with `lane-run ticket --front maintenance --priority low`: the donation banner ignores
the right rail and covers it in the editor (Phase 1 F1, F2 risks); `.notification-header` is a global rule that also
styles `.jjscript-success-notification .notification-header` (Phase 1 F7).

## RIFERIMENTI

`docs/discovery/discovery_2026-11-08_notices_and_tips.md`; `docs/PROTOCOL.md` P4, P8, P9, P13, P16; `CLAUDE.md`
rules 1-2, §21; template "Task visivi" (current numbers in the report's last table, target and acceptance above).
