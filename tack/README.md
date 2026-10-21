# Tack

Tack is a project-agnostic monitor for agent-assisted development: it reads what a coding agent
leaves behind (transcripts, git history, a self-assessment log) and shows how the work went.
It keeps metadata only, never message text, and needs no dependency beyond Node >= 24 (for
`node:sqlite`; on an older Node every command exits 2).

Status: v0: validated on the author's repositories (Jjodel, harness-book, a Sprotty clone without sessions); external pilot pending.

## Install and first run

Tack needs Node >= 24 and nothing else: no `npm install`, no build step. From a clone of this repository:

```
node tack/bin/tack.mjs board        # or: cd tack && node bin/tack.mjs board
node tack/bin/tack.mjs --version
```

Run it from the root of the repository you want to look at. The first run reads every Claude Code transcript
under `~/.claude/projects` into `~/.tack/store.db` (about a minute for 700 sessions), then serves the board
on `http://127.0.0.1:4710/` and opens it. Nothing is written in the repository.

A repository that follows none of the conventions below still gets layer 1: its sessions, cost, context and
commits. Every layer-2 and layer-3 metric shows `not adopted` with the field that would enable it, and the
Lanes tab says «No lane-run lanes for this repository». A repository with no Claude Code session at all is not
in the store, because repositories are found from session directories: the board then preselects nothing and
shows all repositories.

## Three data layers

1. **Transcripts and git**: sessions, cost, context, commits. Requires only Claude Code transcripts on this
   machine and a git work tree; nothing from the repository.
2. **Identity**: a unit-of-work id (`P-YYYY-MM-DD-HHmm`) linking a prompt, its sessions and its
   commits, via the trailer `Unit: <id>` (canonical) or the subject suffix `(P-...)` (alias). Requires the id in
   commit messages, or leading the first message of a session.
3. **Self-assessment log**: one append-only file, `.tack/log.jsonl`, one JSON entry per line. Requires that file
   (or an import), and for the Lanes tab a lane-run folder on this machine.

Layers 2 and 3 are optional; panels that need them say "not adopted" instead of drawing empty charts.

Lane folders are read through one trace-source boundary (`src/collectors/source.mjs`); lane-run is the only adapter today.

## `tack check`

```
node bin/tack.mjs check [file]      # default: .tack/log.jsonl
```

Validates every line of a JSON Lines log against contract v1 (`contract/v1/`), then checks the
references between lines. Exit code 0 when clean, 1 when there are violations (one line each,
`file:line field rule: message`), 2 on a usage error.

## `tack scan` and `tack sessions`

```
node bin/tack.mjs scan [--root <dir>] [--store <file>]
node bin/tack.mjs sessions [--cwd <prefix>] [--json] [--store <file>]
```

`scan` reads the Claude Code transcripts under `~/.claude/projects` (`<dir>/<session>.jsonl` and
`<dir>/<session>/subagents/*.jsonl`) into one store per user, `~/.tack/store.db` (or `TACK_STORE`,
or `--store`), so no file is ever written in a scanned repository. It keeps ids, timestamps, model
ids, CLI versions, token counts, cost and the session `cwd`, never message text. Ingestion is
incremental from each file's byte offset; a file that shrank or whose mtime moved backwards is
re-read from 0. Transcripts deleted by Claude Code's retention keep their rows: the store is the
history.

`sessions` prints one row per session: cwd, UTC day, main-thread API calls (one per `message.id`,
subagent calls excluded), cost (max `cost-state.totalCostUSD`), context peak, span in minutes,
models, how the session was linked to a repository (`link`, below), and commit within the hour. Its day
is the UTC day of the first event; `tack metrics` uses local days.

## Repository identity and the git collector

```
node bin/tack.mjs repos [--json] [--store <file>]
```

After the transcripts, `scan` resolves every distinct session `cwd` to a repository, then reads the
git history of every repository it found. A `cwd` that no longer exists (`path-gone`), is not inside
a git work tree (`not-a-git-work-tree`), is in a repository with no commit (`no-commits`), or where
git fails (`git-error`) is **missing**, with that reason, never "no commit". Otherwise the cwd gives
its toplevel and its git common dir, so the linked worktrees of one clone share one identity. A
repository is keyed by its **lowest root commit** (`git rev-list --max-parents=0 --all`): clones that
share a root commit are one repository, and two clones of the same project whose roots are disjoint
(a shallow clone, a history rewritten from the root) are two repositories even when their remote is
the same. The `origin` URL is kept normalised (`host/path`, credentials and `.git` dropped); `repos`
prints only its host. A repository with no clone left on disk is marked `gone` and keeps its commits.

