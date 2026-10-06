# Lane board

A live, read-only board of the Jjodel lanes started by `lane-run`, served on
http://localhost:4700. A Node server with no dependencies (`lane-board.mjs`) and two
browser scripts it serves beside its page (`timeline.js`, `insights.js`).

It reads `lane-run status --all`, the lane folders of `~/.jjodel-lanes/`, and
`git log --all -- docs/prompts/` of the repository. It never launches, resumes, merges
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
ui.perfetto.dev.

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
| `JJODEL_REPO` | `~/jjodel` | Repository whose `docs/prompts/` history classifies the launcher. |
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
  <string>/Users/alfonso/jjodel/frontend/scripts/lane-board/lane-board.mjs</string>
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
