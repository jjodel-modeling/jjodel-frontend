# Discovery: Tack v0, inventory of the lane board and extraction plan (Phase 1)

- Prompt-ID: P-2026-10-19-1100, `docs/prompts/claude_2026-10-19_1100_prompt_tack_v0_extraction_disc.md`
- Session: 31da5f16-af25-4d5a-aa67-22383ddaed52, chat C-2026-10-19-0001, front `tack`
- Tree: `~/jjodel-w-tack-disc`, branch `tack-disc`, HEAD `dbffd91ce` at start
- Executor: Anthropic Claude Opus 5.5 (session banner)
- Method: the board files were read whole by four read-only explorer subagents (Sonnet, RC-49), one per file group;
  their line references were spot-checked here on 27 lines, all matching. The zero-adoption numbers come from
  throwaway scripts under `/tmp/tack-p1100/` (not committed). Tags: **[measured]** = run in this phase on HEAD
  `dbffd91ce` and the transcripts as of 2026-10-19; **[read]** = read from a file or document.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the
real files.

## 0. Answer in brief

1. **Today's board never reads Claude Code's own transcripts.** It reads the stream-json copy that `lane-run` writes
   per lane (`log.jsonl`), plus lane-folder files, git, and the trunk's docs. A zero-adoption Tack needs a **new**
   collector for `~/.claude/projects/*/*.jsonl`; the per-call usage reader of `lane-usage.mjs` carries over because
   the `message.usage` shape is the same in both formats, cost does not (`result.total_cost_usd` exists only in
   stream-json; transcripts carry `cost-state.totalCostUSD`). [read + measured]
2. **Couplings: 501 occurrences across 8 code files** (plus about 72 in the README): harness convention 235,
   Jjodel domain 116, Claude Code platform 93, environment 57. The harness-convention class dominates: the board is
   built on the lane-folder contract of `lane-run` and on the log format, not on Jjodel's code. [read]
3. **Zero-adoption works for the measured metrics** on two non-Jjodel repositories, with two gaps: commit linkage
   is lost when the clone is gone (8/8 sprotty sessions), and transcripts older than about 30 days are gone
   (oldest file 2026-09-17), so Tack must ingest continuously. [measured]
4. **Data contract v1** keeps 9 fields of §21.2 (5 renamed to English), drops 2 (`Layer Impact Report`,
   `Smoke visivo`) and replaces `Prompt document name` with the identity key. A JSON Schema would validate three
   enums `check:docs` never checks (Outcome, Regressions, Out-of-scope) and the conditional `Causa` rule of §21.3;
   it would lose the cross-record checks (Corregge resolution, front registry, entry count). [read]
5. **Extraction is a copy, not a move**: Jjodel's board stays where it is and unchanged until Tack reaches parity on
   Jjodel through an adapter. Seven slices, the last being the v0 criterion.
6. **Gate note:** `check:docs` is already red at HEAD `dbffd91ce` on Check E: front `tack` is not in
   `docs/harness/fronts.json`. Not caused by this lane, not fixed here (outside DOVE). [measured]

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Every board item maps to exactly one of collector, metrics, board, harness engine, or is out of scope | **Holds**, with one split: `lane-board.mjs` mixes all three of C, M, B in one file and reuses server functions in the page through `.toString()` (`lane-board.mjs:1819-1821`), so the split is by function, not by file (§2) |
| H2 | The Jjodel-domain couplings are the bulk of the extraction work | **Falsified**: 116 of 501 (23%); harness convention is 235 (47%) (§3) |
| H3 | The board can be fed from git plus local transcripts alone | **Partly**: sessions, cost, tokens, context, time, parallelism, commit proximity yes; outcome, rework, first-shot, kind, unit grouping no (§4) |
| H4 | The §21.2 format can become a JSON Schema without losing what `check:docs` guards | **Partly**: per-entry checks carry over and get stricter; cross-record checks need code beside the schema (§5) |
| H5 | Non-Jjodel transcripts exist on this Mac | **Holds**: 23 of 285 project directories, 30 of 584 transcripts (§4.2) |

## 2. Inventory (COSA 1)

Files in scope, sizes measured with `wc -l` at HEAD:

