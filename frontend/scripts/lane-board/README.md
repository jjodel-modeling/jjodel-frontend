# Lane board

A live, read-only board of the Jjodel lanes started by `lane-run`, served on
http://localhost:4700. A Node server with no dependencies (`lane-board.mjs`) and two
browser scripts it serves beside its page (`timeline.js`, `insights.js`).

It reads `lane-run status --all`, the lane folders of `~/.jjodel-lanes/`,
`git log --all` of the repository, and the log entries and `docs/decisions.md` of the
trunk ref. It never launches, resumes, merges
or kills a lane and never writes in a worktree. The only file it writes is its own
cache, `~/.jjodel-lanes/board/timeline-cache.json` (best effort: if the directory is
missing the write is skipped and finished lanes are read again).

## The three tabs

**Lanes.** A table of the running and blocked lanes: state, kind (from the `Lane:`
line of the prompt) and tier, elapsed time, an estimate of the time left, the current
phase (the last tool description in the lane's `log.jsonl`), the worktree and who
launched it. The estimate is a heuristic, not a promise: a measured median per kind,
minus the elapsed time, corrected by the phase and the load average. Below it, the
earlier lanes grouped by day, with their outcome.

**Timeline.** One row per lane, grouped by worktree or by launcher, over the last
24 h, 3 days, 7 days or all time. Each turn is a bar coloured by its outcome; the gap
between two turns is a wait for a decision (GO, ACK or answer), and the decision text
is the first line of the `input-<k>.md` that started the next turn. Lanes open at the
same time on the same worktree are flagged as overlaps. Dependencies are drawn as
arrows: solid for a `Depends:` header line, dashed for a Prompt-ID merely cited in the
prompt, and in their own colour for the steps of a chain. A parallelism chart counts
the lanes working at once.

**Insights.** Aggregates over the last 7 days, 30 days or all time: when the lanes
work (lane-hours per hour of the day), how long they wait for a decision and the
longest waits, lanes per day by outcome, outcome by kind of lane, and who launches
the lanes. It also offers the two exports below, and can open the trace directly in
ui.perfetto.dev. Below these, three sections read `/api/insights` (next section):
code areas, model by area and by size, and first-shot success over time.

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
`127.0.0.1` only. Port 4700 is deliberately outside the 30xx range used by the dev
servers and probes (3000, 3001, the `lane-run probe` and `monitor` ports), so the
board never competes with them.

## Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `JJODEL_LANES` | `~/.jjodel-lanes` | Root of the lane folders. |
| `LANE_RUN` | `../lane-run.mjs` beside the board when it exists, else `~/jjodel-release/frontend/scripts/lane-run.mjs` | The `lane-run` script asked for `status --all`. |
| `JJODEL_REPO` | `~/jjodel` | Repository whose `git log --all` classifies the launcher and links lanes to commits. Any worktree serves: the board reads refs, never its working files. |
| `JJODEL_TRUNK` | `alfonso-frontend-jjtl` | Trunk ref whose log entries, `docs/decisions.md` and prompts the Insights sections read. |
| `LANE_BOARD_CACHE` | `$JJODEL_LANES/board/timeline-cache.json` | Cache of the finished lanes' timelines. |
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
`0` means all) and `&download` to be served as an attachment.
