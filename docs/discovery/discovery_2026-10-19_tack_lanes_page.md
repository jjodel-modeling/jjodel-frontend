# Discovery: Tack slice 8, the Lanes page (Phase 1)

- Prompt-ID: P-2026-10-19-2320
- Prompt: `docs/prompts/claude_2026-10-19_2320_prompt_tack_s8_lanes_page_disc.md`
- Session: be155486-52d1-475f-863a-4af8723dea86
- Tree: `~/jjodel-w-tack-s8`, branch `tack-s8`, HEAD `0a200b188`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

"Read" marks a claim taken from a file. "Measured" marks a run in this phase, on this HEAD, on this Mac, on 2026-10-19 between 23:18 and 23:40. The runs used a copy of the slice 7 store: `/tmp/tack-s7/real.db` was copied to `/tmp/tack-s8-probe/store.db`, and nothing was written anywhere else. Line numbers without a file name are in `frontend/scripts/lane-board/lane-board.mjs`. Paths under `tack/` are given from `tack/`.

## 0. Answer in brief

- Of the 4700 Lanes page elements, 15 come from the store today, 7 need one collector extension, and 2 stay disabled in this slice: the phase ladder and the "arch" context (§1, §2).
- The one extension is store schema 6. It adds six `lanes` columns, read from files the collector already opens plus two existence checks: `kind`, `title`, `work_ms`, `worktree`, `resolved`, `adoptions` (§2).
- Unattended adoptions can be attributed to a lane exactly from one place: the closing `result` event of `log.jsonl`. They appear there in 40 of 429 lanes. `decisions.md` and the discovery reports cannot be attributed reliably enough for v0 (§3).
- Live refresh must not ride on the notifier poll, because the 4710 board runs with `TACK_NOTIFY=off` and so has no watcher at all. Phase 2 should collect when a page is read, at most once every 20 s: about 56 ms per collection, measured (§5).
- Phase 2 fits in three commits (§6). None of the decisions waits for Alfonso (§8).

## 1. Element by element: 4700 source, Tack source, gap

The 4700 server runs `lane-run status --all` and enriches each row in `snapshot()` (522) from the files under `~/.jjodel-lanes/<id>/`. The client polls `/api` (2322) and `/api/attention` (2306). In Tack, the `lanes` table is defined by `src/store/schema-4.sql:9-24` and `schema-5.sql:4-11`. Each column's source is documented in `src/collectors/lane-run/collect.mjs:20-35` (read).

