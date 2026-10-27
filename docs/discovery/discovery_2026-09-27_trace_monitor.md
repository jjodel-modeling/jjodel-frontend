# Discovery: trace monitor, the lane monitor growing into requirements and traceability, Phase 1

**Prompt-ID**: P-2026-09-27-1030. **Prompt**: `docs/prompts/claude_2026-09-27_1030_prompt_trace_monitor_discovery.md`.
**Chat**: C-2026-09-27-1030. **Session**: `92e69d1c-b149-4753-9729-bdc2877386fd` (launched by `lane-run`, `-p`,
bypass). **Tree**: `~/jjodel-trace`, branch `harness-trace`, HEAD `6c69783cf` (equal to the trunk
`alfonso-frontend-jjtl` at start). **Executor**: Opus 5.5 (`claude-opus-5-5`), as the session banner shows.
**Claude Code**: 2.1.283.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the
real files. Tags: **[M]** measured in this phase (on `6c69783cf` for the repo, on `~/.jjodel-lanes/` between
10:29 and 10:45 CEST for the lanes), **[R]** read from a file.

Terminology. The prompt's D6 names three «phases»; to keep them apart from the P4 phases of this lane, this
report calls them **stage 1** (indexer plus monitor, the Phase 2 of this lane), **stage 2** (requirement files
and the `Requirement:` header), **stage 3** (coverage views and export).

## 0. Preconditions

`pwd` `/Users/alfonso/jjodel-trace`, branch `harness-trace`, `git log -1` `6c69783cf docs: add prompt
P-2026-09-27-1030, trace monitor discovery`, `git status --porcelain` empty, `git rev-parse
alfonso-frontend-jjtl` `6c69783cf` [M]. Read: `CLAUDE.md`, `docs/PROTOCOL.md` P4, P6, P13, P16,
`docs/HARNESS-DOCS.md` §4.1, §4.2, §7, `docs/decisions.md` RC-17..RC-30, the head of
`docs/claude-code-log.md`, the sibling prompt `claude_2026-09-27_1035_prompt_lane_run_v2.md` [R].

## 1. Objective and hypotheses

Objective: make stage 1 (indexer plus monitor) writable without guesses: where every trace link is declared
today, how many items parse, what the platform does, which names and port are free.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `lane-run` already keeps a live stream of tool calls on disk | **holds** (§2.3): `log.jsonl` is the stream-json, appended during the run |
| H2 | the lane folders the prompt names (1640, 1705, 0035) exist in `~/.jjodel-lanes/` | **partly**: 0035 exists; 1640 and 1705 do not (§2.2) |
| H3 | the digest lane has a parser for `docs/decisions.md` the indexer can import | **holds** (§3): `docs-digest.ts`, 41 tests green, importable from plain node |
| H4 | prompt headers carry `Prompt-ID`, `Chat`, `Lane`, `Status` in a parseable form | **partly** (§4.1): 79 strict, 84 with a tolerant pattern; `Lane` is the weakest |
| H5 | commits carry `Prompt-ID`, `Claude-Session`, `Model:` trailers | **partly**: no `Prompt-ID` trailer exists; `Model:` is a git trailer in 195 of 401 commits (§4.4) |
| H6 | the 2026-09-15 Harness metamodel design is in `docs/archivio/` | **falsified** (§5) |
| H7 | `REQ-`, `docs/requirements`, `Requirement:`, `lane-run monitor` are free names | **holds** (§6) |
| H8 | `fs.watch` recursive is enough to follow the lanes on this Mac | **falsified for log growth** (§7.2) |
| H9 | a port among 3004..3010 is free and unclaimed | **holds**: 3008 (§6.3) |

## 2. lane-run (question 1)

### 2.1 Where it lives, subcommands, how it launches `claude` [R]

`frontend/scripts/lane-run.mjs`, 314 lines, two commits (`e00392612` P-2026-09-26-1640, `cef93648f` RC-30).
Subcommands, `frontend/scripts/lane-run.mjs:8-25`: `start <worktree> <prompt-file>`, `resume <Prompt-ID>
<message-file>`, `status <Prompt-ID> [--limit <minutes>]`; dispatch at `:300-305`.

- Flags, `:53`: `const FLAGS = ['--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions'];`
  and `:27-30`: «Every run passes `--output-format stream-json --verbose` (stream-json under -p requires --verbose)
  and `--permission-mode bypassPermissions` (RC-19 …). No --model».
- Where stdout goes, `:57-60`: `nohup "$@" < "$input" >> "$log" 2>> "$err"` then `echo $? > "$code.tmp" && mv
  "$code.tmp" "$code"`. The wrapper is `/bin/sh`, spawned `detached: true, stdio: 'ignore'` (`:142-147`).
- Measured on this very lane [M]: `ps` shows pid 46552 `/bin/sh -c input="$1"; log="$2"; …` and its child 46553
  `/Users/alfonso/.local/bin/claude -p --output-format stream-json --verbose --permission-mode bypassPermissions`.
- `start` resolves the prompt from the worktree (`:192` `const promptFile = resolve(worktree, promptArg);`) and
  reads the id only from `^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$` (`:51`) before the first `## ` (`:91-98`).
- `status` parses `Outcome` with `:52` `/^Outcome: (done|hard-stop|question|blocked)\s*$/`, over the whole log
  each call (`:257-269`).

### 2.2 The real content of `~/.jjodel-lanes/` [M]

24 lane folders (`P-2026-09-26-2340` to `P-2026-09-27-1035`), plus `_msgs/`, `_probe/` and 24 loose files at
the root. **`P-2026-09-26-1640` and `P-2026-09-26-1705` do not exist** (`ls -la ~/.jjodel-lanes/`,
oldest `P-2026-09-26-2340`); the three lanes examined in detail are 2340, 0035, 0120, plus 0325 and this lane.

