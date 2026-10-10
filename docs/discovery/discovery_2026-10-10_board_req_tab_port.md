# Discovery: what harness-req-tab still adds to the trunk board

- Prompt-ID: P-2026-10-10-1806 (`docs/prompts/claude_2026-10-10_1806_prompt_board_req_tab_port_discovery.md`)
- Chat: C-2026-10-10-0840 · session `bd3c96de-81df-433b-944b-618938bd5773` · executor model: Opus 5.5 (`claude-opus-5-5`)
- Tree: `~/jjodel-w-reqport`, branch `board-req-port-disc`, HEAD `33f167305` (cut from the trunk at `45ad56bd6`).
  The trunk tip was `834152b68` while this was read. `git diff --stat 45ad56bd6 alfonso-frontend-jjtl` over
  `frontend/scripts/lane-board`, `lane-run.mjs`, `hooks/__tests__` and `frontend/package.json` is empty, so the
  trunk files read here are the trunk tip's.
- Branch under study: `harness-req-tab`, tip `35240a582`, merge base `57ff86f5d`. It was read with `git show` and
  `git diff` only, never checked out. `~/jjodel-w-reqtab` and `~/jjodel-w-boardprog` were not touched.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real
  files. **[measured]** = a run in this session; **[read]** = a file or a commit message.

## 0. Answer in brief

1. The branch adds five things the trunk board lacks: the **status strip** with a filter view, the **Requirements
   tab**, **progress milestones** for running lanes, the **`resolved`** overlay on outcomes, and **`lane-run
   resolve`**. Everything else on the branch is an older copy of the live board, and the trunk has moved past it
   (Started/Ended/Span, Launched by, Request, Insights v1, newest first, the timeline cache in `~/.jjodel-lanes/board/`).
2. `req-trace.mjs` does not depend on the parallel board. Run as a temp copy against the current register, it
   exits 0 in 10.5 s cold: 501 R- rows, 294 realized, 17 clusters, Q 0.726, goal model present **[measured]**.
3. The `lane-run.mjs` hunks still apply. A trial `git merge-tree` against the trunk gives one conflict in them, in
   `laneFiles()` (`request:` vs `resolved:`; keep both). The `laneRun.test.ts` hunk merges cleanly **[measured]**.
4. A plain merge of the branch would not conflict on the board: its files live at other paths
   (`frontend/scripts/lane-board.mjs`, `frontend/scripts/board/`). It would leave **two boards**. So this is a
   port, not a merge.
5. Tests: the milestone, estimate, strip-count and req-trace tests carry over. Most need one path change, plus
   the trunk board learning not to listen on import and exporting its functions. One test dies: "board/ assets
   served from board/". One assertion must change: `/api` rows now carry `t`, `launcher`, `start`, `end`, `work`.
6. A third board branch is pending beyond the two the prompt names: `board-kindof-merges` (P-2026-10-10-1803,
   `kindOf`). Trial-merged with `lane-board-columns`, the only conflict is the inbox union in
   `docs/log-inbox/harness.md` **[measured]**.
7. Port plan: merge the three pending branches first. Then five slices: S1 lane-run `resolved`/`resolve`,
   S2 board core (exports, no listen on import, progress, resolved overlay), S3 req-trace. These three are
   parallel (disjoint file sets, RC-22). Then S4 strip plus resolved colours, then S5 Requirements tab;
   `lane-board.mjs` is shared, so S2, S4 and S5 are sequential.
8. Layout collision: with `lane-board-columns` the Running table's fixed columns sum to 1100 px, leaving Phase
   about 146 px of the 1246 px table. A separate Progress column (about 120-140 px) would leave Phase near zero.
   Recommended: draw the progress segments inside the Phase cell.
9. Retirement: tag `archive/harness-req-tab-2026-10-10` on `35240a582`. That tip contains `harness-board-progress`
   (`888076986`) too. Deleting both branches and both worktrees waits for Alfonso (RC-26).
10. Data risks for the Requirements tab, measured on today's register. The built-in milestone (MODELS freeze,
    2026-10-07) is past: 9 realized rows fall after it. The opposing-contribution table would list 612 pairs.
    The 1720 lane never saw the goal model, which landed after its commit.

## 1. Goal