| File | Lines | Read by |
|---|---|---|
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-board/lane-board.mjs` | 2077 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-board/insights.js` | 461 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-board/timeline.js` | 455 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-board/requirements.js` | 439 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-board/README.md` | 454 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-usage.mjs` | 363 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-tracking.mjs` | 852 | explorer, whole |
| `/Users/alfonso/jjodel-w-tack-disc/frontend/scripts/lane-run.mjs` | 3448 | explorer, **windows only**: 325-536, 775-1022, 1190-1300, 1355-1395, 1520-1541, 2120-2216, 2360-2422, 2476-2523, 2568-2710, 2820-2870, 3025-3121, 3380-3404 |
| `/Users/alfonso/jjodel-w-tack-disc/docs/discovery/harness/harness-health-retro.mjs` (the retrospective script; it exists and is committed, `e1bc1ace7`) | 545 | explorer, whole |

`frontend/scripts/harness-health.mjs` does not exist: `ls frontend/scripts` lists 15 entries, none of them that name,
and the positive control in the same listing shows `lane-usage.mjs`. It is only proposed in the 2026-10-18 report.

### 2.1 Data sources

| Source | Format | Writer | Read at | Block |
|---|---|---|---|---|
| `lane-run status --all` | text table, split on 2+ spaces | `lane-run.mjs` | `lane-board.mjs:517,533-537,622-639` | collector (Jjodel adapter) |
| Lane folder `~/.jjodel-lanes/<Prompt-ID>/`: `prompt.txt`, `input-<n>.md`, `msg-<n>.md`, `exit.txt`, `started.txt`, `pid.txt`, `request.md`, `worktree.txt`, `tier.txt`, `resolved.txt`, `session.txt`, `runs.jsonl`, `result.json`, `direct.json` | text, JSON, JSONL | `lane-run.mjs` (table §2.4) | `lane-board.mjs:75-120,547-560,928-964,1387` | collector (Jjodel adapter) |
| `log.jsonl` per lane | Claude Code **stream-json** (`claude -p --output-format stream-json`) | `lane-run.mjs:388-391` (the WRAPPER) | `lane-board.mjs:560,807,937`; `lane-usage.mjs:36-48,188`; `harness-health-retro.mjs:185-187` | collector |
| `architect.json` (schema 1) | JSON | the project chat | `lane-board.mjs:110-120`; `lane-usage.mjs:162-182` | collector (Jjodel-only) |
| `chain-*/chain.json`, `rc45-draws.jsonl` | JSON, JSONL | `lane-run.mjs:2833,2863`; `:971` | `lane-board.mjs:990-993,1063-1066,1355` | collector (Jjodel-only) |
| git: `log --all`, `--numstat`, `for-each-ref`, `ls-tree`/`show` of `docs/prompts/` on the trunk | git | humans and agents | `lane-board.mjs:1011-1016,1135-1141,1207,1243-1255` | collector |
| Trunk docs: `docs/log-inbox/*.md`, `docs/claude-code-log.md`, archive, `docs/decisions.md` | Markdown | lanes, chat | `lane-board.mjs:1308-1312,1339` | collector (layer 3) / out of scope (decisions) |
| `req-trace.mjs` child, `docs/goals/*.json` | JSON | goal-model lane | `lane-board.mjs:1563-1575`; `requirements.js:2,9,284,371` | out of scope for v0 (harness-engine candidate) |
| `os.loadavg`, `process.kill(pid,0)` | runtime | OS | `lane-board.mjs:24,524,1129` | out of scope |
| Board caches `timeline-cache.json`, `usage-cache.json`, keyed on size+mtime of `log.jsonl` | JSON | the board | `lane-board.mjs:674,686,732,745,803` | store (the nearest thing to an event store today) |
| `~/.jjodel-lanes/_tracking/*`, `gh` JSON, `docs/harness/fronts.json` | JSON | `lane-tracking.mjs` | `lane-tracking.mjs:48,272-296,416-437` | out of scope (GitHub projection); front rules = harness engine |
| Retro: git objects at `--ref`, incident table of a frozen report, lane folders | git, Markdown, JSONL | — | `harness-health-retro.mjs:46-67,108-115,178-243` | collector / out of scope (freeze) |

Verbatim anchors: `lane-board.mjs:36` «const ROOT = process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes');»;
`lane-board.mjs:683` «// Per lane, from lane-usage.mjs: the board never reads message.usage itself.»;
`lane-board.mjs:1339` «const r = git(['show', TRUNK + ':docs/decisions.md']);».

**Absence [read]:** no read of `~/.claude/projects` in `lane-board.mjs`. The explorer's grep for `\.claude` matched only
line 1122 (the `.claude/` area rule), and the same grep found `homedir` hits at 24, 36, 38, 40, 547, 997, 998, 1011 and
1092, which shows the search had signal.

HTTP surface (`lane-board.mjs:2003-2076`, `127.0.0.1:4700`): `/api` (rows, `spendByDay`, load, stale), `/api/timeline`,
`/api/insights`, `/api/requirements`, `/api/attention` (menu-bar app), `/export/trace.json` (Perfetto),
`/export/lanes.xes` (process mining), `/l/<id>` (hand-off page), the three tab scripts, and the page.

### 2.2 Metrics

| Metric | Definition (one line) | Where | Needs layer | Block |
|---|---|---|---|---|
| Tokens per call, ctx max/last/median, at≥200k, at≥250k | `input + cache_read + cache_creation` per deduped `message.id` | `lane-usage.mjs:196-203,224-232` | 1 | metrics |
| Rate-limit 7-day delta, `alone` | readings of `rate_limit_event`; overlap with other lanes | `lane-usage.mjs:97-108,148-155,233-239` | 1 (stream-json only) | metrics |
| Cost per lane, sessions | max cumulative `total_cost_usd` | `lane-board.mjs:761-780,800-812` | 1 | metrics |
| `spendByDay` | cost delta attributed to the local day the turn ended | `lane-board.mjs:785-797,580-582` | 1 | metrics |
| Turns, start, end, work, span, waits | input mtimes + `result.duration_ms` | `lane-board.mjs:667-671,926-986`; `insights.js:55-71` | 1 (from transcript timestamps) | metrics |
| Heatmap, wait histogram, longest waits | lane-hours per hour cell; waits in 8 buckets | `insights.js:87-141,193-198` | 1 | metrics |
| Parallelism, overlap pairs, row packing | lanes open/working per bucket; pairs overlapping ≥60 s | `timeline.js:142-165,250-267`; `lane-board.mjs:1516-1521` | 1 | metrics |
| Progress ladder, phase, time left | tool-call milestones; kind median minus elapsed | `lane-board.mjs:177-215,391-446`, `MEDIAN` at `:46` | 1 (ladder) / 2 (kind) | metrics |
| Kind | merge/fast/discovery/phase2 from the `Lane:` line | `lane-board.mjs:92-100` | 2 | metrics |
| `logFacts`, per-turn outcome | model, runs, costUSD, apiError, blockedRun, overTime (>90 min), `Outcome:` line | `lane-board.mjs:815-891` | 1 (model, cost) / 2 (Outcome line) | metrics |
| Resume classes | ACK / Rework / answer / go / recovery phrases | `lane-board.mjs:895-907`; `harness-health-retro.mjs:162-173` | 2 | metrics |
| Commits per unit, reverts, lines per area, size band | subject suffix `(P-…)`; `--numstat` | `lane-board.mjs:1116-1127,1281-1301,1378-1386` | 2 (per unit) / 1 (per repo) | metrics |
| Critical zone, primary area | `CZ_FILES`, `AREAS` regexes | `lane-board.mjs:1114,1117-1122` | Jjodel config | metrics (config) |
| Rework, correctedBy, selfCorrected, failedRun, firstShot, ageDays | Corregge in log/prompt + resume class + reverts + blocked | `lane-board.mjs:1307-1335,1389-1419` | 3 | metrics |
| Causa tallies | letters a-g per area | `insights.js:204,219-225` | 3 | metrics |
| First-shot by week with RC markers | weekly rate; markers from `decisions.md` RC rows | `insights.js:312-389` | 3 + Jjodel | metrics + out of scope (markers) |
| Model × area × size, median cost per model × band | rates with n, hidden <5, greyed <10 | `insights.js:208-266` | 3 | metrics |
| Attention | since, closure a/b/c, 72 h stale | `lane-board.mjs:1673-1741` | 2 | metrics + board |
| Health signals S1a..S6u, backtest | weekly rolling-4w ratios with tuned or rule thresholds | `harness-health-retro.mjs:426-508` | 1-3 | metrics (post-v0); rule thresholds = harness engine |
| Softgoal balance, cluster matrix | goal-model aggregation | `requirements.js:141-306` | Jjodel | out of scope for v0 |
| Card state, front verdict | GitHub column; front rule | `lane-tracking.mjs:105-121,183-209` | 2 | out of scope / harness engine |

### 2.3 Views

All board: **Lanes** tab (Running, Last 24 h, Earlier by day with tally and spend, columns, Kind badge, Phase cell, stale
banner, status strip: `lane-board.mjs:1802-1998`); **Timeline** tab (swimlanes grouped by worktree, chat or launcher,
parallelism strip, overlap hatches, dependency arrows, detail panel: `timeline.js:76-403`); **Insights** tab (KPI tiles,
heatmap, waits, lanes per day by outcome, outcome by kind, launchers, longest waits, code areas, model by area and size,
tokens, first-shot over time, Perfetto and XES exports: `insights.js:73-444`); **Requirements** tab
(`requirements.js:125-395`, out of scope for v0); `/l/<id>` hand-off page (`lane-board.mjs:1751-1762`, out of scope).

### 2.4 What `lane-run.mjs` writes that the board reads

`log.jsonl` (:388-391, :1232, :3048), `started.txt` (:535), `pid.txt` (:534), `exit.txt` (:391), `worktree.txt`
(:1229, :2378), `prompt.txt` (:1230), `request.md` (:1231), `tier.txt` (:1236), `session.txt` (:1268, :1276),
`input-<n>.md` (:487), `msg-<n>.md` (:1297), `runs.jsonl` (:1015-1021), `resolved.txt` (:1537), `direct.json`
(:2387), `result.json` (:2703, :3046), `chain-<id>/chain.json` (:2833, :2863), `rc45-draws.jsonl` (:971). Written and
not read by the board: `goahead.txt`, `auto.json`, `stdin.md`, `stderr.log`, `gate-*.log`, `vitest-*.json`,
`chain.log`, `stop`, `_monitor/` (explorer grep, 0 hits each in `lane-board.mjs`). `lane-usage.mjs --write` writes
`usage.json` (:357), which nothing reads. This lane-folder layout is the de-facto "lane-run collector contract".

Mapping summary: **collector** = lane-folder and log readers, git readers, `lane-usage.mjs` event reading and dedupe,
retro readers; **metrics** = everything in §2.2 except the out-of-scope rows, today spread across server and client;
**board** = page, three tab scripts, exports; **harness engine** = outcome and Causa vocabularies
(`timeline.js:27-35`, `insights.js:204`), front rules (`lane-tracking.mjs:105-121`), rule-based thresholds of the retro
(`harness-health-retro.mjs:440-448`); **out of scope** = `lane-run` orchestration, GitHub tracking, menu bar,
`/l/` hand-off, `req-trace`/Requirements, RC-45 draws, the retro's freeze and sha256 output.

## 3. Couplings (COSA 2)

Classes as defined in the prompt. Counts are occurrences: lines for the first five rows and the retro; grouped sites
for `lane-usage`, `lane-tracking` and `lane-run` (the explorer grouped repeated assumptions there). A line holding two
classes counts in both. Comment-only lines are excluded in `lane-board.mjs`, included elsewhere.

| File | Jjodel domain | Harness convention | Environment | Claude Code platform | Total |
|---|---:|---:|---:|---:|---:|
| `lane-board.mjs` | 43 | 113 | 26 | 60 | 242 |
| `insights.js` | 16 | 20 | 1 | 6 | 43 |
| `timeline.js` | 3 | 28 | 8 | 1 | 40 |
| `requirements.js` | 17 | 8 | 0 | 0 | 25 |
| `lane-usage.mjs` | 1 | 9 | 1 | 6 | 17 |
| `lane-tracking.mjs` | 4 (+12 decision-id comment lines) | 15 | 5 | 0 | 24 |
| `lane-run.mjs` (windows of §2 only) | 6 | 14 | 8 | 8 | 36 |
| `harness-health-retro.mjs` | 26 | 28 | 8 | 12 | 74 |
| **Code total** | **116** | **235** | **57** | **93** | **501** |
| `README.md` (documentation, approximate) | ~10 | ~40 | ~14 | ~8 | ~72 |

Representative occurrences, verbatim (full per-line lists are in the explorers' output, reproducible by re-reading):

**Jjodel domain.**
- `lane-board.mjs:1112` «const TRUNK = process.env.JJODEL_TRUNK || 'alfonso-frontend-jjtl';»
- `lane-board.mjs:1114` «const CZ_FILES = ['useJjomSync.ts', 'syncState.ts', 'canvasToJjom.ts', 'portDistribution.ts', 'useM1ReferenceEdges.ts', 'VersionFixer.tsx'];»
- `lane-board.mjs:1344` «const m = /^- \*\*RC-(\d+)\*\* \((\d{4}-\d{2}-\d{2})/.exec(ln);»
- `lane-board.mjs:46` «const MEDIAN = { discovery: 28, phase2: 38, merge: 5, fast: 6 };» (calibrated on Jjodel lanes)
- `lane-usage.mjs:31` «/** AM-8 thresholds, memo docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md §2. */»
- `lane-tracking.mjs:48` «export const FRONTS_FILE = 'docs/harness/fronts.json';»
- `lane-run.mjs:361` «const DEFAULT_TRUNK = 'alfonso-frontend-jjtl';»
- `insights.js:231` «const czl = ls.filter((l) => l.criticalZone);»