Per commit the store keeps the sha, the number of parents, author and commit time, the numstat
totals (files, insertions, deletions; renames off, merges count no file), the unit id with the form
that matched (`trailer` for `Unit: <id>`, `suffix` for a subject ending in `(P-...)`; the trailer
wins), and whether a `Co-Authored-By:` trailer names Claude. The message is parsed in memory and
dropped: no subject, body, author name, email or file path is stored.

Every git command is read-only (`rev-parse`, `rev-list`, `log`, `for-each-ref`, `worktree list`,
`remote get-url`) and runs with `GIT_OPTIONAL_LOCKS=0`; nothing is fetched. Reading is incremental:
the refs and their tips (and every worktree `HEAD`) are remembered per clone, and a repository whose
tips did not move is skipped. When they moved, a single-clone repository reads only the commits not
reachable from the old tips and then compares its stored count with `git rev-list --all --count`; a
difference means history was rewritten or a ref deleted, and the repository is re-read in full. A
repository with several clones is re-read in full. The stored commits of a repository are therefore
exactly `git log --all` of its clones.

**Commit within the hour** (proximity, not authorship) is computed at query time, not stored: `yes`
when any commit of the session's repository, by any author, has a commit time between the session's
first event and one hour after its last event; `no` otherwise; `unknown` when the repository is
missing. `repos` prints one line per repository: key (12 chars), the first toplevel and a count of the
others (`/Users/x/repo +3 more`), remote host, commits, commits with a unit id per form, Claude co-authored
commits, sessions, sessions with a commit within the hour; then the missing cwds grouped by reason. Each
column is as wide as its widest cell and at most 60 characters; a longer cell keeps its tail behind «…».

### Linking a session whose directory is gone

A `path-gone` cwd (a deleted worktree) is still linked when the evidence allows, and `link` says how.
Nothing is inferred for the other missing reasons (`not-a-git-work-tree`, `no-cwd`, ...).

| link | meaning |
|---|---|
| `direct` | the cwd exists and sits in a repository |
| `branch` | the session's first `gitBranch` other than `HEAD` names a branch of exactly one known repository: a ref name (heads, and remotes with the remote prefix dropped) or a branch name parsed in memory from the merge subjects of `git log --all --merges` (git, GitHub, remote-tracking and `merge: X into ...` forms; nothing of the subject is stored) |
| `sibling` | the nearest existing ancestor of the cwd holds the present work trees (`git worktree list`) of exactly one repository, and the branch, if it names any repository, names that one |
| `none` | not linked; `link_reason` is `branch-conflicts-sibling`, `branch-ambiguous` (the branch exists in several repositories, e.g. `main`), `sibling-ambiguous` or `no-candidate` |

A linked `path-gone` session keeps `missing = path-gone` and gets its `repo_key`. The method is
evidence, not proof: a branch name can be reused across clones, which is why an ambiguous one is left
unlinked rather than guessed.

Numstat is computed with `--no-renames` even when the user's git config turns rename detection on
(`diff.renames=copies`), so a rename counts as a delete plus an add on every machine.

## `tack metrics`

```
node bin/tack.mjs metrics [--repo <key|path>] [--since <YYYY-MM-DD>] [--json] [--store <file>]
```

Reads the store only. `--repo` takes a repository key (or a prefix) or a path inside it; `--since`
keeps the sessions whose first event is on or after that day. Layer 1 needs nothing from the
repository:

| metric | definition |
|---|---|
| `sessions_per_day` | sessions by the day of their first event; undated counted apart |
| `cost_per_day` | known session cost (max `cost-state.totalCostUSD`) by the day of the first event; sessions with unknown cost counted apart, never as 0 |
| `tokens_per_day` | input, output, cache read and cache write tokens of every call, subagents included, by the day of the call |
| `context_peak` | largest main-thread context (input + cache read + cache write) per session, median, and sessions at or above 200,000 tokens |
| `calls_per_session` | main-thread API calls per session, one per message id |
| `waits` | gaps strictly above 5 minutes between consecutive calls of one session (subagent calls included), counted in full, per session and per day of the gap start |
| `overlap` | most sessions of one repository active at one instant (first to last event, closed intervals), per day; a session spanning midnight counts on every day it spans |
| `commit_proximity` | share of sessions with a commit of their repository within the window (default 1 h) after the session; proximity, not authorship; sessions without a repository kept apart as unknown |
| `subagent_share` | subagent calls over all calls, and subagent cost over known cost (estimate, below) |

