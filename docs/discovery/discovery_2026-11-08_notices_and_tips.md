# Discovery: notices and tips, the current notification card

- Prompt-ID: P-2026-11-08-2230 (chat C-2026-11-08-2220, front maintenance)
- Prompt file: `docs/prompts/claude_2026-11-08_2230_prompt_notices_tips_discovery.md`
- Session: 9f6fa63f-4d69-45e7-b094-a16ec7b7c55e
- Tree: `~/jjodel-w-notices`, branch `notices-discovery`, HEAD 6fea9e8e2
- Executor: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

Tags: **[M]** measured in this phase on HEAD 6fea9e8e2; **[R]** read from a file or doc. Live runs: private Vite on port 3101, headless Chromium through Playwright, 1440x900, clean profile, offline user seeded as in `frontend/scripts/smoke/states.ts:178`, real Worker unless stated. Probes were kept in `/tmp/notices-probe` and are not committed. No product file changed; `git status` was clean after every run.

## Objective

Phase 1 of the split of the card into an announcements banner and a tips card: locate the card, its data path, its seen state, its consumers and its geometry, so that Phase 2 can be specified with numbers.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Two card instances, or a stale container, explain the second edge | **Falsified** in every measured state: one mount, one `.notification-widget`. The edge is another component (F1) |
| H2 | The seen state is not written or not honoured | **Falsified**: it is written and honoured. The card returns by design of a per-tip 14-day window that overrides the pause (F3) |
| H3 | "Tip 1 of 1" comes from filtering, pagination or the empty `Title` in the data path | **Falsified**: the payload holds six tips. The footer counts the unseen queue (F4) |
| H4 | The Notion token is in the client bundle | **Falsified** for the production build measured here (F2) |
| H5 | The path touches `useJjomSync.ts` or `portDistribution.ts` | **Falsified** (F8) |
| H6 | A store exists that can hold "tips off" across devices | **Falsified** in this repo: per-browser only. The backend is not in this repo (F6) |

## Files read (full paths under `/Users/alfonso/jjodel-w-notices/`)

Whole: `frontend/src/components/NotificationWidget/NotificationWidget.tsx`, `frontend/src/components/NotificationWidget/notification-widget.scss`, `docs/redesign/cloudflare-worker-notion.js`, `frontend/src/components/DonationBanner/useDonationBanner.ts`, `cloudflare-worker/wrangler.toml`.

Windows: `frontend/src/App.tsx` 150-199; `frontend/scripts/smoke/states.ts` 1-260; `frontend/src/components/settings/UnifiedSettingsModal/sections/ProfileSection.tsx` 92-115; `frontend/src/pages/components/Navbar.tsx` 1697-1712; `frontend/src/events/registry.ts` 80-92; `frontend/src/components/environment/consumerMode.ts` 1-40; `cloudflare-worker/README.md` 1-83; `docs/PROTOCOL.md` 32-71.

Grep only: `frontend/src/components/DonationBanner/DonationBanner.scss`, `frontend/src/components/NotificationCenter.tsx`, `frontend/src/components/HelpDrawer.tsx`, `frontend/src/components/HelpButton.tsx`, `frontend/src/components/StatusBar.tsx`, `frontend/src/api/DTO/UpdateUserRequest.ts`, `frontend/src/api/persistance/users.ts`, `frontend/src/components/settings/UnifiedSettingsModal/sections/NotificationsSection.tsx`, `frontend/src/pages/Account.tsx`, `frontend/src/jjscript/components/JjScriptSuccessNotification.scss`, `docs/redesign/notification-widget-spec.md`, `docs/discovery/2026-06-17_autosave_layout_toggle.md`, `cloudflare-worker/src/index.ts`.

Not read: `frontend/.env*`, denied by the project deny list (`.claude/settings.json:36-37`).

External, read-only: GET on the Worker; Notion data source `collection://2eb4b66b-db50-808c-9334-000b17d45e1c` (schema and one SELECT).

## F1. Where the card is rendered, and the second edge

**[R]** One mount point, inside the HashRouter, for logged-in users only, `frontend/src/App.tsx:178`: `{user && <Try><NotificationWidget/></Try>}`. A search for `NotificationWidget` over `frontend/src` and `frontend/index.html` returns only `App.tsx` and the component itself.

**[R]** The component returns one root at most: the notice branch at `NotificationWidget.tsx:208-228`, the tip branch at `:234-259`, otherwise `return null` at `:261`.

**[M]** `document.querySelectorAll('.notification-widget').length` was 1 whenever a card was on screen and 0 otherwise, on dashboard and editor, across every scenario of F3. Fixed elements near the corner were listed by scan: none is a second card. H1 is falsified.