| File | Format | Written by, when | Source |
|---|---|---|---|
| `log.jsonl` | stream-json, one event per line | claude stdout via the wrapper, appended during every run (start and each resume) | `:59` |
| `stderr.log` | text | claude stderr, appended; 0 bytes in every folder listed | `:59` |
| `session.txt` | uuid | `start`, once, from the first event with `session_id` | `:213-216` |
| `worktree.txt` | absolute path | `start` | `:202` |
| `pid.txt` | pid of the `/bin/sh` wrapper | every launch, **overwritten** | `:149` |
| `started.txt` | epoch ms | every launch, **overwritten**: elapsed is per run, not per lane | `:150` |
| `exit.txt` | exit code | the wrapper at the end of each run, atomic `mv`; deleted at the next launch | `:60`, `:138` |
| `goahead.txt` | Prompt-ID | `start --critical-zone-goahead` | `:207` |
| `go.md` (0051, 0214) | markdown | the chat, not lane-run | — |
| `resume_go.out` (0200, 0225, 0300, 0325, 0345) | lane-run stdout | the chat's `resume_go_<HHmm>.sh` at the root | root scripts |
| `chat_probe*.log`, `chat_vite*.log` (0120, 0200, 0225, 0325) | `PASS`/`FAIL`/`MEAS` lines, `EXIT=<n>` | the chat's independent probe re-runs | — |
| `shots/` (0120) | png | the session's own probe: its log quotes ``const SHOTS = `${homedir()}/.jjodel-lanes/P-2026-09-27-0120/shots`;`` | log.jsonl |
| `aside1/`, `aside2/`, `gitprobe/` (0214) | probe debris | not lane-run; the session's log names `/tmp/p0214-gitprobe.XXXX` 8 times | — |

Root: `start_<HHmm>.sh`/`.out`, `resume_go_<HHmm>.sh`, `probes_0325.sh` (the chat's launch helpers, e.g.
`start_1030.sh`: `cd ~/jjodel-release/frontend && node scripts/lane-run.mjs start ~/jjodel-trace docs/prompts/…`),
`_msgs/` (six message files of the night), `_probe/` (the RC-29 permission probe, `*.jsonl` and `settings.bak`).

`worktree.txt` of `P-2026-09-27-0030` names `/Users/alfonso/jjodel-docs`, which is **a separate repository**
(`git -C ~/jjodel-docs rev-parse --git-common-dir` prints `.git`, an Astro site), not a worktree of this repo.

### 2.3 Is a live stream of tool calls on disk? Yes [M]

- Growth while this session worked: `P-2026-09-27-1030/log.jsonl` 277628 bytes at 10:30, 357115 at 10:30:48,
  808952 at 10:36.
- Event census, five lanes (`type[:subtype]` counts): 0120 has `assistant` 259, `user` 131, `system:init` 4,
  `result:success` 4, `system:thinking_tokens` 827, `tool_progress` 37, `system:task_*` 57,
  `system:permission_denied` 1. Tool calls are `tool_use` blocks of `assistant` events (0120: Bash 110,
  Write 6, Edit 7, Read 5, ToolSearch 1, Skill 1); results are `user` events with `tool_use_result`
  (`stdout`, `stderr`, `interrupted`, …).
- **Only `assistant` and `user` events carry `timestamp`** (0120: 259/259 and 131/131; every other type 0/n).
  `system:init` carries `cwd`, `model` (`claude-opus-5-5`), `permissionMode`, `claude_code_version`, no time.
- `result` carries `duration_ms`, `num_turns`, `total_cost_usd` (cumulative over the session: 0120 reads
  7.28, 7.28, 8.72, 9.68), `stop_reason`, `permission_denials`. One `result` in 0120 has `origin:
  {"kind":"task-notification"}` and `duration_ms` 18: not a run end.
- **Gap: the input is not in the stream.** The prompt and every GO arrive on stdin and no `user` text event
  echoes them (0120: after each of the 4 `init`s, the only user text event is a synthetic skill expansion at
  line 1278). What was sent survives only where the chat kept it (`go.md` in 2 folders, `_msgs/`, gitignored
  `_tmp_go_*.md` in other trees).
- Transcript-derived commits are unreliable: the `[<branch> <sha>]` line of `git commit` appears in
  `tool_use_result.stdout` for 0035 (1), 0120 (2), 0325 (2), 0830 (2), and **0** for 0935, which committed
  `7455d0075` (its log prints `7455d0075 fix(sim): …` from a `git log` instead).
- Outcome forms across all 24 folders with a log: 19 strict, 2 with a suffix (0150 `Outcome: question — the
  commit was refused …`, 0405 `Outcome: done · fbd9064c9, d78f1981b`), 3 none (1015, 1030, 1035: running).

**Smallest change.** None is needed for the tool-call stream. The one gap is the input: `lane-run` copies the
input file into the lane folder before each launch (`input-<n>.md`). P-2026-09-27-1035 (running now on
`~/jjodel-release`) already does it for `resume --text` and `-` (`msg-<n>.md`, its COSA 2), not for the
message-file form; extending it to every launch is a few lines in `launch()` (`:137`).

## 3. The digest parser (question 2) [R] [M]

`frontend/scripts/gates/docs-digest.ts` (430 lines, `7b7ad1123`, P-2026-09-27-0830). Exports (`:39-80`,
`:181`, `:231`, `:239`, `:249`, `:257`, `:271`): types `Evidence`, `Verified`, `Reversible`, `Confidence`, `Row`,
`HeaderFailure`; class `HeaderParseError`; constants `MANUAL_MARKER`, `MANUAL_STUB`, `TITLE_MAX`; functions
`parseRows`, `nearMisses`, `confidence`, `datesOf`, `manualSection`, `render`. The CLI runs only as a script
(`:428-430` «Run only as a script: the tests import the functions above.»).