**Harness convention.** Prompt-ID regex and the `P-` prefix (`lane-board.mjs:85,506,965…`; `timeline.js:198`
«txt = open ? l.id.slice(2) : l.id.slice(-4);»); headers `Lane:`, `Chat:`, `Request:`, `Depends:`, `Corregge:`,
`Status:` with «da eseguire» (`lane-board.mjs:80-86,1176,1686`); the lane-folder file names (27 lines in
`lane-board.mjs` alone); the `Outcome:` line (`lane-board.mjs:828,880,886,889`); the log-entry grammar
(`lane-board.mjs:1308-1332,1450`: «Corregge», «Causa», «Regressions», «Smoke visivo», `ticket:`); the resume phrases
(`lane-board.mjs:896-911`, «ACK», «Rework», «/status-flip»); tiers heavy|light (`lane-board.mjs:1358-1372`).

**Environment.**
- `lane-board.mjs:34` «const PORT = Number(arg('--port', process.env.LANE_BOARD_PORT || 4700));»
- `lane-board.mjs:1011` «const REPO = process.env.JJODEL_REPO || join(homedir(), 'jjodel');»
- `lane-board.mjs:38` falls back to `~/jjodel-release/frontend/scripts/lane-run.mjs`
- `lane-board.mjs:1759-1760` the `jjodel-lanes://` URL scheme of the menu-bar app
- `lane-run.mjs:2483` «const BOARD_LABEL = 'io.jjodel.lane-board';» with `launchctl kickstart` at :2514-2523
- `timeline.js:25` «.replace(/^~\//, '').replace(/^\/Users\/[^/]+\//, '')»
- `harness-health-retro.mjs:73-74` Europe/Rome, +02:00 over the whole window
- No `osascript` and no `~/jjodel-w-*` literal in `lane-board.mjs` (explorer grep `homedir|launchd|osascript|jjodel-w-`
  matched only the environment lines listed above, which is its positive control).

**Claude Code platform.** stream-json events `system/init`, `result`, `total_cost_usd`, `num_turns`, `duration_ms`,
`modelUsage`, `terminal_reason`, `parent_tool_use_id`, `<synthetic>` (`lane-board.mjs:764-880`; `lane-usage.mjs:81-85`
«if (model === '<synthetic>') continue;»); `rate_limit_event … seven_day.utilization` (`lane-usage.mjs:97-107`); tool
names `Edit|Write|MultiEdit|NotebookEdit`, `Bash`, `Read|Grep|Glob` (`lane-board.mjs:217,343-403`); trailers
`Claude-Session:` and `Co-Authored-By: Claude` (`lane-board.mjs:1022-1057`); `lane-run.mjs:340`
«const LIGHT_MODEL = 'claude-sonnet-5-5';». No pricing table anywhere in the board: cost is always the CLI's own
figure.

**A fifth platform.** `lane-tracking.mjs` depends on GitHub (`gh`, Projects v2); filed under environment above. It is
out of scope for Tack v0.

**Reading of the counts.** Environment (57) is the cheapest class: almost every occurrence is already behind an env
var with a default (`JJODEL_LANES`, `JJODEL_REPO`, `JJODEL_TRUNK`, `LANE_BOARD_PORT`). Jjodel domain (116) is mostly
configuration (trunk, areas, critical files, medians) or whole features that leave (Requirements, RC markers, draws).
Harness convention (235) is the real design work: it becomes the data contract (§5) plus an optional `lane-run`
adapter. Platform (93) is where the format change bites: the board knows stream-json, Tack v0 must know transcripts.

## 4. Zero-adoption view (COSA 3)

### 4.1 Which metrics need which layer

| Layer 1 only (git + transcripts) | Needs layer 2 (identity) | Needs layer 3 (self-assessment) |
|---|---|---|
| sessions per day; session span, work and waits from event timestamps; heatmap; parallelism and overlap | grouping sessions and resumes into one unit of work | outcome as self-assessed (✅/⚠️/❌) |
| cost per session and per day (`cost-state.totalCostUSD`) | cost and tokens per unit; resumes per unit | rework via `corrects`; correctedBy, selfCorrected |
| tokens in/out, context peak, at≥200k/250k, subagent share (`isSidechain`) | exact unit → commit link (today the `(P-…)` subject suffix) | cause tallies (a-g) |
| model per session | kind (`Lane:`), chain deps, launcher, chat link | first-shot (it needs `corrects`) |
| tool-call ladder (from `tool_use` blocks) | the `Outcome:` closing line, resume classes | regressions, out-of-scope rates |
| commits co-authored by Claude, lines per commit, reverts, files most touched, areas by path prefix | attention (since, closure) | model × area × size success matrix |
| sessions without a commit in the following hour (time-window heuristic) | | |

Layer-1 proxies for layer-3 signals exist (reverts, a fix commit on the same files within N days) but are heuristics
and would be labelled as such.

### 4.2 Measurement [measured]

`ls ~/.claude/projects/` lists 285 directories; 262 contain `jjodel` in the name; of the other 23, 6 are under
`/Users/alfonso/` and 17 under `/private/tmp/`. Transcript files: 584 in total, 554 in Jjodel directories. Directory
names (names only):

```
-Users-alfonso-Documents-Claude-Projects-DISIM-nosync-sito-disim            0 transcripts
-Users-alfonso-Library-Mobile-Documents-com-apple-CloudDocs-Sviluppo-tdw-2025-2026-llm-ltdw  0
-Users-alfonso-Library-Mobile-Documents-com-apple-CloudDocs-Sviluppo-vhdl-design-studio      0
-Users-alfonso-dev-tracer-scaffold-m0                                        1
-Users-alfonso-harness-book                                                  1
-Users-alfonso-harness-exp-sprotty                                           0
-private-tmp-sprotty-{bug-540,maint-library-css}-{A,B}-1-*  (8 directories)  1 each
-private-tmp-{ai-disc-probe-web,c1936,lean1725-probe,mg-probe-proj,p2330-model-nz9p,probe-*} (9 dirs)  probes
```

Picked: **tracer-scaffold** (repository present) and **sprotty-experiment** (the 8 `/private/tmp/sprotty-*`
directories, clones of eclipse-sprotty for the 2026-09-29/30 experiment, treated as one repository). harness-book was
run too, as a control on a repository with a remote. Script: `/tmp/tack-p1100/zero.mjs` (dedupe by `message.id`,
main thread only, cost = max `cost-state.totalCostUSD` per session, commit check = any commit in `git log --all` of the
session's `cwd` between session start and one hour after its last event).

| Metric | tracer-scaffold | sprotty-experiment | harness-book (control) |
|---|---|---|---|
| Sessions | 1 | 8 | 1 |
| Sessions per day | 2026-09-17: 1 | 2026-09-29: 4, 2026-09-30: 4 | 2026-10-07: 1 |
| Cost (USD) | 7.79 (1/1 sessions with a cost record) | 0.76 (8/8) | 0.29 (1/1) |
| Context peak (tokens) | 167,897 | max 29,295, median 24,068 | 47,216 |
| Main-thread API calls | 66 | 57 | 7 |
| Session span (min) | 118 | 0-1 each | 1 |
| Models | claude-opus-5 | claude-sonnet-5-5 | claude-opus-5-5 |
| Sessions without a commit in the following hour | 0 of 1 (1 had one) | **uncomputable, 8/8**: the clones under `/private/tmp` no longer exist | 0 of 1 |
| Layer-2 markers in git | 0 Prompt-IDs in 13 commits; 9 `Co-Authored-By: Claude` | — | 0 Prompt-IDs in 33 commits; 27 `Co-Authored-By: Claude` |

What was missing, per metric:
- **Sessions per day, context peak:** nothing.
- **Cost:** nothing on these transcripts. Every one of the 10 sessions carries a `cost-state` record with
  `totalCostUSD`; `hasUnknownModelCost` was false on all. Older or other CLI versions may lack it: then a price table
  is needed, which the board has never had.
- **Commit within the hour:** the repository. For deleted clones there is no git history to join. And
  the commit is not attributed to the session: any author counts, so this is proximity, not authorship.
- **Project identity:** the directory name is a lossy encoding of the path (`/Users/alfonso/dev/tracer/scaffold_m0`
  becomes `-Users-alfonso-dev-tracer-scaffold-m0`: `/` and `_` both map to `-`). The `cwd` field inside the
  transcript is exact and must be the key; the 8 sprotty clones are 8 directories for one repository, and grouping them
  needs a repository identity (root commit or remote URL) that the transcript does not record.
- **History depth:** the oldest transcript on disk is dated 2026-09-17 (mtime), about 32 days before today, and
  `~/.claude/settings.json` sets no `cleanupPeriodDays` (grep exit 1, no match). This matches a ~30-day retention:
  Tack must ingest continuously, or history older than a month is lost.

Indication, not a measurement: 68 Jjodel transcripts were modified since 2026-10-12, against 72 lane folders
`P-2026-10-12…19` (some of them direct merges with no session). Lane sessions probably appear in
`~/.claude/projects` too, which would let Tack read Jjodel's lanes without the lane-folder adapter. Joining them was not
done.

## 5. Data contract v1, draft (COSA 4)

Storage as decided: JSON Lines source (`tack/log.jsonl` or a per-unit folder; open, §8), Markdown rendered from it.

### 5.1 Field mapping from `CLAUDE.md` §21.2

| §21.2 field | v1 field | Disposition |
|---|---|---|
| heading date `## YYYY-MM-DD` | `date` | kept |
| heading `type: short description` | `kind`, `title` | kept, split |
| `Prompt` | `summary` | renamed |
| `Files touched` | `files` (array) | kept; optional, derivable from git |
| `Outcome` ✅/⚠️/❌ | `outcome`: `completed` / `partial` / `problems` | kept, emoji to enum |
| `Corregge` | `corrects` (unit id or null) | renamed; value becomes the unit id, not `YYYY-MM-DD HH:mm` |
| `Causa` (a)-(g) | `cause`: `a`..`g` or null | renamed; taxonomy kept as is: its seven letters name no Jjodel artefact |
| `Regressions` | `regressions` | kept |
| `Out-of-scope changes` | `out_of_scope` | renamed |
| `Layer Impact Report` | — | dropped, Jjodel critical zone |
| `Smoke visivo` | — | dropped, Jjodel P8 (a generic `verification` field is a v2 candidate) |
| `Notes` | `notes` (≤ 500 chars) | kept |
| `Prompt document name` | `unit` | replaced by the identity key |
| ticket `Ticket` / `Priority` / `Found in` / `Detail` | `finding` / `priority` / `found_in` / `detail` | renamed / kept |

### 5.2 JSON Schema draft

Identity layer (one record per unit of work; the same id appears in the prompt header, in the session's first line and
in a commit trailer `Unit: <id>` or the subject suffix ` (<id>)`):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tack.dev/contract/v1/unit.json",
  "title": "Tack unit of work (identity layer)",
  "type": "object",
  "required": ["contract", "unit", "opened"],
  "additionalProperties": false,
  "properties": {
    "contract": { "const": 1 },
    "unit":     { "type": "string", "pattern": "^P-\\d{4}-\\d{2}-\\d{2}-\\d{4}(-[a-z0-9]{1,8})?$" },
    "opened":   { "type": "string", "format": "date-time" },
    "title":    { "type": "string", "maxLength": 200 },
    "conversation": { "type": "string", "pattern": "^C-\\d{4}-\\d{2}-\\d{2}-\\d{4}$" },
    "stream":   { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]*$" },
    "depends":  { "type": "array", "items": { "$ref": "#/properties/unit" }, "uniqueItems": true },
    "sessions": { "type": "array", "items": { "type": "string", "format": "uuid" }, "uniqueItems": true }
  }
}
```

One log entry (self-assessment layer):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tack.dev/contract/v1/entry.json",
  "title": "Tack log entry (self-assessment layer)",
  "type": "object",
  "required": ["contract", "type", "date", "title"],
  "properties": {
    "contract": { "const": 1 },
    "type":  { "enum": ["task", "ticket"] },
    "date":  { "type": "string", "format": "date" },
    "title": { "type": "string", "minLength": 1, "maxLength": 200 },
    "unit":  { "type": "string", "pattern": "^P-\\d{4}-\\d{2}-\\d{2}-\\d{4}(-[a-z0-9]{1,8})?$" },
    "notes": { "type": "string", "maxLength": 500 }
  },
  "oneOf": [
    {
      "properties": {
        "type": { "const": "task" },
        "kind": { "type": "string" },
        "summary": { "type": "string", "minLength": 1 },
        "files": { "type": "array", "items": { "type": "string" } },
        "outcome": { "enum": ["completed", "partial", "problems"] },
        "corrects": { "oneOf": [ { "type": "null" }, { "$ref": "#/properties/unit" } ] },
        "cause": { "enum": [null, "a", "b", "c", "d", "e", "f", "g"] },
        "regressions": { "enum": ["yes", "no", "unknown"] },
        "out_of_scope": { "type": "boolean" }
      },
      "required": ["unit", "summary", "outcome", "corrects", "cause", "regressions", "out_of_scope"],
      "allOf": [
        {
          "if": { "anyOf": [
            { "properties": { "outcome": { "enum": ["partial", "problems"] } } },
            { "properties": { "corrects": { "type": "string" } } }
          ] },
          "then": { "properties": { "cause": { "enum": ["a", "b", "c", "d", "e", "f", "g"] } } },
          "else": { "properties": { "cause": { "const": null } } }
        }
      ]
    },
    {
      "properties": {
        "type": { "const": "ticket" },
        "finding": { "type": "string", "minLength": 1 },
        "priority": { "enum": ["high", "medium", "low"] },
        "found_in": { "type": "string", "pattern": "^[PC]-\\d{4}-\\d{2}-\\d{2}-\\d{4}" },
        "detail": { "type": "string", "minLength": 1 }
      },
      "required": ["finding", "priority", "found_in"]
    }
  ]
}
```

The `else` branch (cause must be null when the outcome is `completed` and nothing is corrected) is a reading of §21.3
«Otherwise `—`»; a stricter rule than any gate today, so it is listed as a decision below.

### 5.3 What `check:docs` validates today, and what moves

Read from `frontend/scripts/gates/check-docs.ts:8-32` and `frontend/scripts/gates/log-tools.ts:327-422`.

| Check today | Validates | Under the schema |
|---|---|---|
| A, block identity CLAUDE.md §21.2 vs PROTOCOL P9 | two copies of the format are byte-identical | **obsolete**: the schema is the single source |
| B, task: `Corregge` present; sentinel or `YYYY-MM-DD HH:mm` prefix (`log-tools.ts:332-345`) | presence and form | **kept** (`required`, `pattern`) |
| B, task: `Corregge` resolves to a known `Prompt document name` (warning only, `:340-343`) | cross-record reference | **lost from the schema**: needs a referential pass in `tack check` |
| B, task: `Causa` present; sentinel or `(a)`..`(g)` (`:348-355`) | presence and vocabulary | **kept** |
| B, ticket: `Ticket`, `Priority`, `Found in` present and well-formed; `Detail` non-empty if present (`:364-389`) | presence and form | **kept** |
| B, date scoping (`LINT_FROM_DATE` 2026-08-02, ticket from 2026-09-24, `:10-20`) | which entries are linted | **replaced** by `contract: 1`; older history imports as contract 0, unvalidated |
| C, `Notes` ≤ 500 chars from 2026-08-19 (`:407-419`) | length | **kept** (`maxLength`) |
| D, active log ≤ 40 entries; non-empty inbox warns | rotation hygiene | **obsolete** for JSONL (no rotation); the Markdown rendering may still paginate |
| E, every prompt's `Front:` is an open slug of `docs/harness/fronts.json` | cross-file registry | **lost from the schema**, and Jjodel-specific; a `stream` registry is a v2 option |
| — (not checked today) | `Outcome`, `Regressions`, `Out-of-scope` values; Causa required when ⚠️/❌ or `Corregge` set (§21.3) | **gained** |

Verbatim: `log-tools.ts:352` «if (v !== SENTINEL && !CAUSA_FORM.test(v)) {» checks form only; nothing in
`lintTaskFields` (`:327-355`) reads `Outcome`. This read of `lintTaskFields` covers lines 327-355, its whole body.

## 6. Extraction plan (COSA 5)

### 6.1 Layout of the new repository

One package, one folder per block, no workspace tooling in v0 (rule 6, no over-engineering). Node ≥ 22, ESM, no
TypeScript build step (the board is plain `.mjs` today):

```
tack/
  bin/tack.mjs                  # tack scan | tack board | tack check
  contract/v1/unit.json, entry.json, README.md
  src/store/                    # event store: schema.sql, open.mjs, ingest cursors
  src/collectors/claude-code/   # ~/.claude/projects/*.jsonl -> sessions, calls, cost-state
  src/collectors/git/           # commits, numstat, trailers, reverts; repo identity
  src/collectors/log/           # contract v1 JSONL (layer 3), identity records (layer 2)
  src/collectors/lane-run/      # optional adapter for the Jjodel lane-folder layout (post-v0)
  src/metrics/                  # pure functions over the store, unit-tested
  src/board/server.mjs, page.html, timeline.js, insights.js, sessions.js
  test/fixtures/                # synthetic transcripts and git repos, no real content
```

### 6.2 Disposition per file

| File | Disposition | Into |
|---|---|---|
| `lane-board.mjs` | **rewritten**, by function: HTTP server and page structure **copied and adapted**; metrics (`spendByDay`, cost, tokens, turns, waits, ladder, kind) **copied and adapted** into `src/metrics/`; lane-folder readers move to the `lane-run` adapter; `/api/attention`, `/l/`, menu-bar scheme, `req-trace`, RC markers, `CZ_FILES`, `AREAS`, draws **left behind** | `src/board/`, `src/metrics/`, `src/collectors/lane-run/` |
| `timeline.js` | **copied and adapted**: swimlanes of sessions/units; grouping by repository and branch instead of worktree; chat and launcher only when layer 2 is present | `src/board/timeline.js` |
| `insights.js` | **copied and adapted**, in part: KPIs, heatmap, waits, per-day outcome, tokens, cost kept; areas become path-prefix areas from config; critical zone, drawn lanes, RC markers left behind; first-shot and Causa views shown only with layer 3 | `src/board/insights.js` |
| `requirements.js` | **not extracted** (Jjodel goal model; harness-engine candidate) | — |
| `README.md` | **rewritten** | `tack/README.md` |
| `lane-usage.mjs` | **copied and adapted**: `apiCalls` dedupe by `message.id`, context series, thresholds as config; stream-json reader kept for the adapter, a transcript reader added | `src/collectors/claude-code/`, `src/metrics/` |
| `lane-tracking.mjs` | **not extracted** (GitHub projection; front rules are harness-engine material for after v0) | — |
| `lane-run.mjs` | **not extracted** (orchestration); its folder layout (§2.4) becomes the adapter's input contract | `src/collectors/lane-run/` (reads only) |
| `harness-health-retro.mjs` | **not in v0**; its signals S1-S6 are the candidate catalogue for a later metrics release, the rule-based thresholds for the harness engine | — |
| `check-docs.ts`, `log-tools.ts` (reference) | **rewritten** as `tack check` over contract v1 plus a referential pass | `bin/tack.mjs`, `contract/` |

### 6.3 Slices

| # | Slice | Acceptance criterion | Size (files / lines, estimate) |
|---|---|---|---|
| 1 | Skeleton, contract v1 schemas, `tack check` | `tack check` accepts 10 synthetic valid entries and rejects 10 invalid ones, one per rule of §5.3 "kept" and "gained" | 6 / ~450 |
| 2 | Store + Claude Code collector | `tack scan` on this Mac reproduces §4.2 exactly for tracer-scaffold, sprotty-experiment and harness-book (sessions, cost, peak, calls); a second scan adds 0 rows (idempotent cursors) | 6 / ~700 |
| 3 | Git collector + repository identity | commits per repo equal `git rev-list --all --count`; sessions grouped by `cwd` → `git rev-parse --show-toplevel` and root commit; deleted clones reported as "repository missing", never as "no commit" | 4 / ~450 |
| 4 | Metrics, layer 1 | unit tests on fixtures for sessions/day, cost/day, context peak, at≥200k, waits, overlap, commit proximity; each metric declares the layer it needs | 6 / ~800 |
| 5 | Board, zero configuration | `npx tack board` from a repository root opens Sessions, Timeline and Insights with no file written in the repository and no flag; layer-2/3 panels render as "not adopted" rather than empty charts | 7 / ~1,800 (mostly adapted) |
| 6 | Layers 2 and 3, Jjodel parity | with the `lane-run` adapter and a Markdown → JSONL importer of the Jjodel log, Tack on Jjodel matches the lane board's `spendByDay` for the last 14 days within 1% and its first-shot count within 0 lanes | 5 / ~900 |
| 7 | v0 | Tack runs on two repositories that are not Jjodel (eclipse-sprotty and one more) and shows a useful board with zero configuration, from git history and the local Claude Code transcripts | 2 / ~150 (docs, fixes) |

Total about 36 files and 5,250 lines, against 8,549 lines in scope today (§2).

### 6.4 Jjodel's board during and after

During: nothing in `frontend/scripts/lane-board/`, `lane-usage.mjs`, `lane-run.mjs` changes. Tack is developed in its
own repository from copies; Jjodel's board keeps serving `:4700` under launchd as today. Tack's board defaults to a
different port, so both can run side by side on the Mac for the slice-6 comparison. After: once slice 6 holds for two
weeks, a Jjodel lane may switch the launchd job to Tack with the `lane-run` adapter and freeze the old board; deleting it
is a separate lane (RC-26: deletion waits for Alfonso). Until then, any fix to Jjodel's board is a Jjodel lane and is
ported to Tack by hand, not synchronised.

## 7. Dependencies and risks

1. **Format drift of transcripts.** The transcript JSONL is an internal format of Claude Code (types seen today
   include `cost-state`, `queue-operation`, `attachment`, `file-history-delta`). A CLI update can rename fields. The
   collector must be tolerant and versioned by the `version` field each record carries.
2. **Retention.** About 30 days of transcripts on disk (§4.2). A board started late sees one month at most; the store
   must be the history, and must be backed up like data.
3. **Cost source.** `cost-state.totalCostUSD` is present on all 10 measured sessions; older sessions or other agents
   may lack it. A price table brings maintenance and a second truth.
4. **SQLite without a dependency.** `node:sqlite` is behind `--experimental-sqlite` on the node in this shell (v23.3.0,
   probe printed «ExperimentalWarning: SQLite is an experimental feature»), unflagged only on newer releases. The
   alternative, `better-sqlite3`, is a native dependency. The choice changes Tack's install story.
5. **Repository identity** for deleted clones and multiple worktrees (§4.2): without it, 8 sprotty sessions look like 8
   projects and their commit linkage is unknowable.
6. **Privacy.** Transcripts hold prompts, file contents and secrets. Tack is local, but its store copies content unless
   the collector keeps metadata only. The v0 store should keep counts, ids and timestamps, never message text.
7. **Two maintainers, one id scheme.** `P-YYYY-MM-DD-HHmm` can collide between Alfonso and Juri in the same minute;
   the draft schema allows a short suffix.
8. **Jjodel parity can mask divergence.** Slice 6 compares two implementations that share code by copy; a bug
   copied into both passes the comparison. The fixtures of slice 4 are the independent check.
9. **Gate red at HEAD.** `check:docs` Check E fails on this prompt (front `tack` not registered). Every commit on this
   branch inherits the red until the registry is updated.

## 8. Open questions

1. Where does the contract v1 JSONL live in an adopting repository (`.tack/log.jsonl`, `tack/units/<id>.jsonl`)?
2. Commit linkage: trailer `Unit: <id>`, the subject suffix Jjodel uses today, or both accepted?
3. Is "sessions without a commit in the following hour" kept as a board metric, given it measures proximity, not
   authorship?
4. Should the Tack store keep any text (titles, first line) or metadata only?
5. Which repository is the second non-Jjodel one for the v0 criterion, given the sprotty experiment clones are gone and
   a fresh sprotty pilot must first accumulate transcripts?

## 9. Decisions taken (unattended)

1. Not fixing Check E: adding front `tack` to `docs/harness/fronts.json` is outside DOVE; recorded as a risk and in the
   closing report. (ratified as recommended, unattended)
2. The two measured repositories are tracer-scaffold and the eight sprotty clones treated as one; harness-book run as a
   control, reported in its own column.
3. The `Causa` taxonomy is kept unchanged in v1: none of its seven letters names a Jjodel artefact.
4. The draft schema requires `cause` to be null when outcome is `completed` and nothing is corrected, the reading of
   §21.3 «Otherwise `—`».
5. `Prompt document name` is replaced by the unit id, so `corrects` points to an id, not to a timestamp.
6. Disposition and slice order of §6, including the Jjodel parity slice before the v0 slice.
7. The v0 store keeps metadata only, no message text (risk 6).

## 10. Decisions awaiting Alfonso (RC-26 list only)

None. This report changes no code, deletes nothing and touches no model, effort, cost or push. Two items will reach the
list later: retiring Jjodel's board (a deletion, §6.4), and a new dependency if SQLite is not taken from node itself
(risk 4, a `package.json` entry under rule 4).