Layer 2 and layer 3 print one line each with their figures where the selection has the data, else
`not adopted` with the field that would enable them, never a number:

| Metric | Layer | Definition |
|---|---|---|
| `commits_per_unit` | 2 | commits carrying a unit id, per unit, by the day of the commit |
| `cost_per_unit` | 2 | known cost and tokens of the sessions of a unit, resumes included; the source of each session's unit |
| `resumes_per_unit` | 2 | sessions per unit minus one |
| `outcome` | 3 | task entries by self-assessed outcome; lanes by their final `Outcome:` line |
| `first_shot` | 3 | lanes ending `done` or `hard-stop` with no rework signal and no failed run (the lane board's rule); without lanes, units no later entry corrects |
| `cause_tally` | 3 | task entries by cause letter |
| `regression_rate` | 3 | task entries reporting a regression, over those answering yes or no |
| `out_of_scope_rate` | 3 | task entries reporting out-of-scope changes |

**Session units (layer 2).** A session's unit is the id leading its first user message (`[P-...]`, `P-...`,
or a `Prompt-ID: P-...` header line before the first `## `; the id is read in memory, the message is never
stored), else the unit of the commit nearest to its last event, within its window plus one hour, among the
commits **reachable from the session's branch**: the branch's ref, a remote ref of that name, or the second
parent of a merge whose subject names it (so a merged and deleted branch still links). A session without a
branch gets no unit, never another branch's. `sessions.unit_source` says which rule set it.

**Logs and lanes (layer 3).** `tack scan` reads `<toplevel>/.tack/log.jsonl` of every repository and the
imports under `~/.tack/imports/<repo-key>/log.jsonl` (`TACK_IMPORTS`), keeping only the contract's ids,
enums and dates (never title, summary, finding, files, notes or detail); lines failing contract v1 are
skipped and counted. When `~/.jjodel-lanes` (or `TACK_LANES`) exists, the lane-run adapter reads each lane
folder read-only (`started.txt`, `exit.txt`, `runs.jsonl`, `tier.txt`, `worktree.txt`, `session.txt`, the
`result` events and the final `Outcome:` line of `log.jsonl`) into `lanes` and `lane_spend`; an unchanged
folder is skipped by sizes and mtimes. No path is stored: the lane's worktree is resolved to a repository key
in memory.

**Days are local**: the calendar day of the machine running `tack` (`TZ`), the day the person at the
keyboard lived. The API (`loadSelection(db, { utc: true })`) switches every metric to UTC days; there is
no command-line flag for it yet, and `tack sessions` keeps printing UTC days. Session-level metrics
(sessions, cost) use the day of the first event, so a session that crosses midnight is booked whole on
its first day; tokens use each call's day and waits the day the gap started. The tests pin
`TZ=Europe/Rome`.

**Subagent cost is an estimate.** The transcript gives one cost per model per session, not per call.
For each model, its known cost is split between main-thread and subagent calls in proportion to
price-weighted tokens (input 1, output 5, cache read 0.1, cache write 1.25, the same ratio for every
Claude model). A billed model with no call in the transcript is reported as unattributed, and sessions
with cost but no per-model cost are counted apart. The absolute cost always comes from the transcript;
only the split is estimated.

The store is at schema version 4. Version 3 added `sessions.git_branch`, `session_repo.link_method` and
`link_reason`, `session_models`; version 4 adds `sessions.unit` and `unit_source`, `commits.reverts`, and the
tables `lanes`, `lane_spend` and `log_entries`. Older stores are migrated on open, and the next `scan`
re-reads main transcripts and every repository once to fill the new columns (rows are matched, none added).

## `tack import jjodel-log`

```
tack import jjodel-log [--repo <path>] [--out <file>] [--trunk <ref>]
```

Converts Jjodel's Markdown prompt log (`CLAUDE.md` §21.2 entries) to contract v1 JSON Lines. It reads the
trunk's `docs/log-inbox/*.md`, `docs/claude-code-log.md` and `docs/claude-code-log-archive.md` with
`git show <trunk>:<file>` (default trunk `alfonso-frontend-jjtl`, or `JJODEL_TRUNK`), splits and parses them
with a copy of the rules of Jjodel's `log-tools.ts`, and maps the fields: `Prompt` to `summary`, `Outcome`
emoji to `completed`/`partial`/`problems`, `Corregge` to `corrects`, `Causa` to `cause`, the heading's
`(P-...)` or `Prompt document name` to `unit`; `Smoke visivo`, `Layer Impact Report`, `Files touched` and
`Notes` are dropped. A unit with several task entries keeps its id on the oldest and gives the later ones the
suffix `-2`, `-3`. Lines that fail `tack check` are dropped and counted by rule. The output goes to
`~/.tack/imports/<repo-key>/log.jsonl` by default and is refused inside the repository.