- `Row` (`:44-61`) has `id`, `line`, `date`, `provisional`, `unattended`, `evidence`, `verified`, `reversible`,
  `annotations`, `section`, `sectionLine`, `title`: no body text, but `line` and `sectionLine` are enough to
  reread the row and its section preamble. No interface change is needed.
- `parseRows` throws `HeaderParseError` listing every bad header (`:178` «Throws HeaderParseError listing every
  header it cannot read», thrown at `:226`); the indexer must catch it and report a miss, not fall over.
- Tests: `frontend/scripts/gates/__tests__/docsDigest.test.ts`, `npx vitest run` → **41 passed** [M].
- Imported from plain node, no flag [M]: `~/.local/bin/node --input-type=module -e 'await import(".../docs-digest.ts")'`
  printed the ten exports; `parseRows` on the register: **215 rows, 23 dates, 11 near misses** (lines 20, 278,
  283, 287, 290, 301, 303, 305, 313, 379, 392), no duplicate id, 92 rows dated from 2026-09-17.

A second parser to reuse: `frontend/scripts/gates/log-tools.ts` (pure, «No imports, no I/O», `:1-4`) exports
`splitLog` (`:66`), `entryType` (`:213`), `parseFields` (`:218`), `promptNameKeys` (`:234`), `entryStartLines`
(`:246`), `TIMESTAMP_PREFIX` (`:44`), `TICKET_HEADING` (`:50`); 43 tests in `log-tools.test.ts` (count of
`it(`/`test(` lines, not a run).

## 4. Trace sources inventory (question 3) [M]

### 4.1 Prompt headers, `docs/prompts/`

462 `.md` files; header = lines before the first `## `.

| Field (strict form) | Files | Tolerant form adds |
|---|---|---|
| `Prompt-ID: P-…` alone on the line | 79 | 5: `# Prompt-ID: P-2026-09-18-2219` and four `Prompt-ID: P-… (Phase 2 of …)` (`…_2026-09-21_1620_fase2_…`, `…_2026-09-25_0935_fase2_…`, `…_2026-09-25_1103_fase2_…`, `…_2026-09-25_1905_fase2_…`) |
| `Chat: C-…` | 73 | — |
| `Lane: fast\|full` | 53 (39 full, 14 fast) | 13 files carry `Lane: <stream name>` (`views`, `harness`, `jjscript`, …) |
| `Status: da eseguire\|eseguito` | 76 (70 eseguito, 6 da eseguire) | — |
| all four strict | 49 | |

- Tolerant `^#*\s*Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\b`: **84 files, 77 distinct ids**, 0 mismatches between
  the id and the file-name timestamp. First file with the field: `claude_2026-09-17_1425_…`. Note that
  `lane-run.mjs:51` would refuse the five tolerant forms at `start`.
- Shared ids (Phase 1 and Phase 2 files): P-2026-09-21-1620, P-2026-09-25-0935, P-2026-09-25-1103,
  P-2026-09-25-1445 (three files), P-2026-09-25-1905, P-2026-09-26-1315. A prompt node is keyed by id and holds
  a list of files.
- Missing `Chat` (11, all with a Prompt-ID): `…_2026-09-18_2219_…default_view_parity`, `…_2026-09-19_1610_…`,
  `…_1622_…`, `…_1730_…`, `…_1735_…`, `…_1740_…`, `…_1745_…`, `…_2026-09-21_1420_…`, `…_2026-09-21_1455_…`,
  `…_2026-09-22_2105_…`, `…_2026-09-23_1850_…`.
- Missing `Lane` (22): the 11 above except `…_2026-09-21_1455_…`, plus `…_2026-09-17_1425_…`,
  `…_2026-09-21_1620_fase2_…`, the 2026-09-24 files `…_1005_…`, `…_1455_…`, `…_1520_…`, `…_1605_…`, `…_1610_…`,
  `…_1630_…`, and the 2026-09-25 files `…_0016_…`, `…_0030_…`, `…_0910_…`, `…_0935_prompt_…`.
- Missing `Status` (8): 2219, 1610, 1622, 1730, 1735, 1740, 1745 (all 2026-09-18/19) and 2026-09-21 1420.
- No Prompt-ID at all, dated from 2026-09-17: `…_2026-09-17_1024_…` and `…_2026-09-17_1048_…` (before the rule),
  plus the five tolerant forms above.
- `Status: eseguito` carries a sha after `·` in 69 of 70 (the miss: `…_2026-09-22_2105_…`, `Status: eseguito
  (2026-09-23, lane default-view-parity, \`fb876efaa\`)`). All 69 shas exist and are on the trunk; 62 of them cite
  the prompt's own id. Of the 7 that do not, 4 are **merge commits that cite the merged lane's id**, not the
  merge prompt's (`94a72edba` cites P-2026-09-24-1005 for prompt P-2026-09-24-1605; `2dd17270b`, `2aecc1429`,
  `db3e68cde` likewise), 3 predate the subject suffix (`5c4db90b1`, `faa893a77`, `920b84895`). The Status sha is
  therefore the only link from a merge prompt to its commit.

### 4.2 Rows of `docs/decisions.md`