Inventory what `harness-req-tab` (C-2026-10-05-1648, lane P-2026-10-05-1720, which absorbed P-2026-10-05-1705)
adds over the trunk board in `frontend/scripts/lane-board/`. Then plan the port onto that board in slices, and state
how to retire the branch. No code change and no merge in this lane.

Hypotheses under test, with the verdicts:

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | The trunk board has none of the branch's user-facing features (strip, Requirements, progress, resolved). | **Holds** (§3, searches with positive controls). |
| H2 | Outside its own hunks, the branch's board is an older copy of the live board, and the trunk is ahead of it. | **Holds** (§3.1: the branch's `board/timeline.js` vs the trunk's first copy `b5fc46477` differs by the branch's `resolved` hunks plus trunk-only launcher and depends code). |
| H3 | The branch's `lane-run.mjs` hunks still apply to the trunk's `lane-run.mjs`. | **Holds**, one one-line conflict (§4). |
| H4 | `req-trace.mjs` is independent of the parallel board. | **Holds** (§6: no import of the board; standalone probe exit 0). |
| H5 | The branch's tests run against `frontend/scripts/lane-board/` after a path change. | **Partly** (§5: the pure-function tests do once the board exports and stops listening on import; three board-run assertions change; one test dies). |
| H6 | The port splits into parallel slices with disjoint file sets. | **Partly** (§7: three slices are parallel; three share `lane-board.mjs` and must run in sequence). |

## 2. Files read (full paths)

Trunk, in `/Users/alfonso/jjodel-w-reqport/` (HEAD `33f167305`, the same files as trunk tip `834152b68`):
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/lane-board/lane-board.mjs` (962 lines; read 1-180, 379-464, 638-700, 823-962)
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/lane-board/timeline.js` (444 lines; grep of outcome sites, 27-39, 81, 183, 235-238, 315-330)
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/lane-board/insights.js` (426 lines; grep of outcome sites and fetches)
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/lane-board/README.md` (146 lines; 84-146)
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/lane-run.mjs` (2483 lines; 300-325, 700-860, 2261-2316, 2450-2483)
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/lane-tracking.mjs` (150-200, 253-264, 559-572; `FRONT_FROM` at 35)
- `/Users/alfonso/jjodel-w-reqport/frontend/scripts/hooks/__tests__/laneRun.test.ts` (helpers at 19, 72, 94, 137, 1076, 1127, 1151)
- `/Users/alfonso/jjodel-w-reqport/frontend/vitest.config.ts` (line 16, the `include`)
- `/Users/alfonso/jjodel-w-reqport/docs/goals/README.md`, `softgoals.json`, `contributions.json`, `conflicts.json` (heads)
- `/Users/alfonso/jjodel-w-reqport/docs/decisions.md` (RC-22, RC-26; row-head counts), `docs/PROTOCOL.md` (grep), `docs/HARNESS-DOCS.md` (grep), `docs/claude-code-log.md` (1-140)
- `~/Library/LaunchAgents/io.jjodel.lane-board.plist` (`ProgramArguments` only, via `plutil -extract`, read-only)

