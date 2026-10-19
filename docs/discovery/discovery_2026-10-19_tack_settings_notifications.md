# Discovery: Tack slice 7, settings, notifications and host load meter (Phase 1)

- Prompt-ID: P-2026-10-19-1800
- Prompt: `docs/prompts/claude_2026-10-19_1800_prompt_tack_s7_settings_notifications.md`
- Session: b9aa4088-9477-4bb8-8771-0e087ef2ef47
- Tree: `~/jjodel-w-tack-s7`, branch `tack-s7`, HEAD `bf259570f`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

"Read" marks a claim taken from a file; "measured" marks a run in this phase, on this HEAD, on this Mac,
2026-10-19 18:20-18:30, against a copy of the slice 6 store (`/tmp/tack-s6/real.db` copied to
`/tmp/tack-s7-probe/store.db`; nothing written anywhere else).

## 0. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Every event of the catalogue can be derived from what the collectors store today | **Partly.** 4 today, 8 with a small collector change, 1 from the sampler, 1 from a file outside the store, 1 not derivable in v0 (§1) |
| H2 | Tack already has a feature model or a config file the three levels can extend | **Falsified.** No config file, no settings, no feature model in `tack/` (§3) |
| H3 | The board refreshes the store periodically, so a notifier inside it can read fresh rows | **Falsified.** It scans on start and on `POST /api/rescan` only (§2.3) |
| H4 | A full incremental scan is cheap enough to run on every notifier tick | **Falsified.** 5.8 s wall, of which identity 3.8 s; transcripts plus lanes 0.31 s (§2.3, measured) |
| H5 | Theme tokens can be introduced without changing a light colour | **Holds.** Every colour of the page is a token of `board.css:3-10`; no hex literal in the scripts (§5) |
| H6 | The lane store says which front and chat launched a lane | **Falsified.** `lanes` has no such column; the prompt file header has both (§1, scope) |

## 1. The event catalogue, one row per event

Store columns read from `tack/src/store/schema*.sql`; the lane adapter from `tack/src/collectors/lane-run/collect.mjs`.