**[M]** The second edge, in the editor, is the React Flow minimap (`frontend/src/components/editor-v2/EditorV2.tsx:5211`: `<MiniMap`), which sits under the card and sticks out below it:

| | left | top | right | bottom | size | z-index |
|---|---|---|---|---|---|---|
| `.notification-widget` | 736 | 668.5 | 1056 | 840 | 320 x 171.5 | 1000 |
| `.react-flow__minimap` | 853 | 699 | 1055 | 851 | 202 x 152 | 5 |

The minimap protrudes 11 px below the card, and its right edge is 1 px inside the card's. Its style reads as a card: `border: 1px solid rgba(0, 0, 0, 0.12)`, radius 4px, shadow `rgba(0, 0, 0, 0.06) 0px 2px 8px`, background `rgb(241, 245, 249)`. The screenshot of this state shows that outline below the card. Alfonso's own screenshot was not available to this session (Q1).

**[M]** A second, different overlap: the donation banner, a sibling mounted at `App.tsx:184`, shows 30 s after mount (`useDonationBanner.ts:4`: `const SHOW_DELAY_MS = 30_000;`), at most 4 times, 14 days apart (`:5-6`). It sits above the card and ignores the right rail (`DonationBanner.scss:3-4`: `bottom: 20px;`, `right: 100px;`).

| State | `.donation-banner` rect | z-index | Overlap with the card |
|---|---|---|---|
| Dashboard | 1020..1340 x 691.1..880 (320 x 188.9) | 9000 | 244 x 148.9 px |
| Editor | 1020..1340 x 691.1..880 | 9000 | 36 x 148.9 px |

In the editor, `elementsFromPoint` at (1024, 695.1) returns `div.donation-banner`, then `i.bi.bi-x-lg`, then `button.notification-close`: the banner lies over the card's close button.

## F2. How the content is fetched

**[R]** Client, once per mount, `NotificationWidget.tsx:24`: `const API_URL = 'https://jjodel-notifications.alfonso99.workers.dev';` and `:85-87`:

```
const res = await fetch(API_URL);
const data: APIResponse = await res.json();
setPosts(data.posts || []);
```

**[M]** One request per page load (scenario A: one 200 response), and the offline user reaches the Worker too. **[R]** The call sends no header or user identity (`:85`).

**Worker source is not in the repo as deployed.** **[R]** `cloudflare-worker/` is another Worker (`wrangler.toml:1`: `name = "jjodel-ai-proxy"`); `command grep -c -iE "notion|notification" cloudflare-worker/src/index.ts` returns 0, with the positive control `jjodel-ai-proxy` found in the same folder by the same tool. The only source is the January archive `docs/redesign/cloudflare-worker-notion.js`, and an earlier discovery records the same gap (`docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md:340`: "It is a second Worker on the same account and subdomain, with no source in this repo"). **[M]** The deployed Worker differs from the archive: the archive emits a `date` key (`:82`: `date: page.created_time,`), the live payload keys are `id, category, title, message, priority`. The archive sorts by a property `Created` (`:53`), which the live schema does not have (schema: `Active`, `Category`, `Message`, `Priority`, `Title`). The live order does match `createdTime` descending on all six rows. Every statement below on Worker internals is about the archive and is a hypothesis about the deployed code.

**Token.** **[R]** Archive `:7-8`: `// Il token va nelle Environment Variables di Cloudflare, NON qui!` and `:40`: `'Authorization': `Bearer ${env.NOTION_TOKEN}`,`. **[M]** The token is not in the client bundle. Production build of this HEAD (`vite build --outDir /tmp/notices-build`, loading the production env as a normal build does), files matching over the whole output:

| Pattern | Files |
|---|---|
| `jjodel-notifications\.alfonso99` (positive control) | 1 |
| `api\.notion\.com` | 0 |
| `NOTION_TOKEN` | 0 |
| `ntn_[A-Za-z0-9]{20,}` | 0 |
| `secret_[A-Za-z0-9]{20,}` | 0 |

The same patterns over `frontend/src` and `frontend/index.html` give 0 files, control 1. Not covered: the staging build, and the content of `.env*` (not read).

**Caching. [M]** Response headers, complete: `date`, `content-type`, `content-length`, three `access-control-*` (`access-control-allow-origin: *`), `report-to`, `nel`, `server`, `cf-ray`, `alt-svc`. No `cache-control`, `etag` or `cf-cache-status`. **[R]** No client cache either: nothing stores the payload, and no retry exists.