## `tack parity jjodel`

```
tack parity jjodel [--days <n>] [--repo <path>] [--lanes <dir>] [--trunk <ref>] [--json] [--store <file>]
```

Holds Tack to Jjodel's lane board on the same machine: re-imports the log, reads the lane folders, then runs
a copy of the board's rules (`test/helpers/board-parity.mjs`: `spendByDay`, `logEntries`, the first-shot rule;
copied, not imported) and compares, over the last n local days (default 14), spend per day of the
repository's lanes (within 1%) and first-shot lane by lane (no difference). Each difference is listed with
its cause; the exit code is 1 when any remains.

## `tack board`

```
tack board [--port <n>] [--no-open] [--store <file>] [--root <dir>]
```

Runs an incremental `scan`, then serves a page on `http://127.0.0.1:4710/` (bound to 127.0.0.1 only)
and opens it with the platform command (`open`, `xdg-open`) unless `--no-open`. Started inside a git work
tree whose repository has a session in the store, it preselects that repository, by root commit, so a linked
worktree selects its main repository; elsewhere it shows all repositories. The selection lives in the URL (`?repo=<key>|all&since=&until=`);
nothing is written in the repository, only the store is.

The page is static files served from memory (`src/board/page.html`, `board.css`, `board.js`, `charts.js`,
`timeline.js`, `insights.js`, `lanes.js`), no build step, no CDN, no web font, no chart library; light and dark follow
`prefers-color-scheme`.

