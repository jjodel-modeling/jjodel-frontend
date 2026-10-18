# Lane board

A live, read-only board of the Jjodel lanes started by `lane-run`, served on
http://localhost:4700. A Node server with no dependencies (`lane-board.mjs`) and three
browser scripts it serves beside its page (`timeline.js`, `insights.js`, `requirements.js`).

It reads `lane-run status --all`, the lane folders of `~/.jjodel-lanes/`,
`git log --all` of the repository, and the log entries and `docs/decisions.md` of the
trunk ref; for the Requirements tab it runs `../req-trace.mjs` on its own checkout. It
never launches, resumes, merges
or kills a lane and never writes in a worktree. The only files it writes are its own
caches, `~/.jjodel-lanes/board/timeline-cache.json` and, beside it, `usage-cache.json`
(best effort: if the directory is missing the write is skipped and finished lanes are
read again); `req-trace.mjs` keeps its own cache in the system temp folder (below).

## The four tabs

**Lanes.** A table of the running and blocked lanes: state, kind (from the `Lane:`
line of the prompt) and tier, elapsed time, an estimate of the time left, the current
phase (the last tool description in the lane's `log.jsonl`), the worktree and who
launched it, and five token columns after Span (Tokens, below). The Phase cell draws the lane's progress on its first line and the phase
text, cut, on its second (next section). The estimate is a heuristic, not a promise: a
measured median per kind, minus the elapsed time, corrected by the phase and the load
average. Below it, the earlier lanes grouped by day, with their outcome.

**When the status is slow.** `/api`, the data of the Lanes tab and the strip, runs
`lane-run status --all` as a child process, one run at a time, killed after 15 s, and keeps
the answer 10 s. A request that arrives while a run is in flight gets the last answer at once
with `refreshing: true`. A run that fails or times out after a success answers that success's
rows with `stale: true`, `staleSince` (ms of the success) and `error`; only before any success
are the rows empty. The page draws stale rows and counts them in the strip, under an amber
line `Status timed out at load <x>; showing data from <HH:MM:SS>.` in place of the red error.
A spinner beside "updated at" turns while a request to `/api` or `/api/*` is in flight, from
any tab, or while the last answer said `refreshing`, when the page asks again in 2 s; before
the first answer the Running table reads "Loading lanes…".

**Status strip.** Six pills end the tab bar, whichever tab is open: running,
question, hard-stop, blocked, resolved and done in the last 24 hours, each with its
count, in the outcome colours of the Lanes table (hard-stop in its soft green), a
zero count dimmed. A lane running or over its time limit counts by its state, an
exited lane by its outcome, a chain by its state; done counts only the last 24 hours,
the other outcomes every lane. A click on a pill opens the Lanes tab filtered to that
state: its running lanes, then its exited ones, in the same tables and columns as the
unfiltered tab. A second click on the same pill, or "show all lanes" beside the
heading, brings the full tab back; the filter survives the refresh. The page counts
with `stripKey`, the function the server exports, embedded in the page as written.

**Timeline.** One row per lane, grouped by worktree or by launcher, over the last
24 h, 3 days, 7 days or all time. Each turn is a bar coloured by its outcome; the gap
between two turns is a wait for a decision (GO, ACK or answer), and the decision text
is the first line of the `input-<k>.md` that started the next turn. The last turn of a
`resolved` lane is drawn in the colour of done, and its title and the lane's detail
read `blocked, resolved`. Lanes open at the
same time on the same worktree are flagged as overlaps. Dependencies are drawn as
arrows: solid for a `Depends:` header line, dashed for a Prompt-ID merely cited in the
prompt, and in their own colour for the steps of a chain. A parallelism chart counts
the lanes working at once.

**Insights.** Aggregates over the last 7 days, 30 days or all time: when the lanes
work (lane-hours per hour of the day), how long they wait for a decision and the
longest waits, lanes per day by outcome, outcome by kind of lane, and who launches
the lanes. It also offers the two exports below, and can open the trace directly in
ui.perfetto.dev. Below these, four sections read `/api/insights` (next section):
code areas, model by area and by size, first-shot success over time, and Tokens.

**Requirements.** Every R- row of `docs/decisions.md`, grouped by co-citation cluster and,
inside a cluster, by milestone, with whether a commit on the trunk realized it and its
goal-model contributions; filters by family, status, realized and softgoal. Below, the
softgoal balance (one diverging bar per softgoal, under its macro goal), the clusters by
macro goal matrix, the side effects between softgoals, and the pairs of realized rows that
pull a softgoal both ways, grouped by declared conflict. See
"The Requirements tab" below.

## Tokens

`../lane-usage.mjs` (P-2026-10-18-0100) is the single source: the board imports its
`laneUsage`, `allIntervals` and `overlap` and never parses `message.usage` itself. Per lane:

| Column | `/api` field | What it is |
|--------|--------------|------------|
| In | `tokensIn` | The main session's input + cache_read + cache_creation, summed over its calls (deduplicated by `message.id`). |
| Out | `tokensOut` | The output of the last `modelUsage`, all models of the lane; the per-call output is the count at stream start. |
| Total | `tokensTotal` | In + Out (In alone while no result event has an output). |
| Arch | `archIn`, `archOut`, `archTotal`, `archChat`, `archOpen` | The architect's tokens over the lane, from `architect.json` (Arch, below). Between Total and Ctx max. |
| Ctx max | `ctxMax` | The largest main context of one call. |
| (title of In) | `tokensSub` | The four classes of the subagent calls, kept out of In: `subagents: <n> tokens`. |

The cells are abbreviated (`12.3k`, `3.1M`, en-US, one decimal) with the exact integer in
the title, and read `n/a` when the lane has no per-call usage (a direct merge, a lane folder
without `log.jsonl`); the fields are integers or `null`. The five columns are 72 px each in
both variants; to keep Phase and Outcome their room, Worktree went from 144 to 112 px and
the Lanes tab's page is 328 px wider than the other tabs (1608 px, `main.wide`).

The Insights **Tokens** section groups the closed lanes of the range by tier (the first word
of `tier.txt`) and by model (the first `init`): lane count, median and sum of Total, median
Ctx max, the lanes with at least one call at or above 200k and 250k, and the seven-day
utilization delta summed over the lanes that ran alone, with their count beside it: a lower
bound, since interactive sessions are not visible to `lane-run`. The page groups with
`tokenGroups` and writes the numbers with `abbr`, the functions the server exports, embedded
as written. `/api/insights` carries the raw numbers per lane in `tokens` and, for the architect, in `arch`.
Per tier and per model the block adds the sum and the median of Arch over the closed lanes that
carry it, and Arch / exec: the sum of Arch over the sum of Total, with the number of lanes that
carry both beside it (`archSum`, `archMedian`, `archRatio`, `archLanes`).

### Arch (P-2026-10-18-1155)

The architect is the project chat that writes the prompts and drives the lanes. It is a session of
its own that `lane-run` cannot see, so the chat writes, in each lane folder,
`~/.jjodel-lanes/<Prompt-ID>/architect.json` with its own cumulative counters at launch and at
close. The board and `lane-usage.mjs` only read it; neither ever writes it. Schema 1:

```json
{ "schema": 1, "chat": "C-2026-10-17-1757", "model": "claude-fable-5-1", "source": "<free text>",
  "launch": { "at": <epoch seconds>, "calls": n, "input": n, "cacheRead": n, "cacheCreation": n, "output": n, "totalIn": n, "ctxMax": n, "ctxLast": n },
  "close":  { same fields, or absent while the lane is open },
  "delta":  { "calls": n, "input": n, "cacheRead": n, "cacheCreation": n, "output": n, "totalIn": n } }
```

`launch` and `close` are cumulative since the chat session started; `delta` is `close` minus
`launch` and is what the lane cost the architect (read from `close` minus `launch` when a closed
file has no `delta`). The Arch cell is `totalIn + output` of the delta, abbreviated, with
`in`, `out`, `total` and the chat id in the title; `open` while `close` is absent (the delta is not
known); `n/a` without the file or when it is not schema 1 (`lane-usage.mjs` says `architect:
unreadable`). `lane-usage.mjs` prints an `architect` line, adds `architect`, `architectOpen` and
`architectUnreadable` to its JSON, and an `arch` column to `--all`. The file is read on every
request, uncached: it is a few hundred bytes and the chat rewrites it at close.

The usage of a lane is cached in `usage-cache.json`, beside the Timeline cache, keyed by the
size and mtime of its `log.jsonl`: a refresh recomputes only the lanes whose log changed.
`alone` is not cached; it is recomputed from the lane intervals on every read. Measured on
509 lane folders (2026-10-18): 2.6 s cold, 8 ms warm.

## Progress, the estimate and `resolved`

**Progress.** A running lane's `/api` row carries `progress`: `{ reached, total, current,
steps: [{ name, state }] }`, a ladder of milestones read from the tool calls of its
`log.jsonl`. The ladder follows the kind:

| Kind | Milestones |
|------|------------|
| phase2, fast | Orient, Read, Tests first, Code, Gates, Probe, Commit, Closure |
| discovery | Orient, Read, Probe, Report, Commit, Closure |
| merge | Measure, Merge, Gates, Commit, Closure |

Orient is a `pwd` or `git log` before the first write in the tree; Read a read of
`frontend/src` or `frontend/scripts`; Tests first a test written or run before the code;
Code a write to a source file there (an edit tool, a redirection, `sed -i`, or a `python3`
or `node` heredoc that opens it to write; tests, probes and `_tmp_` files excluded);
Gates, Probe and Commit count after the code; Closure is a docs commit that carries the
log inbox or the prompt's Status. Report is a write under `docs/discovery/`; Measure a
`pwd` or a reading git command before the `git merge`. A step is `reached`, `skipped`
(not reached while a later one is) or `pending`; `current` is the last one reached. The
log is read on from where the last read stopped, keeping only tool calls and git's
result lines. A kind without a ladder, and a direct merge (a lane folder holding
`direct.json`: its log is the worker's, with no tool call), have `progress: null`. The Phase cell draws one segment
per step and `reached/total`, with the phase text below; both lines are drawn with or
without progress, so a row keeps its height as the lane advances.

**The estimate with progress.** Without progress the rule above is unchanged. With it, the
time left is the mean of that rule and the median times the share of the ladder above
the current milestone: `(rule + median × (1 − position/total)) / 2`, where `position` is
the current milestone's place in the ladder, so a skipped step counts as behind the lane.
A phase that names a gate still reads `under 5 min`, and so does the last milestone;
otherwise a phase that names a probe still reads `about 5-15 min`.

**`resolved`.** An exited lane whose outcome is `blocked` and whose folder holds
`resolved.txt` (one line, date, who and why, written by `lane-run resolve`) shows the
outcome `resolved` in the Lanes tab and its strip, in the colour of `done`. `/api/timeline`
keeps the raw `blocked` in `outcome`, for the two exports, and carries the overlay beside it
as `resolved: true`: Timeline paints the lane's last turn in the colour of done, and the
outcome charts of Insights (per day, by kind, by launcher) count it as resolved, in its own
legend entry. The first-shot sections of Insights read `/api/insights`, which keeps the
outcome of the log: a resolved lane still counts as a run that ended blocked there, on
purpose, since first-shot success measures the lane, not the repair made after it. The two
views of one lane differ by design, not by a bug.

## Models, code areas and first-shot success

`/api/insights` (discovery `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`)
returns one record per lane; `insights.js` aggregates them by the tab's range.

- **Model** from the `init` event of `log.jsonl`; direct merges have no session and carry
  `model: null`, so they stay out of the model views. Cost and output tokens are the
  largest `total_cost_usd` and `modelUsage` of the lane: both are cumulative over the
  session, a resume restores them. Cost is list price.
- **Commits** by the `(P-…)` suffix of their subject, or a `Prompt-ID:` trailer; changed
  lines outside `docs/`, probes (`frontend/scripts/probe/`, `_tmp_` files) excluded.
- **Areas**: viewpoint, simulator, canvas, languages, model core, harness, other UI, the
  first match by path. A lane's primary area holds most of its changed lines; the six
  critical-zone files of `CLAUDE.md` §3.2 are a flag on the lane, not an area.
- **First-shot**: the lane ends `done` or `hard-stop`, with no corrective resume (the class
  of each `input-k.md`), no later log entry whose `Corregge` names it, no reverted commit,
  and no run that ended blocked or ran past 90 minutes. Running lanes are left out.
- **Thresholds**: every cell shows its n; the rate is hidden below 5 lanes and greyed
  below 10.
- **Drawn lanes** (RC-45): `drawn` is `heavy` or `light` for a lane whose tier was drawn at
  random, `null` otherwise. The tier comes from the ledger `lane-run` writes,
  `~/.jjodel-lanes/rc45-draws.jsonl` (its first entry for the Prompt-ID), else from a
  `tier.txt` that reads `<tier> (<model>): drawn (RC-45), <n>/40` (a `not drawn (RC-45)`
  note does not count), else from a `Lane:` line that says `tier drawn (RC-45): heavy|light`.
  The model section can show those lanes alone, with the heavy/light split of the range.

Log facts ride the per-lane cache (key `v6`). The git facts are rebuilt only when the
hash of `git for-each-ref` changes, and then only for the commits since the last scan.
The log entries and RC rows are re-read only when the trunk moves.

## The Requirements tab

`/api/requirements` runs `frontend/scripts/req-trace.mjs` (beside the board's folder) as
`node req-trace.mjs --repo <checkout> --trunk <ref>` and returns its JSON as it is;
`requirements.js` draws it. The checkout is the one the board runs from (three levels above
`lane-board.mjs`), the trunk `alfonso-frontend-jjtl`; `REQ_TRACE_REPO` and `REQ_TRACE_TRUNK`
override them.

- **What it reads.** `docs/decisions.md`, `docs/prompts/*.md` and, when present,
  `docs/goals/{cluster-names,cluster-descriptions,milestones,softgoals,contributions,conflicts,goal-tree,correlations}.json` from the
  **working tree** of that checkout, not from the trunk ref: for the launchd agent, the
  working tree of `~/jjodel-release`. Uncommitted edits there show in the tab; a clean tree
  at the trunk tip shows the trunk. What realized a row comes from git: the `feat`, `fix`, `refactor` and
  `perf` commits reachable from the trunk ref that cite its id.
- **One run at a time, 60 s, 120 s.** The run is asynchronous, so the other tabs keep
  answering. Requests that arrive while it runs share it; its JSON is kept 60 s from the
  end of the run; a run that fails is served once and not kept; a run still going after
  120 s is killed, and the tab shows `req-trace killed after 120 s`. `req-trace.mjs` caches
  its git side in `$TMPDIR/jjodel-req-trace/<trunk sha>.json`, so a run on an unchanged
  trunk rereads only the register and the prompts.
- **Milestones.** Inside a cluster, a realized row sits under the first milestone on or after
  its first commit, then come the rows realized after the last milestone, then the rows not
  realized. The milestones are those of `docs/goals/milestones.json` when it exists, else
  the one built into `req-trace.mjs` (MODELS freeze, 2026-10-07); the tab adds none.
- **Softgoal balance** (P-2026-10-11-1735). Reads `goalModel.balance` (per softgoal, the
  realized rows that help it and those that hurt it, in id order) and `goalModel.tree`
  (`docs/goals/goal-tree.json`). One block per macro goal in tree order, its id, name and
  description; the softgoals in no macro goal, or all of them when the tree is absent, in a
  last block "Other softgoals". One row per softgoal: a 200 px label (id, name, `n help · m
  hurt`), then a diverging bar on one scale for the whole section: the hurting rows left of a
  centre axis in one red, the helping rows right of it as one segment per cluster, the largest
  first (ties in the order of the cluster groups, unclustered last), two blues alternating
  with a 2 px gap, the cluster and its count in the segment's title. The scale is computed
  once: a 720 px track holds the largest hurt count, the largest help count and the most
  gaps, so equal counts have equal widths in every bar and every left side is as wide as the
  largest hurt, which aligns the axes. Under the bar, the hurting rows as chips, the row title
  in the title. A click on a segment opens under the softgoal the cluster's helping rows (id,
  title, kind, evidence) beside the hurting rows, from which any pair can be rebuilt; one list
  per softgoal, a second click closes it.
  It replaces "Pairs without a declared conflict, by softgoal": for every softgoal those pairs
  were exactly the product of the realized rows that help it and those that hurt it (SG-1: 61
  x 18 = 1098 of 6569 pairs on 2026-10-11), so the tables said nothing the two sets do not,
  and read as noise.
  `goalModel.opposing` is still in the document.
- **Clusters by macro goal.** Reads the same rows, the cluster groups and the tree. One row
  per cluster, in the order and with the names of the groups above, unclustered last; one
  column per macro goal, plus "Other" when a softgoal is in none. A cell reads `+h / −k`: the
  cluster's realized rows that help, and that hurt, any softgoal of that macro goal; a row
  counts once on each side, so a row that helps one of its softgoals and hurts another counts
  on both. Background in five steps of one blue by `h + k` (the step is `ceil(5 (h + k) /
  max)`), an empty cell blank, `−k` in the danger colour when `k > 0`. A click on a cell lists
  under the matrix the rows behind it, each once, with their contributions to that macro
  goal's softgoals; a second click closes it.
- **Side effects between softgoals.** Reads `goalModel.correlations`
  (`docs/goals/correlations.json`) and appears only when it has links: a closed group, one
  line per link (from, to, kind, the witness ids as chips, `why` in the title), ordered by the
  macro goal of `from`, then of `to`, the file's order inside.
- **Opposing contributions.** Last, under its own heading: one closed group per conflict of
  `docs/goals/conflicts.json`, in its order, named by its two rows and its softgoal, with its
  pair count; a pair belongs to a conflict with the same softgoal and the same two rows, in
  either order; a conflict that names no pair still has its group, which says why. The tab
  remembers which groups, balance lists and matrix cell a viewer opened.
- **Cluster names.** `req-trace.mjs` names a cluster by its families and title words joined
  by an em dash; the tab draws ` · ` in its place, and does the same in every other text it
  draws, titles included (descriptions, `why`, commit subjects).
- **Fixed widths.** Every table of the tab has a fixed layout, and the tables of one kind
  share their column widths, so a filter or an opened group never moves a column. The bars
  and the lists have fixed widths too, and a bar row a fixed height: an opened list or cell
  adds content below and never moves a bar, an axis or a matrix column.

## Running it

From the repository root:

```bash
node frontend/scripts/lane-board/lane-board.mjs [--port 4700] [--refresh 30]
```

or, from `frontend/`:

```bash
npm run lane-board
```

`--refresh` is the page's polling interval in seconds. The server listens on
`127.0.0.1` only, and only when the file is run as a script: importing it, as its tests
do, opens no port. Port 4700 is deliberately outside the 30xx range used by the dev
servers and probes (3000, 3001, the `lane-run probe` and `monitor` ports), so the
board never competes with them.

## Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `JJODEL_LANES` | `~/.jjodel-lanes` | Root of the lane folders. |
| `LANE_RUN` | `../lane-run.mjs` beside the board when it exists, else `~/jjodel-release/frontend/scripts/lane-run.mjs` | The `lane-run` script asked for `status --all`. |
| `JJODEL_REPO` | `~/jjodel` | Repository whose `git log --all` classifies the launcher and links lanes to commits. Any worktree serves: the board reads refs, never its working files. |
| `JJODEL_TRUNK` | `alfonso-frontend-jjtl` | Trunk ref whose log entries, `docs/decisions.md` and prompts the Insights sections read. |
| `LANE_BOARD_CACHE` | `$JJODEL_LANES/board/timeline-cache.json` | Cache of the finished lanes' timelines; `usage-cache.json` sits in the same directory. |
| `LANE_USAGE` | `../lane-usage.mjs` beside the board when it exists, else `~/jjodel-release/frontend/scripts/lane-usage.mjs` | The script the token columns come from; without it they read `n/a`. |
| `REQ_TRACE_REPO` | the board's own checkout, three levels above `lane-board.mjs` | Checkout whose working tree the Requirements tab traces. |
| `REQ_TRACE_TRUNK` | `alfonso-frontend-jjtl` | Trunk ref whose history decides which rows are realized. |
| `LANE_BOARD_PORT` | `4700` | Port, overridden by `--port`. |
| `LANE_BOARD_REFRESH` | `30` | Refresh in seconds, overridden by `--refresh`. |

## launchd agent

On Alfonso's Mac the board runs as the launchd agent `io.jjodel.lane-board`. A
minimal `~/Library/LaunchAgents/io.jjodel.lane-board.plist` (use an absolute node and
an absolute script path; launchd does not expand `~`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>io.jjodel.lane-board</string>
<key>ProgramArguments</key><array>
  <string>/opt/homebrew/bin/node</string>
  <string>/Users/alfonso/jjodel-release/frontend/scripts/lane-board/lane-board.mjs</string>
  <string>--refresh</string><string>30</string>
</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>/Users/alfonso/.jjodel-lanes/board/board.log</string>
<key>StandardErrorPath</key><string>/Users/alfonso/.jjodel-lanes/board/board.log</string>
</dict></plist>
```

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/io.jjodel.lane-board.plist  # load and start
launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board                             # restart after an update
launchctl bootout gui/$(id -u)/io.jjodel.lane-board                                  # stop and unload
```

## Who launched a lane

The launcher is read from the commit that added the lane's prompt to `docs/prompts/`
(`git log --all --diff-filter=A`, refreshed every 5 minutes), in this order:

1. **chain**: the lane is a step after the first of a `lane-run chain`.
2. **lane-run**: a merge or take-trunk prompt, which `lane-run` writes itself.
3. **chat**: the commit carries a `Claude-Session:` trailer (a claude.ai chat), or the
   prompt names its chat in a `Chat: C-...` line, or a trailer names a chat.
4. **Claude Code**: a `Co-Authored-By: Claude` or `Model:` trailer and no chat.
5. **manual**: neither; the label is the commit author.
6. **unknown**: no commit adds a prompt with that Prompt-ID.

## Exports

- `/export/trace.json`: Chrome Trace Event format, opens in ui.perfetto.dev. One
  process per worktree, one thread per lane, turns and waits as slices, decisions as
  instants, dependencies as flow arrows, and a counter track of the lanes working.
- `/export/lanes.xes`: an XES event log for process mining tools.

Both take `?days=<n>` (lanes whose last turn ends within the last `n` days; absent or
`0` means all) and `&download` to be served as an attachment. Both carry the raw outcome:
the XES trace attribute comes from `/api/timeline`, which turns the Lanes tab's
`resolved` back into `blocked`, and the trace events carry each turn's own outcome.