**Errors and offline. [M]** All three leave no card and do not throw:

| Scenario | Card | Console |
|---|---|---|
| Network abort | none | `error: Failed to fetch notifications: TypeError: Failed to fetch` |
| HTTP 500 with `{"error":...}` | none | nothing: `res.ok` is never checked, `data.posts` is undefined |
| 200 with non-JSON | none | `error: Failed to fetch notifications: SyntaxError: ...` |

**Columns. [M]** The live table has six rows, all `Category = tip`, all `Active`, `Title` null, and `Priority` **null on all six** (the prompt expected a value). The payload carries `priority: "info"` and `title: ""` on all six, consistent with the archive's defaults (`:78-81`).

- `Active`: filtered server-side in the archive (`:45-50`). **[M]** The six active rows give six posts, but with no inactive row today this does not discriminate. Not tested: no edit of Notion in this lane.
- `Category`: split on the client, `:103`: `posts.filter(p => p.category === 'tip')`, and `:143-145` for notices. A notice takes precedence: `:208` returns before tips are reached at `:234`, and only `systemNotices[0]` shows (`:149`).
- `Priority`: **[R]** drives class and icon of notices only (`:210`, `:213`). Tips ignore it.
- `Title`: **[R]** rendered for notices only (`:221-223`); a tip renders `currentTip.message` (`:249`).

The notice branch was not exercised live: no such row exists and no mock was run.

## F3. How "seen" is tracked, and why the card comes back

**[R]** Key `jjodel-quick-tips-state` (`:30`, `:44`), shape `{ seen: Record<pageId, epochMs>, pauseUntil: number | null }` (`:18-21`). Notice dismissal is separate: `jjodel-dismissed-notifications`, an array of ids (`:77`, `:100`). Written only on Next (`:156-172`) and close (`:176-192`), never on display. Both keys are in `localStorage`, so per browser and per origin.

**[R]** The cause is two rules at `:26` and `:50-66`. "Seen" expires per tip after 14 days, and the pause yields as soon as any tip is not recently seen:

```
const TIP_HIDE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
...
return seenAt === undefined || (now - seenAt) >= TIP_HIDE_WINDOW_MS;
...
if (state.pauseUntil === null || now >= state.pauseUntil) return false;
const allSeenRecently = allTips.every(t => {
```

The comment at `:57-58` states the intent: "Pause is honored only if every tip in the current payload has a recent seen entry." So `pauseUntil` adds nothing once entries age. There is no terminal "all seen" state and no off switch.

**[M]** Storage before and after, scenario A, clean profile, Next through the queue: before, `null`; after the first Next, `seen` with 1 entry and `pauseUntil: null`; after the sixth Next, 6 entries, `pauseUntil` = now + 14 days, card gone. Raw length 355 bytes.

**[M]** Calendar reproduction with a faked clock and a true reload per session (one earlier run was void: `page.goto` on the same hash URL does not remount, so its reload steps were discarded and rerun):

| Behaviour | Day | Footer |
|---|---|---|
| Next through all, once | 0 | Tip 1 of 6 |
| | 1, 13 | no card |
| | 14 | Tip 1 of 6 |
| | 15 | no card |
| | 28 | Tip 1 of 6 |
| Close with X, one session a day | 0,1,2,3,4,5 | Tip 1 of 6, 5, 4, 3, 2, 1 |
| | 6,7,12,13 | no card |
| | 14,15,16,17,18,19 | **Tip 1 of 1 on each of six consecutive days** |
| | 20,21 | no card |
| | 28..33 | **Tip 1 of 1 on each of six consecutive days** |

`pauseUntil` was in the future during those runs (day 19 on day 14, then 28, 29, 30, ...), which is the direct evidence that the pause does not hold.

**[M]** Two further routes, seeded:

- A row without a seen entry, pause running (a tip added in Notion): `Tip 1 of 1`. The row `34f4b66b` was created on 2026-04-27, the date of commit 047de54a2 that introduced this queue.
- One entry 15 days old, the other five 1 day old, pause running for 13 more days: `Tip 1 of 1`.
- Control: six entries 1 day old, pause running: no card. Staggered ages all under 14 days: no card.

**[M]** A card ignored, not clicked, writes nothing: three reloads in a row show `Tip 1 of 6` with storage `null`. This is the "once per session" gap in the target: today the limit is per page load at best.

Which route produced the observation of 2026-11-08 depends on the real browser's storage, which this session could not read (Q2).

## F4. Why the footer reads "Tip 1 of 1"