- **Lanes** is the first and default tab, drawn from `/api/lanes`. It answers one of four states, in order:
  lanes turned off for the selected repository (`harness.laneRun = off`), no lane-run folder on this machine,
  no lane of the selection, or the page; the first three show their sentence alone, no tile and no zero. The
  page has six tiles (running, waiting on a question or hard-stop, blocked now, done and resolved in 24 h,
  spend today), the lanes that need attention, a card per running lane (kind, tier, title, work against the
  median work of its kind over the done lanes of 30 days, shown only with five or more; tokens in, context
  peak, worktree, the chat of the prompt's `Chat:` line or «—»), the last 24 hours, the lanes by state, and
  the lanes whose closing message reported «Decisions taken (unattended)», with the count only. A waiting
  lane closes only on a commit naming its Prompt-ID after it ended (the tooltip says so); past 72 h it is
  counted, not listed. Phase progress and architect-chat tokens are shown disabled with their reason: not
  tracked in v0. The page refreshes every 20 s while it is shown and the browser tab is visible.
  Slice 9: a card per waiting lane sits above the running cards, longest waiting first: Prompt-ID and title,
  the wait as a pill (`GO` for a breakpoint, `answer` for a question, `ACK` for a ceiling, `hard-stop`),
  the reason (for a question its text, for a stop the first sentence of the closing message naming it, at most
  300 characters), the `Recommended:` line set apart, waiting since (relative and absolute), and the chat that
  must answer, linked when a URL resolves (the prompt's `Request:` line, else the `Claude-Session:` trailer of
  the commit that added it) and plain text otherwise. The text is read from the lane's `log.jsonl` when the
  page asks (`src/board/waiting.mjs`, memoised by the log's size) and never written to the store. A banner
  «N lanes waiting» scrolls to the cards; with exactly one waiting lane, the banner shows its card.
- **Sessions** lists one row per session, newest first, with a summary strip and filters. The column
  «Unit / branch» shows the session's unit (layer 2, above), the branch otherwise.
- **Timeline** draws one lane per repository (per branch when one repository is selected) on a Day or Week
  window, with ‹ Latest › navigation. A bar runs from the first to the last event of a session; a marker
  shows the first call at or above the context threshold (200k) and ticks show commits within the hour. A
  click or Enter selects the session in Sessions; hover shows the Sessions row fields.
- **Insights** is a KPI strip and cards drawn by the SVG helpers of `charts.js`: cost per day stacked by
  model family (a «?» marker counts sessions of unknown cost, never drawn as 0), sessions per day, the
  context-peak distribution, waits per day, overlap per day and the subagent share. The date range of the
  selection (`since`, `until`) applies to Insights as it does to Sessions. Layer-2 and layer-3 metrics
  with data have their own cards (lanes by outcome, the first-shot share, causes, resumes, the costliest
  units); the others stay dashed cards, `not adopted` with the field that would enable each. Charts are drawn
  at the pixel width of their card, so axis text stays 10 px at any width and the last label is never cut.

The chart helpers (`bars`, `line`, `meters`, `multiples`, `niceMax`, `dayRange`, `modelShort`) are pure
functions returning SVG strings, also run by `node --test` in a vm. Model families have fixed colours:
opus, sonnet, haiku, other (categorical palette slots 1, 2, 3, 7, validated in light and dark) and a
neutral for cost with no per-model attribution; tokens `--f-*` in `board.css`. A repository whose toplevel
folder is a bare hash is named after the folder that holds it, else `(unnamed) <key>`.

JSON API, all GET except the rescan:

| Endpoint | Returns |
|---|---|
| `/api/repos` | the preselected key and one row per repository: key, name, main toplevel, worktree count, remote host, state, sessions, commits |
| `/api/sessions?repo=&since=&until=` | one row per session: local day, start, duration, repository, branch, unit and its source (layer 2), link method, main-thread calls, context peak, cost (null when unknown, never 0), models, commit within the hour |
| `/api/metrics?repo=&since=&until=` | every declared metric with its layer and state (`computed` with its value, or `not-adopted`); cost per day also by model family |
| `/api/timeline?repo=&since=&until=` | per session, in epoch ms: start, end, main model family, first call at or above 200k, commit times within the hour |
| `/api/lanes?repo=` | `state` and `reason`; with `ok`, the tiles, `attention` (`waiting`, `blocked`, `staleCount`, `staleOldest`), `waitingCards` (each with `wait`: `kind`, `pill`, `reason`, `recommended`, `chatUrl`, `since`), `running`, `last24`, `byState`, `adoptions`, `medianByKind`; `updatedMs` and the `closure` rule always |
| `/api/attention` | the shape of Jjodel's lane board route for the menu bar app (`frontend/scripts/lane-board/README.md`, «The menu bar app's routes»): `v`, `now`, `stale`, `board`, `waiting`, `blocked`, `running`, `staleCount`, `staleOldest`, `items[]`, `runningItems[]`; all repositories, under 2 KB, no CORS header. `phase` and `left` are empty (not tracked) |
| `/api/health` | store path, schema version, last scan (time, duration, rows added), row counts |
| `POST /api/rescan` | runs the incremental scan again and returns the new last scan |

No response carries message text, a commit subject, an author, a session cwd below a repository toplevel
or a transcript path; `test/board.test.mjs` checks it with the fixture markers. A request whose Host is
not `127.0.0.1:<port>` or `localhost:<port>`, or whose Origin is another site, is refused.

## Settings, notifications and the load strip

### Settings

One schema, `contract/v1/settings.json`, and three files:

| Level | File | Kept in git | Holds |
|-------|------|-------------|-------|
| user | `~/.tack/settings.json` (or `TACK_SETTINGS`) | no | appearance, locale, channels, quiet hours, privacy, notification rows |
| project | `<repo>/tack.json` | yes | `harness.laneRun`, `limits.laneMinutes`, `budget.dailyUsd`, `idle.silentMinutes`, `context.hardTokens`, `load.threshold`, `git.unpushedMax`, `history.windowDays` |
| local | `<repo>/tack.local.json` | no (git-ignored) | personal overrides of the notification rows |

Precedence is default < user < project < local. Each key is one merge unit: the later level replaces
it whole, it is never merged field by field. Every key declares the levels it may appear at; a key at
another level is a violation, and so is any credential-shaped string (an ntfy topic URL or token, a
Slack or Discord webhook) in a project or local file. Channel credentials therefore live only in the
user file.

```
tack check <settings file>     # validates a settings file at the level its name stands for
tack settings [--repo <dir>]   # every key, its effective value and the level it comes from
```

`tack settings` masks the ntfy token. The board page `/settings` edits the user and local files
(atomic write); it never writes `tack.json`, and a project-only key is refused with 403.

### Notifications

The notifier is a set of rules over what the collectors already store; nothing hooks into lane-run.
The catalogue is `CATALOGUE` in `src/notify/notifier.mjs`. On by default: `lane_question`,
`lane_breakpoint`, `lane_ceiling`, `lane_hard_stop`, `lane_blocked`, `gate_red`, `context_hard`, `cz_ask`, `lane_silent`, `retention`.
Off by default: `lane_done`, `lane_started`, `merge_completed`, `daily_spend`, `host_load`,
`unpushed`. `merge_conflict` is listed but disabled in v0. A lane that ends `Outcome: hard-stop` fires one of three
events by its stop kind (slice 9): `lane_breakpoint` (a planned stop, waits for a GO), `lane_ceiling` (the context
ceiling, handoff written) or `lane_hard_stop` (unplanned). Each row has `enabled`, a `scope` (`all`,
`fronts` or `chats`) and its `channels`.

An occurrence is sent once, on its rising edge: it is claimed in `notify_events`, so a poll never
repeats it and a restart replays none. The first evaluation of a rule only records a baseline; an
occurrence seen while its row is off is suppressed, so turning a row on never floods; an occurrence
older than 24 h at first sight is stale and not sent.

Channels: `desktop` (osascript, with the message passed as arguments, no shell) and `ntfy` (an HTTP
POST; disabled by default, enabled in the user file together with its topic). In quiet hours (`quietHours`, default 22:00 to
08:00 when enabled) only urgent events (`lane_question`, `lane_blocked`) go out; the rest are queued
and sent as one digest when the quiet hours end.

Privacy: a message carries kind, unit, front, repository name, outcome and a board link, and nothing
else; `privacy.repoName` and `privacy.boardLink` drop the last two.

```
tack notify --watch                       # standalone notifier
tack notify test <desktop|ntfy> [--dry-run]
```

`tack board` runs the notifier too. One store has one notifier: a lease in `notify_lease` decides
which process sends, and the others wait for it to lapse. `TACK_NOTIFY=off` turns it off in both
commands. Tests inject the transports and never send.

### Load strip

The board's top bar shows the host load: 60 bars, one per 5 s sample (5 minutes), the 1-minute load in
figures, a dashed line at `load.threshold` (raw load, default 20), and a tick where a lane started or
ended. `GET /api/load` serves the samples. `appearance.loadNormalised` divides the display by the core
count; the threshold stays raw. The process holding the notify lease also stores one sample per minute
in `host_load`.

### Collect on read

`/api/lanes` reads the lane folders itself when no notifier holds a fresh lease (`TACK_NOTIFY=off`, say),
at most once every 20 s; with a notifier running it only reads the store. `updatedMs` is the latest
collection, the board's or the notifier's heartbeat.

### Store schema 5

Schema 5 adds `notify_events`, `notify_baseline`, `notify_lease` and `host_load`. Like every table,
their columns are listed with their sources in `NOTIFY_COLUMN_SOURCES` and `HOST_COLUMN_SOURCES`, and
`test/privacy.test.mjs` checks them.

### Store schema 6

Schema 6 adds six `lanes` columns for the Lanes page: `kind` (the prompt's `Lane:` line, or its file name
for a merge), `title` (its first `# ` line, at most 200 characters), `work_ms` (the sum of the turns),
`worktree`, `resolved` (`resolved.txt` exists) and `adoptions` (the items of the «Decisions taken
(unattended)» section of the last closing message; the text is not kept). The migration marks every lane
for one re-read.

### Store schema 8

Schema 8 adds four `lanes` columns for the three kinds of stop. `stop_kind` is `breakpoint`, `ceiling` or
`hard-stop` for a lane whose last turn ended `Outcome: hard-stop`, else null. By order: a `Stop: planned |
ceiling | unplanned` line in the last result wins; else `handoff.md` present and the result naming the
context ceiling or a handoff is a ceiling; else a `## HARD STOP` section of the prompt (prompt.txt, or
`input-1.md` when that file is gone) that is not «None» and that the lane is a discovery for, or the result
says it reached, is a breakpoint; a prompt with no `## HARD STOP` section at all (not one that says «None»)
and a result naming a planned stop (Phase 1, a visual check, a committed report) is a breakpoint too (stop rules 2,
slice 9); else a hard-stop. `resumes` and `auto_resumes` count the resume messages
and those starting with `[auto]` after an optional `[P-...]` bracket (the chat's mark for a resume sent in
`/lane auto`; earlier resumes carry none and get no pill); no message text is kept. `stop_scanned` holds the version of
the stop rules a lane was scanned under (`STOP_RULES`; a lane scanned under an older one is scanned again): a lane read before schema 8 is scanned once, by UPDATE, keeping its other
columns. The lane-run output and the `Outcome:` token are unchanged.

## Tests

```
npm test        # node --test, from tack/
```

License: MIT.