Through `parseRows` (§3): 215 rows with id and date; 11 near misses skipped by name. For the 92 rows dated from
2026-09-17, the row body cites a Prompt-ID in 5, a discovery report in 4, a memo in 10; the section preamble
(the lines between the `##`/`###` heading and the first row, e.g. `docs/decisions.md:142-143` «Source:
`docs/ratifiche/claude_ratifiche_2026-09-26_orchestrated_lanes.md`, ratified by Alfonso in chat on 2026-09-26»)
cites a P-/C-id in 74. **88 of 92** have a
source in one of the two; the 4 without: RC-14 (line 68), RC-17 (118), RC-18 (126), RC-30 (236).

### 4.3 Log entries, `docs/claude-code-log.md` and `docs/log-inbox/`

Through `log-tools.ts`: active log 40 entries (24 task, 16 ticket); inboxes `harness.md` 6 (5+1),
`simulation.md` 4 (4+0), `views.md` 4 (2+2), the other six 0. Total **54: 35 task, 19 ticket**.

- `Prompt document name`: 35 of 35 task entries, all with a well-formed `YYYY-MM-DD HH:mm` prefix, all resolving to
  a prompt file with that timestamp; the heading suffix `(P-…)` is present in 35 of 35 and agrees with the name
  in 35 of 35.
- `Corregge` filled (not `—`) in 8; 7 resolve to a prompt file; the miss: `docs/claude-code-log.md:163`
  `2026-09-26 11:00 (observation of chat C-2026-09-26-1100: …` (no prompt file at 11:00, a chat observation).
- Tickets: `Found in` present in 19 of 19.
- The archive (`docs/claude-code-log-archive.md`, 1223 entries): 47 task entries dated from 2026-09-17, 39 resolve;
  misses at lines 651, 662 (two `ticket` headings before the ticket type, no name), 879, 892, 1044, 1132, 1145,
  1158 (2026-09-18 entries whose names, e.g. `2026-09-18 18:20`, match no prompt file).

### 4.4 Git trailers on the trunk since 2026-09-17

`alfonso-frontend-jjtl`, `--since=2026-09-17` (committer date): 434 commits, 401 non-merge, 33 merges; 218 on
the first-parent line.

| Key, `git log --format='%(trailers:key=<K>,valueonly,separator=%x2C)'` | Commits |
|---|---|
| `Co-Authored-By` (positive control) | 349 |
| `Model` | 217 (195 non-merge) |
| `Claude-Session` | 103 |
| `Prompt-ID` | **0** |
| `Requirement` | 0 |
| `Xyzzy` (negative control, a key nobody writes) | 0 |

`git log --format=%B | grep -c '^Prompt-ID:'` gives 0 as well: the absence holds under two tools. The Prompt-ID of
a commit lives in the subject: suffix `(P-…)` in 218 non-merge commits, elsewhere in the subject in 68, only in
the body in 19, **nowhere in 96**. The 55 of those dated after the Model rule (2026-09-18 19:40), named in
§10, are mostly docs commits of the chat (ratifications, checkpoints, rotations); ten are not docs:
`cef93648f feat(harness): critical-zone go-ahead for launched lanes (RC-30)`, `4d96ba1fb`, `366300c03`,
`70ac9055f`, `f98e67cb5` (R-MCID-1 steps), `516afd310`, `6ee6efcd5`, `920b84895`, `faa893a77`, `97a41475e`.

Cross-check with the prompts: 79 distinct ids cited by non-merge commits, 75 with a prompt header; the 4 without:
P-2026-09-17-1024 (`7e38f7859`, file without the field), P-2026-09-19-1835 (`cb522e99f`), P-2026-09-25-0105
(`c5d1bcfcc`), P-2026-09-26-1340 (`9290c17be`, whose subject names 1335). Prompt ids never cited:
P-2026-09-17-1425, P-2026-09-18-1940.

**`Model:` is mostly not a git trailer.** Non-merge: 195 parsed by git, **114 written as a body line that git does
not parse**, 92 with none. The 114, all after the rule, share one shape: `Model: …`, a blank line,
`Co-Authored-By: …` (e.g. `2ce6e4dae`, `982581260`): git reads only the last paragraph as trailers. Of the 92
with none, 50 are after the rule. Both lists are in §10. Values are free text: 16 distinct forms, from `Anthropic Claude Opus 5.5` (56) and
`claude-opus-5-5` (46) to `claude-opus-5-5 (lane session cd30882e), committed by claude-fable-5-1 (project chat
C-2026-09-26-1702)`. `bash-guard.mjs:223` checks `/^Model: \S/m` anywhere in the message, so both shapes pass it.

**`Claude-Session` never carries a lane-run session.** Values on non-merge commits: 99
`https://claude.ai/code/session_…` URLs, 1 `C-2026-09-27-1030` (`6c69783cf`), 2 free-text pieces of one value
split by its comma (`c5d1bcfcc`: `claude.ai project chat, Jjodel Development`), 0 uuids.

## 5. The Harness metamodel (question 4)

**Absent from the repo.** Searched [M]:
- `ls docs/archivio` (34 entries: no metamodel file); `find docs -iname '*2026-09-15*'` (ten prompts and one
  discovery, none about the harness);
- `git grep -il -E 'trace package|package .?trace|harness metamodel|metamodel of the harness|metamodello
  dell.harness|harness meta-?model'` over the tracked tree: only this lane's prompt (positive control on the same
  tool: `git grep -l 'Prompt-ID' -- docs` → 134 files);
- `git log --all --name-only` for any path pairing harness with metamodel/ecore: only a CSV removed by
  `0793a8b6d`; `git log --all -i --grep` on the same phrases: nothing;
- the six other worktrees by file name (`find … -iname '*harness*meta*' -o -iname '*metamodel*harness*'`):
  nothing.

Consequence (RC-10): stage 3 «export towards the Harness metamodel's `trace` package» has no committed target.
The node and edge types of §8 stand on their own; their mapping to the metamodel is written when the document
is in the repo.