**[R]** `:252`: `<span className="tip-counter">Tip {queueIndex + 1} of {tipsQueue.length}</span>`. The denominator is the unseen queue, built at `:117`: `setTipsQueue(getUnseenTips(tips, state, now));`.

**[M]** The Worker returned six posts on every run; `Tip 1 of 6` on a clean profile. Not filtering in the path, not pagination, not the empty `Title`. "1 of 1" means five tips are within their window and one is not. H3 is falsified.

## F5. Other consumers

**[R, by search]** Over `frontend/src`:

- Component: `App.tsx` only.
- Worker URL and tip classes (`workers\.dev|quickTip|QuickTip|quick-tip|tip-counter|tip-next-btn|is-tip`): the two widget files only.
- Both storage keys: the widget only, also searched in `frontend/scripts` and `docs/spec`.
- `data-notification-visible`: written at `:129`, `:131`, `:135`, **no reader** in `frontend/src` (SCSS included), so the comment at `:121` on the Jjodie FAB describes a dead signal.
- `setIsVisible`: one occurrence, the declaration at `:72`; `isVisible` never changes.

Separate systems, not consumers of this data:

- Notifications bell: `NotificationCenter.tsx:4`, "backed by `toastHistory` (localStorage-backed)".
- Help menu: `Navbar.tsx:1697-1712`, static items, no tips entry; "What's New" opens GitHub releases (`:1700`).
- `HelpDrawer.tsx` and `HelpButton.tsx`: `tip|notification` case-insensitive gives no line; control `export|JjodelEvents` on `HelpDrawer.tsx` returns lines.
- Onboarding: `WelcomeModal` (`App.tsx:185`) with its own `jjodel_welcome_*` keys; `onboarding` occurs only in a services test.

Gates to preserve: consumer mode and Templates page (`:70`, `:125`, `:234`), hash containing `auth` (`:140`).

## F6. Where "tips off" could live

**[R]** Per browser only.

- `frontend/src/api/DTO/UpdateUserRequest.ts:6-14` carries identity fields and `newsletter`, no preferences field.
- `UsersApi` setter is a stub: `docs/discovery/2026-06-17_autosave_layout_toggle.md:18`, `users.ts:73-75` → `throw new Error("Method not implemented.")`.
- Precedent for a per-user preference, `ProfileSection.tsx:95-106`: "Writes into Redux so the autosave gate sees it at runtime, and into the 'user' localStorage blob the app rehydrates from on reload." That is `autosaveLayout` on `DUser` plus `Storage.write('user', DUser.getUser())`.
- Toast preferences use `jjodel-toast-preferences` (`NotificationsSection.tsx:4`), the natural settings section for the control.
- `pages/Account.tsx:66`, `:618`: a "Product Announcements" toggle held in component state only (`useStateIfMounted(false)`).

Search `user_preferences|UserPreferences|userPreferences|UserSettings|userSettings|PreferencesStore` over `frontend/src`: empty, with the same tool returning 86 files for `localStorage`. The persistence backend (`U.env('JODEL_PERSISTANCE')`) is not in this repo, so what it could store is unknown from here (Q4).

## F7. Names already taken

**[R]** CSS of the widget (`notification-widget.scss`): `.notification-widget`, `.notification-header`, `.notification-header-label`, `.notification-close`, `.notification-content`, `.notification-title`, `.notification-message`, `.notification-footer`, `.tip-icon-wrapper`, `.tip-counter`, `.tip-next-btn`, `.is-tip`, `.priority-warning|info|success|error`.

**[M, grep per name outside the widget folder]** Only `.notification-header` occurs elsewhere: `jjscript/components/JjScriptSuccessNotification.scss:24`, nested under `.jjscript-success-notification` (`:10`). The widget's rule is global, so it also reaches that element. The other 15 names: no file.

Candidates free as class names: `tips-card`, `tip-card`, `notice-banner`, `jj-notice`, `jj-tip` (no file). `announcement` occurs only as prose or state (`ScriptBlock.tsx:1267`, `ProfileSection.tsx:382`, `Account.tsx:66,602,618`). Existing near names to keep distinct: `.app-notif-popover`, `.donation-banner`.

**[R]** Events, `events/registry.ts`: `TOAST` (`:83`), `TOAST_PREFS_CHANGED` (`:84`), `HISTORY_CHANGED` (`:88`), `NOTIFICATIONS_POPOVER_TOGGLE` (`:90`); `JjodelEvents.HELP_OPEN` is used by the Help drawer. The widget dispatches and listens to none. Storage keys in use: `jjodel-quick-tips-state`, `jjodel-dismissed-notifications`, `jjodel_donation_banner`, `jjodel-toast-preferences`.