Branch `harness-req-tab` (`git show 35240a582:<path>`, `git diff 57ff86f5d harness-req-tab`):
- `frontend/scripts/lane-board.mjs` (908 lines; full diff from its verbatim port `3da719a46`)
- `frontend/scripts/board/{timeline.js,insights.js,requirements.js,.gitignore}` (diffed against the trunk's first copy `b5fc46477`)
- `frontend/scripts/req-trace.mjs` (618 lines; 1-80, 487-618, outline)
- `frontend/scripts/lane-run.mjs` (full diff, +53/-4)
- `frontend/scripts/hooks/__tests__/{laneBoard.test.ts,laneBoardStrip.test.ts,reqTrace.test.ts}` (outline, harness parts read whole), `laneRun.test.ts` (the +70 hunk)
- `docs/prompts/claude_2026-10-05_1720_prompt_harness_board_requirements_tab.md` (whole), `..._1705_prompt_harness_board_progress.md` (head), `docs/log-inbox/harness.md` (entry heads)
- Commit messages of all 10 branch commits; of the trunk board commits `b5fc46477`..`960294cd4`; of the pending
  branches `lane-board-columns` (`034811a1f`), `timeline-newest-first` (`0ce6f57bb`) and `board-kindof-merges` (`a77675e5e`).

Lane folders, read-only: `~/.jjodel-lanes/P-2026-10-05-1705/log.jsonl` (last assistant text),
`~/.jjodel-lanes/P-2026-10-10-1809/` (listing, log head), counts of `exit.txt`, `resolved.txt`, `direct.json`.

## 3. Inventory: branch features vs the trunk board

Trunk paths are relative to `frontend/scripts/`. "Branch" lines are lines of the file at `35240a582`.

| # | Feature (branch location) | What it does | Trunk has it? | Collides with on the trunk side |
|---|---------------------------|--------------|---------------|-------------------------------|
| F1 | **Status strip + filter view** (`lane-board.mjs:715-737` `STRIP`, `stripKey`, `stripCounts`; PAGE `:764` nav, `:782` `renderStrip`, `:786` `renderLanes`) | Six pills at the end of the tab bar (running, question, hard-stop, blocked, resolved, done 24 h), in outcome colours, zero counts dimmed; a click filters the Lanes tab to that state. The page embeds `stripKey.toString()` so the tests count with the page's own code. | **No.** Trunk nav `lane-board/lane-board.mjs:847` has three buttons and no strip. | `lane-board-columns`: `table()` and the CSS block (`:839-842`). The filtered view calls `table()`, so it inherits `table.lfx`. Trunk `.hard-stop` is now `var(--hs)` (`:840`, from `0b8128f32`), so the hard-stop pill is soft green, not amber as on the branch. |
| F2 | **Requirements tab** (`board/requirements.js`, 155 lines; `lane-board.mjs:684-708` `requirements()`; routes `:882`, `:886`) | Spawns `req-trace.mjs` asynchronously, at most one run at a time, keeps the JSON 60 s, kills at 120 s. The tab groups rows by cluster, then milestone, with family, status, realized and softgoal filters and an opposing-contributions table. | **No.** `git grep req-trace HEAD` hits only this lane's prompt file (the positive control of that search). | Only the nav line and `showTab` (`:914`), the refresh loop (`:918`) and the server routes. Paths change on the trunk: `REQ_TRACE` becomes `join(HERE,'..','req-trace.mjs')` and `REQ_REPO` becomes `join(HERE,'..','..','..')`. |
| F3 | **Progress milestones** (`lane-board.mjs:112` `LADDERS` to `:404`; `:333` `milestones`, `:344` `progressOf`, `:351` `compactEvent`, `:375` `laneEvents`; `:445` in `collect()`; PAGE `:807` `prog()`, `:815` cols) | Reads the tool calls of a running lane's `log.jsonl` incrementally and reports a ladder per kind (phase2/fast 8 steps, discovery 6, merge 5) with reached, skipped and pending steps. Adds a Progress column. | **No.** The trunk has `phaseOf` and `estimate` only (`lane-board/lane-board.mjs:87`, `:93`). | `lane-board-columns`: `COL_W` plus the 1100 px fixed sum leaves no room for a column (§8 R1). `board-kindof-merges`: `kindOf` picks the ladder; its fix makes two-merge lanes use the merge ladder. |
| F4 | **Estimate blended with progress** (`lane-board.mjs:86`) | `left = (phase rule + median × (1 − position/total)) / 2`, "under 5 min" at the last step. Without progress the old rule is unchanged, word for word. | **No.** Trunk `estimate(kind, minutes, phase, load)` at `:93` is the branch's base, unchanged since `57ff86f5d`. | None. `MEDIAN` is the same on both (`:35`). |
| F5 | **`resolved` overlay in the board** (`lane-board.mjs:440`: `if (outcome === 'blocked' && existsSync(join(dir, 'resolved.txt'))) row.outcome = 'resolved';`; CSS `:754` `.done,.resolved{color:var(--ok)}`) | The board itself turns blocked plus `resolved.txt` into `resolved`, whichever lane-run printed the table. | **No.** No `resolved` in the trunk `lane-board.mjs`; the same search finds `laneTimeline` 4 times. | `collect()` was reshaped on the trunk (`t`, `launcher`, `laneSpan`); the line inserts after `row.tier` (`:140`). Exports: `str('outcome', l.outcome)` would carry `resolved` into XES and trace. |
| F6 | **`resolved` in Timeline and Insights** (`board/timeline.js:26-28, 68, 167, 218, 221, 302`; `board/insights.js:21-22`) | Paints the last turn of a resolved lane in the ok colour, adds legend entries, and annotates turn titles and the detail table. | **No.** No `resolved` in either trunk file; the same search finds `const OUT`/`const OUTS` at `timeline.js:36`, `insights.js:24`. | `timeline-newest-first` touches `render()` `:100-150`; the resolved hunks are at `:36-39, 81, 183, 235-238, 319` (disjoint). Since `0b8128f32` the trunk legends carry `OTIP(...)` tooltips from `window.LANE_OUTCOME_TIPS` (`timeline.js:27`), so `resolved` needs a tip there. `/api/insights` `final` (`lane-board.mjs:668`) reads the outcome from the log, not from `collect()`, so it stays `blocked`. |
| F7 | **Board does not listen on import** (`lane-board.mjs:860` `MAIN`, `:908`) | Lets tests import the module. | **No.** Trunk `:921-962` listens at module load. | None. The branch compares `realpathSync(argv[1])` to an unresolved URL path; `req-trace.mjs:609` resolves both sides, which is safer. |
| F8 | Board assets in `board/`, cache in `board/timeline-cache.json`, `board/.gitignore` (`lane-board.mjs:25, 466`) | The branch's layout. | **Superseded.** The trunk serves from `HERE` (`:926`, `:939`) and keeps the cache with the lanes: `LANE_BOARD_CACHE \|\| join(ROOT,'board','timeline-cache.json')` (`:179`). | Dies with the branch. |
| F9 | `LANE_RUN` = the sibling lane-run (`lane-board.mjs:35`) | The board and lane-run travel together. | **Yes**, `lane-board/lane-board.mjs:30`: `join(HERE, '..', 'lane-run.mjs')` when present. | None. |
| F10 | Lanes table columns `Elapsed`(minutes), `Chat` | The branch's table. | **Superseded.** Trunk `:875` has Started, Elapsed (working time), Span, Launched by. | Dies. |
| F11 | **`lane-run resolve` + `resolved` in `status`** (`lane-run.mjs:290, 681, 698, 773, 786`, `:2286`) | See §4. | **No.** The 3 trunk hits for `resolved` are "the resolved merge" (`lane-run.mjs:132, 1591, 1635`); `status` is found 59 times in the same file. | RC-44 card projection reads `laneState().outcome` (`lane-run.mjs:2278`), see §4 and §8 R4. |
| F12 | **`req-trace.mjs`** | See §6. | **No** (F2's search). | None: a new file. |

### 3.1 How H2 was measured

`diff <(git show harness-req-tab:frontend/scripts/board/timeline.js) <(git show b5fc46477:frontend/scripts/lane-board/timeline.js)`
gives 26+/13-. The branch-only lines are exactly the `resolved` hunks of F6. The trunk-only lines are `LNAME`/`LCOL` and
the launcher grouping and legend, the `Depends:` links and `parallel lanes in one row`. The same diff for
`insights.js` gives the `OUTS` resolved entry on the branch and `byLauncher()` on the trunk. Both board copies come
from `~/.jjodel-lanes/board/`, the branch's at 17:09 and 17:52, the trunk's at 23:40 (`b5fc46477` message: "copied
byte for byte"), so the live board moved in between **[read]**.

## 4. The `lane-run.mjs` hunks

The diff is `57ff86f5d..harness-req-tab`, +53/-4. The trunk `lane-run.mjs` changed by +232/-9 over the same span
(RC-43 request, RC-44 tracking, chain request).

| Hunk | Branch | What it does | Trunk today | Still wanted |
|------|--------|--------------|-------------|--------------|
| h1 doc comment | `:67-80` | Documents `outcome: resolved` with `recorded:`/`resolved:` lines in `status <id>`, the `resolved` word in `status --all`, and the `resolve` subcommand. | Absent. Trunk usage comment at `:73-77`. | Yes, with S1. |
| h2 `laneFiles()` | `:290` `resolved: join(dir, 'resolved.txt'),` | Path of the file. | Trunk added `request: join(dir, 'request.md'),` at `:319` on the same spot. **The one textual conflict** of a trial `git merge-tree 57ff86f5d alfonso-frontend-jjtl harness-req-tab`. Keep both lines. | Yes. |
| h3 `laneState()` | `:678-682` | Returns `resolved` (the line of `resolved.txt`, or null) only when the parsed outcome is `blocked`; `outcome` stays the raw line. | Trunk `:728-738`, unchanged since the base. | Yes. Raw `outcome` unchanged means `observeLane` (`:2278`) and the RC-44 projection keep reading `blocked` (§8 R4). |
| h4 `status <id>` | `:697-703` | Prints `outcome: resolved`, `recorded: <line>`, `resolved: <line>`. | Trunk `:740-768` now also calls `trackCard(id, { limit })` and the P16 brief and flip warnings. The hunk touches only the `outcome:` line. | Yes. The flip warning fires on done/hard-stop only, so it stays silent for a resolved lane. |
| h5 `statusAll()` | `:773` | `'resolved'` in the outcome column. | Trunk `:812-831`, same row code as the base. | Yes. The only programmatic consumer of that column is the board's `collect()`. The other hits for `status --all` (`lane-tracking.mjs:250`, `laneRunDirect.test.ts:821`, `.claude/commands/lane.md:10`, `HARNESS-DOCS.md:485`, `PROTOCOL.md:421`) are prose or a chain-row test. |
| h6 `resolve_()` | `:783-804` | Writes one line, `date HH:MM · who · why`, once, only on an exited `blocked` lane. Refuses otherwise. Honours `LANE_RUN_NOW`. | Absent. `clock`, `stamp`, `pad2`, `option`, `refuse` exist on the trunk (used by the same code paths). | Yes. Open: should `resolve` call `trackCard` (§8 R4). |
| h7 `main()` dispatch + usage | `:2286`, `:2294` | `resolve` command; usage string. | Trunk `:2456-2475` gained `track`. The usage edit is on a different line from the trunk's, so the trial merge is clean here. | Yes. |

The `laneRun.test.ts` hunk (+70, four tests, inserted between the `status --all` describe and `const ID2`) merges
cleanly in the same trial. It uses `lab`, `fakeLane(l, id, { texts, running })`, `laneDir`, `laneRun`, `ID`, `ID2`,
and all of them exist on the trunk with those signatures (`laneRun.test.ts:72, 1076, 137, 94, 19, 1151`) **[measured]**.

## 5. Tests and fixtures

| File (branch) | Lines | Describes behaviour the trunk should have? | Tied to the parallel board? | How it runs against `frontend/scripts/lane-board/` |
|---------------|-------|---------------------------------------------|-----------------------------|----------------------------------------------------|
| `hooks/__tests__/laneBoard.test.ts` | 622 | Yes: the ladders, `progressOf`, `compactEvent`/`laneEvents`, the blended estimate, no listen on import, `/api` progress. 61 tests per `888076986`. | Only through `SCRIPT = resolve(HERE,'..','..','lane-board.mjs')` (`:20`). | `SCRIPT` → `resolve(HERE,'..','..','lane-board','lane-board.mjs')`. The trunk board must export `milestones`, `progressOf`, `compactEvent`, `laneEvents`, `estimate` and listen only when run (F7). In `board()` (`:552-577`), set `JJODEL_REPO` to a temp repo, else `launcherOf` runs `git log --all` on `~/jjodel` (20 s timeout, read-only). The key-set assertion (`:616`) must add `t`, `launcher`, `start`, `end`, `work`. `"'Left','Progress','Phase'"` (`:619`) depends on R1's layout choice. |
| `hooks/__tests__/fixtures/lane-board/*.jsonl` (5) | 210 | Yes: synthetic ladders and one trimmed real log (P-2026-10-05-1110). | No. | Verbatim. |
| `hooks/__tests__/laneBoardStrip.test.ts` | 160 | Yes: four counting tests, resolved via `/api`, the strip in the nav, the Requirements route. | One test is: "board/ assets served from board/" (`:145-151`). | `SCRIPT` path as above. The nav regex (`:140`) hardwires `Requirements</button><div class="strip"`; write it as "the strip follows the last tab button" so S4 and S5 can land in either order. **Drop** the board/ test; S5 adds "/requirements.js served beside the board". Split the Requirements-route test (`:153-159`) into S5's own file to keep the file sets disjoint. |
| `hooks/__tests__/reqTrace.test.ts` | 310 | Yes: parser, realized on a fixture history, Louvain, the goal-model join, pipe drain above 64 KB. | No. | Verbatim: `req-trace.mjs` stays at `frontend/scripts/req-trace.mjs` (`:17`). |
| `hooks/__tests__/laneRun.test.ts` (+70) | 70 | Yes. | No. | Merges cleanly (§4). |

Mutation benches recorded on the branch, to re-run on the trunk copies **[read]**: lane-run 7/8 killed (1 equivalent);
req-trace 23/23; milestones 43/45 (2 equivalent: `Math.max` on a fraction ≤ 1, cache eviction); strip/board 10/10
(one of them, "board/ assets not found", dies with F8). All the files fall under the vitest `include`
`scripts/hooks/__tests__/**/*.test.ts` (`frontend/vitest.config.ts:16`).

## 6. `req-trace.mjs`

- **Inputs** **[read]** `req-trace.mjs:533-568`: `<repo>/docs/decisions.md` (required, exit 2 without it),
  `<repo>/docs/prompts/*.md`, and `<repo>/docs/goals/{cluster-names,milestones,softgoals,contributions,conflicts}.json`
  when present, all read from the **working tree** of `--repo`. Also `git rev-parse <trunk>`, `rev-list --first-parent`
  and `log --first-parent --merges` on the trunk ref. Flags: `--repo`, `--trunk` (default `alfonso-frontend-jjtl`),
  `--with-rc`, `--cache-dir | --no-cache`, `--seed`, `--pretty`.
- **Outputs**: one JSON document on stdout (`generated, repo, head, trunk, counts, clusters, milestones, goalModel,
  rows`). The git index is cached in `<tmpdir>/jjodel-req-trace/<trunk sha>.json`, outside the tree. Pure `node:*`.
- **Callers**: only the branch board (`lane-board.mjs:684-708`) and `reqTrace.test.ts`. On the trunk it has none.
- **Depends on the parallel board?** No. It imports nothing from it, and the board only spawns it.
- **Probe** **[measured]** on the trunk ref `834152b68`, working files of this tree. A temp copy, run as
  `node /tmp/rt_1806.mjs --repo ~/jjodel-w-reqport --trunk alfonso-frontend-jjtl --no-cache`, exits 0 in 10.49 s real
  with 487 120 bytes of output. Counts: rows 501, realized 294, ratified 422, provisional 73, superseded 6; clusters
  17, modularity 0.726, unclustered 14.4 %; prompts 840 total, 199 used, 212 excluded; 4815 edges. Goal model present:
  7 softgoals, 11 conflicts, **612 opposing pairs**, 302 rows with contributions. Milestones: the built-in one only;
  285 rows on MODELS, **9 realized rows after it** (R-SIM-144, R-SIM-146, R-GEN-4..7, R-GEN-10..12, all first committed
  2026-10-10). Control for the row count: 506 row-head lines matching `^(- )?\*\*R-` in `docs/decisions.md`, 501 unique
  ids. For comparison, 1720 measured on `57ff86f5d`: 476 rows, 277 realized, 15 clusters, Q 0.717, 16 % unclustered.
- **What the Requirements tab needs from the server side**: one route, `/api/requirements`, that spawns the script
  with `--repo` (the board's own checkout: `~/jjodel-release`, the trunk's working tree per the plist) and `--trunk`.
  Env overrides are `REQ_TRACE_REPO` and `REQ_TRACE_TRUNK`. Results are kept 60 s and runs are single-flight, as on
  the branch. Also the static asset `/requirements.js`, the tab button, a `showTab` entry and a refresh hook. The page
  CSS variables it uses (`--muted --card --line --fg --ok --warn --bad --bg`) all exist in the trunk `:root`
  (`lane-board.mjs:827`).

## 7. Port plan

**Wave 0 — merge the verified pending board branches first** (their prompts already exist):
`lane-board-columns` (P-2026-10-10-1742), `timeline-newest-first` (P-2026-10-10-1744), `board-kindof-merges`
(P-2026-10-10-1803). Trial merges **[measured]**: columns × kindof conflicts only in `docs/log-inbox/harness.md`
(union), and `lane-board.mjs` merges clean; columns × newest-first likewise, only the inbox. kindof × newest-first
touch disjoint code files (not trial-merged). Cutting the port slices after these three removes every textual
collision named in §3.

**Wave 1 — three parallel lanes** (RC-22: DOVE lists disjoint, no shared exported interface, own worktree each).

| Slice | Files (DOVE) | Tests | Size | Notes |
|-------|-------------|-------|------|-------|
| **S1** lane-run `resolved` + `resolve` | `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`; docs commit: `docs/HARNESS-DOCS.md` (the `resolve` command, beside `track` at `:482`) | the four branch tests; bench of 8 | S: ~50 code, 70 test | Port the hunks of §4; h2 keeps `request:` and `resolved:`. R4 decides whether `resolve` re-projects the card. |
| **S2** board core | `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoard.test.ts`, the 5 fixtures `.../fixtures/lane-board/*.jsonl` | `laneBoard.test.ts` ported (§5); bench of 45 | L: ~330 code, ~830 test and fixtures; 8 files, so above rule 19's five, listed in the prompt | F7 (listen only when run, realpath on both sides) + exports, F3, F4, F5 overlay in `collect()`, `.resolved` and `.segs .seg` CSS (keep 1720's scoping: the trunk's segmented controls also use `.seg`, `:843`). Progress: `null` for a folder holding `direct.json` (§8 R3). Rendering per R1. RC-23 visual check of the Running table. |
| **S3** req-trace | `frontend/scripts/req-trace.mjs`, `frontend/scripts/hooks/__tests__/reqTrace.test.ts` | verbatim; bench of 23 | M: 618 + 310 lines, both verbatim | Probe target: the §6 counts on the trunk of the day. |

**Wave 2 — after S2 merges** (same file):

| Slice | Files | Tests | Size | Notes |
|-------|-------|-------|------|-------|
| **S4** strip + resolved colours | `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/timeline.js`, `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts` | counting ×4, resolved via `/api`, strip in the nav (order-independent regex); bench of 8 | M: ~75 code, ~120 test | F1 and F6. A `resolved` entry in `window.LANE_OUTCOME_TIPS` (`timeline.js:27`). One visual check covers the pills and the colours. Can run beside S3 or S1 if those are still open: disjoint files. |

**Wave 3 — after S3 and S4 merge**:

| Slice | Files | Tests | Size | Notes |
|-------|-------|-------|------|-------|
| **S5** Requirements tab | `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/requirements.js` (new, from `board/requirements.js`), `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoardRequirements.test.ts` (new) | the route on a fixture repo, the asset served beside the board; bench: the branch's route mutation plus the new asset test | M: ~50 code + 155 asset, ~60 test | F2 with the trunk paths of §3 F2. README gains the tab and `REQ_TRACE_REPO`/`REQ_TRACE_TRUNK`. RC-23 crop at 1400 px. R5 and R6 decide milestones and the opposing table. |

Each server-side slice reaches the live board only after a restart of `io.jjodel.lane-board`. The agent runs
`/Users/alfonso/jjodel-release/frontend/scripts/lane-board/lane-board.mjs` **[measured, plist]**, and that tree is the
trunk's working tree. See R2.

**Retirement.** Tag `archive/harness-req-tab-2026-10-10` on `35240a582`, following the existing
`archive/<branch>-<date>` tags (`archive/icons-font-2026-09-26` and two more). The tip contains
`harness-board-progress` `888076986` (`git merge-base --is-ancestor` true), so one tag preserves both. The board's
launcher classification reads `git log --all`, tags included, so the 1705 and 1720 prompts stay visible once the
branches go. Deleting `harness-req-tab` and `harness-board-progress` and removing `~/jjodel-w-reqtab` and
`~/jjodel-w-boardprog` wait for Alfonso (RC-26). This lane created no tag.

## 8. Risks

- **R1 Progress vs fixed columns.** With `lane-board-columns`, the Running table's widths sum to 1100 px. The page is
  `main{max-width:1280px;padding:16px}` (`:830`), so the table is about 1246 px and Phase gets about 146 px. A
  Progress column at about 120-140 px (8 segments of 10 px with a 2 px gap, the `n/m`, 16 px padding) leaves Phase
  0-26 px. Arithmetic, not a render. Recommendation for S2: draw the segments and the current step inside the Phase
  cell, with the phase text below, truncated, title on hover.
- **R2 Hot assets, cold server.** `timeline.js`, `insights.js` and `requirements.js` are read on each request, while
  `lane-board.mjs` runs until the agent restarts. After an S2, S4 or S5 merge, the page can briefly mix new assets
  with the old server. Harmless for these slices: new fields are read defensively, and an unknown route returns the
  page. The restart (`launchctl kickstart -k`, README `:121`) is outside every lane's perimeter.
- **R3 Direct merges have no ladder input.** 115 of the 405 `P-…` folders hold `direct.json`. Their `log.jsonl` is
  the worker's: 0 `"tool_use"` lines in `P-2026-10-10-1809` **[measured]**. Read with the merge ladder, they would
  show 0/5 for their whole run.
- **R4 RC-44 cards ignore `resolved`.** `projectLane` maps `blocked` to `In progress` + label `blocked`
  (`lane-tracking.mjs:184-188`) from the raw outcome that `observeLane` passes (`lane-run.mjs:2278`). With S1 as
  written on the branch, a resolved lane's card stays blocked. Recommendation for S1: project `resolved` like `done`
  (flipped → Done, else In review + `closure-owed`), and have `resolve` call `trackCard`. Adds
  `frontend/scripts/lane-tracking.mjs` and its test to S1.
- **R5 Milestones are stale.** The only milestone is built in (MODELS freeze 2026-10-07) and has passed, so every
  newly realized row lands in "Realized after the last milestone" (9 today). `docs/goals/milestones.json` does not
  exist on the trunk.
- **R6 The opposing table is long.** 612 opposing pairs on today's data, rendered as one table under the clusters
  (`requirements.js:132-135`). Lane 1720 never rendered the goal model on real data: its commit (17:52) predates the
  goal files (`097f3f187`, 17:58).
- **R7 `lane-run status <id>` is not purely a read once tracking is live.** It calls `trackCard` (`:756`). The two
  reads in this lane skipped the projection because both ids precede `FRONT_FROM = 'P-2026-10-11-0000'`
  (`lane-tracking.mjs:35`); `~/.jjodel-lanes/_tracking/` mtimes are unchanged (16:01-16:10). From 2026-10-11 on, a
  discovery that runs `status <id>` can sync a card. `status --all` does not call `trackCard`.
- **R8 Insights first-shot.** `/api/insights` takes `final` from the log (`lane-board.mjs:668`), so a resolved lane
  stays a failed run there, while Lanes and Timeline paint it ok. This is intended (§9 D5), and it must be said in
  the README so the two do not read as a bug.

## 9. Decisions taken (unattended)

- D1. The trunk version wins wherever both sides have one (cache location, `LANE_RUN` default, Launched by over Chat,
  `kindOf`, Started/Ended/Span). The branch's copies of those die.
- D2. The port is fresh slices on the trunk, not a merge or cherry-pick of `harness-req-tab`. A merge would succeed on
  the board and leave two boards (§0.4).
- D3. The board reads `resolved.txt` itself (F5), as the branch did, so S2 and S4 do not wait for S1.
- D4. A folder with `direct.json` gets `progress: null` (R3). Written into the S2 plan, not measured on a render.
- D5. `/api/insights` keeps the raw outcome: first-shot measures the lane, not the repair made after it (R8).
- D6. `req-trace` keeps reading the working tree of the board's own checkout (the release tree on the trunk), as on
  the branch. It does not switch to reading the trunk ref the way Insights does: smaller port, same result while the
  release tree is clean.
- D7. Reads only. Two `lane-run status <id>` calls (tracking skipped by `FRONT_FROM`, R7), one `status --all`, and
  `req-trace` from a `/tmp` copy with `--no-cache`. Trial merges used the three-argument `git merge-tree`, which writes
  no objects. No branch was checked out; port 4700, the agent and `~/.jjodel-lanes/board/` were not touched.

## 10. Decisions awaiting Alfonso

1. Delete `harness-req-tab` and `harness-board-progress` and remove `~/jjodel-w-reqtab` and `~/jjodel-w-boardprog` (RC-26, deletion). Recommended: tag `archive/harness-req-tab-2026-10-10` on `35240a582` now, delete after S5 merges.
2. `resolve` on the 15 lanes that exited `blocked` today, from `P-2026-09-27-0140` to `P-2026-10-10-1754` (no `resolved.txt` exists: `find` 0, control 401 `exit.txt`). P-2026-10-05-1720 parked this for Alfonso. It writes lane data rather than deleting it, so it is listed because that prompt parked it, not as an RC-26 item. Recommended: decide per lane after S1 merges.