## 6. Name collisions and port (question 5) [M]

### 6.1 Searches, with the control that makes each silence a result

`git grep` with `-E '\b…'` is broken here: the control `git grep -c -E '\bRC-[0-9]' -- docs/decisions.md` prints
nothing while `git grep -c -E 'RC-[0-9]' -- docs/decisions.md` prints 68. Every search below is without `\b`.

| Command | Result |
|---|---|
| `git grep -I -n -E 'REQ-[0-9]'` | 0 lines |
| `git grep -I -n 'REQ-'` | 3 lines, all in this lane's prompt |
| `git grep -I -n 'docs/requirements'`, `'requirements/'` | 2 and 1 lines, this prompt only |
| `git grep -I -n 'Requirement:'` | 2 lines, this prompt only |
| the same four on all 20 local branch tips (`git grep … "${B[@]}"`, control `RC-[0-9]` in `docs/decisions.md` → 13 tips) | `REQ-` only in this prompt on `alfonso-frontend-jjtl` and `harness-trace`; `-i '^\**Requirement\**:'` 0 |
| `git ls-tree -d … docs/requirements` on every tip | nothing |
| `git grep -n -i 'monitor' "${B[@]}" -- frontend/scripts/lane-run.mjs` (control `resume` → 10 on the trunk) | nothing |
| `git grep -n -i -w monitor -- frontend/scripts .claude` | nothing |
| `grep -n -i monitor ~/jjodel-release/frontend/scripts/lane-run.mjs` (the tree where P-2026-09-27-1035 runs; `git status` clean, no diff yet) | nothing |

Outside the repo, the session's skill listing shows a user-level skill `lane` (`/lane status`, `tail`, `ports`,
`wait`): no name collision with `monitor`; `tail` overlaps in function.

### 6.2 The concurrent lane

P-2026-09-27-1035 (lane-run v2, `~/jjodel-release`, running) edits `frontend/scripts/lane-run.mjs` and
`frontend/scripts/hooks/__tests__/laneRun.test.ts`, adds `status --all`, `wait`, `probe` (writing
`probe-<basename>.log` with `EXIT=<code>` and `end=<time>` into the lane folder) and relaxes `OUTCOME` to
`/^Outcome:\s*(done|hard-stop|question|blocked)\b/` (its COSA 3 and 4). The monitor's `lane-run` dispatch
touches the same file: RC-22 check 1 (disjoint DOVE) fails, so stage 1 merges after 1035.

### 6.3 Port

`lsof -nP -iTCP -sTCP:LISTEN` (31 listeners, the control that lsof sees anything): 3000 (two node), 3001, 3003,
3007 (`node …/jjodel-sim/frontend/node_modules/.bin/vite --config scripts/smoke/_tmp_demo_vite.config.ts`).
Claims in text: `git grep -l -w <port>` over `docs/prompts`, `docs/discovery`, `frontend/scripts`, configs,
`.claude` (control 3003: 19 prompts): 3004 in 8 prompts, 3005 in 7, 3006 in 2, 3007 in 2 reports, 3010 in 1
prompt and 2 reports, **3008 and 3009 in none**. The gitignored `_tmp_*config*` of every worktree pin 3000, 3002,
3004, 3005, 3006, 3007 (`grep -h -o -E 'port:? *30[0-9]{2}'`), never 3008 or 3009. **Proposed: 3008.**

## 7. Platform (question 6) [M]

### 7.1 Node

`lane-run` runs under `~/.local/bin/node` (P16), a symlink to `~/.hermes/node/bin/node`, **v26.8.1**, also first
on this session's `PATH`. Other nodes on the machine: `/opt/homebrew/bin/node` v23.3.0, `node@22` v22.23.3,
`/usr/local/bin/node` v16.15.0. On v26, `process.features.typescript` is `'strip'`: `~/.local/bin/node
scripts/gates/docs-digest.ts --date 2026-09-27` runs with no flag and no warning; under v16 it fails at load.

### 7.2 `fs.watch` recursive on macOS

Supported (the watcher opens and fires), but **it does not report the appends of the lane logs** [M]:

| Probe (12.5 to 15 s) | Writes | Events |
|---|---|---|
| `fs.watch(~/.jjodel-lanes, {recursive:true})`, real lanes | 1030 +339 bytes, 1035 +7602 bytes | **0** |
| temp dir in `/tmp`, one process per append (`echo >>`) | 14 | 17 (14 `change` on the file) |
| temp dir in `$HOME`, one process per append | 10 | 10 |
| temp dir in `$HOME`, **one long-lived fd** (`exec >> file`, 10 writes) | 10 | 2 |
| temp dir in `/tmp`, one long-lived fd | 10 | 1 |
| `fs.watchFile(1035/log.jsonl, {interval: 500})` | live lane | 8 size changes seen |

The discriminating pair is the fd, not the location: lane-run's wrapper holds one fd for the whole run (`:59`),
and FSEvents reports it about once. Temp directories were removed (`removed true` in every run). Consequence:
`fs.watch` recursive for structure (a new lane folder, `exit.txt` arriving by `mv`), stat polling for log growth.

### 7.3 Finding all worktrees

`git worktree list --porcelain` from any tree of the repo prints 7 blocks `worktree <path>` / `HEAD <sha>` /
`branch refs/heads/<name>` (common dir `/Users/alfonso/jjodel/.git`); none `prunable`, `locked` or `detached`.
Lane folders map to worktrees through `worktree.txt`: `jjodel-release` 13, `jjodel-gate` 3, `jjodel-icons` 2,
`jjodel-open` 2, `jjodel-sim` 2, `jjodel-trace` 1, `jjodel-docs` 1 (the separate repository of §2.2). So the lane
set comes from `~/.jjodel-lanes/`, the branch of each lane from `git -C <worktree>`, and `git worktree list`
only tells which lanes live in this repo.