| Element | 4700 source | Tack source today | Gap |
|---|---|---|---|
| Running tile | `renderKpis` 1983, `stripKey` 1646; running = no `exit.txt` and the pid is alive (`lane-run.mjs:1405-1418`) | `lanes.live` (`collect.mjs:216`) | none |
| Waiting tile | `attnIds(false)` 1975: an attention item of kind question or hard-stop | `lanes.last_outcome` in (question, hard-stop) and `live = 0` | closure (see "stale") |
| Blocked (now) | `attnIds(true)`: running past the 90-min limit, or Outcome blocked | `live = 1` with `now - started_ms` past `limits.laneMinutes`; or `last_outcome = 'blocked'` | the `resolved` column |
| Done (24 h) | `stripKey === 'done'` and `recent`; `recent` = the Prompt-ID time within 24 h (543, `RECENT_H` 42) | `last_outcome = 'done'`, `started_ms` within 24 h | none (Tack uses the real start rather than the time parsed from the ID) |
| Resolved (24 h) | `resolved24` 1978: an exited lane, last Outcome blocked, `resolved.txt` present (554; written by `lane-run resolve`, `lane-run.mjs:1546`) | not read | **`resolved` column** (existence of `resolved.txt`) |
| Spend today | `spendByDay` 785: cost-event deltas booked on the local day the turn ends | `lane_spend(at_ms, usd)` (`collect.mjs:200-208`), the same booking rule | none |
| Waiting banner | `renderAttn` 1994-2006; the predicate is at 1731-1745 (question, hard-stop or blocked, not closed, at most 72 h) | derivable from the waiting and blocked queries above | closure (see "stale") |
| Card: Prompt-ID | the folder name | `lanes.id` | none |
| Card: kind | `kindOf` 92-100, from the prompt's `Lane:` header line or its file name: merge, fast, discovery, phase2 | not read: `promptHeader` (`collect.mjs:138-145`) keeps only `Front:` and `Chat:` | **`kind` column** |
| Card: tier | the first token of `tier.txt` (551) | `lanes.tier` (`collect.mjs:217`), heavy or light | none |
| Card: `direct` badge | `direct.json` exists (585, 2100); it is a flag, not a kind | measured: all 181 lanes with no `session_id` have a `direct.json`. `merge_state` is set from `result.json` | encoded as `kind = 'merge'` plus `session_id IS NULL` (no new column) |
| Card: elapsed vs median | `estimate` 184-199 against the **hard-coded** `MEDIAN = {discovery:28, phase2:38, merge:5, fast:6}` (46). Elapsed on the card is `work` (2041) | `started_ms`; no median | `kind` plus `work_ms`; Phase 2 computes the median per kind from the store, with no constant |
| Card: title | the prompt header (73-89) | not read | **`title` column** (the first `# ` line of the same prompt file) |
| Card: phase progress `4/5 · Commit` | `progressOf(kind, laneEvents(log.jsonl))` 442. It walks a ladder of milestones (210-215: 8 for phase2 and fast, 6 for discovery, 5 for merge). A milestone is reached when a tool call matches the regexes at 217-246. `4/5` is the count reached, not a position. The label is the **last** milestone reached (437-438), not the next one. The second line is `phaseOf` 177-180, the last tool-call `description` in the last 256 KB | not read | **disabled** (§2) |
| Card: started | `start`, the first turn's start (978-986) | `started_ms` | none |
| Card: tokens in | `tokensOf` 696: input + cacheRead + cacheCreation over the main calls, one per message id (`lane-usage.mjs:185`) | `calls(input, cache_read, cache_creation, sidechain)` joined on `sessions.unit = lanes.id` | none: measured, 431 of 431 non-direct lanes join |
| Card: context peak | `ctxMax`, the maximum per main call (`lane-usage.mjs:202,226`) | `MAX(calls.context)` where `sidechain = 0` (as in `notifier.mjs:111`) | none |
| Card: worktree | `worktree.txt` | read but not stored (`collect.mjs:219`, used only for the repo link) | **`worktree` column** |
| Card: launched by chat | `launcherOf` 1037-1050: the `Claude-Session:` trailer of the commit that added the prompt, else the `Chat:` header, else the `Model:` trailer | `lanes.chat` (the `Chat:` header) | partial: header only, trailer inference not ported (§7, Q3) |
| Table: outcome | the last `Outcome:` line | `lanes.last_outcome` (plus `outcome`) | none |
| Table: window | the start-end range | `started_ms`, `end_ms` | none |
| Table: work and span | `laneTimeline` 926-974 builds the turns (each starts at the `input-k.md` mtime and lasts the k-th result's `duration_ms`, clamped to the next input). `work` = sum of turns (978-986); span = end − start (2068, 2160) | the turns are computed in `readLane` (`collect.mjs:183-197`) **with the same rule**, then dropped | **`work_ms` column**; span is derivable |
| Table: tokens, cost | as on the card; cost = the maximum `total_cost_usd` (761-780, 800) | `lanes.cost_usd`, the same rule (`collect.mjs:233`) | none |
| Table: context and arch | `arch` = the **architect chat's** tokens for the lane, from `architect.json` (719-725, `lane-usage.mjs:162-182`) | not read | **disabled**: measured, only 20 of 614 lane folders have one |
| Left list by state | `STRIP` 1642, `renderStrip` 1966 | derivable from `live`, `last_outcome` and `resolved` | `resolved` |
| Needs attention: stale | a waiting item open more than `ATTENTION_STALE_H = 72` h (1705, 1739). It is counted, not listed | `last_outcome`, `end_ms` | closure (below) |

**Closure.** The 4700 board closes a waiting lane in any of three ways (1716-1722):
1. The trunk prompt's `Status:` line no longer reads `da eseguire` (`trunkStatus` 1204, via `git ls-tree`).
2. A later lane names it in `Depends:` or `Corregge:` (1250-1254).
3. A trunk commit names its ID after the lane started.

Tack has (3): `commits.unit`, with `commit_time` later than `lanes.end_ms` (`schema-2.sql`, read). It does not have (1) or (2). Phase 2 uses (3) only, and the page says so in the tooltip of the attention list (Q2).

**Refresh on 4700.** The client polls every 30 s (`REFRESH_S` 35, `setInterval` 2252). The server caches the snapshot for 10 s (`CACHE_MS` 43), kills a status run after 15 s (517), and serves the last good snapshot marked `stale` (525-528).

## 2. What closes with the collector extension, what does not

**One extension: store schema 6, six new `lanes` columns**, all filled in `readLane` (`collect.mjs:171-236`):

| Column | Value | Read cost |
|---|---|---|
| `kind` | `merge`, `fast`, `discovery`, `phase2` or null, from the `Lane:` header line, with the same rules as `kindOf` 92-100 (including the file-name fallback for merges) | none: `promptHeader` already reads the 8 KB head |
| `title` | the first `# ` line of the same head, capped at 200 characters | none |
| `work_ms` | the sum of `turns[i].e - turns[i].s` | none: the turns are already computed |
| `worktree` | `worktree.txt` | none: already read |
| `resolved` | `resolved.txt` exists | one `existsSync`; added to `laneKey` |
| `adoptions` | the item count of the «Decisions taken (unattended)» section in the text of the last `result` event; null when the section is absent (§3) | none: `results(buf)` already parses the result events |

`LANE_COLUMN_SOURCES` documents all six. `laneKey` (`collect.mjs:160-165`) adds `resolved.txt` and `direct.json` to its key. The rest of the page is store queries.

**Not in this slice: shown as disabled elements with the reason, never as a number.**
- **Phase progress.** The 4700 ladder is defined by tool-call regexes for this repository's gate commands (217-246: tests first, gates, probe). It is not project-agnostic, and porting it means parsing every tool call of `log.jsonl`. The reason to show: «Phase progress is not tracked in v0: the milestones are specific to the repository's gate commands». A ladder set in `tack.json` is a later design slice.
- **The "arch" context.** It is a chat-side file present in 20 of 614 lane folders (measured), and it is not part of the lane-run run itself. The reason to show: «Architect-chat tokens are not collected in v0».
- **The trailer-based launched-by.** The page shows the chat from `Chat:` when present, and «—» otherwise. The reason is in the tooltip.

## 3. Unattended decisions in the lane logs

The search covered the lane folders, `docs/decisions.md`, `docs/log-inbox/*.md`, the active log and the discovery reports. The counts were measured by parsing the files.

- **Lane `result` event** (the closing message: one JSON line of `log.jsonl` with `"type":"result"`; its key order varies). 614 folders: 2 have no `log.jsonl`, 183 have no `result` event, 429 have one. In those 429:

  | Marker | Lanes |
  |---|---|
  | `Decisions taken (unattended)` | 40 |
  | `provisional, unattended` | 11 |
  | `ratified as recommended, unattended` | 1 |
  | `Recommended:` | 77 |
  | `unattended`, any use | 171 |

  Attribution is exact, because the folder name is the Prompt-ID. False positives: `input-1.md`, the prompt, cites RC-21 in 331 lanes and quotes the full marker in 64. So the parse reads the `result` text only, never the folder, and never matches the bare word `unattended`. 29 lanes have more than one run; the last `result` event wins, as for `last_outcome`.
- **`docs/decisions.md`.** It has 8 lines with `ratified as recommended, unattended` and 8 with `provisional, unattended`. Three of them are rule text (`:163` RC-21, `:194` RC-25, `:297` RC-51). The rows themselves carry no Prompt-ID: `R-GEN-12..15` (`:5986-5999`), `R-REF-6` (`:5915`), `R-LIB-19` (`:6238`). The ID sits in a section heading at best, and some series have none. About 7-9 Prompt-IDs can be attributed. **Not reliable** for v0, and it is also Jjodel-specific.
- **Discovery reports.** 92 of 631 have a «Decisions taken (unattended)» section, written in at least four heading forms (`##`, `###`, bold inline, plain text) and sometimes repeated. 88 of them carry a `Prompt-ID:` header, and 84 have non-empty content. The coverage is better, but the format is loose, and it is this repository's convention (RC-26), not lane-run's.
- **The prompt logs.** `unattended` there means an unattended lane or smoke check («Smoke visivo: passato — chat, unattended»), not an adopted decision. These logs are **not a source**.

**The panel's shape (input to `tack/ROADMAP.md`, autonomy policy).** A read-only "Unattended decisions" panel on the Lanes page. One row per lane where `adoptions > 0`: the Prompt-ID, front, chat, the end time, the count, and the last outcome. The heading reads «as reported in each lane's closing message». The panel stores the count only. Item text is not kept, in line with `readLane`'s rule that text is classed and dropped (`collect.mjs:168-169`). The empty state is «No lane reported an unattended decision». Discovery reports and `decisions.md` stay out of v0. Joining them is the commit-trailer design that ROADMAP constraint 5 already names.

## 4. Project-agnostic behaviour

In Tack today, absence is an empty `lanes` set for the current selection. Layer 3 returns `'not-adopted'` when there is no log and no lane (`src/metrics/layer3.mjs:19-24,74`), and the API maps that string to a state (`src/board/api.mjs:186`). The Insights view renders `Not adopted: needs <enabledBy>` (`src/board/insights.js:128-130`). The collector does nothing when the lane root (`TACK_LANES` or `~/.jjodel-lanes`, `collect.mjs:37,254-255`) does not exist. Lanes link to a repository through `worktree.txt` matched against `repos.toplevels`, else through the session's `session_repo` (`collect.mjs:239,280`).

The Lanes page decides among four states, in this order:
1. `harness.laneRun = 'off'` in the repository's settings (`contract/v1/settings.json:74`): «Lanes are turned off for this repository (harness.laneRun)».
2. The lane root does not exist: «No lane-run folder on this machine (<path>)».
3. The root exists, but no `lanes` row belongs to the selected repositories: «No lane-run lanes for this repository».
4. Otherwise, the page.

In states 1-3 the page shows no tiles, no zeros and no table, only the sentence. That mirrors the `not-adopted` cards. The API returns `{ state, reason }` the way `metricsApi` does.

## 5. Live refresh

Read:
- The notifier tick runs every 20 s (`src/notify/watch.mjs:13,49`). It runs `scan` and `collectLanes` on each tick (`:33-35`), but only under the store's lease (`:29-30`).
- The board starts the watcher only when notifications are on (`src/board/server.mjs:155`). **The 4710 board runs with `TACK_NOTIFY=off`** (log entry of slice 7, `docs/log-inbox/tack.md:230`), so nothing collects between `POST /api/rescan` calls.
- The board client has no poll today (`src/board/board.js:197-206`). Only the load strip polls, every 5 s, and it pauses while the tab is hidden (`src/board/loadmeter.js:58,73`).

Measured on the store copy (`node:sqlite`, 612 lanes, five runs each):

| Call | ms |
|---|---|
| `collectLanes` | 95.7 cold, then 55.9-57.2 warm. Live lanes are re-read on every call, exited ones only when their cache key changes |
| `scan` (transcripts) | 128.6 cold, then 16.9-17.1 |
| a 24 h lanes query with a correlated spend sum | 0.2-0.4 |

**Proposal.** `GET /api/lanes` runs `collectLanes` itself when no fresh `notify_lease` heartbeat exists and its own last collection is older than `TICK_MS`. With a live watcher it only reads. The page polls `/api/lanes` every 20 s while its tab is visible, on the `loadmeter.js` pattern. The cost is at most about 60 ms every 20 s, under 0.3 % of one core. The page also shows «updated <time>», taken from the most recent collection.

## 6. Phase 2 plan (three commits)

1. **`feat(tack): lane-run collector, schema 6`**
   - Files: `src/store/schema-6.sql` and `open.mjs` (`SCHEMA_VERSION = 6`); `collect.mjs` (the six columns of §2, `LANE_COLUMN_SOURCES`, `laneKey`).
   - Tests in `test/lanes.test.mjs`, using `writeLane` (`test/helpers/layers-fixture.mjs:45`):
     - `kind` for each `Lane:` form, including the merge file-name fallback;
     - `title`;
     - `work_ms` equal to the sum of the turns on a two-turn fixture, with a wait between them excluded;
     - `resolved` flipping with `resolved.txt`, which also invalidates the cache;
     - `adoptions`: 3 items, the section absent (null), "none" (0), and the marker in `input-1.md` only (null);
     - a v5 store migrating to v6.
2. **`feat(tack): /api/lanes`**
   - Files: `src/board/api.mjs` (`lanesApi`), `server.mjs` (route, collect-on-read throttle).
   - Payload: `state`, `reason`, `tiles`, `attention` (`waiting`, `blocked`, `staleCount`), `running`, `last24`, `byState`, `adoptions`, `medianByKind` (per-kind median of `work_ms` over the `done` lanes of the last 30 days, n ≥ 5 per kind, else absent), `updatedMs`.
   - Tests:
     - the four §4 states;
     - tile counts on a mixed fixture;
     - the waiting predicate, with closure by a commit and staleness at 72 h;
     - the token and context join;
     - the median absent below n = 5;
     - the throttle: a second read within 20 s collects nothing.
3. **`feat(tack): Lanes page`**
   - Files: `src/board/lanes.js` (`TackViews.lanes`), `page.html` (tab and section), `board.js` (`TABS`, made the first tab), the `ASSETS` entry in `server.mjs`, `board.css` (tokens only), `README.md`.
   - Tests: a view test on the `test/helpers/views.mjs` pattern:
     - running cards with the median label, or none;
     - the disabled phase and arch cells with their reasons;
     - the empty-state sentence;
     - the 20 s poll paused while hidden.

   Visual check by the chat after exit, on 4710 (RC-23).

Expected suite size: 185 plus about 20 tests.

## 7. Open questions

- **Q1. Make Lanes the board's first and default tab?** That is the view used most on 4700 (R-TACK-3).
  Recommended: yes. Lanes becomes the first tab and the default, and Sessions stays one click away.
- **Q2. Closure without the trunk prompt `Status:` and without `Depends:`/`Corregge:`.** Should a waiting lane close only on a commit that names its ID?
  Recommended: yes for v0, saying so in the tooltip. Reading the trunk `Status:` is Jjodel-specific and stays on 4700.
- **Q3. Launched-by.** Is the `Chat:` header enough?
  Recommended: yes. Lanes without the header show «—». Trailer inference is not ported.
- **Q4. The median.** Should it be measured from the store, or should the 4700 constants be copied?
  Recommended: measured from the store, per kind, n ≥ 5, last 30 days. No constant.
- **Q5. Live refresh.** Should `/api/lanes` collect on read when there is no watcher?
  Recommended: yes, throttled to 20 s and skipped while a fresh notifier lease exists.

## 8. Decisions taken (unattended)

1. The phase ladder and the arch context are disabled with a reason, not ported (§2). Provisional, unattended.
2. The adoption panel counts adoptions from the closing `result` event only and keeps no text (§3). Provisional, unattended.
3. The four absence states and their order (§4). Provisional, unattended.
4. No prompt-log entry is written in this lane: the prompt's DOVE names only this report and the Status line. The closing entry is owed by Phase 2, or by the chat. Provisional, unattended.
5. The `direct` badge is derived from `kind = 'merge'` plus a null `session_id`, with no new column (§1). Provisional, unattended.

## 9. Decisions awaiting Alfonso

None. No item of the RC-26 list is touched: no critical zone, no deletion, nothing in the MODELS demo, no push, and no change to `frontend/scripts/lane-board/` (R-TACK-2) or to `lane-run.mjs`.