## F8. Layer Impact

**[M]** `command grep -n -E "useJjomSync|portDistribution" frontend/src/components/NotificationWidget/NotificationWidget.tsx`: no line, exit 1, on a file the same tool reads. The widget's imports are React, `react-router-dom`, `consumerMode` and its SCSS (`:1-4`); `consumerMode.ts:10` pulls the `joiner` barrel only for `U.getHashParam`. The "notion" hits in `portDistribution.ts:40,208` and `createAdapter.ts:397` are the English word. No sync, D-layer or view path: a Layer Impact Report is not expected, unless Phase 2 changes `DUser` persistence (Q4).

## Current numbers for Phase 2

**[M]** Light theme (the only theme: `data-theme` unset, `.react-flow.light`, `.editor-v2.theme-light`), viewport 1440x900, DPR 1, tip with a one-line message.

| Element | State | left..right x top..bottom | size | position | z-index |
|---|---|---|---|---|---|
| `.notification-widget.is-tip` | Dashboard | 1096..1416 x 668.5..840 | 320 x 171.5 | fixed; right 24, bottom 60 | 1000 |
| `.notification-widget.is-tip` | Editor | 736..1056 x 668.5..840 | 320 x 171.5 | fixed; right 384, bottom 60 | 1000 |
| `.app-statusbar` | both | 0..1440 x 868..900 | 1440 x 32 | static | 50 |
| `.properties-tree-overlay` (right panel) | Editor | 1080..1440 x 91..868 | 360 x 777 | fixed | 900 |
| `.react-flow__pane` | Editor | 201..1439 x 91..867 | 1238 x 776 | absolute | 1 |
| `aside.editor-v2-palette` | Editor | 1..201 x 51..867 | 200 x 816 | static | auto |
| `div.leftbar` | Dashboard | 0..240 x 50..868 | 240 x 818 | static | auto |
| `button.jodie-minimized` | Editor | 216..264 x 803..851 | 48 x 48 | fixed | 10000 |
| `button.jodie-minimized` | Dashboard | 270..328 x 742..800 | 58 x 58 | fixed | 10000 |

Card to status bar: 28 px. Card to right panel in the editor: 24 px. Editor `right` = 24 + `--jj-jodie-dock-width` (0px) + `--jj-rail-width` (360px, published on `<body>`; empty on the dashboard). The card's height grows with the message; only the one-line case was measured. The spec's position is stale: `docs/redesign/notification-widget-spec.md:165` says `bottom: 24px`, `right: 24px`.

## Dependencies and risks for Phase 2

1. **A bottom-left card collides with the Jodie button.** In the editor the button is at 216..264 x 803..851, z-index 10000, right beside the palette. On the dashboard it is at 270..328 x 742..800. The target position has to be stated against these numbers.
2. **The minimap and the donation banner remain.** Moving the tips away removes both overlaps with the card, but the banner still ignores the rail and sits over the right panel in the editor (1020..1340 against a panel starting at 1080).
3. **The announcement fields do not exist.** Severity can reuse `Priority`; link and date window need new Notion columns and a Worker change. The Worker's deployed source is not in the repo and differs from the archive, so that change starts with recovering or rewriting the source, then deployment by the account owner.
4. **Today's "seen" entries are reusable**, keyed by Notion page id. Dropping the 14-day expiry makes users who have seen tips silent at once, without migration.
5. **Several readers of one payload.** Splitting the widget in two and adding a Help-menu browser of all tips makes three readers; one fetch per load should be kept.
6. **Page-load is the only "session" available today**, and an ignored card writes nothing. "At most one per session" and "never repeat" need a decision on when a tip counts as seen (Q3).
7. **Payload size.** The archive reads one Notion page (no `next_cursor`); default page size is 100 (from Notion's API, not measured). The 56 staging drafts added to the six stay below it.
8. **`.notification-header` is global** and reaches the JjScript notification. New components should use scoped names; existing names are not renamed (Rule 2).

## Open questions for Alfonso

1. Is the second edge you saw the outline below the card, at the bottom, in the editor (the minimap, F1)?
2. What does `localStorage['jjodel-quick-tips-state']` hold in the browser where you saw it, to tell which route of F3 applies?
3. When does a tip count as seen: on display, or only on Next and close?
4. Must "Turn off tips" follow the user across devices (backend change, outside this repo), or is per-browser enough for now?
5. Where should the tips card sit at bottom left, given the Jodie button at 216..264 in the editor and 270..328 on the dashboard?
6. Can the deployed notifications Worker source be exported and brought into the repo before Phase 2?