## 8. Proposal (question 7)

### 8.1 The index JSON

Generated on demand, never committed (D3): `npm run trace:index` prints it; the monitor holds it in memory and
serves it at `/index.json`. Shape:

```json
{
  "schema": "jjodel-trace/1",
  "generatedAt": "<ISO>",
  "sources": { "repo": "<trunk tree>", "head": "<sha>", "lanesRoot": "<~/.jjodel-lanes>" },
  "nodes": [ { "type": "<type>", "id": "<id>", "...": "attributes" } ],
  "edges": [ { "type": "<type>", "from": "<type>:<id>", "to": "<type>:<id>", "source": "<file>:<line> | <sha> | <lane file>" } ],
  "misses": [ { "source": "<file>:<line>", "reason": "<why it did not parse>" } ]
}
```

Every edge carries the place it was declared (`source`), so the trace of the trace is one click away; every
item that did not parse is a `miss` with its reason, as `docs-digest.ts` lists every bad header instead of the
first.

### 8.2 Node types (fixed from stage 1)

| Type | Id | Attributes | Source |
|---|---|---|---|
| `lane` | Prompt-ID (folder name) | session, worktree, branch, repo (this / foreign), state running/exited/blocked, exit, outcome (tolerant regex of 1035), runs (count of `system:init`), firstEventAt/lastEventAt (first/last `timestamp`), lastTool {name, at}, costUsd (last `result.total_cost_usd`), model (`init.model`), goahead | `~/.jjodel-lanes/<id>/` |
| `prompt` | Prompt-ID | files[], title, laneKind (fast/full/other, verbatim), statusText, executed, statusSha | header before the first `## `, tolerant id pattern (§4.1) |
| `chat` | C-YYYY-MM-DD-HHmm | — (counts are computed) | prompt `Chat:` |
| `decision` | row id | date, line, section, confidence (`confidence()`), provisional, evidence, verified, reversible, title | `parseRows` |
| `commit` | full sha | short, date, subject, merge, models[] (body lines `^Model:`, not `%(trailers)`), sessions[] (`Claude-Session`) | `git log` on the trunk and on each lane branch |
| `logEntry` | `log:` + first 10 hex of sha1(heading + first field line): stable across fold and rotation, which move entries verbatim | kind task/ticket, date, file, line, outcome, causa, smoke (first word of `Smoke visivo`), priority | `log-tools.ts`, active log, inboxes, archive |
| `check` | `<Prompt-ID>/<file>` | exit (last `EXIT=`), pass, fail (`^PASS`/`^FAIL` counts), end | `probe-*.log` (1035) and legacy `chat_probe*.log` in the lane folder |
| `requirement` | `REQ-<n>` | title, status (written), parent, implemented and verified (computed) | `docs/requirements/REQ-<n>.md` (stage 2; 0 files today) |

### 8.3 Edge types, each declared once in the artifact born later (D2)

| Edge | From → to | Declared in | Parseable today |
|---|---|---|---|
| `runs` | lane → prompt | the lane folder, named by `start` from the header | 24 of 24 folders with a log |
| `openedBy` | prompt → chat | prompt `Chat:` | 73 of 84 |
| `cites` | commit → prompt | subject suffix, else subject, else body | 305 of 401 non-merge |
| `closedBy` | prompt → commit | Status `· <sha>`, written in the closure commit, after the code commit | 69 of 70; the only link for merge prompts (§4.1) |
| `reports` | logEntry → prompt | `Prompt document name` (heading suffix as a cross-check) | 35 of 35 active and inbox; 39 of 47 archive from 09-17 |
| `corrects` | logEntry → prompt | `Corregge` | 7 of 8 |
| `foundIn` | logEntry (ticket) → prompt or chat | `Found in` | 19 of 19 |
| `decidedIn` | decision → prompt, chat or document | row body, else section preamble | 88 of 92 from 09-17 |
| `citesDecision` | commit → decision | decision id in the subject | 43 subjects |
| `measures` | check → lane | the check file's folder | legacy logs in 4 lanes; `probe-*.log` after 1035 |
| `realizes` | prompt → requirement | prompt `Requirement:` (stage 2) | 0 (field absent, §6.1) |
| `parent` | requirement → requirement | `Parent:` in the REQ file (stage 2) | 0 |
| `verifies` | check → requirement | the probe log's header, e.g. `REQ=REQ-<n>` beside `EXIT=` (stage 2, a `--req` option of `lane-run probe`) | 0 |

Computed, never written: every inverse; `prompt.executed`; `lane.branch`; `requirement.implemented` (some prompt
that `realizes` it is executed); `requirement.verified` (some check that `verifies` it has exit 0 and no FAIL,
D5). Not used as a source: commit lists derived from the transcripts (§2.3, 1 lane in 5 without them) and the
`Model:` free text beyond its verbatim value.

### 8.4 The schema of `REQ-<n>.md`

```
# REQ-<n>: <title, one line>

Status: proposed | accepted | retired
Parent: REQ-<m>
Chat: C-YYYY-MM-DD-HHmm
Requested: YYYY-MM-DD

## Statement
<what the system shall do, one paragraph>

## Rationale
<why; Alfonso's request quoted with its date>

## Acceptance
<one mechanically checkable sentence (CLAUDE.md §5), naming the check that measures it>
```

`Parent` is optional and one level deep: the indexer reports a miss when the parent has a parent. `Status` holds
only what a person decides; `implemented` and `verified` are never written (D5, D3). `<n>` is a plain integer,
next free on the trunk; two chats that pick the same `n` meet an add/add conflict at merge.