| Event (default) | Derivable | Source, evidence | Change needed |
|---|---|---|---|
| lane `question` (on, urgent) | small change | `lanes.outcome` is the **last** `Outcome:` line of the whole log (`schema-4.sql:18` «last Outcome: line of log.jsonl»; `collect.mjs:102`). On a resume the old word stays until the new turn ends, so `outcome` alone would fire a false second `question` | add `lanes.turns` and `lanes.last_outcome` (the Outcome word of the last turn-closing `result` event, already computed by `results()` at `collect.mjs:58-68`); fire when `live = 0` |
| lane `hard-stop` (on) | small change | same | same |
| lane `blocked` (on, urgent) | small change | same; `blocked_run` exists (`schema-4.sql:19`) but marks any run, not the current state | same |
| lane `done` (off) | small change | same | same |
| lane started (off) | **today** | a new `lanes` row with `started_ms` (`schema-4.sql:13`, `collect.mjs:142` `Number(readTrim(join(dir, 'started.txt')))`; measured: `started.txt` holds `1792426896588`, epoch ms) | none |
| gate red (on) | small change | `result.json` of a direct merge: `gates[]` with `ok`, top-level `ok`, `reason` (measured on 173 files: 156 ok, 17 not ok; reasons «red gates: vitest; the merge commit stays» ×14, «red gates: check:docs; ...» ×1, ...). Written by `frontend/scripts/lane-run.mjs:2703` `writeJson(join(f.dir, 'result.json'), res)`. Not read by the adapter today, and not in its cache key (`collect.mjs:124-125`) | add `result.json` to `laneKey`; columns `merge_state` (`merged`, `red`, `blocked`), `gates_red` |
| context ceiling hard (on) | **today** | `calls.context` and `calls.sidechain` (`schema.sql:34,39`); the hard ceiling is 250,000 in Jjodel's hook (`frontend/scripts/hooks/context-ceiling.mjs:52` «export const DEFAULT_HARD = 250000;») | none; threshold as a project key |
| critical-zone ask pending (on) | small change | lane-run's tier reason names the critical zone: `lane-run.mjs:658` «if (ctx.goahead) return forced('--critical-zone-goahead');», `:661-662` «return forced('names ' + cz);»; the adapter keeps only the first word of `tier.txt` (`collect.mjs:177`). Measured tally of `tier.txt` first lines: «names useJjomSync.ts» ×10, «--critical-zone-goahead» ×10. Pending = critical lane, last turn `question` or `hard-stop`, not live | column `lanes.critical` from the tier reason (`names ` or `--critical-zone-goahead`) or a `goahead.txt` |
| lane silent N min (on, 15) | small change | no column holds the lane's last activity; the log mtime sits only inside the opaque `cache_key` (`collect.mjs:126`) | column `lanes.log_mtime_ms`; condition `live = 1 and now - log_mtime_ms >= N` |
| merge conflict (on) | **not in v0** | lane-run refuses a conflicting merge at plan time, before any lane file: `lane-run.mjs:1976-1977` «const hard = m.conflicts.filter((p) => !isUnion(p)); if (hard.length) out.push('a conflict the union rule does not cover: ' ...» then `:2170` `refuse(...)`, to the terminal. The worker's late abort (`throw new Error('conflicts the measurement did not show, ...')`) reaches `result.json.reason`, measured 0 of 173 | disabled row, reason: «lane-run reports a conflict on its terminal, before writing a lane file» |
| merge completed (off) | small change | `result.json` `ok: true` with a `merge` sha (measured shape: `kind`, `merge`, `gates`, `ok`, `outcome`, `reason`, ...) | the `merge_state` column above |
| daily spend over threshold (off) | **today** | `sessions.cost_usd` by the local day of the first event, the `cost_per_day` metric (README:123); per repository through `session_repo` | none; threshold as a project key, default none (inert until set) |
| host load over threshold (off) | sampler | `os.loadavg()`; measured now: 1/5/15 = 11.55 / 35.13 / 36.40 on 8 cores | the sampler of §5b |
| unpushed commits over N (off) | small change | `commits` has no reachability; `repos.tips` holds refs and tips (`schema-2.sql:12`), not a count | `repos.unpushed` from `git rev-list --count --branches --not --remotes` per clone (read-only, no fetch: relative to the last fetched remote refs), max over clones |
| transcript retention shorter than the analysed window (on) | outside the store | `cleanupPeriodDays` of `~/.claude/settings.json`: measured absent (`command grep -n cleanupPeriodDays`, exit 1; positive control: the file has 33 lines containing `"`), so Claude Code's default of 30 days holds, as the v0 report found (`discovery_2026-10-19_tack_v0_extraction.md:277`) | read the file at evaluation time; window = a project key (§6, Q4) |

Scope filters (all lanes, fronts, chats): `lanes` has no front or chat (`schema-4.sql:9-24`). The lane folder's
`prompt.txt` holds the prompt path (measured: `/Users/alfonso/jjodel-release/docs/prompts/claude_2026-10-19_1800_...md`),
whose header carries `Chat: C-2026-10-19-1748` and `Front: tack` (measured, lines 4-5). Small change: columns
`lanes.front` and `lanes.chat`, read from the header lines only, in memory; the path is not stored.

## 2. The rising-edge model

### 2.1 Transitions and their keys

Dedup key `(rule, unit, transition)`; the transition string changes once per occurrence, so a second
occurrence of the same state is a new key and a poll that sees the same state again is not.

| Rule | unit | transition | Columns |
|---|---|---|---|
| lane outcome (4 rules) | lane id | `<outcome>#<turns>` | `lanes.last_outcome`, `turns`, `live` |
| lane started | lane id | `started` | `lanes.started_ms` |
| gate red / merge completed | lane id | `red` / `merged` | `lanes.merge_state` |
| context hard | lane id via `lanes.session_id`, else `sessions.unit`, else the session id (8 chars) | `context-hard` | max `calls.context` where `sidechain = 0` |
| critical-zone ask | lane id | `cz#<turns>` | `lanes.critical`, `last_outcome`, `turns`, `live` |
| level conditions: silent, daily spend, load, unpushed, retention | lane, repository + day, `host`, repository, `host` | `episode@<start ms>` | an episode opens when the condition turns true and no episode is open; it closes when false (load re-arms below 85% of the threshold, the amber edge, so it does not flap) |

### 2.2 Restart and first run
`notify_events` persists every key with a status (`baseline`, `delivered`, `queued`, `failed`). On the first
evaluation of a rule (no row in `notify_baseline` for it), every currently true transition is inserted as
`baseline` and nothing is sent; the same happens when a rule is switched on later, so enabling a toggle never
floods. A restart finds the rows and sends nothing old. Delivery is claim-then-send: `INSERT OR IGNORE`, and only
the process whose insert changed a row sends, so two notifier processes cannot deliver one key twice.

### 2.3 Freshness: the notifier needs its own collection tick
The board scans only on start and on the rescan POST: `server.mjs:61` «let lastScan = scanOnStart ? runScan(db, root) : null;»,
`server.mjs:73-76`. No timer exists in `server.mjs` or `board.js` (read whole). Measured on the store copy, per
collector, an idle incremental pass: transcripts 228 ms, identity 3,845 ms, git 463 ms, layers 407 ms, lanes alone
86 ms; the CLI `scan` 5.84 s wall. Live lanes 3. So the tick is **transcripts + lanes every 20 s** (about 0.3 s,
synchronous), and identity + git (needed by `unpushed`) only on start, on Rescan and every 30 min.

## 3. Existing feature model and config, and the three levels

Search: `command grep -rn -i -m 5 -E "feature|harness|config|settings|tack\.json|cleanupPeriod"` over `tack/`
with `--include` for mjs, js, json, md: exit 0, hits only in tests (`git config` in `test/git.test.mjs:164-177`,
`test/helpers/git-repo.mjs:12`), README:107 and `package.json:4` «Project-agnostic monitor for agent-assisted
development harnesses». That run is its own positive control (the hits prove the search reached the tree).
**No config file, no settings and no feature model exist.** What is "modelled" today is implicit:

- layers 2 and 3 are detected from the data, `not adopted` otherwise (`metrics/stubs.mjs:15-16`, README:132-133);
- the lane adapter switches on when the folder exists (`collect.mjs:202` «if (!existsSync(root)) return st;»);
- environment: `TACK_STORE` (`store/open.mjs:13`), `TACK_LANES` (`collect.mjs:30`), `TACK_IMPORTS`, `JJODEL_TRUNK` (README:154,189);
- hard-coded thresholds: 200,000 context (`board/api.mjs:12`, `metrics/layer1.mjs:106`), 5 min wait gap (`layer1.mjs:142`), 90 min over-time (`collect.mjs:183`), 1 h commit window (`store/sessions.mjs:14`).

Mapping: project keys `harness.unitIds`, `harness.laneRun` and `harness.log` default to `auto` (today's detection),
the thresholds become project keys with today's values as defaults. Because every default equals today's behaviour,
a repository with no `tack.json` computes exactly what it computes now.

`tack check` today takes one optional file and validates it as JSON Lines (`bin/tack.mjs:53-70`); the tests call it
with an explicit path only (`test/check.test.mjs:52,59,73`). Keeping `check [file]` and dispatching by basename
(`settings.json`, `tack.json`, `tack.local.json` → settings validator at the level the name implies; `--level` to
override for samples; anything else → the log) leaves every current fixture and test untouched.

## 4. Schema 5, additive

`openStore` applies the files above the stored version in one transaction (`store/open.mjs:24-31`), so
`schema-5.sql` plus `SCHEMA_VERSION = 5` and a fifth entry in `SCHEMA_FILES` (`open.mjs:6,9`) is the whole mechanism:

```sql
ALTER TABLE lanes ADD COLUMN turns INTEGER;          -- turn-closing result events
ALTER TABLE lanes ADD COLUMN last_outcome TEXT;      -- Outcome word of the last of them, '' when none
ALTER TABLE lanes ADD COLUMN log_mtime_ms INTEGER;   -- mtime of log.jsonl
ALTER TABLE lanes ADD COLUMN critical INTEGER;       -- tier reason names the critical zone, or goahead.txt
ALTER TABLE lanes ADD COLUMN front TEXT;             -- Front: of the prompt header
ALTER TABLE lanes ADD COLUMN chat TEXT;              -- Chat: of the prompt header
ALTER TABLE lanes ADD COLUMN merge_state TEXT;       -- result.json: merged, red, blocked; null without one
ALTER TABLE lanes ADD COLUMN gates_red INTEGER;
ALTER TABLE repos ADD COLUMN unpushed INTEGER;
CREATE TABLE notify_events (rule TEXT NOT NULL, unit TEXT NOT NULL, transition TEXT NOT NULL, seen_ms INTEGER NOT NULL,
  closed_ms INTEGER, status TEXT NOT NULL, delivered_ms INTEGER, channels TEXT, urgent INTEGER NOT NULL,
  PRIMARY KEY (rule, unit, transition));
CREATE TABLE notify_baseline (rule TEXT PRIMARY KEY, at_ms INTEGER NOT NULL);
CREATE TABLE notify_lease (id INTEGER PRIMARY KEY CHECK (id = 1), pid INTEGER NOT NULL, heartbeat_ms INTEGER NOT NULL);
CREATE TABLE host_load (minute_ms INTEGER PRIMARY KEY, load1 REAL, load5 REAL, load15 REAL, cores INTEGER, running_lanes INTEGER);
UPDATE lanes SET cache_key = '';                     -- every folder read once to fill the new columns
```

No row and no column is dropped. The cache-key reset re-reads 595 folders once (the slice 5a first scan, all
collectors, was 41.2 s: `docs/log-inbox/tack.md:178`). `unpushed` is filled for rows where it is null without
resetting `repos.tips`, so no repository is re-read in full. Every new column is an id, enum, count or time; the
privacy test reads `LANE_COLUMN_SOURCES` (`test/privacy.test.mjs:11`), which gains the new columns.

## 5. The settings page inside the board, and theme tokens

- Routing: assets are a fixed map served from memory (`server.mjs:17-25`); the page is one document with hash tabs
  (`board.js:51` «const TABS = ['sessions', 'timeline', 'insights'];», `:83-90`). `/settings` serves the same page;
  `board.js` shows a fourth tab when the path is `/settings`; a new `settings.js` registers it in `TackViews`
  like `timeline.js` and `insights.js` (`board.js:47`, `page.html:47-50`).
- API: `GET /api/settings` (effective value and source level of each key, the schema, the three paths, whether
  `tack.local.json` is git-ignored) and `POST /api/settings` (`{ target: user | local, repo, key, value }`). The
  existing Host and Origin checks cover the POST (`server.mjs:66-69`). A project-level key is refused with 403: the
  server never writes `tack.json`.
- Theme: every colour is a token in `board.css:3-10`; measured `command grep -c -E "#[0-9A-Fa-f]{3,6}\b"` → 0 in
  `charts.js`, `timeline.js`, `insights.js`, `board.js` (positive control: the same command on `board.css` → 8 lines).
  Today dark comes only from `board.css:7` «@media (prefers-color-scheme:dark){:root{...». The light block (`:3-6`)
  stays byte-identical; the dark block becomes `:root[data-theme=dark]` plus the same values under
  `@media (prefers-color-scheme:dark)` for `:root:not([data-theme])` and `[data-theme=system]`; `high-contrast` is a
  third block. The server writes `data-theme` into the served `page.html`, so no flash before the script runs.
  A test freezes the 25 light token values (measured count) of `:3-6` and compares them with the new file.
- Reduced motion exists once (`board.css:41`); the setting adds `[data-motion=reduce]` with the same rule.

### 5b. The host load meter
- Sampler: one module, `src/host/load.mjs`, a 60-slot ring fed every 5 s by `os.loadavg()`; one instance per process.
  Stored samples and notifications are gated by the notifier lease (`notify_lease`, heartbeat each tick, taken
  over after 3 missed ticks), and `host_load` is keyed by the minute with `INSERT OR IGNORE`, so a board and a
  `tack notify --watch` running together store one sample per minute and notify once. The display ring is
  per-process (cheap, no side effect), so the board's strip is live even when `notify --watch` holds the lease.
- Push: a light endpoint `GET /api/load` polled every 5 s while the page is visible (ring, current 1/5/15, cores,
  threshold, running lanes, ticks). The page has no refresh loop today (`board.js:166-185` loads on init, on a
  selection change and after Rescan), so reusing it would reload sessions, metrics and timeline every 5 s.
- Ticks: `lanes.started_ms` and `lanes.end_ms` (`schema-4.sql:13-14`, end = `exit.txt` mtime, `collect.mjs:141`),
  fresh within one 20 s lane tick; a tick goes above bar i when a start or end falls in `(t[i-1], t[i]]`. Running
  lanes = `lanes.live = 1`.
- Zones on the raw value: red above the threshold, amber from 85% of it up to and including it, neutral below;
  normalised mode divides values and the line by `os.cpus().length` (measured 8).

## 6. Decisions taken (unattended)

Each `ratified as recommended, unattended` under RC-21/RC-25; Phase 2 implements them unless vetoed.

1. Merge conflict is a disabled catalogue row in v0 (§1). Recommended: as stated.
2. Lane outcome events fire on `last_outcome` of the last turn with `live = 0`, keyed `<outcome>#<turns>` (§2.1). Recommended: as stated.
3. Per-rule baseline on first run and on enable; claim-then-send dedup (§2.2). Recommended: as stated.
4. Retention event: true when `cleanupPeriodDays` (absent → 30) is shorter than project key `history.windowDays` (default 30). Recommended: as stated; a gap detector is post-v0.
5. Notifier tick: transcripts + lanes every 20 s; identity + git every 30 min, synchronous; a worker thread is post-v0 (§2.3). Recommended: as stated.
6. A settings key is one merge unit; an event row (`enabled`, `scope`, `channels`) is one key, so each row has exactly one source level. Recommended: as stated.
7. Unknown keys: an error of `tack check`, ignored with a warning by the loader. A string that looks like an ntfy or webhook URL in `tack.json`, under any key, is `settings-secret`. Recommended: as stated.
8. Project keys of an event come from the event's repository; host-wide events (load, retention) from the repository the process started in, else the defaults; local overrides likewise. Recommended: as stated.
9. The UI writes rows to the user file by default; `tack.local.json` only when chosen, with a warning when `git check-ignore` says it is not ignored (an untracked file in a release tree can trip lane-run's clean-tree checks). Recommended: as stated.
10. Font scale through CSS `zoom` on `.app` (charts measure `clientWidth`, which stays in layout pixels); density through `[data-density=compact]`. Recommended: as stated.
11. `PRAGMA busy_timeout = 5000` in `openStore`, so a board and `notify --watch` sharing the store wait instead of failing. Recommended: as stated.
12. Tests never reach a real transport: transports injected; `tack notify test <channel> --dry-run` prints what it would send, and the CLI tests use only that. Recommended: as stated.

## 7. Decisions awaiting Alfonso

None. Nothing here is on the RC-26 list: the schema bump is additive, no file or persisted data is deleted, no
interface outside the lane changes, no push.

## 8. Dependencies and risks

- Lane events depend on the lane-run adapter (`TACK_LANES`); on a repository without lane-run only the transcript,
  git and host events exist. The scope filter by front and chat depends on the prompt header convention.
- `last_outcome` reads the `result` event's text for the Outcome word, as `results()` does (`collect.mjs:64`); a
  lane whose final message omits it yields `unparsed`, no notification.
- ntfy titles go in an HTTP header: non-ASCII must be stripped or encoded, or `fetch` throws.
- The 20 s tick blocks the board's event loop for about 0.3 s; the 30-min full pass for about 4.3 s (measured above).