### 8.5 Stage 1 (Phase 2) file list

More than five files: the Phase 2 prompt lists them (rule 19). All under `frontend/scripts/gates/`, because the
measured includes cover only that folder and `hooks/` (`frontend/vitest.config.ts:16` «`'scripts/gates/__tests__/**/*.test.ts'`»,
`frontend/scripts/tsconfig.json` `"include": ["smoke/**/*.ts", "gates/**/*.ts"]`): no config file changes.

| File | Change |
|---|---|
| `frontend/scripts/gates/trace-index.ts` (new) | pure functions per source plus a CLI printing the index JSON; imports `./docs-digest.ts` and `./log-tools.ts` (`allowImportingTsExtensions` is on) |
| `frontend/scripts/gates/trace-monitor.ts` (new) | `node:http` on 127.0.0.1, `/` one self-contained page, `/index.json`, `/events` SSE; `fs.watch` recursive on the lanes root for structure, a 1 s stat poll with byte offsets for running lanes' logs, a 5 s poll of `git for-each-ref` to re-index the repo sources; `osascript` notification on an `outcome` change, text passed as argv, never interpolated; refuses a used port and 3001; checks the `Host` header |
| `frontend/scripts/gates/__tests__/traceIndex.test.ts` (new) | one fixture per source, including every miss shape of §4 (tolerant id forms, merge commit citing the lane, `Model:` before a blank line, Corregge without a prompt, near-miss decision rows) |
| `frontend/scripts/gates/__tests__/traceMonitor.test.ts` (new) | the server on a temp `HOME` with a fake lane folder: SSE event on growth, on `exit.txt`, on a new folder; port refusals |
| `frontend/scripts/lane-run.mjs` | `monitor [--port <n>] [--no-open]` dispatch: spawn `process.execPath` on `trace-monitor.ts`, open `--app=http://127.0.0.1:<port>/` (Google Chrome, Brave and Edge are installed); usage line. After 1035 merges |
| `frontend/scripts/hooks/__tests__/laneRun.test.ts` | the dispatch and its refusals |
| `frontend/package.json` | one script line, `trace:index` (no dependency) |
| `docs/PROTOCOL.md` P16, `docs/log-inbox/harness.md`, the prompt's Status | the closure commit (one line in P16 if the Phase 2 prompt wants it) |

## 9. Dependencies and risks

- **R1** Sequencing with P-2026-09-27-1035 (§6.2): the check source and the tolerant Outcome regex come from it;
  stage 1 branches after its merge or rebases on it.
- **R2** Lane logs reach 4.5 MB (0120 4507996 bytes, 0225 4560851): read by offset, never whole on each event
  (`lastOutcome`, `lane-run.mjs:257-269`, rereads the whole file on every `status`).
- **R3** The page serves tool inputs and outputs of every lane: bind 127.0.0.1 only, reject a foreign `Host`
  (DNS rebinding), no CORS header.
- **R4** A lane can run in a foreign repository (0030, `~/jjodel-docs`): per-lane `git -C`, and no repo edge for
  it.
- **R5** `started.txt` and `pid.txt` are per run: lane age comes from the first event `timestamp`.
- **R6** `Model:` and `Claude-Session` are free text: the index keeps them verbatim; any normalization is a
  later decision.
- **R7** The tolerant prompt-id forms parse in the indexer and are refused by `lane-run start` (`:51`): harmless
  for the index, worth knowing.

## 10. Commits named by §4.4 [M]

Trunk `alfonso-frontend-jjtl` at `6c69783cf`, non-merge, committed from 2026-09-18 19:40 (the Model rule), oldest
first.

`Model:` written as a body line that git does not parse as a trailer (114):
97a41475e 05e27b483 5fffe7d61 0c7f6b781 c8cdc8efe f8ede528a 34ddaf0c7 19112458f 717b29a64 068d59367 71f7ae0dc
2f8e4de93 aae7401c1 9b3d74857 aafa5648b eac9d8f9b 7f5d8edbc 2b1cc6d05 8aa303ff1 9899f5d23 c66e253fc 20ddf067e
2da08a722 7f16439ff 65c092604 20a13bb29 db43981fd 7bdf5f638 9c173dfce 0889d5a37 e9e536ace 8b3a21b13 1b55d91bf
83229edbd 1b36576fb f5ec4b5fe 30707bfd9 491fc1c4b 8211a9d8a 67290d8f5 577cc52b5 8916f2f08 f2ef6951f 245a171a4
aa9bcfaad 2e291a46a 877d6febc 796458cfa bd7a2e6b0 a8071f907 7cb1a716b 3cded3668 d4d7b6320 e7e47a7f0 951324d29
4bf12ebf9 e993d1b1a e1baa6cf7 80dab51b9 4a014a68f 02794701d 5f17cf4e3 80581e1c7 78ce6c780 81fd7eda5 d9af59d8b
684f81056 d1db82011 7bf984925 d6918f467 de21a2c93 79ee9fba3 0fc65866a 0609e9793 80599fb0f dc383a8b8 5c47e40ec
f530682da 8d6febf5f 982581260 970529931 7abb57eaa 9290c17be fa56c14de 5a398eaee b76d75cc9 f58456c63 172f408c1
a6ab39c82 13ebde1e6 c5a669c2e 3ec3405d5 651f10543 a11224cdb da84b10e5 b5eaadead 723480064 869f204eb 5fcdeaeed
f507d166d b62141aba 0f0e0df6f 0793a8b6d e0103160f d47f3cbb1 39e3c151b 8b5871f29 cc2550779 163fc6b44 5dc09a4ce
bda63a2b3 5060657c5 53c24b1fc 2ce6e4dae

No `Model:` line at all (50):
faa893a77 6001add8b ff68bc862 1f80cb048 9a9f7952b bd56aeace 5642a7d80 c8fbab27c 5c9e88d16 920b84895 45558b815
fbcbcb820 d20d8e42c 400095370 12ae8c41c 6ee6efcd5 971234d94 516afd310 c591cf351 9e8ed93a1 941a94da9 f98e67cb5
70ac9055f 366300c03 603546085 92d180708 ff2c624a1 6c4aee51d 6cdba58cf 5ef0245eb 08e6c05a6 b297b5e11 925cd8d7c
79175e94c d2f80b03f f827970bb b5e977907 c1847aed5 a5a0bcfbf fcc012cc8 6befcd05f c32603067 45b406c8f d15cef944
5fdd3da6a 470c07ee7 e2353e509 7e1c9e8cc 283eab4f2 7b381f70a

No Prompt-ID in subject or body (55):
97a41475e faa893a77 ff68bc862 9a9f7952b bd56aeace 5642a7d80 c8fbab27c 5c9e88d16 920b84895 3de7bef90 095f27cd1
9378e405e eab6eb23f da7a2ff12 05e27b483 62d139fa1 e22ccfe5e 6ee6efcd5 971234d94 eac9d8f9b c66e253fc 516afd310
f98e67cb5 70ac9055f 366300c03 1387967a0 5840e6c8b cae53b658 925cd8d7c 84f29b9c6 dee18d69b e8c4dce6f 49fab2ff8
4d225921a 268e964a0 8f97d4f6f 4d96ba1fb f827970bb b5e977907 f6beda976 b5e109519 3825e41a0 61df6a2ab 5e5f9a8e5
1f3167136 80a9eb9fd 7e1c9e8cc 88fe737b7 320d4afcf cef93648f 52512b2f9 931943f29 9dee5e528 0a8ad4270 5a9727e01

## 11. Files read

`CLAUDE.md`; `docs/PROTOCOL.md`; `docs/HARNESS-DOCS.md` §4.1, §4.2, §7; `docs/decisions.md` (whole, via
`parseRows`, and lines 100-260); `docs/claude-code-log.md` (head, and whole via `splitLog`);
`docs/claude-code-log-archive.md` (via `splitLog`); `docs/log-inbox/*.md`; `docs/digest/README.md`;
`docs/prompts/*.md` (headers of all 462); `docs/prompts/claude_2026-09-27_1030_prompt_trace_monitor_discovery.md`,
`claude_2026-09-27_1035_prompt_lane_run_v2.md`, `claude_2026-09-27_0830_prompt_docs_digest_generator.md`,
`claude_2026-09-27_0051_prompt_research_material_out_of_tree.md` (COSA);
`docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`, `discovery_2026-09-27_sim_profiles_panel.md`
(house style); `frontend/scripts/lane-run.mjs` (whole); `frontend/scripts/gates/docs-digest.ts` (1-80, 175-260,
380-430); `frontend/scripts/gates/log-tools.ts` (1-100, 205-256); `frontend/scripts/hooks/bash-guard.mjs` (lines
with `model`); `frontend/scripts/hooks/__tests__/laneRun.test.ts` (1-30, `HOME` lines);
`frontend/vitest.config.ts`; `frontend/scripts/tsconfig.json`; `frontend/package.json` (script lines);
`~/.jjodel-lanes/**` (listing, small files, five logs parsed, all logs for Outcome).

## 12. Questions

1. Does the Phase 2 prompt branch after the merge of P-2026-09-27-1035, or rebase on it? Recommended: after.
2. Is the Status sha (`closedBy`) kept as an edge, given D2's «declared once»? Recommended: yes, it is a distinct
   link and the only one for merge prompts.
3. Does P-2026-09-27-1035, or a later fast lane, copy every input file into the lane folder (§2.3)?
   Recommended: a fast lane after 1035, three lines in `launch()`.
4. Does the Harness metamodel document enter the repo before stage 3 (RC-10)? Recommended: yes, as the input of
   stage 3's discovery.

## 13. Decisions taken (unattended)

Recommendations for the Phase 2 prompt under RC-25; none amends a ratified row. RC-27 applies to T1 and T6,
which fix data models (the index and a persisted file format): the chat runs the second opinion before adopting.

- **T1.** The index is generated on demand, printed by `npm run trace:index` and held by the monitor; never
  committed.
- **T2.** Indexer and monitor are TypeScript under `frontend/scripts/gates/`, importing `docs-digest.ts` and
  `log-tools.ts` unchanged; they run under the node 26 of P16, which strips types without a flag.
- **T3.** Watching: `fs.watch` recursive for structure, 1 s stat polling with byte offsets for log growth
  (§7.2).
- **T4.** Port 3008 by default, `--port` to change it; refused when in use or 3001; bound to 127.0.0.1 with a
  `Host` check.
- **T5.** Parsers are tolerant where the register is: Prompt-ID with a trailing annotation or a `#`; `Model:`
  read from body lines; Outcome with a suffix; a miss is reported, never fatal.
- **T6.** `REQ-<n>.md` as in §8.4: written `Status` limited to proposed, accepted, retired; implemented and
  verified computed.
- **T7.** Log entry ids from a hash of the heading, stable across fold and rotation.
- **T8.** Notifications through `osascript` with the text as argv.
- **T9.** Stage 3's mapping to the Harness metamodel is deferred until the document is in the repo (RC-10).

## 14. Decisions awaiting Alfonso

None from the RC-26 list: no critical-zone file, no exported interface changed (`Row` and `log-tools.ts` are
imported as they are), no ratified R- row amended, no file or persisted data deleted, nothing the MODELS demo
shows, no change to model, effort or cost of the sessions, no push, no new dependency.
